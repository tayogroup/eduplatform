import { escapeHtml as sharedEscapeHtml, icon as sharedIcon, pageHeader as sharedPageHeader, sectionNavigation } from "../../shared/course-shell.js?v=20260715k";
import { initGeometryWebGL } from "./geometry-webgl.js?v=20260715q";
import { initMathWebGL } from "./math-webgl.js?v=math-20260721b";
import { unitTopic, mathDiagram } from "./math-visuals.js?v=math-20260721b";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
const stageNumber = Number(params.get("stage") || params.get("grade") || document.documentElement.dataset.stage || 2);
const unitNumber = Number(params.get("unit") || 1);
const stageRootUrl = new URL(`./grade-${stageNumber}/`, location.href);
const STORAGE_KEY = `ehel-math-s${stageNumber}-u${unitNumber}-progress-v1`;
const STAGE_STORAGE_KEY = `ehel-math-s${stageNumber}-capstone-progress-v1`;
const LEGACY_STORAGE_KEY = `ehel-math-g${stageNumber}-u${unitNumber}-progress-v1`;
const LEGACY_STAGE_STORAGE_KEY = `ehel-math-g${stageNumber}-capstone-progress-v1`;
const ELEVENLABS_ENDPOINT = ["localhost", "127.0.0.1"].includes(location.hostname) && location.port === "4287"
  ? "/api/elevenlabs-tts"
  : "/local/hubredirect/quiz_tts.php";
const ELEVENLABS_VOICE_ID = "XfNU2rGpBa01ckF309OY";

const sections = [
  ["overview", "layout-dashboard", "Unit Overview"],
  ["lesson", "book-open", "Teacher Lesson"],
  ["ai", "sparkles", "AI Math Tutor"],
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

// Official Cambridge framework for Mathematics: Primary (0096) covers
// Stages 1-6, Lower Secondary (0862) covers Stages 7-9. The stage number
// carries the grade level; there is no separate per-grade code.
function cambridgeFramework(stage) {
  return Number(stage) <= 6
    ? { level: "Cambridge Primary Mathematics", code: "0096" }
    : { level: "Cambridge Lower Secondary Mathematics", code: "0862" };
}
function cambridgeLabel(stage) {
  const fw = cambridgeFramework(stage);
  return `${fw.level} ${fw.code} — Stage ${stage}`;
}

let manifest;
let course;
let gradeCapstone;
let route = location.hash.slice(1) || "overview";
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
let currentPageNarration = "";
let speakingButton = null;
let voiceRequestId = 0;
const voicePlayer = typeof Audio === "function" ? new Audio() : null;
const voiceAudioCache = new Map();
const voiceAudioPending = new Map();
const voiceSupported = Boolean(voicePlayer && typeof fetch === "function");
let voiceEnabled = localStorage.getItem(`${STORAGE_KEY}-voice-enabled`) !== "false";
const progress = loadProgress();
const gradeProgress = loadGradeProgress();

function loadGradeProgress() {
  try {
    return { completed: [], capstoneResponses: {}, capstoneEvidence: {}, quizBest: 0, ...JSON.parse(localStorage.getItem(STAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_STAGE_STORAGE_KEY) || "{}") };
  } catch {
    return { completed: [], capstoneResponses: {}, capstoneEvidence: {}, quizBest: 0 };
  }
}

function saveGradeProgress() {
  localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(gradeProgress));
  renderNav();
}

function completeGradeSection(section, message) {
  if (!gradeProgress.completed.includes(section)) gradeProgress.completed.push(section);
  saveGradeProgress();
  if (message) toast(message);
}

function unitSectionIds() {
  return sections.map(([id]) => id).filter((id) => !["overview", "capstone", "capstonequiz"].includes(id));
}

function loadProgress() {
  try {
    return { completed: [], practiceOpened: [], reflection: {}, aiMessages: [], games: {}, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "{}") };
  } catch {
    return { completed: [], practiceOpened: [], reflection: {}, aiMessages: [], games: {} };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  updateProgress();
}

function escapeHtml(value = "") {
  return sharedEscapeHtml(value);
}

function icon(name, label = "") {
  return sharedIcon(name, label);
}

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
  if (speakingButton) {
    speakingButton.classList.remove("is-playing");
    speakingButton.setAttribute("aria-label", speakingButton.dataset.voiceLabel || "Listen");
    speakingButton.title = "ElevenLabs · approved Ehel voice";
  }
  speakingButton = null;
}

function paceNumberSequences(text) {
  const number = "\\b\\d+(?:st|nd|rd|th)?\\b";
  const sequence = new RegExp(`${number}(?:\\s*(?:,|;|and|or)?\\s*${number}){2,}`, "gi");
  return String(text || "").replace(sequence, (match) => {
    const values = match.match(new RegExp(number, "gi")) || [];
    return values.join(' <break time="0.40s" /> ');
  });
}

function containsNumberSequence(text) {
  return (String(text || "").match(/\b\d+(?:st|nd|rd|th)?\b/gi) || []).length >= 3;
}

function narrationChunks(text, maximum = 2600) {
  const lines = String(text || "").split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!lines.length) return [];
  const pacedLines = lines.flatMap((line) => {
    const pieces = [];
    for (let start = 0; start < line.length; start += 2200) pieces.push(line.slice(start, start + 2200));
    return pieces.map((piece) => {
      const isCounting = containsNumberSequence(piece);
      const pacedPiece = paceNumberSequences(piece);
      return {
        text: `${/[.!?;:]$/.test(pacedPiece) ? pacedPiece : `${pacedPiece}.`} <break time="0.65s" />`,
        speed: isCounting ? 0.78 : 0.90,
        isCounting,
      };
    });
  });
  const chunks = [];
  let current = "";
  for (const line of pacedLines) {
    if (line.isCounting) {
      if (current) chunks.push({ text: current, speed: 0.90 });
      current = "";
      chunks.push({ text: line.text, speed: line.speed });
    } else if (`${current} ${line.text}`.trim().length <= maximum) current = `${current} ${line.text}`.trim();
    else {
      if (current) chunks.push({ text: current, speed: 0.90 });
      current = line.text;
    }
  }
  if (current) chunks.push({ text: current, speed: 0.90 });
  return chunks;
}

function collectPageNarration() {
  const source = $("#app");
  if (!source) return currentPageNarration;
  const copy = source.cloneNode(true);
  copy.querySelectorAll(".voice-button, .audio-source, .status-chip, script, style, [hidden], [aria-hidden='true'], details:not([open]) > *:not(summary)").forEach((element) => element.remove());
  copy.querySelectorAll("input, textarea, select").forEach((element) => {
    const description = element.getAttribute("aria-label") || element.getAttribute("placeholder") || "";
    if (description) element.replaceWith(document.createTextNode(description));
    else element.remove();
  });
  const blockTags = new Set(["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BUTTON", "DD", "DETAILS", "DIV", "DL", "DT", "FIGCAPTION", "FIGURE", "FOOTER", "H1", "H2", "H3", "H4", "HEADER", "LABEL", "LI", "MAIN", "NAV", "OL", "P", "SECTION", "SUMMARY", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"]);
  const readNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.tagName === "BR") return "\n";
    const content = [...node.childNodes].map(readNode).join("");
    return blockTags.has(node.tagName) ? `\n${content}\n` : content;
  };
  return readNode(copy)
    .replace(/[✓★▶△◫☁▣⚑]/g, " ")
    .replace(/→/g, " then ")
    .replace(/·/g, ". ")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

async function elevenLabsAudioUrl(text, speed = 0.90) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) throw new Error("There is nothing to read.");
  const safeSpeed = Math.max(0.70, Math.min(1, Number(speed) || 0.90));
  const cacheKey = `${safeSpeed.toFixed(2)}\n${clean}`;
  if (voiceAudioCache.has(cacheKey)) return voiceAudioCache.get(cacheKey);
  if (voiceAudioPending.has(cacheKey)) return voiceAudioPending.get(cacheKey);
  const pending = fetch(ELEVENLABS_ENDPOINT, {
    method: "POST",
    headers: { Accept: "audio/mpeg", "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, purpose: "ehel_math", voiceId: ELEVENLABS_VOICE_ID, speed: safeSpeed }),
  }).then(async (response) => {
    if (!response.ok) throw new Error((await response.text()) || `ElevenLabs voice failed (${response.status}).`);
    const blob = await response.blob();
    if (!blob.size || !/^audio\//i.test(blob.type || "audio/mpeg")) throw new Error("The voice service returned invalid audio.");
    const url = URL.createObjectURL(blob);
    voiceAudioCache.set(cacheKey, url);
    if (voiceAudioCache.size > 30) {
      const oldest = voiceAudioCache.keys().next().value;
      URL.revokeObjectURL(voiceAudioCache.get(oldest));
      voiceAudioCache.delete(oldest);
    }
    return url;
  }).finally(() => voiceAudioPending.delete(cacheKey));
  voiceAudioPending.set(cacheKey, pending);
  return pending;
}

function playVoiceSource(source, requestId) {
  return new Promise((resolve, reject) => {
    if (requestId !== voiceRequestId) return resolve();
    voicePlayer.src = source;
    voicePlayer.onended = resolve;
    voicePlayer.onemptied = resolve;
    voicePlayer.onerror = () => reject(new Error("The ElevenLabs recording could not be played."));
    voicePlayer.play().catch(reject);
  });
}

async function speakText(text, button) {
  if (!voiceEnabled) return toast("Turn on Voice Guide first.");
  if (!voiceSupported) return toast("ElevenLabs Voice Guide is not supported by this browser.");
  if (speakingButton === button) { stopVoice(); return; }
  stopVoice();
  const requestId = voiceRequestId;
  speakingButton = button;
  button.classList.add("is-playing");
  button.setAttribute("aria-label", "Stop ElevenLabs narration");
  try {
    const chunks = narrationChunks(text);
    for (let index = 0; index < chunks.length; index += 1) {
      if (requestId !== voiceRequestId) return;
      button.title = `ElevenLabs narration ${index + 1} of ${chunks.length}`;
      const source = await elevenLabsAudioUrl(chunks[index].text, chunks[index].speed);
      await playVoiceSource(source, requestId);
    }
  } catch (error) {
    if (requestId === voiceRequestId) toast("ElevenLabs voice is unavailable. Please try again.");
  } finally {
    if (requestId === voiceRequestId) {
      button.classList.remove("is-playing");
      button.setAttribute("aria-label", button.dataset.voiceLabel || "Listen");
      button.title = "ElevenLabs · approved Ehel voice";
      speakingButton = null;
    }
  }
}

function bindVoiceControls() {
  const controls = [...$$('[data-page-voice]'), ...$$('[data-speak]')];
  controls.forEach((button) => {
    if (button.dataset.voiceBound) return;
    button.dataset.voiceBound = "true";
    button.dataset.voiceLabel = button.getAttribute("aria-label") || "Listen";
    button.disabled = !voiceSupported || !voiceEnabled;
    button.addEventListener("click", () => speakText(button.hasAttribute("data-page-voice") ? collectPageNarration() : button.dataset.speak, button));
  });
}

function updateVoiceUI() {
  const toggle = $("#voice-toggle");
  if (!toggle) return;
  toggle.innerHTML = voiceEnabled ? icon("volume-2") : icon("volume-x");
  toggle.disabled = !voiceSupported;
  toggle.setAttribute("aria-label", voiceSupported ? (voiceEnabled ? "Turn ElevenLabs Voice Guide off" : "Turn ElevenLabs Voice Guide on") : "ElevenLabs Voice Guide unavailable");
  toggle.title = voiceSupported ? (voiceEnabled ? "ElevenLabs Voice Guide is on" : "ElevenLabs Voice Guide is off") : "ElevenLabs Voice Guide unavailable";
  $$('[data-page-voice], [data-speak]').forEach((button) => { button.disabled = !voiceSupported || !voiceEnabled; });
}

function pageHeader(kicker, title, description, status = "Approved content") {
  currentPageNarration = `${title}. ${description}`;
  queueMicrotask(() => { bindVoiceControls(); updateVoiceUI(); });
  return sharedPageHeader({ kicker: escapeHtml(kicker), title: escapeHtml(title), description: escapeHtml(description), status: escapeHtml(status) });
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2400);
}

function complete(section, message) {
  if (!progress.completed.includes(section)) progress.completed.push(section);
  saveProgress();
  renderNav();
  if (message) toast(message);
}

function updateProgress() {
  const countable = unitSectionIds();
  const value = Math.round(countable.filter((id) => progress.completed.includes(id)).length / countable.length * 100);
  $("#progress-value").textContent = `${value}%`;
  $("#progress-fill").style.width = `${value}%`;
  $(".progress-track").setAttribute("aria-valuenow", value);
}

function renderNav() {
  $("#section-nav").innerHTML = sectionNavigation(sections.map(([id, sectionIcon, label]) => {
    const done = ["capstone", "capstonequiz"].includes(id) ? gradeProgress.completed.includes(id) : progress.completed.includes(id);
    return { id, iconName: sectionIcon, label, active: route === id, done };
  }));
  $$('[data-route]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
  const teacherSwitch = $("#teacher-switch");
  if (teacherSwitch) {
    teacherSwitch.classList.toggle("active", route === "teacher");
    if (!teacherSwitch.dataset.bound) {
      teacherSwitch.dataset.bound = "true";
      teacherSwitch.addEventListener("click", () => navigate("teacher"));
    }
  }
}

function navigate(next) {
  stopVoice();
  route = next;
  location.hash = next;
  renderNav();
  renderRoute();
  $("#content").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRoute() {
  const renderers = {
    overview: renderOverview,
    lesson: renderLesson,
    ai: renderAI,
    words: renderMathWords,
    explore: renderExploreConcept,
    visuals: renderVisualModels,
    method: renderLearnMethod,
    examples: renderExamples,
    guided: renderPractice,
    activities: renderActivities,
    games: renderGames,
    fluency: renderFluency,
    problems: renderRealProblems,
    explain: renderExplainThinking,
    challenge: renderAssessment,
    capstone: renderGradeCapstone,
    capstonequiz: renderCapstoneQuiz,
    live: renderLiveClass,
    progress: renderReflect,
    teacher: renderTeacher
  };
  $("#app").innerHTML = "";
  (renderers[route] || renderers.overview)();
  bindVoiceControls();
}

function renderOverview() {
  $("#app").innerHTML = `${pageHeader(`${(course.stage || course.grade).label} · ${course.term.label} · Unit ${course.unit.unitNo}`, course.unit.unitTitle, course.unit.unitOverview)}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner math-banner"><div class="banner-copy"><span>Your mathematics journey</span><h2>Explore ${escapeHtml(course.unit.unitTitle)}</h2><p>Discover the ideas in familiar situations, model them, learn reliable methods, practise with support and explain your thinking.</p><button class="button gold" data-go="lesson" type="button">▶ Start the lesson</button></div></section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome, index) => `<div class="outcome"><span>${index + 1}</span><p>${escapeHtml(outcome)}</p></div>`).join("")}</div></section>
      </div>
      <div class="section-stack">
        <section class="panel approval-banner"><span class="eyebrow">${escapeHtml(cambridgeFramework(stageNumber).level)} ${cambridgeFramework(stageNumber).code}</span><h3>Aligned to ${escapeHtml(cambridgeLabel(stageNumber))}</h3><p>Unit ${course.unit.unitNo} is structured from the ${escapeHtml(cambridgeLabel(stageNumber))} content package. Curriculum review required before classroom use.</p></section>
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.concepts.length}</strong><small>concepts</small></div><div class="stat"><strong>${course.practice.length}</strong><small>practice items</small></div><div class="stat"><strong>${course.activities.length}</strong><small>activities</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list"><li><span>1</span><span>Discover and model the concept.</span></li><li><span>2</span><span>Learn the method and study examples.</span></li><li><span>3</span><span>Practise with hints, games and fluency.</span></li><li><span>4</span><span>Solve real problems and explain your reasoning.</span></li><li><span>5</span><span>Complete the Unit Challenge and reflect.</span></li></ol></section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have completed ${progress.completed.length} learning steps on this device.` : "Your progress will save on this device as you learn."}</p><button class="button primary" data-go="${progress.completed.includes("lesson") ? "ai" : "lesson"}" type="button">Continue →</button></section>
      </div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

function renderMathWords() {
  const symbols = [["+", "combine or add", "Use when quantities join"], ["−", "find a difference", "Use when quantities separate"], ["=", "has the same value", "Both sides balance"], ["<", "is less than", "The smaller value"], [">", "is greater than", "The larger value"]];
  const terms = course.reference.terms.map(([term, meaning]) => `<article class="word-tile"><span>${escapeHtml(term.slice(0, 1))}</span><div><h3>${escapeHtml(term)}</h3><p>${escapeHtml(meaning)}</p></div></article>`).join("");
  $("#app").innerHTML = `${pageHeader("Language for mathematics", "Math Words & Symbols", `Learn the words and signs needed to discuss and explain ${escapeHtml(course.unit.unitTitle)}.`)}
    <div class="words-layout"><section class="panel"><h2>Key words</h2><div class="word-tile-grid">${terms}</div></section><section class="panel"><h2>Symbols in this unit</h2><div class="symbol-list">${symbols.map(([symbol, meaning, example]) => `<article><span>${symbol}</span><div><strong>${meaning}</strong><small>${example}</small></div></article>`).join("")}</div><button class="button primary" id="words-done" type="button">I know these words and symbols ✓</button></section></div>`;
  $("#words-done").addEventListener("click", () => { complete("words", "Math language step complete."); navigate("explore"); });
}

function renderExploreConcept() {
  let active = 0;
  const completed = new Set(progress.explorations || []);
  const draw = () => {
    const item = course.explorations[active];
    $("#app").innerHTML = `${pageHeader("Six familiar discoveries", "Explore the Concept", "Discover each idea through market, street, school, water, transport and family situations.")}
      <div class="exploration-tabs">${course.explorations.map((entry,index)=>`<button class="exploration-tab ${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-exploration="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.title)}</button>`).join("")}</div>
      <div class="story-layout"><section class="panel story-scene"><span class="eyebrow">Discovery ${active+1} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.title)}</h2>${mathDiagram(courseTopic(), active)}<p>${escapeHtml(item.context)}</p>${voiceButton(`${item.title}. ${item.context}. ${item.explanation}`, "Listen to discovery")}<div class="discovery-model ${escapeHtml(item.modelType)}"><strong>${escapeHtml(item.modelType.replaceAll('-',' '))}</strong><span>${escapeHtml(item.explanation)}</span></div></section><aside class="section-stack"><section class="panel"><h3>Discovery question</h3><p>${escapeHtml(item.prompt)}</p>${voiceButton(item.prompt, "Listen to question")}<input id="discovery-answer" class="math-input" aria-label="Discovery answer"><div class="question-actions"><button class="button primary" id="check-discovery" type="button">Check my idea</button><button class="button secondary" id="hint-discovery" type="button">Hint</button></div><div id="discovery-feedback"></div></section><section class="panel"><h3>Progress</h3><p><strong>${completed.size} of ${course.explorations.length}</strong> discoveries complete.</p><div class="progress-track"><span style="width:${completed.size/course.explorations.length*100}%"></span></div></section></aside></div>`;
    initMathWebGL($("#app"));
    $$('[data-exploration]').forEach(button=>button.addEventListener("click",()=>{active=Number(button.dataset.exploration);draw();}));
    $("#hint-discovery").addEventListener("click",()=>{$("#discovery-feedback").innerHTML=`<p class="feedback try"><strong>Hint:</strong> ${escapeHtml(item.hint)}</p>`;});
    $("#check-discovery").addEventListener("click",()=>{
      const response=$("#discovery-answer").value.trim().toLowerCase().replace(/\s+/g," ");
      const answer=item.answer.toLowerCase();
      const correct=response && (response===answer || answer.includes(response) || response.includes(answer));
      $("#discovery-feedback").innerHTML=`<p class="feedback ${correct?'good':'try'}"><strong>${correct?'Exactly!':'Look again.'}</strong> ${escapeHtml(correct?item.explanation:item.hint)}</p>`;
      if(correct){completed.add(item.id);progress.explorations=[...completed];saveProgress();if(completed.size===course.explorations.length)complete("explore","All six concept discoveries complete.");}
    });
  };
  draw();
}

function renderVisualModels() {
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

function renderLearnMethod() {
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
  return `<figure class="geometry-visual"><svg viewBox="0 0 380 180" aria-hidden="true" focusable="false">${visual.art}</svg><figcaption><strong>Visual example:</strong> ${escapeHtml(visual.caption)}</figcaption></figure>`;
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
    <figcaption><strong>Interactive example:</strong> ${escapeHtml(visual.caption)}</figcaption>
  </figure>`;
}

const courseTopic = () => unitTopic(course.unit.unitTitle, course.concepts);

function renderLesson() {
  const topic = courseTopic();
  const concepts = course.concepts.map((concept, index) => `<article class="panel concept-card"><span class="eyebrow">Concept ${index + 1}</span><h2>${escapeHtml(concept.title)}</h2>${mathDiagram(topic, index)}<p>${escapeHtml(concept.explanation)}</p><p class="example"><strong>Example:</strong> ${escapeHtml(concept.example)}</p>${voiceButton(`${concept.title}. ${concept.explanation}. Example: ${concept.example}`, "Listen to concept")}</article>`).join("");
  $("#app").innerHTML = `${pageHeader("Teacher lesson", course.unit.unitTitle, "Read the source-grounded concepts with a labelled diagram for each, and follow the complete ElevenLabs narration.")}
    <div class="concept-grid">${concepts}</div>
    <p><button class="button primary" id="lesson-done" type="button">I studied the concepts ✓</button></p>`;
  initGeometryWebGL($("#app"));
  initMathWebGL($("#app"));
  $("#lesson-done").addEventListener("click", () => { complete("lesson", "Teacher lesson marked studied."); navigate("ai"); });
}

function renderExamples() {
  let level="Basic";
  const viewed=new Set(progress.examplesViewed||[]);
  const draw=()=>{
    const items=course.workedExamples.filter(item=>item.difficulty===level);
    $("#app").innerHTML = `${pageHeader("Twelve examples · three levels", "Worked Examples", "Study four Basic, four Intermediate and four Challenge examples. Each solution explains why the step works.")}
      <div class="subtabs">${["Basic","Intermediate","Challenge"].map(item=>`<button class="subtab ${item===level?'active':''}" data-example-level="${item}" type="button">${item} · ${course.workedExamples.filter(example=>example.difficulty===item).length}</button>`).join('')}</div>
      <div class="task-grid">${items.map((item) => `<article class="panel"><span class="eyebrow">${escapeHtml(item.difficulty)} · ${escapeHtml(item.outcomeId)}</span><h3>${escapeHtml(item.title)}</h3><p class="rule-box">${escapeHtml(item.prompt)}</p>${voiceButton(`${item.title}. ${item.prompt}. Solution: ${item.solution}`, "Listen to example")}<details data-example="${item.id}"><summary>Show worked solution</summary><p>${escapeHtml(item.solution)}</p></details></article>`).join("")}</div>
      <section class="panel examples-progress"><strong>${viewed.size}/12</strong><span>solutions opened</span><div class="progress-track"><span style="width:${viewed.size/12*100}%"></span></div></section>`;
    $$('[data-example-level]').forEach(button=>button.addEventListener('click',()=>{level=button.dataset.exampleLevel;draw();}));
    $$('[data-example]').forEach(details=>details.addEventListener('toggle',()=>{if(details.open){viewed.add(details.dataset.example);progress.examplesViewed=[...viewed];saveProgress();if(viewed.size===course.workedExamples.length)complete('examples','All twelve worked examples reviewed.');}}));
  };
  draw();
}

function renderPractice() {
  const levels = [...new Set(course.practice.map((item) => item.level))];
  $("#app").innerHTML = `${pageHeader("Support that adapts", "Guided Practice", "Answer with support. Check your idea, ask for a progressive hint or reveal only the next mathematical step.")}
    <section class="panel support-strip"><span>Immediate feedback</span><span>Progressive hints</span><span>Next-step support</span><span>Error explanations</span><span>Easier retry</span></section>
    ${levels.map((level) => `<section class="section-stack" style="margin-bottom:24px"><h2>${escapeHtml(level)}</h2><div class="task-grid">${course.practice.filter((item) => item.level === level).map((item) => `<article class="panel question-card"><label for="answer-${item.id}">${escapeHtml(item.prompt)}</label>${voiceButton(item.prompt, "Listen to question")}<input id="answer-${item.id}" autocomplete="off" placeholder="Type your answer or working notes"><div class="question-actions"><button class="button primary" data-check="${item.id}" type="button">Check my answer</button><button class="button secondary" data-hint="${item.id}" type="button">Give me a hint</button><button class="button secondary" data-answer="${item.id}" type="button">Show next step</button></div><div id="feedback-${item.id}" aria-live="polite"></div></article>`).join("")}</div></section>`).join("")}`;
  $$('[data-check]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.check);
    const response = $(`#answer-${item.id}`).value.trim().toLowerCase().replace(/\s+/g," ");
    const expected = item.answer.toLowerCase();
    const correct = response && (expected.includes(response) || response.includes(expected));
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><strong>${correct ? "Correct reasoning!" : "Not yet."}</strong> ${correct ? escapeHtml(item.answer) : `Your response does not match the reviewed guidance yet. ${escapeHtml(item.hint)} Try representing the idea in a simpler way first.`}</p>`;
    if (correct && !progress.practiceOpened.includes(item.id)) { progress.practiceOpened.push(item.id); saveProgress(); }
    if (progress.practiceOpened.length === course.practice.length) complete("guided", "Guided Practice complete.");
  }));
  $$('[data-hint]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.hint);
    const used = Number(button.dataset.used || 0) + 1;
    button.dataset.used = String(used);
    const hints = [item.hint, `Use a diagram, familiar object, table, number line or other model that fits ${course.unit.unitTitle}.`, `The reviewed guidance is ${item.answer}. Explain why it fits before moving on.`];
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><strong>Hint ${Math.min(used,3)}:</strong> ${escapeHtml(hints[Math.min(used-1,2)])}</p>`;
  }));
  $$('[data-answer]').forEach((button) => button.addEventListener("click", () => {
    const item = course.practice.find((candidate) => candidate.id === button.dataset.answer);
    $(`#feedback-${item.id}`).innerHTML = `<p class="feedback try"><strong>Next step:</strong> ${escapeHtml(item.hint)} Do that step, then check your answer again.</p>`;
  }));
}

function renderActivities() {
  $("#app").innerHTML = `${pageHeader("Learn by doing", "Activities", `Complete six practical ${escapeHtml(course.unit.unitTitle)} investigations using familiar materials.`)}
    <div class="task-grid">${course.activities.map((activity, index) => `<article class="panel task-card"><span class="eyebrow">Activity ${index + 1} · Hands-on investigation</span><h2>${escapeHtml(activity.title)}</h2><p class="rule-box"><strong>You need:</strong> ${escapeHtml(activity.materials)}</p><ol class="agenda">${activity.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol><textarea class="activity-response" rows="4" placeholder="Record your answer or what you noticed…" aria-label="Notes for ${escapeHtml(activity.title)}"></textarea><button class="button secondary" data-activity-done="${index}" type="button">✓ Mark complete</button></article>`).join("")}</div>
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
  $("#game-feedback").innerHTML = `<div class="game-round-feedback ${correct?'good':'try'}"><span>${correct?'★':'💡'}</span><div><strong>${correct?'Star earned!':'Good try!'}</strong><p>${escapeHtml(explanation)}</p></div></div><button class="button primary" id="game-next" type="button">${gameRoundIndex+1===currentMathGame().rounds.length?'See my result':'Next challenge'} →</button>`;
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
    const response = $("#fluency-answer").value.trim().toLowerCase();
    const expected = items[index].answer.toLowerCase();
    const correct = response && (response===expected || expected.includes(response) || response.includes(expected));
    if (correct) score += 1;
    $("#fluency-score").textContent=score;
    $("#fluency-feedback").innerHTML=`<p class="feedback ${correct?'good':'try'}"><strong>${correct?'Correct!':'Review:'}</strong> ${escapeHtml(correct?items[index].answer:items[index].hint)}</p>`;
    index += 1;
    if (index >= items.length) {
      const seconds=Math.max(1,Math.round((Date.now()-startedAt)/1000));
      $("#fluency-time").textContent=`${seconds}s`;
      $("#check-fluency").disabled=true;
      $("#fluency-question").textContent=`${score} of ${items.length} accurate`;
      complete("fluency", "Math Fluency sprint complete.");
    } else draw();
  });
  $("#fluency-answer").addEventListener("keydown",event=>{if(event.key==="Enter")$("#check-fluency").click();});
  draw();
}

function renderRealProblems() {
  const problems = course.realProblems;
  $("#app").innerHTML = `${pageHeader("Mathematics in daily life", "Solve Real Problems", `Apply ${escapeHtml(course.unit.unitTitle)} to home, school, markets, travel and the wider community.`)}
    <div class="problem-grid">${problems.map((item,index)=>`<article class="panel real-problem"><div class="problem-icon">${["⌂","◫","🚌","▦","◇","✦"][index]||"#"}</div><span class="eyebrow">${escapeHtml(item.context)} · ${escapeHtml(item.difficulty)}</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt, "Listen to problem")}<textarea id="problem-${item.id}" placeholder="Show your calculation and answer…"></textarea><div class="question-actions"><button class="button primary" data-check-problem="${item.id}" type="button">Check answer</button><button class="button secondary" data-problem-hint="${item.id}" type="button">Hint</button></div><div id="problem-feedback-${item.id}"></div></article>`).join("")}</div>`;
  $$('[data-check-problem]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.checkProblem);const response=$(`#problem-${item.id}`).value.trim().toLowerCase();const expected=item.answer.toLowerCase();const correct=response&&(response===expected||expected.includes(response)||response.includes(expected));$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback ${correct?'good':'try'}"><strong>${correct?'Applied correctly!':'Check the situation.'}</strong> ${escapeHtml(correct?item.answer:item.hint)}</p>`;if(correct)button.disabled=true;if($$('[data-check-problem]').every(itemButton=>itemButton.disabled))complete("problems","Real-world problems complete.");}));
  $$('[data-problem-hint]').forEach(button=>button.addEventListener("click",()=>{const item=problems.find(candidate=>candidate.id===button.dataset.problemHint);$(`#problem-feedback-${item.id}`).innerHTML=`<p class="feedback try"><strong>Hint:</strong> ${escapeHtml(item.hint)}</p>`;}));
}

function renderExplainThinking() {
  let active=0;
  const completed=new Set(progress.reasoning||[]);
  const draw=()=>{const item=course.reasoningPrompts[active];$("#app").innerHTML=`${pageHeader("Reasoning matters", "Explain Your Thinking", `Explain the ideas in ${escapeHtml(course.unit.unitTitle)} using mathematical evidence, not only a final answer.`)}<div class="reasoning-tabs">${course.reasoningPrompts.map((entry,index)=>`<button class="${index===active?'active':''} ${completed.has(entry.id)?'done':''}" data-reasoning-index="${index}" type="button"><span>${index+1}</span>${escapeHtml(entry.difficulty)}</button>`).join('')}</div><div class="explain-layout"><section class="panel"><span class="eyebrow">Reasoning prompt</span><h2>${escapeHtml(item.prompt)}</h2>${voiceButton(item.prompt,"Listen to prompt")}<textarea id="reasoning-text" rows="9" placeholder="Explain what you know, what rule you used and why your conclusion makes sense…"></textarea><button class="button primary" id="check-reasoning-text" type="button">Check mathematical ideas</button><div id="reasoning-text-feedback"></div></section><section class="panel"><h3>Key ideas</h3><ul class="checklist">${item.keyIdeas.map((idea)=>`<li>${escapeHtml(idea)}</li>`).join('')}</ul><details><summary>Show model explanation</summary><p>${escapeHtml(item.modelAnswer)}</p>${voiceButton(item.modelAnswer,"Listen to model answer")}</details></section></div>`;$$('[data-reasoning-index]').forEach((button)=>button.addEventListener('click',()=>{active=Number(button.dataset.reasoningIndex);draw();}));$("#check-reasoning-text").addEventListener('click',()=>{const text=$("#reasoning-text").value.toLowerCase();const hits=item.keyIdeas.filter((idea)=>idea.toLowerCase().split(/\s+/).some((word)=>word.length>2&&text.includes(word))).length;const secure=text.length>30&&(hits>0||item.keyIdeas.length===0);$("#reasoning-text-feedback").innerHTML=`<p class="feedback ${secure?'good':'try'}"><strong>${secure?'Your explanation includes mathematical evidence.':'Add more mathematical evidence.'}</strong> ${secure?escapeHtml(item.modelAnswer):`Use these ideas: ${escapeHtml(item.keyIdeas.join(', '))}.`}</p>`;if(secure){completed.add(item.id);progress.reasoning=[...completed];saveProgress();if(completed.size===course.reasoningPrompts.length)complete('explain','Reasoning explanations complete.');}});};
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
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><strong>${correct ? "Correct!" : "Not quite."}</strong> ${escapeHtml(item.explanation)}</p>`;
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
    <div class="capstone-stage-grid">${project.stages.map((stage) => `<article class="panel capstone-stage ${gradeProgress.capstoneResponses[stage.id]?.trim().length >= 20 ? "complete" : ""}"><span class="eyebrow">Units ${stage.units.join(", ")}</span><h2>${escapeHtml(stage.title)}</h2><p>${escapeHtml(stage.prompt)}</p>${voiceButton(stage.prompt, `Listen to ${stage.title}`)}<label for="capstone-${stage.id}">Record your plan or evidence</label><textarea id="capstone-${stage.id}" data-capstone-response="${stage.id}" rows="5" placeholder="Write what you made, calculated or discovered…">${escapeHtml(gradeProgress.capstoneResponses[stage.id] || "")}</textarea><small><strong>Evidence:</strong> ${escapeHtml(stage.evidence)}</small></article>`).join("")}</div>
    <div class="capstone-review-grid"><section class="panel"><h2>Evidence checklist</h2><div class="capstone-checklist">${project.evidenceChecklist.map((item, index) => `<label><input type="checkbox" data-capstone-evidence="${index}" ${gradeProgress.capstoneEvidence[index] ? "checked" : ""}> <span>${escapeHtml(item)}</span></label>`).join("")}</div><button class="button primary" id="save-capstone" type="button">Save capstone progress</button></section><section class="panel"><h2>Success rubric</h2><div class="rubric-list">${project.rubric.map((item) => `<article><strong>${escapeHtml(item.criterion)}</strong><p>${escapeHtml(item.secure)}</p></article>`).join("")}</div></section></div>`;
  $("#save-capstone").addEventListener("click", () => {
    $$('[data-capstone-response]').forEach((field) => { gradeProgress.capstoneResponses[field.dataset.capstoneResponse] = field.value.trim(); });
    $$('[data-capstone-evidence]').forEach((field) => { gradeProgress.capstoneEvidence[field.dataset.capstoneEvidence] = field.checked; });
    const stagesDone = project.stages.every((stage) => (gradeProgress.capstoneResponses[stage.id] || "").length >= 20);
    const evidenceDone = project.evidenceChecklist.every((_, index) => gradeProgress.capstoneEvidence[index]);
    saveGradeProgress();
    if (stagesDone && evidenceDone) completeGradeSection("capstone", `${course.stage.label} Mathematics Capstone completed.`);
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
    $("#capstone-quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><strong>${correct ? "Correct!" : "Not quite."}</strong> ${escapeHtml(item.explanation)}</p>`;
    $("#next-capstone-question").hidden = false;
    $("#next-capstone-question").addEventListener("click", () => { capstoneQuizIndex += 1; drawCapstoneQuizQuestion(); });
  }));
}

function renderReference() {
  const terms = course.reference.terms.map(([term, meaning]) => `<tr><td><strong>${escapeHtml(term)}</strong></td><td>${escapeHtml(meaning)}</td></tr>`).join("");
  const mistakes = course.reference.commonMistakes.map(([mistake, correction]) => `<tr><td>${escapeHtml(mistake)}</td><td>${escapeHtml(correction)}</td></tr>`).join("");
  $("#app").innerHTML = `${pageHeader("Keep beside you", "Quick reference", `The key rules, words and corrections extracted from the Unit ${course.unit.unitNo} reference document.`)}
    <div class="reference-grid">${course.reference.rules.map((rule) => `<article class="panel rule-card"><h2>${escapeHtml(rule.title)}</h2><p>${escapeHtml(rule.text)}</p></article>`).join("")}</div>
    <div class="reference-grid" style="margin-top:18px"><section class="panel"><h2>Vocabulary</h2><table class="term-table"><thead><tr><th>Word</th><th>Meaning</th></tr></thead><tbody>${terms}</tbody></table></section><section class="panel"><h2>Common mistakes</h2><table class="term-table"><thead><tr><th>Mistake</th><th>Correct approach</th></tr></thead><tbody>${mistakes}</tbody></table></section></div>
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

function renderAI() {
  $("#app").innerHTML = `${pageHeader("Adaptive help without giving away answers", "AI Math Tutor", "Ask for a simpler explanation, a visual-model suggestion, an easier question or one progressive hint.", "Prototype tutor · no external AI connected")}
    <div class="overview-grid"><section class="panel"><div class="ai-conversation" id="ai-conversation">${progress.aiMessages.length ? progress.aiMessages.map((item) => `<article class="ai-message ${item.role}"><strong>${item.role === "user" ? "You" : "AI Math Tutor"}</strong>${escapeHtml(item.text)}${voiceButton(item.text, item.role === "user" ? "Listen again" : "Listen to tutor")}</article>`).join("") : `<article class="ai-message"><strong>AI Math Tutor</strong>Which part of ${escapeHtml(course.unit.unitTitle)} would you like a hint about?${voiceButton(`Which part of ${course.unit.unitTitle} would you like a hint about?`, "Listen to tutor")}</article>`}</div><div class="ai-prompts"><button data-ai-prompt="Explain the first concept in a simpler way" type="button">Explain more simply</button><button data-ai-prompt="Give me an easier question" type="button">Give an easier question</button><button data-ai-prompt="Which visual model should I use?" type="button">Suggest a model</button></div><form class="ai-compose" id="ai-form"><label class="sr-only" for="ai-input">Ask AI Math Tutor</label><input id="ai-input" maxlength="300" placeholder="Ask about ${escapeHtml(course.unit.unitTitle)}…"><button class="button primary" type="submit">Send</button></form></section><aside class="section-stack"><section class="panel review-banner"><h3>Prototype boundary</h3><p>This coach uses fixed Unit ${course.unit.unitNo} workbook guidance. It does not contact a model or claim to assess open-ended work.</p></section><section class="panel"><h3>Learning boundaries</h3><ul class="checklist"><li>Hints before answers</li><li>Workbook-approved content first</li><li>Easier questions when needed</li><li>Checkpoint choices stay yours</li></ul></section></aside></div>`;
  const submitTutorMessage = (message) => { progress.aiMessages.push({ role: "user", text: message }, { role: "assistant", text: buildTutorReply(message) }); progress.aiMessages = progress.aiMessages.slice(-16); saveProgress(); if (progress.aiMessages.length >= 6) complete("ai"); renderAI(); requestAnimationFrame(() => { const conversation = $("#ai-conversation"); conversation.scrollTop = conversation.scrollHeight; }); };
  $$('[data-ai-prompt]').forEach(button=>button.addEventListener("click",()=>submitTutorMessage(button.dataset.aiPrompt)));
  $("#ai-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#ai-input");
    const message = input.value.trim();
    if (!message) return;
    submitTutorMessage(message);
  });
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
      <section class="panel approval-banner"><h2>Curriculum status</h2><p><strong>${escapeHtml(cambridgeLabel(stageNumber))}.</strong> Content, progression, answer guidance and the 80% mastery threshold follow this framework. Curriculum review required before classroom use.</p></section>
      <section class="panel"><h2>Workbook provenance</h2><table class="term-table"><tbody><tr><th>Package</th><td>${escapeHtml(course.provenance.contentPackage)}</td></tr><tr><th>Archive</th><td>${escapeHtml(course.provenance.sourceArchive)}</td></tr><tr><th>Documents</th><td>${course.provenance.sourceDocuments.map(escapeHtml).join("; ")}</td></tr><tr><th>Imported blocks</th><td>${course.provenance.sourceBlockCount}</td></tr><tr><th>Transformation</th><td>${escapeHtml(course.provenance.transformation)}</td></tr></tbody></table></section>
      <section class="panel"><h2>Coverage</h2><div class="stat-row"><div class="stat"><strong>${course.outcomes.length}</strong><small>outcomes</small></div><div class="stat"><strong>${course.workedExamples.length}</strong><small>worked examples</small></div><div class="stat"><strong>${course.assessment.questions.length}</strong><small>checkpoint items</small></div></div></section>
      <section class="panel"><h2>Suggested teaching resources</h2><div class="reference-grid"><div><h3>Manipulatives</h3><p>${escapeHtml(course.activities.map((item)=>item.materials).slice(0,3).join('; '))}.</p></div><div><h3>Evidence to collect</h3><p>Model-building accuracy, Guided Practice responses, activity notes, game mastery, real-problem calculations and reasoning explanations.</p></div></div></section>
      <section class="panel"><h2>Lesson delivery</h2><p><strong>ElevenLabs narration is active.</strong> Learners can listen to the complete structured concept lesson or read it independently.</p></section>
    </div>`;
}

async function init() {
  try {
    if (stageNumber < 1 || stageNumber > 8 || unitNumber < 1 || unitNumber > 18) throw new Error(`The requested Stage ${stageNumber} Mathematics unit is unavailable.`);
    const [manifestResponse, courseResponse, capstoneResponse] = await Promise.all([
      fetch(new URL("data/course-manifest.json", stageRootUrl)),
      fetch(new URL(`data/units/unit-${unitNumber}.json`, stageRootUrl)),
      fetch(new URL("data/grade-capstone.json", stageRootUrl))
    ]);
    if (!manifestResponse.ok || !courseResponse.ok || !capstoneResponse.ok) throw new Error("The Mathematics course package could not be loaded.");
    [manifest, course, gradeCapstone] = await Promise.all([manifestResponse.json(), courseResponse.json(), capstoneResponse.json()]);
    const stage = course.stage || course.grade;
    document.title = `${stage.label} Mathematics | Unit ${course.unit.unitNo}: ${course.unit.unitTitle}`;
    $("#course-label").textContent = `${stage.label} · ${course.subject} · ${course.term.label}`;
    $("#unit-title").textContent = course.unit.unitTitle;
    $("#stage-select").innerHTML = Array.from({ length: 8 }, (_, index) => index + 1).map((stage) => `<option value="${stage}" ${stage === stageNumber ? "selected" : ""}>Stage ${stage}</option>`).join("");
    $("#stage-select").addEventListener("change", () => { location.href = `?stage=${Number($("#stage-select").value)}&unit=1#overview`; });
    const unitOptions = manifest.units.map((unit) => `<option value="${unit.number}" ${unit.number === unitNumber ? "selected" : ""}>Unit ${unit.number}: ${escapeHtml(unit.title)}</option>`).join("");
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) picker.innerHTML = unitOptions;
    for (const picker of [$("#unit-select"), $("#top-unit-select")]) picker.addEventListener("change", () => { const next=Number(picker.value); location.href=`?stage=${stageNumber}&unit=${next}#overview`; });
    $("#loading").remove();
    $("#app").hidden = false;
    renderNav();
    updateProgress();
    renderRoute();
  } catch (error) {
    console.error(error);
    const target = $("#loading") || $("#app");
    target.hidden = false;
    target.innerHTML = `<p><strong>We could not prepare the lesson.</strong><br>${escapeHtml(error.message)}</p>`;
  }
}

window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (next && next !== route) { route = next; renderNav(); renderRoute(); }
});
$("#voice-toggle").addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem(`${STORAGE_KEY}-voice-enabled`, String(voiceEnabled));
  if (!voiceEnabled) stopVoice();
  updateVoiceUI();
  toast(voiceEnabled ? "Voice Guide is on." : "Voice Guide is off.");
});
updateVoiceUI();
init();
