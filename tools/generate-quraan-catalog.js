#!/usr/bin/env node
// Generates Quraan Academy's catalog.json — the second school's course source
// for the (now multi-URL) Moodle catalog_sync task. Same contract as the Ehel
// catalog: courses keyed by idnumber, per-unit grade items, category paths.
//
// Option B: per-LEVEL courses (qrn-prequran-lNN). Only units that exist in the
// content tree are listed — grade items are created per listed unit, so a unit
// enters the catalog when its unit-N.json ships (curriculum-signed only).
//
// Byte-stable (no timestamps). Output: src/prototypes/quraan-academy/catalog.json
// Deploy: tools/upload-prequran-to-bunny.js uploads it to content/prequran/catalog.json
// Usage: node tools/generate-quraan-catalog.js

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QURAAN = path.join(ROOT, "src", "prototypes", "quraan-academy");
const OUT = path.join(QURAAN, "catalog.json");

const pad2 = (n) => String(n).padStart(2, "0");

// Levels discovered from the content tree (prequran/grade-N/data/course-manifest.json).
const courses = [];
const prequranDir = path.join(QURAAN, "prequran");
for (const entry of fs.readdirSync(prequranDir)) {
  const match = /^grade-(\d+)$/.exec(entry);
  if (!match) continue;
  const level = Number(match[1]);
  const manifestPath = path.join(prequranDir, entry, "data", "course-manifest.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const idnumber = manifest.courseKey || `qrn-prequran-l${pad2(level)}`;
  // Grade items only for BUILT units (unit JSON exists) — planned units join
  // the catalog when their data ships.
  const units = (manifest.units || [])
    .filter((u) => fs.existsSync(path.join(prequranDir, entry, "data", u.data)))
    .map((u) => ({ number: u.number, idnumber: `${idnumber}-u${pad2(u.number)}`, title: u.title }));
  courses.push({
    idnumber,
    subject: "PreQuraan",
    subjectKey: "prequran",
    level,
    fullname: `PreQuraan — ${manifest.stage.label}`,
    shortname: idnumber.toUpperCase(),
    categoryPath: ["Quraan Academy", "PreQuraan"],
    summary: `Quraan Academy PreQuraan, ${manifest.stage.label}: Quraan reading foundations with recorded recitation audio.`,
    unitCount: units.length,
    units,
  });
}
courses.sort((a, b) => a.level - b.level);

const catalog = {
  catalog: "quraan-academy",
  contract: "1.0",
  categories: [
    { name: "Quraan Academy", path: ["Quraan Academy"] },
    { name: "PreQuraan", path: ["Quraan Academy", "PreQuraan"] },
  ],
  courses,
};

fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
console.log(`catalog: ${courses.length} course(s) → ${path.relative(ROOT, OUT)}`);
for (const course of courses) console.log(`  ${course.idnumber}: ${course.units.length} unit(s) [${course.units.map((u) => u.number).join(", ")}]`);
