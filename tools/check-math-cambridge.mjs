// Check what can be checked about Mathematics' Cambridge alignment, and make
// the part that cannot be checked visible instead of silent.
//
// Mathematics declares a framework and a stage on every unit and maps NO
// objectives — 0 of 133. Science stores codes at unit.cambridge.objectiveCodes
// and is held to them by check:science-cambridge; Computing has none either.
// Until the mapping is authored there is nothing here to validate against the
// framework, so this gate does three things instead:
//
//   1. stage ↔ framework code agreement (Stages 1-6 Primary, 7-8 Lower
//      Secondary), which is checkable today and would catch a unit pointed at
//      the wrong document
//   2. any objective codes that DO appear must exist in the framework for the
//      stage that claims them — so the first mapping authored is checked from
//      the moment it lands, rather than after somebody remembers to add a gate
//   3. it reports how many units carry no mapping, and fails if that number
//      grows, so the gap can close but not widen
//
// The Stage 1-6 framework is a known hole: the units declare Cambridge Primary
// Mathematics 0096, and 0096 is not published in src/curriculum/. The only
// Primary maths framework available is 0845, a different and superseded
// edition, so mapping Stages 1-6 against it would assert an alignment nobody
// checked. Stages 7-8 declare 0862 and that framework IS present.
//
// Usage: node tools/check-math-cambridge.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATH = path.join(ROOT, "src", "prototypes", "ehel-academy", "mathematics");
const CURRICULUM = path.join(ROOT, "src", "curriculum");

// Units with no objective mapping. This may fall, never rise.
//
// 133 -> 101: the 32 Stage 7-8 units now carry a mapping against 0862
// (tools/map-ehel-math-cambridge-objectives.mjs). The remaining 101 are Stages
// 1-6, and they stay unmapped until Cambridge Primary Mathematics 0096 is
// extracted into src/curriculum/ — there is no document to map them against,
// and codes invented against an absent framework would be worse than the gap.
const MAXIMUM_UNMAPPED = 101;

const EXPECTED_CODE = (stage) => (stage <= 6 ? "0096" : "0862");
const norm = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

const frameworks = new Map();
for (const file of fs.readdirSync(CURRICULUM).filter((name) => /^cambridge-mathematics-\d+\.json$/.test(name))) {
  const parsed = JSON.parse(fs.readFileSync(path.join(CURRICULUM, file), "utf8"));
  frameworks.set(String(parsed.curriculumCode), parsed);
}

const failures = [];
const notes = [];
let units = 0;
let unmapped = 0;
let codesChecked = 0;
const missingFrameworks = new Set();

for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(MATH, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const where = `grade-${grade}/${file}`;
    const cambridge = unit.cambridge || {};
    units += 1;

    const stage = Number(cambridge.stage);
    if (!Number.isFinite(stage)) { failures.push(`${where}: cambridge.stage is missing`); continue; }
    if (stage !== grade) failures.push(`${where}: declares stage ${stage} but sits in grade-${grade}`);
    const wanted = EXPECTED_CODE(stage);
    if (String(cambridge.code) !== wanted) {
      failures.push(`${where}: stage ${stage} should name Cambridge ${wanted}, unit names ${cambridge.code}`);
    }

    const codes = cambridge.objectiveCodes || (cambridge.objectives || []).map((o) => o.code).filter(Boolean);
    if (!codes.length) { unmapped += 1; continue; }

    const framework = frameworks.get(String(cambridge.code));
    if (!framework) { missingFrameworks.add(String(cambridge.code)); continue; }
    const stageObjectives = (framework.objectivesByStage || {})[String(stage)] || [];
    const byCode = new Map(stageObjectives.map((objective) => [objective.code, objective]));
    for (const code of codes) {
      codesChecked += 1;
      const objective = byCode.get(code);
      if (!objective) {
        failures.push(`${where}: objective ${code} does not exist in Cambridge ${cambridge.code} stage ${stage}`);
        continue;
      }
      const stored = (cambridge.objectives || []).find((entry) => entry.code === code);
      if (stored && stored.text && norm(stored.text) !== norm(objective.text)) {
        failures.push(`${where}: ${code} text has drifted from the framework\n`
          + `        unit:      ${stored.text}\n        framework: ${objective.text}`);
      }
    }
  }
}

for (const code of missingFrameworks) {
  notes.push(`no framework published for Cambridge ${code} — src/curriculum/cambridge-mathematics-${code}.json `
    + "is absent, so units declaring it cannot have their objectives checked");
}
if (unmapped) {
  notes.push(`${unmapped} of ${units} units carry no Cambridge objective mapping — their alignment is unevidenced`);
}
if (unmapped > MAXIMUM_UNMAPPED) {
  failures.push(`units without an objective mapping rose from ${MAXIMUM_UNMAPPED} to ${unmapped}. `
    + "This number is allowed to fall, not grow.");
}

console.log(`math cambridge: ${units} units, ${codesChecked} objective references checked`);
for (const [code, framework] of [...frameworks].sort()) {
  const stages = Object.keys(framework.objectivesByStage || {}).sort().join(", ");
  console.log(`   framework ${code} available — stages ${stages}`);
}
for (const note of notes) console.log(`   note: ${note}`);
if (failures.length) {
  console.error(`✗ ${failures.length} math cambridge failure(s):`);
  for (const line of failures.slice(0, 30)) console.error(`   ${line}`);
  process.exit(1);
}
console.log("✓ math cambridge: every unit's stage and framework code agree; no objective claims a code it cannot support");
