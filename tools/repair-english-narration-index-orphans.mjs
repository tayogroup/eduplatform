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
// Usage: node tools/repair-english-narration-index-orphans.mjs [--write]
//        (default is a dry run; --write applies)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_ROOT = path.join(ROOT, "src/prototypes/ehel-academy/english");
const INDEX = path.join(AUDIO_ROOT, "media/audio/.narration-index.json");
const WRITE = process.argv.includes("--write");

const raw = readFileSync(INDEX, "utf8");
const before = JSON.parse(raw);
const keys = Object.keys(before);

const dangling = keys.filter((key) => !existsSync(path.join(AUDIO_ROOT, key)));

console.log(`.narration-index.json: ${keys.length} entries, ${dangling.length} pointing at a file that does not exist`);
for (const key of dangling) console.log(`   orphan  ${key}`);

if (!dangling.length) {
  console.log("✓ nothing to do");
  process.exit(0);
}

// Drop the whole line for each orphan. Every entry occupies exactly one line;
// assert that before touching anything, because a reformatted index would make
// line-level editing silently wrong.
const lines = raw.split("\n");
const orphanSet = new Set(dangling);
const keep = [];
let removed = 0;
for (const line of lines) {
  const m = line.match(/^ {2}"((?:[^"\\]|\\.)*)": "[0-9a-f]+",?$/);
  if (m && orphanSet.has(JSON.parse(`"${m[1]}"`))) { removed += 1; continue; }
  keep.push(line);
}
if (removed !== dangling.length) {
  console.error(`✗ matched ${removed} line(s) for ${dangling.length} orphan(s) — the index is not one entry per line as assumed; not writing`);
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
if (gained.length || changed.length || lost.length !== dangling.length || lost.some((k) => !orphanSet.has(k))) {
  console.error(`✗ refusing to write: removed ${lost.length} (expected ${dangling.length}), added ${gained.length}, altered ${changed.length}`);
  process.exit(1);
}

if (!WRITE) {
  console.log(`\n(dry run — would remove ${dangling.length} entry/entries, leaving ${Object.keys(after).length}. Pass --write to apply.)`);
  process.exit(0);
}

writeFileSync(INDEX, next, "utf8");
console.log(`\n✓ removed ${dangling.length} orphan entry/entries; ${Object.keys(after).length} remain`);
