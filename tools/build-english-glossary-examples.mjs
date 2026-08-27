#!/usr/bin/env node
// Give every English glossary entry an EXAMPLE SENTENCE, derived from its own
// grade's content.
//
// The tutoring Glossary shows a word, its definition, an example of it in use
// and both recordings. The first, second and fourth are already in
// sentence-glossary.json; the example is not, and it cannot be found at runtime
// because the app loads ONE unit and the glossary covers the whole grade.
//
// Idempotent: re-running rewrites the same example for the same content, so the
// file is a pure function of the units and this can be re-run after any content
// repair. `--dry` reports coverage and writes nothing.
//
// Usage:
//   node tools/build-english-glossary-examples.mjs [--dry] [grade …]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGLISH = path.join(root, "src", "prototypes", "ehel-academy", "english");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const grades = args.filter((a) => /^[1-8]$/.test(a)).map(Number);
// An unrecognised argument is refused rather than ignored: this writes content
// files, and a typo silently falling back to "every grade" is the shape that
// makes a mistake expensive elsewhere in this repo.
const stray = args.filter((a) => a !== "--dry" && !/^[1-8]$/.test(a));
if (stray.length) {
  console.error(`✗ unrecognised argument(s): ${stray.join(", ")}`);
  process.exit(2);
}
const TARGET = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];

// The learner's own tokenisation. english.js :: linkGlossaryWords matches
// /[A-Za-z']+/g and, since the phrase fix, joins a multi-word key's parts with
// [\s-]+. A example that the linker could not itself have matched would be an
// example of a different word.
const escapePart = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (key) =>
  new RegExp(`(?:^|[^A-Za-z'])(?:${key.split(/[\s-]+/).filter(Boolean).map(escapePart).join("[\\s-]+")})(?![A-Za-z'])`, "i");

const collect = (node, practice, prose) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((n) => collect(n, practice, prose)); return; }
  if (Array.isArray(node.practiceSentences)) for (const s of node.practiceSentences) if (typeof s === "string") practice.push(s.trim());
  if (typeof node.passageScript === "string") for (const s of node.passageScript.split(/(?<=[.!?])\s+/)) { const t = s.trim(); if (t) prose.push(t); }
  for (const v of Object.values(node)) if (v && typeof v === "object") collect(v, practice, prose);
};

let totalWords = 0, totalWith = 0, totalWithout = 0, filesWritten = 0;

for (const grade of TARGET) {
  const dataDir = path.join(ENGLISH, `grade-${grade}`, "data");
  const glossaryPath = path.join(dataDir, "sentence-glossary.json");
  if (!fs.existsSync(glossaryPath)) continue;
  const glossary = JSON.parse(fs.readFileSync(glossaryPath, "utf8"));
  const entries = glossary.entries || {};

  const practice = [], prose = [];
  const walkDir = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) { walkDir(p); continue; }
      if (!name.endsWith(".json") || name === "sentence-glossary.json") continue;
      try { collect(JSON.parse(fs.readFileSync(p, "utf8")), practice, prose); } catch { /* not a content file */ }
    }
  };
  walkDir(dataDir);

  // Practice sentences first: they are the ones the app RENDERS, so an example
  // taken from there is a sentence the learner can also meet in the course.
  // Reading prose is the fallback. Shortest match wins — an example exists to
  // show the word in use, and a 40-word sentence buries it.
  const pick = (key) => {
    const re = wordRe(key);
    let best = null;
    for (const pool of [practice, prose]) {
      for (const s of pool) {
        if (s.length < 8 || s.length > 160 || !re.test(s)) continue;
        if (!best || s.length < best.length) best = s;
      }
      if (best) return best;
    }
    return null;
  };

  let withExample = 0, without = 0;
  const missing = [];
  for (const [word, entry] of Object.entries(entries)) {
    if (!entry) continue;
    totalWords += 1;
    const example = pick(word);
    if (example) { withExample += 1; if (!DRY) entry.example = example; }
    else { without += 1; if (missing.length < 6) missing.push(word); if (!DRY && "example" in entry) delete entry.example; }
  }
  totalWith += withExample; totalWithout += without;

  const pct = ((withExample / (withExample + without)) * 100).toFixed(1);
  console.log(`  grade ${grade}: ${withExample + without} words | example ${withExample} (${pct}%) | none ${without}`);
  if (missing.length) console.log(`     no example: ${missing.map((m) => JSON.stringify(m)).join(", ")}`);

  if (!DRY) {
    fs.writeFileSync(glossaryPath, JSON.stringify(glossary, null, 2) + "\n", "utf8");
    filesWritten += 1;
  }
}

const coverage = totalWith / (totalWith + totalWithout);
console.log(`\n  ${totalWith} of ${totalWords} words have an example (${(coverage * 100).toFixed(1)}%)${DRY ? " — DRY RUN, nothing written" : `, ${filesWritten} file(s) written`}`);

// A floor, because the failure this guards against is silent: a tokeniser change
// or a moved field would make `pick` match nothing, every example would vanish,
// and the run would report success having emptied the field for 17,692 words.
if (coverage < 0.8) {
  console.error(`✗ only ${(coverage * 100).toFixed(1)}% of words found an example — refusing to treat that as a result.`);
  console.error("  Below this floor the derivation is broken rather than the content being thin.");
  process.exitCode = 1;
}
