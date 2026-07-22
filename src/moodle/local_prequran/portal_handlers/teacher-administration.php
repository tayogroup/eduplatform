<?php
// ---- report: teacher-administration (workspace teacher operations) -----------
// Ported from local_hubredirect/teacher_administration.php via
// teacher_administration_portallib (pqtadml_ reserved; the page defines no
// inline functions — all helpers are the shared accesslib / operations_layerlib
// / finance_lib called at runtime). Included from portal_data.php AFTER token
// auth: $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent.
// GET  = the full teacher-administration state (teachers, students, contracts,
//        load snapshots, assignments, sessions, sub requests, payouts).
// POST = do=save_contract | assign_student | substitute | approve_payout |
//        refresh_load — each the legacy action=... write VERBATIM (same guards
//        and messages). confirm_sesskey()/require_sesskey() dropped: token auth
//        replaces the session key.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/operations_layerlib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_administration_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- workspace resolution + ENTRY access check (same order and message as the
// -- legacy page: pqh_current_workspace_id fallback then manage-workspace gate).
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Teacher administration requires workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if ($ispost) {
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $notice = '';
    // The legacy page wraps every POST in try/catch and shows the message
    // inline — the API surfaces the same message as a 400 instead.
    try {
        if (!pqops_ready()) {
            throw new invalid_parameter_exception('Operations tables are not ready. Run Moodle upgrade.');
        }
        $now = time();
        if ($do === 'save_contract') {
            // -- write: save_contract (legacy action=save_contract, verbatim) --
            $teacherid = (int)($body['teacherid'] ?? 0);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'teacherid' => $teacherid,
                'contract_type' => clean_param((string)($body['contract_type'] ?? 'hourly'), PARAM_ALPHANUMEXT),
                'currency' => strtoupper(clean_param((string)($body['currency'] ?? 'USD'), PARAM_ALPHANUMEXT)),
                'hourly_rate' => clean_param((string)($body['hourly_rate'] ?? '0.00'), PARAM_TEXT),
                'session_rate' => clean_param((string)($body['session_rate'] ?? '0.00'), PARAM_TEXT),
                'marketplace_rate' => clean_param((string)($body['marketplace_rate'] ?? '0.00'), PARAM_TEXT),
                'effective_start' => pqops_time_from_date(clean_param((string)($body['effective_start'] ?? ''), PARAM_TEXT)),
                'effective_end' => pqops_time_from_date(clean_param((string)($body['effective_end'] ?? ''), PARAM_TEXT)),
                'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
                'terms_json' => pqops_json(['terms' => clean_param((string)($body['terms'] ?? ''), PARAM_TEXT)]),
                'approvedby' => (int)$USER->id,
                'approvedat' => $now,
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $DB->insert_record('local_prequran_teacher_contract', $record);
            pqops_recalculate_teacher_load($workspaceid, $teacherid);
            $notice = 'Teacher contract/rates saved.';
        } else if ($do === 'assign_student') {
            // -- write: assign_student (legacy action=assign_student, verbatim) --
            if (!pqh_table_exists_safe('local_prequran_teacher_student')) {
                throw new invalid_parameter_exception('Teacher-student assignment table is not ready.');
            }
            $teacherid = (int)($body['teacherid'] ?? 0);
            $studentid = (int)($body['studentid'] ?? 0);
            $existing = $DB->get_record('local_prequran_teacher_student', ['workspaceid' => $workspaceid, 'teacherid' => $teacherid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'cohortid' => 0,
                'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
                'notes' => clean_param((string)($body['notes'] ?? ''), PARAM_TEXT),
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
        } else if ($do === 'substitute') {
            // -- write: substitute (legacy action=substitute, verbatim) --
            $sessionid = (int)($body['sessionid'] ?? 0);
            $subid = (int)($body['substitute_teacherid'] ?? 0);
            $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $request = (object)[
                'workspaceid' => $workspaceid,
                'sessionid' => $sessionid,
                'original_teacherid' => (int)$session->teacherid,
                'substitute_teacherid' => $subid,
                'status' => clean_param((string)($body['status'] ?? 'approved'), PARAM_ALPHANUMEXT),
                'reason' => clean_param((string)($body['reason'] ?? ''), PARAM_TEXT),
                'handoff_notes' => clean_param((string)($body['handoff_notes'] ?? ''), PARAM_TEXT),
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
        } else if ($do === 'approve_payout') {
            // -- write: approve_payout (legacy action=approve_payout, verbatim) --
            $payout = $DB->get_record('local_prequran_market_payout', ['id' => (int)($body['payoutid'] ?? 0), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $payout->status = clean_param((string)($body['status'] ?? 'approved'), PARAM_ALPHANUMEXT);
            $payout->readiness_status = clean_param((string)($body['readiness_status'] ?? 'approved'), PARAM_ALPHANUMEXT);
            $payout->readiness_json = pqops_json(['review_note' => clean_param((string)($body['review_note'] ?? ''), PARAM_TEXT)]);
            $payout->approvedby = (int)$USER->id;
            $payout->approvedat = $now;
            $payout->modifiedby = (int)$USER->id;
            $payout->timemodified = $now;
            $DB->update_record('local_prequran_market_payout', $payout);
            if (function_exists('pqfin_audit')) {
                pqfin_audit('marketplace_payout_approved', $workspaceid, (int)$payout->studentid, (int)$payout->id, ['teacherid' => (int)$payout->teacherid, 'status' => (string)$payout->status]);
            }
            $notice = 'Marketplace payout readiness updated.';
        } else if ($do === 'refresh_load') {
            // -- write: refresh_load (legacy action=refresh_load, verbatim) --
            pqops_recalculate_teacher_load($workspaceid, (int)($body['teacherid'] ?? 0));
            $notice = 'Teacher load refreshed.';
        } else {
            pqpd_fail(400, 'Unknown teacher-administration action.');
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $notice,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: everything the page renders (same queries, same guards, same limits) --
$teachers = pqops_workspace_users($workspaceid, 'teacher');
$students = pqops_workspace_users($workspaceid, 'student');
$contracts = pqh_table_exists_safe('local_prequran_teacher_contract') ? array_values($DB->get_records_sql("SELECT c.*, u.firstname, u.lastname, u.email FROM {local_prequran_teacher_contract} c LEFT JOIN {user} u ON u.id = c.teacherid WHERE c.workspaceid = :workspaceid ORDER BY c.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$loads = pqh_table_exists_safe('local_prequran_teacher_load') ? array_values($DB->get_records_sql("SELECT l.*, u.firstname, u.lastname, u.email FROM {local_prequran_teacher_load} l LEFT JOIN {user} u ON u.id = l.teacherid WHERE l.workspaceid = :workspaceid ORDER BY l.calculatedat DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$assignments = pqh_table_exists_safe('local_prequran_teacher_student') ? array_values($DB->get_records_sql("SELECT ts.*, tu.firstname AS tfirst, tu.lastname AS tlast, su.firstname AS sfirst, su.lastname AS slast FROM {local_prequran_teacher_student} ts LEFT JOIN {user} tu ON tu.id = ts.teacherid LEFT JOIN {user} su ON su.id = ts.studentid WHERE ts.workspaceid = :workspaceid ORDER BY ts.timemodified DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records('local_prequran_live_session', ['workspaceid' => $workspaceid], 'scheduled_start DESC', 'id,title,teacherid,scheduled_start,status', 0, 80)) : [];
$subrequests = pqh_table_exists_safe('local_prequran_sub_request') ? array_values($DB->get_records('local_prequran_sub_request', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 50)) : [];
$payouts = pqh_table_exists_safe('local_prequran_market_payout') ? array_values($DB->get_records('local_prequran_market_payout', ['workspaceid' => $workspaceid], 'readyat DESC, id DESC', '*', 0, 80)) : [];

$nameids = [];
foreach ($teachers as $row) {
    $nameids[] = (int)$row->id;
}
foreach ($students as $row) {
    $nameids[] = (int)$row->id;
}
foreach ($sessions as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($subrequests as $row) {
    $nameids[] = (int)($row->original_teacherid ?? 0);
    $nameids[] = (int)($row->substitute_teacherid ?? 0);
}
foreach ($payouts as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($loads as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($contracts as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => pqops_ready(),
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'teachers' => $teachers,
    'students' => $students,
    'contracts' => $contracts,
    'loads' => $loads,
    'assignments' => $assignments,
    'sessions' => $sessions,
    'subrequests' => $subrequests,
    'payouts' => $payouts,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
