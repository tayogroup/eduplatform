// Two promises the Mathematics runtime makes to a learner's progress record:
// a section's tick means the mathematics was actually done, and no hint hands
// over the answer.
//
// Both were broken, and both were invisible to every gate here because they are
// runtime logic rather than content. The Fluency sprint completed on its last
// question whatever the score, so twelve wrong answers still reported "Math
// Fluency sprint complete." and ticked the section. The third practice hint
// printed "The reviewed guidance is <answer>", which a learner could type
// straight back to mark the question correct. Neither cost much while grading
// accepted any substring and nothing could be failed; both cost the sections
// their meaning once grading started checking what the answer asserts.
//
//   node tools/check-math-progress-integrity.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const subject = path.join(here, "..", "src", "prototypes", "ehel-academy", "shell", "subjects", "mathematics.js");
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");

const source = fs.readFileSync(subject, "utf8");
const failures = [];
const fail = (message) => failures.push(message);

// A gate that cannot find what it checks must say so. Reporting "✓" after
// matching nothing is the failure this whole file exists to prevent.
const mustFind = (label, pattern) => {
  const found = source.match(pattern);
  if (!found) fail(`${label}: not found in shell/subjects/mathematics.js — if this moved, re-point the gate rather than deleting it`);
  return found;
};

// ------------------------------------------------- 1. the hint escalation
// Every copy is checked, not a fixed number of them. The reveal had to be
// removed twice, because the Stage 1-4 deck carries its own hint array beside
// the grid's, and a gate that looked at one site would have passed a course
// that still gave the answer away on every stage up to 4.
const hintLines = source.split("\n")
  .map((text, index) => ({ text, line: index + 1 }))
  .filter(({ text }) => text.includes("const hints = [item.hint,"));

if (!hintLines.length) {
  fail("practice hints: no `const hints = [item.hint, …]` array found — re-point the gate rather than deleting it");
} else {
  const units = [];
  for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
    const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
      units.push({ label: `${gradeDir}/${file}`, unit: JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8")) });
    }
  }

  for (const { text, line } of hintLines) {
    const build = new Function("item", "course", `return ${text.trim().replace(/^const hints = /, "").replace(/;$/, "")}`);
    let leaked = 0, checked = 0;
    for (const { label, unit } of units) {
      for (const item of unit.practice || []) {
        if (typeof item.answer !== "string" || !item.answer.trim()) continue;
        checked += 1;
        const hints = build(item, { unit: unit.unit });
        // Hint 1 is the unit's own authored hint and is content, not this
        // file's business: 9 Stage 1 hints legitimately count to the answer
        // ("Start at 10 … count on 4: 11, 12, 13, 14." for 14), because at that
        // stage counting to it IS the method. What is checked is every hint
        // this module composes — index 1 onwards.
        for (let index = 1; index < hints.length; index += 1) {
          if (String(hints[index]).includes(String(item.answer))) {
            leaked += 1;
            if (leaked === 1) fail(`practice hints (line ${line}): hint ${index + 1} contains the answer — ${label} ${item.id}: ${JSON.stringify(String(item.answer).slice(0, 40))}`);
          }
        }
      }
    }
    if (!checked) fail(`practice hints (line ${line}): no practice items were checked`);
    if (leaked > 1) fail(`practice hints (line ${line}): ${leaked} composed hints contain their answer in total`);
  }
}

// ------------------------------------------------ 2. the fluency threshold
// The completion call has to be guarded by the score. Asserted against the
// source because it is control flow rather than a value — if this is
// restructured the gate fails loudly and asks to be re-pointed.
mustFind("fluency completion", /if \(score >= needed\) complete\("fluency"/);
if (/(?<!if \(score >= needed\) )complete\("fluency"/.test(source)) {
  fail("fluency completion: a `complete(\"fluency\", …)` call is not guarded by the score");
}

// Falling short must offer another run. Without one the sprint disables its
// check button and the section can never be completed, and a section that
// cannot be completed holds the rest of the grade shut for good.
mustFind("fluency retry control", /id="retry-fluency"/);
mustFind("fluency retry handler", /#retry-fluency"\)\.addEventListener\("click", renderFluency\)/);

// The threshold itself is behavioural, so it is evaluated rather than read.
const needed = mustFind("fluency threshold", /const needed = (Math\.ceil\([^;]+)\);/);
if (needed) {
  const threshold = new Function("items", "course", `return ${needed[1]})`);
  let units = 0, tooLow = 0, tooHigh = 0;
  const seen = new Set();
  for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
    const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8"));
      const items = unit.fluency || [];
      if (!items.length) continue;
      units += 1;
      const need = threshold(items, unit);
      seen.add(`${items.length}→${need}`);
      // A threshold of 0 or 1 is the unconditional tick wearing a guard; a
      // threshold above the item count can never be met and shuts the grade.
      if (need <= 1) { tooLow += 1; fail(`fluency threshold: ${gradeDir}/${file} needs only ${need} of ${items.length} — that is not a pass mark`); }
      if (need > items.length) { tooHigh += 1; fail(`fluency threshold: ${gradeDir}/${file} needs ${need} of ${items.length} — unreachable, the section could never complete`); }
    }
  }
  if (!units) fail("fluency threshold: no unit carries a fluency module");
  console.log(`math progress integrity: ${units} units, threshold ${[...seen].join(", ")}`);
}

console.log(`   practice hint arrays checked    : ${hintLines.length} (deck and grid each carry one)`);

if (failures.length) {
  console.error(`\n✗ ${failures.length} progress-integrity failure(s):`);
  for (const message of failures.slice(0, 20)) console.error(`   ${message}`);
  if (failures.length > 20) console.error(`   … and ${failures.length - 20} more`);
  process.exit(1);
}
console.log("\n✓ math progress integrity: fluency completes only on a pass and offers a retry; no composed hint reveals its answer");
