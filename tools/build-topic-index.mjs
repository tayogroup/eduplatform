// Writes each grade's tutoring topic index to
// src/prototypes/ehel-academy/<subject>/<stageDir>/data/topic-index.json.
// The derivation lives in tools/lib/ehel-topic-index.js (shared with the
// check); this file is only the walk-and-write.
//
//   node tools/build-topic-index.mjs                 # every subject
//   node tools/build-topic-index.mjs mathematics     # one subject
//
// Run it after any content rebuild (build:science, build:math --force, an
// applied script review…) — the index is derived from the unit JSONs, so
// moving them moves it, and check:topic-index fails until this is re-run.
// An unrecognised argument is refused rather than ignored: a typo silently
// falling back to "all subjects" is how the audio generators used to bill for
// the wrong run.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SUBJECTS, buildGradeIndex, serialise, indexPath } = require("./lib/ehel-topic-index.js");

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

const args = process.argv.slice(2);
const unknown = args.filter((a) => !Object.hasOwn(SUBJECTS, a));
if (unknown.length) {
  console.error(`unknown subject(s): ${unknown.join(", ")}\nknown: ${Object.keys(SUBJECTS).join(", ")}`);
  process.exit(2);
}
const subjects = args.length ? args : Object.keys(SUBJECTS);

let written = 0;
let unchanged = 0;
for (const subject of subjects) {
  for (const stage of SUBJECTS[subject].stages) {
    const index = buildGradeIndex(EHEL, subject, stage);
    if (!index) { console.log(`  ${subject} ${SUBJECTS[subject].stageWord.toLowerCase()} ${stage}: no unit data, skipped`); continue; }
    const target = indexPath(EHEL, subject, stage);
    const next = serialise(index);
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    if (current === next) { unchanged += 1; continue; }
    fs.writeFileSync(target, next);
    const topics = index.units.reduce((n, u) => n + u.topics.length, 0);
    console.log(`  ${path.relative(ROOT, target)} — ${index.units.length} units, ${topics} topics`);
    written += 1;
  }
}
console.log(`topic index: ${written} file(s) written, ${unchanged} unchanged`);
