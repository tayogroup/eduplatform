#!/usr/bin/env node
// The Grade 1-4 activity slide turns an activity's instruction into steps a
// learner ticks off, and the split that produces them is the one thing on that
// slide that can go wrong quietly.
//
// Two failure shapes, and only one of them is visible without this gate. A
// parser that stops matching degrades GRACEFULLY — every activity falls back to
// the single-block branch, the slide still renders, and the section simply
// stops being a checklist without anything saying so. That is the shape this
// repo keeps rediscovering: a feature that is green because it did no work. So
// coverage carries a floor, per grade, and the floor may rise and never fall.
//
// The other shape is worse and is not graceful: a split that drops words. A
// step whose text is empty, or an instruction whose closing sentence lands
// nowhere, is a child being asked to do a task the screen no longer states.
// Nothing about that is visible from the outside — the slide looks complete —
// so every activity is checked for it rather than sampled.
//
// Mutation-tested nine ways. Caught: removing the inline pass (grade 1 falls to
// 0), raising the newline floor, a marker strip that eats two extra characters,
// renaming either extracted function, dropping the strict key pattern (46 keyed
// activities fall to 41), and removing the key run's ascending check.
//
// Two survive, and they are opposite cases worth telling apart before anyone
// chases them again:
//
//   NO-OP. Dropping `text: … || line` and loosening the key count to
//   `marks.length < wanted` both change nothing, because the content has 0
//   item lines that are only a marker and 0 key runs longer than their step
//   list. The assertions that would catch them are written; there is simply
//   nothing to catch yet. Both are for future content.
//
//   A REAL HOLE, now closed. Removing the ascending check on the key run
//   survived the first version of this gate, and interrogating it is what
//   found the worst defect on the slide: three activities have a key run that
//   COUNTS right and is numbered wrong. "250 shells, then 245 shells." reads
//   as two markers against two steps; "Items 1 and 3 are true; item 2 is
//   false…" reads as 1, 3, 2, 4 against four. Bound by position that puts item
//   3's answer under step 2 — a real, confident answer attached to the wrong
//   question, which is the one thing on this slide a child cannot detect and
//   the exact shape this repo already shipped once in the Computing quiz keys.
//   The numbering assertion below closes it, and it names all three when the
//   guard is removed.
//
// It exercises the SHIPPED function. `activitySteps` is module-scoped in
// english.js and there is nothing to import, so its source is extracted and
// evaluated; a copy of the logic here would pass while the real one was broken.
// Extraction failing is exit 2, not a pass, for the same reason.
import fs from "node:fs";
import path from "node:path";

const SHELL = "src/prototypes/ehel-academy/shell/subjects/english.js";
const GRADES = [1, 2, 3, 4];

// Floors are the measurement taken when the split shipped (2026-08-31), not a
// round number below it: a floor set under the true count is a formality that
// passes while a whole grade quietly drops out.
// Raised 2026-08-31 when activities 7-12 were authored into every Grade 1-4
// unit (246 new, taking each unit from 6 to 12). The new six are written in
// the shape this splitter reads, so coverage went 150/246 -> 396/492 and
// per-step answers 46 -> 158. Locking that in is the point of a floor: the
// old values would now pass while two thirds of the checklists vanished.
const FLOORS = { 1: 83, 2: 98, 3: 103, 4: 112 };
const STEP_FLOOR = 1670;
// Stepped activities whose marking notes carry a per-step answer run. Floored
// for the same reason as the steps: a key run that stops parsing shows the
// child nothing and looks exactly like an activity that never had answers.
const KEY_FLOOR = 158;
// Deliberately the gate's OWN copy of the two key patterns rather than the
// extracted ones. Everything else here runs the shipped code, because a copy
// would pass while the real thing was broken — but the numbering check below
// has to be able to disagree with the parser, and a check that reuses the thing
// it is checking cannot. If these drift from english.js the assertion fires,
// which is the loud failure and the right one.
const KEY_STRICT_PROBE = /(?:^|(?<=[.;,])|(?<=[.;,]\s))\s*(\d+)[.)]?\s+/g;
const KEY_LOOSE_PROBE = /(?<![\d.])(\d+)[.)]?\s+/g;

const die = (code, message) => { console.error(`✗ ${message}`); process.exitCode = code; };

let source;
try { source = fs.readFileSync(SHELL, "utf8"); }
catch { die(2, `cannot read ${SHELL} — the gate compared nothing`); process.exit(2); }

const findLine = (marker) => {
  const at = source.indexOf(marker);
  if (at < 0) return null;
  return source.slice(at, source.indexOf("\n", at));
};
const findFunction = (marker) => {
  const at = source.indexOf(marker);
  if (at < 0) return null;
  let depth = 0;
  for (let i = source.indexOf("{", at); i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") { depth -= 1; if (!depth) return source.slice(at, i + 1); }
  }
  return null;
};

const pieces = [
  findLine("const ACTIVITY_ITEM_MARK ="),
  findLine("const ACTIVITY_INLINE_MARK ="),
  findLine("const ACTIVITY_KEY_STRICT ="),
  findLine("const ACTIVITY_KEY_LOOSE ="),
  findFunction("function activitySteps(activity)"),
  findFunction("function activityKeyRun(summary, pattern, wanted)"),
  findFunction("function activityStepKeys(activity, items)"),
];
if (pieces.some((piece) => !piece)) {
  console.error(`✗ could not extract activitySteps/activityStepKeys and their patterns from ${SHELL}.`);
  console.error("  The gate cannot read what it is meant to check, so it is not reporting a pass.");
  console.error("  If the function was renamed or moved, update the markers in this file.");
  process.exit(2);
}

let activitySteps;
let activityStepKeys;
try { [activitySteps, activityStepKeys] = new Function(`${pieces.join("\n")}\nreturn [activitySteps, activityStepKeys];`)(); }
catch (error) { console.error(`✗ extracted source did not evaluate: ${error.message}`); process.exit(2); }

const problems = [];
const counts = {};
let total = 0;
let steps = 0;
let keyed = 0;

for (const grade of GRADES) {
  const dir = `src/prototypes/ehel-academy/english/grade-${grade}/data/units`;
  counts[grade] = 0;
  let files;
  try { files = fs.readdirSync(dir).filter((name) => /^unit-\d+\.json$/.test(name)); }
  catch { die(2, `cannot read ${dir}`); process.exit(2); }
  if (!files.length) { die(2, `no unit files under ${dir} — nothing was checked for grade ${grade}`); process.exit(2); }
  for (const file of files) {
    const unit = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    for (const activity of unit.activities || []) {
      total += 1;
      const where = `g${grade} ${activity.activityId}`;
      const { lead, items } = activitySteps(activity);
      if (items.length) { counts[grade] += 1; steps += items.length; }
      if (!lead && !items.length) problems.push(`${where}: the whole instruction came back empty`);
      // One tick-box is not a checklist; it is an instruction wearing one.
      if (items.length === 1) problems.push(`${where}: a single-step checklist`);
      for (const [index, item] of items.entries()) {
        if (!item.text) problems.push(`${where}: step ${index + 1} has no text`);
        if (!item.mark) problems.push(`${where}: step ${index + 1} has no number`);
      }
      // Every word of the instruction has to still be on screen somewhere. The
      // markers themselves are excluded because they become the badge on the
      // tick rather than body text — that is the split working, not text lost.
      const shown = [lead, ...items.map((item) => item.text)].join(" ").replace(/\s+/g, " ");
      const wanted = String(activity.instructionsAndItems || "").replace(/\s+/g, " ").trim();
      const lost = wanted
        .split(/\s+/)
        .filter((word) => !shown.includes(word.replace(/[,;]$/, "")))
        .filter((word) => !/^(?:\d+[.):]?|[a-z][.)])$/i.test(word));
      if (lost.length) problems.push(`${where}: ${lost.length} word(s) reach no slide — ${lost.slice(0, 6).join(" ")}`);

      // The per-step answers. Length is the whole safety property: a key run
      // that does not line up one-for-one with the steps would put a real
      // answer under the wrong question, which reads as correct and is the one
      // failure here a child cannot detect.
      const keys = activityStepKeys(activity, items);
      if (keys) {
        keyed += 1;
        if (keys.length !== items.length) problems.push(`${where}: ${keys.length} answers against ${items.length} steps`);
        for (const [index, key] of keys.entries()) {
          if (!String(key || "").trim()) problems.push(`${where}: answer ${index + 1} is empty`);
        }
        // The numbering is checked here INDEPENDENTLY of the parser, because the
        // count matching is not enough on its own and three activities prove it.
        // "250 shells, then 245 shells." offers two numbers against two steps;
        // "Items 1 and 3 are true; item 2 is false…" offers 1, 3, 2, 4 against
        // four. Bound by position, the second one puts item 3's answer under
        // step 2 — an answer that is real, confident and attached to the wrong
        // question, which is the one failure on this slide a child cannot
        // detect. The shipped code refuses all three; without this the gate
        // could not tell if it stopped.
        const summary = String(activity.answerSummary || "").trim();
        const ascends = [KEY_STRICT_PROBE, KEY_LOOSE_PROBE].some((pattern) => {
          const found = [...summary.matchAll(pattern)].map((match) => Number(match[1]));
          return found.length === items.length && found.every((value, index) => value === index + 1);
        });
        if (!ascends) problems.push(`${where}: answers were bound to steps from a run that is not numbered 1..${items.length}`);
      }
    }
  }
}

const covered = Object.values(counts).reduce((sum, n) => sum + n, 0);
console.log(`english activities, grades 1-4: ${covered} of ${total} become checklists, ${steps} tickable steps`);
console.log(`  ${keyed} of those carry a per-step answer in their marking notes (floor ${KEY_FLOOR})`);
for (const grade of GRADES) console.log(`  grade ${grade}: ${counts[grade]} of ${FLOORS[grade]} floor`);

for (const grade of GRADES) {
  if (counts[grade] < FLOORS[grade]) {
    die(1, `grade ${grade} split ${counts[grade]} activities into steps, below the recorded floor of ${FLOORS[grade]}.`
      + " Coverage may rise and never fall — a split that stops matching leaves every activity as one block of text and says nothing.");
  }
}
if (keyed < KEY_FLOOR) {
  die(1, `${keyed} activities got a per-step answer run, below the recorded floor of ${KEY_FLOOR}.`
    + " A key run that stops parsing shows the child nothing and is indistinguishable from an activity that never had answers.");
}
if (steps < STEP_FLOOR) {
  die(1, `${steps} steps across grades 1-4, below the recorded floor of ${STEP_FLOOR}.`
    + " Per-grade counts can hold while the steps inside them are lost, so both are floored.");
}
if (problems.length) {
  die(1, `${problems.length} activity split problem(s):\n${problems.slice(0, 30).map((line) => `    ${line}`).join("\n")}`);
}
if (!process.exitCode) {
  console.log("✓ every activity keeps all its words, every step is numbered and non-empty, coverage holds");
  console.log("  raise the floors in this file when a content change legitimately increases them");
}
