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

// THE LOCALE IS en-US, AND IT IS MEASURED RATHER THAN CHOSEN. Probed on
// 2026-09-08 with a committed narration clip that says "cat", scored against
// the right reference and a near-miss ("cap"):
//
//   locale   ref "cat"   ref "cap"                    phoneme labels
//   en-GB    100         88,  ErrorType None          (none)
//   en-US     98         52,  Mispronunciation        k ae t / k ae p
//   en-AU    100         94,  ErrorType None          (none)
//
// Only en-US returns phoneme LABELS at all, and only en-US notices that the
// child said a different word: en-GB and en-AU both wave an audibly wrong
// final consonant through at 88 and 94 with no error. Phoneme-level diagnosis
// is the entire reason this endpoint exists instead of reusing the ElevenLabs
// one already deployed, so en-GB would ship the cost of a new endpoint for
// none of the benefit.
//
// It is a real trade-off against the British-vocabulary decision of
// 2026-08-17, and it is narrower than it looks: the locale is the PRONUNCIATION
// REFERENCE MODEL, not the words. The course still teaches caretaker, lift and
// railway. What changes is which native accent a child is scored against.
// Flipping it back is this one constant in two files.
$language = 'en-US';
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
            $phonemes[] = [
                'p' => (string)($phoneme['Phoneme'] ?? ''),
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
