#!/usr/bin/env node
// Deploys Professor Adow TVET to ITS OWN Bunny storage zone. Forked from
// tools/upload-prequran-to-bunny.js (the Quraan Academy precedent); read that
// file's header for the three-tier layout this mirrors.
//
//   catalog.json          + catalog-<digest>.json   (zone root)
//   content/<course>/…    course-manifest.json + units/*.json
//   app/…                 the lesson build — see THE APP TIER below
//   media/…               NOT YET — nothing in this school has media of its own
//
// This header said app/ was "NOT YET" for longer than it was true: the tier is
// implemented below (APP_EXT), and it is what serves the client a browsable
// site rather than a catalogue of JSON. A stale comment about what a deploy
// does is worth more than a stale comment about anything else.
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

// THE APP TIER — the carpentry prototype.
//
// NO PATH TRANSFORMS, and that is worth saying because Quraan needs several.
// Quraan's app imports the Ehel shell, so its uploader rewrites
// ../../ehel-academy/shell/course-app.js → ../shared/course-app.js on the way
// up, and its header records the release where a missed rewrite shipped a page
// pointing at a stylesheet that was not on the zone. The carpentry build has no
// such import: every page references only ../lesson-kit/lib/*, which ships
// beside it here at the same relative depth. The tree is uploaded as it stands
// on disk, so what a reviewer sees locally is byte-identical to what deploys.
//
// Everything under carpentry/ EXCEPT the sources that produce it: the Python
// builder, the content files and __pycache__ are inputs, not output.
const SKIP_DIRS = new Set(["content", "__pycache__", "courses"]);
/* .mp4/.vtt/.jpg are here for the unit lecture films. Without them the
   walk shipped a page whose <video> pointed at nothing on the zone.
   .mp3 is here for the lesson narration, and its absence would have been
   WORSE than a broken video, because nothing would have looked broken:
   kit.js fetches narration/manifest.json, and on a 404 it sets clips to {}
   and speaks with the browser voice. The rendered narration would simply
   not have been on the zone, and every page would have carried on. */
const APP_EXT = new Set([".html", ".css", ".js", ".svg", ".png", ".woff2", ".mp4", ".vtt", ".jpg", ".mp3"]);

/* The ONLY .json the app serves. A blanket .json would ship the storyboards
   in lecture-video/ and every app.config.json, which are inputs. */
const isNarrationManifest = (full) =>
  path.basename(full) === "manifest.json" && path.basename(path.dirname(full)) === "narration";

// Walk the WHOLE school, not carpentry alone. Shapes and Measurements is a
// cross-trade module and sits beside carpentry rather than inside it, so a
// walk rooted at carpentry/ would have shipped the school landing page
// pointing at a module that was never uploaded.
(function walkApp(dir, rel) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    const here = rel ? `${rel}/${entry}` : entry;
    if (fs.statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walkApp(full, here);
    } else if (APP_EXT.has(path.extname(entry).toLowerCase()) || isNarrationManifest(full)) {
      plan.push({ local: full, remote: `app/${here}` });
    }
  }
})(SCHOOL, "");

// ---- does the plan carry everything the app asks for? ----------------------
//
// AN EXTENSION LIST IS A GUESS ABOUT THE FUTURE and it has been wrong twice:
// once when the films arrived and a page shipped with a <video> pointing at
// nothing, and once when the narration arrived and .mp3 was not on the list.
// The second was the dangerous one, because a missing clip does not look
// broken - the page falls back to the browser voice and says nothing.
//
// So this asks the app instead of the list. Every quoted relative path in a
// page or a script that EXISTS ON DISK must be in the plan. A string that is
// not really a path does not exist on disk and is ignored, which is what keeps
// this from crying wolf; a genuine asset that the walk declined to carry is
// exactly what it catches. It reads scripts too, because the narration
// manifest is reached by fetch() and appears in no page.
(function checkReferences() {
  const shipped = new Set(plan.map((e) => path.resolve(e.local)));
  const misses = [];
  const REF = /["'`]([^"'`\s>]+\.[A-Za-z0-9]{2,5})["'`]/g;
  for (const entry of plan) {
    const ext = path.extname(entry.local).toLowerCase();
    if (ext !== ".html" && ext !== ".js" && ext !== ".css") continue;
    const text = fs.readFileSync(entry.local, "utf8");
    const dir = path.dirname(entry.local);
    let m;
    while ((m = REF.exec(text))) {
      const ref = m[1];
      if (/^(https?:|data:|mailto:|#|\/\/)/.test(ref) || ref.startsWith("/")) continue;
      const target = path.resolve(dir, ref);
      if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) continue;
      if (!target.startsWith(path.resolve(SCHOOL))) continue;
      if (!shipped.has(target)) misses.push(`${path.relative(SCHOOL, entry.local)} -> ${ref}`);
    }
  }
  if (misses.length) {
    const uniq = [...new Set(misses)].sort();
    console.error("");
    console.error("These files exist on disk, are asked for by the app, and are NOT in the upload:");
    for (const line of uniq) console.error("  " + line);
    fail(`${uniq.length} referenced file(s) would be missing from the zone. Add the extension to APP_EXT rather than shipping a page that points at nothing.`);
  }
  /* A NARRATION DIRECTORY MUST HAVE SHIPPED ITS MANIFEST. Without this the
     two checks below are vacuous in exactly the case that matters: drop the
     manifest from the plan and the clip loop has nothing to iterate, so a run
     with no narration at all on the zone prints a tick. That is the original
     failure this whole section exists to stop - the page fetches the manifest,
     gets a 404, sets clips to {} and speaks in the browser voice. */
  (function narrationManifestsShipped(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (!fs.statSync(full).isDirectory() || SKIP_DIRS.has(entry)) continue;
      if (entry === "narration") {
        const mf = path.join(full, "manifest.json");
        if (fs.existsSync(mf) && !shipped.has(path.resolve(mf))) {
          fail(`${path.relative(SCHOOL, mf)} exists but is not in the upload. Every clip beside it would be dead weight on the zone and the lesson would fall back to the browser voice without saying so.`);
        }
      }
      narrationManifestsShipped(full);
    }
  })(SCHOOL);

  /* THE SCAN ABOVE STRUCTURALLY CANNOT SEE THE NARRATION CLIPS. They are
     named only inside narration/manifest.json and reached as
     "narration/" + hit.file at run time, so no literal in any file mentions
     them; removing .mp3 from APP_EXT was caught above only by the slides
     page, which happens to name its track in markup. A manifest is a list of
     files, so read it as one. */
  for (const entry of plan) {
    if (!isNarrationManifest(entry.local)) continue;
    const dir = path.dirname(entry.local);
    const listed = JSON.parse(fs.readFileSync(entry.local, "utf8"));
    const gone = Object.values(listed)
      .map((v) => v && v.file)
      .filter(Boolean)
      .filter((f) => fs.existsSync(path.join(dir, f)) && !shipped.has(path.resolve(dir, f)));
    if (gone.length) {
      console.error("");
      console.error(`${path.relative(SCHOOL, entry.local)} lists clips that are NOT in the upload:`);
      for (const f of gone.sort()) console.error("  " + f);
      fail(`${gone.length} narration clip(s) would be missing. The page would fall back to the browser voice and look fine, which is why this is checked.`);
    }
    console.log(`  narration: all ${Object.keys(listed).length} clip(s) in ${path.relative(SCHOOL, entry.local)} are in the plan.`);
  }

  console.log(`  references: every asset the app asks for is in the plan.`);
})();

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
