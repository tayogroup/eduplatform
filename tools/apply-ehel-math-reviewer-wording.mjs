// Apply the reviewer's remaining wording corrections from the narration
// workbook — the ones that are neither punctuation nor stale-export noise.
//
// Mostly "dice" -> "die" (the singular of dice), plus "the most tallies" ->
// "the greatest number of tallies" and a "ten-thousands" hyphenation.
//
// Two deliberate exclusions:
//
//   Explorations. repair-ehel-math-exploration-pairing.mjs moved questions
//   between cards, and the workbook predates that. Comparing by item id now
//   reports a difference for nearly every exploration, and applying those would
//   undo the re-pairing. Only workedExamples and methods are considered here.
//
//   Rows the reviewer marked "No changes required". Where those differ it is
//   our text that moved on, not a correction — Stage 4 unit 1 method-3 would
//   otherwise have its example replaced with an unrelated question.
//
// A row is applied only when the change is small. A wholesale replacement means
// the two sides are talking about different content, not that the reviewer
// rewrote a sentence.
//
//   node tools/apply-ehel-math-reviewer-wording.mjs <field-diffs.json> [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const diffFile = argv.find((a) => !a.startsWith("--"));
if (!diffFile) { console.error("usage: apply-ehel-math-reviewer-wording.mjs <field-diffs.json> [--write]"); process.exit(2); }

const POOLS = { Method: "methods", "Worked Example": "workedExamples" };
const MAX_WORDS_CHANGED = 8;

// How many words differ between two strings, ignoring order-preserving context.
function wordsChanged(a, b) {
  const x = a.split(/\s+/), y = b.split(/\s+/);
  let s = 0;
  while (s < x.length && s < y.length && x[s] === y[s]) s += 1;
  let ex = x.length - 1, ey = y.length - 1;
  while (ex >= s && ey >= s && x[ex] === y[ey]) { ex -= 1; ey -= 1; }
  return Math.max(ex - s + 1, ey - s + 1);
}

const rows = JSON.parse(fs.readFileSync(diffFile, "utf8"));
const cache = new Map();
const applied = [];
const skipped = { exploration: 0, notRevised: 0, tooLarge: 0, missing: 0 };

for (const row of rows) {
  if (!POOLS[row.cat]) { skipped.exploration += 1; continue; }
  if (!/Reviewed and revised/.test(row.comment || "")) { skipped.notRevised += 1; continue; }

  const file = path.join(mathRoot, `grade-${row.g}`, "data", "units", `${row.unit}.json`);
  if (!fs.existsSync(file)) { skipped.missing += 1; continue; }
  if (!cache.has(file)) cache.set(file, { data: JSON.parse(fs.readFileSync(file, "utf8")), dirty: false });
  const rec = cache.get(file);
  const item = (rec.data[POOLS[row.cat]] || []).find((x) => x && x.id === row.id);
  if (!item) { skipped.missing += 1; continue; }

  for (const [field, ours, theirs] of row.diffs) {
    const changed = wordsChanged(ours, theirs);
    if (changed > MAX_WORDS_CHANGED) { skipped.tooLarge += 1; continue; }
    const m = field.match(/^steps\[(\d+)\]$/);
    const current = m ? item.steps[Number(m[1])] : item[field];
    // The workbook text is whitespace-normalised; only swap when ours is too,
    // so a multi-paragraph field is never flattened by this path.
    if (String(current).replace(/\s+/g, " ").trim() !== ours) { skipped.missing += 1; continue; }
    if (m) item.steps[Number(m[1])] = theirs; else item[field] = theirs;
    rec.dirty = true;
    applied.push({ where: `grade-${row.g}/${row.unit} ${row.id}.${field}`, changed, ours, theirs });
  }
}

if (write) for (const [file, rec] of cache) if (rec.dirty) fs.writeFileSync(file, `${JSON.stringify(rec.data, null, 2)}\n`, "utf8");

console.log(`${write ? "APPLIED" : "DRY RUN"} — ${applied.length} field edit(s)\n`);
for (const a of applied) {
  console.log(`  ${a.where}  (${a.changed} word(s))`);
  console.log(`    -  ${a.ours.slice(0, 120)}`);
  console.log(`    +  ${a.theirs.slice(0, 120)}`);
}
console.log(`\nskipped — exploration rows (workbook predates re-pairing): ${skipped.exploration}`);
console.log(`skipped — reviewer marked "no changes required"          : ${skipped.notRevised}`);
console.log(`skipped — change too large to be a wording fix           : ${skipped.tooLarge}`);
console.log(`skipped — item or text no longer matches                 : ${skipped.missing}`);
if (!write) console.log("\nRe-run with --write to apply.");
