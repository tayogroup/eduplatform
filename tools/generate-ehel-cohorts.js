#!/usr/bin/env node
// Generates cohorts.json — the pilot enrolment roster the Moodle cohort-sync task
// (P1.7) reads to create cohorts, add members, and cohort-enrol them into the
// synced courses. One cohort per grade (ehel-pilot-gNN) mapped to that grade's
// three subject courses (ehel-{eng,math,sci}-gNN). Members are authored by hand;
// this tool only scaffolds the cohort→course structure from catalog.json and
// PRESERVES any members already filled in on rerun.
//
// Usage: node tools/generate-ehel-cohorts.js [--out <path>] [--catalog <path>]
//                                            [--year <YYYY>] [--intake <YYYY-MM>]
//
// --year stamps the academic year into each cohort idnumber
// (ehel-pilot-gNN-<year>) and name — the Canvas-terms pattern: next year's
// Stage 3 intake is a NEW cohort, so a returning student's history stays on
// last year's cohort instead of being overwritten. Omit --year to keep any
// year already stamped in the existing cohorts.json (or none for legacy ids).
// Rosters are preserved across a year change (matched by grade).
//
// --intake opens a NEW adult intake (ehel-intensive-lNN-<YYYY-MM>), one cohort
// per authored CEFR level. Intensive English is not taught on an academic
// calendar — a learner starts Level 1 when they enrol — so for the adult
// courses the thing that makes a new cohort is the intake month, not September.
// Existing intakes and their rosters are always carried through, so omitting
// --intake is safe: a rerun to pick up a new course never drops an intake.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const arg = (flag, def) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : def; };
const CATALOG = path.resolve(arg("--catalog", path.join(EHEL, "catalog.json")));
const OUT = path.resolve(arg("--out", path.join(EHEL, "cohorts.json")));

if (!fs.existsSync(CATALOG)) { console.error(`catalog not found: ${CATALOG} (run generate-ehel-catalog.js first)`); process.exit(1); }
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

// Preserve rosters already authored into an existing cohorts.json. Keyed by
// GRADE (not idnumber) so members survive an academic-year re-stamp.
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { cohorts: [] };
const priorMembers = new Map();
for (const c of existing.cohorts || []) {
  const m = /^ehel-pilot-g(\d{2})/.exec(c.idnumber || "");
  if (m) priorMembers.set(Number(m[1]), c.members || []);
}

// Academic year: --year wins, else whatever the existing file was stamped with.
const yearArg = arg("--year", "");
const YEAR = /^\d{4}$/.test(yearArg) ? Number(yearArg)
  : (Number.isInteger(existing.academicYear) ? existing.academicYear : null);

// The pilot cohorts are a school construct: one cohort per Cambridge stage,
// named "Ehel Pilot — Stage N". Only school-tier courses belong in them.
//
// Tested positively, because a non-school family numbers its stages on its own
// axis and those numbers collide: Intensive English Levels 1-2 are CEFR levels
// for adults, but carry stage 1 and 2, so grouping on stage alone drops an
// adult course into the Stage 1 and Stage 2 cohorts of primary schoolchildren.
// A positive test fails safe — a future family with a new tier is excluded
// until someone decides where it belongs, rather than silently included.
const SCHOOL_TIERS = new Set(["Primary", "Lower Secondary"]);

// Group catalog courses by grade → one cohort per grade.
const byGrade = new Map();
const nonSchool = [];
for (const c of catalog.courses) {
  if (!SCHOOL_TIERS.has(c.level)) { nonSchool.push(c.idnumber); continue; }
  if (!byGrade.has(c.stage)) byGrade.set(c.stage, { stage: c.stage, level: c.level, courses: [] });
  byGrade.get(c.stage).courses.push(c.idnumber);
}
if (nonSchool.length) {
  console.log(`skipped ${nonSchool.length} non-school course(s), no pilot cohort: ${nonSchool.join(", ")}`);
}

const pad2 = (n) => String(n).padStart(2, "0");
const cohorts = [...byGrade.values()]
  .sort((a, b) => a.stage - b.stage)
  .map((g) => {
    const idnumber = YEAR ? `ehel-pilot-g${pad2(g.stage)}-${YEAR}` : `ehel-pilot-g${pad2(g.stage)}`;
    const yearLabel = YEAR ? ` (${YEAR}–${String(YEAR + 1).slice(-2)})` : "";
    return {
      idnumber,
      name: `Ehel Pilot — Stage ${g.stage}${yearLabel}`,
      grade: g.stage,
      level: g.level,
      courses: g.courses.sort(),
      // Roster: fill with { "username" or "email", "firstname", "lastname" }.
      // The task adds EXISTING users only (no account creation) and reports misses.
      members: priorMembers.get(g.stage) || [],
    };
  });

// ---- Adult intakes --------------------------------------------------------
// Intensive English is not taught on an academic calendar, so its cohorts are
// cut by intake month rather than by year: someone who starts Level 1 in March
// is a different cohort from someone who starts in September, and each intake
// keeps its own history. Same reason --year exists for the school cohorts,
// applied to the axis this course actually runs on.
const INTAKE_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ADULT_ID_RE = /^ehel-intensive-l(\d{2})-(\d{4}-\d{2})$/;
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const intakeLabel = (intake) => {
  const [y, m] = intake.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

const intakeArg = arg("--intake", "");
if (intakeArg && !INTAKE_RE.test(intakeArg)) {
  console.error(`--intake must be YYYY-MM (got "${intakeArg}")`);
  process.exit(1);
}

// The intensive levels the catalog actually carries, keyed by level number.
const intensiveCourses = new Map();
for (const c of catalog.courses) {
  if (c.subjectKey === "intensive-eng") intensiveCourses.set(c.stage, c);
}

// Every intake already in the file is carried through untouched. This is what
// makes a bare rerun safe: regenerating to pick up a new course must never drop
// a live intake or the roster somebody typed into it.
const adultKeys = new Map(); // "level|intake" → members
for (const c of existing.cohorts || []) {
  const m = ADULT_ID_RE.exec(c.idnumber || "");
  if (m) adultKeys.set(`${Number(m[1])}|${m[2]}`, c.members || []);
}
// --intake opens that intake across every authored level, leaving any intake
// already present alone.
if (intakeArg) {
  for (const level of intensiveCourses.keys()) {
    const key = `${level}|${intakeArg}`;
    if (!adultKeys.has(key)) adultKeys.set(key, []);
  }
}

const orphaned = [];
const adultCohorts = [...adultKeys.entries()]
  .map(([key, members]) => {
    const [level, intake] = key.split("|");
    return { level: Number(level), intake, members };
  })
  // A cohort pointing at a level the catalog no longer carries would enrol into
  // a course that does not exist, so it is dropped — loudly, never silently.
  .filter((a) => { if (intensiveCourses.has(a.level)) return true; orphaned.push(a); return false; })
  .sort((a, b) => a.intake.localeCompare(b.intake) || a.level - b.level)
  .map((a) => ({
    idnumber: `ehel-intensive-l${pad2(a.level)}-${a.intake}`,
    name: `Ehel Intensive English — Level ${a.level} (${intakeLabel(a.intake)})`,
    cefrLevel: a.level,
    intake: a.intake,
    level: "Intensive English",
    courses: [intensiveCourses.get(a.level).idnumber],
    // Roster: fill with { "username" or "email", "firstname", "lastname" }.
    members: a.members,
  }));

for (const o of orphaned) {
  console.warn(`WARNING: dropped ehel-intensive-l${pad2(o.level)}-${o.intake} — level ${o.level} is not in the`
    + ` catalog; ${o.members.length} member(s) not carried over (recover from git if unintended)`);
}

const allCohorts = [...cohorts, ...adultCohorts];

const out = {
  catalog: "ehel-academy",
  contract: "1.0",
  ...(YEAR ? { academicYear: YEAR } : {}),
  memberSchema: { required: "username OR email", optional: ["firstname", "lastname"] },
  cohorts: allCohorts,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

const totalMembers = allCohorts.reduce((n, c) => n + c.members.length, 0);
console.log(`cohorts: ${cohorts.length} school (one per grade)`
  + ` + ${adultCohorts.length} adult intake${adultCohorts.length === 1 ? "" : "s"} → ${path.relative(ROOT, OUT)}`);
if (adultCohorts.length) {
  const intakes = [...new Set(adultCohorts.map((c) => c.intake))].sort();
  console.log(`adult intakes: ${intakes.join(", ")}`);
} else if (intensiveCourses.size) {
  console.log(`${intensiveCourses.size} intensive course(s) have no cohort yet — open one with --intake YYYY-MM.`);
}
console.log(`courses mapped: ${allCohorts.reduce((n, c) => n + c.courses.length, 0)} | members rostered: ${totalMembers}`);
if (totalMembers === 0) console.log("Rosters are empty — add learners to cohorts.json (members[]) before running the Moodle cohort-sync task.");
