#!/usr/bin/env node
// Gives every lecture video and poster a name derived from its own contents,
// and repoints the data at it. Same trick as version-lecture-captions.js,
// applied to the two asset types that never got it.
//
// Why: lectureVideo/lecturePoster sit at stable paths under app/, which the
// pull zone serves from Perma-Cache. Re-rendering a lecture in place does NOT
// reach learners — a normal purge does not clear perma-cached objects, and
// different edge nodes end up holding different historical versions of the
// same stable path indefinitely (confirmed 2026-08-18: Grade 1 Unit 0's
// lectureVideo was still serving the original 2026-07-16 pre-fix render from
// one edge node, and a THIRD different mid-fix render from another, weeks
// after the content was corrected and redeployed three times). The `?a=`
// query-string stamp added for these two keys (CACHE_BUST_ASSET_KEYS in
// shell/subjects/english.js) only busts the browser's cache — Bunny's edge
// cache key ignores query strings entirely, so it never reached the CDN.
// A path nothing has ever requested cannot be stale, which is the same fix
// version-lecture-captions.js already applied to .vtt files on 2026-08-07.
//
// teacher-lecture.mp4 -> teacher-lecture.4f2a1c9e.mp4
// teacher-lecture-poster.jpg -> teacher-lecture-poster.4f2a1c9e.jpg
// where the suffix is the first 8 hex of sha1(contents). Idempotent: a second
// run finds the hashed file already there and the reference already pointing
// at it, and changes nothing.
//
// The ORIGINAL file is left in place. Something cached may still ask for it,
// and it costs a few MB to keep answering.
//
// Once these are hash-named, shell/subjects/english.js should drop
// "lectureVideo"/"lecturePoster" from CACHE_BUST_ASSET_KEYS — a hashed path
// needs no query stamp, same as lectureCaptions today.
//
// Usage: node tools/version-lecture-video.js [--dry] [--salt STRING] [grade …]
//   e.g. node tools/version-lecture-video.js --dry
//        node tools/version-lecture-video.js 1
//
// --salt STRING: mint a NEW hash even for a reference already versioned, by
// re-reading the original (unhashed) file and hashing content+salt. For when
// the edge itself poisons a freshly-minted hashed path: uploading the media
// after the content JSON that points at it (or any other request that lands
// before the file exists in storage) makes some edge node cache that exact
// path's 404 for up to a year, same failure as a poisoned v{N}/ (see
// docs/bunny-cache-config.md). A poisoned hashed path can't be fixed in
// place — the fix is the same one used there: mint a path nothing has ever
// requested. Confirmed necessary 2026-08-18: Grade 1 Unit 0's freshly
// uploaded lectureVideo 404'd from some edge nodes and 200'd from others,
// because the content tier went live pointing at it before the file upload
// (which ran in two batches after a partial failure) had fully landed.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const saltArg = argv.indexOf("--salt");
const SALT = saltArg >= 0 ? argv[saltArg + 1] : null;
const grades = argv.filter((a) => /^[1-8]$/.test(a)).map(Number);
const wanted = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];

const shortHash = (buf) => crypto.createHash("sha1").update(SALT ? Buffer.concat([buf, Buffer.from(SALT)]) : buf).digest("hex").slice(0, 8);
// Strip an existing <name>.<8 hex>.<ext> suffix back to <name>.<ext>, so
// --salt can re-read the ORIGINAL file even when the reference already
// points at a (possibly poisoned) hashed one.
const bareOf = (ref, ext) => ref.replace(new RegExp(`\\.[0-9a-f]{8}(${ext.source.slice(1)})`), "$1");

// Fields to version, and the extension each is expected to keep.
const FIELDS = [
  { key: "lectureVideo", ext: /\.mp4$/ },
  { key: "lecturePoster", ext: /\.(jpg|jpeg|png)$/ },
];

// Already versioned? <name>.<8 hex>.<ext> — so a re-run is a no-op rather
// than stacking a second suffix onto the first.
const versionedRe = (ext) => new RegExp(`\\.[0-9a-f]{8}${ext.source}`);

// Both reference shapes resolve against the GRADE root, because that is what
// resolveGradeAssets() does with them at runtime: "./media/unit-0/x.mp4" from
// lecture-media.json and "../lecture-media/x.mp4" from a unit's own JSON.
function resolveRef(grade, ref) {
  return path.resolve(path.join(ENGLISH, `grade-${grade}`), ref);
}

let changed = 0, already = 0, missing = 0;
const edits = [];

for (const grade of wanted) {
  const dataDir = path.join(ENGLISH, `grade-${grade}`, "data");
  if (!fs.existsSync(dataDir)) continue;

  const files = [];
  const lectureMedia = path.join(dataDir, "lecture-media.json");
  if (fs.existsSync(lectureMedia)) files.push(lectureMedia);
  const unitsDir = path.join(dataDir, "units");
  if (fs.existsSync(unitsDir)) {
    for (const name of fs.readdirSync(unitsDir)) files.push(path.join(unitsDir, name));
  }

  for (const jsonPath of files) {
    const raw = fs.readFileSync(jsonPath, "utf8");
    const doc = JSON.parse(raw);
    let touched = false;

    // Every place a video/poster reference can live, in one list, so a new
    // shape is added here rather than in two walkers that would drift.
    const holders = [];
    if (doc.units) for (const unit of Object.values(doc.units)) holders.push(unit);
    if (doc.visual) holders.push(doc.visual);

    for (const holder of holders) {
      for (const { key, ext } of FIELDS) {
        const ref = holder && holder[key];
        if (typeof ref !== "string" || !ext.test(ref)) continue;
        const isVersioned = versionedRe(ext).test(ref);
        if (isVersioned && !SALT) { already += 1; continue; }

        const readRef = isVersioned ? bareOf(ref, ext) : ref;
        const source = resolveRef(grade, readRef);
        if (!fs.existsSync(source)) {
          console.log(`  MISSING  grade ${grade}: ${readRef}`);
          missing += 1;
          continue;
        }
        const buf = fs.readFileSync(source);
        const hash = shortHash(buf);
        const hashed = source.replace(ext, (m) => `.${hash}${m}`);
        const nextRef = readRef.replace(ext, (m) => `.${hash}${m}`);

        if (nextRef === ref) { already += 1; continue; }

        edits.push(`  grade ${grade}: ${ref}  ->  ${path.basename(hashed)}`);
        if (!DRY) {
          if (!fs.existsSync(hashed)) fs.copyFileSync(source, hashed);
          holder[key] = nextRef;
          touched = true;
        }
        changed += 1;
      }
    }

    if (touched && !DRY) fs.writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`);
  }
}

edits.forEach((line) => console.log(line));
console.log(`\n${DRY ? "(dry run) " : ""}versioned: ${changed} | already versioned: ${already} | missing on disk: ${missing}`);
if (missing) console.log("A missing file means the data points at a video/poster that was never delivered — fix the reference or ship the file.");
