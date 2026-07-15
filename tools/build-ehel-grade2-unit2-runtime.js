const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UNIT_ID = "eng-g02-t01-u02";
const INSPECT_FILE = path.join(
  ROOT,
  "outputs",
  "019f5d39-7fcd-7f23-a425-201fe8206eef",
  "Ehel-English-Content-Template-v1-Grade-2-Reference.xlsx.inspect.ndjson"
);
const VOCABULARY_FILE = path.join(
  ROOT,
  "src",
  "prototypes",
  "ehel-academy",
  "vocabulary",
  "grade2-vocabulary.json"
);
const AUDIO_CUES_FILE = path.join(
  ROOT,
  "src",
  "prototypes",
  "ehel-academy",
  "vocabulary",
  "audio",
  "grade2-audio-cues.json"
);
const V11_EXPANSION_FILE = path.join(
  ROOT,
  "src",
  "prototypes",
  "ehel-academy",
  "english",
  "grade-2",
  "unit-2",
  "data",
  "v1.1-expansion.json"
);
const OUTPUT_DIR = path.join(
  ROOT,
  "src",
  "prototypes",
  "ehel-academy",
  "english",
  "grade-2",
  "unit-2",
  "data"
);

function rowsFromWorkbook() {
  const result = {};
  const lines = fs.readFileSync(INSPECT_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const record = JSON.parse(line);
    if (record.kind !== "table" || !record.values?.[3]) continue;
    const headers = record.values[3];
    result[record.sheet] = record.values.slice(4).map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null]))
    );
  }
  return result;
}

function belongsToUnit(record) {
  return Object.values(record).some((value) =>
    String(value ?? "").split(" | ").includes(UNIT_ID)
  ) || record["Unit ID"] === UNIT_ID;
}

function camelCase(label) {
  return label
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase();
      return index === 0 ? lower : lower[0].toUpperCase() + lower.slice(1);
    })
    .join("");
}

function normalize(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [camelCase(key), value])
  );
}

const COMPREHENSION_CORRECTIONS = {
  "eng-g02-t01-u02-cq001": "They put out fires and rescue people from burning buildings.",
  "eng-g02-t01-u02-cq002": "Firefighters wear helmets, heavy boots, masks and heavy gloves.",
  "eng-g02-t01-u02-cq003": "Masks help firefighters breathe fresh air; gloves protect their hands from hot things.",
  "eng-g02-t01-u02-cq005": "Grandmas, grandpas, mums, dads and children live in the neighbourhood.",
  "eng-g02-t01-u02-cq006": "The neighbours are helping one another.",
  "eng-g02-t01-u02-cq013": "Amina lives on Warta Street, near the market.",
  "eng-g02-t01-u02-cq014": "Farah is a window cleaner. He uses a long pole to reach the high windows.",
  "eng-g02-t01-u02-cq015": "There are ten people on Hodan's bus.",
  "eng-g02-t01-u02-cq016": "The firefighters wear helmets, heavy boots, thick gloves and a mask.",
  "eng-g02-t01-u02-cq017": "Farah brought water, Hodan swept, Liban carried boxes, and the firefighters helped clean Idil's shop.",
  "eng-g02-t01-u02-cq018": "They chose to help her after finishing their own important jobs, showing kindness and teamwork.",
  "eng-g02-t01-u02-cq020": "Anyone can notice a need and help kindly; helping is not limited to a person's paid job.",
};

function correctMigrationRecord(sheet, record) {
  if (sheet === "Comprehension" && COMPREHENSION_CORRECTIONS[record.questionId]) {
    return {
      ...record,
      correctAnswer: COMPREHENSION_CORRECTIONS[record.questionId],
      explanation: "Curriculum review correction: answer aligned directly to the approved passage.",
    };
  }
  return record;
}

function dictionaryId(word, type) {
  const slug = String(word)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const typeSlug = String(type || "word").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `ehel-dict-en-${slug}-${typeSlug}-01`;
}

function buildDictionary(unitVocabulary, audioCues) {
  const entries = [];
  const links = [];
  const seen = new Map();

  for (const group of unitVocabulary.groups) {
    for (const [wordIndex, word] of group.words.entries()) {
      const key = `${word.word.toLowerCase()}|${word.type.toLowerCase()}`;
      let masterId = seen.get(key);
      if (!masterId) {
        masterId = dictionaryId(word.word, word.type);
        seen.set(key, masterId);
        entries.push({
          dictionaryEntryId: masterId,
          senseId: `${masterId}-sense-01`,
          language: "en-GB",
          lemma: word.word,
          displayWord: word.word,
          partOfSpeech: word.type,
          sourceType: word.sourceType,
          partOfSpeechDefinition: word.typeDefinition,
          canonicalMeaning: word.meaning,
          pronunciationText: word.pronunciation,
          audio: {
            normal: `../../../vocabulary/audio/grade2-bundles/${word.id}.mp3`,
            slow: `../../../vocabulary/audio/grade2-bundles/${word.id}.mp3`,
            cueStart: audioCues[word.id]?.word?.start ?? 0,
            cueEnd: audioCues[word.id]?.word?.end ?? null,
            slowPlaybackRate: 0.72,
            provider: "ElevenLabs",
            voiceId: "XfNU2rGpBa01ckF309OY",
          },
          status: "approved",
        });
      }

      const audioFile = path.join(
        ROOT,
        "src",
        "prototypes",
        "ehel-academy",
        "vocabulary",
        "audio",
        "grade2-bundles",
        `${word.id}.mp3`
      );
      if (!fs.existsSync(audioFile)) throw new Error(`Missing approved word audio: ${audioFile}`);

      links.push({
        vocabularyId: word.id,
        dictionaryEntryId: masterId,
        senseId: `${masterId}-sense-01`,
        gradeId: "g02",
        termId: "t01",
        unitId: UNIT_ID,
        groupId: group.id,
        groupTitle: group.title,
        sequence: wordIndex + 1,
        childMeaning: word.meaning,
        exampleSentence: word.example,
        practiceSentences: word.sentences,
        sentenceAudio: (audioCues[word.id]?.sentences || []).map((cue) => ({
          source: `../../../vocabulary/audio/grade2-bundles/${word.id}.mp3`,
          cueStart: cue.start,
          cueEnd: cue.end,
          provider: "ElevenLabs",
          voiceId: "XfNU2rGpBa01ckF309OY",
        })),
        sentenceStarter: word.starter,
        spellingPractice: word.word.split("").join(" - "),
        aiTutorPrompt: word.tutorPrompt,
        reviewStatus: "approved",
      });
    }
  }

  return {
    master: {
      schemaVersion: "Ehel Master Dictionary v1.0",
      language: "en-GB",
      generatedFrom: "Ehel English Content Template v1.1 - Grade 2 Unit 2",
      entryCount: entries.length,
      entries,
    },
    gradeLinks: links,
  };
}

function validateRuntime(runtime, master) {
  const requiredCollections = [
    "outcomes", "readings", "comprehension", "grammar", "speaking", "writing",
    "activities", "assignments", "quizzes", "liveSessions", "teacherNotes",
    "answerKey", "selfAssessment", "rubrics",
  ];
  for (const key of requiredCollections) {
    if (!Array.isArray(runtime[key]) || runtime[key].length === 0) {
      throw new Error(`Unit 2 runtime is missing required content: ${key}`);
    }
  }

  const minimums = {
    grammar: 6,
    speaking: 6,
    writing: 6,
    activities: 6,
    quizzes: 10,
    liveSessions: 6,
  };
  for (const [key, minimum] of Object.entries(minimums)) {
    if (runtime[key].length < minimum) {
      throw new Error(`Ehel English v1.1 requires at least ${minimum} ${key}; found ${runtime[key].length}.`);
    }
  }

  const masterIds = new Set(master.entries.map((entry) => entry.dictionaryEntryId));
  if (masterIds.size !== master.entries.length) throw new Error("Duplicate master dictionary IDs found.");
  for (const link of runtime.dictionaryLinks) {
    if (!masterIds.has(link.dictionaryEntryId)) {
      throw new Error(`Dictionary link has no master entry: ${link.vocabularyId}`);
    }
  }
}

function main() {
  const workbook = rowsFromWorkbook();
  const vocabulary = JSON.parse(fs.readFileSync(VOCABULARY_FILE, "utf8"));
  const audioCues = JSON.parse(fs.readFileSync(AUDIO_CUES_FILE, "utf8"));
  const expansion = JSON.parse(fs.readFileSync(V11_EXPANSION_FILE, "utf8"));
  const unitVocabulary = vocabulary.units.find((unit) => unit.number === 2);
  if (!unitVocabulary) throw new Error("Grade 2 Unit 2 vocabulary was not found.");

  const dictionary = buildDictionary(unitVocabulary, audioCues);
  const sheetMap = {
    Outcomes: "outcomes",
    Readings: "readings",
    Comprehension: "comprehension",
    Grammar: "grammar",
    Speaking: "speaking",
    Writing: "writing",
    Activities: "activities",
    Assignments: "assignments",
    Quizzes: "quizzes",
    "Live Sessions": "liveSessions",
    "Teacher Notes": "teacherNotes",
    "Answer Key": "answerKey",
    "Self Assessment": "selfAssessment",
  };

  const unit = normalize(workbook.Units.find((record) => record["Unit ID"] === UNIT_ID));
  unit.learningPath = [
    "Watch the teacher audiovisual lecture, then learn a few vocabulary words each day.",
    "Complete the six grammar practices on What/Who and actions happening now.",
    "Listen to the four readings, including The Helpers of Warta Street, and answer the comprehension questions.",
    "Complete all six speaking, six writing and six activity practices.",
    "Join three live teacher sessions each week for two weeks.",
    "Finish the ten-question quiz and student self-assessment.",
  ].join("\n");
  const runtime = {
    schemaVersion: "Ehel English Runtime v1.1",
    templateVersion: "Ehel English Content Template v1.1",
    dictionaryVersion: "Ehel Master Dictionary v1.0",
    generatedAt: new Date().toISOString(),
    grade: { id: "g02", label: "Grade 2" },
    subject: "English",
    term: { id: "t01", label: "Term 1" },
    unit,
    visual: {
      image: "../../../vocabulary/assets/unit-2-neighbours-jobs.png",
      alt: unitVocabulary.visual.alt,
      lectureVideo: "../../../vocabulary/media/unit-2-vocabulary-lecture.mp4",
      lecturePoster: "../../../vocabulary/media/unit-2-lecture-poster.jpg",
      lectureCaptions: "../../../vocabulary/media/unit-2-vocabulary-lecture.vtt",
    },
    vocabularyGroups: unitVocabulary.groups.map((group) => ({
      id: group.id,
      number: group.number,
      title: group.title,
      vocabularyIds: group.words.map((word) => word.id),
    })),
    dictionaryLinks: dictionary.gradeLinks,
    rubrics: workbook.Rubrics.filter((record) =>
      ["rub-writing-v1", "rub-speaking-v1"].includes(record["Rubric ID"])
    ).map(normalize),
  };

  for (const [sheet, key] of Object.entries(sheetMap)) {
    runtime[key] = (workbook[sheet] || [])
      .filter(belongsToUnit)
      .map(normalize)
      .map((record) => correctMigrationRecord(sheet, record));
  }

  const approvedMetadata = {
    origin: "Ehel English Content Template v1.1 curriculum expansion",
    reviewStatus: "Approved - curriculum reviewer",
    sourceFile: "Ehel English Content Template v1.1",
  };
  const withMetadata = (record) => ({ ...record, ...approvedMetadata });

  runtime.grammar = expansion.grammar.map((record) => ({
    ...withMetadata(record),
    audio: {
      source: `./media/audio/grammar/${record.grammarId}.mp3`,
      provider: expansion.audio.provider,
      voiceId: expansion.audio.voiceId,
    },
  }));
  runtime.speaking = [...runtime.speaking, ...expansion.speakingAdditions.map(withMetadata)]
    .sort((left, right) => left.sequence - right.sequence)
    .map((record) => ({
      ...record,
      audio: {
        source: `./media/audio/speaking/${record.speakingId}.mp3`,
        provider: expansion.audio.provider,
        voiceId: expansion.audio.voiceId,
      },
    }));
  runtime.writing = [...runtime.writing, ...expansion.writingAdditions.map(withMetadata)]
    .sort((left, right) => left.sequence - right.sequence);
  runtime.activities = [...runtime.activities, ...expansion.activityAdditions.map(withMetadata)]
    .sort((left, right) => left.sequence - right.sequence);
  runtime.quizzes = [...runtime.quizzes, ...expansion.quizAdditions.map((record) => ({
    ...withMetadata(record),
    unitId: UNIT_ID,
    quizTitle: "Good Neighbours and Jobs checkpoint",
  }))].sort((left, right) => left.sequence - right.sequence);
  runtime.liveSessions = expansion.liveSessions.map((record) => ({
    ...withMetadata(record),
    unitId: UNIT_ID,
  }));
  const newAnswerGuidance = [
    ...expansion.grammar
      .filter((record) => ["eng-g02-t01-u02-grammar03", "eng-g02-t01-u02-grammar04", "eng-g02-t01-u02-grammar05", "eng-g02-t01-u02-grammar06"].includes(record.grammarId))
      .map((record) => ({ contentId: record.grammarId, contentType: "Grammar practice", answerOrGuidance: record.practice })),
    ...expansion.speakingAdditions.map((record) => ({
      contentId: record.speakingId,
      contentType: "Speaking",
      answerOrGuidance: "Use the speaking rubric. Accept clear, relevant oral language that follows the model and fulfils every instruction.",
    })),
    ...expansion.writingAdditions.map((record) => ({
      contentId: record.writingId,
      contentType: "Writing",
      answerOrGuidance: `Use the writing rubric and this approved model: ${record.modelText}`,
    })),
    ...expansion.activityAdditions.map((record) => ({
      contentId: record.activityId,
      contentType: "Activity",
      answerOrGuidance: record.answerSummary,
    })),
    ...expansion.quizAdditions.map((record) => ({
      contentId: record.questionId,
      contentType: "Quiz",
      answerOrGuidance: `${record.correctAnswer}. ${record.explanation}`,
    })),
  ];
  runtime.answerKey = [
    ...runtime.answerKey,
    ...newAnswerGuidance.map((record, index) => ({
      ...withMetadata(record),
      answerId: `${UNIT_ID}-answer-v11-${String(index + 1).padStart(2, "0")}`,
      unitId: UNIT_ID,
    })),
  ];
  runtime.readings = runtime.readings.map((record) => ({
    ...record,
    audioRequired: true,
    audio: {
      source: `./media/audio/readings/${record.readingId}.mp3`,
      provider: expansion.audio.provider,
      voiceId: expansion.audio.voiceId,
    },
  }));

  validateRuntime(runtime, dictionary.master);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "master-dictionary.unit2.json"),
    JSON.stringify(dictionary.master, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "grade2-unit2.json"),
    JSON.stringify(runtime, null, 2) + "\n"
  );
  console.log(
    `Built Unit 2 runtime: ${dictionary.master.entryCount} master dictionary entries, ` +
    `${dictionary.gradeLinks.length} grade links, ${runtime.outcomes.length} outcomes.`
  );
}

main();
