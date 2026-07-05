<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);
$print = optional_param('print', 0, PARAM_BOOL);
$financetoken = optional_param('financetoken', '', PARAM_ALPHANUMEXT);
$securelink = $financetoken !== '' ? pqfin_validate_secure_link('invoice_view', $invoiceid, $financetoken) : false;
if ($financetoken !== '' && !$securelink) {
    pqh_access_denied('This invoice link is expired or no longer valid.', new moodle_url('/local/hubredirect/dashboard.php'), 'Invoice link unavailable');
}
if (!$securelink) {
    require_login();
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

if (!pqfin_invoice_schema_ready() || $invoiceid <= 0) {
    pqh_access_denied('Invoice is not available.', new moodle_url('/local/hubredirect/dashboard.php'), 'Invoice unavailable');
}
$invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', IGNORE_MISSING);
if (!$invoice || (!$securelink && !pqfin_user_can_view_hosted_invoice($invoice, (int)$USER->id, $consumercontext))) {
    pqh_access_denied('This invoice is not available for this account.', new moodle_url('/local/hubredirect/dashboard.php'), 'Invoice access required');
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
$urlparams['invoiceid'] = $invoiceid;
if ($securelink) {
    $urlparams['financetoken'] = $financetoken;
}
if ((int)$invoice->workspaceid > 0) {
    $urlparams['workspaceid'] = (int)$invoice->workspaceid;
}

pqfin_audit($print ? 'invoice_print_viewed' : 'invoice_viewed', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
    'targettype' => 'invoice',
    'consumerid' => (int)$invoice->consumerid,
    'invoiceid' => $invoiceid,
    'viewerid' => $securelink ? 0 : (int)$USER->id,
    'linkid' => $securelink ? (int)$securelink->id : 0,
    'actorid' => $securelink ? 0 : (int)$USER->id,
]);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/invoice_view.php', $urlparams + ($print ? ['print' => 1] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Invoice');
$PAGE->set_heading('Invoice');
$PAGE->add_body_class('pqhostinv-page');

echo $OUTPUT->header();
?>
<style>
body.pqhostinv-page header,body.pqhostinv-page footer,body.pqhostinv-page nav.navbar,body.pqhostinv-page #page-header,body.pqhostinv-page #page-footer,body.pqhostinv-page .drawer,body.pqhostinv-page .drawer-toggles,body.pqhostinv-page .block-region,body.pqhostinv-page [data-region="drawer"],body.pqhostinv-page [data-region="right-hand-drawer"]{display:none!important}
body.pqhostinv-page #page,body.pqhostinv-page #page-content,body.pqhostinv-page #region-main,body.pqhostinv-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhi-shell{min-height:100vh;padding:28px 18px 56px;background:#eef3f6;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqhi-sheet{max-width:980px;margin:0 auto;padding:28px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;box-shadow:0 16px 36px rgba(23,48,68,.08)}.pqhi-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:2px solid #173044;padding-bottom:16px;margin-bottom:18px}.pqhi-brand h1{margin:0;color:#221b22;font-size:31px;font-weight:950}.pqhi-brand p,.pqhi-muted{margin:5px 0 0;color:#637684;font-size:13px;font-weight:800}.pqhi-number{text-align:right}.pqhi-number strong{display:block;color:#221b22;font-size:22px;font-weight:950}.pqhi-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}.pqhi-box{padding:13px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqhi-box span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqhi-box strong{display:block;margin-top:4px;color:#173044;font-size:14px;font-weight:950}.pqhi-table{width:100%;border-collapse:collapse;margin-top:10px}.pqhi-table th,.pqhi-table td{padding:11px;border-bottom:1px solid rgba(23,48,68,.12);text-align:left;font-size:13px}.pqhi-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqhi-total{display:grid;grid-template-columns:1fr 260px;gap:18px;margin-top:18px}.pqhi-summary{border:1px solid rgba(23,48,68,.12);border-radius:8px;overflow:hidden}.pqhi-summary div{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid rgba(23,48,68,.08);font-weight:850}.pqhi-summary div:last-child{border-bottom:0;background:#173044;color:#fff;font-weight:950}.pqhi-actions{display:flex;gap:8px;flex-wrap:wrap;margin:0 auto 14px;max-width:980px}.pqhi-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#173044;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}.pqhi-btn--light{background:#fff;color:#173044!important;border:1px solid rgba(23,48,68,.14)}.pqhi-note{margin-top:18px;padding:12px;border-radius:8px;background:#fff7df;color:#604600;font-size:13px;font-weight:850}.pqhi-receipt{margin-top:10px;padding:12px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;color:#647887;font-size:13px;font-weight:850}@media(max-width:760px){.pqhi-top,.pqhi-grid,.pqhi-total{display:block}.pqhi-number{text-align:left;margin-top:12px}.pqhi-sheet{padding:18px}.pqhi-table thead{display:none}.pqhi-table tr,.pqhi-table td{display:block}.pqhi-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}@media print{.pqhi-actions{display:none}.pqhi-shell{padding:0;background:#fff}.pqhi-sheet{max-width:none;border:0;box-shadow:none;border-radius:0}.pqhi-note{border:1px solid #ddd}}
</style>
<?php if (!$print): ?>
<nav class="pqhi-actions">
  <a class="pqhi-btn pqhi-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
  <?php if ($canpayonline): ?><a class="pqhi-btn" href="<?php echo (new moodle_url('/local/hubredirect/payment_start.php', $urlparams))->out(false); ?>">Pay online</a><?php endif; ?>
  <a class="pqhi-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoice_view.php', $urlparams + ['print' => 1]))->out(false); ?>">Printable view</a>
</nav>
<?php endif; ?>
<main class="pqhi-shell">
  <article class="pqhi-sheet">
    <section class="pqhi-top">
      <div class="pqhi-brand">
        <h1><?php echo s((string)($workspace->name ?? ($consumercontext->consumername ?? 'Academy'))); ?></h1>
        <p><?php echo s(pqfin_invoice_support_label($workspace, $consumercontext)); ?></p>
      </div>
      <div class="pqhi-number">
        <strong><?php echo s((string)$invoice->invoicenumber); ?></strong>
        <span class="pqhi-muted"><?php echo s(pqfin_invoice_status_label((string)$invoice->status)); ?></span>
      </div>
    </section>
    <section class="pqhi-grid">
      <div class="pqhi-box"><span>Bill to</span><strong><?php echo s((string)($account->displayname ?? 'Billing account')); ?></strong><span class="pqhi-muted"><?php echo s((string)($account->billingemail ?? '')); ?></span></div>
      <div class="pqhi-box"><span>Student</span><strong><?php echo $student ? s(fullname($student)) : 'Not assigned'; ?></strong><span class="pqhi-muted"><?php echo $student ? s(pqh_account_no_label($student)) : ''; ?></span></div>
      <div class="pqhi-box"><span>Issued</span><strong><?php echo (int)$invoice->issuedat > 0 ? s(userdate((int)$invoice->issuedat, get_string('strftimedate'))) : 'Not issued'; ?></strong></div>
      <div class="pqhi-box"><span>Due date</span><strong><?php echo (int)$invoice->dueat > 0 ? s(userdate((int)$invoice->dueat, get_string('strftimedate'))) : 'Not set'; ?></strong></div>
    </section>
    <table class="pqhi-table">
      <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead>
      <tbody>
        <?php foreach ($lines as $line): ?>
          <tr><td data-label="Description"><?php echo s((string)$line->description); ?></td><td data-label="Qty"><?php echo s((string)$line->quantity); ?></td><td data-label="Unit"><?php echo s((string)$line->unitamount); ?></td><td data-label="Discount"><?php echo s((string)$line->discountamount); ?></td><td data-label="Tax"><?php echo s((string)$line->taxamount); ?></td><td data-label="Total"><?php echo s((string)$line->linetotal); ?></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <section class="pqhi-total">
      <div>
        <?php if ($canpayonline): ?>
          <div class="pqhi-note">Online payment is available through <?php echo s((string)$gatewayconfig['displayname']); ?>. Use the Pay online button to open the secure hosted checkout.</div>
        <?php else: ?>
          <div class="pqhi-note">Online payment is not enabled yet. Please contact <?php echo s(pqfin_invoice_support_label($workspace, $consumercontext)); ?> for payment instructions.</div>
        <?php endif; ?>
        <?php if (!$payments): ?>
          <div class="pqhi-receipt">No receipts have been recorded for this invoice yet.</div>
        <?php else: ?>
          <div class="pqhi-receipt">
            <?php foreach ($payments as $payment): ?>
              <div><?php echo s((string)$payment->receiptnumber . ' / ' . (string)$payment->currency . ' ' . (string)$payment->allocationamount . ' / ' . pqfin_payment_method_label((string)$payment->paymentmethod)); ?><?php if (!$print): ?> <a href="<?php echo (new moodle_url('/local/hubredirect/payment_receipt.php', ['paymentid' => (int)$payment->id, 'workspaceid' => (int)$invoice->workspaceid]))->out(false); ?>">View receipt</a><?php endif; ?></div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
        <?php if ($visiblepaymentplan && $visibleinstallments): ?>
          <div class="pqhi-receipt">
            <strong><?php echo s((string)$visiblepaymentplan->plannumber); ?> payment schedule</strong>
            <?php foreach ($visibleinstallments as $installment): ?>
              <div><?php echo (int)$installment->dueat > 0 ? s(userdate((int)$installment->dueat, get_string('strftimedate'))) : 'Due date not set'; ?> / <?php echo s((string)$installment->currency . ' ' . (string)$installment->balancedue); ?> / <?php echo s(pqfin_installment_status_label((string)$installment->status)); ?></div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </div>
      <div class="pqhi-summary">
        <div><span>Subtotal</span><strong><?php echo s((string)$invoice->currency . ' ' . (string)$invoice->subtotal); ?></strong></div>
        <div><span>Discount</span><strong><?php echo s((string)$invoice->discounttotal); ?></strong></div>
        <div><span>Tax</span><strong><?php echo s((string)$invoice->taxtotal); ?></strong></div>
        <div><span>Total</span><strong><?php echo s((string)$invoice->total); ?></strong></div>
        <div><span>Paid</span><strong><?php echo s((string)$invoice->paidamount); ?></strong></div>
        <div><span>Balance due</span><strong><?php echo s((string)$invoice->balancedue); ?></strong></div>
      </div>
    </section>
  </article>
</main>
<?php if ($print): ?><script>window.print();</script><?php endif; ?>
<?php
echo $OUTPUT->footer();
