#!/usr/bin/env node
// Gives every lecture caption file a name derived from its own contents, and
// repoints the data at it.
//
// Why: caption files sit at stable paths under app/, which the pull zone serves
// from Perma-Cache. Editing a .vtt in place therefore does NOT reach learners —
// a normal purge does not clear perma-cached objects, and on 2026-08-07 the
// Grade 1 Unit 0 captions stayed on their old 7-cue version at the edge for a
// day after the fix was uploaded and two purges were run. A path nothing has
// ever requested cannot be stale, which is the same trick that makes the app's
// v{N}/ releases purge-free.
//
// teacher-lecture.vtt -> teacher-lecture.4f2a1c9e.vtt, where the suffix is the
// first 8 hex of sha1(contents). Idempotent: a second run finds the hashed file
// already there and the reference already pointing at it, and changes nothing.
// Edit a caption and re-run, and it mints a new name by itself.
//
// The ORIGINAL file is left in place. Something cached may still ask for it, and
// it costs a few KB to keep answering.
//
// Usage: node tools/version-lecture-captions.js [--dry] [grade …]
//   e.g. node tools/version-lecture-captions.js --dry
//        node tools/version-lecture-captions.js 1 2

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const grades = argv.filter((a) => /^[1-8]$/.test(a)).map(Number);
const wanted = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];

const shortHash = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
// Already versioned? <name>.<8 hex>.vtt — so a re-run is a no-op rather than
// stacking a second suffix onto the first.
const versioned = (file) => /\.[0-9a-f]{8}\.vtt$/.test(file);

// Both reference shapes resolve against the GRADE root, because that is what
// resolveGradeAssets() does with them at runtime: "./media/unit-0/x.vtt" from
// lecture-media.json and "../lecture-media/x.vtt" from a unit's own JSON.
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

    // Every place a caption reference can live, in one list, so a new shape is
    // added here rather than in two walkers that would drift.
    const holders = [];
    if (doc.units) for (const unit of Object.values(doc.units)) holders.push(unit);
    if (doc.visual) holders.push(doc.visual);

    for (const holder of holders) {
      const ref = holder && holder.lectureCaptions;
      if (typeof ref !== "string" || !ref.endsWith(".vtt")) continue;
      if (versioned(ref)) { already += 1; continue; }

      const source = resolveRef(grade, ref);
      if (!fs.existsSync(source)) {
        console.log(`  MISSING  grade ${grade}: ${ref}`);
        missing += 1;
        continue;
      }
      const buf = fs.readFileSync(source);
      const hashed = source.replace(/\.vtt$/, `.${shortHash(buf)}.vtt`);
      const nextRef = ref.replace(/\.vtt$/, `.${shortHash(buf)}.vtt`);

      edits.push(`  grade ${grade}: ${ref}  ->  ${path.basename(hashed)}`);
      if (!DRY) {
        if (!fs.existsSync(hashed)) fs.copyFileSync(source, hashed);
        holder.lectureCaptions = nextRef;
        touched = true;
      }
      changed += 1;
    }

    if (touched && !DRY) fs.writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`);
  }
}

edits.forEach((line) => console.log(line));
console.log(`\n${DRY ? "(dry run) " : ""}versioned: ${changed} | already versioned: ${already} | missing on disk: ${missing}`);
if (missing) console.log("A missing file means the data points at a caption that was never delivered — fix the reference or ship the file.");
