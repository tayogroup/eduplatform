<?php
// ---- report: parent-trust-retention (data-retention controls for parent-trust
//      support audit; read + compliance writes) --------------------------------
// Ported from local_hubredirect/live_parent_trust_retention.php via
// live_parent_trust_retention_portallib (pqlptrl_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// This is the guarded data-retention console for the parent-trust support audit
// trail (dry-run, approval workflow, guarded purge, recovery/evidence log).
// GET  = the retention policy + readiness state the page renders: configured
//        policy, approval readiness, purge safeguards, purge recovery log +
//        evidence snapshots, readiness metrics, age buckets, event/reason
//        summaries and dry-run purge candidates (+names for the actor/target ids
//        the page prints via pqlptrl_user_name).
// POST = the compliance writes, ported VERBATIM (same guards, transitions,
//        timestamps and audit records): do=request_purge_review /
//        approve_purge_review / reject_purge_review (workflow audits) and
//        do=execute_parent_trust_purge (blocked-audit OR started+delete+completed
//        recovery-log purge). confirm_sesskey() dropped: token auth replaces the
//        session key. Legacy redirects become ok JSON carrying the same status.
// (live_parent_trust_retention.php has no pqh_live_security_audit calls — none to
//  keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_parent_trust_retention_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from live_parent_trust_retention.php;
//    pqh_access_denied(...) -> pqpd_fail(403, same message)) --
if (!is_siteadmin($USER)) {
    pqpd_fail(403, 'Only site administrators can review parent trust retention readiness.');
}

// -- Configured policy + selected dry-run policy (verbatim page top-level) --
$configuredretention = (int)get_config('local_prequran', 'parent_trust_retention_days');
if ($configuredretention <= 0) {
    $configuredretention = 365;
}
$requires_export = (int)get_config('local_prequran', 'parent_trust_purge_requires_export') !== 0;
$approval_required = (int)get_config('local_prequran', 'parent_trust_purge_approval_required') !== 0;

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$body = [];
if ($method === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

$retentiondays = $method === 'POST'
    ? (int)($body['retentiondays'] ?? $configuredretention)
    : optional_param('retentiondays', $configuredretention, PARAM_INT);
if (!in_array($retentiondays, [180, 365, 730], true)) {
    $retentiondays = $configuredretention;
    if (!in_array($retentiondays, [180, 365, 730], true)) {
        $retentiondays = 365;
    }
}
$purgeactions = [
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved',
];
$cutoff = time() - ($retentiondays * DAYSECS);

if ($method === 'POST') {
    $do = (string)($body['do'] ?? '');
    // confirm_sesskey() dropped: token auth replaces the session key.
    $note = clean_param((string)($body['review_note'] ?? ''), PARAM_TEXT);
    $details = [
        'retention_days' => $retentiondays,
        'configured_retention_days' => $configuredretention,
        'requires_export' => $requires_export,
        'approval_required' => $approval_required,
        'review_note' => $note,
        'source' => 'parent_trust_retention_page',
    ];
    if ($do === 'request_purge_review') {
        pqlptrl_audit(0, 'parent_trust_purge_review_requested', 'parent_trust_retention', 0, $details);
        echo json_encode(['ok' => true, 'workflow' => 'requested'], JSON_UNESCAPED_SLASHES);
        exit;
    }
    if ($do === 'approve_purge_review') {
        pqlptrl_audit(0, 'parent_trust_purge_review_approved', 'parent_trust_retention', 0, $details);
        echo json_encode(['ok' => true, 'workflow' => 'approved'], JSON_UNESCAPED_SLASHES);
        exit;
    }
    if ($do === 'reject_purge_review') {
        pqlptrl_audit(0, 'parent_trust_purge_review_rejected', 'parent_trust_retention', 0, $details);
        echo json_encode(['ok' => true, 'workflow' => 'rejected'], JSON_UNESCAPED_SLASHES);
        exit;
    }
    if ($do === 'execute_parent_trust_purge') {
        $exportconfirmed = (int)($body['export_confirmed'] ?? 0) === 1;
        $confirmphrase = clean_param((string)($body['confirm_phrase'] ?? ''), PARAM_TEXT);
        $latestpolicyforpurge = pqlptrl_latest_policy_event();
        $approvalok = !$approval_required || ($latestpolicyforpurge && (string)$latestpolicyforpurge->action === 'parent_trust_purge_review_approved');
        $exportok = !$requires_export || $exportconfirmed;
        $phraseok = trim($confirmphrase) === 'PURGE PARENT TRUST AUDIT';
        $blockreasons = [];
        if (!pqlptrl_table_exists('local_prequran_live_audit')) {
            $blockreasons[] = 'audit_table_missing';
        }
        if (!$exportok) {
            $blockreasons[] = 'export_confirmation_required';
        }
        if (!$approvalok) {
            $blockreasons[] = 'approval_required';
        }
        if (!$phraseok) {
            $blockreasons[] = 'confirmation_phrase_missing';
        }
        [$purgeinsql, $purgeinparams] = $DB->get_in_or_equal($purgeactions, SQL_PARAMS_NAMED, 'purgeact');
        $purgeparams = $purgeinparams + ['cutoff' => $cutoff];
        $eligiblecount = pqlptrl_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_audit}
              WHERE action {$purgeinsql}
                AND timecreated < :cutoff",
            $purgeparams
        );
        if ($eligiblecount <= 0) {
            $blockreasons[] = 'no_eligible_records';
        }
        $purgedetails = $details + [
            'eligible_count' => $eligiblecount,
            'purge_limit' => 500,
            'cutoff' => $cutoff,
            'export_confirmed' => $exportconfirmed,
            'approval_ok' => $approvalok,
            'target_actions' => $purgeactions,
        ];
        if ($blockreasons) {
            pqlptrl_audit(0, 'parent_trust_purge_blocked', 'parent_trust_retention', 0, $purgedetails + ['block_reasons' => $blockreasons]);
            echo json_encode(['ok' => true, 'purge' => 'blocked', 'block_reasons' => $blockreasons], JSON_UNESCAPED_SLASHES);
            exit;
        }

        $candidates = array_values($DB->get_records_sql(
            "SELECT id, action, actorid, targetid, targettype, details, timecreated
               FROM {local_prequran_live_audit}
              WHERE action {$purgeinsql}
                AND timecreated < :cutoff
           ORDER BY timecreated ASC, id ASC",
            $purgeparams,
            0,
            500
        ));
        $ids = array_map(static function($row): int {
            return (int)$row->id;
        }, $candidates);
        $evidence = pqlptrl_purge_evidence_snapshot($candidates);
        pqlptrl_audit(0, 'parent_trust_purge_started', 'parent_trust_retention', 0, $purgedetails + [
            'candidate_count' => count($ids),
            'sample_ids' => $evidence['sample_ids'],
            'evidence_snapshot' => $evidence,
        ]);
        if ($ids) {
            $DB->delete_records_list('local_prequran_live_audit', 'id', $ids);
        }
        pqlptrl_audit(0, 'parent_trust_purge_completed', 'parent_trust_retention', 0, $purgedetails + [
            'deleted_count' => count($ids),
            'sample_ids' => $evidence['sample_ids'],
            'evidence_snapshot' => $evidence,
        ]);
        echo json_encode(['ok' => true, 'purge' => 'completed', 'deleted' => count($ids)], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown parent trust retention action.');
}

// -- GET: the retention readiness state (verbatim page computation) --
$actions = $purgeactions;
$ready = pqlptrl_table_exists('local_prequran_live_audit');
$buckets = [
    '0-30 days' => 0,
    '31-90 days' => 0,
    '91-180 days' => 0,
    '180+ days' => 0,
];
$metrics = [
    'total' => 0,
    'eligible' => 0,
    'staff' => 0,
    'students' => 0,
    'oldest' => 0,
];
$eligible = [];
$reasoncounts = [];
$actioncounts = [];
$latestpolicy = pqlptrl_latest_policy_event();
$purgehistory = [];

if ($ready) {
    [$insql, $inparams] = $DB->get_in_or_equal($actions, SQL_PARAMS_NAMED, 'act');
    $baseparams = $inparams;
    $metrics['total'] = pqlptrl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}",
        $baseparams
    );
    $metrics['eligible'] = pqlptrl_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
            AND timecreated < :cutoff",
        $baseparams + ['cutoff' => $cutoff]
    );
    $metrics['staff'] = pqlptrl_count_sql(
        "SELECT COUNT(DISTINCT actorid)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}",
        $baseparams
    );
    $metrics['students'] = pqlptrl_count_sql(
        "SELECT COUNT(DISTINCT targetid)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
            AND targettype = :targettype",
        $baseparams + ['targettype' => 'student']
    );
    $metrics['oldest'] = (int)$DB->get_field_sql(
        "SELECT MIN(timecreated)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}",
        $baseparams
    );

    $rows = $DB->get_records_sql(
        "SELECT id, action, actorid, targetid, targettype, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
       ORDER BY timecreated DESC, id DESC",
        $baseparams
    );
    foreach ($rows as $row) {
        $label = pqlptrl_age_label((int)$row->timecreated);
        $buckets[$label]++;
        $actioncounts[(string)$row->action] = ($actioncounts[(string)$row->action] ?? 0) + 1;
        $rdetails = json_decode((string)$row->details, true);
        $rdetails = is_array($rdetails) ? $rdetails : [];
        $reason = (string)($rdetails['support_reason_label'] ?? $rdetails['support_reason'] ?? 'Not recorded');
        $reasoncounts[$reason] = ($reasoncounts[$reason] ?? 0) + 1;
    }

    $eligible = array_values($DB->get_records_sql(
        "SELECT id, action, actorid, targetid, targettype, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
            AND timecreated < :cutoff
       ORDER BY timecreated ASC, id ASC",
        $baseparams + ['cutoff' => $cutoff],
        0,
        100
    ));

    $purgehistory = array_values($DB->get_records_sql(
        "SELECT id, action, actorid, targettype, targetid, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE action IN ('parent_trust_purge_blocked', 'parent_trust_purge_started', 'parent_trust_purge_completed')
       ORDER BY timecreated DESC, id DESC",
        [],
        0,
        30
    ));
}

$reviewparams = [
    'from' => $metrics['oldest'] > 0 ? userdate((int)$metrics['oldest'], '%Y-%m-%d') : userdate(time() - (365 * DAYSECS), '%Y-%m-%d'),
    'to' => userdate(time(), '%Y-%m-%d'),
];

// Decorate the tabular rows the page prints (reason label + userdate parity) and
// collect the actor/target ids the page resolves to names via pqlptrl_user_name.
$nameids = [];
if ($latestpolicy) {
    $nameids[] = (int)$latestpolicy->actorid;
}
$eligibleout = [];
foreach ($eligible as $row) {
    $rdetails = json_decode((string)$row->details, true);
    $rdetails = is_array($rdetails) ? $rdetails : [];
    $reason = (string)($rdetails['support_reason_label'] ?? $rdetails['support_reason'] ?? 'Not recorded');
    $nameids[] = (int)$row->actorid;
    $nameids[] = (int)$row->targetid;
    $eligibleout[] = [
        'id' => (int)$row->id,
        'action' => (string)$row->action,
        'actorid' => (int)$row->actorid,
        'targetid' => (int)$row->targetid,
        'timecreated' => (int)$row->timecreated,
        'time_label' => userdate((int)$row->timecreated, get_string('strftimedatetimeshort')),
        'reason' => $reason,
    ];
}
$purgehistoryout = [];
foreach ($purgehistory as $row) {
    $nameids[] = (int)$row->actorid;
    $purgehistoryout[] = [
        'id' => (int)$row->id,
        'action' => (string)$row->action,
        'actorid' => (int)$row->actorid,
        'timecreated' => (int)$row->timecreated,
        'time_label' => userdate((int)$row->timecreated, get_string('strftimedatetimeshort')),
        'details' => pqlptrl_decode_details((string)$row->details),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'policy' => [
        'configured_retention_days' => $configuredretention,
        'retention_days' => $retentiondays,
        'requires_export' => $requires_export,
        'approval_required' => $approval_required,
    ],
    'latestpolicy' => $latestpolicy ? [
        'action' => (string)$latestpolicy->action,
        'actorid' => (int)$latestpolicy->actorid,
        'timecreated' => (int)$latestpolicy->timecreated,
        'time_label' => userdate((int)$latestpolicy->timecreated, get_string('strftimedatetimeshort')),
    ] : null,
    'metrics' => [
        'total' => (int)$metrics['total'],
        'eligible' => (int)$metrics['eligible'],
        'staff' => (int)$metrics['staff'],
        'students' => (int)$metrics['students'],
        'oldest' => (int)$metrics['oldest'],
        'oldest_label' => $metrics['oldest'] > 0 ? userdate((int)$metrics['oldest'], get_string('strftimedate')) : 'None',
    ],
    'buckets' => $buckets,
    'actioncounts' => $actioncounts,
    'reasoncounts' => $reasoncounts,
    'purgehistory' => $purgehistoryout,
    'eligible' => $eligibleout,
    'purgeactions' => $purgeactions,
    'reviewparams' => $reviewparams,
    'confirm_phrase' => 'PURGE PARENT TRUST AUDIT',
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
