<?php
// ---- report: attendance-operations (workspace attendance ops + report) --------
// Ported from local_hubredirect/attendance_operations.php via
// attendance_operations_portallib (pqatt_*). Dispatched from portal_data.php
// AFTER token auth: $claims is verified, $USER is the token user, JSON exception
// handler + CORS headers are installed. The legacy page stays live in parallel
// and is untouched.
//
// GET  ?report=attendance-operations&token=…[&workspaceid=&consumer=]
//      -> the workspace attendance rows, active rules, and the mark-attendance
//         option lists (sessions/students/terms/offerings), plus roll-up metrics
//         for the KPI tiles. Student/session pickers carry id + display name
//         only; there are no BBB room credentials in any of these queries to
//         curate. The legacy CSV export becomes a dataset the page turns into a
//         client-side CSV (no server file-download branch).
// POST body JSON {"do": …}:
//      do=save_rule       (legacy action=save_rule, verbatim; manager-only)
//      do=mark_attendance (legacy action=mark_attendance, verbatim; applies the
//                          rule-driven standing/finance-hold actions)
// confirm_sesskey()/require_sesskey() is dropped — token auth replaces it.
// The legacy page never calls pqh_live_security_audit, so there is none to keep.
// Access is the legacy page entry gate verbatim: pqh_current_workspace_id +
// pqh_user_can_teach_in_workspace + a valid workspace row, with the page's exact
// denial message (pqh_access_denied -> pqpd_fail(403, same)).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/admissionslib.php');
require_once($CFG->dirroot . '/local/prequran/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/attendance_operations_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST');
$body = [];
if ($ispost) {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid JSON body.');
    }
}

// ---- page preamble + access gate, replicated verbatim from the legacy page ----
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Attendance operations require workspace teacher or administrator access.');
}
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening attendance operations.');
}
$ready = pqh_table_exists_safe('local_prequran_live_attendance') && pqh_table_exists_safe('local_prequran_att_rule');

// ---- POST: the two legacy write actions (save_rule / mark_attendance) ----------
if ($ispost) {
    $do = (string)($body['do'] ?? '');
    if ($do !== 'save_rule' && $do !== 'mark_attendance') {
        pqpd_fail(400, 'Unknown attendance-operations action.');
    }
    if (!$ready) {
        pqpd_fail(400, 'Attendance operations tables are not installed yet. Run Moodle upgrade.');
    }
    $now = time();

    // ---- do: save_rule (legacy action=save_rule, verbatim; manager-only) -------
    if ($do === 'save_rule') {
        if (!$canmanage) {
            pqpd_fail(403, 'Only workspace owners and admins can save attendance rules.');
        }
        $ruleid = (int)($body['ruleid'] ?? 0);
        $existing = $ruleid > 0 ? $DB->get_record('local_prequran_att_rule', ['id' => $ruleid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
        $record = (object)[
            'workspaceid' => $workspaceid,
            'termid' => (int)($body['termid'] ?? 0),
            'offeringid' => (int)($body['offeringid'] ?? 0),
            'rule_name' => clean_param((string)($body['rule_name'] ?? 'Default attendance rule'), PARAM_TEXT),
            'late_after_minutes' => (int)($body['late_after_minutes'] ?? 10),
            'absence_warning_count' => (int)($body['absence_warning_count'] ?? 3),
            'absence_hold_count' => (int)($body['absence_hold_count'] ?? 5),
            'makeup_required_after_absent' => (int)($body['makeup_required_after_absent'] ?? 1) ? 1 : 0,
            'excused_counts_present' => (int)($body['excused_counts_present'] ?? 0) ? 1 : 0,
            'finance_hold_behavior' => clean_param((string)($body['finance_hold_behavior'] ?? 'warning_only'), PARAM_ALPHANUMEXT),
            'academic_standing_behavior' => clean_param((string)($body['academic_standing_behavior'] ?? 'warning_only'), PARAM_ALPHANUMEXT),
            'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
            'notes' => clean_param((string)($body['notes'] ?? ''), PARAM_TEXT),
            'createdby' => (int)($existing->createdby ?? $USER->id),
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_att_rule', $record);
        } else {
            $DB->insert_record('local_prequran_att_rule', $record);
        }
        echo json_encode([
            'ok' => true,
            'result' => 'rule_saved',
            'message' => 'Attendance rule saved.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // ---- do: mark_attendance (legacy action=mark_attendance, verbatim) ---------
    $sessionid = (int)($body['sessionid'] ?? 0);
    $studentid = (int)($body['studentid'] ?? 0);
    if ($sessionid <= 0 || $studentid <= 0) {
        pqpd_fail(400, 'Session and student are required.');
    }
    $existing = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
    $status = clean_param((string)($body['attendance_status'] ?? 'present'), PARAM_ALPHANUMEXT);
    if (!array_key_exists($status, pqatt_statuses())) {
        $status = 'present';
    }
    $rule = pqatt_latest_rule($workspaceid);
    $record = (object)[
        'sessionid' => $sessionid,
        'userid' => $studentid,
        'studentid' => $studentid,
        'join_time' => pqadm_date_to_time(clean_param((string)($body['join_date'] ?? ''), PARAM_TEXT)),
        'leave_time' => 0,
        'attendance_status' => $status,
        'participation_status' => clean_param((string)($body['participation_status'] ?? ''), PARAM_TEXT),
        'technical_issue' => (int)($body['technical_issue'] ?? 0) ? 1 : 0,
        'notes' => clean_param((string)($body['notes'] ?? ''), PARAM_TEXT),
        'markedby' => (int)$USER->id,
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    foreach ([
        'workspaceid' => $workspaceid,
        'termid' => (int)($body['termid'] ?? 0),
        'offeringid' => (int)($body['offeringid'] ?? 0),
        'minutes_late' => (int)($body['minutes_late'] ?? 0),
        'excused' => (int)($body['excused'] ?? 0) ? 1 : 0,
        'makeup_required' => ($status === 'absent' && $rule && (int)$rule->makeup_required_after_absent) ? 1 : ((int)($body['makeup_required'] ?? 0) ? 1 : 0),
        'makeup_sessionid' => (int)($body['makeup_sessionid'] ?? 0),
        'standing_action' => '',
        'finance_hold_action' => '',
    ] as $field => $value) {
        if (pqh_table_has_field_safe('local_prequran_live_attendance', $field)) {
            $record->{$field} = $value;
        }
    }
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_live_attendance', $record);
        $attendanceid = (int)$existing->id;
    } else {
        $attendanceid = (int)$DB->insert_record('local_prequran_live_attendance', $record);
    }
    pqatt_apply_rule_actions($workspaceid, $studentid, $attendanceid, $rule, $consumercontext, (int)$USER->id);
    echo json_encode([
        'ok' => true,
        'result' => 'attendance_saved',
        'message' => 'Attendance saved.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: attendance rows + rules + option lists + roll-up metrics -------------
$attendancewhere = pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')
    ? '(a.workspaceid = :workspaceid OR a.workspaceid = 0 OR a.workspaceid IS NULL)'
    : '1=1';
$attendanceparams = pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')
    ? ['workspaceid' => $workspaceid]
    : [];

$rules = $ready ? array_values($DB->get_records('local_prequran_att_rule', ['workspaceid' => $workspaceid], 'status ASC, id DESC')) : [];
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records('local_prequran_live_session', ['workspaceid' => $workspaceid], 'scheduled_start DESC', 'id,title,scheduled_start,status', 0, 80)) : [];
$students = pqh_table_exists_safe('local_prequran_workspace_member') ? array_values($DB->get_records_sql(
    "SELECT u.id, u.firstname, u.lastname, u.email
       FROM {local_prequran_workspace_member} wm
       JOIN {user} u ON u.id = wm.userid
      WHERE wm.workspaceid = :workspaceid AND wm.workspace_role = :role AND wm.status = :status
   ORDER BY u.lastname ASC, u.firstname ASC",
    ['workspaceid' => $workspaceid, 'role' => 'student', 'status' => 'active']
)) : [];
$terms = pqh_table_exists_safe('local_prequran_acad_term') ? array_values($DB->get_records('local_prequran_acad_term', ['workspaceid' => $workspaceid], 'startdate DESC')) : [];
$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC')) : [];
$attendance = $ready ? array_values($DB->get_records_sql(
    "SELECT a.*, u.firstname, u.lastname, u.email, s.title AS sessiontitle, s.scheduled_start
       FROM {local_prequran_live_attendance} a
  LEFT JOIN {user} u ON u.id = a.studentid
  LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
      WHERE {$attendancewhere}
   ORDER BY a.timemodified DESC",
    $attendanceparams,
    0,
    120
)) : [];

// Attendance rows for the table + CSV dataset. Student display name is resolved;
// email is left out of the portal payload (portal privacy convention).
$attendanceout = [];
$metrics = ['total' => 0, 'present' => 0, 'late' => 0, 'excused' => 0, 'absent' => 0, 'makeup_required' => 0];
foreach ($attendance as $row) {
    $st = (string)$row->attendance_status;
    $metrics['total']++;
    if (array_key_exists($st, $metrics)) {
        $metrics[$st]++;
    }
    $metrics['makeup_required'] += (int)($row->makeup_required ?? 0) ? 1 : 0;
    $attendanceout[] = [
        'studentid' => (int)$row->studentid,
        'student' => fullname($row),
        'sessionid' => (int)$row->sessionid,
        'session' => (string)($row->sessiontitle ?? ('Session #' . (int)$row->sessionid)),
        'scheduled_start' => (int)($row->scheduled_start ?? $row->timemodified),
        'attendance_status' => $st,
        'minutes_late' => (int)($row->minutes_late ?? 0),
        'excused' => (int)($row->excused ?? 0),
        'makeup_required' => (int)($row->makeup_required ?? 0),
        'standing_action' => (string)($row->standing_action ?? ''),
        'finance_hold_action' => (string)($row->finance_hold_action ?? ''),
        'notes' => (string)$row->notes,
    ];
}

$rulesout = [];
foreach ($rules as $rule) {
    $rulesout[] = [
        'id' => (int)$rule->id,
        'rule_name' => (string)$rule->rule_name,
        'status' => (string)$rule->status,
        'late_after_minutes' => (int)$rule->late_after_minutes,
        'absence_warning_count' => (int)$rule->absence_warning_count,
        'absence_hold_count' => (int)$rule->absence_hold_count,
        'academic_standing_behavior' => (string)$rule->academic_standing_behavior,
        'finance_hold_behavior' => (string)$rule->finance_hold_behavior,
    ];
}

// Session/student pickers expose id + display name only.
$sessionout = [];
foreach ($sessions as $s) {
    $sessionout[] = [
        'id' => (int)$s->id,
        'title' => (string)($s->title ?? ''),
        'scheduled_start' => (int)($s->scheduled_start ?? 0),
        'start_label' => userdate((int)($s->scheduled_start ?? 0), get_string('strftimedatetimeshort')),
        'status' => (string)($s->status ?? ''),
    ];
}
$studentout = array_map(static function($s): array {
    return ['id' => (int)$s->id, 'name' => fullname($s)];
}, $students);
$termout = array_map(static function($t): array {
    return ['id' => (int)$t->id, 'title' => (string)($t->title ?? '')];
}, $terms);
$offeringout = array_map(static function($o): array {
    return ['id' => (int)$o->id, 'title' => (string)($o->title ?? '')];
}, $offerings);

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'brand' => $brandname,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'workspaceid' => $workspaceid,
    'canmanage' => $canmanage,
    'metrics' => $metrics,
    'statuses' => pqatt_statuses(),
    'attendance' => $attendanceout,
    'rules' => $rulesout,
    'sessions' => $sessionout,
    'students' => $studentout,
    'terms' => $termout,
    'offerings' => $offeringout,
], JSON_UNESCAPED_SLASHES);
exit;
