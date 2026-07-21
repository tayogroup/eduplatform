#!/usr/bin/env node
// Generates catalog.json — the static source of truth the Moodle catalog-sync
// task (P1.7) reads to create categories, courses (keyed by idnumber) and grade
// items. The course idnumber is the same key the progress web service resolves
// against (ehel-{subj}-gNN), so once this catalog is synced, push_gradebook()
// finds a real course and the gradebook goes live.
//
// Source of truth is each prototype's grade-N/data/course-manifest.json (unit
// list + titles). Adding/renaming a unit or grade = rerun this, redeploy
// catalog.json, rerun the Moodle sync task.
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
  science: { key: "sci", name: "Science", code: { primary: "0097", lowersec: "0893" } },
};
// Cambridge level by stage: Primary = Stages 1–6, Lower Secondary = Stages 7–9.
const levelForStage = (n) => (n <= 6 ? "primary" : "lowersec");
const levelName = (lvl) => (lvl === "primary" ? "Primary" : "Lower Secondary");
const pad2 = (n) => String(n).padStart(2, "0");

function readManifest(subjectDir, grade) {
  const file = path.join(EHEL, subjectDir, `grade-${grade}`, "data", "course-manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
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
console.log("by subject:", Object.values(SUBJECTS).map((s) => `${s.name}=${catalog.courses.filter((c) => c.subjectKey === s.key).length}`).join(" · "));
const totalUnits = catalog.courses.reduce((n, c) => n + c.unitCount, 0);
console.log(`total grade-item units: ${totalUnits}`);
