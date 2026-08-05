#!/usr/bin/env node
// Lays the learner-voiced unit overviews over Grade 1 English on disk.
//
// Why this exists rather than a rebuild: build-ehel-grade1-shared-course.js owns
// LEARNER_OVERVIEWS (and is the right place for it — a future rebuild must not
// reintroduce the parent-guide text), but running that builder regenerates the
// entire grade, and its audioDescriptor() still writes the retired
// ./media/audio/unit-N/ paths. Grade 1's ~2,700 live clips were repaired to
// ./media/audio/grade-1/<category>/ by the audio generator, so a rebuild would
// silence the whole grade. This touches one field per unit and nothing else.
//
// Idempotent, and reports every change. Usage:
//   node tools/apply-ehel-grade1-overview-voice.js --dry
//   node tools/apply-ehel-grade1-overview-voice.js

const fs = require("fs");
const path = require("path");
const { LEARNER_OVERVIEWS } = require("./build-ehel-grade1-shared-course.js");

const ROOT = path.resolve(__dirname, "..");
const UNITS = path.join(ROOT, "src", "prototypes", "ehel-academy", "english", "grade-1", "data", "units");
const dry = process.argv.includes("--dry");

let changed = 0;
let already = 0;
for (const [unitNo, overview] of Object.entries(LEARNER_OVERVIEWS)) {
  const file = path.join(UNITS, `unit-${unitNo}.json`);
  if (!fs.existsSync(file)) {
    console.log(`unit-${unitNo}: MISSING ${file}`);
    continue;
  }
  const unit = JSON.parse(fs.readFileSync(file, "utf8"));
  if (unit.unit.unitOverview === overview) {
    already += 1;
    continue;
  }
  console.log(`unit-${unitNo} (${unit.unit.unitTitle})`);
  console.log(`  was: ${unit.unit.unitOverview.slice(0, 100)}…`);
  console.log(`  now: ${overview.slice(0, 100)}…`);
  changed += 1;
  if (dry) continue;
  unit.unit.unitOverview = overview;
  fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`);
}

console.log(`\n${dry ? "would update" : "updated"}: ${changed} | already current: ${already}`);
if (changed && !dry) {
  console.log("The overview clips narrate this text — re-run the generator so the");
  console.log("audio matches, then `npm run check:english-audio`:");
  console.log("  node tools/generate-ehel-english-audio.js overview 1 --dry");
}
