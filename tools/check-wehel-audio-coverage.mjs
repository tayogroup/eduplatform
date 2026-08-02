// Gate on Wehel's stock-phrase audio system. A phrase clip is only ever played
// when four things agree — the bank text (wehel_prompt.json), the
// canonicaliser in each endpoint twin, the sentence splitter in the shell, and
// the clip on disk named cyrb53(text).mp3. This checks the agreements that a
// one-character edit would silently break.
//
// Usage: node tools/check-wehel-audio-coverage.mjs [--require-clips]
//   Missing clip files are a warning by default (they simply have not been
//   generated yet); --require-clips makes them failures for release gating.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EHEL = path.join(ROOT, "src", "prototypes", "ehel-academy");
const lib = require("./lib/ehel-wehel-phrases.js");
const { CLIP_SUBJECTS, loadBank, phrasesForSubject, normalisePhrase, phraseHashes, clean, MIN_CHARS } = lib;

const requireClips = process.argv.includes("--require-clips");
const failures = [];
const warnings = [];

const bank = loadBank();
const allSubjects = [...new Set([...CLIP_SUBJECTS, ...Object.keys(bank.subjects || {})])];

// 1. Every phrase is speakable and unambiguous.
for (const subject of allSubjects) {
  const seen = new Map();
  for (const phrase of phrasesForSubject(subject, bank)) {
    if (clean(phrase).length < MIN_CHARS) failures.push(`phrase shorter than MIN_CHARS (${MIN_CHARS}): "${phrase}"`);
    if (phrase.includes("{{")) failures.push(`phrase contains a template placeholder: "${phrase}"`);
    const key = normalisePhrase(phrase);
    if (!key) failures.push(`phrase normalises to nothing: "${phrase}"`);
    if (seen.has(key) && seen.get(key) !== phrase) {
      failures.push(`ambiguous canonicalisation in ${subject}: "${phrase}" vs "${seen.get(key)}"`);
    }
    seen.set(key, phrase);
  }
}

// 2. The prompt template actually injects the bank.
const promptData = JSON.parse(fs.readFileSync(lib.PROMPT_FILE, "utf8"));
if (!promptData.template.some((line) => line.includes("{{STOCK_PHRASES}}"))) {
  failures.push("wehel_prompt.json template no longer contains {{STOCK_PHRASES}} — the bank is never shown to the model.");
}

// 3. The sentence splitter is identical everywhere it exists. One regex,
//    three files: split differently and the canonicalised sentence the server
//    produced is not the sentence the player hashes.
const SPLITTER = "(?<=[.!?…])\\s+";
for (const [file, label] of [
  [path.join(ROOT, "tools", "serve-src-preview.js"), "dev endpoint canonicaliser"],
  [path.join(ROOT, "src", "moodle", "local_hubredirect", "wehel_chat.php"), "production canonicaliser"],
  [path.join(EHEL, "shell", "course-app.js"), "shell sentence playback"],
]) {
  if (!fs.readFileSync(file, "utf8").includes(SPLITTER)) {
    failures.push(`${label} (${path.relative(ROOT, file)}) does not contain the shared sentence splitter ${SPLITTER}`);
  }
}

// 4. The PHP normaliser still mirrors normalisePhrase (structural check on its
//    distinctive character class — a full re-implementation diff is
//    impossible from here, but this catches the likely edit).
const php = fs.readFileSync(path.join(ROOT, "src", "moodle", "local_hubredirect", "wehel_chat.php"), "utf8");
if (!php.includes("[^a-z0-9\\s]")) {
  failures.push("wehel_chat.php normaliser lost its [^a-z0-9\\s] strip — it no longer mirrors ehel-wehel-phrases.js.");
}
const devServer = fs.readFileSync(path.join(ROOT, "tools", "serve-src-preview.js"), "utf8");
if (!devServer.includes("ehel-wehel-phrases")) {
  failures.push("serve-src-preview.js no longer uses lib/ehel-wehel-phrases.js — its canonicaliser can drift.");
}

// 5. Clip coverage per subject.
for (const subject of CLIP_SUBJECTS) {
  const dir = path.join(EHEL, subject, "media", "audio", "tts");
  let missing = 0;
  for (const [hash] of phraseHashes(subject, bank)) {
    const file = path.join(dir, `${hash}.mp3`);
    if (!fs.existsSync(file) || fs.statSync(file).size <= 1024) missing += 1;
  }
  if (missing) {
    const message = `${subject}: ${missing}/${phraseHashes(subject, bank).size} phrase clip(s) not generated yet (tools/generate-ehel-wehel-audio.js)`;
    (requireClips ? failures : warnings).push(message);
  }
}

for (const warning of warnings) console.log(`  warning: ${warning}`);
if (failures.length) {
  console.error(`✗ ${failures.length} wehel audio failure(s):`);
  for (const failure of failures) console.error(`   ${failure}`);
  process.exit(1);
}
console.log(`✓ wehel phrase audio: ${allSubjects.length} subject banks consistent, splitter and canonicaliser in step${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
