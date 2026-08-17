#!/usr/bin/env node
// Applies the two batches of agent-authored text from the 2026-08-17 "content decisions"
// follow-up to the second proofread pass:
//   - real model texts for the 138 writing tasks whose modelText was rubric advice
//   - learner-facing explanations for the 167 comprehension items whose explanation
//     described the question type to a teacher instead of the answer to the child
// Source: <scratch>/models/grade-N-unit-M.out.json ({writingId: modelText}) and
// <scratch>/expl/grade-N-unit-M.out.json ({index-into-the-filtered-list: explanation}).
// The explanation files don't carry a stable id (comprehensionId was null in the source
// dump), so this re-derives the SAME filtered list the dump used and maps by position —
// loud if a unit's comprehension count or filter result has moved since the dump.
// Idempotent (a value already equal to the target counts as already-applied); loud on
// anything that doesn't match. Usage: node tools/apply-ehel-english-authored-20260817.js [--dry]

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const SCRATCH = "C:/Users/inawa/AppData/Local/Temp/claude/C--Users-inawa-Documents-eduplatform/fa3e291c-c6b2-4e7e-ab4f-756d3f8e5ab4/scratchpad";
const DRY = process.argv.includes("--dry");

const files = new Map();
function load(rel) {
  if (!files.has(rel)) { const raw = fs.readFileSync(path.join(ENGLISH, rel), "utf8"); files.set(rel, { raw, doc: JSON.parse(raw), dirty: false }); }
  return files.get(rel);
}
function serialise(doc, raw) {
  let text = JSON.stringify(doc, null, 2);
  if (/\\u[0-9a-f]{4}/.test(raw)) text = text.replace(/[-￿]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : "");
}
let applied = 0, already = 0; const failures = []; const staleModel = [], staleExpl = [];

// ---------------------------------------------------------------- model texts
{
  const dir = path.join(SCRATCH, "models");
  const outs = fs.readdirSync(dir).filter((f) => f.endsWith(".out.json"));
  for (const f of outs) {
    const m = /^grade-(\d)-unit-(\d+)\.out\.json$/.exec(f);
    if (!m) continue;
    const [, g, n] = m;
    const rel = `grade-${g}/data/units/unit-${n}.json`;
    const answers = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const u = load(rel).doc;
    for (const [writingId, modelText] of Object.entries(answers)) {
      const w = u.writing.find((x) => x.writingId === writingId);
      if (!w) { failures.push(`${rel}: writingId ${writingId} not found`); continue; }
      if (w.modelText === modelText) { already += 1; continue; }
      if (typeof modelText !== "string" || modelText.length < 15) { failures.push(`${rel} ${writingId}: authored text looks too short, skipped`); continue; }
      w.modelText = modelText; load(rel).dirty = true; applied += 1; staleModel.push(writingId);
      console.log(`✔ modelText ${writingId}`);
    }
  }
}

// ---------------------------------------------------------------- comprehension explanations
{
  const dir = path.join(SCRATCH, "expl");
  const outs = fs.readdirSync(dir).filter((f) => f.endsWith(".out.json"));
  const kind = /^.{0,70}\b(retrieval|inference|question|checks|tests|literal recall|recall item|anchored|selection|item)\b/i;
  for (const f of outs) {
    const m = /^grade-(\d)-unit-(\d+)\.out\.json$/.exec(f);
    if (!m) continue;
    const [, g, n] = m;
    const rel = `grade-${g}/data/units/unit-${n}.json`;
    const answers = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const u = load(rel).doc;
    const matches = u.comprehension.filter((c) => kind.test(String(c.explanation || "").trim()) && !/^A good answer/.test(c.explanation || ""));
    const expected = Object.keys(answers).length;
    if (matches.length !== expected) { failures.push(`${rel}: filtered list is now ${matches.length} items, authored file has ${expected} — re-dump and re-author this unit`); continue; }
    matches.forEach((c, i) => {
      const text = answers[String(i)];
      if (c.explanation === text) { already += 1; return; }
      if (typeof text !== "string" || text.length < 10) { failures.push(`${rel} item ${i} (${c.questionId}): authored text looks too short, skipped`); return; }
      c.explanation = text; load(rel).dirty = true; applied += 1; staleExpl.push(c.questionId);
      console.log(`✔ explanation ${c.questionId}`);
    });
  }
}

for (const [rel, f] of files) if (f.dirty && !DRY) fs.writeFileSync(path.join(ENGLISH, rel), serialise(f.doc, f.raw));
console.log(`\napplied ${applied}, already ${already}${DRY ? " (dry — nothing written)" : ""}`);
if (staleModel.length) console.log(`\nwriting task audio is NOT affected — modelText is never narrated.`);
if (staleExpl.length) console.log(`comprehension explanations are NOT narrated either — no audio staleness from this run.`);
if (failures.length) { console.log(`\n✗ ${failures.length} not applied:`); failures.forEach((x) => console.log("  " + x)); process.exit(1); }
