#!/usr/bin/env node
// Proofread a grade's Core-word content ACROSS words, not one word at a time.
//
// check-english-core-words-authored.mjs judges each word alone: does the
// sentence contain the headword, is it inside the length cap, does the meaning
// end in a full stop. Every one of those can pass on all 412 words while the SET
// is still wrong, because the faults that matter at this scale are relations
// between cards:
//
//   - two words given the same meaning, so the learner cannot tell them apart;
//   - a meaning that leans on another Core word from the same grade, which is
//     either unread (taught later) or pre-empted (taught here);
//   - the same sentence used for two different words;
//   - five sentences that are all the same shape, so the set drills one pattern;
//   - a sentence opening with a pronoun that has no referent on the card, which
//     reads fine in the passage it was mined from and nowhere else.
//
// None of these is detectable from a single word, which is why they survived a
// clean per-word run.
//
//   node tools/proofread-english-core-words.mjs --grade 4
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "english");
const argv = process.argv.slice(2);
let GRADE = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--grade") { GRADE = Number(argv[++i]); continue; }
  console.error(`Unrecognised argument: ${argv[i]}`);
  process.exit(2);
}
if (!Number.isInteger(GRADE) || GRADE < 1 || GRADE > 8) {
  console.error("--grade N is required (1-8)");
  process.exit(2);
}
const DATA = path.join(ROOT, `grade-${GRADE}`, "data");

// Read the BUILT units, so this proofreads what a learner will actually meet
// rather than the authoring file it came from.
const cards = [];
for (let u = 1; u <= 10; u++) {
  const f = path.join(DATA, "units", `unit-${u}.json`);
  if (!fs.existsSync(f)) continue;
  const doc = JSON.parse(fs.readFileSync(f, "utf8"));
  const core = new Set(doc.vocabularyGroups.filter((g) => g.strand && g.strand !== "glossary").map((g) => g.id));
  for (const l of doc.dictionaryLinks || []) {
    if (!core.has(l.groupId)) continue;
    cards.push({ unit: u, word: l.masterWord, meaning: l.childMeaning || "", sentences: l.practiceSentences || [] });
  }
}
// A grade whose Core words have not been BUILT yet has no core groups in its
// unit files, so this walk finds nothing and every check below passes over an
// empty set. Run against Grade 5 before its build, it printed "cards: 0 |
// total findings: 0", which reads exactly like a clean grade. Refusing is the
// only honest answer: this repo has several entries about a tick printed over
// a comparison that never ran, and this would have been another.
if (!cards.length) {
  console.error(`No Core-word cards found for grade ${GRADE}.`);
  console.error("Its unit files carry no groups with a `strand`, which means the Core words");
  console.error("have not been built yet. Run: node tools/build-english-core-words.mjs --grade "
    + GRADE + " --write");
  console.error("Reporting zero findings over zero cards would be a pass that tested nothing.");
  process.exit(2);
}

const wordSet = new Set(cards.map((c) => c.word));
const unitOf = new Map(cards.map((c) => [c.word, c.unit]));
const findings = [];
const add = (kind, detail) => findings.push({ kind, detail });

// ---- 1. two words sharing a meaning -----------------------------------------
const byMeaning = new Map();
for (const c of cards) {
  const key = c.meaning.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  if (!key) continue;
  (byMeaning.get(key) ?? byMeaning.set(key, []).get(key)).push(c);
}
for (const [, group] of byMeaning) {
  if (group.length > 1) add("same meaning", `${group.map((c) => `${c.word} (u${c.unit})`).join(" = ")}  — "${group[0].meaning}"`);
}

// ---- 2. a meaning that uses another Core word of this grade -------------------
// Only flagged where the other word is a CONTENT word; the closed-class ones
// (and, the, of) are unavoidable and carry no teaching weight.
const CLOSED = new Set(("a an the and or but if of to in on at for with from by as is are was were be been am "
  + "do does did have has had can will would should could may might must not no yes it its this that these those "
  + "you your he she they them their we us our i me my him her his so than then when where how what which who "
  + "there here more most much many some all one two up down out off over under about into").split(" "));
for (const c of cards) {
  const used = (c.meaning.toLowerCase().match(/[a-z-]+/g) || [])
    .filter((w) => w !== c.word && !CLOSED.has(w) && wordSet.has(w));
  for (const w of used) {
    const other = unitOf.get(w);
    const when = other > c.unit ? `taught LATER, unit ${other}` : other === c.unit ? `SAME unit` : `unit ${other}`;
    add("meaning uses a Core word", `${c.word} (u${c.unit}) uses "${w}" — ${when}\n      "${c.meaning}"`);
  }
}

// ---- 3. the same sentence on two cards ---------------------------------------
const bySentence = new Map();
for (const c of cards) for (const s of c.sentences) {
  const k = s.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  (bySentence.get(k) ?? bySentence.set(k, []).get(k)).push(c.word);
}
for (const [, ws] of bySentence) {
  if (new Set(ws).size > 1) add("shared sentence", `${[...new Set(ws)].join(" / ")}`);
}

// ---- 4. a set of five that is all one shape ----------------------------------
// The authored sets deliberately vary: a statement, a question, a third-person
// example, a quoted or named one, a first-person one. Five openings that are all
// the same word drill a pattern instead of the vocabulary.
for (const c of cards) {
  if (c.sentences.length < 5) continue;
  const opens = c.sentences.map((s) => s.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ""));
  const uniq = new Set(opens);
  if (uniq.size <= 2) add("set lacks variety", `${c.word} (u${c.unit}) — every sentence opens with ${[...uniq].map((x) => `"${x}"`).join(" / ")}`);
  if (!c.sentences.some((s) => s.trim().endsWith("?"))) add("no question", `${c.word} (u${c.unit}) — none of the five is a question`);
}

// ---- 5. a sentence that cannot stand alone -----------------------------------
// A card shows one sentence at a time, so an opening pronoun has nothing to
// refer to. This is the shape mined sentences arrive in.
// THERE IS NO PRONOUN CHECK HERE, and the absence is deliberate.
//
// One was written and removed. It flagged any sentence opening with a pronoun,
// on the theory that a card shows one sentence at a time so the pronoun has
// nothing to refer to. It returned 160 hits. Exempting the determiner reading
// ("This application helps you…", which names its subject in the very next word)
// and the impersonal `it` ("It is likely that the river will rise") brought that
// to 84 — and those 84 were still correct English: "She showed great courage
// during the storm", "He gave professional advice about the roof". A generic
// pronoun subject is how dictionary examples have always been written, and it
// needs no antecedent because it refers to no one in particular.
//
// So the premise was wrong, not the threshold, and no amount of narrowing would
// have reached a true positive. Recorded rather than quietly deleted because two
// earlier checks in this family failed the same way — the -ies plurals and the
// hyphenated headword, both of which accused correct content — and the pattern
// worth remembering is that all three came from a rule about FORM applied to
// text whose correctness is a matter of MEANING.

// ---- report ------------------------------------------------------------------
console.log(`Grade ${GRADE} Core words — cross-card proofread`);
console.log(`  cards: ${cards.length}\n`);
const byKind = new Map();
for (const f of findings) (byKind.get(f.kind) ?? byKind.set(f.kind, []).get(f.kind)).push(f.detail);
for (const [kind, list] of byKind) {
  console.log(`${kind} (${list.length})`);
  for (const d of list) console.log(`    ${d}`);
  console.log("");
}
console.log(`total findings: ${findings.length}`);
