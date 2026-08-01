// Ehel Intensive English — subject module for the unified course-app shell.
//
// Modelled on Grade 1 English for design and style: one idea per screen, audio
// on every line, and grammar as a full-screen pattern carousel. That is a
// deliberate choice for adult beginners with low print literacy.
//
// Two properties shape every renderer here:
//
//   * It teaches itself. There is no teacher, so everything a teacher supplies
//     is in the app: a worked example on every pattern card before the practice,
//     an answer key on every exercise, and an Answers section that gathers them
//     all in one place. Nothing is teacher-only.
//   * It is monolingual and language-neutral. English is the teaching language.
//     The course never names or assumes a first language, so there is no gloss
//     layer and no L1 comparison anywhere in the UI.
//
// The stage axis is a CEFR LEVEL, not a grade — config.stageDir maps it to
// level-N/ folders — and outcomes carry both frameworks, with the CEFR band
// shown wherever a claim is made about what the learner can do.
import { escapeHtml as sharedEscapeHtml, icon as sharedIcon } from "../../shared/course-shell.js?v=20260721a";
import { createCourseApp } from "../course-app.js?v=t2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const routeParams = new URLSearchParams(location.search);
const requestedLevel = Number(routeParams.get("level") || document.documentElement.dataset.level || 1);
const levelNumber = requestedLevel >= 1 && requestedLevel <= 5 ? requestedLevel : 1;
const defaultUnit = levelNumber === 1 ? 0 : 1;
const requestedUnit = Number(routeParams.get("unit") ?? defaultUnit);
const unitNumber = Number.isFinite(requestedUnit) && requestedUnit >= 0 ? requestedUnit : defaultUnit;

const STORAGE_KEY = `ehel-intensive-l${levelNumber}-u${unitNumber}-progress-v1`;
const NARRATION_RATE = 0.9;

const sections = [
  ["overview", "layout-dashboard", "Overview"],
  ["lecture", "play-square", "The lesson"],
  ["dictionary", "book-a", "Words"],
  ["grammar", "braces", "Patterns"],
  ["reading", "book-open", "Reading"],
  ["comprehension", "list-checks", "Comprehension"],
  ["speaking", "mic-2", "Speaking"],
  ["writing", "pencil-line", "Writing"],
  ["activities", "shapes", "Practice"],
  ["quiz", "badge-check", "Quiz"],
  ["answers", "list-checks", "Answers"],
  ["reflect", "sparkles", "My progress"],
];

let manifest, course, dictionary;
let route = "overview";
let activeWordId = null;
let activeSentence = 0;
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let mediaRecorder = null;
let activeRecordingId = null;
let recordedChunks = [];
const recordings = new Map();

let progress, complete, saveProgress, navigate, renderNav, emitProgress, voiceButton, toast, pageHeader, PROGRESS_UNIT;
let shellCtx;
function bind(ctx) {
  ({ complete, saveProgress, navigate, renderNav, emitProgress, voiceButton, toast, pageHeader, PROGRESS_UNIT } = ctx);
  progress = ctx.progress;
  shellCtx = ctx;
}

const escapeHtml = (value = "") => sharedEscapeHtml(value);
const icon = (name, label = "") => sharedIcon(name, label);
function icons() { if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } }); }


const cefrChip = (band) => `<span class="cefr-chip ${String(band || "").toLowerCase().replace("+", "-plus")}">CEFR ${escapeHtml(band || "")}</span>`;

function levelLocation(next) {
  const url = new URL(location.href);
  url.searchParams.set("level", next);
  url.searchParams.set("unit", Number(next) === 1 ? 0 : 1);
  url.hash = "overview";
  return url.href;
}
function unitLocation(next) {
  const url = new URL(location.href);
  url.searchParams.set("level", levelNumber);
  url.searchParams.set("unit", next);
  url.hash = "overview";
  return url.href;
}

function visibleSections() {
  return sections.filter(([id]) => {
    if (id === "reading") return Boolean(course?.readings?.length);
    if (id === "comprehension") return Boolean(course?.comprehension?.length);
    return true;
  });
}

// ===================== renderers =====================

function renderOverview() {
  const path = String(course.unit.learningPath || "").split("\n").filter(Boolean);
  const skills = course.unit.cefr.skills || [];
  $("#app").innerHTML = `${pageHeader(`${course.level.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, String(course.unit.unitOverview).split(". ").slice(0, 2).join(". "))}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner ien-banner">
          <div class="banner-copy">
            <span>${escapeHtml(course.course)}</span>
            <h2>${escapeHtml(course.unit.unitTitle)}</h2>
            <p>${escapeHtml(String(course.unit.unitOverview).split(". ").slice(0, 2).join(". "))}</p>
            <button class="button gold" data-go="lecture" type="button">${icon("play")} Start</button>
          </div>
        </section>
        <section class="panel">
          <p>${cefrChip(course.unit.cefr.band)} ${skills.map((skill) => `<span class="status-chip">${escapeHtml(skill)}</span>`).join(" ")}</p>
          <h2>By the end of this unit</h2>
          <ul class="cando">${course.outcomes.map((outcome) => `<li>${escapeHtml(outcome.cefr.descriptor || outcome.learningOutcome)}<small>${escapeHtml(outcome.learningOutcome)}</small></li>`).join("")}</ul>
        </section>
        <section class="panel"><h2>What this unit covers</h2><p>${escapeHtml(course.unit.unitOverview)}</p></section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">Two frameworks</span><h3>${escapeHtml(course.level.label)}</h3><p>Targets CEFR <strong>${escapeHtml(course.unit.cefr.band)}</strong>. Language content compressed from ${escapeHtml(course.unit.sourceFile || "the school course")}, carrying ${course.frameworks.cambridge.codes.length} Cambridge objectives from stage ${course.frameworks.cambridge.stages.join(", ")}. AI-assisted authoring — curriculum sign-off pending.</p></section>
        <section class="panel"><h3>This unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.dictionaryLinks.length}</strong><small>words</small></div><div class="stat"><strong>${course.grammar.length}</strong><small>patterns</small></div><div class="stat"><strong>${course.quizzes.length}</strong><small>quiz items</small></div></div></section>
        <section class="panel"><h3>How to work through it</h3><ol class="path-list">${path.map((item) => `<li>${icon("circle-check-big")}<span>${escapeHtml(item)}</span></li>`).join("")}</ol></section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have finished ${progress.completed.length} sections.` : "Your progress saves on this device."}</p><button class="button primary" data-go="${progress.completed.includes("lecture") ? "dictionary" : "lecture"}" type="button">Continue ${icon("arrow-right")}</button></section>
      </div>
    </div>`;
  $$("[data-go]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

function renderLecture() {
  const script = course.visual?.lectureScript || "";
  $("#app").innerHTML = `${pageHeader("Begin here", "The lesson", "Read it and listen to it. This explains all six — everything else in the unit practises what is here.", "Audio pending")}
    <div class="lecture-layout">
      <section class="panel">
        <h2>${escapeHtml(course.unit.unitTitle)}</h2>
        ${script ? `<div class="audio-actions">${voiceButton(script, "Listen to the lecture")}</div><div class="reading-text">${script.split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>` : `<p>${escapeHtml(course.unit.unitOverview)}</p>`}
        <p><button class="button gold" id="lecture-done" type="button">${icon("check")} I have read and listened</button></p>
      </section>
      <div class="section-stack">
        <section class="panel"><span class="eyebrow">How to use this</span><h2>Out loud, not silently</h2><ol class="path-list"><li>${icon("ear")}<span>Listen once without reading.</span></li><li>${icon("book-open")}<span>Read it while you listen again.</span></li><li>${icon("message-circle")}<span>Read it aloud yourself.</span></li><li>${icon("pencil")}<span>Record yourself and listen back.</span></li></ol></section>
        <section class="panel"><h3>Then start with the words</h3><button class="button primary" id="to-dictionary" type="button">Open the word list ${icon("arrow-right")}</button></section>
      </div>
    </div>`;
  $("#lecture-done").addEventListener("click", () => complete("lecture", "Lecture done. Your word list is ready."));
  $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
  shellCtx.bindVoiceControls();
}

function renderDictionary() {
  const words = course.dictionaryLinks;
  if (!words.some((word) => word.vocabularyId === activeWordId)) activeWordId = words[0].vocabularyId;
  $("#app").innerHTML = `${pageHeader("Words", "Word list", `${words.length} words for this unit, grouped by the sound or the job they do.`, `${dictionary.entryCount} entries in this level`)}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search" aria-label="Search words"></label><select id="group-filter" aria-label="Filter group"><option value="all">All groups</option>${course.vocabularyGroups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.title)}</option>`).join("")}</select><span id="dictionary-count" class="status-chip">${words.length} words</span></div>
    <div class="dictionary-layout"><section class="panel word-list" id="word-list"></section><section class="panel word-card" id="word-card"></section></div>`;

  const drawList = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    const filtered = words.filter((item) => (group === "all" || item.groupId === group)
      && (!query || `${item.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    $("#dictionary-count").textContent = `${filtered.length} words`;
    $("#word-list").innerHTML = filtered.length
      ? filtered.map((item) => `<button class="word-row ${item.vocabularyId === activeWordId ? "active" : ""}" data-word="${escapeHtml(item.vocabularyId)}" type="button"><span><strong>${escapeHtml(item.displayWord)}</strong><small>${escapeHtml(item.groupTitle)}</small></span>${progress.knownWords.includes(item.vocabularyId) ? "<span>LEARNED</span>" : ""}</button>`).join("")
      : `<div class="empty">No matching words.</div>`;
    $$("[data-word]").forEach((button) => button.addEventListener("click", () => { activeWordId = button.dataset.word; activeSentence = 0; drawList(); drawWord(); }));
  };

  const drawWord = () => {
    const item = words.find((word) => word.vocabularyId === activeWordId) || words[0];
    const sentences = item.practiceSentences.length ? item.practiceSentences : [item.exampleSentence];
    if (activeSentence >= sentences.length) activeSentence = 0;
    $("#word-card").innerHTML = `
      <div class="word-card-head">
        <div><span class="word-type">${escapeHtml(item.partOfSpeech)}</span><h2>${escapeHtml(item.displayWord)}</h2></div>
        <div class="audio-actions">${voiceButton(item.displayWord, `Listen to ${item.displayWord}`)}</div>
      </div>
      <p class="meaning"><strong>Meaning:</strong> ${escapeHtml(item.childMeaning)}</p>
      <p><strong>Spelling:</strong> ${escapeHtml(item.spellingPractice)}</p>
      <div class="sentence-card">
        <small>In a sentence · ${activeSentence + 1} of ${sentences.length}</small>
        <p>${escapeHtml(sentences[activeSentence])}</p>
        <div class="sentence-controls">
          <button class="icon-button" id="previous-sentence" type="button" aria-label="Previous">${icon("arrow-left")}</button>
          <div class="sentence-dots">${sentences.map((_, index) => `<button class="sentence-dot ${index === activeSentence ? "active" : ""}" data-sentence="${index}" type="button" aria-label="Sentence ${index + 1}"></button>`).join("")}</div>
          ${voiceButton(sentences[activeSentence], "Hear this sentence")}
          <button class="icon-button" id="next-sentence" type="button" aria-label="Next">${icon("arrow-right")}</button>
        </div>
      </div>
      <div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="${escapeHtml(item.sentenceStarter || "")}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check</button></div>
      <div id="word-feedback" role="status" aria-live="polite"></div>
      <details><summary>Practise this word with the tutor</summary><p class="rule-box">${escapeHtml(item.aiTutorPrompt)}</p></details>
      <button class="button secondary" id="know-word" type="button">${progress.knownWords.includes(item.vocabularyId) ? `${icon("check-circle")} Learned` : `${icon("bookmark-plus")} I know this word`}</button>`;
    $("#previous-sentence").addEventListener("click", () => { activeSentence = (activeSentence - 1 + sentences.length) % sentences.length; drawWord(); });
    $("#next-sentence").addEventListener("click", () => { activeSentence = (activeSentence + 1) % sentences.length; drawWord(); });
    $$("[data-sentence]").forEach((dot) => dot.addEventListener("click", () => { activeSentence = Number(dot.dataset.sentence); drawWord(); }));
    $("#check-word-sentence").addEventListener("click", () => {
      const value = $("#word-sentence").value.trim();
      const usesWord = value.toLowerCase().includes(String(item.displayWord).toLowerCase());
      const complete_ = value.split(/\s+/).filter(Boolean).length >= 3 && /[.!?]$/.test(value);
      $("#word-feedback").innerHTML = `<p class="feedback ${usesWord && complete_ ? "good" : "try"}">${usesWord && complete_
        ? `Good — you used <strong>${escapeHtml(item.displayWord)}</strong> in a full sentence.`
        : `Write a full sentence using <strong>${escapeHtml(item.displayWord)}</strong>, and end it with a full stop.`}</p>`;
    });
    $("#know-word").addEventListener("click", () => {
      if (!progress.knownWords.includes(item.vocabularyId)) progress.knownWords.push(item.vocabularyId);
      if (progress.knownWords.length >= Math.ceil(words.length * 0.8)) complete("dictionary", "Word list complete.");
      else saveProgress();
      drawList(); drawWord();
    });
    shellCtx.bindVoiceControls();
    icons();
  };

  $("#word-search").addEventListener("input", drawList);
  $("#group-filter").addEventListener("change", drawList);
  drawList();
  drawWord();
}

// --- grammar: the Grade 1 full-screen carousel ------------------------------
const SLIDE_VARIANTS = 5;
function renderGrammar() {
  const lessons = course.grammar;
  const slides = lessons.map((lesson, index) => `
    <section class="gc-slide gc-v${index % SLIDE_VARIANTS}"><div class="gc-inner">
      <span class="gc-eyebrow">Pattern ${lesson.sequence} of ${lessons.length} · ${escapeHtml(lesson.practiceType)}</span>
      <h3 class="gc-title">${escapeHtml(lesson.title)}</h3>
      <p class="gc-lead">${escapeHtml(lesson.explanation)}</p>
      ${lesson.ruleAndExamples ? `<div class="gc-pattern">${escapeHtml(lesson.ruleAndExamples).replace(/\n/g, "<br>")}</div>` : ""}
      <div class="gc-actions">${voiceButton(`${lesson.title}. ${lesson.explanation}`, "Hear it")}</div>
      ${lesson.commonMistake ? `<p class="gc-note gc-mistake">${escapeHtml(lesson.commonMistake)}</p>` : ""}
      ${lesson.memoryTip ? `<p class="gc-note"><strong>Remember:</strong> ${escapeHtml(lesson.memoryTip)}</p>` : ""}
      ${lesson.workedExample ? `<div class="worked"><span class="worked-label">Worked example</span>${escapeHtml(lesson.workedExample).replace(/\n/g, "<br>")}</div>` : ""}
      ${lesson.practice ? `<details class="gc-practice"><summary>Now you try</summary><p class="gc-note gc-try">${escapeHtml(lesson.practice).replace(/\n/g, "<br>")}</p>${lesson.answerKey ? `<details><summary>Check yourself</summary><p class="gc-note">${escapeHtml(lesson.answerKey).replace(/\n/g, "<br>")}</p></details>` : ""}</details>` : ""}
      ${index === lessons.length - 1 ? `<button class="gc-btn done" id="grammar-done" type="button">${icon("check")} I practised every pattern</button>` : ""}
    </div></section>`).join("");

  $("#app").innerHTML = `
    <div class="gc-wrap">
      <div class="gc-top"><h2 class="gc-heading">Patterns</h2><span class="gc-count" id="gc-count">Pattern 1 of ${lessons.length}</span></div>
      <div class="gc-carousel">
        <button class="gc-arrow prev" type="button" aria-label="Previous pattern">${icon("chevron-left")}</button>
        <div class="gc-viewport"><div class="gc-track">${slides}</div></div>
        <button class="gc-arrow next" type="button" aria-label="Next pattern">${icon("chevron-right")}</button>
      </div>
      <div class="gc-dots">${lessons.map((_, index) => `<button class="gc-dot" type="button" data-dot="${index}" aria-label="Pattern ${index + 1}"></button>`).join("")}</div>
    </div>`;
  document.body.classList.add("gc-full");

  const track = $(".gc-track");
  const dots = $$("[data-dot]");
  const previous = $(".gc-arrow.prev");
  const next = $(".gc-arrow.next");
  let slide = 0;
  const goTo = (n) => {
    slide = Math.max(0, Math.min(lessons.length - 1, n));
    track.style.transform = `translateX(-${slide * 100}%)`;
    dots.forEach((dot, index) => dot.classList.toggle("active", index === slide));
    previous.disabled = slide === 0;
    next.disabled = slide === lessons.length - 1;
    $("#gc-count").textContent = `Pattern ${slide + 1} of ${lessons.length}`;
    if (slide === lessons.length - 1 && !progress.completed.includes("grammar")) complete("grammar", "Patterns complete.");
  };
  previous.addEventListener("click", () => goTo(slide - 1));
  next.addEventListener("click", () => goTo(slide + 1));
  dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.dot))));
  $("#grammar-done")?.addEventListener("click", () => complete("grammar", "Patterns complete."));
  const viewport = $(".gc-viewport");
  let startX = null;
  viewport.addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
  viewport.addEventListener("touchend", (event) => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 45) goTo(slide + (delta < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
  shellCtx.bindVoiceControls();
  goTo(0);
}

function renderReading() {
  let selected = course.readings[0].readingId;
  $("#app").innerHTML = `${pageHeader("Reading", "Texts", "Read each one aloud, not silently. One of them is a real document you will have to fill in.")}<div class="reading-layout ebook-layout"><nav class="reading-list ebook-library" id="reading-list" aria-label="Texts"></nav><article class="ebook-reader" id="reading-panel"></article></div>`;
  const draw = () => {
    const reading = course.readings.find((item) => item.readingId === selected);
    const index = course.readings.findIndex((item) => item.readingId === selected);
    $("#reading-list").innerHTML = `<div class="ebook-library-title"><span>${icon("library-big")}</span><div><strong>Texts</strong><small>${course.readings.length} in this unit</small></div></div>${course.readings.map((item, n) => `<button class="reading-button ebook-spine ${selected === item.readingId ? "active" : ""}" data-reading="${escapeHtml(item.readingId)}" type="button"><span>${n + 1}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.documentType || item.type)}</small></div>${icon("chevron-right")}</button>`).join("")}`;
    const isDocument = Boolean(reading.documentType);
    $("#reading-panel").innerHTML = `
      <header class="ebook-toolbar"><div><span class="ebook-count">Text ${index + 1} of ${course.readings.length}</span><span>${String(reading.passageScript).trim().split(/\s+/).length} words</span></div><div class="audio-actions">${voiceButton(reading.passageScript, `Listen to ${reading.title}`)}</div></header>
      <section class="ebook-page">
        <div class="ebook-page-heading"><span>${icon("bookmark")}</span><div><small>${escapeHtml(reading.type)}</small><h2>${escapeHtml(reading.title)}</h2></div></div>
        ${isDocument
          ? `<p><span class="document-label">${icon("bookmark")} ${escapeHtml(reading.documentType)}</span></p><pre class="document">${escapeHtml(reading.passageScript)}</pre>`
          : `<div class="reading-text ebook-copy">${String(reading.passageScript).split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`}
      </section>
      <footer class="ebook-footer">
        <button class="button secondary" data-step="-1" type="button" ${index === 0 ? "disabled" : ""}>${icon("arrow-left")} Previous</button>
        <button class="button primary" id="reading-done" type="button">I read it aloud ${icon("check")}</button>
        <button class="button secondary" data-step="1" type="button" ${index === course.readings.length - 1 ? "disabled" : ""}>Next ${icon("arrow-right")}</button>
      </footer>`;
    $$("[data-reading]").forEach((button) => button.addEventListener("click", () => { selected = button.dataset.reading; draw(); }));
    $$("[data-step]").forEach((button) => button.addEventListener("click", () => {
      const target = course.readings[index + Number(button.dataset.step)];
      if (target) { selected = target.readingId; draw(); }
    }));
    $("#reading-done").addEventListener("click", () => complete("reading", `${reading.title} marked as read.`));
    shellCtx.bindVoiceControls();
    icons();
  };
  draw();
}

function renderComprehension() {
  const groups = [...new Set(course.comprehension.map((question) => question.section))];
  let active = groups[0];
  const draw = () => {
    const questions = course.comprehension.filter((question) => question.section === active);
    $("#app").innerHTML = `${pageHeader("Comprehension", "Questions", "Write your answer first, then check the reviewed answer.")}
      <div class="subtabs">${groups.map((group) => `<button class="subtab ${group === active ? "active" : ""}" data-group="${escapeHtml(group)}" type="button">${escapeHtml(group)}</button>`).join("")}</div>
      <section class="panel"><div class="question-list">${questions.map((question) => `<div class="question"><label for="answer-${escapeHtml(question.questionId)}">${question.sequence}. ${escapeHtml(question.question)}</label><textarea id="answer-${escapeHtml(question.questionId)}" placeholder="Write your answer…"></textarea><button class="button secondary" data-check="${escapeHtml(question.questionId)}" type="button">Check</button><div id="feedback-${escapeHtml(question.questionId)}" role="status" aria-live="polite"></div></div>`).join("")}</div><button class="button primary" id="comprehension-done" type="button">Finish ${icon("check")}</button></section>`;
    $$("[data-group]").forEach((button) => button.addEventListener("click", () => { active = button.dataset.group; draw(); }));
    $$("[data-check]").forEach((button) => button.addEventListener("click", () => {
      const question = course.comprehension.find((item) => item.questionId === button.dataset.check);
      const value = $(`#answer-${CSS.escape(question.questionId)}`).value.trim();
      $(`#feedback-${CSS.escape(question.questionId)}`).innerHTML = value.length < 3
        ? `<p class="feedback try">Write your own answer first.</p>`
        : `<p class="feedback good"><strong>Answer:</strong> ${escapeHtml(question.correctAnswer)}<br><small>${escapeHtml(question.explanation)}</small></p>`;
    }));
    $("#comprehension-done").addEventListener("click", () => complete("comprehension", "Comprehension complete."));
    icons();
  };
  draw();
}

function renderSpeaking() {
  $("#app").innerHTML = `${pageHeader("Speaking", "Say it out loud", "Record yourself and listen back. Hearing your own voice is the fastest correction there is.")}
    <div class="task-grid">${course.speaking.map((task) => `
      <article class="panel task-card">
        <span class="eyebrow">${task.sequence} · ${escapeHtml(task.activityType)}</span>
        <h3>${escapeHtml(task.title)}</h3>
        <p class="rule-box">${escapeHtml(task.instructionsAndModelLines).replace(/\n/g, "<br>")}</p>
        
        <div class="audio-actions">${voiceButton(task.instructionsAndModelLines, `Hear ${task.title}`)}</div>
        ${task.recordingRequired ? `<div class="recorder"><button class="record-button" data-record="${escapeHtml(task.speakingId)}" type="button" aria-label="Record">${icon("mic")}</button><div><strong data-record-status="${escapeHtml(task.speakingId)}">Ready to record</strong><small> Stays on this device.</small></div></div><audio data-playback="${escapeHtml(task.speakingId)}" controls hidden></audio>` : ""}
      </article>`).join("")}</div>
    <p><button class="button primary" id="speaking-done" type="button">Finish speaking ${icon("check")}</button></p>`;
  $$("[data-record]").forEach((button) => button.addEventListener("click", () => toggleRecording(button.dataset.record, button)));
  $("#speaking-done").addEventListener("click", () => complete("speaking", "Speaking complete."));
  shellCtx.bindVoiceControls();
}

async function toggleRecording(taskId, button) {
  if (mediaRecorder?.state === "recording") { mediaRecorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Recording is not supported in this browser.");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeRecordingId = taskId;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => { if (event.data.size) recordedChunks.push(event.data); });
    mediaRecorder.addEventListener("stop", () => {
      const audio = $(`[data-playback="${CSS.escape(activeRecordingId)}"]`);
      const previous = recordings.get(activeRecordingId);
      if (previous?.url) URL.revokeObjectURL(previous.url);
      const url = URL.createObjectURL(new Blob(recordedChunks, { type: mediaRecorder.mimeType }));
      recordings.set(activeRecordingId, { url });
      if (audio) { audio.src = url; audio.hidden = false; }
      const status = $(`[data-record-status="${CSS.escape(activeRecordingId)}"]`);
      if (status) status.textContent = "Recording ready. Listen back.";
      const active = $(`[data-record="${CSS.escape(activeRecordingId)}"]`);
      if (active) { active.classList.remove("recording"); active.innerHTML = icon("mic"); }
      stream.getTracks().forEach((track) => track.stop());
      icons();
    });
    mediaRecorder.start();
    const status = $(`[data-record-status="${CSS.escape(taskId)}"]`);
    if (status) status.textContent = "Recording… tap to stop";
    button.classList.add("recording");
    button.innerHTML = icon("square");
    icons();
  } catch { toast("Microphone permission is needed to record."); }
}

function renderWriting() {
  let active = course.writing[0].writingId;
  const draw = () => {
    const task = course.writing.find((item) => item.writingId === active);
    const saved = progress.writing[active] || "";
    $("#app").innerHTML = `${pageHeader("Writing", "Write it down", "Your draft saves on this device as you type.")}
      <div class="subtabs">${course.writing.map((item) => `<button class="subtab ${active === item.writingId ? "active" : ""}" data-writing="${escapeHtml(item.writingId)}" type="button">${item.sequence}</button>`).join("")}</div>
      <div class="task-grid">
        <section class="panel"><h2>${escapeHtml(task.title)}</h2><p class="rule-box">${escapeHtml(task.promptAndInstructions).replace(/\n/g, "<br>")}</p><details><summary>See a model</summary><pre class="document">${escapeHtml(task.modelText)}</pre></details><p><strong>Expected:</strong> ${escapeHtml(task.expectedLength)}</p><textarea id="writing-draft" placeholder="${escapeHtml(task.sentenceStarter || "")}">${escapeHtml(saved)}</textarea><p id="save-status"><small>${saved ? "Draft restored" : "Start when you are ready"}</small></p></section>
        <aside class="panel"><h3>Check your work</h3><ul class="checklist">${String(task.successCriteria).split(";").map((criterion, index) => `<li><label><input type="checkbox" data-check="${index}"><span>${escapeHtml(criterion.trim())}</span></label></li>`).join("")}</ul><h3>If you are stuck</h3><p>${escapeHtml(task.support)}</p><h3>Go further</h3><p>${escapeHtml(task.extension)}</p><button class="button primary" id="writing-done" type="button">Submit ${icon("send")}</button></aside>
      </div>`;
    $$("[data-writing]").forEach((button) => button.addEventListener("click", () => { active = button.dataset.writing; draw(); }));
    let timer;
    $("#writing-draft").addEventListener("input", (event) => {
      clearTimeout(timer);
      $("#save-status").innerHTML = "<small>Saving…</small>";
      timer = setTimeout(() => {
        progress.writing[active] = event.target.value;
        saveProgress();
        emitProgress({ type: "draft.saved", unit: PROGRESS_UNIT, section: `writing:${active}`, text: event.target.value, words: event.target.value.trim().split(/\s+/).filter(Boolean).length });
        $("#save-status").innerHTML = "<small>Draft saved</small>";
      }, 350);
    });
    $("#writing-done").addEventListener("click", () => {
      const draft = $("#writing-draft").value.trim();
      if (draft.split(/\s+/).filter(Boolean).length < 5) return toast("Write a little more before submitting.");
      progress.writing[active] = draft;
      complete("writing", "Draft saved.");
    });
    icons();
  };
  draw();
}

function renderActivities() {
  $("#app").innerHTML = `${pageHeader("Practice", "Practice", `${course.activities.length} things to do, most of them out loud.`)}
    <div class="task-grid">${course.activities.map((activity) => `<article class="panel task-card"><span class="eyebrow">${activity.sequence} · ${escapeHtml(activity.activityType)}</span><h3>${escapeHtml(activity.title)}</h3><p class="rule-box">${escapeHtml(activity.instructionsAndItems).replace(/\n/g, "<br>")}</p><textarea rows="3" placeholder="Your answers…" aria-label="Response for ${escapeHtml(activity.title)}"></textarea>${activity.answerSummary ? `<details><summary>Check yourself</summary><p class="rule-box">${escapeHtml(activity.answerSummary)}</p></details>` : ""}</article>`).join("")}</div>
    <p><button class="button primary" id="activities-done" type="button">Finish practice ${icon("check")}</button></p>`;
  $("#activities-done").addEventListener("click", () => complete("activities", "Practice complete."));
}

function renderQuiz() {
  quizIndex = 0; quizScore = 0; quizLocked = false;
  $("#app").innerHTML = `${pageHeader("Quiz", "Check what you know", `${course.quizzes.length} questions. You can try again.`)}<section class="panel quiz-shell" id="quiz-shell"></section>`;
  drawQuizQuestion();
}

function drawQuizQuestion() {
  const shell = $("#quiz-shell");
  if (quizIndex >= course.quizzes.length) {
    const percent = Math.round((quizScore / course.quizzes.length) * 100);
    emitProgress({ type: "checkpoint.result", unit: PROGRESS_UNIT, section: "quiz", score: percent, passed: percent >= 60, attempt: 1 });
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${quizScore}/${course.quizzes.length}</div><h2>${percent >= 80 ? "Well done." : "Good effort — go back and try again."}</h2><p>You scored ${percent}%.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="quiz-done" type="button">Continue ${icon("arrow-right")}</button></div></div>`;
    $("#retry-quiz").addEventListener("click", renderQuiz);
    $("#quiz-done").addEventListener("click", () => { if (percent >= 60) complete("quiz"); navigate("reflect"); });
    if (percent >= 60) complete("quiz", "Quiz passed.");
    icons();
    return;
  }
  const question = course.quizzes[quizIndex];
  const options = String(question.options).split(" | ");
  shell.innerHTML = `<div class="quiz-top"><span>Question ${quizIndex + 1} of ${course.quizzes.length}</span><strong>${quizScore} correct</strong></div><div class="progress-track"><span style="width:${(quizIndex / course.quizzes.length) * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(question.question)}</h2><div class="quiz-options">${options.map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback" role="status" aria-live="polite"></div><button class="button primary" id="next-quiz" type="button" hidden>Next ${icon("arrow-right")}</button>`;
  quizLocked = false;
  $$("[data-option]").forEach((button) => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.option === String(question.correctAnswer);
    if (correct) quizScore += 1;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$("[data-option]").find((option) => option.dataset.option === String(question.correctAnswer))?.classList.add("correct");
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><strong>${correct ? "Correct." : "Not quite."}</strong> ${escapeHtml(question.explanation)}</p>`;
    $("#next-quiz").hidden = false;
    $("#next-quiz").addEventListener("click", () => { quizIndex += 1; drawQuizQuestion(); });
  }));
  icons();
}

/** Every answer in the unit, in one place.
 *
 *  In a taught course this lives in the teacher's book. Here the learner is the
 *  only person who can mark their work, so withholding it would simply mean
 *  nobody ever finds out. It is grouped by where the exercise was, and each
 *  group stays folded until asked for, so opening this page does not spoil an
 *  exercise the learner has not reached. */
function renderAnswers() {
  const groups = [
    ["Patterns", course.grammar.filter((item) => item.answerKey).map((item) => ({ title: item.title, body: item.answerKey }))],
    ["Practice", course.activities.filter((item) => item.answerSummary).map((item) => ({ title: item.title, body: item.answerSummary }))],
    ["Comprehension", course.comprehension.map((item) => ({ title: `${item.section} · ${item.question}`, body: `${item.correctAnswer}\n\n${item.explanation}` }))],
    ["Quiz", course.quizzes.map((item) => ({ title: item.question, body: `${item.correctAnswer}\n\n${item.explanation}` }))],
  ].filter(([, items]) => items.length);

  $("#app").innerHTML = `${pageHeader("Answers", "Every answer, explained", "Nothing here is hidden from you. Try the exercise first — then open the section and check, and read why.")}
    <section class="panel"><p>${icon("lightbulb")} <strong>Use this after you try, not instead of trying.</strong> An answer you read before attempting teaches you nothing, and there is nobody else here to tell the difference.</p></section>
    <div class="section-stack">${groups.map(([label, items]) => `
      <section class="panel">
        <h2>${escapeHtml(label)}</h2>
        ${items.map((item) => `<details class="answer-entry"><summary>${escapeHtml(item.title)}</summary><p class="rule-box">${escapeHtml(item.body).replace(/\n/g, "<br>")}</p></details>`).join("")}
      </section>`).join("")}</div>`;
  icons();
}

function renderReflect() {
  $("#app").innerHTML = `${pageHeader("My progress", "What can you do now?", "Answer honestly. Nobody else sees this — it is here so you can see what has moved and what has not.")}
    <div class="toolbar">${cefrChip(course.unit.cefr.band)}</div>
    <section class="panel"><div class="self-list">${course.selfAssessment.map((item) => `<div class="self-row"><strong>${escapeHtml(item.statement)}</strong>${String(item.scale).split(" | ").map((choice) => `<button class="self-choice ${progress.self[item.selfAssessmentId] === choice ? "selected" : ""}" data-self="${escapeHtml(item.selfAssessmentId)}" data-choice="${escapeHtml(choice)}" type="button">${escapeHtml(choice)}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="reflection-done" type="button">Save ${icon("check")}</button></p></section>`;
  $$("[data-self]").forEach((button) => button.addEventListener("click", () => { progress.self[button.dataset.self] = button.dataset.choice; saveProgress(); renderReflect(); }));
  $("#reflection-done").addEventListener("click", () => {
    if (Object.keys(progress.self).length < course.selfAssessment.length) return toast("Answer every statement.");
    complete("reflect", "Saved.");
  });
}

function renderTeacher() {
  const assignment = course.assignments[0];
  $("#app").innerHTML = `${pageHeader("Teacher view", `Unit ${course.unit.unitNo} teaching resources`, "Delivery, evidence and framework alignment.", "AI-assisted — sign-off pending")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Framework alignment</h2><p>Targets CEFR <strong>${escapeHtml(course.unit.cefr.band)}</strong> across ${escapeHtml((course.unit.cefr.skills || []).join(", "))}. Carries ${course.frameworks.cambridge.codes.length} Cambridge objectives from stage ${course.frameworks.cambridge.stages.join(", ")}: ${escapeHtml(course.frameworks.cambridge.codes.join(", "))}.</p></section>
      ${assignment ? `<section class="panel teacher-banner"><h2>${escapeHtml(assignment.title)}</h2><p>${escapeHtml(assignment.instructions)}</p><p><strong>${assignment.marks} marks</strong> · ${escapeHtml(assignment.submissionType)}</p></section>` : ""}
      <section class="panel"><h2>Outcomes</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>CEFR</th><th>Skill</th><th>Can-do</th><th>Cambridge</th><th>Evidence</th></tr></thead><tbody>${course.outcomes.map((outcome) => `<tr><td>${escapeHtml(outcome.cefr.level)}</td><td>${escapeHtml(outcome.cefr.skill)}</td><td>${escapeHtml(outcome.cefr.descriptor)}</td><td>${escapeHtml((outcome.cambridgeObjectives || []).join(", "))}</td><td>${escapeHtml(outcome.evidenceOfLearning)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Teaching notes</h2>${course.teacherNotes.map((note) => `<details><summary>${escapeHtml(note.noteType)}</summary><p class="reading-text" style="font-family:inherit;font-size:14px">${escapeHtml(note.note)}</p></details>`).join("")}</section>
      <section class="panel"><h2>Answer key</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Item</th><th>Type</th><th>Answer</th></tr></thead><tbody>${course.answerKey.map((entry) => `<tr><td>${escapeHtml(entry.contentId)}</td><td>${escapeHtml(entry.contentType)}</td><td>${escapeHtml(entry.answerOrGuidance)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Rubrics</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Target</th><th>Criterion</th><th>Beginning</th><th>Secure</th></tr></thead><tbody>${course.rubrics.map((rubric) => `<tr><td>${escapeHtml(rubric.target)}</td><td>${escapeHtml(rubric.criterion)}</td><td>${escapeHtml(rubric.level1)}</td><td>${escapeHtml(rubric.level4)}</td></tr>`).join("")}</tbody></table></div></section>
    </div>`;
}

// ===================== config + boot =====================
const config = {
  subjectKey: "intensive-english",
  param: "level",
  mediaSubject: "intensive-english",
  ttsPurpose: "ehel_english",
  stageDir: (level) => `level-${level}`,
  defaultUnit: (level) => (Number(level) === 1 ? 0 : 1),
  sections,
  nonCountable: ["overview", "answers"],
  gradeSections: [],
  progressDefaults: { completed: [], knownWords: [], self: {}, writing: {}, games: {} },
  gradeDefaults: { completed: [] },
  keys: (level, unit) => ({ progress: `ehel-intensive-l${level}-u${unit}-progress-v1` }),
  courseKey: (level) => `ehel-ien-l${String(level).padStart(2, "0")}`,
  extendSummary: (state, base) => ({ ...base, knownWords: state.knownWords ? [...state.knownWords] : undefined }),
  visibleSections,
  onBeforeRender: () => { route = shellCtx.route; document.body.classList.remove("gc-full"); $("#app").setAttribute("aria-busy", "true"); },
  onAfterRender: () => { $("#app").setAttribute("aria-busy", "false"); icons(); },
  onNavRendered: () => icons(),
  renderers: {
    overview: () => renderOverview(),
    lecture: () => renderLecture(),
    dictionary: () => renderDictionary(),
    grammar: () => renderGrammar(),
    reading: () => renderReading(),
    comprehension: () => renderComprehension(),
    speaking: () => renderSpeaking(),
    writing: () => renderWriting(),
    activities: () => renderActivities(),
    quiz: () => renderQuiz(),
    answers: () => renderAnswers(),
    reflect: () => renderReflect(),
    teacher: () => renderTeacher(),
  },
  bind,
  async load(ctx) {
    const [manifestResponse, courseResponse, dictionaryResponse] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${unitNumber}.json`, ctx.dataRootUrl)),
      fetch(new URL(`master-dictionary.level${levelNumber}.json`, ctx.dataRootUrl)),
    ]);
    const failed = [manifestResponse, courseResponse, dictionaryResponse].find((response) => !response.ok);
    if (failed) throw new Error(`Course data could not be loaded (${failed.status} ${failed.url}).`);
    [manifest, course, dictionary] = await Promise.all([manifestResponse.json(), courseResponse.json(), dictionaryResponse.json()]);
    return { manifest, course };
  },
  async onReady() {
    document.title = `${course.level.label} | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    $("#course-label").innerHTML = `${escapeHtml(course.level.label)} ${cefrChip(course.unit.cefr.band)}`;
    $("#unit-title").textContent = course.unit.unitTitle;

    const levelSelect = $("#level-select");
    levelSelect.innerHTML = (manifest.levels || []).map((level) => {
      const open = level.unitCount > 0;
      return `<option value="${level.number}" ${level.number === levelNumber ? "selected" : ""} ${open ? "" : "disabled"}>${escapeHtml(level.label)} · ${escapeHtml((level.cefr || []).join("+"))}${open ? "" : " (not yet built)"}</option>`;
    }).join("");
    levelSelect.addEventListener("change", (event) => { location.href = levelLocation(event.target.value); });

    // A planned-but-unauthored unit is shown and disabled rather than hidden, so
    // the shape of the course is visible without pretending the content exists.
    const options = manifest.units.map((unit) => {
      const authored = !String(unit.status).startsWith("Planned");
      return `<option value="${unit.number}" ${unit.number === unitNumber ? "selected" : ""} ${authored ? "" : "disabled"}>Unit ${unit.number}: ${escapeHtml(unit.title)}${authored ? "" : " — not yet written"}</option>`;
    }).join("");
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) {
      picker.innerHTML = options;
      picker.addEventListener("change", (event) => { location.href = unitLocation(event.target.value); });
    }
    shellCtx.updateVoiceUI();
  },
};

createCourseApp(config);
