<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/admissionslib.php');
require_once(__DIR__ . '/finance_lib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Attendance operations require workspace teacher or administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Attendance access denied');
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$consumercontext = pqh_current_consumer_context();
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$ready = pqh_table_exists_safe('local_prequran_live_attendance') && pqh_table_exists_safe('local_prequran_att_rule');

function pqatt_statuses(): array {
    return [
        'present' => 'Present',
        'late' => 'Late',
        'excused' => 'Excused',
        'absent' => 'Absent',
        'makeup_completed' => 'Make-up completed',
    ];
}

function pqatt_latest_rule(int $workspaceid): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_att_rule')) {
        return null;
    }
    $rules = $DB->get_records('local_prequran_att_rule', ['workspaceid' => $workspaceid, 'status' => 'active'], 'termid DESC, offeringid DESC, id DESC', '*', 0, 1);
    return $rules ? reset($rules) : null;
}

function pqatt_student_absence_count(int $workspaceid, int $studentid): int {
    global $DB;
    if ($workspaceid <= 0 || $studentid <= 0 || !pqh_table_exists_safe('local_prequran_live_attendance')) {
        return 0;
    }
    $where = 'studentid = :studentid AND attendance_status = :status';
    $params = ['studentid' => $studentid, 'status' => 'absent'];
    if (pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
        $where .= ' AND workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    if (pqh_table_has_field_safe('local_prequran_live_attendance', 'excused')) {
        $where .= ' AND excused = 0';
    }
    return (int)$DB->count_records_select('local_prequran_live_attendance', $where, $params);
}

function pqatt_apply_rule_actions(int $workspaceid, int $studentid, int $attendanceid, ?stdClass $rule, $consumercontext, int $actorid): void {
    global $DB;
    if (!$rule || $studentid <= 0) {
        return;
    }
    $absencecount = pqatt_student_absence_count($workspaceid, $studentid);
    $standing = '';
    $holdaction = '';
    if ($absencecount >= (int)$rule->absence_warning_count) {
        $standing = (string)$rule->academic_standing_behavior;
    }
    if ($absencecount >= (int)$rule->absence_hold_count) {
        $holdaction = (string)$rule->finance_hold_behavior;
        if (pqfin_hold_schema_ready() && in_array($holdaction, ['warning_only', 'block_enrollment', 'block_services'], true)) {
            $exists = $DB->record_exists('local_prequran_finance_hold', [
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'source' => 'attendance',
                'status' => 'active',
            ]);
            if (!$exists) {
                $now = time();
                $DB->insert_record('local_prequran_finance_hold', (object)[
                    'consumerid' => (int)($consumercontext->consumerid ?? 0),
                    'workspaceid' => $workspaceid,
                    'billingaccountid' => 0,
                    'studentid' => $studentid,
                    'invoiceid' => 0,
                    'paymentid' => 0,
                    'holdtype' => 'attendance',
                    'source' => 'attendance',
                    'severity' => $holdaction === 'warning_only' ? 'warning' : 'blocker',
                    'status' => 'active',
                    'policyaction' => $holdaction,
                    'currency' => pqfin_default_currency(),
                    'amount' => '0.00',
                    'reasoncode' => 'attendance_absence_threshold',
                    'reason' => 'Attendance absence threshold reached.',
                    'parentmessage' => 'Please contact the academy team about attendance and make-up planning.',
                    'resolutionnote' => '',
                    'metadatajson' => pqadm_metadata(['absence_count' => $absencecount, 'ruleid' => (int)$rule->id]),
                    'detectedat' => $now,
                    'activatedat' => $now,
                    'resolvedat' => 0,
                    'createdby' => $actorid,
                    'modifiedby' => $actorid,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
            }
        }
    }
    if ($standing !== '' || $holdaction !== '') {
        $attendance = $DB->get_record('local_prequran_live_attendance', ['id' => $attendanceid], '*', IGNORE_MISSING);
        if ($attendance) {
            if (pqh_table_has_field_safe('local_prequran_live_attendance', 'standing_action')) {
                $attendance->standing_action = $standing;
            }
            if (pqh_table_has_field_safe('local_prequran_live_attendance', 'finance_hold_action')) {
                $attendance->finance_hold_action = $holdaction;
            }
            $attendance->timemodified = time();
            $DB->update_record('local_prequran_live_attendance', $attendance);
        }
    }
}

$notice = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!$ready) {
            throw new invalid_parameter_exception('Attendance operations tables are not installed yet. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_rule' && $canmanage) {
            $ruleid = optional_param('ruleid', 0, PARAM_INT);
            $existing = $ruleid > 0 ? $DB->get_record('local_prequran_att_rule', ['id' => $ruleid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'termid' => optional_param('termid', 0, PARAM_INT),
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'rule_name' => optional_param('rule_name', 'Default attendance rule', PARAM_TEXT),
                'late_after_minutes' => optional_param('late_after_minutes', 10, PARAM_INT),
                'absence_warning_count' => optional_param('absence_warning_count', 3, PARAM_INT),
                'absence_hold_count' => optional_param('absence_hold_count', 5, PARAM_INT),
                'makeup_required_after_absent' => optional_param('makeup_required_after_absent', 1, PARAM_INT) ? 1 : 0,
                'excused_counts_present' => optional_param('excused_counts_present', 0, PARAM_INT) ? 1 : 0,
                'finance_hold_behavior' => optional_param('finance_hold_behavior', 'warning_only', PARAM_ALPHANUMEXT),
                'academic_standing_behavior' => optional_param('academic_standing_behavior', 'warning_only', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
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
            $notice = 'Attendance rule saved.';
        } else if ($action === 'mark_attendance') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            if ($sessionid <= 0 || $studentid <= 0) {
                throw new invalid_parameter_exception('Session and student are required.');
            }
            $existing = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $status = optional_param('attendance_status', 'present', PARAM_ALPHANUMEXT);
            if (!array_key_exists($status, pqatt_statuses())) {
                $status = 'present';
            }
            $rule = pqatt_latest_rule($workspaceid);
            $record = (object)[
                'sessionid' => $sessionid,
                'userid' => $studentid,
                'studentid' => $studentid,
                'join_time' => pqadm_date_to_time(optional_param('join_date', '', PARAM_TEXT)),
                'leave_time' => 0,
                'attendance_status' => $status,
                'participation_status' => optional_param('participation_status', '', PARAM_TEXT),
                'technical_issue' => optional_param('technical_issue', 0, PARAM_INT) ? 1 : 0,
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'markedby' => (int)$USER->id,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            foreach ([
                'workspaceid' => $workspaceid,
                'termid' => optional_param('termid', 0, PARAM_INT),
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'minutes_late' => optional_param('minutes_late', 0, PARAM_INT),
                'excused' => optional_param('excused', 0, PARAM_INT) ? 1 : 0,
                'makeup_required' => ($status === 'absent' && $rule && (int)$rule->makeup_required_after_absent) ? 1 : (optional_param('makeup_required', 0, PARAM_INT) ? 1 : 0),
                'makeup_sessionid' => optional_param('makeup_sessionid', 0, PARAM_INT),
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
            $notice = 'Attendance saved.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$attendancewhere = pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')
    ? '(a.workspaceid = :workspaceid OR a.workspaceid = 0 OR a.workspaceid IS NULL)'
    : '1=1';
$attendanceparams = pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')
    ? ['workspaceid' => $workspaceid]
    : [];
if ($export === 'csv' && $ready) {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="attendance-report-workspace-' . $workspaceid . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['studentid', 'student', 'email', 'session', 'status', 'late_minutes', 'excused', 'makeup_required', 'standing_action', 'finance_hold_action', 'notes']);
    $rows = $DB->get_records_sql(
        "SELECT a.*, u.firstname, u.lastname, u.email, s.title AS sessiontitle
           FROM {local_prequran_live_attendance} a
      LEFT JOIN {user} u ON u.id = a.studentid
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE {$attendancewhere}
       ORDER BY a.timemodified DESC",
        $attendanceparams,
        0,
        2000
    );
    foreach ($rows as $row) {
        fputcsv($out, [(int)$row->studentid, fullname($row), (string)$row->email, (string)($row->sessiontitle ?? ('Session #' . (int)$row->sessionid)), (string)$row->attendance_status, (int)($row->minutes_late ?? 0), (int)($row->excused ?? 0), (int)($row->makeup_required ?? 0), (string)($row->standing_action ?? ''), (string)($row->finance_hold_action ?? ''), (string)$row->notes]);
    }
    fclose($out);
    exit;
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/attendance_operations.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Attendance Operations');
$PAGE->set_heading('Attendance Operations');

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

echo $OUTPUT->header();
echo '<style>.pqatt-wrap{max-width:1180px;margin:0 auto}.pqatt-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px}.pqatt-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqatt-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqatt-field{margin-bottom:10px}.pqatt-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqatt-input,.pqatt-select,.pqatt-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqatt-textarea{min-height:70px}.pqatt-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqatt-btn--light{background:#f7fbf8;color:#173044}.pqatt-table{width:100%;border-collapse:collapse}.pqatt-table th,.pqatt-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqatt-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqatt-muted{color:#617064;font-size:12px}.pqatt-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqatt-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqatt-grid,.pqatt-top{display:block}}</style>';
echo '<div class="pqatt-wrap"><div class="pqatt-top"><div><h2>Attendance And Participation</h2><div class="pqatt-muted">' . s($workspace->name) . ' session attendance, late/excused/absence/make-up tracking, reports, standing, and finance hold actions.</div></div><div><a class="pqatt-btn pqatt-btn--light" href="' . (new moodle_url('/local/hubredirect/attendance_operations.php', $urlparams + ['export' => 'csv']))->out(false) . '">Export CSV</a> <a class="pqatt-btn pqatt-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div></div>';
if ($notice !== '') { echo '<div class="pqatt-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqatt-error">' . s($error) . '</div>'; }
if (!$ready) { echo '<div class="pqatt-error">Attendance operations schema is not ready. Run the Moodle local_prequran upgrade.</div>'; }
echo '<div class="pqatt-grid"><section class="pqatt-panel"><h3>Mark Attendance</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="mark_attendance">';
echo '<div class="pqatt-field"><label>Session</label><select class="pqatt-select" name="sessionid">';
foreach ($sessions as $session) { echo '<option value="' . (int)$session->id . '">' . s($session->title . ' / ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))) . '</option>'; }
echo '</select></div><div class="pqatt-field"><label>Student</label><select class="pqatt-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student) . ' / ' . $student->email) . '</option>'; }
echo '</select></div><div class="pqatt-field"><label>Status</label><select class="pqatt-select" name="attendance_status">';
foreach (pqatt_statuses() as $key => $label) { echo '<option value="' . s($key) . '">' . s($label) . '</option>'; }
echo '</select></div>';
echo '<div class="pqatt-field"><label>Term</label><select class="pqatt-select" name="termid"><option value="0">No term</option>';
foreach ($terms as $term) { echo '<option value="' . (int)$term->id . '">' . s($term->title) . '</option>'; }
echo '</select></div><div class="pqatt-field"><label>Offering</label><select class="pqatt-select" name="offeringid"><option value="0">No offering</option>';
foreach ($offerings as $offering) { echo '<option value="' . (int)$offering->id . '">' . s($offering->title) . '</option>'; }
echo '</select></div>';
foreach ([['minutes_late','Minutes late'],['makeup_sessionid','Make-up session ID'],['participation_status','Participation status'],['join_date','Join date']] as $field) {
    echo '<div class="pqatt-field"><label>' . s($field[1]) . '</label><input class="pqatt-input" name="' . s($field[0]) . '"></div>';
}
echo '<div class="pqatt-field"><label><input type="checkbox" name="excused" value="1"> Excused</label></div><div class="pqatt-field"><label><input type="checkbox" name="makeup_required" value="1"> Make-up required</label></div><div class="pqatt-field"><label><input type="checkbox" name="technical_issue" value="1"> Technical issue</label></div><div class="pqatt-field"><label>Notes</label><textarea class="pqatt-textarea" name="notes"></textarea></div><button class="pqatt-btn" type="submit">Save Attendance</button></form>';
if ($canmanage) {
    echo '<hr><h3>Attendance Rule</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_rule">';
    foreach ([['rule_name','Rule name','Default attendance rule'],['late_after_minutes','Late after minutes','10'],['absence_warning_count','Warning absence count','3'],['absence_hold_count','Hold absence count','5'],['finance_hold_behavior','Finance hold behavior','warning_only'],['academic_standing_behavior','Academic standing behavior','warning_only'],['status','Status','active']] as $field) {
        echo '<div class="pqatt-field"><label>' . s($field[1]) . '</label><input class="pqatt-input" name="' . s($field[0]) . '" value="' . s($field[2]) . '"></div>';
    }
    echo '<div class="pqatt-field"><label><input type="checkbox" name="makeup_required_after_absent" value="1" checked> Require make-up after absent</label></div><div class="pqatt-field"><label><input type="checkbox" name="excused_counts_present" value="1"> Excused counts as present</label></div><div class="pqatt-field"><label>Notes</label><textarea class="pqatt-textarea" name="notes"></textarea></div><button class="pqatt-btn" type="submit">Save Rule</button></form>';
}
echo '</section><section class="pqatt-panel"><h3>Recent Attendance</h3><table class="pqatt-table"><thead><tr><th>Student</th><th>Session</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
foreach ($attendance as $row) {
    echo '<tr><td><strong>' . s(fullname($row)) . '</strong><div class="pqatt-muted">' . s($row->email) . '</div></td><td>' . s((string)($row->sessiontitle ?? ('Session #' . (int)$row->sessionid))) . '<div class="pqatt-muted">' . s(userdate((int)($row->scheduled_start ?? $row->timemodified), get_string('strftimedatetimeshort'))) . '</div></td><td><span class="pqatt-pill">' . s($row->attendance_status) . '</span><div class="pqatt-muted">late ' . (int)($row->minutes_late ?? 0) . ' / excused ' . (int)($row->excused ?? 0) . ' / make-up ' . (int)($row->makeup_required ?? 0) . '</div></td><td>' . s((string)($row->standing_action ?? '')) . '<div class="pqatt-muted">' . s((string)($row->finance_hold_action ?? '')) . '</div></td></tr>';
}
if (!$attendance) { echo '<tr><td colspan="4" class="pqatt-muted">No attendance rows yet.</td></tr>'; }
echo '</tbody></table><h3>Active Rules</h3><table class="pqatt-table"><thead><tr><th>Rule</th><th>Thresholds</th><th>Behavior</th></tr></thead><tbody>';
foreach ($rules as $rule) {
    echo '<tr><td><strong>' . s($rule->rule_name) . '</strong><div class="pqatt-muted">' . s($rule->status) . '</div></td><td>Late after ' . (int)$rule->late_after_minutes . ' min<br>Warning at ' . (int)$rule->absence_warning_count . '<br>Hold at ' . (int)$rule->absence_hold_count . '</td><td>' . s($rule->academic_standing_behavior) . '<div class="pqatt-muted">' . s($rule->finance_hold_behavior) . '</div></td></tr>';
}
if (!$rules) { echo '<tr><td colspan="3" class="pqatt-muted">No attendance rules yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
