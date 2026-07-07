<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/mobile_localizationlib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid <= 0 || (!pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) && !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'finance.manage'))) {
    pqh_access_denied('Only workspace administrators can manage localization and currency settings.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Localization access required');
}
if (!pqml_schema_ready()) {
    pqh_access_denied('Localization schema is not ready. Run the local_prequran upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Localization schema pending');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $action = required_param('action', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'save_locale') {
            pqml_save_locale_profile($workspaceid, $consumercontext, (int)$USER->id, [
                'locale' => optional_param('locale', 'en_US', PARAM_TEXT),
                'language' => optional_param('language', 'en', PARAM_ALPHANUMEXT),
                'country' => optional_param('country', '', PARAM_TEXT),
                'timezone' => optional_param('timezone', 'UTC', PARAM_TEXT),
                'date_format' => optional_param('date_format', 'Y-m-d', PARAM_TEXT),
                'time_format' => optional_param('time_format', 'H:i', PARAM_TEXT),
                'week_start' => optional_param('week_start', 'sunday', PARAM_ALPHANUMEXT),
                'number_format' => optional_param('number_format', '1,234.56', PARAM_TEXT),
                'currency_position' => optional_param('currency_position', 'before', PARAM_ALPHANUMEXT),
                'default_currency' => optional_param('default_currency', pqfin_default_currency(), PARAM_ALPHANUMEXT),
                'enabled_currencies' => optional_param('enabled_currencies', pqfin_default_currency(), PARAM_TEXT),
                'tax_region' => optional_param('tax_region', '', PARAM_TEXT),
                'tax_behavior' => optional_param('tax_behavior', 'not_configured', PARAM_ALPHANUMEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
            ]);
            $notice = 'Locale profile saved.';
        } else if ($action === 'save_rate') {
            $effective = optional_param('effective_date', '', PARAM_RAW_TRIMMED);
            $expires = optional_param('expires_date', '', PARAM_RAW_TRIMMED);
            pqml_save_currency_rate($workspaceid, $consumercontext, (int)$USER->id, [
                'base_currency' => optional_param('base_currency', pqfin_default_currency(), PARAM_ALPHANUMEXT),
                'quote_currency' => optional_param('quote_currency', pqfin_default_currency(), PARAM_ALPHANUMEXT),
                'rate' => optional_param('rate', '1.000000', PARAM_TEXT),
                'provider' => optional_param('provider', 'manual', PARAM_TEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'effectiveat' => $effective !== '' ? strtotime($effective . ' 12:00:00') : time(),
                'expiresat' => $expires !== '' ? strtotime($expires . ' 12:00:00') : 0,
                'notes' => optional_param('notes', '', PARAM_TEXT),
            ]);
            $notice = 'Currency rate saved.';
        } else if ($action === 'save_tax') {
            $effective = optional_param('effective_date', '', PARAM_RAW_TRIMMED);
            pqml_save_tax_region($workspaceid, $consumercontext, (int)$USER->id, [
                'regioncode' => optional_param('regioncode', '', PARAM_ALPHANUMEXT),
                'regionname' => optional_param('regionname', '', PARAM_TEXT),
                'taxname' => optional_param('taxname', 'Tax', PARAM_TEXT),
                'taxrate' => optional_param('taxrate', '0.0000', PARAM_TEXT),
                'behavior' => optional_param('behavior', 'not_configured', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'exemptionnote' => optional_param('exemptionnote', '', PARAM_TEXT),
                'effectiveat' => $effective !== '' ? strtotime($effective . ' 12:00:00') : time(),
            ]);
            $notice = 'Tax region saved.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$profile = pqml_locale_profile($workspaceid);
$policyinfo = pqfin_workspace_finance_policy($workspaceid, $consumercontext);
$policy = pqfin_normalize_policy($policyinfo['policy']);
$rates = array_values($DB->get_records('local_prequran_currency_rate', ['workspaceid' => $workspaceid], 'effectiveat DESC, id DESC', '*', 0, 100));
$taxregions = array_values($DB->get_records('local_prequran_tax_region', ['workspaceid' => $workspaceid], 'effectiveat DESC, id DESC', '*', 0, 100));
$enabledcurrencies = $profile ? (string)$profile->enabled_currencies : (string)$policy['default_currency'];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/localization_currency.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Localization And Multi-Currency');
$PAGE->set_heading('Localization And Multi-Currency');
$PAGE->add_body_class('pqloc-page');

echo $OUTPUT->header();
?>
<style>
body.pqloc-page header,body.pqloc-page footer,body.pqloc-page nav.navbar,body.pqloc-page #page-header,body.pqloc-page #page-footer,body.pqloc-page .drawer,body.pqloc-page .drawer-toggles,body.pqloc-page .block-region,body.pqloc-page [data-region="drawer"],body.pqloc-page [data-region="right-hand-drawer"]{display:none!important}
body.pqloc-page #page,body.pqloc-page #page-content,body.pqloc-page #region-main,body.pqloc-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqloc{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqloc-wrap{max-width:1280px;margin:0 auto}.pqloc-top,.pqloc-panel,.pqloc-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqloc-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqloc-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.08}.pqloc-muted{color:#5e7280;font-size:13px;font-weight:800}.pqloc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqloc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqloc-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqloc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqloc-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqloc-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqloc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pqloc-field{display:grid;gap:5px;margin-bottom:10px}.pqloc-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqloc-input,.pqloc-select,.pqloc-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqloc-input,.pqloc-select{padding:0 10px}.pqloc-textarea{min-height:72px;padding:10px}.pqloc-formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqloc-table{width:100%;border-collapse:separate;border-spacing:0}.pqloc-table th,.pqloc-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqloc-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqloc-name{display:block;color:#221b22;font-weight:950}.pqloc-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqloc-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqloc-alert--ok{background:#edf9ef;color:#245c35}.pqloc-alert--bad{background:#fff0ed;color:#883526}.pqloc-stack{display:grid;gap:14px}@media(max-width:920px){.pqloc-top,.pqloc-grid,.pqloc-formgrid,.pqloc-metrics{grid-template-columns:1fr}.pqloc-actions{justify-content:flex-start}.pqloc-table thead{display:none}.pqloc-table tr,.pqloc-table td{display:block}.pqloc-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqloc"><div class="pqloc-wrap">
  <section class="pqloc-top"><div><h1 class="pqloc-title">Localization And Multi-Currency</h1><div class="pqloc-muted"><?php echo s((string)$workspace->name); ?> tenant locale, regional display formats, exchange rates, enabled currencies, and tax behavior.</div></div><nav class="pqloc-actions"><a class="pqloc-btn pqloc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><a class="pqloc-btn pqloc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/mobile_api_readiness.php', $urlparams))->out(false); ?>">Mobile/API</a><a class="pqloc-btn pqloc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/finance_policy.php', $urlparams))->out(false); ?>">Finance policy</a></nav></section>
  <?php if ($notice !== ''): ?><div class="pqloc-alert pqloc-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqloc-alert pqloc-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqloc-metrics"><div class="pqloc-metric"><strong><?php echo s($profile ? (string)$profile->locale : 'Default'); ?></strong><span>Locale</span></div><div class="pqloc-metric"><strong><?php echo s($profile ? (string)$profile->default_currency : (string)$policy['default_currency']); ?></strong><span>Default currency</span></div><div class="pqloc-metric"><strong><?php echo count($rates); ?></strong><span>Exchange rates</span></div><div class="pqloc-metric"><strong><?php echo count($taxregions); ?></strong><span>Tax regions</span></div></section>
  <div class="pqloc-grid">
    <section class="pqloc-panel"><h2 class="pqloc-title" style="font-size:21px">Tenant Locale Profile</h2><form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="save_locale"><div class="pqloc-formgrid">
      <div class="pqloc-field"><label>Locale</label><input class="pqloc-input" name="locale" value="<?php echo s($profile ? (string)$profile->locale : 'en_US'); ?>"></div>
      <div class="pqloc-field"><label>Language</label><input class="pqloc-input" name="language" value="<?php echo s($profile ? (string)$profile->language : 'en'); ?>"></div>
      <div class="pqloc-field"><label>Country</label><input class="pqloc-input" name="country" value="<?php echo s($profile ? (string)$profile->country : ''); ?>"></div>
      <div class="pqloc-field"><label>Timezone</label><input class="pqloc-input" name="timezone" value="<?php echo s($profile ? (string)$profile->timezone : 'UTC'); ?>"></div>
      <div class="pqloc-field"><label>Date format</label><input class="pqloc-input" name="date_format" value="<?php echo s($profile ? (string)$profile->date_format : 'Y-m-d'); ?>"></div>
      <div class="pqloc-field"><label>Time format</label><input class="pqloc-input" name="time_format" value="<?php echo s($profile ? (string)$profile->time_format : 'H:i'); ?>"></div>
      <div class="pqloc-field"><label>Week start</label><select class="pqloc-select" name="week_start"><?php foreach (['sunday','monday','saturday'] as $day): ?><option value="<?php echo s($day); ?>"<?php echo ($profile && (string)$profile->week_start === $day) ? ' selected' : ''; ?>><?php echo s(ucfirst($day)); ?></option><?php endforeach; ?></select></div>
      <div class="pqloc-field"><label>Number format</label><input class="pqloc-input" name="number_format" value="<?php echo s($profile ? (string)$profile->number_format : '1,234.56'); ?>"></div>
      <div class="pqloc-field"><label>Currency position</label><select class="pqloc-select" name="currency_position"><option value="before"<?php echo (!$profile || (string)$profile->currency_position === 'before') ? ' selected' : ''; ?>>Before amount</option><option value="after"<?php echo ($profile && (string)$profile->currency_position === 'after') ? ' selected' : ''; ?>>After amount</option></select></div>
      <div class="pqloc-field"><label>Default currency</label><input class="pqloc-input" name="default_currency" value="<?php echo s($profile ? (string)$profile->default_currency : (string)$policy['default_currency']); ?>"></div>
      <div class="pqloc-field"><label>Enabled currencies</label><input class="pqloc-input" name="enabled_currencies" value="<?php echo s($enabledcurrencies); ?>"></div>
      <div class="pqloc-field"><label>Tax region</label><input class="pqloc-input" name="tax_region" value="<?php echo s($profile ? (string)$profile->tax_region : ''); ?>"></div>
      <div class="pqloc-field"><label>Tax behavior</label><select class="pqloc-select" name="tax_behavior"><?php foreach (['not_configured','included','added_later','exempt'] as $behavior): ?><option value="<?php echo s($behavior); ?>"<?php echo ($profile && (string)$profile->tax_behavior === $behavior) ? ' selected' : ''; ?>><?php echo s(ucwords(str_replace('_', ' ', $behavior))); ?></option><?php endforeach; ?></select></div>
      <div class="pqloc-field" style="grid-column:1/-1"><label>Notes</label><textarea class="pqloc-textarea" name="notes"><?php echo s($profile ? (string)$profile->notes : ''); ?></textarea></div>
      </div><button class="pqloc-btn" type="submit">Save Locale</button></form></section>
    <div class="pqloc-stack">
      <section class="pqloc-panel"><h2 class="pqloc-title" style="font-size:21px">Exchange Rate</h2><form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="save_rate"><div class="pqloc-formgrid"><div class="pqloc-field"><label>Base currency</label><input class="pqloc-input" name="base_currency" value="<?php echo s($profile ? (string)$profile->default_currency : (string)$policy['default_currency']); ?>"></div><div class="pqloc-field"><label>Quote currency</label><input class="pqloc-input" name="quote_currency" placeholder="KES"></div><div class="pqloc-field"><label>Rate</label><input class="pqloc-input" name="rate" placeholder="129.500000"></div><div class="pqloc-field"><label>Provider</label><input class="pqloc-input" name="provider" value="manual"></div><div class="pqloc-field"><label>Status</label><select class="pqloc-select" name="status"><option value="active">Active</option><option value="draft">Draft</option><option value="retired">Retired</option></select></div><div class="pqloc-field"><label>Effective date</label><input class="pqloc-input" type="date" name="effective_date"></div><div class="pqloc-field"><label>Expires date</label><input class="pqloc-input" type="date" name="expires_date"></div><div class="pqloc-field"><label>Notes</label><input class="pqloc-input" name="notes"></div></div><button class="pqloc-btn" type="submit">Save Rate</button></form></section>
      <section class="pqloc-panel"><h2 class="pqloc-title" style="font-size:21px">Tax Region</h2><form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="save_tax"><div class="pqloc-formgrid"><div class="pqloc-field"><label>Region code</label><input class="pqloc-input" name="regioncode" placeholder="KE"></div><div class="pqloc-field"><label>Region name</label><input class="pqloc-input" name="regionname" placeholder="Kenya"></div><div class="pqloc-field"><label>Tax name</label><input class="pqloc-input" name="taxname" value="Tax"></div><div class="pqloc-field"><label>Tax rate</label><input class="pqloc-input" name="taxrate" value="0.0000"></div><div class="pqloc-field"><label>Behavior</label><select class="pqloc-select" name="behavior"><option value="not_configured">Not configured</option><option value="included">Included</option><option value="added_later">Added later</option><option value="exempt">Exempt</option></select></div><div class="pqloc-field"><label>Status</label><select class="pqloc-select" name="status"><option value="active">Active</option><option value="draft">Draft</option><option value="retired">Retired</option></select></div><div class="pqloc-field"><label>Effective date</label><input class="pqloc-input" type="date" name="effective_date"></div><div class="pqloc-field"><label>Exemption note</label><input class="pqloc-input" name="exemptionnote"></div></div><button class="pqloc-btn" type="submit">Save Tax Region</button></form></section>
    </div>
  </div>
  <section class="pqloc-grid" style="margin-top:14px">
    <div class="pqloc-panel"><h2 class="pqloc-title" style="font-size:21px">Rates</h2><?php if (!$rates): ?><div class="pqloc-muted">No exchange rates yet.</div><?php endif; ?><?php if ($rates): ?><table class="pqloc-table"><thead><tr><th>Pair</th><th>Rate</th><th>Status</th><th>Effective</th></tr></thead><tbody><?php foreach ($rates as $rate): ?><tr><td data-label="Pair"><span class="pqloc-name"><?php echo s((string)$rate->base_currency . ' / ' . (string)$rate->quote_currency); ?></span><span class="pqloc-muted"><?php echo s((string)$rate->provider); ?></span></td><td data-label="Rate"><?php echo s((string)$rate->rate); ?></td><td data-label="Status"><span class="pqloc-pill"><?php echo s((string)$rate->status); ?></span></td><td data-label="Effective"><?php echo (int)$rate->effectiveat > 0 ? s(userdate((int)$rate->effectiveat, get_string('strftimedate'))) : 'Not set'; ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></div>
    <div class="pqloc-panel"><h2 class="pqloc-title" style="font-size:21px">Tax Regions</h2><?php if (!$taxregions): ?><div class="pqloc-muted">No tax regions yet.</div><?php endif; ?><?php if ($taxregions): ?><table class="pqloc-table"><thead><tr><th>Region</th><th>Tax</th><th>Behavior</th><th>Status</th></tr></thead><tbody><?php foreach ($taxregions as $tax): ?><tr><td data-label="Region"><span class="pqloc-name"><?php echo s((string)$tax->regionname); ?></span><span class="pqloc-muted"><?php echo s((string)$tax->regioncode); ?></span></td><td data-label="Tax"><?php echo s((string)$tax->taxname . ' ' . (string)$tax->taxrate); ?></td><td data-label="Behavior"><span class="pqloc-pill"><?php echo s((string)$tax->behavior); ?></span></td><td data-label="Status"><?php echo s((string)$tax->status); ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></div>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
