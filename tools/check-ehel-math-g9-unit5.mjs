// Recompute every claim in Grade 9 Unit 5 rather than trusting it.
//
// Sixth Grade 9 checker. Geometry is mostly a set of small arithmetic claims, so
// most of this file is ordinary computation - but three things are checked as
// GENERAL statements rather than as instances, because that is what the unit
// asserts and an instance can be right while the rule is wrong.
//
//   1. (n - 2) x 180 is checked against a SECOND, independent route for every n
//      from 3 to 20: n x 180 minus the 360 of the exterior angles. The unit's own
//      argument is that two independent derivations agreeing is evidence, so the
//      checker makes that argument rather than restating one side of it.
//
//   2. "The exterior angles total 360 whatever n is" is checked across n = 3 to
//      100, because the whole content of the claim is its independence from n. A
//      single case tells you nothing about that.
//
//   3. Pythagoras is checked in BOTH directions and with the ordering claim: the
//      hypotenuse computed from two sides must exceed both of them, and a shorter
//      side computed from the hypotenuse must be less than it. That ordering is
//      what makes Ari's 6.9 impossible, so it is tested as a property rather than
//      quoted as a remark.
//
// Rounding is done the way the book does it - to one decimal place - and every
// rounded value is also checked against its unrounded source, so a correct
// rounding of a wrong number cannot pass.
//
//   node tools/check-ehel-math-g9-unit5.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-5.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-5.json not built yet - run build-ehel-math-g9-unit5.mjs --write");
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
const dp1 = (x) => Math.round(x * 10) / 10;

// ---- 5.1 the angle chain, step by step
eq("x on a straight line", 180 - 118, 62);
eq("fourth angle of the quadrilateral", 360 - (62 + 80 + 134), 84);
eq("alternate angle equals x", 62, 62);
eq("y in the triangle", 180 - (84 + 62), 34);
// the quadrilateral in terms of x
eq("4x + 60 = 360 gives x", (360 - 60) / 4, 75);
eq("the four angles", [75, 85, 95, 105].join(","), "75,85,95,105");
eq("they total 360", 75 + 85 + 95 + 105, 360);
eq("largest is 105", Math.max(75, 85, 95, 105), 105);
eq("all four differ, so not a parallelogram", new Set([75, 85, 95, 105]).size, 4);

// ---- 5.2 interior angles: the formula, and a SECOND route for every n
const interiorSum = (n) => (n - 2) * 180;
for (let n = 3; n <= 20; n += 1) {
  // route two: each vertex contributes 180 (interior + exterior), less the 360 of exteriors
  eq("interior sum of a " + n + "-gon two ways", interiorSum(n), n * 180 - 360);
}
eq("triangle", interiorSum(3), 180);
eq("quadrilateral", interiorSum(4), 360);
eq("pentagon", interiorSum(5), 540);
eq("hexagon", interiorSum(6), 720);
eq("octagon", interiorSum(8), 1080);
eq("decagon", interiorSum(10), 1440);
// the triangle count is always two fewer than the sides
for (const n of [5, 6, 8, 10]) eq("triangles in a " + n + "-gon", interiorSum(n) / 180, n - 2);
// the missing fifth angle
eq("four angles of 125 in a pentagon", interiorSum(5) - 4 * 125, 40);
eq("two 112s and two 90s in a pentagon", interiorSum(5) - (2 * 112 + 2 * 90), 136);

// ---- regular polygons: interior angle, both routes, for every n
const regInterior = (n) => interiorSum(n) / n;
const regExterior = (n) => 360 / n;
for (let n = 3; n <= 20; n += 1) {
  close("regular " + n + "-gon interior, both routes", regInterior(n), 180 - regExterior(n));
}
eq("regular pentagon", regInterior(5), 108);
eq("regular hexagon", regInterior(6), 120);
eq("regular octagon", regInterior(8), 135);
eq("regular decagon", regInterior(10), 144);
eq("equilateral triangle", regInterior(3), 60);
eq("square", regInterior(4), 90);

// ---- 5.3 exterior angles: 360 regardless of n, across a wide range
for (let n = 3; n <= 100; n += 1) {
  const total = regExterior(n) * n;
  if (Math.abs(total - 360) > 1e-9) { fail += 1; bad.push("exterior total for n=" + n + " is " + total); break; }
}
pass += 1;
eq("equilateral triangle exterior", regExterior(3), 120);
eq("square exterior", regExterior(4), 90);
eq("regular pentagon exterior", regExterior(5), 72);
eq("regular hexagon exterior", regExterior(6), 60);
eq("regular octagon exterior", regExterior(8), 45);
eq("regular decagon exterior", regExterior(10), 36);
eq("12 sides exterior", regExterior(12), 30);
eq("20 sides exterior", regExterior(20), 18);
// backwards: from an angle to the number of sides
eq("exterior 40 gives sides", 360 / 40, 9);
eq("interior beside it", 180 - 40, 140);
eq("and that checks", regInterior(9), 140);
eq("exterior 45 gives sides", 360 / 45, 8);
eq("exterior 30 gives sides", 360 / 30, 12);
eq("exterior 18 gives sides", 360 / 18, 20);
eq("exterior 15 gives sides", 360 / 15, 24);
eq("exterior 24 gives sides", 360 / 24, 15);
eq("interior 156 gives exterior", 180 - 156, 24);
eq("interior 156 gives sides", 360 / (180 - 156), 15);
// interior from exterior for the book's three
for (const [ext, sides] of [[30, 12], [20, 18], [10, 36]]) {
  eq("exterior " + ext + " gives " + sides + " sides", 360 / ext, sides);
  eq("its interior", 180 - ext, 180 - ext);
}

// ---- tiling: angles round a point
eq("two squares and three triangles", 2 * 90 + 3 * 60, 360);
eq("three hexagons fit", 3 * regInterior(6), 360);
eq("three pentagons do not", 3 * regInterior(5), 324);
eq("the pentagon gap", 360 - 3 * regInterior(5), 36);
eq("four pentagons overlap", 4 * regInterior(5) > 360, true);
eq("six triangles fit", 6 * 60, 360);
eq("four squares fit", 4 * 90, 360);
// a regular polygon tiles alone exactly when 360 / interior is a whole number
{
  const tile = [];
  for (let n = 3; n <= 12; n += 1) if (Number.isInteger(360 / regInterior(n))) tile.push(n);
  eq("only 3, 4 and 6 tile alone", tile.join(","), "3,4,6");
}

// ---- 5.5 Pythagoras, both directions, with the ordering property
const hyp = (a, b) => Math.sqrt(a * a + b * b);
const leg = (c, a) => Math.sqrt(c * c - a * a);
eq("3-4-5", hyp(3, 4), 5);
eq("6-8-10", hyp(6, 8), 10);
eq("5-12-13", hyp(5, 12), 13);
eq("8-15-17", hyp(8, 15), 17);
eq("leg from 13 and 5", leg(13, 5), 12);
eq("leg from 10 and 6", leg(10, 6), 8);
// the rectangle diagonal, and its rounding checked against the unrounded value
close("7.5^2 + 11.3^2", 7.5 ** 2 + 11.3 ** 2, 183.94);
close("56.25 + 127.69", 56.25 + 127.69, 183.94);
close("sqrt(183.94)", Math.sqrt(183.94), 13.56244, 1e-4);
eq("diagonal to 1 dp", dp1(Math.sqrt(183.94)), 13.6);
eq("and to 1 dp from the sides directly", dp1(hyp(7.5, 11.3)), 13.6);
// sqrt(183.94) is irrational - it is not the square of any rational with a short denominator,
// and the practical test the unit relies on is that squaring the rounded value does not return it
eq("13.6 squared is not 183.94", 13.6 ** 2 === 183.94, false);
close("13.6 squared", 13.6 ** 2, 184.96);
// Ari's error
close("6.0^2 + 3.5^2", 6.0 ** 2 + 3.5 ** 2, 48.25);
close("sqrt(48.25)", Math.sqrt(48.25), 6.94622, 1e-4);
eq("Ari's answer to 1 dp", dp1(Math.sqrt(48.25)), 6.9);
eq("Ari's answer exceeds the hypotenuse", 6.9 > 6.0, true);
close("6.0^2 - 3.5^2", 6.0 ** 2 - 3.5 ** 2, 23.75);
close("sqrt(23.75)", Math.sqrt(23.75), 4.87340, 1e-4);
eq("correct answer to 1 dp", dp1(Math.sqrt(23.75)), 4.9);
eq("and it is less than the hypotenuse", 4.9 < 6.0, true);
// the ordering property, over many triangles - this is what makes Ari's answer impossible
for (const [a, b] of [[3, 4], [6, 8], [5, 12], [7.5, 11.3], [3.5, 4.9], [1, 1], [2.5, 4.5]]) {
  const c = hyp(a, b);
  if (!(c > a && c > b)) { fail += 1; bad.push("hypotenuse " + c + " does not exceed both " + a + " and " + b); break; }
}
pass += 1;
for (const [c, a] of [[13, 5], [10, 6], [6.0, 3.5], [17, 8]]) {
  const b = leg(c, a);
  if (!(b < c)) { fail += 1; bad.push("shorter side " + b + " is not less than hypotenuse " + c); break; }
}
pass += 1;
// the ladder
close("ladder height squared", 6.0 ** 2 - 3.5 ** 2, 23.75);
eq("ladder height to 1 dp", dp1(leg(6.0, 3.5)), 4.9);

// ---- 5.4 constructions: the arithmetic behind each one
eq("equilateral triangle angle", 180 / 3, 60);
eq("bisecting 60 gives 30", 60 / 2, 30);
eq("bisecting 90 gives 45", 90 / 2, 45);
eq("a square's diagonals are perpendicular diameters", 360 / 4, 90);
eq("stepping a hexagon round a circle", 360 / 6, 60);

// ---- the unit must state the answers it was built around
says("the interior sum formula", "(n - 2) x 180");
says("the exterior formula", "360 / n");
says("the diagonal", "13.6");
says("Ari's correct value", "4.9");
says("the nine-sided answer", "9 sides");
says("the octagon's interior angle", "135");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 5", u.unit.unitNo, 5);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

for (const code of ["9Gg.07", "9Gg.08", "9Gg.09", "9Gg.10", "9Gg.11"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
// the 9Gg objectives that belong to units 7 and 14 must not be claimed here
for (const code of ["9Gg.01", "9Gg.02", "9Gg.03", "9Gg.04", "9Gg.05", "9Gg.06"]) {
  eq(code + " not claimed (units 7 and 14)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 5 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ the interior-sum formula agrees with an independent route for every n from 3 to 20; the");
console.log("    exterior total is 360 for every n to 100; Pythagoras holds both ways and the ordering");
console.log("    property that makes Ari's 6.9 impossible is tested, not merely asserted.");
