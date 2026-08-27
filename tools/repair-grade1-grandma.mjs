#!/usr/bin/env node
// Grade 1 English: the readings say Ayeeyo, the word cards say Grandma.
//
// The Core words rename (06e8a9d18 and before) changed the vocabulary but not
// the stories, so a child met Grandma on every card and Ayeeyo in every passage.
// This carries the rename into the remaining content: the readings themselves,
// the comprehension questions and answer keys that quote them, the story
// glossary, the games and the sentence glossary.
//
// AUDIO IS THE REASON THIS NEEDS A TOOL RATHER THAN A FIND-AND-REPLACE.
// English clips are named for their content slot, not for a hash of what they
// say, so editing a passage does NOT rename or orphan its clip. The mp3 keeps
// its filename and URL and goes on saying "Ayeeyo" under text that now says
// "Grandma" — the read-along highlight then points at the wrong words, and
// every learner who has already played it holds the old audio for up to a year
// because Bunny serves media with max-age=31536000 and no ETag.
//
// So every clip whose text this tool changes is marked `available: false`, the
// state the repo already uses between deleting a wrong recording and paying for
// its replacement (the CDN pruner treats suppressed clips as not-orphans for
// exactly this reason). Re-record them, then bump AUDIO_RELEASE in
// shell/subjects/english.js so browsers that cached the old audio refetch.
//
//   node tools/repair-grade1-grandma.mjs            # report, writes nothing
//   node tools/repair-grade1-grandma.mjs --write    # apply
import fs from "node:fs";
import path from "node:path";

const DATA = path.join("src", "prototypes", "ehel-academy", "english", "grade-1", "data");
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") {
    console.error(`Unrecognised argument: ${a}`);
    console.error("Usage: repair-grade1-grandma.mjs [--write]");
    process.exit(2);
  }
}

const OLD = /\bAyeeyo\b/g;
const NEW = "Grandma";
let strings = 0, clips = 0;
const touched = [];

// Walk any structure, rewriting strings and suppressing the audio object that
// sits beside text we changed. `audioOwner` is the nearest object that carries
// both the text and its clip, which is how a change is tied to its recording.
function rewrite(text) {
  // The passages introduce her in apposition -- "her grandmother, Ayeeyo," --
  // which a plain substitution turns into "her grandmother, Grandma,". Collapse
  // those to the name alone before the general pass.
  let t = text
    .replace(/\b(her|his|my|your|their)\s+grandmother,\s*Ayeeyo,\s*/gi, "$1 grandma ")
    .replace(/\bAmal's grandmother,\s*Ayeeyo,\s*/g, "Amal's grandma ")
    .replace(/\bgrandmother,\s*Ayeeyo\b/gi, "grandma")
    .replace(/\bAyeeyo\b/g, NEW);
  return t.replace(/\s{2,}/g, " ");
}

function walk(node) {
  // An array of STRINGS is the common shape here (practiceSentences, bullet
  // lists, option lists). Recursing with forEach(walk) skipped every one of
  // them, because walk returns immediately on a non-object -- 55 of 81
  // occurrences survived the first run.
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === "string") {
        if (node[i].includes("Ayeeyo")) { node[i] = rewrite(node[i]); strings += 1; }
      } else walk(node[i]);
    }
    return;
  }
  if (!node || typeof node !== "object") return;
  let changedHere = false;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "string") {
      if (v.includes("Ayeeyo")) { node[k] = rewrite(v); strings += 1; changedHere = true; }
    } else {
      // Deliberately NOT propagating upward. A clip belongs to the object that
      // holds the text it speaks, so only that object's own string fields
      // decide whether its audio is now wrong. Letting a nested change mark the
      // ancestor suppressed 124 clips instead of 28 — a unit whose reading
      // changed would have silenced its overview narration too.
      walk(v);
    }
  }
  if (!changedHere) return;
  for (const key of ["audio", "meaningAudio"]) {
    if (node[key] && typeof node[key] === "object" && node[key].available !== false) {
      node[key].available = false;
      node[key].status = "Needs re-recording - text changed from Ayeeyo to Grandma";
      clips += 1;
    }
  }
  if (Array.isArray(node.sentenceAudio)) {
    for (const a of node.sentenceAudio) {
      if (a && a.available !== false) {
        a.available = false;
        a.status = "Needs re-recording - text changed from Ayeeyo to Grandma";
        clips += 1;
      }
    }
  }
}

const files = [
  ...Array.from({ length: 10 }, (_, i) => path.join(DATA, "units", `unit-${i + 1}.json`)),
  ...[4, 5, 6].map((n) => path.join(DATA, "games", `unit-${n}.json`)),
  path.join(DATA, "sentence-glossary.json"),
].filter((f) => fs.existsSync(f));

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.includes("Ayeeyo")) continue;
  const doc = JSON.parse(raw);
  const before = strings, beforeClips = clips;
  walk(doc);
  touched.push({ file, strings: strings - before, clips: clips - beforeClips, doc });
}

console.log("Grade 1: Ayeeyo -> Grandma\n");
for (const t of touched) {
  console.log(`  ${path.relative(DATA, t.file).padEnd(28)} ${String(t.strings).padStart(3)} string(s), ${t.clips} clip(s) suppressed`);
}
console.log(`\n  ${strings} string(s) rewritten across ${touched.length} file(s)`);
console.log(`  ${clips} clip(s) marked available:false — they still say Ayeeyo`);

if (!WRITE) {
  console.log("\nReport only — nothing written. Re-run with --write to apply.");
  process.exit(0);
}
for (const t of touched) fs.writeFileSync(t.file, JSON.stringify(t.doc, null, 2) + "\n");
console.log(`\nWrote ${touched.length} file(s).`);
console.log("Next: re-record the suppressed clips, then bump AUDIO_RELEASE in");
console.log("shell/subjects/english.js so cached browsers refetch them.");
