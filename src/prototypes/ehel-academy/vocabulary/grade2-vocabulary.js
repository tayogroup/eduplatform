const curriculumResponse = await fetch("./grade2-vocabulary.json");
if (!curriculumResponse.ok) throw new Error(`Could not load Grade 2 vocabulary (${curriculumResponse.status}).`);
const curriculum = await curriculumResponse.json();

let audioCues = {};
try {
  const cueResponse = await fetch("./audio/grade2-audio-cues.json");
  if (cueResponse.ok) audioCues = await cueResponse.json();
} catch (_error) {
  audioCues = {};
}

const wordTypes = {
  noun: { title: "Noun", symbol: "N", definition: "Names a person, place, thing or idea.", sentenceTip: "It names who or what the sentence is about." },
  verb: { title: "Verb", symbol: "V", definition: "Shows an action or a state.", sentenceTip: "It tells what someone does or what happens." },
  adjective: { title: "Adjective", symbol: "A", definition: "Describes a noun.", sentenceTip: "It adds a detail about a person, place or thing." },
  adverb: { title: "Adverb", symbol: "Ad", definition: "Tells how, when or where an action happens.", sentenceTip: "It adds a detail about the action." },
  number: { title: "Number word", symbol: "#", definition: "Names a quantity or position in an order.", sentenceTip: "It helps us count or put things in order." },
  position: { title: "Position word", symbol: "P", definition: "Shows where one thing is compared with another.", sentenceTip: "It helps the listener picture where something is." },
  phrase: { title: "Phrase", symbol: "Ph", definition: "A small group of words that works together.", sentenceTip: "The words share one complete piece of meaning." },
  expression: { title: "Expression", symbol: "E", definition: "A useful word or phrase used to share meaning.", sentenceTip: "We use it as a complete social or classroom expression." }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let currentUnitIndex = 0;
let currentGroupIndex = 0;
let currentWordIndex = 0;
let currentSentenceIndex = 0;
let words = [];
let quizQuestions = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizLocked = false;
let spellingAnswer = [];
let spellingTiles = [];
let activeAudioButton = null;
let activeAudioEnd = null;
let activeAudioStarted = false;
let audioRequestId = 0;
let xp = Number(localStorage.getItem("ehelGrade2VocabularyXP") || 120);
const masteredWords = new Set(JSON.parse(localStorage.getItem("ehelGrade2VocabularyMastered") || "[]"));
const recordedAudio = $("#pronunciation-audio");
const lectureVideo = $("#lecture-video");
const audioVersion = "grade2-elevenlabs-XfNU2rGpBa01ckF309OY-v1";

function unit() { return curriculum.units[currentUnitIndex]; }
function group() { return unit().groups[currentGroupIndex]; }

function initialiseIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.4 } });
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function persistProgress() {
  localStorage.setItem("ehelGrade2VocabularyMastered", JSON.stringify([...masteredWords]));
  localStorage.setItem("ehelGrade2VocabularyXP", String(xp));
}

function renderUnitOptions() {
  const options = curriculum.units.map((item, index) => `<option value="${index}">Unit ${item.number}: ${escapeHtml(item.title)}</option>`).join("");
  $("#unit-select").innerHTML = options;
  $("#lecture-unit-select").innerHTML = options;
  $("#unit-select").value = String(currentUnitIndex);
  $("#lecture-unit-select").value = String(currentUnitIndex);
}

function renderGroupTabs() {
  $("#group-tabs").innerHTML = unit().groups.map((item, index) => `
    <button type="button" data-group-index="${index}" class="${index === currentGroupIndex ? "active" : ""}" aria-current="${index === currentGroupIndex ? "true" : "false"}">
      <span>${index + 1}</span>${escapeHtml(item.title)}
    </button>`).join("");
  $("#group-tabs").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => switchGroup(Number(button.dataset.groupIndex))));
}

function renderWordList() {
  $("#word-list").innerHTML = words.map((item, index) => `
    <button class="word-item ${index === currentWordIndex ? "active" : ""} ${masteredWords.has(item.id) ? "mastered" : ""}" type="button" data-word-index="${index}" aria-current="${index === currentWordIndex ? "true" : "false"}">
      <span class="word-number">${masteredWords.has(item.id) ? "OK" : index + 1}</span>
      <span><span class="word-name">${escapeHtml(item.word)}</span><span class="word-kind">${escapeHtml(item.sourceType)}</span></span>
      <i class="word-check" data-lucide="check-circle-2"></i>
    </button>`).join("");
  $("#word-list").querySelectorAll(".word-item").forEach((button) => button.addEventListener("click", () => selectWord(Number(button.dataset.wordIndex))));
  initialiseIcons();
}

function updateProgress() {
  const groupMastered = words.filter((item) => masteredWords.has(item.id)).length;
  const percentage = words.length ? (groupMastered / words.length) * 100 : 0;
  $("#progress-context").textContent = `Unit ${unit().number} · ${group().title}`;
  $("#progress-label").textContent = `${groupMastered} of ${words.length} words`;
  $("#progress-fill").style.width = `${percentage}%`;
  $(".progress-track").setAttribute("aria-valuenow", String(Math.round(percentage)));
  $("#xp-count").textContent = String(xp);
  $("#learn-state").textContent = groupMastered === words.length ? "OK" : String(currentWordIndex + 1);
}

function setWordImage(item) {
  const image = $("#word-image");
  image.style.opacity = "0";
  window.setTimeout(() => {
    image.src = unit().visual.image;
    image.alt = unit().visual.alt;
    image.style.opacity = "1";
  }, 100);
  $("#visual-caption").textContent = `Unit ${unit().number}: ${unit().title} · ${group().title}`;
}

function selectWord(index) {
  if (!words.length) return;
  currentWordIndex = (index + words.length) % words.length;
  currentSentenceIndex = 0;
  const item = words[currentWordIndex];
  setWordImage(item);
  $("#word-type").textContent = item.sourceType;
  $("#word-title").textContent = item.word;
  $("#phonetic").textContent = item.pronunciation;
  $("#word-meaning").textContent = item.meaning;
  $("#practice-word").textContent = item.word;
  $("#sentence-word").textContent = item.word;
  $("#sentence-input").placeholder = `${item.starter}...`;
  $("#sentence-input").value = "";
  $("#sentence-count").textContent = "0 / 160";
  $("#sentence-feedback").textContent = "Your coach will look for the word, a complete idea and clear meaning.";
  $("#sentence-feedback").className = "feedback-box";
  $("#tutor-prompt").textContent = item.tutorPrompt;
  $("#quick-feedback").textContent = "";
  renderTypeLesson(item);
  renderSentenceCard(item);
  renderQuickOptions(item);
  buildSpelling(item.word);
  renderWordList();
  updateProgress();
}

function renderTypeLesson(item) {
  const type = wordTypes[item.type] || wordTypes.expression;
  const types = [...new Set(words.map((word) => word.type))];
  $("#type-selector").innerHTML = types.map((typeName) => `<button type="button" data-type="${typeName}" class="${typeName === item.type ? "active" : ""}">${wordTypes[typeName]?.title || "Expression"}</button>`).join("");
  $("#type-selector").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const match = words.findIndex((word) => word.type === button.dataset.type);
    if (match >= 0) selectWord(match);
  }));
  const typeTotal = words.filter((word) => word.type === item.type).length;
  $("#type-title").textContent = type.title;
  $("#type-symbol").textContent = type.symbol;
  $("#type-definition").textContent = item.typeDefinition || type.definition;
  $("#type-count").textContent = `${typeTotal} ${type.title.toLowerCase()}${typeTotal === 1 ? "" : "s"} in this group`;
}

function highlightedSentence(sentence, word) {
  const pattern = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return escapeHtml(sentence).replace(pattern, "<mark>$1</mark>");
}

function renderSentenceCard(item = words[currentWordIndex]) {
  const sentence = item.sentences[currentSentenceIndex];
  const type = wordTypes[item.type] || wordTypes.expression;
  $("#sentence-card").classList.remove("flipped");
  $("#sentence-card").setAttribute("aria-label", `Flip sentence ${currentSentenceIndex + 1} for a word-type clue`);
  $("#sentence-position").textContent = `Sentence ${currentSentenceIndex + 1} of ${item.sentences.length}`;
  $("#word-example").innerHTML = highlightedSentence(sentence, item.word);
  const typeArticle = /^[aeiou]/i.test(type.title) ? "an" : "a";
  $("#sentence-back-title").textContent = `${item.word[0].toUpperCase()}${item.word.slice(1)} is ${typeArticle} ${type.title.toLowerCase()}`;
  $("#sentence-back-copy").textContent = `${item.typeDefinition || type.definition} ${type.sentenceTip}`;
  $("#sentence-dots").innerHTML = item.sentences.map((_, index) => `<button class="sentence-dot ${index === currentSentenceIndex ? "active" : ""}" type="button" data-sentence-index="${index}" aria-label="Open sentence ${index + 1}" aria-current="${index === currentSentenceIndex ? "true" : "false"}"></button>`).join("");
  $("#sentence-dots").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    currentSentenceIndex = Number(button.dataset.sentenceIndex);
    renderSentenceCard();
  }));
  initialiseIcons();
}

function changeSentence(direction) {
  const total = words[currentWordIndex].sentences.length;
  currentSentenceIndex = (currentSentenceIndex + direction + total) % total;
  renderSentenceCard();
}

function meaningOptions(item) {
  const others = words.filter((word) => word.id !== item.id).slice(0, 8);
  const distractors = [];
  for (let offset = 0; distractors.length < 2 && offset < others.length; offset += 1) {
    const candidate = others[(currentWordIndex + offset) % others.length]?.meaning;
    if (candidate && candidate !== item.meaning && !distractors.includes(candidate)) distractors.push(candidate);
  }
  const options = [item.meaning, ...distractors];
  const shift = currentWordIndex % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

function renderQuickOptions(item) {
  const options = meaningOptions(item);
  $("#quick-question").textContent = `Which meaning matches “${item.word}”?`;
  $("#quick-options").innerHTML = options.map((option) => `<button class="choice-button" type="button" data-correct="${option === item.meaning}">${escapeHtml(option)}</button>`).join("");
  $("#quick-options").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const correct = button.dataset.correct === "true";
    $("#quick-options").querySelectorAll("button").forEach((choice) => {
      choice.disabled = true;
      if (choice.dataset.correct === "true") choice.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");
    $("#quick-feedback").textContent = correct ? "Great thinking. You matched the meaning." : "Good try. Read the green meaning aloud.";
  }));
}

function audioDescriptor(text) {
  const item = words.find((candidate) => candidate.word === text || candidate.sentences.includes(text));
  if (!item) return null;
  const cueSet = audioCues[item.id];
  if (!cueSet) return null;
  const cue = item.word === text ? cueSet.word : cueSet.sentences[item.sentences.indexOf(text)];
  if (!cue) return null;
  return { src: `./audio/grade2-bundles/${item.id}.mp3?v=${audioVersion}`, start: cue.start, end: cue.end };
}

function setAudioButtonState(button, playing) {
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-busy", String(playing));
}

function fallbackSpeech(text, rate) {
  if (!("speechSynthesis" in window)) return showToast("This recording is still being prepared.");
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

function speak(text, rate = 0.82, button = null) {
  const descriptor = audioDescriptor(text);
  if (!descriptor) return fallbackSpeech(text, rate);
  audioRequestId += 1;
  const requestId = audioRequestId;
  recordedAudio.pause();
  activeAudioStarted = false;
  if (activeAudioButton) setAudioButtonState(activeAudioButton, false);
  activeAudioButton = button;
  activeAudioEnd = descriptor.end;
  setAudioButtonState(button, true);
  const absoluteSource = new URL(descriptor.src, document.baseURI).href;
  const sourceChanged = recordedAudio.currentSrc !== absoluteSource;
  if (sourceChanged) {
    recordedAudio.muted = true;
    recordedAudio.src = descriptor.src;
    recordedAudio.addEventListener("loadedmetadata", () => {
      if (requestId !== audioRequestId) return;
      recordedAudio.currentTime = descriptor.start;
      recordedAudio.muted = false;
    }, { once: true });
  } else {
    recordedAudio.currentTime = descriptor.start;
    recordedAudio.muted = false;
  }
  recordedAudio.playbackRate = Math.max(0.65, Math.min(1, rate / 0.82));
  recordedAudio.play().then(() => {
    if (requestId === audioRequestId) activeAudioStarted = true;
  }).catch(() => {
    recordedAudio.muted = false;
    fallbackSpeech(text, rate);
  });
}

recordedAudio.addEventListener("timeupdate", () => {
  if (activeAudioStarted && activeAudioEnd !== null && recordedAudio.currentTime >= activeAudioEnd) {
    recordedAudio.pause();
    activeAudioStarted = false;
    activeAudioEnd = null;
    setAudioButtonState(activeAudioButton, false);
    activeAudioButton = null;
  }
});

recordedAudio.addEventListener("error", () => {
  activeAudioStarted = false;
  setAudioButtonState(activeAudioButton, false);
  activeAudioButton = null;
  activeAudioEnd = null;
});

function switchMode(mode) {
  $$(".mode-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $$(".mode-view").forEach((view) => view.classList.toggle("active", view.dataset.view === mode));
  if (mode === "practice") buildSpelling(words[currentWordIndex].word);
  initialiseIcons();
}

function markCurrentWord() {
  const item = words[currentWordIndex];
  if (!masteredWords.has(item.id)) {
    masteredWords.add(item.id);
    xp += 10;
    showToast(`You mastered “${item.word}” and earned 10 XP.`);
    persistProgress();
  }
  renderWordList();
  updateProgress();
  if (currentWordIndex < words.length - 1) window.setTimeout(() => selectWord(currentWordIndex + 1), 350);
}

function spellingLetters(word) { return word.toLowerCase().replace(/[^a-z]/g, "").split(""); }

function buildSpelling(word) {
  spellingAnswer = [];
  spellingTiles = spellingLetters(word).map((letter, index) => ({ letter, id: index }));
  for (let index = spellingTiles.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [spellingTiles[index], spellingTiles[swap]] = [spellingTiles[swap], spellingTiles[index]];
  }
  renderSpelling(word);
}

function renderSpelling(word = words[currentWordIndex].word) {
  const letters = spellingLetters(word);
  $("#spelling-slots").innerHTML = letters.map((_, index) => `<span class="spelling-slot">${spellingAnswer[index]?.letter || ""}</span>`).join("");
  $("#letter-bank").innerHTML = spellingTiles.map((tile) => `<button class="letter-tile" type="button" data-tile-id="${tile.id}" ${spellingAnswer.some((chosen) => chosen.id === tile.id) ? "disabled" : ""}>${tile.letter}</button>`).join("");
  $("#letter-bank").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    if (spellingAnswer.length >= letters.length) return;
    spellingAnswer.push(spellingTiles.find((tile) => tile.id === Number(button.dataset.tileId)));
    renderSpelling(word);
  }));
}

function checkSentence() {
  const value = $("#sentence-input").value.trim();
  const word = words[currentWordIndex].word;
  const feedback = $("#sentence-feedback");
  const includesWord = value.toLowerCase().includes(word.toLowerCase());
  const enoughWords = value.split(/\s+/).filter(Boolean).length >= 5;
  if (includesWord && enoughWords) {
    feedback.className = "feedback-box success";
    feedback.textContent = /[.!?]$/.test(value) ? "Strong sentence. Your idea is clear and complete." : "Good sentence. Add an end mark.";
    xp += 5;
    persistProgress();
    updateProgress();
  } else {
    feedback.className = "feedback-box try-again";
    feedback.textContent = includesWord ? "Add one more detail to complete your idea." : `Use the word “${word}” in your sentence.`;
  }
}

function checkSpelling() {
  const attempt = spellingAnswer.map((tile) => tile.letter).join("");
  const answer = spellingLetters(words[currentWordIndex].word).join("");
  const feedback = $("#spelling-feedback");
  if (attempt === answer) {
    feedback.className = "feedback-box success";
    feedback.textContent = `Perfect. You spelled ${words[currentWordIndex].word} correctly.`;
    speak(words[currentWordIndex].word, 0.72);
  } else {
    feedback.className = "feedback-box try-again";
    feedback.textContent = attempt.length < answer.length ? "Keep going. Every slot needs a letter." : "Nearly there. Listen, clear the letters and try again.";
  }
}

function tutorReply(message) {
  const word = words[currentWordIndex].word;
  if (!message.toLowerCase().includes(word.toLowerCase())) return `Good start. Add the word “${word}” to your answer.`;
  if (message.split(/\s+/).length < 5) return `You used “${word}”. Add who, where, when or why.`;
  return `Excellent use of “${word}”. Now say your sentence aloud with a confident voice.`;
}

function sendTutorMessage() {
  const input = $("#tutor-input");
  const message = input.value.trim();
  if (!message) return;
  $("#chat-log").insertAdjacentHTML("beforeend", `<div class="chat-message student-message"><span>A</span><p>${escapeHtml(message)}</p></div>`);
  input.value = "";
  window.setTimeout(() => {
    $("#chat-log").insertAdjacentHTML("beforeend", `<div class="chat-message tutor-message"><span>N</span><p>${escapeHtml(tutorReply(message))}</p></div>`);
    $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
  }, 450);
}

function spellingDistractors(word) {
  const compact = word.replace(/\s+/g, "");
  if (compact.length < 3) return [word, `${word}${word.slice(-1)}`, word.slice(0, -1), `${word.slice(0, 1)}${word}`];
  return [word, `${compact.slice(0, 1)}${compact.slice(2, 3)}${compact.slice(1, 2)}${compact.slice(3)}`, `${compact.slice(0, -1)}e`, compact.replace(/[aeiou]/, "a")];
}

function buildQuizQuestions() {
  const samples = [0, Math.floor(words.length / 4), Math.floor(words.length / 2), Math.floor(words.length * 0.75), words.length - 1].map((index) => words[Math.max(0, index)]);
  const meaningWord = samples[0];
  const typeWord = samples[1];
  const sentenceWord = samples[2];
  const secondMeaning = samples[3];
  const spellingWord = samples[4];
  const typeOptions = [...new Set(words.map((item) => wordTypes[item.type]?.title || "Expression"))];
  while (typeOptions.length < 4) typeOptions.push(["Noun", "Verb", "Adjective", "Number word"].find((value) => !typeOptions.includes(value)));
  const correctType = wordTypes[typeWord.type]?.title || "Expression";
  const examplePattern = new RegExp(sentenceWord.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const sentencePrompt = examplePattern.test(sentenceWord.example) ? sentenceWord.example.replace(examplePattern, "____") : `Choose the word that means: ${sentenceWord.meaning}`;
  quizQuestions = [
    { kind: "Meaning", prompt: `What does “${meaningWord.word}” mean?`, options: meaningOptions(meaningWord), answerText: meaningWord.meaning, success: `Yes. ${meaningWord.meaning}` },
    { kind: "Word type", prompt: `What type of word is “${typeWord.word}”?`, options: typeOptions.slice(0, 4), answerText: correctType, success: `Correct. ${typeWord.word} is a ${correctType.toLowerCase()}.` },
    { kind: "In a sentence", prompt: sentencePrompt, options: [sentenceWord.word, ...words.filter((item) => item.id !== sentenceWord.id).slice(0, 3).map((item) => item.word)], answerText: sentenceWord.word, success: `Exactly. ${sentenceWord.example}` },
    { kind: "Meaning", prompt: `Choose the meaning of “${secondMeaning.word}”.`, options: meaningOptions(secondMeaning), answerText: secondMeaning.meaning, success: `Well done. ${secondMeaning.meaning}` },
    { kind: "Spelling", prompt: `Which spelling is correct?`, options: spellingDistractors(spellingWord.word), answerText: spellingWord.word, success: `Perfect spelling: ${spellingWord.word}.` }
  ].map((question) => ({ ...question, answer: question.options.indexOf(question.answerText) }));
}

function startQuiz() {
  buildQuizQuestions();
  quizIndex = 0;
  quizCorrect = 0;
  $("#quiz-start").classList.add("hidden");
  $("#quiz-result").classList.add("hidden");
  $("#quiz-question").classList.remove("hidden");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  quizLocked = false;
  const question = quizQuestions[quizIndex];
  $("#quiz-progress-copy").textContent = `Question ${quizIndex + 1} of ${quizQuestions.length}`;
  $("#quiz-score").textContent = `${quizCorrect * 20} XP`;
  $("#quiz-progress-fill").style.width = `${((quizIndex + 1) / quizQuestions.length) * 100}%`;
  $("#quiz-kind").textContent = question.kind;
  $("#quiz-prompt").textContent = question.prompt;
  $("#quiz-feedback").textContent = "";
  $("#next-question").classList.add("hidden");
  $("#quiz-options").innerHTML = question.options.map((option, index) => `<button class="quiz-option" type="button" data-answer="${index}">${escapeHtml(option)}</button>`).join("");
  $("#quiz-options").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answer))));
}

function answerQuiz(selected) {
  if (quizLocked) return;
  quizLocked = true;
  const question = quizQuestions[quizIndex];
  const options = $("#quiz-options").querySelectorAll("button");
  options.forEach((option) => option.disabled = true);
  options[question.answer].classList.add("correct");
  if (selected === question.answer) quizCorrect += 1;
  else options[selected].classList.add("wrong");
  $("#quiz-feedback").textContent = selected === question.answer ? question.success : `Good try. ${question.success}`;
  $("#quiz-score").textContent = `${quizCorrect * 20} XP`;
  $("#next-question").classList.remove("hidden");
}

function nextQuizQuestion() {
  quizIndex += 1;
  if (quizIndex < quizQuestions.length) return renderQuizQuestion();
  const earned = quizCorrect * 20;
  xp += earned;
  persistProgress();
  updateProgress();
  $("#quiz-question").classList.add("hidden");
  $("#quiz-result").classList.remove("hidden");
  $("#result-title").textContent = quizCorrect >= 4 ? "Brilliant word power!" : "Your words are growing!";
  $("#result-copy").textContent = quizCorrect >= 4 ? `You reached the mastery goal for ${group().title}.` : "Review the green answers, then try again.";
  $("#result-score").textContent = `${quizCorrect} / ${quizQuestions.length}`;
  $("#result-xp").textContent = `+${earned} XP`;
}

function lectureKey() { return `ehelGrade2VocabularyLectureComplete-unit-${unit().number}`; }

function updateLecture() {
  const currentUnit = unit();
  $("#lecture-unit-kicker").textContent = `Unit ${currentUnit.number} of ${curriculum.unitCount}`;
  $("#lecture-title").textContent = currentUnit.title;
  $("#lecture-description").textContent = `Teacher Nuur introduces ${currentUnit.wordCount} vocabulary words across ${currentUnit.groups.length} learning groups.`;
  $("#lecture-goals").innerHTML = currentUnit.groups.slice(0, 3).map((item) => `<li><i data-lucide="check"></i>${escapeHtml(item.title)}</li>`).join("");
  const transcript = `Welcome to Unit ${currentUnit.number}, ${currentUnit.title}. In this unit we will explore ${currentUnit.groups.map((item) => item.title).join(", ")}. Listen for the word type, repeat each word clearly, read five sentences, practise spelling and finish each group challenge.`;
  $("#lecture-transcript-copy").textContent = transcript;
  lectureVideo.pause();
  lectureVideo.poster = `./media/unit-${currentUnit.number}-lecture-poster.jpg`;
  $("#lecture-source").src = `./media/unit-${currentUnit.number}-vocabulary-lecture.mp4?v=${audioVersion}`;
  $("#lecture-captions").src = `./media/unit-${currentUnit.number}-vocabulary-lecture.vtt?v=${audioVersion}`;
  lectureVideo.load();
  const complete = localStorage.getItem(lectureKey()) === "true";
  $("#continue-to-lesson").disabled = !complete;
  $("#lecture-watch-fill").style.width = complete ? "100%" : "0%";
  $("#lecture-status").innerHTML = complete ? '<i data-lucide="check-circle-2"></i>Lecture complete. This unit is unlocked.' : '<i data-lucide="circle"></i>Watch the lecture to unlock this unit';
  $("#lecture-status").classList.toggle("complete", complete);
  initialiseIcons();
}

function setLectureComplete() {
  localStorage.setItem(lectureKey(), "true");
  $("#continue-to-lesson").disabled = false;
  $("#lecture-watch-fill").style.width = "100%";
  $(".lecture-watch-track").setAttribute("aria-valuenow", "100");
  $("#lecture-status").classList.add("complete");
  $("#lecture-status").innerHTML = '<i data-lucide="check-circle-2"></i>Lecture complete. This unit is unlocked.';
  initialiseIcons();
}

function showLessonWorkspace() {
  lectureVideo.pause();
  $("#lecture-gate").classList.add("hidden");
  $("#lesson-workspace").classList.remove("hidden");
  $("#learning-stage").focus();
}

function showLectureGate() {
  $("#lesson-workspace").classList.add("hidden");
  $("#lecture-gate").classList.remove("hidden");
  lectureVideo.currentTime = 0;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchGroup(index) {
  currentGroupIndex = index;
  currentWordIndex = 0;
  currentSentenceIndex = 0;
  words = group().words;
  $("#rail-group-title").textContent = group().title;
  $("#rail-word-count").textContent = `${words.length} useful words`;
  renderGroupTabs();
  selectWord(0);
  buildQuizQuestions();
  switchMode("learn");
}

function switchUnit(index, openLecture = true) {
  currentUnitIndex = index;
  currentGroupIndex = 0;
  $("#unit-select").value = String(index);
  $("#lecture-unit-select").value = String(index);
  $("#rail-unit-label").textContent = `Unit ${unit().number}: ${unit().title}`;
  renderGroupTabs();
  switchGroup(0);
  updateLecture();
  const teacherReview = new URLSearchParams(window.location.search).get("view") === "teacher-review";
  if (openLecture && !teacherReview) showLectureGate();
  else showLessonWorkspace();
}

let toastTimer;
function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => $("#toast").classList.remove("show"), 2600);
}

function wireEvents() {
  $("#unit-select").addEventListener("change", (event) => switchUnit(Number(event.target.value), true));
  $("#lecture-unit-select").addEventListener("change", (event) => switchUnit(Number(event.target.value), true));
  $$(".mode-tab").forEach((tab) => tab.addEventListener("click", () => switchMode(tab.dataset.mode)));
  $("#listen-button").addEventListener("click", (event) => speak(words[currentWordIndex].word, 0.82, event.currentTarget));
  $("#slow-button").addEventListener("click", (event) => speak(words[currentWordIndex].word, 0.48, event.currentTarget));
  $("#sentence-audio").addEventListener("click", (event) => speak(words[currentWordIndex].sentences[currentSentenceIndex], 0.82, event.currentTarget));
  $("#spelling-audio").addEventListener("click", (event) => speak(words[currentWordIndex].word, 0.68, event.currentTarget));
  $("#sentence-card").addEventListener("click", (event) => event.currentTarget.classList.toggle("flipped"));
  $("#previous-sentence").addEventListener("click", () => changeSentence(-1));
  $("#next-sentence").addEventListener("click", () => changeSentence(1));
  $("#previous-word").addEventListener("click", () => selectWord(currentWordIndex - 1));
  $("#next-word").addEventListener("click", () => selectWord(currentWordIndex + 1));
  $("#know-word").addEventListener("click", markCurrentWord);
  $("#review-button").addEventListener("click", () => {
    const firstUnmastered = words.findIndex((item) => !masteredWords.has(item.id));
    selectWord(firstUnmastered >= 0 ? firstUnmastered : 0);
    switchMode("learn");
  });
  $("#replay-lecture").addEventListener("click", showLectureGate);
  $("#continue-to-lesson").addEventListener("click", showLessonWorkspace);
  $("#sentence-input").addEventListener("input", (event) => $("#sentence-count").textContent = `${event.target.value.length} / 160`);
  $("#sentence-hint").addEventListener("click", () => {
    $("#sentence-input").value = `${words[currentWordIndex].starter} `;
    $("#sentence-input").focus();
  });
  $("#check-sentence").addEventListener("click", checkSentence);
  $("#clear-spelling").addEventListener("click", () => buildSpelling(words[currentWordIndex].word));
  $("#check-spelling").addEventListener("click", checkSpelling);
  $$('[data-tutor-chip]').forEach((button) => button.addEventListener("click", () => {
    $("#tutor-input").value = `${button.dataset.tutorChip} `;
    $("#tutor-input").focus();
  }));
  $("#send-tutor").addEventListener("click", sendTutorMessage);
  $("#tutor-input").addEventListener("keydown", (event) => { if (event.key === "Enter") sendTutorMessage(); });
  $("#tutor-mic").addEventListener("click", () => showToast("Voice practice will connect to the EduPlatform tutor service."));
  $("#start-quiz").addEventListener("click", startQuiz);
  $("#next-question").addEventListener("click", nextQuizQuestion);
  $("#retry-quiz").addEventListener("click", startQuiz);
  $("#finish-lesson").addEventListener("click", () => {
    words.forEach((item) => masteredWords.add(item.id));
    persistProgress();
    renderWordList();
    updateProgress();
    showToast(`${group().title} complete. Excellent work!`);
  });
  lectureVideo.addEventListener("timeupdate", () => {
    if (!Number.isFinite(lectureVideo.duration) || lectureVideo.duration <= 0) return;
    const percentage = Math.min(100, Math.round((lectureVideo.currentTime / lectureVideo.duration) * 100));
    $("#lecture-watch-fill").style.width = `${percentage}%`;
    $(".lecture-watch-track").setAttribute("aria-valuenow", String(percentage));
    if (percentage >= 90) setLectureComplete();
  });
  lectureVideo.addEventListener("ended", setLectureComplete);
}

renderUnitOptions();
wireEvents();
switchUnit(0, true);
initialiseIcons();
