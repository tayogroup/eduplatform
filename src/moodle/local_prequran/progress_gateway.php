<?php
// Progress gateway (Phase B auth bridge) — the stateless endpoint the
// Bunny-hosted learner apps call with a signed launch token. Speaks the
// ProgressClient wire protocol exactly, so apps switch to remote sync with only
// launch params (?pwsEndpoint=<this file>&pwsToken=<jwt>):
//
//   POST {endpoint}/progress/ingest      body = batch envelope (JSON)
//   GET  {endpoint}/progress/{course}    -> hydrate state document (JSON)
//
// Auth: HS256 launch token (progress_gatewaylib.php) from the Authorization
// Bearer header, the envelope's `token` field (sendBeacon cannot set headers),
// or ?token=. Identity ALWAYS comes from the token claims — the gateway rejects
// batches whose student/course disagree with the token, per the contract.

define('NO_MOODLE_COOKIES', true);
require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');
require_once(__DIR__ . '/externallib_progress.php');

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($allowed = pqpg_allowed_origin($origin)) {
    header('Access-Control-Allow-Origin: ' . $allowed);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function pqpg_fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

// Route from PATH_INFO (…/progress_gateway.php/progress/ingest), with a
// REQUEST_URI fallback for servers that strip PATH_INFO.
$route = (string)($_SERVER['PATH_INFO'] ?? '');
if ($route === '' && preg_match('#progress_gateway\.php(/[^?]*)#', (string)($_SERVER['REQUEST_URI'] ?? ''), $m)) {
    $route = $m[1];
}

$body = json_decode((string)file_get_contents('php://input'), true);

$token = '';
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (preg_match('/Bearer\s+(\S+)/i', (string)$auth, $m)) {
    $token = $m[1];
}
if ($token === '' && is_array($body) && !empty($body['token'])) {
    $token = (string)$body['token']; // sendBeacon path — no headers possible
}
if ($token === '' && !empty($_GET['token'])) {
    $token = (string)$_GET['token'];
}
if ($token === '') {
    pqpg_fail(401, 'Missing launch token.');
}
$claims = pqpg_verify_token($token);
if ($claims === null) {
    pqpg_fail(401, 'Invalid or expired launch token.');
}
$tokenuser = (int)($claims['sub'] ?? 0);
$tokencourse = (string)($claims['course'] ?? '');
$env = (string)($claims['env'] ?? '');
if ($tokenuser <= 0) {
    pqpg_fail(401, 'Malformed launch token.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && $route === '/progress/ingest') {
    if (!is_array($body) || !isset($body['events']) || !is_array($body['events'])) {
        pqpg_fail(400, 'Malformed batch envelope.');
    }
    if ((string)($body['student'] ?? '') !== (string)$tokenuser) {
        pqpg_fail(403, 'Token/student mismatch.');
    }
    $course = (string)($body['course'] ?? '');
    if ($course === '' || ($tokencourse !== '' && $course !== $tokencourse)) {
        pqpg_fail(403, 'Token/course mismatch.');
    }
    $result = local_prequran_progress_external::ingest_events($tokenuser, $course, $body['events'], $env);
    echo json_encode([
        'ok' => (bool)$result['ok'],
        'accepted' => (int)$result['accepted'],
        'durable' => (int)$result['durable'],
        'dropped' => (int)$result['dropped'],
        'stateVersion' => (int)$result['stateversion'],
    ]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && preg_match('#^/progress/([A-Za-z0-9._-]+)$#', $route, $m)) {
    $course = $m[1];
    if ($tokencourse !== '' && $course !== $tokencourse) {
        pqpg_fail(403, 'Token/course mismatch.');
    }
    echo json_encode(local_prequran_progress_external::state_document($tokenuser, $course, $env), JSON_UNESCAPED_SLASHES);
    exit;
}

pqpg_fail(404, 'Unknown route.');
