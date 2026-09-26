// Recompute every number in Grade 9 Unit 1 rather than trusting it.
//
// Companion to check-ehel-math-g9-unit12.mjs. Same reason: this grade is
// authored rather than generated, so the arithmetic is restated here as
// computation and a claim that cannot be computed is reported unchecked rather
// than counted as a pass.
//
// ONE NOTE ON DECIMALS, because the first version of this file raised a false
// alarm. The unit says that squaring a calculator's 1.414213562 gives
// 1.999999998944, not 2. The check tested that with toFixed(12), which ROUNDS,
// and rounding the true value 1.999999998944728 to twelve places gives
// ...945 - so the check reported an error in correct content. A truncation and
// a rounding are both faithful ways to quote a decimal, and a checker that
// silently assumes one of them will keep finding defects that are not there.
// Decimal claims here are therefore tested as PREFIXES of the true value,
// which is true of both forms.
//
//   node tools/check-ehel-math-g9-unit1.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-1.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-1.json not built yet — run build-ehel-math-g9-unit1.mjs --write");
  process.exit(1);
}
const u = JSON.parse(fs.readFileSync(UNIT, "utf8"));
const blob = JSON.stringify(u);

let pass = 0, fail = 0;
const bad = [];
const eq = (l, got, want) => {
  if (String(got) === String(want)) { pass += 1; return; }
  fail += 1; bad.push(`${l}: computed ${got}, expected ${want}`);
};
// a decimal quoted in the text must be a prefix of the true value, so that a
// truncation and a correct rounding both pass
const prefix = (l, real, quoted) => {
  if (String(real).startsWith(quoted)) { pass += 1; return; }
  fail += 1; bad.push(`${l}: ${quoted} is not a prefix of ${real}`);
};
// a claim the unit makes must actually appear in it
const says = (l, text) => {
  if (blob.includes(text)) { pass += 1; return; }
  fail += 1; bad.push(`${l}: the unit does not contain "${text}"`);
};

// ---- rational / irrational
eq("39/4", 39 / 4, 9.75);
prefix("sqrt2 squared", 1.414213562 * 1.414213562, "1.999999998944");
prefix("34/15", 34 / 15, "2.2666666");
prefix("22/7", 22 / 7, "3.142857");

// ---- surds and estimates
eq("sqrt30 between 5 and 6", 5 * 5 < 30 && 6 * 6 > 30, true);
eq("5.5 squared", 5.5 * 5.5, 30.25);
eq("5.4 squared", +(5.4 * 5.4).toFixed(2), 29.16);
prefix("sqrt30", Math.sqrt(30), "5.477");
eq("cube numbers 27 and 64", 3 ** 3 + "," + 4 ** 3, "27,64");
prefix("3.1 cubed", 3.1 ** 3, "29.791");
eq("sqrt50 between 7 and 8", 7 * 7 < 50 && 8 * 8 > 50, true);
eq("8.4 squared", +(8.4 * 8.4).toFixed(2), 70.56);
eq("8.3 squared", +(8.3 * 8.3).toFixed(2), 68.89);
eq("sqrt70 between 8 and 9", 8 * 8 < 70 && 9 * 9 > 70, true);

// ---- standard form
eq("1.496e8", 1.496e8, 149600000);
eq("7.1e-7", 7.1e-7, 0.00000071);
eq("4.5e-4", 4.5e-4, 0.00045);
eq("2.8e4", 2.8e4, 28000);
eq("9.81e-3", 9.81e-3, 0.00981);
eq("15e7 equals 1.5e8", 15e7, 1.5e8);
eq("4.67e3", 4.67e3, 4670);
eq("3.2e5", 3.2e5, 320000);
eq("6.2e-4", 6.2e-4, 0.00062);
eq("6.2e-3 is ten times bigger", 6.2e-3, 0.0062);

// ---- powers of ten
eq("47 / 10^3", 47 / 1e3, 0.047);
eq("47 x 10^-3", 47 * 1e-3, 0.047);
eq("4700 / 10^4", 4700 / 1e4, 0.47);
eq("3e8 x 100", 3e8 * 100, 3e10);

// ---- the Teacher's Resource generalisation: multiplying by 10 raises the index
// by exactly 1 and dividing lowers it by 1, across the negative range too. Tested
// over the whole span the example quotes rather than at one convenient point.
for (let k = -4; k <= 4; k += 1) {
  eq("10^" + k + " x 10 = 10^" + (k + 1), 10 ** k * 10, 10 ** (k + 1));
  eq("10^" + k + " / 10 = 10^" + (k - 1), +(10 ** k / 10).toPrecision(12), +(10 ** (k - 1)).toPrecision(12));
}

// ---- indices
eq("powers of 3", [3 ** 1, 3 ** 2, 3 ** 3, 3 ** 4, 3 ** 5, 3 ** 6].join(","), "3,9,27,81,243,729");
eq("3^0", 3 ** 0, 1);
eq("2^-3", 2 ** -3, 0.125);
eq("2^3 x 2^4", 2 ** 3 * 2 ** 4, 128);
eq("2^7", 2 ** 7, 128);
eq("5^4 / 5^2", 5 ** 4 / 5 ** 2, 25);
eq("7^3 / 7^3", 7 ** 3 / 7 ** 3, 1);
eq("3^5 x 3^2", 3 ** 5 * 3 ** 2, 2187);
eq("6^5 / 6^3", 6 ** 5 / 6 ** 3, 36);
eq("2^0 + 5^0", 2 ** 0 + 5 ** 0, 2);
eq("2^3 x 5^2", 2 ** 3 * 5 ** 2, 200);

// ---- the unit must actually state the answers it was built to state
says("standard form of the Sun distance", "1.496 x 10^8");
says("small number example", "7.1 x 10^-7");
says("negative index", "1/8");
says("index law product", "2^7 = 128");
says("index law quotient", "5^2 = 25");
says("the generalisation", "increases the index by 1");

// ---- structure
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push(`outcomeId lo${r} has no outcome (there are ${nOut})`); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");

// 9Np.02 belongs to unit 3, not here — the mapping note says so and the data must agree
eq("9Np.02 not claimed", blob.includes('"code":"9Np.02"'), false);

console.log("  Grade 9 Unit 1 — " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every stated value recomputes; 9Np.02 correctly left for unit 3; structure consistent.");
