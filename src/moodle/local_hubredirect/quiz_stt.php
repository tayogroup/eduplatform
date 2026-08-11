<?php
// Server-side ElevenLabs speech recognition for speaking practice.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_quiz_stt_json(int $status, array $payload): void {
    http_response_code($status);
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function pqh_quiz_stt_config(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
    global $CFG;
    $value = trim((string)get_config('local_prequran', $pluginname));
    if ($value !== '') {
        return $value;
    }
    if (isset($CFG->{$cfgname}) && trim((string)$CFG->{$cfgname}) !== '') {
        return trim((string)$CFG->{$cfgname});
    }
    $environment = getenv($envname);
    return $environment !== false && trim((string)$environment) !== '' ? trim((string)$environment) : $default;
}

function pqh_quiz_stt_valid_token(string $token): bool {
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
        return $record && ((int)($record->validuntil ?? 0) === 0 || (int)$record->validuntil > time());
    } catch (Throwable $error) {
        return false;
    }
}

function pqh_quiz_stt_send_cors(): void {
    global $CFG;
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    $allowed = ['http://127.0.0.1:4173', 'http://localhost:4173', 'http://127.0.0.1:5178', 'http://localhost:5178'];
    $site = parse_url($CFG->wwwroot ?? '');
    if (!empty($site['scheme']) && !empty($site['host'])) {
        $allowed[] = $site['scheme'] . '://' . $site['host'] . (!empty($site['port']) ? ':' . $site['port'] : '');
    }
    $allowed = array_merge($allowed, pqh_resource_allowed_origins());
    if ($origin !== '' && in_array($origin, array_unique($allowed), true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    // Authorization carries the signed launch token. Without it here the
    // preflight rejects the header and the real request is never sent.
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

pqh_quiz_stt_send_cors();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_quiz_stt_json(405, ['ok' => false, 'message' => 'Use POST.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 8 * 1024 * 1024) {
    pqh_quiz_stt_json(400, ['ok' => false, 'message' => 'The recording request is too large.']);
}
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    pqh_quiz_stt_json(400, ['ok' => false, 'message' => 'Invalid JSON.']);
}
$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
// Three credentials, tried cheapest first. The launch token is what a
// CDN-hosted caller actually has: it is cross-origin, so no session cookie
// reaches it (MoodleSessionep1 is issued with no SameSite, which browsers
// treat as Lax, and Lax is not sent on a cross-site POST). Without this
// branch require_login() answers the fetch with a 303 to /login/index.php.
$pqh_apiuserid = 0;
if (!pqh_quiz_stt_valid_token($requesttoken)) {
    $pqh_apiuserid = pqh_launch_token_userid(is_array($payload) ? $payload : null);
    if ($pqh_apiuserid <= 0) {
        require_login();
    }
}

$encoded = trim((string)($payload['audioBase64'] ?? ''));
$audio = base64_decode($encoded, true);
if ($encoded === '' || $audio === false || strlen($audio) === 0 || strlen($audio) > 6 * 1024 * 1024) {
    pqh_quiz_stt_json(400, ['ok' => false, 'message' => 'The recording is empty or too large.']);
}

// A token-authenticated caller sends no cookie, so it gets a fresh $SESSION on
// every request and the counter below would read 1 every time — leaving a PAID
// endpoint with no cap at all. Those callers are counted by user id in an
// application cache; cookie callers keep the original counter untouched.
if ($pqh_apiuserid > 0) {
    if (!pqh_api_rate_limit_ok('quiz_stt', $pqh_apiuserid, 30)) {
        pqh_quiz_stt_json(429, ['ok' => false, 'message' => 'Too many speaking checks. Please slow down.']);
    }
} else {
    global $SESSION;
    $now = time();
    $window = $SESSION->local_hubredirect_quiz_stt_window ?? ['start' => $now, 'count' => 0];
    if (($now - (int)$window['start']) > 60) {
        $window = ['start' => $now, 'count' => 0];
    }
    $window['count'] = (int)$window['count'] + 1;
    $SESSION->local_hubredirect_quiz_stt_window = $window;
    if ($window['count'] > 30) {
        pqh_quiz_stt_json(429, ['ok' => false, 'message' => 'Too many speaking checks. Please slow down.']);
    }
}

$apikey = pqh_quiz_stt_config('elevenlabs_api_key', 'local_prequran_elevenlabs_api_key', 'ELEVENLABS_API_KEY');
if ($apikey === '') {
    pqh_quiz_stt_json(503, ['ok' => false, 'message' => 'ElevenLabs speech recognition is not configured.']);
}
$modelid = pqh_quiz_stt_config('quiz_stt_model_id', 'local_prequran_quiz_stt_model_id', 'ELEVENLABS_STT_MODEL_ID', 'scribe_v1');
$mimetype = strtolower(trim(explode(';', (string)($payload['mimeType'] ?? 'audio/webm'))[0]));
$extensions = ['audio/webm' => 'webm', 'audio/mp4' => 'mp4', 'audio/mpeg' => 'mp3', 'audio/ogg' => 'ogg'];
$extension = $extensions[$mimetype] ?? 'webm';
$temporary = tempnam($CFG->tempdir, 'ehel_stt_');
if ($temporary === false || file_put_contents($temporary, $audio) === false) {
    pqh_quiz_stt_json(500, ['ok' => false, 'message' => 'The recording could not be prepared.']);
}

try {
    $curl = curl_init('https://api.elevenlabs.io/v1/speech-to-text');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'xi-api-key: ' . $apikey],
        CURLOPT_POSTFIELDS => [
            'file' => curl_file_create($temporary, $mimetype, 'speaking.' . $extension),
            'model_id' => $modelid,
        ],
    ]);
    $response = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
} finally {
    @unlink($temporary);
}

if ($response === false || $status < 200 || $status >= 300) {
    pqh_quiz_stt_json(502, ['ok' => false, 'message' => 'ElevenLabs speech recognition failed.']);
}
$result = json_decode((string)$response, true);
$text = trim((string)($result['text'] ?? $result['transcript'] ?? ''));
pqh_quiz_stt_json(200, ['ok' => true, 'text' => preg_replace('/\s+/', ' ', $text)]);
