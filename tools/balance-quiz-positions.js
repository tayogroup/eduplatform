#!/usr/bin/env node
// Redistribute quiz answer positions in an authored intensive-English unit.
//
// The build gate rejects a unit when more than 40% of its answers sit in one
// position, because a learner who notices the pattern can score without reading.
// Authoring by hand drifts into clusters every time, so this does it mechanically.
//
// Deterministic: the same file in always produces the same file out. It assigns
// positions round-robin so the spread is as even as the item count allows, and
// it only ever swaps two options within a question, so no option text changes.
//
//   node tools/balance-quiz-positions.js inputs/.../authored/l2-u01.json
//   node tools/balance-quiz-positions.js --check inputs/.../authored/*.json

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const files = args.filter((a) => !a.startsWith("--"));

if (!files.length) {
  console.error("Usage: node tools/balance-quiz-positions.js [--check] <authored-unit.json>...");
  process.exit(1);
}

let failures = 0;

for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`missing: ${file}`); failures += 1; continue; }
  const unit = JSON.parse(fs.readFileSync(file, "utf8"));
  const quizzes = unit.quizzes || [];
  if (!quizzes.length) { console.log(`${path.basename(file)}: no quizzes`); continue; }

  const before = [0, 0, 0, 0];
  for (const q of quizzes) before[q.options.indexOf(q.a)] += 1;

  // Round-robin target positions, offset by unit number so consecutive units do
  // not all put answer 1 in position A.
  const offset = (Number(unit.unit) || 0) % 4;
  quizzes.forEach((q, i) => {
    const target = (i + offset) % q.options.length;
    const current = q.options.indexOf(q.a);
    if (current === target) return;
    const o = q.options;
    [o[current], o[target]] = [o[target], o[current]];
  });

  const after = [0, 0, 0, 0];
  for (const q of quizzes) after[q.options.indexOf(q.a)] += 1;

  const worst = Math.max(...after) / quizzes.length;
  const ok = quizzes.length < 5 || worst <= 0.4;
  const label = `${path.basename(file)}: [${before}] -> [${after}]  worst ${Math.round(worst * 100)}%`;

  if (checkOnly) {
    console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
    if (!ok) failures += 1;
    continue;
  }

  // Sanity: every answer must still be among its options after the swaps.
  for (const [n, q] of quizzes.entries()) {
    if (!q.options.includes(q.a)) {
      console.error(`${file}: quiz ${n + 1} lost its answer — refusing to write.`);
      process.exit(1);
    }
  }

  fs.writeFileSync(file, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failures += 1;
}

process.exit(failures ? 1 : 0);
