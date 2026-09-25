#!/usr/bin/env node
/**
 * Narration for a Professor Adow TVET lesson app.
 *
 * The lesson kit speaks with speechSynthesis, which is free and offline and
 * sounds like whatever voice the learner's browser happens to ship. This
 * renders the same lines once, in the school's own voice, and leaves the
 * browser voice in place as the fallback for anything not yet rendered.
 *
 * WHAT IT READS is the BUILT page, not the content source: `data-spoken`
 * is the line build.py worked out for each step and each Explain note, so
 * what is bought is exactly what a learner hears. Read the source instead
 * and you buy the lines you think are spoken.
 *
 * A BARE RUN COSTS NOTHING. `--narrate` is the only mode that spends money,
 * because in this repo a tool that bills per character and does something
 * useful with no arguments is how clips get bought by accident.
 *
 *   node tools/create-adow-lesson-narration.js --app <dir>            # dry: lists every line
 *   node tools/create-adow-lesson-narration.js --app <dir> --narrate  # BUYS what is missing
 *
 * Clips are content-addressed and cached: a line whose hash already has an
 * mp3 is never bought twice, so re-running after editing one line buys one
 * line. Delete the mp3 to re-buy it.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const VOICE_ID = "onwK4e9ZLuTAKqWW03F9";        /* Daniel - the voice of the halving-joint film */
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.45, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true };

function die(msg) { console.error("\n  " + msg + "\n"); process.exit(1); }

/* .env, read the same way the film tool reads it. */
function loadEnv() {
  const f = path.join(ROOT, ".env");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/* THE HASH IS DUPLICATED IN kit.js AND MUST STAY IDENTICAL. FNV-1a, 32-bit,
   8 hex characters. It is here rather than sha256 because the browser side
   has to run inside a click handler, and crypto.subtle is async - a sync
   hash keeps `voice.say` synchronous, which is what every caller expects.
   A disagreement between the two shows up as a clip that is bought and
   never played, so the verification step counts fallbacks rather than
   trusting that these two functions match. */
function normalise(t) { return String(t).replace(/\s+/g, " ").trim(); }
function hash(t) {
  let h = 0x811c9dc5;
  const s = normalise(t);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function unesc(s) {
  return s.replace(/&quot;/g, '"').replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

/* Every data-spoken on every built lesson page of the app. */
function collect(appDir) {
  const pages = fs.readdirSync(appDir)
    .filter((f) => f.endsWith(".html") && f !== "index.html")
    .map((f) => path.join(appDir, f));
  const seen = new Map();
  for (const p of pages) {
    const html = fs.readFileSync(p, "utf8");
    const re = /data-spoken="([^"]*)"/g;
    let m;
    while ((m = re.exec(html))) {
      const text = normalise(unesc(m[1]));
      if (text && !seen.has(hash(text))) seen.set(hash(text), { text, page: path.basename(p) });
    }
  }
  return seen;
}

/* RAW TTS IS NOT LEVELLED, and how loud it comes back varies by voice. The
   halving-joint film was muxed to -16 LUFS; clips left raw measured -24,
   which on the same site is the difference between a film you can hear and
   a lesson you cannot. Every clip is levelled to the same target as the
   film, so the school has one loudness rather than one voice at two. */
function level(file) {
  const tmp = file + ".raw.mp3";
  fs.renameSync(file, tmp);
  const r = require("child_process").spawnSync("ffmpeg", [
    "-y", "-v", "error", "-i", tmp,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-c:a", "libmp3lame", "-b:a", "128k", file,
  ]);
  if (r.status !== 0 || !fs.existsSync(file)) {
    fs.renameSync(tmp, file);   /* keep the clip we paid for, unlevelled */
    console.log("    (ffmpeg could not level this one; kept as rendered)");
    return;
  }
  fs.unlinkSync(tmp);
}

async function speak(text, outFile, key) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) die(`ElevenLabs refused (${res.status}): ${(await res.text()).slice(0, 300)}`);
  fs.writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
  level(outFile);
}

async function main() {
  const argv = process.argv.slice(2);
  const appArg = argv[argv.indexOf("--app") + 1];
  if (argv.indexOf("--app") === -1 || !appArg) die("--app <dir> is required, e.g. --app src/prototypes/professor-adow-tvet/carpentry/foundation-app");
  const buy = argv.includes("--narrate");

  const appDir = path.resolve(ROOT, appArg);
  if (!fs.existsSync(appDir)) die(`No such app: ${appDir}`);
  const outDir = path.join(appDir, "narration");

  const lines = collect(appDir);
  if (!lines.size) die("No data-spoken found. Build the app first, and check build.py emits it.");

  const chars = [...lines.values()].reduce((a, l) => a + l.text.length, 0);
  const missing = [...lines.entries()].filter(([h]) => !fs.existsSync(path.join(outDir, h + ".mp3")));
  const missChars = missing.reduce((a, [, l]) => a + l.text.length, 0);

  console.log(`\n  ${path.basename(appDir)}`);
  console.log(`  voice ${VOICE_ID} (Daniel), model ${MODEL_ID}`);
  console.log(`  ${lines.size} spoken lines, ${chars} characters in total`);
  console.log(`  ${missing.length} not yet rendered, ${missChars} characters  <- this is what a --narrate run buys\n`);

  if (!buy) {
    for (const [h, l] of lines) {
      const have = fs.existsSync(path.join(outDir, h + ".mp3")) ? "have" : " BUY";
      console.log(`  [${have}] ${h}  ${String(l.text.length).padStart(4)}c  ${l.text.slice(0, 84)}`);
    }
    console.log("\n  Nothing was bought. Add --narrate to render the lines marked BUY.\n");
    return;
  }

  loadEnv();
  const key = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!key) die("ELEVENLABS_API_KEY is not set, so there is no voice to render with.");
  fs.mkdirSync(outDir, { recursive: true });

  let n = 0;
  for (const [h, l] of missing) {
    n++;
    process.stdout.write(`  [${n}/${missing.length}] ${h} ${String(l.text.length).padStart(4)}c ... `);
    await speak(l.text, path.join(outDir, h + ".mp3"), key);
    console.log("done");
  }

  /* The manifest is what the page reads. It carries the text as well as the
     hash so a human can see what a clip says without playing it. */
  const manifest = {};
  for (const [h, l] of lines) {
    if (fs.existsSync(path.join(outDir, h + ".mp3"))) manifest[h] = { file: h + ".mp3", text: l.text };
  }
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  console.log(`\n  ${Object.keys(manifest).length} clips in ${path.relative(ROOT, outDir)}\n`);
}

main().catch((e) => die(e && e.stack ? e.stack : String(e)));
