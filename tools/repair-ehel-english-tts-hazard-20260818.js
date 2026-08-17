#!/usr/bin/env node
// The transcription audit on today's re-recorded clips flagged
// eng-g07-t02-u04-grammar03-practice as "different sentence" (similarity 0.58).
// It wasn't a false positive: the clip's audio is genuinely garbled, confirmed
// by direct listen-through of several independent ElevenLabs generations of the
// SAME text, each hallucinating differently — foreign characters, invented
// sentences, dropped/duplicated answer-key items. One suspect was the hyphenated
// grammar term "by-phrase" (fixed below, applied everywhere it appears — 7
// fields across 4 units), which measurably helped 5 of 7 affected clips but did
// not fully fix this one: 12 regenerations of the unbroken text still produced
// visible garbage more often than not, and a "passing" similarity SCORE was not
// reliable evidence either — one 0.86 take still had "考慮電話" and invented
// sentences buried in the middle, just proportionally small enough not to drag
// the word-level ratio below the floor. Full transcripts were read by hand, not
// scored, before judging any of this.
//
// Second suspect: the answer key is six near-identical passive-voice items
// ("N) X is/are Yed (by Z).") run together with no pause between them — extreme
// sentence-template repetition is a documented trigger for autoregressive TTS
// repetition-collapse, and this field is the most uniformly repetitive of the
// seven (its sibling grammar02, which passed first try, breaks its own answer
// key with a free-response Part B). This second edit inserts a line break after
// each of the last three answer-key items, giving the model a reset point.
//
// Idempotent; loud on a moved source. Usage: node tools/repair-ehel-english-tts-hazard-20260818.js [--dry]

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

const files = new Map();
function load(rel) {
  if (!files.has(rel)) { const raw = fs.readFileSync(path.join(ENGLISH, rel), "utf8"); files.set(rel, { raw, doc: JSON.parse(raw), dirty: false }); }
  return files.get(rel);
}
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
let applied = 0, already = 0; const failures = [];
function edit(label, rel, obj, key, from, to) {
  const value = String(obj[key] ?? "");
  if (value.includes(to) && !value.includes(from)) { already += 1; return; }
  if (!value.includes(from)) { failures.push(`${label}: "${from}" not found in ${rel} ${key}`); return; }
  obj[key] = value.split(from).join(to); load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`);
}
const unit = (g, u) => `grade-${g}/data/units/unit-${u}.json`;
const grammarOf = (g, u, id) => load(unit(g, u)).doc.grammar.find((x) => x.grammarId === id);

// -------------------------------------------------- "by-phrase" -> "by phrase"
const BY_PHRASE_TARGETS = [
  [7, 4, "eng-g07-t02-u04-grammar02", "practice"],
  [7, 4, "eng-g07-t02-u04-grammar03", "practice"],
  [7, 5, "eng-g07-t02-u05-grammar02", "ruleAndExamples"],
  [7, 5, "eng-g07-t02-u05-grammar02", "practice"],
  [7, 5, "eng-g07-t02-u05-grammar03", "ruleAndExamples"],
  [8, 2, "eng-g08-t01-u02-grammar06", "ruleAndExamples"],
  [8, 2, "eng-g08-t01-u02-grammar06", "practice"],
];
for (const [g, n, id, field] of BY_PHRASE_TARGETS) {
  const grammar = grammarOf(g, n, id);
  if (!grammar) { failures.push(`G${g} U${n} ${id}: grammar item not found`); continue; }
  edit(`G${g} U${n} ${id}.${field} by-phrase`, unit(g, n), grammar, field, "by-phrase", "by phrase");
}

// -------------------------------------------------- break up the repetitive answer key
{
  const g = grammarOf(7, 4, "eng-g07-t02-u04-grammar03");
  if (!g) { failures.push("G7 U4 eng-g07-t02-u04-grammar03: grammar item not found"); }
  else {
    edit(
      "G7 U4 eng-g07-t02-u04-grammar03.practice line breaks",
      unit(7, 4), g, "practice",
      "4) Rice is grown in the fields near the river (by farmers). 5) The books are organised every Friday (by the librarian). 6) The buses are checked before each journey (by workers).\n",
      "4) Rice is grown in the fields near the river (by farmers).\n5) The books are organised every Friday (by the librarian).\n6) The buses are checked before each journey (by workers).\n"
    );
  }
}

for (const [rel, f] of files) if (f.dirty && !DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw));
console.log(`\napplied ${applied}, already ${already}${DRY ? " (dry — nothing written)" : ""}`);
if (failures.length) { console.log(`\n✗ ${failures.length} not applied:`); failures.forEach((x) => console.log("  " + x)); process.exit(1); }
