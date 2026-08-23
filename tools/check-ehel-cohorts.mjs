#!/usr/bin/env node
// Checks that cohorts.json still agrees with catalog.json.
//
// cohorts.json is GENERATED from catalog.json by generate-ehel-cohorts.js, so
// the two cannot disagree at the moment it runs. What nothing checked is
// whether it was re-run after the catalogue changed — and on 2026-08-09 Global
// Perspectives Stage 5 was withdrawn (withdrawn-courses.json), which removed
// ehel-gp-g05 from the catalogue while cohorts.json kept listing it for two
// weeks. The Moodle cohort-sync task reads that file, so a Stage 5 pilot family
// would have been cohort-enrolled into a course the catalogue does not carry
// and the app refuses to serve.
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
// Intensive English is deliberately exempt from the second direction. Its
// cohorts are cut by intake month, not by academic year, so a level with no
// intake open yet is a normal state the generator itself reports as a hint —
// not a gap. It is NOT exempt from the first: an intake pointing at a level the
// catalogue no longer carries is as broken as any other dangling reference.
//
// Usage: node tools/check-ehel-cohorts.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

const read = (file) => {
  try {
    return JSON.parse(readFileSync(path.join(EHEL, file), "utf8"));
  } catch (err) {
    console.error(`✗ cannot read ${file}: ${err.message}`);
    process.exit(1);
  }
};

const catalog = read("catalog.json");
const cohorts = read("cohorts.json");

// Optional, and read with its OWN loader rather than read() above — read()
// exits the process on failure, which would turn "the explanatory file is
// missing" into a gate that dies before comparing anything and still exits
// non-zero. That looks identical to a real finding from the outside. This file
// only ever explains WHY a course vanished; it never decides anything, so its
// absence must cost nothing but a terser message.
let withdrawn = {};
try {
  withdrawn = JSON.parse(readFileSync(path.join(EHEL, "withdrawn-courses.json"), "utf8")).withdrawn || {};
} catch { /* no explanation available — the dangling reference is still caught */ }

const SCHOOL_TIERS = new Set(["Primary", "Lower Secondary"]); // must match the generator
const courseById = new Map(catalog.courses.map((c) => [c.idnumber, c]));
const cohortList = cohorts.cohorts || [];

const failures = [];

// A parser that matches nothing passes every check while comparing nothing, so
// refuse to run on input that cannot be meaningful.
if (!courseById.size) failures.push("catalog.json lists no courses at all");
if (!cohortList.length) failures.push("cohorts.json lists no cohorts at all");

// ── direction 1 · every course a cohort names must exist in the catalogue ──
for (const cohort of cohortList) {
  for (const id of cohort.courses || []) {
    if (courseById.has(id)) continue;
    const gone = withdrawn[id];
    const why = gone
      ? `it was withdrawn on ${gone.since} (${gone.reason.split(".")[0]})`
      : "it is not in catalog.json";
    failures.push(
      `${cohort.idnumber} enrols into ${id}, but ${why}.\n`
      + `    cohorts.json is generated — re-run: node tools/generate-ehel-cohorts.js`,
    );
  }
}

// ── direction 2 · every school course must be carried by some cohort ────────
const claimed = new Set(cohortList.flatMap((c) => c.courses || []));
for (const course of catalog.courses) {
  if (!SCHOOL_TIERS.has(course.level)) continue; // intake-cut, see header
  if (claimed.has(course.idnumber)) continue;
  failures.push(
    `${course.idnumber} (${course.fullname}) is in the catalogue but in no cohort,\n`
    + `    so the pilot would never be enrolled into it.\n`
    + `    cohorts.json is generated — re-run: node tools/generate-ehel-cohorts.js`,
  );
}

// ── report ─────────────────────────────────────────────────────────────────
const schoolCourses = catalog.courses.filter((c) => SCHOOL_TIERS.has(c.level)).length;
if (failures.length) {
  console.error(`✗ cohorts.json disagrees with catalog.json — ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error("");
  process.exit(1);
}

console.log(
  `✓ cohorts.json agrees with catalog.json — ${cohortList.length} cohorts, `
  + `${claimed.size} course references, all ${schoolCourses} school courses carried.`,
);
