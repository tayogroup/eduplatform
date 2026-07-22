<?php
// Portal handler: course-transcript-export (unofficial/official/documents
// transcript exports). Ported from local_hubredirect/course_transcript_export.php,
// which stays live in parallel. Runs from portal_data.php AFTER token auth:
// $claims verified, $USER set to the token user, JSON exception handler
// installed, CORS headers sent.
//
//   GET ?report=course-transcript-export&token=…&type=unofficial|official|documents
//        &format=csv|pdf[&studentid=&documentid=&workspaceid=&consumer=]
//
// CSV requests return the exact legacy dataset (same columns, same formatted
// values, same clean_filename() name) as JSON; the portal page builds the
// identical CSV client-side (quality-analytics pattern). The matching
// *_csv_exported audit is written here, when the dataset is served.
// PDF generation is NOT ported: pqctx_pdf_html/pqctx_send_pdf stay legacy-only
// and PDF requests return the absolute legacy export URL instead (the legacy
// page writes its own *_pdf_exported audit + pqct_mark_official_pdf_generated
// when that URL is opened, so neither is duplicated here).
// Read-only: the legacy page has no form writes, so POST answers 400.
// (course_transcript_export.php has no pqh_live_security_audit calls — none to
// keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcriptlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcript_uilib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The transcript export report is read-only.');
}

// ---- request parameters (verbatim reads from the page) -----------------------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
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

// Same rows as pqctx_payload_lines_csv() (not ported — CSV is built
// client-side from this dataset).
function pqctxh_payload_lines_dataset(array $payload, string $filename): array {
    $rows = [];
    $student = $payload['header']['student'] ?? [];
    foreach (($payload['lines'] ?? []) as $line) {
        $teachers = array_filter(array_map(static function(array $teacher): string {
            return (string)($teacher['name'] ?? '');
        }, $line['teachers'] ?? []));
        $rows[] = [
            (string)($student['name'] ?? ''),
            (string)($student['account_no'] ?? ''),
            (string)($line['course']['title'] ?? ''),
            (string)($line['course']['key'] ?? ''),
            pqctxl_label((string)($line['status']['normalized'] ?? '')),
            (string)($line['display']['grade'] ?? 'Not recorded'),
            (string)($line['display']['completion'] ?? 'Not recorded'),
            (string)($line['display']['attendance'] ?? 'Not recorded'),
            implode(', ', $teachers),
            count($line['warnings'] ?? []),
        ];
    }
    return [
        'filename' => clean_filename($filename),
        'headers' => ['student', 'account_no', 'course', 'course_key', 'status', 'grade', 'completion', 'attendance', 'teacher', 'warning_count'],
        'rows' => $rows,
    ];
}

// Same rows as pqctx_docs_csv() (not ported — CSV is built client-side).
function pqctxh_docs_dataset(array $docs, string $filename): array {
    $rows = [];
    foreach ($docs as $doc) {
        $rows[] = [
            (string)$doc->documentid,
            (int)$doc->workspaceid,
            (int)$doc->studentid,
            (string)$doc->status,
            (int)$doc->policyversion,
            (string)$doc->policyhash,
            (string)$doc->snapshothash,
            (string)($doc->pdfhash ?? ''),
            (int)$doc->issuedby,
            pqctxl_date((int)$doc->issuedat),
        ];
    }
    return [
        'filename' => clean_filename($filename),
        'headers' => ['documentid', 'workspaceid', 'studentid', 'status', 'policyversion', 'policyhash', 'snapshothash', 'pdfhash', 'issuedby', 'issuedat'],
        'rows' => $rows,
    ];
}

// ---- type=documents: workspace admin CSV of issued docs (verbatim gate) ------
if ($type === 'documents') {
    if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
        pqpd_fail(403, 'Only workspace admins can export issued transcript documents.');
    }
    pqco_course_audit('transcript_documents_csv_exported', 'workspace', $workspaceid, ['workspaceid' => $workspaceid]);
    echo json_encode([
        'ok' => true, 'mode' => 'csv', 'export' => 'documents',
        'csv' => pqctxh_docs_dataset(pqct_workspace_official_docs($workspaceid), 'transcript-documents-' . $workspaceid . '-' . date('Ymd-His') . '.csv'),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- type=official: issued snapshot export (verbatim gates) ------------------
if ($type === 'official') {
    if ($documentid === '' || !pqct_document_schema_ready()) {
        pqpd_fail(403, 'Choose an issued official transcript before exporting.');
    }
    $doc = $DB->get_record('local_prequran_transcript_doc', ['documentid' => $documentid], '*', IGNORE_MISSING);
    if (!$doc || !pqct_user_can_download_official_doc($doc, $userid)) {
        pqpd_fail(403, 'You cannot export this official transcript.');
    }
    $payload = pqct_official_doc_payload($doc);
    $verificationurl = pqct_verification_url($consumercontext, $documentid, pqct_verification_code($doc));
    if ($format === 'csv') {
        pqco_course_audit('official_transcript_csv_exported', 'transcript_doc', (int)$doc->id, ['workspaceid' => (int)$doc->workspaceid, 'studentid' => (int)$doc->studentid, 'documentid' => $documentid]);
        echo json_encode([
            'ok' => true, 'mode' => 'csv', 'export' => 'official',
            'documentid' => $documentid,
            'verificationurl' => $verificationurl,
            'csv' => pqctxh_payload_lines_dataset($payload, 'official-transcript-' . $documentid . '.csv'),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }
    // PDF generation skipped by design — legacy URL keeps the audit + bytes.
    echo json_encode([
        'ok' => true, 'mode' => 'pdf', 'export' => 'official',
        'documentid' => $documentid,
        'verificationurl' => $verificationurl,
        'pdfurl' => (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['type' => 'official', 'format' => 'pdf', 'documentid' => $documentid]))->out(false),
        'note' => 'Official PDF generation stays on the legacy page (parallel-run); open the PDF link to download it.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- default: unofficial export (verbatim gates + policy checks) -------------
if ($workspaceid <= 0 || $studentid <= 0 || !pqct_user_can_view_student_transcript($userid, $studentid, $workspaceid)) {
    pqpd_fail(403, 'You cannot export this unofficial transcript.');
}
$payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
    'viewerid' => $userid,
    'include_internal' => false,
]);
$policy = $payload['policy']['policy'] ?? ($payload['header']['policy']['settings'] ?? []);
$permission = (string)($policy['unofficial_pdf_permission'] ?? 'workspace_admin');
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
if ($format === 'csv') {
    if (!$canmanage) {
        pqpd_fail(403, 'Only workspace admins can export transcript line CSV files.');
    }
    pqco_course_audit('unofficial_transcript_csv_exported', 'student', $studentid, ['workspaceid' => $workspaceid, 'studentid' => $studentid]);
    echo json_encode([
        'ok' => true, 'mode' => 'csv', 'export' => 'unofficial',
        'studentid' => $studentid,
        'csv' => pqctxh_payload_lines_dataset($payload, 'unofficial-transcript-' . $studentid . '-' . date('Ymd-His') . '.csv'),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}
if ($permission === 'disabled' || ($permission === 'workspace_admin' && !$canmanage)) {
    pqpd_fail(403, 'Unofficial PDF export is disabled by this workspace transcript policy.');
}
// PDF generation skipped by design — legacy URL keeps the audit + bytes.
echo json_encode([
    'ok' => true, 'mode' => 'pdf', 'export' => 'unofficial',
    'studentid' => $studentid,
    'pdfurl' => (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['studentid' => $studentid, 'type' => 'unofficial', 'format' => 'pdf']))->out(false),
    'note' => 'Unofficial PDF generation stays on the legacy page (parallel-run); open the PDF link to download it.',
], JSON_UNESCAPED_SLASHES);
exit;
