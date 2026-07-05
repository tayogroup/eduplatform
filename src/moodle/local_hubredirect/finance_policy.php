<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/finance_lib.php');

function pqfpol_option_label(string $value): string {
    return ucwords(str_replace('_', ' ', $value));
}

function pqfpol_select(string $name, array $options, string $selected): string {
    $html = '<select class="pqfpol-input" name="' . s($name) . '">';
    foreach ($options as $value) {
        $html .= '<option value="' . s($value) . '"' . ($value === $selected ? ' selected' : '') . '>' . s(pqfpol_option_label($value)) . '</option>';
    }
    return $html . '</select>';
}

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
    pqh_access_denied('Only workspace admins can edit finance policy settings.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Finance policy access required');
}
if (!pqfin_policy_schema_ready()) {
    pqh_access_denied('Finance policy tables are not ready yet. Run the local_prequran plugin upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Finance policy unavailable');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$allowed = pqfin_policy_allowed_values();
$message = optional_param('saved', 0, PARAM_INT) === 1 ? 'Finance policy saved.' : '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen finance policy settings and try again.', new moodle_url('/local/hubredirect/finance_policy.php', $urlparams), 'Finance policy form expired');
    }
    try {
        $policy = [
            'policy_version' => 1,
            'default_currency' => optional_param('default_currency', pqfin_default_currency(), PARAM_ALPHANUMEXT),
            'invoice_number_prefix' => optional_param('invoice_number_prefix', 'INV', PARAM_ALPHANUMEXT),
            'invoice_due_days' => optional_param('invoice_due_days', 14, PARAM_INT),
            'invoice_issue_timing' => optional_param('invoice_issue_timing', 'manual', PARAM_ALPHANUMEXT),
            'payment_required_timing' => optional_param('payment_required_timing', 'admin_review', PARAM_ALPHANUMEXT),
            'deposit_requirement' => optional_param('deposit_requirement', 'none', PARAM_ALPHANUMEXT),
            'deposit_amount' => optional_param('deposit_amount', '', PARAM_RAW_TRIMMED),
            'student_billing_visibility' => optional_param('student_billing_visibility', 'disabled', PARAM_ALPHANUMEXT),
            'sponsor_billing_visibility' => optional_param('sponsor_billing_visibility', 'assigned_invoices_only', PARAM_ALPHANUMEXT),
            'finance_hold_balance_threshold' => optional_param('finance_hold_balance_threshold', '', PARAM_RAW_TRIMMED),
            'finance_hold_overdue_days' => optional_param('finance_hold_overdue_days', 30, PARAM_INT),
            'transcript_hold_behavior' => optional_param('transcript_hold_behavior', 'warning_only', PARAM_ALPHANUMEXT),
            'certificate_hold_behavior' => optional_param('certificate_hold_behavior', 'warning_only', PARAM_ALPHANUMEXT),
            'late_fee_behavior' => optional_param('late_fee_behavior', 'disabled', PARAM_ALPHANUMEXT),
            'automatic_access_lockout' => optional_param('automatic_access_lockout', 'disabled', PARAM_ALPHANUMEXT),
        ];
        pqfin_save_workspace_finance_policy($workspaceid, $consumercontext, $policy, (int)$USER->id);
        redirect(new moodle_url('/local/hubredirect/finance_policy.php', $urlparams + ['saved' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$policyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
$policy = pqfin_normalize_policy($policyinfo['policy']);
$dashboardurl = new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams);
$financeurl = new moodle_url('/local/hubredirect/student_finance.php', $urlparams);
$invoicesurl = new moodle_url('/local/hubredirect/invoices.php', $urlparams);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/finance_policy.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Finance Policy Settings');
$PAGE->set_heading('Finance Policy Settings');
$PAGE->add_body_class('pqfpol-page');

echo $OUTPUT->header();
?>
<style>
body.pqfpol-page header,body.pqfpol-page footer,body.pqfpol-page nav.navbar,body.pqfpol-page #page-header,body.pqfpol-page #page-footer,body.pqfpol-page .drawer,body.pqfpol-page .drawer-toggles,body.pqfpol-page .block-region,body.pqfpol-page [data-region="drawer"],body.pqfpol-page [data-region="right-hand-drawer"]{display:none!important}
body.pqfpol-page #page,body.pqfpol-page #page-content,body.pqfpol-page #region-main,body.pqfpol-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqfpol-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqfpol-wrap{max-width:1180px;margin:0 auto}.pqfpol-top,.pqfpol-panel,.pqfpol-side{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqfpol-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqfpol-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqfpol-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqfpol-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqfpol-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqfpol-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqfpol-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px}.pqfpol-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqfpol-field{display:grid;gap:5px;margin-bottom:10px}.pqfpol-field--wide{grid-column:1/-1}.pqfpol-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqfpol-field small{color:#647887;font-size:12px;font-weight:750;line-height:1.35}.pqfpol-input{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqfpol-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqfpol-alert--ok{background:#edf9ef;color:#245c35}.pqfpol-alert--bad{background:#fff0ed;color:#883526}.pqfpol-alert--warn{background:#fff7df;color:#6b4b00}.pqfpol-side h2,.pqfpol-panel h2{margin:0 0 12px;color:#221b22;font-size:18px;font-weight:950}.pqfpol-meta{display:grid;gap:9px}.pqfpol-meta div{padding:10px;border-radius:8px;background:#f7fafb}.pqfpol-meta span{display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}.pqfpol-meta strong{display:block;margin-top:4px;color:#173044;font-size:13px;font-weight:950;overflow-wrap:anywhere}.pqfpol-note{margin-top:12px;color:#5e7280;font-size:12px;font-weight:800;line-height:1.45}@media(max-width:900px){.pqfpol-top,.pqfpol-grid,.pqfpol-formgrid{grid-template-columns:1fr}.pqfpol-actions{justify-content:flex-start}}
</style>
<main class="pqfpol-shell"><div class="pqfpol-wrap">
  <section class="pqfpol-top">
    <div>
      <h1 class="pqfpol-title">Finance Policy Settings</h1>
      <p class="pqfpol-sub"><?php echo s((string)$workspace->name); ?> billing defaults before invoices affect enrollment.</p>
    </div>
    <nav class="pqfpol-actions" aria-label="Finance policy navigation">
      <a class="pqfpol-btn pqfpol-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Workspace</a>
      <a class="pqfpol-btn pqfpol-btn--light" href="<?php echo $invoicesurl->out(false); ?>">Invoices</a>
      <a class="pqfpol-btn pqfpol-btn--light" href="<?php echo $financeurl->out(false); ?>">Student finance</a>
    </nav>
  </section>

  <?php if ($message !== ''): ?><div class="pqfpol-alert pqfpol-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqfpol-alert pqfpol-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <?php if (!empty($policyinfo['warnings'])): ?><div class="pqfpol-alert pqfpol-alert--warn">This workspace is using default finance policy values. Save explicit settings before invoice phases launch.</div><?php endif; ?>

  <section class="pqfpol-grid">
    <form class="pqfpol-panel" method="post">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <h2>Billing Defaults</h2>
      <div class="pqfpol-formgrid">
        <div class="pqfpol-field">
          <label>Default currency</label>
          <input class="pqfpol-input" name="default_currency" maxlength="3" value="<?php echo s((string)$policy['default_currency']); ?>">
          <small>One invoice and one payment currency only. Cross-currency allocation remains out of scope.</small>
        </div>
        <div class="pqfpol-field">
          <label>Invoice number prefix</label>
          <input class="pqfpol-input" name="invoice_number_prefix" maxlength="20" value="<?php echo s((string)$policy['invoice_number_prefix']); ?>">
        </div>
        <div class="pqfpol-field">
          <label>Invoice due days</label>
          <input class="pqfpol-input" type="number" min="0" max="365" name="invoice_due_days" value="<?php echo (int)$policy['invoice_due_days']; ?>">
        </div>
        <div class="pqfpol-field">
          <label>Invoice issue timing</label>
          <?php echo pqfpol_select('invoice_issue_timing', $allowed['invoice_issue_timing'], (string)$policy['invoice_issue_timing']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Payment required timing</label>
          <?php echo pqfpol_select('payment_required_timing', $allowed['payment_required_timing'], (string)$policy['payment_required_timing']); ?>
          <small>Current recommendation: admin review. Automatic blocking comes later only after pilot.</small>
        </div>
        <div class="pqfpol-field">
          <label>Deposit requirement</label>
          <?php echo pqfpol_select('deposit_requirement', $allowed['deposit_requirement'], (string)$policy['deposit_requirement']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Deposit amount</label>
          <input class="pqfpol-input" name="deposit_amount" value="<?php echo s((string)$policy['deposit_amount']); ?>" placeholder="Optional">
        </div>
        <div class="pqfpol-field">
          <label>Student billing visibility</label>
          <?php echo pqfpol_select('student_billing_visibility', $allowed['student_billing_visibility'], (string)$policy['student_billing_visibility']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Sponsor visibility</label>
          <?php echo pqfpol_select('sponsor_billing_visibility', $allowed['sponsor_billing_visibility'], (string)$policy['sponsor_billing_visibility']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Hold balance threshold</label>
          <input class="pqfpol-input" name="finance_hold_balance_threshold" value="<?php echo s((string)$policy['finance_hold_balance_threshold']); ?>" placeholder="Optional">
        </div>
        <div class="pqfpol-field">
          <label>Hold overdue days</label>
          <input class="pqfpol-input" type="number" min="0" max="365" name="finance_hold_overdue_days" value="<?php echo (int)$policy['finance_hold_overdue_days']; ?>">
        </div>
        <div class="pqfpol-field">
          <label>Transcript hold</label>
          <?php echo pqfpol_select('transcript_hold_behavior', $allowed['transcript_hold_behavior'], (string)$policy['transcript_hold_behavior']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Certificate hold</label>
          <?php echo pqfpol_select('certificate_hold_behavior', $allowed['certificate_hold_behavior'], (string)$policy['certificate_hold_behavior']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Late fees</label>
          <?php echo pqfpol_select('late_fee_behavior', $allowed['late_fee_behavior'], (string)$policy['late_fee_behavior']); ?>
        </div>
        <div class="pqfpol-field">
          <label>Automatic access lockout</label>
          <?php echo pqfpol_select('automatic_access_lockout', $allowed['automatic_access_lockout'], (string)$policy['automatic_access_lockout']); ?>
        </div>
      </div>
      <button class="pqfpol-btn" type="submit">Save finance policy</button>
    </form>

    <aside class="pqfpol-side">
      <h2>Current Policy</h2>
      <div class="pqfpol-meta">
        <div><span>Source</span><strong><?php echo s((string)$policyinfo['source']); ?></strong></div>
        <div><span>Version</span><strong><?php echo (int)$policyinfo['policyversion']; ?></strong></div>
        <div><span>Hash</span><strong><?php echo s((string)$policyinfo['policyhash']); ?></strong></div>
        <div><span>Last saved</span><strong><?php echo (int)$policyinfo['timemodified'] > 0 ? s(userdate((int)$policyinfo['timemodified'], get_string('strftimedatetimeshort'))) : 'Not saved yet'; ?></strong></div>
      </div>
      <p class="pqfpol-note">Phase 2 does not create invoices or block enrollment. These settings provide an authoritative policy resolver for later invoice, payment, hold, and notification phases.</p>
    </aside>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
