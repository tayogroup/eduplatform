#!/usr/bin/env node
// Corrects part-of-speech tags in the English master dictionaries.
//
// Two causes, found by the 2026-08-17 content review:
//
//  * Grades 3-8: normalizeType() in build-ehel-grade{3..8}-shared-course.js
//    tested `includes("verb")` before `includes("adverb")`, so every adverb
//    became a "verb" ("eagerly is used as a verb in this dictionary sense"),
//    and it took "noun" before "verb" for a dual-class word whatever order the
//    source listed them in ("present" — the unit teaches the verb). The
//    original label survives in each entry's `sourceType`; the builders are
//    fixed alongside this so a rebuild agrees.
//  * Grade 1 has no label for pronouns, articles or place words, so "it", "my",
//    "the" were filed as nouns and "here", "up", "next to" as adjectives. Grade
//    1 already uses "position" for on/under; pronoun and article are added.
//
// The table is explicit rather than inferred: a wrong tag here is what the
// Word Type Power game keys on, so every change was checked by hand against the
// entry's meaning and the unit that teaches it. Entry ids (which embed the old
// tag) are deliberately left alone — they are opaque keys referenced by every
// unit's dictionaryLinks, and audio is filed by word.
//
// Idempotent. Usage: node tools/repair-ehel-english-dictionary-pos.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const DRY = process.argv.includes("--dry");

const DEFINITIONS = {
  noun: "Names a person, place, thing or idea.",
  verb: "Shows an action or a state.",
  adjective: "Describes a noun.",
  adverb: "Describes how, when or where an action happens.",
  position: "Shows where one thing is compared with another.",
  pronoun: "A small word that stands in for a naming word.",
  article: "A small word that goes before a naming word.",
};
// Grade 1 words its labels for five-year-olds ("A naming word"); keep that voice.
const GRADE1_DEFINITIONS = { ...DEFINITIONS, noun: "A naming word" };

const FIXES = {
  1: {
    I: "pronoun", my: "pronoun", it: "pronoun", we: "pronoun",
    the: "article", a: "article",
    "next to": "position", near: "position", up: "position", down: "position", here: "position", there: "position",
    town: "noun",
  },
  3: { soon: "adverb", sooner: "adverb", care: "verb" },
  4: { really: "adverb", clearly: "adverb", judge: "verb" },
  5: { unfortunately: "adverb" },
  6: { originally: "adverb", eagerly: "adverb", firmly: "adverb", dramatically: "adverb" },
  7: { warily: "adverb", gingerly: "adverb", abruptly: "adverb", astride: "adverb", claim: "verb", present: "verb" },
  8: { headlong: "adverb", advocate: "verb", telltale: "adjective", imperative: "adjective" },
};

let changed = 0, already = 0, missing = 0;
for (const [grade, table] of Object.entries(FIXES)) {
  const file = path.join(ENGLISH, `grade-${grade}`, "data", `master-dictionary.grade${grade}.json`);
  const raw = fs.readFileSync(file, "utf8");
  const dict = JSON.parse(raw);
  const defs = Number(grade) === 1 ? GRADE1_DEFINITIONS : DEFINITIONS;
  const seen = new Set();
  let touched = false;
  for (const entry of dict.entries) {
    const want = table[entry.displayWord];
    if (!want) continue;
    seen.add(entry.displayWord);
    if (entry.partOfSpeech === want) { already += 1; continue; }
    console.log(`grade-${grade}: ${entry.displayWord}: ${entry.partOfSpeech} -> ${want}`);
    entry.partOfSpeech = want;
    entry.partOfSpeechDefinition = defs[want];
    changed += 1; touched = true;
  }
  for (const word of Object.keys(table)) if (!seen.has(word)) { missing += 1; console.log(`grade-${grade}: "${word}" not found in dictionary`); }
  if (touched && !DRY) {
    let text = JSON.stringify(dict, null, 2);
    if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
    const eol = raw.includes("\r\n") ? "\r\n" : "\n";
    fs.writeFileSync(file, text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : ""), "utf8");
  }
}
console.log(JSON.stringify({ dry: DRY, changed, alreadyCorrect: already, missing }));
if (missing) process.exit(1);
