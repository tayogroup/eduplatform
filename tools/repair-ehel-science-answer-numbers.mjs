// Strip the question's number from the front of reviewed Science answers.
//
// The packs print their answer keys as a "Q | answer | why" table, and the
// builder joined the whole row — so the number came through in front of the
// text a learner is shown when they get the question right:
//
//   "1 b) Brain The brain is the control center for thinking and memory."
//
// build-ehel-science-runtime.js now drops that leading cell, which fixes 414 of
// them. The rest cannot be fixed there: they live in script-review.json, because
// the reviewer's workbook was exported from the pre-fix build, so they corrected
// the wording of text that already carried the number and the number rode along
// with their correction. The overlay is applied last, so it puts the defect back.
//
// Edited, not deleted — the same rule the earlier override repair followed.
// Only the leading number is removed; every word the reviewer wrote is kept.
//
//   node tools/repair-ehel-science-answer-numbers.mjs [--write]
//
// Runs as a dry run unless --write is passed. Rebuild afterwards.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const reviewPath = path.join(here, "..", "src", "prototypes", "ehel-academy", "science", "data", "script-review.json");
const write = process.argv.includes("--write");

const LEADING_NUMBER = /^\s*(\d+)[.)]?\s+(?=\S)/;
// The number is only the question's if the field belongs to a numbered item and
// the two agree. Worked examples are offset by one in some units (we02 carries
// question 1), so a difference of one still counts; anything further apart is
// not a question number and is left alone.
const ITEM_INDEX = /\.(?:p|fl|rp|we|reason|q)(\d+)\./;
// A value that goes on to "2." or "2)" is a genuine numbered list — Grade 7's
// electricity safety rules are one — and stripping its "1." would leave a list
// that starts at step 2.
const CONTINUES = /[.;:]\s+2[.)]\s/;

const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
const repaired = [], heldBack = [];

function walk(node, at) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      if (typeof item === "string") { const next = fix(item, `${at}[${index}]`); if (next !== item) node[index] = next; }
      else walk(item, `${at}[${index}]`);
    });
  } else if (node && typeof node === "object") {
    for (const [key, item] of Object.entries(node)) {
      const where = at ? `${at}.${key}` : key;
      if (typeof item === "string") { const next = fix(item, where); if (next !== item) node[key] = next; }
      else walk(item, where);
    }
  }
}

function fix(text, where) {
  const lead = LEADING_NUMBER.exec(text);
  if (!lead) return text;
  const item = ITEM_INDEX.exec(where);
  // No numbered item in the path: this is a rule, a game round or a capstone
  // answer, where a leading number is content. Grade 7 Unit 5 answers "7 —
  // pure water is neutral at pH 7", and 7 is the pH.
  if (!item) { heldBack.push(`${where}: no numbered item in the path — "${text.slice(0, 58)}"`); return text; }
  if (Math.abs(Number(lead[1]) - Number(item[1])) > 1) {
    heldBack.push(`${where}: leading ${lead[1]} is not item ${Number(item[1])} — "${text.slice(0, 52)}"`);
    return text;
  }
  if (CONTINUES.test(text)) { heldBack.push(`${where}: a genuine numbered list — "${text.slice(0, 58)}"`); return text; }
  repaired.push(`${where}: "${text.slice(0, 56)}"`);
  return text.replace(LEADING_NUMBER, "");
}

walk(review.overrides, "");

console.log(`${write ? "REPAIRED" : "DRY RUN"} — ${repaired.length} reviewed answer(s) had a question number stripped`);
for (const line of repaired.slice(0, 12)) console.log(`   ${line}`);
if (repaired.length > 12) console.log(`   … and ${repaired.length - 12} more`);
if (heldBack.length) {
  console.log(`\n${heldBack.length} left alone (a leading number that is not the question's):`);
  for (const line of heldBack) console.log(`   ${line}`);
}
if (write) fs.writeFileSync(reviewPath, `${JSON.stringify(review, null, 2)}\n`, "utf8");
if (!write) console.log("\nRe-run with --write to apply, then rebuild with `npm run build:science`.");
