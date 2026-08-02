// The one definition of Wehel's stock-phrase audio: which canonical phrases
// exist, which subjects they belong to, and how a reply sentence is matched
// back to one.
//
// The phrases themselves live in local_hubredirect/wehel_prompt.json (the
// prompt single source) — this module is the tooling view of them, shared by
// the generator (what to buy), upload-media-to-bunny.js via the subject
// narration libs (where each clip belongs in the deploy tree),
// prune-ehel-course-audio.mjs (what nothing can reach) and
// check-wehel-audio-coverage.mjs (drift gate).
//
// normalisePhrase must stay in step with the copies in wehel_chat.php and
// serve-src-preview.js — the canonicaliser only works when all three agree.
// check:wehel compares the two JS copies structurally; the PHP copy is held by
// its comment pointing here.

const fs = require("fs");
const path = require("path");
const { cyrb53, clean, MIN_CHARS } = require("./ehel-narration-hash");

const PROMPT_FILE = path.resolve(__dirname, "..", "..", "src", "moodle", "local_hubredirect", "wehel_prompt.json");

// Subjects whose course pages run the shell voice engine, and therefore can
// play phrase clips today. English's AI panel has its own audio engine with no
// static-first lookup, so its phrases are canonicalised (text consistency) but
// clips are not generated for it yet.
const CLIP_SUBJECTS = ["science", "mathematics", "computing", "global-perspectives", "intensive-english"];

function loadBank() {
  const prompt = JSON.parse(fs.readFileSync(PROMPT_FILE, "utf8"));
  return prompt.phraseBank || { global: [], subjects: {} };
}

/** Canonical phrases a subject's Wehel can speak: global + its own. */
function phrasesForSubject(subject, bank = loadBank()) {
  return [...(bank.global || []), ...((bank.subjects || {})[subject] || [])];
}

// Sentence-level matching key: lowercase, curly quotes straightened, then
// everything but letters, digits and spaces dropped. Deliberately simple —
// the PHP twin must reproduce it exactly, so no edit distance, no stemming.
function normalisePhrase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** hash -> canonical text, for one subject's speakable phrases. */
function phraseHashes(subject, bank = loadBank()) {
  const map = new Map();
  for (const phrase of phrasesForSubject(subject, bank)) {
    const text = clean(phrase);
    if (text.length >= MIN_CHARS) map.set(cyrb53(text), text);
  }
  return map;
}

module.exports = { PROMPT_FILE, CLIP_SUBJECTS, loadBank, phrasesForSubject, normalisePhrase, phraseHashes, cyrb53, clean, MIN_CHARS };
