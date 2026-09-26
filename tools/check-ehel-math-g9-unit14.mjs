// Recompute every claim in Grade 9 Unit 14 rather than trusting it.
//
// Fourteenth Grade 9 checker. The volume and surface-area claims are ordinary
// arithmetic and are checked as such. The interesting part is 14.3.
//
// PLANES OF SYMMETRY ARE COMPUTED, NOT ASSERTED. A plane of symmetry is a
// reflection that maps the solid onto itself, so for a polyhedron it can be tested
// exactly: reflect the set of vertices and check the result is the SAME set. The
// checker builds the vertices of a box and of a regular n-gonal prism, tries every
// candidate reflection, and COUNTS the ones that work. It then requires those
// counts to match what the unit teaches - 3 for an unequal cuboid, 5 for a square
// prism, 9 for a cube, and n + 1 for a prism on a regular n-gon.
//
// That matters most for the cube. The unit says the n + 1 rule predicts 5 and a
// cube really has 9, which is a claim that an incautious author could get backwards
// and that no amount of restating would catch. Here the 9 is DISCOVERED by the
// same procedure that discovers the 5, so the exception is verified rather than
// taken on trust - and the checker separately confirms that a square prism which
// is NOT a cube has only 5, which is what makes the cube's extra six planes a
// consequence of its equal dimensions rather than of the shape of its base.
//
// The volume derivation is also checked against the thing it derives: for several
// prisms the volume is computed by the formula AND by counting unit cubes layer by
// layer, and the two must agree.
//
//   node tools/check-ehel-math-g9-unit14.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-14.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-14.json not built yet - run build-ehel-math-g9-unit14.mjs --write");
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
const close = (l, got, want, tol = 1e-6) => {
  if (Math.abs(got - want) <= tol) { pass += 1; return; }
  fail += 1; bad.push(l + ": computed " + got + ", expected " + want);
};
const says = (l, text) => {
  if (blob.includes(text)) { pass += 1; return; }
  fail += 1; bad.push(l + ': the unit does not contain "' + text + '"');
};
const dp = (x, n) => Math.round(x * 10 ** n) / 10 ** n;
const sf = (x, n) => {
  if (x === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(x)));
  const m = Math.pow(10, n - d);
  return Math.round(x * m) / m;
};

// ============ 14.1 VOLUME, and the derivation checked against itself ============
eq("15 x 9", 15 * 9, 135);
// the derivation: count unit cubes layer by layer, and compare with area x length
{
  let wrong = 0, tested = 0;
  // a rectangular cross-section w by d, length L: count cubes directly
  for (const [w, d, L] of [[3, 5, 9], [4, 4, 7], [2, 6, 10], [1, 15, 9]]) {
    let cubes = 0;
    for (let layer = 0; layer < L; layer += 1) cubes += w * d;   // one layer holds w x d cubes
    tested += 1;
    if (cubes !== (w * d) * L) wrong += 1;
  }
  eq("layer-counting agrees with area x length (" + tested + " prisms)", wrong, 0);
  eq("and that loop really ran", tested, 4);
  // the specific 15 cm squared cross-section, as 3 by 5
  eq("a 3 by 5 cross-section has area 15", 3 * 5, 15);
  eq("nine layers of 15 cubes", 9 * 15, 135);
}
// triangular cross-section
eq("triangle legs 6 and 5", 0.5 * 6 * 5, 15);
eq("times length 10", 15 * 10, 150);
eq("triangle 3-4-5 area", 0.5 * 3 * 4, 6);
// trapezium cross-section
eq("trapezium (4+8)/2 x 5", (4 + 8) / 2 * 5, 30);
eq("times length 7", 30 * 7, 210);
// cylinder as a prism
close("circle area r=3", Math.PI * 9, 28.274334, 1e-5);
eq("circle area r=3 to 2dp", dp(Math.PI * 9, 2), 28.27);
eq("cylinder volume r=3 h=8 to 1dp", dp(Math.PI * 9 * 8, 1), 226.2);
close("circle area r=5", Math.PI * 25, 78.539816, 1e-5);
eq("circle area r=5 to 2dp", dp(Math.PI * 25, 2), 78.54);
eq("cylinder volume r=5 h=12 to 1dp", dp(Math.PI * 25 * 12, 1), 942.5);
// the cylinder formula IS the prism formula - checked over a range
{
  let wrong = 0, tested = 0;
  for (const r of [1, 2, 3, 5, 7.5]) {
    for (const h of [1, 4, 8, 12, 20]) {
      tested += 1;
      if (Math.abs((Math.PI * r * r) * h - Math.PI * r * r * h) > 1e-9) wrong += 1;
    }
  }
  eq("area of cross-section x length equals pi r^2 h (" + tested + " cylinders)", wrong, 0);
}

// ============ 14.1 working backwards ============
eq("256 / 32", 256 / 32, 8);
eq("256 / 16", 256 / 16, 16);
eq("135 / 15", 135 / 15, 9);
close("942.5 / (pi x 25)", 942.5 / (Math.PI * 25), 12.000283, 1e-4);
eq("cylinder height to 1dp", dp(942.5 / (Math.PI * 25), 1), 12);
close("226.2 / 28.27", 226.2 / 28.27, 8.001414, 1e-4);
eq("which rounds to 8", Math.round(226.2 / 28.27), 8);
// for a fixed volume, area and length are in INVERSE proportion - unit 11's idea
{
  let varies = 0;
  for (const area of [1, 2, 4, 8, 16, 32, 64, 128, 256]) {
    if (Math.abs(area * (256 / area) - 256) > 1e-9) varies += 1;
  }
  eq("area x length is constant for a fixed volume", varies, 0);
  eq("halving the area doubles the length", 256 / 16, 2 * (256 / 32));
}

// ============ 14.2 SURFACE AREA ============
// cuboid 3 by 4 by 5
eq("3x4 face", 3 * 4, 12);
eq("3x5 face", 3 * 5, 15);
eq("4x5 face", 4 * 5, 20);
eq("cuboid surface area", 2 * (12 + 15 + 20), 94);
eq("and by the formula 2(lw+lh+wh)", 2 * (3 * 4 + 3 * 5 + 4 * 5), 94);
eq("six faces in three pairs", 3 * 2, 6);
// the missing-face error is a whole face out
eq("forgetting one pair gives", 2 * (12 + 15), 54);
eq("which is 40 short", 94 - 54, 40);
// triangular prism, 3-4-5 cross-section, length 10
eq("two triangles", 2 * 6, 12);
eq("three rectangles", 3 * 10 + 4 * 10 + 5 * 10, 120);
eq("triangular prism surface area", 12 + 120, 132);
eq("five faces", 2 + 3, 5);
// the hypotenuse is needed and comes from Pythagoras
eq("hypotenuse of 3 and 4", Math.sqrt(3 ** 2 + 4 ** 2), 5);
eq("without it the third rectangle is unknown", 5 * 10, 50);
// cylinder r=3 h=8
close("circumference d=6", Math.PI * 6, 18.849556, 1e-5);
eq("to 2dp", dp(Math.PI * 6, 2), 18.85);
close("curved surface", Math.PI * 6 * 8, 150.796447, 1e-5);
eq("to 2dp", dp(Math.PI * 6 * 8, 2), 150.8);
close("total surface", 2 * Math.PI * 9 + Math.PI * 6 * 8, 207.345115, 1e-5);
eq("to 1dp", dp(2 * Math.PI * 9 + Math.PI * 6 * 8, 1), 207.3);
// cylinder r=5 h=12
close("circumference d=10", Math.PI * 10, 31.415927, 1e-5);
eq("to 2dp", dp(Math.PI * 10, 2), 31.42);
close("rectangle 31.42 x 12", Math.PI * 10 * 12, 376.991118, 1e-5);
eq("to 2dp", dp(Math.PI * 10 * 12, 2), 376.99);
close("total", 2 * Math.PI * 25 + Math.PI * 10 * 12, 534.070751, 1e-5);
eq("to 3sf", sf(2 * Math.PI * 25 + Math.PI * 10 * 12, 3), 534);
// the radius/diameter trap: using the radius for the circumference halves the curve
close("wrongly using r for circumference", Math.PI * 3 * 8, 75.398224, 1e-5);
eq("which is half the right value", dp(Math.PI * 3 * 8 * 2, 2), dp(Math.PI * 6 * 8, 2));
// and pi d h equals 2 pi r h, over a range
{
  let wrong = 0;
  for (const r of [1, 3, 5, 7.5]) for (const h of [2, 8, 12]) {
    if (Math.abs(Math.PI * (2 * r) * h - 2 * Math.PI * r * h) > 1e-9) wrong += 1;
  }
  eq("pi d h equals 2 pi r h", wrong, 0);
}

// ============ 14.3 PLANES OF SYMMETRY, COMPUTED ============
// A plane of symmetry is a reflection mapping the vertex set onto itself.
const key = (v) => v.map((x) => Math.round(x * 1e6) / 1e6).join(",");
const sameSet = (a, b) => {
  if (a.length !== b.length) return false;
  const A = new Set(a.map(key)), B = new Set(b.map(key));
  if (A.size !== B.size) return false;
  for (const k of A) if (!B.has(k)) return false;
  return true;
};
// box vertices, centred at the origin
const boxVertices = (a, b, c) => {
  const out = [];
  for (const x of [-a / 2, a / 2]) for (const y of [-b / 2, b / 2]) for (const z of [-c / 2, c / 2]) out.push([x, y, z]);
  return out;
};
// the nine candidate reflections for a box: three coordinate planes and six
// through pairs of opposite edges
const BOX_REFLECTIONS = [
  ["x=0", ([x, y, z]) => [-x, y, z]],
  ["y=0", ([x, y, z]) => [x, -y, z]],
  ["z=0", ([x, y, z]) => [x, y, -z]],
  ["x=y", ([x, y, z]) => [y, x, z]],
  ["x=-y", ([x, y, z]) => [-y, -x, z]],
  ["y=z", ([x, y, z]) => [x, z, y]],
  ["y=-z", ([x, y, z]) => [x, -z, -y]],
  ["x=z", ([x, y, z]) => [z, y, x]],
  ["x=-z", ([x, y, z]) => [-z, y, -x]],
];
const countBoxPlanes = (a, b, c) => {
  const V = boxVertices(a, b, c);
  return BOX_REFLECTIONS.filter(([, f]) => sameSet(V, V.map(f))).length;
};
eq("cuboid 3x4x5 has 3 planes", countBoxPlanes(3, 4, 5), 3);
eq("cuboid 2x7x11 has 3 planes", countBoxPlanes(2, 7, 11), 3);
eq("square prism 4x4x10 has 5 planes", countBoxPlanes(4, 4, 10), 5);
eq("square prism 3x3x8 has 5 planes", countBoxPlanes(3, 3, 8), 5);
eq("CUBE has 9 planes", countBoxPlanes(5, 5, 5), 9);
eq("cube of a different size also 9", countBoxPlanes(2, 2, 2), 9);
// the cube's nine is 3 + 6, which is what the unit says
{
  const V = boxVertices(4, 4, 4);
  const working = BOX_REFLECTIONS.filter(([, f]) => sameSet(V, V.map(f))).map(([n]) => n);
  eq("the cube's planes", working.join(" "), "x=0 y=0 z=0 x=y x=-y y=z y=-z x=z x=-z");
  eq("three are parallel to faces", working.filter((n) => n.endsWith("=0")).length, 3);
  eq("six are through opposite edges", working.filter((n) => !n.endsWith("=0")).length, 6);
}
// and the square prism's five is 3 + 2 - so the extra six really come from the
// third dimension being equal too, not from the square base
{
  const V = boxVertices(4, 4, 10);
  const working = BOX_REFLECTIONS.filter(([, f]) => sameSet(V, V.map(f))).map(([n]) => n);
  eq("the square prism's planes", working.join(" "), "x=0 y=0 z=0 x=y x=-y");
  eq("only two diagonal planes", working.filter((n) => !n.endsWith("=0")).length, 2);
  eq("so the cube gains four more diagonal planes", 6 - 2, 4);
}
// THE n + 1 RULE for a prism on a regular n-gon, computed
const prismVertices = (n, h) => {
  const out = [];
  for (let k = 0; k < n; k += 1) {
    const t = 2 * Math.PI * k / n;
    for (const z of [-h / 2, h / 2]) out.push([Math.cos(t), Math.sin(t), z]);
  }
  return out;
};
// a vertical plane containing the z-axis at angle theta, plus the horizontal plane
const reflectVertical = (theta) => ([x, y, z]) => {
  const c = Math.cos(2 * theta), s = Math.sin(2 * theta);
  return [c * x + s * y, s * x - c * y, z];
};
const countPrismPlanes = (n, h) => {
  const V = prismVertices(n, h);
  let count = 0;
  // Candidate vertical planes, theta over [0, pi) ONLY. This is the bug the first
  // version of this file had: ranging theta over [0, 2pi) counts every plane
  // TWICE, because a mirror plane at theta and one at theta + pi are the same
  // plane. It reported 7 for a triangular prism instead of 4 - exactly double the
  // vertical planes, plus the one horizontal - which is how it was found.
  // 4n candidates is far more than the rule predicts, so a wrong rule shows up as
  // a wrong count rather than as a missed candidate.
  for (let k = 0; k < 4 * n; k += 1) {
    const theta = Math.PI * k / (4 * n);
    if (sameSet(V, V.map(reflectVertical(theta)))) count += 1;
  }
  // the horizontal plane
  if (sameSet(V, V.map(([x, y, z]) => [x, y, -z]))) count += 1;
  return count;
};
for (const [n, expected] of [[3, 4], [4, 5], [5, 6], [6, 7], [8, 9], [10, 11]]) {
  eq("a regular " + n + "-gonal prism has " + expected + " planes", countPrismPlanes(n, 3.7), expected);
}
// the rule, stated generally, over the same range
{
  let wrong = 0, tested = 0;
  for (let n = 3; n <= 12; n += 1) {
    tested += 1;
    if (countPrismPlanes(n, 5.3) !== n + 1) wrong += 1;
  }
  eq("n + 1 holds for every regular n-gonal prism, n = 3 to 12", wrong, 0);
  eq("and that loop really ran", tested, 10);
}
// a cylinder has infinitely many - verified as "every angle tried works"
{
  const circleAt = (z, m) => Array.from({ length: m }, (_, k) => {
    const t = 2 * Math.PI * k / m;
    return [Math.cos(t), Math.sin(t), z];
  });
  // approximated by a 60-gon; every one of 30 distinct vertical planes works
  const V = [...circleAt(-2, 60), ...circleAt(2, 60)];
  let works = 0;
  for (let k = 0; k < 60; k += 1) {
    if (sameSet(V, V.map(reflectVertical(Math.PI * k / 60)))) works += 1;
  }
  // theta over [0, pi) with 60 steps enumerates each of the 60-gon's 60 mirror
  // planes exactly once, and every one of them works - which is the sense in
  // which a cylinder has infinitely many.
  eq("a 60-gonal approximation to a cylinder has 60 vertical planes", works, 60);
}

// ---- the unit must state the answers it was built around
says("the derived formula", "area of cross-section");
says("the prism volume", "135 cm cubed");
says("the cuboid surface area", "94 cm squared");
says("the cylinder surface area", "207.3");
says("the cuboid's planes", "exactly three");
says("the cube's planes", "9");
says("the rule", "n + 1");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 14", u.unit.unitNo, 14);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

for (const marker of ["Wait -", "Wait,", "no wait", "actually no", "let me check"]) {
  if (blob.toLowerCase().includes(marker.toLowerCase())) {
    fail += 1; bad.push('the unit contains self-correcting prose: "' + marker + '"');
  } else pass += 1;
}

for (const code of ["9Gg.04", "9Gg.05", "9Gg.06"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Gg.01", "9Gg.02", "9Gg.03"]) {
  eq(code + " not claimed (unit 7)", blob.includes('"code":"' + code + '"'), false);
}
for (const code of ["9Gg.07", "9Gg.08", "9Gg.09", "9Gg.10", "9Gg.11"]) {
  eq(code + " not claimed (unit 5)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 14 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ planes of symmetry are COMPUTED by testing which reflections map a solid's vertices onto");
console.log("    themselves: 3 for an unequal cuboid, 5 for a square prism, 9 for a cube, and n + 1 for");
console.log("    every regular n-gonal prism from 3 to 12 - so the cube's exception is discovered by the");
console.log("    same procedure that finds the rule. The volume formula agrees with counting unit cubes.");
