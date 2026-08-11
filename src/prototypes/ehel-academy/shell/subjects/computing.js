// Computing subject module for the unified course-app shell (P1.5).
// Section renderers kept BYTE-FOR-BYTE from computing/shared/course-ui.js; the
// scaffolding lives in ../course-app.js. Computing is a structural sibling of
// science and mathematics — 9 of its renderers were already byte-identical to
// science's and 13 more differed only in subject wording — plus six sections
// science has no equivalent for: Tools & Setup, Code Examples, Debug It, Stay
// Safe Online, Unit Project and Computing Words.
import { initComputingWebGL } from "../../computing/shared/computing-webgl.js";
import { unitTopic, computingDiagram } from "../../computing/shared/computing-visuals.js";
import { computingWordPicture } from "../../computing/shared/computing-word-pictures.js?v=cmp-pictures-1";
import { createCourseApp } from "../course-app.js";
import { createDeck, deckIcon } from "../deck.js?v=deck-1";
import { createPlacementUnit, placementCallout, placementCourseShell, PREREQ_UNIT } from "../placement.js?v=placement-1";
import { mountWehelChat, modulesFromSections, outlineFromManifest, unitFetcher } from "../wehel.js?v=wehel-2";

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
let bindVoiceControls, updateVoiceUI, stopVoice, renderNav, unitSectionIds, stageNumber, STAGE_STORAGE_KEY, speakText;
let course, progress, gradeProgress, manifest, gradeCapstone, dataRootUrl;
function bind(ctx) {
  ({ $, $$, escapeHtml, icon, voiceButton, pageHeader, toast, complete, completeGradeSection,
     saveProgress, saveGradeProgress, navigate, emitProgress, bindVoiceControls, updateVoiceUI,
     stopVoice, renderNav, unitSectionIds, stageNumber, STAGE_STORAGE_KEY, speakText } = ctx);
  course = ctx.course; progress = ctx.progress; gradeProgress = ctx.gradeProgress;
  manifest = ctx.manifest; gradeCapstone = ctx.gradeCapstone; dataRootUrl = ctx.dataRootUrl;
  if (isPrereqUnit) {
    placement = createPlacementUnit({
      storageKey: `ehel-comp-s${prereqStage}-placement-exam-v1`,
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

// How many stages have a content package. The picker must not offer a stage
// with nothing behind it, and the guard must not reject one that exists — so
// the two are driven from one number. Cambridge Primary Computing 0672 covers
// Stages 1-6 and Lower Secondary 0868 covers 7-9; raise this as packs land.
const STAGE_COUNT = 8;
// "Teacher Lesson" is called "The Lesson" here: these courses are self-paced
// and a learner working alone should not be told the explainer belongs to
// someone else. The computing-only sections (tools, code, debug, safety,
// project) sit where they are used, not in a block at the end.
const sections = [
  ["overview", "layout-dashboard", "Unit Overview"],
  ["tools", "wrench", "Tools & Setup"],
  ["lesson", "book-open", "The Lesson"],
  ["words", "braces", "Computing Words"],
  ["explore", "scan-search", "Explore the Concept"],
  ["visuals", "shapes", "Visual Models"],
  ["code", "code", "Code Examples"],
  ["method", "list-checks", "Learn the Method"],
  ["examples", "copy-check", "Worked Examples"],
  ["guided", "lightbulb", "Guided Practice"],
  ["reference", "book-a", "Quick Reference"],
  ["activities", "blocks", "Build It"],
  ["debug", "bug", "Debug It"],
  ["games", "gamepad-2", "Games"],
  ["fluency", "star", "Computing Fluency"],
  ["problems", "hand-heart", "Solve Real Problems"],
  ["safety", "shield-check", "Stay Safe Online"],
  ["explain", "messages-square", "Explain Your Thinking"],
  ["project", "rocket", "Unit Project"],
  ["challenge", "badge-check", "Unit Challenge"],
  ["capstone", "palette", "Stage Capstone"],
  ["capstonequiz", "circle-help", "Capstone Quiz"],
  ["live", "video", "Live Computing Class"],
  ["progress", "badge-check", "My Computing Progress"]
];

// Official Cambridge framework for Computing: Primary (0672) covers Stages
// 1-6, Lower Secondary (0868) covers Stages 7-9. The stage number carries the
// grade level; there is no separate per-grade code.
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
    ? { level: "Cambridge Primary Computing", code: "0672" }
    : { level: "Cambridge Lower Secondary Computing", code: "0868" };
}
function cambridgeLabel(stage) {
  const fw = cambridgeFramework(stage);
  return `${fw.level} ${fw.code} — Stage ${stage}`;
}

// ── The gc-* slide deck, for the youngest stages ─────────────────────────────
// How a Stage 1 learner meets a section: one item per full-screen slide, a big
// Listen button, side arrows, dots and swipe, instead of a grid of cards or a
// row of tabs above a panel. The plumbing is ../deck.js, shared with English,
// Science and Mathematics — see the note there.
//
// Only the layout changes. Every field a section showed is still on the slide,
// and every completion rule, progress key and answer check below is the grid
// renderer's own, moved rather than rewritten. The sections that already show
// one thing at a time (Fluency, the Unit Challenge, the games) keep their own
// designs — a deck would wrap a second carousel around a single question. Tools
// & Setup and Quick Reference keep theirs too: those are the two pages a learner
// consults rather than works through, and a glossary dealt out one row per slide
// is worse to use than a table.
//
// ── Both designs on one page (Stages 1-4) ────────────────────────────────────
// Stages 1-4 get the original section AND the same content as a deck under it,
// in that order — the arrangement English Grades 1-4 use. Stages 5-8 get the
// original alone.
//
// 4 is where the packs themselves divide: Stages 1-4 ship as Teacher & Parent
// Guides rewritten into learner voice, and Stage 5 up ships student lesson books
// carried across as written. A learner handed a lesson book is reading; one
// being read to is being walked through. So Stage 5 and up keep the grids alone,
// where a learner scans a page rather than swiping it — the same line English
// draws between its Grade 4 and Grade 5.
//
// Nothing below is per-stage. Stages 2-4 carry the same sections at the same
// sizes as Stage 1 (five concepts, six discoveries, five models and methods,
// eight activities), so extending the design was this number and nothing else.
// The two fields that are not universal — a concept's `checkYourself` and a
// word's `example`, both absent from parts of Stages 2-3 — were already
// conditional on the slides that show them.
//
// There is no longer a "deck instead of the original" stage: the deck-only gate
// this replaces covered exactly Stages 1-4, so every dispatcher's second branch
// became unreachable the moment this number reached 4, and it went with it.
const BOTH_DESIGNS_MAX_STAGE = 4;
const bothDesigns = () => stageNumber <= BOTH_DESIGNS_MAX_STAGE;

// Both halves draw the SAME section, so both carry the same hooks: #word-search,
// [data-check], [data-hint], [data-answer], [data-activity-done], [data-example]
// and thirty-odd writes to #app all exist twice on a both-designs page. The
// original paints first, so a document-wide lookup from either half reaches the
// other's controls — the deck would filter itself by the lab's search box, and
// the original's [data-check] binding would capture the deck's buttons too.
//
// So each design owns a region and queries inside it. Both variables are null on
// every other page, where these helpers fall back to the document and behave
// exactly as $ and $$ did — which is why Stages 2-8 are unaffected by the switch.
let classicRegion = null;
let deckRegion = null;
// The original renderers assign to their root's innerHTML. On a both-designs
// page that root is the classic region, not #app — otherwise the first redraw
// from a subtab or a Learned mark erases the deck mounted below.
const cRoot = () => classicRegion || $("#app");
const c$ = (selector) => (classicRegion || document).querySelector(selector);
const c$$ = (selector) => [...(classicRegion || document).querySelectorAll(selector)];
const d$ = (selector) => (deckRegion || document).querySelector(selector);
const d$$ = (selector) => [...(deckRegion || document).querySelectorAll(selector)];

// The page: original first, deck second, each in its own region. The deck mounts
// with fullBleed off so it sits IN the page rather than being the page — no
// body.gc-full, because the original above it still needs the normal chrome.
function bothDesignsPage(renderClassic, renderDeck) {
  $("#app").innerHTML = `<div class="both-designs">
      <div class="classic-design" id="classic-design"></div>
      <div class="deck-design" id="deck-design">
        <div class="deck-design-head"><span class="eyebrow">The same section, one card at a time</span><p>Swipe or use the arrows. Everything above is here too.</p></div>
        <div id="deck-host"></div>
      </div>
    </div>`;
  classicRegion = $("#classic-design");
  deckRegion = null;
  renderClassic();
  // Only now: the deck's own mount must not resolve through the classic region,
  // and its controls must not be found by the original's still-live listeners.
  deckRegion = $("#deck-design");
  renderDeck();
}

// Every deck renderer mounts through this, so where a deck goes is decided once.
// On a both-designs page it mounts into the host below the original, with
// full-bleed off — body.gc-full would strip the padding and hide the page header
// belonging to the original still sitting above it. Everywhere else this is
// mountDeck's own default and nothing changes.
const mountSectionDeck = (options) => (bothDesigns()
  ? mountDeck({ ...options, mount: d$("#deck-host"), fullBleed: false })
  : mountDeck(options));

// Computing never loads the lucide runtime (it is one of the four shell-voice
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
  afterPaint: (scope) => { bindVoiceControls(); updateVoiceUI(); initComputingWebGL(scope); },
});

// The debugging rule and the online-safety help are the UI's own words, not any
// unit's — identical on every unit of every stage. Hoisted here so the grid and
// the deck read one definition instead of each holding its own copy of the
// paragraph, and mirrored in tools/lib/ehel-computing-narration.js so the clips
// are generated at all. Those two copies are the only narration in this subject
// not derived from the unit JSON, which makes them the only ones that can drift
// silently — so check-computing-audio-coverage.mjs compares them character for
// character rather than trusting this comment.
const DEBUG_RULE = [
  "Read the error or watch exactly what the program does.",
  "Say what you expected it to do instead.",
  "Find the first line where those two part company.",
  "Change one thing. Only one.",
  "Run it again and see whether that one change helped.",
];
const SAFETY_HELP = "If anything online upsets you, frightens you, or asks you for personal information, you have not done anything wrong. Stop, close the page, and tell an adult you trust straight away. Telling someone is always the right move.";
// Each opens with its own heading, the way an e-safety card's clip opens with
// its title: a learner who presses Listen is told what they are hearing.
const DEBUG_RULE_NARRATION = `The rule that always works. ${DEBUG_RULE.join(" ")}`;
const SAFETY_HELP_NARRATION = `If something goes wrong. ${SAFETY_HELP}`;

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
//
// Four of these buttons narrate text the grid never spoke — an activity's steps,
// a code listing, the debugging rule and the online-safety help. They are the
// slides a learner who cannot yet read most needs read to them, and each is now
// a category in tools/lib/ehel-computing-narration.js, so the clips are
// generated, uploaded and kept rather than falling to the paid runtime voice on
// every press. Adding a Listen button to this file alone would have been the
// expensive kind of improvement.
function deckVoice(text, label = "Listen") {
  return `<button class="gc-btn play" type="button" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(label)}">${deckIcon("volume-2")} ${escapeHtml(label)}</button>`;
}
function deckVoiceSmall(text, label = "Listen") {
  return `<button class="gc-btn ghost small" type="button" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(label)}">${deckIcon("volume-2")} ${escapeHtml(label)}</button>`;
}

// A slide's diagram, drawn flat. The deck now always sits directly below the
// original, which draws the same model interactively — so building a second live
// WebGL context for it puts the identical spinning model on the page twice and
// doubles the cost of it. Build It at Stage 4 has eight of them: sixteen live
// contexts on one page, and browsers cap out around sixteen, so the models were
// one device-limit away from dropping to their static fallback. The learner
// loses nothing — the model they can drag is a few centimetres up the page.
const deckDiagram = (topic, index) => computingDiagram(topic, index, { interactive: false });

// Answer checking is the grids' rule, unchanged and in one place: a response
// counts when it matches the reviewed answer, or either contains the other.
function answerMatches(response, expected) {
  const given = String(response || "").trim().toLowerCase().replace(/\s+/g, " ");
  const answer = String(expected || "").toLowerCase();
  return Boolean(given) && (given === answer || answer.includes(given) || given.includes(answer));
}

// Feedback and reveals are written into the slide's own box rather than by
// repainting the slide: a repaint would throw away the answer the learner just
// typed, and on a slide carrying a WebGL model it would also swap the canvas out
// from under a running animation loop.
const setSlideBox = (key, html) => { const box = $(`[data-feedback="${CSS.escape(key)}"]`); if (box) box.innerHTML = html; };
const slideValue = (key) => ($(`[data-response="${CSS.escape(key)}"]`)?.value || "").trim();
// A reveal — a worked solution, a bug's cause, a model explanation — swaps its
// own button out for the answer, so a slide never shows both.
const revealSlideBox = (key, button) => {
  const panel = $(`[data-reveal="${CSS.escape(key)}"]`);
  if (panel) panel.hidden = false;
  button.hidden = true;
};

let assessmentIndex = 0;
let assessmentScore = 0;
let assessmentLocked = false;
let activeGameId = null;
let gameRoundIndex = 0;
let gameScore = 0;
let gameLocked = false;
let gameSelection = [];
let capstoneQuizIndex = 0;
let capstoneQuizScore = 0;
let capstoneQuizLocked = false;
// The badge on every page states the content's real review state, which is
// what the manifest records. Hard-coding "Approved content" would tell a
// learner and a teacher that a curriculum reviewer has signed this off when
// nobody has.
function reviewBadge() {
  const status = manifest?.packageReviewStatus || course?.unit?.reviewStatus || "";
  return /approved/i.test(status) ? "Approved content" : "Curriculum review pending";
}

function renderOverview() {
  $("#app").innerHTML = `${pageHeader(`${(course.stage || course.grade).label} · ${course.term.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, course.unit.unitOverview)}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner math-banner"><div class="banner-copy"><span>Your computing journey</span><h2>Explore ${escapeHtml(course.unit.unitTitle)}</h2><p>Set up your free tools, read every idea in full, study the code, build it, debug it, and finish with a project you can show.</p><button class="button gold" data-go="tools" type="button">▶ Set up and start</button></div></section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome, index) => `<div class="outcome"><span>${index + 1}</span><p>${escapeHtml(outcome)}</p></div>`).join("")}</div></section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">${escapeHtml(cambridgeFramework(stageNumber).level)} ${cambridgeFramework(stageNumber).code}</span><h3>Aligned to ${escapeHtml(cambridgeLabel(stageNumber))}</h3><p>Unit ${course.unit.unitNo} is structured from the ${escapeHtml(cambridgeLabel(stageNumber))} content package. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.concepts.length}</strong><small>concepts</small></div><div class="stat"><strong>${course.practice.length}</strong><small>practice items</small></div><div class="stat"><strong>${course.activities.length}</strong><small>activities</small></div><div class="stat"><strong>${(course.codeExamples || []).length}</strong><small>code examples</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list"><li><span>1</span><span>Discover and model the concept.</span></li><li><span>2</span><span>Learn the method and study examples.</span></li><li><span>3</span><span>Practise with hints, games and fluency.</span></li><li><span>4</span><span>Solve real problems and explain your reasoning.</span></li><li><span>5</span><span>Complete the Unit Challenge and reflect.</span></li></ol></section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have completed ${progress.completed.length} learning steps on this device.` : "Your progress will save on this device as you learn."}</p><button class="button primary" data-go="${progress.completed.includes("lesson") ? "ai" : "lesson"}" type="button">Continue →</button></section>
        ${placementCallout({ escapeHtml, storageKey: `ehel-comp-s${stageNumber}-placement-exam-v1`, stageLabel: `Stage ${stageNumber}`, href: `?stage=${stageNumber}&unit=-1#placement`, unitNo: course.unit.unitNo })}
      </div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

// --- Computing-only sections -------------------------------------------------
// A learner working alone has to be able to get the software running before any
// of the programming units mean anything, so the toolkit is the second screen
// in the unit rather than a footnote. Every tool here is free and runs in a
// browser; none needs an account or a purchase.
function renderToolkit() {
  const toolkit = course.toolkit || [];
  const prompts = course.tutorPrompts || [];
  $("#app").innerHTML = `${pageHeader("Everything is free", "Tools & Setup", `Set up the tools for ${escapeHtml(course.unit.unitTitle)} before you start. Each one runs in a web browser, costs nothing, and needs no account.`)}
    ${toolkit.length ? `<div class="task-grid">${toolkit.map((tool, index) => `<article class="panel task-card"><span class="eyebrow">Tool ${index + 1}</span><h2>${escapeHtml(tool.name)}</h2><p class="rule-box"><span class="field-label">Where:</span> ${escapeHtml(tool.url)}</p><ol class="agenda">${tool.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>${tool.note ? `<p class="example">${escapeHtml(tool.note)}</p>` : ""}${voiceButton(`${tool.name}. ${tool.steps.join(" ")} ${tool.note || ""}`, "Listen to setup")}</article>`).join("")}</div>`
      : `<section class="panel"><h2>No software needed</h2><p>This unit is unplugged — you can complete every part of it with paper, a pencil and things you already have around you. If you do have a computer or tablet, you can still try the activities on screen.</p></section>`}
    ${prompts.length ? `<section class="panel"><h3>Stuck? Ask your AI tutor</h3><p>You can ask your tutor anything, at any time. These are good questions to start with for this unit:</p><ul class="agenda">${prompts.slice(0, 5).map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ul><button class="button secondary" data-go="ai" type="button">Open the AI tutor →</button></section>` : ""}
    <p><button class="button primary" id="tools-done" type="button">My tools are ready ✓</button></p>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  $("#tools-done").addEventListener("click", () => { complete("tools", "Tools set up."); navigate("lesson"); });
}

// Code listings are carried through with their line breaks intact: the
// indentation and block order are part of what the learner has to copy, and
// flattening them into a paragraph would destroy the thing being taught.
function renderCodeExamples() {
  const examples = course.codeExamples || [];
  if (!examples.length) {
    cRoot().innerHTML = `${pageHeader("Read it, then type it", "Code Examples", "This unit teaches without written code — work through the concepts, activities and project instead.")}
      <section class="panel"><h2>Nothing to type in this unit</h2><p>The ideas here are taught with words, pictures and things you do by hand. Head to <strong>Build It</strong> to put them into practice.</p><button class="button primary" data-go="activities" type="button">Go to Build It →</button></section>`;
    c$$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
    return;
  }
  if (bothDesigns()) return bothDesignsPage(() => renderCodeExamplesClassic(examples), () => renderCodeExamplesDeck(examples));
  return renderCodeExamplesClassic(examples);
}

function renderCodeExamplesClassic(examples) {
  const copied = new Set(progress.codeCopied || []);
  const draw = () => {
    cRoot().innerHTML = `${pageHeader("Read it, then type it", "Code Examples", `Study each listing one line at a time. Say out loud what a line does before you type it — that is how you learn to read code, not just copy it.`)}
      <div class="task-grid">${examples.map((example, index) => `<article class="panel task-card"><span class="eyebrow">Listing ${index + 1} · ${escapeHtml(example.language)}</span><h2>${escapeHtml(example.title)}</h2>${example.intro ? `<p>${escapeHtml(example.intro)}</p>` : ""}<pre class="code-block" aria-label="${escapeHtml(example.language)} listing"><code>${example.lines.map((line) => escapeHtml(line)).join("\n")}</code></pre><p class="example">${escapeHtml(example.explanation)}</p><div class="question-actions"><button class="button secondary" data-copy-code="${index}" type="button">Copy the code</button><button class="button primary ${copied.has(example.id) ? "" : ""}" data-code-done="${example.id}" type="button">${copied.has(example.id) ? "✓ Typed it in" : "I typed this in ✓"}</button></div></article>`).join("")}</div>`;
    c$$('[data-copy-code]').forEach((button) => button.addEventListener("click", async () => {
      const example = examples[Number(button.dataset.copyCode)];
      try {
        await navigator.clipboard.writeText(example.lines.join("\n"));
        toast("Code copied — now paste it into your editor.");
      } catch {
        // Clipboard access is blocked in some embedded contexts; the listing is
        // on screen either way, so say so rather than failing silently.
        toast("Copying is blocked here — type the lines in from the screen.");
      }
    }));
    c$$('[data-code-done]').forEach((button) => button.addEventListener("click", () => {
      copied.add(button.dataset.codeDone);
      progress.codeCopied = [...copied];
      saveProgress();
      if (copied.size === examples.length) complete("code", "All code examples worked through.");
      draw();
    }));
  };
  draw();
}

// Code Examples as a deck: one listing per slide, big enough to read a line at a
// time. The listing keeps its own line breaks and its own scroll — indentation
// and block order are part of what is being taught, so the code is the one thing
// on a slide that is never reflowed to fit.
function renderCodeExamplesDeck(examples) {
  const esc = escapeHtml;
  const copied = new Set(progress.codeCopied || []);
  const slides = examples.map((example, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Listing ${index + 1} of ${examples.length} · ${esc(example.language)}</span>
      <h3 class="gc-title">${esc(example.title)}</h3>
      ${example.intro ? `<p class="gc-lead">${esc(example.intro)}</p>` : ""}
      <pre class="code-block" aria-label="${esc(example.language)} listing"><code>${example.lines.map((line) => esc(line)).join("\n")}</code></pre>
      <p class="gc-note">${esc(example.explanation)}</p>
      <div class="gc-actions">
        ${deckVoice(`${example.title}. ${example.intro || ""} ${example.explanation}`, "Listen to listing")}
        <button class="gc-btn ghost small" type="button" data-copy-code="${index}">${deckIcon("pencil")} Copy the code</button>
      </div>
      <button class="gc-btn ${copied.has(example.id) ? "done" : "ghost"}" type="button" data-code-done="${esc(example.id)}">${deckIcon("check")} ${copied.has(example.id) ? "Typed it in" : "I typed this in"}</button>
      ${index === examples.length - 1 ? deckFinish("code", "I worked through the code") : ""}
    </div></section>`);

  mountSectionDeck({
    heading: "Read it, then type it",
    label: "Listing",
    slides,
    onClick: async (event) => {
      const target = event.target.closest("[data-copy-code], [data-code-done], [data-deck-finish]");
      if (!target) return;
      if (target.dataset.deckFinish) { complete("code", "All code examples worked through."); return; }
      if (target.dataset.copyCode) {
        const example = examples[Number(target.dataset.copyCode)];
        try {
          await navigator.clipboard.writeText(example.lines.join("\n"));
          toast("Code copied — now paste it into your editor.");
        } catch {
          // Clipboard access is blocked in some embedded contexts; the listing is
          // on screen either way, so say so rather than failing silently.
          toast("Copying is blocked here — type the lines in from the screen.");
        }
        return;
      }
      copied.add(target.dataset.codeDone);
      progress.codeCopied = [...copied];
      saveProgress();
      target.classList.remove("ghost");
      target.classList.add("done");
      target.innerHTML = `${deckIcon("check")} Typed it in`;
      if (copied.size === examples.length) complete("code", "All code examples worked through.");
    },
  });
}

// Debugging is a taught skill in this subject, not an error state. The card
// shows the symptom first — that is what a learner actually has in front of
// them — and keeps the cause and the fix behind a reveal so they get a chance
// to diagnose it themselves.
// Debug It as a deck: one bug per slide. The symptom is what a learner actually
// has in front of them, so it is the whole slide until they ask for the cause —
// the reveal is the point of the section, and a grid puts five of them on one
// page where the next card's answer is already in view.
//
// "The rule that always works" is the last slide rather than a panel below the
// grid: it is what a learner should leave the section holding, and on a deck the
// last slide is the one they arrive at.
function renderDebuggingDeck(bugs) {
  const esc = escapeHtml;
  const solved = new Set(progress.bugsSolved || []);
  const slides = bugs.map((bug, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Bug ${index + 1} of ${bugs.length}</span>
      <h3 class="gc-title">${esc(bug.symptom)}</h3>
      <p class="gc-lead">What do you think is causing this? Say your answer out loud before you look.</p>
      <div class="gc-actions">
        ${deckVoice(`${bug.symptom}. Cause: ${bug.cause}. Fix: ${bug.fix}`, "Listen to bug")}
        <button class="gc-btn ghost small" type="button" data-show-bug="${index}">${deckIcon("eye")} Show the cause and the fix</button>
      </div>
      <div class="cmp-gc-prose" data-reveal="bug-${index}" hidden>
        <p class="gc-note gc-mistake"><span class="field-label">Cause:</span> ${esc(bug.cause)}</p>
        <p class="gc-note gc-try"><span class="field-label">Fix:</span> ${esc(bug.fix)}</p>
      </div>
      <button class="gc-btn ${solved.has(String(index)) ? "done" : "ghost"}" type="button" data-bug-done="${index}">${deckIcon("check")} I can fix this one</button>
    </div></section>`);
  slides.push(`<section class="gc-slide gc-v${bugs.length % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Every programmer does this</span>
      <h3 class="gc-title">The rule that always works</h3>
      <ol class="cmp-gc-list">${DEBUG_RULE.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <div class="gc-actions">${deckVoice(DEBUG_RULE_NARRATION, "Listen to the rule")}</div>
      ${deckFinish("debug", "I practised debugging")}
    </div></section>`);

  mountSectionDeck({
    heading: "Every programmer does this",
    // "Slide", not "Bug": the deck ends on the rule rather than on a bug, so a
    // counter reading "Bug 6 of 6" would contradict the eyebrow on every slide
    // above it, which counts the five bugs the unit actually has.
    label: "Slide",
    slides,
    onClick: (event) => {
      const target = event.target.closest("[data-show-bug], [data-bug-done], [data-deck-finish]");
      if (!target) return;
      if (target.dataset.deckFinish) { complete("debug", "Debugging practised."); navigate("games"); return; }
      if (target.dataset.showBug) return revealSlideBox(`bug-${target.dataset.showBug}`, target);
      solved.add(target.dataset.bugDone);
      progress.bugsSolved = [...solved];
      saveProgress();
      target.classList.remove("ghost");
      target.classList.add("done");
    },
  });
}

function renderDebugging() {
  const bugs = course.debugging || [];
  if (bothDesigns()) return bothDesignsPage(() => renderDebuggingClassic(bugs), () => renderDebuggingDeck(bugs));
  return renderDebuggingClassic(bugs);
}

function renderDebuggingClassic(bugs) {
  const solved = new Set(progress.bugsSolved || []);
  const draw = () => {
    cRoot().innerHTML = `${pageHeader("Every programmer does this", "Debug It", "A bug is not a failure — finding one is the job. Read the symptom, work out the cause yourself, then check.")}
      <section class="panel support-strip"><span>Read the symptom</span><span>Predict the cause</span><span>Check yourself</span><span>Apply the fix</span><span>Test again</span></section>
      <div class="task-grid">${bugs.map((bug, index) => `<article class="panel question-card"><span class="eyebrow">Bug ${index + 1}</span><h3>${escapeHtml(bug.symptom)}</h3><p>What do you think is causing this? Say your answer out loud before you open the reveal.</p><details data-bug="${index}"><summary>Show the cause and the fix</summary><p class="rule-box"><span class="field-label">Cause:</span> ${escapeHtml(bug.cause)}</p><p class="example"><span class="field-label">Fix:</span> ${escapeHtml(bug.fix)}</p></details>${voiceButton(`${bug.symptom}. Cause: ${bug.cause}. Fix: ${bug.fix}`, "Listen to this bug")}<button class="button secondary" data-bug-done="${index}" type="button">${solved.has(String(index)) ? "✓ I can fix this one" : "I can fix this one"}</button></article>`).join("")}</div>
      <section class="panel"><h3>The rule that always works</h3><ol class="path-list">${DEBUG_RULE.map((step, index) => `<li><span>${index + 1}</span><span>${escapeHtml(step)}</span></li>`).join("")}</ol></section>
      <p><button class="button primary" id="debug-done" type="button">I practised debugging ✓</button></p>`;
    c$$('[data-bug-done]').forEach((button) => button.addEventListener("click", () => {
      solved.add(button.dataset.bugDone);
      progress.bugsSolved = [...solved];
      saveProgress();
      draw();
    }));
    c$("#debug-done").addEventListener("click", () => { complete("debug", "Debugging practised."); navigate("games"); });
  };
  draw();
}

// Stay Safe Online as a deck: one rule per slide, so each is read on its own
// rather than skimmed as a row of three cards. "If something goes wrong" is the
// last slide — it is the one a frightened child has to be able to find, and on a
// deck the last slide is where the section ends.
function renderSafetyDeck(items) {
  const esc = escapeHtml;
  const slides = items.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Rule ${index + 1} of ${items.length}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      <p class="gc-lead">${esc(item.text)}</p>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.text}`, "Listen to this rule")}</div>
    </div></section>`);
  slides.push(`<section class="gc-slide gc-v${items.length % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Being safe and kind online</span>
      <h3 class="gc-title">If something goes wrong</h3>
      <p class="gc-lead">${esc(SAFETY_HELP)}</p>
      <div class="gc-actions">${deckVoice(SAFETY_HELP_NARRATION, "Listen to this")}</div>
      ${deckFinish("safety", "I know these rules")}
    </div></section>`);
  mountSectionDeck({
    heading: "Being safe and kind online",
    // "Slide" for the same reason as Debug It: the deck ends on what to do when
    // something goes wrong, which is not one of the unit's numbered rules.
    label: "Slide",
    slides,
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return;
      complete("safety", "Online safety rules reviewed.");
      navigate("explain");
    },
  });
}

function renderSafety() {
  const items = course.esafety || [];
  if (bothDesigns()) return bothDesignsPage(() => renderSafetyClassic(items), () => renderSafetyDeck(items));
  return renderSafetyClassic(items);
}

function renderSafetyClassic(items) {
  cRoot().innerHTML = `${pageHeader("Being safe and kind online", "Stay Safe Online", "These rules matter in every unit, not just this one. Read them, then say each one back in your own words.")}
    <div class="task-grid">${items.map((item, index) => `<article class="panel task-card"><span class="eyebrow">Rule ${index + 1}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.text)}</p>${voiceButton(`${item.title}. ${item.text}`, "Listen to this rule")}</article>`).join("")}</div>
    <section class="panel"><h3>If something goes wrong</h3><p>${escapeHtml(SAFETY_HELP)}</p></section>
    <p><button class="button primary" id="safety-done" type="button">I know these rules ✓</button></p>`;
  c$("#safety-done").addEventListener("click", () => { complete("safety", "Online safety rules reviewed."); navigate("explain"); });
}

function renderProject() {
  const project = course.project || { title: `Unit ${course.unit.unitNo} Project`, brief: "", steps: [], successCriteria: [] };
  const ticked = new Set(progress.projectCriteria || []);
  const draw = () => {
    $("#app").innerHTML = `${pageHeader("Make something real", "Unit Project", `Bring everything from ${escapeHtml(course.unit.unitTitle)} together into one finished piece of work.`)}
      <section class="panel unit-banner math-banner"><div class="banner-copy"><span>Your project</span><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.brief)}</p></div></section>
      <div class="overview-grid">
        <section class="panel"><h3>How to build it</h3><ol class="agenda">${project.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>${voiceButton(`${project.title}. ${project.brief} ${project.steps.join(" ")}`, "Listen to the project brief")}</section>
        <section class="panel"><h3>Success criteria</h3><p>Tick each one off only when your project really does it. This is how professional developers check their own work.</p><div class="outcome-list">${project.successCriteria.map((criterion, index) => `<label class="outcome" style="cursor:pointer"><input type="checkbox" data-criterion="${index}" ${ticked.has(String(index)) ? "checked" : ""} aria-label="${escapeHtml(criterion)}"><p>${escapeHtml(criterion)}</p></label>`).join("")}</div><p><strong>${ticked.size} of ${project.successCriteria.length}</strong> criteria met.</p><div class="progress-track"><span style="width:${project.successCriteria.length ? ticked.size / project.successCriteria.length * 100 : 0}%"></span></div></section>
      </div>
      <section class="panel"><h3>Explain your choices</h3><p>Write, or say out loud, three decisions you made while building this and why you made them. Explaining your reasoning is worth as much as the working code.</p><textarea class="activity-response" rows="5" id="project-notes" placeholder="I chose to… because…" aria-label="Project reflection">${escapeHtml(progress.projectNotes || "")}</textarea></section>
      <p><button class="button primary" id="project-done" type="button">My project is finished ✓</button></p>`;
    $$('[data-criterion]').forEach((box) => box.addEventListener("change", () => {
      const key = box.dataset.criterion;
      if (box.checked) ticked.add(key); else ticked.delete(key);
      progress.projectCriteria = [...ticked];
      saveProgress();
      draw();
    }));
    $("#project-notes").addEventListener("input", (event) => { progress.projectNotes = event.target.value; saveProgress(); });
    $("#project-done").addEventListener("click", () => {
      if (project.successCriteria.length && ticked.size < project.successCriteria.length) {
        return toast("Check every success criterion first — or go back and make the project meet it.");
      }
      complete("project", "Unit project complete.");
      navigate("challenge");
    });
  };
  draw();
}

// Computing Words as a deck, on the design English vocabulary already uses: one
// word per vivid slide, a big Listen button, side arrows, dots, swipe.
//
// Everything the two-column lab showed is preserved — the word, its meaning, the
// example from the lesson, the write-your-own-sentence check and the learned
// toggle. The search comes with it and narrows the deck itself, sitting under
// the dots rather than in .gc-top, which the full-bleed CSS hides.
//
// A word's identity is its position in the unit's list (`w3`), which is the id
// the lab wrote into progress.knownWords — so a learner who marked words on the
// grid finds them still marked here. That means the deck has to carry the
// ORIGINAL index on every slide: filtering moves a word's position under it.
function renderComputingWordsDeck(vocab) {
  const esc = escapeHtml;
  const known = new Set(progress.knownWords || []);
  const idFor = (index) => `w${index}`;
  let shown = vocab.map((entry, index) => ({ entry, index }));

  const wordSlide = ({ entry, index }, position) => `<section class="gc-slide gc-v${position % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Word ${position + 1} of ${shown.length} · Computing word</span>
      ${computingWordPicture(entry.term) ? `<div class="wc-picture" aria-hidden="true">${computingWordPicture(entry.term)}</div>` : ""}
      <div class="gc-pattern" lang="en">${esc(entry.term)}</div>
      <p class="gc-lead">${esc(entry.meaning)}</p>
      <div class="gc-actions">${deckVoice(`${entry.term}. ${entry.meaning}`, `Listen to ${entry.term}`)}</div>
      ${entry.example ? `<div class="wc-sentence">
        <small>Used in the lesson</small>
        <p>“${esc(entry.example)}”</p>
        <div class="wc-sentence-controls">${deckVoiceSmall(entry.example, "Hear the example")}</div>
      </div>` : ""}
      <details class="gc-practice"><summary>Write your own sentence</summary>
        <div class="practice-box"><input data-response="word-${index}" maxlength="180" placeholder="Write your own sentence using ${esc(entry.term.toLowerCase())}…" aria-label="Write your own sentence using ${esc(entry.term)}"><button class="button primary" type="button" data-check-word="${index}">Check sentence</button></div>
        <div data-feedback="word-${index}" role="status" aria-live="polite" aria-atomic="true"></div>
      </details>
      <button class="gc-btn ${known.has(idFor(index)) ? "done" : "ghost"}" type="button" data-know="${index}">${known.has(idFor(index)) ? `${deckIcon("check-circle")} Learned` : `${deckIcon("check")} I know this word`}</button>
      ${position === shown.length - 1 ? deckFinish("words", "I explored the computing words") : ""}
    </div></section>`;

  const deck = mountSectionDeck({
    heading: "Language for computing",
    label: "Word",
    emptyMessage: "No matching words. Clear the search to see them all.",
    tools: `<div class="wc-tools">
        <label class="search-box"><input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search computing words"></label>
        <span class="status-chip" id="wc-known">${known.size} of ${vocab.length} learned</span>
      </div>`,
    onClick: (event) => {
      const target = event.target.closest("[data-check-word], [data-know], [data-deck-finish]");
      if (!target) return;
      if (target.dataset.deckFinish) { complete("words", "Computing words explored."); navigate("explore"); return; }
      const index = Number(target.dataset.checkWord ?? target.dataset.know);
      const entry = vocab[index];
      if (target.dataset.checkWord !== undefined) {
        const written = slideValue(`word-${index}`).toLowerCase();
        const head = entry.term.toLowerCase().split(/[\/,]/)[0].trim();
        const ok = written.length > 10 && written.includes(head.split(" ")[0]);
        setSlideBox(`word-${index}`, `<p class="feedback ${ok ? "good" : "try"}"><span class="status-note">${ok ? "Great sentence!" : "Try again."}</span> ${ok ? "You used the word in a full idea." : `Write a full sentence that uses “${esc(entry.term)}”.`}</p>`);
        return;
      }
      // Marking a word repaints only its own slide, so the deck stays where the
      // learner left it — and the sentence they were writing on a neighbouring
      // slide is not in the repainted markup at all.
      const id = idFor(index);
      if (known.has(id)) known.delete(id); else known.add(id);
      progress.knownWords = [...known];
      saveProgress();
      if (known.size === vocab.length) complete("words", "All computing words learned.");
      d$("#wc-known").textContent = `${known.size} of ${vocab.length} learned`;
      const position = shown.findIndex((item) => item.index === index);
      if (position >= 0) deck.redrawSlide(position, wordSlide(shown[position], position));
    },
  });

  const drawDeck = () => {
    const query = (d$("#word-search")?.value || "").trim().toLowerCase();
    shown = vocab.map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !query || `${entry.term} ${entry.meaning}`.toLowerCase().includes(query));
    deck.setSlides(shown.map(wordSlide));
  };
  d$("#word-search").addEventListener("input", drawDeck);
  drawDeck();
}

function renderComputingWords() {
  // Rich vocabulary lab: searchable word list + a detail card with meaning,
  // a source example sentence, audio and a learned toggle.
  const vocab = (course.reference.vocabulary && course.reference.vocabulary.length)
    ? course.reference.vocabulary
    : (course.reference.terms || []).map(([term, meaning]) => ({ term, meaning, example: "", letter: (term[0] || "?").toUpperCase() }));
  if (!vocab.length) { cRoot().innerHTML = `${pageHeader("Language for computing", "Computing Words", "No key words were provided for this unit.")}`; return; }
  if (bothDesigns()) return bothDesignsPage(() => renderComputingWordsClassic(vocab), () => renderComputingWordsDeck(vocab));
  return renderComputingWordsClassic(vocab);
}

function renderComputingWordsClassic(vocab) {
  const known = new Set(progress.knownWords || []);
  let query = "";
  let activeIndex = 0;
  const idFor = (index) => `w${index}`;

  const draw = () => {
    const filtered = vocab.map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !query || `${entry.term} ${entry.meaning}`.toLowerCase().includes(query));
    if (!filtered.some(({ index }) => index === activeIndex) && filtered.length) activeIndex = filtered[0].index;
    const current = vocab[activeIndex];
    cRoot().innerHTML = `${pageHeader("Language for computing", "Computing Words", `Learn and explore the key words for ${escapeHtml(course.unit.unitTitle)}. ${known.size} of ${vocab.length} marked learned.`)}
      <div class="dictionary-layout">
        <section class="panel word-list">
          <label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search computing words" value="${escapeHtml(query)}"></label>
          <div id="word-rows">${filtered.length ? filtered.map(({ entry, index }) => `<button class="word-row ${index === activeIndex ? "active" : ""}" data-word="${index}" type="button"><span><strong>${escapeHtml(entry.term)}</strong><small>${escapeHtml(entry.meaning.slice(0, 46))}${entry.meaning.length > 46 ? "…" : ""}</small></span>${known.has(idFor(index)) ? "<span>LEARNED</span>" : ""}</button>`).join("") : `<div class="empty">No matching words found.</div>`}</div>
        </section>
        <section class="panel word-card" id="word-card">
          <div class="word-card-head"><div><span class="word-type">Computing word</span><h2>${escapeHtml(current.term)}</h2></div><button class="icon-button" id="listen-word" type="button" title="Listen" aria-label="Listen to ${escapeHtml(current.term)}">♪</button></div>
          <p class="meaning"><span class="field-label">Meaning:</span> ${escapeHtml(current.meaning)}</p>
          ${current.example ? `<div class="sentence-card"><small>Used in the lesson</small><p>“${escapeHtml(current.example)}”</p>${voiceButton(current.example, "Hear the example")}</div>` : ""}
          <div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="Write your own sentence using ${escapeHtml(current.term.toLowerCase())}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div>
          <div id="word-feedback"></div>
          <button class="button secondary" id="know-word" type="button">${known.has(idFor(activeIndex)) ? "✓ Learned" : "＋ I know this word"}</button>
        </section>
      </div>
      <p style="margin-top:16px"><button class="button primary" id="words-done" type="button">I explored the computing words ✓</button></p>`;
    const search = c$("#word-search");
    search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); const pos = search.selectionStart; draw(); const s = c$("#word-search"); s.focus(); s.setSelectionRange(pos, pos); });
    c$$('[data-word]').forEach((button) => button.addEventListener("click", () => { activeIndex = Number(button.dataset.word); draw(); }));
    c$("#listen-word").addEventListener("click", (event) => speakText(`${current.term}. ${current.meaning}`, event.currentTarget));
    c$("#check-word-sentence").addEventListener("click", () => {
      const written = c$("#word-sentence").value.trim().toLowerCase();
      const head = current.term.toLowerCase().split(/[\/,]/)[0].trim();
      const ok = written.length > 10 && written.includes(head.split(" ")[0]);
      c$("#word-feedback").innerHTML = `<p class="feedback ${ok ? "good" : "try"}"><span class="status-note">${ok ? "Great sentence!" : "Try again."}</span> ${ok ? "You used the word in a full idea." : `Write a full sentence that uses “${escapeHtml(current.term)}”.`}</p>`;
    });
    c$("#know-word").addEventListener("click", () => {
      const id = idFor(activeIndex);
      if (known.has(id)) known.delete(id); else known.add(id);
      progress.knownWords = [...known]; saveProgress();
      if (known.size === vocab.length) complete("words", "All computing words learned.");
      draw();
    });
    c$("#words-done").addEventListener("click", () => { complete("words", "Computing words explored."); navigate("explore"); });
  };
  draw();
}

// Explore as a deck: one discovery per slide — the model, the situation it comes
// from, and the question about it, with nothing else on screen competing for a
// five-year-old's turn. The discovery tabs become the dots.
//
// The progress panel does not survive as a panel: a slide has no room for a
// column beside the question. Its count moves under the dots, where the deck
// already keeps a section's tools, and it is updated in place as discoveries
// are solved.
function renderExploreConceptDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const items = course.explorations;
  const completed = new Set(progress.explorations || []);
  const countLabel = () => `${completed.size} of ${items.length} discovered`;

  const slides = items.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Discovery ${index + 1} of ${items.length} · ${esc(item.difficulty)}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      ${deckDiagram(topic, index)}
      <p class="gc-lead">${esc(item.context)}</p>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}</div>
      <div class="cmp-gc-model ${esc(item.modelType)}"><strong>${esc(item.modelType.replaceAll("-", " "))}</strong><span>${esc(item.explanation)}</span></div>
      <div class="wc-sentence">
        <small>Discovery question</small>
        <p>${esc(item.prompt)}</p>
        <div class="wc-sentence-controls">${deckVoiceSmall(item.prompt, "Listen to question")}</div>
        <input data-response="${esc(item.id)}" aria-label="Your answer to discovery ${index + 1}">
      </div>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check-explore="${esc(item.id)}">${deckIcon("list-checks")} Check my idea</button>
        <button class="gc-btn ghost small" type="button" data-hint-explore="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
      </div>
      <div data-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountSectionDeck({
    heading: "Familiar discoveries",
    label: "Discovery",
    slides,
    emptyMessage: "This unit has no concept discoveries yet.",
    tools: `<div class="wc-tools"><span class="status-chip" id="explore-count">${countLabel()}</span></div>`,
    onClick: (event) => {
      const target = event.target.closest("[data-check-explore], [data-hint-explore]");
      if (!target) return;
      const id = target.dataset.checkExplore || target.dataset.hintExplore;
      const item = items.find((candidate) => candidate.id === id);
      if (target.dataset.hintExplore) {
        setSlideBox(id, `<p class="feedback try"><span class="field-label">Hint:</span> ${esc(item.hint)}</p>`);
        return;
      }
      const correct = answerMatches(slideValue(id), item.answer);
      setSlideBox(id, `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Exactly!" : "Look again."}</span> ${esc(correct ? item.explanation : item.hint)}</p>`);
      if (!correct) return;
      completed.add(item.id);
      progress.explorations = [...completed];
      saveProgress();
      d$("#explore-count").textContent = countLabel();
      if (completed.size === items.length) complete("explore", "All concept discoveries complete.");
    },
  });
}

function renderExploreConcept() {
  if (bothDesigns()) return bothDesignsPage(() => renderExploreConceptClassic(), () => renderExploreConceptDeck());
  return renderExploreConceptClassic();
}

function renderExploreConceptClassic() {
  let active = 0;
  const completed = new Set(progress.explorations || []);
  const draw = () => {
    const item = course.explorations[active];
    cRoot().innerHTML = `${pageHeader("Familiar discoveries", "Explore the Concept", "Discover each idea through a labelled model and a real investigation you can try.")}
      <div class="exploration-tabs">${course.explorations.map((entry,index)=>`<button class="exploration-tab ${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-exploration="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.title)}</button>`).join("")}</div>
      <div class="story-layout"><section class="panel story-scene"><span class="eyebrow">Discovery ${active+1} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.title)}</h2>${computingDiagram(courseTopic(), active)}<p>${escapeHtml(item.context)}</p>${voiceButton(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}<div class="discovery-model ${escapeHtml(item.modelType)}"><strong>${escapeHtml(item.modelType.replaceAll('-',' '))}</strong><span>${escapeHtml(item.explanation)}</span></div></section><aside class="section-stack"><section class="panel"><h3>Discovery question</h3><p>${escapeHtml(item.prompt)}</p>${voiceButton(item.prompt, "Listen to question")}<input id="discovery-answer" class="math-input" aria-label="Discovery answer"><div class="question-actions"><button class="button primary" id="check-discovery" type="button">Check my idea</button><button class="button secondary" id="hint-discovery" type="button">Hint</button></div><div id="discovery-feedback"></div></section><section class="panel"><h3>Progress</h3><p><strong>${completed.size} of ${course.explorations.length}</strong> discoveries complete.</p><div class="progress-track"><span style="width:${completed.size/course.explorations.length*100}%"></span></div></section></aside></div>`;
    initComputingWebGL(cRoot());
    c$$('[data-exploration]').forEach(button=>button.addEventListener("click",()=>{active=Number(button.dataset.exploration);draw();}));
    c$("#hint-discovery").addEventListener("click",()=>{c$("#discovery-feedback").innerHTML=`<p class="feedback try"><span class="field-label">Hint:</span> ${escapeHtml(item.hint)}</p>`;});
    c$("#check-discovery").addEventListener("click",()=>{
      const response=c$("#discovery-answer").value.trim().toLowerCase().replace(/\s+/g," ");
      const answer=item.answer.toLowerCase();
      const correct=response && (response===answer || answer.includes(response) || response.includes(answer));
      c$("#discovery-feedback").innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Exactly!':'Look again.'}</span> ${escapeHtml(correct?item.explanation:item.hint)}</p>`;
      if(correct){completed.add(item.id);progress.explorations=[...completed];saveProgress();if(completed.size===course.explorations.length)complete("explore",`All ${course.explorations.length} concept discoveries complete.`);}
    });
  };
  draw();
}

// Visual Models as a deck: one model per slide, its tab now a dot. The three
// concept cards the grid showed beside every model come with it, restacked into
// a column — on a slide they sit under the model they illustrate rather than
// beside it.
function renderVisualModelsDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const models = course.visualModels;
  const slides = models.map((model, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Model ${index + 1} of ${models.length}${model.outcomeId ? ` · ${esc(model.outcomeId)}` : ""}</span>
      <h3 class="gc-title">${esc(model.title)}</h3>
      ${deckDiagram(topic, index)}
      <p class="gc-lead">${esc(model.purpose)}</p>
      <div class="gc-actions">${deckVoice(`${model.title}. ${model.purpose}`, "Listen to model")}</div>
      <div class="cmp-gc-cards">${course.concepts.slice(0, 3).map((concept) => `<article><strong>${esc(concept.title)}</strong><span>${esc(concept.example)}</span></article>`).join("")}</div>
      ${index === models.length - 1 ? deckFinish("visuals", "I explored the models") : ""}
    </div></section>`);
  mountSectionDeck({
    heading: "Ways to see the computing",
    label: "Model",
    slides,
    emptyMessage: "This unit has no visual models yet.",
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return;
      complete("visuals", "Visual models explored.");
      navigate("method");
    },
  });
}

function renderVisualModels() {
  if (bothDesigns()) return bothDesignsPage(() => renderVisualModelsClassic(), () => renderVisualModelsDeck());
  return renderVisualModelsClassic();
}

function renderVisualModelsClassic() {
  let active = 0;
  const draw = () => {
    const model = course.visualModels[active];
    cRoot().innerHTML = `${pageHeader("Ways to see the computing", "Visual Models", `Explore labelled models that make ${escapeHtml(course.unit.unitTitle)} visible and easier to explain.`)}<div class="model-tabs">${course.visualModels.map((item,index)=>`<button class="subtab ${index===active?'active':''}" data-model-index="${index}" type="button">${escapeHtml(item.title)}</button>`).join('')}</div><section class="panel model-stage generic-model-stage"><span class="eyebrow">${escapeHtml(model.outcomeId || `Model ${active+1}`)}</span><h2>${escapeHtml(model.title)}</h2>${computingDiagram(courseTopic(), active)}<p>${escapeHtml(model.purpose)}</p>${voiceButton(`${model.title}. ${model.purpose}`, "Listen to model")}<div class="model-concept-cards">${course.concepts.slice(0,3).map((concept)=>`<article><strong>${escapeHtml(concept.title)}</strong><span>${escapeHtml(concept.example)}</span></article>`).join('')}</div></section><p><button class="button primary" id="visuals-done" type="button">I explored the models ✓</button></p>`;
    initComputingWebGL(cRoot());
    c$$('[data-model-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.modelIndex);draw();}));
    c$("#visuals-done").addEventListener("click", () => { complete("visuals", "Visual models explored."); navigate("method"); });
  };
  draw();
}

// Learn the Method as a deck: one procedure per slide, its steps still revealed
// one at a time. The reveal is the teaching — a learner who can see step four
// before doing step one has not been taught a procedure — so it survives the
// move, done by adding a class rather than repainting, because each slide keeps
// its own place in its own steps.
function renderLearnMethodDeck() {
  const esc = escapeHtml;
  const methods = course.methods;
  const completed = new Set(progress.methods || []);
  const slides = methods.map((method, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Method ${index + 1} of ${methods.length} · ${esc(method.difficulty)}</span>
      <h3 class="gc-title">${esc(method.title)}</h3>
      <!-- .gc-note, not .gc-pattern: a method's example is a sentence, often a
           long one, and .gc-pattern is the 46px display size for a single word
           or a short pattern. The classic half had the same mistake at 70px. -->
      <p class="gc-note gc-try">${esc(method.example)}</p>
      <div class="gc-actions">${deckVoice(`${method.title}. Example: ${method.example}. ${method.steps.join(" ")}`, "Listen to method")}</div>
      <ol class="cmp-gc-steps" data-method-steps="${esc(method.id)}" data-step="0">
        ${method.steps.map((text, position) => `<li class="cmp-gc-step ${position === 0 ? "active" : ""}"><span>${position + 1}</span><div><strong>Step ${position + 1}</strong><p>${esc(text)}</p>${deckVoiceSmall(`Step ${position + 1}. ${text}`, "Listen to step")}</div></li>`).join("")}
      </ol>
      <button class="gc-btn" type="button" data-next-step="${esc(method.id)}">${deckIcon("arrow-right")} Show me the next step</button>
      ${index === methods.length - 1 ? deckFinish("method", "I learned every method") : ""}
    </div></section>`);

  mountSectionDeck({
    heading: "Short procedures",
    label: "Method",
    slides,
    emptyMessage: "This unit has no methods yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-next-step], [data-deck-finish]");
      if (!target) return;
      if (target.dataset.deckFinish) { complete("method", "All methods learned."); return; }
      const id = target.dataset.nextStep;
      const method = methods.find((candidate) => candidate.id === id);
      const list = d$(`[data-method-steps="${CSS.escape(id)}"]`);
      if (!list) return;
      const step = Math.min(method.steps.length - 1, Number(list.dataset.step || 0) + 1);
      list.dataset.step = String(step);
      list.querySelectorAll(".cmp-gc-step").forEach((node, position) => node.classList.toggle("active", position <= step));
      if (step < method.steps.length - 1) return;
      target.textContent = "Method complete ✓";
      completed.add(id);
      progress.methods = [...completed];
      saveProgress();
      if (completed.size === methods.length) complete("method", "All methods learned.");
    },
  });
}

function renderLearnMethod() {
  if (bothDesigns()) return bothDesignsPage(() => renderLearnMethodClassic(), () => renderLearnMethodDeck());
  return renderLearnMethodClassic();
}

function renderLearnMethodClassic() {
  let methodIndex=0;
  const completed=new Set(progress.methods||[]);
  const draw=()=>{
    const method=course.methods[methodIndex];
    cRoot().innerHTML=`${pageHeader(`${course.methods.length} short procedures`, "Learn the Method", "Select a method, reveal each step and practise the procedure before moving on.")}
      <div class="method-selector">${course.methods.map((item,index)=>`<button class="${index===methodIndex?'active':''} ${completed.has(item.id)?'done':''}" data-method="${index}" type="button"><span>${index+1}</span>${escapeHtml(item.title)}</button>`).join('')}</div>
      <section class="panel method-player"><div class="method-example"><span>${escapeHtml(method.difficulty)} method</span><strong class="method-example-text">${escapeHtml(method.example)}</strong><p>${escapeHtml(method.title)}</p>${voiceButton(`${method.title}. Example: ${method.example}. ${method.steps.join(" ")}`, "Listen to method")}</div><div class="method-steps">${method.steps.map((text,index)=>`<article class="method-step ${index===0?'active':''}" data-method-step="${index}"><span>${index+1}</span><div><h3>Step ${index+1}</h3><p>${escapeHtml(text)}</p>${voiceButton(`Step ${index+1}. ${text}`, "Listen to step")}</div></article>`).join('')}<button class="button primary" id="next-method-step" type="button">Show me the next step →</button></div></section>`;
    let step=0;
    c$$('[data-method]').forEach(button=>button.addEventListener('click',()=>{methodIndex=Number(button.dataset.method);draw();}));
    c$("#next-method-step").addEventListener('click',()=>{step=Math.min(method.steps.length-1,step+1);c$$('[data-method-step]').forEach((item,index)=>item.classList.toggle('active',index<=step));if(step===method.steps.length-1){completed.add(method.id);progress.methods=[...completed];saveProgress();c$("#next-method-step").textContent='Method complete ✓';if(completed.size===course.methods.length)complete('method',`All ${course.methods.length} methods learned.`);}});
  };
  draw();
}

const courseTopic = () => unitTopic(course.unit.unitTitle, course.concepts);

// The lesson as a deck: one concept per slide, its diagram above the prose it
// explains. `checkYourself` comes with it — on the grid it was the field the
// card had no room for and dropped; here the slide ends on the question the
// learner is meant to be able to answer before swiping on.
function renderLessonDeck() {
  const topic = courseTopic();
  const esc = escapeHtml;
  const concepts = course.concepts;
  const slides = concepts.map((concept, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Concept ${index + 1} of ${concepts.length}</span>
      <h3 class="gc-title">${esc(concept.title)}</h3>
      ${deckDiagram(topic, index)}
      <div class="cmp-gc-prose">${richText(concept.explanation, "gc-lead")}</div>
      <p class="gc-note"><span class="field-label">Example:</span> ${esc(concept.example)}</p>
      ${concept.checkYourself ? `<p class="gc-note gc-try">${esc(concept.checkYourself)}</p>` : ""}
      <div class="gc-actions">${deckVoice(`${concept.title}. ${spokenText(concept.explanation)}. Example: ${concept.example}`, "Listen to concept")}</div>
      ${index === concepts.length - 1 ? deckFinish("lesson", "I studied the concepts") : ""}
    </div></section>`);
  mountSectionDeck({
    heading: "The lesson",
    label: "Concept",
    slides,
    emptyMessage: "This unit has no concept explainers yet.",
    onClick: (event) => {
      if (!event.target.closest("[data-deck-finish]")) return;
      complete("lesson", "Lesson marked studied.");
      navigate("ai");
    },
  });
}

function renderLesson() {
  if (bothDesigns()) return bothDesignsPage(() => renderLessonClassic(), () => renderLessonDeck());
  return renderLessonClassic();
}

function renderLessonClassic() {
  const topic = courseTopic();
  const concepts = course.concepts.map((concept, index) => `<article class="panel concept-card"><span class="eyebrow">Concept ${index + 1}</span><h2>${escapeHtml(concept.title)}</h2>${computingDiagram(topic, index)}<div class="concept-body">${richText(concept.explanation)}</div><p class="example"><span class="field-label">Example:</span> ${escapeHtml(concept.example)}</p>${voiceButton(`${concept.title}. ${spokenText(concept.explanation)}. Example: ${concept.example}`, "Listen to concept")}</article>`).join("");
  cRoot().innerHTML = `${pageHeader("The lesson", course.unit.unitTitle, "Every idea in this unit, explained in full with a diagram for each. Read it, listen to it, or both — you do not need anyone else to work through this.")}
    <div class="concept-grid">${concepts}</div>
    <p><button class="button primary" id="lesson-done" type="button">I studied the concepts ✓</button></p>`;
  initComputingWebGL(cRoot());
  c$("#lesson-done").addEventListener("click", () => { complete("lesson", "Lesson marked studied."); navigate("ai"); });
}

// Worked Examples as a deck: one example per slide, its level subtabs now the
// filter under the dots — the same place vocabulary puts its search.
function renderExamplesDeck() {
  const esc = escapeHtml;
  const all = course.workedExamples;
  const levels = ["Basic", "Intermediate", "Challenge"].filter((level) => all.some((item) => item.difficulty === level));
  const viewed = new Set(progress.examplesViewed || []);
  let shown = all;
  const countLabel = () => `${viewed.size} of ${all.length} solutions opened`;

  const exampleSlide = (item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Example ${index + 1} of ${shown.length} · ${esc(item.difficulty)}${item.outcomeId ? ` · ${esc(item.outcomeId)}` : ""}</span>
      <h3 class="gc-title">${esc(item.title)}</h3>
      <p class="gc-note gc-try">${esc(item.prompt)}</p>
      <div class="gc-actions">${deckVoice(`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`, "Listen to example")}</div>
      <details class="gc-practice" data-example="${esc(item.id)}"><summary>Show worked solution</summary><div class="cmp-gc-prose">${richText(item.solution, "gc-note")}</div></details>
    </div></section>`;

  const deck = mountSectionDeck({
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
      if (!summary) return;
      const details = summary.parentElement;
      if (details.open) return;
      viewed.add(details.dataset.example);
      progress.examplesViewed = [...viewed];
      saveProgress();
      const counter = d$("#example-count");
      if (counter) counter.textContent = countLabel();
      if (viewed.size === all.length) complete("examples", `All ${all.length} worked examples reviewed.`);
    },
  });

  const drawDeck = () => {
    const level = d$("#example-level")?.value || "all";
    shown = level === "all" ? all : all.filter((example) => example.difficulty === level);
    deck.setSlides(shown.map(exampleSlide));
  };
  d$("#example-level").addEventListener("change", drawDeck);
  drawDeck();
}

function renderExamples() {
  if (bothDesigns()) return bothDesignsPage(() => renderExamplesClassic(), () => renderExamplesDeck());
  return renderExamplesClassic();
}

function renderExamplesClassic() {
  let level="Basic";
  const viewed=new Set(progress.examplesViewed||[]);
  // Counted from the unit, never written into the sentence. Every page here said
  // "Twelve examples" and "/12" while the units hold ten at Stages 5-8 and six
  // or seven at Stages 1-4, so a learner who opened every solution was shown
  // "10/12" and a bar stuck at 83% — on a section the completion check had
  // already marked done, because that check reads workedExamples.length.
  const LEVELS = ["Basic", "Intermediate", "Challenge"];
  const total = course.workedExamples.length;
  const atLevel = (name) => course.workedExamples.filter((example) => example.difficulty === name).length;
  const draw=()=>{
    const items=course.workedExamples.filter(item=>item.difficulty===level);
    cRoot().innerHTML = `${pageHeader(`${total} examples · ${LEVELS.length} levels`, "Worked Examples", `Study ${LEVELS.map((name) => `${atLevel(name)} ${name}`).join(", ")} examples. Each solution explains why the step works.`)}
      <div class="subtabs">${LEVELS.map(item=>`<button class="subtab ${item===level?'active':''}" data-example-level="${item}" type="button">${item} · ${atLevel(item)}</button>`).join('')}</div>
      <div class="task-grid">${items.map((item) => `<article class="panel"><span class="eyebrow">${escapeHtml(item.difficulty)} · ${escapeHtml(item.outcomeId)}</span><h3>${escapeHtml(item.title)}</h3><p class="rule-box">${escapeHtml(item.prompt)}</p>${voiceButton(`${item.title}. ${item.prompt}. Solution: ${spokenText(item.solution)}`, "Listen to example")}<details data-example="${item.id}"><summary>Show worked solution</summary>${richText(item.solution)}</details></article>`).join("")}</div>
      <section class="panel examples-progress"><strong>${viewed.size}/${total}</strong><span>solutions opened</span><div class="progress-track"><span style="width:${total?viewed.size/total*100:0}%"></span></div></section>`;
    c$$('[data-example-level]').forEach(button=>button.addEventListener('click',()=>{level=button.dataset.exampleLevel;draw();}));
    c$$('[data-example]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open){viewed.add(details.dataset.example);progress.examplesViewed=[...viewed];saveProgress();if(viewed.size===course.workedExamples.length)complete('examples',`All ${total} worked examples reviewed.`);}}));
  };
  draw();
}

// Guided Practice as a deck: one question per slide, so a Stage 1 learner faces
// the question they are answering rather than three level headings and a wall of
// six. The level rides on the slide instead of grouping the page.
//
// The three-step hint escalation is the grid's, kept per question rather than
// per button: on a deck a learner can leave a question and come back to it, and
// a hint counter that lives on the button resets when they do.
function renderPracticeDeck() {
  const esc = escapeHtml;
  const items = course.practice;
  const hintsUsed = new Map();
  const slides = items.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Question ${index + 1} of ${items.length} · ${esc(item.level)}</span>
      <h3 class="gc-title">${esc(item.prompt)}</h3>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to question")}</div>
      <div class="wc-sentence">
        <small>Your answer</small>
        <input data-response="${esc(item.id)}" autocomplete="off" placeholder="Type your answer or working notes" aria-label="Your answer to question ${index + 1}">
      </div>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check="${esc(item.id)}">${deckIcon("list-checks")} Check my answer</button>
        <button class="gc-btn ghost small" type="button" data-hint="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
        <button class="gc-btn ghost small" type="button" data-answer="${esc(item.id)}">${deckIcon("arrow-right")} Next step</button>
      </div>
      <div data-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountSectionDeck({
    heading: "Support that adapts",
    label: "Question",
    slides,
    emptyMessage: "This unit has no guided practice yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-check], [data-hint], [data-answer]");
      if (!target) return;
      const id = target.dataset.check || target.dataset.hint || target.dataset.answer;
      const item = items.find((candidate) => candidate.id === id);
      if (target.dataset.answer) {
        setSlideBox(id, `<p class="feedback try"><span class="field-label">Next step:</span> ${esc(item.hint)} Do that step, then check your answer again.</p>`);
        return;
      }
      if (target.dataset.hint) {
        const used = (hintsUsed.get(id) || 0) + 1;
        hintsUsed.set(id, used);
        const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `The reviewed guidance is ${item.answer}. Explain why it fits before moving on.`];
        setSlideBox(id, `<p class="feedback try"><span class="field-label">Hint ${Math.min(used, 3)}:</span> ${esc(hints[Math.min(used - 1, 2)])}</p>`);
        return;
      }
      const correct = answerMatches(slideValue(id), item.answer);
      setSlideBox(id, `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct reasoning!" : "Not yet."}</span> ${correct ? esc(item.answer) : `Your response does not match the reviewed guidance yet. ${esc(item.hint)} Try representing the idea in a simpler way first.`}</p>`);
      if (correct && !progress.practiceOpened.includes(item.id)) { progress.practiceOpened.push(item.id); saveProgress(); }
      if (progress.practiceOpened.length === items.length) complete("guided", "Guided Practice complete.");
    },
  });
}

function renderPractice() {
  if (bothDesigns()) return bothDesignsPage(() => renderPracticeClassic(), () => renderPracticeDeck());
  return renderPracticeClassic();
}

function renderPracticeClassic() {
  const levels = [...new Set(course.practice.map((item) => item.level))];
  cRoot().innerHTML = `${pageHeader("Support that adapts", "Guided Practice", "Answer with support. Check your idea, ask for a progressive hint or reveal only the next step.")}
    <section class="panel support-strip"><span>Immediate feedback</span><span>Progressive hints</span><span>Next-step support</span><span>Error explanations</span><span>Easier retry</span></section>
    ${levels.map((level) => `<section class="section-stack" style="margin-bottom:24px"><h2>${escapeHtml(level)}</h2><div class="task-grid">${course.practice.filter((item) => item.level === level).map((item) => `<article class="panel question-card"><label for="answer-${item.id}">${escapeHtml(item.prompt)}</label>${voiceButton(item.prompt, "Listen to question")}<input id="answer-${item.id}" autocomplete="off" placeholder="Type your answer or working notes"><div class="question-actions"><button class="button primary" data-check="${item.id}" type="button">Check my answer</button><button class="button secondary" data-hint="${item.id}" type="button">Give me a hint</button><button class="button secondary" data-answer="${item.id}" type="button">Show next step</button></div><div id="feedback-${item.id}" aria-live="polite"></div></article>`).join("")}</div></section>`).join("")}`;
  c$$('[data-check]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.check);
    const response = c$(`#answer-${item.id}`).value.trim().toLowerCase().replace(/\s+/g," ");
    const expected = item.answer.toLowerCase();
    const correct = response && (expected.includes(response) || response.includes(expected));
    c$(`#feedback-${item.id}`).innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Correct reasoning!" : "Not yet."}</span> ${correct ? escapeHtml(item.answer) : `Your response does not match the reviewed guidance yet. ${escapeHtml(item.hint)} Try representing the idea in a simpler way first.`}</p>`;
    if (correct && !progress.practiceOpened.includes(item.id)) { progress.practiceOpened.push(item.id); saveProgress(); }
    if (progress.practiceOpened.length === course.practice.length) complete("guided", "Guided Practice complete.");
  }));
  c$$('[data-hint]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.hint);
    const used = Number(button.dataset.used || 0) + 1;
    button.dataset.used = String(used);
    const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `The reviewed guidance is ${item.answer}. Explain why it fits before moving on.`];
    c$(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><span class="field-label">Hint ${Math.min(used,3)}:</span> ${escapeHtml(hints[Math.min(used-1,2)])}</p>`;
  }));
  c$$('[data-answer]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.answer);
    c$(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><span class="field-label">Next step:</span> ${escapeHtml(item.hint)} Do that step, then check your answer again.</p>`;
  }));
}

// Build It as a deck: one activity per slide — what you need, the steps, and the
// space to write down what happened, with the model above them.
//
// Per-activity Mark complete marks without repainting, so the note the learner
// has just typed stays where they left it. The unit's finish still requires
// every activity marked, counted over the buttons on the deck.
function renderActivitiesDeck() {
  const esc = escapeHtml;
  const topic = courseTopic();
  const activities = course.activities;
  const slides = activities.map((activity, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Activity ${index + 1} of ${activities.length} · Hands-on</span>
      <h3 class="gc-title">${esc(activity.title)}</h3>
      ${deckDiagram(topic, index)}
      <p class="gc-note"><span class="field-label">You need:</span> ${esc(activity.materials)}</p>
      <ol class="cmp-gc-list">${activity.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <div class="gc-actions">${deckVoice(`${activity.title}. You need: ${activity.materials}. ${activity.steps.join(" ")}`, "Listen to activity")}</div>
      <div class="wc-sentence">
        <small>What you did and noticed</small>
        <textarea class="activity-response" rows="4" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${esc(activity.title)}"></textarea>
      </div>
      <button class="gc-btn ghost" type="button" data-activity-done="${index}">${deckIcon("check")} Mark complete</button>
      ${index === activities.length - 1 ? deckFinish("activities", "Finish activities") : ""}
    </div></section>`);

  mountSectionDeck({
    heading: "Learn by doing",
    label: "Activity",
    slides,
    emptyMessage: "This unit has no build activities yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-activity-done], [data-deck-finish]");
      if (!target) return;
      if (target.dataset.activityDone) {
        target.disabled = true;
        target.classList.remove("ghost");
        target.classList.add("done");
        target.innerHTML = `${deckIcon("check")} Complete`;
        return;
      }
      if (!d$$('[data-activity-done]').every((button) => button.disabled)) return toast("Mark each activity complete first.");
      complete("activities", "Unit activities complete.");
    },
  });
}

function renderActivities() {
  if (bothDesigns()) return bothDesignsPage(() => renderActivitiesClassic(), () => renderActivitiesDeck());
  return renderActivitiesClassic();
}

function renderActivitiesClassic() {
  const topic = courseTopic();
  cRoot().innerHTML = `${pageHeader("Learn by doing", "Build It", `Work through the ${escapeHtml(course.unit.unitTitle)} activities. Each one can be done on a computer or, where it says so, with paper and things you already have.`)}
    <div class="task-grid">${course.activities.map((activity, index) => `<article class="panel task-card"><span class="eyebrow">Activity ${index + 1} · Hands-on</span><h2>${escapeHtml(activity.title)}</h2>${computingDiagram(topic, index)}<p class="rule-box"><span class="field-label">You need:</span> ${escapeHtml(activity.materials)}</p><ol class="agenda">${activity.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><textarea class="activity-response" rows="4" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${escapeHtml(activity.title)}"></textarea><button class="button secondary" data-activity-done="${index}" type="button">✓ Mark complete</button></article>`).join("")}</div>
    <p><button class="button primary" id="activities-done" type="button">Finish activities ✓</button></p>`;
  initComputingWebGL(cRoot());
  c$$('[data-activity-done]').forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.textContent = "✓ Complete"; }));
  c$("#activities-done").addEventListener("click", () => {
    if (!c$$('[data-activity-done]').every((button) => button.disabled)) return toast("Mark each activity complete first.");
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
      id: "mental-math-dash", icon: "⚡", skill: "Rapid computing recall", title: "Quick Computing Dash",
      description: "Use place-value shortcuts to calculate accurately.", type: "choice",
      rounds: [
        { prompt: "What is 10 more than 35?", choices: ["36", "45", "55"], answer: "45", clue: "Add one ten; keep the ones.", explanation: "35 plus 10 is 45." },
        { prompt: "What is 10 less than 82?", choices: ["72", "81", "92"], answer: "72", clue: "Subtract one ten; keep the ones.", explanation: "82 minus 10 is 72." },
        { prompt: "What is 50 + 7?", choices: ["12", "57", "75"], answer: "57", clue: "Combine five tens and seven ones.", explanation: "50 plus 7 equals 57." },
        { prompt: "What is 68 - 8?", choices: ["60", "61", "76"], answer: "60", clue: "Remove all eight ones.", explanation: "68 minus 8 leaves 6 tens, or 60." }
      ]
    },
    {
      id: "real-life-math", icon: "⌂", skill: "Problem solving", title: "Real-Life Computing",
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
  $("#app").innerHTML = `${pageHeader("Play, practise, master", "Game zone", "Twelve short games turn this unit's key words, algorithms, debugging and reasoning into active practice.", `${course.stage.label} games`)}
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
  if (mastered===gamePack.games.length) complete("games", "All Computing games mastered.");
  $("#app").innerHTML = `<section class="panel game-result"><div class="score-ring">${gameScore}/${game.rounds.length}</div><span class="eyebrow">${passed?'Game mastered':'Keep practising'}</span><h1>${passed?'Brilliant work!':'Nearly there!'}</h1><p>You earned ${gameScore} stars and ${gameScore*20+(passed?20:0)} XP in ${escapeHtml(game.title)}.</p><div class="game-stars large">${game.rounds.map((_,index)=>`<span class="${index<gameScore?'earned':''}">★</span>`).join('')}</div><div class="game-tools"><button class="button secondary" id="replay-game" type="button">↻ Play again</button><button class="button primary" id="games-home" type="button">Choose another game →</button></div></section>`;
  $("#replay-game").addEventListener("click", () => startMathGame(game.id));
  $("#games-home").addEventListener("click", () => { activeGameId=null; renderGames(); });
}

function renderFluency() {
  const items = course.fluency;
  $("#app").innerHTML = `${pageHeader("Speed after understanding", "Computing Fluency", "Build accuracy and confidence with a short number sprint. Fluency supports conceptual learning; it does not replace it.")}
    <section class="panel fluency-shell"><div class="fluency-top"><div><span>Question</span><strong id="fluency-position">1/${items.length}</strong></div><div><span>Accurate</span><strong id="fluency-score">0</strong></div><div><span>Time</span><strong id="fluency-time">Ready</strong></div></div><div id="fluency-question" class="math-display"></div><label for="fluency-answer">Your answer</label><div class="fluency-answer"><input id="fluency-answer" inputmode="numeric" autocomplete="off"><button class="button primary" id="check-fluency" type="button">Check & continue</button></div><div id="fluency-feedback"></div></section>`;
  let index = 0;
  let score = 0;
  let startedAt = null;
  const draw = () => { $("#fluency-position").textContent=`${index+1}/${items.length}`; $("#fluency-question").textContent=items[index].prompt; $("#fluency-answer").value=""; $("#fluency-answer").focus(); };
  $("#check-fluency").addEventListener("click", () => {
    if (!startedAt) startedAt = Date.now();
    const response = $("#fluency-answer").value.trim().toLowerCase();
    const expected = items[index].answer.toLowerCase();
    const correct = response && (response===expected || expected.includes(response) || response.includes(expected));
    if (correct) score += 1;
    $("#fluency-score").textContent=score;
    $("#fluency-feedback").innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Correct!':'Review:'}</span> ${escapeHtml(correct?items[index].answer:items[index].hint)}</p>`;
    index += 1;
    if (index >= items.length) {
      const seconds=Math.max(1,Math.round((Date.now()-startedAt)/1000));
      $("#fluency-time").textContent=`${seconds}s`;
      $("#check-fluency").disabled=true;
      $("#fluency-question").textContent=`${score} of ${items.length} accurate`;
      complete("fluency", "Computing Fluency sprint complete.");
    } else draw();
  });
  $("#fluency-answer").addEventListener("keydown",event=>{if(event.key==="Enter")$("#check-fluency").click();});
  draw();
}

// Solve Real Problems as a deck: one situation per slide. A correct answer locks
// its own Check button, exactly as the grid did, and the section completes when
// every problem is locked — counted over the deck's buttons, which are all in
// the DOM at once.
function renderRealProblemsDeck() {
  const esc = escapeHtml;
  const problems = course.realProblems;
  const ICONS = ["⌂", "◫", "🚌", "▦", "◇", "✦"];
  const slides = problems.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Problem ${index + 1} of ${problems.length} · ${esc(item.context)} · ${esc(item.difficulty)}</span>
      <div class="cmp-gc-badge" aria-hidden="true">${ICONS[index] || "#"}</div>
      <h3 class="gc-title">${esc(item.prompt)}</h3>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to problem")}</div>
      <div class="wc-sentence">
        <small>Your working and answer</small>
        <textarea data-response="${esc(item.id)}" rows="4" placeholder="Show your calculation and answer…" aria-label="Your answer to problem ${index + 1}"></textarea>
      </div>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check-problem="${esc(item.id)}">${deckIcon("list-checks")} Check answer</button>
        <button class="gc-btn ghost small" type="button" data-hint-problem="${esc(item.id)}">${deckIcon("lightbulb")} Hint</button>
      </div>
      <div data-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountSectionDeck({
    heading: "Computing in daily life",
    label: "Problem",
    slides,
    emptyMessage: "This unit has no real-world problems yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-check-problem], [data-hint-problem]");
      if (!target) return;
      const id = target.dataset.checkProblem || target.dataset.hintProblem;
      const item = problems.find((candidate) => candidate.id === id);
      if (target.dataset.hintProblem) {
        setSlideBox(id, `<p class="feedback try"><span class="field-label">Hint:</span> ${esc(item.hint)}</p>`);
        return;
      }
      const correct = answerMatches(slideValue(id), item.answer);
      setSlideBox(id, `<p class="feedback ${correct ? "good" : "try"}"><span class="status-note">${correct ? "Applied correctly!" : "Check the situation."}</span> ${esc(correct ? item.answer : item.hint)}</p>`);
      if (!correct) return;
      target.disabled = true;
      if (d$$('[data-check-problem]').every((button) => button.disabled)) complete("problems", "Real-world problems complete.");
    },
  });
}

function renderRealProblems() {
  if (bothDesigns()) return bothDesignsPage(() => renderRealProblemsClassic(), () => renderRealProblemsDeck());
  return renderRealProblemsClassic();
}

function renderRealProblemsClassic() {
  const problems = course.realProblems;
  cRoot().innerHTML = `${pageHeader("Computing in daily life", "Solve Real Problems", `Apply ${escapeHtml(course.unit.unitTitle)} to home, school, markets, travel and the wider community.`)}
    <div class="problem-grid">${problems.map((item,index)=>`<article class="panel real-problem"><div class="problem-icon">${["⌂","◫","🚌","▦","◇","✦"][index]||"#"}</div><span class="eyebrow">${escapeHtml(item.context)} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt, "Listen to problem")}<textarea id="problem-${item.id}" placeholder="Show your calculation and answer…"></textarea><div class="question-actions"><button class="button primary" data-check-problem="${item.id}" type="button">Check answer</button><button class="button secondary" data-problem-hint="${item.id}" type="button">Hint</button></div><div id="problem-feedback-${item.id}"></div></article>`).join("")}</div>`;
  c$$('[data-check-problem]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.checkProblem);const response=c$(`#problem-${item.id}`).value.trim().toLowerCase();const expected=item.answer.toLowerCase();const correct=response&&(response===expected||expected.includes(response)||response.includes(expected));c$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback ${correct?'good':'try'}"><span class="status-note">${correct?'Applied correctly!':'Check the situation.'}</span> ${escapeHtml(correct?item.answer:item.hint)}</p>`;if(correct)button.disabled=true;if(c$$('[data-check-problem]').every(itemButton=>itemButton.disabled))complete("problems","Real-world problems complete.");}));
  c$$('[data-problem-hint]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.problemHint);c$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback try"><span class="field-label">Hint:</span> ${escapeHtml(item.hint)}</p>`;}));
}

// Explain Your Thinking as a deck: one prompt per slide, the writing space the
// centre of it. The key ideas stay visible beside the prompt — they are the
// scaffolding the check marks against, not a hint — and the model explanation
// stays behind a reveal so it cannot be copied before an attempt.
//
// Slides are never repainted here, so an explanation written on slide 2 is still
// there when the learner swipes back to it.
function renderExplainThinkingDeck() {
  const esc = escapeHtml;
  const prompts = course.reasoningPrompts;
  const completed = new Set(progress.reasoning || []);
  const slides = prompts.map((item, index) => `<section class="gc-slide gc-v${index % 5}"><div class="gc-inner">
      <span class="gc-eyebrow">Prompt ${index + 1} of ${prompts.length} · ${esc(item.difficulty)}</span>
      <h3 class="gc-title">${esc(item.prompt)}</h3>
      <div class="gc-actions">${deckVoice(item.prompt, "Listen to prompt")}</div>
      <div class="wc-sentence">
        <small>Your explanation</small>
        <textarea data-response="${esc(item.id)}" rows="6" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…" aria-label="Your explanation for prompt ${index + 1}"></textarea>
      </div>
      <ul class="checklist">${item.keyIdeas.map((idea) => `<li>${esc(idea)}</li>`).join("")}</ul>
      <div class="gc-actions">
        <button class="gc-btn" type="button" data-check-reasoning="${esc(item.id)}">${deckIcon("list-checks")} Check my ideas</button>
        <button class="gc-btn ghost small" type="button" data-show-model="${esc(item.id)}">${deckIcon("eye")} Show model explanation</button>
      </div>
      <div class="cmp-gc-prose" data-reveal="${esc(item.id)}" hidden>
        <p class="gc-note">${esc(item.modelAnswer)}</p>
        ${deckVoiceSmall(item.modelAnswer, "Listen to model answer")}
      </div>
      <div data-feedback="${esc(item.id)}" role="status" aria-live="polite" aria-atomic="true"></div>
    </div></section>`);

  mountSectionDeck({
    heading: "Reasoning matters",
    label: "Prompt",
    slides,
    emptyMessage: "This unit has no reasoning prompts yet.",
    onClick: (event) => {
      const target = event.target.closest("[data-check-reasoning], [data-show-model]");
      if (!target) return;
      const id = target.dataset.checkReasoning || target.dataset.showModel;
      const item = prompts.find((candidate) => candidate.id === id);
      if (target.dataset.showModel) return revealSlideBox(id, target);
      const text = slideValue(id).toLowerCase();
      const hits = item.keyIdeas.filter((idea) => idea.toLowerCase().split(/\s+/).some((word) => word.length > 2 && text.includes(word))).length;
      const secure = text.length > 30 && (hits > 0 || item.keyIdeas.length === 0);
      setSlideBox(id, `<p class="feedback ${secure ? "good" : "try"}"><span class="status-note">${secure ? "Your explanation includes real evidence." : "Add more evidence."}</span> ${secure ? esc(item.modelAnswer) : `Use these ideas: ${esc(item.keyIdeas.join(", "))}.`}</p>`);
      if (!secure) return;
      completed.add(item.id);
      progress.reasoning = [...completed];
      saveProgress();
      if (completed.size === prompts.length) complete("explain", "Reasoning explanations complete.");
    },
  });
}

function renderExplainThinking() {
  if (bothDesigns()) return bothDesignsPage(() => renderExplainThinkingClassic(), () => renderExplainThinkingDeck());
  return renderExplainThinkingClassic();
}

function renderExplainThinkingClassic() {
  let active=0;
  const completed=new Set(progress.reasoning||[]);
  const draw=()=>{const item=course.reasoningPrompts[active];cRoot().innerHTML=`${pageHeader("Reasoning matters", "Explain Your Thinking", `Explain the ideas in ${escapeHtml(course.unit.unitTitle)} using evidence from this unit, not only a final answer.`)}<div class="reasoning-tabs">${course.reasoningPrompts.map((entry,index)=>`<button class="${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-reasoning-index="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.difficulty)}</button>`).join('')}</div><div class="explain-layout"><section class="panel"><span class="eyebrow">Reasoning prompt</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt,"Listen to prompt")}<textarea id="reasoning-text" rows="9" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…"></textarea><button class="button primary" id="check-reasoning-text" type="button">Check your reasoning</button><div id="reasoning-text-feedback"></div></section><section class="panel"><h3>Key ideas</h3><ul class="checklist">${item.keyIdeas.map((idea)=>`<li>${escapeHtml(idea)}</li>`).join('')}</ul><details><summary>Show model explanation</summary><p>${escapeHtml(item.modelAnswer)}</p>${voiceButton(item.modelAnswer,"Listen to model answer")}</details></section></div>`;c$$('[data-reasoning-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.reasoningIndex);draw();}));c$("#check-reasoning-text").addEventListener('click',()=>{const text=c$("#reasoning-text").value.toLowerCase();const hits=item.keyIdeas.filter((idea)=>idea.toLowerCase().split(/\s+/).some((word)=>word.length>2&&text.includes(word))).length;const secure=text.length>30&&(hits>0||item.keyIdeas.length===0);c$("#reasoning-text-feedback").innerHTML=`<p class="feedback ${secure?'good':'try'}"><span class="status-note">${secure?'Your explanation includes evidence from the unit.':'Add more evidence from the unit.'}</span> ${secure?escapeHtml(item.modelAnswer):`Use these ideas: ${escapeHtml(item.keyIdeas.join(', '))}.`}</p>`;if(secure){completed.add(item.id);progress.reasoning=[...completed];saveProgress();if(completed.size===course.reasoningPrompts.length)complete('explain','Reasoning explanations complete.');}});};
  draw();
}

function renderLiveClass() {
  $("#app").innerHTML = `${pageHeader("Learn together", "Live Computing Class", "Bring your model, one solved problem and one question for teacher-led instruction and group practice.")}
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
  $("#app").innerHTML = `${pageHeader(`All ${manifest.units.length} units · authentic application`, `${course.stage.label} Computing Capstone`, gradeCapstone.overview)}
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
      completeGradeSection("capstone", `${course.stage.label} Computing Capstone completed.`);
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
    meta: { subject: "computing", subjectLabel: "Computing", grade: stageNumber, cambridgeCode: `${fw.level} ${fw.code}`, unitNo: course.unit.unitNo, unitTitle: course.unit.unitTitle, courseOutline: outlineFromManifest(manifest), unit: course, modules: modulesFromSections(isPrereqUnit ? [] : sections) },
    store: progress,
    ui: { escapeHtml, toast, voiceButton, bindVoiceControls },
    tutorLabel: "Wehel Tutor",
    placeholder: `Ask about ${course.unit.unitTitle}…`,
    quickPrompts: [
      { label: "Explain more simply", message: "Can you explain the first concept in this unit in a simpler way?" },
      { label: "Quiz me", message: "Quiz me on this unit, one question at a time." },
      { label: "Be the literal computer", message: "Let's play a game where you are a computer that follows my instructions exactly." },
      { label: "Help with homework", message: "Can you help me with my homework about this unit?" },
    ],
    fallbackReply: buildTutorReply,
    onExchange: (count) => { if (count >= 2) complete("ai"); },
    fetchUnit: unitFetcher(manifest, dataRootUrl),
    onSaved: saveProgress,
  };
}

function renderAI() {
  $("#app").innerHTML = `${pageHeader("Your AI subject expert", "Wehel Tutor — Computing", "Ask questions, go deeper, get quizzed, play 'the literal computer' or get homework help — by text or voice.", "Wehel Tutor · Ehel Academy AI")}
    <div class="overview-grid"><section class="panel" id="wehel-chat"></section><aside class="section-stack"><section class="panel"><h3>What Wehel Tutor can do</h3><ul class="checklist"><li>Explain this unit more simply — or go deeper</li><li>Quiz you and check your thinking</li><li>Play the literal computer that follows your exact instructions</li><li>Help with homework without doing it for you</li></ul></section><section class="panel"><h3>Learning boundaries</h3><ul class="checklist"><li>Hints before answers</li><li>Unit content first</li><li>Easier questions when needed</li><li>Checkpoint choices stay yours</li></ul></section></aside></div>`;
  mountWehelChat({ container: $("#wehel-chat"), ...wehelOptions() });
}

function renderReflect() {
  const choices = ["Not yet", "With help", "By myself"];
  $("#app").innerHTML = `${pageHeader("Mastery and next steps", "My Computing Progress", "Reflect on each outcome and see which learning steps you have completed.")}
    <section class="panel progress-summary"><div><strong>${unitSectionIds().filter((id) => progress.completed.includes(id)).length}/${unitSectionIds().length}</strong><span>unit learning steps complete</span></div><div class="progress-track"><span style="width:${Math.round(unitSectionIds().filter((id) => progress.completed.includes(id)).length/unitSectionIds().length*100)}%"></span></div></section>
    <section class="panel grade-progress-strip"><div><strong>${gradeProgress.completed.includes("capstone") ? "Complete" : "In progress"}</strong><span>Stage Capstone</span></div><div><strong>${gradeProgress.quizBest || 0}%</strong><span>Capstone Quiz best</span></div><button class="button secondary" data-go="capstone" type="button">View stage capstone</button></section>
    <section class="panel"><div class="self-list">${course.selfAssessment.map((statement, index) => `<div class="self-row"><strong>${escapeHtml(statement)}</strong>${choices.map((choice) => `<button class="self-choice ${progress.reflection[index] === choice ? "selected" : ""}" data-reflect="${index}" data-choice="${choice}" type="button">${choice}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="save-reflection" type="button">Save reflection ✓</button></p></section>`;
  $$('[data-reflect]').forEach((button) => button.addEventListener("click", () => { progress.reflection[button.dataset.reflect] = button.dataset.choice; saveProgress(); renderReflect(); }));
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
  $("#save-reflection").addEventListener("click", () => {
    if (Object.keys(progress.reflection).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("progress", "Computing progress reflection saved on this device.");
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
  subjectKey: "computing",
  param: "stage",
  mediaSubject: "computing",
  // NOTE: "ehel_math", not "ehel_computing". Carried over verbatim from
  // computing/shared/course-ui.js, where it was a copy-paste leftover from the
  // mathematics twin this course was cloned from — so runtime narration for
  // Computing is attributed to Maths at the TTS endpoint. Preserved here so the
  // shell migration is provably behaviour-neutral; correcting it is a separate,
  // one-word change with its own reasoning about billing/analytics history.
  ttsPurpose: "ehel_math",
  sections,
  nonCountable: ["overview", "capstone", "capstonequiz"],
  gradeSections: ["capstone", "capstonequiz"],
  progressDefaults: { completed: [], practiceOpened: [], reflection: {}, aiMessages: [], games: {} },
  gradeDefaults: { completed: [], capstoneResponses: {}, capstoneEvidence: {}, quizBest: 0 },
  keys: (s, u) => ({
    progress: `ehel-comp-s${s}-u${u}-progress-v1`,
    grade: `ehel-comp-s${s}-capstone-progress-v1`,
    legacyProgress: `ehel-comp-g${s}-u${u}-progress-v1`,
    legacyGrade: `ehel-comp-g${s}-capstone-progress-v1`,
  }),
  courseKey: (s) => `ehel-comp-g${pad2(s)}`,
  extendSummary: (progress, base) => ({ ...base, knownWords: progress.knownWords ? [...progress.knownWords] : undefined }),
  visibleSections: () => (isPrereqUnit
    ? [["overview", "layout-dashboard", "Unit Overview"], ["placement", "clipboard-check", "Placement exam"]]
    : sections),
  renderers: {
    overview: () => (isPrereqUnit ? placement.renderOverview() : renderOverview()),
    placement: () => (isPrereqUnit ? placement.renderExam() : navigate("overview")),
    tools: renderToolkit, lesson: renderLesson, ai: renderAI,
    words: renderComputingWords, explore: renderExploreConcept, visuals: renderVisualModels,
    code: renderCodeExamples, method: renderLearnMethod, examples: renderExamples,
    guided: renderPractice, reference: renderReference, activities: renderActivities,
    debug: renderDebugging, games: renderGames, fluency: renderFluency,
    problems: renderRealProblems, safety: renderSafety, explain: renderExplainThinking,
    project: renderProject, challenge: renderAssessment, capstone: renderGradeCapstone,
    capstonequiz: renderCapstoneQuiz, live: renderLiveClass, progress: renderReflect,
    teacher: () => (isPrereqUnit ? placement.renderTeacher() : renderTeacher()),
  },
  bind,
  wehelOptions,
  // A deck goes full-bleed by putting gc-full on the body. Leaving the section
  // has to take it off again, or the next page renders inside a shell that has
  // had its padding, its max-width and its page header stripped out.
  //
  // The two regions are cleared with it. They point at nodes inside the page
  // being replaced, so carrying them into the next render would leave c$ and d$
  // searching a detached subtree — every lookup silently null, on a page that
  // has no regions at all.
  onBeforeRender: () => {
    document.body.classList.remove("gc-full");
    classicRegion = null;
    deckRegion = null;
  },
  async load(ctx) {
    const s = ctx.stageNumber, u = ctx.unitNumber;
    if (isPrereqUnit) {
      const [m, p] = await Promise.all([
        fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
        fetch(new URL("placement-exam.json", ctx.dataRootUrl)),
      ]);
      if (!m.ok || !p.ok) throw new Error("The Computing placement exam could not be loaded.");
      const [prereqManifest, exam] = await Promise.all([m.json(), p.json()]);
      placementExam = exam;
      return { manifest: prereqManifest, course: placementCourseShell(prereqManifest, exam) };
    }
    if (s < 1 || s > STAGE_COUNT || u < 1 || u > 20) throw new Error(`The requested Stage ${s} Computing unit is unavailable.`);
    const [m, c, cap] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${u}.json`, ctx.dataRootUrl)),
      fetch(new URL("grade-capstone.json", ctx.dataRootUrl)),
    ]);
    if (!m.ok || !c.ok || !cap.ok) throw new Error("The Computing course package could not be loaded.");
    const [manifest, course, gradeCapstone] = await Promise.all([m.json(), c.json(), cap.json()]);
    return { manifest, course, gradeCapstone };
  },
  async onReady(ctx) {
    const course = ctx.course, manifest = ctx.manifest, esc = ctx.escapeHtml, s = ctx.stageNumber, u = ctx.unitNumber;
    const stage = course.stage || course.grade;
    if (isPrereqUnit && !["overview", "placement", "teacher"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && location.hash.slice(1) === "placement") location.hash = "overview";
    document.title = `${stage.label} Computing | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    ctx.$("#course-label").textContent = `${stage.label} · ${course.subject} · ${course.term.label}`;
    ctx.$("#unit-title").textContent = course.unit.unitTitle;
    ctx.$("#stage-select").innerHTML = Array.from({ length: STAGE_COUNT }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === s ? "selected" : ""}>Stage ${n}</option>`).join("");
    ctx.$("#stage-select").addEventListener("change", () => { location.href = `?stage=${Number(ctx.$("#stage-select").value)}&unit=1#overview`; });
    const unitOptions = [
      `<option value="${PREREQ_UNIT}" ${isPrereqUnit ? "selected" : ""}>Prerequisite: Placement exam</option>`,
      ...manifest.units.map((unit) => `<option value="${unit.number}" ${unit.number === u ? "selected" : ""}>Unit ${unit.number}: ${esc(unit.title)}</option>`),
    ].join("");
    for (const picker of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) picker.innerHTML = unitOptions;
    for (const picker of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) picker.addEventListener("change", () => { location.href = `?stage=${s}&unit=${Number(picker.value)}#overview`; });
  },
};

createCourseApp(config);
