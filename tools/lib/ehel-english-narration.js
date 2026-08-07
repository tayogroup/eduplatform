// What English narration exists, and which grade can ask for it.
//
// Every other subject answers this from a hash: the clip is named cyrb53(button
// text), so the narration module can regenerate the whole reachable set from the
// content. English cannot. Its clips are named for what they are
// (eng-g01-t01-u01-read02.mp3), they live in media/audio/grade-N/<category>/
// rather than a flat tts/ dir, and no rule derives the name from the text.
//
// So the claim map is read out of the course data, which records each clip in a
// descriptor holding its path. That is a real claim map: the data is what the
// app loads, so a live descriptor is a clip the app will request.
//
// A DESCRIPTOR IS ONLY A CLAIM IF available !== false. This is the whole
// subtlety of the file. c21fa23c9 deleted 562 clips that ElevenLabs had
// improvised from fill-in-the-blank frames — handed "This is a ___.", it
// invented syllables, and children pressing Listen heard gibberish. The clips
// were deleted and their descriptors marked
//
//     "available": false,
//     "status": "Refused - the script is a fill-in-the-blank frame; …"
//
// but the descriptors were deliberately KEPT, because narration is still owed
// there: when someone writes a spoken form of the frame, the descriptor is where
// that work resumes. The renderers read `available` to decide whether to draw a
// Listen button at all, so a suppressed descriptor is not a claim — no button
// exists and the app never requests the file.
//
// Reading the path without reading `available` therefore over-claims by exactly
// those 562, which inverts the meaning of an audit: the copies still sitting on
// the CDN look load-bearing when they are the discarded gibberish. An earlier
// draft of this module did exactly that. Honouring `available` reconciles the
// claim map against the local tree exactly — 16,953 clips, zero unclaimed files
// on disk, zero claims without a file — in all eight grades.
//
// The test is `available !== false`, not `=== true`, on purpose. Both give the
// same answer today (every descriptor carries an explicit boolean). If a future
// descriptor omits the field, the permissive form claims it, and an unuploaded
// clip is then reported as missing — loud and wrong-way-safe. The strict form
// would drop it silently, which is the exact failure class the deployment
// auditor exists to catch.
//
// Deliberately not exported: cyrb53, clean, textsForUnit. They are meaningless
// here, and a module that exported them would invite a caller to treat English
// like a hash-named subject and get silent nonsense back.

const fs = require("fs");
const path = require("path");

// A descriptor writes its path relative to the course root. The grade is taken
// from the path itself rather than from which grade's folder the JSON sits in,
// so a cross-grade reference is claimed where the file actually deploys. None
// exist today; this costs nothing and cannot be got wrong later.
const CLIP_RE = /^\.\/media\/audio\/grade-(\d+)\/([a-z0-9-]+)\/(.+\.mp3)$/;

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

// A descriptor is any object holding at least one clip path. Its `available`
// governs every path it holds: a vocabulary descriptor carries source, normal
// and slow, which are the same recording at different speeds and are drawn (or
// not drawn) together.
//
// The structure is walked rather than the text regexed. Text matching cannot see
// which object a path belongs to, so it cannot see the `available` that governs
// it — which is precisely how the 562 came to be miscounted.
function eachDescriptor(node, visit) {
  if (Array.isArray(node)) {
    for (const v of node) eachDescriptor(v, visit);
    return;
  }
  if (!node || typeof node !== "object") return;
  const clips = [];
  for (const v of Object.values(node)) {
    if (typeof v !== "string") continue;
    const m = CLIP_RE.exec(v);
    if (m) clips.push({ grade: Number(m[1]), clip: `${m[2]}/${m[3]}` });
  }
  if (clips.length) visit(node, clips);
  for (const v of Object.values(node)) eachDescriptor(v, visit);
}

// Map of "<category>/<file>.mp3" -> [grade, …], the same shape the hash-named
// subjects' hashGradeMap returns, so callers can treat the two alike.
function clipGradeMap(courseRoot) {
  const map = new Map();
  for (const dir of dataDirs(courseRoot)) {
    for (const file of walkJson(dir)) {
      let data;
      try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
      catch (e) { throw new Error(`${path.relative(courseRoot, file)}: ${e.message}`); }
      eachDescriptor(data, (descriptor, clips) => {
        if (descriptor.available === false) return; // suppressed: no Listen button is drawn
        for (const { grade, clip } of clips) {
          if (!map.has(clip)) map.set(clip, new Set());
          map.get(clip).add(grade);
        }
      });
    }
  }
  return new Map([...map].map(([clip, grades]) => [clip, [...grades].sort((a, b) => a - b)]));
}

// Descriptors that name a clip the app will not play, with the reason recorded.
// Not orphans to be swept: they are where narration resumes when a spoken form
// of each frame is written. Exposed so an auditor can tell "owed" from "stale"
// instead of guessing from a filename.
// Deduplicated by (grade, clip): a descriptor names the same recording under
// source, normal and slow, so the raw walk yields 1,398 entries for 562 clips
// and any count taken off it would be inflated nearly threefold.
function suppressed(courseRoot) {
  const seen = new Map();
  for (const dir of dataDirs(courseRoot)) {
    for (const file of walkJson(dir)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      eachDescriptor(data, (descriptor, clips) => {
        if (descriptor.available !== false) return;
        for (const { grade, clip } of clips) {
          const key = `${grade}:${clip}`;
          if (!seen.has(key)) seen.set(key, { grade, clip, status: descriptor.status ?? null });
        }
      });
    }
  }
  return [...seen.values()];
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

module.exports = { clipGradeMap, clipsForGrade, suppressed, gradesPresent, categories, remoteFor, localFor };
