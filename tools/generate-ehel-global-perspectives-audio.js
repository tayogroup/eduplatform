#!/usr/bin/env node
// Pre-generates ElevenLabs narration for the Global Perspectives course as
// static files, one per Listen button, named by cyrb53(text) so the UI
// (global-perspectives/shared/course-ui.js) finds them at
// ./media/audio/tts/<hash>.mp3.
//
// The hash and text-normalisation MUST stay byte-for-byte identical to the UI.
// They are held there by tools/check-global-perspectives-audio-coverage.mjs:
// one character of drift and the app requests a file that was never written,
// silently falls back to the paid runtime endpoint, and the clip is money spent
// on a file nobody is served.
//
// Idempotent (existing >1 KB files reused) and resumable. Reports characters
// sent — ElevenLabs bills per character — and stops at an optional --budget cap.
// ALWAYS --dry first.
//
// Usage:
//   node tools/generate-ehel-global-perspectives-audio.js [category ...] [grade ...] [--dry] [--budget N] [--force]
//   categories: overview, explainers, boxes, words (default = every one, so no
//   Listen button is left falling back to the runtime endpoint)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COURSE = path.join(ROOT, "src", "prototypes", "ehel-academy", "global-perspectives");
const OUT_DIR = path.join(COURSE, "media", "audio", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

const narration = require("./lib/ehel-global-perspectives-narration");
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

// An argument that is neither a category, a grade nor a flag is almost always a
// typo — and silently ignoring it means generating the DEFAULT set (every
// category, every grade) when the caller asked for one slice. At roughly a
// character per unit of billing, that mistake is expensive, so it stops here.
const known = new Set([...ALL_CATS, "--dry", "--force", "--budget"]);
const unknown = args.filter((a, i) => {
  if (known.has(a) || /^[1-8]$/.test(a)) return false;
  return !(budgetArg >= 0 && i === budgetArg + 1);
});
if (unknown.length) {
  console.error(`unknown argument(s): ${unknown.join(", ")}`);
  console.error(`categories: ${ALL_CATS.join(", ")} | grades: 1-8 | flags: --dry --force --budget N`);
  process.exit(2);
}

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

const { cyrb53, clean, MIN_CHARS, textsForUnit } = narration;

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
  // De-dup by hash across the whole run (same text on two pages → one file).
  const seen = new Set();
  const queue = [];
  const byCategory = new Map();
  const enqueue = (raw, category) => {
    const c = clean(raw);
    if (c.length < MIN_CHARS) return;
    const key = cyrb53(c);
    byCategory.set(category, (byCategory.get(category) || 0) + 1);
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ key, text: c, chars: c.length, category });
  };
  for (const grade of gradeList) {
    const dir = path.join(COURSE, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of catList) textsForUnit(unit, cat).forEach((t) => enqueue(t, cat));
    }
  }

  const totalChars = queue.reduce((s, q) => s + q.chars, 0);
  const alreadyHave = queue.filter((q) => {
    const out = path.join(OUT_DIR, `${q.key}.mp3`);
    return !force && fs.existsSync(out) && fs.statSync(out).size > 1000;
  });
  const toBuy = queue.filter((q) => !alreadyHave.includes(q));
  const buyChars = toBuy.reduce((s, q) => s + q.chars, 0);

  console.log(`categories: ${catList.join(",")} | grades: ${gradeList.join(",")}`);
  for (const cat of catList) {
    const perCat = queue.filter((q) => q.category === cat);
    console.log(`  ${cat.padEnd(11)} ${String(perCat.length).padStart(5)} clips  ${perCat.reduce((s, q) => s + q.chars, 0).toLocaleString().padStart(9)} chars`);
  }
  console.log(`unique clips: ${queue.length} | total characters: ${totalChars.toLocaleString()}`);
  console.log(`already on disk: ${alreadyHave.length} | to generate: ${toBuy.length} (${buyChars.toLocaleString()} chars billable)${dry ? "  ← DRY RUN, nothing sent" : ""}`);
  if (dry) return;

  let sent = 0, made = 0, reused = alreadyHave.length, failed = 0;
  for (const item of toBuy) {
    const out = path.join(OUT_DIR, `${item.key}.mp3`);
    if (sent + item.chars > budget) {
      console.log(`\nBudget cap ${budget.toLocaleString()} reached — stopping (spent ${sent.toLocaleString()}).`);
      break;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        process.stdout.write(`${item.key} (${item.chars} chars, ${item.category})… `);
        fs.writeFileSync(out, await tts(item.text));
        sent += item.chars; made += 1; ok = true;
        console.log("ok");
      } catch (e) {
        console.log(`retry ${attempt}: ${e.message.slice(0, 70)}`);
        await sleep(1500 * attempt);
      }
    }
    if (!ok) failed += 1;
    await sleep(350);
  }
  console.log("\n──────── summary ────────");
  console.log(`generated: ${made} | reused: ${reused} | failed: ${failed} | characters sent: ${sent.toLocaleString()}`);
  if (failed) process.exitCode = 1;
})();
