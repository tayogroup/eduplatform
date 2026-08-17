#!/usr/bin/env node
// Repairs vocabulary `sentenceStarter` fields that put "The " before a word
// that is not a noun or adjective — "The roam", "The persuade", "The
// unfortunately", "The astride" — 154 links across 23 units on 2026-08-17.
//
// The builders (build-ehel-grade{3..8}-shared-course.js) wrote every starter as
// `The ${word}`; that reads fine for the nouns and adjectives that make up
// most of the vocabulary and is wrong for everything else. The starter is the
// placeholder of the "write your own sentence" box, so it only has to be a
// grammatical stem that leads into the word.
//
// Rule, by the part of speech in the dictionary entry id:
//   verb        → the example sentence up to and including the word, when
//                 that is short ("A team consists", "She decided"); otherwise
//                 "I can <word>" for a base form, "It <word>" for an -s form
//   adverb      → the example sentence up to the word when that is short
//                 ("Unfortunately", "The dog barked eagerly"), else "She spoke <word>"
//   preposition → "The cat sat <word>"
//   others      → left alone and reported
// Nouns and adjectives are not touched. Idempotent: a starter that no longer
// matches /^The <word>$/ is skipped.
//
// Usage: node tools/repair-ehel-english-sentence-starters.js [--dry] [grade …]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const grades = argv.filter((a) => /^[1-8]$/.test(a)).map(Number);
const wanted = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function verbStarter(word, example) {
  const re = new RegExp(`^(.*?\\b${escapeRe(word)}\\w*)`, "i");
  const m = re.exec(String(example || ""));
  if (m && m[1].split(/\s+/).length <= 6 && !/^the\s+\w+$/i.test(m[1])) return m[1];
  if (/s$/.test(word) && !/ss$/.test(word)) return `It ${word}`;
  return `I can ${word}`;
}

function starterFor(pos, word, example) {
  // A few -ly adverbs are tagged "verb" in the dictionary (eagerly, firmly,
  // originally, unfortunately) — the same mislabel that keys "eagerly is used
  // as a verb" in the games. Go by the word here; the tag is a separate defect.
  if (/ly$/i.test(word) && !/^(apply|rely|supply|reply|fly|imply|comply|multiply)$/i.test(word)) pos = "adverb";
  switch (pos) {
    case "verb": return verbStarter(word, example);
    case "adverb": {
      // Sentence adverbs read best where the example puts them ("Unfortunately",
      // "Originally, the town…" → "Originally"); manner adverbs after a verb.
      const m = new RegExp(`^(.*?\\b${escapeRe(word)})`, "i").exec(String(example || ""));
      if (m && m[1].split(/\s+/).length <= 4) return m[1];
      return `She spoke ${word}`;
    }
    case "preposition": return `The cat sat ${word}`;
    default: return null;
  }
}


// Some unit files store non-ASCII as \uXXXX escapes (Python json.dumps
// default); JSON.stringify would emit the literal characters and turn a
// 12-line edit into a 100-line diff. Match whatever the file already does.
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) {
    text = text.replace(/[\u0080-\uffff]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}

let fixed = 0, skipped = 0, left = 0;
const samples = [];
for (const grade of wanted) {
  const unitsDir = path.join(ENGLISH, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const name of fs.readdirSync(unitsDir).filter((n) => /^unit-\d+\.json$/.test(n))) {
    const file = path.join(unitsDir, name);
    const raw = fs.readFileSync(file, "utf8");
    const unit = JSON.parse(raw);
    let touched = false;
    for (const link of unit.dictionaryLinks || []) {
      const starter = String(link.sentenceStarter || "");
      const m = /^The ([A-Za-z-]+)$/.exec(starter);
      if (!m) { skipped += 1; continue; }
      const word = m[1];
      const pos = (/-(noun|verb|adjective|adverb|preposition|conjunction|interjection|pronoun|expression|phrase)-/.exec(link.dictionaryEntryId || "") || [])[1];
      if (!pos || pos === "noun" || pos === "adjective") { skipped += 1; continue; }
      const next = starterFor(pos, word, link.exampleSentence);
      if (!next) { left += 1; samples.push(`LEFT ${grade}/${name} ${pos} "${starter}"`); continue; }
      link.sentenceStarter = next;
      fixed += 1; touched = true;
      if (samples.length < 30) samples.push(`${grade}/${name} ${pos} "${starter}" -> "${next}"`);
    }
    if (touched && !DRY) {
      fs.writeFileSync(file, serialise(unit, raw), "utf8");
    }
  }
}
console.log(samples.join("\n"));
console.log(JSON.stringify({ dry: DRY, fixed, leftAlone: left, untouched: skipped }));
