// Remove pre-generated course narration that no Listen button can reach.
//
// Clips are named cyrb53(button text), so any edit to the narrated text orphans
// the old file: it stays on disk, ships in the deploy, and is never requested.
// A content rebuild leaves hundreds behind. This lists what has been stranded
// and, with --delete, removes it.
//
// The reachable set comes from tools/lib/ehel-<subject>-narration.js, the same
// module the generator and uploader use, which check-ehel-audio-coverage.mjs
// holds to that subject's course-ui.js — so "unreachable here" means
// "unreachable in the app", not merely "unknown to a second guess at the rules".
//
// Deleting costs money to undo: every clip was paid for by the character. So
// this refuses to remove anything git cannot restore unless --force says
// otherwise, and reports before it acts.
//
// english is deliberately absent: its clips are named for their content
// (eng-g05-t01-u03-read01.mp3), not for a hash of their text, so editing a
// sentence leaves the old recording in place under the same name rather than
// stranding it under a dead one. Nothing here can see that — it is what
// check-english-audio-staleness.py exists for.
//
// Usage:
//   node tools/prune-ehel-course-audio.mjs <subject> [--delete] [--force]

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUBJECTS = ["science", "mathematics", "computing", "global-perspectives", "intensive-english"];
const subject = process.argv.slice(2).find((a) => SUBJECTS.includes(a));
if (!subject) {
  console.error(`Usage: node tools/prune-ehel-course-audio.mjs <${SUBJECTS.join("|")}> [--delete] [--force]`);
  process.exit(2);
}
const SUBJECT_ROOT = path.join(ROOT, "src", "prototypes", "ehel-academy", subject);
const TTS = path.join(SUBJECT_ROOT, "media", "audio", "tts");
// A narration lib is named for its course, which is not always the directory
// name — mathematics keeps ehel-math-narration.js and intensive-english keeps
// ehel-intensive-narration.js. Two exceptions read better as a lookup than as
// a nested ternary, and a third can be added without restructuring the line.
const NARRATION_LIB = { mathematics: "math", "intensive-english": "intensive" };
const narration =
  createRequire(import.meta.url)(`./lib/ehel-${NARRATION_LIB[subject] || subject}-narration.js`);

const remove = process.argv.includes("--delete");
const force = process.argv.includes("--force");

// The narration lib's own claim map is the reachable set — the same one the
// uploader fans out and the generator fills. This file used to rebuild the
// walk by hand from textsForUnit, which meant a claim added to the lib (the
// Wehel stock phrases) counted as orphaned here: a drifting second copy of
// the rules, in the one tool whose job is deleting things.
const reachable = new Set(narration.hashGradeMap(SUBJECT_ROOT).keys());

// A subject whose narration has not been generated yet has no cache directory
// at all. That is the normal first state for a newly added course, so it
// reports nothing to prune rather than dying on ENOENT.
if (!fs.existsSync(TTS)) {
  console.log(`${subject}: no narration cache at ${path.relative(ROOT, TTS)} — nothing to prune.`);
  process.exit(0);
}
const onDisk = fs.readdirSync(TTS).filter((f) => f.endsWith(".mp3"));
const orphans = onDisk.filter((f) => !reachable.has(path.basename(f, ".mp3")));

// Anything git already has can be restored for free; anything else is a clip
// that would have to be bought again.
const tracked = new Set(execFileSync("git", ["ls-files", "--", TTS], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter(Boolean).map((line) => path.basename(line)));
const recoverable = orphans.filter((f) => tracked.has(f));
const unrecoverable = orphans.filter((f) => !tracked.has(f));
const bytes = (list) => list.reduce((sum, f) => sum + fs.statSync(path.join(TTS, f)).size, 0);
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

console.log(`${subject}`);
console.log(`reachable Listen buttons : ${reachable.size}`);
console.log(`clips on disk            : ${onDisk.length}`);
console.log(`orphaned                 : ${orphans.length} (${mb(bytes(orphans))})`);
console.log(`  restorable from git    : ${recoverable.length}`);
console.log(`  not in git             : ${unrecoverable.length}`);

if (!orphans.length) {
  console.log("\nNothing to prune.");
  process.exit(0);
}
if (!remove) {
  console.log("\n(reporting only — pass --delete to remove)");
  for (const file of orphans.slice(0, 10)) console.log(`   ${file}`);
  if (orphans.length > 10) console.log(`   … and ${orphans.length - 10} more`);
  process.exit(0);
}
// Clear what git can restore for free; hold back what it cannot until someone
// says so explicitly. Refusing the whole batch over a handful of unrecoverable
// files would leave hundreds of dead clips shipping in the deploy.
const doomed = force ? orphans : recoverable;
let removed = 0;
for (const file of doomed) { fs.unlinkSync(path.join(TTS, file)); removed += 1; }
console.log(`\nDeleted ${removed} orphaned clip(s). ${onDisk.length - removed} remain.`);
if (!force && unrecoverable.length) {
  console.log(`\nHeld back ${unrecoverable.length} orphan(s) git cannot restore (${mb(bytes(unrecoverable))}).`);
  console.log("They are unreachable, so deleting loses nothing playable — but the clips were");
  console.log("paid for by the character, so this needs --force to say so on purpose.");
  for (const file of unrecoverable.slice(0, 10)) console.log(`   ${file}`);
  if (unrecoverable.length > 10) console.log(`   … and ${unrecoverable.length - 10} more`);
}
