// Gate on the tutoring topic index. Re-derives every grade's index from the
// unit JSONs through the same lib the builder uses and fails on ANY byte of
// difference — a stale index (content rebuilt, index not) and a hand-edited
// index both fail the same way. Then the invariants the derivation itself
// cannot express:
//
// - Every index the derivation can produce EXISTS on disk. Byte-comparing
//   only the files present would pass a tree where a grade's index was simply
//   deleted — absence reads as nothing to check, the ✓-after-skip shape.
// - Withdrawn content is absent: no Global Perspectives Stage 5 file, no
//   English unit below 1 inside any English index. These are decisions
//   (withdrawn-courses.json; shell defaultUnit = 1), not derivation accidents,
//   so they are asserted independently of the lib that enforces them.
// - Sections resolve: every topic's section id is one the subject's shell
//   module actually names in its renderers/sections. A topic pointing at a
//   route nothing renders does not 404 — the router falls through to the
//   overview, and the learner silently lands on the wrong page (the same
//   failure the portal route gate exists for). Read from the shell source so
//   a renamed section fails here instead of shipping.
// - Floors: per-subject totals may not fall below what the first build
//   produced. A parser change that quietly stops extracting one subject's
//   topics otherwise passes as "all present files match".
//
//   node tools/check-topic-index.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SUBJECTS, buildGradeIndex, serialise, indexPath } = require("./lib/ehel-topic-index.js");

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

// Recorded on the first full build (2026-08-24). May rise, may not fall — a
// falling count means extraction quietly stopped seeing something.
//
// The three capstone subjects were raised by 16 each on 2026-08-27, when the
// stage capstones were indexed (8 stages x project + quiz). Raising them is the
// point rather than bookkeeping: left at the old value, the floor was EXACTLY
// the pre-capstone total, so extraction losing every capstone topic would land
// the count precisely on the floor and pass. A floor set at what you had before
// the last thing you added cannot see that thing disappear.
const TOPIC_FLOORS = {
  mathematics: 4183,
  science: 1254,
  computing: 1895,
  "global-perspectives": 1273,
  english: 2165,
  "intensive-english": 862,
};

const failures = [];
const fail = (msg) => { failures.push(msg); console.error(`  ✗ ${msg}`); };

// Section ids a subject's shell can actually render, read from the shell
// source rather than copied here: every ["id", "icon", "Label"] triple plus
// every key of the renderers map, whichever way the module declares them.
function shellSectionIds(subject) {
  const src = fs.readFileSync(path.join(EHEL, "shell", "subjects", `${subject}.js`), "utf8");
  const ids = new Set();
  for (const m of src.matchAll(/\["([a-z-]+)", "[a-z0-9-]+", "[^"]+"/g)) ids.add(m[1]);
  const renderers = src.match(/renderers:\s*(?:gated\()?\{([\s\S]*?)\n  \}/);
  if (renderers) for (const m of renderers[1].matchAll(/(?:^|\n)\s*"?([a-z-]+)"?:/g)) ids.add(m[1]);
  return ids;
}

let checkedFiles = 0;
for (const [subject, cfg] of Object.entries(SUBJECTS)) {
  const sections = shellSectionIds(subject);
  if (sections.size < 5) fail(`${subject}: only ${sections.size} section ids parsed from the shell — the parser matched nothing, which proves nothing`);
  let topicTotal = 0;
  for (const stage of cfg.stages) {
    const expected = buildGradeIndex(EHEL, subject, stage);
    const target = indexPath(EHEL, subject, stage);
    const label = `${subject} ${cfg.stageWord.toLowerCase()} ${stage}`;
    if (!expected) {
      if (fs.existsSync(target)) fail(`${label}: topic-index.json exists but no unit data derives one`);
      continue;
    }
    if (!fs.existsSync(target)) { fail(`${label}: topic-index.json missing — run build-topic-index.mjs`); continue; }
    checkedFiles += 1;
    if (fs.readFileSync(target, "utf8") !== serialise(expected)) {
      fail(`${label}: topic-index.json is stale or hand-edited — run build-topic-index.mjs ${subject}`);
    }
    for (const unit of expected.units) {
      if (subject === "english" && unit.unit < 1) fail(`${label}: unit ${unit.unit} is withdrawn from learners and may not be indexed`);
      for (const t of unit.topics) {
        topicTotal += 1;
        if (!sections.has(t.section)) fail(`${label} unit ${unit.unit}: topic "${t.label}" points at section "${t.section}", which the ${subject} shell does not render`);
      }
    }
  }
  const floor = TOPIC_FLOORS[subject];
  if (topicTotal < floor) fail(`${subject}: ${topicTotal} topics, below the recorded floor of ${floor} — extraction stopped seeing something`);
  console.log(`  ${subject}: ${topicTotal} topics across ${cfg.stages.length} ${cfg.stageWord.toLowerCase()}s`);
}

// The withdrawn-stage assertion, independent of SUBJECTS.stages: if GP stage 5
// were ever added back to the lib by mistake, the loop above would happily
// derive and pass it. This reads the decision from where it is recorded.
const withdrawn = JSON.parse(fs.readFileSync(path.join(EHEL, "withdrawn-courses.json"), "utf8"));
for (const info of Object.values(withdrawn.withdrawn || {})) {
  const subjectKey = Object.keys(SUBJECTS).find((s) => s.replace(/-/g, " ") === String(info.subject).toLowerCase());
  if (!subjectKey) continue;
  if (SUBJECTS[subjectKey].stages.includes(info.stage)) fail(`${subjectKey} stage ${info.stage} is withdrawn (withdrawn-courses.json) but listed in SUBJECTS.stages`);
  const strayPath = indexPath(EHEL, subjectKey, info.stage);
  if (fs.existsSync(strayPath)) fail(`${subjectKey} stage ${info.stage} is withdrawn but ${path.relative(ROOT, strayPath)} exists`);
}

if (checkedFiles === 0) fail("no topic-index.json checked at all — a gate that compared nothing is not a pass");

if (failures.length) {
  console.error(`\ntopic index: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log(`\n✓ topic index: ${checkedFiles} file(s) match their derivation`);
