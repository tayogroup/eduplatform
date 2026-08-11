// Hold the Mathematics answer-grading rule to what it promises.
//
// Guided Practice, Fluency, Real Problems and the discoveries all mark typed
// input with one function in shell/subjects/mathematics.js. It once accepted
// any substring of the reviewed answer — "." passed "a) 3, b) 8, c) 5." — so
// 4,753 of the 4,788 free-text answers could be cleared by a single wrong
// character and every score those modules recorded was meaningless. Nothing in
// the repo could see that: it is runtime logic, not content, so the content
// gate has no view of it and a regression would ship silently.
//
// The rule is checked here two ways, because neither alone is enough. The
// fixtures pin the exact defects that have been fixed, which a corpus property
// would average away. The corpus properties run against all 4,788 real answers,
// which is where a rule that looks right on ten examples falls over.
//
//   node tools/check-math-answer-grading.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const subject = path.join(here, "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "mathematics.js");
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");

// The function under test is taken out of the shipped source rather than
// reimplemented. A copy here would be free to drift from the app, and drift is
// the whole failure mode: while this was being written the harness held its own
// extractor, inherited the thousands-separator bug, and the two errors cancelled
// so a broken rule measured clean.
const source = fs.readFileSync(subject, "utf8");
const from = source.indexOf("const ANSWER_MINUS");
const to = source.indexOf("\n}", source.indexOf("function answerMatches(")) + 2;
if (from < 0 || to < 2) {
  // Never degrade to "skipped". If the grading block cannot be found the rule
  // has been restructured, and passing here would report that the thing was
  // checked when nothing was.
  console.error("✗ could not find the grading block in shell/subjects/mathematics.js");
  console.error("  Expected `const ANSWER_MINUS` … through the end of `function answerMatches(`.");
  console.error("  If grading moved, point this gate at its new home — do not delete the check.");
  process.exit(1);
}
const block = source.slice(from, to);
const answerMatches = new Function(`${block}\nreturn answerMatches;`)();
const assertedValues = new Function(`${block}\nreturn assertedValues;`)();

const failures = [];
const fail = (message) => failures.push(message);

// ---------------------------------------------------------------- fixtures
// [response, reviewed answer, should it count, what it is guarding]
const CASES = [
  // The substring rule, in both directions.
  [".", "a) 3, b) 8, c) 5.", false, "a bare full stop is not an answer"],
  ["1", "a) 3, b) 8, c) 5.", false, "a digit that appears nowhere in the answer"],
  ["3", "a) 3, b) 8, c) 5.", false, "one third of a three-part answer"],
  ["a", "a) 3, b) 8, c) 5.", false, "a part label is not a value"],
  ["3, 8, 5", "a) 3, b) 8, c) 5.", true, "the three values, typed plainly"],
  ["a) 3, b) 8, c) 5", "a) 3, b) 8, c) 5.", true, "the answer as written"],

  // Working may be shown or left out; the old rule rejected both of these.
  ["52, 81", "a) 43 + 9 = 43 + 10 - 1 = 52, b) 62 + 19 = 62 + 20 - 1 = 81.", true, "values without the working"],
  ["43 + 10 - 1 = 52, 62 + 20 - 1 = 81", "a) 43 + 9 = 43 + 10 - 1 = 52, b) 62 + 19 = 62 + 20 - 1 = 81.", true, "values with the working"],
  ["52", "a) 43 + 9 = 43 + 10 - 1 = 52, b) 62 + 19 = 62 + 20 - 1 = 81.", false, "half of a two-part answer"],
  ["53, 81", "a) 43 + 9 = 43 + 10 - 1 = 52, b) 62 + 19 = 62 + 20 - 1 = 81.", false, "one value wrong"],

  // Thousands separators. Reading "1,058" as 1 and 58 both accepted "1" and
  // rejected a learner who typed 1058.
  ["1058", "46 × 23 = 800 + 120 + 120 + 18 = 1,058.", true, "a four-figure answer typed without its comma"],
  ["1", "46 × 23 = 800 + 120 + 120 + 18 = 1,058.", false, "the first digit of a thousands-separated value"],
  ["12, 24, 40", "Even: 12, 24, 40.", true, "commas separating a list, not thousands"],
  ["122440", "Even: 12, 24, 40.", false, "a list run together is not the list"],

  // "3D" names a kind of shape, not a quantity to reach.
  ["3", "It is a 3D shape (a sphere) because it is solid.", false, "a dimension is not a value"],
  ["3d shape a sphere because it is solid", "It is a 3D shape (a sphere) because it is solid.", true, "the words of a prose answer"],

  // Prose. "Group A" and "Group B" differ only in a single letter, so single
  // letters have to survive the stop-word filter.
  ["group a", "Group A", true, "the prose answer itself"],
  ["group b", "Group A", false, "the other group"],
  ["clockwise", "Clockwise.", true, "one word, trailing stop ignored"],
  ["c", "Clockwise.", false, "the first letter of a one-word answer"],
  ["angle", "A right angle.", false, "a fragment of a prose answer"],
  ["a right angle", "A right angle.", true, "the whole prose answer"],

  // Answers that genuinely are one digit stay answerable by that digit.
  ["6", "6 faces.", true, "a single-value answer"],
  ["16", "6 faces.", false, "a value that merely contains the right digit"],

  // Nothing typed is never right.
  ["", "6 faces.", false, "an empty response"],
  ["   ", "6 faces.", false, "whitespace only"],
];

for (const [response, expected, want, why] of CASES) {
  const got = answerMatches(response, expected);
  if (got !== want) fail(`fixture: ${why} — ${JSON.stringify(response)} vs ${JSON.stringify(expected)} returned ${got}, expected ${want}`);
}

// ------------------------------------------------------------- the corpus
const answers = [];
for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    for (const module of ["practice", "fluency", "realProblems", "explorations"]) {
      for (const item of unit[module] || []) {
        if (typeof item.answer === "string" && item.answer.trim()) {
          answers.push({ where: `${gradeDir}/${file} ${module}.${item.id}`, answer: item.answer });
        }
      }
    }
  }
}
if (answers.length < 4000) fail(`only ${answers.length} free-text answers found — the corpus check is not seeing the course`);

const SINGLES = "0123456789abcdefghijklmnopqrstuvwxyz";
let selfRejected = 0, valuesRejected = 0, wrongAccepted = 0, halfAccepted = 0;
let singlePasses = 0, singleUnexplained = 0;

for (const { where, answer } of answers) {
  // The reviewed answer must always count.
  if (!answerMatches(answer, answer)) { selfRejected += 1; fail(`corpus: the reviewed answer is rejected by its own rule — ${where}`); }

  const values = assertedValues(answer);
  if (values.length) {
    // Typed plainly, the values it asserts must count.
    if (!answerMatches(values.join(", "), answer)) { valuesRejected += 1; fail(`corpus: the asserted values are rejected — ${where}: ${JSON.stringify(answer.slice(0, 50))}`); }
    // Every value wrong must not.
    if (answerMatches(values.map((value) => value + 1).join(", "), answer)) { wrongAccepted += 1; fail(`corpus: shifted values accepted — ${where}`); }
    // One value out of several is not the answer.
    const distinct = [...new Set(values)];
    if (distinct.length > 1 && answerMatches(String(distinct[0]), answer)) { halfAccepted += 1; fail(`corpus: one value of ${distinct.length} accepted — ${where}`); }
  }

  // A single character may only pass where it IS the answer — every value the
  // answer asserts is that digit, as in "6 faces." This is a property rather
  // than a recorded count so it keeps its meaning when the content changes;
  // a count would need editing on every content change and would stop being
  // read. Anything else here is the substring rule coming back.
  for (const character of SINGLES) {
    if (character === answer.trim().toLowerCase()) continue;
    if (!answerMatches(character, answer)) continue;
    singlePasses += 1;
    const values = assertedValues(answer);
    if (!(values.length && values.every((value) => value === Number(character)))) {
      singleUnexplained += 1;
      fail(`corpus: "${character}" passes an answer it is not — ${where}: ${JSON.stringify(answer.slice(0, 50))}`);
    }
  }
}

console.log(`math answer grading: ${CASES.length} fixtures, ${answers.length} free-text answers`);
console.log(`   reviewed answer accepted        : ${answers.length - selfRejected}/${answers.length}`);
console.log(`   asserted values accepted        : ${answers.length - valuesRejected}/${answers.length}`);
console.log(`   shifted values accepted         : ${wrongAccepted}`);
console.log(`   partial answers accepted        : ${halfAccepted}`);
console.log(`   single-character passes         : ${singlePasses} (all are answers that genuinely are that digit)`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} grading failure(s):`);
  for (const message of failures.slice(0, 25)) console.error(`   ${message}`);
  if (failures.length > 25) console.error(`   … and ${failures.length - 25} more`);
  process.exit(1);
}
console.log("\n✓ math answer grading: values and words are required, substrings are not accepted");
