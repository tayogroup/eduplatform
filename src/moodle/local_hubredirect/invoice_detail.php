<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);
$editlineid = optional_param('editlineid', 0, PARAM_INT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace admins can manage invoices.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Invoice access required');
}
if (!pqfin_invoice_schema_ready()) {
    pqh_access_denied('Invoice tables are not ready yet. Run the local_prequran plugin upgrade first.', new moodle_url('/local/hubredirect/invoices.php', $urlparams), 'Invoice schema unavailable');
}

$invoice = pqfin_invoice_belongs_to_workspace($invoiceid, $workspaceid, $consumercontext);
if (!$invoice) {
    pqh_access_denied('Invoice is outside this workspace or no longer exists.', new moodle_url('/local/hubredirect/invoices.php', $urlparams), 'Invoice unavailable');
}

$message = optional_param('created', 0, PARAM_INT) === 1 ? 'Draft invoice created.' : '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    try {
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action === 'save_line') {
            pqfin_save_invoice_line($invoiceid, [
                'id' => optional_param('lineid', 0, PARAM_INT),
                'description' => optional_param('description', '', PARAM_TEXT),
                'quantity' => optional_param('quantity', '1', PARAM_ALPHANUMEXT),
                'unitamount' => optional_param('unitamount', '0', PARAM_RAW_TRIMMED),
                'discountamount' => optional_param('discountamount', '0', PARAM_RAW_TRIMMED),
                'taxamount' => optional_param('taxamount', '0', PARAM_RAW_TRIMMED),
                'offeringid' => optional_param('offeringid', 0, PARAM_INT),
                'requestid' => optional_param('requestid', 0, PARAM_INT),
                'moodlecourseid' => optional_param('moodlecourseid', 0, PARAM_INT),
                'teacherid' => optional_param('teacherid', 0, PARAM_INT),
            ], (int)$USER->id);
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'void_line') {
            pqfin_save_invoice_line($invoiceid, [
                'id' => optional_param('lineid', 0, PARAM_INT),
                'description' => optional_param('description', 'Voided line', PARAM_TEXT),
                'quantity' => optional_param('quantity', '1', PARAM_ALPHANUMEXT),
                'unitamount' => optional_param('unitamount', '0', PARAM_RAW_TRIMMED),
                'discountamount' => optional_param('discountamount', '0', PARAM_RAW_TRIMMED),
                'taxamount' => optional_param('taxamount', '0', PARAM_RAW_TRIMMED),
                'status' => 'void',
            ], (int)$USER->id);
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'issue') {
            pqfin_issue_invoice($invoiceid, $consumercontext, (int)$USER->id);
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'send_invoice_notice') {
            $sent = pqfin_send_invoice_notification($invoiceid, 'invoice_issued', $consumercontext, (int)$USER->id);
            $message = 'Invoice notice sent to ' . $sent . ' recipient' . ($sent === 1 ? '' : 's') . '.';
        } else if ($action === 'revoke_invoice_links') {
            $revoked = pqfin_revoke_secure_links('invoice_view', $invoiceid, $workspaceid, (int)$USER->id);
            $message = $revoked . ' invoice link' . ($revoked === 1 ? '' : 's') . ' revoked.';
        } else if ($action === 'mark_sent') {
            pqfin_mark_invoice_sent($invoiceid, $consumercontext, (int)$USER->id);
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'void_invoice') {
            pqfin_void_invoice($invoiceid, $consumercontext, (int)$USER->id, optional_param('voidreason', '', PARAM_TEXT));
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'record_payment') {
            $receiveddate = optional_param('receiveddate', '', PARAM_TEXT);
            $receivedat = $receiveddate !== '' ? (int)strtotime($receiveddate . ' 12:00:00') : 0;
            $paymentid = pqfin_record_manual_payment_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('paymentamount', '', PARAM_RAW_TRIMMED),
                optional_param('paymentmethod', 'cash', PARAM_ALPHANUMEXT),
                optional_param('paymentreference', '', PARAM_TEXT),
                optional_param('paymentnotes', '', PARAM_TEXT),
                $receivedat
            );
            redirect(new moodle_url('/local/hubredirect/payment_receipt.php', $urlparams + ['paymentid' => $paymentid]));
        } else if ($action === 'create_payment_plan') {
            $firstduedate = optional_param('firstduedate', '', PARAM_TEXT);
            $firstdueat = $firstduedate !== '' ? (int)strtotime($firstduedate . ' 12:00:00') : 0;
            pqfin_create_payment_plan_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('installmentcount', 3, PARAM_INT),
                $firstdueat,
                optional_param('frequency', 'monthly', PARAM_ALPHANUMEXT),
                optional_param('termsnote', '', PARAM_TEXT)
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'cancel_payment_plan') {
            pqfin_cancel_payment_plan(optional_param('planid', 0, PARAM_INT), $workspaceid, $consumercontext, (int)$USER->id, optional_param('cancelreason', '', PARAM_TEXT));
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'create_scholarship_award') {
            pqfin_create_scholarship_award_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('scholarshipamount', '', PARAM_RAW_TRIMMED),
                optional_param('awardtype', 'need_based', PARAM_ALPHANUMEXT),
                optional_param('fundingsource', '', PARAM_TEXT),
                optional_param('scholarshipreason', '', PARAM_TEXT)
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'create_sponsor_commitment') {
            $expecteddate = optional_param('sponsorexpecteddate', '', PARAM_TEXT);
            $expectedat = $expecteddate !== '' ? (int)strtotime($expecteddate . ' 12:00:00') : 0;
            pqfin_create_sponsor_commitment_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('sponsoraccountid', 0, PARAM_INT),
                optional_param('sponsoramount', '', PARAM_RAW_TRIMMED),
                $expectedat,
                optional_param('sponsortermsnote', '', PARAM_TEXT)
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'create_marketplace_payout') {
            pqfin_create_marketplace_payout_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('payoutteacherid', 0, PARAM_INT),
                optional_param('payoutgrossamount', '', PARAM_RAW_TRIMMED),
                optional_param('payoutplatformfee', '0.00', PARAM_RAW_TRIMMED),
                optional_param('payoutnotes', '', PARAM_TEXT)
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'send_receipt_notice') {
            $sent = pqfin_send_receipt_notification(optional_param('paymentid', 0, PARAM_INT), 'receipt_available', $consumercontext, (int)$USER->id);
            $message = 'Receipt notice sent to ' . $sent . ' recipient' . ($sent === 1 ? '' : 's') . '.';
        } else if ($action === 'reverse_payment') {
            pqfin_reverse_payment(optional_param('paymentid', 0, PARAM_INT), $consumercontext, (int)$USER->id, optional_param('reversalreason', '', PARAM_TEXT));
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'create_credit_note') {
            pqfin_create_credit_note_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('creditamount', '', PARAM_RAW_TRIMMED),
                optional_param('creditreason', '', PARAM_TEXT),
                'credit',
                optional_param('creditreasoncode', 'manual_correction', PARAM_ALPHANUMEXT)
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'record_write_off') {
            pqfin_create_credit_note_for_invoice(
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('writeoffamount', '', PARAM_RAW_TRIMMED),
                optional_param('writeoffreason', '', PARAM_TEXT),
                'write_off',
                'write_off'
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'record_refund') {
            $refunddate = optional_param('refunddate', '', PARAM_TEXT);
            $refundedat = $refunddate !== '' ? (int)strtotime($refunddate . ' 12:00:00') : 0;
            pqfin_record_refund_for_payment(
                optional_param('refundpaymentid', 0, PARAM_INT),
                $invoiceid,
                $consumercontext,
                (int)$USER->id,
                optional_param('refundamount', '', PARAM_RAW_TRIMMED),
                optional_param('refundmethod', 'manual', PARAM_ALPHANUMEXT),
                optional_param('refundreference', '', PARAM_TEXT),
                optional_param('refundreason', '', PARAM_TEXT),
                $refundedat
            );
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'mark_invoice_disputed') {
            pqfin_mark_finance_dispute('invoice', $invoiceid, $consumercontext, (int)$USER->id, optional_param('disputereason', '', PARAM_TEXT));
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else if ($action === 'mark_payment_disputed') {
            pqfin_mark_finance_dispute('payment', optional_param('paymentid', 0, PARAM_INT), $consumercontext, (int)$USER->id, optional_param('paymentdisputereason', '', PARAM_TEXT));
            redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid]));
        } else {
            throw new invalid_parameter_exception('Choose a valid invoice action.');
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

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
$editline = null;
foreach ($lines as $line) {
    if ((int)$line->id === $editlineid) {
        $editline = $line;
        break;
    }
}
$invoiceurlparams = $urlparams + ['invoiceid' => $invoiceid];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/invoice_detail.php', $invoiceurlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Invoice Detail');
$PAGE->set_heading('Invoice Detail');
$PAGE->add_body_class('pqinvdet-page');

echo $OUTPUT->header();
?>
<style>
body.pqinvdet-page header,body.pqinvdet-page footer,body.pqinvdet-page nav.navbar,body.pqinvdet-page #page-header,body.pqinvdet-page #page-footer,body.pqinvdet-page .drawer,body.pqinvdet-page .drawer-toggles,body.pqinvdet-page .block-region,body.pqinvdet-page [data-region="drawer"],body.pqinvdet-page [data-region="right-hand-drawer"]{display:none!important}
body.pqinvdet-page #page,body.pqinvdet-page #page-content,body.pqinvdet-page #region-main,body.pqinvdet-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqid-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqid-wrap{max-width:1240px;margin:0 auto}.pqid-top,.pqid-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqid-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqid-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqid-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqid-actions{display:flex;gap:8px;flex-wrap:wrap}.pqid-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqid-btn--primary{background:#2f6f4e;color:#fff!important}.pqid-btn--danger{background:#fff0ef;color:#8a3028!important}.pqid-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:14px}.pqid-field{display:grid;gap:5px;margin-bottom:10px}.pqid-field label{color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqid-input,.pqid-select{width:100%;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800;box-sizing:border-box}.pqid-formgrid{display:grid;grid-template-columns:2fr 80px 120px 120px 120px;gap:8px}.pqid-alert{margin:0 0 12px;padding:10px 12px;border-radius:8px;font-weight:900}.pqid-alert--ok{background:#eaf7ef;color:#1f5d3f}.pqid-alert--err{background:#fff0ef;color:#8a3028}.pqid-table{width:100%;border-collapse:collapse}.pqid-table th,.pqid-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqid-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqid-kv{display:grid;grid-template-columns:120px minmax(0,1fr);border:1px solid rgba(23,48,68,.1);border-radius:8px;overflow:hidden}.pqid-kv div{padding:10px;border-bottom:1px solid rgba(23,48,68,.08);font-size:13px;font-weight:850}.pqid-kv div:nth-child(odd){background:#f2f6f8;color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqid-kv div:nth-last-child(-n+2){border-bottom:0}.pqid-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqid-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqid-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:940px){.pqid-top,.pqid-grid,.pqid-formgrid{display:block}.pqid-panel{margin-bottom:14px}.pqid-table thead{display:none}.pqid-table tr,.pqid-table td{display:block}.pqid-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqid-shell"><div class="pqid-wrap">
  <section class="pqid-top">
    <div>
      <h1 class="pqid-title"><?php echo s((string)$invoice->invoicenumber !== '' ? (string)$invoice->invoicenumber : 'Draft invoice #' . (int)$invoice->id); ?></h1>
      <p class="pqid-sub"><?php echo s((string)$account->displayname); ?> / <?php echo $student ? s(fullname($student)) : 'No student assigned'; ?></p>
    </div>
    <nav class="pqid-actions">
      <a class="pqid-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoices.php', $urlparams))->out(false); ?>">All invoices</a>
      <a class="pqid-btn" href="<?php echo (new moodle_url('/local/hubredirect/student_finance.php', $urlparams + ((int)$invoice->studentid > 0 ? ['studentid' => (int)$invoice->studentid] : [])))->out(false); ?>">Student finance</a>
      <?php if (in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid', 'paid'], true)): ?>
        <form method="post" style="display:inline-flex;gap:8px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="send_invoice_notice">
          <button class="pqid-btn pqid-btn--primary" type="submit">Send invoice notice</button>
        </form>
        <form method="post" style="display:inline-flex;gap:8px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="revoke_invoice_links">
          <button class="pqid-btn pqid-btn--danger" type="submit">Revoke invoice links</button>
        </form>
      <?php endif; ?>
    </nav>
  </section>
  <?php if ($message !== ''): ?><div class="pqid-alert pqid-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqid-alert pqid-alert--err"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqid-grid">
    <div class="pqid-panel">
      <?php if ((string)$invoice->status === 'draft'): ?>
        <form method="post" style="margin-bottom:18px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="save_line">
          <input type="hidden" name="lineid" value="<?php echo $editline ? (int)$editline->id : 0; ?>">
          <div class="pqid-formgrid">
            <div class="pqid-field"><label>Description</label><input class="pqid-input" name="description" value="<?php echo $editline ? s((string)$editline->description) : ''; ?>" placeholder="Tuition"></div>
            <div class="pqid-field"><label>Qty</label><input class="pqid-input" name="quantity" value="<?php echo $editline ? s((string)$editline->quantity) : '1'; ?>"></div>
            <div class="pqid-field"><label>Unit</label><input class="pqid-input" name="unitamount" value="<?php echo $editline ? s((string)$editline->unitamount) : '0.00'; ?>"></div>
            <div class="pqid-field"><label>Discount</label><input class="pqid-input" name="discountamount" value="<?php echo $editline ? s((string)$editline->discountamount) : '0.00'; ?>"></div>
            <div class="pqid-field"><label>Tax</label><input class="pqid-input" name="taxamount" value="<?php echo $editline ? s((string)$editline->taxamount) : '0.00'; ?>"></div>
          </div>
          <div class="pqid-formgrid" style="grid-template-columns:1fr 1fr 1fr 1fr auto">
            <div class="pqid-field"><label>Offering ID</label><input class="pqid-input" name="offeringid" value="<?php echo $editline ? (int)$editline->offeringid : 0; ?>"></div>
            <div class="pqid-field"><label>Request ID</label><input class="pqid-input" name="requestid" value="<?php echo $editline ? (int)$editline->requestid : 0; ?>"></div>
            <div class="pqid-field"><label>Moodle course</label><input class="pqid-input" name="moodlecourseid" value="<?php echo $editline ? (int)$editline->moodlecourseid : 0; ?>"></div>
            <div class="pqid-field"><label>Teacher ID</label><input class="pqid-input" name="teacherid" value="<?php echo $editline ? (int)$editline->teacherid : 0; ?>"></div>
            <div class="pqid-field"><label>&nbsp;</label><button class="pqid-btn pqid-btn--primary" type="submit"><?php echo $editline ? 'Save line' : 'Add line'; ?></button></div>
          </div>
        </form>
      <?php endif; ?>
      <?php if (!$lines): ?><div class="pqid-empty">No invoice lines yet.</div><?php endif; ?>
      <?php if ($lines): ?>
        <table class="pqid-table">
          <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Tax</th><th>Total</th><th>Sources</th><th></th></tr></thead>
          <tbody>
          <?php foreach ($lines as $line): ?>
            <tr>
              <td data-label="#"><?php echo (int)$line->linesequence; ?></td>
              <td data-label="Description"><?php echo s((string)$line->description); ?><?php if ((string)$line->status !== 'active'): ?><span class="pqid-muted"><?php echo s((string)$line->status); ?></span><?php endif; ?></td>
              <td data-label="Qty"><?php echo s((string)$line->quantity); ?></td>
              <td data-label="Unit"><?php echo s((string)$line->unitamount); ?></td>
              <td data-label="Discount"><?php echo s((string)$line->discountamount); ?></td>
              <td data-label="Tax"><?php echo s((string)$line->taxamount); ?></td>
              <td data-label="Total"><?php echo s((string)$line->linetotal); ?></td>
              <td data-label="Sources"><span class="pqid-muted">Offering <?php echo (int)$line->offeringid; ?> / Request <?php echo (int)$line->requestid; ?> / Course <?php echo (int)$line->moodlecourseid; ?> / Teacher <?php echo (int)$line->teacherid; ?></span></td>
              <td data-label="Actions">
                <?php if ((string)$invoice->status === 'draft' && (string)$line->status === 'active'): ?>
                  <a class="pqid-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoice_detail.php', $invoiceurlparams + ['editlineid' => (int)$line->id]))->out(false); ?>">Edit</a>
                  <form method="post" style="display:inline">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="void_line">
                    <input type="hidden" name="lineid" value="<?php echo (int)$line->id; ?>">
                    <input type="hidden" name="description" value="<?php echo s((string)$line->description); ?>">
                    <input type="hidden" name="quantity" value="<?php echo s((string)$line->quantity); ?>">
                    <input type="hidden" name="unitamount" value="<?php echo s((string)$line->unitamount); ?>">
                    <input type="hidden" name="discountamount" value="<?php echo s((string)$line->discountamount); ?>">
                    <input type="hidden" name="taxamount" value="<?php echo s((string)$line->taxamount); ?>">
                    <button class="pqid-btn pqid-btn--danger" type="submit">Void line</button>
                  </form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      <h2 class="pqid-title" style="font-size:20px;margin-top:18px">Payments And Receipts</h2>
      <?php if (!$payments): ?><div class="pqid-empty">No payments recorded yet.</div><?php endif; ?>
      <?php if ($payments): ?>
        <table class="pqid-table">
          <thead><tr><th>Receipt</th><th>Method</th><th>Amount</th><th>Status</th><th>Received</th><th>Reference</th><th></th></tr></thead>
          <tbody>
          <?php foreach ($payments as $payment): ?>
            <tr>
              <td data-label="Receipt"><span class="pqid-pill"><?php echo s((string)$payment->receiptnumber); ?></span></td>
              <td data-label="Method"><?php echo s(pqfin_payment_method_label((string)$payment->paymentmethod)); ?></td>
              <td data-label="Amount"><?php echo s((string)$payment->currency . ' ' . (string)$payment->allocationamount); ?></td>
              <td data-label="Status"><span class="pqid-pill"><?php echo s((string)$payment->status); ?></span><span class="pqid-muted">Allocation <?php echo s((string)$payment->allocationstatus); ?></span></td>
              <td data-label="Received"><?php echo (int)$payment->receivedat > 0 ? s(userdate((int)$payment->receivedat, get_string('strftimedate'))) : 'Not set'; ?></td>
              <td data-label="Reference"><?php echo s((string)$payment->reference); ?></td>
              <td data-label="Actions">
                <a class="pqid-btn" href="<?php echo (new moodle_url('/local/hubredirect/payment_receipt.php', $urlparams + ['paymentid' => (int)$payment->id]))->out(false); ?>">Receipt</a>
                <?php if ((string)$payment->status !== 'reversed'): ?>
                  <form method="post" style="margin-top:6px">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="send_receipt_notice">
                    <input type="hidden" name="paymentid" value="<?php echo (int)$payment->id; ?>">
                    <button class="pqid-btn pqid-btn--primary" type="submit">Send receipt</button>
                  </form>
                  <form method="post" style="margin-top:6px">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="mark_payment_disputed">
                    <input type="hidden" name="paymentid" value="<?php echo (int)$payment->id; ?>">
                    <input class="pqid-input" name="paymentdisputereason" placeholder="Dispute reason">
                    <button class="pqid-btn" type="submit">Dispute</button>
                  </form>
                  <form method="post" style="margin-top:6px">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="reverse_payment">
                    <input type="hidden" name="paymentid" value="<?php echo (int)$payment->id; ?>">
                    <input class="pqid-input" name="reversalreason" placeholder="Reversal reason">
                    <button class="pqid-btn pqid-btn--danger" type="submit">Reverse</button>
                  </form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      <h2 class="pqid-title" style="font-size:20px;margin-top:18px">Payment Plans And Scheduled Installments</h2>
      <?php if (!pqfin_payment_plan_schema_ready()): ?>
        <div class="pqid-empty">Payment plan schema is not ready. Run the local_prequran Moodle upgrade.</div>
      <?php elseif (!$paymentplans): ?>
        <div class="pqid-empty">No payment plan has been scheduled for this invoice.</div>
      <?php endif; ?>
      <?php foreach ($paymentplans as $plan): ?>
        <div style="margin-top:12px;padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff">
          <div class="pqid-actions" style="justify-content:space-between;align-items:flex-start">
            <div>
              <span class="pqid-pill"><?php echo s((string)$plan->plannumber); ?></span>
              <span class="pqid-pill"><?php echo s(pqfin_payment_plan_status_label((string)$plan->status)); ?></span>
              <span class="pqid-muted"><?php echo s((string)$plan->currency . ' ' . (string)$plan->principalamount); ?> over <?php echo (int)$plan->installmentcount; ?> installments</span>
              <?php if (trim((string)$plan->termsnote) !== ''): ?><span class="pqid-muted"><?php echo s((string)$plan->termsnote); ?></span><?php endif; ?>
            </div>
            <?php if (in_array((string)$plan->status, ['draft', 'active', 'past_due'], true)): ?>
              <form method="post" style="display:grid;gap:6px;min-width:220px">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="cancel_payment_plan">
                <input type="hidden" name="planid" value="<?php echo (int)$plan->id; ?>">
                <input class="pqid-input" name="cancelreason" placeholder="Cancellation reason">
                <button class="pqid-btn pqid-btn--danger" type="submit">Cancel plan</button>
              </form>
            <?php endif; ?>
          </div>
          <?php $installments = $planinstallments[(int)$plan->id] ?? []; ?>
          <?php if ($installments): ?>
            <table class="pqid-table" style="margin-top:10px">
              <thead><tr><th>#</th><th>Status</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th></tr></thead>
              <tbody>
                <?php foreach ($installments as $installment): ?>
                  <tr>
                    <td data-label="#"><?php echo (int)$installment->installmentnumber; ?></td>
                    <td data-label="Status"><span class="pqid-pill"><?php echo s(pqfin_installment_status_label((string)$installment->status)); ?></span></td>
                    <td data-label="Due"><?php echo (int)$installment->dueat > 0 ? s(userdate((int)$installment->dueat, get_string('strftimedate'))) : 'Not set'; ?></td>
                    <td data-label="Amount"><?php echo s((string)$installment->currency . ' ' . (string)$installment->amount); ?></td>
                    <td data-label="Paid"><?php echo s((string)$installment->paidamount); ?></td>
                    <td data-label="Balance"><?php echo s((string)$installment->balancedue); ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
      <h2 class="pqid-title" style="font-size:20px;margin-top:18px">Scholarships, Sponsorships, And Marketplace Payout Readiness</h2>
      <?php if (!pqfin_assistance_schema_ready()): ?>
        <div class="pqid-empty">Scholarship, sponsorship, and payout readiness schema is not ready. Run the local_prequran Moodle upgrade.</div>
      <?php elseif (!$scholarshipawards && !$sponsorcommitments && !$marketplacepayouts): ?>
        <div class="pqid-empty">No scholarship awards, sponsor commitments, or marketplace payout readiness records have been added yet.</div>
      <?php endif; ?>
      <?php if ($scholarshipawards): ?>
        <table class="pqid-table" style="margin-top:10px">
          <thead><tr><th>Award</th><th>Type</th><th>Source</th><th>Amount</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>
            <?php foreach ($scholarshipawards as $award): ?>
              <tr>
                <td data-label="Award"><?php echo s((string)$award->awardnumber); ?><span class="pqid-muted">Credit #<?php echo (int)$award->creditnoteid; ?></span></td>
                <td data-label="Type"><?php echo s(ucwords(str_replace('_', ' ', (string)$award->awardtype))); ?></td>
                <td data-label="Source"><?php echo s((string)$award->fundingsource); ?></td>
                <td data-label="Amount"><?php echo s((string)$award->currency . ' ' . (string)$award->amount); ?></td>
                <td data-label="Status"><span class="pqid-pill"><?php echo s((string)$award->status); ?></span></td>
                <td data-label="Reason"><?php echo s((string)$award->reason); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      <?php if ($sponsorcommitments): ?>
        <table class="pqid-table" style="margin-top:10px">
          <thead><tr><th>Commitment</th><th>Sponsor</th><th>Committed</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>
            <?php foreach ($sponsorcommitments as $commitment): ?>
              <tr>
                <td data-label="Commitment"><?php echo s((string)$commitment->commitmentnumber); ?><span class="pqid-muted"><?php echo (int)$commitment->expectedat > 0 ? 'Expected ' . s(userdate((int)$commitment->expectedat, get_string('strftimedate'))) : 'No expected date'; ?></span></td>
                <td data-label="Sponsor"><?php echo s((string)($commitment->sponsorname ?? 'Sponsor account #' . (int)$commitment->sponsoraccountid)); ?></td>
                <td data-label="Committed"><?php echo s((string)$commitment->currency . ' ' . (string)$commitment->committedamount); ?></td>
                <td data-label="Received"><?php echo s((string)$commitment->receivedamount); ?></td>
                <td data-label="Balance"><?php echo s((string)$commitment->balanceamount); ?></td>
                <td data-label="Status"><span class="pqid-pill"><?php echo s((string)$commitment->status); ?></span></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      <?php if ($marketplacepayouts): ?>
        <table class="pqid-table" style="margin-top:10px">
          <thead><tr><th>Payout</th><th>Teacher</th><th>Gross</th><th>Platform fee</th><th>Net payout</th><th>Status</th></tr></thead>
          <tbody>
            <?php foreach ($marketplacepayouts as $payout): ?>
              <tr>
                <td data-label="Payout"><?php echo s((string)$payout->payoutnumber); ?><span class="pqid-muted">Request #<?php echo (int)$payout->requestid; ?></span></td>
                <td data-label="Teacher">#<?php echo (int)$payout->teacherid; ?></td>
                <td data-label="Gross"><?php echo s((string)$payout->currency . ' ' . (string)$payout->grossamount); ?></td>
                <td data-label="Platform fee"><?php echo s((string)$payout->platformfee); ?></td>
                <td data-label="Net payout"><?php echo s((string)$payout->payoutamount); ?></td>
                <td data-label="Status"><span class="pqid-pill"><?php echo s(str_replace('_', ' ', (string)$payout->status)); ?></span></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      <h2 class="pqid-title" style="font-size:20px;margin-top:18px">Credits, Write-Offs, And Refunds</h2>
      <?php if (!$credits && !$refunds): ?><div class="pqid-empty">No credits, write-offs, or refunds recorded yet.</div><?php endif; ?>
      <?php if ($credits): ?>
        <table class="pqid-table">
          <thead><tr><th>Credit</th><th>Type</th><th>Amount</th><th>Status</th><th>Reason</th><th>Issued</th></tr></thead>
          <tbody>
          <?php foreach ($credits as $credit): ?>
            <tr>
              <td data-label="Credit"><?php echo s((string)$credit->creditnumber); ?></td>
              <td data-label="Type"><?php echo s(ucwords(str_replace('_', ' ', (string)$credit->credittype))); ?></td>
              <td data-label="Amount"><?php echo s((string)$credit->currency . ' ' . (string)$credit->amount); ?></td>
              <td data-label="Status"><span class="pqid-pill"><?php echo s((string)$credit->status); ?></span></td>
              <td data-label="Reason"><?php echo s((string)$credit->reason); ?></td>
              <td data-label="Issued"><?php echo (int)$credit->issuedat > 0 ? s(userdate((int)$credit->issuedat, get_string('strftimedate'))) : 'Not set'; ?></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      <?php if ($refunds): ?>
        <table class="pqid-table" style="margin-top:12px">
          <thead><tr><th>Refund</th><th>Payment</th><th>Amount</th><th>Status</th><th>Reason</th><th>Refunded</th></tr></thead>
          <tbody>
          <?php foreach ($refunds as $refund): ?>
            <tr>
              <td data-label="Refund"><?php echo s((string)$refund->refundnumber); ?></td>
              <td data-label="Payment">#<?php echo (int)$refund->paymentid; ?></td>
              <td data-label="Amount"><?php echo s((string)$refund->currency . ' ' . (string)$refund->amount); ?></td>
              <td data-label="Status"><span class="pqid-pill"><?php echo s((string)$refund->status); ?></span></td>
              <td data-label="Reason"><?php echo s((string)$refund->reason); ?></td>
              <td data-label="Refunded"><?php echo (int)$refund->refundedat > 0 ? s(userdate((int)$refund->refundedat, get_string('strftimedate'))) : 'Not set'; ?></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
    <aside class="pqid-panel">
      <h2 class="pqid-title" style="font-size:20px">Invoice Summary</h2>
      <div style="margin:0 0 12px"><span class="pqid-pill"><?php echo s(pqfin_invoice_status_label((string)$invoice->status)); ?></span><span class="pqid-pill"><?php echo s((string)$invoice->currency); ?></span></div>
      <div class="pqid-kv">
        <div>Subtotal</div><div><?php echo s((string)$invoice->subtotal); ?></div>
        <div>Discount</div><div><?php echo s((string)$invoice->discounttotal); ?></div>
        <div>Tax</div><div><?php echo s((string)$invoice->taxtotal); ?></div>
        <div>Total</div><div><?php echo s((string)$invoice->total); ?></div>
        <div>Paid</div><div><?php echo s((string)$invoice->paidamount); ?></div>
        <div>Credited</div><div><?php echo s((string)$invoice->creditedamount); ?></div>
        <div>Balance</div><div><?php echo s((string)$invoice->balancedue); ?></div>
        <div>Issued</div><div><?php echo (int)$invoice->issuedat > 0 ? s(userdate((int)$invoice->issuedat, get_string('strftimedatetimeshort'))) : 'Not issued'; ?></div>
        <div>Due</div><div><?php echo (int)$invoice->dueat > 0 ? s(userdate((int)$invoice->dueat, get_string('strftimedate'))) : 'Not issued'; ?></div>
      </div>
      <div class="pqid-actions" style="margin-top:14px">
        <?php if ((string)$invoice->status === 'draft'): ?>
          <form method="post"><input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="action" value="issue"><button class="pqid-btn pqid-btn--primary" type="submit">Issue invoice</button></form>
        <?php endif; ?>
        <?php if ((string)$invoice->status === 'issued'): ?>
          <form method="post"><input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="action" value="mark_sent"><button class="pqid-btn pqid-btn--primary" type="submit">Mark sent</button></form>
        <?php endif; ?>
      </div>
      <?php if (pqfin_payment_schema_ready() && in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid', 'paid'], true)): ?>
        <form method="post" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,48,68,.1)">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="record_payment">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Record Payment</h2>
          <div class="pqid-field"><label>Amount</label><input class="pqid-input" name="paymentamount" value="<?php echo s((string)$invoice->balancedue); ?>"></div>
          <div class="pqid-field"><label>Method</label><select class="pqid-select" name="paymentmethod"><?php foreach (pqfin_payment_method_options() as $method => $label): ?><option value="<?php echo s($method); ?>"><?php echo s($label); ?></option><?php endforeach; ?></select></div>
          <div class="pqid-field"><label>Reference</label><input class="pqid-input" name="paymentreference" placeholder="Bank ref, check no, mobile money id"></div>
          <div class="pqid-field"><label>Received date</label><input class="pqid-input" type="date" name="receiveddate" value="<?php echo s(gmdate('Y-m-d')); ?>"></div>
          <div class="pqid-field"><label>Notes</label><input class="pqid-input" name="paymentnotes" placeholder="Optional receipt note"></div>
          <button class="pqid-btn pqid-btn--primary" type="submit">Record payment</button>
        </form>
      <?php elseif (!pqfin_payment_schema_ready()): ?>
        <div class="pqid-empty" style="margin-top:14px">Payment schema is not ready. Run the local_prequran Moodle upgrade.</div>
      <?php endif; ?>
      <?php if (pqfin_payment_plan_schema_ready() && !$activepaymentplan && in_array((string)$invoice->status, ['issued', 'sent', 'partially_paid'], true) && pqfin_money_to_cents((string)$invoice->balancedue) > 0): ?>
        <form method="post" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,48,68,.1)">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_payment_plan">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Create Payment Plan</h2>
          <div class="pqid-field"><label>Installments</label><input class="pqid-input" type="number" min="2" max="24" name="installmentcount" value="3"></div>
          <div class="pqid-field"><label>Frequency</label><select class="pqid-select" name="frequency"><option value="monthly">Monthly</option><option value="biweekly">Every 2 weeks</option><option value="weekly">Weekly</option></select></div>
          <div class="pqid-field"><label>First due date</label><input class="pqid-input" type="date" name="firstduedate" value="<?php echo s(gmdate('Y-m-d', time() + (7 * DAYSECS))); ?>"></div>
          <div class="pqid-field"><label>Terms note</label><input class="pqid-input" name="termsnote" placeholder="Optional agreement note"></div>
          <button class="pqid-btn pqid-btn--primary" type="submit">Schedule installments</button>
        </form>
      <?php elseif (pqfin_payment_plan_schema_ready() && $activepaymentplan): ?>
        <div class="pqid-empty" style="margin-top:14px">This invoice already has an active payment plan.</div>
      <?php endif; ?>
      <?php if (pqfin_assistance_schema_ready() && (string)$invoice->status !== 'void'): ?>
        <form method="post" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,48,68,.1)">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_scholarship_award">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Scholarship Award</h2>
          <div class="pqid-field"><label>Amount</label><input class="pqid-input" name="scholarshipamount" value="<?php echo s((string)$invoice->balancedue); ?>"></div>
          <div class="pqid-field"><label>Award type</label><select class="pqid-select" name="awardtype"><option value="need_based">Need based</option><option value="merit">Merit</option><option value="hardship">Hardship</option><option value="staff">Staff approved</option></select></div>
          <div class="pqid-field"><label>Funding source</label><input class="pqid-input" name="fundingsource" placeholder="Fund, donor, program, or internal"></div>
          <div class="pqid-field"><label>Required reason</label><input class="pqid-input" name="scholarshipreason" placeholder="Approval note"></div>
          <button class="pqid-btn" type="submit">Approve scholarship</button>
        </form>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_sponsor_commitment">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Sponsor Commitment</h2>
          <div class="pqid-field"><label>Sponsor account</label><select class="pqid-select" name="sponsoraccountid"><?php foreach ($sponsoraccounts as $sponsor): ?><option value="<?php echo (int)$sponsor->id; ?>"><?php echo s((string)$sponsor->displayname); ?></option><?php endforeach; ?></select></div>
          <div class="pqid-field"><label>Amount</label><input class="pqid-input" name="sponsoramount" value="<?php echo s((string)$invoice->balancedue); ?>"></div>
          <div class="pqid-field"><label>Expected date</label><input class="pqid-input" type="date" name="sponsorexpecteddate"></div>
          <div class="pqid-field"><label>Terms note</label><input class="pqid-input" name="sponsortermsnote" placeholder="Optional sponsor terms"></div>
          <button class="pqid-btn" type="submit" <?php echo !$sponsoraccounts ? 'disabled' : ''; ?>>Record sponsor pledge</button>
          <?php if (!$sponsoraccounts): ?><span class="pqid-muted">Create a sponsor billing account before recording a sponsor commitment.</span><?php endif; ?>
        </form>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_marketplace_payout">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Marketplace Payout Readiness</h2>
          <div class="pqid-field"><label>Teacher ID</label><input class="pqid-input" name="payoutteacherid" placeholder="Auto from invoice line when available"></div>
          <div class="pqid-field"><label>Gross amount</label><input class="pqid-input" name="payoutgrossamount" value="<?php echo s((string)$invoice->paidamount); ?>"></div>
          <div class="pqid-field"><label>Platform fee</label><input class="pqid-input" name="payoutplatformfee" value="0.00"></div>
          <div class="pqid-field"><label>Notes</label><input class="pqid-input" name="payoutnotes" placeholder="Payout basis or review note"></div>
          <button class="pqid-btn" type="submit">Mark payout ready</button>
        </form>
      <?php endif; ?>
      <?php if (pqfin_correction_schema_ready() && (string)$invoice->status !== 'void'): ?>
        <form method="post" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(23,48,68,.1)">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="create_credit_note">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Credit Note</h2>
          <div class="pqid-field"><label>Amount</label><input class="pqid-input" name="creditamount" value="<?php echo s((string)$invoice->balancedue); ?>"></div>
          <div class="pqid-field"><label>Reason code</label><input class="pqid-input" name="creditreasoncode" value="manual_correction"></div>
          <div class="pqid-field"><label>Required reason</label><input class="pqid-input" name="creditreason" placeholder="Why this credit is being issued"></div>
          <button class="pqid-btn" type="submit">Create credit</button>
        </form>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="record_write_off">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Write-Off</h2>
          <div class="pqid-field"><label>Amount</label><input class="pqid-input" name="writeoffamount" value="<?php echo s((string)$invoice->balancedue); ?>"></div>
          <div class="pqid-field"><label>Required reason</label><input class="pqid-input" name="writeoffreason" placeholder="Approval or collection reason"></div>
          <button class="pqid-btn pqid-btn--danger" type="submit">Record write-off</button>
        </form>
        <?php if ($payments): ?>
          <form method="post" style="margin-top:14px">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="record_refund">
            <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Refund</h2>
            <div class="pqid-field"><label>Original payment</label><select class="pqid-select" name="refundpaymentid"><?php foreach ($payments as $payment): ?><option value="<?php echo (int)$payment->id; ?>"><?php echo s((string)$payment->receiptnumber . ' / ' . (string)$payment->currency . ' ' . (string)$payment->amount); ?></option><?php endforeach; ?></select></div>
            <div class="pqid-field"><label>Amount</label><input class="pqid-input" name="refundamount" placeholder="0.00"></div>
            <div class="pqid-field"><label>Method</label><input class="pqid-input" name="refundmethod" value="manual"></div>
            <div class="pqid-field"><label>Reference</label><input class="pqid-input" name="refundreference" placeholder="Refund reference"></div>
            <div class="pqid-field"><label>Refund date</label><input class="pqid-input" type="date" name="refunddate" value="<?php echo s(gmdate('Y-m-d')); ?>"></div>
            <div class="pqid-field"><label>Required reason</label><input class="pqid-input" name="refundreason" placeholder="Why refund is being recorded"></div>
            <button class="pqid-btn" type="submit">Record refund</button>
          </form>
        <?php endif; ?>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="mark_invoice_disputed">
          <h2 class="pqid-title" style="font-size:18px;margin-bottom:10px">Dispute</h2>
          <div class="pqid-field"><label>Required reason</label><input class="pqid-input" name="disputereason" placeholder="What is disputed"></div>
          <button class="pqid-btn" type="submit">Mark invoice disputed</button>
        </form>
      <?php elseif (!pqfin_correction_schema_ready()): ?>
        <div class="pqid-empty" style="margin-top:14px">Correction schema is not ready. Run the local_prequran Moodle upgrade.</div>
      <?php endif; ?>
      <?php if (in_array((string)$invoice->status, ['draft', 'issued', 'sent'], true)): ?>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="void_invoice">
          <div class="pqid-field"><label>Void reason</label><input class="pqid-input" name="voidreason" placeholder="Optional"></div>
          <button class="pqid-btn pqid-btn--danger" type="submit">Void invoice</button>
        </form>
      <?php endif; ?>
    </aside>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
