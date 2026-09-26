// Recompute every claim in Grade 9 Unit 2 rather than trusting it.
//
// Third of the Grade 9 checkers. Same premise as units 12 and 1: the grade is
// authored, not generated, so nothing upstream has already done arithmetic on
// this content.
//
// ALGEBRA NEEDS A DIFFERENT KIND OF CHECK FROM ARITHMETIC, and that is why this
// file is not a copy of the last two. "x^2 + 5x + 6" is not a number, so there
// is nothing to recompute directly. What CAN be computed is the thing an
// expansion CLAIMS: that two expressions agree for every value of x. So every
// expansion and every simplification here is tested by evaluating both sides at
// several values - a numeric test of an algebraic claim.
//
// A sign error, a lost cross term, a wrong index: each makes the two sides
// disagree at almost any x, so a handful of points is a strong test. The values
// include 0, a negative and a non-integer precisely because a defect can hide
// at x = 1 (where every coefficient collapses into its own sum) and at x = 2
// (where powers of two coincide with each other often enough to matter).
//
//   node tools/check-ehel-math-g9-unit2.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-2.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-2.json not built yet - run build-ehel-math-g9-unit2.mjs --write");
  process.exit(1);
}
const u = JSON.parse(fs.readFileSync(UNIT, "utf8"));
const blob = JSON.stringify(u);

let pass = 0, fail = 0;
const bad = [];
const eq = (l, got, want) => {
  if (String(got) === String(want)) { pass += 1; return; }
  fail += 1; bad.push(l + ": computed " + got + ", expected " + want);
};
const says = (l, text) => {
  if (blob.includes(text)) { pass += 1; return; }
  fail += 1; bad.push(l + ': the unit does not contain "' + text + '"');
};
// An algebraic identity is checked numerically at several values, including 0,
// a negative and a fraction - see the header.
const XS = [0, 1, 2, 3, -1, -4, 0.5];
const identity = (l, left, right) => {
  for (const x of XS) {
    const a = left(x), b = right(x);
    if (Math.abs(a - b) > 1e-9) {
      fail += 1; bad.push(l + ": sides disagree at x = " + x + " (" + a + " vs " + b + ")");
      return;
    }
  }
  pass += 1;
};

// ---- substitution, and the order of operations the unit is about
eq("4x + 4 at x = 2", 4 * 2 + 4, 12);
eq("the wrong answer it warns against", 4 * (2 + 4), 24);
eq("2x^2 at x = 3", 2 * 3 ** 2, 18);
eq("the wrong answer (2x)^2", (2 * 3) ** 2, 36);
eq("3x + 5 at x = 4", 3 * 4 + 5, 17);
eq("x^2 - 1 at x = 5", 5 ** 2 - 1, 24);
eq("2x^2 + 3 at x = 3", 2 * 3 ** 2 + 3, 21);

// ---- negatives and integer powers
eq("(-2)^3", (-2) ** 3, -8);
eq("(-2)^2", (-2) ** 2, 4);
eq("-(a^2) at a = -2", -((-2) ** 2), -4);
eq("a^3 + 2b at a = -2, b = -1", (-2) ** 3 + 2 * -1, -10);
eq("2b^2 at b = -3", 2 * (-3) ** 2, 18);

// ---- index laws, as exponent arithmetic AND numerically at a base
eq("x^3 x x^4 adds to 7", 3 + 4, 7);
eq("x^6 / x^2 subtracts to 4", 6 - 2, 4);
identity("x^3 x x^4 = x^7", (x) => x ** 3 * x ** 4, (x) => x ** 7);
identity("x^6 / x^2 = x^4", (x) => (x === 0 ? 0 : x ** 6 / x ** 2), (x) => (x === 0 ? 0 : x ** 4));
identity("3a^2 x 5a^3 = 15a^5", (a) => 3 * a ** 2 * (5 * a ** 3), (a) => 15 * a ** 5);
identity("10x^5 / 2x^2 = 5x^3", (x) => (x === 0 ? 0 : 10 * x ** 5 / (2 * x ** 2)), (x) => (x === 0 ? 0 : 5 * x ** 3));
identity("y^2 x y^5 = y^7", (y) => y ** 2 * y ** 5, (y) => y ** 7);
identity("12m^6 / 4m^2 = 3m^4", (m) => (m === 0 ? 0 : 12 * m ** 6 / (4 * m ** 2)), (m) => (m === 0 ? 0 : 3 * m ** 4));
identity("(2a)^3 = 8a^3", (a) => (2 * a) ** 3, (a) => 8 * a ** 3);

// ---- expansions: every claim in the unit, tested as an identity
identity("(x+3)(x+2) = x^2+5x+6", (x) => (x + 3) * (x + 2), (x) => x ** 2 + 5 * x + 6);
identity("(x+3)(x-3) = x^2-9", (x) => (x + 3) * (x - 3), (x) => x ** 2 - 9);
identity("(x+4)(x+1) = x^2+5x+4", (x) => (x + 4) * (x + 1), (x) => x ** 2 + 5 * x + 4);
identity("(x+5)(x-5) = x^2-25", (x) => (x + 5) * (x - 5), (x) => x ** 2 - 25);
identity("2(x+5) = 2x+10", (x) => 2 * (x + 5), (x) => 2 * x + 10);
// the four products the unit insists on, summed back to the collected form
identity("four products collect", (x) => x * x + x * 2 + 3 * x + 3 * 2, (x) => x ** 2 + 5 * x + 6);
// the WRONG expansion the unit uses as a counter-example must really be wrong
eq("x^2 + 6 is not the expansion", (1 + 3) * (1 + 2) === 1 ** 2 + 6, false);
eq("the counter-example values", (1 + 3) * (1 + 2) + " vs " + (1 ** 2 + 6), "12 vs 7");

// ---- algebraic fractions
identity("10x/2 = 5x", (x) => 10 * x / 2, (x) => 5 * x);
identity("6a^3/3a = 2a^2", (a) => (a === 0 ? 0 : 6 * a ** 3 / (3 * a)), (a) => (a === 0 ? 0 : 2 * a ** 2));
identity("8a^4/2a = 4a^3", (a) => (a === 0 ? 0 : 8 * a ** 4 / (2 * a)), (a) => (a === 0 ? 0 : 4 * a ** 3));
// the Teacher's Resource critique example: BOTH of Arun's and Zara's routes must
// land on the same correct answer, or the example has no point
identity("6x^5 / 3x^2 = 2x^3", (x) => (x === 0 ? 0 : 6 * x ** 5 / (3 * x ** 2)), (x) => (x === 0 ? 0 : 2 * x ** 3));
eq("Arun's route: 6/3 and 5-2", (6 / 3) + "," + (5 - 2), "2,3");
eq("Zara's route: the same exponent", 5 - 2, 3);

// ---- (3n)^2 vs 3n^2: the unit claims they agree at exactly one value
eq("(3n)^2 at n = 2", (3 * 2) ** 2, 36);
eq("3n^2 at n = 2", 3 * 2 ** 2, 12);
{
  // "never equal except at one value of n" - 9n^2 = 3n^2 gives 6n^2 = 0, so n = 0
  const agree = [];
  for (let n = -5; n <= 5; n += 0.5) if (Math.abs((3 * n) ** 2 - 3 * n ** 2) < 1e-12) agree.push(n);
  eq("(3n)^2 = 3n^2 only at n = 0", agree.join(","), "0");
}

// ---- formulae and changing the subject, checked in BOTH directions
eq("v = u + at at u=3, a=2, t=4", 3 + 2 * 4, 11);
eq("a = (v - u)/t recovers a", (11 - 3) / 4, 2);
eq("t = (v - u)/a recovers t", (11 - 3) / 2, 4);
eq("P = RH + W at R=5.2, H=5, W=65", 5.2 * 5 + 65, 91);
eq("H = (P - W)/R recovers H", (91 - 65) / 5.2, 5);

// ---- the real problems' arithmetic
eq("perimeter 2(x+5) at x = 3", 2 * (3 + 5), 16);
eq("area 5x at x = 3", 5 * 3, 15);
eq("(x+3)(x+2) at x = 4 both ways", (4 + 3) * (4 + 2) + "," + (4 ** 2 + 5 * 4 + 6), "42,42");
eq("(2a)^3 at a = 3 both ways", 8 * 3 ** 3 + "," + 6 ** 3, "216,216");
eq("2a^2 at a = 4", 2 * 4 ** 2, 32);

// ---- the unit must actually state the answers it was built around
says("the expansion", "x^2 + 5x + 6");
says("the difference of two squares", "x^2 - 9");
says("the index law product", "x^7");
says("changing the subject", "a = (v - u)/t");
says("the pay formula rearranged", "H = (P - W)/R");
says("the order-of-operations answer", "8 + 4 = 12");
says("the critique example", "6x^5 divided by 3x^2");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 2", u.unit.unitNo, 2);

// every assessment answer must be one of its own options - a typo here is
// invisible to a learner and fatal to the quiz
for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

// 9Ae.05/.06/.07 are unit 4's - the mapping note says so and the data must agree
for (const code of ["9Ae.05", "9Ae.06", "9Ae.07"]) {
  eq(code + " not claimed", blob.includes('"code":"' + code + '"'), false);
}
for (const code of ["9Ae.01", "9Ae.02", "9Ae.03", "9Ae.04"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}

console.log("  Grade 9 Unit 2 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every expansion and simplification holds as an identity; both formula rearrangements invert;");
console.log("    9Ae.05/.06/.07 correctly left for unit 4; structure consistent.");
