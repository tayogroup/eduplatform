<?php
// Server-side Deepgram speech recognition for WEHEL TUTOR VOICE INPUT ONLY.
//
// Companion of wehel_speak.php — see its header for the owner's 2026-08-20
// decision and the reason Wehel's voice lives on its own endpoints: the
// pronunciation check keeps quiz_stt.php (ElevenLabs) untouched, and this
// file exists so "Wehel uses Deepgram" cannot leak into any other feature.
// Accepts the same request shape the client already sent to quiz_stt.php
// ({audioBase64, mimeType, wstoken}) so shell/wehel.js only changes its
// endpoint constant. Dev twin: /api/wehel-listen (tools/lib/wehel-deepgram.js).

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_wehel_listen_json(int $status, array $payload): void {
    http_response_code($status);
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function pqh_wehel_listen_config(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
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

function pqh_wehel_listen_valid_token(string $token): bool {
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

function pqh_wehel_listen_send_cors(): void {
    global $CFG;
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    $allowed = ['http://127.0.0.1:4173', 'http://localhost:4173'];
    $site = parse_url($CFG->wwwroot ?? '');
    if (!empty($site['scheme']) && !empty($site['host'])) {
        $allowed[] = $site['scheme'] . '://' . $site['host'] . (!empty($site['port']) ? ':' . $site['port'] : '');
    }
    $appbase = (string)get_config('local_prequran', 'bunny_app_base_url');
    $app = parse_url($appbase);
    if (!empty($app['scheme']) && !empty($app['host']) && !pqh_is_legacy_quran_resource_host((string)$app['host'])) {
        $allowed[] = $app['scheme'] . '://' . $app['host'] . (!empty($app['port']) ? ':' . $app['port'] : '');
    }
    $allowed = array_merge($allowed, pqh_resource_allowed_origins());
    if ($origin !== '' && in_array($origin, array_unique($allowed), true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

pqh_wehel_listen_send_cors();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_wehel_listen_json(405, ['ok' => false, 'message' => 'Use POST.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 8 * 1024 * 1024) {
    pqh_wehel_listen_json(400, ['ok' => false, 'message' => 'The recording request is too large.']);
}
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    pqh_wehel_listen_json(400, ['ok' => false, 'message' => 'Invalid JSON.']);
}

$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
$pqh_apiuserid = 0;
if (!pqh_wehel_listen_valid_token($requesttoken)) {
    $pqh_apiuserid = pqh_launch_token_userid(is_array($payload) ? $payload : null);
    if ($pqh_apiuserid <= 0) {
        require_login();
    }
}

$encoded = trim((string)($payload['audioBase64'] ?? ''));
$audio = base64_decode($encoded, true);
if ($encoded === '' || $audio === false || strlen($audio) === 0 || strlen($audio) > 6 * 1024 * 1024) {
    pqh_wehel_listen_json(400, ['ok' => false, 'message' => 'The recording is empty or too large.']);
}

if ($pqh_apiuserid > 0) {
    if (!pqh_api_rate_limit_ok('wehel_listen', $pqh_apiuserid, 30)) {
        pqh_wehel_listen_json(429, ['ok' => false, 'message' => 'Too many voice questions. Please slow down.']);
    }
} else {
    global $SESSION;
    $now = time();
    $window = $SESSION->local_hubredirect_wehel_listen_window ?? ['start' => $now, 'count' => 0];
    if (($now - (int)$window['start']) > 60) {
        $window = ['start' => $now, 'count' => 0];
    }
    $window['count'] = (int)$window['count'] + 1;
    $SESSION->local_hubredirect_wehel_listen_window = $window;
    if ($window['count'] > 30) {
        pqh_wehel_listen_json(429, ['ok' => false, 'message' => 'Too many voice questions. Please slow down.']);
    }
}

$apikey = pqh_wehel_listen_config('deepgram_api_key', 'local_prequran_deepgram_api_key', 'DEEPGRAM_API_KEY');
if ($apikey === '') {
    pqh_wehel_listen_json(503, ['ok' => false, 'message' => 'Wehel speech recognition is not configured on this server.']);
}
$model = pqh_wehel_listen_config('wehel_listen_model', 'local_prequran_wehel_listen_model', 'WEHEL_LISTEN_MODEL', 'nova-3');
$mimetype = strtolower(trim(explode(';', (string)($payload['mimeType'] ?? 'audio/webm'))[0]));
if (!preg_match('~^audio/[a-z0-9.+-]+$~', $mimetype)) {
    $mimetype = 'audio/webm';
}

$curl = curl_init('https://api.deepgram.com/v1/listen?model=' . rawurlencode($model) . '&smart_format=true&language=en');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_HTTPHEADER => [
        'Authorization: Token ' . $apikey,
        'Content-Type: ' . $mimetype,
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => $audio,
]);
$response = curl_exec($curl);
$status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($response === false || $status < 200 || $status >= 300) {
    $reason = '';
    $upstream = is_string($response) ? json_decode($response, true) : null;
    if (is_array($upstream)) {
        $reason = trim((string)($upstream['err_msg'] ?? $upstream['message'] ?? $upstream['reason'] ?? ''));
    }
    $reason = preg_replace('/[^A-Za-z0-9 _.\-]/', '', substr($reason, 0, 80));
    $why = $status > 0 ? 'HTTP ' . $status . ($reason !== '' ? ' ' . $reason : '') : 'no response';
    pqh_wehel_listen_json(502, ['ok' => false, 'message' => 'Wehel speech recognition failed (' . $why . ').']);
}
$result = json_decode((string)$response, true);
$text = trim((string)($result['results']['channels'][0]['alternatives'][0]['transcript'] ?? ''));
pqh_wehel_listen_json(200, ['ok' => true, 'text' => preg_replace('/\s+/', ' ', $text)]);
