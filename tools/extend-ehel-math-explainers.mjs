// Recover the concept prose the old Mathematics builder never emitted.
//
// Two separate losses came out of build-ehel-math-runtime.js:
//   1. teaching text clipped at 520 characters  -> repair-ehel-math-truncation.mjs
//   2. `body.slice(0, 2)` — only the first two paragraphs of a concept were
//      used at all. 3,889 of 5,803 source paragraphs (67%) never reached a unit.
//
// This handles (2). The builder is already fixed, but these units cannot be
// rebuilt: they carry hand-authored concepts, outcomes and corrections that
// exist nowhere else. So a concept is only extended when its current text is
// still byte-for-byte what the old builder produced from the source — proof
// that nobody has edited it. Anything reworded by hand is left untouched.
//
//   node tools/extend-ehel-math-explainers.mjs [--write] [grade ...]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const modelPath = path.join(root, "outputs", "019f6433-3b5b-7513-8de4-dfd68b782812", "math-content-model.json");
const mathRoot = path.join(root, "src", "prototypes", "ehel-academy", "mathematics");

const args = process.argv.slice(2);
const write = args.includes("--write");
const onlyGrades = args.filter((a) => /^\d+$/.test(a)).map(Number);

const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));
const tidy = (value = "") => String(value).replace(/�/g, "–").replace(/\s+/g, " ").trim();
const paragraphs = (values = []) => values.map(tidy).filter(Boolean).join("\n\n");

// Mirrors conceptList() in build-ehel-math-runtime.js so the expected text is
// exactly what a rebuild would now produce.
function sourceConcepts(grade, unit) {
  const pkg = model.grades[String(grade)];
  if (!pkg) return [];
  const lesson = pkg.documents.find((d) => d.unit === unit && d.document_type === "Lesson");
  if (!lesson) return [];
  const starts = lesson.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => /^Concept\s+\d+\s*:/i.test(tidy(block.text)));
  return starts.map(({ block, index }, position) => {
    const end = starts[position + 1]?.index
      ?? lesson.blocks.findIndex((item, itemIndex) => itemIndex > index && /^Guided Practice/i.test(tidy(item.text)));
    const body = lesson.blocks.slice(index + 1, end > index ? end : index + 9)
      .map((item) => tidy(item.text))
      .filter((text) => text.length > 35 && !/Ask Your AI Tutor|Remember/i.test(text));
    const hasSpare = body.length > 2;
    return {
      title: tidy(block.text).replace(/^Concept\s+\d+\s*:\s*/i, ""),
      body,
      explanation: paragraphs(hasSpare ? body.slice(0, -1) : body),
      example: tidy(hasSpare ? body[body.length - 1] : (body[1] || body[0] || "")),
    };
  });
}

// True when `current` is still generated text: it matches the first k source
// paragraphs joined the way either the old builder or the truncation repair
// would have joined them.
function isUntouched(current, body) {
  const value = tidy(current);
  for (let k = 1; k <= body.length; k += 1) {
    const slice = body.slice(0, k);
    if (value === tidy(slice.join(" ")) || value === tidy(slice.join("\n\n"))) return true;
  }
  return false;
}

const stats = { files: 0, changed: 0, concepts: 0, extended: 0, skippedEdited: 0, noSource: 0, charsAdded: 0 };
const skippedSamples = [];

const gradeDirs = fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort();
for (const gradeDir of gradeDirs) {
  const grade = Number(gradeDir.split("-")[1]);
  if (onlyGrades.length && !onlyGrades.includes(grade)) continue;
  const unitsDir = path.join(mathRoot, gradeDir, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;

  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    stats.files += 1;
    const unitNo = unit.unit?.unitNo ?? Number((file.match(/unit-(\d+)/) || [])[1]);
    const source = sourceConcepts(grade, unitNo);
    let fileChanges = 0;

    for (const concept of unit.concepts || []) {
      stats.concepts += 1;
      const match = source.find((s) => tidy(s.title) === tidy(concept.title));
      if (!match || match.body.length <= 2) { stats.noSource += 1; continue; }
      if (match.explanation.length <= tidy(concept.explanation).length) { stats.noSource += 1; continue; }

      if (!isUntouched(concept.explanation, match.body)) {
        stats.skippedEdited += 1;
        if (skippedSamples.length < 8) skippedSamples.push(`${gradeDir}/${file}: "${concept.title}"`);
        continue;
      }
      const before = concept.explanation.length + String(concept.example || "").length;
      concept.explanation = match.explanation;
      // Only re-point the example if it is still generated text too; a
      // hand-written example stays exactly as the author left it.
      if (isUntouched(concept.example, match.body) || match.body.includes(tidy(concept.example))) {
        concept.example = match.example;
      }
      stats.charsAdded += concept.explanation.length + String(concept.example || "").length - before;
      stats.extended += 1;
      fileChanges += 1;
    }

    if (fileChanges) {
      stats.changed += 1;
      if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8");
    }
  }
}

console.log(`${write ? "EXTENDED" : "DRY RUN"} — ${stats.files} unit files, ${stats.concepts} concepts`);
console.log(`  extended with the full source body : ${stats.extended}`);
console.log(`  skipped, edited by hand            : ${stats.skippedEdited}`);
console.log(`  nothing more in source             : ${stats.noSource}`);
console.log(`  files ${write ? "written" : "that would change"}          : ${stats.changed}`);
console.log(`  teaching text recovered            : ${stats.charsAdded.toLocaleString()} chars`);
if (skippedSamples.length) {
  console.log("\n  hand-edited concepts left untouched:");
  for (const s of skippedSamples) console.log(`    ${s}`);
}
if (!write) console.log("\nRe-run with --write to apply.");
