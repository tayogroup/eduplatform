/* Put the seven-lesson Grade 1 structure on a STAGING path.
 *
 * grade-1-v2, not grade-1-preview. Nothing points at it, so no learner can
 * reach it and the live five-lesson course is untouched; the Moodle launch
 * override still resolves to grade-1-preview until somebody changes it,
 * which is a separate one-line decision with an instant rollback.
 *
 * The path is never probed before the PUT. A miss on a path that does not
 * exist yet is cached by the edge, and the key in .env cannot purge it -
 * cheap on an entry path at max-age=300, but there is no reason to mint one.
 * Storage is verified before the edge, because a 201 on the PUT proves
 * nothing and straight after a write the edge legitimately holds nothing.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ZONE = "ehelacademy";
const REMOTE = "Ehel Primary/app/mathematics/grade-1-v2";
const STORAGE = "https://storage.bunnycdn.com";
const CDN = "https://ehelacademy.b-cdn.net";
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SRC = path.join(HERE, "g1v2");

const FILES = [
  ["g1-index.html", "index.html"],
  ["counting-to-twenty.html", "counting-to-twenty.html"],
  ["adding-and-taking-away.html", "adding-and-taking-away.html"],
  ["halves-and-wholes.html", "halves-and-wholes.html"],
  ["what-comes-next.html", "what-comes-next.html"],
  ["shapes-and-sizes.html", "shapes-and-sizes.html"],
  ["days-months-and-clocks.html", "days-months-and-clocks.html"],
  ["asking-and-sorting.html", "asking-and-sorting.html"],
];

function key() {
  if (process.env.BUNNY_KEY) return process.env.BUNNY_KEY.trim();
  const env = path.join("C:/Users/inawa/Documents/eduplatform", ".env");
  const m = fs.readFileSync(env, "utf8").match(/^BUNNY_KEY\s*=\s*(.+)$/m);
  if (!m) { console.error("No BUNNY_KEY."); process.exit(2); }
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const UPLOAD = process.argv.includes("--upload");
const K = key();

/* The three shell modules the lesson pages import, deployed BESIDE them.
 *
 * One source, copied - not a second implementation. learner-controls.js holds
 * the hand-raise and class-chat singletons that course-app.js mounts for every
 * other subject; the file here is that same file. Two copies in ONE page would
 * poll twice, which is what "MOVED, never cloned" forbids; two pages each with
 * one copy are two documents and cannot see each other anyway.
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

console.log((UPLOAD ? "Uploading" : "PLAN (add --upload)") + " to " + CDN + "/" + enc(REMOTE) + "/\n");
for (const f of plan) console.log("  " + f.remote.padEnd(30) + String(f.buf.length).padStart(8) + "  " + f.sha1.slice(0, 12));
if (!UPLOAD) process.exit(0);

console.log("\nPUT:");
for (const f of plan) {
  const r = await fetch(`${STORAGE}/${ZONE}/${enc(REMOTE)}/${enc(f.remote)}`, {
    method: "PUT",
    headers: { AccessKey: K, "Content-Type": "text/html; charset=utf-8" },
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
console.log("\nstaging: " + CDN + "/" + enc(REMOTE) + "/index.html");
console.log("live (unchanged): " + CDN + "/" + enc("Ehel Primary/app/mathematics/grade-1-preview") + "/index.html");
process.exitCode = bad ? 1 : 0;
