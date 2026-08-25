// Shared "Get help with…" page for the course-app shell — the tutoring
// add-on's entry point — and the HELP SESSION that runs from its results. A
// learner using Ehel beside another school starts from a PROBLEM ("percentages
// homework"), not from a course position, and their school's sequence may not
// match ours — so this page searches the whole subject by topic and answers
// "where does Ehel teach this?", grouped around the learner's own stage:
//
//   Foundations   — stages below the learner's (rebuild what is missing)
//   Your level    — the learner's own stage
//   Next steps    — stages above (the same topic, taken further)
//
// The window defaults to two stages either side and widens to the whole
// subject on request — a DEFAULT WITH AN OVERRIDE, never a hard cap (owner
// decision 2026-08-24, recorded in CLAUDE.md): the child this product exists
// for is exactly the one whose gap is more than two grades deep.
//
// It searches the per-grade topic-index.json files that build-topic-index.mjs
// derives and check:topic-index gates — the index is the one map from topic to
// {stage, unit, section}, so this page owns no topic knowledge of its own.
// Stages whose index does not exist (Global Perspectives' withdrawn Stage 5, a
// level beyond the subject) 404 and are skipped without comment: the index not
// existing IS the statement that the stage is not offered.
//
// THE HELP SESSION (route "help-session") is the organized walk a result can
// start: quick check → learn → practise → check again → wrap-up, run on the
// target unit's own page from that unit's own items. Its record lives in
// localStorage under the subject's OWN tutoring key — never the course
// progress key, and it emits no progress events, because tutoring must never
// reach the school's gradebook (the "separate always" decision). The wrap-up
// writes a summary a human tutor can be handed, which is the hook the
// book-a-tutor flow will pick up.
//
// Neither route is a course step: the shell appends both nav entries and
// dispatches both routes, and no subject lists them in sections — so they can
// neither gate nor count. The factory pattern matches placement.js /
// study-plan.js: each subject module imports this file and passes its chrome,
// which is also what carries the file into a versioned release —
// deploy-app-version.js packages the shell siblings a SUBJECT module imports,
// which is why the session lives in this file rather than a sibling module
// only this file imports: that sibling would never reach v{TAG}/ and the
// import chain would 404 the whole subject at boot.

const pad2 = (n) => String(n).padStart(2, "0");

// Storage can be unavailable, not merely empty (cross-origin iframe with
// third-party storage blocked throws on the property access) — same guards
// course-app.js carries, for the same reason.
const storageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* session stays in memory this visit */ } };

// --- question pools ----------------------------------------------------------
// One normalizer for both storage shapes: family-A assessments carry an array
// of options and `answer`; English and Intensive English quizzes carry a
// pipe-separated string and `correctAnswer` (the same two shapes the English
// content gate's optionsOf() covers).
const optionsOf = (q) => (Array.isArray(q.options) ? q.options
  : typeof q.options === "string" ? q.options.split("|").map((s) => s.trim()).filter(Boolean) : []);
const norm = (v) => String(v ?? "").trim().toLowerCase();

// Auto-scorable questions: real options with the key among them. Global
// Perspectives' questions are responseMode:"text" with a model answer and no
// options, so they fall out of this pool by shape — which is the point: a
// subject whose quizzes are self-marked gets the attempted-count flow below,
// never a score nobody measured (the same contract the progress reducer
// enforces server-side).
function scorablePool(unit) {
  const raw = [...(unit.assessment?.questions || []), ...(unit.quizzes || [])];
  const out = [];
  for (const q of raw) {
    const options = optionsOf(q);
    const answer = q.answer ?? q.correctAnswer;
    const prompt = q.question || q.prompt;
    if (options.length >= 2 && prompt && answer != null && options.some((o) => norm(o) === norm(answer))) {
      out.push({ id: String(q.id || q.questionId || out.length), prompt: String(prompt), options, answer: String(answer), explanation: String(q.explanation || "") });
    }
  }
  // Sorted for a deterministic split; ids order by difficulty in most packs,
  // so evens/odds spreads both samples across the range.
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
function openPool(unit) {
  return (unit.assessment?.questions || [])
    .filter((q) => (q.prompt || q.question) && (q.modelAnswer || q.answer))
    .map((q, at) => ({ id: String(q.id || at), prompt: String(q.prompt || q.question), model: String(q.modelAnswer || q.answer) }));
}
function practicePool(unit) {
  return (unit.practice || [])
    .filter((p) => typeof p.prompt === "string" && typeof p.answer === "string" && p.prompt && p.answer)
    .map((p, at) => ({ id: String(p.id || at), prompt: p.prompt, answer: p.answer, hint: typeof p.hint === "string" ? p.hint : "" }));
}
// Disjoint deterministic samples: evens for the first check, odds for the
// re-check, so improvement is measured on questions the learner has not seen.
const evens = (pool, n) => pool.filter((_, i) => i % 2 === 0).slice(0, n);
const odds = (pool, n) => pool.filter((_, i) => i % 2 === 1).slice(0, n);

// Teaching sections worth a stop on the learn step, in walk order, each with
// the data that proves the unit actually offers it. Intersected with the
// subject's own section list, so no subject is sent to a page it doesn't have.
const LEARN_ROUTES = [
  ["lesson", (u) => u.concepts?.length || u.explainers?.length],
  ["lecture", (u) => u.media?.lectureVideo || u.unit],
  ["bigideas", (u) => u.bigIdeas?.length],
  ["dictionary", (u) => u.vocabularyGroups?.length],
  ["words", (u) => u.reference?.terms?.length || u.reference?.vocabulary?.length],
  ["reading", (u) => u.readings?.length],
  ["explore", (u) => u.explorations?.length],
  ["visuals", (u) => u.visualModels?.length],
  ["method", (u) => u.methods?.length],
  ["models", (u) => u.models?.length],
  ["code", (u) => u.codeExamples?.length],
  ["examples", (u) => u.workedExamples?.length],
  ["grammar", (u) => u.grammar?.length],
  ["toolkit", (u) => u.toolkit?.length],
];

// options:
//   deps()        — late-bound shell services: { $, escapeHtml, icon, pageHeader }
//   subjectKey    — "mathematics" (folder + content-tier name)
//   subjectLabel  — "Mathematics", used in copy
//   param         — the stage query parameter ("stage" / "grade" / "level")
//   stageWord     — "Stage" / "Grade" / "Level"
//   maxStage      — highest stage the subject offers
//   stage()       — the learner's current stage number (late-bound)
//   course()      — the loaded unit JSON of the OPEN page (late-bound) — what
//                   the session reads its questions from, so the session can
//                   never disagree with the lesson it sits inside
//   sections()    — the subject's section list [[id, icon, label, …], …] —
//                   labels for the topic chips; GP's 4-tuples fit too
//   examples      — 2-3 example searches in the subject's own vocabulary
//   stageDir?(n)  — content folder name; default grade-N (Intensive English
//                   passes level-N, the same exception the uploader carries)
//   hrefFor?(stage, unit, section) — link builder override. English passes one
//                   that lands on the unit OVERVIEW with ?review=1 — its
//                   sections stay chained inside a review visit, so a section
//                   deep-link would draw a padlock; the remediation contract
//                   ("open ONE unit at its overview") is the door that works.
//   sessionHref?(stage, unit) — where "Start a help session" navigates; must
//                   land on #help-session. Default builds it like hrefFor;
//                   English passes its review-door version.
//   orderedUnit   — true for a subject whose sections are chained (English):
//                   the learn and practice steps then NAME the stops instead
//                   of linking them, and point at the overview to walk in order.
//   marketplaceHref?() — late-bound URL of the human-tutor marketplace
//                   (teacher_marketplace.php on the Moodle host, resolved from
//                   the launch's pwsEndpoint origin via wehel.js). Returns ""
//                   when the launch carries no platform origin — local dev, a
//                   direct CDN visit — and the marketplace buttons then simply
//                   do not render, because a root-relative link would 404 on
//                   the CDN origin. The handoff channel is deliberately the
//                   clipboard: the summary is learner performance data, and
//                   this repo's rule is that personal data never rides a URL.
//                   Pasted into the request form's "Learning goals" field it
//                   lands in the tutor's own message thread —
//                   marketplace_enrollment.php already carries it there.
export function createGetHelp(options) {
  const indexCache = new Map(); // stage -> index | null (null = not offered)
  let showAllStages = false;
  let searchToken = 0;
  // Set by the shell after boot (course-app.js). For the TUTORING category the
  // finished session is emitted server-side as a tutoring.session event — the
  // umbrella course's own record, which the parent portal reads. A regular
  // learner's sessions stay in localStorage only: their record must never
  // reach the school's books, and not emitting is how that stays true.
  let shellHooks = null;
  const attachShell = (hooks) => { shellHooks = hooks || null; };

  const stageDir = (n) => (options.stageDir ? options.stageDir(n) : `grade-${n}`);

  // Same two-world resolution as wehel.js :: courseDataRoot — the repo tree in
  // local dev, the content tier once deployed. Kept in step by behaviour (both
  // read the same files); the shapes are small enough that sharing them is not
  // worth a new cross-module dependency for wehel to carry.
  function dataRoot(stage) {
    const marker = "/ehel-academy/";
    const at = location.pathname.indexOf(marker);
    const isLocalDev = ["localhost", "127.0.0.1"].includes(location.hostname);
    if (isLocalDev && at !== -1) {
      return new URL(`${location.pathname.slice(0, at + marker.length)}${options.subjectKey}/${stageDir(stage)}/data/`, location.origin);
    }
    return new URL(`../../content/${options.subjectKey}/g${pad2(stage)}/`, document.baseURI);
  }

  async function loadIndex(stage) {
    if (indexCache.has(stage)) return indexCache.get(stage);
    let index = null;
    try {
      const response = await fetch(new URL("topic-index.json", dataRoot(stage)));
      if (response.ok) index = await response.json();
    } catch { /* offline or absent — the stage simply contributes no results */ }
    indexCache.set(stage, index);
    return index;
  }

  function windowStages() {
    const current = Number(options.stage());
    if (showAllStages) return Array.from({ length: options.maxStage }, (_, i) => i + 1);
    const from = Math.max(1, current - 2);
    const to = Math.min(options.maxStage, current + 2);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }

  function defaultHrefFor(stage, unit, section) {
    const url = new URL(location.href);
    url.searchParams.set(options.param, stage);
    url.searchParams.set("unit", unit);
    // Never inherited: this builder is also used by subjects that know no
    // review marker, and a stale one on the URL would ride along forever.
    url.searchParams.delete("review");
    // Every link this page emits is a targeted visit, not a browse of the
    // whole grade — the shell reads this at boot and opens straight into
    // focus mode (topbar + sidebar hidden), so the destination is just the
    // one topic, not the full course chrome. course-app.js :: init().
    url.searchParams.set("focus", "1");
    url.hash = section || "overview";
    return url.href;
  }
  const hrefFor = (stage, unit, section) => (options.hrefFor ? options.hrefFor(stage, unit, section) : defaultHrefFor(stage, unit, section));
  const sessionHref = (stage, unit) => (options.sessionHref ? options.sessionHref(stage, unit) : defaultHrefFor(stage, unit, "help-session"));

  const sectionLabel = (id) => {
    const entry = options.sections().find(([sectionId]) => sectionId === id);
    return entry ? entry[2] : id;
  };

  // --- the session store -------------------------------------------------------
  // The subject's OWN tutoring key. Deliberately not the course progress key,
  // and nothing here calls emitProgress: tutoring is recorded beside the
  // course, never inside it.
  const STORE_KEY = `ehel-tutoring-${options.subjectKey}-v1`;
  function loadStore() {
    try { return { activeId: null, sessions: [], ...JSON.parse(storageGet(STORE_KEY) || "{}") }; }
    catch { return { activeId: null, sessions: [] }; }
  }
  let store = loadStore();
  function saveStore() {
    store.sessions = store.sessions.slice(-8); // the record is a handoff aid, not an archive
    storageSet(STORE_KEY, JSON.stringify(store));
  }
  const activeSession = () => store.sessions.find((s) => s.id === store.activeId && s.status === "active") || null;
  function sessionHere() {
    const session = activeSession();
    if (!session) return false;
    try {
      const unit = options.course()?.unit?.unitNo;
      return session.target.stage === Number(options.stage()) && unit != null && session.target.unit === Number(unit);
    } catch { return false; }
  }

  function startSession(hit, query) {
    const topic = hit.topics[0] || null;
    const session = {
      id: `hs-${Date.now().toString(36)}`,
      subject: options.subjectKey,
      query: String(query || "").trim(),
      topicLabel: topic ? topic.label : hit.unit.title,
      section: topic ? topic.section : "overview",
      target: { stage: hit.stage, unit: hit.unit.unit, title: hit.unit.title },
      from: { stage: Number(options.stage()) },
      startedAt: new Date().toISOString(),
      check: { answers: {}, submitted: false, score: 0, total: 0, attempted: 0 },
      learn: { done: [], completed: false },
      practice: { marks: {}, completed: false },
      recheck: { answers: {}, submitted: false, score: 0, total: 0, attempted: 0 },
      status: "active",
    };
    store.sessions.push(session);
    store.activeId = session.id;
    saveStore();
    location.href = sessionHref(hit.stage, hit.unit.unit);
  }

  // --- search ----------------------------------------------------------------
  // Prefix matching over the index's lowercase keyword lists, substring over
  // titles. Every query token that matches nothing subtracts, so multi-word
  // queries rank units matching all of it above units matching half of it
  // without ever returning nothing for a good half-match.
  const tokenize = (query) => String(query || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2);

  function scoreUnit(unit, tokens) {
    const title = unit.title.toLowerCase();
    let unitScore = 0;
    const topicScores = new Map();
    for (const token of tokens) {
      let matched = false;
      if (title.includes(token)) { unitScore += 10; matched = true; }
      if (unit.keywords.some((k) => k.startsWith(token))) { unitScore += 4; matched = true; }
      for (const t of unit.topics) {
        const topicScore = t.label.toLowerCase().includes(token) ? 6 : t.keywords.some((k) => k.startsWith(token)) ? 3 : 0;
        if (topicScore) { topicScores.set(t, (topicScores.get(t) || 0) + topicScore); matched = true; }
      }
      if (!matched) unitScore -= 3;
    }
    const topicTotal = [...topicScores.values()].reduce((a, b) => a + b, 0);
    const topics = [...topicScores.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
    return { score: unitScore + topicTotal, topics };
  }

  async function runSearch(query, ui) {
    const tokens = tokenize(query);
    const resultsBox = ui.$("#gh-results");
    if (!resultsBox) return;
    if (!tokens.length) { resultsBox.innerHTML = introHtml(ui); bindIntro(ui); return; }
    const token = ++searchToken;
    resultsBox.innerHTML = `<section class="panel gh-status"><p>${ui.icon("loader-circle")} Searching ${options.subjectLabel}…</p></section>`;
    const stages = windowStages();
    const indexes = await Promise.all(stages.map((stage) => loadIndex(stage)));
    if (token !== searchToken) return; // a newer keystroke owns the box now
    const current = Number(options.stage());
    const hits = [];
    indexes.forEach((index, at) => {
      if (!index) return;
      for (const unit of index.units) {
        const { score, topics } = scoreUnit(unit, tokens);
        if (score > 0) hits.push({ stage: stages[at], unit, score, topics });
      }
    });
    resultsBox.innerHTML = resultsHtml(hits, current, ui);
    bindResults(hits, query, ui);
  }

  function resultCard(hit, at, ui) {
    const esc = ui.escapeHtml;
    const overviewHref = hrefFor(hit.stage, hit.unit.unit, "overview");
    // Chips deep-link into the unit's own sections. English's hrefFor opens
    // that exact section too (its own review-topic exemption), so the label
    // is never just a hint here — worst case, a subject with no such
    // exemption still shows the topic labels, so the learner knows what to
    // look for once inside.
    const chips = hit.topics.slice(0, 5).map((t) =>
      `<a class="gh-chip" href="${esc(hrefFor(hit.stage, hit.unit.unit, t.section))}">${ui.icon("corner-down-right")}<span>${esc(t.label)}</span><small>${esc(sectionLabel(t.section))}</small></a>`).join("");
    // The help session is the targeted path — a focused walk on just this
    // topic, opened in focus mode — so it leads, styled primary and placed
    // first. The unit link and chips still work, for a learner who would
    // rather browse the unit itself; they carry the same focus-mode door.
    return `<article class="gh-hit">
      <p class="gh-hit-heading"><strong>${esc(`${options.stageWord} ${hit.stage}`)} · Unit ${hit.unit.unit}:</strong> ${esc(hit.unit.title)}</p>
      <button class="button primary gh-start" data-gh-start="${at}" type="button">${ui.icon("compass")} <span>Start a help session on this</span></button>
      <a class="gh-hit-browse" href="${esc(overviewHref)}">${ui.icon("arrow-right")} <span>Or open the unit yourself</span></a>
      ${chips ? `<div class="gh-chips">${chips}</div>` : ""}
    </article>`;
  }

  function bindResults(hits, query, ui) {
    for (const button of document.querySelectorAll("[data-gh-start]")) {
      button.addEventListener("click", () => startSession(hits[Number(button.dataset.ghStart)], query));
    }
    bindIntro(ui);
  }

  function resultsHtml(hits, current, ui) {
    if (!hits.length) {
      return `<section class="panel gh-status"><p><strong>No matches${showAllStages ? "" : " nearby"}.</strong> Try a different word — the name your school uses may differ${showAllStages ? "" : `, or widen the search to every ${options.stageWord.toLowerCase()} below`}.</p></section>`;
    }
    // Ranked lists carry their index into bindResults through data-gh-start,
    // so the flattened order here must match the order the cards render in.
    const groups = [
      { title: `Your level — ${options.stageWord} ${current}`, note: "Where this topic lives in your own course.", filter: (h) => h.stage === current },
      { title: "Foundations", note: `Earlier ${options.stageWord.toLowerCase()}s that build up to it — start here if it feels shaky.`, filter: (h) => h.stage < current },
      { title: "Next steps", note: "The same topic, taken further.", filter: (h) => h.stage > current },
    ];
    const ranked = [];
    const sectionsHtml = groups.map((group) => {
      const members = hits.filter(group.filter)
        .sort((a, b) => b.score - a.score || Math.abs(a.stage - current) - Math.abs(b.stage - current))
        .slice(0, 8);
      if (!members.length) return "";
      const cards = members.map((hit) => { ranked.push(hit); return resultCard(hit, ranked.length - 1, ui); }).join("");
      return `<section class="panel">
        <span class="eyebrow">${group.title}</span>
        <p class="gh-note">${group.note}</p>
        ${cards}
      </section>`;
    }).join("");
    hits.length = 0;
    hits.push(...ranked);
    return sectionsHtml || `<section class="panel gh-status"><p><strong>No matches.</strong></p></section>`;
  }

  function resumeCardHtml(ui) {
    const session = activeSession();
    if (!session) return "";
    const esc = ui.escapeHtml;
    return `<section class="panel gh-resume">
      <span class="eyebrow">Session in progress</span>
      <p class="gh-note">You are part-way through a help session on <strong>${esc(session.topicLabel)}</strong> — ${esc(`${options.stageWord} ${session.target.stage}`)} · Unit ${session.target.unit}: ${esc(session.target.title)}.</p>
      <a class="button gold" href="${esc(sessionHref(session.target.stage, session.target.unit))}">Resume the session ${ui.icon("arrow-right")}</a>
    </section>`;
  }

  const marketplaceHref = () => (options.marketplaceHref ? options.marketplaceHref() : "");

  // Finished sessions, newest first — the shelf a parent comes back to when
  // booking a tutor after the fact. Each carries the summary captured at
  // wrap-up; a record from before summaries were stored simply offers no copy.
  function recentSessionsHtml(ui) {
    const finished = store.sessions.filter((s) => s.status === "finished").slice(-4).reverse();
    if (!finished.length) return "";
    const esc = ui.escapeHtml;
    const market = marketplaceHref();
    return `<section class="panel">
      <span class="eyebrow">Recent help sessions</span>
      <p class="gh-note">What was worked on and how it went — copy a summary to share with a tutor when you book one.</p>
      ${finished.map((s) => `<article class="gh-hit">
        <p class="gh-recent-line"><strong>${esc(s.topicLabel)}</strong> — ${esc(`${options.stageWord} ${s.target.stage}`)} · Unit ${s.target.unit}${s.finishedAt ? ` <small>${esc(s.finishedAt.slice(0, 10))}</small>` : ""}</p>
        <div class="gh-actions">
          ${s.summary ? `<button class="button secondary" data-gh-recent-copy="${esc(s.id)}" type="button">${ui.icon("copy")} Copy the summary</button>` : ""}
          ${market ? `<a class="button secondary" href="${esc(market)}" target="_blank" rel="noopener">${ui.icon("users")} Find a tutor</a>` : ""}
        </div>
      </article>`).join("")}
    </section>`;
  }

  function introHtml(ui) {
    const esc = ui.escapeHtml;
    return `${resumeCardHtml(ui)}${recentSessionsHtml(ui)}<section class="panel">
      <span class="eyebrow">How this works</span>
      <p class="gh-note">Type what you are stuck on — a topic, a word from your homework, anything. Results come from every unit of ${esc(options.subjectLabel)}, grouped as <strong>Foundations</strong> (earlier work that builds up to it), <strong>your level</strong>, and <strong>next steps</strong>. <strong>Start a help session</strong> on a result and it walks you through: a quick check, the lesson, practice, then a check again.</p>
      <div class="gh-chips">${(options.examples || []).map((example) => `<button class="gh-chip" data-gh-example="${esc(example)}" type="button">${ui.icon("search")}<span>${esc(example)}</span></button>`).join("")}</div>
    </section>`;
  }

  // Copy with a visible fallback: clipboard access is refusable and refusal
  // is silent, so a denied write opens a prompt holding the same text.
  async function copyText(text, button, doneLabel) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) button.textContent = doneLabel;
    } catch {
      window.prompt("Copy this summary for your tutor:", text);
    }
  }

  function bindIntro(ui) {
    for (const button of document.querySelectorAll("[data-gh-example]")) {
      button.addEventListener("click", () => {
        const input = ui.$("#gh-query");
        input.value = button.dataset.ghExample;
        input.focus();
        runSearch(input.value, ui);
      });
    }
    for (const button of document.querySelectorAll("[data-gh-recent-copy]")) {
      button.addEventListener("click", () => {
        const session = store.sessions.find((s) => s.id === button.dataset.ghRecentCopy);
        if (session?.summary) copyText(session.summary, button, "✓ Copied");
      });
    }
  }

  // Page-scoped styles, emitted with the page rather than added to the shared
  // stylesheet: course-ui.css is the live coupling that staled Intensive
  // English v242 an hour after release, and a page that carries its own few
  // rules cannot do that to five other subjects.
  const STYLE = `<style>
    .gh-search { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .gh-search input { flex: 1 1 260px; min-width: 0; border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; font: inherit; background: #fff; }
    .gh-window { display: flex; align-items: center; gap: 8px; margin-top: 12px; color: var(--muted); font-size: 14px; flex-wrap: wrap; }
    .gh-note { color: var(--muted); font-size: 14px; margin: 4px 0 12px; }
    .gh-hit { padding: 12px 0; border-top: 1px solid var(--line); }
    .gh-hit:first-of-type { border-top: 0; }
    .gh-hit-heading { margin: 0 0 10px; font-size: 15px; }
    .gh-hit-browse { display: inline-flex; gap: 6px; align-items: baseline; flex-wrap: wrap; text-decoration: none; color: var(--muted); font-size: 13px; margin-top: 10px; }
    .gh-hit-browse:hover { text-decoration: underline; }
    .gh-hit-browse i { width: 13px; height: 13px; align-self: center; }
    .gh-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
    .gh-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border: 1px solid var(--line); border-radius: 99px; background: #fff; color: inherit; text-decoration: none; font-size: 13px; cursor: pointer; }
    .gh-chip:hover { border-color: var(--teal); }
    .gh-chip i { width: 13px; height: 13px; color: var(--teal); }
    .gh-chip small { color: var(--muted); }
    .gh-status p { display: flex; gap: 8px; align-items: center; color: var(--muted); }
    .gh-start { width: 100%; justify-content: center; }
    .gh-step { border: 1px solid var(--line); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
    .gh-step-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 13px 15px; background: none; border: 0; text-align: left; font: inherit; cursor: pointer; }
    .gh-step-head[disabled] { cursor: default; color: var(--muted); }
    .gh-step-head i { width: 17px; height: 17px; color: var(--teal); flex: none; }
    .gh-step-head strong { flex: 1; }
    .gh-step-head small { color: var(--muted); }
    .gh-step-body { padding: 0 15px 15px; border-top: 1px solid var(--line); }
    .gh-q { padding: 12px 0; border-bottom: 1px solid var(--line); }
    .gh-q:last-of-type { border-bottom: 0; }
    .gh-q p { margin: 0 0 8px; }
    .gh-q label { display: flex; gap: 8px; align-items: baseline; padding: 5px 0; cursor: pointer; }
    .gh-q .right { color: var(--teal-dark, #0e7490); font-weight: 600; }
    .gh-q .wrong { color: #b3392c; }
    .gh-q textarea { width: 100%; min-height: 64px; border: 1px solid var(--line); border-radius: 8px; padding: 10px; font: inherit; resize: vertical; }
    .gh-model { background: var(--teal-soft, #e6f7f5); border-radius: 8px; padding: 10px 12px; margin-top: 8px; font-size: 14px; }
    .gh-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    .gh-learn-item { display: flex; gap: 10px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--line); }
    .gh-learn-item:last-of-type { border-bottom: 0; }
    .gh-learn-item input { width: 17px; height: 17px; flex: none; }
    .gh-learn-item a { color: inherit; }
    .gh-recent-line { margin: 0; } .gh-recent-line small { color: var(--muted); margin-left: 6px; }
    .gh-score { display: flex; gap: 14px; flex-wrap: wrap; margin: 10px 0; }
    .gh-score span { background: var(--teal-soft, #e6f7f5); border-radius: 10px; padding: 10px 14px; font-size: 14px; }
  </style>`;

  function render() {
    const ui = options.deps();
    const esc = ui.escapeHtml;
    const current = Number(options.stage());
    const from = Math.max(1, current - 2);
    const to = Math.min(options.maxStage, current + 2);
    ui.$("#app").innerHTML = `${STYLE}${ui.pageHeader(
      `${options.stageWord} ${current} · ${esc(options.subjectLabel)}`,
      "Get help with…",
      `Stuck on homework, or on something your school teaches in a different order? Search the whole ${esc(options.subjectLabel)} course and open the exact lesson that teaches it — including the ${options.stageWord.toLowerCase()}s before and after yours.`,
      "Help",
    )}
      <section class="panel">
        <div class="gh-search">
          <input id="gh-query" type="search" placeholder="What are you stuck on? e.g. ${esc((options.examples || [])[0] || "a topic")}" aria-label="Search ${esc(options.subjectLabel)} topics">
          <button class="button primary" id="gh-go" type="button">${ui.icon("search")} <span>Search</span></button>
        </div>
        <div class="gh-window">
          <span>${showAllStages ? `Searching every ${options.stageWord.toLowerCase()} (1–${options.maxStage})` : `Searching ${options.stageWord.toLowerCase()}s ${from}–${to}, around yours`}</span>
          <button class="button secondary" id="gh-widen" type="button">${showAllStages ? `Back to ${options.stageWord.toLowerCase()}s ${from}–${to}` : `Show all ${options.stageWord.toLowerCase()}s`}</button>
        </div>
      </section>
      <div id="gh-results" aria-live="polite">${introHtml(ui)}</div>`;
    const input = ui.$("#gh-query");
    let debounce = null;
    input.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => runSearch(input.value, ui), 250);
    });
    input.addEventListener("keydown", (event) => { if (event.key === "Enter") { clearTimeout(debounce); runSearch(input.value, ui); } });
    ui.$("#gh-go").addEventListener("click", () => { clearTimeout(debounce); runSearch(input.value, ui); });
    ui.$("#gh-widen").addEventListener("click", () => {
      showAllStages = !showAllStages;
      const query = input.value;
      render();
      const nextInput = ui.$("#gh-query");
      nextInput.value = query;
      if (query.trim()) runSearch(query, ui);
      nextInput.focus();
    });
    bindIntro(ui);
  }

  // ==========================================================================
  // The help session page (route "help-session")
  // ==========================================================================

  const STEPS = [
    { id: "check", icon: "list-checks" },
    { id: "learn", icon: "book-open" },
    { id: "practice", icon: "pencil-line" },
    { id: "recheck", icon: "badge-check" },
    { id: "wrap", icon: "flag" },
  ];

  function stepTitle(id, scored) {
    if (id === "check") return scored ? "Quick check" : "Try it first";
    if (id === "learn") return "Learn it";
    if (id === "practice") return "Practise it";
    if (id === "recheck") return scored ? "Check again" : "Try it again";
    return "Wrap up";
  }

  function stepDone(session, id) {
    if (id === "check") return session.check.submitted;
    if (id === "learn") return session.learn.completed;
    if (id === "practice") return session.practice.completed;
    if (id === "recheck") return session.recheck.submitted;
    return session.status === "finished";
  }
  const firstOpenStep = (session) => (STEPS.find((s) => !stepDone(session, s.id)) || STEPS[STEPS.length - 1]).id;

  function learnItems(unit) {
    const available = new Set(options.sections().map(([id]) => id));
    const items = LEARN_ROUTES.filter(([route, has]) => available.has(route) && has(unit))
      .map(([route]) => ({ route, label: sectionLabel(route) }));
    // The session's originating topic names a section — walk starts there.
    const session = activeSession();
    if (session) items.sort((a, b) => (a.route === session.section ? -1 : 0) - (b.route === session.section ? -1 : 0));
    return items;
  }

  function renderSession() {
    const ui = options.deps();
    const esc = ui.escapeHtml;
    const session = activeSession();
    const app = ui.$("#app");
    if (!session) {
      app.innerHTML = `${STYLE}${ui.pageHeader(esc(options.subjectLabel), "Help session", "No help session is running.", "Help")}
        <section class="panel"><p class="gh-note">Start one from a Get help search result — it walks you through a quick check, the lesson, practice and a check again.</p>
        <div class="gh-actions"><button class="button primary" data-gh-nav="get-help" type="button">Open Get help ${ui.icon("arrow-right")}</button></div></section>`;
      bindSessionNav(ui);
      return;
    }
    let unit = null;
    try { unit = options.course(); } catch { unit = null; }
    const here = unit?.unit?.unitNo != null && Number(unit.unit.unitNo) === session.target.unit && Number(options.stage()) === session.target.stage;
    if (!here) {
      app.innerHTML = `${STYLE}${ui.pageHeader(esc(options.subjectLabel), "Help session", "", "Help")}
        <section class="panel"><p class="gh-note">Your session on <strong>${esc(session.topicLabel)}</strong> runs in ${esc(`${options.stageWord} ${session.target.stage}`)} · Unit ${session.target.unit}: ${esc(session.target.title)}.</p>
        <div class="gh-actions"><a class="button gold" href="${esc(sessionHref(session.target.stage, session.target.unit))}">Go to the session ${ui.icon("arrow-right")}</a>
        <button class="button secondary" data-gh-abandon type="button">Stop this session</button></div></section>`;
      bindSessionNav(ui);
      return;
    }

    const scorable = scorablePool(unit);
    const scored = scorable.length >= 6;
    const open = scored ? [] : openPool(unit);
    const checkSet = scored ? evens(scorable, 5) : open.slice(0, 3);
    const recheckSet = scored ? odds(scorable, 5) : open.slice(3, 6);
    const practice = practicePool(unit).slice(0, 3);
    const openStep = session.stepOpen || firstOpenStep(session);

    const stepBody = (id) => {
      if (id === "check" || id === "recheck") {
        const part = session[id === "check" ? "check" : "recheck"];
        const set = id === "check" ? checkSet : recheckSet;
        if (!set.length) return `<p class="gh-note">This unit has no questions for this step — carry on to the next one.</p>
          <div class="gh-actions"><button class="button primary" data-gh-skip="${id}" type="button">Continue ${ui.icon("arrow-right")}</button></div>`;
        if (scored) {
          return `<p class="gh-note">${id === "check" ? "Five quick questions from this unit, before you study — so you can see how far you come." : "Five different questions from the same unit — compare with your first try."}</p>
            ${set.map((q, at) => {
              const picked = part.answers[q.id];
              const markedRight = part.submitted && norm(picked) === norm(q.answer);
              return `<div class="gh-q"><p><strong>${at + 1}.</strong> ${esc(q.prompt)}</p>
                ${q.options.map((option) => `<label><input type="radio" name="gh-${id}-${at}" value="${esc(option)}" ${norm(picked) === norm(option) ? "checked" : ""} ${part.submitted ? "disabled" : ""}><span class="${part.submitted ? (norm(option) === norm(q.answer) ? "right" : norm(picked) === norm(option) ? "wrong" : "") : ""}">${esc(option)}</span></label>`).join("")}
                ${part.submitted && !markedRight && q.explanation ? `<div class="gh-model">${esc(q.explanation)}</div>` : ""}
              </div>`;
            }).join("")}
            ${part.submitted
              ? `<div class="gh-score"><span><strong>${part.score} of ${part.total}</strong> right</span></div><div class="gh-actions"><button class="button primary" data-gh-skip="${id}" type="button">Continue ${ui.icon("arrow-right")}</button></div>`
              : `<div class="gh-actions"><button class="button primary" data-gh-submit="${id}" type="button">Check my answers</button></div>`}`;
        }
        // Open questions: written answer against a model, counted as
        // attempted — never scored, because nothing marks it (the same rule
        // Global Perspectives' own quiz follows).
        return `<p class="gh-note">Write your answer, then compare it with the model. Nobody marks this — the comparing is the learning.</p>
          ${set.map((q, at) => `<div class="gh-q"><p><strong>${at + 1}.</strong> ${esc(q.prompt)}</p>
            <textarea data-gh-open="${id}-${at}" ${part.submitted ? "disabled" : ""}>${esc(part.answers[q.id] || "")}</textarea>
            ${part.submitted ? `<div class="gh-model"><strong>Model answer:</strong> ${esc(q.model)}</div>` : ""}
          </div>`).join("")}
          ${part.submitted
            ? `<div class="gh-score"><span><strong>${part.attempted} of ${set.length}</strong> attempted</span></div><div class="gh-actions"><button class="button primary" data-gh-skip="${id}" type="button">Continue ${ui.icon("arrow-right")}</button></div>`
            : `<div class="gh-actions"><button class="button primary" data-gh-submit-open="${id}" type="button">Show the model answers</button></div>`}`;
      }
      if (id === "learn") {
        const items = learnItems(unit);
        const linky = !options.orderedUnit;
        return `<p class="gh-note">${linky ? "Work through these stops in this unit — tick each one as you finish it. Your topic's stop is first." : `This unit opens from its Overview and is walked in order — the stops below are what you will meet. Tick them off as you go.`}</p>
          ${!linky ? `<div class="gh-actions"><a class="button secondary" href="${esc(hrefFor(session.target.stage, session.target.unit, "overview"))}">Open the unit overview ${ui.icon("arrow-right")}</a></div>` : ""}
          ${items.map((item) => `<div class="gh-learn-item"><input type="checkbox" data-gh-learn="${esc(item.route)}" id="gh-learn-${esc(item.route)}" ${session.learn.done.includes(item.route) ? "checked" : ""} aria-label="Done with ${esc(item.label)}">
            ${linky ? `<a href="#${esc(item.route)}">${esc(item.label)} →</a>` : `<label for="gh-learn-${esc(item.route)}">${esc(item.label)}</label>`}
          </div>`).join("")}
          <div class="gh-actions"><button class="button primary" data-gh-learn-done type="button">I have studied this ${ui.icon("arrow-right")}</button></div>`;
      }
      if (id === "practice") {
        if (!practice.length) {
          return `<p class="gh-note">Practise inside the unit${options.orderedUnit ? " as you walk it in order" : ""} — then come back and carry on.</p>
            <div class="gh-actions"><button class="button primary" data-gh-practice-done type="button">I have practised ${ui.icon("arrow-right")}</button></div>`;
        }
        return `<p class="gh-note">Try each one on paper first, then show the answer and mark yourself honestly.</p>
          ${practice.map((p, at) => {
            const mark = session.practice.marks[p.id];
            const revealed = Boolean(mark) || session.practice[`show-${p.id}`];
            return `<div class="gh-q"><p><strong>${at + 1}.</strong> ${esc(p.prompt)}</p>
              ${revealed ? `<div class="gh-model"><strong>Answer:</strong> ${esc(p.answer)}</div>
                <div class="gh-actions"><button class="button ${mark === "right" ? "gold" : "secondary"}" data-gh-mark="${esc(p.id)}|right" type="button">I got it right</button>
                <button class="button ${mark === "notyet" ? "gold" : "secondary"}" data-gh-mark="${esc(p.id)}|notyet" type="button">Not yet</button></div>`
                : `${p.hint ? `<p class="gh-note">Hint: ${esc(p.hint)}</p>` : ""}<div class="gh-actions"><button class="button secondary" data-gh-show="${esc(p.id)}" type="button">Show the answer</button></div>`}
            </div>`;
          }).join("")}
          <div class="gh-actions"><button class="button primary" data-gh-practice-done type="button">Continue ${ui.icon("arrow-right")}</button></div>`;
      }
      // wrap. Reaching here means the record is complete, so this is where the
      // summary is captured ONTO the session: the Recent sessions shelf reads
      // it long after this unit's data has left memory.
      const summary = tutorSummary(session, { checkSet, recheckSet, scored });
      if (session.summary !== summary) { session.summary = summary; saveStore(); }
      const market = marketplaceHref();
      const practiced = Object.values(session.practice.marks);
      const better = scored && session.recheck.submitted && session.check.submitted && session.recheck.score > session.check.score;
      return `<div class="gh-score">
          ${scored ? `<span>Before: <strong>${session.check.score}/${session.check.total || checkSet.length}</strong></span><span>After: <strong>${session.recheck.score}/${session.recheck.total || recheckSet.length}</strong></span>`
            : `<span>Questions attempted: <strong>${session.check.attempted + session.recheck.attempted}</strong></span>`}
          ${practiced.length ? `<span>Practice: <strong>${practiced.filter((m) => m === "right").length} of ${practiced.length}</strong> right</span>` : ""}
        </div>
        <p class="gh-note">${scored ? (better ? "You improved — that is the whole point. " : "") : ""}Still stuck on part of it? Ask Wehel about exactly that part, or take it to a human tutor — the summary says what you tried and where it is still hard.</p>
        <div class="gh-actions">
          <button class="button primary" data-gh-wehel type="button">${ui.icon("sparkles")} Ask Wehel about this</button>
          ${market ? `<a class="button primary" data-gh-market href="${esc(market)}" target="_blank" rel="noopener">${ui.icon("users")} Find a human tutor</a>` : ""}
          <button class="button secondary" data-gh-copy type="button">${ui.icon("copy")} Copy a summary for a tutor</button>
          <button class="button gold" data-gh-finish type="button">Finish the session ${ui.icon("check")}</button>
        </div>
        ${market ? `<p class="gh-note">Find a human tutor opens the tutor marketplace and copies your summary — paste it into “Learning goals” when you request a tutor, and it reaches them with your request.</p>` : ""}`;
    };

    app.innerHTML = `${STYLE}${ui.pageHeader(
      `${esc(`${options.stageWord} ${session.target.stage}`)} · Unit ${session.target.unit}: ${esc(session.target.title)}`,
      `Help session — ${esc(session.topicLabel)}`,
      `${session.query ? `From your search for “${esc(session.query)}”. ` : ""}A short walk: check what you know, learn it, practise it, check again.`,
      "Help session",
    )}
      ${STEPS.map((step, at) => {
        const done = stepDone(session, step.id);
        const isOpen = openStep === step.id;
        const reachable = done || isOpen || STEPS.slice(0, at).every((s) => stepDone(session, s.id));
        return `<section class="gh-step">
          <button class="gh-step-head" data-gh-step="${step.id}" type="button" ${reachable ? "" : "disabled"}>
            ${ui.icon(done ? "circle-check-big" : step.icon)}<strong>${at + 1}. ${esc(stepTitle(step.id, scored))}</strong>
            <small>${done && step.id !== "wrap" ? "done" : isOpen ? "" : reachable ? "open" : "up next"}</small>
          </button>
          ${isOpen ? `<div class="gh-step-body">${stepBody(step.id)}</div>` : ""}
        </section>`;
      }).join("")}`;
    bindSession(session, { checkSet, recheckSet, practice, scored }, ui);
  }

  function bindSessionNav(ui) {
    document.querySelector("[data-gh-nav]")?.addEventListener("click", () => { location.hash = "get-help"; });
    document.querySelector("[data-gh-abandon]")?.addEventListener("click", () => {
      const session = activeSession();
      if (session) { session.status = "abandoned"; store.activeId = null; saveStore(); }
      renderSession();
    });
  }

  function bindSession(session, sets, ui) {
    const rerender = () => { saveStore(); renderSession(); };
    for (const head of document.querySelectorAll("[data-gh-step]")) {
      head.addEventListener("click", () => { session.stepOpen = head.dataset.ghStep; rerender(); });
    }
    for (const id of ["check", "recheck"]) {
      const set = id === "check" ? sets.checkSet : sets.recheckSet;
      document.querySelector(`[data-gh-submit="${id}"]`)?.addEventListener("click", () => {
        const part = session[id];
        set.forEach((q, at) => {
          const picked = document.querySelector(`input[name="gh-${id}-${at}"]:checked`)?.value;
          if (picked != null) part.answers[q.id] = picked;
        });
        part.total = set.length;
        part.score = set.filter((q) => norm(part.answers[q.id]) === norm(q.answer)).length;
        part.submitted = true;
        session.stepOpen = id; // stay to show the marking
        rerender();
      });
      document.querySelector(`[data-gh-submit-open="${id}"]`)?.addEventListener("click", () => {
        const part = session[id];
        set.forEach((q, at) => {
          const typed = document.querySelector(`[data-gh-open="${id}-${at}"]`)?.value?.trim();
          if (typed) part.answers[q.id] = typed;
        });
        part.attempted = set.filter((q) => part.answers[q.id]).length;
        part.submitted = true;
        session.stepOpen = id;
        rerender();
      });
      document.querySelector(`[data-gh-skip="${id}"]`)?.addEventListener("click", () => {
        session[id].submitted = true;
        session.stepOpen = null;
        rerender();
      });
    }
    for (const box of document.querySelectorAll("[data-gh-learn]")) {
      box.addEventListener("change", () => {
        const route = box.dataset.ghLearn;
        session.learn.done = box.checked ? [...new Set([...session.learn.done, route])] : session.learn.done.filter((r) => r !== route);
        saveStore(); // no re-render: keep the learner's place mid-list
      });
    }
    document.querySelector("[data-gh-learn-done]")?.addEventListener("click", () => { session.learn.completed = true; session.stepOpen = null; rerender(); });
    for (const button of document.querySelectorAll("[data-gh-show]")) {
      button.addEventListener("click", () => { session.practice[`show-${button.dataset.ghShow}`] = true; session.stepOpen = "practice"; rerender(); });
    }
    for (const button of document.querySelectorAll("[data-gh-mark]")) {
      button.addEventListener("click", () => {
        const [id, mark] = button.dataset.ghMark.split("|");
        session.practice.marks[id] = mark;
        session.stepOpen = "practice";
        rerender();
      });
    }
    document.querySelector("[data-gh-practice-done]")?.addEventListener("click", () => { session.practice.completed = true; session.stepOpen = null; rerender(); });
    // The dock button opens the same Wehel chat every page carries; hidden
    // means the drawer is already open, so there is nothing to do.
    document.querySelector("[data-gh-wehel]")?.addEventListener("click", () => {
      const dock = document.querySelector(".wehel-dock-button");
      if (dock && !dock.hidden) dock.click();
    });
    document.querySelector("[data-gh-copy]")?.addEventListener("click", (event) => {
      copyText(tutorSummary(session, sets), event.target.closest("button"), "✓ Copied — paste it to your tutor");
    });
    // The marketplace anchor navigates on its own (target=_blank, so this page
    // and the session survive); the handler only rides the same gesture to put
    // the summary on the clipboard. No prompt fallback here — a dialog would
    // fight the opening tab, and the Copy button beside it still covers a
    // refused clipboard.
    document.querySelector("[data-gh-market]")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(tutorSummary(session, sets)).catch(() => { /* Copy button covers it */ });
    });
    document.querySelector("[data-gh-finish]")?.addEventListener("click", () => {
      session.status = "finished";
      session.finishedAt = new Date().toISOString();
      store.activeId = null;
      saveStore();
      // Tutoring category only — see attachShell. Idempotent server-side by
      // the session id, so a retried click cannot store a second record.
      if (shellHooks?.tutoring && shellHooks.emitEvent) {
        shellHooks.emitEvent({
          type: "tutoring.session", id: session.id, at: session.finishedAt,
          topic: session.topicLabel, query: session.query,
          stage: session.target.stage, unit: session.target.unit, unitTitle: session.target.title,
          scored: sets.scored,
          before: session.check.score, beforeTotal: session.check.total,
          after: session.recheck.score, afterTotal: session.recheck.total,
          attempted: session.check.attempted + session.recheck.attempted,
          practiceRight: Object.values(session.practice.marks).filter((m) => m === "right").length,
          practiceTotal: Object.values(session.practice.marks).length,
          startedAt: session.startedAt, finishedAt: session.finishedAt,
          summary: session.summary || "",
        });
      }
      location.hash = "get-help";
    });
  }

  // The handoff artifact: what a human tutor needs to pick the session up —
  // what was tried, how it went, and where it is still hard. Plain text so it
  // travels through chat and email unharmed.
  function tutorSummary(session, sets) {
    const lines = [
      `Ehel tutoring session — ${options.subjectLabel}`,
      `Topic: ${session.topicLabel}${session.query ? ` (searched for "${session.query}")` : ""}`,
      `Lesson used: ${options.stageWord} ${session.target.stage}, Unit ${session.target.unit}: ${session.target.title}`,
      `Learner's own level: ${options.stageWord} ${session.from.stage}`,
    ];
    if (sets.scored) {
      lines.push(`Quick check before studying: ${session.check.score}/${session.check.total || sets.checkSet.length}`);
      if (session.recheck.submitted) lines.push(`Check after studying: ${session.recheck.score}/${session.recheck.total || sets.recheckSet.length}`);
      const stillWrong = sets.recheckSet.filter((q) => session.recheck.submitted && norm(session.recheck.answers[q.id]) !== norm(q.answer));
      if (stillWrong.length) lines.push(`Still finds hard:`, ...stillWrong.map((q) => `  - ${q.prompt}`));
    } else {
      lines.push(`Questions attempted (self-compared with model answers): ${session.check.attempted + session.recheck.attempted}`);
    }
    const practiced = Object.values(session.practice.marks);
    if (practiced.length) lines.push(`Practice: ${practiced.filter((m) => m === "right").length} of ${practiced.length} self-marked right`);
    lines.push(`Started: ${session.startedAt.slice(0, 16).replace("T", " ")}`);
    return lines.join("\n");
  }

  // What the shell's Wehel dock reads while the learner is on the help-session
  // route (course-app.js :: mountWehelDock's sectionHint/activityHint) — finer
  // than the section id a normal page visit reports, because the SEARCH that
  // started this session named an exact topic ("pronouns"), not just the
  // section it lives in ("Grammar"). Without this, Wehel opened from a help
  // session's wrap-up inferred nothing beyond whichever unit the page loaded —
  // the same way it would for any ordinary in-unit visit — because the route
  // stays "help-session" for the whole walk and never becomes the section id
  // sectionHint's default lookup keys on.
  function sessionHint() {
    const session = activeSession();
    if (!session || !sessionHere()) return null;
    return { id: session.section, label: session.topicLabel, query: session.query };
  }

  return { render, renderSession, sessionHere, attachShell, sessionHint };
}
