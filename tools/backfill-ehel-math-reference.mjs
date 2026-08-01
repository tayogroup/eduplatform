// Fill the empty reference sections that the Mathematics app renders.
//
// The app draws three reference panels — Key rules, Math words, Common mistakes
// — but Year 1 units ship `rules` empty in 9 units and `commonMistakes` empty in
// 15, so those panels render blank. The source guide has no "Key Rules" or
// "Common Mistakes" table for Year 1, which is why the builder produced nothing.
//
// Both can be built from the unit's own content rather than invented:
//   rules          <- each concept's title and its opening sentence
//   commonMistakes <- the unit's errorFeedback entries, which already state a
//                     wrong answer and the correction ("If you say 8, you likely
//                     missed the last anjero - count the row again…")
//
//   node tools/backfill-ehel-math-reference.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

const tidy = (value = "") => String(value).replace(/\s+/g, " ").trim();

function firstSentence(text) {
  const opening = String(text).split(/\n{2,}/)[0];
  const match = opening.match(/^.*?[.!?](?=\s|$)/);
  return tidy(match ? match[0] : opening);
}

// "If you say 8, you likely missed the last anjero in the row - count the row
// again from left to right." -> ["…missed the last anjero in the row", "Count
// the row again from left to right."]
function splitFeedback(text) {
  const value = tidy(text);
  const at = value.search(/\s[-–—]\s|(?:,|\.)\s+(?:count|check|remember|point out|try|look|say|go back|start)\b/i);
  if (at < 0) return null;
  let mistake = value.slice(0, at).trim().replace(/[,.]$/, "");
  let correction = value.slice(at).replace(/^[\s,.–—-]+/, "").trim();
  if (mistake.length < 15 || correction.length < 12) return null;
  correction = correction.charAt(0).toUpperCase() + correction.slice(1);
  if (!/[.!?]$/.test(correction)) correction += ".";
  return [mistake, correction];
}

const stats = { files: 0, changed: 0, rules: 0, mistakes: 0, stillEmptyRules: 0, stillEmptyMistakes: 0 };

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    stats.files += 1;
    let changed = 0;
    unit.reference = unit.reference || {};

    if (!Array.isArray(unit.reference.rules) || unit.reference.rules.length === 0) {
      const rules = (unit.concepts || [])
        .map((concept) => ({ title: concept.title, text: firstSentence(concept.explanation) }))
        .filter((rule) => rule.title && rule.text && rule.text.length > 20)
        .slice(0, 6);
      if (rules.length) { unit.reference.rules = rules; stats.rules += rules.length; changed += 1; }
      else stats.stillEmptyRules += 1;
    }

    if (!Array.isArray(unit.reference.commonMistakes) || unit.reference.commonMistakes.length === 0) {
      const seen = new Set();
      const pairs = [];
      for (const key of ["realProblems", "fluency", "practice", "explorations"]) {
        for (const item of unit[key] || []) {
          if (pairs.length >= 5) break;
          const pair = splitFeedback(item.errorFeedback || "");
          if (!pair) continue;
          const dedupe = pair[0].toLowerCase().slice(0, 40);
          if (seen.has(dedupe)) continue;
          seen.add(dedupe);
          pairs.push(pair);
        }
      }
      if (pairs.length) { unit.reference.commonMistakes = pairs; stats.mistakes += pairs.length; changed += 1; }
      else stats.stillEmptyMistakes += 1;
    }

    if (changed) {
      stats.changed += 1;
      if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
    }
  }
}

console.log(`${write ? "BACKFILLED" : "DRY RUN"} — ${stats.files} unit files, ${stats.changed} changed`);
console.log(`  key rules added        : ${stats.rules}`);
console.log(`  common mistakes added  : ${stats.mistakes}`);
console.log(`  rules still empty      : ${stats.stillEmptyRules}`);
console.log(`  mistakes still empty   : ${stats.stillEmptyMistakes}`);
if (!write) console.log("\nRe-run with --write to apply.");
