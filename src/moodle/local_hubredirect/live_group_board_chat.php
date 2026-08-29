<?php
declare(strict_types=1);

// Classroom chat, the teacher's door — the board panel's data endpoint.
//
// Everything after auth is local_prequran_external::class_group_chat_exchange(),
// the same function the learner's course_group_chat.php calls with a launch
// token. Two doors, one implementation, so the visibility rule ("no
// student-to-student messaging", guarded by tools/check-class-group-chat.php)
// cannot drift between the two sides of the same room.
//
// Gating is restated rather than inherited from the page, exactly as the poll
// and hand endpoints restate it. The extra condition is that the group must be
// one THIS teacher runs (or the caller manages the workspace) — without it any
// teacher could read any room in the school by guessing a groupid.

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');
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

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$groupid = optional_param('groupid', 0, PARAM_INT);
$since = optional_param('since', 0, PARAM_INT);
$body = trim((string)optional_param('body', '', PARAM_RAW));
$replyto = optional_param('replyto', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);

if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Teacher access to this workspace is required.']);
    exit;
}

// The board lets a manager view another teacher's board; the chat follows the
// same rule for READING, but messages are always sent as the caller — a manager
// typing into a room speaks as themselves, never as the teacher whose board
// they are looking at.
$teacherid = (int)$USER->id;
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
if ($requestedteacherid > 0 && $requestedteacherid !== $teacherid && $canmanage) {
    $teacherid = $requestedteacherid;
}

// The group must be on the board being viewed — rebuilt, never trusted.
$groups = pqlgb_teacher_groups($teacherid, $workspaceid);
if ($groupid <= 0 || !array_key_exists($groupid, $groups)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'That group is not on this board.']);
    exit;
}

// Image fetch for a screenshot bubble; same visibility re-check inside.
$imageid = optional_param('image', 0, PARAM_INT);
if ($imageid > 0) {
    $img = local_prequran_external::class_group_chat_image((int)$USER->id, $groupid, $imageid);
    echo json_encode($img ?: ['ok' => false], JSON_UNESCAPED_SLASHES);
    exit;
}

$result = local_prequran_external::class_group_chat_exchange((int)$USER->id, $groupid, $body, max(0, $since), 60, max(0, $replyto));
echo json_encode($result, JSON_UNESCAPED_SLASHES);
