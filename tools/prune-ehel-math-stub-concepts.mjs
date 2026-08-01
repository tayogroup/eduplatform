// Drop concept cards too thin to teach from, in place.
//
// The builder padded short units with reference rules turned into concepts. In
// units that already had three or more real concepts this produced a one-line
// card restating what the learner just read — "Sequence Rule" (169 chars) right
// after "Number Sequences" (3,607 chars). The rule still appears in the
// reference panel, so nothing is lost by removing the duplicate card.
//
// Only `concept-rule-*` cards are considered, and only when the unit keeps at
// least three substantial concepts without them.
//
//   node tools/prune-ehel-math-stub-concepts.mjs [--write]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const write = process.argv.includes("--write");

const MIN_TEACHABLE = 300;
const removed = [];
let filesChanged = 0;

for (const gradeDir of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const concepts = unit.concepts || [];

    const keep = concepts.filter((concept) => {
      const isPad = String(concept.id || "").startsWith("concept-rule-");
      const isThin = String(concept.explanation || "").length < MIN_TEACHABLE;
      return !(isPad && isThin);
    });
    if (keep.length === concepts.length) continue;

    const substantial = keep.filter((c) => String(c.explanation || "").length >= MIN_TEACHABLE).length;
    if (keep.length < 3 || substantial < 3) continue;   // would leave the unit too thin

    for (const concept of concepts) {
      if (!keep.includes(concept)) removed.push(`${gradeDir}/${file}: "${concept.title}" (${String(concept.explanation || "").length} chars)`);
    }
    unit.concepts = keep;
    filesChanged += 1;
    if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
  }
}

console.log(`${write ? "PRUNED" : "DRY RUN"} — ${removed.length} stub concept(s) across ${filesChanged} file(s)`);
for (const line of removed) console.log(`   ${line}`);
if (!write) console.log("\nRe-run with --write to apply.");
