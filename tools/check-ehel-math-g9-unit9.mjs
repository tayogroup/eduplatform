// Recompute every claim in Grade 9 Unit 9 rather than trusting it.
//
// Tenth Grade 9 checker. Sequences give a checker something better than
// restatement to do: an nth term rule is a PREDICTION about a list of numbers, so
// it can be tested by generating the list and comparing. Every rule this unit
// states is therefore evaluated at every position the unit shows, and required to
// reproduce the terms exactly. A rule that is right at n = 1 and wrong at n = 4
// fails here, which is the error the unit warns about in its own words.
//
// THE DIFFERENCE TEST IS CHECKED AS A CLASSIFIER, not as arithmetic. The unit
// claims that constant first differences mean linear, constant second
// differences mean quadratic, and neither means neither. So the checker
// implements the test and runs it against sequences whose kind is known
// independently - generated from an + b, from an^2 + bn + c, and from a doubling
// rule - and requires the verdict to be right every time. Checking the
// differences of one sequence would confirm that sequence; this confirms the
// test.
//
// AND THE COEFFICIENT RULE IS CHECKED ACROSS A RANGE. "The coefficient of n
// squared is half the second difference" is a general claim, so it is verified for
// every a from -5 to 5 against sequences built from a x n^2 + b x n + c. One
// example would leave a factor-of-two error undetectable.
//
//   node tools/check-ehel-math-g9-unit9.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-9.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-9.json not built yet - run build-ehel-math-g9-unit9.mjs --write");
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
// an nth term rule is a PREDICTION about a list - generate it and compare
const generates = (l, rule, terms) => {
  const got = terms.map((_, i) => rule(i + 1));
  if (got.join(",") === terms.join(",")) { pass += 1; return; }
  fail += 1; bad.push(l + ": the rule gives " + got.join(",") + " but the sequence is " + terms.join(","));
};
const diffs = (a) => a.slice(1).map((x, i) => x - a[i]);
const allSame = (a) => a.length > 0 && a.every((x) => Math.abs(x - a[0]) < 1e-9);
// the unit's own classifier
const classify = (terms) => {
  const d1 = diffs(terms);
  if (allSame(d1)) return "linear";
  const d2 = diffs(d1);
  if (allSame(d2)) return "quadratic";
  return "neither";
};

// ---- 9.1 generating sequences from a rule
{
  // first term 1, add 2.5 each time
  const seq = [1];
  for (let i = 0; i < 4; i += 1) seq.push(seq[seq.length - 1] + 2.5);
  eq("1, add 2.5 five times", seq.join(","), "1,3.5,6,8.5,11");
  eq("and it is linear", classify(seq), "linear");
}
{
  // first term 1, add 3, 5, 7, 9
  const seq = [1];
  let step = 3;
  for (let i = 0; i < 4; i += 1) { seq.push(seq[seq.length - 1] + step); step += 2; }
  eq("1, add 3/5/7/9", seq.join(","), "1,4,9,16,25");
  eq("those are the squares", seq.join(","), [1, 2, 3, 4, 5].map((n) => n * n).join(","));
  eq("and it is quadratic", classify(seq), "quadratic");
}
{
  // first term 7, add 1, 3, 5, 7, 9
  const seq = [7];
  let step = 1;
  for (let i = 0; i < 5; i += 1) { seq.push(seq[seq.length - 1] + step); step += 2; }
  eq("7, add 1/3/5/7/9", seq.join(","), "7,8,11,16,23,32");
  eq("and it is quadratic", classify(seq), "quadratic");
}

// ---- 9.1/9.2 the difference test, checked AS A CLASSIFIER against known kinds
{
  let wrong = 0, tested = 0;
  // every linear sequence an + b must be classified linear
  for (let a = -5; a <= 5; a += 1) {
    if (a === 0) continue;                     // a constant sequence is a degenerate case, excluded
    for (let b = -5; b <= 5; b += 1) {
      const terms = [1, 2, 3, 4, 5, 6].map((n) => a * n + b);
      tested += 1;
      if (classify(terms) !== "linear") wrong += 1;
    }
  }
  eq("every an + b is classified linear (" + tested + " cases)", wrong, 0);
  eq("and that loop really ran", tested, 110);
}
{
  let wrong = 0, tested = 0;
  // every genuine quadratic an^2 + bn + c must be classified quadratic
  for (let a = -5; a <= 5; a += 1) {
    if (a === 0) continue;                     // a = 0 is linear, not quadratic
    for (let b = -3; b <= 3; b += 1) {
      for (let c = -3; c <= 3; c += 1) {
        const terms = [1, 2, 3, 4, 5, 6].map((n) => a * n * n + b * n + c);
        tested += 1;
        if (classify(terms) !== "quadratic") wrong += 1;
      }
    }
  }
  eq("every an^2 + bn + c is classified quadratic (" + tested + " cases)", wrong, 0);
  eq("and that loop really ran", tested, 490);
}
{
  // a doubling sequence must be classified neither
  eq("2, 4, 8, 16, 32 is neither", classify([2, 4, 8, 16, 32]), "neither");
  eq("60, 30, 15, 7.5, 3.75 is neither", classify([60, 30, 15, 7.5, 3.75]), "neither");
  // and a cubic is neither, since its THIRD differences are the constant ones
  eq("1, 8, 27, 64, 125, 216 is neither linear nor quadratic", classify([1, 8, 27, 64, 125, 216]), "neither");
  eq("but its third differences are constant", allSame(diffs(diffs(diffs([1, 8, 27, 64, 125, 216])))), true);
}
// the unit's own classifications
eq("2, 5, 10, 17, 26, 37", classify([2, 5, 10, 17, 26, 37]), "quadratic");
eq("its first differences", diffs([2, 5, 10, 17, 26, 37]).join(","), "3,5,7,9,11");
eq("its second differences", diffs(diffs([2, 5, 10, 17, 26, 37])).join(","), "2,2,2,2");
eq("20, 18, 16, 14, 12", classify([20, 18, 16, 14, 12]), "linear");
eq("its first differences are all -2", diffs([20, 18, 16, 14, 12]).join(","), "-2,-2,-2,-2");
eq("1, 4, 9, 16, 25", classify([1, 4, 9, 16, 25]), "quadratic");
eq("25, 24, 22, 19, 15", classify([25, 24, 22, 19, 15]), "quadratic");
eq("its second differences are all -1", diffs(diffs([25, 24, 22, 19, 15])).join(","), "-1,-1,-1");
eq("7, 8, 11, 16, 23, 32", classify([7, 8, 11, 16, 23, 32]), "quadratic");
eq("its first differences", diffs([7, 8, 11, 16, 23, 32]).join(","), "1,3,5,7,9");

// ---- 9.2 nth term rules, each tested by GENERATING the sequence
generates("3n + 2 gives 5, 8, 11, 14", (n) => 3 * n + 2, [5, 8, 11, 14]);
generates("4n - 3 gives 1, 5, 9, 13", (n) => 4 * n - 3, [1, 5, 9, 13]);
generates("-2n + 22 gives 20, 18, 16, 14, 12", (n) => -2 * n + 22, [20, 18, 16, 14, 12]);
generates("n^2 + 1 gives 2, 5, 10, 17, 26, 37", (n) => n * n + 1, [2, 5, 10, 17, 26, 37]);
generates("n^2 - 2n + 8 gives 7, 8, 11, 16, 23, 32", (n) => n * n - 2 * n + 8, [7, 8, 11, 16, 23, 32]);
generates("n^2 gives 1, 4, 9, 16", (n) => n * n, [1, 4, 9, 16]);
generates("n^3 gives 1, 8, 27, 64", (n) => n ** 3, [1, 8, 27, 64]);
generates("n gives 1, 2, 3, 4", (n) => n, [1, 2, 3, 4]);
// a rule that is right at n = 1 and wrong later must FAIL - the unit's own warning
{
  const wrongRule = (n) => 3 * n + 2;          // correct for 5,8,11,14
  const decoy = [5, 8, 11, 15];                // last term altered
  const got = decoy.map((_, i) => wrongRule(i + 1));
  eq("a rule agreeing at n=1 can still be wrong later", got.join(",") === decoy.join(","), false);
  eq("and the first term alone would not have shown it", wrongRule(1), decoy[0]);
}

// ---- the coefficient of n squared is HALF the second difference, across a range
{
  let wrong = 0, tested = 0;
  for (let a = -5; a <= 5; a += 1) {
    if (a === 0) continue;
    for (let b = -2; b <= 2; b += 1) {
      const terms = [1, 2, 3, 4, 5, 6].map((n) => a * n * n + b * n + 1);
      const secondDiff = diffs(diffs(terms))[0];
      tested += 1;
      if (Math.abs(secondDiff / 2 - a) > 1e-9) wrong += 1;
    }
  }
  eq("the coefficient is half the second difference (" + tested + " cases)", wrong, 0);
  eq("and that loop really ran", tested, 50);
}
eq("n squared alone has second difference 2", diffs(diffs([1, 4, 9, 16, 25]))[0], 2);
eq("3n squared has second difference 6", diffs(diffs([3, 12, 27, 48, 75]))[0], 6);
// the subtract-n-squared method, on the unit's two examples
{
  const terms = [2, 5, 10, 17, 26, 37];
  const left = terms.map((t, i) => t - (i + 1) ** 2);
  eq("subtracting n^2 from 2,5,10,... leaves", left.join(","), "1,1,1,1,1,1");
  eq("which is constant", allSame(left), true);
}
{
  const terms = [7, 8, 11, 16, 23, 32];
  const left = terms.map((t, i) => t - (i + 1) ** 2);
  eq("subtracting n^2 from 7,8,11,... leaves", left.join(","), "6,4,2,0,-2,-4");
  eq("which is linear", classify(left), "linear");
  generates("and its rule is -2n + 8", (n) => -2 * n + 8, left);
}

// ---- 9.2 the two cards, and the overtake point
eq("8th term of n^2 - 14", 8 ** 2 - 14, 50);
eq("20th term of 4n + 33", 4 * 20 + 33, 113);
eq("the second card is larger", 113 > 50, true);
eq("13th term of n^2 - 14", 13 ** 2 - 14, 155);
eq("13th term of 4n + 33", 4 * 13 + 33, 85);
// the unit states the quadratic first goes ahead at n = 10, and that n = 9 is close
{
  const ahead = [];
  for (let n = 1; n <= 30; n += 1) if (n * n - 14 > 4 * n + 33) ahead.push(n);
  eq("the quadratic first goes ahead at n = 10", ahead[0], 10);
  eq("at n = 9 it is still behind", 9 ** 2 - 14 > 4 * 9 + 33, false);
  eq("the n=9 values", (9 ** 2 - 14) + " vs " + (4 * 9 + 33), "67 vs 69");
  eq("the n=10 values", (10 ** 2 - 14) + " vs " + (4 * 10 + 33), "86 vs 73");
  eq("at month 8 the linear plan gives 65", 4 * 8 + 33, 65);
  eq("month 20 values", (20 ** 2 - 14) + " vs " + (4 * 20 + 33), "386 vs 113");
}

// ---- 9.3 functions
// the machine, both orders
eq("x5 then -1 on 3", 5 * 3 - 1, 14);
eq("-1 then x5 on 3", 5 * (3 - 1), 10);
eq("the two machines differ", 5 * 3 - 1 === 5 * (3 - 1), false);
// they differ by 4 at EVERY input - the unit's claim
{
  let sameAnywhere = 0;
  for (let x = -10; x <= 10; x += 0.5) if (Math.abs((5 * x - 1) - 5 * (x - 1)) < 1e-9) sameAnywhere += 1;
  eq("y=5x-1 and y=5(x-1) agree nowhere", sameAnywhere, 0);
  eq("and they differ by 4", (5 * 3 - 1) - 5 * (3 - 1), 4);
}
generates("y = 5x - 1 gives 4, 9, 14", (x) => 5 * x - 1, [4, 9, 14]);
generates("y = 2x + 1 gives 3, 5, 7, 9", (x) => 2 * x + 1, [3, 5, 7, 9]);
// the function test itself: one input with two outputs is not a function
{
  const isFunction = (pairs) => {
    const seen = new Map();
    for (const [i, o] of pairs) {
      if (seen.has(i) && seen.get(i) !== o) return false;
      seen.set(i, o);
    }
    return true;
  };
  eq("1->4, 2->9, 1->7 is not a function", isFunction([[1, 4], [2, 9], [1, 7]]), false);
  eq("3->9 and -3->9 IS a function", isFunction([[3, 9], [-3, 9]]), true);
  eq("y = x^2 over a range is a function", isFunction([-3, -2, -1, 0, 1, 2, 3].map((x) => [x, x * x])), true);
  eq("y = 5x - 1 over a range is a function", isFunction([1, 2, 3, 4].map((x) => [x, 5 * x - 1])), true);
  // two inputs sharing an output is the ALLOWED direction
  eq("x^2 really does share an output", 3 ** 2, (-3) ** 2);
}

// ---- the real problems
generates("35n + 20 gives the plumber's costs", (n) => 35 * n + 20, [55, 90, 125, 160, 195, 230]);
eq("6 hours costs 230", 35 * 6 + 20, 230);
eq("the orange pyramid layers", [1, 2, 3, 4, 5].map((n) => n * n).join(","), "1,4,9,16,25");
eq("and that is quadratic", classify([1, 4, 9, 16, 25]), "quadratic");
{
  // the plant: 2 cm then growing 5, 7, 9, 11
  const h = [2];
  let g = 5;
  for (let i = 0; i < 4; i += 1) { h.push(h[h.length - 1] + g); g += 2; }
  eq("plant heights", h.join(","), "2,7,14,23,34");
  eq("after four weeks", h[4], 34);
  eq("and quadratic", classify(h), "quadratic");
  eq("its second differences", diffs(diffs(h)).join(","), "2,2,2");
}

// ---- the unit must state the answers it was built around
says("the linear rule", "3n + 2");
says("the negative-a rule", "-2n + 22");
says("the negative-b rule", "4n - 3");
says("the quadratic rule", "n squared + 1");
says("the two-part quadratic", "n squared - 2n + 8");
says("the function definition", "each input has exactly one output");
says("the overtake point", "n = 10");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 9", u.unit.unitNo, 9);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

// no self-correcting prose may ship to a learner
for (const marker of ["Wait -", "Wait,", "no wait", "actually no", "let me check", "hmm"]) {
  if (blob.toLowerCase().includes(marker.toLowerCase())) {
    fail += 1; bad.push('the unit contains self-correcting prose: "' + marker + '"');
  } else pass += 1;
}

for (const code of ["9As.01", "9As.02", "9As.03"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9As.04", "9As.05", "9As.06", "9As.07"]) {
  eq(code + " not claimed (unit 10)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 9 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every nth term rule regenerates its own sequence; the difference test is verified as a");
console.log("    CLASSIFIER against 600 sequences of known kind; the half-the-second-difference rule holds");
console.log("    for every coefficient from -5 to 5; the quadratic overtakes at n = 10, not n = 9.");
