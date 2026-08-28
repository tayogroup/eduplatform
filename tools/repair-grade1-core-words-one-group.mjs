#!/usr/bin/env node
// Grade 1 English: the Core words are ONE category called "Core words".
//
// The restructure split them into three strands -- "Phonics: short a",
// "Words: home and classroom", "Words we see everywhere" -- which is not what
// was asked for. The owner asked for "a new category called Core words", one
// category with that name, and reported twice that it was not there. It was a
// naming decision made in the build and never checked back against the request:
// the words were all present and correct, and the category the owner named did
// not exist anywhere in the data.
//
// So the three merge into one group titled "Core words", in the order they were
// taught (phonics, then topic, then sight). The glossary group is untouched and
// renumbered to follow it.
//
// NOTHING AUDIO OR PROGRESS RELATED MOVES, and that is what makes this cheap.
// Clip filenames derive from `vocabularyId`, and a learner's Learned list is
// keyed on the same field -- neither changes here. Only `groupId`, `groupTitle`
// and the `vocabularyGroups` array move, so no clip is orphaned, nothing is
// re-recorded, and no learner loses a word they had marked known.
//
// The strand is not thrown away: it stays on each link as `strand`, so a future
// design can group or label by it without re-deriving the split from scratch.
//
//   node tools/repair-grade1-core-words-one-group.mjs           # report
//   node tools/repair-grade1-core-words-one-group.mjs --write    # apply
import fs from "node:fs";
import path from "node:path";

const UNITS = path.join("src", "prototypes", "ehel-academy", "english", "grade-1", "data", "units");
const TITLE = "Core words";
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") { console.error(`Unrecognised argument: ${a}`); process.exit(2); }
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
let unitsChanged = 0, linksMoved = 0, groupsBefore = 0, groupsAfter = 0;
const report = [];

for (let n = 0; n <= 10; n++) {
  const file = path.join(UNITS, `unit-${n}.json`);
  if (!fs.existsSync(file)) continue;
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  const groups = doc.vocabularyGroups || [];
  const core = groups.filter((g) => /-core-/.test(g.id));
  if (core.length < 2) continue;                       // already one group, or none
  const rest = groups.filter((g) => !/-core-/.test(g.id));
  groupsBefore += groups.length;

  const id = `g1-u${n}-core`;
  // Order is the strand order the unit taught, which is the order the groups
  // are already in -- so concatenating their id lists preserves it exactly.
  const merged = {
    id, number: 1, title: TITLE,
    vocabularyIds: core.flatMap((g) => g.vocabularyIds || []),
    strand: "core",
  };
  doc.vocabularyGroups = [merged, ...rest.map((g, i) => ({ ...g, number: i + 2 }))];
  groupsAfter += doc.vocabularyGroups.length;

  let moved = 0;
  for (const link of doc.dictionaryLinks || []) {
    const from = core.find((g) => g.id === link.groupId);
    if (!from) continue;
    // Keep which strand this word came from. The group no longer says it, and
    // re-deriving it later would mean redoing the allocation.
    if (from.strand && !link.strand) link.strand = from.strand;
    link.groupId = id;
    link.groupTitle = TITLE;
    moved += 1;
  }
  linksMoved += moved;
  unitsChanged += 1;
  report.push([n, core.map((g) => `${g.title} (${(g.vocabularyIds || []).length})`).join(" + "), moved]);

  if (!WRITE) continue;
  for (let a = 1; a <= 6; a++) {
    // The preview servers hold these open intermittently on Windows.
    try { fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n"); break; }
    catch (e) { if (a === 6) throw e; sleep(800 * a); }
  }
}

console.log(`units changed: ${unitsChanged} | groups ${groupsBefore} -> ${groupsAfter} | links re-pointed: ${linksMoved}\n`);
for (const [n, was, moved] of report) console.log(`  unit-${String(n).padEnd(3)} ${moved} words   was: ${was}`);
if (!WRITE) console.log("\nReport only — nothing written. Re-run with --write to apply.");
else console.log(`\nWrote ${unitsChanged} unit file(s). Next: npm run build:topic-index (group titles are indexed), then check:english.`);
