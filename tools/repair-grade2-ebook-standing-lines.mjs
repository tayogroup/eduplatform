#!/usr/bin/env node

// One-shot repair: lift any Grade 2 character whose feet fall below the frame.
//
// check-ebook-composition.mjs found 147 of them in the first draft. The cause is
// that the character kit multiplies the caller's `s` by ANIMAL_SCALE (2), so a
// figure drawn at s: 1.4 is 2.8x its local size and needs roughly 180px of
// headroom under its standing point — arithmetic that is invisible while you are
// writing `y: 940` in a page composition.
//
// It rewrites only the `y:` of an offending call, never `x` or `s`: the page
// composition is deliberate, and the fix wanted is "stand where you can be seen
// whole", not "be smaller".
//
// Idempotent: a call that already fits is left exactly as it is, so a second run
// reports 0. Run with --dry first.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "tools", "create-grade2-ebook-illustrations.js");
const dryRun = process.argv.includes("--dry");

// Local bottom extent of each character, before ANIMAL_SCALE. Same numbers the
// composition lint uses; they come from the drawing code's lowest drawn point
// (the ground-shadow ellipse, or the feet where there is no shadow).
const BOTTOM = { zuri: 64, kiki: 66, monkey: 75, zebra: 110, giraffe: 125, elephant: 98, ostrich: 129, donkey: 100, hen: 73, goat: 91, lulu: 26 };
const ANIMAL_SCALE = 2;
const FLOOR = 975; // where the lowest drawn pixel should land at the latest

const source = fs.readFileSync(target, "utf8");
const callRe = /\b(zuri|kiki|monkey|zebra|giraffe|elephant|ostrich|donkey|hen|goat|lulu)\(\{([^{}]*)\}\)/g;

let changed = 0;
let inspected = 0;
const report = [];

const repaired = source.replace(callRe, (whole, name, args) => {
  const y = args.match(/\by:\s*(-?[\d.]+)/);
  const s = args.match(/\bs:\s*(-?[\d.]+)/);
  if (!y) return whole;
  inspected += 1;
  const scale = (s ? Number(s[1]) : 1) * ANIMAL_SCALE;
  const bottom = Number(y[1]) + BOTTOM[name] * scale;
  if (bottom <= FLOOR) return whole;
  // Floor, not round: rounding up leaves the character a fraction of a pixel
  // below the limit, so the repair does not settle and a second run reports the
  // same placements again.
  const lifted = Math.floor(FLOOR - BOTTOM[name] * scale);
  changed += 1;
  report.push(`${name}: y ${y[1]} -> ${lifted} (was reaching ${Math.round(bottom)})`);
  return whole.replace(/\by:\s*-?[\d.]+/, `y: ${lifted}`);
});

if (dryRun) {
  for (const line of report) console.log(`  ${line}`);
  console.log(`${changed} of ${inspected} placements would be lifted.`);
} else {
  if (changed) fs.writeFileSync(target, repaired, "utf8");
  console.log(`Lifted ${changed} of ${inspected} placements in ${path.relative(root, target)}.`);
}
