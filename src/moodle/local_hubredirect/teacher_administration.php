<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/operations_layerlib.php');
require_once(__DIR__ . '/finance_lib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Teacher administration requires workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Teacher administration denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqops_ready()) {
            throw new invalid_parameter_exception('Operations tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_contract') {
            $teacherid = optional_param('teacherid', 0, PARAM_INT);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'teacherid' => $teacherid,
                'contract_type' => optional_param('contract_type', 'hourly', PARAM_ALPHANUMEXT),
                'currency' => strtoupper(optional_param('currency', 'USD', PARAM_ALPHANUMEXT)),
                'hourly_rate' => optional_param('hourly_rate', '0.00', PARAM_TEXT),
                'session_rate' => optional_param('session_rate', '0.00', PARAM_TEXT),
                'marketplace_rate' => optional_param('marketplace_rate', '0.00', PARAM_TEXT),
                'effective_start' => pqops_time_from_date(optional_param('effective_start', '', PARAM_TEXT)),
                'effective_end' => pqops_time_from_date(optional_param('effective_end', '', PARAM_TEXT)),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'terms_json' => pqops_json(['terms' => optional_param('terms', '', PARAM_TEXT)]),
                'approvedby' => (int)$USER->id,
                'approvedat' => $now,
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $DB->insert_record('local_prequran_teacher_contract', $record);
            pqops_recalculate_teacher_load($workspaceid, $teacherid);
            $notice = 'Teacher contract/rates saved.';
        } else if ($action === 'assign_student') {
            if (!pqh_table_exists_safe('local_prequran_teacher_student')) {
                throw new invalid_parameter_exception('Teacher-student assignment table is not ready.');
            }
            $teacherid = optional_param('teacherid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_teacher_student', ['workspaceid' => $workspaceid, 'teacherid' => $teacherid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'cohortid' => 0,
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'assignedby' => (int)$USER->id,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_teacher_student', $record);
            } else {
                $DB->insert_record('local_prequran_teacher_student', $record);
            }
            pqops_recalculate_teacher_load($workspaceid, $teacherid);
            $notice = 'Teacher-student assignment saved.';
        } else if ($action === 'substitute') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $subid = optional_param('substitute_teacherid', 0, PARAM_INT);
            $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $request = (object)[
                'workspaceid' => $workspaceid,
                'sessionid' => $sessionid,
                'original_teacherid' => (int)$session->teacherid,
                'substitute_teacherid' => $subid,
                'status' => optional_param('status', 'approved', PARAM_ALPHANUMEXT),
                'reason' => optional_param('reason', '', PARAM_TEXT),
                'handoff_notes' => optional_param('handoff_notes', '', PARAM_TEXT),
                'requestedby' => (int)$USER->id,
                'approvedby' => (int)$USER->id,
                'approvedat' => $now,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $DB->insert_record('local_prequran_sub_request', $request);
            $session->substitute_teacherid = $subid;
            if ((string)$request->status === 'approved') {
                $session->teacherid = $subid;
            }
            $session->timemodified = $now;
            $DB->update_record('local_prequran_live_session', $session);
            $notice = 'Substitute workflow saved.';
        } else if ($action === 'approve_payout') {
            $payout = $DB->get_record('local_prequran_market_payout', ['id' => optional_param('payoutid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $payout->status = optional_param('status', 'approved', PARAM_ALPHANUMEXT);
            $payout->readiness_status = optional_param('readiness_status', 'approved', PARAM_ALPHANUMEXT);
            $payout->readiness_json = pqops_json(['review_note' => optional_param('review_note', '', PARAM_TEXT)]);
            $payout->approvedby = (int)$USER->id;
            $payout->approvedat = $now;
            $payout->modifiedby = (int)$USER->id;
            $payout->timemodified = $now;
            $DB->update_record('local_prequran_market_payout', $payout);
            if (function_exists('pqfin_audit')) {
                pqfin_audit('marketplace_payout_approved', $workspaceid, (int)$payout->studentid, (int)$payout->id, ['teacherid' => (int)$payout->teacherid, 'status' => (string)$payout->status]);
            }
            $notice = 'Marketplace payout readiness updated.';
        } else if ($action === 'refresh_load') {
            pqops_recalculate_teacher_load($workspaceid, optional_param('teacherid', 0, PARAM_INT));
            $notice = 'Teacher load refreshed.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_administration.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Administration');
$PAGE->set_heading('Teacher Administration');

$teachers = pqops_workspace_users($workspaceid, 'teacher');
$students = pqops_workspace_users($workspaceid, 'student');
$contracts = pqh_table_exists_safe('local_prequran_teacher_contract') ? array_values($DB->get_records_sql("SELECT c.*, u.firstname, u.lastname, u.email FROM {local_prequran_teacher_contract} c LEFT JOIN {user} u ON u.id = c.teacherid WHERE c.workspaceid = :workspaceid ORDER BY c.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$loads = pqh_table_exists_safe('local_prequran_teacher_load') ? array_values($DB->get_records_sql("SELECT l.*, u.firstname, u.lastname, u.email FROM {local_prequran_teacher_load} l LEFT JOIN {user} u ON u.id = l.teacherid WHERE l.workspaceid = :workspaceid ORDER BY l.calculatedat DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$assignments = pqh_table_exists_safe('local_prequran_teacher_student') ? array_values($DB->get_records_sql("SELECT ts.*, tu.firstname AS tfirst, tu.lastname AS tlast, su.firstname AS sfirst, su.lastname AS slast FROM {local_prequran_teacher_student} ts LEFT JOIN {user} tu ON tu.id = ts.teacherid LEFT JOIN {user} su ON su.id = ts.studentid WHERE ts.workspaceid = :workspaceid ORDER BY ts.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records('local_prequran_live_session', ['workspaceid' => $workspaceid], 'scheduled_start DESC', 'id,title,teacherid,scheduled_start,status', 0, 80)) : [];
$subrequests = pqh_table_exists_safe('local_prequran_sub_request') ? array_values($DB->get_records('local_prequran_sub_request', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 50)) : [];
$payouts = pqh_table_exists_safe('local_prequran_market_payout') ? array_values($DB->get_records('local_prequran_market_payout', ['workspaceid' => $workspaceid], 'readyat DESC, id DESC', '*', 0, 80)) : [];

echo $OUTPUT->header();
echo '<style>.pqops{max-width:1180px;margin:0 auto}.pqops-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqops-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqops-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqops-field{margin-bottom:10px}.pqops-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqops-input,.pqops-select,.pqops-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqops-textarea{min-height:70px}.pqops-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqops-btn--light{background:#f7fbf8;color:#173044}.pqops-table{width:100%;border-collapse:collapse}.pqops-table th,.pqops-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqops-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqops-muted{color:#617064;font-size:12px}.pqops-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqops-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqops-grid,.pqops-top{display:block}}</style>';
echo '<div class="pqops"><div class="pqops-top"><div><h2>Teacher Administration</h2><div class="pqops-muted">' . s($workspace->name) . ' availability, load, contracts, assignments, substitutes, and marketplace payout readiness.</div></div><a class="pqops-btn pqops-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqops-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqops-error">' . s($error) . '</div>'; }
if (!pqops_ready()) { echo '<div class="pqops-error">Operations schema is not ready. Run Moodle upgrade.</div>'; }
echo '<div class="pqops-grid"><section class="pqops-panel"><h3>Contract / Rates</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_contract"><div class="pqops-field"><label>Teacher</label><select class="pqops-select" name="teacherid">';
foreach ($teachers as $teacher) { echo '<option value="' . (int)$teacher->id . '">' . s(fullname($teacher) . ' / ' . $teacher->email) . '</option>'; }
echo '</select></div>';
foreach ([['contract_type','Contract type'],['currency','Currency'],['hourly_rate','Hourly rate'],['session_rate','Session rate'],['marketplace_rate','Marketplace rate'],['effective_start','Effective start'],['effective_end','Effective end'],['status','Status']] as $field) { echo '<div class="pqops-field"><label>' . s($field[1]) . '</label><input class="pqops-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqops-field"><label>Terms</label><textarea class="pqops-textarea" name="terms"></textarea></div><button class="pqops-btn" type="submit">Save Contract</button></form><hr><h3>Assign Student</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="assign_student"><div class="pqops-field"><label>Teacher</label><select class="pqops-select" name="teacherid">';
foreach ($teachers as $teacher) { echo '<option value="' . (int)$teacher->id . '">' . s(fullname($teacher)) . '</option>'; }
echo '</select></div><div class="pqops-field"><label>Student</label><select class="pqops-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqops-field"><label>Status</label><input class="pqops-input" name="status" value="active"></div><div class="pqops-field"><label>Notes</label><textarea class="pqops-textarea" name="notes"></textarea></div><button class="pqops-btn" type="submit">Save Assignment</button></form><hr><h3>Substitute</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="substitute"><div class="pqops-field"><label>Session</label><select class="pqops-select" name="sessionid">';
foreach ($sessions as $session) { echo '<option value="' . (int)$session->id . '">' . s($session->title . ' / ' . userdate((int)$session->scheduled_start)) . '</option>'; }
echo '</select></div><div class="pqops-field"><label>Substitute teacher</label><select class="pqops-select" name="substitute_teacherid">';
foreach ($teachers as $teacher) { echo '<option value="' . (int)$teacher->id . '">' . s(fullname($teacher)) . '</option>'; }
echo '</select></div><div class="pqops-field"><label>Status</label><input class="pqops-input" name="status" value="approved"></div><div class="pqops-field"><label>Reason</label><textarea class="pqops-textarea" name="reason"></textarea></div><div class="pqops-field"><label>Handoff notes</label><textarea class="pqops-textarea" name="handoff_notes"></textarea></div><button class="pqops-btn" type="submit">Save Substitute</button></form></section><section class="pqops-panel"><h3>Teacher Load</h3><table class="pqops-table"><thead><tr><th>Teacher</th><th>Load</th><th>Refresh</th></tr></thead><tbody>';
foreach ($loads as $load) { echo '<tr><td><strong>' . s(fullname($load)) . '</strong><div class="pqops-muted">' . s($load->email) . '</div></td><td><span class="pqops-pill">' . s($load->load_status) . '</span><br>' . (int)$load->active_students . ' students / ' . (int)$load->weekly_sessions . ' sessions / ' . (int)$load->weekly_minutes . ' min</td><td><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="refresh_load"><input type="hidden" name="teacherid" value="' . (int)$load->teacherid . '"><button class="pqops-btn pqops-btn--light">Refresh</button></form></td></tr>'; }
if (!$loads) { echo '<tr><td colspan="3" class="pqops-muted">No load snapshots yet. Save a contract or assignment to create one.</td></tr>'; }
echo '</tbody></table><h3>Assignments</h3><table class="pqops-table"><thead><tr><th>Teacher</th><th>Student</th><th>Status</th></tr></thead><tbody>';
foreach ($assignments as $row) { echo '<tr><td>' . s(trim($row->tfirst . ' ' . $row->tlast)) . '</td><td>' . s(trim($row->sfirst . ' ' . $row->slast)) . '</td><td><span class="pqops-pill">' . s($row->status) . '</span></td></tr>'; }
if (!$assignments) { echo '<tr><td colspan="3" class="pqops-muted">No assignments yet.</td></tr>'; }
echo '</tbody></table><h3>Marketplace Payout Readiness</h3><table class="pqops-table"><thead><tr><th>Payout</th><th>Status</th><th>Approve</th></tr></thead><tbody>';
foreach ($payouts as $payout) { echo '<tr><td>' . s($payout->payoutnumber ?: ('Payout #' . (int)$payout->id)) . '<div class="pqops-muted">Teacher #' . (int)$payout->teacherid . ' / ' . s($payout->payoutamount . ' ' . $payout->currency) . '</div></td><td><span class="pqops-pill">' . s($payout->status) . '</span><div class="pqops-muted">' . s((string)($payout->readiness_status ?? '')) . '</div></td><td><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="approve_payout"><input type="hidden" name="payoutid" value="' . (int)$payout->id . '"><input type="hidden" name="status" value="approved"><input type="hidden" name="readiness_status" value="approved"><input class="pqops-input" name="review_note" placeholder="Review note"><button class="pqops-btn" type="submit">Approve</button></form></td></tr>'; }
if (!$payouts) { echo '<tr><td colspan="3" class="pqops-muted">No marketplace payouts waiting in this workspace.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
