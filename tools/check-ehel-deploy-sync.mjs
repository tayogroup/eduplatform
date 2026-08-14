// Check that a course's deployed CONTENT and deployed AUDIO describe the same
// text, so production cannot end up asking for clips that are not there.
//
// The two ship through different tools with different manifests —
// upload-content-to-bunny.js writes .bunny-content-manifest.json, and
// upload-media-to-bunny.js writes .bunny-upload-manifest.json — and nothing
// compared them. That let Mathematics reach a state where all 16,905 clips were
// uploaded and verified (coverage check passing, pruner reporting no orphans)
// while the unit JSON on the CDN was still the pre-repair text. A clip is named
// by a hash of its exact narration string, so production computed hashes from
// the old text, requested files the prune had just deleted, and dropped every
// Listen button onto the paid runtime endpoint. Neither side could see it: each
// was internally consistent.
//
// The APP tier is checked against content for the same reason, added after the
// join between those two broke production on 2026-08-12. See the long note above
// appState() — the short version is that neither tier was wrong on its own.
//
// What is checked, in the order it breaks:
//
//   content stale  — local unit text differs from what was uploaded, so the app
//                    serves old text and asks for old hashes
//   app vs content — one tier current and the other behind. Both behind is
//                    coherent; the split is what let a grading change require a
//                    question number the learner could not see
//   audio missing  — text is deployed but its clips never reached the CDN, so
//                    the button falls back to the paid endpoint
//   audio orphaned — clips on the CDN that no current text can request; wasted
//                    storage rather than breakage, so reported as a warning
//   nothing compared — files recorded as uploaded for a subject with no local
//                    content found to compare them against. Reported as
//                    unchecked, never as agreement
//
//   node tools/check-ehel-deploy-sync.mjs [mathematics|science|computing|global-perspectives|english|intensive-english]…
//
// All six subjects get the content and app checks. English and Intensive English
// skip the audio half and say so: their clips are named after the item id rather
// than a hash of the text, so staleness there needs a different shape.
//
// Exits non-zero if content is stale, the tiers are split, audio is missing, or a
// subject was passed without being compared. Skips a subject whose manifests do
// not exist yet — a fresh checkout has not deployed anything, and that is not a
// failure.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// The media manifest's shape is owned by tools/lib/upload-manifest.js. Reading
// it directly here is what broke this check when the format gained hashes.
const { readManifestPaths } = require("./lib/upload-manifest.js");
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const CONTENT_MANIFEST = path.join(ROOT, ".bunny-content-manifest.json");
const MEDIA_MANIFEST = path.join(ROOT, ".bunny-upload-manifest.json");
const APP_MANIFEST = path.join(ROOT, ".bunny-appver-manifest.json");
const APP_DEPLOYER = path.join(here, "deploy-app-version.js");

// Only the subjects whose audio is hash-named per Listen button. English names
// its clips after the item id, so a stale-text check there needs a different
// shape and is deliberately out of scope here.
const LIBS = {
  mathematics: "./lib/ehel-math-narration",
  science: "./lib/ehel-science-narration",
  computing: "./lib/ehel-computing-narration",
  "global-perspectives": "./lib/ehel-global-perspectives-narration",
};

// English and Intensive English have no narration library of this shape — their
// clips are named after the item id, not a hash of the text, so the audio half
// below cannot run for them and says so rather than pretending. The app and
// content halves need no such library, and leaving these two out of those would
// have hidden a real gap: on the first run of the app check, English was found
// sitting on v148 with newer code in the tree.
const AUDIO_EXEMPT = ["english", "intensive-english"];
const ALL = [...Object.keys(LIBS), ...AUDIO_EXEMPT];

const asked = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const unknown = asked.filter((s) => !ALL.includes(s));
if (unknown.length) { console.error(`unknown subject(s): ${unknown.join(", ")}`); process.exit(2); }
const subjects = asked.length ? asked : ALL;

if (!fs.existsSync(CONTENT_MANIFEST) || !fs.existsSync(MEDIA_MANIFEST)) {
  console.log("No deploy manifests present — nothing has been deployed from this checkout. Skipping.");
  process.exit(0);
}
const content = JSON.parse(fs.readFileSync(CONTENT_MANIFEST, "utf8"));
const media = new Set(readManifestPaths(MEDIA_MANIFEST));
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");
const gg = (g) => `g${String(g).padStart(2, "0")}`;

// The manifest holds the sha1 of the exact bytes uploaded, but git rewrites line
// endings on checkout under core.autocrlf, so a file git has merely touched
// hashes differently while saying precisely the same thing. Accept a match on
// either ending: a JSON file that differs only in CRLF vs LF parses identically
// and cannot change a single narration hash. Anything else really is a
// difference in the text.
function deployedMatches(remote, buf) {
  const recorded = content[remote];
  if (recorded === undefined) return "absent";
  if (recorded === sha1(buf)) return true;
  const text = buf.toString("utf8");
  const asLf = Buffer.from(text.replace(/\r\n/g, "\n"), "utf8");
  const asCrlf = Buffer.from(text.replace(/\r?\n/g, "\r\n"), "utf8");
  return recorded === sha1(asLf) || recorded === sha1(asCrlf);
}

// ── the app tier ──────────────────────────────────────────────────────────
//
// Content and audio were checked against each other; nothing checked either
// against the CODE. On 2026-08-12 Mathematics shipped app v141 while the
// content on the CDN was three weeks old, and the two were individually fine:
// the release verified, the content manifest was internally consistent, and
// this check passed. What broke was the JOIN. The new grading rule reads every
// number in a stored answer as a value the learner must produce, so against the
// unrepaired text `"1) 43, 45, 47."` asserted [1, 43, 45, 47] — the stray
// question number became a required answer. 557 items across 102 units began
// rejecting the correct answer, and in 16 units the fluency sprint could no
// longer reach its threshold, which leaves the section uncompletable and the
// grade shut.
//
// The lesson is not "content was stale" — this file already said that. It is
// that an app release can ACTIVATE a dependency on content. So what is checked
// is not each tier's freshness but their AGREEMENT: both current, or both
// behind, is coherent. One current and the other behind is the state that broke
// production, and it is the only combination that fails here.
//
// The uploaded bytes are not the file on disk — deploy-app-version.js rewrites
// each module's imports for the deployed layout — so the transform is sliced
// out of that script rather than copied. A copy would be free to drift from the
// deployer, and then this check would compare against bytes nobody ships.
const appManifest = fs.existsSync(APP_MANIFEST) ? JSON.parse(fs.readFileSync(APP_MANIFEST, "utf8")) : null;

function loadSubjectModuleTransform() {
  if (!fs.existsSync(APP_DEPLOYER)) return null;
  const src = fs.readFileSync(APP_DEPLOYER, "utf8");
  const from = src.indexOf("function shellSubjectModule(");
  if (from < 0) return null;
  const to = src.indexOf("\n}", from) + 2;
  if (to < 2) return null;
  // fs/path/EHEL are the only things it closes over.
  return new Function("fs", "path", "EHEL", `${src.slice(from, to)}\nreturn shellSubjectModule;`)(fs, path, EHEL);
}
const shellSubjectModule = loadSubjectModuleTransform();

// The release a subject is on, read from the manifest rather than the network so
// this stays an offline check. The highest recorded tag is the live one: a
// release writes v{TAG}/ and repoints index.html at it in the same run.
function liveTag(subject) {
  let best = null;
  for (const key of Object.keys(appManifest || {})) {
    const m = key.match(new RegExp(`^app/${subject}/v(\\d+)/`));
    if (m && (best === null || Number(m[1]) > best)) best = Number(m[1]);
  }
  return best === null ? null : `v${best}`;
}

// The lowest tag no subject has ever written, so nobody has to find out by
// fetching one.
//
// Asking the CDN "is v149 free?" is the single most expensive question in this
// repo. Edge Rule #1 puts a 1-year override on */app/*/v and Bunny applies it to
// a 404 as readily as a 200, so the probe CREATES a version path that answers
// 404 for a year — and deploy-app-version.js says so directly above --verify.
// Two sessions did it anyway on 2026-08-12, four times between them, against
// v147 through v149. Nothing has surfaced, but a poisoned POP stays poisoned and
// neither could prove otherwise, because there is no purge credential in .env.
//
// Deliberately GLOBAL, not per subject. A release names subjects and writes
// app/{subject}/{TAG}/ for each, and those paths are immutable — so a tag is
// only free if it is free EVERYWHERE. Mathematics sits on v141 and English on
// v149; suggesting v142 because maths has not used it would hand the operator a
// path English wrote months ago and cached for a year.
//
// Read from the manifest, so it only knows releases made from this checkout. A
// release from another machine would not be recorded, which is why this is
// printed as the floor to go above rather than the answer.
function nextFreeTag() {
  let highest = 0;
  for (const key of Object.keys(appManifest || {})) {
    const m = key.match(/^app\/[a-z-]+\/v(\d+)\//);
    if (m && Number(m[1]) > highest) highest = Number(m[1]);
  }
  return highest ? `v${highest + 1}` : null;
}

// Is the deployed subject module built from the code in the working tree?
function appState(subject) {
  if (!appManifest) return { known: false, why: "no .bunny-appver-manifest.json — nothing released from this checkout" };
  if (!shellSubjectModule) return { known: false, why: "could not read shellSubjectModule() out of deploy-app-version.js — re-point this check rather than dropping it" };
  const tag = liveTag(subject);
  if (!tag) return { known: false, why: "no versioned release recorded for this subject" };
  const remote = `app/${subject}/${tag}/course-ui.js`;
  const recorded = appManifest[remote];
  if (!recorded) return { known: false, why: `${remote} is not in the manifest` };
  const built = Buffer.from(shellSubjectModule(subject), "utf8");
  return { known: true, tag, stale: sha1(built) !== recorded };
}

let failed = false;

for (const subject of subjects) {
  const root = path.join(EHEL, subject);
  if (!fs.existsSync(root)) { console.log(`${subject}: not present, skipping`); continue; }
  console.log(`\n── ${subject} ──`);

  // 1. Is the local content what the CDN is serving? The remote path drops the
  //    "data/" segment, matching what the app requests via dataRootUrl.
  let contentOk = 0, contentStale = 0, contentNew = 0;
  const staleExamples = [];
  // Intensive English numbers its folders level-1…level-N, not grade-N, and the
  // uploader maps both onto gNN. Matching only "grade-" found no local files for
  // it, so the walk compared nothing and the subject passed — with 45 entries
  // sitting in the content manifest. A check that reports "0 in sync, 0 stale"
  // and calls it agreement is worse than one that is absent, because it is
  // counted as covered.
  for (const gradeDir of fs.readdirSync(root).filter((n) => /^(?:grade|level)-\d+$/.test(n))) {
    const g = Number(gradeDir.split("-")[1]);
    const dataDir = path.join(root, gradeDir, "data");
    if (!fs.existsSync(dataDir)) continue;
    const walk = (dir, rel) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const local = path.join(dir, entry.name);
        const childRel = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) { walk(local, childRel); continue; }
        if (!entry.name.endsWith(".json")) continue;
        const remote = `content/${subject}/${gg(g)}/${childRel}`;
        const verdict = deployedMatches(remote, fs.readFileSync(local));
        if (verdict === "absent") { contentNew += 1; if (staleExamples.length < 3) staleExamples.push(`never uploaded: ${remote}`); }
        else if (verdict === false) { contentStale += 1; if (staleExamples.length < 3) staleExamples.push(`stale: ${remote}`); }
        else contentOk += 1;
      }
    };
    walk(dataDir, "");
  }

  // 2. Does every clip the current text can request exist on the CDN? The
  //    uploader places a clip under each grade that claims it, so a hash is
  //    only satisfied when its own grade's path was uploaded.
  const narration = LIBS[subject] ? require(LIBS[subject]) : null;
  const map = narration ? narration.hashGradeMap(root) : new Map();
  let audioOk = 0, audioMissing = 0;
  const missingExamples = [];
  for (const [hash, grades] of map) {
    for (const g of grades) {
      const remote = `media/${subject}/${gg(g)}/audio/tts/${hash}.mp3`;
      if (media.has(remote)) audioOk += 1;
      else { audioMissing += 1; if (missingExamples.length < 3) missingExamples.push(remote); }
    }
  }

  // 3. Clips on the CDN that no current text claims. Wasted storage, not
  //    breakage, so it warns rather than fails.
  let orphaned = 0;
  const prefix = `media/${subject}/`;
  for (const remote of media) {
    if (!remote.startsWith(prefix) || !remote.includes("/audio/tts/")) continue;
    const m = remote.match(/\/audio\/tts\/([0-9a-f]+)\.mp3$/);
    const g = Number((remote.match(/\/g(\d{2})\//) || [])[1]);
    if (!m || !g) continue;
    const grades = map.get(m[1]);
    if (!grades || !grades.has(g)) orphaned += 1;
  }

  // 4. Do the app tier and the content tier describe the same source state?
  const app = appState(subject);
  const contentBehind = contentStale + contentNew > 0;

  // Backstop for the same trap in general: if the manifest says files were
  // uploaded for this subject but the walk found none locally, the comparison
  // examined nothing and its silence means nothing.
  const uploadedHere = Object.keys(content).filter((k) => k.startsWith(`content/${subject}/`)).length;
  const vacuous = uploadedHere > 0 && contentOk + contentStale + contentNew === 0;

  console.log(`  content  : ${contentOk} in sync, ${contentStale} stale, ${contentNew} never uploaded`);
  console.log(`  app      : ${app.known ? `${app.tag} ${app.stale ? "behind the working tree" : "matches the working tree"}` : `not checked — ${app.why}`}`);
  // Naming the tool that DOES cover it, not just the reason this one cannot.
  // Both audio incidents this week were English, and a reader who sees the tick
  // below can reasonably take it for a statement about clips unless the line
  // says where to go instead.
  const AUDIO_ELSEWHERE = "python tools/check-english-audio-staleness.py";
  console.log(`  audio    : ${narration
    ? `${audioOk} deployed, ${audioMissing} missing`
    : `not checked here — clips are named by item id, not by a hash of the text. Run: ${AUDIO_ELSEWHERE}`}`);
  if (narration) console.log(`  orphaned : ${orphaned} clip(s) on the CDN no current text can request`);
  for (const e of staleExamples) console.log(`    ${e}`);
  for (const e of missingExamples) console.log(`    missing: ${e}`);

  if (vacuous) {
    console.error(`  ✗ ${uploadedHere} file(s) are recorded as uploaded for ${subject} but no local content was found to compare.`);
    console.error("    The content comparison examined nothing — treat this as unchecked, not as agreement.");
    failed = true;
  }
  if (contentStale || contentNew) {
    console.error(`  ✗ content is behind — run: node tools/upload-content-to-bunny.js ${subject}`);
    failed = true;
  }
  if (audioMissing) {
    console.error(`  ✗ audio is behind — run: node tools/upload-media-to-bunny.js ${subject}`);
    failed = true;
  }
  // Both behind is coherent — nothing has been released since the working tree
  // moved, and a learner sees an older but self-consistent course. It is the
  // SPLIT that is dangerous, so only the split is called out here.
  if (app.known && app.stale !== contentBehind) {
    if (contentBehind) {
      console.error(`  ✗ the app tier (${app.tag}) was released from newer code than the content on the CDN.`);
      console.error("    This is the 2026-08-12 shape: an app change can make scoring depend on content it never shipped with.");
      console.error(`    Fix by catching the content up: node tools/upload-content-to-bunny.js ${subject}`);
    } else {
      console.error(`  ✗ the content on the CDN is newer than the app tier (${app.tag}).`);
      console.error("    Content written against newer app behaviour will not get it, and the app cannot tell.");
      // --shell is not optional. Every subject runs from shell/subjects/ now, so
      // without it course-ui.js ships as the ~1.2 KB loader stub instead of the
      // ~150 KB app, and --verify still passes because it confirms the bytes
      // arrived rather than that they are the right bytes. This line used to
      // omit it, so following the tool's own advice produced a broken release.
      console.error(`    Fix by releasing the app: node tools/deploy-app-version.js <tag> --shell --verify ${subject}`);
    }
    failed = true;
  }
  if (!contentStale && !contentNew && !audioMissing && !(app.known && app.stale !== contentBehind)) {
    console.log(`  ✓ app${app.known ? ` (${app.tag})` : ""}, content${narration ? ", audio" : ""} — all in step${narration ? "" : " (audio not covered by this tick)"}`);
  }
}

const free = nextFreeTag();
if (free) {
  console.log(`\nnext free release tag: ${free}  (nothing has written it; use this instead of asking the CDN,`);
  console.log("                       which caches a 404 on a version path for a year and cannot be purged)");
}

if (failed) {
  console.error("\nThe deployed tiers disagree about what the course is.");
  console.error("  content vs audio — the app asks for clips that are not there and falls back to the paid runtime endpoint.");
  console.error("  app vs content   — the code and the text it reads were released from different states, which is how a");
  console.error("                     grading change came to require a question number the learner could not see.");
  process.exit(1);
}
console.log("\n✓ every checked subject has its app, content and audio in step");
