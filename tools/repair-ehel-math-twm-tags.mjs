// Split the six "critiquing improving" Thinking-and-Working tags in Grades 6-8.
//
// The shell prints this tag verbatim - `Thinking: ${item.twm}` in
// shell/subjects/mathematics.js - so "critiquing improving" reaches a learner's
// screen as two words jammed together with no conjunction. Cambridge names the
// pair "Critiquing and improving"; nothing names it this way.
//
// It is also mostly not a pair. Read against their own prompts, four of the six
// are plainly ONE characteristic:
//
//   grade-6 unit-16 we08  two candidate expressions, decide which works  -> critiquing
//   grade-6 unit-4  we02  find an error and fix it                       -> improving
//   grade-7 unit-16 we07  "explain two problems AND suggest a better one" -> both
//   grade-8 unit-16 we07  "Critique this conclusion"                     -> critiquing
//   grade-8 unit-16 we08  "What is wrong with this conclusion?"          -> critiquing
//   grade-8 unit-6  we05  "Rewrite this question to remove the bias"     -> improving
//
// Only the Grade 7 one asks for both, and it gets the pair's proper name,
// "critiquing and improving", the way the Teacher's Resource writes it.
//
// TWO THINGS TO KNOW BEFORE RUNNING THIS.
//
// First, it edits the BUILT units in place, which is the pattern the
// mathematics CLAUDE.md warns about: `build:math --force` discards this work
// and its only other copy is git history.
//
// Second, and worse: that applies to ALL 145 TWM tags in Grades 6-8, not just
// these six. `twm` appears nowhere in outputs/math-content/math-content-model.json
// and no tool in this repo writes it, so the whole of the TWM pass exists as
// built artefacts with no regeneration path. This tool is now the only file that
// knows the tag exists, and it can restore six of them. That is worth fixing
// properly - by carrying twm in the content model, or by a tool that reassigns
// every tag - and this is not that fix. Grade 9 is unaffected: its tags live in
// build-ehel-math-g9-unit*.mjs and survive a rebuild.
//
//   node tools/repair-ehel-math-twm-tags.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const MATH = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy", "mathematics");
const WRITE = process.argv.includes("--write");
const STALE = "critiquing improving";

const FIXES = [
  ["grade-6", "unit-16.json", "we08", "critiquing"],
  ["grade-6", "unit-4.json", "we02", "improving"],
  ["grade-7", "unit-16.json", "we07", "critiquing and improving"],
  ["grade-8", "unit-16.json", "we07", "critiquing"],
  ["grade-8", "unit-16.json", "we08", "critiquing"],
  ["grade-8", "unit-6.json", "we05", "improving"],
];

let changed = 0, missing = 0;
const byFile = new Map();
for (const [grade, file, id, twm] of FIXES) {
  const key = grade + "/" + file;
  if (!byFile.has(key)) byFile.set(key, []);
  byFile.get(key).push([id, twm]);
}

for (const [key, items] of byFile) {
  const [grade, file] = key.split("/");
  const p = path.join(MATH, grade, "data", "units", file);
  if (!fs.existsSync(p)) { console.log("  !! missing " + key); missing += 1; continue; }
  const raw = fs.readFileSync(p, "utf8");
  const unit = JSON.parse(raw);
  for (const [id, twm] of items) {
    const w = (unit.workedExamples || []).find((e) => e.id === id);
    if (!w) { console.log("  !! " + key + " has no " + id); missing += 1; continue; }
    if (w.twm === twm) { console.log("  = " + key + " " + id + " already " + twm); continue; }
    if (w.twm !== STALE) {
      console.log('  !! ' + key + " " + id + ' reads "' + w.twm + '", not the stale value — left alone');
      missing += 1; continue;
    }
    w.twm = twm;
    console.log("  " + key + " " + id + ': "' + STALE + '" -> "' + twm + '"   (' + w.title + ")");
    changed += 1;
  }
  if (WRITE) fs.writeFileSync(p, JSON.stringify(unit, null, 2) + "\n", "utf8");
}

// nothing anywhere should still carry the jammed value
let left = 0;
for (const grade of fs.readdirSync(MATH).filter((d) => /^grade-\d+$/.test(d))) {
  const dir = path.join(MATH, grade, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    const u = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const w of u.workedExamples || []) if (w.twm === STALE) left += 1;
  }
}

console.log("\n  " + changed + " tag(s) " + (WRITE ? "rewritten" : "would be rewritten") +
  ", " + missing + " not matched, " + left + ' still reading "' + STALE + '"' +
  (WRITE ? "" : "   (--write to save)"));
if (missing) process.exitCode = 1;
