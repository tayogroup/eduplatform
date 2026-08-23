#!/usr/bin/env node
// Grade 8 Unit 7 carries its source list's NUMBERS inside the words themselves.
//
// Every one of its 31 taught words is stored as "1-benign", "8-conclusion",
// "31-initiative" — the numbering of the list in the source booklet, never
// stripped. No other unit in any grade does this; Units 6 and 8 hold plain
// "atrocity" and "campaign". It survived because the two fields a learner
// actually reads, displayWord and lemma, are clean, so the dictionary looks
// right and only the surfaces nobody checks are wrong:
//
//   - the sentence glossary is KEYED by the word, and linkGlossaryWords looks
//     up /[A-Za-z']+/ tokens from the passage. A key "1-benign" cannot be
//     produced by that regex under any input, so all 31 words are invisible to
//     the glossary — no popover, on any sentence in the grade that uses them.
//   - the AI tutor is sent masterWord (shell/wehel.js), so it receives
//     "1-benign : A gentle or harmless thing…".
//   - the grown-up guide PRINTS masterWord, in two places: the "Words They
//     Will Learn" list ("New words in this unit: 1-benign · 2-reprieve · …")
//     and a suggested tutor prompt ("Ask me questions about the word
//     '1-benign'.").
//
// The capstone reuses four of these entries in its Grade 8 Review Words, so
// unit-10 carries the same mangling for benign, reprieve, defect and
// disposition and is repaired with it.
//
// WHAT THIS DELIBERATELY DOES NOT TOUCH
//
// `vocabularyId` keeps its shape ("u7-g1-1-1-benign"), and so does every mp3
// path. The clips are NAMED for the vocabularyId — u7-g1-1-1-benign-sentence-1
// .mp3 — and they are live on the CDN under those names, so renaming the id
// would either strand 155 files or force a re-upload of all of them, and
// `knownWords` in a learner's saved progress is a list of these very ids, so
// renaming silently un-marks every word anyone has learned in this unit.
// Nothing displays a vocabularyId. Renaming identifiers and words while
// leaving paths alone also means no audio URL changes, so no browser holds a
// stale clip — the year-long media cache is never involved.
//
// Ids are rewritten in all four files at once or the join breaks:
//   units/unit-7.json               masterWord, dictionaryEntryId, senseId, guide
//   units/unit-10.json              the same three fields on 4 review words
//   master-dictionary.grade8.json   dictionaryEntryId, senseId on 31 entries
//   sentence-glossary.json          31 keys
//
// The word list is derived from the data, never hard-coded, and every
// replacement is anchored to its exact field so that "1-benign" inside
// "u7-g1-1-1-benign" and inside an mp3 path is left alone. Re-parses and
// asserts before writing. Idempotent.
//
//   node tools/repair-english-g8u7-numbered-words.mjs [--dry]

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src/prototypes/ehel-academy/english/grade-8/data");
const dry = process.argv.includes("--dry");

const read = (f) => readFileSync(join(DATA, f), "utf8");
const PREFIXED = /^(\d{1,2})-([a-z]+)$/;

// ---- the word list, taken from the unit itself ----------------------------
const unit7 = JSON.parse(read("units/unit-7.json"));
const taught = unit7.vocabularyGroups.find((g) => g.title === "Words to Know");
const words = [];
for (const link of unit7.dictionaryLinks.filter((l) => l.groupId === taught.id)) {
  const m = PREFIXED.exec(link.masterWord || "");
  if (!m) continue;
  words.push({
    numbered: link.masterWord,
    plain: m[2],
    entryId: link.dictionaryEntryId,
    newEntryId: link.dictionaryEntryId.replace(/^ehel-dict-en-\d+-/, "ehel-dict-en-"),
    senseId: link.senseId,
    newSenseId: link.senseId.replace(/^ehel-dict-en-\d+-/, "ehel-dict-en-"),
  });
}

if (!words.length) {
  console.log("No numbered words left in Grade 8 Unit 7 — already repaired.");
  process.exit(0);
}

// A rename that lands on an id or key something else already owns would merge
// two words. Checked before anything is written.
const dict = JSON.parse(read("master-dictionary.grade8.json"));
const existingIds = new Set(dict.entries.map((e) => e.dictionaryEntryId));
const glossary = JSON.parse(read("sentence-glossary.json"));
const existingKeys = new Set(Object.keys(glossary.entries));
const clashes = [];
for (const w of words) {
  if (existingIds.has(w.newEntryId)) clashes.push(`${w.entryId} → ${w.newEntryId} (already exists)`);
  if (existingKeys.has(w.plain)) clashes.push(`glossary key "${w.numbered}" → "${w.plain}" (already exists)`);
}
if (clashes.length) {
  console.error("Refusing to run — these renames would collide with existing ids or keys:");
  clashes.forEach((c) => console.error("  " + c));
  process.exit(1);
}

console.log(`Grade 8 Unit 7: ${words.length} numbered words → plain words\n`);
console.log("  " + words.map((w) => `${w.numbered}→${w.plain}`).join(", ") + "\n");

let changed = 0;
function edit(file, transform, assertFn) {
  const before = read(file);
  const after = transform(before);
  if (after === before) { console.log(`  – ${file}: already repaired`); return; }
  const parsed = JSON.parse(after);
  assertFn(parsed, before, after);
  console.log(`  ${dry ? "would fix" : "✓"} ${file}`);
  if (!dry) writeFileSync(join(DATA, file), after);
  changed += 1;
}

// Anchored to the exact field, so the same characters inside a vocabularyId
// ("u7-g1-1-1-benign") or an mp3 path are untouched.
const renameFields = (text) => {
  let out = text;
  for (const w of words) {
    out = out
      .split(`"masterWord": ${JSON.stringify(w.numbered)}`).join(`"masterWord": ${JSON.stringify(w.plain)}`)
      .split(`"dictionaryEntryId": ${JSON.stringify(w.entryId)}`).join(`"dictionaryEntryId": ${JSON.stringify(w.newEntryId)}`)
      .split(`"senseId": ${JSON.stringify(w.senseId)}`).join(`"senseId": ${JSON.stringify(w.newSenseId)}`);
  }
  return out;
};

// Paths must come through untouched — asserted, not assumed, because the
// numbers live inside the filenames too.
const pathsUnchanged = (before, after) => {
  const paths = (s) => (s.match(/"\.\/media\/[^"]+"/g) || []).sort().join("\n");
  if (paths(before) !== paths(after)) throw new Error("an audio path changed — it must not");
  const vocabIds = (s) => (s.match(/"vocabularyId": "[^"]+"/g) || []).sort().join("\n");
  if (vocabIds(before) !== vocabIds(after)) throw new Error("a vocabularyId changed — it must not");
};

const noneLeft = (obj, where) => {
  const stray = JSON.stringify(obj).match(/"(masterWord|dictionaryEntryId|senseId)": "(ehel-dict-en-)?\d{1,2}-[a-z]/g);
  if (stray) throw new Error(`${where}: ${stray.length} numbered field(s) left, e.g. ${stray[0]}`);
};

edit("units/unit-7.json", (text) => {
  let out = renameFields(text);
  // The grown-up guide prints the words: the "Words They Will Learn" list and
  // the suggested tutor prompt.
  for (const w of words) {
    out = out
      .split(`: ${w.numbered} · `).join(`: ${w.plain} · `)
      .split(` · ${w.numbered} · `).join(` · ${w.plain} · `)
      .split(` · ${w.numbered}"`).join(` · ${w.plain}"`)
      .split(`the word '${w.numbered}'`).join(`the word '${w.plain}'`);
  }
  return out;
}, (unit, before, after) => {
  pathsUnchanged(before, after);
  noneLeft(unit, "unit-7");
  const guide = JSON.stringify(unit.grownUpGuide);
  if (/\d{1,2}-[a-z]{4,}/.test(guide)) throw new Error(`the grown-up guide still prints a numbered word: ${guide.match(/\d{1,2}-[a-z]{4,}/)[0]}`);
  if (!guide.includes("benign · reprieve")) throw new Error("the guide's word list did not come out as expected");
  const links = unit.dictionaryLinks.filter((l) => l.groupId === taught.id);
  if (links.length !== 31) throw new Error(`${links.length} taught links, expected 31`);
  if (new Set(links.map((l) => l.masterWord)).size !== 31) throw new Error("two taught words now share a masterWord");
});

edit("units/unit-10.json", renameFields, (unit, before, after) => {
  pathsUnchanged(before, after);
  noneLeft(unit, "unit-10");
});

edit("master-dictionary.grade8.json", renameFields, (d, before, after) => {
  pathsUnchanged(before, after);
  if (d.entries.length !== d.entryCount) throw new Error("entryCount drifted");
  const ids = d.entries.map((e) => e.dictionaryEntryId);
  if (new Set(ids).size !== ids.length) throw new Error("the rename merged two dictionary entries");
  const stray = ids.filter((id) => /^ehel-dict-en-\d/.test(id));
  if (stray.length) throw new Error(`${stray.length} numbered entry id(s) left, e.g. ${stray[0]}`);
});

edit("sentence-glossary.json", (text) => {
  let out = text;
  for (const w of words) out = out.split(`\n    ${JSON.stringify(w.numbered)}: {`).join(`\n    ${JSON.stringify(w.plain)}: {`);
  return out;
}, (g, before, after) => {
  pathsUnchanged(before, after);
  const keys = Object.keys(g.entries);
  if (keys.length !== g.entryCount) throw new Error(`entryCount ${g.entryCount} disagrees with ${keys.length} keys`);
  const stray = keys.filter((k) => PREFIXED.test(k));
  if (stray.length) throw new Error(`${stray.length} numbered key(s) left, e.g. ${stray[0]}`);
  for (const w of words) if (!keys.includes(w.plain)) throw new Error(`"${w.plain}" is missing from the glossary`);
});

console.log(`\n${dry ? "Would change" : "Changed"} ${changed} file(s).`);
console.log("vocabularyIds and every mp3 path are unchanged by design — the clips are named for the id and are live under those names.");
