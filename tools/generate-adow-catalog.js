#!/usr/bin/env node
// Generates Professor Adow TVET's catalog.json — the THIRD school's course
// source for Moodle's multi-URL catalog_sync task (Ehel Academy, Quraan
// Academy, Professor Adow TVET). Same contract as the other two: courses keyed
// by idnumber, per-unit grade items, category paths.
//
// Shape follows tools/generate-quraan-catalog.js, with one deliberate
// difference: a course enters the catalogue when its course-manifest.json
// exists, and a UNIT enters it when that unit's data file exists. So a course
// can ship with zero units and get zero grade items — which is the Phase 1
// empty-school probe, and also what a course looks like while it is being
// authored. catalog_sync is get-or-create with NO reconciliation pass, so
// nothing here should ever be a throwaway: a course this file names is a
// course Moodle keeps.
//
// Byte-stable (no timestamps, no ordering by filesystem). The content-addressed
// twin (catalog-<digest>.json) is minted by tools/upload-adow-to-bunny.js, not
// here — the digest has to be over the bytes that actually ship.
//
// Usage: node tools/generate-adow-catalog.js [--quiet]
// Output: src/prototypes/professor-adow-tvet/catalog.json

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCHOOL = path.join(ROOT, "src", "prototypes", "professor-adow-tvet");
const OUT = path.join(SCHOOL, "catalog.json");
const QUIET = process.argv.includes("--quiet");

const fail = (message) => { console.error(`generate-adow-catalog: ${message}`); process.exit(1); };

const config = JSON.parse(fs.readFileSync(path.join(SCHOOL, "school.config.json"), "utf8"));
const departments = new Map(config.departments.map((d) => [d.key, d.name]));
const pad2 = (n) => String(n).padStart(2, "0");

// ---- courses ---------------------------------------------------------------
// Sorted by the department order in school.config.json, then by course title,
// so the output does not depend on readdir order on any one machine.
const coursesDir = path.join(SCHOOL, "courses");
const manifests = [];
for (const entry of fs.existsSync(coursesDir) ? fs.readdirSync(coursesDir).sort() : []) {
  const manifestPath = path.join(coursesDir, entry, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest._dir = path.join(coursesDir, entry);
  manifest._rel = `courses/${entry}`;
  manifests.push(manifest);
}
if (!manifests.length) fail(`no course-manifest.json found under ${path.relative(ROOT, coursesDir)}`);

const deptOrder = config.departments.map((d) => d.key);
manifests.sort((a, b) => {
  const byDept = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
  return byDept !== 0 ? byDept : String(a.title).localeCompare(String(b.title));
});

const seenIds = new Set();
const courses = [];
const usedDepartments = new Set();

for (const manifest of manifests) {
  const where = manifest._rel;
  for (const field of ["courseKey", "title", "department", "levelKind", "levelLabel", "summary"]) {
    if (!manifest[field]) fail(`${where}/course-manifest.json is missing "${field}"`);
  }
  if (!departments.has(manifest.department)) {
    fail(`${where}: department "${manifest.department}" is not in school.config.json`);
  }
  if (manifest.levelKind !== "tvet") {
    // Guard the decision recorded in the plan doc: this school carries levels,
    // never grades, and nothing downstream may read levelNumber as a year.
    fail(`${where}: levelKind must be "tvet" (got "${manifest.levelKind}")`);
  }

  const idnumber = String(manifest.courseKey);
  if (seenIds.has(idnumber)) fail(`${where}: duplicate course idnumber "${idnumber}"`);
  if (!idnumber.startsWith(`${config.idPrefix}-`)) {
    fail(`${where}: courseKey "${idnumber}" must start with "${config.idPrefix}-"`);
  }
  seenIds.add(idnumber);

  // Units: declared in the manifest, LISTED only once their data file exists.
  // A listed unit becomes a Moodle grade item named "Progress: uNN" from its
  // number, so the numbers must be unique and contiguous from 1 across the
  // DECLARED set — a gap would silently shift what a grade item refers to.
  const declared = manifest.units || [];
  const numbers = declared.map((u) => Number(u.number));
  if (new Set(numbers).size !== numbers.length) fail(`${where}: duplicate unit numbers`);
  numbers.forEach((n, i) => {
    if (n !== i + 1) fail(`${where}: unit numbers must run 1..${declared.length} in order (found ${n} at position ${i + 1})`);
  });

  const units = declared
    .filter((u) => u.data && fs.existsSync(path.join(manifest._dir, u.data)))
    .map((u) => ({
      number: Number(u.number),
      idnumber: `${idnumber}-u${pad2(u.number)}`,
      title: String(u.title),
      termId: u.termId ?? null,
    }));

  usedDepartments.add(manifest.department);
  courses.push({
    idnumber,
    subject: String(manifest.title),
    subjectKey: idnumber.replace(`${config.idPrefix}-`, ""),
    level: String(manifest.levelLabel),
    fullname: String(manifest.title),
    shortname: idnumber.toUpperCase(),
    categoryPath: [config.categoryRoot, departments.get(manifest.department)],
    summary: String(manifest.summary),
    unitCount: units.length,
    units,
    // Carried into local_prequran_curriculum_map so reports can say which
    // framework a course teaches. Empty until Phase 2 writes the occupational
    // standards file; in-house certification is still a framework and this
    // must not be left saying "Cambridge" by copy-paste.
    curriculumFramework: manifest.curriculumFramework || "",
  });
}

// ---- categories ------------------------------------------------------------
// The school root, then each department that actually has a course. Moodle
// derives category idnumbers from the full path, so "Professor Adow TVET/…"
// cannot collide with Ehel's or Quraan's categories.
const categories = [{ name: config.categoryRoot, path: [config.categoryRoot] }];
for (const dept of config.departments) {
  if (!usedDepartments.has(dept.key)) continue;
  categories.push({ name: dept.name, path: [config.categoryRoot, dept.name] });
}

const catalog = {
  catalog: config.school,
  contract: config.catalogContract,
  categories,
  courses,
};

fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");

if (QUIET) process.exit(0);
console.log(`catalog: ${courses.length} course(s), ${categories.length} categor(ies) → ${path.relative(ROOT, OUT)}`);
for (const course of courses) {
  const declared = manifests.find((m) => m.courseKey === course.idnumber).units || [];
  const built = course.units.length;
  const pending = declared.length - built;
  console.log(
    `  ${course.idnumber}  ${built} unit(s) listed` +
    (pending > 0 ? `, ${pending} declared but not built yet` : "") +
    `  [${course.categoryPath.join(" / ")}]`
  );
}
console.log("\nNothing is live until tools/upload-adow-to-bunny.js ships this file");
console.log("and Moodle's local_prequran/catalog_source_url names the digest URL.");
