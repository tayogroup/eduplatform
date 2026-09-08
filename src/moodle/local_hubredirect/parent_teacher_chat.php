<?php
declare(strict_types=1);

// Parent <-> teacher chat, the door for anyone inside MOODLE - a teacher on
// the per-student page, a parent on their own Workspace.
//
// Two doors, split by AUTH rather than by party: this one is session +
// sesskey, and the family portal's is the minted-token handler, because that
// page is served from the CDN and has no Moodle session to offer.
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

if ($workspaceid <= 0) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'A workspace is required.']);
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
// WHICH ADULT IS THIS? Resolved from the caller's relationship to the child,
// never from the request - a role read from a parameter would let a parent
// send as staff, which is the invariant tools/check-parent-teacher-chat.php is
// built around.
$teaches = false;
if (pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)
        && pqh_table_exists_safe('local_prequran_teacher_student')) {
    $teaches = $DB->record_exists('local_prequran_teacher_student',
        ['teacherid' => (int)$USER->id, 'studentid' => $studentid, 'status' => 'active']);
}
if (!$teaches
        && pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)
        && pqh_table_exists_safe('local_prequran_class_group')
        && pqh_table_exists_safe('local_prequran_group_member')) {
    $teaches = $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_group_member} gm
           JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
          WHERE gm.studentid = :sid AND cg.teacherid = :tid",
        ['sid' => $studentid, 'tid' => (int)$USER->id]);
}
if (!$teaches && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    $teaches = true;   // a manager reads their workspace's families, as staff
}

// A GUARDIAN OF THIS CHILD, by the same two links workspace_parent.php uses to
// build a parent's own list of children: a consent row, or an existing
// parent participant row on a thread about them.
$guardian = false;
if (!$teaches) {
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $consenttable) {
        if (pqh_table_exists_safe($consenttable)
                && $DB->record_exists($consenttable, ['guardianid' => (int)$USER->id, 'studentid' => $studentid])) {
            $guardian = true;
            break;
        }
    }
    if (!$guardian && pqh_table_exists_safe('local_prequran_comm_participant')) {
        $guardian = $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_participant} p
               JOIN {local_prequran_comm_thread} t ON t.id = p.threadid
              WHERE p.userid = :uid AND p.role = 'parent' AND t.studentid = :sid",
            ['uid' => (int)$USER->id, 'sid' => $studentid]);
    }
}

if (!$teaches && !$guardian) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'That child is not linked to you.']);
    exit;
}

// Always as the CALLER, and in the standing their relationship gives them. A
// manager reading a teacher's conversation writes as themselves and is shown
// as staff — the board's rule for the same situation.
$result = local_prequran_external::parent_teacher_chat_exchange(
    (int)$USER->id, $studentid, $teaches ? 'teacher' : 'parent', $body, $since);

echo json_encode($result, JSON_UNESCAPED_SLASHES);
