// Acceptance gate for the Ehel Academy Science runtime packages.
//
// These courses are used without a teacher, so the checks below are the ones
// that decide whether a learner alone can actually follow a unit:
//   - explainers are complete (never clipped mid-sentence) and long enough to teach
//   - nothing on screen is addressed to a supervising adult instead of the learner
//   - quizzes are answerable (four distinct options, answer among them)
//   - every unit carries the reference and assessment sections the app renders

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportLastTouch } from "./lib/subject-last-touch.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const scienceRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "science");

// First line of the first check in `npm run check:science`, so it is seen on
// every run. Six sessions hold six subjects and share one git identity; this
// says who last wrote here, which is the only part git can answer.
reportLastTouch("science");

const MIN_EXPLANATION = 300;      // shorter than this cannot teach a concept unaided
const MAX_PARAGRAPHS = 40;        // longer means a concept absorbed a neighbouring section

// Text written to whoever is sitting with the learner, not to the learner.
const ADULT_ADDRESSED = /teach in short bursts|cannot sit still for long|\byour child\b|\blet (?:the|your) child\b|\bthe children learn\b|for the grown-?up|a grown-?up reads|you, the grown-?up|in this guide you will/i;
// A teacher-only instruction with no path forward for a learner working alone.
const TEACHER_REQUIRED = /\bhand (?:it )?in to your teacher\b|\bask your teacher to mark\b|\bwait for your teacher\b|\byour teacher will tell you\b/i;

// Modules whose text must differ per unit. A single string repeated across
// every grade means the module reads identically from Stage 1 to Stage 8 —
// which is how "Explore the Concept" ended up with one hint in all 53 units.
const VARIED_FIELDS = [
  ["explorations", "hint"], ["explorations", "context"], ["explorations", "explanation"],
  ["practice", "hint"], ["fluency", "hint"], ["realProblems", "hint"],
  ["activities", "materials"],
];
const REPEAT_LIMIT = 0.4;   // no single value may cover more than 40% of items
const repeats = new Map();  // "module.field" -> Map(value -> count)

// Field pairs that must not hold identical text inside one item, or the reveal
// shows the learner something they have already read.
const DISTINCT_PAIRS = [
  // A concept whose "example" repeats its own explanation gives the learner
  // the same paragraph twice under two headings.
  ["concepts", "explanation", "example"],
  ["explorations", "context", "explanation"],
  ["explorations", "answer", "explanation"],
  ["methods", "title", "example"],
  ["workedExamples", "title", "prompt"],
  ["realProblems", "answer", "errorFeedback"],
];

const failures = [];
const warnings = [];
const fail = (unit, message) => failures.push(`${unit}: ${message}`);
const warn = (unit, message) => warnings.push(`${unit}: ${message}`);

const walk = (value, visit) => {
  if (typeof value === "string") visit(value);
  else if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => walk(item, visit));
};

// Cambridge alignment. tools/validate-unit.mjs is the deep unit gate, but its
// structural checks are English's schema (readings, grammar, speaking), so
// pointing it at science reports a wall of sections science does not have. The
// part that does apply — is the declared syllabus coherent, and is the
// alignment evidenced — belongs here, in science's own gate.
//
// Primary Science is 0846 (Stages 1-6); Lower Secondary is 0893 (Stages 7-9).
const frameworkCache = new Map();
function frameworkFor(code) {
  if (!frameworkCache.has(code)) {
    const file = path.join(here, "..", "src", "curriculum", `cambridge-science-${code}.json`);
    let parsed = null;
    if (fs.existsSync(file)) { try { parsed = JSON.parse(fs.readFileSync(file, "utf8")); } catch { parsed = "unparseable"; } }
    frameworkCache.set(code, parsed);
  }
  return frameworkCache.get(code);
}
let unmappedUnits = 0;
function checkCambridge(label, gradeDir, unit) {
  const camb = unit.cambridge;
  if (!camb || !camb.code) { fail(label, "no cambridge block — the unit declares no syllabus"); return; }
  const grade = Number(gradeDir.split("-")[1]);
  const expected = grade <= 6 ? "0846" : "0893";
  if (String(camb.code) !== expected) fail(label, `declares code ${camb.code} but Stage ${grade} belongs to ${expected}`);
  if (Number(camb.stage) !== grade) fail(label, `declares Stage ${camb.stage} but sits in ${gradeDir}`);

  const fw = frameworkFor(String(camb.code));
  if (fw === "unparseable") { fail(label, `cambridge-science-${camb.code}.json is present but will not parse`); return; }
  if (!fw) { fail(label, `no framework file for code ${camb.code} — alignment cannot be checked`); return; }
  const stageObjectives = (fw.objectivesByStage || {})[String(camb.stage)] || [];
  if (!stageObjectives.length) { fail(label, `framework ${camb.code} carries no objectives for Stage ${camb.stage}`); return; }

  // Every objective code the unit claims must exist in its own stage.
  const known = new Set(stageObjectives.map((o) => o.code));
  // Key-aware traversal: the shared walk() yields values only, and an objective
  // code is only meaningful when it sits under an objectives key.
  const claimed = [];
  const collect = (node, underObjectives) => {
    if (typeof node === "string") { if (underObjectives) claimed.push(node.trim()); return; }
    if (Array.isArray(node)) { node.forEach((item) => collect(item, underObjectives)); return; }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        collect(value, underObjectives || /cambridgeObjectives?|objectiveCodes?/i.test(key));
      }
    }
  };
  collect(unit, false);
  for (const code of claimed) {
    if (!known.has(code)) fail(label, `claims objective ${code}, which is not in ${camb.code} Stage ${camb.stage}`);
  }
  if (!claimed.length) unmappedUnits += 1;
}

const gradeDirs = fs.readdirSync(scienceRoot).filter((name) => /^grade-\d+$/.test(name)).sort();
let unitCount = 0, conceptCount = 0, questionCount = 0, teachingChars = 0;

for (const gradeDir of gradeDirs) {
  const unitsDir = path.join(scienceRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) { fail(gradeDir, "no units directory"); continue; }

  for (const file of fs.readdirSync(unitsDir).filter((name) => name.endsWith(".json")).sort()) {
    const label = `${gradeDir}/${file}`;
    const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    unitCount += 1;
    checkCambridge(label, gradeDir, unit);

    const concepts = unit.concepts || [];
    if (concepts.length < 3) fail(label, `only ${concepts.length} concepts`);
    for (const concept of concepts) {
      conceptCount += 1;
      const explanation = String(concept.explanation || "");
      teachingChars += explanation.length + String(concept.example || "").length;
      if (explanation.length < MIN_EXPLANATION) fail(label, `concept "${concept.title}" explanation is ${explanation.length} chars — too thin to teach unaided`);
      if (/…$/.test(explanation.trim())) fail(label, `concept "${concept.title}" explanation is clipped mid-sentence`);
      if (/…$/.test(String(concept.example || "").trim())) fail(label, `concept "${concept.title}" example is clipped mid-sentence`);
      const paragraphs = explanation.split(/\n{2,}/).length;
      if (paragraphs > MAX_PARAGRAPHS) fail(label, `concept "${concept.title}" has ${paragraphs} paragraphs — it likely absorbed the next section`);
      if (!String(concept.title || "").trim()) fail(label, "a concept has no title");
    }

    // Sections the app renders unconditionally; an empty one is a blank screen.
    for (const section of ["outcomes", "practice", "activities", "fluency", "realProblems", "reasoningPrompts", "workedExamples", "visualModels", "explorations", "methods", "selfAssessment"]) {
      if (!Array.isArray(unit[section]) || unit[section].length === 0) fail(label, `section "${section}" is empty — the app renders a blank page`);
    }
    for (const key of ["rules", "terms", "vocabulary", "commonMistakes", "connections"]) {
      if (!Array.isArray(unit.reference?.[key]) || unit.reference[key].length === 0) fail(label, `reference.${key} is empty`);
    }

    const questions = unit.assessment?.questions || [];
    if (questions.length < 8) fail(label, `assessment has only ${questions.length} questions`);
    for (const question of questions) {
      questionCount += 1;
      const options = question.options || [];
      if (new Set(options).size !== options.length) fail(label, `question ${question.id} has duplicate options`);
      if (options.length < 4) warn(label, `question ${question.id} offers only ${options.length} options`);
      if (question.answer !== undefined && options.length && !options.includes(question.answer)) {
        fail(label, `question ${question.id} answer is not among its options`);
      }
    }

    for (const [mod, field] of VARIED_FIELDS) {
      for (const item of unit[mod] || []) {
        const value = item?.[field];
        if (typeof value !== "string" || value.trim().length < 4) continue;
        const key = `${mod}.${field}`;
        if (!repeats.has(key)) repeats.set(key, new Map());
        const seen = repeats.get(key);
        seen.set(value.trim(), (seen.get(value.trim()) || 0) + 1);
      }
    }
    for (const [mod, a, b] of DISTINCT_PAIRS) {
      for (const item of unit[mod] || []) {
        const left = item?.[a];
        const right = item?.[b];
        if (typeof left === "string" && typeof right === "string" && left.trim() && left.trim() === right.trim()) {
          fail(label, `${mod}: "${a}" and "${b}" hold identical text — the reveal repeats what the learner already read`);
        }
      }
    }

    walk(unit, (text) => {
      if (ADULT_ADDRESSED.test(text)) fail(label, `text addresses a supervising adult: "${text.slice(0, 90)}"`);
      if (TEACHER_REQUIRED.test(text)) fail(label, `text requires a teacher with no solo path: "${text.slice(0, 90)}"`);
    });

    if (unit.cambridge?.code && !["0846", "0893"].includes(String(unit.cambridge.code))) {
      fail(label, `unexpected Cambridge code ${unit.cambridge.code} (expected 0846 for stages 1-6, 0893 for 7-9)`);
    }
    const stage = Number(unit.cambridge?.stage);
    const expected = stage <= 6 ? "0846" : "0893";
    if (unit.cambridge?.code && String(unit.cambridge.code) !== expected) {
      fail(label, `stage ${stage} declares framework ${unit.cambridge.code}, expected ${expected}`);
    }
  }
}

for (const [key, seen] of repeats) {
  const total = [...seen.values()].reduce((a, b) => a + b, 0);
  const [value, n] = [...seen.entries()].sort((x, y) => y[1] - x[1])[0];
  if (total >= 20 && n / total > REPEAT_LIMIT) {
    failures.push(`${key}: one value fills ${Math.round(100 * n / total)}% of ${total} items across all grades — "${value.slice(0, 70)}"`);
  }
}

console.log(`science content: ${unitCount} units, ${conceptCount} concepts, ${questionCount} quiz questions, ${teachingChars.toLocaleString()} chars of teaching text`);
if (unmappedUnits) {
  // Not a failure: mapping every outcome to a syllabus code is authoring work,
  // not a build defect. But it is stated plainly, because until it is done the
  // course's Cambridge alignment is a claim rather than something checked.
  console.log(`\ncambridge: ${unmappedUnits} of ${unitCount} units map no objective codes — alignment is declared, not evidenced.`);
  console.log("   The syllabus and stage of every unit were checked against src/curriculum/cambridge-science-08*.json.");
}
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const message of warnings.slice(0, 15)) console.log(`   ${message}`);
}
if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):`);
  for (const message of failures.slice(0, 40)) console.error(`   ${message}`);
  process.exit(1);
}
console.log("\n✓ all science content checks pass");
