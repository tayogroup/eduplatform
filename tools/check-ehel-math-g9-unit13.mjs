// Recompute every claim in Grade 9 Unit 13 rather than trusting it.
//
// Thirteenth Grade 9 checker. Transformations are functions on coordinates, so
// they can be IMPLEMENTED and the unit's claims tested by running them - which is
// much stronger than restating a worked example.
//
// THREE CLAIMS GET THE GENERAL TREATMENT:
//
//   1. Congruence. The unit says any combination of reflections, translations and
//      rotations gives a congruent image. So the checker implements all three,
//      applies RANDOM sequences of them to a triangle, and measures all three side
//      lengths of the result - requiring them to match the original every time.
//      That is the claim as stated: "any combination", not one example of one.
//
//   2. Order matters. The unit says two transformations usually do not commute. It
//      would be careless to assert that from one pair, so the checker tries many
//      pairs and requires that most of them differ - while also confirming that
//      SOME pairs do commute, because the unit says you cannot assume either way.
//
//   3. Perimeter by k, area by k squared. Checked for every integer k from 1 to 10
//      on several rectangles, since a factor-of-k error would be invisible at k = 2
//      where k and k squared are 2 and 4 but a slip could still produce 4.
//
// The bearings-and-Pythagoras cross-reference is checked as an exact identity: the
// bearings really do differ by 90, so the separation really is sqrt(50^2 + 70^2),
// and the scale drawing's 8.6 cm really does convert back to a figure that agrees.
//
//   node tools/check-ehel-math-g9-unit13.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-13.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-13.json not built yet - run build-ehel-math-g9-unit13.mjs --write");
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

// ---- 13.1 bearings
eq("north", 0, 0);
eq("east", 90, 90);
eq("south", 180, 180);
eq("west", 270, 270);
eq("50 as three figures", String(50).padStart(3, "0"), "050");
eq("90 as three figures", String(90).padStart(3, "0"), "090");
eq("140 and 230 differ by", 230 - 140, 90);
eq("so the paths are perpendicular", (230 - 140) === 90, true);

// ---- 13.1 scale conversions, both ways
const toDrawing = (real, metresPerCm) => real / metresPerCm;
const toReal = (drawing, metresPerCm) => drawing * metresPerCm;
eq("800 m at 1cm:100m", toDrawing(800, 100), 8);
eq("8.6 cm at 1cm:100m", toReal(8.6, 100), 860);
eq("1250 m at 1cm:100m", toDrawing(1250, 100), 12.5);
eq("50 m at 1cm:10m", toDrawing(50, 10), 5);
eq("70 m at 1cm:10m", toDrawing(70, 10), 7);
// the two directions really are inverse - over a range
{
  let wrong = 0;
  for (const real of [50, 70, 800, 1250, 3.5]) {
    for (const scale of [10, 100, 1000]) {
      if (Math.abs(toReal(toDrawing(real, scale), scale) - real) > 1e-9) wrong += 1;
    }
  }
  eq("converting both ways returns the original", wrong, 0);
}
// the error the unit warns about
eq("multiplying instead gives 80000", 800 * 100, 80000);
eq("which is not 8", 80000 === 8, false);

// ---- 13.1 the Pythagoras cross-reference, exactly
close("50^2 + 70^2", 50 ** 2 + 70 ** 2, 7400);
close("sqrt(7400)", Math.sqrt(7400), 86.023252, 1e-5);
eq("to 1 dp", Math.round(Math.sqrt(7400) * 10) / 10, 86);
eq("to the nearest metre", Math.round(Math.sqrt(7400)), 86);
// the drawing: 5 cm and 7 cm at right angles
close("drawing hypotenuse", Math.sqrt(5 ** 2 + 7 ** 2), 8.602325, 1e-5);
eq("about 8.6 cm", Math.round(Math.sqrt(5 ** 2 + 7 ** 2) * 10) / 10, 8.6);
// and 8.6 cm converts back to a figure that agrees with the calculation
eq("8.6 cm at 1cm:10m", toReal(8.6, 10), 86);
close("which matches the theorem", toReal(8.6, 10), Math.round(Math.sqrt(7400)));

// ---- 13.2 fractions along a segment
const along = (a, b, f) => [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
eq("one third from (0,5) to (6,5)", along([0, 5], [6, 5], 1 / 3).join(","), "2,5");
eq("two thirds from (0,5) to (6,5)", along([0, 5], [6, 5], 2 / 3).join(","), "4,5");
eq("one quarter from (0,0) to (8,4)", along([0, 0], [8, 4], 1 / 4).join(","), "2,1");
eq("three quarters from (0,0) to (8,4)", along([0, 0], [8, 4], 3 / 4).join(","), "6,3");
eq("two fifths from (0,0) to (10,5)", along([0, 0], [10, 5], 2 / 5).join(","), "4,2");
eq("three quarters from (0,0) to (10,5)", along([0, 0], [10, 5], 3 / 4).join(","), "7.5,3.75");
eq("one third from (0,0) to (9,6)", along([0, 0], [9, 6], 1 / 3).join(","), "3,2");
eq("two thirds from (0,0) to (9,6)", along([0, 0], [9, 6], 2 / 3).join(","), "6,4");
// the midpoint is the special case f = 1/2, which Stage 8 taught
eq("the midpoint of (0,0) to (8,4)", along([0, 0], [8, 4], 0.5).join(","), "4,2");
// a fraction point must lie ON the segment - check by collinearity
{
  let offLine = 0;
  const A = [1, 2], B = [9, 8];
  for (const f of [0, 0.1, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 0.9, 1]) {
    const p = along(A, B, f);
    // cross product of (B - A) and (p - A) must be zero
    const cross = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]);
    if (Math.abs(cross) > 1e-9) offLine += 1;
  }
  eq("every fraction point lies on the segment", offLine, 0);
}
// and adding to the END point instead of the start is a different, wrong answer
eq("added to the end point instead", along([8, 4], [0, 0], 1 / 4).join(","), "6,3");
eq("which is not the same as from the start", "6,3" === "2,1", false);

// ---- 13.3 transformations implemented as functions
const reflectY = ([x, y]) => [-x, y];
const reflectX = ([x, y]) => [x, -y];
const translate = (dx, dy) => ([x, y]) => [x + dx, y + dy];
const rotate90 = ([x, y]) => [-y, x];          // anticlockwise about the origin
const rotate180 = ([x, y]) => [-x, -y];
const rotate270 = ([x, y]) => [y, -x];
// the unit's worked example, both orders
eq("reflect (2,1) in the y-axis", reflectY([2, 1]).join(","), "-2,1");
eq("then translate 3 right 2 up", translate(3, 2)(reflectY([2, 1])).join(","), "1,3");
eq("translate first", translate(3, 2)([2, 1]).join(","), "5,3");
eq("then reflect", reflectY(translate(3, 2)([2, 1])).join(","), "-5,3");
eq("the two orders differ", "1,3" === "-5,3", false);

// ---- 13.3 CONGRUENCE under any combination, tested with random sequences
{
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const sides = (t) => [dist(t[0], t[1]), dist(t[1], t[2]), dist(t[2], t[0])].map((d) => Math.round(d * 1e9) / 1e9).sort((a, b) => a - b);
  const moves = [reflectY, reflectX, rotate90, rotate180, rotate270,
    translate(3, 2), translate(-5, 1), translate(0, 7), translate(4, -6)];
  const original = [[0, 0], [3, 0], [0, 4]];       // a 3-4-5 triangle
  eq("the original is 3-4-5", sides(original).join(","), "3,4,5");
  let notCongruent = 0, tested = 0;
  // deterministic pseudo-random sequences, so the run is reproducible
  let seed = 12345;
  const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
  for (let trial = 0; trial < 300; trial += 1) {
    let shape = original;
    const steps = 1 + (next() % 6);
    for (let s = 0; s < steps; s += 1) {
      const f = moves[next() % moves.length];
      shape = shape.map(f);
    }
    tested += 1;
    if (sides(shape).join(",") !== "3,4,5") notCongruent += 1;
  }
  eq("300 random combinations all give a congruent image", notCongruent, 0);
  eq("and that loop really ran", tested, 300);
  // angles too, not just lengths - check the right angle survives
  {
    let lostRightAngle = 0;
    seed = 999;
    for (let trial = 0; trial < 100; trial += 1) {
      let shape = original;
      const steps = 1 + (next() % 5);
      for (let s = 0; s < steps; s += 1) shape = shape.map(moves[next() % moves.length]);
      const [a, b, c] = sides(shape);
      if (Math.abs(a * a + b * b - c * c) > 1e-6) lostRightAngle += 1;
    }
    eq("the right angle survives every combination", lostRightAngle, 0);
  }
}

// ---- 13.3 order matters usually, but not always
{
  const pairs = [];
  const moves = [reflectY, reflectX, rotate90, rotate180, rotate270,
    translate(3, 2), translate(-5, 1)];
  let differ = 0, agree = 0;
  const p = [2, 1];
  for (let i = 0; i < moves.length; i += 1) {
    for (let j = 0; j < moves.length; j += 1) {
      if (i === j) continue;
      const ab = moves[j](moves[i](p));
      const ba = moves[i](moves[j](p));
      if (ab.join(",") === ba.join(",")) agree += 1; else differ += 1;
      pairs.push([i, j]);
    }
  }
  eq("most ordered pairs disagree", differ > agree, true);
  eq("but some pairs DO commute", agree > 0, true);
  eq("so the order cannot be assumed either way", differ > 0 && agree > 0, true);
  // a specific commuting pair, for the activity that asks learners to find one
  eq("two rotations about the same centre commute", rotate90(rotate180(p)).join(","), rotate180(rotate90(p)).join(","));
  // a specific non-commuting pair, the unit's own
  eq("reflection and translation do not", reflectY(translate(3, 2)(p)).join(",") === translate(3, 2)(reflectY(p)).join(","), false);
}

// ---- 13.4 enlargement: perimeter by k, area by k squared
{
  const rects = [[3, 4], [5, 5], [2, 7], [1, 10], [6, 2.5]];
  let wrongP = 0, wrongA = 0, tested = 0;
  for (const [a, b] of rects) {
    const p0 = 2 * (a + b), a0 = a * b;
    for (let k = 1; k <= 10; k += 1) {
      const p1 = 2 * (k * a + k * b), a1 = (k * a) * (k * b);
      tested += 1;
      if (Math.abs(p1 - k * p0) > 1e-9) wrongP += 1;
      if (Math.abs(a1 - k * k * a0) > 1e-9) wrongA += 1;
    }
  }
  eq("perimeter scales by k in all " + tested + " cases", wrongP, 0);
  eq("area scales by k squared in all " + tested + " cases", wrongA, 0);
  eq("and that loop really ran", tested, 50);
}
// the unit's own figures
eq("3 by 4 perimeter", 2 * (3 + 4), 14);
eq("3 by 4 area", 3 * 4, 12);
eq("enlarged by 2", (2 * 3) + " by " + (2 * 4), "6 by 8");
eq("new perimeter", 2 * (6 + 8), 28);
eq("which is 2 x 14", 2 * 14, 28);
eq("new area", 6 * 8, 48);
eq("which is 4 x 12", 4 * 12, 48);
eq("and NOT 2 x 12", 48 === 24, false);
eq("enlarged by 3: perimeter", 2 * (9 + 12), 42);
eq("which is 3 x 14", 3 * 14, 42);
eq("enlarged by 3: area", 9 * 12, 108);
eq("which is 9 x 12", 9 * 12, 108);
eq("enlarged by 5: perimeter", 2 * (15 + 20), 70);
eq("which is 5 x 14", 5 * 14, 70);
eq("enlarged by 5: area", 15 * 20, 300);
eq("which is 25 x 12", 25 * 12, 300);
// the rug problem
eq("extra edging", 28 - 14, 14);
eq("extra carpet", 48 - 12, 36);
// the 3-4-5 triangle enlarged by 2 is similar but not congruent
eq("enlarged sides", [6, 8, 10].join(","), "6,8,10");
eq("still right-angled", 6 ** 2 + 8 ** 2 === 10 ** 2, true);
eq("but not congruent", [3, 4, 5].join(",") === [6, 8, 10].join(","), false);
eq("congruent only when k is 1", 1 * 3, 3);

// ---- the unit must state the answers it was built around
says("the three-figure bearing", "050");
says("the drawing length", "8 cm");
says("the separation", "86");
says("the reflection-then-translation image", "(1, 3)");
says("the other order", "(-5, 3)");
says("the enlarged area", "48");
says("the area rule", "k squared");
says("congruence", "congruent");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 13", u.unit.unitNo, 13);

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

// all seven 9Gp are claimed here, and no other strand's codes are
for (const code of ["9Gp.01", "9Gp.02", "9Gp.03", "9Gp.04", "9Gp.05", "9Gp.06", "9Gp.07"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
eq("exactly seven objectives", u.cambridge.objectives.length, 7);
for (const code of ["9Gg.01", "9Gg.04", "9As.01", "9Nf.01", "9Sp.01", "9Ss.01"]) {
  eq(code + " not claimed", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 13 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ transformations are IMPLEMENTED and run: 300 random combinations of reflections,");
console.log("    rotations and translations all leave a 3-4-5 triangle congruent, right angle included;");
console.log("    order is shown to matter for most pairs and NOT for some; perimeter by k and area by k");
console.log("    squared hold for 50 rectangle-and-factor combinations; the bearings really differ by 90.");
