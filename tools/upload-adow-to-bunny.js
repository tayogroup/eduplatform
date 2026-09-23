#!/usr/bin/env node
// Deploys Professor Adow TVET to ITS OWN Bunny storage zone. Forked from
// tools/upload-prequran-to-bunny.js (the Quraan Academy precedent); read that
// file's header for the three-tier layout this mirrors.
//
//   catalog.json          + catalog-<digest>.json   (zone root)
//   content/<course>/…    course-manifest.json + units/*.json
//   app/…                 NOT YET — Phase 3, see THE APP TIER below
//   media/…               NOT YET — Phase 3
//
// FOUR DELIBERATE DIFFERENCES FROM EVERY OTHER UPLOADER IN THIS REPO:
//
//  1. It is DRY BY DEFAULT. Nothing is sent without --confirm. The other
//     uploaders here upload on a bare invocation, which is how a stray probe
//     once re-uploaded all six Ehel subjects. A tool whose safe mode is the
//     default cannot be triggered by curiosity.
//  2. It REFUSES UNRECOGNISED ARGUMENTS rather than ignoring them, so a typo
//     in --confirm is a refusal and never a surprise upload.
//  3. Its env vars are NAMED FOR THIS SCHOOL — BUNNY_TVET_ZONE / BUNNY_TVET_KEY.
//     Quraan uses the generic BUNNY_STORAGE_ZONE / BUNNY_STORAGE_ACCESS_KEY and
//     Ehel uses BUNNY_KEY; a third school on a generic name would eventually
//     upload one school's tree into another school's zone.
//  4. Its manifest is .bunny-adow-manifest.json, its own file. Manifests are
//     contended in this shared checkout and two schools must never write one.
//
// Usage:
//   node tools/upload-adow-to-bunny.js                 # dry run (default)
//   node tools/upload-adow-to-bunny.js --confirm       # actually upload
//   node tools/upload-adow-to-bunny.js --confirm --force   # ignore the manifest

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SCHOOL = path.join(ROOT, "src", "prototypes", "professor-adow-tvet");
const MANIFEST_PATH = path.join(ROOT, ".bunny-adow-manifest.json");

// ---- arguments -------------------------------------------------------------
const KNOWN = new Set(["--confirm", "--force"]);
const unknown = process.argv.slice(2).filter((a) => !KNOWN.has(a));
if (unknown.length) {
  console.error(`upload-adow: unrecognised argument(s): ${unknown.join(", ")}`);
  console.error("Known flags: --confirm (actually upload), --force (ignore the manifest).");
  process.exit(2);
}
const CONFIRM = process.argv.includes("--confirm");
const FORCE = process.argv.includes("--force");

const fail = (message) => { console.error(`upload-adow: ${message}`); process.exit(1); };

// ---- env -------------------------------------------------------------------
for (const line of fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/) : []) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.trim().startsWith("#")) {
    const key = line.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = line.slice(eq + 1).trim();
  }
}

const config = JSON.parse(fs.readFileSync(path.join(SCHOOL, "school.config.json"), "utf8"));

// Phase 0 has to be finished before anything can be uploaded. A TODO here is
// not a typo to route around: an upload to the wrong zone, or a probe of a
// version path that does not exist yet, mints a 404 the edge caches for a year
// and the key in .env cannot purge.
for (const field of ["storageZone", "cdnHost", "appDomain"]) {
  if (String(config[field]).startsWith("TODO")) {
    fail(`school.config.json "${field}" is still ${JSON.stringify(config[field])}. Finish Phase 0 first — see docs/professor-adow-tvet-setup-plan.md.`);
  }
}

const ZONE = process.env.BUNNY_TVET_ZONE || config.storageZone;
const KEY = process.env.BUNNY_TVET_KEY;
if (!KEY && CONFIRM) fail("missing BUNNY_TVET_KEY in .env (this zone's own password — NOT Ehel's BUNNY_KEY).");

// ---- file plan -------------------------------------------------------------
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");
const plan = []; // { local, remote, dated? }

// The catalogue, at the zone root, plus its content-addressed twin. The plain
// name is served with a long max-age and query strings are ignored, so a change
// to catalog.json is invisible to Moodle for weeks and cannot be purged without
// an account-level API key. The digest is over the CONTENT: an unchanged
// catalogue keeps its URL and nobody touches the Moodle setting; a new digest
// means the catalogue really changed and the setting must be repointed.
const catalogPath = path.join(SCHOOL, "catalog.json");
if (!fs.existsSync(catalogPath)) fail("catalog.json is missing — run `npm run catalog:adow` first.");
plan.push({ local: catalogPath, remote: "catalog.json" });
plan.push({ local: catalogPath, remote: `catalog-${sha1(fs.readFileSync(catalogPath)).slice(0, 10)}.json`, dated: true });

// Course content: the manifest, and every unit data file that exists. A unit
// that has not been authored is simply absent from both the catalogue and here.
const coursesDir = path.join(SCHOOL, "courses");
for (const entry of fs.existsSync(coursesDir) ? fs.readdirSync(coursesDir).sort() : []) {
  const dir = path.join(coursesDir, entry);
  const manifestPath = path.join(dir, "course-manifest.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const key = manifest.courseKey;
  plan.push({ local: manifestPath, remote: `content/${key}/course-manifest.json` });
  for (const unit of manifest.units || []) {
    const local = path.join(dir, unit.data);
    if (fs.existsSync(local)) plan.push({ local, remote: `content/${key}/${unit.data}` });
  }
}

// THE APP TIER — Phase 3, deliberately not written yet.
//
// Quraan copies the Ehel shell in at deploy time and rewrites its imports
// (../../ehel-academy/shell/course-app.js → ../shared/course-app.js), keeping
// the dev tree Ehel-relative and the deployed tree self-contained. TVET will do
// the same for shared/progress-client.js, shared/course-shell.js and
// shared/lesson-gate.js, plus its own lesson kit output.
//
// It is left empty rather than guessed because the transforms are specific to
// the files a build actually emits, and an untested rewrite that ships a page
// pointing at a stylesheet which does not exist on the zone is exactly the bug
// Quraan's header documents. Add it when Phase 3 emits its first page.

// ---- upload ----------------------------------------------------------------
const manifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) : {};
const stamp = (entry) => {
  const stat = fs.statSync(entry.local);
  return `${stat.size}:${stat.mtimeMs}`;
};

function put(remote, body) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      method: "PUT", host: "storage.bunnycdn.com", path: `/${ZONE}/${remote}`,
      headers: { AccessKey: KEY, "Content-Length": Buffer.byteLength(body) },
    }, (response) => {
      response.resume();
      response.on("end", () => (response.statusCode === 201 ? resolve() : reject(new Error(`${response.statusCode} ${remote}`))));
    });
    request.on("error", reject);
    request.end(body);
  });
}

// The digest URL is not guessable, so it is printed on EVERY run that ships one
// — changed or not. A run that says nothing here has shipped a catalogue Moodle
// will never read.
function reportCatalogUrl() {
  const dated = plan.find((entry) => entry.dated);
  if (!dated) return;
  console.log("\n──────── point Moodle at this ────────");
  console.log(`  https://${config.cdnHost}/${dated.remote}`);
  console.log("  Site administration → Plugins → Local plugins → Pre-Quraan →");
  console.log("  local_prequran/catalog_source_url");
  console.log("  ONE URL PER LINE, one per school. ADD this line; do not replace");
  console.log("  Ehel's or Quraan's — the task reads every line and a removed");
  console.log("  school simply stops syncing.");
}

(async () => {
  const pending = plan.filter((entry) => FORCE || manifest[entry.remote] !== stamp(entry));
  const bytes = pending.reduce((sum, entry) => sum + fs.statSync(entry.local).size, 0);
  console.log(`zone: ${ZONE}  |  plan: ${plan.length} file(s)  |  to upload: ${pending.length} (${(bytes / 1024).toFixed(1)} KB)`);

  if (!CONFIRM) {
    console.log("\n[DRY RUN — nothing sent. Re-run with --confirm to upload.]");
    for (const entry of pending) console.log(`  would upload  ${entry.remote}`);
    if (!pending.length) console.log("  (nothing changed since the last upload)");
    reportCatalogUrl();
    return;
  }

  let done = 0, failed = 0;
  for (const entry of pending) {
    const body = fs.readFileSync(entry.local);
    let attempts = 0;
    for (;;) {
      try { await put(entry.remote, body); break; }
      catch (error) {
        if (++attempts >= 3) { failed += 1; console.error(`  FAILED ${entry.remote}: ${error.message}`); break; }
        await new Promise((r) => setTimeout(r, 800 * attempts));
      }
    }
    if (attempts < 3) { manifest[entry.remote] = stamp(entry); done += 1; console.log(`  [${done}] ${entry.remote}`); }
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`uploaded: ${done}, failed: ${failed}, skipped(unchanged): ${plan.length - pending.length}`);
  reportCatalogUrl();
  if (failed > 0) process.exit(1);
})();
