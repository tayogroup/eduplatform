<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/gradebook_progresslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'teacher.portal')) {
    pqh_access_denied('Teacher portal requires teacher workspace access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Teacher portal denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

function pqtp_notify_parent_update(int $workspaceid, int $sessionid, int $studentid, string $subject, string $message, string $eventtype): void {
    try {
        local_prequran_notify_parent_live_update(
            $sessionid,
            $studentid,
            $subject,
            $message,
            new moodle_url('/local/hubredirect/workspace_parent.php', [
                'workspaceid' => $workspaceid,
                'childid' => $studentid,
            ]),
            'Open parent workspace',
            $eventtype
        );
    } catch (Throwable $e) {
        debugging('Teacher portal parent notification failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'attendance') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$session->teacherid !== (int)$USER->id && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
                throw new invalid_parameter_exception('You can only mark attendance for your own classes.');
            }
            $existing = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'sessionid' => $sessionid,
                'userid' => $studentid,
                'studentid' => $studentid,
                'join_time' => optional_param('attendance_status', 'present', PARAM_ALPHANUMEXT) === 'absent' ? 0 : $now,
                'leave_time' => 0,
                'attendance_status' => optional_param('attendance_status', 'present', PARAM_ALPHANUMEXT),
                'participation_status' => optional_param('participation_status', 'engaged', PARAM_ALPHANUMEXT),
                'technical_issue' => optional_param('technical_issue', 0, PARAM_INT) ? 1 : 0,
                'notes' => optional_param('notes', '', PARAM_TEXT),
                'markedby' => (int)$USER->id,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if (pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_live_attendance', $record);
            } else {
                $DB->insert_record('local_prequran_live_attendance', $record);
            }
            pqtp_notify_parent_update(
                $workspaceid,
                $sessionid,
                $studentid,
                'Attendance recorded',
                'Attendance was recorded for class "' . (string)$session->title . '" with status ' . (string)$record->attendance_status . '.',
                'attendance_recorded'
            );
            $notice = 'Attendance saved.';
        } else if ($action === 'note') {
            $sessionid = optional_param('sessionid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'sessionid' => $sessionid,
                'studentid' => $studentid,
                'teacherid' => (int)$USER->id,
                'strengths' => optional_param('strengths', '', PARAM_TEXT),
                'needs_practice' => optional_param('needs_practice', '', PARAM_TEXT),
                'homework' => optional_param('homework', '', PARAM_TEXT),
                'homework_lessonid' => optional_param('homework_lessonid', '', PARAM_TEXT),
                'homework_unitid' => optional_param('homework_unitid', '', PARAM_TEXT),
                'homework_due_date' => optional_param('homework_due_date', '', PARAM_TEXT) !== '' ? strtotime(optional_param('homework_due_date', '', PARAM_TEXT) . ' 00:00:00') : 0,
                'homework_priority' => optional_param('homework_priority', 'normal', PARAM_ALPHANUMEXT),
                'parent_summary' => optional_param('parent_summary', '', PARAM_TEXT),
                'private_note' => optional_param('private_note', '', PARAM_TEXT),
                'visible_to_parent' => optional_param('visible_to_parent', 1, PARAM_INT) ? 1 : 0,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if (pqh_table_has_field_safe('local_prequran_live_note', 'workspaceid')) {
                $record->workspaceid = $workspaceid;
            }
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_live_note', $record);
            } else {
                $DB->insert_record('local_prequran_live_note', $record);
            }
            $notice = 'Notes, homework, and parent progress update saved.';
        } else if ($action === 'grade') {
            if (!pqh_table_exists_safe('local_prequran_grade')) {
                throw new invalid_parameter_exception('Grade table is not ready.');
            }
            $assessmentid = optional_param('assessmentid', 0, PARAM_INT);
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_grade', ['assessmentid' => $assessmentid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $score = optional_param('score_percent', '0', PARAM_TEXT);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'assessmentid' => $assessmentid,
                'studentid' => $studentid,
                'score_points' => optional_param('score_points', $score, PARAM_TEXT),
                'score_percent' => $score,
                'letter_grade' => optional_param('letter_grade', '', PARAM_TEXT),
                'status' => optional_param('status', 'reviewed', PARAM_ALPHANUMEXT),
                'teacher_feedback' => optional_param('teacher_feedback', '', PARAM_TEXT),
                'rubric_json' => pqgp_json(['teacher_portal' => 1]),
                'gradedby' => (int)$USER->id,
                'gradedat' => $now,
                'reviewedby' => (int)$USER->id,
                'reviewedat' => $now,
                'publishedby' => optional_param('status', 'reviewed', PARAM_ALPHANUMEXT) === 'published' ? (int)$USER->id : 0,
                'publishedat' => optional_param('status', 'reviewed', PARAM_ALPHANUMEXT) === 'published' ? $now : 0,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_grade', $record);
            } else {
                $DB->insert_record('local_prequran_grade', $record);
            }
            if ((string)$record->status === 'published') {
                $scorefloat = (float)$score;
                pqtp_notify_parent_update(
                    $workspaceid,
                    0,
                    $studentid,
                    'Grade published',
                    'A grade has been published. Score: ' . $score . '%. ' . (string)$record->teacher_feedback,
                    'grade_published'
                );
                if ($scorefloat > 0 && $scorefloat < 70) {
                    pqtp_notify_parent_update(
                        $workspaceid,
                        0,
                        $studentid,
                        'Low score alert',
                        'A published score needs support. Score: ' . $score . '%. Please review the teacher feedback.',
                        'low_score_alert'
                    );
                }
            }
            $notice = 'Assessment grade saved.';
        } else if ($action === 'progress') {
            if (!pqh_table_exists_safe('local_prequran_student_path')) {
                throw new invalid_parameter_exception('Student path table is not ready.');
            }
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $existing = $DB->get_record('local_prequran_student_path', ['workspaceid' => $workspaceid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'current_level' => optional_param('current_level', '', PARAM_TEXT),
                'placement_level' => optional_param('placement_level', '', PARAM_TEXT),
                'advancement_status' => optional_param('advancement_status', 'on_track', PARAM_ALPHANUMEXT),
                'recommended_course_key' => optional_param('recommended_course_key', '', PARAM_TEXT),
                'recommendation_reason' => optional_param('recommendation_reason', '', PARAM_TEXT),
                'teacher_comment' => optional_param('teacher_comment', '', PARAM_TEXT),
                'reviewedby' => (int)$USER->id,
                'reviewedat' => $now,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_student_path', $record);
            } else {
                $DB->insert_record('local_prequran_student_path', $record);
            }
            $notice = 'Student progress updated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$todaystart = strtotime('today') ?: time();
$tomorrow = $todaystart + DAYSECS;
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records_sql(
    "SELECT s.*,
            (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS roster_count
       FROM {local_prequran_live_session} s
      WHERE s.workspaceid = :workspaceid
        AND s.teacherid = :teacherid
        AND s.scheduled_start >= :start
        AND s.scheduled_start < :end
        AND s.status <> :cancelled
   ORDER BY s.scheduled_start ASC",
    ['workspaceid' => $workspaceid, 'teacherid' => (int)$USER->id, 'start' => $todaystart, 'end' => $tomorrow, 'cancelled' => 'cancelled'],
    0,
    40
)) : [];
$roster = pqh_table_exists_safe('local_prequran_teacher_student') ? array_values($DB->get_records_sql(
    "SELECT ts.*, u.firstname, u.lastname, u.email
       FROM {local_prequran_teacher_student} ts
       JOIN {user} u ON u.id = ts.studentid
      WHERE ts.workspaceid = :workspaceid
        AND ts.teacherid = :teacherid
        AND ts.status = :status
   ORDER BY u.lastname ASC, u.firstname ASC",
    ['workspaceid' => $workspaceid, 'teacherid' => (int)$USER->id, 'status' => 'active'],
    0,
    120
)) : [];
$assessments = pqh_table_exists_safe('local_prequran_assessment') ? array_values($DB->get_records('local_prequran_assessment', ['workspaceid' => $workspaceid], 'duedate DESC, id DESC', '*', 0, 80)) : [];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_portal.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Portal');
$PAGE->set_heading('Teacher Portal');

echo $OUTPUT->header();
echo '<style>.pqtp{max-width:1180px;margin:0 auto}.pqtp-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:16px}.pqtp-top-actions{display:flex;align-items:flex-start;justify-content:flex-end;gap:8px;flex-wrap:wrap}.pqtp-grid{display:grid;grid-template-columns:360px 1fr;gap:14px}.pqtp-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:14px}.pqtp-field{margin-bottom:10px}.pqtp-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqtp-input,.pqtp-select,.pqtp-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqtp-textarea{min-height:68px}.pqtp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqtp-btn--light{background:#f7fbf8;color:#173044}.pqtp-table{width:100%;border-collapse:collapse}.pqtp-table th,.pqtp-table td{border-bottom:1px solid #e7eee8;padding:8px;text-align:left;vertical-align:top}.pqtp-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqtp-muted{color:#617064;font-size:12px}.pqtp-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqtp-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqtp-grid,.pqtp-top{display:block}.pqtp-top-actions{justify-content:flex-start;margin-top:12px}.pqtp-panel{margin-bottom:12px}}</style>';
echo '<div class="pqtp"><div class="pqtp-top"><div><h2>Teacher Portal</h2><div class="pqtp-muted">' . s($workspace->name) . ' today\'s classes, roster, attendance, grade entry, notes, homework, and progress updates.</div></div><div class="pqtp-top-actions"><a class="pqtp-btn pqtp-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a><button class="pqtp-btn pqtp-btn--light" type="button" data-pq-support-action="open">Open Support</button><button class="pqtp-btn" type="button" data-pq-support-action="new">New Request</button></div></div>';
if ($notice !== '') { echo '<div class="pqtp-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqtp-error">' . s($error) . '</div>'; }
echo '<div class="pqtp-grid"><section class="pqtp-panel"><h3>Attendance Entry</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="attendance"><div class="pqtp-field"><label>Class</label><select class="pqtp-select" name="sessionid">';
foreach ($sessions as $session) { echo '<option value="' . (int)$session->id . '">' . s($session->title . ' / ' . userdate((int)$session->scheduled_start)) . '</option>'; }
echo '</select></div><div class="pqtp-field"><label>Student</label><select class="pqtp-select" name="studentid">';
foreach ($roster as $student) { echo '<option value="' . (int)$student->studentid . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqtp-field"><label>Attendance</label><select class="pqtp-select" name="attendance_status"><option value="present">Present</option><option value="late">Late</option><option value="excused">Excused</option><option value="absent">Absent</option><option value="makeup">Make-up</option></select></div><div class="pqtp-field"><label>Participation</label><input class="pqtp-input" name="participation_status" value="engaged"></div><div class="pqtp-field"><label><input type="checkbox" name="technical_issue" value="1"> Technical issue</label></div><div class="pqtp-field"><label>Notes</label><textarea class="pqtp-textarea" name="notes"></textarea></div><button class="pqtp-btn">Save Attendance</button></form><hr><h3>Notes / Homework</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="note"><div class="pqtp-field"><label>Class</label><select class="pqtp-select" name="sessionid">';
foreach ($sessions as $session) { echo '<option value="' . (int)$session->id . '">' . s($session->title) . '</option>'; }
echo '</select></div><div class="pqtp-field"><label>Student</label><select class="pqtp-select" name="studentid">';
foreach ($roster as $student) { echo '<option value="' . (int)$student->studentid . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div>';
foreach ([['strengths','Strengths'],['needs_practice','Needs practice'],['homework','Homework'],['parent_summary','Parent summary'],['private_note','Private note']] as $field) { echo '<div class="pqtp-field"><label>' . s($field[1]) . '</label><textarea class="pqtp-textarea" name="' . s($field[0]) . '"></textarea></div>'; }
echo '<div class="pqtp-field"><label>Homework due date</label><input class="pqtp-input" name="homework_due_date"></div><div class="pqtp-field"><label><input type="checkbox" name="visible_to_parent" value="1" checked> Parent visible</label></div><button class="pqtp-btn">Save Notes</button></form></section><section class="pqtp-panel"><h3>Today\'s Classes</h3><table class="pqtp-table"><thead><tr><th>Class</th><th>Time</th><th>Roster</th></tr></thead><tbody>';
foreach ($sessions as $session) { echo '<tr><td><strong>' . s($session->title) . '</strong><div class="pqtp-muted">' . s($session->status) . '</div></td><td>' . s(userdate((int)$session->scheduled_start)) . '</td><td><span class="pqtp-pill">' . (int)$session->roster_count . ' students</span></td></tr>'; }
if (!$sessions) { echo '<tr><td colspan="3" class="pqtp-muted">No classes scheduled today.</td></tr>'; }
echo '</tbody></table><h3>Student Roster</h3><table class="pqtp-table"><thead><tr><th>Student</th><th>Actions</th></tr></thead><tbody>';
foreach ($roster as $student) { echo '<tr><td><strong>' . s(fullname($student)) . '</strong><div class="pqtp-muted">' . s($student->email) . '</div></td><td><a class="pqtp-btn pqtp-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_student.php', ['workspaceid' => $workspaceid, 'studentid' => (int)$student->studentid]))->out(false) . '">Profile</a></td></tr>'; }
if (!$roster) { echo '<tr><td colspan="2" class="pqtp-muted">No assigned students found.</td></tr>'; }
echo '</tbody></table><h3>Grade / Assessment Entry</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="grade"><div class="pqtp-field"><label>Assessment</label><select class="pqtp-select" name="assessmentid">';
foreach ($assessments as $assessment) { echo '<option value="' . (int)$assessment->id . '">' . s($assessment->title . ' / ' . $assessment->assessment_type) . '</option>'; }
echo '</select></div><div class="pqtp-field"><label>Student</label><select class="pqtp-select" name="studentid">';
foreach ($roster as $student) { echo '<option value="' . (int)$student->studentid . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqtp-field"><label>Offering ID</label><input class="pqtp-input" name="offeringid"></div><div class="pqtp-field"><label>Score points</label><input class="pqtp-input" name="score_points"></div><div class="pqtp-field"><label>Score percent</label><input class="pqtp-input" name="score_percent"></div><div class="pqtp-field"><label>Letter grade</label><input class="pqtp-input" name="letter_grade"></div><div class="pqtp-field"><label>Status</label><select class="pqtp-select" name="status"><option value="reviewed">Reviewed</option><option value="published">Published</option><option value="draft">Draft</option></select></div><div class="pqtp-field"><label>Feedback</label><textarea class="pqtp-textarea" name="teacher_feedback"></textarea></div><button class="pqtp-btn">Save Grade</button></form><hr><h3>Progress Update</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="progress"><div class="pqtp-field"><label>Student</label><select class="pqtp-select" name="studentid">';
foreach ($roster as $student) { echo '<option value="' . (int)$student->studentid . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div>';
foreach ([['current_level','Current level'],['placement_level','Placement level'],['advancement_status','Advancement status'],['recommended_course_key','Recommended next course'],['recommendation_reason','Recommendation reason'],['teacher_comment','Teacher comment']] as $field) { echo '<div class="pqtp-field"><label>' . s($field[1]) . '</label><input class="pqtp-input" name="' . s($field[0]) . '"></div>'; }
echo '<button class="pqtp-btn">Save Progress</button></form></section></div></div>';
echo '<script>(function(){function text(value){return (value||"").replace(/\\s+/g," ").trim();}function fieldLabel(control){var id=control.getAttribute("id");if(id){var explicit=document.querySelector("label[for=\\"" + id.replace(/"/g,"\\\\\\"") + "\\"]");if(explicit){return text(explicit.textContent);}}var wrapped=control.closest("label");if(wrapped){return text(wrapped.textContent);}var field=control.closest(".pqtp-field");if(field){var label=field.querySelector("label");if(label){return text(label.textContent);}}var name=control.getAttribute("name")||control.getAttribute("value")||control.tagName.toLowerCase();return text(name.replace(/[_-]+/g," "));}document.querySelectorAll(".pqtp input:not([type=hidden]):not([type=submit]):not([type=button]),.pqtp select,.pqtp textarea").forEach(function(control){if(text(control.getAttribute("aria-label"))||text(control.getAttribute("aria-labelledby"))){return;}var label=fieldLabel(control);if(label){control.setAttribute("aria-label",label);}});}());</script>';
echo pqh_embedded_support_html($workspaceid, (int)$USER->id, (int)$USER->id, 'student_helpdesk', pqh_current_consumer_context());
echo $OUTPUT->footer();
