<?php
// ---- report: compliance-governance (compliance/audit/data-governance; read+write) --
// Ported from local_hubredirect/compliance_governance.php via
// compliance_governance_portallib (guard-only — the legacy page defines no
// functions; every helper is already shared in accesslib.php (pqh_*) and
// governance_analyticslib.php (pqgov_*)). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
// GET  = the governance console state the legacy page renders: the audit-period
//        summary metrics, retention rules, privacy requests, queued privacy
//        actions, consent history, generated audit reports, plus the staff /
//        workspace-user pickers and resolved names.
// POST = do=save_rule | privacy_request | complete_privacy | capture_consent |
//        generate_report — the page's five action=... writes verbatim. Legacy
//        require_sesskey() dropped (token auth replaces the session key); the
//        redirect/notice path replaced by ok JSON. Writes require the same
//        manage capability and governance-ready schema as the page.
// (compliance_governance.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/governance_analyticslib.php');
require_once($CFG->dirroot . '/local/hubredirect/compliance_governance_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- Access + workspace resolution: same order and outcomes as the legacy
// page (compliance_governance.php lines 9-14). Legacy redirecting
// pqh_access_denied() calls become 403 JSON failures with the verbatim message
// (the portal page cannot silently hop origins).
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability($userid, $workspaceid, 'tenant.audit.view')) {
    pqpd_fail(403, 'Compliance and data governance require audit or administrator access.');
}
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid)
    || pqh_user_has_workspace_capability($userid, $workspaceid, 'support.manage');
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening compliance and data governance.');
}

// ---- Audit period (same defaults + clamping as the page, lines 19-22). On POST
// the period arrives in the JSON body; on GET it arrives as query params.
$request = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
    ? (json_decode((string)file_get_contents('php://input'), true) ?: [])
    : [];
$startraw = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
    ? clean_param((string)($request['start'] ?? date('Y-m-01')), PARAM_TEXT)
    : optional_param('start', date('Y-m-01'), PARAM_TEXT);
$endraw = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
    ? clean_param((string)($request['end'] ?? date('Y-m-d')), PARAM_TEXT)
    : optional_param('end', date('Y-m-d'), PARAM_TEXT);
$start = pqgov_date_to_time($startraw);
$end = pqgov_date_to_time($endraw, true);
if ($start <= 0) { $start = strtotime('first day of this month 00:00:00') ?: (time() - (30 * DAYSECS)); }
if ($end <= 0) { $end = time(); }

// ---- POST: the five governance writes, verbatim from the page (lines 41-171).
// The page's export=csv download is a read-only path; the portal serves the same
// summary metrics in the GET payload and the client builds the CSV.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $do = is_array($request) ? (string)($request['do'] ?? '') : '';
    // require_sesskey() dropped: token auth replaces the session key.
    if (!$canmanage) {
        pqpd_fail(403, 'Only administrators can change governance workflows.');
    }
    if (!pqgov_ready()) {
        pqpd_fail(403, 'Governance tables are not ready. Run Moodle upgrade.');
    }
    $now = time();

    if ($do === 'save_rule') {
        $ruleid = (int)($request['ruleid'] ?? 0);
        $existing = $ruleid > 0 ? $DB->get_record('local_prequran_retention_rule', ['id' => $ruleid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
        $record = (object)[
            'workspaceid' => $workspaceid,
            'data_domain' => clean_param((string)($request['data_domain'] ?? 'student_records'), PARAM_ALPHANUMEXT),
            'record_type' => clean_param((string)($request['record_type'] ?? 'general'), PARAM_TEXT),
            'retention_days' => (int)clean_param((string)($request['retention_days'] ?? 2555), PARAM_INT),
            'disposition' => clean_param((string)($request['disposition'] ?? 'review'), PARAM_ALPHANUMEXT),
            'legal_hold' => (int)clean_param((string)($request['legal_hold'] ?? 0), PARAM_INT) ? 1 : 0,
            'status' => clean_param((string)($request['status'] ?? 'active'), PARAM_ALPHANUMEXT),
            'policyjson' => pqgov_json(['basis' => clean_param((string)($request['basis'] ?? ''), PARAM_TEXT), 'owner' => clean_param((string)($request['owner'] ?? ''), PARAM_TEXT)]),
            'createdby' => (int)($existing->createdby ?? $USER->id),
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_retention_rule', $record);
            $message = 'Retention rule updated.';
        } else {
            $record->id = (int)$DB->insert_record('local_prequran_retention_rule', $record);
            $message = 'Retention rule created.';
        }
        echo json_encode(['ok' => true, 'message' => $message, 'ruleid' => (int)$record->id], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'privacy_request') {
        $subjectuserid = (int)($request['subjectuserid'] ?? 0);
        $requesttype = clean_param((string)($request['request_type'] ?? 'export'), PARAM_ALPHANUMEXT);
        $requestid = (int)$DB->insert_record('local_prequran_privacy_req', (object)[
            'workspaceid' => $workspaceid,
            'subjectuserid' => $subjectuserid,
            'requesterid' => (int)($request['requesterid'] ?? $USER->id),
            'request_type' => $requesttype,
            'status' => clean_param((string)($request['status'] ?? 'submitted'), PARAM_ALPHANUMEXT),
            'legal_basis' => clean_param((string)($request['legal_basis'] ?? 'legitimate_interest'), PARAM_TEXT),
            'scopejson' => pqgov_json(['domains' => clean_param((string)($request['scope'] ?? 'student,finance,grades,transcripts'), PARAM_TEXT)]),
            'request_notes' => clean_param((string)($request['request_notes'] ?? ''), PARAM_TEXT),
            'responsejson' => '{}',
            'assignedto' => (int)($request['assignedto'] ?? 0),
            'duedate' => pqgov_date_to_time(clean_param((string)($request['duedate'] ?? ''), PARAM_TEXT), true),
            'completedby' => 0,
            'completedat' => 0,
            'createdby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        foreach (['student_profile', 'finance', 'grades', 'transcripts', 'documents', 'communications'] as $target) {
            $DB->insert_record('local_prequran_privacy_action', (object)[
                'workspaceid' => $workspaceid,
                'requestid' => $requestid,
                'subjectuserid' => $subjectuserid,
                'action_type' => $requesttype,
                'target_table' => $target,
                'targetid' => 0,
                'status' => 'queued',
                'resultjson' => '{}',
                'performedby' => 0,
                'performedat' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        echo json_encode(['ok' => true, 'message' => 'Privacy workflow queued with review actions.', 'requestid' => $requestid], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'complete_privacy') {
        $privreq = $DB->get_record('local_prequran_privacy_req', ['id' => (int)($request['requestid'] ?? 0), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
        $privreq->status = clean_param((string)($request['status'] ?? 'completed'), PARAM_ALPHANUMEXT);
        $privreq->responsejson = pqgov_json(['resolution' => clean_param((string)($request['resolution'] ?? ''), PARAM_TEXT)]);
        $privreq->completedby = (int)$USER->id;
        $privreq->completedat = $now;
        $privreq->timemodified = $now;
        $DB->update_record('local_prequran_privacy_req', $privreq);
        $DB->set_field('local_prequran_privacy_action', 'status', 'reviewed', ['requestid' => (int)$privreq->id, 'status' => 'queued']);
        echo json_encode(['ok' => true, 'message' => 'Privacy workflow updated.', 'requestid' => (int)$privreq->id], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'capture_consent') {
        $created = 0;
        foreach (['local_prequran_comm_consent' => 'communication', 'local_prequran_live_consent' => 'live_class'] as $table => $type) {
            if (!pqh_table_exists_safe($table)) {
                continue;
            }
            $rows = pqh_table_has_field_safe($table, 'workspaceid')
                ? $DB->get_records($table, ['workspaceid' => $workspaceid], 'id DESC', '*', 0, 200)
                : $DB->get_records($table, null, 'id DESC', '*', 0, 200);
            foreach ($rows as $row) {
                $sourceid = (int)$row->id;
                if ($DB->record_exists('local_prequran_consent_hist', ['source_table' => $table, 'source_id' => $sourceid])) {
                    continue;
                }
                $DB->insert_record('local_prequran_consent_hist', (object)[
                    'workspaceid' => $workspaceid,
                    'studentid' => (int)($row->studentid ?? 0),
                    'guardianid' => (int)($row->guardianid ?? 0),
                    'consent_type' => $type,
                    'channel' => (string)($row->channel ?? ($row->consent_type ?? '')),
                    'consented' => (int)($row->consented ?? 1),
                    'source_table' => $table,
                    'source_id' => $sourceid,
                    'evidencejson' => pqgov_json(['status' => (string)($row->status ?? ''), 'notes' => (string)($row->notes ?? '')]),
                    'capturedby' => (int)$USER->id,
                    'timecreated' => $now,
                ]);
                $created++;
            }
        }
        echo json_encode(['ok' => true, 'message' => 'Captured ' . $created . ' consent history row(s).', 'created' => $created], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($do === 'generate_report') {
        $summary = pqgov_audit_summary($workspaceid, $start, $end);
        $reportid = (int)$DB->insert_record('local_prequran_audit_report', (object)[
            'workspaceid' => $workspaceid,
            'report_type' => clean_param((string)($request['report_type'] ?? 'full'), PARAM_ALPHANUMEXT),
            'period_start' => $start,
            'period_end' => $end,
            'status' => 'generated',
            'summaryjson' => pqgov_json($summary),
            'filtersjson' => pqgov_json(['workspaceid' => $workspaceid]),
            'generatedby' => (int)$USER->id,
            'timecreated' => $now,
        ]);
        echo json_encode(['ok' => true, 'message' => 'Audit report generated.', 'reportid' => $reportid], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown compliance-governance action.');
}

// ---- GET: the governance console state (same loads as the page, lines 179-186).
$staffrows = pqgov_staff($workspaceid);
$userrows = pqgov_workspace_users($workspaceid);
$rules = pqh_table_exists_safe('local_prequran_retention_rule') ? array_values($DB->get_records('local_prequran_retention_rule', ['workspaceid' => $workspaceid], 'data_domain ASC, record_type ASC', '*', 0, 100)) : [];
$requests = pqh_table_exists_safe('local_prequran_privacy_req') ? array_values($DB->get_records('local_prequran_privacy_req', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$actions = pqh_table_exists_safe('local_prequran_privacy_action') ? array_values($DB->get_records('local_prequran_privacy_action', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$consents = pqh_table_exists_safe('local_prequran_consent_hist') ? array_values($DB->get_records('local_prequran_consent_hist', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$reports = pqh_table_exists_safe('local_prequran_audit_report') ? array_values($DB->get_records('local_prequran_audit_report', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 50)) : [];
$summary = pqgov_audit_summary($workspaceid, $start, $end);

// Picker rows carry a resolved display name (+ workspace role), as the page's
// <option> labels do (fullname($user) . ' / ' . $user->workspace_role).
$staff = [];
foreach ($staffrows as $u) {
    $staff[] = ['id' => (int)$u->id, 'name' => fullname($u), 'workspace_role' => (string)$u->workspace_role];
}
$users = [];
foreach ($userrows as $u) {
    $users[] = ['id' => (int)$u->id, 'name' => fullname($u), 'workspace_role' => (string)$u->workspace_role];
}

// Names for the numeric id references rendered in the tables.
$nameids = [];
foreach ($requests as $req) {
    $nameids[] = (int)$req->subjectuserid;
    $nameids[] = (int)$req->assignedto;
    $nameids[] = (int)($req->requesterid ?? 0);
    $nameids[] = (int)($req->completedby ?? 0);
}
foreach ($consents as $c) {
    $nameids[] = (int)$c->studentid;
    $nameids[] = (int)$c->guardianid;
}
foreach ($reports as $r) {
    $nameids[] = (int)($r->generatedby ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => pqgov_ready(),
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'canmanage' => (bool)$canmanage,
    'period' => [
        'start' => (int)$start,
        'end' => (int)$end,
        'start_label' => date('Y-m-d', $start),
        'end_label' => date('Y-m-d', $end),
    ],
    'summary' => $summary,
    'staff' => $staff,
    'users' => $users,
    'rules' => $rules,
    'requests' => $requests,
    'actions' => $actions,
    'consents' => $consents,
    'reports' => $reports,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
