#!/usr/bin/env node
// Pre-generated "Teach me the activity" scripts for Grade/Stage 1.
//
// Owner decision 2026-08-20: for Grade 1 the Virtual teacher's opening reply
// — the framing of the activity on screen plus what is expected of the
// learner, then step 1 — is generated ONCE, narrated once, saved, and reused.
// A Grade 1 learner who taps "Teach me the activity" gets the stored text and
// clip instantly; only the steps after it are live. One script per
// (subject, Grade 1 unit, section), keyed by the section id the nav uses.
//
// The script is produced by the SAME prompt assembly production uses: the
// dev chat handler (tools/lib/wehel-dev-chat.js) is invoked in-process with
// the unit JSON (stripped by unitForTutor, exactly as the app sends it), the
// Virtual teacher mode, the section as sectionHint, and the combined chip
// message — so the stored reply is what the live tutor would have said, at
// the model the owner chose for authored content (claude-opus-5).
//
// Output: src/prototypes/ehel-academy/<subject>/grade-1/data/teacher-scripts.json
//   { version, model, units: { "<unitNo>": { "<sectionId>": { label, text, hash } } } }
// `hash` is cyrb53(text) — the clip's filename (generate-ehel-teacher-audio.js),
// so an edited script mints a new clip and the old one is an orphan, the way
// every other narrated course here works. Idempotent: an existing script is
// kept unless --force; --dry counts without calling the model.
//
// Usage:
//   node tools/generate-ehel-teacher-scripts.mjs --dry
//   node tools/generate-ehel-teacher-scripts.mjs [--subject science] [--unit 2] [--force] [--concurrency 3]

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const { createWehelChatHandler } = require("./lib/wehel-dev-chat.js");

// .env, the way the other generators read it.
for (const line of fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/) : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback; };
const DRY = flag("--dry");
const FORCE = flag("--force");
const ONLY_SUBJECT = opt("--subject", null);
const ONLY_UNIT = opt("--unit", null);
const ONLY_SECTION = opt("--section", null);
const CONCURRENCY = Number(opt("--concurrency", 3));
const MODEL = opt("--model", "claude-opus-5");

// The section rules, the combined chip message and the file locations are the
// ONE definition in tools/lib/ehel-teacher-scripts.js, shared with the
// narrator and the check tool so what is generated, voiced and proved never
// drift apart.
const { SUBJECTS, teachMessageFor, expectedScripts, scriptsFileFor, scriptHash } = require("./lib/ehel-teacher-scripts.js");

// wehel.js is a browser module — shim just enough for a side-effect-free
// import; unitForTutor is the exact projection the app sends, and
// outlineFromManifest the exact year outline.
globalThis.location = { hostname: "localhost", port: "4287", search: "", href: "http://localhost:4287/", origin: "http://localhost:4287" };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const wehel = await import(pathToFileURL(path.join(EHEL, "shell", "wehel.js")).href);
const { unitForTutor, outlineFromManifest } = wehel;

const handler = createWehelChatHandler({ apiKey: () => process.env.ANTHROPIC_API_KEY, model: () => MODEL });

// Drive the dev handler in-process: a request with an async body iterator and
// a response that captures the JSON.
function askTeacher(payload) {
  const body = JSON.stringify(payload);
  const req = { method: "POST", async *[Symbol.asyncIterator]() { yield body; } };
  return new Promise((resolve, reject) => {
    const res = {
      writeHead(status) { this.status = status; },
      end(text) {
        let parsed = {};
        try { parsed = JSON.parse(text); } catch { /* non-JSON */ }
        if (this.status >= 200 && this.status < 300 && parsed.ok && parsed.reply) resolve(parsed.reply);
        else reject(new Error(parsed.message || `HTTP ${this.status}`));
      },
    };
    handler(req, res).catch(reject);
  });
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let at = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (at < items.length) {
      const index = at++;
      results[index] = await fn(items[index], index);
    }
  }));
  return results;
}

let planned = 0, generated = 0, kept = 0, failed = 0;
for (const [subject, def] of Object.entries(SUBJECTS)) {
  if (ONLY_SUBJECT && subject !== ONLY_SUBJECT) continue;
  const outFile = scriptsFileFor(subject);
  const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : { version: 1, model: MODEL, units: {} };
  out.model = out.model || MODEL;
  const { manifest, expected } = expectedScripts(subject);
  const jobs = [];
  for (const item of expected) {
    if (ONLY_UNIT && String(item.unitNo) !== String(ONLY_UNIT)) continue;
    if (ONLY_SECTION && item.sectionId !== ONLY_SECTION) continue;
    planned += 1;
    const existing = out.units?.[item.unitNo]?.[item.sectionId];
    // A stored script is current only if it answered the ask the outline
    // produces TODAY: each entry records `ask` = hash of its message, so a
    // changed outline (or a failed regeneration that left the old text in
    // place) is regenerated exactly where it applies, and nothing else is
    // paid for twice. An entry without `ask` predates this and is stale.
    const ask = scriptHash(teachMessageFor(subject, item.sectionId, item.label, item.unit));
    if (existing?.text && existing.ask === ask && !FORCE) { kept += 1; continue; }
    jobs.push({ ...item, ask });
  }
  console.log(`${subject}: ${jobs.length} to generate, ${Object.values(out.units || {}).reduce((n, u) => n + Object.keys(u).length, 0)} already stored`);
  if (DRY || !jobs.length) continue;
  const outline = outlineFromManifest(manifest);
  await mapLimit(jobs, CONCURRENCY, async (job) => {
    try {
      const reply = await askTeacher({
        subject, subjectLabel: def.label, grade: 1, unitNo: job.unitNo, unitTitle: job.unitTitle,
        courseOutline: outline, unit: unitForTutor(job.unit), teachingLanguage: "english", channel: "text",
        mode: "virtual-teacher", sectionHint: job.label,
        // A section with an activity outline gets the complete walkthrough;
        // the rest keep the shorter opening until their outlines are written.
        messages: [{ role: "user", content: teachMessageFor(subject, job.sectionId, job.label, job.unit) }],
      });
      const text = String(reply).trim();
      out.units[job.unitNo] ||= {};
      out.units[job.unitNo][job.sectionId] = { label: job.label, text, hash: scriptHash(text), ask: job.ask };
      generated += 1;
      // Write after every script so a killed run loses nothing.
      fs.writeFileSync(outFile, `${JSON.stringify(out, null, 2)}\n`);
      console.log(`  ✓ ${subject} u${job.unitNo} ${job.sectionId} (${text.length} chars)`);
    } catch (error) {
      failed += 1;
      console.error(`  ✗ ${subject} u${job.unitNo} ${job.sectionId}: ${error.message}`);
    }
  });
}
console.log(`\n${DRY ? "DRY: " : ""}planned ${planned}, kept ${kept}, generated ${generated}, failed ${failed}`);
process.exit(failed ? 1 : 0);
