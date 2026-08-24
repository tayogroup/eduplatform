#!/usr/bin/env node
// Report — and optionally remove — English narration on the Bunny zone that no
// descriptor names any more.
//
// WHY ENGLISH NEEDS ITS OWN TOOL. prune-ehel-course-audio-on-bunny.mjs cannot
// see this course twice over:
//
//   const SUBJECTS = ["science", "mathematics", "computing",
//                     "global-perspectives", "intensive-english"];
//
// English is not in that list, and that tool only looks inside
// `media/<subject>/g<NN>/audio/tts/` — the hash-named tree. English clips are
// named for their content slot and live under
// `media/english/g<NN>/audio/{glossary,vocabulary,readings,…}/`, so they are
// outside the subject list AND outside the search path.
//
// The exposure is CDN-only, and it is not about storage cost. A stranded
// English clip on DISK shows up in `git status`, because English clips are
// committed. A stranded clip on STORAGE is reported by nothing and is the last
// surviving copy of audio that was deleted for being wrong:
// `32-connoisseur-meaning.mp3` sat on the zone from 2026-08-20 saying an
// invented definition — through the repair that deleted it locally and the
// re-record that replaced it — until it was removed by hand on 2026-08-24.
// That deletion is what this tool exists to stop being a hand job.
//
// WHAT COUNTS AS REACHABLE. The claim map, never a filename or a run's own
// queue — the mistake that made computing's `--orphans` report all 77 stock
// tutor phrases as dead and would have deleted them. Two sources, and BOTH are
// protected:
//
//   clipGradeMap()  descriptors the app will play. Reachable.
//   suppressed()    descriptors carrying `available: false`. NOT orphans —
//                   the library's own comment calls them "where narration
//                   resumes when a spoken form of each frame is written", and
//                   they are the state a repair leaves behind between deleting
//                   a wrong recording and paying for its replacement. Deleting
//                   one throws away a slot somebody is about to fill.
//
// A file is an orphan only if NO descriptor names it in either set. That is a
// much narrower claim than "the app will not play it today".
//
// Usage:
//   node tools/prune-english-audio-on-bunny.mjs            # report only
//   node tools/prune-english-audio-on-bunny.mjs --delete   # remove them
//   node tools/prune-english-audio-on-bunny.mjs --json     # machine-readable
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const COURSE = path.join(EHEL, "english");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const MANIFEST = path.join(ROOT, ".bunny-upload-manifest.json");

const remove = process.argv.includes("--delete");
const asJson = process.argv.includes("--json");
// A typo must not fall through to the default action. The other generators bill
// per character when that happens; here it would delete from live storage.
const KNOWN = new Set(["--delete", "--json"]);
const unknown = process.argv.slice(2).filter((a) => !KNOWN.has(a));
if (unknown.length) {
  console.error(`Unrecognised argument(s): ${unknown.join(" ")}`);
  console.error("Usage: node tools/prune-english-audio-on-bunny.mjs [--delete] [--json]");
  process.exit(2);
}

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
if (!KEY) { console.error("BUNNY_KEY not set (checked the environment and .env)"); process.exit(1); }

const narration = require_("./lib/ehel-english-narration.js");

// Every remote path a descriptor names, playable or owed.
const expected = new Set();
let playable = 0;
for (const [clip, grades] of narration.clipGradeMap(COURSE)) {
  for (const g of grades) { expected.add(narration.remoteFor(g, clip)); playable += 1; }
}
const owed = new Set();
for (const { grade, clip } of narration.suppressed(COURSE)) {
  const remote = narration.remoteFor(grade, clip);
  owed.add(remote);
  expected.add(remote);
}

// A lookup that silently returns nothing would make every file on the zone look
// unreachable. The floor is deliberately crude and far below the real figure
// (~17k clips): it is a tripwire for a broken require or a moved data
// directory, not a coverage assertion.
const FLOOR = 5000;
if (expected.size < FLOOR) {
  console.error(`✗ the English claim map resolved only ${expected.size} remote path(s) — refusing to run.`);
  console.error(`  Below the ${FLOOR} floor, that means the lookup is broken rather than the course being small,`);
  console.error("  and proceeding would report most of the course as orphaned.");
  process.exit(1);
}

async function listDir(remoteDir) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remoteDir}/`);
  const r = await fetch(url, { headers: { AccessKey: KEY, Accept: "application/json" } });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`list ${remoteDir}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  return await r.json();
}

async function del(remote) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "DELETE", headers: { AccessKey: KEY } });
  if (!r.ok && r.status !== 404) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.status;
}

const orphans = [];
const onCdnPaths = new Set();
let remoteTotal = 0;
const perGrade = [];
let listFailed = false;

for (let g = 1; g <= 12; g += 1) {
  const gg = String(g).padStart(2, "0");
  const base = `media/english/g${gg}/audio`;
  let categories;
  // A listing that FAILS must not be read as "this grade has no files": that
  // would silently narrow the scan, and with --delete it narrows nothing while
  // reporting success. Record it and refuse to delete later.
  try { categories = await listDir(base); }
  catch (e) { console.error(`  ! g${gg}: ${e.message}`); listFailed = true; continue; }
  if (!categories.length) continue;

  let onCdn = 0;
  const stray = [];
  for (const entry of categories) {
    if (!entry.IsDirectory) continue; // clips live one level down, in category dirs
    const dir = `${base}/${entry.ObjectName}`;
    let files;
    try { files = await listDir(dir); }
    catch (e) { console.error(`  ! ${dir}: ${e.message}`); listFailed = true; continue; }
    for (const f of files) {
      if (f.IsDirectory) continue;
      onCdn += 1;
      const remote = `${dir}/${f.ObjectName}`;
      onCdnPaths.add(remote);
      // EXACT path comparison. This vocabulary is built to defeat a substring
      // match — "32-connoisseur-meaning.mp3" is a substring of the live
      // "u7-g1-32-32-connoisseur-meaning.mp3" and differs from the live word
      // clip "32-connoisseur.mp3" by one suffix.
      if (!expected.has(remote)) stray.push({ remote, bytes: f.Length, created: f.DateCreated });
    }
  }
  remoteTotal += onCdn;
  if (onCdn) perGrade.push({ grade: g, onCdn, orphaned: stray.length });
  orphans.push(...stray);
}

// The MIRROR of an orphan, and it must be COMPUTED rather than inferred from
// the totals. Subtracting `filesOnCdn` from `reachableRemotePaths` answers a
// different question and answers it wrongly twice: the orphan count inflates the
// file total, and `reachable` deliberately includes the owed (`available: false`)
// paths, which are SUPPOSED to have no file. Doing exactly that on 2026-08-24
// turned 0 real defects into a reported 505.
//
// Only a PLAYABLE claim with no file is a defect: the app asks, the CDN 404s,
// and it falls back to the paid runtime TTS endpoint once per request, silently.
//
// One caveat on trusting the zero this currently prints. While the true count is
// 0, a version of this that always returned 0 would look identical — mutating
// `missing` to a constant empty array changes nothing on screen. What DOES prove
// the check is wired to real data is breaking the other side: drop
// `onCdnPaths.add(remote)` and it reports all 93,023 as missing. So the zero is
// only evidence while that second mutation still fires; if this is ever
// refactored, re-run it rather than trusting a green line.
const playablePaths = new Set();
for (const [clip, grades] of narration.clipGradeMap(COURSE)) {
  for (const g of grades) playablePaths.add(narration.remoteFor(g, clip));
}
const missing = [...playablePaths].filter((x) => !onCdnPaths.has(x));
const owedPresent = [...owed].filter((x) => onCdnPaths.has(x));
const owedMissing = [...owed].filter((x) => !onCdnPaths.has(x));

const summary = {
  playableClaims: playable,
  playableMissingFromCdn: missing.length,
  owedMissing: owedMissing.length,
  owedPresent: owedPresent.length,
  missing,
  owedClaims: owed.size,
  reachableRemotePaths: expected.size,
  filesOnCdn: remoteTotal,
  orphaned: orphans.length,
  orphanBytes: orphans.reduce((n, o) => n + (o.bytes || 0), 0),
  perGrade,
  orphans: orphans.map((o) => o.remote),
};

if (asJson) { console.log(JSON.stringify(summary, null, 2)); process.exit(orphans.length ? 0 : 0); }

for (const row of perGrade) {
  console.log(`  g${String(row.grade).padStart(2, "0")}: ${row.onCdn} on CDN, ${row.orphaned} named by no descriptor`);
}
console.log("\nenglish");
console.log(`descriptor claims, playable : ${playable}`);
console.log(`descriptor claims, owed     : ${owed.size}  (available:false — protected, not orphans)`);
console.log(`reachable remote paths      : ${expected.size}`);
console.log(`files on the CDN            : ${remoteTotal}`);
console.log(`playable but NOT on the CDN : ${missing.length}${missing.length ? "  <-- each is a silent paid-TTS fallback" : ""}`);
console.log(`owed and absent             : ${owedMissing.length}  (correct — awaiting a re-record)`);
console.log(`owed but present            : ${owedPresent.length}  (file exists; the app draws no button)`);
if (missing.length) {
  for (const m of missing.slice(0, 20)) console.log(`   missing  ${m}`);
  if (missing.length > 20) console.log(`   … and ${missing.length - 20} more`);
  console.log("   Fix by uploading, not deleting: node tools/upload-media-to-bunny.js english");
}
console.log(`named by no descriptor      : ${orphans.length}  (${(summary.orphanBytes / 1048576).toFixed(1)} MB)`);

if (!orphans.length) { console.log("\nNothing to prune."); process.exit(0); }

for (const o of orphans.slice(0, 20)) {
  console.log(`   ${o.remote}  ${o.bytes}B  created ${o.created}`);
}
if (orphans.length > 20) console.log(`   … and ${orphans.length - 20} more`);

if (!remove) {
  console.log("\n(reporting only — pass --delete to remove them from live storage)");
  console.log("Before deleting, satisfy yourself that nothing DEPLOYED still asks for them:");
  console.log("the repo is not evidence about the CDN, and Bunny caches a 404 on a path that");
  console.log("cannot be purged with the key in .env, so a file deleted while something still");
  console.log("references it becomes a permanent hole rather than a recoverable mistake.");
  process.exit(0);
}

if (listFailed) {
  console.error("\n✗ at least one directory listing failed, so the scan is incomplete — refusing to delete.");
  console.error("  An incomplete scan cannot tell an orphan from a file it never looked at.");
  process.exit(1);
}

let gone = 0;
for (const o of orphans) {
  try { const status = await del(o.remote); gone += 1; console.log(`   deleted ${o.remote} (HTTP ${status})`); }
  catch (e) { console.error(`   ! ${o.remote}: ${e.message}`); }
}

// Drop the deleted paths from the upload manifest, so a later regeneration of
// that exact clip uploads again instead of being skipped as already sent. The
// file is one very large line that several sessions write, so splice the
// entries out rather than re-serialising, and prove the result before writing.
if (gone && fs.existsSync(MANIFEST)) {
  const raw = fs.readFileSync(MANIFEST, "utf8");
  const before = JSON.parse(raw);
  let next = raw;
  const dropped = [];
  for (const o of orphans) {
    if (!Object.prototype.hasOwnProperty.call(before, o.remote)) continue;
    const pat = new RegExp(`,?"${o.remote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":"[0-9a-f]+"`);
    const after = next.replace(pat, "");
    if (after !== next) { next = after; dropped.push(o.remote); }
  }
  if (dropped.length) {
    if (next.startsWith("{,")) next = `{${next.slice(2)}`;
    let parsed;
    try { parsed = JSON.parse(next); } catch (e) { console.error(`   ! manifest edit did not parse (${e.message}) — left unchanged`); parsed = null; }
    const lost = parsed && Object.keys(before).filter((k) => !(k in parsed));
    if (parsed && lost.length === dropped.length && lost.every((k) => dropped.includes(k))) {
      fs.writeFileSync(MANIFEST, next);
      console.log(`\n   manifest: removed ${dropped.length} entry/entries`);
    } else if (parsed) {
      console.error(`   ! manifest edit would have removed ${lost.length} entries for ${dropped.length} deletions — left unchanged`);
    }
  }
}

console.log(`\n✓ removed ${gone} of ${orphans.length} orphan(s) from live storage`);
if (gone) {
  console.log("  The edge may serve them briefly from cache; nothing requests them, so that is harmless.");
}
