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
// Usage: BUNNY_KEY=… node tools/upload-content-to-bunny.js [english|mathematics|science]…
//   (no args = all three)

const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const MANIFEST = path.join(ROOT, ".bunny-content-manifest.json");
const CONCURRENCY = 12;

if (!KEY) { console.error("BUNNY_KEY not set"); process.exit(1); }
const subjects = process.argv.slice(2).filter((s) => ["english", "mathematics", "science"].includes(s));
const subjectList = subjects.length ? subjects : ["english", "mathematics", "science"];

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");

function walk(dir, rel = "") {
  const out = [];
  for (const name of fs.readdirSync(path.join(dir, rel))) {
    const childRel = rel ? `${rel}/${name}` : name;
    const st = fs.statSync(path.join(dir, childRel));
    if (st.isDirectory()) out.push(...walk(dir, childRel));
    else if (st.isFile() && name.endsWith(".json")) out.push(childRel);
  }
  return out;
}

// [{local, remote, hash}]: grade-N/data/<rel> → content/{subject}/gNN/<rel>
function buildList() {
  const list = [];
  for (const subject of subjectList) {
    for (let g = 1; g <= 12; g += 1) {
      const dataDir = path.join(EHEL, subject, `grade-${g}`, "data");
      if (!fs.existsSync(dataDir)) continue;
      const gg = String(g).padStart(2, "0");
      for (const rel of walk(dataDir)) {
        const local = path.join(dataDir, rel);
        list.push({ local, remote: `content/${subject}/g${gg}/${rel}`, hash: sha1(fs.readFileSync(local)) });
      }
    }
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
})();
