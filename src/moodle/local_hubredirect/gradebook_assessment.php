<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/gradebook_progresslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Gradebook access requires teacher or workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Gradebook access denied');
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$ready = pqgp_gradebook_ready();
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!$ready) {
            throw new invalid_parameter_exception('Gradebook tables are not installed yet. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_category' && $canmanage) {
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'category_key' => optional_param('category_key', '', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'weight_percent' => optional_param('weight_percent', '0', PARAM_TEXT),
                'drop_lowest_count' => optional_param('drop_lowest_count', '0', PARAM_TEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $id = (int)$DB->insert_record('local_prequran_grade_category', $record);
            pqgp_audit($workspaceid, 'grade_category_created', [], (array)$record, (int)$USER->id, ['offeringid' => (int)$record->offeringid], 'Category created.');
            $notice = 'Weighted grading category saved.';
        } else if ($action === 'save_assessment' && $canmanage) {
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'categoryid' => optional_param('categoryid', 0, PARAM_INT),
                'assessment_type' => optional_param('assessment_type', 'assignment', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'description' => optional_param('description', '', PARAM_TEXT),
                'max_points' => optional_param('max_points', '100', PARAM_TEXT),
                'weight_override' => optional_param('weight_override', '', PARAM_TEXT),
                'duedate' => strtotime(optional_param('duedate', '', PARAM_TEXT) . ' 00:00:00') ?: 0,
                'publishdate' => 0,
                'status' => optional_param('status', 'draft', PARAM_ALPHANUMEXT),
                'createdby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $id = (int)$DB->insert_record('local_prequran_assessment', $record);
            pqgp_audit($workspaceid, 'assessment_created', [], (array)$record, (int)$USER->id, ['offeringid' => (int)$record->offeringid, 'assessmentid' => $id], 'Assessment created.');
            $notice = 'Assessment saved.';
        } else if ($action === 'save_grade') {
            $assessment = $DB->get_record('local_prequran_assessment', ['id' => optional_param('assessmentid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_grade', ['assessmentid' => (int)$assessment->id, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $points = optional_param('score_points', '', PARAM_TEXT);
            $maxpoints = max(0.01, pqgp_money_float((string)$assessment->max_points));
            $percent = optional_param('score_percent', '', PARAM_TEXT);
            if ($percent === '' && $points !== '') {
                $percent = (string)round((pqgp_money_float($points) / $maxpoints) * 100, 2);
            }
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => (int)$assessment->offeringid,
                'assessmentid' => (int)$assessment->id,
                'studentid' => $studentid,
                'score_points' => $points,
                'score_percent' => $percent,
                'letter_grade' => $percent !== '' ? pqgp_letter(pqgp_money_float($percent)) : '',
                'status' => optional_param('status', 'draft', PARAM_ALPHANUMEXT),
                'teacher_feedback' => optional_param('teacher_feedback', '', PARAM_TEXT),
                'rubric_json' => pqgp_json(['rubric_note' => optional_param('rubric_note', '', PARAM_TEXT)]),
                'gradedby' => (int)$USER->id,
                'gradedat' => $now,
                'reviewedby' => optional_param('status', 'draft', PARAM_ALPHANUMEXT) === 'reviewed' ? (int)$USER->id : (int)($existing->reviewedby ?? 0),
                'reviewedat' => optional_param('status', 'draft', PARAM_ALPHANUMEXT) === 'reviewed' ? $now : (int)($existing->reviewedat ?? 0),
                'publishedby' => optional_param('status', 'draft', PARAM_ALPHANUMEXT) === 'published' ? (int)$USER->id : (int)($existing->publishedby ?? 0),
                'publishedat' => optional_param('status', 'draft', PARAM_ALPHANUMEXT) === 'published' ? $now : (int)($existing->publishedat ?? 0),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_grade', $record);
                $gradeid = (int)$existing->id;
            } else {
                $gradeid = (int)$DB->insert_record('local_prequran_grade', $record);
            }
            pqgp_audit($workspaceid, 'grade_saved', $existing ? (array)$existing : [], (array)$record, (int)$USER->id, ['offeringid' => (int)$assessment->offeringid, 'assessmentid' => (int)$assessment->id, 'gradeid' => $gradeid, 'studentid' => $studentid], optional_param('correction_reason', '', PARAM_TEXT));
            pqgp_recalculate_course_grade($workspaceid, (int)$assessment->offeringid, $studentid, (int)$USER->id, false);
            $notice = 'Grade saved and course grade recalculated.';
        } else if ($action === 'publish_course_grade') {
            pqgp_recalculate_course_grade($workspaceid, optional_param('offeringid', 0, PARAM_INT), optional_param('studentid', 0, PARAM_INT), (int)$USER->id, true);
            $notice = 'Course grade published for transcript use.';
        } else if ($action === 'save_dispute') {
            $record = (object)[
                'workspaceid' => $workspaceid,
                'gradeid' => optional_param('gradeid', 0, PARAM_INT),
                'coursegradeid' => optional_param('coursegradeid', 0, PARAM_INT),
                'studentid' => optional_param('studentid', 0, PARAM_INT),
                'requesterid' => (int)$USER->id,
                'status' => optional_param('status', 'open', PARAM_ALPHANUMEXT),
                'reason' => optional_param('reason', '', PARAM_TEXT),
                'resolution' => optional_param('resolution', '', PARAM_TEXT),
                'resolvedby' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'resolved' ? (int)$USER->id : 0,
                'resolvedat' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'resolved' ? $now : 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $id = (int)$DB->insert_record('local_prequran_grade_dispute', $record);
            pqgp_audit($workspaceid, 'grade_dispute_recorded', [], (array)$record, (int)$USER->id, ['gradeid' => (int)$record->gradeid, 'coursegradeid' => (int)$record->coursegradeid, 'studentid' => (int)$record->studentid], 'Dispute/correction recorded.');
            $notice = 'Dispute or correction recorded.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/gradebook_assessment.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Gradebook And Assessment');
$PAGE->set_heading('Gradebook And Assessment');

$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC')) : [];
$categories = $ready ? array_values($DB->get_records('local_prequran_grade_category', ['workspaceid' => $workspaceid], 'offeringid ASC, title ASC')) : [];
$assessments = $ready ? array_values($DB->get_records('local_prequran_assessment', ['workspaceid' => $workspaceid], 'duedate DESC, id DESC', '*', 0, 80)) : [];
$students = pqgp_student_options($workspaceid);
$grades = $ready ? array_values($DB->get_records_sql(
    "SELECT g.*, a.title AS assessment_title, a.assessment_type, u.firstname, u.lastname, u.email
       FROM {local_prequran_grade} g
       JOIN {local_prequran_assessment} a ON a.id = g.assessmentid
  LEFT JOIN {user} u ON u.id = g.studentid
      WHERE g.workspaceid = :workspaceid
   ORDER BY g.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    120
)) : [];
$coursegrades = $ready ? array_values($DB->get_records_sql(
    "SELECT cg.*, u.firstname, u.lastname, u.email, o.title AS offering_title
       FROM {local_prequran_course_grade} cg
  LEFT JOIN {user} u ON u.id = cg.studentid
  LEFT JOIN {local_prequran_course_offering} o ON o.id = cg.offeringid
      WHERE cg.workspaceid = :workspaceid
   ORDER BY cg.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    80
)) : [];
$audits = $ready ? array_values($DB->get_records('local_prequran_grade_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 30)) : [];

echo $OUTPUT->header();
echo '<style>.pqgb-wrap{max-width:1180px;margin:0 auto}.pqgb-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px}.pqgb-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqgb-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqgb-field{margin-bottom:10px}.pqgb-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqgb-input,.pqgb-select,.pqgb-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqgb-textarea{min-height:70px}.pqgb-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqgb-btn--light{background:#f7fbf8;color:#173044}.pqgb-table{width:100%;border-collapse:collapse}.pqgb-table th,.pqgb-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqgb-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqgb-muted{color:#617064;font-size:12px}.pqgb-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqgb-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqgb-grid,.pqgb-top{display:block}}</style>';
echo '<div class="pqgb-wrap"><div class="pqgb-top"><div><h2>Gradebook And Assessment</h2><div class="pqgb-muted">' . s($workspace->name) . ' assignments, quizzes, exams, oral evaluations, weighted categories, review, publishing, disputes, corrections, and audit.</div></div><a class="pqgb-btn pqgb-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqgb-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqgb-error">' . s($error) . '</div>'; }
if (!$ready) { echo '<div class="pqgb-error">Gradebook schema is not ready. Run the Moodle local_prequran upgrade.</div>'; }
echo '<div class="pqgb-grid"><section class="pqgb-panel">';
if ($canmanage) {
    echo '<h3>Weighted Category</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_category"><div class="pqgb-field"><label>Offering</label><select class="pqgb-select" name="offeringid">';
    foreach ($offerings as $offering) { echo '<option value="' . (int)$offering->id . '">' . s($offering->title) . '</option>'; }
    echo '</select></div>';
    foreach ([['category_key','Key'],['title','Title'],['weight_percent','Weight percent'],['drop_lowest_count','Drop lowest count'],['status','Status']] as $field) { echo '<div class="pqgb-field"><label>' . s($field[1]) . '</label><input class="pqgb-input" name="' . s($field[0]) . '"></div>'; }
    echo '<button class="pqgb-btn" type="submit">Save Category</button></form><hr><h3>Assessment</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_assessment"><div class="pqgb-field"><label>Offering</label><select class="pqgb-select" name="offeringid">';
    foreach ($offerings as $offering) { echo '<option value="' . (int)$offering->id . '">' . s($offering->title) . '</option>'; }
    echo '</select></div><div class="pqgb-field"><label>Category</label><select class="pqgb-select" name="categoryid">';
    foreach ($categories as $category) { echo '<option value="' . (int)$category->id . '">' . s($category->title . ' / ' . $category->weight_percent . '%') . '</option>'; }
    echo '</select></div><div class="pqgb-field"><label>Type</label><select class="pqgb-select" name="assessment_type"><option value="assignment">Assignment</option><option value="quiz">Quiz</option><option value="exam">Exam</option><option value="oral_recitation">Oral recitation</option></select></div>';
    foreach ([['title','Title'],['max_points','Max points'],['weight_override','Weight override'],['duedate','Due date'],['status','Status']] as $field) { echo '<div class="pqgb-field"><label>' . s($field[1]) . '</label><input class="pqgb-input" name="' . s($field[0]) . '"></div>'; }
    echo '<div class="pqgb-field"><label>Description</label><textarea class="pqgb-textarea" name="description"></textarea></div><button class="pqgb-btn" type="submit">Save Assessment</button></form><hr>';
}
echo '<h3>Grade Entry</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_grade"><div class="pqgb-field"><label>Assessment</label><select class="pqgb-select" name="assessmentid">';
foreach ($assessments as $assessment) { echo '<option value="' . (int)$assessment->id . '">' . s($assessment->title . ' / ' . $assessment->assessment_type) . '</option>'; }
echo '</select></div><div class="pqgb-field"><label>Student</label><select class="pqgb-select" name="studentid">';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student) . ' / ' . $student->email) . '</option>'; }
echo '</select></div>';
foreach ([['score_points','Score points'],['score_percent','Score percent'],['rubric_note','Rubric note'],['correction_reason','Correction reason']] as $field) { echo '<div class="pqgb-field"><label>' . s($field[1]) . '</label><input class="pqgb-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqgb-field"><label>Status</label><select class="pqgb-select" name="status"><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="published">Published</option><option value="corrected">Corrected</option></select></div><div class="pqgb-field"><label>Teacher feedback</label><textarea class="pqgb-textarea" name="teacher_feedback"></textarea></div><button class="pqgb-btn" type="submit">Save Grade</button></form><hr><h3>Dispute / Correction</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_dispute">';
foreach ([['gradeid','Grade ID'],['coursegradeid','Course Grade ID'],['studentid','Student ID'],['reason','Reason'],['resolution','Resolution'],['status','Status']] as $field) { echo '<div class="pqgb-field"><label>' . s($field[1]) . '</label><input class="pqgb-input" name="' . s($field[0]) . '"></div>'; }
echo '<button class="pqgb-btn" type="submit">Record</button></form></section><section class="pqgb-panel"><h3>Published Course Grades</h3><table class="pqgb-table"><thead><tr><th>Student</th><th>Course</th><th>Grade</th><th>Action</th></tr></thead><tbody>';
foreach ($coursegrades as $row) {
    echo '<tr><td><strong>' . s(fullname($row)) . '</strong><div class="pqgb-muted">' . s($row->email) . '</div></td><td>' . s((string)$row->offering_title) . '</td><td><span class="pqgb-pill">' . s($row->final_percent . '% / ' . $row->letter_grade) . '</span><div class="pqgb-muted">' . s($row->status) . '</div></td><td><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="publish_course_grade"><input type="hidden" name="offeringid" value="' . (int)$row->offeringid . '"><input type="hidden" name="studentid" value="' . (int)$row->studentid . '"><button class="pqgb-btn pqgb-btn--light" type="submit">Publish</button></form></td></tr>';
}
if (!$coursegrades) { echo '<tr><td colspan="4" class="pqgb-muted">No course grades calculated yet.</td></tr>'; }
echo '</tbody></table><h3>Recent Grade Entries</h3><table class="pqgb-table"><thead><tr><th>Student</th><th>Assessment</th><th>Score</th><th>Status</th></tr></thead><tbody>';
foreach ($grades as $grade) {
    echo '<tr><td><strong>' . s(fullname($grade)) . '</strong><div class="pqgb-muted">Grade #' . (int)$grade->id . '</div></td><td>' . s($grade->assessment_title . ' / ' . $grade->assessment_type) . '</td><td>' . s($grade->score_percent . '% / ' . $grade->letter_grade) . '</td><td><span class="pqgb-pill">' . s($grade->status) . '</span></td></tr>';
}
if (!$grades) { echo '<tr><td colspan="4" class="pqgb-muted">No grade entries yet.</td></tr>'; }
echo '</tbody></table><h3>Audit Trail</h3><table class="pqgb-table"><thead><tr><th>Action</th><th>Target</th><th>Time</th></tr></thead><tbody>';
foreach ($audits as $audit) {
    echo '<tr><td>' . s($audit->action) . '</td><td>Student #' . (int)$audit->studentid . ' / Grade #' . (int)$audit->gradeid . '</td><td>' . s(userdate((int)$audit->timecreated, get_string('strftimedatetimeshort'))) . '</td></tr>';
}
if (!$audits) { echo '<tr><td colspan="3" class="pqgb-muted">No audit entries yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
