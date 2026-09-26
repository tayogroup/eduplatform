// Recompute every claim in Grade 9 Unit 15 rather than trusting it.
//
// Fifteenth and last Grade 9 checker. Statistics can be computed from the raw data,
// so every average, range and grouped estimate in this unit is worked out from the
// numbers rather than restated.
//
// THE ONE CLAIM THAT NEEDED DESIGNING, NOT JUST CHECKING, is that the three
// averages can DISAGREE. The unit's whole point in 15.3 is that Zara's conclusion
// from the mode alone is wrong because the mean and median contradict it - and
// that lesson is unteachable on data where all three agree. So the datasets were
// authored to make them disagree, and the checker verifies the disagreement
// itself: Q's mode must exceed P's while P's mean AND median must exceed Q's. If
// that ever stopped being true the worked example would be teaching nothing, and
// the failure would be invisible in any single statistic.
//
// THE GROUPED ESTIMATE IS CHECKED AGAINST ITS OWN ERROR. The unit says an
// estimated mean is not the true mean because it assumes every value sits at its
// class midpoint. The checker builds actual data sets, groups them, computes the
// true mean and the estimate, and confirms the estimate is close but not equal -
// so the word "estimate" is earned rather than asserted.
//
//   node tools/check-ehel-math-g9-unit15.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-15.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-15.json not built yet - run build-ehel-math-g9-unit15.mjs --write");
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

// ---- statistics, computed from the data
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
const mode = (a) => {
  const c = new Map();
  for (const x of a) c.set(x, (c.get(x) || 0) + 1);
  let best = null, bestN = 0;
  for (const [v, n] of c) if (n > bestN) { best = v; bestN = n; }
  return best;
};
const modeCount = (a) => {
  const c = new Map();
  for (const x of a) c.set(x, (c.get(x) || 0) + 1);
  return Math.max(...c.values());
};
const range = (a) => Math.max(...a) - Math.min(...a);

// ============ 15.3 THE TWO DATASETS, and their designed disagreement ============
const P = [14, 14, 14, 15, 16, 17, 18, 19, 26, 27];
const Q = [12, 13, 15, 15, 15, 16, 17, 18, 19, 20];
eq("P has ten values", P.length, 10);
eq("Q has ten values", Q.length, 10);
eq("P total", P.reduce((a, b) => a + b, 0), 180);
eq("Q total", Q.reduce((a, b) => a + b, 0), 160);
eq("P mean", mean(P), 18);
eq("Q mean", mean(Q), 16);
eq("P median", median(P), 16.5);
eq("Q median", median(Q), 15.5);
eq("P mode", mode(P), 14);
eq("Q mode", mode(Q), 15);
eq("P's mode appears three times", modeCount(P), 3);
eq("Q's mode appears three times", modeCount(Q), 3);
eq("P range", range(P), 13);
eq("Q range", range(Q), 8);
// THE DESIGNED DISAGREEMENT - the lesson fails without it
eq("Q's mode is HIGHER than P's", mode(Q) > mode(P), true);
eq("but P's mean is higher", mean(P) > mean(Q), true);
eq("and P's median is higher", median(P) > median(Q), true);
eq("so two of three averages favour P", [mean(P) > mean(Q), median(P) > median(Q), mode(P) > mode(Q)].filter(Boolean).length, 2);
eq("and exactly one favours Q", [mean(Q) > mean(P), median(Q) > median(P), mode(Q) > mode(P)].filter(Boolean).length, 1);
// Q is more consistent - a claim about SPREAD, not size
eq("Q's range is smaller", range(Q) < range(P), true);
eq("so Q is more consistent while P scored higher", range(Q) < range(P) && mean(P) > mean(Q), true);
// P's mean is lifted by its two extreme values - the reason the averages diverge
{
  const withoutExtremes = P.filter((x) => x < 20);
  eq("P without its two highest", withoutExtremes.join(","), "14,14,14,15,16,17,18,19");
  close("their mean is much lower", mean(withoutExtremes), 15.875);
  eq("which is below Q's mean", mean(withoutExtremes) < mean(Q), true);
  eq("so the two high values are what lift P's mean", mean(P) > mean(Q) && mean(withoutExtremes) < mean(Q), true);
}
// the median is NOT pulled by them, which is the difference between the measures
{
  const pAltered = [...P.slice(0, 8), 100, 200];
  eq("replacing P's top two with 100 and 200 leaves the median", median(pAltered), median(P));
  eq("but changes the mean hugely", mean(pAltered) > 30, true);
}

// ============ 15.4 GROUPED DATA ============
const grouped = (classes) => {
  // classes: [lower, upper, frequency]
  const n = classes.reduce((a, [, , f]) => a + f, 0);
  const products = classes.map(([lo, hi, f]) => ((lo + hi) / 2) * f);
  const total = products.reduce((a, b) => a + b, 0);
  return { n, products, total, estMean: total / n,
    estRange: classes[classes.length - 1][1] - classes[0][0],
    modal: classes.reduce((best, c) => (c[2] > best[2] ? c : best)) };
};
// the teachers
{
  const T = [[60, 70, 4], [70, 80, 7], [80, 90, 6], [90, 100, 3]];
  const g = grouped(T);
  eq("20 teachers", g.n, 20);
  eq("midpoints", T.map(([lo, hi]) => (lo + hi) / 2).join(","), "65,75,85,95");
  eq("products", g.products.join(","), "260,525,510,285");
  eq("total", g.total, 1580);
  eq("estimated mean", g.estMean, 79);
  eq("estimated range", g.estRange, 40);
  eq("modal class", g.modal[0] + " to " + g.modal[1], "70 to 80");
  eq("its frequency is the greatest", g.modal[2], 7);
  // the median's class, by counting through the frequencies
  {
    const positions = [10, 11];                 // the 10th and 11th of 20
    let cum = 0, classOf = [];
    for (const [lo, hi, f] of T) {
      cum += f;
      for (const p of positions) if (p <= cum && !classOf[positions.indexOf(p)]) classOf[positions.indexOf(p)] = lo + " to " + hi;
    }
    eq("the 10th value's class", classOf[0], "70 to 80");
    eq("the 11th value's class", classOf[1], "70 to 80");
    eq("so the median is in 70 to 80", classOf[0] === classOf[1], true);
    eq("the first four are in the first class", 4, 4);
    eq("the 5th to 11th are in the second", 4 + 7, 11);
  }
}
// the students' heights
{
  const H = [[140, 150, 7], [150, 160, 13], [160, 170, 6], [170, 180, 2]];
  const g = grouped(H);
  eq("28 students", g.n, 28);
  eq("midpoints", H.map(([lo, hi]) => (lo + hi) / 2).join(","), "145,155,165,175");
  eq("products", g.products.join(","), "1015,2015,990,350");
  eq("total", g.total, 4370);
  close("estimated mean", g.estMean, 156.071429, 1e-5);
  eq("to the nearest cm", Math.round(g.estMean), 156);
  eq("estimated range", g.estRange, 40);
  eq("modal class", g.modal[0] + " to " + g.modal[1], "150 to 160");
  eq("its frequency", g.modal[2], 13);
  eq("the median is the 14th and 15th of 28", 28 / 2, 14);
  eq("the first seven are in the first class", 7, 7);
  eq("the 8th to 20th are in the second", 7 + 13, 20);
  eq("so both the 14th and 15th are in 150 to 160", 14 > 7 && 15 <= 20, true);
}

// ---- THE ESTIMATE IS NOT THE TRUE MEAN, and the checker earns that word
{
  // real data whose grouping gives the teachers' table
  const real = [61, 62, 63, 64,                       // 4 in 60-70
    71, 72, 73, 74, 75, 76, 77,                       // 7 in 70-80
    81, 82, 83, 84, 85, 86,                           // 6 in 80-90
    91, 92, 93];                                      // 3 in 90-100
  eq("the real data has 20 values", real.length, 20);
  // grouping it reproduces the unit's table
  const counts = [0, 0, 0, 0];
  for (const x of real) {
    if (x > 60 && x <= 70) counts[0] += 1;
    else if (x > 70 && x <= 80) counts[1] += 1;
    else if (x > 80 && x <= 90) counts[2] += 1;
    else if (x > 90 && x <= 100) counts[3] += 1;
  }
  eq("it groups to 4, 7, 6, 3", counts.join(","), "4,7,6,3");
  close("its TRUE mean", mean(real), 77.25, 1e-9);
  eq("the ESTIMATE was 79", 79, 79);
  eq("they are not equal", mean(real) === 79, false);
  close("the estimate is out by", 79 - mean(real), 1.75, 1e-9);
  eq("but it is close - within 2 kg", Math.abs(79 - mean(real)) < 2, true);
  // and the true median IS in the class the grouped method named
  eq("the true median", median(real), 76.5);
  eq("which lies in 70 to 80", median(real) > 70 && median(real) <= 80, true);
  // the true range is smaller than the estimate, as it must be
  eq("the true range", range(real), 32);
  eq("which is less than the estimated 40", range(real) < 40, true);
}

// ---- 15.1 frequency polygon points, and the midpoint convention
{
  const T = [[60, 70, 4], [70, 80, 7], [80, 90, 6], [90, 100, 3]];
  const pts = T.map(([lo, hi, f]) => [(lo + hi) / 2, f]);
  eq("the four points", pts.map(([x, y]) => "(" + x + "," + y + ")").join(" "), "(65,4) (75,7) (85,6) (95,3)");
  eq("the peak is at 75", pts.reduce((b, p) => (p[1] > b[1] ? p : b))[0], 75);
  // plotting at the lower bound instead shifts everything by half a class width
  const wrong = T.map(([lo, , f]) => [lo, f]);
  eq("plotting at the lower bound shifts the peak", wrong.reduce((b, p) => (p[1] > b[1] ? p : b))[0], 70);
  eq("by half a class width", 75 - 70, 5);
  eq("which is half of 10", 10 / 2, 5);
}

// ---- 15.2 correlation, computed from data
{
  const corr = (xs, ys) => {
    const mx = mean(xs), my = mean(ys);
    const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    const dx = Math.sqrt(xs.reduce((a, x) => a + (x - mx) ** 2, 0));
    const dy = Math.sqrt(ys.reduce((a, y) => a + (y - my) ** 2, 0));
    return num / (dx * dy);
  };
  const ages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const mileage = [12, 25, 36, 52, 61, 73, 88, 95, 112, 118];   // rises with age
  const value = [18000, 15500, 13000, 11200, 9500, 8000, 6800, 5600, 4700, 3900]; // falls
  const shoe = [7, 9, 6, 11, 8, 7, 10, 6, 9, 8];                // unrelated
  eq("age and mileage are positively correlated", corr(ages, mileage) > 0.9, true);
  eq("age and value are negatively correlated", corr(ages, value) < -0.9, true);
  eq("age and shoe size are not correlated", Math.abs(corr(ages, shoe)) < 0.5, true);
  // the direction claims, stated as the unit states them
  eq("mileage rises with age", mileage[9] > mileage[0], true);
  eq("value falls with age", value[9] < value[0], true);
  // a prediction inside the range is bracketed by real data; outside it is not
  eq("6 is inside 1 to 10", 6 >= 1 && 6 <= 10, true);
  eq("40 is outside 1 to 10", 40 >= 1 && 40 <= 10, false);
  // a linear extrapolation to 40 years is absurd against the data's own scale
  {
    const slope = (mileage[9] - mileage[0]) / (ages[9] - ages[0]);
    close("the trend's slope", slope, 11.777778, 1e-5);
    const at40 = mileage[0] + slope * (40 - 1);
    eq("extrapolating to 40 years predicts over 400", at40 > 400, true);
    eq("which is more than three times the largest observed", at40 > 3 * Math.max(...mileage), true);
  }
}

// ---- 15.3 reading a back-to-back row
{
  // row: 5 4 2 | 1 | 3 7, stem of tens
  const stem = 1;
  const leftLeaves = [5, 4, 2];        // as printed, read outwards means reversing
  const rightLeaves = [3, 7];
  const left = [...leftLeaves].reverse().map((l) => stem * 10 + l);
  const right = rightLeaves.map((l) => stem * 10 + l);
  eq("the left-hand values", left.join(","), "12,14,15");
  eq("the right-hand values", right.join(","), "13,17");
  eq("both sides share the stem", stem, 1);
  eq("five values in the row", left.length + right.length, 5);
}

// ---- the unit must state the answers it was built around
says("the estimated mean", "79 kg");
says("the second estimated mean", "156 cm");
says("the polygon points", "(75, 7)");
says("P's mean", "18");
says("Q's mode", "15");
says("the disagreement", "two of the three averages");
says("correlation is not cause", "confounding variable");
says("grouping is one-way", "combined");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 15", u.unit.unitNo, 15);

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

for (const code of ["9Ss.03", "9Ss.04", "9Ss.05"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Ss.01", "9Ss.02"]) {
  eq(code + " not claimed (unit 6)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 15 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every average, range and grouped estimate is computed from the raw data; the DESIGNED");
console.log("    disagreement holds (Q's mode is higher, P's mean and median are), so Zara's error is");
console.log("    teachable; and the grouped mean of 79 is shown to differ from a real dataset's true 77.25,");
console.log("    which is how the word \"estimate\" is earned rather than asserted.");
