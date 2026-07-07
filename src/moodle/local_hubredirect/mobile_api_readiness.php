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
if ($workspaceid <= 0 || (!pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) && !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'tenant.audit.view'))) {
    pqh_access_denied('Only workspace administrators can manage mobile/API readiness.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Mobile readiness access required');
}
if (!pqml_schema_ready()) {
    pqh_access_denied('Mobile/API readiness schema is not ready. Run the local_prequran upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Mobile readiness schema pending');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $action = required_param('action', PARAM_ALPHANUMEXT);
    try {
        if ($action === 'save_client') {
            $clientid = pqml_upsert_mobile_client($workspaceid, $consumercontext, (int)$USER->id, [
                'clientid' => optional_param('clientid', 0, PARAM_INT),
                'clientname' => optional_param('clientname', '', PARAM_TEXT),
                'platform' => optional_param('platform', 'mobile', PARAM_ALPHANUMEXT),
                'clientkey' => optional_param('clientkey', '', PARAM_ALPHANUMEXT),
                'status' => optional_param('status', 'draft', PARAM_ALPHANUMEXT),
                'min_app_version' => optional_param('min_app_version', '', PARAM_TEXT),
                'current_app_version' => optional_param('current_app_version', '', PARAM_TEXT),
                'api_scope' => optional_param('api_scope', '', PARAM_TEXT),
                'redirecturis' => optional_param('redirecturis', '', PARAM_TEXT),
                'notes' => optional_param('notes', '', PARAM_TEXT),
            ]);
            pqml_save_readiness_snapshot($workspaceid, $consumercontext, $clientid, (int)$USER->id);
            $notice = 'Mobile client profile saved and readiness snapshot refreshed.';
        } else if ($action === 'run_checks') {
            pqml_save_readiness_snapshot($workspaceid, $consumercontext, optional_param('clientid', 0, PARAM_INT), (int)$USER->id);
            $notice = 'Readiness checks refreshed.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$inventory = pqml_service_inventory();
$checks = pqml_readiness_checks($workspaceid, 0);
$clients = array_values($DB->get_records('local_prequran_mobile_client', ['workspaceid' => $workspaceid], 'timemodified DESC, id DESC', '*', 0, 100));
$snapshots = array_values($DB->get_records('local_prequran_mobile_check', ['workspaceid' => $workspaceid], 'checkedat DESC, id DESC', '*', 0, 120));
$ok = count(array_filter($checks, static fn($check): bool => $check['status'] === 'ok'));
$warnings = count(array_filter($checks, static fn($check): bool => $check['status'] === 'warning'));
$fails = count(array_filter($checks, static fn($check): bool => $check['status'] === 'fail'));

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/mobile_api_readiness.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Mobile App And API Readiness');
$PAGE->set_heading('Mobile App And API Readiness');
$PAGE->add_body_class('pqmob-page');

echo $OUTPUT->header();
?>
<style>
body.pqmob-page header,body.pqmob-page footer,body.pqmob-page nav.navbar,body.pqmob-page #page-header,body.pqmob-page #page-footer,body.pqmob-page .drawer,body.pqmob-page .drawer-toggles,body.pqmob-page .block-region,body.pqmob-page [data-region="drawer"],body.pqmob-page [data-region="right-hand-drawer"]{display:none!important}
body.pqmob-page #page,body.pqmob-page #page-content,body.pqmob-page #region-main,body.pqmob-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqmob{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqmob-wrap{max-width:1280px;margin:0 auto}.pqmob-top,.pqmob-panel,.pqmob-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqmob-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqmob-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.08}.pqmob-muted{color:#5e7280;font-size:13px;font-weight:800}.pqmob-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqmob-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqmob-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqmob-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqmob-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqmob-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqmob-grid{display:grid;grid-template-columns:390px 1fr;gap:14px}.pqmob-field{display:grid;gap:5px;margin-bottom:10px}.pqmob-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqmob-input,.pqmob-select,.pqmob-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqmob-input,.pqmob-select{padding:0 10px}.pqmob-textarea{min-height:74px;padding:10px}.pqmob-table{width:100%;border-collapse:separate;border-spacing:0}.pqmob-table th,.pqmob-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqmob-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqmob-name{display:block;color:#221b22;font-weight:950}.pqmob-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqmob-pill--ok{background:#edf9ef;color:#245c35}.pqmob-pill--warning{background:#fff4dc;color:#73501b}.pqmob-pill--fail{background:#fff0ed;color:#883526}.pqmob-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqmob-alert--ok{background:#edf9ef;color:#245c35}.pqmob-alert--bad{background:#fff0ed;color:#883526}.pqmob-stack{display:grid;gap:14px}@media(max-width:920px){.pqmob-top,.pqmob-grid,.pqmob-metrics{grid-template-columns:1fr}.pqmob-actions{justify-content:flex-start}.pqmob-table thead{display:none}.pqmob-table tr,.pqmob-table td{display:block}.pqmob-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqmob"><div class="pqmob-wrap">
  <section class="pqmob-top"><div><h1 class="pqmob-title">Mobile App And API Readiness</h1><div class="pqmob-muted"><?php echo s((string)$workspace->name); ?> REST endpoint, webservice inventory, token readiness, client registry, and launch checks.</div></div><nav class="pqmob-actions"><a class="pqmob-btn pqmob-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><a class="pqmob-btn pqmob-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/localization_currency.php', $urlparams))->out(false); ?>">Localization</a><form method="post" style="margin:0"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="run_checks"><button class="pqmob-btn" type="submit">Run Checks</button></form></nav></section>
  <?php if ($notice !== ''): ?><div class="pqmob-alert pqmob-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqmob-alert pqmob-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqmob-metrics"><div class="pqmob-metric"><strong><?php echo (int)$ok; ?></strong><span>Passing checks</span></div><div class="pqmob-metric"><strong><?php echo (int)$warnings; ?></strong><span>Warnings</span></div><div class="pqmob-metric"><strong><?php echo (int)$fails; ?></strong><span>Failures</span></div><div class="pqmob-metric"><strong><?php echo count($inventory['functions']); ?></strong><span>Service functions</span></div></section>
  <div class="pqmob-grid">
    <section class="pqmob-panel">
      <h2 class="pqmob-title" style="font-size:21px">Client Profile</h2>
      <form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="save_client">
        <div class="pqmob-field"><label>Client name</label><input class="pqmob-input" name="clientname" required placeholder="Parent mobile app"></div>
        <div class="pqmob-field"><label>Platform</label><select class="pqmob-select" name="platform"><option value="ios">iOS</option><option value="android">Android</option><option value="pwa">PWA</option><option value="mobile">Generic mobile</option></select></div>
        <div class="pqmob-field"><label>Client key</label><input class="pqmob-input" name="clientkey" placeholder="Auto-generated if blank"></div>
        <div class="pqmob-field"><label>Status</label><select class="pqmob-select" name="status"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="retired">Retired</option></select></div>
        <div class="pqmob-field"><label>Minimum app version</label><input class="pqmob-input" name="min_app_version" placeholder="1.0.0"></div>
        <div class="pqmob-field"><label>Current app version</label><input class="pqmob-input" name="current_app_version" placeholder="1.0.0"></div>
        <div class="pqmob-field"><label>API scope</label><input class="pqmob-input" name="api_scope" value="student,parent,teacher,finance"></div>
        <div class="pqmob-field"><label>Redirect URIs</label><textarea class="pqmob-textarea" name="redirecturis"></textarea></div>
        <div class="pqmob-field"><label>Notes</label><textarea class="pqmob-textarea" name="notes"></textarea></div>
        <button class="pqmob-btn" type="submit">Save Client</button>
      </form>
    </section>
    <div class="pqmob-stack">
      <section class="pqmob-panel"><h2 class="pqmob-title" style="font-size:21px">Readiness Checks</h2><table class="pqmob-table"><thead><tr><th>Check</th><th>Status</th><th>Summary</th></tr></thead><tbody><?php foreach ($checks as $check): ?><tr><td data-label="Check"><span class="pqmob-name"><?php echo s($check['label']); ?></span><span class="pqmob-muted"><?php echo s($check['key']); ?></span></td><td data-label="Status"><span class="pqmob-pill pqmob-pill--<?php echo s($check['status']); ?>"><?php echo s($check['status']); ?></span><span class="pqmob-pill"><?php echo s($check['severity']); ?></span></td><td data-label="Summary"><?php echo s($check['summary']); ?></td></tr><?php endforeach; ?></tbody></table></section>
      <section class="pqmob-panel"><h2 class="pqmob-title" style="font-size:21px">Registered Clients</h2><?php if (!$clients): ?><div class="pqmob-muted">No mobile clients registered yet.</div><?php endif; ?><?php if ($clients): ?><table class="pqmob-table"><thead><tr><th>Client</th><th>Platform</th><th>Status</th><th>Version</th><th>Last check</th></tr></thead><tbody><?php foreach ($clients as $client): ?><tr><td data-label="Client"><span class="pqmob-name"><?php echo s((string)$client->clientname); ?></span><span class="pqmob-muted"><?php echo s((string)$client->clientkey); ?></span></td><td data-label="Platform"><?php echo s((string)$client->platform); ?></td><td data-label="Status"><span class="pqmob-pill"><?php echo s((string)$client->status); ?></span></td><td data-label="Version"><?php echo s((string)$client->current_app_version); ?><div class="pqmob-muted">Min <?php echo s((string)$client->min_app_version); ?></div></td><td data-label="Last check"><?php echo (int)$client->lastcheckat > 0 ? s(userdate((int)$client->lastcheckat)) : 'Not checked'; ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></section>
      <section class="pqmob-panel"><h2 class="pqmob-title" style="font-size:21px">Recent Snapshots</h2><?php if (!$snapshots): ?><div class="pqmob-muted">No stored readiness snapshots yet.</div><?php endif; ?><?php if ($snapshots): ?><table class="pqmob-table"><thead><tr><th>Check</th><th>Status</th><th>Summary</th><th>Checked</th></tr></thead><tbody><?php foreach ($snapshots as $snapshot): ?><tr><td data-label="Check"><?php echo s((string)$snapshot->checkkey); ?></td><td data-label="Status"><span class="pqmob-pill pqmob-pill--<?php echo s((string)$snapshot->status); ?>"><?php echo s((string)$snapshot->status); ?></span></td><td data-label="Summary"><?php echo s((string)$snapshot->summary); ?></td><td data-label="Checked"><?php echo s(userdate((int)$snapshot->checkedat)); ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></section>
    </div>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
