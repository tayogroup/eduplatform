// Apply the two safe classes of edit from the reviewed narration workbook
// (ehel-math-scripts-complete-reviewed_*.xlsx) to the Mathematics units.
//
//   1. solution-label — the committed data carries a literal "Solution: " at
//      the head of workedExamples.solution and methods.steps[0], and the app
//      adds its own label, so the learner reads (and hears) "Solution:
//      Solution: Name the place first". Strip the baked-in one.
//
//   2. punctuation — the reviewer replaced en-dashes with em-dashes to lengthen
//      the spoken pause, and normalised a few quotes. Applied only where the
//      workbook and our text are character-identical once dashes and quotes are
//      folded together, so no wording can change through this path.
//
// Deliberately NOT applied: rows where the workbook text is shorter than ours.
// The workbook was exported before commit 8f16bc4d3 repaired truncated content,
// so its long fields stop mid-sentence — ours are the complete ones.
//
// Grade 1 is excluded by default: its narration is generated from the current
// text, and editing it would orphan every clip already paid for.
//
//   node tools/apply-ehel-math-reviewed-edits.mjs <workbook.json> [--write] [--grades 2-8]
//
// <workbook.json> is the sheet dump: {"Grade 2": [[unit,category,id,title,text,comment], ...]}.
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const sheetFile = argv.find((a) => !a.startsWith("--"));
if (!sheetFile) { console.error("usage: apply-ehel-math-reviewed-edits.mjs <workbook.json> [--write] [--grades 2-8]"); process.exit(2); }
const rangeArg = argv[argv.indexOf("--grades") + 1];
const [lo, hi] = argv.includes("--grades") && /^\d-\d$/.test(rangeArg || "") ? rangeArg.split("-").map(Number) : [2, 8];

const sheets = JSON.parse(fs.readFileSync(sheetFile, "utf8"));
const SOLUTION_LABEL = /^\s*Solution:\s+/i;
// Characters the reviewer moved between. Folding them must never merge two
// genuinely different words, so the classes stay narrow.
const fold = (s) => s.replace(/[–—-]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const FOLDABLE = new Set([..."–—-‘’'“”\""]);

// Render a narrated item the way the workbook exporter did, but keep a map from
// every character of the rendered string back to the field it came from, so a
// punctuation fix can be written to the right place.
const TEMPLATES = {
  Concept: (it) => [["explanation", it.explanation], [null, " Example: "], ["example", it.example]],
  Exploration: (it) => [["context", it.context], [null, " "], ["explanation", it.explanation],
    [null, "\nDiscovery question: "], ["prompt", it.prompt], [null, "\nAnswer: "], ["answer", it.answer],
    [null, "\nHint: "], ["hint", it.hint]],
  "Visual Model": (it) => [["purpose", it.purpose]],
  Method: (it) => [[null, "Example: "], ["example", it.example], [null, "\nSteps: "],
    ...(it.steps || []).flatMap((s, i) => (i ? [[null, " | "], [`steps.${i}`, s]] : [[`steps.${i}`, s]]))],
  "Worked Example": (it) => [[null, "Prompt: "], ["prompt", it.prompt], [null, "\nSolution: "], ["solution", it.solution]],
  "Real Problem": (it) => [[null, "Context: "], ["context", it.context], [null, "\nPrompt: "], ["prompt", it.prompt],
    [null, "\nAnswer: "], ["answer", it.answer], [null, "\nError feedback: "], ["errorFeedback", it.errorFeedback]],
};
const POOLS = { Concept: "concepts", Exploration: "explorations", "Visual Model": "visualModels", Method: "methods", "Worked Example": "workedExamples", "Real Problem": "realProblems" };

// Collapse runs of whitespace exactly as the comparison does, recording for each
// surviving character which field it belongs to and its offset within that field.
function renderTraced(cat, item) {
  const out = [];
  let text = "";
  let pendingSpace = false;
  for (const [field, raw] of TEMPLATES[cat](item)) {
    const str = String(raw == null ? "" : raw);
    for (let i = 0; i < str.length; i += 1) {
      const ch = str[i];
      if (/\s/.test(ch)) { pendingSpace = text.length > 0; continue; }
      if (pendingSpace) { text += " "; out.push(null); pendingSpace = false; }
      text += ch;
      out.push(field ? { field, offset: i } : null);
    }
  }
  return { text: text.trim(), trace: out };
}
const normText = (t) => String(t == null ? "" : t).replace(/\s+/g, " ").trim();

const setField = (item, field, offset, ch) => {
  const m = field.match(/^steps\.(\d+)$/);
  if (m) { const i = Number(m[1]); item.steps[i] = item.steps[i].slice(0, offset) + ch + item.steps[i].slice(offset + 1); return; }
  item[field] = item[field].slice(0, offset) + ch + item[field].slice(offset + 1);
};

let labelsStripped = 0, punctChars = 0, punctFields = 0, filesChanged = 0;
const skipped = { shorter: 0, wording: 0, lengthMismatch: 0 };
const samples = [];

for (let g = lo; g <= hi; g += 1) {
  const rows = sheets[`Grade ${g}`];
  const unitsDir = path.join(mathRoot, `grade-${g}`, "data", "units");
  if (!rows || !fs.existsSync(unitsDir)) continue;
  const units = new Map();
  const load = (key) => {
    if (!units.has(key)) units.set(key, { file: path.join(unitsDir, `${key}.json`), data: JSON.parse(fs.readFileSync(path.join(unitsDir, `${key}.json`), "utf8")), dirty: false });
    return units.get(key);
  };

  // Pass 1 — strip the doubled label everywhere, independent of the workbook.
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json"))) {
    const rec = load(file.replace(".json", ""));
    for (const w of rec.data.workedExamples || []) {
      if (SOLUTION_LABEL.test(w.solution || "")) {
        if (samples.length < 4) samples.push([`grade-${g} ${file} ${w.id}.solution`, w.solution.slice(0, 80)]);
        w.solution = w.solution.replace(SOLUTION_LABEL, "");
        labelsStripped += 1; rec.dirty = true;
      }
    }
    for (const m of rec.data.methods || []) {
      (m.steps || []).forEach((s, i) => {
        if (SOLUTION_LABEL.test(s)) { m.steps[i] = s.replace(SOLUTION_LABEL, ""); labelsStripped += 1; rec.dirty = true; }
      });
    }
  }

  // Pass 2 — punctuation, only where nothing but dashes and quotes differ.
  for (const [unitKey, cat, id, , text] of rows) {
    if (!POOLS[cat]) continue;
    let rec;
    try { rec = load(unitKey); } catch { continue; }
    const item = (rec.data[POOLS[cat]] || []).find((x) => x && x.id === id);
    if (!item) continue;
    const { text: ours, trace } = renderTraced(cat, item);
    const theirs = normText(text);
    if (ours === theirs) continue;
    if (fold(ours) !== fold(theirs)) { (theirs.length < ours.length ? skipped.shorter++ : skipped.wording++); continue; }
    if (ours.length !== theirs.length) { skipped.lengthMismatch += 1; continue; }
    let touched = 0;
    for (let i = 0; i < ours.length; i += 1) {
      if (ours[i] === theirs[i]) continue;
      // Both sides must be in the fold set, or the fold was hiding real text.
      if (!FOLDABLE.has(ours[i]) || !FOLDABLE.has(theirs[i])) { touched = -1; break; }
      const at = trace[i];
      if (!at) { touched = -1; break; }   // difference sits in template glue
      setField(item, at.field, at.offset, theirs[i]);
      touched += 1;
    }
    if (touched > 0) { punctChars += touched; punctFields += 1; rec.dirty = true; }
  }

  for (const rec of units.values()) {
    if (!rec.dirty) continue;
    filesChanged += 1;
    if (write) fs.writeFileSync(rec.file, `${JSON.stringify(rec.data, null, 2)}\n`, "utf8");
  }
}

console.log(`${write ? "APPLIED" : "DRY RUN"} — grades ${lo}-${hi}\n`);
console.log(`  doubled "Solution:" labels stripped : ${labelsStripped}`);
console.log(`  punctuation characters changed      : ${punctChars} across ${punctFields} item(s)`);
console.log(`  files touched                       : ${filesChanged}`);
console.log(`\n  skipped — workbook text shorter than ours : ${skipped.shorter}`);
console.log(`  skipped — genuine wording difference      : ${skipped.wording}`);
console.log(`  skipped — folded but lengths differ       : ${skipped.lengthMismatch}`);
for (const [where, before] of samples) console.log(`\n  e.g. ${where}\n       was: ${before}…`);
if (!write) console.log("\nRe-run with --write to apply.");
