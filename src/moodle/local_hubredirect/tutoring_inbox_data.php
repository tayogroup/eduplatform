<?php
declare(strict_types=1);

// Tutoring chat, the tutor's door — the inbox page's data endpoint.
//
// Everything after auth is local_prequran_external::tutoring_chat_exchange(),
// the same function the learner's course_group_chat.php calls with a launch
// token. Two doors, one implementation, so what a tutor reads and what a
// learner sent cannot drift between the two sides of the same thread.
//
// Gating is restated here rather than inherited from the page: the caller must
// be in the tutor cohort of the thread's subject (or supervise them all — site
// admin / support queue capability), resolved from the THREAD's cohort, never
// from a subject the client names. Session + sesskey, like the board's doors.
//
// Verbs, by `verb`:
//   list                       every thread in the caller's subjects, sorted
//   thread  threadid, since    messages with id > since
//   send    threadid, body     reply, then return what is new
//   file    threadid, fileid   one stored attachment, base64

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/tutoring_chatlib.php');
require_once($CFG->dirroot . '/local/prequran/externallib_v4.php');
require_login();
require_sesskey();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST only.']);
    exit;
}

$cohorts = pqtut_user_cohorts((int)$USER->id);
if (!$cohorts) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'You are not in a tutoring teacher group.']);
    exit;
}

$verb = optional_param('verb', 'list', PARAM_ALPHA);
if ($verb === 'list') {
    echo json_encode([
        'ok' => true,
        'subjects' => array_map(static fn(string $slug): array => ['subject' => $slug, 'label' => pqtut_subject_label($slug)], array_keys($cohorts)),
        'threads' => local_prequran_external::tutoring_inbox_threads($cohorts),
        'servertime' => time(),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Everything else names a thread; the thread's cohort must be one the caller
// may see — rebuilt from the row, never trusted from the request.
$threadid = optional_param('threadid', 0, PARAM_INT);
$thread = $threadid > 0 ? $DB->get_record('local_prequran_comm_thread', ['id' => $threadid, 'type' => 'tutoring']) : null;
$slug = null;
if ($thread) {
    foreach ($cohorts as $s => $cohort) {
        if ((int)$cohort->id === (int)$thread->cohortid) {
            $slug = (string)$s;
            break;
        }
    }
}
if (!$thread || $slug === null) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'That conversation is not in your subjects.']);
    exit;
}

if ($verb === 'file') {
    $file = local_prequran_external::tutoring_chat_file((int)$USER->id, (int)$thread->id, optional_param('fileid', 0, PARAM_INT));
    echo json_encode($file ?: ['ok' => false], JSON_UNESCAPED_SLASHES);
    exit;
}

$since = max(0, optional_param('since', 0, PARAM_INT));
$body = $verb === 'send' ? trim((string)optional_param('body', '', PARAM_RAW)) : '';
$result = local_prequran_external::tutoring_chat_exchange((int)$USER->id, (int)$thread->studentid, $slug, $body, $since, 80);
echo json_encode($result, JSON_UNESCAPED_SLASHES);
