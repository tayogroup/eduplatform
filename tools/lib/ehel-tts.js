// The one definition of how Ehel Academy talks to ElevenLabs.
//
// Six generators each carried their own copy of this — science, mathematics,
// computing, global-perspectives, english and wehel — byte-identical except
// where one of them had been fixed. That is what made the copies worth
// collapsing: they had already drifted, and every drift was a fix that only
// reached one course.
//
//   - english alone had a request timeout. Without it a stalled connection
//     hangs the run forever, because fetch has no default timeout.
//   - computing and mathematics had each learned, separately and days apart,
//     that a stale key must not be retried.
//   - science, global-perspectives and wehel still had neither.
//
// This file is the union of what those copies knew. Change the voice, the model
// or the failure handling HERE; a generator that needs different settings passes
// them in rather than forking the function.

// A run of underscores is a fill-in-the-blank marker meant to be SEEN, never
// spoken — but ElevenLabs does not treat it as silent. Grade 1 Unit 1's
// "My name is ___. I am ___ years old. I like ___." came back as "My name is
// Da Christal. I am a Christal a years old. I like Da Christal way so.": the
// model hallucinates a word to fill the position instead of skipping it, and
// three blanks in one sentence made three different hallucinations. Confirmed
// by transcribing the actual recording, not by inspecting the source text.
//
// Not wired into tts() itself: this is a content transform, not a transport
// concern, and the fix belongs where a course's narration is COMPOSED, so a
// caller opts in explicitly rather than every subject's audio silently
// changing shape. Call this on narration text before tts(), never on text
// that will be DISPLAYED — the visual blank a learner fills in must stay
// "___".
function speakableBlanks(text) {
  return String(text).replace(/_{2,}/g, "blank");
}

// A bare hyphen between two single letters ("A-Z", "a-m", "Parts A-C") is not
// reliably read as "to" — ElevenLabs drops it, says "dash", or runs the
// letters together. Confirmed 2026-08-18 from a user report on Grade 1 Unit
// 0's own lecture: "Connect letters a-z" and "Week 2: Phonics (Letter Sounds
// a-m)" both came out wrong. Same failure family as speakableBlanks() above,
// same fix shape: rewrite only what is SENT to the voice, never the displayed
// text — a learner reading along must still see "A-Z", not "A to Z".
//
// Deliberately leaves 3+-segment chains alone: "c-a-t", "m-a-t", "A-a-apple"
// are phonics blending notation, spoken letter-by-letter on purpose, not a
// range, and "c to a to t" would be a worse bug than the one this fixes. The
// lookahead-into-backreference below captures the MAXIMAL run of single
// letters joined by hyphens/en-dashes before deciding anything, so a 2-letter
// range inside a longer chain (the "A-a" in "A-a-apple") is never peeled off
// on its own — ordinary backtracking would do exactly that with a simpler
// pattern, which is the bug this shape avoids.
//
// A same-letter case pair ("A-a", "M-m", from "join each big letter to its
// small partner") is not a range either — "A to a" reads like it skips
// nothing, so it gets its own phrasing instead.
const LETTER_CHAIN_RE = /\b(?=([A-Za-z](?:[-–][A-Za-z])+))\1(?![-–]?[A-Za-z])/g;
function speakableLetterRanges(text) {
  return String(text).replace(LETTER_CHAIN_RE, (_, chain) => {
    const parts = chain.split(/[-–]/);
    if (parts.length !== 2) return chain; // phonics blend or longer — leave untouched
    const [a, b] = parts;
    if (a !== b && a.toLowerCase() === b.toLowerCase()) {
      const upper = a === a.toUpperCase() ? a : b;
      const lower = a === a.toLowerCase() ? a : b;
      return `capital ${upper}, lowercase ${lower}`;
    }
    return `${a} to ${b}`;
  });
}

const API_BASE = "https://api.elevenlabs.io/v1";
const VOICE_ID = "XfNU2rGpBa01ckF309OY";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.62, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true };
// Named DELIVERIES of the one approved voice: the same speaker, read differently.
// `standard` is VOICE_SETTINGS above and what every clip in the course was made
// with. `lively` is the owner's ask of 2026-09-02 for the Grade 1 Core words —
// "a voice style children can relate to" — with the scripts untouched: lower
// stability lets the pitch move the way a storyteller's does, and a higher
// style weight brings out the speaker's own warmth rather than a flat read.
// similarity_boost stays where it is, because it is what keeps this the SAME
// voice; pushing style much past 0.5 on eleven_multilingual_v2 starts to buy
// artefacts rather than expression, so this sits below that line.
//
// A preset is a name so the descriptor a generator writes can record which one
// made the clip (`delivery`), and so two runs cannot hold two slightly
// different "lively" objects. A change here is a voice change for every clip
// recorded under the name — same rule as VOICE_ID.
//
// Each preset names its VOICE as well as its settings, since 2026-09-02
// evening: `lively` was measured against the standard read across all 240
// Grade 1 Unit 1 Core-words clips and made no audible difference (pitch
// movement 2.34 vs 2.38 semitones, same duration, same loudness range) — the
// stability/style knobs barely move this voice on eleven_multilingual_v2. A
// read children relate to had to be a different SPEAKER. `alice` is ElevenLabs'
// stock British voice of that name, chosen by the owner from eight samples: the
// widest pitch movement of the set (17 semitones against the standard read's
// 7), clear articulation, and a pace the app's 0.80x Grade 1 playback brings
// back to today's. In use for Grade 1 Unit 1 Core words only, as a test.
const DELIVERIES = {
  standard: { voiceId: VOICE_ID, settings: VOICE_SETTINGS },
  lively: { voiceId: VOICE_ID, settings: { stability: 0.42, similarity_boost: 0.82, style: 0.45, use_speaker_boost: true } },
  alice: { voiceId: "Xb7hH8MSUJpSbSDYk0k2", settings: { stability: 0.45, similarity_boost: 0.8, style: 0.4, use_speaker_boost: true } },
};
const OUTPUT_FORMAT = "mp3_44100_128";
// Long enough for the slowest legitimate clip, short enough that a dead
// connection fails instead of hanging the run until someone notices.
const TIMEOUT_MS = 120000;

// Not every failure is worth retrying, and treating them alike is how a run with
// a stale key spent twenty-two minutes failing: every clip attempted three times
// with backoff, each certain to fail for the same reason, with the answer in the
// first response body.
//
//   FatalTtsError     — the credential or the account. Every remaining clip
//                       fails identically; the caller should stop the run.
//   PermanentTtsError — this text will never be accepted. One attempt, record
//                       it, move to the next clip.
//   Error             — transient: rate limits, gateway errors, a dropped or
//                       timed-out connection. Retry.
class FatalTtsError extends Error {}
class PermanentTtsError extends Error {}

/** Render `text` to an mp3 Buffer, or throw one of the three kinds above. */
async function tts(text, { voiceId = VOICE_ID, modelId = MODEL_ID, voiceSettings = VOICE_SETTINGS, timeoutMs = TIMEOUT_MS } = {}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new FatalTtsError("ELEVENLABS_API_KEY is not set (check .env).");
  let r;
  try {
    r = await fetch(`${API_BASE}/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    // A timeout or a dropped connection is worth another go, and arrives here
    // rather than as a status — so it must stay an ordinary Error.
    throw new Error(`ElevenLabs request failed: ${e.name}: ${e.message}`.slice(0, 300));
  }
  if (r.ok) {
    // The same signal aborts the response stream, so a stalled download rejects
    // here instead of hanging — no separate guard needed.
    try { return Buffer.from(await r.arrayBuffer()); }
    catch (e) { throw new Error(`ElevenLabs download failed: ${e.name}: ${e.message}`.slice(0, 300)); }
  }
  const body = (await r.text()).slice(0, 300);
  const message = `ElevenLabs ${r.status}: ${body}`;
  // 401 is the documented auth status, but a rejected key also comes back as
  // 400 with an authentication_error body — which is exactly what an old-format
  // key (one not starting "sk_") returns. Matching on status alone sends that
  // one back round the retry loop. Quota exhaustion arrives the same way.
  const isAuth = r.status === 401 || r.status === 403
    || /authentication_error|invalid_api_key|quota_exceeded|missing_permissions/.test(body);
  if (isAuth) throw new FatalTtsError(message);
  if (r.status === 429 || r.status >= 500) throw new Error(message);
  if (r.status >= 400) throw new PermanentTtsError(message);
  throw new Error(message);
}

module.exports = {
  tts, speakableBlanks, speakableLetterRanges, FatalTtsError, PermanentTtsError,
  API_BASE, VOICE_ID, MODEL_ID, VOICE_SETTINGS, DELIVERIES, OUTPUT_FORMAT, TIMEOUT_MS,
};
