<?php
// ---- report: invoice-detail (workspace-admin invoice management; read + money writes) ----
// Ported from local_hubredirect/invoice_detail.php via invoice_detail_portallib
// (guard-only: the page defines no named functions — pqfin_*/pqh_* shared
// helpers are called at runtime, never copied).
// Included from portal_data.php AFTER token auth: $claims verified, $USER set
// to the token user, JSON exception handler installed, headers sent.
// GET  = what the page renders for ?invoiceid=N: invoice header + summary,
//        lines, payments/receipts, payment plans + installments, scholarship /
//        sponsor / marketplace-payout records, credits + refunds, sponsor
//        account options, schema flags (+names for line/payout teachers).
// POST = JSON do=<action>, the page's twenty sesskey'd POST actions VERBATIM
//        (save_line, void_line, issue, send_invoice_notice,
//        revoke_invoice_links, mark_sent, void_invoice, record_payment,
//        create_payment_plan, cancel_payment_plan, create_scholarship_award,
//        create_sponsor_commitment, create_marketplace_payout,
//        send_receipt_notice, reverse_payment, create_credit_note,
//        record_write_off, record_refund, mark_invoice_disputed,
//        mark_payment_disputed) — every money write is the same single
//        pqfin_* library call the page makes (same guards, money normalizers,
//        status whitelists, and pqfin_audit trail live inside finance_lib.php).
//        send_invoice_notice / send_receipt_notice email exactly as legacy via
//        pqfin_send_invoice_notification / pqfin_send_receipt_notification.
//        require_sesskey() dropped: token auth replaces the session key.
//        Legacy redirect / inline message -> ok JSON + message.
// (invoice_detail.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/invoice_detail_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- ENTRY access check (verbatim from invoice_detail.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$invoiceid = isset($body['invoiceid']) ? (int)$body['invoiceid'] : optional_param('invoiceid', 0, PARAM_INT);

if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can manage invoices.');
}
if (!pqfin_invoice_schema_ready()) {
    pqpd_fail(403, 'Invoice tables are not ready yet. Run the local_prequran plugin upgrade first.');
}
$invoice = pqfin_invoice_belongs_to_workspace($invoiceid, $workspaceid, $consumercontext);
if (!$invoice) {
    pqpd_fail(403, 'Invoice is outside this workspace or no longer exists.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Legacy optional_param(name, default, TYPE) over form POST becomes the
    // same key from the JSON body with the same default and clean_param type.
    $bint = static function(string $key, int $default = 0) use ($body): int {
        return isset($body[$key]) ? (int)$body[$key] : $default;
    };
    $btext = static function(string $key, string $default = '') use ($body): string {
        return clean_param((string)($body[$key] ?? $default), PARAM_TEXT);
    };
    $balnum = static function(string $key, string $default = '') use ($body): string {
        return clean_param((string)($body[$key] ?? $default), PARAM_ALPHANUMEXT);
    };
    $braw = static function(string $key, string $default = '') use ($body): string {
        // PARAM_RAW_TRIMMED: no cleaning beyond trim (money strings are
        // normalized inside finance_lib.php by pqfin_money_to_cents).
        return trim((string)($body[$key] ?? $default));
    };

    // The page wraps every action in try/catch and shows $e->getMessage()
    // inline; surface the same message as a 400 instead of the 500 handler.
    // confirm_sesskey()/require_sesskey() dropped: token auth replaces it.
    try {
        $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $message = '';
        $extra = [];
        if ($action === 'save_line') {
            pqfin_save_invoice_line($invoiceid, [
                'id' => $bint('lineid', 0),
                'description' => $btext('description', ''),
                'quantity' => $balnum('quantity', '1'),
                'unitamount' => $braw('unitamount', '0'),
                'discountamount' => $braw('discountamount', '0'),
                'taxamount' => $braw('taxamount', '0'),
                'offeringid' => $bint('offeringid', 0),
                'requestid' => $bint('requestid', 0),
                'moodlecourseid' => $bint('moodlecourseid', 0),
                'teacherid' => $bint('teacherid', 0),
            ], $userid);
            $message = 'Invoice line saved.';
        } else if ($action === 'void_line') {
            pqfin_save_invoice_line($invoiceid, [
                'id' => $bint('lineid', 0),
                'description' => $btext('description', 'Voided line'),
                'quantity' => $balnum('quantity', '1'),
                'unitamount' => $braw('unitamount', '0'),
                'discountamount' => $braw('discountamount', '0'),
                'taxamount' => $braw('taxamount', '0'),
                'status' => 'void',
            ], $userid);
            $message = 'Invoice line voided.';
        } else if ($action === 'issue') {
            pqfin_issue_invoice($invoiceid, $consumercontext, $userid);
            $message = 'Invoice issued.';
        } else if ($action === 'send_invoice_notice') {
            $sent = pqfin_send_invoice_notification($invoiceid, 'invoice_issued', $consumercontext, $userid);
            $message = 'Invoice notice sent to ' . $sent . ' recipient' . ($sent === 1 ? '' : 's') . '.';
        } else if ($action === 'revoke_invoice_links') {
            $revoked = pqfin_revoke_secure_links('invoice_view', $invoiceid, $workspaceid, $userid);
            $message = $revoked . ' invoice link' . ($revoked === 1 ? '' : 's') . ' revoked.';
        } else if ($action === 'mark_sent') {
            pqfin_mark_invoice_sent($invoiceid, $consumercontext, $userid);
            $message = 'Invoice marked sent.';
        } else if ($action === 'void_invoice') {
            pqfin_void_invoice($invoiceid, $consumercontext, $userid, $btext('voidreason', ''));
            $message = 'Invoice voided.';
        } else if ($action === 'record_payment') {
            $receiveddate = $btext('receiveddate', '');
            $receivedat = $receiveddate !== '' ? (int)strtotime($receiveddate . ' 12:00:00') : 0;
            $paymentid = pqfin_record_manual_payment_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $braw('paymentamount', ''),
                $balnum('paymentmethod', 'cash'),
                $btext('paymentreference', ''),
                $btext('paymentnotes', ''),
                $receivedat
            );
            // Legacy redirects to payment_receipt.php?paymentid=N.
            $message = 'Payment recorded (payment #' . $paymentid . ').';
            $extra['paymentid'] = (int)$paymentid;
        } else if ($action === 'create_payment_plan') {
            $firstduedate = $btext('firstduedate', '');
            $firstdueat = $firstduedate !== '' ? (int)strtotime($firstduedate . ' 12:00:00') : 0;
            pqfin_create_payment_plan_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $bint('installmentcount', 3),
                $firstdueat,
                $balnum('frequency', 'monthly'),
                $btext('termsnote', '')
            );
            $message = 'Payment plan scheduled.';
        } else if ($action === 'cancel_payment_plan') {
            pqfin_cancel_payment_plan($bint('planid', 0), $workspaceid, $consumercontext, $userid, $btext('cancelreason', ''));
            $message = 'Payment plan cancelled.';
        } else if ($action === 'create_scholarship_award') {
            pqfin_create_scholarship_award_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $braw('scholarshipamount', ''),
                $balnum('awardtype', 'need_based'),
                $btext('fundingsource', ''),
                $btext('scholarshipreason', '')
            );
            $message = 'Scholarship award approved.';
        } else if ($action === 'create_sponsor_commitment') {
            $expecteddate = $btext('sponsorexpecteddate', '');
            $expectedat = $expecteddate !== '' ? (int)strtotime($expecteddate . ' 12:00:00') : 0;
            pqfin_create_sponsor_commitment_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $bint('sponsoraccountid', 0),
                $braw('sponsoramount', ''),
                $expectedat,
                $btext('sponsortermsnote', '')
            );
            $message = 'Sponsor commitment recorded.';
        } else if ($action === 'create_marketplace_payout') {
            pqfin_create_marketplace_payout_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $bint('payoutteacherid', 0),
                $braw('payoutgrossamount', ''),
                $braw('payoutplatformfee', '0.00'),
                $btext('payoutnotes', '')
            );
            $message = 'Marketplace payout readiness recorded.';
        } else if ($action === 'send_receipt_notice') {
            $sent = pqfin_send_receipt_notification($bint('paymentid', 0), 'receipt_available', $consumercontext, $userid);
            $message = 'Receipt notice sent to ' . $sent . ' recipient' . ($sent === 1 ? '' : 's') . '.';
        } else if ($action === 'reverse_payment') {
            pqfin_reverse_payment($bint('paymentid', 0), $consumercontext, $userid, $btext('reversalreason', ''));
            $message = 'Payment reversed.';
        } else if ($action === 'create_credit_note') {
            pqfin_create_credit_note_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $braw('creditamount', ''),
                $btext('creditreason', ''),
                'credit',
                $balnum('creditreasoncode', 'manual_correction')
            );
            $message = 'Credit note created.';
        } else if ($action === 'record_write_off') {
            pqfin_create_credit_note_for_invoice(
                $invoiceid,
                $consumercontext,
                $userid,
                $braw('writeoffamount', ''),
                $btext('writeoffreason', ''),
                'write_off',
                'write_off'
            );
            $message = 'Write-off recorded.';
        } else if ($action === 'record_refund') {
            $refunddate = $btext('refunddate', '');
            $refundedat = $refunddate !== '' ? (int)strtotime($refunddate . ' 12:00:00') : 0;
            pqfin_record_refund_for_payment(
                $bint('refundpaymentid', 0),
                $invoiceid,
                $consumercontext,
                $userid,
                $braw('refundamount', ''),
                $balnum('refundmethod', 'manual'),
                $btext('refundreference', ''),
                $btext('refundreason', ''),
                $refundedat
            );
            $message = 'Refund recorded.';
        } else if ($action === 'mark_invoice_disputed') {
            pqfin_mark_finance_dispute('invoice', $invoiceid, $consumercontext, $userid, $btext('disputereason', ''));
            $message = 'Invoice marked disputed.';
        } else if ($action === 'mark_payment_disputed') {
            pqfin_mark_finance_dispute('payment', $bint('paymentid', 0), $consumercontext, $userid, $btext('paymentdisputereason', ''));
            $message = 'Payment marked disputed.';
        } else {
            // Legacy: throw new invalid_parameter_exception('Choose a valid invoice action.')
            pqpd_fail(400, 'Choose a valid invoice action.');
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'invoiceid' => $invoiceid,
    ] + $extra, JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the same loads the page performs after its POST block (verbatim) --
$invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', MUST_EXIST);
$account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$invoice->billingaccountid], '*', MUST_EXIST);
$student = (int)$invoice->studentid > 0 ? core_user::get_user((int)$invoice->studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null;
$lines = array_values($DB->get_records('local_prequran_invoice_line', ['invoiceid' => $invoiceid], 'linesequence ASC, id ASC'));
$payments = pqfin_invoice_payments($invoiceid);
$credits = pqfin_invoice_credit_notes($invoiceid);
$refunds = pqfin_invoice_refunds($invoiceid);
$paymentplans = pqfin_payment_plans_for_invoice($invoiceid);
$activepaymentplan = pqfin_active_payment_plan_for_invoice($invoiceid);
$scholarshipawards = pqfin_scholarship_awards_for_invoice($invoiceid);
$sponsorcommitments = pqfin_sponsor_commitments_for_invoice($invoiceid);
$marketplacepayouts = pqfin_marketplace_payouts_for_invoice($invoiceid);
$sponsoraccounts = pqfin_assistance_schema_ready() && pqfin_schema_ready()
    ? array_values($DB->get_records('local_prequran_billing_account', ['workspaceid' => $workspaceid, 'accounttype' => 'sponsor'], 'displayname ASC, id ASC'))
    : [];
$planinstallments = [];
foreach ($paymentplans as $plan) {
    $planinstallments[(int)$plan->id] = pqfin_installments_for_plan((int)$plan->id);
}

// Emit only the fields the page renders (billing-account internals such as
// gateway configuration are never surfaced).
$lineout = [];
$nameids = [];
foreach ($lines as $line) {
    $nameids[] = (int)$line->teacherid;
    $lineout[] = [
        'id' => (int)$line->id,
        'linesequence' => (int)$line->linesequence,
        'description' => (string)$line->description,
        'status' => (string)$line->status,
        'quantity' => (string)$line->quantity,
        'unitamount' => (string)$line->unitamount,
        'discountamount' => (string)$line->discountamount,
        'taxamount' => (string)$line->taxamount,
        'linetotal' => (string)$line->linetotal,
        'offeringid' => (int)$line->offeringid,
        'requestid' => (int)$line->requestid,
        'moodlecourseid' => (int)$line->moodlecourseid,
        'teacherid' => (int)$line->teacherid,
    ];
}
$paymentout = [];
foreach ($payments as $payment) {
    $paymentout[] = [
        'id' => (int)$payment->id,
        'receiptnumber' => (string)$payment->receiptnumber,
        'paymentmethod' => (string)$payment->paymentmethod,
        'method_label' => pqfin_payment_method_label((string)$payment->paymentmethod),
        'currency' => (string)$payment->currency,
        'amount' => (string)$payment->amount,
        'allocationamount' => (string)$payment->allocationamount,
        'status' => (string)$payment->status,
        'allocationstatus' => (string)$payment->allocationstatus,
        'receivedat' => (int)$payment->receivedat,
        'reference' => (string)$payment->reference,
    ];
}
$creditout = [];
foreach ($credits as $credit) {
    $creditout[] = [
        'creditnumber' => (string)$credit->creditnumber,
        'credittype' => (string)$credit->credittype,
        'currency' => (string)$credit->currency,
        'amount' => (string)$credit->amount,
        'status' => (string)$credit->status,
        'reason' => (string)$credit->reason,
        'issuedat' => (int)$credit->issuedat,
    ];
}
$refundout = [];
foreach ($refunds as $refund) {
    $refundout[] = [
        'refundnumber' => (string)$refund->refundnumber,
        'paymentid' => (int)$refund->paymentid,
        'currency' => (string)$refund->currency,
        'amount' => (string)$refund->amount,
        'status' => (string)$refund->status,
        'reason' => (string)$refund->reason,
        'refundedat' => (int)$refund->refundedat,
    ];
}
$planout = [];
foreach ($paymentplans as $plan) {
    $installmentout = [];
    foreach ($planinstallments[(int)$plan->id] ?? [] as $installment) {
        $installmentout[] = [
            'installmentnumber' => (int)$installment->installmentnumber,
            'status' => (string)$installment->status,
            'status_label' => pqfin_installment_status_label((string)$installment->status),
            'dueat' => (int)$installment->dueat,
            'currency' => (string)$installment->currency,
            'amount' => (string)$installment->amount,
            'paidamount' => (string)$installment->paidamount,
            'balancedue' => (string)$installment->balancedue,
        ];
    }
    $planout[] = [
        'id' => (int)$plan->id,
        'plannumber' => (string)$plan->plannumber,
        'status' => (string)$plan->status,
        'status_label' => pqfin_payment_plan_status_label((string)$plan->status),
        'currency' => (string)$plan->currency,
        'principalamount' => (string)$plan->principalamount,
        'installmentcount' => (int)$plan->installmentcount,
        'termsnote' => (string)$plan->termsnote,
        'installments' => $installmentout,
    ];
}
$awardout = [];
foreach ($scholarshipawards as $award) {
    $awardout[] = [
        'awardnumber' => (string)$award->awardnumber,
        'creditnoteid' => (int)$award->creditnoteid,
        'awardtype' => (string)$award->awardtype,
        'fundingsource' => (string)$award->fundingsource,
        'currency' => (string)$award->currency,
        'amount' => (string)$award->amount,
        'status' => (string)$award->status,
        'reason' => (string)$award->reason,
    ];
}
$commitmentout = [];
foreach ($sponsorcommitments as $commitment) {
    $commitmentout[] = [
        'commitmentnumber' => (string)$commitment->commitmentnumber,
        'expectedat' => (int)$commitment->expectedat,
        'sponsorname' => (string)($commitment->sponsorname ?? ''),
        'sponsoraccountid' => (int)$commitment->sponsoraccountid,
        'currency' => (string)$commitment->currency,
        'committedamount' => (string)$commitment->committedamount,
        'receivedamount' => (string)$commitment->receivedamount,
        'balanceamount' => (string)$commitment->balanceamount,
        'status' => (string)$commitment->status,
    ];
}
$payoutout = [];
foreach ($marketplacepayouts as $payout) {
    $nameids[] = (int)$payout->teacherid;
    $payoutout[] = [
        'payoutnumber' => (string)$payout->payoutnumber,
        'requestid' => (int)$payout->requestid,
        'teacherid' => (int)$payout->teacherid,
        'currency' => (string)$payout->currency,
        'grossamount' => (string)$payout->grossamount,
        'platformfee' => (string)$payout->platformfee,
        'payoutamount' => (string)$payout->payoutamount,
        'status' => (string)$payout->status,
    ];
}
$sponsoroptions = [];
foreach ($sponsoraccounts as $sponsor) {
    $sponsoroptions[] = ['id' => (int)$sponsor->id, 'displayname' => (string)$sponsor->displayname];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'invoice' => [
        'id' => (int)$invoice->id,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'status' => (string)$invoice->status,
        'status_label' => pqfin_invoice_status_label((string)$invoice->status),
        'currency' => (string)$invoice->currency,
        'subtotal' => (string)$invoice->subtotal,
        'discounttotal' => (string)$invoice->discounttotal,
        'taxtotal' => (string)$invoice->taxtotal,
        'total' => (string)$invoice->total,
        'paidamount' => (string)$invoice->paidamount,
        'creditedamount' => (string)$invoice->creditedamount,
        'balancedue' => (string)$invoice->balancedue,
        // The page gates the payment-plan form on pqfin_money_to_cents(balancedue) > 0.
        'balanceduecents' => pqfin_money_to_cents((string)$invoice->balancedue),
        'issuedat' => (int)$invoice->issuedat,
        'dueat' => (int)$invoice->dueat,
        'studentid' => (int)$invoice->studentid,
    ],
    'account' => ['id' => (int)$account->id, 'displayname' => (string)$account->displayname],
    'student' => $student ? ['id' => (int)$student->id, 'name' => fullname($student)] : null,
    'lines' => $lineout,
    'payments' => $paymentout,
    'credits' => $creditout,
    'refunds' => $refundout,
    'paymentplans' => $planout,
    'activeplan' => (bool)$activepaymentplan,
    'scholarshipawards' => $awardout,
    'sponsorcommitments' => $commitmentout,
    'marketplacepayouts' => $payoutout,
    'sponsoraccounts' => $sponsoroptions,
    'paymentmethods' => pqfin_payment_method_options(),
    'schemaready' => pqfin_schema_ready(),
    'paymentschemaready' => pqfin_payment_schema_ready(),
    'planschemaready' => pqfin_payment_plan_schema_ready(),
    'assistanceschemaready' => pqfin_assistance_schema_ready(),
    'correctionschemaready' => pqfin_correction_schema_ready(),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
