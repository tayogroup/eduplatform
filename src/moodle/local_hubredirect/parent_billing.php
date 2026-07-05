<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$childid = optional_param('childid', 0, PARAM_INT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0) {
    pqh_access_denied('Parent billing is not available for this workspace.', new moodle_url('/local/hubredirect/dashboard.php'), 'Billing unavailable');
}
$childids = [];
foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
    if (pqh_table_exists_safe($table)) {
        foreach ($DB->get_records($table, ['guardianid' => (int)$USER->id], '', 'id,studentid') as $row) {
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
        ['parentid' => (int)$USER->id, 'role' => 'parent']
    ) as $row) {
        $childids[(int)$row->studentid] = (int)$row->studentid;
    }
}
if ($childid > 0) {
    $childids = [$childid => $childid];
    $urlparams['childid'] = $childid;
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$invoices = pqfin_invoice_rows_for_parent($workspaceid, (int)$USER->id, array_values($childids), $consumercontext);
$metrics = pqfin_invoice_amount_metrics($invoices);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/parent_billing.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Billing');
$PAGE->set_heading('Parent Billing');
$PAGE->add_body_class('pqbill-page');

echo $OUTPUT->header();
?>
<style>
body.pqbill-page header,body.pqbill-page footer,body.pqbill-page nav.navbar,body.pqbill-page #page-header,body.pqbill-page #page-footer,body.pqbill-page .drawer,body.pqbill-page .drawer-toggles,body.pqbill-page .block-region,body.pqbill-page [data-region="drawer"],body.pqbill-page [data-region="right-hand-drawer"]{display:none!important}
body.pqbill-page #page,body.pqbill-page #page-content,body.pqbill-page #region-main,body.pqbill-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqb-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqb-wrap{max-width:1180px;margin:0 auto}.pqb-top,.pqb-panel,.pqb-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqb-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqb-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqb-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqb-actions{display:flex;gap:8px;flex-wrap:wrap}.pqb-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950}.pqb-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqb-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqb-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqb-table{width:100%;border-collapse:collapse}.pqb-table th,.pqb-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqb-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqb-name{display:block;color:#221b22;font-weight:950}.pqb-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqb-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqb-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:820px){.pqb-top{display:block}.pqb-actions{margin-top:12px}.pqb-metrics{grid-template-columns:1fr}.pqb-table thead{display:none}.pqb-table tr,.pqb-table td{display:block}.pqb-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqb-shell"><div class="pqb-wrap">
  <section class="pqb-top"><div><h1 class="pqb-title">Parent Billing</h1><p class="pqb-sub"><?php echo s((string)$workspace->name); ?> invoices for linked students.</p></div><nav class="pqb-actions"><a class="pqb-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_parent.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Parent workspace</a><a class="pqb-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a></nav></section>
  <section class="pqb-metrics"><div class="pqb-metric"><strong><?php echo (int)$metrics['count']; ?></strong><span>Invoices</span></div><div class="pqb-metric"><strong><?php echo s((string)$metrics['total']); ?></strong><span>Total billed</span></div><div class="pqb-metric"><strong><?php echo s((string)$metrics['paid']); ?></strong><span>Paid or credited</span></div><div class="pqb-metric"><strong><?php echo s((string)$metrics['balance']); ?></strong><span>Balance due</span></div></section>
  <section class="pqb-panel">
    <h2 class="pqb-title" style="font-size:21px">Invoices</h2>
    <?php if (!$invoices): ?><div class="pqb-empty">No issued invoices are available yet.</div><?php endif; ?>
    <?php if ($invoices): ?><table class="pqb-table"><thead><tr><th>Invoice</th><th>Student</th><th>Status</th><th>Total</th><th>Balance</th><th>Due</th><th>Plan</th><th></th></tr></thead><tbody>
      <?php foreach ($invoices as $invoice): ?><?php $plan = pqfin_active_payment_plan_for_invoice((int)$invoice->id); ?><tr><td data-label="Invoice"><span class="pqb-name"><?php echo s((string)$invoice->invoicenumber); ?></span><span class="pqb-muted"><?php echo s((string)$invoice->workspace_name); ?></span></td><td data-label="Student"><?php echo s(fullname($invoice)); ?></td><td data-label="Status"><span class="pqb-pill"><?php echo s(pqfin_invoice_status_label((string)$invoice->status)); ?></span></td><td data-label="Total"><?php echo s((string)$invoice->currency . ' ' . (string)$invoice->total); ?></td><td data-label="Balance"><?php echo s((string)$invoice->balancedue); ?></td><td data-label="Due"><?php echo (int)$invoice->dueat > 0 ? s(userdate((int)$invoice->dueat, get_string('strftimedate'))) : 'Not set'; ?></td><td data-label="Plan"><?php echo $plan ? '<span class="pqb-pill">' . s(pqfin_payment_plan_status_label((string)$plan->status)) . '</span><span class="pqb-muted">' . s((string)$plan->plannumber) . '</span>' : '<span class="pqb-muted">No plan</span>'; ?></td><td data-label="Open"><a class="pqb-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoice_view.php', ['invoiceid' => (int)$invoice->id] + $urlparams))->out(false); ?>">View</a></td></tr><?php endforeach; ?>
    </tbody></table><?php endif; ?>
    <p class="pqb-muted">Online payment is not enabled yet. Contact <?php echo s(pqfin_invoice_support_label($workspace, $consumercontext)); ?> for payment instructions.</p>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
