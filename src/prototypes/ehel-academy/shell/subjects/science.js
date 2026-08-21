// Science subject module for the unified course-app shell (P1.5).
// Section renderers kept BYTE-FOR-BYTE from science/shared/course-ui.js; the
// scaffolding lives in ../course-app.js. Science and mathematics are structural
// twins, so this differs from the math module only in imports, framework codes,
// section labels, storage keys, and the knownWords summary field.
import { initScienceWebGL } from "../../science/shared/science-webgl.js?v=science-20260801a";
import { unitTopic, scienceDiagram } from "../../science/shared/science-visuals.js?v=science-20260801a";
import { createCourseApp } from "../course-app.js?v=t2";
import { createDeck, deckIcon } from "../deck.js?v=deck-1";
import { createPlacementUnit, placementCallout, placementCourseShell, PREREQ_UNIT } from "../placement.js?v=placement-1";
import { renderStudyPlan, renderUnitStudyPlan } from "../study-plan.js?v=study-plan-2";
import { mountWehelChat, modulesFromSections, outlineFromManifest, unitFetcher } from "../wehel.js?v=wehel-4";

const pad2 = (n) => String(n).padStart(2, "0");

// Prerequisite unit (unit -1): a placement exam over the previous stages,
// rendered by the shared shell/placement.js from placement-exam.json.
const prereqParams = new URLSearchParams(location.search);
const isPrereqUnit = Number(prereqParams.get("unit")) === PREREQ_UNIT;
const prereqStage = (() => {
  const requested = Number(prereqParams.get("stage") || prereqParams.get("grade")
    || document.documentElement.dataset.stage || document.documentElement.dataset.grade || 2);
  return requested >= 1 && requested <= 8 ? requested : 2;
})();
let placementExam;
let placement;

// Shell-provided bindings (populated by bind(ctx)).
let $, $$, escapeHtml, icon, voiceButton, pageHeader, toast, readAlongSpans;
let complete, completeGradeSection, saveProgress, saveGradeProgress, navigate, emitProgress;
let bindVoiceControls, updateVoiceUI, stopVoice, renderNav, unitSectionIds, stageNumber, STAGE_STORAGE_KEY, PROGRESS_UNIT, speakText;
let course, progress, gradeProgress, manifest, gradeCapstone, dataRootUrl;
function bind(ctx) {
  ({ $, $$, escapeHtml, icon, voiceButton, pageHeader, toast, readAlongSpans, complete, completeGradeSection,
     saveProgress, saveGradeProgress, navigate, emitProgress, bindVoiceControls, updateVoiceUI,
     stopVoice, renderNav, unitSectionIds, stageNumber, STAGE_STORAGE_KEY, PROGRESS_UNIT, speakText } = ctx);
  course = ctx.course; progress = ctx.progress; gradeProgress = ctx.gradeProgress;
  manifest = ctx.manifest; gradeCapstone = ctx.gradeCapstone; dataRootUrl = ctx.dataRootUrl;
  if (isPrereqUnit) {
    placement = createPlacementUnit({
      storageKey: `ehel-sci-s${prereqStage}-placement-exam-v1`,
      stageLabel: `Stage ${prereqStage}`,
      stageWord: "Stage",
      frameworkLabel: cambridgeLabel(prereqStage),
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, toast, navigate, complete, emitProgress }),
      exam: () => placementExam,
      hrefForUnit: (stage, unit, route = "overview") => `?stage=${stage ?? prereqStage}&unit=${unit ?? 1}#${route}`,
      defaultUnitHref: (route = "overview") => `?stage=${prereqStage}&unit=1#${route}`,
      tutorHref: () => `?stage=${prereqStage}&unit=1#ai`,
    });
  }
}

// Concept explanations and worked solutions carry the full source prose, with
// paragraphs separated by a blank line. Render one <p> per paragraph so a long
// explainer stays readable; a single escaped <p> would run it all together.
// `readAlong` wraps each sentence in a .rd-line span so a scoped Listen button
// can highlight it as it is spoken. Opt-in rather than always-on: only the
// lesson prose is narrated as a block, and a span nothing ever highlights is
// noise in every other caller's markup.
function richText(value = "", className = "", readAlong = false) {
  const attr = className ? ` class="${className}"` : "";
  return String(value)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p${attr}>${readAlong ? readAlongSpans(part) : escapeHtml(part)}</p>`)
    .join("");
}

// Narration reads the prose straight through, so collapse the paragraph breaks
// into sentence pauses rather than feeding literal newlines to the voice engine.
function spokenText(value = "") {
  return String(value).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).join(" ");
}

function cambridgeFramework(stage) {
  return Number(stage) <= 6
    ? { level: "Cambridge Primary Science", code: "0846" }
    : { level: "Cambridge Lower Secondary Science", code: "0893" };
}
function cambridgeLabel(stage) { const fw = cambridgeFramework(stage); return `${fw.level} ${fw.code} — Stage ${stage}`; }

let assessmentIndex = 0, assessmentScore = 0, assessmentLocked = false;
let activeGameId = null, gameRoundIndex = 0, gameScore = 0, gameLocked = false, gameSelection = [];
let capstoneQuizIndex = 0, capstoneQuizScore = 0, capstoneQuizLocked = false;

const sections = [
  ["overview", "layout-dashboard", "Unit Overview"],
  // Per-unit Study Plan: what the learner does on each day of this
  // unit's calendar weeks, rendered by the shared shell/study-plan.js. A
  // reference page, not a step — in nonCountable, so it never counts toward
  // the unit's 100%. The grade-level plan of the same name lives on the
  // Prerequisite unit; this one plans the unit the learner is inside.
  ["unit-plan", "calendar-days", "Unit Study Plan"],
  // "The Lesson", not "Teacher Lesson". These courses are self-paced, and a
  // learner working alone should not be told the explainer belongs to someone
  // else. Computing and Global Perspectives renamed theirs for that reason;
  // this is the same section and the same argument.
  ["lesson", "book-open", "The Lesson"],
  ["words", "braces", "Science Words"],
  ["explore", "scan-search", "Explore the Concept"],
  ["visuals", "shapes", "Visual Models"],
  ["method", "list-checks", "Learn the Method"],
  ["examples", "copy-check", "Worked Examples"],
  ["guided", "lightbulb", "Guided Practice"],
  ["reference", "book-a", "Quick Reference"],
  ["activities", "blocks", "Experiments"],
  ["games", "gamepad-2", "Games"],
  ["fluency", "star", "Science Fluency"],
  ["problems", "hand-heart", "Solve Real Problems"],
  ["explain", "messages-square", "Explain Your Thinking"],
  ["challenge", "badge-check", "Unit Challenge"],
  ["capstone", "palette", "Stage Capstone"],
  ["capstonequiz", "circle-help", "Capstone Quiz"],
  ["live", "video", "Live Science Class"],
  ["progress", "badge-check", "My Science Progress"]
];

// ===================== the Stage 1 slide deck =====================
// Science meets its youngest learners the way English Grades 1-4 do: one item
// per full-screen slide, a big Listen button, side arrows, dots and swipe,
// instead of a grid of cards or a row of tabs above a panel. The plumbing is
// ../deck.js, shared with English and Mathematics — see the note there.
//
// Only the layout changes. Every field a section showed is still on the slide,
// every completion rule is the grid's, and the sections that already show one
// thing at a time (Fluency, the Unit Challenge, the games) keep their own
// designs — a deck would wrap a second carousel around a single question. Quick
// Reference keeps its tables: it is the one page a learner scans rather than
// works through, and a glossary dealt out one row per slide is worse to use.
//
// DECK_MAX_STAGE is the gate, and it is a stage number rather than a per-section
// flag because nothing about a section decides this — the learner does. Stages
// 1-4 are walked through one item at a time; Stage 5 and up keep the grids,
// where a learner scans a page rather than being led along it. That is the same
// line English draws at Grade 4.
//
// Stage 1 shipped first and alone, and the four stages needed no code beyond
// this number: every unit in Stages 2-4 carries the same fields Stage 1 does, so
// the decks render them unchanged, and every narration clip those stages ask for
// already exists.
const DECK_MAX_STAGE = 4;
const deckStage = () => stageNumber <= DECK_MAX_STAGE;

// ── Both designs, at Stage 1 only ────────────────────────────────────────────
// Stages 1-4 do not choose between the grid and the deck: each section shows the
// original design, then the same content again as slides beneath it. Stages 5-8
// stay grid only. Stage 1 shipped this way first, alone, and 2-4 followed once it
// was confirmed — which is why this reads as its own name rather than deckStage()
// even though the two now cover the same stages. They answer different questions:
// deckStage() is "is there a deck here at all", BOTH_DESIGNS is "is the grid
// above it". Keep them separate, or dropping one design later means untangling
// which of the two a given call site meant.
const BOTH_DESIGNS = () => stageNumber <= DECK_MAX_STAGE;

// Where the original renderers draw, and where the deck mounts, when both share a
// page. Both are null everywhere else, and classicScope() falls back to the
// document and the real #app when they are — so a grid renderer behaves exactly
// as it did before at every stage that does not use this. Cleared in onBeforeRender.
let classicRegion = null;
// Published by renderScienceWordsDeck while both designs are mounted, cleared in
// onBeforeRender with classicRegion. At the stages that show the word LIST and
// the word DECK together, picking a word in the list moved the list alone and
// left the deck on the previous word. Same one-way wiring reported in English.
let showScienceWordInDeck = null;
let deckMount = null;
// `$("#app")` resolves to the region rather than the page. That one mapping is
// what lets the ten grid renderers move into a half-page untouched: they keep
// writing `$("#app").innerHTML = …` and keep querying with $ / $$, and both now
// mean "my half". Rewriting those statements instead was tried and mangled the
// template literals they are built from.
function classicScope() {
  const region = classicRegion;
  const scope = region || document;
  return {
    $: (selector) => (selector === "#app" ? (region || document.querySelector("#app")) : scope.querySelector(selector)),
    $$: (selector) => [...scope.querySelectorAll(selector)],
  };
}

function renderBothDesigns(classic, deck, intro) {
  $("#app").innerHTML = `<div class="both-designs">
      <div class="classic-design" id="classic-design"></div>
      <section class="deck-design">
        <div class="deck-design-head"><span class="eyebrow">Slides</span><p>${escapeHtml(intro)}</p></div>
        <div id="deck-design"></div>
      </section>
    </div>`;
  classicRegion = $("#classic-design");
  classic();
  // classicRegion stays set past this point on purpose: a grid renderer's redraw
  // closures run later, on the learner's clicks, and must still find the region.
  // Clearing it here would send that repaint to #app and wipe both designs.
  deckMount = "#deck-design";
  deck();
  deckMount = null;
}


// Science never loads the lucide runtime (it is one of the four shell-voice
// subjects), so the deck draws inline SVG. The subject helpers are passed as
// wrappers, not values: bind(ctx) fills them in after this module is evaluated.
const { mountDeck: baseMountDeck, deckFinish } = createDeck({
  $: (selector, root) => $(selector, root),
  escapeHtml: (value) => escapeHtml(value),
  icon: deckIcon,
  // A slide change silences the narration the previous slide started.
  stopAudio: () => stopVoice(),
  // Scoped to what actually changed: a one-slide redraw must not re-initialise
  // the WebGL models on the slides either side of it, which would leave two
  // animation loops running on one canvas.
  afterPaint: (scope) => { bindVoiceControls(); updateVoiceUI(); initScienceWebGL(scope); },
});

// Mounted into #app owning the screen by default; into the both-designs region,
// with full-bleed off, when the grid is sitting above it. `fullBleed` is what
// stops the deck adding body.gc-full, which would hide the topbar and stretch
// the page the grid is still in.
const mountDeck = (options) => baseMountDeck(deckMount ? { ...options, mount: deckMount, fullBleed: false } : options);

// A deck slide draws its diagram flat whenever the grid is above it.
//
// Both halves render every item at once — a deck puts all its slides in the DOM
// together, not just the visible one — so an interactive deck built a second
// live WebGL context for a model the grid had already built. That peaked at
// twelve contexts on one page in eleven of the twenty-four Stage 1-4 units
// (Stage 2 Unit 1's lesson was measured at eight: four classic, four deck).
// Desktop Chrome allows about sixteen per page and mobile GPUs commonly eight,
// and the second copy shows the learner nothing the first does not. Computing
// draws its deck diagrams flat for exactly this reason.
//
// Gated on BOTH_DESIGNS() rather than hard-coded, so a deck that ever stands
// alone keeps the interactive model instead of silently losing it.
const deckDiagram = (topic, index) => scienceDiagram(topic, index, { interactive: !BOTH_DESIGNS() });

// The deck's own Listen button: the shell's voiceButton renders a `.button
// secondary` with a lucide glyph that never draws here. Same contract —
// data-speak, bound by bindVoiceControls, marked .is-playing while it speaks —
// in the deck's shape and size.
//
// The text is passed through untouched, exactly as voiceButton passes it. Every
// narration clip is looked up by cyrb53 of this string, so a deck button that
// normalised its text even slightly would ask for a file that was never
// generated and fall back to the paid runtime voice. Callers therefore hand
// these the SAME expressions the grid renderers hand voiceButton, and the two
// designs resolve to the same pre-rendered clip.
function deckVoice(text, label = "Listen", readAlong = "", scope = "") {
  return `<button class="gc-btn play" type="button" data-speak="${escapeHtml(text)}"${readAlong ? ` data-readalong="${escapeHtml(readAlong)}"` : ""}${scope ? ` data-readalong-scope="${escapeHtml(scope)}"` : ""} aria-label="${escapeHtml(label)}">${deckIcon("volume-2")} ${escapeHtml(label)}</button>`;
}
function deckVoiceSmall(text, label = "Listen") {
  return `<button class="gc-btn ghost small" type="button" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(label)}">${deckIcon("volume-2")} ${escapeHtml(label)}</button>`;
}

// Answer checking is one rule, in one place, for both designs and both halves.
//
// That sentence was written before it was true. Discovery, the explorations and
// Real Problems were moved onto this function; Guided Practice kept its own copy
// of the old rule in BOTH designs, and so did the Fluency sprint. Three sites,
// 1,272 answers — every practice and every fluency item in the course — went on
// accepting a single character while the function that fixed it sat in the same
// file. Writing "one rule, in one place" is not the same as having one, and the
// grep that proves it costs a second: there must be no `includes(response)` or
// `includes(expected)` anywhere below.
//
// The grids' rule was "a response counts when it matches the reviewed answer, or
// either contains the other", and the deck copied it faithfully. Raw substring
// containment is what made it wrong: every expected answer in this course is a
// model paragraph — 545 of them, median 36 words — so `answer.includes(given)`
// was true for very nearly any keystroke. "a" scored correct against "water",
// "e" against "the seed germinates", "s" against "photosynthesis".
//
// What replaces it keeps the generosity the old rule was reaching for — a
// learner who types a short true answer against a long model answer still earns
// it — but requires the overlap to be a real content word rather than a
// character that happens to appear. A response offering no content word cannot
// match at all, however long it is.
const CHECK_FILLER = new Set([
  "and", "are", "but", "can", "did", "does", "for", "from", "had", "has", "have",
  "how", "into", "its", "may", "not", "now", "one", "our", "out", "own", "see",
  "some", "such", "than", "that", "the", "their", "them", "then", "there",
  "these", "they", "this", "those", "use", "using", "very", "was", "were",
  "what", "when", "which", "while", "who", "why", "will", "with", "you", "your",
]);

// The tokens worth matching on: three characters or more, and not filler.
// Anything shorter is a keystroke rather than evidence the learner knew this.
const contentWords = (text) => String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !CHECK_FILLER.has(word));

const normaliseResponse = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

function answerMatches(response, expected) {
  const given = normaliseResponse(response);
  const answer = normaliseResponse(expected);
  if (!given || !answer) return false;
  if (given === answer) return true;
  const answerWords = new Set(contentWords(answer));
  const givenWords = contentWords(given);
  // An answer carrying no content word of its own can only be met exactly; a
  // response carrying none has offered nothing to check.
  if (!answerWords.size || !givenWords.length) return false;
  return givenWords.some((word) => answerWords.has(word));
}

// A key idea counts as addressed when the explanation uses one of ITS content
// words. The old test asked whether the text contained any token of the idea
// longer than two characters, as a raw substring — so "the" matched, and
// "i do not know the answer at all really honestly" was accepted as scientific
// evidence on any prompt whose ideas contained the word "the".
const reasoningHits = (keyIdeas, text) => {
  const said = new Set(contentWords(text));
  return (keyIdeas || []).filter((idea) => contentWords(idea).some((word) => said.has(word))).length;
};

// Quiz options are dealt in a random order. Authored order is not neutral here:
// across the 636 questions in this course the second option is the answer 287
// times and the fourth only 17, so a learner who always picked the second scored
// 45% against 25% for chance and could learn never to pick the last. Reshuffling
// on every draw also makes a retry a fresh test rather than a remembered
// sequence of positions.
//
// The answer is compared by VALUE — data-option against item.answer — never by
// index, so dealing a copy changes what the learner sees and nothing else. No
// narration clip covers an option (only the question is spoken), so no
// pre-rendered audio moves.
function shuffled(list) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const feedbackHtml = (tone, note, body) => `<p class="feedback ${tone}"><span class="status-note">${escapeHtml(note)}</span> ${escapeHtml(body)}</p>`;

// Feedback is written into the slide's own box rather than by repainting the
// slide: a repaint would throw away the answer the learner just typed, and on a
// slide carrying a WebGL model it would also swap the canvas out from under a
// running animation loop.
const setSlideBox = (key, html) => { const box = $(`[data-feedback="${CSS.escape(key)}"]`); if (box) box.innerHTML = html; };
const slideValue = (key) => ($(`[data-response="${CSS.escape(key)}"]`)?.value || "").trim();

// ===================== section renderers (verbatim) =====================
function renderOverview() {
  $("#app").innerHTML = `${pageHeader(`${(course.stage || course.grade).label} · ${course.term.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, course.unit.unitOverview)}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner math-banner"><div class="banner-copy"><span>Your science journey</span><h2>Explore ${escapeHtml(course.unit.unitTitle)}</h2><p>Discover the ideas in familiar situations, model them, learn reliable methods, practise with support and explain your thinking.</p><button class="button gold" data-go="lesson" type="button">▶ Start the lesson</button></div></section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome, index) => `<div class="outcome"><span>${index + 1}</span><p>${escapeHtml(outcome)}</p></div>`).join("")}</div></section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">${escapeHtml(cambridgeFramework(stageNumber).level)} ${cambridgeFramework(stageNumber).code}</span><h3>Aligned to ${escapeHtml(cambridgeLabel(stageNumber))}</h3><p>Unit ${course.unit.unitNo} is structured from the ${escapeHtml(cambridgeLabel(stageNumber))} content package. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.concepts.length}</strong><small>concepts</small></div><div class="stat"><strong>${course.practice.length}</strong><small>practice items</small></div><div class="stat"><strong>${course.activities.length}</strong><small>activities</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list"><li><span>1</span><span>Discover and model the concept.</span></li><li><span>2</span><span>Learn the method and study examples.</span></li><li><span>3</span><span>Practise with hints, games and fluency.</span></li><li><span>4</span><span>Solve real problems and explain your reasoning.</span></li><li><span>5</span><span>Complete the Unit Challenge and reflect.</span></li></ol></section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have completed ${progress.completed.length} learning steps on this device.` : "Your progress will save on this device as you learn."}</p><button class="button primary" data-go="${progress.completed.includes("lesson") ? "ai" : "lesson"}" type="button">Continue →</button></section>
        ${placementCallout({ escapeHtml, storageKey: `ehel-sci-s${stageNumber}-placement-exam-v1`, stageLabel: `Stage ${stageNumber}`, href: `?stage=${stageNumber}&unit=-1#placement`, unitNo: course.unit.unitNo })}
      </div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderScienceWords() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderScienceWordsClassic, renderScienceWordsDeck, "The same words, one at a time.");
  if (deckStage()) return renderScienceWordsDeck();
  return renderScienceWordsClassic();
}

function renderScienceWordsClassic() {
  const { $, $$ } = classicScope();
  // Rich vocabulary lab: searchable word list + a detail card with meaning,
  // a source example sentence, audio and a learned toggle.
  const vocab = (course.reference.vocabulary && course.reference.vocabulary.length)
    ? course.reference.vocabulary
    : (course.reference.terms || []).map(([term, meaning]) => ({ term, meaning, example: "", letter: (term[0] || "?").toUpperCase() }));
  if (!vocab.length) { $("#app").innerHTML = `${pageHeader("Language for science", "Science Words", "No key words were provided for this unit.")}`; return; }
  const known = new Set(progress.knownWords || []);
  let query = "";
  let activeIndex = 0;
  const idFor = (index) => `w${index}`;

  const draw = () => {
    const filtered = vocab.map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !query || `${entry.term} ${entry.meaning}`.toLowerCase().includes(query));
    if (!filtered.some(({ index }) => index === activeIndex) && filtered.length) activeIndex = filtered[0].index;
    const current = vocab[activeIndex];
    $("#app").innerHTML = `${pageHeader("Language for science", "Science Words", `Learn and explore the key words for ${escapeHtml(course.unit.unitTitle)}. ${known.size} of ${vocab.length} marked learned.`)}
      <div class="dictionary-layout">
        <section class="panel word-list">
          <label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search science words" value="${escapeHtml(query)}"></label>
          <div id="word-rows">${filtered.length ? filtered.map(({ entry, index }) => `<button class="word-row ${index === activeIndex ? "active" : ""}" data-word="${index}" type="button"><span><strong>${escapeHtml(entry.term)}</strong><small>${escapeHtml(entry.meaning.slice(0, 46))}${entry.meaning.length > 46 ? "…" : ""}</small></span>${known.has(idFor(index)) ? "<span>LEARNED</span>" : ""}</button>`).join("") : `<div class="empty">No matching words found.</div>`}</div>
        </section>
        <section class="panel word-card" id="word-card">
          <div class="word-card-head"><div><span class="word-type">Science word</span><h2>${escapeHtml(current.term)}</h2></div><button class="icon-button" id="listen-word" type="button" title="Listen" aria-label="Listen to ${escapeHtml(current.term)}">♪</button></div>
          <p class="meaning"><span class="field-label">Meaning:</span> ${escapeHtml(current.meaning)}</p>
          ${current.example ? `<div class="sentence-card"><small>Used in the lesson</small><p>“${escapeHtml(current.example)}”</p>${voiceButton(current.example, "Hear the example")}</div>` : ""}
          <div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="Write your own sentence using ${escapeHtml(current.term.toLowerCase())}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div>
          <div id="word-feedback"></div>
          <button class="button secondary" id="know-word" type="button">${known.has(idFor(activeIndex)) ? "✓ Learned" : "＋ I know this word"}</button>
        </section>
      </div>
      <p style="margin-top:16px"><button class="button primary" id="words-done" type="button">I explored the science words ✓</button></p>`;
    const search = $("#word-search");
    search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); const pos = search.selectionStart; draw(); const s = $("#word-search"); s.focus(); s.setSelectionRange(pos, pos); });
    $$('[data-word]').forEach((button) => button.addEventListener("click", () => { activeIndex = Number(button.dataset.word); draw(); showScienceWordInDeck?.(activeIndex); }));
    $("#listen-word").addEventListener("click", (event) => speakText(`${current.term}. ${current.meaning}`, event.currentTarget));
    $("#check-word-sentence").addEventListener("click", () => {
      const written = $("#word-sentence").value.trim().toLowerCase();
      const head = current.term.toLowerCase().split(/[\/,]/)[0].trim();
      const ok = written.length > 10 && written.includes(head.split(" ")[0]);
      $("#word-feedback").innerHTML = `<p class="feedback ${ok ? "good" : "try"}"><span class="status-note">${ok ? "Great sentence!" : "Try again."}</span> ${ok ? "You used the word in a full idea." : `Write a full sentence that uses “${escapeHtml(current.term)}”.`}</p>`;
    });
    $("#know-word").addEventListener("click", () => {
      const id = idFor(activeIndex);
      if (known.has(id)) known.delete(id); else known.add(id);
      progress.knownWords = [...known]; saveProgress();
      if (known.size === vocab.length) complete("words", "All science words learned.");
      draw();
    });
    $("#words-done").addEventListener("click", () => { complete("words", "Science words explored."); navigate("explore"); });
  };
  draw();
}

// Science Words as a deck: one word per vivid slide, on the design English
// vocabulary uses. Everything the two-column lab showed is preserved — the word,
// its meaning, the sentence it appeared in with its own audio, write-your-own
// and the learned toggle — only the layout changes.
//
// The search comes with it and narrows the deck itself, sitting under the dots
// where the full-bleed rules leave room for it (.gc-top is hidden there).
//
// Learned marks stay keyed by the word's position in the UNFILTERED list, which
// is what `w${index}` has always meant and what a learner's saved progress
// already holds — so a filtered deck must carry each word's real index with it,
// not its position on screen.
function renderScienceWordsDeck() {
  const esc = escapeHtml;
  const vocab = (course.reference.vocabulary && course.reference.vocabulary.length)
    ? course.reference.vocabulary
    : (course.reference.terms || []).map(([term, meaning]) => ({ term, meaning, example: "", letter: (term[0] || "?").toUpperCase() }));
  if (!vocab.length) { $("#app").innerHTML = `${pageHeader("Language for science", "Science Words", "No key words were provided for this unit.")}`; return; }
  const known = new Set(progress.knownWords || []);
  const idFor = (index) => `w${index}`;
  const entries = vocab.map((current, index) => ({ current, index }));
  let shown = entries;

  // `current` is the word on the slide. The name is load-bearing: the narration
  // gate reads these argument expressions out of this file and matches them
  // against the generator's, so `${current.term}. ${current.meaning}` and
  // `current.example` are the two texts a science word has clips for.
  const wordSlide = ({ current, index }, position) => `<section class="gc-slide gc-v${position % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Word ${position + 1} of ${shown.length} · Science word</span>
      <div class="gc-pattern" lang="en">${esc(current.term)}</div>
      <p class="gc-lead">${esc(current.meaning)}</p>
      <div class="gc-actions">${deckVoice(`${current.term}. ${current.meaning}`, `Listen to ${current.term}`)}</div>
      ${current.example ? `<div class="wc-sentence">
        <small>Used in the lesson</small>
        <p>“${esc(current.example)}”</p>
        <div class="wc-sentence-controls">${deckVoiceSmall(current.example, "Hear the example")}</div>
      </div>` : ""}
      <details class="gc-practice"><summary>Write your own sentence</summary>
        <div class="practice-box"><input data-response="word-${index}" maxlength="180" placeholder="Write your own sentence using ${esc(current.term.toLowerCase())}…" aria-label="Write your own sentence"><button class="gc-btn small" type="button" data-check-word="${index}">Check sentence</button></div>
        <div data-feedback="word-${index}" role="status" aria-live="polite" aria-atomic="true"></div>
      </details>
      <button class="gc-btn ${known.has(idFor(index)) ? "done" : "ghost"}" type="button" data-know="${index}">${known.has(idFor(index)) ? "✓ Learned" : "＋ I know this word"}</button>
      ${position === shown.length - 1 ? deckFinish("words", "I explored the science words") : ""}
    </div></section>`;

  const redrawWord = (index) => {
    const position = shown.findIndex((entry) => entry.index === index);
    if (position >= 0) deck.redrawSlide(position, wordSlide(shown[position], position));
  };

  const deck = mountDeck({
    heading: "Language for science",
    label: "Word",
    emptyMessage: "No matching words. Clear the search to see them all.",
    tools: `<div class="wc-tools">
        <label class="search-box"><input id="sci-deck-search" type="search" placeholder="Search words or meanings" aria-label="Search science words"></label>
        <span class="status-chip" id="wc-known">${known.size} of ${vocab.length} learned</span>
      </div>`,
    onClick: (event) => {
      const target = event.target.closest("[data-check-word], [data-know], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.deckFinish) { complete("words", "Science words explored."); return navigate("explore"); }
      const index = Number(target.dataset.checkWord ?? target.dataset.know);
      const current = vocab[index];
      if (target.dataset.checkWord !== undefined) {
        const written = slideValue(`word-${index}`).toLowerCase();
        const head = current.term.toLowerCase().split(/[\/,]/)[0].trim();
        const ok = written.length > 10 && written.includes(head.split(" ")[0]);
        setSlideBox(`word-${index}`, `<p class="feedback ${ok ? "good" : "try"}"><span class="status-note">${ok ? "Great sentence!" : "Try again."}</span> ${ok ? "You used the word in a full idea." : `Write a full sentence that uses “${esc(current.term)}”.`}</p>`);
        return undefined;
      }
      const id = idFor(index);
      if (known.has(id)) known.delete(id); else known.add(id);
      progress.knownWords = [...known]; saveProgress();
      if (known.size === vocab.length) complete("words", "All science words learned.");
      const counter = $("#wc-known");
      if (counter) counter.textContent = `${known.size} of ${vocab.length} learned`;
      redrawWord(index);
      return undefined;
    },
  });

  const drawDeck = () => {
    const query = ($("#sci-deck-search")?.value || "").trim().toLowerCase();
    shown = query ? entries.filter(({ current }) => `${current.term} ${current.meaning}`.toLowerCase().includes(query)) : entries;
    deck.setSlides(shown.map(wordSlide));
  };
  // Re-decking replaces the track, not the tools row, so the search keeps focus
  // and the caret where the learner left it — no selection restore needed.
  $("#sci-deck-search").addEventListener("input", drawDeck);
  // Against `shown` at click time: this deck has its own search, separate from
  // the list's, so a word's position moves under it. A word filtered out of the
  // deck leaves it where the learner put it.
  showScienceWordInDeck = (index) => {
    const position = shown.findIndex((entry) => entry.index === index);
    if (position >= 0) deck.goTo(position);
  };
  drawDeck();
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderExploreConcept() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderExploreConceptClassic, renderExploreConceptDeck, "The same discoveries, one at a time.");
  if (deckStage()) return renderExploreConceptDeck();
  return renderExploreConceptClassic();
}

function renderExploreConceptClassic() {
  const { $, $$ } = classicScope();
  let active = 0;
  const completed = new Set(progress.explorations || []);
  const draw = () => {
    const item = course.explorations[active];
    $("#app").innerHTML = `${pageHeader("Familiar discoveries", "Explore the Concept", "Discover each idea through a labelled model and a real investigation you can try.")}
      <div class="exploration-tabs">${course.explorations.map((entry,index)=>`<button class="exploration-tab ${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-exploration="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.title)}</button>`).join("")}</div>
      <div class="story-layout"><section class="panel story-scene"><span class="eyebrow">Discovery ${active+1} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.title)}</h2>${scienceDiagram(courseTopic(), active)}<p>${escapeHtml(item.context)}</p>${voiceButton(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}<div class="discovery-model ${escapeHtml(item.modelType)}"><strong>${escapeHtml(item.modelType.replaceAll('-',' '))}</strong><span>${escapeHtml(item.explanation)}</span></div></section><aside class="section-stack"><section class="panel"><h3>Discovery question</h3><p>${escapeHtml(item.prompt)}</p>${voiceButton(item.prompt, "Listen to question")}<input id="discovery-answer" class="math-input" aria-label="Discovery answer"><div class="question-actions"><button class="button primary" id="check-discovery" type="button">Check my idea</button><button class="button secondary" id="hint-discovery" type="button">Hint</button></div><div id="discovery-feedback"></div></section><section class="panel"><h3>Progress</h3><p><strong>${completed.size} of ${course.explorations.length}</strong> discoveries complete.</p><div class="progress-track"><span style="width:${completed.size/course.explorations.length*100}%"></span></div></section></aside></div>`;
    initScienceWebGL($("#app"));
    $$('[data-exploration]').forEach(button=>button.addEventListener("click",()=>{active=Number(button.dataset.exploration);draw();}));
    $("#hint-discovery").addEventListener("click",()=>{$("#discovery-feedback").innerHTML=`<p class="feedback try"><span class="field-label">Hint:</span> ${escapeHtml(item.hint)}</p>`;});
    $("#check-discovery").addEventListener("click",()=>{
      const correct=answerMatches($("#discovery-answer").value, item.answer);
      $("#discovery-feedback").innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Exactly!':'Look again.'}</span> ${escapeHtml(correct?item.explanation:item.hint)}</p>`;
      if(correct){completed.add(item.id);progress.explorations=[...completed];saveProgress();if(completed.size===course.explorations.length)complete("explore","All six concept discoveries complete.");}
    });
  };
  draw();
}

// Explore the Concept as a deck: one discovery per slide — its model, the prose
// that explains it and the question about it, in the order a learner meets them.
//
// The tab strip above the panel is gone; the dots are the same navigation and
// the deck is what the arrows move. The discoveries-complete count moves under
// the dots, where the progress panel's number used to be off to one side.
//
// `item` is the discovery on the slide, and the name is load-bearing: the
// narration gate matches these argument expressions against the generator's, so
// the discovery reads as `${item.title}. ${item.context}. ${item.explanation}`
// and its question as `item.prompt`, exactly as the panel does.
function renderExploreConceptDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const explorations = course.explorations;
  const completed = new Set(progress.explorations || []);
  const countLabel = () => `${completed.size} of ${explorations.length} discoveries complete`;

  const exploreSlide = (item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Discovery ${index + 1} of ${explorations.length} · ${esc(item.difficulty)}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      ${deckDiagram(topic, index)}
      <p class="gc-lead">${esc(item.context)}</p>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}</div>
      <div class="sci-gc-model ${esc(item.modelType)}"><strong>${esc(item.modelType.replaceAll("-", " "))}</strong><span>${esc(item.explanation)}</span></div>
      <div class="wc-sentence">
        <small>Discovery question</small>
        <p>${esc(item.prompt)}</p>
        <div class="wc-sentence-controls">${deckVoiceSmall(item.prompt, "Listen to question")}</div>
        <input data-response="explore-${esc(item.id)}" aria-label="Discovery answer for ${esc(item.title)}">
      </div>
      <div class="gc-actions">
        <button class="gc-btn small" type="button" data-check-explore="${esc(item.id)}">Check my idea</button>
        <button class="gc-btn ghost small" type="button" data-hint-explore="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
      </div>
      <div data-feedback="explore-${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`;

  mountDeck({
    heading: "Familiar discoveries",
    label: "Discovery",
    slides: explorations.map(exploreSlide),
    emptyMessage: "No discoveries in this unit yet.",
    tools: `<div class="wc-tools"><span class="status-chip" id="explore-count">${countLabel()}</span></div>`,
    onClick: (event) => {
      const target = event.target.closest("[data-check-explore], [data-hint-explore]");
      if (!target) return undefined;
      const id = target.dataset.checkExplore || target.dataset.hintExplore;
      const item = explorations.find((entry) => entry.id === id);
      if (target.dataset.hintExplore) {
        return setSlideBox(`explore-${id}`, `<p class="feedback try"><span class="field-label">Hint:</span> ${esc(item.hint)}</p>`);
      }
      const correct = answerMatches(slideValue(`explore-${id}`), item.answer);
      setSlideBox(`explore-${id}`, feedbackHtml(correct ? "good" : "try", correct ? "Exactly!" : "Look again.", correct ? item.explanation : item.hint));
      if (correct) {
        completed.add(item.id);
        progress.explorations = [...completed];
        saveProgress();
        const counter = $("#explore-count");
        if (counter) counter.textContent = countLabel();
        if (completed.size === explorations.length) complete("explore", "All six concept discoveries complete.");
      }
      return undefined;
    },
  });
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderVisualModels() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderVisualModelsClassic, renderVisualModelsDeck, "The same models, one at a time.");
  if (deckStage()) return renderVisualModelsDeck();
  return renderVisualModelsClassic();
}

function renderVisualModelsClassic() {
  const { $, $$ } = classicScope();
  let active = 0;
  const draw = () => {
    const model = course.visualModels[active];
    $("#app").innerHTML = `${pageHeader("Ways to see the science", "Visual Models", `Explore labelled models that make ${escapeHtml(course.unit.unitTitle)} visible and easier to explain.`)}<div class="model-tabs">${course.visualModels.map((item,index)=>`<button class="subtab ${index===active?'active':''}" data-model-index="${index}" type="button">${escapeHtml(item.title)}</button>`).join('')}</div><section class="panel model-stage generic-model-stage"><span class="eyebrow">${escapeHtml(model.outcomeId || `Model ${active+1}`)}</span><h2>${escapeHtml(model.title)}</h2>${scienceDiagram(courseTopic(), active)}<p>${escapeHtml(model.purpose)}</p>${voiceButton(`${model.title}. ${model.purpose}`, "Listen to model")}<div class="model-concept-cards">${course.concepts.slice(0,3).map((concept)=>`<article><strong>${escapeHtml(concept.title)}</strong><span>${escapeHtml(concept.example)}</span></article>`).join('')}</div></section><p><button class="button primary" id="visuals-done" type="button">I explored the models ✓</button></p>`;
    initScienceWebGL($("#app"));
    $$('[data-model-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.modelIndex);draw();}));
    $("#visuals-done").addEventListener("click", () => { complete("visuals", "Visual models explored."); navigate("method"); });
  };
  draw();
}

// Visual Models as a deck: one model per slide with its diagram, its purpose and
// the concept cards that show where the model is used. `model` is the name the
// narration gate expects — `${model.title}. ${model.purpose}`, the panel's text.
function renderVisualModelsDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const models = course.visualModels;
  const slides = models.map((model, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">${esc(model.outcomeId || `Model ${index + 1}`)} · Model ${index + 1} of ${models.length}</span>
      <h3 class="gc-title">${esc(model.title)}</h3>
      ${deckDiagram(topic, index)}
      <p class="gc-lead">${esc(model.purpose)}</p>
      <div class="gc-actions">${deckVoice(`${model.title}. ${model.purpose}`, "Listen to model")}</div>
      <div class="sci-gc-cards">${course.concepts.slice(0, 3).map((concept) => `<article><strong>${esc(concept.title)}</strong><span>${esc(concept.example)}</span></article>`).join("")}</div>
      ${index === models.length - 1 ? deckFinish("visuals", "I explored the models") : ""}
    </div></section>`);

  mountDeck({
    heading: "Ways to see the science",
    label: "Model",
    slides,
    emptyMessage: "No visual models in this unit yet.",
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return undefined;
      complete("visuals", "Visual models explored.");
      return navigate("method");
    },
  });
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderLearnMethod() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderLearnMethodClassic, renderLearnMethodDeck, "The same methods, one at a time.");
  if (deckStage()) return renderLearnMethodDeck();
  return renderLearnMethodClassic();
}

function renderLearnMethodClassic() {
  const { $, $$ } = classicScope();
  let methodIndex=0;
  const completed=new Set(progress.methods||[]);
  const draw=()=>{
    const method=course.methods[methodIndex];
    $("#app").innerHTML=`${pageHeader("Six short procedures", "Learn the Method", "Select a method, reveal each step and practise the procedure before moving on.")}
      <div class="method-selector">${course.methods.map((item,index)=>`<button class="${index===methodIndex?'active':''} ${completed.has(item.id)?'done':''}" data-method="${index}" type="button"><span>${index+1}</span>${escapeHtml(item.title)}</button>`).join('')}</div>
      <section class="panel method-player"><div class="method-example"><span>${escapeHtml(method.difficulty)} method</span><strong class="method-example-text">${escapeHtml(method.example)}</strong><p>${escapeHtml(method.title)}</p>${voiceButton(`${method.title}. Example: ${method.example}. ${method.steps.join(" ")}`, "Listen to method")}</div><div class="method-steps">${method.steps.map((text,index)=>`<article class="method-step ${index===0?'active':''}" data-method-step="${index}"><span>${index+1}</span><div><h3>Step ${index+1}</h3><p>${escapeHtml(text)}</p>${voiceButton(`Step ${index+1}. ${text}`, "Listen to step")}</div></article>`).join('')}<button class="button primary" id="next-method-step" type="button">Show me the next step →</button></div></section>`;
    let step=0;
    $$('[data-method]').forEach(button=>button.addEventListener('click',()=>{methodIndex=Number(button.dataset.method);draw();}));
    $("#next-method-step").addEventListener('click',()=>{step=Math.min(method.steps.length-1,step+1);$$('[data-method-step]').forEach((item,index)=>item.classList.toggle('active',index<=step));if(step===method.steps.length-1){completed.add(method.id);progress.methods=[...completed];saveProgress();$("#next-method-step").textContent='Method complete ✓';if(completed.size===course.methods.length)complete('method','All six methods learned.');}});
  };
  draw();
}

// Learn the Method as a deck: one procedure per slide, its steps still revealed
// one at a time. The method selector becomes the dots.
//
// Each slide keeps its OWN step position, where the panel had a single counter
// because only one method was ever mounted. Revealing a step toggles a class on
// that slide rather than repainting it, so swiping away and back finds the
// method exactly as far through as the learner left it.
//
// `method` and the `(text, index)` step pair are the names the narration gate
// expects: the whole method reads as `${method.title}. Example: ${method.example}.
// ${method.steps.join(" ")}` and each step as `Step ${index+1}. ${text}`.
//
// The worked example is a disclosure BELOW the steps, not the headline its name
// suggests. It is only called an "example": in Science it carries the whole
// investigation — a median of 233 characters at Stage 2 and one of 1,557 — where
// Mathematics, which this section's markup came from, puts "24 + 8" there. (It is
// also why the grid's `.method-example > strong` renders at 70px serif in Stages
// 5-8: a Mathematics size Science inherited.)
//
// Two goes at this, both caught by looking at the running page. First it was
// .gc-pattern, the display style vocabulary gives a single word, which set an
// entire investigation in 46px. Then it was prose in an open box above the steps
// — right type, wrong place: it filled the card, so Learn the Method opened on a
// wall of text with the steps and the button that advances them below the fold,
// and nothing on screen to say they existed. The steps ARE the section; the
// example is reference material. Lead with the steps.
function renderLearnMethodDeck() {
  const esc = escapeHtml;
  const methods = course.methods;
  const completed = new Set(progress.methods || []);
  const stepAt = new Map();

  const methodSlide = (method, position) => `<section class="gc-slide gc-v${position % 5}" data-method-slide="${esc(method.id)}"><div class="gc-inner">
      <span class="gc-eyebrow">Method ${position + 1} of ${methods.length} · ${esc(method.difficulty)}</span>
      <h3 class="gc-title">${esc(method.title)}</h3>
      <div class="gc-actions">${deckVoice(`${method.title}. Example: ${method.example}. ${method.steps.join(" ")}`, "Listen to method")}</div>
      <ol class="sci-gc-steps">${method.steps.map((text, index) => `<li class="sci-gc-step ${index === 0 ? "active" : ""}" data-method-step="${index}"><span>${index + 1}</span><div><strong>Step ${index + 1}</strong><p>${esc(text)}</p>${deckVoiceSmall(`Step ${index+1}. ${text}`, "Listen to step")}</div></li>`).join("")}</ol>
      <div class="sci-gc-advance"><button class="gc-btn" type="button" data-next-step="${esc(method.id)}">${completed.has(method.id) ? "Method complete ✓" : "Show me the next step →"}</button></div>
      <details class="gc-practice"><summary>Show the worked example</summary><div class="sci-gc-prose">${richText(method.example, "gc-note")}</div></details>
    </div></section>`;

  mountDeck({
    heading: "Short procedures, one step at a time",
    label: "Method",
    slides: methods.map(methodSlide),
    emptyMessage: "No methods in this unit yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-next-step]");
      if (!target) return undefined;
      const method = methods.find((entry) => entry.id === target.dataset.nextStep);
      const step = Math.min(method.steps.length - 1, (stepAt.get(method.id) || 0) + 1);
      stepAt.set(method.id, step);
      const slide = target.closest("[data-method-slide]");
      slide.querySelectorAll("[data-method-step]").forEach((node, index) => node.classList.toggle("active", index <= step));
      if (step === method.steps.length - 1) {
        completed.add(method.id);
        progress.methods = [...completed];
        saveProgress();
        target.textContent = "Method complete ✓";
        if (completed.size === methods.length) complete("method", "All six methods learned.");
      }
      return undefined;
    },
  });
}

const courseTopic = () => unitTopic(course.unit.unitTitle, course.concepts);

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderLesson() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderLessonClassic, renderLessonDeck, "The same concepts, one at a time.");
  if (deckStage()) return renderLessonDeck();
  return renderLessonClassic();
}

function renderLessonClassic() {
  const { $, $$ } = classicScope();
  const topic = courseTopic();
  // The narration says the title, then the explanation, then the example — so
  // all three are read-along lines, or the highlight would lag by however long
  // the voice spends on the parts it has no line for.
  const concepts = course.concepts.map((concept, index) => `<article class="panel concept-card"><span class="eyebrow">Concept ${index + 1}</span><h2><span class="rd-line">${escapeHtml(concept.title)}</span></h2>${scienceDiagram(topic, index)}<div class="concept-body">${richText(concept.explanation, "", true)}</div><p class="example"><span class="field-label">Example:</span> <span class="rd-line">${escapeHtml(concept.example)}</span></p>${voiceButton(`${concept.title}. ${spokenText(concept.explanation)}. Example: ${concept.example}`, "Listen to concept", ".rd-line", ".concept-card")}</article>`).join("");
  $("#app").innerHTML = `${pageHeader("The lesson", course.unit.unitTitle, "Read the source-grounded concepts with a labelled diagram for each, and follow the complete ElevenLabs narration.")}
    <div class="concept-grid">${concepts}</div>
    <p><button class="button primary" id="lesson-done" type="button">I studied the concepts ✓</button></p>`;
  initScienceWebGL($("#app"));
  $("#lesson-done").addEventListener("click", () => { complete("lesson", "Lesson marked studied."); navigate("ai"); });
}

// The lesson as a deck: one concept per slide, with its labelled diagram
// and the full source prose beneath it. The grid put four concepts side by side,
// each holding several paragraphs; a Stage 1 learner reads the one they are on.
//
// `concept` is the name the narration gate expects — the lesson clip is
// `${concept.title}. ${spokenText(concept.explanation)}. Example: ${concept.example}`,
// the same text the grid's Listen button speaks, so both resolve to one clip.
function renderLessonDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const concepts = course.concepts;
  const slides = concepts.map((concept, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Concept ${index + 1} of ${concepts.length}</span>
      <h3 class="gc-title"><span class="rd-line">${esc(concept.title)}</span></h3>
      ${deckDiagram(topic, index)}
      <div class="gc-actions">${deckVoice(`${concept.title}. ${spokenText(concept.explanation)}. Example: ${concept.example}`, "Listen to concept", ".rd-line", ".gc-slide")}</div>
      <div class="sci-gc-prose">${richText(concept.explanation, "gc-lead", true)}</div>
      <p class="gc-note gc-try"><span class="field-label">Example:</span> <span class="rd-line">${esc(concept.example)}</span></p>
      ${index === concepts.length - 1 ? deckFinish("lesson", "I studied the concepts") : ""}
    </div></section>`);

  mountDeck({
    heading: "The lesson",
    label: "Concept",
    slides,
    emptyMessage: "No concepts in this unit yet.",
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return undefined;
      complete("lesson", "Lesson marked studied.");
      return navigate("ai");
    },
  });
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderExamples() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderExamplesClassic, renderExamplesDeck, "The same examples, one at a time.");
  if (deckStage()) return renderExamplesDeck();
  return renderExamplesClassic();
}

function renderExamplesClassic() {
  const { $, $$ } = classicScope();
  // Stages 1-4 describe the unit they are actually in. This page was written for
  // a twelve-example, three-level unit that Science does not have: Stage 4 Unit 2
  // carries 8 examples as 1 Basic, 7 Intermediate and 0 Challenge, and the page
  // still announced "Twelve examples", "four Basic, four Intermediate and four
  // Challenge", a "0/12" counter that could never fill, and a Challenge tab that
  // opened onto nothing.
  //
  // Stages 5-8 keep every one of those strings. They are wrong there too, but
  // this is what the page SAYS rather than how it looks — .classic-design cannot
  // scope a template literal — so changing it for them would be changing their
  // design, which is not this change's to make.
  const counted = BOTH_DESIGNS();
  const all = course.workedExamples;
  const LEVELS = ["Basic", "Intermediate", "Challenge"];
  const countOf = (name) => all.filter((example) => example.difficulty === name).length;
  const levels = counted ? LEVELS.filter((name) => countOf(name)) : LEVELS;
  const total = counted ? all.length : 12;
  const kicker = counted
    ? `${all.length} example${all.length === 1 ? "" : "s"} · ${levels.length} level${levels.length === 1 ? "" : "s"}`
    : "Twelve examples · three levels";
  const blurb = counted
    ? `Study ${levels.map((name) => `${countOf(name)} ${name}`).join(", ").replace(/, ([^,]*)$/, " and $1")} example${all.length === 1 ? "" : "s"}. Each solution explains why the step works.`
    : "Study four Basic, four Intermediate and four Challenge examples. Each solution explains why the step works.";
  let level = levels[0] || "Basic";
  const viewed=new Set(progress.examplesViewed||[]);
  const draw=()=>{
    const items=course.workedExamples.filter(item=>item.difficulty===level);
    // The counter is built here rather than above because viewed.size moves.
    const opened = counted
      ? `<strong>${viewed.size} of ${total}</strong> <span>solutions opened</span>`
      : `<strong>${viewed.size}/12</strong><span>solutions opened</span>`;
    $("#app").innerHTML = `${pageHeader(kicker, "Worked Examples", blurb)}
      <div class="subtabs">${levels.map(item=>`<button class="subtab ${item===level?'active':''}" data-example-level="${item}" type="button">${item} · ${countOf(item)}</button>`).join('')}</div>
      <div class="task-grid">${items.map((item) => `<article class="panel"><span class="eyebrow">${escapeHtml(item.difficulty)} · ${escapeHtml(item.outcomeId)}</span><h3>${escapeHtml(item.title)}</h3><p class="rule-box">${escapeHtml(item.prompt)}</p>${voiceButton(`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`, "Listen to example")}<details data-example="${item.id}"><summary>Show worked solution</summary>${richText(item.solution)}</details></article>`).join("")}</div>
      <section class="panel examples-progress">${opened}<div class="progress-track"><span style="width:${viewed.size/total*100}%"></span></div></section>`;
    $$('[data-example-level]').forEach(button=>button.addEventListener('click',()=>{level=button.dataset.exampleLevel;draw();}));
    $$('[data-example]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open){viewed.add(details.dataset.example);progress.examplesViewed=[...viewed];saveProgress();if(viewed.size===course.workedExamples.length)complete('examples',counted?`All ${all.length} worked examples reviewed.`:'All twelve worked examples reviewed.');}}));
  };
  draw();
}

// Worked Examples as a deck: one example per slide, its solution still behind a
// disclosure so the learner reads the question before the answer.
//
// The Basic / Intermediate / Challenge subtabs become the filter under the dots,
// where the English decks put theirs — same job, and it narrows the deck itself
// rather than swapping one grid for another. "All levels" is added, because a
// deck can hold the whole set in the order the unit teaches them.
//
// `item` is the name the narration gate expects:
// `${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`.
function renderExamplesDeck() {
  const esc = escapeHtml;
  const all = course.workedExamples;
  const levels = [...new Set(all.map((example) => example.difficulty))];
  const viewed = new Set(progress.examplesViewed || []);
  let shown = all;
  const countLabel = () => `${viewed.size} of ${all.length} solutions opened`;

  const exampleSlide = (item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Example ${index + 1} of ${shown.length} · ${esc(item.difficulty)} · ${esc(item.outcomeId)}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      <p class="gc-note gc-try">${esc(item.prompt)}</p>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`, "Listen to example")}</div>
      <details class="gc-practice" data-example="${esc(item.id)}"><summary>Show worked solution</summary><div class="sci-gc-prose">${richText(item.solution, "gc-note")}</div></details>
    </div></section>`;

  const deck = mountDeck({
    heading: "Worked examples, one at a time",
    label: "Example",
    emptyMessage: "No worked examples at this level.",
    tools: `<div class="wc-tools">
        <select id="example-level" aria-label="Filter worked examples by level"><option value="all">All levels</option>${levels.map((level) => `<option value="${esc(level)}">${esc(level)} · ${all.filter((example) => example.difficulty === level).length}</option>`).join("")}</select>
        <span class="status-chip" id="example-count">${countLabel()}</span>
      </div>`,
    // <details> fires `toggle`, which does not bubble, so the delegated click
    // listener watches the summary instead. The element's own open state has not
    // flipped yet at click time — what matters is that it is about to.
    onClick: (event) => {
      const summary = event.target.closest("details[data-example] > summary");
      if (!summary) return undefined;
      const details = summary.parentElement;
      if (details.open) return undefined;
      viewed.add(details.dataset.example);
      progress.examplesViewed = [...viewed];
      saveProgress();
      const counter = $("#example-count");
      if (counter) counter.textContent = countLabel();
      if (viewed.size === all.length) complete("examples", "All twelve worked examples reviewed.");
      return undefined;
    },
  });

  const drawDeck = () => {
    const level = $("#example-level")?.value || "all";
    shown = level === "all" ? all : all.filter((example) => example.difficulty === level);
    deck.setSlides(shown.map(exampleSlide));
  };
  $("#example-level").addEventListener("change", drawDeck);
  drawDeck();
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderPractice() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderPracticeClassic, renderPracticeDeck, "The same questions, one at a time.");
  if (deckStage()) return renderPracticeDeck();
  return renderPracticeClassic();
}

function renderPracticeClassic() {
  const { $, $$ } = classicScope();
  const levels = [...new Set(course.practice.map((item) => item.level))];
  $("#app").innerHTML = `${pageHeader("Support that adapts", "Guided Practice", "Answer with support. Check your idea, ask for a progressive hint or reveal only the next scientific step.")}
    <section class="panel support-strip"><span>Immediate feedback</span><span>Progressive hints</span><span>Next-step support</span><span>Error explanations</span><span>Easier retry</span></section>
    ${levels.map((level) => `<section class="section-stack" style="margin-bottom:24px"><h2>${escapeHtml(level)}</h2><div class="task-grid">${course.practice.filter((item) => item.level === level).map((item) => `<article class="panel question-card"><label for="answer-${item.id}">${escapeHtml(item.prompt)}</label>${voiceButton(item.prompt, "Listen to question")}<input id="answer-${item.id}" autocomplete="off" placeholder="Type your answer or working notes"><div class="question-actions"><button class="button primary" data-check="${item.id}" type="button">Check my answer</button><button class="button secondary" data-hint="${item.id}" type="button">Give me a hint</button><button class="button secondary" data-answer="${item.id}" type="button">Show next step</button></div><div id="feedback-${item.id}" aria-live="polite"></div></article>`).join("")}</div></section>`).join("")}`;
  $$('[data-check]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.check);
    const correct = answerMatches($(`#answer-${item.id}`).value, item.answer);
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct reasoning!" : "Not yet."}</span> ${correct ? escapeHtml(item.answer) : `Your response does not match the reviewed guidance yet. ${escapeHtml(item.hint)} Try representing the idea in a simpler way first.`}</p>`;
    if (correct && !progress.practiceOpened.includes(item.id)) { progress.practiceOpened.push(item.id); saveProgress(); }
    if (progress.practiceOpened.length === course.practice.length) complete("guided", "Guided Practice complete.");
  }));
  $$('[data-hint]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.hint);
    const used = Number(button.dataset.used || 0) + 1;
    button.dataset.used = String(used);
    // The third hint used to print the answer itself ("The reviewed guidance is
    // <answer>"), which a learner could type straight back to mark the question
    // correct. That cost nothing while grading accepted any substring, because
    // the question was already free; it costs the section its meaning now that
    // completing Guided Practice means the science was actually done.
    //
    // So the escalation ends by naming where the reasoning is taught rather
    // than handing the result over. The deck half carries its own copy of this
    // array — both were printing the answer, and fixing one alone leaves Stages
    // 1-4 giving it away.
    const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `Re-read the concepts for ${course.unit.unitTitle} and look at how the worked example reasons it through — or ask your AI tutor to set out just the first step.`];
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><span class="field-label">Hint ${Math.min(used,3)}:</span> ${escapeHtml(hints[Math.min(used-1,2)])}</p>`;
  }));
  $$('[data-answer]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.answer);
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><span class="field-label">Next step:</span> ${escapeHtml(item.hint)} Do that step, then check your answer again.</p>`;
  }));
}

// Guided Practice as a deck: one question per slide, so a Stage 1 learner faces
// the question they are answering rather than every question in the unit stacked
// under three level headings.
//
// All three supports survive — check, a progressive hint that deepens each time
// it is asked, and next-step. The hint counter lives on the button, as it did in
// the grid, so it is per question and survives swiping away and back.
//
// `item` is the name the narration gate expects: a practice clip is `item.prompt`.
function renderPracticeDeck() {
  const esc = escapeHtml;
  const items = course.practice;
  const opened = new Set(progress.practiceOpened || []);
  const countLabel = () => `${opened.size} of ${items.length} answered`;

  const practiceSlide = (item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${items.length} · ${esc(item.level)}</span>
      <h3 class="gc-title">${esc(item.prompt)}</h3>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to question")}</div>
      <div class="wc-sentence">
        <small>Your answer</small>
        <input data-response="practice-${esc(item.id)}" autocomplete="off" placeholder="Type your answer or working notes" aria-label="Answer to question ${index + 1}">
      </div>
      <div class="gc-actions">
        <button class="gc-btn small" type="button" data-check="${esc(item.id)}">Check my answer</button>
        <button class="gc-btn ghost small" type="button" data-hint="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
        <button class="gc-btn ghost small" type="button" data-answer="${esc(item.id)}">${deckIcon("arrow-right")} Next step</button>
      </div>
      <div data-feedback="practice-${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`;

  mountDeck({
    heading: "Support that adapts",
    label: "Question",
    slides: items.map(practiceSlide),
    emptyMessage: "No practice questions in this unit yet.",
    tools: `<div class="wc-tools"><span class="status-chip" id="practice-count">${countLabel()}</span></div>`,
    onClick: (event) => {
      const target = event.target.closest("[data-check], [data-hint], [data-answer]");
      if (!target) return undefined;
      const id = target.dataset.check || target.dataset.hint || target.dataset.answer;
      const item = items.find((entry) => entry.id === id);
      const key = `practice-${id}`;
      if (target.dataset.hint) {
        const used = Number(target.dataset.used || 0) + 1;
        target.dataset.used = String(used);
        const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `Re-read the concepts for ${course.unit.unitTitle} and look at how the worked example reasons it through — or ask your AI tutor to set out just the first step.`];
        return setSlideBox(key, `<p class="feedback try"><span class="field-label">Hint ${Math.min(used, 3)}:</span> ${esc(hints[Math.min(used - 1, 2)])}</p>`);
      }
      if (target.dataset.answer) {
        return setSlideBox(key, `<p class="feedback try"><span class="field-label">Next step:</span> ${esc(item.hint)} Do that step, then check your answer again.</p>`);
      }
      const correct = answerMatches(slideValue(key), item.answer);
      setSlideBox(key, `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct reasoning!" : "Not yet."}</span> ${correct ? esc(item.answer) : `Your response does not match the reviewed guidance yet. ${esc(item.hint)} Try representing the idea in a simpler way first.`}</p>`);
      if (correct && !opened.has(item.id)) {
        opened.add(item.id);
        progress.practiceOpened = [...opened];
        saveProgress();
        const counter = $("#practice-count");
        if (counter) counter.textContent = countLabel();
      }
      if (opened.size === items.length) complete("guided", "Guided Practice complete.");
      return undefined;
    },
  });
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderActivities() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderActivitiesClassic, renderActivitiesDeck, "The same investigations, one at a time.");
  if (deckStage()) return renderActivitiesDeck();
  return renderActivitiesClassic();
}

function renderActivitiesClassic() {
  const { $, $$ } = classicScope();
  const topic = courseTopic();
  $("#app").innerHTML = `${pageHeader("Learn by doing", "Experiments", `Complete practical ${escapeHtml(course.unit.unitTitle)} investigations using familiar materials.`)}
    <div class="task-grid">${course.activities.map((activity, index) => `<article class="panel task-card"><span class="eyebrow">Investigation ${index + 1} · Hands-on</span><h2>${escapeHtml(activity.title)}</h2>${scienceDiagram(topic, index)}<p class="rule-box"><span class="field-label">You need:</span> ${escapeHtml(activity.materials)}</p><ol class="agenda">${activity.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><textarea class="activity-response" rows="4" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${escapeHtml(activity.title)}"></textarea><button class="button secondary" data-activity-done="${index}" type="button">✓ Mark complete</button></article>`).join("")}</div>
    <p><button class="button primary" id="activities-done" type="button">Finish activities ✓</button></p>`;
  initScienceWebGL($("#app"));
  $$('[data-activity-done]').forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.textContent = "✓ Complete"; }));
  $("#activities-done").addEventListener("click", () => {
    if (!$$('[data-activity-done]').every((button) => button.disabled)) return toast("Mark each activity complete first.");
    complete("activities", "Unit experiments complete.");
  });
}

// Experiments as a deck: one investigation per slide — what you need, the steps
// in order, and the box to record what you noticed, with nothing else competing
// for a young learner's attention while they are doing it.
//
// Per-investigation "Mark complete" is kept (it is how a learner tracks six
// separate experiments) and marks its own slide without repainting it, so the
// notes just typed stay where they were left. Finishing still requires every
// investigation marked, exactly as the grid did.
function renderActivitiesDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const activities = course.activities;
  const slides = activities.map((activity, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Investigation ${index + 1} of ${activities.length} · Hands-on</span>
      <h3 class="gc-title">${esc(activity.title)}</h3>
      ${deckDiagram(topic, index)}
      <p class="gc-note gc-try"><span class="field-label">You need:</span> ${esc(activity.materials)}</p>
      <ol class="sci-gc-list">${activity.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <div class="wc-sentence">
        <small>What you noticed</small>
        <textarea rows="4" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${esc(activity.title)}"></textarea>
      </div>
      <button class="gc-btn ghost" type="button" data-activity-done="${index}">✓ Mark complete</button>
      ${index === activities.length - 1 ? deckFinish("activities", "Finish activities") : ""}
    </div></section>`);

  mountDeck({
    heading: "Learn by doing",
    label: "Investigation",
    slides,
    emptyMessage: "No investigations in this unit yet.",
    onClick: (event, deck) => {
      const target = event.target.closest("[data-activity-done], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.deckFinish) {
        // Scoped to the deck, not the document: with both designs on one page the
        // grid above has its own [data-activity-done] buttons, and a document-wide
        // query would demand those be marked too — the deck's finish could never
        // unlock however much the learner did in the deck.
        if (![...deck.root.querySelectorAll("[data-activity-done]")].every((button) => button.disabled)) return toast("Mark each activity complete first.");
        return complete("activities", "Unit experiments complete.");
      }
      target.disabled = true;
      target.classList.remove("ghost");
      target.classList.add("done");
      target.textContent = "✓ Complete";
      return undefined;
    },
  });
}

const mathGamePack = {
  masteryScore: 3,
  games: [
    {
      id: "place-value-builder", icon: "▦", skill: "Place value", title: "Tens & Ones Builder",
      description: "Build two-digit numbers from their tens and ones.", type: "choice",
      rounds: [
        { prompt: "Which number has 6 tens and 2 ones?", choices: ["26", "62", "602"], answer: "62", clue: "The tens digit comes first.", explanation: "6 tens and 2 ones make 62." },
        { prompt: "Which number is 4 tens and 7 ones?", choices: ["74", "47", "407"], answer: "47", clue: "Write four in the tens place.", explanation: "4 tens and 7 ones make 47." },
        { prompt: "How many tens and ones are in 83?", choices: ["8 tens and 3 ones", "3 tens and 8 ones", "83 tens"], answer: "8 tens and 3 ones", clue: "Read the left digit, then the right digit.", explanation: "83 is 8 tens and 3 ones." },
        { prompt: "Which expression builds 95?", choices: ["9 + 5", "90 + 5", "50 + 9"], answer: "90 + 5", clue: "Nine tens means ninety.", explanation: "90 plus 5 equals 95." }
      ]
    },
    {
      id: "crocodile-compare", icon: ">", skill: "Comparing", title: "Crocodile Compare",
      description: "Choose the symbol that faces the greater number.", type: "choice",
      rounds: [
        { prompt: "Complete: 63 __ 36", choices: [">", "<", "="], answer: ">", clue: "Compare the tens first.", explanation: "Six tens is greater than three tens, so 63 > 36." },
        { prompt: "Complete: 48 __ 84", choices: [">", "<", "="], answer: "<", clue: "Four tens is less than eight tens.", explanation: "48 is less than 84." },
        { prompt: "Complete: 57 __ 57", choices: [">", "<", "="], answer: "=", clue: "Every digit matches.", explanation: "Both numbers have the same value." },
        { prompt: "Which number is greatest?", choices: ["72", "27", "70"], answer: "72", clue: "Compare tens, then ones.", explanation: "72 and 70 have seven tens; 72 has more ones." }
      ]
    },
    {
      id: "sequence-sprint", icon: "→", skill: "Number patterns", title: "Sequence Sprint",
      description: "Spot the counting rule and race to the next number.", type: "choice",
      rounds: [
        { prompt: "What comes next: 20, 30, 40, __?", choices: ["41", "50", "60"], answer: "50", clue: "Add ten each time.", explanation: "The sequence counts forward in tens." },
        { prompt: "What comes next: 48, 46, 44, __?", choices: ["42", "43", "54"], answer: "42", clue: "Subtract two each time.", explanation: "44 minus 2 is 42." },
        { prompt: "Fill the gap: 93, 83, __, 63", choices: ["72", "73", "74"], answer: "73", clue: "Each number is ten less.", explanation: "83 minus 10 is 73." },
        { prompt: "What is the rule: 5, 10, 15, 20?", choices: ["Add 2", "Add 5", "Add 10"], answer: "Add 5", clue: "Find the difference between neighbours.", explanation: "Every number is five more than the one before." }
      ]
    },
    {
      id: "order-race", icon: "≡", skill: "Ordering", title: "Number Order Race",
      description: "Arrange number tiles from smallest to greatest.", type: "sequence",
      rounds: [
        { prompt: "Order these numbers from smallest to greatest.", tokens: ["47", "7", "74"], answer: "7 47 74", clue: "A one-digit number comes first.", explanation: "7 < 47 < 74." },
        { prompt: "Order these numbers from smallest to greatest.", tokens: ["91", "19", "90"], answer: "19 90 91", clue: "Compare the tens digits first.", explanation: "19 < 90 < 91." },
        { prompt: "Order these numbers from smallest to greatest.", tokens: ["55", "50", "5"], answer: "5 50 55", clue: "Start with the number that has no tens.", explanation: "5 < 50 < 55." },
        { prompt: "Order these numbers from smallest to greatest.", tokens: ["68", "86", "66"], answer: "66 68 86", clue: "Two numbers have six tens; compare their ones.", explanation: "66 < 68 < 86." }
      ]
    },
    {
      id: "even-odd-sort", icon: "2", skill: "Even and odd", title: "Even or Odd Sort",
      description: "Use the final digit to identify even and odd numbers.", type: "choice",
      rounds: [
        { prompt: "Is 24 even or odd?", choices: ["Even", "Odd"], answer: "Even", clue: "Look at the final digit: 4.", explanation: "Numbers ending in 0, 2, 4, 6 or 8 are even." },
        { prompt: "Is 57 even or odd?", choices: ["Even", "Odd"], answer: "Odd", clue: "Look at the final digit: 7.", explanation: "Numbers ending in 1, 3, 5, 7 or 9 are odd." },
        { prompt: "Which group contains only even numbers?", choices: ["12, 24, 40", "11, 22, 33", "15, 30, 41"], answer: "12, 24, 40", clue: "Check the final digit of every number.", explanation: "12, 24 and 40 all have even endings." },
        { prompt: "Which number is odd?", choices: ["68", "72", "95"], answer: "95", clue: "An odd number can end in 5.", explanation: "95 ends in 5, so it is odd." }
      ]
    },
    {
      id: "missing-number-mission", icon: "?", skill: "Counting", title: "Missing Number Mission",
      description: "Complete counting sequences forwards and backwards.", type: "choice",
      rounds: [
        { prompt: "Fill the gap: 41, 42, __, 44", choices: ["40", "43", "45"], answer: "43", clue: "Count forward by one.", explanation: "43 comes after 42 and before 44." },
        { prompt: "Fill the gap: 60, 58, __, 54", choices: ["56", "57", "52"], answer: "56", clue: "Count backwards by two.", explanation: "60, 58, 56, 54 counts back in twos." },
        { prompt: "What number comes immediately before 80?", choices: ["79", "81", "70"], answer: "79", clue: "Subtract one from 80.", explanation: "79 is one less than 80." },
        { prompt: "What number is between 69 and 71?", choices: ["68", "70", "72"], answer: "70", clue: "Count one step after 69.", explanation: "69, 70, 71 are consecutive numbers." }
      ]
    },
    {
      id: "hundred-square-hunt", icon: "▦", skill: "100 square", title: "Hundred Square Hunt",
      description: "Move across and down a 100 square using number patterns.", type: "choice",
      rounds: [
        { prompt: "Start at 34 and move one square right. Where do you land?", choices: ["33", "35", "44"], answer: "35", clue: "Moving right adds one.", explanation: "34 plus 1 is 35." },
        { prompt: "Start at 46 and move one row down. Where do you land?", choices: ["47", "56", "36"], answer: "56", clue: "Moving down adds ten.", explanation: "46 plus 10 is 56." },
        { prompt: "Start at 72 and move one row up. Where do you land?", choices: ["62", "71", "82"], answer: "62", clue: "Moving up subtracts ten.", explanation: "72 minus 10 is 62." },
        { prompt: "Start at 89 and move one square left. Where do you land?", choices: ["79", "88", "90"], answer: "88", clue: "Moving left subtracts one.", explanation: "89 minus 1 is 88." }
      ]
    },
    {
      id: "ordinal-line-up", icon: "1st", skill: "Ordinal numbers", title: "Ordinal Line-Up",
      description: "Find positions using first, second, third and beyond.", type: "choice",
      rounds: [
        { prompt: "Amina is first and Yusuf stands directly behind her. What is Yusuf's position?", choices: ["1st", "2nd", "3rd"], answer: "2nd", clue: "The person after first is second.", explanation: "Yusuf is second in line." },
        { prompt: "Which ordinal means position number 3?", choices: ["2nd", "3rd", "4th"], answer: "3rd", clue: "Remember first, second, third.", explanation: "Position number 3 is third." },
        { prompt: "There are five runners. Which runner is last?", choices: ["4th", "5th", "6th"], answer: "5th", clue: "Count all five positions.", explanation: "The fifth runner is last in a line of five." },
        { prompt: "Sagal moves from 4th place ahead by one position. What is her new position?", choices: ["3rd", "4th", "5th"], answer: "3rd", clue: "Moving ahead makes the position number one smaller.", explanation: "One place ahead of fourth is third." }
      ]
    },
    {
      id: "estimate-and-count", icon: "≈", skill: "Estimation", title: "Estimate & Count",
      description: "Choose sensible estimates, then reason about exact groups.", type: "choice",
      rounds: [
        { prompt: "A jar looks like it holds about 48 beans. Which is the most sensible estimate?", choices: ["5", "50", "500"], answer: "50", clue: "Choose a nearby friendly number.", explanation: "50 is close to 48 and is a sensible estimate." },
        { prompt: "You count 6 groups of ten counters and 3 loose counters. What is the exact total?", choices: ["36", "63", "603"], answer: "63", clue: "Count the tens before the ones.", explanation: "Six tens and three ones make 63." },
        { prompt: "An estimate was 70 shells and the exact count was 67. How far apart are they?", choices: ["3", "7", "13"], answer: "3", clue: "Find the difference between 70 and 67.", explanation: "70 minus 67 equals 3." },
        { prompt: "Which estimate is closest to 92?", choices: ["50", "90", "1000"], answer: "90", clue: "Look for the smallest difference.", explanation: "90 is only two away from 92." }
      ]
    },
    {
      id: "number-bond-lab", icon: "+", skill: "Number bonds", title: "Number Bond Lab",
      description: "Find pairs and parts that combine to make a target number.", type: "choice",
      rounds: [
        { prompt: "What must be added to 30 to make 50?", choices: ["10", "20", "30"], answer: "20", clue: "Count from 30 to 50 in tens.", explanation: "30 plus 20 equals 50." },
        { prompt: "Complete the bond: 64 = 60 + __", choices: ["4", "6", "40"], answer: "4", clue: "Separate the tens and ones.", explanation: "64 is six tens and four ones." },
        { prompt: "Which pair makes 100?", choices: ["40 and 50", "40 and 60", "40 and 70"], answer: "40 and 60", clue: "Count on from 40 to 100.", explanation: "40 plus 60 equals 100." },
        { prompt: "What is the missing part: 75 = 70 + __?", choices: ["5", "7", "15"], answer: "5", clue: "Look at the ones digit.", explanation: "70 plus 5 equals 75." }
      ]
    },
    {
      id: "mental-math-dash", icon: "⚡", skill: "Rapid science recall", title: "Quick Science Dash",
      description: "Use place-value shortcuts to calculate accurately.", type: "choice",
      rounds: [
        { prompt: "What is 10 more than 35?", choices: ["36", "45", "55"], answer: "45", clue: "Add one ten; keep the ones.", explanation: "35 plus 10 is 45." },
        { prompt: "What is 10 less than 82?", choices: ["72", "81", "92"], answer: "72", clue: "Subtract one ten; keep the ones.", explanation: "82 minus 10 is 72." },
        { prompt: "What is 50 + 7?", choices: ["12", "57", "75"], answer: "57", clue: "Combine five tens and seven ones.", explanation: "50 plus 7 equals 57." },
        { prompt: "What is 68 - 8?", choices: ["60", "61", "76"], answer: "60", clue: "Remove all eight ones.", explanation: "68 minus 8 leaves 6 tens, or 60." }
      ]
    },
    {
      id: "real-life-math", icon: "⌂", skill: "Problem solving", title: "Real-Life Science",
      description: "Apply number skills to shopping, transport and daily life.", type: "choice",
      rounds: [
        { prompt: "A minibus has 4 rows of 10 seats and 6 extra seats. How many seats are there?", choices: ["40", "46", "64"], answer: "46", clue: "Combine four tens and six ones.", explanation: "40 plus 6 equals 46 seats." },
        { prompt: "A shop has 75 bottles and sells 10. How many remain?", choices: ["65", "74", "85"], answer: "65", clue: "Count back one group of ten.", explanation: "75 minus 10 equals 65." },
        { prompt: "Hodan buys fruit for 30 shillings and bread for 20 shillings. What is the total?", choices: ["10", "50", "60"], answer: "50", clue: "Add three tens and two tens.", explanation: "30 plus 20 equals 50 shillings." },
        { prompt: "There are 68 litres of water. The family uses 8 litres. How many litres remain?", choices: ["60", "61", "76"], answer: "60", clue: "Subtract the ones from 68.", explanation: "68 minus 8 equals 60 litres." }
      ]
    }
  ]
};

function mathGameProgress(gameId) {
  progress.games ||= {};
  return progress.games[gameId] || { bestScore: 0, attempts: 0, xp: 0 };
}

function activeGamePack() { return course.games || mathGamePack; }

function renderGames() {
  if (activeGameId) return renderActiveMathGame();
  const gamePack = activeGamePack();
  const mastered = gamePack.games.filter((game) => mathGameProgress(game.id).bestScore >= gamePack.masteryScore).length;
  const xp = gamePack.games.reduce((total, game) => total + mathGameProgress(game.id).xp, 0);
  $("#app").innerHTML = `${pageHeader("Play, practise, master", "Game zone", "Twelve short Science games turn place value, counting, comparing, patterns and problem solving into active practice.", "Stage 2 games")}
    <section class="games-hero math-games-hero"><div class="math-games-visual" aria-hidden="true"><span>1</span><span>+</span><span>1</span><strong>${course.unit.unitNo}</strong></div><div><span class="eyebrow">Unit ${course.unit.unitNo} · ${escapeHtml(course.unit.unitTitle)}</span><h2>Choose your next challenge</h2><p>Earn stars by showing what you know. Hints, voice prompts and retries are always available.</p><div class="game-hero-stats"><strong>${mastered}/${gamePack.games.length} mastered</strong><strong>${xp} XP earned</strong></div></div></section>
    <div class="game-grid">${gamePack.games.map((game, index) => { const saved=mathGameProgress(game.id); const passed=saved.bestScore>=gamePack.masteryScore; return `<article class="game-card ${passed?'mastered':''}"><div class="game-card-top"><span class="game-icon">${game.icon}</span><span class="game-number">${index+1}</span></div><span class="eyebrow">${escapeHtml(game.skill)}</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><div class="game-stars" aria-label="Best score ${saved.bestScore} out of ${game.rounds.length}">${game.rounds.map((_,star)=>`<span class="${star<saved.bestScore?'earned':''}">★</span>`).join('')}</div><button class="button ${passed?'secondary':'primary'}" data-start-game="${game.id}" type="button">${passed?'↻ Play again':'▶ Start game'}</button></article>`; }).join('')}</div>`;
  $$('[data-start-game]').forEach((button) => button.addEventListener("click", () => startMathGame(button.dataset.startGame)));
}

function startMathGame(gameId) {
  activeGameId = gameId;
  gameRoundIndex = 0;
  gameScore = 0;
  gameLocked = false;
  gameSelection = [];
  renderActiveMathGame();
}

function currentMathGame() { return activeGamePack().games.find((game) => game.id === activeGameId); }

function renderActiveMathGame() {
  const game = currentMathGame();
  if (!game) { activeGameId = null; return renderGames(); }
  if (gameRoundIndex >= game.rounds.length) return renderMathGameResult(game);
  const round = game.rounds[gameRoundIndex];
  gameLocked = false;
  gameSelection = [];
  const interaction = game.type === "choice"
    ? `<div class="game-choices">${round.choices.map((choice,index)=>`<button data-game-choice="${index}" type="button">${escapeHtml(choice)}</button>`).join('')}</div>`
    : `<div class="game-sentence-answer" id="game-answer"><span>Choose the numbers below</span></div><div class="game-word-tiles">${round.tokens.map((token,index)=>`<button data-game-tile="${index}" data-value="${escapeHtml(token)}" type="button">${escapeHtml(token)}</button>`).join('')}</div><div class="game-tools"><button class="button secondary" id="game-reset" type="button">↻ Reset</button><button class="button primary" id="game-check" type="button">Check order ✓</button></div>`;
  $("#app").innerHTML = `<div class="game-play-top"><button class="button ghost" id="games-home" type="button">← All games</button><div><span>Challenge ${gameRoundIndex+1} of ${game.rounds.length}</span><strong>${gameScore} stars</strong></div></div><section class="panel game-stage"><div class="game-stage-head"><span class="game-icon">${game.icon}</span><div><span class="eyebrow">${escapeHtml(game.skill)}</span><h1>${escapeHtml(game.title)}</h1></div>${voiceButton(`${round.prompt}. ${round.clue}`, "Listen to challenge")}</div><div class="game-progress"><span style="width:${gameRoundIndex/game.rounds.length*100}%"></span></div><div class="game-prompt"><span>Your challenge</span><h2>${escapeHtml(round.prompt)}</h2><button class="button ghost game-hint" id="game-hint" type="button">💡 Hint</button></div>${interaction}<div id="game-feedback" aria-live="polite"></div></section>`;
  $("#games-home").addEventListener("click", () => { activeGameId=null; renderGames(); });
  $("#game-hint").addEventListener("click", () => toast(round.clue));
  if (game.type === "choice") bindMathChoiceGame(round); else bindMathSequenceGame(round);
  bindVoiceControls();
  updateVoiceUI();
}

function bindMathChoiceGame(round) {
  $$('[data-game-choice]').forEach((button) => button.addEventListener("click", () => {
    if (gameLocked) return;
    const choice = round.choices[Number(button.dataset.gameChoice)];
    const correct = choice === round.answer;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$('[data-game-choice]').find((candidate)=>round.choices[Number(candidate.dataset.gameChoice)]===round.answer)?.classList.add("correct");
    completeMathGameRound(correct, round.explanation);
  }));
}

function bindMathSequenceGame(round) {
  const draw = () => { $("#game-answer").innerHTML = gameSelection.length ? gameSelection.map((item)=>`<strong>${escapeHtml(item.value)}</strong>`).join('') : "<span>Choose the numbers below</span>"; };
  $$('[data-game-tile]').forEach((button) => button.addEventListener("click", () => { if(gameLocked||button.disabled)return; gameSelection.push({value:button.dataset.value}); button.disabled=true; draw(); }));
  $("#game-reset").addEventListener("click", () => { gameSelection=[]; $$('[data-game-tile]').forEach((button)=>{button.disabled=false;}); draw(); });
  $("#game-check").addEventListener("click", () => { if(!gameSelection.length)return toast("Choose the number tiles first."); const response=gameSelection.map((item)=>item.value).join(" "); completeMathGameRound(response===round.answer, response===round.answer?round.explanation:`The correct order is ${round.answer}.`); });
}

function completeMathGameRound(correct, explanation) {
  if (gameLocked) return;
  gameLocked = true;
  if (correct) gameScore += 1;
  $("#game-feedback").innerHTML = `<div class="game-round-feedback ${correct?'good':'try'}"><span>${correct?'★':'💡'}</span><div><span class="status-note">${correct?'Star earned!':'Good try!'}</span><p>${escapeHtml(explanation)}</p></div></div><button class="button primary" id="game-next" type="button">${gameRoundIndex+1===currentMathGame().rounds.length?'See my result':'Next challenge'} →</button>`;
  $("#game-next").addEventListener("click", () => { gameRoundIndex+=1; renderActiveMathGame(); });
}

function renderMathGameResult(game) {
  const gamePack = activeGamePack();
  const passed = gameScore >= gamePack.masteryScore;
  const previous = mathGameProgress(game.id);
  progress.games[game.id] = { bestScore:Math.max(previous.bestScore,gameScore), attempts:previous.attempts+1, xp:Math.max(previous.xp,gameScore*20+(passed?20:0)) };
  saveProgress();
  const mastered = gamePack.games.filter((item)=>mathGameProgress(item.id).bestScore>=gamePack.masteryScore).length;
  if (mastered===gamePack.games.length) complete("games", "All Science games mastered.");
  $("#app").innerHTML = `<section class="panel game-result"><div class="score-ring">${gameScore}/${game.rounds.length}</div><span class="eyebrow">${passed?'Game mastered':'Keep practising'}</span><h1>${passed?'Brilliant work!':'Nearly there!'}</h1><p>You earned ${gameScore} stars and ${gameScore*20+(passed?20:0)} XP in ${escapeHtml(game.title)}.</p><div class="game-stars large">${game.rounds.map((_,index)=>`<span class="${index<gameScore?'earned':''}">★</span>`).join('')}</div><div class="game-tools"><button class="button secondary" id="replay-game" type="button">↻ Play again</button><button class="button primary" id="games-home" type="button">Choose another game →</button></div></section>`;
  $("#replay-game").addEventListener("click", () => startMathGame(game.id));
  $("#games-home").addEventListener("click", () => { activeGameId=null; renderGames(); });
}

function renderFluency() {
  const items = course.fluency;
  $("#app").innerHTML = `${pageHeader("Speed after understanding", "Science Fluency", "Build accuracy and confidence with a short number sprint. Fluency supports conceptual learning; it does not replace it.")}
    <section class="panel fluency-shell"><div class="fluency-top"><div><span>Question</span><strong id="fluency-position">1/${items.length}</strong></div><div><span>Accurate</span><strong id="fluency-score">0</strong></div><div><span>Time</span><strong id="fluency-time">Ready</strong></div></div><div id="fluency-question" class="math-display"></div><label for="fluency-answer">Your answer</label><div class="fluency-answer"><input id="fluency-answer" inputmode="numeric" autocomplete="off"><button class="button primary" id="check-fluency" type="button">Check & continue</button></div><div id="fluency-feedback"></div></section>`;
  let index = 0;
  let score = 0;
  let startedAt = null;
  const draw = () => { $("#fluency-position").textContent=`${index+1}/${items.length}`; $("#fluency-question").textContent=items[index].prompt; $("#fluency-answer").value=""; $("#fluency-answer").focus(); };
  $("#check-fluency").addEventListener("click", () => {
    if (!startedAt) startedAt = Date.now();
    const correct = answerMatches($("#fluency-answer").value, items[index].answer);
    if (correct) score += 1;
    $("#fluency-score").textContent=score;
    $("#fluency-feedback").innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Correct!':'Review:'}</span> ${escapeHtml(correct?items[index].answer:items[index].hint)}</p>`;
    index += 1;
    if (index >= items.length) {
      const seconds=Math.max(1,Math.round((Date.now()-startedAt)/1000));
      $("#fluency-time").textContent=`${seconds}s`;
      $("#check-fluency").disabled=true;
      $("#fluency-question").textContent=`${score} of ${items.length} accurate`;
      // Reaching the last question is not the same as being fluent. This used
      // to complete whatever the score, so a sprint answered wrongly twelve
      // times out of twelve still reported "Science Fluency sprint complete."
      // and ticked the section — which mattered little while grading accepted
      // any substring and nothing could be failed, and matters now that it does
      // not.
      //
      // The threshold is the unit's own assessment.passPercent rather than a
      // number invented here: 80 in all 53 units, and the figure the course
      // already gives learners as mastery.
      const needed = Math.ceil(items.length * (course.assessment?.passPercent ?? 80) / 100);
      if (score >= needed) complete("fluency", "Science Fluency sprint complete.");
      else {
        // A section that cannot be completed holds the rest of the grade shut,
        // and the sprint disables its own Check button here, so falling short
        // has to offer another run rather than a dead end.
        $("#fluency-feedback").innerHTML = `<p class="feedback try"><span class="status-note">${score} of ${items.length} — fluency needs ${needed}.</span> Review the explanations for the ones you missed, then run the sprint again.</p><button class="button primary" id="retry-fluency" type="button">↻ Run the sprint again</button>`;
        $("#retry-fluency").addEventListener("click", renderFluency);
      }
    } else draw();
  });
  $("#fluency-answer").addEventListener("keydown",event=>{if(event.key==="Enter")$("#check-fluency").click();});
  draw();
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderRealProblems() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderRealProblemsClassic, renderRealProblemsDeck, "The same problems, one at a time.");
  if (deckStage()) return renderRealProblemsDeck();
  return renderRealProblemsClassic();
}

function renderRealProblemsClassic() {
  const { $, $$ } = classicScope();
  const problems = course.realProblems;
  $("#app").innerHTML = `${pageHeader("Science in daily life", "Solve Real Problems", `Apply ${escapeHtml(course.unit.unitTitle)} to home, school, markets, travel and the wider community.`)}
    <div class="problem-grid">${problems.map((item,index)=>`<article class="panel real-problem"><div class="problem-icon">${["⌂","◫","🚌","▦","◇","✦"][index]||"#"}</div><span class="eyebrow">${escapeHtml(item.context)} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt, "Listen to problem")}<textarea id="problem-${item.id}" placeholder="Show your calculation and answer…"></textarea><div class="question-actions"><button class="button primary" data-check-problem="${item.id}" type="button">Check answer</button><button class="button secondary" data-problem-hint="${item.id}" type="button">Hint</button></div><div id="problem-feedback-${item.id}"></div></article>`).join("")}</div>`;
  $$('[data-check-problem]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.checkProblem);const correct=answerMatches($(`#problem-${item.id}`).value,item.answer);$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Applied correctly!':'Check the situation.'}</span> ${escapeHtml(correct?item.answer:item.hint)}</p>`;if(correct)button.disabled=true;if($$('[data-check-problem]').every(itemButton=>itemButton.disabled))complete("problems","Real-world problems complete.");}));
  $$('[data-problem-hint]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.problemHint);$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback try"><span class="field-label">Hint:</span> ${escapeHtml(item.hint)}</p>`;}));
}

// Solve Real Problems as a deck: one situation per slide. `item` is the name the
// narration gate expects — the clip is `item.prompt` alone, because the context
// is already on screen as the eyebrow above it and is not read out.
function renderRealProblemsDeck() {
  const esc = escapeHtml;
  const problems = course.realProblems;
  const solved = new Set();
  const slides = problems.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Problem ${index + 1} of ${problems.length} · ${esc(item.context)} · ${esc(item.difficulty)}</span>
      <div class="sci-gc-badge" aria-hidden="true">${["⌂", "◫", "🚌", "▦", "◇", "✦"][index] || "#"}</div>
      <h3 class="gc-title">${esc(item.prompt)}</h3>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to problem")}</div>
      <div class="wc-sentence">
        <small>Your working and answer</small>
        <textarea data-response="problem-${esc(item.id)}" rows="4" placeholder="Show your calculation and answer…" aria-label="Answer to problem ${index + 1}"></textarea>
      </div>
      <div class="gc-actions">
        <button class="gc-btn small" type="button" data-check-problem="${esc(item.id)}">Check answer</button>
        <button class="gc-btn ghost small" type="button" data-problem-hint="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
      </div>
      <div data-feedback="problem-${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountDeck({
    heading: "Science in daily life",
    label: "Problem",
    slides,
    emptyMessage: "No real-world problems in this unit yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-check-problem], [data-problem-hint]");
      if (!target) return undefined;
      const id = target.dataset.checkProblem || target.dataset.problemHint;
      const item = problems.find((entry) => entry.id === id);
      if (target.dataset.problemHint) {
        return setSlideBox(`problem-${id}`, `<p class="feedback try"><span class="field-label">Hint:</span> ${esc(item.hint)}</p>`);
      }
      const correct = answerMatches(slideValue(`problem-${id}`), item.answer);
      setSlideBox(`problem-${id}`, feedbackHtml(correct ? "good" : "try", correct ? "Applied correctly!" : "Check the situation.", correct ? item.answer : item.hint));
      if (correct) {
        target.disabled = true;
        solved.add(id);
        // The grid read "every Check button disabled" off the page; here the
        // slides are all mounted at once, so the same rule is the same count.
        if (solved.size === problems.length) complete("problems", "Real-world problems complete.");
      }
      return undefined;
    },
  });
}

// Stages 1-4 show the grid and the deck, in that order; Stages 5-8 the grid alone.
function renderExplainThinking() {
  if (BOTH_DESIGNS()) return renderBothDesigns(renderExplainThinkingClassic, renderExplainThinkingDeck, "The same prompts, one at a time.");
  if (deckStage()) return renderExplainThinkingDeck();
  return renderExplainThinkingClassic();
}

function renderExplainThinkingClassic() {
  const { $, $$ } = classicScope();
  let active=0;
  const completed=new Set(progress.reasoning||[]);
  const draw=()=>{const item=course.reasoningPrompts[active];$("#app").innerHTML=`${pageHeader("Reasoning matters", "Explain Your Thinking", `Explain the ideas in ${escapeHtml(course.unit.unitTitle)} using scientific evidence, not only a final answer.`)}<div class="reasoning-tabs">${course.reasoningPrompts.map((entry,index)=>`<button class="${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-reasoning-index="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.difficulty)}</button>`).join('')}</div><div class="explain-layout"><section class="panel"><span class="eyebrow">Reasoning prompt</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt,"Listen to prompt")}<textarea id="reasoning-text" rows="9" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…"></textarea><button class="button primary" id="check-reasoning-text" type="button">Check scientific ideas</button><div id="reasoning-text-feedback"></div></section><section class="panel"><h3>Key ideas</h3><ul class="checklist">${item.keyIdeas.map((idea)=>`<li>${escapeHtml(idea)}</li>`).join('')}</ul><details><summary>Show model explanation</summary><p>${escapeHtml(item.modelAnswer)}</p>${voiceButton(item.modelAnswer,"Listen to model answer")}</details></section></div>`;$$('[data-reasoning-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.reasoningIndex);draw();}));$("#check-reasoning-text").addEventListener('click',()=>{const text=$("#reasoning-text").value.toLowerCase();const hits=reasoningHits(item.keyIdeas,text);const secure=text.length>30&&(hits>0||item.keyIdeas.length===0);$("#reasoning-text-feedback").innerHTML=`<p class="feedback ${secure?'good':'try'}"><span class="status-note">${secure?'Your explanation includes scientific evidence.':'Add more scientific evidence.'}</span> ${secure?escapeHtml(item.modelAnswer):`Use these ideas: ${escapeHtml(item.keyIdeas.join(', '))}.`}</p>`;if(secure){completed.add(item.id);progress.reasoning=[...completed];saveProgress();if(completed.size===course.reasoningPrompts.length)complete('explain','Reasoning explanations complete.');}});};
  draw();
}

// Explain Your Thinking as a deck: one reasoning prompt per slide, with the key
// ideas and the model explanation folded into disclosures beside the writing box
// rather than sitting in a second panel the learner has to look away to read.
//
// `item` is the name the narration gate expects: a reasoning unit has clips for
// `item.prompt` and `item.modelAnswer`.
function renderExplainThinkingDeck() {
  const esc = escapeHtml;
  const prompts = course.reasoningPrompts;
  const completed = new Set(progress.reasoning || []);
  const countLabel = () => `${completed.size} of ${prompts.length} explained`;

  const promptSlide = (item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Reasoning ${index + 1} of ${prompts.length} · ${esc(item.difficulty)}</span>
      <h3 class="gc-title">${esc(item.prompt)}</h3>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to prompt")}</div>
      <div class="wc-sentence">
        <small>Your explanation</small>
        <textarea data-response="reason-${esc(item.id)}" rows="6" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…" aria-label="Explanation for reasoning prompt ${index + 1}"></textarea>
      </div>
      <button class="gc-btn" type="button" data-check-reasoning="${esc(item.id)}">Check scientific ideas</button>
      <div data-feedback="reason-${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
      <details class="gc-practice"><summary>Key ideas to use</summary><ul class="checklist">${item.keyIdeas.map((idea) => `<li>${esc(idea)}</li>`).join("")}</ul></details>
      <details class="gc-practice"><summary>Show model explanation</summary><p class="gc-note">${esc(item.modelAnswer)}</p><div class="gc-actions">${deckVoiceSmall(item.modelAnswer, "Listen to model answer")}</div></details>
    </div></section>`;

  mountDeck({
    heading: "Reasoning matters",
    label: "Prompt",
    slides: prompts.map(promptSlide),
    emptyMessage: "No reasoning prompts in this unit yet.",
    tools: `<div class="wc-tools"><span class="status-chip" id="reason-count">${countLabel()}</span></div>`,
    onClick: (event) => {
      const target = event.target.closest("[data-check-reasoning]");
      if (!target) return undefined;
      const item = prompts.find((entry) => entry.id === target.dataset.checkReasoning);
      const text = slideValue(`reason-${item.id}`).toLowerCase();
      const hits = reasoningHits(item.keyIdeas, text);
      const secure = text.length > 30 && (hits > 0 || item.keyIdeas.length === 0);
      setSlideBox(`reason-${item.id}`, `<p class="feedback ${secure ? "good" : "try"}"><span class="status-note">${secure ? "Your explanation includes scientific evidence." : "Add more scientific evidence."}</span> ${secure ? esc(item.modelAnswer) : `Use these ideas: ${esc(item.keyIdeas.join(", "))}.`}</p>`);
      if (secure) {
        completed.add(item.id);
        progress.reasoning = [...completed];
        saveProgress();
        const counter = $("#reason-count");
        if (counter) counter.textContent = countLabel();
        if (completed.size === prompts.length) complete("explain", "Reasoning explanations complete.");
      }
      return undefined;
    },
  });
}

function renderLiveClass() {
  $("#app").innerHTML = `${pageHeader("Learn together", "Live Science Class", "Bring your model, one solved problem and one question for teacher-led instruction and group practice.")}
    <div class="live-grid"><article class="panel live-card"><time>Session 1 · 35 minutes</time><h2>Model the core ideas</h2><h3>Before class</h3><p>Bring one model or object connected to ${escapeHtml(course.unit.unitTitle)}.</p><h3>Class plan</h3><ol class="agenda"><li>Teacher demonstration: ${escapeHtml(course.concepts[0]?.title || course.unit.unitTitle)}</li><li>Partner model-building challenge</li><li>Discuss key words and methods</li><li>Error clinic and questions</li></ol><h3>After class</h3><p>Complete two Guided Practice items you previously found difficult.</p><button class="button primary" data-live-ready type="button">I’m ready for class</button></article><article class="panel live-card"><time>Session 2 · 35 minutes</time><h2>Apply and explain</h2><h3>Before class</h3><p>Bring one solved real-life problem and one reasoning question.</p><h3>Class plan</h3><ol class="agenda"><li>Fluency warm-up</li><li>${escapeHtml(course.concepts[1]?.title || "Concept")} investigation</li><li>Small-group application problems</li><li>Explain-your-thinking presentations</li></ol><h3>After class</h3><p>Revise one explanation and prepare for the Unit Challenge.</p><button class="button primary" data-live-ready type="button">I’m ready for class</button></article></div>`;
  $$('[data-live-ready]').forEach(button=>button.addEventListener("click",()=>{button.disabled=true;button.textContent="Ready ✓";if($$('[data-live-ready]').every(item=>item.disabled))complete("live","Live Math Class preparation complete.");}));
}

// The Unit Challenge passes at 60%, NOT at the 80% `assessment.passPercent` the
// page header calls the "approved mastery target". The two have always been
// different numbers here, and the section guide tells the learner the lower one
// ("passed with more than half"). Named because it is now read three times: the
// two section ticks below and the `passed` flag on the checkpoint this section
// emits. Those three have to move together, or a learner is told the challenge
// is complete while their teacher is shown a failed quiz for the same attempt.
const CHALLENGE_PASS_PERCENT = 60;

function renderAssessment() {
  assessmentIndex = 0;
  assessmentScore = 0;
  assessmentLocked = false;
  $("#app").innerHTML = `${pageHeader("Concept · fluency · reasoning · application", "Unit Challenge", `Answer ${course.assessment.questions.length} questions. The approved mastery target is ${course.assessment.passPercent}%.`)}<section class="panel quiz-shell" id="quiz-shell"></section>`;
  drawAssessmentQuestion();
}

function drawAssessmentQuestion() {
  const shell = $("#quiz-shell");
  if (assessmentIndex >= course.assessment.questions.length) {
    const percent = Math.round(assessmentScore / course.assessment.questions.length * 100);
    // The score itself, not just the tick. complete() records a boolean, so a
    // whole stage of Unit Challenges reached a teacher as done/not-done while
    // the percentage was computed here, printed on the page and thrown away —
    // the stage capstone quiz was the only number this subject ever emitted.
    //
    // This fires on EVERY finished attempt, including the ones under the pass
    // mark: an attempt that did not pass is the one a teacher most needs to
    // see, and complete() cannot carry it. `attempt` is persisted rather than
    // counted in a module variable, which would restart every learner at
    // attempt 1 after a reload.
    progress.challengeAttempts = (progress.challengeAttempts || 0) + 1;
    saveProgress();
    emitProgress({ type: "checkpoint.result", unit: PROGRESS_UNIT, section: "challenge", score: percent, passed: percent >= CHALLENGE_PASS_PERCENT, attempt: progress.challengeAttempts });
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${assessmentScore}/${course.assessment.questions.length}</div><span class="eyebrow">Checkpoint complete</span><h2>${percent >= course.assessment.passPercent ? "Mastery target reached" : "Review and try again"}</h2><p>You scored ${percent}%. Use the feedback to choose your next learning step.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-assessment" type="button">Try again</button><button class="button primary" id="finish-assessment" type="button">Continue →</button></div></div>`;
    $("#retry-assessment").addEventListener("click", renderAssessment);
    $("#finish-assessment").addEventListener("click", () => { if (percent >= CHALLENGE_PASS_PERCENT) complete("challenge"); navigate("progress"); });
    if (percent >= CHALLENGE_PASS_PERCENT) complete("challenge", "Unit Challenge recorded on this device.");
    return;
  }
  const item = course.assessment.questions[assessmentIndex];
  shell.innerHTML = `<div class="quiz-top"><span>Question ${assessmentIndex + 1} of ${course.assessment.questions.length}</span><strong>${assessmentScore} correct</strong></div><div class="progress-track"><span style="width:${assessmentIndex / course.assessment.questions.length * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(item.question)}</h2>${voiceButton(item.question, "Listen to question")}<div class="quiz-options">${shuffled(item.options).map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback"></div><button class="button primary" id="next-question" type="button" hidden>Next question →</button>`;
  bindVoiceControls();
  updateVoiceUI();
  assessmentLocked = false;
  $$('[data-option]').forEach((button) => button.addEventListener("click", () => {
    if (assessmentLocked) return;
    assessmentLocked = true;
    const correct = button.dataset.option === item.answer;
    if (correct) assessmentScore += 1;
    $$('[data-option]').forEach((candidate) => { candidate.disabled = true; if (candidate.dataset.option === item.answer) candidate.classList.add("correct"); });
    button.classList.add(correct ? "correct" : "incorrect");
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(item.explanation)}</p>`;
    $("#next-question").hidden = false;
    $("#next-question").addEventListener("click", () => { assessmentIndex += 1; drawAssessmentQuestion(); });
  }));
}

function renderGradeCapstone() {
  const project = gradeCapstone.project;
  const savedStages = Object.keys(gradeProgress.capstoneResponses).filter((id) => gradeProgress.capstoneResponses[id]?.trim().length >= 20).length;
  const savedEvidence = Object.values(gradeProgress.capstoneEvidence).filter(Boolean).length;
  $("#app").innerHTML = `${pageHeader(`All ${manifest.units.length} units · authentic application`, `${course.stage.label} Science Capstone`, gradeCapstone.overview)}
    <section class="capstone-hero"><div><span class="eyebrow">Driving question</span><h2>${escapeHtml(project.drivingQuestion)}</h2><p>${escapeHtml(project.finalProduct)}</p>${voiceButton(`${project.drivingQuestion} ${project.finalProduct}`, "Listen to the capstone")}</div><div class="capstone-score"><strong>${savedStages}/${project.stages.length}</strong><span>stages documented</span><small>${savedEvidence}/${project.evidenceChecklist.length} evidence items ready</small></div></section>
    <div class="capstone-stage-grid">${project.stages.map((stage) => `<article class="panel capstone-stage ${gradeProgress.capstoneResponses[stage.id]?.trim().length >= 20 ? "complete" : ""}"><span class="eyebrow">Units ${stage.units.join(", ")}</span><h2>${escapeHtml(stage.title)}</h2><p>${escapeHtml(stage.prompt)}</p>${voiceButton(stage.prompt, `Listen to ${stage.title}`)}<label for="capstone-${stage.id}">Record your plan or evidence</label><textarea id="capstone-${stage.id}" data-capstone-response="${stage.id}" rows="5" placeholder="Write what you made, calculated or discovered…">${escapeHtml(gradeProgress.capstoneResponses[stage.id] || "")}</textarea><small><span class="field-label">Evidence:</span> ${escapeHtml(stage.evidence)}</small></article>`).join("")}</div>
    <div class="capstone-review-grid"><section class="panel"><h2>Evidence checklist</h2><div class="capstone-checklist">${project.evidenceChecklist.map((item, index) => `<label><input type="checkbox" data-capstone-evidence="${index}" ${gradeProgress.capstoneEvidence[index] ? "checked" : ""}> <span>${escapeHtml(item)}</span></label>`).join("")}</div><button class="button primary" id="save-capstone" type="button">Save capstone progress</button></section><section class="panel"><h2>Success rubric</h2><div class="rubric-list">${project.rubric.map((item) => `<article><strong>${escapeHtml(item.criterion)}</strong><p>${escapeHtml(item.secure)}</p></article>`).join("")}</div></section></div>`;
  $("#save-capstone").addEventListener("click", () => {
    $$('[data-capstone-response]').forEach((field) => { gradeProgress.capstoneResponses[field.dataset.capstoneResponse] = field.value.trim(); });
    $$('[data-capstone-evidence]').forEach((field) => { gradeProgress.capstoneEvidence[field.dataset.capstoneEvidence] = field.checked; });
    const stagesDone = project.stages.every((stage) => (gradeProgress.capstoneResponses[stage.id] || "").length >= 20);
    const evidenceDone = project.evidenceChecklist.every((_, index) => gradeProgress.capstoneEvidence[index]);
    saveGradeProgress();
    // The work itself, not a pointer to it. capstone.submitted used to carry
    // artifactRef: `local:${STAGE_STORAGE_KEY}` — a key in THIS browser's
    // storage, naming something nobody else could fetch. Nothing uploaded what
    // it pointed at, so a whole stage's authentic assessment never left the
    // device, and a teacher saw neither the text nor a tick. Wiping the browser
    // erased it.
    //
    // draft.saved is the contract's existing channel for written work and the
    // ingest already stores it per unit (unit.drafts), so each stage travels as
    // one draft under unit "capstone" — no new event type, no server change.
    //
    // Emitted on EVERY save, not only on completion: a capstone abandoned
    // half-written is precisely the one worth seeing. Empty stages are skipped
    // so an untouched capstone sends nothing at all.
    for (const stage of project.stages) {
      const text = gradeProgress.capstoneResponses[stage.id] || "";
      if (!text) continue;
      emitProgress({
        type: "draft.saved", unit: "capstone", section: `capstone:${stage.id}`, text,
        words: text.trim().split(/\s+/).filter(Boolean).length,
      });
    }
    if (stagesDone && evidenceDone) {
      // No artifactRef: there is no artifact store, and a field that names a
      // device key reads as though there were. Omitted, the ingest records null
      // and the event keeps the one thing it can honestly say — that this
      // learner finished, and when.
      emitProgress({ type: "capstone.submitted", unit: "capstone" });
      completeGradeSection("capstone", `${course.stage.label} Science Capstone completed.`);
    }
    else toast("Progress saved. Complete every stage and evidence item to finish the capstone.");
    renderGradeCapstone();
  });
}

function renderCapstoneQuiz() {
  capstoneQuizIndex = 0;
  capstoneQuizScore = 0;
  capstoneQuizLocked = false;
  const quiz = gradeCapstone.quiz;
  $("#app").innerHTML = `${pageHeader(`${quiz.questions.length} questions · all ${manifest.units.length} units`, `${course.stage.label} Capstone Quiz`, `Show what you know across the complete ${course.stage.label} course. The mastery target is ${quiz.passPercent}%.`)}<section class="panel quiz-shell" id="capstone-quiz-shell"></section>`;
  drawCapstoneQuizQuestion();
}

function drawCapstoneQuizQuestion() {
  const quiz = gradeCapstone.quiz;
  const shell = $("#capstone-quiz-shell");
  if (capstoneQuizIndex >= quiz.questions.length) {
    const percent = Math.round(capstoneQuizScore / quiz.questions.length * 100);
    gradeProgress.quizBest = Math.max(gradeProgress.quizBest || 0, percent);
    saveGradeProgress();
    emitProgress({ type: "checkpoint.result", unit: "capstone", section: "quiz", score: percent, passed: percent >= quiz.passPercent, attempt: 1 });
    if (percent >= quiz.passPercent) completeGradeSection("capstonequiz", `${course.stage.label} Capstone Quiz mastery recorded.`);
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${capstoneQuizScore}/${quiz.questions.length}</div><span class="eyebrow">Stage capstone quiz complete</span><h2>${percent >= quiz.passPercent ? `${course.stage.label} mastery target reached` : "Review the highlighted units and try again"}</h2><p>You scored ${percent}%. Your best score on this device is ${gradeProgress.quizBest}%.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-capstone-quiz" type="button">Try again</button><button class="button primary" id="open-grade-capstone" type="button">Open Stage Capstone →</button></div></div>`;
    $("#retry-capstone-quiz").addEventListener("click", renderCapstoneQuiz);
    $("#open-grade-capstone").addEventListener("click", () => navigate("capstone"));
    return;
  }
  const item = quiz.questions[capstoneQuizIndex];
  shell.innerHTML = `<div class="quiz-top"><span>Question ${capstoneQuizIndex + 1} of ${quiz.questions.length}</span><strong>${capstoneQuizScore} correct</strong></div><div class="progress-track"><span style="width:${capstoneQuizIndex / quiz.questions.length * 100}%"></span></div><span class="eyebrow">Unit ${item.unitNo}: ${escapeHtml(item.unitTitle)}</span><h2 class="quiz-question">${escapeHtml(item.question)}</h2>${voiceButton(item.question, "Listen to question")}<div class="quiz-options">${shuffled(item.options).map((option) => `<button class="quiz-option" data-capstone-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="capstone-quiz-feedback"></div><button class="button primary" id="next-capstone-question" type="button" hidden>Next question →</button>`;
  bindVoiceControls();
  updateVoiceUI();
  capstoneQuizLocked = false;
  $$('[data-capstone-option]').forEach((button) => button.addEventListener("click", () => {
    if (capstoneQuizLocked) return;
    capstoneQuizLocked = true;
    const correct = button.dataset.capstoneOption === item.answer;
    if (correct) capstoneQuizScore += 1;
    $$('[data-capstone-option]').forEach((candidate) => { candidate.disabled = true; if (candidate.dataset.capstoneOption === item.answer) candidate.classList.add("correct"); });
    button.classList.add(correct ? "correct" : "incorrect");
    $("#capstone-quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct!" : "Not quite."}</span> ${escapeHtml(item.explanation)}</p>`;
    $("#next-capstone-question").hidden = false;
    $("#next-capstone-question").addEventListener("click", () => { capstoneQuizIndex += 1; drawCapstoneQuizQuestion(); });
  }));
}

function renderReference() {
  const ref = course.reference;
  const terms = ref.terms.map(([term, meaning]) => `<tr><td><strong>${escapeHtml(term)}</strong></td><td>${escapeHtml(meaning)}</td></tr>`).join("");
  const misconceptions = (ref.commonMistakes || []).length
    ? `<section class="panel misconception-panel"><h2>Common misconceptions</h2><p class="panel-sub">What learners often think — and what is really true.</p>${ref.commonMistakes.map(([wrong, right]) => `<div class="misconception"><div class="misc-wrong"><span class="misc-tag">✗ Many think</span><p>${escapeHtml(wrong)}</p></div><div class="misc-right"><span class="misc-tag ok">✓ Actually</span><p>${escapeHtml(right)}</p></div></div>`).join("")}</section>`
    : "";
  const connections = (ref.connections || []).length
    ? `<section class="panel connection-panel"><h2>How this connects</h2><p class="panel-sub">Where else you meet these ideas.</p><div class="connection-list">${ref.connections.map((c) => `<article class="connection"><strong>${escapeHtml(c.area)}</strong><span>${escapeHtml(c.text)}</span></article>`).join("")}</div></section>`
    : "";
  const rules = (ref.rules || []).length
    ? `<div class="reference-grid">${ref.rules.map((rule) => `<article class="panel rule-card"><h2>${escapeHtml(rule.title)}</h2><p>${escapeHtml(rule.text)}</p></article>`).join("")}</div>`
    : "";
  $("#app").innerHTML = `${pageHeader("Keep beside you", "Quick reference", `Key words, common misconceptions and connections for Unit ${course.unit.unitNo}.`)}
    ${rules}
    ${misconceptions}
    ${connections}
    <section class="panel" style="margin-top:18px"><h2>Vocabulary</h2><table class="term-table"><thead><tr><th>Word</th><th>Meaning</th></tr></thead><tbody>${terms}</tbody></table></section>
    <p><button class="button primary" id="reference-done" type="button">Reference reviewed ✓</button></p>`;
  $("#reference-done").addEventListener("click", () => complete("reference", "Reference reviewed."));
}

function buildTutorReply(message) {
  const lower = message.toLowerCase();
  if (/answer|quiz/.test(lower)) return `I can give a hint, but I will not choose a checkpoint answer. Start by naming the Unit ${course.unit.unitNo} concept and the evidence you can see.`;
  if (/easier|simpler/.test(lower)) return `Let us simplify it. ${course.concepts[0]?.explanation || course.reference.rules[0]?.text}`;
  if (/visual|model|picture/.test(lower)) return `Try this model: ${course.visualModels[0]?.title}. ${course.visualModels[0]?.purpose}`;
  const term = course.reference.terms.find(([name])=>lower.includes(name.toLowerCase().split(/[ /]/)[0]));
  if (term) return `${term[0]} means ${term[1]}. Now use that meaning to identify the first step.`;
  return `This unit is about ${course.unit.unitTitle}. A useful rule is: ${course.reference.rules[0]?.text || course.concepts[0]?.explanation} Tell me which step is difficult and I will give one hint.`;
}

// Every option the Wehel panel needs, shared by the nav section and the
// shell's floating dock so both mount the same tutor over the same store.
function wehelOptions() {
  const fw = cambridgeFramework(stageNumber);
  return {
    // modules: what the Focus control offers — this unit's teaching pages, from
    // the same list the nav is built from. A prerequisite unit is the placement
    // exam, which has no modules to focus.
    meta: { subject: "science", subjectLabel: "Science", grade: stageNumber, cambridgeCode: `${fw.level} ${fw.code}`, unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle, courseOutline: outlineFromManifest(manifest), unit: course, modules: modulesFromSections(isPrereqUnit ? [] : sections) },
    store: progress,
    ui: { escapeHtml, toast, voiceButton, bindVoiceControls },
    tutorLabel: "Wehel Tutor",
    placeholder: `Ask about ${course.unit.unitTitle}…`,
    quickPrompts: [
      { label: "Explain more simply", message: "Can you explain the first concept in this unit in a simpler way?" },
      { label: "Quiz me", message: "Quiz me on this unit, one question at a time." },
      { label: "Go deeper", message: "Tell me something amazing that goes deeper than this unit." },
      { label: "Help with homework", message: "Can you help me with my homework about this unit?" },
    ],
    fallbackReply: buildTutorReply,
    onExchange: (count) => { if (count >= 2) complete("ai"); },
    fetchUnit: unitFetcher(manifest, dataRootUrl),
    onSaved: saveProgress,
  };
}

function renderAI() {
  $("#app").innerHTML = `${pageHeader("Your AI subject expert", "Wehel Tutor — Science", "Ask questions, go deeper, get quizzed, role-play a scientist or get homework help — by text or voice.", "Wehel Tutor · Ehel Academy AI")}
    <div class="overview-grid"><section class="panel" id="wehel-chat"></section><aside class="section-stack"><section class="panel"><h3>What Wehel Tutor can do</h3><ul class="checklist"><li>Explain this unit more simply — or go deeper</li><li>Quiz you and check your thinking</li><li>Role play and learning games</li><li>Help with homework without doing it for you</li></ul></section><section class="panel"><h3>Learning boundaries</h3><ul class="checklist"><li>Hints before answers</li><li>Unit content first</li><li>Easier questions when needed</li><li>Checkpoint choices stay yours</li></ul></section></aside></div>`;
  mountWehelChat({ container: $("#wehel-chat"), ...wehelOptions() });
}

function renderReflect() {
  const choices = ["Not yet", "With help", "By myself"];
  $("#app").innerHTML = `${pageHeader("Mastery and next steps", "My Science Progress", "Reflect on each outcome and see which learning steps you have completed.")}
    <section class="panel progress-summary"><div><strong>${unitSectionIds().filter((id) => progress.completed.includes(id)).length}/${unitSectionIds().length}</strong><span>unit learning steps complete</span></div><div class="progress-track"><span style="width:${Math.round(unitSectionIds().filter((id) => progress.completed.includes(id)).length/unitSectionIds().length*100)}%"></span></div></section>
    <section class="panel grade-progress-strip"><div><strong>${gradeProgress.completed.includes("capstone") ? "Complete" : "In progress"}</strong><span>Stage Capstone</span></div><div><strong>${gradeProgress.quizBest || 0}%</strong><span>Capstone Quiz best</span></div><button class="button secondary" data-go="capstone" type="button">View stage capstone</button></section>
    <section class="panel"><div class="self-list">${course.selfAssessment.map((statement, index) => `<div class="self-row"><strong>${escapeHtml(statement)}</strong>${choices.map((choice) => `<button class="self-choice ${progress.reflection[index] === choice ? "selected" : ""}" data-reflect="${index}" data-choice="${choice}" type="button">${choice}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="save-reflection" type="button">Save reflection ✓</button></p></section>`;
  $$('[data-reflect]').forEach((button) => button.addEventListener("click", () => { progress.reflection[button.dataset.reflect] = button.dataset.choice; saveProgress(); renderReflect(); }));
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  $("#save-reflection").addEventListener("click", () => {
    if (Object.keys(progress.reflection).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("progress", "Science progress reflection saved on this device.");
  });
}

function renderTeacher() {
  $("#app").innerHTML = `${pageHeader("Planning · evidence · intervention", "Teacher Resources", "Inspect source provenance, approved content coverage and learner evidence.")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Curriculum status</h2><p><strong>${escapeHtml(cambridgeLabel(stageNumber))}.</strong> Content, progression, answer guidance and the 80% mastery threshold follow this framework. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
      <section class="panel"><h2>Workbook provenance</h2><table class="term-table"><tbody><tr><th>Framework</th><td>${escapeHtml(course.provenance.framework || cambridgeLabel(stageNumber))}</td></tr><tr><th>Package</th><td>${escapeHtml(course.provenance.contentPackage)}</td></tr><tr><th>Archive</th><td>${escapeHtml(course.provenance.sourceArchive)}</td></tr><tr><th>Documents</th><td>${course.provenance.sourceDocuments.map(escapeHtml).join("; ")}</td></tr><tr><th>Imported blocks</th><td>${course.provenance.sourceBlockCount}</td></tr><tr><th>Transformation</th><td>${escapeHtml(course.provenance.transformation)}</td></tr></tbody></table></section>
      <section class="panel"><h2>Coverage</h2><div class="stat-row"><div class="stat"><strong>${course.outcomes.length}</strong><small>outcomes</small></div><div class="stat"><strong>${course.workedExamples.length}</strong><small>worked examples</small></div><div class="stat"><strong>${course.assessment.questions.length}</strong><small>checkpoint items</small></div></div></section>
      <section class="panel"><h2>Suggested teaching resources</h2><div class="reference-grid"><div><h3>Manipulatives</h3><p>${escapeHtml(course.activities.map((item)=>item.materials).slice(0,3).join('; '))}.</p></div><div><h3>Evidence to collect</h3><p>Model-building accuracy, Guided Practice responses, activity notes, game mastery, real-problem calculations and reasoning explanations.</p></div></div></section>
      <section class="panel"><h2>Lesson delivery</h2><p><span class="status-note">ElevenLabs narration is active.</span> Learners can listen to the complete structured concept lesson or read it independently.</p></section>
    </div>`;
}
// ===================== config + boot =====================
const config = {
  subjectKey: "science",
  param: "stage",
  mediaSubject: "science",
  ttsPurpose: "ehel_science",
  sections,
  nonCountable: ["overview", "capstone", "capstonequiz", "year-plan", "unit-plan"],
  gradeSections: ["capstone", "capstonequiz"],
  progressDefaults: { completed: [], practiceOpened: [], reflection: {}, aiMessages: [], games: {}, challengeAttempts: 0 },
  gradeDefaults: { completed: [], capstoneResponses: {}, capstoneEvidence: {}, quizBest: 0 },
  keys: (s, u) => ({
    progress: `ehel-sci-s${s}-u${u}-progress-v1`,
    grade: `ehel-sci-s${s}-capstone-progress-v1`,
    legacyProgress: `ehel-sci-g${s}-u${u}-progress-v1`,
    legacyGrade: `ehel-sci-g${s}-capstone-progress-v1`,
  }),
  courseKey: (s) => `ehel-sci-g${pad2(s)}`,
  extendSummary: (progress, base) => ({ ...base, knownWords: progress.knownWords ? [...progress.knownWords] : undefined }),
  visibleSections: () => (isPrereqUnit
    ? [["overview", "layout-dashboard", "Unit Overview"], ["placement", "clipboard-check", "Placement exam"], ["year-plan", "calendar-days", "Stage Study Plan"]]
    : sections),
  renderers: {
    overview: () => (isPrereqUnit ? placement.renderOverview() : renderOverview()),
    placement: () => (isPrereqUnit ? placement.renderExam() : navigate("overview")),
    "year-plan": () => (isPrereqUnit ? renderStudyPlan({
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, navigate }),
      stageLabel: `Stage ${prereqStage}`,
      subjectLabel: "Science",
      planName: "Stage Study Plan",
      units: () => manifest.units,
      examLabel: () => "Placement exam",
      firstUnitNumber: 1,
      firstUnitHref: (route = "overview") => `?stage=${prereqStage}&unit=1#${route}`,
      rhythm: [
        ["Day 1", "Lesson", "Read the lesson and meet the unit's science words."],
        ["Day 2", "Explore", "Explore the concept and study the visual models."],
        ["Day 3", "Method", "Learn the method and walk the worked examples."],
        ["Day 4", "Practice", "Do guided practice, experiments and real problems."],
        ["Day 5", "Check", "Play the games, build fluency and take the unit challenge."],
      ],
      finalRow: () => (manifest.finalAssessment ? { title: `Stage capstone project & ${manifest.finalAssessment.title}`, note: `${manifest.finalAssessment.questionCount} questions, mastery at ${manifest.finalAssessment.passPercent}%` } : null),
    }) : navigate("overview")),
    "unit-plan": () => (isPrereqUnit ? navigate("overview") : renderUnitStudyPlan({
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, navigate }),
      stageLabel: `Stage ${stageNumber}`,
      unitNumber: course.unit.unitNo,
      unitTitle: course.unit.unitTitle,
      units: () => manifest.units,
      // The unit's own teaching walk, minus the entries that are not steps of
      // it: the overview, this plan, the stage-level capstone pages, the live
      // class and the progress report.
      planSections: () => sections.filter(([id]) => !["overview", "unit-plan", "capstone", "capstonequiz", "live", "progress"].includes(id)),
    })),
    lesson: renderLesson, ai: renderAI, words: renderScienceWords,
    explore: renderExploreConcept, visuals: renderVisualModels, method: renderLearnMethod,
    examples: renderExamples, guided: renderPractice, reference: renderReference, activities: renderActivities,
    games: renderGames, fluency: renderFluency, problems: renderRealProblems, explain: renderExplainThinking,
    challenge: renderAssessment, capstone: renderGradeCapstone, capstonequiz: renderCapstoneQuiz,
    live: renderLiveClass, progress: renderReflect,
    teacher: () => (isPrereqUnit ? placement.renderTeacher() : renderTeacher()),
  },
  bind,
  wehelOptions,
  // A deck takes the whole viewport while it is mounted; leaving the section has
  // to give it back, or the next page renders inside a full-bleed shell.
  onBeforeRender: () => { document.body.classList.remove("gc-full"); classicRegion = null; deckMount = null; showScienceWordInDeck = null; },
  async load(ctx) {
    const s = ctx.stageNumber, u = ctx.unitNumber;
    if (isPrereqUnit) {
      const [m, p] = await Promise.all([
        fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
        fetch(new URL("placement-exam.json", ctx.dataRootUrl)),
      ]);
      if (!m.ok || !p.ok) throw new Error("The Science placement exam could not be loaded.");
      const [prereqManifest, exam] = await Promise.all([m.json(), p.json()]);
      placementExam = exam;
      return { manifest: prereqManifest, course: placementCourseShell(prereqManifest, exam) };
    }
    if (s < 1 || s > 8 || u < 1) throw new Error(`The requested Stage ${s} Science unit is unavailable.`);
    const [m, c, cap] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${u}.json`, ctx.dataRootUrl)),
      fetch(new URL("grade-capstone.json", ctx.dataRootUrl)),
    ]);
    if (!m.ok || !c.ok || !cap.ok) throw new Error("The Science course package could not be loaded.");
    const [manifest, course, gradeCapstone] = await Promise.all([m.json(), c.json(), cap.json()]);
    return { manifest, course, gradeCapstone };
  },
  async onReady(ctx) {
    const course = ctx.course, manifest = ctx.manifest, esc = ctx.escapeHtml, s = ctx.stageNumber, u = ctx.unitNumber;
    const stage = course.stage || course.grade;
    if (isPrereqUnit && !["overview", "placement", "year-plan", "teacher"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && ["placement", "year-plan"].includes(location.hash.slice(1))) location.hash = "overview";
    document.title = `${stage.label} Science | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    ctx.$("#course-label").textContent = `${stage.label} · ${course.subject} · ${course.term.label}`;
    ctx.$("#unit-title").textContent = course.unit.unitTitle;
    ctx.$("#stage-select").innerHTML = Array.from({ length: 8 }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === s ? "selected" : ""}>Stage ${n}</option>`).join("");
    ctx.$("#stage-select").addEventListener("change", () => { location.href = `?stage=${Number(ctx.$("#stage-select").value)}&unit=1#overview`; });
    // The Study Plan rides in the unit picker under the Prerequisite
    // entry, one press away from anywhere in the course. Its option value is a
    // route, not a unit number — the change handler routes it.
    const onYearPlan = isPrereqUnit && location.hash.slice(1) === "year-plan";
    const unitOptions = [
      `<option value="${PREREQ_UNIT}" ${isPrereqUnit && !onYearPlan ? "selected" : ""}>Prerequisite: Placement exam</option>`,
      `<option value="year-plan" ${onYearPlan ? "selected" : ""}>Stage Study Plan</option>`,
      ...manifest.units.map((unit) => `<option value="${unit.number}" ${unit.number === u ? "selected" : ""}>Unit ${unit.number}: ${esc(unit.title)}</option>`),
    ].join("");
    for (const picker of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) picker.innerHTML = unitOptions;
    for (const picker of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) picker.addEventListener("change", () => { location.href = picker.value === "year-plan" ? `?stage=${s}&unit=${PREREQ_UNIT}#year-plan` : `?stage=${s}&unit=${Number(picker.value)}#overview`; });
  },
};

createCourseApp(config);
