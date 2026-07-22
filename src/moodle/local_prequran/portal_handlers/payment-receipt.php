<?php
// ---- report: payment-receipt (hosted family payment receipt; read-only) ----
// Ported from local_hubredirect/payment_receipt.php via payment_receipt_portallib
// (guard-only: the page defines no functions — pqfin_*/pqh_* shared helpers
// are called at runtime). Included from portal_data.php AFTER token auth:
// $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent.
//
// AUTH SCOPE: only the AUTHENTICATED viewing path is ported. The legacy
// page's financetoken secure-link path (pqfin_validate_secure_link — parents
// opening an emailed receipt without login) stays on the legacy page only;
// emailed links keep pointing there. Here $securelink is always false, so the
// invoice-owner/finance-admin check always runs when an allocation resolves
// to an invoice.
//
// GET  = what the page renders: workspace header, receipt number + status,
//        received-from account, student, method + reference, received date,
//        per-invoice allocation rows, total received, notes — money fields
//        whitelisted. Plus invoiceurl (legacy invoice sheet, exactly as the
//        page links it) and printurl (legacy printable receipt) as absolute
//        legacy URLs.
// POST = rejected with 400: payment_receipt.php has no write blocks.
// (payment_receipt.php has no pqh_live_security_audit calls; its pqfin_audit
// 'receipt_viewed' compliance write is kept on the portal read.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/payment_receipt_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'payment-receipt is read-only: payment_receipt.php has no write actions.');
}

// -- entry access checks (verbatim order + messages from payment_receipt.php's
//    authenticated path; pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$paymentid = optional_param('paymentid', 0, PARAM_INT);

if ($paymentid <= 0 || !pqfin_payment_schema_ready()) {
    pqpd_fail(403, 'Receipt is not available.');
}
$payment = $DB->get_record('local_prequran_payment', ['id' => $paymentid], '*', IGNORE_MISSING);
if (!$payment || !pqh_record_belongs_to_consumer_context($payment, $consumercontext, 'workspaceid')) {
    pqpd_fail(403, 'Receipt is outside this workspace.');
}
$allocations = pqfin_payment_allocations($paymentid);
$firstinvoiceid = 0;
foreach ($allocations as $allocation) {
    if ((int)$allocation->invoiceid > 0) {
        $firstinvoiceid = (int)$allocation->invoiceid;
        break;
    }
}
$invoice = $firstinvoiceid > 0 ? $DB->get_record('local_prequran_invoice', ['id' => $firstinvoiceid], '*', IGNORE_MISSING) : null;
if ($invoice && !pqfin_user_can_view_hosted_invoice($invoice, $userid, $consumercontext)
        && !pqfin_user_can_manage_workspace_finance($userid, (int)$payment->workspaceid)) {
    pqpd_fail(403, 'Receipt is not available for this account.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => (int)$payment->workspaceid], '*', IGNORE_MISSING);
$account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$payment->billingaccountid], '*', IGNORE_MISSING);
$student = (int)$payment->studentid > 0 ? core_user::get_user((int)$payment->studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null;

// Same URL params the page carries on its legacy links (secure-link branch
// omitted: no financetoken here).
$urlparams = ['paymentid' => $paymentid, 'workspaceid' => (int)$payment->workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

// The page audits every view — keep the same compliance write on the portal
// read (viewerid/linkid resolve as on the authenticated, non-print branch).
pqfin_audit('receipt_viewed', (int)$payment->workspaceid, (int)$payment->studentid, $paymentid, [
    'targettype' => 'payment',
    'consumerid' => (int)$payment->consumerid,
    'paymentid' => $paymentid,
    'viewerid' => $userid,
    'linkid' => 0,
    'actorid' => $userid,
]);

// Money data is sensitive — emit ONLY the fields the legacy sheet renders.
$allocationsout = [];
foreach ($allocations as $allocation) {
    $allocatedinvoice = $DB->get_record('local_prequran_invoice', ['id' => (int)$allocation->invoiceid], 'id,invoicenumber,status', IGNORE_MISSING);
    $allocationsout[] = [
        'invoicenumber' => (string)($allocatedinvoice->invoicenumber ?? ('Invoice #' . (int)$allocation->invoiceid)),
        'status' => (string)$allocation->status,
        'currency' => (string)$allocation->currency,
        'amount' => (string)$allocation->amount,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => [
        'id' => (int)$payment->workspaceid,
        'name' => (string)($workspace->name ?? ($consumercontext->consumername ?? 'Academy')),
    ],
    'payment' => [
        'id' => $paymentid,
        'receiptnumber' => (string)$payment->receiptnumber,
        'status' => (string)$payment->status,
        'method_label' => pqfin_payment_method_label((string)$payment->paymentmethod),
        'reference' => (string)$payment->reference,
        'receivedat' => (int)$payment->receivedat,
        'currency' => (string)$payment->currency,
        'amount' => (string)$payment->amount,
        'notes' => trim((string)$payment->notes),
    ],
    'account' => [
        'displayname' => (string)($account->displayname ?? 'Billing account'),
        'billingemail' => (string)($account->billingemail ?? ''),
    ],
    'student' => $student ? [
        'id' => (int)$student->id,
        'name' => fullname($student),
        'account_label' => pqh_account_no_label($student),
    ] : null,
    'allocations' => $allocationsout,
    // Legacy invoice sheet, exactly as the page links it (absolute; hosts the
    // deliberately unmigrated Pay online bridge).
    'invoiceurl' => $invoice ? (new moodle_url('/local/hubredirect/invoice_view.php',
        ['invoiceid' => (int)$invoice->id, 'workspaceid' => (int)$payment->workspaceid]))->out(false) : '',
    // Legacy printable receipt (the portal page also offers window.print()).
    'printurl' => (new moodle_url('/local/hubredirect/payment_receipt.php', $urlparams + ['print' => 1]))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
