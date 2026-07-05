<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/governance_analyticslib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'tenant.audit.view')) {
    pqh_access_denied('Compliance and data governance require audit or administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Compliance access denied');
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) || pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'support.manage');
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

$start = pqgov_date_to_time(optional_param('start', date('Y-m-01'), PARAM_TEXT));
$end = pqgov_date_to_time(optional_param('end', date('Y-m-d'), PARAM_TEXT), true);
if ($start <= 0) { $start = strtotime('first day of this month 00:00:00') ?: (time() - (30 * DAYSECS)); }
if ($end <= 0) { $end = time(); }

if (optional_param('export', '', PARAM_ALPHA) === 'csv') {
    require_sesskey();
    if (!$canmanage) {
        pqh_access_denied('Only workspace administrators can export governance audit reports.', new moodle_url('/local/hubredirect/compliance_governance.php', $urlparams), 'Governance export denied');
    }
    $summary = pqgov_audit_summary($workspaceid, $start, $end);
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . clean_filename('governance-audit-' . $workspaceid . '-' . date('Ymd-His') . '.csv') . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['metric', 'value']);
    foreach ($summary as $key => $value) {
        fputcsv($out, [$key, $value]);
    }
    fclose($out);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!$canmanage) {
            throw new invalid_parameter_exception('Only administrators can change governance workflows.');
        }
        if (!pqgov_ready()) {
            throw new invalid_parameter_exception('Governance tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_rule') {
            $ruleid = optional_param('ruleid', 0, PARAM_INT);
            $existing = $ruleid > 0 ? $DB->get_record('local_prequran_retention_rule', ['id' => $ruleid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'data_domain' => optional_param('data_domain', 'student_records', PARAM_ALPHANUMEXT),
                'record_type' => optional_param('record_type', 'general', PARAM_TEXT),
                'retention_days' => optional_param('retention_days', 2555, PARAM_INT),
                'disposition' => optional_param('disposition', 'review', PARAM_ALPHANUMEXT),
                'legal_hold' => optional_param('legal_hold', 0, PARAM_INT) ? 1 : 0,
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'policyjson' => pqgov_json(['basis' => optional_param('basis', '', PARAM_TEXT), 'owner' => optional_param('owner', '', PARAM_TEXT)]),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_retention_rule', $record);
                $notice = 'Retention rule updated.';
            } else {
                $DB->insert_record('local_prequran_retention_rule', $record);
                $notice = 'Retention rule created.';
            }
        } else if ($action === 'privacy_request') {
            $requestid = (int)$DB->insert_record('local_prequran_privacy_req', (object)[
                'workspaceid' => $workspaceid,
                'subjectuserid' => optional_param('subjectuserid', 0, PARAM_INT),
                'requesterid' => optional_param('requesterid', (int)$USER->id, PARAM_INT),
                'request_type' => optional_param('request_type', 'export', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'submitted', PARAM_ALPHANUMEXT),
                'legal_basis' => optional_param('legal_basis', 'legitimate_interest', PARAM_TEXT),
                'scopejson' => pqgov_json(['domains' => optional_param('scope', 'student,finance,grades,transcripts', PARAM_TEXT)]),
                'request_notes' => optional_param('request_notes', '', PARAM_TEXT),
                'responsejson' => '{}',
                'assignedto' => optional_param('assignedto', 0, PARAM_INT),
                'duedate' => pqgov_date_to_time(optional_param('duedate', '', PARAM_TEXT), true),
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
                    'subjectuserid' => optional_param('subjectuserid', 0, PARAM_INT),
                    'action_type' => optional_param('request_type', 'export', PARAM_ALPHANUMEXT),
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
            $notice = 'Privacy workflow queued with review actions.';
        } else if ($action === 'complete_privacy') {
            $request = $DB->get_record('local_prequran_privacy_req', ['id' => optional_param('requestid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $request->status = optional_param('status', 'completed', PARAM_ALPHANUMEXT);
            $request->responsejson = pqgov_json(['resolution' => optional_param('resolution', '', PARAM_TEXT)]);
            $request->completedby = (int)$USER->id;
            $request->completedat = $now;
            $request->timemodified = $now;
            $DB->update_record('local_prequran_privacy_req', $request);
            $DB->set_field('local_prequran_privacy_action', 'status', 'reviewed', ['requestid' => (int)$request->id, 'status' => 'queued']);
            $notice = 'Privacy workflow updated.';
        } else if ($action === 'capture_consent') {
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
            $notice = 'Captured ' . $created . ' consent history row(s).';
        } else if ($action === 'generate_report') {
            $summary = pqgov_audit_summary($workspaceid, $start, $end);
            $DB->insert_record('local_prequran_audit_report', (object)[
                'workspaceid' => $workspaceid,
                'report_type' => optional_param('report_type', 'full', PARAM_ALPHANUMEXT),
                'period_start' => $start,
                'period_end' => $end,
                'status' => 'generated',
                'summaryjson' => pqgov_json($summary),
                'filtersjson' => pqgov_json(['workspaceid' => $workspaceid]),
                'generatedby' => (int)$USER->id,
                'timecreated' => $now,
            ]);
            $notice = 'Audit report generated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/compliance_governance.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Compliance, Audit, And Data Governance');
$PAGE->set_heading('Compliance, Audit, And Data Governance');

$staff = pqgov_staff($workspaceid);
$users = pqgov_workspace_users($workspaceid);
$rules = pqh_table_exists_safe('local_prequran_retention_rule') ? array_values($DB->get_records('local_prequran_retention_rule', ['workspaceid' => $workspaceid], 'data_domain ASC, record_type ASC', '*', 0, 100)) : [];
$requests = pqh_table_exists_safe('local_prequran_privacy_req') ? array_values($DB->get_records('local_prequran_privacy_req', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$actions = pqh_table_exists_safe('local_prequran_privacy_action') ? array_values($DB->get_records('local_prequran_privacy_action', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$consents = pqh_table_exists_safe('local_prequran_consent_hist') ? array_values($DB->get_records('local_prequran_consent_hist', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$reports = pqh_table_exists_safe('local_prequran_audit_report') ? array_values($DB->get_records('local_prequran_audit_report', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 50)) : [];
$summary = pqgov_audit_summary($workspaceid, $start, $end);

echo $OUTPUT->header();
echo '<style>.pqgov{max-width:1180px;margin:0 auto}.pqgov-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqgov-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqgov-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqgov-field{margin-bottom:10px}.pqgov-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqgov-input,.pqgov-select,.pqgov-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqgov-textarea{min-height:72px}.pqgov-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqgov-btn--light{background:#f7fbf8;color:#173044}.pqgov-table{width:100%;border-collapse:collapse}.pqgov-table th,.pqgov-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqgov-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqgov-muted{color:#617064;font-size:12px}.pqgov-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqgov-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}.pqgov-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:12px}.pqgov-metric{border:1px solid #dfe7df;border-radius:8px;padding:10px;background:#f9fcfa}.pqgov-metric strong{display:block;font-size:22px}@media(max-width:900px){.pqgov-grid,.pqgov-top,.pqgov-metrics{display:block}.pqgov-metric,.pqgov-panel{margin-bottom:10px}}</style>';
echo '<div class="pqgov"><div class="pqgov-top"><div><h2>Compliance, Audit, And Data Governance</h2><div class="pqgov-muted">' . s($workspace->name) . ' retention, privacy controls, consent history, export/delete/anonymize workflows, and full audit reports.</div></div><a class="pqgov-btn pqgov-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqgov-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqgov-error">' . s($error) . '</div>'; }
if (!pqgov_ready()) { echo '<div class="pqgov-error">Governance schema is not ready. Run Moodle upgrade.</div>'; }
echo '<form method="get" class="pqgov-panel"><input type="hidden" name="workspaceid" value="' . (int)$workspaceid . '"><div class="pqgov-field"><label>Start</label><input class="pqgov-input" name="start" value="' . s(date('Y-m-d', $start)) . '"></div><div class="pqgov-field"><label>End</label><input class="pqgov-input" name="end" value="' . s(date('Y-m-d', $end)) . '"></div><button class="pqgov-btn" type="submit">Apply Period</button> <a class="pqgov-btn pqgov-btn--light" href="' . (new moodle_url('/local/hubredirect/compliance_governance.php', $urlparams + ['start' => date('Y-m-d', $start), 'end' => date('Y-m-d', $end), 'export' => 'csv', 'sesskey' => sesskey()]))->out(false) . '">Export CSV</a></form>';
echo '<div class="pqgov-metrics">';
foreach ($summary as $key => $value) { echo '<div class="pqgov-metric"><strong>' . s((string)$value) . '</strong><span class="pqgov-muted">' . s(str_replace('_', ' ', $key)) . '</span></div>'; }
echo '</div><div class="pqgov-grid"><section class="pqgov-panel"><h3>Retention Rule</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_rule">';
foreach ([['ruleid','Rule ID for update'],['data_domain','Data domain'],['record_type','Record type'],['retention_days','Retention days'],['disposition','Disposition'],['status','Status'],['basis','Policy basis'],['owner','Policy owner']] as $field) { echo '<div class="pqgov-field"><label>' . s($field[1]) . '</label><input class="pqgov-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqgov-field"><label><input type="checkbox" name="legal_hold" value="1"> Legal hold</label></div><button class="pqgov-btn">Save Rule</button></form><hr><h3>Privacy Workflow</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="privacy_request"><div class="pqgov-field"><label>Subject user</label><select class="pqgov-select" name="subjectuserid">';
foreach ($users as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqgov-field"><label>Request type</label><select class="pqgov-select" name="request_type"><option value="export">Export</option><option value="delete">Delete review</option><option value="anonymize">Anonymize review</option><option value="rectify">Rectify</option></select></div><div class="pqgov-field"><label>Assigned to</label><select class="pqgov-select" name="assignedto"><option value="0">Unassigned</option>';
foreach ($staff as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqgov-field"><label>Due date</label><input class="pqgov-input" name="duedate"></div><div class="pqgov-field"><label>Scope</label><input class="pqgov-input" name="scope" value="student,finance,grades,transcripts"></div><div class="pqgov-field"><label>Notes</label><textarea class="pqgov-textarea" name="request_notes"></textarea></div><button class="pqgov-btn">Queue Workflow</button></form><hr><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="capture_consent"><button class="pqgov-btn pqgov-btn--light">Capture Consent History</button></form><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="generate_report"><input type="hidden" name="report_type" value="full"><button class="pqgov-btn pqgov-btn--light">Generate Full Audit Report</button></form></section><section class="pqgov-panel"><h3>Retention Rules</h3><table class="pqgov-table"><tbody>';
foreach ($rules as $rule) { echo '<tr><td><strong>' . s($rule->data_domain . ' / ' . $rule->record_type) . '</strong><div class="pqgov-muted">' . (int)$rule->retention_days . ' days / ' . s($rule->disposition) . '</div></td><td><span class="pqgov-pill">' . s($rule->status) . '</span>' . ((int)$rule->legal_hold ? ' <span class="pqgov-pill">legal hold</span>' : '') . '</td></tr>'; }
if (!$rules) { echo '<tr><td class="pqgov-muted">No retention rules yet.</td></tr>'; }
echo '</tbody></table><h3>Privacy Requests</h3><table class="pqgov-table"><tbody>';
foreach ($requests as $req) { echo '<tr><td><strong>#' . (int)$req->id . ' ' . s($req->request_type) . '</strong><div class="pqgov-muted">Subject #' . (int)$req->subjectuserid . ' / due ' . s((int)$req->duedate > 0 ? userdate((int)$req->duedate, '%Y-%m-%d') : 'none') . '</div></td><td><span class="pqgov-pill">' . s($req->status) . '</span><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="complete_privacy"><input type="hidden" name="requestid" value="' . (int)$req->id . '"><input class="pqgov-input" name="resolution" placeholder="Resolution"><button class="pqgov-btn pqgov-btn--light">Complete</button></form></td></tr>'; }
if (!$requests) { echo '<tr><td class="pqgov-muted">No privacy requests yet.</td></tr>'; }
echo '</tbody></table><h3>Queued Privacy Actions</h3><table class="pqgov-table"><tbody>';
foreach ($actions as $act) { echo '<tr><td>#' . (int)$act->requestid . ' / ' . s($act->target_table) . '</td><td><span class="pqgov-pill">' . s($act->action_type . ' / ' . $act->status) . '</span></td></tr>'; }
if (!$actions) { echo '<tr><td class="pqgov-muted">No privacy actions yet.</td></tr>'; }
echo '</tbody></table><h3>Consent History</h3><table class="pqgov-table"><tbody>';
foreach ($consents as $consent) { echo '<tr><td>Student #' . (int)$consent->studentid . ' / Guardian #' . (int)$consent->guardianid . '<div class="pqgov-muted">' . s($consent->source_table . ' #' . $consent->source_id) . '</div></td><td><span class="pqgov-pill">' . s($consent->consent_type . ' / ' . ((int)$consent->consented ? 'consented' : 'declined')) . '</span></td></tr>'; }
if (!$consents) { echo '<tr><td class="pqgov-muted">No captured consent history yet.</td></tr>'; }
echo '</tbody></table><h3>Generated Audit Reports</h3><table class="pqgov-table"><tbody>';
foreach ($reports as $report) { echo '<tr><td><strong>#' . (int)$report->id . ' ' . s($report->report_type) . '</strong><div class="pqgov-muted">' . s(userdate((int)$report->period_start, '%Y-%m-%d') . ' to ' . userdate((int)$report->period_end, '%Y-%m-%d')) . '</div></td><td><span class="pqgov-pill">' . s($report->status) . '</span></td></tr>'; }
if (!$reports) { echo '<tr><td class="pqgov-muted">No generated audit reports yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
