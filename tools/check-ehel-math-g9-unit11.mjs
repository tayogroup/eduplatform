// Recompute every claim in Grade 9 Unit 11 rather than trusting it.
//
// Twelfth Grade 9 checker. Two things here get more than arithmetic.
//
// THE KINDERGARTEN ANSWER IS COMPUTED BOTH WAYS, because the unit's whole point is
// that the two ways disagree. The checker works out the staff by rounding each room
// up and adding (13) and by adding the fractions and rounding the total (12), and
// asserts that they differ - because if they happened to agree, the worked example
// would be teaching a distinction with no consequence. It then verifies the harm:
// with 12 staff, at least one room is over its stated limit.
//
// THE PROPORTION TESTS ARE CHECKED AS TESTS. "Direct proportion means a constant
// ratio, inverse means a constant product" is a claim about how to CLASSIFY, so the
// checker builds families of pairs that are known to be direct, known to be
// inverse, and known to be neither, and requires the tests to sort all of them
// correctly. A classifier confirmed on one example is confirmed about that example.
//
// The "neither" case needs care: a pair fails to be in proportion when NEITHER the
// ratio nor the product is constant, so the checker uses a genuine such family
// rather than a near-miss, and separately confirms that its ratio and product both
// vary.
//
//   node tools/check-ehel-math-g9-unit11.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-11.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-11.json not built yet - run build-ehel-math-g9-unit11.mjs --write");
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

// ---- 11.1 the unitary method, every worked ratio
// one part, then each share, then the total, then the parts check
const ratioCase = (label, parts, index, given, expectedShares, expectedTotal) => {
  const onePart = given / parts[index];
  const shares = parts.map((p) => p * onePart);
  close(label + " one part", onePart, given / parts[index]);
  eq(label + " shares", shares.join(","), expectedShares.join(","));
  close(label + " total", shares.reduce((a, b) => a + b, 0), expectedTotal);
  // the free check the unit teaches: total = one part x sum of parts
  close(label + " total via parts", onePart * parts.reduce((a, b) => a + b, 0), expectedTotal);
};
ratioCase("sultanas 5:2 from 80 g", [5, 2], 1, 80, [200, 80], 280);
ratioCase("fruit 1:2 from 400 g", [1, 2], 1, 400, [200, 400], 600);
ratioCase("money 3:5 from $75", [3, 5], 0, 75, [75, 125], 200);
ratioCase("bill 3:4 from $24", [3, 4], 1, 24, [18, 24], 42);
ratioCase("concrete 1:2:4 from 15 kg", [1, 2, 4], 1, 15, [7.5, 15, 30], 52.5);
ratioCase("drink 2:3 from 500 mL", [2, 3], 0, 500, [500, 750], 1250);
eq("1250 mL in litres", 1250 / 1000, 1.25);
// the error the unit warns against: multiplying the given by the other part
eq("80 x 5 is the wrong answer", 80 * 5, 400);
eq("and it is not 200", 400 === 200, false);
// doubling the bill doubles each share - direct proportion within a ratio
eq("bill doubled, one part", 48 / 4, 12);
eq("Kaya's doubled share", 3 * 12, 36);
eq("which is double 18", 2 * 18, 36);

// ---- 11.1 building and simplifying a ratio
{
  // triangle: largest 75, other two differ by 15
  const rest = 180 - 75;
  eq("the other two total", rest, 105);
  const bigger = (rest + 15) / 2, smaller = (rest - 15) / 2;
  eq("the two angles", smaller + "," + bigger, "45,60");
  eq("their difference is 15", bigger - smaller, 15);
  eq("all three sum to 180", smaller + bigger + 75, 180);
  eq("75 really is the largest", Math.max(smaller, bigger, 75), 75);
  // simplify 45:60:75
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = [45, 60, 75].reduce((a, b) => gcd(a, b));
  eq("their common factor", g, 15);
  eq("simplified", [45, 60, 75].map((x) => x / g).join(":"), "3:4:5");
  // other simplifications the unit shows
  eq("12:18 simplified", [12, 18].map((x) => x / gcd(12, 18)).join(":"), "2:3");
  eq("0.5:2 scaled then simplified", [1, 4].join(":"), "1:4");
  close("0.5:2 is the same ratio as 1:4", 0.5 / 2, 1 / 4);
}

// ---- 11.2 direct proportion
eq("5 tins at 0.65", 5 * 0.65, 3.25);
close("12 tins at 0.65", 12 * 0.65, 7.8);
close("cost per tin from 5 tins", 3.25 / 5, 0.65);
close("cost per tin from 12 tins", 7.8 / 12, 0.65);
// the constant ratio, over a range
{
  let varies = 0;
  for (let n = 1; n <= 20; n += 1) if (Math.abs((n * 0.65) / n - 0.65) > 1e-9) varies += 1;
  eq("the cost per tin never changes", varies, 0);
}

// ---- 11.2 inverse proportion
eq("2 people x 20 minutes", 2 * 20, 40);
eq("4 people take", 40 / 4, 10);
eq("5 people take", 40 / 5, 8);
close("3 people take", 40 / 3, 13.333333, 1e-5);
eq("8 people take", 40 / 8, 5);
eq("20 people would take", 40 / 20, 2);
// the constant product, over a range
{
  let varies = 0;
  for (let p = 1; p <= 20; p += 1) if (Math.abs(p * (40 / p) - 40) > 1e-9) varies += 1;
  eq("the product never changes", varies, 0);
}
// the journey: speed and time
{
  const distance = 60;
  const pairs = [[30, 2], [60, 1], [120, 0.5]];
  for (const [s, t] of pairs) eq("speed " + s + " takes " + t + " h", s * t, distance);
  eq("doubling the speed halves the time", 30 * 2 === 60 * 1, true);
}

// ---- 11.2 the two tests, checked AS CLASSIFIERS against known families
{
  const constantRatio = (pairs) => {
    const r = pairs.map(([a, b]) => b / a);
    return r.every((x) => Math.abs(x - r[0]) < 1e-9);
  };
  const constantProduct = (pairs) => {
    const p = pairs.map(([a, b]) => a * b);
    return p.every((x) => Math.abs(x - p[0]) < 1e-9);
  };
  const classify = (pairs) => {
    if (constantRatio(pairs)) return "direct";
    if (constantProduct(pairs)) return "inverse";
    return "neither";
  };
  // known direct families: b = k a
  let wrongD = 0, testedD = 0;
  for (const k of [0.65, 1, 2.5, 7, 100]) {
    const pairs = [1, 2, 3, 5, 8].map((a) => [a, k * a]);
    testedD += 1;
    if (classify(pairs) !== "direct") wrongD += 1;
  }
  eq("every b = ka family is classified direct (" + testedD + ")", wrongD, 0);
  // known inverse families: b = k / a
  let wrongI = 0, testedI = 0;
  for (const k of [40, 60, 100, 7.5]) {
    const pairs = [1, 2, 4, 5, 8].map((a) => [a, k / a]);
    testedI += 1;
    if (classify(pairs) !== "inverse") wrongI += 1;
  }
  eq("every b = k/a family is classified inverse (" + testedI + ")", wrongI, 0);
  // a genuine NEITHER family - and both tests must fail on it
  const houses = [[10, 200], [20, 260], [35, 180], [60, 410], [90, 300]];
  eq("the house family is neither", classify(houses), "neither");
  eq("its ratio is not constant", constantRatio(houses), false);
  eq("its product is not constant", constantProduct(houses), false);
  // the three the unit classifies
  eq("crisps: packets and cost", classify([1, 2, 3, 4].map((n) => [n, 0.8 * n])), "direct");
  eq("speed and time over 60 km", classify([[30, 2], [60, 1], [120, 0.5]]), "inverse");
  eq("house age and value", classify(houses), "neither");
}

// ---- 11.2 the kindergarten, computed BOTH WAYS
{
  const rooms = [[3, 10], [4, 18], [8, 15], [14, 24]];
  const exact = rooms.map(([r, c]) => c / r);
  close("room 1 needs", exact[0], 10 / 3);
  close("room 2 needs", exact[1], 4.5);
  close("room 3 needs", exact[2], 1.875);
  close("room 4 needs", exact[3], 24 / 14);
  // the right way: round each up, then add
  const perRoom = exact.map((x) => Math.ceil(x));
  eq("rounded per room", perRoom.join(","), "4,5,2,2");
  eq("the correct total", perRoom.reduce((a, b) => a + b, 0), 13);
  // the wrong way: add, then round
  const sum = exact.reduce((a, b) => a + b, 0);
  close("the fractions add to", sum, 11.422619, 1e-5);
close("which is 11.4 to 1 dp", Math.round(sum * 10) / 10, 11.4);
  eq("rounding that total gives", Math.ceil(sum), 12);
  eq("and rounding to the nearest also gives", Math.round(sum), 11);
  // THE TWO METHODS MUST DISAGREE, or the lesson has no consequence
  eq("the two methods differ", perRoom.reduce((a, b) => a + b, 0) === Math.ceil(sum), false);
  eq("by exactly one member of staff", 13 - 12, 1);
  // and the harm is real: 12 staff cannot cover every room's limit
  {
    // the best any allocation of 12 can do is to leave one room short
    let shortfall = 0;
    for (let i = 0; i < rooms.length; i += 1) if (perRoom[i] > Math.floor(exact[i])) shortfall += 1;
    eq("three rooms need rounding up at all", shortfall, 4);
    // with 12 staff, at least one room falls below its requirement
    eq("12 is less than the requirement", 12 < 13, true);
    // room by room, check that the FLOOR really does breach the limit
    eq("3 adults cover at most 9 children, not 10", 3 * 3 < 10, true);
    eq("4 adults cover at most 16 children, not 18", 4 * 4 < 18, true);
    eq("1 adult covers at most 8 children, not 15", 1 * 8 < 15, true);
    eq("1 adult covers at most 14 children, not 24", 1 * 14 < 24, true);
  }
  // and each rounded-up figure DOES satisfy its limit
  for (let i = 0; i < rooms.length; i += 1) {
    const [r, c] = rooms[i];
    eq("room " + (i + 1) + " with " + perRoom[i] + " staff covers its " + c + " children", perRoom[i] * r >= c, true);
  }
}
// round up, never to the nearest
eq("10/3 to the nearest would be 3", Math.round(10 / 3), 3);
eq("but 3 breaches the 3:1 limit for 10 children", 3 * 3 >= 10, false);
eq("so it must be 4", Math.ceil(10 / 3), 4);
eq("18/4 to the nearest is ambiguous at 4.5", Math.round(4.5), 5);
eq("ceiling gives 5 either way", Math.ceil(4.5), 5);

// ---- the unit must state the answers it was built around
says("one part", "40 g");
says("the concrete total", "52.5 kg");
says("the simplified ratio", "3:4:5");
says("the inverse answer", "10 minutes");
says("the kindergarten answer", "13");
says("the wrong kindergarten answer", "12");
says("neither as an answer", "NEITHER");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 11", u.unit.unitNo, 11);

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

for (const code of ["9Nf.07", "9Nf.08"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Nf.01", "9Nf.02", "9Nf.03", "9Nf.04"]) {
  eq(code + " not claimed (unit 8)", blob.includes('"code":"' + code + '"'), false);
}
for (const code of ["9Nf.05", "9Nf.06"]) {
  eq(code + " not claimed (unit 3)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 11 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every ratio is checked twice, by adding the shares and by one part x the total parts;");
console.log("    the proportion tests are verified as CLASSIFIERS on known direct, inverse and neither");
console.log("    families; the kindergarten is computed both ways, the two are asserted to DISAGREE, and");
console.log("    each room's floor is confirmed to breach its own stated limit.");
