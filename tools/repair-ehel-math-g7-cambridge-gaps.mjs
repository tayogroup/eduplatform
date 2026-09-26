// Map the last six Cambridge Stage 7 objectives in Mathematics Grade 7.
//
// Grade 7 sat at 57/63 against cambridge-mathematics-0862.json. Unlike Grade 6,
// where three of five gaps needed teaching written, ALL SIX OF THESE ARE
// TAUGHT ALREADY and were simply never cited. Every one was read before it was
// mapped, and the quoted line is the evidence:
//
//   7Ae.01  letters represent unknown numbers, variables or constants
//           unit 2, outcomes[0]: "Recognise the parts of an algebraic
//           expression: variables, coefficients, terms and constants." 174
//           matching strings in the unit.
//
//   7Gg.03  parts of a circle: centre radius diameter circumference chord
//           tangent
//           unit 8, outcomes[0]: "Identify and describe the parts of a circle
//           - centre, radius, diameter, circumference, chord, arc, sector and
//           tangent - and use the relationship d = 2r". That is the objective
//           with two extra parts thrown in. NOT unit 15, which only uses the
//           radius to compute areas.
//
//   7Gg.11  derive that the angles in a quadrilateral sum to 360 and use it
//           SPLIT, and mapped to BOTH halves. unit 8 derives it -
//           explorations[2].answer: "its interior angles always add up to
//           360" - and unit 5 uses it: realProblems[3] gives three angles of a
//           quadrilateral field and asks for the fourth. The objective names
//           both actions, so both units carry the code. Other codes in this
//           grade already appear in several units (7Ni.04 is in 1, 7 and 12),
//           so this is the existing convention rather than a new one.
//
//   7Gp.01  use knowledge of scaling to interpret maps and plans
//           unit 12, outcomes[8]: "Use scale and scale factors to work between
//           map, model or drawing sizes and real sizes", and concepts[5]:
//           "Scale is a special use of ratio that compares the size of a map,
//           drawing or model with the real object it represents." 71 matching
//           strings. NOT unit 14, which is the obvious guess from the strand
//           letter Gp and is wrong: its scaling is enlargement by a scale
//           factor about a centre, and its only map is a coordinate grid of
//           Kismaayo used for a translation vector. Searched all sixteen units
//           before choosing.
//
//   7Ni.02  brackets, positive indices and operations follow a particular order
//           unit 1, outcomes[9]: "Use the correct order of operations with
//           powers, roots and integers", with BIDMAS worked through in
//           workedExamples 7, 8 and 11.
//
//   7Sp.01  language of probability and proportion, to describe, compare,
//           order and interpret likelihood
//           unit 13, outcomes[0] carries the language - "impossible, unlikely,
//           even chance, likely and certain" - and outcomes[1] carries the
//           comparing and ordering: "Place events on a probability scale from
//           0 to 1 and read values off it." 107 matching strings.
//
// FOUR OF THE SIX ARE THE FIRST OBJECTIVE OF THEIR STRAND (7Ae.01, 7Gp.01,
// 7Ni.02, 7Sp.01). That is not a coincidence worth ignoring: the original
// mapping pass appears to have skipped some strand openers, which are usually
// the "understand / know the language" objective that a unit satisfies in its
// opening outcome rather than in a method or a worked example. If Grade 8 is
// missing its strand openers too, that is where to look first.
//
// This adds no content, because none was missing. A pass that had written
// teaching for these would have duplicated what the units already say.
//
//   node tools/repair-ehel-math-g7-cambridge-gaps.mjs [--write]
//
// Dry run unless --write. Idempotent.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNITS = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-7", "data", "units");
const FRAMEWORK = path.resolve(HERE, "..", "src", "curriculum",
  "cambridge-mathematics-0862.json");
const WRITE = process.argv.includes("--write");

const fw = {};
(function walk(o) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (o.code && /^[1-9][A-Z][a-z]{1,2}\.\d{2}$/.test(o.code)) fw[o.code] = o.text || o.statement || "";
  Object.values(o).forEach(walk);
})(JSON.parse(fs.readFileSync(FRAMEWORK, "utf8")));

// unit -> codes, with the line that justifies each one
const MAP = [
  { unit: "unit-2.json", code: "7Ae.01", why: 'outcomes[0] "variables, coefficients, terms and constants"' },
  { unit: "unit-8.json", code: "7Gg.03", why: 'outcomes[0] names centre, radius, diameter, circumference, chord and tangent' },
  { unit: "unit-8.json", code: "7Gg.11", why: 'explorations[2] derives the 360 sum' },
  { unit: "unit-5.json", code: "7Gg.11", why: 'realProblems[3] uses it to find a fourth angle' },
  { unit: "unit-12.json", code: "7Gp.01", why: 'outcomes[8] scale between map/model/drawing and real sizes' },
  { unit: "unit-1.json", code: "7Ni.02", why: 'outcomes[9] order of operations with powers and roots' },
  { unit: "unit-13.json", code: "7Sp.01", why: 'outcomes[0] the language, outcomes[1] the 0-1 scale' },
];

let added = 0, already = 0;
const report = [];

for (const file of [...new Set(MAP.map((m) => m.unit))].sort()) {
  const p = path.join(UNITS, file);
  const raw = fs.readFileSync(p, "utf8");
  const j = JSON.parse(raw);

  // the units must round-trip byte-identical, or writing would reformat the file
  if (raw !== JSON.stringify(j, null, 2) + "\n") {
    console.error("  REFUSED " + file + ": does not round-trip; writing would reformat it");
    process.exit(1);
  }

  const lines = [];
  for (const m of MAP.filter((x) => x.unit === file)) {
    if (!fw[m.code]) { console.error("  REFUSED: " + m.code + " is not in 0862"); process.exit(1); }
    if (j.cambridge.objectives.some((o) => o.code === m.code)) { already++; continue; }
    j.cambridge.objectives.push({ code: m.code, text: fw[m.code] });
    added++; lines.push(m.code + "   " + m.why);
  }
  if (!lines.length) continue;
  report.push("  " + file.padEnd(14) + lines.join("\n                 "));
  if (WRITE) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
}

console.log(report.join("\n"));
console.log("\n  " + added + " objective(s) mapped, " + already + " already present"
  + (WRITE ? ", written" : "   (--write to apply)"));
