#!/usr/bin/env node
/* Build a unit lecture film for a standalone lesson, in any subject.
 *
 *   T=tools/create-ehel-unit-lecture.js
 *   node $T --app <grade app> --slug <film> --dry        # cost, coverage, length; buys nothing
 *   node $T --app ... --slug ... --preview               # one still per beat, both cards, and contact sheets; buys nothing
 *   node $T --app ... --slug ... --sample [ids]          # a frame 0.75 s after every spoken cue, as contact sheets; buys nothing
 *   node $T --app ... --slug ... --sweep                 # every frame drawn once, no pictures: errors, and anything outside the box
 *   node $T --app ... --slug ... --draft                 # the whole film in the free OS voice
 *   node $T --app ... --slug ... --narrate               # BUYS the narration, then stops
 *   node $T --app ... --slug ...                         # BUYS what is not cached, renders
 *   --workers N  draws frames in N browsers at once (default 5); --limit-seconds N cuts the film short
 *
 * THE ORDER THAT BUYS ONCE AND RENDERS ONCE (2026-09-18, after the Computing
 * film took 2 h 44 min and rendered twice):
 *   1. --dry and --preview until the script and the pictures are right. The
 *      timing is ESTIMATED from character counts here, and the estimate runs
 *      long: the Computing film estimated 3:35 and measured 3:13.
 *   2. Ask the owner before buying. Then --narrate buys the clips and stops.
 *   3. --sample again. Once every clip is cached, --preview and --sample use
 *      the MEASURED timeline, which is the one the render will use. This is
 *      where a short line shows itself: on the estimate the Computing film's
 *      tablet chapter looked right, and on the real 1.8 s lines its programs
 *      flicked past. That cost a second render.
 *   4. Render once. Frames are a pure function of time, so N browsers draw
 *      them at once: one browser drew 5-7 frames a second, and five drew 24 to
 *      36 (the Computing film's frames in 4 minutes instead of 17).
 *
 * A RE-RENDER IS NEVER BYTE-IDENTICAL, and that is Chromium, not this tool.
 * Its text antialiasing drifts very slightly with a browser's history, so a
 * long render has a few frames whose text edges differ from what a fresh
 * browser draws. A fresh browser draws the same frame identically every time.
 * Measured on the Computing film, 147 of 5,776 frames were affected, by at
 * most 2,129 pixels of 921,600. The shipped one-browser render has such frames
 * too, and they do not survive encoding. Naming by content gives a re-render a
 * new name, which is right.
 *
 * THE RENDERER IS NAMED BY THE STORYBOARD, not by this tool:
 *   "renderer": { "scenes": "tools/lib/<the film's pictures>.js", "styles": [optional extra CSS] }
 * The page is ehel-film-engine-head.js + the scenes file + ehel-film-engine-tail.js
 * in one script, over ehel-film-base.css; the head says what a scenes file must
 * define. "scenes" may also be a LIST of files, joined in order: the shared
 * marks (tools/lib/ehel-film-marks.js) first, then the film's pictures, in as
 * many parts as it needs. "art" names adapters that lift a lesson kit's own
 * drawings into the film, so the child sees the picture the lesson draws:
 *   "renderer": { "art": ["science"], "scenes": ["tools/lib/ehel-film-marks.js", "<the film's pictures>.js"] }
 * An adapter is tools/lib/ehel-film-art-<name>.js; its script goes after the
 * head and before the scenes. "skin": "brown" draws every person emoji that has
 * no skin tone brown (the head's skin(); the Science Grade 2-4 films ask for it).
 * A new film in any subject writes its pictures and nothing else. The
 * science (Bones and Muscles) and maths (Shape and Measures) films predate this
 * and keep their own tools, which this does not touch; their storyboards name no
 * renderer, and this tool refuses them rather than guessing.
 *
 * Everything else is the science tool's, via the maths and Computing tools: the
 * animation is timed from the voice (every clip narrated first, measured, and
 * the timeline built from the measurements); clips are cached by a hash of the
 * voice, its settings and the words, so a picture change re-renders for
 * nothing; the outputs are named by CONTENT (<slug>.<sha1 8>.mp4/.vtt/.jpg), so
 * a re-render can never be shadowed by a CDN that keeps a path for a year; a
 * --draft render says ".draft." in its names, and the lesson kits refuse a film
 * so named. An option this tool does not know is refused before anything runs,
 * so a typo cannot fall through to a paid render.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FONT_DIR = path.join(ROOT, "src/prototypes/ehel-academy/shared/fonts");
const ENGINE_HEAD = path.join(__dirname, "lib/ehel-film-engine-head.js");
const ENGINE_TAIL = path.join(__dirname, "lib/ehel-film-engine-tail.js");
/* Appended after the tail for --slides only. It drives the SAME film through
   window.EHEL_FILM, which the tail already publishes, so it needs no change to
   the engine and works for every film in the repo. */
const ENGINE_SLIDES = path.join(__dirname, "lib/ehel-film-slides.js");
const BASE_CSS = path.join(__dirname, "lib/ehel-film-base.css");

/* the platform voice, and the same slower, teacher-like settings as every
   film so far (owner's ear, 2026-09-17). One course should not sound
   different from another for no reason. */
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
/* Only the estimate uses this, before the narration is bought. It is the
   science film's measured rate for this voice and these settings; short lines
   run faster than it predicts. */
const CHARS_PER_SECOND = 13.96;
/* A frame that takes longer than this is retried once in a fresh browser, and
   the run stops if it fails again. The Computing film's picture checks once
   took 5 to 10 minutes each where the same check ran in under a minute; a
   limit turns a stall into a message instead of a wait. */
const FRAME_TIMEOUT_MS = Number(process.env.EHEL_FILM_FRAME_TIMEOUT_MS) || 20000;   /* the env var exists to watch the limit fire */

/* ---------------------------------------------------------------- args --- */
const ARGV = process.argv.slice(2);
function arg(name, fallback) {
  const eq = ARGV.find((x) => x.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = ARGV.indexOf(`--${name}`);
  if (i >= 0 && ARGV[i + 1] && !ARGV[i + 1].startsWith("--")) return ARGV[i + 1];
  return fallback;
}
const has = (name) => ARGV.some((x) => x === `--${name}` || x.startsWith(`--${name}=`));

const KNOWN = new Set(["app", "slug", "dry", "preview", "sample", "sweep", "slides", "draft", "narrate", "calibrate", "limit-seconds", "workers"]);
for (const a of ARGV) {
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

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/* --------------------------------------------------------------- audio ---
   --draft swaps ElevenLabs for the OS's own SAPI voice (System.Speech, via
   PowerShell): free, so the whole timed film can be watched before anything
   is bought. It is cached SEPARATELY from the real voice (its own directory,
   its own hash tag, .wav not .mp3), so a later run without --draft never
   mistakes a free placeholder for a bought clip. */
const DRAFT = has("draft");
function clipPath(cacheDir, text) {
  const tag = DRAFT ? "sapi-draft" : `${VOICE_ID}|${MODEL_ID}|${JSON.stringify(VOICE_SETTINGS)}`;
  const h = crypto.createHash("sha1").update(`${tag}|${text}`).digest("hex").slice(0, 16);
  return path.join(cacheDir, `${h}.${DRAFT ? "wav" : "mp3"}`);
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
  if (DRAFT) return speakSapi(text, out);
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
  /* written aside and renamed, so a run stopped mid-write never leaves a
     partial clip that a later run would take for a bought one */
  fs.writeFileSync(out + ".part", buf);
  fs.renameSync(out + ".part", out);
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

/* the storyboard's renderer: its art adapters, scenes files and extra styles,
   checked. --dry reads only the script, so there a file not written yet is
   listed rather than refused: a film's words are settled before its pictures. */
function rendererOf(film, lenient) {
  const r = film.renderer;
  if (!r || !r.scenes || (Array.isArray(r.scenes) && !r.scenes.length)) die("the storyboard names no renderer (\"renderer\": {\"scenes\": ...}). " +
    "A film made before this tool keeps its own subject's tool; a new one names its scenes file here.");
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const missing = [];
  const need = (s, what) => {
    const p = path.resolve(ROOT, s);
    if (!fs.existsSync(p)) {
      if (!lenient) die(`the storyboard's renderer.${what} names ${s}, which does not exist`);
      missing.push(s);
    }
    return p;
  };
  /* "brown": every person the film draws is brown (the engine head's skin()) */
  if (r.skin != null && r.skin !== "brown") die(`renderer.skin is ${JSON.stringify(r.skin)}; the one a film can ask for is "brown"`);
  const scenes = list(r.scenes).map((s) => need(s, "scenes"));
  const styles = list(r.styles).map((s) => need(s, "styles"));
  const art = list(r.art).map((name) => {
    if (!/^[a-z0-9-]+$/.test(String(name))) die(`renderer.art names ${JSON.stringify(name)}; an art adapter is named by a plain word`);
    const p = path.join(__dirname, "lib", `ehel-film-art-${name}.js`);
    if (!fs.existsSync(p)) die(`renderer.art names ${name}, and there is no tools/lib/ehel-film-art-${name}.js`);
    return { name, file: p };
  });
  return { scenes, styles, art, missing };
}

function describeRenderer(renderer) {
  return renderer.art.map((a) => `art:${a.name}`)
    .concat(renderer.scenes.map((p) => path.relative(ROOT, p)))
    .concat(renderer.styles.map((p) => path.relative(ROOT, p))).join(" + ");
}

function buildPage(film, renderer, opts) {
  const fonts = [
    fontFace("AtkinsonHyperlegible-normal-400.woff2", "Atkinson Hyperlegible", "400"),
    fontFace("AtkinsonHyperlegible-normal-700.woff2", "Atkinson Hyperlegible", "700"),
    fontFace("Inter-normal-300-700.woff2", "Inter", "300 700")
  ].join("\n");
  const read = (p) => fs.readFileSync(p, "utf8");
  const artJs = [], artCss = [];
  for (const a of renderer.art) {
    try {
      const mod = require(a.file);
      artJs.push(mod.script());
      if (mod.css) artCss.push(mod.css());
    } catch (e) { die(e.message); }
  }
  const css = [read(BASE_CSS)].concat(artCss, renderer.styles.map(read)).join("\n");
  const parts = [read(ENGINE_HEAD)].concat(artJs, renderer.scenes.map(read), [read(ENGINE_TAIL)]);
  if (opts && opts.slides) parts.push(read(ENGINE_SLIDES));
  const script = parts.join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${film.title} - unit lecture</title>
<style>${fonts}</style>
<style>${css}</style>
</head><body><div id="film"></div>
<script>window.FILM = ${JSON.stringify(film)};</script>
<script>${script}</script>
</body></html>`;
}

/* ------------------------------------------------------------ browsers --- */
function withTimeout(promise, ms, what) {
  let timer;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} took longer than ${ms / 1000} s`)), ms); });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

/* One browser per worker: pages in one browser share its compositor, and the
   point is to draw in parallel. */
async function openFilm(chromium, pagePath) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file:///" + pagePath.replace(/\\/g, "/"));
  await page.evaluate(() => document.fonts.ready);
  if (errs.length) die("the film page threw while loading:\n" + errs.slice(0, 5).join("\n"));
  return { browser, page, errs };
}

/* Draw frame t into file; a frame that stalls is retried once in a fresh browser. */
async function shoot(w, chromium, pagePath, t, file) {
  for (let attempt = 1; ; attempt++) {
    try {
      await withTimeout((async () => {
        await w.page.evaluate((x) => window.EHEL_FILM.frame(x), t);
        await w.page.screenshot({ path: file });
      })(), FRAME_TIMEOUT_MS, `the frame at ${t.toFixed(2)} s`);
      return;
    } catch (e) {
      if (attempt >= 2) die(String(e.message || e) + ", twice; stopping rather than waiting");
      console.log(`\n  ${e.message || e}; retrying it in a fresh browser`);
      try { await w.browser.close(); } catch (_) { /* already gone */ }
      Object.assign(w, await openFilm(chromium, pagePath));
    }
  }
}

/* Shots as contact sheets, 12 to a sheet: <prefix>-1.png, <prefix>-2.png ... */
async function contactSheets(w, shots, outDir, prefix) {
  const made = [];
  for (let p = 0; p * 12 < shots.length; p++) {
    const group = shots.slice(p * 12, p * 12 + 12);
    const html = `<!doctype html><html><body style="margin:0;background:#222;font:13px sans-serif;color:#eee">` +
      `<div style="display:grid;grid-template-columns:repeat(3,424px);gap:6px;padding:6px">` +
      group.map((x) => `<figure style="margin:0"><img src="file:///${x.file.replace(/\\/g, "/")}" style="width:424px;display:block">` +
        `<figcaption style="padding:2px 4px">${x.cap}</figcaption></figure>`).join("") + `</div></body></html>`;
    const sp = path.join(outDir, `${prefix}-${p + 1}.html`);
    fs.writeFileSync(sp, html, "utf8");
    const tab = await w.browser.newPage({ viewport: { width: 1290, height: 400 } });
    await withTimeout(tab.goto("file:///" + sp.replace(/\\/g, "/")), FRAME_TIMEOUT_MS, "a contact sheet");
    await tab.screenshot({ path: sp.replace(/\.html$/, ".png"), fullPage: true });
    await tab.close();
    made.push(`${prefix}-${p + 1}.png (${group.length})`);
  }
  return made;
}

/* --------------------------------------------------------- the sampler ---
   A frame just after each beat starts, 0.75 s after every phrase the beat's
   art.at names, and just before its voice stops - the moments a picture has
   to be right at - as contact sheets, 12 to a sheet. A cue's frame is named
   -cue-<name>, so a cue called "start" or "end" cannot overwrite the beat's
   own start or end frame. Sampling some chapters replaces only theirs. */
async function sample(chromium, pagePath, film, outDir, only) {
  if (only.length && fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) {
      if (only.some((id) => f.startsWith(`${id}-b`) || f.startsWith(`sheet-${id}-`))) fs.rmSync(path.join(outDir, f), { force: true });
    }
  } else {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  const w = await openFilm(chromium, pagePath);
  const times = [];
  const t0 = Date.now();
  const sheets = [];
  for (const s of film.scenes) {
    if (only.length && !only.includes(s.id)) continue;
    const shots = [];
    for (let i = s.first; i < s.first + s.beats.length; i++) {
      const c = await w.page.evaluate((k) => window.EHEL_FILM.cues(k), i);
      const wanted = [[c.start + 0.3, "start"]];
      Object.entries(c.cues).sort((a, b) => a[1] - b[1]).forEach(([k, v]) => wanted.push([v + 0.75, "cue-" + k]));
      wanted.push([c.spokenEnd - 0.15, "end"]);
      wanted.sort((a, b) => a[0] - b[0]);
      const kept = [];
      for (const tm of wanted) if (!kept.length || tm[0] - kept[kept.length - 1][0] > 0.4) kept.push(tm);
      for (const [t, why] of kept) {
        const file = path.join(outDir, `${s.id}-b${String(i + 1).padStart(2, "0")}-${why}.png`);
        const a = Date.now();
        await shoot(w, chromium, pagePath, t, file);
        times.push(Date.now() - a);
        shots.push({ file, cap: `beat ${i + 1} · ${why.replace(/^cue-/, "")} · ${t.toFixed(2)} s` });
      }
    }
    sheets.push(...await contactSheets(w, shots, outDir, `sheet-${s.id}`));
  }
  if (w.errs.length) die("the film page threw while sampling:\n" + w.errs.slice(0, 5).join("\n"));
  await w.browser.close();
  times.sort((a, b) => a - b);
  const med = times.length ? times[Math.floor(times.length / 2)] : 0;
  console.log(`  ${times.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s ` +
    `(a frame took ${med} ms typically, ${times.length ? times[times.length - 1] : 0} ms at worst)`);
  console.log(`  ${sheets.length} contact sheets in ${outDir}:\n    ${sheets.join("\n    ")}`);
}

/* ----------------------------------------------------------- the sweep ---
   Every frame the render will draw, drawn once in the page with no screenshot,
   for two faults a few sampled frames can step over:
   - a frame that throws. The render would stop there, after the narration is
     bought; the Parts of a Plant film had one that lived 0.35 s after each
     part was named, between every sampled frame.
   - anything drawn outside the scene's 1168 x 440 box, over the heading or the
     spoken line. Checked every 0.1 s, on what can be seen: an element at
     opacity under 0.05 is skipped, a lesson drawing nested with ART.place
     counts as its own box (it clips what is inside it), and an element under a
     clip-path is skipped (its box overstates what shows). Three of the Grade 1
     Science films found overflows this way that no contact sheet showed.
   A throw stops the tool; an overflow is reported and left to the eye. */
async function sweep(chromium, pagePath, total) {
  const w = await openFilm(chromium, pagePath);
  const frames = Math.ceil(total * FPS), t0 = Date.now(), CHUNK = 450;
  const errors = [], outside = [];
  for (let f0 = 0; f0 < frames && errors.length < 5; f0 += CHUNK) {
    const r = await withTimeout(w.page.evaluate(({ f0, f1, fps, box0 }) => {
      const errors = [], outside = [], SKIP = new Set(["g", "defs", "clippath", "lineargradient", "radialgradient", "stop", "title", "desc", "mask", "filter", "pattern", "tspan", "marker", "symbol"]);
      const seen = new Set(box0);
      const shown = (el, root) => {
        let o = 1;
        for (let n = el; n && n !== root.parentNode; n = n.parentNode) {
          const a = n.getAttribute && n.getAttribute("opacity");
          if (a != null && a !== "") o *= parseFloat(a);
          if (n.style && n.style.opacity !== "") o *= parseFloat(n.style.opacity);
          if (n.style && n.style.display === "none") return 0;
        }
        return o;
      };
      /* A nested drawing clips to its own box, but its box can have empty
         margins (a lesson drawing whose backdrop a film left out). What counts
         is the ink inside it: the painted elements' boxes, clipped to its box. */
      /* under a <defs>-like element, or under a clip-path (the globe's land
         spins past the Earth's edge and is clipped away there) */
      const inside = (k, stop, names) => {
        for (let n = k.parentElement; n && n !== stop; n = n.parentElement) if (names.has(n.tagName.toLowerCase()) || n.hasAttribute("clip-path")) return true;
        return k.hasAttribute("clip-path");
      };
      const HIDDEN = new Set(["clippath", "defs", "mask", "pattern", "marker", "symbol"]);
      const inkBox = (svgEl, root) => {
        const vp = svgEl.getBoundingClientRect();
        let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
        for (const k of svgEl.querySelectorAll("*")) {
          const kt = k.tagName.toLowerCase();
          if (SKIP.has(kt) || kt === "svg" || inside(k, svgEl, HIDDEN) || shown(k, root) < 0.05) continue;
          const cs = getComputedStyle(k);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          if ((cs.fill === "none" || cs.fillOpacity === "0") && (cs.stroke === "none" || cs.strokeOpacity === "0")) continue;
          const q = k.getBoundingClientRect();
          if (!q.width && !q.height) continue;
          L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom);
        }
        if (L === Infinity) return { width: 0, height: 0 };
        const out = { left: Math.max(L, vp.left), top: Math.max(T, vp.top), right: Math.min(R, vp.right), bottom: Math.min(B, vp.bottom) };
        out.width = out.right - out.left; out.height = out.bottom - out.top;
        return out;
      };
      for (let f = f0; f < f1; f++) {
        const t = f / fps;
        try { window.EHEL_FILM.frame(t); } catch (e) { errors.push({ t, msg: String((e && e.message) || e) }); if (errors.length >= 5) break; continue; }
        if (f % 3) continue;
        const root = document.querySelector(".scene svg.sf");
        if (!root) continue;
        const box = root.getBoundingClientRect();
        for (const el of root.querySelectorAll("*")) {
          const tag = el.tagName.toLowerCase();
          if (SKIP.has(tag)) continue;
          const host = tag === "svg" ? el.parentElement.closest("svg") : el.closest("svg");
          if (host !== root || (el.parentElement && el.parentElement.closest("[clip-path]"))) continue;
          if (shown(el, root) < 0.05) continue;
          const b = tag === "svg" ? inkBox(el, root) : el.getBoundingClientRect();
          if (!b.width && !b.height) continue;
          const over = Math.max(box.left - b.left, box.top - b.top, b.right - box.right, b.bottom - box.bottom);
          if (over <= 2) continue;
          const what = "<" + tag + (el.getAttribute("class") ? ' class="' + el.getAttribute("class") + '"' : "") + ">" + (el.textContent || "").trim().slice(0, 24);
          const key = what + "@" + Math.floor(t);
          if (seen.has(key)) continue;
          seen.add(key);
          outside.push({ t, what, over: Math.round(over) });
        }
      }
      return { errors, outside, seen: [...seen] };
    }, { f0, f1: Math.min(frames, f0 + CHUNK), fps: FPS, box0: [] }), FRAME_TIMEOUT_MS * 20, `frames ${f0} to ${Math.min(frames, f0 + CHUNK)}`);
    errors.push(...r.errors);
    outside.push(...r.outside);
  }
  if (w.errs.length) errors.push(...w.errs.map((m) => ({ t: NaN, msg: m })));
  await w.browser.close();
  console.log(`  swept ${frames} frames, every one the render will draw, in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (outside.length) {
    console.log(`  WARNING: drawn outside the 1168 x 440 box at ${outside.length} moment(s) (checked every 0.1 s):`);
    for (const o of outside.slice(0, 12)) console.log(`    ${o.t.toFixed(2)} s  ${o.over} px out  ${o.what}`);
    if (outside.length > 12) console.log(`    ... and ${outside.length - 12} more`);
  } else {
    console.log("  nothing drawn outside the 1168 x 440 box (checked every 0.1 s)");
  }
  if (errors.length) die(`a frame throws, so the render would stop there:\n` + errors.map((e) => `    ${isFinite(e.t) ? e.t.toFixed(2) + " s" : "page"}  ${e.msg}`).join("\n"));
  console.log("  no frame throws");
}

/* ------------------------------------------------ content-hashed names --- */
const sha8 = (file) => crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);

/* Move a finished file into lecture-video/ under <slug>[.draft].<hash>.<ext>.
   An existing file of that name has the same bytes by construction, so it is
   left alone rather than rewritten. */
function publish(tmp, outDir, slug, ext) {
  const name = `${slug}${DRAFT ? ".draft" : ""}.${sha8(tmp)}.${ext}`;
  const dest = path.join(outDir, name);
  if (!fs.existsSync(dest)) fs.copyFileSync(tmp, dest);
  return name;
}

/* ---------------------------------------------------------------- main --- */
(async function main() {
  loadEnv();
  const app = arg("app", ""), slug = arg("slug", "");
  if (!app || !slug) die("name the film: --app <a grade app directory> --slug <the storyboard's name>");
  const appDir = path.resolve(ROOT, app);
  const board = path.join(appDir, "lecture-video", `${slug}.json`);
  if (!fs.existsSync(board)) die(`no storyboard at ${board}`);
  const film = JSON.parse(fs.readFileSync(board, "utf8"));
  const renderer = rendererOf(film, has("dry"));

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
    console.log(`  --limit-seconds ${limitSeconds}: trimmed to ${film.scenes.length} scene(s), ${keptBeats} beat(s).`);
  }

  const scratch = process.env.CLAUDE_SCRATCH || path.join(os.tmpdir(), "ehel-unit-lecture", slug);
  const cacheDir = path.join(ROOT, ".cache", DRAFT ? "ehel-lecture-audio-draft" : "ehel-lecture-audio");
  const frameDir = path.join(scratch, "frames");
  for (const d of [scratch, cacheDir]) fs.mkdirSync(d, { recursive: true });
  if (DRAFT) console.log("  --draft: narrating with the OS's own SAPI voice (free). Re-run without --draft to buy the real one.");

  const flat = [];
  film.scenes.forEach((s, si) => s.beats.forEach((b) => flat.push(Object.assign({ scene: si }, b))));
  const missing = flat.filter((b) => !b.say || !b.say.trim());
  if (missing.length) die(`${missing.length} beat(s) have nothing to say.`);

  /* ---- what the voice will cost ---- */
  const chars = flat.reduce((n, b) => n + b.say.length, 0);
  const fresh = flat.filter((b) => !fs.existsSync(clipPath(cacheDir, b.say)));
  const freshChars = fresh.reduce((n, b) => n + b.say.length, 0);
  console.log(`${film.title}: ${film.scenes.length} scenes, ${flat.length} beats, ${chars} characters.`);
  console.log(`  renderer: ${describeRenderer(renderer)}`);
  if (renderer.missing.length) console.log(`  not written yet: ${renderer.missing.join(", ")} (--dry reads only the script; every other mode needs them)`);
  console.log(`  cached ${flat.length - fresh.length} clips; ${fresh.length} to ${DRAFT ? "narrate" : "buy"} (${freshChars} characters).`);

  const estimate = () => flat.map((b) => b.say.length / CHARS_PER_SECOND + 0.42);
  if (has("dry")) {
    (film.objectives || []).forEach(([c, t]) => {
      const seen = film.scenes.some((s) => (s.codes || []).includes(c));
      console.log(`  ${seen ? "covered" : "MISSING"}  ${c}  ${t.slice(0, 64)}`);
    });
    const est = buildTimeline(JSON.parse(JSON.stringify(film)), fresh.length ? estimate() : flat.map((b) => duration(clipPath(cacheDir, b.say)))).total;
    console.log(`  ${fresh.length ? "estimated" : "measured"} length ${mmss(est)}`);
    console.log("\n--dry: nothing was bought and nothing was rendered.");
    return;
  }

  /* --calibrate buys the three longest beats and reports what this voice
     actually does with them. */
  if (has("calibrate")) {
    const pick = flat.slice().sort((a, b) => b.say.length - a.say.length).slice(0, 3);
    let n = 0, secs = 0;
    for (const b of pick) {
      const p = clipPath(cacheDir, b.say);
      if (!fs.existsSync(p)) await speak(b.say, p);
      const d = duration(p);
      n += b.say.length; secs += d;
      console.log(`  ${String(b.say.length).padStart(4)} chars  ${d.toFixed(2)}s  ${(b.say.length / d).toFixed(2)} c/s   ${JSON.stringify(b.say.slice(0, 46))}`);
    }
    console.log(`\n  measured ${(n / secs).toFixed(2)} characters a second (the estimate uses ${CHARS_PER_SECOND}).`);
    return;
  }

  /* ---- narrate: the free modes never buy; --narrate and a render do ---- */
  /* EVERY free mode that draws must be listed here: anything else falls
     through to the branch below, which buys. */
  const looking = has("preview") || has("sample") || has("sweep");
  let durations, measured = false;
  if (looking) {
    if (fresh.length) {
      durations = estimate();
      console.log(`  timing: ESTIMATED - ${fresh.length} clip(s) not narrated yet. Check again after --narrate: the real voice runs shorter.`);
    } else {
      durations = flat.map((b) => duration(clipPath(cacheDir, b.say)));
      measured = true;
      console.log("  timing: MEASURED from the narration, the timeline the render will use.");
    }
  } else {
    for (let i = 0; i < flat.length; i++) {
      const p = clipPath(cacheDir, flat[i].say);
      if (!fs.existsSync(p)) {
        process.stdout.write(`  voice ${i + 1}/${flat.length} ... `);
        await speak(flat[i].say, p);
        console.log(DRAFT ? "narrated" : "bought");
      }
    }
    durations = flat.map((b) => duration(clipPath(cacheDir, b.say)));
    measured = true;
  }
  const clips = flat.map((b) => clipPath(cacheDir, b.say));
  const { beats, total } = buildTimeline(film, durations);
  console.log(`  ${measured ? "measured" : "estimated"} length: ${total.toFixed(2)} s (${mmss(total)})`);
  if (has("narrate")) {
    console.log("\n--narrate: every clip is narrated and cached. Now --sample on the measured timeline, then render.");
    return;
  }

  /* ---- the page ---- */
  film.beats = beats;
  film.total = total;
  /* --slides: the same film, as something a learner steps through. No video,
     no render, no browser — the page carries the drawings and replays one
     beat at a time, so it costs a file write and about 200 KB against the
     mp4's several megabytes. It needs the MEASURED timeline, which is why it
     sits here and not before the narration is priced. */
  if (has("slides")) {
    const slidesDir = path.join(appDir, "lecture-video");
    const tmpSlides = path.join(scratch, `${slug}.slides.html`);
    fs.writeFileSync(tmpSlides, buildPage(film, renderer, { slides: true }), "utf8");
    const name = publish(tmpSlides, slidesDir, slug, "slides.html");
    const kb = fs.statSync(path.join(slidesDir, name)).size / 1024;
    console.log(`\n  ${name}  ${kb.toFixed(0)} KB  ${beats.length} slides`);
    console.log("  The same film, stepped through a beat at a time. No video file.");
    console.log(`\n  For the lecture step:\n    "slides": "lecture-video/${name}"`);
    return;
  }

  const pagePath = path.join(scratch, "film.html");
  fs.writeFileSync(pagePath, buildPage(film, renderer), "utf8");
  const { chromium } = require("playwright");

  if (has("sweep")) {
    await sweep(chromium, pagePath, total);
    return;
  }

  if (has("sample")) {
    const only = String(arg("sample", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const unknown = only.filter((id) => !film.scenes.some((s) => s.id === id));
    if (unknown.length) die(`--sample names no such chapter: ${unknown.join(", ")} (the chapters are ${film.scenes.map((s) => s.id).join(", ")})`);
    await sample(chromium, pagePath, film, path.join(scratch, "sample"), only);
    return;
  }

  if (has("preview")) {
    const shots = path.join(scratch, "preview");
    fs.rmSync(shots, { recursive: true, force: true });
    fs.mkdirSync(shots, { recursive: true });
    const w = await openFilm(chromium, pagePath);
    const cardShots = [
      ["00a-open", film.cards.open.start + 1.1],
      ["00b-open", film.cards.open.end - 0.5],
      ["99a-end", film.cards.end.start + 1.6],
      ["99b-end", film.cards.end.end - 0.4]
    ];
    const stills = [];
    for (const [name, at] of cardShots) {
      await shoot(w, chromium, pagePath, at, path.join(shots, `${name}.png`));
      stills.push({ file: path.join(shots, `${name}.png`), cap: `${name.slice(3)} card · ${at.toFixed(2)} s` });
    }
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i], at = b.start + b.dur * 0.7, file = path.join(shots, `${String(i + 1).padStart(2, "0")}-${film.scenes[b.scene].id}.png`);
      await shoot(w, chromium, pagePath, at, file);
      stills.splice(stills.length - 2, 0, { file, cap: `beat ${i + 1} · ${film.scenes[b.scene].id} · ${at.toFixed(2)} s` });
    }
    if (w.errs.length) die("the page threw while rendering:\n" + w.errs.slice(0, 5).join("\n"));
    const made = await contactSheets(w, stills, shots, "sheet");
    await w.browser.close();
    console.log(`  ${beats.length + cardShots.length} preview stills (both cards included) in ${shots}`);
    console.log(`  as ${made.length} contact sheets: ${made.join(", ")}`);
    return;
  }

  /* ---- frames, drawn by several browsers at once ---- */
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });
  const frames = Math.ceil(total * FPS);
  const workers = Math.max(1, Math.min(parseInt(arg("workers", "5"), 10) || 5, 12));
  const pool = [];
  for (let k = 0; k < workers; k++) pool.push(await openFilm(chromium, pagePath));
  let next = 0, done = 0;
  const t0 = Date.now();
  const progress = () => {
    const rate = done / Math.max((Date.now() - t0) / 1000, 0.001);
    process.stdout.write(`\r  frames ${done}/${frames} (${(done / frames * 100).toFixed(1)}%, ${rate.toFixed(1)}/s, ${workers} browsers)   `);
  };
  await Promise.all(pool.map(async (w) => {
    for (;;) {
      const f = next++;
      if (f >= frames) return;
      await shoot(w, chromium, pagePath, f / FPS, path.join(frameDir, String(f).padStart(5, "0") + ".png"));
      done++;
      if (done % 300 === 0 || done === frames) progress();
    }
  }));
  console.log("");
  for (const w of pool) {
    if (w.errs.length) die("the page threw while rendering:\n" + w.errs.slice(0, 5).join("\n"));
    await w.browser.close();
  }

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
    const nextBeat = beats[i + 1];
    if (nextBeat) parts.push(silence(nextBeat.start - (beats[i].start + beats[i].dur), `g${i}`));
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
    src: publish(tmpMp4, outDir, slug, "mp4"),
    captions: publish(tmpVtt, outDir, slug, "vtt"),
    poster: publish(tmpJpg, outDir, slug, "jpg")
  };
  const size = fs.statSync(path.join(outDir, names.src)).size;
  console.log(`\n  ${names.src}  ${(size / 1048576).toFixed(2)} MB  ${duration(path.join(outDir, names.src)).toFixed(2)}s` +
    `  (frames drawn in ${((Date.now() - t0) / 60000).toFixed(1)} min by ${workers} browsers)`);
  console.log(`  ${names.captions}  ${beats.length} cues`);
  console.log(`  ${names.poster}`);
  if (DRAFT) {
    console.log("\n  DRAFT: the free OS voice. The lesson kits refuse a film named .draft, so this cannot be wired into a lesson.");
  } else {
    console.log("\n  For LESSON[\"video\"] and app.config.json extraPages:");
    for (const k of ["src", "captions", "poster"]) console.log(`    "${k}": "lecture-video/${names[k]}"`);
  }
})();
