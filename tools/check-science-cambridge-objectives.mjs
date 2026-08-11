// Check every Science unit's Cambridge objective mapping against the framework
// it claims to follow.
//
// The mapping existed and nothing validated it. `validate:curriculum-units`
// looks like the gate for this and is not: it runs validate-unit.mjs over
// `english/grade-*/data/units/*.json` only, and that validator is English-
// shaped besides — it requires readings, grammar, speaking and writing
// sections, and reads objectives from a per-outcome `cambridgeObjectives`
// field. Science keeps its mapping at `unit.cambridge` and has none of those
// sections, so pointing that glob at Science would report dozens of failures
// about a schema Science never claimed to have. Hence a Science-shaped check.
//
// Four things are compared, and the last two are the ones that catch a mapping
// going quietly wrong rather than obviously missing:
//
//   1. the unit declares the framework and stage its grade implies
//   2. every code it claims exists in that framework at that stage
//   3. the objective TEXT stored beside the code still matches the framework —
//      a code can stay valid while the text beside it goes stale, and the text
//      is what a teacher reads
//   4. per-stage coverage is reported, so a stage mapped to two objectives out
//      of forty is visible instead of passing as "all codes valid"
//
// Usage: node tools/check-science-cambridge-objectives.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCI = path.join(ROOT, "src", "prototypes", "ehel-academy", "science");
const CURRICULUM = path.join(ROOT, "src", "curriculum");

// Cambridge Primary Science 0846 covers Stages 1-6; Lower Secondary 0893
// covers 7-9. A unit naming the other one for its stage is a mapping pointed at
// the wrong document, which check 2 would then "pass" against the wrong codes.
const FRAMEWORK_FOR_STAGE = (stage) => (stage <= 6 ? "0846" : "0893");

const frameworks = new Map();
for (const code of ["0846", "0893"]) {
  const file = path.join(CURRICULUM, `cambridge-science-${code}.json`);
  if (!fs.existsSync(file)) {
    console.error(`✗ science cambridge: ${path.relative(ROOT, file)} is missing — the mapping cannot be checked against anything.`);
    process.exit(1);
  }
  frameworks.set(code, JSON.parse(fs.readFileSync(file, "utf8")));
}

const norm = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

const failures = [];
const warnings = [];
const referenced = new Map();     // "code/stage" -> Set(codes used)
let unitsChecked = 0;
let codesChecked = 0;

for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(SCI, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const where = `grade-${grade}/${file}`;
    const cambridge = unit.cambridge || {};
    unitsChecked += 1;

    const stage = Number(cambridge.stage);
    if (!Number.isFinite(stage)) { failures.push(`${where}: cambridge.stage is missing`); continue; }
    if (stage !== grade) failures.push(`${where}: declares stage ${stage} but sits in grade-${grade}`);

    const wanted = FRAMEWORK_FOR_STAGE(stage);
    if (String(cambridge.code) !== wanted) {
      failures.push(`${where}: stage ${stage} belongs to Cambridge ${wanted} but the unit names ${cambridge.code}`);
      continue;
    }
    const framework = frameworks.get(wanted);
    const stageObjectives = (framework.objectivesByStage || {})[String(stage)] || [];
    if (!stageObjectives.length) { failures.push(`${where}: framework ${wanted} has no objectives for stage ${stage}`); continue; }
    const byCode = new Map(stageObjectives.map((objective) => [objective.code, objective]));

    const codes = cambridge.objectiveCodes || [];
    const objectives = cambridge.objectives || [];
    if (!codes.length) { failures.push(`${where}: no objectiveCodes — the unit's Cambridge alignment is unevidenced`); continue; }

    // The two lists describe the same mapping; if they disagree, which one the
    // app shows depends on which field a screen happens to read.
    const fromObjectives = objectives.map((objective) => objective.code);
    if (fromObjectives.length !== codes.length || fromObjectives.some((code, i) => code !== codes[i])) {
      failures.push(`${where}: objectiveCodes and objectives[].code disagree — ${JSON.stringify(codes)} vs ${JSON.stringify(fromObjectives)}`);
    }

    const seen = new Set();
    for (const code of codes) {
      codesChecked += 1;
      if (seen.has(code)) warnings.push(`${where}: objective ${code} listed twice`);
      seen.add(code);
      const objective = byCode.get(code);
      if (!objective) {
        failures.push(`${where}: objective ${code} does not exist in Cambridge ${wanted} stage ${stage}`);
        continue;
      }
      const key = `${wanted}/${stage}`;
      if (!referenced.has(key)) referenced.set(key, new Set());
      referenced.get(key).add(code);
      const stored = objectives.find((entry) => entry.code === code);
      if (stored && stored.text && norm(stored.text) !== norm(objective.text)) {
        failures.push(`${where}: ${code} text has drifted from the framework\n`
          + `        unit:      ${stored.text}\n`
          + `        framework: ${objective.text}`);
      }
      if (stored && stored.strand && norm(stored.strand) !== norm(objective.strand)) {
        warnings.push(`${where}: ${code} strand is ${JSON.stringify(stored.strand)}, framework says ${JSON.stringify(objective.strand)}`);
      }
    }
  }
}

console.log(`science cambridge: ${unitsChecked} units, ${codesChecked} objective references checked`);
const rows = [];
for (const [key, used] of [...referenced].sort()) {
  const [code, stage] = key.split("/");
  const total = ((frameworks.get(code).objectivesByStage || {})[stage] || []).length;
  rows.push(`   stage ${stage} (${code}): ${used.size} of ${total} objectives referenced`);
}
for (const row of rows) console.log(row);

if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const line of warnings.slice(0, 20)) console.log(`   ${line}`);
}
if (failures.length) {
  console.error(`✗ ${failures.length} science cambridge failure(s):`);
  for (const line of failures.slice(0, 40)) console.error(`   ${line}`);
  process.exit(1);
}
console.log("✓ science cambridge objectives: every code exists in its stage and matches the framework text");
