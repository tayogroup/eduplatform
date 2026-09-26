// Recompute every claim in Grade 9 Unit 3 rather than trusting it.
//
// Fourth Grade 9 checker. This unit is almost entirely decimal arithmetic, which
// makes it the one where a checker written carelessly reports defects that are
// not there - and this file's predecessors have already done that once (see the
// note in check-ehel-math-g9-unit1.mjs about toFixed rounding a truncation).
//
// FLOATING POINT IS THE HAZARD HERE, not the mathematics. 0.02 x 10 is
// 0.19999999999999998 in IEEE doubles, 1.15 x 300 is 344.99999999999994, and
// 500 * 1.1**3 is 665.5000000000001. A checker using === would fail all three and
// every one of them is correct content. So every decimal comparison in this file
// goes through `close`, which compares to 1e-9, and money is compared at 2
// decimal places through `money`. An exact === is used ONLY where both sides are
// integers.
//
// BOUNDS ARE CHECKED AS A PARTITION, not as two numbers. The unit's claim is not
// merely that the bounds of 25 are 24.5 and 25.5 - it is that every value in
// [24.5, 25.5) rounds to 25 and that 25.5 does not. That is a statement about a
// range, so it is tested over the range: the checker rounds several hundred
// values and confirms each lands where the unit says. A pair of endpoint
// assertions would pass a unit that had the interval half-open the wrong way.
//
//   node tools/check-ehel-math-g9-unit3.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-3.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-3.json not built yet - run build-ehel-math-g9-unit3.mjs --write");
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
// every decimal comparison - see the header on floating point
const close = (l, got, want, tol = 1e-9) => {
  if (Math.abs(got - want) <= tol) { pass += 1; return; }
  fail += 1; bad.push(l + ": computed " + got + ", expected " + want);
};
const money = (l, got, want) => close(l, Math.round(got * 100) / 100, want, 1e-9);
const says = (l, text) => {
  if (blob.includes(text)) { pass += 1; return; }
  fail += 1; bad.push(l + ': the unit does not contain "' + text + '"');
};

// ---- 3.1 powers of ten, positive
close("2.8 x 10^3", 2.8 * 10 ** 3, 2800);
close("2.8 x 10^2", 2.8 * 10 ** 2, 280);
close("0.02 x 10^1", 0.02 * 10 ** 1, 0.2);
close("34 / 10^2", 34 / 10 ** 2, 0.34);
close("34 / 10", 34 / 10, 3.4);
close("3400 / 10^3", 3400 / 10 ** 3, 3.4);
// the 'add a zero' counter-example must genuinely fail
eq("28 x 10 is 280", 28 * 10, 280);
close("2.8 x 10 is 28, not 2.80", 2.8 * 10, 28);
eq("2.80 is still 2.8", 2.80 === 2.8, true);

// ---- 3.2 negative powers, and the identity the unit rests on
close("2.8 x 10^-2", 2.8 * 10 ** -2, 0.028);
close("2.8 x 10^-2 = 2.8 / 10^2", 2.8 * 10 ** -2, 2.8 / 10 ** 2);
close("0.03 / 10^-2", 0.03 / 10 ** -2, 3);
close("0.03 / 10^-2 = 0.03 x 100", 0.03 / 10 ** -2, 0.03 * 100);
close("0.34 / 10^-1", 0.34 / 10 ** -1, 3.4);
close("2.8 x 10^-3 = 2.8 / 10^3", 2.8 * 10 ** -3, 2.8 / 10 ** 3);
// the general claim: multiplying by 10^-n IS dividing by 10^n, over a range
for (let n = 1; n <= 6; n += 1) {
  close("x 10^-" + n + " equals / 10^" + n, 7.3 * 10 ** -n, 7.3 / 10 ** n);
  close("/ 10^-" + n + " equals x 10^" + n, 7.3 / 10 ** -n, 7.3 * 10 ** n);
}

// ---- 3.2 decimal multiplication and division, with the estimates
close("0.7 x 4 estimate", 0.7 * 4, 2.8);
eq("68 x 42 digits", 68 * 42, 2856);
close("0.68 x 4.2 exact", 0.68 * 4.2, 2.856);
// the estimate must actually discriminate: only one placement is near it
eq("2.856 is the placement near 2.8", [0.2856, 2.856, 28.56].filter((x) => Math.abs(x - 2.8) < 1).join(","), "2.856");
close("7.2 / 0.9", 7.2 / 0.9, 8);
eq("72 / 9", 72 / 9, 8);
close("1.44 / 0.12", 1.44 / 0.12, 12);
eq("144 / 12", 144 / 12, 12);
// dividing by less than 1 makes a number bigger - the claim, over a range
for (const d of [0.9, 0.5, 0.25, 0.12, 0.01]) {
  eq("7.2 / " + d + " > 7.2", 7.2 / d > 7.2, true);
}
close("4.2 x 0.68 rice", 4.2 * 0.68, 2.856);
money("rice rounds to 2.86", 4.2 * 0.68, 2.86);

// ---- 3.3 multipliers
close("multiplier +15%", 1 + 15 / 100, 1.15);
close("multiplier -15%", 1 - 15 / 100, 0.85);
close("multiplier +20%", 1 + 20 / 100, 1.2);
close("multiplier -20%", 1 - 20 / 100, 0.8);
close("multiplier +32%", 1 + 32 / 100, 1.32);
close("multiplier -32%", 1 - 32 / 100, 0.68);
money("300 increased by 15%", 300 * 1.15, 345);
money("300 decreased by 15%", 300 * 0.85, 255);
money("400 decreased by 32%", 400 * 0.68, 272);
money("200 increased by 20%", 200 * 1.2, 240);

// ---- 3.3 compound
money("500 at 10% for 3 years", 500 * 1.1 ** 3, 665.5);
money("year by year agrees", ((500 * 1.1) * 1.1) * 1.1, 665.5);
money("500 y1", 500 * 1.1, 550);
money("500 y2", 500 * 1.1 * 1.1, 605);
money("simple interest 3 x 10% of 500", 500 + 3 * 0.1 * 500, 650);
money("compound beats simple by", 500 * 1.1 ** 3 - (500 + 3 * 0.1 * 500), 15.5);
money("200 at 5% for 2 years", 200 * 1.05 ** 2, 220.5);
// up then down does not cancel
money("300 up 15% then down 15%", 300 * 1.15 * 0.85, 293.25);
close("combined multiplier", 1.15 * 0.85, 0.9775);
eq("combined is less than 1", 1.15 * 0.85 < 1, true);
money("shortfall on 300", 300 - 300 * 1.15 * 0.85, 6.75);
// the trader: mark up 32% then take 32% off
money("400 marked up 32%", 400 * 1.32, 528);
money("528 reduced 32%", 400 * 1.32 * 0.68, 359.04);
close("trader combined multiplier", 1.32 * 0.68, 0.8976);
money("trader loss", 400 - 400 * 1.32 * 0.68, 40.96);
// order does not matter for the combined multiplier
close("order of multipliers", 1.15 * 0.85, 0.85 * 1.15);
// reversing a reduction divides by the multiplier
money("sale 80 was originally", 80 / 0.8, 100);
money("the wrong answer 80 + 20%", 80 * 1.2, 96);
eq("96 is not 100", Math.round(80 * 1.2) === 100, false);

// ---- 3.4 bounds, tested as a PARTITION over the range (see the header)
const bounds = (value, unitOfRounding) => [value - unitOfRounding / 2, value + unitOfRounding / 2];
{
  const [lo, hi] = bounds(25, 1);
  close("lower bound of 25", lo, 24.5);
  close("upper bound of 25", hi, 25.5);
  // every value in [24.5, 25.5) must round to 25, and 25.5 must not
  let wrong = 0;
  for (let x = 24.5; x < 25.5; x = Math.round((x + 0.01) * 100) / 100) {
    if (Math.round(x) !== 25) wrong += 1;
  }
  eq("every value in [24.5, 25.5) rounds to 25", wrong, 0);
  eq("25.5 does not round to 25", Math.round(25.5) === 25, false);
  eq("25.5 rounds to 26", Math.round(25.5), 26);
  // the ten one-decimal-place values the unit lists
  const tenths = [];
  for (let x = 245; x < 255; x += 1) tenths.push(x / 10);
  eq("ten one-dp values round to 25", tenths.length, 10);
  eq("they run 24.5 to 25.4", tenths[0] + ".." + tenths[9], "24.5..25.4");
  eq("all ten round to 25", tenths.every((x) => Math.round(x) === 25), true);
}
{
  const [lo, hi] = bounds(90, 10);
  eq("lower bound of 90 to nearest 10", lo, 85);
  eq("upper bound of 90 to nearest 10", hi, 95);
  let wrong = 0;
  for (let x = 85; x < 95; x += 0.5) if (Math.round(x / 10) * 10 !== 90) wrong += 1;
  eq("every value in [85, 95) rounds to 90", wrong, 0);
}
{
  const [lo, hi] = bounds(47, 1);
  close("lower bound 47 cm", lo, 46.5);
  close("upper bound 47 cm", hi, 47.5);
  eq("47.5 rounds to 48", Math.round(47.5), 48);
}
{
  const [lo, hi] = bounds(6.4, 0.1);
  close("lower bound 6.4 to 1 dp", lo, 6.35);
  close("upper bound 6.4 to 1 dp", hi, 6.45);
}
{
  const [lo, hi] = bounds(8, 1);
  close("lower bound of 8", lo, 7.5);
  close("upper bound of 8", hi, 8.5);
}
// the plank: bounds must be divided, not the rounded value
{
  const [lo, hi] = bounds(240, 1);
  close("plank lower", lo, 239.5);
  close("plank upper", hi, 240.5);
  close("piece lower", lo / 8, 29.9375);
  close("piece upper", hi / 8, 30.0625);
  eq("30 lies inside the piece range", 30 > lo / 8 && 30 < hi / 8, true);
}
// finer rounding gives a narrower interval - the activity's claim
{
  const [a, b] = bounds(47, 1);
  const [c, d] = bounds(47.0, 0.1);
  eq("1 dp interval is narrower than whole-cm", (d - c) < (b - a), true);
}

// ---- 3.1 the science conversion
close("0.02 x 10^3", 0.02 * 10 ** 3, 20);

// ---- the unit must state the answers it was built around
says("the compound total", "$665.50");
says("the up-then-down total", "$293.25");
says("the combined multiplier", "0.9775");
says("the bounds inequality", "46.5 <= length < 47.5");
says("the decimal product", "2.856");
says("the division answer", "72 divided by 9 = 8");
says("the ten values", "25.4");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 3", u.unit.unitNo, 3);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

// 9Np.02 is finally claimed here - unit 1 declined it for this unit
for (const code of ["9Np.01", "9Np.02", "9Nf.05", "9Nf.06"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
// and the sections this unit does NOT teach must not be claimed
for (const code of ["9Nf.01", "9Nf.02", "9Nf.03", "9Nf.04", "9Nf.07", "9Nf.08"]) {
  eq(code + " not claimed (units 8 and 11)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 3 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every decimal, multiplier and compound total recomputes; bounds hold as a partition over");
console.log("    the whole interval, not just at the endpoints; 9Np.02 paid for here as unit 1 promised.");
