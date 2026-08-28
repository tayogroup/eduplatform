#!/usr/bin/env node
// Uploads per-unit COURSE DATA (the small, frequently-edited JSON) to the Bunny
// Storage zone under "Ehel Primary/content/{subject}/gNN/…".
//
// This is the content tier: it lives apart from the app code (app/) and the
// bulk media (media/) so it can be edited and cache-expired on its own cadence.
// Source of each file is the co-located grade-N/data/ tree; the "data/" segment
// is dropped in the remote path (grade-N/data/units/u.json → gNN/units/u.json),
// matching what the app requests via dataRootUrl.
//
// Re-deploy safe: a content-hash manifest means only changed files are sent.
// Access key from env (BUNNY_KEY), never hard-coded.
//
// Usage: BUNNY_KEY=… node tools/upload-content-to-bunny.js [subject …] [--dry]
//   (no args = every subject below)
//   --dry  lists what a run would upload and exits, without contacting Bunny.

const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { requireTiersInStep } = require("./lib/require-tiers-in-step");
const { requirePlatformCors } = require("./lib/require-platform-cors");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const MANIFEST = path.join(ROOT, ".bunny-content-manifest.json");
const CONCURRENCY = 12;

// Read .env the way the generators and upload-media-to-bunny.js do, so the key
// never has to be typed onto a command line — where it would sit in the process
// list for anyone on the machine to read. Must run before KEY is read, or a key
// that lives only in .env looks unset.
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

// --dry lists what a run would upload and exits, without contacting Bunny. The
// same flag upload-app-to-bunny.js carries; upload-media-to-bunny.js still has
// none, so do not assume it there.
//
// Not having it here was a trap rather than an omission. An unrecognised
// `--dry` is filtered out with the subject arguments below, and the key is read
// from .env rather than the command line — so `… --dry` ran a REAL upload of 47
// files on 2026-08-21 while reporting what looked like a preview. Nothing in
// the output said otherwise: the word "uploaded" in the summary was the only
// clue, and it reads the same either way.
const DRY = process.argv.slice(2).includes("--dry");
// --only <substring>: upload only remote paths containing it. Exists because a
// subject's data tree is shared by several sessions, and "upload everything
// that differs for english" ships whatever else is sitting there — the Grade 1
// teacher scripts/clips release needed to carry exactly teacher-* and nothing
// another session had not itself chosen to ship.
const onlyAt = process.argv.indexOf("--only");
const ONLY = onlyAt !== -1 ? String(process.argv[onlyAt + 1] || "") : "";

// The key is only needed for a real run. Saying so in the message means a
// reader who has no key still discovers the flag that works without one.
if (!KEY && !DRY) { console.error("BUNNY_KEY not set (checked the environment and .env; use --dry to preview without uploading)"); process.exit(1); }
const SUBJECTS = ["english", "mathematics", "science", "computing", "global-perspectives",
  "intensive-english"];

// Most subjects number their stages as school grades and keep them in grade-N/.
// Intensive English's stages are CEFR levels in level-N/. Only the local folder
// name differs — remotely they occupy the same gNN slot, which is what the app
// asks for via dataRootUrl, so the remote path needs no special case.
//
// Hard-coding `grade-${n}` here meant this tool walked nothing for such a
// course and reported success having uploaded zero unit files.
const STAGE_DIR = { "intensive-english": (n) => `level-${n}` };
const stageDirFor = (subject, n) => (STAGE_DIR[subject] || ((x) => `grade-${x}`))(n);
// An unrecognised argument used to be dropped by this filter, so a typo — or a
// subject nobody had wired up yet — ran to completion, reported success, and
// uploaded the default set instead of what was asked for. Same guard the media
// uploader already carries.
const unknown = process.argv.slice(2).filter((s, i, all) => !s.startsWith("--") && all[i - 1] !== "--only" && !SUBJECTS.includes(s));
if (unknown.length) {
  console.error(`unknown subject(s): ${unknown.join(", ")}\nknown: ${SUBJECTS.join(", ")}`);
  process.exit(1);
}
const subjects = process.argv.slice(2).filter((s) => SUBJECTS.includes(s));
const subjectList = subjects.length ? subjects : SUBJECTS;

// Authoring artefacts are not content. core-words.json is the allocation plan,
// core-words-draft.json the review surface, and core-words-authored.json the
// hand-written source the build reads. The app fetches none of them, and none
// had ever been deployed — they sit under data/ only because that is where the
// build reads them, and this walker takes every .json it finds, so they would
// ship as a side effect of the directory layout rather than any decision. They
// also carry working notes about the content's own defects, which is not
// something to put on a public CDN by accident.
const AUTHORING_ONLY = /(^|\/)core-words(-draft|-authored)?\.json$/;

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");

function walk(dir, rel = "") {
  const out = [];
  for (const name of fs.readdirSync(path.join(dir, rel))) {
    const childRel = rel ? `${rel}/${name}` : name;
    const st = fs.statSync(path.join(dir, childRel));
    if (st.isDirectory()) out.push(...walk(dir, childRel));
    // JSON is the content tier. The one audio exception lives here on purpose:
    // the Grade 1 "Teach me the activity" clips (teacher-audio/<hash>.mp3,
    // generate-ehel-teacher-audio.js) sit beside the scripts they voice, so the
    // app resolves both from one data root and one upload carries both.
    else if (st.isFile() && (name.endsWith(".json") || (name.endsWith(".mp3") && /(^|\/)teacher-audio\//.test(childRel)))) out.push(childRel);
  }
  return out;
}

// [{local, remote, hash}]: grade-N/data/<rel> → content/{subject}/gNN/<rel>
function buildList() {
  const list = [];
  for (const subject of subjectList) {
    for (let g = 1; g <= 12; g += 1) {
      const dataDir = path.join(EHEL, subject, stageDirFor(subject, g), "data");
      if (!fs.existsSync(dataDir)) continue;
      const gg = String(g).padStart(2, "0");
      for (const rel of walk(dataDir)) {
        if (AUTHORING_ONLY.test(rel)) continue;
        const local = path.join(dataDir, rel);
        list.push({ local, remote: `content/${subject}/g${gg}/${rel}`, hash: sha1(fs.readFileSync(local)) });
      }
    }
  }
  // --only narrows to matching remote paths; the count of what it dropped is
  // printed so a narrowed run never reads as "everything is up to date".
  if (ONLY) {
    const kept = list.filter((item) => item.remote.includes(ONLY));
    console.log(`--only ${ONLY}: ${kept.length} of ${list.length} candidate file(s) kept`);
    return kept;
  }
  return list;
}

async function put(remote, buf) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "PUT", headers: { AccessKey: KEY, "Content-Type": "application/json; charset=utf-8" }, body: buf });
  if (!r.ok && r.status !== 201) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
}

(async () => {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const all = buildList();
  const todo = all.filter((x) => manifest[x.remote] !== x.hash);
  const bytes = todo.reduce((s, x) => s + fs.statSync(x.local).size, 0);
  console.log(`subjects: ${subjectList.join(",")} | total: ${all.length} | unchanged: ${all.length - todo.length} | to upload: ${todo.length} (${(bytes / 1048576).toFixed(1)} MB)`);
  if (DRY) {
    for (const item of todo) console.log(`  ${item.remote}`);
    console.log("\n(dry run — nothing uploaded)");
    return;
  }
  let done = 0, failed = 0, since = 0, idx = 0;
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
  async function worker() {
    while (idx < todo.length) {
      const item = todo[idx++];
      let ok = false;
      for (let a = 1; a <= 4 && !ok; a += 1) {
        try { await put(item.remote, fs.readFileSync(item.local)); ok = true; }
        catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${item.remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
      }
      if (ok) { manifest[item.remote] = item.hash; done += 1; since += 1; }
      if (since >= 50) { since = 0; save(); process.stdout.write(`  …${done}/${todo.length} uploaded\n`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`\n──────── done ──────── uploaded: ${done} | failed: ${failed} | manifest: ${Object.keys(manifest).length}`);

  // A tier is only correct next to the others. On 2026-08-12 Mathematics shipped
  // app v141 against content three weeks old: each side was internally
  // consistent, and the join is what reached learners — the grading rule started
  // requiring a question number the content had since dropped.
  //
  // Checked AFTER the upload, not before. Before a deploy the local tree is
  // supposed to be ahead of the CDN, so a pre-flight version of this would fail
  // on every legitimate release. Afterwards, a split means the operator is not
  // finished, and the exit code says so while the upload itself stands.
  if (!failed) requireTiersInStep(subjectList);
  if (!failed) requirePlatformCors();
})();
