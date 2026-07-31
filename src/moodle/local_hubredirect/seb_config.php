<?php
declare(strict_types=1);

// Serves the generated .seb configuration file for an exam. The student
// downloads this in their normal browser (logged in), then opens it to
// launch Safe Exam Browser locked to the exam.
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

// SEB fetches this URL itself (sebs:// handoff) and carries no Moodle session,
// so a short-lived signed ticket authenticates that request instead. Any other
// caller still needs a normal login.
$pqsc_learnerid = 0;
$pqsc_ticket = optional_param('k', '', PARAM_RAW_TRIMMED);
if ($pqsc_ticket !== '') {
    $pqsc_claims = pqh_seb_course_ticket_verify($pqsc_ticket);
    if ($pqsc_claims !== null) {
        $pqsc_learnerid = (int)$pqsc_claims['userid'];
    }
}
if ($pqsc_learnerid <= 0) {
    require_login();
    $pqsc_learnerid = (int)$USER->id;
}

$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');

// ---- Course mode: a .seb config that starts on an enrolled course ---------
// Used by course_launch.php so that starting a course opens it inside SEB.
// Gated on real Moodle enrolment in that course — never on the exam tables,
// which a course launch does not need.
$coursekey = optional_param('course', '', PARAM_ALPHANUMEXT);
if ($coursekey !== '') {
    $courseid = 0;
    if (preg_match('/^ehel-(?:eng|math|sci)-g\d{2}$/', $coursekey)) {
        $courseid = (int)$DB->get_field('course', 'id', ['idnumber' => $coursekey]);
    } else if (preg_match('/^moodle_(\d+)$/', $coursekey, $mm)) {
        $courseid = (int)$mm[1];
    }
    if ($courseid <= 0 || !$DB->record_exists('course', ['id' => $courseid])) {
        pqh_access_denied('That course does not exist.', $dashboardurl, 'Course unavailable');
    }
    // A ticket is valid only for the exact course it was minted for.
    if ($pqsc_ticket !== '' && isset($pqsc_claims['course']) && (string)$pqsc_claims['course'] !== $coursekey) {
        pqh_access_denied('That launch link is not valid for this course.', $dashboardurl, 'Launch link invalid');
    }
    $coursectx = context_course::instance($courseid);
    if (!is_enrolled($coursectx, $pqsc_learnerid, '', true)
            && !($pqsc_ticket === '' && is_siteadmin())) {
        pqh_access_denied('You are not enrolled in this course.', $dashboardurl, 'Not enrolled');
    }
    $idnumber = (string)$DB->get_field('course', 'idnumber', ['id' => $courseid]);

    // Build URLs against the host the learner actually reached us on, NOT
    // $CFG->wwwroot: this install is served on several consumer hosts and the
    // canonical wwwroot may not be the one they can use.
    $scheme = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') ? 'https://' : 'http://';
    $reqhost = (string)($_SERVER['HTTP_HOST'] ?? '');
    $base = preg_match('/^[A-Za-z0-9.\-]+(:\d+)?$/', $reqhost) ? $scheme . $reqhost : rtrim((string)$CFG->wwwroot, '/');

    // Start SEB straight on the learning app with a freshly minted progress
    // token. Starting on a Moodle page instead would open a clean SEB browser
    // session with no Moodle cookie, demanding a second sign-in the learner
    // cannot reasonably complete — and rendering blank when that host is not
    // the one they use.
    $starturl = '';
    if ($idnumber !== '') {
        require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');
        $starturl = pqpg_ehel_launch_url($pqsc_learnerid, $idnumber, '', $base);
    }
    if ($starturl === '') {
        // Non-Ehel course: fall back to the Moodle launch page.
        $starturl = $base . '/local/hubredirect/course_launch.php?course='
            . rawurlencode($idnumber !== '' ? $idnumber : ('moodle_' . $courseid));
    }

    // Hand the lesson app an exit route and the hard cap, so it can offer a
    // "finished" control and release automatically when the cap is reached.
    // The release endpoint decides whether the learner has actually earned it.
    $releasekey = $idnumber !== '' ? $idnumber : ('moodle_' . $courseid);
    $releaseurl = $base . '/local/hubredirect/seb_release.php?course=' . rawurlencode($releasekey)
        . '&k=' . rawurlencode(pqh_seb_course_ticket($pqsc_learnerid, $releasekey, 8 * HOURSECS));
    $starturl .= '&exitUrl=' . rawurlencode($releaseurl)
        . '&exitAfter=' . (pqh_seb_cap_minutes() * 60)
        . '&learnAfter=' . (pqh_seb_learn_minutes() * 60)
        . '&lockOn=' . (pqh_seb_course_lock_applies($pqsc_learnerid) ? 1 : 0);

    // Start the clock for the conditional exit gate (not for overriders).
    if (pqh_seb_course_lock_applies($pqsc_learnerid)) {
        pqh_seb_mark_session_start($pqsc_learnerid);
    }

    // quitURL must be the dedicated quit target — SEB quits the instant it
    // navigates there, so it must never be a page the learner can reach freely.
    $xml = pqh_seb_course_config_xml($idnumber, $starturl,
        $base . '/local/hubredirect/seb_quit.php', $pqsc_learnerid);

    header('Content-Type: application/seb');
    header('Content-Length: ' . strlen($xml));
    header('Content-Disposition: attachment; filename="course-' . preg_replace('/[^A-Za-z0-9_-]/', '', $coursekey) . '.seb"');
    header('Cache-Control: private, no-store');
    echo $xml;
    exit;
}

// Exam mode always needs a real session — handoff tickets are scoped to course
// launches only and must never stand in for login on the exam path.
require_login();

$examid = required_param('examid', PARAM_INT);

if (!pqh_seb_tables_ready()) {
    pqh_access_denied('The exam tables are not installed yet. Please ask support to run the SEB exam SQL.', $dashboardurl, 'Exams not ready');
}
$exam = pqh_seb_exam_record($examid);
if (!$exam) {
    pqh_access_denied('This exam configuration does not exist.', $dashboardurl, 'Exam unavailable');
}
if (!pqh_seb_can_manage($exam, (int)$USER->id)) {
    [$allowed, $reason] = pqh_seb_student_gate($exam, (int)$USER->id);
    if (!$allowed) {
        pqh_access_denied($reason, $dashboardurl, 'Exam not available');
    }
}

$xml = pqh_seb_config_xml($exam);
pqh_seb_audit('seb_config_downloaded', $examid);

header('Content-Type: application/seb');
header('Content-Length: ' . strlen($xml));
header('Content-Disposition: attachment; filename="exam-' . $examid . '.seb"');
header('Cache-Control: private, no-store');
echo $xml;
