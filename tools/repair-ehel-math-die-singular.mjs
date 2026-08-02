// Use "die" for one and "dice" for more than one, across Mathematics.
//
// The reviewer flagged this as a mathematical-language correction, and it was
// applied to the fourteen rows they happened to be reviewing (1730881f5). That
// left the course inconsistent: "rolling a 6 on a die" in one unit and "on a
// dice" in the next. This finishes the job.
//
// A blanket replace would be wrong — "dice" is the correct plural, and the
// course says "Two fair dice are rolled" and "real dice have tiny flaws". So
// only singular uses change, identified by what precedes the word: an article,
// a determiner, or the number one, with any adjectives in between.
//
// Note this rewrites narration text, so every affected clip is renamed and has
// to be regenerated. Nothing else moves the hash, so the count of changed
// strings is exactly the count of clips to re-cut.
//
//   node tools/repair-ehel-math-die-singular.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

// Adjectives may sit between the determiner and the noun ("an ordinary
// six-sided dice", "a normal 1–6 dice"), so each rule allows them — including
// digits and en-dashes, which a plain \w+ misses. The article itself never
// needs changing: "a die" and "an ordinary … die" are both already correct.
const MID = "(\\s+(?:[\\w\\u2010-\\u2015-]+\\s+)*?)";
const RULES = [
  // "a" and "one" are unambiguously singular, whatever follows, so these are
  // never second-guessed. An earlier version ran them through the plural guard
  // below and so left "the outcomes of rolling a dice are {1,…}" alone, where
  // the "are" belongs to the outcomes rather than to the die.
  ["article", new RegExp(`\\b(an?|An?)${MID}dice\\b`, "g"), false],
  ["one", new RegExp(`\\b(one|One)${MID}dice\\b`, "g"), false],
  // These can introduce either number, so a following plural verb decides.
  ["determiner", new RegExp(`\\b(each|Each|every|Every|this|This|that|That|the|The|your|Your|its|Its)${MID}dice\\b`, "g"), true],
];
// Only consulted for the ambiguous determiners: "the dice are fair" is plural,
// "the dice is a cube" is not.
const PLURAL_AFTER = /^\s+(are|were|have|both|each other)\b/;

let changed = 0, fieldsChanged = 0, filesChanged = 0;
const byRule = {};
const samples = [];

function fix(text) {
  let out = text;
  for (const [name, re, ambiguous] of RULES) {
    out = out.replace(re, (match, det, mid, offset, whole) => {
      const after = whole.slice(offset + match.length);
      if (ambiguous && PLURAL_AFTER.test(after)) return match;
      byRule[name] = (byRule[name] || 0) + 1;
      changed += 1;
      return `${det}${mid}die`;
    });
  }
  return out;
}

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const dataDir = path.join(mathRoot, gradeDir, "data");
  if (!fs.existsSync(dataDir)) continue;
  const stack = [dataDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(file); continue; }
      if (!entry.name.endsWith(".json")) continue;
      const unit = JSON.parse(fs.readFileSync(file, "utf8"));
      let dirty = 0;
      const visit = (node) => {
        if (Array.isArray(node)) {
          node.forEach((item, i) => {
            if (typeof item === "string") {
              const next = fix(item);
              if (next !== item) { if (samples.length < 6) samples.push([item, next]); node[i] = next; dirty += 1; }
            } else visit(item);
          });
          return;
        }
        if (!node || typeof node !== "object") return;
        for (const [key, value] of Object.entries(node)) {
          if (typeof value === "string") {
            const next = fix(value);
            if (next !== value) { if (samples.length < 6) samples.push([value, next]); node[key] = next; dirty += 1; }
          } else visit(value);
        }
      };
      visit(unit);
      if (dirty) {
        fieldsChanged += dirty; filesChanged += 1;
        if (write) fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
      }
    }
  }
}

console.log(`${write ? "APPLIED" : "DRY RUN"}\n`);
console.log(`  singular uses corrected : ${changed}`);
console.log(`  by rule                 : ${JSON.stringify(byRule)}`);
console.log(`  fields changed          : ${fieldsChanged} in ${filesChanged} file(s)`);
for (const [before, after] of samples) {
  const at = [...before].findIndex((c, i) => c !== after[i]);
  console.log(`\n    -  …${before.slice(Math.max(0, at - 45), at + 45)}…`);
  console.log(`    +  …${after.slice(Math.max(0, at - 45), at + 45)}…`);
}
if (!write) console.log("\nRe-run with --write to apply.");
