#!/usr/bin/env node
// Uploads the Ehel Academy static course APPS (HTML/JS/CSS/JSON + images/video +
// per-unit assets) to the Bunny Storage zone under "Ehel Primary/app/…".
//
// The bulk file/tts AUDIO is NOT uploaded here — it lives in the separate
// "Ehel Primary/media/…" tree (see upload-media-to-bunny.js) and the apps reach
// it with hostname-independent relative paths. So each subject's top-level
// media/ directory is excluded; everything else the app requests at runtime
// (grade data, per-grade images/video/vocab-audio, ebooks, vocabulary/, shared/)
// is co-located under app/.
//
// Idempotent & resumable via a local manifest. Access key from env (BUNNY_KEY),
// never hard-coded.
//
// Usage: BUNNY_KEY=… node tools/upload-app-to-bunny.js [english|mathematics|science|vocabulary|shared]…
//   (no args = everything)

const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const MANIFEST = path.join(ROOT, ".bunny-app-manifest.json");
const CONCURRENCY = 12;

if (!KEY) { console.error("BUNNY_KEY not set"); process.exit(1); }

// Each entry: local source dir → remote path under app/. Subjects exclude their
// top-level media/ dir (remapped audio); vocabulary/shared are uploaded whole.
const TREES = [
  { name: "english", src: path.join(EHEL, "english"), dest: "app/english", excludeTop: ["media"] },
  { name: "mathematics", src: path.join(EHEL, "mathematics"), dest: "app/mathematics", excludeTop: ["media"] },
  { name: "science", src: path.join(EHEL, "science"), dest: "app/science", excludeTop: ["media"] },
  { name: "vocabulary", src: path.join(EHEL, "vocabulary"), dest: "app/vocabulary", excludeTop: [] },
  { name: "shared", src: path.join(EHEL, "shared"), dest: "app/shared", excludeTop: [] },
];
const pick = process.argv.slice(2).filter((a) => TREES.some((t) => t.name === a));
const trees = pick.length ? TREES.filter((t) => pick.includes(t.name)) : TREES;

const CT = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".mp4": "video/mp4", ".webm": "video/webm",
  ".vtt": "text/vtt", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8", ".woff2": "font/woff2", ".woff": "font/woff",
};
const ctFor = (f) => CT[path.extname(f).toLowerCase()] || "application/octet-stream";

// Recursively list files under `dir`, skipping any path segment named in `skip`
// (applied only at the tree root via relative depth-0 check).
function walk(root, rel = "", skipTop = []) {
  const out = [];
  const abs = path.join(root, rel);
  for (const name of fs.readdirSync(abs)) {
    const childRel = rel ? `${rel}/${name}` : name;
    if (!rel && skipTop.includes(name)) continue;
    const st = fs.statSync(path.join(abs, name));
    if (st.isDirectory()) out.push(...walk(root, childRel, skipTop));
    else if (st.isFile()) out.push(childRel);
  }
  return out;
}

function buildList() {
  const list = [];
  for (const t of trees) {
    if (!fs.existsSync(t.src)) { console.log(`  (skip ${t.name}: ${t.src} missing)`); continue; }
    for (const rel of walk(t.src, "", t.excludeTop)) {
      list.push({ local: path.join(t.src, rel), remote: `${t.dest}/${rel}` });
    }
  }
  return list;
}

async function put(remote, buf, ct) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "PUT", headers: { AccessKey: KEY, "Content-Type": ct }, body: buf });
  if (!r.ok && r.status !== 201) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
}

(async () => {
  const manifest = fs.existsSync(MANIFEST) ? new Set(JSON.parse(fs.readFileSync(MANIFEST, "utf8"))) : new Set();
  const all = buildList();
  const todo = all.filter((x) => !manifest.has(x.remote));
  const bytes = todo.reduce((s, x) => s + fs.statSync(x.local).size, 0);
  console.log(`trees: ${trees.map((t) => t.name).join(",")} | total: ${all.length} | uploaded: ${all.length - todo.length} | to upload: ${todo.length} (${(bytes / 1048576).toFixed(0)} MB)`);
  let done = 0, failed = 0, since = 0, idx = 0;
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify([...manifest]));
  async function worker() {
    while (idx < todo.length) {
      const item = todo[idx++];
      let ok = false;
      for (let a = 1; a <= 4 && !ok; a += 1) {
        try { await put(item.remote, fs.readFileSync(item.local), ctFor(item.local)); ok = true; }
        catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${item.remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
      }
      if (ok) { manifest.add(item.remote); done += 1; since += 1; }
      if (since >= 100) { since = 0; save(); process.stdout.write(`  …${done}/${todo.length} uploaded\n`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`\n──────── done ──────── uploaded: ${done} | failed: ${failed} | manifest: ${manifest.size}`);
})();
