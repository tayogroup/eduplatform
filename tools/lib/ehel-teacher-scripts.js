// The one definition of which Grade/Stage 1 activities get a stored
// "Teach me the activity" script — shared by the generator
// (generate-ehel-teacher-scripts.mjs), the narrator
// (generate-ehel-teacher-audio.js) and the check (check-ehel-teacher-scripts.mjs),
// so "what should exist" cannot drift between the tool that makes it and the
// tool that proves it.
//
// Per subject: the nav's own section ids and labels (shell/subjects/*.js)
// minus reference/adult/stage-level pages — Unit Study Plan, Teacher & Parent
// Guide / For the Grown-Up, Progress, Capstone, Placement. Per-unit
// availability follows each subject's own rule: English's Games only where a
// game pack exists and the final course quiz on Unit 10; Global Perspectives'
// data predicates. English Unit 0 is withdrawn and gets nothing.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

// Must match TEACH_ME_MESSAGE in shell/wehel.js — the live path for Grades 2+
// answers the same ask a stored script answered (the contract gate holds it).
const TEACH_ME_MESSAGE = "Be my teacher for this activity: explain what it is and why we are doing it, tell me what you expect from me, then take me through it step by step — one step at a time.";

const SUBJECTS = {
  english: {
    label: "English",
    skipUnits: [0],
    sections: (unit, unitNo, ctx) => [
      ["overview", "Overview"], ["lecture", "Video lesson"], ["dictionary", "Vocabulary"], ["reading", "Reading & story"],
      ["comprehension", "Comprehension"], ["grammar", "Grammar"], ["speaking", "Speaking"], ["writing", "Writing"],
      ["activities", "Activities"], ...(ctx.hasGamePack(unitNo) ? [["games", "Games"]] : []), ["quiz", "Quiz"], ["ebooks", "Books"],
      ...(unitNo === 10 ? [["final-quiz", "Final course quiz"]] : []),
    ],
  },
  science: {
    label: "Science",
    sections: () => [
      ["overview", "Unit Overview"], ["lesson", "The Lesson"], ["words", "Science Words"], ["explore", "Explore the Concept"],
      ["visuals", "Visual Models"], ["method", "Learn the Method"], ["examples", "Worked Examples"], ["guided", "Guided Practice"],
      ["reference", "Quick Reference"], ["activities", "Experiments"], ["games", "Games"], ["fluency", "Science Fluency"],
      ["problems", "Solve Real Problems"], ["explain", "Explain Your Thinking"],
    ],
  },
  mathematics: {
    label: "Mathematics",
    sections: () => [
      ["overview", "Unit Overview"], ["lesson", "The Lesson"], ["words", "Math Words & Symbols"], ["explore", "Explore the Concept"],
      ["visuals", "Visual Models"], ["method", "Learn the Method"], ["examples", "Worked Examples"], ["guided", "Guided Practice"],
      ["activities", "Activities"], ["games", "Games"], ["fluency", "Math Fluency"], ["problems", "Solve Real Problems"],
      ["explain", "Explain Your Thinking"], ["challenge", "Unit Challenge"],
    ],
  },
  computing: {
    label: "Computing",
    sections: () => [
      ["overview", "Unit Overview"], ["tools", "Tools & Setup"], ["lesson", "The Lesson"], ["words", "Computing Words"],
      ["explore", "Explore the Concept"], ["visuals", "Visual Models"], ["code", "Code Examples"], ["method", "Learn the Method"],
      ["examples", "Worked Examples"], ["guided", "Guided Practice"], ["reference", "Quick Reference"], ["activities", "Build It"],
      ["debug", "Debug It"], ["games", "Games"], ["fluency", "Computing Fluency"], ["problems", "Solve Real Problems"],
      ["safety", "Stay Safe Online"], ["explain", "Explain Your Thinking"], ["project", "Unit Project"], ["challenge", "Unit Challenge"],
    ],
  },
  "global-perspectives": {
    label: "Global Perspectives",
    // Data-driven, mirroring SECTIONS in shell/subjects/global-perspectives.js.
    sections: (c) => [
      ["overview", "Unit Overview", true],
      ["lesson", "The Lesson", c.explainers?.length], ["bigideas", "Big Ideas", c.bigIdeas?.length],
      ["models", "Worked Examples", c.models?.length], ["goals", "My Learning Goals", c.outcomes?.length],
      ["toolkit", "Skills Toolkit", c.toolkit?.length || c.checklists?.length], ["words", "Skill Words", c.reference?.vocabulary?.length],
      ["challenge", "My Challenge", c.challenge?.intro || c.challenge?.topics?.length], ["activities", "Activities", c.activities?.length],
      ["project", "Mini-Project", c.project?.steps?.length], ["practice", "Practice", c.practice?.length],
      ["quiz", "Unit Quiz", c.assessment?.questions?.length], ["reflect", "Reflection", c.reflection?.length || c.selfAssessment?.length],
      ["teacher", "Teacher Session", c.teacherSessions?.length || c.speakingPrompts?.length],
    ].filter(([, , has]) => Boolean(has)).map(([id, label]) => [id, label]),
  },
};

// What the voice reads, and therefore what is hashed into the clip's name:
// emoji and markdown symbols stripped, whitespace collapsed — the same
// normalisation the panel applies before speaking (speakableText in
// shell/wehel.js). Generator, narrator and check all hash THIS, so a stored
// hash is the clip the app asks for, with no rewriting between tools.
const { cyrb53, clean } = require("./ehel-narration-hash");
const speakable = (text) => clean(String(text || "")
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/gu, " ")
  .replace(/[*_`#]+/g, " "));
const scriptHash = (text) => cyrb53(speakable(text));

// ACTIVITY OUTLINES — what a page actually asks the learner to do, in order,
// written from the page's own controls (shell/subjects/*.js), so the stored
// teacher walkthrough names the buttons that are really there and covers
// every activity: listening, reading, saying, spelling, writing, marking done.
// Owner decision 2026-08-20: "Teach me the activity" must be COMPLETE — not a
// framing plus step 1 — starting with Grade 1 Unit 1 Vocabulary as the model.
// A section with an outline gets the full walkthrough in ONE message; a
// section without one keeps the shorter opening until its outline is written.
// `{count}` is replaced with the number of items on the page when known.
const ACTIVITY_OUTLINES = {
  english: {
    dictionary: {
      items: (unit) => (unit.dictionaryLinks || []).length,
      itemNoun: "words",
      activities: [
        "The word list is on the left: press a word to open its card. You will work through every one of the {count} words, one at a time.",
        "Hear it and Again: press Hear it to listen to the word, say it out loud yourself, then press Again and say it once more — out loud, not in your head.",
        "Meaning: read the meaning on the card, press its speaker to hear it read, then say in your own words what the word means.",
        "In a sentence: read each practice sentence, press Hear sentence to listen to it, and use the arrows to go through every sentence; read one of them out loud yourself.",
        "Spelling: look at the letters shown on the card, say them one by one, and say the whole word again.",
        "Write your own sentence: type a sentence with the word in the box (the grey words give you a start), press Check sentence, read what the checker says and fix anything it points out.",
        "I know this word: when you can say it, know its meaning and have written a sentence, press I know this word — it gets a LEARNED tag in the list.",
        "Next word: press the next word in the list and do the same steps. The page is finished when every word has a LEARNED tag.",
        // Grade 1 pages show BOTH designs (BOTH_DESIGNS in english.js): the
        // list-and-card above, and the same words as a slide deck underneath.
        "The slides at the bottom of the page: under the word list there is a deck of slides with the same words, one word per slide. Start it with the Start button on its first slide, which says Say the words. On each slide press Hear it and Again to listen and say the word, press Meaning to hear the meaning, read the sentences and press Hear sentence, look at the Spelling line, open Write your own sentence to type your sentence and press Check sentence, then press I know this word. Press the arrow on the right to go to the next slide (the dots under the slide show where you are). On the last slide, when every word is marked, press the finish button. You can learn the words either way — the card at the top or the slides at the bottom — the words are the same.",
      ],
    },
    overview: { activities: [
      "Read the unit preview on this page: it tells you what you will learn in this unit. Press the Listen button if there is one and follow the words.",
      "Read the four steps under How to learn — that is how you will work through every page of this unit.",
      "Press I have previewed this unit, then press Open vocabulary to go on to the first page.",
    ] },
    lecture: { activities: [
      "Press play on the video lesson and watch it to the end. Listen, and read the captions as they appear.",
      "Say the words and sentences from the video out loud when the teacher in the video says them.",
      "When the video has finished, press the button under it to go on to Vocabulary.",
    ] },
    reading: { items: (unit) => (unit.readings || []).length, itemNoun: "texts", activities: [
      "There are {count} texts on the reading shelf. Read the text on the screen slowly, and read it out loud if you can.",
      "To hear it read to you, press Prepare audio and then the play button. Listen and follow the words with your finger.",
      "If a text is a listening text, listen to it first and then read along; the story of the unit is the one the Comprehension questions are about, so read it carefully.",
      "Use Next text and Previous text to move between the texts, and read every one.",
      "The slides at the bottom of the page: under the reading there is a deck of slides with the same text one page at a time. Press Start on the first slide (Read the story), read or press the speaker to listen on each page, press the arrow to turn the page, and on the last page press I have read this text.",
      "Press Finished reading when you have read all the texts.",
    ] },
    comprehension: { items: (unit) => (unit.comprehension || []).length, itemNoun: "questions", activities: [
      "There are {count} questions about the texts you read. Read each question and think about the text.",
      "Type your answer in the box in a full sentence.",
      "Press Check guidance to see a good answer and compare it with yours (if your box is empty the page asks you to write first). Do this for every question.",
      "The slides at the bottom of the page: under the questions there is a deck with one question per slide (Think about the story). Press Start, say your answer, press Check guidance to see a good answer, press the arrow for the next question, and on the last slide press Finish comprehension.",
      "Press Finish comprehension at the bottom when you have answered them all.",
    ] },
    grammar: { items: (unit) => (unit.grammar || []).length, itemNoun: "lessons", activities: [
      "There are {count} grammar lessons. Read the rule and the examples in each lesson, and press the speaker or Replay to hear it read to you.",
      "Say the examples out loud.",
      "Open Show practice under the lesson and try the practice sentences; press Hear the practice to check how they sound. Do this for every lesson.",
      "The slides at the bottom of the page: under the lessons there is a deck with one pattern per slide (Say the patterns). Press Start, say the pattern out loud, try the practice, press the speaker to hear it, and go through every pattern to the last slide to finish.",
      "Press the I practised all the lessons button at the bottom when you have done them all.",
    ] },
    speaking: { items: (unit) => (unit.speaking || []).length, itemNoun: "practices", activities: [
      "There are {count} speaking practices. In each one, press the speaker or Replay to hear the model; listen twice, then say it out loud yourself.",
      "Record: press the microphone, say the sentence, and press it again to stop.",
      "Listen: play your recording back and listen to yourself.",
      "Submit: press Submit for pronunciation check (it turns on after you have listened back), then read what the checker says, and record again if you want to do better. Do this for every practice.",
      "The slides at the bottom of the page: under the practices there is a deck with one practice per slide (Use your voice). Press Start, press Hear model, say it yourself, press Record to record and then Submit, and press the arrow for the next practice.",
      "Press the Finish speaking practices button at the bottom when you have done them all.",
    ] },
    writing: { items: (unit) => (unit.writing || []).length, itemNoun: "tasks", activities: [
      "There are {count} writing tasks. Choose one from the list, read the task, and press Hear the task if there is a speaker.",
      "Open View model text to see an example of good writing.",
      "Write your own in the big box — at least eight words. Use the Writer's checklist; Support helps you if you are stuck, and Challenge gives you more to do.",
      "Press Submit this draft. Your writing is saved, and you can come back and make it better any time. Do every task, one after another.",
      "The slides at the bottom of the page: under the tasks there is a deck with one task per slide (Plan, write and improve). Press Start, write your sentences in the box — at least eight words — press Submit this draft, and press the arrow for the next task.",
    ] },
    activities: { items: (unit) => (unit.activities || []).length, itemNoun: "activities", activities: [
      "There are {count} activities. Read the instructions for each one, and press Hear the instructions to listen to them.",
      "Do the activity. Some ask you to write your answer in the box.",
      "Press Mark complete under each activity when you have done it.",
      "The slides at the bottom of the page: under the activities there is a deck with one activity per slide (Learn by doing). Press Start, do the activity, press Mark complete, press the arrow for the next one, and on the last slide press Finish activities.",
      "Press Finish activities at the bottom when you have done them all.",
    ] },
    games: { activities: [
      "Press a game to open it. Play the game: you earn stars and XP for what you know, and hints and retries are always there — use them.",
      "Play every game at least once, and play again to get more stars.",
      "When you have played them all, press I have played them all (if you master every game, the page finishes by itself).",
    ] },
    quiz: { items: (unit) => (unit.quizzes || []).length, itemNoun: "questions", activities: [
      "There are {count} questions. Read each one carefully and choose one answer. (Your teacher explains how to think about each question, never the answers.)",
      "You see your score at the end. The quiz is passed with more than half right.",
      "If your score is not high enough, press Try again and do the quiz once more; then press Continue to go to My progress.",
    ] },
    ebooks: { activities: [
      "Choose a book from the shelf.",
      "Read it page by page with the arrows, or watch it if it plays as a video, and tap the pictures to hear their sounds.",
      "Read or watch it right to the end, then press Finish book on the last page. One book finishes this page — read more if you like.",
    ] },
    "final-quiz": { activities: [
      "This is the final quiz of the whole course. Read each question carefully and choose one answer. (Your teacher explains how to think about the questions, never the answers.)",
      "You see your score at the end; if it is not high enough, press Try again.",
      "Then press Continue.",
    ] },
  },
  // Science, Mathematics and Computing share one course design (one page per
  // section, the same controls; Stage 1 shows the classic page and, for most
  // sections, the same items as a slide deck under it). Button labels below
  // are the subject's own, read from its renderer.
  science: sciencelikeOutlines({
    words: ["Science Words", "I explored the science words"],
    activities: ["Experiments", "hands-on experiments"],
    fluency: ["Science Fluency"],
    explain: ["Check scientific ideas"],
    reference: ["Quick Reference", "Reference reviewed"],
  }),
  mathematics: sciencelikeOutlines({
    words: ["Math Words & Symbols", "I know these words and symbols"],
    activities: ["Activities", "hands-on activities"],
    fluency: ["Math Fluency"],
    explain: ["Check mathematical ideas"],
    challenge: ["Unit Challenge"],
  }),
  computing: Object.assign(sciencelikeOutlines({
    words: ["Computing Words", "I explored the computing words"],
    activities: ["Build It", "build-it activities"],
    fluency: ["Computing Fluency"],
    explain: ["Check your reasoning"],
    reference: ["Quick Reference", "Reference reviewed"],
    challenge: ["Unit Challenge"],
  }), {
    tools: { activities: [
      "Read Tools & Setup: it tells you what you need for this unit and how to get it ready.",
      "Check each tool or setting it lists, with your grown-up if you need help.",
      "Press My tools are ready at the bottom when everything is set up.",
    ] },
    code: { activities: [
      "Read each code example: read the listing line by line and say what you think each line does.",
      "Press Copy the code to copy it, and try it yourself if you can; then press the button under the example to mark it done.",
      "The slides at the bottom of the page: under the examples there is a deck with one example per slide; press Start, read the code, mark it done, and press the arrow for the next one.",
      "Press Go to Build It when you have read every example.",
    ] },
    debug: { activities: [
      "Debug It: each card shows a small program with a bug in it. Read it and try to find the bug yourself first.",
      "Press Show the bug to see where it is and what it should be, and say why it was wrong; then press the button to mark that bug done.",
      "The slides at the bottom of the page: under the cards there is a deck with one bug per slide; press Start, find the bug, press Show the bug, mark it done, and press the arrow for the next one.",
      "Press I practised debugging at the bottom when you have done them all.",
    ] },
    safety: { activities: [
      "Stay Safe Online: read every rule slowly, and press Listen where there is a speaker.",
      "Say each rule in your own words and give an example from your own life.",
      "Press I know these rules at the bottom when you have read them all.",
    ] },
    project: { activities: [
      "Read the Unit Project: what you will make, and the list of things a good project has.",
      "Make your project step by step, ticking each thing on the list as you do it.",
      "Press My project is finished when every item on the list is ticked.",
    ] },
  }),
  "global-perspectives": {
    overview: { activities: [
      "Read the unit overview: the big question of this unit and what you will learn. Press Listen to the overview to hear it read to you.",
      "Say in your own words what the unit is about.",
      "Press I have read the overview at the bottom.",
    ] },
    lesson: { items: (unit) => (unit.explainers || []).length, itemNoun: "parts", activities: [
      "The Lesson has {count} parts. Read each part slowly, and press Listen to this part to hear it read to you.",
      "After each part, say one thing you learned from it.",
      "Press I have read the lesson at the bottom when you have read every part.",
    ] },
    bigideas: { activities: [
      "Read each Big Idea and press its Listen button.",
      "Say what the idea means in your own words and give an example from your own life.",
      "Press the Done button at the bottom when you have read them all.",
    ] },
    models: { activities: [
      "Read each worked example: it shows the skill done well, step by step.",
      "Say what the example did first, next and last.",
      "Press the Done button at the bottom when you have read them all.",
    ] },
    goals: { activities: [
      "Read My Learning Goals: what you are aiming for in this unit.",
      "Say each goal in your own words, and say which one you think will be hardest.",
      "Press the Done button at the bottom.",
    ] },
    toolkit: { activities: [
      "Read the Skills Toolkit: the steps and checklists for the skill of this unit.",
      "Say the steps in order, and keep this page in mind when you do the activities.",
      "Press the Done button at the bottom when you have read it.",
    ] },
    words: { activities: [
      "Read each Skill Word and its meaning, and press Listen to hear it.",
      "Say the word out loud and use it in a sentence of your own.",
      "Press the Done button at the bottom when you know the words.",
    ] },
    challenge: { activities: [
      "Read My Challenge: the project that runs through the whole unit, and the topics you can choose.",
      "Choose your topic and say why you chose it.",
      "Press the Done button at the bottom when you have chosen.",
    ] },
    activities: { items: (unit) => (unit.activities || []).length, itemNoun: "activities", activities: [
      "There are {count} activities. Read the instructions for each one, and press Listen where there is a speaker.",
      "Do the activity — talk, draw, sort or write, as it asks — with your grown-up if it says so.",
      "Press the Done button under each activity when you have done it, and the button at the bottom when you have done them all.",
    ] },
    project: { activities: [
      "Read the Mini-Project: what you will make and the steps to make it.",
      "Do the steps in order, one at a time.",
      "Press the Done button at the bottom when your project is finished.",
    ] },
    practice: { items: (unit) => (unit.practice || []).length, itemNoun: "questions", activities: [
      "There are {count} practice questions. Read each question and think about it.",
      "Write your answer in the box, then press Compare to see a model answer and compare it with yours. Nobody marks this — you check it yourself, honestly.",
      "The slides at the bottom of the page: under the questions there is a deck with one question per slide; press Start, write your answer, press Compare, press the arrow for the next question, and on the last slide press the finish button.",
      "Press I have finished practising at the bottom when you have done them all.",
    ] },
    quiz: { items: (unit) => (unit.assessment?.questions || []).length, itemNoun: "questions", activities: [
      "The Unit Quiz has {count} questions. Read each one and write your answer in the box.",
      "Press Compare to see the model answer and check your own answer against it. (Your teacher explains how to think about each question, never the answers.)",
      "The slides at the bottom of the page: under the quiz there is a deck with one question per slide; press Start, write your answer, press Compare, press the arrow for the next one, and on the last slide press the finish button.",
      "Press I have finished the quiz at the bottom when you have answered them all.",
    ] },
    reflect: { activities: [
      "Reflection: read each sentence about how you learn, and choose the answer that is true for you.",
      "Be honest — this shows your teacher where you need help.",
      "The slides at the bottom of the page: under the sentences there is a deck with one sentence per slide; press Start, choose your answer, press the arrow for the next one, and on the last slide press the finish button.",
      "Press I have finished reflecting at the bottom when every sentence has an answer.",
    ] },
    teacher: { activities: [
      "Teacher Session: read what to bring to your live session and the questions you will talk about.",
      "Say your answers out loud now, so you are ready.",
      "Press the Done button at the bottom when you have read it.",
    ] },
  },
};

// The shared Science / Mathematics / Computing course design, with each
// subject's own labels filled in: [sectionTitle, doneButton] per override.
function sciencelikeOutlines(labels) {
  const words = labels.words || ["Words", "I explored the words"];
  const activities = labels.activities || ["Activities", "hands-on activities"];
  const fluency = labels.fluency || ["Fluency"];
  const explain = labels.explain || ["Check your reasoning"];
  const deck = (noun, finish = "the finish button") => `The slides at the bottom of the page: under the page there is a deck of slides with the same ${noun}, one per slide. Press Start on the first slide, use the same buttons on each slide, press the arrow on the right to go to the next slide (the dots under the slide show where you are), and on the last slide press ${finish}.`;
  const out = {
    overview: { activities: [
      "Read the Unit Overview: what this unit is about and what you will be able to do. Press Listen where there is a speaker.",
      "Say in your own words what you think you will learn.",
      "Press Continue to go to The Lesson.",
    ] },
    lesson: { items: (unit) => (unit.concepts || []).length, itemNoun: "concepts", activities: [
      "The Lesson has {count} concepts, each a short explanation with an example. Read each one slowly and press Listen to hear it read to you.",
      "Say the example out loud, and try it with your own numbers or objects.",
      "Read every concept, then press I studied the concepts at the bottom.",
      deck("concepts"),
    ] },
    words: { activities: [
      `${words[0]}: read each word and what it means, and press Listen to hear it.`,
      "Say the word out loud, say the meaning in your own words, then type a sentence with the word and press Check sentence; read what the checker says.",
      `Press ${words[1]} at the bottom when you have done every word.`,
      deck("words"),
    ] },
    explore: { items: (unit) => (unit.explorations || []).length, itemNoun: "discoveries", activities: [
      "There are {count} discoveries. Press a numbered tab to open one, read the situation and look at the picture or model.",
      "Read the discovery question, think, then type your idea in the box and press Check my idea. If it says Look again, press Hint and try once more; when it says Exactly!, the tab gets a tick.",
      "Do all of them — the page is finished when every discovery question has been answered right.",
      deck("discoveries"),
    ] },
    visuals: { items: (unit) => (unit.visualModels || []).length, itemNoun: "models", activities: [
      "There are {count} visual models — pictures and 3D shapes of the ideas in this unit. Look at each one; if it moves, drag it to turn it and press its buttons to change it.",
      "Read the caption under each one and press Listen to hear it.",
      "Press I explored the models at the bottom when you have looked at them all.",
    ] },
    method: { items: (unit) => (unit.methods || []).length, itemNoun: "methods", activities: [
      "There are {count} methods — ways to work things out step by step. Read the first step of a method, then press Show me the next step to see the next one.",
      "Keep pressing until it says Method complete, saying each step out loud as you go.",
      "Do this for every method — the page is finished when all of them have been stepped through to the end.",
      deck("methods"),
    ] },
    examples: { items: (unit) => (unit.workedExamples || []).length, itemNoun: "worked examples", activities: [
      "There are {count} worked examples, each a question with the full working shown. Read the question first and try it yourself.",
      "Then press Show worked solution and compare your working with the solution, line by line.",
      "Open all of them — the counter at the top shows how many you have opened, and the page is finished when all are open.",
      deck("examples"),
    ] },
    guided: { items: (unit) => (unit.practice || []).length, itemNoun: "questions", activities: [
      "There are {count} practice questions. Read a question and work it out on paper or in your head.",
      "Type your answer in the box and press Check my answer. Stuck? Press Give me a hint — you get up to three — and Show next step shows one line of the working.",
      "Do this for every question until each one is right — that is when the page is finished.",
      deck("questions"),
    ] },
    activities: { items: (unit) => (unit.activities || []).length, itemNoun: activities[1], activities: [
      `There are {count} ${activities[1]}. Each one tells you what to use and what to do. Read it and press Listen to hear it, then get the things it names.`,
      "Do the activity, and write your answer, or what you noticed, in the box.",
      "Press Mark complete under each activity when you have done it, then Finish activities at the bottom when every one is marked.",
      deck(activities[1], "Finish activities"),
    ] },
    reference: { activities: [
      "Quick Reference: the key facts and words of this unit on one page. Read it slowly, and press Listen where there is a speaker.",
      "Say the key facts in your own words.",
      "Press Reference reviewed at the bottom when you have read it.",
    ] },
    games: { activities: [
      "Press Start game on a game. Answer each round — you earn a star for every round you get right.",
      "Press Play again to earn more stars; a game is mastered when it has all its stars.",
      "Master every game — the page finishes by itself when every game is mastered.",
    ] },
    fluency: { items: (unit) => (unit.fluency || []).length, itemNoun: "quick questions", activities: [
      `${fluency[0]}: a sprint of {count} quick questions. Answer them as fast as you can — type your answer and press Check & continue for each one; your time is shown at the top.`,
      "You need most of them right; if you get fewer, press Run the sprint again.",
      "The page is finished when a sprint has enough right.",
    ] },
    problems: { items: (unit) => (unit.realProblems || []).length, itemNoun: "problems", activities: [
      "There are {count} real-world problems. Read the situation carefully and decide what is being asked.",
      "Work it out, then type your working and answer in the box and press Check answer; press Hint if you are stuck.",
      "When it says your answer is right, that problem is done — the page is finished when all of them are.",
      deck("problems"),
    ] },
    explain: { items: (unit) => (unit.reasoningPrompts || []).length, itemNoun: "prompts", activities: [
      "There are {count} prompts that ask you to explain your thinking. Read the prompt and the key ideas under it.",
      `Write your explanation in the box — what you know, what rule you used, and why your conclusion makes sense — then press ${explain[0]}. If it asks for more, add more and check again.`,
      "Open Show model explanation to compare with a good answer. The page is finished when every explanation uses the key ideas.",
      deck("prompts"),
    ] },
  };
  if (labels.challenge) {
    out.challenge = { items: (unit) => (unit.assessment?.questions || []).length, itemNoun: "questions", activities: [
      `The ${labels.challenge[0]} has {count} questions. Read each one and choose your answer, then press Next question. (Your teacher explains how to think about each question, never the answers.)`,
      "You see your score at the end; it is passed with more than half right. If your score is not high enough, press Try again.",
      "Then press Continue.",
    ] };
  }
  return out;
}

// The chip message for one activity. A section with an outline asks for the
// complete walkthrough in one message — this is the written guide for the
// whole page, not a live turn — naming every activity in order, with what to
// press, how to do it well and what is expected, then how the learner knows
// the page is finished. Without an outline it is TEACH_ME_MESSAGE alone.
function teachMessageFor(subject, sectionId, label, unit) {
  const outline = ACTIVITY_OUTLINES[subject]?.[sectionId];
  if (!outline) return TEACH_ME_MESSAGE;
  const count = typeof outline.items === "function" ? outline.items(unit) : 0;
  const lines = outline.activities.map((line, index) => `${index + 1}. ${line.replace(/\{count\}/g, String(count || "the"))}`);
  return `${TEACH_ME_MESSAGE}\n\nThis is the written guide for the WHOLE "${label}" page, so unlike a live turn, give ALL the steps in this one message — numbered, one short paragraph each, in plain text with a line break between steps. The activities on this page, in order, are:\n${lines.join("\n")}\nCover every one of them: for each, say exactly what to press or do (use the button names as written), how to do it well, and what you expect from me. Then say how I will know the page is finished. Keep every sentence short and in words a Grade 1 child understands, and speak as my teacher, warmly.`;
}

const dataDirFor = (subject) => path.join(EHEL, subject, "grade-1", "data");
const scriptsFileFor = (subject) => path.join(dataDirFor(subject), "teacher-scripts.json");
const audioDirFor = (subject) => path.join(dataDirFor(subject), "teacher-audio");

// Every (unit, section) that should carry a script for one subject:
// [{ unitNo, unitTitle, sectionId, label, unit }]. Reads the manifest and units.
function expectedScripts(subject) {
  const def = SUBJECTS[subject];
  if (!def) throw new Error(`Unknown subject ${subject}`);
  const dataDir = dataDirFor(subject);
  const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "course-manifest.json"), "utf8"));
  const ctx = { hasGamePack: (n) => fs.existsSync(path.join(dataDir, "games", `unit-${n}.json`)) };
  const out = [];
  for (const entry of manifest.units) {
    const unitNo = Number(entry.number);
    if ((def.skipUnits || []).includes(unitNo)) continue;
    const unitFile = path.join(dataDir, "units", `unit-${unitNo}.json`);
    if (!fs.existsSync(unitFile)) continue;
    const unit = JSON.parse(fs.readFileSync(unitFile, "utf8"));
    for (const [sectionId, label] of def.sections(unit, unitNo, ctx)) {
      out.push({ unitNo, unitTitle: entry.title, sectionId, label, unit });
    }
  }
  return { manifest, expected: out };
}

module.exports = { SUBJECTS, TEACH_ME_MESSAGE, ACTIVITY_OUTLINES, teachMessageFor, dataDirFor, scriptsFileFor, audioDirFor, expectedScripts, speakable, scriptHash };
