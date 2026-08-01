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
//   categories: see ALL_CATS below (default = every one, so no Listen button
//   is left falling back to the runtime endpoint)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MATH = path.join(ROOT, "src", "prototypes", "ehel-academy", "science");
const OUT_DIR = path.join(MATH, "media", "audio", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

const narration = require("./lib/ehel-science-narration");
const ALL_CATS = narration.CATEGORIES;
const args = process.argv.slice(2);
const cats = args.filter((a) => ALL_CATS.includes(a));
const catList = cats.length ? cats : ALL_CATS;
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

const { cyrb53, clean } = narration;

// What each Listen button says, and what its clip is called, both live in
// tools/lib/ehel-science-narration.js so the uploader and pruner agree.
const { textsForUnit, textsForCapstone } = narration;

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
  const enqueue = (raw) => {
    const c = clean(raw);
    if (c.length < 8) return;
    const key = cyrb53(c);
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ key, text: c, chars: c.length });
  };
  for (const grade of gradeList) {
    const dir = path.join(MATH, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of catList) textsForUnit(unit, cat).forEach(enqueue);
    }
    const capstoneFile = path.join(MATH, `grade-${grade}`, "data", "grade-capstone.json");
    if (fs.existsSync(capstoneFile)) {
      const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
      for (const cat of catList) textsForCapstone(capstone, cat).forEach(enqueue);
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
