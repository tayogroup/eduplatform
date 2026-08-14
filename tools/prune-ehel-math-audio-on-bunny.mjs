// Remove maths narration clips from Bunny that no Listen button can request.
//
// Clips are named by a hash of their button's text, so every wording fix leaves
// the previous file behind — on the CDN as well as on disk. The upload manifest
// records 6,429 maths clips shipped over time against ~2,000 the course can
// currently reach, so most of what is stored is serving nothing.
//
// Staleness is per grade, not per hash. upload-media-to-bunny.js puts a clip
// under every grade that claims it, so the same file legitimately exists at
// several gNN paths; a hash live in Stage 4 can be stale under Stage 3. The
// check is therefore "does THIS grade claim this hash", using hashGradeMap from
// tools/lib/ehel-math-narration.js — the same definition the generator, the
// uploader and the coverage check share.
//
// This is the least reversible cleanup in the pipeline: the clips are no longer
// in git, so a wrong deletion means re-buying the audio from ElevenLabs. It
// therefore refuses to run when the reachable map looks broken, never touches a
// path outside media/mathematics/gNN/audio/tts/, and is a dry run by default.
//
//   BUNNY_KEY=… node tools/prune-ehel-math-audio-on-bunny.mjs [--delete]
//
// Also drops deleted paths from .bunny-upload-manifest.json, so a later
// regeneration of that exact text is uploaded again rather than skipped as
// "already sent".

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readManifest, writeManifest } = require("./lib/upload-manifest.js");
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const MANIFEST = path.join(ROOT, ".bunny-upload-manifest.json");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const CONCURRENCY = 8;

const doDelete = process.argv.includes("--delete");

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

const narration = require("./lib/ehel-math-narration");
const map = narration.hashGradeMap(path.join(EHEL, "mathematics"));
// A parse failure that emptied the map would mark every remote clip stale.
if (map.size < 5000) {
  console.error(`Reachable map has only ${map.size} entries; refusing to prune.`);
  process.exit(1);
}

async function listRemote(remoteDir) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remoteDir}/`);
  const r = await fetch(url, { headers: { AccessKey: KEY, Accept: "application/json" } });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`list ${remoteDir}: ${r.status}`);
  const rows = await r.json();
  return rows.filter((x) => !x.IsDirectory && String(x.ObjectName).endsWith(".mp3"))
    .map((x) => ({ name: String(x.ObjectName), bytes: Number(x.Length) || 0 }));
}

async function deleteRemote(remote) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "DELETE", headers: { AccessKey: KEY } });
  // Already gone is the desired state, not a failure.
  if (r.status === 404) return true;
  return r.ok;
}

const stale = [];
let liveCount = 0, remoteTotal = 0;

for (let g = 1; g <= 8; g += 1) {
  const gg = `g${String(g).padStart(2, "0")}`;
  const dir = `media/mathematics/${gg}/audio/tts`;
  let files;
  try { files = await listRemote(dir); } catch (e) { console.error(`  ${dir}: ${e.message}`); continue; }
  remoteTotal += files.length;
  let staleHere = 0;
  for (const f of files) {
    const hash = f.name.replace(/\.mp3$/, "");
    const grades = map.get(hash);
    if (grades && grades.has(g)) { liveCount += 1; continue; }
    stale.push({ remote: `${dir}/${f.name}`, bytes: f.bytes });
    staleHere += 1;
  }
  console.log(`  ${gg}: ${files.length} remote, ${staleHere} stale`);
}

const staleBytes = stale.reduce((s, x) => s + x.bytes, 0);
console.log(`\nremote maths clips : ${remoteTotal}`);
console.log(`  still reachable  : ${liveCount}`);
console.log(`  stale            : ${stale.length}  (${(staleBytes / 1073741824).toFixed(2)} GB)`);

if (!stale.length) { console.log("\nNothing to prune."); process.exit(0); }
if (!doDelete) {
  console.log(`\nDRY RUN — re-run with --delete to remove them.`);
  for (const s of stale.slice(0, 8)) console.log(`  ${s.remote}`);
  if (stale.length > 8) console.log(`  …and ${stale.length - 8} more`);
  process.exit(0);
}

let done = 0, failed = 0;
const queue = [...stale];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const item = queue.pop();
    if (await deleteRemote(item.remote)) done += 1; else { failed += 1; console.error(`  failed: ${item.remote}`); }
    if (done % 200 === 0 && done) console.log(`  …${done}/${stale.length} deleted`);
  }
}));

// Keep the manifest honest: a path left in it would be skipped by a later
// upload even though the file is no longer there.
if (fs.existsSync(MANIFEST)) {
  const removed = new Set(stale.map((s) => s.remote));
  // Through the shared reader/writer — see tools/lib/upload-manifest.js. Parsing
  // this file as an array and writing one back drops every hash.
  const manifest = readManifest(MANIFEST);
  for (const r of removed) delete manifest[r];
  writeManifest(MANIFEST, manifest);
  console.log(`manifest: dropped ${removed.size} path(s)`);
}

console.log(`\ndeleted: ${done} | failed: ${failed} | freed ~${(staleBytes / 1073741824).toFixed(2)} GB`);
if (failed) process.exitCode = 1;
