<?php
// Launch-token mint (Phase B auth bridge). Requires a Moodle session; returns a
// signed launch token + ready-to-append launch params for the Bunny apps.
//
//   /local/prequran/progress_token.php?course=ehel-math-g03[&studentid=N][&pq_env=…]
//
// Self-service by default; minting for another user requires siteadmin (extend
// to the guardian/teacher relationship checks alongside the WS assert when
// staff tooling needs it). course_launch.php should call pqpg_mint_token()
// directly when the ehel launch flow lands (P1.8) — this endpoint is the
// interim mint + a test surface.

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');

require_login();

$course = required_param('course', PARAM_RAW_TRIMMED);
$studentid = optional_param('studentid', 0, PARAM_INT);
$env = optional_param('pq_env', '', PARAM_ALPHANUMEXT);

$target = $studentid > 0 ? $studentid : (int)$USER->id;
if ($target !== (int)$USER->id && !is_siteadmin()) {
    throw new required_capability_exception(context_system::instance(), 'moodle/site:config', 'nopermissions', '');
}

$token = pqpg_mint_token($target, $course, $env);
$endpoint = $CFG->wwwroot . '/local/prequran/progress_gateway.php';
$launchparams = 'pwsEndpoint=' . urlencode($endpoint) . '&pwsToken=' . urlencode($token) . '&studentid=' . $target;

// Build the ready-to-click app URL from the course key (ehel-{eng|math|sci}-gNN).
$launchurl = '';
if (preg_match('/^ehel-(eng|math|sci)-g(\d{2})$/', $course, $m)) {
    $subjectdir = ['eng' => 'english', 'math' => 'mathematics', 'sci' => 'science'][$m[1]];
    $stage = (int)$m[2];
    $levelparam = $m[1] === 'eng' ? 'grade' : 'stage'; // english routes by ?grade=
    $launchurl = 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/' . $subjectdir . '/index.html'
        . '?' . $levelparam . '=' . $stage . '&unit=1&' . $launchparams;
}

// ?format=launch → a tiny page with a clickable link, so the ~350-char token
// never travels through copy-paste (chat/email inject invisible Unicode that
// breaks the Authorization header).
if (optional_param('format', '', PARAM_ALPHA) === 'launch' && $launchurl !== '') {
    header('Content-Type: text/html; charset=utf-8');
    $safeurl = s($launchurl);
    echo "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Ehel launch</title></head>"
        . "<body style=\"font-family:system-ui;max-width:640px;margin:48px auto;line-height:1.6\">"
        . "<h1 style=\"font-size:22px\">Launch: " . s($course) . "</h1>"
        . "<p><a href=\"{$safeurl}\" style=\"display:inline-block;padding:12px 20px;background:#17324d;color:#fff;border-radius:8px;text-decoration:none;font-weight:700\">Open the course with progress sync →</a></p>"
        . "<p style=\"color:#666;font-size:13px\">Signed for user {$target} · valid " . floor(PQPG_TOKEN_TTL / 3600) . " h · env " . s($env !== '' ? $env : 'default') . ".<br>Share this link only with that learner — it carries their identity.</p>"
        . "</body></html>";
    exit;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok' => true,
    'student' => $target,
    'course' => $course,
    'env' => $env,
    'token' => $token,
    'expires' => time() + PQPG_TOKEN_TTL,
    'endpoint' => $endpoint,
    'launchparams' => $launchparams,
    'launchurl' => $launchurl,
], JSON_UNESCAPED_SLASHES);
