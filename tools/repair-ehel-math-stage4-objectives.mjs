// Teach the two Cambridge 0096 Stage 4 objectives the Grade 4 course does not cover.
//
// The 18-unit Grade 4 course was audited against the full Stage 4 framework for the
// first time on 2026-09-07 (src/prototypes/ehel-academy/mathematics/grade-4-app/
// audit-deployed-course.py). It scored 44 covered, 1 partial, 1 not covered:
//
//   4Ni.03  "Understand the associative property of multiplication, and use this to
//           simplify calculations" -- absent. The course teaches COMMUTATIVITY well
//           ("because multiplication is commutative, 7 x 9 gives exactly the same
//           answer as 9 x 7", U5), which is a different property. Regrouping three
//           factors to make a calculation easier appeared nowhere in 1.05M characters.
//
//   4Ni.01  "Read and write number names and whole numbers greater than 1000 and less
//           than 0" -- partial. Six-digit place value (U1, U3, U9, U13, U17) and
//           negative numbers (U1, U15) are taught thoroughly; writing a whole number
//           IN WORDS is not. The only number words in the course are fractions.
//
// This adds the missing teaching in place rather than rebuilding, for the reason
// repair-ehel-math-truncation.mjs already gives: the generated units carry
// hand-authored work that exists nowhere else, and `build:math` would discard it.
//
//   node tools/repair-ehel-math-stage4-objectives.mjs [--write]
//
// Dry run unless --write. Idempotent: a unit that already carries the concept is
// skipped, so a second run reports 0 changes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const unitsDir = path.join(root, "src", "prototypes", "ehel-academy", "mathematics",
  "grade-4", "data", "units");
const write = process.argv.slice(2).includes("--write");

/* ---- the additions, one per objective ------------------------------------- */

const ASSOCIATIVE = {
  unit: 5,
  objective: "4Ni.03",
  conceptId: "concept-7-grouping-factors-the-associative-property",
  outcome: "Understand the associative property of multiplication, and use it to regroup factors and simplify a calculation.",
  selfAssessment: "I can regroup the factors in a multiplication to make it easier, and explain why the answer does not change.",
  concept: {
    title: "Grouping Factors: The Associative Property",
    explanation:
      "You already know that you can swap the order of two numbers in a multiplication: 7 × 9 gives the same answer as 9 × 7. That is the commutative property, and it is about ORDER. There is a second idea that helps just as much, and it is about GROUPING rather than order.\n\nWhen you multiply three numbers you get to choose which pair to multiply first, and brackets show the choice. (2 × 5) × 7 means multiply 2 by 5 first, then multiply by 7: that is 10 × 7 = 70. And 2 × (5 × 7) means multiply 5 by 7 first: that is 2 × 35 = 70. Same three numbers, different grouping, same answer every time. That is the associative property.\n\nHere is why it is worth knowing. One grouping is almost always easier than the other. In (2 × 5) × 7 the first pair makes 10, and multiplying by 10 is something you can do instantly. Left as 2 × 35 you would be working much harder for exactly the same answer. So when you meet three factors, hunt for a pair that makes a friendly number — 10, 20, 50 or 100 — and group those two together first.",
    example: "4 × 25 × 3: group the 4 and the 25, because 4 × 25 = 100. Then 100 × 3 = 300.",
  },
  method: {
    title: "How to regroup three factors to make a multiplication easier",
    example: "Work out 8 × 5 × 6.",
    steps: [
      "Look at the three factors and hunt for a pair that makes a friendly number — 10, 20, 50 or 100.",
      "Put brackets round that pair. Here 8 × 5 = 40, so write (8 × 5) × 6.",
      "Work out the bracket first: 40.",
      "Multiply by the factor that is left over: 40 × 6 = 240.",
      "Check by grouping the other way: 8 × (5 × 6) = 8 × 30 = 240. The same, as it always will be.",
    ],
  },
  workedExamples: [
    { title: "Choosing the easier grouping",
      prompt: "Work out 2 × 17 × 5 by grouping the factors cleverly.",
      solution: "The 2 and the 5 make 10, so regroup as 17 × (2 × 5) = 17 × 10 = 170. Grouping it the other way gives (2 × 17) × 5 = 34 × 5, which is the same 170 but much harder to do in your head. Both are correct; one is kinder." },
    { title: "Three factors with a hundred hiding in them",
      prompt: "Work out 25 × 7 × 4.",
      solution: "25 × 4 = 100, so regroup as (25 × 4) × 7 = 100 × 7 = 700. Multiplying by 100 moves every digit two places to the left, so there is no written working at all. Spotting the pair that makes 100 is the whole trick." },
  ],
  practice: [
    { level: "Core",
      prompt: "Regroup each one to make it easier, then work it out: a) 5 × 9 × 2  b) 4 × 6 × 25  c) 2 × 13 × 50.",
      answer: "a) (5 × 2) × 9 = 10 × 9 = 90, b) (4 × 25) × 6 = 100 × 6 = 600, c) (2 × 50) × 13 = 100 × 13 = 1,300.",
      hint: "Hunt for the pair that makes 10 or 100, and multiply those two first." },
    { level: "Challenge",
      prompt: "Is (3 × 4) × 5 the same as 3 × (4 × 5)? Work out both, then explain what your answer shows.",
      answer: "(3 × 4) × 5 = 12 × 5 = 60, and 3 × (4 × 5) = 3 × 20 = 60. They match. Regrouping the factors never changes the product — that is the associative property, and it is why you are free to choose whichever grouping is easiest.",
      hint: "Work out the bracket first each time, then compare the two answers." },
  ],
  fluency: {
    prompt: "Group the friendly pair first: a) 2 × 7 × 5  b) 25 × 3 × 4  c) 50 × 9 × 2.",
    answer: "a) 70, b) 300, c) 900.",
    hint: "Find the pair that makes 10 or 100 and multiply those two together first.",
  },
  term: ["Associative property", "Changing which pair you multiply first does not change the product"],
  mistake: ["Mixing up associative and commutative",
    "Commutative changes the ORDER (7 × 9 = 9 × 7); associative changes the GROUPING ((2 × 5) × 7 = 2 × (5 × 7))"],
  rule: { title: "Grouping Factors: The Associative Property",
    text: "When you multiply three numbers you get to choose which pair to multiply first, and the answer is the same either way." },
};

const NUMBER_NAMES = {
  unit: 1,
  objective: "4Ni.01",
  conceptId: "concept-4-reading-and-writing-number-names",
  outcome: "Read and write number names in words for whole numbers beyond 1000, and for numbers below zero.",
  selfAssessment: "I can write a number such as 4,006 in words, and turn a number name back into digits.",
  concept: {
    title: "Reading and Writing Number Names",
    explanation:
      "A number can be written two ways and you need to move easily between them: in digits, like 4,006, and in words, like four thousand and six. Saying a number aloud is the bridge between the two — if you can say it correctly, you can write it.\n\nSplit the number at the comma. Everything to the left of the comma counts the thousands; everything to the right is the hundreds, tens and ones. Say the left part, say the word thousand, then say the right part. So 4,006 is four — thousand — and six.\n\nThe little word and goes in front of the last part when there are no hundreds: four thousand and six, not four thousand six. Where there are hundreds you do not need it, so 4,600 is four thousand six hundred.\n\nThe zeros are where mistakes happen, because you never say them out loud. Four thousand and six is 4,006, four thousand and sixty is 4,060, and four thousand six hundred is 4,600 — three different numbers whose names sound alike if you rush. The zeros are holding empty places, and the place is what gives each digit its value.\n\nA number below zero simply takes the word minus in front of its name: −8 is minus eight, and −250 is minus two hundred and fifty.",
    example: "62,415 is sixty-two thousand, four hundred and fifteen.",
  },
  method: {
    title: "How to write a number in words",
    example: "Write 30,204 in words.",
    steps: [
      "Split the number at the comma: 30 and 204.",
      "Write the left part in words and add the word thousand: thirty thousand.",
      "Write the right part in words: two hundred and four.",
      "Join the two with a comma: thirty thousand, two hundred and four.",
      "Check by reading it back and writing the digits again. If you do not land on the number you started with, a zero has gone missing.",
    ],
  },
  workedExamples: [
    { title: "A number with a hidden zero",
      prompt: "Write 5,020 in words.",
      solution: "Split at the comma: 5 and 020. The left part is five thousand. The right part has no hundreds, so it takes and: and twenty. The number is five thousand and twenty. Compare it with 5,200, which is five thousand two hundred — a completely different number, and only the position of the zero tells them apart." },
    { title: "From words back to digits",
      prompt: "Write seventy thousand, three hundred and nine in digits.",
      solution: "Seventy thousand gives 70, then the comma. Three hundred and nine gives 309. So the number is 70,309. Nobody says the zero in the tens place, which is exactly why it is the one people drop." },
  ],
  practice: [
    { level: "Core",
      prompt: "Write each of these in words: a) 3,008  b) 3,080  c) 3,800.",
      answer: "a) three thousand and eight, b) three thousand and eighty, c) three thousand eight hundred.",
      hint: "Say it aloud first. The zeros are never spoken, but they decide the value." },
    { level: "Challenge",
      prompt: "Write each of these in digits: a) twelve thousand, four hundred and six  b) minus fifteen  c) ninety thousand and ninety.",
      answer: "a) 12,406, b) −15, c) 90,090.",
      hint: "Write the thousands part, then a comma, then the rest. Read your digits back to check." },
  ],
  fluency: {
    prompt: "Write in words: a) 6,005  b) 6,050  c) 6,500.",
    answer: "a) six thousand and five, b) six thousand and fifty, c) six thousand five hundred.",
    hint: "The zeros are silent, but they are what set each digit's place.",
  },
  term: ["Number name", "A number written out in words rather than in digits"],
  mistake: ["Dropping a zero when writing a number from its name",
    "Four thousand and six is 4,006, not 46 — read your digits back and check you land on the same number"],
  rule: { title: "Reading and Writing Number Names",
    text: "A number can be written in digits or in words, and saying it aloud is the bridge between the two." },
};

/* ---- applying one addition ------------------------------------------------ */

const pad2 = (n) => String(n).padStart(2, "0");

function nextOutcomeId(u) {
  const seen = [];
  for (const k of ["methods", "workedExamples", "fluency", "explorations", "visualModels"]) {
    for (const item of u[k] || []) if (item.outcomeId) seen.push(item.outcomeId);
  }
  const max = seen.reduce((m, id) => {
    const n = Number(String(id).replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, u.outcomes.length);
  return "lo" + pad2(max + 1);
}

function apply(spec) {
  const file = path.join(unitsDir, `unit-${spec.unit}.json`);
  const raw = fs.readFileSync(file, "utf8");
  const u = JSON.parse(raw);

  // Refuse if re-serialising would rewrite the file's shape -- the diff must be the
  // teaching that was added, not 1,700 lines of reformatting.
  if (JSON.stringify(u, null, 2) + "\n" !== raw) {
    return { file, skipped: "would reformat the whole file; not touching it" };
  }
  if (u.concepts.some((c) => c.id === spec.conceptId)) {
    return { file, skipped: "already applied" };
  }

  const lo = nextOutcomeId(u);
  const changes = [];

  u.outcomes.push(spec.outcome);
  u.selfAssessment.push(spec.selfAssessment);
  changes.push(`outcome ${lo}`);

  u.concepts.push({ id: spec.conceptId, title: spec.concept.title,
    explanation: spec.concept.explanation, example: spec.concept.example });
  changes.push("1 concept");

  u.methods.push({ id: `method-${u.methods.length + 1}`, outcomeId: lo,
    difficulty: "Core", title: spec.method.title, example: spec.method.example,
    steps: spec.method.steps });
  changes.push("1 method");

  for (const w of spec.workedExamples) {
    u.workedExamples.push({ id: `we${pad2(u.workedExamples.length + 1)}`, outcomeId: lo,
      difficulty: "Intermediate", title: w.title, prompt: w.prompt, solution: w.solution });
  }
  changes.push(`${spec.workedExamples.length} worked examples`);

  for (const p of spec.practice) {
    u.practice.push({ id: `p${pad2(u.practice.length + 1)}`, level: p.level,
      prompt: p.prompt, answer: p.answer, hint: p.hint });
  }
  changes.push(`${spec.practice.length} practice items`);

  u.fluency.push({ id: `fl${pad2(u.fluency.length + 1)}`, outcomeId: lo,
    difficulty: "Round 1", prompt: spec.fluency.prompt, answer: spec.fluency.answer,
    hint: spec.fluency.hint, errorFeedback: spec.fluency.hint });
  changes.push("1 fluency item");

  u.reference.rules.push(spec.rule);
  u.reference.terms.push(spec.term);
  u.reference.commonMistakes.push(spec.mistake);
  changes.push("1 rule, 1 term, 1 common mistake");

  const out = JSON.stringify(u, null, 2) + "\n";
  if (write) fs.writeFileSync(file, out, "utf8");
  return { file, lo, changes, bytes: out.length - raw.length };
}

/* ---- run ------------------------------------------------------------------ */

console.log(write ? "WRITING\n" : "DRY RUN -- pass --write to apply\n");
let applied = 0;
for (const spec of [ASSOCIATIVE, NUMBER_NAMES]) {
  const r = apply(spec);
  const name = path.basename(r.file);
  if (r.skipped) {
    console.log(`  ${spec.objective}  ${name}  skipped: ${r.skipped}`);
    continue;
  }
  applied += 1;
  console.log(`  ${spec.objective}  ${name}  ${r.lo}  +${r.bytes} bytes`);
  for (const c of r.changes) console.log(`      ${c}`);
}
console.log(`\n${applied} unit(s) ${write ? "updated" : "would be updated"}.`);
if (applied && write) {
  console.log("The content tier must be re-uploaded for this to reach a learner.");
}
