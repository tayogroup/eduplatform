// Correct two titles that 5f148072 replaced with a copy of their own prompt.
//
// That commit fixed 26 round-robin "<concept> — example <n>" titles. Two of
// its replacements landed on wording the prompt already used:
//
//   we07  title "The day before and after Thursday"
//         prompt "The Day Before and After Thursday"
//   we08  title "The month before and after June"
//         prompt "The Month Before and After June"
//
// Differing only in capitalisation, which is exactly the shape 70621720 set
// out to remove: the heading repeats the question, and because narration is
// "title. prompt. Solution: solution" the clip says the same sentence twice
// before reading the answer. Swapping a wrong title for a redundant one is
// still a defect, so these name the method instead — counting one step back
// and one step forward through the sequence, which is what both solutions do.
//
// Keyed on the interim titles, not the originals, because the tree already
// carries 5f148072.
//
//   node tools/repair-ehel-math-duplicate-title-followup.mjs [--write]
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
  [1, 15, "we07", "The day before and after Thursday", "Counting one day back and one forward"],
  [1, 15, "we08", "The month before and after June", "Counting one month back and one forward"],
];

const applied = [], already = [], missing = [];
const byFile = new Map();
for (const [grade, unit, id, from, to] of RETITLE) {
  const file = path.join(mathRoot, `grade-${grade}`, "data", "units", `unit-${unit}.json`);
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ grade, unit, id, from, to });
}

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
for (const a of applied) {
  console.log(`\n    grade-${a.grade}/unit-${a.unit}/${a.id}`);
  console.log(`      -  ${a.from}`);
  console.log(`      +  ${a.to}`);
}
if (!write) console.log("\nRe-run with --write to apply.");

if (missing.length) process.exit(1);
