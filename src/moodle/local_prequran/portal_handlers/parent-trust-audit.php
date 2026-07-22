<?php
// ---- report: parent-trust-audit (parent trust support audit log; read + admin resolve write) ----
// Ported from local_hubredirect/live_parent_trust_audit.php via
// live_parent_trust_audit_portallib (pqlpta_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent. Site-admin-only viewer of staff
// parent-dashboard preview audit rows (spots unusual support access patterns).
// GET  = what the page renders for the same filters: metrics, support case log,
//        staff/student access patterns, and preview history (+names).
// POST = do=resolve_support_case (the page's "Resolve" write, verbatim:
//        audit-only insert of parent_trust_support_case_resolved).
// (live_parent_trust_audit.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_parent_trust_audit_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from live_parent_trust_audit.php;
//    is_siteadmin gate, pqh_access_denied -> pqpd_fail(403, same message)) --
if (!is_siteadmin($USER)) {
    pqpd_fail(403, 'Only site administrators can review parent trust support access.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: resolve_support_case (legacy action=resolve_support_case, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'resolve_support_case') {
        $studentid = (int)($body['studentid'] ?? 0);
        if ($studentid <= 0) {
            pqpd_fail(403, 'Choose a valid student before resolving a parent trust support case.');
        }
        $note = clean_param((string)($body['resolution_note'] ?? ''), PARAM_TEXT);
        pqlpta_audit(0, 'parent_trust_support_case_resolved', 'student', $studentid, [
            'case_status' => 'resolved',
            'resolution_note' => $note,
            'source' => 'parent_trust_audit_page',
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Support case resolution was saved to the audit trail.',
            'studentid' => $studentid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown parent-trust-audit action.');
}

// -- GET: same filters, same WHERE construction, same queries as the page --
$staffid = optional_param('staffid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$reason = optional_param('reason', '', PARAM_ALPHANUMEXT);
$reasonoptions = pqlpta_support_reason_options();
if (!array_key_exists($reason, $reasonoptions)) {
    $reason = '';
}
$defaultfrom = time() - (30 * DAYSECS);
$defaultto = time();
$fromtext = optional_param('from', userdate($defaultfrom, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$totext = optional_param('to', userdate($defaultto, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$fromtime = pqlpta_date_start($fromtext, $defaultfrom);
$totime = pqlpta_date_end($totext, $defaultto);

$ready = pqlpta_table_exists('local_prequran_live_audit');
$params = [
    'action' => 'parent_trust_preview_opened',
    'fromtime' => $fromtime,
    'totime' => $totime,
];
$where = "action = :action AND timecreated >= :fromtime AND timecreated <= :totime";
if ($staffid > 0) {
    $where .= " AND actorid = :staffid";
    $params['staffid'] = $staffid;
}
if ($studentid > 0) {
    $where .= " AND targettype = :targettype AND targetid = :studentid";
    $params['targettype'] = 'student';
    $params['studentid'] = $studentid;
}
if ($reason !== '') {
    $where .= " AND details LIKE :reasonlike";
    $params['reasonlike'] = '%"support_reason":"' . $reason . '"%';
}

$metrics = [
    'previews' => 0,
    'staff' => 0,
    'students' => 0,
    'today' => 0,
    'seven_days' => 0,
    'reasoned' => 0,
    'support_cases' => 0,
];
$previewrows = [];
$staffpatterns = [];
$studentpatterns = [];
$supportcases = [];

if ($ready) {
    $metrics['previews'] = pqlpta_count_sql("SELECT COUNT(1) FROM {local_prequran_live_audit} WHERE {$where}", $params);
    $metrics['staff'] = pqlpta_count_sql("SELECT COUNT(DISTINCT actorid) FROM {local_prequran_live_audit} WHERE {$where}", $params);
    $metrics['students'] = pqlpta_count_sql("SELECT COUNT(DISTINCT targetid) FROM {local_prequran_live_audit} WHERE {$where} AND targettype = 'student'", $params);
    $metrics['today'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action = :action
            AND timecreated >= :todaystart",
        ['action' => 'parent_trust_preview_opened', 'todaystart' => usergetmidnight(time())]
    );
    $metrics['seven_days'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action = :action
            AND timecreated >= :fromtime",
        ['action' => 'parent_trust_preview_opened', 'fromtime' => time() - (7 * DAYSECS)]
    );
    $metrics['reasoned'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE {$where}
            AND details LIKE :hasreason",
        $params + ['hasreason' => '%"support_reason":%']
    );
    $metrics['support_cases'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('parent_trust_support_case_logged', 'parent_trust_support_case_resolved')
            AND timecreated >= :fromtime
            AND timecreated <= :totime",
        ['fromtime' => $fromtime, 'totime' => $totime]
    );

    $previewrows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE {$where}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        200
    ));

    $staffpatterns = array_values($DB->get_records_sql(
        "SELECT actorid,
                COUNT(1) AS preview_count,
                COUNT(DISTINCT targetid) AS student_count,
                MIN(timecreated) AS first_preview,
                MAX(timecreated) AS last_preview
           FROM {local_prequran_live_audit}
          WHERE {$where}
       GROUP BY actorid
         HAVING COUNT(1) >= 5 OR COUNT(DISTINCT targetid) >= 3
       ORDER BY student_count DESC, preview_count DESC",
        $params,
        0,
        50
    ));

    $studentpatterns = array_values($DB->get_records_sql(
        "SELECT targetid AS studentid,
                COUNT(1) AS preview_count,
                COUNT(DISTINCT actorid) AS staff_count,
                MIN(timecreated) AS first_preview,
                MAX(timecreated) AS last_preview
           FROM {local_prequran_live_audit}
          WHERE {$where}
            AND targettype = 'student'
       GROUP BY targetid
         HAVING COUNT(DISTINCT actorid) >= 2 OR COUNT(1) >= 5
       ORDER BY staff_count DESC, preview_count DESC",
        $params,
        0,
        50
    ));

    $caseparams = ['fromtime' => $fromtime, 'totime' => $totime];
    $casewhere = "action IN ('parent_trust_support_case_logged', 'parent_trust_support_case_resolved')
                  AND timecreated >= :fromtime
                  AND timecreated <= :totime";
    if ($staffid > 0) {
        $casewhere .= " AND actorid = :staffid";
        $caseparams['staffid'] = $staffid;
    }
    if ($studentid > 0) {
        $casewhere .= " AND targetid = :studentid";
        $caseparams['studentid'] = $studentid;
    }
    if ($reason !== '') {
        $casewhere .= " AND details LIKE :reasonlike";
        $caseparams['reasonlike'] = '%"support_reason":"' . $reason . '"%';
    }
    $supportcases = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE {$casewhere}
       ORDER BY timecreated DESC, id DESC",
        $caseparams,
        0,
        100
    ));
}

// -- Decorate for the client: the same userdate() labels the page prints, plus
//    a resolved case_status per case and the context keys the page derives. --
$timefmt = get_string('strftimedatetimeshort');
$nameids = [];

foreach ($supportcases as $case) {
    $case->time_label = userdate((int)$case->timecreated, $timefmt);
    $nameids[] = (int)$case->actorid;
    $nameids[] = (int)$case->targetid;
}
foreach ($staffpatterns as $row) {
    $row->first_label = userdate((int)$row->first_preview, $timefmt);
    $row->last_label = userdate((int)$row->last_preview, $timefmt);
    $nameids[] = (int)$row->actorid;
}
foreach ($studentpatterns as $row) {
    $row->first_label = userdate((int)$row->first_preview, $timefmt);
    $row->last_label = userdate((int)$row->last_preview, $timefmt);
    $nameids[] = (int)$row->studentid;
}
foreach ($previewrows as $row) {
    $row->time_label = userdate((int)$row->timecreated, $timefmt);
    $nameids[] = (int)$row->actorid;
    $nameids[] = (int)$row->targetid;
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'schemaready' => $ready,
    'metrics' => $metrics,
    'supportcases' => $supportcases,
    'staffpatterns' => $staffpatterns,
    'studentpatterns' => $studentpatterns,
    'previewrows' => $previewrows,
    'supportreasons' => $reasonoptions,
    'filters' => [
        'staffid' => $staffid,
        'studentid' => $studentid,
        'reason' => $reason,
        'from' => userdate($fromtime, '%Y-%m-%d'),
        'to' => userdate($totime, '%Y-%m-%d'),
    ],
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
