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
      break;
    case "draft.saved":
      unit.drafts = unit.drafts || {};
      unit.drafts[ev.section || "_"] = { text: ev.text, blobRef: ev.blobRef, words: ev.words, at: ev.at };
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
      const url = `${endpoint}/progress/ingest`;
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
      if (!r.ok) throw new Error(`ingest ${r.status}`);
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
    if (flushing) return flushing;
    flushing = (async () => {
      const batch = loadOutbox();
      if (!batch.length) return { accepted: 0, ok: true };
      try {
        const res = await impl.persist(batch);
        const sent = new Set(batch.map((e) => e._k));
        saveOutbox(loadOutbox().filter((e) => !sent.has(e._k)));
        return res;
      } catch (err) {
        return { accepted: 0, ok: false, error: String(err) }; // stays queued for retry
      } finally {
        flushing = null;
      }
    })();
    return flushing;
  }

  function scheduleIdleFlush() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { flush(); }, 20000); // 20 s idle
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

  return { emit, hydrate, flush, backend: impl.kind, contract: CONTRACT, classOf };
}

export { EVENT_CLASS, classOf, CONTRACT };
