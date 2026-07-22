<?php
// ---- report: finance-operations (workspace finance-ops console; READ-ONLY) ----
// Ported from local_hubredirect/finance_operations.php via
// finance_operations_portallib (pqfopl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = what the page renders: the 7 dashboard metrics, the 13-report tab map,
//        workspace/consumer context labels, and the selected report's rows
//        (first 100, same slice as the page table) projected onto EXACTLY the
//        columns the page table prints — money fields whitelisted, raw report
//        rows are never dumped.
//        NOTE: the page's report selector param is `report`, which is the
//        portal dispatch param here — the handler reads it as `finreport`
//        (same default 'aging', same whitelist). CSV export (export=csv) stays
//        legacy-only: this endpoint answers JSON; the portal page builds its
//        CSV client-side from the same whitelisted rows.
// POST = none. finance_operations.php defines ZERO write actions (no POST
//        handling, no sesskey, no action param) — it is a pure report console,
//        so there are no financial writes to port and any POST is rejected.
// (finance_operations.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_operations_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from finance_operations.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
if ($workspaceid <= 0 && !is_siteadmin($userid)) {
    pqpd_fail(403, 'Only workspace finance admins can view finance operations.');
}
if ($workspaceid > 0 && !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace finance admins can view finance operations.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The legacy page has no write actions — never invent a money write.
    pqpd_fail(400, 'Finance operations is a read-only report console; it has no write actions.');
}

// -- GET: same report whitelist + resolution order as the page --
$finreport = optional_param('finreport', 'aging', PARAM_ALPHANUMEXT);

$reports = [
    'aging' => 'Invoice aging',
    'payments' => 'Payments',
    'balances' => 'Balances',
    'discounts' => 'Discounts',
    'scholarships' => 'Scholarships',
    'sponsorships' => 'Sponsorships',
    'payouts' => 'Marketplace payouts',
    'corrections' => 'Corrections',
    'plans' => 'Payment plans',
    'holds' => 'Finance holds',
    'webhooks' => 'Webhooks',
    'hardening' => 'Hardening',
    'exceptions' => 'Exceptions',
];
if (!isset($reports[$finreport])) {
    $finreport = 'aging';
}

$contextlabels = $workspaceid > 0
    ? pqfin_report_workspace_context($workspaceid, $consumercontext)
    : ['workspaceid' => 0, 'workspace' => 'All workspaces', 'consumerid' => 0, 'consumer' => 'Platform finance', 'domain' => ''];
$metrics = pqfopl_metrics($workspaceid, $consumercontext);
$rows = pqfopl_rows($finreport, $workspaceid, $consumercontext);

// Project each row onto exactly the fields the page table renders (same
// coalescing order as the page's <td> expressions). Money values are the
// pre-formatted strings the pqfin_* reports emit — nothing else is surfaced.
$out = [];
foreach (array_slice($rows, 0, 100) as $row) {
    $out[] = [
        'reconciliationid' => (string)($row->reconciliationid ?? ''),
        'student' => pqfopl_student_label($row),
        'email' => (string)($row->email ?? ''),
        'reference' => (string)($row->invoicenumber ?? $row->receiptnumber ?? $row->documentnumber ?? $row->offeringtitle ?? $row->reasoncode ?? ''),
        'refid' => (int)($row->invoiceid ?? $row->id ?? 0),
        'status' => (string)($row->status ?? $row->invoicestatus ?? $row->requeststatus ?? ''),
        'currency' => (string)($row->currency ?? ''),
        'amount' => (string)($row->balancedue ?? $row->amount ?? $row->committedamount ?? $row->payoutamount ?? $row->totalamount ?? $row->linetotal ?? ''),
        'paid' => (string)($row->paidamount ?? $row->receivedamount ?? ''),
        'detail' => (string)($row->agingbucket ?? $row->paymentmethod ?? $row->holdtype ?? $row->eventtype ?? $row->exceptiontype ?? $row->reporttype ?? $row->awardtype ?? $row->snapshotkey ?? $row->plantype ?? $row->description ?? ''),
        'detailnote' => (string)($row->error ?? $row->reason ?? $row->termsnote ?? $row->warningsjson ?? $row->accountname ?? $row->fundingsource ?? ''),
        'nextdueat' => (int)($row->nextdueat ?? 0),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'context' => [
        'workspaceid' => (int)($contextlabels['workspaceid'] ?? 0),
        'workspace' => (string)($contextlabels['workspace'] ?? ''),
        'consumerid' => (int)($contextlabels['consumerid'] ?? 0),
        'consumer' => (string)($contextlabels['consumer'] ?? ''),
        'domain' => (string)($contextlabels['domain'] ?? ''),
    ],
    'metrics' => [
        'open_invoices' => (int)($metrics['open_invoices'] ?? 0),
        'overdue_invoices' => (int)($metrics['overdue_invoices'] ?? 0),
        'payments_received' => pqfin_cents_to_money((int)($metrics['payments_received_cents'] ?? 0)),
        'outstanding_balance' => pqfin_cents_to_money((int)($metrics['outstanding_balance_cents'] ?? 0)),
        'paid_not_enrolled' => (int)($metrics['paid_not_enrolled'] ?? 0),
        'enrolled_unpaid' => (int)($metrics['enrolled_unpaid'] ?? 0),
        'finance_holds' => (int)($metrics['finance_holds'] ?? 0),
    ],
    'reports' => $reports,
    'finreport' => $finreport,
    'rows' => $out,
    'rowstotal' => count($rows),
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
