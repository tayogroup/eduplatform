#!/usr/bin/env node
// Replace the "Vocabulary Group N" placeholder titles that reach the learner.
//
// Nine English units title their ONLY taught vocabulary group "Vocabulary
// Group 1" — Grade 5 Units 1-2, Grade 6 Units 1-2 and Grade 8 Units 1, 5, 6,
// 7, 8, covering 187 words. Every other unit in every grade names its groups
// ("Colours", "Feelings and Reactions", "Words with the Prefix un-"), and that
// title is read in three places a learner sees: the dictionary's group filter,
// the lecture page's "Teacher Musa introduces <groups>" line, and the unit
// study plan's list of what to meet first. `build-ehel-english-grownup-guides.js`
// already papers over the same placeholder at print time (GENERIC_GROUP); this
// fixes the data underneath so every surface agrees without a special case.
//
// The replacement is deliberately generic. These lists are NOT thematic — Grade
// 8 Unit 1 runs concise, barricade, zeal, longevity, allot, quibble… — so a
// topical title would be a wrong one, and the units' own live-session notes
// call them simply "the vocabulary list". Splitting them into real themed
// groups is a content job, not a rename.
//
// The title is stored TWICE per unit: once on the group, and denormalised onto
// every dictionaryLinks entry as `groupTitle`. Both move together or the unit
// disagrees with itself. Group `id`s are left alone — they key dictionaryLinks
// and saved learner progress.
//
// Edits the raw text rather than reserialising: these files carry \u escapes
// that JSON.stringify would rewrite across thousands of untouched lines.
// Idempotent — a second run reports nothing to do.
//
//   node tools/repair-english-placeholder-group-titles.mjs [--dry]

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENGLISH = join(ROOT, "src/prototypes/ehel-academy/english");
const NEW_TITLE = "Words to Know";
const PLACEHOLDER = /^Vocabulary Group \d+$/;

const TARGETS = [
  [5, 1], [5, 2],
  [6, 1], [6, 2],
  [8, 1], [8, 5], [8, 6], [8, 7], [8, 8],
];

const dry = process.argv.includes("--dry");
let changedFiles = 0;
let changedFields = 0;
let problems = 0;

for (const [grade, unit] of TARGETS) {
  const file = join(ENGLISH, `grade-${grade}/data/units/unit-${unit}.json`);
  const before = readFileSync(file, "utf8");
  const parsed = JSON.parse(before);

  const groups = (parsed.vocabularyGroups || []).filter((g) => PLACEHOLDER.test(g.title || ""));
  if (!groups.length) {
    console.log(`  – G${grade} U${unit}: no placeholder title (already repaired)`);
    continue;
  }
  if (groups.length > 1) {
    // Two generic groups in one unit would collapse into one indistinguishable
    // label. None exist today; refuse rather than create the ambiguity.
    console.error(`  ✗ G${grade} U${unit}: ${groups.length} placeholder groups — a single title would merge them. Skipped.`);
    problems += 1;
    continue;
  }

  const [group] = groups;
  const old = group.title;
  const expectedLinks = (parsed.dictionaryLinks || []).filter((link) => link.groupId === group.id).length;

  // Exact field forms only. A live-session title elsewhere may mention "…,
  // vocabulary group 1" as prose; those are references by position, not labels,
  // and must not be rewritten.
  let after = before
    .split(`"title": ${JSON.stringify(old)}`).join(`"title": ${JSON.stringify(NEW_TITLE)}`)
    .split(`"groupTitle": ${JSON.stringify(old)}`).join(`"groupTitle": ${JSON.stringify(NEW_TITLE)}`);

  const check = JSON.parse(after);
  const renamedGroups = (check.vocabularyGroups || []).filter((g) => g.title === NEW_TITLE).length;
  const renamedLinks = (check.dictionaryLinks || []).filter((l) => l.groupTitle === NEW_TITLE).length;
  const leftovers = (check.vocabularyGroups || []).filter((g) => PLACEHOLDER.test(g.title || "")).length
    + (check.dictionaryLinks || []).filter((l) => PLACEHOLDER.test(l.groupTitle || "")).length;

  if (renamedGroups !== 1 || renamedLinks !== expectedLinks || leftovers) {
    console.error(`  ✗ G${grade} U${unit}: expected 1 group + ${expectedLinks} links, got ${renamedGroups} + ${renamedLinks} (${leftovers} left). Not written.`);
    problems += 1;
    continue;
  }

  const fields = 1 + expectedLinks;
  console.log(`  ${dry ? "would fix" : "✓"} G${grade} U${unit} ${relative(ROOT, file).replace(/\\/g, "/")} — "${old}" → "${NEW_TITLE}" (${fields} fields: 1 group + ${expectedLinks} dictionaryLinks)`);
  if (!dry) writeFileSync(file, after);
  changedFiles += 1;
  changedFields += fields;
}

console.log(`\n${dry ? "Would change" : "Changed"} ${changedFiles} unit${changedFiles === 1 ? "" : "s"}, ${changedFields} fields.`);
if (problems) {
  console.error(`${problems} unit(s) skipped — see above.`);
  process.exit(1);
}
