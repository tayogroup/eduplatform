#!/usr/bin/env node
// Answer-key corrections from section 2 of docs/english-content-review-2026-08-17.md.
//
// Every edit below was checked against the unit's own text before it was
// written; each block says what was wrong and quotes the evidence. Explicit
// string replacements, not heuristics — a repair to an answer key has to be
// exactly as auditable as the key. Idempotent: an edit whose "from" text is
// gone is reported as already applied, and the script fails loudly if a
// "from" text is not found at all (the data moved and the fix must be
// re-checked, not silently skipped).
//
// Usage: node tools/repair-ehel-english-answer-keys-20260817.js [--dry]

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
const failures = [];
// Replace `from` with `to` in the string at obj[key]. `from` must be present
// unless `to` already is (then the edit was applied earlier).
function edit(label, rel, obj, key, from, to) {
  const value = String(obj[key] ?? "");
  if (value.includes(to)) { already += 1; return; }
  if (!value.includes(from)) { failures.push(`${label}: "${from.slice(0, 60)}" not found in ${rel} ${key}`); return; }
  obj[key] = value.replace(from, to);
  load(rel).dirty = true; applied += 1;
  console.log(`✔ ${label}`);
}
function set(label, rel, obj, key, to) {
  if (obj[key] === to) { already += 1; return; }
  obj[key] = to; load(rel).dirty = true; applied += 1; console.log(`✔ ${label}`);
}

// ---------------------------------------------------------------------------
{ // G3 U1 quizzes[9]: "safety" glossed as "a feeling of danger" — the opposite.
  const rel = "grade-3/data/units/unit-1.json"; const u = load(rel).doc;
  edit("G3 U1 quiz 10 explanation: safety is not 'a feeling of danger'", rel, u.quizzes[9], "explanation",
    "the other three name a feeling of danger, a tool and the sky",
    "the other three name being free from danger, a tool and the sky");
}
{ // G4 U1: the lesson calls "daily" a manner adverb, marks "I daily check the mail" ✗,
  // then Activities 3 keys "daily" into "I ______ check the mail every morning".
  const rel = "grade-4/data/units/unit-1.json"; const u = load(rel).doc;
  const g = u.grammar[1];
  edit("G4 U1 grammar 2 rule: daily is a time adverb, not manner", rel, g, "ruleAndExamples",
    "Manner adverbs (clearly, quickly, neatly) follow the verb or its object: “She speaks clearly.” “He checks the mail daily.”",
    "Manner adverbs (clearly, quickly, neatly) follow the verb or its object: “She speaks clearly.” Time adverbs such as daily also go at the end: “He checks the mail daily.”");
  edit("G4 U1 grammar 2 commonMistake: 'the manner word' → daily", rel, g, "commonMistake",
    "Fix: move the manner word to the end, “I check the mail daily.” ✓",
    "Fix: move daily to the end, “I check the mail daily.” ✓");
  const a = u.activities[2];
  edit("G4 U1 Activities 3 item 1: put the blank where daily belongs", rel, a, "instructionsAndItems",
    "I ______ check the mail every morning.",
    "I check the mail ______, every single morning.");
}
{ // G4 U9 grammar[2]: "This book reads ___ (easy)" keyed "easier"; the lesson's own
  // rule (-ly adverbs take more) gives "more easily".
  const rel = "grade-4/data/units/unit-9.json"; const u = load(rel).doc;
  edit("G4 U9 grammar 3 key: easier → more easily", rel, u.grammar[2], "practice",
    "Answer key: 1) louder; 2) hardest; 3) easier.",
    "Answer key: 1) louder; 2) hardest; 3) more easily.");
}
{ // G4 U2 grammar[5] Part A item 2 "______ do you go to school?" — self-check says
  // "How (or When)", teacher copy says "Where"; all three are grammatical. Give
  // the question a clue so it has one answer, and align both keys.
  const rel = "grade-4/data/units/unit-2.json"; const u = load(rel).doc;
  const g = u.grammar[5];
  edit("G4 U2 grammar 6 Part A item 2: make the wh- question unambiguous", rel, g, "practice",
    "| ______ do you go to school? |", "| ______ do you go to school — by bus or on foot? |");
  edit("G4 U2 grammar 6 self-check key: How", rel, g, "practice",
    "Part A: 1) What, 2) How (or When), 3) Who, 4) How.", "Part A: 1) What, 2) How, 3) Who, 4) How.");
  const note = u.teacherNotes.find((n) => /Practice 6 Part A: What, (Where|How), Who, How\./.test(n.note));
  if (note) edit("G4 U2 teacher copy: Where → How", rel, note, "note",
    "Practice 6 Part A: What, Where, Who, How.", "Practice 6 Part A: What, How, Who, How.");
  else failures.push("G4 U2 teacher note not found");
}
{ // G4 U3 grammar[4]: rule covers one-syllable (-er) and three-or-more (more) only,
  // then keys one-syllable "fun" as "more fun" (which IS the standard form).
  const rel = "grade-4/data/units/unit-3.json"; const u = load(rel).doc;
  edit("G4 U3 grammar 5 rule: name 'more fun' as an exception", rel, u.grammar[4], "ruleAndExamples",
    "Two special ones: good becomes better, and bad becomes worse.",
    "Two special ones: good becomes better, and bad becomes worse. Fun is special too: we say more fun, not funner.");
}
{ // G7 U8 grammar[1] Part A item 1 "I wanted to go outside, ______ it was raining."
  // keyed "because"; the only sensible connective offered is "although".
  const rel = "grade-7/data/units/unit-8.json"; const u = load(rel).doc;
  edit("G7 U8 grammar 2 key item 1: because → although", rel, u.grammar[1], "practice",
    "Part A: 1) because 2) so that 3) therefore 4) because.",
    "Part A: 1) although 2) so that 3) therefore 4) because.");
}
{ // G6 U6 quizzes[9]: cloze says "Sarah insisted"; the story line is "Amal insisted".
  const rel = "grade-6/data/units/unit-6.json"; const u = load(rel).doc;
  const q = u.quizzes[9];
  edit("G6 U6 quiz 10 question: Sarah → Amal", rel, q, "question", "Sarah insisted.", "Amal insisted.");
  edit("G6 U6 quiz 10 explanation: Sarah → Amal", rel, q, "explanation", "Sarah insisted.", "Amal insisted.");
}
{ // G5 U6: self-check and teacher copy disagree twice; a word family names a base
  // word that does not exist.
  const rel = "grade-5/data/units/unit-6.json"; const u = load(rel).doc;
  edit("G5 U6 grammar 2 self-check item 6: and → but (contrast)", rel, u.grammar[1], "practice",
    "Part A: 1) but, 2) or, 3) yet, 4) for, 5) nor, 6) and, 7) for.",
    "Part A: 1) but, 2) or, 3) yet, 4) for, 5) nor, 6) but (and is also acceptable), 7) for.");
  const note = u.teacherNotes.find((n) => /(Furthermore|Therefore) or As a result, Meanwhile/.test(n.note));
  if (note) edit("G5 U6 teacher copy Grammar 4 item 5: Furthermore → Therefore", rel, note, "note",
    "Unfortunately, Furthermore or As a result, Meanwhile.", "Unfortunately, Therefore or As a result, Meanwhile.");
  else failures.push("G5 U6 teacher note not found");
  edit("G5 U6 Activities 4: 'vince' is not a word", rel, u.activities[3], "answerSummary",
    "vince with invincibility",
    "invincible with invincibility and invincibly (it has no shorter everyday base word — it comes from Latin vincere, to conquer)");
}
{ // G5 U8 Activities 1 asks for a superlative in "Save Our School Garden!"; the
  // poster has none (its own key admits it) but does have a comparative.
  const rel = "grade-5/data/units/unit-8.json"; const u = load(rel).doc;
  edit("G5 U8 Activities 1: superlative → comparative", rel, u.activities[0], "instructionsAndItems",
    "Superlative adjective", "Comparative adjective");
  edit("G5 U8 answer key 1: comparative example", rel, u.answerKey[0], "answerOrGuidance",
    "Superlative: \"the best idea\" is not present, so accept \"more magnificent than any poster\" only if the learner explains it is comparative.",
    "Comparative: \"more magnificent than any poster could\".");
}
{ // G3 placement Q2: two options differ only by a full stop.
  const rel = "grade-3/data/placement-exam.json"; const d = load(rel).doc;
  const q = d.questions[1];
  edit("G3 placement Q2: replace the stop-only distractor", rel, q, "options",
    "She likes mangoes | She like mangoes.", "She is likes mangoes. | She like mangoes.");
  edit("G3 placement Q2 explanation", rel, q, "explanation",
    "With he or she we add -s to the verb, and a sentence ends with a full stop: 'She likes mangoes.'",
    "With he or she we add -s to the verb, and we do not put 'is' before it: 'She likes mangoes.'");
}
{ // G1 U6 comprehension[5]: "Why did Selma say 'thank you'?" — she never does; she
  // says "We must be thankful for our wonderful senses."
  const rel = "grade-1/data/units/unit-6.json"; const u = load(rel).doc;
  const c = u.comprehension[5];
  set("G1 U6 comprehension 6 question", rel, c, "question", "What did Selma say we must be thankful for?");
  set("G1 U6 comprehension 6 answer", rel, c, "correctAnswer", "Our wonderful senses");
  const ak = u.answerKey.find((a) => /^Answer: (To give thanks for their|Our) wonderful senses\./.test(a.answerOrGuidance));
  if (ak) edit("G1 U6 answer key: match the reworded question", rel, ak, "answerOrGuidance",
    "Answer: To give thanks for their wonderful senses.", "Answer: Our wonderful senses.");
  else failures.push("G1 U6 answer key line not found");
}
{ // G2 U5 comprehension[0]: "a book is a rectangle" — the story says the DOOR is.
  const rel = "grade-2/data/units/unit-5.json"; const u = load(rel).doc;
  const c = u.comprehension[0];
  set("G2 U5 comprehension 1 question", rel, c, "question", "What shape is the sun in this text, and what shape is the door?");
  set("G2 U5 comprehension 1 answer", rel, c, "correctAnswer", "The sun is a circle and the door is a rectangle.");
  set("G2 U5 comprehension 1 explanation", rel, c, "explanation", "Amal says the sun is a circle, and Leo says the door is a rectangle because two of its sides are longer than the other two.");
  edit("G2 U5 answer key 8", rel, u.answerKey[7], "answerOrGuidance",
    "The sun is a circle and a book is a rectangle.", "The sun is a circle and the door is a rectangle.");
}

// ---------------------------------------------------------------------------
// Vocabulary links pointing at the WRONG dictionary entry. The unit teaches
// citizen / settler / dutiful (its ids, audio, quizzes and readings all say
// so) but the link's dictionaryEntryId is explorer / nomad / faithful, so the
// word card shows that word and plays its audio over the right meaning. The
// grade dictionaries have no entry for the taught word, so one is added.
// The Grade 4 dictionary already has a citizen.mp3 by the same voice; it is
// copied. settler and dutiful get a pending audio descriptor.
function addEntry(grade, word, pos, meaning, audioReady) {
  const rel = `grade-${grade}/data/master-dictionary.grade${grade}.json`; const d = load(rel).doc;
  const id = `ehel-dict-en-${word}-${pos}-01`;
  if (d.entries.some((e) => e.dictionaryEntryId === id)) { already += 1; return id; }
  const audioPath = `./media/audio/grade-${grade}/dictionary/${word}.mp3`;
  d.entries.push({
    dictionaryEntryId: id, senseId: `${id}-sense-01`, language: "en-GB", lemma: word, displayWord: word,
    partOfSpeech: pos, sourceType: pos,
    partOfSpeechDefinition: pos === "noun" ? "Names a person, place, thing or idea." : "Describes a noun.",
    canonicalMeaning: meaning, pronunciationText: "Listen, then repeat",
    audio: { provider: "ElevenLabs", voiceId: "XfNU2rGpBa01ckF309OY", model: "eleven_multilingual_v2",
      normal: audioPath, slow: audioPath, slowPlaybackRate: 0.76, cueStart: 0, cueEnd: null,
      available: audioReady, status: audioReady ? "Generated" : "Pending generation" },
    status: "approved",
  });
  load(rel).dirty = true; applied += 1; console.log(`✔ dictionary grade-${grade}: added ${word}`);
  return id;
}
function repoint(rel, vocabularyId, entryId) {
  const u = load(rel).doc;
  const link = u.dictionaryLinks.find((l) => l.vocabularyId === vocabularyId);
  if (!link) { failures.push(`${rel}: link ${vocabularyId} not found`); return; }
  if (link.dictionaryEntryId === entryId) { already += 1; return; }
  link.dictionaryEntryId = entryId; link.senseId = `${entryId}-sense-01`;
  load(rel).dirty = true; applied += 1; console.log(`✔ ${rel}: ${vocabularyId} → ${entryId}`);
}
{
  const g6citizen = path.join(ENGLISH, "media/audio/grade-6/dictionary/citizen.mp3");
  const g4citizen = path.join(ENGLISH, "media/audio/grade-4/dictionary/citizen.mp3");
  let citizenReady = fs.existsSync(g6citizen);
  if (!citizenReady && fs.existsSync(g4citizen)) {
    if (!DRY) fs.copyFileSync(g4citizen, g6citizen);
    citizenReady = true; console.log("✔ copied grade-4 citizen.mp3 to grade-6");
  }
  const citizen = addEntry(6, "citizen", "noun", "A person who legally belongs to a country and shares its rights and duties.", citizenReady);
  const settler = addEntry(6, "settler", "noun", "A person who moves to a new region to live there and build a home.", fs.existsSync(path.join(ENGLISH, "media/audio/grade-6/dictionary/settler.mp3")));
  const dutiful = addEntry(5, "dutiful", "adjective", "Doing carefully and loyally the things you are trusted to do.", fs.existsSync(path.join(ENGLISH, "media/audio/grade-5/dictionary/dutiful.mp3")));
  repoint("grade-6/data/units/unit-1.json", "u1-g1-2-citizen", citizen);
  repoint("grade-6/data/units/unit-1.json", "u1-g1-10-settler", settler);
  repoint("grade-6/data/units/unit-10.json", "u10-g1-2-citizen", citizen);
  repoint("grade-5/data/units/unit-4.json", "u4-g3-2-dutiful", dutiful);
}

// ---------------------------------------------------------------------------
// Grade 1 final quiz. Q2–Q10 ("Which word belongs to family members? mother |
// father | dad | sister") and Q12–Q20 / Q22–Q30 ("Which is a useful complete
// pattern for Family Time?") offered four options that ALL belong to the named
// unit and keyed the first. Distractors are re-drawn from OTHER units — for the
// pattern questions, from patterns that are not also taught in the named unit
// (This is a ___. belongs to three units), so exactly one option fits.
{
  const rel = "grade-1/data/course-final-quiz.json"; const d = load(rel).doc;
  const qs = d.questions;
  const words = qs.slice(1, 10); // Q2..Q10, one category each
  words.forEach((q, i) => {
    const others = words.filter((_, j) => j !== i).map((o) => o.correctAnswer);
    const distractors = [others[i % others.length], others[(i + 3) % others.length], others[(i + 6) % others.length]];
    const options = [q.correctAnswer, ...distractors].join(" | ");
    const category = /belongs to (.+)\?$/.exec(q.question)[1];
    set(`G1 final quiz Q${i + 2} options`, rel, q, "options", options);
    set(`G1 final quiz Q${i + 2} explanation`, rel, q, "explanation",
      `${q.correctAnswer} is one of the Unit words for ${category}; ${distractors.join(", ")} come from other units.`);
  });
  const patterns = qs.filter((q) => /useful complete pattern/.test(q.question));
  const own = new Map(); // unit title → every pattern the unit itself teaches
  for (const q of patterns) {
    const unit = q.sourceUnitTitle;
    const set_ = own.get(unit) || new Set();
    for (const o of q.options.split(" | ")) set_.add(o.trim());
    set_.add(q.correctAnswer);
    own.set(unit, set_);
  }
  patterns.forEach((q, i) => {
    const unit = q.sourceUnitTitle;
    const pool = patterns.filter((o) => o.sourceUnitTitle !== unit && !own.get(unit).has(o.correctAnswer)).map((o) => o.correctAnswer);
    const unique = [...new Set(pool)];
    const distractors = [unique[i % unique.length], unique[(i + 4) % unique.length], unique[(i + 8) % unique.length]];
    set(`G1 final quiz pattern Q${qs.indexOf(q) + 1} question`, rel, q, "question", `Which sentence pattern comes from ${unit}?`);
    set(`G1 final quiz pattern Q${qs.indexOf(q) + 1} options`, rel, q, "options", [q.correctAnswer, ...distractors].join(" | "));
    set(`G1 final quiz pattern Q${qs.indexOf(q) + 1} explanation`, rel, q, "explanation",
      `${q.correctAnswer} is a ${unit} pattern; the other three come from other units.`);
  });
}

// ---------------------------------------------------------------------------
for (const [rel, f] of files) {
  if (!f.dirty) continue;
  if (!DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw), "utf8");
}
console.log(JSON.stringify({ dry: DRY, applied, alreadyApplied: already, failures: failures.length }));
for (const f of failures) console.error("✘ " + f);
if (failures.length) process.exit(1);
