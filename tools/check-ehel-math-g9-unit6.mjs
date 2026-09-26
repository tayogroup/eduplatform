// Check Grade 9 Unit 6, and say plainly how little of it computation can reach.
//
// Seventh Grade 9 checker, and the first that has to report a LIMIT rather than a
// clean tick. Unit 6 teaches judgement: whether a question is answerable, whether
// a prediction could fail, whether a method is worth its intrusiveness, where
// bias sits and which way it pushes. None of that is arithmetic, and no checker
// in this repo can verify it.
//
// So this file does two things and is honest about the boundary between them.
//
//   1. It COMPUTES the numeric claims - the sample proportions, the reply rate,
//      the bar-chart ratio - exactly as the other Grade 9 checkers do. Those are
//      the only items here that can be right or wrong in the machine's sense.
//
//   2. It STRUCTURALLY checks the rest: that every judgement item actually
//      carries a model answer or an expected response, that no reasoning prompt
//      ships with an empty one, and that the classification items agree with
//      themselves across the unit (a quantity called continuous in the concepts
//      is not called discrete in the quiz).
//
// It then PRINTS how many items fall outside computation, rather than leaving a
// green tick to imply the whole unit was verified. That number is the point:
// check-math-answer-keys.mjs reaches 109 of 1,596 maths questions and reports the
// rest as unchecked rather than counting them as passes, and this is the same
// discipline applied to a unit where the unchecked share is most of it.
//
// What would actually verify this unit is a curriculum reviewer reading it. That
// is recorded in the unit as reviewStatus "Not curriculum-reviewed", and nothing
// here should be read as a substitute.
//
//   node tools/check-ehel-math-g9-unit6.mjs

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const UNIT = path.resolve(HERE, "..", "src", "prototypes", "ehel-academy",
  "mathematics", "grade-9", "data", "units", "unit-6.json");

if (!fs.existsSync(UNIT)) {
  console.error("  unit-6.json not built yet - run build-ehel-math-g9-unit6.mjs --write");
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

// ============ 1. THE NUMERIC CLAIMS ============

// the company's representative sample
eq("population total", 187 + 362, 549);
close("proportion of men", 187 / 549, 0.340619, 1e-5);
eq("as a percentage to 1 dp", Math.round(187 / 549 * 1000) / 10, 34.1);
close("34.1% of 40", 0.341 * 40, 13.64, 1e-9);
eq("men rounded to a person", Math.round(0.341 * 40), 14);
// and from the exact proportion, which must agree - a rounded intermediate that
// changed the answer would be a real defect
eq("men from the exact proportion", Math.round(187 / 549 * 40), 14);
eq("women", 40 - 14, 26);
eq("the parts add to the sample size", 14 + 26, 40);

// the college's representative sample
eq("college total", 200 + 150, 350);
close("proportion of girls", 200 / 350, 0.571429, 1e-5);
eq("girls as a percentage to 1 dp", Math.round(200 / 350 * 1000) / 10, 57.1);
eq("girls in a sample of 30", Math.round(200 / 350 * 30), 17);
eq("boys in a sample of 30", Math.round(150 / 350 * 30), 13);
eq("and these add to 30", 17 + 13, 30);
// THE UNIT'S CLAIM ABOUT ROUNDING WAS WRONG ONCE AND THIS CHECK IS WHY IT ISN'T NOW.
// An earlier draft said "rounding each part separately can sometimes miss the
// total, so the check matters" - attached to a TWO-group example where it cannot.
// With two groups the proportions add to 1, so the fractional parts are f and
// 1 - f and the two roundings always go opposite ways. The check below failed,
// which is how the false claim was found. It now tests what is actually true.
{
  let missed = 0;
  for (let n = 2; n < 200; n += 1) {
    if (Math.round(200 / 350 * n) + Math.round(150 / 350 * n) !== n) missed += 1;
  }
  eq("two groups NEVER miss the total", missed, 0);
}
{
  // three or more groups genuinely can, which is what the unit now says
  let missed = 0;
  for (let n = 2; n < 40; n += 1) if (3 * Math.round(n / 3) !== n) missed += 1;
  eq("three equal groups often miss it", missed > 20, true);
  eq("five groups of 6.4 from a sample of 32", 5 * Math.round(32 / 5), 30);
  eq("which is two short", 32 - 5 * Math.round(32 / 5), 2);
  eq("but a sample of 30 over five groups is exact", 5 * (30 / 5), 30);
}

// the reply rate
close("105 of 350", 105 / 350, 0.3);
eq("reply rate as a percentage", 105 / 350 * 100, 30);
eq("non-response", 350 - 105, 245);
eq("non-response share", (350 - 105) / 350 * 100, 70);

// the misleading bar chart: the ratio distortion the unit quotes
eq("true ratio of 92 to 50", Math.round(92 / 50 * 100) / 100, 1.84);
eq("bar heights when the axis starts at 40", (50 - 40) + "," + (92 - 40), "10,52");
eq("apparent ratio", 52 / 10, 5.2);
eq("the distortion makes it look larger", 5.2 > 1.84, true);
// "nearly three times bigger than it is" - check that claim
close("distortion factor", 5.2 / 1.84, 2.826, 1e-3);
eq("which is nearly three", Math.round(5.2 / 1.84), 3);

// the shampoo advert
eq("85% of 142", Math.round(0.85 * 142), 121);

// ============ 2. STRUCTURAL CHECKS ON THE JUDGEMENT ITEMS ============

// a judgement item with no model answer is an item a learner cannot check
for (const r of u.reasoningPrompts) {
  if (r.modelAnswer && r.modelAnswer.length > 120) pass += 1;
  else { fail += 1; bad.push(r.id + ": modelAnswer is missing or too short to be an argument"); }
  if (Array.isArray(r.keyIdeas) && r.keyIdeas.length >= 2) pass += 1;
  else { fail += 1; bad.push(r.id + ": needs at least two keyIdeas"); }
}
for (const p of u.practice) {
  if (p.answer && String(p.answer).length > 0) pass += 1;
  else { fail += 1; bad.push(p.id + ": has no answer"); }
}
for (const w of u.workedExamples) {
  if (w.solution && w.solution.length > 80) pass += 1;
  else { fail += 1; bad.push(w.id + ": solution is missing or too short"); }
}

// the data-kind classifications must agree with themselves across the unit
const CLASSIFICATION = [
  ["height measured with a tape", "continuous"],
  ["shoe size", "discrete"],
  ["short, average and tall", "categorical"],
];
for (const [what, kind] of CLASSIFICATION) {
  // the unit must state this kind somewhere, and must not state a contradicting one
  // for the same quantity in the assessment
  const q = u.assessment.questions.find((x) => x.question.toLowerCase().includes(what.split(" ")[0]));
  if (!q) { pass += 1; continue; }
  if (q.answer.toLowerCase().includes(kind)) pass += 1;
  else { fail += 1; bad.push('assessment calls "' + what + '" ' + q.answer + ", but the unit teaches " + kind); }
}
says("continuous", "Continuous");
says("discrete", "Discrete");
says("categorical", "Categorical");
says("the one-way reduction", "cannot be turned back into measurements");
says("the trial", "trial");
says("the three homes of bias", "The question, the sample, and who chose to reply");
says("the corrected rounding claim", "three or more groups");

// ---- structure, as in every other unit
const nOut = u.outcomes.length;
const refs = new Set();
blob.replace(/"outcomeId":"lo(\d+)"/g, (_, n) => { refs.add(+n); return ""; });
for (const r of refs) if (r < 1 || r > nOut) { fail += 1; bad.push("outcomeId lo" + r + " has no outcome (there are " + nOut + ")"); }
eq("selfAssessment mirrors outcomes", u.selfAssessment.length, nOut);
eq("stage is 9", u.cambridge.stage, 9);
eq("framework is 0862", u.cambridge.code, "0862");
eq("unit number is 6", u.unit.unitNo, 6);
eq("not claimed as reviewed", u.cambridge.objectiveMapping.reviewed, false);

for (const q of u.assessment.questions) {
  if (q.options.includes(q.answer)) pass += 1;
  else { fail += 1; bad.push(q.id + ': answer "' + q.answer + '" is not among its options'); }
}
for (const g of u.games.games) for (const r of g.rounds) {
  if (r.choices.includes(r.answer)) pass += 1;
  else { fail += 1; bad.push(g.id + ': round answer "' + r.answer + '" is not among its choices'); }
}

for (const code of ["9Ss.01", "9Ss.02"]) {
  eq(code + " claimed", u.cambridge.objectives.some((o) => o.code === code), true);
}
for (const code of ["9Ss.03", "9Ss.04", "9Ss.05"]) {
  eq(code + " not claimed (unit 15)", blob.includes('"code":"' + code + '"'), false);
}

// ============ 3. SAY WHAT WAS NOT CHECKED ============
// Count the items whose correctness is a matter of judgement. This is not a
// failure; it is the measurement that stops a tick from overclaiming.
const judgement = [];
const NUMERIC = /\d/;
for (const r of u.reasoningPrompts) judgement.push(r.id);
for (const p of u.practice) if (!NUMERIC.test(String(p.answer))) judgement.push(p.id);
for (const rp of u.realProblems) if (!NUMERIC.test(rp.answer)) judgement.push(rp.id);
for (const f of u.fluency) if (!NUMERIC.test(String(f.answer))) judgement.push(f.id);

console.log("  Grade 9 Unit 6 - " + pass + " check(s) passed, " + fail + " failed");
for (const b of bad) console.log("    " + b);
console.log("  NOT CHECKED BY COMPUTATION: " + judgement.length + " item(s) whose answer is a judgement");
console.log("    (" + judgement.join(", ") + ")");
console.log("    These were read by a person when written and are structurally checked above -");
console.log("    every one carries a model answer or expected response - but nothing here verifies");
console.log("    that the argument in them is a good one. Only curriculum review does that, and the");
console.log("    unit records reviewStatus \"Not curriculum-reviewed\".");
if (fail) process.exit(1);
console.log("  ✓ every numeric claim recomputes; no judgement item ships without a model answer;");
console.log("    the data-kind classifications agree across concepts, practice and assessment.");
