const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "ehel-english-g2-u2-progress-v1";

const sections = [
  ["overview", "layout-dashboard", "Overview"],
  ["lecture", "play-square", "Teacher lecture"],
  ["dictionary", "book-a", "Vocabulary"],
  ["reading", "book-open", "Reading & story"],
  ["comprehension", "list-checks", "Comprehension"],
  ["grammar", "braces", "Grammar"],
  ["speaking", "messages-square", "Speaking"],
  ["writing", "pencil-line", "Writing"],
  ["activities", "shapes", "Activities"],
  ["quiz", "badge-check", "Quiz"],
  ["live", "video", "Live sessions"],
  ["reflect", "sparkles", "My progress"],
];

let course;
let dictionary;
let route = location.hash.slice(1) || "overview";
let audioEnabled = true;
let mediaRecorder;
let recordedChunks = [];
let activeRecordingId = null;
let activeAudioEnd = null;
let activeAudioButton = null;
let audioRequestId = 0;
let activeWordId;
let activeSentence = 0;
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;

const progress = loadProgress();

function loadProgress() {
  try {
    return { completed: [], knownWords: [], self: {}, writing: {}, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { completed: [], knownWords: [], self: {}, writing: {} };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  updateProgress();
}

function complete(section, message) {
  if (!progress.completed.includes(section)) progress.completed.push(section);
  saveProgress();
  renderNav();
  if (message) toast(message);
}

function updateProgress() {
  const countable = sections.map(([id]) => id).filter((id) => !["overview", "live"].includes(id));
  const value = Math.round((countable.filter((id) => progress.completed.includes(id)).length / countable.length) * 100);
  $("#progress-value").textContent = `${value}%`;
  $("#progress-fill").style.width = `${value}%`;
  $(".progress-track").setAttribute("aria-valuenow", value);
}

function icon(name, label = "") {
  return `<i data-lucide="${name}"${label ? ` aria-label="${label}"` : ""}></i>`;
}

function icons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function pageHeader(kicker, title, description, status = "Approved content") {
  return `<header class="page-header"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${description}</p></div><span class="status-chip">${icon("shield-check")} ${status}</span></header>`;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function renderNav() {
  $("#section-nav").innerHTML = sections.map(([id, sectionIcon, label]) => {
    const done = progress.completed.includes(id);
    return `<button class="nav-button ${route === id ? "active" : ""}" data-route="${id}" type="button" title="${label}">${icon(sectionIcon)}<span>${label}</span><span class="nav-state ${done ? "done" : ""}">${done ? "✓" : ""}</span></button>`;
  }).join("");
  $$("[data-route]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
  $("#teacher-switch").classList.toggle("active", route === "teacher");
  icons();
}

function navigate(nextRoute) {
  route = nextRoute;
  location.hash = nextRoute;
  renderNav();
  renderRoute();
  $("#content").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRoute() {
  stopAudio();
  const renderers = {
    overview: renderOverview,
    lecture: renderLecture,
    dictionary: renderDictionary,
    reading: renderReading,
    comprehension: renderComprehension,
    grammar: renderGrammar,
    speaking: renderSpeaking,
    writing: renderWriting,
    activities: renderActivities,
    quiz: renderQuiz,
    live: renderLive,
    reflect: renderReflect,
    teacher: renderTeacher,
  };
  $("#app").innerHTML = "";
  (renderers[route] || renderers.overview)();
  icons();
}

function renderOverview() {
  const learningPath = course.unit.learningPath.split("\n").filter(Boolean);
  $("#app").innerHTML = `${pageHeader("Grade 2 · Term 1 · Unit 2", course.unit.unitTitle, "Meet community helpers, ask clear questions, describe actions and practise being a good neighbour.")}
    <div class="overview-grid">
      <div class="section-stack">
        <section class="unit-banner">
          <img src="${course.visual.image}" alt="${escapeHtml(course.visual.alt)}">
          <div class="banner-copy"><span>Your learning journey</span><h2>Meet the helpers on your street</h2><p>${escapeHtml(course.unit.unitOverview.split(". ").slice(0, 2).join(". "))}.</p><button class="button gold" data-go="lecture" type="button">${icon("play")} Start with Teacher Musa</button></div>
        </section>
        <section class="panel"><h2>What you will learn</h2><div class="outcome-list">${course.outcomes.map((outcome) => `<div class="outcome"><span>${outcome.sequence}</span><p>${escapeHtml(outcome.learningOutcome)}</p></div>`).join("")}</div></section>
      </div>
      <div class="section-stack">
        <section class="panel"><h3>Your unit at a glance</h3><div class="stat-row"><div class="stat"><strong>${course.dictionaryLinks.length}</strong><small>words</small></div><div class="stat"><strong>${course.readings.length}</strong><small>texts</small></div><div class="stat"><strong>${course.quizzes.length}</strong><small>quiz points</small></div></div></section>
        <section class="panel"><h3>Recommended path</h3><ol class="path-list">${learningPath.map((item) => `<li>${icon("circle-check-big")}<span>${escapeHtml(item)}</span></li>`).join("")}</ol></section>
        <section class="panel"><h3>Keep going</h3><p>${progress.completed.length ? `You have completed ${progress.completed.length} learning sections. Pick up where you left off.` : "Your progress will save on this device as you learn."}</p><button class="button primary" data-go="${progress.completed.includes("lecture") ? "dictionary" : "lecture"}" type="button">Continue ${icon("arrow-right")}</button></section>
      </div>
    </div>`;
  $$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
}

function renderLecture() {
  $("#app").innerHTML = `${pageHeader("Begin here", "Teacher audiovisual lecture", "Watch and listen before you begin the independent lesson. Captions are available in the player.")}
    <div class="lecture-layout">
      <section class="panel video-shell"><video id="lecture-video" controls preload="metadata" poster="${course.visual.lecturePoster}"><source src="${course.visual.lectureVideo}" type="video/mp4"><track kind="captions" src="${course.visual.lectureCaptions}" srclang="en" label="English" default></video><div class="video-footer"><p id="video-status">Teacher Musa · Unit 2 vocabulary</p><button class="button gold" id="lecture-done" type="button">${icon("check")} Mark watched</button></div></section>
      <div class="section-stack"><section class="panel"><span class="eyebrow">Before you learn</span><h2>Listen, look and repeat</h2><p>Teacher Musa introduces neighbours, community helpers, job equipment and action words ending in -ing.</p><ul class="checklist"><li>${icon("ear")} Hear every word in the approved ElevenLabs voice</li><li>${icon("captions")} Read along with captions</li><li>${icon("message-circle")} Pause and repeat aloud</li></ul></section><section class="panel"><h3>Ready after the video?</h3><p>Open the vocabulary dictionary to hear every word again at normal or slow speed.</p><button class="button primary" id="to-dictionary" type="button">Open vocabulary ${icon("arrow-right")}</button></section></div>
    </div>`;
  $("#lecture-done").addEventListener("click", () => complete("lecture", "Lecture marked complete."));
  $("#to-dictionary").addEventListener("click", () => { complete("lecture"); navigate("dictionary"); });
  $("#lecture-video").addEventListener("ended", () => complete("lecture", "Lecture complete. Your vocabulary lesson is ready."));
}

function linkedWords() {
  return course.dictionaryLinks.map((link) => ({ ...link, master: dictionary.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId) }));
}

function renderDictionary() {
  const words = linkedWords();
  activeWordId = activeWordId || words[0].vocabularyId;
  $("#app").innerHTML = `${pageHeader("Linked master dictionary", "Vocabulary lab", "Search the Grade 2 sub-dictionary. Every word links to one reusable master entry and approved pronunciation.", `${dictionary.entryCount} master entries`)}
    <div class="toolbar"><label class="search-box">${icon("search")}<input id="word-search" type="search" placeholder="Search words or meanings" aria-label="Search dictionary"></label><select id="group-filter" aria-label="Filter vocabulary group"><option value="all">All vocabulary groups</option>${course.vocabularyGroups.map((group) => `<option value="${group.id}">${escapeHtml(group.title)}</option>`).join("")}</select><span id="dictionary-count" class="status-chip">${words.length} words</span></div>
    <div class="dictionary-layout"><section class="panel word-list" id="word-list"></section><section class="panel word-card" id="word-card"></section></div>`;
  const drawList = () => {
    const query = $("#word-search").value.trim().toLowerCase();
    const group = $("#group-filter").value;
    const filtered = words.filter((item) => (group === "all" || item.groupId === group) && (!query || `${item.master.displayWord} ${item.childMeaning}`.toLowerCase().includes(query)));
    $("#dictionary-count").textContent = `${filtered.length} words`;
    $("#word-list").innerHTML = filtered.length ? filtered.map((item) => `<button class="word-row ${item.vocabularyId === activeWordId ? "active" : ""}" data-word="${item.vocabularyId}" type="button"><span><strong>${escapeHtml(item.master.displayWord)}</strong><small>${escapeHtml(item.master.partOfSpeech)} · ${escapeHtml(item.groupTitle)}</small></span>${progress.knownWords.includes(item.vocabularyId) ? "<span>LEARNED</span>" : ""}</button>`).join("") : `<div class="empty">No matching words found.</div>`;
    $$('[data-word]').forEach((button) => button.addEventListener("click", () => { activeWordId = button.dataset.word; activeSentence = 0; drawList(); drawWord(); }));
  };
  const drawWord = () => {
    const item = words.find((word) => word.vocabularyId === activeWordId) || words[0];
    const sentence = item.practiceSentences[activeSentence] || item.exampleSentence;
    $("#word-card").innerHTML = `<div class="word-card-head"><div><span class="word-type">${escapeHtml(item.master.partOfSpeech)}</span><h2>${escapeHtml(item.master.displayWord)}</h2><small>${escapeHtml(item.master.partOfSpeechDefinition)}</small></div><div class="audio-actions"><button class="icon-button" id="listen-word" type="button" title="Listen" aria-label="Listen to ${escapeHtml(item.master.displayWord)}">${icon("volume-2")}</button><button class="icon-button" id="slow-word" type="button" title="Listen slowly" aria-label="Listen slowly">${icon("snail")}</button></div></div><p class="meaning"><strong>Meaning:</strong> ${escapeHtml(item.childMeaning)}</p><div class="sentence-card"><small>In a sentence · ${activeSentence + 1} of ${item.practiceSentences.length}</small><p>${escapeHtml(sentence)}</p><div class="sentence-controls"><button class="icon-button" id="previous-sentence" type="button" aria-label="Previous sentence">${icon("arrow-left")}</button><div class="sentence-dots">${item.practiceSentences.map((_, index) => `<button class="sentence-dot ${index === activeSentence ? "active" : ""}" data-sentence="${index}" type="button" aria-label="Sentence ${index + 1}"></button>`).join("")}</div><button class="button ghost" id="hear-sentence" type="button">${icon("volume-2")} Hear sentence</button><button class="icon-button" id="next-sentence" type="button" aria-label="Next sentence">${icon("arrow-right")}</button></div></div><div><strong>Spelling:</strong> ${escapeHtml(item.spellingPractice)}</div><div class="practice-box"><input id="word-sentence" maxlength="180" placeholder="${escapeHtml(item.sentenceStarter)}…" aria-label="Write your own sentence"><button class="button primary" id="check-word-sentence" type="button">Check sentence</button></div><div id="word-feedback"></div><button class="button secondary" id="know-word" type="button">${progress.knownWords.includes(item.vocabularyId) ? icon("check-circle") + " Learned" : icon("bookmark-plus") + " I know this word"}</button>`;
    const play = (slow = false, button = null) => playAudio(item.master.audio.normal, {
      rate: slow ? item.master.audio.slowPlaybackRate : 1,
      start: item.master.audio.cueStart,
      end: item.master.audio.cueEnd,
      button,
    });
    $("#listen-word").addEventListener("click", (event) => play(false, event.currentTarget));
    $("#slow-word").addEventListener("click", (event) => play(true, event.currentTarget));
    $("#hear-sentence").addEventListener("click", (event) => {
      const descriptor = item.sentenceAudio[activeSentence];
      if (!descriptor) return toast("This ElevenLabs sentence clip is not available yet.");
      playAudio(descriptor.source, { start: descriptor.cueStart, end: descriptor.cueEnd, button: event.currentTarget });
    });
    $("#previous-sentence").addEventListener("click", () => { activeSentence = (activeSentence - 1 + item.practiceSentences.length) % item.practiceSentences.length; drawWord(); icons(); });
    $("#next-sentence").addEventListener("click", () => { activeSentence = (activeSentence + 1) % item.practiceSentences.length; drawWord(); icons(); });
    $$('[data-sentence]').forEach((dot) => dot.addEventListener("click", () => { activeSentence = Number(dot.dataset.sentence); drawWord(); icons(); }));
    $("#check-word-sentence").addEventListener("click", () => {
      const value = $("#word-sentence").value.trim();
      const usesWord = value.toLowerCase().includes(item.master.displayWord.toLowerCase());
      const complete = value.length >= 8 && /[.!?]$/.test(value);
      $("#word-feedback").innerHTML = `<p class="feedback ${usesWord && complete ? "good" : "try"}">${usesWord && complete ? "Strong sentence: you used the word and end punctuation." : `Try a complete sentence using “${escapeHtml(item.master.displayWord)}” and finish with punctuation.`}</p>`;
    });
    $("#know-word").addEventListener("click", () => {
      if (!progress.knownWords.includes(item.vocabularyId)) progress.knownWords.push(item.vocabularyId);
      if (progress.knownWords.length >= Math.ceil(words.length * .8)) complete("dictionary"); else saveProgress();
      drawList(); drawWord(); icons(); toast(`${item.master.displayWord} added to My Word Book.`);
    });
    icons();
  };
  $("#word-search").addEventListener("input", drawList);
  $("#group-filter").addEventListener("change", drawList);
  drawList(); drawWord();
}

function setAudioButton(button, playing) {
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-busy", String(playing));
}

function stopAudio() {
  audioRequestId += 1;
  const player = $("#word-audio");
  player.pause();
  activeAudioEnd = null;
  setAudioButton(activeAudioButton, false);
  activeAudioButton = null;
}

function playAudio(source, { rate = 1, start = 0, end = null, button = null } = {}) {
  if (!audioEnabled) return toast("Sound is muted. Use the sound button in the header to turn it on.");
  const player = $("#word-audio");
  stopAudio();
  const requestId = audioRequestId;
  activeAudioEnd = Number.isFinite(end) ? end : null;
  activeAudioButton = button;
  setAudioButton(button, true);
  const absoluteSource = new URL(source, document.baseURI).href;
  const begin = () => {
    if (requestId !== audioRequestId) return;
    player.currentTime = Number.isFinite(start) ? start : 0;
    player.playbackRate = rate;
    player.play().catch(() => {
      if (requestId !== audioRequestId) return;
      setAudioButton(button, false);
      toast("The ElevenLabs recording could not be played. Please try again.");
    });
  };
  if (player.currentSrc !== absoluteSource) {
    player.src = source;
    player.addEventListener("loadedmetadata", begin, { once: true });
    player.load();
  } else {
    begin();
  }
}

$("#word-audio").addEventListener("timeupdate", (event) => {
  if (activeAudioEnd !== null && event.currentTarget.currentTime >= activeAudioEnd) stopAudio();
});
$("#word-audio").addEventListener("ended", stopAudio);

function renderReading() {
  let selected = course.readings[0].readingId;
  $("#app").innerHTML = `${pageHeader("Read, listen and imagine", "Reading & story", "Choose a text, listen to it aloud, and follow the words as you read.")}<div class="reading-layout"><nav class="reading-list" id="reading-list"></nav><article class="panel" id="reading-panel"></article></div>`;
  const draw = () => {
    $("#reading-list").innerHTML = course.readings.map((reading) => `<button class="reading-button ${selected === reading.readingId ? "active" : ""}" data-reading="${reading.readingId}" type="button"><strong>${escapeHtml(reading.title)}</strong><small>${escapeHtml(reading.type)}</small></button>`).join("");
    const reading = course.readings.find((item) => item.readingId === selected);
    $("#reading-panel").innerHTML = `<div class="listen-bar"><div><span class="eyebrow">${escapeHtml(reading.type)}</span><h2>${escapeHtml(reading.title)}</h2><small class="audio-source">ElevenLabs · approved Ehel voice</small></div><div class="audio-actions"><button class="button secondary" id="read-aloud" type="button">${icon("volume-2")} Listen</button><button class="button secondary" id="read-slow" type="button">${icon("snail")} Slow</button><button class="icon-button" id="stop-reading" type="button" aria-label="Stop reading" title="Stop">${icon("square")}</button></div></div>${reading.genre ? `<p><strong>${escapeHtml(reading.genre)}</strong> · ${escapeHtml(reading.setting)}</p>` : ""}<div class="reading-text">${escapeHtml(reading.passageScript)}</div><button class="button primary" id="reading-done" type="button">I finished this text ${icon("check")}</button>`;
    $$('[data-reading]').forEach((button) => button.addEventListener("click", () => { selected = button.dataset.reading; stopAudio(); draw(); icons(); }));
    $("#read-aloud").addEventListener("click", (event) => playAudio(reading.audio.source, { button: event.currentTarget }));
    $("#read-slow").addEventListener("click", (event) => playAudio(reading.audio.source, { rate: .78, button: event.currentTarget }));
    $("#stop-reading").addEventListener("click", stopAudio);
    $("#reading-done").addEventListener("click", () => complete("reading", `${reading.title} marked as read.`));
    icons();
  };
  draw();
}

function renderComprehension() {
  const groups = [...new Set(course.comprehension.map((question) => question.section))];
  let active = groups[0];
  const draw = () => {
    const questions = course.comprehension.filter((question) => question.section === active);
    $("#app").innerHTML = `${pageHeader("Think about the text", "Comprehension", "Write your answer first. Then reveal the reviewed guidance and improve your response.")}<div class="subtabs">${groups.map((group) => `<button class="subtab ${group === active ? "active" : ""}" data-group="${escapeHtml(group)}" type="button">${escapeHtml(group)}</button>`).join("")}</div><section class="panel"><div class="question-list">${questions.map((question) => `<div class="question"><label for="answer-${question.questionId}">${question.sequence}. ${escapeHtml(question.question)}</label><textarea id="answer-${question.questionId}" data-answer-input="${question.questionId}" placeholder="Write a complete answer…"></textarea><button class="button secondary" data-check-answer="${question.questionId}" type="button">Check guidance</button><div id="feedback-${question.questionId}"></div></div>`).join("")}</div><button class="button primary" id="comprehension-done" type="button">Finish comprehension ${icon("check")}</button></section>`;
    $$('[data-group]').forEach((button) => button.addEventListener("click", () => { active = button.dataset.group; draw(); }));
    $$('[data-check-answer]').forEach((button) => button.addEventListener("click", () => {
      const question = course.comprehension.find((item) => item.questionId === button.dataset.checkAnswer);
      const value = $(`#answer-${question.questionId}`).value.trim();
      $(`#feedback-${question.questionId}`).innerHTML = value.length < 4 ? `<p class="feedback try">Write your own answer before viewing the guidance.</p>` : `<p class="feedback good"><strong>Reviewed guidance:</strong> ${escapeHtml(question.correctAnswer)}</p>`;
    }));
    $("#comprehension-done").addEventListener("click", () => complete("comprehension", "Comprehension practice complete."));
    icons();
  };
  draw();
}

function renderGrammar() {
  $("#app").innerHTML = `${pageHeader("Language focus", "Grammar workshop", "Complete six practices: guided recognition followed by independent language use.")}<div class="grammar-grid">${course.grammar.map((lesson) => `<article class="panel grammar-card"><div class="word-card-head"><span class="lesson-number">${lesson.sequence}</span><span class="word-type">${escapeHtml(lesson.practiceType)}</span></div><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.explanation)}</p>${lesson.ruleAndExamples ? `<div class="rule-box">${escapeHtml(lesson.ruleAndExamples)}</div>` : ""}${lesson.commonMistake ? `<p class="mistake">${escapeHtml(lesson.commonMistake)}</p>` : ""}${lesson.memoryTip ? `<p><strong>Memory tip:</strong> ${escapeHtml(lesson.memoryTip)}</p>` : ""}<details><summary>Show practice</summary><p class="rule-box">${escapeHtml(lesson.practice)}</p></details><div class="audio-actions"><button class="button secondary" data-grammar-audio="${lesson.grammarId}" data-rate="1" type="button">${icon("volume-2")} Listen</button><button class="button secondary" data-grammar-audio="${lesson.grammarId}" data-rate="0.78" type="button">${icon("snail")} Slow</button></div><small class="audio-source">ElevenLabs · approved Ehel voice</small></article>`).join("")}</div><p><button class="button primary" id="grammar-done" type="button">I practised all six lessons ${icon("check")}</button></p>`;
  $$('[data-grammar-audio]').forEach((button) => button.addEventListener("click", () => {
    const lesson = course.grammar.find((item) => item.grammarId === button.dataset.grammarAudio);
    playAudio(lesson.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  $("#grammar-done").addEventListener("click", () => complete("grammar", "Grammar workshop complete."));
}

function renderSpeaking() {
  $("#app").innerHTML = `${pageHeader("Use your voice", "Dialogue & speaking", "Complete six speaking practices. Listen to the ElevenLabs model, rehearse, record, and listen back.")}<div class="task-grid">${course.speaking.map((task) => `<article class="panel task-card"><span class="eyebrow">Practice ${task.sequence} · ${escapeHtml(task.activityType)}</span><h3>${escapeHtml(task.title)}</h3><p class="rule-box">${escapeHtml(task.instructionsAndModelLines)}</p><div class="audio-actions"><button class="button secondary" data-model="${task.speakingId}" data-rate="1" type="button">${icon("volume-2")} Hear model</button><button class="button secondary" data-model="${task.speakingId}" data-rate="0.78" type="button">${icon("snail")} Slow</button></div><small class="audio-source">ElevenLabs · approved Ehel voice</small>${task.recordingRequired ? `<div class="recorder"><button class="record-button" data-record="${task.speakingId}" type="button" aria-label="Start recording for ${escapeHtml(task.title)}">${icon("mic")}</button><div><strong data-record-status="${task.speakingId}">Ready to record</strong><small> Your recording stays on this device.</small></div></div><audio data-playback="${task.speakingId}" controls hidden></audio>` : ""}</article>`).join("")}</div><p><button class="button primary" id="speaking-done" type="button">Finish six speaking practices ${icon("check")}</button></p>`;
  $$('[data-model]').forEach((button) => button.addEventListener("click", () => {
    const task = course.speaking.find((item) => item.speakingId === button.dataset.model);
    playAudio(task.audio.source, { rate: Number(button.dataset.rate), button });
  }));
  $$('[data-record]').forEach((button) => button.addEventListener("click", () => toggleRecording(button.dataset.record, button)));
  $("#speaking-done").addEventListener("click", () => complete("speaking", "Speaking practice complete."));
}

async function toggleRecording(taskId, button) {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Audio recording is not supported in this browser.");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeRecordingId = taskId;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (event) => { if (event.data.size) recordedChunks.push(event.data); });
    mediaRecorder.addEventListener("stop", () => {
      const audio = $(`[data-playback="${activeRecordingId}"]`);
      audio.src = URL.createObjectURL(new Blob(recordedChunks, { type: mediaRecorder.mimeType }));
      audio.hidden = false;
      $(`[data-record-status="${activeRecordingId}"]`).textContent = "Recording ready. Listen back.";
      const activeButton = $(`[data-record="${activeRecordingId}"]`);
      activeButton.classList.remove("recording");
      activeButton.innerHTML = icon("mic");
      stream.getTracks().forEach((track) => track.stop());
      icons();
    });
    mediaRecorder.start();
    $(`[data-record-status="${taskId}"]`).textContent = "Recording… tap to stop";
    button.classList.add("recording");
    button.innerHTML = icon("square");
    icons();
  } catch {
    toast("Microphone permission is needed to record your introduction.");
  }
}

function renderWriting() {
  let active = course.writing[0].writingId;
  const draw = () => {
    const task = course.writing.find((item) => item.writingId === active);
    const saved = progress.writing[active] || "";
    $("#app").innerHTML = `${pageHeader("Plan, write and improve", "Writing studio", "Choose a task. Your draft saves automatically on this device.")}<div class="subtabs">${course.writing.map((item) => `<button class="subtab ${active === item.writingId ? "active" : ""}" data-writing="${item.writingId}" type="button">Writing ${item.sequence}</button>`).join("")}</div><div class="task-grid"><section class="panel"><h2>${escapeHtml(task.title)}</h2><p class="rule-box">${escapeHtml(task.promptAndInstructions)}</p><details><summary>View model text</summary><p class="model">${escapeHtml(task.modelText)}</p></details><p><strong>Expected:</strong> ${escapeHtml(task.expectedLength)}</p><textarea id="writing-draft" placeholder="${escapeHtml(task.sentenceStarter)}">${escapeHtml(saved)}</textarea><p id="save-status"><small>${saved ? "Draft restored" : "Start writing when you are ready"}</small></p></section><aside class="panel"><h3>Writer's checklist</h3><ul class="checklist">${task.successCriteria.split(";").map((criterion, index) => `<li><label><input type="checkbox" data-writing-check="${index}"><span>${escapeHtml(criterion.trim())}</span></label></li>`).join("")}</ul><h3>Support</h3><p>${escapeHtml(task.support)}</p><h3>Challenge</h3><p>${escapeHtml(task.extension)}</p><button class="button primary" id="writing-done" type="button">Submit this draft ${icon("send")}</button></aside></div>`;
    $$('[data-writing]').forEach((button) => button.addEventListener("click", () => { active = button.dataset.writing; draw(); }));
    let saveTimer;
    $("#writing-draft").addEventListener("input", (event) => { clearTimeout(saveTimer); $("#save-status").innerHTML = "<small>Saving…</small>"; saveTimer = setTimeout(() => { progress.writing[active] = event.target.value; saveProgress(); $("#save-status").innerHTML = "<small>Draft saved</small>"; }, 350); });
    $("#writing-done").addEventListener("click", () => {
      const draft = $("#writing-draft").value.trim();
      if (draft.split(/\s+/).length < 8) return toast("Add a little more to your draft before submitting.");
      progress.writing[active] = draft; complete("writing", "Writing draft saved to your learning portfolio.");
    });
    icons();
  };
  draw();
}

function renderActivities() {
  const jobStatements = [
    ["Police officers help keep people safe.", true, "Police officers help keep people safe."],
    ["Doctors grow crops and vegetables.", false, "Doctors help sick people; farmers grow crops."],
    ["Bus drivers take people from place to place.", true, "Bus drivers carry passengers from place to place."],
    ["Teachers put out fires in buildings.", false, "Teachers teach students; firefighters put out fires."],
  ];
  $("#app").innerHTML = `${pageHeader("Learn by doing", "Activities", "Complete six practical challenges about jobs, equipment, actions and helpful neighbours.")}<div class="task-grid"><section class="panel"><span class="eyebrow">Interactive · Activity 3</span><h2>Jobs: true or false?</h2><div class="question-list">${jobStatements.map(([statement], index) => `<div class="question"><strong>${index + 1}. ${statement}</strong><div class="audio-actions"><button class="button secondary" data-fact="${index}" data-value="true" type="button">True</button><button class="button secondary" data-fact="${index}" data-value="false" type="button">False</button></div><div id="fact-${index}"></div></div>`).join("")}</div></section>${course.activities.filter((activity) => activity.sequence !== 3).map((activity) => `<article class="panel task-card"><span class="eyebrow">${escapeHtml(activity.deliveryMode)}</span><h3>${escapeHtml(activity.title)}</h3><p class="rule-box">${escapeHtml(activity.instructionsAndItems)}</p><button class="button secondary" data-activity-done="${activity.activityId}" type="button">${icon("check")} Mark complete</button></article>`).join("")}</div><p><button class="button primary" id="activities-done" type="button">Finish activities ${icon("check")}</button></p>`;
  $$('[data-fact]').forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.fact);
    const correct = String(jobStatements[index][1]) === button.dataset.value;
    $(`#fact-${index}`).innerHTML = `<p class="feedback ${correct ? "good" : "try"}">${correct ? `Correct! ${escapeHtml(jobStatements[index][2])}` : `Try again. ${escapeHtml(jobStatements[index][2])}`}</p>`;
  }));
  $$('[data-activity-done]').forEach((button) => button.addEventListener("click", () => { button.disabled = true; button.innerHTML = `${icon("check-circle")} Complete`; icons(); }));
  $("#activities-done").addEventListener("click", () => complete("activities", "Unit activities complete."));
}

function renderQuiz() {
  quizIndex = 0; quizScore = 0; quizLocked = false;
  $("#app").innerHTML = `${pageHeader("Unit checkpoint", "Quick quiz", "Answer ten questions. You will see feedback after each answer and can try again.")}<section class="panel quiz-shell" id="quiz-shell"></section>`;
  drawQuizQuestion();
}

function drawQuizQuestion() {
  const shell = $("#quiz-shell");
  if (quizIndex >= course.quizzes.length) {
    const percent = Math.round((quizScore / course.quizzes.length) * 100);
    shell.innerHTML = `<div class="quiz-result"><div class="score-ring">${quizScore}/${course.quizzes.length}</div><span class="eyebrow">Checkpoint complete</span><h2>${percent >= 80 ? "Excellent word power!" : "Good effort. Review and try again."}</h2><p>You scored ${percent}% and earned ${quizScore * 10} XP.</p><div class="audio-actions" style="justify-content:center"><button class="button secondary" id="retry-quiz" type="button">${icon("rotate-ccw")} Try again</button><button class="button primary" id="quiz-done" type="button">Continue ${icon("arrow-right")}</button></div></div>`;
    $("#retry-quiz").addEventListener("click", renderQuiz);
    $("#quiz-done").addEventListener("click", () => { if (percent >= 60) complete("quiz"); navigate("reflect"); });
    if (percent >= 60) complete("quiz", "Quiz passed. Well done!");
    icons(); return;
  }
  const question = course.quizzes[quizIndex];
  const options = question.options.split(" | ");
  shell.innerHTML = `<div class="quiz-top"><span>Question ${quizIndex + 1} of ${course.quizzes.length}</span><strong>${quizScore} correct</strong></div><div class="progress-track"><span style="width:${(quizIndex / course.quizzes.length) * 100}%"></span></div><h2 class="quiz-question">${escapeHtml(question.question)}</h2><div class="quiz-options">${options.map((option) => `<button class="quiz-option" data-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback"></div><button class="button primary" id="next-quiz" type="button" hidden>Next question ${icon("arrow-right")}</button>`;
  quizLocked = false;
  $$('[data-option]').forEach((button) => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.option === String(question.correctAnswer);
    if (correct) quizScore += 1;
    button.classList.add(correct ? "correct" : "wrong");
    if (!correct) $$('[data-option]').find((option) => option.dataset.option === String(question.correctAnswer))?.classList.add("correct");
    $("#quiz-feedback").innerHTML = `<p class="feedback ${correct ? "good" : "try"}"><strong>${correct ? "Correct!" : "Not quite."}</strong> ${escapeHtml(question.explanation)}</p>`;
    $("#next-quiz").hidden = false;
    $("#next-quiz").addEventListener("click", () => { quizIndex += 1; drawQuizQuestion(); });
  }));
  icons();
}

function renderLive() {
  $("#app").innerHTML = `${pageHeader("Learn with your teacher", "Live sessions", "Bring your self-paced work and one question. Your teacher will help you practise, receive feedback and improve.")}<div class="live-grid">${course.liveSessions.map((session) => `<article class="panel live-card"><time>Session ${session.sessionNo} · ${session.durationMin} minutes</time><h2>${escapeHtml(session.title)}</h2><h3>Before class</h3><p>${escapeHtml(session.beforeSession)}</p><h3>Class plan</h3><ol class="agenda">${session.agenda.split(";").map((item) => `<li>${escapeHtml(item.trim())}</li>`).join("")}</ol><h3>After class</h3><p>${escapeHtml(session.afterSession)}</p><button class="button primary" data-live-ready="${session.liveSessionId}" type="button">${icon("calendar-check")} I'm ready</button></article>`).join("")}</div>`;
  $$('[data-live-ready]').forEach((button) => button.addEventListener("click", () => { button.innerHTML = `${icon("check-circle")} Ready for class`; button.disabled = true; icons(); toast("Your live-session preparation is marked ready."); }));
}

function renderReflect() {
  $("#app").innerHTML = `${pageHeader("Pause and reflect", "My progress", "Choose the statement that best describes what you can do today. Honest reflection helps your teacher support you.")}<section class="panel"><div class="self-list">${course.selfAssessment.map((item) => `<div class="self-row"><strong>${escapeHtml(item.statement)}</strong>${item.scale.split(" | ").map((choice) => `<button class="self-choice ${progress.self[item.selfAssessmentId] === choice ? "selected" : ""}" data-self="${item.selfAssessmentId}" data-choice="${choice}" type="button">${choice}</button>`).join("")}</div>`).join("")}</div><p><button class="button primary" id="reflection-done" type="button">Save reflection ${icon("check")}</button></p></section>`;
  $$('[data-self]').forEach((button) => button.addEventListener("click", () => { progress.self[button.dataset.self] = button.dataset.choice; saveProgress(); renderReflect(); icons(); }));
  $("#reflection-done").addEventListener("click", () => {
    if (Object.keys(progress.self).length < course.selfAssessment.length) return toast("Choose one response for every statement.");
    complete("reflect", "Reflection saved. Your teacher can now see where you need help.");
  });
}

function renderTeacher() {
  const assignment = course.assignments[0];
  $("#app").innerHTML = `${pageHeader("Teacher view", "Unit 2 teaching resources", "Implementation view for lesson delivery, assessment evidence and curriculum alignment.", "Curriculum approved")}
    <div class="section-stack">
      <section class="panel teacher-banner"><h2>${escapeHtml(assignment.title)}</h2><p>${escapeHtml(assignment.instructions)}</p><p><strong>${assignment.marks} marks</strong> · ${escapeHtml(assignment.submissionType)} · Rubrics: ${escapeHtml(assignment.rubricIds)}</p></section>
      <section class="panel"><h2>Outcome alignment</h2><table class="teacher-table"><thead><tr><th>ID</th><th>Learning outcome</th><th>Evidence</th></tr></thead><tbody>${course.outcomes.map((outcome) => `<tr><td>${escapeHtml(outcome.outcomeId.split("-").pop())}</td><td>${escapeHtml(outcome.learningOutcome)}</td><td>${escapeHtml(outcome.evidenceOfLearning)}</td></tr>`).join("")}</tbody></table></section>
      <section class="panel"><h2>Teaching notes</h2>${course.teacherNotes.map((note) => `<details><summary>${escapeHtml(note.noteType)}</summary><p class="reading-text" style="font-family:inherit;font-size:14px">${escapeHtml(note.note)}</p></details>`).join("")}</section>
      <section class="panel"><h2>Answer key and guidance</h2><table class="teacher-table"><thead><tr><th>Content</th><th>Type</th><th>Reviewed answer or guidance</th></tr></thead><tbody>${course.answerKey.map((answer) => `<tr><td>${escapeHtml(answer.contentId)}</td><td>${escapeHtml(answer.contentType)}</td><td>${escapeHtml(answer.answerOrGuidance)}</td></tr>`).join("")}</tbody></table></section>
      <section class="panel"><h2>Rubric criteria</h2><table class="teacher-table"><thead><tr><th>Target</th><th>Criterion</th><th>Beginning</th><th>Secure</th><th>Marks</th></tr></thead><tbody>${course.rubrics.map((rubric) => `<tr><td>${escapeHtml(rubric.target)}</td><td>${escapeHtml(rubric.criterion)}</td><td>${escapeHtml(rubric.level1)}</td><td>${escapeHtml(rubric.level4)}</td><td>${rubric.maximumMarks}</td></tr>`).join("")}</tbody></table></section>
    </div>`;
}

async function init() {
  try {
    const [courseResponse, dictionaryResponse] = await Promise.all([fetch("./data/grade2-unit2.json"), fetch("./data/master-dictionary.unit2.json")]);
    if (!courseResponse.ok || !dictionaryResponse.ok) throw new Error("Course data could not be loaded.");
    [course, dictionary] = await Promise.all([courseResponse.json(), dictionaryResponse.json()]);
    $("#loading").remove();
    $("#app").hidden = false;
    renderNav(); updateProgress(); renderRoute();
  } catch (error) {
    console.error(error);
    const target = $("#loading") || $("#app");
    target.hidden = false;
    target.innerHTML = `<p><strong>We could not prepare the lesson.</strong><br>${escapeHtml(error.message)}</p>`;
  }
}

$("#teacher-switch").addEventListener("click", () => navigate("teacher"));
$("#sound-toggle").addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  $("#sound-toggle").innerHTML = icon(audioEnabled ? "volume-2" : "volume-x");
  $("#sound-toggle").setAttribute("aria-label", audioEnabled ? "Mute sound" : "Turn on sound");
  if (!audioEnabled) stopAudio();
  icons(); toast(audioEnabled ? "Sound is on." : "Sound is muted.");
});
window.addEventListener("hashchange", () => { const next = location.hash.slice(1); if (next && next !== route) { route = next; renderNav(); renderRoute(); } });
init();
