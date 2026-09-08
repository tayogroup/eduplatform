/* Local dev twin of local_hubredirect/pronunciation_check.php.
 *
 * KEEP THE TWO IN STEP. The deleted somali_tts.php carried the same warning
 * about tools/lib/azure-somali-tts.js and it was worth having: the browser
 * code is written once and has to behave the same against both, so a request
 * shape that only works here is a bug that ships.
 *
 * What is deliberately NOT copied from the PHP: auth, CORS and rate limiting.
 * This runs on 127.0.0.1 behind the repo's own dev server, reachable by
 * nothing else, and a rate limit here would only get in the way of testing the
 * thing it is meant to protect. The size and format checks ARE copied, because
 * those are what the client has to satisfy in production.
 */
const REGION_ENV = 'AZURE_SPEECH_REGION';
const KEY_ENV = 'AZURE_SPEECH_KEY';

// 16 kHz mono 16-bit is 32,000 bytes a second, so this is Azure's own
// 30-second cap on pronunciation assessment written as bytes.
const MAX_AUDIO_BYTES = 1000000;

// Display threshold for "practise this word" - never a pass mark.
const WORD_OK = 90;

function isWav(buf) {
  return buf.length >= 45
    && buf.toString('latin1', 0, 4) === 'RIFF'
    && buf.toString('latin1', 8, 12) === 'WAVE';
}

/* The reply the page reads. Same shape the PHP builds, and trimmed the same
 * way: phonemes only for words Azure actually marked as mispronounced, because
 * the full reply carries a prosody tree and a phoneme list for every word
 * including the right ones. */
function shape(result) {
  const status = String(result.RecognitionStatus || '');
  if (status !== 'Success') return { ok: true, heard: false, status };
  const best = (result.NBest || [])[0];
  if (!best) return { ok: true, heard: false, status: 'NoMatch' };
  const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;
  const words = (best.Words || []).map((w) => {
    const error = String(w.ErrorType || 'None');
    const score = round1(w.AccuracyScore);
    const entry = { word: String(w.Word || ''), score, error };
    // Keyed on the score, not on ErrorType: measured, a word scoring 68 still
    // came back "None". See the PHP for the numbers.
    if (error === 'Mispronunciation' || score < WORD_OK) {
      // Unlabelled phonemes are dropped: en-GB returns a score for every
      // sound and a symbol for none, and a sound the page cannot name is a
      // sound it cannot ask a child to practise.
      const phonemes = (w.Phonemes || [])
        .filter((p) => String(p.Phoneme || '') !== '')
        .map((p) => ({ p: String(p.Phoneme), score: round1(p.AccuracyScore) }));
      if (phonemes.length) entry.phonemes = phonemes;
    }
    return entry;
  });
  return {
    ok: true,
    heard: true,
    text: String(best.Display || result.DisplayText || ''),
    accuracy: round1(best.AccuracyScore),
    fluency: round1(best.FluencyScore),
    completeness: round1(best.CompletenessScore),
    pron: round1(best.PronScore),
    words,
  };
}

async function assessPronunciation({ audio, referenceText }) {
  const key = process.env[KEY_ENV];
  const region = process.env[REGION_ENV];
  if (!key || !region) {
    const error = new Error(`${KEY_ENV} and ${REGION_ENV} are not configured in the local .env file.`);
    error.code = 'not-configured';
    throw error;
  }
  const reference = String(referenceText || '').replace(/\s+/g, ' ').trim();
  if (!reference) throw new Error('Missing referenceText.');
  if (!audio.length) throw new Error('The recording is empty.');
  if (audio.length > MAX_AUDIO_BYTES) throw new Error('That recording is too long. Say one short sentence.');
  // Prove the format rather than trusting the caller: Azure answers a wrong
  // container with a bare 400 that says nothing anyone could act on.
  if (!isWav(audio)) throw new Error('The recording must be WAV PCM 16 kHz mono.');

  const assessment = Buffer.from(JSON.stringify({
    ReferenceText: reference,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    // Without this every Phoneme label comes back as an empty string.
    PhonemeAlphabet: 'IPA',
    Dimension: 'Comprehensive',
    EnableMiscue: 'True',
  })).toString('base64');

  // en-GB by owner decision (2026-09-08). It keeps word-level feedback - the
  // page flags a word on its SCORE, and en-GB's 88 and 68 are caught exactly
  // as en-US's 52 and 15 were - and loses only the phoneme LABELS, which
  // en-GB does not return at all. Full measurement in pronunciation_check.php.
  //
  // THIS TWIN IS NOT CAPPED. The daily allowance lives in the PHP, where there
  // is a learner to charge; here there is nobody, and a cap would only
  // obstruct the testing it exists to allow.
  const url = `https://${encodeURIComponent(region)}.stt.speech.microsoft.com`
    + '/speech/recognition/conversation/cognitiveservices/v1?language=en-GB&format=detailed';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Pronunciation-Assessment': assessment,
      Accept: 'application/json',
      'User-Agent': 'eduplatform-ehel-dev',
    },
    body: audio,
  });
  if (!response.ok) {
    throw new Error(`Azure pronunciation ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }
  return shape(await response.json());
}

async function handleAzurePronunciation(req, res) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 4 * 1024 * 1024) throw new Error('The recording request is too large.');
  }
  const payload = JSON.parse(body || '{}');
  const audio = Buffer.from(String(payload.audioBase64 || ''), 'base64');
  const result = await assessPronunciation({ audio, referenceText: payload.referenceText });
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(result));
}

module.exports = { handleAzurePronunciation, assessPronunciation, shape, MAX_AUDIO_BYTES };
