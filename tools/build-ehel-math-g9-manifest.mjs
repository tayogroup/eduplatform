// Build Mathematics Grade 9's course-manifest.json from its unit files.
//
// WHY THIS IS NEEDED AT ALL. shell/subjects/mathematics.js fetches
// `course-manifest.json` from the stage's content root before anything else:
//
//   fetch(new URL("course-manifest.json", ctx.dataRootUrl))
//
// Without it a stage cannot load, whatever else is on the CDN. Grade 9 was
// authored with 15 unit JSONs and no manifest, so uploading the units alone
// would have put 15 unreachable files on the edge and reported success - the
// exact shape of failure the uploader's own comments describe twice.
//
// DERIVED, NOT HAND-WRITTEN. Every field comes from the unit files, so the
// manifest cannot drift from them: a unit renamed in its builder is renamed here
// on the next run. Re-run this after adding or retitling any Grade 9 unit, and
// the companion check will tell you if you forget.
//
// The shape is Grade 8's, field for field, because the shell reads all stages
// through one code path and a stage that invents its own shape is a stage that
// breaks in a way nothing tests. Two fields differ in VALUE and both are honest:
//
//   sourcePackage        null - grades 1-8 name an .xlsx content package;
//                        Grade 9 has none. outputs/math-content/math-content-
//                        model.json holds grades 1-8 only, which is why Grade 9
//                        is authored by hand.
//   packageReviewStatus  says authored and NOT curriculum-reviewed, rather than
//                        grades 1-8's "Imported - curriculum review required".
//                        Both mean review is owed; this one also says no import
//                        ever happened.
//
//   node tools/build-ehel-math-g9-manifest.mjs [--write]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const G9 = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data");
const UNITS = path.join(G9, "units");
const OUT = path.join(G9, "course-manifest.json");
const WRITE = process.argv.includes("--write");

const files = fs.readdirSync(UNITS)
  .filter((n) => /^unit-\d+\.json$/.test(n))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
if (!files.length) throw new Error("no unit files in " + UNITS);

const units = files.map((name) => {
  const u = JSON.parse(fs.readFileSync(path.join(UNITS, name), "utf8"));
  const term = Number(u.term?.id);
  if (!Number.isFinite(term) || term < 1 || term > 3) {
    throw new Error(name + ": term.id is " + JSON.stringify(u.term?.id) + ", expected 1, 2 or 3");
  }
  if (Number(u.stage?.id) !== 9) throw new Error(name + ": stage.id is " + u.stage?.id + ", expected 9");
  return {
    number: u.unit.unitNo,
    id: u.unit.unitId,
    termId: "t0" + term,
    title: u.unit.unitTitle,
    data: "./data/units/" + name,
    // Grades 1-8 count the source documents a unit was extracted from. Grade 9
    // was authored from the Learner's Book and Workbook rather than extracted,
    // so the honest value is 0 rather than a number that implies a package.
    sourceDocumentCount: 0,
    implementationStatus: "Complete runtime package",
    reviewStatus: "Authored - curriculum review required",
  };
});

// the numbers must be 1..N with nothing missing and nothing twice, or the
// shell's unit picker silently skips or repeats an entry
const numbers = units.map((u) => u.number);
const expected = units.map((_, i) => i + 1);
if (numbers.join(",") !== expected.join(",")) {
  throw new Error("unit numbers are " + numbers.join(",") + ", expected " + expected.join(","));
}
const ids = new Set(units.map((u) => u.id));
if (ids.size !== units.length) throw new Error("duplicate unitId among the units");

const manifest = {
  schemaVersion: "Ehel Mathematics Course Manifest v1.0",
  stage: { id: "s09", label: "Stage 9" },
  subject: "Mathematics",
  defaultUnit: 1,
  sourcePackage: null,
  packageReviewStatus: "Authored from the Cambridge Stage 9 Learner's Book and Workbook - not curriculum-reviewed",
  units,
};

const json = JSON.stringify(manifest, null, 2) + "\n";
if (WRITE) fs.writeFileSync(OUT, json, "utf8");

const byTerm = { t01: 0, t02: 0, t03: 0 };
for (const u of units) byTerm[u.termId] += 1;
console.log("  Grade 9 manifest: " + units.length + " units  (t01 " + byTerm.t01 +
  ", t02 " + byTerm.t02 + ", t03 " + byTerm.t03 + ")");
console.log("  numbers 1-" + units.length + " complete, " + ids.size + " distinct unit ids");
console.log("  " + json.length + " bytes " + (WRITE ? "written to " + path.relative(process.cwd(), OUT) : "(--write to save)"));
