<?php
// ---- report: parent-billing (linked-student invoice dashboard; read-only) ----
// Ported from local_hubredirect/parent_billing.php via parent_billing_portallib
// (guard-only: the page defines no functions — pqfin_*/pqh_* shared helpers are
// called at runtime). Included from portal_data.php AFTER token auth: $claims
// verified, $USER set to the token user, JSON exception handler installed,
// headers sent.
// GET  = what the page renders: workspace header, invoice amount metrics, the
//        issued payer-visible invoice rows for the parent's linked students
//        (+ active payment plan), and the finance-office support label.
// POST = rejected with 400: parent_billing.php has no write blocks.
// (parent_billing.php has no pqh_live_security_audit calls — none to keep.)
// Payment links: the page never links payment_start.php; its per-invoice
// "View" opens invoice_view.php (which hosts the Pay online bridge). That
// legacy URL is kept ABSOLUTE — the invoice-view/payment redirect bridge is
// intentionally not migrated.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/parent_billing_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'parent-billing is read-only: parent_billing.php has no write actions.');
}

// -- entry access checks (verbatim order + message from parent_billing.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$childid = optional_param('childid', 0, PARAM_INT);

if ($workspaceid <= 0) {
    pqpd_fail(403, 'Parent billing is not available for this workspace.');
}

// Same URL params the page carries on its legacy links.
$legacyparams = [];
if (!empty($consumercontext->consumerslug)) {
    $legacyparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $legacyparams['workspaceid'] = $workspaceid;
}

// Resolve the parent's linked students exactly as the page does (consent tables
// + parent comm threads), then narrow to a single child if childid is given.
$childids = [];
foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
    if (pqh_table_exists_safe($table)) {
        foreach ($DB->get_records($table, ['guardianid' => $userid], '', 'id,studentid') as $row) {
            $childids[(int)$row->studentid] = (int)$row->studentid;
        }
    }
}
if (pqh_table_exists_safe('local_prequran_comm_thread') && pqh_table_exists_safe('local_prequran_comm_participant')) {
    foreach ($DB->get_records_sql(
        "SELECT DISTINCT t.studentid
           FROM {local_prequran_comm_thread} t
           JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
          WHERE p.userid = :parentid
            AND p.role = :role
            AND t.studentid > 0",
        ['parentid' => $userid, 'role' => 'parent']
    ) as $row) {
        $childids[(int)$row->studentid] = (int)$row->studentid;
    }
}
if ($childid > 0) {
    $childids = [$childid => $childid];
    $legacyparams['childid'] = $childid;
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$invoices = pqfin_invoice_rows_for_parent($workspaceid, $userid, array_values($childids), $consumercontext);
$metrics = pqfin_invoice_amount_metrics($invoices);

// Money data is sensitive: pqfin_invoice_rows_for_parent returns i.* plus payer
// name fields — emit ONLY the fields the legacy page renders.
$now = time();
$rows = [];
$studentids = [];
foreach ($invoices as $invoice) {
    $plan = pqfin_active_payment_plan_for_invoice((int)$invoice->id);
    $studentids[(int)$invoice->studentid] = (int)$invoice->studentid;
    $rows[] = [
        'id' => (int)$invoice->id,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'workspace_name' => (string)$invoice->workspace_name,
        'student' => fullname($invoice),
        'status' => (string)$invoice->status,
        'status_label' => pqfin_invoice_status_label((string)$invoice->status),
        'currency' => (string)$invoice->currency,
        'total' => (string)$invoice->total,
        'balancedue' => (string)$invoice->balancedue,
        'dueat' => (int)$invoice->dueat,
        'overdue' => (int)$invoice->dueat > 0 && (int)$invoice->dueat < $now
            && pqfin_money_to_cents((string)$invoice->balancedue) > 0,
        'plan' => $plan ? [
            'plannumber' => (string)$plan->plannumber,
            'status_label' => pqfin_payment_plan_status_label((string)$plan->status),
        ] : null,
        'viewurl' => (new moodle_url('/local/hubredirect/invoice_view.php',
            ['invoiceid' => (int)$invoice->id] + $legacyparams))->out(false),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'metrics' => $metrics,
    'invoices' => $rows,
    'supportlabel' => pqfin_invoice_support_label($workspace, $consumercontext),
    'names' => pqpd_names(array_values($studentids)),
], JSON_UNESCAPED_SLASHES);
exit;
