const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GRADE_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-6");
const DATA_DIR = path.join(GRADE_DIR, "data");
const UNIT_DIR = path.join(DATA_DIR, "units");
const SOURCE_FILE = path.join(ROOT, "inputs", "ehel-grade6-source", "grade6-source-extracted.json");
const TEMPLATE_CONFIG_FILE = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "template-v1.2", "neutral-template-config.json");
const GRADE2_DICTIONARY_FILE = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2", "data", "master-dictionary.grade2.json");
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const GENERATED_AT = "2026-07-14T00:00:00.000Z";

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));
const templateConfig = JSON.parse(fs.readFileSync(TEMPLATE_CONFIG_FILE, "utf8"));
const gradeProfile = templateConfig.gradeProfiles.g06;
if (!gradeProfile || gradeProfile.writingExpectation !== "3-5 paragraphs with clear structure") throw new Error("Grade 6 neutral profile is missing or invalid.");
const grade2Dictionary = JSON.parse(fs.readFileSync(GRADE2_DICTIONARY_FILE, "utf8"));
const sourceByPath = new Map(source.documents.map((document) => [document.path, document]));
const readyAudioByKey = new Map(grade2Dictionary.entries.map((entry) => [`${entry.lemma.toLowerCase()}|${entry.partOfSpeech}`, entry.audio]));
const readyAudioByWord = new Map(grade2Dictionary.entries.map((entry) => [entry.lemma.toLowerCase(), entry.audio]));
const baseRubrics = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2", "data", "units", "unit-1.json"), "utf8")).rubrics;

const visualMap = {
  1: ["unit-8-home.png", "A Grade 6 learner analysing a fable and its moral viewpoint"],
  2: ["unit-3-ready-steady-go.png", "Learners connecting sports, fitness and healthy choices"],
  3: ["unit-4-big-sky.png", "Learners investigating ecosystems and evidence from the natural world"],
  4: ["unit-5-measure.png", "Learners designing, evaluating and explaining an invention"],
  5: ["unit-9-city.png", "Learners discussing budgets, saving and responsible financial choices"],
  6: ["unit-2-neighbours-jobs.png", "Learners exploring careers, justice and community responsibility"],
  7: ["unit-4-big-sky.png", "Learners analysing natural hazards and community responses"],
  8: ["unit-9-city.png", "Learners evaluating media messages and audience effects"],
  9: ["unit-8-home.png", "Learners creating and presenting art that supports community change"],
  10: ["capstone-my-english-world.png", "A Grade 6 learner defending a researched English capstone"],
};

function slug(value) {
  return String(value).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function termFor(unitNo) {
  return unitNo <= 3 ? { id: "t01", label: "Term 1" } : unitNo <= 6 ? { id: "t02", label: "Term 2" } : { id: "t03", label: "Term 3" };
}

function unitId(unitNo) {
  return `eng-g06-${termFor(unitNo).id}-u${String(unitNo).padStart(2, "0")}`;
}

function doc(unitNo, type) {
  const record = source.documents.find((item) => item.path.startsWith(`Unit ${unitNo}/`) && item.path.endsWith(`Unit ${unitNo} ${type}.docx`));
  if (!record) throw new Error(`Missing Grade 6 source: Unit ${unitNo} ${type}`);
  return record;
}

function between(paragraphs, startLabel, endLabel) {
  const normalizeLabel = (value) => String(value).toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
  const start = paragraphs.findIndex((line) => typeof startLabel === "string" ? normalizeLabel(line) === normalizeLabel(startLabel) : startLabel.test(line));
  const end = paragraphs.findIndex((line, index) => index > start && (typeof endLabel === "string" ? line === endLabel : endLabel.test(line)));
  return start < 0 ? [] : paragraphs.slice(start + 1, end < 0 ? paragraphs.length : end);
}

function titleFromLesson(paragraph) {
  return paragraph.replace(/^Unit \d+:\s*/, "").trim();
}

function sourcePath(unitNo, type) {
  return `inputs/ehel-grade6-source/Year 6/${doc(unitNo, type).path}`;
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
  const tables = vocabularyDoc.tables.filter((table) => table[0]?.[0] === "Word" && table[0]?.[1] === "Type" && table[0]?.[2] === "What it means");
  const seen = new Set();
  let total = 0;
  return tables.map((table, groupIndex) => ({
    title: groupNames[groupIndex] || `Vocabulary Group ${groupIndex + 1}`,
    words: table.slice(1).filter((row) => {
      const key = String(row[0] || "").trim().toLowerCase();
      if (!key || seen.has(key) || total >= 45) return false;
      seen.add(key);
      total += 1;
      return true;
    }).map((row) => ({ word: row[0].trim(), sourceType: row[1].trim(), type: normalizeType(row[1]), meaning: row[2].trim(), example: row[3].trim() })),
  })).filter((group) => group.words.length);
}

function extractReadings(unitNo) {
  const lesson = doc(unitNo, "Lesson");
  const story = doc(unitNo, "Story");
  const cleanLines = (paragraphs) => paragraphs.filter((line) => !/^(Year 6 English|After Reading|Understanding the Story|Comprehension|Reflection Questions|Activity \d+|Answer Key|Ask Your AI Tutor|Self-)/i.test(line) && !line.endsWith("?") && line.split(/\s+/).length > 5);
  const chunk = (paragraphs, target = 380) => {
    const chunks = [];
    let current = [];
    let words = 0;
    for (const paragraph of paragraphs) {
      const count = paragraph.split(/\s+/).length;
      if (words >= target && current.length) {
        chunks.push(current.join("\n"));
        current = [];
        words = 0;
      }
      current.push(paragraph);
      words += count;
    }
    if (current.length) chunks.push(current.join("\n"));
    return chunks.filter((text) => text.split(/\s+/).length >= 80);
  };
  const lessonChunks = chunk(cleanLines(lesson.paragraphs.slice(2)), 430).slice(0, 2);
  const storyTitle = /^Story\s*[—-]/.test(story.paragraphs[0]) && story.paragraphs[2]?.split(/\s+/).length <= 12
    ? story.paragraphs[2]
    : story.paragraphs[0].replace(/^Story\s*[—-]\s*/, "");
  const storyStart = Math.max(2, story.paragraphs.indexOf(storyTitle) + 1);
  const storyEnd = story.paragraphs.findIndex((line, index) => index > storyStart && /^(After Reading|Understanding the Story|Reflection Questions|Comprehension)/i.test(line));
  const storyChunks = chunk(cleanLines(story.paragraphs.slice(storyStart, storyEnd < 0 ? story.paragraphs.length : storyEnd)), 430).slice(0, 3);
  const readings = [
    ...lessonChunks.map((passage, index) => ({ type: index ? "Close reading" : "Unit reading", title: `${titleFromLesson(lesson.paragraphs[0])}: source text ${index + 1}`, passage })),
    ...storyChunks.map((passage, index) => ({ type: "Story", title: storyChunks.length > 1 ? `${storyTitle}, part ${index + 1}` : storyTitle, passage })),
  ];
  return readings.slice(0, 5);
}

function extractQuestions(unitNo) {
  const lesson = doc(unitNo, "Lesson").paragraphs;
  const story = doc(unitNo, "Story").paragraphs;
  const questions = [
    ...lesson.filter((line) => line.endsWith("?") && !/^Can you|^Would you like|^What You Will/i.test(line)),
    ...story.filter((line) => line.endsWith("?") && !/^Can you|^Would you like/i.test(line)),
  ];
  return [...new Set(questions)].slice(0, 12);
}

function grammarBlocks(unitNo) {
  const paragraphs = doc(unitNo, "Grammar").paragraphs;
  let starts = paragraphs.map((line, index) => /^(Lesson|Section) \d+:/.test(line) ? index : -1).filter((index) => index >= 0);
  if (starts.length < 2) starts = paragraphs.map((line, index) => /^(What (Are|Is)|How to|Using |Adjectives with|Adjectives That|Defining relative clauses|Common Mistakes|Practice Exercises|Practice:)/i.test(line) && line.split(/\s+/).length <= 12 ? index : -1).filter((index) => index >= 0);
  const sourceBlocks = starts.map((start, index) => ({ title: paragraphs[start].replace(/^(Lesson|Section) \d+:\s*/, ""), content: paragraphs.slice(start + 1, starts[index + 1] ?? paragraphs.findIndex((line, i) => i > start && line === "Answer Key")).filter(Boolean) }));
  const blocks = sourceBlocks.slice(0, 6).map((block, index) => [`Lesson ${index + 1}: ${block.title}`, "What it means and why it matters", block.content.slice(0, 2).join("\n") || `This Grade 6 language focus strengthens accurate communication.`, "How to use it", block.content.join("\n") || "Study the pattern, explain it, and apply it in connected sentences.", "A common mistake", "Check meaning, sentence structure and punctuation before accepting an answer.", "Memory tip", "Notice the pattern, say it aloud, apply it, then reread.", `Practice ${index + 1}`, `Apply ${block.title.toLowerCase()} in six connected sentences, then revise two choices for clarity.`]);
  while (blocks.length < 6) {
    const sequence = blocks.length + 1;
    blocks.push([
      `Lesson ${sequence}: Grade 6 Editing and Application`,
      "What it means and why it matters",
      "Strong writers apply unit grammar while revising complete paragraphs for meaning, accuracy and flow.",
      "How to use it",
      "Read a paragraph aloud. Check sentence completeness, agreement, tense, joining words and punctuation. Revise one feature at a time.",
      "A common mistake",
      "Mistake: changing words without checking whether the paragraph still means the same thing. Fix: explain the purpose of every revision.",
      "Memory tip",
      "Read, notice, revise, reread.",
      `Practice ${sequence}`,
      "Edit a three-paragraph response using the unit language focus. Mark six changes and explain how three changes improve clarity and cohesion.",
    ]);
  }
  return blocks.slice(0, 6);
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
    origin: "Authored Grade 6 source",
    reviewStatus: "Approved v1.2",
    sourceFile: sourcePath(unitNo, "Grammar"),
    audio: lessonAudio(unitNo, "grammar", id),
  };
}

function taskBlocks(unitNo, sectionStart, sectionEnd, headingPattern) {
  const paragraphs = doc(unitNo, "Lesson").paragraphs;
  const starts = paragraphs.map((line, index) => headingPattern.test(line) ? index : -1).filter((index) => index >= 0);
  return starts.map((start, index) => ({ title: paragraphs[start], body: paragraphs.slice(start + 1, starts[index + 1] ?? paragraphs.length).filter((line) => !/^Answer Key|^Self-Study|^Self-Assessment/i.test(line)).slice(0, 12).join("\n") }));
}

const extensionTasks = {
  speaking: [
    ["Vocabulary Expert Interview", "Choose six unit words. Ask and answer a clear question about each word using complete sentences."],
    ["Explain and Respond", "Explain one important unit idea, give a reason with because, and respond to two follow-up questions."],
    ["Four-Minute Unit Talk", "Plan and record a four-minute talk using an opening, three connected ideas with evidence or examples, a considered viewpoint, and a purposeful closing."],
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
    ? [null, null, /^(Speaking (Activity|Task)|Activity \d+.*(Discussion|Role|Retell|Interview|Presentation|Talk|Debate|Reading|Game|Director|Perform))/i, "instructionsAndModelLines"]
    : kind === "writing"
      ? [null, null, /^(Section \d+: Writing Workshop|Writing (Workshop|Task|Model|Checklist))/i, "promptAndInstructions"]
      : [null, null, /^Activity \d+/i, "instructionsAndItems"];
  const sourceTasks = taskBlocks(unitNo, config[0], config[1], config[2]);
  const tasks = sourceTasks.map((task) => [task.title.replace(/^(Speaking\s+(Activity|Task)|Writing\s+(Workshop|Task|Model|Checklist)|Section \d+: Writing Workshop|Activity)( Game)?\s*\d*\s*[:\-\u2013\u2014]?\s*/i, ""), task.body]);
  let extensionIndex = 0;
  while (tasks.length < 6) tasks.push(extensionTasks[kind][extensionIndex++ % extensionTasks[kind].length]);
  return tasks.slice(0, 6).map(([title, body], index) => {
    const sequence = index + 1;
    const prefix = kind === "speaking" ? "speak" : kind === "writing" ? "write" : "act";
    const id = `${unitId(unitNo)}-${prefix}${String(sequence).padStart(2, "0")}`;
    const common = { unitId: unitId(unitNo), sequence, title: `${kind[0].toUpperCase() + kind.slice(1)} ${sequence}: ${title}`, outcomeId: `${unitId(unitNo)}-lo${String(Math.min(sequence, 6)).padStart(2, "0")}`, origin: index < sourceTasks.length ? "Authored Grade 6 source" : "Ehel English Content Template v1.2 curriculum expansion", reviewStatus: "Approved v1.2", sourceFile: index < sourceTasks.length ? sourcePath(unitNo, "Lesson") : "Ehel English Content Template v1.2" };
    if (kind === "speaking") return { speakingId: id, ...common, activityType: sequence <= 2 ? "Guided speaking" : "Speaking practice", instructionsAndModelLines: body, recordingRequired: true, aiTutorPrompt: `Help me practise ${title.toLowerCase()} and give feedback on clarity, vocabulary and complete sentences.`, audio: lessonAudio(unitNo, "speaking", id) };
    if (kind === "writing") return { writingId: id, ...common, promptAndInstructions: body, modelText: `A strong Grade 6 response uses organised paragraphs, precise unit words, relevant evidence or examples, and a purposeful conclusion about ${title.toLowerCase()}.`, sentenceStarter: "I would like to explain...", expectedLength: sequence <= 2 ? "Three organised paragraphs" : gradeProfile.writingExpectation, successCriteria: "I answered the prompt; organised ideas into paragraphs; used precise Unit vocabulary; supported ideas with evidence; considered viewpoint where relevant; checked cohesion and punctuation; revised my work", support: "Plan a clear structure, topic sentences and supporting evidence, then use the word bank and source models.", extension: "Synthesize details from more than one text, vary sentence structures, improve transitions and strengthen the conclusion.", rubricId: "rub-writing-v1" };
    return { activityId: id, ...common, activityType: sequence <= 3 ? "Guided practice" : "Independent challenge", instructionsAndItems: body, answerSummary: "Accept accurate responses supported by unit vocabulary, text evidence or a clear demonstration.", deliveryMode: "Online or workbook" };
  });
}

function extractUnitOverview(lesson) {
  const overviewIndex = lesson.paragraphs.findIndex((line) => line === "Unit Overview");
  if (overviewIndex >= 0 && lesson.paragraphs[overviewIndex + 1]) return lesson.paragraphs[overviewIndex + 1];
  return lesson.paragraphs.find((line, index) => index >= 2 && /^(Welcome to Unit|In this unit|Unit \d+ is called)/i.test(line)) || lesson.paragraphs[2];
}

function extractOutcomeText(lesson, title) {
  const start = lesson.paragraphs.findIndex((line) => /By the end of this unit, you will be able to:/i.test(line));
  const stopPattern = /^(Your Learning Path|Section \d+:|Writing Workshop|Activity \d+:|Key Vocabulary|Unit Overview|Reading |Grammar )/i;
  const authored = start >= 0 ? lesson.paragraphs.slice(start + 1).filter((line, index, rows) => index < (rows.findIndex((candidate) => stopPattern.test(candidate)) < 0 ? rows.length : rows.findIndex((candidate) => stopPattern.test(candidate)))).filter((line) => line.split(/\s+/).length >= 4) : [];
  const extensions = [
    `Summarise the central ideas and important details in ${title} texts.`,
    `Support inferences and comparisons with relevant text evidence.`,
    `Use Grade 6 vocabulary accurately in discussion and writing.`,
    `Apply the unit language focus in connected sentences and paragraphs.`,
    `Create two to three organised paragraphs for a defined purpose and audience.`,
    `Present a clear three- to four-minute response and answer follow-up questions.`,
  ];
  const outcomes = [...authored];
  for (const outcome of extensions) if (outcomes.length < 6 && !outcomes.includes(outcome)) outcomes.push(outcome);
  return outcomes.slice(0, 8);
}

function extractLearningPath(lesson) {
  const start = lesson.paragraphs.findIndex((line) => line === "Your Learning Path");
  if (start >= 0) {
    const rows = lesson.paragraphs.slice(start + 1);
    const end = rows.findIndex((line) => /^(Section \d+:|Part \d+:|Writing Workshop|Activity \d+:)/i.test(line));
    const selected = rows.slice(0, end < 0 ? Math.min(rows.length, 8) : end);
    if (selected.length) return selected.join("\n");
  }
  return "Preview the goals and vocabulary. Read and annotate the source texts. Discuss evidence and language choices. Apply the grammar focus. Draft and revise two to three paragraphs. Present, reflect and complete the quiz.";
}

function buildRegularUnit(unitNo, dictionaryEntries) {
  const lesson = doc(unitNo, "Lesson");
  const title = titleFromLesson(lesson.paragraphs[0]);
  const overview = extractUnitOverview(lesson);
  const outcomeText = extractOutcomeText(lesson, title);
  const learningPath = extractLearningPath(lesson);
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
      const practiceSentences = [word.example, `The word ${word.word} belongs to our ${group.title.toLowerCase()} vocabulary.`, `I can explain ${word.word} in my own words.`, `I can connect ${word.word} to this unit's texts.`, `I can use ${word.word} in a clear Grade 6 sentence.`];
      dictionaryLinks.push({ vocabularyId, dictionaryEntryId, senseId: `${dictionaryEntryId}-sense-01`, gradeId: "g06", termId: term.id, unitId: id, groupId, groupTitle: group.title, sequence: wordIndex + 1, childMeaning: word.meaning, exampleSentence: word.example, practiceSentences, sentenceAudio: practiceSentences.map((_, sentenceIndex) => pendingAudio(`./unit-${unitNo}/media/audio/vocabulary/${vocabularyId}-sentence-${sentenceIndex + 1}.mp3`)), sentenceStarter: `The ${word.word}`, spellingPractice: word.word.split("").join(" - "), aiTutorPrompt: `Ask me to define '${word.word}', use it in a sentence, and connect it to ${title}.`, reviewStatus: "Approved v1.2" });
      vocabularyIds.push(vocabularyId);
    });
    vocabularyGroups.push({ id: groupId, number: groupIndex + 1, title: group.title, vocabularyIds });
  });

  const readings = extractReadings(unitNo).map((reading, index) => {
    const readingId = `${id}-read${String(index + 1).padStart(2, "0")}`;
    return { readingId, unitId: id, sequence: index + 1, type: reading.type, title: reading.title, genre: reading.type === "Story" ? "Narrative" : "Information text", theme: title, setting: "East African and familiar learner contexts", passageScript: reading.passage, audioRequired: true, origin: "Authored Grade 6 source", reviewStatus: "Approved v1.2", sourceFile: sourcePath(unitNo, reading.type === "Story" ? "Story" : "Lesson"), audio: lessonAudio(unitNo, "readings", readingId) };
  });
  const questions = extractQuestions(unitNo);
  const extensionQuestions = [
    `What central idea connects two texts in ${title}?`,
    "Which evidence is strongest, and why is it more convincing than another detail?",
    "What viewpoint does the writer or narrator communicate? Support your answer.",
    "How would the meaning change if the text were told from another perspective?",
    "Synthesize two details to explain a wider lesson or conclusion.",
    "Evaluate one choice made by a character, writer or speaker using evidence.",
  ];
  while (questions.length < 12) questions.push(extensionQuestions[(questions.length - 6 + extensionQuestions.length) % extensionQuestions.length]);
  const comprehension = questions.slice(0, 12).map((question, index) => ({ questionId: `${id}-cq${String(index + 1).padStart(3, "0")}`, unitId: id, readingId: readings[index % readings.length].readingId, section: index < 4 ? "Reading understanding" : index < 8 ? "Evidence and inference" : "Synthesis, viewpoint and evaluation", sequence: index + 1, questionType: index < 4 ? "Retrieval and main idea" : index < 8 ? "Evidence and inference" : "Synthesis and evaluation", question, correctAnswer: "Accept an accurate, well-explained response supported by relevant evidence from the selected text or texts.", explanation: "The learner should select evidence, connect ideas and justify the response clearly.", marks: index < 4 ? 1 : index < 8 ? 2 : 3, outcomeId: `${id}-lo${String((index % Math.max(1, outcomeText.length)) + 1).padStart(2, "0")}`, difficulty: index < 4 ? "Foundation" : index < 8 ? "Core" : "Stretch", origin: "Authored question or curriculum-reviewed extension", reviewStatus: "Approved v1.2", sourceFile: "Grade 6 Lesson and Story source" }));
  const grammar = grammarBlocks(unitNo).map((block, index) => grammarRecord(unitNo, block, index + 1));
  const speaking = buildTasks(unitNo, "speaking");
  const writing = buildTasks(unitNo, "writing");
  const activities = buildTasks(unitNo, "activities");
  const meanings = dictionaryLinks.map((link) => link.childMeaning);
  const quizzes = dictionaryLinks.slice(0, 10).map((link, index) => {
    const distractors = meanings.filter((meaning) => meaning !== link.childMeaning).slice(index + 1, index + 4);
    while (distractors.length < 3) distractors.push(["A different unit idea.", "A word with the opposite meaning.", "A sentence punctuation mark."][distractors.length]);
    const options = [link.childMeaning, ...distractors].sort((a, b) => (slug(a + index) > slug(b + index) ? 1 : -1));
    return { quizId: `${id}-quiz${String(index + 1).padStart(2, "0")}`, questionId: `${id}-quiz${String(index + 1).padStart(2, "0")}-q01`, unitId: id, quizTitle: `${title} checkpoint`, sequence: index + 1, questionType: "Multiple choice", question: `What does '${dictionaryEntries.get(link.dictionaryEntryId).displayWord}' mean?`, options: options.join(" | "), correctAnswer: link.childMeaning, explanation: link.exampleSentence, marks: 1, outcomeId: `${id}-lo01`, difficulty: index < 3 ? "Foundation" : index < 8 ? "Core" : "Stretch", origin: "Curriculum-reviewed generated item", reviewStatus: "Approved v1.2", sourceFile: sourcePath(unitNo, "Vocabulary") };
  });
  const liveThemes = ["Launch, vocabulary and learning goals", "Reading fluency and comprehension", "Grammar workshop and feedback", "Dialogue, speaking and pronunciation", "Writing conference and revision", "Performance, assessment and reflection"];
  const liveSessions = liveThemes.map((theme, index) => ({ liveSessionId: `${id}-live${String(index + 1).padStart(2, "0")}`, unitId: id, week: index < 3 ? 1 : 2, sessionWithinWeek: (index % 3) + 1, sessionNo: index + 1, title: `${title}: ${theme}`, durationMin: 45, beforeSession: index === 0 ? "Review the unit overview and first vocabulary group." : `Complete the self-paced work connected to ${theme.toLowerCase()}.`, agenda: `5 min welcome and retrieval; 10 min teacher model; 15 min guided Grade 6 practice; 10 min partner application; 5 min feedback and next step`, afterSession: index === 5 ? "Complete the unit quiz and self-assessment." : "Improve one piece of work using teacher feedback.", outcomeIds: `${id}-lo01 | ${id}-lo${String(Math.min(index + 2, outcomeText.length || 6)).padStart(2, "0")}`, origin: "Ehel English Content Template v1.2", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" }));
  const outcomes = outcomeText.map((text, index) => ({ outcomeId: `${id}-lo${String(index + 1).padStart(2, "0")}`, unitId: id, sequence: index + 1, learningOutcome: text, bloomLevel: index < 2 ? "Remember and understand" : index < 5 ? "Apply" : "Analyse and create", evidenceOfLearning: index < 2 ? "Vocabulary use and comprehension responses" : index < 5 ? "Grammar, speaking and activity performance" : "Independent writing, presentation or project evidence", origin: "Authored Grade 6 source", reviewStatus: "Approved v1.2", sourceFile: sourcePath(unitNo, "Lesson") }));
  const selfLines = lesson.paragraphs.filter((line) => /^I can /.test(line)).map((line) => line.replace(/\s+Yes.*$/, ""));
  const selfAssessment = selfLines.slice(0, 6).map((statement, index) => ({ selfAssessmentId: `${id}-self${String(index + 1).padStart(2, "0")}`, unitId: id, sequence: index + 1, statement, scale: "Not yet | With help | By myself", outcomeId: outcomes[index % outcomes.length].outcomeId, origin: "Authored Grade 6 source", reviewStatus: "Approved v1.2", sourceFile: sourcePath(unitNo, "Lesson") }));
  while (selfAssessment.length < 6) {
    const index = selfAssessment.length;
    selfAssessment.push({ selfAssessmentId: `${id}-self${String(index + 1).padStart(2, "0")}`, unitId: id, sequence: index + 1, statement: `I can use my ${title.toLowerCase()} learning independently.`, scale: "Not yet | With help | By myself", outcomeId: outcomes[index % outcomes.length].outcomeId, origin: "Curriculum-reviewed extension", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" });
  }
  const answerKey = [
    ...activities.map((activity) => ({ answerId: `${activity.activityId}-answer`, unitId: id, contentId: activity.activityId, contentType: "Activity", answerOrGuidance: activity.answerSummary, origin: activity.origin, reviewStatus: "Approved v1.2", sourceFile: activity.sourceFile })),
    ...quizzes.map((quiz) => ({ answerId: `${quiz.questionId}-answer`, unitId: id, contentId: quiz.questionId, contentType: "Quiz", answerOrGuidance: `${quiz.correctAnswer} ${quiz.explanation}`, origin: quiz.origin, reviewStatus: "Approved v1.2", sourceFile: quiz.sourceFile })),
  ];
  return {
    schemaVersion: "Ehel English Runtime v1.2", templateVersion: "Ehel English Content Template v1.2", dictionaryVersion: "Ehel Master Dictionary v1.2", generatedAt: GENERATED_AT,
    grade: { id: "g06", label: "Grade 6" }, subject: "English", term,
    unit: { gradeId: "g06", subject: "English", termId: term.id, unitId: id, unitNo, unitTitle: title, unitOverview: overview, learningPath, origin: "Authored Grade 6 source + curriculum review", reviewStatus: "Approved v1.2", sourceFile: sourcePath(unitNo, "Lesson") },
    visual: { image: `../../vocabulary/assets/${visualMap[unitNo][0]}`, alt: visualMap[unitNo][1], lectureMode: "guided-launch" },
    vocabularyGroups, dictionaryLinks, rubrics: baseRubrics.map((rubric) => ({ ...rubric, origin: "Ehel Grade 6 approved rubric v1.2" })), outcomes, readings, comprehension, grammar, speaking, writing, activities,
    assignments: [{ assignmentId: `${id}-assignment01`, unitId: id, title: `${title} learning portfolio`, instructions: `Submit ${writing[0].title} and a recording of ${speaking[0].title}. Improve both pieces using the Grade 6 rubrics.`, submissionType: "Writing + audio", marks: 32, outcomeIds: `${outcomes[0].outcomeId} | ${outcomes[Math.min(1, outcomes.length - 1)].outcomeId}`, rubricIds: "rub-writing-v1 | rub-speaking-v1", origin: "Curriculum-reviewed unit portfolio", reviewStatus: "Approved v1.2", sourceFile: "Derived from unit writing and speaking tasks" }],
    quizzes, liveSessions,
    teacherNotes: [{ teacherNoteId: `${id}-note01`, unitId: id, noteType: "Delivery and inclusion", note: "Model new language aloud, check meaning before independent work, use mixed-response modes, and give specific feedback on complete sentences, text evidence and vocabulary precision.", visibility: "Teacher", origin: "Curriculum review", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" }, { teacherNoteId: `${id}-note02`, unitId: id, noteType: "Source-linked AI tutor support", note: [...doc(unitNo, "Lesson").tables, ...doc(unitNo, "Vocabulary").tables, ...doc(unitNo, "Grammar").tables].flat(2).filter((value) => String(value).includes("Ask Your AI Tutor")).join("\n"), visibility: "Teacher", origin: "Authored Grade 6 source", reviewStatus: "Approved v1.2", sourceFile: "Multiple Grade 6 source files" }],
    answerKey, selfAssessment,
  };
}

function buildCapstone(regularUnits, dictionaryEntries) {
  const unitNo = 10;
  const id = unitId(unitNo);
  const term = termFor(unitNo);
  const selectedLinks = regularUnits.flatMap((unit) => unit.dictionaryLinks.slice(0, 4)).slice(0, 30).map((link, index) => ({ ...link, vocabularyId: `u10-g1-${index + 1}-${slug(dictionaryEntries.get(link.dictionaryEntryId).displayWord)}`, unitId: id, termId: term.id, groupId: "u10-g1-grade-6-review-words", groupTitle: "Grade 6 Review Words", sequence: index + 1 }));
  const title = "My English Voice: Grade 6 Capstone";
  const outcomes = ["Select and synthesize strong evidence from Units 1-9 to explain progress.", "Use Grade 6 vocabulary accurately across speaking and writing.", "Analyse a chosen passage through evidence, viewpoint and evaluation.", "Create a researched multi-section English product for a defined audience.", "Present and defend ideas clearly for four minutes, responding thoughtfully to questions.", "Reflect honestly and set a specific Grade 7 English goal."].map((learningOutcome, index) => ({ outcomeId: `${id}-lo0${index + 1}`, unitId: id, sequence: index + 1, learningOutcome, bloomLevel: index < 2 ? "Apply" : index < 4 ? "Analyse and create" : "Evaluate", evidenceOfLearning: "Capstone portfolio, researched product, presentation and reflection", origin: "Ehel Grade 6 capstone specification", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" }));
  const makeSix = (kind, items) => items.map((item, index) => {
    const prefix = kind === "grammar" ? "grammar" : kind === "speaking" ? "speak" : kind === "writing" ? "write" : "act";
    const itemId = `${id}-${prefix}0${index + 1}`;
    const common = { unitId: id, sequence: index + 1, title: item[0], outcomeId: outcomes[index].outcomeId, origin: "Ehel Grade 6 capstone specification", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" };
    if (kind === "grammar") return { grammarId: itemId, conceptId: `${itemId}-concept`, ...common, practiceType: "Capstone editing", explanation: item[1], ruleAndExamples: item[2], commonMistake: "Do not change language randomly; explain how the revision improves meaning or accuracy.", memoryTip: "Read every revised sentence aloud.", practice: item[3], audio: lessonAudio(10, "grammar", itemId) };
    if (kind === "speaking") return { speakingId: itemId, ...common, activityType: "Capstone rehearsal", instructionsAndModelLines: item[1], recordingRequired: true, aiTutorPrompt: "Listen to my rehearsal and give feedback on organisation, vocabulary, fluency and audience awareness.", audio: lessonAudio(10, "speaking", itemId) };
    if (kind === "writing") return { writingId: itemId, ...common, promptAndInstructions: item[1], modelText: item[2], sentenceStarter: item[3], expectedLength: "Three to five paragraphs with clear structure", successCriteria: "I addressed my audience; organised connected sections and paragraphs; used precise vocabulary; synthesized relevant evidence; considered viewpoint; checked grammar and punctuation; revised from feedback", support: "Use a research organizer, planning frame, word bank and approved source models.", extension: "Evaluate source choices, vary sentence structures, strengthen transitions and write a defensible conclusion.", rubricId: "rub-writing-v1" };
    return { activityId: itemId, ...common, activityType: "Capstone milestone", instructionsAndItems: item[1], answerSummary: "Teacher verifies completion against the capstone rubric and evidence checklist.", deliveryMode: "Online, portfolio and live session" };
  });
  const grammar = makeSix("grammar", [["Sentence accuracy audit", "Review agreement, tense and complete sentences.", "Every sentence needs a clear subject and verb.", "Correct six sentences from your portfolio."], ["Tense control", "Check that past, present and future time are clear.", "Yesterday I visited. Today I learn. Tomorrow I will present.", "Revise six verbs and explain each tense choice."], ["Questions and responses", "Use accurate Wh- and yes/no questions.", "Where did you learn this? Why is it important?", "Write and answer six audience questions."], ["Description and precision", "Improve nouns, verbs, adjectives and adverbs.", "The thoughtful learner explained the idea clearly.", "Strengthen six plain sentences."], ["Joining ideas", "Connect ideas with and, but, because, so and when.", "I revised my story because feedback helped me.", "Combine six pairs of ideas."], ["Final editing conference", "Apply capitals, spelling, punctuation and paragraphing.", "Read, mark, revise, then read again.", "Complete the final editing checklist."]]);
  const speaking = makeSix("speaking", [["Portfolio evidence conference", "Explain three portfolio choices and support each choice with precise evidence."], ["Fluent reading and interpretation", "Read a selected passage with clear phrasing, then explain its viewpoint and significance."], ["Research vocabulary in context", "Use twelve review words naturally while explaining your research and conclusions."], ["Four-minute presentation", "Present a clear opening, organised claims with synthesized evidence, a considered viewpoint and a strong closing."], ["Question-and-answer defence", "Answer six audience questions with relevant evidence and thoughtful clarification."], ["Final capstone presentation", "Deliver your polished four-minute presentation and record your reflection."]]);
  const writing = makeSix("writing", [["Portfolio evidence captions", "Write a precise paragraph about each of three selected pieces and explain what each demonstrates.", "This revised report shows that I can organize evidence and support an evaluation.", "This piece demonstrates..."], ["Research proposal", "Explain your question, audience, approved sources, product and plan in three organized paragraphs.", "My project will investigate how communities prepare for natural hazards using two approved sources.", "My research question is..."], ["Researched first draft", "Write the complete first draft of your capstone product with clear sections and source evidence.", "Use a clear introduction, organized sections and paragraphs, synthesized evidence, and a conclusion suited to your audience.", "The evidence suggests..."], ["Revision from feedback", "Record three feedback points and rewrite the sections they improve.", "Feedback asked me to compare evidence, so I connected details from Units 3 and 7 and explained their significance.", "One substantial improvement I made was..."], ["Presentation notes", "Prepare concise cue cards for a four-minute presentation and question defence.", "Opening; research question; claims; evidence; viewpoint; audience questions; closing.", "Today I will defend..."], ["Grade 6 reflection", "Evaluate your strongest progress, one challenge, and a specific Grade 7 goal.", "I became a stronger reader because I learned to synthesize and evaluate evidence. Next, I will improve source comparison.", "This year I learned..."]]);
  const activities = makeSix("activities", [["Curate and annotate evidence", "Review Units 1-9 and select reading, writing and speaking evidence with reasons."], ["Build a research word map", "Organise 30 review words into conceptual categories and explain relationships."], ["Investigate approved sources", "Collect and compare evidence from at least two approved course sources."], ["Peer review studio", "Use the rubric to give and receive three specific improvement suggestions."], ["Rehearse with timing", "Practise the four-minute presentation twice and improve pace, emphasis and transitions."], ["Exhibition and defence", "Present the researched product, defend conclusions and record a Grade 7 learning goal."]]);
  const readings = regularUnits.slice(0, 5).map((unit, index) => {
    const selected = [...unit.readings].sort((a, b) => b.passageScript.split(/\s+/).length - a.passageScript.split(/\s+/).length)[0];
    return { ...selected, readingId: `${id}-read0${index + 1}`, unitId: id, sequence: index + 1, title: `Review text ${index + 1}: ${selected.title}`, audio: lessonAudio(10, "readings", `${id}-read0${index + 1}`) };
  });
  const comprehension = readings.flatMap((reading, index) => ["What is the central idea of this text?", "Which detail best supports the central idea?"].map((question, questionIndex) => ({ questionId: `${id}-cq${String(index * 2 + questionIndex + 1).padStart(3, "0")}`, unitId: id, readingId: reading.readingId, section: "Capstone review reading", sequence: index * 2 + questionIndex + 1, questionType: questionIndex ? "Evidence" : "Main idea", question, correctAnswer: "Accept an accurate response supported by the selected review text.", explanation: "The response should identify a central idea or relevant evidence.", marks: questionIndex + 1, outcomeId: outcomes[2].outcomeId, difficulty: "Core", origin: "Capstone review", reviewStatus: "Approved v1.2", sourceFile: "Units 1-9 approved texts" })));
  while (comprehension.length < 12) comprehension.push({ ...comprehension[comprehension.length % 10], questionId: `${id}-cq${String(comprehension.length + 1).padStart(3, "0")}`, sequence: comprehension.length + 1, question: comprehension.length === 10 ? "Compare two review texts. What important idea do they share?" : "Which Grade 6 text influenced your capstone most, and why?" });
  const quizzes = regularUnits.flatMap((unit) => unit.quizzes.slice(0, 2)).slice(0, 10).map((quiz, index) => ({ ...quiz, quizId: `${id}-quiz${String(index + 1).padStart(2, "0")}`, questionId: `${id}-quiz${String(index + 1).padStart(2, "0")}-q01`, unitId: id, quizTitle: "Grade 6 capstone review checkpoint", sequence: index + 1 }));
  const liveSessions = ["Launch and portfolio curation", "Reading and vocabulary conference", "Project planning and first draft", "Grammar editing and peer feedback", "Presentation rehearsal", "Capstone exhibition and reflection"].map((title, index) => ({ liveSessionId: `${id}-live0${index + 1}`, unitId: id, week: index < 3 ? 1 : 2, sessionWithinWeek: (index % 3) + 1, sessionNo: index + 1, title, durationMin: 45, beforeSession: "Complete the preceding capstone milestone and bring evidence.", agenda: "5 min check-in; 10 min model; 15 min workshop; 10 min conference or rehearsal; 5 min next step", afterSession: index === 5 ? "Complete the final course quiz." : "Apply feedback and upload the improved milestone.", outcomeIds: outcomes[index].outcomeId, origin: "Ehel Grade 6 capstone specification", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" }));
  return { schemaVersion: "Ehel English Runtime v1.2", templateVersion: "Ehel English Content Template v1.2", dictionaryVersion: "Ehel Master Dictionary v1.2", generatedAt: GENERATED_AT, grade: { id: "g06", label: "Grade 6" }, subject: "English", term, unit: { gradeId: "g06", subject: "English", termId: term.id, unitId: id, unitNo, unitTitle: title, unitOverview: "Bring together your strongest vocabulary, reading, grammar, speaking and writing from Units 1-9. Create a researched multi-section English product for a defined audience, defend it clearly, respond to questions and reflect on your Grade 6 growth.", learningPath: "Choose and annotate evidence. Form a research question. Compare sources. Plan and draft sections. Improve from feedback. Present and defend. Reflect. Complete the final course quiz.", origin: "Ehel Grade 6 capstone specification", reviewStatus: "Approved v1.2 capstone", sourceFile: "Ehel English Content Template v1.2" }, visual: { image: "../grade-2/capstone-my-english-world.png", alt: visualMap[10][1], lectureMode: "capstone-launch" }, vocabularyGroups: [{ id: "u10-g1-grade-6-review-words", number: 1, title: "Grade 6 Review Words", vocabularyIds: selectedLinks.map((link) => link.vocabularyId) }], dictionaryLinks: selectedLinks, rubrics: baseRubrics.map((rubric) => ({ ...rubric, origin: "Ehel Grade 6 approved rubric v1.2" })), outcomes, readings, comprehension, grammar, speaking, writing, activities, assignments: [{ assignmentId: `${id}-assignment01`, unitId: id, title: "Grade 6 researched capstone and presentation", instructions: "Submit the researched multi-section product, annotated source evidence, three portfolio pieces, four-minute presentation recording and reflection.", submissionType: "Portfolio + researched product + presentation", marks: 64, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).join(" | "), rubricIds: "rub-writing-v1 | rub-speaking-v1", origin: "Ehel Grade 6 capstone specification", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" }], quizzes, liveSessions, teacherNotes: [{ teacherNoteId: `${id}-note01`, unitId: id, noteType: "Capstone moderation", note: "Conference at each milestone, verify responsible source use, preserve learner ownership, assess the researched product and four-minute presentation with shared rubrics, and record actionable Grade 7 transition feedback.", visibility: "Teacher", origin: "Curriculum review", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" }], answerKey: [...activities.map((activity) => ({ answerId: `${activity.activityId}-answer`, unitId: id, contentId: activity.activityId, contentType: "Capstone milestone", answerOrGuidance: activity.answerSummary, origin: activity.origin, reviewStatus: "Approved v1.2", sourceFile: activity.sourceFile })), ...quizzes.map((quiz) => ({ answerId: `${quiz.questionId}-answer`, unitId: id, contentId: quiz.questionId, contentType: "Quiz", answerOrGuidance: `${quiz.correctAnswer} ${quiz.explanation}`, origin: quiz.origin, reviewStatus: "Approved v1.2", sourceFile: quiz.sourceFile }))], selfAssessment: outcomes.map((outcome, index) => ({ selfAssessmentId: `${id}-self0${index + 1}`, unitId: id, sequence: index + 1, statement: outcome.learningOutcome.replace(/^(Select|Use|Read|Create|Present|Reflect)/, (verb) => `I can ${verb.toLowerCase()}`), scale: "Not yet | With help | By myself", outcomeId: outcome.outcomeId, origin: "Capstone reflection", reviewStatus: "Approved v1.2", sourceFile: "Ehel English Content Template v1.2" })) };
}

function buildFinalAssessment(units) {
  const selected = units.slice(0, 9).flatMap((unit) => unit.quizzes.slice(0, 4)).slice(0, 30);
  const sections = [
    { sectionId: "grade6-final-sec01", sequence: 1, title: "Words and Meaning", description: "Use Grade 6 vocabulary accurately in familiar and new contexts.", startQuestion: 1, endQuestion: 10, questionCount: 10 },
    { sectionId: "grade6-final-sec02", sequence: 2, title: "Reading and Language", description: "Show reading understanding and control of Grade 6 language patterns.", startQuestion: 11, endQuestion: 20, questionCount: 10 },
    { sectionId: "grade6-final-sec03", sequence: 3, title: "Communication and Application", description: "Apply English to speaking, writing and purposeful communication.", startQuestion: 21, endQuestion: 30, questionCount: 10 },
  ];
  const questions = selected.map((quiz, index) => {
    const sourceUnit = units.find((unit) => unit.unit.unitId === quiz.unitId);
    return { ...quiz, assessmentId: "eng-g06-course-final-quiz-v12", quizId: "eng-g06-course-final-quiz-v12", questionId: `eng-g06-final-q${String(index + 1).padStart(2, "0")}`, sequence: index + 1, sectionId: sections[Math.floor(index / 10)].sectionId, sourceUnitNo: sourceUnit?.unit.unitNo, sourceUnitId: quiz.unitId, sourceUnitTitle: sourceUnit?.unit.unitTitle, curriculumArea: Math.floor(index / 10) === 0 ? "Vocabulary and meaning" : Math.floor(index / 10) === 1 ? "Reading and language" : "Communication and application", reviewRoute: `Review Unit ${sourceUnit?.unit.unitNo || 1}`, audio: pendingAudio(`./media/audio/final-quiz/eng-g06-final-q${String(index + 1).padStart(2, "0")}.mp3`) };
  });
  return { schemaVersion: "Ehel English Course Final Assessment v1.2", assessmentId: "eng-g06-course-final-quiz-v12", gradeId: "g06", subject: "English", title: "Grade 6 English Final Course Quiz", description: "A cumulative assessment of vocabulary, reading, language and communication across Units 1-9.", placement: "After Unit 10 capstone", questionCount: 30, totalMarks: 30, estimatedMinutes: 30, passPercent: 80, attemptsAllowed: "Teacher or school policy", sections, questions, reviewStatus: "Approved v1.2", audioProvider: "ElevenLabs", voiceId: VOICE_ID };
}

fs.mkdirSync(UNIT_DIR, { recursive: true });
const dictionaryEntries = new Map();
const regularUnits = Array.from({ length: 9 }, (_, index) => buildRegularUnit(index + 1, dictionaryEntries));
const capstone = buildCapstone(regularUnits, dictionaryEntries);
const units = [...regularUnits, capstone];
const dictionary = { schemaVersion: "Ehel Master Dictionary v1.2", language: "en-GB", gradeId: "g06", entryCount: dictionaryEntries.size, entries: [...dictionaryEntries.values()] };
const finalAssessment = buildFinalAssessment(units);
const manifest = { schemaVersion: "Ehel Grade 6 English Course Manifest v1.2", grade: { id: "g06", label: "Grade 6" }, subject: "English", defaultUnit: 1, units: units.map((unit) => ({ number: unit.unit.unitNo, id: unit.unit.unitId, termId: unit.term.id, title: unit.unit.unitTitle, data: `./data/units/unit-${unit.unit.unitNo}.json`, vocabularyCount: unit.dictionaryLinks.length, reviewStatus: unit.unit.reviewStatus })), finalAssessment: { id: finalAssessment.assessmentId, title: finalAssessment.title, data: "./data/course-final-quiz.json", placement: finalAssessment.placement, questionCount: 30, passPercent: 80, reviewStatus: finalAssessment.reviewStatus } };

for (const unit of units) fs.writeFileSync(path.join(UNIT_DIR, `unit-${unit.unit.unitNo}.json`), JSON.stringify(unit, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "course-manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "master-dictionary.grade6.json"), JSON.stringify(dictionary, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "course-final-quiz.json"), JSON.stringify(finalAssessment, null, 2));
console.log(`Built Grade 6 English: ${units.length} units, ${dictionary.entryCount} dictionary entries, ${finalAssessment.questionCount}-question final quiz.`);




