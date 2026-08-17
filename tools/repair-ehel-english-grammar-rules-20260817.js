#!/usr/bin/env node
// Grammar rules that were themselves wrong — section 2 of
// docs/english-content-review-2026-08-17.md. Same discipline as
// repair-ehel-english-answer-keys-20260817.js: explicit replacements checked
// against the unit text, idempotent, loud failure if the source has moved.
//
// Narration: `explanation` + `ruleAndExamples`, `practice`, `learningOutcome`
// (overview-outcomes clip), readings and speaking are recorded; `commonMistake`,
// `memoryTip`, `modelText`, comprehension and answer keys are not. Where the
// wrong rule could be corrected in an un-narrated field it was; the rest go
// stale and are listed at the end of the run so they can be re-recorded.
//
// Usage: node tools/repair-ehel-english-grammar-rules-20260817.js [--dry]

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
function set(label, rel, obj, key, to, staleClip) {
  if (obj[key] === to) { already += 1; return; }
  obj[key] = to; load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`);
  if (staleClip) stale.add(staleClip);
}

// ---------------------------------------------------------------------------
{ // G3 U7 grammar 6: "a small grey cat" presented as needing a comma. Size +
  // colour are cumulative adjectives and take none; the comma rule is for two
  // adjectives of the same kind ("a large, shiny rock").
  const rel = "grade-3/data/units/unit-7.json"; const g = load(rel).doc.grammar[5];
  edit("G3 U7 grammar 6 rule: comma only between adjectives of the same kind", rel, g, "ruleAndExamples",
    "Two adjectives take a comma between them: “a large, shiny rock.”",
    "Two describing words of the same kind take a comma between them: “a large, shiny rock.” Different kinds, such as size and colour, need no comma: “a small grey cat.”",
    `grade-3 grammar ${g.grammarId}`);
  edit("G3 U7 grammar 6 commonMistake: replace the false 'mistake'", rel, g, "commonMistake",
    "Describing phrases: “a small grey cat” runs two describing words together, and British writing puts a comma between them: “a small, grey cat.”",
    "Describing phrases: “a rock metal on the beach” puts the describing word after the noun; in English it comes first: “a metal rock on the beach.”");
}
{ // G7 U2 grammar 4: an -ly adverb + participle is NOT hyphenated in British
  // English, yet the lesson mandates "brightly-coloured" and marks the correct
  // form wrong. The story text carries the same hyphens; a hyphen is silent, so
  // the reading text is corrected too and its recording stays right.
  const rel = "grade-7/data/units/unit-2.json"; const u = load(rel).doc; const g = u.grammar[3];
  edit("G7 U2 grammar 4 rule: -ly adverbs take no hyphen", rel, g, "ruleAndExamples",
    "brightly-coloured outfits, freshly-made sambusas, gold-embroidered robes, sweet-scented dishes. The Hero of Kitale uses several: Imani’s hand-drawn posters, Max’s brightly-coloured, fur-lined jacket, and the hand-stitched dress her aunt made.",
    "gold-embroidered robes, sweet-scented dishes, hand-drawn posters, fur-lined jackets. The Hero of Kitale uses several: Imani’s hand-drawn posters, Max’s fur-lined jacket, and the hand-stitched dress her aunt made. An adverb ending in -ly is never hyphenated, even before the noun: brightly coloured outfits, freshly made sambusas.",
    `grade-7 grammar ${g.grammarId}`);
  edit("G7 U2 grammar 4 commonMistake", rel, g, "commonMistake",
    "Mistake: “She wore a brightly coloured dress to the festival.” When the pair sits before the noun, join it with a hyphen: “a brightly-coloured dress”.",
    "Mistake: “She wore a hand made dress to the festival.” When the pair sits before the noun, join it with a hyphen: “a hand-made dress”. But never hyphenate an -ly adverb: “a brightly coloured dress” is already correct.");
  edit("G7 U2 grammar 4 practice item 1", rel, g, "practice", "1) She wore a ______ (brightly / coloured) dress to the festival.", "1) She wore a ______ (sweet / scented) dress to the festival.", `grade-7 grammar-practice ${g.grammarId}-practice`);
  edit("G7 U2 grammar 4 practice item 4", rel, g, "practice", "4) They served a ______ (freshly / baked) cake at the celebration.", "4) They served a ______ (home / baked) cake at the celebration.");
  edit("G7 U2 grammar 4 practice key", rel, g, "practice", "Part A: 1) brightly-coloured 2) hand-made 3) well-known 4) freshly-baked 5) hard-working.", "Part A: 1) sweet-scented 2) hand-made 3) well-known 4) home-baked 5) hard-working.");
  edit("G7 U2 grammar 4 practice Part B key", rel, g, "practice",
    "\"brightly-coloured, fur-lined jacket\" — two compound adjectives in one phrase (Part 1: \"wearing a brightly-coloured, fur-lined jacket\")",
    "\"fur-lined jacket\" (Part 1: \"wearing a brightly coloured, fur-lined jacket\" — brightly coloured is adverb + adjective, so it takes no hyphen)");
  for (const r of u.readings) {
    for (const [from, to] of [["brightly-coloured", "brightly coloured"], ["freshly-made", "freshly made"]]) {
      if (String(r.passageScript).includes(from)) edit(`G7 U2 reading "${r.title}": ${from} → ${to} (silent change)`, rel, r, "passageScript", from, to);
    }
  }
}
{ // G6 U9 grammar 5: model paragraph and key give "a large beautiful wooden box"
  // as correct order (size, opinion, material) — the unit's own Adjective Order
  // lesson puts opinion first.
  const rel = "grade-6/data/units/unit-9.json"; const g = load(rel).doc.grammar[4];
  edit("G6 U9 grammar 5 model paragraph: opinion before size", rel, g, "ruleAndExamples", "a large beautiful wooden box", "a beautiful large wooden box", `grade-6 grammar ${g.grammarId}`);
  edit("G6 U9 grammar 5 key", rel, g, "practice", "\"a large beautiful wooden box\" (size, opinion, material)", "\"a beautiful large wooden box\" (opinion, size, material)", `grade-6 grammar-practice ${g.grammarId}-practice`);
}
{ // G6 U4 grammar 1: "After a short vowel, double the final consonant, so travel
  // becomes travelled" — contradicted by visit → visited in the same exercise.
  const rel = "grade-6/data/units/unit-4.json"; const g = load(rel).doc.grammar[0];
  edit("G6 U4 grammar 1 rule: doubling", rel, g, "ruleAndExamples",
    "After a short vowel, double the final consonant, so travel becomes travelled.",
    "After one short stressed vowel and one consonant, double that consonant, so stop becomes stopped; British English also doubles a final l, so travel becomes travelled (but visit becomes visited).",
    `grade-6 grammar ${g.grammarId}`);
  edit("G6 U4 grammar 1 key note", rel, g, "practice", "travel -> travelled (double the final consonant after a short vowel)", "travel -> travelled (British English doubles a final l)", `grade-6 grammar-practice ${g.grammarId}-practice`);
}
{ // G6 U3 grammar 4 says never 'who' for animals; the unit's own source text has
  // "Cheetahs, who…" and "sea turtles who…". Qualify the rule (un-narrated field).
  const rel = "grade-6/data/units/unit-3.json"; const g = load(rel).doc.grammar[3];
  edit("G6 U3 grammar 4 commonMistake: qualify 'who' for animals", rel, g, "commonMistake",
    "Do not use who for animals or things: “The tree who grows near the river” should be “The tree which grows near the river.”",
    "Do not use who for things: “The tree who grows near the river” should be “The tree which grows near the river.” For animals, which or that is the safe choice; writers sometimes use who for animals they treat as characters (the source text has “Cheetahs, who are the fastest land animals”), but a thing never takes who.");
}
{ // G6 U2 outcome 3: "'unless' and other modal verbs" — unless is a conjunction.
  const rel = "grade-6/data/units/unit-2.json"; const u = load(rel).doc;
  edit("G6 U2 outcome 3: unless is not a modal verb", rel, u.outcomes[2], "learningOutcome",
    "Use 'unless' and other modal verbs to shape conditional sentences", "Use 'unless' and modal verbs to shape conditional sentences", "grade-6 overview-outcomes eng-g06-t01-u02");
  const sa = (u.selfAssessment || []).find((s) => String(s.statement).includes("other modal verbs"));
  if (sa) edit("G6 U2 self-assessment", rel, sa, "statement", "and other modal verbs", "and modal verbs");
}
{ // G4 U6 grammar 4: 'by' taught as a direction preposition; the key uses it as
  // place ("stood by the road").
  const rel = "grade-4/data/units/unit-6.json"; const g = load(rel).doc.grammar[3];
  edit("G4 U6 grammar 4 rule: by is a place word", rel, g, "ruleAndExamples",
    "Direction words, for where something is going: towards, across, by.\nPlace words, for where something is: on, in, near.",
    "Direction words, for where something is going: towards, across.\nPlace words, for where something is: on, in, near, by.",
    `grade-4 grammar ${g.grammarId}`);
}
{ // G8 U7 teaches "implore for" (verb + preposition) and "roil over" (phrasal
  // verb); neither exists. plead for and boil over are the real forms with the
  // same meanings; implore and roil stay in the unit's vocabulary as themselves.
  const rel = "grade-8/data/units/unit-7.json"; const u = load(rel).doc;
  const swaps = [
    ["implored for", "pleaded for"], ["implore for", "plead for"],
    ["roiled over", "boiled over"], ["roils over", "boils over"], ["roil over", "boil over"],
    ["boil over means to become agitated or disturbed", "boil over means to spill out because it can no longer be held in"],
  ];
  const targets = [
    ["outcomes[3]", u.outcomes[3], "learningOutcome", "grade-8 overview-outcomes eng-g08-t03-u07"],
    ["outcomes[4]", u.outcomes[4], "learningOutcome", "grade-8 overview-outcomes eng-g08-t03-u07"],
    ["readings[1]", u.readings[1], "passageScript", `grade-8 reading ${u.readings[1].readingId}`],
    ["grammar[3].explanation", u.grammar[3], "explanation", `grade-8 grammar ${u.grammar[3].grammarId}`],
    ["grammar[3].ruleAndExamples", u.grammar[3], "ruleAndExamples", `grade-8 grammar ${u.grammar[3].grammarId}`],
    ["grammar[3].memoryTip", u.grammar[3], "memoryTip", null],
    ["grammar[3].practice", u.grammar[3], "practice", `grade-8 grammar-practice ${u.grammar[3].grammarId}-practice`],
    ["grammar[4].ruleAndExamples", u.grammar[4], "ruleAndExamples", `grade-8 grammar ${u.grammar[4].grammarId}`],
    ["grammar[4].practice", u.grammar[4], "practice", `grade-8 grammar-practice ${u.grammar[4].grammarId}-practice`],
  ];
  for (const [label, obj, key, clip] of targets) {
    for (const [from, to] of swaps) if (String(obj[key]).includes(from)) edit(`G8 U7 ${label}: ${from} → ${to}`, rel, obj, key, from, to, clip);
  }
  // Practice items where the verb sits before the blank ("He implored ___ more time").
  edit("G8 U7 grammar 4 practice item 4", rel, u.grammar[3], "practice", "He implored __________ more time", "He pleaded __________ more time");
  edit("G8 U7 grammar 4 practice item 8", rel, u.grammar[3], "practice", "The students implored __________ more freedom", "The students pleaded __________ more freedom");
  const left = JSON.stringify(u).match(/implor\w* for|roil\w* over/g);
  if (left) failures.push(`G8 U7 still contains ${left.join(", ")}`);
}
{ // G8 U4 Writing 6 demands a second conditional; the model uses a third.
  const rel = "grade-8/data/units/unit-4.json"; const w = load(rel).doc.writing[5];
  edit("G8 U4 Writing 6 model: second conditional", rel, w, "modelText",
    "If I had built the drone honestly, I would not have feared the judges' questions.",
    "If I built things honestly, I would not fear the judges' questions.");
}
{ // G7 U5: performing a copyrighted play without permission "is plagiarizing" —
  // that is copyright infringement; plagiarism is passing work off as your own.
  const rel = "grade-7/data/units/unit-5.json"; const u = load(rel).doc;
  const r = u.readings[3];
  edit("G7 U5 reading part 2: copyright vs plagiarism", rel, r, "passageScript",
    "This play is copyrighted. Using it without permission is plagiarizing.",
    "This play is copyrighted. Using it without permission breaks the law, and passing it off as our own would be plagiarizing.",
    `grade-7 reading ${r.readingId}`);
  edit("G7 U5 comprehension 10 answer", rel, u.comprehension[9], "correctAnswer",
    "Performing the copyrighted play without permission would have been plagiarizing, so Jamal persuaded",
    "Performing the copyrighted play without permission would have broken copyright law, so Jamal persuaded");
  for (const a of u.answerKey) if (String(a.answerOrGuidance).includes("would have been plagiarizing")) edit("G7 U5 answer key", rel, a, "answerOrGuidance", "would have been plagiarizing", "would have broken copyright law");
}

// ---------------------------------------------------------------------------
for (const [rel, f] of files) if (f.dirty && !DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw), "utf8");
console.log(JSON.stringify({ dry: DRY, applied, alreadyApplied: already, failures: failures.length }));
if (stale.size) console.log("Narrated text changed — clips now stale:\n  " + [...stale].join("\n  "));
for (const f of failures) console.error("✘ " + f);
if (failures.length) process.exit(1);
