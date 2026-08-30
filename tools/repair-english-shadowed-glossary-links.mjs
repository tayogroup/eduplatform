// A word taught as a Core word could ALSO survive as a glossary link in the
// same unit, with different wording, because the Core-words content builder
// only learned to drop the displaced copy partway through that work. Grades
// 5-8 were built after it and carry none; grades 1-4 were built before and
// carry 89 between them.
//
// What a learner meets is the same word twice in one unit explained two ways,
// and the machine-visible symptoms are a duplicate game round ("What does
// 'recycle' mean in this unit?" twice) and the childMeaning / aiTutorPrompt
// distinctness failures in grades 1-2 — every duplicated value in those units
// involves a shadowed word.
//
// This removes the glossary copy and keeps the Core one, which is the same
// rule the content builder now applies and the same direction the game builder
// resolves. Three things have to move together or check-english-content.mjs
// fails: the link, its id inside the owning group's vocabularyIds, and the
// manifest's vocabularyCount, which the picker prints before a learner opens
// the unit.
//
//   node tools/repair-english-shadowed-glossary-links.mjs            # report
//   node tools/repair-english-shadowed-glossary-links.mjs --write    # apply
//
// Idempotent: a second run finds nothing. It removes only a glossary link
// whose word is taught as a Core word IN THE SAME UNIT, so it can never take
// the only copy of a word.
import fs from "node:fs";
import path from "node:path";

const ROOT = "src/prototypes/ehel-academy/english";
const WRITE = process.argv.includes("--write");
for (const a of process.argv.slice(2)) {
  if (a !== "--write") { console.error(`Unrecognised argument: ${a}`); process.exit(2); }
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");

let totalRemoved = 0, unitsTouched = 0, problems = 0;

for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const manifestPath = path.join(ROOT, `grade-${grade}/data/course-manifest.json`);
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = readJson(manifestPath);
  let manifestDirty = false;

  for (const entry of manifest.units || []) {
    const unitPath = path.join(ROOT, `grade-${grade}/data/units/unit-${entry.number}.json`);
    if (!fs.existsSync(unitPath)) continue;
    const unit = readJson(unitPath);

    const coreGroupIds = new Set((unit.vocabularyGroups || [])
      .filter((g) => g.strand && g.strand !== "glossary").map((g) => g.id));
    const coreWords = new Set((unit.dictionaryLinks || [])
      .filter((l) => coreGroupIds.has(l.groupId))
      .map((l) => String(l.masterWord).toLowerCase()));

    const doomed = (unit.dictionaryLinks || []).filter((l) =>
      !coreGroupIds.has(l.groupId) && coreWords.has(String(l.masterWord).toLowerCase()));
    if (!doomed.length) continue;

    const doomedIds = new Set(doomed.map((l) => l.vocabularyId));
    const before = unit.dictionaryLinks.length;
    const keptLinks = unit.dictionaryLinks.filter((l) => !doomedIds.has(l.vocabularyId));
    const groups = unit.vocabularyGroups.map((g) => ({
      ...g,
      ...(g.vocabularyIds ? { vocabularyIds: g.vocabularyIds.filter((i) => !doomedIds.has(i)) } : {}),
    }));

    // Every core word must survive, and the three counts must still agree.
    const survivingWords = new Set(keptLinks.map((l) => String(l.masterWord).toLowerCase()));
    const lost = [...coreWords].filter((w) => !survivingWords.has(w));
    const idCount = groups.reduce((n, g) => n + (g.vocabularyIds?.length || 0), 0);
    if (lost.length || keptLinks.length !== before - doomed.length || idCount !== keptLinks.length) {
      console.error(`  !! grade ${grade} unit ${entry.number}: refusing — lost=${lost.length} ` +
        `links=${keptLinks.length} ids=${idCount}`);
      problems++;
      continue;
    }

    console.log(`  grade ${grade} unit ${entry.number}: -${doomed.length} ` +
      `(${doomed.map((l) => l.masterWord).join(", ")})  ${before} -> ${keptLinks.length} links`);
    totalRemoved += doomed.length;
    unitsTouched++;

    if (WRITE) {
      unit.vocabularyGroups = groups;
      unit.dictionaryLinks = keptLinks;
      writeJson(unitPath, unit);
      if (entry.vocabularyCount !== undefined) { entry.vocabularyCount = keptLinks.length; manifestDirty = true; }
    }
  }
  if (WRITE && manifestDirty) writeJson(manifestPath, manifest);
}

console.log(`\n  ${totalRemoved} shadowed glossary link(s) across ${unitsTouched} unit(s)` +
  `${WRITE ? " removed" : " — report only, pass --write to apply"}`);
if (problems) { console.error(`  ${problems} unit(s) refused`); process.exitCode = 1; }
