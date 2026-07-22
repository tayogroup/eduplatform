<?php
// ---- report: sponsor-billing (assigned sponsor invoices + commitments; RO) ----
// Ported from local_hubredirect/sponsor_billing.php via sponsor_billing_portallib
// (guard-only: the page defines no functions — pqfin_*/pqh_* shared helpers are
// called at runtime). Included from portal_data.php AFTER token auth: $claims
// verified, $USER set to the token user, JSON exception handler installed,
// headers sent.
// GET  = what the page renders: workspace header, invoice amount metrics, the
//        sponsor's assigned invoice rows, the sponsor commitment rows, and the
//        finance-office support label.
// POST = rejected with 400: sponsor_billing.php has no write blocks.
// (sponsor_billing.php has no pqh_live_security_audit calls — none to keep.)
// Payment links: the page never links payment_start.php; its per-invoice
// "View" opens invoice_view.php (which hosts the Pay online bridge). That
// legacy URL is kept ABSOLUTE — the invoice-view/payment redirect bridge is
// intentionally not migrated.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/sponsor_billing_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'sponsor-billing is read-only: sponsor_billing.php has no write actions.');
}

// -- entry access checks (verbatim order + message from sponsor_billing.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);

if ($workspaceid <= 0 || !pqfin_sponsor_billing_visible($workspaceid, $userid, $consumercontext)) {
    pqpd_fail(403, 'Sponsor billing is not available for this workspace.');
}

// Same URL params the page carries on its legacy links.
$legacyparams = [];
if (!empty($consumercontext->consumerslug)) {
    $legacyparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $legacyparams['workspaceid'] = $workspaceid;
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$invoices = pqfin_invoice_rows_for_sponsor($workspaceid, $userid, $consumercontext);
$commitments = pqfin_sponsor_commitments_for_user($workspaceid, $userid, $consumercontext);
$metrics = pqfin_invoice_amount_metrics($invoices);

// Money data is sensitive: the sponsor invoice/commitment rows carry i.* plus
// student name fields — emit ONLY the fields the legacy page renders.
$now = time();
$studentids = [];
$invoicerows = [];
foreach ($invoices as $invoice) {
    if ((int)$invoice->studentid > 0) {
        $studentids[(int)$invoice->studentid] = (int)$invoice->studentid;
    }
    $invoicerows[] = [
        'id' => (int)$invoice->id,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'workspace_name' => (string)$invoice->workspace_name,
        'student' => (int)$invoice->studentid > 0 ? fullname($invoice) : 'Not assigned',
        'status' => (string)$invoice->status,
        'status_label' => pqfin_invoice_status_label((string)$invoice->status),
        'currency' => (string)$invoice->currency,
        'total' => (string)$invoice->total,
        'balancedue' => (string)$invoice->balancedue,
        'dueat' => (int)$invoice->dueat,
        'overdue' => (int)$invoice->dueat > 0 && (int)$invoice->dueat < $now
            && pqfin_money_to_cents((string)$invoice->balancedue) > 0,
        'viewurl' => (new moodle_url('/local/hubredirect/invoice_view.php',
            ['invoiceid' => (int)$invoice->id] + $legacyparams))->out(false),
    ];
}

$commitmentrows = [];
foreach ($commitments as $commitment) {
    if ((int)$commitment->studentid > 0) {
        $studentids[(int)$commitment->studentid] = (int)$commitment->studentid;
    }
    $commitmentrows[] = [
        'commitmentnumber' => (string)$commitment->commitmentnumber,
        'invoicenumber' => (string)$commitment->invoicenumber,
        'student' => (int)$commitment->studentid > 0 ? fullname($commitment) : 'Not assigned',
        'status' => (string)$commitment->status,
        'currency' => (string)$commitment->currency,
        'committedamount' => (string)$commitment->committedamount,
        'receivedamount' => (string)$commitment->receivedamount,
        'balanceamount' => (string)$commitment->balanceamount,
        'expectedat' => (int)$commitment->expectedat,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'metrics' => $metrics,
    'invoices' => $invoicerows,
    'commitments' => $commitmentrows,
    'supportlabel' => pqfin_invoice_support_label($workspace, $consumercontext),
    'names' => pqpd_names(array_values($studentids)),
], JSON_UNESCAPED_SLASHES);
exit;
