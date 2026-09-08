<?php
// Server-side Azure Speech proxy for the Grade 1 English pronunciation check.
//
// Modelled on the deleted somali_tts.php (13221548b^), which was this project's
// first Azure Speech proxy: same CORS allowlist, same ws-token-or-launch-token
// auth, same config lookup, same per-user rate limiting, and the Azure key
// never leaves the server. The differences are the host (stt, not tts) and the
// Pronunciation-Assessment header.
//
// WHY AZURE AND NOT quiz_stt.php. Owner decision, 2026-09-08. quiz_stt.php is
// ElevenLabs speech-to-text and the shell course scores it by counting which
// target WORDS came back in the transcript, which cannot distinguish a child
// who said "this" from one who said "dis". Azure returns AccuracyScore,
// FluencyScore, ProsodyScore, CompletenessScore and PronScore for the whole
// utterance, plus a score and an ErrorType (Omission / Insertion /
// Mispronunciation) for every word and a score for every PHONEME. That is a
// measurement rather than an inference, and it is the whole reason to add an
// endpoint rather than reuse the one already deployed.
//
// AUDIO MUST BE WAV PCM 16 kHz MONO. Azure's short-audio REST API accepts that
// or OGG/Opus and NOTHING else - in particular it rejects the audio/webm the
// browser's MediaRecorder produces in Chrome. The client converts before it
// posts (grade-1-app/lib/speech.js :: wavFromBlob); this endpoint proves the
// bytes really are RIFF/WAVE rather than trusting the mimeType field, the same
// way the class chat proves a screenshot is a JPEG by its magic bytes.
//
// Azure caps pronunciation assessment at 30 seconds of audio. 16 kHz mono
// 16-bit is 32,000 bytes a second, so the 1,000,000-byte decoded cap below IS
// that 30-second limit expressed in bytes - it is not an arbitrary number, and
// raising it just moves the rejection from here to Azure.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

// At or above this a word is not offered as something to practise. It is a
// display threshold only: nothing here decides whether a step is finished,
// because Azure scores against ADULT NATIVE speakers and these learners are
// five and six years old and learning English as an additional language.
define('PQH_PRON_WORD_OK', 90);

// A DAILY CAP PER LEARNER, because every check is a billed Azure call.
// Owner, 2026-09-08. The per-minute limiter below it is an abuse guard and
// says nothing about a day's spend: a learner who reloads and re-records all
// afternoon stays under 40 a minute for ever.
//
// 60 is deliberately far above a working day and far below anything that costs
// real money. Grade 1 carries 135 checkable items across ten units; a child
// working through one unit's speaking does about fourteen, so 60 is four
// units' worth including retries, and a learner who hits it has done more
// speaking practice in a day than the course asks for in a week.
//
// It counts SUCCESSFUL checks only - see where it is charged, below.
define('PQH_PRON_DAILY_CHECKS', 60);
define('PQH_PRON_LEDGER', 'local_hubredirect_pron_checks');

function pqh_pron_origin_allowed(string $origin): bool {
    global $CFG;

    if ($origin === '') {
        return false;
    }

    $allowed = [];
    $wwwroot = parse_url($CFG->wwwroot ?? '');
    if (!empty($wwwroot['scheme']) && !empty($wwwroot['host'])) {
        $allowed[] = $wwwroot['scheme'] . '://' . $wwwroot['host'] . (!empty($wwwroot['port']) ? ':' . $wwwroot['port'] : '');
    }

    $appbase = (string)get_config('local_prequran', 'bunny_app_base_url');
    $app = parse_url($appbase);
    if (!empty($app['scheme']) && !empty($app['host']) && !pqh_is_legacy_quran_resource_host((string)$app['host'])) {
        $allowed[] = $app['scheme'] . '://' . $app['host'] . (!empty($app['port']) ? ':' . $app['port'] : '');
    }

    $allowed = array_merge($allowed, pqh_resource_allowed_origins());
    $allowed[] = 'http://127.0.0.1:4173';
    $allowed[] = 'http://localhost:4173';

    return in_array($origin, array_unique($allowed), true);
}

function pqh_pron_send_cors(): void {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    if (pqh_pron_origin_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    // Authorization carries the signed launch token. Without it here the
    // preflight rejects the header and the real request is never sent. All
    // three names are required by check-platform-cors.mjs, which probes every
    // endpoint the app reaches through platformUrl().
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

function pqh_pron_json_error(int $status, string $message, string $code = ''): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $body = ['ok' => false, 'message' => $message];
    if ($code !== '') {
        $body['code'] = $code;
    }
    echo json_encode($body);
    exit;
}

function pqh_pron_config_value(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
    global $CFG;

    $value = (string)get_config('local_prequran', $pluginname);
    if ($value !== '') {
        return $value;
    }

    if (isset($CFG->{$cfgname}) && trim((string)$CFG->{$cfgname}) !== '') {
        return trim((string)$CFG->{$cfgname});
    }

    $env = getenv($envname);
    if ($env !== false && trim((string)$env) !== '') {
        return trim((string)$env);
    }

    return $default;
}

function pqh_pron_valid_ws_token(string $token): bool {
    global $DB;

    $token = trim($token);
    if ($token === '') {
        return false;
    }

    $configured = trim((string)get_config('local_prequran', 'ws_token'));
    if ($configured !== '' && hash_equals($configured, $token)) {
        return true;
    }

    try {
        $record = $DB->get_record('external_tokens', ['token' => $token], 'id, validuntil', IGNORE_MISSING);
        if (!$record) {
            return false;
        }
        $validuntil = (int)($record->validuntil ?? 0);
        return $validuntil === 0 || $validuntil > time();
    } catch (Throwable $e) {
        return false;
    }
}

/* The day's ledger, in a user preference: "YYYYMMDD|count".
 *
 * The same shape and for the same reasons as Wehel's time ledger and the
 * attachment one beside it - no schema, survives sessions, and resets itself
 * at midnight because the stored date simply stops matching. */
function pqh_pron_checks_used(int $userid): int {
    if ($userid <= 0) {
        return 0;
    }
    $raw = (string)get_user_preferences(PQH_PRON_LEDGER, '', $userid);
    $parts = explode('|', $raw);
    if (count($parts) < 2 || $parts[0] !== date('Ymd')) {
        return 0;
    }
    return max(0, (int)$parts[1]);
}

function pqh_pron_charge_check(int $userid): void {
    if ($userid <= 0) {
        return;
    }
    $used = pqh_pron_checks_used($userid);
    set_user_preference(PQH_PRON_LEDGER, date('Ymd') . '|' . ($used + 1), $userid);
}

pqh_pron_send_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_pron_json_error(405, 'Use POST.');
}

// Base64 is 4 bytes for every 3, so 1,400,000 admits the 1,000,000-byte
// decoded cap with room for the rest of the JSON and rejects anything larger
// before it is decoded - the class chat's own order of operations.
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 1400000) {
    pqh_pron_json_error(413, 'That recording is too long. Say one short sentence.');
}
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    pqh_pron_json_error(400, 'Invalid JSON.');
}

$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
// Three credentials, tried cheapest first - see the note in somali_tts.php's
// history: a CDN-hosted caller is cross-site, so no session cookie reaches it
// and require_login() would answer the fetch with a 303 to the login page.
$pqh_apiuserid = 0;
if (!pqh_pron_valid_ws_token($requesttoken)) {
    $pqh_apiuserid = pqh_launch_token_userid(is_array($payload) ? $payload : null);
    if ($pqh_apiuserid <= 0) {
        require_login();
    }
}

$reference = trim(preg_replace('/\s+/', ' ', (string)($payload['referenceText'] ?? '')));
if ($reference === '') {
    pqh_pron_json_error(400, 'Missing referenceText.');
}
if (core_text::strlen($reference) > 300) {
    pqh_pron_json_error(400, 'The reference sentence is too long.');
}

$audiobase64 = (string)($payload['audioBase64'] ?? '');
if ($audiobase64 === '') {
    pqh_pron_json_error(400, 'Missing audio.');
}
$audio = base64_decode($audiobase64, true);
if ($audio === false || $audio === '') {
    pqh_pron_json_error(400, 'The recording could not be read.');
}
if (strlen($audio) > 1000000) {
    pqh_pron_json_error(413, 'That recording is too long. Say one short sentence.');
}
// Prove the format rather than trusting the caller's mimeType. Azure answers a
// wrong container with a bare 400 that says nothing a learner could act on, and
// the client is the only thing that converts, so a failure here is a bug in the
// converter and should say so plainly.
if (strlen($audio) < 45 || substr($audio, 0, 4) !== 'RIFF' || substr($audio, 8, 4) !== 'WAVE') {
    pqh_pron_json_error(400, 'The recording must be WAV PCM 16 kHz mono.');
}

// A paid endpoint. 40 checks a minute is far above a child working through six
// rounds and well below anything that could run up a bill; a token caller is
// counted by user id because it gets a fresh $SESSION on every request, which
// would leave the counter reading 1 for ever.
if ($pqh_apiuserid > 0) {
    if (!pqh_api_rate_limit_ok('pronunciation_check', $pqh_apiuserid, 40)) {
        pqh_pron_json_error(429, 'Too many checks at once. Please wait a moment.', 'rate-limit');
    }
} else {
    global $SESSION;
    $now = time();
    if (empty($SESSION->local_hubredirect_pron_window) || !is_array($SESSION->local_hubredirect_pron_window)) {
        $SESSION->local_hubredirect_pron_window = ['start' => $now, 'count' => 0];
    }
    if (($now - (int)$SESSION->local_hubredirect_pron_window['start']) > 60) {
        $SESSION->local_hubredirect_pron_window = ['start' => $now, 'count' => 0];
    }
    $SESSION->local_hubredirect_pron_window['count'] = (int)$SESSION->local_hubredirect_pron_window['count'] + 1;
    if ($SESSION->local_hubredirect_pron_window['count'] > 40) {
        pqh_pron_json_error(429, 'Too many checks at once. Please wait a moment.', 'rate-limit');
    }
}

// WHO IS BEING CHARGED. A launch token names the learner; a session names
// them too. An UNIDENTIFIABLE caller is not charged, exactly as
// pqh_api_rate_limit_ok does not rate-limit one - in practice that is the
// configured shared ws_token, which is an operator credential rather than a
// child, and it is how the staged self-test runs uncapped.
$pqh_learnerid = $pqh_apiuserid;
if ($pqh_learnerid <= 0 && isloggedin() && !isguestuser()) {
    global $USER;
    $pqh_learnerid = (int)$USER->id;
}

// Its own code, never a bare 429. The rate limiter above says "slow down" and
// means it; this one means "come back tomorrow", and a learner told the wrong
// one of those either waits pointlessly or keeps pressing a button that will
// not work again today. Same reason Wehel's spent allowance answers with
// time-limit rather than letting the panel render it as an outage.
if ($pqh_learnerid > 0 && pqh_pron_checks_used($pqh_learnerid) >= PQH_PRON_DAILY_CHECKS) {
    pqh_pron_json_error(429, 'That is all the pronunciation checks for today.', 'daily-limit');
}

$apikey = pqh_pron_config_value(
    'azure_speech_key',
    'local_prequran_azure_speech_key',
    'AZURE_SPEECH_KEY'
);
$region = pqh_pron_config_value(
    'azure_speech_region',
    'local_prequran_azure_speech_region',
    'AZURE_SPEECH_REGION'
);
// Its own code, so the page can say "the check is not switched on yet" rather
// than "something went wrong" - the same reason Wehel's spent allowance
// answers with time-limit instead of a bare 429.
if ($apikey === '' || $region === '') {
    pqh_pron_json_error(503, 'The pronunciation check is not configured yet.', 'not-configured');
}

// THE LOCALE IS en-GB, BY OWNER DECISION (2026-09-08), AND IT COSTS ONE
// THING RATHER THAN THE FEATURE. It was set to en-US first, on a measurement;
// the owner chose British to match the vocabulary decision of 2026-08-17. What
// that costs is worth being exact about, because the first version of this
// note overstated it. Probed with a clip that says "cat", against the right
// word and three wrong ones:
//
//   locale  ref "cat"  ref "cap"   ref "kite"  "a cat sat"          phoneme labels
//   en-GB   100        88, None    68, None    0/100/0, Omissions   NONE
//   en-US    98        52, Mispro  15, Mispro  0/97/0,  Omissions   k ae t
//
// WORD-LEVEL FEEDBACK SURVIVES INTACT. The page flags a word for practice on
// its SCORE (below PQH_PRON_WORD_OK, 90), not on Azure's ErrorType, so en-GB's
// 88 and 68 are both caught exactly as en-US's 52 and 15 are, and omissions are
// identified identically. A child still learns which words to say again.
//
// WHAT IS LOST IS NAMING THE SOUND. en-GB returns no phoneme labels at all
// (en-AU does not either; only en-US did), so "the sound to practise in six is
// /s/" simply does not appear. The client already draws that line only when a
// label is present, so nothing breaks - the feedback is a word list instead of
// a word list plus a sound.
//
// One consequence to know: en-GB is systematically MORE LENIENT (88 where
// en-US said 52). The threshold catches these four cases; a genuinely poor
// attempt scoring above 90 would pass. Do not re-tune that on four samples -
// measure a real cohort first.
$language = 'en-GB';
$assessment = base64_encode(json_encode([
    'ReferenceText' => $reference,
    'GradingSystem' => 'HundredMark',
    // Phoneme granularity is the entire point of choosing Azure. Word would
    // give back roughly what ElevenLabs already gave.
    'Granularity' => 'Phoneme',
    'Dimension' => 'Comprehensive',
    // Without this the Phoneme field comes back as an empty string on every
    // phoneme - the scores arrive, the symbols do not, and a page cannot say
    // WHICH sound to practise. Verified: absent, all labels are "".
    'PhonemeAlphabet' => 'IPA',
    // Miscue marks words the child skipped or added, rather than silently
    // averaging them away.
    'EnableMiscue' => 'True',
]));

$url = 'https://' . rawurlencode($region) . '.stt.speech.microsoft.com'
    . '/speech/recognition/conversation/cognitiveservices/v1'
    . '?language=' . rawurlencode($language) . '&format=detailed';
$curl = curl_init($url);
if ($curl === false) {
    pqh_pron_json_error(500, 'The pronunciation check is unavailable.');
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $audio,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_HTTPHEADER => [
        'Ocp-Apim-Subscription-Key: ' . $apikey,
        'Content-Type: audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment: ' . $assessment,
        'Accept: application/json',
        // Azure rejects requests without a User-Agent.
        'User-Agent: eduplatform-ehel',
    ],
]);

$body = curl_exec($curl);
$httpcode = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if ($body === false || $httpcode < 200 || $httpcode >= 300) {
    pqh_pron_json_error(502, 'The pronunciation check could not be reached.', 'upstream');
}

// CHARGED HERE, AFTER AZURE ANSWERED, AND ONLY ON A REAL ANSWER. Wehel
// charges its clock BEFORE its API call, because time passes whether the call
// succeeds or not; a COUNT is different. Azure does not bill a 4xx or a 5xx,
// so a failed call costs nothing and must not cost the child an allowance
// either - and the per-minute limiter above is what stops a failure loop.
// A "no words heard" reply IS charged: Azure ran and billed for it.
pqh_pron_charge_check($pqh_learnerid);

$result = json_decode((string)$body, true);
if (!is_array($result)) {
    pqh_pron_json_error(502, 'The pronunciation check sent back something unreadable.', 'upstream');
}

// Azure reports "no words heard" as a 200 with a status field, so this is a
// normal answer rather than an error - a child holding the microphone wrong is
// the commonest thing that happens here, and it needs its own wording.
$status = (string)($result['RecognitionStatus'] ?? '');
if ($status !== 'Success') {
    echo json_encode([
        'ok' => true,
        'heard' => false,
        'status' => $status,
    ]);
    exit;
}

$best = $result['NBest'][0] ?? null;
if (!is_array($best)) {
    echo json_encode(['ok' => true, 'heard' => false, 'status' => 'NoMatch']);
    exit;
}

// Only what the page draws. Azure's own reply carries a prosody tree per word
// and a phoneme list for every word including the correct ones - tens of
// kilobytes on a six-word sentence, over a connection that may be a phone in
// East Africa. Phonemes come back only for words that were actually wrong,
// which is the only place a page would print one.
$words = [];
foreach (($best['Words'] ?? []) as $word) {
    if (!is_array($word)) {
        continue;
    }
    $errortype = (string)($word['ErrorType'] ?? 'None');
    $score = round((float)($word['AccuracyScore'] ?? 0), 1);
    $entry = [
        'word' => (string)($word['Word'] ?? ''),
        'score' => $score,
        'error' => $errortype,
    ];
    // ErrorType ALONE IS NOT THE SIGNAL. Measured on the same probe: a word
    // scoring 68 still came back ErrorType "None", and the near-miss that
    // scored 88 did too. Azure's flag fires late, and the 70-89 band is
    // exactly where a five-year-old learning a new sound sits - so the sounds
    // to practise are chosen by the score, with the flag as one way in.
    if ($errortype === 'Mispronunciation' || $score < PQH_PRON_WORD_OK) {
        $phonemes = [];
        foreach (($word['Phonemes'] ?? []) as $phoneme) {
            if (!is_array($phoneme)) {
                continue;
            }
            // A phoneme with no LABEL cannot be drawn - "the sound to
            // practise is //" is not a sentence - and on en-GB that is every
            // one of them: the scores come back, the symbols do not. Dropping
            // them here rather than in the page keeps a few hundred wasted
            // bytes per word off a connection that may be a phone.
            $symbol = (string)($phoneme['Phoneme'] ?? '');
            if ($symbol === '') {
                continue;
            }
            $phonemes[] = [
                'p' => $symbol,
                'score' => round((float)($phoneme['AccuracyScore'] ?? 0), 1),
            ];
        }
        if ($phonemes) {
            $entry['phonemes'] = $phonemes;
        }
    }
    $words[] = $entry;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok' => true,
    'heard' => true,
    // Azure's Display is CONSTRAINED BY THE REFERENCE and is not an
    // independent transcript: on the probe above, audio saying "cat" scored
    // against the reference "cap" came back Display "Cap." So this is passed
    // through for debugging and the page must never print it as "we heard
    // you say", which would tell a child they said a word they did not.
    'text' => (string)($best['Display'] ?? $result['DisplayText'] ?? ''),
    'accuracy' => round((float)($best['AccuracyScore'] ?? 0), 1),
    'fluency' => round((float)($best['FluencyScore'] ?? 0), 1),
    'completeness' => round((float)($best['CompletenessScore'] ?? 0), 1),
    'pron' => round((float)($best['PronScore'] ?? 0), 1),
    'words' => $words,
]);
