<?php
// Server-side Azure Speech proxy for Wehel's Somali vocabulary audio.
// Modeled on quiz_tts.php: same CORS allowlist, same ws-token-or-login auth,
// same per-session rate limiting; the Azure key never leaves the server.
//
// The voice is Azure's Somali neural voice "Ubax" (so-SO-UbaxNeural — "Ubah").
// Somali lives on Azure rather than ElevenLabs because the browser ships no
// Somali speechSynthesis voice and Azure is the Somali provider the project
// has access to. Clients send only the short "Soomaali:" vocabulary lines on
// an explicit Listen tap — never whole replies. The local dev twin is
// tools/lib/azure-somali-tts.js — keep the two in step.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_somali_tts_origin_allowed(string $origin): bool {
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

function pqh_somali_tts_send_cors(): void {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    if (pqh_somali_tts_origin_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    // Authorization carries the signed launch token. Without it here the
    // preflight rejects the header and the real request is never sent.
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

function pqh_somali_tts_json_error(int $status, string $message): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

function pqh_somali_tts_config_value(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
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

function pqh_somali_tts_valid_ws_token(string $token): bool {
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

pqh_somali_tts_send_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_somali_tts_json_error(405, 'Use POST.');
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 16 * 1024) {
    pqh_somali_tts_json_error(400, 'The request is too large.');
}
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    pqh_somali_tts_json_error(400, 'Invalid JSON.');
}

$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
// Three credentials, tried cheapest first. The launch token is what a
// CDN-hosted caller actually has: it is cross-origin, so no session cookie
// reaches it (MoodleSessionep1 is issued with no SameSite, which browsers
// treat as Lax, and Lax is not sent on a cross-site POST). Without this
// branch require_login() answers the fetch with a 303 to /login/index.php.
$pqh_apiuserid = 0;
if (!pqh_somali_tts_valid_ws_token($requesttoken)) {
    $pqh_apiuserid = pqh_launch_token_userid(is_array($payload) ? $payload : null);
    if ($pqh_apiuserid <= 0) {
        require_login();
    }
}

$text = trim(preg_replace('/\s+/', ' ', (string)($payload['text'] ?? '')));
if ($text === '') {
    pqh_somali_tts_json_error(400, 'Missing text.');
}
if (core_text::strlen($text) > 600) {
    pqh_somali_tts_json_error(400, 'Text is too long.');
}

// A token-authenticated caller sends no cookie, so it gets a fresh $SESSION on
// every request and the counter below would read 1 every time — leaving a PAID
// endpoint with no cap at all. Those callers are counted by user id in an
// application cache; cookie callers keep the original counter untouched.
if ($pqh_apiuserid > 0) {
    if (!pqh_api_rate_limit_ok('somali_tts', $pqh_apiuserid, 40)) {
        pqh_somali_tts_json_error(429, 'Too many voice requests. Please slow down.');
    }
} else {
    global $SESSION;
    $now = time();
    if (empty($SESSION->local_hubredirect_somali_tts_window) || !is_array($SESSION->local_hubredirect_somali_tts_window)) {
        $SESSION->local_hubredirect_somali_tts_window = ['start' => $now, 'count' => 0];
    }
    if (($now - (int)$SESSION->local_hubredirect_somali_tts_window['start']) > 60) {
        $SESSION->local_hubredirect_somali_tts_window = ['start' => $now, 'count' => 0];
    }
    $SESSION->local_hubredirect_somali_tts_window['count'] = (int)$SESSION->local_hubredirect_somali_tts_window['count'] + 1;
    if ($SESSION->local_hubredirect_somali_tts_window['count'] > 40) {
        pqh_somali_tts_json_error(429, 'Too many voice requests. Please slow down.');
    }
}

$apikey = pqh_somali_tts_config_value(
    'azure_speech_key',
    'local_prequran_azure_speech_key',
    'AZURE_SPEECH_KEY'
);
$region = pqh_somali_tts_config_value(
    'azure_speech_region',
    'local_prequran_azure_speech_region',
    'AZURE_SPEECH_REGION'
);
if ($apikey === '' || $region === '') {
    pqh_somali_tts_json_error(503, 'The Somali voice is not configured.');
}

// SSML is XML and the text comes from a model reply — escape it or a stray
// ampersand in a translation kills the whole request.
$ssml = '<speak version="1.0" xml:lang="so-SO"><voice name="so-SO-UbaxNeural">'
    . htmlspecialchars($text, ENT_QUOTES | ENT_XML1, 'UTF-8')
    . '</voice></speak>';

$url = 'https://' . rawurlencode($region) . '.tts.speech.microsoft.com/cognitiveservices/v1';
$curl = curl_init($url);
if ($curl === false) {
    pqh_somali_tts_json_error(500, 'Voice service is unavailable.');
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $ssml,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 18,
    CURLOPT_HTTPHEADER => [
        'Ocp-Apim-Subscription-Key: ' . $apikey,
        'Content-Type: application/ssml+xml',
        'X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3',
        // Azure rejects requests without a User-Agent.
        'User-Agent: eduplatform-wehel',
    ],
]);

$audio = curl_exec($curl);
$httpcode = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if ($audio === false || $httpcode < 200 || $httpcode >= 300) {
    pqh_somali_tts_json_error(502, 'The Somali voice request failed.');
}

header('Content-Type: audio/mpeg');
header('Cache-Control: private, max-age=300');
header('Content-Length: ' . strlen($audio));
echo $audio;
