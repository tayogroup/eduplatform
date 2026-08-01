#!/usr/bin/env node
// Expand authored intensive-English units into the runtime unit JSON the course
// app reads, and derive each level's master dictionary from them.
//
//   node tools/build-intensive-units.js            # every authored unit
//   node tools/build-intensive-units.js l1-u00     # one unit
//
// Authored source lives in inputs/ehel-english-intensive-source/authored/ and
// holds only what a human writes. Identifiers, sequence numbers, audio
// descriptors, the standard rubric set, the answer key and the dictionary
// entries are generated here.
//
// This also GATES the two things the authoring prompt insists on and a human
// reviewer cannot reliably eyeball:
//   * every Cambridge objective code resolves in the real framework data
//   * no outcome claims a CEFR level above the unit's declared band

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "inputs", "ehel-english-intensive-source");
const AUTHORED = path.join(SRC, "authored");
const COURSE_ROOT = path.join(ROOT, "src", "prototypes", "ehel-academy", "intensive-english");

const plan = JSON.parse(fs.readFileSync(path.join(SRC, "course-plan.json"), "utf8"));

const VOICE = { provider: "ElevenLabs", voiceId: "XfNU2rGpBa01ckF309OY", model: "eleven_multilingual_v2" };
const SCHEMA_VERSION = "Ehel Intensive English Runtime v1.0";
const REVIEW = "AI-assisted authoring — pending curriculum reviewer sign-off";
const CEFR_ORDER = ["A1", "A2", "B1", "B1+", "B2", "C1", "C2"];
const CEFR_SKILLS = ["Listening", "Reading", "Spoken interaction", "Spoken production", "Writing"];

// --- Cambridge objective index ----------------------------------------------
const cambridgeIndex = new Map();
for (const code of ["0058", "0861"]) {
  const file = path.join(ROOT, "src", "curriculum", `cambridge-english-${code}.json`);
  if (!fs.existsSync(file)) continue;
  const framework = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const objectives of Object.values(framework.objectivesByStage)) {
    for (const objective of objectives) cambridgeIndex.set(objective.code, objective);
  }
}

const audio = (category, id, levelNumber) => ({
  source: `./media/audio/level-${levelNumber}/${category}/${id}.mp3`,
  ...VOICE,
  slowPlaybackRate: 0.8,
  available: false,
  status: "Not yet generated",
});

// Course-wide rubric set: one standard, so a speaking task in Level 1 Unit 3 is
// marked the same way as one in Level 2 Unit 19.
const RUBRICS = [
  { target: "Speaking", criterion: "Pronunciation", level1: "Hard to follow; sound substitutions block meaning", level2: "Understandable with effort; some sounds still substituted", level3: "Clear; the difficult sounds are mostly right", level4: "Clear and confident; sounds and clusters accurate under pressure" },
  { target: "Speaking", criterion: "Fluency", level1: "Long pauses; each word retrieved separately", level2: "Halting but complete", level3: "Steady, with natural pauses", level4: "Comfortable pace; sounds like a conversation" },
  { target: "Speaking", criterion: "Interaction", level1: "Cannot respond without the written line", level2: "Answers the expected question only", level3: "Answers and asks back", level4: "Answers, asks back, and repairs a misunderstanding" },
  { target: "Writing", criterion: "Accuracy", level1: "Words present but not in English order", level2: "Articles and plurals frequently missing", level3: "Mostly accurate; occasional article slips", level4: "Accurate articles, plurals, order and spelling" },
  { target: "Writing", criterion: "Range", level1: "Uses one or two unit patterns", level2: "Uses a few unit patterns", level3: "Uses most of the unit's patterns appropriately", level4: "Uses the unit's patterns precisely and varies them" },
  { target: "Writing", criterion: "Purpose", level1: "Does not address the task", level2: "Partly addresses the task", level3: "Addresses the task clearly", level4: "Addresses the task and adds something of the learner's own" },
  { target: "Listening", criterion: "Understanding", level1: "Needs the text in front of them to follow", level2: "Understands when it is said slowly", level3: "Understands after one repeat", level4: "Understands first time at normal speed" },
  { target: "Reading", criterion: "Real-world documents", level1: "Cannot locate information in a form or notice", level2: "Finds information with help", level3: "Finds the information asked for", level4: "Finds it and acts on it correctly" },
];

const SELF_SCALE = "Not yet | A little | I can do this | I could show someone else";

const slug = (value) => String(value).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const problems = [];

function buildUnit(authored) {
  const level = plan.levels.find((item) => item.number === authored.level);
  if (!level) throw new Error(`Unknown level ${authored.level}`);
  const planUnit = level.units.find((item) => item.number === authored.unit);
  if (!planUnit) throw new Error(`Unit ${authored.unit} is not in the plan for level ${authored.level}`);

  const where = `L${authored.level} U${authored.unit}`;
  const band = (level.cefrBands || []).find((item) => authored.unit >= item.units[0] && authored.unit <= item.units[1]);
  const declaredBand = authored.cefrBand || band?.cefr || (level.cefr || [])[0];
  const bandRank = CEFR_ORDER.indexOf(declaredBand);

  const lid = level.id;
  const uid = `ien-${lid}-u${String(authored.unit).padStart(2, "0")}`;
  const id = (kind, n) => `${uid}-${kind}${String(n).padStart(2, "0")}`;
  const sourceRef = (planUnit.source || []).map((s) => s.units.map((n) => `Grade ${s.grade} Unit ${n}`).join(", ")).join("; ");

  // --- outcomes: the specification, and where both frameworks are checked ---
  const outcomes = (authored.outcomes || []).map((outcome, n) => {
    const codes = outcome.cambridge || [];
    for (const code of codes) {
      if (!cambridgeIndex.has(code)) problems.push(`${where}: Cambridge code ${code} does not exist in the framework data.`);
    }
    if (outcome.cefrSkill && !CEFR_SKILLS.includes(outcome.cefrSkill)) {
      problems.push(`${where}: outcome ${n + 1} has cefrSkill "${outcome.cefrSkill}" — must be one of ${CEFR_SKILLS.join(", ")}.`);
    }
    const level_ = outcome.cefrLevel || declaredBand;
    if (CEFR_ORDER.indexOf(level_) > bandRank) {
      problems.push(`${where}: outcome ${n + 1} claims CEFR ${level_}, above the unit's band ${declaredBand}.`);
    }
    if (outcome.cefrDescriptor && !/^I can\b/i.test(outcome.cefrDescriptor)) {
      problems.push(`${where}: outcome ${n + 1} descriptor must start "I can".`);
    }
    return {
      outcomeId: id("lo", n + 1),
      unitId: uid,
      sequence: n + 1,
      learningOutcome: outcome.outcome,
      evidenceOfLearning: outcome.evidence,
      bloomLevel: outcome.bloom,
      cefr: { level: level_, skill: outcome.cefrSkill, descriptor: outcome.cefrDescriptor },
      cambridgeObjectives: codes,
      cambridgeStages: [...new Set(codes.map((code) => cambridgeIndex.get(code)?.stage).filter(Boolean))],
      origin: "Authored for the intensive course",
      reviewStatus: REVIEW,
      sourceFile: sourceRef,
    };
  });
  const skills = [...new Set(outcomes.map((outcome) => outcome.cefr.skill).filter(Boolean))];
  if (skills.length < 2) problems.push(`${where}: outcomes cover ${skills.length} CEFR skill(s); at least two are required.`);
  const outcomeAt = (n) => outcomes[Math.min(Math.max(n, 0), outcomes.length - 1)]?.outcomeId || "";

  // --- vocabulary ----------------------------------------------------------
  let wordIndex = 0;
  const vocabularyGroups = [];
  const dictionaryLinks = [];
  for (const [groupNumber, group] of (authored.groups || []).entries()) {
    const groupId = `${uid}-g${groupNumber + 1}-${slug(group.title)}`;
    const vocabularyIds = [];
    for (const word of group.words) {
      wordIndex += 1;
      const vocabularyId = `${uid}-w${String(wordIndex).padStart(2, "0")}-${slug(word.w)}`;
      vocabularyIds.push(vocabularyId);
      if ((word.practice || []).length !== 5) problems.push(`${where}: "${word.w}" has ${(word.practice || []).length} practice sentences; 5 required.`);
      dictionaryLinks.push({
        vocabularyId,
        dictionaryEntryId: `ehel-dict-en-${slug(word.w)}-${slug(word.pos || "word")}-01`,
        unitId: uid,
        levelId: lid,
        groupId,
        groupTitle: group.title,
        sequence: wordIndex,
        masterWord: String(word.w).toLowerCase(),
        displayWord: word.w,
        partOfSpeech: word.pos || "",
        childMeaning: word.meaning,
        exampleSentence: word.example,
        practiceSentences: word.practice || [],
        sentenceAudio: (word.practice || []).map((_, n) => audio("vocabulary", `${vocabularyId}-s${n + 1}`, level.number)),
        meaningAudio: audio("vocabulary", `${vocabularyId}-meaning`, level.number),
        spellingPractice: word.spelling || String(word.w).split("").join(" - "),
        sentenceStarter: word.starter || "",
        aiTutorPrompt: word.tutor,
        reviewStatus: REVIEW,
      });
    }
    vocabularyGroups.push({ id: groupId, number: groupNumber + 1, title: group.title, vocabularyIds });
  }

  const list = (key, kind, map) => (authored[key] || []).map((item, n) => ({
    unitId: uid, sequence: n + 1, origin: "Authored for the intensive course", reviewStatus: REVIEW, sourceFile: sourceRef,
    ...map(item, n, id(kind, n + 1)),
  }));

  const readings = list("readings", "read", (item, n, rid) => ({
    readingId: rid, type: item.type, title: item.title, genre: item.genre || "", setting: item.setting || "",
    documentType: item.documentType || "", passageScript: item.passage, audioRequired: true,
    audio: audio("readings", rid, level.number),
  }));
  if (!readings.some((reading) => reading.documentType)) {
    problems.push(`${where}: no reading is marked as a real-world document (set "documentType").`);
  }

  const grammar = list("grammar", "grammar", (item, n, gid) => {
    // A rule followed straight by an exercise is a lesson with the teaching
    // removed. With no teacher in the room, the worked example IS the teaching.
    if (!item.workedExample) problems.push(`${where}: grammar "${item.title}" has no workedExample — a self-teaching unit must show one done before asking for the rest.`);
    if (item.practice && !item.answers) problems.push(`${where}: grammar "${item.title}" has practice but no answer key.`);
    const longest = Math.max(String(item.explanation || "").length, String(item.rule || "").length);
    if (longest > 900) problems.push(`${where}: grammar "${item.title}" is ${longest} characters — too long for one carousel screen.`);
    return {
      grammarId: gid, conceptId: `${uid}-concept-${slug(item.title)}`, practiceType: item.practiceType || "Guided recognition",
      title: item.title, explanation: item.explanation, ruleAndExamples: item.rule,
      // A card that only compares patterns taught elsewhere. The duplication
      // check reads this, so it must survive the build.
      ...(item.contrast ? { contrast: true } : {}),
      workedExample: item.workedExample, commonMistake: item.mistake, memoryTip: item.tip,
      practice: item.practice, answerKey: item.answers,
      outcomeId: outcomeAt((item.outcome || 1) - 1), audio: audio("grammar", gid, level.number),
    };
  });

  const comprehension = list("comprehension", "cq", (item, n, qid) => ({
    questionId: qid, readingId: item.reading ? id("read", item.reading) : "", section: item.section,
    questionType: item.type || "Short answer", question: item.q, correctAnswer: item.a, explanation: item.why,
    marks: item.marks || 1, difficulty: item.difficulty || "Core", outcomeId: outcomeAt((item.outcome || 1) - 1),
  }));

  const speaking = list("speaking", "speak", (item, n, sid) => ({
    speakingId: sid, activityType: item.type || "Speaking practice", title: item.title,
    instructionsAndModelLines: item.instructions,
    recordingRequired: item.recording !== false, aiTutorPrompt: item.tutor,
    outcomeId: outcomeAt((item.outcome || 1) - 1), audio: audio("speaking", sid, level.number),
  }));

  const writing = list("writing", "write", (item, n, wid) => ({
    writingId: wid, title: item.title, promptAndInstructions: item.prompt,
    modelText: item.model, sentenceStarter: item.starter || "", expectedLength: item.length,
    successCriteria: item.criteria, support: item.support, extension: item.extension,
    rubricId: "rub-writing-v1", outcomeId: outcomeAt((item.outcome || 1) - 1),
  }));

  const activities = list("activities", "act", (item, n, aid) => {
    if (!item.answers) problems.push(`${where}: activity "${item.title}" has no answer key — with no teacher, an unanswerable exercise is a dead end.`);
    return {
      activityId: aid, title: item.title, activityType: item.type, instructionsAndItems: item.instructions,
      answerSummary: item.answers, soloPath: item.solo || "", deliveryMode: item.mode || "Independent",
      outcomeId: outcomeAt((item.outcome || 1) - 1),
    };
  });

  const quizzes = list("quizzes", "q", (item, n, qid) => {
    if (!item.options.includes(item.a)) problems.push(`${where}: quiz ${n + 1} answer is not among its options.`);
    if (new Set(item.options).size !== item.options.length) problems.push(`${where}: quiz ${n + 1} has duplicate options.`);
    return {
      quizId: `${uid}-quiz-v1`, questionId: qid, quizTitle: `${authored.title} — checkpoint`,
      questionType: "Multiple choice", question: item.q, options: item.options.join(" | "),
      correctAnswer: item.a, explanation: item.why, marks: 1, difficulty: item.difficulty || "Core",
      outcomeId: outcomeAt((item.outcome || 1) - 1),
    };
  });
  // Answer position must be distributed, or a learner scores by never reading.
  const positions = (authored.quizzes || []).map((item) => item.options.indexOf(item.a));
  for (const slot of new Set(positions)) {
    const share = positions.filter((p) => p === slot).length / positions.length;
    if (positions.length >= 5 && share > 0.4) problems.push(`${where}: ${Math.round(share * 100)}% of quiz answers sit in position ${slot + 1} (max 40%).`);
  }

  // No live sessions. The course must be completable with nobody else present,
  // so there is no session plan to write and nothing may depend on one.
  if ((authored.live || []).length) {
    problems.push(`${where}: this course has no live sessions — a task that needs another person must instead state a solo path.`);
  }


  // --- self-teaching gates --------------------------------------------------
  // Everything a teacher would supply has to be inside the unit, so a sentence
  // that points at one is a hole the learner cannot get out of.
  const TEACHER_REFERENCE = /(your (teacher|trainer|tutor will)|the teacher will|in class|ask your teacher|during the lesson|your instructor)/i;
  const learnerFacing = [
    ...grammar.flatMap((item) => [item.explanation, item.ruleAndExamples, item.workedExample, item.practice, item.memoryTip, item.commonMistake]),
    ...speaking.map((item) => item.instructionsAndModelLines),
    ...writing.flatMap((item) => [item.promptAndInstructions, item.support, item.extension, item.successCriteria]),
    ...activities.flatMap((item) => [item.instructionsAndItems, item.answerSummary]),
    ...comprehension.map((item) => item.explanation),
    ...quizzes.map((item) => item.explanation),
    String(authored.overview || ""), String(authored.lectureScript || ""), ...(authored.learningPath || []),
    ...readings.map((item) => item.passageScript), ...comprehension.map((item) => item.question),
  ].filter(Boolean);
  for (const text of learnerFacing) {
    const hit = String(text).match(TEACHER_REFERENCE);
    if (hit) problems.push(`${where}: learner-facing text points at a teacher ("${hit[0]}") — this course has none.`);
  }


  // The course carries no nationality. A currency symbol is the easiest way to
  // smuggle one in, and it happened once already before this check existed.
  const CURRENCY = /[£$€¥₹₽₩₪₦]/;
  for (const text of learnerFacing) {
    const hit = String(text).match(CURRENCY);
    if (hit) problems.push(`${where}: learner-facing text contains the currency symbol "${hit[0]}" — write the amount without a symbol.`);
  }

  // Every quiz item's explanation is the only feedback a lone learner gets.
  for (const [n, item] of quizzes.entries()) {
    if (!item.explanation) problems.push(`${where}: quiz ${n + 1} has no explanation — it is the only feedback available.`);
  }

  const teacherNotes = list("teacherNotes", "note", (item, n, nid) => ({
    teacherNoteId: nid, noteType: item.type, note: item.note, visibility: "Teacher only",
  }));

  const selfAssessment = list("selfAssessment", "self", (item, n, sid) => ({
    selfAssessmentId: sid, statement: item.statement,
    scale: SELF_SCALE, outcomeId: outcomeAt(n),
  }));

  const rubrics = RUBRICS.map((rubric, n) => ({
    rubricId: `rub-${slug(rubric.target)}-v1`, target: rubric.target,
    criterionId: `rub-${slug(rubric.target)}-v1-c${String(n + 1).padStart(2, "0")}`,
    criterion: rubric.criterion, level1: rubric.level1, level2: rubric.level2,
    level3: rubric.level3, level4: rubric.level4, maximumMarks: 4,
    origin: "Ehel Intensive English approved rubric v1", reviewStatus: REVIEW,
  }));

  const assignments = authored.assignment ? [{
    assignmentId: id("assign", 1), unitId: uid, title: authored.assignment.title,
    instructions: authored.assignment.instructions, submissionType: authored.assignment.submissionType,
    marks: authored.assignment.marks, outcomeIds: outcomes.map((o) => o.outcomeId).join(", "),
    rubricIds: [...new Set(rubrics.map((r) => r.rubricId))].join(", "),
    origin: "Authored for the intensive course", reviewStatus: REVIEW, sourceFile: sourceRef,
  }] : [];

  const answerKey = [
    ...comprehension.map((item) => ({ contentId: item.questionId, contentType: "Comprehension", answerOrGuidance: item.correctAnswer })),
    ...grammar.filter((item) => item.answerKey).map((item) => ({ contentId: item.grammarId, contentType: "Grammar practice", answerOrGuidance: item.answerKey })),
    ...activities.filter((item) => item.answerSummary).map((item) => ({ contentId: item.activityId, contentType: "Activity", answerOrGuidance: item.answerSummary })),
    ...quizzes.map((item) => ({ contentId: item.questionId, contentType: "Quiz", answerOrGuidance: `${item.correctAnswer} — ${item.explanation}` })),
  ].map((entry, n) => ({ answerId: id("ans", n + 1), unitId: uid, ...entry, origin: "Derived from the authored item", reviewStatus: REVIEW }));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString().slice(0, 10),
    subject: "English",
    course: "Ehel Intensive English",
    level: { id: lid, number: level.number, label: level.label, cefr: level.cefr },
    unit: {
      levelId: lid, unitId: uid, unitNo: authored.unit, unitTitle: authored.title,
      cefr: { band: declaredBand, level: level.cefr, skills },
      unitOverview: authored.overview,
      learningPath: (authored.learningPath || []).join("\n"),
      origin: `Compressed from ${sourceRef}`,
      sourceFile: sourceRef,
      reviewStatus: REVIEW,
    },
    visual: { image: authored.image || "", alt: authored.imageAlt || "", lectureScript: authored.lectureScript || "", lectureVideo: "", lecturePoster: "", lectureCaptions: "" },
    vocabularyGroups, dictionaryLinks, readings, comprehension, grammar, speaking, writing,
    activities, assignments, quizzes, teacherNotes, answerKey, selfAssessment,
    rubrics, outcomes,
    frameworks: {
      cefr: { band: declaredBand, levelCefr: level.cefr, skillsCovered: skills },
      cambridge: {
        codes: [...new Set(outcomes.flatMap((o) => o.cambridgeObjectives))],
        stages: [...new Set(outcomes.flatMap((o) => o.cambridgeStages))].sort((a, b) => a - b),
      },
    },
  };
}



// The card-title check below cannot see a re-teach that uses different words —
// "countable and uncountable nouns" and "how much and how many" are the same
// lesson with no shared vocabulary. So the PLAN is scanned too, and reported as
// a warning rather than a failure, because some overlap is deliberate
// progression and only a human can tell which.
function warnPlanOverlap() {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "your", "not", "are", "how", "what", "when", "them", "they", "than", "into"]);
  const keywords = (text) => new Set(String(text).toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w)));
  const all = [];
  for (const level of plan.levels) {
    for (const unit of level.units) {
      for (const pattern of unit.patterns || []) all.push({ where: `L${level.number}U${unit.number}`, unit: `${level.number}.${unit.number}`, contrast: Boolean(unit.contrast), pattern, words: keywords(pattern) });
    }
  }
  const warnings = [];
  const allowed = [];
  for (let a = 0; a < all.length; a += 1) {
    for (let b = a + 1; b < all.length; b += 1) {
      if (all[a].unit === all[b].unit) continue;
      const shared = [...all[a].words].filter((w) => all[b].words.has(w));
      if (shared.length < 2) continue;
      const line = `  ${all[a].where} "${all[a].pattern}" ~ ${all[b].where} "${all[b].pattern}"  (${shared.join(", ")})`;
      // A contrast unit compares patterns taught elsewhere instead of teaching
      // them again. Listed separately so the review list stays worth reading.
      if (all[a].contrast || all[b].contrast) allowed.push(line);
      else warnings.push(line);
    }
  }
  if (allowed.length) {
    console.log(`\nplan contrasts allowed (${allowed.length}) — these compare, they do not re-teach:`);
    for (const line of allowed) console.log(line);
  }
  if (warnings.length) {
    console.log(`
plan overlaps to review (${warnings.length}) — a pattern should be taught once:`);
    for (const line of warnings) console.log(line);
  }
}


// --- duplicate vocabulary across units ---------------------------------------
// A word is taught once, like a pattern. Checking this by hand before authoring
// is exactly the kind of thing that slips — "receipt" reached the build in two
// units because a hand-written check listed a word that was not used and missed
// one that was.
function checkVocabularyDuplication() {
  for (const level of plan.levels) {
    const dir = path.join(COURSE_ROOT, `level-${level.number}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    const seen = new Map();
    const units = fs.readdirSync(dir).filter((n) => n.endsWith(".json"))
      .map((n) => JSON.parse(fs.readFileSync(path.join(dir, n), "utf8")))
      .sort((a, b) => a.unit.unitNo - b.unit.unitNo);
    for (const unit of units) {
      for (const link of unit.dictionaryLinks) {
        if (seen.has(link.masterWord)) {
          problems.push(`L${level.number}: "${link.masterWord}" is taught in unit ${seen.get(link.masterWord)} and again in unit ${unit.unit.unitNo}. A word is taught once.`);
        } else {
          seen.set(link.masterWord, unit.unit.unitNo);
        }
      }
    }
  }
}

// --- cross-unit pattern duplication ------------------------------------------
// The whole 81-to-40 compression rests on teaching each pattern exactly once, and
// nothing else checks it: conceptId carries the unit prefix, so two units can
// teach the same thing and still look distinct. This compares the grammar card
// titles across every authored unit in a level.
function checkPatternDuplication() {
  // Structural words that appear in card TITLES without carrying meaning —
    // "the verb comes first" and "the describing word comes first" are unrelated
    // patterns that share only scaffolding.
    const stop = new Set(["the", "and", "for", "with", "that", "this", "you", "your", "not", "are", "its", "how", "what", "when", "them", "they", "than", "into", "cannot",
      "comes", "first", "goes", "word", "words", "using", "right", "place", "saying", "ways", "three", "four", "both"]);
  const keywords = (title) => new Set(String(title).toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w)));
  const contrasts = new Set();
  for (const level of plan.levels) {
    const dir = path.join(COURSE_ROOT, `level-${level.number}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    const cards = [];
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      for (const card of unit.grammar) cards.push({ unit: unit.unit.unitNo, title: card.title, contrast: Boolean(card.contrast), words: keywords(card.title) });
    }
    for (let a = 0; a < cards.length; a += 1) {
      for (let b = a + 1; b < cards.length; b += 1) {
        if (cards[a].unit === cards[b].unit) continue; // progression within one unit is deliberate
        const shared = [...cards[a].words].filter((w) => cards[b].words.has(w));
        if (shared.length < 2) continue; // not a collision at all, contrast flag or not
        // A card marked contrast compares patterns taught elsewhere instead of
        // teaching them again. Allowed, but listed, so it is never silent.
        if (cards[a].contrast || cards[b].contrast) { contrasts.add(`unit ${cards[a].unit} "${cards[a].title}" ~ unit ${cards[b].unit} "${cards[b].title}" (${shared.join(", ")})`); continue; }
        {
          problems.push(`L${level.number}: unit ${cards[a].unit} "${cards[a].title}" and unit ${cards[b].unit} "${cards[b].title}" look like the same pattern (${shared.join(", ")}). A pattern is taught once.`);
        }
      }
    }
  }
  if (contrasts.size) {
    console.log(`\ncontrast cards allowed (${contrasts.size}) — these compare, they do not re-teach:`);
    for (const line of contrasts) console.log(`  ${line}`);
  }
}

// --- run ---------------------------------------------------------------------
const only = process.argv[2];
if (!fs.existsSync(AUTHORED)) { console.error(`No authored units at ${path.relative(ROOT, AUTHORED)}`); process.exit(1); }
const files = fs.readdirSync(AUTHORED).filter((name) => name.endsWith(".json") && (!only || name === `${only}.json`)).sort();
if (!files.length) { console.error(only ? `No authored unit named ${only}` : "No authored units found."); process.exit(1); }

const built = [];
for (const file of files) {
  const authored = JSON.parse(fs.readFileSync(path.join(AUTHORED, file), "utf8"));
  const unit = buildUnit(authored);
  const dir = path.join(COURSE_ROOT, `level-${authored.level}`, "data", "units");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `unit-${authored.unit}.json`), JSON.stringify(unit, null, 1), "utf8");
  built.push({ file, authored, unit });
  console.log(`${file} -> level-${authored.level}/data/units/unit-${authored.unit}.json`);
  console.log(`   CEFR ${unit.unit.cefr.band} · skills: ${unit.unit.cefr.skills.join(", ")}`);
  console.log(`   ${unit.dictionaryLinks.length} words · ${unit.grammar.length} patterns · ${unit.quizzes.length} quiz items · Cambridge ${unit.frameworks.cambridge.codes.length} codes (stages ${unit.frameworks.cambridge.stages.join(", ")})`);
}

checkVocabularyDuplication();
checkPatternDuplication();
warnPlanOverlap();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`\n${built.length} unit(s) built, gate green.`);

// --- manifests + master dictionary -------------------------------------------
// Regenerated from whatever is on disk, so a single-unit rebuild never shrinks a
// level, and the manifest never claims content that has not been authored.
const levelSummaries = plan.levels.map((level) => ({
  number: level.number, id: level.id, label: level.label,
  cefr: level.cefr || [], unitCount: level.units.length,
  status: level.units.length ? "Open" : (level.status || "Planned"),
}));

for (const level of plan.levels) {
  if (!level.units.length) continue;
  const dataDir = path.join(COURSE_ROOT, `level-${level.number}`, "data");
  const unitsDir = path.join(dataDir, "units");
  fs.mkdirSync(unitsDir, { recursive: true });
  const onDisk = new Map();
  for (const name of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json"))) {
    const content = JSON.parse(fs.readFileSync(path.join(unitsDir, name), "utf8"));
    onDisk.set(content.unit.unitNo, content);
  }

  const units = level.units.map((planUnit) => {
    const content = onDisk.get(planUnit.number);
    return {
      number: planUnit.number,
      id: `ien-${level.id}-u${String(planUnit.number).padStart(2, "0")}`,
      title: planUnit.title,
      data: `./data/units/unit-${planUnit.number}.json`,
      cefr: content?.unit.cefr.band || (level.cefrBands || []).find((b) => planUnit.number >= b.units[0] && planUnit.number <= b.units[1])?.cefr || "",
      patterns: (planUnit.patterns || []).length,
      source: (planUnit.source || []).map((s) => s.units.map((n) => `G${s.grade}U${n}`).join(",")).join(" "),
      vocabularyCount: content?.dictionaryLinks.length || 0,
      status: content ? content.unit.reviewStatus : "Planned — not yet authored",
    };
  });

  const entries = new Map();
  for (const content of [...onDisk.values()].sort((a, b) => a.unit.unitNo - b.unit.unitNo)) {
    for (const link of content.dictionaryLinks) {
      if (entries.has(link.dictionaryEntryId)) continue;
      entries.set(link.dictionaryEntryId, {
        dictionaryEntryId: link.dictionaryEntryId, language: "en-GB",
        lemma: link.masterWord, displayWord: link.displayWord,
        partOfSpeech: link.partOfSpeech, canonicalMeaning: link.childMeaning,
        firstTaughtIn: link.unitId,
        audio: { normal: link.meaningAudio.source, slow: link.meaningAudio.source, slowPlaybackRate: 0.8, ...VOICE, available: false },
        status: REVIEW,
      });
    }
  }

  fs.writeFileSync(path.join(dataDir, "course-manifest.json"), JSON.stringify({
    schemaVersion: "Ehel Intensive English Course Manifest v1.0",
    course: "Ehel Intensive English",
    subject: "English",
    audience: plan.audience,
    frameworks: plan.frameworks,
    level: {
      number: level.number, id: level.id, label: level.label,
      cefr: level.cefr, cefrName: level.cefrName, cefrBands: level.cefrBands,
      exitDescriptor: level.exitDescriptor, exitAssessment: level.exitAssessment,
    },
    levels: levelSummaries,
    defaultUnit: level.defaultUnit,
    units,
  }, null, 1), "utf8");

  fs.writeFileSync(path.join(dataDir, `master-dictionary.level${level.number}.json`), JSON.stringify({
    schemaVersion: "Ehel Intensive English Master Dictionary v1.0",
    language: "en-GB", levelId: level.id, levelLabel: level.label,
    entryCount: entries.size, entries: [...entries.values()],
  }, null, 1), "utf8");

  const authoredCount = onDisk.size;
  console.log(`level ${level.number}: manifest with ${units.length} units (${authoredCount} authored), dictionary ${entries.size} entries`);
}
