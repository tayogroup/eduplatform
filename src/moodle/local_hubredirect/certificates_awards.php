<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/certificates_placementlib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'registrar.manage')) {
    pqh_access_denied('Certificates and awards require registrar or administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Certificate access denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqcp_ready()) {
            throw new invalid_parameter_exception('Certificate tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_template') {
            $templateid = optional_param('templateid', 0, PARAM_INT);
            $existing = $templateid > 0 ? $DB->get_record('local_prequran_cert_template', ['id' => $templateid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'template_key' => optional_param('template_key', '', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'award_type' => optional_param('award_type', 'completion', PARAM_ALPHANUMEXT),
                'body_template' => optional_param('body_template', '', PARAM_TEXT),
                'designjson' => pqcp_json(['accent' => optional_param('accent', '#2f6f4e', PARAM_TEXT), 'seal' => optional_param('seal', '', PARAM_TEXT)]),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_cert_template', $record);
                $notice = 'Certificate template updated.';
            } else {
                $DB->insert_record('local_prequran_cert_template', $record);
                $notice = 'Certificate template created.';
            }
        } else if ($action === 'issue_award') {
            $awardid = optional_param('awardid', 0, PARAM_INT);
            $existing = $awardid > 0 ? $DB->get_record('local_prequran_completion_award', ['id' => $awardid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => optional_param('studentid', (int)($existing->studentid ?? 0), PARAM_INT),
                'offeringid' => optional_param('offeringid', (int)($existing->offeringid ?? 0), PARAM_INT),
                'courseid' => optional_param('courseid', (int)($existing->courseid ?? 0), PARAM_INT),
                'templateid' => optional_param('templateid', (int)($existing->templateid ?? 0), PARAM_INT),
                'awardnumber' => optional_param('awardnumber', (string)($existing->awardnumber ?? ''), PARAM_TEXT),
                'award_type' => optional_param('award_type', 'completion', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'status' => optional_param('status', 'issued', PARAM_ALPHANUMEXT),
                'completion_percent' => optional_param('completion_percent', '', PARAM_TEXT),
                'final_grade' => optional_param('final_grade', '', PARAM_TEXT),
                'evidencejson' => pqcp_json(['evidence' => optional_param('evidence', '', PARAM_TEXT)]),
                'issuedby' => (int)$USER->id,
                'issuedat' => pqcp_date_to_time(optional_param('issuedat', '', PARAM_TEXT)) ?: $now,
                'revokedby' => 0,
                'revokedat' => 0,
                'revocation_reason' => '',
                'documentid' => (int)($existing->documentid ?? 0),
                'generateddocid' => (int)($existing->generateddocid ?? 0),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($record->awardnumber === '') {
                $record->awardnumber = pqcp_award_number($workspaceid);
            }
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_completion_award', $record);
                $awardid = (int)$existing->id;
                pqcp_award_audit($workspaceid, $awardid, (int)$USER->id, 'award_updated', ['status' => $record->status]);
            } else {
                $awardid = (int)$DB->insert_record('local_prequran_completion_award', $record);
                $record->id = $awardid;
                pqcp_award_audit($workspaceid, $awardid, (int)$USER->id, 'award_issued', ['awardnumber' => $record->awardnumber]);
            }
            [$documentid, $generatedid] = pqcp_register_certificate_document($record, (int)$USER->id);
            if ($documentid > 0 || $generatedid > 0) {
                $record->id = $awardid;
                $record->documentid = $documentid;
                $record->generateddocid = $generatedid;
                $record->timemodified = time();
                $DB->update_record('local_prequran_completion_award', $record);
            }
            $notice = 'Completion award saved and certificate PDF registered.';
        } else if ($action === 'revoke_award') {
            $award = $DB->get_record('local_prequran_completion_award', ['id' => optional_param('awardid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $award->status = 'revoked';
            $award->revokedby = (int)$USER->id;
            $award->revokedat = $now;
            $award->revocation_reason = optional_param('revocation_reason', '', PARAM_TEXT);
            $award->timemodified = $now;
            $DB->update_record('local_prequran_completion_award', $award);
            pqcp_award_audit($workspaceid, (int)$award->id, (int)$USER->id, 'award_revoked', ['reason' => $award->revocation_reason]);
            $notice = 'Award revoked.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/certificates_awards.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Certificates And Completion Awards');
$PAGE->set_heading('Certificates And Completion Awards');

$students = pqcp_workspace_users($workspaceid, ['student']);
$templates = pqh_table_exists_safe('local_prequran_cert_template') ? array_values($DB->get_records('local_prequran_cert_template', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC', 'id,title,moodlecourseid,course_key,status', 0, 120)) : [];
$awards = pqh_table_exists_safe('local_prequran_completion_award') ? array_values($DB->get_records_sql("SELECT a.*, u.firstname, u.lastname FROM {local_prequran_completion_award} a LEFT JOIN {user} u ON u.id = a.studentid WHERE a.workspaceid = :workspaceid ORDER BY a.timemodified DESC", ['workspaceid' => $workspaceid], 0, 100)) : [];
$audits = pqh_table_exists_safe('local_prequran_award_audit') ? array_values($DB->get_records('local_prequran_award_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];

echo $OUTPUT->header();
echo '<style>.pqcert{max-width:1180px;margin:0 auto}.pqcert-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqcert-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqcert-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqcert-field{margin-bottom:10px}.pqcert-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqcert-input,.pqcert-select,.pqcert-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqcert-textarea{min-height:72px}.pqcert-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqcert-btn--light{background:#f7fbf8;color:#173044}.pqcert-table{width:100%;border-collapse:collapse}.pqcert-table th,.pqcert-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqcert-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqcert-muted{color:#617064;font-size:12px}.pqcert-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqcert-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqcert-grid,.pqcert-top{display:block}}</style>';
echo '<div class="pqcert"><div class="pqcert-top"><div><h2>Certificates And Completion Awards</h2><div class="pqcert-muted">' . s($workspace->name) . ' certificate templates, completion awards, generated PDFs, revocation, and audit history.</div></div><a class="pqcert-btn pqcert-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqcert-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqcert-error">' . s($error) . '</div>'; }
if (!pqcp_ready()) { echo '<div class="pqcert-error">Certificate schema is not ready. Run Moodle upgrade.</div>'; }
echo '<div class="pqcert-grid"><section class="pqcert-panel"><h3>Certificate Template</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_template">';
foreach ([['templateid','Template ID for update'],['template_key','Template key'],['title','Title'],['award_type','Award type'],['status','Status'],['accent','Accent color'],['seal','Seal text']] as $field) { echo '<div class="pqcert-field"><label>' . s($field[1]) . '</label><input class="pqcert-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqcert-field"><label>Body template</label><textarea class="pqcert-textarea" name="body_template"></textarea></div><button class="pqcert-btn">Save Template</button></form><hr><h3>Issue Award</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="issue_award"><div class="pqcert-field"><label>Award ID for update</label><input class="pqcert-input" name="awardid"></div><div class="pqcert-field"><label>Student</label><select class="pqcert-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqcert-field"><label>Template</label><select class="pqcert-select" name="templateid"><option value="0">No template</option>';
foreach ($templates as $template) { echo '<option value="' . (int)$template->id . '">' . s($template->title) . '</option>'; }
echo '</select></div><div class="pqcert-field"><label>Course offering</label><select class="pqcert-select" name="offeringid"><option value="0">No offering</option>';
foreach ($offerings as $offering) { echo '<option value="' . (int)$offering->id . '">' . s($offering->title) . '</option>'; }
echo '</select></div>';
foreach ([['courseid','Moodle course ID'],['awardnumber','Award number'],['award_type','Award type'],['title','Award title'],['status','Status'],['completion_percent','Completion percent'],['final_grade','Final grade'],['issuedat','Issued date']] as $field) { echo '<div class="pqcert-field"><label>' . s($field[1]) . '</label><input class="pqcert-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqcert-field"><label>Evidence</label><textarea class="pqcert-textarea" name="evidence"></textarea></div><button class="pqcert-btn">Issue Award</button></form></section><section class="pqcert-panel"><h3>Awards</h3><table class="pqcert-table"><thead><tr><th>Award</th><th>Student</th><th>Status</th><th>PDF / Revoke</th></tr></thead><tbody>';
foreach ($awards as $award) {
    $pdf = (int)$award->generateddocid > 0 ? (new moodle_url('/local/hubredirect/document_pdf.php', ['generatedid' => (int)$award->generateddocid]))->out(false) : '';
    echo '<tr><td><strong>' . s($award->title) . '</strong><div class="pqcert-muted">' . s($award->awardnumber . ' / ' . $award->award_type) . '</div></td><td>' . s(trim($award->firstname . ' ' . $award->lastname)) . '</td><td><span class="pqcert-pill">' . s($award->status) . '</span><div class="pqcert-muted">' . s((int)$award->issuedat > 0 ? userdate((int)$award->issuedat) : 'not issued') . '</div></td><td>' . ($pdf !== '' ? '<a class="pqcert-btn pqcert-btn--light" href="' . s($pdf) . '">PDF</a>' : '<span class="pqcert-muted">No PDF</span>') . '<form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="revoke_award"><input type="hidden" name="awardid" value="' . (int)$award->id . '"><input class="pqcert-input" name="revocation_reason" placeholder="Revocation reason"><button class="pqcert-btn pqcert-btn--light">Revoke</button></form></td></tr>';
}
if (!$awards) { echo '<tr><td colspan="4" class="pqcert-muted">No awards yet.</td></tr>'; }
echo '</tbody></table><h3>Templates</h3><table class="pqcert-table"><tbody>';
foreach ($templates as $template) { echo '<tr><td><strong>#' . (int)$template->id . ' ' . s($template->title) . '</strong><div class="pqcert-muted">' . s($template->template_key . ' / ' . $template->award_type) . '</div></td><td><span class="pqcert-pill">' . s($template->status) . '</span></td></tr>'; }
if (!$templates) { echo '<tr><td class="pqcert-muted">No templates yet.</td></tr>'; }
echo '</tbody></table><h3>Audit</h3><table class="pqcert-table"><tbody>';
foreach ($audits as $audit) { echo '<tr><td>Award #' . (int)$audit->awardid . '</td><td><span class="pqcert-pill">' . s($audit->action) . '</span><div class="pqcert-muted">' . s(userdate((int)$audit->timecreated)) . '</div></td></tr>'; }
if (!$audits) { echo '<tr><td class="pqcert-muted">No certificate audit entries yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
