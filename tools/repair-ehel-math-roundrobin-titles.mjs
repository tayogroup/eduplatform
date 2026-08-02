// Replace 26 auto-generated "<concept> — example <n>" worked-example titles.
//
// These were not written for the examples they sit above. The concept is
// picked by position — concepts[index % conceptCount] — so it drifts away from
// the content as the list goes on, and the heading ends up naming a topic the
// question does not teach:
//
//   "Reading Half Past Times — example 11"  above  "The Missing Month: April, May, ___, July"
//   "Subtracting by Counting Back — example 10"  above  "11 add 7 is ____"
//   "Positive and Negative Numbers — example 11"  above  "Line up correctly and add: 25.7 + 8.45"
//   "Ten-Frames — example 7"  above  "0 · 1 · ___ · 3 · ___ · 5"
//
// That is worse than a redundant title: the heading tells the learner the
// wrong thing, and because the title is narrated ("title. prompt. Solution:
// solution") the clip says it out loud before reading the question.
//
// A few land on the right concept by coincidence, but "<concept> — example
// <n>" is filler either way — the other ~1,400 examples use a short phrase
// naming what the example actually does, and these now do too.
//
// Keyed by grade, unit, example id AND the exact current title, so a title
// that has already been replaced cannot be replaced again and a key that stops
// matching fails the run instead of passing quietly.
//
//   node tools/repair-ehel-math-roundrobin-titles.mjs [--write]
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
  [1, 1, "we01", "Counting Real Objects (one-to-one) — example 1", "Counting dates one at a time"],
  [1, 1, "we06", "Counting Real Objects (one-to-one) — example 6", "Filling the gaps from 1 to 10"],
  [1, 1, "we07", "Ten-Frames — example 7", "Filling the gaps from 0 to 5"],
  [1, 1, "we09", "Estimating Then Counting — example 9", "Counting eight fish by touch"],
  [1, 1, "we10", "Comparing and Ordering — example 10", "Counting two moons"],
  [1, 1, "we11", "Counting Real Objects (one-to-one) — example 11", "Counting nine anjero"],
  [1, 2, "we06", "Sorting Shapes and Finding Them in Everyday Objects — example 6", "Matching everyday objects to shape names"],
  [1, 2, "we09", "Faces, Edges and Curved Surfaces — example 9", "Why a ball is a sphere"],
  [1, 2, "we10", "Rolling and Stacking — example 10", "Why a box is a cube"],
  [1, 13, "we08", "Checking Your Answer — example 8", "Adding 4 by counting on"],
  [1, 13, "we09", "Adding by Counting On — example 9", "Counting on three from 16"],
  [1, 13, "we10", "Subtracting by Counting Back — example 10", "Adding 7 by counting on"],
  [1, 13, "we12", "Combining and Taking Away in Stories — example 12", "Counting back to subtract"],
  [1, 15, "we01", "The Days of the Week — example 1", "Saying the days of the week in order"],
  [1, 15, "we02", "Yesterday, Today and Tomorrow — example 2", "Yesterday and tomorrow from Wednesday"],
  [1, 15, "we03", "The Months of the Year — example 3", "Saying the months of the year in order"],
  [1, 15, "we04", "Reading O'Clock Times — example 4", "Reading an o'clock time"],
  [1, 15, "we05", "Reading Half Past Times — example 5", "Reading a half past time"],
  [1, 15, "we06", "Putting Events in Order — example 6", "Putting a morning in order"],
  [1, 15, "we07", "The Days of the Week — example 7", "The day before and after Thursday"],
  [1, 15, "we08", "Yesterday, Today and Tomorrow — example 8", "The month before and after June"],
  [1, 15, "we09", "The Months of the Year — example 9", "Naming tomorrow from today"],
  [1, 15, "we10", "Reading O'Clock Times — example 10", "Naming yesterday from today"],
  [1, 15, "we11", "Reading Half Past Times — example 11", "Finding the missing month"],
  [1, 15, "we12", "Putting Events in Order — example 12", "Reading the time from the clock hands"],
  [5, 5, "we11", "Positive and Negative Numbers — example 11", "Lining up decimals to add"],
];

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

if (missing.length) process.exit(1);
