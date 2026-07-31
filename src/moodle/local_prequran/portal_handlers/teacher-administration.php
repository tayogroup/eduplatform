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
            // Vetting gate (mirror of workspace-people assign_student): rejected always
            // blocks; unvetted blocks when teacher_require_vetting_for_assignment is on.
            $vetting = '';
            if (pqh_table_exists_safe('local_prequran_teacher_profile')) {
                $vetting = (string)$DB->get_field('local_prequran_teacher_profile', 'vetting_status', ['userid' => $teacherid], IGNORE_MISSING);
            }
            if ($vetting === 'rejected') {
                throw new invalid_parameter_exception('This teacher\'s vetting was rejected - student assignment is blocked.');
            }
            if ((int)get_config('local_prequran', 'teacher_require_vetting_for_assignment') === 1 && $vetting !== 'approved') {
                throw new invalid_parameter_exception('Teacher vetting must be approved before student assignment (current status: ' . ($vetting !== '' ? $vetting : 'not_reviewed') . ').');
            }
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
            // Workload signal: surface OVERLOADED as a warning (soft stop, never blocks).
            $loadrow = $DB->get_record('local_prequran_teacher_load',
                ['workspaceid' => $workspaceid, 'teacherid' => $teacherid], '*', IGNORE_MISSING);
            if ($loadrow && (string)($loadrow->load_status ?? '') === 'overloaded') {
                $notice .= ' WARNING: this teacher is now OVERLOADED.';
            }
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
        } else if ($do === 'bulk_substitute') {
            // Best-practice leave/absence cover: swap ALL of a teacher's future
            // scheduled sessions (optionally date-bounded) to a substitute in one
            // action, writing the same audited sub_request rows the single-session
            // substitute produces. Assignments/groups are untouched (temporary cover);
            // use offboard_teacher on workspace-people for permanent departures.
            $origid = (int)($body['original_teacherid'] ?? 0);
            $subid = (int)($body['substitute_teacherid'] ?? 0);
            $reason = clean_param((string)($body['reason'] ?? ''), PARAM_TEXT);
            $handoff = clean_param((string)($body['handoff_notes'] ?? ''), PARAM_TEXT);
            $fromts = pqops_time_from_date(clean_param((string)($body['from_date'] ?? ''), PARAM_TEXT));
            $tots = pqops_time_from_date(clean_param((string)($body['to_date'] ?? ''), PARAM_TEXT));
            if ($origid <= 0 || $subid <= 0) {
                throw new invalid_parameter_exception('Choose the covered teacher and the substitute.');
            }
            if ($origid === $subid) {
                throw new invalid_parameter_exception('Substitute must be a different teacher.');
            }
            $select = "workspaceid = :ws AND teacherid = :tid AND status = 'scheduled' AND scheduled_start >= :fromts";
            $params = ['ws' => $workspaceid, 'tid' => $origid, 'fromts' => max($fromts, $now)];
            if ($tots > 0) {
                $select .= ' AND scheduled_start < :tots';
                $params['tots'] = $tots + DAYSECS; // Inclusive of the whole to-date day.
            }
            $sessions = $DB->get_records_select('local_prequran_live_session', $select, $params, 'scheduled_start ASC');
            foreach ($sessions as $session) {
                $DB->insert_record('local_prequran_sub_request', (object)[
                    'workspaceid' => $workspaceid,
                    'sessionid' => (int)$session->id,
                    'original_teacherid' => $origid,
                    'substitute_teacherid' => $subid,
                    'status' => 'approved',
                    'reason' => $reason !== '' ? $reason : 'Bulk substitute cover.',
                    'handoff_notes' => $handoff,
                    'requestedby' => (int)$USER->id,
                    'approvedby' => (int)$USER->id,
                    'approvedat' => $now,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
                $session->substitute_teacherid = $subid;
                $session->teacherid = $subid;
                $session->timemodified = $now;
                $DB->update_record('local_prequran_live_session', $session);
            }
            pqops_recalculate_teacher_load($workspaceid, $origid);
            pqops_recalculate_teacher_load($workspaceid, $subid);
            $notice = 'Bulk substitute: ' . count($sessions) . ' future session(s) reassigned to the substitute.';
        } else if ($do === 'save_certificate') {
            // Record a teacher certificate/credential with real dates (best
            // practice: compliance carries an expiry, not just a status string).
            if (!pqh_table_exists_safe('local_prequran_teacher_cert')) {
                throw new invalid_parameter_exception('Certificate table is not ready. Run the Moodle plugin upgrade for local_prequran first.');
            }
            $teacherid = (int)($body['teacherid'] ?? 0);
            if ($teacherid <= 0) {
                throw new invalid_parameter_exception('Choose a teacher for the certificate.');
            }
            $certstatus = clean_param((string)($body['status'] ?? 'pending_review'), PARAM_ALPHANUMEXT);
            if (!in_array($certstatus, ['pending_review', 'verified'], true)) {
                $certstatus = 'pending_review';
            }
            $record = (object)[
                'consumerid' => 0,
                'workspaceid' => $workspaceid,
                'teacherid' => $teacherid,
                'cert_type' => clean_param((string)($body['cert_type'] ?? 'other'), PARAM_ALPHANUMEXT),
                'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
                'reference' => clean_param((string)($body['reference'] ?? ''), PARAM_TEXT),
                'issuer' => clean_param((string)($body['issuer'] ?? ''), PARAM_TEXT),
                'status' => $certstatus,
                'issuedat' => pqops_time_from_date(clean_param((string)($body['issued_date'] ?? ''), PARAM_TEXT)),
                'expiresat' => pqops_time_from_date(clean_param((string)($body['expiry_date'] ?? ''), PARAM_TEXT)),
                'evidence_url' => clean_param((string)($body['evidence_url'] ?? ''), PARAM_URL),
                'notes' => clean_param((string)($body['notes'] ?? ''), PARAM_TEXT),
                'verifiedby' => $certstatus === 'verified' ? (int)$USER->id : 0,
                'verifiedat' => $certstatus === 'verified' ? $now : 0,
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            if ((string)$record->title === '') {
                throw new invalid_parameter_exception('Give the certificate a title.');
            }
            if ((int)$record->expiresat > 0 && (int)$record->issuedat > 0 && (int)$record->expiresat <= (int)$record->issuedat) {
                throw new invalid_parameter_exception('Expiry date must be after the issue date.');
            }
            $DB->insert_record('local_prequran_teacher_cert', $record);
            $notice = 'Certificate recorded (' . $record->status . ').'
                . ((int)$record->expiresat > 0 ? '' : ' NOTE: no expiry date set - the expiry sweep will never flag it.');
        } else if ($do === 'verify_certificate') {
            // Verification decision on a recorded certificate.
            if (!pqh_table_exists_safe('local_prequran_teacher_cert')) {
                throw new invalid_parameter_exception('Certificate table is not ready.');
            }
            $cert = $DB->get_record('local_prequran_teacher_cert',
                ['id' => (int)($body['certid'] ?? 0), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $decision = clean_param((string)($body['decision'] ?? ''), PARAM_ALPHANUMEXT);
            if (!in_array($decision, ['verified', 'rejected'], true)) {
                throw new invalid_parameter_exception('Choose verify or reject.');
            }
            $cert->status = $decision;
            $cert->verifiedby = (int)$USER->id;
            $cert->verifiedat = $now;
            $cert->timemodified = $now;
            $DB->update_record('local_prequran_teacher_cert', $cert);
            $notice = 'Certificate ' . $decision . '.';
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

// Teacher certificates (expiry-dated compliance register), soonest expiry first.
$certificates = [];
if (pqh_table_exists_safe('local_prequran_teacher_cert')) {
    $certificates = array_values($DB->get_records('local_prequran_teacher_cert',
        ['workspaceid' => $workspaceid], 'expiresat ASC, timemodified DESC'));
    foreach ($certificates as $row) {
        $nameids[] = (int)$row->teacherid;
    }
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
    'certificates' => $certificates,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
