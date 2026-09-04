// Repair the part-of-speech tags the Core-words verb census flagged
// (2026-08-31), plus the ones the picture/scene coverage pass turned up
// (2026-09-04): entries whose taught childMeaning contradicts their tag.
//
//   g1 king      "A man in stories who rules a whole country"      -> noun
//   g1 mouth     "The part of your face you use to eat and talk"   -> noun
//   g2+g3 beginning "The start of something, before the middle..." -> noun
//   g1 school    "The place where children go to learn and play"   -> noun (was adjective)
//   g2 cook      "A person who makes food for other people to eat" -> noun (was verb)
//   g4 rhyme     "A rhyme is a short poem with words that end..."  -> noun (was verb)
//   g4 judge     id is literally judge-NOUN-01, sourceType "verb / noun",
//                taught in a people/work/community group alongside baker,
//                dentist, mayor — all occupations, all nouns             -> noun (was verb)
//
// NOT touched, each checked against its taught meaning and found correct:
//   g3 pound  "To hit something hard, again and again"  — a real verb
//   left      g1 adjective (a side) / g2-4 verb (went away) — split by sense
//
// judge's canonicalMeaning still reads as two senses fused into one
// ("To decide if something is good or bad; a person who decides in court.")
// — that is a content-prose issue, not a tag issue, and is left for whoever
// owns that text. Fixing the tag is enough to stop the wrong picture/scene
// class being offered for it.
//
// Entry IDS are never changed, even where they now read oddly
// (ehel-dict-en-beginning-verb-01 stays): unit dictionaryLinks point at them,
// and a renamed id is a dangling link in every unit that taught the word.
// sourceType is left alone too — it records where the entry came from, not
// what a learner is told.
//
// The edit is TEXT SURGERY scoped to each entry's block, never a re-serialise:
// these files carry two different pretty-print styles (2-space and 1-space)
// and re-serialising rewrites every line of a 1MB file under whoever reads
// the diff next. Idempotent: an already-correct entry is reported and skipped.
import fs from "node:fs";

const FIXES = [
  { file: "src/prototypes/ehel-academy/english/grade-1/data/master-dictionary.grade1.json", id: "ehel-en-g1-king", fromPos: "verb", fromDef: "An action word", toDef: "A naming word" },
  { file: "src/prototypes/ehel-academy/english/grade-1/data/master-dictionary.grade1.json", id: "ehel-en-g1-mouth", fromPos: "verb", fromDef: "An action word", toDef: "A naming word" },
  { file: "src/prototypes/ehel-academy/english/grade-2/data/master-dictionary.grade2.json", id: "ehel-dict-en-beginning-verb-01", fromPos: "verb", fromDef: "Shows an action or a state.", toDef: "Names a person, place, thing or idea." },
  { file: "src/prototypes/ehel-academy/english/grade-3/data/master-dictionary.grade3.json", id: "ehel-dict-en-beginning-verb-01", fromPos: "verb", fromDef: "Shows an action or a state.", toDef: "Names a person, place, thing or idea." },
  { file: "src/prototypes/ehel-academy/english/grade-1/data/master-dictionary.grade1.json", id: "ehel-en-g1-school", fromPos: "adjective", fromDef: "A describing word", toDef: "A naming word" },
  { file: "src/prototypes/ehel-academy/english/grade-2/data/master-dictionary.grade2.json", id: "ehel-en-g2-cook", fromPos: "verb", fromDef: "Shows an action or a state.", toDef: "Names a person, place, thing or idea." },
  { file: "src/prototypes/ehel-academy/english/grade-4/data/master-dictionary.grade4.json", id: "ehel-en-g2-rhyme", fromPos: "verb", fromDef: "Shows an action or a state.", toDef: "Names a person, place, thing or idea." },
  { file: "src/prototypes/ehel-academy/english/grade-4/data/master-dictionary.grade4.json", id: "ehel-dict-en-judge-noun-01", fromPos: "verb", fromDef: "Shows an action or a state.", toDef: "Names a person, place, thing or idea." },
];

let failed = false;
const byFile = new Map();
for (const fix of FIXES) {
  if (!byFile.has(fix.file)) byFile.set(fix.file, fs.readFileSync(fix.file, "utf8"));
  let raw = byFile.get(fix.file);

  const anchor = `"dictionaryEntryId": "${fix.id}"`;
  const start = raw.indexOf(anchor);
  if (start < 0) { console.error(`✗ ${fix.file}: entry ${fix.id} not found`); failed = true; continue; }
  const next = raw.indexOf('"dictionaryEntryId"', start + anchor.length);
  const end = next < 0 ? raw.length : next;
  const block = raw.slice(start, end);

  if (block.includes('"partOfSpeech": "noun"')) { console.log(`= ${fix.id}: already noun, skipped`); continue; }
  const posFrom = `"partOfSpeech": "${fix.fromPos}"`;
  const defFrom = `"partOfSpeechDefinition": "${fix.fromDef}"`;
  if (!block.includes(posFrom) || !block.includes(defFrom)) {
    console.error(`✗ ${fix.id}: expected ${fix.fromPos} tag + "${fix.fromDef}" not found in block — refusing to guess`);
    failed = true; continue;
  }
  const fixedBlock = block
    .replace(posFrom, '"partOfSpeech": "noun"')
    .replace(defFrom, `"partOfSpeechDefinition": "${fix.toDef}"`);
  raw = raw.slice(0, start) + fixedBlock + raw.slice(end);
  byFile.set(fix.file, raw);
  console.log(`✓ ${fix.id}: ${fix.fromPos} -> noun`);
}

if (failed) process.exit(1);
for (const [file, raw] of byFile) {
  JSON.parse(raw); // refuse to write a file that no longer parses
  fs.writeFileSync(file, raw);
  console.log(`wrote ${file}`);
}
