<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');

if (!is_siteadmin((int)$USER->id)) {
    pqh_access_denied(
        'Only site administrators can view course diagnostics.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Course diagnostics access required'
    );
}

$userid = optional_param('userid', 0, PARAM_INT);
$username = trim(optional_param('username', '', PARAM_RAW_TRIMMED));

if ($userid <= 0 && $username !== '') {
    $user = $DB->get_record('user', ['username' => $username, 'deleted' => 0], '*', IGNORE_MISSING);
    if ($user) {
        $userid = (int)$user->id;
    }
}
if ($userid <= 0) {
    $userid = (int)$USER->id;
}

$target = core_user::get_user($userid);
if (!$target) {
    pqh_access_denied(
        'Choose a valid Moodle user before opening course diagnostics.',
        new moodle_url('/local/hubredirect/course_debug.php'),
        'Course diagnostics unavailable'
    );
}

$profile = null;
if ($DB->get_manager()->table_exists('local_prequran_student_profile')) {
    $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $userid], '*', IGNORE_MISSING);
}

$enrolmentkeys = pqh_user_course_keys_from_moodle_enrolments($userid);
$profilekeys = pqh_user_course_keys_from_profile($userid);
$resolvedkeys = pqh_user_course_keys($userid);
$resolvedcourses = pqh_user_courses($userid);

$moodlecourses = $DB->get_records_sql(
    "SELECT DISTINCT c.id, c.fullname, c.shortname, c.idnumber, c.visible, e.status AS enrolstatus, ue.status AS userenrolstatus
       FROM {course} c
       JOIN {enrol} e ON e.courseid = c.id
       JOIN {user_enrolments} ue ON ue.enrolid = e.id
      WHERE ue.userid = :userid
        AND c.id <> :siteid
   ORDER BY c.fullname",
    ['userid' => $userid, 'siteid' => SITEID]
);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/course_debug.php', ['userid' => $userid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Course Debug');
$PAGE->set_heading('Course Debug');

echo $OUTPUT->header();
echo html_writer::tag('h2', 'Course debug for ' . fullname($target) . ' #' . $userid);
echo html_writer::tag('p', 'Username: ' . s((string)$target->username));
echo html_writer::tag('p', 'course_catalog.php marker: multi-course parser enabled');

echo html_writer::tag('h3', 'Profile');
echo html_writer::tag('pre', s(json_encode([
    'course_type' => $profile ? (string)($profile->course_type ?? '') : null,
    'profile_keys' => $profilekeys,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)));

echo html_writer::tag('h3', 'Moodle Enrolments');
$rows = [];
foreach ($moodlecourses as $course) {
    $rows[] = [
        'id' => (int)$course->id,
        'fullname' => (string)$course->fullname,
        'shortname' => (string)$course->shortname,
        'idnumber' => (string)$course->idnumber,
        'visible' => (int)$course->visible,
        'enrolstatus' => (int)$course->enrolstatus,
        'userenrolstatus' => (int)$course->userenrolstatus,
        'matched_keys' => pqh_course_catalog_moodle_matches($course),
    ];
}
echo html_writer::tag('pre', s(json_encode([
    'enrolment_keys' => $enrolmentkeys,
    'courses' => $rows,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)));

echo html_writer::tag('h3', 'Resolved Dashboard Courses');
echo html_writer::tag('pre', s(json_encode([
    'resolved_keys' => $resolvedkeys,
    'resolved_courses' => array_map(function(array $course): string {
        return (string)$course['title'];
    }, $resolvedcourses),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)));

echo $OUTPUT->footer();
