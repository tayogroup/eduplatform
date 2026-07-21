#!/usr/bin/env node
// Uploads course media to the Bunny Storage zone under "Ehel Primary/media/…".
// Idempotent & resumable: a local manifest records uploaded remote paths, so a
// reaped run resumes without re-sending. Access key comes from env (BUNNY_KEY),
// never hard-coded.
//
// Usage: BUNNY_KEY=… node tools/upload-media-to-bunny.js [english|mathematics|science]…
//   (no subject args = all three)

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
const subjects = process.argv.slice(2).filter((s) => ["english", "mathematics", "science"].includes(s));
const subjectList = subjects.length ? subjects : ["english", "mathematics", "science"];

// --- cyrb53, identical to the generators + UIs ---
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();
function textsForUnit(u, cat) {
  switch (cat) {
    case "concepts": return (u.concepts || []).map((c) => `${c.title}. ${c.explanation}. Example: ${c.example}`);
    case "explorations": return (u.explorations || []).map((e) => `${e.title}. ${e.context}. ${e.explanation}`);
    case "visualModels": return (u.visualModels || []).map((m) => `${m.title}. ${m.purpose}`);
    case "methods": return (u.methods || []).map((m) => `${m.title}. Example: ${m.example}. ${(m.steps || []).join(" ")}`);
    case "workedExamples": return (u.workedExamples || []).map((w) => `${w.title}. ${w.prompt}. Solution: ${w.solution}`);
    case "realProblems": return (u.realProblems || []).map((p) => `${p.context}. ${p.prompt}`);
    default: return [];
  }
}
const CATS = ["concepts", "explorations", "visualModels", "methods", "workedExamples", "realProblems"];

// Map each tts hash → the grade(s) it belongs to (for per-grade placement).
function hashGradeMap(subject) {
  const map = new Map();
  for (let g = 1; g <= 12; g += 1) {
    const dir = path.join(EHEL, subject, `grade-${g}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const u = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of CATS) for (const t of textsForUnit(u, cat)) {
        const c = clean(t); if (c.length < 8) continue;
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
      for (const cat of ["readings", "grammar", "speaking"]) {
        const d = path.join(base, `grade-${g}`, cat);
        if (!fs.existsSync(d)) continue;
        for (const f of fs.readdirSync(d)) if (f.endsWith(".mp3"))
          list.push({ local: path.join(d, f), remote: `media/english/g${String(g).padStart(2, "0")}/audio/${cat}/${f}` });
      }
    }
  }
  for (const subject of ["mathematics", "science"]) {
    if (!subjectList.includes(subject)) continue;
    const ttsDir = path.join(EHEL, subject, "media", "audio", "tts");
    if (!fs.existsSync(ttsDir)) continue;
    const map = hashGradeMap(subject);
    let orphans = 0;
    for (const f of fs.readdirSync(ttsDir)) {
      if (!f.endsWith(".mp3")) continue;
      const hash = f.replace(/\.mp3$/, "");
      const grades = map.get(hash);
      if (!grades) { orphans += 1; list.push({ local: path.join(ttsDir, f), remote: `media/${subject}/_unmapped/audio/tts/${f}` }); continue; }
      for (const g of grades) list.push({ local: path.join(ttsDir, f), remote: `media/${subject}/g${String(g).padStart(2, "0")}/audio/tts/${f}` });
    }
    if (orphans) console.log(`  ${subject}: ${orphans} unmapped tts files → _unmapped/`);
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
