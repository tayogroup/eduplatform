<?php
declare(strict_types=1);

// Serves the generated .seb configuration file for an exam. The student
// downloads this in their normal browser (logged in), then opens it to
// launch Safe Exam Browser locked to the exam.
require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$examid = required_param('examid', PARAM_ALPHANUMEXT);
$exam = pqh_seb_exam($examid);
if (!$exam) {
    pqh_access_denied('This exam configuration does not exist.', new moodle_url('/local/hubredirect/dashboard.php'), 'Exam unavailable');
}

$xml = pqh_seb_config_xml($examid);
pqh_seb_audit('seb_config_downloaded', $examid);

header('Content-Type: application/seb');
header('Content-Length: ' . strlen($xml));
header('Content-Disposition: attachment; filename="' . $examid . '.seb"');
header('Cache-Control: private, no-store');
echo $xml;
