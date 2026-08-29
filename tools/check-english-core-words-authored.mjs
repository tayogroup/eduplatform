#!/usr/bin/env node
// Proofread the authored Core-word content for one grade, as it is written.
//
// This exists because the Grade 1 pass found every one of these faults by hand,
// one at a time, after the fact — a sentence that never contained its own word
// ("Why are you late, Adam?" for `because`), an irregular past that hides the
// headword (`gave` for `give`), US spellings arriving with reused sentences, a
// set of five with two the same. Each was a real defect and each is mechanical
// to detect, so nothing is served by finding them by reading.
//
// It checks CONTENT, not shape: the draft tool already guarantees the fields
// exist. What it cannot know is whether a sentence teaches its word.
//
//   node tools/check-english-core-words-authored.mjs --grade 2
//   node tools/check-english-core-words-authored.mjs --grade 2 --unit 3
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
let GRADE = 2, onlyUnit = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  if (argv[i] === "--unit") { onlyUnit = Number(argv[++i]); continue; }
  console.error(`Unrecognised argument: ${argv[i]}`);
  process.exit(2);
}
const DIR = path.join(ROOT, `grade-${GRADE}`, "data");

// Sentence length is per grade for the same reason the draft tool's candidate
// cap is: it means "as long as this grade already asks a child to read".
// Measured over each grade's own authored practice sentences (max 56 / 83).
// Grade 6 measures max 108 chars / 19 words, p99 97 / 16 — so the ?? fallback of
// 78/15 would have rejected this grade's OWN existing sentences as too long. A
// fallback below the top of the table is not a default, it is a wrong answer
// waiting for the next grade; raised to the widest measured grade.
const MAX_SENTENCE = { 1: 60, 2: 78, 3: 74, 4: 80, 5: 100, 6: 108, 7: 121, 8: 133 }[GRADE] ?? 133;
const MAX_WORDS = { 1: 11, 2: 15, 3: 15, 4: 16, 5: 17, 6: 19, 7: 19, 8: 22 }[GRADE] ?? 22;

// The cast the grade's own readings use. A sentence starring somebody else came
// from another grade and puts a stranger on the word card.
//
// DERIVED from the readings, then widened by the hand-list below. A table alone
// was wrong the first time a new grade was drafted: Grade 3 had no entry, fell
// back to [], and the check duly reported Nora and Sami — who appear 66 and 65
// times in Grade 3's own passages — as strangers. An unknown grade must not turn
// this into a check that flags every name.
//
// A name is a capitalised token the course does not know as an ordinary word;
// that test is what separates "Nora" from the "The"/"What"/"Yes" that start
// sentences. The two sources are UNIONED rather than intersected, because the
// failure directions are not symmetric: a name wrongly admitted costs one missed
// flag, while a name wrongly rejected produces noise on every correct sentence,
// which is how a check gets ignored.
function deriveCast(grade) {
  const known = new Set();
  for (let g = 1; g <= 8; g++) {
    const f = path.join(ROOT, `grade-${g}`, "data", `master-dictionary.grade${g}.json`);
    if (fs.existsSync(f)) for (const e of JSON.parse(fs.readFileSync(f, "utf8")).entries) known.add(e.lemma.toLowerCase());
  }
  const counts = new Map();
  for (let u = 0; u <= 10; u++) {
    const f = path.join(ROOT, `grade-${grade}`, "data", "units", `unit-${u}.json`);
    if (!fs.existsSync(f)) continue;
    for (const r of JSON.parse(fs.readFileSync(f, "utf8")).readings || [])
      for (const m of String(r.passageScript || "").matchAll(/\b([A-Z][a-z]{2,})\b/g))
        counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  }
  return [...counts].filter(([w, n]) => n >= 5 && !known.has(w.toLowerCase())).map(([w]) => w);
}
const CAST = [...new Set([
  ...deriveCast(GRADE),
  // Family words a grade uses without the readings naming them five times.
  "Amal", "Adam", "Grandma", "Grandpa", "Mum", "Dad", "Teacher",
  ...({ 2: ["Leo", "Nora", "Theo", "Sami", "Maya", "Leila", "Yasmin", "Idris"],
        // Theo, Nadia and Rami are below the derivation's threshold in the Grade 3
        // readings but are named cast in the Grade 3 ebook kit (CLAUDE.md), so they
        // are not strangers to a Grade 3 child.
        3: ["Amal", "Yasmin", "Nora", "Sami", "Leo", "Hana", "Daniel", "Mina", "Maya", "Omar",
            "Theo", "Nadia", "Rami"] }[GRADE] ?? []),
])];

// UK spellings are the house style (owner decision, 2026-08-17).
const US = /\b(color|colors|favorite|mom|moms|gray|neighbor|neighbors|center|centers|meter|meters|liter|liters|practice(?=s? (?:the|your|a)\b)|realize|organize|apologize|traveled|labeled|jewelry|airplane|soccer|candy|cookie|cookies|sidewalk|flashlight|garbage can|elevator|apartment|janitor|mold|railroad|emphasize)\b/i;

const draftFile = path.join(DIR, "core-words-draft.json");
const authoredFile = path.join(DIR, "core-words-authored.json");
if (!fs.existsSync(draftFile)) { console.error(`No draft at ${draftFile}`); process.exit(2); }
const draft = JSON.parse(fs.readFileSync(draftFile, "utf8"));
const authored = fs.existsSync(authoredFile)
  ? JSON.parse(fs.readFileSync(authoredFile, "utf8")).words : {};

// Does the sentence actually contain the word? Regular inflections count —
// "picked" teaches `pick`. Irregular ones do NOT: `gave` does not show a reader
// the word `give`, which is the whole point of the example.
function shows(sentence, word) {
  // A hyphenated headword must be matched WITH its hyphen. Stripping non-letters
  // turns `self-control` into `selfcontrol`, which appears in no sentence any
  // human would write, so all five of its examples would be reported as never
  // using the word — the same false-accusation failure the -ies plurals caused.
  // The hyphen is written as optional so "self-control" and "self control" both
  // count; the word is not spelled without it, but a sentence should not fail on
  // a space.
  if (/-/.test(word)) {
    const parts = word.split("-").map((p) => p.replace(/[^a-z]/gi, ""));
    const joined = parts.join("[- ]?");
    if (new RegExp(`\\b${joined}(?:s|ed|ing)?\\b`, "i").test(sentence)) return true;
    // A hyphenated verb ending in a silent e drops it before -ed and -ing, exactly as
    // an unhyphenated one does: re-evaluate becomes re-evaluated. The line above only
    // appends endings whole, so "She re-evaluated her argument" was reported as never
    // using `re-evaluate`. The non-hyphen path further down has always handled the
    // e-drop; the hyphen path was written without it. Fifth form rule added to this
    // function after it accused correct content, and the fifth found the same way.
    const hstem = joined.replace(/e$/, "");
    if (hstem !== joined && new RegExp(`\\b${hstem}(?:ed|ing|es)\\b`, "i").test(sentence)) return true;
  }
  const w = word.replace(/[^a-z]/gi, "");
  if (!w) return true;
  const stem = w.replace(/(?:e)$/, "");
  // A consonant + y becomes -ies or -ied: property/properties, carry/carried,
  // activity/activities. Missing this reported "Every substance has its own set
  // of properties." as a sentence that never uses `property`, which is a false
  // accusation against correct content — and the words it would recur on are
  // ordinary ones (country, activity, category, difficulty), so it would keep
  // costing a reviewer time on every grade from here up.
  const yStem = /[^aeiou]y$/.test(w) ? w.slice(0, -1) : null;
  const parts = [
    `\\b${w}(?:s|es|ed|ing|ly|er|est)?\\b`,
    `\\b${stem}(?:ed|ing|es|er|est)\\b`,
    `\\b${w}${w.slice(-1)}(?:ed|ing|er|est)\\b`,
  ];
  if (yStem) parts.push(`\\b${yStem}(?:ies|ied|ier|iest)\\b`);
  // A Latin noun ending -a pluralises to -ae: larva/larvae, antenna/antennae,
  // formula/formulae. Without this, "Mosquito larvae live in still water." was
  // reported as a sentence that never uses `larva` - while the sentence beside it
  // on the same card exists precisely to teach that plural. The THIRD form rule
  // in this function to accuse correct content, after the -ies plurals and the
  // hyphenated headword, and the same shape every time: an inflection the rule
  // had not been told about reads as an absence of the word.
  //
  // Narrow on purpose. It fires only where the headword itself ends in -a, so it
  // cannot reach an English word that merely ends -ae, and it leaves the ordinary
  // -s plural those nouns also take (formulas) to the rule above.
  if (/a$/.test(w)) parts.push(`\\b${w.slice(0, -1)}ae\\b`);
  // Latin nouns in -ex and -ix pluralise to -ices: vertex/vertices, matrix/matrices,
  // index/indices. Without this, "A cube has eight vertices and twelve edges." was
  // reported as never using `vertex`. Same shape as the -ae rule directly above,
  // found the same way, and it will recur: Grade 8 teaches both `vertex` and
  // `matrix`. Narrow like its neighbour - it fires only where the headword itself
  // ends -ex or -ix, so it cannot reach an English word merely ending -ices.
  if (/[ei]x$/.test(w)) parts.push(`\\b${w.slice(0, -2)}ices\\b`);
  return new RegExp(parts.join("|"), "i").test(sentence);
}

// A backtick is never correct in learner-facing prose. It is code notation, and
// it reaches a card because whoever is authoring writes markdown all day.
//
// This rule exists because the check ALMOST caught it and that was luck. One
// backtick opened a sentence, so the capitalisation rule fired - "does not start
// with a capital" - and the real fault was named by a rule aimed at something
// else. A sweep then found four more sitting MID-sentence, in two grades, every
// one of them invisible to every check here. Caught 1 of 5, by accident, on the
// only one that happened to sit where another rule was looking.
//
// Unlike the form rules above it, this one cannot accuse correct content: there
// is no sentence a child should read that contains a backtick.
// `cookie` is in the US list above for the BISCUIT, and that is right: the UK
// vocabulary decision of 2026-08-17 maps cookie to biscuit. A browser cookie is
// a different word that happens to be spelled the same, it is standard British
// usage, and Grade 6's supplied list asks for it by name in the technology
// category. The rule fired on all four sentences of a card the course
// deliberately teaches.
//
// So the exemption is keyed to the HEADWORD, not to the sentence: the check is
// skipped only where the card being written IS that word, which is the one
// place the technical sense is certain. A stray "cookie" meaning biscuit on any
// other card still fails, which is what the rule was written for.
//
// This is the same shape as `program` in Grade 5 - correct British English for
// the computing sense, wrong for a broadcast - except that one needed no code,
// because the US list never contained it. A rule about a WORD cannot see which
// sense is on the page.
const US_TECHNICAL_HEADWORD = new Set(["cookie"]);
const BACKTICK = /`/;
let words = 0, problems = 0;
const seenSentence = new Map();
const report = [];

for (const unit of draft.units) {
  if (onlyUnit && unit.unit !== onlyUnit) continue;
  for (const w of unit.words) {
    const a = authored[w.word];
    const meaning = a?.childMeaning ?? w.childMeaning;
    const sentences = a?.practiceSentences ?? w.practiceSentences ?? [];
    // Only judge what has been written. A word still marked for authoring is a
    // known gap, not a defect — reporting it here would bury the real faults.
    if (!meaning || sentences.length < 5) continue;
    words += 1;
    const bad = [];

    if (!/[.!?]$/.test(meaning.trim())) bad.push("meaning does not end in a full stop");
    if (meaning.trim().length < 15) bad.push("meaning is too short to teach anything");
    if (BACKTICK.test(meaning)) bad.push("meaning uses a backtick, which is code notation");
    const usExempt = US_TECHNICAL_HEADWORD.has(String(w.word).toLowerCase());
    if (!usExempt && US.test(meaning)) bad.push(`US spelling in the meaning: ${meaning.match(US)[0]}`);

    if (sentences.length !== 5) bad.push(`${sentences.length} sentences, not 5`);
    const within = new Set();
    sentences.forEach((s, i) => {
      const n = i + 1;
      if (!shows(s, w.word)) bad.push(`sentence ${n} never uses "${w.word}": ${s}`);
      if (s.length > MAX_SENTENCE) bad.push(`sentence ${n} is ${s.length} chars (max ${MAX_SENTENCE}): ${s}`);
      if (s.trim().split(/\s+/).length > MAX_WORDS) bad.push(`sentence ${n} is over ${MAX_WORDS} words: ${s}`);
      if (!/^["'“]?[A-Z]/.test(s)) bad.push(`sentence ${n} does not start with a capital: ${s}`);
      if (BACKTICK.test(s)) bad.push(`sentence ${n} uses a backtick, which is code notation: ${s}`);
      if (!/[.!?]["'”]?$/.test(s)) bad.push(`sentence ${n} has no end punctuation: ${s}`);
      if (!usExempt && US.test(s)) bad.push(`sentence ${n} US spelling "${s.match(US)[0]}": ${s}`);
      if (/_{2,}/.test(s)) bad.push(`sentence ${n} is a fill-in-the-blank line: ${s}`);
      if (within.has(s)) bad.push(`sentence ${n} repeats another in the same set: ${s}`);
      within.add(s);
      // A name the grade's readings never use came in with a reused sentence.
      for (const m of s.matchAll(/\b([A-Z][a-z]{2,})\b/g)) {
        const name = m[1];
        if (m.index === 0) continue;                       // sentence-initial word
        if (!/^(Amal|Adam|Leo|Nora|Theo|Sami|Maya|Leila|Yasmin|Grandma|Grandpa|Idris|Mum|Dad|Teacher|Miss|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|English|Earth)$/.test(name)) continue;
        if (!CAST.includes(name) && !/^(Miss|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|English|Earth)$/.test(name))
          bad.push(`sentence ${n} names "${name}", who is not in this grade's cast: ${s}`);
      }
      const prev = seenSentence.get(s);
      if (prev && prev !== w.word) bad.push(`sentence ${n} is reused verbatim from "${prev}": ${s}`);
      seenSentence.set(s, w.word);
    });

    if (bad.length) {
      problems += bad.length;
      report.push(`  u${unit.unit} ${w.word}\n${bad.map((b) => `      ${b}`).join("\n")}`);
    }
  }
}

console.log(`Grade ${GRADE} authored Core words${onlyUnit ? ` (unit ${onlyUnit})` : ""}`);
console.log(`  words with complete content checked: ${words}`);
console.log(`  problems: ${problems}\n`);
if (report.length) console.log(report.join("\n"));
process.exitCode = problems ? 1 : 0;
