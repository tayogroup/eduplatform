// Check Mathematics quiz keys by working the answer out.
//
// Science and Computing compare each key with the answer key printed in its own
// booklet. That is impossible here: the Mathematics Practice booklets hold
// worksheet tasks with prose keys ("Section 1: 1) a) 3,000 b) 3 tenths = 0.3"),
// and the 1,596 multiple-choice questions the app asks appear in them nowhere —
// they are authored, not extracted. Note too that in these booklets "a) b) c)"
// are the PARTS of one task, not answer options, so a parser carried over from
// the other two subjects would misread every question it touched.
//
// Computing the answer is a stronger check than provenance anyway: it does not
// care where the question came from, and it cannot be fooled by a booklet that
// was wrong to begin with. It just cannot reach very much — 109 of 1,596. The
// rest are conceptual, diagrammatic or word problems, and the gate says so
// rather than counting them as passes.
//
// THE RULE THAT MAKES IT SAFE: the expression must account for every number in
// the question. Without it "Work out 6 + 7 + 4" verifies as 6+7=13 and calls a
// correct key wrong. Everything the rule cannot claim is left unchecked; a gap
// is recoverable, a confident wrong answer inside the gate is not.
//
// Usage: node tools/check-math-answer-keys.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATH = path.join(ROOT, "src", "prototypes", "ehel-academy", "mathematics");
// Coverage may not fall. A pattern that stops matching removes questions from
// the comparison silently, and the gate would still print a tick.
const MINIMUM_CHECKED = 109;

// A bare "/" is a fraction here far more often than a division sign ("1/5 of
// 25"), so it is never treated as an operator.
const OPS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "−": (a, b) => a - b,
  "×": (a, b) => a * b,
  x: (a, b) => a * b,
  "*": (a, b) => a * b,
  "÷": (a, b) => (b === 0 ? null : a / b),
};
const NUMTOK = /(?<![\d.,/])\d[\d,]*(?:\.\d+)?(?![\d/])/g;
const EXPR = /(?<![\d.,/])(\d[\d,]*(?:\.\d+)?)\s*([+\-−×x*÷])\s*(\d[\d,]*(?:\.\d+)?)(?![\d/])/g;
const NUMERIC = /^-?\d[\d,]*(?:\.\d+)?$/;
// An estimation question asks for a rounded answer on purpose: "Estimate 3,872 +
// 5,145 to the nearest thousand" keys 9,000 while the exact sum is 9,017.
// Evaluating those exactly calls every one of the correct keys wrong.
const ESTIMATE = /estimat|round|approximat|nearest/i;
// "What is the y-intercept of y = 7 - 2x?" is not the difference 7-2. A digit
// bound to a letter, or a named variable, is the tell.
const ALGEBRA = /\d\s*[a-z]\b|\b[a-z]\s*=|intercept|gradient|coefficient|expand|factoris|simplify/i;

const toNumber = (text) => {
  const clean = String(text).replace(/,/g, "").trim();
  return NUMERIC.test(String(text).trim()) || /^-?\d+(\.\d+)?$/.test(clean) ? Number(clean) : null;
};
const near = (a, b) => Math.abs(a - b) < 1e-9;

function evaluate(question) {
  if (ESTIMATE.test(question) || ALGEBRA.test(question)) return null;
  const found = [...question.matchAll(EXPR)];
  if (found.length !== 1) return null;
  const m = found[0];
  // every digit-run in the question must belong to this one expression
  const from = m.index;
  const to = m.index + m[0].length;
  for (const tok of question.matchAll(NUMTOK)) {
    if (tok.index < from || tok.index + tok[0].length > to) return null;
  }
  let a = toNumber(m[1]);
  const b = toNumber(m[3]);
  const op = OPS[m[2]];
  if (a === null || b === null || !op) return null;
  // "-6 + 9" reads as 6 + 9 = 15 unless the leading sign is honoured; the key
  // is 3 and correct.
  const lead = question.slice(0, from).trimEnd();
  if (lead.endsWith("-") || lead.endsWith("−")) a = -a;
  return op(a, b);
}

// Counting a run of identical glyphs PRINTED in the question. A pictogram states
// its scale in words ("Key: one book = 2 books. Farah's row shows 4 symbols"),
// so the glyphs on the page are the key, not the quantity — counting them there
// returns 1 and calls a correct key wrong.
const GLYPH_RUN = /([\u{1F300}-\u{1FAFF}■-➿])\1+/u;
function countGlyphs(question) {
  if (question.includes("=") || /\bkey\b|symbol/i.test(question)) return null;
  if (!GLYPH_RUN.test(question) || !/how many/i.test(question)) return null;
  if (new RegExp(NUMTOK.source).test(question)) return null;
  const runs = new Map();
  for (const m of question.matchAll(/([\u{1F300}-\u{1FAFF}■-➿])(\1*)/gu)) {
    // Spread, not .length: an emoji is a surrogate pair, so seven buttons
    // measure as fourteen UTF-16 units and the count comes back double.
    runs.set(m[1], (runs.get(m[1]) || 0) + 1 + [...m[2]].length);
  }
  if (runs.size !== 1) return null;
  return [...runs.values()][0];
}

const failures = [];
let checked = 0;
let unchecked = 0;
const kinds = { arithmetic: 0, "count-glyphs": 0 };

for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(MATH, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const unitNo = Number(/unit-(\d+)/.exec(file)?.[1]);
    const built = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    for (const question of (built.assessment || {}).questions || []) {
      const text = String(question.question || "");
      const key = toNumber(question.answer);
      let expected = null;
      let kind = null;

      const value = evaluate(text);
      if (value !== null && key !== null) { expected = value; kind = "arithmetic"; }
      if (expected === null) {
        const count = countGlyphs(text);
        if (count !== null && key !== null) { expected = count; kind = "count-glyphs"; }
      }
      if (expected === null) { unchecked += 1; continue; }

      checked += 1;
      kinds[kind] += 1;
      if (!near(key, expected)) {
        failures.push(`grade-${grade}/unit-${unitNo} ${question.id}: key ${JSON.stringify(question.answer)} `
          + `but ${kind === "arithmetic" ? "the arithmetic" : "the count"} gives ${expected} — ${text.slice(0, 70)}`);
      }
    }
  }
}

if (checked < MINIMUM_CHECKED) {
  failures.push(`coverage fell from ${MINIMUM_CHECKED} to ${checked} machine-checkable questions. `
    + "A pattern that stops matching drops questions out of this comparison without failing "
    + "anything. Find what stopped matching before lowering MINIMUM_CHECKED.");
}
if (failures.length) {
  console.error(`✗ ${failures.length} math answer-key failure(s):`);
  for (const line of failures) console.error(`   ${line}`);
  process.exit(1);
}
console.log(`✓ math answer keys: ${checked} computed answers match their key `
  + `(${kinds.arithmetic} arithmetic, ${kinds["count-glyphs"]} counting; ${unchecked} not machine-checkable)`);
