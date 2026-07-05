<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/course_offeringlib.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$status = optional_param('status', '', PARAM_ALPHANUMEXT);
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

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$message = optional_param('created', 0, PARAM_INT) === 1 ? 'Draft invoice created.' : '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    try {
        if (!pqfin_invoice_schema_ready()) {
            throw new invalid_parameter_exception('Invoice schema is not ready.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action !== 'create_draft') {
            throw new invalid_parameter_exception('Choose a valid invoice action.');
        }
        $studentid = optional_param('studentid', 0, PARAM_INT);
        if ($studentid <= 0 || !pqfin_student_in_workspace($studentid, $workspaceid)) {
            throw new invalid_parameter_exception('Choose a valid student in this workspace.');
        }
        $billingaccountid = pqfin_resolve_or_create_family_billing_account($studentid, $workspaceid, $consumercontext, (int)$USER->id);
        $invoiceid = pqfin_create_draft_invoice($workspaceid, $billingaccountid, $studentid, $consumercontext, (int)$USER->id, [
            'source' => 'manual_admin_invoice',
        ]);
        redirect(new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => $invoiceid, 'created' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$students = pqco_workspace_students_for_user($workspaceid, (int)$USER->id);
$where = 'i.workspaceid = :workspaceid';
$params = ['workspaceid' => $workspaceid];
if ($status !== '') {
    $where .= ' AND i.status = :status';
    $params['status'] = $status;
}
$invoices = [];
if (pqfin_invoice_schema_ready()) {
    $invoices = array_values($DB->get_records_sql(
        "SELECT i.*, ba.displayname AS accountname, ba.billingemail,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE {$where}
       ORDER BY i.timemodified DESC, i.id DESC",
        $params,
        0,
        100
    ));
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/invoices.php', $urlparams + ($status !== '' ? ['status' => $status] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Invoices');
$PAGE->set_heading('Invoices');
$PAGE->add_body_class('pqinv-page');

echo $OUTPUT->header();
?>
<style>
body.pqinv-page header,body.pqinv-page footer,body.pqinv-page nav.navbar,body.pqinv-page #page-header,body.pqinv-page #page-footer,body.pqinv-page .drawer,body.pqinv-page .drawer-toggles,body.pqinv-page .block-region,body.pqinv-page [data-region="drawer"],body.pqinv-page [data-region="right-hand-drawer"]{display:none!important}
body.pqinv-page #page,body.pqinv-page #page-content,body.pqinv-page #region-main,body.pqinv-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqinv-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqinv-wrap{max-width:1240px;margin:0 auto}.pqinv-top,.pqinv-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqinv-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqinv-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqinv-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqinv-actions{display:flex;gap:8px;flex-wrap:wrap}.pqinv-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqinv-btn--primary{background:#2f6f4e;color:#fff!important}.pqinv-grid{display:grid;grid-template-columns:330px minmax(0,1fr);gap:14px}.pqinv-field{display:grid;gap:5px;margin-bottom:10px}.pqinv-field label{color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqinv-input{width:100%;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800;box-sizing:border-box}.pqinv-alert{margin:0 0 12px;padding:10px 12px;border-radius:8px;font-weight:900}.pqinv-alert--ok{background:#eaf7ef;color:#1f5d3f}.pqinv-alert--err{background:#fff0ef;color:#8a3028}.pqinv-table{width:100%;border-collapse:collapse}.pqinv-table th,.pqinv-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqinv-table th{color:#415363;font-size:11px;text-transform:uppercase}.pqinv-name{display:block;color:#221b22;font-weight:950}.pqinv-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqinv-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqinv-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:860px){.pqinv-top,.pqinv-grid{display:block}.pqinv-panel{margin-bottom:14px}.pqinv-table thead{display:none}.pqinv-table tr,.pqinv-table td{display:block}.pqinv-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqinv-shell"><div class="pqinv-wrap">
  <section class="pqinv-top">
    <div><h1 class="pqinv-title"><?php echo s((string)$workspace->name); ?> Invoices</h1><p class="pqinv-sub">Phase 3 manual draft and issue workflow for student tuition invoices.</p></div>
    <nav class="pqinv-actions">
      <a class="pqinv-btn" href="<?php echo (new moodle_url('/local/hubredirect/student_finance.php', $urlparams))->out(false); ?>">Student finance</a>
      <a class="pqinv-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams))->out(false); ?>">Finance operations</a>
      <a class="pqinv-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_policy.php', $urlparams))->out(false); ?>">Finance policy</a>
      <a class="pqinv-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_audit.php', $urlparams))->out(false); ?>">Finance audit</a>
      <a class="pqinv-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
    </nav>
  </section>
  <?php if ($message !== ''): ?><div class="pqinv-alert pqinv-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqinv-alert pqinv-alert--err"><?php echo s($error); ?></div><?php endif; ?>
  <?php if (!pqfin_invoice_schema_ready()): ?><div class="pqinv-alert pqinv-alert--err">Invoice schema is not ready. Run the local_prequran Moodle upgrade.</div><?php endif; ?>
  <div class="pqinv-grid">
    <aside class="pqinv-panel">
      <h2 class="pqinv-title" style="font-size:20px">Create Draft</h2>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="create_draft">
        <div class="pqinv-field">
          <label>Student</label>
          <select class="pqinv-input" name="studentid">
            <?php foreach ($students as $student): ?>
              <option value="<?php echo (int)$student->id; ?>"><?php echo s(fullname($student) . ' / ' . pqh_account_no_label($student)); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <button class="pqinv-btn pqinv-btn--primary" type="submit">Create draft invoice</button>
      </form>
      <form method="get" style="margin-top:16px">
        <?php foreach ($urlparams as $key => $value): ?><input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>"><?php endforeach; ?>
        <div class="pqinv-field">
          <label>Status</label>
          <select class="pqinv-input" name="status">
            <option value="">All statuses</option>
            <?php foreach (['draft', 'issued', 'sent', 'partially_paid', 'paid', 'disputed', 'void'] as $candidate): ?>
              <option value="<?php echo s($candidate); ?>"<?php echo $status === $candidate ? ' selected' : ''; ?>><?php echo s(pqfin_invoice_status_label($candidate)); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <button class="pqinv-btn" type="submit">Filter</button>
      </form>
    </aside>
    <section class="pqinv-panel">
      <?php if (!$invoices): ?><div class="pqinv-empty">No invoices found.</div><?php endif; ?>
      <?php if ($invoices): ?>
        <table class="pqinv-table">
          <thead><tr><th>Invoice</th><th>Student</th><th>Billing account</th><th>Status</th><th>Total</th><th>Due</th><th></th></tr></thead>
          <tbody>
          <?php foreach ($invoices as $invoice): ?>
            <tr>
              <td data-label="Invoice"><span class="pqinv-name"><?php echo s((string)$invoice->invoicenumber !== '' ? (string)$invoice->invoicenumber : 'Draft #' . (int)$invoice->id); ?></span><span class="pqinv-muted">Invoice #<?php echo (int)$invoice->id; ?></span></td>
              <td data-label="Student"><?php echo (int)$invoice->studentid > 0 ? s(fullname($invoice)) : 'Not assigned'; ?><span class="pqinv-muted"><?php echo s((string)($invoice->email ?? '')); ?></span></td>
              <td data-label="Billing account"><?php echo s((string)$invoice->accountname); ?><span class="pqinv-muted"><?php echo s((string)$invoice->billingemail); ?></span></td>
              <td data-label="Status"><span class="pqinv-pill"><?php echo s(pqfin_invoice_status_label((string)$invoice->status)); ?></span></td>
              <td data-label="Total"><?php echo s((string)$invoice->currency . ' ' . (string)$invoice->total); ?><span class="pqinv-muted">Balance <?php echo s((string)$invoice->balancedue); ?></span></td>
              <td data-label="Due"><?php echo (int)$invoice->dueat > 0 ? s(userdate((int)$invoice->dueat, get_string('strftimedate'))) : 'Not issued'; ?></td>
              <td data-label="Open"><a class="pqinv-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoice_detail.php', $urlparams + ['invoiceid' => (int)$invoice->id]))->out(false); ?>">Open</a></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
