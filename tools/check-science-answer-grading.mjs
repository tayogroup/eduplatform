// Hold the Science answer-grading rule to what it promises.
//
// Every module that marks typed input — Discovery, the explorations, Guided
// Practice in both designs, the Fluency sprint and Real Problems — is supposed
// to share one function. Twice it has not. The rule began as "either string
// contains the other", which against this course is close to no rule at all:
// every reviewed answer is a model paragraph, 545 of them with a median of 36
// words, so "a" scored correct against "water" and "e" against "the seed
// germinates". answerMatches replaced it. But Guided Practice kept a copy of the
// old rule in BOTH designs and Fluency kept a third, so 1,272 answers went on
// accepting any substring while the fix sat in the same file — and the comment
// above it already said "one rule, in one place, for both designs and both
// halves". Saying it is not having it.
//
// Grading is runtime logic, so check-science-content.mjs cannot see it and a
// third recurrence would ship as quietly as the second. This is the sibling of
// check-math-answer-grading.mjs, written against SCIENCE's rule rather than
// Mathematics' — the two courses answer differently and must be checked
// differently. Mathematics asks for the values a numeric answer asserts;
// Science asks for one shared content word against a paragraph, and that
// generosity is deliberate. What is not negotiable is that a keystroke, or a
// word carrying no meaning, cannot score.
//
//   node tools/check-science-answer-grading.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const subject = path.join(here, "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "science.js");
const scienceRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "science");

const source = fs.readFileSync(subject, "utf8");
const failures = [];
const fail = (message) => failures.push(message);

// ---------------------------------------------------------- the rule itself
// Taken from the shipped source rather than reimplemented: a copy here would be
// free to drift from the app, and drift is what this guards.
const from = source.indexOf("const CHECK_FILLER");
const to = source.indexOf("\n}", source.indexOf("function answerMatches(")) + 2;
if (from < 0 || to < 2) {
  console.error("✗ could not find the grading block in shell/subjects/science.js");
  console.error("  Expected `const CHECK_FILLER` … through the end of `function answerMatches(`.");
  console.error("  If grading moved, point this gate at its new home — do not delete the check.");
  process.exit(1);
}
const answerMatches = new Function(`${source.slice(from, to)}\nreturn answerMatches;`)();
const contentWords = new Function(`${source.slice(from, to)}\nreturn contentWords;`)();

// ------------------------------------------------- no module keeps its own copy
// The actual regression. Both times this broke, the fixed function existed and
// some module was not calling it, so checking behaviour alone would have passed
// while Guided Practice went on accepting a full stop. Nothing in this file may
// grade by raw containment.
// Comment lines are stripped first, and keeping their line numbers matters: the
// note above answerMatches quotes the very patterns being searched for, so a
// naive scan reports the explanation of the bug as the bug.
const codeLines = source.split("\n").map((text) => (text.trim().startsWith("//") ? "" : text));
for (const pattern of [/includes\(response\)/, /includes\(expected\)/, /answer\.includes\(given\)/, /given\.includes\(answer\)/]) {
  const line = codeLines.findIndex((text) => pattern.test(text));
  if (line >= 0) fail(`shell/subjects/science.js:${line + 1} grades by raw containment (${codeLines[line].trim().slice(0, 60)}) instead of calling answerMatches`);
}
// And every module that marks typed input must be calling it. Six call sites:
// discovery, explorations, practice (grid), practice (deck), fluency, problems
// (grid), problems (deck) — seven including the definition.
const callSites = (source.match(/answerMatches\(/g) || []).length - 1;
if (callSites < 6) fail(`only ${callSites} module(s) call answerMatches — a module that marks typed input is grading some other way`);

// ------------------------------------------------------------------ fixtures
const MODEL = "The embryo is the tiny baby plant; the other parts protect or feed it.";
const CASES = [
  // Keystrokes. These are what the old rule accepted against a paragraph.
  ["e", MODEL, false, "a single letter is not an answer"],
  ["a", MODEL, false, "a single letter that appears throughout the text"],
  [".", MODEL, false, "punctuation alone"],
  ["", MODEL, false, "an empty response"],
  ["   ", MODEL, false, "whitespace only"],
  // Filler carries no meaning, however many words of it there are.
  ["the", MODEL, false, "a filler word"],
  ["they use these", MODEL, false, "filler only, three words"],
  ["it is the one that they use", MODEL, false, "a sentence made entirely of filler"],
  // "other" is NOT in CHECK_FILLER, so it counts as content and scores against
  // any answer containing it. That is the filler list's call, not this gate's —
  // recorded as the behaviour it is rather than asserted to be wrong, so that a
  // deliberate change to the list shows up here as a decision to make.
  ["the other", MODEL, true, "a weak but non-filler word still counts"],
  // The generosity this course intends, and must keep.
  ["embryo", MODEL, true, "one real content word from the answer"],
  ["the embryo", MODEL, true, "a content word with filler around it"],
  ["baby plant", MODEL, true, "two content words"],
  [MODEL, MODEL, true, "the reviewed answer itself"],
  ["The Embryo Is The Tiny Baby Plant; The Other Parts Protect Or Feed It.", MODEL, true, "case and spacing are not significant"],
  // A wrong answer shares no content word.
  ["photosynthesis", MODEL, false, "a real word that is not in the answer"],
  ["volcano eruption magma", MODEL, false, "a wrong answer from another topic"],
];
for (const [response, expected, want, why] of CASES) {
  const got = answerMatches(response, expected);
  if (got !== want) fail(`fixture: ${why} — ${JSON.stringify(response)} returned ${got}, expected ${want}`);
}

// -------------------------------------------------------------- the corpus
const answers = [];
for (const gradeDir of fs.readdirSync(scienceRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(scienceRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
    for (const module of ["practice", "fluency", "explorations", "realProblems"]) {
      for (const item of unit[module] || []) {
        if (typeof item.answer === "string" && item.answer.trim()) {
          answers.push({ where: `${gradeDir}/${file} ${module}.${item.id}`, answer: item.answer });
        }
      }
    }
  }
}
if (answers.length < 1500) fail(`only ${answers.length} free-text answers found — the corpus check is not seeing the course`);

const SINGLES = "abcdefghijklmnopqrstuvwxyz0123456789.,;:!?-";
let selfRejected = 0, keystrokeAccepted = 0, contentRejected = 0;

for (const { where, answer } of answers) {
  // The reviewed answer must always count.
  if (!answerMatches(answer, answer)) { selfRejected += 1; fail(`corpus: the reviewed answer is rejected by its own rule — ${where}`); }

  // No single character may ever score. Unlike Mathematics there is no honest
  // exception here: a Science answer is prose, never a bare digit, so any
  // single character passing means containment has come back.
  for (const character of SINGLES) {
    if (answerMatches(character, answer)) {
      keystrokeAccepted += 1;
      fail(`corpus: "${character}" scores against a model answer — ${where}`);
      break;
    }
  }

  // The generosity has to survive too: a learner offering a real content word
  // from the reviewed answer earns it. If this starts failing the rule has been
  // tightened into something this course's long answers cannot satisfy.
  const [word] = contentWords(answer);
  if (word && !answerMatches(word, answer)) {
    contentRejected += 1;
    fail(`corpus: a content word from the answer is rejected — ${where}: ${JSON.stringify(word)}`);
  }
}

console.log(`science answer grading: ${CASES.length} fixtures, ${answers.length} free-text answers, ${callSites} call sites`);
console.log(`   reviewed answer accepted        : ${answers.length - selfRejected}/${answers.length}`);
console.log(`   a content word accepted         : ${answers.length - contentRejected}/${answers.length}`);
console.log(`   answers a keystroke can score   : ${keystrokeAccepted}`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} grading failure(s):`);
  for (const message of failures.slice(0, 25)) console.error(`   ${message}`);
  if (failures.length > 25) console.error(`   … and ${failures.length - 25} more`);
  process.exit(1);
}
console.log("\n✓ science answer grading: one rule for every module, meaning required, keystrokes refused");
