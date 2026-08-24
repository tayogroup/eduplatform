#!/usr/bin/env node
// Drop entries from english/media/audio/.narration-index.json whose mp3 no
// longer exists on disk.
//
// The index maps a clip path to a hash of the text it narrates, and it is what
// check-english-audio-staleness.py reads to decide whether a recording predates
// the words it says. A repair that DELETES a clip — because the meaning was
// wrong, or the word was taught twice — leaves the entry behind, so the index
// asserts a hash for a file nobody can play.
//
// Three of those existed when this was written, from two repairs on 2026-08-24:
//
//   glossary/32-connoisseur-meaning.mp3   55c0d2ed7, invented meaning removed
//   glossary/33-conclusion.mp3            68406ee79, the word was taught twice
//   glossary/33-conclusion-meaning.mp3    68406ee79
//
// Both repairs were right to delete the clips; English names its clips for
// their content slot rather than a hash of their text, so leaving a stale mp3
// in place means the learner reads one meaning and hears another, and
// generate-ehel-english-audio.js REUSES any mp3 over 1 KB and would re-assert
// it. Removing the index entry is the other half of that, and neither repair
// did it.
//
// WHY LINES AND NOT JSON.stringify: the file is 82,041 entries, LF-only, pure
// ASCII, one `  "path": "hash",` per line. Re-serialising it would rewrite every
// line to satisfy a change of three, and any difference in key order, escaping
// or indent would land as a 6.5 MB diff nobody can review. So the edit is made
// on the lines and the result is parsed afterwards to prove it is still valid
// JSON with exactly the expected keys removed.
//
// Idempotent: a second run finds nothing dangling and writes nothing.
//
// A SECOND ORPHAN CLASS, `--unclaimed`: the mp3 still exists, but no descriptor
// in any grade references that path any more, so nothing can play it and the
// index is asserting a fingerprint for unreachable audio. All 14 found on
// 2026-08-24 were the same shape — a re-record that minted a NEW filename by
// appending "b" (…-grammar02-practiceb.mp3) and left the original behind:
//
//   index holds  media/audio/grade-6/grammar/eng-g06-t03-u10-grammar02-practice.mp3
//   descriptor   ./media/audio/grade-6/grammar/eng-g06-t03-u10-grammar02-practiceb.mp3
//
// Renaming on a re-record is the right move where the filename is not
// load-bearing — a changed URL is what defeats the year-long browser cache that
// a same-name re-render cannot — so these are the residue of a correct repair,
// not a mistake. The mp3s stay: this tool only ever edits the index. They are
// reported with their sizes so the decision to delete them can be taken
// separately and deliberately.
//
// Kept as a separate flag rather than folded into the default, because the two
// classes differ in one way that matters: a dangling entry (the default) is
// unambiguously wrong, while an unclaimed one is the only surviving record of
// what its mp3 SAYS. Dropping it means that if the path is ever referenced
// again, generate-ehel-english-audio.js finds the file on disk with no
// fingerprint, so `stale` is false, so it REUSES it — the silent-stale-audio
// path. Cheap here because every one of the 14 has a live "b" replacement, but
// it is why this is opt-in.
//
// Usage: node tools/repair-english-narration-index-orphans.mjs [--unclaimed] [--write]
//        (default is a dry run, and dangling-only; --write applies)
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_ROOT = path.join(ROOT, "src/prototypes/ehel-academy/english");
const INDEX = path.join(AUDIO_ROOT, "media/audio/.narration-index.json");
const WRITE = process.argv.includes("--write");
const UNCLAIMED = process.argv.includes("--unclaimed");

const raw = readFileSync(INDEX, "utf8");
const before = JSON.parse(raw);
const keys = Object.keys(before);

const dangling = keys.filter((key) => !existsSync(path.join(AUDIO_ROOT, key)));

console.log(`.narration-index.json: ${keys.length} entries, ${dangling.length} pointing at a file that does not exist`);
for (const key of dangling) console.log(`   orphan  ${key}`);

// --unclaimed: every clip path any descriptor names, across all eight grades.
// Matching the `"./media/audio/….mp3"` form the descriptors actually use — a
// looser match on the basename is wrong here, because …-practice.mp3 is a
// substring of …-practiceb.mp3 and would report every superseded clip as live.
// That is not hypothetical: it is what made the first run of this look like a
// false positive.
function claimedPaths() {
  const claimed = new Set();
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) {
        for (const m of readFileSync(full, "utf8").matchAll(/"\.\/(media\/audio\/[^"]+\.mp3)"/g)) claimed.add(m[1]);
      }
    }
  };
  for (let grade = 1; grade <= 8; grade += 1) walk(path.join(AUDIO_ROOT, `grade-${grade}`, "data"));
  return claimed;
}

let unclaimed = [];
if (UNCLAIMED) {
  const claimed = claimedPaths();
  // A claim set that came back empty would report the whole index as orphaned
  // and delete 82,000 entries. Refuse rather than trust it.
  if (claimed.size < 1000) {
    console.error(`✗ only ${claimed.size} claimed clip path(s) found — the descriptor scan is not working; refusing to run`);
    process.exit(1);
  }
  unclaimed = keys.filter((key) => !claimed.has(key) && existsSync(path.join(AUDIO_ROOT, key)));
  console.log(`\n${claimed.size} clip paths are claimed by a descriptor; ${unclaimed.length} index entr(ies) name a clip that exists but nothing references`);
  let bytes = 0;
  for (const key of unclaimed) {
    const size = statSync(path.join(AUDIO_ROOT, key)).size;
    bytes += size;
    const replacement = key.replace(/\.mp3$/, "b.mp3");
    console.log(`   unclaimed  ${String((size / 1024).toFixed(0)).padStart(5)} KB  ${key}${claimed.has(replacement) ? "   (superseded by its \"b\" re-record)" : "   (NO replacement found — look before removing)"}`);
  }
  if (unclaimed.length) console.log(`   the mp3s themselves are ${(bytes / 1048576).toFixed(1)} MB and are NOT touched by this tool`);
}

const targets = [...dangling, ...unclaimed];
if (!targets.length) {
  console.log("✓ nothing to do");
  process.exit(0);
}

// Drop the whole line for each orphan. Every entry occupies exactly one line;
// assert that before touching anything, because a reformatted index would make
// line-level editing silently wrong.
const lines = raw.split("\n");
const orphanSet = new Set(targets);
const keep = [];
let removed = 0;
for (const line of lines) {
  const m = line.match(/^ {2}"((?:[^"\\]|\\.)*)": "[0-9a-f]+",?$/);
  if (m && orphanSet.has(JSON.parse(`"${m[1]}"`))) { removed += 1; continue; }
  keep.push(line);
}
if (removed !== targets.length) {
  console.error(`✗ matched ${removed} line(s) for ${targets.length} orphan(s) — the index is not one entry per line as assumed; not writing`);
  process.exit(1);
}

// If the last entry was removed the new last entry must lose its trailing
// comma, or the result is not JSON.
for (let i = keep.length - 1; i >= 0; i -= 1) {
  if (keep[i].trim() === "}" || keep[i].trim() === "") continue;
  keep[i] = keep[i].replace(/,$/, "");
  break;
}

const next = keep.join("\n");

// Prove it before writing: still valid JSON, and exactly the orphans gone.
let after;
try {
  after = JSON.parse(next);
} catch (error) {
  console.error(`✗ the edited index does not parse (${error.message}) — not writing`);
  process.exit(1);
}
const lost = keys.filter((k) => !(k in after));
const gained = Object.keys(after).filter((k) => !(k in before));
const changed = Object.keys(after).filter((k) => after[k] !== before[k]);
if (gained.length || changed.length || lost.length !== targets.length || lost.some((k) => !orphanSet.has(k))) {
  console.error(`✗ refusing to write: removed ${lost.length} (expected ${targets.length}), added ${gained.length}, altered ${changed.length}`);
  process.exit(1);
}

if (!WRITE) {
  console.log(`\n(dry run — would remove ${targets.length} entry/entries, leaving ${Object.keys(after).length}. Pass --write to apply.)`);
  process.exit(0);
}

writeFileSync(INDEX, next, "utf8");
console.log(`\n✓ removed ${targets.length} orphan entry/entries; ${Object.keys(after).length} remain`);
