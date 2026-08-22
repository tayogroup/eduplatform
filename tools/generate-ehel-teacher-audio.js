#!/usr/bin/env node
// Narration for the Grade 1 "Teach me the activity" scripts — the clips the
// app plays instead of rendering the teacher's opening live (owner decision
// 2026-08-20). One MP3 per script, named cyrb53(text).mp3 — edit the script
// and it mints a new filename, so an old clip becomes an orphan the way every
// narrated course here works — rendered through Deepgram's /v1/speak with
// Wehel's voice (aura-2-thalia-en, the same voice wehel_speak.php proxies).
//
// Clips land beside the scripts, under the content tier:
//   src/prototypes/ehel-academy/<subject>/grade-1/data/teacher-audio/<hash>.mp3
// so upload-content-to-bunny.js carries them to content/<subject>/g01/teacher-audio/
// and the app resolves them from the same data root it reads the scripts from.
// Deepgram bills per character — always --dry first.
//
// Usage:
//   node tools/generate-ehel-teacher-audio.js --dry
//   node tools/generate-ehel-teacher-audio.js [--subject science] [--force]
//   node tools/generate-ehel-teacher-audio.js --orphans [--prune]

const fs = require("fs");
const path = require("path");
// Which subjects, where the scripts and clips live, and what is hashed into a
// clip's name (the speakable text): the one definition in
// tools/lib/ehel-teacher-scripts.js, shared with the generator and the check.
const { SUBJECTS: SUBJECT_DEFS, scriptsFileFor, audioDirFor, speakable, scriptHash } = require("./lib/ehel-teacher-scripts");

const ROOT = path.resolve(__dirname, "..");
const SUBJECTS = Object.keys(SUBJECT_DEFS);
const MODEL = process.env.WEHEL_SPEAK_MODEL || "aura-2-thalia-en";
const CHUNK_LIMIT = 1900; // Deepgram caps one /v1/speak request at 2000 characters

for (const line of fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/) : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback; };
// Refuse what it does not know: a typo must not silently become "everything".
for (const arg of argv) {
  if (!["--dry", "--force", "--orphans", "--prune", "--subject"].includes(arg) && !(argv[argv.indexOf(arg) - 1] === "--subject")) {
    console.error(`Unknown argument ${arg}`); process.exit(2);
  }
}
const DRY = flag("--dry"), FORCE = flag("--force"), ORPHANS = flag("--orphans"), PRUNE = flag("--prune");
const ONLY = opt("--subject", null);

function chunks(text) {
  const out = [];
  let current = "";
  for (const sentence of text.split(/(?<=[.!?…])\s+/)) {
    if (!current) current = sentence;
    else if (`${current} ${sentence}`.length <= CHUNK_LIMIT) current = `${current} ${sentence}`;
    else { out.push(current); current = sentence; }
  }
  if (current) out.push(current);
  return out.flatMap((c) => { const p = []; for (let at = 0; at < c.length; at += CHUNK_LIMIT) p.push(c.slice(at, at + CHUNK_LIMIT)); return p; });
}

async function render(text) {
  const parts = [];
  for (const chunk of chunks(text)) {
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(MODEL)}`, {
      method: "POST",
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: chunk }),
    });
    if (!response.ok) throw new Error(`Deepgram ${response.status}: ${(await response.text()).slice(0, 200)}`);
    parts.push(Buffer.from(await response.arrayBuffer()));
  }
  return Buffer.concat(parts);
}

// Deepgram synthesises ~45 seconds of speech per script and answers in one
// piece, so a render takes tens of seconds; four in flight keeps a subject's
// run to minutes instead of hours without leaning on the API.
const CONCURRENCY = 4;
async function mapLimit(items, limit, fn) {
  let at = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (at < items.length) { const index = at++; await fn(items[index]); }
  }));
}

(async () => {
  let planned = 0, rendered = 0, skipped = 0, chars = 0, failed = 0;
  for (const subject of SUBJECTS) {
    if (ONLY && subject !== ONLY) continue;
    const scriptsFile = scriptsFileFor(subject);
    if (!fs.existsSync(scriptsFile)) { console.log(`${subject}: no teacher-scripts.json yet`); continue; }
    const scripts = JSON.parse(fs.readFileSync(scriptsFile, "utf8"));
    const audioDir = audioDirFor(subject);
    fs.mkdirSync(audioDir, { recursive: true });
    const wanted = new Set();
    const jobs = [];
    for (const [unitNo, sections] of Object.entries(scripts.units || {})) {
      for (const [sectionId, entry] of Object.entries(sections)) {
        // The hash is over the text the voice will read — so a script whose
        // stored hash disagrees with its text is caught here, not in the app.
        const spoken = speakable(entry.text);
        const hash = scriptHash(entry.text);
        if (entry.hash !== hash) {
          entry.hash = hash; // a script hashed before the shared definition existed; keep the file truthful
        }
        wanted.add(hash);
        planned += 1;
        const file = path.join(audioDir, `${hash}.mp3`);
        if (fs.existsSync(file) && fs.statSync(file).size > 1024 && !FORCE) { skipped += 1; continue; }
        chars += spoken.length;
        if (DRY || ORPHANS) continue;
        jobs.push({ unitNo, sectionId, spoken, hash, file });
      }
    }
    if (jobs.length && !process.env.DEEPGRAM_API_KEY) { console.error("DEEPGRAM_API_KEY is not set (.env)"); process.exit(2); }
    await mapLimit(jobs, CONCURRENCY, async (job) => {
      try {
        fs.writeFileSync(job.file, await render(job.spoken));
        rendered += 1;
        console.log(`  ✓ ${subject} u${job.unitNo} ${job.sectionId} → ${job.hash}.mp3 (${job.spoken.length} chars)`);
      } catch (error) {
        failed += 1;
        console.error(`  ✗ ${subject} u${job.unitNo} ${job.sectionId}: ${error.message}`);
      }
    });
    // Write back any hash the loop corrected — by RE-READING the file first and
    // changing only `hash` fields. A narration run takes a long time, and the
    // generator (or a backfill) may have written the same file meanwhile;
    // writing this run's stale in-memory copy back whole would erase that work.
    // (It did: the `ask` markers on 121 English scripts were wiped this way.)
    const corrections = [];
    for (const [unitNo, sections] of Object.entries(scripts.units || {})) {
      for (const [sectionId, entry] of Object.entries(sections)) corrections.push([unitNo, sectionId, entry.hash]);
    }
    const fresh = JSON.parse(fs.readFileSync(scriptsFile, "utf8"));
    let changed = false;
    for (const [unitNo, sectionId, hash] of corrections) {
      const entry = fresh.units?.[unitNo]?.[sectionId];
      // Only correct an entry whose text still matches what this run hashed —
      // a regenerated entry (different text) keeps its own hash and marker.
      if (entry && entry.hash !== hash && scriptHash(entry.text) === hash) { entry.hash = hash; changed = true; }
    }
    if (changed) fs.writeFileSync(scriptsFile, `${JSON.stringify(fresh, null, 2)}\n`);
    if (ORPHANS) {
      const orphans = fs.readdirSync(audioDir).filter((f) => f.endsWith(".mp3") && !wanted.has(f.slice(0, -4)));
      console.log(`${subject}: ${orphans.length} orphan clip(s)${orphans.length ? ` — ${orphans.slice(0, 5).join(", ")}${orphans.length > 5 ? " …" : ""}` : ""}`);
      if (PRUNE) for (const f of orphans) fs.unlinkSync(path.join(audioDir, f));
    }
  }
  console.log(`\n${DRY ? "DRY: " : ""}planned ${planned}, already rendered ${skipped}, ${DRY ? "to render" : "rendered"} ${DRY ? planned - skipped : rendered} (${chars} characters${DRY ? " to bill" : ""}), failed ${failed}`);
  process.exit(failed ? 1 : 0);
})();
