<?php
// Server-side ElevenLabs TTS proxy for child quiz chatbots.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

function pqh_quiz_tts_origin_allowed(string $origin): bool {
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
    $allowed[] = 'https://eduplatform.ai';
    $allowed[] = 'https://app.eduplatform.ai';
    $allowed[] = 'http://127.0.0.1:4173';
    $allowed[] = 'http://localhost:4173';

    return in_array($origin, array_unique($allowed), true);
}

function pqh_quiz_tts_send_cors(): void {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
    if (pqh_quiz_tts_origin_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

function pqh_quiz_tts_json_error(int $status, string $message): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

function pqh_quiz_tts_config_value(string $pluginname, string $cfgname, string $envname, string $default = ''): string {
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

pqh_quiz_tts_send_cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pqh_quiz_tts_json_error(405, 'Use POST.');
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    pqh_quiz_tts_json_error(400, 'Invalid JSON.');
}

function pqh_quiz_tts_valid_ws_token(string $token): bool {
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

$requesttoken = trim((string)($payload['wstoken'] ?? $payload['ws'] ?? optional_param('wstoken', '', PARAM_RAW_TRIMMED)));
if (!pqh_quiz_tts_valid_ws_token($requesttoken)) {
    require_login();
}

$text = trim((string)($payload['text'] ?? ''));
$text = preg_replace('/\s+/', ' ', $text);
if ($text === '') {
    pqh_quiz_tts_json_error(400, 'Missing text.');
}
if (core_text::strlen($text) > 650) {
    pqh_quiz_tts_json_error(400, 'Text is too long.');
}

global $SESSION;
$now = time();
$window = 60;
$limit = 70;
if (empty($SESSION->local_hubredirect_quiz_tts_window) || !is_array($SESSION->local_hubredirect_quiz_tts_window)) {
    $SESSION->local_hubredirect_quiz_tts_window = ['start' => $now, 'count' => 0];
}
if (($now - (int)$SESSION->local_hubredirect_quiz_tts_window['start']) > $window) {
    $SESSION->local_hubredirect_quiz_tts_window = ['start' => $now, 'count' => 0];
}
$SESSION->local_hubredirect_quiz_tts_window['count'] = (int)$SESSION->local_hubredirect_quiz_tts_window['count'] + 1;
if ($SESSION->local_hubredirect_quiz_tts_window['count'] > $limit) {
    pqh_quiz_tts_json_error(429, 'Too many voice requests. Please slow down.');
}

$apikey = pqh_quiz_tts_config_value(
    'elevenlabs_api_key',
    'local_prequran_elevenlabs_api_key',
    'ELEVENLABS_API_KEY'
);
if ($apikey === '') {
    pqh_quiz_tts_json_error(503, 'ElevenLabs voice is not configured.');
}

$purpose = trim((string)($payload['purpose'] ?? ''));
$voiceid = '';
if ($purpose === 'practice_coach') {
    $voiceid = pqh_quiz_tts_config_value(
        'practice_coach_voice_id',
        'local_prequran_practice_coach_voice_id',
        'PREQURAN_PRACTICE_COACH_VOICE_ID'
    );
}
if ($voiceid === '') {
    $voiceid = pqh_quiz_tts_config_value(
    'quiz_tts_voice_id',
    'local_prequran_quiz_tts_voice_id',
    'PREQURAN_QUIZ_TTS_VOICE_ID',
    'B5xxC4eQoOFJnY4R5XkI'
    );
}

$modelid = '';
if ($purpose === 'practice_coach') {
    $modelid = pqh_quiz_tts_config_value(
        'practice_coach_model_id',
        'local_prequran_practice_coach_model_id',
        'PREQURAN_PRACTICE_COACH_MODEL_ID'
    );
}
if ($modelid === '') {
    $modelid = pqh_quiz_tts_config_value(
    'quiz_tts_model_id',
    'local_prequran_quiz_tts_model_id',
    'PREQURAN_QUIZ_TTS_MODEL_ID',
    'eleven_multilingual_v2'
    );
}

$url = 'https://api.elevenlabs.io/v1/text-to-speech/' . rawurlencode($voiceid) . '?output_format=mp3_44100_128';
$body = json_encode([
    'text' => $text,
    'model_id' => $modelid,
    'voice_settings' => [
        'stability' => 0.48,
        'similarity_boost' => 0.82,
        'style' => 0.32,
        'use_speaker_boost' => true,
    ],
]);

$curl = curl_init($url);
if ($curl === false) {
    pqh_quiz_tts_json_error(500, 'Voice service is unavailable.');
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 18,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: audio/mpeg',
        'xi-api-key: ' . $apikey,
    ],
]);

$audio = curl_exec($curl);
$httpcode = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$curlerror = curl_error($curl);
curl_close($curl);

if ($audio === false || $httpcode < 200 || $httpcode >= 300) {
    pqh_quiz_tts_json_error(502, 'ElevenLabs voice request failed.');
}

header('Content-Type: audio/mpeg');
header('Cache-Control: private, max-age=300');
header('Content-Length: ' . strlen($audio));
echo $audio;
