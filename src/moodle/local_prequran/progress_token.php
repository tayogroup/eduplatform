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

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok' => true,
    'student' => $target,
    'course' => $course,
    'env' => $env,
    'token' => $token,
    'expires' => time() + PQPG_TOKEN_TTL,
    'endpoint' => $endpoint,
    'launchparams' => 'pwsEndpoint=' . urlencode($endpoint) . '&pwsToken=' . urlencode($token) . '&studentid=' . $target,
], JSON_UNESCAPED_SLASHES);
