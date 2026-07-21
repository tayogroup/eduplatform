#!/usr/bin/env node
// Generates ElevenLabs narration for the unified English course and wires the
// audio hooks into the unit JSONs.
//
// Idempotent: existing mp3s (>1 KB) are reused, so runs are resumable and safe
// to re-run. Reports characters sent (ElevenLabs bills per character) so cost
// is visible.
//
// Usage:
//   node tools/generate-ehel-english-audio.js <category> [grade ...] [--dry] [--limit N] [--force]
//   category = readings | grammar | speaking
//   e.g. node tools/generate-ehel-english-audio.js readings 1
//        node tools/generate-ehel-english-audio.js readings 1 2 3 --limit 5
//        node tools/generate-ehel-english-audio.js readings --dry   (estimate only)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENGLISH = path.join(ROOT, "src", "prototypes", "ehel-academy", "english");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

// --- args ---
const args = process.argv.slice(2);
const category = args.find((a) => /^(readings|grammar|speaking)$/.test(a)) || "readings";
const grades = args.filter((a) => /^[1-8]$/.test(a)).map(Number);
const gradeList = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];
const dry = args.includes("--dry");
const force = args.includes("--force");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;

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

// Clean text for narration: strip emoji/boilerplate, collapse whitespace.
function narration(value) {
  return String(value || "")
    .replace(/🤖|💡|📚|✨|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\(?\s*Ask your AI Tutor[^)]*\)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// What to narrate for each category.
function itemsForUnit(unit, grade) {
  const gid = String(grade).padStart(2, "0");
  const dir = `media/audio/grade-${grade}/${category}`;
  if (category === "readings") {
    return (unit.readings || []).map((r) => ({
      id: r.readingId, ref: r, title: r.title,
      text: narration(r.passageScript),
      source: `./${dir}/${r.readingId}.mp3`,
      output: path.join(ENGLISH, dir, `${r.readingId}.mp3`),
    }));
  }
  if (category === "grammar") {
    return (unit.grammar || []).map((g) => ({
      id: g.grammarId, ref: g, title: g.title,
      text: narration(`${g.title}. ${g.explanation} ${g.ruleAndExamples || ""}`),
      source: `./${dir}/${g.grammarId}.mp3`,
      output: path.join(ENGLISH, dir, `${g.grammarId}.mp3`),
    }));
  }
  // speaking
  return (unit.speaking || []).map((s) => ({
    id: s.speakingId, ref: s, title: s.title,
    text: narration(s.instructionsAndModelLines),
    source: `./${dir}/${s.speakingId}.mp3`,
    output: path.join(ENGLISH, dir, `${s.speakingId}.mp3`),
  }));
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
  let charsSent = 0, generated = 0, reused = 0, skipped = 0, charsTotal = 0, count = 0;
  const dirtyFiles = new Map(); // filePath -> unit object

  for (const grade of gradeList) {
    const unitsDir = path.join(ENGLISH, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(unitsDir)) continue;
    for (const file of fs.readdirSync(unitsDir).filter((f) => f.endsWith(".json")).sort()) {
      const filePath = path.join(unitsDir, file);
      const unit = JSON.parse(fs.readFileSync(filePath, "utf8"));
      let changed = false;
      for (const item of itemsForUnit(unit, grade)) {
        if (!item.text || item.text.length < 8) { skipped += 1; continue; }
        charsTotal += item.text.length;
        if (count >= limit) continue;

        const exists = fs.existsSync(item.output) && fs.statSync(item.output).size > 1000;
        if (dry) { count += 1; continue; }
        if (exists && !force) {
          reused += 1;
          if (!item.ref.audio?.available) { item.ref.audio = { source: item.source, provider: "ElevenLabs", voiceId: VOICE_ID, available: true }; changed = true; }
          continue;
        }
        fs.mkdirSync(path.dirname(item.output), { recursive: true });
        let ok = false;
        for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
          try {
            process.stdout.write(`g${grade} ${category} ${item.id} (${item.text.length} chars)… `);
            const buf = await tts(item.text);
            fs.writeFileSync(item.output, buf);
            charsSent += item.text.length; generated += 1; count += 1; ok = true;
            item.ref.audio = { source: item.source, provider: "ElevenLabs", voiceId: VOICE_ID, available: true };
            changed = true;
            console.log(`ok ${(buf.length / 1024).toFixed(0)} KB`);
          } catch (e) {
            console.log(`retry ${attempt}: ${e.message.slice(0, 80)}`);
            await sleep(1500 * attempt);
            if (attempt === 3) { console.log(`  FAILED ${item.id}`); }
          }
        }
        await sleep(350); // gentle rate limit
      }
      if (changed) dirtyFiles.set(filePath, unit);
    }
  }

  for (const [filePath, unit] of dirtyFiles) fs.writeFileSync(filePath, `${JSON.stringify(unit, null, 2)}\n`);

  console.log("\n──────── summary ────────");
  console.log(`category: ${category} | grades: ${gradeList.join(",")}${dry ? " (DRY RUN)" : ""}`);
  if (dry) {
    console.log(`items to narrate: ${count} | total characters: ${charsTotal.toLocaleString()}`);
    console.log(`(ElevenLabs bills per character; ~${charsTotal.toLocaleString()} credits for a full run)`);
  } else {
    console.log(`generated: ${generated} | reused: ${reused} | skipped(too short): ${skipped}`);
    console.log(`characters sent this run: ${charsSent.toLocaleString()}`);
    console.log(`unit JSONs updated: ${dirtyFiles.size}`);
  }
})();
