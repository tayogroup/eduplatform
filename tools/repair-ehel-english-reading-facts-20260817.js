#!/usr/bin/env node
// Factual and internal-consistency slips in readings and model text — section 2
// of docs/english-content-review-2026-08-17.md. Same discipline as the two
// sibling repair scripts: explicit replacements checked against the unit text,
// idempotent, loud failure if the source has moved, stale narrated clips listed.
//
// Usage: node tools/repair-ehel-english-reading-facts-20260817.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

const files = new Map();
function load(rel) {
  if (!files.has(rel)) {
    const raw = fs.readFileSync(path.join(ENGLISH, rel), "utf8");
    files.set(rel, { raw, doc: JSON.parse(raw), dirty: false });
  }
  return files.get(rel);
}
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}

let applied = 0, already = 0;
const failures = [], stale = new Set();
function edit(label, rel, obj, key, from, to, staleClip) {
  const value = String(obj[key] ?? "");
  if (value.includes(to)) { already += 1; return; }
  if (!value.includes(from)) { failures.push(`${label}: "${from.slice(0, 70)}" not found in ${rel} ${key}`); return; }
  obj[key] = value.split(from).join(to);
  load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`);
  if (staleClip) stale.add(staleClip);
}
const reading = (u, title) => u.readings.find((r) => r.title === title);

// ---------------------------------------------------------------------------
{ // G2 U6 Writing 1 model: a butterfly has four wings, not two. (modelText: not narrated)
  const rel = "grade-2/data/units/unit-6.json"; const w = load(rel).doc.writing[0];
  edit("G2 U6 Writing 1 model: butterflies have four wings", rel, w, "modelText", "It has six legs and two wings.", "It has six legs and four wings.");
}
{ // G2 U3 "Healthy and Strong": Leo sleeps 8pm–7am (eleven hours), the teacher
  // says ten are needed, then "Almost… go to bed a little earlier". Bed at ten
  // gives nine hours, and the teacher's reply becomes right.
  const rel = "grade-2/data/units/unit-3.json"; const r = reading(load(rel).doc, "Healthy and Strong");
  edit("G2 U3 reading: Leo's bedtime", rel, r, "passageScript", "I go to bed at eight and wake up at seven.", "I go to bed at ten and wake up at seven.", `grade-2 reading ${r.readingId}`);
}
{ // G3 U8: the board clue says "more than 500 shells" but the solved total is 375;
  // and Amal is at home with visiting cousins, then walks "home from her cousins' house".
  const rel = "grade-3/data/units/unit-8.json"; const u = load(rel).doc;
  const shells = reading(u, "The Mystery of the Million Shells");
  edit("G3 U8 shells clue: 500 → 300", rel, shells, "passageScript", "There are more than 500 shells.", "There are more than 300 shells.", `grade-3 reading ${shells.readingId}`);
  const maths = reading(u, "Maths Is Everywhere");
  edit("G3 U8 Maths Is Everywhere: whose house", rel, maths, "passageScript",
    "When it is time to walk home from her cousins' house, Amal counts her steps one by one. She wants to know the distance from their door to her own. By the time she reaches home,",
    "When it is time to walk her cousins back to their house, Amal counts her steps one by one. She wants to know the distance from her door to theirs. By the time she is home again,",
    `grade-3 reading ${maths.readingId}`);
}
{ // G3 U3 "The Twelve Months": the holiday is in December; the year restarts in January.
  const rel = "grade-3/data/units/unit-3.json"; const r = reading(load(rel).doc, "The Twelve Months");
  edit("G3 U3 reading: holiday and new year", rel, r, "passageScript",
    "so the long holiday comes right before the new year starts again in December.",
    "so the long holiday comes in December, right before the new year starts again in January.",
    `grade-3 reading ${r.readingId}`);
}
{ // G3 U7 "From Coast to Forest": "Is that ice?" — "No, it is not snow" — never resolved.
  const rel = "grade-3/data/units/unit-7.json"; const r = reading(load(rel).doc, "From Coast to Forest");
  edit("G3 U7 reading: answer the question that was asked", rel, r, "passageScript",
    "“No, it is not snow,” said the teacher. “But water here froze one very cold night.”",
    "“It is frost,” said the teacher. “Water here froze one very cold night.”",
    `grade-3 reading ${r.readingId}`);
}
{ // G4 U6 Writing 4 model says the governor walked first; the story has the mayor
  // first, then the governor. (modelText: not narrated)
  const rel = "grade-4/data/units/unit-6.json"; const w = load(rel).doc.writing[3];
  edit("G4 U6 Writing 4 model: mayor first", rel, w, "modelText", "The governor walked first, and the people clapped.", "The mayor walked first, with the governor behind, and the people clapped.");
}
{ // G4 U10 "Exhibition Evening": Adam says "Six rows of boards"; the plan settled on two.
  const rel = "grade-4/data/units/unit-10.json"; const r = reading(load(rel).doc, "Exhibition Evening");
  edit("G4 U10 reading: two rows", rel, r, "passageScript", "Six rows of boards, and every one is different.", "Two rows of boards, and every one is different.", `grade-4 reading ${r.readingId}`);
}
{ // G6 U8: reading 2 ends at paragraph 5 but three questions ask about paragraph 6
  // (the revival of local filmmaking; "the heart of entertainment stays the
  // same"); the story's part 2 ends mid-sentence on "Sami whispered:".
  const rel = "grade-6/data/units/unit-8.json"; const u = load(rel).doc;
  const r1 = u.readings[1];
  edit("G6 U8 reading 2: restore paragraph 6", rel, r1, "passageScript",
    "can spot the difference between a story that informs and a message that tries to sell.",
    "can spot the difference between a story that informs and a message that tries to sell.\nToday there is a revival of local filmmaking in East Africa and across the Somali diaspora. Young directors are telling stories about their own communities, their history, their families and their dreams, and some of these films have been shown at international festivals. The tools have changed — from fires to screens — but the heart of entertainment stays the same: a good story, well told, still makes us feel something real.",
    `grade-6 reading ${r1.readingId}`);
  const r3 = u.readings[3];
  edit("G6 U8 story part 2: finish the last sentence", rel, r3, "passageScript",
    "And under the fading baobab tree, Sami whispered:",
    "And under the fading baobab tree, Sami whispered, \"The Scholar was buried, but not forgotten — and now his story has a writer.\"",
    `grade-6 reading ${r3.readingId}`);
}
{ // G6 U10: a vocabulary sentence refers to a "Unit 1 story" with hidden boxes that
  // Unit 1 does not contain; Mo Farah is not a highland runner (born in Somalia,
  // trained in Britain) — Eliud Kipchoge is; Gutenberg built the press, he did
  // not "propose" it.
  const rel = "grade-6/data/units/unit-10.json"; const u = load(rel).doc;
  const link = u.dictionaryLinks[0];
  const idx = link.practiceSentences.indexOf("Why did the Unit 1 story treat the hidden boxes as clearly illegal goods?");
  if (idx >= 0) { link.practiceSentences[idx] = "Why does the law treat smuggled goods as clearly illegal?"; load(rel).dirty = true; applied += 1; console.log("✔ G6 U10 vocabulary sentence: no such Unit 1 story"); stale.add(`grade-6 vocabulary ${link.vocabularyId}-sentence-${idx + 1}`); }
  else if (!link.practiceSentences.includes("Why does the law treat smuggled goods as clearly illegal?")) failures.push("G6 U10 practice sentence not found"); else already += 1;
  const r1 = u.readings[1];
  edit("G6 U10 reading 2: highland runners", rel, r1, "passageScript", "such as Mo Farah and Tegla Loroupe", "such as Eliud Kipchoge and Tegla Loroupe", `grade-6 reading ${r1.readingId}`);
  const r3 = u.readings[3];
  edit("G6 U10 reading 4: Gutenberg built the press", rel, r3, "passageScript", "Johannes Gutenberg proposed a machine that could print books quickly", "Johannes Gutenberg built a machine that could print books quickly", `grade-6 reading ${r3.readingId}`);
}
{ // G2 U10: story says "six pages from six different units" while the brief, the
  // writing task, the key and the rubric all say "at least four"; the showcase
  // says "Six weeks of work" for a year-end showcase.
  const rel = "grade-2/data/units/unit-10.json"; const u = load(rel).doc;
  edit("G2 U10 story: at least four units", rel, u.readings[0], "passageScript", "Every child had to choose six pages from six different units.", "Every child had to choose six pages from at least four different units.", `grade-2 reading ${u.readings[0].readingId}`);
  edit("G2 U10 showcase: a year of work", rel, u.readings[2], "passageScript", "Six weeks of work fill this hall today", "A whole year of work fills this hall today", `grade-2 reading ${u.readings[2].readingId}`);
}
{ // G2 U1 Writing 6: "each of the six weeks of this unit" — a unit runs six sessions.
  const rel = "grade-2/data/units/unit-1.json"; const w = load(rel).doc.writing[5];
  edit("G2 U1 Writing 6: six sessions, not six weeks", rel, w, "promptAndInstructions", "in each of the six weeks of this unit", "in each of the six sessions of this unit", `grade-2 writing ${w.writingId}`);
}
{ // G1 U4: the overview promises "the elves and the shoemaker", which is not in the
  // unit; Activity 5 forces "I can wear a shoes", the exact error grammar 5 warns
  // against.
  const rel = "grade-1/data/units/unit-4.json"; const u = load(rel).doc;
  edit("G1 U4 overview: no elves-and-shoemaker story in the unit", rel, u.unit, "unitOverview",
    "You will meet the short 'e' sound in hen, pen and tent, and enjoy the old story of the elves and the shoemaker.",
    "You will meet the short 'e' sound in hen, pen and tent.", "grade-1 overview-intro eng-g01-t02-u04");
  edit("G1 U4 Activity 5: shoes are two, so no 'a'", rel, u.activities[4], "instructionsAndItems",
    "Say 'I can wear a ___' for each, then choose the ones for a cold day.",
    "Say 'I can wear a hat', 'I can wear a coat', 'I can wear a scarf' and 'I can wear shoes' — shoes are two, so no 'a'. Then choose the ones for a cold day.");
  edit("G1 U4 Activity 5 answer summary", rel, u.activities[4], "answerSummary",
    "Hat, coat, shoes and scarf pointed to and named with 'I can wear a ___',",
    "Hat, coat, shoes and scarf pointed to and named ('I can wear a hat', 'I can wear shoes'),");
}
{ // G1 U0 and U1: "cat starts with /c/", "cup with /c/" — the sound is /k/.
  for (const [rel, from, to] of [
    ["grade-1/data/units/unit-0.json", "cat starts with /c/", "cat starts with /k/"],
    ["grade-1/data/units/unit-1.json", "cup with /c/", "cup with /k/"],
  ]) {
    const u = load(rel).doc;
    for (const q of u.quizzes) if (String(q.explanation).includes(from)) edit(`${rel} quiz explanation: ${from} → ${to}`, rel, q, "explanation", from, to);
    for (const a of u.answerKey) if (String(a.answerOrGuidance).includes(from)) edit(`${rel} answer key: ${from} → ${to}`, rel, a, "answerOrGuidance", from, to);
  }
}

// ---------------------------------------------------------------------------
for (const [rel, f] of files) if (f.dirty && !DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw), "utf8");
console.log(JSON.stringify({ dry: DRY, applied, alreadyApplied: already, failures: failures.length }));
if (stale.size) console.log("Narrated text changed — clips now stale:\n  " + [...stale].join("\n  "));
for (const f of failures) console.error("✘ " + f);
if (failures.length) process.exit(1);
