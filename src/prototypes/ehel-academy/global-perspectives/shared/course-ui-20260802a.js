// Ehel Academy Global Perspectives course runtime.
//
// One page serves every stage: grade-N/index.html redirects here with ?stage=N,
// and the unit data is fetched from that stage's data tree. The shape it reads
// is written by tools/build-ehel-global-perspectives-runtime.js and gated by
// tools/check-global-perspectives-content.mjs.
//
// TWO PACK SHAPES, ONE PAGE
// =========================
// Stages 1-3 are guided units (explainers + mini-project + a grown-up's guide);
// Stages 4-8 are self-study units (explainers + toolkit + activities + quiz).
// Rather than branch the whole page, every section declares when it has data
// and the navigation hides the ones this unit does not carry — so a Stage 1
// learner never opens an empty "Skills Toolkit", and a Stage 7 learner is never
// shown a section written for somebody's parent.

import { escapeHtml as sharedEscapeHtml, icon as sharedIcon, sectionNavigation } from "../../shared/course-shell.js?v=20260721a";
import { createProgressClient } from "../../shared/progress-client.js?v=20260722a";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
const stageNumber = Number(params.get("stage") || params.get("grade") || document.documentElement.dataset.stage || 6);
const unitNumber = Number(params.get("unit") || 1);
const stageRootUrl = new URL(`./grade-${stageNumber}/`, location.href);

// Deployed (Bunny): per-unit data lives in its own content tree, edited and
// cached on its own cadence, independent of the versioned app code. Locally it
// sits beside the app under grade-N/data/.
const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
const dataRootUrl = IS_LOCAL_DEV
  ? new URL("data/", stageRootUrl)
  : new URL(`../../content/global-perspectives/g${String(stageNumber).padStart(2, "0")}/`, document.baseURI);

const STORAGE_KEY = `ehel-gp-s${stageNumber}-u${unitNumber}-progress-v1`;
const ELEVENLABS_ENDPOINT = IS_LOCAL_DEV && location.port === "4287"
  ? "/api/elevenlabs-tts"
  : "/local/hubredirect/quiz_tts.php";
const ELEVENLABS_VOICE_ID = "XfNU2rGpBa01ckF309OY";

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
  ["tutor", "sparkles", "Ask Your AI Tutor", (c) => c.tutorPrompts?.length],
  ["practice", "list-checks", "Practice", (c) => c.practice?.length],
  ["quiz", "circle-help", "Unit Quiz", (c) => c.assessment?.questions?.length],
  ["reflect", "messages-square", "Reflection", (c) => c.reflection?.length || c.selfAssessment?.length],
  ["teacher", "video", "Teacher Session", (c) => c.teacherSessions?.length || c.speakingPrompts?.length],
  ["grownup", "users", "For the Grown-Up", (c) => c.grownUpGuide?.sections?.length],
  ["progress", "badge-check", "My Progress", () => true],
];

let course = null;
let manifest = null;
let route = (location.hash || "#overview").slice(1);

const escapeHtml = (value = "") => sharedEscapeHtml(value);
const icon = (name, label = "") => sharedIcon(name, label);

// --- progress ---------------------------------------------------------------
function loadProgress() {
  try {
    return { completed: [], answersSeen: [], reflection: {}, quiz: {}, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { completed: [], answersSeen: [], reflection: {}, quiz: {} };
  }
}
const progress = loadProgress();

const PROGRESS_COURSE = `ehel-gp-g${String(stageNumber).padStart(2, "0")}`;
const PROGRESS_UNIT = `u${String(unitNumber).padStart(2, "0")}`;
const progressWS = createProgressClient({
  course: PROGRESS_COURSE,
  student: params.get("studentid") || "local",
  backend: params.get("pwsEndpoint") ? "remote" : "local",
  endpoint: params.get("pwsEndpoint") || undefined,
  token: params.get("pwsToken") || undefined,
});
// Every emit is wrapped: a progress-service hiccup must never break the lesson.
const emitProgress = (event) => { try { progressWS.emit(event); } catch { /* never break the lesson */ } };

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  updateProgressBar();
  emitProgress({ type: "progress.summary", unit: PROGRESS_UNIT, sectionsDone: [...progress.completed] });
}

function complete(section, message) {
  if (!progress.completed.includes(section)) {
    progress.completed.push(section);
    emitProgress({ type: "section.completed", unit: PROGRESS_UNIT, section });
  }
  saveProgress();
  renderNav();
  if (message) toast(message);
}

function availableSections() {
  return SECTIONS.filter(([, , , hasData]) => Boolean(hasData(course || {})));
}

function updateProgressBar() {
  const all = availableSections().map(([id]) => id).filter((id) => id !== "progress");
  const done = all.filter((id) => progress.completed.includes(id)).length;
  const percent = all.length ? Math.round((done / all.length) * 100) : 0;
  const value = $("#progress-value");
  const fill = $("#progress-fill");
  if (value) value.textContent = `${percent}%`;
  if (fill) fill.style.width = `${percent}%`;
  const track = $(".progress-track");
  if (track) track.setAttribute("aria-valuenow", String(percent));
}

// --- narration --------------------------------------------------------------
// cyrb53 is shared byte-for-byte with tools/lib/ehel-narration-hash.js, so a
// Listen button's exact text maps to a pre-rendered clip. If the two ever
// diverge the app requests a file that was never written, silently falls back
// to the paid runtime endpoint, and the clip is money spent on a file nobody
// serves — which is what check-global-perspectives-audio-coverage.mjs gates.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
const staticVoiceKey = (text) => cyrb53(String(text || "").replace(/\s+/g, " ").trim());
const staticVoiceMisses = new Set();

function staticVoicePath(key) {
  if (IS_LOCAL_DEV) return new URL(`./media/audio/tts/${key}.mp3`, document.baseURI).href;
  const g = String(stageNumber).padStart(2, "0");
  return new URL(`../../media/global-perspectives/g${g}/audio/tts/${key}.mp3`, document.baseURI).href;
}

async function staticVoiceUrl(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const key = staticVoiceKey(clean);
  if (staticVoiceMisses.has(key)) return null;
  const url = staticVoicePath(key);
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) return url;
  } catch { /* fall through to the runtime endpoint */ }
  staticVoiceMisses.add(key);
  return null;
}

const voicePlayer = typeof Audio === "function" ? new Audio() : null;
let speakingButton = null;
let voiceRequestId = 0;
let voiceEnabled = localStorage.getItem(`${STORAGE_KEY}-voice-enabled`) !== "false";

function voiceButton(text, label = "Listen") {
  return `<button class="button secondary voice-button" data-speak="${escapeHtml(text)}" type="button" aria-label="${escapeHtml(label)}">${icon("volume-2")} <span>${escapeHtml(label)}</span></button>`;
}

function stopVoice() {
  voiceRequestId += 1;
  if (voicePlayer) {
    voicePlayer.pause();
    voicePlayer.removeAttribute("src");
    voicePlayer.load();
  }
  if (speakingButton) speakingButton.classList.remove("is-playing");
  speakingButton = null;
}

async function speak(button) {
  const text = button.dataset.speak || "";
  if (!voiceEnabled || !voicePlayer || !text) return;
  if (speakingButton === button) { stopVoice(); return; }
  stopVoice();
  speakingButton = button;
  button.classList.add("is-playing");
  const requestId = voiceRequestId;

  let source = await staticVoiceUrl(text);
  if (!source) {
    try {
      const response = await fetch(ELEVENLABS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: ELEVENLABS_VOICE_ID }),
      });
      if (response.ok) source = URL.createObjectURL(await response.blob());
    } catch { /* leave source null: the page simply does not speak */ }
  }
  if (requestId !== voiceRequestId) return;
  if (!source) { toast("Narration is not available for this line yet."); stopVoice(); return; }
  voicePlayer.src = source;
  voicePlayer.onended = () => { if (requestId === voiceRequestId) stopVoice(); };
  try { await voicePlayer.play(); } catch { stopVoice(); }
}

// --- small render helpers ---------------------------------------------------
function toast(message) {
  const node = $("#toast");
  if (!node) return;
  node.textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2600);
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

const RENDERERS = {
  overview: renderOverview,
  lesson: renderLesson,
  bigideas: () => renderBoxes("bigideas", "bigIdea", course.bigIdeas, "Big Ideas", "Ideas to hold on to", "The few things worth remembering from this unit."),
  models: () => renderBoxes("models", "model", course.models, "Worked Examples", "See the skill in action", "Follow someone else doing it, then do the same with your own topic."),
  goals: renderGoals,
  toolkit: renderToolkit,
  words: renderWords,
  challenge: renderChallenge,
  activities: renderActivities,
  project: renderProject,
  tutor: () => renderBoxes("tutor", "tutor", course.tutorPrompts, "Ask Your AI Tutor", "Your discussion partner", "Your tutor is your partner and your class. Say your ideas out loud, and let it push your thinking further."),
  practice: renderPractice,
  quiz: renderQuiz,
  reflect: renderReflect,
  teacher: renderTeacher,
  grownup: renderGrownUp,
  progress: renderProgressPage,
};

// --- navigation and routing -------------------------------------------------
function renderNav() {
  const nav = $("#section-nav");
  if (!nav || !course) return;
  nav.innerHTML = sectionNavigation(availableSections().map(([id, iconName, label]) => ({
    id, label, iconName,
    active: id === route,
    done: progress.completed.includes(id),
  })));
  if (window.lucide) window.lucide.createIcons();
}

function renderRoute() {
  const available = availableSections().map(([id]) => id);
  if (!available.includes(route)) route = "overview";
  const app = $("#app");
  app.innerHTML = (RENDERERS[route] || renderOverview)();
  app.hidden = false;
  // The design system styles .loading with an explicit display, which wins over
  // the `hidden` attribute — so the spinner has to be removed, not just hidden,
  // or it sits above the lesson for the whole session.
  $("#loading")?.remove();
  renderNav();
  updateProgressBar();
  if (window.lucide) window.lucide.createIcons();
  app.scrollTop = 0;
  emitProgress({ type: "section.opened", unit: PROGRESS_UNIT, section: route });
}

function navigate(next) {
  stopVoice();
  route = next;
  location.hash = next;
  renderRoute();
}

// --- pickers ----------------------------------------------------------------
function renderPickers() {
  const label = $("#course-label");
  if (label) label.textContent = `${course.stage.label} · Global Perspectives`;
  const title = $("#unit-title");
  if (title) title.textContent = course.unit.unitTitle;

  for (const select of [$("#unit-select"), $("#top-unit-select")]) {
    if (!select) continue;
    select.innerHTML = manifest.units
      .map((unit) => `<option value="${unit.number}" ${unit.number === unitNumber ? "selected" : ""}>Unit ${unit.number} — ${escapeHtml(unit.title)}</option>`)
      .join("");
    select.onchange = () => {
      const url = new URL(location.href);
      url.searchParams.set("unit", select.value);
      url.hash = "overview";
      location.href = url.href;
    };
  }
  const stageSelect = $("#stage-select");
  if (stageSelect) {
    stageSelect.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8]
      .map((stage) => `<option value="${stage}" ${stage === stageNumber ? "selected" : ""}>Stage ${stage}</option>`)
      .join("");
    stageSelect.onchange = () => {
      const url = new URL(location.href);
      url.searchParams.set("stage", stageSelect.value);
      url.searchParams.set("unit", "1");
      url.hash = "overview";
      location.href = url.href;
    };
  }
}

// --- events -----------------------------------------------------------------
document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-route]");
  if (navButton) { navigate(navButton.dataset.route); return; }

  const doneTarget = event.target.closest("[data-done]");
  if (doneTarget) {
    complete(doneTarget.dataset.done, "Nice work — that section is marked done.");
    doneTarget.disabled = true;
    doneTarget.innerHTML = `${icon("check")} Done`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const voice = event.target.closest(".voice-button");
  if (voice) { speak(voice); return; }

  const toggle = event.target.closest("#voice-toggle");
  if (toggle) {
    voiceEnabled = !voiceEnabled;
    localStorage.setItem(`${STORAGE_KEY}-voice-enabled`, String(voiceEnabled));
    if (!voiceEnabled) stopVoice();
    toast(voiceEnabled ? "Narration on" : "Narration off");
  }
});

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

window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (next && next !== route) { route = next; renderRoute(); }
});

// --- boot -------------------------------------------------------------------
async function boot() {
  try {
    manifest = await (await fetch(new URL("course-manifest.json", dataRootUrl))).json();
    const entry = manifest.units.find((unit) => unit.number === unitNumber) || manifest.units[0];
    course = await (await fetch(new URL(`units/unit-${entry.number}.json`, dataRootUrl))).json();
  } catch (error) {
    $("#loading").innerHTML = `<div class="panel review-banner"><h2>This unit could not be loaded</h2><p>${escapeHtml(String(error.message || error))}</p><p>Run <code>npm run build:global-perspectives</code>, then reload.</p></div>`;
    return;
  }
  document.title = `${course.unit.unitTitle} · Ehel Academy Global Perspectives`;
  renderPickers();
  renderRoute();
  emitProgress({ type: "unit.opened", unit: PROGRESS_UNIT });
}

boot();
