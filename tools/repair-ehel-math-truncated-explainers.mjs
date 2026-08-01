// Complete the Exploration explainers that stop on a colon.
//
// Each exploration's "explanation" was built as "<title>: <context>", but the
// build clipped it, so 70 of them across Stages 2-8 end on a colon promising a
// list that never arrives — and they are narrated, so a learner hears
// "Here are the key relationships you must know by heart:" and then silence.
//
// Nothing here invents mathematics. Two shapes of damage, two repairs:
//
//   rebuild — the item's own "context" still holds the text the explanation is
//             missing, so the explanation is rebuilt from it.
//   trim    — the explanation already teaches its point and only the trailing
//             lead-in clause ("Let us begin with the shapes you know:") was left
//             dangling. That clause is dropped at the last complete sentence.
//
// Anything neither repair can finish is reported rather than guessed at.
//
//   node tools/repair-ehel-math-truncated-explainers.mjs [--write] [--grades 2-8]
//
// Runs as a dry run unless --write is passed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const rangeArg = argv[argv.indexOf("--grades") + 1];
const [lo, hi] = argv.includes("--grades") && /^\d-\d$/.test(rangeArg || "") ? rangeArg.split("-").map(Number) : [2, 8];

const isStub = (s) => /[:：]$/.test(String(s || "").trim()) || String(s || "").trim().length < 40;
const ENDS_CLEAN = /[.!?’”")]$/;
const tidy = (s) => String(s || "").replace(/\s+/g, " ").trim();

// Drop the trailing clause that promises a list, back to the last full sentence.
function trimDanglingClause(text) {
  const t = tidy(text);
  const cut = Math.max(t.lastIndexOf("."), t.lastIndexOf("!"), t.lastIndexOf("?"));
  if (cut <= 0) return null;
  const kept = t.slice(0, cut + 1).trim();
  // A title-only remainder ("Understanding Prisms:") is not an explainer.
  return kept.length >= 60 && !/[:：]$/.test(kept) ? kept : null;
}

function rebuildFromContext(title, context, current) {
  const c = tidy(context);
  if (!c) return null;
  const body = tidy(current).replace(/^[^:]*:\s*/, "");
  if (c.length <= body.length + 20) return null;
  if (/[:：]$/.test(c)) return null;
  const joined = `${tidy(title)}: ${c}`;
  return ENDS_CLEAN.test(joined) ? joined : `${joined}.`;
}

let rebuilt = 0, trimmed = 0, filesChanged = 0;
const unresolved = [];
const samples = [];

for (let g = lo; g <= hi; g += 1) {
  const unitsDir = path.join(mathRoot, `grade-${g}`, "data", "units");
  if (!fs.existsSync(unitsDir)) continue;
  for (const file of fs.readdirSync(unitsDir).filter((n) => n.endsWith(".json")).sort()) {
    const filePath = path.join(unitsDir, file);
    const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let dirty = false;
    for (const e of unit.explorations || []) {
      if (!isStub(e.explanation)) continue;
      const before = e.explanation;
      const viaContext = rebuildFromContext(e.title, e.context, e.explanation);
      const next = viaContext || trimDanglingClause(e.explanation);
      if (!next || next === before) { unresolved.push(`grade-${g}/${file} ${e.id}: ${tidy(before).slice(0, 100)}`); continue; }
      if (viaContext) rebuilt += 1; else trimmed += 1;
      if (samples.length < 5) samples.push([`grade-${g}/${file} ${e.id}`, viaContext ? "rebuild" : "trim", tidy(before), next]);
      e.explanation = next;
      dirty = true;
    }
    if (dirty) { filesChanged += 1; if (write) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`, "utf8"); }
  }
}

console.log(`${write ? "APPLIED" : "DRY RUN"} — grades ${lo}-${hi}\n`);
console.log(`  rebuilt from the item's own context : ${rebuilt}`);
console.log(`  trailing clause trimmed             : ${trimmed}`);
console.log(`  files touched                       : ${filesChanged}`);
console.log(`  could not be repaired mechanically  : ${unresolved.length}`);
for (const [where, how, before, after] of samples) {
  console.log(`\n  [${where}] ${how}`);
  console.log(`    -  ${before.slice(0, 150)}`);
  console.log(`    +  ${after.slice(0, 150)}`);
}
for (const u of unresolved) console.log(`\n  UNRESOLVED ${u}`);
if (!write) console.log("\nRe-run with --write to apply.");
