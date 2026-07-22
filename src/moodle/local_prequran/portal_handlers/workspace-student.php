<?php
// ---- report: workspace-student (per-student detail within a workspace) --------
// Ported from local_hubredirect/workspace_student.php via
// workspace_student_portallib (pqws_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the full student-profile state the legacy page renders (student +
//        profile, teachers, guardians, live consent, attendance, notes, lesson
//        and quiz progress, assigned materials) decorated with the server-side
//        labels (fullname/account No.) plus a names map.
// POST = do=update_material_status — the legacy action=update_material_status
//        write VERBATIM (same "only the assigned student" guard, workflow
//        whitelist, timestamps and teacher notification). confirm_sesskey()
//        dropped: token auth replaces it.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_student_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- workspace + student resolution and entry access check: same order and
// -- messages as the legacy page. Each pqh_access_denied() becomes pqpd_fail(403).
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$studentid = $ispost
    ? (int)($body['studentid'] ?? 0)
    : optional_param('studentid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);

if ($workspaceid <= 0 || $studentid <= 0) {
    pqpd_fail(403, 'A workspace and student are required to view this profile.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'The selected teaching workspace was not found.');
}
if (!pqws_student_in_workspace($workspaceid, $studentid) || !pqws_user_can_view_student($userid, $workspaceid, $studentid)) {
    pqpd_fail(403, 'This student is not available in the selected workspace for your account.');
}

if ($ispost) {
    // Legacy caught every write error and rendered it as the page alert — here
    // the same message text is delivered as JSON. Only one action existed.
    $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    if ($do !== 'update_material_status') {
        pqpd_fail(400, 'Unknown workspace-student action.');
    }
    try {
        // -- write: update_material_status (legacy action=update_material_status,
        // -- verbatim). The verbatim pqws_ function reads assignmentid/workflow
        // -- via optional_param; bridge the JSON body into the param source so the
        // -- function body stays byte-for-byte identical to the page.
        $_POST['assignmentid'] = (int)($body['assignmentid'] ?? 0);
        $_POST['workflow_status'] = clean_param((string)($body['workflow_status'] ?? ''), PARAM_ALPHANUMEXT);
        pqws_update_own_material_status($workspaceid, $studentid);
        $message = 'Material progress updated.';
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the student profile exactly as the legacy page builds it --------------
$studentuser = core_user::get_user($studentid, 'id,firstname,lastname,email,username,idnumber', IGNORE_MISSING);
if (!$studentuser) {
    pqpd_fail(403, 'The selected student account was not found.');
}
$profile = pqws_student_profile($studentid);
$studentname = $profile && trim((string)($profile->student_display_name ?? '')) !== '' ? (string)$profile->student_display_name : fullname($studentuser);
$teachers = pqws_assigned_teachers($workspaceid, $studentid);
$guardians = pqws_guardians($workspaceid, $studentid);
$consents = pqws_consent_rows($workspaceid, $studentid);
$attendance = pqws_attendance_summary($workspaceid, $studentid);
$notes = pqws_recent_notes($workspaceid, $studentid);
$quiz = pqws_quiz_summary($studentid);
$lessons = pqws_lesson_summary($studentid);
$materials = pqws_assigned_materials($workspaceid, $studentid);
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$canteach = pqh_user_can_teach_in_workspace($userid, $workspaceid);
$isself = $userid === $studentid;
$workflowstatuses = pqws_material_workflow_statuses();

// Decorate rows with the server-side labels the page renders inline
// (fullname() and pqh_account_no_label() are PHP-only).
$teachersout = [];
foreach ($teachers as $teacher) {
    $teachersout[] = [
        'userid' => (int)$teacher->id,
        'fullname' => fullname($teacher),
        'account_label' => pqh_account_no_label($teacher),
        'email' => (string)($teacher->email ?? ''),
        'assignedat' => (int)($teacher->assignedat ?? 0),
    ];
}
$guardiansout = [];
foreach ($guardians as $guardian) {
    $guardiansout[] = [
        'userid' => (int)$guardian->id,
        'fullname' => fullname($guardian),
        'account_label' => pqh_account_no_label($guardian),
        'email' => (string)($guardian->email ?? ''),
    ];
}
$consentsout = [];
foreach ($consents as $consent) {
    $consentsout[] = [
        'id' => (int)($consent->id ?? 0),
        'consent_type' => (string)($consent->consent_type ?? ''),
        'guardianid' => (int)($consent->guardianid ?? 0),
        'guardian_name' => pqws_user_name((int)($consent->guardianid ?? 0)),
        'granted' => !empty($consent->granted),
        'timemodified' => (int)($consent->timemodified ?? 0),
    ];
}
$attendanceout = [];
foreach ($attendance['recent'] as $row) {
    $attendanceout[] = [
        'sessionid' => (int)($row->sessionid ?? 0),
        'attendance_status' => (string)($row->attendance_status ?? ''),
        'participation_status' => (string)($row->participation_status ?? ''),
        'timemodified' => (int)($row->timemodified ?? $row->join_time ?? 0),
    ];
}
$notesout = [];
foreach ($notes as $note) {
    $notesout[] = [
        'sessionid' => (int)($note->sessionid ?? 0),
        'teacherid' => (int)($note->teacherid ?? 0),
        'teacher_name' => pqws_user_name((int)($note->teacherid ?? 0)),
        'timemodified' => (int)($note->timemodified ?? 0),
        'followup_status' => (string)($note->followup_status ?? ''),
        'strengths' => (string)($note->strengths ?? ''),
        'needs_practice' => (string)($note->needs_practice ?? ''),
        'homework' => (string)($note->homework ?? ''),
    ];
}
$lessonsout = [];
foreach ($lessons['recent'] as $row) {
    $lessonsout[] = [
        'lessonid' => (string)($row->lessonid ?? ''),
        'unitid' => (string)($row->unitid ?? ''),
        'overall_status' => (string)($row->overall_status ?? ''),
        'overall_percent' => isset($row->overall_percent) ? (int)$row->overall_percent : null,
        'timemodified' => (int)($row->overall_lastactivity ?? $row->timemodified ?? 0),
    ];
}
$quizout = [];
foreach ($quiz['recent'] as $row) {
    $quizout[] = [
        'quizid' => (string)($row->quizid ?? ''),
        'lessonid' => (string)($row->lessonid ?? ''),
        'unitid' => (string)($row->unitid ?? ''),
        'status' => (string)($row->status ?? ''),
        'percent' => isset($row->percent) ? (int)$row->percent : null,
        'timemodified' => (int)($row->last_activity_at ?? $row->timemodified ?? 0),
    ];
}
$materialsout = [];
foreach ($materials as $material) {
    $workflow = (string)($material->workflow_status ?? 'assigned');
    $canupdate = $isself && in_array($workflow, ['assigned', 'in_progress'], true);
    $materialsout[] = [
        'id' => (int)$material->id,
        'title' => (string)$material->title,
        'course_key' => (string)($material->course_key ?? ''),
        'material_type' => (string)$material->material_type,
        'source_url' => (string)($material->source_url ?? ''),
        'workflow_status' => $workflow,
        'workflow_label' => $workflowstatuses[$workflow] ?? 'Assigned',
        'timemodified' => (int)$material->timemodified,
        'can_update' => $canupdate,
        'can_start' => $canupdate && $workflow === 'assigned',
    ];
}

$nameids = [];
foreach ($consents as $consent) {
    $nameids[] = (int)($consent->guardianid ?? 0);
}
foreach ($notes as $note) {
    $nameids[] = (int)($note->teacherid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'student' => [
        'id' => $studentid,
        'name' => $studentname,
        'email' => (string)$studentuser->email,
        'username' => (string)$studentuser->username,
        'account_label' => pqh_account_no_label($studentuser),
        'account_no' => pqh_account_no_value($studentuser),
    ],
    'profile' => [
        'current_level' => (string)($profile->current_level ?? ''),
        'status' => (string)($profile->status ?? 'active'),
        'age_band' => (string)($profile->age_band ?? ''),
        'language' => (string)($profile->language ?? ($profile->primary_language ?? '')),
        'country' => (string)($profile->country ?? ''),
        'enrollment_approval_status' => (string)($profile->enrollment_approval_status ?? ''),
    ],
    'isself' => $isself,
    'metrics' => [
        'lessons_completed' => (int)$lessons['completed'],
        'lessons_total' => (int)$lessons['total'],
        'quiz_completed' => (int)$quiz['completed'],
        'quiz_total' => (int)$quiz['total'],
        'quiz_best' => (int)$quiz['best'],
        'attendance_present' => (int)$attendance['present'],
        'attendance_total' => (int)$attendance['total'],
    ],
    'teachers' => $teachersout,
    'guardians' => $guardiansout,
    'consents' => $consentsout,
    'attendance' => $attendanceout,
    'notes' => $notesout,
    'lessons' => $lessonsout,
    'quiz' => $quizout,
    'materials' => $materialsout,
    'canmanage' => $canmanage,
    'canteach' => $canteach,
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/workspace_student.php?workspaceid=' . $workspaceid . '&studentid=' . $studentid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
