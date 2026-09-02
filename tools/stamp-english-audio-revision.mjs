#!/usr/bin/env node
// Stamp `audioRevision` on a vocabulary group's clip descriptors, so the next
// generator run records them under NEW filenames.
//
//   node tools/stamp-english-audio-revision.mjs --grade 1 --unit 1 --group g1-u1-core --revision b [--meanings] [--dry]
//
// Why a tool rather than an edit: generate-ehel-english-audio.js DERIVES each
// clip's filename from its descriptor (`…-sentence-1b.mp3`, `…-meaningb.mp3`),
// and the descriptor is the only place that rename survives a regeneration. So
// re-recording a clip whose TEXT has not changed — a new delivery of the same
// script — has to start here: without the stamp the generator writes the new
// bytes over the old filename, and every edge node that already holds the old
// clip keeps serving it for a year (Bunny caches media by path, ignores query
// strings, and the key in .env cannot purge). That is the case this exists for;
// a text change on a hash-named subject renames itself, and English does not.
//
// Idempotent and explicit: a descriptor already at the requested revision is
// reported and left alone; a descriptor at a DIFFERENT revision is refused,
// because silently overwriting "b" with "c" would strand a rename somebody else
// meant. Writes nothing without the group matching at least one link.
//
// Serialises the way the generator does (2-space, LF, trailing newline) and
// re-escapes \uXXXX where the file already uses it, so the diff is the stamps.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = { grade: null, unit: null, group: null, revision: null, meanings: false, dry: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--grade") { opt.grade = Number(argv[++i]); continue; }
  if (a === "--unit") { opt.unit = Number(argv[++i]); continue; }
  if (a === "--group") { opt.group = argv[++i]; continue; }
  if (a === "--revision") { opt.revision = argv[++i]; continue; }
  if (a === "--meanings") { opt.meanings = true; continue; }
  if (a === "--dry") { opt.dry = true; continue; }
  console.error(`Unrecognised argument: ${a}`);
  process.exit(2);
}
if (!Number.isInteger(opt.grade) || opt.grade < 1 || opt.grade > 8) { console.error("--grade must be 1-8"); process.exit(2); }
if (!Number.isInteger(opt.unit) || opt.unit < 0) { console.error("--unit must be a unit number"); process.exit(2); }
if (!opt.group) { console.error("--group <vocabulary group id> is required"); process.exit(2); }
// A revision is a filename suffix. Letters only, so it can never collide with
// the `-sentence-N` index it sits beside, and never carry a path separator.
if (!/^[a-z]{1,3}$/.test(opt.revision || "")) { console.error("--revision must be 1-3 lowercase letters"); process.exit(2); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", `grade-${opt.grade}`, "data", "units", `unit-${opt.unit}.json`);
const raw = fs.readFileSync(file, "utf8");
const unit = JSON.parse(raw);

function serialise(doc) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) {
    text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}

const links = (unit.dictionaryLinks || []).filter((l) => l.groupId === opt.group);
if (!links.length) {
  console.error(`No dictionaryLinks in ${path.basename(file)} carry groupId "${opt.group}". Groups here: ${[...new Set((unit.dictionaryLinks || []).map((l) => l.groupId))].join(", ")}`);
  process.exit(1);
}

let stamped = 0, already = 0;
const refused = [];
const stamp = (descriptor, label) => {
  if (!descriptor) { refused.push(`${label}: no descriptor`); return; }
  const current = descriptor.audioRevision || "";
  if (current === opt.revision) { already += 1; return; }
  if (current) { refused.push(`${label}: already at revision "${current}"`); return; }
  descriptor.audioRevision = opt.revision;
  stamped += 1;
};

for (const link of links) {
  const sentences = link.practiceSentences || [];
  const audio = Array.isArray(link.sentenceAudio) ? link.sentenceAudio : [];
  sentences.forEach((_, i) => stamp(audio[i], `${link.vocabularyId}-sentence-${i + 1}`));
  if (opt.meanings) stamp(link.meaningAudio, `${link.vocabularyId}-meaning`);
}

console.log(`${path.basename(file)} · group ${opt.group} · ${links.length} word(s) · revision "${opt.revision}"${opt.meanings ? " · sentences + meanings" : " · sentences only"}`);
console.log(`  to stamp: ${stamped} | already stamped: ${already} | refused: ${refused.length}`);
for (const r of refused) console.log(`    ${r}`);
if (refused.length) { console.error("Refusing to write: resolve the descriptors above first."); process.exit(1); }
if (opt.dry) { console.log("  (dry run — nothing written)"); process.exit(0); }
if (!stamped) { console.log("  nothing to do"); process.exit(0); }
fs.writeFileSync(file, serialise(unit));
console.log(`  wrote ${path.relative(ROOT, file)}`);
// The vocabularyIds, one per line, for the generator's --only list and the
// audit's --only-file — so the three steps target the same words.
console.log(`  words: ${links.map((l) => l.vocabularyId).join(",")}`);
