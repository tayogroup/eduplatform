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

// The owner's rule for frames and slashes, 2026-09-03: "This is a / an ___" is
// narrated as
//
//   Fill in the blank: This is a ... Fill in the blank: This is an ...
//
// — one sentence per alternative, the blank a PAUSE rather than the word
// "blank" (a child hears "This is a blank" as a sentence about an object called
// a blank), and never a slash. The voice reads "/" as "slash", drops it, or
// runs "a an" together; none of those is the frame the page shows.
//
// A slash means four different things in this content, and each is read the
// way a teacher would read it aloud:
//
//   a choice in brackets   "___ (two / too)"          →  "..., two or too,"
//   two bare alternatives  "a / an", "There is / There are"
//                            in a frame WITH a blank  →  the expansion above
//                            anywhere else            →  "a or an"
//   a list of three+       "am / is / are"            →  "am, is, are"
//                          "is / Karim / cleaning"    →  "is, Karim, cleaning"
//   a line break           "Stop. / Go.", poem lines  →  dropped
//
// A tight pair with no spaces ("Yes/No", "he/she/it") is a choice too.
//
// "Fill in the blank:" is said once per clip, before the FIRST sentence with a
// blank — unless something earlier in the same clip has already told the
// learner there is a gap ("Write the missing word", "Fill each gap", "Finish
// each sentence"), in which case saying it again is noise. The a / an
// expansion carries it on every alternative regardless, because that is what
// separates the two readings for the ear.
//
// Same contract as speakableBlanks(): narration text only, never display text.
// It REPLACES speakableBlanks() in English narration; that function stays for
// the tools that mirror its rule. Python and Node do not share a module, so
// tools/lib/ehel_speakable_frames.py is a hand-kept port — the gate
// check-ehel-speakable-frames.mjs runs the same cases through both.
const BLANK_RE = /_{2,}/g;
// The pause and the comma this transform INSERTS are held as private-use
// characters while the text is tidied, and written out as "..." (the form
// ElevenLabs documents as a pause) and "," at the end. Tidying only ever
// touches these two, so text with no blank and no slash comes out byte for
// byte as it went in — the first version tidied every comma and ellipsis in
// the course and would have re-recorded 60 clips that had nothing to fix.
const PAUSE = "\uE000";
const CHOICE_COMMA = "\uE001";
const GAP_ANNOUNCED_RE = /\b(blank|gap|missing|fill|complete|finish)\w*/i;
// Where a span may be split for the frame rules: sentence ends (with a closing
// quote), colons and semicolons, the " | " and line-marker separators the
// grammar practice uses, opening quotes, and line breaks. Kept as a capture so
// the delimiters survive the split and are written back unchanged.
const SPAN_SPLIT_RE = /(\|\s+|\d{1,2}[.)]\s+|(?:[.!?]+|…)["”’']?\s+|[:;]\s+|(?:^|\s)\(?[a-h]\)\s|[“"‘]|\n+)/;

function joinChoices(items) {
  if (items.length <= 1) return items.join("");
  if (/^(not|no)$/i.test(items[0])) return items.join(", ");
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

function wordCount(s) {
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}

// The start of the sentence a blank belongs to, inside a span that has already
// been split at the coarse boundaries: after a quote that opens a spoken model
// ("Say 'This is my ___'"). An apostrophe inside a word ("don't") is not one.
function anchorIndex(span) {
  const first = span.search(/_{2,}|\s\/\s/);
  const head = first >= 0 ? span.slice(0, first) : span;
  const re = /(?:^|[\s:(])['‘"“]/g;
  let best = 0;
  let m;
  while ((m = re.exec(head))) best = m.index + m[0].length;
  return best;
}

const BLANK_TEST = /_{2,}/;

function tidy(s) {
  return s
    .replace(/(\uE000\s*){2,}/g, "\uE000 ")           // two blanks in a row are one pause
    .replace(/\uE000\s*\.(?!\.)/g, "\uE000")           // a full stop straight after the pause
    .replace(/\s+\uE001/g, "\uE001")
    .replace(/\uE001\s*\uE001/g, "\uE001")
    .replace(/\uE001\s*([.!?;:,])/g, "$1")
    .replace(/([.!?;:,])\s*\uE001\s*/g, "$1 ")         // a bracket choice after a sentence end
    .replace(/(^|\d[.)]\s|\|\s|[“"‘]|\s')\s*\uE001\s*/g, "$1")
    .replace(/\uE001(?=\s+\d{1,2}[.)]\s|\s*$|\s*\|\s)/g, ".")
    .replace(/\uE001/g, ",")
    .replace(/\uE000/g, "...")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function speakableSpan(span, state) {
  const lead = span.slice(0, anchorIndex(span));
  let body = span.slice(lead.length);
  // A slash after punctuation or after a blank is a line break, not a choice.
  body = body.replace(/^\s*\/\s+/, "").replace(/([_.,!?;:”"’'])\s\/\s/g, "$1 ");
  // The sentence's own closing punctuation and quote are set aside so the
  // expansion below can write two sentences and close the quote once, after
  // the second — "…is an ...”", not "…is a ...”. Fill in the blank: …an ...”".
  const tail = (body.match(/[.!?]*["”’']*\s*$/) || [""])[0];
  body = body.slice(0, body.length - tail.length);
  const hasBlank = BLANK_TEST.test(body);
  const parts = body.split(/\s\/\s/);
  if (parts.length > 1) {
    // Group consecutive slashes into runs: a slash joins the run before it when
    // the text between them is a short item (three words or fewer).
    const runs = [];
    for (let i = 1; i < parts.length; i += 1) {
      const last = runs[runs.length - 1];
      if (last && wordCount(parts[i - 1]) <= 3 && last.end === i - 1) last.end = i;
      else runs.push({ start: i - 1, end: i });
    }
    const allPairs = runs.every((r) => r.end - r.start === 1);
    if (hasBlank && allPairs) {
      // The frame expansion. For each pair the right-hand item is the words
      // after the slash up to the blank (three at most), and the left-hand item
      // is the same number of words before the slash — "There is / There are
      // ___" pairs "There is" with "There are", "a / an ___" pairs "a" with "an".
      const pairs = [];
      let ok = true;
      for (const r of runs) {
        const after = parts[r.end].match(/^((?:[^\s_]+\s+){0,2}[^\s_]+)(?=\s*_{2,})/);
        if (!after) { ok = false; break; }
        const n = wordCount(after[1]);
        const before = parts[r.start].match(new RegExp(`((?:\\S+\\s+){${n - 1}}\\S+)\\s*$`));
        if (!before) { ok = false; break; }
        pairs.push({ left: before[1], right: after[1] });
      }
      if (ok) {
        const version = (side) => {
          let out = "";
          for (let i = 0; i < parts.length; i += 1) {
            if (i === 0) out += parts[0];
            else {
              const pair = pairs[i - 1];
              out = side === "left"
                ? `${out}${parts[i].slice(pair.right.length)}`
                : `${out.slice(0, out.length - pair.left.length)}${pair.right}${parts[i].slice(pair.right.length)}`;
            }
          }
          return out.replace(BLANK_RE, PAUSE).trim();
        };
        state.prefixed = true;
        return `${lead}Fill in the blank: ${version("left")}. Fill in the blank: ${version("right")}${tail}`;
      }
    }
    // No frame to expand: a pair is "X or Y", a longer run is a comma list.
    let out = parts[0];
    for (const r of runs) {
      const sep = r.end - r.start === 1 ? " or " : ", ";
      for (let i = r.start + 1; i <= r.end; i += 1) out += sep + parts[i];
    }
    body = out;
  }
  if (hasBlank) {
    const announce = !state.prefixed && !state.gapAnnounced;
    state.prefixed = state.prefixed || announce;
    body = `${announce ? "Fill in the blank: " : ""}${body.replace(BLANK_RE, PAUSE)}`;
  }
  return lead + body + tail;
}

function speakableFrames(text) {
  let s = String(text);
  // Choices in brackets: "(two / too)" → ", two or too,".
  s = s.replace(/\(([^()]*?\s\/\s[^()]*?)\)/g, (_, inner) => `${CHOICE_COMMA} ${joinChoices(inner.split(/\s\/\s/).map((t) => t.trim()).filter(Boolean))}${CHOICE_COMMA}`);
  // Tight pairs and chains: "Yes/No" → "Yes or No", "he/she/it" → "he, she, it".
  s = s.replace(/\b[A-Za-z][A-Za-z'’-]*(?:\/[A-Za-z][A-Za-z'’-]*)+\b/g, (chain) => {
    const items = chain.split("/");
    return items.length === 2 ? `${items[0]} or ${items[1]}` : items.join(", ");
  });
  const pieces = s.split(SPAN_SPLIT_RE);
  const state = { prefixed: false, gapAnnounced: false };
  let seen = "";
  const out = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i] ?? "";
    if (i % 2 === 1) { out.push(piece); seen += piece; continue; }
    state.gapAnnounced = GAP_ANNOUNCED_RE.test(seen);
    const spoken = speakableSpan(piece, state);
    out.push(spoken);
    seen += piece;
  }
  return tidy(out.join(""));
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
  tts, speakableBlanks, speakableFrames, speakableLetterRanges, FatalTtsError, PermanentTtsError,
  API_BASE, VOICE_ID, MODEL_ID, VOICE_SETTINGS, DELIVERIES, OUTPUT_FORMAT, TIMEOUT_MS,
};
