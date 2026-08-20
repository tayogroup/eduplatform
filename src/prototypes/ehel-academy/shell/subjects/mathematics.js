// Mathematics subject module for the unified course-app shell (P1.5).
// The scaffolding (boot/data/nav/voice/progress/layout) lives in
// ../course-app.js. This module provides the section renderers — kept BYTE-FOR-
// BYTE from the original mathematics/shared/course-ui.js — plus the subject
// config. Renderers use shell services through `let` bindings that bind(ctx)
// populates, so their bodies are unchanged.
import { initGeometryWebGL } from "../../mathematics/shared/geometry-webgl.js?v=20260715q";
import { initMathWebGL } from "../../mathematics/shared/math-webgl.js?v=math-20260801a";
import { unitTopic, mathDiagram } from "../../mathematics/shared/math-visuals.js?v=math-20260801a";
import { createCourseApp } from "../course-app.js?v=t2";
import { createDeck, deckIcon } from "../deck.js?v=deck-1";
import { createPlacementUnit, placementCallout, placementCourseShell, PREREQ_UNIT } from "../placement.js?v=placement-1";
import { renderStudyPlan, renderUnitStudyPlan } from "../study-plan.js?v=study-plan-2";
import { mountWehelChat, modulesFromSections, outlineFromManifest, unitFetcher } from "../wehel.js?v=wehel-3";

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
let $, $$, escapeHtml, icon, voiceButton, pageHeader, toast;
let complete, completeGradeSection, saveProgress, saveGradeProgress, navigate, emitProgress;
let bindVoiceControls, updateVoiceUI, stopVoice, renderNav, unitSectionIds, stageNumber, STAGE_STORAGE_KEY;
let course, progress, gradeProgress, manifest, gradeCapstone, dataRootUrl;
let shellCtx;
function bind(ctx) {
  ({ $, $$, escapeHtml, icon, voiceButton, pageHeader, toast, complete, completeGradeSection,
     saveProgress, saveGradeProgress, navigate, emitProgress, bindVoiceControls, updateVoiceUI,
     stopVoice, renderNav, unitSectionIds, stageNumber, STAGE_STORAGE_KEY } = ctx);
  shellCtx = ctx;
  course = ctx.course; progress = ctx.progress; gradeProgress = ctx.gradeProgress;
  manifest = ctx.manifest; gradeCapstone = ctx.gradeCapstone; dataRootUrl = ctx.dataRootUrl;
  if (isPrereqUnit) {
    placement = createPlacementUnit({
      storageKey: `ehel-math-s${prereqStage}-placement-exam-v1`,
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

// Subject config (were module-scope in the original).
// Concept explanations and worked solutions carry the full source prose, with
// paragraphs separated by a blank line. Render one <p> per paragraph so a long
// explainer stays readable; a single escaped <p> would run it all together.
function richText(value = "", className = "") {
  const attr = className ? ` class="${className}"` : "";
  return String(value)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p${attr}>${escapeHtml(part)}</p>`)
    .join("");
}

// Narration reads the prose straight through, so collapse the paragraph breaks
// into sentence pauses rather than feeding literal newlines to the voice engine.
function spokenText(value = "") {
  return String(value).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).join(" ");
}

function cambridgeFramework(stage) {
  return Number(stage) <= 6
    ? { level: "Cambridge Primary Mathematics", code: "0096" }
    : { level: "Cambridge Lower Secondary Mathematics", code: "0862" };
}
function cambridgeLabel(stage) { const fw = cambridgeFramework(stage); return `${fw.level} ${fw.code} — Stage ${stage}`; }

// Per-render mutable state (module-scoped, as before).
let assessmentIndex = 0, assessmentScore = 0, assessmentLocked = false;
let activeGameId = null, gameRoundIndex = 0, gameScore = 0, gameLocked = false, gameSelection = [];
let capstoneQuizIndex = 0, capstoneQuizScore = 0, capstoneQuizLocked = false;

const sections = [
  ["overview", "layout-dashboard", "Unit Overview"],
  // Per-unit Student Study Plan: what the learner does on each day of this
  // unit's calendar weeks, rendered by the shared shell/study-plan.js. A
  // reference page, not a step — in nonCountable, so it never counts toward
  // the unit's 100%. The grade-level plan of the same name lives on the
  // Prerequisite unit; this one plans the unit the learner is inside.
  ["unit-plan", "calendar-days", "Student Study Plan"],
  // "The Lesson", not "Teacher Lesson". These courses are self-paced, and a
  // learner working alone should not be told the explainer belongs to someone
  // else. Computing and Global Perspectives renamed theirs for that reason;
  // this is the same section and the same argument.
  ["lesson", "book-open", "The Lesson"],
  ["words", "braces", "Math Words & Symbols"],
  ["explore", "scan-search", "Explore the Concept"],
  ["visuals", "shapes", "Visual Models"],
  ["method", "list-checks", "Learn the Method"],
  ["examples", "copy-check", "Worked Examples"],
  ["guided", "lightbulb", "Guided Practice"],
  ["activities", "blocks", "Activities"],
  ["games", "gamepad-2", "Games"],
  ["fluency", "star", "Math Fluency"],
  ["problems", "hand-heart", "Solve Real Problems"],
  ["explain", "messages-square", "Explain Your Thinking"],
  ["challenge", "badge-check", "Unit Challenge"],
  ["capstone", "palette", "Stage Capstone"],
  ["capstonequiz", "circle-help", "Capstone Quiz"],
  ["live", "video", "Live Math Class"],
  ["progress", "badge-check", "My Math Progress"]
];
const sectionLabel = (id) => (sections.find(([sid]) => sid === id) || [null, null, id])[2];

// ===================== the guides: overview, page, deck =====================
// The same three surfaces English carries (english.js :: SECTION_HINTS,
// SECTION_GUIDES, DECK_INTROS): one line per section under the overview's
// checklist, a teacher's walk through each page at the top of it, and an
// instruction slide in front of each Stage 1-4 deck. Each line is written from
// the section's own completion rule — every discovery answered, every method
// stepped through, all twelve solutions opened, 80% of the sprint, more than
// half the challenge — and the counts come from the unit's fields, so the guide
// cannot promise what the page does not hold.
const SECTION_HINTS = {
  lesson: "Read the concepts, or press Listen to hear them, then press “I studied the concepts”.",
  words: "Learn the words and the five symbols, then press “I know these words and symbols”.",
  explore: "Answer the discovery question in every situation. Each one you get right is ticked.",
  visuals: "Look at every model — turn them, count them — then press “I explored the models”.",
  method: "Step through every method with “Show me the next step” until each says Method complete.",
  examples: "Open “Show worked solution” on all twelve examples.",
  guided: "Type your answer to every practice question and press “Check my answer”. Hints are there if you need them.",
  activities: "Do each activity and press “Mark complete”, then “Finish activities”.",
  games: "Play every game until it is mastered — every star lit.",
  fluency: "Answer the sprint questions quickly. Get most of them right — you can run it again.",
  problems: "Solve every real-world problem: show your calculation and press “Check answer”.",
  explain: "Write an explanation for every prompt using the key ideas, and press “Check mathematical ideas”.",
  challenge: "Answer all the questions. Get more than half right to pass. You can try again.",
  live: "Read the plan for each class and press “I'm ready for class” on every one.",
  progress: "Choose an answer for every statement, then press “Save reflection”.",
};

const numberWord = (n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);
const listTitles = (items, key = "title") => items.map((item) => `“${item[key]}”`).join(", ");
const SECTION_GUIDES = {
  lesson: () => ({
    steps: [
      `The lesson has ${course.concepts.length} concepts. Each one is a short explanation with an example.`,
      "Read each concept slowly. Press Listen to hear it read to you.",
      "Say the example out loud, and try it with your own numbers or objects.",
      "Read every concept before you press the button.",
    ],
    finish: "Press “I studied the concepts” at the bottom. Then Wehel Tutor opens, so you can ask about anything you did not understand.",
  }),
  words: () => ({
    steps: [
      "This page has the math words for this unit, and the five symbols every unit uses: + − = < >.",
      "Read each word and what it means. Press Listen to hear it.",
      "Read what each symbol means and when you use it. Say it out loud: “plus means combine or add”.",
    ],
    finish: "Press “I know these words and symbols” at the bottom.",
  }),
  explore: () => ({
    steps: [
      `There are ${course.explorations.length} discoveries, each in a familiar place — ${listTitles(course.explorations)}.`,
      "Press a numbered tab to open a discovery. Read the situation and look at the picture or model.",
      "Read the discovery question. Think, then type your idea in the box and press “Check my idea”.",
      "If it says “Look again”, press “Hint” and try once more. When it says “Exactly!”, the tab gets a tick.",
      "Do all of them.",
    ],
    finish: `This section is finished when every one of the ${course.explorations.length} discovery questions has been answered right.`,
  }),
  visuals: () => ({
    steps: [
      `There are ${course.visualModels.length} visual models — pictures and 3D shapes of the ideas in this unit.`,
      "Look at each model. If it moves, drag it to turn it and press its buttons to change it.",
      "Read the caption under each one and press Listen to hear it.",
    ],
    finish: "Press “I explored the models” at the bottom.",
  }),
  method: () => ({
    steps: [
      `There are ${course.methods.length} methods — ways to work things out step by step.`,
      "Read the first step of a method. Then press “Show me the next step” to see the next one.",
      "Keep pressing until the button says “Method complete”. Say each step out loud as you go.",
      "Do this for every method.",
    ],
    finish: `This section is finished when all ${course.methods.length} methods have been stepped through to the end.`,
  }),
  examples: () => ({
    steps: [
      `There are ${course.workedExamples.length} worked examples. Each one is a question with the full working shown.`,
      "Read the question first and try it yourself.",
      "Then press “Show worked solution” and compare your working with the solution, line by line.",
      "The counter at the top shows how many solutions you have opened. Open all of them.",
    ],
    finish: `This section is finished when all ${course.workedExamples.length} worked solutions have been opened.`,
  }),
  guided: () => ({
    steps: [
      `There are ${course.practice.length} practice questions.`,
      "Read a question. Work it out on paper or in your head.",
      "Type your answer in the box and press “Check my answer”. Show your working if you like — the checker looks for the numbers.",
      "Stuck? Press “Give me a hint” — you get up to three hints. “Show next step” shows one line of the working.",
      "Do this for every question until each one says “Correct reasoning!”.",
    ],
    finish: `This section is finished when all ${course.practice.length} questions have been answered right.`,
  }),
  activities: () => ({
    steps: [
      `There are ${course.activities.length} hands-on activities. Each one tells you what to use and what to do.`,
      "Read the activity and press Listen to hear it. Get the materials it names.",
      "Do the activity. Write your answer, or what you noticed, in the box.",
      "Press “Mark complete” under each activity when you have done it.",
    ],
    finish: "Press “Finish activities” at the bottom when every activity is marked complete.",
  }),
  games: () => {
    const pack = activeGamePack();
    const stars = numberWord(pack.masteryScore);
    return {
      steps: [
        `There are ${pack.games.length} games. Press “Start game” on one.`,
        "Answer each round. You earn a star for every round you get right.",
        `A game is mastered at ${stars} stars. Press “Play again” to earn more.`,
        "Master every game.",
      ],
      finish: `This section finishes by itself when every game has ${stars} stars.`,
    };
  },
  fluency: () => {
    const total = course.fluency?.length ?? 0;
    const passPercent = course.assessment?.passPercent ?? 80;
    return {
      steps: [
        `The fluency sprint has ${total} quick questions. Answer them as fast as you can.`,
        "Type your answer and press “Check & continue” for each one. Your time is shown at the top.",
        `You need ${Math.ceil(total * passPercent / 100)} right out of ${total}. If you get fewer, press “Run the sprint again”.`,
      ],
      finish: `This section is finished when a sprint has ${Math.ceil(total * passPercent / 100)} or more right.`,
    };
  },
  problems: () => ({
    steps: [
      `There are ${course.realProblems.length} real-world problems.`,
      "Read the situation carefully. Decide what is being asked.",
      "Work it out, then type your calculation and answer in the box and press “Check answer”.",
      "Press “Hint” if you are stuck. When it says “Applied correctly!”, that problem is done.",
    ],
    finish: `This section is finished when all ${course.realProblems.length} problems have been answered right.`,
  }),
  explain: () => ({
    steps: [
      `There are ${course.reasoningPrompts.length} prompts that ask you to explain your thinking.`,
      "Read the prompt and the key ideas under it.",
      "Write your explanation in the box: what you know, what rule you used, and why your conclusion makes sense. Use the key ideas.",
      "Press “Check mathematical ideas”. If it asks for more evidence, add more and check again.",
      "Open “Show model explanation” to compare with a good answer.",
    ],
    finish: `This section is finished when all ${course.reasoningPrompts.length} explanations use the key ideas.`,
  }),
  challenge: () => {
    const total = course.assessment?.questions?.length ?? 0;
    return {
      steps: [
        `The Unit Challenge has ${total} questions. Read each one and choose your answer.`,
        "Press “Next question” after each one. You see your score at the end.",
        "If your score is not high enough, press “Try again”.",
        "Then press “Continue” to go to My Math Progress.",
      ],
      finish: `The challenge is passed with ${Math.ceil(total * 0.6)} right out of ${total} — more than half.`,
    };
  },
  live: () => ({
    steps: [
      "This page lists the live math classes for this unit, if your school runs them.",
      "For each class, read “Before class” and get ready — bring the model, problem or question it asks for.",
      "Read “Class plan” so you know what will happen. After the class, read “After class” to remember what to practise.",
      "Press “I'm ready for class” on each class.",
    ],
    finish: "This section is finished when you have pressed “I'm ready for class” on every class.",
  }),
  progress: () => ({
    steps: [
      "The top of the page shows how many learning steps of the unit you have finished.",
      `Read the ${course.selfAssessment.length} statements. For each one, choose Not yet, With help, or By myself.`,
      "Be honest — this shows what to practise next.",
    ],
    finish: "Press “Save reflection” when every statement has an answer.",
  }),
};

// Mounted before #app, not inside it: the original renderers repaint #app as
// the learner works (every explore tab, every practice check), and a guide
// inside it would vanish on the first repaint. Refreshed on every route render,
// removed where there is nothing to guide. Open at every stage — the steps are
// the point.
function renderSectionGuide() {
  const app = $("#app");
  let host = $("#section-guide");
  const route = shellCtx.route;
  const build = !isPrereqUnit && SECTION_GUIDES[route];
  if (!build) { host?.remove(); return; }
  if (!host) { host = document.createElement("section"); host.id = "section-guide"; app.parentNode.insertBefore(host, app); }
  const guide = SECTION_GUIDES[route]();
  const hasDeck = Boolean($("#deck-design"));
  host.className = "section-guide";
  host.innerHTML = `<details open>
      <summary>${icon("info")}<span><strong>How to use this page</strong><small>${escapeHtml(sectionLabel(route))} — what to do, step by step</small></span></summary>
      <ol class="section-guide-steps">${guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      <p class="section-guide-finish">${icon("check-circle")}<span><strong>To finish:</strong> ${escapeHtml(guide.finish)}</span></p>
      ${hasDeck ? `<p class="section-guide-deck">${icon("gallery-horizontal")}<span>Under the page there are slides with the same things, one at a time. <button class="link-button" type="button" data-jump-deck>Go to the slides</button></span></p>` : ""}
    </details>`;
  host.querySelector("[data-jump-deck]")?.addEventListener("click", () => $("#deck-design")?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

// The instruction slide in front of each Stage 1-4 deck. Icons are the deck's
// own inline set (deck.js :: DECK_ICON_PATHS) — Mathematics draws no lucide in
// its decks.
const DECK_STEP_NEXT = ["chevron-right", "Press the arrow to go to the next slide."];
const DECK_STEP_LISTEN = ["volume-2", "Press Listen to hear it read to you."];
const DECK_INTROS = {
  lesson: { title: "The Lesson", steps: [["eye", "One concept at a time. Read it and say the example out loud."], DECK_STEP_LISTEN, ["check", "On the last slide, press the button to finish."]] },
  words: { title: "Math words and symbols", steps: [["eye", "One word or symbol at a time. Read it and say what it means."], DECK_STEP_LISTEN, ["check", "On the last slide, press the button to finish."]] },
  explore: { title: "Explore the concept", steps: [["lightbulb", "One discovery at a time. Read the situation, then type your idea and press “Check my idea”."], ["lightbulb", "Stuck? Press “Hint”."], DECK_STEP_NEXT] },
  visuals: { title: "Visual models", steps: [["eye", "One model at a time. Look at it — drag it to turn it if it moves."], DECK_STEP_LISTEN, ["check", "On the last slide, press the button to finish."]] },
  method: { title: "Learn the method", steps: [["list-checks", "One method at a time. Press “Show me the next step” until it says Method complete."], DECK_STEP_LISTEN, DECK_STEP_NEXT] },
  examples: { title: "Worked examples", steps: [["eye", "One example at a time. Try it, then open “Show worked solution”."], DECK_STEP_NEXT, ["check", "Open all the solutions to finish."]] },
  guided: { title: "Guided practice", steps: [["pencil", "One question at a time. Type your answer and press “Check my answer”."], ["lightbulb", "Press “Give me a hint” if you need help."], DECK_STEP_NEXT] },
  activities: { title: "Activities", steps: [["list-checks", "One activity at a time. Do it, then press “Mark complete”."], DECK_STEP_LISTEN, ["check", "On the last slide, press the button to finish."]] },
  problems: { title: "Solve real problems", steps: [["pencil", "One problem at a time. Work it out, type your answer and press “Check answer”."], ["lightbulb", "Press “Hint” if you are stuck."], DECK_STEP_NEXT] },
  explain: { title: "Explain your thinking", steps: [["pencil", "One prompt at a time. Write your explanation using the key ideas, then press “Check mathematical ideas”."], ["eye", "Open “Show model explanation” to compare."], DECK_STEP_NEXT] },
};
const deckIntro = (id) => DECK_INTROS[id] || null;

// ===================== the Stage 1-4 slide deck =====================
// Mathematics meets its youngest learners the way English Grades 1-4 do: one
// item per full-screen slide, a big Listen button, side arrows, dots and swipe,
// instead of a grid of cards or a row of tabs above a panel. The plumbing is
// ../deck.js, shared with English — see the note there.
//
// Only the layout changes. Every field a section showed is still on the slide,
// every completion rule is the grid's, and the sections that are already
// one-thing-at-a-time (Fluency, the Unit Challenge, the games) keep their own
// designs — a deck would add a second carousel around a single question.
//
// DECK_MAX_STAGE is the gate, and it is 4 — the same boundary English draws.
//
// STAGES 5-8 KEEP THE GRIDS PERMANENTLY. That is a settled product decision
// (2026-08-06), not a rollout that has not reached them yet: by Stage 5 a
// learner scans a page and chooses what to read, and walking them through it
// one slide at a time takes that away. Do not raise this number to 5+ — a
// request to "finish the rollout" or "make the subject consistent" is asking
// for something that was considered and declined. If it is ever reopened, it is
// a product call, not a tidy-up.
//
// Stage 1 shipped alone first, both as a deck and then as both designs. Stages
// 2-4 carry the same fields in the same shapes (checked across all 51 units: no
// missing field anywhere the deck reads), and the one structural difference is
// that they hold six activities where Stage 1 holds one — which the deck
// already handles, since the mark-each-complete gate was written for the grid's
// six.
//
// ── Both designs on one page ────────────────────────────────────────────────
// A deck stage shows the ORIGINAL section first and the same content as an
// inline deck under it, which is what English Grades 1-4 do. There is no
// deck-instead-of-original stage any more: Stage 1 had one for a while, Stages
// 2-4 had one until they joined it, and the branch that served them is gone
// because DECK_MAX_STAGE now decides both questions at once — which stages get
// a deck, and which show it under the original.
//
// Both designs draw the same section, so both carry the same hooks — the
// explore page and the explore deck each own a discovery answer box, the
// practice grid and the practice deck each own a feedback slot. A
// document-wide querySelector would hand one design the other's controls. The
// original renderers also paint by assigning to #app.innerHTML, which would
// erase a deck mounted below them the moment a tab or a filter redrew.
//
// So each design gets a region: the original paints into .classic-design and
// queries inside it (classicScope), the deck mounts into .deck-design with
// full-bleed off. Above Stage 4 both fall back to #app and the document, so
// those stages run exactly the code they ran before.
//
// tools/lib/ehel-math-narration.js carries this number too, for the three
// categories only a deck narrates. Raise one and raise the other.
const DECK_MAX_STAGE = 4;
const bothDesigns = () => stageNumber <= DECK_MAX_STAGE;
let classicRegion = null;
let deckMount = null;

// Called at the top of an original renderer, which then shadows the module's
// own $ and $$ with these. It captures the region THEN, so the redraws a tab or
// a filter triggers keep painting into the same half of the page rather than
// over the whole app.
//
// `$("#app")` resolves to the region rather than to #app itself. Every original
// renderer paints by assigning to it — 22 sites — and remapping the one selector
// they all share leaves those statements untouched, where rewriting each into a
// paint() call would mean editing 22 multi-line template literals by hand.
function classicScope() {
  const region = classicRegion;
  const scope = region || document;
  return {
    $: (selector) => (selector === "#app" ? (region || document.querySelector("#app")) : scope.querySelector(selector)),
    $$: (selector) => [...scope.querySelectorAll(selector)],
  };
}

function renderBothDesigns(classic, carousel, intro) {
  $("#app").innerHTML = `<div class="both-designs">
      <div class="classic-design" id="classic-design"></div>
      <section class="deck-design">
        <div class="deck-design-head"><span class="eyebrow">Slides</span><p>${escapeHtml(intro)}</p></div>
        <div id="deck-design"></div>
      </section>
    </div>`;
  classicRegion = $("#classic-design");
  classic();
  // The deck is mounted second and left mounted: its region survives the
  // original's own redraws, which now stop at .classic-design. Both flags are
  // cleared by onBeforeRender before the next section draws.
  deckMount = "#deck-design";
  carousel();
  deckMount = null;
}

// Every deck passes these, so one call site decides whether a deck owns the
// screen or sits in the lower half of a page.
const deckPlacement = () => (deckMount ? { mount: deckMount, fullBleed: false } : {});

// Mathematics never loads the lucide runtime (it is one of the four shell-voice
// subjects), so the deck draws inline SVG. The subject helpers are passed as
// wrappers, not values: bind(ctx) fills them in after this module is evaluated.
const { mountDeck, deckFinish } = createDeck({
  $: (selector, root) => $(selector, root),
  escapeHtml: (value) => escapeHtml(value),
  icon: deckIcon,
  // A slide change silences the narration the previous slide started.
  stopAudio: () => stopVoice(),
  // Scoped to what actually changed: a one-slide redraw must not re-initialise
  // the WebGL models on the slides either side of it, which would leave two
  // animation loops running on one canvas.
  afterPaint: (scope) => {
    bindVoiceControls();
    updateVoiceUI();
    initMathWebGL(scope);
    initGeometryWebGL(scope);
  },
});

// The deck's own Listen button: the shell's voiceButton renders a `.button
// secondary` with a lucide glyph that never draws here. Same contract —
// data-speak, bound by bindVoiceControls, marked .is-playing while it speaks —
// in the deck's shape and size.
function deckVoice(text, label = "Listen") {
  return `<button class="gc-btn play" type="button" data-speak="${escapeHtml(spokenText(text))}" aria-label="${escapeHtml(label)}">${deckIcon("volume-2")} ${escapeHtml(label)}</button>`;
}
function deckVoiceSmall(text, label = "Listen") {
  return `<button class="gc-btn ghost small" type="button" data-speak="${escapeHtml(spokenText(text))}" aria-label="${escapeHtml(label)}">${deckIcon("volume-2")} ${escapeHtml(label)}</button>`;
}

// Answer checking, in one place for every module that takes typed input.
//
// The rule used to be "either string contains the other", which accepted any
// substring of the reviewed answer. 4,753 of the 4,788 free-text answers were
// satisfied by a single wrong character — "." passed "a) 3, b) 8, c) 5." — so
// a learner could clear Guided Practice, Fluency and Real Problems without
// doing any mathematics, and the progress those modules recorded meant nothing.
// It failed in the other direction too: a learner who typed "52, 81" was told
// they were wrong, because the stored answer carries the whole method
// ("a) 43 + 9 = 43 + 10 - 1 = 52, b) 62 + 19 = 62 + 20 - 1 = 81.").
//
// That second half is the reason this is not simply an equality test. The
// stored `answer` is a model solution written for a person to read, not a key:
// across the course only 3% are a bare number, 36% are labelled parts, 29%
// carry working, and 11% are prose. So grading extracts what the answer is
// actually asserting and checks the response carries it.
const ANSWER_MINUS = /[−–—]/g;
// A comma is a thousands separator between a digit and exactly three more, and
// a list separator everywhere else. Getting that backwards read "1,058" as the
// two numbers 1 and 58, so the value a Stage 5 long-multiplication answer
// asserted was 1 — which both accepted "1" and REJECTED a learner who typed
// 1058. The three-digit lookahead keeps "12, 24, 40" three separate values.
const normaliseAnswer = (text) => String(text || "")
  .toLowerCase()
  .replace(ANSWER_MINUS, "-")
  .replace(/(\d),(\d{3})(?!\d)/g, "$1$2")
  .replace(/,/g, " ")
  .replace(/\s+/g, " ")
  .replace(/[.\s]+$/, "")
  .trim();

// "a) … b) … c) …" splits into its parts; anything else is one part.
function answerParts(text) {
  const found = String(text).split(/(?=\b[a-h]\)\s)/).map((part) => part.trim()).filter(Boolean);
  return found.length > 1 ? found : [String(text)];
}

// The values an answer asserts — the numbers a learner has to arrive at.
//
// After an "=" only the FIRST number counts, because the working leads to the
// result and prose often follows it: in "About 30 x 7 = 210; the exact 238 is
// larger, because 34 was rounded down" the learner owes 210, not 210, 238 and
// 34. A part with no "=" contributes all of its numbers, which is what makes
// "7 and 9" and "Even: 12, 24, 40" checkable.
function assertedValues(text) {
  const values = [];
  for (const part of answerParts(normaliseAnswer(text))) {
    const at = part.lastIndexOf("=");
    const tail = at === -1 ? part : part.slice(at + 1);
    // "2d" and "3d" name a kind of shape; they are not a quantity the learner
    // has to reach, and reading them as one let "3" answer "It is a 3D shape".
    const numbers = tail.replace(/\b[23]\s?d\b/g, " ").match(/-?\d+(?:\.\d+)?/g) || [];
    if (at === -1) values.push(...numbers.map(Number));
    else if (numbers.length) values.push(Number(numbers[0]));
  }
  return values;
}

// Words that carry the answer when it has no numbers in it at all ("Clockwise",
// "A right angle", "Group B"). Single letters are kept deliberately — "group a"
// and "group b" differ only there, and dropping them marked one right when the
// learner typed the other.
const ANSWER_STOPWORDS = new Set(["the", "an", "of", "is", "are", "and", "or", "to", "in", "it", "that", "this",
  "then", "so", "because", "you", "your", "each", "every", "by", "with", "for", "on", "at", "as", "be", "was",
  "were", "will", "can", "if", "not", "there", "they", "them", "its", "from", "into", "than", "when", "which"]);
const answerWords = (text) => normaliseAnswer(text)
  .split(/[^a-z0-9°²³%]+/)
  .filter((word) => word && !ANSWER_STOPWORDS.has(word));

function answerMatches(response, expected) {
  const given = normaliseAnswer(response);
  if (!given) return false;
  if (given === normaliseAnswer(expected)) return true;

  // Numeric answers are graded on their values, so working may be shown or not
  // shown — "52 81", "a) 52 b) 81" and "43 + 10 - 1 = 52, 62 + 20 - 1 = 81" all
  // pass, and every value has to be there, so answering half of a two-part
  // question no longer counts.
  const wanted = assertedValues(expected);
  if (wanted.length) {
    const got = new Set((given.match(/-?\d+(?:\.\d+)?/g) || []).map(Number));
    return wanted.every((value) => got.has(value));
  }

  // Otherwise every word the answer depends on has to appear. Held as a set
  // rather than a sequence so "a right angle" and "an angle that is right" both
  // pass; what it will not accept is a fragment.
  const needed = answerWords(expected);
  if (!needed.length) return false;
  const said = new Set(answerWords(given));
  return needed.every((word) => said.has(word));
}

const feedbackHtml = (tone, note, body) => `<p class="feedback ${tone}"><span class="status-note">${escapeHtml(note)}</span> ${escapeHtml(body)}</p>`;

// The Example clause a concept narrates, when it has one. 30 Stage 1 concepts
// no longer do: their `example` was the grown-up's You:/Child: dialogue and
// moved to `grownUpGuide`, and "…Example: ." is not a sentence.
//
// Kept as a helper so the narration template stays flat — it must match
// tools/lib/ehel-math-narration.js character for character, and the check that
// holds them together reads both with a regex that a nested template literal
// cuts in half.
const exampleClause = (concept) => (concept.example ? `. Example: ${concept.example}` : "");

// The grown-up's half of a Stage 1 concept — "How to teach it: Place 5 dates in
// a row…", and the You:/Child: dialogue that goes with it.
//
// It used to be joined onto the end of the explanation, so the slide read it to
// the learner as if it were their lesson. It now lives in its own field
// (tools/split-ehel-math-grownup-guide.mjs) and is rendered here: closed by
// default, addressed to the person it is written for, and never narrated. The
// Listen button reads the learner's text only — narrating a script that says
// "take the child's finger in yours" to the child is the same defect as showing
// it to them, and it would be paid for by the character.
function grownUpGuide(item) {
  if (!item.grownUpGuide) return "";
  return `<details class="gc-practice gc-grownup"><summary>${deckIcon("eye")} For the grown-up</summary>
      <div class="gc-prose">${richText(item.grownUpGuide)}</div>
    </details>`;
}

// ===================== section renderers (verbatim) =====================
function renderOverview() {
  // The shell's checklist of what finishing this unit takes, first in the
  // column so it is met before anything else — under the banner it would start
  // below the fold. Mathematics has no section gate, so every row is open; the
  // per-unit note (unit.howToUse) is read if a unit ever carries one, though
  // every unit here has the same fifteen-section shape and none does yet.
  const unitGuide = shellCtx.unitGuide({
    hints: SECTION_HINTS,
    howToUse: Array.isArray(course.unit.howToUse) ? course.unit.howToUse : [],
    rule: "When every section has a tick, this unit is finished.",
  });
  // The unit's own path, authored per unit as an array of steps. It used to be
  // ignored here in favour of one generic five-item list, so a unit could
  // describe its own order and no learner ever read it.
  const learningPath = Array.isArray(course.unit.learningPath) && course.unit.learningPath.length
    ? course.unit.learningPath
    : ["Discover and model the concept.", "Learn the method and study examples.", "Practise with hints, games and fluency.", "Solve real problems and explain your reasoning.", "Complete the Unit Challenge and reflect."];
  $("#app").innerHTML = `${pageHeader(`${(course.stage || course.grade).label} · ${course.term.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, course.unit.unitOverview)}
    <div class="overview-grid">
      <div class="section-stack">
        ${unitGuide}
        <section class="unit-banner math-banner"><div class="banner-copy"><span>Your mathematics journey</span><h2>Explore ${escapeHtml(course.unit.unitTitle)}</h2><p>Discover the ideas in familiar situations, model them, learn reliable methods, practise with support and explain your thinking.</p><button class="button gold" data-go="lesson" type="button">▶ Start the lesson</button></div></section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome, index) => `<div class="outcome"><span>${index + 1}</span><p>${escapeHtml(outcome)}</p></div>`).join("")}</div></section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">${escapeHtml(cambridgeFramework(stageNumber).level)} ${cambridgeFramework(stageNumber).code}</span><h3>Aligned to ${escapeHtml(cambridgeLabel(stageNumber))}</h3><p>Unit ${course.unit.unitNo} is structured from the ${escapeHtml(cambridgeLabel(stageNumber))} content package. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.concepts.length}</strong><small>concepts</small></div><div class="stat"><strong>${course.practice.length}</strong><small>practice items</small></div><div class="stat"><strong>${course.activities.length}</strong><small>activities</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list">${learningPath.map((step, index) => `<li><span>${index + 1}</span><span>${escapeHtml(step)}</span></li>`).join("")}</ol></section>
        ${placementCallout({ escapeHtml, storageKey: `ehel-math-s${stageNumber}-placement-exam-v1`, stageLabel: `Stage ${stageNumber}`, href: `?stage=${stageNumber}&unit=-1#placement`, unitNo: course.unit.unitNo })}
      </div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

// The five symbols every unit introduces, whichever design shows them.
const MATH_SYMBOLS = [["+", "combine or add", "Use when quantities join"], ["−", "find a difference", "Use when quantities separate"], ["=", "has the same value", "Both sides balance"], ["<", "is less than", "The smaller value"], [">", "is greater than", "The larger value"]];

function renderMathWords() {
  if (bothDesigns()) return renderBothDesigns(renderMathWordsClassic, renderMathWordsDeck, "The same words and signs, one at a time.");
  return renderMathWordsClassic();
}

function renderMathWordsClassic() {
  const { $, $$ } = classicScope();
  const symbols = MATH_SYMBOLS;
  const terms = course.reference.terms.map(([term, meaning]) => `<article class="word-tile"><span>${escapeHtml(term.slice(0, 1))}</span><div><h3>${escapeHtml(term)}</h3><p>${escapeHtml(meaning)}</p></div></article>`).join("");
  $("#app").innerHTML = `${pageHeader("Language for mathematics", "Math Words & Symbols", `Learn the words and signs needed to discuss and explain ${escapeHtml(course.unit.unitTitle)}.`)}
    <div class="words-layout"><section class="panel"><h2>Key words</h2><div class="word-tile-grid">${terms}</div></section><section class="panel"><h2>Symbols in this unit</h2><div class="symbol-list">${symbols.map(([symbol, meaning, example]) => `<article><span>${symbol}</span><div><strong>${meaning}</strong><small>${example}</small></div></article>`).join("")}</div><button class="button primary" id="words-done" type="button">I know these words and symbols ✓</button></section></div>`;
  $("#words-done").addEventListener("click", () => { complete("words", "Math language step complete."); navigate("explore"); });
}

// Math Words & Symbols as a deck: one word or one sign per slide, said aloud.
//
// The two-column page put the unit's key words in one panel and the five signs
// in another; here they are one run of slides with a filter under the dots — the
// place the English vocabulary deck puts its search — so a learner who wants
// only the signs can have only the signs. The word is the big thing on the
// slide, as the symbol already was on its tile.
function renderMathWordsDeck() {
  const esc = escapeHtml;
  const cards = [
    ...course.reference.terms.map(([term, meaning]) => ({ kind: "word", eyebrow: "Key word", title: term, body: meaning, note: "" })),
    ...MATH_SYMBOLS.map(([symbol, meaning, example]) => ({ kind: "symbol", eyebrow: "Symbol in this unit", title: symbol, body: meaning, note: example })),
  ];
  let shown = cards;

  // The two narrations are written out here rather than composed into the card
  // object, so tools/check-ehel-audio-coverage.mjs can compare each template
  // against the generator that has to reproduce it character for character. A
  // pre-composed `card.speak` would have hidden both strings from that gate.
  const cardSlide = (card, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">${esc(card.eyebrow)}</span>
      <div class="${card.kind === "symbol" ? "gc-pattern" : "gc-term"}" lang="en">${esc(card.title)}</div>
      <p class="gc-lead">${esc(card.body)}</p>
      ${card.note ? `<p class="gc-note">${esc(card.note)}</p>` : ""}
      <div class="gc-actions">${card.kind === "symbol"
        ? deckVoice(`The sign ${card.title} means ${card.body}. ${card.note}.`, "Listen to this sign")
        : deckVoice(`${card.title}. ${card.body}.`, "Listen to this word")}</div>
      ${index === shown.length - 1 ? deckFinish("words", "I know these words and symbols") : ""}
    </div></section>`;

  const deck = mountDeck({
    ...deckPlacement(),
    heading: "Language for mathematics",
    intro: deckIntro("words"),
    label: "Card",
    emptyMessage: "No words or symbols in this unit yet.",
    tools: `<div class="wc-tools">
        <select id="words-filter" aria-label="Show words or symbols"><option value="all">Words and symbols</option><option value="word">Key words only</option><option value="symbol">Symbols only</option></select>
        <span class="status-chip" id="words-count">${cards.length} cards</span>
      </div>`,
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return undefined;
      complete("words", "Math language step complete.");
      return navigate("explore");
    },
  });

  const drawDeck = () => {
    const filter = $("#words-filter")?.value || "all";
    shown = filter === "all" ? cards : cards.filter((card) => card.kind === filter);
    deck.setSlides(shown.map(cardSlide));
    const counter = $("#words-count");
    if (counter) counter.textContent = `${shown.length} card${shown.length === 1 ? "" : "s"}`;
  };
  $("#words-filter")?.addEventListener("change", drawDeck);
  drawDeck();
}

function renderExploreConcept() {
  if (bothDesigns()) return renderBothDesigns(renderExploreConceptClassic, renderExploreConceptDeck, "The same discoveries, one at a time.");
  return renderExploreConceptClassic();
}

function renderExploreConceptClassic() {
  const { $, $$ } = classicScope();
  let active = 0;
  const completed = new Set(progress.explorations || []);
  const draw = () => {
    const item = course.explorations[active];
    $("#app").innerHTML = `${pageHeader("Six familiar discoveries", "Explore the Concept", "Discover each idea through market, street, school, water, transport and family situations.")}
      <div class="exploration-tabs">${course.explorations.map((entry,index)=>`<button class="exploration-tab ${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-exploration="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.title)}</button>`).join("")}</div>
      <div class="story-layout"><section class="panel story-scene"><span class="eyebrow">Discovery ${active+1} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.title)}</h2>${mathDiagram(courseTopic(), active)}<p>${escapeHtml(item.context)}</p>${voiceButton(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}<div class="discovery-model ${escapeHtml(item.modelType)}"><strong>${escapeHtml(item.modelType.replaceAll('-',' '))}</strong><span>${escapeHtml(item.explanation)}</span></div></section><aside class="section-stack"><section class="panel"><h3>Discovery question</h3><p>${escapeHtml(item.prompt)}</p>${voiceButton(item.prompt, "Listen to question")}<input id="discovery-answer" class="math-input" aria-label="Discovery answer"><div class="question-actions"><button class="button primary" id="check-discovery" type="button">Check my idea</button><button class="button secondary" id="hint-discovery" type="button">Hint</button></div><div id="discovery-feedback"></div></section><section class="panel"><h3>Progress</h3><p><strong>${completed.size} of ${course.explorations.length}</strong> discoveries complete.</p><div class="progress-track"><span style="width:${completed.size/course.explorations.length*100}%"></span></div></section></aside></div>`;
    initMathWebGL($("#app"));
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

// Explore the Concept as a deck: one discovery per slide.
//
// The tab strip becomes the dots and the progress panel becomes the counter, so
// the discovery a learner is working on is the only thing on screen. Everything
// the two-column page carried is still here — the situation, the model and its
// explanation, the question, the hint and the answer check — and the completion
// rule is unchanged: all six answered correctly completes the section.
//
// Slides are never repainted, so an answer typed on discovery 3 is still there
// after a trip to discovery 6 and back. The one thing that has to survive the
// slide change is which discoveries are already right, and that lives in
// progress.explorations exactly as before.
function renderExploreConceptDeck() {
  const esc = escapeHtml;
  const items = course.explorations;
  const topic = courseTopic();
  const completed = new Set(progress.explorations || []);

  const slides = items.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Discovery ${index + 1} of ${items.length} · ${esc(item.difficulty)}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      ${mathDiagram(topic, index)}
      <p class="gc-lead">${esc(item.context)}</p>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}</div>
      <div class="discovery-model ${esc(item.modelType)}"><strong>${esc(item.modelType.replaceAll("-", " "))}</strong><span>${esc(item.explanation)}</span></div>
      <div class="wc-sentence">
        <small>Discovery question</small>
        <p>${esc(item.prompt)}</p>
        <div class="wc-sentence-controls">${deckVoiceSmall(item.prompt, "Listen to question")}</div>
        <input class="math-input" data-discovery="${esc(item.id)}" autocomplete="off" aria-label="Your answer to discovery ${index + 1}">
      </div>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check-discovery="${esc(item.id)}">${deckIcon("list-checks")} Check my idea</button>
        <button class="gc-btn ghost" type="button" data-hint-discovery="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
      </div>
      <div data-discovery-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
      ${grownUpGuide(item)}
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Six familiar discoveries",
    intro: deckIntro("explore"),
    label: "Discovery",
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-check-discovery], [data-hint-discovery]");
      if (!target) return undefined;
      const id = target.dataset.checkDiscovery || target.dataset.hintDiscovery;
      const item = items.find((candidate) => candidate.id === id);
      const box = $(`[data-discovery-feedback="${CSS.escape(id)}"]`);
      if (!item || !box) return undefined;
      if (target.dataset.hintDiscovery) {
        box.innerHTML = `<p class="feedback try"><span class="field-label">Hint:</span> ${esc(item.hint)}</p>`;
        return undefined;
      }
      const correct = answerMatches($(`[data-discovery="${CSS.escape(id)}"]`)?.value, item.answer);
      box.innerHTML = feedbackHtml(correct ? "good" : "try", correct ? "Exactly!" : "Look again.", correct ? item.explanation : item.hint);
      if (correct) {
        completed.add(item.id);
        progress.explorations = [...completed];
        saveProgress();
        if (completed.size === items.length) complete("explore", "All six concept discoveries complete.");
      }
      return undefined;
    },
  });
}

function renderVisualModels() {
  if (bothDesigns()) return renderBothDesigns(renderVisualModelsClassic, renderVisualModelsDeck, "The same models, one at a time.");
  return renderVisualModelsClassic();
}

function renderVisualModelsClassic() {
  const { $, $$ } = classicScope();
  let active = 0;
  const draw = () => {
    const model = course.visualModels[active];
    $("#app").innerHTML = `${pageHeader("Ways to see the mathematics", "Visual Models", `Explore labelled models that make ${escapeHtml(course.unit.unitTitle)} visible and easier to explain.`)}<div class="model-tabs">${course.visualModels.map((item,index)=>`<button class="subtab ${index===active?'active':''}" data-model-index="${index}" type="button">${escapeHtml(item.title)}</button>`).join('')}</div><section class="panel model-stage generic-model-stage"><span class="eyebrow">${escapeHtml(model.outcomeId || `Model ${active+1}`)}</span><h2>${escapeHtml(model.title)}</h2>${mathDiagram(courseTopic(), active)}<p>${escapeHtml(model.purpose)}</p>${voiceButton(`${model.title}. ${model.purpose}`, "Listen to model")}<div class="model-concept-cards">${course.concepts.slice(0,3).map((concept)=>`<article><strong>${escapeHtml(concept.title)}</strong><span>${escapeHtml(concept.example)}</span></article>`).join('')}</div></section><p><button class="button primary" id="visuals-done" type="button">I explored the models ✓</button></p>`;
    initMathWebGL($("#app"));
    $$('[data-model-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.modelIndex);draw();}));
    $("#visuals-done").addEventListener("click", () => { complete("visuals", "Visual models explored."); navigate("method"); });
  };
  draw();
}

// Visual Models as a deck: one labelled model per slide, the model tabs becoming
// the dots. The three concept cards ride with each model, as they did on the
// page, because they are what the model is a picture of.
function renderVisualModelsDeck() {
  const esc = escapeHtml;
  const models = course.visualModels;
  const topic = courseTopic();
  const slides = models.map((model, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">${esc(model.outcomeId || `Model ${index + 1}`)} · Model ${index + 1} of ${models.length}</span>
      <h3 class="gc-title">${esc(model.title)}</h3>
      ${mathDiagram(topic, index)}
      <p class="gc-lead">${esc(model.purpose)}</p>
      <div class="gc-actions">${deckVoice(`${model.title}. ${model.purpose}`, "Listen to model")}</div>
      <div class="model-concept-cards">${course.concepts.slice(0, 3).filter((concept) => concept.example).map((concept) => `<article><strong>${esc(concept.title)}</strong><span>${esc(concept.example)}</span></article>`).join("")}</div>
      ${grownUpGuide(model)}
      ${index === models.length - 1 ? deckFinish("visuals", "I explored the models") : ""}
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Ways to see the mathematics",
    intro: deckIntro("visuals"),
    label: "Model",
    slides,
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return undefined;
      complete("visuals", "Visual models explored.");
      return navigate("method");
    },
  });
}

function renderLearnMethod() {
  if (bothDesigns()) return renderBothDesigns(renderLearnMethodClassic, renderLearnMethodDeck, "The same methods, one at a time.");
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
// one at a time.
//
// The method selector becomes the dots. Step reveal is per slide and lives in
// the DOM (the .active class the page already used) rather than in a shared
// `step` variable, so a learner three steps into method 2 finds it three steps
// in when they swipe back — the selector reset it to step 1 every time.
function renderLearnMethodDeck() {
  const esc = escapeHtml;
  const methods = course.methods;
  const completed = new Set(progress.methods || []);

  // `index` is the step, spelled exactly as the grid spells it: the narration is
  // looked up by a hash of this string, so the two designs must produce the same
  // clip rather than two spellings of one sentence. The slide's own position is
  // `slideIndex` so nothing shadows it.
  const slides = methods.map((method, slideIndex) => `<section class="gc-slide gc-v${slideIndex % 5}" data-method-slide="${esc(method.id)}"><div class="gc-inner">
      <span class="gc-eyebrow">Method ${slideIndex + 1} of ${methods.length} · ${esc(method.difficulty)}</span>
      <h3 class="gc-title">${esc(method.title)}</h3>
      <div class="gc-worked" lang="en">${esc(method.example)}</div>
      <div class="gc-actions">${deckVoice(`${method.title}. Example: ${method.example}. ${method.steps.join(" ")}`, "Listen to method")}</div>
      <div class="method-steps">${method.steps.map((text,index)=>`<article class="method-step ${index === 0 ? "active" : ""}" data-method-step="${index}"><span>${index + 1}</span><div><h3>Step ${index + 1}</h3><p>${esc(text)}</p>${deckVoiceSmall(`Step ${index+1}. ${text}`, "Listen to step")}</div></article>`).join("")}</div>
      <button class="gc-btn done" type="button" data-next-step="${esc(method.id)}">${deckIcon("arrow-right")} Show me the next step</button>
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Six short procedures",
    intro: deckIntro("method"),
    label: "Method",
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-next-step]");
      if (!target) return undefined;
      const method = methods.find((item) => item.id === target.dataset.nextStep);
      const slide = target.closest("[data-method-slide]");
      const steps = [...slide.querySelectorAll("[data-method-step]")];
      const next = Math.min(steps.length - 1, steps.filter((step) => step.classList.contains("active")).length);
      steps.forEach((step, position) => step.classList.toggle("active", position <= next));
      if (next < steps.length - 1) return undefined;
      target.disabled = true;
      target.innerHTML = `${deckIcon("check")} Method complete`;
      completed.add(method.id);
      progress.methods = [...completed];
      saveProgress();
      if (completed.size === methods.length) complete("method", "All six methods learned.");
      return undefined;
    },
  });
}

function legacyGeometryConceptVisual(concept, index) {
  const unit2 = [
    { caption: "Compare a sphere, cube, cylinder and cone as solid 3D shapes.", art: `<circle cx="56" cy="78" r="31" class="shape-fill"/><path d="M32 63c15 8 32 8 48 0M34 91c14-7 30-7 44 0" class="detail"/><path d="M116 53l34-18 34 18v43l-34 19-34-19zM116 53l34 19 34-19M150 72v43" class="shape-fill detail"/><ellipse cx="238" cy="50" rx="30" ry="12" class="shape-fill detail"/><path d="M208 50v58c0 7 13 12 30 12s30-5 30-12V50" class="shape-fill detail"/><path d="M302 111L331 43l29 68z" class="shape-fill detail"/><ellipse cx="331" cy="111" rx="29" ry="9" class="shape-fill detail"/><text x="56" y="145">sphere</text><text x="150" y="145">cube</text><text x="238" y="145">cylinder</text><text x="331" y="145">cone</text>` },
    { caption: "A cube has flat faces, straight edges and corner points called vertices.", art: `<path d="M112 54l74-32 74 32v76l-74 32-74-32zM112 54l74 34 74-34M186 88v74" class="shape-fill detail"/><path d="M186 88l74-34" class="edge-focus"/><circle cx="260" cy="54" r="7" class="vertex-focus"/><path d="M62 58h44M54 58l-20 0M55 58l30 28" class="callout"/><text x="12" y="52">face</text><path d="M278 50h60" class="callout"/><text x="300" y="42">vertex</text><path d="M225 82l75 46" class="callout"/><text x="298" y="145">edge</text>` },
    { caption: "Match everyday objects to their mathematical solids: ball–sphere, dice–cube, tin–cylinder, tent–pyramid.", art: `<circle cx="53" cy="73" r="30" class="shape-fill detail"/><path d="M32 55l42 35M28 78l47-22" class="detail"/><rect x="112" y="43" width="55" height="55" rx="7" class="shape-fill detail"/><circle cx="127" cy="59" r="4"/><circle cx="152" cy="59" r="4"/><circle cx="139" cy="71" r="4"/><circle cx="127" cy="84" r="4"/><circle cx="152" cy="84" r="4"/><ellipse cx="227" cy="47" rx="29" ry="10" class="shape-fill detail"/><path d="M198 47v54c0 6 13 10 29 10s29-4 29-10V47" class="shape-fill detail"/><path d="M290 104l34-65 34 65zM324 39v65" class="shape-fill detail"/><text x="53" y="135">ball</text><text x="139" y="135">dice</text><text x="227" y="135">tin</text><text x="324" y="135">tent</text>` },
    { caption: "Count straight sides and vertices to name polygons.", art: `<path d="M51 42l37 68H14z" class="shape-flat"/><rect x="110" y="43" width="65" height="65" class="shape-flat"/><path d="M232 36l34 25-13 41h-42l-13-41z" class="shape-flat"/><path d="M307 38h35l18 31-18 31h-35l-18-31z" class="shape-flat"/><text x="51" y="135">3 sides</text><text x="142" y="135">4 sides</text><text x="232" y="135">5 sides</text><text x="324" y="135">6 sides</text>` },
    { caption: "A line of symmetry divides a shape into two matching mirror halves.", art: `<path d="M78 36c-44-24-62 28-26 52-31 26-7 70 28 33 20 27 42-6 22-32 35-25 17-76-24-53z" class="shape-fill detail"/><path d="M80 25v112" class="symmetry-line"/><path d="M215 38h88v82h-88z" class="shape-flat"/><path d="M259 25v110M202 79h114" class="symmetry-line"/><text x="80" y="156">1 matching fold</text><text x="259" y="156">2 matching folds</text>` },
    { caption: "Turning changes orientation; flipping creates a mirror image. The shape itself stays the same.", art: `<rect x="40" y="51" width="56" height="56" class="shape-flat"/><path d="M110 78h47m-11-12l13 12-13 12" class="turn-arrow"/><rect x="178" y="51" width="56" height="56" transform="rotate(45 206 79)" class="shape-flat"/><path d="M253 79h48m-12-12l13 12-13 12" class="turn-arrow"/><path d="M322 46l29 64h-58z" class="shape-flat"/><path d="M322 35v90" class="symmetry-line"/><text x="68" y="145">start</text><text x="206" y="145">turn</text><text x="322" y="145">flip</text>` },
  ];
  const unit11 = [
    { caption: "Directions depend on the way you face: left, straight ahead and right.", art: `<circle cx="180" cy="87" r="24" class="shape-fill detail"/><path d="M180 61V22m-10 13l10-14 10 14M156 87h-68m13-10L87 87l14 10M204 87h68m-13-10l14 10-14 10" class="turn-arrow"/><text x="180" y="145">straight</text><text x="79" y="116">left</text><text x="281" y="116">right</text>` },
    { caption: "Clockwise follows the hands of a clock; anticlockwise travels the opposite way.", art: `<circle cx="180" cy="82" r="57" class="shape-flat"/><path d="M180 82V39M180 82l32 20" class="detail"/><circle cx="180" cy="82" r="5"/><path d="M103 63a82 82 0 0 1 154-3m-8-12l10 13-16 5" class="turn-arrow"/><path d="M111 119a82 82 0 0 0 138 0m-2 17l4-17-17-1" class="turn-arrow alt"/><text x="180" y="15">clockwise</text><text x="180" y="164">anticlockwise</text>` },
    { caption: "A quarter turn is one of four equal turns and makes a right angle.", art: `<path d="M85 126V46h80" class="angle-line"/><rect x="85" y="46" width="18" height="18" class="right-angle"/><path d="M103 112a65 65 0 0 0 48-48m-1 17l2-18-18 3" class="turn-arrow"/><circle cx="265" cy="86" r="52" class="shape-flat faint"/><path d="M265 86V34M265 86h52" class="angle-line"/><path d="M265 34a52 52 0 0 1 52 52" class="quarter-fill"/><text x="125" y="151">right angle</text><text x="265" y="151">¼ turn</text>` },
    { caption: "A half turn is two quarter turns and points in the opposite direction.", art: `<path d="M91 118V39m-12 14l12-15 12 15M269 39v79m-12-14l12 15 12-15" class="turn-arrow"/><path d="M91 72a89 89 0 0 1 178 0m-12-12l13 13 10-15" class="turn-arrow"/><text x="91" y="145">start: up</text><text x="269" y="145">after ½ turn: down</text>` },
    { caption: "Compare a quarter, half, three-quarter and full turn around one centre.", art: `<circle cx="180" cy="83" r="59" class="shape-flat faint"/><path d="M180 83V24M180 83h59M180 83v59M180 83h-59" class="detail"/><path d="M180 24a59 59 0 0 1 59 59" class="turn-arc one"/><path d="M239 83a59 59 0 0 1-59 59" class="turn-arc two"/><path d="M180 142a59 59 0 0 1-59-59" class="turn-arc three"/><path d="M121 83a59 59 0 0 1 59-59" class="turn-arc four"/><text x="180" y="167">4 quarter turns = 1 full turn</text>` },
    { caption: "Every radius reaches from the centre to the circle; a diameter and symmetry line pass through the centre.", art: `<circle cx="180" cy="82" r="60" class="shape-flat"/><path d="M120 82h120" class="symmetry-line"/><path d="M180 82l42-42" class="edge-focus"/><circle cx="180" cy="82" r="6" class="vertex-focus"/><text x="180" y="108">centre</text><text x="211" y="51">radius</text><text x="180" y="151">diameter / symmetry line</text>` },
  ];
  const visual = course.unit.unitNo === 2 ? unit2[index] : course.unit.unitNo === 11 ? unit11[index] : null;
  if (!visual) return "";
  return `<figure class="geometry-visual"><svg viewBox="0 0 380 180" aria-hidden="true" focusable="false">${visual.art}</svg><figcaption><span class="field-label">Visual example:</span> ${escapeHtml(visual.caption)}</figcaption></figure>`;
}

function geometryConceptVisual(concept, index) {
  const unit2 = [
    { caption: "Compare a sphere, cube, cylinder and cone as solid 3D shapes.", labels: ["sphere", "cube", "cylinder", "cone"] },
    { caption: "A cube has flat faces, straight edges and corner points called vertices.", labels: ["6 faces", "12 edges", "8 vertices"] },
    { caption: "Match everyday objects to their mathematical solids: ball–sphere, dice–cube, tin–cylinder, tent–pyramid.", labels: ["ball", "dice", "tin", "tent"] },
    { caption: "Count straight sides and vertices to name polygons.", labels: ["triangle · 3", "square · 4", "pentagon · 5", "hexagon · 6"] },
    { caption: "A line of symmetry divides a shape into two matching mirror halves.", labels: ["matching half", "line of symmetry", "matching half"] },
    { caption: "Turning changes orientation; flipping creates a mirror image. The shape itself stays the same.", labels: ["start", "turn", "flip"] },
  ];
  const unit11 = [
    { caption: "Directions depend on the way you face: left, straight ahead and right.", labels: ["left", "straight", "right"] },
    { caption: "Clockwise follows the hands of a clock; anticlockwise travels the opposite way.", labels: ["clockwise ↻", "anticlockwise ↺"] },
    { caption: "A quarter turn is one of four equal turns and makes a right angle.", labels: ["right angle", "¼ turn · 90°"] },
    { caption: "A half turn is two quarter turns and points in the opposite direction.", labels: ["start · up", "½ turn", "finish · down"] },
    { caption: "Compare a quarter, half, three-quarter and full turn around one centre.", labels: ["¼", "½", "¾", "1 full turn"] },
    { caption: "Every radius reaches from the centre to the circle; a diameter and symmetry line pass through the centre.", labels: ["centre", "radius", "diameter"] },
  ];
  const unit15 = [
    { caption: "Matching halves make a symmetrical whole around a centre line.", labels: ["left half", "mirror line", "right half"] },
    { caption: "Test vertical and horizontal lines to find where a shape folds exactly onto itself.", labels: ["vertical fold", "horizontal fold"] },
    { caption: "A reflection flips a shape across the mirror line without changing its size.", labels: ["shape", "mirror line", "reflection"] },
    { caption: "Build a symmetrical pattern by matching every coloured tile across the line.", labels: ["same colour", "same distance", "opposite side"] },
    { caption: "Use forwards, backwards, left and right from the direction you are facing.", labels: ["left", "forwards", "right", "backwards"] },
    { caption: "Clockwise turns right around a centre; anticlockwise turns left.", labels: ["clockwise ↻", "anticlockwise ↺"] },
  ];
  const visual = course.unit.unitNo === 2 ? unit2[index] : course.unit.unitNo === 11 ? unit11[index] : course.unit.unitNo === 15 ? unit15[index] : null;
  if (!visual) return "";
  const sceneId = `${course.unit.unitNo}-${index}`;
  return `<figure class="geometry-visual" data-geometry-figure="${sceneId}">
    <div class="geometry-stage"><canvas class="geometry-webgl" data-geometry-scene="${sceneId}" role="img" aria-label="Interactive model. ${escapeHtml(visual.caption)}"></canvas><p class="geometry-fallback" hidden>This device cannot display the interactive WebGL model. Use the labels and explanation below.</p></div>
    <div class="geometry-labels" aria-hidden="true">${visual.labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>
    <div class="geometry-controls"><button type="button" data-geometry-toggle>Pause animation</button><button type="button" data-geometry-reset>Reset view</button><span>Drag the model to turn it</span></div>
    <figcaption><span class="field-label">Interactive example:</span> ${escapeHtml(visual.caption)}</figcaption>
  </figure>`;
}

const courseTopic = () => unitTopic(course.unit.unitTitle, course.concepts);

// The Lesson as a deck: one concept per slide, its diagram above the
// prose. The concept grid put five long explainers on one page; a Stage 1
// learner reads one, hears it, and swipes.
//
// Listen sits ABOVE the explainer, not under it where the grid card put it. A
// Stage 1 explainer is several hundred words, so the card scrolls; a learner who
// cannot yet read it would have had to scroll past the whole thing to reach the
// button that reads it to them.
function renderLessonDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const concepts = course.concepts;
  const slides = concepts.map((concept, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Concept ${index + 1} of ${concepts.length}</span>
      <h3 class="gc-title">${esc(concept.title)}</h3>
      ${mathDiagram(topic, index)}
      <div class="gc-actions">${deckVoice(`${concept.title}. ${spokenText(concept.explanation)}${exampleClause(concept)}`, "Listen to concept")}</div>
      <div class="gc-prose">${richText(concept.explanation)}</div>
      ${concept.example ? `<p class="gc-note gc-try"><span class="field-label">Example:</span> ${esc(concept.example)}</p>` : ""}
      ${grownUpGuide(concept)}
      ${index === concepts.length - 1 ? deckFinish("lesson", "I studied the concepts") : ""}
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: course.unit.unitTitle,
    intro: deckIntro("lesson"),
    label: "Concept",
    slides,
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return undefined;
      complete("lesson", "Lesson marked studied.");
      return navigate("ai");
    },
  });
}

function renderLesson() {
  if (bothDesigns()) return renderBothDesigns(renderLessonClassic, renderLessonDeck, "The same concepts, one at a time.");
  return renderLessonClassic();
}

function renderLessonClassic() {
  const { $, $$ } = classicScope();
  const topic = courseTopic();
  const concepts = course.concepts.map((concept, index) => `<article class="panel concept-card"><span class="eyebrow">Concept ${index + 1}</span><h2>${escapeHtml(concept.title)}</h2>${mathDiagram(topic, index)}<div class="concept-body">${richText(concept.explanation)}</div>${concept.example ? `<p class="example"><span class="field-label">Example:</span> ${escapeHtml(concept.example)}</p>` : ""}${voiceButton(`${concept.title}. ${spokenText(concept.explanation)}${exampleClause(concept)}`, "Listen to concept")}${grownUpGuide(concept)}</article>`).join("");
  $("#app").innerHTML = `${pageHeader("The lesson", course.unit.unitTitle, "Read the source-grounded concepts with a labelled diagram for each, and follow the complete ElevenLabs narration.")}
    <div class="concept-grid">${concepts}</div>
    <p><button class="button primary" id="lesson-done" type="button">I studied the concepts ✓</button></p>`;
  initGeometryWebGL($("#app"));
  initMathWebGL($("#app"));
  $("#lesson-done").addEventListener("click", () => { complete("lesson", "Lesson marked studied."); navigate("ai"); });
}

// Worked Examples as a deck: one example per slide, its solution still behind a
// "Show worked solution" the learner opens when they are ready to compare.
//
// The three level subtabs become the filter under the dots — the same place the
// vocabulary and words decks put theirs — and the twelve-solutions-opened
// completion rule is the grid's, counted the same way. `toggle` does not bubble,
// so the counter listens in the capture phase rather than through the deck's
// delegated click handler.
function renderExamplesDeck() {
  const esc = escapeHtml;
  const all = course.workedExamples;
  const levels = ["Basic", "Intermediate", "Challenge"];
  const viewed = new Set(progress.examplesViewed || []);
  let shown = all;

  const exampleSlide = (item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">${esc(item.difficulty)} · ${esc(item.outcomeId)}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      <div class="gc-pattern" lang="en">${esc(item.prompt)}</div>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`, "Listen to example")}</div>
      <details class="gc-practice" data-example="${esc(item.id)}"><summary>Show worked solution</summary><div class="gc-prose">${richText(item.solution)}</div></details>
    </div></section>`;

  const deck = mountDeck({
    ...deckPlacement(),
    heading: "Twelve examples · three levels",
    intro: deckIntro("examples"),
    label: "Example",
    emptyMessage: "No examples at this level yet.",
    tools: `<div class="wc-tools">
        <select id="example-level" aria-label="Filter examples by level"><option value="all">All levels</option>${levels.map((level) => `<option value="${level}">${level}</option>`).join("")}</select>
        <span class="status-chip" id="examples-count">${viewed.size}/${all.length} solutions opened</span>
      </div>`,
  });

  const updateCount = () => {
    const counter = $("#examples-count");
    if (counter) counter.textContent = `${viewed.size}/${all.length} solutions opened`;
  };
  deck.root.addEventListener("toggle", (event) => {
    const details = event.target.closest("[data-example]");
    if (!details?.open) return;
    viewed.add(details.dataset.example);
    progress.examplesViewed = [...viewed];
    saveProgress();
    updateCount();
    if (viewed.size === all.length) complete("examples", "All twelve worked examples reviewed.");
  }, true);

  const drawDeck = () => {
    const level = $("#example-level")?.value || "all";
    shown = level === "all" ? all : all.filter((item) => item.difficulty === level);
    deck.setSlides(shown.map(exampleSlide));
  };
  $("#example-level")?.addEventListener("change", drawDeck);
  drawDeck();
  updateCount();
}

function renderExamples() {
  if (bothDesigns()) return renderBothDesigns(renderExamplesClassic, renderExamplesDeck, "The same examples, one at a time.");
  return renderExamplesClassic();
}

function renderExamplesClassic() {
  const { $, $$ } = classicScope();
  let level="Basic";
  const viewed=new Set(progress.examplesViewed||[]);
  const draw=()=>{
    const items=course.workedExamples.filter(item=>item.difficulty===level);
    $("#app").innerHTML = `${pageHeader("Twelve examples · three levels", "Worked Examples", "Study four Basic, four Intermediate and four Challenge examples. Each solution explains why the step works.")}
      <div class="subtabs">${["Basic","Intermediate","Challenge"].map(item=>`<button class="subtab ${item===level?'active':''}" data-example-level="${item}" type="button">${item} · ${course.workedExamples.filter(example=>example.difficulty===item).length}</button>`).join('')}</div>
      <div class="task-grid">${items.map((item) => `<article class="panel"><span class="eyebrow">${escapeHtml(item.difficulty)} · ${escapeHtml(item.outcomeId)}</span><h3>${escapeHtml(item.title)}</h3><p class="rule-box">${escapeHtml(item.prompt)}</p>${voiceButton(`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`, "Listen to example")}<details data-example="${item.id}"><summary>Show worked solution</summary>${richText(item.solution)}</details></article>`).join("")}</div>
      <section class="panel examples-progress"><strong>${viewed.size}/12</strong><span>solutions opened</span><div class="progress-track"><span style="width:${viewed.size/12*100}%"></span></div></section>`;
    $$('[data-example-level]').forEach(button=>button.addEventListener('click',()=>{level=button.dataset.exampleLevel;draw();}));
    $$('[data-example]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open){viewed.add(details.dataset.example);progress.examplesViewed=[...viewed];saveProgress();if(viewed.size===course.workedExamples.length)complete('examples','All twelve worked examples reviewed.');}}));
  };
  draw();
}

// Guided Practice as a deck: one question per slide, with the same three kinds
// of support beside it — check, a hint that deepens each time it is asked, and
// the next mathematical step.
//
// The page grouped twelve questions under level headings; the level rides on the
// slide instead. The progressive hint counter is per question and lives on the
// button, as it did in the grid, so it survives a swipe away and back.
function renderPracticeDeck() {
  const esc = escapeHtml;
  const items = course.practice;
  const slides = items.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${items.length} · ${esc(item.level)}</span>
      <div class="gc-pattern" lang="en">${esc(item.prompt)}</div>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to question")}</div>
      <div class="wc-sentence">
        <small>Your answer</small>
        <input class="math-input" data-practice="${esc(item.id)}" autocomplete="off" placeholder="Type your answer or working notes" aria-label="Your answer to question ${index + 1}">
      </div>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check-practice="${esc(item.id)}">${deckIcon("list-checks")} Check my answer</button>
        <button class="gc-btn ghost" type="button" data-hint-practice="${esc(item.id)}">${deckIcon("lightbulb")} Give me a hint</button>
        <button class="gc-btn ghost" type="button" data-step-practice="${esc(item.id)}">${deckIcon("arrow-right")} Show next step</button>
      </div>
      <div data-practice-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Support that adapts",
    intro: deckIntro("guided"),
    label: "Question",
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-check-practice], [data-hint-practice], [data-step-practice]");
      if (!target) return undefined;
      const id = target.dataset.checkPractice || target.dataset.hintPractice || target.dataset.stepPractice;
      const item = items.find((candidate) => candidate.id === id);
      const box = $(`[data-practice-feedback="${CSS.escape(id)}"]`);
      if (!item || !box) return undefined;
      if (target.dataset.stepPractice) {
        box.innerHTML = `<p class="feedback try"><span class="field-label">Next step:</span> ${esc(item.hint)} Do that step, then check your answer again.</p>`;
        return undefined;
      }
      if (target.dataset.hintPractice) {
        const used = Number(target.dataset.used || 0) + 1;
        target.dataset.used = String(used);
        // Same three-step escalation as the grid, and the same rule about its last
        // step: it names where the method is taught, never the answer. See the
        // note in renderPracticeClassic.
        const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `Study the Worked Examples for ${course.unit.unitTitle} — one of the twelve uses this method — or ask your AI tutor to set out just the first step.`];
        box.innerHTML = `<p class="feedback try"><span class="field-label">Hint ${Math.min(used, 3)}:</span> ${esc(hints[Math.min(used - 1, 2)])}</p>`;
        return undefined;
      }
      const correct = answerMatches($(`[data-practice="${CSS.escape(id)}"]`)?.value, item.answer);
      box.innerHTML = correct
        ? feedbackHtml("good", "Correct reasoning!", item.answer)
        : `<p class="feedback try"><span class="status-note">Not yet.</span> Your response does not match the reviewed guidance yet. ${esc(item.hint)} Try representing the idea in a simpler way first.</p>`;
      if (correct && !progress.practiceOpened.includes(item.id)) { progress.practiceOpened.push(item.id); saveProgress(); }
      if (progress.practiceOpened.length === items.length) complete("guided", "Guided Practice complete.");
      return undefined;
    },
  });
}

function renderPractice() {
  if (bothDesigns()) return renderBothDesigns(renderPracticeClassic, renderPracticeDeck, "The same questions, one at a time.");
  return renderPracticeClassic();
}

function renderPracticeClassic() {
  const { $, $$ } = classicScope();
  const levels = [...new Set(course.practice.map((item) => item.level))];
  $("#app").innerHTML = `${pageHeader("Support that adapts", "Guided Practice", "Answer with support. Check your idea, ask for a progressive hint or reveal only the next mathematical step.")}
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
    // the question was already free; it costs the section's meaning now that
    // completing Guided Practice means the mathematics was actually done.
    //
    // So the escalation ends by naming where the method is taught rather than
    // handing over the result. Every unit carries twelve worked examples across
    // the same three levels, and the tutor is available at any hour.
    const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `Study the Worked Examples for ${course.unit.unitTitle} — one of the twelve uses this method — or ask your AI tutor to set out just the first step.`];
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><span class="field-label">Hint ${Math.min(used,3)}:</span> ${escapeHtml(hints[Math.min(used-1,2)])}</p>`;
  }));
  $$('[data-answer]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.answer);
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><span class="field-label">Next step:</span> ${escapeHtml(item.hint)} Do that step, then check your answer again.</p>`;
  }));
}

// Activities as a deck: one investigation per slide — what to gather, the steps,
// and the box to record what happened. Per-activity "Mark complete" is kept (it
// is how a learner tracks separate investigations) and marks its own button
// without repainting the slide, so the note just typed stays where it was left.
function renderActivitiesDeck() {
  const esc = escapeHtml;
  const activities = course.activities;
  const slides = activities.map((activity, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Activity ${index + 1} of ${activities.length} · Hands-on investigation</span>
      <h3 class="gc-title">${esc(activity.title)}</h3>
      <p class="gc-note gc-try"><span class="field-label">You need:</span> ${esc(activity.materials)}</p>
      <div class="gc-actions">${deckVoice(`${activity.title}. You need: ${activity.materials}. ${activity.steps.join(" ")}`, "Listen to the activity")}</div>
      <ol class="agenda">${activity.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <div class="wc-sentence">
        <small>Your answer or what you noticed</small>
        <textarea class="activity-response" rows="4" data-activity-response="${index}" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${esc(activity.title)}"></textarea>
      </div>
      <button class="gc-btn ghost" type="button" data-activity-done="${index}">${deckIcon("check")} Mark complete</button>
      ${index === activities.length - 1 ? deckFinish("activities", "Finish activities") : ""}
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Learn by doing",
    intro: deckIntro("activities"),
    label: "Activity",
    slides,
    onClick: (event, deck) => {
      const target = event.target.closest("[data-activity-done], [data-deck-finish]");
      if (!target) return undefined;
      if (target.dataset.activityDone) {
        target.disabled = true;
        target.classList.remove("ghost");
        target.classList.add("done");
        target.innerHTML = `${deckIcon("check-circle")} Complete`;
        return undefined;
      }
      // The grid's gate, unchanged: every activity marked before the section is.
      if (deck.root.querySelectorAll("[data-activity-done]:not([disabled])").length) return toast("Mark each activity complete first.");
      return complete("activities", "Unit activities complete.");
    },
  });
}

function renderActivities() {
  if (bothDesigns()) return renderBothDesigns(renderActivitiesClassic, renderActivitiesDeck, "The same activities, one at a time.");
  return renderActivitiesClassic();
}

function renderActivitiesClassic() {
  const { $, $$ } = classicScope();
  $("#app").innerHTML = `${pageHeader("Learn by doing", "Activities", `Complete six practical ${escapeHtml(course.unit.unitTitle)} investigations using familiar materials.`)}
    <div class="task-grid">${course.activities.map((activity, index) => `<article class="panel task-card"><span class="eyebrow">Activity ${index + 1} · Hands-on investigation</span><h2>${escapeHtml(activity.title)}</h2><p class="rule-box"><span class="field-label">You need:</span> ${escapeHtml(activity.materials)}</p><ol class="agenda">${activity.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><textarea class="activity-response" rows="4" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${escapeHtml(activity.title)}"></textarea><button class="button secondary" data-activity-done="${index}" type="button">✓ Mark complete</button></article>`).join("")}</div>
    <p><button class="button primary" id="activities-done" type="button">Finish activities ✓</button></p>`;
  $$('[data-activity-done]').forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.textContent = "✓ Complete"; }));
  $("#activities-done").addEventListener("click", () => {
    if (!$$('[data-activity-done]').every((button) => button.disabled)) return toast("Mark each activity complete first.");
    complete("activities", "Unit activities complete.");
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
      id: "mental-math-dash", icon: "⚡", skill: "Mental mathematics", title: "Mental Math Dash",
      description: "Use place-value shortcuts to calculate accurately.", type: "choice",
      rounds: [
        { prompt: "What is 10 more than 35?", choices: ["36", "45", "55"], answer: "45", clue: "Add one ten; keep the ones.", explanation: "35 plus 10 is 45." },
        { prompt: "What is 10 less than 82?", choices: ["72", "81", "92"], answer: "72", clue: "Subtract one ten; keep the ones.", explanation: "82 minus 10 is 72." },
        { prompt: "What is 50 + 7?", choices: ["12", "57", "75"], answer: "57", clue: "Combine five tens and seven ones.", explanation: "50 plus 7 equals 57." },
        { prompt: "What is 68 - 8?", choices: ["60", "61", "76"], answer: "60", clue: "Remove all eight ones.", explanation: "68 minus 8 leaves 6 tens, or 60." }
      ]
    },
    {
      id: "real-life-math", icon: "⌂", skill: "Problem solving", title: "Real-Life Math",
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
  $("#app").innerHTML = `${pageHeader("Play, practise, master", "Game zone", "Twelve short Mathematics games turn place value, counting, comparing, patterns and problem solving into active practice.", "Stage 2 games")}
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
  if (mastered===gamePack.games.length) complete("games", "All Mathematics games mastered.");
  $("#app").innerHTML = `<section class="panel game-result"><div class="score-ring">${gameScore}/${game.rounds.length}</div><span class="eyebrow">${passed?'Game mastered':'Keep practising'}</span><h1>${passed?'Brilliant work!':'Nearly there!'}</h1><p>You earned ${gameScore} stars and ${gameScore*20+(passed?20:0)} XP in ${escapeHtml(game.title)}.</p><div class="game-stars large">${game.rounds.map((_,index)=>`<span class="${index<gameScore?'earned':''}">★</span>`).join('')}</div><div class="game-tools"><button class="button secondary" id="replay-game" type="button">↻ Play again</button><button class="button primary" id="games-home" type="button">Choose another game →</button></div></section>`;
  $("#replay-game").addEventListener("click", () => startMathGame(game.id));
  $("#games-home").addEventListener("click", () => { activeGameId=null; renderGames(); });
}

function renderFluency() {
  const items = course.fluency;
  $("#app").innerHTML = `${pageHeader("Speed after understanding", "Math Fluency", "Build accuracy and confidence with a short number sprint. Fluency supports conceptual learning; it does not replace it.")}
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
      // Reaching the end is not the same as being fluent. This used to complete
      // on the last question whatever the score, so a sprint answered wrongly
      // twelve times out of twelve reported "Math Fluency sprint complete." and
      // ticked the section — which mattered little while grading accepted any
      // substring and nobody could fail, and matters now that it does not.
      //
      // The threshold is the unit's own assessment.passPercent rather than a
      // number invented here: 80 in all 133 units, and the figure the course
      // already tells learners is mastery.
      const needed = Math.ceil(items.length * (course.assessment?.passPercent ?? 80) / 100);
      if (score >= needed) complete("fluency", "Math Fluency sprint complete.");
      else {
        // A section that cannot be completed holds the rest of the grade shut,
        // so falling short has to offer another run rather than a dead end.
        $("#fluency-feedback").innerHTML = `<p class="feedback try"><span class="status-note">${score} of ${items.length} — fluency needs ${needed}.</span> Review the worked examples for the ones you missed, then run the sprint again.</p><button class="button primary" id="retry-fluency" type="button">↻ Run the sprint again</button>`;
        $("#retry-fluency").addEventListener("click", renderFluency);
      }
    } else draw();
  });
  $("#fluency-answer").addEventListener("keydown",event=>{if(event.key==="Enter")$("#check-fluency").click();});
  draw();
}

// Solve Real Problems as a deck: one situation per slide, with the working space
// under it. Checking a correct answer disables that slide's Check button exactly
// as the grid did, and the section completes when every problem is answered.
const PROBLEM_GLYPHS = ["⌂", "◫", "🚌", "▦", "◇", "✦"];
function renderRealProblemsDeck() {
  const esc = escapeHtml;
  const problems = course.realProblems;
  const slides = problems.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Problem ${index + 1} of ${problems.length} · ${esc(item.context)} · ${esc(item.difficulty)}</span>
      <div class="gc-emoji" aria-hidden="true">${PROBLEM_GLYPHS[index] || "#"}</div>
      <div class="gc-pattern" lang="en">${esc(item.prompt)}</div>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to problem")}</div>
      <div class="wc-sentence">
        <small>Your calculation and answer</small>
        <textarea rows="4" data-problem="${esc(item.id)}" placeholder="Show your calculation and answer…" aria-label="Your answer to problem ${index + 1}"></textarea>
      </div>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check-problem="${esc(item.id)}">${deckIcon("list-checks")} Check answer</button>
        <button class="gc-btn ghost" type="button" data-hint-problem="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
      </div>
      <div data-problem-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Mathematics in daily life",
    intro: deckIntro("problems"),
    label: "Problem",
    slides,
    onClick: (event, deck) => {
      const target = event.target.closest("[data-check-problem], [data-hint-problem]");
      if (!target) return undefined;
      const id = target.dataset.checkProblem || target.dataset.hintProblem;
      const item = problems.find((candidate) => candidate.id === id);
      const box = $(`[data-problem-feedback="${CSS.escape(id)}"]`);
      if (!item || !box) return undefined;
      if (target.dataset.hintProblem) {
        box.innerHTML = `<p class="feedback try"><span class="field-label">Hint:</span> ${esc(item.hint)}</p>`;
        return undefined;
      }
      const correct = answerMatches($(`[data-problem="${CSS.escape(id)}"]`)?.value, item.answer);
      box.innerHTML = feedbackHtml(correct ? "good" : "try", correct ? "Applied correctly!" : "Check the situation.", correct ? item.answer : item.hint);
      if (correct) target.disabled = true;
      if (!deck.root.querySelectorAll("[data-check-problem]:not([disabled])").length) complete("problems", "Real-world problems complete.");
      return undefined;
    },
  });
}

function renderRealProblems() {
  if (bothDesigns()) return renderBothDesigns(renderRealProblemsClassic, renderRealProblemsDeck, "The same problems, one at a time.");
  return renderRealProblemsClassic();
}

function renderRealProblemsClassic() {
  const { $, $$ } = classicScope();
  const problems = course.realProblems;
  $("#app").innerHTML = `${pageHeader("Mathematics in daily life", "Solve Real Problems", `Apply ${escapeHtml(course.unit.unitTitle)} to home, school, markets, travel and the wider community.`)}
    <div class="problem-grid">${problems.map((item,index)=>`<article class="panel real-problem"><div class="problem-icon">${["⌂","◫","🚌","▦","◇","✦"][index]||"#"}</div><span class="eyebrow">${escapeHtml(item.context)} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt, "Listen to problem")}<textarea id="problem-${item.id}" placeholder="Show your calculation and answer…"></textarea><div class="question-actions"><button class="button primary" data-check-problem="${item.id}" type="button">Check answer</button><button class="button secondary" data-problem-hint="${item.id}" type="button">Hint</button></div><div id="problem-feedback-${item.id}"></div></article>`).join("")}</div>`;
  $$('[data-check-problem]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.checkProblem);const correct=answerMatches($(`#problem-${item.id}`).value,item.answer);$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Applied correctly!':'Check the situation.'}</span> ${escapeHtml(correct?item.answer:item.hint)}</p>`;if(correct)button.disabled=true;if($$('[data-check-problem]').every(itemButton=>itemButton.disabled))complete("problems","Real-world problems complete.");}));
  $$('[data-problem-hint]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.problemHint);$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback try"><span class="field-label">Hint:</span> ${escapeHtml(item.hint)}</p>`;}));
}

// Explain Your Thinking as a deck: one reasoning prompt per slide.
//
// The two-column page put the key ideas and the model explanation in a panel
// beside the writing space. A slide has no room for a column next to what the
// learner is writing — and they should be looking at their explanation — so both
// fold into <details> under the box, the same move the English writing deck
// makes with its checklist. The key-ideas check is unchanged.
function renderExplainThinkingDeck() {
  const esc = escapeHtml;
  const prompts = course.reasoningPrompts;
  const completed = new Set(progress.reasoning || []);

  const slides = prompts.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Reasoning ${index + 1} of ${prompts.length} · ${esc(item.difficulty)}</span>
      <div class="gc-pattern" lang="en">${esc(item.prompt)}</div>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to prompt")}</div>
      <div class="wc-sentence">
        <small>Your explanation</small>
        <textarea rows="6" data-reasoning="${esc(item.id)}" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…" aria-label="Your explanation for reasoning prompt ${index + 1}"></textarea>
      </div>
      <button class="gc-btn" type="button" data-check-reasoning="${esc(item.id)}">${deckIcon("list-checks")} Check mathematical ideas</button>
      <div data-reasoning-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
      <details class="gc-practice"><summary>Key ideas</summary><ul class="checklist">${item.keyIdeas.map((idea) => `<li>${esc(idea)}</li>`).join("")}</ul></details>
      <details class="gc-practice"><summary>Show model explanation</summary><p class="gc-note">${esc(item.modelAnswer)}</p><div class="gc-actions">${deckVoiceSmall(item.modelAnswer, "Listen to model answer")}</div></details>
      ${grownUpGuide(item)}
    </div></section>`);

  mountDeck({
    ...deckPlacement(),
    heading: "Reasoning matters",
    intro: deckIntro("explain"),
    label: "Prompt",
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-check-reasoning]");
      if (!target) return undefined;
      const id = target.dataset.checkReasoning;
      const item = prompts.find((candidate) => candidate.id === id);
      const box = $(`[data-reasoning-feedback="${CSS.escape(id)}"]`);
      if (!item || !box) return undefined;
      const text = ($(`[data-reasoning="${CSS.escape(id)}"]`)?.value || "").toLowerCase();
      const hits = item.keyIdeas.filter((idea) => idea.toLowerCase().split(/\s+/).some((word) => word.length > 2 && text.includes(word))).length;
      const secure = text.length > 30 && (hits > 0 || item.keyIdeas.length === 0);
      box.innerHTML = secure
        ? feedbackHtml("good", "Your explanation includes mathematical evidence.", item.modelAnswer)
        : `<p class="feedback try"><span class="status-note">Add more mathematical evidence.</span> Use these ideas: ${esc(item.keyIdeas.join(", "))}.</p>`;
      if (secure) {
        completed.add(item.id);
        progress.reasoning = [...completed];
        saveProgress();
        if (completed.size === prompts.length) complete("explain", "Reasoning explanations complete.");
      }
      return undefined;
    },
  });
}

function renderExplainThinking() {
  if (bothDesigns()) return renderBothDesigns(renderExplainThinkingClassic, renderExplainThinkingDeck, "The same prompts, one at a time.");
  return renderExplainThinkingClassic();
}

function renderExplainThinkingClassic() {
  const { $, $$ } = classicScope();
  let active=0;
  const completed=new Set(progress.reasoning||[]);
  const draw=()=>{const item=course.reasoningPrompts[active];$("#app").innerHTML=`${pageHeader("Reasoning matters", "Explain Your Thinking", `Explain the ideas in ${escapeHtml(course.unit.unitTitle)} using mathematical evidence, not only a final answer.`)}<div class="reasoning-tabs">${course.reasoningPrompts.map((entry,index)=>`<button class="${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-reasoning-index="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.difficulty)}</button>`).join('')}</div><div class="explain-layout"><section class="panel"><span class="eyebrow">Reasoning prompt</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt,"Listen to prompt")}<textarea id="reasoning-text" rows="9" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…"></textarea><button class="button primary" id="check-reasoning-text" type="button">Check mathematical ideas</button><div id="reasoning-text-feedback"></div></section><section class="panel"><h3>Key ideas</h3><ul class="checklist">${item.keyIdeas.map((idea)=>`<li>${escapeHtml(idea)}</li>`).join('')}</ul><details><summary>Show model explanation</summary><p>${escapeHtml(item.modelAnswer)}</p>${voiceButton(item.modelAnswer,"Listen to model answer")}</details></section></div>`;$$('[data-reasoning-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.reasoningIndex);draw();}));$("#check-reasoning-text").addEventListener('click',()=>{const text=$("#reasoning-text").value.toLowerCase();const hits=item.keyIdeas.filter((idea)=>idea.toLowerCase().split(/\s+/).some((word)=>word.length>2&&text.includes(word))).length;const secure=text.length>30&&(hits>0||item.keyIdeas.length===0);$("#reasoning-text-feedback").innerHTML=`<p class="feedback ${secure?'good':'try'}"><span class="status-note">${secure?'Your explanation includes mathematical evidence.':'Add more mathematical evidence.'}</span> ${secure?escapeHtml(item.modelAnswer):`Use these ideas: ${escapeHtml(item.keyIdeas.join(', '))}.`}</p>`;if(secure){completed.add(item.id);progress.reasoning=[...completed];saveProgress();if(completed.size===course.reasoningPrompts.length)complete('explain','Reasoning explanations complete.');}});};
  draw();
}

function renderLiveClass() {
  $("#app").innerHTML = `${pageHeader("Learn together", "Live Math Class", "Bring your model, one solved problem and one question for teacher-led instruction and group practice.")}
    <div class="live-grid"><article class="panel live-card"><time>Session 1 · 35 minutes</time><h2>Model the core ideas</h2><h3>Before class</h3><p>Bring one model or object connected to ${escapeHtml(course.unit.unitTitle)}.</p><h3>Class plan</h3><ol class="agenda"><li>Teacher demonstration: ${escapeHtml(course.concepts[0]?.title || course.unit.unitTitle)}</li><li>Partner model-building challenge</li><li>Discuss key words and methods</li><li>Error clinic and questions</li></ol><h3>After class</h3><p>Complete two Guided Practice items you previously found difficult.</p><button class="button primary" data-live-ready type="button">I’m ready for class</button></article><article class="panel live-card"><time>Session 2 · 35 minutes</time><h2>Apply and explain</h2><h3>Before class</h3><p>Bring one solved real-life problem and one reasoning question.</p><h3>Class plan</h3><ol class="agenda"><li>Fluency warm-up</li><li>${escapeHtml(course.concepts[1]?.title || "Concept")} investigation</li><li>Small-group application problems</li><li>Explain-your-thinking presentations</li></ol><h3>After class</h3><p>Revise one explanation and prepare for the Unit Challenge.</p><button class="button primary" data-live-ready type="button">I’m ready for class</button></article></div>`;
  $$('[data-live-ready]').forEach(button=>button.addEventListener("click",()=>{button.disabled=true;button.textContent="Ready ✓";if($$('[data-live-ready]').every(item=>item.disabled))complete("live","Live Math Class preparation complete.");}));
}

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
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${assessmentScore}/${course.assessment.questions.length}</div><span class="eyebrow">Checkpoint complete</span><h2>${percent >= course.assessment.passPercent ? "Mastery target reached" : "Review and try again"}</h2><p>You scored ${percent}%. Use the feedback to choose your next learning step.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-assessment" type="button">Try again</button><button class="button primary" id="finish-assessment" type="button">Continue →</button></div></div>`;
    $("#retry-assessment").addEventListener("click", renderAssessment);
    $("#finish-assessment").addEventListener("click", () => { if (percent >= 60) complete("challenge"); navigate("progress"); });
    if (percent >= 60) complete("challenge", "Unit Challenge recorded on this device.");
    return;
  }
  const item = course.assessment.questions[assessmentIndex];
  shell.innerHTML = `<div class="quiz-top"><span>Question ${assessmentIndex + 1} of ${course.assessment.questions.length}</span><strong>${assessmentScore} correct</strong></div><div class="progress-track"><span style="width:${assessmentIndex / course.assessment.questions.length * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(item.question)}</h2>${voiceButton(item.question, "Listen to question")}<div class="quiz-options">${item.options.map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback"></div><button class="button primary" id="next-question" type="button" hidden>Next question →</button>`;
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
  $("#app").innerHTML = `${pageHeader(`All ${manifest.units.length} units · authentic application`, `${course.stage.label} Mathematics Capstone`, gradeCapstone.overview)}
    <section class="capstone-hero"><div><span class="eyebrow">Driving question</span><h2>${escapeHtml(project.drivingQuestion)}</h2><p>${escapeHtml(project.finalProduct)}</p>${voiceButton(`${project.drivingQuestion} ${project.finalProduct}`, "Listen to the capstone")}</div><div class="capstone-score"><strong>${savedStages}/${project.stages.length}</strong><span>stages documented</span><small>${savedEvidence}/${project.evidenceChecklist.length} evidence items ready</small></div></section>
    <div class="capstone-stage-grid">${project.stages.map((stage) => `<article class="panel capstone-stage ${gradeProgress.capstoneResponses[stage.id]?.trim().length >= 20 ? "complete" : ""}"><span class="eyebrow">Units ${stage.units.join(", ")}</span><h2>${escapeHtml(stage.title)}</h2><p>${escapeHtml(stage.prompt)}</p>${voiceButton(stage.prompt, `Listen to ${stage.title}`)}<label for="capstone-${stage.id}">Record your plan or evidence</label><textarea id="capstone-${stage.id}" data-capstone-response="${stage.id}" rows="5" placeholder="Write what you made, calculated or discovered…">${escapeHtml(gradeProgress.capstoneResponses[stage.id] || "")}</textarea><small><span class="field-label">Evidence:</span> ${escapeHtml(stage.evidence)}</small></article>`).join("")}</div>
    <div class="capstone-review-grid"><section class="panel"><h2>Evidence checklist</h2><div class="capstone-checklist">${project.evidenceChecklist.map((item, index) => `<label><input type="checkbox" data-capstone-evidence="${index}" ${gradeProgress.capstoneEvidence[index] ? "checked" : ""}> <span>${escapeHtml(item)}</span></label>`).join("")}</div><button class="button primary" id="save-capstone" type="button">Save capstone progress</button></section><section class="panel"><h2>Success rubric</h2><div class="rubric-list">${project.rubric.map((item) => `<article><strong>${escapeHtml(item.criterion)}</strong><p>${escapeHtml(item.secure)}</p></article>`).join("")}</div></section></div>`;
  $("#save-capstone").addEventListener("click", () => {
    $$('[data-capstone-response]').forEach((field) => { gradeProgress.capstoneResponses[field.dataset.capstoneResponse] = field.value.trim(); });
    $$('[data-capstone-evidence]').forEach((field) => { gradeProgress.capstoneEvidence[field.dataset.capstoneEvidence] = field.checked; });
    const stagesDone = project.stages.every((stage) => (gradeProgress.capstoneResponses[stage.id] || "").length >= 20);
    const evidenceDone = project.evidenceChecklist.every((_, index) => gradeProgress.capstoneEvidence[index]);
    saveGradeProgress();
    if (stagesDone && evidenceDone) {
      emitProgress({ type: "capstone.submitted", unit: "capstone", artifactRef: `local:${STAGE_STORAGE_KEY}` });
      completeGradeSection("capstone", `${course.stage.label} Mathematics Capstone completed.`);
    } else toast("Progress saved. Complete every stage and evidence item to finish the capstone.");
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
  shell.innerHTML = `<div class="quiz-top"><span>Question ${capstoneQuizIndex + 1} of ${quiz.questions.length}</span><strong>${capstoneQuizScore} correct</strong></div><div class="progress-track"><span style="width:${capstoneQuizIndex / quiz.questions.length * 100}%"></span></div><span class="eyebrow">Unit ${item.unitNo}: ${escapeHtml(item.unitTitle)}</span><h2 class="quiz-question">${escapeHtml(item.question)}</h2>${voiceButton(item.question, "Listen to question")}<div class="quiz-options">${item.options.map((option) => `<button class="quiz-option" data-capstone-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="capstone-quiz-feedback"></div><button class="button primary" id="next-capstone-question" type="button" hidden>Next question →</button>`;
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

// No renderReference here, unlike science.js and computing.js. Mathematics has
// no "reference" section in its nav and never registered the route, so the
// function was unreachable: 8 lines of a Quick Reference page no learner could
// open, and a complete("reference") that could not fire. The unit data it read
// is still used — course.reference.terms builds the Math Words & Symbols page
// and course.reference.rules backs the AI tutor's replies — so only the
// orphaned page went. Restoring the page is a product decision: add "reference"
// to the nav sections and the routes map together, never the function alone.

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
    meta: { subject: "mathematics", subjectLabel: "Mathematics", grade: stageNumber, cambridgeCode: `${fw.level} ${fw.code}`, unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle, courseOutline: outlineFromManifest(manifest), unit: course, modules: modulesFromSections(isPrereqUnit ? [] : sections) },
    store: progress,
    ui: { escapeHtml, toast, voiceButton, bindVoiceControls },
    tutorLabel: "Wehel Tutor",
    placeholder: `Ask about ${course.unit.unitTitle}…`,
    quickPrompts: [
      { label: "Explain more simply", message: "Can you explain the first concept in this unit in a simpler way?" },
      { label: "Quiz me", message: "Quiz me on this unit, one question at a time." },
      { label: "Give an easier question", message: "Give me an easier question to build up with." },
      { label: "Help with homework", message: "Can you help me with my homework about this unit?" },
    ],
    fallbackReply: buildTutorReply,
    onExchange: (count) => { if (count >= 2) complete("ai"); },
    fetchUnit: unitFetcher(manifest, dataRootUrl),
    onSaved: saveProgress,
  };
}

function renderAI() {
  $("#app").innerHTML = `${pageHeader("Your AI subject expert", "Wehel Tutor — Mathematics", "Ask questions, go deeper, get quizzed, play maths games or get homework help — by text or voice.", "Wehel Tutor · Ehel Academy AI")}
    <div class="overview-grid"><section class="panel" id="wehel-chat"></section><aside class="section-stack"><section class="panel"><h3>What Wehel Tutor can do</h3><ul class="checklist"><li>Explain this unit more simply — or go deeper</li><li>Quiz you and check your working</li><li>Role play and learning games</li><li>Help with homework without doing it for you</li></ul></section><section class="panel"><h3>Learning boundaries</h3><ul class="checklist"><li>Hints before answers</li><li>Unit content first</li><li>Easier questions when needed</li><li>Checkpoint choices stay yours</li></ul></section></aside></div>`;
  mountWehelChat({ container: $("#wehel-chat"), ...wehelOptions() });
}

function renderReflect() {
  const choices = ["Not yet", "With help", "By myself"];
  $("#app").innerHTML = `${pageHeader("Mastery and next steps", "My Math Progress", "Reflect on each outcome and see which learning steps you have completed.")}
    <section class="panel progress-summary"><div><strong>${unitSectionIds().filter((id) => progress.completed.includes(id)).length}/${unitSectionIds().length}</strong><span>unit learning steps complete</span></div><div class="progress-track"><span style="width:${Math.round(unitSectionIds().filter((id) => progress.completed.includes(id)).length/unitSectionIds().length*100)}%"></span></div></section>
    <section class="panel grade-progress-strip"><div><strong>${gradeProgress.completed.includes("capstone") ? "Complete" : "In progress"}</strong><span>Stage Capstone</span></div><div><strong>${gradeProgress.quizBest || 0}%</strong><span>Capstone Quiz best</span></div><button class="button secondary" data-go="capstone" type="button">View stage capstone</button></section>
    <section class="panel"><div class="self-list">${course.selfAssessment.map((statement, index) => `<div class="self-row"><strong>${escapeHtml(statement)}</strong>${choices.map((choice) => `<button class="self-choice ${progress.reflection[index] === choice ? "selected" : ""}" data-reflect="${index}" data-choice="${choice}" type="button">${choice}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="save-reflection" type="button">Save reflection ✓</button></p></section>`;
  $$('[data-reflect]').forEach((button) => button.addEventListener("click", () => { progress.reflection[button.dataset.reflect] = button.dataset.choice; saveProgress(); renderReflect(); }));
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  $("#save-reflection").addEventListener("click", () => {
    if (Object.keys(progress.reflection).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("progress", "Math progress reflection saved on this device.");
  });
}

function renderTeacher() {
  $("#app").innerHTML = `${pageHeader("Planning · evidence · intervention", "Teacher Resources", "Inspect source provenance, approved content coverage and learner evidence.")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Curriculum status</h2><p><strong>${escapeHtml(cambridgeLabel(stageNumber))}.</strong> Content, progression, answer guidance and the 80% mastery threshold follow this framework. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
      <section class="panel"><h2>Workbook provenance</h2><table class="term-table"><tbody><tr><th>Package</th><td>${escapeHtml(course.provenance.contentPackage)}</td></tr><tr><th>Archive</th><td>${escapeHtml(course.provenance.sourceArchive)}</td></tr><tr><th>Documents</th><td>${course.provenance.sourceDocuments.map(escapeHtml).join("; ")}</td></tr><tr><th>Imported blocks</th><td>${course.provenance.sourceBlockCount}</td></tr><tr><th>Transformation</th><td>${escapeHtml(course.provenance.transformation)}</td></tr></tbody></table></section>
      <section class="panel"><h2>Coverage</h2><div class="stat-row"><div class="stat"><strong>${course.outcomes.length}</strong><small>outcomes</small></div><div class="stat"><strong>${course.workedExamples.length}</strong><small>worked examples</small></div><div class="stat"><strong>${course.assessment.questions.length}</strong><small>checkpoint items</small></div></div></section>
      <section class="panel"><h2>Suggested teaching resources</h2><div class="reference-grid"><div><h3>Manipulatives</h3><p>${escapeHtml(course.activities.map((item)=>item.materials).slice(0,3).join('; '))}.</p></div><div><h3>Evidence to collect</h3><p>Model-building accuracy, Guided Practice responses, activity notes, game mastery, real-problem calculations and reasoning explanations.</p></div></div></section>
      <section class="panel"><h2>Lesson delivery</h2><p><span class="status-note">ElevenLabs narration is active.</span> Learners can listen to the complete structured concept lesson or read it independently.</p></section>
    </div>`;
}
// ===================== config + boot =====================
const config = {
  subjectKey: "mathematics",
  param: "stage",
  mediaSubject: "mathematics",
  ttsPurpose: "ehel_math",
  sections,
  nonCountable: ["overview", "capstone", "capstonequiz", "year-plan", "unit-plan"],
  gradeSections: ["capstone", "capstonequiz"],
  progressDefaults: { completed: [], practiceOpened: [], reflection: {}, aiMessages: [], games: {} },
  gradeDefaults: { completed: [], capstoneResponses: {}, capstoneEvidence: {}, quizBest: 0 },
  keys: (s, u) => ({
    progress: `ehel-math-s${s}-u${u}-progress-v1`,
    grade: `ehel-math-s${s}-capstone-progress-v1`,
    legacyProgress: `ehel-math-g${s}-u${u}-progress-v1`,
    legacyGrade: `ehel-math-g${s}-capstone-progress-v1`,
  }),
  courseKey: (s) => `ehel-math-g${pad2(s)}`,
  visibleSections: () => (isPrereqUnit
    ? [["overview", "layout-dashboard", "Unit Overview"], ["placement", "clipboard-check", "Placement exam"], ["year-plan", "calendar-days", "Student Study Plan"]]
    : sections),
  renderers: {
    overview: () => (isPrereqUnit ? placement.renderOverview() : renderOverview()),
    placement: () => (isPrereqUnit ? placement.renderExam() : navigate("overview")),
    "year-plan": () => (isPrereqUnit ? renderStudyPlan({
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, navigate }),
      stageLabel: `Stage ${prereqStage}`,
      subjectLabel: "Mathematics",
      units: () => manifest.units,
      examLabel: () => "Placement exam",
      firstUnitNumber: 1,
      firstUnitHref: (route = "overview") => `?stage=${prereqStage}&unit=1#${route}`,
      rhythm: [
        ["Day 1", "Lesson", "Read the lesson and meet the unit's words and symbols."],
        ["Day 2", "Explore", "Explore the concept and study the visual models."],
        ["Day 3", "Method", "Learn the method and walk the worked examples."],
        ["Day 4", "Practice", "Do guided practice and solve real problems."],
        ["Day 5", "Check", "Play the games, build fluency and take the unit challenge."],
      ],
      finalRow: () => ({ title: "Stage capstone project & capstone quiz", note: "brings the whole stage together" }),
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
    lesson: renderLesson, ai: renderAI, words: renderMathWords,
    explore: renderExploreConcept, visuals: renderVisualModels, method: renderLearnMethod,
    examples: renderExamples, guided: renderPractice, activities: renderActivities, games: renderGames,
    fluency: renderFluency, problems: renderRealProblems, explain: renderExplainThinking,
    challenge: renderAssessment, capstone: renderGradeCapstone, capstonequiz: renderCapstoneQuiz,
    live: renderLiveClass, progress: renderReflect,
    teacher: () => (isPrereqUnit ? placement.renderTeacher() : renderTeacher()),
  },
  bind,
  wehelOptions,
  // A deck takes the whole viewport while it is mounted; the next route has to
  // get the padded layout back, and whatever the last slide was saying has to
  // stop before its page is replaced.
  onAfterRender: () => { renderSectionGuide(); },
  onBeforeRender: () => {
    stopVoice();
    document.body.classList.remove("gc-full");
    // Both-designs regions belong to the section being left. Cleared here so a
    // renderer that runs on its own paints into #app as it always did.
    classicRegion = null;
    deckMount = null;
  },
  async load(ctx) {
    const s = ctx.stageNumber, u = ctx.unitNumber;
    if (isPrereqUnit) {
      const [m, p] = await Promise.all([
        fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
        fetch(new URL("placement-exam.json", ctx.dataRootUrl)),
      ]);
      if (!m.ok || !p.ok) throw new Error("The Mathematics placement exam could not be loaded.");
      const [prereqManifest, exam] = await Promise.all([m.json(), p.json()]);
      placementExam = exam;
      return { manifest: prereqManifest, course: placementCourseShell(prereqManifest, exam) };
    }
    if (s < 1 || s > 8 || u < 1 || u > 18) throw new Error(`The requested Stage ${s} Mathematics unit is unavailable.`);
    const [m, c, cap] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${u}.json`, ctx.dataRootUrl)),
      fetch(new URL("grade-capstone.json", ctx.dataRootUrl)),
    ]);
    if (!m.ok || !c.ok || !cap.ok) throw new Error("The Mathematics course package could not be loaded.");
    const [manifest, course, gradeCapstone] = await Promise.all([m.json(), c.json(), cap.json()]);
    return { manifest, course, gradeCapstone };
  },
  async onReady(ctx) {
    const course = ctx.course, manifest = ctx.manifest, esc = ctx.escapeHtml, s = ctx.stageNumber, u = ctx.unitNumber;
    const stage = course.stage || course.grade;
    if (isPrereqUnit && !["overview", "placement", "year-plan", "teacher"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && ["placement", "year-plan"].includes(location.hash.slice(1))) location.hash = "overview";
    document.title = `${stage.label} Mathematics | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    ctx.$("#course-label").textContent = `${stage.label} · ${course.subject} · ${course.term.label}`;
    ctx.$("#unit-title").textContent = course.unit.unitTitle;
    ctx.$("#stage-select").innerHTML = Array.from({ length: 8 }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === s ? "selected" : ""}>Stage ${n}</option>`).join("");
    ctx.$("#stage-select").addEventListener("change", () => { location.href = `?stage=${Number(ctx.$("#stage-select").value)}&unit=1#overview`; });
    // The Student Study Plan rides in the unit picker under the Prerequisite
    // entry, one press away from anywhere in the course. Its option value is a
    // route, not a unit number — the change handler routes it.
    const onYearPlan = isPrereqUnit && location.hash.slice(1) === "year-plan";
    const unitOptions = [
      `<option value="${PREREQ_UNIT}" ${isPrereqUnit && !onYearPlan ? "selected" : ""}>Prerequisite: Placement exam</option>`,
      `<option value="year-plan" ${onYearPlan ? "selected" : ""}>Student Study Plan</option>`,
      ...manifest.units.map((unit) => `<option value="${unit.number}" ${unit.number === u ? "selected" : ""}>Unit ${unit.number}: ${esc(unit.title)}</option>`),
    ].join("");
    for (const picker of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) picker.innerHTML = unitOptions;
    for (const picker of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) picker.addEventListener("change", () => { location.href = picker.value === "year-plan" ? `?stage=${s}&unit=${PREREQ_UNIT}#year-plan` : `?stage=${s}&unit=${Number(picker.value)}#overview`; });
  },
};

createCourseApp(config);
