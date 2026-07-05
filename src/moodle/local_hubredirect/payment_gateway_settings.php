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
    pqh_access_denied('Only workspace finance admins can configure hosted payments.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Payment settings access required');
}

$message = optional_param('saved', 0, PARAM_INT) ? 'Payment gateway settings saved.' : '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    try {
        pqfin_save_workspace_gateway_config($workspaceid, $consumercontext, (int)$USER->id, [
            'status' => optional_param('status', 'disabled', PARAM_ALPHANUMEXT),
            'provider' => optional_param('provider', 'generic_hosted', PARAM_ALPHANUMEXT),
            'mode' => optional_param('mode', 'test', PARAM_ALPHANUMEXT),
            'accountid' => optional_param('accountid', '', PARAM_TEXT),
            'displayname' => optional_param('displayname', 'Workspace hosted payments', PARAM_TEXT),
            'checkoutbaseurl' => optional_param('checkoutbaseurl', '', PARAM_URL),
            'apikey' => optional_param('apikey', '', PARAM_RAW_TRIMMED),
            'webhooksecret' => optional_param('webhooksecret', '', PARAM_RAW_TRIMMED),
        ]);
        redirect(new moodle_url('/local/hubredirect/payment_gateway_settings.php', $urlparams + ['saved' => 1]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$config = pqfin_effective_gateway_config($workspaceid, $consumercontext);
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
$webhookurl = pqfin_domain_aware_url($workspaceid, $consumercontext, '/local/hubredirect/payment_webhook.php', []);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/payment_gateway_settings.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Payment Gateway Settings');
$PAGE->set_heading('Payment Gateway Settings');
$PAGE->add_body_class('pqpayset-page');

echo $OUTPUT->header();
?>
<style>
body.pqpayset-page header,body.pqpayset-page footer,body.pqpayset-page nav.navbar,body.pqpayset-page #page-header,body.pqpayset-page #page-footer,body.pqpayset-page .drawer,body.pqpayset-page .drawer-toggles,body.pqpayset-page .block-region,body.pqpayset-page [data-region="drawer"],body.pqpayset-page [data-region="right-hand-drawer"]{display:none!important}
body.pqpayset-page #page,body.pqpayset-page #page-content,body.pqpayset-page #region-main,body.pqpayset-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpays-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqpays-wrap{max-width:920px;margin:0 auto}.pqpays-top,.pqpays-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqpays-top{display:flex;justify-content:space-between;gap:14px;margin-bottom:14px}.pqpays-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqpays-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqpays-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqpays-btn--primary{background:#2f6f4e;color:#fff!important}.pqpays-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqpays-field{display:grid;gap:5px;margin-bottom:10px}.pqpays-field--wide{grid-column:1/-1}.pqpays-field label{color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqpays-input,.pqpays-select{width:100%;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-weight:800;box-sizing:border-box}.pqpays-alert{margin:0 0 12px;padding:10px 12px;border-radius:8px;font-weight:900}.pqpays-alert--ok{background:#eaf7ef;color:#1f5d3f}.pqpays-alert--err{background:#fff0ef;color:#8a3028}.pqpays-note{padding:12px;border-radius:8px;background:#eef4f6;color:#415363;font-weight:850;word-break:break-word}@media(max-width:760px){.pqpays-top,.pqpays-grid{display:block}}
</style>
<main class="pqpays-shell"><div class="pqpays-wrap">
  <section class="pqpays-top">
    <div><h1 class="pqpays-title"><?php echo s((string)($workspace->name ?? 'Workspace')); ?> Payment Gateway</h1><p class="pqpays-sub">Configure workspace-level hosted payment collection.</p></div>
    <a class="pqpays-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams))->out(false); ?>">Finance operations</a>
  </section>
  <?php if ($message !== ''): ?><div class="pqpays-alert pqpays-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqpays-alert pqpays-alert--err"><?php echo s($error); ?></div><?php endif; ?>
  <?php if (!pqfin_gateway_schema_ready()): ?><div class="pqpays-alert pqpays-alert--err">Payment gateway schema is not ready. Run the local_prequran Moodle upgrade.</div><?php endif; ?>
  <section class="pqpays-panel">
    <form method="post" class="pqpays-grid">
      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
      <div class="pqpays-field"><label>Status</label><select class="pqpays-select" name="status"><option value="disabled">Disabled</option><option value="active"<?php echo (string)$config['status'] === 'active' ? ' selected' : ''; ?>>Active</option></select></div>
      <div class="pqpays-field"><label>Mode</label><select class="pqpays-select" name="mode"><option value="test">Test</option><option value="live"<?php echo (string)$config['mode'] === 'live' ? ' selected' : ''; ?>>Live</option></select></div>
      <div class="pqpays-field"><label>Provider</label><input class="pqpays-input" name="provider" value="<?php echo s((string)$config['provider']); ?>"></div>
      <div class="pqpays-field"><label>Account ID</label><input class="pqpays-input" name="accountid" value="<?php echo s((string)$config['accountid']); ?>"></div>
      <div class="pqpays-field pqpays-field--wide"><label>Display name</label><input class="pqpays-input" name="displayname" value="<?php echo s((string)$config['displayname']); ?>"></div>
      <div class="pqpays-field pqpays-field--wide"><label>Checkout base URL</label><input class="pqpays-input" name="checkoutbaseurl" value="<?php echo s((string)$config['checkoutbaseurl']); ?>"></div>
      <div class="pqpays-field"><label>API key</label><input class="pqpays-input" name="apikey" type="password" placeholder="<?php echo trim((string)$config['apikey']) !== '' ? 'Saved' : ''; ?>"></div>
      <div class="pqpays-field"><label>Webhook secret</label><input class="pqpays-input" name="webhooksecret" type="password" placeholder="<?php echo trim((string)$config['webhooksecret']) !== '' ? 'Saved' : ''; ?>"></div>
      <div class="pqpays-field pqpays-field--wide"><label>Webhook URL</label><div class="pqpays-note"><?php echo s($webhookurl->out(false)); ?></div></div>
      <div><button class="pqpays-btn pqpays-btn--primary" type="submit">Save settings</button></div>
    </form>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
