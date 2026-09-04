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
const MODEL_ID = "eleven_multilingual_v2";

const narration = require("./lib/ehel-intensive-narration");
const { DELIVERIES } = require("./lib/ehel-tts");
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
// --delivery <name>: which voice of the shared presets (tools/lib/ehel-tts.js
// DELIVERIES) to record with. Unlike English, this course has no per-clip
// `source`/`audioRevision` field — the app derives the filename live as
// cyrb53(displayed text) — so a re-voice under a different delivery OVERWRITES
// the existing clip at its existing name rather than minting a new one. That
// is a deliberate, owner-approved trade for this course: Bunny's edge can keep
// serving a previously-cached listener the old voice for up to a year (no
// purge key in .env), which the English course avoids by renaming instead.
// An unknown name is refused rather than defaulted, for the same reason as the
// English generator: a typo here would re-record a whole run in the wrong
// voice, in place, with no old copy kept.
const deliveryArg = args.indexOf("--delivery");
const delivery = deliveryArg >= 0 ? args[deliveryArg + 1] : "standard";
if (!Object.prototype.hasOwnProperty.call(DELIVERIES, delivery)) {
  console.error(`Unknown --delivery "${delivery}". Known: ${Object.keys(DELIVERIES).join(", ")}`);
  process.exit(2);
}
const { voiceId: DELIVERY_VOICE, settings: DELIVERY_SETTINGS } = DELIVERIES[delivery];
// --only <hash1,hash2,...>: narrate just these hashes, for resuming a run that
// stopped partway (this generator has no retry-on-429 of its own, unlike
// tools/lib/ehel-tts.js's tts(), so a rate limit ends the process rather than
// backing off). Implies --force, the same as English's --only-file — the only
// reason to name specific hashes is to redo them.
const onlyArg = args.indexOf("--only");
const only = onlyArg >= 0 ? new Set(args[onlyArg + 1].split(",").map((s) => s.trim()).filter(Boolean)) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A 429 ("system_busy") is ElevenLabs' own capacity, not this request's fault,
// and it stopped a --force --delivery alice run cold at 4,075/4,972 with
// nothing to distinguish "genuinely wrong" clips from "just unlucky" ones.
// Retried with backoff, up to 5 tries; every other status still fails fast, as
// before.
async function speak(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (check .env).");
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const r = await fetch(`${API_BASE}/text-to-speech/${DELIVERY_VOICE}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: DELIVERY_SETTINGS,
      }),
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status !== 429 || attempt === 5) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await sleep(2000 * attempt);
  }
  throw new Error("unreachable");
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

  const queue = only ? speakable.filter((c) => only.has(c.hash))
    : force ? speakable : speakable.filter((c) => {
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
