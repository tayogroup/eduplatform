<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_transcriptlib.php');

function pqctx_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}

function pqctx_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : '';
}

function pqctx_payload_lines_csv(array $payload, string $filename): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . clean_filename($filename) . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['student', 'account_no', 'course', 'course_key', 'status', 'grade', 'completion', 'attendance', 'teacher', 'warning_count']);
    $student = $payload['header']['student'] ?? [];
    foreach (($payload['lines'] ?? []) as $line) {
        $teachers = array_filter(array_map(static function(array $teacher): string {
            return (string)($teacher['name'] ?? '');
        }, $line['teachers'] ?? []));
        fputcsv($out, [
            (string)($student['name'] ?? ''),
            (string)($student['account_no'] ?? ''),
            (string)($line['course']['title'] ?? ''),
            (string)($line['course']['key'] ?? ''),
            pqctx_label((string)($line['status']['normalized'] ?? '')),
            (string)($line['display']['grade'] ?? 'Not recorded'),
            (string)($line['display']['completion'] ?? 'Not recorded'),
            (string)($line['display']['attendance'] ?? 'Not recorded'),
            implode(', ', $teachers),
            count($line['warnings'] ?? []),
        ]);
    }
    fclose($out);
    exit;
}

function pqctx_docs_csv(array $docs, string $filename): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . clean_filename($filename) . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['documentid', 'workspaceid', 'studentid', 'status', 'policyversion', 'policyhash', 'snapshothash', 'pdfhash', 'issuedby', 'issuedat']);
    foreach ($docs as $doc) {
        fputcsv($out, [
            (string)$doc->documentid,
            (int)$doc->workspaceid,
            (int)$doc->studentid,
            (string)$doc->status,
            (int)$doc->policyversion,
            (string)$doc->policyhash,
            (string)$doc->snapshothash,
            (string)($doc->pdfhash ?? ''),
            (int)$doc->issuedby,
            pqctx_date((int)$doc->issuedat),
        ]);
    }
    fclose($out);
    exit;
}

function pqctx_pdf_html(array $payload, string $title, string $documentid, string $verificationurl): string {
    $header = $payload['header'] ?? [];
    $student = $header['student'] ?? [];
    $workspace = $header['workspace'] ?? [];
    $consumer = $header['consumer'] ?? [];
    $document = $payload['document'] ?? [];
    $support = (string)($consumer['supportemail'] ?? '');
    $issued = (int)($document['issuedat'] ?? ($header['generated_at'] ?? time()));
    $doclabel = $documentid !== '' ? $documentid : 'Unofficial live preview';

    $html = '<style>
        body{font-family:dejavusans,sans-serif;color:#173044;font-size:10pt}
        h1{font-size:22pt;color:#221b22;margin:0 0 6px} h2{font-size:13pt;color:#221b22;margin:18px 0 8px}
        .muted{color:#5e7280}.meta{width:100%;border-collapse:collapse;margin:12px 0}.meta td{border:1px solid #d9e2e7;padding:7px}
        .lines{width:100%;border-collapse:collapse;margin-top:8px}.lines th{background:#eef4f6;color:#173044;font-weight:bold}.lines th,.lines td{border:1px solid #d9e2e7;padding:6px;vertical-align:top}
        .note{margin-top:14px;padding:8px;border:1px solid #d9e2e7;background:#f7fafb}.small{font-size:8pt}
    </style>';
    $html .= '<h1>' . s($title) . '</h1>';
    $html .= '<div class="muted">' . s((string)($consumer['name'] ?? '')) . ' / ' . s((string)($workspace['name'] ?? '')) . '</div>';
    $html .= '<table class="meta">';
    $html .= '<tr><td><b>Student</b><br>' . s((string)($student['name'] ?? '')) . '</td><td><b>Account No.</b><br>' . s((string)($student['account_no'] ?? '')) . '</td></tr>';
    $html .= '<tr><td><b>Document</b><br>' . s($doclabel) . '</td><td><b>Date</b><br>' . s(pqctx_date($issued)) . '</td></tr>';
    $html .= '<tr><td><b>Support</b><br>' . s($support) . '</td><td><b>Verification</b><br>' . s($verificationurl) . '</td></tr>';
    $html .= '</table>';
    $html .= '<h2>Course Lines</h2><table class="lines"><thead><tr><th>Course</th><th>Status</th><th>Grade</th><th>Completion</th><th>Attendance</th></tr></thead><tbody>';
    foreach (($payload['lines'] ?? []) as $line) {
        $html .= '<tr>';
        $html .= '<td>' . s((string)($line['course']['title'] ?? 'Course')) . '<br><span class="small muted">' . s((string)($line['course']['key'] ?? '')) . '</span></td>';
        $html .= '<td>' . s(pqctx_label((string)($line['status']['normalized'] ?? ''))) . '</td>';
        $html .= '<td>' . s((string)($line['display']['grade'] ?? 'Not recorded')) . '</td>';
        $html .= '<td>' . s((string)($line['display']['completion'] ?? 'Not recorded')) . '</td>';
        $html .= '<td>' . s((string)($line['display']['attendance'] ?? 'Not recorded')) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody></table>';
    $html .= '<div class="note small">Confidential academic record. Official PDFs are valid only with a matching document ID and verification status. Page numbers are printed in the PDF footer.</div>';
    return $html;
}

function pqctx_send_pdf(array $payload, string $filename, string $title, string $documentid, string $verificationurl): string {
    global $CFG;

    $pdflib = $CFG->libdir . '/pdflib.php';
    if (!file_exists($pdflib)) {
        throw new invalid_parameter_exception('PDF library is not available in this Moodle installation.');
    }
    require_once($pdflib);
    if (!class_exists('pdf')) {
        throw new invalid_parameter_exception('PDF library is not available.');
    }
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
    $pdf->writeHTML(pqctx_pdf_html($payload, $title, $documentid, $verificationurl), true, false, true, false, '');
    $bytes = $pdf->Output('', 'S');
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . clean_filename($filename) . '"');
    header('Content-Length: ' . strlen($bytes));
    echo $bytes;
    return $bytes;
}

global $DB, $USER;

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$type = optional_param('type', 'unofficial', PARAM_ALPHA);
$format = optional_param('format', 'pdf', PARAM_ALPHA);
$studentid = optional_param('studentid', 0, PARAM_INT);
$documentid = trim(optional_param('documentid', '', PARAM_TEXT));

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

if ($type === 'documents') {
    if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
        pqh_access_denied('Only workspace admins can export issued transcript documents.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Transcript export access required');
    }
    pqco_course_audit('transcript_documents_csv_exported', 'workspace', $workspaceid, ['workspaceid' => $workspaceid]);
    pqctx_docs_csv(pqct_workspace_official_docs($workspaceid), 'transcript-documents-' . $workspaceid . '-' . date('Ymd-His') . '.csv');
}

if ($type === 'official') {
    if ($documentid === '' || !pqct_document_schema_ready()) {
        pqh_access_denied('Choose an issued official transcript before exporting.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Official transcript required');
    }
    $doc = $DB->get_record('local_prequran_transcript_doc', ['documentid' => $documentid], '*', IGNORE_MISSING);
    if (!$doc || !pqct_user_can_download_official_doc($doc, (int)$USER->id)) {
        pqh_access_denied('You cannot export this official transcript.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Official transcript export access required');
    }
    $payload = pqct_official_doc_payload($doc);
    $verificationurl = pqct_verification_url($consumercontext, $documentid, pqct_verification_code($doc));
    if ($format === 'csv') {
        pqco_course_audit('official_transcript_csv_exported', 'transcript_doc', (int)$doc->id, ['workspaceid' => (int)$doc->workspaceid, 'studentid' => (int)$doc->studentid, 'documentid' => $documentid]);
        pqctx_payload_lines_csv($payload, 'official-transcript-' . $documentid . '.csv');
    }
    pqco_course_audit('official_transcript_pdf_exported', 'transcript_doc', (int)$doc->id, ['workspaceid' => (int)$doc->workspaceid, 'studentid' => (int)$doc->studentid, 'documentid' => $documentid]);
    $bytes = pqctx_send_pdf($payload, 'official-transcript-' . $documentid . '.pdf', 'Official Transcript', $documentid, $verificationurl);
    pqct_mark_official_pdf_generated($doc, $bytes);
    exit;
}

if ($workspaceid <= 0 || $studentid <= 0 || !pqct_user_can_view_student_transcript((int)$USER->id, $studentid, $workspaceid)) {
    pqh_access_denied('You cannot export this unofficial transcript.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams), 'Unofficial transcript export access required');
}
$payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
    'viewerid' => (int)$USER->id,
    'include_internal' => false,
]);
$policy = $payload['policy']['policy'] ?? ($payload['header']['policy']['settings'] ?? []);
$permission = (string)($policy['unofficial_pdf_permission'] ?? 'workspace_admin');
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
if ($format === 'csv') {
    if (!$canmanage) {
        pqh_access_denied('Only workspace admins can export transcript line CSV files.', new moodle_url('/local/hubredirect/course_transcript.php', $baseparams + ['studentid' => $studentid]), 'Transcript CSV export access required');
    }
    pqco_course_audit('unofficial_transcript_csv_exported', 'student', $studentid, ['workspaceid' => $workspaceid, 'studentid' => $studentid]);
    pqctx_payload_lines_csv($payload, 'unofficial-transcript-' . $studentid . '-' . date('Ymd-His') . '.csv');
}
if ($permission === 'disabled' || ($permission === 'workspace_admin' && !$canmanage)) {
    pqh_access_denied('Unofficial PDF export is disabled by this workspace transcript policy.', new moodle_url('/local/hubredirect/course_transcript.php', $baseparams + ['studentid' => $studentid]), 'Unofficial PDF unavailable');
}
pqco_course_audit('unofficial_transcript_pdf_exported', 'student', $studentid, ['workspaceid' => $workspaceid, 'studentid' => $studentid]);
pqctx_send_pdf($payload, 'unofficial-transcript-' . $studentid . '-' . date('Ymd-His') . '.pdf', 'Unofficial Transcript', '', '');
exit;
