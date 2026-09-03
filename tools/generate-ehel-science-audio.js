#!/usr/bin/env node
// Pre-generates ElevenLabs narration for the Science course as static
// files, one per Listen button, named by cyrb53(text) so the UI
// (science/shared/course-ui.js) finds them at ./media/audio/tts/<hash>.mp3.
//
// The hash and text-normalisation MUST stay byte-for-byte identical to the UI.
// Idempotent (existing >1 KB files reused) and resumable. Reports characters
// sent (ElevenLabs bills per character) and stops at an optional --budget cap.
//
// Usage:
//   node tools/generate-ehel-science-audio.js [category ...] [grade ...] [--dry] [--budget N] [--force]
//   categories: see ALL_CATS below (default = every one, so no Listen button
//   is left falling back to the runtime endpoint)

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MATH = path.join(ROOT, "src", "prototypes", "ehel-academy", "science");
const OUT_DIR = path.join(MATH, "media", "audio", "tts");

const narration = require("./lib/ehel-science-narration");
const ALL_CATS = narration.CATEGORIES;
const args = process.argv.slice(2);
const cats = args.filter((a) => ALL_CATS.includes(a));
const catList = cats.length ? cats : ALL_CATS;
const grades = args.filter((a) => /^[1-8]$/.test(a)).map(Number);
const gradeList = grades.length ? grades : [1, 2, 3, 4, 5, 6, 7, 8];
const dry = args.includes("--dry");
const force = args.includes("--force");
const budgetArg = args.indexOf("--budget");
const budget = budgetArg >= 0 ? Number(args[budgetArg + 1]) : Infinity;

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

const { cyrb53, clean } = narration;

// What each Listen button says, and what its clip is called, both live in
// tools/lib/ehel-science-narration.js so the uploader and pruner agree.
const { textsForUnit, textsForCapstone } = narration;

// One definition of how this project talks to ElevenLabs, shared with the other
// generators: the voice, the model, the request timeout, and which of the three
// kinds a failure is — fatal (the credential or the account, stop the run),
// permanent (this text, one attempt) or transient (retry). See
// tools/lib/ehel-tts.js.
const { tts, speakableFrames, speakableWords, FatalTtsError, PermanentTtsError } = require("./lib/ehel-tts");

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // De-dup by hash across the whole run (same text on different pages → one file).
  const seen = new Set();
  const queue = [];
  const enqueue = (raw) => {
    const c = clean(raw);
    if (c.length < 8) return;
    // The clip is looked up by cyrb53 of the DISPLAYED text — the UI knows
    // nothing of this transform — so `key` stays on `c`, unchanged. `spoken`
    // is what actually goes to ElevenLabs: speakableFrames() reads a slash
    // the way a teacher would ("living / not living" -> "living or not
    // living"; "km/h" -> "km per h") rather than saying "/" aloud.
    const key = cyrb53(c);
    if (seen.has(key)) return;
    seen.add(key);
    const spoken = speakableWords(speakableFrames(c));
    queue.push({ key, text: c, spoken, chars: spoken.length });
  };
  for (const grade of gradeList) {
    const dir = path.join(MATH, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of catList) textsForUnit(unit, cat).forEach(enqueue);
    }
    const capstoneFile = path.join(MATH, `grade-${grade}`, "data", "grade-capstone.json");
    if (fs.existsSync(capstoneFile)) {
      const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
      for (const cat of catList) textsForCapstone(capstone, cat).forEach(enqueue);
    }
    // The tutoring topic lessons live beside the units (tutor-lessons/), one
    // clip per Understand-step section — RAW composition, no spokenText; see
    // the lib for why.
    if (catList.includes("tutorLessons")) narration.textsForTutorLessons(MATH, grade).forEach(enqueue);
  }
  const totalChars = queue.reduce((s, q) => s + q.chars, 0);
  console.log(`categories: ${catList.join(",")} | grades: ${gradeList.join(",")}`);
  console.log(`unique clips: ${queue.length} | total characters: ${totalChars.toLocaleString()}${dry ? " (DRY RUN)" : ""}`);
  if (dry) return;

  let sent = 0, made = 0, reused = 0, failed = 0;
  // Set by a FatalTtsError: the credential or the account, so every remaining
  // clip would fail the same way.
  let fatal = null;
  // Nothing has succeeded and clips keep failing: the run is broken in a way the
  // per-clip classification did not catch. Stop rather than walking the whole
  // queue to prove it — a 422 storm used to skip all 492 clips in three minutes
  // and still exit 0, reporting success for a run that generated nothing.
  const GIVE_UP_AFTER = 5;
  let consecutiveFailures = 0;
  for (const item of queue) {
    const out = path.join(OUT_DIR, `${item.key}.mp3`);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 1000) { reused += 1; continue; }
    if (sent + item.chars > budget) { console.log(`\nBudget cap ${budget.toLocaleString()} reached — stopping (spent ${sent.toLocaleString()}).`); break; }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        process.stdout.write(`${item.key} (${item.chars} chars)… `);
        fs.writeFileSync(out, await tts(item.spoken));
        sent += item.chars; made += 1; ok = true;
        console.log("ok");
      } catch (e) {
        // The three kinds the shared helper distinguishes. Retrying a stale key
        // or a rejected text just spends wall-clock proving the same answer.
        if (e instanceof FatalTtsError) { fatal = e.message; break; }
        if (e instanceof PermanentTtsError) { console.log(`skipped: ${e.message.slice(0, 120)}`); break; }
        console.log(`retry ${attempt}: ${e.message.slice(0, 70)}`);
        if (attempt < 3) await sleep(1500 * attempt);
      }
    }
    if (fatal) break;
    if (ok) consecutiveFailures = 0;
    else {
      failed += 1;
      consecutiveFailures += 1;
      if (consecutiveFailures >= GIVE_UP_AFTER && made === 0) {
        fatal = `${GIVE_UP_AFTER} clips failed in a row and none has succeeded.`;
        break;
      }
    }
    await sleep(350);
  }
  console.log("\n──────── summary ────────");
  console.log(`generated: ${made} | reused: ${reused} | failed: ${failed} | characters sent: ${sent.toLocaleString()}`);
  if (fatal) {
    console.error(`\nSTOPPED: ${fatal}`);
    console.error("   Fix the cause and re-run — this is idempotent, so nothing already written is paid for twice.");
    process.exitCode = 1;
  } else if (failed) {
    // A clip that failed is simply absent afterwards, and the file is named by a
    // hash, so nothing downstream can tell it from one that was never queued.
    console.error(`\n${failed} clip(s) failed — re-run to fill the gaps.`);
    process.exitCode = 1;
  }
})();
