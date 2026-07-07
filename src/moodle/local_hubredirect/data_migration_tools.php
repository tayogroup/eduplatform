<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/data_operationslib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid <= 0 || (!pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)
        && !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'tenant.audit.view')
        && !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'registrar.manage'))) {
    pqh_access_denied('Only workspace administrators can manage migration tools.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Migration access required');
}
if (!pqdo_schema_ready()) {
    pqh_access_denied('Data operations schema is not ready. Run the local_prequran upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Data operations schema pending');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    try {
        $action = required_param('action', PARAM_ALPHANUMEXT);
        if ($action === 'record_migration') {
            pqdo_record_migration_run($workspaceid, $consumercontext, (int)$USER->id, [
                'migrationtype' => optional_param('migrationtype', 'moodle_to_workspace', PARAM_TEXT),
                'source_system' => optional_param('source_system', 'moodle', PARAM_TEXT),
                'target_system' => optional_param('target_system', 'prequran_workspace', PARAM_TEXT),
                'mode' => optional_param('mode', 'dry_run', PARAM_ALPHANUMEXT),
                'mappingjson' => optional_param('mappingjson', '', PARAM_RAW_TRIMMED),
                'rollbackplan' => optional_param('rollbackplan', '', PARAM_RAW_TRIMMED),
            ]);
            $notice = 'Migration validation run recorded.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$inventory = pqdo_migration_inventory($workspaceid);
$availabletables = count(array_filter($inventory, static fn($count): bool => $count >= 0));
$totalrecords = array_sum(array_filter($inventory, static fn($count): bool => $count > 0));
$missingtables = count(array_filter($inventory, static fn($count): bool => $count < 0));
$runs = array_values($DB->get_records('local_prequran_migration_run', ['workspaceid' => $workspaceid], 'timecreated DESC, id DESC', '*', 0, 80));
$sqlrunbooks = [
    'Source inventory' => 'src/moodle/local_prequran/sql/migration/source_inventory.sql',
    'Custom table export list' => 'src/moodle/local_prequran/sql/migration/custom_table_export_list.sql',
    'Post-migration verification' => 'src/moodle/local_prequran/sql/migration/target_post_migration_verification.sql',
];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/data_migration_tools.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Data Migration Tools');
$PAGE->set_heading('Data Migration Tools');
$PAGE->add_body_class('pqdo-page');

echo $OUTPUT->header();
?>
<style>
body.pqdo-page header,body.pqdo-page footer,body.pqdo-page nav.navbar,body.pqdo-page #page-header,body.pqdo-page #page-footer,body.pqdo-page .drawer,body.pqdo-page .drawer-toggles,body.pqdo-page .block-region,body.pqdo-page [data-region="drawer"],body.pqdo-page [data-region="right-hand-drawer"]{display:none!important}
body.pqdo-page #page,body.pqdo-page #page-content,body.pqdo-page #region-main,body.pqdo-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqdo{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqdo-wrap{max-width:1280px;margin:0 auto}.pqdo-top,.pqdo-panel,.pqdo-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqdo-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqdo-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.08}.pqdo-muted{color:#5e7280;font-size:13px;font-weight:800;line-height:1.45}.pqdo-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqdo-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqdo-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqdo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqdo-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqdo-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqdo-grid{display:grid;grid-template-columns:390px 1fr;gap:14px}.pqdo-stack{display:grid;gap:14px}.pqdo-field{display:grid;gap:5px;margin-bottom:10px}.pqdo-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqdo-input,.pqdo-select,.pqdo-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqdo-input,.pqdo-select{padding:0 10px}.pqdo-textarea{min-height:94px;padding:10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.pqdo-table{width:100%;border-collapse:separate;border-spacing:0}.pqdo-table th,.pqdo-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqdo-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqdo-name{display:block;color:#221b22;font-weight:950}.pqdo-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqdo-pill--validated,.pqdo-pill--completed{background:#edf9ef;color:#245c35}.pqdo-pill--needs_review,.pqdo-pill--warning{background:#fff4dc;color:#73501b}.pqdo-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqdo-alert--ok{background:#edf9ef;color:#245c35}.pqdo-alert--bad{background:#fff0ed;color:#883526}@media(max-width:920px){.pqdo-top,.pqdo-grid,.pqdo-metrics{grid-template-columns:1fr}.pqdo-actions{justify-content:flex-start}.pqdo-table thead{display:none}.pqdo-table tr,.pqdo-table td{display:block}.pqdo-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqdo"><div class="pqdo-wrap">
  <section class="pqdo-top"><div><h1 class="pqdo-title">Data Migration Tools</h1><div class="pqdo-muted"><?php echo s((string)$workspace->name); ?> inventory, dry-run validation, mapping notes, rollback planning, and migration audit history.</div></div><nav class="pqdo-actions"><a class="pqdo-btn pqdo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><a class="pqdo-btn pqdo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/bulk_import_export.php', $urlparams))->out(false); ?>">Bulk Tools</a><a class="pqdo-btn pqdo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/backup_dr_checks.php', $urlparams))->out(false); ?>">Backup Checks</a></nav></section>
  <?php if ($notice !== ''): ?><div class="pqdo-alert pqdo-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqdo-alert pqdo-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqdo-metrics"><div class="pqdo-metric"><strong><?php echo (int)$availabletables; ?></strong><span>Inventoried tables</span></div><div class="pqdo-metric"><strong><?php echo (int)$totalrecords; ?></strong><span>Scoped records</span></div><div class="pqdo-metric"><strong><?php echo (int)$missingtables; ?></strong><span>Missing tables</span></div><div class="pqdo-metric"><strong><?php echo count($runs); ?></strong><span>Recorded runs</span></div></section>
  <div class="pqdo-grid">
    <section class="pqdo-panel">
      <h2 class="pqdo-title" style="font-size:21px">Record Validation Run</h2>
      <form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="record_migration">
        <div class="pqdo-field"><label>Migration type</label><input class="pqdo-input" name="migrationtype" value="moodle_to_workspace"></div>
        <div class="pqdo-field"><label>Source system</label><input class="pqdo-input" name="source_system" value="moodle"></div>
        <div class="pqdo-field"><label>Target system</label><input class="pqdo-input" name="target_system" value="prequran_workspace"></div>
        <div class="pqdo-field"><label>Mode</label><select class="pqdo-select" name="mode"><option value="dry_run">Dry run</option><option value="staged">Staged</option><option value="production">Production</option></select></div>
        <div class="pqdo-field"><label>Mapping JSON or notes</label><textarea class="pqdo-textarea" name="mappingjson" placeholder='{"user":"userid","student":"studentid"}'></textarea></div>
        <div class="pqdo-field"><label>Rollback plan</label><textarea class="pqdo-textarea" name="rollbackplan" placeholder="Snapshot, verify counts, restore path, owner approval."></textarea></div>
        <button class="pqdo-btn" type="submit">Record Run</button>
      </form>
    </section>
    <div class="pqdo-stack">
      <section class="pqdo-panel"><h2 class="pqdo-title" style="font-size:21px">Workspace Inventory</h2><table class="pqdo-table"><thead><tr><th>Table</th><th>Status</th><th>Records</th></tr></thead><tbody><?php foreach ($inventory as $table => $count): ?><tr><td data-label="Table"><span class="pqdo-name"><?php echo s($table); ?></span></td><td data-label="Status"><span class="pqdo-pill pqdo-pill--<?php echo $count >= 0 ? 'validated' : 'warning'; ?>"><?php echo $count >= 0 ? 'available' : 'missing'; ?></span></td><td data-label="Records"><?php echo $count >= 0 ? (int)$count : 'Not installed'; ?></td></tr><?php endforeach; ?></tbody></table></section>
      <section class="pqdo-panel"><h2 class="pqdo-title" style="font-size:21px">Migration Runbooks</h2><table class="pqdo-table"><thead><tr><th>Runbook</th><th>Path</th></tr></thead><tbody><?php foreach ($sqlrunbooks as $label => $path): ?><tr><td data-label="Runbook"><span class="pqdo-name"><?php echo s($label); ?></span></td><td data-label="Path"><?php echo s($path); ?></td></tr><?php endforeach; ?></tbody></table></section>
      <section class="pqdo-panel"><h2 class="pqdo-title" style="font-size:21px">Run History</h2><?php if (!$runs): ?><div class="pqdo-muted">No migration validation runs recorded yet.</div><?php endif; ?><?php if ($runs): ?><table class="pqdo-table"><thead><tr><th>Run</th><th>Mode</th><th>Status</th><th>Counts</th><th>Created</th></tr></thead><tbody><?php foreach ($runs as $run): ?><tr><td data-label="Run"><span class="pqdo-name"><?php echo s((string)$run->runnumber); ?></span><span class="pqdo-muted"><?php echo s((string)$run->source_system . ' to ' . (string)$run->target_system); ?></span></td><td data-label="Mode"><?php echo s((string)$run->mode); ?></td><td data-label="Status"><span class="pqdo-pill pqdo-pill--<?php echo s((string)$run->status); ?>"><?php echo s((string)$run->status); ?></span></td><td data-label="Counts"><?php echo (int)$run->mappedcount; ?> mapped<div class="pqdo-muted"><?php echo (int)$run->errorcount; ?> errors</div></td><td data-label="Created"><?php echo s(userdate((int)$run->timecreated)); ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></section>
    </div>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
