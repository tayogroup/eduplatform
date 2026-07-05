<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace admins can view finance audit reports.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Finance audit access required');
}

$studentid = optional_param('studentid', 0, PARAM_INT);
$billingaccountid = optional_param('billingaccountid', 0, PARAM_INT);
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);
$paymentid = optional_param('paymentid', 0, PARAM_INT);
$actorid = optional_param('actorid', 0, PARAM_INT);
$consumerid = optional_param('consumerid', 0, PARAM_INT);
$action = optional_param('actionfilter', '', PARAM_ALPHANUMEXT);
$datefrom = optional_param('datefrom', '', PARAM_TEXT);
$dateto = optional_param('dateto', '', PARAM_TEXT);

$where = ['workspaceid = :workspaceid'];
$params = ['workspaceid' => $workspaceid];
foreach (['consumerid' => $consumerid, 'studentid' => $studentid, 'billingaccountid' => $billingaccountid, 'invoiceid' => $invoiceid, 'paymentid' => $paymentid, 'actorid' => $actorid] as $field => $value) {
    if ($value > 0) {
        $where[] = "{$field} = :{$field}";
        $params[$field] = $value;
    }
}
if ($action !== '') {
    $where[] = 'action = :action';
    $params['action'] = $action;
}
if ($datefrom !== '') {
    $where[] = 'timecreated >= :datefrom';
    $params['datefrom'] = (int)strtotime($datefrom . ' 00:00:00');
}
if ($dateto !== '') {
    $where[] = 'timecreated <= :dateto';
    $params['dateto'] = (int)strtotime($dateto . ' 23:59:59');
}

$rows = [];
if (pqfin_finance_audit_schema_ready()) {
    $rows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_finance_audit}
          WHERE " . implode(' AND ', $where) . "
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        200
    ));
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/finance_audit.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Finance Audit');
$PAGE->set_heading('Finance Audit');
$PAGE->add_body_class('pqfinaud-page');

echo $OUTPUT->header();
?>
<style>
body.pqfinaud-page header,body.pqfinaud-page footer,body.pqfinaud-page nav.navbar,body.pqfinaud-page #page-header,body.pqfinaud-page #page-footer,body.pqfinaud-page .drawer,body.pqfinaud-page .drawer-toggles,body.pqfinaud-page .block-region,body.pqfinaud-page [data-region="drawer"],body.pqfinaud-page [data-region="right-hand-drawer"]{display:none!important}
body.pqfinaud-page #page,body.pqfinaud-page #page-content,body.pqfinaud-page #region-main,body.pqfinaud-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqfa-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqfa-wrap{max-width:1240px;margin:0 auto}.pqfa-top,.pqfa-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqfa-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqfa-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqfa-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqfa-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqfa-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.pqfa-field{display:grid;gap:5px}.pqfa-field label{color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqfa-input{width:100%;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800;box-sizing:border-box}.pqfa-table{width:100%;border-collapse:collapse;margin-top:14px}.pqfa-table th,.pqfa-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqfa-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqfa-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqfa-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:900px){.pqfa-top,.pqfa-grid{display:block}.pqfa-field{margin-bottom:8px}.pqfa-table thead{display:none}.pqfa-table tr,.pqfa-table td{display:block}.pqfa-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqfa-shell"><div class="pqfa-wrap">
  <section class="pqfa-top">
    <div><h1 class="pqfa-title">Finance Audit</h1><p class="pqfa-sub">Invoice, payment, credit, refund, write-off, and receipt events.</p></div>
    <a class="pqfa-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoices.php', $urlparams))->out(false); ?>">Invoices</a>
  </section>
  <section class="pqfa-panel">
    <?php if (!pqfin_finance_audit_schema_ready()): ?><div class="pqfa-empty">Finance audit schema is not ready. Run the local_prequran Moodle upgrade.</div><?php endif; ?>
    <form method="get" class="pqfa-grid">
      <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
      <div class="pqfa-field"><label>Student ID</label><input class="pqfa-input" name="studentid" value="<?php echo (int)$studentid ?: ''; ?>"></div>
      <div class="pqfa-field"><label>Consumer ID</label><input class="pqfa-input" name="consumerid" value="<?php echo (int)$consumerid ?: ''; ?>"></div>
      <div class="pqfa-field"><label>Billing account</label><input class="pqfa-input" name="billingaccountid" value="<?php echo (int)$billingaccountid ?: ''; ?>"></div>
      <div class="pqfa-field"><label>Invoice ID</label><input class="pqfa-input" name="invoiceid" value="<?php echo (int)$invoiceid ?: ''; ?>"></div>
      <div class="pqfa-field"><label>Payment ID</label><input class="pqfa-input" name="paymentid" value="<?php echo (int)$paymentid ?: ''; ?>"></div>
      <div class="pqfa-field"><label>Admin ID</label><input class="pqfa-input" name="actorid" value="<?php echo (int)$actorid ?: ''; ?>"></div>
      <div class="pqfa-field"><label>Action</label><input class="pqfa-input" name="actionfilter" value="<?php echo s($action); ?>"></div>
      <div class="pqfa-field"><label>From</label><input class="pqfa-input" type="date" name="datefrom" value="<?php echo s($datefrom); ?>"></div>
      <div class="pqfa-field"><label>To</label><input class="pqfa-input" type="date" name="dateto" value="<?php echo s($dateto); ?>"></div>
      <button class="pqfa-btn" type="submit">Filter</button>
    </form>
    <?php if (!$rows): ?><div class="pqfa-empty" style="margin-top:14px">No finance audit events found.</div><?php endif; ?>
    <?php if ($rows): ?>
      <table class="pqfa-table">
        <thead><tr><th>Time</th><th>Action</th><th>Targets</th><th>Actor</th><th>Details</th></tr></thead>
        <tbody><?php foreach ($rows as $row): ?><tr>
          <td data-label="Time"><?php echo s(userdate((int)$row->timecreated, get_string('strftimedatetimeshort'))); ?></td>
          <td data-label="Action"><?php echo s((string)$row->action); ?><span class="pqfa-muted"><?php echo s((string)$row->targettype . ' #' . (int)$row->targetid); ?></span></td>
          <td data-label="Targets">Student <?php echo (int)$row->studentid; ?><span class="pqfa-muted">Account <?php echo (int)$row->billingaccountid; ?> / Invoice <?php echo (int)$row->invoiceid; ?> / Payment <?php echo (int)$row->paymentid; ?></span></td>
          <td data-label="Actor"><?php echo (int)$row->actorid; ?></td>
          <td data-label="Details"><code><?php echo s((string)$row->details); ?></code></td>
        </tr><?php endforeach; ?></tbody>
      </table>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
