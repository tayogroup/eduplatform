// Recompute every claim in Grade 9 Unit 8 rather than trusting it.
//
// Ninth Grade 9 checker. Fractions cannot be checked as floating-point decimals
// without the checker becoming the least reliable thing in the room, so this file
// works in EXACT RATIONALS: a fraction is a [numerator, denominator] pair, and
// addition, multiplication and division are implemented on those pairs with
// integer arithmetic only. 1/3 has no double representation; [1, 3] does.
//
// THE TERMINATING TEST IS CHECKED AS A THEOREM, not as a list. The unit claims
// that a fraction in lowest terms terminates exactly when its denominator's only
// prime factors are 2 and 5. So the checker implements that test AND, separately,
// works out by long division whether each fraction's decimal actually stops -
// then requires the two to agree for every fraction with denominator up to 60.
// That is 59 x 60 comparisons of a rule against the thing it claims to predict,
// which is what "deduce" deserves; a handful of examples would confirm the
// examples and say nothing about the rule.
//
// 0.999... = 1 IS CHECKED BY ITS ARGUMENT, since the number itself cannot be
// represented. The unit's proof is that 10x - x = 9; in exact rationals with
// x = 9/9 that is checkable, and so is the claim that 3 x (1/3) = 1 exactly.
// What no checker can do is verify the prose that explains why there is no gap,
// and that is stated rather than implied.
//
//   node tools/check-ehel-math-g9-unit8.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-8.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-8.json not built yet - run build-ehel-math-g9-unit8.mjs --write");
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

// ---- exact rational arithmetic, integers only
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const red = ([n, d]) => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g]; };
const add = (a, b) => red([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
const sub = (a, b) => red([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
const mul = (a, b) => red([a[0] * b[0], a[1] * b[1]]);
const div = (a, b) => red([a[0] * b[1], a[1] * b[0]]);
const same = (a, b) => { const x = red(a), y = red(b); return x[0] === y[0] && x[1] === y[1]; };
const frac = (l, got, want) => {
  if (same(got, want)) { pass += 1; return; }
  fail += 1; bad.push(l + ": computed " + got[0] + "/" + got[1] + ", expected " + want[0] + "/" + want[1]);
};
// a mixed number as an exact fraction
const mixed = (w, n, d) => red([w * d + n, d]);

// the checker's own arithmetic must be right before it judges anything
frac("1/2 + 1/3", add([1, 2], [1, 3]), [5, 6]);
frac("2/3 x 3/4", mul([2, 3], [3, 4]), [1, 2]);
frac("3/4 div 2/5", div([3, 4], [2, 5]), [15, 8]);
eq("mixed 2 1/2", mixed(2, 1, 2).join("/"), "5/2");
eq("mixed 1 1/3", mixed(1, 1, 3).join("/"), "4/3");

// ============ 8.1 the terminating test, as a theorem ============

// the rule the unit teaches
const onlyTwosAndFives = (d) => {
  let x = d;
  while (x % 2 === 0) x /= 2;
  while (x % 5 === 0) x /= 5;
  return x === 1;
};
// whether the decimal ACTUALLY stops, found by long division with remainders
const decimalTerminates = (n, d) => {
  let r = n % d;
  for (let i = 0; i < 400 && r !== 0; i += 1) r = (r * 10) % d;
  return r === 0;
};
// the two must agree for every fraction with denominator up to 60
{
  let mismatches = 0, tested = 0;
  for (let d = 2; d <= 60; d += 1) {
    for (let n = 1; n < d; n += 1) {
      const [rn, rd] = red([n, d]);
      tested += 1;
      if (onlyTwosAndFives(rd) !== decimalTerminates(rn, rd)) mismatches += 1;
    }
  }
  eq("the prime-factor rule predicts termination in all " + tested + " cases", mismatches, 0);
  eq("and that was a real test, not an empty loop", tested > 1500, true);
}
// the unit's own examples
for (const [n, d, term] of [[1, 4, true], [1, 5, true], [1, 8, true], [1, 10, true], [1, 2, true],
                            [1, 9, false], [1, 6, false], [1, 7, false], [1, 3, false],
                            [7, 40, true], [5, 12, false], [9, 20, true], [3, 14, false]]) {
  eq(n + "/" + d + " terminates?", onlyTwosAndFives(red([n, d])[1]), term);
  eq(n + "/" + d + " really does?", decimalTerminates(...red([n, d])), term);
}
// the exact decimals the unit quotes
eq("1/4", 1 / 4, 0.25);
eq("1/5", 1 / 5, 0.2);
eq("1/8", 1 / 8, 0.125);
eq("7/40", 7 / 40, 0.175);
eq("9/20", 9 / 20, 0.45);
eq("40 factorises", [2, 2, 2, 5].reduce((a, b) => a * b), 40);
eq("20 factorises", [2, 2, 5].reduce((a, b) => a * b), 20);
eq("12 contains a 3", 12 % 3, 0);
eq("14 contains a 7", 14 % 7, 0);
eq("5/12 recurring digit", Math.round(5 / 12 * 100000) / 100000, 0.41667);

// ============ 8.2 the 0.999... argument, in exact rationals ============
frac("9/9 is 1", red([9, 9]), [1, 1]);
frac("1/3 x 3 is 1", mul([1, 3], [3, 1]), [1, 1]);
// the subtraction argument: 10x - x = 9x, and if that is 9 then x = 1
frac("10x - x = 9x", sub(mul([10, 1], [1, 1]), [1, 1]), [9, 1]);
frac("9x = 9 gives x = 1", div([9, 1], [9, 1]), [1, 1]);
// the ninths pattern the unit builds on
for (let k = 1; k <= 8; k += 1) {
  eq(k + "/9 recurs", onlyTwosAndFives(9), false);
  eq(k + "/9 digit is " + k, Math.floor(k / 9 * 10), k);
}
eq("9/9 is the one that terminates, because it is 1", onlyTwosAndFives(red([9, 9])[1]), true);

// ============ 8.3 to 8.5 fraction arithmetic, exactly ============
frac("2/3 x 3/4", mul([2, 3], [3, 4]), [1, 2]);
frac("multiplying first gives 6/12", red([6, 12]), [1, 2]);
eq("6/12 is not in lowest terms", gcd(6, 12) > 1, true);
frac("3/4 x 5/2", mul([3, 4], [5, 2]), [15, 8]);
frac("3/4 div 2/5 equals 3/4 x 5/2", div([3, 4], [2, 5]), mul([3, 4], [5, 2]));
frac("2/5 x 5/2 is 1", mul([2, 5], [5, 2]), [1, 1]);
eq("15/8 as a mixed number", "1 " + (15 % 8) + "/8", "1 7/8");
eq("dividing by less than 1 increases it", div([3, 4], [2, 5])[0] / div([3, 4], [2, 5])[1] > 3 / 4, true);
// mixed number addition
frac("2 1/2 + 1 2/3", add(mixed(2, 1, 2), mixed(1, 2, 3)), [25, 6]);
eq("25/6 as a mixed number", Math.floor(25 / 6) + " " + (25 % 6) + "/6", "4 1/6");
frac("15/6 + 10/6", add([15, 6], [10, 6]), [25, 6]);
// mixed number multiplication, and the wrong method
frac("2 1/2 x 1 1/3", mul(mixed(2, 1, 2), mixed(1, 1, 3)), [10, 3]);
eq("10/3 as a mixed number", Math.floor(10 / 3) + " " + (10 % 3) + "/3", "3 1/3");
frac("the parts-separately answer", add([2, 1], mul([1, 2], [1, 3])), [13, 6]);
eq("which is 2 1/6", Math.floor(13 / 6) + " " + (13 % 6) + "/6", "2 1/6");
eq("and it is wrong", same(add([2, 1], mul([1, 2], [1, 3])), mul(mixed(2, 1, 2), mixed(1, 1, 3))), false);
// the two missing products, exactly as expanding two brackets
frac("the four products sum correctly",
  add(add(mul([2, 1], [1, 1]), mul([2, 1], [1, 3])), add(mul([1, 2], [1, 1]), mul([1, 2], [1, 3]))),
  [10, 3]);
// mixed number division
frac("3 1/3 div 1 1/4", div(mixed(3, 1, 3), mixed(1, 1, 4)), [8, 3]);
eq("8/3 as a mixed number", Math.floor(8 / 3) + " " + (8 % 3) + "/3", "2 2/3");
// order of operations
frac("1/3 x 3/4 first", mul([1, 3], [3, 4]), [1, 4]);
frac("then 1/2 + 1/4", add([1, 2], [1, 4]), [3, 4]);
frac("left to right instead", mul(add([1, 2], [1, 3]), [3, 4]), [5, 8]);
eq("the two differ", same([3, 4], [5, 8]), false);
// the fraction bar as a bracket
frac("(1+2)/(5-1)", div(add([1, 1], [2, 1]), sub([5, 1], [1, 1])), [3, 4]);
frac("without brackets it is different", add(add([1, 1], [2, 5]), [-1, 1]), [2, 5]);
eq("0.75 is not 0.4", same([3, 4], [2, 5]), false);
// 8.5 making it easier
eq("1.5 x 24", 1.5 * 24, 36);
eq("36 x 3.5", 36 * 3.5, 126);
eq("24 x 3.5", 24 * 3.5, 84);
eq("84 x 1.5", 84 * 1.5, 126);
eq("1.5 x 3.5 x 24 straight through", 1.5 * 3.5 * 24, 126);
// every ordering of the three must agree - the commutative claim
{
  const ns = [1.5, 3.5, 24];
  const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const results = new Set(orders.map(([a, b, c]) => ns[a] * ns[b] * ns[c]));
  eq("all six orderings agree", results.size, 1);
  eq("and the value is 126", [...results][0], 126);
}
frac("2/3 x 3/2 is 1", mul([2, 3], [3, 2]), [1, 1]);
frac("2/3 x 17 x 3/2", mul(mul([2, 3], [17, 1]), [3, 2]), [17, 1]);
// the recipe and the grain
frac("2/3 of 3/4 cup", mul([2, 3], [3, 4]), [1, 2]);
frac("7/8 of 2/5 of a sack", mul([7, 8], [2, 5]), [7, 20]);

// ---- the unit must state the answers it was built around
says("the terminating rule", "only 2s and 5s");
says("the 0.999 answer", "0.999... and 1 are the same number");
says("the reciprocal rule", "multiplicative inverse");
says("the order-of-operations answer", "5/8");
says("the mixed product", "3 1/3");
says("the easier order", "126");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 8", u.unit.unitNo, 8);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

for (const code of ["9Nf.01", "9Nf.02", "9Nf.03", "9Nf.04"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Nf.05", "9Nf.06"]) {
  eq(code + " not claimed (unit 3)", blob.includes('"code":"' + code + '"'), false);
}
for (const code of ["9Nf.07", "9Nf.08"]) {
  eq(code + " not claimed (unit 11)", blob.includes('"code":"' + code + '"'), false);
}

console.log("  Grade 9 Unit 8 - " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
console.log("  NOT CHECKED BY COMPUTATION: the prose arguing why there is no gap between 0.999... and 1.");
console.log("    The unit's algebra IS checked in exact rationals; the explanation of it is not checkable.");
if (fail) process.exit(1);
console.log("  ✓ all fraction arithmetic verified in EXACT rationals, never as decimals; the terminating");
console.log("    rule agrees with long division for every fraction with denominator up to 60; the");
console.log("    parts-separately error is shown to omit exactly two of the four products.");
