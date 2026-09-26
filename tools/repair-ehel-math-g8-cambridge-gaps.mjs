// Close the last six Cambridge Stage 8 objectives in Mathematics Grade 8.
//
// Grade 8 sat at 55/61 against cambridge-mathematics-0862.json. Five were
// already taught and uncited; one was half-taught and needed content. Every
// one was read before it was mapped.
//
// THE STRAND-OPENER HYPOTHESIS FROM GRADE 7 DOES NOT HOLD HERE, and it is
// worth saying so rather than quietly dropping it. In Grade 7, four of the six
// unmapped objectives were the first of their strand, and the commit for that
// grade suggested looking for the same pattern in Grade 8. Checked: only one
// of these six (8Ss.01) is a strand opener. The other five sit at .02 to .07.
// Whatever the Grade 7 mapping pass missed, it was not a rule that carries.
//
//   8Ae.05  words or formula, change the subject by inverse operations
//           MAPPING ONLY. unit 2, concepts[5].example: "Formulae can also be
//           rearranged to make a different letter the subject. If P = 2l + 2w
//           and you want w, undo the operations step by step", and
//           explorations[5] asks the learner to make h the subject of A = ½bh.
//
//   8As.07  graphs with more than one component, and their intersections
//           MAPPING ONLY. unit 11, outcomes[8]: "Solve problems by reading
//           values from a graph and by finding where two lines intersect",
//           with gradient and steepness explaining shape.
//
//   8Gg.04  derive the area formulae for parallelograms AND trapezia from
//           rectangles, squares and triangles
//           HALF TAUGHT. concepts[6] "Area of a Parallelogram" derives that
//           one properly - "like a rectangle that has been pushed over
//           sideways. If you cut a right-angled triangle..." - and nothing
//           derives the trapezium. Searched the whole grade: 'trapezi' appears
//           in unit 8 (naming the shape) and unit 15, and in unit 15 it is
//           only ever USED. workedExamples[0] opens "Use A = ½(a + b)h" and
//           computes; no "half the sum", no two-copies argument, no split into
//           triangles anywhere. An outcome and a self-assessment statement both
//           CLAIM trapezia, which is the shape of gap this repo already has a
//           name for. CONTENT ADDED.
//
//   8Ni.02  estimate, multiply and divide integers, recognising generalisations
//           MAPPING ONLY, but NOT to unit 1. Unit 1 is Integers and looks like
//           the home; its eleven "estimat" strings are all the boilerplate hint
//           "Estimate roughly what the answer should be, then pick the option
//           closest to it", in assessment questions and game rounds. No
//           teaching. The estimation teaching is unit 3, Place Value and
//           Rounding: workedExamples[6] "Estimate 398 / 49 by rounding to 1
//           significant figure" - an integer division - outcomes[7] on using
//           estimation to check reasonableness, and the one generalisation in
//           the grade, "multiplying by a number less than 1", which is in
//           unit 3 and in neither unit 1 nor unit 4.
//
//   8Ni.03  factors, multiples, prime factors, HCF and LCM
//           MAPPING ONLY. unit 1, outcomes[5] "write any integer as a product
//           of prime factors" and outcomes[6] "Find the HCF and LCM of two or
//           more numbers using prime factorisation". 108 matching strings.
//
//   8Ss.01  select, trial and justify data collection and sampling methods,
//           considering categorical, discrete and continuous data
//           MAPPING ONLY. unit 6, outcomes[2] "random, systematic, stratified
//           and convenience sampling", outcomes[3] population/sample/census,
//           outcomes[11] their advantages and disadvantages; and the data
//           types are throughout - discrete and continuous appear 90+ times
//           each.
//
//   node tools/repair-ehel-math-g8-cambridge-gaps.mjs [--write]
//
// Dry run unless --write. Idempotent.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNITS = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-8", "data", "units");
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

const MAP = [
  { unit: "unit-2.json", code: "8Ae.05", why: 'concepts[5] rearranges P = 2l + 2w for w' },
  { unit: "unit-11.json", code: "8As.07", why: 'outcomes[8] reading values and finding where two lines intersect' },
  { unit: "unit-15.json", code: "8Gg.04", why: 'concepts[6] derives the parallelogram; the trapezium derivation is added here' },
  { unit: "unit-3.json", code: "8Ni.02", why: 'workedExamples[6] estimates 398 / 49; the generalisation lives here too' },
  { unit: "unit-1.json", code: "8Ni.03", why: 'outcomes[5] prime factorisation, outcomes[6] HCF and LCM' },
  { unit: "unit-6.json", code: "8Ss.01", why: 'outcomes[2], [3] and [11] on sampling methods and their trade-offs' },
];

const CONTENT = {
  "unit-15.json": {
    outcomes: [
      "Derive the area formula for a trapezium from a parallelogram or from a rectangle and two triangles, and explain why it works.",
    ],
    concepts: [{
      id: "concept-8-where-the-trapezium-formula-comes-from",
      title: "Where the Trapezium Formula Comes From",
      explanation:
        "A trapezium has one pair of parallel sides, of lengths a and b, and a perpendicular height h. " +
        "The formula A = half of (a + b) times h can look like something to memorise, but it comes " +
        "straight out of the parallelogram you have already done. Take two identical trapezia. Turn " +
        "one of them upside down and push it against the other, long side to short side. The two " +
        "together make a PARALLELOGRAM, and you can see its base is a + b and its height is still h. " +
        "So the two trapezia have area (a + b) times h between them, and one trapezium is half of " +
        "that. That is the formula, and nothing was memorised to get it.",
      example:
        "The other route uses a rectangle and two triangles, which is worth seeing because it explains " +
        "the 'half the sum' in words. Drop a perpendicular from each end of the short parallel side. " +
        "That cuts the trapezium into a rectangle of width a and two right-angled triangles whose " +
        "bases together come to b - a. The rectangle has area a times h, and the two triangles " +
        "together have area half of (b - a) times h. Add them: ah + half of (b - a)h, which tidies to " +
        "half of (a + b) times h - the same formula. A trapezium with parallel sides 9 cm and 15 cm " +
        "and height 6 cm therefore has area half of 24 times 6 = 72 cm², and you can check that " +
        "against a 9 by 6 rectangle (54) plus two triangles totalling half of 6 times 6 (18).",
    }],
    referenceRules: [{
      title: "Trapezium Area Rule",
      text: "A trapezium is half a parallelogram with base a + b, so its area is half of (a + b) " +
            "multiplied by the perpendicular height. Add the parallel sides first, then halve, then " +
            "multiply by the height.",
    }],
    referenceTerms: [
      ["Parallel sides", "The two sides of a trapezium that never meet; their lengths are the a and b in the area formula"],
    ],
  },
};

let added = 0, already = 0;
const report = [];

for (const file of [...new Set([...MAP.map((m) => m.unit), ...Object.keys(CONTENT)])].sort()) {
  const p = path.join(UNITS, file);
  const raw = fs.readFileSync(p, "utf8");
  const j = JSON.parse(raw);
  if (raw !== JSON.stringify(j, null, 2) + "\n") {
    console.error("  REFUSED " + file + ": does not round-trip; writing would reformat it");
    process.exit(1);
  }
  const lines = [];

  const c = CONTENT[file];
  if (c) {
    for (const o of c.outcomes || []) {
      if (j.outcomes.includes(o)) { already++; continue; }
      j.outcomes.push(o); added++; lines.push("outcome  + " + o.slice(0, 70));
    }
    for (const k of c.concepts || []) {
      if (j.concepts.some((x) => x.id === k.id)) { already++; continue; }
      j.concepts.push(k); added++; lines.push("concept  + " + k.title);
    }
    for (const r of c.referenceRules || []) {
      j.reference.rules = j.reference.rules || [];
      if (j.reference.rules.some((x) => x.title === r.title)) { already++; continue; }
      j.reference.rules.push(r); added++; lines.push("rule     + " + r.title);
    }
    for (const t of c.referenceTerms || []) {
      j.reference.terms = j.reference.terms || [];
      if (j.reference.terms.some((x) => x[0] === t[0])) { already++; continue; }
      j.reference.terms.push(t); added++; lines.push("term     + " + t[0]);
    }
  }

  for (const m of MAP.filter((x) => x.unit === file)) {
    if (!fw[m.code]) { console.error("  REFUSED: " + m.code + " is not in 0862"); process.exit(1); }
    if (j.cambridge.objectives.some((o) => o.code === m.code)) { already++; continue; }
    j.cambridge.objectives.push({ code: m.code, text: fw[m.code] });
    added++; lines.push("OBJECTIVE+ " + m.code + "   " + m.why);
  }

  if (!lines.length) continue;
  report.push("  " + file.padEnd(14) + lines.join("\n                 "));
  if (WRITE) fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
}

console.log(report.join("\n"));
console.log("\n  " + added + " addition(s), " + already + " already present"
  + (WRITE ? ", written" : "   (--write to apply)"));
