/* Build each lesson's lecture VIDEO from its own lecture parts and its own
 * recorded narration: one captioned mp4 per lesson, in the English build's
 * shape (content-hashed filenames, a WebVTT caption track, a poster).
 *
 *   node ../lesson-kit/build-lectures.mjs --app .     # after narrate.mjs
 *
 * A part is a slide (the part's picture, its title, the words being said)
 * held on screen for exactly as long as its narration lasts. The narration is
 * the part's sentences - the same recorded clips the page plays for the
 * part's Listen button, joined with the same short gap - so the video, the
 * captions and the lecture step's own voice are one recording. Nothing is
 * bought here: a part whose sentences are not all recorded stops the build
 * and names them, and narrate.mjs is what records them.
 *
 * Slides are rendered by Chromium from lesson.css tokens (so the video wears
 * the lesson's own palette and type), audio and video are joined by ffmpeg.
 * Output, per lesson <slug>:
 *   media/lecture/<slug>.<sha8>.mp4     H.264 + AAC, faststart
 *   media/lecture/<slug>.<sha8>.vtt     one cue per sentence, timed from the clips
 *   media/lecture/<slug>.<sha8>.jpg     the first slide, as the poster
 *   media/lecture/index.json            { slug: { video, captions, poster, seconds } }
 * build-lessons.py reads index.json and hands the three paths to the lecture
 * step. Old files for a slug are removed when its hash moves (they are in git).
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const APP = path.resolve(process.cwd(), arg("--app", "."));
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const cfg = JSON.parse(fs.readFileSync(path.join(APP, "app.config.json"), "utf8"));
const TTS = path.join(APP, "media", "tts");
const OUT = path.join(APP, "media", "lecture");
const GAP = 0.16;       /* the page's own gap between two clips of one line */
const PART_GAP = 0.7;   /* a breath between parts */
fs.mkdirSync(OUT, { recursive: true });

const ART = fs.readFileSync(path.join(HERE, "lib", "art.js"), "utf8");
const region = ART.split("/* NARRATION-TEXT-START */")[1].split("/* NARRATION-TEXT-END */")[0];
const T = new Function(region + "; return { sentencesOf, cyrb53 };")();

const ffprobeDur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const run = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
const vttTime = (t) => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + s.toFixed(3).padStart(6, "0"); };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function lessonOf(file) {
  const s = fs.readFileSync(path.join(APP, file), "utf8");
  return JSON.parse(/\n  const LESSON = (\{.*?\n  \});\n/s.exec(s)[1]);
}

const CSS = fs.readFileSync(path.join(HERE, "lib", "lesson.css"), "utf8");
function slideHtml(lessonTitle, n, total, part) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
  html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:linear-gradient(160deg,#0B1D2C,#15405a);}
  .v{position:absolute;inset:0;display:grid;grid-template-columns:430px 1fr;gap:40px;align-items:center;padding:0 80px;color:#fff;font-family:"Atkinson Hyperlegible","Segoe UI",Arial,sans-serif}
  .pic{font-size:230px;line-height:1;text-align:center;filter:drop-shadow(0 12px 24px rgba(0,0,0,.35))}
  .k{font-family:Inter,"Segoe UI",sans-serif;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#35BFB2;font-size:22px;margin:0 0 10px}
  h1{font-family:Inter,"Segoe UI",sans-serif;font-weight:800;font-size:58px;line-height:1.08;margin:0 0 22px}
  p{font-size:31px;line-height:1.42;margin:0;color:#e8f2f6}
  .brand{position:absolute;left:80px;bottom:34px;font-family:Inter,"Segoe UI",sans-serif;font-weight:800;font-size:20px;color:#93AABE}
  .brand b{color:#F4C95D}
  .pips{position:absolute;right:80px;bottom:40px;display:flex;gap:10px}.pips i{width:14px;height:14px;border-radius:50%;background:#2B5673}.pips i.on{background:#F4C95D;width:34px;border-radius:8px}.pips i.done{background:#35BFB2}
  </style></head><body><div class="v"><div class="pic">${esc(part.pic || "🎨")}</div><div>
  <p class="k">${esc(lessonTitle)} · Part ${n} of ${total}</p><h1>${esc(part.title)}</h1><p>${esc(part.say)}</p></div></div>
  <div class="brand"><b>Ehel Academy</b> · Grade ${cfg.grade} Art &amp; Design</div>
  <div class="pips">${Array.from({ length: total }, (_, k) => `<i class="${k + 1 < n ? "done" : k + 1 === n ? "on" : ""}"></i>`).join("")}</div></body></html>`;
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const index = {};
const missing = [];
for (const l of cfg.lessons) {
  const lesson = lessonOf(l.file);
  const lec = lesson.steps.find((s) => s.kind === "lecture");
  if (!lec) continue;
  const slug = l.file.replace(/\.html$/, "");
  const parts = lec.data.parts;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "lec-" + slug + "-"));
  const segs = [], cues = [];
  let t = 0;
  for (const [i, part] of parts.entries()) {
    /* the exact line the lecture step's Listen button speaks */
    const sentences = T.sentencesOf(part.title + ". " + part.say);
    const clips = sentences.map((s) => ({ s, f: path.join(TTS, T.cyrb53(s) + ".mp3") }));
    const absent = clips.filter((c) => !fs.existsSync(c.f));
    if (absent.length) { missing.push(...absent.map((c) => l.file + " part " + (i + 1) + ": " + c.s)); continue; }
    /* audio: the clips with the page's gap between them, then a breath */
    const list = [];
    for (const [k, c] of clips.entries()) {
      const d = ffprobeDur(c.f);
      cues.push({ start: t, end: t + d, text: c.s });
      t += d + (k < clips.length - 1 ? GAP : PART_GAP);
      list.push(c.f);
    }
    const audio = path.join(work, "a" + i + ".m4a");
    const inputs = [], filt = [];
    list.forEach((f, k) => { inputs.push("-i", f); filt.push(`[${k}:a]aresample=44100,aformat=channel_layouts=mono,apad=pad_dur=${k < list.length - 1 ? GAP : PART_GAP}[a${k}]`); });
    run([...inputs, "-filter_complex", filt.join(";") + ";" + list.map((_, k) => `[a${k}]`).join("") + `concat=n=${list.length}:v=0:a=1[out]`, "-map", "[out]", "-c:a", "aac", "-b:a", "96k", audio]);
    const dur = ffprobeDur(audio);
    /* picture: the slide, held for exactly that long */
    const png = path.join(work, "s" + i + ".png");
    await page.setContent(slideHtml(lesson.title, i + 1, parts.length, part), { waitUntil: "load" });
    await page.screenshot({ path: png });
    const seg = path.join(work, "p" + i + ".mp4");
    run(["-loop", "1", "-framerate", "12", "-t", dur.toFixed(3), "-i", png, "-i", audio,
      "-c:v", "libx264", "-tune", "stillimage", "-preset", "medium", "-crf", "28", "-pix_fmt", "yuv420p", "-r", "12",
      "-c:a", "copy", "-shortest", "-movflags", "+faststart", seg]);
    segs.push(seg);
    if (i === 0) fs.copyFileSync(png, path.join(work, "poster.png"));
  }
  if (segs.length !== parts.length) continue;
  const listFile = path.join(work, "list.txt");
  fs.writeFileSync(listFile, segs.map((s) => "file '" + s.replace(/\\/g, "/") + "'").join("\n"));
  const joined = path.join(work, "lecture.mp4");
  run(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", joined]);
  const poster = path.join(work, "poster.jpg");
  run(["-i", path.join(work, "poster.png"), "-q:v", "4", poster]);
  const vtt = "WEBVTT\n\n" + cues.map((c, k) => (k + 1) + "\n" + vttTime(c.start) + " --> " + vttTime(c.end) + "\n" + c.text + "\n").join("\n");
  /* one hash over all three, so the video, its captions and its poster move together */
  const sha = crypto.createHash("sha1").update(fs.readFileSync(joined)).update(vtt).update(fs.readFileSync(poster)).digest("hex").slice(0, 8);
  const base = slug + "." + sha;
  for (const f of fs.readdirSync(OUT)) if (f.startsWith(slug + ".") && !f.startsWith(base + ".")) fs.unlinkSync(path.join(OUT, f));
  fs.copyFileSync(joined, path.join(OUT, base + ".mp4"));
  fs.writeFileSync(path.join(OUT, base + ".vtt"), vtt);
  fs.copyFileSync(poster, path.join(OUT, base + ".jpg"));
  const seconds = Math.round(ffprobeDur(path.join(OUT, base + ".mp4")));
  index[slug] = { video: "media/lecture/" + base + ".mp4", captions: "media/lecture/" + base + ".vtt", poster: "media/lecture/" + base + ".jpg", seconds, parts: parts.length };
  const kb = Math.round(fs.statSync(path.join(OUT, base + ".mp4")).size / 1024);
  console.log("  ok   " + (base + ".mp4").padEnd(40) + String(seconds).padStart(4) + " s  " + String(kb).padStart(5) + " KB  " + cues.length + " captions");
  fs.rmSync(work, { recursive: true, force: true });
}
await browser.close();
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1) + "\n");
if (missing.length) {
  console.error("\n  " + missing.length + " lecture sentence(s) have no recording - run narrate.mjs first:");
  for (const m of missing.slice(0, 20)) console.error("    " + m);
  process.exit(1);
}
console.log("\n  " + Object.keys(index).length + " lecture videos -> media/lecture/index.json");
