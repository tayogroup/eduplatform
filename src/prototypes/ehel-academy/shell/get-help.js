// Shared "Get help with…" page for the course-app shell — the tutoring
// add-on's entry point. A learner using Ehel beside another school starts from
// a PROBLEM ("percentages homework"), not from a course position, and their
// school's sequence may not match ours — so this page searches the whole
// subject by topic and answers "where does Ehel teach this?", grouped around
// the learner's own stage:
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
// This page is a reference surface, not a course step. It emits no progress
// events and its route ("get-help") is appended to the nav by the shell, never
// listed in a subject's sections — so it can neither gate nor count, and
// tutoring activity stays out of course progress (the "separate always"
// decision). The factory pattern matches placement.js/study-plan.js: each
// subject module imports this file and passes its chrome, which is also what
// carries the file into a versioned release — deploy-app-version.js packages
// the shell siblings a subject module imports.

const pad2 = (n) => String(n).padStart(2, "0");

// options:
//   deps()        — late-bound shell services: { $, escapeHtml, icon, pageHeader }
//   subjectKey    — "mathematics" (folder + content-tier name)
//   subjectLabel  — "Mathematics", used in copy
//   param         — the stage query parameter ("stage" / "grade" / "level")
//   stageWord     — "Stage" / "Grade" / "Level"
//   maxStage      — highest stage the subject offers
//   stage()       — the learner's current stage number (late-bound)
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
export function createGetHelp(options) {
  const indexCache = new Map(); // stage -> index | null (null = not offered)
  let showAllStages = false;
  let searchToken = 0;

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
    url.hash = section || "overview";
    return url.href;
  }
  const hrefFor = (stage, unit, section) => (options.hrefFor ? options.hrefFor(stage, unit, section) : defaultHrefFor(stage, unit, section));

  const sectionLabel = (id) => {
    const entry = options.sections().find(([sectionId]) => sectionId === id);
    return entry ? entry[2] : id;
  };

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
  }

  function resultCard(hit, ui) {
    const esc = ui.escapeHtml;
    const overviewHref = hrefFor(hit.stage, hit.unit.unit, "overview");
    // Chips deep-link into the unit's own sections; a subject whose hrefFor
    // lands everything on the overview (English) still shows the topic labels,
    // so the learner knows what to look for once inside.
    const chips = hit.topics.slice(0, 5).map((t) =>
      `<a class="gh-chip" href="${esc(hrefFor(hit.stage, hit.unit.unit, t.section))}">${ui.icon("corner-down-right")}<span>${esc(t.label)}</span><small>${esc(sectionLabel(t.section))}</small></a>`).join("");
    return `<article class="gh-hit">
      <a class="gh-hit-title" href="${esc(overviewHref)}"><strong>${esc(`${options.stageWord} ${hit.stage}`)} · Unit ${hit.unit.unit}:</strong> ${esc(hit.unit.title)} ${ui.icon("arrow-right")}</a>
      ${chips ? `<div class="gh-chips">${chips}</div>` : ""}
    </article>`;
  }

  function resultsHtml(hits, current, ui) {
    if (!hits.length) {
      return `<section class="panel gh-status"><p><strong>No matches${showAllStages ? "" : " nearby"}.</strong> Try a different word — the name your school uses may differ${showAllStages ? "" : `, or widen the search to every ${options.stageWord.toLowerCase()} below`}.</p></section>`;
    }
    const groups = [
      { key: "level", title: `Your level — ${options.stageWord} ${current}`, note: "Where this topic lives in your own course.", filter: (h) => h.stage === current },
      { key: "foundations", title: "Foundations", note: `Earlier ${options.stageWord.toLowerCase()}s that build up to it — start here if it feels shaky.`, filter: (h) => h.stage < current },
      { key: "next", title: "Next steps", note: "The same topic, taken further.", filter: (h) => h.stage > current },
    ];
    return groups.map((group) => {
      const members = hits.filter(group.filter)
        .sort((a, b) => b.score - a.score || Math.abs(a.stage - current) - Math.abs(b.stage - current))
        .slice(0, 8);
      if (!members.length) return "";
      return `<section class="panel">
        <span class="eyebrow">${group.title}</span>
        <p class="gh-note">${group.note}</p>
        ${members.map((hit) => resultCard(hit, ui)).join("")}
      </section>`;
    }).join("") || `<section class="panel gh-status"><p><strong>No matches.</strong></p></section>`;
  }

  function introHtml(ui) {
    const esc = ui.escapeHtml;
    return `<section class="panel">
      <span class="eyebrow">How this works</span>
      <p class="gh-note">Type what you are stuck on — a topic, a word from your homework, anything. Results come from every unit of ${esc(options.subjectLabel)}, grouped as <strong>Foundations</strong> (earlier work that builds up to it), <strong>your level</strong>, and <strong>next steps</strong>.</p>
      <div class="gh-chips">${(options.examples || []).map((example) => `<button class="gh-chip" data-gh-example="${esc(example)}" type="button">${ui.icon("search")}<span>${esc(example)}</span></button>`).join("")}</div>
    </section>`;
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
    .gh-hit-title { display: inline-flex; gap: 6px; align-items: baseline; flex-wrap: wrap; text-decoration: none; color: inherit; font-size: 15px; }
    .gh-hit-title:hover { text-decoration: underline; }
    .gh-hit-title i { width: 15px; height: 15px; align-self: center; }
    .gh-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
    .gh-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border: 1px solid var(--line); border-radius: 99px; background: #fff; color: inherit; text-decoration: none; font-size: 13px; cursor: pointer; }
    .gh-chip:hover { border-color: var(--teal); }
    .gh-chip i { width: 13px; height: 13px; color: var(--teal); }
    .gh-chip small { color: var(--muted); }
    .gh-status p { display: flex; gap: 8px; align-items: center; color: var(--muted); }
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

  return { render };
}
