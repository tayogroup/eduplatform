#!/usr/bin/env node
// Generates catalog.json — the static source of truth the Moodle catalog-sync
// task (P1.7) reads to create categories, courses (keyed by idnumber) and grade
// items. The course idnumber is the same key the progress web service resolves
// against (ehel-{subj}-gNN, or ehel-intensive-eng-lNN for the CEFR levels), so
// once this catalog is synced, push_gradebook() finds a real course and the
// gradebook goes live. Nothing parses these keys — they are opaque to Moodle.
//
// Source of truth is each prototype's course-manifest.json (unit list + titles):
// grade-N/data/ for the school subjects, level-N/data/ for Intensive English.
// Adding/renaming a unit, grade or level = rerun this, redeploy catalog.json,
// rerun the Moodle sync task.
//
// Usage: node tools/generate-ehel-catalog.js [--out <path>]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const outArg = process.argv.indexOf("--out");
const OUT = outArg >= 0 ? path.resolve(process.argv[outArg + 1]) : path.join(EHEL, "catalog.json");

// subjectKey → display + Cambridge codes by level (see cambridge-curriculum memory).
const SUBJECTS = {
  english: { key: "eng", name: "English", code: { primary: "0058", lowersec: "0861" } },
  mathematics: { key: "math", name: "Mathematics", code: { primary: "0096", lowersec: "0862" } },
  science: { key: "sci", name: "Science", code: { primary: "0846", lowersec: "0893" } },
  computing: { key: "comp", name: "Computing", code: { primary: "0672", lowersec: "0868" } },
  // Global Perspectives is the one subject whose Lower Secondary code is not in
  // the 08xx family: Cambridge publishes Primary as 0838 and Lower Secondary as
  // 1129.
  "global-perspectives": { key: "gp", name: "Global Perspectives", code: { primary: "0838", lowersec: "1129" } },
};
// Courses that exist on disk but are not offered. The catalogue is what the
// Moodle catalog_sync, the course browser and anything a family reads are built
// from, so a withdrawn course has to be absent from here — withdrawing it in
// the app alone leaves it advertised, which is where Global Perspectives Stage 5
// sat: the app refused to serve it while the catalogue still listed it as
// "Ehel Global Perspectives — Stage 5. 2 units."
const WITHDRAWN_FILE = path.join(EHEL, "withdrawn-courses.json");
const withdrawn = fs.existsSync(WITHDRAWN_FILE)
  ? (JSON.parse(fs.readFileSync(WITHDRAWN_FILE, "utf8")).withdrawn || {})
  : {};
const withdrawnNotes = [];

// Cambridge level by stage: Primary = Stages 1–6, Lower Secondary = Stages 7–9.
const levelForStage = (n) => (n <= 6 ? "primary" : "lowersec");
const levelName = (lvl) => (lvl === "primary" ? "Primary" : "Lower Secondary");
const pad2 = (n) => String(n).padStart(2, "0");

// Intensive English is not a school course, and it breaks every assumption the
// SUBJECTS loop makes: its stages are CEFR levels rather than Cambridge grades,
// they live in level-N/ rather than grade-N/, and adults belong to neither the
// Primary nor the Lower Secondary tier. So it is built as its own family.
//
// It reports against CEFR. Cambridge 0058/0861 only supplies the language
// inventory the source material was written to, so cambridgeCode is left empty
// rather than claiming a syllabus this course does not award; the real
// alignment travels in `cefr`. catalog_sync reads named keys with `?? ''`
// defaults, so both the blank code and the extra field are safe for it.
// Intensive English names its level folders itself — level -1 is Phonics, in
// `level-phonics` — so both the bounds above and the path below ask the
// shared module instead of formatting the number.
const INTENSIVE_LEVEL_DIRS = new Map(
  require("./lib/ehel-intensive-levels").levels().map((l) => [l.number, l.dir]));
const INTENSIVE_LEVEL_NUMBERS = [...INTENSIVE_LEVEL_DIRS.keys()];
// The level suffix in a course idnumber. `l${pad2(n)}` for every level
// down to 0, but `pad2(-1)` is the string "-1", which puts
// `ehel-intensive-eng-l-1` in an operator's list one row above
// `ehel-intensive-eng-l01` — two different courses that read as the same
// one. This identifier is what repoint-grade.php and the Moodle sync key
// on, so it is the last place to be ambiguous. Phonics takes the key its
// plan already gives it: lph.
const levelSuffix = (n) => (Number(n) < 0 ? "ph" : String(n).padStart(2, "0"));

const INTENSIVE = {
  dir: "intensive-english",
  key: "intensive-eng",
  name: "Intensive English",
  subject: "English",
  // The course ENDS at Level 3. Levels 4 (C1) and 5 (C2) were dropped by the
  // owner on 2026-09-16 (`6c13be00a`; the reasoning is in the plan's
  // `whyTheCourseStopsAtB1`), and Level 3 was authored the same day — so the
  // note this replaced, "Levels 3–5 are planned but unauthored", was wrong in
  // both directions by the time anyone read it again.
  //
  // The loop is still driven by `if (!manifest) continue`, which is what made
  // that staleness harmless: Level 3 joined the catalogue the moment its
  // manifest existed, without this number being touched. Kept at 3 so the
  // ceiling states the decision rather than leaving room for levels that are
  // not coming.
  maxLevel: 3,
  // And a FLOOR, because the note above reasons only about the ceiling and the
  // course grew the other way. The Intro level (2026-09-17) is level 0: Pre-A1,
  // below Cambridge 0057 Stage 1, claiming no 0057 objective because 0057 has
  // no stage under 1 and all of Stage 1 is already placed in Level 1. The loop
  // started at a literal 1, so Intro could never reach the catalogue however
  // complete it was — and `if (!manifest) continue` cannot save a level the
  // loop never visits.
  //
  // And the floor moved AGAIN, one day later, for the Phonics level, which
  // is numbered -1. That is twice in two days that a literal bound written
  // when the levels were 1 to 3 has silently hidden a finished level from
  // the catalogue. So the floor is now DISCOVERED rather than written: it is
  // the lowest level that exists on disk. A level that is authored is in the
  // catalogue, and nobody has to remember this constant again.
  minLevel: Math.min(...INTENSIVE_LEVEL_NUMBERS, 0),
  categoryPath: ["Ehel Academy", "Languages", "Intensive English"],
};

function readManifest(subjectDir, grade) {
  const file = path.join(EHEL, subjectDir, `grade-${grade}`, "data", "course-manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readIntensiveManifest(level) {
  // Through the shared module: level -1 is Phonics, in `level-phonics`, and
  // `level-${level}` would build `level--1` and return null — which the
  // caller treats as "not authored yet" and skips in silence.
  const dir = INTENSIVE_LEVEL_DIRS.get(level) || `level-${level}`;
  const file = path.join(EHEL, INTENSIVE.dir, dir, "data", "course-manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Pushes one course per authored level into the shared courses/category set.
function addIntensiveCourses(courses, categorySet) {
  for (let level = INTENSIVE.minLevel; level <= INTENSIVE.maxLevel; level += 1) {
    const manifest = readIntensiveManifest(level);
    if (!manifest) continue;

    const meta = manifest.level || {};
    const label = meta.label || `Level ${level}`;
    const cefr = meta.cefr || [];
    const idnumber = `ehel-${INTENSIVE.key}-l${levelSuffix(level)}`;
    const categoryPath = INTENSIVE.categoryPath;
    categorySet.set(categoryPath.join(" / "), {
      name: categoryPath[categoryPath.length - 1],
      path: categoryPath,
    });

    // Level 1 opens at unit 0 (a pronunciation primer), so unit numbers are
    // taken from the manifest rather than assumed to start at 1.
    const units = (manifest.units || []).map((u) => ({
      number: u.number,
      idnumber: `${idnumber}-u${pad2(u.number)}`,
      title: u.title,
      termId: u.termId || null,
    }));

    const band = cefr.length ? ` (CEFR ${cefr.join("+")})` : "";
    // The manifest label is "Level 1 — Foundation"; prefixing the course name
    // with another em-dash reads as two separate dashes, so the label's own
    // becomes a colon: "Ehel Intensive English — Level 1: Foundation".
    const fullLabel = label.replace(/\s+—\s+/, ": ");
    courses.push({
      idnumber,
      subject: INTENSIVE.subject,
      subjectKey: INTENSIVE.key,
      stage: level,
      level: "Intensive English",
      cambridgeCode: "",
      cefr,
      fullname: `Ehel Intensive English — ${fullLabel}`,
      shortname: idnumber.toUpperCase(),
      categoryPath,
      summary: `CEFR-aligned intensive English for adults${band}. ${fullLabel}. ${units.length} units.`,
      unitCount: units.length,
      units,
    });
  }
}

// Art & Design (Cambridge Primary 0067) is the first subject with NO shell
// course behind it: it exists only as standalone lesson builds
// (art-and-design/grade-N-app, one page per lesson), so its source of truth is
// each build's app.config.json rather than a grade-N/data/course-manifest.json.
// The lessons ARE the units - there is no other course for them to be confused
// with, so THE UNIT PROBLEM (wire-progress.py) does not arise and the build
// writes progress under u01..uNN, which is exactly what these grade items carry.
const ART = {
  dir: "art-and-design",
  key: "art",
  name: "Art & Design",
  code: "0067",
  maxStage: 6,
};

function readArtConfig(stage) {
  const file = path.join(EHEL, ART.dir, `grade-${stage}-app`, "app.config.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function addArtCourses(courses, categorySet) {
  for (let stage = 1; stage <= ART.maxStage; stage += 1) {
    const cfg = readArtConfig(stage);
    if (!cfg) continue;
    const idnumber = `ehel-${ART.key}-g${pad2(stage)}`;
    if (withdrawn[idnumber]) {
      withdrawnNotes.push(`${idnumber} (${withdrawn[idnumber].reason || "withdrawn"})`);
      continue;
    }
    const categoryPath = ["Ehel Academy", "Primary", ART.name];
    categorySet.set(categoryPath.join(" / "), { name: ART.name, path: categoryPath });
    const units = (cfg.lessons || []).map((l, i) => ({
      number: i + 1,
      idnumber: `${idnumber}-u${pad2(i + 1)}`,
      title: l.title,
      termId: null,
    }));
    courses.push({
      idnumber,
      subject: ART.name,
      subjectKey: ART.key,
      stage,
      level: "Primary",
      cambridgeCode: ART.code,
      fullname: `Ehel ${ART.name} — Stage ${stage}`,
      shortname: idnumber.toUpperCase(),
      categoryPath,
      summary: `Cambridge-aligned ${ART.name} (${ART.code}), Stage ${stage}. ${units.length} lessons.`,
      unitCount: units.length,
      units,
    });
  }
}

// The restructured Intensive English programme (owner, 2026-09-18), built as
// standalone pages only, like Art & Design: its source of truth is each level
// build's app.config.json (written by intensive-english/program/kit/
// build_program.py), whose units ARE the lessons. Each level is its own course,
// keyed ehel-intensive-eng-l10..l15: Moodle launches only keys shaped
// ehel-<slug>-lNN, and the live course keeps l00-l03 for its learners. `stage`
// is the key's number, not the CEFR ladder, because the cohort generator keys
// intensive courses by stage and must not merge these with the live levels.
// Their own category, so an operator never sees two different courses that
// are both "Level 1" side by side.
const PROGRAMME = {
  dir: path.join("intensive-english", "program"),
  levels: ["letters", "starter", "level-1", "level-2", "level-3", "level-4"],
  categoryPath: ["Ehel Academy", "Languages", "Intensive English Programme"],
};

function addIntensiveProgrammeCourses(courses, categorySet) {
  const planFile = path.join(ROOT, "inputs", "ehel-english-intensive-source", "program", "program-plan.json");
  if (!fs.existsSync(planFile)) return;
  const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
  for (const id of PROGRAMME.levels) {
    const file = path.join(EHEL, PROGRAMME.dir, "app", id, "app.config.json");
    if (!fs.existsSync(file)) continue;
    const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    const level = plan.levels.find((l) => l.id === id);
    const idnumber = cfg.courseKey;
    const m = /^ehel-intensive-eng-l(\d{2})$/.exec(idnumber || "");
    if (!m || !level) throw new Error(`programme ${id}: courseKey ${idnumber} or plan level missing`);
    if (withdrawn[idnumber]) {
      withdrawnNotes.push(`${idnumber} (${withdrawn[idnumber].reason || "withdrawn"})`);
      continue;
    }
    const categoryPath = PROGRAMME.categoryPath;
    categorySet.set(categoryPath.join(" / "), { name: categoryPath[categoryPath.length - 1], path: categoryPath });
    const units = cfg.lessons.map((l) => ({ number: l.unit, idnumber: `${idnumber}-u${pad2(l.unit)}`, title: l.title, termId: null }));
    const label = level.name.replace(/\s+—\s+/, ": ");
    // "Pre-A1" is one band: only an en dash ("A1–A2") joins two
    const cefr = level.cefr && level.cefr !== "Literacy" ? level.cefr.split(/\s*–\s*/) : [];
    courses.push({
      idnumber,
      subject: INTENSIVE.subject,
      subjectKey: INTENSIVE.key,
      stage: Number(m[1]),
      level: "Intensive English",
      cambridgeCode: "",
      cefr,
      fullname: `Ehel Intensive English — ${label}`,
      shortname: idnumber.toUpperCase(),
      categoryPath,
      summary: `${level.summary} ${units.length} lessons.`,
      unitCount: units.length,
      units,
    });
  }
}

function buildCatalog() {
  const courses = [];
  const categorySet = new Map(); // path-string → {name, path[]}

  for (const [subjectDir, meta] of Object.entries(SUBJECTS)) {
    for (let grade = 1; grade <= 12; grade += 1) {
      const manifest = readManifest(subjectDir, grade);
      if (!manifest) continue;

      const stage = grade; // grade == Cambridge Stage
      const level = levelForStage(stage);
      const gg = pad2(stage);
      const idnumber = `ehel-${meta.key}-g${gg}`;
      if (withdrawn[idnumber]) {
        withdrawnNotes.push(`${idnumber} (${withdrawn[idnumber].reason || "withdrawn"})`);
        continue;
      }
      const label = (manifest.stage || manifest.grade || {}).label || `Stage ${stage}`;
      const categoryPath = ["Ehel Academy", levelName(level), meta.name];
      categorySet.set(categoryPath.join(" / "), { name: categoryPath[categoryPath.length - 1], path: categoryPath });

      const units = (manifest.units || []).map((u) => ({
        number: u.number,
        // grade-item key = course idnumber + unit — what the gradebook item carries.
        idnumber: `${idnumber}-u${pad2(u.number)}`,
        title: u.title,
        termId: u.termId || null,
      }));

      courses.push({
        idnumber,
        subject: meta.name,
        subjectKey: meta.key,
        stage,
        level: levelName(level),
        cambridgeCode: meta.code[level],
        fullname: `Ehel ${meta.name} — ${label}`,
        shortname: idnumber.toUpperCase(),
        categoryPath,
        summary: `Cambridge-aligned ${meta.name} (${meta.code[level]}), ${label}. ${units.length} units.`,
        unitCount: units.length,
        units,
      });
    }
  }

  addIntensiveCourses(courses, categorySet);
  addIntensiveProgrammeCourses(courses, categorySet);
  addArtCourses(courses, categorySet);

  courses.sort((a, b) => a.idnumber.localeCompare(b.idnumber));
  const categories = [...categorySet.values()].sort((a, b) => a.path.join("/").localeCompare(b.path.join("/")));

  return {
    catalog: "ehel-academy",
    contract: "1.0",
    // No timestamp baked in — keep the file byte-stable across reruns so the
    // hash-based deploy only re-uploads on real content changes.
    categories,
    courses,
  };
}

const catalog = buildCatalog();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
console.log(`catalog: ${catalog.courses.length} courses, ${catalog.categories.length} categories → ${path.relative(ROOT, OUT)}`);
// Counted off the built courses, not off SUBJECTS — a family that is not in
// that map (Intensive English) would otherwise be missing from its own report.
const bySubjectKey = new Map();
for (const c of catalog.courses) bySubjectKey.set(c.subjectKey, (bySubjectKey.get(c.subjectKey) || 0) + 1);
console.log("by subject:", [...bySubjectKey].map(([k, n]) => `${k}=${n}`).join(" · "));
const totalUnits = catalog.courses.reduce((n, c) => n + c.unitCount, 0);
console.log(`total grade-item units: ${totalUnits}`);
// Printed rather than silent: a course dropping out of the catalogue is exactly
// the kind of change that should never happen without somebody noticing.
if (withdrawnNotes.length) {
  console.log(`withdrawn, not in the catalogue (${withdrawnNotes.length}):`);
  for (const note of withdrawnNotes) console.log(`   ${note}`);
}
