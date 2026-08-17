// Apply the 2026-08-17 proofreading pass to the Mathematics course.
//
// Sixteen readers read every learner-facing string in all eight stages blind
// (docs/math-content-review-2026-08-17.md); every finding that survived
// verification is an entry in tools/repair-ehel-math-proofread-20260817-edits.json:
//
//   { "file": "grade-4/data/units/unit-3.json", "path": "workedExamples[2].solution",
//     "old": "<verbatim substring>", "new": "<replacement>" }
//
// The edit is applied to exactly that one field, one path, no more. An
// earlier version also propagated a fix to every OTHER string in the file
// holding an identical value, reasoning that the course copies each answer
// into practice/fluency/explorations/workedExamples/errorFeedback on purpose.
// That is true for an item's own copies, but Mathematics also reuses short
// generic text ("Work out 8 × 7.", "Find all the factors of 30.") as one-off
// filler across unrelated worked examples — a grade-4 unit-5 run chained
// three separate edits through that coincidence and left a "Find the HCF…"
// question keyed to an explanation about 8 × 7. Every genuine duplicate this
// review found (e.g. grade-2 unit-11's three-quarter-turn answer) is already
// listed as its own separate edit, one per copy, so nothing is lost by
// requiring that here too.
//
// A rule with "scope": "all" is a global substring rule applied to every
// learner-facing string in every file (used for the handful of classes that
// recur — "a dice", a hyphen used as a minus sign, US spellings).
//
// Idempotent and loud: an entry whose `old` is absent AND whose `new` is
// already present is counted as applied; one where neither is found FAILS the
// run, because that means the source moved and the correction would silently
// not ship. Runs as a dry run unless --write is passed.
//
// Note this rewrites narrated text: every affected clip is renamed by hash and
// has to be regenerated (tools/generate-ehel-math-audio.js), and the old ones
// pruned (tools/prune-ehel-course-audio.mjs mathematics).
//
//   node tools/repair-ehel-math-proofread-20260817.mjs [--write] [--edits <file>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mathRoot = path.join(here, "..", "src", "prototypes", "ehel-academy", "mathematics");
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const editsFile = argv.includes("--edits") ? argv[argv.indexOf("--edits") + 1] : path.join(here, "repair-ehel-math-proofread-20260817-edits.json");
const edits = JSON.parse(fs.readFileSync(editsFile, "utf8"));

// Never rewrite provenance or the adult-addressed guide by a global rule.
const GLOBAL_SKIP = new Set(["provenance", "reviewStatus", "generatedAt", "schemaVersion", "id", "outcomeId", "modelType", "questionId", "assessmentId", "sectionId", "gradeId", "unitId", "icon", "type", "kind", "media", "cambridge", "grownUpGuide", "sourceDocuments", "sourceArchive", "contentPackage"]);

const files = new Map(); // rel -> { json, eol, dirty }
function load(rel) {
  if (!files.has(rel)) {
    const abs = path.join(mathRoot, rel);
    const raw = fs.readFileSync(abs, "utf8");
    files.set(rel, { abs, json: JSON.parse(raw), eol: raw.includes("\r\n") ? "\r\n" : "\n", dirty: 0 });
  }
  return files.get(rel);
}
function allFiles() {
  const out = [];
  for (const g of fs.readdirSync(mathRoot).filter((n) => /^grade-\d+$/.test(n)).sort()) {
    const data = path.join(mathRoot, g, "data");
    for (const f of ["course-manifest.json", "grade-capstone.json", "placement-exam.json"]) if (fs.existsSync(path.join(data, f))) out.push(`${g}/data/${f}`);
    for (const f of fs.readdirSync(path.join(data, "units")).sort()) out.push(`${g}/data/units/${f}`);
  }
  return out;
}
function resolvePath(obj, p) {
  const parts = p.replace(/\[(\d+)\]/g, ".$1").split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i += 1) { node = node?.[parts[i]]; if (node == null) return null; }
  return { parent: node, key: parts[parts.length - 1] };
}
function visitStrings(node, fn, skip = false) {
  if (Array.isArray(node)) node.forEach((v, i) => { if (typeof v === "string") { const n = fn(v); if (n !== v) node[i] = n; } else visitStrings(v, fn, skip); });
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) {
    if (skip && GLOBAL_SKIP.has(k)) continue;
    if (typeof v === "string") { const n = fn(v); if (n !== v) node[k] = n; } else visitStrings(v, fn, skip);
  }
}

let applied = 0, already = 0, globalHits = 0;
const failures = [];
const samples = [];

for (const [i, e] of edits.entries()) {
  if (e.scope === "all") {
    const re = e.regex ? new RegExp(e.old, e.flags || "g") : null;
    for (const rel of allFiles()) {
      const f = load(rel);
      visitStrings(f.json, (s) => {
        const n = re ? s.replace(re, e.new) : s.split(e.old).join(e.new);
        if (n !== s) { globalHits += 1; f.dirty += 1; if (samples.length < 12) samples.push([rel, s, n]); }
        return n;
      }, true);
    }
    continue;
  }
  const f = load(e.file);
  const loc = resolvePath(f.json, e.path);
  if (!loc || typeof loc.parent[loc.key] !== "string") { failures.push(`#${i} ${e.file} ${e.path}: path does not resolve to a string`); continue; }
  const cur = loc.parent[loc.key];
  if (!cur.includes(e.old)) {
    if (cur.includes(e.new)) { already += 1; continue; }
    failures.push(`#${i} ${e.file} ${e.path}: old text not found — source moved. Field starts: ${JSON.stringify(cur.slice(0, 90))}`);
    continue;
  }
  const next = cur.split(e.old).join(e.new);
  loc.parent[loc.key] = next;
  applied += 1; f.dirty += 1;
  if (samples.length < 12) samples.push([e.file, cur, next]);
  // Deliberately NOT propagated to other fields holding the same string.
  // Mathematics reuses short generic text ("Work out 8 × 7.", "Find all the
  // factors of 30.") as one-off filler across unrelated worked examples and
  // methods, not only as the same answer duplicated across modules the way
  // English's narration or a single item's practice/fluency/explorations
  // copies are. A grade-4 unit-5 run found this the hard way: fixing
  // methods[0].example to a new example, then methods[2].example to another,
  // chained through three unrelated worked-example prompts and the unit's own
  // scored assessment question — leaving a "Find the HCF…" question keyed to
  // an explanation about 8 × 7. Genuine duplicate-answer cases (confirmed
  // present, e.g. grade-2 unit-11's three-quarter-turn answer) are already
  // listed as their own separate edit per copy in the source review, so
  // nothing is lost by not propagating.
}

if (failures.length) {
  console.error(`\n${failures.length} edit(s) could not be applied:\n  ${failures.join("\n  ")}`);
  process.exitCode = 1;
}
let filesChanged = 0;
for (const f of files.values()) {
  if (!f.dirty) continue;
  filesChanged += 1;
  if (write && !failures.length) fs.writeFileSync(f.abs, JSON.stringify(f.json, null, 2).split("\n").join(f.eol) + f.eol, "utf8");
}
console.log(`${write && !failures.length ? "APPLIED" : "DRY RUN"}${failures.length ? " (nothing written — fix the failures above)" : ""}`);
console.log(`  targeted edits applied : ${applied} (${already} already applied)`);
console.log(`  global-rule hits       : ${globalHits}`);
console.log(`  files changed          : ${filesChanged}`);
for (const [rel, before, after] of samples) {
  const at = [...before].findIndex((c, k) => c !== after[k]);
  console.log(`\n  ${rel}\n    -  …${before.slice(Math.max(0, at - 50), at + 60)}…\n    +  …${after.slice(Math.max(0, at - 50), at + 60)}…`);
}
if (!write) console.log("\nRe-run with --write to apply.");
