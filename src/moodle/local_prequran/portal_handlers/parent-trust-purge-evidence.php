<?php
// ---- report: parent-trust-purge-evidence (SQA purge recovery snapshot) ----------
// Ported from local_hubredirect/live_parent_trust_purge_evidence.php via
// live_parent_trust_purge_evidence_portallib (pqlptpel_*). Included from
// portal_data.php AFTER token auth: $claims verified, $USER set to the token
// user, JSON exception handler installed, headers sent.
// This is the admin recovery/evidence review for ONE purge audit row (?id=): the
// purge run summary, evidence snapshot metrics, action/reason counts, sample
// rows, and the access-&-export audit trail the page renders on screen.
// GET  = that dataset (and the verbatim per-view compliance audit write).
// POST = do=export: records the verbatim export audit (format + required reason)
//        and returns the artifact dataset; the Bunny page builds the JSON/CSV
//        file client-side (the legacy page's file-download transport is replaced).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_security.php');
require_once($CFG->dirroot . '/local/hubredirect/live_parent_trust_purge_evidence_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$body = [];
if ($method === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- access: same siteadmin gate as the page. pqh_live_security_deny(...) is kept
//    as its security audit + pqpd_fail(403, same message) (deny render dropped). --
if (!is_siteadmin($USER)) {
    pqh_live_security_audit('purge_evidence_access_denied', 'parent_trust_purge_evidence', 0, [
        'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    pqpd_fail(403, 'Only site administrators can view parent trust purge evidence.');
}

// id resolves the same way the page does (query on GET, JSON body on POST).
$id = $method === 'POST'
    ? (int)($body['id'] ?? 0)
    : optional_param('id', 0, PARAM_INT);
if ($id <= 0) {
    pqpd_fail(403, 'Choose a valid parent trust purge evidence record before opening this page.');
}

if (!pqlptpel_table_exists('local_prequran_live_audit')) {
    pqpd_fail(403, 'The live audit table is not installed, so purge evidence is not available yet.');
}

$record = $DB->get_record('local_prequran_live_audit', ['id' => $id], '*', IGNORE_MISSING);
if (!$record) {
    pqpd_fail(403, 'That parent trust purge evidence record is no longer available.');
}
$allowedactions = [
    'parent_trust_purge_blocked',
    'parent_trust_purge_started',
    'parent_trust_purge_completed',
];
if (!in_array((string)$record->action, $allowedactions, true)) {
    // Verbatim pqh_live_security_deny audit; deny render -> pqpd_fail(403, same).
    pqh_live_security_audit('purge_evidence_invalid_record_denied', 'audit', (int)$record->id, [
        'source_action' => (string)$record->action,
        'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    pqpd_fail(403, 'This audit row is not a parent trust purge evidence record.');
}

$details = pqlptpel_decode_details((string)$record->details);
$evidence = isset($details['evidence_snapshot']) && is_array($details['evidence_snapshot']) ? $details['evidence_snapshot'] : [];

// -- POST: do=export (legacy format=json|csv download, verbatim audit) --
// confirm_sesskey() dropped (token auth replaces the session key); the
// reason-required redirect becomes a JSON 400; the file itself is built by the
// client from the returned dataset.
if ($method === 'POST') {
    $do = (string)($body['do'] ?? '');
    if ($do === 'export') {
        $format = clean_param((string)($body['format'] ?? ''), PARAM_ALPHA);
        if ($format !== 'json' && $format !== 'csv') {
            pqpd_fail(400, 'Choose CSV or JSON export.');
        }
        $exportreason = pqh_live_security_clean_export_reason((string)($body['export_reason'] ?? ''));
        if ($exportreason === '') {
            pqpd_fail(400, 'Enter a compliance reason before downloading purge evidence.');
        }
        pqlptpel_audit('parent_trust_purge_evidence_exported', (int)$record->id, [
            'source_audit_id' => (int)$record->id,
            'source_action' => (string)$record->action,
            'format' => $format,
            'export_reason' => $exportreason,
            'record_id_count' => (int)($evidence['record_id_count'] ?? 0),
        ]);
        // The artifact dataset (mirrors pqlptpe_download_json's payload); the page
        // serialises this to .json (pretty) or renders the section/key/value CSV.
        echo json_encode([
            'ok' => true,
            'message' => 'Export logged to the audit trail.',
            'format' => $format,
            'export_reason' => $exportreason,
            'export' => [
                'audit_id' => (int)$record->id,
                'audit_action' => (string)$record->action,
                'purge_logged_at' => (int)$record->timecreated,
                'purge_logged_at_readable' => userdate((int)$record->timecreated, get_string('strftimedatetimeshort')),
                'admin_userid' => (int)$record->actorid,
                'admin_name' => pqlptpel_user_name((int)$record->actorid, 'Admin ' . (int)$record->actorid),
                'retention_days' => (int)($details['retention_days'] ?? 0),
                'export_confirmed' => !empty($details['export_confirmed']),
                'approval_ok' => !empty($details['approval_ok']),
                'candidate_count' => (int)($details['candidate_count'] ?? $details['eligible_count'] ?? 0),
                'deleted_count' => (int)($details['deleted_count'] ?? 0),
                'export_reason' => $exportreason,
                'details' => $details,
                'evidence_snapshot' => $evidence,
            ],
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }
    pqpd_fail(400, 'Unknown parent-trust-purge-evidence action.');
}

// -- GET: audit the view (verbatim), then return the on-screen dataset --
pqlptpel_audit('parent_trust_purge_evidence_viewed', (int)$record->id, [
    'source_audit_id' => (int)$record->id,
    'source_action' => (string)$record->action,
    'record_id_count' => (int)($evidence['record_id_count'] ?? 0),
]);

$sampleids = $evidence['sample_ids'] ?? ($details['sample_ids'] ?? []);
$sampleids = is_array($sampleids) ? array_map('intval', $sampleids) : [];
$recordids = $evidence['record_ids'] ?? [];
$recordids = is_array($recordids) ? array_map('intval', $recordids) : [];
$oldest = (int)($evidence['oldest_timecreated'] ?? 0);
$newest = (int)($evidence['newest_timecreated'] ?? 0);
$candidatecount = (int)($details['candidate_count'] ?? $details['eligible_count'] ?? 0);
$deletedcount = (int)($details['deleted_count'] ?? 0);
$blockreasons = $details['block_reasons'] ?? [];
$blockreasons = is_array($blockreasons) ? array_values($blockreasons) : [];
$accesshistory = array_values($DB->get_records_sql(
    "SELECT id, actorid, action, details, timecreated
       FROM {local_prequran_live_audit}
      WHERE targettype = :targettype
        AND targetid = :targetid
        AND action IN ('parent_trust_purge_evidence_viewed', 'parent_trust_purge_evidence_exported')
   ORDER BY timecreated DESC, id DESC",
    [
        'targettype' => 'parent_trust_purge_evidence',
        'targetid' => (int)$record->id,
    ],
    0,
    50
));

// Decorate action/reason counts (assoc -> ordered pairs the client renders raw).
$actioncounts = [];
foreach (($evidence['action_counts'] ?? []) as $action => $count) {
    $actioncounts[] = ['action' => (string)$action, 'count' => (int)$count];
}
$reasoncounts = [];
foreach (($evidence['reason_counts'] ?? []) as $reason => $count) {
    $reasoncounts[] = ['reason' => (string)$reason, 'count' => (int)$count];
}

$samples = [];
foreach (($evidence['sample_rows'] ?? []) as $sample) {
    $samples[] = [
        'id' => (int)($sample['id'] ?? 0),
        'action' => (string)($sample['action'] ?? ''),
        'actorid' => (int)($sample['actorid'] ?? 0),
        'targettype' => (string)($sample['targettype'] ?? ''),
        'targetid' => (int)($sample['targetid'] ?? 0),
        'timecreated' => (int)($sample['timecreated'] ?? 0),
        'time_label' => !empty($sample['timecreated']) ? userdate((int)$sample['timecreated'], get_string('strftimedatetimeshort')) : '',
        'reason' => (string)($sample['reason'] ?? ''),
        'case_status' => (string)($sample['case_status'] ?? ''),
        'support_case_id' => (int)($sample['support_case_id'] ?? 0),
    ];
}

$historyout = [];
$nameids = [(int)$record->actorid];
foreach ($accesshistory as $history) {
    $hdetails = pqlptpel_decode_details((string)$history->details);
    $nameids[] = (int)$history->actorid;
    $historyout[] = [
        'id' => (int)$history->id,
        'actorid' => (int)$history->actorid,
        'admin_name' => pqlptpel_user_name((int)$history->actorid, 'Admin ' . (int)$history->actorid),
        'action' => (string)$history->action,
        'timecreated' => (int)$history->timecreated,
        'time_label' => userdate((int)$history->timecreated, get_string('strftimedatetimeshort')),
        'format' => (string)($hdetails['format'] ?? ''),
        'export_reason' => (string)($hdetails['export_reason'] ?? ''),
        'record_id_count' => (int)($hdetails['record_id_count'] ?? 0),
    ];
}
foreach ($samples as $sample) {
    $nameids[] = (int)$sample['actorid'];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'record' => [
        'id' => (int)$record->id,
        'action' => (string)$record->action,
        'action_label' => str_replace('_', ' ', (string)$record->action),
        'timecreated' => (int)$record->timecreated,
        'timecreated_label' => userdate((int)$record->timecreated, get_string('strftimedatetimeshort')),
        'actorid' => (int)$record->actorid,
        'admin_name' => pqlptpel_user_name((int)$record->actorid, 'Admin ' . (int)$record->actorid),
    ],
    'has_evidence' => !empty($evidence),
    'summary' => [
        'candidate_count' => $candidatecount,
        'deleted_count' => $deletedcount,
        'retention_days' => (int)($details['retention_days'] ?? 0),
        'export_confirmed' => !empty($details['export_confirmed']),
        'approval_ok' => !empty($details['approval_ok']),
        'cutoff' => !empty($details['cutoff']) ? (int)$details['cutoff'] : 0,
        'cutoff_label' => !empty($details['cutoff']) ? userdate((int)$details['cutoff'], get_string('strftimedatetimeshort')) : '',
        'block_reasons' => $blockreasons,
        'sample_ids' => $sampleids,
        'record_ids' => $recordids,
        'record_id_count' => (int)($evidence['record_id_count'] ?? 0),
        'staff_count' => (int)($evidence['staff_count'] ?? 0),
        'student_count' => (int)($evidence['student_count'] ?? 0),
        'oldest' => $oldest,
        'oldest_label' => $oldest > 0 ? userdate($oldest, get_string('strftimedatetimeshort')) : '',
        'newest' => $newest,
        'newest_label' => $newest > 0 ? userdate($newest, get_string('strftimedatetimeshort')) : '',
    ],
    'actioncounts' => $actioncounts,
    'reasoncounts' => $reasoncounts,
    'samples' => $samples,
    'accesshistory' => $historyout,
    // Raw copies for the client-built export artifact (mirror the legacy payload).
    'details' => $details,
    'evidence' => $evidence,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
