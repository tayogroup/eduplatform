#!/usr/bin/env node
/* Make the unit lecture films of one grade app together.
 *
 *   R=tools/run-ehel-lecture-films.js
 *   node $R --app <grade app> --dry                       # the approval sheet: every film's characters and length, every
 *                                                         # line in one file, and ONE fingerprint of all of it; buys nothing
 *   node $R --app ... --preview                           # every film's stills, --jobs films at once (default 4); buys nothing
 *   node $R --app ... --sample                            # every film's cue sheets, the same way; buys nothing
 *   node $R --app ... --sweep                             # every frame of every film drawn once: errors, and anything
 *                                                         # outside the box; buys nothing. Run it before --narrate.
 *   node $R --app ... --narrate --approved <fingerprint>  # BUYS every film's narration, one film at a time
 *   node $R --app ... --render --approved <fingerprint>   # renders, --jobs films at once (default 2), each drawn by
 *                                                         # --workers browsers (default 5)
 *   --films a,b   only these storyboards (default: every lecture-video/*.json that names a renderer)
 *
 * It runs tools/create-ehel-unit-lecture.js once per film, each in its own
 * process with its own scratch directory (<temp>/ehel-unit-lecture/<slug>, the
 * film tool's own default), and keeps each run's whole output in a log there.
 * It adds nothing to what a film is: every check and every refusal is the film
 * tool's, and one film can still be made alone with that tool.
 *
 * ONE APPROVAL, BOUND TO THE WORDS. The owner approves the narration of all the
 * films at once, from --dry. --dry prints a fingerprint of every line of every
 * film it covers, and --narrate and --render refuse unless --approved is that
 * fingerprint. A line changed after the approval changes the fingerprint, so it
 * cannot be bought without going back to the owner.
 *
 * NARRATION IS BOUGHT ONE FILM AT A TIME. Two films can share a line, and two
 * processes buying it at once would pay twice and keep whichever clip landed
 * last. Buying is network time, not drawing time, so the sequence costs little.
 *
 * TWO RENDERS AT A TIME. Each render draws its frames in --workers browsers, so
 * two renders at five is ten browsers, on a 12-core machine that other work
 * shares. Previews and samples use one browser each, so four run at once.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TOOL = path.join(__dirname, "create-ehel-unit-lecture.js");

const ARGV = process.argv.slice(2);
function arg(name, fallback) {
  const eq = ARGV.find((x) => x.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = ARGV.indexOf(`--${name}`);
  if (i >= 0 && ARGV[i + 1] && !ARGV[i + 1].startsWith("--")) return ARGV[i + 1];
  return fallback;
}
const has = (name) => ARGV.some((x) => x === `--${name}` || x.startsWith(`--${name}=`));
function die(msg) { console.error("REFUSED: " + msg); process.exit(1); }

const KNOWN = new Set(["app", "films", "dry", "preview", "sample", "sweep", "narrate", "render", "approved", "jobs", "workers"]);
for (const a of ARGV) {
  if (!a.startsWith("--")) continue;
  const name = a.slice(2).split("=")[0];
  if (!KNOWN.has(name)) die(`unknown option --${name}. Known: ${[...KNOWN].map((k) => "--" + k).join(" ")}`);
}

const MODES = ["dry", "preview", "sample", "sweep", "narrate", "render"].filter(has);
if (MODES.length !== 1) die("name exactly one of --dry, --preview, --sample, --sweep, --narrate, --render");
const MODE = MODES[0];

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/* ------------------------------------------------------------- the films --- */
const app = arg("app", "");
if (!app) die("name the grade app: --app <directory>");
const appDir = path.resolve(ROOT, app);
const boardDir = path.join(appDir, "lecture-video");
if (!fs.existsSync(boardDir)) die(`${path.relative(ROOT, boardDir)} does not exist`);

const all = fs.readdirSync(boardDir).filter((f) => f.endsWith(".json")).map((f) => {
  let film;
  try { film = JSON.parse(fs.readFileSync(path.join(boardDir, f), "utf8")); }
  catch (e) { die(`lecture-video/${f} is not valid JSON: ${e.message}`); }
  return { slug: f.slice(0, -5), film };
}).filter((x) => x.film.renderer);

const wanted = String(arg("films", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
let films = all;
if (wanted.length) {
  const missing = wanted.filter((w) => !all.some((x) => x.slug === w));
  if (missing.length) die(`no storyboard that names a renderer for: ${missing.join(", ")}`);
  films = all.filter((x) => wanted.includes(x.slug));
}
if (!films.length) die(`no storyboard in ${path.relative(ROOT, boardDir)} names a renderer`);
films.sort((a, b) => (a.film.lesson || 99) - (b.film.lesson || 99) || (a.slug < b.slug ? -1 : 1));

const linesOf = (film) => film.scenes.flatMap((s) => (s.beats || []).map((b) => String(b.say || "")));
function fingerprint(list) {
  const h = crypto.createHash("sha1");
  for (const f of list.slice().sort((a, b) => (a.slug < b.slug ? -1 : 1))) h.update(f.slug + "\n" + linesOf(f.film).join("\n") + "\n\n");
  return h.digest("hex").slice(0, 10);
}
const FP = fingerprint(films);

/* ------------------------------------------------------------- running --- */
const base = path.join(os.tmpdir(), "ehel-unit-lecture");

function runOne(f, extra, logName) {
  return new Promise((resolve) => {
    const scratch = path.join(base, f.slug);
    fs.mkdirSync(scratch, { recursive: true });
    const log = path.join(scratch, `${logName}.log`);
    const out = fs.createWriteStream(log);
    const args = [TOOL, "--app", path.relative(ROOT, appDir), "--slug", f.slug].concat(extra);
    const t0 = Date.now();
    let text = "";
    const child = spawn(process.execPath, args, { cwd: ROOT, env: Object.assign({}, process.env, { CLAUDE_SCRATCH: scratch }) });
    const take = (d) => { text += d; out.write(d); };
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    child.on("close", (code) => out.end(() => resolve({ f, code, text, log, scratch, secs: (Date.now() - t0) / 1000 })));
  });
}

async function pool(items, jobs, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, async () => {
    for (;;) {
      const k = next++;
      if (k >= items.length) return;
      results[k] = await fn(items[k], k);
    }
  }));
  return results;
}

function failed(r) {
  const why = r.text.split(/\r?\n/).filter((l) => /REFUSED|Error|threw/.test(l)).slice(0, 6);
  console.log(`  FAILED ${r.f.slug} (exit ${r.code}): ${why.length ? why.join("\n    ") : "no refusal line"}\n    whole output: ${r.log}`);
}

const jobsFor = (dflt) => Math.max(1, Math.min(parseInt(arg("jobs", String(dflt)), 10) || dflt, 8));

/* --------------------------------------------------------------- modes --- */
(async function main() {
  const t0 = Date.now();

  if (MODE === "dry") {
    const rs = await pool(films, jobsFor(8), (f) => runOne(f, ["--dry"], "dry"));
    const rows = [];
    let bad = 0;
    for (const r of rs) {
      if (r.code !== 0) { failed(r); bad++; continue; }
      const head = r.text.match(/: (\d+) scenes, (\d+) beats, (\d+) characters\./);
      const buy = r.text.match(/cached (\d+) clips; (\d+) to buy \((\d+) characters\)/);
      const len = r.text.match(/(estimated|measured) length (\d+:\d\d)/);
      const covered = (r.text.match(/^\s+covered\s/gm) || []).length, missing = (r.text.match(/^\s+MISSING\s+(\S+)/gm) || []).map((l) => l.trim().split(/\s+/)[1]);
      if (!head || !buy || !len) { console.log(`  ${r.f.slug}: the film tool's --dry output was not what this runner reads; see ${r.log}`); bad++; continue; }
      rows.push({ slug: r.f.slug, lesson: r.f.film.lesson, scenes: +head[1], beats: +head[2], chars: +head[3], buy: +buy[3], clips: +buy[2], len: len[2], how: len[1], covered, missing });
    }
    const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
    console.log(`\n${path.relative(ROOT, appDir)}: ${films.length} film(s)\n`);
    console.log("  L  film                              chapters beats  chars  to buy   length      objectives");
    for (const x of rows) {
      console.log(`  ${lpad(x.lesson || "", 1)}  ${pad(x.slug, 33)} ${lpad(x.scenes, 5)} ${lpad(x.beats, 6)} ${lpad(x.chars, 6)} ${lpad(x.buy, 7)}   ${lpad(x.len, 5)} ${x.how === "measured" ? "meas" : "est "}  ` +
        `${x.covered}/${x.covered + x.missing.length}${x.missing.length ? " MISSING " + x.missing.join(",") : ""}`);
    }
    const tot = rows.reduce((a, x) => ({ beats: a.beats + x.beats, chars: a.chars + x.chars, buy: a.buy + x.buy }), { beats: 0, chars: 0, buy: 0 });
    console.log(`     ${pad("all", 33)} ${lpad("", 5)} ${lpad(tot.beats, 6)} ${lpad(tot.chars, 6)} ${lpad(tot.buy, 7)}`);

    /* every line, for the owner to read before approving */
    fs.mkdirSync(base, { recursive: true });
    const sheet = path.join(base, `script-${FP}.txt`);
    fs.writeFileSync(sheet, films.map((f) => {
      const x = f.film;
      return `==== Lesson ${x.lesson}: ${x.title} (${f.slug}) ====\n` + x.scenes.map((s) =>
        `\n-- ${s.heading || s.id}${(s.codes || []).length ? "  [" + s.codes.join(", ") + "]" : ""}\n` +
        s.beats.map((b) => "  " + b.say).join("\n")).join("\n") + "\n";
    }).join("\n"), "utf8");
    console.log(`\n  every line: ${sheet}`);
    console.log(`  fingerprint ${FP}  (${films.length} film(s); --narrate and --render need --approved ${FP})`);
    if (bad) { console.log(`\n  ${bad} film(s) could not be read; nothing to approve until they are.`); process.exitCode = 1; }
    console.log("\n--dry: nothing was bought and nothing was rendered.");
    return;
  }

  if (MODE === "preview" || MODE === "sample" || MODE === "sweep") {
    const jobs = jobsFor(4);
    console.log(`${films.length} film(s), --${MODE}, ${jobs} at a time. Nothing is bought.`);
    let bad = 0;
    await pool(films, jobs, async (f) => {
      const r = await runOne(f, [`--${MODE}`], MODE);
      if (r.code !== 0) { failed(r); bad++; return; }
      const timing = (r.text.match(/timing: (ESTIMATED|MEASURED)/) || [])[1] || "?";
      const what = MODE === "sweep"
        ? ((r.text.match(/swept (\d+) frames/) || [])[0] || "") + ", " +
          ((r.text.match(/drawn outside the 1168 x 440 box at (\d+) moment/) || [])[1] ? `OUTSIDE THE BOX at ${r.text.match(/at (\d+) moment/)[1]} moment(s), see the log` : "nothing outside the box") + ", no errors"
        : (r.text.match(/(\d+) frames in [\d.]+ s/) || [])[0] || (r.text.match(/(\d+) preview stills/) || [])[0] || "";
      console.log(`  ok  ${f.slug.padEnd(33)} ${r.secs.toFixed(0).padStart(4)} s  ${timing.toLowerCase()} timing  ${what}  -> ${MODE === "sweep" ? r.log : path.join(r.scratch, MODE)}`);
    });
    console.log(`\n${films.length - bad} of ${films.length} in ${mmss((Date.now() - t0) / 1000)}.`);
    if (bad) process.exitCode = 1;
    return;
  }

  /* the paid modes */
  const approved = arg("approved", "");
  if (!approved) die(`--${MODE} buys narration. Show the owner --dry first; if they approve, pass --approved ${FP}.`);
  if (approved !== FP) die(`--approved ${approved} is not these scripts: they fingerprint as ${FP} now, so a line has changed ` +
    "since the approval (or a different set of films is named). Show the owner --dry again.");

  if (MODE === "narrate") {
    console.log(`${films.length} film(s): buying narration one film at a time (scripts ${FP}, approved).`);
    for (const f of films) {
      const r = await runOne(f, ["--narrate"], "narrate");
      if (r.code !== 0) { failed(r); die(`stopped at ${f.slug}; the films after it were not narrated.`); }
      const bought = (r.text.match(/ bought$/gm) || []).length, len = (r.text.match(/measured length: [\d.]+ s \((\d+:\d\d)\)/) || [])[1] || "?";
      console.log(`  ok  ${f.slug.padEnd(33)} ${String(bought).padStart(3)} clip(s) bought   measured ${len}`);
    }
    console.log(`\nEvery film is narrated. Next: --sample, which now runs on the measured timeline.`);
    return;
  }

  if (MODE === "render") {
    const jobs = jobsFor(2), workers = Math.max(1, Math.min(parseInt(arg("workers", "5"), 10) || 5, 12));
    console.log(`${films.length} film(s): rendering ${jobs} at a time, ${workers} browsers each (scripts ${FP}, approved).`);
    const done = [];
    let bad = 0;
    await pool(films, jobs, async (f) => {
      const r = await runOne(f, ["--workers", String(workers)], "render");
      if (r.code !== 0) { failed(r); bad++; return; }
      const name = (k) => (r.text.match(new RegExp(`"${k}": "(lecture-video/[^"]+)"`)) || [])[1];
      const mp4 = (r.text.match(/(\S+\.mp4)\s+([\d.]+) MB\s+([\d.]+)s/) || []);
      done.push({ f, src: name("src"), captions: name("captions"), poster: name("poster"), mb: mp4[2], secs: +mp4[3] });
      console.log(`  ok  ${f.slug.padEnd(33)} ${mmss(r.secs)} to make   ${mp4[1] || "?"}  ${mp4[3] ? mmss(+mp4[3]) : "?"}  ${mp4[2] || "?"} MB`);
    });
    console.log(`\n${films.length - bad} of ${films.length} rendered in ${mmss((Date.now() - t0) / 1000)}.`);
    for (const d of done.sort((a, b) => (a.f.film.lesson || 0) - (b.f.film.lesson || 0))) {
      console.log(`\n  Lesson ${d.f.film.lesson} (${d.f.slug}):`);
      for (const k of ["src", "captions", "poster"]) console.log(`    "${k}": "${d[k] || "?"}"`);
    }
    if (bad) process.exitCode = 1;
  }
})();
