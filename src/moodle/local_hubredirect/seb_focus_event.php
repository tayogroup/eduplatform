<?php
declare(strict_types=1);

// JSON endpoint for browser focus-mode exams: start an attempt, record a
// focus break (tab switch / blur / left fullscreen), or finish. Called by
// seb_exam.php's focus view via fetch. SEB (locked) exams do not use this.
define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

header('Content-Type: application/json; charset=utf-8');

function pqh_focus_fail(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if (!confirm_sesskey()) {
    pqh_focus_fail('Session expired. Reload the exam.', 403);
}
if (!pqh_seb_tables_ready()) {
    pqh_focus_fail('Exam tables not installed.', 503);
}

$examid = required_param('examid', PARAM_INT);
$action = required_param('action', PARAM_ALPHANUMEXT);
$exam = pqh_seb_exam_record($examid);
if (!$exam) {
    pqh_focus_fail('Exam not found.', 404);
}
if (pqh_seb_exam_mode($exam) !== 'focus') {
    pqh_focus_fail('This exam is not a browser focus exam.', 400);
}

[$allowed, $reason] = pqh_seb_student_gate($exam, (int)$USER->id);
$attempt = pqh_seb_attempt($examid, (int)$USER->id);

if ($action === 'start') {
    if (!$allowed && !($attempt && (string)$attempt->status === 'in_progress')) {
        pqh_focus_fail($reason !== '' ? $reason : 'You cannot start this exam.', 403);
    }
    // Focus mode is not SEB-verified: the browser is not locked.
    $attempt = pqh_seb_attempt_start($examid, (int)$USER->id, false);
    $remaining = max(0, ((int)$attempt->timestarted + max(5, (int)$exam->duration_minutes) * 60) - time());
    echo json_encode([
        'ok' => true,
        'remaining' => $remaining,
        'breaks' => (int)($attempt->focus_breaks ?? 0),
        'embedurl' => (new moodle_url(trim((string)$exam->embedurl)))->out(false),
    ]);
    exit;
}

if (!$attempt) {
    pqh_focus_fail('No attempt in progress.', 400);
}

if ($action === 'break') {
    if ((string)$attempt->status === 'in_progress') {
        $kind = required_param('kind', PARAM_ALPHANUMEXT);
        $count = pqh_seb_attempt_focus_break($attempt, $kind);
        echo json_encode(['ok' => true, 'breaks' => $count]);
        exit;
    }
    echo json_encode(['ok' => true, 'breaks' => (int)($attempt->focus_breaks ?? 0)]);
    exit;
}

if ($action === 'finish') {
    if ((string)$attempt->status === 'in_progress') {
        pqh_seb_attempt_finish($attempt);
    }
    echo json_encode(['ok' => true, 'redirect' => (new moodle_url('/local/hubredirect/dashboard.php'))->out(false)]);
    exit;
}

pqh_focus_fail('Unknown action.');
