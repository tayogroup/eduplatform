#!/usr/bin/env node
// Pre-generates ElevenLabs narration for the Computing course as static files,
// one per Listen button, named by cyrb53(text) so the UI
// (computing/shared/course-ui.js) finds them at ./media/audio/tts/<hash>.mp3.
//
// The hash and text-normalisation MUST stay byte-for-byte identical to the UI.
// One different character means a different hash: the app then requests a file
// that was never written, silently falls back to the paid runtime endpoint, and
// the clip is money spent on a file nobody serves. check-computing-audio-
// coverage.mjs is the gate on that.
//
// Idempotent (existing >1 KB files reused) and resumable. Reports characters
// sent (ElevenLabs bills per character) and stops at an optional --budget cap.
//
// Usage:
//   node tools/generate-ehel-computing-audio.js [category ...] [grade ...] [--dry] [--budget N] [--force]
//   categories: see ALL_CATS below (default = every one, so no Listen button
//   is left falling back to the runtime endpoint)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COMPUTING = path.join(ROOT, "src", "prototypes", "ehel-academy", "computing");
const OUT_DIR = path.join(COMPUTING, "media", "audio", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

const narration = require("./lib/ehel-computing-narration");
const ALL_CATS = narration.CATEGORIES;
const args = process.argv.slice(2);
const cats = args.filter((a) => ALL_CATS.includes(a));
const catList = cats.length ? cats : ALL_CATS;
// Stages are read off disk, not hard-coded: a new stage pack used to be
// silently ignored here — "8" did not match the range, so the argument was
// dropped and the run quietly covered 1-7 instead of failing.
const STAGES = fs.readdirSync(COMPUTING)
  .map((entry) => /^grade-(\d+)$/.exec(entry))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .sort((a, b) => a - b);
const grades = args.filter((a) => /^\d+$/.test(a)).map(Number);
const unknown = grades.filter((g) => !STAGES.includes(g));
if (unknown.length) {
  console.error(`No content package for stage(s) ${unknown.join(", ")}. Available: ${STAGES.join(", ")}.`);
  process.exit(2);
}
const gradeList = grades.length ? grades : STAGES;
const dry = args.includes("--dry");
const force = args.includes("--force");
// --orphans lists clips on disk that no current Listen button asks for. They
// appear whenever the content changes under an already-generated set (a builder
// fix, a returned review), and they are dead weight in the deploy: the app can
// never request them again. --prune deletes them. Both need the full grade list
// to be meaningful, so a narrowed run refuses rather than reporting every other
// stage's clips as orphaned.
const orphansOnly = args.includes("--orphans");
const prune = args.includes("--prune");
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

// cyrb53 — identical to the copy in computing/shared/course-ui.js.
// Hash, normalisation and the exact text of every Listen button live in
// tools/lib/ehel-computing-narration.js so the pruner agrees with what is bought.
const { cyrb53, clean, spokenText, textsForUnit, textsForCapstone } = narration;

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
    const dir = path.join(COMPUTING, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of catList) textsForUnit(unit, cat).forEach(enqueue);
    }
    const capstoneFile = path.join(COMPUTING, `grade-${grade}`, "data", "grade-capstone.json");
    if (fs.existsSync(capstoneFile)) {
      const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
      for (const cat of catList) textsForCapstone(capstone, cat).forEach(enqueue);
    }
  }
  if (orphansOnly) {
    if (cats.length || grades.length) {
      console.error("--orphans needs the whole catalogue: drop the category/grade arguments.");
      process.exitCode = 2;
      return;
    }
    const wanted = new Set(queue.map((q) => q.key));
    const onDisk = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".mp3"));
    const orphans = onDisk.filter((f) => !wanted.has(path.basename(f, ".mp3")));
    const bytes = orphans.reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, f)).size, 0);
    console.log(`clips wanted by the current content: ${wanted.size}`);
    console.log(`clips on disk: ${onDisk.length} | orphaned: ${orphans.length} (${(bytes / 1048576).toFixed(1)} MB)`);
    for (const f of orphans.slice(0, 20)) console.log(`   ${f}`);
    if (orphans.length > 20) console.log(`   … and ${orphans.length - 20} more`);
    if (!prune) { console.log(orphans.length ? "\nRe-run with --prune to delete them." : ""); return; }
    for (const f of orphans) fs.unlinkSync(path.join(OUT_DIR, f));
    console.log(`\nDeleted ${orphans.length} orphaned clip(s).`);
    return;
  }

  const totalChars = queue.reduce((s, q) => s + q.chars, 0);
  const already = queue.filter((q) => fs.existsSync(path.join(OUT_DIR, `${q.key}.mp3`))
    && fs.statSync(path.join(OUT_DIR, `${q.key}.mp3`)).size > 1000);
  const toSend = queue.length - (force ? 0 : already.length);
  const charsToSend = force ? totalChars : queue
    .filter((q) => !already.includes(q))
    .reduce((s, q) => s + q.chars, 0);
  console.log(`categories: ${catList.join(",")} | grades: ${gradeList.join(",")}`);
  console.log(`unique clips: ${queue.length} | total characters: ${totalChars.toLocaleString()}`);
  console.log(`already on disk: ${already.length} | to generate: ${toSend} | characters to send: ${charsToSend.toLocaleString()}${dry ? "  (DRY RUN — nothing sent)" : ""}`);
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
