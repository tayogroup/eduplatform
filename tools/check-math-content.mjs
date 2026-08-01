// Acceptance gate for the Ehel Academy Mathematics runtime packages.
//
// The sibling of check-science-content.mjs, adapted to the Mathematics schema
// and app. Same question: can a learner with no teacher actually follow a unit?
//   - explainers are complete (never clipped mid-sentence) and long enough to teach
//   - nothing on screen is addressed to a supervising adult instead of the learner
//   - quizzes are answerable (the answer is one of the options)
//   - every section the app renders has something in it
//   - no module reads identically in every grade

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");

const MIN_EXPLANATION = 300;
const MAX_PARAGRAPHS = 40;

// Text written to whoever is sitting with the learner, not to the learner.
// "the child" is deliberately absent: Stage 3 word problems legitimately say
// "the child with 8 collected 8/30", and flagging those would be wrong.
//
// Year 1 is exempt (ADULT_VOICE_EXEMPT below). A five-year-old cannot read a
// course, so Stage 1 is a parent-led one by design: it is sourced from a parent
// guide and keeps its "How to teach it:" sections and "🗣 Suggested dialogue
// You: / Child:" blocks, which only make sense addressed to the adult. Holding
// it to the solo-learner rule produced prose that addressed the learner in the
// explainer and the parent in the dialogue two lines later.
const ADULT_ADDRESSED = /\byour child\b|\b(?:let|ask|encourage|remind|tell|watch|guide) (?:the|your) child\b|the child'?s own work|read alone by the child|taught with you|teaches? (?:the child|children) that|helps? the child|many young children|the child'?s first|children learn [^.]*best|this guide is written for/i;
const TEACHER_REQUIRED = /\bhand (?:it )?in to your teacher\b|\bask your teacher to mark\b|\bwait for your teacher\b|\byour teacher will tell you\b|explain each step to your teacher or tutor\.$/i;
const SOURCE_MARKER = /\[(?:Star|Tip|Fact|Look|Safety|Note|Warning|Key|!)\]/;
// Grades whose course is led by an adult rather than read solo.
const ADULT_VOICE_EXEMPT = new Set(["grade-1"]);

// Sections the app renders unconditionally; an empty one is a blank screen.
const REQUIRED_SECTIONS = ["outcomes", "concepts", "practice", "fluency", "realProblems",
  "reasoningPrompts", "workedExamples", "visualModels", "explorations", "methods"];
// Only the reference keys the Mathematics app actually reads.
const REQUIRED_REFERENCE = ["rules", "terms", "commonMistakes"];

// Fields whose text must differ between units, and pairs that must not be equal
// inside one item. Both exist because whole modules once read the same in every
// grade — see docs/ehel-science-course-pipeline.md.
const VARIED_FIELDS = [
  ["explorations", "hint"], ["explorations", "explanation"],
  ["practice", "hint"], ["fluency", "hint"], ["realProblems", "hint"],
];
const REPEAT_LIMIT = 0.4;
const repeats = new Map();
const DISTINCT_PAIRS = [
  // A concept whose "example" repeats its own explanation gives the learner
  // the same paragraph twice under two headings.
  ["concepts", "explanation", "example"],
  ["explorations", "answer", "explanation"],
  ["explorations", "context", "explanation"],
  ["workedExamples", "title", "prompt"],
  ["methods", "title", "example"],
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

let unitCount = 0, conceptCount = 0, questionCount = 0, teachingChars = 0;

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) { fail(gradeDir, "no units directory"); continue; }

  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const label = `${gradeDir}/${file}`;
    const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    unitCount += 1;

    for (const concept of unit.concepts || []) {
      conceptCount += 1;
      const explanation = String(concept.explanation || "");
      teachingChars += explanation.length + String(concept.example || "").length;
      if (explanation.length < MIN_EXPLANATION) fail(label, `concept "${concept.title}" explanation is ${explanation.length} chars — too thin to teach unaided`);
      // A trailing ellipsis is only damage when it cuts a word off. After a
      // digit it is the author continuing a sequence on purpose — "count on in
      // threes: 0, 3, 6, 9, 12, 15, 18…" is complete as written.
      if (/[a-z,;:]\s*…$/i.test(explanation.trim())) fail(label, `concept "${concept.title}" explanation is clipped mid-sentence`);
      if (explanation.split(/\n{2,}/).length > MAX_PARAGRAPHS) fail(label, `concept "${concept.title}" has too many paragraphs — it likely absorbed the next section`);
      if (!String(concept.title || "").trim()) fail(label, "a concept has no title");
    }

    for (const section of REQUIRED_SECTIONS) {
      if (!Array.isArray(unit[section]) || unit[section].length === 0) fail(label, `section "${section}" is empty — the app renders a blank page`);
    }
    for (const key of REQUIRED_REFERENCE) {
      if (!Array.isArray(unit.reference?.[key]) || unit.reference[key].length === 0) fail(label, `reference.${key} is empty — the app renders this section`);
    }

    const questions = unit.assessment?.questions || [];
    if (questions.length < 8) fail(label, `assessment has only ${questions.length} questions`);
    for (const question of questions) {
      questionCount += 1;
      const options = question.options || [];
      if (new Set(options).size !== options.length) fail(label, `question ${question.id} has duplicate options`);
      if (options.length < 4) warn(label, `question ${question.id} offers only ${options.length} options`);
      if (question.answer !== undefined && options.length && !options.includes(question.answer)) {
        fail(label, `question ${question.id} answer "${String(question.answer).slice(0, 40)}" is not among its options — the question cannot be answered`);
      }
      if (!question.explanation) warn(label, `question ${question.id} has no explanation`);
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
      if (!ADULT_VOICE_EXEMPT.has(gradeDir) && ADULT_ADDRESSED.test(text)) {
        fail(label, `text addresses a supervising adult: "${text.slice(0, 90)}"`);
      }
      if (TEACHER_REQUIRED.test(text)) fail(label, `text requires a teacher with no solo path: "${text.slice(0, 90)}"`);
      if (SOURCE_MARKER.test(text)) fail(label, `raw source markup reaches the learner: "${text.slice(0, 90)}"`);
    });

    const stage = Number(unit.cambridge?.stage);
    const expected = stage <= 6 ? "0096" : "0862";
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

console.log(`math content: ${unitCount} units, ${conceptCount} concepts, ${questionCount} quiz questions, ${teachingChars.toLocaleString()} chars of teaching text`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const message of warnings.slice(0, 12)) console.log(`   ${message}`);
  if (warnings.length > 12) console.log(`   … and ${warnings.length - 12} more`);
}
if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):`);
  for (const message of failures.slice(0, 40)) console.error(`   ${message}`);
  if (failures.length > 40) console.error(`   … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log("\n✓ all math content checks pass");
