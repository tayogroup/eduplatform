// Write exploration questions for concepts whose unit contains none that fits.
//
// repair-ehel-math-exploration-pairing.mjs moved every question to the best
// explainer available in its unit. What is left are concepts the unit simply
// never had a question for, so the fix is to write one rather than move one.
//
// Candidates come from a topic-overlap scan, but that scan is only a shortlist:
// roughly half its hits are cards where the question is numeric or symbolic and
// shares no vocabulary with its explainer while matching it perfectly ("Adding
// Ones to Two-Digit Numbers" asking "41 + 6"). Every entry below was read and
// judged by hand; the scan decided what to look at, not what to change.
//
// Each entry is guarded by the question it expects to replace. If that has
// moved, the tool stops rather than overwriting something else.
//
//   node tools/author-ehel-math-exploration-questions.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

const QUESTIONS = [
  {
    grade: 2, unit: "unit-1", id: "explore-6", teaches: "Comparing and Ordering Numbers",
    replaces: "Circle the even numbers: 12, 17, 24, 35, 40, 61.",
    prompt: "Compare using < or >: a) 47 ___ 74 b) 85 ___ 58. Then put these in order, smallest first: 62, 26, 46.",
    answer: "a) 47 < 74, b) 85 > 58. In order: 26, 46, 62.",
    hint: "Look at the tens digit first — the number with more tens is greater. Only when the tens are equal do you compare the ones.",
  },
  {
    grade: 2, unit: "unit-2", id: "explore-4", teaches: "2D Shapes and Polygons",
    replaces: "Name each 3D shape: a) a ball b) a dice c) a tin of soup.",
    prompt: "Name the 2D shape with: a) 3 straight sides b) 4 equal straight sides c) 6 straight sides.",
    answer: "a) triangle, b) square, c) hexagon.",
    hint: "Count the straight sides. A polygon is named by how many sides it has, so counting the sides names the shape.",
  },
  {
    grade: 2, unit: "unit-5", id: "explore-5", teaches: "Subtracting Ones from Two-Digit Numbers",
    replaces: "Count in fives: 5, 10, 15, ___, ___, ___.",
    prompt: "Take away the ones: a) 48 − 5 b) 36 − 4 c) 72 − 6 d) 55 − 9.",
    answer: "a) 43, b) 32, c) 66, d) 46.",
    hint: "Keep the tens and take the ones away. In 55 − 9 you cross a ten, so count back to 50 first, then take away 4 more.",
  },
  {
    grade: 2, unit: "unit-8", id: "explore-6", teaches: "Equivalent Fractions – ½ and ²⁄₄",
    replaces: "Round each to the nearest 10: a) 32 b) 65 c) 17 d) 94.",
    prompt: "True or false: a) ½ is the same amount as ²⁄₄ b) ½ is the same amount as ¾ c) ²⁄₄ of 8 dates is 4 dates.",
    answer: "a) True, b) False, c) True.",
    hint: "Fold a paper strip in half, then fold it in half again. Two of the four parts cover exactly the same amount as one of the two halves.",
  },
  {
    grade: 2, unit: "unit-10", id: "explore-3", teaches: "Rounding and Adjusting (Compensation)",
    replaces: "Halve these: a) 8 b) 12 c) 16.",
    prompt: "Add the round number, then adjust: a) 34 + 9 b) 57 + 9 c) 26 + 19.",
    answer: "a) 34 + 10 − 1 = 43, b) 57 + 10 − 1 = 66, c) 26 + 20 − 1 = 45.",
    hint: "Adding 9 is adding 10 and then giving 1 back. Adding 19 is adding 20 and giving 1 back.",
  },
  {
    grade: 2, unit: "unit-11", id: "explore-6", teaches: "The Circle and Its Centre",
    replaces: "True or false: a straight angle looks like a straight line.",
    prompt: "True or false: a) a circle has no corners b) a circle has 4 straight sides c) every point on the rim of a circle is the same distance from its centre.",
    answer: "a) True, b) False, c) True.",
    hint: "Trace the rim of a cooking pot with your finger. There is no corner to stop at, and the rim stays the same distance from the middle the whole way round.",
  },
  {
    grade: 3, unit: "unit-3", id: "explore-4", teaches: "Subtracting Across Zeros",
    replaces: "How many shillings and cents? a) Sh 4.35 b) Sh 7.05 c) Sh 0.75.",
    prompt: "Subtract across the zeros: a) 400 − 256 b) 700 − 24 c) 600 − 145.",
    answer: "a) 144, b) 676, c) 455.",
    hint: "There is nothing to borrow from a zero, so keep going left until you reach a digit you can borrow from. In 400 − 256, take 1 hundred from the 4 to make 3 hundreds and 10 tens, then take 1 of those tens for the ones.",
  },
  {
    grade: 3, unit: "unit-9", id: "explore-2", teaches: "Adding with the Expanded Form and Number Line Methods",
    replaces: "Subtract with the column method: a) 632 − 347 b) 523 − 168 c) 861 − 374.",
    prompt: "Work out 346 + 275 twice: first with the expanded form, then by counting on along a number line. Do both methods agree?",
    answer: "Expanded form: 300 + 200 = 500, 40 + 70 = 110, 6 + 5 = 11, and 500 + 110 + 11 = 621. Number line: start at 346, jump 200 to 546, jump 70 to 616, jump 5 to 621. Both give 621.",
    hint: "For the expanded form, split both numbers into hundreds, tens and ones and add each place on its own. For the number line, start at the first number and jump the hundreds, then the tens, then the ones.",
  },
  {
    grade: 3, unit: "unit-11", id: "explore-5", teaches: "Interpreting Remainders in Real Life",
    replaces: "Write the full fact family for 9 × 6 = 54.",
    prompt: "26 children are going out in boats and each boat holds 4 children. a) Work out 26 ÷ 4. b) How many boats are needed, and why is that not the same as your division answer?",
    answer: "a) 26 ÷ 4 = 6 remainder 2. b) 7 boats, because the 2 children left over still need a boat of their own, so the answer is rounded up.",
    hint: "Do the division first, then go back to the story and ask what happens to the leftover. Sometimes it is ignored, and sometimes — as here — it needs a whole extra group.",
  },
  {
    grade: 3, unit: "unit-17", id: "explore-3", teaches: "Growing Patterns and Their Rules",
    replaces: "Continue the repeating pattern for three terms: red, blue, red, blue, ___, ___, ___.",
    prompt: "Continue each growing pattern for two more terms and name its rule: a) 3, 6, 9, 12, ___, ___ b) 2, 4, 8, 16, ___, ___.",
    answer: "a) 15, 18 — the rule is add 3 each time. b) 32, 64 — the rule is double each time.",
    hint: "Look at the jump from each term to the next. If the jump is always the same size you are adding; if each term is a multiple of the one before, you are multiplying.",
  },
  {
    grade: 4, unit: "unit-3", id: "explore-2", teaches: "Inverse Operations – the Key to Missing Numbers",
    replaces: "Round each number to the nearest 100: a) 438 b) 762 c) 1256.",
    prompt: "Use the inverse to find each missing number: a) 37 + ___ = 82 b) ___ − 46 = 125 c) 8 × ___ = 96.",
    answer: "a) 45, because 82 − 37 = 45. b) 171, because 125 + 46 = 171. c) 12, because 96 ÷ 8 = 12.",
    hint: "Undo the operation you can see. A missing part of an addition is found by subtracting, a missing start of a subtraction by adding, and a missing factor by dividing.",
  },
  {
    grade: 4, unit: "unit-15", id: "explore-5", teaches: "Tests of Divisibility",
    replaces: "Compare with < or >: a) −4 __ −7 b) 3 __ −2 c) −6 __ 2.",
    prompt: "Use the divisibility tests: a) Is 246 divisible by 3? b) Is 1,530 divisible by both 5 and 10? c) Is 784 divisible by both 2 and 4?",
    answer: "a) Yes — the digits add to 2 + 4 + 6 = 12, and 12 divides by 3. b) Yes to both — it ends in 0. c) Yes to both — it is even, and its last two digits, 84, divide by 4.",
    hint: "Test for 3 with the digit sum, for 5 and 10 with the last digit, for 2 with whether the number is even, and for 4 with the last two digits.",
  },
  {
    grade: 4, unit: "unit-15", id: "explore-6", teaches: "Sorting Numbers with Venn Diagrams",
    replaces: "List the first eight multiples of 3.",
    prompt: "A Venn diagram has one ring for 'multiples of 3' and another for 'even numbers'. Where does each of these go: 9, 12, 14, 25?",
    answer: "9 goes in the multiples of 3 ring only. 12 goes in the overlap, being both a multiple of 3 and even. 14 goes in the even ring only. 25 goes outside both rings.",
    hint: "Test each number against both properties in turn. One that passes both belongs in the overlap; one that passes neither sits outside the rings altogether.",
  },
  {
    grade: 4, unit: "unit-17", id: "explore-3", teaches: "An Efficient Method for Division",
    replaces: "Multiply using the column method: a) 34 × 7 b) 63 × 5 c) 28 × 4.",
    prompt: "Divide using an efficient written method: a) 96 ÷ 4 b) 175 ÷ 5 c) 138 ÷ 6.",
    answer: "a) 24, b) 35, c) 23.",
    hint: "Split the number into parts that divide easily. For 96 ÷ 4, take 80 ÷ 4 = 20 and 16 ÷ 4 = 4, then add them to get 24.",
  },
  {
    grade: 4, unit: "unit-18", id: "explore-1", teaches: "The Eight Compass Directions",
    replaces: "Write the four main compass directions in clockwise order, starting from North.",
    prompt: "Write all eight compass directions in clockwise order, starting from North.",
    answer: "North, North-East, East, South-East, South, South-West, West, North-West.",
    hint: "Write the four main directions first, then name the one that sits between each pair. An in-between direction takes both names, such as North-East between North and East.",
  },
  {
    grade: 4, unit: "unit-18", id: "explore-5", teaches: "Understanding Reflections",
    replaces: "True or false: moving East increases the x-coordinate.",
    prompt: "A triangle sits to the left of a vertical mirror line. After it is reflected: a) which way does it face? b) does its size change? c) a corner was 3 squares from the line — how far is it now?",
    answer: "a) It faces the opposite way, as though flipped over. b) No — a reflection never changes size or shape. c) Still 3 squares, but on the other side of the line.",
    hint: "Fold the paper along the mirror line. The reflected shape lands exactly on top of the original, which is why every distance from the line stays the same.",
  },
];

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const cache = new Map();
const applied = [];
let alreadyDone = 0;
const problems = [];

for (const q of QUESTIONS) {
  const file = path.join(mathRoot, `grade-${q.grade}`, "data", "units", `${q.unit}.json`);
  if (!fs.existsSync(file)) { problems.push(`grade-${q.grade}/${q.unit}: file missing`); continue; }
  if (!cache.has(file)) cache.set(file, JSON.parse(fs.readFileSync(file, "utf8")));
  const unit = cache.get(file);
  const card = (unit.explorations || []).find((e) => e.id === q.id);
  if (!card) { problems.push(`grade-${q.grade}/${q.unit} ${q.id}: card not found`); continue; }
  if (norm(card.title) !== norm(q.teaches)) { problems.push(`grade-${q.grade}/${q.unit} ${q.id}: teaches "${norm(card.title)}", expected "${q.teaches}"`); continue; }
  // Already written on an earlier run: idempotent, not an error. Only a card
  // holding neither the old question nor the new one means something moved.
  if (norm(card.prompt) === norm(q.prompt)) { alreadyDone += 1; continue; }
  if (norm(card.prompt) !== norm(q.replaces)) { problems.push(`grade-${q.grade}/${q.unit} ${q.id}: question has moved — found "${norm(card.prompt).slice(0, 60)}"`); continue; }
  applied.push({ where: `grade-${q.grade}/${q.unit} ${q.id}`, teaches: q.teaches, from: q.replaces, to: q.prompt });
  card.prompt = q.prompt;
  card.answer = q.answer;
  card.hint = q.hint;
}

if (problems.length) {
  console.error(`ERROR: ${problems.length} entr(ies) did not match; nothing written:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
if (write) for (const [file, unit] of cache) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");

console.log(`${write ? "APPLIED" : "DRY RUN"} — ${applied.length} question(s) written\n`);
for (const a of applied) {
  console.log(`  ${a.where} — ${a.teaches}`);
  console.log(`    -  ${a.from}`);
  console.log(`    +  ${a.to}\n`);
}
if (!write) console.log("Re-run with --write to apply.");
