// Kiswahili subject module for the unified course-app shell.
//
// Modelled on the Grade 2 English course — same shell, same design system, same
// section-per-nav-item structure, same unit-JSON shape — with the differences a
// language course actually needs:
//
//   * The stage axis is a competency TRACK, not a school grade. Track 1 is the
//     core survival/social course (Units 0-19); tracks 2-4 are the manual's
//     technical sectors (Agroforestry, Small Enterprise Development, Water and
//     Sanitation). config.stageDir maps them to track-N/ folders.
//   * Mazungumzo (dialogues) are a section of their own. In the source manual
//     the dialogue, not the reading passage, is what carries each competency.
//   * Everything bilingual renders Kiswahili first with the English as a gloss
//     that can be hidden, so the learner reads Kiswahili before falling back.
//   * Nouns carry their class, and the class is shown wherever a noun is.
//   * Reference (pronunciation guide, grammar chart, glossary) replaces the
//     English course's shared ebook library.
//
// Unlike English, this course uses the SHELL's voice engine rather than a
// bespoke one: every Kiswahili line is a data-speak button, which resolves to a
// pre-generated clip when one exists and to ElevenLabs otherwise. That keeps
// pronunciation available on day one, before any audio has been recorded.
import { escapeHtml as sharedEscapeHtml, icon as sharedIcon } from "../../shared/course-shell.js?v=20260721a";
import { createCourseApp } from "../course-app.js?v=t2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad2 = (n) => String(n).padStart(2, "0");

const routeParams = new URLSearchParams(location.search);
const requestedTrack = Number(routeParams.get("track") || document.documentElement.dataset.track || 1);
const trackNumber = requestedTrack >= 1 && requestedTrack <= 4 ? requestedTrack : 1;
const defaultUnit = trackNumber === 1 ? 0 : 1;
const requestedUnit = Number(routeParams.get("unit") ?? defaultUnit);
const unitNumber = Number.isFinite(requestedUnit) && requestedUnit >= 0 ? requestedUnit : defaultUnit;

const IS_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
const trackRootUrl = new URL(`./track-${trackNumber}/`, location.href);
// The pronunciation guide, grammar chart and glossary are course-level, not
// per-track, so they live beside the tracks rather than being copied into each.
const referenceRootUrl = IS_DEV
  ? new URL("./reference/", location.href)
  : new URL("../../content/kiswahili/reference/", document.baseURI);

const STORAGE_KEY = `ehel-kiswahili-t${trackNumber}-u${unitNumber}-progress-v1`;
const FINAL_QUIZ_STORAGE_KEY = `ehel-kiswahili-t${trackNumber}-course-final-quiz-v1`;
const AI_STORAGE_KEY = `ehel-kiswahili-t${trackNumber}-u${unitNumber}-ai-v1`;
const ENGLISH_VISIBLE_KEY = "ehel-kiswahili-show-english";
const NARRATION_RATE = 0.9;
const STT_ENDPOINT = "/local/hubredirect/quiz_stt.php";

const CURRICULUM_FRAMEWORK = "U.S. Peace Corps Kenya competency-based Kiswahili curriculum (May 2013 revision)";

const sections = [
  ["overview", "layout-dashboard", "Overview"],
  ["lecture", "play-square", "Teacher lecture"],
  ["ai", "sparkles", "AI Kiswahili"],
  ["dictionary", "book-a", "Msamiati · Vocabulary"],
  ["dialogue", "messages-square", "Mazungumzo · Dialogues"],
  ["reading", "book-open", "Reading & culture"],
  ["comprehension", "list-checks", "Maswali · Comprehension"],
  ["grammar", "braces", "Sarufi · Grammar"],
  ["speaking", "mic-2", "Speaking"],
  ["writing", "pencil-line", "Writing"],
  ["activities", "shapes", "Activities"],
  ["games", "gamepad-2", "Games"],
  ["quiz", "badge-check", "Quiz"],
  ["reference", "library-big", "Reference"],
  ["live", "video", "Live sessions"],
  ["reflect", "sparkles", "My progress"],
];

// --- module state -----------------------------------------------------------
let manifest, course, dictionary, reference, gamePack, finalAssessment;
let route = "overview";
let showEnglish = localStorage.getItem(ENGLISH_VISIBLE_KEY) !== "false";
let activeWordId = null;
let activeSentence = 0;
let activeDialogueId = null;
let maskedSpeaker = null;
let activeGameId = null;
let gameRoundIndex = 0;
let gameScore = 0;
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let mediaRecorder = null;
let activeRecordingId = null;
let recordedChunks = [];
const recordings = new Map();

// Shell-provided bindings, populated by bind(ctx).
let progress, complete, saveProgress, navigate, renderNav, emitProgress, voiceButton, toast, pageHeader, dataRootUrl, PROGRESS_UNIT;
let shellCtx;
function bind(ctx) {
  ({ complete, saveProgress, navigate, renderNav, emitProgress, voiceButton, toast, pageHeader, dataRootUrl, PROGRESS_UNIT } = ctx);
  progress = ctx.progress;
  shellCtx = ctx;
}

const escapeHtml = (value = "") => sharedEscapeHtml(value);
const icon = (name, label = "") => sharedIcon(name, label);
function icons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } });
}

// --- helpers ----------------------------------------------------------------
const trackLabel = () => course?.track?.label || `Track ${trackNumber}`;
const isTechnical = () => course?.track?.strand === "technical";

function resolveTrackAssets(value) {
  const assetKeys = new Set(["source", "normal", "slow", "image", "lectureVideo", "lecturePoster", "lectureCaptions"]);
  if (Array.isArray(value)) { value.forEach(resolveTrackAssets); return value; }
  if (!value || typeof value !== "object") return value;
  for (const [key, item] of Object.entries(value)) {
    if (assetKeys.has(key) && typeof item === "string" && /^(\.\.?[/\\])/.test(item)) value[key] = new URL(item.replace(/\\/g, "/"), trackRootUrl).href;
    else resolveTrackAssets(item);
  }
  return value;
}

/** Kiswahili line with its English gloss underneath. The gloss is wrapped so a
 *  single container class can hide every translation on the page at once. */
function bilingual(swahili, english, { tag = "p", className = "" } = {}) {
  const gloss = english ? `<span class="en">${escapeHtml(english)}</span>` : "";
  return `<${tag} class="${className}"><span class="sw" lang="sw">${escapeHtml(swahili)}</span>${gloss}</${tag}>`;
}

/** Toolbar control that shows or hides every English gloss on the page. */
function translationToggle() {
  return `<button class="button ghost translation-toggle" id="toggle-english" type="button" aria-pressed="${showEnglish}">${icon("languages")} <span>${showEnglish ? "Hide English" : "Show English"}</span></button>`;
}

function bindTranslationToggle() {
  const button = $("#toggle-english");
  if (!button) return;
  button.addEventListener("click", () => {
    showEnglish = !showEnglish;
    localStorage.setItem(ENGLISH_VISIBLE_KEY, String(showEnglish));
    applyTranslationVisibility();
    button.setAttribute("aria-pressed", String(showEnglish));
    button.querySelector("span").textContent = showEnglish ? "Hide English" : "Show English";
    icons();
  });
}

function applyTranslationVisibility() {
  $("#app")?.classList.toggle("hide-english", !showEnglish);
}

/** Kiswahili stress is on the second-to-last syllable in almost every word, but
 *  a word-initial syllabic nasal breaks that (mzee is m-ZEE), so the unit data
 *  carries the index and this only falls back to the rule. */
function syllableHtml(syllables = [], stressIndex) {
  if (!syllables.length) return "";
  const stressAt = Number.isInteger(stressIndex) ? stressIndex : syllables.length - 2;
  return `<span class="syllables">${syllables.map((part, index) => `<span class="${index === stressAt ? "stress" : ""}">${escapeHtml(part)}</span>`).join("")}</span>`;
}

function nounClassChip(nounClass) {
  if (!nounClass) return "";
  const key = String(nounClass).toLowerCase().replace(/[^a-z]+/g, "-");
  return `<span class="noun-class" data-class="${escapeHtml(key)}" title="Noun class">${escapeHtml(nounClass)}</span>`;
}

function culturalNoteHtml() {
  if (!course.culturalNotes?.length) return "";
  return `<aside class="culture-note"><h3>${icon("hand-heart")} Utamaduni · Cultural note</h3><ul>${course.culturalNotes.map((note) => `<li>${escapeHtml(note.note)}</li>`).join("")}</ul></aside>`;
}

function courseLocation(nextUnit, nextRoute = "overview") {
  const url = new URL(location.href);
  url.searchParams.set("track", trackNumber);
  url.searchParams.set("unit", nextUnit);
  url.hash = nextRoute;
  return url.href;
}

function trackLocation(nextTrack) {
  const url = new URL(location.href);
  url.searchParams.set("track", nextTrack);
  url.searchParams.set("unit", Number(nextTrack) === 1 ? 0 : 1);
  url.hash = "overview";
  return url.href;
}

const lastUnitNumber = () => (manifest?.units?.length ? manifest.units[manifest.units.length - 1].number : null);

function visibleSections() {
  const available = sections.filter(([id]) => {
    if (id === "games") return Boolean(gamePack);
    if (id === "dialogue") return Boolean(course?.dialogues?.length);
    if (id === "reading") return Boolean(course?.readings?.length);
    if (id === "reference") return Boolean(reference);
    return true;
  });
  const isLastUnit = unitNumber === lastUnitNumber();
  return isLastUnit && finalAssessment ? [...available, ["final-quiz", "trophy", "Final course quiz"]] : available;
}

// --- final-quiz store -------------------------------------------------------
const finalQuizDefaults = { answers: {}, currentIndex: 0, startedAt: null, submitted: false, completed: false, passed: false, attempts: [] };
function loadFinalQuizProgress() {
  try { return { ...finalQuizDefaults, ...JSON.parse(localStorage.getItem(FINAL_QUIZ_STORAGE_KEY) || "{}") }; }
  catch { return { ...finalQuizDefaults }; }
}
function saveFinalQuizProgress() { localStorage.setItem(FINAL_QUIZ_STORAGE_KEY, JSON.stringify(finalQuizProgress)); }
const finalQuizProgress = loadFinalQuizProgress();

// --- AI store ---------------------------------------------------------------
const aiDefaults = { messages: [], needs: [] };
function loadAIState() {
  try { return { ...aiDefaults, ...JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || "{}") }; }
  catch { return { ...aiDefaults }; }
}
function saveAIState() { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiState)); }
const aiState = loadAIState();

// ===================== renderers =====================

function renderOverview() {
  const learningPath = String(course.unit.learningPath || "").split("\n").filter(Boolean);
  const summary = String(course.unit.unitOverview || "").split(". ").slice(0, 2).join(". ");
  $("#app").innerHTML = `${pageHeader(`${trackLabel()} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, summary)}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner ksw-banner">
          ${course.visual?.image ? `<img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt || course.unit.unitTitle)}">` : ""}
          <div class="banner-copy">
            <span>${escapeHtml(course.unit.unitTitleEnglish || "Your learning journey")}</span>
            <h2>${escapeHtml(course.unit.unitTitle)}</h2>
            <p>${escapeHtml(summary)}</p>
            <button class="button gold" data-go="lecture" type="button">${icon("play")} Anza somo · Start the lesson</button>
          </div>
        </section>
        <section class="panel">
          <span class="eyebrow">Umahiri · Competency</span>
          <h2>${escapeHtml(course.unit.competency)}</h2>
          ${course.unit.competencySwahili ? bilingual(course.unit.competencySwahili, "", { className: "rule-box" }) : ""}
          <p>${escapeHtml(course.unit.unitOverview)}</p>
        </section>
        <section class="panel"><h2>What you will be able to do</h2><div class="outcome-list">${course.outcomes.map((outcome) => `<div class="outcome"><span>${outcome.sequence}</span><p>${escapeHtml(outcome.learningOutcome)}</p></div>`).join("")}</div></section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">Competency-based curriculum</span><h3>${escapeHtml(trackLabel())}</h3><p>Unit ${course.unit.unitNo} is built from ${escapeHtml(course.unit.sourceLesson || "the source manual")} of the ${escapeHtml(CURRICULUM_FRAMEWORK)}. AI-assisted content review complete — human curriculum sign-off pending.</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.dictionaryLinks.length}</strong><small>maneno · words</small></div><div class="stat"><strong>${course.dialogues?.length || 0}</strong><small>mazungumzo</small></div><div class="stat"><strong>${course.quizzes.length}</strong><small>quiz points</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list">${learningPath.map((item) => `<li>${icon("circle-check-big")}<span>${escapeHtml(item)}</span></li>`).join("")}</ol></section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have completed ${progress.completed.length} learning sections. Pick up where you left off.` : "Your progress saves on this device as you learn."}</p><button class="button primary" data-go="${progress.completed.includes("lecture") ? "dictionary" : "lecture"}" type="button">Endelea · Continue ${icon("arrow-right")}</button></section>
        ${unitNumber === lastUnitNumber() && finalAssessment ? `<section class="panel final-quiz-callout"><span class="eyebrow">After this unit</span><h3>Final course quiz</h3><p>${finalAssessment.questionCount} questions across the whole track. Your answers save as you work.</p><button class="button gold" data-go="final-quiz" type="button">${finalQuizProgress.completed ? "View my results" : "Open final quiz"} ${icon("arrow-right")}</button></section>` : ""}
      </div>
    </div>`;
  $$("[data-go]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

function renderLecture() {
  const groups = course.vocabularyGroups.map((group) => group.title).join(", ");
  const script = course.visual?.lectureScript || "";
  if (!course.visual?.lectureVideo) {
    $("#app").innerHTML = `${pageHeader("Anza hapa · Begin here", "Teacher lecture", "Read and listen to the lecture while the recorded version is being prepared.", "Video pending")}
      <div class="lecture-layout">
        <section class="panel">
          <span class="eyebrow">Mwalimu · Your teacher</span>
          <h2>${escapeHtml(course.unit.unitTitle)}</h2>
          ${script ? `<div class="reading-text">${script.split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>${voiceButton(script, "Listen to the lecture")}` : `<p>${escapeHtml(course.unit.unitOverview)}</p>`}
          <p><button class="button gold" id="lecture-done" type="button">${icon("check")} I have studied the lecture</button></p>
        </section>
        <div class="section-stack">
          <section class="panel"><span class="eyebrow">How to learn</span><h2>Sikiliza. Sema. Tumia.</h2><ol class="path-list"><li>${icon("ear")}<span>Listen to the whole dialogue before you read it.</span></li><li>${icon("message-circle")}<span>Say every line aloud, even when nobody is listening.</span></li><li>${icon("braces")}<span>Notice the pattern before you learn the rule.</span></li><li>${icon("pencil")}<span>Use the language for something you actually need.</span></li></ol></section>
          <section class="panel"><h3>Words in this unit</h3><p>This unit teaches ${escapeHtml(groups)}.</p><button class="button primary" id="to-dictionary" type="button">Open msamiati ${icon("arrow-right")}</button></section>
        </div>
      </div>`;
    $("#lecture-done").addEventListener("click", () => complete("lecture", "Lecture complete. Your vocabulary lesson is ready."));
    $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
    return;
  }
  $("#app").innerHTML = `${pageHeader("Anza hapa · Begin here", "Teacher audiovisual lecture", "Watch and listen before you begin the independent lesson. Captions are available in the player.")}
    <div class="lecture-layout">
      <section class="panel video-shell"><video id="lecture-video" controls preload="metadata" poster="${course.visual.lecturePoster}"><source src="${course.visual.lectureVideo}" type="video/mp4">${course.visual.lectureCaptions ? `<track kind="captions" src="${course.visual.lectureCaptions}" srclang="sw" label="Kiswahili" default>` : ""}</video><div class="video-footer"><p id="video-status">Unit ${course.unit.unitNo} lecture</p><button class="button gold" id="lecture-done" type="button" ${progress.completed.includes("lecture") ? "" : "disabled"}>${progress.completed.includes("lecture") ? `${icon("check")} Lecture complete` : `${icon("play")} Watch to complete`}</button></div></section>
      <div class="section-stack"><section class="panel"><span class="eyebrow">Before you learn</span><h2>Sikiliza. Sema. Tumia.</h2><p>Your teacher introduces ${escapeHtml(groups)}.</p></section><section class="panel"><h3>Ready after the video?</h3><button class="button primary" id="to-dictionary" type="button" ${progress.completed.includes("lecture") ? "" : "disabled"}>Open msamiati ${icon("arrow-right")}</button></section></div>
    </div>`;
  const video = $("#lecture-video");
  video.defaultPlaybackRate = NARRATION_RATE;
  video.playbackRate = NARRATION_RATE;
  video.addEventListener("ended", () => {
    $("#lecture-done").disabled = false;
    $("#to-dictionary").disabled = false;
    complete("lecture", "Lecture complete. Your vocabulary lesson is ready.");
  });
  video.addEventListener("error", () => { $("#video-status").textContent = "Lecture video could not be loaded."; });
  $("#lecture-done").addEventListener("click", () => navigate("dictionary"));
  $("#to-dictionary").addEventListener("click", () => navigate("dictionary"));
}

function linkedWords() {
  return course.dictionaryLinks.map((link) => ({
    ...link,
    master: dictionary.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId) || null,
  }));
}

function renderDictionary() {
  const words = linkedWords();
  if (!words.length) {
    $("#app").innerHTML = pageHeader("Msamiati", "Vocabulary", "This unit has no vocabulary list yet.", "Pending");
    return;
  }
  if (!words.some((word) => word.vocabularyId === activeWordId)) activeWordId = words[0].vocabularyId;
  $("#app").innerHTML = `${pageHeader("Msamiati · Linked master dictionary", "Vocabulary lab", `Search the ${escapeHtml(trackLabel())} word list. Every word links to one reusable master entry with its noun class and pronunciation.`, `${dictionary.entryCount} master entries`)}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search Kiswahili or English" aria-label="Search dictionary"></label><select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All word groups</option>${course.vocabularyGroups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.title)}</option>`).join("")}</select>${translationToggle()}<span id="dictionary-count" class="status-chip">${words.length} words</span></div>
    <div class="dictionary-layout"><section class="panel word-list" id="word-list"></section><section class="panel word-card" id="word-card"></section></div>`;

  const drawList = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    const filtered = words.filter((item) => (group === "all" || item.groupId === group)
      && (!query || `${item.swahili} ${item.english} ${item.learnerMeaning}`.toLowerCase().includes(query)));
    $("#dictionary-count").textContent = `${filtered.length} words`;
    $("#word-list").innerHTML = filtered.length
      ? filtered.map((item) => `<button class="word-row ${item.vocabularyId === activeWordId ? "active" : ""}" data-word="${escapeHtml(item.vocabularyId)}" type="button"><span><strong lang="sw">${escapeHtml(item.swahili)}</strong><small>${escapeHtml(item.english)} · ${escapeHtml(item.groupTitle)}</small></span>${progress.knownWords.includes(item.vocabularyId) ? "<span>LEARNED</span>" : ""}</button>`).join("")
      : `<div class="empty">No matching words found.</div>`;
    $$("[data-word]").forEach((button) => button.addEventListener("click", () => { activeWordId = button.dataset.word; activeSentence = 0; drawList(); drawWord(); }));
  };

  const drawWord = () => {
    const item = words.find((word) => word.vocabularyId === activeWordId) || words[0];
    const sentences = item.practiceSentences?.length ? item.practiceSentences : [item.exampleSentence];
    const translations = item.practiceTranslations?.length ? item.practiceTranslations : [item.exampleTranslation];
    if (activeSentence >= sentences.length) activeSentence = 0;
    const sentence = sentences[activeSentence];
    const translation = translations[activeSentence] || "";
    $("#word-card").innerHTML = `
      <div class="word-card-head">
        <div>
          <span class="word-type">${escapeHtml(item.master?.partOfSpeech || "")}</span> ${nounClassChip(item.nounClass)}
          <h2 lang="sw">${escapeHtml(item.swahili)}</h2>
          <small>${escapeHtml(item.english)}</small>
        </div>
        <div class="audio-actions">${voiceButton(item.swahili, `Listen to ${item.swahili}`)}</div>
      </div>
      ${item.singular || item.plural ? `<div class="word-forms">${item.singular ? `<div class="word-form"><small>Umoja · singular</small><strong lang="sw">${escapeHtml(item.singular)}</strong></div>` : ""}${item.plural ? `<div class="word-form"><small>Wingi · plural</small><strong lang="sw">${escapeHtml(item.plural)}</strong></div>` : ""}</div>` : ""}
      <p class="meaning"><strong>Maana · Meaning:</strong> ${escapeHtml(item.learnerMeaning)}</p>
      ${item.syllables?.length ? `<p><strong>Matamshi · Say it:</strong> ${syllableHtml(item.syllables, item.stressIndex)} <small>The highlighted syllable takes the stress.</small></p>` : ""}
      <div class="sentence-card">
        <small>Katika sentensi · in a sentence · ${activeSentence + 1} of ${sentences.length}</small>
        ${bilingual(sentence, translation)}
        <div class="sentence-controls">
          <button class="icon-button" id="previous-sentence" type="button" aria-label="Previous sentence">${icon("arrow-left")}</button>
          <div class="sentence-dots">${sentences.map((_, index) => `<button class="sentence-dot ${index === activeSentence ? "active" : ""}" data-sentence="${index}" type="button" aria-label="Sentence ${index + 1}"></button>`).join("")}</div>
          ${voiceButton(sentence, "Hear this sentence")}
          <button class="icon-button" id="next-sentence" type="button" aria-label="Next sentence">${icon("arrow-right")}</button>
        </div>
      </div>
      <div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="${escapeHtml(item.sentenceStarter || "")}…" aria-label="Write your own Kiswahili sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div>
      <div id="word-feedback" role="status" aria-live="polite" aria-atomic="true"></div>
      <button class="button secondary" id="know-word" type="button">${progress.knownWords.includes(item.vocabularyId) ? `${icon("check-circle")} Learned` : `${icon("bookmark-plus")} I know this word`}</button>`;

    $("#previous-sentence").addEventListener("click", () => { activeSentence = (activeSentence - 1 + sentences.length) % sentences.length; drawWord(); });
    $("#next-sentence").addEventListener("click", () => { activeSentence = (activeSentence + 1) % sentences.length; drawWord(); });
    $$("[data-sentence]").forEach((dot) => dot.addEventListener("click", () => { activeSentence = Number(dot.dataset.sentence); drawWord(); }));
    $("#check-word-sentence").addEventListener("click", () => {
      const value = $("#word-sentence").value.trim();
      const usesWord = value.toLowerCase().includes(String(item.swahili).toLowerCase());
      const looksComplete = value.split(/\s+/).filter(Boolean).length >= 3;
      $("#word-feedback").innerHTML = `<p class="feedback ${usesWord && looksComplete ? "good" : "try"}">${usesWord && looksComplete
        ? `Vizuri! You used <strong lang="sw">${escapeHtml(item.swahili)}</strong> in a sentence of your own.`
        : `Try a full sentence that uses <strong lang="sw">${escapeHtml(item.swahili)}</strong> — three words or more.`}</p>`;
    });
    $("#know-word").addEventListener("click", () => {
      if (!progress.knownWords.includes(item.vocabularyId)) progress.knownWords.push(item.vocabularyId);
      if (progress.knownWords.length >= Math.ceil(words.length * 0.8)) complete("dictionary", "Msamiati complete.");
      else saveProgress();
      drawList(); drawWord();
    });
    shellCtx.bindVoiceControls();
    applyTranslationVisibility();
    icons();
  };

  $("#word-search").addEventListener("input", drawList);
  $("#group-filter").addEventListener("change", drawList);
  bindTranslationToggle();
  drawList();
  drawWord();
}

function renderDialogue() {
  const dialogues = course.dialogues || [];
  if (!dialogues.some((item) => item.dialogueId === activeDialogueId)) activeDialogueId = dialogues[0].dialogueId;
  $("#app").innerHTML = `${pageHeader("Mazungumzo · Dialogues", "Listen, read, then take a part", "Every competency in this course starts as a conversation. Hear it, read it, then play one of the speakers yourself.")}
    <div class="toolbar">${translationToggle()}<span class="status-chip">${dialogues.length} mazungumzo</span></div>
    <div class="dialogue-layout"><nav class="dialogue-list" id="dialogue-list" aria-label="Dialogues in this unit"></nav><article class="panel" id="dialogue-panel"></article></div>`;

  const draw = () => {
    const dialogue = dialogues.find((item) => item.dialogueId === activeDialogueId);
    $("#dialogue-list").innerHTML = dialogues.map((item, index) => `<button class="dialogue-button ${item.dialogueId === activeDialogueId ? "active" : ""}" data-dialogue="${escapeHtml(item.dialogueId)}" type="button" aria-current="${item.dialogueId === activeDialogueId ? "page" : "false"}"><span>${index + 1}</span><div><strong lang="sw">${escapeHtml(item.title)}</strong><small>${escapeHtml(item.titleEnglish || "")}</small></div></button>`).join("");

    const fullScript = dialogue.lines.map((line) => `${line.speaker}: ${line.swahili}`).join("\n");
    $("#dialogue-panel").innerHTML = `
      <header class="word-card-head"><div><span class="eyebrow">Mazungumzo ${dialogue.sequence}</span><h2 lang="sw">${escapeHtml(dialogue.title)}</h2><small>${escapeHtml(dialogue.titleEnglish || "")}</small></div><div class="audio-actions">${voiceButton(fullScript, "Listen to the whole dialogue")}</div></header>
      ${dialogue.setting ? `<p class="dialogue-scene">${icon("map-pin")} ${escapeHtml(dialogue.setting)}</p>` : ""}
      <div class="dialogue-turns" id="dialogue-turns">${dialogue.lines.map((line, index) => `
        <div class="dialogue-turn ${maskedSpeaker && line.speaker === maskedSpeaker ? "masked" : ""}" data-turn="${index}" data-speaker="${escapeHtml(line.speaker)}">
          <span class="dialogue-speaker" lang="sw">${escapeHtml(line.speaker)}</span>
          <div class="dialogue-line">${bilingual(line.swahili, line.english)}<div class="audio-actions">${voiceButton(line.swahili, `Listen to this line`)}</div></div>
        </div>`).join("")}</div>
      <footer class="ebook-footer">
        <div class="subtabs" role="group" aria-label="Role play">
          <span class="eyebrow">Igiza · Role play:</span>
          <button class="subtab ${maskedSpeaker === null ? "active" : ""}" data-mask="" type="button">Show all</button>
          ${dialogue.speakers.map((speaker) => `<button class="subtab ${maskedSpeaker === speaker ? "active" : ""}" data-mask="${escapeHtml(speaker)}" type="button">I am ${escapeHtml(speaker)}</button>`).join("")}
        </div>
        <button class="button primary" id="dialogue-done" type="button">Nimemaliza · Finished ${icon("check")}</button>
      </footer>`;

    $$("[data-dialogue]").forEach((button) => button.addEventListener("click", () => { activeDialogueId = button.dataset.dialogue; maskedSpeaker = null; draw(); }));
    $$("[data-mask]").forEach((button) => button.addEventListener("click", () => { maskedSpeaker = button.dataset.mask || null; draw(); }));
    // Tapping a hidden turn reveals just that turn, so a learner can check one
    // line without abandoning the whole role play.
    $$(".dialogue-turn.masked").forEach((turn) => turn.addEventListener("click", () => turn.classList.toggle("revealed")));
    $("#dialogue-done").addEventListener("click", () => complete("dialogue", "Mazungumzo complete."));
    shellCtx.bindVoiceControls();
    applyTranslationVisibility();
    icons();
  };

  bindTranslationToggle();
  draw();
}

function readingWordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function renderReading() {
  let selected = course.readings[0].readingId;
  $("#app").innerHTML = `${pageHeader("Soma · Read", "Reading & culture", "Read the passage, listen to it, and check the cultural note that goes with it.")}<div class="toolbar">${translationToggle()}</div><div class="reading-layout ebook-layout"><nav class="reading-list ebook-library" id="reading-list" aria-label="Reading library"></nav><article class="ebook-reader" id="reading-panel"></article></div>`;
  const draw = () => {
    const reading = course.readings.find((item) => item.readingId === selected);
    const index = course.readings.findIndex((item) => item.readingId === selected);
    const words = readingWordCount(reading.passageScript);
    $("#reading-list").innerHTML = `<div class="ebook-library-title"><span>${icon("library-big")}</span><div><strong>Maandishi · Texts</strong><small>${course.readings.length} in this unit</small></div></div>${course.readings.map((item, n) => `<button class="reading-button ebook-spine ${selected === item.readingId ? "active" : ""}" data-reading="${escapeHtml(item.readingId)}" type="button" aria-current="${selected === item.readingId ? "page" : "false"}"><span>${n + 1}</span><div><strong lang="sw">${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)}</small></div>${icon("chevron-right")}</button>`).join("")}`;
    $("#reading-panel").innerHTML = `
      <div class="ebook-progress" aria-label="Text ${index + 1} of ${course.readings.length}"><span style="width:${((index + 1) / course.readings.length) * 100}%"></span></div>
      <header class="ebook-toolbar"><div><span class="ebook-count">Text ${index + 1} of ${course.readings.length}</span><span>${words} words</span></div><div class="audio-actions">${voiceButton(reading.passageScript, `Listen to ${reading.title}`)}</div></header>
      <section class="ebook-page">
        <div class="ebook-page-heading"><span>${icon("bookmark")}</span><div><small>${escapeHtml(reading.type)}</small><h2 lang="sw">${escapeHtml(reading.title)}</h2>${reading.titleEnglish ? `<p>${escapeHtml(reading.titleEnglish)}</p>` : ""}</div></div>
        <div class="reading-text ebook-copy" lang="sw">${String(reading.passageScript).split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
        ${reading.passageTranslation ? `<details><summary>English translation</summary><div class="reading-text">${String(reading.passageTranslation).split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div></details>` : ""}
        <div class="ebook-page-number">${index + 1}</div>
      </section>
      ${index === course.readings.length - 1 ? culturalNoteHtml() : ""}
      <footer class="ebook-footer">
        <button class="button secondary" data-reading-step="-1" type="button" ${index === 0 ? "disabled" : ""}>${icon("arrow-left")} Previous</button>
        <button class="button primary" id="reading-done" type="button">Nimesoma · Finished reading ${icon("check")}</button>
        <button class="button secondary" data-reading-step="1" type="button" ${index === course.readings.length - 1 ? "disabled" : ""}>Next ${icon("arrow-right")}</button>
      </footer>`;
    $$("[data-reading]").forEach((button) => button.addEventListener("click", () => { selected = button.dataset.reading; draw(); }));
    $$("[data-reading-step]").forEach((button) => button.addEventListener("click", () => {
      const next = course.readings[index + Number(button.dataset.readingStep)];
      if (next) { selected = next.readingId; draw(); }
    }));
    $("#reading-done").addEventListener("click", () => complete("reading", `${reading.title} marked as read.`));
    shellCtx.bindVoiceControls();
    applyTranslationVisibility();
    icons();
  };
  bindTranslationToggle();
  draw();
}

function renderComprehension() {
  const groups = [...new Set(course.comprehension.map((question) => question.section))];
  let active = groups[0];
  const draw = () => {
    const questions = course.comprehension.filter((question) => question.section === active);
    $("#app").innerHTML = `${pageHeader("Maswali · Questions", "Comprehension", "Write your answer first. Then reveal the reviewed guidance and improve it.")}
      <div class="subtabs">${groups.map((group) => `<button class="subtab ${group === active ? "active" : ""}" data-group="${escapeHtml(group)}" type="button">${escapeHtml(group)}</button>`).join("")}</div>
      <section class="panel"><div class="question-list">${questions.map((question) => `<div class="question"><label for="answer-${escapeHtml(question.questionId)}">${question.sequence}. <span lang="sw">${escapeHtml(question.question)}</span></label>${question.questionEnglish ? `<small class="en">${escapeHtml(question.questionEnglish)}</small>` : ""}<textarea id="answer-${escapeHtml(question.questionId)}" placeholder="Andika jibu lako…"></textarea><button class="button secondary" data-check-answer="${escapeHtml(question.questionId)}" type="button">Check guidance</button><div id="feedback-${escapeHtml(question.questionId)}" role="status" aria-live="polite" aria-atomic="true"></div></div>`).join("")}</div><button class="button primary" id="comprehension-done" type="button">Finish comprehension ${icon("check")}</button></section>`;
    $$("[data-group]").forEach((button) => button.addEventListener("click", () => { active = button.dataset.group; draw(); }));
    $$("[data-check-answer]").forEach((button) => button.addEventListener("click", () => {
      const question = course.comprehension.find((item) => item.questionId === button.dataset.checkAnswer);
      const value = $(`#answer-${CSS.escape(question.questionId)}`).value.trim();
      $(`#feedback-${CSS.escape(question.questionId)}`).innerHTML = value.length < 3
        ? `<p class="feedback try">Write your own answer before viewing the guidance.</p>`
        : `<p class="feedback good"><strong>Jibu · Reviewed answer:</strong> <span lang="sw">${escapeHtml(question.correctAnswer)}</span>${question.explanation ? `<br><small>${escapeHtml(question.explanation)}</small>` : ""}</p>`;
    }));
    $("#comprehension-done").addEventListener("click", () => complete("comprehension", "Comprehension practice complete."));
    icons();
  };
  draw();
}

function renderGrammar() {
  $("#app").innerHTML = `${pageHeader("Sarufi · Grammar", "Grammar workshop", "One pattern at a time: see it, understand why, then use it.")}
    <div class="toolbar">${translationToggle()}</div>
    <div class="grammar-grid">${course.grammar.map((lesson) => `
      <article class="panel grammar-card">
        <div class="word-card-head"><span class="lesson-number">${lesson.sequence}</span><span class="word-type">${escapeHtml(lesson.practiceType)}</span></div>
        <h3>${escapeHtml(lesson.title)}</h3>
        ${lesson.titleSwahili ? `<p class="eyebrow" lang="sw">${escapeHtml(lesson.titleSwahili)}</p>` : ""}
        <p>${escapeHtml(lesson.explanation)}</p>
        ${lesson.ruleAndExamples ? `<div class="rule-box" lang="sw">${escapeHtml(lesson.ruleAndExamples).replace(/\n/g, "<br>")}</div>${voiceButton(lesson.ruleAndExamples, `Listen to the ${lesson.title} pattern`)}` : ""}
        ${lesson.commonMistake ? `<p class="mistake">${escapeHtml(lesson.commonMistake)}</p>` : ""}
        ${lesson.memoryTip ? `<p><strong>Memory tip:</strong> ${escapeHtml(lesson.memoryTip)}</p>` : ""}
        ${lesson.practice ? `<details><summary>Show practice</summary><p class="rule-box">${escapeHtml(lesson.practice).replace(/\n/g, "<br>")}</p>${lesson.answerKey ? `<details><summary>Check yourself</summary><p class="rule-box">${escapeHtml(lesson.answerKey).replace(/\n/g, "<br>")}</p></details>` : ""}</details>` : ""}
      </article>`).join("")}</div>
    <p><button class="button primary" id="grammar-done" type="button">I practised every pattern ${icon("check")}</button></p>`;
  $("#grammar-done").addEventListener("click", () => complete("grammar", "Grammar workshop complete."));
  bindTranslationToggle();
  shellCtx.bindVoiceControls();
}

function renderSpeaking() {
  $("#app").innerHTML = `${pageHeader("Sema · Speak", "Speaking practice", "Rehearse each task, record yourself, and listen back before you move on.")}
    <div class="task-grid">${course.speaking.map((task) => `
      <article class="panel task-card">
        <span class="eyebrow">Practice ${task.sequence} · ${escapeHtml(task.activityType)}</span>
        <h3>${escapeHtml(task.title)}</h3>
        <p class="rule-box">${escapeHtml(task.instructionsAndModelLines).replace(/\n/g, "<br>")}</p>
        <div class="audio-actions">${voiceButton(task.instructionsAndModelLines, `Hear the model for ${task.title}`)}</div>
        ${task.recordingRequired ? `<div class="recorder"><button class="record-button" data-record="${escapeHtml(task.speakingId)}" type="button" aria-label="Start recording for ${escapeHtml(task.title)}">${icon("mic")}</button><div><strong data-record-status="${escapeHtml(task.speakingId)}">Ready to record</strong><small> Your recording stays on this device.</small></div></div><audio data-playback="${escapeHtml(task.speakingId)}" controls hidden></audio>` : ""}
      </article>`).join("")}</div>
    <p><button class="button primary" id="speaking-done" type="button">Finish speaking practice ${icon("check")}</button></p>`;
  $$("[data-record]").forEach((button) => button.addEventListener("click", () => toggleRecording(button.dataset.record, button)));
  $("#speaking-done").addEventListener("click", () => complete("speaking", "Speaking practice complete."));
  shellCtx.bindVoiceControls();
}

async function toggleRecording(taskId, button) {
  if (mediaRecorder?.state === "recording") { mediaRecorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Audio recording is not supported in this browser.");
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
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
      const url = URL.createObjectURL(blob);
      recordings.set(activeRecordingId, { blob, url });
      if (audio) { audio.src = url; audio.hidden = false; }
      const status = $(`[data-record-status="${CSS.escape(activeRecordingId)}"]`);
      if (status) status.textContent = "Recording ready. Listen back.";
      const activeButton = $(`[data-record="${CSS.escape(activeRecordingId)}"]`);
      if (activeButton) { activeButton.classList.remove("recording"); activeButton.innerHTML = icon("mic"); }
      stream.getTracks().forEach((track) => track.stop());
      icons();
    });
    mediaRecorder.start();
    const status = $(`[data-record-status="${CSS.escape(taskId)}"]`);
    if (status) status.textContent = "Recording… tap to stop";
    button.classList.add("recording");
    button.innerHTML = icon("square");
    icons();
  } catch {
    toast("Microphone permission is needed to record your speaking practice.");
  }
}

function renderWriting() {
  let active = course.writing[0].writingId;
  const draw = () => {
    const task = course.writing.find((item) => item.writingId === active);
    const saved = progress.writing[active] || "";
    $("#app").innerHTML = `${pageHeader("Andika · Write", "Writing studio", "Choose a task. Your draft saves automatically on this device.")}
      <div class="subtabs">${course.writing.map((item) => `<button class="subtab ${active === item.writingId ? "active" : ""}" data-writing="${escapeHtml(item.writingId)}" type="button">Writing ${item.sequence}</button>`).join("")}</div>
      <div class="task-grid">
        <section class="panel"><h2>${escapeHtml(task.title)}</h2><p class="rule-box">${escapeHtml(task.promptAndInstructions).replace(/\n/g, "<br>")}</p><details><summary>View model text</summary><p class="model" lang="sw">${escapeHtml(task.modelText)}</p>${task.modelTranslation ? `<p class="en">${escapeHtml(task.modelTranslation)}</p>` : ""}</details><p><strong>Expected:</strong> ${escapeHtml(task.expectedLength)}</p><textarea id="writing-draft" placeholder="${escapeHtml(task.sentenceStarter || "")}">${escapeHtml(saved)}</textarea><p id="save-status"><small>${saved ? "Draft restored" : "Start writing when you are ready"}</small></p></section>
        <aside class="panel"><h3>Writer's checklist</h3><ul class="checklist">${String(task.successCriteria).split(";").map((criterion, index) => `<li><label><input type="checkbox" data-writing-check="${index}"><span>${escapeHtml(criterion.trim())}</span></label></li>`).join("")}</ul><h3>Support</h3><p>${escapeHtml(task.support)}</p><h3>Challenge</h3><p>${escapeHtml(task.extension)}</p><button class="button primary" id="writing-done" type="button">Submit this draft ${icon("send")}</button></aside>
      </div>`;
    $$("[data-writing]").forEach((button) => button.addEventListener("click", () => { active = button.dataset.writing; draw(); }));
    let saveTimer;
    $("#writing-draft").addEventListener("input", (event) => {
      clearTimeout(saveTimer);
      $("#save-status").innerHTML = "<small>Saving…</small>";
      saveTimer = setTimeout(() => {
        progress.writing[active] = event.target.value;
        saveProgress();
        emitProgress({ type: "draft.saved", unit: PROGRESS_UNIT, section: `writing:${active}`, text: event.target.value, words: event.target.value.trim().split(/\s+/).filter(Boolean).length });
        $("#save-status").innerHTML = "<small>Draft saved</small>";
      }, 350);
    });
    $("#writing-done").addEventListener("click", () => {
      const draft = $("#writing-draft").value.trim();
      if (draft.split(/\s+/).filter(Boolean).length < 6) return toast("Add a little more to your draft before submitting.");
      progress.writing[active] = draft;
      complete("writing", "Writing draft saved to your learning portfolio.");
    });
    icons();
  };
  draw();
}

function renderActivities() {
  $("#app").innerHTML = `${pageHeader("Mazoezi · Practice", "Activities", `Complete ${course.activities.length} practical challenges for ${escapeHtml(course.unit.unitTitle)}.`)}
    <div class="task-grid">${course.activities.map((activity) => `<article class="panel task-card"><span class="eyebrow">Activity ${activity.sequence} · ${escapeHtml(activity.activityType)}</span><h3>${escapeHtml(activity.title)}</h3><p class="rule-box">${escapeHtml(activity.instructionsAndItems).replace(/\n/g, "<br>")}</p><textarea class="activity-response" rows="4" placeholder="Andika majibu yako…" aria-label="Response for ${escapeHtml(activity.title)}"></textarea>${activity.answerSummary ? `<details><summary>Check yourself</summary><p class="rule-box">${escapeHtml(activity.answerSummary).replace(/\n/g, "<br>")}</p></details>` : ""}<button class="button secondary" data-activity-done="${escapeHtml(activity.activityId)}" type="button">${icon("check")} Mark complete</button></article>`).join("")}</div>
    <p><button class="button primary" id="activities-done" type="button">Finish activities ${icon("check")}</button></p>`;
  $$("[data-activity-done]").forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.innerHTML = `${icon("check-circle")} Complete`; icons(); }));
  $("#activities-done").addEventListener("click", () => complete("activities", "Unit activities complete."));
}

// --- reference --------------------------------------------------------------
function renderReference() {
  const tabs = [
    ["sounds", "Matamshi · Pronunciation"],
    ["chart", "Chati ya sarufi · Grammar chart"],
    ["glossary", "Kamusi · Glossary"],
  ];
  let active = "sounds";
  const draw = () => {
    let body = "";
    if (active === "sounds") {
      body = `<section class="panel"><h2>Irabu · Vowels</h2><p>Kiswahili has five vowels and each keeps the same sound wherever it appears — there are no silent letters and no long-vowel exceptions to memorise.</p><div class="sound-grid">${reference.pronunciation.vowels.map((sound) => `<div class="sound-card"><strong lang="sw">${escapeHtml(sound.letter)}</strong><small>${escapeHtml(sound.englishLike)}</small><p>${escapeHtml(sound.guidance)}</p><div class="audio-actions">${voiceButton(sound.example, `Listen to ${sound.example}`)}</div><p lang="sw"><strong>${escapeHtml(sound.example)}</strong> — ${escapeHtml(sound.exampleMeaning)}</p></div>`).join("")}</div></section>
        <section class="panel"><h2>Konsonanti · Consonants</h2><div class="sound-grid">${reference.pronunciation.consonants.map((sound) => `<div class="sound-card"><strong lang="sw">${escapeHtml(sound.letter)}</strong><small>${escapeHtml(sound.englishLike)}</small><p lang="sw"><strong>${escapeHtml(sound.example)}</strong> — ${escapeHtml(sound.exampleMeaning)}</p><div class="audio-actions">${voiceButton(sound.example, `Listen to ${sound.example}`)}</div></div>`).join("")}</div></section>
        <section class="panel"><h2>Silabi · Syllables and stress</h2><ul class="checklist">${reference.pronunciation.syllableRules.map((rule) => `<li>${icon("circle-check-big")} ${escapeHtml(rule)}</li>`).join("")}</ul></section>`;
    } else if (active === "chart") {
      body = `<section class="panel"><h2>Chati ya sarufi · One-page grammar chart</h2><p>The whole grammar of this course on one page. Use it to check a form quickly rather than to learn from cold.</p><div class="teacher-table-scroll"><table class="chart-table"><thead><tr><th>Feature</th><th>Form</th><th>Example</th><th>English</th></tr></thead><tbody>${reference.grammarChart.map((row) => `<tr><td>${escapeHtml(row.feature)}</td><td lang="sw">${escapeHtml(row.form)}</td><td lang="sw">${escapeHtml(row.example)}</td><td>${escapeHtml(row.translation)}</td></tr>`).join("")}</tbody></table></div></section>`;
    } else {
      body = `<section class="panel"><h2>Kamusi · Glossary</h2><label class="search-box">${icon("search")}<input id="glossary-search" type="search" placeholder="Search the glossary" aria-label="Search glossary"></label><p><span id="glossary-count" class="status-chip">${reference.glossary.length} entries</span></p><div class="glossary-list" id="glossary-list"></div></section>`;
    }
    $("#app").innerHTML = `${pageHeader("Marejeo · Reference", "Reference", "The pronunciation guide, the one-page grammar chart and the full course glossary, available from every unit.", `${reference.glossary.length} glossary entries`)}
      <div class="subtabs reference-tabs">${tabs.map(([id, label]) => `<button class="subtab ${active === id ? "active" : ""}" data-reference="${id}" type="button">${escapeHtml(label)}</button>`).join("")}</div>${body}`;
    $$("[data-reference]").forEach((button) => button.addEventListener("click", () => { active = button.dataset.reference; draw(); }));
    if (active === "glossary") {
      const drawGlossary = () => {
        const query = $("#glossary-search").value.trim().toLowerCase();
        const filtered = reference.glossary.filter((entry) => !query || `${entry.swahili} ${entry.english}`.toLowerCase().includes(query));
        $("#glossary-count").textContent = `${filtered.length} entries`;
        $("#glossary-list").innerHTML = filtered.map((entry) => `<div class="glossary-entry"><strong lang="sw">${escapeHtml(entry.swahili)}</strong><span>${entry.partOfSpeech ? `<em>${escapeHtml(entry.partOfSpeech)}</em> · ` : ""}${escapeHtml(entry.english)}</span></div>`).join("") || `<div class="empty">No matching entries.</div>`;
      };
      $("#glossary-search").addEventListener("input", drawGlossary);
      drawGlossary();
    }
    shellCtx.bindVoiceControls();
    icons();
  };
  draw();
}

// --- games ------------------------------------------------------------------
function gameProgress(gameId) {
  progress.games ||= {};
  return progress.games[gameId] || { bestScore: 0, attempts: 0, xp: 0 };
}

function renderGames() {
  if (!gamePack) {
    $("#app").innerHTML = pageHeader("Michezo · Games", "Games coming soon", "This unit's games are still being prepared.", "Pending");
    return;
  }
  if (activeGameId) return renderActiveGame();
  const mastered = gamePack.games.filter((game) => gameProgress(game.id).bestScore >= gamePack.masteryScore).length;
  const xp = gamePack.games.reduce((total, game) => total + gameProgress(game.id).xp, 0);
  $("#app").innerHTML = `${pageHeader("Michezo · Play and master", "Game zone", `${gamePack.games.length} short games turn this unit's words, dialogues and patterns into active practice.`, `${escapeHtml(trackLabel())} games`)}
    <section class="games-hero"><div><span class="eyebrow">Unit ${course.unit.unitNo} · ${escapeHtml(course.unit.unitTitle)}</span><h2>Choose your next challenge</h2><p>Earn stars by showing what you know. Hints and retries are always available.</p><div class="game-hero-stats"><strong>${mastered}/${gamePack.games.length} mastered</strong><strong>${xp} XP earned</strong></div></div></section>
    <div class="game-grid">${gamePack.games.map((game, index) => {
      const saved = gameProgress(game.id);
      const passed = saved.bestScore >= gamePack.masteryScore;
      return `<article class="game-card ${passed ? "mastered" : ""}"><div class="game-card-top"><span class="game-icon">${icon(game.icon)}</span><span class="game-number">${index + 1}</span></div><span class="eyebrow">${escapeHtml(game.skill)}</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><div class="game-stars" aria-label="Best score ${saved.bestScore} out of ${game.rounds.length}">${game.rounds.map((_, star) => `<span class="${star < saved.bestScore ? "earned" : ""}">★</span>`).join("")}</div><button class="button ${passed ? "secondary" : "primary"}" data-start-game="${escapeHtml(game.id)}" type="button">${passed ? `${icon("rotate-ccw")} Play again` : `${icon("play")} Start game`}</button></article>`;
    }).join("")}</div>`;
  $$("[data-start-game]").forEach((button) => button.addEventListener("click", () => { activeGameId = button.dataset.startGame; gameRoundIndex = 0; gameScore = 0; renderActiveGame(); }));
  icons();
}

function finishGame(game) {
  const saved = gameProgress(game.id);
  const best = Math.max(saved.bestScore, gameScore);
  progress.games[game.id] = { bestScore: best, attempts: saved.attempts + 1, xp: saved.xp + gameScore * 10 };
  saveProgress();
  emitProgress({ type: "game.result", unit: PROGRESS_UNIT, section: `game:${game.id}`, score: gameScore, total: game.rounds.length });
  const passedAll = gamePack.games.every((item) => gameProgress(item.id).bestScore >= gamePack.masteryScore);
  if (passedAll) complete("games", "Every game mastered. Vizuri sana!");
  $("#app").innerHTML = `${pageHeader("Michezo · Games", game.title, "Round complete.")}
    <section class="panel quiz-result"><div class="score-ring">${gameScore}/${game.rounds.length}</div><h2>${gameScore >= gamePack.masteryScore ? "Umeshinda! Mastered." : "Good effort — try once more."}</h2><p>You earned ${gameScore * 10} XP.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="replay-game" type="button">${icon("rotate-ccw")} Play again</button><button class="button primary" id="back-to-games" type="button">Back to games ${icon("arrow-right")}</button></div></section>`;
  $("#replay-game").addEventListener("click", () => { gameRoundIndex = 0; gameScore = 0; renderActiveGame(); });
  $("#back-to-games").addEventListener("click", () => { activeGameId = null; renderGames(); });
  icons();
}

function renderActiveGame() {
  const game = gamePack.games.find((item) => item.id === activeGameId);
  if (!game) { activeGameId = null; return renderGames(); }
  if (gameRoundIndex >= game.rounds.length) return finishGame(game);
  const round = game.rounds[gameRoundIndex];
  const head = `${pageHeader(`Michezo · ${escapeHtml(game.skill)}`, game.title, game.description)}
    <div class="quiz-top"><span>Round ${gameRoundIndex + 1} of ${game.rounds.length}</span><strong>${gameScore} correct</strong></div>
    <div class="progress-track"><span style="width:${(gameRoundIndex / game.rounds.length) * 100}%"></span></div>`;

  const advance = (correct) => {
    if (correct) gameScore += 1;
    gameRoundIndex += 1;
    setTimeout(() => renderActiveGame(), 650);
  };

  if (game.type === "choice") {
    $("#app").innerHTML = `${head}<section class="panel"><h2 class="quiz-question" lang="sw">${escapeHtml(round.prompt)}</h2><div class="quiz-options">${round.choices.map((choice) => `<button class="quiz-option" data-choice="${escapeHtml(choice)}" type="button">${escapeHtml(choice)}</button>`).join("")}</div><div id="game-feedback" role="status" aria-live="polite"></div></section>`;
    let locked = false;
    $$("[data-choice]").forEach((button) => button.addEventListener("click", () => {
      if (locked) return;
      locked = true;
      const correct = button.dataset.choice === String(round.answer);
      button.classList.add(correct ? "correct" : "wrong");
      if (!correct) $$("[data-choice]").find((option) => option.dataset.choice === String(round.answer))?.classList.add("correct");
      $("#game-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}">${escapeHtml(round.explanation || (correct ? "Sahihi! Correct." : `The answer is ${round.answer}.`))}</p>`;
      advance(correct);
    }));
  } else if (game.type === "spelling") {
    $("#app").innerHTML = `${head}<section class="panel"><h2 class="quiz-question">${escapeHtml(round.prompt)}</h2><p class="rule-box">${escapeHtml(round.clue)}</p><div class="practice-box"><input id="spelling-input" autocomplete="off" lang="sw" aria-label="Type the Kiswahili word"><button class="button primary" id="spelling-check" type="button">Check</button></div><div id="game-feedback" role="status" aria-live="polite"></div></section>`;
    $("#spelling-check").addEventListener("click", () => {
      const value = $("#spelling-input").value.trim().toLowerCase();
      const correct = value === String(round.answer).toLowerCase();
      $("#game-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}">${correct ? "Sahihi! Correct." : `The word is <strong lang="sw">${escapeHtml(round.answer)}</strong>.`}</p>`;
      advance(correct);
    });
  } else if (game.type === "sentence" || game.type === "sequence") {
    const tokens = [...round.tokens];
    $("#app").innerHTML = `${head}<section class="panel"><h2 class="quiz-question">${escapeHtml(round.prompt)}</h2><p class="rule-box" id="sentence-build" lang="sw">&nbsp;</p><div class="quiz-options" id="token-bank">${tokens.map((token, index) => `<button class="quiz-option" data-token="${index}" type="button" lang="sw">${escapeHtml(token)}</button>`).join("")}</div><div class="audio-actions"><button class="button secondary" id="sentence-reset" type="button">${icon("rotate-ccw")} Start again</button><button class="button primary" id="sentence-check" type="button">Check</button></div><div id="game-feedback" role="status" aria-live="polite"></div></section>`;
    const built = [];
    const redraw = () => { $("#sentence-build").textContent = built.join(" ") || " "; };
    $$("[data-token]").forEach((button) => button.addEventListener("click", () => {
      if (button.disabled) return;
      button.disabled = true;
      built.push(button.textContent);
      redraw();
    }));
    $("#sentence-reset").addEventListener("click", () => { built.length = 0; $$("[data-token]").forEach((button) => { button.disabled = false; }); redraw(); });
    $("#sentence-check").addEventListener("click", () => {
      const correct = built.join(" ").trim() === String(round.answer).trim();
      $("#game-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}">${correct ? "Sahihi! Correct." : `The sentence is: <strong lang="sw">${escapeHtml(round.answer)}</strong>`}</p>`;
      advance(correct);
    });
  } else if (game.type === "pairs") {
    const left = round.pairs.map(([sw]) => sw);
    const right = [...round.pairs.map(([, en]) => en)].sort();
    let picked = null;
    let matched = 0;
    $("#app").innerHTML = `${head}<section class="panel"><h2 class="quiz-question">${escapeHtml(round.prompt)}</h2><div class="dialogue-layout"><div class="quiz-options">${left.map((item) => `<button class="quiz-option" data-left="${escapeHtml(item)}" type="button" lang="sw">${escapeHtml(item)}</button>`).join("")}</div><div class="quiz-options">${right.map((item) => `<button class="quiz-option" data-right="${escapeHtml(item)}" type="button">${escapeHtml(item)}</button>`).join("")}</div></div><div id="game-feedback" role="status" aria-live="polite"></div></section>`;
    $$("[data-left]").forEach((button) => button.addEventListener("click", () => {
      $$("[data-left]").forEach((other) => other.classList.remove("active"));
      button.classList.add("active");
      picked = button.dataset.left;
    }));
    $$("[data-right]").forEach((button) => button.addEventListener("click", () => {
      if (!picked) return toast("Choose a Kiswahili word first.");
      const pair = round.pairs.find(([sw]) => sw === picked);
      const correct = pair && pair[1] === button.dataset.right;
      if (correct) {
        matched += 1;
        button.classList.add("correct");
        button.disabled = true;
        const leftButton = $$("[data-left]").find((item) => item.dataset.left === picked);
        leftButton.classList.add("correct");
        leftButton.disabled = true;
        leftButton.classList.remove("active");
        picked = null;
        if (matched === round.pairs.length) { $("#game-feedback").innerHTML = `<p class="feedback good">Sahihi! All pairs matched.</p>`; advance(true); }
      } else {
        button.classList.add("wrong");
        setTimeout(() => button.classList.remove("wrong"), 600);
      }
    }));
  } else if (game.type === "speaking") {
    $("#app").innerHTML = `${head}<section class="panel"><h2 class="quiz-question">${escapeHtml(round.prompt)}</h2><p class="rule-box" lang="sw">${escapeHtml(round.target)}</p><div class="audio-actions">${voiceButton(round.target, "Hear the model")}<button class="button primary" id="speaking-said" type="button">${icon("check")} I said it aloud</button></div></section>`;
    shellCtx.bindVoiceControls();
    $("#speaking-said").addEventListener("click", () => advance(true));
  } else {
    $("#app").innerHTML = `${head}<section class="panel"><p>This game type is not supported yet.</p><button class="button primary" id="skip-round" type="button">Skip</button></section>`;
    $("#skip-round").addEventListener("click", () => advance(false));
  }
  icons();
}

// --- quiz -------------------------------------------------------------------
function renderQuiz() {
  quizIndex = 0; quizScore = 0; quizLocked = false;
  $("#app").innerHTML = `${pageHeader("Jaribio · Unit checkpoint", "Quick quiz", `Answer ${course.quizzes.length} questions. You will see feedback after each answer and can try again.`)}<section class="panel quiz-shell" id="quiz-shell"></section>`;
  drawQuizQuestion();
}

function drawQuizQuestion() {
  const shell = $("#quiz-shell");
  if (quizIndex >= course.quizzes.length) {
    const percent = Math.round((quizScore / course.quizzes.length) * 100);
    emitProgress({ type: "checkpoint.result", unit: PROGRESS_UNIT, section: "quiz", score: percent, passed: percent >= 60, attempt: 1 });
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${quizScore}/${course.quizzes.length}</div><span class="eyebrow">Checkpoint complete</span><h2>${percent >= 80 ? "Vizuri sana! Excellent." : "Good effort. Review and try again."}</h2><p>You scored ${percent}% and earned ${quizScore * 10} XP.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="quiz-done" type="button">Continue ${icon("arrow-right")}</button></div></div>`;
    $("#retry-quiz").addEventListener("click", renderQuiz);
    $("#quiz-done").addEventListener("click", () => { if (percent >= 60) complete("quiz"); navigate("reflect"); });
    if (percent >= 60) complete("quiz", "Quiz passed. Hongera!");
    icons();
    return;
  }
  const question = course.quizzes[quizIndex];
  const options = String(question.options).split(" | ");
  shell.innerHTML = `<div class="quiz-top"><span>Question ${quizIndex + 1} of ${course.quizzes.length}</span><strong>${quizScore} correct</strong></div><div class="progress-track"><span style="width:${(quizIndex / course.quizzes.length) * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(question.question)}</h2><div class="quiz-options">${options.map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button" lang="sw">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback" role="status" aria-live="polite" aria-atomic="true"></div><button class="button primary" id="next-quiz" type="button" hidden>Next question ${icon("arrow-right")}</button>`;
  quizLocked = false;
  $$("[data-option]").forEach((button) => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.option === String(question.correctAnswer);
    if (correct) quizScore += 1;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$("[data-option]").find((option) => option.dataset.option === String(question.correctAnswer))?.classList.add("correct");
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><strong>${correct ? "Sahihi!" : "Si sahihi."}</strong> ${escapeHtml(question.explanation)}</p>`;
    $("#next-quiz").hidden = false;
    $("#next-quiz").addEventListener("click", () => { quizIndex += 1; drawQuizQuestion(); });
  }));
  icons();
}

// --- final quiz -------------------------------------------------------------
function calculateFinalQuizResults(answers = finalQuizProgress.answers) {
  const answered = finalAssessment.questions.filter((question) => answers[question.questionId]);
  const correct = answered.filter((question) => answers[question.questionId].selected === question.correctAnswer);
  const summarize = (key, definitions) => definitions.map((definition) => {
    const questions = finalAssessment.questions.filter((question) => question[key] === definition.id);
    const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
    return { ...definition, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0 };
  });
  const sectionScores = summarize("sectionId", finalAssessment.sections.map((section) => ({ id: section.sectionId, label: section.title })));
  const areaScores = summarize("curriculumArea", [...new Set(finalAssessment.questions.map((question) => question.curriculumArea))].map((area) => ({ id: area, label: area })));
  const percent = Math.round((correct.length / finalAssessment.totalMarks) * 100);
  return { answered: answered.length, score: correct.length, total: finalAssessment.totalMarks, percent, passed: percent >= finalAssessment.passPercent, sectionScores, areaScores };
}

function renderFinalQuiz() {
  if (unitNumber !== lastUnitNumber() || !finalAssessment) return navigate("overview");
  if (finalQuizProgress.submitted) return renderFinalQuizResults(calculateFinalQuizResults());
  const questions = finalAssessment.questions;
  const index = Math.min(finalQuizProgress.currentIndex, questions.length - 1);
  const question = questions[index];
  const saved = finalQuizProgress.answers[question.questionId];
  if (!finalQuizProgress.startedAt) { finalQuizProgress.startedAt = new Date().toISOString(); saveFinalQuizProgress(); }
  $("#app").innerHTML = `${pageHeader("Mtihani wa mwisho · Final course quiz", finalAssessment.title, finalAssessment.description, `${finalAssessment.questionCount} questions · pass ${finalAssessment.passPercent}%`)}
    <section class="panel quiz-shell">
      <div class="quiz-top"><span>Question ${index + 1} of ${questions.length}</span><strong>${Object.keys(finalQuizProgress.answers).length} answered</strong></div>
      <div class="progress-track"><span style="width:${(index / questions.length) * 100}%"></span></div>
      <span class="eyebrow">${escapeHtml(question.curriculumArea)} · from Unit ${question.sourceUnitNo}</span>
      <h2 class="quiz-question">${escapeHtml(question.question)}</h2>
      <div class="quiz-options">${String(question.options).split(" | ").map((option) => `<button class="quiz-option ${saved?.selected === option ? "active" : ""}" data-final-option="${escapeHtml(option)}" type="button" lang="sw">${escapeHtml(option)}</button>`).join("")}</div>
      <div class="audio-actions">
        <button class="button secondary" id="final-previous" type="button" ${index === 0 ? "disabled" : ""}>${icon("arrow-left")} Previous</button>
        ${index === questions.length - 1 ? `<button class="button gold" id="final-submit" type="button">Submit my quiz ${icon("check")}</button>` : `<button class="button primary" id="final-next" type="button">Next ${icon("arrow-right")}</button>`}
      </div>
      <p><small>Your answers save as you go. You can come back and finish later.</small></p>
    </section>`;
  $$("[data-final-option]").forEach((button) => button.addEventListener("click", () => {
    finalQuizProgress.answers[question.questionId] = { selected: button.dataset.finalOption, answeredAt: new Date().toISOString() };
    saveFinalQuizProgress();
    renderFinalQuiz();
  }));
  $("#final-previous")?.addEventListener("click", () => { finalQuizProgress.currentIndex = index - 1; saveFinalQuizProgress(); renderFinalQuiz(); });
  $("#final-next")?.addEventListener("click", () => {
    if (!finalQuizProgress.answers[question.questionId]) return toast("Choose an answer before moving on.");
    finalQuizProgress.currentIndex = index + 1;
    saveFinalQuizProgress();
    renderFinalQuiz();
  });
  $("#final-submit")?.addEventListener("click", () => {
    if (Object.keys(finalQuizProgress.answers).length < questions.length) return toast("Answer every question before submitting.");
    const results = calculateFinalQuizResults();
    finalQuizProgress.attempts.push({ attempt: finalQuizProgress.attempts.length + 1, submittedAt: new Date().toISOString(), score: results.score, total: results.total, percent: results.percent, passed: results.passed, areaScores: results.areaScores });
    finalQuizProgress.submitted = true;
    finalQuizProgress.completed = true;
    finalQuizProgress.passed = results.passed;
    saveFinalQuizProgress();
    emitProgress({ type: "checkpoint.result", unit: "final", section: "course-quiz", score: results.percent, passed: results.passed, attempt: finalQuizProgress.attempts.length });
    renderNav();
    renderFinalQuizResults(results);
  });
  icons();
}

function renderFinalQuizResults(results) {
  $("#app").innerHTML = `${pageHeader("Mtihani wa mwisho · Final course quiz", results.passed ? "Hongera! You passed." : "Not yet — review and try again.", `You scored ${results.score} of ${results.total} (${results.percent}%). The pass mark is ${finalAssessment.passPercent}%.`)}
    <section class="panel quiz-result"><div class="score-ring">${results.percent}%</div></section>
    <section class="panel"><h2>How you did by area</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Curriculum area</th><th>Score</th><th>Percent</th><th>What to do next</th></tr></thead><tbody>${results.areaScores.map((area) => `<tr><td>${escapeHtml(area.label)}</td><td>${area.score}/${area.total}</td><td>${area.percent}%</td><td>${area.percent >= finalAssessment.passPercent ? "Secure — keep using it in conversation." : "Review the linked units and try the quiz again."}</td></tr>`).join("")}</tbody></table></div></section>
    <p><button class="button secondary" id="final-retry" type="button">${icon("rotate-ccw")} Try the quiz again</button></p>`;
  $("#final-retry").addEventListener("click", () => {
    finalQuizProgress.answers = {};
    finalQuizProgress.currentIndex = 0;
    finalQuizProgress.submitted = false;
    finalQuizProgress.startedAt = null;
    saveFinalQuizProgress();
    renderFinalQuiz();
  });
  icons();
}

// --- AI Kiswahili -----------------------------------------------------------
function renderAI() {
  const prompts = course.dictionaryLinks.filter((link) => link.aiTutorPrompt).slice(0, 6);
  const speakingTask = course.speaking?.[0];
  if (!aiState.messages.length) {
    aiState.messages.push({ role: "assistant", text: `Karibu! I am your Kiswahili practice partner for Unit ${course.unit.unitNo}: ${course.unit.unitTitle}. Pick a prompt below, say it aloud, then write what you would answer.` });
    saveAIState();
  }
  $("#app").innerHTML = `${pageHeader("AI Kiswahili", "Practice partner", "Practise this unit's language out loud. Say a line, record it, and compare it with the model.", "Beta")}
    <div class="task-grid">
      <section class="panel">
        <h2>Zungumza · Talk</h2>
        <div class="self-list" id="ai-thread">${aiState.messages.map((message) => `<div class="self-row"><strong>${message.role === "assistant" ? "Mwalimu" : "Wewe"}</strong><p>${escapeHtml(message.text)}</p></div>`).join("")}</div>
        <div class="practice-box"><input id="ai-input" placeholder="Andika kwa Kiswahili…" aria-label="Write your reply in Kiswahili" lang="sw"><button class="button primary" id="ai-send" type="button">${icon("send")} Send</button></div>
        <p><small>Replies are practice prompts generated from this unit — this is a rehearsal partner, not a marking service.</small></p>
      </section>
      <aside class="panel">
        <h3>Anza na haya · Start with these</h3>
        <ul class="checklist">${prompts.map((link) => `<li><label><span>${escapeHtml(link.aiTutorPrompt)}</span></label>${voiceButton(link.swahili, `Listen to ${link.swahili}`)}</li>`).join("")}</ul>
        ${speakingTask ? `<h3>Sema kwa sauti · Say it aloud</h3><p class="rule-box" lang="sw">${escapeHtml(speakingTask.instructionsAndModelLines.split("\n")[0])}</p><div class="recorder"><button class="record-button" data-record="ai-${escapeHtml(speakingTask.speakingId)}" type="button" aria-label="Record your answer">${icon("mic")}</button><div><strong data-record-status="ai-${escapeHtml(speakingTask.speakingId)}">Ready to record</strong><small> Your recording stays on this device.</small></div></div><audio data-playback="ai-${escapeHtml(speakingTask.speakingId)}" controls hidden></audio>` : ""}
        <button class="button primary" id="ai-done" type="button">Finish AI practice ${icon("check")}</button>
      </aside>
    </div>`;
  const send = () => {
    const value = $("#ai-input").value.trim();
    if (!value) return;
    aiState.messages.push({ role: "learner", text: value });
    const next = prompts[aiState.messages.filter((message) => message.role === "learner").length % Math.max(prompts.length, 1)];
    aiState.messages.push({ role: "assistant", text: next ? next.aiTutorPrompt : "Vizuri! Try that line once more, a little faster." });
    saveAIState();
    renderAI();
  };
  $("#ai-send").addEventListener("click", send);
  $("#ai-input").addEventListener("keydown", (event) => { if (event.key === "Enter") send(); });
  $$("[data-record]").forEach((button) => button.addEventListener("click", () => toggleRecording(button.dataset.record, button)));
  $("#ai-done").addEventListener("click", () => complete("ai", "AI practice complete."));
  shellCtx.bindVoiceControls();
  icons();
}

// --- live, reflect, teacher -------------------------------------------------
function renderLive() {
  $("#app").innerHTML = `${pageHeader("Darasa · Learn with your teacher", "Live sessions", "Bring your self-paced work and one question. Your teacher will help you practise and improve.")}
    <div class="live-grid">${course.liveSessions.map((session) => `<article class="panel live-card"><time>Session ${session.sessionNo} · ${session.durationMin} minutes</time><h2>${escapeHtml(session.title)}</h2><h3>Before class</h3><p>${escapeHtml(session.beforeSession)}</p><h3>Class plan</h3><ol class="agenda">${String(session.agenda).split(";").map((item) => `<li>${escapeHtml(item.trim())}</li>`).join("")}</ol><h3>After class</h3><p>${escapeHtml(session.afterSession)}</p><button class="button primary" data-live-ready="${escapeHtml(session.liveSessionId)}" type="button">${icon("calendar-check")} I'm ready</button></article>`).join("")}</div>`;
  $$("[data-live-ready]").forEach((button) => button.addEventListener("click", () => { button.innerHTML = `${icon("check-circle")} Ready for class`; button.disabled = true; icons(); toast("Your live-session preparation is marked ready."); }));
}

function renderReflect() {
  $("#app").innerHTML = `${pageHeader("Tafakari · Pause and reflect", "My progress", "Choose the statement that best describes what you can do today. Honest reflection helps your teacher support you.")}
    <section class="panel"><div class="self-list">${course.selfAssessment.map((item) => `<div class="self-row"><strong>${escapeHtml(item.statement)}</strong>${String(item.scale).split(" | ").map((choice) => `<button class="self-choice ${progress.self[item.selfAssessmentId] === choice ? "selected" : ""}" data-self="${escapeHtml(item.selfAssessmentId)}" data-choice="${escapeHtml(choice)}" type="button">${escapeHtml(choice)}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="reflection-done" type="button">Save reflection ${icon("check")}</button></p></section>`;
  $$("[data-self]").forEach((button) => button.addEventListener("click", () => { progress.self[button.dataset.self] = button.dataset.choice; saveProgress(); renderReflect(); }));
  $("#reflection-done").addEventListener("click", () => {
    if (Object.keys(progress.self).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("reflect", "Reflection saved. Your teacher can now see where you need help.");
  });
}

function renderTeacher() {
  const assignment = course.assignments[0];
  $("#app").innerHTML = `${pageHeader("Teacher view", `Unit ${course.unit.unitNo} teaching resources`, "Implementation view for lesson delivery, assessment evidence and curriculum alignment.", "AI-assisted review · sign-off pending")}
    <div class="section-stack">
      <section class="panel approval-banner"><h2>Curriculum status</h2><p><strong>${escapeHtml(CURRICULUM_FRAMEWORK)}.</strong> ${escapeHtml(trackLabel())}, ${escapeHtml(course.unit.sourceLesson || "source lesson")}. Competency: ${escapeHtml(course.unit.competency)}.</p></section>
      ${assignment ? `<section class="panel teacher-banner"><h2>${escapeHtml(assignment.title)}</h2><p>${escapeHtml(assignment.instructions)}</p><p><strong>${assignment.marks} marks</strong> · ${escapeHtml(assignment.submissionType)} · Rubrics: ${escapeHtml(assignment.rubricIds)}</p></section>` : ""}
      <section class="panel"><h2>Outcome alignment</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>ID</th><th>Learning outcome</th><th>Evidence</th></tr></thead><tbody>${course.outcomes.map((outcome) => `<tr><td>${escapeHtml(String(outcome.outcomeId).split("-").pop())}</td><td>${escapeHtml(outcome.learningOutcome)}</td><td>${escapeHtml(outcome.evidenceOfLearning)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Teaching notes</h2>${course.teacherNotes.map((note) => `<details><summary>${escapeHtml(note.noteType)}</summary><p class="reading-text" style="font-family:inherit;font-size:14px">${escapeHtml(note.note)}</p></details>`).join("")}</section>
      ${course.culturalNotes?.length ? `<section class="panel"><h2>Cultural notes from the source manual</h2><ul>${course.culturalNotes.map((note) => `<li>${escapeHtml(note.note)}</li>`).join("")}</ul></section>` : ""}
      <section class="panel"><h2>Answer key and guidance</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Content</th><th>Type</th><th>Reviewed answer or guidance</th></tr></thead><tbody>${course.answerKey.map((answer) => `<tr><td>${escapeHtml(answer.contentId)}</td><td>${escapeHtml(answer.contentType)}</td><td>${escapeHtml(answer.answerOrGuidance)}</td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><h2>Rubric criteria</h2><div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Target</th><th>Criterion</th><th>Beginning</th><th>Secure</th><th>Marks</th></tr></thead><tbody>${course.rubrics.map((rubric) => `<tr><td>${escapeHtml(rubric.target)}</td><td>${escapeHtml(rubric.criterion)}</td><td>${escapeHtml(rubric.level1)}</td><td>${escapeHtml(rubric.level4)}</td><td>${rubric.maximumMarks}</td></tr>`).join("")}</tbody></table></div></section>
    </div>`;
}

// ===================== config + boot =====================
const config = {
  subjectKey: "kiswahili",
  param: "track",
  mediaSubject: "kiswahili",
  ttsPurpose: "ehel_kiswahili",
  stageDir: (track) => `track-${track}`,
  defaultUnit: (track) => (Number(track) === 1 ? 0 : 1),
  sections,
  nonCountable: ["overview", "reference", "live", "final-quiz"],
  gradeSections: [],
  progressDefaults: { completed: [], knownWords: [], self: {}, writing: {}, games: {} },
  gradeDefaults: { completed: [] },
  keys: (track, unit) => ({ progress: `ehel-kiswahili-t${track}-u${unit}-progress-v1` }),
  courseKey: (track) => `ehel-ksw-t${pad2(track)}`,
  extendSummary: (state, base) => ({ ...base, knownWords: state.knownWords ? [...state.knownWords] : undefined }),
  visibleSections,
  isSectionDone: (id) => (id === "final-quiz" ? finalQuizProgress.completed : progress.completed.includes(id)),
  onBeforeRender: () => { route = shellCtx.route; $("#app").setAttribute("aria-busy", "true"); },
  onAfterRender: () => { $("#app").setAttribute("aria-busy", "false"); applyTranslationVisibility(); icons(); },
  onNavRendered: () => icons(),
  renderers: {
    overview: () => renderOverview(),
    lecture: () => renderLecture(),
    ai: () => renderAI(),
    dictionary: () => renderDictionary(),
    dialogue: () => renderDialogue(),
    reading: () => renderReading(),
    comprehension: () => renderComprehension(),
    grammar: () => renderGrammar(),
    speaking: () => renderSpeaking(),
    writing: () => renderWriting(),
    activities: () => renderActivities(),
    games: () => renderGames(),
    quiz: () => renderQuiz(),
    reference: () => renderReference(),
    live: () => renderLive(),
    reflect: () => renderReflect(),
    "final-quiz": () => renderFinalQuiz(),
    teacher: () => renderTeacher(),
  },
  bind,
  async load(ctx) {
    const [manifestResponse, courseResponse, dictionaryResponse] = await Promise.all([
      fetch(new URL("course-manifest.json", ctx.dataRootUrl)),
      fetch(new URL(`units/unit-${unitNumber}.json`, ctx.dataRootUrl)),
      fetch(new URL(`master-dictionary.track${trackNumber}.json`, ctx.dataRootUrl)),
    ]);
    const failed = [manifestResponse, courseResponse, dictionaryResponse].find((response) => !response.ok);
    if (failed) throw new Error(`Course data could not be loaded (${failed.status} ${failed.url}).`);
    [manifest, course, dictionary] = await Promise.all([manifestResponse.json(), courseResponse.json(), dictionaryResponse.json()]);

    // Optional companions — a missing one hides its section rather than failing
    // the whole lesson, so a unit can ship before its games are authored.
    const [gameResponse, referenceResponse, finalResponse] = await Promise.all([
      fetch(new URL(`games/unit-${unitNumber}.json`, ctx.dataRootUrl)).catch(() => null),
      fetch(new URL("course-reference.json", referenceRootUrl)).catch(() => null),
      fetch(new URL("course-final-quiz.json", ctx.dataRootUrl)).catch(() => null),
    ]);
    if (gameResponse?.ok) gamePack = await gameResponse.json();
    if (referenceResponse?.ok) reference = await referenceResponse.json();
    if (finalResponse?.ok) finalAssessment = await finalResponse.json();

    resolveTrackAssets(course);
    resolveTrackAssets(dictionary);
    return { manifest, course };
  },
  async onReady() {
    if (location.hash.slice(1) === "final-quiz" && (unitNumber !== lastUnitNumber() || !finalAssessment)) location.hash = "overview";
    if (location.hash.slice(1) === "games" && !gamePack) location.hash = "overview";
    document.title = `Kiswahili · ${trackLabel()} | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    $("#course-label").innerHTML = `<span class="track-chip ${isTechnical() ? "technical" : ""}">${escapeHtml(trackLabel())}</span>`;
    $("#unit-title").textContent = course.unit.unitTitle;

    const trackSelect = $("#track-select");
    trackSelect.innerHTML = (manifest.tracks || [{ number: trackNumber, label: trackLabel() }])
      .map((track) => `<option value="${track.number}" ${track.number === trackNumber ? "selected" : ""}>${escapeHtml(track.label)}</option>`).join("");
    trackSelect.addEventListener("change", (event) => { location.href = trackLocation(event.target.value); });

    const unitOptions = manifest.units.map((unit) => `<option value="${unit.number}" ${unit.number === unitNumber ? "selected" : ""}>Unit ${unit.number}: ${escapeHtml(unit.title)}</option>`).join("");
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) {
      picker.innerHTML = unitOptions;
      picker.addEventListener("change", (event) => { location.href = courseLocation(event.target.value); });
    }

    shellCtx.updateVoiceUI();
  },
};

createCourseApp(config);
