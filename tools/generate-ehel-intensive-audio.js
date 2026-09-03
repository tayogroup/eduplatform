#!/usr/bin/env node
// Pre-renders every Listen button in Ehel Intensive English to
// media/audio/tts/<cyrb53(text)>.mp3, the path the course reads in local dev.
//
// ElevenLabs bills per character, so --dry reports the exact bill before
// anything is sent and --budget N caps a run. Always --dry first.
//
//   node tools/generate-ehel-intensive-audio.js --dry
//   node tools/generate-ehel-intensive-audio.js [category ...] [level ...] [--dry] [--budget N] [--force]
//
// Categories: lecture readings grammar words wordSentences
//
// What each category narrates lives in lib/ehel-intensive-narration.js, which
// mirrors the voiceButton() calls in shell/subjects/intensive-english.js. It is
// the only definition — never restate a narrated string here.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COURSE = path.join(ROOT, "src", "prototypes", "ehel-academy", "intensive-english");
const OUT_DIR = path.join(COURSE, "media", "audio", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
// Same narrator as the other Ehel courses.
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

const narration = require("./lib/ehel-intensive-narration");
const ALL_CATS = narration.CATEGORIES;

// The key check below says "check .env" and nothing here read .env, so the
// generator refused to run on a machine that was correctly configured — the
// same loader every other tool in this pipeline already carries
// (generate-ehel-english-audio.js, prune-ehel-course-audio-on-bunny.js).
// An already-exported variable still wins, so a shell override behaves as before.
function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadDotEnv();

const args = process.argv.slice(2);
const cats = args.filter((a) => ALL_CATS.includes(a));
const catList = cats.length ? cats : ALL_CATS;
const levels = args.filter((a) => /^[1-5]$/.test(a)).map(Number);
const levelList = levels.length ? levels : [1, 2];
const dry = args.includes("--dry");
const force = args.includes("--force");
const budgetArg = args.indexOf("--budget");
const budget = budgetArg >= 0 ? Number(args[budgetArg + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function speak(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (check .env).");
  const r = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.62, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

function collect() {
  // Keyed by hash so a text shared by two units is one clip, bought once.
  const byHash = new Map();
  for (const level of levelList) {
    const unitDir = path.join(COURSE, `level-${level}`, "data", "units");
    if (!fs.existsSync(unitDir)) continue;
    const files = fs.readdirSync(unitDir)
      .filter((f) => /^unit-\d+\.json$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    for (const file of files) {
      const unit = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
      for (const clip of narration.clipsForUnit(unit, catList)) {
        // chars counts what is actually SENT (clip.spoken), which is what
        // ElevenLabs bills — not the displayed text the hash is keyed on.
        if (!byHash.has(clip.hash)) byHash.set(clip.hash, { ...clip, chars: clip.spoken.length });
      }
    }
  }
  return [...byHash.values()];
}

// A run of underscores is a fill-in-the-blank frame. It is right on the page —
// Level 1 teaches real forms, and "My name is ______." is exactly what the
// learner is asked to complete — but a voice given it either says nothing where
// the blank is or invents something. eng-g01 clips recorded from frames like
// this said "my name is Taken Seat"; this course's own L1 U1 speaking clip said
// "My name is Bai A'anmi", handing the learner a fabricated name in place of
// their own.
//
// So the frame is refused rather than narrated, and the fix is a spoken form
// beside the text (passageScriptSpeech / instructionsAndModelLinesSpeech in the
// authored source), which changes only what is sent to ElevenLabs. Refusing
// costs a Listen button; narrating costs money AND ships a clip that misteaches.
const BLANK_FRAME = /_{2,}/;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const all = collect();

  const blanked = all.filter((c) => BLANK_FRAME.test(c.text));
  const speakable = all.filter((c) => !BLANK_FRAME.test(c.text));

  const queue = force ? speakable : speakable.filter((c) => {
    const file = path.join(OUT_DIR, `${c.hash}.mp3`);
    // A truncated file from an interrupted run must not count as done.
    return !(fs.existsSync(file) && fs.statSync(file).size > 1000);
  });

  const byCat = {};
  for (const c of queue) {
    byCat[c.category] = byCat[c.category] || { n: 0, chars: 0 };
    byCat[c.category].n += 1;
    byCat[c.category].chars += c.chars;
  }
  const totalChars = queue.reduce((n, c) => n + c.chars, 0);

  console.log(`levels ${levelList.join(", ")} | categories: ${catList.join(", ")}`);
  console.log(`unique clips in course: ${all.length.toLocaleString()}`);
  console.log(`already on disk:        ${(speakable.length - queue.length).toLocaleString()}`);
  console.log("");
  console.log("category         clips     characters");
  for (const cat of catList) {
    const v = byCat[cat] || { n: 0, chars: 0 };
    console.log(`  ${cat.padEnd(14)} ${String(v.n).padStart(6)}  ${v.chars.toLocaleString().padStart(12)}`);
  }
  console.log("  " + "-".repeat(36));
  console.log(`  ${"TO GENERATE".padEnd(14)} ${String(queue.length).padStart(6)}  ${totalChars.toLocaleString().padStart(12)}${dry ? "   (DRY RUN — nothing sent)" : ""}`);

  // Named, never silent: a refusal that prints nothing is indistinguishable
  // from a clip nobody wanted, and these are the ones worth looking at.
  if (blanked.length) {
    console.log(`\nREFUSED — a fill-in-the-blank frame cannot be read aloud: ${blanked.length}`);
    for (const c of blanked) {
      console.log(`  [${c.category}] ${c.text.replace(/\s+/g, " ").slice(0, 90)}`);
    }
    console.log("  Give each a spoken form (passageScriptSpeech / instructionsAndModelLinesSpeech)");
    console.log("  in inputs/ehel-english-intensive-source/authored/, then rebuild and re-run.");
  }

  if (dry) return;
  if (!queue.length) { console.log("\nNothing to generate."); return; }

  let sent = 0;
  let made = 0;
  for (const item of queue) {
    if (sent + item.chars > budget) {
      console.log(`\nBudget cap ${budget.toLocaleString()} reached — stopping (spent ${sent.toLocaleString()}).`);
      break;
    }
    const file = path.join(OUT_DIR, `${item.hash}.mp3`);
    // Sent text, not displayed text: the filename is the hash of item.text
    // (what the button on the page shows and hashes itself), so that must
    // stay untouched — only what reaches the voice is transformed.
    const audio = await speak(item.spoken);
    // Written via a temp file so an interrupted run cannot leave a short mp3
    // that the next run mistakes for a finished clip.
    const tmp = `${file}.part`;
    fs.writeFileSync(tmp, audio);
    fs.renameSync(tmp, file);
    sent += item.chars;
    made += 1;
    if (made % 25 === 0) console.log(`  ${made}/${queue.length} clips | ${sent.toLocaleString()} chars`);
    await sleep(120);
  }
  console.log(`\nDone: ${made.toLocaleString()} clips, ${sent.toLocaleString()} characters.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
