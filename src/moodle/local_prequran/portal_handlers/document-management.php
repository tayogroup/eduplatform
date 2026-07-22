<?php
// ---- report: document-management (workspace document register + verification) --
// Ported from local_hubredirect/document_management.php via
// document_management_portallib (guard-only; that page defines no functions of
// its own — every helper is a shared pqh_/pqwdoc_ function from the libraries
// below). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the workspace document register + generated-PDF registry + document
//        audit trail + upload/register form options, decorated as the legacy
//        page renders them (download links stay wwwroot-absolute → legacy).
// POST = do=verify_document | register_generated — each the legacy
//        action=... write VERBATIM (same optional_param fields, inserts/updates,
//        audit calls, messages). require_sesskey() dropped: token auth replaces
//        the session key. do=upload_document is SKIPPED (multipart file upload —
//        $_FILES['document_file'] cannot ride a JSON POST; uploads + file
//        serving (document_pdf.php) stay on the legacy page).
//
// The legacy page never calls pqh_live_security_audit, so there is none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workflow_documentlib.php');
require_once($CFG->dirroot . '/local/hubredirect/document_management_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
    // The verbatim write bodies below read every field through optional_param()
    // (i.e. $_POST/$_GET). Populate $_POST from the JSON body so those legacy
    // reads run unchanged. Scalars only; PARAM cleaning happens at each read.
    foreach ($body as $k => $v) {
        if (is_scalar($v)) {
            $_POST[$k] = (string)$v;
        }
    }
}

// -- workspace resolution + entry access check (same order and messages as the
// -- legacy page). File download/serving stays on document_pdf.php (out of scope).
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    // Legacy: pqh_access_denied('Document management requires workspace
    // administrator access.', ...) — delivered here as JSON.
    pqpd_fail(403, 'Document management requires workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];

if ($ispost) {
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    $do = $action !== '' ? $action : clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $message = '';
    try {
        // Legacy gate for every write: document schema must be upgraded.
        if (!pqwdoc_ready()) {
            throw new invalid_parameter_exception('Document tables are not ready. Run Moodle upgrade.');
        }
        $now = time();
        if ($do === 'upload_document') {
            // -- write: upload_document -- SKIPPED (multipart file upload). The
            // legacy handler reads $_FILES['document_file'] via
            // pqwdoc_upload_info()/pqwdoc_store_upload(); a JSON POST cannot
            // carry the file. Secure uploads stay on the legacy page.
            pqpd_fail(400, 'Uploading a document (with its file) is only available on the legacy document management page.');
        } else if ($do === 'verify_document') {
            // -- write: verify_document (legacy action=verify_document, verbatim) --
            $document = $DB->get_record('local_prequran_document', ['id' => optional_param('documentid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $old = ['verification_status' => (string)$document->verification_status, 'status' => (string)$document->status];
            $document->verification_status = optional_param('verification_status', 'verified', PARAM_ALPHANUMEXT);
            $document->status = optional_param('status', 'active', PARAM_ALPHANUMEXT);
            $document->verifiedby = (int)$USER->id;
            $document->verifiedat = $now;
            $document->expiresat = pqwdoc_date_to_time(optional_param('expiresat', '', PARAM_TEXT)) ?: (int)$document->expiresat;
            $document->metadatajson = pqwdoc_json(['verification_note' => optional_param('verification_note', '', PARAM_TEXT)]);
            $document->timemodified = $now;
            $DB->update_record('local_prequran_document', $document);
            pqwdoc_document_audit($workspaceid, (int)$document->id, (int)$USER->id, 'document_verification_updated', $old + ['note' => optional_param('verification_note', '', PARAM_TEXT)]);
            $message = 'Document verification updated.';
        } else if ($do === 'register_generated') {
            // -- write: register_generated (legacy action=register_generated, verbatim) --
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $doctype = optional_param('doc_type', 'certificate', PARAM_ALPHANUMEXT);
            $source = optional_param('source_type', 'certificate', PARAM_ALPHANUMEXT);
            $sourceid = optional_param('source_id', 0, PARAM_INT);
            $key = optional_param('document_key', strtoupper($doctype) . '-' . date('YmdHis'), PARAM_TEXT);
            $documentid = (int)$DB->insert_record('local_prequran_document', (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'ownerid' => $studentid,
                'document_type' => $doctype,
                'title' => optional_param('title', ucfirst($doctype), PARAM_TEXT),
                'document_number' => $key,
                'status' => 'generated',
                'verification_status' => 'system_generated',
                'verifiedby' => (int)$USER->id,
                'verifiedat' => $now,
                'issuedat' => pqwdoc_date_to_time(optional_param('issuedat', '', PARAM_TEXT)) ?: $now,
                'expiresat' => pqwdoc_date_to_time(optional_param('expiresat', '', PARAM_TEXT)),
                'filename' => '',
                'mimetype' => 'application/pdf',
                'filesize' => 0,
                'contenthash' => '',
                'source_type' => $source,
                'source_id' => $sourceid,
                'metadatajson' => pqwdoc_json(['source_note' => optional_param('source_note', '', PARAM_TEXT)]),
                'uploadedby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $generatedid = (int)$DB->insert_record('local_prequran_generated_doc', (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'documentid' => $documentid,
                'doc_type' => $doctype,
                'source_type' => $source,
                'source_id' => $sourceid,
                'document_key' => $key,
                'status' => optional_param('status', 'ready', PARAM_ALPHANUMEXT),
                'payloadjson' => pqwdoc_json(['title' => optional_param('title', ucfirst($doctype), PARAM_TEXT), 'note' => optional_param('source_note', '', PARAM_TEXT)]),
                'pdfhash' => optional_param('pdfhash', '', PARAM_TEXT),
                'download_url' => optional_param('download_url', '', PARAM_URL),
                'generatedby' => (int)$USER->id,
                'generatedat' => $now,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            pqwdoc_document_audit($workspaceid, $documentid, (int)$USER->id, 'generated_pdf_registered', ['generatedid' => $generatedid, 'source_type' => $source, 'source_id' => $sourceid]);
            $message = 'Generated PDF registry row created.';
        } else {
            pqpd_fail(400, 'Unknown document-management action.');
        }
    } catch (Throwable $e) {
        // Legacy catches every write error and shows it as the page alert —
        // same message text, delivered as JSON.
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the document register + generated PDFs + audit trail exactly as the
// -- legacy page builds them (same queries, order, limits). ------------------
$students = pqwdoc_workspace_students($workspaceid);
$staff = pqwdoc_workspace_staff($workspaceid);
$documents = pqh_table_exists_safe('local_prequran_document') ? array_values($DB->get_records_sql("SELECT d.*, su.firstname AS sfirst, su.lastname AS slast, vu.firstname AS vfirst, vu.lastname AS vlast FROM {local_prequran_document} d LEFT JOIN {user} su ON su.id = d.studentid LEFT JOIN {user} vu ON vu.id = d.verifiedby WHERE d.workspaceid = :workspaceid ORDER BY d.timemodified DESC", ['workspaceid' => $workspaceid], 0, 120)) : [];
$generated = pqh_table_exists_safe('local_prequran_generated_doc') ? array_values($DB->get_records('local_prequran_generated_doc', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$audits = pqh_table_exists_safe('local_prequran_document_audit') ? array_values($DB->get_records_sql("SELECT a.*, u.firstname, u.lastname FROM {local_prequran_document_audit} a LEFT JOIN {user} u ON u.id = a.actorid WHERE a.workspaceid = :workspaceid ORDER BY a.timecreated DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$now = time();
$expiring = 0;
foreach ($documents as $document) {
    if ((int)$document->expiresat > 0 && (int)$document->expiresat <= $now + (30 * DAYSECS) && (string)$document->status !== 'archived') {
        $expiring++;
    }
}

// Decorate documents with the client-facing shape (student name + verbatim
// download URL the legacy page renders). pqwdoc_download_url() is a
// wwwroot-absolute Moodle pluginfile link (secure file serving stays legacy).
$documentsout = [];
foreach ($documents as $document) {
    $download = pqwdoc_download_url($document);
    $documentsout[] = [
        'id' => (int)$document->id,
        'title' => (string)$document->title,
        'document_type' => (string)$document->document_type,
        'document_number' => (string)$document->document_number,
        'filename' => (string)$document->filename,
        'studentname' => trim((string)$document->sfirst . ' ' . (string)$document->slast),
        'verification_status' => (string)$document->verification_status,
        'status' => (string)$document->status,
        'expiresat' => (int)$document->expiresat,
        'expireslabel' => (int)$document->expiresat > 0 ? userdate((int)$document->expiresat, '%Y-%m-%d') : 'never',
        'download' => $download,
    ];
}

// Generated PDFs: the "Generate PDF" action stays on the legacy document_pdf.php
// endpoint (wwwroot-absolute — file serving is out of scope).
$generatedout = [];
foreach ($generated as $row) {
    $generatedout[] = [
        'id' => (int)$row->id,
        'document_key' => (string)$row->document_key,
        'doc_type' => (string)$row->doc_type,
        'source_type' => (string)$row->source_type,
        'source_id' => (int)$row->source_id,
        'download_url' => (string)$row->download_url,
        'status' => (string)$row->status,
        'pdfurl' => (new moodle_url('/local/hubredirect/document_pdf.php', ['generatedid' => (int)$row->id]))->out(false),
    ];
}

$auditsout = [];
foreach ($audits as $audit) {
    $auditsout[] = [
        'documentid' => (int)$audit->documentid,
        'actor' => trim((string)$audit->firstname . ' ' . (string)$audit->lastname),
        'timecreated' => (int)$audit->timecreated,
        'timelabel' => userdate((int)$audit->timecreated),
        'action' => (string)$audit->action,
    ];
}

$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = ['id' => (int)$student->id, 'label' => fullname($student)];
}
$staffout = [];
foreach ($staff as $user) {
    $staffout[] = ['id' => (int)$user->id, 'label' => fullname($user) . ' / ' . (string)$user->workspace_role];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'schemaready' => pqwdoc_ready(),
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'metrics' => [
        'documents' => count($documents),
        'expiring' => (int)$expiring,
        'generated' => count($generated),
    ],
    'documents' => $documentsout,
    'generated' => $generatedout,
    'audits' => $auditsout,
    'students' => $studentsout,
    'staff' => $staffout,
    // Uploading a document is a multipart file upload — unavailable in the portal.
    'canupload' => false,
    'legacyurl' => (new moodle_url('/local/hubredirect/document_management.php', $urlparams))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
