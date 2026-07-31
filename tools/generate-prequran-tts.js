#!/usr/bin/env node
// Pre-generates the PreQuraan TRANSLITERATION EXPLAINER voice clips (English
// UI narration — NEVER used for Quranic/Arabic recitation, which stays human-
// recorded). One mp3 per letter explainer, named by the shell's cyrb53 hash of
// the normalized text so course-app's staticVoiceUrl() finds them offline —
// required because the Bunny-hosted app cannot reach the Moodle TTS endpoint.
//
// Output: src/prototypes/quraan-academy/prequran/tts/<hash>.mp3
// Deploy: upload-prequran-to-bunny.js ships the folder to
//         media/prequran/g00/audio/tts/  (the shell's static voice path).
//
// Requires ELEVENLABS_API_KEY in .env (same voice/model as the Ehel clips).
// Usage: node tools/generate-prequran-tts.js [--dry]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UNIT = path.join(ROOT, "src", "prototypes", "quraan-academy", "prequran", "grade-0", "data", "units", "unit-1.json");
const OUT_DIR = path.join(ROOT, "src", "prototypes", "quraan-academy", "prequran", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";
const DRY = process.argv.includes("--dry");

for (const line of fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/) : []) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.trim().startsWith("#")) {
    const key = line.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = line.slice(eq + 1).trim();
  }
}

// EXACT replica of course-app.js cyrb53 + staticVoiceKey normalization.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
const voiceKey = (text) => cyrb53(String(text || "").replace(/\s+/g, " ").trim());

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
  const unit = JSON.parse(fs.readFileSync(UNIT, "utf8"));
  // Every English explainer that the app speaks: transliteration + word.
  const texts = [];
  for (const l of unit.letters) {
    if (l.transliteration && l.transliteration.explainer) texts.push(l.transliteration.explainer);
    if (l.word && l.word.explainer) texts.push(l.word.explainer);
    if (l.writing && l.writing.explainer) texts.push(l.writing.explainer);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let generated = 0, reused = 0, chars = 0;
  for (const text of texts) {
    const file = path.join(OUT_DIR, `${voiceKey(text)}.mp3`);
    if (fs.existsSync(file)) { reused += 1; continue; }
    chars += text.length;
    if (DRY) { console.log(`  would synth [${voiceKey(text)}] ${text.slice(0, 70)}…`); generated += 1; continue; }
    fs.writeFileSync(file, await tts(text));
    generated += 1;
    console.log(`  [${generated}] ${path.basename(file)}`);
  }
  console.log(`explainers: ${texts.length} | generated: ${generated} (${chars} chars) | reused: ${reused}${DRY ? " [DRY]" : ""}`);
})();
