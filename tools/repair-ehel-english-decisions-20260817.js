#!/usr/bin/env node
// The content decisions left after the two 2026-08-17 proofread passes, resolved:
//   - Grade 1's Amal series names her grandmother Ayeeyo (Units 4, 5) and makes Adam her big
//     brother (Units 3, 4, 5); Units 6 and 9 said Selma / "her friend Adam". Aligned to the
//     majority. Both readings are narrated → two reading clips go stale.
//   - Grade 2 cross-references to "Grammar Lesson n" / "Grammar Practice n" / bare "Grammar n"
//     used an older 3-lesson + 3-practice numbering; every reference is repointed by CONTENT to
//     the grammar item that actually holds the topic, in the "Grammar n" form the tabs show.
//   - The handful of dictionary starters that are ungrammatical as a stem: a proper noun with
//     "The", a verb lemma in the noun frame, a predicative adjective.
//   - Grade 8 Unit 5 Writing 1: the task is a 100-150-word descriptive paragraph, but its
//     expectedLength said five paragraphs and its starter argued a case.
// Real model texts and learner-facing comprehension explanations are applied by
// apply-ehel-english-authored-20260817.js from the authored JSON. Idempotent; loud on a moved
// source. Usage: node tools/repair-ehel-english-decisions-20260817.js [--dry]

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
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
let applied = 0, already = 0; const failures = [];
function edit(label, rel, obj, key, from, to) {
  const value = String(obj[key] ?? "");
  if (value.includes(to) && !value.includes(from)) { already += 1; return; }
  if (!value.includes(from)) { failures.push(`${label}: "${from.slice(0, 60)}" not found in ${rel} ${key}`); return; }
  obj[key] = value.split(from).join(to); load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`);
}
function set(label, rel, obj, key, to) { if (obj[key] === to) { already += 1; return; } obj[key] = to; load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`); }
const unit = (g, u) => `grade-${g}/data/units/unit-${u}.json`;

// ---------------------------------------------------------------- Grade 1: one grandmother, one Adam
{
  const rel = unit(1, 6); const u = load(rel).doc;
  const walk = (o, where) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${where}[${i}]`));
    else if (o && typeof o === "object") for (const k of Object.keys(o)) {
      if (/Id$|^id$|Path$|^source$|^normal$|^slow$/.test(k)) continue;
      if (typeof o[k] === "string" && o[k].includes("Selma")) edit(`G1 U6 Selma → Ayeeyo ${where}.${k}`, rel, o, k, "Selma", "Ayeeyo");
      else walk(o[k], `${where}.${k}`);
    }
  };
  walk(u, "");
  const r9 = load(unit(1, 9)).doc.readings[0];
  edit("G1 U9 grandmother", unit(1, 9), r9, "passageScript", "Amal's grandmother, Selma, was there.", "Amal's grandmother, Ayeeyo, was there.");
  edit("G1 U9 Adam is her big brother", unit(1, 9), r9, "passageScript", "Her friend Adam waved from the gate.", "Her big brother Adam waved from the gate.");
}

// ---------------------------------------------------------------- Grade 2: grammar cross-references by content
{
  const X = [
    // [unit, section, index, key, from, to]
    [2, "outcomes", 2, "evidenceOfLearning", "six self-made questions in Grammar 3", "six self-made questions in Grammar 2"],
    [2, "outcomes", 4, "evidenceOfLearning", "Five correct is or are choices in Grammar 2", "Five correct is or are choices in Grammar 3"],
    [2, "liveSessions", 2, "beforeSession", "Complete Grammar 1 and Grammar 3, and bring", "Complete Grammar 1 and Grammar 2, and bring"],
    [2, "liveSessions", 3, "beforeSession", "Complete Grammar 2, 4, 5 and 6", "Complete Grammar 3, 4, 5 and 6"],
    [3, "outcomes", 3, "evidenceOfLearning", "commands written in Grammar 4", "commands written in Grammar 2"],
    [3, "writing", 1, "support", "rhyme from Grammar Lesson 2", "rhyme from Grammar 3"],
    [3, "liveSessions", 2, "beforeSession", "Read Grammar Lesson 1 and try Practice 1 on your own", "Read Grammar 1 and try Grammar 2 on your own"],
    [3, "liveSessions", 2, "afterSession", "Complete Grammar 4 and draft the commands", "Complete Grammar 2 and draft the commands"],
    [3, "liveSessions", 3, "beforeSession", "Read Grammar Lesson 2 and learn", "Read Grammar 3 and learn"],
    [4, "outcomes", 4, "evidenceOfLearning", "four sentences in Grammar 4", "four sentences in Grammar 2"],
    [4, "outcomes", 5, "evidenceOfLearning", "Five correct verb forms in Grammar 2", "Five correct verb forms in Grammar 3"],
    [4, "outcomes", 6, "evidenceOfLearning", "Four correct -ed forms in Grammar 3", "Four correct -ed forms in Grammar 5"],
    [4, "liveSessions", 2, "beforeSession", "Read Grammar Lesson 1 and try its practice", "Read Grammar 1 and try its practice"],
    [4, "liveSessions", 2, "afterSession", "Complete Grammar 4 and underline", "Complete Grammar 2 and underline"],
    [5, "outcomes", 0, "evidenceOfLearning", "five correct choices in Grammar Practice 3", "five correct choices in Grammar 6"],
    [5, "outcomes", 4, "evidenceOfLearning", "Five correct -er forms in Grammar Practice 1", "Five correct -er forms in Grammar 2"],
    [5, "outcomes", 5, "evidenceOfLearning", "Five correct choices in Grammar Practice 2", "Five correct choices in Grammar 4"],
    [5, "writing", 1, "support", "song from Grammar Lesson 1", "song from Grammar 1"],
    [5, "liveSessions", 2, "beforeSession", "Read Grammar Lesson 1 on comparing with -er than, and try Practice 1 on your own", "Read Grammar 1 on comparing with -er than, and try Grammar 2 on your own"],
    [5, "liveSessions", 2, "afterSession", "Complete Grammar 4 and bring", "Complete Grammar 2 and bring"],
    [5, "liveSessions", 3, "beforeSession", "Read Grammar Lesson 2 and learn", "Read Grammar 3 and learn"],
    [6, "outcomes", 4, "evidenceOfLearning", "Five correct verb forms in Grammar 2, and six fact sentences with the right verb endings in Grammar 5", "Five correct verb forms in Grammar 3, and six fact sentences with the right verb endings in Grammar 4"],
    [6, "outcomes", 5, "evidenceOfLearning", "Three correct question words in Grammar 3", "Three correct question words in Grammar 5"],
    [6, "liveSessions", 2, "afterSession", "Complete Grammar 4 and finish your garden map", "Complete Grammar 2 and finish your garden map"],
    [6, "liveSessions", 3, "beforeSession", "Read Grammar 2 and learn the one bug", "Read Grammar 3 and learn the one bug"],
    [7, "outcomes", 3, "evidenceOfLearning", "five report sentences in Grammar 4", "five report sentences in Grammar 2"],
    [7, "outcomes", 4, "evidenceOfLearning", "Four completed phrase sentences in Grammar 2, a four-line thank-you card in Grammar 5", "Four completed phrase sentences in Grammar 3, a four-line thank-you card in Grammar 4"],
    [7, "outcomes", 5, "evidenceOfLearning", "Four correct choices in Grammar 3", "Four correct choices in Grammar 5"],
    [7, "writing", 1, "support", "Use two phrases from Grammar 2", "Use two phrases from Grammar 3"],
    [7, "liveSessions", 2, "afterSession", "Complete Grammar 4 and draft your five report sentences", "Complete Grammar 2 and draft your five report sentences"],
    [7, "liveSessions", 4, "beforeSession", "Read Grammar 2 and Grammar 3, then choose", "Read Grammar 3 and Grammar 4, then choose"],
    [7, "teacherNotes", 1, "note", "appreciate for slip in Grammar 2", "appreciate for slip in Grammar 3"],
    [8, "outcomes", 5, "evidenceOfLearning", "Five correct is or are choices in Grammar Practice 3", "Five correct is or are choices in Grammar 4"],
    [8, "outcomes", 6, "evidenceOfLearning", "rewritten correctly in Grammar Practice 5", "rewritten correctly in Grammar 6"],
    [8, "liveSessions", 2, "beforeSession", "Read Grammar Practice 1 and try the five gap sentences", "Read Grammar 1 and try its five gap sentences"],
    [9, "outcomes", 4, "evidenceOfLearning", "Five correct verb forms in Grammar Practice 2, and eight true facts written on the aquarium fact cards in Grammar 5", "Five correct verb forms in Grammar 3, and eight true facts written on the aquarium fact cards in Grammar 4"],
    [9, "outcomes", 5, "evidenceOfLearning", "Four correct past and future forms in Grammar Practice 3", "Four correct past and future forms in Grammar 6"],
    [9, "writing", 1, "support", "Look back at Grammar Lesson 3 for the past forms", "Look back at Grammar 5 for the past forms"],
    [9, "writing", 5, "support", "Check the past verbs in Grammar Lesson 3:", "Check the past verbs in Grammar 5:"],
    [9, "liveSessions", 2, "beforeSession", "Read Grammar Lesson 1 and try Practice 1 on your own", "Read Grammar 1 and try Grammar 2 on your own"],
    [9, "liveSessions", 2, "afterSession", "opinion poll in Grammar 4", "opinion poll in Grammar 2"],
    [9, "liveSessions", 3, "beforeSession", "and Grammar Lesson 2, and learn the it, he, she rule", "and Grammar 3, and learn the it, he, she rule"],
  ];
  for (const [n, section, i, key, from, to] of X) {
    const rel = unit(2, n); const list = load(rel).doc[section] || [];
    const obj = list[i] && (String(list[i][key]).includes(from) || String(list[i][key]).includes(to)) ? list[i] : list.find((x) => String(x[key]).includes(from) || String(x[key]).includes(to));
    if (!obj) { failures.push(`G2 U${n} ${section}[${i}].${key}: "${from.slice(0, 50)}" not found`); continue; }
    edit(`G2 U${n} ${section}.${key} → "${to.slice(0, 44)}"`, rel, obj, key, from, to);
  }
  // Nothing learner-facing may still say "Grammar Lesson n" / "Grammar Practice n"
  for (let n = 1; n <= 10; n += 1) {
    const raw = JSON.stringify(load(unit(2, n)).doc);
    const m = raw.match(/Grammar (Lesson|Practice) \d/g);
    if (m) failures.push(`G2 U${n} still says ${[...new Set(m)].join(", ")}`);
  }
}

// ---------------------------------------------------------------- starters that are not usable stems
{
  const S = [
    [6, 8, "u8-g5-1-paris", "The Paris", "In Paris,"],
    [7, 8, "u8-g1-2-claim", "The claim", "She will claim"],
    [7, 8, "u8-g2-3-liable", "The liable", "You are liable to"],
    [7, 8, "u8-g2-4-eligible", "The eligible", "You are eligible to"],
    [7, 9, "u9-g3-2-present", "The present", "She will present"],
    [7, 9, "u9-g3-6-worse", "The worse", "It was worse than"],
    [7, 9, "u9-g3-7-ease", "The ease", "It helped ease"],
    [7, 9, "u9-g3-8-intrigue", "The intrigue", "The mystery was full of intrigue because"],
    [4, 4, "u4-g2-4-judge", "The judge", "You must not judge"],
  ];
  for (const [g, n, id, from, to] of S) {
    const rel = unit(g, n); const link = load(rel).doc.dictionaryLinks.find((l) => l.vocabularyId === id);
    if (!link) { failures.push(`starter ${id}: link not found`); continue; }
    if (link.sentenceStarter === to) { already += 1; continue; }
    if (link.sentenceStarter !== from) { failures.push(`starter ${id}: expected "${from}", found "${link.sentenceStarter}"`); continue; }
    set(`G${g} U${n} starter ${id.split("-").pop()} → "${to}"`, rel, link, "sentenceStarter", to);
  }
}

// ---------------------------------------------------------------- Grade 8 Unit 5 Writing 1 metadata
{
  const rel = unit(8, 5); const w = load(rel).doc.writing[0];
  if (!/descriptive paragraph of 100-150 words/.test(w.promptAndInstructions)) failures.push("G8 U5 write01 prompt has moved");
  else {
    set("G8 U5 write01 expectedLength", rel, w, "expectedLength", "One descriptive paragraph of 100-150 words");
    if (w.sentenceStarter === "The evidence supports the view that...") set("G8 U5 write01 starter", rel, w, "sentenceStarter", "The first thing you notice is...");
  }
}

// ---------------------------------------------------------------- write
for (const [rel, f] of files) if (f.dirty && !DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw));
console.log(`\napplied ${applied}, already ${already}${DRY ? " (dry — nothing written)" : ""}`);
if (failures.length) { console.log(`\n✗ ${failures.length} not applied:`); failures.forEach((f) => console.log("  " + f)); process.exit(1); }
console.log("\nnarrated text changed → stale clips: eng-g01-t02-u06-read01, eng-g01-t03-u09-read01 (Grade 1 readings)");
