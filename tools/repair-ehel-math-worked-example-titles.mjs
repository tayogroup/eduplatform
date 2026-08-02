// Give 40 worked examples a title instead of a copy of their own prompt.
//
// A worked example renders its title as the heading above the question, and
// narrates as `${title}. ${prompt}. Solution: ${solution}`. Two shapes were
// broken:
//
//   IDENTICAL (32) — the title is the prompt with its final punctuation
//                    dropped, so the heading says nothing the question does
//                    not, and the clip reads the question twice.
//   ELLIPSIS   (8) — the title is the prompt cut mid-sentence with an ellipsis
//                    ("Look at a ball, a tin of beans, and a box of dates.
//                    Name…"), so the heading is a fragment and the clip reads
//                    "…Name…. Look at a ball…" before starting again.
//
// A wider scan matches 162 examples whose title is a prefix of their prompt,
// but 122 of those are correct: "Subtract by partitioning" heading
// "Subtract by partitioning: a) 68 − 34 b) 79 − 55." is a good short title
// that happens to begin the question. Only the two shapes above are defects,
// so the fix is a fixed list of 40 rather than a rule over the prefix match.
//
// Each replacement is keyed by grade, unit, example id AND the exact current
// title. A key that no longer matches is reported and nothing is written —
// a retitled example must not be silently retitled again.
//
// Titles follow the house style already used by the other ~1,400 examples: a
// short descriptive phrase naming the skill, not a restatement of the numbers
// ("Volume of a cuboid", "Finding all factor pairs").
//
// Note this rewrites narration text. Every example changed here renames its
// clip, so the old file is stranded and the new hash has to be generated
// before the content is deployed — see the ordering in the deploy cycle.
//
//   node tools/repair-ehel-math-worked-example-titles.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

// [grade, unit, exampleId, exact current title, new title]
const RETITLE = [
  [1, 1, "we02", "Say the numbers in order: 4, 5, 6, ___, ___", "Saying the next numbers in order"],
  [1, 2, "we01", "Look at a ball, a tin of beans, and a box of dates. Name…", "Naming 3D shapes around the house"],
  [1, 2, "we02", "How many flat faces does a cube-shaped box of dates have,…", "Counting the flat faces of a cube"],
  [1, 2, "we03", "Give a ball and a box of dates a gentle push on the floor.…", "Testing which shape rolls"],
  [1, 2, "we04", "Look at a round plate, a square floor tile, and a folded…", "Naming 2D shapes at home"],
  [1, 2, "we05", "Count the sides of a triangle drawn on paper and the sides…", "Counting the sides of a triangle and a rectangle"],
  [1, 2, "we07", "Look at an orange and a box of dried dates. Which one can…", "Which shape rolls and which stacks"],
  [1, 2, "we08", "Find a football, a cooking pot lid, and a stack of anjero…", "Sorting home objects into rolls and stacks"],
  [1, 2, "we11", "Count the sides and corners of a square scarf and a…", "Counting sides and corners"],
  [1, 2, "we12", "★ Circle ⭕ has ____ side", "How many sides a circle has"],
  [2, 3, "we09", "Fill in: 1 m = ___ cm, and 2 m = ___ cm", "Converting metres to centimetres"],
  [2, 3, "we11", "Is 1 metre longer or shorter than 70 centimetres", "Comparing a metre with 70 centimetres"],
  [2, 9, "we09", "How many children were surveyed in total", "Finding the survey total"],
  [2, 11, "we10", "How many lines of symmetry does a circle have", "Lines of symmetry in a circle"],
  [3, 2, "we10", "How many learners chose swimming or tennis", "Combining two bars on a chart"],
  [3, 11, "we11", "Use the grid method: 27 × 15", "Multiplying with the grid method"],
  [4, 5, "we11", "Find the common factors of 20 and 30", "Finding common factors"],
  [4, 10, "we09", "How many more children chose water than tea", "Comparing two bars for a difference"],
  [5, 7, "we11", "Circle the largest value: 0.6, 55%, 3/5, 0.58", "Comparing decimals, percentages and fractions"],
  [5, 11, "we11", "Find all the factor pairs of 36", "Finding all the factor pairs"],
  [5, 15, "we10", "A pencil costs 0.75. How much do 4 pencils cost", "Multiplying an amount of money"],
  [5, 16, "we12", "Find the duration from 10:35 pm to 1:20 am", "Finding a duration across midnight"],
  [6, 1, "we10", "Decompose 5.724 in three different ways", "Decomposing a decimal three ways"],
  [6, 7, "we11", "Convert 5 hours 12 minutes into decimal hours", "Converting minutes into decimal hours"],
  [6, 8, "we10", "Add these three decimals: 6.4 + 2.85 + 1.75", "Adding three decimals"],
  [6, 10, "we12", "Calculate 678 × 94, then verify with an estimate", "Long multiplication with an estimate check"],
  [6, 11, "we09", "Find the volume of a cuboid 10 cm × 6 cm × 4 cm", "Volume of a cuboid"],
  [6, 14, "we11", "Calculate 1.4 × 0.3", "Multiplying two decimals"],
  [6, 14, "we12", "Calculate 12.6 ÷ 3", "Dividing a decimal by a whole number"],
  [6, 16, "we11", "Evaluate the nested brackets: 3 × (12 − (4 + 2))", "Working through nested brackets"],
  [6, 17, "we12", "Reflect (0, 4) across the line x = 3", "Reflecting a point across a vertical line"],
  [7, 2, "we10", "Using A = ½bh, find A when b = 10 and h = 7", "Substituting into a formula"],
  [7, 2, "we12", "Expand and simplify: 5(2a + 3) − 2(3a − 4)", "Expanding and simplifying two brackets"],
  [7, 4, "we10", "Find the missing number: 7.8 + ___ = 12.5", "Finding a missing addend"],
  [7, 14, "we10", "Reflect the point (6, 2) in the line x = 3", "Reflecting a point in the line x = 3"],
  [7, 15, "we11", "Find the area of a circle with radius 6 cm", "Area of a circle from its radius"],
  [8, 2, "we11", "Rearrange P = 2l + 2w to make w the subject", "Changing the subject of a formula"],
  [8, 4, "we12", "Calculate 5.4 × 0.7 × 2, showing each step", "Multiplying three decimals step by step"],
  [8, 7, "we12", "Order from smallest to largest: 3/5, 7/10, 2/3", "Ordering fractions by size"],
  [8, 11, "we10", "Are y = 2x + 1 and y = 2x − 4 parallel? Explain", "Testing whether two lines are parallel"],
];

// Group by file so each unit is read and written once.
const byFile = new Map();
for (const [grade, unit, id, from, to] of RETITLE) {
  const file = path.join(mathRoot, `grade-${grade}`, "data", "units", `unit-${unit}.json`);
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ grade, unit, id, from, to });
}

const applied = [], already = [], missing = [];

for (const [file, edits] of byFile) {
  if (!fs.existsSync(file)) { edits.forEach((e) => missing.push({ ...e, why: "unit file not found" })); continue; }
  const unit = JSON.parse(fs.readFileSync(file, "utf8"));
  let dirty = 0;
  for (const e of edits) {
    const ex = (unit.workedExamples || []).find((w) => w.id === e.id);
    if (!ex) { missing.push({ ...e, why: `no worked example ${e.id}` }); continue; }
    const current = String(ex.title || "").trim();
    if (current === e.to) { already.push(e); continue; }
    if (current !== e.from) { missing.push({ ...e, why: `title is now "${current}"` }); continue; }
    ex.title = e.to;
    applied.push(e);
    dirty += 1;
  }
  if (dirty && write) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
}

console.log(`${write ? "APPLIED" : "DRY RUN"}\n`);
console.log(`  retitled        : ${applied.length}`);
console.log(`  already correct : ${already.length}`);
console.log(`  UNMATCHED       : ${missing.length}`);
for (const m of missing) console.log(`    ! grade-${m.grade}/unit-${m.unit}/${m.id}: ${m.why}`);
for (const a of applied.slice(0, 6)) {
  console.log(`\n    grade-${a.grade}/unit-${a.unit}/${a.id}`);
  console.log(`      -  ${a.from}`);
  console.log(`      +  ${a.to}`);
}
if (!write) console.log("\nRe-run with --write to apply.");

// An unmatched key means the data moved under the tool: fail rather than
// report a partial pass as success.
if (missing.length) process.exit(1);
