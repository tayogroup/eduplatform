<?php
// ---- report: invoice-view (hosted family invoice sheet; read-only) ----
// Ported from local_hubredirect/invoice_view.php via invoice_view_portallib
// (guard-only: the page defines no functions — pqfin_*/pqh_* shared helpers
// are called at runtime). Included from portal_data.php AFTER token auth:
// $claims verified, $USER set to the token user, JSON exception handler
// installed, headers sent.
//
// AUTH SCOPE: only the AUTHENTICATED viewing path is ported. The legacy
// page's financetoken secure-link path (pqfin_validate_secure_link — parents
// opening an emailed invoice without login) stays on the legacy page only;
// emailed links keep pointing there. Here $securelink is always false, so the
// full pqfin_user_can_view_hosted_invoice check always runs.
//
// GET  = what the page renders: workspace/brand header, invoice number +
//        status, bill-to account, student, issued/due dates, line items,
//        totals summary, recorded receipts, visible payment plan schedule,
//        gateway note — money fields whitelisted. Plus payurl (the legacy
//        payment_start.php URL exactly as the page builds it, gated by
//        canpayonline — the payment redirect bridge is deliberately
//        unmigrated) and printurl (legacy printable view).
// POST = rejected with 400: invoice_view.php has no write blocks.
// (invoice_view.php has no pqh_live_security_audit calls; its pqfin_audit
// 'invoice_viewed' compliance write is kept on the portal read.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/invoice_view_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'invoice-view is read-only: invoice_view.php has no write actions.');
}

// -- entry access checks (verbatim order + messages from invoice_view.php's
//    authenticated path; pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);

if (!pqfin_invoice_schema_ready() || $invoiceid <= 0) {
    pqpd_fail(403, 'Invoice is not available.');
}
$invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', IGNORE_MISSING);
if (!$invoice || !pqfin_user_can_view_hosted_invoice($invoice, $userid, $consumercontext)) {
    pqpd_fail(403, 'This invoice is not available for this account.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => (int)$invoice->workspaceid], '*', IGNORE_MISSING);
$account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$invoice->billingaccountid], '*', IGNORE_MISSING);
$student = (int)$invoice->studentid > 0 ? core_user::get_user((int)$invoice->studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null;
$lines = pqfin_invoice_lines($invoiceid);
$payments = pqfin_invoice_payments($invoiceid);
$paymentplans = pqfin_payment_plans_for_invoice($invoiceid);
$visiblepaymentplan = null;
foreach ($paymentplans as $candidateplan) {
    if (in_array((string)$candidateplan->status, ['active', 'past_due', 'completed'], true)) {
        $visiblepaymentplan = $candidateplan;
        break;
    }
}
$visibleinstallments = $visiblepaymentplan ? pqfin_installments_for_plan((int)$visiblepaymentplan->id) : [];
$gatewayconfig = pqfin_effective_gateway_config((int)$invoice->workspaceid, $consumercontext);
$canpayonline = pqfin_gateway_schema_ready()
    && pqfin_gateway_config_ready($gatewayconfig)
    && in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid'], true)
    && pqfin_money_to_cents((string)$invoice->balancedue) > 0;

// Same URL params the page carries on its legacy links (secure-link branch
// omitted: no financetoken here).
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
$urlparams['invoiceid'] = $invoiceid;
if ((int)$invoice->workspaceid > 0) {
    $urlparams['workspaceid'] = (int)$invoice->workspaceid;
}

// The page audits every view — keep the same compliance write on the portal
// read (viewerid/linkid resolve as on the authenticated, non-print branch).
pqfin_audit('invoice_viewed', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
    'targettype' => 'invoice',
    'consumerid' => (int)$invoice->consumerid,
    'invoiceid' => $invoiceid,
    'viewerid' => $userid,
    'linkid' => 0,
    'actorid' => $userid,
]);

// Money data is sensitive — emit ONLY the fields the legacy sheet renders.
$now = time();
$linesout = [];
foreach ($lines as $line) {
    $linesout[] = [
        'description' => (string)$line->description,
        'quantity' => (string)$line->quantity,
        'unitamount' => (string)$line->unitamount,
        'discountamount' => (string)$line->discountamount,
        'taxamount' => (string)$line->taxamount,
        'linetotal' => (string)$line->linetotal,
    ];
}
$paymentsout = [];
foreach ($payments as $payment) {
    $paymentsout[] = [
        'id' => (int)$payment->id,
        'receiptnumber' => (string)$payment->receiptnumber,
        'currency' => (string)$payment->currency,
        'allocationamount' => (string)$payment->allocationamount,
        'method_label' => pqfin_payment_method_label((string)$payment->paymentmethod),
        // Legacy receipt sheet, exactly as the page links it (absolute).
        'receipturl' => (new moodle_url('/local/hubredirect/payment_receipt.php',
            ['paymentid' => (int)$payment->id, 'workspaceid' => (int)$invoice->workspaceid]))->out(false),
    ];
}
$installmentsout = [];
foreach ($visibleinstallments as $installment) {
    $installmentsout[] = [
        'dueat' => (int)$installment->dueat,
        'currency' => (string)$installment->currency,
        'balancedue' => (string)$installment->balancedue,
        'status_label' => pqfin_installment_status_label((string)$installment->status),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => [
        'id' => (int)$invoice->workspaceid,
        'name' => (string)($workspace->name ?? ($consumercontext->consumername ?? 'Academy')),
    ],
    'supportlabel' => pqfin_invoice_support_label($workspace, $consumercontext),
    'invoice' => [
        'id' => $invoiceid,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'status' => (string)$invoice->status,
        'status_label' => pqfin_invoice_status_label((string)$invoice->status),
        'issuedat' => (int)$invoice->issuedat,
        'dueat' => (int)$invoice->dueat,
        'currency' => (string)$invoice->currency,
        'subtotal' => (string)$invoice->subtotal,
        'discounttotal' => (string)$invoice->discounttotal,
        'taxtotal' => (string)$invoice->taxtotal,
        'total' => (string)$invoice->total,
        'paidamount' => (string)$invoice->paidamount,
        'balancedue' => (string)$invoice->balancedue,
        'overdue' => (int)$invoice->dueat > 0 && (int)$invoice->dueat < $now
            && pqfin_money_to_cents((string)$invoice->balancedue) > 0,
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
    'lines' => $linesout,
    'payments' => $paymentsout,
    'plan' => $visiblepaymentplan ? ['plannumber' => (string)$visiblepaymentplan->plannumber] : null,
    'installments' => $installmentsout,
    'canpayonline' => $canpayonline,
    'gateway_displayname' => $canpayonline ? (string)$gatewayconfig['displayname'] : '',
    // Legacy payment bridge, exactly as the page builds it (deliberately
    // unmigrated — the button only shows when canpayonline).
    'payurl' => (new moodle_url('/local/hubredirect/payment_start.php', $urlparams))->out(false),
    // Legacy printable view (the portal page also offers window.print()).
    'printurl' => (new moodle_url('/local/hubredirect/invoice_view.php', $urlparams + ['print' => 1]))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
