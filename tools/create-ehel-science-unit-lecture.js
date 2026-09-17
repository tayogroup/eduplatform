#!/usr/bin/env node
/* Build a unit lecture video for one Science standalone lesson.
 *
 *   node tools/create-ehel-science-unit-lecture.js --app src/prototypes/ehel-academy/science/grade-4-app --slug bones-and-muscles --dry
 *   node tools/create-ehel-science-unit-lecture.js --app ... --slug ...            # renders
 *
 * WHAT IS DIFFERENT FROM THE ENGLISH LECTURE TOOL
 * (tools/create-ehel-english-unit-lecture.py, which this borrows its TTS call
 * and its caption library from): that one renders still slides with PIL and
 * cuts between them. This renders a moving picture, because the two things a
 * Stage 4 child has to get out of this lesson - which bone is which, and a
 * pair of muscles taking turns - are the two things a still cannot show.
 *
 * THE ARTWORK IS THE LESSON'S OWN. The skeleton and the arm are sliced out of
 * science/lesson-kit/lib/science.js at render time and evaluated in the page,
 * so the video and the lesson cannot drift apart. armSvg() knows only three
 * poses, so armSvgAt() below tweens the same constants; its three endpoints
 * are compared with armSvg()'s own output character for character and the
 * build REFUSES on a mismatch. That check is the whole safety of the copy: if
 * somebody redraws the lesson's arm, this stops rather than quietly shipping
 * a video of an arm that is no longer in the lesson.
 *
 * THE ANIMATION IS TIMED FROM THE VOICE, not the other way round. Every beat
 * is narrated first, ffprobed, and the timeline is built from the measured
 * lengths - so a bone lights up as it is named however long that clip turned
 * out to be. Clips are cached by a hash of (voice, model, text): re-rendering
 * after a visual change costs nothing, and only edited narration is re-bought.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SCIENCE_JS = path.join(ROOT, "src/prototypes/ehel-academy/science/lesson-kit/lib/science.js");
const FONT_DIR = path.join(ROOT, "src/prototypes/ehel-academy/shared/fonts");
const SCENES_JS = path.join(__dirname, "lib/ehel-science-lecture-scenes.js");
const FILM_CSS = path.join(__dirname, "lib/ehel-science-lecture-film.css");

/* the platform voice - voice.js :: PLATFORM_VOICE, and the same settings the
   English lecture builder uses, so one course does not sound like another */
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.52, similarity_boost: 0.82, style: 0.24, use_speaker_boost: true };

const FPS = 30;
const W = 1280, H = 720;
const LEAD = 0.8, TAIL = 1.6, GAP_BEAT = 0.22, GAP_SCENE = 0.5;
/* Only --preview and --calibrate use this. A real render MEASURES every
   clip, so this number never reaches a rendered frame; it exists so the
   script can be cut to length before any of it is bought. Set from a
   --calibrate run against this voice and these settings. */
const CHARS_PER_SECOND = 15.92;   /* measured 2026-09-17, this voice, these settings */

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

/* ------------------------------------------------- the lesson's artwork --- */
/* Sliced by the markers the file actually contains, never by line number. A
   marker that has moved is a refusal, not a guess. */
function extractArt() {
  const src = fs.readFileSync(SCIENCE_JS, "utf8");

  const sk0 = src.indexOf("  FIGURES.skeleton = () => (");
  if (sk0 < 0) die("science.js no longer defines FIGURES.skeleton where this tool slices it.");
  const sk1 = src.indexOf('"</svg>");', sk0);
  if (sk1 < 0) die("FIGURES.skeleton does not end where this tool expects.");
  const skeleton = src.slice(sk0, sk1 + '"</svg>");'.length).trim();

  const ar0 = src.indexOf("  function armSvg(bent, tricepsOn) {");
  if (ar0 < 0) die("science.js no longer defines armSvg where this tool slices it.");
  const arEnd = src.indexOf("</svg>';", ar0);
  if (arEnd < 0) die("armSvg does not end where this tool expects.");
  const ar1 = src.indexOf("\n  }\n", arEnd);
  const armSvg = src.slice(ar0, ar1 + "\n  }\n".length).trim();

  return { skeleton, armSvg };
}

/* armSvgAt(b, tr): the same drawing with the two muscles part-way contracted.
   Every constant is armSvg's own; the only change is that the ternaries became
   linear ramps. num() keeps a whole number whole, so an endpoint renders the
   exact characters armSvg renders and the equality check below is meaningful. */
const ARM_TWEEN = `
function num(v) { const r = Math.round(v * 100) / 100; return String(r); }
function armSvgAt(b, tr) {
  const bent = b > 0.5, tOn = tr > 0.5 && !bent;
  const bi = bent ? "contracted: shorter, fatter" : "relaxed";
  const tri = tOn ? "contracted: shorter, fatter" : "relaxed";
  const deg = -70 * b, th = deg * Math.PI / 180;
  const rot = (x, y) => [160 + (x - 160) * Math.cos(th) - (y - 105) * Math.sin(th), 105 + (x - 160) * Math.sin(th) + (y - 105) * Math.cos(th)];
  const bRx = 50 - 10 * b, bRy = 12 + 10 * b, bY = 76 - 10 * b, bTy = 58 - 18 * b;
  const tRx = 50 - 10 * tr, tRy = 11 + 9 * tr, tY = 132 + 4 * tr, tTy = 164 + 8 * tr;
  const bA = rot(184, 94), tA = rot(150, 119);
  const tendon = (x1, y1, p) => '<path d="M' + num(x1) + " " + num(y1) + " L" + p[0].toFixed(1) + " " + p[1].toFixed(1) + '" stroke="#A8433A" stroke-width="4" stroke-linecap="round"/>';
  return '<svg viewBox="0 0 320 220" role="img" aria-label="An arm, ' + (bent ? "bent" : "straight") + ', with the biceps and triceps joined to the forearm"><rect width="320" height="220" fill="#F3EFE6"/>' +
    '<rect x="40" y="90" width="120" height="30" rx="14" fill="#E9E4D6" stroke="#B5A990" stroke-width="2"/>' +
    '<g transform="rotate(' + num(deg) + ' 160 105)"><rect x="160" y="92" width="120" height="26" rx="13" fill="#E9E4D6" stroke="#B5A990" stroke-width="2"/><text x="290" y="112" font-size="24">\\u270B\\uFE0F</text></g>' +
    tendon(100 + bRx - 4, bY, bA) + tendon(100 + tRx - 4, tY, tA) +
    '<ellipse cx="100" cy="' + num(bY) + '" rx="' + num(bRx) + '" ry="' + num(bRy) + '" fill="#D9473F"/><text x="100" y="' + num(bTy) + '" text-anchor="middle" fill="#1B1B1B" font-size="12" font-family="Inter, sans-serif" font-weight="800">biceps ' + bi + "</text>" +
    '<ellipse cx="100" cy="' + num(tY) + '" rx="' + num(tRx) + '" ry="' + num(tRy) + '" fill="#E9744F"/><text x="100" y="' + num(tTy) + '" text-anchor="middle" fill="#1B1B1B" font-size="12" font-family="Inter, sans-serif" font-weight="800">triceps ' + tri + "</text>" +
    '<text x="210" y="206" fill="#6B5E48" font-size="11" font-family="Inter, sans-serif" font-weight="800">tendons join muscle to bone</text></svg>';
}
`;

function artModule(art) {
  return `(function(){
  const FIGURES = {};
  ${art.skeleton}
  ${art.armSvg}
  ${ARM_TWEEN}
  /* The gate. armSvgAt's three endpoints must BE armSvg's three poses. */
  const checks = [
    ["straight", armSvgAt(0, 0), armSvg(false)],
    ["bent", armSvgAt(1, 0), armSvg(true)],
    ["triceps", armSvgAt(0, 1), armSvg(false, true)]
  ];
  const bad = checks.filter((c) => c[1] !== c[2]).map((c) => c[0]);
  window.ART = { skeletonSvg: FIGURES.skeleton, armSvg: armSvg, armSvgAt: armSvgAt, tweenDrift: bad };
})();`;
}

/* --------------------------------------------------------------- audio --- */
function clipPath(cacheDir, text) {
  const h = crypto.createHash("sha1").update(`${VOICE_ID}|${MODEL_ID}|${text}`).digest("hex").slice(0, 16);
  return path.join(cacheDir, `${h}.mp3`);
}

async function speak(text, out) {
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
  let t = LEAD, k = 0;
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
  /* the last beat runs to the end of the film so nothing blinks out on the tail */
  const total = t + TAIL;
  beats[beats.length - 1].end = total;
  return { beats, total };
}

/* ------------------------------------------------------------ captions --- */
const vttTime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${sec.toFixed(3).padStart(6, "0")}`;
};

function writeVtt(beats, out) {
  const cues = beats.map((b, i) => {
    /* a cue ends when the clip ends, never when the next one starts: a caption
       held across a pause reads as speech that is not happening */
    const end = b.start + b.dur;
    const lines = balance(b.say);
    return `${i + 1}\n${vttTime(b.start)} --> ${vttTime(end)}\n${lines}\n`;
  });
  fs.writeFileSync(out, "WEBVTT\n\n" + cues.join("\n"), "utf8");
}

/* two lines at most, split near the middle at a word boundary */
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

function buildPage(film, art) {
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
<script>${artModule(art)}</script>
<script>${fs.readFileSync(SCENES_JS, "utf8")}</script>
</body></html>`;
}

/* ---------------------------------------------------------------- main --- */
(async function main() {
  loadEnv();
  const app = arg("app", "src/prototypes/ehel-academy/science/grade-4-app");
  const slug = arg("slug", "bones-and-muscles");
  const dry = has("dry");
  const appDir = path.resolve(ROOT, app);
  const board = path.join(appDir, "lecture-video", `${slug}.json`);
  if (!fs.existsSync(board)) die(`no storyboard at ${board}`);
  const film = JSON.parse(fs.readFileSync(board, "utf8"));

  const scratch = process.env.CLAUDE_SCRATCH ||
    path.join(os.tmpdir(), "ehel-science-lecture", slug);
  const cacheDir = path.join(ROOT, ".cache", "ehel-lecture-audio");
  const frameDir = path.join(scratch, "frames");
  for (const d of [scratch, cacheDir, frameDir]) fs.mkdirSync(d, { recursive: true });

  const flat = [];
  film.scenes.forEach((s, si) => s.beats.forEach((b) => flat.push(Object.assign({ scene: si }, b))));

  /* ---- what the voice will cost ---- */
  const chars = flat.reduce((n, b) => n + b.say.length, 0);
  const fresh = flat.filter((b) => !fs.existsSync(clipPath(cacheDir, b.say)));
  const freshChars = fresh.reduce((n, b) => n + b.say.length, 0);
  console.log(`${film.title}: ${film.scenes.length} scenes, ${flat.length} beats, ${chars} characters.`);
  console.log(`  cached ${flat.length - fresh.length} clips; ${fresh.length} to buy (${freshChars} characters).`);
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
     actually does with them. It exists because CHARS_PER_SECOND decides
     whether the script is cut BEFORE it is narrated, and a script trimmed
     against a guessed rate is re-bought at full price when the guess is wrong.
     The clips it buys are real clips in the real cache, so the render that
     follows does not pay for them twice. */
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
    const pad = LEAD + TAIL + GAP_BEAT * (flat.length - film.scenes.length) + GAP_SCENE * (film.scenes.length - 1);
    const est = speech + pad;
    console.log(`  so ${flat.length} beats would run about ${Math.floor(est / 60)}:${String(Math.round(est % 60)).padStart(2, "0")}` +
      ` (${speech.toFixed(0)}s of speech + ${pad.toFixed(1)}s of pauses).`);
    return;
  }

  /* ---- narrate ----
     --preview buys nothing: it ESTIMATES each beat from its character count
     and renders one frame per beat, which is enough to find a layout fault
     and costs nothing. The estimate is only ever used for that; a real render
     measures the clips. */
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
        console.log("bought");
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
  const art = extractArt();
  const pagePath = path.join(scratch, "film.html");
  fs.writeFileSync(pagePath, buildPage(film, art), "utf8");

  /* ---- frames ---- */
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file:///" + pagePath.replace(/\\/g, "/"));
  await page.evaluate(() => document.fonts.ready);

  const drift = await page.evaluate(() => window.ART.tweenDrift);
  if (drift.length) {
    die(`armSvgAt no longer reproduces armSvg at ${drift.join(", ")}.\n` +
        "The lesson's arm has been redrawn. Re-derive the tween in ARM_TWEEN before rendering.");
  }
  console.log("  arm tween checked against the lesson's own armSvg at all three poses: identical.");

  if (preview) {
    /* one frame per beat, taken 70% of the way in so everything that arrives
       has arrived, plus a contact sheet to look at all of them at once */
    /* Into the SCRATCH directory, never the app tree: 33 PNGs of build scratch
       beside the storyboard read as source, and the next person has to work
       out whether they ship. Nothing deploys them either way - they are not in
       extraPages - but "not deployed" is not the same as "not committed". */
    const shots = path.join(scratch, "preview");
    fs.rmSync(shots, { recursive: true, force: true });
    fs.mkdirSync(shots, { recursive: true });
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i];
      await page.evaluate((t) => window.EHEL_FILM.frame(t), b.start + b.dur * 0.7);
      await page.screenshot({ path: path.join(shots, `${String(i).padStart(2, "0")}-${film.scenes[b.scene].id}.png`) });
    }
    if (errs.length) die("the page threw while rendering:\n" + errs.slice(0, 5).join("\n"));
    await browser.close();
    console.log(`  ${beats.length} preview stills in ${path.relative(ROOT, shots)}`);
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

  /* ---- audio: clips laid on the measured timeline, with the same gaps ---- */
  const wavDir = path.join(scratch, "wav");
  fs.mkdirSync(wavDir, { recursive: true });
  const parts = [];
  const silence = (secs, tag) => {
    const p = path.join(wavDir, `sil-${tag}.wav`);
    run("ffmpeg", ["-y", "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`, "-t", secs.toFixed(3), p],
        { stdio: ["ignore", "ignore", "pipe"] });
    return p;
  };
  parts.push(silence(LEAD, "lead"));
  for (let i = 0; i < clips.length; i++) {
    const w = path.join(wavDir, `c${String(i).padStart(3, "0")}.wav`);
    run("ffmpeg", ["-y", "-i", clips[i], "-ar", "44100", "-ac", "2", w], { stdio: ["ignore", "ignore", "pipe"] });
    parts.push(w);
    const next = beats[i + 1];
    if (next) parts.push(silence(next.start - (beats[i].start + beats[i].dur), `g${i}`));
  }
  parts.push(silence(TAIL, "tail"));

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

  /* A poster, taken from the title card rather than frame 0 - the film opens
     on a fade-in, so frame 0 is a nearly blank page and that is what a lesson
     page would show before anyone presses play. */
  const posterAt = Math.min(beats[1] ? beats[1].start + 0.8 : 2.2, total - 0.5);
  run("ffmpeg", ["-y", "-ss", posterAt.toFixed(2), "-i", outPath, "-frames:v", "1",
    "-q:v", "3", path.join(outDir, `${slug}.jpg`)], { stdio: ["ignore", "ignore", "pipe"] });

  const size = fs.statSync(outPath).size;
  console.log(`\n  ${path.relative(ROOT, outPath)}  ${(size / 1048576).toFixed(2)} MB  ${duration(outPath).toFixed(2)}s`);
  console.log(`  ${path.relative(ROOT, path.join(outDir, slug + ".vtt"))}  ${beats.length} cues`);
})();
