#!/usr/bin/env node
// English units: make vocabularyGroups say what Vocabulary actually gates on.
//
// Two repairs, both idempotent, both on data the Core-words restructure left in
// a shape the runtime and the gate read differently from how it was written.
//
// 1. THE GLOSSARY GROUP MUST CARRY ITS CANONICAL TITLE.
//    english.js identifies the story glossary by one exact string
//    (STORY_GLOSSARY_GROUP = "Words from our stories") and completes Vocabulary
//    on every OTHER group. A glossary under any other name matches nothing, so
//    taughtGroups() comes back the same length as vocabularyGroups, taughtWords()
//    falls through to the whole list, and the section gates on the glossary too.
//    Grade 1 Unit 3 shipped that way: 39 Core words became a 103-word gate, and
//    Vocabulary sits in front of Reading in SECTION_CHAIN, so 64 story words were
//    a prerequisite for the story they were glossed from.
//    build-english-core-words.mjs finds a glossary by `strand` or by any title
//    mentioning stories — deliberately broader than the runtime — and then wrote
//    the merged group out under the FIRST match's title. Unit 3 had two glossary
//    groups ("Animals in our stories" and "Words from our stories") and the wrong
//    one won.
//
// 2. EVERY GROUP MUST CARRY ITS vocabularyIds.
//    Three readers measure a group's size with `group.vocabularyIds?.length || 0`
//    — check-english-content.mjs's three vocabulary rules, and the unit Study
//    Plan's newWordCount / storyWordCount in english.js. The restructure stopped
//    emitting the field, so at Grades 1-2 all of them measure zero: the gate's
//    taught-word ceiling, its empty-taught-set rule and its structural
//    "glossary under another name" detector all compared 0 against 0 and passed
//    having measured nothing. That detector was written for exactly the defect
//    in (1) and could not see it. The ids are recoverable in full from
//    dictionaryLinks, which is where the other grades' copies came from.
//
// Reported by default, so the diff is the review surface:
//
//   node tools/repair-english-vocabulary-groups.mjs           # report
//   node tools/repair-english-vocabulary-groups.mjs --write   # apply
import fs from "node:fs";
import path from "node:path";

const STORY_GLOSSARY_GROUP = "Words from our stories";
const ENGLISH = path.join("src", "prototypes", "ehel-academy", "english");
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") { console.error(`Unrecognised argument: ${a}`); process.exit(2); }
}

const files = [];
for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(ENGLISH, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (let n = 0; n <= 10; n += 1) {
    const file = path.join(dir, `unit-${n}.json`);
    if (fs.existsSync(file)) files.push({ grade, n, file });
  }
}
if (files.length < 80) {
  // 81 units today. A path change that finds a handful would repair a handful
  // and report success, which is the shape this repo keeps being caught by.
  console.error(`Refusing to run: found ${files.length} unit files, expected at least 80.`);
  process.exit(1);
}

let renamed = 0;
let filled = 0;
let touched = 0;
const notes = [];

for (const { grade, n, file } of files) {
  const raw = fs.readFileSync(file, "utf8");
  const doc = JSON.parse(raw);
  const groups = doc.vocabularyGroups || [];
  const links = doc.dictionaryLinks || [];
  const label = `grade-${grade}/unit-${n}`;
  const changes = [];

  // (1) A group the builder marked as the glossary, under any other name.
  for (const group of groups) {
    if (group.strand !== "glossary" || group.title === STORY_GLOSSARY_GROUP) continue;
    const mine = links.filter((link) => link.groupId === group.id);
    changes.push(`glossary group ${JSON.stringify(group.title)} → ${JSON.stringify(STORY_GLOSSARY_GROUP)}`
      + ` (${mine.length} words leave the Vocabulary gate)`);
    group.title = STORY_GLOSSARY_GROUP;
    for (const link of mine) if (link.groupTitle !== undefined) link.groupTitle = STORY_GLOSSARY_GROUP;
    renamed += 1;
  }

  // (2) vocabularyIds, in link order — the same derivation the other grades'
  // builders use, so a repaired unit is indistinguishable from a built one.
  const known = new Set(groups.map((group) => group.id));
  const orphans = links.filter((link) => !known.has(link.groupId));
  if (orphans.length) notes.push(`${label}: ${orphans.length} dictionaryLinks name no vocabularyGroup`);
  for (const group of groups) {
    const ids = links.filter((link) => link.groupId === group.id).map((link) => link.vocabularyId);
    if (JSON.stringify(group.vocabularyIds) === JSON.stringify(ids)) continue;
    const had = group.vocabularyIds === undefined ? "absent" : `${group.vocabularyIds.length} ids`;
    changes.push(`${JSON.stringify(group.title)} vocabularyIds ${had} → ${ids.length}`);
    // Rebuilt rather than assigned, so the field lands where the other grades
    // keep it (after title) instead of after strand.
    const rebuilt = { id: group.id, number: group.number, title: group.title, vocabularyIds: ids };
    for (const [key, value] of Object.entries(group)) {
      if (!(key in rebuilt)) rebuilt[key] = value;
    }
    for (const key of Object.keys(group)) delete group[key];
    Object.assign(group, rebuilt);
    filled += 1;
  }

  if (!changes.length) continue;
  touched += 1;
  console.log(`${label}`);
  for (const change of changes) console.log(`    ${change}`);
  if (!WRITE) continue;
  // 2-space indent and a trailing newline: the shape every English unit is
  // stored in, and what keeps the diff to the lines that changed.
  const out = JSON.stringify(doc, null, 2) + "\n";
  if (out !== raw) fs.writeFileSync(file, out);
}

for (const note of notes) console.log(note);
console.log(`\n${files.length} units read | ${touched} to change`
  + ` | ${renamed} glossary group(s) renamed | ${filled} group(s) given vocabularyIds`);
if (!WRITE) console.log("Report only — nothing written. Re-run with --write to apply.");
else console.log("Done. Run: npm run check:english");
