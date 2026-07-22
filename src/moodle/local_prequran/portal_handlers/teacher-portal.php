<?php
// ---- report: teacher-portal (teacher daily entry hub; read + 4 writes) -------
// Ported from local_hubredirect/teacher_portal.php via teacher_portal_portallib
// (pqtp_ -> pqtprl_). Included from portal_data.php AFTER token auth: $claims
// verified, $USER set to the token user, JSON exception handler installed,
// headers sent. The legacy page stays live in parallel and is untouched.
// (teacher_portal.php has no pqh_live_security_audit calls — none to keep.)
// GET  = today's classes, the teacher's active roster, workspace assessments,
//        and the page's link hub.
// POST = do=attendance | note | grade | progress — the page's four action
//        branches VERBATIM (same tables, same field defaults, same parent
//        notifications and low-score alert). require_sesskey dropped: token
//        auth replaces the session key. The legacy try/catch that rendered
//        $e->getMessage() inline becomes a 400 JSON failure.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/gradebook_progresslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_portal_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// ---- Access: exact legacy gate (teacher_portal.php lines 10-14) --------------
$requestedworkspaceid = $ispost ? (int)($body['workspaceid'] ?? 0) : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability($userid, $workspaceid, 'teacher.portal')) {
    pqpd_fail(403, 'Teacher portal requires teacher workspace access.');
}
// Legacy uses MUST_EXIST here; a missing row becomes a 403 JSON failure instead
// of a Moodle exception page.
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'The selected teaching workspace was not found.');
}

if ($ispost) {
    $do = (string)($body['do'] ?? '');
    // JSON-body equivalents of the page's optional_param reads (same PARAM
    // types and defaults as the legacy action block).
    $bint = static function (string $key, int $default = 0) use ($body): int {
        return array_key_exists($key, $body) ? (int)$body[$key] : $default;
    };
    $bclean = static function (string $key, string $default, string $paramtype) use ($body): string {
        return clean_param(array_key_exists($key, $body) ? (string)$body[$key] : $default, $paramtype);
    };
    try {
        $now = time();
        // -- write: attendance (legacy action=attendance, verbatim) ------------
        if ($do === 'attendance') {
            $sessionid = $bint('sessionid');
            $studentid = $bint('studentid');
            $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$session->teacherid !== $userid && !pqh_user_can_manage_workspace($userid, $workspaceid)) {
                throw new invalid_parameter_exception('You can only mark attendance for your own classes.');
            }
            $existing = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'sessionid' => $sessionid,
                'userid' => $studentid,
                'studentid' => $studentid,
                'join_time' => $bclean('attendance_status', 'present', PARAM_ALPHANUMEXT) === 'absent' ? 0 : $now,
                'leave_time' => 0,
                'attendance_status' => $bclean('attendance_status', 'present', PARAM_ALPHANUMEXT),
                'participation_status' => $bclean('participation_status', 'engaged', PARAM_ALPHANUMEXT),
                'technical_issue' => $bint('technical_issue') ? 1 : 0,
                'notes' => $bclean('notes', '', PARAM_TEXT),
                'markedby' => $userid,
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
            pqtprl_notify_parent_update(
                $workspaceid,
                $sessionid,
                $studentid,
                'Attendance recorded',
                'Attendance was recorded for class "' . (string)$session->title . '" with status ' . (string)$record->attendance_status . '.',
                'attendance_recorded'
            );
            echo json_encode(['ok' => true, 'message' => 'Attendance saved.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        // -- write: note (legacy action=note, verbatim) ------------------------
        if ($do === 'note') {
            $sessionid = $bint('sessionid');
            $studentid = $bint('studentid');
            $existing = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'sessionid' => $sessionid,
                'studentid' => $studentid,
                'teacherid' => $userid,
                'strengths' => $bclean('strengths', '', PARAM_TEXT),
                'needs_practice' => $bclean('needs_practice', '', PARAM_TEXT),
                'homework' => $bclean('homework', '', PARAM_TEXT),
                'homework_lessonid' => $bclean('homework_lessonid', '', PARAM_TEXT),
                'homework_unitid' => $bclean('homework_unitid', '', PARAM_TEXT),
                'homework_due_date' => $bclean('homework_due_date', '', PARAM_TEXT) !== '' ? strtotime($bclean('homework_due_date', '', PARAM_TEXT) . ' 00:00:00') : 0,
                'homework_priority' => $bclean('homework_priority', 'normal', PARAM_ALPHANUMEXT),
                'parent_summary' => $bclean('parent_summary', '', PARAM_TEXT),
                'private_note' => $bclean('private_note', '', PARAM_TEXT),
                'visible_to_parent' => $bint('visible_to_parent', 1) ? 1 : 0,
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
            echo json_encode(['ok' => true, 'message' => 'Notes, homework, and parent progress update saved.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        // -- write: grade (legacy action=grade, verbatim incl. low-score alert)
        if ($do === 'grade') {
            if (!pqh_table_exists_safe('local_prequran_grade')) {
                throw new invalid_parameter_exception('Grade table is not ready.');
            }
            $assessmentid = $bint('assessmentid');
            $studentid = $bint('studentid');
            $existing = $DB->get_record('local_prequran_grade', ['assessmentid' => $assessmentid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $score = $bclean('score_percent', '0', PARAM_TEXT);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'offeringid' => $bint('offeringid'),
                'assessmentid' => $assessmentid,
                'studentid' => $studentid,
                'score_points' => $bclean('score_points', $score, PARAM_TEXT),
                'score_percent' => $score,
                'letter_grade' => $bclean('letter_grade', '', PARAM_TEXT),
                'status' => $bclean('status', 'reviewed', PARAM_ALPHANUMEXT),
                'teacher_feedback' => $bclean('teacher_feedback', '', PARAM_TEXT),
                'rubric_json' => pqgp_json(['teacher_portal' => 1]),
                'gradedby' => $userid,
                'gradedat' => $now,
                'reviewedby' => $userid,
                'reviewedat' => $now,
                'publishedby' => $bclean('status', 'reviewed', PARAM_ALPHANUMEXT) === 'published' ? $userid : 0,
                'publishedat' => $bclean('status', 'reviewed', PARAM_ALPHANUMEXT) === 'published' ? $now : 0,
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
                pqtprl_notify_parent_update(
                    $workspaceid,
                    0,
                    $studentid,
                    'Grade published',
                    'A grade has been published. Score: ' . $score . '%. ' . (string)$record->teacher_feedback,
                    'grade_published'
                );
                if ($scorefloat > 0 && $scorefloat < 70) {
                    pqtprl_notify_parent_update(
                        $workspaceid,
                        0,
                        $studentid,
                        'Low score alert',
                        'A published score needs support. Score: ' . $score . '%. Please review the teacher feedback.',
                        'low_score_alert'
                    );
                }
            }
            echo json_encode(['ok' => true, 'message' => 'Assessment grade saved.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        // -- write: progress (legacy action=progress, verbatim) ----------------
        if ($do === 'progress') {
            if (!pqh_table_exists_safe('local_prequran_student_path')) {
                throw new invalid_parameter_exception('Student path table is not ready.');
            }
            $studentid = $bint('studentid');
            $existing = $DB->get_record('local_prequran_student_path', ['workspaceid' => $workspaceid, 'studentid' => $studentid], '*', IGNORE_MISSING);
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'current_level' => $bclean('current_level', '', PARAM_TEXT),
                'placement_level' => $bclean('placement_level', '', PARAM_TEXT),
                'advancement_status' => $bclean('advancement_status', 'on_track', PARAM_ALPHANUMEXT),
                'recommended_course_key' => $bclean('recommended_course_key', '', PARAM_TEXT),
                'recommendation_reason' => $bclean('recommendation_reason', '', PARAM_TEXT),
                'teacher_comment' => $bclean('teacher_comment', '', PARAM_TEXT),
                'reviewedby' => $userid,
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
            echo json_encode(['ok' => true, 'message' => 'Student progress updated.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    pqpd_fail(400, 'Unknown teacher-portal action.');
}

// ---- GET: the page's data block (teacher_portal.php lines 203-231, verbatim) -
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
    ['workspaceid' => $workspaceid, 'teacherid' => $userid, 'start' => $todaystart, 'end' => $tomorrow, 'cancelled' => 'cancelled'],
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
    ['workspaceid' => $workspaceid, 'teacherid' => $userid, 'status' => 'active'],
    0,
    120
)) : [];
$assessments = pqh_table_exists_safe('local_prequran_assessment') ? array_values($DB->get_records('local_prequran_assessment', ['workspaceid' => $workspaceid], 'duedate DESC, id DESC', '*', 0, 80)) : [];

// Decorate for the client (names/labels the page computes inline; the student
// profile page stays a legacy Moodle URL).
$sessionsout = [];
foreach ($sessions as $session) {
    $sessionsout[] = [
        'id' => (int)$session->id,
        'title' => (string)$session->title,
        'status' => (string)$session->status,
        'scheduled_start' => (int)$session->scheduled_start,
        'roster_count' => (int)$session->roster_count,
    ];
}
$rosterout = [];
foreach ($roster as $student) {
    $rosterout[] = [
        'studentid' => (int)$student->studentid,
        'name' => fullname($student),
        'email' => (string)$student->email,
        'profileurl' => (new moodle_url('/local/hubredirect/workspace_student.php', ['workspaceid' => $workspaceid, 'studentid' => (int)$student->studentid]))->out(false),
    ];
}
$assessmentsout = [];
foreach ($assessments as $assessment) {
    $assessmentsout[] = [
        'id' => (int)$assessment->id,
        'title' => (string)$assessment->title,
        'assessment_type' => (string)$assessment->assessment_type,
        'duedate' => (int)($assessment->duedate ?? 0),
    ];
}

// Link hub: the page's top-nav "Workspace" action — workspace_dashboard.php is
// already migrated as report=workspace-dashboard, so it goes through
// portal_launch (the embedded support widget stays a legacy-page feature).
$links = [
    [
        'title' => 'Workspace',
        'desc' => 'Your workspace dashboard.',
        'url' => $CFG->wwwroot . '/local/prequran/portal_launch.php?report=workspace-dashboard&workspaceid=' . $workspaceid,
    ],
];

echo json_encode([
    'ok' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'sessions' => $sessionsout,
    'roster' => $rosterout,
    'assessments' => $assessmentsout,
    'links' => $links,
], JSON_UNESCAPED_SLASHES);
exit;
