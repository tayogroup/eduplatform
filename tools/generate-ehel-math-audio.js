#!/usr/bin/env node
// Pre-generates ElevenLabs narration for the Mathematics course as static
// files, one per Listen button, named by cyrb53(text) so the UI
// (mathematics/shared/course-ui.js) finds them at ./media/audio/tts/<hash>.mp3.
//
// The hash and text-normalisation MUST stay byte-for-byte identical to the UI.
// Idempotent (existing >1 KB files reused) and resumable. Reports characters
// sent (ElevenLabs bills per character) and stops at an optional --budget cap.
//
// Usage:
//   node tools/generate-ehel-math-audio.js [category ...] [grade ...] [--dry] [--budget N] [--force]
//   categories: see tools/lib/ehel-math-narration.js (default = all of them, so
//   no Listen button is left falling back to the paid runtime endpoint)

const fs = require("fs");
const path = require("path");

// One definition of what maths narrates, shared with the pruner and the
// coverage check, over the hash in lib/ehel-narration-hash.js. Previously this
// file carried its own copies of cyrb53, clean and the per-category templates;
// three copies of the same thing is how the pruner came to count 102 more
// reachable strings than the generator.
const narration = require("./lib/ehel-math-narration");

const ROOT = path.resolve(__dirname, "..");
const MATH = path.join(ROOT, "src", "prototypes", "ehel-academy", "mathematics");
const OUT_DIR = path.join(MATH, "media", "audio", "tts");
const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";

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

// Hash, normalisation and the exact text of every Listen button come from the
// shared definition, so what is bought here is what the pruner keeps and the
// coverage check verifies. Confirmed byte-identical to the copies this file
// used to carry: 5,626 shared-category strings, zero differences.
const { cyrb53, clean, textsForUnit, textsForCapstone } = narration;

// Not every failure is worth retrying, and treating them all alike is how a run
// with a stale key spent twenty-two minutes failing: 136 clips × 3 attempts ×
// backoff, each one certain to fail for the same reason, with the answer sitting
// in the very first response body. `--budget` could not stop it either, since it
// counts characters SENT and a failing run sends none.
//
//   fatal      — the credential or the account is the problem. Every remaining
//                clip will fail identically, so the run stops on the first one
//                and prints what the API actually said.
//   permanent  — this text will never be accepted (a malformed request). One
//                attempt, record it, move to the next clip.
//   transient  — rate limits, gateway errors, a dropped connection. Retry.
class FatalApiError extends Error {}
class PermanentClipError extends Error {}

async function tts(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new FatalApiError("ELEVENLABS_API_KEY is not set (check .env).");
  const r = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: { stability: 0.62, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true } }),
  });
  if (r.ok) return Buffer.from(await r.arrayBuffer());
  const body = (await r.text()).slice(0, 300);
  const message = `ElevenLabs ${r.status}: ${body}`;
  // ElevenLabs reports a bad or missing key as 400 with an authentication_error
  // payload, not only as 401 — a stale key reads as "Bad Request" unless the
  // body is looked at. Quota exhaustion arrives the same way.
  const isAuth = r.status === 401 || r.status === 403
    || /authentication_error|invalid_api_key|quota_exceeded|missing_permissions/.test(body);
  if (isAuth) throw new FatalApiError(message);
  if (r.status === 429 || r.status >= 500) throw new Error(message);
  if (r.status >= 400) throw new PermanentClipError(message);
  throw new Error(message);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // De-dup by hash across the whole run (same text on different pages → one file).
  const seen = new Set();
  const queue = [];
  const enqueue = (raw) => {
    const c = clean(raw);
    if (c.length < narration.MIN_CHARS) return;
    const key = cyrb53(c);
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ key, text: c, chars: c.length });
  };
  for (const grade of gradeList) {
    const dir = path.join(MATH, `grade-${grade}`, "data", "units");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const unit = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const cat of catList) textsForUnit(unit, cat).forEach(enqueue);
    }
    // The capstone lives beside the units, not inside them, and carries its own
    // Listen buttons — driving question, each stage, and the capstone quiz.
    const capstoneFile = path.join(MATH, `grade-${grade}`, "data", "grade-capstone.json");
    if (fs.existsSync(capstoneFile)) {
      const capstone = JSON.parse(fs.readFileSync(capstoneFile, "utf8"));
      for (const cat of catList) textsForCapstone(capstone, cat).forEach(enqueue);
    }
  }
  const totalChars = queue.reduce((s, q) => s + q.chars, 0);
  console.log(`categories: ${catList.join(",")} | grades: ${gradeList.join(",")}`);
  console.log(`unique clips: ${queue.length} | total characters: ${totalChars.toLocaleString()}${dry ? " (DRY RUN)" : ""}`);
  if (dry) return;

  let sent = 0, made = 0, reused = 0;
  // A clip that exhausts its retries is simply absent afterwards, and the file
  // is named by a hash, so nothing downstream can tell a missing clip from one
  // that was never queued. Track them and exit non-zero so a gap is visible.
  const failed = [];
  // Nothing has succeeded yet and clips keep failing: the run is broken in a way
  // the per-clip classification did not catch. Stop and say so rather than
  // walking the whole queue to prove it.
  const GIVE_UP_AFTER = 5;
  let consecutiveFailures = 0;
  let stoppedEarly = null;
  // Progress is written line by line, so a redirected run shows what it is doing
  // instead of sitting on a block buffer until the first flush — which is how a
  // failing run looked identical to a hung one.
  const say = (line) => { process.stdout.write(`${line}\n`); };
  for (const item of queue) {
    const out = path.join(OUT_DIR, `${item.key}.mp3`);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 1000) { reused += 1; continue; }
    if (sent + item.chars > budget) { say(`\nBudget cap ${budget.toLocaleString()} reached — stopping (spent ${sent.toLocaleString()}).`); break; }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
      try {
        fs.writeFileSync(out, await tts(item.text));
        sent += item.chars; made += 1; ok = true;
        say(`${item.key} (${item.chars} chars)… ok`);
      } catch (e) {
        // The credential or the account: every remaining clip fails the same
        // way, so there is nothing to learn from trying them.
        if (e instanceof FatalApiError) { stoppedEarly = e.message; break; }
        if (e instanceof PermanentClipError) { say(`${item.key}: ${e.message.slice(0, 120)}`); break; }
        say(`${item.key} retry ${attempt}: ${e.message.slice(0, 70)}`);
        if (attempt < 3) await sleep(1500 * attempt);
      }
    }
    if (stoppedEarly) break;
    if (ok) consecutiveFailures = 0;
    else {
      failed.push(item);
      consecutiveFailures += 1;
      if (consecutiveFailures >= GIVE_UP_AFTER && made === 0) {
        stoppedEarly = `${GIVE_UP_AFTER} clips failed in a row and none has succeeded.`;
        break;
      }
    }
    await sleep(350);
  }
  say("\n──────── summary ────────");
  say(`generated: ${made} | reused: ${reused} | characters sent: ${sent.toLocaleString()}`);
  if (stoppedEarly) {
    console.error(`\nSTOPPED: ${stoppedEarly}`);
    console.error(`   ${queue.length - made - reused - failed.length} clip(s) were not attempted. Fix the cause and re-run — this is idempotent, so nothing already written is paid for twice.`);
    process.exitCode = 1;
    return;
  }
  if (failed.length) {
    console.error(`\nFAILED after 3 attempts: ${failed.length} clip(s) — re-run to fill the gaps.`);
    for (const item of failed.slice(0, 20)) console.error(`  ${item.key} (${item.chars} chars) ${item.text.slice(0, 60)}…`);
    if (failed.length > 20) console.error(`  …and ${failed.length - 20} more`);
    process.exitCode = 1;
  }
})();
