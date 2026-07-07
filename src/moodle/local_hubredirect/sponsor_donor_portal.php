<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/scholarship_sponsorlib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$role = $workspaceid > 0 ? pqh_user_workspace_role((int)$USER->id, $workspaceid) : '';
$canmanage = $workspaceid > 0 && (pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) || pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'finance.manage'));
if ($workspaceid <= 0 || (!$canmanage && $role !== 'sponsor')) {
    pqh_access_denied('Sponsor and donor portal requires sponsor or finance access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Sponsor portal access denied');
}
if (!pqss_schema_ready()) {
    pqh_access_denied('Sponsor/donor portal schema is not ready. Run the local_prequran upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]), 'Sponsor portal schema pending');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $action = required_param('action', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'submit_pledge') {
            $expecteddate = optional_param('expected_date', '', PARAM_RAW_TRIMMED);
            $expectedat = $expecteddate !== '' ? strtotime($expecteddate . ' 12:00:00') : 0;
            $pledgeid = pqss_create_donor_pledge($workspaceid, $consumercontext, (int)$USER->id, [
                'studentid' => optional_param('studentid', 0, PARAM_INT),
                'invoiceid' => optional_param('invoiceid', 0, PARAM_INT),
                'campaign' => optional_param('campaign', '', PARAM_TEXT),
                'pledge_type' => optional_param('pledge_type', 'general', PARAM_ALPHANUMEXT),
                'currency' => optional_param('currency', pqfin_default_currency(), PARAM_ALPHANUMEXT),
                'pledgedamount' => optional_param('pledgedamount', '0.00', PARAM_TEXT),
                'privacy' => optional_param('privacy', 'named', PARAM_ALPHANUMEXT),
                'donor_message' => optional_param('donor_message', '', PARAM_TEXT),
                'expectedat' => $expectedat > 0 ? $expectedat : 0,
            ]);
            $notice = 'Donor pledge #' . $pledgeid . ' submitted.';
        } else if ($action === 'review_pledge') {
            pqss_review_donor_pledge(
                required_param('pledgeid', PARAM_INT),
                $workspaceid,
                $consumercontext,
                (int)$USER->id,
                required_param('status', PARAM_ALPHANUMEXT),
                optional_param('staffnote', '', PARAM_TEXT),
                optional_param('invoiceid', 0, PARAM_INT)
            );
            $notice = 'Donor pledge reviewed.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$students = pqss_workspace_students($workspaceid);
$pledges = pqss_donor_pledges($workspaceid, (int)$USER->id);
$invoices = pqfin_invoice_rows_for_sponsor($workspaceid, (int)$USER->id, $consumercontext);
$commitments = pqfin_sponsor_commitments_for_user($workspaceid, (int)$USER->id, $consumercontext);
if ($canmanage && pqfin_invoice_schema_ready()) {
    $invoices = array_values($DB->get_records_sql(
        "SELECT i.*, u.firstname, u.lastname, ba.displayname AS accountname, w.name AS workspace_name
           FROM {local_prequran_invoice} i
      LEFT JOIN {user} u ON u.id = i.studentid
      LEFT JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
      LEFT JOIN {local_prequran_workspace} w ON w.id = i.workspaceid
          WHERE i.workspaceid = :workspaceid
            AND i.status <> :voidstatus
       ORDER BY i.dueat ASC, i.id DESC",
        ['workspaceid' => $workspaceid, 'voidstatus' => 'void'],
        0,
        150
    ));
}
$metrics = pqfin_invoice_amount_metrics($invoices);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/sponsor_donor_portal.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Sponsor And Donor Portal');
$PAGE->set_heading('Sponsor And Donor Portal');
$PAGE->add_body_class('pqdon-page');

echo $OUTPUT->header();
?>
<style>
body.pqdon-page header,body.pqdon-page footer,body.pqdon-page nav.navbar,body.pqdon-page #page-header,body.pqdon-page #page-footer,body.pqdon-page .drawer,body.pqdon-page .drawer-toggles,body.pqdon-page .block-region,body.pqdon-page [data-region="drawer"],body.pqdon-page [data-region="right-hand-drawer"]{display:none!important}
body.pqdon-page #page,body.pqdon-page #page-content,body.pqdon-page #region-main,body.pqdon-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqdon{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqdon-wrap{max-width:1280px;margin:0 auto}.pqdon-top,.pqdon-panel,.pqdon-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqdon-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqdon-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.08}.pqdon-muted{color:#5e7280;font-size:13px;font-weight:800}.pqdon-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqdon-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqdon-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqdon-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqdon-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqdon-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqdon-grid{display:grid;grid-template-columns:390px 1fr;gap:14px}.pqdon-field{display:grid;gap:5px;margin-bottom:10px}.pqdon-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqdon-input,.pqdon-select,.pqdon-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqdon-input,.pqdon-select{padding:0 10px}.pqdon-textarea{min-height:76px;padding:10px}.pqdon-table{width:100%;border-collapse:separate;border-spacing:0}.pqdon-table th,.pqdon-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqdon-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqdon-name{display:block;color:#221b22;font-weight:950}.pqdon-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqdon-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqdon-alert--ok{background:#edf9ef;color:#245c35}.pqdon-alert--bad{background:#fff0ed;color:#883526}.pqdon-inline{display:grid;gap:6px;min-width:210px}.pqdon-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqdon-stack{display:grid;gap:14px}@media(max-width:920px){.pqdon-top,.pqdon-grid,.pqdon-metrics{grid-template-columns:1fr}.pqdon-actions{justify-content:flex-start}.pqdon-table thead{display:none}.pqdon-table tr,.pqdon-table td{display:block}.pqdon-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqdon"><div class="pqdon-wrap">
  <section class="pqdon-top"><div><h1 class="pqdon-title">Sponsor And Donor Portal</h1><div class="pqdon-muted"><?php echo s((string)$workspace->name); ?> pledges, sponsor invoices, donor privacy, allocation readiness, and commitment history.</div></div><nav class="pqdon-actions"><a class="pqdon-btn pqdon-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><?php if ($canmanage): ?><a class="pqdon-btn pqdon-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams + ['report' => 'sponsorships']))->out(false); ?>">Finance sponsorships</a><?php endif; ?></nav></section>
  <?php if ($notice !== ''): ?><div class="pqdon-alert pqdon-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqdon-alert pqdon-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqdon-metrics"><div class="pqdon-metric"><strong><?php echo (int)$metrics['count']; ?></strong><span>Visible invoices</span></div><div class="pqdon-metric"><strong><?php echo s((string)$metrics['total']); ?></strong><span>Total billed</span></div><div class="pqdon-metric"><strong><?php echo s((string)$metrics['paid']); ?></strong><span>Paid or credited</span></div><div class="pqdon-metric"><strong><?php echo s((string)$metrics['balance']); ?></strong><span>Balance due</span></div></section>
  <div class="pqdon-grid">
    <section class="pqdon-panel">
      <h2 class="pqdon-title" style="font-size:21px">New Pledge</h2>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
        <input type="hidden" name="action" value="submit_pledge">
        <div class="pqdon-field"><label>Campaign</label><input class="pqdon-input" name="campaign" placeholder="General scholarship fund"></div>
        <div class="pqdon-field"><label>Pledge type</label><select class="pqdon-select" name="pledge_type"><option value="general">General fund</option><option value="student_sponsorship">Student sponsorship</option><option value="course_sponsorship">Course sponsorship</option><option value="zakat">Zakat</option><option value="sadaqah">Sadaqah</option></select></div>
        <div class="pqdon-field"><label>Student</label><select class="pqdon-select" name="studentid"><option value="0">Not student-specific</option><?php foreach ($students as $student): ?><option value="<?php echo (int)$student->id; ?>"><?php echo s(fullname($student)); ?></option><?php endforeach; ?></select></div>
        <div class="pqdon-field"><label>Invoice ID</label><input class="pqdon-input" name="invoiceid" placeholder="Optional invoice ID"></div>
        <div class="pqdon-field"><label>Currency</label><input class="pqdon-input" name="currency" value="<?php echo s(pqfin_default_currency()); ?>"></div>
        <div class="pqdon-field"><label>Pledged amount</label><input class="pqdon-input" name="pledgedamount" required placeholder="500.00"></div>
        <div class="pqdon-field"><label>Expected date</label><input class="pqdon-input" name="expected_date" type="date"></div>
        <div class="pqdon-field"><label>Privacy</label><select class="pqdon-select" name="privacy"><option value="named">Named donor</option><option value="anonymous">Anonymous</option><option value="family_only">Visible to sponsored family only</option></select></div>
        <div class="pqdon-field"><label>Message</label><textarea class="pqdon-textarea" name="donor_message"></textarea></div>
        <button class="pqdon-btn" type="submit">Submit Pledge</button>
      </form>
    </section>
    <div class="pqdon-stack">
      <section class="pqdon-panel">
        <h2 class="pqdon-title" style="font-size:21px">Pledges</h2>
        <?php if (!$pledges): ?><div class="pqdon-empty">No donor pledges yet.</div><?php endif; ?>
        <?php if ($pledges): ?><table class="pqdon-table"><thead><tr><th>Pledge</th><th>Donor</th><th>Purpose</th><th>Amount</th><th>Status</th><?php if ($canmanage): ?><th>Review</th><?php endif; ?></tr></thead><tbody>
          <?php foreach ($pledges as $pledge): ?>
            <tr>
              <td data-label="Pledge"><span class="pqdon-name"><?php echo s((string)$pledge->pledgenumber); ?></span><span class="pqdon-muted"><?php echo s((string)$pledge->campaign); ?></span><?php if ((int)$pledge->commitmentid > 0): ?><br><span class="pqdon-pill">Commitment #<?php echo (int)$pledge->commitmentid; ?></span><?php endif; ?></td>
              <td data-label="Donor"><?php echo s((string)($pledge->sponsorname ?? 'Sponsor')); ?><div class="pqdon-muted"><?php echo s((string)$pledge->privacy); ?></div></td>
              <td data-label="Purpose"><span class="pqdon-pill"><?php echo s((string)$pledge->pledge_type); ?></span><div class="pqdon-muted"><?php echo (int)$pledge->studentid > 0 ? s(trim((string)$pledge->firstname . ' ' . (string)$pledge->lastname)) : 'General fund'; ?></div></td>
              <td data-label="Amount"><?php echo s((string)$pledge->currency . ' ' . (string)$pledge->pledgedamount); ?><div class="pqdon-muted">Balance <?php echo s((string)$pledge->balanceamount); ?></div></td>
              <td data-label="Status"><span class="pqdon-pill"><?php echo s((string)$pledge->status); ?></span><div class="pqdon-muted"><?php echo s((string)$pledge->staffnote); ?></div></td>
              <?php if ($canmanage): ?><td data-label="Review"><form class="pqdon-inline" method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="review_pledge"><input type="hidden" name="pledgeid" value="<?php echo (int)$pledge->id; ?>"><select class="pqdon-select" name="status"><option value="accepted">Accept</option><option value="allocated">Allocate to invoice</option><option value="completed">Complete</option><option value="cancelled">Cancel</option></select><input class="pqdon-input" name="invoiceid" value="<?php echo (int)$pledge->invoiceid; ?>" placeholder="Invoice ID for allocation"><textarea class="pqdon-textarea" name="staffnote" placeholder="Staff note"></textarea><button class="pqdon-btn pqdon-btn--light" type="submit">Save</button></form></td><?php endif; ?>
            </tr>
          <?php endforeach; ?>
        </tbody></table><?php endif; ?>
      </section>
      <section class="pqdon-panel">
        <h2 class="pqdon-title" style="font-size:21px">Invoices And Commitments</h2>
        <?php if (!$invoices && !$commitments): ?><div class="pqdon-empty">No sponsor invoices or commitments are visible yet.</div><?php endif; ?>
        <?php if ($invoices): ?><table class="pqdon-table"><thead><tr><th>Invoice</th><th>Student</th><th>Status</th><th>Total</th><th>Balance</th><th>Due</th></tr></thead><tbody><?php foreach ($invoices as $invoice): ?><tr><td data-label="Invoice"><span class="pqdon-name"><?php echo s((string)$invoice->invoicenumber); ?></span></td><td data-label="Student"><?php echo (int)$invoice->studentid > 0 ? s(fullname($invoice)) : 'Not assigned'; ?></td><td data-label="Status"><span class="pqdon-pill"><?php echo s((string)$invoice->status); ?></span></td><td data-label="Total"><?php echo s((string)$invoice->currency . ' ' . (string)$invoice->total); ?></td><td data-label="Balance"><?php echo s((string)$invoice->balancedue); ?></td><td data-label="Due"><?php echo (int)$invoice->dueat > 0 ? s(userdate((int)$invoice->dueat, get_string('strftimedate'))) : 'Not set'; ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?>
        <?php if ($commitments): ?><table class="pqdon-table"><thead><tr><th>Commitment</th><th>Invoice</th><th>Status</th><th>Committed</th><th>Received</th><th>Expected</th></tr></thead><tbody><?php foreach ($commitments as $commitment): ?><tr><td data-label="Commitment"><span class="pqdon-name"><?php echo s((string)$commitment->commitmentnumber); ?></span></td><td data-label="Invoice"><?php echo s((string)$commitment->invoicenumber); ?></td><td data-label="Status"><span class="pqdon-pill"><?php echo s((string)$commitment->status); ?></span></td><td data-label="Committed"><?php echo s((string)$commitment->currency . ' ' . (string)$commitment->committedamount); ?></td><td data-label="Received"><?php echo s((string)$commitment->receivedamount); ?></td><td data-label="Expected"><?php echo (int)$commitment->expectedat > 0 ? s(userdate((int)$commitment->expectedat, get_string('strftimedate'))) : 'Not set'; ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?>
      </section>
    </div>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
