/* The gate on an Art & Design build's recorded narration and lecture video.
 *
 *   node ../lesson-kit/check-narration.mjs --app .                  # files
 *   node ../lesson-kit/check-narration.mjs --app . --trace t.json   # + the coverage floor
 *
 * It asks the things a page cannot tell you by playing:
 *   - lib/art.js's cyrb53 is the shared one (tools/lib/ehel-narration-hash.js),
 *     so a clip named here is the clip every other subject's tooling expects;
 *   - media/tts/index.json lists exactly the clips on disk - a listed clip that
 *     is missing is a page asking for a 404, an unlisted one is money spent on
 *     a file no page can reach - and names the voice tools/lib/ehel-tts.js uses;
 *   - every clip has its words in scripts.json, and those words hash to its name;
 *   - every lecture video, caption and poster the lecture index names exists,
 *     each caption file is WebVTT, and every sentence of every lecture part is
 *     recorded (the video is built from them);
 *   - with --trace: the share of spoken lines heard in the recorded voice is at
 *     or above app.config.json's narrationFloor. The floor may rise, not fall.
 * Exit 0 clean, 1 on a finding, 2 when it could not run.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const APP = path.resolve(process.cwd(), arg("--app", "."));
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPO = path.resolve(HERE, "../../../../..");
const cant = (m) => { console.log("  cannot run: " + m); process.exit(2); };
if (!fs.existsSync(path.join(APP, "app.config.json"))) cant("no app.config.json in " + APP);
const cfg = JSON.parse(fs.readFileSync(path.join(APP, "app.config.json"), "utf8"));
const region = fs.readFileSync(path.join(HERE, "lib", "art.js"), "utf8").split("/* NARRATION-TEXT-START */")[1]?.split("/* NARRATION-TEXT-END */")[0];
if (!region) cant("lib/art.js has no NARRATION-TEXT markers");
const T = new Function(region + "; return { sentencesOf, cyrb53 };")();
const shared = require(path.join(REPO, "tools", "lib", "ehel-narration-hash.js"));
const { VOICE_ID } = require(path.join(REPO, "tools", "lib", "ehel-tts.js"));
const TTS = path.join(APP, "media", "tts");
if (!fs.existsSync(path.join(TTS, "index.json"))) cant("media/tts/index.json is missing - run narrate.mjs");

const bad = [];
const fail = (m) => { bad.push(m); console.log("  FAIL " + m); };

for (const probe of ["Red and blue make purple.", "Yes!", "Tap the lightest one first.", "A circle."]) {
  if (T.cyrb53(probe) !== shared.cyrb53(probe)) fail("lib/art.js cyrb53 disagrees with the shared hash on " + JSON.stringify(probe));
}
const index = JSON.parse(fs.readFileSync(path.join(TTS, "index.json"), "utf8"));
const scripts = fs.existsSync(path.join(TTS, "scripts.json")) ? JSON.parse(fs.readFileSync(path.join(TTS, "scripts.json"), "utf8")) : {};
if (index.voice !== VOICE_ID) fail("index.json voice " + index.voice + " is not the platform voice " + VOICE_ID);
const listed = new Set(index.clips || []);
const onDisk = new Set(fs.readdirSync(TTS).filter((f) => /^[0-9a-f]+\.mp3$/.test(f)).map((f) => f.slice(0, -4)));
if (listed.size < 100) fail("index.json lists only " + listed.size + " clips - the recording did not happen or the index was rewritten empty");
for (const h of listed) {
  const f = path.join(TTS, h + ".mp3");
  if (!onDisk.has(h)) fail("index.json lists " + h + ", which is not on disk");
  else if (fs.statSync(f).size < 1024) fail(h + ".mp3 is under 1 KB - not audio");
}
for (const h of onDisk) if (!listed.has(h)) fail(h + ".mp3 is on disk and in no index - no page can reach it");
let checked = 0;
for (const h of listed) {
  const words = scripts[h];
  if (!words) { fail(h + " has no words in scripts.json"); continue; }
  if (T.cyrb53(words) !== h) fail(h + " holds words that hash to " + T.cyrb53(words) + ": " + JSON.stringify(words));
  checked++;
}

/* every page reads the content-named copy of THIS index */
{
  const body = fs.readFileSync(path.join(TTS, "index.json"));
  const named = "index." + crypto.createHash("sha1").update(body).digest("hex").slice(0, 10) + ".json";
  const namedPath = path.join(TTS, named);
  if (!fs.existsSync(namedPath) || !fs.readFileSync(namedPath).equals(body)) fail("media/tts/" + named + " is missing or differs from index.json - run narrate.mjs --index");
  /* .html only: extraPages also lists lesson-search.json, which has no
     spoken line in it (see narrate.mjs). */
  for (const file of [...cfg.lessons.map((l) => l.file), ...(cfg.extraPages || [])].filter((f) => /\.html$/.test(f))) {
    const m = /const NARRATION_INDEX = "([^"]+)";/.exec(fs.readFileSync(path.join(APP, file), "utf8"));
    if (!m) fail(file + " carries no NARRATION_INDEX");
    else if (m[1] !== named) fail(file + " reads " + m[1] + ", not the current " + named + " - rebuild the pages");
  }
}

/* the lecture videos */
const lecIndex = path.join(APP, "media", "lecture", "index.json");
let videos = 0;
if (fs.existsSync(lecIndex)) {
  const lec = JSON.parse(fs.readFileSync(lecIndex, "utf8"));
  for (const [slug, v] of Object.entries(lec)) {
    for (const key of ["video", "captions", "poster"]) if (!fs.existsSync(path.join(APP, v[key]))) fail(slug + ": " + key + " " + v[key] + " is missing");
    const vtt = path.join(APP, v.captions);
    if (fs.existsSync(vtt) && !/^WEBVTT/.test(fs.readFileSync(vtt, "utf8"))) fail(slug + ": " + v.captions + " is not WebVTT");
    videos++;
  }
  for (const l of cfg.lessons) {
    const s = fs.readFileSync(path.join(APP, l.file), "utf8");
    const data = JSON.parse(/\n  const LESSON = (\{.*?\n  \});\n/s.exec(s)[1]);
    const st = data.steps.find((x) => x.kind === "lecture");
    if (!st) continue;
    if (!st.data.video) fail(l.file + ": the lecture step carries no video");
    for (const p of st.data.parts) for (const sen of T.sentencesOf(p.title + ". " + p.say)) if (!listed.has(T.cyrb53(sen))) fail(l.file + ": lecture sentence not recorded: " + sen);
  }
} else fail("media/lecture/index.json is missing - run build-lectures.mjs");

/* coverage, measured by the driver */
const TRACE = arg("--trace", null);
let share = null;
if (TRACE) {
  const tr = JSON.parse(fs.readFileSync(TRACE, "utf8"));
  if (!tr.lines) fail("the trace recorded no spoken lines - it did not run against these pages");
  share = tr.lines ? Math.floor(tr.recorded * 1000 / tr.lines) / 10 : 0;
  const floor = Number(cfg.narrationFloor || 0);
  if (!floor) fail("app.config.json has no narrationFloor - record the measured share there");
  else if (share < floor) fail("only " + share + "% of spoken lines are recorded, below the floor of " + floor + "%");
}
console.log("\n  " + listed.size + " clips listed, all on disk; " + checked + " scripts hash to their names; " + videos + " lecture videos" + (share != null ? "; " + share + "% of spoken lines recorded" : ""));
console.log(bad.length ? "  " + bad.length + " finding(s)\n" : "  narration clean\n");
process.exit(bad.length ? 1 : 0);
