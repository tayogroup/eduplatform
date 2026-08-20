#!/usr/bin/env node

// Gate on the English Story Library (Grades 5-8).
//
// The library file is a COPY of text that lives in the unit files, so the one
// failure mode that matters is drift: a story corrected in its unit, its clip
// re-recorded, a part added — and the shelf still serving the old words, with
// nothing anywhere saying so. English has been bitten by exactly this shape
// before (853 stale audio clips that only git could see), and a copy nobody
// re-derives goes stale the same way.
//
// So this does not inspect the committed file for plausibility. It rebuilds the
// library from the units with the same function the builder uses and fails if
// what is committed differs by one character. Everything else it checks is
// something re-deriving cannot see:
//
//  - every narrated part's mp3 exists on disk at the path the app will request
//  - the app and the data agree on which grades have a shelf
//  - Grades 1-4 have no story-library.json (that shelf is the picture books)
//
// Usage: node tools/check-english-story-library.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { LIBRARY_GRADES, buildLibrary } = require("./lib/english-story-library.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const englishRoot = path.join(root, "src", "prototypes", "ehel-academy", "english");
const shellFile = path.join(root, "src", "prototypes", "ehel-academy", "shell", "subjects", "english.js");

const problems = [];
const fail = (message) => problems.push(message);

// ------------------------------------------------------------ the app's own view
// STORY_LIBRARY_GRADES in the shell decides whether the nav entry exists. If it
// and LIBRARY_GRADES disagree, one of two silent failures follows: a grade with
// a shelf in the nav and no file behind it (the section renders an error), or a
// grade whose file is built, committed and unreachable. Neither shows up in any
// other check, because each half is internally consistent.
const shellSource = fs.readFileSync(shellFile, "utf8");
const declared = shellSource.match(/const STORY_LIBRARY_GRADES\s*=\s*\[([^\]]*)\]/);
if (!declared) {
  fail("STORY_LIBRARY_GRADES not found in shell/subjects/english.js — the gate cannot tell which grades the app shelves");
} else {
  const shellGrades = declared[1].split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value));
  if (shellGrades.join(",") !== LIBRARY_GRADES.join(",")) {
    fail(`STORY_LIBRARY_GRADES is [${shellGrades.join(", ")}] but tools/lib/english-story-library.js builds [${LIBRARY_GRADES.join(", ")}] — they must match`);
  }
}

// ------------------------------------------------------------ Grades 1-4 have none
for (const grade of [1, 2, 3, 4]) {
  const stray = path.join(englishRoot, `grade-${grade}`, "data", "story-library.json");
  if (fs.existsSync(stray)) {
    fail(`grade ${grade}: story-library.json exists, but Grades 1-4 have the picture books instead — delete it or widen LIBRARY_GRADES deliberately`);
  }
}

// ------------------------------------------------------------ re-derive and compare
let totalStories = 0;
let totalParts = 0;
let totalWords = 0;

for (const grade of LIBRARY_GRADES) {
  const unitsDir = path.join(englishRoot, `grade-${grade}`, "data", "units");
  const units = fs.readdirSync(unitsDir)
    .filter((name) => /^unit-\d+\.json$/.test(name))
    .map((name) => ({ number: Number(name.match(/\d+/)[0]), file: path.join(unitsDir, name) }))
    .sort((a, b) => a.number - b.number)
    .map((unit) => ({ ...unit, data: JSON.parse(fs.readFileSync(unit.file, "utf8")) }));

  const { library, problems: found } = buildLibrary(grade, units);
  found.forEach(fail);

  const file = path.join(englishRoot, `grade-${grade}`, "data", "story-library.json");
  if (!fs.existsSync(file)) {
    fail(`grade ${grade}: story-library.json is missing — run node tools/build-english-story-library.mjs`);
    continue;
  }
  const committed = fs.readFileSync(file, "utf8");
  const derived = `${JSON.stringify(library, null, 2)}\n`;
  if (committed !== derived) {
    // Name what moved rather than "files differ": the reason to re-derive is
    // almost always a story whose text was corrected in its unit, and the
    // reader wants to know which one.
    let parsed = null;
    try { parsed = JSON.parse(committed); } catch { /* reported below as unreadable */ }
    if (!parsed) {
      fail(`grade ${grade}: story-library.json is not valid JSON`);
    } else {
      const derivedById = new Map(library.stories.map((story) => [story.storyId, story]));
      const committedById = new Map((parsed.stories || []).map((story) => [story.storyId, story]));
      for (const [id, story] of derivedById) {
        if (!committedById.has(id)) { fail(`grade ${grade}: "${story.title}" is in the units but not in story-library.json`); continue; }
        if (JSON.stringify(committedById.get(id)) !== JSON.stringify(story)) {
          fail(`grade ${grade}: "${story.title}" has drifted from its unit text — story-library.json is stale`);
        }
      }
      for (const [id, story] of committedById) {
        if (!derivedById.has(id)) fail(`grade ${grade}: story-library.json holds "${story.title}", which the units no longer produce`);
      }
      // A difference the per-story walk cannot see (field order, a header
      // value) still means the file is not what the builder writes.
      if (!problems.some((problem) => problem.startsWith(`grade ${grade}:`))) {
        fail(`grade ${grade}: story-library.json differs from the builder's output — run node tools/build-english-story-library.mjs`);
      }
    }
  }

  // ---------------------------------------------------------- the clips exist
  // Checked against the DERIVED library, not the committed one: a stale file
  // would otherwise be checked against its own stale paths and pass.
  for (const story of library.stories) {
    for (const part of story.parts) {
      if (!part.audio) {
        // Not fatal on its own — the reader falls back to on-demand narration —
        // but every one of the 95 parts is recorded today, so a part losing its
        // clip is worth seeing.
        fail(`grade ${grade}: "${story.title}" part ${part.part} has no recorded narration`);
        continue;
      }
      // "./media/audio/grade-7/readings/x.mp3", relative to the english root —
      // the same path the app resolves through resolveMediaUrl.
      const clip = path.join(englishRoot, part.audio.source.replace(/^\.\//, ""));
      if (!fs.existsSync(clip)) {
        fail(`grade ${grade}: "${story.title}" part ${part.part} points at ${part.audio.source}, which is not on disk`);
      }
    }
    totalParts += story.parts.length;
    totalWords += story.words;
  }
  totalStories += library.stories.length;
}

if (problems.length) {
  console.error(`English Story Library: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`English Story Library: ${totalStories} stories · ${totalParts} narrated parts · ${totalWords.toLocaleString("en-GB")} words across Grades ${LIBRARY_GRADES.join(", ")} — all match their units.`);
