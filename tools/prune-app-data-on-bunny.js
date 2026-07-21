#!/usr/bin/env node
// One-shot cleanup: removes the orphaned per-unit JSON that the P0.3 deploy left
// under "Ehel Primary/app/{subject}/grade-N/data/…". Since the content/app split
// (commit 1175b7e3) the apps fetch that data from "Ehel Primary/content/…", so
// the app-tree copies are dead weight. Deletes only the exact files that exist
// locally under grade-N/data/ (no blind directory deletes). Idempotent: a 404 on
// an already-removed file is treated as success.
//
// Usage: BUNNY_KEY=… node tools/prune-app-data-on-bunny.js [--dry] [english|mathematics|science]…

const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const CONCURRENCY = 12;

if (!KEY) { console.error("BUNNY_KEY not set"); process.exit(1); }
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const pick = args.filter((s) => ["english", "mathematics", "science"].includes(s));
const subjectList = pick.length ? pick : ["english", "mathematics", "science"];

function walk(dir, rel = "") {
  const out = [];
  for (const name of fs.readdirSync(path.join(dir, rel))) {
    const childRel = rel ? `${rel}/${name}` : name;
    const st = fs.statSync(path.join(dir, childRel));
    if (st.isDirectory()) out.push(...walk(dir, childRel));
    else if (st.isFile()) out.push(childRel);
  }
  return out;
}

function buildList() {
  const list = [];
  for (const subject of subjectList) {
    for (let g = 1; g <= 12; g += 1) {
      const dataDir = path.join(EHEL, subject, `grade-${g}`, "data");
      if (!fs.existsSync(dataDir)) continue;
      for (const rel of walk(dataDir)) list.push(`app/${subject}/grade-${g}/data/${rel}`);
    }
  }
  return list;
}

async function del(remote) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "DELETE", headers: { AccessKey: KEY } });
  if (!r.ok && r.status !== 404) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.status;
}

(async () => {
  const all = buildList();
  console.log(`subjects: ${subjectList.join(",")} | orphaned app-tree data files: ${all.length}${dry ? " (DRY RUN)" : ""}`);
  if (dry) { all.slice(0, 5).forEach((r) => console.log("  " + r)); console.log(`  …(${all.length} total)`); return; }
  let done = 0, gone = 0, failed = 0, idx = 0;
  async function worker() {
    while (idx < all.length) {
      const remote = all[idx++];
      let ok = false;
      for (let a = 1; a <= 4 && !ok; a += 1) {
        try { const st = await del(remote); if (st === 404) gone += 1; ok = true; }
        catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
      }
      if (ok) { done += 1; if (done % 100 === 0) process.stdout.write(`  …${done}/${all.length} processed\n`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n──────── done ──────── deleted/absent: ${done} | already-absent(404): ${gone} | failed: ${failed}`);
})();
