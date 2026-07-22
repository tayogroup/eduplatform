<?php
// ---- report: student-homework (student assignment list + turn-in writes) -----
// Ported from local_hubredirect/student_homework.php. The page defines no
// inline functions: every helper is shared — pqhh_* in homeworklib.php (which
// pulls course_catalog.php + office_materials_lib.php itself), pqho_* in
// office_materials_lib.php, pqh_* in accesslib.php — so those libs are
// required at runtime and never copied; student_homework_portallib.php
// documents this and stays guard-only. Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
// GET  = everything the page renders: the student's own submission rows
//        (title, course, instructions, due date, points, status, response,
//        feedback, grade) in the page's exact ordering, the student's own
//        active Document Studio materials, and the To do / Awaiting review /
//        Graded / Overdue counters.
// POST = do=start | save | submit — the page's three sesskey'd actions
//        VERBATIM (data_submitted()+confirm_sesskey() dropped: token auth
//        replaces the session key; the page's $notice banner becomes
//        {"ok":true,"message":...} and its caught-Throwable $error banner
//        becomes a 400 JSON failure). None of the page's writes involve a
//        multipart file upload (attachments are picked from existing
//        Document Studio materials by id), so all three writes are ported.
// (student_homework.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/homeworklib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_homework_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// ---- Access + workspace resolution (student_homework.php lines 8-17) ---------
// Same order and outcomes as the legacy ENTRY check; pqh_access_denied()
// redirects become 403 JSON failures with the page's exact messages.
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
if (isset($body['workspaceid']) && (int)$body['workspaceid'] > 0) {
    $requestedworkspaceid = (int)$body['workspaceid'];
}
$workspaceid = pqho_resolve_teacher_workspace_id($userid, $requestedworkspaceid, 0, $consumercontext);
if ($workspaceid <= 0 || !pqho_user_is_student_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Choose a student workspace before opening Homework.');
}
if (!pqhh_ready()) {
    pqpd_fail(403, 'Homework is waiting for the EduPlatform database upgrade.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $do = (string)($body['do'] ?? '');
    if (!in_array($do, ['start', 'save', 'submit'], true)) {
        pqpd_fail(400, 'Unknown student-homework action.');
    }
    // The page wraps every action in try/catch and shows $e->getMessage() as
    // its inline error banner — same messages, delivered as 400 JSON
    // (student_homework.php lines 21-100, verbatim).
    try {
        $submissionid = (int)($body['submissionid'] ?? 0);
        $submission = $DB->get_record('local_prequran_homework_sub', [
            'id' => $submissionid, 'workspaceid' => $workspaceid, 'studentid' => $userid,
        ], '*', MUST_EXIST);
        $homework = $DB->get_record('local_prequran_homework', [
            'id' => (int)$submission->homeworkid, 'workspaceid' => $workspaceid, 'status' => 'published',
        ], '*', MUST_EXIST);
        if (!pqhh_user_enrolled_in_course($userid, (int)$homework->moodlecourseid)) {
            throw new invalid_parameter_exception('This homework course is not available to your account.');
        }
        $now = time();
        $notice = '';
        // -- write: start (legacy action=start, verbatim) ----------------------
        if ($do === 'start') {
            if ((string)$submission->status === 'assigned') {
                $submission->status = 'in_progress';
                $submission->startedat = $now;
                $submission->timemodified = $now;
                $DB->update_record('local_prequran_homework_sub', $submission);
            }
            $notice = 'Homework started.';
        // -- write: save (legacy action=save, verbatim) ------------------------
        } elseif ($do === 'save') {
            if (in_array((string)$submission->status, ['submitted', 'graded'], true)) {
                throw new invalid_parameter_exception('Submitted homework is locked while it is being reviewed.');
            }
            $materialid = (int)($body['materialid'] ?? 0);
            if ($materialid > 0 && !$DB->record_exists('local_prequran_workspace_material', [
                    'id' => $materialid, 'workspaceid' => $workspaceid, 'createdby' => $userid, 'status' => 'active'])) {
                throw new invalid_parameter_exception('The selected material is not available.');
            }
            $submission->status = 'in_progress';
            $submission->response_text = trim(clean_param((string)($body['response_text'] ?? ''), PARAM_RAW_TRIMMED));
            $submission->materialid = $materialid;
            $submission->timemodified = $now;
            if ((int)$submission->startedat <= 0) {
                $submission->startedat = $now;
            }
            $DB->update_record('local_prequran_homework_sub', $submission);
            $notice = 'Draft saved.';
        // -- write: submit (legacy action=submit, verbatim) --------------------
        } elseif ($do === 'submit') {
            if ((string)$submission->status === 'graded') {
                throw new invalid_parameter_exception('This homework has already been graded.');
            }
            if ((string)$submission->status === 'submitted') {
                throw new invalid_parameter_exception('Submitted homework is locked while it is being reviewed.');
            }
            if ((string)$submission->status === 'returned' && empty($homework->allowresubmit)) {
                throw new invalid_parameter_exception('Resubmission is not enabled for this homework.');
            }
            $response = trim(clean_param((string)($body['response_text'] ?? ''), PARAM_RAW_TRIMMED));
            $materialid = (int)($body['materialid'] ?? 0);
            if ($materialid > 0) {
                $material = $DB->get_record('local_prequran_workspace_material', [
                    'id' => $materialid, 'workspaceid' => $workspaceid, 'createdby' => $userid, 'status' => 'active',
                ], '*', IGNORE_MISSING);
                if (!$material) {
                    throw new invalid_parameter_exception('The selected material is not available.');
                }
            }
            if ($response === '' && $materialid <= 0) {
                throw new invalid_parameter_exception('Add a written response or attach a Document Studio file.');
            }
            $submission->status = 'submitted';
            $submission->attemptnumber = (int)$submission->attemptnumber + 1;
            $submission->response_text = $response;
            $submission->materialid = $materialid;
            $submission->submittedat = $now;
            $submission->feedback = '';
            $submission->timemodified = $now;
            if ((int)$submission->startedat <= 0) {
                $submission->startedat = $now;
            }
            $DB->update_record('local_prequran_homework_sub', $submission);
            $notice = 'Homework submitted for teacher review.';
        }
        echo json_encode([
            'ok' => true,
            'message' => $notice,
            'submissionid' => $submissionid,
            'do' => $do,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// ---- GET: the working set the page renders (lines 102-125, verbatim) ---------
$materials = [];
if (pqh_table_exists_safe('local_prequran_workspace_material')) {
    $materials = array_values($DB->get_records('local_prequran_workspace_material', [
        'workspaceid' => $workspaceid, 'createdby' => $userid, 'status' => 'active',
    ], 'timemodified DESC', 'id,title,material_type,timemodified'));
}
$rows = array_values($DB->get_records_sql(
    "SELECT s.*, h.title, h.instructions, h.duedate, h.maxpoints, h.allowresubmit, h.resourcematerialid,
            h.moodlecourseid, c.fullname AS coursename
       FROM {local_prequran_homework_sub} s
       JOIN {local_prequran_homework} h ON h.id = s.homeworkid
       JOIN {course} c ON c.id = h.moodlecourseid
      WHERE s.workspaceid = :workspaceid AND s.studentid = :studentid AND h.status = :status
   ORDER BY CASE s.status WHEN 'returned' THEN 0 WHEN 'assigned' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'submitted' THEN 3 ELSE 4 END,
            h.duedate ASC, h.id DESC",
    ['workspaceid' => $workspaceid, 'studentid' => $userid, 'status' => 'published']
));
$counts = ['open' => 0, 'review' => 0, 'graded' => 0, 'overdue' => 0];
foreach ($rows as $row) {
    if (in_array((string)$row->status, ['assigned', 'in_progress', 'returned'], true)) {$counts['open']++;}
    if ((string)$row->status === 'submitted') {$counts['review']++;}
    if ((string)$row->status === 'graded') {$counts['graded']++;}
    if ((int)$row->duedate > 0 && (int)$row->duedate < time() && !in_array((string)$row->status, ['submitted', 'graded'], true)) {$counts['overdue']++;}
}

// Decorate rows for the client (status label, due-date label, course-material
// link — the same values the page renders inline). The office material editor
// and Document Studio are not portal-migrated yet, so their links stay on the
// legacy Moodle pages (session still valid there), exactly as dashboard.html
// does for unmigrated targets.
$urlparams = pqhh_context_params($consumercontext, $workspaceid);
$nameids = [$userid];
foreach ($rows as $row) {
    $row->status_label = pqhh_status_label((string)$row->status);
    $row->duedate_label = (int)$row->duedate > 0 ? userdate((int)$row->duedate, '%d %b %Y, %H:%M') : '';
    $row->resource_url = (int)$row->resourcematerialid > 0
        ? $CFG->wwwroot . '/local/hubredirect/office_material_editor.php?' . http_build_query(
            $urlparams + ['materialid' => (int)$row->resourcematerialid, 'mode' => 'view', 'returnto' => 'homework'])
        : '';
    $nameids[] = (int)$row->gradedby;
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'counts' => $counts,
    'materials' => $materials,
    'rows' => $rows,
    'urls' => [
        'workplace' => $CFG->wwwroot . '/local/hubredirect/student_workplace.php?' . http_build_query($urlparams),
        'office' => $CFG->wwwroot . '/local/hubredirect/teacher_office.php?' . http_build_query($urlparams),
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
