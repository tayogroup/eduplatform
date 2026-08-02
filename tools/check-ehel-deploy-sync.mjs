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
// Three things are checked, in the order they break:
//
//   content stale  — local unit text differs from what was uploaded, so the app
//                    serves old text and asks for old hashes
//   audio missing  — text is deployed but its clips never reached the CDN, so
//                    the button falls back to the paid endpoint
//   audio orphaned — clips on the CDN that no current text can request; wasted
//                    storage rather than breakage, so reported as a warning
//
//   node tools/check-ehel-deploy-sync.mjs [mathematics|science|computing]…
//
// Exits non-zero if content is stale or audio is missing. Skips a subject whose
// manifests do not exist yet — a fresh checkout has not deployed anything, and
// that is not a failure.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const CONTENT_MANIFEST = path.join(ROOT, ".bunny-content-manifest.json");
const MEDIA_MANIFEST = path.join(ROOT, ".bunny-upload-manifest.json");

// Only the subjects whose audio is hash-named per Listen button. English names
// its clips after the item id, so a stale-text check there needs a different
// shape and is deliberately out of scope here.
const LIBS = {
  mathematics: "./lib/ehel-math-narration",
  science: "./lib/ehel-science-narration",
  computing: "./lib/ehel-computing-narration",
};

const asked = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const unknown = asked.filter((s) => !LIBS[s]);
if (unknown.length) { console.error(`unknown subject(s): ${unknown.join(", ")}`); process.exit(2); }
const subjects = asked.length ? asked : Object.keys(LIBS);

if (!fs.existsSync(CONTENT_MANIFEST) || !fs.existsSync(MEDIA_MANIFEST)) {
  console.log("No deploy manifests present — nothing has been deployed from this checkout. Skipping.");
  process.exit(0);
}
const content = JSON.parse(fs.readFileSync(CONTENT_MANIFEST, "utf8"));
const media = new Set(JSON.parse(fs.readFileSync(MEDIA_MANIFEST, "utf8")));
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

let failed = false;

for (const subject of subjects) {
  const root = path.join(EHEL, subject);
  if (!fs.existsSync(root)) { console.log(`${subject}: not present, skipping`); continue; }
  console.log(`\n── ${subject} ──`);

  // 1. Is the local content what the CDN is serving? The remote path drops the
  //    "data/" segment, matching what the app requests via dataRootUrl.
  let contentOk = 0, contentStale = 0, contentNew = 0;
  const staleExamples = [];
  for (const gradeDir of fs.readdirSync(root).filter((n) => /^grade-\d+$/.test(n))) {
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
  const narration = require(LIBS[subject]);
  const map = narration.hashGradeMap(root);
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

  console.log(`  content  : ${contentOk} in sync, ${contentStale} stale, ${contentNew} never uploaded`);
  console.log(`  audio    : ${audioOk} deployed, ${audioMissing} missing`);
  console.log(`  orphaned : ${orphaned} clip(s) on the CDN no current text can request`);
  for (const e of staleExamples) console.log(`    ${e}`);
  for (const e of missingExamples) console.log(`    missing: ${e}`);

  if (contentStale || contentNew) {
    console.error(`  ✗ content is behind — run: node tools/upload-content-to-bunny.js ${subject}`);
    failed = true;
  }
  if (audioMissing) {
    console.error(`  ✗ audio is behind — run: node tools/upload-media-to-bunny.js ${subject}`);
    failed = true;
  }
  if (!contentStale && !contentNew && !audioMissing) console.log("  ✓ content and audio describe the same text");
}

if (failed) {
  console.error("\nDeployed content and audio disagree. Whichever side is behind, the app will ask for clips that are not there and fall back to the paid runtime endpoint.");
  process.exit(1);
}
console.log("\n✓ every checked subject has content and audio in step");
