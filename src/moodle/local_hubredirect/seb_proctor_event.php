<?php
declare(strict_types=1);

// JSON endpoint for adults-only proctoring on focus-mode exams: records the
// consent, periodic webcam snapshots, and audio voice-activity flags posted
// by seb_focus_view.php. Hard-blocks managed child accounts regardless of the
// exam setting. Audio itself is never received or stored - only a voice flag
// with a level.
define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

header('Content-Type: application/json; charset=utf-8');

function pqh_proctor_fail(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if (!confirm_sesskey()) {
    pqh_proctor_fail('Session expired.', 403);
}
if (!pqh_seb_tables_ready() || !pqh_seb_proctor_table_ready()) {
    pqh_proctor_fail('Proctoring tables not installed.', 503);
}

$examid = required_param('examid', PARAM_INT);
$type = required_param('type', PARAM_ALPHANUMEXT);
$exam = pqh_seb_exam_record($examid);
if (!$exam) {
    pqh_proctor_fail('Exam not found.', 404);
}
if (!pqh_seb_proctor_effective($exam, (int)$USER->id)) {
    // Not configured, or this is a managed child - proctoring must not run.
    pqh_proctor_fail('Proctoring is not enabled for you.', 403);
}

[$allowed, $reason] = pqh_seb_student_gate($exam, (int)$USER->id);
$attempt = pqh_seb_attempt($examid, (int)$USER->id);
$attemptok = $attempt && (string)$attempt->status === 'in_progress';
if (!$attemptok && $type !== 'consent') {
    pqh_proctor_fail('No attempt in progress.', 400);
}
$attemptid = $attempt ? (int)$attempt->id : 0;

if ($type === 'consent') {
    pqh_seb_proctor_record($examid, (int)$USER->id, $attemptid, 'consent',
        json_encode(['agent' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200)]), null, 0);
    pqh_seb_audit('seb_proctor_consent', $examid, ['userid' => (int)$USER->id]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($type === 'snapshot') {
    $image = required_param('image', PARAM_RAW);
    // Accept only a small JPEG data URI.
    if (strpos($image, 'data:image/jpeg;base64,') !== 0 || strlen($image) > 260000) {
        pqh_proctor_fail('Invalid snapshot.', 400);
    }
    // Optional client-side face count (-1 = detection unavailable in browser).
    $faces = optional_param('faces', -1, PARAM_INT);
    $detail = null;
    if ($faces >= 0) {
        $faces = min(10, $faces);
        $detail = json_encode(['faces' => $faces]);
    }
    $stored = pqh_seb_proctor_record($examid, (int)$USER->id, $attemptid, 'snapshot', $detail, $image, 0);
    // Flag abnormal frames (no face, or more than one) for quick review.
    if ($stored && $faces >= 0 && $faces !== 1) {
        pqh_seb_proctor_record($examid, (int)$USER->id, $attemptid, 'face', json_encode(['faces' => $faces]), null, $faces);
        pqh_seb_audit('seb_proctor_face', $examid, ['userid' => (int)$USER->id, 'faces' => $faces]);
    }
    echo json_encode(['ok' => $stored]);
    exit;
}

if ($type === 'voice') {
    $level = min(1000, max(0, optional_param('level', 0, PARAM_INT)));
    pqh_seb_proctor_record($examid, (int)$USER->id, $attemptid, 'voice', null, null, $level);
    pqh_seb_audit('seb_proctor_voice', $examid, ['userid' => (int)$USER->id, 'level' => $level]);
    echo json_encode(['ok' => true]);
    exit;
}

pqh_proctor_fail('Unknown event type.');
