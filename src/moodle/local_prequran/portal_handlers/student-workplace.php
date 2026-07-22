<?php
// ---- report: student-workplace (student workspace hub; read-only) -------------
// Ported from local_hubredirect/student_workplace.php via student_workplace_portallib
// (pqswpl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the workplace view exactly as the page renders it: the resolved
//        workspace, every card/action URL (homework, lesson work, document
//        studio, materials library, live class work, submissions, reviews),
//        assigned Safe Exam Browser exams, and the full student-tool grid.
// POST = none. The legacy page has no write actions (no sesskey handling, no
//        forms, no uploads) — the embedded support widget posts to its own
//        shared endpoint and is not part of this page's write surface.
// Targets already migrated to the portal come back as portal_launch.php?report=
// URLs (student-dashboard, student-homework, live-schedule); the Document
// Studio card keeps the page's teacher_office.php link (the teacher-office
// portal report is teacher-side — the student office view stays as the page
// does it). Everything else is the legacy page.
// (student_workplace.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/office_materials_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/seb_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_workplace_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The student workplace has no write actions.');
}

// -- access: exact page order — consumer context, workspace resolution, the
// student-membership gate, then the workspace record lookup. A JSON endpoint
// cannot redirect to the dashboard, so each denial surfaces the page's message.
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqho_resolve_teacher_workspace_id($userid, $requestedworkspaceid, 0, $consumercontext);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqho_user_is_student_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Choose a student workspace before opening Student Workplace.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'The selected workspace was not found.');
}

// portal_launch relaunch URLs for migrated targets (same convention as the
// master-dashboard / teacher-office handlers): the click re-mints a scoped
// token; deep-link ints + consumer travel through portal_launch's passthrough.
$pqswplaunch = static function (string $report, array $params = []) use ($CFG): string {
    $url = $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $report;
    foreach ($params as $key => $value) {
        if ((string)$value === '' || $value === 0) {
            continue;
        }
        $url .= '&' . $key . '=' . rawurlencode((string)$value);
    }
    return $url;
};

// -- the page's URL set, same construction order --------------------------------
$studentid = $userid;
$lessonurl = new moodle_url('/local/hubredirect/issue_child.php', [
    'goto' => 'alphabet_listen',
    'pq_env' => pqswpl_default_environment(),
    'managed_student' => 1,
]);
$studio = new moodle_url('/local/hubredirect/teacher_office.php', $urlparams);
$materials = new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams);
$launchcontext = [
    'workspaceid' => $workspaceid,
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
];
$homework = $pqswplaunch('student-homework', $launchcontext);
$scheduleurl = $pqswplaunch('live-schedule', $launchcontext + ['childid' => $studentid]);
$studenttools = [
    'Virtual tutor' => (new moodle_url('/local/hubredirect/virtual_tutor.php', ['studentid' => $studentid]))->out(false),
    'Parent live hub' => (new moodle_url('/local/hubredirect/live_parent_trust.php', $urlparams + ['childid' => $studentid]))->out(false),
    'Live schedule' => $scheduleurl,
    'Class series' => (new moodle_url('/local/hubredirect/live_series_schedule.php', $urlparams + ['childid' => $studentid]))->out(false),
    'Live calendar' => (new moodle_url('/local/hubredirect/live_calendar.php', $urlparams + ['childid' => $studentid]))->out(false),
    'Unofficial transcript' => (new moodle_url('/local/hubredirect/course_transcript.php', $urlparams + ['studentid' => $studentid]))->out(false),
    'Live summaries' => (new moodle_url('/local/hubredirect/live_summaries.php', $urlparams + ['childid' => $studentid]))->out(false),
    'Trust center' => (new moodle_url('/local/hubredirect/live_trust.php', $urlparams + ['childid' => $studentid]))->out(false),
    'Live recordings' => (new moodle_url('/local/hubredirect/live_recordings.php', $urlparams + ['childid' => $studentid]))->out(false),
    'Managed report' => (new moodle_url('/local/hubredirect/managed_reports.php', $urlparams + ['studentid' => $studentid]))->out(false),
    'Speak recordings' => (new moodle_url('/local/hubredirect/recordings.php', ['childid' => $studentid]))->out(false),
    'Quiz report' => (new moodle_url('/local/hubredirect/quiz_report.php', [
        'pq_env' => pqswpl_default_environment(),
        'lessonid' => 'alphabet',
        'unitid' => 'alphabet_quiz',
        'userid' => $studentid,
    ]))->out(false),
];

// -- assigned SEB exams (same conditional card the page renders) ----------------
$examsout = [];
foreach (pqh_seb_exams_for_student($userid) as $exam) {
    $examsout[] = [
        'id' => (int)$exam->id,
        'title' => (string)$exam->title,
        'window_start' => (int)$exam->window_start,
        'window_label' => (int)$exam->window_start > 0
            ? userdate((int)$exam->window_start, get_string('strftimedatetimeshort'))
            : '',
        'url' => pqh_seb_exam_url((int)$exam->id)->out(false),
    ];
}

$toolsout = [];
foreach ($studenttools as $label => $toolurl) {
    $toolsout[] = ['label' => (string)$label, 'url' => (string)$toolurl];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'student' => ['id' => $studentid, 'firstname' => (string)$USER->firstname],
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'urls' => [
        'dashboard' => $pqswplaunch('student-dashboard', $launchcontext),
        'homework' => $homework,
        'lesson' => $lessonurl->out(false),
        'virtualtutor' => $studenttools['Virtual tutor'],
        'studio' => $studio->out(false),
        'materials' => $materials->out(false),
        'livesessions' => (new moodle_url('/local/hubredirect/live_sessions.php', ['workspaceid' => $workspaceid]))->out(false),
        'schedule' => $scheduleurl,
        'speakrecordings' => $studenttools['Speak recordings'],
        'quizreport' => $studenttools['Quiz report'],
        'transcript' => $studenttools['Unofficial transcript'],
        'managedreport' => $studenttools['Managed report'],
        'messages' => (new moodle_url('/local/hubredirect/communications.php', ['studentid' => $studentid, 'opencomm' => 'messages']))->out(false),
        'announcements' => (new moodle_url('/local/hubredirect/communications.php', ['studentid' => $studentid, 'opencomm' => 'announcements']))->out(false),
        'support' => (new moodle_url('/local/hubredirect/student_workplace.php', $urlparams))->out(false),
    ],
    'exams' => $examsout,
    'tools' => $toolsout,
    'names' => pqpd_names([$studentid]),
], JSON_UNESCAPED_SLASHES);
exit;
