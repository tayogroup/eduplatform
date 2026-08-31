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
// Mutation-tested five ways: removing the inline pass (grade 1 falls to 0),
// raising the newline floor, a marker strip that eats two extra characters,
// dropping the empty-text fallback, and renaming the function so extraction
// fails. Four are caught; the fifth is a NO-OP on the content as it stands and
// is recorded here so nobody chases it — `text: … || line` only fires for an
// item line that is nothing but its own marker ("3."), and there are 0 of
// those in 524 item lines. The "step has no text" assertion below is what
// would catch it the day such a line is written. Both are for future content.
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
const FLOORS = { 1: 17, 2: 38, 3: 43, 4: 52 };
const STEP_FLOOR = 585;

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
  findFunction("function activitySteps(activity)"),
];
if (pieces.some((piece) => !piece)) {
  console.error(`✗ could not extract activitySteps and its patterns from ${SHELL}.`);
  console.error("  The gate cannot read what it is meant to check, so it is not reporting a pass.");
  console.error("  If the function was renamed or moved, update the markers in this file.");
  process.exit(2);
}

let activitySteps;
try { activitySteps = new Function(`${pieces.join("\n")}\nreturn activitySteps;`)(); }
catch (error) { console.error(`✗ extracted source did not evaluate: ${error.message}`); process.exit(2); }

const problems = [];
const counts = {};
let total = 0;
let steps = 0;

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
    }
  }
}

const covered = Object.values(counts).reduce((sum, n) => sum + n, 0);
console.log(`english activities, grades 1-4: ${covered} of ${total} become checklists, ${steps} tickable steps`);
for (const grade of GRADES) console.log(`  grade ${grade}: ${counts[grade]} of ${FLOORS[grade]} floor`);

for (const grade of GRADES) {
  if (counts[grade] < FLOORS[grade]) {
    die(1, `grade ${grade} split ${counts[grade]} activities into steps, below the recorded floor of ${FLOORS[grade]}.`
      + " Coverage may rise and never fall — a split that stops matching leaves every activity as one block of text and says nothing.");
  }
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
