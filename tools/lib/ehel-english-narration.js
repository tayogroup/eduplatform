// What English narration exists, and which grade can ask for it.
//
// Every other subject answers this from a hash: the clip is named cyrb53(button
// text), so the narration module can regenerate the whole reachable set from the
// content. English cannot. Its clips are named for what they are
// (eng-g01-t01-u01-read02.mp3), they live in media/audio/grade-N/<category>/
// rather than a flat tts/ dir, and no rule derives the name from the text.
//
// So the claim map is read out of the course data, which records each clip's
// path explicitly. That is a real claim map, not a guess: the data is what the
// app loads, so a path in the data is a clip the app will request. Verified in
// both directions on 2026-08-07 — 17,515 claimed across eight grades, and zero
// files on disk that no data file mentions.
//
// Why this module had to exist: without it, "what should be deployed" was
// answered by listing the local tree, and that answer is wrong in both
// directions. It reported 36 real clips missing from the CDN (true), and 562
// files as unclaimed extras (false — see below).
//
// THE 562. Every grade claims clips that are not in the local tree: 562 of them,
// all present on the CDN. They are not orphans and must not be pruned — the app
// requests them, and deleting them from storage would silence narration in
// production for content that currently works. The local tree, not the CDN, is
// the incomplete copy. Anything reasoning about English narration has to compare
// against this claim map; comparing against the local tree reads those 562 as
// garbage.
//
// Deliberately not exported: cyrb53, clean, textsForUnit. They are meaningless
// here, and a module that exported them would invite a caller to treat English
// like a hash-named subject and get silent nonsense back.

const fs = require("fs");
const path = require("path");

// The data writes clip paths relative to the course root, under several
// different keys (source, normal, slow, and any future one). Matching the path
// shape rather than the key names is what makes this complete: a new field
// holding a clip path is caught without this file being touched.
//
// The grade comes from the path itself, not from which grade's folder the JSON
// sits in, so a cross-grade reference is claimed where the file actually
// deploys. None exist today; this costs nothing and cannot be got wrong later.
const CLIP_RE = /\.\/media\/audio\/grade-(\d+)\/([a-z0-9-]+)\/([^"'\\]+\.mp3)/g;

function walkJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

// Only grade-*/data is scanned. Confirmed on 2026-08-07 that no .js or .html in
// the course or the shell names a clip — shell/subjects/english.js only rewrites
// the base URL — and that the JSON outside data/ (teacher-lecture-script.json
// under media/) belongs to the lecture player, not to narration.
function dataDirs(courseRoot) {
  return fs
    .readdirSync(courseRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^grade-\d+$/.test(e.name))
    .map((e) => path.join(courseRoot, e.name, "data"))
    .filter((d) => fs.existsSync(d));
}

// Map of "<category>/<file>.mp3" -> [grade, …], the same shape the hash-named
// subjects' hashGradeMap returns, so callers can treat the two alike.
function clipGradeMap(courseRoot) {
  const map = new Map();
  for (const dir of dataDirs(courseRoot)) {
    for (const file of walkJson(dir)) {
      for (const m of fs.readFileSync(file, "utf8").matchAll(CLIP_RE)) {
        const grade = Number(m[1]);
        const clip = `${m[2]}/${m[3]}`;
        if (!map.has(clip)) map.set(clip, new Set());
        map.get(clip).add(grade);
      }
    }
  }
  return new Map([...map].map(([clip, grades]) => [clip, [...grades].sort((a, b) => a - b)]));
}

function clipsForGrade(courseRoot, grade) {
  const out = new Set();
  for (const [clip, grades] of clipGradeMap(courseRoot)) if (grades.includes(grade)) out.add(clip);
  return out;
}

function gradesPresent(courseRoot) {
  const seen = new Set();
  for (const grades of clipGradeMap(courseRoot).values()) for (const g of grades) seen.add(g);
  return [...seen].sort((a, b) => a - b);
}

function categories(courseRoot) {
  const seen = new Set();
  for (const clip of clipGradeMap(courseRoot).keys()) seen.add(clip.split("/")[0]);
  return [...seen].sort();
}

// Where the clip deploys. English keeps one shared tree per grade rather than
// the per-subject fan-out the hash subjects use, but the remote shape matches:
// media/<subject>/gNN/audio/<category>/<file>.
function remoteFor(grade, clip) {
  return `media/english/g${String(grade).padStart(2, "0")}/audio/${clip}`;
}

function localFor(courseRoot, grade, clip) {
  return path.join(courseRoot, "media", "audio", `grade-${grade}`, ...clip.split("/"));
}

module.exports = { clipGradeMap, clipsForGrade, gradesPresent, categories, remoteFor, localFor };
