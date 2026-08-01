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
// Usage:
//   node tools/prune-ehel-course-audio.mjs <science|mathematics|computing> [--delete] [--force]

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUBJECTS = ["science", "mathematics", "computing"];
const subject = process.argv.slice(2).find((a) => SUBJECTS.includes(a));
if (!subject) {
  console.error(`Usage: node tools/prune-ehel-course-audio.mjs <${SUBJECTS.join("|")}> [--delete] [--force]`);
  process.exit(2);
}
const SUBJECT_ROOT = path.join(ROOT, "src", "prototypes", "ehel-academy", subject);
const TTS = path.join(SUBJECT_ROOT, "media", "audio", "tts");
const { CATEGORIES, textsForUnit, textsForCapstone, cyrb53, clean, MIN_CHARS } =
  createRequire(import.meta.url)(`./lib/ehel-${subject === "mathematics" ? "math" : subject}-narration.js`);

const remove = process.argv.includes("--delete");
const force = process.argv.includes("--force");

const reachable = new Set();
for (const entry of fs.readdirSync(SUBJECT_ROOT)) {
  const match = entry.match(/^grade-(\d+)$/);
  if (!match) continue;
  const data = path.join(SUBJECT_ROOT, entry, "data");
  const unitDir = path.join(data, "units");
  const add = (raw) => {
    const text = clean(raw);
    if (text.length >= MIN_CHARS) reachable.add(cyrb53(text));
  };
  if (fs.existsSync(unitDir)) {
    for (const file of fs.readdirSync(unitDir).filter((f) => f.endsWith(".json"))) {
      const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
      for (const category of CATEGORIES) textsForUnit(unit, category).forEach(add);
    }
  }
  const capstoneFile = path.join(data, "grade-capstone.json");
  if (fs.existsSync(capstoneFile)) {
    const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
    for (const category of CATEGORIES) textsForCapstone(capstone, category).forEach(add);
  }
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
