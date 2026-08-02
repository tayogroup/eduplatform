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
import { createPlacementUnit, placementCallout, placementCourseShell, PREREQ_UNIT } from "../placement.js?v=placement-1";
import { mountWehelChat, outlineFromManifest, unitFetcher } from "../wehel.js?v=wehel-1";

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
let $, $$, escapeHtml, icon, voiceButton, toast;
let complete, saveProgress, navigate, emitProgress;
let bindVoiceControls, updateVoiceUI, renderNav, unitSectionIds, stageNumber;
let course, progress, manifest, dataRootUrl;
function bind(ctx) {
  ({ $, $$, escapeHtml, icon, voiceButton, toast, complete, saveProgress, navigate,
     emitProgress, bindVoiceControls, updateVoiceUI, renderNav, unitSectionIds,
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
  ["lesson", "book-open", "The Lesson", (c) => c.explainers?.length],
  ["bigideas", "lightbulb", "Big Ideas", (c) => c.bigIdeas?.length],
  ["models", "scan-search", "Worked Examples", (c) => c.models?.length],
  ["goals", "target", "My Learning Goals", (c) => c.outcomes?.length],
  ["toolkit", "book-a", "Skills Toolkit", (c) => c.toolkit?.length || c.checklists?.length],
  ["words", "braces", "Skill Words", (c) => c.reference?.vocabulary?.length],
  ["challenge", "flag", "My Challenge", (c) => c.challenge?.intro || c.challenge?.topics?.length],
  ["activities", "blocks", "Activities", (c) => c.activities?.length],
  ["project", "hammer", "Mini-Project", (c) => c.project?.steps?.length],
  ["tutor", "sparkles", "Wehel Tutor", () => true],
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
function richText(value = "", className = "") {
  const attr = className ? ` class="${className}"` : "";
  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p${attr}>${escapeHtml(paragraph)}</p>`)
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
      <div class="concept-body">${richText(explainer.body)}</div>
      ${list(explainer.bullets)}
      ${(explainer.tables || []).map(table).join("")}
      ${explainer.body ? voiceButton(explainer.body, "Listen to this part") : ""}
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

// Delegated events the shell does not provide: the other subjects bind their
// controls inline inside each renderer, but these renderers return strings and
// never touch the DOM, so the handlers live at document level exactly as they
// did before. They read shell-bound values (`complete`, `progress`,
// `saveProgress`) which are undefined at module load and populated by bind()
// long before any of these can fire.
document.addEventListener("click", (event) => {
  const doneTarget = event.target.closest("[data-done]");
  if (!doneTarget) return;
  complete(doneTarget.dataset.done, "Nice work — that section is marked done.");
  doneTarget.disabled = true;
  doneTarget.innerHTML = `${icon("check")} Done`;
});

// Capture phase: `toggle` does not bubble.
document.addEventListener("toggle", (event) => {
  const details = event.target.closest("[data-answer]");
  if (details?.open) {
    const id = details.dataset.answer;
    if (!progress.answersSeen.includes(id)) { progress.answersSeen.push(id); saveProgress(); }
  }
}, true);

document.addEventListener("change", (event) => {
  const reflect = event.target.closest("[data-reflect]");
  if (reflect) { progress.reflection[reflect.dataset.reflect] = reflect.value; saveProgress(); return; }
  const quiz = event.target.closest("[data-quiz]");
  if (quiz) { progress.quiz[quiz.dataset.quiz] = quiz.value; saveProgress(); }
});

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
  visibleSections: () => (isPrereqUnit
    ? [["overview", "layout-dashboard", "Unit Overview"], ["placement", "clipboard-check", "Placement exam"]]
    : availableSections()),
  // Everything available counts toward the bar except the progress page itself
  // — including the overview, which the other subjects exclude. In prereq mode
  // only the exam counts, so finishing it reads as a complete unit.
  nonCountable: isPrereqUnit ? ["overview"] : ["progress"],
  progressDefaults: { completed: [], answersSeen: [], reflection: {}, quiz: {}, aiMessages: [] },
  keys: (s, u) => ({ progress: `ehel-gp-s${s}-u${u}-progress-v1` }),
  courseKey: (s) => `ehel-gp-g${String(s).padStart(2, "0")}`,
  renderers: {
    overview: isPrereqUnit ? () => placement.renderOverview() : paint("overview", renderOverview),
    placement: isPrereqUnit ? () => placement.renderExam() : paint("overview", renderOverview),
    lesson: paint("lesson", renderLesson),
    bigideas: paint("bigideas", () => renderBoxes("bigideas", "bigIdea", course.bigIdeas, "Big Ideas", "Ideas to hold on to", "The few things worth remembering from this unit.")),
    models: paint("models", () => renderBoxes("models", "model", course.models, "Worked Examples", "See the skill in action", "Follow someone else doing it, then do the same with your own topic.")),
    goals: paint("goals", renderGoals),
    toolkit: paint("toolkit", renderToolkit),
    words: paint("words", renderWords),
    challenge: paint("challenge", renderChallenge),
    activities: paint("activities", renderActivities),
    project: paint("project", renderProject),
    tutor: renderTutor,
    practice: paint("practice", renderPractice),
    quiz: paint("quiz", renderQuiz),
    reflect: paint("reflect", renderReflect),
    teacher: paint("teacher", renderTeacher),
    grownup: paint("grownup", renderGrownUp),
    progress: paint("progress", renderProgressPage),
  },
  bind,
  wehelOptions,
  async load(ctx) {
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
    if (isPrereqUnit && !["overview", "placement"].includes(location.hash.slice(1))) location.hash = "overview";
    if (!isPrereqUnit && location.hash.slice(1) === "placement") location.hash = "overview";
    document.title = `${course.unit.unitTitle} · Ehel Academy Global Perspectives`;
    const label = ctx.$("#course-label");
    if (label) label.textContent = `${course.stage.label} · Global Perspectives`;
    const title = ctx.$("#unit-title");
    if (title) title.textContent = course.unit.unitTitle;
    for (const select of [ctx.$("#unit-select"), ctx.$("#top-unit-select")]) {
      if (!select) continue;
      select.innerHTML = [
        `<option value="${PREREQ_UNIT}" ${isPrereqUnit ? "selected" : ""}>Prerequisite — Placement exam</option>`,
        ...manifest.units
          .map((unit) => `<option value="${unit.number}" ${!isPrereqUnit && unit.number === resolvedUnitNo ? "selected" : ""}>Unit ${unit.number} — ${esc(unit.title)}</option>`),
      ].join("");
      select.onchange = () => {
        const url = new URL(location.href);
        url.searchParams.set("unit", select.value);
        url.hash = "overview";
        location.href = url.href;
      };
    }
    const stageSelect = ctx.$("#stage-select");
    if (stageSelect) {
      stageSelect.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8]
        .map((stage) => `<option value="${stage}" ${stage === s ? "selected" : ""}>Stage ${stage}</option>`)
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
