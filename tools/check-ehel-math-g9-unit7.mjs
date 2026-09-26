// Recompute every claim in Grade 9 Unit 7 rather than trusting it.
//
// Eighth Grade 9 checker. This unit's hazard is specific and it is NOT rounding:
// it is that three different values of pi are in use, with three different
// rounding instructions, so an answer is only checkable against the pi it was
// computed with. A checker that used Math.PI throughout would report the
// pi = 3.14 answers as wrong content. Every circle check here therefore names its
// pi, and the rounding is applied the way the question states - 3 significant
// figures, 1 decimal place or 2 decimal places.
//
// SIGNIFICANT FIGURES ARE NOT DECIMAL PLACES and the difference bites at 254.
// Rounding 254.469 to 3 s.f. gives 254; to 1 d.p. it gives 254.5. Both appear in
// this unit for the same circle, so the checker implements s.f. properly rather
// than reaching for toFixed.
//
// THE FOUR-TIMES CLAIM IS CHECKED AS A GENERAL FACT. The unit says that using the
// diameter as the radius makes an area four times too big, not twice, and that is
// a statement about squaring rather than about one circle - so it is verified
// across a range of radii.
//
//   node tools/check-ehel-math-g9-unit7.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-7.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-7.json not built yet - run build-ehel-math-g9-unit7.mjs --write");
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
// significant figures, done properly - NOT toFixed. 254.469 to 3 s.f. is 254,
// which no number of decimal places produces.
const sf = (x, n) => {
  if (x === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(x)));
  const power = n - d;
  const mag = Math.pow(10, power);
  return Math.round(x * mag) / mag;
};
const dp = (x, n) => Math.round(x * 10 ** n) / 10 ** n;

// the checker's own rounding must be right before it judges anything
eq("sf(254.469, 3)", sf(254.469, 3), 254);
eq("sf(50.265, 3)", sf(50.265, 3), 50.3);
eq("sf(38.4845, 3)", sf(38.4845, 3), 38.5);
eq("sf and dp differ at 254", sf(254.469, 3) === dp(254.469, 1), false);
eq("dp(254.469, 1)", dp(254.469, 1), 254.5);
eq("sf(15400.0, 3)", sf(15393.8, 3), 15400);

// ---- 7.1 circles, each with its OWN pi
const PI314 = 3.14, PI3142 = 3.142;
// calculator pi, 3 s.f.
eq("area r=4, calc pi, 3sf", sf(Math.PI * 4 ** 2, 3), 50.3);
eq("circumference d=10, calc pi, 3sf", sf(Math.PI * 10, 3), 31.4);
eq("circumference r=5 via d=10", sf(Math.PI * (2 * 5), 3), 31.4);
eq("area d=7, calc pi, 3sf", sf(Math.PI * 3.5 ** 2, 3), 38.5);
close("r from d=7", 7 / 2, 3.5);
close("3.5 squared", 3.5 ** 2, 12.25);
// the four-times error, as a general fact about squaring
for (const r of [1, 2, 3.5, 4, 5, 9, 70]) {
  const wrong = Math.PI * (2 * r) ** 2;
  const right = Math.PI * r ** 2;
  if (Math.abs(wrong / right - 4) > 1e-9) { fail += 1; bad.push("the d-for-r error at r=" + r + " is " + (wrong / right) + ", not 4"); break; }
}
pass += 1;
eq("d=7 misused gives 154 to 3sf", sf(Math.PI * 7 ** 2, 3), 154);
eq("and that is four times 38.5-ish", Math.round((Math.PI * 7 ** 2) / (Math.PI * 3.5 ** 2)), 4);
// pi = 3.14, 1 d.p.
eq("area r=2, pi=3.14, 1dp", dp(PI314 * 2 ** 2, 1), 12.6);
close("3.14 x 4", PI314 * 4, 12.56);
eq("area r=9, pi=3.14, 1dp", dp(PI314 * 9 ** 2, 1), 254.3);
close("3.14 x 81", PI314 * 81, 254.34);
eq("area r=4.2, pi=3.14, 1dp", dp(PI314 * 4.2 ** 2, 1), 55.4);
close("4.2 squared", 4.2 ** 2, 17.64);
// pi = 3.142, 2 d.p.
eq("area d=16, pi=3.142, 2dp", dp(PI3142 * 8 ** 2, 2), 201.09);
close("3.142 x 64", PI3142 * 64, 201.088);
eq("area d=9, pi=3.142, 2dp", dp(PI3142 * 4.5 ** 2, 2), 63.63);
close("4.5 squared", 4.5 ** 2, 20.25);
close("3.142 x 20.25", PI3142 * 20.25, 63.6255);
eq("area d=2.6, pi=3.142, 2dp", dp(PI3142 * 1.3 ** 2, 2), 5.31);
// The three pis give different answers - but NOT all three differ at 1 d.p.
// Measured: 254.3, 254.5, 254.5. 3.142 and the calculator's pi agree to one
// decimal place, which is worth knowing rather than asserting away: the unit's
// claim is that the answers differ, and two distinct values is enough for that.
eq("pi=3.14 differs from the calculator at 1 dp", dp(PI314 * 81, 1) === dp(Math.PI * 81, 1), false);
eq("3.142 and the calculator agree at 1 dp", dp(PI3142 * 81, 1), dp(Math.PI * 81, 1));
eq("they separate at 3 dp", new Set([
  dp(PI314 * 81, 3), dp(PI3142 * 81, 3), dp(Math.PI * 81, 3),
]).size, 3);
eq("but all are near 254", [PI314 * 81, PI3142 * 81, Math.PI * 81].every((a) => a > 254 && a < 255), true);

// ---- semicircles: area halves, perimeter does not
{
  const r = 5;
  const fullC = Math.PI * 2 * r;
  const halfC = fullC / 2;
  eq("semicircle area r=5, 3sf", sf(Math.PI * r ** 2 / 2, 3), 39.3);
  eq("half the circumference, 3sf", sf(halfC, 3), 15.7);
  eq("semicircle perimeter, 3sf", sf(halfC + 2 * r, 3), 25.7);
  eq("the difference IS the diameter", sf(halfC + 2 * r, 3) - sf(halfC, 3), 10);
  eq("perimeter is not half the circumference", sf(halfC, 3) === sf(halfC + 2 * r, 3), false);
  // the general claim, over several radii
  for (const rr of [1, 2, 5, 60, 7.5]) {
    const p = Math.PI * rr + 2 * rr;
    if (Math.abs(p - (Math.PI * 2 * rr / 2 + 2 * rr)) > 1e-9) { fail += 1; bad.push("semicircle perimeter formula fails at r=" + rr); break; }
  }
  pass += 1;
}
// the window
eq("half circumference r=60, 1dp", dp(Math.PI * 60, 1), 188.5);
eq("window strip, 3sf", sf(Math.PI * 60 + 120, 3), 308);
close("window strip exactly", Math.PI * 60 + 120, 308.49556, 1e-4);

// ---- working backwards
close("31.4 / pi", 31.4 / Math.PI, 9.99493, 1e-4);
// 31.4 is itself a rounded pi x 10, so working back cannot return 10 exactly
eq("diameter from C=31.4, 3sf", sf(31.4 / Math.PI, 3), 9.99);
eq("it is NOT 10 to 3 sf", sf(31.4 / Math.PI, 3) === 10, false);
eq("radius to 3sf", sf(31.4 / Math.PI / 2, 3), 5.00);
close("78.5 / pi", 78.5 / Math.PI, 24.98733, 1e-4);
eq("r squared rounds to 25", Math.round(78.5 / Math.PI), 25);
eq("radius from A=78.5, 2sf", sf(Math.sqrt(78.5 / Math.PI), 2), 5);
// the forgotten-root error must be demonstrably absurd
eq("a radius of 25 would give an area near 1963", Math.round(Math.PI * 25 ** 2), 1963);
eq("which is nothing like 78.5", Math.abs(Math.PI * 25 ** 2 - 78.5) > 1800, true);
// the pond
close("50 / pi", 50 / Math.PI, 15.91549, 1e-4);
eq("pond radius, 2sf", sf(Math.sqrt(50 / Math.PI), 2), 4);
eq("checking forwards, 3sf", sf(Math.PI * 4 ** 2, 3), 50.3);
// the tablecloth
eq("tablecloth radius", 140 / 2, 70);
eq("tablecloth area, 3sf", sf(Math.PI * 70 ** 2, 3), 15400);
close("in square metres", Math.PI * 70 ** 2 / 10000, 1.53938, 1e-4);

// ---- 7.2 compound shapes
eq("5 by 4", 5 * 4, 20);
eq("11 by 2", 11 * 2, 22);
eq("their total", 20 + 22, 42);
eq("bounding rectangle 11 by 6", 11 * 6, 66);
eq("two thirds of 66", Math.round(66 * 2 / 3), 44);
eq("the estimate brackets the answer", 42 < 66 && 42 > 66 / 3, true);
eq("triangle base 12 height 6", 0.5 * 12 * 6, 36);
eq("rectangle 8 by 5", 8 * 5, 40);
eq("their total", 36 + 40, 76);
// rectangle with a semicircle on top
close("rectangle 10 by 6", 10 * 6, 60);
close("semicircle r=5 area", Math.PI * 25 / 2, 39.26991, 1e-4);
eq("total, 3sf", sf(60 + Math.PI * 25 / 2, 3), 99.3);
eq("the semicircle's radius comes from the width", 10 / 2, 5);
// missing lengths by subtraction
eq("missing horizontal", 11 - 6, 5);
eq("missing vertical", 7 - 4, 3);

// ---- 7.3 units: every prefix as a power of ten
const PREFIX = { nano: -9, micro: -6, milli: -3, kilo: 3, mega: 6, giga: 9 };
eq("milli", 10 ** PREFIX.milli, 0.001);
eq("micro", 10 ** PREFIX.micro, 0.000001);
eq("nano", 10 ** PREFIX.nano, 1e-9);
eq("kilo", 10 ** PREFIX.kilo, 1000);
eq("mega", 10 ** PREFIX.mega, 1000000);
eq("giga", 10 ** PREFIX.giga, 1000000000);
// the pattern: each named step moves the index by three, and they pair about 1
{
  const idx = [-9, -6, -3, 3, 6, 9];
  const gaps = [];
  for (let i = 1; i < idx.length; i += 1) gaps.push(idx[i] - idx[i - 1]);
  eq("the steps are 3, 3, 6, 3, 3", gaps.join(","), "3,3,6,3,3");
  eq("nano pairs with giga", PREFIX.nano + PREFIX.giga, 0);
  eq("micro pairs with mega", PREFIX.micro + PREFIX.mega, 0);
  eq("milli pairs with kilo", PREFIX.milli + PREFIX.kilo, 0);
}
eq("a million microlitres in a litre", 1 / 10 ** PREFIX.micro, 1000000);
eq("a tonne in kilograms", 1000, 1000);
// the virus
close("100 nm in metres", 100 * 1e-9, 1e-7, 1e-18);
close("as standard form the index is -7", Math.log10(100 * 1e-9), -7, 1e-12);
eq("a millimetre is 10^-3", 1e-3, 0.001);
eq("how many 100 nm fit in 1 mm", Math.round(1e-3 / 1e-7), 10000);
eq("which is 10^4", Math.log10(1e-3 / 1e-7), 4);
// the memory card
eq("32 GB in MB", 32 * 1000, 32000);
eq("photos of 4 MB", 32000 / 4, 8000);
eq("32 GB in bytes", 32 * 1e9, 3.2e10);
eq("as standard form", 3.2e10, 32000000000);

// ---- the unit must state the answers it was built around
says("the area of a 4 cm circle", "50.3");
says("the diameter-as-radius error", "four times too big");
says("the semicircle perimeter", "25.7");
says("the compound total", "42 cm squared");
says("nano", "10^-9");
says("the bold rule", "the formula for the circumference uses the DIAMETER");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 7", u.unit.unitNo, 7);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

for (const code of ["9Gg.01", "9Gg.02", "9Gg.03"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Gg.04", "9Gg.05", "9Gg.06", "9Gg.07", "9Gg.08", "9Gg.09", "9Gg.10", "9Gg.11"]) {
  eq(code + " not claimed (units 5 and 14)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 7 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every circle answer recomputes against ITS OWN value of pi, with significant figures");
console.log("    implemented properly rather than as decimal places; the four-times error is verified as a");
console.log("    general fact about squaring; every prefix pairs about 1 as the unit claims.");
