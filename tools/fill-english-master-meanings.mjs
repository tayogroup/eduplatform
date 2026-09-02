#!/usr/bin/env node
// Fill `canonicalMeaning` on master-dictionary entries that have none, by
// DERIVING it from the unit link that already defines the same entry.
//
// The gap is visible in one place: Student resources -> "Every word in Grade N"
// (english.js :: renderGradeDictionary) prints `displayWord`, the part of speech
// and then ` · canonicalMeaning` only where there is one. 3,806 of 13,721 rows
// showed a word and its part of speech and nothing else.
//
// NOTHING IS INVENTED HERE, and that is the whole design. Every one of those
// entries is linked from a unit in its own grade, and every unit link carries a
// `childMeaning` written for a child and reviewed as course content. So the
// meaning already exists; it simply was not copied onto the master row. The join
// is `dictionaryEntryId`, exact — the same key linkedWords() uses to attach
// `.master` — so a lemma that means different things in different grades cannot
// cross over. That matters here: "light" is a traffic signal at Grade 1 and
// "march" is a month at Grade 3.
//
// A few entries are linked from more than one unit with differently WORDED
// meanings — 34 of 3,806, all paraphrases of one sense ("A round fruit that is
// sweet and crunchy" against "A round, crunchy fruit"). The tie-break is the
// EARLIEST unit that teaches the word, because that is the wording the learner
// met first; picking the longest or the last would be arbitrary and would change
// under a content edit.
//
//   node tools/fill-english-master-meanings.mjs              # report, all grades
//   node tools/fill-english-master-meanings.mjs --grade 2    # report, one grade
//   node tools/fill-english-master-meanings.mjs --write      # apply
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
let GRADE = null, WRITE = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  if (argv[i] === "--write") { WRITE = true; continue; }
  // An unrecognised argument is refused rather than ignored: the default action
  // here rewrites eight content files, and a typo must not silently widen it.
  console.error(`Unrecognised argument: ${argv[i]}`);
  console.error("Usage: fill-english-master-meanings.mjs [--grade N] [--write]");
  process.exit(2);
}

const grades = GRADE ? [GRADE] : [1, 2, 3, 4, 5, 6, 7, 8];
let filled = 0, already = 0, unsourced = 0, ties = 0;

for (const grade of grades) {
  const dictPath = path.join(ROOT, `grade-${grade}`, "data", `master-dictionary.grade${grade}.json`);
  const unitsDir = path.join(ROOT, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dictPath) || !fs.existsSync(unitsDir)) { console.log(`grade ${grade}: no dictionary or units — skipped`); continue; }

  // entryId -> { unit, meaning } from the EARLIEST unit that defines it.
  const source = new Map();
  const unitFiles = fs.readdirSync(unitsDir).filter((f) => /^unit-\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  for (const file of unitFiles) {
    const unitNo = Number(file.match(/\d+/)[0]);
    const links = JSON.parse(fs.readFileSync(path.join(unitsDir, file), "utf8")).dictionaryLinks || [];
    for (const link of links) {
      const meaning = String(link.childMeaning || "").trim();
      if (!meaning || !link.dictionaryEntryId) continue;
      const seen = source.get(link.dictionaryEntryId);
      if (!seen) { source.set(link.dictionaryEntryId, { unit: unitNo, meaning }); continue; }
      if (seen.meaning !== meaning) seen.tie = true; // recorded, not resolved: the earliest already won
    }
  }

  const raw = fs.readFileSync(dictPath, "utf8");
  const doc = JSON.parse(raw);
  // Re-serialise with the file's OWN indent, not a chosen one. These files are
  // not uniform — Grade 1 is written with two spaces and Grades 2-8 with one —
  // so a fixed `null, 2` rewrites every line of seven of them: the first run of
  // this tool produced 321,335 insertions for 3,806 values, which is a diff
  // nobody can review and a history nobody can bisect. Read from the second
  // line, which is the first key of the top-level object.
  const indent = (raw.match(/^\{\r?\n( +)"/) || [null, "  "])[1];
  const trailingNewline = raw.endsWith("\n");
  let gradeFilled = 0, gradeUnsourced = 0, gradeTies = 0;
  for (const entry of doc.entries || []) {
    if (String(entry.canonicalMeaning || "").trim()) { already++; continue; }
    const found = source.get(entry.dictionaryEntryId);
    if (!found) { unsourced++; gradeUnsourced++; continue; }
    if (found.tie) { ties++; gradeTies++; }
    // Placed where its siblings keep it — after `partOfSpeechDefinition` —
    // rather than appended. These entries have no `canonicalMeaning` key at all,
    // so a plain assignment puts it last, after the audio block, and the file
    // ends up with the same field in two different places depending on whether a
    // human or this tool wrote it. Every other key keeps its order.
    const at = Object.keys(entry).indexOf("partOfSpeechDefinition");
    const rebuilt = {};
    Object.entries(entry).forEach(([key, value], index) => {
      rebuilt[key] = value;
      if (index === at) rebuilt.canonicalMeaning = found.meaning;
    });
    if (at < 0) rebuilt.canonicalMeaning = found.meaning; // no anchor: append rather than drop
    for (const key of Object.keys(entry)) delete entry[key];
    Object.assign(entry, rebuilt);
    filled++; gradeFilled++;
  }
  console.log(`grade ${grade}: ${gradeFilled} filled${gradeTies ? ` (${gradeTies} had more than one wording — earliest unit won)` : ""}${gradeUnsourced ? `, ${gradeUnsourced} WITH NO SOURCE` : ""}`);
  if (WRITE && gradeFilled) fs.writeFileSync(dictPath, JSON.stringify(doc, null, indent) + (trailingNewline ? "\n" : ""));
}

console.log(`\ntotal: ${filled} to fill | ${already} already had one | ${unsourced} with no source | ${ties} resolved by earliest-unit`);
console.log(WRITE ? "written." : "(report only — pass --write to apply)");
if (unsourced) {
  console.log("\nEntries with no source cannot be derived and would have to be authored; none were touched.");
}
