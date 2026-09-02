#!/usr/bin/env node
// Give every Intensive English unit a `visual.lectureVersion`, so a rewritten
// lesson can reset its own completion the way English's re-recorded lecture does.
//
// Intensive English had none, and no `lecture-media.json` either — the gap Grade
// 2 carried until 2026-09-02. The field goes in the UNIT's `visual`, beside
// `lectureScript`, because that is where this subject already keeps its lecture
// data. English and Grades 3-8 declare theirs in a `lecture-media.json` overlay,
// but Intensive English's loader does not fetch one, so introducing that file
// would mean adding overlay machinery to carry a single string.
//
// The value is a hand-bumped string, matching the platform's convention
// (`g2-u1-teacher-lecture-v1`) rather than a hash of the script. A hash would
// fire on every edit including a typo fix, and re-locking a learner's lesson —
// and every section behind it in the chain — for a comma is worse than the gap
// this closes. Bumping it is a human decision, taken when a lesson is genuinely
// rewritten. Worth knowing: English's equivalent has never once been bumped in
// 81 units, so a version nobody touches is the failure mode to expect here too.
//
// Named `lesson`, not `teacher-lecture`: this subject's lecture is a text lesson
// with narration, not a filmed one, and the id should not claim otherwise.
//
//   node tools/add-intensive-english-lesson-versions.mjs           # report
//   node tools/add-intensive-english-lesson-versions.mjs --write   # apply
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("src", "prototypes", "ehel-academy", "intensive-english");
const argv = process.argv.slice(2);
let WRITE = false;
for (const arg of argv) {
  if (arg === "--write") { WRITE = true; continue; }
  console.error(`Unrecognised argument: ${arg}`);
  console.error("Usage: add-intensive-english-lesson-versions.mjs [--write]");
  process.exit(2);
}

let added = 0, already = 0, noLesson = 0;
for (const level of [1, 2]) {
  const dir = path.join(ROOT, `level-${level}`, "data", "units");
  if (!fs.existsSync(dir)) { console.log(`level ${level}: no units directory — skipped`); continue; }
  let levelAdded = 0, levelSkipped = 0;
  for (const file of fs.readdirSync(dir).filter((f) => /^unit-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))) {
    const unitNo = Number(file.match(/\d+/)[0]);
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const doc = JSON.parse(raw);
    const visual = doc.visual;
    // No lesson text, no version. A version for a lecture that does not exist is
    // a claim about nothing, and it would write a key the renderer never reads —
    // the same reason Unit 10 carries none in every English grade.
    if (!visual || !String(visual.lectureScript || "").trim()) { noLesson++; levelSkipped++; continue; }
    if (String(visual.lectureVersion || "").trim()) { already++; continue; }

    // Placed after `lectureScript`, beside the rest of the lecture block, rather
    // than appended after the poster and captions. Every other key keeps order.
    const at = Object.keys(visual).indexOf("lectureScript");
    const rebuilt = {};
    Object.entries(visual).forEach(([key, value], index) => {
      rebuilt[key] = value;
      if (index === at) rebuilt.lectureVersion = `ie-l${level}-u${unitNo}-lesson-v1`;
    });
    doc.visual = rebuilt;

    // The file's OWN indent, never a chosen one: these are written with a single
    // space, and a fixed `null, 2` would rewrite every line of all forty for one
    // added key — 321,335 insertions was what that cost on the master
    // dictionaries before it was caught.
    const indent = (raw.match(/^\{\r?\n( +)"/) || [null, "  "])[1];
    if (WRITE) fs.writeFileSync(full, JSON.stringify(doc, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
    added++; levelAdded++;
  }
  console.log(`level ${level}: ${levelAdded} to add${levelSkipped ? `, ${levelSkipped} with no lesson text — skipped` : ""}`);
}
console.log(`\ntotal: ${added} to add | ${already} already had one | ${noLesson} with no lesson text`);
console.log(WRITE ? "written." : "(report only — pass --write to apply)");
