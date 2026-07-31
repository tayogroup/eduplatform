<?php
declare(strict_types=1);

// Syllabus as a downloadable PDF. Same access rule as syllabus_view.php and the
// same rendered HTML, so the printed document can never say something different
// from the page — TCPDF renders the markup pqsyl_render_html() already built.
//
//   /local/hubredirect/syllabus_pdf.php?course=ehel-eng-g01[&year=2026]

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/syllabus_portallib.php');
require_once($CFG->libdir . '/pdflib.php');

$courseref = optional_param('course', '', PARAM_RAW_TRIMMED);
$year = optional_param('year', 0, PARAM_INT);

$viewerid = isloggedin() && !isguestuser() ? (int)$USER->id : 0;

// PDF generation is heavier than a page render, so anonymous callers get a
// tighter budget than the web view.
if ($viewerid <= 0 && pqh_ip_rate_limited('syllabus_pdf', 20, 60)) {
    http_response_code(429);
    echo 'Too many requests. Please try again in a minute.';
    exit;
}

$course = pqsyl_resolve_course($courseref);
if (!$course) {
    http_response_code(404);
    echo 'Syllabus not available.';
    exit;
}
if ($year <= 0) {
    $wsid = (int)($DB->get_field('local_prequran_syllabus', 'workspaceid',
        ['moodlecourseid' => (int)$course->id], IGNORE_MULTIPLE) ?: 0);
    $year = pqsyl_current_year($wsid);
}

[$allowed, $ispublic, $row] = pqsyl_can_read((int)$course->id, $year, $viewerid);
if (!$allowed || !$row) {
    http_response_code(404);
    echo 'Syllabus not available.';
    exit;
}

$consumer = pqh_resolve_consumer_context();
$brand = trim((string)($consumer->consumername ?? '')) !== ''
    ? (string)$consumer->consumername : 'EduPlatform';

// TCPDF's HTML subset is narrow: inline styles on the elements themselves, no
// stylesheet cascade to rely on.
$inner = pqsyl_render_html($row, $course, ['public' => $ispublic]);
$inner = str_replace(
    ['<h1>', '<h2>', '<h3>', '<p class="meta">', '<div class="unit">', '<span class="tag">'],
    [
        '<h1 style="font-size:19pt;color:#17324d;">',
        '<h2 style="font-size:13pt;color:#17324d;border-bottom:1px solid #d8e2ec;">',
        '<h3 style="font-size:11pt;color:#3f5872;">',
        '<p style="color:#6b7f93;font-size:9pt;">',
        '<div style="margin:6pt 0;">',
        '<span style="color:#3f5872;font-size:8pt;">',
    ],
    $inner
);
// The screen-only action buttons have no place in a document.
$inner = preg_replace('#<p class="actions">.*?</p>#s', '', $inner);

$html = '<div style="font-family:helvetica;font-size:10pt;color:#12263a;">'
    . '<div style="color:#6b7f93;font-size:8pt;">' . s($brand) . '</div>'
    . $inner
    . '</div>';

$filename = preg_replace('/[^A-Za-z0-9_-]+/', '-',
    ($course->idnumber !== '' ? (string)$course->idnumber : 'course-' . (int)$course->id))
    . '-syllabus-' . $year . '.pdf';

$pdf = new pdf(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8');
$pdf->SetCreator($brand);
$pdf->SetAuthor($brand);
$pdf->SetTitle((string)$course->fullname . ' syllabus');
$pdf->SetMargins(15, 15, 15);
$pdf->SetFooterMargin(10);
$pdf->SetAutoPageBreak(true, 18);
$pdf->setPrintHeader(false);
$pdf->setPrintFooter(true);
$pdf->AddPage();
$pdf->writeHTML($html, true, false, true, false, '');
$bytes = $pdf->Output('', 'S');

header('Content-Type: application/pdf');
header('Content-Length: ' . strlen($bytes));
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: private, no-store');
echo $bytes;
