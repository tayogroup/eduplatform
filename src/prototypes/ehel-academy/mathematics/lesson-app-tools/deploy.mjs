/* Deploy a standalone lesson build to Bunny, described by its app.config.json.
 *
 *   node lesson-app-tools/deploy.mjs --app ../grade-2-app            # plan
 *   node lesson-app-tools/deploy.mjs --app ../grade-2-app --upload   # write
 *
 * PLAN BY DEFAULT, and the plan is network-free: the `if (!UPLOAD) exit(0)`
 * below sits above the first fetch. So the plan hashes are the safe way to ask
 * what this tool ships, which is the only comparison worth making against
 * storage - the module bytes are REWRITTEN on the way out (see flatten), so a
 * raw hash of the source file disagrees with storage by design. Two sessions
 * independently read that difference as drift on 2026-09-07; the tell is that
 * exactly one of the three modules "differs", and it is the only one with
 * imports to rewrite.
 *
 * The path is never probed before the PUT. A miss on a path that does not yet
 * exist is cached by the edge and the key in .env cannot purge it.
 *
 * Storage is verified before the edge: a 201 on the PUT proves nothing, and
 * straight after a write the edge legitimately still holds the old copy.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ZONE = "ehelacademy";
const STORAGE = "https://storage.bunnycdn.com";
const CDN = "https://ehelacademy.b-cdn.net";
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPO = path.resolve(HERE, "../../../../..");

const argv = process.argv.slice(2);
const appArg = argv.includes("--app") ? argv[argv.indexOf("--app") + 1] : ".";
const SRC = path.resolve(process.cwd(), appArg);
const cfgPath = path.join(SRC, "app.config.json");
if (!fs.existsSync(cfgPath)) {
  console.error("No app.config.json in " + SRC + "\n  pass --app <dir>");
  process.exit(2);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const REMOTE = cfg.remote;

// the hub is served as index.html; every lesson keeps its own name.
// extraPages (optional) are pages beside the lessons that are NOT lessons -
// Art & Design's starting check - uploaded under their own names. A build
// without the key uploads exactly what it always did.
const FILES = [[cfg.hub, "index.html"], ...cfg.lessons.map((l) => [l.file, l.file]),
  ...(cfg.extraPages || []).map((f) => [f, f])];

function key() {
  if (process.env.BUNNY_KEY) return process.env.BUNNY_KEY.trim();
  const env = path.join(REPO, ".env");
  const m = fs.readFileSync(env, "utf8").match(/^BUNNY_KEY\s*=\s*(.+)$/m);
  if (!m) { console.error("No BUNNY_KEY."); process.exit(2); }
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const UPLOAD = argv.includes("--upload");

/* The three shell modules the lesson pages import, deployed BESIDE them.
 *
 * One source, copied - not a second implementation. learner-controls.js holds
 * the hand-raise and class-chat singletons that course-app.js mounts for every
 * other course; two copies IN ONE PAGE would poll twice and disagree about
 * whether a hand is up. Two pages each holding one copy are separate documents
 * and cannot see each other anyway.
 *
 * Imports are flattened to ./x.js exactly as deploy-app-version.js flattens
 * them for v{TAG}/: everything sits in one directory here, so `../shared/`
 * would point outside it, and a query string would give the browser two URLs
 * for one file and instantiate the module twice.
 */
const SHELL = path.resolve(HERE, "../../shell");
const SHARED = path.resolve(HERE, "../../shared");
const MODULES = [
  [path.join(SHELL, "learner-controls.js"), "learner-controls.js"],
  [path.join(SHELL, "wehel.js"), "wehel.js"],
  [path.join(SHARED, "course-shell.js"), "course-shell.js"],
  // the write path every other course already uses; see wire-progress.py
  [path.join(SHARED, "progress-client.js"), "progress-client.js"],
  /* Focus mode and the session bar. course_launch.php appends focusMode,
     focusEndpoint and exitUrl to whatever URL the app-url override resolves
     to, so these builds have been receiving those parameters and reading none
     of them - the live group board's away state could not fire for a learner
     here, and there was no "I'm leaving" flow to carry their reason. Self-
     mounts on import and renders nothing without those parameters, so an
     ordinary launch and every local run are unchanged. */
  [path.join(SHARED, "seb-session.js"), "seb-session.js"],
];
const flatten = (s) => s
  .replace(/from\s*(["'])\.\.\/shared\/([A-Za-z0-9_-]+\.js)(\?[^"']*)?\1/g, 'from "./$2"')
  .replace(/from\s*(["'])\.\/([A-Za-z0-9_-]+\.js)(\?[^"']*)?\1/g, 'from "./$2"');

const plan = FILES.map(([local, remote]) => {
  const buf = fs.readFileSync(path.join(SRC, local));
  return { local, remote, buf, sha1: sha1(buf) };
});
for (const [src, remote] of MODULES) {
  const buf = Buffer.from(flatten(fs.readFileSync(src, "utf8")));
  plan.push({ local: path.basename(src), remote, buf, sha1: sha1(buf) });
}

const ctype = (r) => (r.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");

console.log("\n" + (UPLOAD ? "Uploading" : "PLAN (add --upload)") + " " +
  cfg.subjectLabel + " " + cfg.gradeLabel + " to " + CDN + "/" + enc(REMOTE) + "/\n");
for (const f of plan) console.log("  " + f.remote.padEnd(30) + String(f.buf.length).padStart(8) + "  " + f.sha1.slice(0, 12));
if (!UPLOAD) process.exit(0);

const K = key();

console.log("\nPUT:");
for (const f of plan) {
  const r = await fetch(`${STORAGE}/${ZONE}/${enc(REMOTE)}/${enc(f.remote)}`, {
    method: "PUT",
    headers: { AccessKey: K, "Content-Type": ctype(f.remote) },
    body: f.buf,
  });
  console.log("  " + (r.ok ? "ok   " : "FAIL ") + f.remote + "  " + r.status);
  if (!r.ok) process.exitCode = 1;
}

console.log("\nstorage read-back (authoritative):");
let bad = 0;
for (const f of plan) {
  const r = await fetch(`${STORAGE}/${ZONE}/${enc(REMOTE)}/${enc(f.remote)}`, { headers: { AccessKey: K } });
  if (!r.ok) { console.log("  MISSING  " + f.remote + "  " + r.status); bad++; continue; }
  const got = sha1(Buffer.from(await r.arrayBuffer()));
  if (got !== f.sha1) bad++;
  console.log("  " + (got === f.sha1 ? "ok   " : "MISMATCH ") + f.remote + "  " + got.slice(0, 12));
}

console.log("\nedge:");
for (const f of plan) {
  const r = await fetch(`${CDN}/${enc(REMOTE)}/${enc(f.remote)}`, { cache: "no-store" });
  const got = sha1(Buffer.from(await r.arrayBuffer()));
  console.log("  " + (got === f.sha1 ? "fresh" : "stale") + "  " + f.remote.padEnd(30) +
    r.status + "  " + (r.headers.get("cdn-cache") || "?"));
}

console.log(bad ? "\n" + bad + " file(s) did not land" : "\nall " + plan.length + " files verified on storage");
console.log("\n" + CDN + "/" + enc(REMOTE) + "/index.html");
/* This used to close with "Nothing routes a learner here yet". It is not a
 * thing this tool can know: routing lives in local_prequran/ehel_app_url_overrides
 * on the Moodle, which is unreachable from here. Grade 2 had been routed to
 * grade-2-lessons for some time while this line said otherwise, so a deploy
 * that was announced as landing on a dormant path went straight to learners.
 * The README repeated the same claim, which made one assumption look like two
 * sources. Say what is checkable and stop. */
console.log("\nWHO SEES THIS depends on local_prequran/ehel_app_url_overrides, a\n"
  + "Moodle setting this tool cannot read. If that map names " + (cfg.courseKey || "this course")
  + ",\nthese bytes are live to learners NOW. Check it before assuming either way:\n"
  + "  cd /home/ehelacad/quraantest.academy && php <staged-repoint-script>.php");
process.exitCode = bad ? 1 : 0;
