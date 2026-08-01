#!/usr/bin/env node
// Uploads course media to the Bunny Storage zone under "Ehel Primary/media/…".
// Idempotent & resumable: a local manifest records uploaded remote paths, so a
// reaped run resumes without re-sending. Access key comes from env (BUNNY_KEY),
// never hard-coded.
//
// Usage: BUNNY_KEY=… node tools/upload-media-to-bunny.js [english|mathematics|science|computing]…
//   (no subject args = all four)

const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const ZONE = "ehelacademy";
const ROOT_FOLDER = "Ehel Primary";
const STORAGE = "https://storage.bunnycdn.com";
const KEY = process.env.BUNNY_KEY;
const MANIFEST = path.join(ROOT, ".bunny-upload-manifest.json");
const CONCURRENCY = 10;

if (!KEY) { console.error("BUNNY_KEY not set"); process.exit(1); }
const subjects = process.argv.slice(2).filter((s) => ["english", "mathematics", "science", "computing"].includes(s));
const subjectList = subjects.length ? subjects : ["english", "mathematics", "science", "computing"];

// Science narration text, hashes and per-grade placement come from the shared
// module the generator and pruner use. This file used to carry its own copy,
// which fell behind: it still mapped Real Problems by an older text shape and
// knew nothing of the practice, game, word-card, assessment or capstone
// buttons, so those clips landed in _unmapped/ — uploaded, paid for, and never
// requested by the app.
const scienceNarration = require("./lib/ehel-science-narration");
const { cyrb53, clean } = scienceNarration;

// Computing keeps its clips out of git entirely (see .gitignore): they are a
// deploy artifact, generated locally and shipped straight to the CDN. That
// makes this upload the only copy that reaches anyone, so a clip missed here
// is a Listen button that silently falls back to the paid runtime endpoint.
const computingNarration = require("./lib/ehel-computing-narration");

// Mathematics has its own, smaller set of narrated categories. These mirror
// tools/generate-ehel-math-audio.js exactly — including realProblems reading
// the prompt alone, which the copy in this file used to get wrong.
const MATH_CATS = ["concepts", "explorations", "visualModels", "methods", "workedExamples", "realProblems"];
function mathTextsForUnit(unit, category) {
  switch (category) {
    case "concepts": return (unit.concepts || []).map((c) => `${c.title}. ${c.explanation}. Example: ${c.example}`);
    case "explorations": return (unit.explorations || []).map((e) => `${e.title}. ${e.context}. ${e.explanation}`);
    case "visualModels": return (unit.visualModels || []).map((m) => `${m.title}. ${m.purpose}`);
    case "methods": return (unit.methods || []).map((m) => `${m.title}. Example: ${m.example}. ${(m.steps || []).join(" ")}`);
    case "workedExamples": return (unit.workedExamples || []).map((w) => `${w.title}. ${w.prompt}. Solution: ${w.solution}`);
    case "realProblems": return (unit.realProblems || []).map((p) => p.prompt);
    default: return [];
  }
}

function mathematicsHashGradeMap() {
  const map = new Map();
  for (let g = 1; g <= 12; g += 1) {
    const dir = path.join(EHEL, "mathematics", `grade-${g}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of MATH_CATS) for (const t of mathTextsForUnit(unit, cat)) {
        const c = clean(t);
        if (c.length < 8) continue;
        const key = cyrb53(c);
        if (!map.has(key)) map.set(key, new Set());
        map.get(key).add(g);
      }
    }
  }
  return map;
}

// Build the [{local, remote}] upload list.
function buildList() {
  const list = [];
  if (subjectList.includes("english")) {
    const base = path.join(EHEL, "english", "media", "audio");
    for (let g = 1; g <= 12; g += 1) {
      for (const cat of ["readings", "grammar", "speaking", "vocabulary", "dictionary"]) {
        const d = path.join(base, `grade-${g}`, cat);
        if (!fs.existsSync(d)) continue;
        for (const f of fs.readdirSync(d)) if (f.endsWith(".mp3"))
          list.push({ local: path.join(d, f), remote: `media/english/g${String(g).padStart(2, "0")}/audio/${cat}/${f}` });
      }
    }
  }
  for (const subject of ["mathematics", "science", "computing"]) {
    if (!subjectList.includes(subject)) continue;
    const ttsDir = path.join(EHEL, subject, "media", "audio", "tts");
    if (!fs.existsSync(ttsDir)) continue;
    const map = subject === "science"
      ? scienceNarration.hashGradeMap(path.join(EHEL, "science"))
      : subject === "computing"
        ? computingNarration.hashGradeMap(path.join(EHEL, "computing"))
        : mathematicsHashGradeMap();
    let orphans = 0;
    for (const f of fs.readdirSync(ttsDir)) {
      if (!f.endsWith(".mp3")) continue;
      const hash = f.replace(/\.mp3$/, "");
      const grades = map.get(hash);
      // No grade claims this text, so no Listen button can ask for it. It used
      // to be uploaded to _unmapped/, a path no UI ever requests — bandwidth
      // and storage spent on a file that could not be played. Leave it local
      // and say so; tools/prune-ehel-course-audio.mjs clears them out.
      if (!grades) { orphans += 1; continue; }
      for (const g of grades) list.push({ local: path.join(ttsDir, f), remote: `media/${subject}/g${String(g).padStart(2, "0")}/audio/tts/${f}` });
    }
    if (orphans) console.log(`  ${subject}: ${orphans} unreachable tts file(s) skipped — run tools/prune-ehel-course-audio.mjs ${subject}`);
  }
  return list;
}

async function put(remote, buf) {
  const url = `${STORAGE}/${ZONE}/` + encodeURI(`${ROOT_FOLDER}/${remote}`);
  const r = await fetch(url, { method: "PUT", headers: { AccessKey: KEY, "Content-Type": "application/octet-stream" }, body: buf });
  if (!r.ok && r.status !== 201) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
}

(async () => {
  const manifest = fs.existsSync(MANIFEST) ? new Set(JSON.parse(fs.readFileSync(MANIFEST, "utf8"))) : new Set();
  const all = buildList();
  const todo = all.filter((x) => !manifest.has(x.remote));
  const bytes = todo.reduce((s, x) => s + fs.statSync(x.local).size, 0);
  console.log(`subjects: ${subjectList.join(",")} | total: ${all.length} | already uploaded: ${all.length - todo.length} | to upload: ${todo.length} (${(bytes / 1048576).toFixed(0)} MB)`);
  let done = 0, failed = 0, since = 0;
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify([...manifest]));
  let idx = 0;
  async function worker() {
    while (idx < todo.length) {
      const item = todo[idx++];
      let ok = false;
      for (let a = 1; a <= 4 && !ok; a += 1) {
        try { await put(item.remote, fs.readFileSync(item.local)); ok = true; }
        catch (e) { if (a === 4) { failed += 1; console.log(`FAIL ${item.remote}: ${e.message}`); } else await new Promise((r) => setTimeout(r, 800 * a)); }
      }
      if (ok) { manifest.add(item.remote); done += 1; since += 1; }
      if (since >= 100) { since = 0; save(); process.stdout.write(`  …${done}/${todo.length} uploaded\n`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  console.log(`\n──────── done ──────── uploaded: ${done} | failed: ${failed} | manifest: ${manifest.size}`);
})();
