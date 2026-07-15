const words = [
  {
    word: "neighbour",
    type: "noun",
    phonetic: "/NAY-buh/",
    meaning: "A person who lives near you.",
    example: "Our neighbour waves to us every morning.",
    sentences: [
      "Our neighbour waves to us every morning.",
      "I helped my neighbour carry her shopping.",
      "My new neighbour has two children.",
      "We invited our neighbour to share lunch.",
      "A good neighbour cares about the community."
    ],
    image: "./assets/neighbour.png",
    alt: "Two children who live next door waving to each other",
    caption: "Can you spot the neighbours?",
    quickQuestion: "Who is your neighbour?",
    quickOptions: ["A person living nearby", "A kind of animal", "A school subject"],
    quickAnswer: 0,
    starter: "My neighbour is..."
  },
  {
    word: "friendly",
    type: "adjective",
    phonetic: "/FREND-lee/",
    meaning: "Kind and pleasant to other people.",
    example: "The friendly shopkeeper smiles at everyone.",
    sentences: [
      "The friendly shopkeeper smiles at everyone.",
      "A friendly child welcomed the new student.",
      "Our teacher has a friendly voice.",
      "The neighbours had a friendly chat outside.",
      "A friendly greeting can brighten someone's day."
    ],
    image: "./assets/neighbour.png",
    alt: "Two friendly children waving to each other",
    caption: "A friendly hello can brighten the day.",
    quickQuestion: "Which action is friendly?",
    quickOptions: ["Ignoring someone", "Smiling and saying hello", "Taking without asking"],
    quickAnswer: 1,
    starter: "I was friendly when..."
  },
  {
    word: "help",
    type: "verb",
    phonetic: "/HELP/",
    meaning: "To make something easier for someone.",
    example: "I help my neighbour carry the shopping.",
    sentences: [
      "I help my neighbour carry the shopping.",
      "Please help me pick up these books.",
      "The children help to keep the park clean.",
      "We help new families feel welcome.",
      "Can you help your friend solve the puzzle?"
    ],
    image: "./assets/helpful.png",
    alt: "One child helping another pick up books",
    caption: "Helping hands make hard jobs easier.",
    quickQuestion: "What does it mean to help?",
    quickOptions: ["Make a task easier", "Make a loud noise", "Run very fast"],
    quickAnswer: 0,
    starter: "I can help by..."
  },
  {
    word: "kindly",
    type: "adverb",
    phonetic: "/KYND-lee/",
    meaning: "In a caring and gentle way.",
    example: "Muna kindly opened the door for her neighbour.",
    sentences: [
      "Muna kindly opened the door for her neighbour.",
      "The teacher kindly explained the question again.",
      "He kindly shared his umbrella in the rain.",
      "The nurse kindly spoke to the worried child.",
      "Amina kindly offered her friend a pencil."
    ],
    image: "./assets/helpful.png",
    alt: "A child helping another child in a caring way",
    caption: "She acts kindly and makes someone feel cared for.",
    quickQuestion: "How do you speak kindly?",
    quickOptions: ["With caring words", "By shouting", "Without listening"],
    quickAnswer: 0,
    starter: "She kindly..."
  },
  {
    word: "share",
    type: "verb",
    phonetic: "/SHAIR/",
    meaning: "To let another person use or have some of yours.",
    example: "We share our coloured pencils at the table.",
    sentences: [
      "We share our coloured pencils at the table.",
      "The neighbours share fruit from their gardens.",
      "I share my storybook with my little brother.",
      "Good friends share ideas and listen to each other.",
      "Let us share the work so we finish together."
    ],
    image: "./assets/share.png",
    alt: "One child sharing coloured pencils with another",
    caption: "Both children can create when they share.",
    quickQuestion: "Which picture idea shows sharing?",
    quickOptions: ["Keeping every pencil", "Giving a friend some pencils", "Hiding the pencils"],
    quickAnswer: 1,
    starter: "I like to share..."
  },
  {
    word: "community",
    type: "noun",
    phonetic: "/kuh-MYOO-nuh-tee/",
    meaning: "People who live, learn or work in the same place.",
    example: "Our community keeps the park clean.",
    sentences: [
      "Our community keeps the park clean.",
      "The school is an important part of our community.",
      "People in the community helped the new family.",
      "Our community planted flowers beside the road.",
      "A strong community works together."
    ],
    image: "./assets/neighbour.png",
    alt: "Children standing in their shared neighbourhood",
    caption: "Many neighbours together make a community.",
    quickQuestion: "What makes a community?",
    quickOptions: ["One empty room", "People sharing a place", "A single shoe"],
    quickAnswer: 1,
    starter: "My community..."
  },
  {
    word: "helpful",
    type: "adjective",
    phonetic: "/HELP-fuhl/",
    meaning: "Ready to help or useful to someone.",
    example: "The helpful child picked up the fallen books.",
    sentences: [
      "The helpful child picked up the fallen books.",
      "This map is helpful when we visit a new place.",
      "Our helpful neighbour fixed the garden gate.",
      "The teacher gave me a helpful clue.",
      "Being helpful makes our classroom stronger."
    ],
    image: "./assets/helpful.png",
    alt: "A helpful child picking up books with a classmate",
    caption: "What makes this child helpful?",
    quickQuestion: "Which person is helpful?",
    quickOptions: ["Someone who offers support", "Someone who walks away", "Someone who breaks a toy"],
    quickAnswer: 0,
    starter: "A helpful person..."
  },
  {
    word: "carefully",
    type: "adverb",
    phonetic: "/KAIR-fuh-lee/",
    meaning: "In a way that avoids mistakes or danger.",
    example: "Ali carefully carried the full cup of water.",
    sentences: [
      "Ali carefully carried the full cup of water.",
      "She carefully crossed the busy road with an adult.",
      "We carefully read every question before answering.",
      "The children carefully planted the tiny seeds.",
      "Please carefully place the books on the shelf."
    ],
    image: "./assets/share.png",
    alt: "Children carefully using pencils at a classroom table",
    caption: "Careful actions need attention and time.",
    quickQuestion: "How do you carry a full cup carefully?",
    quickOptions: ["Slowly with both hands", "While jumping", "With your eyes closed"],
    quickAnswer: 0,
    starter: "I carefully..."
  }
];

const wordTypes = {
  noun: {
    title: "Noun",
    symbol: "N",
    definition: "Names a person, place, thing or idea.",
    sentenceTip: "It names who or what the sentence is about."
  },
  verb: {
    title: "Verb",
    symbol: "V",
    definition: "Shows an action or a state.",
    sentenceTip: "It tells us what someone does."
  },
  adjective: {
    title: "Adjective",
    symbol: "A",
    definition: "Describes a noun.",
    sentenceTip: "It adds a describing detail to a person, place or thing."
  },
  adverb: {
    title: "Adverb",
    symbol: "Ad",
    definition: "Tells how, when or where an action happens.",
    sentenceTip: "It explains how the action is done."
  }
};

const quizQuestions = [
  { kind: "Meaning", prompt: "What does neighbour mean?", options: ["A person who lives near you", "A person who flies a plane", "A kind of food", "A school bag"], answer: 0, success: "Yes. A neighbour lives near you." },
  { kind: "Word type", prompt: "Which word is an adjective?", options: ["share", "kindly", "helpful", "community"], answer: 2, success: "Correct. Helpful describes a person or thing." },
  { kind: "In a sentence", prompt: "Choose the best word: We ___ our crayons with our friends.", options: ["community", "share", "carefully", "friendly"], answer: 1, success: "Exactly. We share our crayons." },
  { kind: "Meaning", prompt: "What does carefully tell us?", options: ["Where an action happens", "Who does an action", "How an action is done", "When school begins"], answer: 2, success: "Well done. Carefully tells how an action is done." },
  { kind: "Spelling", prompt: "Which spelling is correct?", options: ["naybour", "neigbour", "neighbour", "neighber"], answer: 2, success: "Perfect spelling: neighbour." }
];

let currentWordIndex = 0;
let currentSentenceIndex = 0;
let masteredWords = new Set(JSON.parse(localStorage.getItem("ehelVocabularyMastered") || "[]"));
let spellingAnswer = [];
let spellingTiles = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizLocked = false;
let xp = Number(localStorage.getItem("ehelVocabularyXP") || 120);
const recordedAudio = document.querySelector("#pronunciation-audio");
const lectureVideo = document.querySelector("#lecture-video");
const audioVersion = "elevenlabs-XfNU2rGpBa01ckF309OY";
let activeAudioButton = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function initialiseIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2.4 } });
}

function persistProgress() {
  localStorage.setItem("ehelVocabularyMastered", JSON.stringify([...masteredWords]));
  localStorage.setItem("ehelVocabularyXP", String(xp));
}

function renderWordList() {
  const list = $("#word-list");
  list.innerHTML = words.map((item, index) => `
    <button class="word-item ${index === currentWordIndex ? "active" : ""} ${masteredWords.has(item.word) ? "mastered" : ""}" type="button" data-word-index="${index}" aria-current="${index === currentWordIndex ? "true" : "false"}">
      <span class="word-number">${masteredWords.has(item.word) ? "OK" : index + 1}</span>
      <span><span class="word-name">${item.word}</span><span class="word-kind">${item.type}</span></span>
      <i class="word-check" data-lucide="check-circle-2"></i>
    </button>`).join("");
  list.querySelectorAll(".word-item").forEach((button) => button.addEventListener("click", () => selectWord(Number(button.dataset.wordIndex))));
  initialiseIcons();
}

function updateProgress() {
  const count = masteredWords.size;
  const displayIndex = currentWordIndex + 1;
  const percent = Math.max((displayIndex / words.length) * 100, (count / words.length) * 100);
  $("#progress-label").textContent = `${displayIndex} of ${words.length} words`;
  $("#progress-fill").style.width = `${percent}%`;
  $(".progress-track").setAttribute("aria-valuenow", String(Math.round(percent)));
  $("#xp-count").textContent = xp;
}

function selectWord(index) {
  currentWordIndex = Math.max(0, Math.min(words.length - 1, index));
  currentSentenceIndex = 0;
  const item = words[currentWordIndex];
  const image = $("#word-image");
  image.style.opacity = "0";
  setTimeout(() => {
    image.src = item.image;
    image.alt = item.alt;
    image.style.opacity = "1";
  }, 120);
  $("#visual-caption").textContent = item.caption;
  $("#word-type").textContent = item.type;
  $("#word-title").textContent = item.word;
  $("#phonetic").textContent = item.phonetic;
  $("#word-meaning").textContent = item.meaning;
  $("#quick-question").textContent = item.quickQuestion;
  $("#practice-word").textContent = item.word;
  $("#sentence-word").textContent = item.word;
  $("#sentence-input").placeholder = item.starter;
  $("#sentence-input").value = "";
  $("#sentence-count").textContent = "0 / 160";
  $("#sentence-feedback").textContent = "Your coach will look for the word, a complete idea and clear meaning.";
  $("#sentence-feedback").className = "feedback-box";
  $("#tutor-prompt").textContent = `Tell me something using the word \"${item.word}\". What does it mean in your sentence?`;
  $("#quick-feedback").textContent = "";
  renderTypeLesson(item);
  renderSentenceCard(item);
  renderQuickOptions(item);
  buildSpelling(item.word);
  renderWordList();
  updateProgress();
}

function renderTypeLesson(item) {
  const type = wordTypes[item.type];
  const typeTotal = words.filter((word) => word.type === item.type).length;
  $("#type-title").textContent = type.title;
  $("#type-symbol").textContent = type.symbol;
  $("#type-definition").textContent = type.definition;
  $("#type-count").textContent = `${typeTotal} ${item.type}${typeTotal === 1 ? "" : "s"} in this group`;
  $$("#type-selector button").forEach((button) => button.classList.toggle("active", button.dataset.type === item.type));
}

function highlightedSentence(sentence, word) {
  const pattern = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return escapeHtml(sentence).replace(pattern, "<mark>$1</mark>");
}

function renderSentenceCard(item = words[currentWordIndex]) {
  const sentence = item.sentences[currentSentenceIndex];
  const type = wordTypes[item.type];
  $("#sentence-card").classList.remove("flipped");
  $("#sentence-card").setAttribute("aria-label", `Flip sentence ${currentSentenceIndex + 1} for a word-type clue`);
  $("#sentence-position").textContent = `Sentence ${currentSentenceIndex + 1} of ${item.sentences.length}`;
  $("#word-example").innerHTML = highlightedSentence(sentence, item.word);
  $("#sentence-back-title").textContent = `${item.word[0].toUpperCase()}${item.word.slice(1)} is a ${item.type}`;
  $("#sentence-back-copy").textContent = `${type.definition} ${type.sentenceTip}`;
  $("#sentence-dots").innerHTML = item.sentences.map((_, index) => `
    <button class="sentence-dot ${index === currentSentenceIndex ? "active" : ""}" type="button" data-sentence-index="${index}" aria-label="Open sentence ${index + 1}" aria-current="${index === currentSentenceIndex ? "true" : "false"}"></button>
  `).join("");
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

function renderQuickOptions(item) {
  $("#quick-options").innerHTML = item.quickOptions.map((option, index) => `<button class="choice-button" type="button" data-choice="${index}">${option}</button>`).join("");
  $("#quick-options").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    const selected = Number(button.dataset.choice);
    $("#quick-options").querySelectorAll("button").forEach((choice) => choice.disabled = true);
    button.classList.add(selected === item.quickAnswer ? "correct" : "wrong");
    if (selected !== item.quickAnswer) $("#quick-options").children[item.quickAnswer].classList.add("correct");
    $("#quick-feedback").textContent = selected === item.quickAnswer ? "Great thinking. You matched the meaning." : "Good try. Look at the green answer and say it aloud.";
  }));
}

function recordedAudioPath(text) {
  const item = words.find((candidate) => candidate.word === text || candidate.example === text || candidate.sentences.includes(text));
  if (!item) return null;
  if (item.word === text) return `./audio/word-${item.word}.wav?v=${audioVersion}`;
  const sentenceIndex = item.sentences.indexOf(text);
  if (sentenceIndex >= 0) return `./audio/sentence-${item.word}-${sentenceIndex + 1}.wav?v=${audioVersion}`;
  return `./audio/example-${item.word}.wav?v=${audioVersion}`;
}

function setAudioButtonState(button, playing) {
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-busy", String(playing));
}

function fallbackSpeech(text, rate) {
  if (!("speechSynthesis" in window)) {
    showToast("The pronunciation recording could not be played.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.startsWith("en-GB")) || voices.find((voice) => voice.lang.startsWith("en")) || null;
  window.speechSynthesis.speak(utterance);
}

function speak(text, rate = 0.82, button = null) {
  const source = recordedAudioPath(text);
  if (!recordedAudio || !source) {
    fallbackSpeech(text, rate);
    return;
  }

  recordedAudio.pause();
  recordedAudio.currentTime = 0;
  if (activeAudioButton) setAudioButtonState(activeAudioButton, false);
  activeAudioButton = button;
  setAudioButtonState(activeAudioButton, true);
  recordedAudio.src = source;
  recordedAudio.playbackRate = Math.max(0.65, Math.min(1, rate / 0.82));
  recordedAudio.defaultPlaybackRate = recordedAudio.playbackRate;
  recordedAudio.muted = false;
  recordedAudio.volume = 1;
  recordedAudio.dataset.state = "loading";
  delete recordedAudio.dataset.error;

  recordedAudio.onplaying = () => {
    recordedAudio.dataset.state = "playing";
  };
  recordedAudio.onended = () => {
    recordedAudio.dataset.state = "ended";
    setAudioButtonState(activeAudioButton, false);
    activeAudioButton = null;
  };
  recordedAudio.onerror = () => {
    recordedAudio.dataset.state = "error";
    setAudioButtonState(activeAudioButton, false);
    activeAudioButton = null;
    fallbackSpeech(text, rate);
  };
  recordedAudio.play().catch((error) => {
    recordedAudio.dataset.state = "blocked";
    recordedAudio.dataset.error = `${error?.name || "PlaybackError"}: ${error?.message || "Audio playback was blocked."}`;
    setAudioButtonState(activeAudioButton, false);
    activeAudioButton = null;
    fallbackSpeech(text, rate);
  });
}

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
  const word = words[currentWordIndex].word;
  if (!masteredWords.has(word)) {
    masteredWords.add(word);
    xp += 10;
    showToast(`You mastered \"${word}\" and earned 10 XP.`);
    persistProgress();
  }
  renderWordList();
  updateProgress();
  if (currentWordIndex < words.length - 1) setTimeout(() => selectWord(currentWordIndex + 1), 420);
}

function buildSpelling(word) {
  spellingAnswer = [];
  spellingTiles = word.split("").map((letter, index) => ({ letter, id: index }));
  for (let index = spellingTiles.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [spellingTiles[index], spellingTiles[swap]] = [spellingTiles[swap], spellingTiles[index]];
  }
  renderSpelling(word);
}

function renderSpelling(word = words[currentWordIndex].word) {
  $("#spelling-slots").innerHTML = word.split("").map((_, index) => `<span class="spelling-slot">${spellingAnswer[index]?.letter || ""}</span>`).join("");
  $("#letter-bank").innerHTML = spellingTiles.map((tile) => `<button class="letter-tile" type="button" data-tile-id="${tile.id}" ${spellingAnswer.some((chosen) => chosen.id === tile.id) ? "disabled" : ""}>${tile.letter}</button>`).join("");
  $("#letter-bank").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    if (spellingAnswer.length >= word.length) return;
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
  const hasEndMark = /[.!?]$/.test(value);
  if (includesWord && enoughWords) {
    feedback.className = "feedback-box success";
    feedback.textContent = hasEndMark ? `Strong sentence. You used \"${word}\" clearly and finished your idea.` : `Good sentence. Add a full stop, question mark or exclamation mark at the end.`;
    xp += hasEndMark ? 10 : 5;
    persistProgress();
    updateProgress();
  } else {
    feedback.className = "feedback-box try-again";
    feedback.textContent = !includesWord ? `Use the word \"${word}\" in your sentence.` : "Add a little more detail so your sentence shares a complete idea.";
  }
}

function checkSpelling() {
  const attempt = spellingAnswer.map((tile) => tile.letter).join("");
  const word = words[currentWordIndex].word;
  const feedback = $("#spelling-feedback");
  if (attempt === word) {
    feedback.className = "feedback-box success";
    feedback.textContent = `Perfect. You spelled ${word} correctly.`;
    speak(word, 0.72);
    xp += 10;
    persistProgress();
    updateProgress();
  } else {
    feedback.className = "feedback-box try-again";
    feedback.textContent = attempt.length < word.length ? "Keep going. Every letter slot needs a letter." : "Nearly there. Listen again, clear the letters and try once more.";
  }
}

function tutorReply(message) {
  const word = words[currentWordIndex].word;
  const lower = message.toLowerCase();
  if (!lower.includes(word)) return `That is a good start. Can you add the word \"${word}\" to your answer?`;
  if (message.split(/\s+/).length < 5) return `You used \"${word}\" correctly. Add one more detail: who, where or why?`;
  return `Excellent use of \"${word}\". Your idea is clear. Now say your sentence aloud with a confident voice.`;
}

function sendTutorMessage() {
  const input = $("#tutor-input");
  const message = input.value.trim();
  if (!message) return;
  const log = $("#chat-log");
  log.insertAdjacentHTML("beforeend", `<div class="chat-message student-message"><span>A</span><p>${escapeHtml(message)}</p></div>`);
  input.value = "";
  log.scrollTop = log.scrollHeight;
  setTimeout(() => {
    log.insertAdjacentHTML("beforeend", `<div class="chat-message tutor-message"><span>N</span><p>${escapeHtml(tutorReply(message))}</p></div>`);
    log.scrollTop = log.scrollHeight;
  }, 550);
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function startQuiz() {
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
  $("#quiz-options").innerHTML = question.options.map((option, index) => `<button class="quiz-option" type="button" data-answer="${index}">${option}</button>`).join("");
  $("#quiz-options").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answer))));
  initialiseIcons();
}

function answerQuiz(selected) {
  if (quizLocked) return;
  quizLocked = true;
  const question = quizQuestions[quizIndex];
  const options = $("#quiz-options").querySelectorAll("button");
  options.forEach((option) => option.disabled = true);
  options[question.answer].classList.add("correct");
  if (selected === question.answer) {
    quizCorrect += 1;
    $("#quiz-feedback").textContent = question.success;
    $("#quiz-feedback").style.color = "var(--green)";
  } else {
    options[selected].classList.add("wrong");
    $("#quiz-feedback").textContent = `Good try. ${question.success}`;
    $("#quiz-feedback").style.color = "#a83a30";
  }
  $("#quiz-score").textContent = `${quizCorrect * 20} XP`;
  $("#next-question").classList.remove("hidden");
}

function nextQuizQuestion() {
  quizIndex += 1;
  if (quizIndex < quizQuestions.length) renderQuizQuestion();
  else showQuizResult();
}

function showQuizResult() {
  const earned = quizCorrect * 20;
  xp += earned;
  persistProgress();
  updateProgress();
  $("#quiz-question").classList.add("hidden");
  $("#quiz-result").classList.remove("hidden");
  $("#result-title").textContent = quizCorrect >= 4 ? "Brilliant word power!" : "Your words are growing!";
  $("#result-copy").textContent = quizCorrect >= 4 ? "You reached the mastery goal for this vocabulary group." : "Review the green answers, then try the challenge again.";
  $("#result-score").textContent = `${quizCorrect} / ${quizQuestions.length}`;
  $("#result-xp").textContent = `+${earned} XP`;
  $("#quiz-state").textContent = quizCorrect >= 4 ? "OK" : "4";
  initialiseIcons();
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setLectureComplete() {
  localStorage.setItem("ehelVocabularyLectureComplete", "true");
  $("#continue-to-lesson").disabled = false;
  $("#lecture-watch-fill").style.width = "100%";
  $(".lecture-watch-track").setAttribute("aria-valuenow", "100");
  $("#lecture-status").classList.add("complete");
  $("#lecture-status").innerHTML = '<i data-lucide="check-circle-2"></i>Lecture complete. Your word lesson is unlocked.';
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
  $("#lecture-gate").scrollIntoView({ behavior: "smooth", block: "start" });
}

function initialiseLecture() {
  const alreadyComplete = localStorage.getItem("ehelVocabularyLectureComplete") === "true";
  const teacherReviewMode = new URLSearchParams(window.location.search).get("view") === "teacher-review";
  if (alreadyComplete) {
    setLectureComplete();
    showLessonWorkspace();
  } else if (teacherReviewMode) {
    showLessonWorkspace();
  }

  lectureVideo.addEventListener("timeupdate", () => {
    if (!Number.isFinite(lectureVideo.duration) || lectureVideo.duration <= 0) return;
    const percentage = Math.min(100, Math.round((lectureVideo.currentTime / lectureVideo.duration) * 100));
    $("#lecture-watch-fill").style.width = `${percentage}%`;
    $(".lecture-watch-track").setAttribute("aria-valuenow", String(percentage));
    if (percentage >= 90) setLectureComplete();
  });
  lectureVideo.addEventListener("ended", setLectureComplete);
}

function wireEvents() {
  $$(".mode-tab").forEach((tab) => tab.addEventListener("click", () => switchMode(tab.dataset.mode)));
  $("#listen-button").addEventListener("click", (event) => speak(words[currentWordIndex].word, 0.82, event.currentTarget));
  $("#slow-button").addEventListener("click", (event) => speak(words[currentWordIndex].word, 0.48, event.currentTarget));
  $("#sentence-audio").addEventListener("click", (event) => speak(words[currentWordIndex].sentences[currentSentenceIndex], 0.82, event.currentTarget));
  $("#spelling-audio").addEventListener("click", (event) => speak(words[currentWordIndex].word, 0.68, event.currentTarget));
  $("#sentence-card").addEventListener("click", (event) => {
    event.currentTarget.classList.toggle("flipped");
    const flipped = event.currentTarget.classList.contains("flipped");
    event.currentTarget.setAttribute("aria-label", flipped ? "Flip back to the sentence" : `Flip sentence ${currentSentenceIndex + 1} for a word-type clue`);
  });
  $("#previous-sentence").addEventListener("click", () => changeSentence(-1));
  $("#next-sentence").addEventListener("click", () => changeSentence(1));
  $$("#type-selector button").forEach((button) => button.addEventListener("click", () => {
    const firstMatchingWord = words.findIndex((word) => word.type === button.dataset.type);
    if (firstMatchingWord >= 0) selectWord(firstMatchingWord);
  }));
  $("#previous-word").addEventListener("click", () => selectWord(currentWordIndex - 1));
  $("#next-word").addEventListener("click", () => selectWord(currentWordIndex + 1));
  $("#know-word").addEventListener("click", markCurrentWord);
  $("#review-button").addEventListener("click", () => {
    const firstUnmastered = words.findIndex((item) => !masteredWords.has(item.word));
    selectWord(firstUnmastered >= 0 ? firstUnmastered : 0);
    switchMode("learn");
  });
  $("#replay-lecture").addEventListener("click", showLectureGate);
  $("#continue-to-lesson").addEventListener("click", showLessonWorkspace);
  $("#sentence-input").addEventListener("input", (event) => $("#sentence-count").textContent = `${event.target.value.length} / 160`);
  $("#sentence-hint").addEventListener("click", () => {
    $("#sentence-input").value = words[currentWordIndex].starter + " ";
    $("#sentence-input").focus();
    $("#sentence-count").textContent = `${$("#sentence-input").value.length} / 160`;
  });
  $("#check-sentence").addEventListener("click", checkSentence);
  $("#clear-spelling").addEventListener("click", () => buildSpelling(words[currentWordIndex].word));
  $("#check-spelling").addEventListener("click", checkSpelling);
  $$("[data-tutor-chip]").forEach((button) => button.addEventListener("click", () => {
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
    words.forEach((item) => masteredWords.add(item.word));
    persistProgress();
    renderWordList();
    updateProgress();
    showToast("Vocabulary group complete. Excellent work!");
  });
}

initialiseLecture();
wireEvents();
selectWord(0);
initialiseIcons();
