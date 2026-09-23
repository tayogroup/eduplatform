#!/usr/bin/env node
// Validates Professor Adow TVET occupational standards files against THEMSELVES.
//
// This is the TVET equivalent of validate:frameworks for Cambridge. It is a
// separate tool on purpose: validate-unit.mjs is English-shaped (it demands
// readings, grammar, speaking and writing sections and a per-outcome
// cambridgeObjectives field) and reports dozens of false failures when pointed
// at any other subject. Pointing it at carpentry would be worse.
//
// WHAT IT PROVES, and what it does not. It proves the file is internally
// consistent: codes unique and well-formed, units contiguous, counts equal to
// the arrays, every assessmentMode declared, every leadsTo code real. It does
// NOT prove a criterion is well written, correctly placed, or actually taught
// by any lesson — that is what reading the content and the coverage gate on the
// BUILT pages are for. A green run here means the spine is sound, never that
// the teaching matches it.
//
// Usage: node tools/validate-adow-standards.mjs [file ...]
//        defaults to src/curriculum/adow-*.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CURRICULUM = path.join(ROOT, "src", "curriculum");

const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => path.resolve(ROOT, a))
  : fs.readdirSync(CURRICULUM).filter((f) => /^adow-.*\.json$/.test(f)).map((f) => path.join(CURRICULUM, f));

if (!files.length) {
  console.error("validate-adow-standards: no adow-*.json found in src/curriculum — nothing to check.");
  process.exit(3); // NOT CHECKED is neither agreement nor drift.
}

let problems = 0;
const bad = (file, message) => { console.error(`  ✗ ${path.basename(file)}: ${message}`); problems += 1; };

for (const file of files) {
  const fw = JSON.parse(fs.readFileSync(file, "utf8"));
  const name = path.basename(file);

  for (const field of ["framework", "curriculumCode", "codePrefix", "codeScheme", "assessmentModes", "modules", "counts"]) {
    if (!fw[field]) bad(file, `missing top-level "${field}"`);
  }
  if (problems) continue;

  const modes = new Set(Object.keys(fw.assessmentModes));
  const leadsToCodes = new Set((fw.leadsToFramework?.units || []).map((u) => u.code));
  const seen = new Set();
  let unitCount = 0;
  let criterionCount = 0;
  const byMode = {};

  for (const mod of fw.modules) {
    for (const field of ["key", "code", "title", "units"]) {
      if (!mod[field]) bad(file, `module "${mod.key || "?"}" is missing "${field}"`);
    }
    if (!mod.units?.length) { bad(file, `module "${mod.key}" has no units`); continue; }

    // Unit numbers must run 1..N in order. A gap would make a unit's position
    // and its number disagree, and the lesson builder keys on the number.
    mod.units.forEach((unit, i) => {
      if (unit.number !== i + 1) {
        bad(file, `module "${mod.key}" unit numbers must run 1..${mod.units.length} in order (found ${unit.number} at position ${i + 1})`);
      }
      if (unit.code !== `${mod.code}.${String(unit.number).padStart(2, "0")}`) {
        bad(file, `unit code "${unit.code}" should be "${mod.code}.${String(unit.number).padStart(2, "0")}"`);
      }
      unitCount += 1;

      if (!unit.criteria?.length) { bad(file, `unit ${unit.code} has no criteria`); return; }

      unit.criteria.forEach((c, j) => {
        criterionCount += 1;
        const expected = `${fw.codePrefix || fw.curriculumCode}-${unit.code}.${j + 1}`;
        if (c.code !== expected) bad(file, `criterion code "${c.code}" should be "${expected}"`);
        if (seen.has(c.code)) bad(file, `duplicate criterion code "${c.code}"`);
        seen.add(c.code);

        if (!c.text || c.text.length < 20) bad(file, `${c.code}: text is missing or too short to be a criterion`);
        if (!modes.has(c.assessmentMode)) {
          bad(file, `${c.code}: assessmentMode "${c.assessmentMode}" is not declared in assessmentModes`);
        } else {
          byMode[c.assessmentMode] = (byMode[c.assessmentMode] || 0) + 1;
        }
        if (!c.evidence) bad(file, `${c.code}: no evidence stated — a blended qualification cannot leave this blank`);

        // A leadsTo code that is not in leadsToFramework is a claim about
        // another qualification that this file cannot support.
        for (const code of c.leadsTo || []) {
          if (!leadsToCodes.has(code)) bad(file, `${c.code}: leadsTo "${code}" is not a unit of leadsToFramework`);
        }
      });
    });
  }

  // The counts block is a CLAIM. This is the check that catches a hand-written
  // total drifting from the arrays it describes — the Cambridge framework
  // validator exists largely for this one failure.
  const actual = {
    modules: fw.modules.length,
    units: unitCount,
    criteria: criterionCount,
    byAssessmentMode: byMode,
  };
  if (fw.counts.modules !== actual.modules) bad(file, `counts.modules says ${fw.counts.modules}, arrays hold ${actual.modules}`);
  if (fw.counts.units !== actual.units) bad(file, `counts.units says ${fw.counts.units}, arrays hold ${actual.units}`);
  if (fw.counts.criteria !== actual.criteria) bad(file, `counts.criteria says ${fw.counts.criteria}, arrays hold ${actual.criteria}`);
  for (const mode of modes) {
    const claimed = fw.counts.byAssessmentMode?.[mode] ?? 0;
    const real = byMode[mode] || 0;
    if (claimed !== real) bad(file, `counts.byAssessmentMode.${mode} says ${claimed}, arrays hold ${real}`);
  }

  if (!problems) {
    const pct = (n) => Math.round((n / criterionCount) * 100);
    console.log(`  ✓ ${name}: ${actual.modules} module(s), ${actual.units} unit(s), ${actual.criteria} criteria`);
    console.log(`    assessable by the platform: ${byMode.knowledge || 0} knowledge (${pct(byMode.knowledge || 0)}%), ` +
                `${byMode.both || 0} both (${pct(byMode.both || 0)}%), ${byMode.practical || 0} bench-only (${pct(byMode.practical || 0)}%)`);
  }
}

if (problems) {
  console.error(`\nvalidate-adow-standards: ${problems} problem(s).`);
  process.exit(1);
}
console.log("Adow standards validation passed.");
