// Finish the eleven Exploration explainers that survived the mechanical repair
// still hollow — they announce a list, a rule or a formula that the clipped
// source never delivered ("the formula for theoretical probability." and then
// nothing). repair-ehel-math-truncated-explainers.mjs can only recombine text
// that already exists, so these needed the missing facts written.
//
// Each entry keeps the wording that is already there and supplies only what was
// promised. Every replacement is guarded by the opening of the current text, so
// if the content moves the tool fails instead of overwriting something else.
//
//   node tools/complete-ehel-math-thin-explainers.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

const COMPLETIONS = [
  { grade: 2, unit: "unit-1", id: "explore-3", startsWith: "Different Ways to Show a Number:",
    text: "Different Ways to Show a Number: One number can wear many different clothes. Take the number 36. We can show it as a picture, with 3 sticks of ten and 6 single dots. We can write it in digits as 36. We can write it in words as thirty-six. We can say it in place value as 3 tens and 6 ones. We can write it in expanded form as 30 + 6. Every one of these is the same number, just dressed differently." },

  { grade: 3, unit: "unit-6", id: "explore-3", startsWith: "Converting Between Units:",
    text: "Converting Between Units: Here are the key metric conversions to learn by heart. For length, 10 millimetres (mm) = 1 centimetre (cm), 100 centimetres = 1 metre (m), and 1000 metres = 1 kilometre (km). For mass, 1000 grams (g) = 1 kilogram (kg). For capacity, 1000 millilitres (ml) = 1 litre (l). To change a larger unit into a smaller one you multiply; to change a smaller unit into a larger one you divide." },

  { grade: 4, unit: "unit-2", id: "explore-1", startsWith: "Units of Time and Converting Between Them:",
    text: "Units of Time and Converting Between Them: Time is measured in units, and each unit is built from the one below it. Here are the units you need, from smallest to largest. A second is the smallest unit we use every day, and a single heartbeat is about one second. 60 seconds make 1 minute. 60 minutes make 1 hour. 24 hours make 1 day. 7 days make 1 week. 12 months make 1 year. To change a larger unit into a smaller one you multiply; to change a smaller unit into a larger one you divide." },

  { grade: 4, unit: "unit-13", id: "explore-3", startsWith: "Mental Calculation Strategies:",
    text: "Mental Calculation Strategies: Not every calculation needs columns. For friendly numbers, a mental method is quicker and just as accurate. Here are four powerful mental strategies. Learn to recognise which numbers suit each one. Partitioning splits a number into its places, so 47 + 36 becomes 40 + 30 and 7 + 6, giving 70 + 13 = 83. Compensation rounds to a friendly number and then adjusts, so 68 + 99 becomes 68 + 100 − 1 = 167. Near doubles lean on a double you already know, so 7 + 8 becomes 7 + 7 + 1 = 15. Reordering adds in whichever order is easiest, so 9 + 47 becomes 47 + 9 = 56." },

  { grade: 4, unit: "unit-17", id: "explore-6", startsWith: "Choosing the Right Operation in Word Problems:",
    text: "Choosing the Right Operation in Word Problems: The hardest part of a word problem is often deciding whether to multiply or divide. Here is a reliable guide. If you know how many groups there are and how many are in each group, and you want the total, multiply. If you know the total and how many groups there are, and you want the size of each group, divide. If you know the total and the size of each group, and you want the number of groups, divide as well. Words like 'each', 'per' and 'every' tell you equal groups are involved, while 'shared equally' and 'split between' point to division." },

  { grade: 5, unit: "unit-4", id: "explore-2", startsWith: "The Mode:",
    text: "The Mode: Here is the great thing about the mode: you do not need to put the numbers in order first. You simply count how many times each value appears, and the one with the highest count wins. Let us walk through an example step by step. Take the scores 4, 7, 4, 9, 4, 7. Counting each value gives 4 three times, 7 twice, and 9 once. The highest count belongs to 4, so the mode is 4. If two values tie for the highest count the data has two modes, and if every value appears equally often there is no mode at all." },

  { grade: 5, unit: "unit-9", id: "explore-2", startsWith: "Adding and Subtracting with the Same Denominator:",
    text: "Adding and Subtracting with the Same Denominator: When fractions share a denominator, the work is wonderfully simple. Here is the rule. To add, add the numerators (the top numbers) and keep the denominator the same. To subtract, subtract the numerators and keep the denominator the same. So 3/8 + 2/8 = 5/8, and 7/8 − 3/8 = 4/8, which simplifies to 1/2. The denominator never changes, because the size of each part has not changed — only how many of those parts you have." },

  { grade: 5, unit: "unit-10", id: "explore-6", startsWith: "Drawing Angles with a Protractor:",
    text: "Drawing Angles with a Protractor: Once you can measure an angle, drawing one of a given size is only a small step further. Suppose you want to draw an angle of exactly 65°. Here is the careful method. Draw a straight base line and mark a point on it to be the vertex. Place the centre of the protractor exactly on that point, with the base line running along the protractor's zero line. Read round from zero to 65 and make a small mark at 65°. Lift the protractor away and join the vertex to your mark with a ruler. Check which of the two scales you started from, because reading the wrong one turns 65° into 115°." },

  { grade: 5, unit: "unit-16", id: "explore-1", startsWith: "Units of Time and How They Connect:",
    text: "Units of Time and How They Connect: Here are the key relationships you must know by heart. 60 seconds = 1 minute. 60 minutes = 1 hour. 24 hours = 1 day. 7 days = 1 week. 12 months = 1 year. 365 days = 1 year, and 366 days in a leap year." },

  { grade: 7, unit: "unit-13", id: "explore-5", startsWith: "Calculating Theoretical Probability:",
    text: "Calculating Theoretical Probability: Now we reach the heart of the unit: the formula for theoretical probability. When every outcome is equally likely, the probability of an event is the number of favourable outcomes divided by the total number of possible outcomes, written P(event) = favourable outcomes ÷ total outcomes. Rolling a 4 on a fair dice gives one favourable outcome out of six, so P(4) = 1/6. Every probability lies between 0 and 1, and the probabilities of all the possible outcomes add to 1." },

  { grade: 8, unit: "unit-5", id: "explore-1", startsWith: "The Basic Angle Rules:",
    text: "The Basic Angle Rules: Before we reach parallel lines, we must be completely fluent with three rules you can use anywhere. These are the building blocks for everything that follows, so learn them until they are automatic. First, angles on a straight line add to 180°. Second, angles around a point add to 360°. Third, vertically opposite angles — the pairs formed when two straight lines cross — are equal. With these three alone you can find a surprising number of missing angles before any parallel-line rule is needed." },
];

let applied = 0;
const problems = [];
const touched = new Map();

for (const c of COMPLETIONS) {
  const file = path.join(mathRoot, `grade-${c.grade}`, "data", "units", `${c.unit}.json`);
  if (!fs.existsSync(file)) { problems.push(`${c.grade}/${c.unit}: file missing`); continue; }
  if (!touched.has(file)) touched.set(file, JSON.parse(fs.readFileSync(file, "utf8")));
  const unit = touched.get(file);
  const item = (unit.explorations || []).find((e) => e.id === c.id);
  if (!item) { problems.push(`grade-${c.grade}/${c.unit} ${c.id}: exploration not found`); continue; }
  const current = String(item.explanation || "").trim();
  if (!current.startsWith(c.startsWith)) { problems.push(`grade-${c.grade}/${c.unit} ${c.id}: unexpected opening — ${current.slice(0, 70)}`); continue; }
  if (current === c.text) { problems.push(`grade-${c.grade}/${c.unit} ${c.id}: already complete`); continue; }
  console.log(`  grade-${c.grade}/${c.unit} ${c.id}  ${current.length} → ${c.text.length} chars`);
  item.explanation = c.text;
  applied += 1;
}

if (write && !problems.length) {
  for (const [file, unit] of touched) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
}

console.log(`\n${write ? "APPLIED" : "DRY RUN"} — ${applied} of ${COMPLETIONS.length} explainer(s) completed`);
if (problems.length) {
  console.error(`\nERROR: ${problems.length} entr(ies) did not match; nothing written:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
if (!write) console.log("Re-run with --write to apply.");
