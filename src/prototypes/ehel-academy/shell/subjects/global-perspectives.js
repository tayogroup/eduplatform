// Global Perspectives subject module for the unified course-app shell (P1.5).
// Section renderers kept BYTE-FOR-BYTE from global-perspectives/shared/course-ui.js;
// the scaffolding lives in ../course-app.js.
//
// This course differs from the science/mathematics/computing family in two ways
// the shell already accommodates:
//
//   * There is no stage capstone, so no gradeSections, no gradeDefaults and no
//     STAGE_STORAGE_KEY — the shell treats all three as optional.
//   * Its section list is not fixed. A unit ships as one of two pack shapes
//     (guided for Stages 1-3, self-study for 4-8) and each section appears only
//     when the unit actually carries data for it. That is `availableSections`,
//     wired to the shell's `config.visibleSections` hook.
//
// It keeps its OWN pageHeader rather than the shell's, because a Global
// Perspectives unit is one transferable skill end to end and the header carries
// that skill as a chip. `pageHeader` is therefore deliberately absent from the
// bind list below.
import { createCourseApp } from "../course-app.js";
import { createDeck, deckIcon } from "../deck.js";
import { createPlacementUnit, placementCallout, placementCourseShell, PREREQ_UNIT } from "../placement.js?v=placement-1";
import { renderStudyPlan, renderUnitStudyPlan } from "../study-plan.js?v=study-plan-2";
import { mountWehelChat, modulesFromSections, outlineFromManifest, unitFetcher, PLATFORM_ORIGIN } from "../wehel.js?v=wehel-4";
import { createGetHelp } from "../get-help.js?v=get-help-1";

// Prerequisite unit (unit -1): a placement exam over the previous stages,
// rendered by the shared shell/placement.js from placement-exam.json.
const prereqParams = new URLSearchParams(location.search);
const isPrereqUnit = Number(prereqParams.get("unit")) === PREREQ_UNIT;
const prereqStage = (() => {
  const requested = Number(prereqParams.get("stage") || prereqParams.get("grade")
    || document.documentElement.dataset.stage || document.documentElement.dataset.grade || 1);
  return requested >= 1 && requested <= 8 ? requested : 1;
})();
const gpFrameworkLabel = (stage) => (Number(stage) <= 6
  ? `Cambridge Primary Global Perspectives 0838 — Stage ${stage}`
  : `Cambridge Lower Secondary Global Perspectives 1129 — Stage ${stage}`);
let placementExam;
let placement;

// Shell-provided bindings (populated by bind(ctx)).
let $, $$, escapeHtml, icon, voiceButton, toast, readAlongSpans;
let complete, saveProgress, navigate, emitProgress;
let bindVoiceControls, updateVoiceUI, stopVoice, renderNav, unitSectionIds, stageNumber;
let course, progress, manifest, dataRootUrl;
function bind(ctx) {
  ({ $, $$, escapeHtml, icon, voiceButton, toast, readAlongSpans, complete, saveProgress, navigate,
     emitProgress, bindVoiceControls, updateVoiceUI, stopVoice, renderNav, unitSectionIds,
     stageNumber } = ctx);
  course = ctx.course; progress = ctx.progress; manifest = ctx.manifest; dataRootUrl = ctx.dataRootUrl;
  if (isPrereqUnit) {
    placement = createPlacementUnit({
      storageKey: `ehel-gp-s${prereqStage}-placement-exam-v1`,
      stageLabel: `Stage ${prereqStage}`,
      stageWord: "Stage",
      frameworkLabel: gpFrameworkLabel(prereqStage),
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, toast, navigate, complete, emitProgress }),
      exam: () => placementExam,
      hrefForUnit: (stage, unit, route = "overview") => `?stage=${stage ?? prereqStage}&unit=${unit ?? 1}#${route}`,
      defaultUnitHref: (route = "overview") => `?stage=${prereqStage}&unit=1#${route}`,
      tutorHref: () => `?stage=${prereqStage}&unit=1#tutor`,
    });
  }
}

// The unit actually loaded, which is not always the one asked for: a stage may
// ship fewer units than the URL suggests (Year 5 holds Units 1-2 only), and the
// original boot fell back to the first unit in the manifest rather than
// failing. The picker has to show what was loaded, not what was requested.
let resolvedUnitNo = 1;

// [id, lucide icon, label, hasData(course)]
// The predicate is what keeps one page honest across the two pack shapes.
const SECTIONS = [
  ["overview", "layout-dashboard", "Unit Overview", () => true],
  // Per-unit Study Plan: what the learner does on each day of this
  // unit's calendar weeks, rendered by the shared shell/study-plan.js. A
  // reference page, not a step — in nonCountable, so it never counts toward
  // the unit's bar. The grade-level plan of the same name lives on the
  // Prerequisite unit; this one plans the unit the learner is inside.
  ["unit-plan", "calendar-days", "Unit Study Plan", () => true],
  ["lesson", "book-open", "The Lesson", (c) => c.explainers?.length],
  ["bigideas", "lightbulb", "Big Ideas", (c) => c.bigIdeas?.length],
  ["models", "scan-search", "Worked Examples", (c) => c.models?.length],
  ["goals", "target", "My Learning Goals", (c) => c.outcomes?.length],
  ["toolkit", "book-a", "Skills Toolkit", (c) => c.toolkit?.length || c.checklists?.length],
  ["words", "braces", "Skill Words", (c) => c.reference?.vocabulary?.length],
  ["challenge", "flag", "My Challenge", (c) => c.challenge?.intro || c.challenge?.topics?.length],
  ["activities", "blocks", "Activities", (c) => c.activities?.length],
  ["project", "hammer", "Mini-Project", (c) => c.project?.steps?.length],
  ["practice", "list-checks", "Practice", (c) => c.practice?.length],
  ["quiz", "circle-help", "Unit Quiz", (c) => c.assessment?.questions?.length],
  ["reflect", "messages-square", "Reflection", (c) => c.reflection?.length || c.selfAssessment?.length],
  ["teacher", "video", "Teacher Session", (c) => c.teacherSessions?.length || c.speakingPrompts?.length],
  ["grownup", "users", "For the Grown-Up", (c) => c.grownUpGuide?.sections?.length],
  ["progress", "badge-check", "My Progress", () => true],
];

function availableSections() {
  return SECTIONS.filter(([, , , hasData]) => Boolean(hasData(course || {})));
}

// Explainer bodies carry the unit's full teaching prose with paragraphs
// separated by a blank line. One escaped block would run it all together, so
// each paragraph gets its own <p>.
// `readAlong` wraps each sentence in a .rd-line span so a scoped Listen button
// can highlight it as it is spoken. Opt-in: only the lesson prose is narrated
// as a block, and a span nothing highlights is noise in every other caller.
function richText(value = "", className = "", readAlong = false) {
  const attr = className ? ` class="${className}"` : "";
  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p${attr}>${readAlong ? readAlongSpans(paragraph) : escapeHtml(paragraph)}</p>`)
    .join("");
}

function list(items = [], className = "") {
  if (!items.length) return "";
  return `<ul${className ? ` class="${className}"` : ""}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function table(spec) {
  if (!spec || !spec.rows?.length) return "";
  const head = spec.headers?.length
    ? `<thead><tr>${spec.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>`
    : "";
  const body = spec.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<div class="gp-table-wrap"><table class="gp-table">${head}<tbody>${body}</tbody></table></div>`;
}

const MARKER = { tutor: "🤖", bigIdea: "💡", model: "🔍", speak: "🗣", teacher: "🤝", reflect: "🪞" };

// Stages 1-3 are the guided packs, where a grown-up works alongside the learner.
const isGuided = () => course?.unit?.packShape === "guided";

function box(item, role) {
  const marker = MARKER[role] || "•";
  const lines = item.lines?.length ? list(item.lines) : "";
  // The heading is on screen directly above the Listen button, so reading it
  // aloud repeats what the learner can already see — the script review asked
  // for it to be dropped from the narration across every callout. It is spoken
  // only when the box has no body of its own to read instead.
  const spoken = item.lines?.length ? item.lines.join(" ") : item.title;
  return `<div class="gp-box is-${escapeHtml(role)}">
    <h4><span aria-hidden="true">${marker}</span> ${escapeHtml(item.title)}</h4>
    ${lines}
    ${voiceButton(spoken)}
  </div>`;
}

function pageHeader(kicker, title, description) {
  const skill = course.unit.skill
    ? `<span class="skill-chip is-${escapeHtml(String(course.unit.skill).toLowerCase())}">${escapeHtml(course.unit.skill)}</span>`
    : "";
  return `<header class="page-header"><div><span class="eyebrow">${escapeHtml(kicker)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div><div class="page-actions">${skill}</div></header>`;
}

function doneButton(section, label = "Mark this section done") {
  const already = progress.completed.includes(section);
  return `<div class="page-actions" style="margin-top:22px"><button class="button primary" type="button" data-done="${escapeHtml(section)}" ${already ? "disabled" : ""}>${icon("check")} ${already ? "Done" : escapeHtml(label)}</button></div>`;
}

// --- the slide deck ---------------------------------------------------------
// How the youngest stages meet a teaching section, the same way English Grades
// 1-4 do: one item per full-screen slide, a big Listen button, side arrows,
// dots and swipe, instead of a page they must scroll. The plumbing is
// shell/deck.js — shared with English and Mathematics so the arrows, dots and
// stop-audio-on-slide-change cannot drift between subjects.
//
// Stages 1-4, matching English. Stage 5 and up are left on their pages: by then
// a learner scans a grid rather than being walked through it, and a Stage 6
// toolkit is genuinely a reference to dip into.
//
// The boundary falls INSIDE this subject's two pack shapes rather than along
// them. Stages 1-3 are the guided packs and carry six sections between them;
// Stage 4 is the first self-study pack and adds another six (toolkit, skill
// words, challenge, activities, practice and the quiz), which is why there are
// twelve deck renderers below and not six.
const DECK_MAX_STAGE = 4;
// --- withdrawn stages ---------------------------------------------------------
// A stage listed here is not offered: it does not appear in the stage picker,
// and arriving at it by any other route — a bookmark, a shared link, a
// remediation link out of a later stage's placement report — draws a notice
// instead of the course. Removing it from the picker alone would not be a
// withdrawal, because every one of those routes bypasses the picker.
//
// Stage 5 is withdrawn because it teaches two of the subject's six skills.
// Evaluation, Reflection, Collaboration and Communication were never in the
// source export, and a re-export on 2026-08-09 returned the same two units byte
// for byte, so this is not waiting on a rebuild. The gap and the hold are
// recorded in inputs/ehel-global-perspectives-source/source-manifest.json, and
// check:global-perspectives prints them on every run.
//
// To restore a stage: delete its entry here, delete the matching knownGaps
// entry in the source manifest so the coverage gate guards it again, and lift
// the hold on docs/ehel-global-perspectives-stage-5-syllabus.md.
const WITHDRAWN_STAGES = {
  5: {
    since: "2026-08-09",
    reason: "Stage 5 teaches two of the six Global Perspectives skills. Evaluation, Reflection, Collaboration and Communication are not built.",
  },
};
// Takes the stage explicitly because the two callers see different worlds:
// config.load() runs BEFORE config.bind(), so the module's `stageNumber` is
// still undefined there and the check would silently pass. load() reads it off
// ctx; everything after bind() can use the module binding.
const withdrawalFor = (stage) => WITHDRAWN_STAGES[Number(stage)] || null;
const withdrawal = () => withdrawalFor(stageNumber);

// Enough of a course for the shell to mount without any unit data.
function withdrawnCourseShell(info, stage) {
  return {
    grade: { id: `s0${stage}`, label: `Stage ${stage}` },
    stage: { id: `s0${stage}`, label: `Stage ${stage}` },
    subject: "Global Perspectives",
    term: { label: "Not currently offered" },
    unit: { unitNo: "—", unitTitle: "This stage is not available" },
    visual: {},
    withdrawn: info,
  };
}

function renderWithdrawn() {
  const info = withdrawal();
  const esc = escapeHtml;
  $("#app").innerHTML = `
    <section class="panel">
      <h2>Stage ${stageNumber} Global Perspectives is not available</h2>
      <p>This stage has been withdrawn while its content is completed. It is not
      part of the course offering at the moment, and no work should be started
      in it.</p>
      <p><strong>Why:</strong> ${esc(info.reason)}</p>
      <p>If you were sent here by a placement report, or you had already begun
      this stage, speak to your teacher — they can tell you what to do next and
      whether any work you have done still counts.</p>
      <p class="muted">Withdrawn ${esc(info.since)}.</p>
      <p><a class="button" href="?stage=4&amp;unit=1#overview">Go to Stage 4</a>
         <a class="button secondary" href="?stage=6&amp;unit=1#overview">Go to Stage 6</a></p>
    </section>`;
}

// EVERY route draws the notice on a withdrawn stage, which is what the comment
// on WITHDRAWN_STAGES promises and what guarding two routes by hand did not
// deliver. `overview` and `placement` name the stage, so they were the two that
// got the guard; every teaching route resolves through routeTo -> paint,
// finds its section unavailable on the withdrawn shell — which carries no
// explainers, no practice, nothing — and falls back to renderOverview().
//
// That fallback is the hole. It painted a course-shaped page headed "This stage
// is not available" with an empty lesson panel, a Listen button bound to an
// empty string, and a live "I have read the overview" button. Pressing it
// completed the only countable section the withdrawn shell has, so the unit bar
// read 100% and course-app.js emitted unit.completed — a withdrawn stage
// reporting a finished unit upstream. #progress drew a progress table alongside.
//
// Wrapping the whole map is what makes the guard total: the shell resolves an
// unknown route to `overview`, so every entry plus every typo is covered, and a
// route added later cannot quietly reopen this.
const whenWithdrawn = (renderers) => Object.fromEntries(
  Object.entries(renderers).map(([route, render]) => [route, () => (withdrawal() ? renderWithdrawn() : render())]));

const isDeckStage = () => stageNumber <= DECK_MAX_STAGE;

// BOTH designs, the way English Grades 1-4 show a unit module: the original
// section first, then the same content again as an inline deck under it — not
// the deck INSTEAD of the page, which is what this subject shipped first and
// what English itself moved away from.
//
// Stages 1-4, matching English. This is now the same boundary as
// DECK_MAX_STAGE, which makes the deck-instead-of-the-page branch in routeTo
// unreachable — it is kept only because Stage 5+ still resolves through the
// same helper, and the branch costs one line.
const BOTH_MAX_STAGE = 4;
const isBothStage = () => stageNumber <= BOTH_MAX_STAGE;

// Where the next deck lands. A both-designs page sets it, and every deck
// renderer below mounts inline under the original section without knowing about
// it. Null means the deck owns the page, which is what Stages 2-4 still do.
// Cleared by onBeforeRender, so it can never leak into the next section.
let deckMount = null;

// The deck cannot be built at module load: it closes over $ and escapeHtml,
// which the shell hands us in bind(). Built once on first use instead.
let deckApi = null;
function deck() {
  if (!deckApi) {
    deckApi = createDeck({
      $,
      escapeHtml,
      // Not the shell's icon(): that emits <i data-lucide>, and this course
      // never loads the lucide runtime, so a deck's arrows would be two empty
      // 28px circles. deckIcon draws the same shapes inline.
      icon: deckIcon,
      // A slide change silences the narration for the slide being left. The
      // shell owns the ElevenLabs player, so it owns the stop.
      stopAudio: () => stopVoice?.(),
      // Slides carry the shell's own Listen buttons, and a re-deck or a redraw
      // replaces them with unbound copies. Re-binding is idempotent — the shell
      // marks a bound button with data-voiceBound — so this is safe to call on
      // every paint.
      // untabDeckHalf runs here too, not only after the first mount: a re-deck
      // (the practice part filter) builds new slides and a new dot strip, and
      // fresh controls arrive tabbable.
      afterPaint: () => { bindVoiceControls(); updateVoiceUI(); untabDeckHalf(); },
    });
  }
  // Where a deck lands is decided by whoever is rendering, not by the eleven
  // deck renderers below: on a both-designs page deckMount is set and every one
  // of them mounts inline under the original section, bounded rather than
  // full-bleed, without carrying a parameter for it.
  return {
    ...deckApi,
    mountDeck: (options) => deckApi.mountDeck(deckMount ? { ...options, mount: deckMount, fullBleed: false } : options),
  };
}

// The original section, then the same content as a deck below it.
//
// Simpler here than in English, and for one reason: every renderer in this file
// RETURNS its HTML rather than painting and then querying the document. English
// had to give its originals a scoped paint/$/$$ because a subtab redraw
// reassigned #app.innerHTML and would have erased the deck below. Nothing here
// repaints — the only in-place change a page makes is disabling its own done
// button — so the original half can simply be dropped into the region.
// Takes every control in the AT-hidden deck half out of the tab order.
//
// Has to run after every paint, not once: the deck rebuilds its slides and its
// whole dot strip on setSlides (Stage 4 practice filters itself from 25
// questions to 14), and replaces a single slide on redrawSlide. Each of those
// mints fresh elements, and a fresh button is tabbable — so a learner who
// filtered the practice deck would find the tab order quietly restored.
//
// Reads the region out of the DOM rather than taking it as an argument, because
// the repaint callers are inside the deck and do not know what they are mounted
// into. The aria-hidden attribute IS the condition: no hidden half, nothing to
// do, so this is a no-op on any page that is not both-designs.
function untabDeckHalf() {
  const region = $("#app")?.querySelector('.deck-design[aria-hidden="true"]');
  if (!region) return;
  for (const control of region.querySelectorAll('a[href], button, select, textarea, input, [tabindex]:not([tabindex="-1"])')) {
    control.setAttribute("tabindex", "-1");
  }
}

// A both-designs page carries the section twice, and a screen reader met it as
// the lesson and then the lesson again. The deck half is now hidden from
// assistive tech outright: it is a second PRESENTATION of content already read
// in full above, not second content. Nothing is lost by skipping it — measured
// rather than assumed, the two halves carry the same six Listen buttons over
// the same clips, and the deck's finish button already settles the page's own
// through markSectionDone.
//
// This is a product decision, taken deliberately: the slides remain for mouse
// and touch, and are gone for screen readers AND for sighted keyboard users,
// who now meet the page half alone. That second group is the real cost, and it
// is the reason this was not done as a side effect of an accessibility pass.
//
// `inert` would be the tidy one-attribute version and is WRONG here. Inert
// blocks pointer events as well as focus and AT, so it would not hide the deck
// from screen readers — it would delete the feature for everyone, mouse and
// touch included. What is wanted is narrower, so it takes two things:
//
//   aria-hidden      removes the half from the accessibility tree, inherited by
//                    everything inside it.
//   tabindex="-1"    on every control in it. aria-hidden alone over focusable
//                    controls is its own defect: Tab still lands there, and the
//                    learner is now on something that announces nothing at all.
//
// The aria-label this section briefly carried is gone with it. A named section
// is a `region` landmark, which was the point when the deck was still exposed
// and skippable; on a hidden subtree the name is unreachable, and leaving dead
// ARIA behind reads as an oversight.
function renderBothDesigns(classic, deckRenderer, intro) {
  const app = $("#app");
  app.innerHTML = `<div class="both-designs">
      <div class="classic-design" id="classic-design">${classic()}</div>
      <section class="deck-design" aria-hidden="true">
        <div class="deck-design-head"><span class="eyebrow">Slides</span><p>${escapeHtml(intro)}</p></div>
        <div id="deck-design"></div>
      </section>
    </div>`;
  app.scrollTop = 0;
  deckMount = "#deck-design";
  deckRenderer();
  deckMount = null;
  untabDeckHalf();
  // The original half's Listen buttons were written as a string just now, so
  // they are not bound yet — the deck binds its own through afterPaint, and the
  // shell binds after a renderer returns, but this renderer painted twice.
  bindVoiceControls();
  updateVoiceUI();
}

// A section is now marked done from two places — the page's "Mark this section
// done" and the deck's finish button on its last slide. Pressing either has to
// settle both, or a learner who finished on the page scrolls down to a deck
// still asking them to finish it.
function markSectionDone(section, message) {
  complete(section, message);
  for (const button of $$(`[data-done="${CSS.escape(section)}"], [data-deck-finish="${CSS.escape(section)}"]`)) {
    button.disabled = true;
    button.innerHTML = `${button.hasAttribute("data-deck-finish") ? deckIcon("check") : icon("check")} Done`;
  }
}

// Reaching the end of a deck and pressing its finish button marks the section
// done, exactly as the page's "Mark this section done" does. The page's button
// is handled by the delegated [data-done] listener further down; a deck's is
// inside the deck's own root, so it is handled here.
function finishedInDeck(event, message = "Nice work — that section is marked done.") {
  const target = event.target.closest("[data-deck-finish]");
  if (!target || target.disabled) return false;
  markSectionDone(target.dataset.deckFinish, message);
  return true;
}

// Decoration only, and aria-hidden: a Stage 1 slide that is three paragraphs of
// prose needs something to look at above the text.
const DECK_EMOJI = ["🌍", "🔎", "💭", "🤝", "🌱", "⭐", "🧭", "💬"];

// The lesson: one explainer per slide. Every field the page shows is kept —
// title, the full prose body, the bullets, the tables and the Listen button —
// only the layout changes.
function renderLessonDeck() {
  const { mountDeck, deckFinish } = deck();
  const explainers = course.explainers;
  const slides = explainers.map((explainer, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Part ${index + 1} of ${explainers.length}</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">${DECK_EMOJI[index % DECK_EMOJI.length]}</span> ${escapeHtml(explainer.title)}</h3>
      ${richText(explainer.body, "gc-prose", true)}
      ${list(explainer.bullets, "gc-bullets")}
      ${(explainer.tables || []).map(table).join("")}
      ${explainer.body ? voiceButton(explainer.body, "Listen to this part", ".rd-line", ".gc-slide") : ""}
      ${index === explainers.length - 1 ? deckFinish("lesson", "I have read the lesson") : ""}
    </div></section>`);
  mountDeck({
    heading: course.unit.unitTitle,
    label: "Part",
    slides,
    emptyMessage: "This unit has no lesson pages yet.",
    onClick: (event) => finishedInDeck(event, "Lesson finished — well done."),
  });
}

// Big Ideas, Worked Examples, the teacher session and the speaking prompts are
// all callout boxes on the page. One box per slide here.
//
// `spoken` is computed exactly as box() computes it, so the narration hash is
// the same file the page already asks for: the heading is on screen right above
// the button, so the clip reads the lines and falls back to the title only when
// a box has no lines of its own.
function renderBoxDeck({ section, items, label, heading, finishLabel }) {
  const { mountDeck, deckFinish } = deck();
  const slides = items.map(({ item, role }, index) => {
    const spoken = item.lines?.length ? item.lines.join(" ") : item.title;
    return `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">${escapeHtml(label)} ${index + 1} of ${items.length}</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">${MARKER[role] || "•"}</span> ${escapeHtml(item.title)}</h3>
      ${list(item.lines, "gc-bullets")}
      ${voiceButton(spoken)}
      ${index === items.length - 1 ? deckFinish(section, finishLabel) : ""}
    </div></section>`;
  });
  mountDeck({ heading, label, slides, onClick: (event) => finishedInDeck(event) });
}

// The mini-project: its own introduction, then one step per slide. The steps
// are numbered by the page's CSS counter, which a slide has no equivalent for,
// so the number is written into the eyebrow instead.
function renderProjectDeck() {
  const { mountDeck, deckFinish } = deck();
  const project = course.project;
  const steps = project.steps;
  const intro = `<section class="gc-slide gc-v0"><div class="gc-inner">
      <span class="gc-eyebrow">Mini-Project</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">🔨</span> ${escapeHtml(project.title)}</h3>
      ${richText(project.intro, "gc-prose")}
      <p class="gc-note">This is the big one. Take your time and enjoy it.</p>
    </div></section>`;
  const slides = [intro, ...steps.map((step, index) => `<section class="gc-slide gc-v${(index + 1) % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Step ${index + 1} of ${steps.length}</span>
      <h3 class="gc-title">${escapeHtml(step.title)}</h3>
      ${richText(step.intro, "gc-prose")}
      ${list(step.items, "gc-bullets")}
      ${(step.tables || []).map(table).join("")}
      ${index === steps.length - 1 ? deckFinish("project", "I finished my project") : ""}
    </div></section>`)];
  mountDeck({
    heading: project.title,
    // "Slide", not "Step": the introduction is the first card but is not a step,
    // so a deck labelled Step would count "Step 1 of 6" over a five-step project
    // and disagree with the eyebrow on the very next card.
    label: "Slide",
    slides,
    onClick: (event) => finishedInDeck(event, "Mini-project marked done. That was a big piece of work."),
  });
}

// Reflection: one prompt per slide, with the learner's own thinking written on
// the slide it belongs to. The textarea keeps `data-reflect`, because the
// delegated change listener at the bottom of this file is what saves it — the
// deck does not touch storage. The self-assessment grid, which is a chart
// rather than a question, stays whole on a final slide.
function renderReflectDeck() {
  const { mountDeck, deckFinish } = deck();
  const prompts = course.reflection || [];
  const self = course.selfAssessment || [];
  const slides = prompts.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${prompts.length}</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">🪞</span> ${escapeHtml(item.prompt)}</h3>
      <div class="wc-sentence">
        <small>Your thinking</small>
        <textarea rows="4" data-reflect="${escapeHtml(item.id)}" aria-label="Your thinking about question ${index + 1}">${escapeHtml(progress.reflection[item.id] || "")}</textarea>
      </div>
      ${item.modelAnswer ? `<details class="gc-practice"><summary>One way to answer</summary><p class="gc-note">${escapeHtml(item.modelAnswer)}</p></details>` : ""}
      ${!self.length && index === prompts.length - 1 ? deckFinish("reflect", "I have finished reflecting") : ""}
    </div></section>`);
  if (self.length) {
    slides.push(`<section class="gc-slide gc-v${prompts.length % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">How am I doing?</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">⭐</span> Tick what you can do</h3>
      ${table({ headers: ["I can…", "Not yet", "Yes"], rows: self.map((item) => [item.statement, "", ""]) })}
      ${deckFinish("reflect", "I have finished reflecting")}
    </div></section>`);
  }
  mountDeck({
    heading: "Thinking about how I learn",
    label: "Question",
    slides,
    emptyMessage: "This unit has no reflection questions yet.",
    onClick: (event) => finishedInDeck(event, "Reflection marked done."),
  });
}

// The teacher session and the speaking prompts are one deck: both are things to
// bring to the live session, and at Stage 1 a unit carries a handful of each at
// most. Each keeps its own marker, so a learner can still tell them apart.
function renderTeacherDeck() {
  return renderBoxDeck({
    section: "teacher",
    label: "Card",
    heading: "Bring this to your live session",
    finishLabel: "I am ready for my session",
    items: [
      ...(course.teacherSessions || []).map((item) => ({ item, role: "teacher" })),
      ...(course.speakingPrompts || []).map((item) => ({ item, role: "speak" })),
    ],
  });
}

// The Skills Toolkit: one card per slide, checklists first exactly as the page
// orders them — a checklist is what a learner reaches for mid-task, and the
// explaining cards are what they read once.
function renderToolkitDeck() {
  const { mountDeck, deckFinish } = deck();
  const cards = [...(course.checklists || []), ...(course.toolkit || [])];
  const slides = cards.map((card, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Card ${index + 1} of ${cards.length}</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">🧰</span> ${escapeHtml(card.title)}</h3>
      ${richText(card.intro, "gc-prose")}
      ${list(card.items, "gc-bullets")}
      ${(card.tables || []).map(table).join("")}
      ${index === cards.length - 1 ? deckFinish("toolkit", "I know what is in my toolkit") : ""}
    </div></section>`);
  mountDeck({
    heading: "Your quick reference",
    label: "Card",
    slides,
    onClick: (event) => finishedInDeck(event),
  });
}

// Skill Words: one word per slide, the term set large like a vocabulary card
// and the meaning read aloud beneath it.
//
// No search box, unlike English's vocabulary deck. That exists because an
// English unit holds 13-70 words and swiping is not a way to reach the
// fifty-first; a Global Perspectives unit holds about twenty, which the dot
// strip already gives random access to. If a later stage's glossary grows, the
// wc-tools search is the thing to add.
//
// The wrap-up slide is always last, whatever the glossary holds: it carries the
// common-mistakes list the page shows below the grid, and it is where the
// section is marked done.
function renderWordsDeck() {
  const { mountDeck, deckFinish } = deck();
  const words = course.reference?.vocabulary || [];
  const mistakes = course.reference?.mistakes || [];
  const slides = words.map((word, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Word ${index + 1} of ${words.length}</span>
      <div class="gc-pattern" lang="en">${escapeHtml(word.term)}</div>
      <p class="gc-lead">${escapeHtml(word.meaning)}</p>
      ${/* The term is the card's heading, so the clip reads the meaning only. */ ""}
      ${voiceButton(word.meaning)}
    </div></section>`);
  slides.push(`<section class="gc-slide gc-v${words.length % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Before you go</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">⚠️</span> ${mistakes.length ? "Common mistakes to avoid" : "That is every word"}</h3>
      ${mistakes.length ? list(mistakes, "gc-bullets") : `<p class="gc-lead">Come back to these whenever a word stops making sense.</p>`}
      ${deckFinish("words", "I know these words")}
    </div></section>`);
  mountDeck({ heading: "The words you need", label: "Word", slides, onClick: (event) => finishedInDeck(event) });
}

// My Challenge is not a list of items but three short blocks — what the
// challenge is, topics to choose from, and the checkpoint. One block per slide,
// and a block the unit does not carry simply has no slide.
function renderChallengeDeck() {
  const { mountDeck, deckFinish } = deck();
  const challenge = course.challenge || {};
  const cards = [];
  if (challenge.intro) cards.push({ emoji: "🚩", title: "The project that runs through the unit", body: challenge.intro });
  if (challenge.topics?.length) cards.push({ emoji: "💡", title: "Ideas you could choose", items: challenge.topics });
  if (challenge.checkpoints?.length) cards.push({ emoji: "📍", title: "Your checkpoint", items: challenge.checkpoints });
  const slides = cards.map((card, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">My Challenge · ${index + 1} of ${cards.length}</span>
      <h3 class="gc-title"><span class="gc-emoji" aria-hidden="true">${card.emoji}</span> ${escapeHtml(card.title)}</h3>
      ${card.body ? richText(card.body, "gc-prose") : ""}
      ${list(card.items, "gc-bullets")}
      ${index === cards.length - 1 ? deckFinish("challenge", "I have chosen my challenge") : ""}
    </div></section>`);
  mountDeck({
    heading: "Choose something you care about",
    label: "Card",
    slides,
    onClick: (event) => finishedInDeck(event),
  });
}

// Activities: one activity per slide, with the callout boxes it carries kept
// inside it. Those boxes have Listen buttons of their own, which is why the
// deck re-binds voice controls after every paint.
function renderActivitiesDeck() {
  const { mountDeck, deckFinish } = deck();
  const activities = course.activities || [];
  const slides = activities.map((activity, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Activity ${index + 1} of ${activities.length}</span>
      <h3 class="gc-title">${escapeHtml(activity.label || activity.title)}</h3>
      ${richText(activity.intro, "gc-prose")}
      ${list(activity.steps, "gc-bullets")}
      ${(activity.tables || []).map(table).join("")}
      ${(activity.boxes || []).map((item) => box(item, item.role || "note")).join("")}
      ${index === activities.length - 1 ? deckFinish("activities", "I finished the activities") : ""}
    </div></section>`);
  mountDeck({
    heading: course.unit.unitTitle,
    label: "Activity",
    slides,
    onClick: (event) => finishedInDeck(event),
  });
}

// Practice: one question per slide. A Stage 4 unit carries twenty-five of them
// in two or three named parts, so the part becomes the filter under the dots —
// the same place vocabulary and comprehension put theirs in English.
//
// The reveal keeps `data-answer`, because the capture-phase toggle listener at
// the bottom of this file is what records that an answer was seen; the deck
// does not touch storage.
function renderPracticeDeck() {
  const { mountDeck, deckFinish } = deck();
  const all = course.practice || [];
  const parts = [...new Set(all.map((item) => item.partTitle).filter(Boolean))];
  let items = all;

  const slide = (item, index) => {
    const seen = progress.answersSeen.includes(item.id);
    return `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${items.length}${item.partTitle ? ` · ${escapeHtml(item.partTitle)}` : ""}</span>
      ${item.intro ? `<p class="gc-note">${escapeHtml(item.intro)}</p>` : ""}
      <h3 class="gc-title">${escapeHtml(item.prompt)}</h3>
      ${list(item.options, "gc-bullets")}
      ${item.answer
        ? `<details class="gc-practice" data-answer="${escapeHtml(item.id)}" ${seen ? "open" : ""}>
             <summary>Show the answer</summary><p class="gc-note">${escapeHtml(item.answer)}</p>
           </details>`
        : `<p class="gc-note">This one is yours to set. There is no right answer.</p>`}
      ${index === items.length - 1 ? deckFinish("practice", "I have finished practising") : ""}
    </div></section>`;
  };

  const mounted = mountDeck({
    heading: "Practice",
    label: "Question",
    emptyMessage: "No practice questions in this part yet.",
    tools: parts.length > 1 ? `<div class="wc-tools">
        <select id="part-filter" aria-label="Filter practice by part"><option value="all">All parts</option>${parts.map((part) => `<option value="${escapeHtml(part)}">${escapeHtml(part)}</option>`).join("")}</select>
        <span class="status-chip" id="practice-count">${all.length} questions</span>
      </div>` : "",
    onClick: (event) => finishedInDeck(event),
  });

  // Found inside the deck, not across the document. On a both-designs page the
  // original practice section sits above this one, and while it happens to
  // carry no filter of its own today, a document-wide lookup for the deck's own
  // controls is the bug English hit when its vocabulary lab and deck each
  // rendered #word-search — the deck filtered itself by the page's box.
  const inDeck = (selector) => mounted.root.querySelector(selector);
  const drawDeck = () => {
    const part = inDeck("#part-filter")?.value || "all";
    items = part === "all" ? all : all.filter((item) => item.partTitle === part);
    mounted.setSlides(items.map(slide));
    const counter = inDeck("#practice-count");
    if (counter) counter.textContent = `${items.length} question${items.length === 1 ? "" : "s"}`;
  };
  inDeck("#part-filter")?.addEventListener("change", drawDeck);
  drawDeck();
}

// The unit quiz: one question per slide, written first and compared after. The
// textarea keeps `data-quiz` for the delegated change listener that saves it.
function renderQuizDeck() {
  const { mountDeck, deckFinish } = deck();
  const questions = course.assessment.questions;
  const slides = questions.map((question, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${questions.length}</span>
      <h3 class="gc-title">${escapeHtml(question.prompt)}</h3>
      <div class="wc-sentence">
        <small>Your answer</small>
        <textarea rows="4" data-quiz="${escapeHtml(question.id)}" aria-label="Your answer to question ${index + 1}">${escapeHtml(progress.quiz[question.id] || "")}</textarea>
      </div>
      <details class="gc-practice"><summary>Compare with a model answer</summary><p class="gc-note">${escapeHtml(question.modelAnswer)}</p></details>
      ${index === questions.length - 1 ? deckFinish("quiz", "I have finished the quiz") : ""}
    </div></section>`);
  mountDeck({
    heading: "Write your answer first, then compare",
    label: "Question",
    slides,
    onClick: (event) => finishedInDeck(event, "Quiz finished — well done."),
  });
}

// --- sections ---------------------------------------------------------------
function renderOverview() {
  const unit = course.unit;
  const objectives = course.cambridge?.objectives || [];
  const path = unit.learningPath || [];
  return `
  ${pageHeader(`${course.stage.label} · Unit ${unit.unitNo}`, unit.unitTitle, "What this unit is about, and what you will be able to do by the end.")}
  <section class="panel">
    <h2>What this unit is about</h2>
    ${richText(unit.unitOverview)}
    ${voiceButton(unit.unitOverview, "Listen to the overview")}
  </section>
  ${path.length ? `<section class="panel"><h2>What you will work through</h2>${list(path)}</section>` : ""}
  ${course.outcomes?.length ? `<section class="panel"><h2>By the end you will be able to</h2>${list(course.outcomes.map((o) => o.text))}</section>` : ""}
  ${objectives.length && !isGuided() ? `<section class="panel">
    <h2>Cambridge objectives</h2>
    <p>This unit covers these ${escapeHtml(course.cambridge.level)} objectives at Stage ${course.cambridge.stage}.</p>
    ${table({
      headers: ["Code", "Sub-strand", "What it means"],
      rows: objectives.map((o) => [o.code, o.subStrand, o.learnerText || o.text]),
    })}
  </section>` : ""}
  ${placementCallout({ escapeHtml, storageKey: `ehel-gp-s${stageNumber}-placement-exam-v1`, stageLabel: `Stage ${stageNumber}`, href: `?stage=${stageNumber}&unit=-1#placement`, unitNo: unit.unitNo })}
  ${doneButton("overview", "I have read the overview")}`;
}

function renderLesson() {
  const cards = course.explainers.map((explainer) => `
    <article class="panel concept-card">
      <h2>${escapeHtml(explainer.title)}</h2>
      <div class="concept-body">${richText(explainer.body, "", true)}</div>
      ${list(explainer.bullets)}
      ${(explainer.tables || []).map(table).join("")}
      ${explainer.body ? voiceButton(explainer.body, "Listen to this part", ".rd-line", ".concept-card") : ""}
    </article>`).join("");
  return `
  ${pageHeader("The Lesson", course.unit.unitTitle, "Read this at your own pace. You can stop and come back at any time.")}
  ${cards}
  ${doneButton("lesson", "I have read the lesson")}`;
}

function renderBoxes(section, role, items, kicker, title, description) {
  return `
  ${pageHeader(kicker, title, description)}
  <section class="panel">${items.map((item) => box(item, role)).join("")}</section>
  ${doneButton(section)}`;
}

function renderGoals() {
  const goals = course.goals || {};
  const columns = [
    ["Starting", goals.starting],
    ["Developing", goals.developing],
    ["Getting better", goals.gettingBetter],
  ].filter(([, items]) => items?.length);
  return `
  ${pageHeader("My Learning Goals", "What I am aiming for", "Your skills grow in stages. Nothing here is a test.")}
  ${columns.length ? `<section class="panel"><div class="goal-columns">${columns.map(([label, items]) => `
    <div class="goal-column"><h3>${escapeHtml(label)}</h3>${list(items)}</div>`).join("")}</div></section>`
    : `<section class="panel">${list((course.outcomes || []).map((o) => o.text))}</section>`}
  ${doneButton("goals")}`;
}

function renderToolkit() {
  const cards = (course.toolkit || []).map((card) => `
    <article class="panel">
      <h2>${escapeHtml(card.title)}</h2>
      ${richText(card.intro)}
      ${list(card.items)}
      ${(card.tables || []).map(table).join("")}
    </article>`).join("");
  const checklists = (course.checklists || []).map((check) => `
    <article class="panel">
      <h2>${escapeHtml(check.title)}</h2>
      ${richText(check.intro)}
      ${list(check.items)}
    </article>`).join("");
  return `
  ${pageHeader("Skills Toolkit", "Your quick reference", "You do not need to read this end to end. Jump to the part you need, whenever you need it.")}
  ${checklists}${cards}
  ${doneButton("toolkit")}`;
}

function renderWords() {
  const rows = (course.reference?.vocabulary || []).map((word) => `
    <article class="panel">
      <h3>${escapeHtml(word.term)}</h3>
      <p>${escapeHtml(word.meaning)}</p>
      ${/* The term is the card's heading, so the clip reads the meaning only. */ ""}
      ${voiceButton(word.meaning)}
    </article>`).join("");
  const mistakes = course.reference?.mistakes || [];
  return `
  ${pageHeader("Skill Words", "The words you need", "Every word this unit uses, in plain language.")}
  <div class="reference-grid">${rows}</div>
  ${mistakes.length ? `<section class="panel"><h2>Common mistakes to avoid</h2>${list(mistakes)}</section>` : ""}
  ${doneButton("words")}`;
}

function renderChallenge() {
  const challenge = course.challenge || {};
  return `
  ${pageHeader("My Challenge", "The project that runs through the unit", "Choose something you genuinely care about. You will come back to it in every activity.")}
  <section class="panel">
    ${richText(challenge.intro)}
    ${challenge.topics?.length ? `<h2>Ideas you could choose</h2>${list(challenge.topics)}` : ""}
    ${challenge.checkpoints?.length ? `<h2>Your checkpoint</h2>${list(challenge.checkpoints)}` : ""}
  </section>
  ${doneButton("challenge")}`;
}

function renderActivities() {
  const cards = (course.activities || []).map((activity) => `
    <article class="panel">
      <h2>${escapeHtml(activity.label || activity.title)}</h2>
      ${richText(activity.intro)}
      ${list(activity.steps)}
      ${(activity.tables || []).map(table).join("")}
      ${(activity.boxes || []).map((item) => box(item, item.role || "note")).join("")}
    </article>`).join("");
  return `
  ${pageHeader("Activities", course.unit.unitTitle, "Work through these in order. Each one adds a piece to your Challenge.")}
  ${cards}
  ${doneButton("activities")}`;
}

function renderProject() {
  const project = course.project;
  const steps = project.steps.map((step) => `
    <article class="panel project-step">
      <h3>${escapeHtml(step.title)}</h3>
      ${richText(step.intro)}
      ${list(step.items)}
      ${(step.tables || []).map(table).join("")}
    </article>`).join("");
  return `
  ${pageHeader("Mini-Project", project.title, "This is the big one. Take your time and enjoy it.")}
  <section class="panel">${richText(project.intro)}</section>
  <div class="project-steps">${steps}</div>
  ${doneButton("project", "I finished my project")}`;
}

function renderPractice() {
  const items = (course.practice || []).map((item) => {
    const seen = progress.answersSeen.includes(item.id);
    const options = item.options?.length ? list(item.options) : "";
    return `
    <article class="panel">
      ${item.intro ? `<p class="muted">${escapeHtml(item.intro)}</p>` : ""}
      <h3>${escapeHtml(item.partTitle)}</h3>
      <p>${escapeHtml(item.prompt)}</p>
      ${options}
      ${item.answer ? `<details class="answer-reveal" data-answer="${escapeHtml(item.id)}" ${seen ? "open" : ""}>
        <summary>Show the answer</summary>
        <div class="answer-body">${escapeHtml(item.answer)}</div>
      </details>` : `<p class="muted">This one is yours to set. There is no right answer.</p>`}
    </article>`;
  }).join("");
  return `
  ${pageHeader("Practice", course.unit.unitTitle, "Answer in your notebook or out loud with your AI tutor, then check yourself.")}
  ${items}
  ${doneButton("practice")}`;
}

function renderQuiz() {
  const questions = course.assessment.questions.map((question, index) => `
    <article class="panel">
      <h3>Question ${index + 1}</h3>
      <p>${escapeHtml(question.prompt)}</p>
      <label class="field"><span>Your answer</span>
        <textarea rows="3" data-quiz="${escapeHtml(question.id)}">${escapeHtml(progress.quiz[question.id] || "")}</textarea>
      </label>
      <details class="answer-reveal"><summary>Compare with a model answer</summary>
        <div class="answer-body">${escapeHtml(question.modelAnswer)}</div>
      </details>
    </article>`).join("");
  return `
  ${pageHeader("Unit Quiz", course.unit.unitTitle, "Write your answer first, then compare. Compare the idea, not the exact words.")}
  ${questions}
  ${doneButton("quiz", "I have finished the quiz")}`;
}

function renderReflect() {
  const prompts = (course.reflection || []).map((item) => `
    <article class="panel">
      <p>${escapeHtml(item.prompt)}</p>
      <label class="field"><span>Your thinking</span>
        <textarea rows="3" data-reflect="${escapeHtml(item.id)}">${escapeHtml(progress.reflection[item.id] || "")}</textarea>
      </label>
      ${item.modelAnswer ? `<details class="answer-reveal"><summary>One way to answer</summary><div class="answer-body">${escapeHtml(item.modelAnswer)}</div></details>` : ""}
    </article>`).join("");
  const self = (course.selfAssessment || []).map((item) => [item.statement, "", ""]);
  return `
  ${pageHeader("Reflection", "Thinking about how I learn", "Reflection is one of the six skills, and it grows every time you use it.")}
  ${prompts}
  ${self.length ? `<section class="panel"><h2>How am I doing?</h2>${table({ headers: ["I can…", "Not yet", "Yes"], rows: self })}</section>` : ""}
  ${doneButton("reflect")}`;
}

function renderTeacher() {
  const sessions = course.teacherSessions || [];
  const speaking = course.speakingPrompts || [];
  return `
  ${pageHeader("Teacher Session", "Bring this to your live session", "You meet your teacher about twice a week. Here is what to bring.")}
  ${sessions.length ? `<section class="panel">${sessions.map((item) => box(item, "teacher")).join("")}</section>` : ""}
  ${speaking.length ? `<section class="panel"><h2>Say it out loud</h2>${speaking.map((item) => box(item, "speak")).join("")}</section>` : ""}
  ${doneButton("teacher")}`;
}

// The Cambridge objectives table lives here, not on the learner's overview.
// At Stages 1-3 those objectives have no learner paraphrase, so the overview
// was showing curriculum prose written for adults — "Begin to participate in
// simple investigations" — to a five-year-old. The grown-up is the reader who
// can actually use it, and this is their section.
function renderGrownUp() {
  const guide = course.grownUpGuide;
  const objectives = course.cambridge?.objectives || [];
  const parts = guide.sections.map((part) => `
    <article class="panel">
      <h2>${escapeHtml(part.title)}</h2>
      ${richText(part.body)}
      ${list(part.items)}
      ${(part.tables || []).map(table).join("")}
    </article>`).join("");
  return `
  ${pageHeader("For the Grown-Up", course.unit.unitTitle, "This part is written for you, the parent or teacher.")}
  <section class="panel grownup-guide">
    <span class="grownup-flag">${icon("users")} ${escapeHtml(guide.label)}</span>
    <p style="margin-top:12px">${escapeHtml(guide.intro)}</p>
    ${guide.notes?.length ? list(guide.notes) : ""}
  </section>
  ${objectives.length ? `<section class="panel">
    <h2>Cambridge objectives</h2>
    <p>What this unit covers in ${escapeHtml(course.cambridge.level)} at Stage ${course.cambridge.stage}.
    These are Cambridge's own words, for you rather than for the learner — the unit teaches them
    through the activities and the mini-project, not by naming them.</p>
    ${table({
      headers: ["Code", "Sub-strand", "Cambridge's wording"],
      rows: objectives.map((o) => [o.code, o.subStrand, o.text]),
    })}
    <p class="muted">${escapeHtml(course.unit.reviewStatus)}</p>
  </section>` : ""}
  ${parts}`;
}

function renderProgressPage() {
  const all = availableSections().filter(([id]) => id !== "progress");
  const rows = all.map(([id, , label]) => [label, progress.completed.includes(id) ? "Done" : "Not yet"]);
  const done = rows.filter((row) => row[1] === "Done").length;
  return `
  ${pageHeader("My Progress", course.unit.unitTitle, `You have finished ${done} of ${all.length} sections in this unit.`)}
  <section class="panel">${table({ headers: ["Section", "Status"], rows })}</section>`;
}

// ===================== shell adapters =====================
// Two contracts differ between this course and the shell, and both are bridged
// here rather than by editing the 15 renderers.
//
// 1. RETURN vs WRITE. The shell clears #app and calls the renderer, expecting it
//    to write its own output (that is what science, mathematics and computing
//    do). Every renderer here RETURNS an HTML string instead, because the old
//    renderRoute did `app.innerHTML = RENDERERS[route]()`. Wrapping is what
//    keeps them byte-for-byte identical to the originals.
//
// 2. AVAILABILITY. renderRoute used to send an unavailable route back to the
//    overview. The nav only ever offers available sections, so this matters
//    only for a hand-typed #hash — but a Stage 6 unit has no "grownup" section
//    and must not render an empty one.
// The tutor section is the one page that is not a pure string renderer: the
// unit's conversation starters stay as boxes, and Wehel (the live AI subject
// expert) mounts beneath them once the HTML is in place.
// Every option the Wehel panel needs, shared by the nav section and the
// shell's floating dock so both mount the same tutor over the same store.
function wehelOptions() {
  return {
    meta: {
      subject: "global-perspectives", subjectLabel: "Global Perspectives", grade: stageNumber,
      cambridgeCode: `${course.cambridge?.level || "Cambridge Global Perspectives"} ${course.cambridge?.code || ""}`.trim(),
      unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle,
      courseOutline: outlineFromManifest(manifest), unit: course,
      // What the Focus control offers: this unit's content pages, from the same
      // availability filter the nav uses, so a stage whose pack has no toolkit
      // or grown-up guide never offers one. A prerequisite unit is the
      // placement exam, which has no modules to focus.
      modules: modulesFromSections(isPrereqUnit ? [] : availableSections()),
    },
    store: progress,
    ui: { escapeHtml, toast, voiceButton, bindVoiceControls },
    tutorLabel: "Wehel Tutor",
    greeting: `Hi! I am Wehel Tutor, your Global Perspectives partner. This unit is all about the skill of ${course.unit.skill || course.unit.unitTitle}. Try one of the conversation starters above, or just tell me what you think!`,
    placeholder: `Talk with Wehel Tutor about ${course.unit.skill || course.unit.unitTitle}…`,
    quickPrompts: [
      { label: "Explain this skill", message: "Can you explain this unit's skill in a simple way, with an example from daily life?" },
      { label: "Debate with me", message: "Let's have a friendly debate. Pick a fun topic from this unit and take the other side." },
      { label: "Quiz me", message: "Ask me questions about this unit, one at a time, and push my thinking." },
      { label: "Help with my project", message: "Can you help me plan my mini-project for this unit?" },
    ],
    fallbackReply: () => `I cannot connect right now. While you wait, try one of the conversation starters above out loud — or re-read the Big Ideas for Unit ${course.unit.unitNo} and tell me later what you found.`,
    onExchange: (count) => { if (count >= 2 && !progress.completed.includes("tutor")) complete("tutor", "Tutor conversation counted toward this unit."); },
    fetchUnit: unitFetcher(manifest, dataRootUrl),
    onSaved: saveProgress,
  };
}

function renderTutor() {
  paint("tutor", () => `
    ${pageHeader("Your AI subject expert", "Wehel Tutor — Global Perspectives", "Wehel Tutor is your discussion partner. Say your ideas out loud, debate both sides, and let it push your thinking further.")}
    ${(course.tutorPrompts || []).length ? `<section class="panel">${course.tutorPrompts.map((item) => box(item, "tutor")).join("")}</section>` : ""}
    <section class="panel" id="wehel-chat" style="margin-top:18px"></section>
    ${doneButton("tutor")}`)();
  const mountEl = $("#wehel-chat");
  if (!mountEl) return;
  mountWehelChat({ container: $("#wehel-chat"), ...wehelOptions() });
}

const paint = (id, fn) => () => {
  const app = $("#app");
  const available = availableSections().some(([sectionId]) => sectionId === id);
  app.innerHTML = available ? fn() : renderOverview();
  app.scrollTop = 0;
};

// A deck writes to #app itself rather than returning a string, so it cannot go
// through paint(). The availability guard is the same one — a hand-typed #hash
// for a section this pack does not carry falls back to the overview — and the
// stage gate is checked here rather than in the renderers map, which is built
// at module load, before bind() knows what stage this is.
const routeTo = (id, deckRenderer, pageRenderer, slidesIntro) => () => {
  if (!isDeckStage()) return paint(id, pageRenderer)();
  if (!availableSections().some(([sectionId]) => sectionId === id)) return paint("overview", renderOverview)();
  // Stages 1-4 all get the original section AND the deck. BOTH_MAX_STAGE and
  // DECK_MAX_STAGE are both 4, so the deck-alone return below is unreachable —
  // it is kept because Stage 5+ still resolves through this helper.
  if (isBothStage()) return renderBothDesigns(pageRenderer, deckRenderer, slidesIntro);
  return deckRenderer();
};

// Delegated events the shell does not provide: the other subjects bind their
// controls inline inside each renderer, but these renderers return strings and
// never touch the DOM, so the handlers live at document level exactly as they
// did before. They read shell-bound values (`complete`, `progress`,
// `saveProgress`) which are undefined at module load and populated by bind()
// long before any of these can fire.
document.addEventListener("click", (event) => {
  const doneTarget = event.target.closest("[data-done]");
  if (!doneTarget) return;
  // Settles the deck's finish button below as well as this one — on a
  // both-designs page the section can be completed from either half.
  markSectionDone(doneTarget.dataset.done, "Nice work — that section is marked done.");
});

// Capture phase: `toggle` does not bubble.
document.addEventListener("toggle", (event) => {
  const details = event.target.closest("[data-answer]");
  if (details?.open) {
    const id = details.dataset.answer;
    if (!progress.answersSeen.includes(id)) { progress.answersSeen.push(id); saveProgress(); }
  }
}, true);

// On a both-designs page the same question is on screen twice — once on the
// original page, once on its slide — under the same data-reflect/data-quiz id.
// Saving already worked from either, because the handler reads the element that
// changed. What did not was the OTHER copy: a learner who wrote their answer
// above and then scrolled down to the deck found the box empty, which reads as
// having lost the answer. The twin is filled in from the same value.
function mirrorAnswer(attribute, source) {
  for (const twin of $$(`[${attribute}="${CSS.escape(source.dataset[attribute === "data-reflect" ? "reflect" : "quiz"])}"]`)) {
    if (twin !== source) twin.value = source.value;
  }
}

document.addEventListener("change", (event) => {
  const reflect = event.target.closest("[data-reflect]");
  if (reflect) {
    progress.reflection[reflect.dataset.reflect] = reflect.value;
    mirrorAnswer("data-reflect", reflect);
    saveProgress();
    return;
  }
  const quiz = event.target.closest("[data-quiz]");
  if (quiz) {
    progress.quiz[quiz.dataset.quiz] = quiz.value;
    mirrorAnswer("data-quiz", quiz);
    saveProgress();
  }
});

// ===================== written work =====================
// How much the learner has actually WRITTEN, per section that asks for writing.
// It is the only thing this subject can honestly say about its assessment.
//
// All 315 questions are `responseMode: "text"` with a `modelAnswer` that ends
// "any answer with this idea is correct" — the learner writes, then marks
// themselves. Nothing scores that, so there is no percentage to emit and one
// computed from self-marking would report mastery nobody measured. That is why
// `passPercent` was removed from the builder, and this is deliberately not a
// way to put it back: no score, no pass flag, and it must never reach the
// gradebook.
//
// What it does buy is worth more than it sounds. The quiz section finishes on a
// button press — deckFinish -> finishedInDeck -> markSectionDone, none of which
// looks at `progress.quiz` — so a unit ticked with every box empty is currently
// indistinguishable from one worked through. This is what tells them apart.
//
// It measures ENGAGEMENT, not quality: a learner who types "x" counts as having
// answered. Every label built on it has to say "answered", never "correct".
//
// Practice is deliberately absent. It carries no inputs at all — it tells the
// learner to answer in a notebook or out loud with the tutor — so the only
// thing it records is which model answers were revealed, and calling that
// "answered" would claim more than the word allows.
const WRITTEN_SECTIONS = [
  ["quiz", () => course?.assessment?.questions, (p) => p.quiz],
  ["reflect", () => course?.reflection, (p) => p.reflection],
];

// Counted against the CURRENT question ids, never against the size of the
// stored map. Content is regenerated by the builder and ids can change, while
// `progress.quiz` persists in localStorage — so a question that was removed
// would otherwise keep inflating the count for ever.
//
// MUST NOT THROW. The shell calls this as the ARGUMENT to emitProgress, which
// puts it outside the try/catch that guards the emit itself, so an exception
// here would escape saveProgress() and take the lesson down with it.
function attemptedCounts(p) {
  const out = {};
  for (const [section, itemsOf, storeOf] of WRITTEN_SECTIONS) {
    const items = itemsOf() || [];
    if (!items.length) continue;
    const store = storeOf(p) || {};
    const answered = items.filter((item) => String(store[item?.id] ?? "").trim() !== "").length;
    out[section] = { answered, total: items.length };
  }
  return out;
}

// ===================== config + boot =====================
const config = {
  subjectKey: "global-perspectives",
  param: "stage",
  mediaSubject: "global-perspectives",
  // ttsPurpose is deliberately omitted. The standalone sent no `purpose` at
  // all, and quiz_tts.php selects the voice FROM that field: only
  // ehel_english / ehel_math / ehel_course_page map to XfNU2rGpBa01ckF309OY,
  // anything else (including an unrecognised value) falls through to the
  // configured quiz_tts_voice_id. Sending "ehel_global_perspectives" here would
  // look tidier and change nothing, but naming a purpose the endpoint does not
  // know is how science ended up narrating in a different voice from every
  // other course. Omitting it keeps the request byte-equivalent to today's.
  sections: SECTIONS,
  // Two pack shapes, one page: a section appears only where the unit carries
  // data for it. The Prerequisite unit shows only its own two pages.
  visibleSections: () => (withdrawal()
    ? [["overview", "alert-triangle", "Not available"]]
    : isPrereqUnit
      ? [["overview", "layout-dashboard", "Unit Overview"], ["placement", "clipboard-check", "Placement exam"], ["year-plan", "calendar-days", "Stage Study Plan"]]
      : availableSections()),
  // Everything available counts toward the bar except the progress page itself
  // — including the overview, which the other subjects exclude. In prereq mode
  // only the exam counts, so finishing it reads as a complete unit — the
  // Study Plan is a reference page, not a step, so it never counts.
  nonCountable: isPrereqUnit ? ["overview", "year-plan"] : ["progress", "unit-plan"],
  progressDefaults: { completed: [], answersSeen: [], reflection: {}, quiz: {}, aiMessages: [] },
  keys: (s, u) => ({ progress: `ehel-gp-s${s}-u${u}-progress-v1` }),
  courseKey: (s) => `ehel-gp-g${String(s).padStart(2, "0")}`,
  // "Get help with…" — the tutoring search page (shell/get-help.js). The shell
  // appends its nav entry and dispatches its route; it is never in SECTIONS,
  // so it cannot gate or count. Stage 5 contributes nothing because its
  // topic-index.json does not exist — the withdrawal needs no second gate here.
  getHelp: createGetHelp({
    deps: () => ({ $, escapeHtml, icon, pageHeader }),
    subjectKey: "global-perspectives", subjectLabel: "Global Perspectives", param: "stage", stageWord: "Stage", maxStage: 8,
    stage: () => stageNumber,
    course: () => course,
    marketplaceHref: () => (PLATFORM_ORIGIN ? `${PLATFORM_ORIGIN}/local/hubredirect/teacher_marketplace.php?q=${encodeURIComponent("Global Perspectives")}` : ""),
    sections: () => SECTIONS,
    examples: ["asking good questions", "bar charts", "checking sources"],
  }),
  // The other subjects extend the summary with `knownWords`; this one has no
  // vocabulary cards and sends written-answer counts instead. See
  // attemptedCounts above for why it is a count and not a score.
  //
  // The key is OMITTED rather than sent empty when there is nothing to report
  // (the Prerequisite unit, a withdrawn stage), so a unit that asks for no
  // writing is silent instead of claiming 0 of 0.
  //
  // `attempted` rides on progress.summary, never on checkpoint.result. That is
  // structural, not stylistic: checkpoint.result carries score/passed, the
  // family portal renders it as a coloured percentage pill, and
  // push_gradebook() writes any score it sees to a grade item. A count sent
  // down that path would become the fabricated mastery this subject is
  // specifically meant not to report.
  //
  // Nothing reads it yet — apply_event() in externallib_progress.php ignores
  // unknown keys on a summary — so this is inert until the server tier lands.
  // That is the intended rollout order, not an oversight.
  extendSummary: (p, base) => {
    const attempted = attemptedCounts(p);
    return Object.keys(attempted).length ? { ...base, attempted } : base;
  },
  renderers: whenWithdrawn({
    overview: () => (isPrereqUnit ? placement.renderOverview() : paint("overview", renderOverview)()),
    placement: () => (isPrereqUnit ? placement.renderExam() : paint("overview", renderOverview)()),
    "year-plan": () => (isPrereqUnit ? renderStudyPlan({
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, navigate }),
      stageLabel: `Stage ${prereqStage}`,
      subjectLabel: "Global Perspectives",
      planName: "Stage Study Plan",
      units: () => manifest.units,
      unitDetailHeader: "Skill",
      unitDetail: (unit) => unit.skill || null,
      examLabel: () => "Placement exam",
      firstUnitNumber: 1,
      firstUnitHref: (route = "overview") => `?stage=${prereqStage}&unit=1#${route}`,
      rhythm: [
        ["Day 1", "Lesson", "Read the lesson and the big ideas."],
        ["Day 2", "Toolkit", "Work through the skills toolkit and the unit's words."],
        ["Day 3", "Activities", "Do the activities and the discussion challenge."],
        ["Day 4", "Practice", "Answer the practice questions and work on the project."],
        ["Day 5", "Reflect", "Reflect on the unit, check your answers and ask the tutor."],
      ],
    }) : navigate("overview")),
    "unit-plan": () => (isPrereqUnit ? navigate("overview") : renderUnitStudyPlan({
      deps: () => ({ $, $$, escapeHtml, icon, pageHeader, navigate }),
      stageLabel: `Stage ${stageNumber}`,
      unitNumber: course.unit.unitNo,
      unitTitle: course.unit.unitTitle,
      units: () => manifest.units,
      // Only what this unit actually offers (the predicates decide), minus the
      // entries that are not steps of its walk: the overview, this plan, the
      // teacher session, the grown-up guide and the progress report.
      planSections: () => availableSections().filter(([id]) => !["overview", "unit-plan", "teacher", "grownup", "progress"].includes(id)),
    })),
    // Every teaching section takes the slide deck at DECK_MAX_STAGE and below.
    // Four stay as pages on purpose: the overview and My Progress are summaries
    // rather than a sequence to walk through, My Learning Goals is a
    // three-column chart that a one-item-per-slide deck would take apart, the
    // tutor is a live conversation, and For the Grown-Up is the one section
    // written for an adult reading it on their own.
    lesson: routeTo("lesson", renderLessonDeck, renderLesson, "The same lesson, one part at a time."),
    bigideas: routeTo("bigideas",
      () => renderBoxDeck({ section: "bigideas", label: "Big idea", heading: "Ideas to hold on to", finishLabel: "I will remember these", items: course.bigIdeas.map((item) => ({ item, role: "bigIdea" })) }),
      () => renderBoxes("bigideas", "bigIdea", course.bigIdeas, "Big Ideas", "Ideas to hold on to", "The few things worth remembering from this unit."),
      "The same ideas, one at a time."),
    models: routeTo("models",
      () => renderBoxDeck({ section: "models", label: "Example", heading: "See the skill in action", finishLabel: "I have seen the examples", items: course.models.map((item) => ({ item, role: "model" })) }),
      () => renderBoxes("models", "model", course.models, "Worked Examples", "See the skill in action", "Follow someone else doing it, then do the same with your own topic."),
      "The same examples, one at a time."),
    goals: paint("goals", renderGoals),
    toolkit: routeTo("toolkit", renderToolkitDeck, renderToolkit, "The same toolkit, one card at a time."),
    words: routeTo("words", renderWordsDeck, renderWords, "The same words, one at a time."),
    challenge: routeTo("challenge", renderChallengeDeck, renderChallenge, "The same challenge, one step at a time."),
    activities: routeTo("activities", renderActivitiesDeck, renderActivities, "The same activities, one at a time."),
    project: routeTo("project", renderProjectDeck, renderProject, "The same project, one step at a time."),
    tutor: renderTutor,
    practice: routeTo("practice", renderPracticeDeck, renderPractice, "The same questions, one at a time."),
    quiz: routeTo("quiz", renderQuizDeck, renderQuiz, "The same questions, one at a time."),
    reflect: routeTo("reflect", renderReflectDeck, renderReflect, "The same questions, one at a time."),
    teacher: routeTo("teacher", renderTeacherDeck, renderTeacher, "The same cards, one at a time."),
    grownup: paint("grownup", renderGrownUp),
    progress: paint("progress", renderProgressPage),
  }),
  // The deck is full-bleed via a class on <body>; leaving the section has to
  // take it off, or the next page renders inside a viewport still sized for a
  // carousel.
  // deckMount is per-render state: a both-designs page sets it around its deck
  // and clears it again, but a renderer that throws part-way would leave it set
  // and mount the NEXT section's deck into a region that no longer exists.
  onBeforeRender: () => { document.body.classList.remove("gc-full"); deckMount = null; },
  bind,
  // The dock sits on top of whatever is rendered, so making every route draw
  // the notice does not reach it: the Wehel Tutor button was still floating
  // over the notice, offering to discuss a stage nobody should be working in.
  // The shell reads this property inside mountWehelDock() and skips the dock
  // entirely when it is falsy. That read happens after bind(), so `withdrawal()`
  // knows the stage by then — which is why this can be a getter and not a
  // decision frozen at module load. The bare name below is the module-level
  // wehelOptions function; a getter introduces no binding of its own.
  get wehelOptions() { return withdrawal() ? null : wehelOptions; },
  async load(ctx) {
    // Checked before any fetch: a withdrawn stage's data is still on disk, and
    // loading it would put the course one render away from a learner. Read off
    // ctx, not the module binding — bind() has not run yet.
    const withdrawn = withdrawalFor(ctx.stageNumber);
    if (withdrawn) {
      return { manifest: { units: [] }, course: withdrawnCourseShell(withdrawn, ctx.stageNumber) };
    }
    if (isPrereqUnit) {
      const [m, p] = await Promise.all([
        fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
        fetch(new URL("placement-exam.json", ctx.dataRootUrl)),
      ]);
      if (!m.ok || !p.ok) throw new Error("The Global Perspectives placement exam could not be loaded.");
      const [prereqManifest, exam] = await Promise.all([m.json(), p.json()]);
      placementExam = exam;
      resolvedUnitNo = PREREQ_UNIT;
      return { manifest: prereqManifest, course: placementCourseShell(prereqManifest, exam) };
    }
    const manifest = await (await fetch(new URL("course-manifest.json", ctx.dataRootUrl))).json();
    const entry = manifest.units.find((unit) => unit.number === ctx.unitNumber) || manifest.units[0];
    resolvedUnitNo = entry.number;
    const course = await (await fetch(new URL(`units/unit-${entry.number}.json`, ctx.dataRootUrl))).json();
    return { manifest, course };
  },
  async onReady(ctx) {
    const course = ctx.course, manifest = ctx.manifest, esc = ctx.escapeHtml, s = ctx.stageNumber;
    if (isPrereqUnit && !["overview", "placement", "year-plan"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && ["placement", "year-plan"].includes(location.hash.slice(1))) location.hash = "overview";
    document.title = `${course.unit.unitTitle} · Ehel Academy Global Perspectives`;
    const label = ctx.$("#course-label");
    if (label) label.textContent = `${course.stage.label} · Global Perspectives`;
    const title = ctx.$("#unit-title");
    if (title) title.textContent = course.unit.unitTitle;
    for (const select of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) {
      if (!select) continue;
      // A withdrawn stage has no units to offer, and its manifest here is the
      // empty shell, so the picker would otherwise render a lone prerequisite
      // entry that leads back into the course.
      if (withdrawal()) {
        select.innerHTML = `<option selected disabled>Not available</option>`;
        select.disabled = true;
        continue;
      }
      // The Study Plan rides in the unit picker under the Prerequisite
      // entry, one press away from anywhere in the course. Its option value is
      // a route, not a unit number — the change handler routes it.
      const onYearPlan = isPrereqUnit && location.hash.slice(1) === "year-plan";
      select.innerHTML = [
        `<option value="${PREREQ_UNIT}" ${isPrereqUnit && !onYearPlan ? "selected" : ""}>Prerequisite — Placement exam</option>`,
        `<option value="year-plan" ${onYearPlan ? "selected" : ""}>Stage Study Plan</option>`,
        ...manifest.units
          .map((unit) => `<option value="${unit.number}" ${!isPrereqUnit && unit.number === resolvedUnitNo ? "selected" : ""}>Unit ${unit.number} — ${esc(unit.title)}</option>`),
      ].join("");
      select.onchange = () => {
        const url = new URL(location.href);
        url.searchParams.set("unit", select.value === "year-plan" ? PREREQ_UNIT : select.value);
        url.hash = select.value === "year-plan" ? "year-plan" : "overview";
        location.href = url.href;
      };
    }
    const stageSelect = ctx.$("#stage-select");
    if (stageSelect) {
      // A withdrawn stage is not offered, so it is not in the list. The one
      // exception is the stage being viewed: a learner who arrived on a
      // withdrawn stage would otherwise see the picker claim they are
      // somewhere else, so it is shown, selected and disabled.
      stageSelect.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8]
        .filter((stage) => !WITHDRAWN_STAGES[stage] || stage === s)
        .map((stage) => {
          const gone = Boolean(WITHDRAWN_STAGES[stage]);
          return `<option value="${stage}" ${stage === s ? "selected" : ""} ${gone ? "disabled" : ""}>Stage ${stage}${gone ? " — not available" : ""}</option>`;
        })
        .join("");
      stageSelect.onchange = () => {
        const url = new URL(location.href);
        url.searchParams.set("stage", stageSelect.value);
        url.searchParams.set("unit", "1");
        url.hash = "overview";
        location.href = url.href;
      };
    }
  },
};

createCourseApp(config);
