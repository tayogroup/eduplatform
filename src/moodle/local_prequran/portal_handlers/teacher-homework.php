<?php
// ---- report: teacher-homework (teacher homework assign / review / archive) ---
// Ported from local_hubredirect/teacher_homework.php. The page defines no
// inline functions: every pqhh_* helper lives in the shared homeworklib.php
// (also used by student_homework.php), so that lib is required at runtime and
// never copied — teacher_homework_portallib.php documents this and stays
// guard-only. Included from portal_data.php AFTER token auth: $claims
// verified, $USER set to the token user, JSON exception handler installed,
// headers sent. The legacy page stays live in parallel and is untouched.
// GET  = everything the page renders: teacher courses/students/groups,
//        active workspace course materials, and every published-homework
//        submission row (title, course, student, due date, status, response,
//        score/feedback) in the page's exact ordering.
// POST = do=create | review | archive — the page's three sesskey'd actions
//        VERBATIM (confirm_sesskey dropped: token auth replaces the session
//        key; the page's $notice banner becomes {"ok":true,"message":...} and
//        its caught-Throwable $error banner becomes a 400 JSON failure).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/homeworklib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_homework_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// ---- Access + workspace resolution (teacher_homework.php lines 8-18) ---------
// Same order and outcomes as the legacy ENTRY check; pqh_access_denied()
// redirects become 403 JSON failures with the page's exact messages.
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && isset($body['workspaceid'])) {
    $requestedworkspaceid = (int)$body['workspaceid'];
}
$workspaceid = pqhh_resolve_teacher_workspace_id($userid, $requestedworkspaceid, $consumercontext);
if ($workspaceid <= 0 || !pqhh_user_can_assign($userid, $workspaceid)) {
    pqpd_fail(403, 'Choose a teacher workspace before opening Homework.');
}
if (!pqhh_ready()) {
    pqpd_fail(403, 'Homework is waiting for the EduPlatform database upgrade.');
}

// ---- Same working set the page builds before acting (lines 20-43) ------------
$students = pqhh_teacher_students($userid, $workspaceid);
$studentmap = [];
$studentcourseids = [];
foreach ($students as $student) {
    $studentmap[(int)$student->id] = $student;
    $studentcourseids[(int)$student->id] = array_map('intval', array_keys(pqh_user_moodle_enrolment_courses((int)$student->id)));
}
$courses = pqhh_teacher_courses($students);
$groups = pqhh_teacher_groups($userid, $workspaceid, $students);
$groupmap = [];
foreach ($groups as $group) {
    $groupmap[(int)$group->id] = $group;
    $group->courseids = [];
    foreach ((array)$group->studentids as $groupstudentid) {
        foreach (($studentcourseids[(int)$groupstudentid] ?? []) as $groupcourseid) {
            $group->courseids[(int)$groupcourseid] = (int)$groupcourseid;
        }
    }
}
$coursematerials = pqh_table_exists_safe('local_prequran_workspace_material')
    ? array_values($DB->get_records('local_prequran_workspace_material', [
        'workspaceid' => $workspaceid, 'status' => 'active',
    ], 'title ASC, timemodified DESC', 'id,title,material_type,createdby,workspaceid'))
    : [];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $do = (string)($body['do'] ?? '');
    if (!in_array($do, ['create', 'review', 'archive'], true)) {
        pqpd_fail(400, 'Unknown teacher-homework action.');
    }
    // The page wraps every action in try/catch and shows $e->getMessage() as
    // its inline error banner — same messages, delivered as 400 JSON.
    try {
        // -- write: create (legacy action=create, verbatim; lines 50-119) ------
        if ($do === 'create') {
            $courseid = (int)($body['courseid'] ?? 0);
            $title = trim(clean_param((string)($body['title'] ?? ''), PARAM_TEXT));
            $instructions = trim(clean_param((string)($body['instructions'] ?? ''), PARAM_RAW_TRIMMED));
            $maxpoints = (float)($body['maxpoints'] ?? 0);
            $dueinput = trim(clean_param((string)($body['duedate'] ?? ''), PARAM_TEXT));
            $targettype = clean_param((string)($body['target_type'] ?? 'course'), PARAM_ALPHA);
            $targetgroupid = (int)($body['target_groupid'] ?? 0);
            $resourcematerialid = (int)($body['resourcematerialid'] ?? 0);
            $selected = array_values(array_unique(array_map('intval', (array)($body['studentids'] ?? []))));
            if (!isset($courses[$courseid]) || $title === '' || $maxpoints <= 0
                    || !in_array($targettype, ['course', 'group', 'individual'], true)) {
                throw new invalid_parameter_exception('Choose a course, assignment type, title, and points.');
            }
            if ($resourcematerialid > 0 && !$DB->record_exists('local_prequran_workspace_material', [
                    'id' => $resourcematerialid, 'workspaceid' => $workspaceid, 'status' => 'active'])) {
                throw new invalid_parameter_exception('The selected course material is not available in this workspace.');
            }
            $eligible = [];
            foreach (array_keys($studentmap) as $studentid) {
                if (isset($studentmap[$studentid]) && pqhh_user_enrolled_in_course($studentid, $courseid)) {
                    $eligible[$studentid] = $studentid;
                }
            }
            if ($targettype === 'course') {
                $validstudents = array_values($eligible);
                $targetid = $courseid;
            } elseif ($targettype === 'group') {
                if (!isset($groupmap[$targetgroupid])) {
                    throw new invalid_parameter_exception('Choose a valid student group.');
                }
                $validstudents = array_values(array_intersect(
                    array_map('intval', array_values((array)$groupmap[$targetgroupid]->studentids)),
                    array_values($eligible)
                ));
                $targetid = $targetgroupid;
            } else {
                $validstudents = array_values(array_intersect($selected, array_values($eligible)));
                $targetid = 0;
            }
            if (!$validstudents) {
                throw new invalid_parameter_exception('No eligible students were found for this course and assignment type.');
            }
            $duedate = $dueinput !== '' ? (int)strtotime($dueinput) : 0;
            $offering = pqhh_course_offering($workspaceid, $courseid);
            $now = time();
            $transaction = $DB->start_delegated_transaction();
            $homeworkid = (int)$DB->insert_record('local_prequran_homework', (object)[
                'consumerid' => pqhh_consumer_id($consumercontext), 'workspaceid' => $workspaceid,
                'moodlecourseid' => $courseid, 'offeringid' => (int)($offering->id ?? 0), 'assessmentid' => 0,
                'resourcematerialid' => $resourcematerialid, 'target_type' => $targettype, 'targetid' => $targetid,
                'title' => $title, 'instructions' => $instructions, 'duedate' => $duedate,
                'maxpoints' => rtrim(rtrim(number_format($maxpoints, 2, '.', ''), '0'), '.'),
                'allowresubmit' => clean_param((string)($body['allowresubmit'] ?? 0), PARAM_BOOL) ? 1 : 0, 'status' => 'published',
                'createdby' => (int)$USER->id, 'timecreated' => $now, 'timemodified' => $now,
            ]);
            foreach ($validstudents as $studentid) {
                $DB->insert_record('local_prequran_homework_sub', (object)[
                    'homeworkid' => $homeworkid, 'consumerid' => pqhh_consumer_id($consumercontext),
                    'workspaceid' => $workspaceid, 'studentid' => $studentid, 'status' => 'assigned',
                    'attemptnumber' => 0, 'response_text' => '', 'materialid' => 0, 'startedat' => 0,
                    'submittedat' => 0, 'scorepoints' => '', 'scorepercent' => '', 'feedback' => '',
                    'gradedby' => 0, 'gradedat' => 0, 'timecreated' => $now, 'timemodified' => $now,
                ]);
                pqhh_assign_resource_material($workspaceid, $resourcematerialid, $studentid, (int)$USER->id);
            }
            $homework = $DB->get_record('local_prequran_homework', ['id' => $homeworkid], '*', MUST_EXIST);
            pqhh_ensure_assessment($homework);
            $transaction->allow_commit();
            $notice = 'Homework assigned to ' . count($validstudents) . ' student' . (count($validstudents) === 1 ? '' : 's') . '.';
            echo json_encode([
                'ok' => true,
                'message' => $notice,
                'homeworkid' => $homeworkid,
                'assigned' => count($validstudents),
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: review (legacy action=review, verbatim; lines 120-159) -----
        if ($do === 'review') {
            $submissionid = (int)($body['submissionid'] ?? 0);
            $decision = clean_param((string)($body['decision'] ?? ''), PARAM_ALPHA);
            $submission = $DB->get_record('local_prequran_homework_sub', ['id' => $submissionid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $homework = $DB->get_record('local_prequran_homework', ['id' => (int)$submission->homeworkid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$homework->createdby !== (int)$USER->id && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
                throw new required_capability_exception(context_system::instance(), 'moodle/site:config', 'nopermissions', '');
            }
            if (!in_array((string)$submission->status, ['submitted', 'graded'], true)) {
                throw new invalid_parameter_exception('Only submitted homework can be reviewed.');
            }
            $feedback = trim(clean_param((string)($body['feedback'] ?? ''), PARAM_RAW_TRIMMED));
            $now = time();
            if ($decision === 'return') {
                if ($feedback === '') {
                    throw new invalid_parameter_exception('Add feedback explaining what the student should revise.');
                }
                $submission->status = 'returned';
                $submission->feedback = $feedback;
                $submission->gradedby = (int)$USER->id;
                $submission->gradedat = $now;
            } elseif ($decision === 'grade') {
                $score = (float)($body['scorepoints'] ?? 0);
                $maximum = max(0.01, (float)$homework->maxpoints);
                if ($score < 0 || $score > $maximum) {
                    throw new invalid_parameter_exception('The score must be between 0 and ' . $maximum . '.');
                }
                $submission->status = 'graded';
                $submission->scorepoints = rtrim(rtrim(number_format($score, 2, '.', ''), '0'), '.');
                $submission->scorepercent = number_format(($score / $maximum) * 100, 2, '.', '');
                $submission->feedback = $feedback;
                $submission->gradedby = (int)$USER->id;
                $submission->gradedat = $now;
                pqhh_publish_grade($homework, $submission, (int)$USER->id);
            } else {
                throw new invalid_parameter_exception('Unknown review decision.');
            }
            $submission->timemodified = $now;
            $DB->update_record('local_prequran_homework_sub', $submission);
            $notice = $decision === 'grade' ? 'Homework graded.' : 'Homework returned for revision.';
            echo json_encode([
                'ok' => true,
                'message' => $notice,
                'submissionid' => $submissionid,
                'decision' => $decision,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: archive (legacy action=archive, verbatim; lines 160-167) ---
        if ($do === 'archive') {
            $homeworkid = (int)($body['homeworkid'] ?? 0);
            $homework = $DB->get_record('local_prequran_homework', ['id' => $homeworkid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$homework->createdby !== (int)$USER->id && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
                throw new invalid_parameter_exception('You cannot archive this homework.');
            }
            $DB->set_field('local_prequran_homework', 'status', 'archived', ['id' => $homeworkid]);
            echo json_encode([
                'ok' => true,
                'message' => 'Homework archived.',
                'homeworkid' => $homeworkid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// ---- GET: the submissions the page renders (lines 174-186, verbatim SQL) -----
$rows = array_values($DB->get_records_sql(
    "SELECT s.*, h.title, h.instructions, h.duedate, h.maxpoints, h.moodlecourseid,
            c.fullname AS coursename, u.firstname, u.lastname, u.idnumber
       FROM {local_prequran_homework_sub} s
       JOIN {local_prequran_homework} h ON h.id = s.homeworkid
       JOIN {course} c ON c.id = h.moodlecourseid
       JOIN {user} u ON u.id = s.studentid
      WHERE h.workspaceid = :workspaceid AND h.status = :status
        AND (h.createdby = :teacherid OR :canmanage = 1)
   ORDER BY CASE WHEN s.status = 'submitted' THEN 0 ELSE 1 END, h.duedate ASC, h.id DESC, u.firstname",
    ['workspaceid' => $workspaceid, 'status' => 'published', 'teacherid' => (int)$USER->id,
        'canmanage' => pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) ? 1 : 0]
));

$nameids = [$userid];
foreach ($students as $student) {
    $nameids[] = (int)$student->id;
}
foreach ($rows as $row) {
    $nameids[] = (int)$row->studentid;
    $nameids[] = (int)$row->gradedby;
}
$names = pqpd_names($nameids);

$coursesout = [];
foreach ($courses as $courseid => $course) {
    $coursesout[] = ['id' => (int)$courseid, 'title' => (string)$course['title']];
}
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = [
        'id' => (int)$student->id,
        'name' => $names[(int)$student->id] ?? ('Student ' . (int)$student->id),
        'idnumber' => (string)$student->idnumber,
        'courseids' => array_values(array_map('intval', $studentcourseids[(int)$student->id] ?? [])),
    ];
}
$groupsout = [];
foreach ($groups as $group) {
    $groupsout[] = [
        'id' => (int)$group->id,
        'title' => (string)$group->title,
        'studentids' => array_values(array_map('intval', (array)$group->studentids)),
        'courseids' => array_values(array_map('intval', (array)$group->courseids)),
    ];
}
$materialsout = [];
foreach ($coursematerials as $material) {
    $materialsout[] = [
        'id' => (int)$material->id,
        'title' => (string)$material->title,
        'material_type' => (string)$material->material_type,
    ];
}
// Decorate rows for the client (status label, display name, due-date label,
// attached-material link — the same values the page renders inline).
foreach ($rows as $row) {
    $row->status_label = pqhh_status_label((string)$row->status);
    $row->studentname = $names[(int)$row->studentid] ?? trim((string)$row->firstname . ' ' . (string)$row->lastname);
    $row->duedate_label = (int)$row->duedate > 0 ? userdate((int)$row->duedate, '%d %b %Y, %H:%M') : '';
    $row->material_url = (int)$row->materialid > 0
        ? $CFG->wwwroot . '/local/hubredirect/office_material_file.php?workspaceid=' . $workspaceid . '&materialid=' . (int)$row->materialid
        : '';
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'canmanage' => pqh_user_can_manage_workspace($userid, $workspaceid),
    'courses' => $coursesout,
    'students' => $studentsout,
    'groups' => $groupsout,
    'materials' => $materialsout,
    'rows' => $rows,
    'names' => $names,
], JSON_UNESCAPED_SLASHES);
exit;
