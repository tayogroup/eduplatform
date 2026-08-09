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
const INTENSIVE = {
  dir: "intensive-english",
  key: "intensive-eng",
  name: "Intensive English",
  subject: "English",
  // Levels 3–5 are planned but unauthored; only levels with a manifest appear.
  maxLevel: 5,
  categoryPath: ["Ehel Academy", "Languages", "Intensive English"],
};

function readManifest(subjectDir, grade) {
  const file = path.join(EHEL, subjectDir, `grade-${grade}`, "data", "course-manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readIntensiveManifest(level) {
  const file = path.join(EHEL, INTENSIVE.dir, `level-${level}`, "data", "course-manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Pushes one course per authored level into the shared courses/category set.
function addIntensiveCourses(courses, categorySet) {
  for (let level = 1; level <= INTENSIVE.maxLevel; level += 1) {
    const manifest = readIntensiveManifest(level);
    if (!manifest) continue;

    const meta = manifest.level || {};
    const label = meta.label || `Level ${level}`;
    const cefr = meta.cefr || [];
    const idnumber = `ehel-${INTENSIVE.key}-l${pad2(level)}`;
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
