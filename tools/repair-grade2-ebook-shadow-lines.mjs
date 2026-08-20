#!/usr/bin/env node

// One-shot repair: put every cast shadow on the ground line of the character
// casting it.
//
// The shadow pages were written with the shadow at a hand-picked y ("about
// where the grass is"), and then repair-grade2-ebook-standing-lines.mjs lifted
// the characters to keep them in frame — leaving the shadows behind. A shadow
// that starts 120px below its owner's feet is not a shadow, it is a smear on
// the floor, and the whole book is about shadows.
//
// A character's ground line is not its y. The kit draws each figure's own
// contact shadow at local cy=56, under a transform of scale(s * ANIMAL_SCALE),
// so the ground is at y + 56 * 2 * s. That is the number a cast shadow has to
// match, and it is not one you would guess from the page source.
//
// Only a castShadow immediately followed (within a few lines) by a zuri call is
// touched, and it is matched by x: a shadow whose owner cannot be identified is
// REPORTED, never silently left or silently moved.
//
// Idempotent. Run with --dry first.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "tools", "create-grade2-ebook-illustrations.js");
const dryRun = process.argv.includes("--dry");
const GROUND_OFFSET = 56 * 2; // kit local shadow cy, times ANIMAL_SCALE

const lines = fs.readFileSync(target, "utf8").split("\n");
let changed = 0;
const unmatched = [];

for (let i = 0; i < lines.length; i += 1) {
  const shadow = lines[i].match(/castShadow\((-?[\d.]+), (-?[\d.]+),/);
  if (!shadow) continue;
  const shadowX = Number(shadow[1]);
  // The owner is the nearest zuri call in the same page literal, matched on x.
  let owner = null;
  for (let j = i + 1; j < Math.min(i + 6, lines.length); j += 1) {
    const call = lines[j].match(/zuri\(\{ x: (-?[\d.]+), y: (-?[\d.]+), s: ([\d.]+)/);
    if (call && Number(call[1]) === shadowX) { owner = { y: Number(call[2]), s: Number(call[3]) }; break; }
  }
  if (!owner) { unmatched.push(`line ${i + 1}: ${lines[i].trim()}`); continue; }
  const ground = Math.round(owner.y + GROUND_OFFSET * owner.s);
  if (Number(shadow[2]) === ground) continue;
  changed += 1;
  if (dryRun) console.log(`  line ${i + 1}: shadow y ${shadow[2]} -> ${ground}`);
  lines[i] = lines[i].replace(/castShadow\((-?[\d.]+), (-?[\d.]+),/, `castShadow($1, ${ground},`);
}

for (const line of unmatched) console.error(`  ! no owner found for ${line}`);
if (!dryRun && changed) fs.writeFileSync(target, lines.join("\n"), "utf8");
console.log(`${dryRun ? "Would move" : "Moved"} ${changed} shadow${changed === 1 ? "" : "s"} onto their owner's ground line.`);
if (unmatched.length) process.exit(1);
