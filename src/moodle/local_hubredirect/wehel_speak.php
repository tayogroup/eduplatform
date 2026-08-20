<?php
// Server-side Deepgram text-to-speech for WEHEL TUTOR REPLIES ONLY.
//
// The owner's decision of 2026-08-20: Wehel's voice input and spoken replies
// use Deepgram (Aura-2, voice aura-2-thalia-en); every other voice in the
// platform is unchanged — the runtime lesson narration and pronunciation
// check stay on ElevenLabs (quiz_tts.php / quiz_stt.php), and the Somali
// vocabulary voice stays on Azure (somali_tts.php). That is why this is a
// separate endpoint rather than a new purpose on quiz_tts.php: the two
// providers' keys, models and failure modes stay apart, and "Wehel only"
// stays true by construction.
//
// Modeled on quiz_tts.php/quiz_stt.php: same CORS allowlist, same
// ws-token-or-launch-token-or-login auth, same per-learner rate limiting; the
// Deepgram key never leaves the server. Dev twin: /api/wehel-speak
// (tools/lib/wehel-deepgram.js), mounted by serve-src-preview.js and, at this
// production path, by vite.config.js.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_wehel_speak_json(int $status, array $payload): void {
    http_response_code($status);
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function pqh_wehel_speak_config(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
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

function pqh_wehel_speak_valid_token(string $token): bool {
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

function pqh_wehel_speak_send_cors(): void {
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

pqh_wehel_speak_send_cors();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_wehel_speak_json(405, ['ok' => false, 'message' => 'Use POST.']);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 64 * 1024) {
    pqh_wehel_speak_json(400, ['ok' => false, 'message' => 'The request is too large.']);
}
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    pqh_wehel_speak_json(400, ['ok' => false, 'message' => 'Invalid JSON.']);
}

$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
$pqh_apiuserid = 0;
if (!pqh_wehel_speak_valid_token($requesttoken)) {
    $pqh_apiuserid = pqh_launch_token_userid(is_array($payload) ? $payload : null);
    if ($pqh_apiuserid <= 0) {
        require_login();
    }
}

$text = trim(preg_replace('/\s+/u', ' ', (string)($payload['text'] ?? '')));
if ($text === '' || core_text::strlen($text) > 5000) {
    pqh_wehel_speak_json(400, ['ok' => false, 'message' => 'Voice text must contain between 1 and 5000 characters.']);
}

// Paid per character — same caps as the other voice endpoints.
if ($pqh_apiuserid > 0) {
    if (!pqh_api_rate_limit_ok('wehel_speak', $pqh_apiuserid, 30)) {
        pqh_wehel_speak_json(429, ['ok' => false, 'message' => 'Too many voice requests. Please slow down.']);
    }
} else {
    global $SESSION;
    $now = time();
    $window = $SESSION->local_hubredirect_wehel_speak_window ?? ['start' => $now, 'count' => 0];
    if (($now - (int)$window['start']) > 60) {
        $window = ['start' => $now, 'count' => 0];
    }
    $window['count'] = (int)$window['count'] + 1;
    $SESSION->local_hubredirect_wehel_speak_window = $window;
    if ($window['count'] > 30) {
        pqh_wehel_speak_json(429, ['ok' => false, 'message' => 'Too many voice requests. Please slow down.']);
    }
}

$apikey = pqh_wehel_speak_config('deepgram_api_key', 'local_prequran_deepgram_api_key', 'DEEPGRAM_API_KEY');
if ($apikey === '') {
    pqh_wehel_speak_json(503, ['ok' => false, 'message' => 'The Wehel voice is not configured on this server.']);
}
$model = pqh_wehel_speak_config('wehel_speak_model', 'local_prequran_wehel_speak_model', 'WEHEL_SPEAK_MODEL', 'aura-2-thalia-en');

// Deepgram /v1/speak caps one request at 2000 characters, so a long reply is
// split on sentence boundaries and the MP3 responses are concatenated —
// browsers play back-to-back MP3 streams in one <audio> element seamlessly
// enough for speech. The 5000-char input cap above bounds this at 3 calls.
$chunks = [];
$current = '';
foreach (preg_split('/(?<=[.!?…])\s+/u', $text) ?: [$text] as $sentence) {
    if ($current === '') {
        $current = $sentence;
    } else if (core_text::strlen($current . ' ' . $sentence) <= 1900) {
        $current .= ' ' . $sentence;
    } else {
        $chunks[] = $current;
        $current = $sentence;
    }
}
if ($current !== '') {
    $chunks[] = $current;
}
// A single sentence longer than the provider cap still has to be cut.
$bounded = [];
foreach ($chunks as $chunk) {
    while (core_text::strlen($chunk) > 1900) {
        $bounded[] = core_text::substr($chunk, 0, 1900);
        $chunk = core_text::substr($chunk, 1900);
    }
    $bounded[] = $chunk;
}

$audio = '';
foreach ($bounded as $chunk) {
    $curl = curl_init('https://api.deepgram.com/v1/speak?model=' . rawurlencode($model));
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_HTTPHEADER => [
            'Authorization: Token ' . $apikey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode(['text' => $chunk], JSON_UNESCAPED_UNICODE),
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
        pqh_wehel_speak_json(502, ['ok' => false, 'message' => 'The Wehel voice failed (' . $why . ').']);
    }
    $audio .= (string)$response;
}

http_response_code(200);
header('Cache-Control: no-store');
header('Content-Type: audio/mpeg');
header('Content-Length: ' . strlen($audio));
echo $audio;
exit;
