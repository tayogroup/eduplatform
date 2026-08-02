// Remove pre-generated narration from the Bunny zone that no Listen button can
// reach.
//
// tools/prune-ehel-course-audio.mjs clears stranded clips from disk, but the
// uploader only ever adds — so every content rebuild leaves the CDN holding
// clips under hashes the app has stopped asking for. They cost storage, ship in
// no request, and accumulate silently.
//
// The expected set is built from tools/lib/ehel-<subject>-narration.js, the same
// definition the generator, uploader and local pruner use, mapped through
// hashGradeMap to the exact per-grade remote paths the app fetches. Anything
// else under media/<subject>/g<NN>/audio/tts/ is unreachable.
//
// This deletes from live storage, so:
//   - it reports and changes nothing unless --delete is passed
//   - it only ever looks inside media/<subject>/g<NN>/audio/tts/
//   - it refuses to run if the expected set comes out empty, which would mean a
//     broken lookup rather than a genuinely empty course — and would otherwise
//     delete the entire subject
//
// Usage:
//   node tools/prune-ehel-course-audio-on-bunny.mjs <science|mathematics|computing> [--delete]

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const MANIFEST = path.join(ROOT, ".bunny-upload-manifest.json");

const SUBJECTS = ["science", "mathematics", "computing"];
const subject = process.argv.slice(2).find((a) => SUBJECTS.includes(a));
if (!subject) {
  console.error(`Usage: node tools/prune-ehel-course-audio-on-bunny.mjs <${SUBJECTS.join("|")}> [--delete]`);
  process.exit(2);
}
const remove = process.argv.includes("--delete");

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

const libName = `ehel-${subject === "mathematics" ? "math" : subject}-narration.js`;
const narration = createRequire(import.meta.url)(`./lib/${libName}`);

// The exact remote paths the app can ask for.
const expected = new Set();
for (const [hash, grades] of narration.hashGradeMap(path.join(EHEL, subject))) {
  for (const g of grades) expected.add(`media/${subject}/g${String(g).padStart(2, "0")}/audio/tts/${hash}.mp3`);
}
if (!expected.size) {
  console.error(`✗ the expected set for ${subject} is empty — refusing to run.`);
  console.error("  That means the narration lookup is broken, not that the course has no audio;");
  console.error("  proceeding would delete every clip for this subject.");
  process.exit(1);
}

async function listDir(remoteDir) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remoteDir}/`);
  const r = await fetch(url, { headers: { AccessKey: KEY, Accept: "application/json" } });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`list ${remoteDir}: ${r.status} ${(await r.text()).slice(0, 120)}`);
  const rows = await r.json();
  return rows.filter((e) => !e.IsDirectory).map((e) => e.ObjectName);
}

async function del(remote) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "DELETE", headers: { AccessKey: KEY } });
  if (!r.ok && r.status !== 404) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.status;
}

const orphans = [];
let remoteTotal = 0;
for (let g = 1; g <= 12; g += 1) {
  const dir = `media/${subject}/g${String(g).padStart(2, "0")}/audio/tts`;
  let names;
  try { names = await listDir(dir); } catch (e) { console.error(`  ! ${e.message}`); continue; }
  if (!names.length) continue;
  remoteTotal += names.length;
  const stray = names.filter((name) => !expected.has(`${dir}/${name}`));
  console.log(`  g${String(g).padStart(2, "0")}: ${names.length} on CDN, ${stray.length} unreachable`);
  for (const name of stray) orphans.push(`${dir}/${name}`);
}

console.log(`\n${subject}`);
console.log(`reachable remote paths : ${expected.size}`);
console.log(`files on the CDN       : ${remoteTotal}`);
console.log(`unreachable            : ${orphans.length}`);

if (!orphans.length) { console.log("\nNothing to prune."); process.exit(0); }
if (!remove) {
  console.log("\n(reporting only — pass --delete to remove from live storage)");
  for (const o of orphans.slice(0, 10)) console.log(`   ${o}`);
  if (orphans.length > 10) console.log(`   … and ${orphans.length - 10} more`);
  process.exit(0);
}

let done = 0, gone = 0, failed = 0, idx = 0;
async function worker() {
  while (idx < orphans.length) {
    const remote = orphans[idx++];
    let ok = false;
    for (let a = 1; a <= 4 && !ok; a += 1) {
      try { const st = await del(remote); if (st === 404) gone += 1; ok = true; }
      catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
    }
    if (ok) { done += 1; if (done % 100 === 0) process.stdout.write(`  …${done}/${orphans.length} deleted\n`); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

// Drop the deleted paths from the upload manifest, or a later run would treat
// them as already uploaded and skip them if they ever became reachable again.
if (fs.existsSync(MANIFEST)) {
  const entries = new Set(JSON.parse(fs.readFileSync(MANIFEST, "utf8")));
  const before = entries.size;
  for (const o of orphans) entries.delete(o);
  fs.writeFileSync(MANIFEST, JSON.stringify([...entries]));
  console.log(`manifest: ${before} → ${entries.size} entries`);
}
console.log(`\n──────── done ──────── deleted: ${done - gone} | already absent: ${gone} | failed: ${failed}`);
