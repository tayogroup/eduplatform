#!/usr/bin/env node
/* Build a unit lecture video for one Mathematics standalone lesson.
 *
 *   node tools/create-ehel-math-unit-lecture.js --app src/prototypes/ehel-academy/mathematics/grade-4-app --slug shape-and-measures --dry
 *   node tools/create-ehel-math-unit-lecture.js --app ... --slug ...            # renders
 *
 * WHAT IS DIFFERENT FROM THE SCIENCE LECTURE TOOL
 * (tools/create-ehel-science-unit-lecture.js, which this is cloned from and
 * borrows its timeline/audio/render structure from almost line for line):
 * that one slices its skeleton and arm verbatim out of science.js and REFUSES
 * to render if the sliced art no longer matches the lesson's own function,
 * because both are pure DOM-free functions. Grade 4 Maths' solids, angle
 * wedge, symmetry lines and grids live inside c-shape-slides.js as small
 * closures that read and write module-level state and $("id").innerHTML in
 * the same breath - there is nothing to slice out and re-run headless. So
 * this tool carries NO art-extraction step and NO drift check: every shape
 * tools/lib/ehel-math-lecture-scenes.js draws is redrawn fresh, matching the
 * lesson's own numbers and dark theme, but not lifted from its code. Owner
 * decision, 2026-09-18 - see the lecture-video README for the fuller account.
 *
 * THE ANIMATION IS TIMED FROM THE VOICE, exactly as the science film's is.
 * Every beat is narrated first, ffprobed, and the timeline is built from the
 * measured lengths. Clips are cached by a hash of (voice, model, text): a
 * visual change re-renders for nothing and only edited narration is re-bought.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FONT_DIR = path.join(ROOT, "src/prototypes/ehel-academy/shared/fonts");
const SCENES_JS = path.join(__dirname, "lib/ehel-math-lecture-scenes.js");
const FILM_CSS = path.join(__dirname, "lib/ehel-math-lecture-film.css");

/* the platform voice, and the same slower/teacher-like settings the science
   lecture builder settled on (owner's ear, 2026-09-17) - one course should
   not sound different from another for no reason */
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = {
  stability: 0.60, similarity_boost: 0.82, style: 0.18,
  use_speaker_boost: true, speed: 0.88
};

const FPS = 30;
const W = 1280, H = 720;
const LEAD = 0.8, TAIL = 1.6, GAP_BEAT = 0.22, GAP_SCENE = 0.5;
const OPEN_HOLD = 3.6, END_HOLD = 5.0;
/* Only --preview and --calibrate use this; a real render measures every
   clip. Starts as the science film's own measured rate (same voice, same
   settings) and MUST be re-measured with --calibrate for this script before
   it is trusted - re-use across scripts is a starting estimate, not a fact. */
const CHARS_PER_SECOND = 13.96;   /* carried from the science film's 2026-09-17 measurement - re-measure with --calibrate */

/* ---------------------------------------------------------------- args --- */
function arg(name, fallback) {
  const a = process.argv.slice(2);
  const eq = a.find((x) => x.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = a.indexOf(`--${name}`);
  if (i >= 0 && a[i + 1] && !a[i + 1].startsWith("--")) return a[i + 1];
  return fallback;
}
const has = (name) => process.argv.slice(2).includes(`--${name}`);

function die(msg) { console.error("REFUSED: " + msg); process.exit(1); }

function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function run(cmd, args, opts) {
  const r = spawnSync(cmd, args, Object.assign({ encoding: "utf8", maxBuffer: 1 << 28 }, opts || {}));
  if (r.error) die(`${cmd} could not be run: ${r.error.message}`);
  if (r.status !== 0) die(`${cmd} exited ${r.status}\n${(r.stderr || "").slice(0, 1200)}`);
  return r.stdout;
}

/* --------------------------------------------------------------- audio ---
   --draft swaps ElevenLabs for the OS's own SAPI voice (System.Speech, via
   PowerShell) - free, so a full timed cut of the film can be watched before
   anything is bought. It is cached SEPARATELY from the real voice (its own
   directory, its own hash tag, .wav not .mp3), so a later run WITHOUT --draft
   never mistakes a free placeholder clip for a bought one, and buys every
   beat for real. Re-running the tool without --draft afterwards overwrites
   the same shape-and-measures.mp4/.vtt/.jpg with the real narration. */
function clipPath(cacheDir, text) {
  const draft = has("draft");
  const tag = draft ? "sapi-draft" : `${VOICE_ID}|${MODEL_ID}|${JSON.stringify(VOICE_SETTINGS)}`;
  const h = crypto.createHash("sha1").update(`${tag}|${text}`).digest("hex").slice(0, 16);
  return path.join(cacheDir, `${h}.${draft ? "wav" : "mp3"}`);
}

function speakSapi(text, out) {
  const txtPath = out.replace(/\.\w+$/, ".txt");
  fs.writeFileSync(txtPath, text, "utf8");
  const esc = (s) => s.replace(/'/g, "''");
  const script = [
    "Add-Type -AssemblyName System.Speech",
    "$t = [System.IO.File]::ReadAllText('" + esc(txtPath) + "')",
    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "$s.Rate = -2",
    "$s.SetOutputToWaveFile('" + esc(out) + "')",
    "$s.Speak($t)",
    "$s.Dispose()"
  ].join("; ");
  run("powershell", ["-NoProfile", "-NonInteractive", "-Command", script]);
  if (!fs.existsSync(out)) die(`SAPI produced no file for ${JSON.stringify(text.slice(0, 40))}`);
}

async function speak(text, out) {
  if (has("draft")) return speakSapi(text, out);
  const key = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!key) die("ELEVENLABS_API_KEY is not set, so there is no voice to render with.");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg", "xi-api-key": key },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS })
  });
  if (!res.ok) die(`ElevenLabs answered ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) die(`ElevenLabs returned ${buf.length} bytes for ${JSON.stringify(text.slice(0, 40))}.`);
  fs.writeFileSync(out, buf);
}

function duration(file) {
  const out = run("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file]);
  const v = parseFloat(out.trim());
  if (!isFinite(v) || v <= 0) die(`ffprobe read no duration from ${file}`);
  return v;
}

/* --------------------------------------------------------- the timeline --- */
function buildTimeline(film, durations) {
  const beats = [];
  let t = LEAD + OPEN_HOLD, k = 0;
  film.scenes.forEach((scene, si) => {
    scene.first = beats.length;
    scene.start = t;
    scene.beats.forEach((beat, bi) => {
      const dur = durations[k++];
      beats.push(Object.assign({}, beat, { scene: si, start: t, end: t + dur, dur }));
      t += dur + (bi + 1 < scene.beats.length ? GAP_BEAT : 0);
    });
    scene.end = t;
    if (si + 1 < film.scenes.length) t += GAP_SCENE;
  });
  const spokenEnd = t + TAIL;
  beats[beats.length - 1].end = spokenEnd;
  const total = spokenEnd + END_HOLD;
  film.cards = {
    open: { start: 0, end: LEAD + OPEN_HOLD },
    end: { start: spokenEnd, end: total }
  };
  return { beats, total };
}

/* ------------------------------------------------------------ captions --- */
const vttTime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${sec.toFixed(3).padStart(6, "0")}`;
};

function writeVtt(beats, out) {
  const cues = beats.map((b, i) => {
    const end = b.start + b.dur;
    const lines = balance(b.say);
    return `${i + 1}\n${vttTime(b.start)} --> ${vttTime(end)}\n${lines}\n`;
  });
  fs.writeFileSync(out, "WEBVTT\n\n" + cues.join("\n"), "utf8");
}

function balance(text) {
  const s = text.trim();
  if (s.length <= 42) return s;
  const words = s.split(" ");
  let best = 1, gap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length;
    if (Math.abs(a - b) < gap) { gap = Math.abs(a - b); best = i; }
  }
  return words.slice(0, best).join(" ") + "\n" + words.slice(best).join(" ");
}

/* ----------------------------------------------------------- the page --- */
function fontFace(file, family, weight) {
  const b64 = fs.readFileSync(path.join(FONT_DIR, file)).toString("base64");
  return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};` +
    `src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:block;}`;
}

function buildPage(film) {
  const fonts = [
    fontFace("AtkinsonHyperlegible-normal-400.woff2", "Atkinson Hyperlegible", "400"),
    fontFace("AtkinsonHyperlegible-normal-700.woff2", "Atkinson Hyperlegible", "700"),
    fontFace("Inter-normal-300-700.woff2", "Inter", "300 700")
  ].join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${film.title} - unit lecture</title>
<style>${fonts}</style>
<style>${fs.readFileSync(FILM_CSS, "utf8")}</style>
</head><body><div id="film"></div>
<script>window.FILM = ${JSON.stringify(film)};</script>
<script>${fs.readFileSync(SCENES_JS, "utf8")}</script>
</body></html>`;
}

/* ---------------------------------------------------------------- main --- */
(async function main() {
  loadEnv();
  const app = arg("app", "src/prototypes/ehel-academy/mathematics/grade-4-app");
  const slug = arg("slug", "shape-and-measures");
  const dry = has("dry");
  const appDir = path.resolve(ROOT, app);
  const board = path.join(appDir, "lecture-video", `${slug}.json`);
  if (!fs.existsSync(board)) die(`no storyboard at ${board}`);
  const film = JSON.parse(fs.readFileSync(board, "utf8"));

  /* --limit-seconds N: keep only as many whole beats, from the start, as fit
     in about N seconds of speech (same per-character estimate --preview
     uses), always at least one. For smoke-testing the pipeline - narration,
     timing, mux - cheaply, never for a film anyone is meant to watch end to
     end. */
  const limitSeconds = parseFloat(arg("limit-seconds", ""));
  if (isFinite(limitSeconds) && limitSeconds > 0) {
    let spent = 0, keptBeats = 0;
    for (const scene of film.scenes) {
      const kept = [];
      for (const beat of scene.beats) {
        if (spent >= limitSeconds) break;
        kept.push(beat);
        spent += beat.say.length / CHARS_PER_SECOND + 0.42;
      }
      scene.beats = kept;
      keptBeats += kept.length;
    }
    film.scenes = film.scenes.filter((s) => s.beats.length > 0);
    console.log(`  --limit-seconds ${limitSeconds}: trimmed to ${film.scenes.length} scene(s), ` +
      `${keptBeats} beat(s) (~${spent.toFixed(0)}s of speech).`);
  }

  const draft = has("draft");
  const scratch = process.env.CLAUDE_SCRATCH ||
    path.join(os.tmpdir(), "ehel-math-lecture", slug);
  const cacheDir = path.join(ROOT, ".cache", draft ? "ehel-lecture-audio-draft" : "ehel-lecture-audio");
  const frameDir = path.join(scratch, "frames");
  for (const d of [scratch, cacheDir, frameDir]) fs.mkdirSync(d, { recursive: true });
  if (draft) console.log("  --draft: narrating with the OS's own SAPI voice (free). Re-run without --draft to buy the real one.");

  const flat = [];
  film.scenes.forEach((s, si) => s.beats.forEach((b) => flat.push(Object.assign({ scene: si }, b))));

  /* ---- what the voice will cost ---- */
  const chars = flat.reduce((n, b) => n + b.say.length, 0);
  const fresh = flat.filter((b) => !fs.existsSync(clipPath(cacheDir, b.say)));
  const freshChars = fresh.reduce((n, b) => n + b.say.length, 0);
  console.log(`${film.title}: ${film.scenes.length} scenes, ${flat.length} beats, ${chars} characters.`);
  console.log(`  cached ${flat.length - fresh.length} clips; ${fresh.length} to ${draft ? "narrate" : "buy"} (${freshChars} characters).`);
  const missing = flat.filter((b) => !b.say || !b.say.trim());
  if (missing.length) die(`${missing.length} beat(s) have nothing to say.`);
  if (dry) {
    film.objectives.forEach(([c, t]) => {
      const seen = film.scenes.some((s) => (s.codes || []).includes(c));
      console.log(`  ${seen ? "covered" : "MISSING"}  ${c}  ${t.slice(0, 64)}`);
    });
    console.log("\n--dry: nothing was bought and nothing was rendered.");
    return;
  }

  /* --calibrate buys the three longest beats and reports what this voice
     actually does with them - see the science tool's own comment for why. */
  if (has("calibrate")) {
    const sample = flat.slice().sort((a, b) => b.say.length - a.say.length).slice(0, 3);
    let chars = 0, secs = 0;
    for (const b of sample) {
      const p = clipPath(cacheDir, b.say);
      if (!fs.existsSync(p)) await speak(b.say, p);
      const d = duration(p);
      chars += b.say.length; secs += d;
      console.log(`  ${String(b.say.length).padStart(4)} chars  ${d.toFixed(2)}s  ` +
        `${(b.say.length / d).toFixed(2)} c/s   ${JSON.stringify(b.say.slice(0, 46))}`);
    }
    const rate = chars / secs;
    console.log(`\n  measured ${rate.toFixed(2)} characters a second (CHARS_PER_SECOND is ${CHARS_PER_SECOND}).`);
    const speech = flat.reduce((n, b) => n + b.say.length, 0) / rate;
    const pad = LEAD + TAIL + OPEN_HOLD + END_HOLD + GAP_BEAT * (flat.length - film.scenes.length) + GAP_SCENE * (film.scenes.length - 1);
    const est = speech + pad;
    console.log(`  so ${flat.length} beats would run about ${Math.floor(est / 60)}:${String(Math.round(est % 60)).padStart(2, "0")}` +
      ` (${speech.toFixed(0)}s of speech + ${pad.toFixed(1)}s of pauses).`);
    return;
  }

  /* ---- narrate ---- */
  const preview = has("preview");
  const clips = [];
  let durations;
  if (preview) {
    durations = flat.map((b) => b.say.length / CHARS_PER_SECOND + 0.42);
    console.log("  --preview: durations ESTIMATED from character counts, no clip bought.");
  } else {
    for (let i = 0; i < flat.length; i++) {
      const p = clipPath(cacheDir, flat[i].say);
      if (!fs.existsSync(p)) {
        process.stdout.write(`  voice ${i + 1}/${flat.length} ... `);
        await speak(flat[i].say, p);
        console.log(draft ? "narrated" : "bought");
      }
      clips.push(p);
    }
    durations = clips.map(duration);
  }
  const { beats, total } = buildTimeline(film, durations);
  console.log(`  narration measured: ${total.toFixed(2)}s (${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, "0")})`);

  /* ---- the page ---- */
  film.beats = beats;
  film.total = total;
  const pagePath = path.join(scratch, "film.html");
  fs.writeFileSync(pagePath, buildPage(film), "utf8");

  /* ---- frames ---- */
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file:///" + pagePath.replace(/\\/g, "/"));
  await page.evaluate(() => document.fonts.ready);

  if (preview) {
    const shots = path.join(scratch, "preview");
    fs.rmSync(shots, { recursive: true, force: true });
    fs.mkdirSync(shots, { recursive: true });
    const cardShots = [
      ["00a-open", film.cards.open.start + 1.1],
      ["00b-open", film.cards.open.end - 0.5],
      ["99a-end", film.cards.end.start + 1.6],
      ["99b-end", film.cards.end.end - 0.4]
    ];
    for (const [name, at] of cardShots) {
      await page.evaluate((t) => window.EHEL_FILM.frame(t), at);
      await page.screenshot({ path: path.join(shots, `${name}.png`) });
    }
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i];
      await page.evaluate((t) => window.EHEL_FILM.frame(t), b.start + b.dur * 0.7);
      await page.screenshot({ path: path.join(shots, `${String(i + 1).padStart(2, "0")}-${film.scenes[b.scene].id}.png`) });
    }
    if (errs.length) die("the page threw while rendering:\n" + errs.slice(0, 5).join("\n"));
    await browser.close();
    console.log(`  ${beats.length + cardShots.length} preview stills (both cards included) in ${path.relative(ROOT, shots)}`);
    console.log(`  estimated ${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, "0")} ` +
      `at ${CHARS_PER_SECOND} characters a second - calibrate with --calibrate before trusting it.`);
    return;
  }

  const frames = Math.ceil(total * FPS);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.EHEL_FILM.frame(t), f / FPS);
    await page.screenshot({ path: path.join(frameDir, String(f).padStart(5, "0") + ".png") });
    if (f % 300 === 0 || f === frames - 1) {
      const pct = ((f + 1) / frames * 100).toFixed(1);
      const rate = (f + 1) / ((Date.now() - t0) / 1000);
      process.stdout.write(`\r  frames ${f + 1}/${frames} (${pct}%, ${rate.toFixed(1)}/s)   `);
    }
  }
  console.log("");
  if (errs.length) die("the page threw while rendering:\n" + errs.slice(0, 5).join("\n"));
  await browser.close();

  /* ---- audio ---- */
  const wavDir = path.join(scratch, "wav");
  fs.mkdirSync(wavDir, { recursive: true });
  const parts = [];
  const silence = (secs, tag) => {
    const p = path.join(wavDir, `sil-${tag}.wav`);
    run("ffmpeg", ["-y", "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`, "-t", secs.toFixed(3), p],
        { stdio: ["ignore", "ignore", "pipe"] });
    return p;
  };
  parts.push(silence(LEAD + OPEN_HOLD, "lead"));
  for (let i = 0; i < clips.length; i++) {
    const w = path.join(wavDir, `c${String(i).padStart(3, "0")}.wav`);
    run("ffmpeg", ["-y", "-i", clips[i], "-ar", "44100", "-ac", "2", w], { stdio: ["ignore", "ignore", "pipe"] });
    parts.push(w);
    const next = beats[i + 1];
    if (next) parts.push(silence(next.start - (beats[i].start + beats[i].dur), `g${i}`));
  }
  parts.push(silence(TAIL + END_HOLD, "tail"));

  const listFile = path.join(scratch, "audio.txt");
  fs.writeFileSync(listFile, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"), "utf8");
  const trackPath = path.join(scratch, "track.wav");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", trackPath],
      { stdio: ["ignore", "ignore", "pipe"] });

  /* ---- mux ---- */
  const outDir = path.join(appDir, "lecture-video");
  const outPath = path.join(outDir, `${slug}.mp4`);
  run("ffmpeg", ["-y",
    "-framerate", String(FPS), "-i", path.join(frameDir, "%05d.png"),
    "-i", trackPath,
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart", "-shortest", outPath], { stdio: ["ignore", "ignore", "pipe"] });

  writeVtt(beats, path.join(outDir, `${slug}.vtt`));

  const posterAt = Math.min(beats[1] ? beats[1].start + 0.8 : 2.2, total - 0.5);
  run("ffmpeg", ["-y", "-ss", posterAt.toFixed(2), "-i", outPath, "-frames:v", "1",
    "-q:v", "3", path.join(outDir, `${slug}.jpg`)], { stdio: ["ignore", "ignore", "pipe"] });

  const size = fs.statSync(outPath).size;
  console.log(`\n  ${path.relative(ROOT, outPath)}  ${(size / 1048576).toFixed(2)} MB  ${duration(outPath).toFixed(2)}s`);
  console.log(`  ${path.relative(ROOT, path.join(outDir, slug + ".vtt"))}  ${beats.length} cues`);
})();
