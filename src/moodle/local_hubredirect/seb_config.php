<?php
declare(strict_types=1);

// Serves the generated .seb configuration file for an exam. The student
// downloads this in their normal browser (logged in), then opens it to
// launch Safe Exam Browser locked to the exam.
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$examid = required_param('examid', PARAM_INT);
$dashboardurl = new moodle_url('/local/hubredirect/dashboard.php');

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
