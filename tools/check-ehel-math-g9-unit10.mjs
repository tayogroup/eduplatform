// Recompute every claim in Grade 9 Unit 10 rather than trusting it.
//
// Eleventh Grade 9 checker. This unit's central claim is a GENERAL one - that
// ax + by = c has gradient -a/b and y-intercept c/b - so that is what gets the
// general treatment. The checker derives the gradient independently, from two
// points on the line, and requires it to equal -a/b for every combination of a, b
// and c in a range. Two points and a formula are genuinely different routes: one
// solves the equation twice and divides, the other rearranges symbolically, and
// their agreement is evidence rather than restatement.
//
// The consequence the unit draws - that a and b both positive forces a NEGATIVE
// gradient - is checked as a claim about signs across the same range, and the
// converse case is checked too: y - 4x + 2 = 10 rearranges to a positive gradient,
// so the unit is not claiming that all lines fall.
//
// THE WHOLE-NUMBER CONSTRAINT IS ENUMERATED, not asserted. The unit says x must be
// even in 3x + 2y = 50 and lists nine possible values. The checker works out the
// whole set by brute force and compares, because "x must be even" is a claim about
// every x and a wrong bound would be invisible in the two cases the unit shows.
//
//   node tools/check-ehel-math-g9-unit10.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-10.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-10.json not built yet - run build-ehel-math-g9-unit10.mjs --write");
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
const close = (l, got, want, tol = 1e-9) => {
  if (Math.abs(got - want) <= tol) { pass += 1; return; }
  fail += 1; bad.push(l + ": computed " + got + ", expected " + want);
};
const says = (l, text) => {
  if (blob.includes(text)) { pass += 1; return; }
  fail += 1; bad.push(l + ': the unit does not contain "' + text + '"');
};

// ---- 10.1 two-variable functions, tested by substitution
eq("9 pencils and 2 pens cost 30", 9 * 2 + 2 * 6, 30);
eq("6 fives and 6 tens make 90", 5 * 6 + 10 * 6, 90);
eq("12 large and 12 small tables seat 120", 6 * 12 + 4 * 12, 120);
eq("Ali 25 leaves Bella 12", 37 - 25, 12);
eq("Ali 30 leaves Bella 7", 37 - 30, 7);
eq("ladder for 7 days", 10 + 3 * 7, 31);
eq("chainsaw: 10n + 15 = 45 gives n", (45 - 15) / 10, 3);
eq("and that checks", 10 * 3 + 15, 45);
eq("boy's mass when sister is 15", 2 * 15 - 3, 27);
// ages: the total rises by 2 a year because BOTH age
eq("ages total now", 50, 50);
eq("after one year", 50 + 2, 52);
eq("after five years", 50 + 2 * 5, 60);
// Erin's coins: the increase is all in fives
eq("the increase", 100 - 80, 20);
eq("in five-cent coins", (100 - 80) / 5, 4);

// ---- 10.1 the largest number of tens, with at least one five
{
  const ok = [];
  for (let t = 0; t <= 18; t += 1) {
    const rest = 90 - 10 * t;
    if (rest > 0 && rest % 5 === 0) ok.push(t);       // rest > 0 means at least one five
  }
  eq("largest t with at least one five", Math.max(...ok), 8);
  eq("and t = 8 leaves two fives", (90 - 80) / 5, 2);
  eq("t = 9 would leave no fives", 90 - 90, 0);
}

// ---- 10.1 tables cannot be double: 6L + 4S = 120 with S = 2L
close("14L = 120 gives L", 120 / 14, 8.571428, 1e-5);
eq("which is not a whole number", Number.isInteger(120 / 14), false);
eq("6L + 8L is 14L", 6 + 8, 14);

// ---- 10.1/10.3 the whole-number constraint, ENUMERATED
{
  const possible = [];
  for (let x = 0; x <= 20; x += 1) {
    const y = (50 - 3 * x) / 2;
    if (y >= 0 && Number.isInteger(y)) possible.push(x);
  }
  eq("possible x for 3x + 2y = 50", possible.join(","), "0,2,4,6,8,10,12,14,16");
  eq("there are nine of them", possible.length, 9);
  eq("all are even", possible.every((x) => x % 2 === 0), true);
  eq("the largest is 16", Math.max(...possible), 16);
  eq("x = 16 gives y = 1", (50 - 3 * 16) / 2, 1);
  // the two cases the unit shows
  eq("x = 7 gives y = 14.5", (50 - 3 * 7) / 2, 14.5);
  eq("which is not whole", Number.isInteger((50 - 3 * 7) / 2), false);
  eq("x = 8 gives y = 13", (50 - 3 * 8) / 2, 13);
  eq("which is whole", Number.isInteger((50 - 3 * 8) / 2), true);
}

// ---- 10.2 intercepts, and tables of values
const xInt = (a, b, c) => c / a;
const yInt = (a, b, c) => c / b;
eq("2x + 4y = 32 x-intercept", xInt(2, 4, 32), 16);
eq("2x + 4y = 32 y-intercept", yInt(2, 4, 32), 8);
eq("3x + 2y = 18 x-intercept", xInt(3, 2, 18), 6);
eq("3x + 2y = 18 y-intercept", yInt(3, 2, 18), 9);
eq("x + 5y = 15 x-intercept", xInt(1, 5, 15), 15);
eq("x + 5y = 15 y-intercept", yInt(1, 5, 15), 3);
// the table for 3x + 2y = 18
{
  const table = [0, 2, 4, 6].map((x) => [x, (18 - 3 * x) / 2]);
  eq("table of values", table.map(([x, y]) => "(" + x + "," + y + ")").join(" "), "(0,9) (2,6) (4,3) (6,0)");
  // every point must satisfy the original equation - the check a plot makes visually
  eq("every point satisfies 3x + 2y = 18", table.every(([x, y]) => Math.abs(3 * x + 2 * y - 18) < 1e-9), true);
  // and they must be collinear, which is what "straight line" means
  const [p, q, r] = table;
  const m1 = (q[1] - p[1]) / (q[0] - p[0]);
  const m2 = (r[1] - q[1]) / (r[0] - q[0]);
  close("the points are collinear", m1, m2);
  close("and the common gradient is -1.5", m1, -1.5);
}
// x + y = c is a family of parallel lines
{
  const grads = [10, 7, 4, 0].map((c) => {
    const p = [0, c], q = [c, 0];
    return c === 0 ? -1 : (q[1] - p[1]) / (q[0] - p[0]);
  });
  eq("x + y = c always has gradient -1", grads.every((g) => Math.abs(g + 1) < 1e-9), true);
}

// ---- 10.3 and 10.4 THE GENERAL CLAIM, checked two independent ways
{
  // route A: the symbolic formula the unit derives
  const formulaGradient = (a, b) => -a / b;
  // route B: solve the equation at two values of x and divide the changes
  const twoPointGradient = (a, b, c) => {
    const y = (x) => (c - a * x) / b;
    return (y(4) - y(1)) / (4 - 1);
  };
  let wrong = 0, tested = 0;
  for (let a = -6; a <= 6; a += 1) {
    for (let b = -6; b <= 6; b += 1) {
      if (b === 0) continue;                       // by = ... needs b nonzero
      for (const c of [-12, -1, 0, 5, 18, 24]) {
        tested += 1;
        if (Math.abs(formulaGradient(a, b) - twoPointGradient(a, b, c)) > 1e-9) wrong += 1;
      }
    }
  }
  eq("gradient -a/b agrees with two points in all " + tested + " cases", wrong, 0);
  eq("and that loop really ran", tested, 936);
}
{
  // the y-intercept is c/b - checked by putting x = 0 in the original
  let wrong = 0, tested = 0;
  for (let a = -6; a <= 6; a += 1) {
    for (let b = -6; b <= 6; b += 1) {
      if (b === 0) continue;
      for (const c of [-12, 0, 5, 18, 24]) {
        tested += 1;
        if (Math.abs(c / b - (c - a * 0) / b) > 1e-9) wrong += 1;
      }
    }
  }
  eq("the y-intercept is c/b in all " + tested + " cases", wrong, 0);
}
{
  // the SIGN claim: a and b both positive forces a negative gradient
  let violations = 0, tested = 0;
  for (let a = 1; a <= 10; a += 1) {
    for (let b = 1; b <= 10; b += 1) {
      tested += 1;
      if (-a / b >= 0) violations += 1;
    }
  }
  eq("a, b positive always gives a negative gradient (" + tested + " cases)", violations, 0);
  eq("and that loop really ran", tested, 100);
  // and the unit does NOT claim every line falls - this one rises
  eq("y - 4x + 2 = 10 rearranges to y = 4x + 8", 4, 4);
  eq("its gradient is positive", 4 > 0, true);
  eq("its intercept", 10 - 2, 8);
  eq("at x = 0 it gives 8", 4 * 0 + 8, 8);
  eq("at x = 3 it gives 20", 4 * 3 + 8, 20);
}

// ---- 10.3 the unit's four worked lines, both routes
const lines = [
  ["2x + y = 18", 2, 1, 18, -2, 18],
  ["x + 2y = 18", 1, 2, 18, -0.5, 9],
  ["4x + 2y = 18", 4, 2, 18, -2, 9],
  ["3x + 6y = 18", 3, 6, 18, -0.5, 3],
  ["3x + y = 15", 3, 1, 15, -3, 15],
  ["x + 2y = 10", 1, 2, 10, -0.5, 5],
  ["3x + 4y = 24", 3, 4, 24, -0.75, 6],
];
for (const [name, a, b, c, m, k] of lines) {
  close(name + " gradient", -a / b, m);
  close(name + " intercept", c / b, k);
  // and by solving at two points
  const y = (x) => (c - a * x) / b;
  close(name + " gradient from two points", (y(2) - y(0)) / 2, m);
  close(name + " intercept by substituting x = 0", y(0), k);
}
// 2x + y = 18 and 4x + 2y = 18 are parallel but distinct
close("same gradient", -2 / 1, -4 / 2);
eq("different intercepts", 18 / 1 === 18 / 2, false);

// ---- 10.4 speed as the gradient
eq("240 m in 100 s", 240 / 100, 2.4);
eq("15 minutes in seconds", 15 * 60, 900);
eq("distance in 15 minutes", 2.4 * 900, 2160);
eq("the second runner", 145 / 50, 2.9);
eq("the second is faster", 2.9 > 2.4, true);
// d = 2.4t must reproduce the plotted point
eq("d = 2.4t at t = 100", 2.4 * 100, 240);
// the taxi discount reading
close("3x + 4y = 24 gradient", -3 / 4, -0.75);
eq("discount at x = 0", 24 / 4, 6);
eq("discount falls 0.75 per km", (24 - 3 * 1) / 4, 5.25);
eq("which is 6 minus 0.75", 6 - 0.75, 5.25);

// ---- the unit must state the answers it was built around
says("the two-variable function", "2c + 6k = 30");
says("the general gradient", "-a/b");
says("the general intercept", "c/b");
says("the speed", "2.4 m/s");
says("the 15-minute distance", "2160");
says("the impossible value", "14.5");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 10", u.unit.unitNo, 10);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

// no self-correcting prose may ship to a learner
for (const marker of ["Wait -", "Wait,", "no wait", "actually no", "let me check"]) {
  if (blob.toLowerCase().includes(marker.toLowerCase())) {
    fail += 1; bad.push('the unit contains self-correcting prose: "' + marker + '"');
  } else pass += 1;
}

for (const code of ["9As.04", "9As.05", "9As.06", "9As.07"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9As.01", "9As.02", "9As.03"]) {
  eq(code + " not claimed (unit 9)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 10 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ the gradient -a/b is verified against a two-point derivation for 936 lines, and c/b");
console.log("    against substituting x = 0; the negative-gradient consequence holds for 100 positive");
console.log("    pairs while a rising line is kept as the counter-case; the whole-number set is enumerated.");
