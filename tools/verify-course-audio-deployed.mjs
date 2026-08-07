// Prove that every narration clip the app can ask for actually exists on the CDN.
//
// Why this is not answerable from the repo: `npm run check:<subject>` gates the
// text, the hashes and the button wording, but every one of those checks stops
// at the working tree. The gap this finds is between the claim map and Bunny
// storage — a clip that was generated, paid for, and never uploaded. Nothing
// else looks there.
//
// Why it does not read .bunny-upload-manifest.json: that file is a local cache
// of what the uploader believes it did. Nothing reconciles it against storage,
// and anything it wrongly records is skipped forever — 630 Computing clips sat
// undeployed behind exactly that. So this asks storage directly and treats the
// manifest as hearsay.
//
// The recurring defect it was written for: Wehel's 77 stock tutor phrases
// belong to no unit, so they enter a subject's claim map when the tutor is
// wired up rather than when its content is built. Any subject whose last upload
// predates that wiring silently lacks all 77 on every grade, and the tutor drops
// to the paid runtime voice. Computing, Intensive English and Global
// Perspectives each hit this separately.
//
// Exit status is the point: 0 clean, 1 something is missing, 2 bad usage. Safe
// to run unattended — it only ever LISTs, and never prints the access key.
//
// Usage:
//   node tools/verify-course-audio-deployed.mjs                       # every subject
//   node tools/verify-course-audio-deployed.mjs english science       # just these

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

// Hard-coded in tools/upload-media-to-bunny.js rather than env-driven. Reading
// them from the BUNNY_STORAGE_* vars in .env instead points at a different zone
// and 401s, which reads exactly like an expired key.
const ZONE = "ehelacademy";
const STORAGE = "https://storage.bunnycdn.com";
const ROOT_FOLDER = "Ehel Primary";

// Read .env the way the uploader and generators do, so the key never has to be
// typed onto a command line where the process list would expose it.
function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadDotEnv();
const KEY = process.env.BUNNY_KEY;
if (!KEY) {
  console.error("BUNNY_KEY not set (checked the environment and .env)");
  process.exit(2);
}

const SUBJECTS = ["english", "science", "computing", "mathematics", "global-perspectives", "intensive-english"];

// An unrecognised argument must not be dropped silently: the uploader used to do
// that, and a typo ran the default set — every subject — instead of the one
// asked for. Here that would only waste time, but the habit is worth keeping.
const args = process.argv.slice(2);
const unknown = args.filter((a) => !a.startsWith("--") && !SUBJECTS.includes(a));
if (unknown.length) {
  console.error(`unknown subject(s): ${unknown.join(", ")}\nknown: ${SUBJECTS.join(", ")}`);
  process.exit(2);
}
const chosen = args.filter((a) => SUBJECTS.includes(a));
const subjectList = chosen.length ? chosen : SUBJECTS;

// tools/lib/ehel-<x>-narration.js, where two subjects do not use their own name.
const NARRATION_LIB = { mathematics: "math", "intensive-english": "intensive" };

async function list(dir) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${dir}`);
  for (let attempt = 1; ; attempt += 1) {
    try {
      const r = await fetch(url, { headers: { AccessKey: KEY, Accept: "application/json" } });
      // A directory that was never written returns 404 rather than an empty
      // list. That is "nothing uploaded", which is a finding, not an error.
      if (r.status === 404) return new Set();
      if (!r.ok) throw new Error(`${r.status}`);
      return new Set((await r.json()).filter((o) => !o.IsDirectory).map((o) => o.ObjectName));
    } catch (e) {
      if (attempt >= 3) throw new Error(`LIST failed after 3 attempts: ${e.message}`);
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

// What each grade is expected to hold, as { grade -> Set(filename) }.
//
// The five hash-named subjects answer this from their narration module's claim
// map, which is the same set the generator fills and the uploader fans out, and
// which check-ehel-audio-coverage.mjs holds to the subject's course-ui.js. So
// "expected here" really does mean "requestable in the app".
function expectedFromClaimMap(subject) {
  const ttsDir = path.join(EHEL, subject, "media", "audio", "tts");
  if (!fs.existsSync(ttsDir)) return null;
  const lib = NARRATION_LIB[subject] ?? subject;
  const map = require(`./lib/ehel-${lib}-narration.js`).hashGradeMap(path.join(EHEL, subject));
  const byGrade = new Map();
  for (const [hash, grades] of map) {
    for (const g of grades) {
      if (!byGrade.has(g)) byGrade.set(g, new Set());
      byGrade.get(g).add(`${hash}.mp3`);
    }
  }
  return { byGrade, dirFor: (g) => `${ROOT_FOLDER}/media/${subject}/g${String(g).padStart(2, "0")}/audio/tts/` };
}

// English is not hash-named, so its claim map is read out of the course data,
// which records each clip's path explicitly. tools/lib/ehel-english-narration.js
// owns that; see it for why the data is a sound source.
//
// This branch used to list the local tree instead, which was wrong in both
// directions: it reported 36 clips genuinely missing from the CDN (right) and
// 562 as unclaimed extras (wrong — the data claims all 562, they are on the CDN,
// and the local tree is simply the incomplete copy). Pruning on that advice
// would have silenced narration in production.
function expectedFromEnglishData() {
  const courseRoot = path.join(EHEL, "english");
  if (!fs.existsSync(path.join(courseRoot, "media", "audio"))) return null;
  const lib = require("./lib/ehel-english-narration.js");
  const byGrade = new Map();
  for (const [clip, grades] of lib.clipGradeMap(courseRoot)) {
    for (const g of grades) {
      if (!byGrade.has(g)) byGrade.set(g, new Map());
      const cat = clip.split("/")[0];
      const file = clip.slice(cat.length + 1);
      if (!byGrade.get(g).has(cat)) byGrade.get(g).set(cat, new Set());
      byGrade.get(g).get(cat).add(file);
    }
  }
  return { byGrade, perCategory: true };
}

let anyMissing = 0;
let failed = false;

for (const subject of subjectList) {
  const spec = subject === "english" ? expectedFromEnglishData() : expectedFromClaimMap(subject);
  if (!spec) {
    console.log(`\n${subject}: no local narration cache — nothing generated yet, nothing to verify.`);
    continue;
  }

  console.log(`\n${subject}`);
  let totExpected = 0, totMissing = 0, totExtra = 0;
  const missingExamples = [];

  for (const g of [...spec.byGrade.keys()].sort((a, b) => a - b)) {
    const gg = String(g).padStart(2, "0");

    // English compares per category; the rest have one tts/ dir per grade.
    const units = spec.perCategory
      ? [...spec.byGrade.get(g)].map(([cat, files]) => ({ label: cat, files, dir: `${ROOT_FOLDER}/media/english/g${gg}/audio/${cat}/` }))
      : [{ label: null, files: spec.byGrade.get(g), dir: spec.dirFor(g) }];

    let gExpected = 0, gMissing = 0, gExtra = 0, gStorage = 0;
    for (const u of units) {
      let have;
      try { have = await list(u.dir); }
      catch (e) { console.log(`  g${gg}${u.label ? "/" + u.label : ""}: ${e.message}`); failed = true; continue; }
      const missing = [...u.files].filter((f) => !have.has(f));
      gExpected += u.files.size;
      gMissing += missing.length;
      gExtra += [...have].filter((f) => !u.files.has(f)).length;
      gStorage += have.size;
      for (const f of missing) if (missingExamples.length < 5) missingExamples.push(`g${gg}${u.label ? "/" + u.label : ""}/${f}`);
    }
    totExpected += gExpected; totMissing += gMissing; totExtra += gExtra;
    const flag = gMissing ? "  <-- MISSING" : "";
    console.log(`  g${gg}: storage ${String(gStorage).padStart(5)} | expected ${String(gExpected).padStart(5)} | missing ${String(gMissing).padStart(4)} | extra ${gExtra}${flag}`);
  }

  anyMissing += totMissing;
  console.log(`  TOTAL expected ${totExpected} | missing ${totMissing} | extra ${totExtra}`);
  if (totMissing) {
    missingExamples.forEach((f) => console.log(`    e.g. ${f}`));
    console.log(`  fix: node tools/upload-media-to-bunny.js ${subject}`);
  }
  // "extra" is a file on storage nothing claims: already bought, unreachable.
  // Not a failure — deleting costs money to undo — but worth naming.
  if (totExtra) console.log(`  note: ${totExtra} file(s) on storage that nothing claims (see tools/prune-ehel-course-audio.mjs)`);
}

console.log(
  anyMissing
    ? `\n──────── FAIL ──────── ${anyMissing} clip(s) missing from the CDN`
    : `\n──────── ok ──────── every claimed clip is on the CDN`
);
process.exit(anyMissing || failed ? 1 : 0);
