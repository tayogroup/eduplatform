#!/usr/bin/env node
// Generates cohorts.json — the pilot enrolment roster the Moodle cohort-sync task
// (P1.7) reads to create cohorts, add members, and cohort-enrol them into the
// synced courses. One cohort per grade (ehel-pilot-gNN) mapped to that grade's
// three subject courses (ehel-{eng,math,sci}-gNN). Members are authored by hand;
// this tool only scaffolds the cohort→course structure from catalog.json and
// PRESERVES any members already filled in on rerun.
//
// Usage: node tools/generate-ehel-cohorts.js [--out <path>] [--catalog <path>]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const arg = (flag, def) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; };
const CATALOG = path.resolve(arg("--catalog", path.join(EHEL, "catalog.json")));
const OUT = path.resolve(arg("--out", path.join(EHEL, "cohorts.json")));

if (!fs.existsSync(CATALOG)) { console.error(`catalog not found: ${CATALOG} (run generate-ehel-catalog.js first)`); process.exit(1); }
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

// Preserve rosters already authored into an existing cohorts.json.
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { cohorts: [] };
const priorMembers = new Map((existing.cohorts || []).map((c) => [c.idnumber, c.members || []]));

// Group catalog courses by grade → one cohort per grade.
const byGrade = new Map();
for (const c of catalog.courses) {
  if (!byGrade.has(c.stage)) byGrade.set(c.stage, { stage: c.stage, level: c.level, courses: [] });
  byGrade.get(c.stage).courses.push(c.idnumber);
}

const pad2 = (n) => String(n).padStart(2, "0");
const cohorts = [...byGrade.values()]
  .sort((a, b) => a.stage - b.stage)
  .map((g) => {
    const idnumber = `ehel-pilot-g${pad2(g.stage)}`;
    return {
      idnumber,
      name: `Ehel Pilot — Stage ${g.stage}`,
      grade: g.stage,
      level: g.level,
      courses: g.courses.sort(),
      // Roster: fill with { "username" or "email", "firstname", "lastname" }.
      // The task adds EXISTING users only (no account creation) and reports misses.
      members: priorMembers.get(idnumber) || [],
    };
  });

const out = {
  catalog: "ehel-academy",
  contract: "1.0",
  memberSchema: { required: "username OR email", optional: ["firstname", "lastname"] },
  cohorts,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

const totalMembers = cohorts.reduce((n, c) => n + c.members.length, 0);
console.log(`cohorts: ${cohorts.length} (one per grade) → ${path.relative(ROOT, OUT)}`);
console.log(`courses mapped: ${cohorts.reduce((n, c) => n + c.courses.length, 0)} | members rostered: ${totalMembers}`);
if (totalMembers === 0) console.log("Rosters are empty — add learners to cohorts.json (members[]) before running the Moodle cohort-sync task.");
