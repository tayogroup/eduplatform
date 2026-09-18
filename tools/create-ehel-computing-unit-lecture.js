#!/usr/bin/env node
/* Build a unit lecture video for one Computing standalone lesson.
 *
 *   node tools/create-ehel-computing-unit-lecture.js --app src/prototypes/ehel-academy/computing/grade-1-app --slug computers-everywhere --dry
 *   node tools/create-ehel-computing-unit-lecture.js --app ... --slug ... --preview   # stills, nothing bought
 *   node tools/create-ehel-computing-unit-lecture.js --app ... --slug ... --draft     # whole film, free OS voice
 *   node tools/create-ehel-computing-unit-lecture.js --app ... --slug ...             # renders; BUYS narration
 *
 * Cloned from tools/create-ehel-math-unit-lecture.js, which was cloned from
 * the science tool: the timeline, the audio, the frames and the mux are the
 * same code. Read science/grade-4-app/lecture-video/README.md before running
 * it without --dry, --preview or --draft - a real render bills ElevenLabs per
 * character, and every free mode exists so that nothing is bought until the
 * script and the pictures are settled.
 *
 * WHAT IS DIFFERENT HERE
 *
 * The art is drawn fresh, as in the maths film. The Grade 1 lesson draws its
 * machines as HTML and emoji inside interactive renderers (computing.js), so
 * there is no pure drawing to lift out and check the way the science film
 * lifts its skeleton. tools/lib/ehel-computing-lecture-scenes.js redraws the
 * same things - the lesson's tablet and its six programs, its eight inputs
 * and outputs, its hidden computers and its robots - in the lesson's own
 * dark palette.
 *
 * The outputs are named by their CONTENT: <slug>.<first 8 of sha1>.mp4, and
 * the same for the .vtt and the .jpg. The CDN keeps a media path for a year,
 * so a re-render under the old name would never reach a learner who had
 * played the old one (mathematics/grade-4-app/lecture-video/README.md, "New
 * names for a new render"). Naming by hash from the first render means there
 * is no rename step to forget. A --draft render adds ".draft" to all three
 * names, and the Computing kit's builder refuses any film whose name says
 * draft, so a free placeholder cannot be wired into a lesson by accident.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FONT_DIR = path.join(ROOT, "src/prototypes/ehel-academy/shared/fonts");
const SCENES_JS = path.join(__dirname, "lib/ehel-computing-lecture-scenes.js");
const FILM_CSS = path.join(__dirname, "lib/ehel-computing-lecture-film.css");

/* the platform voice, and the same slower, teacher-like settings as the
   science and maths films (owner's ear, 2026-09-17). One course should not
   sound different from another for no reason. */
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
   clip. It is the science film's measured rate for this voice and these
   settings (2026-09-17), which the maths film's real render bore out. */
const CHARS_PER_SECOND = 13.96;

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

/* An argument this tool does not know is refused before anything else runs:
   a typo of --dry or --preview must not fall through to a paid render. */
const KNOWN = new Set(["app", "slug", "dry", "preview", "draft", "calibrate", "limit-seconds"]);
for (const a of process.argv.slice(2)) {
  if (!a.startsWith("--")) continue;
  const name = a.slice(2).split("=")[0];
  if (!KNOWN.has(name)) {
    console.error(`REFUSED: unknown option --${name}. Known: ${[...KNOWN].map((k) => "--" + k).join(" ")}`);
    process.exit(1);
  }
}

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
   PowerShell): free, so the whole timed film can be watched before anything
   is bought. It is cached SEPARATELY from the real voice (its own directory,
   its own hash tag, .wav not .mp3), so a later run without --draft never
   mistakes a free placeholder for a bought clip. */
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

function vttText(beats) {
  const cues = beats.map((b, i) => {
    const end = b.start + b.dur;
    return `${i + 1}\n${vttTime(b.start)} --> ${vttTime(end)}\n${balance(b.say)}\n`;
  });
  return "WEBVTT\n\n" + cues.join("\n");
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

/* ------------------------------------------------ content-hashed names --- */
const sha8 = (file) => crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);

/* Move a finished file into lecture-video/ under <slug>[.draft].<hash>.<ext>.
   An existing file of that name has the same bytes by construction, so it is
   left alone rather than rewritten. */
function publish(tmp, outDir, slug, ext, draft) {
  const name = `${slug}${draft ? ".draft" : ""}.${sha8(tmp)}.${ext}`;
  const dest = path.join(outDir, name);
  if (!fs.existsSync(dest)) fs.copyFileSync(tmp, dest);
  return name;
}

/* ---------------------------------------------------------------- main --- */
(async function main() {
  loadEnv();
  const app = arg("app", "src/prototypes/ehel-academy/computing/grade-1-app");
  const slug = arg("slug", "computers-everywhere");
  const dry = has("dry");
  const appDir = path.resolve(ROOT, app);
  const board = path.join(appDir, "lecture-video", `${slug}.json`);
  if (!fs.existsSync(board)) die(`no storyboard at ${board}`);
  const film = JSON.parse(fs.readFileSync(board, "utf8"));

  /* --limit-seconds N: keep only as many whole beats, from the start, as fit
     in about N seconds of speech, always at least one. For smoke-testing the
     pipeline cheaply, never for a film anyone is meant to watch. */
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
    path.join(os.tmpdir(), "ehel-computing-lecture", slug);
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
    const est = chars / CHARS_PER_SECOND + 0.42 * flat.length + LEAD + TAIL + OPEN_HOLD + END_HOLD +
      GAP_BEAT * (flat.length - film.scenes.length) + GAP_SCENE * (film.scenes.length - 1);
    console.log(`  estimated length ${Math.floor(est / 60)}:${String(Math.round(est % 60)).padStart(2, "0")}`);
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
  if (errs.length) die("the page threw while loading:\n" + errs.slice(0, 5).join("\n"));

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
    console.log(`  ${beats.length + cardShots.length} preview stills (both cards included) in ${shots}`);
    console.log(`  estimated ${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, "0")} ` +
      `at ${CHARS_PER_SECOND} characters a second.`);
    return;
  }

  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });
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

  /* ---- mux, into scratch first; lecture-video/ receives hashed names ---- */
  const tmpMp4 = path.join(scratch, `${slug}.mp4`);
  run("ffmpeg", ["-y",
    "-framerate", String(FPS), "-i", path.join(frameDir, "%05d.png"),
    "-i", trackPath,
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart", "-shortest", tmpMp4], { stdio: ["ignore", "ignore", "pipe"] });

  const tmpVtt = path.join(scratch, `${slug}.vtt`);
  fs.writeFileSync(tmpVtt, vttText(beats), "utf8");

  const tmpJpg = path.join(scratch, `${slug}.jpg`);
  const posterAt = Math.min(beats[1] ? beats[1].start + 0.8 : 2.2, total - 0.5);
  run("ffmpeg", ["-y", "-ss", posterAt.toFixed(2), "-i", tmpMp4, "-frames:v", "1",
    "-q:v", "3", tmpJpg], { stdio: ["ignore", "ignore", "pipe"] });

  const outDir = path.join(appDir, "lecture-video");
  const names = {
    src: publish(tmpMp4, outDir, slug, "mp4", draft),
    captions: publish(tmpVtt, outDir, slug, "vtt", draft),
    poster: publish(tmpJpg, outDir, slug, "jpg", draft)
  };
  const size = fs.statSync(path.join(outDir, names.src)).size;
  console.log(`\n  ${names.src}  ${(size / 1048576).toFixed(2)} MB  ${duration(path.join(outDir, names.src)).toFixed(2)}s`);
  console.log(`  ${names.captions}  ${beats.length} cues`);
  console.log(`  ${names.poster}`);
  if (draft) {
    console.log("\n  DRAFT: the free OS voice. The Computing kit refuses a film named .draft, so this cannot be wired into a lesson.");
  } else {
    console.log("\n  For LESSON[\"video\"] and app.config.json extraPages:");
    for (const k of ["src", "captions", "poster"]) console.log(`    "${k}": "lecture-video/${names[k]}"`);
  }
})();
