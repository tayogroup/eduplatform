#!/usr/bin/env node
// Grade 1 English: the readings call her Grandma, like everything else does.
//
// The Ayeeyo -> Grandma repair only rewrote passages that said "Ayeeyo". Units 5,
// 6 and 7 also said "grandmother" without it, so those lines were never touched
// and the same character ended up named two ways.
//
// Unit 6 is the case that shows how easily this hides: its passage was ALREADY
// re-recorded by the Ayeeyo repair, so it opens "went to the market with her
// grandma" and then says "Look, Grandmother!" and "held her grandmother's hand"
// further in -- both namings inside one story, and the recording says both.
// A survey that reads the first line of each hit misses it; this was found by
// re-running the check AFTER the fix and asking what was left.
//
// UNIT 2 IS DELIBERATELY EXCLUDED, and it is the whole reason this is a scoped
// tool rather than a find-and-replace. Its six occurrences are the family-words
// lesson -- "1. mother, 2. father, 3. brother, 4. grandmother", "This is my
// grandmother." -- where the standard noun IS the word being taught, sitting in
// a numbered set beside mother and father. Rewriting those to "grandma" would
// teach the wrong word and break the pattern the exercise drills.
//
// AUDIO: an English clip is named for its content slot, not for a hash of its
// text, so editing a passage does NOT rename or orphan its recording. The mp3
// keeps its filename and goes on saying "Grandmother" under text that now says
// "Grandma", and the read-along highlight then points at the wrong words. Every
// clip whose text changes here is marked available:false -- the state the repo
// uses between deleting a wrong recording and paying for its replacement.
//
//   node tools/repair-grade1-grandmother-readings.mjs           # report
//   node tools/repair-grade1-grandmother-readings.mjs --write   # apply
import fs from "node:fs";
import path from "node:path";

const UNITS = path.join("src", "prototypes", "ehel-academy", "english", "grade-1", "data", "units");
// Unit 2 is the family-words lesson and is not in this list on purpose.
const IN_SCOPE = [5, 6, 7];
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") { console.error(`Unrecognised argument: ${a}`); process.exit(2); }
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const STATUS = "Needs re-recording - text changed from Grandmother to Grandma";
let strings = 0, clips = 0;
const changed = [];

function rewrite(text) {
  return text
    .replace(/\bGrandmother\b/g, "Grandma")
    .replace(/\bgrandmother\b/g, "grandma")
    .replace(/\bGrandfather\b/g, "Grandpa")
    .replace(/\bgrandfather\b/g, "grandpa");
}

function walk(node, where) {
  // An array of STRINGS is a real shape here (model lines, option lists).
  // Recursing with forEach(walk) skips every one, because walk returns at once
  // on a non-object -- that mistake cost the Ayeeyo repair 55 of 81 hits.
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === "string") {
        if (/grandmother|grandfather/i.test(node[i])) {
          changed.push([where, node[i]]);
          node[i] = rewrite(node[i]); strings += 1;
        }
      } else walk(node[i], where);
    }
    return;
  }
  if (!node || typeof node !== "object") return;
  let here = false;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "string") {
      if (/grandmother|grandfather/i.test(v)) {
        changed.push([`${where}.${k}`, v]);
        node[k] = rewrite(v); strings += 1; here = true;
      }
    } else walk(v, `${where}.${k}`);
  }
  if (!here) return;
}

// A clip is suppressed only when the text IT SPEAKS changed, matched field by
// field. "Any string in this object moved, so silence all its clips" is the
// tempting rule and it is wrong here: Unit 5's change is an `exampleSentence`,
// while that link's clips speak `practiceSentences` and `childMeaning` -- both
// untouched. The loose rule suppressed 6 clips where 1 is correct, which would
// have stranded five good recordings and billed five needless re-records.
const SPOKEN = {
  passageScript: (node) => (node.audio ? [node.audio] : []),
  childMeaning: (node) => (node.meaningAudio ? [node.meaningAudio] : []),
};
function suppressChangedClips(node) {
  if (Array.isArray(node)) { node.forEach(suppressChangedClips); return; }
  if (!node || typeof node !== "object") return;
  for (const [field, pick] of Object.entries(SPOKEN)) {
    if (typeof node[field] === "string" && /Grandma|Grandpa/.test(node[field])
        && changed.some(([, text]) => rewrite(text) === node[field])) {
      for (const clip of pick(node)) {
        if (clip.available !== false) { clip.available = false; clip.status = STATUS; clips += 1; }
      }
    }
  }
  // practiceSentences pair with sentenceAudio by INDEX, so only the moved one
  // is silenced rather than the whole set.
  if (Array.isArray(node.practiceSentences) && Array.isArray(node.sentenceAudio)) {
    node.practiceSentences.forEach((text, i) => {
      if (!changed.some(([, before]) => rewrite(before) === text)) return;
      const clip = node.sentenceAudio[i];
      if (clip && clip.available !== false) { clip.available = false; clip.status = STATUS; clips += 1; }
    });
  }
  for (const v of Object.values(node)) suppressChangedClips(v);
}

const touched = [];
for (const n of IN_SCOPE) {
  const file = path.join(UNITS, `unit-${n}.json`);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  if (!/grandmother|grandfather/i.test(raw)) continue;
  const doc = JSON.parse(raw);
  const before = strings, beforeClips = clips;
  walk(doc, `unit-${n}`);
  suppressChangedClips(doc);
  touched.push({ file, doc, strings: strings - before, clips: clips - beforeClips });
}

console.log(`Grade 1 units ${IN_SCOPE.join(" and ")}: Grandmother -> Grandma  (unit 2 excluded: family-words lesson)\n`);
for (const [where, text] of changed) console.log(`  ${where}\n     ${text.replace(/\s+/g, " ").slice(0, 100)}`);
console.log(`\n  ${strings} string(s) rewritten | ${clips} clip(s) marked available:false`);
if (!WRITE) { console.log("\nReport only — nothing written. Re-run with --write to apply."); process.exit(0); }
for (const t of touched) {
  for (let a = 1; a <= 6; a++) {
    // The preview servers hold these open intermittently on Windows.
    try { fs.writeFileSync(t.file, JSON.stringify(t.doc, null, 2) + "\n"); break; }
    catch (e) { if (a === 6) throw e; sleep(800 * a); }
  }
}
console.log(`\nWrote ${touched.length} file(s). Next: re-record the suppressed clip(s), then bump`);
console.log("AUDIO_RELEASE in shell/subjects/english.js — a reading keeps its filename, so a");
console.log("learner who already played it holds the old audio for a year without the stamp.");
