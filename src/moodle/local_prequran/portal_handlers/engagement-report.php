<?php
// Portal handler: engagement-report (workspace admin/teacher). Aggregates the
// engagement signals that were captured but never reported: last login, days
// since active, live-session participation count, quiz attempts + time-on-task.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

$userid = (int)($claims['sub'] ?? 0);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT));
$role = $workspaceid > 0 ? pqh_user_workspace_role($userid, $workspaceid) : '';

if ($workspaceid <= 0 || !in_array($role, ['platform_admin', 'owner', 'admin', 'teacher', 'coordinator', 'registrar'], true)) {
    pqpd_fail(403, 'Engagement reports require teacher or workspace administrator access.');
}

$now = time();
$windowdays = max(7, min(180, optional_param('windowdays', 30, PARAM_INT)));
$since = $now - $windowdays * DAYSECS;

// Active student members.
$students = [];
$studentids = [];
if (pqh_table_exists_safe('local_prequran_workspace_member')) {
    $rows = $DB->get_records_sql(
        "SELECT wm.userid, u.firstname, u.lastname, u.lastaccess
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :ws AND wm.status = 'active' AND wm.workspace_role = 'student'
       ORDER BY u.lastname ASC, u.firstname ASC", ['ws' => $workspaceid], 0, 1000);
    foreach ($rows as $r) {
        $studentids[] = (int)$r->userid;
        $students[(int)$r->userid] = ['name' => fullname($r), 'lastaccess' => (int)$r->lastaccess];
    }
}

// Session participation counts in-window (per student).
$sessions = [];
if ($studentids && pqh_table_exists_safe('local_prequran_live_participant') && pqh_table_exists_safe('local_prequran_live_session')) {
    [$insql, $inparams] = $DB->get_in_or_equal($studentids, SQL_PARAMS_NAMED, 'sp');
    $inparams['since'] = $since;
    $rows = $DB->get_records_sql(
        "SELECT p.studentid, COUNT(1) AS cnt
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
          WHERE p.studentid $insql AND s.scheduled_start >= :since
       GROUP BY p.studentid", $inparams);
    foreach ($rows as $r) {
        $sessions[(int)$r->studentid] = (int)$r->cnt;
    }
}

// Quiz attempts + time-on-task in-window (per student).
$quiz = [];
if ($studentids && pqh_table_exists_safe('local_prequran_quiz_attempt')) {
    [$insql, $inparams] = $DB->get_in_or_equal($studentids, SQL_PARAMS_NAMED, 'qp');
    $inparams['since'] = $since;
    $rows = $DB->get_records_sql(
        "SELECT userid, COUNT(1) AS attempts, SUM(duration_seconds) AS secs
           FROM {local_prequran_quiz_attempt}
          WHERE userid $insql AND timecreated >= :since
       GROUP BY userid", $inparams);
    foreach ($rows as $r) {
        $quiz[(int)$r->userid] = ['attempts' => (int)$r->attempts, 'minutes' => (int)round(((int)$r->secs) / 60)];
    }
}

$out = [];
$activecount = 0;
foreach ($students as $sid => $s) {
    $daysinactive = $s['lastaccess'] > 0 ? (int)floor(($now - $s['lastaccess']) / DAYSECS) : null;
    $sessioncount = $sessions[$sid] ?? 0;
    $q = $quiz[$sid] ?? ['attempts' => 0, 'minutes' => 0];
    // A student is "engaged" this window if they logged in, attended, or did a quiz.
    $engaged = ($daysinactive !== null && $daysinactive <= $windowdays) || $sessioncount > 0 || $q['attempts'] > 0;
    if ($engaged) {
        $activecount++;
    }
    $out[] = [
        'studentid' => $sid,
        'name' => $s['name'],
        'last_active' => $s['lastaccess'],
        'days_inactive' => $daysinactive,
        'sessions' => $sessioncount,
        'quiz_attempts' => $q['attempts'],
        'quiz_minutes' => $q['minutes'],
        'engaged' => $engaged,
    ];
}
// Least engaged first.
usort($out, static function (array $a, array $b): int {
    return ($b['days_inactive'] ?? 99999) <=> ($a['days_inactive'] ?? 99999);
});

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'windowdays' => $windowdays,
    'metrics' => [
        'students' => count($students),
        'engaged' => $activecount,
        'engagement_rate' => count($students) > 0 ? round(100 * $activecount / count($students), 1) : null,
    ],
    'students' => $out,
], JSON_UNESCAPED_SLASHES);
exit;
