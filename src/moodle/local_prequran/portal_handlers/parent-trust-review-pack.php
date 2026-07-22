<?php
// ---- report: parent-trust-review-pack (compliance review pack; read-only) -------
// Ported from local_hubredirect/live_parent_trust_review_pack.php via
// live_parent_trust_review_pack_portallib (pqlptrpl_*). Included from
// portal_data.php AFTER token auth: $claims verified, $USER set to the token
// user, JSON exception handler installed, headers sent.
// A printable/exportable review of staff parent-dashboard previews, reasons, and
// support-case outcomes over a filtered window (staff/student/reason/date).
// GET  = the filtered dataset the page renders: metrics, reason summary, and the
//        audit-event detail table (same WHERE + 1000-row query as the page).
// POST = 400: the page performs no writes (the CSV is built client-side from the
//        returned dataset; the "Print pack" button is client-side too).
// (the legacy page has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_parent_trust_review_pack_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same siteadmin gate as the page (pqh_access_denied -> pqpd_fail). --
if (!is_siteadmin($USER)) {
    pqpd_fail(403, 'Only site administrators can export parent trust compliance review packs.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Parent trust review pack is a read-only report.');
}

// Brand name for the CSV header (verbatim page derivation; may be empty under the
// cookieless token endpoint, in which case the page falls back to EduPlatform).
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? 'EduPlatform')) ?: 'EduPlatform';

// -- GET: same filters, same WHERE construction, same 1000-row query --
$staffid = optional_param('staffid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$reason = optional_param('reason', '', PARAM_ALPHANUMEXT);
$reasonoptions = pqlptrpl_reason_options();
if (!array_key_exists($reason, $reasonoptions)) {
    $reason = '';
}
$defaultfrom = time() - (30 * DAYSECS);
$defaultto = time();
$fromtext = optional_param('from', userdate($defaultfrom, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$totext = optional_param('to', userdate($defaultto, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$fromtime = pqlptrpl_date_start($fromtext, $defaultfrom);
$totime = pqlptrpl_date_end($totext, $defaultto);

$ready = pqlptrpl_table_exists('local_prequran_live_audit');
$params = ['fromtime' => $fromtime, 'totime' => $totime];
$where = "timecreated >= :fromtime
          AND timecreated <= :totime
          AND action IN (
              'parent_trust_preview_opened',
              'parent_trust_support_case_logged',
              'parent_trust_support_case_resolved'
          )";
if ($staffid > 0) {
    $where .= " AND actorid = :staffid";
    $params['staffid'] = $staffid;
}
if ($studentid > 0) {
    $where .= " AND targetid = :studentid";
    $params['studentid'] = $studentid;
}
if ($reason !== '') {
    $where .= " AND details LIKE :reasonlike";
    $params['reasonlike'] = '%"support_reason":"' . $reason . '"%';
}

$rows = [];
if ($ready) {
    $rows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE {$where}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        1000
    ));
}

$metrics = [
    'events' => count($rows),
    'previews' => 0,
    'staff' => [],
    'students' => [],
    'cases_opened' => 0,
    'cases_resolved' => 0,
    'cases_escalated' => 0,
    'reasoned_previews' => 0,
];
$reasoncounts = [];
$exportrows = [];
$nameids = [];
foreach ($rows as $row) {
    $details = json_decode((string)$row->details, true);
    $details = is_array($details) ? $details : [];
    $rowreason = (string)($details['support_reason'] ?? '');
    $reasonlabel = (string)($details['support_reason_label'] ?? ($rowreason !== '' ? str_replace('_', ' ', $rowreason) : 'Not recorded'));
    $casestatus = (string)($details['case_status'] ?? ((string)$row->action === 'parent_trust_support_case_resolved' ? 'resolved' : ''));
    if ((string)$row->action === 'parent_trust_preview_opened') {
        $metrics['previews']++;
        if ($rowreason !== '') {
            $metrics['reasoned_previews']++;
        }
    }
    if ((string)$row->action === 'parent_trust_support_case_logged') {
        $metrics['cases_opened']++;
    }
    if ((string)$row->action === 'parent_trust_support_case_resolved') {
        $metrics['cases_resolved']++;
    }
    if ($casestatus === 'escalated') {
        $metrics['cases_escalated']++;
    }
    if ((int)$row->actorid > 0) {
        $metrics['staff'][(int)$row->actorid] = true;
    }
    if ((int)$row->targetid > 0) {
        $metrics['students'][(int)$row->targetid] = true;
    }
    $reasoncounts[$reasonlabel] = ($reasoncounts[$reasonlabel] ?? 0) + 1;
    $nameids[] = (int)$row->actorid;
    $nameids[] = (int)$row->targetid;
    $exportrows[] = [
        'time' => userdate((int)$row->timecreated, '%Y-%m-%d %H:%M:%S'),
        'action' => (string)$row->action,
        'staffid' => (int)$row->actorid,
        'staff' => pqlptrpl_user_name((int)$row->actorid, 'Staff ' . (int)$row->actorid),
        'studentid' => (int)$row->targetid,
        'student' => pqlptrpl_user_name((int)$row->targetid, 'Student ' . (int)$row->targetid),
        'reason' => $reasonlabel,
        'case_status' => $casestatus,
        'case_note' => (string)($details['case_note'] ?? ''),
        'resolution_note' => (string)($details['resolution_note'] ?? ''),
        // The page shows a trimmed note; ship both trimmed (display) and the full
        // note fields (the client CSV keeps the untrimmed columns like the page).
        'note_short' => pqlptrpl_short(trim((string)($details['case_note'] ?? '') . ' ' . (string)($details['resolution_note'] ?? ''))),
        'details' => (string)$row->details,
    ];
}

$reasonsummary = [];
foreach ($reasoncounts as $label => $count) {
    $reasonsummary[] = ['reason' => (string)$label, 'count' => (int)$count];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'brand' => $brandname,
    'filters' => [
        'staffid' => $staffid,
        'studentid' => $studentid,
        'reason' => $reason,
        'reason_label' => $reasonoptions[$reason],
        'from' => userdate($fromtime, '%Y-%m-%d'),
        'to' => userdate($totime, '%Y-%m-%d'),
    ],
    'reasonoptions' => $reasonoptions,
    'metrics' => [
        'events' => (int)$metrics['events'],
        'previews' => (int)$metrics['previews'],
        'reasoned_previews' => (int)$metrics['reasoned_previews'],
        'staff_count' => count($metrics['staff']),
        'student_count' => count($metrics['students']),
        'cases_opened' => (int)$metrics['cases_opened'],
        'cases_resolved' => (int)$metrics['cases_resolved'],
        'cases_escalated' => (int)$metrics['cases_escalated'],
    ],
    'reasonsummary' => $reasonsummary,
    'rows' => $exportrows,
    'generated_label' => userdate(time(), get_string('strftimedatetimeshort')),
    'range_label' => userdate($fromtime, get_string('strftimedate')) . ' through ' . userdate($totime, get_string('strftimedate')),
    'generated_csv' => userdate(time(), '%Y-%m-%d %H:%M:%S'),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
