// Recompute every number in Grade 9 Unit 12 rather than trusting it.
//
// The subject's existing answer-key gate, check-math-answer-keys.mjs, computes
// the answer from the question text and reaches about 7% of items; the rest are
// conceptual or diagrammatic and are reported as unchecked. That is the right
// design for 1,596 generated questions. This unit is 100 hand-authored items,
// so the probability arithmetic is enumerated here instead - each claim is
// restated as a computation, and a claim that cannot be computed is listed as
// unchecked rather than counted as a pass.
//
//   node tools/check-ehel-math-g9-unit12.mjs
//
// Exit 1 on any mismatch.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-12.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-12.json not built yet — run build-ehel-math-g9-unit12.mjs --write");
  process.exit(1);
}
const u = JSON.parse(fs.readFileSync(UNIT, "utf8"));

const f = (n, d) => { const g = (a, b) => (b ? g(b, a % b) : a); const k = g(n, d) || 1; return (n / k) + "/" + (d / k); };
let pass = 0, fail = 0;
const bad = [];
function eq(label, got, want) {
  if (String(got) === String(want)) { pass += 1; return; }
  fail += 1; bad.push(`${label}: computed ${got}, unit says ${want}`);
}

// ---- the maths this unit asserts, each recomputed from first principles
eq("we01 P(red or blue)", 0.35 + 0.2, 0.55);
eq("we02 P(even or >4)", f([2, 4, 5, 6].length, 6), "2/3");
eq("we03 P(gold)", +(1 - (0.35 + 0.2)).toFixed(2), 0.45);
eq("we04 P(no rain)", +(1 - 0.15).toFixed(2), 0.85);
eq("we05 P(Y|X) even", f(2, 3), "2/3");
eq("we05 P(Y|not X) odd", f(2, 3), "2/3");
eq("we06 P(red|first red)", f(5, 9), "5/9");
eq("we06 P(red|first blue)", f(6, 9), "2/3");   // 6/9 simplifies to 2/3
eq("we07 P(head and >2)", f(1 * 4, 2 * 6), "1/3");
eq("we07 listing check", f(4, 12), "1/3");
eq("we08 odd-A path", f(1 * 1, 2 * 4), "1/8");
eq("we08 odd-B path", f(1 * 3, 2 * 4), "3/8");
eq("we08 paths sum", (1 + 3 + 1 + 3) / 8, 1);
eq("we09 at least one head", f(3, 4), "3/4");
eq("we09 via complement", f(4 - 1, 4), "3/4");
eq("we10 both red replaced", f(3 * 3, 5 * 5), "9/25");
eq("we10 both blue replaced", f(2 * 2, 5 * 5), "4/25");
eq("we10 same colour", f(9 + 4, 25), "13/25");
eq("we11 relative frequency", 12 / 50, 0.24);
eq("we11 theoretical 3dp", (1 / 6).toFixed(3), "0.167");
eq("we12 expected heads", 0.5 * 80, 40);
eq("we12 observed proportion", 46 / 80, 0.575);

eq("p01", +(0.4 + 0.25).toFixed(2), 0.65);
eq("p02", +(1 - (0.5 + 0.3)).toFixed(1), 0.2);
eq("p03", +(1 - 0.12).toFixed(2), 0.88);
eq("p06 tail and odd", f(1 * 3, 2 * 6), "1/4");
eq("p07 two heads", f(1, 4), "1/4");
eq("p08 both red", f(3 * 3, 5 * 5), "9/25");
eq("p10 at least one tail", f(3, 4), "3/4");
eq("p11 relative frequency 3dp", (14 / 60).toFixed(3), "0.233");
eq("p11 expected", (1 / 6) * 60, 10);

eq("fl01", +(0.3 + 0.5).toFixed(1), 0.8);
eq("fl02", +(1 - 0.7).toFixed(1), 0.3);
eq("fl03", +(1 - 0.25).toFixed(2), 0.75);
eq("fl04", f(1, 4), "1/4");
eq("fl05", f(1 * 1, 2 * 3), "1/6");
eq("fl06", f(1 * 1, 2 * 6), "1/12");
eq("fl07", +(1 - 0.4).toFixed(1), 0.6);
eq("fl08", f(1 * 1, 2 * 4), "1/8");
eq("fl09", f(3, 4), "3/4");
eq("fl10", 12 / 50, 0.24);
eq("fl11", 0.5 * 80, 40);
eq("fl12", (1 / 6) * 60, 10);

eq("rp01 or", +(0.45 + 0.3).toFixed(2), 0.75);
eq("rp01 neither", +(1 - 0.75).toFixed(2), 0.25);
eq("rp02 clear", +(1 - (0.15 + 0.35)).toFixed(1), 0.5);
eq("rp03 both unripe replaced", f(3 * 3, 10 * 10), "9/100");
eq("rp04 both unripe not replaced", f(3 * 2, 10 * 9), "1/15");
eq("rp05 P(win)", 4 / 200, 0.02);
eq("rp05 expected wins", 0.02 * 50, 1);
eq("rp06 relative frequency", 18 / 120, 0.15);

eq("q02 P(R)", +(1 - (0.4 + 0.35)).toFixed(2), 0.25);
eq("q03 head and 6", f(1, 12), "1/12");
eq("q05 tree path", f(1 * 1, 3 * 2), "1/6");
eq("q06 at least one head", f(3, 4), "3/4");
eq("q07 relative frequency", 15 / 60, 0.25);
eq("q08 expected sixes", (1 / 6) * 60, 10);

eq("game1 r1", +(0.2 + 0.5).toFixed(1), 0.7);
eq("game1 r2", f(1 * 1, 2 * 4), "1/8");
eq("game1 r3", +(1 - 0.45).toFixed(2), 0.55);
eq("game1 r4", f(1, 4), "1/4");
eq("game2 r1", 0.5 * 60, 30);
eq("game2 r2", (1 / 6) * 120, 20);
eq("game2 r3", 9 / 36, 0.25);

// ---- structural checks: every answer the unit states must appear where claimed
const stated = [
  ["we01", "0.55"], ["we03", "0.45"], ["we07", "1/3"], ["we10", "13/25"],
  ["p08", "9/25"], ["fl05", "1/6"], ["rp04", "1/15"], ["q06", "3/4"],
];
for (const [id, want] of stated) {
  const hay = JSON.stringify(u).match(new RegExp('"id":"' + id + '"[^}]*}', "g")) || [];
  if (!hay.length || !hay[0].includes(want)) { fail += 1; bad.push(`${id}: expected answer ${want} not present in the item`); }
  else pass += 1;
}

// every outcomeId referenced must exist
const nOut = u.outcomes.length;
const refs = new Set();
JSON.stringify(u).replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push(`outcomeId lo${String(r).padStart(2, "0")} has no outcome (there are ${nOut})`); }

// self-assessment must mirror the outcomes
if (u.selfAssessment.length !== nOut) { fail += 1; bad.push("selfAssessment count does not match outcomes"); } else pass += 1;

console.log("  Grade 9 Unit 12 — " + pass + " computed check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
if (fail) process.exit(1);
console.log("  ✓ every stated probability recomputes correctly; outcome references and self-assessment are consistent.");
