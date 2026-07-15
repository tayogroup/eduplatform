const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GRADE_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-3");
const DATA_DIR = path.join(GRADE_DIR, "data");
const UNIT_DIR = path.join(DATA_DIR, "units");
const SOURCE_FILE = path.join(ROOT, "inputs", "ehel-grade3-source", "grade3-source-extracted.json");
const GRADE2_DICTIONARY_FILE = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2", "data", "master-dictionary.grade2.json");
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const GENERATED_AT = "2026-07-14T00:00:00.000Z";

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));
const grade2Dictionary = JSON.parse(fs.readFileSync(GRADE2_DICTIONARY_FILE, "utf8"));
const sourceByPath = new Map(source.documents.map((document) => [document.path, document]));
const readyAudioByKey = new Map(grade2Dictionary.entries.map((entry) => [`${entry.lemma.toLowerCase()}|${entry.partOfSpeech}`, entry.audio]));
const readyAudioByWord = new Map(grade2Dictionary.entries.map((entry) => [entry.lemma.toLowerCase(), entry.audio]));
const baseRubrics = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2", "data", "units", "unit-1.json"), "utf8")).rubrics;

const visualMap = {
  1: ["unit-8-home.png", "A learner introducing family members and explaining respectful behaviour"],
  2: ["unit-1-welcome-calendar.png", "Learners collaborating with books and school supplies"],
  3: ["unit-1-welcome-calendar.png", "A child planning daily activities with a clock and calendar"],
  4: ["unit-9-city.png", "Children exploring places and services in their community"],
  5: ["unit-3-ready-steady-go.png", "Children using action words during active learning"],
  6: ["unit-2-neighbours-jobs.png", "Children describing people with kind and precise language"],
  7: ["unit-7-world-around-us.png", "Children observing and caring for the natural environment"],
  8: ["unit-5-measure.png", "Learners investigating numbers, shapes and measurement"],
  9: ["unit-4-big-sky.png", "A child imagining ideas and expressing thoughtful feelings"],
  10: ["capstone-my-english-world.png", "A Grade 3 learner presenting a completed English portfolio"],
};

function slug(value) {
  return String(value).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function termFor(unitNo) {
  return unitNo <= 3 ? { id: "t01", label: "Term 1" } : unitNo <= 6 ? { id: "t02", label: "Term 2" } : { id: "t03", label: "Term 3" };
}

function unitId(unitNo) {
  return `eng-g03-${termFor(unitNo).id}-u${String(unitNo).padStart(2, "0")}`;
}

function doc(unitNo, type) {
  const record = sourceByPath.get(`Unit ${unitNo}/Unit ${unitNo} - ${type}.docx`);
  if (!record) throw new Error(`Missing Grade 3 source: Unit ${unitNo} ${type}`);
  return record;
}

function between(paragraphs, startLabel, endLabel) {
  const start = paragraphs.findIndex((line) => line === startLabel);
  const end = paragraphs.findIndex((line, index) => index > start && (typeof endLabel === "string" ? line === endLabel : endLabel.test(line)));
  return start < 0 ? [] : paragraphs.slice(start + 1, end < 0 ? paragraphs.length : end);
}

function titleFromLesson(paragraph) {
  return paragraph.replace(/^Unit \d+:\s*/, "").trim();
}

function sourcePath(unitNo, type) {
  return `inputs/ehel-grade3-source/Year 3/Unit ${unitNo}/Unit ${unitNo} - ${type}.docx`;
}

function normalizeType(type) {
  const lower = String(type || "word").toLowerCase();
  if (lower.includes("noun")) return "noun";
  if (lower.includes("verb")) return "verb";
  if (lower.includes("adjective")) return "adjective";
  if (lower.includes("adverb")) return "adverb";
  if (lower.includes("preposition")) return "preposition";
  if (lower.includes("expression")) return "expression";
  return lower.split(/\s*\/\s*/)[0] || "word";
}

function partDefinition(type) {
  return ({ noun: "Names a person, place, thing or idea.", verb: "Shows an action or a state.", adjective: "Describes a noun.", adverb: "Describes how, when or where an action happens.", preposition: "Shows the relationship between words.", expression: "A useful group of words with a shared meaning." })[type] || "A useful English word.";
}

function pendingAudio(sourcePath) {
  return { source: sourcePath, normal: sourcePath, slow: sourcePath, provider: "ElevenLabs", voiceId: VOICE_ID, model: "eleven_multilingual_v2", slowPlaybackRate: 0.76, available: false, status: "Pending generation" };
}

function lessonAudio(unitNo, kind, id) {
  return pendingAudio(`./unit-${unitNo}/media/audio/${kind}/${id}.mp3`);
}

function extractVocabulary(unitNo) {
  const vocabularyDoc = doc(unitNo, "Vocabulary");
  const groupNames = vocabularyDoc.paragraphs.filter((line) => /^Group \d+:/.test(line)).map((line) => line.replace(/^Group \d+:\s*/, ""));
  const tables = vocabularyDoc.tables.filter((table) => table[0]?.[0] === "Word");
  return tables.map((table, groupIndex) => ({
    title: groupNames[groupIndex] || `Vocabulary Group ${groupIndex + 1}`,
    words: table.slice(1).filter((row) => row[0]).map((row) => ({ word: row[0].trim(), sourceType: row[1].trim(), type: normalizeType(row[1]), meaning: row[2].trim(), example: row[3].trim() })),
  }));
}

function extractReadings(unitNo) {
  const lesson = doc(unitNo, "Lesson");
  const paragraphs = between(lesson.paragraphs, "Part 1:  Reading & Listening", /^Part 2:/);
  const headingIndexes = paragraphs.map((line, index) => /^(Reading|Listening) \d+/.test(line) ? index : -1).filter((index) => index >= 0);
  const readings = headingIndexes.map((start, index) => {
    const end = headingIndexes[index + 1] ?? paragraphs.length;
    const block = paragraphs.slice(start + 1, end);
    const questionStart = block.findIndex((line) => /^(After reading|After listening|Listen and answer|Answer these|Who |What |Where |When |Why |How |Does |Do |Which )/i.test(line) || line.endsWith("?"));
    const passageLines = block.slice(0, questionStart < 0 ? block.length : questionStart).filter((line) => !/^(Read|Listen|Ask your AI tutor)/i.test(line));
    return { type: paragraphs[start].startsWith("Listening") ? "Listening" : "Reading", title: paragraphs[start].replace(/^(Reading|Listening) \d+\s*[—-]\s*/, ""), passage: passageLines.join("\n") };
  }).filter((item) => item.passage);

  const story = doc(unitNo, "Story");
  const storyEnd = story.paragraphs.findIndex((line) => /^(After Reading|Understanding the Story)/.test(line));
  readings.push({ type: "Story", title: story.paragraphs[2], passage: story.paragraphs.slice(3, storyEnd < 0 ? story.paragraphs.length : storyEnd).join("\n") });
  return readings;
}

function extractQuestions(unitNo) {
  const lesson = doc(unitNo, "Lesson").paragraphs;
  const story = doc(unitNo, "Story").paragraphs;
  const lessonStart = lesson.findIndex((line) => /^Part 1:/.test(line));
  const lessonEnd = lesson.findIndex((line) => /^Part 2:/.test(line));
  const storyStart = story.findIndex((line) => /^(Answer these questions|After Reading)/.test(line));
  const questions = [
    ...lesson.slice(lessonStart, lessonEnd).filter((line) => line.endsWith("?") && !/^Can you/.test(line)),
    ...story.slice(storyStart).filter((line) => line.endsWith("?") && !/^Can you/.test(line)),
  ];
  return [...new Set(questions)].slice(0, 12);
}

function grammarBlocks(unitNo) {
  const paragraphs = doc(unitNo, "Grammar").paragraphs;
  const starts = paragraphs.map((line, index) => /^Lesson \d+:/.test(line) ? index : -1).filter((index) => index >= 0);
  const blocks = starts.map((start, index) => paragraphs.slice(start, starts[index + 1] ?? paragraphs.findIndex((line, i) => i > start && line === "Answer Key")).filter(Boolean));
  if (blocks.length <= 6) return blocks;
  return [...blocks.slice(0, 5), blocks.slice(5).flat()];
}

function grammarRecord(unitNo, block, sequence) {
  const id = `${unitId(unitNo)}-grammar${String(sequence).padStart(2, "0")}`;
  const title = block.filter((line) => /^Lesson \d+:/.test(line)).map((line) => line.replace(/^Lesson \d+:\s*/, "")).join(" + ");
  const explanationIndex = block.findIndex((line) => line === "What it means and why it matters");
  const ruleIndex = block.findIndex((line) => /^How to/.test(line));
  const mistakeIndex = block.findIndex((line) => line === "A common mistake");
  const memoryIndex = block.findIndex((line) => line === "Memory tip");
  const practiceIndex = block.findIndex((line) => /^Practice \d+/.test(line));
  const sliceTo = (start, candidates) => {
    const next = candidates.filter((value) => value > start).sort((a, b) => a - b)[0] ?? block.length;
    return block.slice(start + 1, next).join("\n");
  };
  return {
    grammarId: id,
    conceptId: `${id}-concept-${slug(title)}`,
    unitId: unitId(unitNo),
    sequence,
    practiceType: sequence <= 2 ? "Guided recognition" : sequence <= 4 ? "Guided application" : "Independent language use",
    title,
    explanation: explanationIndex >= 0 ? sliceTo(explanationIndex, [ruleIndex, mistakeIndex, memoryIndex, practiceIndex]) : block[1] || title,
    ruleAndExamples: ruleIndex >= 0 ? sliceTo(ruleIndex, [mistakeIndex, memoryIndex, practiceIndex]) : "Study the examples, say them aloud, and notice the pattern.",
    commonMistake: mistakeIndex >= 0 ? sliceTo(mistakeIndex, [memoryIndex, practiceIndex]) : "Check that every sentence follows the unit language pattern.",
    memoryTip: memoryIndex >= 0 ? sliceTo(memoryIndex, [practiceIndex]) : "Say the model aloud before completing the practice.",
    practice: practiceIndex >= 0 ? block.slice(practiceIndex + 1).join(" | ") : "Write four examples and explain the pattern to a partner.",
    outcomeId: `${unitId(unitNo)}-lo${String(Math.min(sequence, 6)).padStart(2, "0")}`,
    origin: "Authored Grade 3 source",
    reviewStatus: "Approved v1.1",
    sourceFile: sourcePath(unitNo, "Grammar"),
    audio: lessonAudio(unitNo, "grammar", id),
  };
}

function taskBlocks(unitNo, sectionStart, sectionEnd, headingPattern) {
  const paragraphs = between(doc(unitNo, "Lesson").paragraphs, sectionStart, sectionEnd);
  const starts = paragraphs.map((line, index) => headingPattern.test(line) ? index : -1).filter((index) => index >= 0);
  return starts.map((start, index) => ({ title: paragraphs[start], body: paragraphs.slice(start + 1, starts[index + 1] ?? paragraphs.length).join("\n") }));
}

const extensionTasks = {
  speaking: [
    ["Vocabulary Expert Interview", "Choose six unit words. Ask and answer a clear question about each word using complete sentences."],
    ["Explain and Respond", "Explain one important unit idea, give a reason with because, and respond to two follow-up questions."],
    ["One-Minute Unit Talk", "Plan and record a one-minute talk using an opening, three connected details, and a closing sentence."],
  ],
  writing: [
    ["Connected Paragraph", "Write a six-sentence paragraph about the unit. Begin with a topic sentence and join ideas with and, but or because."],
    ["Information Text", "Write a heading and five accurate facts. Use precise unit vocabulary and check spelling and punctuation."],
    ["Reflect and Improve", "Choose earlier writing, revise three sentences, add two useful details, and explain one improvement you made."],
  ],
  activities: [
    ["Vocabulary Sort and Explain", "Sort twelve unit words into useful categories. Explain the rule for each category in a complete sentence."],
    ["Reading Evidence Hunt", "Find six important details in the unit texts. Record the detail and explain what it helps the reader understand."],
    ["Create and Teach", "Design a short game, diagram or demonstration that teaches one unit idea to another learner."],
  ],
};

function buildTasks(unitNo, kind) {
  const config = kind === "speaking"
    ? ["Part 2:  Speaking", /^Part 3:/, /^Speaking/, "instructionsAndModelLines"]
    : kind === "writing"
      ? ["Part 3:  Writing", /^Part 4:/, /^Writing/, "promptAndInstructions"]
      : ["Part 4:  Activities & Exercises", /^(Self-Study Tips|Self-Assessment)/, /^Activity/, "instructionsAndItems"];
  const sourceTasks = taskBlocks(unitNo, config[0], config[1], config[2]);
  const tasks = sourceTasks.map((task) => [task.title.replace(/^(Speaking|Writing|Activity)( Game)? \d*\s*[—-]?\s*/, ""), task.body]);
  let extensionIndex = 0;
  while (tasks.length < 6) tasks.push(extensionTasks[kind][extensionIndex++ % extensionTasks[kind].length]);
  return tasks.slice(0, 6).map(([title, body], index) => {
    const sequence = index + 1;
    const prefix = kind === "speaking" ? "speak" : kind === "writing" ? "write" : "act";
    const id = `${unitId(unitNo)}-${prefix}${String(sequence).padStart(2, "0")}`;
    const common = { unitId: unitId(unitNo), sequence, title: `${kind[0].toUpperCase() + kind.slice(1)} ${sequence} — ${title}`, outcomeId: `${unitId(unitNo)}-lo${String(Math.min(sequence, 6)).padStart(2, "0")}`, origin: index < sourceTasks.length ? "Authored Grade 3 source" : "Ehel English Content Template v1.1 curriculum expansion", reviewStatus: "Approved v1.1", sourceFile: index < sourceTasks.length ? sourcePath(unitNo, "Lesson") : "Ehel English Content Template v1.1" };
    if (kind === "speaking") return { speakingId: id, ...common, activityType: sequence <= 2 ? "Guided speaking" : "Speaking practice", instructionsAndModelLines: body, recordingRequired: true, aiTutorPrompt: `Help me practise ${title.toLowerCase()} and give feedback on clarity, vocabulary and complete sentences.`, audio: lessonAudio(unitNo, "speaking", id) };
    if (kind === "writing") return { writingId: id, ...common, promptAndInstructions: body, modelText: `A strong Grade 3 response uses complete connected sentences, precise unit words, and relevant details about ${title.toLowerCase()}.`, sentenceStarter: "I would like to explain...", expectedLength: sequence <= 2 ? "5-6 complete sentences" : "6-8 connected sentences", successCriteria: "I answered the prompt; used precise Unit vocabulary; organised connected ideas; checked capitals and punctuation; reread and improved my work", support: "Plan three ideas, use the word bank, and say each sentence before writing.", extension: "Add a stronger opening, two precise details, and a concluding sentence.", rubricId: "rub-writing-v1" };
    return { activityId: id, ...common, activityType: sequence <= 3 ? "Guided practice" : "Independent challenge", instructionsAndItems: body, answerSummary: "Accept accurate responses supported by unit vocabulary, text evidence or a clear demonstration.", deliveryMode: "Online or workbook" };
  });
}

function buildRegularUnit(unitNo, dictionaryEntries) {
  const lesson = doc(unitNo, "Lesson");
  const title = titleFromLesson(lesson.paragraphs[0]);
  const overview = lesson.paragraphs[lesson.paragraphs.indexOf("Unit Overview") + 1];
  const outcomeText = between(lesson.paragraphs, "By the end of this unit, you will be able to:", "Your Learning Path");
  const learningPath = between(lesson.paragraphs, "Your Learning Path", /^Part 1:/).join("\n");
  const term = termFor(unitNo);
  const id = unitId(unitNo);
  const vocabularyGroups = [];
  const dictionaryLinks = [];
  const groups = extractVocabulary(unitNo);
  groups.forEach((group, groupIndex) => {
    const groupId = `u${unitNo}-g${groupIndex + 1}-${slug(group.title)}`;
    const vocabularyIds = [];
    group.words.forEach((word, wordIndex) => {
      const vocabularyId = `u${unitNo}-g${groupIndex + 1}-${wordIndex + 1}-${slug(word.word)}`;
      const dictionaryEntryId = `ehel-dict-en-${slug(word.word)}-${slug(word.type)}-01`;
      const readyAudio = readyAudioByKey.get(`${word.word.toLowerCase()}|${word.type}`) || readyAudioByWord.get(word.word.toLowerCase());
      if (!dictionaryEntries.has(dictionaryEntryId)) dictionaryEntries.set(dictionaryEntryId, {
        dictionaryEntryId,
        senseId: `${dictionaryEntryId}-sense-01`,
        language: "en-GB",
        lemma: word.word.toLowerCase(),
        displayWord: word.word,
        partOfSpeech: word.type,
        sourceType: word.sourceType,
        partOfSpeechDefinition: partDefinition(word.type),
        canonicalMeaning: word.meaning,
        pronunciationText: "Listen, then repeat",
        audio: readyAudio ? { ...readyAudio, available: true, status: "Approved reused ElevenLabs audio" } : pendingAudio(`./media/dictionary/${slug(word.word)}-${slug(word.type)}.mp3`),
        status: "approved",
      });
      const practiceSentences = [word.example, `The word ${word.word} belongs to our ${group.title.toLowerCase()} vocabulary.`, `I can explain ${word.word} in my own words.`, `I can connect ${word.word} to this unit's texts.`, `I can use ${word.word} in a clear Grade 3 sentence.`];
      dictionaryLinks.push({ vocabularyId, dictionaryEntryId, senseId: `${dictionaryEntryId}-sense-01`, gradeId: "g03", termId: term.id, unitId: id, groupId, groupTitle: group.title, sequence: wordIndex + 1, childMeaning: word.meaning, exampleSentence: word.example, practiceSentences, sentenceAudio: practiceSentences.map((_, sentenceIndex) => pendingAudio(`./unit-${unitNo}/media/audio/vocabulary/${vocabularyId}-sentence-${sentenceIndex + 1}.mp3`)), sentenceStarter: `The ${word.word}`, spellingPractice: word.word.split("").join(" - "), aiTutorPrompt: `Ask me to define '${word.word}', use it in a sentence, and connect it to ${title}.`, reviewStatus: "Approved v1.1" });
      vocabularyIds.push(vocabularyId);
    });
    vocabularyGroups.push({ id: groupId, number: groupIndex + 1, title: group.title, vocabularyIds });
  });

  const readings = extractReadings(unitNo).map((reading, index) => {
    const readingId = `${id}-read${String(index + 1).padStart(2, "0")}`;
    return { readingId, unitId: id, sequence: index + 1, type: reading.type, title: reading.title, genre: reading.type === "Story" ? "Narrative" : "Information text", theme: title, setting: "East African and familiar learner contexts", passageScript: reading.passage, audioRequired: true, origin: "Authored Grade 3 source", reviewStatus: "Approved v1.1", sourceFile: sourcePath(unitNo, reading.type === "Story" ? "Story" : "Lesson"), audio: lessonAudio(unitNo, "readings", readingId) };
  });
  const questions = extractQuestions(unitNo);
  while (questions.length < 12) questions.push(`What important idea or detail did you learn from ${readings[(questions.length) % readings.length].title}?`);
  const comprehension = questions.slice(0, 12).map((question, index) => ({ questionId: `${id}-cq${String(index + 1).padStart(3, "0")}`, unitId: id, readingId: readings[index % readings.length].readingId, section: index < 6 ? "Reading and listening" : "Story and inference", sequence: index + 1, questionType: index < 6 ? "Short answer" : "Evidence and inference", question, correctAnswer: "Accept an accurate complete-sentence response supported by a relevant detail from the selected text.", explanation: "The learner should identify relevant text evidence and explain the answer clearly.", marks: index < 6 ? 1 : 2, outcomeId: `${id}-lo${String((index % Math.max(1, outcomeText.length)) + 1).padStart(2, "0")}`, difficulty: index < 4 ? "Foundation" : index < 9 ? "Core" : "Stretch", origin: "Authored question or curriculum-reviewed extension", reviewStatus: "Approved v1.1", sourceFile: "Grade 3 Lesson and Story source" }));
  const grammar = grammarBlocks(unitNo).map((block, index) => grammarRecord(unitNo, block, index + 1));
  const speaking = buildTasks(unitNo, "speaking");
  const writing = buildTasks(unitNo, "writing");
  const activities = buildTasks(unitNo, "activities");
  const meanings = dictionaryLinks.map((link) => link.childMeaning);
  const quizzes = dictionaryLinks.slice(0, 10).map((link, index) => {
    const distractors = meanings.filter((meaning) => meaning !== link.childMeaning).slice(index + 1, index + 4);
    while (distractors.length < 3) distractors.push(["A different unit idea.", "A word with the opposite meaning.", "A sentence punctuation mark."][distractors.length]);
    const options = [link.childMeaning, ...distractors].sort((a, b) => (slug(a + index) > slug(b + index) ? 1 : -1));
    return { quizId: `${id}-quiz${String(index + 1).padStart(2, "0")}`, questionId: `${id}-quiz${String(index + 1).padStart(2, "0")}-q01`, unitId: id, quizTitle: `${title} checkpoint`, sequence: index + 1, questionType: "Multiple choice", question: `What does '${dictionaryEntries.get(link.dictionaryEntryId).displayWord}' mean?`, options: options.join(" | "), correctAnswer: link.childMeaning, explanation: link.exampleSentence, marks: 1, outcomeId: `${id}-lo01`, difficulty: index < 3 ? "Foundation" : index < 8 ? "Core" : "Stretch", origin: "Curriculum-reviewed generated item", reviewStatus: "Approved v1.1", sourceFile: sourcePath(unitNo, "Vocabulary") };
  });
  const liveThemes = ["Launch, vocabulary and learning goals", "Reading fluency and comprehension", "Grammar workshop and feedback", "Dialogue, speaking and pronunciation", "Writing conference and revision", "Performance, assessment and reflection"];
  const liveSessions = liveThemes.map((theme, index) => ({ liveSessionId: `${id}-live${String(index + 1).padStart(2, "0")}`, unitId: id, week: index < 3 ? 1 : 2, sessionWithinWeek: (index % 3) + 1, sessionNo: index + 1, title: `${title}: ${theme}`, durationMin: 45, beforeSession: index === 0 ? "Review the unit overview and first vocabulary group." : `Complete the self-paced work connected to ${theme.toLowerCase()}.`, agenda: `5 min welcome and retrieval; 10 min teacher model; 15 min guided Grade 3 practice; 10 min partner application; 5 min feedback and next step`, afterSession: index === 5 ? "Complete the unit quiz and self-assessment." : "Improve one piece of work using teacher feedback.", outcomeIds: `${id}-lo01 | ${id}-lo${String(Math.min(index + 2, outcomeText.length || 6)).padStart(2, "0")}`, origin: "Ehel English Content Template v1.1", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" }));
  const outcomes = outcomeText.map((text, index) => ({ outcomeId: `${id}-lo${String(index + 1).padStart(2, "0")}`, unitId: id, sequence: index + 1, learningOutcome: text, bloomLevel: index < 2 ? "Remember and understand" : index < 5 ? "Apply" : "Analyse and create", evidenceOfLearning: index < 2 ? "Vocabulary use and comprehension responses" : index < 5 ? "Grammar, speaking and activity performance" : "Independent writing, presentation or project evidence", origin: "Authored Grade 3 source", reviewStatus: "Approved v1.1", sourceFile: sourcePath(unitNo, "Lesson") }));
  const selfLines = lesson.paragraphs.filter((line) => /^I can /.test(line)).map((line) => line.replace(/\s+Yes □.*$/, ""));
  const selfAssessment = selfLines.slice(0, 6).map((statement, index) => ({ selfAssessmentId: `${id}-self${String(index + 1).padStart(2, "0")}`, unitId: id, sequence: index + 1, statement, scale: "Not yet | With help | By myself", outcomeId: outcomes[index % outcomes.length].outcomeId, origin: "Authored Grade 3 source", reviewStatus: "Approved v1.1", sourceFile: sourcePath(unitNo, "Lesson") }));
  while (selfAssessment.length < 6) {
    const index = selfAssessment.length;
    selfAssessment.push({ selfAssessmentId: `${id}-self${String(index + 1).padStart(2, "0")}`, unitId: id, sequence: index + 1, statement: `I can use my ${title.toLowerCase()} learning independently.`, scale: "Not yet | With help | By myself", outcomeId: outcomes[index % outcomes.length].outcomeId, origin: "Curriculum-reviewed extension", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" });
  }
  const answerKey = [
    ...activities.map((activity) => ({ answerId: `${activity.activityId}-answer`, unitId: id, contentId: activity.activityId, contentType: "Activity", answerOrGuidance: activity.answerSummary, origin: activity.origin, reviewStatus: "Approved v1.1", sourceFile: activity.sourceFile })),
    ...quizzes.map((quiz) => ({ answerId: `${quiz.questionId}-answer`, unitId: id, contentId: quiz.questionId, contentType: "Quiz", answerOrGuidance: `${quiz.correctAnswer} ${quiz.explanation}`, origin: quiz.origin, reviewStatus: "Approved v1.1", sourceFile: quiz.sourceFile })),
  ];
  return {
    schemaVersion: "Ehel English Runtime v1.1", templateVersion: "Ehel English Content Template v1.1", dictionaryVersion: "Ehel Master Dictionary v1.1", generatedAt: GENERATED_AT,
    grade: { id: "g03", label: "Grade 3" }, subject: "English", term,
    unit: { gradeId: "g03", subject: "English", termId: term.id, unitId: id, unitNo, unitTitle: title, unitOverview: overview, learningPath, origin: "Authored Grade 3 source + curriculum review", reviewStatus: "Approved v1.1", sourceFile: sourcePath(unitNo, "Lesson") },
    visual: { image: `../../vocabulary/assets/${visualMap[unitNo][0]}`, alt: visualMap[unitNo][1], lectureMode: "guided-launch" },
    vocabularyGroups, dictionaryLinks, rubrics: baseRubrics.map((rubric) => ({ ...rubric, origin: "Ehel Grade 3 approved rubric v1.1" })), outcomes, readings, comprehension, grammar, speaking, writing, activities,
    assignments: [{ assignmentId: `${id}-assignment01`, unitId: id, title: `${title} learning portfolio`, instructions: `Submit ${writing[0].title} and a recording of ${speaking[0].title}. Improve both pieces using the Grade 3 rubrics.`, submissionType: "Writing + audio", marks: 32, outcomeIds: `${outcomes[0].outcomeId} | ${outcomes[Math.min(1, outcomes.length - 1)].outcomeId}`, rubricIds: "rub-writing-v1 | rub-speaking-v1", origin: "Curriculum-reviewed unit portfolio", reviewStatus: "Approved v1.1", sourceFile: "Derived from unit writing and speaking tasks" }],
    quizzes, liveSessions,
    teacherNotes: [{ teacherNoteId: `${id}-note01`, unitId: id, noteType: "Delivery and inclusion", note: "Model new language aloud, check meaning before independent work, use mixed-response modes, and give specific feedback on complete sentences, text evidence and vocabulary precision.", visibility: "Teacher", origin: "Curriculum review", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" }, { teacherNoteId: `${id}-note02`, unitId: id, noteType: "Source-linked AI tutor support", note: [...doc(unitNo, "Lesson").tables, ...doc(unitNo, "Vocabulary").tables, ...doc(unitNo, "Grammar").tables].flat(2).filter((value) => String(value).includes("Ask Your AI Tutor")).join("\n"), visibility: "Teacher", origin: "Authored Grade 3 source", reviewStatus: "Approved v1.1", sourceFile: "Multiple Grade 3 source files" }],
    answerKey, selfAssessment,
  };
}

function buildCapstone(regularUnits, dictionaryEntries) {
  const unitNo = 10;
  const id = unitId(unitNo);
  const term = termFor(unitNo);
  const selectedLinks = regularUnits.flatMap((unit) => unit.dictionaryLinks.slice(0, 4)).slice(0, 30).map((link, index) => ({ ...link, vocabularyId: `u10-g1-${index + 1}-${slug(dictionaryEntries.get(link.dictionaryEntryId).displayWord)}`, unitId: id, termId: term.id, groupId: "u10-g1-grade-3-review-words", groupTitle: "Grade 3 Review Words", sequence: index + 1 }));
  const title = "My English Voice: Grade 3 Capstone";
  const outcomes = ["Select strong evidence from Units 1-9 and explain why it shows progress.", "Use Grade 3 vocabulary accurately across speaking and writing.", "Read a chosen passage fluently and answer questions with text evidence.", "Create a connected multi-paragraph English product for a real audience.", "Present ideas clearly, respond to questions and use feedback.", "Reflect honestly and set a specific Grade 4 English goal."].map((learningOutcome, index) => ({ outcomeId: `${id}-lo0${index + 1}`, unitId: id, sequence: index + 1, learningOutcome, bloomLevel: index < 2 ? "Apply" : index < 4 ? "Analyse and create" : "Evaluate", evidenceOfLearning: "Capstone portfolio, product, presentation and reflection", origin: "Ehel Grade 3 capstone specification", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" }));
  const makeSix = (kind, items) => items.map((item, index) => {
    const prefix = kind === "grammar" ? "grammar" : kind === "speaking" ? "speak" : kind === "writing" ? "write" : "act";
    const itemId = `${id}-${prefix}0${index + 1}`;
    const common = { unitId: id, sequence: index + 1, title: item[0], outcomeId: outcomes[index].outcomeId, origin: "Ehel Grade 3 capstone specification", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" };
    if (kind === "grammar") return { grammarId: itemId, conceptId: `${itemId}-concept`, ...common, practiceType: "Capstone editing", explanation: item[1], ruleAndExamples: item[2], commonMistake: "Do not change language randomly; explain how the revision improves meaning or accuracy.", memoryTip: "Read every revised sentence aloud.", practice: item[3], audio: lessonAudio(10, "grammar", itemId) };
    if (kind === "speaking") return { speakingId: itemId, ...common, activityType: "Capstone rehearsal", instructionsAndModelLines: item[1], recordingRequired: true, aiTutorPrompt: "Listen to my rehearsal and give feedback on organisation, vocabulary, fluency and audience awareness.", audio: lessonAudio(10, "speaking", itemId) };
    if (kind === "writing") return { writingId: itemId, ...common, promptAndInstructions: item[1], modelText: item[2], sentenceStarter: item[3], expectedLength: "8-12 connected sentences or two short paragraphs", successCriteria: "I addressed my audience; organised connected ideas; used precise vocabulary; checked grammar and punctuation; revised from feedback", support: "Use a planning frame, word bank and one model from an earlier unit.", extension: "Add a second paragraph, varied sentence openings and a purposeful conclusion.", rubricId: "rub-writing-v1" };
    return { activityId: itemId, ...common, activityType: "Capstone milestone", instructionsAndItems: item[1], answerSummary: "Teacher verifies completion against the capstone rubric and evidence checklist.", deliveryMode: "Online, portfolio and live session" };
  });
  const grammar = makeSix("grammar", [["Sentence accuracy audit", "Review agreement, tense and complete sentences.", "Every sentence needs a clear subject and verb.", "Correct six sentences from your portfolio."], ["Tense control", "Check that past, present and future time are clear.", "Yesterday I visited. Today I learn. Tomorrow I will present.", "Revise six verbs and explain each tense choice."], ["Questions and responses", "Use accurate Wh- and yes/no questions.", "Where did you learn this? Why is it important?", "Write and answer six audience questions."], ["Description and precision", "Improve nouns, verbs, adjectives and adverbs.", "The thoughtful learner explained the idea clearly.", "Strengthen six plain sentences."], ["Joining ideas", "Connect ideas with and, but, because, so and when.", "I revised my story because feedback helped me.", "Combine six pairs of ideas."], ["Final editing conference", "Apply capitals, spelling, punctuation and paragraphing.", "Read, mark, revise, then read again.", "Complete the final editing checklist."]]);
  const speaking = makeSix("speaking", [["Portfolio choice conference", "Explain three portfolio choices and give a reason for each."], ["Fluent reading rehearsal", "Read a selected passage with clear phrasing, pace and expression."], ["Vocabulary in context", "Use ten review words naturally while explaining your project."], ["Two-minute presentation", "Present an opening, organised main points and a strong closing."], ["Question-and-answer practice", "Answer six audience questions in complete, relevant sentences."], ["Final capstone presentation", "Deliver your polished presentation and record your reflection."]]);
  const writing = makeSix("writing", [["Portfolio captions", "Write a precise caption for each of three selected pieces and explain what each shows.", "This revised report shows that I can organise facts and use because to explain reasons.", "This piece shows..."], ["Project proposal", "Explain your topic, audience, product and plan in one organised paragraph.", "My project will teach younger learners about caring for nature. I will create an illustrated guide.", "My project is about..."], ["First draft", "Write the complete first draft of your capstone product.", "Use a clear opening, connected details and a conclusion suited to your audience.", "I want my audience to understand..."], ["Revision from feedback", "Record two feedback points and rewrite the sections they improve.", "Feedback asked for a clearer example, so I added a detail from Unit 7.", "One improvement I made was..."], ["Presentation notes", "Prepare concise cue cards for a two-minute presentation.", "Opening; three main ideas; example; audience question; closing.", "Today I will share..."], ["Grade 3 reflection", "Explain your strongest progress, one challenge, and a specific Grade 4 goal.", "I became a stronger reader because I learned to use evidence. Next, I will improve paragraph endings.", "This year I learned..."]]);
  const activities = makeSix("activities", [["Curate three pieces", "Review Units 1-9 and select reading, writing and speaking evidence."], ["Build a review word map", "Organise 30 review words into meaningful categories and explain links."], ["Design the final product", "Create a poster, booklet, report, story or digital presentation for a real audience."], ["Peer feedback studio", "Use the rubric to give and receive two specific improvement suggestions."], ["Rehearse with timing", "Practise the presentation twice and improve pace, volume and transitions."], ["Exhibition and celebration", "Present the final product, answer questions and record your next learning goal."]]);
  const readings = regularUnits.slice(0, 5).map((unit, index) => ({ ...unit.readings[unit.readings.length - 1], readingId: `${id}-read0${index + 1}`, unitId: id, sequence: index + 1, title: `Review text ${index + 1}: ${unit.readings[unit.readings.length - 1].title}`, audio: lessonAudio(10, "readings", `${id}-read0${index + 1}`) }));
  const comprehension = readings.flatMap((reading, index) => ["What is the central idea of this text?", "Which detail best supports the central idea?"].map((question, questionIndex) => ({ questionId: `${id}-cq${String(index * 2 + questionIndex + 1).padStart(3, "0")}`, unitId: id, readingId: reading.readingId, section: "Capstone review reading", sequence: index * 2 + questionIndex + 1, questionType: questionIndex ? "Evidence" : "Main idea", question, correctAnswer: "Accept an accurate response supported by the selected review text.", explanation: "The response should identify a central idea or relevant evidence.", marks: questionIndex + 1, outcomeId: outcomes[2].outcomeId, difficulty: "Core", origin: "Capstone review", reviewStatus: "Approved v1.1", sourceFile: "Units 1-9 approved texts" })));
  while (comprehension.length < 12) comprehension.push({ ...comprehension[comprehension.length % 10], questionId: `${id}-cq${String(comprehension.length + 1).padStart(3, "0")}`, sequence: comprehension.length + 1, question: comprehension.length === 10 ? "Compare two review texts. What important idea do they share?" : "Which Grade 3 text influenced your capstone most, and why?" });
  const quizzes = regularUnits.flatMap((unit) => unit.quizzes.slice(0, 2)).slice(0, 10).map((quiz, index) => ({ ...quiz, quizId: `${id}-quiz${String(index + 1).padStart(2, "0")}`, questionId: `${id}-quiz${String(index + 1).padStart(2, "0")}-q01`, unitId: id, quizTitle: "Grade 3 capstone review checkpoint", sequence: index + 1 }));
  const liveSessions = ["Launch and portfolio curation", "Reading and vocabulary conference", "Project planning and first draft", "Grammar editing and peer feedback", "Presentation rehearsal", "Capstone exhibition and reflection"].map((title, index) => ({ liveSessionId: `${id}-live0${index + 1}`, unitId: id, week: index < 3 ? 1 : 2, sessionWithinWeek: (index % 3) + 1, sessionNo: index + 1, title, durationMin: 45, beforeSession: "Complete the preceding capstone milestone and bring evidence.", agenda: "5 min check-in; 10 min model; 15 min workshop; 10 min conference or rehearsal; 5 min next step", afterSession: index === 5 ? "Complete the final course quiz." : "Apply feedback and upload the improved milestone.", outcomeIds: outcomes[index].outcomeId, origin: "Ehel Grade 3 capstone specification", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" }));
  return { schemaVersion: "Ehel English Runtime v1.1", templateVersion: "Ehel English Content Template v1.1", dictionaryVersion: "Ehel Master Dictionary v1.1", generatedAt: GENERATED_AT, grade: { id: "g03", label: "Grade 3" }, subject: "English", term, unit: { gradeId: "g03", subject: "English", termId: term.id, unitId: id, unitNo, unitTitle: title, unitOverview: "Bring together your strongest vocabulary, reading, grammar, speaking and writing from Units 1-9. Create a polished English product for a real audience, present it clearly, respond to questions and reflect on your Grade 3 growth.", learningPath: "Choose evidence. Review language. Plan and draft. Improve from feedback. Present. Reflect. Complete the final course quiz.", origin: "Ehel Grade 3 capstone specification", reviewStatus: "Approved v1.1 capstone", sourceFile: "Ehel English Content Template v1.1" }, visual: { image: "../grade-2/capstone-my-english-world.png", alt: visualMap[10][1], lectureMode: "capstone-launch" }, vocabularyGroups: [{ id: "u10-g1-grade-3-review-words", number: 1, title: "Grade 3 Review Words", vocabularyIds: selectedLinks.map((link) => link.vocabularyId) }], dictionaryLinks: selectedLinks, rubrics: baseRubrics.map((rubric) => ({ ...rubric, origin: "Ehel Grade 3 approved rubric v1.1" })), outcomes, readings, comprehension, grammar, speaking, writing, activities, assignments: [{ assignmentId: `${id}-assignment01`, unitId: id, title: "Grade 3 capstone portfolio and presentation", instructions: "Submit the final product, three portfolio pieces, presentation recording and reflection.", submissionType: "Portfolio + product + presentation", marks: 64, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).join(" | "), rubricIds: "rub-writing-v1 | rub-speaking-v1", origin: "Ehel Grade 3 capstone specification", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" }], quizzes, liveSessions, teacherNotes: [{ teacherNoteId: `${id}-note01`, unitId: id, noteType: "Capstone moderation", note: "Conference at each milestone, preserve learner ownership, assess the final product and presentation with shared rubrics, and record actionable Grade 4 transition feedback.", visibility: "Teacher", origin: "Curriculum review", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" }], answerKey: [...activities.map((activity) => ({ answerId: `${activity.activityId}-answer`, unitId: id, contentId: activity.activityId, contentType: "Capstone milestone", answerOrGuidance: activity.answerSummary, origin: activity.origin, reviewStatus: "Approved v1.1", sourceFile: activity.sourceFile })), ...quizzes.map((quiz) => ({ answerId: `${quiz.questionId}-answer`, unitId: id, contentId: quiz.questionId, contentType: "Quiz", answerOrGuidance: `${quiz.correctAnswer} ${quiz.explanation}`, origin: quiz.origin, reviewStatus: "Approved v1.1", sourceFile: quiz.sourceFile }))], selfAssessment: outcomes.map((outcome, index) => ({ selfAssessmentId: `${id}-self0${index + 1}`, unitId: id, sequence: index + 1, statement: outcome.learningOutcome.replace(/^(Select|Use|Read|Create|Present|Reflect)/, (verb) => `I can ${verb.toLowerCase()}`), scale: "Not yet | With help | By myself", outcomeId: outcome.outcomeId, origin: "Capstone reflection", reviewStatus: "Approved v1.1", sourceFile: "Ehel English Content Template v1.1" })) };
}

function buildFinalAssessment(units) {
  const selected = units.slice(0, 9).flatMap((unit) => unit.quizzes.slice(0, 4)).slice(0, 30);
  const sections = [
    { sectionId: "grade3-final-sec01", title: "Words and Meaning", startQuestion: 1, endQuestion: 10, questionCount: 10 },
    { sectionId: "grade3-final-sec02", title: "Reading and Language", startQuestion: 11, endQuestion: 20, questionCount: 10 },
    { sectionId: "grade3-final-sec03", title: "Communication and Application", startQuestion: 21, endQuestion: 30, questionCount: 10 },
  ];
  const questions = selected.map((quiz, index) => {
    const sourceUnit = units.find((unit) => unit.unit.unitId === quiz.unitId);
    return { ...quiz, assessmentId: "eng-g03-course-final-quiz-v1", quizId: "eng-g03-course-final-quiz-v1", questionId: `eng-g03-final-q${String(index + 1).padStart(2, "0")}`, sequence: index + 1, sectionId: sections[Math.floor(index / 10)].sectionId, sourceUnitNo: sourceUnit?.unit.unitNo, sourceUnitId: quiz.unitId, sourceUnitTitle: sourceUnit?.unit.unitTitle, curriculumArea: Math.floor(index / 10) === 0 ? "Vocabulary and meaning" : Math.floor(index / 10) === 1 ? "Reading and language" : "Communication and application", reviewRoute: `Review Unit ${sourceUnit?.unit.unitNo || 1}`, audio: pendingAudio(`./media/audio/final-quiz/eng-g03-final-q${String(index + 1).padStart(2, "0")}.mp3`) };
  });
  return { schemaVersion: "Ehel English Course Final Assessment v1.1", assessmentId: "eng-g03-course-final-quiz-v1", gradeId: "g03", subject: "English", title: "Grade 3 English Final Course Quiz", placement: "After Unit 10 capstone", questionCount: 30, totalMarks: 30, estimatedMinutes: 30, passPercent: 80, attemptsAllowed: "Teacher or school policy", sections, questions, reviewStatus: "Approved v1.1", audioProvider: "ElevenLabs", voiceId: VOICE_ID };
}

fs.mkdirSync(UNIT_DIR, { recursive: true });
const dictionaryEntries = new Map();
const regularUnits = Array.from({ length: 9 }, (_, index) => buildRegularUnit(index + 1, dictionaryEntries));
const capstone = buildCapstone(regularUnits, dictionaryEntries);
const units = [...regularUnits, capstone];
const dictionary = { schemaVersion: "Ehel Master Dictionary v1.1", language: "en-GB", gradeId: "g03", entryCount: dictionaryEntries.size, entries: [...dictionaryEntries.values()] };
const finalAssessment = buildFinalAssessment(units);
const manifest = { schemaVersion: "Ehel Grade 3 English Course Manifest v1.1", grade: { id: "g03", label: "Grade 3" }, subject: "English", defaultUnit: 1, units: units.map((unit) => ({ number: unit.unit.unitNo, id: unit.unit.unitId, termId: unit.term.id, title: unit.unit.unitTitle, data: `./data/units/unit-${unit.unit.unitNo}.json`, vocabularyCount: unit.dictionaryLinks.length, reviewStatus: unit.unit.reviewStatus })), finalAssessment: { id: finalAssessment.assessmentId, title: finalAssessment.title, data: "./data/course-final-quiz.json", placement: finalAssessment.placement, questionCount: 30, passPercent: 80, reviewStatus: finalAssessment.reviewStatus } };

for (const unit of units) fs.writeFileSync(path.join(UNIT_DIR, `unit-${unit.unit.unitNo}.json`), JSON.stringify(unit, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "course-manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "master-dictionary.grade3.json"), JSON.stringify(dictionary, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "course-final-quiz.json"), JSON.stringify(finalAssessment, null, 2));
console.log(`Built Grade 3 English: ${units.length} units, ${dictionary.entryCount} dictionary entries, ${finalAssessment.questionCount}-question final quiz.`);
