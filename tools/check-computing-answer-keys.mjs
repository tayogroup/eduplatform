// Hold every booklet-derived Computing quiz key to the booklet's own answer key.
//
// Three keys shipped bound to the wrong option — "which shape is used for a
// decision?" keyed oval, "which of these is an integer?" keyed 3.14, "which is
// an OUTPUT on a micro:bit?" keyed the shake sensor. Each question's own
// explanation named the right one, so the fault was the binding, not the
// teaching, and a learner who knew the answer was told they did not. Nothing in
// the build or the review flow compared a key against the booklet it came from,
// so all three passed every gate.
//
// Only booklet-derived questions are checked, and that is most of the surface
// worth checking. The rest are built from the unit's own content —
//
//   "Which of these describes “X”?"          from concepts
//   "What should you do when this happens:"  from the debugging table
//   "What does “X” mean in computing?"       from the glossary
//
// — as `options: [row.answer, ...distractors], answer: row.answer`. The key is
// the object the question was generated from, so it cannot disagree with itself
// and there is no external key to compare it to.
//
// GROUND TRUTH lives in a committed fixture, not in the content model.
// outputs/ is gitignored, so a gate reading the model directly would find
// nothing on a fresh clone and pass without checking anything. The fixture is
// generated from the model with --write-fixture, and whenever the model IS
// present this gate re-derives the keys and fails if the fixture has drifted
// from it — so the committed copy cannot quietly go stale.
//
// Usage: node tools/check-computing-answer-keys.mjs [--write-fixture]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMP = path.join(ROOT, "src", "prototypes", "ehel-academy", "computing");
const MODEL = path.join(ROOT, "outputs", "computing-content", "computing-content-model.json");
const FIXTURE = path.join(COMP, "data", "booklet-answer-keys.json");
const WRITE = process.argv.includes("--write-fixture");

// Compared on letters and digits alone. The booklets and the build disagree on
// smart quotes, en dashes and trailing full stops in ways that mean nothing.
const norm = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, "-")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

// Questions the builder writes from the unit's own content; they carry no
// booklet key and cannot be wrong against one.
const SYNTHESISED = [
  /^Which of these describes [“"]/,
  /^What should you do when this happens:/,
  /^What does\s+[“"].+[”"]\s+mean in computing\?/i,
  /^Which computing word matches this meaning:/i,
];
const isSynthesised = (question) => SYNTHESISED.some((pattern) => pattern.test(question || ""));

// ---------------------------------------------------------------- source side
// Every shape these packs actually use — each one was found by a unit going
// unchecked, so narrowing any of them silently drops that unit from the gate.
const KEY_MARKER = /^(full\s+|complete\s+)?answer\s*keys?\b/i;
const KEY_SECTION = /answer\s*keys?\b|\(\s*(?:model\s+)?answers?\b/i;
const SECTION_LETTER = /section\s+([a-e])\b/i;
// "1 (b) x" · "1: (c) x" · "1. (b) x"
const KEY_NUMBERED = /^\s*(\d{1,2})\s*[:.)\-–—]?\s*\(?\s*([a-j])\s*[)\.]\s*(.*)$/i;
// "(b) x" · "B - x" — no number, so it binds by position in the key run
const KEY_LETTER = /^\s*\(?\s*([a-j])\s*[)\.\-–—]\s*(.+)$/i;
// "Practice 1: a tablet." · "1. To assign means …"
const KEY_PROSE = /^\s*(?:practice\s+)?(\d{1,2})\s*[:.)]\s*(.+)$/i;
const NUMBERED_Q = /^\s*(\d{1,2})\s*[.):]\s*(.+)$/;
// Option markers appear as "(a) x", "a) x" and "A) x" across the packs.
const OPTION_MARK = /(?:\(([a-d])\)|(?<![A-Za-z])([a-d])\))\s*/gi;

function parseQuestion(text) {
  const marks = [];
  let expect = "a";
  for (const match of text.matchAll(OPTION_MARK)) {
    const letter = (match[1] || match[2]).toLowerCase();
    if (letter !== expect) continue;                  // only an ascending a,b,c,d run
    marks.push({ start: match.index, end: match.index + match[0].length });
    expect = String.fromCharCode(expect.charCodeAt(0) + 1);
  }
  if (marks.length < 2) return null;
  const stem = text.slice(0, marks[0].start).trim();
  if (stem.length < 8 || !isRealStem(stem)) return null;
  const options = marks.map((mark, index) =>
    text.slice(mark.end, index + 1 < marks.length ? marks[index + 1].start : text.length).trim());
  return { stem, options };
}

const sectionOf = (name) => (SECTION_LETTER.exec(name || "") || [, "?"])[1].toLowerCase();

// The booklets print write-in lines as a run of underscores, and numbered ones
// ("2. ____________") parse as a question whose stem normalises to nothing.
// Two of those in one unit collide on the empty string and take whichever key
// the section order happened to reach first, which is a fixture that changes
// under a rebuild that changed nothing.
// Counting words rejected "Bandwidth is:", "Encryption means:" and "Phishing
// is:" — real two-word stems. Dropping a question shifts every later one
// against a positional key run, which is how a stem ends up carrying a
// different question's answer. Ask only for some actual letters.
const isRealStem = (stem) => {
  const clean = norm(stem);
  return clean.length >= 6 && /[a-z]{3}/.test(clean);
};

// -> Map("<grade>/<unit>" -> [{ stem, answer }])
function keysFromModel(model) {
  const out = new Map();
  const skipped = [];
  for (const grade of Object.keys(model.grades)) {
    const documents = model.grades[grade].documents || [];
    const units = [...new Set(documents.map((document) => document.unit))].filter(Boolean);
    for (const unit of units) {
      const questions = new Map();   // section -> [{stem, options}]
      const numbered = new Map();    // section -> Map(n -> stem)
      const keys = new Map();        // section -> {numbered, ordered, prose}
      const bucket = (map, section, make) => {
        if (!map.has(section)) map.set(section, make());
        return map.get(section);
      };
      for (const document of documents) {
        if (document.unit !== unit) continue;
        if (document.document_type !== "Practice" && document.document_type !== "Lesson") continue;
        const blocks = document.blocks || [];
        // One layout gives the key run the SAME section name as the questions,
        // so the two are separable only by where they start.
        let start = blocks.findIndex((block) =>
          KEY_MARKER.test((block.text || "").trim()) || KEY_SECTION.test(block.section || ""));
        if (start < 0) start = blocks.length;
        blocks.forEach((block, index) => {
          const text = (block.text || "").trim();
          if (!text) return;
          const section = sectionOf(block.section);
          const inKey = index >= start || KEY_SECTION.test(block.section || "");
          if (inKey) {
            if (KEY_MARKER.test(text) || text.length < 12) return;
            const store = bucket(keys, section, () => ({ numbered: new Map(), ordered: [], prose: new Map() }));
            let match = KEY_NUMBERED.exec(text);
            if (match) {
              store.numbered.set(Number(match[1]), { letter: match[2].toLowerCase(), stated: match[3].trim() });
              store.ordered.push({ letter: match[2].toLowerCase(), stated: match[3].trim() });
              return;
            }
            match = KEY_LETTER.exec(text);
            if (match && match[2].trim().length > 4) {
              store.ordered.push({ letter: match[1].toLowerCase(), stated: match[2].trim() });
              return;
            }
            match = KEY_PROSE.exec(text);
            if (match) store.prose.set(Number(match[1]), match[2].trim());
            return;
          }
          const parsed = parseQuestion(text);
          if (parsed) {
            bucket(questions, section, () => []).push(parsed);
            return;
          }
          const match = NUMBERED_Q.exec(text);
          if (match && /practice|question/i.test(block.section || "") && isRealStem(match[2])) {
            bucket(numbered, section, () => new Map())
              .set(Number(match[1]), match[2].trim());
          }
        });
      }
      // pair each question with its section's key
      const paired = [];
      const resolve = (section, n, source) => {
        const store = keys.get(section);
        if (!store) return null;
        // A key that states its own number beats one found by position: a
        // fill-in-the-blank answer ("a) Your home address is …") parses as a
        // letter key and, taken positionally, displaces the real key for Q1.
        let entry = store.numbered.get(n) || null;
        const prose = store.prose.get(n);
        if (!entry && prose === undefined && n >= 1 && n <= store.ordered.length) entry = store.ordered[n - 1];
        if (entry) {
          const position = entry.letter.charCodeAt(0) - 97;
          const byLetter = source.options[position];
          if (byLetter) return byLetter;
          return String(entry.stated || "").split(/[.;]/)[0].trim() || null;
        }
        return prose === undefined ? null : String(prose).replace(/\.$/, "");
      };
      for (const [section, list] of questions) {
        // An unnumbered key run binds by position, so it is only trustworthy
        // when the two runs are the same length. One question that fails to
        // parse shifts every later answer onto the wrong question and the
        // fixture then asserts, with total confidence, the wrong key. A gap is
        // recoverable; wrong ground truth in the gate is not.
        const store = keys.get(section);
        const positional = store && store.numbered.size === 0 && store.prose.size === 0;
        if (positional && store.ordered.length !== list.length) {
          skipped.push(`${grade}/${unit} section ${section}: ${list.length} questions vs `
            + `${store.ordered.length} unnumbered key lines — not paired`);
          continue;
        }
        list.forEach((source, index) => {
          const answer = resolve(section, index + 1, source);
          if (answer) paired.push({ stem: source.stem, answer });
        });
      }
      for (const [section, map] of numbered) {
        for (const [n, rawStem] of map) {
          const stem = rawStem.replace(/\s*(circle one\.?|true\s*\/\s*false)\s*$/i, "").trim();
          const answer = resolve(section, n, { options: [] });
          if (answer) paired.push({ stem, answer });
        }
      }
      if (paired.length) out.set(`${grade}/${unit}`, paired);
    }
  }
  return { keys: out, skipped };
}

// ---------------------------------------------------------------- fixture I/O
const toFixture = (map) => ({
  note: "Booklet answer keys for every Computing unit, extracted from the source "
      + "Practice & Quiz and Teacher Guide documents. Ground truth for "
      + "tools/check-computing-answer-keys.mjs. Regenerate with --write-fixture "
      + "after re-running extract:computing-content.",
  generatedFrom: "outputs/computing-content/computing-content-model.json",
  units: Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))),
});

let model = null;
if (fs.existsSync(MODEL)) model = JSON.parse(fs.readFileSync(MODEL, "utf8"));

if (WRITE) {
  if (!model) {
    console.error(`✗ cannot write the fixture: ${path.relative(ROOT, MODEL)} is missing. `
      + "Run npm run extract:computing-content first.");
    process.exit(1);
  }
  const { keys: derived, skipped } = keysFromModel(model);
  for (const line of skipped) console.log(`   skipped ${line}`);
  fs.writeFileSync(FIXTURE, `${JSON.stringify(toFixture(derived), null, 1)}\n`, "utf8");
  const total = [...derived.values()].reduce((sum, list) => sum + list.length, 0);
  console.log(`wrote ${path.relative(ROOT, FIXTURE)}: ${derived.size} units, ${total} booklet answers`);
  process.exit(0);
}

if (!fs.existsSync(FIXTURE)) {
  console.error(`✗ ${path.relative(ROOT, FIXTURE)} is missing — regenerate it with `
    + "node tools/check-computing-answer-keys.mjs --write-fixture");
  process.exit(1);
}
const fixture = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
const expected = new Map(Object.entries(fixture.units || {}).map(([key, list]) => [key, list]));

const failures = [];
const warnings = [];

// When the model is on this machine, prove the committed fixture still matches
// it. Without this the fixture is a snapshot nothing ever re-checks.
if (model) {
  const { keys: derived } = keysFromModel(model);
  const drift = [];
  for (const [unit, list] of derived) {
    const have = new Map((expected.get(unit) || []).map((row) => [norm(row.stem), row.answer]));
    for (const row of list) {
      const mine = have.get(norm(row.stem));
      if (mine === undefined) drift.push(`${unit}: "${row.stem.slice(0, 60)}" missing from the fixture`);
      else if (norm(mine) !== norm(row.answer)) drift.push(`${unit}: "${row.stem.slice(0, 50)}" fixture=${mine!== undefined ? JSON.stringify(mine) : "-"} model=${JSON.stringify(row.answer)}`);
    }
  }
  if (drift.length) {
    failures.push(`the fixture no longer matches the content model (${drift.length} difference(s)) — `
      + "regenerate it with --write-fixture:");
    for (const line of drift.slice(0, 8)) failures.push(`   ${line}`);
  }
}

let checked = 0;
let synthesised = 0;
let unverified = 0;
for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(COMP, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    const unitNo = Number(/unit-(\d+)/.exec(file)?.[1]);
    const built = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const book = new Map((expected.get(`${grade}/${unitNo}`) || []).map((row) => [norm(row.stem), row.answer]));
    for (const question of (built.assessment || {}).questions || []) {
      if (isSynthesised(question.question)) { synthesised += 1; continue; }
      const want = book.get(norm(question.question));
      if (want === undefined) { unverified += 1; continue; }
      checked += 1;
      const got = norm(question.answer);
      const target = norm(want);
      const agrees = got === target
        || (target.length > 3 && (target.includes(got) || got.includes(target)));
      if (!agrees) {
        failures.push(`grade-${grade}/unit-${unitNo} ${question.id}: key ${JSON.stringify(question.answer)} `
          + `but the booklet says ${JSON.stringify(want)} — ${question.question.slice(0, 70)}`);
      }
    }
  }
}

if (!checked) {
  console.error("✗ computing answer keys: nothing was compared — the fixture and the built "
    + "questions no longer share any question text, so this gate is checking nothing.");
  process.exit(1);
}
if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const line of warnings) console.log(`   ${line}`);
}
if (failures.length) {
  console.error(`✗ ${failures.length} computing answer-key failure(s):`);
  for (const line of failures) console.error(`   ${line}`);
  process.exit(1);
}
console.log(`✓ computing answer keys: ${checked} booklet-derived keys match the booklet`
  + ` (${synthesised} built from the unit's own content, ${unverified} with no booklet key)`);
