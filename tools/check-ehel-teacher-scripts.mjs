#!/usr/bin/env node
// The stored Grade 1 "Teach me the activity" scripts: every activity that
// should have one has one, each script's hash is the hash of the text the
// voice reads (so the app finds the clip), and each clip exists on disk.
// A script that falls out of either half is a Grade 1 learner who taps the
// chip and waits on the live path instead — which is the thing the owner
// asked not to happen (2026-08-20: generate, narrate, save, reuse).
//
// Run: node tools/check-ehel-teacher-scripts.mjs   (wired into check:wehel)

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { SUBJECTS, expectedScripts, scriptsFileFor, audioDirFor, scriptHash } = require("./lib/ehel-teacher-scripts.js");

const failures = [];
let total = 0;
for (const subject of Object.keys(SUBJECTS)) {
  const file = scriptsFileFor(subject);
  if (!fs.existsSync(file)) { failures.push(`${subject}: teacher-scripts.json is missing`); continue; }
  const scripts = JSON.parse(fs.readFileSync(file, "utf8"));
  const { expected } = expectedScripts(subject);
  const missing = [], badHash = [], noClip = [], empty = [];
  for (const item of expected) {
    total += 1;
    const entry = scripts.units?.[String(item.unitNo)]?.[item.sectionId];
    if (!entry) { missing.push(`u${item.unitNo}/${item.sectionId}`); continue; }
    if (!entry.text || entry.text.trim().length < 80) { empty.push(`u${item.unitNo}/${item.sectionId}`); continue; }
    const hash = scriptHash(entry.text);
    if (entry.hash !== hash) { badHash.push(`u${item.unitNo}/${item.sectionId}`); continue; }
    const clip = path.join(audioDirFor(subject), `${hash}.mp3`);
    if (!fs.existsSync(clip) || fs.statSync(clip).size < 1024) noClip.push(`u${item.unitNo}/${item.sectionId}`);
  }
  const list = (items) => `${items.slice(0, 6).join(", ")}${items.length > 6 ? ` …and ${items.length - 6} more` : ""}`;
  if (missing.length) failures.push(`${subject}: ${missing.length} activity(ies) have no stored script — ${list(missing)}`);
  if (empty.length) failures.push(`${subject}: ${empty.length} script(s) are empty or too short — ${list(empty)}`);
  if (badHash.length) failures.push(`${subject}: ${badHash.length} script(s) carry a hash that is not cyrb53 of their text — the app would ask for a clip that was never rendered — ${list(badHash)}`);
  if (noClip.length) failures.push(`${subject}: ${noClip.length} script(s) have no clip on disk — run generate-ehel-teacher-audio.js — ${list(noClip)}`);
}
if (!total) failures.push("No Grade 1 activities were enumerated — the section rules found nothing, which passes for the wrong reason");

if (failures.length) {
  console.error(`\n✗ teacher scripts: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}
console.log(`✓ teacher scripts: ${total} Grade 1 activities across ${Object.keys(SUBJECTS).length} subjects, every script present, hashed to its text, with a clip on disk`);
