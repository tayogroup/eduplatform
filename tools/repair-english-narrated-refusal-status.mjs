#!/usr/bin/env node
// A descriptor that has a clip must not still say the clip was refused.
//
// The 2026-08-06 blank-frame refusal wrote
//   { available: false, status: "Refused - the script is a fill-in-the-blank frame; …" }
// onto 297 English descriptors. Re-narrating them flips `available` to true, and
// on the paths where generate-ehel-english-audio.js REPLACES the descriptor
// object (rather than calling an apply() that writes `status: "Generated"`) the
// stale status survives anyway: writeMerged() applies changed LEAVES onto the
// file on disk, and a key the generator dropped is not a changed leaf — it is a
// removal, which changedLeaves() does not emit.
//
// Nothing reads `status`, so this is not a rendering bug. It is a false record
// in shipped data, and it is the exact string that makes a working clip look
// like outstanding work — which is how these 297 came to sit unnoticed for
// thirteen days after the cause was fixed. "Generated" is the word every other
// write path in the generator uses for a fresh recording.
//
// Idempotent: only descriptors that are BOTH available and still refused are
// touched, so a second run reports zero.
//
// Usage:
//   node tools/repair-english-narrated-refusal-status.mjs --dry
//   node tools/repair-english-narrated-refusal-status.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const REFUSED = /fill-in-the-blank frame/;
const SHAPES = [["readings", "audio"], ["speaking", "audio"], ["writing", "audio"],
  ["activities", "audio"], ["grammar", "audio"], ["grammar", "practiceAudio"]];

const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== "--dry");
if (unknown.length) {
  console.error(`unknown argument(s): ${unknown.join(", ")}\nusage: node tools/repair-english-narrated-refusal-status.mjs [--dry]`);
  process.exit(2);
}
const dry = args.includes("--dry");

let fixed = 0, files = 0;
for (let grade = 1; grade <= 8; grade += 1) {
  const dir = path.join(ENGLISH, `grade-${grade}`, "data", "units");
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const file = path.join(dir, name);
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    let touched = 0;
    for (const [list, key] of SHAPES) {
      for (const item of data[list] || []) {
        const d = item[key];
        if (!d || d.available !== true || !REFUSED.test(String(d.status || ""))) continue;
        d.status = "Generated";
        touched += 1;
      }
    }
    if (!touched) continue;
    files += 1; fixed += touched;
    console.log(`  grade ${grade} ${name}: ${touched}`);
    if (!dry) fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  }
}
console.log(`\n${dry ? "would fix" : "fixed"} ${fixed} descriptor(s) in ${files} file(s)`);
