<?php
// ---- report: at-risk-report (at-risk student intervention report) -----------
// Ported from local_hubredirect/at_risk_report.php via
// at_risk_report_portallib (pqarrl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
// GET  = the at-risk rows and headline metrics the page computes (configurable
//        rules over live signals: no-login days, 30d attendance %, missed
//        classes), each row decorated with the student name (the page renders
//        names inline while listing).
// POST = do=mark_reviewed / do=add_note — the page's reviewed/intervention-note
//        audit writes ported verbatim (parr_audit -> pqarrl_audit). The legacy
//        confirm_sesskey() gate is dropped: token auth replaces the session key.
// (at_risk_report.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/at_risk_report_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- Access + workspace resolution: same order and outcomes as the legacy
// page (at_risk_report.php lines 13-34). The legacy pqh_access_denied() redirect
// becomes a 403 JSON failure with the identical message. Applied to both GET and
// POST — the page enforces the gate once at the top for every request.
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
if ($workspaceid <= 0) {
    $workspaceid = pqh_current_workspace_id($userid);
}

$canops = pqh_can_manage_academy_operations($userid);
$canmanage = $canops || ($workspaceid > 0 && pqh_user_can_manage_workspace($userid, $workspaceid));
$canteach = $workspaceid > 0 && pqh_user_can_teach_in_workspace($userid, $workspaceid);
if (!$canmanage && !$canteach) {
    pqpd_fail(403, 'Only workspace managers and teachers can open the at-risk report.');
}

// ---- POST: reviewed / intervention-note writes (verbatim from page lines
// 64-79). data_submitted()+confirm_sesskey() is replaced by token auth; the
// page-level access gate above still applies.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    $actionstudent = (int)($body['studentid'] ?? 0);

    if ($do === 'mark_reviewed') {
        if ($actionstudent <= 0) {
            pqpd_fail(403, 'Choose a valid student before marking reviewed.');
        }
        pqarrl_audit($actionstudent, 'atrisk_reviewed', ['workspaceid' => $workspaceid]);
        echo json_encode(['ok' => true, 'message' => 'Marked as reviewed.', 'studentid' => $actionstudent], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'add_note') {
        if ($actionstudent <= 0) {
            pqpd_fail(403, 'Choose a valid student before saving a note.');
        }
        $notetext = trim((string)($body['note'] ?? ''));
        if ($notetext !== '') {
            pqarrl_audit($actionstudent, 'atrisk_note', ['workspaceid' => $workspaceid, 'note' => core_text::substr($notetext, 0, 500)]);
        }
        echo json_encode(['ok' => true, 'message' => 'Intervention note saved.', 'studentid' => $actionstudent], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown at-risk action.');
}

// ---- configurable rules (verbatim from page lines 37-43) --------------------
$inactivedays = max(3, min(90, optional_param('inactivedays', 14, PARAM_INT)));
$attendthreshold = max(10, min(100, optional_param('attendthreshold', 70, PARAM_INT)));
$missedthreshold = max(1, min(20, optional_param('missedthreshold', 3, PARAM_INT)));
$risklevelfilter = optional_param('risklevel', '', PARAM_ALPHA);
$now = time();
$window = 30 * DAYSECS;

// ---- student population (workspace members; teachers scoped to their own) ----
$population = [];
if ($workspaceid > 0 && pqh_table_exists_safe('local_prequran_workspace_member')) {
    $rows = $DB->get_records('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid, 'workspace_role' => 'student', 'status' => 'active',
    ], '', 'id, userid');
    foreach ($rows as $row) {
        $population[(int)$row->userid] = (int)$row->userid;
    }
}
if (!$canmanage && $canteach && pqh_table_exists_safe('local_prequran_teacher_student')) {
    $scoperows = $DB->get_records('local_prequran_teacher_student', [
        'teacherid' => $userid, 'status' => 'active',
    ], '', 'id, studentid');
    $scope = [];
    foreach ($scoperows as $row) {
        $scope[(int)$row->studentid] = true;
    }
    $population = array_filter($population, static function(int $sid) use ($scope): bool {
        return !empty($scope[$sid]);
    });
}

// ---- bulk signals -----------------------------------------------------------
$lastaccess = [];
$names = [];
$accounts = [];
if ($population) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parr');
    $users = $DB->get_records_select('user', "id $insql AND deleted = 0", $inparams, '', 'id, firstname, lastname, idnumber, lastaccess');
    foreach ($users as $u) {
        $lastaccess[(int)$u->id] = (int)$u->lastaccess;
        $names[(int)$u->id] = fullname($u);
        $accounts[(int)$u->id] = trim((string)$u->idnumber);
    }
}
$expected = [];
$attended = [];
if ($population && pqh_table_exists_safe('local_prequran_live_session') && pqh_table_exists_safe('local_prequran_live_participant')) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parre');
    $inparams['ws'] = $workspaceid;
    $inparams['from'] = $now - $window;
    $inparams['to'] = $now;
    $expectedrows = $DB->get_records_sql(
        "SELECT p.studentid, COUNT(1) AS cnt
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
          WHERE p.studentid $insql AND p.role = 'student' AND p.status = 'active'
            AND s.workspaceid = :ws AND s.status <> 'cancelled'
            AND s.scheduled_end >= :from AND s.scheduled_end < :to
       GROUP BY p.studentid", $inparams);
    foreach ($expectedrows as $row) {
        $expected[(int)$row->studentid] = (int)$row->cnt;
    }
    if (pqh_table_exists_safe('local_prequran_live_attendance')) {
        $attendedrows = $DB->get_records_sql(
            "SELECT a.studentid, COUNT(1) AS cnt
               FROM {local_prequran_live_attendance} a
               JOIN {local_prequran_live_session} s ON s.id = a.sessionid
              WHERE a.studentid $insql AND a.join_time > 0
                AND s.workspaceid = :ws
                AND s.scheduled_end >= :from AND s.scheduled_end < :to
           GROUP BY a.studentid", $inparams);
        foreach ($attendedrows as $row) {
            $attended[(int)$row->studentid] = (int)$row->cnt;
        }
    }
}
$teachers = [];
if ($population && pqh_table_exists_safe('local_prequran_teacher_student')) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parrt');
    $trs = $DB->get_records_select('local_prequran_teacher_student', "studentid $insql AND status = 'active'", $inparams, '', 'id, studentid, teacherid');
    foreach ($trs as $tr) {
        if (!isset($teachers[(int)$tr->studentid])) {
            $tuser = core_user::get_user((int)$tr->teacherid, 'id, firstname, lastname', IGNORE_MISSING);
            $teachers[(int)$tr->studentid] = $tuser ? fullname($tuser) : 'Teacher #' . (int)$tr->teacherid;
        }
    }
}
$reviewed = [];
$notes = [];
if ($population && pqh_table_exists_safe('local_prequran_live_audit')) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parrr');
    $inparams['since'] = $now - $window;
    $auditrows = $DB->get_records_select('local_prequran_live_audit',
        "targettype = 'student' AND targetid $insql AND action IN ('atrisk_reviewed', 'atrisk_note') AND timecreated >= :since",
        $inparams, 'timecreated DESC', 'id, targetid, action, details, timecreated');
    foreach ($auditrows as $row) {
        $sid = (int)$row->targetid;
        if ($row->action === 'atrisk_reviewed' && !isset($reviewed[$sid])) {
            $reviewed[$sid] = (int)$row->timecreated;
        }
        if ($row->action === 'atrisk_note' && !isset($notes[$sid])) {
            $decoded = json_decode((string)$row->details, true);
            $notes[$sid] = (string)($decoded['note'] ?? '');
        }
    }
}

// ---- evaluate rules (verbatim from page lines 180-232) ----------------------
$atrisk = [];
$highcount = 0;
$mediumcount = 0;
foreach ($population as $sid) {
    $reasons = [];
    $la = $lastaccess[$sid] ?? 0;
    $inactivefor = $la > 0 ? (int)floor(($now - $la) / DAYSECS) : null;
    if ($inactivefor === null || $inactivefor >= $inactivedays) {
        $reasons[] = $inactivefor === null ? 'Never logged in' : 'No login ' . $inactivefor . 'd';
    }
    $exp = $expected[$sid] ?? 0;
    $att = min($attended[$sid] ?? 0, $exp);
    $rate = $exp > 0 ? (int)round(100 * $att / $exp) : null;
    if ($rate !== null && $rate < $attendthreshold) {
        $reasons[] = 'Attendance ' . $rate . '%';
    }
    $missed = max(0, $exp - $att);
    if ($missed >= $missedthreshold) {
        $reasons[] = $missed . ' classes missed';
    }
    if (!$reasons) {
        continue;
    }
    $level = (count($reasons) >= 2 || ($inactivefor !== null && $inactivefor >= 2 * $inactivedays) || $inactivefor === null) ? 'high' : 'medium';
    if ($risklevelfilter !== '' && $risklevelfilter !== $level) {
        continue;
    }
    if ($level === 'high') {
        $highcount++;
    } else {
        $mediumcount++;
    }
    $atrisk[] = [
        'id' => $sid,
        'name' => $names[$sid] ?? ('Student #' . $sid),
        'account' => $accounts[$sid] ?? '',
        'teacher' => $teachers[$sid] ?? 'Unassigned',
        'level' => $level,
        'reasons' => $reasons,
        'lastaccess' => $la,
        'rate' => $rate,
        'missed' => $missed,
        'reviewedat' => $reviewed[$sid] ?? 0,
        'note' => $notes[$sid] ?? '',
        // Deep-links into the Moodle live pages (the page renders these via the
        // shared pqh_live_*_link() helpers, defined in dashboard.php and not
        // loaded here — built inline as absolute URLs instead of copying them).
        'scheduleurl' => $CFG->wwwroot . '/local/hubredirect/live_schedule.php?childid=' . $sid,
        'summariesurl' => $CFG->wwwroot . '/local/hubredirect/live_summaries.php?childid=' . $sid,
    ];
}
usort($atrisk, static function(array $a, array $b): int {
    if ($a['level'] !== $b['level']) {
        return $a['level'] === 'high' ? -1 : 1;
    }
    return $a['lastaccess'] <=> $b['lastaccess'];
});

$reviewedweek = 0;
foreach ($reviewed as $ts) {
    if ($ts >= $now - 7 * DAYSECS) {
        $reviewedweek++;
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'canmanage' => $canmanage,
    'canteach' => $canteach,
    'rules' => [
        'inactivedays' => $inactivedays,
        'attendthreshold' => $attendthreshold,
        'missedthreshold' => $missedthreshold,
        'risklevel' => $risklevelfilter,
    ],
    'metrics' => [
        'high' => $highcount,
        'medium' => $mediumcount,
        'monitored' => count($population),
        'reviewedweek' => $reviewedweek,
    ],
    'students' => $atrisk,
], JSON_UNESCAPED_SLASHES);
exit;
