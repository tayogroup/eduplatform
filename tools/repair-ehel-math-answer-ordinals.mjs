// Strip the stray leading "1) " from built Mathematics answers.
//
// The source answer blocks read "Section 1: 1) 43, 45, 47. 2) a) 2 tens…" and
// the builder splits them apart on their ordinals. Its split anchored on
// whitespace alone (`/\s+\d+\)\s*/`), and after the "Section N:" header is
// stripped the FIRST ordinal sits at position 0 where `\s+` has nothing to
// match. So answers 2..n were split cleanly and answer 1 kept its prefix:
//
//   "1) a) 3, b) 8, c) 5."      instead of      "a) 3, b) 8, c) 5."
//
// Learners read that back whenever an answer is revealed. Because only the
// first answer of each of the four sections was hit, it survived review — but
// each one is copied into practice, fluency, explorations, realProblems,
// workedExamples and reasoningPrompts, so it reaches 1,634 strings in 117 units.
//
// build-ehel-math-runtime.js is fixed (`/(?:^|\s+)\d+\)\s*/`), which stops it
// recurring. This repairs the data already on disk.
//
//   node tools/repair-ehel-math-answer-ordinals.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

const LEADING_ORDINAL = /^(\s*)1\)\s+/;
// A string that goes on to a step "2)" is a genuine numbered list — an answer
// whose steps are numbered — not the split artefact. One exists (grade-6/unit-17,
// a two-step translate-then-reflect answer) and stripping its "1)" would leave a
// list that starts at step 2. Held back and reported rather than guessed at.
//
// The test needs both halves. Matching a bare digit before ")" reads the closing
// paren of an expression as an ordinal — "2 × (8 + 5) = 2 × 13" contains " 5) "
// — and held back four correct repairs. So require the ordinal to open a new
// clause after sentence punctuation, and to be specifically "2)": a list that
// starts at 1) continues at 2), and nothing else is evidence of a list.
const CONTINUES = /[.;:]\s+2\)\s/;

const repaired = [];
const heldBack = [];
let filesChanged = 0;

// Rewrites strings in place, recording where each change landed.
function walk(value, at, onFix) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === "string") { const next = onFix(item, `${at}[${index}]`); if (next !== item) value[index] = next; }
      else walk(item, `${at}[${index}]`, onFix);
    });
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const path = at ? `${at}.${key}` : key;
      if (typeof item === "string") { const next = onFix(item, path); if (next !== item) value[key] = next; }
      else walk(item, path, onFix);
    }
  }
}

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let changed = 0;

    walk(unit, "", (text, at) => {
      if (!LEADING_ORDINAL.test(text)) return text;
      if (CONTINUES.test(text)) { heldBack.push(`${gradeDir}/${file} ${at}: "${text.slice(0, 70)}"`); return text; }
      changed += 1;
      repaired.push(`${gradeDir}/${file} ${at}: "${text.slice(0, 60)}"`);
      return text.replace(LEADING_ORDINAL, "$1");
    });

    if (changed) {
      filesChanged += 1;
      if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
    }
  }
}

console.log(`${write ? "REPAIRED" : "DRY RUN"} — ${repaired.length} string(s) in ${filesChanged} file(s)`);
for (const line of repaired.slice(0, 20)) console.log(`   ${line}`);
if (repaired.length > 20) console.log(`   … and ${repaired.length - 20} more`);
if (heldBack.length) {
  console.log(`\n${heldBack.length} left for a human (genuine numbered list):`);
  for (const line of heldBack) console.log(`   ${line}`);
}
if (!write) console.log("\nRe-run with --write to apply.");
