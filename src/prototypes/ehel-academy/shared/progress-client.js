// ProgressClient — the learner-app side of the Progress Event Contract (P1.4).
// See docs/progress-event-contract.md. One interface, two backends:
//   • local  — pilot: outbox + state live in localStorage (per-device resume)
//   • remote — scale: batches POST to the edge/Moodle ingest, hydrate via GET
// The app calls emit()/hydrate()/flush() identically against either, so moving
// from pilot to scale is a backend swap with zero app changes.
//
// The app never persists progress by hand — it emits contract events and reads
// back a hydrated state document (the shape of GET /progress/{course}).

const CONTRACT = "1.0";

// type → class. The taxonomy is load-bearing: a mis-tagged durable event that a
// filter drops is a real (gradebook-affecting) bug. When unsure, tag durable.
const EVENT_CLASS = {
  "checkpoint.result": "durable",
  "unit.completed": "durable",
  "capstone.submitted": "durable",
  "section.completed": "durable",
  // The tutoring category's finished help session — the record the parent
  // portal reads. Durable: dropping one loses a session a family paid for.
  // (It was first emitted WITHOUT this line, and classOf's ephemeral default
  // silently discarded every one — the exact mis-tag the comment above warns
  // about. An event type must be enrolled here before anything emits it.)
  "tutoring.session": "durable",
  "progress.summary": "state",
  "draft.saved": "state",
  "section.viewed": "ephemeral",
  "media.played": "ephemeral",
  "hint.used": "ephemeral",
  "game.round": "ephemeral",
};
const classOf = (type) => EVENT_CLASS[type] || "ephemeral";

// Small helpers -------------------------------------------------------------
const nowIso = () => new Date().toISOString();
function uid(prefix) {
  const rnd = (globalThis.crypto && crypto.getRandomValues)
    ? [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join("")
    : Math.random().toString(16).slice(2, 18);
  return `${prefix}-${rnd}`;
}
const readJson = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota / private mode */ } };

// Empty hydrate document ----------------------------------------------------
const emptyState = (course, student) => ({ course, student, stateVersion: 0, units: {} });
const emptyUnit = () => ({ sectionsDone: [], resume: null, checkpoints: {}, xp: 0, knownWords: [] });

// Reduce a single event into the local state document (mirrors what the Moodle
// ingest endpoint does server-side, so local and remote resume identically).
function applyEvent(state, ev) {
  const unitId = ev.unit || "_";
  const unit = (state.units[unitId] = state.units[unitId] || emptyUnit());
  switch (ev.type) {
    case "section.completed":
      if (ev.section && !unit.sectionsDone.includes(ev.section)) unit.sectionsDone.push(ev.section);
      break;
    case "checkpoint.result":
      unit.checkpoints[ev.section || "_"] = {
        score: ev.score, passed: !!ev.passed, attempt: ev.attempt || 1,
      };
      break;
    case "unit.completed":
      unit.completed = true;
      break;
    case "capstone.submitted":
      unit.capstone = { artifactRef: ev.artifactRef, rubricSelfScore: ev.rubricSelfScore, at: ev.at };
      break;
    case "progress.summary":
      if (Array.isArray(ev.sectionsDone)) {
        for (const s of ev.sectionsDone) if (!unit.sectionsDone.includes(s)) unit.sectionsDone.push(s);
      }
      if (ev.resume !== undefined) unit.resume = ev.resume;
      if (typeof ev.xp === "number") unit.xp = ev.xp;
      if (Array.isArray(ev.knownWords)) unit.knownWords = ev.knownWords;
      // Written-answer counts, {section: {answered, total}}. Global
      // Perspectives is the only sender: its 315 questions are all self-marked
      // text, so it has no score to report and sends how much was WRITTEN
      // instead. Deliberately not a score and never a pass flag — see
      // attemptedCounts() in shell/subjects/global-perspectives.js.
      //
      // Last-write-wins on the whole object, like xp and knownWords, because
      // the sender always reports every written section it has.
      if (ev.attempted && typeof ev.attempted === "object") unit.attempted = ev.attempted;
      break;
    case "draft.saved":
      unit.drafts = unit.drafts || {};
      unit.drafts[ev.section || "_"] = { text: ev.text, blobRef: ev.blobRef, words: ev.words, at: ev.at };
      break;
    case "tutoring.session":
      // Mirror of the server reducer's case, minus the sanitiser — this state
      // is the learner's own device talking to itself; the server clamps what
      // it is actually sent. Same cap so local resume matches remote.
      unit.tutoringSessions = unit.tutoringSessions || [];
      unit.tutoringSessions.push({
        topic: ev.topic, query: ev.query, stage: ev.stage, unit: ev.unit, unitTitle: ev.unitTitle,
        scored: !!ev.scored, before: ev.before, beforeTotal: ev.beforeTotal,
        after: ev.after, afterTotal: ev.afterTotal, attempted: ev.attempted,
        practiceRight: ev.practiceRight, practiceTotal: ev.practiceTotal,
        startedAt: ev.startedAt, finishedAt: ev.finishedAt, summary: ev.summary,
      });
      if (unit.tutoringSessions.length > 20) unit.tutoringSessions = unit.tutoringSessions.slice(-20);
      break;
    default:
      break; // ephemeral: never persisted to resume state
  }
  state.stateVersion += 1;
  return state;
}

// Backends ------------------------------------------------------------------
// Each backend implements persist(batch) and hydrate(). The local backend keeps
// the reduced state document; the remote backend talks to the ingest/get API.
function localBackend({ course, student }) {
  const stateKey = `ehel-progress:${course}:${student}`;
  return {
    kind: "local",
    async persist(events) {
      const state = readJson(stateKey, emptyState(course, student));
      for (const ev of events) applyEvent(state, ev);
      writeJson(stateKey, state);
      return { accepted: events.length, stateVersion: state.stateVersion, ok: true };
    },
    async hydrate() {
      return readJson(stateKey, emptyState(course, student));
    },
  };
}

function remoteBackend({ course, student, endpoint, token }) {
  const auth = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
  // `_k` is an internal outbox-tracking key — strip it from the wire payload.
  const wire = (events) => events.map(({ _k, ...ev }) => ev);
  return {
    kind: "remote",
    async persist(events, { beacon = false } = {}) {
      const envelope = { contract: CONTRACT, student, course, session: sessionId(), sentAt: nowIso(), events: wire(events) };
      // NOT "/ingest": the common ad-block lists match that path because it is
      // what telemetry SDKs use, so Brave Shields and uBlock Origin refuse the
      // request before it is sent -- ERR_BLOCKED_BY_CLIENT, invisible to the
      // server and to every check that reads it. The gateway accepts both, so
      // this can change without stranding a single already-open tab.
      const url = `${endpoint}/progress/save`;
      if (beacon && navigator.sendBeacon) {
        // Page is unloading — fire-and-forget. The token rides IN the body
        // (sendBeacon cannot set headers) and the content type stays
        // CORS-safelisted (text/plain) so cross-origin beacons deliver without
        // a preflight; the gateway parses the raw body regardless.
        const beaconBody = JSON.stringify({ ...envelope, token });
        navigator.sendBeacon(url, new Blob([beaconBody], { type: "text/plain;charset=UTF-8" }));
        return { accepted: events.length, ok: true, beacon: true };
      }
      const body = JSON.stringify(envelope);
      const r = await fetch(url, { method: "POST", headers: auth(), body, keepalive: true });
      if (!r.ok) {
        const err = new Error(`ingest ${r.status}`);
        // 401/403 is the launch token being expired, revoked or wrong. Unlike a
        // 5xx or a dropped connection, waiting does not fix it: every retry
        // spends a request to be refused identically. Naming it lets the caller
        // stop retrying and tell somebody, instead of queueing for ever in
        // silence while the learner keeps working.
        err.authLost = r.status === 401 || r.status === 403;
        err.status = r.status;
        throw err;
      }
      return r.json();
    },
    async hydrate() {
      const r = await fetch(`${endpoint}/progress/${encodeURIComponent(course)}`, { headers: auth() });
      if (!r.ok) throw new Error(`hydrate ${r.status}`);
      return r.json();
    },
  };
}

let _session;
const sessionId = () => (_session = _session || uid("s"));

// ProgressClient ------------------------------------------------------------
export function createProgressClient(opts) {
  const { course, student, backend = "local", endpoint, token } = opts;
  if (!course || student == null) throw new Error("createProgressClient: course and student are required");
  const impl = backend === "remote"
    ? remoteBackend({ course, student, endpoint, token })
    : localBackend({ course, student });

  const outboxKey = `ehel-progress-outbox:${course}:${student}`;
  let seq = 0;
  let idleTimer = null;
  let flushing = null;
  // Set when a flush is asked for while one is already in flight. See flush().
  let followUp = false;
  // Set once the server refuses our token. Nothing is discarded -- the outbox
  // keeps every event, so a reload with a fresh token still delivers the
  // learner's work -- but we stop spending requests that can only be refused,
  // and we tell the app ONCE so it can tell the learner.
  let authLost = false;
  // Consecutive failed flushes. A blocked or broken write path is INVISIBLE
  // otherwise: the throw is caught, the events queue, and the learner is told
  // nothing while their work stops reaching the school. Worse, the live group
  // board sorts on time since the app last reported, so it renders them as
  // GONE -- a server that receives nothing cannot tell a blocked learner from a
  // closed tab, which is exactly why this has to be said on the learner's own
  // screen instead.
  let failures = 0;
  let deliveryReported = false;
  // Three, not one: a single failed flush is an ordinary blip on a phone
  // moving between cells, and crying wolf at a child mid-lesson is its own
  // harm. Three consecutive means the path is not coming back on its own.
  const FAIL_THRESHOLD = 3;

  const loadOutbox = () => readJson(outboxKey, []);
  const saveOutbox = (q) => writeJson(outboxKey, q);

  // Flush the outbox as one batch (remote backend only). Single-flight: concurrent
  // callers coalesce onto the in-progress flush. On success, remove exactly the
  // sent events by their `_k` from the *current* outbox (which may have grown
  // since the snapshot), so a concurrent emit is never wiped. Idempotent durable
  // ids make retries safe; a batch stays queued until a 200.
  async function flush({ beacon = false } = {}) {
    if (beacon) {
      const queue = loadOutbox();
      if (!queue.length) return { accepted: 0, ok: true };
      const res = await impl.persist(queue, { beacon: true });
      const sent = new Set(queue.map((e) => e._k));
      saveOutbox(loadOutbox().filter((e) => !sent.has(e._k)));
      return res;
    }
    // COALESCE, BUT DO NOT LOSE. The in-flight flush snapshotted the outbox
    // when it started, so anything queued since is NOT in that batch --
    // returning its promise silently strands the newer events. They used to be
    // rescued by the idle timer, but only by luck: if that timer fired during
    // the in-flight window it called flush(), coalesced away to nothing, and
    // cleared itself, leaving the queue with no flush pending and no timer.
    //
    // Rare while only completions flushed. Routine once navigation did, which
    // is how it surfaced: a learner moving quickly between sections had one
    // report land and the next stick until something else happened to flush.
    // The board then showed a section they had already left, intermittently --
    // the hardest kind of wrong to trust.
    if (flushing) { followUp = true; return flushing; }
    // Refused already: the queue is preserved for a reload, but every further
    // attempt would be another request answered 401. The idle timer and the
    // lifecycle beacons both route through here, so one guard covers them all.
    if (authLost) return { accepted: 0, ok: false, authLost: true };
    flushing = (async () => {
      const batch = loadOutbox();
      if (!batch.length) return { accepted: 0, ok: true };
      try {
        const res = await impl.persist(batch);
        const sent = new Set(batch.map((e) => e._k));
        saveOutbox(loadOutbox().filter((e) => !sent.has(e._k)));
        // Recovered. Told only if we had reported a problem, so a learner whose
        // connection wobbled once is never shown a notice they then have to be
        // un-shown.
        failures = 0;
        if (deliveryReported) {
          deliveryReported = false;
          try { opts.onDeliveryRecovered?.(); } catch { /* never break the lesson */ }
        }
        return res;
      } catch (err) {
        if (err && err.authLost && !authLost) {
          authLost = true;
          // Reported once, not per failure: a learner does not need the same
          // sentence every twenty seconds, and the condition does not change
          // until they reload.
          try { opts.onAuthLost?.({ status: err.status, queued: loadOutbox().length }); } catch { /* never break the lesson */ }
        }
        if (!(err && err.authLost)) {
          failures += 1;
          if (failures >= FAIL_THRESHOLD && !deliveryReported) {
            deliveryReported = true;
            try {
              opts.onDeliveryFailing?.({
                consecutive: failures,
                queued: loadOutbox().length,
                // OFFLINE IS A DIFFERENT SENTENCE. A learner on a train has
                // lost nothing and needs no alarm; one whose extension is
                // eating the writes needs to know the school is not seeing
                // their work. Same failure to the code, opposite meaning to a
                // family.
                online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
              });
            } catch { /* never break the lesson */ }
          }
        }
        return { accepted: 0, ok: false, error: String(err), authLost: !!(err && err.authLost) };
      } finally {
        flushing = null;
      }
    })();
    const inflight = flushing;
    // `flushing` is nulled in the IIFE's own finally, so by the time this runs
    // a fresh flush can start. One follow-up per completed flush, and it only
    // fires if something actually asked while we were busy -- so a quiet queue
    // does not loop.
    inflight.then(() => {
      if (followUp) { followUp = false; flush(); }
    }, () => { followUp = false; });
    return inflight;
  }

  // Coalesce onto the PENDING timer rather than restarting it, so the wait is
  // bounded at 20 s from the first unflushed change instead of 20 s from the
  // last one.
  //
  // Restarting it starves exactly the busiest learner: state events now include
  // a navigation (the shell emits a summary when the learner changes section),
  // so a child moving through a unit every fifteen seconds would reset this
  // timer forever and never report at all. That matters beyond a late write,
  // because the live group board's whole sort is "time since this learner's app
  // last reported anything" — under the old semantics the hardest-working
  // learner would have drifted to ALERT while the one who had walked away
  // reported on schedule. The signal would have been not just noisy but
  // inverted.
  //
  // The outbox still batches: every change queued in the interval goes up in
  // one POST, so this bounds latency without multiplying requests.
  function scheduleIdleFlush() {
    if (idleTimer) return;
    idleTimer = setTimeout(() => { idleTimer = null; flush(); }, 20000);
  }

  // emit — stamp and route by class. Ephemeral events are analytics-only: never
  // persisted locally, never queued for Moodle (the edge would sample them). The
  // local backend applies significant events to resume state immediately (no
  // outbox — there is no network to buffer). The remote backend queues them and
  // flushes durable promptly, state on idle.
  function emit(event) {
    const type = event.type;
    const cls = classOf(type);
    const ev = { ...event, type, seq: (seq += 1), at: event.at || nowIso(), _k: uid("k") };
    if (cls === "durable" && !ev.id) ev.id = uid("e");

    if (cls === "ephemeral") { const { _k, ...bare } = ev; return bare; }

    if (impl.kind === "local") {
      const { _k, ...bare } = ev;
      impl.persist([bare]); // synchronous localStorage write; keeps resume live
      return bare;
    }

    const queue = loadOutbox();
    queue.push(ev);
    saveOutbox(queue);
    if (cls === "durable") flush(); else scheduleIdleFlush();
    const { _k, ...bare } = ev;
    return bare;
  }

  async function hydrate() { return impl.hydrate(); }

  // Lifecycle flushes: page-hide sends a beacon (fires on tab close); a soft
  // hide also flushes. Registered once per client.
  function attachLifecycle() {
    if (typeof document === "undefined") return;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush({ beacon: impl.kind === "remote" });
    });
    window.addEventListener("pagehide", () => flush({ beacon: impl.kind === "remote" }));
  }
  attachLifecycle();

  return {
    emit, hydrate, flush, backend: impl.kind, contract: CONTRACT, classOf,
    // True once the server has refused our token. The outbox still holds
    // everything; a reload with a fresh token delivers it.
    get authLost() { return authLost; },
    get queuedCount() { return loadOutbox().length; },
    // True while consecutive flushes are failing for a non-auth reason.
    get deliveryFailing() { return deliveryReported; },
  };
}

export { EVENT_CLASS, classOf, CONTRACT };
