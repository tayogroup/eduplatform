#!/usr/bin/env node
// Checks that every cohort file still agrees with the catalogue it enrols from.
//
// Cohort files are GENERATED, so they cannot disagree at the moment the
// generator runs. What nothing checked is whether it was re-run after the
// catalogue changed — and on 2026-08-09 Global Perspectives Stage 5 was
// withdrawn (withdrawn-courses.json), which removed ehel-gp-g05 from the
// catalogue while cohorts.json kept listing it for two weeks. The Moodle
// cohort-sync task reads that file, so a Stage 5 pilot family would have been
// cohort-enrolled into a course the catalogue does not carry. It fails quietly:
// cohort_sync.php skips an unresolvable course with "course not found" and
// carries on, so the only symptom is a log line nobody reads.
//
// The failure is staleness, and it runs in both directions:
//
//   - a cohort naming a course the catalogue dropped     → enrol into nothing
//   - a school course the catalogue gained, in no cohort → pilot never gets it
//
// The second is the one that bites when Stage 5 is RESTORED: deleting the
// withdrawn-courses entry puts ehel-gp-g05 back in the catalogue, and until
// cohorts.json is regenerated the Stage 5 pilot silently teaches four subjects.
//
// Two pairs are checked, and the second is derived from the first:
//
//   catalog.json        + cohorts.json         — the full pilot, all subjects
//   catalog-eng-v1.json + cohorts-eng-v1.json  — the English-only pilot
//
// The -v1 suffix is a CDN cache-buster, not a frozen snapshot: those files are
// filtered out of the main catalogue by generate-ehel-english-pilot.js, so they
// go stale the same way. Hence the third check, which only the derived pair
// runs — that its course set still matches the English courses in the main
// catalogue. That compares the SET OF COURSES, which is what decides who is
// enrolled into what; it does not compare titles or summaries, so cosmetic
// drift in text the CDN serves is out of scope here.
//
// Intensive English is deliberately exempt from the second direction. Its
// cohorts are cut by intake month, not by academic year, so a level with no
// intake open yet is a normal state the generator itself reports as a hint —
// not a gap. It is NOT exempt from the first: an intake pointing at a level the
// catalogue no longer carries is as broken as any other dangling reference.
//
// Usage: node tools/check-ehel-cohorts.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const at = (file) => path.join(EHEL, file);

const failures = [];
const fail = (msg) => failures.push(msg);

// Required reads exit on failure; that is right for a file the gate cannot work
// without. Anything OPTIONAL must use readMaybe instead — an exiting read turns
// "this file is absent" into a gate that dies before comparing anything and
// still exits non-zero, which looks identical to a real finding.
function readJson(file) {
  try {
    return JSON.parse(readFileSync(at(file), "utf8"));
  } catch (err) {
    console.error(`✗ cannot read ${file}: ${err.message}`);
    process.exit(1);
  }
}
function readMaybe(file) {
  try {
    return JSON.parse(readFileSync(at(file), "utf8"));
  } catch {
    return null;
  }
}

// Only used to explain WHY a course vanished, never to decide anything.
const withdrawn = readMaybe("withdrawn-courses.json")?.withdrawn || {};

const SCHOOL_TIERS = new Set(["Primary", "Lower Secondary"]); // must match generate-ehel-cohorts.js

const PAIRS = [
  {
    label: "pilot cohorts",
    catalog: "catalog.json",
    cohorts: "cohorts.json",
    regen: "node tools/generate-ehel-cohorts.js",
  },
  {
    label: "English-only pilot (v1)",
    catalog: "catalog-eng-v1.json",
    cohorts: "cohorts-eng-v1.json",
    regen: "node tools/generate-ehel-english-pilot.js",
    optional: true,
    // This catalogue is a filtered copy of the main one; keep them in step.
    derivedFrom: { file: "catalog.json", subjectKey: "eng", what: "English" },
  },
];

const summaries = [];

for (const pair of PAIRS) {
  const hasCatalog = existsSync(at(pair.catalog));
  const hasCohorts = existsSync(at(pair.cohorts));

  if (pair.optional && !hasCatalog && !hasCohorts) {
    summaries.push(`- ${pair.label}: not present, skipped`);
    continue;
  }
  // Half a pair is never intentional: one file names courses the other defines.
  if (!hasCatalog || !hasCohorts) {
    fail(`${pair.label}: ${hasCatalog ? pair.cohorts : pair.catalog} is missing while `
      + `${hasCatalog ? pair.catalog : pair.cohorts} is present.\n`
      + `    A cohort file and its catalogue are written together — re-run: ${pair.regen}`);
    continue;
  }

  const catalog = readJson(pair.catalog);
  const cohortsFile = readJson(pair.cohorts);
  const courses = catalog.courses || [];
  const cohorts = cohortsFile.cohorts || [];

  // A parser that matches nothing passes every check while comparing nothing,
  // so refuse to run on input that cannot be meaningful.
  if (!courses.length) { fail(`${pair.label}: ${pair.catalog} lists no courses at all`); continue; }
  if (!cohorts.length) { fail(`${pair.label}: ${pair.cohorts} lists no cohorts at all`); continue; }

  const byId = new Map(courses.map((c) => [c.idnumber, c]));

  // ── direction 1 · every course a cohort names must exist ────────────────
  for (const cohort of cohorts) {
    for (const id of cohort.courses || []) {
      if (byId.has(id)) continue;
      const gone = withdrawn[id];
      const why = gone
        ? `it was withdrawn on ${gone.since} (${String(gone.reason).split(".")[0]})`
        : `it is not in ${pair.catalog}`;
      fail(`${pair.label}: ${cohort.idnumber} enrols into ${id}, but ${why}.\n`
        + `    That file is generated — re-run: ${pair.regen}`);
    }
  }

  // ── direction 2 · every school course must be carried by some cohort ────
  const claimed = new Set(cohorts.flatMap((c) => c.courses || []));
  for (const course of courses) {
    if (!SCHOOL_TIERS.has(course.level)) continue; // intake-cut, see header
    if (claimed.has(course.idnumber)) continue;
    fail(`${pair.label}: ${course.idnumber} (${course.fullname}) is in the catalogue but in no\n`
      + `    cohort, so the pilot would never be enrolled into it.\n`
      + `    That file is generated — re-run: ${pair.regen}`);
  }

  // ── direction 3 · a derived catalogue must still match its source ───────
  if (pair.derivedFrom) {
    const source = readJson(pair.derivedFrom.file);
    const want = (source.courses || [])
      .filter((c) => c.subjectKey === pair.derivedFrom.subjectKey)
      .map((c) => c.idnumber).sort();
    const have = courses.map((c) => c.idnumber).sort();
    const missing = want.filter((id) => !have.includes(id));
    const extra = have.filter((id) => !want.includes(id));
    if (missing.length || extra.length) {
      fail(`${pair.label}: ${pair.catalog} has drifted from ${pair.derivedFrom.file}.\n`
        + (missing.length ? `    ${pair.derivedFrom.what} courses in the main catalogue but not here: ${missing.join(", ")}\n` : "")
        + (extra.length ? `    here but no longer in the main catalogue: ${extra.join(", ")}\n` : "")
        + `    It is a filtered copy — re-run: ${pair.regen}`);
    }
  }

  const schoolCourses = courses.filter((c) => SCHOOL_TIERS.has(c.level)).length;
  const members = cohorts.reduce((n, c) => n + (c.members || []).length, 0);
  summaries.push(`- ${pair.label}: ${cohorts.length} cohorts, ${claimed.size} course references, `
    + `all ${schoolCourses} school courses carried, ${members} rostered`);
}

if (failures.length) {
  console.error(`✗ cohort files disagree with their catalogues — ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error("");
  process.exit(1);
}

console.log("✓ every cohort file agrees with its catalogue");
for (const line of summaries) console.log(`  ${line}`);
