#!/usr/bin/env node
// Pre-generates ElevenLabs audio for Wehel's stock phrases — the canonical
// sentences in local_hubredirect/wehel_prompt.json's phraseBank. Clips are
// named cyrb53(text).mp3 and written into EACH shell-voice subject's local
// cache (media/audio/tts/), where the shell's sentence-level playback finds
// them; a global phrase is paid for ONCE and its bytes copied to every
// subject.
//
// The phrase texts, hash and subjects all come from
// tools/lib/ehel-wehel-phrases.js (single definition, shared with the subject
// narration libs so upload-media-to-bunny.js and prune-ehel-course-audio.mjs
// agree). English's AI panel has its own audio engine with no static lookup,
// so no clips are generated for it.
//
// Idempotent (existing >1 KB files reused). ElevenLabs bills per character —
// ALWAYS run --dry first.
//
// Usage:
//   node tools/generate-ehel-wehel-audio.js [subject ...] [--dry] [--budget N] [--force]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");

const { CLIP_SUBJECTS, phraseHashes } = require("./lib/ehel-wehel-phrases");

const args = process.argv.slice(2);
const subjects = args.filter((a) => CLIP_SUBJECTS.includes(a));
const flags = args.filter((a) => a.startsWith("--"));
const budgetArg = args.indexOf("--budget");
// A typo must not silently widen the run to everything — this is billed work.
const known = new Set([...subjects, "--dry", "--budget", "--force", ...(budgetArg >= 0 ? [args[budgetArg + 1]] : [])]);
const unknown = args.filter((a) => !known.has(a));
if (unknown.length) {
  console.error(`Unrecognised argument(s): ${unknown.join(", ")}\nSubjects: ${CLIP_SUBJECTS.join(", ")}; flags: --dry, --budget N, --force`);
  process.exit(1);
}
const subjectList = subjects.length ? subjects : CLIP_SUBJECTS;
const dry = flags.includes("--dry");
const force = flags.includes("--force");
const budget = budgetArg >= 0 ? Number(args[budgetArg + 1]) : Infinity;
if (budgetArg >= 0 && !Number.isFinite(budget)) {
  console.error("--budget needs a number of characters.");
  process.exit(1);
}

function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadDotEnv();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One definition of how this project talks to ElevenLabs, shared with the other
// generators: the voice, the model, the request timeout, and which of the three
// kinds a failure is — fatal (the credential or the account, stop the run),
// permanent (this text, one attempt) or transient (retry). See
// tools/lib/ehel-tts.js.
const { tts, FatalTtsError, PermanentTtsError } = require("./lib/ehel-tts");

(async () => {
  // hash -> { text, targets: [file, ...] } across every requested subject, so
  // a phrase shared by all subjects is one generation and several copies.
  const jobs = new Map();
  for (const subject of subjectList) {
    const outDir = path.join(EHEL, subject, "media", "audio", "tts");
    fs.mkdirSync(outDir, { recursive: true });
    for (const [hash, text] of phraseHashes(subject)) {
      const file = path.join(outDir, `${hash}.mp3`);
      if (!force && fs.existsSync(file) && fs.statSync(file).size > 1024) continue;
      if (!jobs.has(hash)) jobs.set(hash, { text, targets: [] });
      jobs.get(hash).targets.push(file);
    }
  }

  const totalChars = [...jobs.values()].reduce((sum, job) => sum + job.text.length, 0);
  const totalFiles = [...jobs.values()].reduce((sum, job) => sum + job.targets.length, 0);
  console.log(`${jobs.size} phrase(s) to generate (${totalFiles} file(s) across ${subjectList.join(", ")}), ${totalChars} characters.`);
  if (dry) {
    for (const [hash, job] of jobs) console.log(`  ${hash}  ${job.text.length} ch  ×${job.targets.length}  ${job.text}`);
    console.log("--dry: nothing sent.");
    return;
  }

  let spent = 0, made = 0;
  for (const [hash, job] of jobs) {
    if (spent + job.text.length > budget) {
      console.log(`Budget reached (${spent}/${budget} characters) — stopping. Re-run to continue.`);
      break;
    }
    // A copy may already exist under another subject; reuse its bytes free.
    const existing = CLIP_SUBJECTS.map((s) => path.join(EHEL, s, "media", "audio", "tts", `${hash}.mp3`))
      .find((f) => fs.existsSync(f) && fs.statSync(f).size > 1024);
    const audio = existing ? fs.readFileSync(existing) : await tts(job.text);
    if (!existing) { spent += job.text.length; made += 1; await sleep(400); }
    for (const target of job.targets) fs.writeFileSync(target, audio);
    console.log(`  ${existing ? "copied" : "made"}  ${hash}  ${job.text}`);
  }
  console.log(`Done: ${made} generated (${spent} characters billed), ${jobs.size - made} reused/copied.`);
})().catch((error) => { console.error(error.message); process.exit(1); });
