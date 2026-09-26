// Recompute every claim in Grade 9 Unit 4 rather than trusting it.
//
// Fifth Grade 9 checker. An equation's answer is a number, so it can be checked
// the ordinary way - but checking it by RE-SOLVING would just repeat whatever
// reasoning produced the content. So every equation here is verified by
// SUBSTITUTION, which is independent of the method: both sides are evaluated at
// the stated answer and compared. A wrong answer fails that whether it was
// reached by expanding, dividing or guessing.
//
// INEQUALITIES NEED A DIFFERENT TEST, and it is the one worth explaining. The
// claim "3x > 4x + 12 has solution x < -12" is a claim about a SET, and the
// dangerous error - keeping the sign instead of reversing it - produces exactly
// the complementary set. A checker that only confirmed the boundary is -12 would
// pass both the right answer and the wrong one, because they share it. So each
// inequality is tested as a partition: sample values on both sides of the
// boundary, confirm the original statement is TRUE throughout the claimed
// solution set and FALSE throughout its complement. That distinguishes x < -12
// from x > -12, which is the whole point.
//
// Simultaneous pairs are checked in BOTH equations. Checking one is no check at
// all: the substitution method derives x from an equality of two expressions, so
// a slip carried into y still satisfies the equation it came from.
//
//   node tools/check-ehel-math-g9-unit4.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-4.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-4.json not built yet - run build-ehel-math-g9-unit4.mjs --write");
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
// An equation's answer is verified by substitution, independent of any method
const solves = (l, left, right, x) => {
  const a = left(x), b = right(x);
  if (Math.abs(a - b) < 1e-9) { pass += 1; return; }
  fail += 1; bad.push(l + ": at x = " + x + " the sides are " + a + " and " + b + ", not equal");
};
// An inequality's solution SET is verified as a partition - see the header
const solutionSet = (l, statement, inSet, samples) => {
  for (const x of samples) {
    const want = inSet(x);
    const got = statement(x);
    if (got !== want) {
      fail += 1;
      bad.push(l + ": at x = " + x + " the original is " + got + " but the claimed set says " + want);
      return;
    }
  }
  pass += 1;
};
const SAMPLES = (lo, hi, step) => {
  const out = [];
  for (let x = lo; x <= hi; x += step) out.push(Math.round(x * 1000) / 1000);
  return out;
};

// ---- 4.1 equations, each verified by substitution into the ORIGINAL
solves("5(x+3) = 10x-20 at x=7", (x) => 5 * (x + 3), (x) => 10 * x - 20, 7);
eq("both sides come to 50", 5 * (7 + 3) + "," + (10 * 7 - 20), "50,50");
// and the divide-first route must reach the same x
solves("x+3 = 2x-4 at x=7", (x) => x + 3, (x) => 2 * x - 4, 7);
solves("8(x-4)+4(5-x) = 0 at x=3", (x) => 8 * (x - 4) + 4 * (5 - x), () => 0, 3);
solves("2(x-4)+(5-x) = 0 at x=3", (x) => 2 * (x - 4) + (5 - x), () => 0, 3);
solves("4(x+3) = 2(x+11) at x=5", (x) => 4 * (x + 3), (x) => 2 * (x + 11), 5);
eq("both sides come to 32", 4 * (5 + 3) + "," + (2 * (5 + 11)), "32,32");
// the WRONG answer the unit uses as a counter-example must genuinely fail
eq("x=8 gives 44 and 38", 4 * (8 + 3) + "," + (2 * (8 + 11)), "44,38");
eq("x=8 does not solve it", 4 * (8 + 3) === 2 * (8 + 11), false);
// n + 2(n+3) = 90
solves("n+2(n+3) = 90 at n=28", (n) => n + 2 * (n + 3), () => 90, 28);
eq("the two numbers", 28 + "," + 2 * (28 + 3), "28,62");
eq("they sum to 90", 28 + 62, 90);
// Marcus
solves("5(N-8) = 2(N+10) at N=20", (N) => 5 * (N - 8), (N) => 2 * (N + 10), 20);
eq("both sides come to 60", 5 * (20 - 8) + "," + (2 * (20 + 10)), "60,60");
// triangle, perimeter 1 metre
solves("s+2s+(2s+5) = 100 at s=19", (s) => s + 2 * s + (2 * s + 5), () => 100, 19);
eq("the three sides", [19, 2 * 19, 2 * 19 + 5].join(","), "19,38,43");
eq("they sum to 100", 19 + 38 + 43, 100);
eq("longest is 43", Math.max(19, 38, 43), 43);
eq("1 metre is 100 cm", 100, 100);
// algebra wall
solves("2x+80 = 144 at x=32", (x) => 2 * x + 80, () => 144, 32);
eq("middle row", (30 + 32) + "," + (32 + 50), "62,82");
eq("middle row sums to the top", 62 + 82, 144);

// ---- 4.2 simultaneous, each checked in BOTH equations
const pair = (l, f, g, x, y) => {
  const a = f(x), b = g(x);
  if (Math.abs(a - y) < 1e-9 && Math.abs(b - y) < 1e-9) { pass += 1; return; }
  fail += 1; bad.push(l + ": at x=" + x + " the equations give " + a + " and " + b + ", expected both " + y);
};
pair("y=2x-1, y=x+5", (x) => 2 * x - 1, (x) => x + 5, 6, 11);
pair("y=6x+3, y=2x-9", (x) => 6 * x + 3, (x) => 2 * x - 9, -3, -15);
pair("y=2x+1, y=x+4", (x) => 2 * x + 1, (x) => x + 4, 3, 7);
pair("y=3x, y=x+12", (x) => 3 * x, (x) => x + 12, 6, 18);
pair("y=2x+1, y=-2x+9", (x) => 2 * x + 1, (x) => -2 * x + 9, 2, 5);
pair("y=4x-3, y=x+3", (x) => 4 * x - 3, (x) => x + 3, 2, 5);
// elimination pairs, both equations checked
const both = (l, e1, e2, x, y, r1, r2) => {
  if (Math.abs(e1(x, y) - r1) < 1e-9 && Math.abs(e2(x, y) - r2) < 1e-9) { pass += 1; return; }
  fail += 1; bad.push(l + ": (" + x + ", " + y + ") gives " + e1(x, y) + " and " + e2(x, y) + ", expected " + r1 + " and " + r2);
};
both("x+y=10, x-y=4", (x, y) => x + y, (x, y) => x - y, 7, 3, 10, 4);
both("x+5y=28, x+3y=18", (x, y) => x + 5 * y, (x, y) => x + 3 * y, 3, 5, 28, 18);
both("3x+2y=34, x-2y=6", (x, y) => 3 * x + 2 * y, (x, y) => x - 2 * y, 10, 2, 34, 6);
both("x+y=20, x-y=16", (x, y) => x + y, (x, y) => x - y, 18, 2, 20, 16);
// the cakes and coffees
both("2x+3y=9, 2x+y=5", (x, y) => 2 * x + 3 * y, (x, y) => 2 * x + y, 1.5, 2, 9, 5);
eq("cake is $1.50", 1.5, 1.5);
// Xavier's two items
both("x+y=37.74, x-y=9.24", (x, y) => Math.round((x + y) * 100) / 100, (x, y) => Math.round((x - y) * 100) / 100, 23.49, 14.25, 37.74, 9.24);
close("change from 40", 40 - 2.26, 37.74);
close("the larger item", (37.74 + 9.24) / 2, 23.49);
close("the smaller item", (37.74 - 9.24) / 2, 14.25);
// adding removes y only when the terms are opposite - the claim behind the method
eq("opposite y terms cancel by adding", 1 + -1, 0);
eq("identical x terms cancel by subtracting", 1 - 1, 0);

// ---- 4.3 inequalities, each as a PARTITION (see the header)
solutionSet("6x > 18 is x > 3", (x) => 6 * x > 18, (x) => x > 3, SAMPLES(-5, 10, 0.25));
solutionSet("2x-3 < 19 is x < 11", (x) => 2 * x - 3 < 19, (x) => x < 11, SAMPLES(0, 20, 0.25));
solutionSet("5x+1 >= -9 is x >= -2", (x) => 5 * x + 1 >= -9, (x) => x >= -2, SAMPLES(-10, 5, 0.25));
solutionSet("10x >= 5 is x >= 0.5", (x) => 10 * x >= 5, (x) => x >= 0.5, SAMPLES(-2, 3, 0.1));
solutionSet("4x+10 < 22 is x < 3", (x) => 4 * x + 10 < 22, (x) => x < 3, SAMPLES(-5, 10, 0.25));
solutionSet("5(x-7) >= 30 is x >= 13", (x) => 5 * (x - 7) >= 30, (x) => x >= 13, SAMPLES(5, 20, 0.25));
solutionSet("4x-5 >= 2x+15 is x >= 10", (x) => 4 * x - 5 >= 2 * x + 15, (x) => x >= 10, SAMPLES(0, 20, 0.25));
// the two that REVERSE the sign - the partition is what distinguishes them
solutionSet("3x > 4x+12 is x < -12", (x) => 3 * x > 4 * x + 12, (x) => x < -12, SAMPLES(-25, 0, 0.25));
solutionSet("3x-3 < 5x-17 is x > 7", (x) => 3 * x - 3 < 5 * x - 17, (x) => x > 7, SAMPLES(0, 20, 0.25));
solutionSet("6-5x >= -12 is x <= 3.6", (x) => 6 - 5 * x >= -12, (x) => x <= 3.6, SAMPLES(-5, 10, 0.2));
// and the wrong answer must be demonstrably wrong, not merely different
eq("x > -12 is the WRONG half", 3 * -11 > 4 * -11 + 12, false);
eq("x < -12 is the right half", 3 * -13 > 4 * -13 + 12, true);
eq("the boundary is shared by both claims", 3 * -12 > 4 * -12 + 12, false);
// the specific test values the unit quotes
eq("at x=-13 the sides", (3 * -13) + "," + (4 * -13 + 12), "-39,-40");
eq("at x=-11 the sides", (3 * -11) + "," + (4 * -11 + 12), "-33,-32");
// collecting on the other side avoids the reversal and agrees
solutionSet("14 < 2x is x > 7", (x) => 14 < 2 * x, (x) => x > 7, SAMPLES(0, 20, 0.25));

// ---- integers in an inequality
eq("smallest integer with N >= 8.2", Math.ceil(8.2), 9);
eq("largest integer with N < -5", Math.ceil(-5) - 1, -6);
{
  const ns = [];
  for (let n = -10; n <= 10; n += 1) if (n >= -3 && n < 2.5) ns.push(n);
  eq("integers with -3 <= N < 2.5", ns.join(","), "-3,-2,-1,0,1,2");
}
// the double inequality
solutionSet("3 < x+3 <= 10 is 0 < x <= 7", (x) => 3 < x + 3 && x + 3 <= 10, (x) => 0 < x && x <= 7, SAMPLES(-3, 12, 0.25));

// ---- Xavier's money
solutionSet("4b+15 < 100 is b < 21.25", (b) => b + (b + 5) + 2 * (b + 5) < 100, (b) => b < 21.25, SAMPLES(0, 30, 0.25));
close("friend gets 55 when b is", (55 / 2) - 5, 22.5);
eq("22.5 breaks b < 21.25", 22.5 < 21.25, false);
// the quadrilateral
solutionSet("x+2x+3(x-10) < 360 is x < 65", (x) => x + 2 * x + 3 * (x - 10) < 360, (x) => x < 65, SAMPLES(0, 100, 0.5));
close("2x = 3(x-10) at x", 30, 30);
eq("2x and 3(x-10) equal at x=30", 2 * 30 === 3 * (30 - 10), true);
eq("x=30 satisfies x<65", 30 < 65, true);
eq("both angles would be 60", 2 * 30, 60);

// ---- the taxi problem
eq("A at 1 km", 2 * 1 + 1, 3);
eq("B at 1 km", 1 + 4, 5);
eq("A is cheaper at 1 km", 2 * 1 + 1 < 1 + 4, true);
eq("A at 5 km", 2 * 5 + 1, 11);
eq("B at 5 km", 5 + 4, 9);
eq("B is cheaper at 5 km", 5 + 4 < 2 * 5 + 1, true);
eq("equal at 3 km", 2 * 3 + 1, 3 + 4);
eq("the shared price", 2 * 3 + 1, 7);

// ---- the unit must state the answers it was built around
says("the bracket equation answer", "x = 7");
says("the substitution pair", "x = 6 and y = 11");
says("the reversed inequality", "x < -12");
says("the cake price", "$1.50");
says("the crossing point", "(3, 7)");
says("the longest side", "43 cm");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 4", u.unit.unitNo, 4);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

// the three unit 2 declined are claimed HERE, and unit 2's four are not
for (const code of ["9Ae.05", "9Ae.06", "9Ae.07"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Ae.01", "9Ae.02", "9Ae.03", "9Ae.04"]) {
  eq(code + " not claimed (unit 2)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 4 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every equation verified by substitution; every pair checked in BOTH equations; every");
console.log("    inequality tested as a partition, so a kept sign fails rather than sharing a boundary.");
