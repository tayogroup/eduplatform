#!/usr/bin/env node
// Assemble a ready-to-run authoring prompt for one unit of the Ehel Intensive
// English course.
//
//   node tools/build-intensive-prompt.js <level> <unit> [--out <path>] [--full]
//   node tools/build-intensive-prompt.js 1 0
//   node tools/build-intensive-prompt.js 2 10 --out /tmp/l2u10.md
//
// docs/ehel-intensive-english-authoring-prompt.md is a template with
// eight slots, two of which are hundreds of kilobytes of JSON. Nobody fills that
// by hand. This fills them all from the repository and writes one file you paste
// into a model call.
//
// Source units are TRIMMED by default: audio descriptors, provenance fields and
// derived data are stripped, because they are noise to an authoring model and
// they are what makes the source files large. Pass --full to keep everything.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PLAN = path.join(ROOT, "inputs", "ehel-english-intensive-source", "course-plan.json");
const TEMPLATE = path.join(ROOT, "docs", "ehel-intensive-english-authoring-prompt.md");
const CANON = path.join(ROOT, "docs", "ehel-intensive-english-canon.md");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const CURRICULUM = path.join(ROOT, "src", "curriculum");

// --- arguments ---------------------------------------------------------------
const args = process.argv.slice(2);
const levelNumber = Number(args[0]);
const unitNumber = Number(args[1]);
const full = args.includes("--full");
const outFlag = args.indexOf("--out");
if (!Number.isInteger(levelNumber) || !Number.isInteger(unitNumber)) {
  console.error("Usage: node tools/build-intensive-prompt.js <level> <unit> [--out <path>] [--full]");
  process.exit(2);
}

const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const level = plan.levels.find((item) => item.number === levelNumber);
if (!level) { console.error(`No level ${levelNumber} in the course plan.`); process.exit(1); }
if (!level.units.length) {
  console.error(`${level.label} has no units to author.\n  ${level.status || ""}\n  ${level.blockedBy || ""}`);
  process.exit(1);
}
const unit = level.units.find((item) => item.number === unitNumber);
if (!unit) {
  console.error(`No unit ${unitNumber} in ${level.label}. Units are: ${level.units.map((u) => u.number).join(", ")}`);
  process.exit(1);
}

// --- CEFR band for this unit -------------------------------------------------
const band = (level.cefrBands || []).find((item) => unitNumber >= item.units[0] && unitNumber <= item.units[1]);
const cefrBand = band ? band.cefr : (level.cefr || [])[0] || "";

// --- already-taught: every earlier unit in this level, and every level below ---
const alreadyTaught = [];
for (const other of plan.levels) {
  if (other.number > levelNumber) continue;
  for (const otherUnit of other.units) {
    if (other.number === levelNumber && otherUnit.number >= unitNumber) continue;
    for (const pattern of otherUnit.patterns || []) {
      alreadyTaught.push({ pattern, taughtIn: `Level ${other.number} Unit ${otherUnit.number} — ${otherUnit.title}` });
    }
  }
}

// --- source units -------------------------------------------------------------
// Everything an author needs to compress, and nothing that only exists to drive
// the player. Audio descriptors alone are most of a source unit's bytes.
const DROP_KEYS = new Set([
  "audio", "sentenceAudio", "meaningAudio", "lectureVideo", "lecturePoster", "lectureCaptions",
  "origin", "reviewStatus", "sourceFile", "generatedAt", "schemaVersion", "templateVersion",
  "dictionaryVersion", "senseId", "dictionaryEntryId", "spellingPractice",
]);
function trim(value) {
  if (Array.isArray(value)) return value.map(trim);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (DROP_KEYS.has(key)) continue;
    out[key] = trim(item);
  }
  return out;
}

// A unit that compresses six source units cannot paste six whole source units —
// that is two million characters, past any context window. But it does not need
// to. The author REUSES the vocabulary, the grammar and the objectives, and
// REPLACES every reading and every task with adult equivalents. So the reused
// parts go in full and the replaced parts go in as a summary: enough to see what
// was covered, not the child text that is being thrown away.
const firstWords = (text, count) => {
  const words = String(text || "").trim().split(/\s+/);
  return words.length <= count ? words.join(" ") : `${words.slice(0, count).join(" ")}…`;
};

function prepareSource(raw) {
  if (full) {
    const body = trim(raw);
    delete body.answerKey;
    delete body.rubrics;
    return body;
  }
  return {
    unitTitle: raw.unit.unitTitle,
    unitOverview: raw.unit.unitOverview,
    // --- reused in full -------------------------------------------------
    vocabularyGroups: (raw.vocabularyGroups || []).map((group) => ({ title: group.title, size: group.vocabularyIds?.length || 0 })),
    vocabulary: (raw.dictionaryLinks || []).map((link) => ({
      word: link.masterWord || link.vocabularyId,
      group: link.groupTitle,
      meaning: link.childMeaning,
      example: link.exampleSentence,
      // Two of the five: enough to show how the word behaves, without carrying
      // five child sentences that are all being rewritten anyway.
      practice: (link.practiceSentences || []).slice(0, 2),
    })),
    grammar: (raw.grammar || []).map((lesson) => ({
      title: lesson.title,
      practiceType: lesson.practiceType,
      explanation: lesson.explanation,
      ruleAndExamples: lesson.ruleAndExamples,
      commonMistake: lesson.commonMistake,
      memoryTip: lesson.memoryTip,
      practice: lesson.practice,
    })),
    outcomes: (raw.outcomes || []).map((outcome) => ({
      learningOutcome: outcome.learningOutcome,
      bloomLevel: outcome.bloomLevel,
      cambridgeObjectives: outcome.cambridgeObjectives || [],
    })),
    teacherNotes: (raw.teacherNotes || []).map((note) => ({ noteType: note.noteType, note: note.note })),
    // --- replaced, so summarised only -----------------------------------
    readingsCovered: (raw.readings || []).map((reading) => ({
      title: reading.title,
      type: reading.type,
      words: String(reading.passageScript || "").trim().split(/\s+/).filter(Boolean).length,
      opening: firstWords(reading.passageScript, 40),
    })),
    comprehensionCovered: (raw.comprehension || []).map((question) => question.question),
    speakingCovered: (raw.speaking || []).map((task) => `${task.activityType}: ${task.title}`),
    writingCovered: (raw.writing || []).map((task) => task.title),
    activitiesCovered: (raw.activities || []).map((activity) => `${activity.activityType}: ${activity.title}`),
    quizzesCovered: (raw.quizzes || []).map((question) => question.question),
    liveSessionsCovered: (raw.liveSessions || []).map((session) => session.title),
  };
}

const sourceUnits = [];
const stages = new Set();
for (const source of unit.source || []) {
  for (const number of source.units) {
    const file = path.join(ENGLISH, `grade-${source.grade}`, "data", "units", `unit-${number}.json`);
    if (!fs.existsSync(file)) { console.error(`missing source: ${path.relative(ROOT, file)}`); continue; }
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    stages.add(source.grade);
    sourceUnits.push({ grade: source.grade, sourceUnit: number, title: raw.unit.unitTitle, content: prepareSource(raw) });
  }
}

// --- Cambridge objectives for the stages involved -----------------------------
const cambridge = [];
for (const stage of [...stages].sort((a, b) => a - b)) {
  const code = stage <= 6 ? "0058" : "0861";
  const file = path.join(CURRICULUM, `cambridge-english-${code}.json`);
  if (!fs.existsSync(file)) continue;
  const framework = JSON.parse(fs.readFileSync(file, "utf8"));
  const objectives = framework.objectivesByStage[String(stage)] || [];
  cambridge.push({
    stage,
    framework: framework.framework,
    curriculumCode: framework.curriculumCode,
    objectiveCount: objectives.length,
    objectives: objectives.map((objective) => ({ code: objective.code, strand: objective.strand, subStrand: objective.subStrand, text: objective.text })),
  });
}

// --- fill the template ---------------------------------------------------------
const template = fs.readFileSync(TEMPLATE, "utf8");
const start = template.indexOf("## ═══ PROMPT START ═══");
const end = template.indexOf("## ═══ PROMPT END ═══");
if (start < 0 || end < 0) { console.error("Could not find the PROMPT START/END markers in the template."); process.exit(1); }
let prompt = template.slice(start + "## ═══ PROMPT START ═══".length, end).trim();

const canon = fs.readFileSync(CANON, "utf8");
const levelLabel = `${level.label} (CEFR ${(level.cefr || []).join("–")})`;
const unitLabel = `Unit ${unit.number} — ${unit.title}`;

// Fenced, not inline-quoted: these blocks are multi-line JSON and a Markdown
// document, and an inline code span mangles both.
const jsonBlock = (value) => "```json\n" + JSON.stringify(value) + "\n```";
const sourceGuide = full
  ? "Each source unit is given in full."
  : [
    "Each source unit is given in two parts.",
    "",
    "- **Reused in full** — `vocabulary`, `grammar`, `outcomes` (with their Cambridge codes) and `teacherNotes`. This is the language you are compressing; work from it directly.",
    "- **Summarised** — every `…Covered` field lists what the source unit covered in readings, comprehension, speaking, writing, activities, quizzes and live sessions, without the child text, because you are replacing all of it with adult equivalents. You need to know what ground was covered, not the wording being thrown away. Readings also carry their length and opening 40 words so you can judge text type and level.",
    "",
    "Do not treat a summarised field as content to adapt. Write the adult version from the patterns and the vocabulary.",
  ].join("\n");

const substitutions = {
  "{{LEVEL}}": levelLabel,
  "{{CEFR_BAND}}": cefrBand,
  "{{UNIT}}": unitLabel,
  "{{PATTERNS}}": "```json\n" + JSON.stringify(unit.patterns || [], null, 1) + "\n```",
  "{{ALREADY_TAUGHT}}": alreadyTaught.length
    ? jsonBlock(alreadyTaught)
    : "_Nothing yet — this is the first unit of the course._",
  "{{SOURCE}}": `${sourceGuide}\n\n${jsonBlock(sourceUnits)}`,
  "{{CAMBRIDGE}}": jsonBlock(cambridge),
  // The canon is Markdown with its own headings, so it goes in a tilde fence to
  // keep it from reading as part of this prompt's own structure.
  "{{CANON}}": "~~~markdown\n" + canon.trim() + "\n~~~",
};
// A large slot must appear exactly once. It is easy to add a prose reference
// like "a stage present in {{SOURCE}}" to the template and silently triple the
// prompt, which is what happened the first time this ran.
const BIG_SLOTS = new Set(["{{SOURCE}}", "{{CAMBRIDGE}}", "{{CANON}}", "{{ALREADY_TAUGHT}}"]);
for (const [slot, value] of Object.entries(substitutions)) {
  const occurrences = prompt.split(slot).length - 1;
  if (BIG_SLOTS.has(slot) && occurrences > 1) {
    console.error(`${slot} appears ${occurrences} times in the template. A large slot must appear once — the later ones are prose references and should name the block instead of repeating it.`);
    process.exit(1);
  }
  prompt = prompt.split(slot).join(value);
}

const leftover = prompt.match(/\{\{[A-Z_]+\}\}/g);
if (leftover) { console.error(`Unfilled slots remain: ${[...new Set(leftover)].join(", ")}`); process.exit(1); }

// A short brief on top, so the author (human or model) can see the shape of the
// job before wading into the pasted source.
const brief = [
  `<!-- Assembled by tools/build-intensive-prompt.js — do not edit by hand.`,
  `     Level ${level.number} (${(level.cefr || []).join("+")}) · Unit ${unit.number} · band ${cefrBand}`,
  `     Source: ${sourceUnits.map((s) => `G${s.grade}U${s.sourceUnit}`).join(", ") || "none"}`,
  `     Cambridge stages: ${[...stages].sort((a, b) => a - b).join(", ") || "none"}`,
  `     Patterns to teach: ${(unit.patterns || []).length} · already taught: ${alreadyTaught.length}`,
  `-->`,
  "",
].join("\n");

const outPath = outFlag >= 0 && args[outFlag + 1]
  ? path.resolve(args[outFlag + 1])
  : path.join(ROOT, "outputs", "intensive-prompts", `level-${levelNumber}-unit-${unitNumber}.md`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, brief + prompt, "utf8");

const bytes = fs.statSync(outPath).size;
console.log(`${level.label} · ${unitLabel}`);
console.log(`  CEFR band ............ ${cefrBand}`);
console.log(`  patterns to teach .... ${(unit.patterns || []).length}`);
console.log(`  already taught ....... ${alreadyTaught.length} (use, never re-teach)`);
console.log(`  source units ......... ${sourceUnits.length}${sourceUnits.length ? ` (${sourceUnits.map((s) => `G${s.grade}U${s.sourceUnit}`).join(", ")})` : ""}`);
console.log(`  Cambridge objectives . ${cambridge.reduce((sum, item) => sum + item.objectiveCount, 0)} across stages ${[...stages].sort((a, b) => a - b).join(", ")}`);
// Dense JSON runs near three characters to the token, so this is a rough floor
// rather than the four-characters-per-token rule of thumb for prose.
console.log(`  written .............. ${path.relative(ROOT, outPath)}  (${(bytes / 1024).toFixed(0)} KB, roughly ${Math.round(bytes / 3500)}k tokens)`);
if (!full) console.log(`  note ................. vocabulary, grammar and outcomes in full; readings and tasks summarised (pass --full for everything)`);
// A prompt this size is the input to a long generation, so leave headroom.
const approxTokens = bytes / 3500;
if (approxTokens > 150) {
  console.log(`  WARNING .............. roughly ${Math.round(approxTokens)}k tokens of input. Check it fits your model's context with room for the unit it has to write.`);
}
