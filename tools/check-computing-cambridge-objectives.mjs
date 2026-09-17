// Check every Computing shell-course unit's Cambridge objective mapping
// against the framework it claims to follow.
//
// Modelled on tools/check-science-cambridge-objectives.mjs — same four
// comparisons (declared stage/framework, code exists, text hasn't drifted,
// per-stage coverage reported) — adapted for two things Computing does
// differently:
//
//   1. THE CODE MISMATCH. Every unit's own cambridge.code reads "0672" for
//      Stages 1-6 (check-computing-content.mjs enforces this), but the only
//      framework file with real objective text to check codes against is
//      cambridge-computing-0059.json. This gate checks codes against 0059
//      while leaving the declared-code convention to check-computing-content.mjs
//      — duplicating that assertion here would just be two gates agreeing to
//      enforce the same unresolved mismatch.
//   2. STAGES 7-8 HAVE NO FRAMEWORK FILE AT ALL (0868, Lower Secondary, does
//      not exist in this repo). That is a known, flagged gap, not something
//      this gate can manufacture evidence for — those stages are reported as
//      unmeasurable and skipped, never failed.
//
// Usage: node tools/check-computing-cambridge-objectives.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPUTING = path.join(ROOT, "src", "prototypes", "ehel-academy", "computing");
const CURRICULUM = path.join(ROOT, "src", "curriculum");

// Only cambridge-computing-0059.json exists; it publishes objectives for
// Stages 1-6. Stages 7-8 would need 0868 (Lower Secondary), which this repo
// does not have — see the header note.
const FRAMEWORK_FILE_FOR_STAGE = (stage) => (stage <= 6 ? "0059" : "0868");

// A stage whose full objective set must be referenced by at least one unit,
// not merely "some coverage" — same shape as a TOPIC_FLOORS check elsewhere
// in this repo: a number that can only go down by a real regression, never by
// a parser quietly extracting less. Stages 5-6 earned this floor on
// 2026-09-17 by the strand-complete pass in
// map-ehel-computing-cambridge-objectives.mjs; nothing else in this repo
// claims full stage coverage, so nothing else is floored here.
const FULL_COVERAGE_STAGES = new Set([5, 6]);

const frameworks = new Map();
const missingFrameworks = new Set();
for (let stage = 1; stage <= 8; stage += 1) {
  const code = FRAMEWORK_FILE_FOR_STAGE(stage);
  if (frameworks.has(code) || missingFrameworks.has(code)) continue;
  const file = path.join(CURRICULUM, `cambridge-computing-${code}.json`);
  if (fs.existsSync(file)) frameworks.set(code, JSON.parse(fs.readFileSync(file, "utf8")));
  else missingFrameworks.add(code);
}

const norm = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

const failures = [];
const warnings = [];
const unmeasurable = new Set();
const referenced = new Map(); // "code/stage" -> Set(codes used)
let unitsChecked = 0;
let codesChecked = 0;

for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(COMPUTING, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const where = `grade-${grade}/${file}`;
    const cambridge = unit.cambridge || {};
    unitsChecked += 1;

    const stage = Number(cambridge.stage);
    if (!Number.isFinite(stage)) { failures.push(`${where}: cambridge.stage is missing`); continue; }
    if (stage !== grade) failures.push(`${where}: declares stage ${stage} but sits in grade-${grade}`);

    const frameworkCode = FRAMEWORK_FILE_FOR_STAGE(stage);
    if (!frameworks.has(frameworkCode)) {
      unmeasurable.add(`stage ${stage}: cambridge-computing-${frameworkCode}.json does not exist in this repo — objectives cannot be checked`);
      continue;
    }
    const framework = frameworks.get(frameworkCode);
    const stageObjectives = (framework.objectivesByStage || {})[String(stage)] || [];
    if (!stageObjectives.length) { failures.push(`${where}: framework ${frameworkCode} has no objectives for stage ${stage}`); continue; }
    const byCode = new Map(stageObjectives.map((objective) => [objective.code, objective]));

    const codes = (cambridge.objectiveCodes || cambridge.objectives || []).map((entry) => (typeof entry === "string" ? entry : entry.code));
    const objectives = cambridge.objectives || [];
    if (!codes.length) { failures.push(`${where}: no objectives — the unit's Cambridge alignment is unevidenced`); continue; }

    const fromObjectives = objectives.map((objective) => objective.code);
    if (cambridge.objectiveCodes && (fromObjectives.length !== codes.length || fromObjectives.some((code, i) => code !== codes[i]))) {
      failures.push(`${where}: objectiveCodes and objectives[].code disagree — ${JSON.stringify(codes)} vs ${JSON.stringify(fromObjectives)}`);
    }

    const seen = new Set();
    for (const code of codes) {
      codesChecked += 1;
      if (seen.has(code)) warnings.push(`${where}: objective ${code} listed twice`);
      seen.add(code);
      const objective = byCode.get(code);
      if (!objective) {
        failures.push(`${where}: objective ${code} does not exist in Cambridge ${frameworkCode} stage ${stage}`);
        continue;
      }
      const key = `${frameworkCode}/${stage}`;
      if (!referenced.has(key)) referenced.set(key, new Set());
      referenced.get(key).add(code);
      const stored = objectives.find((entry) => entry.code === code);
      if (stored && stored.text && norm(stored.text) !== norm(objective.text)) {
        failures.push(`${where}: ${code} text has drifted from the framework\n`
          + `        unit:      ${stored.text}\n`
          + `        framework: ${objective.text}`);
      }
    }
  }
}

console.log(`computing cambridge: ${unitsChecked} units, ${codesChecked} objective references checked`);
const rows = [];
for (const [key, used] of [...referenced].sort()) {
  const [code, stage] = key.split("/");
  const total = ((frameworks.get(code).objectivesByStage || {})[stage] || []).length;
  rows.push({ stage: Number(stage), code, used: used.size, total });
  console.log(`   stage ${stage} (${code}): ${used.size} of ${total} objectives referenced`);
}
if (unmeasurable.size) {
  console.log(`${unmeasurable.size} stage(s) not measurable (no framework file, flagged not resolved):`);
  for (const line of unmeasurable) console.log(`   ${line}`);
}

for (const row of rows) {
  if (FULL_COVERAGE_STAGES.has(row.stage) && row.used < row.total) {
    failures.push(`stage ${row.stage} (${row.code}) dropped below full coverage: ${row.used} of ${row.total} objectives referenced — was floored at ${row.total}`);
  }
}

if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const line of warnings.slice(0, 20)) console.log(`   ${line}`);
}
if (failures.length) {
  console.error(`✗ ${failures.length} computing cambridge failure(s):`);
  for (const line of failures.slice(0, 40)) console.error(`   ${line}`);
  process.exit(1);
}
console.log("✓ computing cambridge objectives: every code exists in its stage and matches the framework text; Stages 5-6 hold full coverage");
