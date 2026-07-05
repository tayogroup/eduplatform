<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/admissionslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_current_consumer_context();
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Admissions management requires workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Admissions access denied');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$context = context_system::instance();
$urlparams = ['workspaceid' => $workspaceid];
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/admissions.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Admissions Pipeline');
$PAGE->set_heading('Admissions Pipeline');

$notice = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if (!pqadm_schema_ready()) {
            throw new invalid_parameter_exception('Admissions tables are not installed yet. Run Moodle upgrade.');
        }
        if ($action === 'save_application') {
            $applicationid = optional_param('applicationid', 0, PARAM_INT);
            $studentprofile = [
                'date_of_birth' => optional_param('date_of_birth', '', PARAM_TEXT),
                'current_level' => optional_param('current_level', '', PARAM_TEXT),
                'learning_base' => optional_param('learning_base', '', PARAM_TEXT),
                'language' => optional_param('language', '', PARAM_TEXT),
                'support_needs' => optional_param('support_needs', '', PARAM_TEXT),
            ];
            $familyprofile = [
                'home_country' => optional_param('home_country', '', PARAM_TEXT),
                'timezone' => optional_param('timezone', '', PARAM_TEXT),
                'availability' => optional_param('availability', '', PARAM_TEXT),
            ];
            $placement = [
                'assessment_date' => optional_param('assessment_date', '', PARAM_TEXT),
                'recommended_level' => optional_param('recommended_level', '', PARAM_TEXT),
                'assessor_notes' => optional_param('assessor_notes', '', PARAM_TEXT),
            ];
            $id = pqadm_create_or_update_application($workspaceid, $consumercontext, [
                'studentid' => optional_param('studentid', 0, PARAM_INT),
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'family_name' => optional_param('family_name', '', PARAM_TEXT),
                'student_name' => optional_param('student_name', '', PARAM_TEXT),
                'student_email' => optional_param('student_email', '', PARAM_TEXT),
                'parent_name' => optional_param('parent_name', '', PARAM_TEXT),
                'parent_email' => optional_param('parent_email', '', PARAM_TEXT),
                'parent_phone' => optional_param('parent_phone', '', PARAM_TEXT),
                'program_key' => optional_param('program_key', '', PARAM_ALPHANUMEXT),
                'desired_start' => optional_param('desired_start', '', PARAM_TEXT),
                'application_status' => optional_param('application_status', 'submitted', PARAM_ALPHANUMEXT),
                'review_status' => optional_param('review_status', 'pending', PARAM_ALPHANUMEXT),
                'placement_status' => optional_param('placement_status', 'not_assessed', PARAM_ALPHANUMEXT),
                'decision' => optional_param('decision', 'pending', PARAM_ALPHANUMEXT),
                'review_notes' => optional_param('review_notes', '', PARAM_TEXT),
                'decision_notes' => optional_param('decision_notes', '', PARAM_TEXT),
                'student_profile' => $studentprofile,
                'family_profile' => $familyprofile,
                'placement' => $placement,
            ], (int)$USER->id, $applicationid);
            $notice = 'Application saved.';
            if (!empty($_FILES['admission_document']) && (int)($_FILES['admission_document']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
                $application = $DB->get_record('local_prequran_admission_app', ['id' => $id, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
                pqadm_save_uploaded_document($application, $_FILES['admission_document'], optional_param('document_type', 'other', PARAM_ALPHANUMEXT), optional_param('document_label', '', PARAM_TEXT), (int)$USER->id);
                $notice = 'Application and document saved.';
            }
        } else if ($action === 'decision') {
            pqadm_set_decision(optional_param('applicationid', 0, PARAM_INT), $workspaceid, optional_param('decision', 'pending', PARAM_ALPHANUMEXT), optional_param('decision_notes', '', PARAM_TEXT), (int)$USER->id);
            $notice = 'Admissions decision saved.';
        } else if ($action === 'convert') {
            $result = pqadm_convert_application(optional_param('applicationid', 0, PARAM_INT), $workspaceid, $consumercontext, (int)$USER->id);
            $notice = 'Applicant converted to student #' . (int)($result['studentid'] ?? 0) . '.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$editid = optional_param('editid', 0, PARAM_INT);
$edit = $editid > 0 && pqadm_schema_ready() ? $DB->get_record('local_prequran_admission_app', ['id' => $editid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : null;
$applications = pqadm_schema_ready() ? array_values($DB->get_records('local_prequran_admission_app', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$docs = [];
if ($applications && pqadm_schema_ready()) {
    $ids = array_map(static function($row): int {
        return (int)$row->id;
    }, $applications);
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'app');
    $rows = $DB->get_records_select('local_prequran_admission_doc', "applicationid {$insql}", $params, 'timecreated DESC');
    foreach ($rows as $doc) {
        $docs[(int)$doc->applicationid][] = $doc;
    }
}
$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? $DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC', 'id,title,status') : [];
$students = pqh_table_exists_safe('local_prequran_workspace_member') ? $DB->get_records_sql(
    "SELECT u.id, u.firstname, u.lastname, u.email
       FROM {local_prequran_workspace_member} wm
       JOIN {user} u ON u.id = wm.userid
      WHERE wm.workspaceid = :workspaceid AND wm.workspace_role = :role AND wm.status = :status
   ORDER BY u.lastname ASC, u.firstname ASC",
    ['workspaceid' => $workspaceid, 'role' => 'student', 'status' => 'active']
) : [];

echo $OUTPUT->header();
echo '<style>.pqadm-wrap{max-width:1180px;margin:0 auto}.pqadm-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:16px}.pqadm-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqadm-btn--light{background:#f7fbf8;color:#173044}.pqadm-grid{display:grid;grid-template-columns:380px 1fr;gap:16px}.pqadm-panel,.pqadm-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqadm-field{margin-bottom:10px}.pqadm-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqadm-input,.pqadm-select,.pqadm-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqadm-textarea{min-height:76px}.pqadm-table{width:100%;border-collapse:collapse}.pqadm-table th,.pqadm-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqadm-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqadm-muted{color:#617064;font-size:12px}.pqadm-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqadm-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqadm-grid{grid-template-columns:1fr}.pqadm-top{display:block}}</style>';
echo '<div class="pqadm-wrap">';
echo '<div class="pqadm-top"><div><h2>Admissions And Applications</h2><div class="pqadm-muted">' . s($workspace->name) . ' application intake, document review, placement, decision, and conversion.</div></div><a class="pqadm-btn pqadm-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') {
    echo '<div class="pqadm-notice">' . s($notice) . '</div>';
}
if ($error !== '') {
    echo '<div class="pqadm-error">' . s($error) . '</div>';
}
if (!pqadm_schema_ready()) {
    echo '<div class="pqadm-error">Admissions schema is not ready. Run the Moodle local_prequran upgrade.</div>';
}
$studentprofile = $edit ? (json_decode((string)$edit->student_profile_json, true) ?: []) : [];
$familyprofile = $edit ? (json_decode((string)$edit->family_profile_json, true) ?: []) : [];
$placement = $edit ? (json_decode((string)$edit->placement_json, true) ?: []) : [];
echo '<div class="pqadm-grid"><section class="pqadm-panel"><h3>' . ($edit ? 'Edit Application' : 'New Application') . '</h3><form method="post" enctype="multipart/form-data">';
echo '<input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_application"><input type="hidden" name="applicationid" value="' . (int)($edit->id ?? 0) . '">';
$fields = [
    ['family_name', 'Family name', (string)($edit->family_name ?? '')],
    ['student_name', 'Student name', (string)($edit->student_name ?? '')],
    ['student_email', 'Student email', (string)($edit->student_email ?? '')],
    ['parent_name', 'Parent/guardian name', (string)($edit->parent_name ?? '')],
    ['parent_email', 'Parent/guardian email', (string)($edit->parent_email ?? '')],
    ['parent_phone', 'Parent/guardian phone', (string)($edit->parent_phone ?? '')],
    ['program_key', 'Program key', (string)($edit->program_key ?? '')],
    ['desired_start', 'Desired start', (string)($edit->desired_start ?? '')],
    ['date_of_birth', 'Date of birth', (string)($studentprofile['date_of_birth'] ?? '')],
    ['current_level', 'Current level', (string)($studentprofile['current_level'] ?? '')],
    ['learning_base', 'Learning base', (string)($studentprofile['learning_base'] ?? '')],
    ['language', 'Teaching language', (string)($studentprofile['language'] ?? '')],
    ['home_country', 'Family country', (string)($familyprofile['home_country'] ?? '')],
    ['timezone', 'Family timezone', (string)($familyprofile['timezone'] ?? '')],
    ['assessment_date', 'Assessment date', (string)($placement['assessment_date'] ?? '')],
    ['recommended_level', 'Recommended placement', (string)($placement['recommended_level'] ?? '')],
];
foreach ($fields as $field) {
    echo '<div class="pqadm-field"><label>' . s($field[1]) . '</label><input class="pqadm-input" name="' . s($field[0]) . '" value="' . s($field[2]) . '"></div>';
}
echo '<div class="pqadm-field"><label>Link existing student</label><select class="pqadm-select" name="studentid"><option value="0">Create or match by email</option>';
foreach ($students as $student) {
    echo '<option value="' . (int)$student->id . '"' . ((int)($edit->studentid ?? 0) === (int)$student->id ? ' selected' : '') . '>' . s(fullname($student) . ' / ' . $student->email) . '</option>';
}
echo '</select></div><div class="pqadm-field"><label>Course offering</label><select class="pqadm-select" name="offeringid"><option value="0">No immediate enrollment</option>';
foreach ($offerings as $offering) {
    echo '<option value="' . (int)$offering->id . '"' . ((int)($edit->offeringid ?? 0) === (int)$offering->id ? ' selected' : '') . '>' . s($offering->title . ' / ' . $offering->status) . '</option>';
}
echo '</select></div>';
echo '<div class="pqadm-field"><label>Application status</label><select class="pqadm-select" name="application_status">';
foreach (pqadm_application_statuses() as $key => $label) {
    echo '<option value="' . s($key) . '"' . ((string)($edit->application_status ?? 'submitted') === $key ? ' selected' : '') . '>' . s($label) . '</option>';
}
echo '</select></div><div class="pqadm-field"><label>Placement status</label><select class="pqadm-select" name="placement_status">';
foreach (pqadm_placement_statuses() as $key => $label) {
    echo '<option value="' . s($key) . '"' . ((string)($edit->placement_status ?? 'not_assessed') === $key ? ' selected' : '') . '>' . s($label) . '</option>';
}
echo '</select></div><div class="pqadm-field"><label>Decision</label><select class="pqadm-select" name="decision">';
foreach (pqadm_decisions() as $key => $label) {
    echo '<option value="' . s($key) . '"' . ((string)($edit->decision ?? 'pending') === $key ? ' selected' : '') . '>' . s($label) . '</option>';
}
echo '</select></div>';
foreach ([['availability', 'Availability', $familyprofile], ['support_needs', 'Support needs', $studentprofile], ['assessor_notes', 'Assessment notes', $placement]] as $textarea) {
    echo '<div class="pqadm-field"><label>' . s($textarea[1]) . '</label><textarea class="pqadm-textarea" name="' . s($textarea[0]) . '">' . s((string)($textarea[2][$textarea[0]] ?? '')) . '</textarea></div>';
}
echo '<div class="pqadm-field"><label>Review notes</label><textarea class="pqadm-textarea" name="review_notes">' . s((string)($edit->review_notes ?? '')) . '</textarea></div>';
echo '<div class="pqadm-field"><label>Decision notes</label><textarea class="pqadm-textarea" name="decision_notes">' . s((string)($edit->decision_notes ?? '')) . '</textarea></div>';
echo '<div class="pqadm-field"><label>Document label</label><input class="pqadm-input" name="document_label"></div><div class="pqadm-field"><label>Document type</label><input class="pqadm-input" name="document_type" value="identity"></div><div class="pqadm-field"><label>Upload document</label><input class="pqadm-input" type="file" name="admission_document"></div>';
echo '<button class="pqadm-btn" type="submit">Save Application</button> <a class="pqadm-btn pqadm-btn--light" href="' . (new moodle_url('/local/hubredirect/admissions.php', $urlparams))->out(false) . '">Clear</a></form></section>';
echo '<section class="pqadm-panel"><h3>Pipeline</h3><table class="pqadm-table"><thead><tr><th>Applicant</th><th>Status</th><th>Review</th><th>Documents</th><th>Actions</th></tr></thead><tbody>';
foreach ($applications as $application) {
    echo '<tr><td><strong>' . s($application->student_name) . '</strong><div class="pqadm-muted">' . s($application->application_no . ' / ' . $application->parent_email) . '</div></td><td><span class="pqadm-pill">' . s($application->application_status) . '</span><br><span class="pqadm-pill">' . s($application->decision) . '</span></td><td>' . s($application->placement_status) . '<div class="pqadm-muted">' . s(core_text::substr((string)$application->review_notes, 0, 120)) . '</div></td><td>';
    foreach (($docs[(int)$application->id] ?? []) as $doc) {
        echo '<div class="pqadm-muted">' . s($doc->document_label . ' / ' . $doc->status) . '</div>';
    }
    echo '</td><td><a class="pqadm-btn pqadm-btn--light" href="' . (new moodle_url('/local/hubredirect/admissions.php', $urlparams + ['editid' => (int)$application->id]))->out(false) . '">Edit</a> ';
    echo '<form method="post" style="display:inline"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="convert"><input type="hidden" name="applicationid" value="' . (int)$application->id . '"><button class="pqadm-btn" type="submit">Convert</button></form></td></tr>';
}
if (!$applications) {
    echo '<tr><td colspan="5" class="pqadm-muted">No applications yet.</td></tr>';
}
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
