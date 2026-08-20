#!/usr/bin/env node

// Build english/grade-{5,6,7,8}/data/story-library.json — the Story Library's
// index, derived from the units it shelves.
//
// Nothing here is authored. The stories, their parts, their narration and their
// unit artwork all already exist inside grade-N/data/units/unit-*.json; this
// tool only gathers each story's parts back into one entry. Editing the output
// by hand would be overwritten by the next run and, worse, would pass silently
// until check-english-story-library.mjs re-derived it.
//
// Idempotent, and prints what it changed — a run that changes nothing prints
// nothing but the totals, so its diff is the review surface.
//
// Usage:
//   node tools/build-english-story-library.mjs            # all four grades
//   node tools/build-english-story-library.mjs 5 7        # just these
//   node tools/build-english-story-library.mjs --check    # derive, compare, do not write

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { LIBRARY_GRADES, buildLibrary } = require("./lib/english-story-library.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const englishRoot = path.join(root, "src", "prototypes", "ehel-academy", "english");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const requested = args.filter((arg) => /^\d+$/.test(arg)).map(Number);
const unknown = args.filter((arg) => arg !== "--check" && !/^\d+$/.test(arg));
if (unknown.length) {
  // An unrecognised argument is refused rather than ignored: a typo would
  // otherwise fall through to "all grades" and rewrite files the caller never
  // named.
  console.error(`Unrecognised argument: ${unknown.join(", ")}`);
  process.exit(2);
}
const grades = requested.length ? requested : LIBRARY_GRADES;
for (const grade of grades) {
  if (!LIBRARY_GRADES.includes(grade)) {
    console.error(`Grade ${grade} has no Story Library. The shelf is Grades ${LIBRARY_GRADES.join(", ")} — Grades 1-4 have the picture books instead.`);
    process.exit(2);
  }
}

function readUnits(grade) {
  const dir = path.join(englishRoot, `grade-${grade}`, "data", "units");
  return fs.readdirSync(dir)
    .filter((name) => /^unit-\d+\.json$/.test(name))
    .map((name) => ({ number: Number(name.match(/\d+/)[0]), file: path.join(dir, name) }))
    .sort((a, b) => a.number - b.number)
    .map((unit) => ({ ...unit, data: JSON.parse(fs.readFileSync(unit.file, "utf8")) }));
}

// Derived for every grade FIRST, written only once all of them are clean.
//
// Writing inside the loop is the obvious shape and it is wrong: a problem is
// reported by skipping the reading that caused it, so the library derived
// alongside a problem is a library with a story missing. Writing that and then
// exiting 1 leaves a plausible-looking file on disk that the next `git add`
// picks up — an unrecognised genre would silently unshelve a story and still
// look like a successful-then-failed run. Found by mutation-testing the gate.
let problems = [];
let changed = 0;
const pending = [];

for (const grade of grades) {
  const units = readUnits(grade);
  const { library, problems: found } = buildLibrary(grade, units);
  problems = problems.concat(found);

  const outFile = path.join(englishRoot, `grade-${grade}`, "data", "story-library.json");
  // Two-space JSON with a trailing newline, matching the unit files beside it.
  const next = `${JSON.stringify(library, null, 2)}\n`;
  const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : null;

  const partCount = library.stories.reduce((sum, story) => sum + story.parts.length, 0);
  const narrated = library.stories.reduce((sum, story) => sum + story.parts.filter((part) => part.audio).length, 0);
  const words = library.stories.reduce((sum, story) => sum + story.words, 0);
  const state = current === next ? "unchanged" : current === null ? "created" : "updated";
  if (state !== "unchanged") changed += 1;
  console.log(`Grade ${grade}: ${library.stories.length} stories · ${partCount} parts (${narrated} narrated) · ${words.toLocaleString("en-GB")} words — ${state}`);

  if (current !== next) pending.push({ outFile, next });
}

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"} — nothing was written:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

if (!checkOnly) for (const { outFile, next } of pending) fs.writeFileSync(outFile, next);

if (checkOnly && changed) {
  console.error(`\n${changed} grade file${changed === 1 ? " is" : "s are"} out of date. Run: node tools/build-english-story-library.mjs`);
  process.exit(1);
}

console.log(checkOnly ? "\nStory Library files match the units." : "\nStory Library built.");
