#!/usr/bin/env node
/* Narration for the restructured Intensive English programme
   (src/prototypes/ehel-academy/intensive-english/program).

   DRY BY DEFAULT. Nothing is sent to ElevenLabs, and nothing is billed, unless
   the command line says --pay. An option this tool does not know stops it with
   the usage below. That includes --help: other generators here have treated an
   unknown flag as a full, paid run.

     node tools/generate-ehel-intensive-programme-audio.js                   dry run: what is missing, per level and category
     node tools/generate-ehel-intensive-programme-audio.js --emit-scripts s.json
                                                  dry run, and write exactly what WOULD be sent, to read first
     node tools/generate-ehel-intensive-programme-audio.js --level starter,level-1 --pay
     node tools/generate-ehel-intensive-programme-audio.js --pay --budget 50000 --concurrency 4

   What to record comes from the programme's builder (build_program.py), which
   writes program/kit/narration/<level>.json: every clip a page can play, its
   displayed text (which names the clip), its voice, and for Letters & Sounds the
   Phonics unit that decides how letters are voiced. Words and example sentences
   are Alice and everything else the standard voice, as in the live course; in a
   conversation, speakers alternate between the two.

   A clip is written to intensive-english/media/audio/tts/<key>.mp3 through a
   .part file, and one that already exists is never re-recorded. Upload with
   tools/upload-media-to-bunny.js intensive-english, which serves programme clips
   from media/intensive-english/g10..g15 (tools/lib/ehel-intensive-narration.js).
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { tts, speakableFrames, speakableWords, DELIVERIES, FatalTtsError, PermanentTtsError } = require("./lib/ehel-tts");
const { speakablePhonics } = require("./lib/ehel-phonics-speech");

const ROOT = path.resolve(__dirname, "..");
const COURSE = path.join(ROOT, "src", "prototypes", "ehel-academy", "intensive-english");
const MANIFESTS = path.join(COURSE, "program", "kit", "narration");
const OUT_DIR = path.join(COURSE, "media", "audio", "tts");

const USAGE = `usage: node tools/generate-ehel-intensive-programme-audio.js [--level a,b] [--category c,d]
         [--emit-scripts <file>] [--budget <chars>] [--concurrency <n>] [--pay]
  Without --pay nothing is sent or billed.`;

function args(argv) {
  const o = { pay: false, levels: null, categories: null, emit: null, budget: Infinity, concurrency: 4 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) { console.error(`${a} needs a value\n${USAGE}`); process.exit(2); }
      return v;
    };
    if (a === "--pay") o.pay = true;
    else if (a === "--level") o.levels = value().split(",");
    else if (a === "--category") o.categories = value().split(",");
    else if (a === "--emit-scripts") o.emit = value();
    else if (a === "--budget") o.budget = Number(value());
    else if (a === "--concurrency") o.concurrency = Math.max(1, Math.min(8, Number(value()) || 1));
    else { console.error(`Unknown option ${a}. Nothing was sent.\n${USAGE}`); process.exit(2); }
  }
  if (!(o.budget > 0)) { console.error(`--budget must be a positive number\n${USAGE}`); process.exit(2); }
  return o;
}

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

/* The programme's own notation, said the way a teacher would read it. A rule
   card is written for the eye ("am, is, are + verb + -ing", "make → making");
   read literally the voice says "plus" and "minus ing". Only what is SENT
   changes; the clip keeps the displayed text's name. */
function speakableProgramme(s) {
  return String(s)
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s*→\s*/g, ", ")
    .replace(/\s+=\s+/g, " means ")
    .replace(/\s+\+\s+/g, ", then ")
    .replace(/(^|[\s(])-(ing|ed|er|est|es|s|ly)\b/g, "$1$2")
    .replace(/\s+–\s+/g, ", ")
    .replace(/(\w)\s*\/\s*(\w)/g, "$1 or $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function spokenFor(item) {
  let s = item.speech || item.text;
  if (Number.isInteger(item.phonicsUnit)) s = speakablePhonics(s, { spelling: item.phonicsUnit >= 15 });
  return speakableWords(speakableFrames(speakableProgramme(s)));
}

function queue(o) {
  const files = fs.existsSync(MANIFESTS) ? fs.readdirSync(MANIFESTS).filter((f) => f.endsWith(".json")).sort() : [];
  if (!files.length) { console.error(`No manifests in ${MANIFESTS}: run program/kit/build_program.py first.`); process.exit(1); }
  const seen = new Set(), todo = [], refused = [];
  let have = 0;
  for (const f of files) {
    const doc = JSON.parse(fs.readFileSync(path.join(MANIFESTS, f), "utf8"));
    if (o.levels && !o.levels.includes(doc.level)) continue;
    for (const it of doc.items) {
      if (o.categories && !o.categories.includes(it.category)) continue;
      if (seen.has(it.key)) continue;
      seen.add(it.key);
      const file = path.join(OUT_DIR, `${it.key}.mp3`);
      if (fs.existsSync(file) && fs.statSync(file).size > 1000) { have += 1; continue; }
      if (!DELIVERIES[it.delivery]) throw new Error(`${doc.level}: unknown delivery ${it.delivery} for ${it.key}`);
      const spoken = spokenFor(it);
      // a blank the voice would read as "underscore": give the item a `speech`
      if (/_{2,}/.test(spoken)) { refused.push({ level: doc.level, key: it.key, text: it.text }); continue; }
      todo.push({ level: doc.level, lesson: it.lesson, category: it.category, delivery: it.delivery, key: it.key, text: it.text, spoken, chars: spoken.length });
    }
  }
  if (o.levels) for (const l of o.levels) if (!files.includes(`${l}.json`)) { console.error(`No manifest for level ${l}.`); process.exit(2); }
  return { todo, have, refused };
}

function report({ todo, have, refused }) {
  const by = new Map();
  for (const t of todo) {
    const k = `${t.level}|${t.category}|${t.delivery}`;
    const v = by.get(k) || { clips: 0, chars: 0 };
    v.clips += 1; v.chars += t.chars; by.set(k, v);
  }
  console.log("\n  level      category       voice      clips   characters");
  for (const [k, v] of [...by].sort()) {
    const [l, c, d] = k.split("|");
    console.log(`  ${l.padEnd(10)} ${c.padEnd(14)} ${d.padEnd(9)} ${String(v.clips).padStart(6)} ${v.chars.toLocaleString().padStart(12)}`);
  }
  const total = todo.reduce((a, t) => a + t.chars, 0);
  console.log(`\n  already recorded: ${have.toLocaleString()} clips`);
  console.log(`  TO RECORD: ${todo.length.toLocaleString()} clips, ${total.toLocaleString()} characters`);
  if (refused.length) {
    console.log(`  REFUSED (a ___ blank would be read aloud; give the item a "speech"): ${refused.length}`);
    for (const r of refused.slice(0, 10)) console.log(`    ${r.level} ${r.key}: ${r.text.slice(0, 80)}`);
  }
  return total;
}

async function speak(item) {
  const d = DELIVERIES[item.delivery];
  for (let attempt = 1; ; attempt++) {
    try {
      return await tts(item.spoken, { voiceId: d.voiceId, voiceSettings: d.settings });
    } catch (e) {
      if (e instanceof FatalTtsError || e instanceof PermanentTtsError || attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function main() {
  const o = args(process.argv.slice(2));
  const q = queue(o);
  report(q);
  if (o.emit) {
    const out = {};
    for (const t of q.todo) out[t.key] = { level: t.level, lesson: t.lesson, category: t.category, voice: t.delivery, text: t.text, spoken: t.spoken };
    fs.writeFileSync(o.emit, JSON.stringify(out, null, 1) + "\n");
    console.log(`  scripts written to ${o.emit}`);
  }
  if (!o.pay) { console.log("\n  DRY RUN: nothing sent, nothing billed. Add --pay to record."); return; }
  if (!q.todo.length) { console.log("\n  Nothing to record."); return; }
  loadEnv();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let sent = 0, made = 0, next = 0, stop = null;
  const failed = [];
  const worker = async () => {
    while (!stop && next < q.todo.length) {
      const item = q.todo[next++];
      if (sent + item.chars > o.budget) { stop = stop || `budget ${o.budget.toLocaleString()} reached`; return; }
      sent += item.chars;
      try {
        const audio = await speak(item);
        const file = path.join(OUT_DIR, `${item.key}.mp3`);
        fs.writeFileSync(`${file}.part`, audio);
        fs.renameSync(`${file}.part`, file);
        made += 1;
        if (made % 50 === 0) console.log(`  ${made}/${q.todo.length} clips | ${sent.toLocaleString()} characters`);
      } catch (e) {
        sent -= item.chars;
        if (e instanceof FatalTtsError) { stop = stop || e.message; return; }
        failed.push(`${item.level} ${item.key}: ${e.message.slice(0, 120)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: o.concurrency }, worker));
  console.log(`\n  Done: ${made.toLocaleString()} clips, ${sent.toLocaleString()} characters sent.`);
  if (failed.length) { console.log(`  ${failed.length} failed:`); failed.slice(0, 20).forEach((f) => console.log("    " + f)); }
  if (stop) { console.log(`  STOPPED: ${stop}`); process.exitCode = 1; }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
