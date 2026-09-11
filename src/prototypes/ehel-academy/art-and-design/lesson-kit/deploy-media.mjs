/* Upload an Art & Design build's recorded media to Bunny, beside its pages.
 *
 *   node ../lesson-kit/deploy-media.mjs --app .            # plan: what storage lacks
 *   node ../lesson-kit/deploy-media.mjs --app . --upload   # write it, then read it back
 *
 * media/tts/*.mp3 and media/lecture/* go to <cfg.remote>/media/..., the path
 * the pages ask for (they reference media/... relative to themselves).
 * deploy.mjs ships the pages and nothing else; this ships what they play.
 *
 * ORDER IS THE SAFETY. Every clip, video, caption and poster is written and
 * verified BEFORE the two index.json files that name them. A page only asks
 * for a clip its index lists, so a page can never request a file storage
 * does not have - and a request for a missing path is exactly what mints an
 * edge-cached 404 that the key in .env cannot purge. For the same reason
 * this tool never fetches through the edge: storage is asked, the edge is not.
 *
 * Run it BEFORE deploy.mjs --upload when the pages change their media.
 *
 * Skip-if-same is decided by STORAGE, not a local manifest: the listing's
 * SHA-256 is compared with the file's, so a file that never landed is sent
 * again however many times this has run.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const APP = path.resolve(process.cwd(), arg("--app", "."));
const UPLOAD = argv.includes("--upload");
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPO = path.resolve(HERE, "../../../../..");
const cfg = JSON.parse(fs.readFileSync(path.join(APP, "app.config.json"), "utf8"));
const ZONE = "ehelacademy";
const STORAGE = "https://storage.bunnycdn.com";
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex").toUpperCase();
const CT = { ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".vtt": "text/vtt; charset=utf-8", ".jpg": "image/jpeg", ".json": "application/json; charset=utf-8" };

function key() {
  if (process.env.BUNNY_KEY) return process.env.BUNNY_KEY.trim();
  const m = fs.readFileSync(path.join(REPO, ".env"), "utf8").match(/^BUNNY_KEY\s*=\s*(.+)$/m);
  if (!m) { console.error("No BUNNY_KEY."); process.exit(2); }
  return m[1].trim().replace(/^["']|["']$/g, "");
}

/* what to ship: the page-facing media, indexes last */
const MEDIA = path.join(APP, "media");
const files = [];
for (const dir of ["tts", "lecture"]) {
  const d = path.join(MEDIA, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).sort()) {
    if (f === "scripts.json") continue;              /* the review surface, not something a page reads */
    if (!CT[path.extname(f)]) continue;
    files.push({ rel: dir + "/" + f, local: path.join(d, f), index: f === "index.json" });
  }
}
files.sort((a, b) => Number(a.index) - Number(b.index));
if (!files.length) { console.error("nothing under " + MEDIA); process.exit(2); }

const KEY = UPLOAD ? key() : (process.env.BUNNY_KEY || (fs.existsSync(path.join(REPO, ".env")) ? key() : ""));
async function listing(dir) {
  const r = await fetch(STORAGE + "/" + ZONE + "/" + enc(cfg.remote + "/media/" + dir) + "/", { headers: { AccessKey: KEY } });
  if (r.status === 404) return new Map();
  if (!r.ok) throw new Error("storage listing " + dir + ": " + r.status);
  const arr = await r.json();
  return new Map((Array.isArray(arr) ? arr : []).filter((o) => !o.IsDirectory).map((o) => [o.ObjectName, String(o.Checksum || "").toUpperCase()]));
}

const onStorage = {};
for (const dir of ["tts", "lecture"]) onStorage[dir] = KEY ? await listing(dir) : new Map();
const todo = [];
let bytes = 0;
for (const f of files) {
  const buf = fs.readFileSync(f.local);
  f.sha = sha256(buf); f.size = buf.length;
  const [dir, name] = f.rel.split("/");
  if (onStorage[dir].get(name) !== f.sha) { todo.push(f); bytes += buf.length; }
}
console.log("\n  " + cfg.subjectLabel + " " + cfg.gradeLabel + " media -> " + cfg.remote + "/media/");
console.log("  files: " + files.length + " | on storage and identical: " + (files.length - todo.length) + " | to upload: " + todo.length + " (" + (bytes / 1048576).toFixed(1) + " MB)" + (KEY ? "" : "   (no key: storage not asked)"));
if (!UPLOAD) { for (const f of todo.slice(0, 12)) console.log("    " + f.rel); if (todo.length > 12) console.log("    …"); console.log("\n  plan only - add --upload to write\n"); process.exit(0); }

let ok = 0, bad = 0;
async function put(f) {
  const url = STORAGE + "/" + ZONE + "/" + enc(cfg.remote + "/media/" + f.rel);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { method: "PUT", headers: { AccessKey: KEY, "Content-Type": CT[path.extname(f.rel)] }, body: fs.readFileSync(f.local) });
      if (r.status === 201 || r.status === 200) { ok++; return; }
      if (attempt === 3) { bad++; console.log("  FAIL " + f.rel + " " + r.status); }
    } catch (e) { if (attempt === 3) { bad++; console.log("  FAIL " + f.rel + " " + e.message); } }
    await new Promise((res) => setTimeout(res, 800 * attempt));
  }
}
const media = todo.filter((f) => !f.index), indexes = todo.filter((f) => f.index);
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (next < media.length) await put(media[next++]); }));
if (bad) { console.error("\n  " + bad + " media file(s) failed - NOT writing the indexes, so no page will ask for them\n"); process.exit(1); }

/* read the media back before the indexes go up */
const after = {};
for (const dir of ["tts", "lecture"]) after[dir] = await listing(dir);
const unverified = files.filter((f) => !f.index && after[f.rel.split("/")[0]].get(f.rel.split("/")[1]) !== f.sha);
if (unverified.length) {
  console.error("\n  " + unverified.length + " file(s) do not read back identical (" + unverified.slice(0, 5).map((f) => f.rel).join(", ") + ") - NOT writing the indexes\n");
  process.exit(1);
}
for (const f of indexes) await put(f);
const fin = {};
for (const dir of ["tts", "lecture"]) fin[dir] = await listing(dir);
const wrong = files.filter((f) => fin[f.rel.split("/")[0]].get(f.rel.split("/")[1]) !== f.sha);
console.log("\n  uploaded " + ok + ", failed " + bad + "; storage read-back: " + (files.length - wrong.length) + " of " + files.length + " identical" + (wrong.length ? " - MISMATCH: " + wrong.slice(0, 5).map((f) => f.rel).join(", ") : "") + "\n");
process.exit(wrong.length || bad ? 1 : 0);
