<?php
declare(strict_types=1);

// Live group board — the teacher answering a raised hand.
//
// A hand nobody can lower is as broken as a hand nobody can raise: within one
// cycle the board would be a wall of permanent flags and the teacher would stop
// reading it. Two things clear a hand — the learner lowering it themselves
// (they got unstuck), and this, the teacher marking it answered.
//
// The row is written with the LEARNER as actorid and the teacher recorded in
// details, so pqlgb_hand_state() stays a single-actor query rather than having
// to know a hand can be lowered by someone other than the person who raised it.
//
// Gating is restated rather than inherited from the page, exactly as the poll
// endpoint restates it: an endpoint that trusts the page having checked is an
// endpoint anyone can call directly. The extra condition here is that the
// learner must be in a group THIS teacher runs — without it, a teacher of any
// workspace could clear any learner's hand by guessing a userid.

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');

require_login();
require_sesskey();

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$learnerid = optional_param('learnerid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST only.']);
    exit;
}
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Teacher access to this workspace is required.']);
    exit;
}

$teacherid = (int)$USER->id;
$requestedteacherid = optional_param('teacherid', 0, PARAM_INT);
if ($requestedteacherid > 0 && $requestedteacherid !== $teacherid
        && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    $teacherid = $requestedteacherid;
}

// The learner must actually be on this teacher's board. Rebuilt rather than
// trusted from the request, so the set of clearable hands is exactly the set
// the teacher can see.
$roster = pqlgb_group_roster(array_map('intval', array_keys(pqlgb_teacher_groups($teacherid, $workspaceid))));
$mine = [];
foreach ($roster as $members) {
    foreach ($members as $userid) {
        $mine[(int)$userid] = true;
    }
}
if ($learnerid <= 0 || !isset($mine[$learnerid])) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'That learner is not in one of your groups.']);
    exit;
}

$done = pqlgb_lower_hand($learnerid, (int)$USER->id);
if (!$done) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'The hand could not be cleared.']);
    exit;
}

echo json_encode(['ok' => true, 'learnerid' => $learnerid]);
