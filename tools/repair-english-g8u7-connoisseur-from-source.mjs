#!/usr/bin/env node
// Grade 8 Unit 7's connoisseur entry teaches an invented meaning, not its own.
//
// The source list carries the word once, at 22, and prints a pointer at 32:
//
//   22. connoisseur  noun  A person who knows a lot about something and can
//                          judge its quality.
//                          My uncle is a connoisseur of fine teas and can
//                          identify each blend by taste.
//   32. connoisseur  noun  (See word 22 above -- this word is listed once.)
//
// The build kept 32 — the POINTER — and dropped 22, the real entry. Content was
// then authored onto the pointer to fill the hole ("An expert who has trained
// their senses to recognise and judge quality in a particular field, such as
// art, food or music." / "The museum curator, a true connoisseur of
// calligraphy…"), so the unit ships a definition and example that appear
// nowhere in its source.
//
// Measured, not assumed: of the unit's 31 taught words, 29 match the source
// meaning AND example character for character. The only other difference is
// replenish's example, "pitcher" → "jug", which is the deliberate UK-vocabulary
// pass and is left alone. connoisseur is the single real drift.
//
// This puts word 22's own definition and example back. Five files hold the
// text, and the two clips that NARRATE it cannot survive the change:
//
//   units/unit-7.json               childMeaning, exampleSentence, meaningAudio
//   master-dictionary.grade8.json   canonicalMeaning
//   sentence-glossary.json          definition, definitionAudio
//   games/unit-7.json               the word/meaning pair in the matching game
//   media/…                         2 clips that read the old meaning aloud
//
// WHY THE CLIPS ARE DELETED RATHER THAN LEFT
//
// English names its clips for their CONTENT slot, not for a hash of their text,
// so editing the words leaves the old recording in place, still available:true,
// and nothing notices — the failure that cost this course 853 stale clips. The
// two meaning clips here read the invented definition, so keeping them means
// the learner reads one meaning and hears another.
//
// Deleting the files is also what makes a future re-record actually happen:
// generate-ehel-english-audio.js REUSES any mp3 over 1 KB that already exists,
// so a regeneration run with the old file present would skip it and re-assert
// the stale audio. The descriptors go available:false in the same change, which
// is the honest state — no clip for this text yet — and renders no Listen
// button rather than falling back to the paid runtime endpoint.
//
// Nothing is sent to ElevenLabs here. Re-recording is two clips, ~134
// characters, and is a separate deliberate step:
//
//   node tools/generate-ehel-english-audio.js --grades 8 --dry
//
// The example sentence needs no clip: practiceSentences are what the card
// narrates, and exampleSentence is only their fallback plus the tutor's
// context line (shell/wehel.js). The four practice sentences and their four
// clips are authored rather than sourced — every word in the course has them —
// so they are untouched.
//
// Idempotent; re-parses and asserts before writing.
//
//   node tools/repair-english-g8u7-connoisseur-from-source.mjs [--dry]

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const G8 = join(ROOT, "src/prototypes/ehel-academy/english/grade-8");
const DATA = join(G8, "data");
const MEDIA = join(ROOT, "src/prototypes/ehel-academy/english/media/audio/grade-8");
const dry = process.argv.includes("--dry");

// Verbatim from inputs/ehel-grade8-source/Year 8/Unit 7/Year 8 -- Unit 7
// Vocabulary.docx, entry 22.
const SOURCE_MEANING = "A person who knows a lot about something and can judge its quality.";
const SOURCE_EXAMPLE = "My uncle is a connoisseur of fine teas and can identify each blend by taste.";
const AUTHORED_MEANING = "An expert who has trained their senses to recognise and judge quality in a particular field, such as art, food or music.";
const AUTHORED_EXAMPLE = "The museum curator, a true connoisseur of calligraphy, recognised the master's brushwork at a single glance.";
const PENDING = "Pending re-record - meaning restored from source entry 22";

const read = (f) => readFileSync(join(DATA, f), "utf8");
let changed = 0;

// Flip available/status inside the one audio object that names `anchor`,
// found by brace-matching from its line so no neighbouring descriptor moves.
function markPending(text, anchor) {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.includes(anchor));
  if (at === -1) return text;
  let start = at;
  while (start >= 0 && !lines[start].includes("{")) start -= 1;
  let depth = 0;
  let end = -1;
  for (let i = start; i < lines.length; i += 1) {
    for (const ch of lines[i]) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    if (depth === 0) { end = i; break; }
  }
  for (let i = start; i <= end; i += 1) {
    lines[i] = lines[i]
      .replace(/"available": true/, `"available": false`)
      .replace(/"status": "Generated"/, `"status": ${JSON.stringify(PENDING)}`);
  }
  return lines.join("\n");
}

function edit(file, transform, assertFn) {
  const before = read(file);
  const after = transform(before);
  if (after === before) { console.log(`  – ${file}: already repaired`); return; }
  const parsed = JSON.parse(after);
  // The assertion needs the BEFORE state: thousands of story-glossary meanings
  // are legitimately available:false already, so "only connoisseur is false" is
  // not the question — "only connoisseur CHANGED" is.
  assertFn(parsed, JSON.parse(before));
  console.log(`  ${dry ? "would fix" : "✓"} ${file}`);
  if (!dry) writeFileSync(join(DATA, file), after);
  changed += 1;
}

console.log(`Grade 8 Unit 7 — restoring connoisseur from source entry 22\n`);
console.log(`  was: ${AUTHORED_MEANING}`);
console.log(`  now: ${SOURCE_MEANING}\n`);

edit("units/unit-7.json", (text) => {
  let out = text
    .split(JSON.stringify(AUTHORED_MEANING)).join(JSON.stringify(SOURCE_MEANING))
    .split(JSON.stringify(AUTHORED_EXAMPLE)).join(JSON.stringify(SOURCE_EXAMPLE));
  return markPending(out, "u7-g1-32-32-connoisseur-meaning.mp3");
}, (unit, was) => {
  const link = unit.dictionaryLinks.find((l) => l.masterWord === "connoisseur");
  if (link.childMeaning !== SOURCE_MEANING) throw new Error("the meaning did not take");
  if (link.exampleSentence !== SOURCE_EXAMPLE) throw new Error("the example did not take");
  if (link.meaningAudio.available !== false) throw new Error("the stale meaning clip is still declared available");
  if (link.sentenceAudio.length !== 4 || link.sentenceAudio.some((a) => a.available !== true)) throw new Error("a practice-sentence clip was disturbed");
  if (link.practiceSentences.length !== 4) throw new Error("the practice sentences were disturbed");
  if (JSON.stringify(unit).includes("trained their senses")) throw new Error("the authored meaning is still in the unit");
  // Only connoisseur's clip may have CHANGED. Many story-glossary meanings are
  // already available:false and must stay exactly as they were.
  const offSet = (u) => new Set(u.dictionaryLinks.filter((l) => l.meaningAudio && l.meaningAudio.available === false).map((l) => l.vocabularyId));
  const newlyOff = [...offSet(unit)].filter((id) => !offSet(was).has(id));
  if (newlyOff.length !== 1 || newlyOff[0] !== "u7-g1-32-32-connoisseur") throw new Error(`flipped the wrong clips: ${newlyOff.join(", ") || "none"}`);
  if ([...offSet(was)].some((id) => !offSet(unit).has(id))) throw new Error("a clip that was pending became available");
});

edit("master-dictionary.grade8.json", (text) =>
  text.split(JSON.stringify(AUTHORED_MEANING)).join(JSON.stringify(SOURCE_MEANING)),
(dict) => {
  const entry = dict.entries.find((e) => e.dictionaryEntryId === "ehel-dict-en-connoisseur-noun-01");
  if (entry.canonicalMeaning !== SOURCE_MEANING) throw new Error("canonicalMeaning did not take");
  // The word clip says "connoisseur"; the meaning never reached it.
  if (entry.audio.available !== true) throw new Error("the word clip was disturbed — it narrates the word, not the meaning");
});

edit("sentence-glossary.json", (text) => {
  let out = text.split(JSON.stringify(AUTHORED_MEANING)).join(JSON.stringify(SOURCE_MEANING));
  return markPending(out, "32-connoisseur-meaning.mp3");
}, (glossary, was) => {
  const entry = glossary.entries.connoisseur;
  if (entry.definition !== SOURCE_MEANING) throw new Error("the glossary definition did not take");
  if (entry.definitionAudio.available !== false) throw new Error("the stale definition clip is still declared available");
  if (entry.wordAudio.available !== true) throw new Error("the word clip was disturbed — it narrates the word, not the meaning");
  const offSet = (g) => new Set(Object.entries(g.entries).filter(([, e]) => e.definitionAudio && e.definitionAudio.available === false).map(([k]) => k));
  const newlyOff = [...offSet(glossary)].filter((k) => !offSet(was).has(k));
  if (newlyOff.length !== 1 || newlyOff[0] !== "connoisseur") throw new Error(`flipped the wrong glossary clips: ${newlyOff.join(", ") || "none"}`);
  if ([...offSet(was)].some((k) => !offSet(glossary).has(k))) throw new Error("a glossary clip that was pending became available");
});

edit("games/unit-7.json", (text) =>
  text.split(JSON.stringify(AUTHORED_MEANING)).join(JSON.stringify(SOURCE_MEANING)),
(games) => {
  if (JSON.stringify(games).includes("trained their senses")) throw new Error("the authored meaning is still in the games file");
  if (!JSON.stringify(games).includes(SOURCE_MEANING)) throw new Error("the source meaning is not in the games file");
});

// The two clips that read the old definition aloud.
console.log("");
const STALE = [
  ["vocabulary/u7-g1-32-32-connoisseur-meaning.mp3", "the word card's Meaning button"],
  ["glossary/32-connoisseur-meaning.mp3", "the glossary popover's meaning button"],
];
let gone = 0;
for (const [rel, what] of STALE) {
  const path = join(MEDIA, rel);
  if (!existsSync(path)) { console.log(`  – ${rel} — already gone`); continue; }
  console.log(`  ${dry ? "would delete" : "✓ deleted"} ${rel}  (${what})`);
  if (!dry) unlinkSync(path);
  gone += 1;
}

console.log(`\n${dry ? "Would change" : "Changed"} ${changed} file(s); ${gone} stale clip(s) ${dry ? "to delete" : "deleted"}.`);
console.log(`Re-record is ${SOURCE_MEANING.length * 2} characters and is NOT done here.`);
