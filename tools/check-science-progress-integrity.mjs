// Two promises the Science runtime makes to a learner's progress record: a
// section's tick means the science was actually done, and no hint hands over
// the answer.
//
// Both were broken, both were invisible to every gate here because they are
// control flow rather than content, and both were fixed with only a hand-run
// script as evidence. The Fluency sprint completed on its last question
// whatever the score, so twelve wrong answers still reported "Science Fluency
// sprint complete." and ticked the section. The third practice hint printed
// "The reviewed guidance is <answer>", which a learner could type straight
// back. Neither cost much while grading accepted any substring and nothing
// could be failed; both cost their section its meaning once grading started
// asking the learner to have understood something.
//
// This is the sibling of check-math-progress-integrity.mjs. It is deliberately
// STRICTER in one place: Mathematics has to exempt hint 1, because 9 of its
// Stage 1 hints legitimately count to the answer ("Start at 10 … count on 4:
// 11, 12, 13, 14." for 14) — at that stage counting to it IS the method. No
// Science hint does that: measured, 0 of 636. So every hint is checked here,
// authored and composed alike, and the day an authored one starts giving the
// answer away this says so.
//
//   node tools/check-science-progress-integrity.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const subject = path.join(here, "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "science.js");
const scienceRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "science");

const source = fs.readFileSync(subject, "utf8");
const failures = [];
const fail = (message) => failures.push(message);

// Comment lines are stripped before any source assertion: the notes in
// science.js quote the very strings being searched for, so a naive scan reports
// the explanation of a bug as the bug.
const codeLines = source.split("\n").map((text) => (text.trim().startsWith("//") ? "" : text));
const code = codeLines.join("\n");

const mustFind = (label, pattern) => {
  if (!pattern.test(code)) {
    fail(`${label}: not found in shell/subjects/science.js — if this moved, re-point the gate rather than deleting it`);
    return false;
  }
  return true;
};

// ------------------------------------------------------------ the units
const units = [];
for (const gradeDir of fs.readdirSync(scienceRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(scienceRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    units.push({ label: `${gradeDir}/${file}`, unit: JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8")) });
  }
}
if (units.length < 40) fail(`only ${units.length} units found — the gate is not seeing the course`);

// ------------------------------------------------- 1. the hint escalation
// Every copy is checked, not a fixed number of them. Stages 1-4 render both
// designs, so the hint array exists twice, and a gate reading one site would
// pass a course still giving the answer away on every stage up to 4. That is
// not hypothetical: the reveal had to be removed from both, and the grading
// rule before it had to be moved onto three separate call sites.
const hintLines = codeLines
  .map((text, index) => ({ text, line: index + 1 }))
  .filter(({ text }) => text.includes("const hints = [item.hint,"));

if (!hintLines.length) {
  fail("practice hints: no `const hints = [item.hint, …]` array found — re-point the gate rather than deleting it");
} else {
  for (const { text, line } of hintLines) {
    const build = new Function("item", "course", `return ${text.trim().replace(/^const hints = /, "").replace(/;$/, "")}`);
    let checked = 0, leaked = 0, firstLeak = "";
    for (const { label, unit } of units) {
      for (const item of unit.practice || []) {
        if (typeof item.answer !== "string" || !item.answer.trim()) continue;
        checked += 1;
        for (const [index, hint] of build(item, { unit: unit.unit }).entries()) {
          if (String(hint).includes(String(item.answer))) {
            leaked += 1;
            if (!firstLeak) firstLeak = `hint ${index + 1} — ${label} ${item.id}: ${JSON.stringify(String(item.answer).slice(0, 45))}`;
          }
        }
      }
    }
    if (!checked) fail(`practice hints (line ${line}): no practice items were checked`);
    if (leaked) fail(`practice hints (line ${line}): ${leaked} hint(s) contain their own answer — first: ${firstLeak}`);
  }
}

// ----------------------------------------------- 2. the fluency threshold
// Control flow, so asserted against the source. If it is restructured this
// fails loudly and asks to be re-pointed rather than quietly matching nothing.
mustFind("fluency completion", /if \(score >= needed\) complete\("fluency"/);
if (/(?<!if \(score >= needed\) )complete\("fluency"/.test(code)) {
  fail('fluency completion: a `complete("fluency", …)` call is not guarded by the score');
}

// Falling short must offer another run. Without one the sprint disables its own
// Check button and the section can never be completed, and a section that
// cannot be completed holds the rest of the grade shut for good.
mustFind("fluency retry control", /id="retry-fluency"/);
mustFind("fluency retry handler", /#retry-fluency"\)\.addEventListener\("click", renderFluency\)/);

// The threshold itself is behavioural, so it is evaluated rather than read.
const needed = code.match(/const needed = (Math\.ceil\([^;]+)\);/);
if (!needed) {
  fail("fluency threshold: `const needed = Math.ceil(…)` not found — re-point the gate rather than deleting it");
} else {
  const threshold = new Function("items", "course", `return ${needed[1]})`);
  const shapes = new Set();
  let withFluency = 0;
  for (const { label, unit } of units) {
    const items = unit.fluency || [];
    if (!items.length) continue;
    withFluency += 1;
    const need = threshold(items, unit);
    shapes.add(`${items.length}→${need}`);
    // 0 or 1 is the unconditional tick wearing a guard; above the item count
    // can never be met and shuts the grade.
    if (need <= 1) fail(`fluency threshold: ${label} needs only ${need} of ${items.length} — that is not a pass mark`);
    if (need > items.length) fail(`fluency threshold: ${label} needs ${need} of ${items.length} — unreachable, the section could never complete`);
  }
  if (!withFluency) fail("fluency threshold: no unit carries a fluency module");
  console.log(`science progress integrity: ${withFluency} units, threshold ${[...shapes].join(", ")}`);
}

console.log(`   practice hint arrays checked    : ${hintLines.length} (deck and grid each carry one)`);
console.log(`   hints checked per array         : every hint, including the authored one`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} progress-integrity failure(s):`);
  for (const message of failures.slice(0, 20)) console.error(`   ${message}`);
  if (failures.length > 20) console.error(`   … and ${failures.length - 20} more`);
  process.exit(1);
}
console.log("\n✓ science progress integrity: fluency completes only on a pass and offers a retry; no hint reveals its answer");
