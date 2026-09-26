// Gate the Thinking-and-Working-Mathematically tags in Mathematics.
//
// WHY THIS EXISTS. 145 worked examples across Grades 6-8 carry a `twm` tag, the
// shell renders it on the learner's screen (`Thinking: ${item.twm}` in
// shell/subjects/mathematics.js), and until 2026-09-26 NOTHING in this repo read
// it. Not a gate, not a builder, not the content model. That is the shape
// CLAUDE.md keeps describing: a value that ships to a child, spelled by hand,
// with no check on what it says.
//
// It was found by being handed the Stage 9 Teacher's Resource and comparing its
// vocabulary against the tags in the tree - which turned up "critiquing
// improving" on six examples, the pair's name with the conjunction dropped,
// rendering as two words jammed together. A gate would have caught that on the
// day it was written.
//
// WHAT IT CHECKS, and what it deliberately does not:
//
//   1. Every tag is one of Cambridge's eight characteristics, or one of the four
//      pair names written as Cambridge writes them. This is a SPELLING check and
//      it is the one that catches the defect above.
//   2. Per-grade coverage may not fall below the recorded floor.
//   3. Grades 1-4 are expected to carry NONE, and that is asserted rather than
//      assumed - the tags are deliberately an upper-stage feature, so a tag
//      appearing at Grade 2 is a question, not a silent improvement.
//
// It does NOT check that a tag is the RIGHT characteristic for its example.
// Nothing can: that is a reading of the mathematics against the prompt, and the
// repo's own lesson is that a coverage number is not evidence of aptness. Four
// of the six jammed tags were on examples that ask for one characteristic and
// were labelled with two, and only a person reading the prompts found that.
//
//   node tools/check-ehel-math-twm.mjs
//   node tools/check-ehel-math-twm.mjs --list      # every tag, by grade

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const MATH = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy", "mathematics");
const LIST = process.argv.includes("--list");

// Cambridge's eight, in their four pairs. The Stage 9 Teacher's Resource names
// the pairs as its own section headings ("Characterising and classifying",
// "Critiquing and improving"), which is where the pair spellings come from.
const PAIRS = [
  ["specialising", "generalising"],
  ["conjecturing", "convincing"],
  ["characterising", "classifying"],
  ["critiquing", "improving"],
];
const SINGLES = PAIRS.flat();
const PAIR_NAMES = PAIRS.map(([a, b]) => a + " and " + b);
const VALID = new Set([...SINGLES, ...PAIR_NAMES]);

// Coverage floors. These may fall only with a reason; they exist because a
// builder that quietly stops emitting the tag is otherwise invisible.
//
// Set to the measured values on 2026-09-26. NOTE they are NOT "whatever was
// there before the last thing I added" - CLAUDE.md calls that a formality. Grade
// 9's floor is 24, which is what its three authored units carry, so a fourth
// unit shipping untagged does not lower the total and the floor cannot be met by
// accident. Grades 6-8 are at their full measured counts.
const FLOORS = { 6: 44, 7: 53, 8: 48, 9: 24 };
// Grades 1-4 carry none by design - the tags are an upper-stage feature.
const EXPECT_NONE = [1, 2, 3, 4];

const failures = [];
const notes = [];
const counts = new Map();
const usage = new Map();
const rows = [];

for (let grade = 1; grade <= 9; grade += 1) {
  const dir = path.join(MATH, `grade-${grade}`, "data", "units");
  counts.set(grade, 0);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    for (const w of unit.workedExamples || []) {
      if (!Object.prototype.hasOwnProperty.call(w, "twm")) continue;
      const tag = w.twm;
      const where = `grade-${grade}/${file} ${w.id}`;
      if (typeof tag !== "string" || !tag.trim()) {
        failures.push(`${where}: twm is present but empty`);
        continue;
      }
      counts.set(grade, counts.get(grade) + 1);
      usage.set(tag, (usage.get(tag) || 0) + 1);
      rows.push([grade, where, tag, w.title]);
      if (!VALID.has(tag)) {
        // name the likely intent, so the message is actionable rather than just a refusal
        const words = tag.toLowerCase().split(/\s+/).filter((x) => SINGLES.includes(x));
        const guess = words.length === 2 ? `  (did you mean "${words[0]} and ${words[1]}"?)` : "";
        failures.push(`${where}: "${tag}" is not a Cambridge characteristic or pair name${guess}`);
      }
    }
  }
}

for (const grade of EXPECT_NONE) {
  if (counts.get(grade)) {
    failures.push(`grade-${grade} carries ${counts.get(grade)} twm tag(s). Grades 1-4 are expected to `
      + "carry none — the tags are an upper-stage feature. If that has changed, say so here.");
  }
}
for (const [grade, floor] of Object.entries(FLOORS)) {
  const got = counts.get(Number(grade)) || 0;
  if (got < floor) {
    failures.push(`grade-${grade} has ${got} twm tag(s), below its floor of ${floor}. `
      + "This number may fall only with a stated reason.");
  }
}

// A characteristic nobody uses is worth SAYING, never failing on: which ones a
// course reaches is a curriculum decision, not a defect. Reported because it is
// invisible otherwise — "conjecturing" was used zero times in 145 tags.
const unused = SINGLES.filter((c) => ![...usage.keys()].some((t) => t === c || t.startsWith(c + " and ") || t.endsWith(" and " + c)));
if (unused.length) notes.push("never used anywhere in Mathematics: " + unused.join(", "));

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(`math twm: ${total} tagged worked example(s) across Mathematics`);
for (let g = 1; g <= 9; g += 1) {
  const n = counts.get(g) || 0;
  if (!n && EXPECT_NONE.includes(g)) continue;
  console.log(`   grade-${g}: ${n}` + (FLOORS[g] ? ` (floor ${FLOORS[g]})` : ""));
}
for (const [tag, n] of [...usage].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)}  ${tag}`);
for (const note of notes) console.log(`   note: ${note}`);
if (LIST) for (const [, where, tag, title] of rows) console.log(`      ${where}  ${tag}  — ${title}`);

if (failures.length) {
  console.error(`✗ ${failures.length} math twm failure(s):`);
  for (const line of failures.slice(0, 30)) console.error(`   ${line}`);
  process.exitCode = 1;
} else {
  console.log("✓ math twm: every tag is a Cambridge characteristic or pair name; coverage at or above floor");
}
