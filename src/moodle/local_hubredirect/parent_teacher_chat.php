<?php
declare(strict_types=1);

// Parent <-> teacher chat, the TEACHER'S door.
//
// Everything after auth is
// local_prequran_external::parent_teacher_chat_exchange(), the same function
// the family portal calls through its own door. Two doors, one implementation
// — the rule the classroom chat set, so the two sides of one conversation
// cannot drift apart.
//
// WHAT IS NEW HERE COMPARED WITH THE CLASSROOM ROOM: nothing is hidden. A
// learner's message in a class group is stamped `group_teacher_only` because
// nine children share that room and the requirements say twice there is no
// student-to-student messaging. This thread has exactly two adults in it and
// one subject between them — the child — so both sides see everything, and a
// stamp would hide a parent's message from the person it is addressed to.
//
// Gating is RESTATED rather than inherited from any page, exactly as the
// board's own endpoints restate theirs. The condition that matters: the child
// must be one this teacher actually teaches, or the caller must manage the
// workspace. Without it any teacher could read any family's conversation by
// guessing a studentid.

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
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
$studentid = optional_param('studentid', 0, PARAM_INT);
$since = optional_param('since', 0, PARAM_INT);
$body = trim((string)optional_param('body', '', PARAM_RAW));
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);

if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Teacher access to this workspace is required.']);
    exit;
}

if ($studentid <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'No student was named.']);
    exit;
}

// The relationship is REBUILT, never trusted from the request — the same
// reason the board's chat door rebuilds pqlgb_teacher_groups() rather than
// accepting a groupid. A manager may read any family in their workspace; a
// teacher may read only the families of children they teach.
//
// Resolved HERE rather than through pqh_teacher_students(), which lives in
// dashboard.php — a page that renders. Requiring it from an AJAX endpoint to
// borrow one function would execute a dashboard. The two paths below are the
// two that helper uses: an explicit teacher-student assignment, and a shared
// class group.
$teaches = false;
if (pqh_table_exists_safe('local_prequran_teacher_student')) {
    $teaches = $DB->record_exists('local_prequran_teacher_student',
        ['teacherid' => (int)$USER->id, 'studentid' => $studentid, 'status' => 'active']);
}
if (!$teaches
        && pqh_table_exists_safe('local_prequran_class_group')
        && pqh_table_exists_safe('local_prequran_group_member')) {
    $teaches = $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_group_member} gm
           JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
          WHERE gm.studentid = :sid AND cg.teacherid = :tid",
        ['sid' => $studentid, 'tid' => (int)$USER->id]);
}
if (!$teaches && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'That is not one of your students.']);
    exit;
}

// Always as the CALLER. A manager reading a teacher's conversation writes as
// themselves and is shown as staff — the board's rule for the same situation.
$result = local_prequran_external::parent_teacher_chat_exchange(
    (int)$USER->id, $studentid, 'teacher', $body, $since);

echo json_encode($result, JSON_UNESCAPED_SLASHES);
