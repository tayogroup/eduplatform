#!/usr/bin/env node
// Grade 8 Unit 7 taught "conclusion" twice. It is not two senses — it is a
// cross-reference the builder turned into a word.
//
// The source list (inputs/ehel-grade8-source/Year 8/Unit 7/Year 8 -- Unit 7
// Vocabulary.docx) numbers 33 items, and two of them are pointers back to
// earlier entries, in as many words:
//
//   8.  conclusion   noun  The final part of something where you summarise…
//   33. conclusion   noun  (See word 8 above -- this word is listed once.)
//   22. connoisseur  noun  A person who knows a lot about something…
//   32. connoisseur  noun  (See word 22 above -- this word is listed once.)
//
// So the unit teaches 31 words, which is what Units 6 and 8 carry too. The
// build handled the two pointers differently and got both wrong: for
// connoisseur it kept the POINTER (32) and dropped the real entry (22) —
// hence the gap at 22 — and for conclusion it kept BOTH. Someone then
// authored real content onto the pointers, so 33-conclusion arrived with a
// plausible second meaning, four practice sentences and five generated clips,
// and looked like a deliberate second sense rather than a phantom.
//
// What the learner sees: two identical "conclusion" rows in the dictionary,
// both labelled "noun · Words to Know", each needing "I know this word"
// separately — and Vocabulary completes on the id list, so the same word has
// to be marked twice to open Reading.
//
// This removes the phantom (33) and keeps the source's real entry (8). The
// count drops 32 → 31 wherever it is recorded. NOTE this does NOT touch the
// connoisseur half: dropping a pointer is reversible, but restoring word 22's
// real entry means authoring meaning, sentences and audio, which is content
// work and not a repair.
//
// Four files carry the word, and a fifth surface is on disk:
//   - units/unit-7.json          the group's id list, the dictionaryLinks
//                                entry, and the grown-up guide's printed list
//   - master-dictionary.grade8.json   the entry itself + entryCount
//   - sentence-glossary.json     the glossary key + entryCount
//   - course-manifest.json       the unit's vocabularyCount
//   - media/audio/grade-8/…      7 clips nothing can reach any more
//
// Edits raw text rather than reserialising: these files carry \u escapes that
// JSON.stringify would rewrite across thousands of untouched lines. Every file
// is re-parsed and asserted before it is written. Idempotent.
//
//   node tools/repair-english-g8u7-duplicate-conclusion.mjs [--dry] [--keep-audio]

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const G8 = join(ROOT, "src/prototypes/ehel-academy/english/grade-8");
const DATA = join(G8, "data");

const VOCAB_ID = "u7-g1-33-33-conclusion";
const ENTRY_ID = "ehel-dict-en-33-conclusion-noun-01";
const GLOSSARY_KEY = "33-conclusion";
const KEPT_ID = "u7-g1-8-8-conclusion";

const dry = process.argv.includes("--dry");
const keepAudio = process.argv.includes("--keep-audio");
const say = (s) => console.log(s);
let wrote = 0;
let skipped = 0;

// Remove the whole JSON object that contains `anchor`, by brace-matching from
// the `{` that opens it. Line-based so the surrounding formatting is untouched.
// Handles the trailing comma on either the removed element or the one before it,
// so the last element of an array can go as safely as the first.
function removeObjectContaining(text, anchor) {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.includes(anchor));
  if (at === -1) return null;
  let start = at;
  while (start >= 0 && !/^\s*\{\s*$/.test(lines[start])) start -= 1;
  if (start < 0) throw new Error(`no opening brace above ${anchor}`);
  let depth = 0;
  let end = -1;
  for (let i = start; i < lines.length; i += 1) {
    for (const ch of lines[i]) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    if (depth === 0) { end = i; break; }
  }
  if (end === -1) throw new Error(`unbalanced object at ${anchor}`);
  const removedIsLast = !/,\s*$/.test(lines[end]);
  const kept = [...lines.slice(0, start), ...lines.slice(end + 1)];
  // The element removed was last in its array, so the one now last must lose
  // its trailing comma.
  if (removedIsLast) {
    for (let i = start - 1; i >= 0; i -= 1) {
      if (/,\s*$/.test(kept[i])) { kept[i] = kept[i].replace(/,(\s*)$/, "$1"); break; }
      if (kept[i].trim()) break;
    }
  }
  return kept.join("\n");
}

function edit(file, label, transform, assertFn) {
  const path = join(DATA, file);
  const before = readFileSync(path, "utf8");
  const after = transform(before);
  if (after === null || after === before) {
    say(`  – ${file}: ${label} — already repaired`);
    skipped += 1;
    return;
  }
  const parsed = JSON.parse(after); // throws on malformed output
  assertFn(parsed);
  say(`  ${dry ? "would fix" : "✓"} ${file}: ${label}`);
  if (!dry) writeFileSync(path, after);
  wrote += 1;
}

say(`Grade 8 Unit 7 — removing the phantom "conclusion" (${VOCAB_ID}), keeping ${KEPT_ID}\n`);

// 1. the unit: id list, dictionaryLinks entry, grown-up guide word list
edit("units/unit-7.json", "group id list, dictionaryLinks entry, grown-up guide list", (text) => {
  if (!text.includes(VOCAB_ID)) return null;
  let out = text
    .replace(`        "u7-g1-32-32-connoisseur",\n        "${VOCAB_ID}"\n`, `        "u7-g1-32-32-connoisseur"\n`)
    .replace(" · 33-conclusion\"", "\"");
  out = removeObjectContaining(out, `"vocabularyId": "${VOCAB_ID}",`);
  return out;
}, (unit) => {
  const group = unit.vocabularyGroups.find((g) => g.id === "u7-g1-vocabulary-group-1");
  const links = unit.dictionaryLinks.filter((l) => l.groupId === group.id);
  const guide = JSON.stringify(unit.grownUpGuide);
  if (group.vocabularyIds.length !== 31) throw new Error(`group holds ${group.vocabularyIds.length} ids, expected 31`);
  if (links.length !== 31) throw new Error(`${links.length} links, expected 31`);
  if (!group.vocabularyIds.includes(KEPT_ID)) throw new Error(`the kept entry ${KEPT_ID} is gone`);
  if (JSON.stringify(unit).includes(VOCAB_ID)) throw new Error("the phantom id still appears somewhere in the unit");
  if (guide.includes("33-conclusion")) throw new Error("the grown-up guide still lists it");
  if (!guide.includes("8-conclusion")) throw new Error("the grown-up guide lost the kept word");
  const ids = new Set(group.vocabularyIds);
  if (ids.size !== group.vocabularyIds.length) throw new Error("the id list still holds a duplicate");
  const words = links.map((l) => String(l.masterWord).replace(/^\d+-/, ""));
  const dupes = words.filter((w, i) => words.indexOf(w) !== i);
  if (dupes.length) throw new Error(`still teaching a word twice: ${dupes.join(", ")}`);
});

// 2. the master dictionary: the entry and its declared count
edit("master-dictionary.grade8.json", "entry + entryCount", (text) => {
  if (!text.includes(ENTRY_ID)) return null;
  const out = removeObjectContaining(text, `"dictionaryEntryId": "${ENTRY_ID}",`);
  return out.replace(`"entryCount": 2184`, `"entryCount": 2183`);
}, (dict) => {
  if (dict.entries.length !== 2183) throw new Error(`${dict.entries.length} entries, expected 2183`);
  if (dict.entryCount !== dict.entries.length) throw new Error(`entryCount ${dict.entryCount} disagrees with ${dict.entries.length} entries`);
  if (dict.entries.some((e) => e.dictionaryEntryId === ENTRY_ID)) throw new Error("the entry is still there");
  if (!dict.entries.some((e) => e.dictionaryEntryId === "ehel-dict-en-8-conclusion-noun-01")) throw new Error("the kept entry is gone");
});

// 3. the sentence glossary: the key and its declared count
edit("sentence-glossary.json", "glossary key + entryCount", (text) => {
  if (!text.includes(`"${GLOSSARY_KEY}": {`)) return null;
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim().startsWith(`"${GLOSSARY_KEY}": {`));
  let depth = 0;
  let end = -1;
  for (let i = start; i < lines.length; i += 1) {
    for (const ch of lines[i]) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    if (depth === 0) { end = i; break; }
  }
  const removedIsLast = !/,\s*$/.test(lines[end]);
  const kept = [...lines.slice(0, start), ...lines.slice(end + 1)];
  if (removedIsLast) {
    for (let i = start - 1; i >= 0; i -= 1) {
      if (/,\s*$/.test(kept[i])) { kept[i] = kept[i].replace(/,(\s*)$/, "$1"); break; }
      if (kept[i].trim()) break;
    }
  }
  return kept.join("\n").replace(`"entryCount": 3837`, `"entryCount": 3836`);
}, (glossary) => {
  const keys = Object.keys(glossary.entries);
  if (keys.includes(GLOSSARY_KEY)) throw new Error("the glossary key is still there");
  if (!keys.includes("8-conclusion")) throw new Error("the kept glossary key is gone");
  if (glossary.entryCount !== keys.length) throw new Error(`entryCount ${glossary.entryCount} disagrees with ${keys.length} keys`);
});

// 4. the manifest's own count, which check:english compares against the unit
edit("course-manifest.json", "unit 7 vocabularyCount 182 → 181", (text) => {
  if (!text.includes(`"vocabularyCount": 182`)) return null;
  return text.replace(`"vocabularyCount": 182`, `"vocabularyCount": 181`);
}, (manifest) => {
  const unit = (manifest.units || manifest.modules).find((u) => u.number === 7);
  if (unit.vocabularyCount !== 181) throw new Error(`manifest says ${unit.vocabularyCount}, expected 181`);
});

// 5. the clips nothing can reach any more. Committed, so git still has them —
// which is the only reason deleting them is free.
const ORPHANS = [
  "media/audio/grade-8/vocabulary/u7-g1-33-33-conclusion-meaning.mp3",
  "media/audio/grade-8/vocabulary/u7-g1-33-33-conclusion-sentence-1.mp3",
  "media/audio/grade-8/vocabulary/u7-g1-33-33-conclusion-sentence-2.mp3",
  "media/audio/grade-8/vocabulary/u7-g1-33-33-conclusion-sentence-3.mp3",
  "media/audio/grade-8/vocabulary/u7-g1-33-33-conclusion-sentence-4.mp3",
  "media/audio/grade-8/glossary/33-conclusion.mp3",
  "media/audio/grade-8/glossary/33-conclusion-meaning.mp3",
];
say("");
let gone = 0;
for (const rel of ORPHANS) {
  const path = join(G8, "..", rel.replace("media/", "media/"));
  const real = join(dirname(G8), rel);
  const target = existsSync(real) ? real : path;
  if (!existsSync(target)) { say(`  – ${rel} — already gone`); continue; }
  if (keepAudio) { say(`  · ${rel} — orphaned, kept (--keep-audio)`); continue; }
  say(`  ${dry ? "would delete" : "✓ deleted"} ${rel}`);
  if (!dry) unlinkSync(target);
  gone += 1;
}

say(`\n${dry ? "Would change" : "Changed"} ${wrote} file(s), ${skipped} already repaired, ${gone} orphaned clip(s) ${dry ? "to delete" : "deleted"}.`);
say(`Grade 8 Unit 7 now teaches 31 words, matching Units 6 and 8 and the source's 31 distinct entries.`);
