// Validate the Cambridge objective codes the MATHEMATICS STANDALONE APPS claim.
//
// check-math-cambridge.mjs walks the shell-course units only. Its own docs say
// so: "The standalone lesson apps (grade-N-app/) make their own objective
// claims, and this gate does not read them." Five apps between them name 234
// codes that nothing has ever checked. This is that check.
//
// WHAT IT ENFORCES
//
//   1. Every code an app names must EXIST in a Cambridge framework in
//      src/curriculum/. A code that is in no framework is a hard failure - it
//      cannot be a typo the reader will notice, because it looks exactly like
//      a real one.
//   2. Every code the app claims AS ITS OWN STAGE must be in that stage.
//   3. Own-stage coverage may not fall below the recorded floor. All five apps
//      are at 100% of their stage as of 2026-09-26, so the floors lock that in
//      rather than describing an aspiration.
//
// WHAT IT DELIBERATELY ALLOWS: a code from ANOTHER stage. Two legitimate uses
// exist and both are real:
//   - grade-5-app's check page carries a STAGES table that labels each step
//     "Stage 4", "Stage 6" or "Beyond primary" and cites the matching code on
//     purpose, because the lesson deliberately runs past Stage 5 in places.
//   - grade-2-app's lecture-video storyboard for "Which Way From Here" cites
//     1Gp.01, the Stage 1 objective the film recalls before building on it.
// Both are reported, neither fails. Turning cross-stage citation into an error
// would break content that is correct.
//
// TEXT FILES ONLY, AND THAT IS THE POINT OF THIS COMMENT.
//
// While measuring for this gate I reported - here, in two commit messages and
// in the delegation handoff - that grade-1-app "declares 8Wx.31, a Stage 8
// code sitting in a Stage 1 app, and no gate has ever objected". That was
// wrong. 8Wx.31 is not declared anywhere. It is a byte sequence inside
// lecture-video/days-months-and-clocks.990f0aab.mp4 that happens to match the
// code pattern, found because my grep walked a binary. There is no such code
// in any framework and no text file in any maths app contains it.
//
// So the first rule of this gate is the one my own measurement broke: scan
// .html, .json and .js, and never open a .mp4, .jpg, .vtt or anything else.
// A gate that reads binaries invents defects, and an invented defect costs
// more than a missed one because somebody acts on it.
//
//   node tools/check-ehel-math-app-objectives.mjs [--verbose]
//
// Exit 0 when every app passes, 1 on any finding.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MATHS = path.join(ROOT, "src", "prototypes", "ehel-academy", "mathematics");
const CURRICULUM = path.join(ROOT, "src", "curriculum");
const VERBOSE = process.argv.includes("--verbose");

// Only these are read. Everything else on disk is ignored; see the note above.
const TEXT = new Set([".html", ".json", ".js", ".mjs", ".css", ".md"]);

// app directory -> the stage it teaches. The directory name is not enough:
// grade-1-app holds the retired one-page build AND g1v2, and only g1v2 ships.
const APPS = [
  { dir: "grade-1-app/g1v2", stage: 1, floor: 36 },
  { dir: "grade-2-app", stage: 2, floor: 48 },
  { dir: "grade-3-app", stage: 3, floor: 53 },
  { dir: "grade-4-app", stage: 4, floor: 46 },
  { dir: "grade-5-app", stage: 5, floor: 51 },
];

const CODE = /\b[1-9][A-Z][a-z]{1,2}\.\d{2}\b/g;

// ---- the frameworks, split into MATHEMATICS and everything else.
//
// The split matters and a first version of this gate did not have it. Loading
// every cambridge-*.json into one set made Stage 1 look like 184 objectives,
// because English, Science, Computing and Global Perspectives all have codes
// beginning "1". Coverage then read 36/184 = 20% for an app that in fact
// claims every one of the 36 Stage 1 MATHS objectives. A denominator drawn
// from the wrong subjects is worse than no denominator: it reports a complete
// course as a fifth done.
//
// Keeping the other subjects loaded is still useful - it lets a maths app
// citing, say, an English code be named as that rather than dismissed as
// nonexistent, which is a different mistake needing a different fix.
function load(filter) {
  const m = new Map();
  for (const f of fs.readdirSync(CURRICULUM).filter((x) => /^cambridge-.*\.json$/.test(x))) {
    if (!filter(f)) continue;
    const j = JSON.parse(fs.readFileSync(path.join(CURRICULUM, f), "utf8"));
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) return o.forEach(walk);
      if (typeof o.code === "string" && /^[1-9][A-Z][a-z]{1,2}\.\d{2}$/.test(o.code)) {
        if (!m.has(o.code)) m.set(o.code, f);
      }
      Object.values(o).forEach(walk);
    })(j);
  }
  return m;
}
const known = load((f) => /^cambridge-mathematics-/.test(f));
const otherSubjects = load((f) => !/^cambridge-mathematics-/.test(f));
const stageTotal = (s) => [...known.keys()].filter((c) => c[0] === String(s)).length;

// COVERAGE IS COUNTED FROM THE FILES THAT SHIP, and only those: the hub, the
// lessons and any extraPages named in app.config.json. Everything else in the
// directory is walked too, but what it finds is reported separately and never
// counted.
//
// The reason is that these directories hold plenty a learner never sees -
// grade-3-app alone has src/_old_l1-content.js, a retired copy, and
// checks/stage-3-coverage-audit.html, an audit page. A code claimed only
// there would raise coverage while teaching nobody, which is the same shape as
// citing an objective and teaching around it.
//
// Measured before the split: no app relies on an unshipped file for any of its
// stage codes - all of 36, 48, 53, 46 and 51 appear in files that ship - so
// this changes no number today. It stops the hazard rather than fixing a live
// defect, which is the cheaper moment to do it.
function textFiles(dir) {
  const out = [];
  (function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "__pycache__") walk(p); continue; }
      if (TEXT.has(path.extname(e.name).toLowerCase())) out.push(p);
    }
  })(dir);
  return out;
}

function shippedSet(dir) {
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, "app.config.json"), "utf8"));
  return new Set([cfg.hub, ...cfg.lessons.map((l) => l.file), ...(cfg.extraPages || [])]);
}

let findings = 0;
const rows = [];

for (const app of APPS) {
  const dir = path.join(MATHS, app.dir);
  if (!fs.existsSync(dir)) {
    console.log(`  MISSING   ${app.dir} — no such app`);
    findings += 1;
    continue;
  }
  const ships = shippedSet(dir);
  const found = new Map();     // code -> Set(relative file), shipped files only
  const unshipped = new Map(); // code -> Set(relative file), everything else
  for (const file of textFiles(dir)) {
    const rel = path.relative(dir, file).split(path.sep).join("/");
    const bucket = ships.has(rel) ? found : unshipped;
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.match(CODE) || []) {
      if (!bucket.has(m)) bucket.set(m, new Set());
      bucket.get(m).add(rel);
    }
  }

  const all = [...found.keys()].sort();
  const unknown = all.filter((c) => !known.has(c));
  const own = all.filter((c) => known.has(c) && c[0] === String(app.stage));
  const cross = all.filter((c) => known.has(c) && c[0] !== String(app.stage));
  const total = stageTotal(app.stage);
  const missing = [...known.keys()].filter((c) => c[0] === String(app.stage) && !own.includes(c)).sort();

  const problems = [];
  for (const c of unknown) {
    const where = [...found.get(c)].slice(0, 2).join(", ");
    const elsewhere = otherSubjects.get(c);
    problems.push(elsewhere
      ? `${c} is not a mathematics code — it belongs to ${elsewhere} — cited in ${where}`
      : `${c} is in NO Cambridge framework — cited in ${where}`);
  }
  if (own.length < app.floor) {
    problems.push(`own-stage coverage fell: ${own.length} of ${total}, floor is ${app.floor}`);
  }

  // A stage code that exists ONLY outside the shipped files is not a failure,
  // but it is worth naming: it is a claim no learner can reach.
  const strandedOwn = [...unshipped.keys()]
    .filter((c) => known.has(c) && c[0] === String(app.stage) && !own.includes(c)).sort();

  findings += problems.length;
  rows.push({ app, own, cross, total, missing, problems, found, strandedOwn });
}

for (const r of rows) {
  const pct = r.total ? Math.round((100 * r.own.length) / r.total) : 0;
  const mark = r.problems.length ? "FAIL" : "ok  ";
  console.log(`  ${mark}  ${r.app.dir.padEnd(20)} stage ${r.app.stage}  ` +
    `${String(r.own.length).padStart(2)}/${String(r.total).padEnd(2)} (${String(pct).padStart(3)}%)` +
    `  cross-stage: ${r.cross.length}`);
  for (const p of r.problems) console.log(`          ${p}`);
  if (r.strandedOwn.length) {
    console.log(`          note: ${r.strandedOwn.length} stage code(s) appear only in files that do not ship: ${r.strandedOwn.join(" ")}`);
  }
  if (VERBOSE) {
    if (r.cross.length) console.log(`          cross-stage cited: ${r.cross.join(" ")}`);
    if (r.missing.length) console.log(`          not claimed: ${r.missing.join(" ")}`);
  }
}

console.log("");
if (findings) {
  console.log(`  ${findings} finding(s) — an app names a code no framework defines, or coverage fell.`);
  process.exit(1);
}
const claimed = rows.reduce((s, r) => s + r.own.length, 0);
const totals = rows.reduce((s, r) => s + r.total, 0);
console.log(`  ✓ math app objectives: ${rows.length} apps, ${claimed}/${totals} stage objectives claimed, ` +
  `every code exists in a framework, no coverage below its floor.`);
