<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/certificates_placementlib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'registrar.manage')) {
    pqh_access_denied('Placement tests require registrar or administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Placement access denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqcp_ready()) {
            throw new invalid_parameter_exception('Placement test tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_test') {
            $testid = optional_param('testid', 0, PARAM_INT);
            $existing = $testid > 0 ? $DB->get_record('local_prequran_place_test', ['id' => $testid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'test_key' => optional_param('test_key', '', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'domain' => optional_param('domain', 'quran_arabic', PARAM_ALPHANUMEXT),
                'level_band' => optional_param('level_band', '', PARAM_TEXT),
                'delivery_mode' => optional_param('delivery_mode', 'oral_and_written', PARAM_ALPHANUMEXT),
                'instructions' => optional_param('instructions', '', PARAM_TEXT),
                'rubricjson' => pqcp_json(['rubric' => optional_param('rubric', '', PARAM_TEXT)]),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_place_test', $record);
                $notice = 'Placement test updated.';
            } else {
                $DB->insert_record('local_prequran_place_test', $record);
                $notice = 'Placement test created.';
            }
        } else if ($action === 'save_session') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $existing = $sessionid > 0 ? $DB->get_record('local_prequran_place_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'testid' => optional_param('testid', (int)($existing->testid ?? 0), PARAM_INT),
                'applicationid' => optional_param('applicationid', (int)($existing->applicationid ?? 0), PARAM_INT),
                'studentid' => optional_param('studentid', (int)($existing->studentid ?? 0), PARAM_INT),
                'assessorid' => optional_param('assessorid', (int)($existing->assessorid ?? $USER->id), PARAM_INT),
                'status' => optional_param('status', 'scheduled', PARAM_ALPHANUMEXT),
                'scheduledat' => pqcp_date_to_time(optional_param('scheduledat', '', PARAM_TEXT)) ?: (int)($existing->scheduledat ?? 0),
                'startedat' => optional_param('status', 'scheduled', PARAM_ALPHANUMEXT) === 'in_progress' ? $now : (int)($existing->startedat ?? 0),
                'completedat' => optional_param('status', 'scheduled', PARAM_ALPHANUMEXT) === 'completed' ? $now : (int)($existing->completedat ?? 0),
                'recommended_level' => optional_param('recommended_level', '', PARAM_TEXT),
                'recommended_course_key' => optional_param('recommended_course_key', '', PARAM_TEXT),
                'score_percent' => optional_param('score_percent', '', PARAM_TEXT),
                'resultjson' => pqcp_json([
                    'quran_score' => optional_param('quran_score', '', PARAM_TEXT),
                    'arabic_score' => optional_param('arabic_score', '', PARAM_TEXT),
                    'tajweed_score' => optional_param('tajweed_score', '', PARAM_TEXT),
                    'readiness' => optional_param('readiness', '', PARAM_TEXT),
                ]),
                'assessor_notes' => optional_param('assessor_notes', '', PARAM_TEXT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_place_session', $record);
                $sessionid = (int)$existing->id;
                pqcp_place_audit($workspaceid, $sessionid, (int)$USER->id, 'placement_session_updated', ['status' => $record->status]);
            } else {
                $sessionid = (int)$DB->insert_record('local_prequran_place_session', $record);
                $record->id = $sessionid;
                pqcp_place_audit($workspaceid, $sessionid, (int)$USER->id, 'placement_session_created', ['status' => $record->status]);
            }
            if ((string)$record->status === 'completed' || (string)$record->recommended_level !== '') {
                pqcp_apply_placement_result($record, (int)$USER->id);
                pqcp_place_audit($workspaceid, $sessionid, (int)$USER->id, 'placement_result_applied', ['recommended_level' => $record->recommended_level]);
            }
            $notice = 'Placement session saved.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/placement_tests.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Placement Tests');
$PAGE->set_heading('Placement Tests');

$students = pqcp_workspace_users($workspaceid, ['student']);
$assessors = pqcp_workspace_users($workspaceid, ['owner', 'admin', 'coordinator', 'registrar', 'teacher', 'assistant_teacher']);
$tests = pqh_table_exists_safe('local_prequran_place_test') ? array_values($DB->get_records('local_prequran_place_test', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$applications = pqh_table_exists_safe('local_prequran_admission_app') ? array_values($DB->get_records('local_prequran_admission_app', ['workspaceid' => $workspaceid], 'timemodified DESC', 'id,application_no,student_name,placement_status', 0, 80)) : [];
$sessions = pqh_table_exists_safe('local_prequran_place_session') ? array_values($DB->get_records_sql("SELECT s.*, t.title AS testtitle, u.firstname, u.lastname FROM {local_prequran_place_session} s LEFT JOIN {local_prequran_place_test} t ON t.id = s.testid LEFT JOIN {user} u ON u.id = s.studentid WHERE s.workspaceid = :workspaceid ORDER BY s.timemodified DESC", ['workspaceid' => $workspaceid], 0, 100)) : [];
$audits = pqh_table_exists_safe('local_prequran_place_audit') ? array_values($DB->get_records('local_prequran_place_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];

echo $OUTPUT->header();
echo '<style>.pqplace{max-width:1180px;margin:0 auto}.pqplace-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqplace-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqplace-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqplace-field{margin-bottom:10px}.pqplace-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqplace-input,.pqplace-select,.pqplace-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqplace-textarea{min-height:72px}.pqplace-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqplace-btn--light{background:#f7fbf8;color:#173044}.pqplace-table{width:100%;border-collapse:collapse}.pqplace-table th,.pqplace-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqplace-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqplace-muted{color:#617064;font-size:12px}.pqplace-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqplace-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqplace-grid,.pqplace-top{display:block}}</style>';
echo '<div class="pqplace"><div class="pqplace-top"><div><h2>Placement Tests</h2><div class="pqplace-muted">' . s($workspace->name) . ' placement test setup, scheduling, scoring, recommendations, admissions updates, and learning-path placement.</div></div><a class="pqplace-btn pqplace-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqplace-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqplace-error">' . s($error) . '</div>'; }
if (!pqcp_ready()) { echo '<div class="pqplace-error">Placement schema is not ready. Run Moodle upgrade.</div>'; }
echo '<div class="pqplace-grid"><section class="pqplace-panel"><h3>Test Definition</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_test">';
foreach ([['testid','Test ID for update'],['test_key','Test key'],['title','Title'],['domain','Domain'],['level_band','Level band'],['delivery_mode','Delivery mode'],['status','Status']] as $field) { echo '<div class="pqplace-field"><label>' . s($field[1]) . '</label><input class="pqplace-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqplace-field"><label>Instructions</label><textarea class="pqplace-textarea" name="instructions"></textarea></div><div class="pqplace-field"><label>Rubric</label><textarea class="pqplace-textarea" name="rubric"></textarea></div><button class="pqplace-btn">Save Test</button></form><hr><h3>Schedule / Score Session</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_session"><div class="pqplace-field"><label>Session ID for update</label><input class="pqplace-input" name="sessionid"></div><div class="pqplace-field"><label>Test</label><select class="pqplace-select" name="testid">';
foreach ($tests as $test) { echo '<option value="' . (int)$test->id . '">' . s($test->title) . '</option>'; }
echo '</select></div><div class="pqplace-field"><label>Application</label><select class="pqplace-select" name="applicationid"><option value="0">No application</option>';
foreach ($applications as $app) { echo '<option value="' . (int)$app->id . '">' . s($app->application_no . ' / ' . $app->student_name) . '</option>'; }
echo '</select></div><div class="pqplace-field"><label>Student</label><select class="pqplace-select" name="studentid"><option value="0">Applicant only</option>';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqplace-field"><label>Assessor</label><select class="pqplace-select" name="assessorid">';
foreach ($assessors as $assessor) { echo '<option value="' . (int)$assessor->id . '">' . s(fullname($assessor) . ' / ' . $assessor->workspace_role) . '</option>'; }
echo '</select></div>';
foreach ([['status','Status'],['scheduledat','Scheduled date'],['recommended_level','Recommended level'],['recommended_course_key','Recommended course key'],['score_percent','Score percent'],['quran_score','Quran score'],['arabic_score','Arabic score'],['tajweed_score','Tajweed score'],['readiness','Readiness']] as $field) { echo '<div class="pqplace-field"><label>' . s($field[1]) . '</label><input class="pqplace-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqplace-field"><label>Assessor notes</label><textarea class="pqplace-textarea" name="assessor_notes"></textarea></div><button class="pqplace-btn">Save Session</button></form></section><section class="pqplace-panel"><h3>Placement Sessions</h3><table class="pqplace-table"><thead><tr><th>Session</th><th>Student</th><th>Recommendation</th></tr></thead><tbody>';
foreach ($sessions as $session) { echo '<tr><td><strong>#' . (int)$session->id . ' ' . s($session->testtitle ?? 'Placement test') . '</strong><div class="pqplace-muted">' . s((int)$session->scheduledat > 0 ? userdate((int)$session->scheduledat) : 'unscheduled') . '</div></td><td>' . s(trim($session->firstname . ' ' . $session->lastname)) . '<div class="pqplace-muted">Application #' . (int)$session->applicationid . '</div></td><td><span class="pqplace-pill">' . s($session->status) . '</span><div class="pqplace-muted">' . s($session->recommended_level . ' / ' . $session->recommended_course_key . ' / ' . $session->score_percent . '%') . '</div></td></tr>'; }
if (!$sessions) { echo '<tr><td colspan="3" class="pqplace-muted">No placement sessions yet.</td></tr>'; }
echo '</tbody></table><h3>Test Definitions</h3><table class="pqplace-table"><tbody>';
foreach ($tests as $test) { echo '<tr><td><strong>#' . (int)$test->id . ' ' . s($test->title) . '</strong><div class="pqplace-muted">' . s($test->test_key . ' / ' . $test->domain . ' / ' . $test->level_band) . '</div></td><td><span class="pqplace-pill">' . s($test->status) . '</span></td></tr>'; }
if (!$tests) { echo '<tr><td class="pqplace-muted">No tests yet.</td></tr>'; }
echo '</tbody></table><h3>Audit</h3><table class="pqplace-table"><tbody>';
foreach ($audits as $audit) { echo '<tr><td>Session #' . (int)$audit->sessionid . '</td><td><span class="pqplace-pill">' . s($audit->action) . '</span><div class="pqplace-muted">' . s(userdate((int)$audit->timecreated)) . '</div></td></tr>'; }
if (!$audits) { echo '<tr><td class="pqplace-muted">No placement audit entries yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
