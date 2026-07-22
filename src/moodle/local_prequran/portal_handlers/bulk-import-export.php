<?php
// ---- report: bulk-import-export (workspace CSV import previews/commits + jobs) --
// Ported from local_hubredirect/bulk_import_export.php via
// bulk_import_export_portallib (guard-only; that page defines no functions of
// its own — every helper is a shared pqh_/pqdo_ function from the libraries
// below). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the import form options + export dataset options + auditable bulk-job
//        history, decorated as the legacy page renders them (+creator names).
// POST = do=process_import — the legacy action=process_import write VERBATIM
//        (same optional_param fields, CSV-text parse, member-row preview/commit,
//        bulk-job record, notice text). confirm_sesskey() dropped: token auth
//        replaces the session key. The CSV rows ride the JSON POST as pasted
//        text (PARAM_RAW_TRIMMED), NOT a file upload, so this write is portable.
//
// SKIPPED — CSV export (legacy GET export=csv): pqdo_emit_csv() streams a
// Content-Disposition:attachment file download (and records its own bulk job as
// a side effect). A file download cannot ride a JSON response, so CSV export
// stays on the legacy page (legacyurl below). The portal exposes the same
// dataset options read-only and links out for the actual download.
//
// The legacy page never calls pqh_live_security_audit, so there is none to keep.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/data_operationslib.php');
require_once($CFG->dirroot . '/local/hubredirect/bulk_import_export_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
    // The verbatim write body below reads every field through optional_param()
    // (i.e. $_POST/$_GET). Populate $_POST from the JSON body so those legacy
    // reads run unchanged. Scalars only; PARAM cleaning happens at each read.
    foreach ($body as $k => $v) {
        if (is_scalar($v)) {
            $_POST[$k] = (string)$v;
        }
    }
}

// -- workspace resolution + entry access check (same order and messages as the
// -- legacy page). CSV export (file download) stays on the legacy page. --------
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid <= 0
    || (!pqh_user_can_manage_workspace($userid, $workspaceid)
        && !pqh_user_has_workspace_capability($userid, $workspaceid, 'registrar.manage'))) {
    // Legacy: pqh_access_denied('Only workspace administrators can manage bulk
    // import/export tools.', ...) — delivered here as JSON.
    pqpd_fail(403, 'Only workspace administrators can manage bulk import/export tools.');
}
if (!pqdo_schema_ready()) {
    // Legacy: pqh_access_denied('Bulk import/export schema is not ready. Run the
    // local_prequran upgrade first.', ...) — delivered here as JSON.
    pqpd_fail(403, 'Bulk import/export schema is not ready. Run the local_prequran upgrade first.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if ($ispost) {
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    $do = $action !== '' ? $action : clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $notice = '';
    try {
        if ($do === 'process_import') {
            // -- write: process_import (legacy action=process_import, verbatim) --
            $text = optional_param('csv_rows', '', PARAM_RAW_TRIMMED);
            $commit = optional_param('commit', 0, PARAM_INT) === 1;
            $rows = pqdo_parse_csv_text($text);
            $result = pqdo_process_member_rows($workspaceid, $rows, $commit, $userid);
            $jobid = pqdo_record_bulk_job($workspaceid, $consumercontext, $userid, $commit ? 'import_commit' : 'import_preview', 'members', $text, $result);
            $notice = 'Bulk job #' . $jobid . ' processed: ' . (int)$result['success'] . ' success, ' . (int)$result['errors'] . ' error(s).';
            echo json_encode([
                'ok' => true,
                'message' => $notice,
                'workspaceid' => $workspaceid,
                'jobid' => (int)$jobid,
                'result' => [
                    'total' => (int)($result['total'] ?? 0),
                    'success' => (int)($result['success'] ?? 0),
                    'errors' => (int)($result['errors'] ?? 0),
                    'messages' => array_values($result['messages'] ?? []),
                ],
                'committed' => $commit,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'export' || $do === 'export_csv') {
            // -- write: CSV export -- SKIPPED (file download). pqdo_emit_csv()
            // streams a Content-Disposition:attachment file; it cannot ride a
            // JSON response. CSV export stays on the legacy page.
            pqpd_fail(400, 'CSV export is a file download — use the legacy bulk import/export page.');
        }
        pqpd_fail(400, 'Unknown bulk-import-export action.');
    } catch (Throwable $e) {
        // Legacy catches every write error and shows it as the page alert —
        // same message text, delivered as JSON.
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: import form options + export dataset options + auditable bulk-job
// -- history exactly as the legacy page builds them (same filter, order, limit;
// -- +creator names). CSV export downloads stay on the legacy page. -----------
$jobsrows = pqh_table_exists_safe('local_prequran_bulk_job')
    ? array_values($DB->get_records_sql(
        "SELECT j.*, u.firstname, u.lastname
           FROM {local_prequran_bulk_job} j
      LEFT JOIN {user} u ON u.id = j.createdby
          WHERE j.workspaceid = :workspaceid
       ORDER BY j.timecreated DESC, j.id DESC",
        ['workspaceid' => $workspaceid], 0, 100))
    : [];

$jobsout = [];
foreach ($jobsrows as $job) {
    $jobsout[] = [
        'jobnumber' => (string)$job->jobnumber,
        'jobtype' => (string)$job->jobtype,
        'dataset' => (string)$job->dataset,
        'status' => (string)$job->status,
        'successrows' => (int)$job->successrows,
        'errorrows' => (int)$job->errorrows,
        'timecreated' => (int)$job->timecreated,
        'timelabel' => userdate((int)$job->timecreated),
        'createdby' => trim((string)$job->firstname . ' ' . (string)$job->lastname),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    // Import: member CSV rows are pasted as text and previewed/committed here.
    'importdataset' => 'members',
    'roles' => ['owner', 'admin', 'teacher', 'assistant_teacher', 'coordinator', 'registrar', 'finance', 'support', 'auditor', 'sponsor', 'parent', 'student'],
    // Export dataset options are the legacy <select> choices; the actual CSV
    // download (Content-Disposition:attachment) stays on the legacy page.
    'exportdatasets' => [
        ['value' => 'members', 'label' => 'Workspace members'],
        ['value' => 'invoices', 'label' => 'Invoices'],
        ['value' => 'documents', 'label' => 'Documents'],
    ],
    'canexport' => false,
    'jobs' => $jobsout,
    // Absolute legacy page URL; the portal appends &dataset=…&export=csv for the
    // actual file download (which cannot ride this JSON response).
    'legacyurl' => (new moodle_url('/local/hubredirect/bulk_import_export.php', $urlparams))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
