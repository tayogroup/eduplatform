#!/usr/bin/env node
// Deploys the fresh PreQuraan app to the QURAANACADEMY storage zone
// (served via app.quraan.academy). Three tiers, mirroring the Ehel layout:
//
//   media/prequran/g00/…    canonical media (legacy alphabet folders REMAPPED:
//                           audio/male→audio/letters, animate→video/writing, …)
//   content/prequran/g00/…  course-manifest.json + units/*.json
//   app/prequran/…          index.html + prequran.{js,css}   (deploy transforms)
//   app/shared/…            the unified shell trio + course-ui.css (copied from
//                           ehel-academy sources; course-app's own ../shared/
//                           imports resolve inside app/shared/ unchanged)
//
// Deploy-time transforms (dev tree keeps ehel-relative paths):
//   prequran.js  ../../ehel-academy/shell/course-app.js → ../shared/course-app.js
//   index.html   ../../ehel-academy/mathematics/shared/course-ui.css → ../shared/course-ui.css
//
// Idempotent: .bunny-quraan-manifest.json (size:mtime per remote path) skips
// unchanged files. Key/zone from .env: BUNNY_STORAGE_ZONE=quraanacademy,
// BUNNY_STORAGE_ACCESS_KEY (that zone's password — NOT ehel's BUNNY_KEY).
//
// Usage: node tools/upload-prequran-to-bunny.js [--dry-run] [--force]

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const MANIFEST_PATH = path.join(ROOT, ".bunny-quraan-manifest.json");

// ---- env -------------------------------------------------------------------
for (const line of fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/) : []) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.trim().startsWith("#")) {
    const key = line.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = line.slice(eq + 1).trim();
  }
}
const ZONE = process.env.BUNNY_STORAGE_ZONE || "quraanacademy";
const KEY = process.env.BUNNY_STORAGE_ACCESS_KEY;
if (!KEY && !DRY) { console.error("Missing BUNNY_STORAGE_ACCESS_KEY in .env"); process.exit(1); }

// ---- file plan -------------------------------------------------------------
const LEGACY_MEDIA = path.join(ROOT, "src", "media", "lessons", "alphabet", "media");
const MEDIA_MAP = [
  ["audio/male", "audio/letters"],
  ["audio/sound", "audio/sounds"],
  ["captions/audio", "audio/captions"],
  ["listen_plus/animals/audio", "audio/animals"],
  ["listen_plus/animals/images", "images/animals"],
  ["words/audio", "audio/words"],
  ["words/images", "images/words"],
  ["video", "video/articulation"],
  ["animate", "video/writing"],
];
const APP_DIR = path.join(ROOT, "src", "prototypes", "quraan-academy", "prequran");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

const plan = []; // { local, remote, transform? }

for (const [legacy, canonical] of MEDIA_MAP) {
  const dir = path.join(LEGACY_MEDIA, legacy);
  for (const file of fs.readdirSync(dir)) {
    plan.push({ local: path.join(dir, file), remote: `media/prequran/g00/${canonical}/${file}` });
  }
}
for (const file of ["course-manifest.json", "units/unit-1.json"]) {
  plan.push({ local: path.join(APP_DIR, "grade-0", "data", file), remote: `content/prequran/g00/${file}` });
}
// Pre-generated English TTS (transliteration explainers, generate-prequran-tts.js)
// → the shell's static voice path. Folder may not exist until the ElevenLabs
// key is configured and the generator has run.
const TTS_DIR = path.join(APP_DIR, "tts");
if (fs.existsSync(TTS_DIR)) {
  for (const file of fs.readdirSync(TTS_DIR)) {
    plan.push({ local: path.join(TTS_DIR, file), remote: `media/prequran/g00/audio/tts/${file}` });
  }
}
// App files deploy under RELEASE-STAMPED names (the pull zone ignores query
// strings and has no edge rules yet, so same-name updates never propagate —
// versioned paths are the cache key, exactly like Ehel's vN releases). A new
// release = bump QRN_RELEASE; only index.html then needs an edge purge (and
// none at all once 5-minute edge rules exist for */app/*).
const QRN_RELEASE = "20260724n";
plan.push({
  local: path.join(APP_DIR, "prequran.js"), remote: `app/prequran/prequran-${QRN_RELEASE}.js`,
  transform: (s) => s.replace('"../../ehel-academy/shell/course-app.js', '"../shared/course-app.js'),
});
plan.push({
  local: path.join(APP_DIR, "index.html"), remote: "app/prequran/index.html",
  // RELEASE-AGNOSTIC on purpose: these used to match the dev ?v=qrn-<release>
  // literally, so bumping QRN_RELEASE silently stopped the rewrite and shipped
  // an index.html still pointing at ./prequran.css (which does not exist on the
  // zone — only release-stamped names do). Matching any ?v=qrn-… keeps a release
  // bump from breaking the deploy again.
  transform: (s) => s
    .replace(/"\.\.\/\.\.\/ehel-academy\/english\/shared\/course-ui\.css\?v=qrn-[0-9a-z]+"/, '"../shared/course-ui-qrn-20260723a.css"')
    .replace(/"\.\/prequran\.css\?v=qrn-[0-9a-z]+"/, `"./prequran-${QRN_RELEASE}.css"`)
    .replace(/"\.\/prequran\.js\?v=qrn-[0-9a-z]+"/, `"./prequran-${QRN_RELEASE}.js"`),
});
plan.push({ local: path.join(APP_DIR, "prequran.css"), remote: `app/prequran/prequran-${QRN_RELEASE}.css` });
// PWA manifest + icon: installed ("Install app" / "Add to Home screen"), the
// manifest's display:fullscreen launches PreQuraan with NO browser chrome — the
// only way to START fullscreen, since requestFullscreen() needs a user gesture.
// Stable names (referenced by index.html), so they are cheap re-uploads.
plan.push({ local: path.join(APP_DIR, "manifest.json"), remote: "app/prequran/manifest.json" });
plan.push({ local: path.join(APP_DIR, "icon.svg"), remote: "app/prequran/icon.svg" });
plan.push({ local: path.join(EHEL, "shell", "course-app.js"), remote: "app/shared/course-app.js" });
plan.push({ local: path.join(EHEL, "shared", "course-shell.js"), remote: "app/shared/course-shell.js" });
plan.push({ local: path.join(EHEL, "shared", "progress-client.js"), remote: "app/shared/progress-client.js" });
// The full self-contained English base stylesheet, DATED filename (the math
// css is only an @import shim over it — deploying that alone shipped an
// unstyled page). New name = clean cache miss on the 30d-default pull zone.
plan.push({ local: path.join(EHEL, "english", "shared", "course-ui.css"), remote: "app/shared/course-ui-qrn-20260723a.css" });

// ---- upload ----------------------------------------------------------------
const manifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) : {};
const stamp = (entry) => {
  const stat = fs.statSync(entry.local);
  return entry.transform ? `${stat.size}:${stat.mtimeMs}:transformed` : `${stat.size}:${stat.mtimeMs}`;
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

(async () => {
  const pending = plan.filter((entry) => FORCE || manifest[entry.remote] !== stamp(entry));
  const totalBytes = pending.reduce((sum, entry) => sum + fs.statSync(entry.local).size, 0);
  console.log(`plan: ${plan.length} files | to upload: ${pending.length} (${(totalBytes / 1048576).toFixed(1)} MB)${DRY ? " [DRY RUN]" : ""}`);
  if (DRY) { pending.slice(0, 15).forEach((entry) => console.log("  would upload", entry.remote)); return; }

  let done = 0, failed = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (pending.length) {
      const entry = pending.shift();
      if (!entry) break;
      try {
        let body = fs.readFileSync(entry.local);
        if (entry.transform) body = Buffer.from(entry.transform(body.toString("utf8")), "utf8");
        let attempts = 0;
        for (;;) {
          try { await put(entry.remote, body); break; }
          catch (error) { if (++attempts >= 3) throw error; await new Promise((r) => setTimeout(r, 800 * attempts)); }
        }
        manifest[entry.remote] = stamp(entry);
        done += 1;
        if (done % 25 === 0 || done < 15) console.log(`  [${done}] ${entry.remote}`);
      } catch (error) {
        failed += 1;
        console.error(`  FAILED ${entry.remote}: ${error.message}`);
      }
    }
  });
  await Promise.all(workers);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`uploaded: ${done}, failed: ${failed}, skipped(unchanged): ${plan.length - done - failed}`);
  if (failed > 0) process.exit(1);
})();
