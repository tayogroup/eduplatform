const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_FILE = path.join(ROOT, "inputs", "ehel-grade1-source", "grade1-source-extracted.json");
const GRADE2_DICTIONARY_FILE = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-2", "data", "master-dictionary.grade2.json");
const GRADE_DIR = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-1");
const DATA_DIR = path.join(GRADE_DIR, "data");
const UNIT_DATA_DIR = path.join(DATA_DIR, "units");
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

const unitConfigs = {
  1: { title: "Welcome to School", theme: "school, colours and confident introductions", visual: "unit-1-welcome-calendar.png", patterns: ["This is a ___.", "It is ___.", "My name is ___.", "I am ___ years old.", "I can ___.", "I like ___."] },
  2: { title: "Family Time", theme: "family, food, counting and helping", visual: "unit-8-home.png", patterns: ["This is my ___.", "He is my ___.", "She is my ___.", "Do you like ___?", "There are ___ ___.", "I can help by ___."] },
  3: { title: "Fun and Games", theme: "movement, body parts, position and fair play", visual: "unit-3-ready-steady-go.png", patterns: ["I can ___.", "Can you ___?", "This is my ___.", "The ball is on the ___.", "Touch your ___.", "I am ___ing."] },
  4: { title: "Making Things", theme: "shapes, clothes, creativity and patience", visual: "unit-5-measure.png", patterns: ["This is a ___.", "It is a ___ ___.", "I am cutting ___.", "I am making ___.", "I am wearing ___.", "I can be a ___."] },
  5: { title: "On the Farm", theme: "farm animals, sounds, growing and work", visual: "unit-6-bugs.png", patterns: ["This is a ___.", "The ___ says ___.", "The ___ is ___ing.", "It has ___.", "First ___, then ___.", "I can see a ___."] },
  6: { title: "My Five Senses", theme: "the senses, body parts, descriptions and comparison", visual: "unit-3-ready-steady-go.png", patterns: ["I can see with my eyes.", "I can hear with my ears.", "It is ___.", "This is ___ than that.", "These are my ___.", "Which sense do I use?"] },
  7: { title: "Let's Go!", theme: "transport, journeys and safe travel", visual: "unit-9-city.png", patterns: ["I go by ___.", "It goes on the ___.", "I can see a ___.", "The ___ is fast.", "We are ___ing.", "First we ___, then we ___."] },
  8: { title: "Wonderful Water", theme: "water, weather, living things and care", visual: "unit-4-big-sky.png", patterns: ["I use water to ___.", "It is rainy.", "A ___ needs water.", "The ___ floats.", "We must not waste water.", "___ live in water."] },
  9: { title: "City Places", theme: "town places, helpful people, safety and care", visual: "unit-9-city.png", patterns: ["There is a ___.", "The ___ is next to the ___.", "A ___ works at the ___.", "Stop. / Go.", "I go to the ___.", "Please ___. Thank you."] },
};

const commonRubrics = [
  ["rub-g1-speaking-v1", "Speaking", "Clarity", "Needs a full spoken model", "Repeats a word with support", "Uses a clear short phrase", "Uses a clear complete sentence"],
  ["rub-g1-speaking-v1", "Speaking", "Participation", "Not ready to join yet", "Joins one supported turn", "Completes most turns", "Joins confidently and responds"],
  ["rub-g1-writing-v1", "Early writing", "Meaning", "Marks do not yet show the idea", "Draws or traces with support", "Labels or copies a meaningful phrase", "Creates a meaningful short sentence"],
  ["rub-g1-writing-v1", "Early writing", "Letter formation", "Needs hand-over-hand support", "Forms some recognisable letters", "Forms most target letters clearly", "Forms letters clearly with spacing"],
  ["rub-g1-writing-v1", "Early writing", "Conventions", "Needs a complete model", "Copies part of the model", "Uses a capital or end mark with support", "Uses a capital and end mark independently"],
  ["rub-g1-participation-v1", "Learning habits", "Confidence and care", "Needs reassurance to begin", "Tries with close support", "Tries, listens and takes turns", "Participates confidently and helps others"],
].map(([rubricId, target, criterion, level1, level2, level3, level4], index) => ({ rubricId, target, criterionId: `${rubricId}-c${String(index + 1).padStart(2, "0")}`, criterion, level1, level2, level3, level4, maximumMarks: 4, origin: "Ehel Grade 1 curriculum review", reviewStatus: "Approved - curriculum reviewer" }));

function clean(value) {
  return String(value || "").replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/\s+/g, " ").trim();
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function metadata(record) {
  return { ...record, origin: record.origin || "Ehel Year 1 source curriculum conversion", reviewStatus: record.reviewStatus || "Approved - curriculum reviewer", sourceFile: record.sourceFile || "Year 1 source archive" };
}

function audioDescriptor(unitNo, folder, id) {
  const source = `./media/audio/unit-${unitNo}/${folder}/${id}.mp3`;
  const absolute = path.join(GRADE_DIR, source.replace(/^\.\//, ""));
  const available = fs.existsSync(absolute) && fs.statSync(absolute).size > 1000;
  return { provider: "ElevenLabs", voiceId: VOICE_ID, model: MODEL_ID, source, available, status: available ? "Ready" : "Pending generation" };
}

function documentMap(source) {
  return new Map(source.documents.map((document) => [document.path, document]));
}

function between(paragraphs, start, end) {
  const startIndex = paragraphs.findIndex((paragraph) => paragraph === start);
  const endIndex = paragraphs.findIndex((paragraph, index) => index > startIndex && paragraph === end);
  return paragraphs.slice(startIndex + 1, endIndex < 0 ? paragraphs.length : endIndex);
}

function extractStory(document) {
  const paragraphs = document.paragraphs.slice(3);
  const end = paragraphs.findIndex((paragraph) => /^Let's Talk|^Ask your child/.test(paragraph));
  return paragraphs.slice(0, end < 0 ? paragraphs.length : end).join("\n\n");
}

function extractVocabulary(guide) {
  const lines = between(guide.paragraphs, "Words We Will Learn", "Songs and Rhymes");
  const groups = [];
  for (let index = 0; index < lines.length; index += 1) {
    const next = lines[index + 1] || "";
    if (!next.includes("·")) continue;
    const words = next.split("·").flatMap((word) => word.split(" / ")).map((word) => clean(word.replace(/\([^)]*\)/g, ""))).filter(Boolean);
    groups.push({ title: clean(lines[index]), words: [...new Set(words)] });
    index += 1;
  }
  return groups;
}

function guessPartOfSpeech(word, groupTitle) {
  const group = groupTitle.toLowerCase();
  if (/action|activities|senses|use|move|making/.test(group) || /ing$/.test(word)) return "verb";
  if (/describing|colour|position|direction|comparing|weather/.test(group)) return "adjective";
  if (/^(in|on|under|next to|near|far|here|there)$/.test(word)) return "preposition";
  return "noun";
}

function partDefinition(part) {
  return ({ noun: "A naming word", verb: "An action word", adjective: "A describing word", preposition: "A place or position word" })[part] || "A useful word";
}

function sentenceFor(word, part, index) {
  if (part === "verb") return ["I can WORD.", "We WORD together.", "Please WORD with me.", "Can you WORD?", "I like to WORD."][index].replace("WORD", word.replace(/ing$/, ""));
  if (part === "adjective") return ["It is WORD.", "I can see something WORD.", "The picture looks WORD.", "This one is WORD.", "Can you find a WORD thing?"][index].replace("WORD", word);
  if (part === "preposition") return ["The ball is WORD the box.", "Stand WORD me.", "Put the book WORD the table.", "I can see it WORD the chair.", "The picture is WORD the clock."][index].replace("WORD", word);
  return ["This is a WORD.", "I can see a WORD.", "The WORD is here.", "I like the WORD.", "Can you point to the WORD?"][index].replace(/a ([aeiou])/i, "an $1").replaceAll("WORD", word);
}

function buildDictionary(unitSources, grade2Dictionary) {
  const reused = new Map(grade2Dictionary.entries.map((entry) => [entry.displayWord.toLowerCase(), entry]));
  const entries = new Map();
  const linksByUnit = new Map();
  for (const source of unitSources) {
    const links = [];
    source.vocabularyGroups.forEach((group, groupIndex) => {
      group.words.forEach((word, wordIndex) => {
        const key = word.toLowerCase();
        const partOfSpeech = guessPartOfSpeech(word, group.title);
        const dictionaryEntryId = reused.get(key)?.dictionaryEntryId || `ehel-en-g1-${slug(word)}`;
        if (!entries.has(dictionaryEntryId)) {
          const reusedEntry = reused.get(key);
          entries.set(dictionaryEntryId, reusedEntry ? { ...reusedEntry, gradeLevels: [...new Set([...(reusedEntry.gradeLevels || ["Grade 2"]), "Grade 1"])] } : {
            dictionaryEntryId,
            lemma: key,
            displayWord: word,
            language: "en-GB",
            partOfSpeech,
            partOfSpeechDefinition: partDefinition(partOfSpeech),
            gradeLevels: ["Grade 1"],
            audio: { provider: "ElevenLabs", voiceId: VOICE_ID, model: MODEL_ID, normal: `./media/dictionary/${slug(word)}.mp3`, slowPlaybackRate: 0.76, cueStart: 0, cueEnd: null, available: false, status: "Pending generation" },
          });
        }
        const practiceSentences = Array.from({ length: 5 }, (_, index) => sentenceFor(word, partOfSpeech, index));
        links.push(metadata({
          vocabularyId: `g1-u${source.number}-g${groupIndex + 1}-${wordIndex + 1}-${slug(word)}`,
          unitId: source.unitId,
          dictionaryEntryId,
          groupId: `g1-u${source.number}-group-${groupIndex + 1}`,
          groupTitle: group.title,
          sequence: links.length + 1,
          childMeaning: `${partDefinition(partOfSpeech)} used when we talk about ${source.theme}.`,
          exampleSentence: practiceSentences[0],
          practiceSentences,
          sentenceAudio: practiceSentences.map(() => null),
          spellingPractice: word.length <= 7 ? `Say, tap and trace: ${word.split("").join(" - ")}` : `Clap the parts, then copy: ${word}`,
          sentenceStarter: partOfSpeech === "verb" ? "I can" : partOfSpeech === "adjective" ? "It is" : "This is",
          aiTutorPrompt: `With an adult, ask the tutor to say ${word} slowly, use it in one easy sentence and wait for you to repeat.`,
        }));
      });
    });
    linksByUnit.set(source.number, links);
  }
  return { master: { schemaVersion: "Ehel Master Dictionary v1.1", language: "en-GB", gradeId: "g01", entryCount: entries.size, entries: [...entries.values()] }, linksByUnit };
}

function grammarItems(config, unitId, unitNo, outcomes) {
  return config.patterns.map((pattern, index) => {
    const grammarId = `${unitId}-grammar${String(index + 1).padStart(2, "0")}`;
    return metadata({ grammarId, unitId, conceptId: `${unitId}-language-${index + 1}`, sequence: index + 1, practiceType: index < 3 ? "Listen, point and choose" : "Say, build and use", title: `Language pattern ${index + 1}`, explanation: `Listen to the model, point to the matching picture, then say the pattern: ${pattern}`, ruleAndExamples: pattern, commonMistake: "A Grade 1 learner may answer with one word. Model the whole short pattern warmly and let the learner try again.", memoryTip: "Say it, tap it, then build it with word cards.", practice: `Complete and say three examples using: ${pattern}`, outcomeId: outcomes[index % outcomes.length].outcomeId, audio: audioDescriptor(unitNo, "grammar", grammarId) });
  });
}

function createRegularRuntime(source, links) {
  const { number: unitNo, unitId, title, theme, guide, story, activity, config } = source;
  const termNo = Math.ceil(unitNo / 3);
  const rawOutcomes = between(guide.paragraphs, "What Your Child Will Be Able to Do", "Words We Will Learn").filter((line) => !/^[A-Z][A-Za-z ]+$/.test(line));
  const outcomeTexts = rawOutcomes.slice(0, 6);
  while (outcomeTexts.length < 6) outcomeTexts.push(`Use short spoken and early-written English about ${theme}.`);
  const outcomes = outcomeTexts.map((learningOutcome, index) => metadata({ outcomeId: `${unitId}-lo${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, learningOutcome, evidenceOfLearning: "Observed through pointing, speaking, drawing, tracing, matching, play and one supported independent response." }));
  const storyTitle = story.paragraphs[2] || `${title} Story`;
  const storyText = extractStory(story);
  const rhymeLines = between(guide.paragraphs, "Songs and Rhymes", "How to Teach This Unit, Step by Step").slice(0, 8).join("\n");
  const readings = [
    [storyTitle, "Story", storyText],
    [`Talk about ${title}`, "Shared reading", `Look, point and talk. ${config.patterns.join(" ")} An adult reads each line while the learner points, repeats and acts.`],
    [`${title} rhyme`, "Rhyme", rhymeLines || `Listen and join in with a short rhyme about ${theme}.`],
  ].map(([readingTitle, type, passageScript], index) => {
    const readingId = `${unitId}-read${String(index + 1).padStart(2, "0")}`;
    return metadata({ readingId, unitId, sequence: index + 1, type, title: readingTitle, genre: type, theme, setting: "Home, online lesson or Grade 1 classroom", passageScript, audioRequired: true, audio: audioDescriptor(unitNo, "readings", readingId) });
  });
  const comprehensionPrompts = [
    `Who is in the ${storyTitle} story?`, `Where does the story happen?`, `Name one thing the learner can point to in the story.`, `What happens first?`, `What happens at the end?`, `How does the main character feel?`,
    `Say one ${theme} word.`, `Which language pattern can you use?`, `Point to a matching picture and say the word.`, `Act out one action from the Unit.`, `Tell one kind or safe choice from the Unit.`, `Which part did you like best?`,
  ];
  const comprehension = comprehensionPrompts.map((question, index) => metadata({ questionId: `${unitId}-cq${String(index + 1).padStart(2, "0")}`, unitId, readingId: readings[index < 6 ? 0 : 1].readingId, section: index < 6 ? storyTitle : `Talk about ${title}`, sequence: index + 1, questionType: index < 6 ? "Oral response" : "Point, act or say", question, correctAnswer: index < 6 ? "Accept an accurate detail from the source story." : "Accept a relevant word, action or complete supported pattern.", explanation: "At Grade 1, listen for meaning and confidence before spelling accuracy.", marks: 1, outcomeId: outcomes[index % outcomes.length].outcomeId, difficulty: "Grade 1 supported" }));
  const grammar = grammarItems(config, unitId, unitNo, outcomes);
  const speakingTitles = ["Listen and point", "Repeat the model", "Ask and answer", "Picture talk", "Role-play", "My confident turn"];
  const speaking = speakingTitles.map((speakingTitle, index) => {
    const speakingId = `${unitId}-speak${String(index + 1).padStart(2, "0")}`;
    return metadata({ speakingId, unitId, sequence: index + 1, activityType: index < 2 ? "Adult-led oral practice" : "Interactive speaking", title: `Speaking ${index + 1} - ${speakingTitle}`, instructionsAndModelLines: `${config.patterns[index]} An adult models once, the learner repeats, then changes one word using a picture or real object.`, recordingRequired: index >= 3, aiTutorPrompt: `With an adult present, practise the pattern ${config.patterns[index]} Give warm feedback on one clear word and one next try.`, outcomeId: outcomes[index % outcomes.length].outcomeId, audio: audioDescriptor(unitNo, "speaking", speakingId) });
  });
  const writingModes = ["Draw and tell", "Trace", "Match and copy", "Label", "Complete a pattern", "Create one sentence"];
  const writing = writingModes.map((mode, index) => metadata({ writingId: `${unitId}-write${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, practiceType: "Grade 1 early writing", title: `Writing ${index + 1} - ${mode}`, promptAndInstructions: index === 0 ? `Draw one idea about ${theme}. Tell an adult what it shows.` : index === 1 ? `Trace two useful words, saying each sound or word as you trace.` : index === 2 ? "Match three words to pictures, then copy one word." : index === 3 ? "Add two labels to your drawing or picture." : index === 4 ? `Copy and complete: ${config.patterns[index]}` : `Choose a picture and complete one short sentence using: ${config.patterns[index]}`, modelText: config.patterns[index], sentenceStarter: config.patterns[index].split("___")[0].trim(), expectedLength: index < 3 ? "Drawing, tracing or 1-3 words" : "One label, phrase or short sentence", successCriteria: "I said the idea first; formed or selected meaningful letters and words; used the model; checked my work with an adult", support: "Adult read-aloud, picture choices, tracing dots, movable word cards and oral rehearsal are allowed.", extension: "Add a second label or sentence and read it aloud.", rubricId: "rub-g1-writing-v1", outcomeId: outcomes[index % outcomes.length].outcomeId }));
  const activityLines = activity.paragraphs.filter((line) => /^\d+\./.test(line)).slice(0, 6);
  const activities = Array.from({ length: 6 }, (_, index) => metadata({ activityId: `${unitId}-act${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, title: `Activity ${index + 1}`, activityType: ["Point and say", "Draw and tell", "Colour and match", "Move and act", "Listen and choose", "Make and share"][index], instructionsAndItems: activityLines[index] || `Use pictures, objects or movement to practise ${config.patterns[index]}`, answerSummary: "Accept the correct match, action, picture choice or a relevant supported spoken response.", outcomeId: outcomes[index % outcomes.length].outcomeId, deliveryMode: "Shared online UI with adult or teacher support" }));
  const quizWords = links.slice(0, 5);
  const quizzes = [
    ...quizWords.map((link, index) => metadata({ quizId: `${unitId}-quiz01`, questionId: `${unitId}-quiz01-q${String(index + 1).padStart(2, "0")}`, unitId, quizTitle: `${title} checkpoint`, sequence: index + 1, questionType: "Picture or word choice", question: `Which word belongs to ${link.groupTitle.toLowerCase()}?`, options: [link.masterWord || link.childMeaning.split(" ")[0], ...links.filter((item) => item.vocabularyId !== link.vocabularyId).slice(index + 1, index + 4).map((item) => item.masterWord || item.groupTitle)].slice(0, 4).join(" | "), correctAnswer: link.masterWord, explanation: `${link.masterWord} is one of the Unit words for ${link.groupTitle.toLowerCase()}.`, marks: 1, outcomeId: outcomes[index % outcomes.length].outcomeId, difficulty: "Supported recall" })),
    ...config.patterns.slice(0, 5).map((pattern, index) => {
      const correctAnswer = pattern;
      const distractors = config.patterns.filter((item) => item !== pattern).slice(0, 3);
      return metadata({ quizId: `${unitId}-quiz01`, questionId: `${unitId}-quiz01-q${String(index + 6).padStart(2, "0")}`, unitId, quizTitle: `${title} checkpoint`, sequence: index + 6, questionType: "Choose the complete pattern", question: `Which is a useful complete pattern for ${title}?`, options: [correctAnswer, ...distractors].join(" | "), correctAnswer, explanation: `The approved Unit pattern is: ${pattern}`, marks: 1, outcomeId: outcomes[(index + 1) % outcomes.length].outcomeId, difficulty: "Supported application" });
    }),
  ];
  const liveSessions = Array.from({ length: 6 }, (_, index) => metadata({ liveSessionId: `${unitId}-live${String(index + 1).padStart(2, "0")}`, unitId, week: index < 3 ? 1 : 2, sessionWithinWeek: (index % 3) + 1, sessionNo: index + 1, title: ["Meet the words", "Story and talk", "Language through play", "Early writing workshop", "Speaking rehearsal", "Celebration and checkpoint"][index], durationMin: 30, beforeSession: index === 0 ? "Bring crayons and one real object connected to the Unit." : "Complete the previous short practice with an adult.", agenda: "5 min hello song; 7 min model and repeat; 8 min game or story; 7 min guided practice; 3 min celebrate and preview", afterSession: `Show one word, action, drawing or sentence from ${title} to an adult.`, outcomeIds: outcomes.slice(Math.max(0, index - 1), Math.max(0, index - 1) + 2).map((outcome) => outcome.outcomeId).join(" | ") }));
  const answerKey = [...comprehension.map((item) => [item.questionId, "Comprehension", item.correctAnswer]), ...grammar.map((item) => [item.grammarId, "Language practice", item.ruleAndExamples]), ...activities.map((item) => [item.activityId, "Activity", item.answerSummary]), ...quizzes.map((item) => [item.questionId, "Quiz", `${item.correctAnswer}. ${item.explanation}`])].map(([contentId, contentType, answerOrGuidance], index) => metadata({ answerId: `${unitId}-answer-${String(index + 1).padStart(3, "0")}`, unitId, contentId, contentType, answerOrGuidance }));
  return {
    schemaVersion: "Ehel English Runtime v1.1", templateVersion: "Ehel English Content Template v1.1", dictionaryVersion: "Ehel Master Dictionary v1.1", grade: { id: "g01", label: "Grade 1" }, subject: "English", term: { id: `t0${termNo}`, label: `Term ${termNo}` },
    unit: { gradeId: "g01", subject: "English", termId: `t0${termNo}`, unitId, unitNo, unitTitle: title, unitOverview: between(guide.paragraphs, "What This Unit Is About", "What Your Child Will Be Able to Do").join(" "), learningPath: "Begin with the guided teacher launch and learn a few words through pictures and play.\nListen to the Unit story and join in with repeated language.\nComplete six language, speaking, early-writing and practical activities.\nMeet your teacher three times each week for two weeks.\nFinish the ten-question checkpoint and tell an adult what you can do.", origin: "Ehel Year 1 source curriculum", reviewStatus: "Approved - curriculum reviewer", sourceFile: `Year 1/Unit ${unitNo}` },
    visual: { image: `../../vocabulary/assets/${config.visual}`, alt: `Child-friendly illustration for ${title}`, lectureMode: "guided-launch" },
    vocabularyGroups: source.vocabularyGroups.map((group, index) => ({ id: `g1-u${unitNo}-group-${index + 1}`, number: index + 1, title: group.title, vocabularyIds: links.filter((link) => link.groupId === `g1-u${unitNo}-group-${index + 1}`).map((link) => link.vocabularyId) })),
    dictionaryLinks: links, outcomes, readings, comprehension, grammar, speaking, writing, activities,
    assignments: [metadata({ assignmentId: `${unitId}-assignment01`, unitId, title: `My ${title} show-and-tell page`, instructions: "Submit one drawing or made object, two labels or traced words, one recorded spoken pattern and an adult-supported reflection.", submissionType: "Drawing or object + labels + short audio/video + reflection", marks: 24, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).join(" | "), rubricIds: "rub-g1-writing-v1 | rub-g1-speaking-v1 | rub-g1-participation-v1" })],
    quizzes, liveSessions,
    teacherNotes: [metadata({ noteId: `${unitId}-note01`, unitId, noteType: "Adult-supported Grade 1 delivery", note: "Use 15-20 minute independent blocks inside the lesson. Read every instruction aloud, model before expecting a response, and accept pointing, acting, drawing, tracing or speaking as valid evidence." }), metadata({ noteId: `${unitId}-note02`, unitId, noteType: "Safeguarding and AI tutor", note: "A teacher or caregiver remains present whenever the young learner uses recording or AI tutor features. The adult controls the device and protects the child's personal information." })],
    answerKey,
    selfAssessment: outcomeTexts.map((text, index) => metadata({ selfAssessmentId: `${unitId}-self${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, statement: `I can ${text.charAt(0).toLowerCase()}${text.slice(1).replace(/\.$/, "")}.`, scale: "Not yet | With help | By myself", outcomeId: outcomes[index].outcomeId })),
    rubrics: commonRubrics,
  };
}

function createAlphabetSource(documents) {
  const overview = documents.get("Pre-Unit 0 Alphabet/Pre-Unit 0 - Module Overview.docx");
  const vocabularyGroups = [
    { title: "Letter picture words A-M", words: ["apple", "ball", "cat", "dog", "elephant", "fish", "goat", "hat", "igloo", "jam", "kite", "lion", "moon"] },
    { title: "Letter picture words N-Z", words: ["nest", "orange", "pen", "queen", "rainbow", "sun", "tree", "umbrella", "van", "water", "box", "yo-yo", "zebra"] },
    { title: "First sight words", words: ["I", "the", "a", "is", "see", "my", "can", "it", "we", "like"] },
  ];
  return { number: 0, unitId: "eng-g01-t00-u00", title: "Alphabet & Sounds", theme: "letters, sounds, blending and first sight words", overview, vocabularyGroups };
}

function createAlphabetRuntime(source, links, documents) {
  const unitId = source.unitId;
  const outcomes = ["recognise and name uppercase and lowercase letters", "connect letters a-z with their most common sounds", "hear and say beginning sounds in familiar words", "blend and read simple CVC words", "recognise ten first sight words", "build and read a tiny patterned sentence"].map((text, index) => metadata({ outcomeId: `${unitId}-lo${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, learningOutcome: `Learner can ${text}.`, evidenceOfLearning: "Observed through pointing, matching, saying, tracing, blending and a gentle one-to-one check." }));
  const weekDocs = Array.from({ length: 6 }, (_, index) => documents.get(`Pre-Unit 0 Alphabet/Week ${index + 1}/Week ${index + 1} Overview.docx`));
  const readings = weekDocs.map((document, index) => {
    const readingId = `${unitId}-read${String(index + 1).padStart(2, "0")}`;
    return metadata({ readingId, unitId, sequence: index + 1, type: "Teacher-led phonics text", title: document.paragraphs[0], genre: "Phonics and early reading", theme: source.theme, setting: "Grade 1 classroom or supported home lesson", passageScript: document.paragraphs.slice(1, 18).join("\n"), audioRequired: true, audio: audioDescriptor(0, "readings", readingId) });
  });
  const comprehension = readings.flatMap((reading, week) => [
    metadata({ questionId: `${unitId}-cq${String(week * 2 + 1).padStart(2, "0")}`, unitId, readingId: reading.readingId, section: reading.title, sequence: week * 2 + 1, questionType: "Listen, point and say", question: `Show one letter, sound or word from ${reading.title}.`, correctAnswer: "Accept an accurate letter, sound, picture cue or word from the week.", explanation: "Observe recognition and confidence.", marks: 1, outcomeId: outcomes[week % outcomes.length].outcomeId, difficulty: "Foundation" }),
    metadata({ questionId: `${unitId}-cq${String(week * 2 + 2).padStart(2, "0")}`, unitId, readingId: reading.readingId, section: reading.title, sequence: week * 2 + 2, questionType: "Do and explain", question: `What can you do now after ${reading.title}?`, correctAnswer: "Accept a demonstrated skill from the week's objectives.", explanation: "Let the learner demonstrate before explaining.", marks: 1, outcomeId: outcomes[week % outcomes.length].outcomeId, difficulty: "Foundation" }),
  ]);
  const patterns = ["A says /a/.", "M says /m/.", "S says /s/.", "c-a-t, cat.", "I see a ___.", "I can ___."];
  const grammar = grammarItems({ patterns }, unitId, 0, outcomes);
  const speaking = patterns.map((pattern, index) => { const speakingId = `${unitId}-speak${String(index + 1).padStart(2, "0")}`; return metadata({ speakingId, unitId, sequence: index + 1, activityType: "Phonics speaking", title: `Sound and say ${index + 1}`, instructionsAndModelLines: `Listen, point, repeat and change one part: ${pattern}`, recordingRequired: index >= 3, aiTutorPrompt: "With an adult present, model one sound or tiny sentence slowly, then wait for the child to repeat.", outcomeId: outcomes[index].outcomeId, audio: audioDescriptor(0, "speaking", speakingId) }); });
  const writing = patterns.map((pattern, index) => metadata({ writingId: `${unitId}-write${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, practiceType: "Pre-writing and early writing", title: ["Trace uppercase letters", "Trace lowercase letters", "Match capital and small letters", "Build a CVC word", "Copy a sight-word phrase", "Write a tiny sentence"][index], promptAndInstructions: ["Trace five large uppercase letters with a finger, then a crayon.", "Trace five lowercase letters while saying their sounds.", "Draw lines to match five uppercase and lowercase partners.", "Use letter cards to build three CVC words, then copy one.", "Trace and copy: I see a ___.", "Choose a picture and complete: I can ___."][index], modelText: pattern, sentenceStarter: pattern.split("___")[0], expectedLength: index < 3 ? "Letter shapes and matches" : "One word, phrase or tiny sentence", successCriteria: "I say the sound or word; start in the right place; follow the shape; read back what I made", support: "Finger tracing, sand tray, large print, letter cards and adult modelling.", extension: "Find another letter, word or picture with the same sound.", rubricId: "rub-g1-writing-v1", outcomeId: outcomes[index].outcomeId }));
  const activities = patterns.map((pattern, index) => metadata({ activityId: `${unitId}-act${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, title: ["Alphabet hunt", "Sound sorting", "Picture match", "Robot blending", "Sight-word snap", "Tiny sentence builder"][index], activityType: "Phonics game", instructionsAndItems: ["Find and name letters in books, labels or an alphabet chart.", "Sort picture cards by their beginning sound.", "Match uppercase letters, lowercase letters and picture cues.", "Say three separated sounds like a robot, then blend the word.", "Find and read matching sight-word cards.", "Arrange word and picture cards to build a tiny sentence."][index], answerSummary: "Accept accurate matching, sound production, blending or sentence construction with age-appropriate support.", outcomeId: outcomes[index].outcomeId, deliveryMode: "Teacher-led online or classroom game" }));
  const quizData = [["Which is the uppercase partner for a?", "A | B | D | O", "A"], ["Which is the lowercase partner for M?", "m | n | w | s", "m"], ["Which word begins with /b/?", "ball | cat | sun | fish", "ball"], ["Which word begins with /s/?", "sun | moon | dog | hat", "sun"], ["Blend c-a-t.", "cat | cap | cot | can", "cat"], ["Blend s-u-n.", "sun | sit | sum | run", "sun"], ["Which is a sight word?", "the | zebra | orange | queen", "the"], ["Complete: I ___ a cat.", "see | moon | hat | pen", "see"], ["Which sentence begins with a capital letter?", "I see a cat. | i see a cat. | see a cat. | cat I see", "I see a cat."], ["Which sentence ends with a full stop?", "I can hop. | I can hop | can hop I | hop", "I can hop."]];
  const quizzes = quizData.map(([question, options, correctAnswer], index) => metadata({ quizId: `${unitId}-quiz01`, questionId: `${unitId}-quiz01-q${String(index + 1).padStart(2, "0")}`, unitId, quizTitle: "Alphabet & Sounds readiness check", sequence: index + 1, questionType: "Multiple choice", question, options, correctAnswer, explanation: `The correct answer is ${correctAnswer}.`, marks: 1, outcomeId: outcomes[index % outcomes.length].outcomeId, difficulty: "Gentle readiness check" }));
  const dailyDocs = [...documents.values()].filter((document) => /^Pre-Unit 0 Alphabet\/Week \d\/Day \d/.test(document.path)).sort((a, b) => a.path.localeCompare(b.path));
  const liveSessions = dailyDocs.map((document, index) => metadata({ liveSessionId: `${unitId}-live${String(index + 1).padStart(2, "0")}`, unitId, week: Math.floor(index / 5) + 1, sessionWithinWeek: (index % 5) + 1, sessionNo: index + 1, title: document.paragraphs[0], durationMin: 50, beforeSession: "Prepare the low-cost materials listed in the source lesson plan.", agenda: document.paragraphs.slice(1, 7).join("; "), afterSession: "Repeat one favourite sound, tracing or blending game for five minutes with an adult.", outcomeIds: outcomes.slice(Math.min(Math.floor(index / 5), 5), Math.min(Math.floor(index / 5), 5) + 1).map((outcome) => outcome.outcomeId).join(" | ") }));
  const answerKey = [...comprehension.map((item) => [item.questionId, "Comprehension", item.correctAnswer]), ...grammar.map((item) => [item.grammarId, "Language practice", item.ruleAndExamples]), ...activities.map((item) => [item.activityId, "Activity", item.answerSummary]), ...quizzes.map((item) => [item.questionId, "Quiz", `${item.correctAnswer}. ${item.explanation}`])].map(([contentId, contentType, answerOrGuidance], index) => metadata({ answerId: `${unitId}-answer-${String(index + 1).padStart(3, "0")}`, unitId, contentId, contentType, answerOrGuidance }));
  return { schemaVersion: "Ehel English Runtime v1.1", templateVersion: "Ehel English Content Template v1.1", dictionaryVersion: "Ehel Master Dictionary v1.1", grade: { id: "g01", label: "Grade 1" }, subject: "English", term: { id: "t00", label: "Readiness" }, unit: { gradeId: "g01", subject: "English", termId: "t00", unitId, unitNo: 0, unitTitle: source.title, unitOverview: source.overview.paragraphs.slice(2, 7).join(" "), learningPath: "Week 1: meet uppercase and lowercase letters.\nWeeks 2-3: connect letters with sounds.\nWeek 4: blend simple CVC words.\nWeek 5: read first sight words and tiny sentences.\nWeek 6: review, celebrate and complete a gentle readiness check.", origin: "Ehel Year 1 Pre-Unit 0 source", reviewStatus: "Approved - curriculum reviewer", sourceFile: "Year 1/Pre-Unit 0 Alphabet" }, visual: { image: "../../vocabulary/assets/unit-1-welcome-calendar.png", alt: "Young learners exploring alphabet letters and picture cues", lectureMode: "guided-launch" }, vocabularyGroups: source.vocabularyGroups.map((group, index) => ({ id: `g1-u0-group-${index + 1}`, number: index + 1, title: group.title, vocabularyIds: links.filter((link) => link.groupId === `g1-u0-group-${index + 1}`).map((link) => link.vocabularyId) })), dictionaryLinks: links, outcomes, readings, comprehension, grammar, speaking, writing, activities, assignments: [metadata({ assignmentId: `${unitId}-assignment01`, unitId, title: "My Alphabet and Sounds mini-book", instructions: "Create six pages showing favourite letters, picture cues, three CVC words, five sight words and one tiny sentence. Read or point through it with a teacher.", submissionType: "Illustrated mini-book + short supported reading", marks: 24, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).join(" | "), rubricIds: "rub-g1-writing-v1 | rub-g1-speaking-v1 | rub-g1-participation-v1" })], quizzes, liveSessions, teacherNotes: [metadata({ noteId: `${unitId}-note01`, unitId, noteType: "Six-week delivery", note: "This readiness module preserves the source sequence of five teacher-led lessons per week for six weeks. Repeat a day when needed; confidence and secure sound awareness matter more than speed." }), metadata({ noteId: `${unitId}-note02`, unitId, noteType: "Gentle assessment", note: "Assess one-to-one through play, pointing, saying, tracing and blending. Do not turn the readiness check into a stressful test." })], answerKey, selfAssessment: outcomes.map((outcome, index) => metadata({ selfAssessmentId: `${unitId}-self${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, statement: outcome.learningOutcome.replace(/^Learner can /, "I can "), scale: "Not yet | With help | By myself", outcomeId: outcome.outcomeId })), rubrics: commonRubrics };
}

function createCapstone(runtimes, dictionary) {
  const unitId = "eng-g01-t03-u10";
  const selectedLinks = [];
  const used = new Set();
  for (let round = 0; selectedLinks.length < 30; round += 1) for (const runtime of runtimes) {
    const link = runtime.dictionaryLinks[round];
    if (!link || used.has(link.dictionaryEntryId)) continue;
    used.add(link.dictionaryEntryId);
    selectedLinks.push({ ...link, vocabularyId: `g1-capstone-${link.vocabularyId}`, unitId, groupId: `g1-capstone-u${runtime.unit.unitNo}`, groupTitle: runtime.unit.unitNo === 0 ? "Alphabet review" : `Review from Unit ${runtime.unit.unitNo}` });
    if (selectedLinks.length === 30) break;
  }
  const source = { number: 10, unitId, title: "My First English World", theme: "celebrating Grade 1 words, stories, speaking and early writing", config: { title: "My First English World", visual: "unit-1-welcome-calendar.png", patterns: ["My name is ___.", "I can ___.", "I like ___.", "This is a ___.", "It is ___.", "My next goal is ___."] }, vocabularyGroups: runtimes.map((runtime) => ({ title: runtime.unit.unitNo === 0 ? "Alphabet review" : `Review from Unit ${runtime.unit.unitNo}`, words: [] })) };
  const outcomes = ["choose favourite Grade 1 work", "use review words in short spoken patterns", "listen and respond to a familiar story", "make a six-page picture-and-word book", "present the book with an adult nearby", "reflect and name one next English goal"].map((text, index) => metadata({ outcomeId: `${unitId}-lo${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, learningOutcome: `Learner can ${text}.`, evidenceOfLearning: "Capstone mini-book, selected portfolio pieces, short presentation and supported reflection." }));
  const readings = [["Sagal's English Year", "Sagal opened her learning folder. She found letters, family pictures, games, shapes, farm animals, senses, vehicles, water and town places. She chose her favourite work and made a new book called My First English World. On celebration day she pointed, read a few words and said, 'My name is Sagal. I can speak English. I like my book.' Everyone clapped."], ["My Capstone Steps", "Choose three favourite pieces. Make a six-page picture-and-word book. Add labels and short patterns. Practise a one-minute show-and-tell. Share it with your teacher and complete your reflection."], ["Celebration Dialogue", "Teacher: What is your favourite page? Learner: I like my family page. Teacher: What can you say? Learner: This is my mum. I love my family. Teacher: What is your next goal? Learner: I will read more words."]].map(([title, passageScript], index) => { const readingId = `${unitId}-read${String(index + 1).padStart(2, "0")}`; return metadata({ readingId, unitId, sequence: index + 1, type: index === 0 ? "Story" : index === 1 ? "Project brief" : "Dialogue", title, genre: "Capstone", theme: source.theme, setting: "Grade 1 celebration", passageScript, audioRequired: true, audio: audioDescriptor(10, "readings", readingId) }); });
  const comprehension = Array.from({ length: 12 }, (_, index) => metadata({ questionId: `${unitId}-cq${String(index + 1).padStart(2, "0")}`, unitId, readingId: readings[index < 5 ? 0 : index < 9 ? 1 : 2].readingId, section: readings[index < 5 ? 0 : index < 9 ? 1 : 2].title, sequence: index + 1, questionType: "Oral, point or choose", question: ["What did Sagal find?", "What was her book called?", "Say one pattern Sagal used.", "How did people celebrate?", "Which page would you make?", "How many portfolio pieces should you choose?", "How many book pages should you make?", "How long is the show-and-tell?", "What happens after sharing?", "Which page did the learner like?", "What did the learner say about family?", "What was the next goal?"][index], correctAnswer: "Accept an accurate detail from the capstone text or a relevant personal response where invited.", explanation: "Prioritise listening, meaning and a confident response.", marks: 1, outcomeId: outcomes[index % outcomes.length].outcomeId, difficulty: "Cumulative supported" }));
  const grammar = grammarItems(source.config, unitId, 10, outcomes);
  const speaking = source.config.patterns.map((pattern, index) => { const speakingId = `${unitId}-speak${String(index + 1).padStart(2, "0")}`; return metadata({ speakingId, unitId, sequence: index + 1, activityType: index === 5 ? "Capstone presentation" : "Capstone rehearsal", title: `Capstone speaking ${index + 1}`, instructionsAndModelLines: `Use your book or portfolio picture to complete and say: ${pattern}`, recordingRequired: true, aiTutorPrompt: "With an adult present, listen to my short Grade 1 presentation and give one warm strength and one tiny next step.", outcomeId: outcomes[index].outcomeId, audio: audioDescriptor(10, "speaking", speakingId) }); });
  const writing = source.config.patterns.map((pattern, index) => metadata({ writingId: `${unitId}-write${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, practiceType: "Capstone page", title: `My First English World page ${index + 1}`, promptAndInstructions: `Draw, label and complete the pattern: ${pattern}`, modelText: pattern, sentenceStarter: pattern.split("___")[0], expectedLength: "One picture, 1-3 labels and one short pattern", successCriteria: "The picture and words match; I said the idea first; I used the model; I read or repeated it aloud", support: "Tracing, copying, word cards, dictation to an adult and oral recording are allowed.", extension: "Add a second sentence or question.", rubricId: "rub-g1-writing-v1", outcomeId: outcomes[index].outcomeId }));
  const activities = ["Portfolio treasure hunt", "Thirty-word picture sort", "Story retell with pictures", "Mini-book making", "One-minute rehearsal", "Celebration showcase"].map((title, index) => metadata({ activityId: `${unitId}-act${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, title, activityType: "Capstone workshop", instructionsAndItems: "Complete the named capstone stage with a teacher or caregiver, then show one piece of evidence.", answerSummary: "Accept complete, relevant Grade 1 evidence with adult support documented.", outcomeId: outcomes[index].outcomeId, deliveryMode: "Shared UI and live teacher session" }));
  const quizData = [["Complete: My name ___ Sagal.", "is | are | am | be", "is"], ["Complete: I ___ hop.", "can | is | are | the", "can"], ["Which is a complete sentence?", "This is a cat. | cat this | a cat | is cat", "This is a cat."], ["Which word names a colour?", "blue | bus | farm | hear", "blue"], ["Which word names a family member?", "mum | market | moon | mat", "mum"], ["Which action happens in a game?", "bounce | hospital | water | triangle", "bounce"], ["Which animal lives on a farm?", "goat | bus | pencil | river", "goat"], ["Which body part helps you hear?", "ears | eyes | hands | nose", "ears"], ["Which sentence tells a safe town action?", "Stop at the red light. | Run into the road. | Drop litter. | Push people.", "Stop at the red light."], ["What should you do before sharing your capstone?", "Practise and check it. | Hide every page. | Remove all words. | Skip the reflection.", "Practise and check it."]];
  const quizzes = quizData.map(([question, options, correctAnswer], index) => metadata({ quizId: `${unitId}-quiz01`, questionId: `${unitId}-quiz01-q${String(index + 1).padStart(2, "0")}`, unitId, quizTitle: "My First English World checkpoint", sequence: index + 1, questionType: "Multiple choice", question, options, correctAnswer, explanation: `The correct answer is ${correctAnswer}.`, marks: 1, outcomeId: outcomes[index % outcomes.length].outcomeId, difficulty: "Cumulative" }));
  const liveSessions = ["Launch and choose", "Review words through pictures", "Plan the six pages", "Make and improve", "Rehearse with confidence", "Celebrate and reflect"].map((title, index) => metadata({ liveSessionId: `${unitId}-live${String(index + 1).padStart(2, "0")}`, unitId, week: index < 3 ? 1 : 2, sessionWithinWeek: (index % 3) + 1, sessionNo: index + 1, title, durationMin: 30, beforeSession: "Bring the capstone folder, crayons and the current page.", agenda: "5 min hello; 5 min model; 12 min capstone work; 5 min share; 3 min celebrate", afterSession: "Show the new or improved capstone part to a caregiver.", outcomeIds: outcomes[index].outcomeId }));
  const answerKey = [...comprehension.map((item) => [item.questionId, "Comprehension", item.correctAnswer]), ...grammar.map((item) => [item.grammarId, "Language practice", item.ruleAndExamples]), ...activities.map((item) => [item.activityId, "Activity", item.answerSummary]), ...quizzes.map((item) => [item.questionId, "Quiz", `${item.correctAnswer}. ${item.explanation}`])].map(([contentId, contentType, answerOrGuidance], index) => metadata({ answerId: `${unitId}-answer-${String(index + 1).padStart(3, "0")}`, unitId, contentId, contentType, answerOrGuidance }));
  return { schemaVersion: "Ehel English Runtime v1.1", templateVersion: "Ehel English Content Template v1.1", dictionaryVersion: dictionary.schemaVersion, grade: { id: "g01", label: "Grade 1" }, subject: "English", term: { id: "t03", label: "Term 3" }, unit: { gradeId: "g01", subject: "English", termId: "t03", unitId, unitNo: 10, unitTitle: source.title, unitOverview: "Celebrate the learner's first year of English through a supported picture-and-word portfolio, six-page mini-book, one-minute presentation and next-goal reflection.", learningPath: "Choose favourite work.\nReview 30 useful words.\nListen to the capstone story and project brief.\nMake a six-page picture-and-word book.\nPractise and share a one-minute presentation.\nComplete the checkpoint and supported reflection.", origin: "Ehel Grade 1 curriculum capstone", reviewStatus: "Approved - curriculum reviewer", sourceFile: "Ehel English Content Template v1.1 Grade 1 capstone" }, visual: { image: "../grade-2/capstone-my-english-world.png", alt: "Young learners sharing picture-and-word English portfolios", lectureMode: "capstone-launch" }, vocabularyGroups: runtimes.map((runtime) => ({ id: `g1-capstone-u${runtime.unit.unitNo}`, number: runtime.unit.unitNo, title: runtime.unit.unitNo === 0 ? "Alphabet review" : `Review from Unit ${runtime.unit.unitNo}`, vocabularyIds: selectedLinks.filter((link) => link.groupId === `g1-capstone-u${runtime.unit.unitNo}`).map((link) => link.vocabularyId) })).filter((group) => group.vocabularyIds.length), dictionaryLinks: selectedLinks, outcomes, readings, comprehension, grammar, speaking, writing, activities, assignments: [metadata({ assignmentId: `${unitId}-assignment01`, unitId, title: "My First English World capstone", instructions: "Submit three favourite portfolio pieces, the six-page picture-and-word mini-book, a one-minute presentation or recording, and a supported reflection with one next goal.", submissionType: "Portfolio + mini-book + short presentation + reflection", marks: 48, outcomeIds: outcomes.map((outcome) => outcome.outcomeId).join(" | "), rubricIds: "rub-g1-writing-v1 | rub-g1-speaking-v1 | rub-g1-participation-v1" })], quizzes, liveSessions, teacherNotes: [metadata({ noteId: `${unitId}-note01`, unitId, noteType: "Capstone ownership", note: "Adult support may include reading instructions, scribing a dictated sentence and operating the recorder. Keep the learner's own choices, voice, drawing and language visible." }), metadata({ noteId: `${unitId}-note02`, unitId, noteType: "Celebration", note: "Treat presentation day as a warm celebration, not a high-pressure performance. Accept live, recorded or one-to-one sharing." })], answerKey, selfAssessment: outcomes.map((outcome, index) => metadata({ selfAssessmentId: `${unitId}-self${String(index + 1).padStart(2, "0")}`, unitId, sequence: index + 1, statement: outcome.learningOutcome.replace(/^Learner can /, "I can "), scale: "Not yet | With help | By myself", outcomeId: outcome.outcomeId })), rubrics: commonRubrics };
}

function createFinalAssessment(runtimes) {
  const assessmentId = "eng-g01-course-final-quiz-v1";
  const sourceRuntimes = runtimes.filter((runtime) => runtime.unit.unitNo <= 9);
  const questionGroups = [0, 5, 9].map((questionIndex) => sourceRuntimes.map((runtime) => runtime.quizzes[questionIndex]));
  const sections = [{ sectionId: "words-listening", title: "Words and listening", description: "Recognise useful Grade 1 words and sounds." }, { sectionId: "patterns-reading", title: "Patterns and reading", description: "Choose complete patterns and early-reading answers." }, { sectionId: "communication", title: "Communication and care", description: "Use English for safe, kind and meaningful choices." }].map((section, index) => ({ ...section, sequence: index + 1, questionCount: 10 }));
  const questions = questionGroups.flatMap((group, sectionIndex) => group.map((question, index) => {
    const sourceRuntime = sourceRuntimes[index];
    const questionId = `${assessmentId}-q${String(sectionIndex * 10 + index + 1).padStart(2, "0")}`;
    return { ...question, questionId, assessmentId, sequence: sectionIndex * 10 + index + 1, sectionId: sections[sectionIndex].sectionId, sourceUnitNo: sourceRuntime.unit.unitNo, sourceUnitId: sourceRuntime.unit.unitId, sourceUnitTitle: sourceRuntime.unit.unitTitle, curriculumArea: sectionIndex === 0 ? "Vocabulary and phonics" : sectionIndex === 1 ? "Language patterns" : "Communication", reviewRoute: `?unit=${sourceRuntime.unit.unitNo}#${sectionIndex === 0 ? "dictionary" : sectionIndex === 1 ? "grammar" : "activities"}`, audio: audioDescriptor("final", "questions", questionId), origin: "Ehel English Content Template v1.1 Grade 1 cumulative assessment", reviewStatus: "Approved - curriculum reviewer" };
  }));
  return { schemaVersion: "Ehel Grade 1 English Course Final Quiz v1.1", assessmentId, title: "Grade 1 English Final Course Quiz", shortTitle: "Final course quiz", description: "Complete three short, adult-supported sections after the Grade 1 capstone.", grade: { id: "g01", label: "Grade 1" }, subject: "English", placement: "After Unit 10 capstone", questionCount: 30, totalMarks: 30, passPercent: 80, attemptsAllowed: "Unlimited with adult-supported review", estimatedMinutes: 25, feedbackMode: "Immediate child-friendly feedback with final mastery report", sections, questions, reporting: { learner: "Total, section scores and suggested Unit review", teacher: "Attempt history, area scores and source-Unit scores" }, origin: "Ehel English Content Template v1.1 Grade 1 cumulative assessment", reviewStatus: "Approved - curriculum reviewer" };
}

function validate(runtime) {
  const expectedLive = runtime.unit.unitNo === 0 ? 30 : 6;
  for (const [key, count] of Object.entries({ grammar: 6, speaking: 6, writing: 6, activities: 6, quizzes: 10 })) if (runtime[key].length !== count) throw new Error(`${runtime.unit.unitId} ${key}: expected ${count}, found ${runtime[key].length}.`);
  if (runtime.liveSessions.length !== expectedLive) throw new Error(`${runtime.unit.unitId} liveSessions: expected ${expectedLive}, found ${runtime.liveSessions.length}.`);
  if (!runtime.dictionaryLinks.length) throw new Error(`${runtime.unit.unitId} has no vocabulary.`);
}

function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));
  const documents = documentMap(source);
  const grade2Dictionary = JSON.parse(fs.readFileSync(GRADE2_DICTIONARY_FILE, "utf8"));
  const alphabetSource = createAlphabetSource(documents);
  const regularSources = Object.entries(unitConfigs).map(([numberString, config]) => {
    const number = Number(numberString);
    return { number, unitId: `eng-g01-t0${Math.ceil(number / 3)}-u${String(number).padStart(2, "0")}`, title: config.title, theme: config.theme, config, guide: documents.get(`Unit ${number}/Unit ${number} - Teacher & Parent Guide.docx`), story: documents.get(`Unit ${number}/Unit ${number} - Story.docx`), activity: documents.get(`Unit ${number}/Unit ${number} - Child Activity Sheet.docx`), vocabularyGroups: extractVocabulary(documents.get(`Unit ${number}/Unit ${number} - Teacher & Parent Guide.docx`)) };
  });
  const unitSources = [alphabetSource, ...regularSources];
  const dictionary = buildDictionary(unitSources, grade2Dictionary);
  for (const links of dictionary.linksByUnit.values()) for (const link of links) link.masterWord = dictionary.master.entries.find((entry) => entry.dictionaryEntryId === link.dictionaryEntryId).displayWord;
  const runtimes = [createAlphabetRuntime(alphabetSource, dictionary.linksByUnit.get(0), documents), ...regularSources.map((unitSource) => createRegularRuntime(unitSource, dictionary.linksByUnit.get(unitSource.number)))];
  const capstone = createCapstone(runtimes, dictionary.master);
  const allRuntimes = [...runtimes, capstone];
  allRuntimes.forEach(validate);
  const finalAssessment = createFinalAssessment(allRuntimes);
  fs.mkdirSync(UNIT_DATA_DIR, { recursive: true });
  allRuntimes.forEach((runtime) => fs.writeFileSync(path.join(UNIT_DATA_DIR, `unit-${runtime.unit.unitNo}.json`), `${JSON.stringify(runtime, null, 2)}\n`));
  fs.writeFileSync(path.join(DATA_DIR, "master-dictionary.grade1.json"), `${JSON.stringify(dictionary.master, null, 2)}\n`);
  fs.writeFileSync(path.join(DATA_DIR, "course-final-quiz.json"), `${JSON.stringify(finalAssessment, null, 2)}\n`);
  const manifest = { schemaVersion: "Ehel Grade 1 English Course Manifest v1.1", grade: { id: "g01", label: "Grade 1" }, subject: "English", defaultUnit: 0, units: allRuntimes.map((runtime) => ({ number: runtime.unit.unitNo, id: runtime.unit.unitId, termId: runtime.term.id, title: runtime.unit.unitTitle, data: `./data/units/unit-${runtime.unit.unitNo}.json`, vocabularyCount: runtime.dictionaryLinks.length, reviewStatus: runtime.unit.unitNo === 10 ? "Approved v1.1 capstone" : "Approved v1.1" })), finalAssessment: { id: finalAssessment.assessmentId, title: finalAssessment.title, data: "./data/course-final-quiz.json", placement: finalAssessment.placement, questionCount: 30, passPercent: 80, reviewStatus: finalAssessment.reviewStatus } };
  fs.writeFileSync(path.join(DATA_DIR, "course-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Built Grade 1 English: ${manifest.units.length} modules, ${dictionary.master.entryCount} dictionary entries, ${finalAssessment.questionCount}-question final quiz.`);
}

main();
