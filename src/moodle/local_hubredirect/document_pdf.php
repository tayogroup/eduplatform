<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/workflow_documentlib.php');

$generatedid = required_param('generatedid', PARAM_INT);
$row = $DB->get_record('local_prequran_generated_doc', ['id' => $generatedid], '*', MUST_EXIST);
$workspaceid = (int)$row->workspaceid;
// Report cards are family-facing: a PUBLISHED card may be downloaded by the
// student it concerns or a linked (consented) parent, in addition to workspace
// managers. Every other generated document stays manager-only.
$canaccess = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
if (!$canaccess && (string)$row->source_type === 'report_card' && pqh_table_exists_safe('local_prequran_report_card')) {
    $card = $DB->get_record('local_prequran_report_card', ['id' => (int)$row->source_id], '*', IGNORE_MISSING);
    if ($card && (string)$card->status === 'published') {
        $sid = (int)$card->studentid;
        if ((int)$USER->id === $sid) {
            $canaccess = true;
        } else if (pqh_table_exists_safe('local_prequran_comm_consent')) {
            $columns = $DB->get_columns('local_prequran_comm_consent');
            $where = 'studentid = :sid AND guardianid = :gid';
            $params = ['sid' => $sid, 'gid' => (int)$USER->id];
            if (isset($columns['consented'])) {
                $where .= ' AND consented = 1';
            }
            $canaccess = $DB->record_exists_select('local_prequran_comm_consent', $where, $params);
        }
    }
}
if ($workspaceid <= 0 || !$canaccess) {
    pqh_access_denied('Generated document PDFs require workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Document PDF access denied');
}
$document = $DB->get_record('local_prequran_document', ['id' => (int)$row->documentid], '*', IGNORE_MISSING);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
$student = (int)$row->studentid > 0 ? core_user::get_user((int)$row->studentid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
$payload = json_decode((string)$row->payloadjson, true);
$payload = is_array($payload) ? $payload : [];

$pdflib = $CFG->libdir . '/pdflib.php';
if (!file_exists($pdflib)) {
    throw new invalid_parameter_exception('PDF library is not available on this platform.');
}
require_once($pdflib);
if (!class_exists('pdf')) {
    throw new invalid_parameter_exception('PDF library is not available.');
}

$title = trim((string)($document->title ?? ($payload['title'] ?? ucfirst((string)$row->doc_type))));
$title = $title !== '' ? $title : 'Generated Document';
$documentkey = trim((string)$row->document_key);
$issued = (int)($document->issuedat ?? $row->generatedat);
$html = '<h1 style="font-size:22px;">' . s($title) . '</h1>';
$html .= '<table cellpadding="6" cellspacing="0" border="1" style="border-color:#d8e2d8;">';
$html .= '<tr><td><strong>Institution</strong></td><td>' . s((string)($workspace->name ?? 'Workspace')) . '</td></tr>';
$html .= '<tr><td><strong>Document Type</strong></td><td>' . s((string)$row->doc_type) . '</td></tr>';
$html .= '<tr><td><strong>Document Key</strong></td><td>' . s($documentkey) . '</td></tr>';
$html .= '<tr><td><strong>Student</strong></td><td>' . s($student ? fullname($student) : 'N/A') . '</td></tr>';
$html .= '<tr><td><strong>Source</strong></td><td>' . s((string)$row->source_type) . ' #' . (int)$row->source_id . '</td></tr>';
$html .= '<tr><td><strong>Status</strong></td><td>' . s((string)$row->status) . '</td></tr>';
$html .= '<tr><td><strong>Issued</strong></td><td>' . s($issued > 0 ? userdate($issued) : userdate((int)$row->generatedat)) . '</td></tr>';
$html .= '</table>';
$award = null;
if ((string)$row->source_type === 'completion_award' && pqh_table_exists_safe('local_prequran_completion_award')) {
    $award = $DB->get_record('local_prequran_completion_award', ['id' => (int)$row->source_id], '*', IGNORE_MISSING);
}
if ($award && (string)$award->status === 'revoked') {
    // A revoked award must never render as a clean certificate: the PDF now
    // self-documents the revocation instead of silently showing valid details.
    $html .= '<h2 style="font-size:20px;color:#8a1f1f;border:3px solid #8a1f1f;padding:8px;text-align:center;">CERTIFICATE REVOKED</h2>';
    $html .= '<table cellpadding="6" cellspacing="0" border="1" style="border-color:#c99;">';
    $html .= '<tr><td><strong>Award Number</strong></td><td>' . s((string)$award->awardnumber) . '</td></tr>';
    $html .= '<tr><td><strong>Status</strong></td><td>REVOKED ' . s((int)($award->revokedat ?? 0) > 0 ? userdate((int)$award->revokedat) : '') . '</td></tr>';
    $html .= '<tr><td><strong>Reason</strong></td><td>' . s((string)($award->revocation_reason ?? '')) . '</td></tr>';
    $html .= '</table>';
    $html .= '<p style="color:#8a1f1f;"><strong>This certificate is no longer valid and must not be presented as a credential.</strong></p>';
} else if ($award) {
    $html .= '<h2 style="font-size:17px;">Certificate Details</h2>';
    $html .= '<table cellpadding="6" cellspacing="0" border="1" style="border-color:#d8e2d8;">';
    $html .= '<tr><td><strong>Award Number</strong></td><td>' . s((string)$award->awardnumber) . '</td></tr>';
    $html .= '<tr><td><strong>Award Type</strong></td><td>' . s((string)$award->award_type) . '</td></tr>';
    $html .= '<tr><td><strong>Completion</strong></td><td>' . s((string)$award->completion_percent) . '%</td></tr>';
    $html .= '<tr><td><strong>Final Grade</strong></td><td>' . s((string)$award->final_grade) . '</td></tr>';
    $html .= '</table>';
}
// Report card: a proper per-term layout (grade table + attendance + conduct +
// teacher narrative), not the generic key/value dump.
if ((string)$row->source_type === 'report_card' && pqh_table_exists_safe('local_prequran_report_card')) {
    $card = $card ?? $DB->get_record('local_prequran_report_card', ['id' => (int)$row->source_id], '*', IGNORE_MISSING);
    if ($card) {
        $termtitle = '';
        if ((int)$card->termid > 0 && pqh_table_exists_safe('local_prequran_acad_term')) {
            $termtitle = (string)$DB->get_field('local_prequran_acad_term', 'title', ['id' => (int)$card->termid], IGNORE_MISSING);
        }
        $conductlabels = ['not_assessed' => 'Not assessed', 'excellent' => 'Excellent', 'good' => 'Good',
            'satisfactory' => 'Satisfactory', 'needs_improvement' => 'Needs improvement', 'concern' => 'Concern'];
        $html .= '<h2 style="font-size:16px;">Term: ' . s($termtitle !== '' ? $termtitle : ('#' . (int)$card->termid)) . '</h2>';
        $cgrades = json_decode((string)$card->grades_json, true) ?: [];
        if ($cgrades) {
            $html .= '<h3 style="font-size:14px;">Grades</h3>';
            $html .= '<table cellpadding="6" cellspacing="0" border="1" style="border-color:#d8e2d8;"><tr><td><strong>Course</strong></td><td><strong>Grade</strong></td></tr>';
            foreach ($cgrades as $g) {
                $html .= '<tr><td>' . s((string)($g['course'] ?? '')) . '</td><td>' . s((string)($g['percent'] ?? '')) . '%'
                    . ((string)($g['letter'] ?? '') !== '' ? ' (' . s((string)$g['letter']) . ')' : '') . '</td></tr>';
            }
            $html .= '</table>';
        }
        $html .= '<table cellpadding="6" cellspacing="0" border="1" style="border-color:#d8e2d8;margin-top:8px;">';
        $html .= '<tr><td><strong>Overall grade</strong></td><td>' . s((string)$card->overall_grade) . '%</td></tr>';
        $html .= '<tr><td><strong>Attendance</strong></td><td>' . s((string)$card->attendance_rate) . '%</td></tr>';
        $html .= '<tr><td><strong>Conduct</strong></td><td>' . s($conductlabels[(string)$card->conduct] ?? (string)$card->conduct) . '</td></tr>';
        $html .= '<tr><td><strong>Effort</strong></td><td>' . s($conductlabels[(string)$card->effort] ?? (string)$card->effort) . '</td></tr>';
        $html .= '</table>';
        if (trim((string)$card->teacher_narrative) !== '') {
            $html .= '<h3 style="font-size:14px;">Teacher comments</h3><p>' . nl2br(s((string)$card->teacher_narrative)) . '</p>';
        }
        if (trim((string)$card->head_comment) !== '') {
            $html .= '<h3 style="font-size:14px;">Head of school</h3><p>' . nl2br(s((string)$card->head_comment)) . '</p>';
        }
    }
}
$note = trim((string)($payload['note'] ?? ''));
if ($note !== '') {
    $html .= '<h2 style="font-size:15px;">Notes</h2><p>' . nl2br(s($note)) . '</p>';
}
$html .= '<p style="font-size:10px;color:#58665c;">Generated by Pre-Quraan document management. This PDF should be matched against the document key and workspace audit record.</p>';

$pdf = new pdf(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8');
$pdf->SetCreator('Pre-Quraan');
$pdf->SetAuthor('Pre-Quraan');
$pdf->SetTitle($title);
$pdf->SetMargins(14, 14, 14);
$pdf->SetFooterMargin(10);
$pdf->SetAutoPageBreak(true, 18);
$pdf->setPrintHeader(false);
$pdf->setPrintFooter(true);
$pdf->AddPage();
$pdf->writeHTML($html, true, false, true, false, '');
$bytes = $pdf->Output('', 'S');
$hash = hash('sha256', $bytes);
if ((string)$row->pdfhash === '') {
    $row->pdfhash = $hash;
    $row->timemodified = time();
    $DB->update_record('local_prequran_generated_doc', $row);
}
if ($document) {
    pqwdoc_document_audit($workspaceid, (int)$document->id, (int)$USER->id, 'generated_pdf_downloaded', ['generatedid' => $generatedid, 'pdfhash' => $hash]);
}

$filename = clean_filename(strtolower((string)$row->doc_type) . '-' . ($documentkey !== '' ? $documentkey : (string)$generatedid) . '.pdf');
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . strlen($bytes));
echo $bytes;
