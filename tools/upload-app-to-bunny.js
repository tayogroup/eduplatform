#!/usr/bin/env node
// Uploads the Ehel Academy static course APPS (HTML/JS/CSS/JSON + images/video +
// per-unit assets) to the Bunny Storage zone under "Ehel Primary/app/…".
//
// The bulk file/tts AUDIO is NOT uploaded here — it lives in the separate
// "Ehel Primary/media/…" tree (see upload-media-to-bunny.js). Likewise the
// per-unit JSON DATA lives in "Ehel Primary/content/…" (see
// upload-content-to-bunny.js). The apps reach both with hostname-independent
// relative paths. So this excludes each subject's top-level media/ dir AND every
// grade-N/data/ dir; everything else the app requests at runtime (per-grade
// images/video/vocab-audio, ebooks, vocabulary/, shared/) is co-located under app/.
//
// Re-deploy safe: a content-hash manifest means only changed files are sent.
// Access key from env (BUNNY_KEY), never hard-coded.
//
// Usage: BUNNY_KEY=… node tools/upload-app-to-bunny.js [english|mathematics|science|computing|global-perspectives|vocabulary|shared]…
//   (no args = everything)

const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const MANIFEST = path.join(ROOT, ".bunny-app-manifest.json");
const CONCURRENCY = 12;

// --dry lists what a run would upload and exits, without contacting Bunny.
const DRY = process.argv.slice(2).includes("--dry");
// --only <substring>[,<substring>...]: upload just the changed files whose remote
// path contains one of these. Added 2026-08-17 to ship 256 re-rendered lecture
// files (grade-N/media/unit-N/) without also sending the two live code files
// (shared/course-ui.css, shared/grade-redirect.js) that happened to differ from
// the manifest — code goes out through deploy-app-version.js, on purpose. Same
// shape as upload-media-to-bunny.js's --only.
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg >= 0 ? String(process.argv[onlyArg + 1] || "").split(",").map((s) => s.trim()).filter(Boolean) : null;
if (!KEY && !DRY) { console.error("BUNNY_KEY not set (use --dry to preview without uploading)"); process.exit(1); }

// Each entry: local source dir → remote path under app/. Subjects exclude their
// top-level media/ dir (remapped audio); vocabulary/shared are uploaded whole.
const TREES = [
  { name: "english", src: path.join(EHEL, "english"), dest: "app/english", excludeTop: ["media"] },
  { name: "mathematics", src: path.join(EHEL, "mathematics"), dest: "app/mathematics", excludeTop: ["media"] },
  { name: "science", src: path.join(EHEL, "science"), dest: "app/science", excludeTop: ["media"] },
  { name: "computing", src: path.join(EHEL, "computing"), dest: "app/computing", excludeTop: ["media"] },
  { name: "global-perspectives", src: path.join(EHEL, "global-perspectives"), dest: "app/global-perspectives", excludeTop: ["media"] },
  { name: "intensive-english", src: path.join(EHEL, "intensive-english"), dest: "app/intensive-english", excludeTop: ["media"] },
  // The standalone WordQuest app (app/vocabulary/) was retired: its 276 words
  // were already carried into English Grade 2, which extended them to 306. Its
  // art, lecture videos and word audio moved into english/ and ship with that
  // tree. app/vocabulary/ has since been deleted from the storage zone; note
  // that dropping a tree here does not remove it, because deploy only adds and
  // overwrites — a retired tree has to be deleted in storage by hand.
  { name: "shared", src: path.join(EHEL, "shared"), dest: "app/shared", excludeTop: [] },
  // The unified course shell. The older subjects each carry a hand-written
  // shared/course-ui.js and never referenced this, so it was never uploaded;
  // courses built on it (intensive-english, kiswahili) load
  // ../shell/subjects/<subject>.js, which 404s until this ships.
  { name: "shell", src: path.join(EHEL, "shell"), dest: "app/shell", excludeTop: [] },
];
// Single files that sit at the ROOT of the storage zone rather than inside a
// tree. catalog.json is the source of truth Moodle's catalog_sync task reads
// (local_prequran/catalog_source_url →
// https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog.json), so a course that
// is not in the deployed copy does not exist as far as Moodle is concerned.
// docs/catalog-sync-integration.md described it as "generated + deployed" while
// no tool actually shipped it, so it moved only when somebody remembered to
// upload it by hand.
const ROOT_FILES = [
  // `dated: true` also ships a content-addressed copy (catalog-<digest>.json).
  // See the comment where the twin is built: the plain name is unpurgeable for
  // thirty days, so the digest name is what Moodle should actually be pointed
  // at. The plain copy stays for anything still reading it.
  { name: "catalog", src: path.join(EHEL, "catalog.json"), dest: "catalog.json", dated: true },
];

const names = [...TREES.map((t) => t.name), ...ROOT_FILES.map((f) => f.name)];
const onlyValueIndex = process.argv.indexOf("--only") + 1;
const unknown = process.argv.slice(2).filter((a, i) => !a.startsWith("--") && !names.includes(a) && (i + 2) !== onlyValueIndex);
if (unknown.length) {
  console.error(`unknown target(s): ${unknown.join(", ")}\nknown: ${names.join(", ")}`);
  process.exit(1);
}
const pick = process.argv.slice(2).filter((a) => names.includes(a));
const trees = pick.length ? TREES.filter((t) => pick.includes(t.name)) : TREES;
const rootFiles = pick.length ? ROOT_FILES.filter((f) => pick.includes(f.name)) : ROOT_FILES;

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
// (top-level names in `skipTop`), and skips per-grade data/ dirs anywhere
// (grade-N/data/ — that JSON is the content tier, uploaded separately).
// level-N/ as well as grade-N/: Intensive English's stages are CEFR levels, and
// matching only grade-N here would have uploaded all 40 units of JSON into the
// app tree — redundant, unreferenced, and served from content/ anyway.
const DATA_DIR_RE = /(^|\/)(grade|level)-\d+\/data$/;
// Two more per-grade dirs the app never requests, both left by the WordQuest
// retirement: source/ holds the Grade 2 build inputs, and vocabulary-audio/ the
// 276 word clips only the retired app and the dead grade-2/unit-N redirect
// stubs ever read. Shipping them would restore 69 MB of dead weight to the very
// tree the retirement cleared.
const UNSERVED_DIR_RE = /(^|\/)(grade|level)-\d+\/(source|vocabulary-audio)$/;
function walk(root, rel = "", skipTop = []) {
  const out = [];
  const abs = path.join(root, rel);
  for (const name of fs.readdirSync(abs)) {
    const childRel = rel ? `${rel}/${name}` : name;
    if (!rel && skipTop.includes(name)) continue;
    const st = fs.statSync(path.join(abs, name));
    if (st.isDirectory()) {
      if (DATA_DIR_RE.test(childRel)) continue;
      if (UNSERVED_DIR_RE.test(childRel)) continue;
      out.push(...walk(root, childRel, skipTop));
    } else if (st.isFile()) out.push(childRel);
  }
  return out;
}

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");

// A subject's index.html and current.json are the RELEASE POINTER, and they
// belong to tools/deploy-app-version.js — it uploads an index.html rewritten to
// reference the immutable v{TAG}/ bundle. The copy in the source tree still says
// ./shared/…, so shipping it here silently un-versions whatever is live.
//
// That is not hypothetical. English was released as v113 and app/english/v113/
// is on the CDN intact, but the live app/english/index.html points back at
// ./shared/course-ui.css — a later run of this tool overwrote the pointer, and
// because app/{subject}/shared/ is served max-age=2592000 the course has been
// serving month-old assets from a bundle the release had already replaced.
const POINTER_FILES = new Set(["index.html", "current.json"]);

// Harnesses for checking the unified shell renders, not pages a learner reaches:
// nothing in the app links to them and they are not in any catalog. english,
// mathematics and science each carry one. app/english/shell-test.html is already
// on the CDN — excluding it here does not remove it, because deploy only adds and
// overwrites, so that copy has to be deleted in storage by hand.
const DEV_ONLY_FILES = new Set(["shell-test.html"]);
const isSubjectTree = (t) => t.dest.startsWith("app/") && t.name !== "shared" && t.name !== "shell";

function buildList() {
  const list = [];
  for (const t of trees) {
    if (!fs.existsSync(t.src)) { console.log(`  (skip ${t.name}: ${t.src} missing)`); continue; }
    for (const rel of walk(t.src, "", t.excludeTop)) {
      if (isSubjectTree(t) && POINTER_FILES.has(rel)) {
        console.log(`  (skip ${t.name}/${rel}: release pointer, owned by deploy-app-version.js)`);
        continue;
      }
      if (isSubjectTree(t) && DEV_ONLY_FILES.has(rel)) {
        console.log(`  (skip ${t.name}/${rel}: shell test harness, not learner-facing)`);
        continue;
      }
      const local = path.join(t.src, rel);
      list.push({ local, remote: `${t.dest}/${rel}`, hash: sha1(fs.readFileSync(local)) });
    }
  }
  for (const f of rootFiles) {
    if (!fs.existsSync(f.src)) { console.log(`  (skip ${f.name}: ${f.src} missing)`); continue; }
    const buf = fs.readFileSync(f.src);
    list.push({ local: f.src, remote: f.dest, hash: sha1(buf) });
    // A content-addressed twin beside the plain name. The plain catalog.json is
    // served with max-age=2592000 and query strings are ignored, so a change to
    // it is invisible to the edge — and therefore to Moodle — for up to thirty
    // days, with no way to purge short of an account API key. A new filename is
    // a guaranteed cache miss, which is the same trick deploy-app-version.js
    // uses for app code.
    //
    // Keyed on the CONTENT, not the date: identical content keeps the same URL,
    // so re-running this changes nothing and nobody has to touch the Moodle
    // setting. Only a real catalogue change mints a new name — and that is
    // exactly when local_prequran/catalog_source_url has to be repointed.
    if (f.dated) {
      const digest = sha1(buf).slice(0, 10);
      const dest = f.dest.replace(/\.json$/, `-${digest}.json`);
      list.push({ local: f.src, remote: dest, hash: sha1(buf), datedFor: f.dest });
    }
  }
  return list;
}

// The digest URL is useless if nobody learns it, and it is not guessable — so
// it is printed on every run that ships one, whether or not the file changed.
// A run that says nothing here has shipped a catalogue Moodle will not see.
function reportDatedUrls(all) {
  const dated = all.filter((x) => x.datedFor);
  if (!dated.length) return;
  console.log("\n──────── point Moodle at these ────────");
  for (const item of dated) {
    const url = `https://ehelacademy.b-cdn.net/` + encodeURI(`${ROOT_FOLDER}/${item.remote}`);
    console.log(`  ${url}`);
  }
  console.log("  Site administration → Plugins → Local plugins → Pre-Quraan →");
  console.log("  local_prequran/catalog_source_url  (one URL per line, one per school)");
  console.log("  The digest is over the file's content: unchanged catalogue, unchanged URL,");
  console.log("  nothing to update. A new digest means the catalogue really changed.");
}

async function put(remote, buf, ct) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "PUT", headers: { AccessKey: KEY, "Content-Type": ct }, body: buf });
  if (!r.ok && r.status !== 201) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
}

(async () => {
  // Hash-based manifest {remote: sha1}: re-deploys send only changed files.
  // (Legacy array-format manifests are ignored → a one-time full re-upload.)
  const raw = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const manifest = Array.isArray(raw) ? {} : raw;
  const all = buildList();
  let todo = all.filter((x) => manifest[x.remote] !== x.hash);
  if (ONLY) {
    const before = todo.length;
    todo = todo.filter((x) => ONLY.some((s) => x.remote.includes(s)));
    console.log(`--only ${ONLY.join(",")}: ${todo.length} of ${before} changed file(s) selected; the rest stay pending`);
  }
  const bytes = todo.reduce((s, x) => s + fs.statSync(x.local).size, 0);
  console.log(`trees: ${trees.map((t) => t.name).join(",")} | total: ${all.length} | unchanged: ${all.length - todo.length} | to upload: ${todo.length} (${(bytes / 1048576).toFixed(0)} MB)`);
  if (DRY) {
    for (const item of todo) console.log(`  ${item.remote}`);
    const stray = all.filter((x) => /^app\/[a-z-]+\/(index\.html|current\.json)$/.test(x.remote));
    console.log(stray.length
      ? `\nWARNING — ${stray.length} release pointer(s) would be overwritten: ${stray.map((x) => x.remote).join(", ")}`
      : `\nNo release pointer is touched — index.html/current.json stay owned by deploy-app-version.js.`);
    reportDatedUrls(all);
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
        try { await put(item.remote, fs.readFileSync(item.local), ctFor(item.local)); ok = true; }
        catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${item.remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
      }
      if (ok) { manifest[item.remote] = item.hash; done += 1; since += 1; }
      if (since >= 100) { since = 0; save(); process.stdout.write(`  …${done}/${todo.length} uploaded\n`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`\n──────── done ──────── uploaded: ${done} | failed: ${failed} | manifest: ${Object.keys(manifest).length}`);
  reportDatedUrls(all);
})();
