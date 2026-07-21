#!/usr/bin/env node
// Pre-generates ElevenLabs narration for the Science course as static
// files, one per Listen button, named by cyrb53(text) so the UI
// (science/shared/course-ui.js) finds them at ./media/audio/tts/<hash>.mp3.
//
// The hash and text-normalisation MUST stay byte-for-byte identical to the UI.
// Idempotent (existing >1 KB files reused) and resumable. Reports characters
// sent (ElevenLabs bills per character) and stops at an optional --budget cap.
//
// Usage:
//   node tools/generate-ehel-science-audio.js [category ...] [grade ...] [--dry] [--budget N] [--force]
//   categories: concepts explorations visualModels methods workedExamples realProblems
//   (default = concepts workedExamples realProblems — the highest-value set)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MATH = path.join(ROOT, "src", "prototypes", "ehel-academy", "science");
const OUT_DIR = path.join(MATH, "media", "audio", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

const ALL_CATS = ["concepts", "explorations", "visualModels", "methods", "workedExamples", "realProblems"];
const args = process.argv.slice(2);
const cats = args.filter((a) => ALL_CATS.includes(a));
const catList = cats.length ? cats : ["concepts", "workedExamples", "realProblems"];
const grades = args.filter((a) => /^[1-8]$/.test(a)).map(Number);
const gradeList = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];
const dry = args.includes("--dry");
const force = args.includes("--force");
const budgetArg = args.indexOf("--budget");
const budget = budgetArg >= 0 ? Number(args[budgetArg + 1]) : Infinity;

function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadDotEnv();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// cyrb53 — identical to the copy in science/shared/course-ui.js.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();

// The exact strings each Listen button narrates — must match course-ui.js.
function textsForUnit(unit, category) {
  switch (category) {
    case "concepts": return (unit.concepts || []).map((c) => `${c.title}. ${c.explanation}. Example: ${c.example}`);
    case "explorations": return (unit.explorations || []).map((e) => `${e.title}. ${e.context}. ${e.explanation}`);
    case "visualModels": return (unit.visualModels || []).map((m) => `${m.title}. ${m.purpose}`);
    case "methods": return (unit.methods || []).map((m) => `${m.title}. Example: ${m.example}. ${(m.steps || []).join(" ")}`);
    case "workedExamples": return (unit.workedExamples || []).map((w) => `${w.title}. ${w.prompt}. Solution: ${w.solution}`);
    case "realProblems": return (unit.realProblems || []).map((p) => `${p.context}. ${p.prompt}`);
    default: return [];
  }
}

async function tts(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (check .env).");
  const r = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: { stability: 0.62, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true } }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return Buffer.from(await r.arrayBuffer());
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // De-dup by hash across the whole run (same text on different pages → one file).
  const seen = new Set();
  const queue = [];
  for (const grade of gradeList) {
    const dir = path.join(MATH, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of catList) {
        for (const raw of textsForUnit(unit, cat)) {
          const c = clean(raw);
          if (c.length < 8) continue;
          const key = cyrb53(c);
          if (seen.has(key)) continue;
          seen.add(key);
          queue.push({ key, text: c, chars: c.length });
        }
      }
    }
  }
  const totalChars = queue.reduce((s, q) => s + q.chars, 0);
  console.log(`categories: ${catList.join(",")} | grades: ${gradeList.join(",")}`);
  console.log(`unique clips: ${queue.length} | total characters: ${totalChars.toLocaleString()}${dry ? " (DRY RUN)" : ""}`);
  if (dry) return;

  let sent = 0, made = 0, reused = 0;
  for (const item of queue) {
    const out = path.join(OUT_DIR, `${item.key}.mp3`);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 1000) { reused += 1; continue; }
    if (sent + item.chars > budget) { console.log(`\nBudget cap ${budget.toLocaleString()} reached — stopping (spent ${sent.toLocaleString()}).`); break; }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        process.stdout.write(`${item.key} (${item.chars} chars)… `);
        fs.writeFileSync(out, await tts(item.text));
        sent += item.chars; made += 1; ok = true;
        console.log("ok");
      } catch (e) { console.log(`retry ${attempt}: ${e.message.slice(0, 70)}`); await sleep(1500 * attempt); }
    }
    await sleep(350);
  }
  console.log("\n──────── summary ────────");
  console.log(`generated: ${made} | reused: ${reused} | characters sent: ${sent.toLocaleString()}`);
})();
