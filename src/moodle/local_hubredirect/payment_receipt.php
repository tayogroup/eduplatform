<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$paymentid = optional_param('paymentid', 0, PARAM_INT);
$print = optional_param('print', 0, PARAM_BOOL);
$financetoken = optional_param('financetoken', '', PARAM_ALPHANUMEXT);
$securelink = $financetoken !== '' ? pqfin_validate_secure_link('receipt_view', $paymentid, $financetoken) : false;
if ($financetoken !== '' && !$securelink) {
    pqh_access_denied('This receipt link is expired or no longer valid.', new moodle_url('/local/hubredirect/dashboard.php'), 'Receipt link unavailable');
}
if (!$securelink) {
    require_login();
}

if ($paymentid <= 0 || !pqfin_payment_schema_ready()) {
    pqh_access_denied('Receipt is not available.', new moodle_url('/local/hubredirect/dashboard.php'), 'Receipt unavailable');
}
$payment = $DB->get_record('local_prequran_payment', ['id' => $paymentid], '*', IGNORE_MISSING);
if (!$payment || !pqh_record_belongs_to_consumer_context($payment, $consumercontext, 'workspaceid')) {
    pqh_access_denied('Receipt is outside this workspace.', new moodle_url('/local/hubredirect/dashboard.php'), 'Receipt access required');
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
if ($invoice && !$securelink && !pqfin_user_can_view_hosted_invoice($invoice, (int)$USER->id, $consumercontext)
        && !pqfin_user_can_manage_workspace_finance((int)$USER->id, (int)$payment->workspaceid)) {
    pqh_access_denied('Receipt is not available for this account.', new moodle_url('/local/hubredirect/dashboard.php'), 'Receipt access required');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => (int)$payment->workspaceid], '*', IGNORE_MISSING);
$account = $DB->get_record('local_prequran_billing_account', ['id' => (int)$payment->billingaccountid], '*', IGNORE_MISSING);
$student = (int)$payment->studentid > 0 ? core_user::get_user((int)$payment->studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null;
$urlparams = ['paymentid' => $paymentid, 'workspaceid' => (int)$payment->workspaceid];
if ($securelink) {
    $urlparams['financetoken'] = $financetoken;
}
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}

pqfin_audit($print ? 'receipt_print_viewed' : 'receipt_viewed', (int)$payment->workspaceid, (int)$payment->studentid, $paymentid, [
    'targettype' => 'payment',
    'consumerid' => (int)$payment->consumerid,
    'paymentid' => $paymentid,
    'viewerid' => $securelink ? 0 : (int)$USER->id,
    'linkid' => $securelink ? (int)$securelink->id : 0,
    'actorid' => $securelink ? 0 : (int)$USER->id,
]);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/payment_receipt.php', $urlparams + ($print ? ['print' => 1] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Receipt');
$PAGE->set_heading('Receipt');
$PAGE->add_body_class('pqreceipt-page');

echo $OUTPUT->header();
?>
<style>
body.pqreceipt-page header,body.pqreceipt-page footer,body.pqreceipt-page nav.navbar,body.pqreceipt-page #page-header,body.pqreceipt-page #page-footer,body.pqreceipt-page .drawer,body.pqreceipt-page .drawer-toggles,body.pqreceipt-page .block-region,body.pqreceipt-page [data-region="drawer"],body.pqreceipt-page [data-region="right-hand-drawer"]{display:none!important}
body.pqreceipt-page #page,body.pqreceipt-page #page-content,body.pqreceipt-page #region-main,body.pqreceipt-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqrct-shell{min-height:100vh;padding:28px 18px 56px;background:#eef3f6;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqrct-sheet{max-width:860px;margin:0 auto;padding:28px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;box-shadow:0 16px 36px rgba(23,48,68,.08)}.pqrct-top{display:flex;justify-content:space-between;gap:18px;border-bottom:2px solid #173044;padding-bottom:16px;margin-bottom:18px}.pqrct-title{margin:0;color:#221b22;font-size:31px;font-weight:950}.pqrct-muted{margin:5px 0 0;color:#637684;font-size:13px;font-weight:800}.pqrct-number{text-align:right}.pqrct-number strong{display:block;color:#221b22;font-size:22px;font-weight:950}.pqrct-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}.pqrct-box{padding:13px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqrct-box span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqrct-box strong{display:block;margin-top:4px;color:#173044;font-size:14px;font-weight:950}.pqrct-table{width:100%;border-collapse:collapse;margin-top:10px}.pqrct-table th,.pqrct-table td{padding:11px;border-bottom:1px solid rgba(23,48,68,.12);text-align:left;font-size:13px}.pqrct-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqrct-total{margin-top:18px;padding:14px;border-radius:8px;background:#173044;color:#fff;font-size:18px;font-weight:950;text-align:right}.pqrct-actions{display:flex;gap:8px;flex-wrap:wrap;margin:0 auto 14px;max-width:860px}.pqrct-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#173044;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}.pqrct-btn--light{background:#fff;color:#173044!important;border:1px solid rgba(23,48,68,.14)}@media(max-width:720px){.pqrct-top,.pqrct-grid{display:block}.pqrct-number{text-align:left;margin-top:12px}.pqrct-sheet{padding:18px}}@media print{.pqrct-actions{display:none}.pqrct-shell{padding:0;background:#fff}.pqrct-sheet{max-width:none;border:0;box-shadow:none;border-radius:0}}
</style>
<?php if (!$print): ?>
<nav class="pqrct-actions">
  <?php if ($invoice): ?><a class="pqrct-btn pqrct-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/invoice_view.php', ['invoiceid' => (int)$invoice->id, 'workspaceid' => (int)$payment->workspaceid]))->out(false); ?>">Invoice</a><?php endif; ?>
  <a class="pqrct-btn" href="<?php echo (new moodle_url('/local/hubredirect/payment_receipt.php', $urlparams + ['print' => 1]))->out(false); ?>">Printable receipt</a>
</nav>
<?php endif; ?>
<main class="pqrct-shell"><article class="pqrct-sheet">
  <section class="pqrct-top">
    <div><h1 class="pqrct-title">Receipt</h1><p class="pqrct-muted"><?php echo s((string)($workspace->name ?? ($consumercontext->consumername ?? 'Academy'))); ?></p></div>
    <div class="pqrct-number"><strong><?php echo s((string)$payment->receiptnumber); ?></strong><span class="pqrct-muted"><?php echo s((string)$payment->status); ?></span></div>
  </section>
  <section class="pqrct-grid">
    <div class="pqrct-box"><span>Received from</span><strong><?php echo s((string)($account->displayname ?? 'Billing account')); ?></strong><span class="pqrct-muted"><?php echo s((string)($account->billingemail ?? '')); ?></span></div>
    <div class="pqrct-box"><span>Student</span><strong><?php echo $student ? s(fullname($student)) : 'Not assigned'; ?></strong><span class="pqrct-muted"><?php echo $student ? s(pqh_account_no_label($student)) : ''; ?></span></div>
    <div class="pqrct-box"><span>Method</span><strong><?php echo s(pqfin_payment_method_label((string)$payment->paymentmethod)); ?></strong><span class="pqrct-muted"><?php echo s((string)$payment->reference); ?></span></div>
    <div class="pqrct-box"><span>Received date</span><strong><?php echo (int)$payment->receivedat > 0 ? s(userdate((int)$payment->receivedat, get_string('strftimedate'))) : 'Not set'; ?></strong></div>
  </section>
  <table class="pqrct-table">
    <thead><tr><th>Invoice</th><th>Status</th><th>Allocated amount</th></tr></thead>
    <tbody>
      <?php foreach ($allocations as $allocation): ?>
        <?php $allocatedinvoice = $DB->get_record('local_prequran_invoice', ['id' => (int)$allocation->invoiceid], 'id,invoicenumber,status', IGNORE_MISSING); ?>
        <tr><td><?php echo s((string)($allocatedinvoice->invoicenumber ?? ('Invoice #' . (int)$allocation->invoiceid))); ?></td><td><?php echo s((string)$allocation->status); ?></td><td><?php echo s((string)$allocation->currency . ' ' . (string)$allocation->amount); ?></td></tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <div class="pqrct-total">Total received: <?php echo s((string)$payment->currency . ' ' . (string)$payment->amount); ?></div>
  <?php if (trim((string)$payment->notes) !== ''): ?><p class="pqrct-muted"><?php echo s((string)$payment->notes); ?></p><?php endif; ?>
</article></main>
<?php if ($print): ?><script>window.print();</script><?php endif; ?>
<?php
echo $OUTPUT->footer();
