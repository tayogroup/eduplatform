#!/usr/bin/env node
// Every word a course teaches, beside the picture `wordPicture()` returns for
// it AND the meaning the unit actually authored.
//
// WHY THIS EXISTS. Nothing gates the word-picture map. `check-ehel-deploy-sync`
// and `deploy-app-version` name the file, and neither looks inside it — so a
// picture bound to the wrong SENSE is invisible to every check in the repo, and
// stays invisible for as long as nobody prints it beside the content.
//
// The failure this was written for: `GRADE_WORD_PICTURES.ien2` held
// `platform: "💻"`, correct while Intensive English Level 2 was a B1 course
// teaching the publishing sense. Level 2 was rebuilt on Cambridge 0057 in
// September 2026 and now teaches `platform` beside departure, arrival and
// luggage — where the shared map's 🚉 was already right. The override was
// replacing a correct picture with a laptop beside a railway platform. Six
// sibling entries had gone quietly dead at the same moment, naming words the
// rebuilt level no longer teaches.
//
// So: **a picture override is a claim about a sense, and a sense belongs to a
// course that can be replaced underneath it.** Run this whenever a level or a
// grade's vocabulary is rebuilt, not only when the shared map is edited.
//
// READ THE MEANING COLUMN, not the word column. The word alone cannot tell you
// which sense is being taught, which is the whole reason the defect survives a
// reading of the map. Seven further wrong senses were found this way in one
// pass: a jar of preserve for a traffic jam, a stop sign for a block of flats
// and again for water freezing, a traffic light for a phone signal, two people
// for assembling parts, theatre masks for the place something happened, and a
// heartbeat for a pump pushing water.
//
//   node tools/audit-word-pictures.mjs intensive-english 2
//   node tools/audit-word-pictures.mjs english 3
//   node tools/audit-word-pictures.mjs intensive-english 2 --all   # blanks too
//
// It reports, it never fails a build: whether a picture is the right sense is a
// judgement, and a script that guessed would be wrong in both directions.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const [subject, stage] = argv.filter((a) => !a.startsWith("--"));
const unknown = [...flags].filter((f) => f !== "--all");
if (unknown.length) {
  // An unrecognised flag silently doing the default is how a typo becomes a
  // clean run that checked something other than what was asked for.
  console.error(`unrecognised argument: ${unknown.join(", ")}`);
  process.exit(2);
}
if (!subject || !stage) {
  console.error("usage: node tools/audit-word-pictures.mjs <subject> <stage-or-level> [--all]");
  process.exit(2);
}

// Intensive English keys its overrides off "ien1"/"ien2" rather than a number,
// because a level is not a grade and nothing about their vocabulary lines up.
const dirFor = subject === "intensive-english" ? `level-${stage}` : `grade-${stage}`;
const keyFor = subject === "intensive-english" ? `ien${stage}` : Number(stage);
const unitsDir = path.join(EHEL, subject, dirFor, "data", "units");
if (!fs.existsSync(unitsDir)) {
  console.error(`no units at ${path.relative(ROOT, unitsDir)}`);
  process.exit(2);
}

const map = await import(url.pathToFileURL(path.join(EHEL, "shell", "subjects", "word-pictures.js")).href);

const rows = [];
const files = fs.readdirSync(unitsDir).filter((n) => /^unit--?\d+\.json$/.test(n));
for (const name of files) {
  const unit = JSON.parse(fs.readFileSync(path.join(unitsDir, name), "utf8"));
  for (const link of unit.dictionaryLinks || []) {
    const word = link.masterWord || link.vocabularyId || "";
    rows.push({
      unit: unit.unit?.unitNo ?? 0,
      word,
      pos: link.partOfSpeech || "",
      picture: map.wordPicture(word, keyFor) || "",
      meaning: (link.childMeaning || "").replace(/\s+/g, " ").trim(),
    });
  }
}
if (!rows.length) {
  // A run that finds nothing and prints a tick is the failure this file is about.
  console.error(`${path.relative(ROOT, unitsDir)} holds ${files.length} unit file(s) and no dictionary entries — nothing was compared.`);
  process.exit(2);
}

rows.sort((a, b) => a.unit - b.unit || a.word.localeCompare(b.word));
const shown = flags.has("--all") ? rows : rows.filter((r) => r.picture);
const pictured = rows.filter((r) => r.picture).length;

console.log(`${subject} ${dirFor}: ${rows.length} words, ${pictured} pictured (${Math.round((pictured / rows.length) * 100)}%)`);
console.log(`overrides on ${keyFor}: ${Object.keys(map.GRADE_WORD_PICTURES[keyFor] || {}).length}\n`);
console.log(`${"unit".padEnd(5)} ${"pic".padEnd(4)} ${"word".padEnd(18)} ${"part".padEnd(12)} meaning as the unit authored it`);
for (const r of shown) {
  console.log(`${String(r.unit).padStart(4)}  ${(r.picture || "·").padEnd(3)} ${r.word.padEnd(18)} ${r.pos.padEnd(12)} ${r.meaning.slice(0, 86)}`);
}

// An override naming a word the course no longer teaches is the cheap half of
// the audit and the only half a machine can settle, so it is stated outright.
const taught = new Set(rows.map((r) => r.word.toLowerCase()));
const dead = Object.keys(map.GRADE_WORD_PICTURES[keyFor] || {}).filter((w) => !taught.has(w.toLowerCase()));
if (dead.length) {
  console.log(`\n${dead.length} override(s) name no word this course teaches — written for content that has been replaced:`);
  console.log(`  ${dead.join(", ")}`);
  console.log("  Dead ones are harmless. Check whether any SURVIVING override still means what it did.");
} else {
  console.log("\nevery override names a word this course teaches.");
}
console.log("\nThe senses are yours to judge; read the meaning column, not the word column.");
