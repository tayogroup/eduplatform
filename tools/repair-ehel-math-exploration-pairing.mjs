// Re-pair each unit's Exploration questions with the explainer they belong to.
//
// An exploration card carries two halves: an explainer (title, context,
// explanation, derived from a concept) and a question (prompt, answer, hint).
// The build zipped them together by index without checking they were about the
// same thing, so Stage 2 unit 7 taught "The Days of the Week" and then asked the
// learner to fill in the missing months.
//
// The question triples are internally coherent - prompt, answer and hint agree
// with each other. Only the placement is wrong. So this is an assignment
// problem: keep every question exactly as written and choose the permutation
// that best matches questions to explainers, scored by keyword overlap and
// solved exactly with a bitmask DP.
//
// What this cannot do: invent a question. Where a unit has no question about a
// concept, some card still ends up with an imperfect match - the best available
// arrangement, not a perfect one. Units whose score barely improves are left
// alone rather than churned.
//
// Narration is unaffected: explainer text does not move, and the set of prompts
// within a unit is unchanged, so no pre-rendered clip changes its hash.
//
//   node tools/repair-ehel-math-exploration-pairing.mjs [--write] [--min-gain 0.5]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const gainArg = argv.indexOf("--min-gain");
const MIN_GAIN = gainArg >= 0 ? Number(argv[gainArg + 1]) : 0.5;

// Only the fields that describe the question travel together.
const QUESTION_FIELDS = ["prompt", "answer", "hint"];

const STOP = new Set("the a an and or of to in for with is are was were be been it its this that these those you your we our they them their as at by from on off up down out into over under about after before between each every some any all both few more most other such no nor not only own same so than too very can will just should now what which who whom whose when where why how if then else do does did done have has had having make makes made write writes written find finds found give gives given say says said use uses used put puts work works working answer answers example explain".split(" "));
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));

function overlap(qWords, cSet) {
  const q = new Set(qWords);
  if (!q.size || !cSet.size) return 0;
  let hits = 0;
  for (const w of q) if (cSet.has(w)) hits += 1;
  return hits / q.size;
}
const popcount = (x) => { let c = 0; while (x) { x &= x - 1; c += 1; } return c; };

// Exact optimal assignment: matrix[i][j] scores question i under explainer j.
function bestAssignment(matrix) {
  const n = matrix.length;
  const full = (1 << n) - 1;
  const dp = new Float64Array(1 << n).fill(-1);
  const pick = new Int8Array(1 << n).fill(-1);
  dp[0] = 0;
  for (let mask = 0; mask <= full; mask += 1) {
    if (dp[mask] < 0) continue;
    const i = popcount(mask);
    if (i >= n) continue;
    for (let j = 0; j < n; j += 1) {
      if (mask & (1 << j)) continue;
      const next = mask | (1 << j);
      const value = dp[mask] + matrix[i][j];
      if (value > dp[next]) { dp[next] = value; pick[next] = j; }
    }
  }
  const assign = new Array(n);
  let mask = full;
  for (let i = n - 1; i >= 0; i -= 1) { const j = pick[mask]; assign[i] = j; mask ^= (1 << j); }
  return { assign, total: dp[full] };
}

let unitsChanged = 0, cardsMoved = 0, unitsSkipped = 0, filesChanged = 0;
const samples = [];

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-[2-8]$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const ex = unit.explorations || [];
    if (ex.length < 2 || ex.length > 14) continue;

    const n = ex.length;
    const cSets = ex.map((e) => new Set([...words(e.title), ...words(e.context), ...words(e.explanation)]));
    const qWords = ex.map((e) => [...words(e.prompt), ...words(e.answer)]);
    const matrix = [];
    for (let i = 0; i < n; i += 1) matrix.push(cSets.map((c) => overlap(qWords[i], c)));
    const identity = matrix.reduce((s, row, i) => s + row[i], 0);
    const { assign, total } = bestAssignment(matrix);
    const moved = assign.reduce((c, j, i) => c + (j === i ? 0 : 1), 0);
    if (!moved) continue;
    if (total - identity < MIN_GAIN) { unitsSkipped += 1; continue; }

    // Snapshot the question triples, then place each under its chosen explainer.
    const questions = ex.map((e) => Object.fromEntries(QUESTION_FIELDS.map((f) => [f, e[f]])));
    const before = ex.map((e) => e.prompt);
    assign.forEach((slot, i) => { for (const f of QUESTION_FIELDS) ex[slot][f] = questions[i][f]; });

    // The same questions must still be present, just rearranged. Compare as
    // sorted multisets; a lost or duplicated prompt means the permutation was
    // not a permutation, and nothing should be written.
    const after = ex.map((e) => e.prompt);
    const sameSet = [...before].sort().every((p, i) => p === [...after].sort()[i]);
    if (before.length !== after.length || !sameSet) {
      console.error(`ERROR: ${gradeDir}/${file} lost or duplicated a question; aborting without writing.`);
      process.exit(1);
    }

    unitsChanged += 1; cardsMoved += moved; filesChanged += 1;
    if (samples.length < 4) samples.push({ where: `${gradeDir}/${file}`, gain: total - identity, ex: ex.map((e) => [e.title, e.prompt]) });
    if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  }
}

console.log(`${write ? "APPLIED" : "DRY RUN"} - min gain ${MIN_GAIN}\n`);
console.log(`  units re-paired            : ${unitsChanged}`);
console.log(`  question cards moved       : ${cardsMoved}`);
console.log(`  units left alone (low gain): ${unitsSkipped}`);
console.log(`  files ${write ? "written" : "that would change"}     : ${filesChanged}`);
for (const s of samples) {
  console.log(`\n  ${s.where}  (gain ${s.gain.toFixed(2)})`);
  for (const [title, prompt] of s.ex) {
    console.log(`    ${title}`);
    console.log(`      ${String(prompt).slice(0, 76)}`);
  }
}
if (!write) console.log("\nRe-run with --write to apply.");
