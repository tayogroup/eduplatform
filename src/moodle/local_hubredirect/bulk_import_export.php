<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/data_operationslib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT));
$urlparams = ['workspaceid' => $workspaceid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid <= 0 || (!pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) && !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'registrar.manage'))) {
    pqh_access_denied('Only workspace administrators can manage bulk import/export tools.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Bulk tools access required');
}
if (!pqdo_schema_ready()) {
    pqh_access_denied('Bulk import/export schema is not ready. Run the local_prequran upgrade first.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Bulk tools schema pending');
}

$dataset = optional_param('dataset', 'members', PARAM_ALPHANUMEXT);
if (optional_param('export', '', PARAM_ALPHA) === 'csv') {
    [$headers, $rows] = pqdo_workspace_export_rows($workspaceid, $dataset);
    pqdo_record_bulk_job($workspaceid, $consumercontext, (int)$USER->id, 'export', $dataset, '', ['total' => count($rows), 'success' => count($rows), 'errors' => 0, 'messages' => ['CSV export generated.']]);
    pqdo_emit_csv('bulk-export-' . $dataset . '-' . $workspaceid . '-' . date('Ymd-His') . '.csv', $headers, $rows);
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$notice = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    try {
        $action = required_param('action', PARAM_ALPHANUMEXT);
        if ($action === 'process_import') {
            $text = optional_param('csv_rows', '', PARAM_RAW_TRIMMED);
            $commit = optional_param('commit', 0, PARAM_INT) === 1;
            $rows = pqdo_parse_csv_text($text);
            $result = pqdo_process_member_rows($workspaceid, $rows, $commit, (int)$USER->id);
            $jobid = pqdo_record_bulk_job($workspaceid, $consumercontext, (int)$USER->id, $commit ? 'import_commit' : 'import_preview', 'members', $text, $result);
            $notice = 'Bulk job #' . $jobid . ' processed: ' . (int)$result['success'] . ' success, ' . (int)$result['errors'] . ' error(s).';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$jobs = array_values($DB->get_records('local_prequran_bulk_job', ['workspaceid' => $workspaceid], 'timecreated DESC, id DESC', '*', 0, 100));

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/bulk_import_export.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Bulk Import And Export Tools');
$PAGE->set_heading('Bulk Import And Export Tools');
$PAGE->add_body_class('pqbulk-page');
echo $OUTPUT->header();
?>
<style>
body.pqbulk-page header,body.pqbulk-page footer,body.pqbulk-page nav.navbar,body.pqbulk-page #page-header,body.pqbulk-page #page-footer,body.pqbulk-page .drawer,body.pqbulk-page .drawer-toggles,body.pqbulk-page .block-region{display:none!important}body.pqbulk-page #page,body.pqbulk-page #page-content,body.pqbulk-page #region-main,body.pqbulk-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}.pqbulk{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqbulk-wrap{max-width:1260px;margin:0 auto}.pqbulk-top,.pqbulk-panel,.pqbulk-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqbulk-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqbulk-title{margin:0;color:#221b22;font-size:30px;font-weight:950}.pqbulk-muted{color:#5e7280;font-size:13px;font-weight:800}.pqbulk-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqbulk-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqbulk-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqbulk-grid{display:grid;grid-template-columns:390px 1fr;gap:14px}.pqbulk-field{display:grid;gap:5px;margin-bottom:10px}.pqbulk-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqbulk-input,.pqbulk-select,.pqbulk-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqbulk-input,.pqbulk-select{padding:0 10px}.pqbulk-textarea{min-height:180px;padding:10px}.pqbulk-table{width:100%;border-collapse:separate;border-spacing:0}.pqbulk-table th,.pqbulk-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqbulk-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqbulk-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqbulk-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqbulk-alert--ok{background:#edf9ef;color:#245c35}.pqbulk-alert--bad{background:#fff0ed;color:#883526}@media(max-width:900px){.pqbulk-top,.pqbulk-grid{grid-template-columns:1fr}.pqbulk-actions{justify-content:flex-start}}
</style>
<main class="pqbulk"><div class="pqbulk-wrap">
  <section class="pqbulk-top"><div><h1 class="pqbulk-title">Bulk Import And Export Tools</h1><div class="pqbulk-muted"><?php echo s((string)$workspace->name); ?> CSV imports, previews, exports, and auditable job history.</div></div><nav class="pqbulk-actions"><a class="pqbulk-btn pqbulk-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><a class="pqbulk-btn pqbulk-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/data_migration_tools.php', $urlparams))->out(false); ?>">Migration</a><a class="pqbulk-btn pqbulk-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/backup_dr_checks.php', $urlparams))->out(false); ?>">Backup/DR</a></nav></section>
  <?php if ($notice !== ''): ?><div class="pqbulk-alert pqbulk-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqbulk-alert pqbulk-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <div class="pqbulk-grid">
    <section class="pqbulk-panel"><h2 class="pqbulk-title" style="font-size:21px">Import Members</h2><form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="process_import"><div class="pqbulk-field"><label>CSV rows</label><textarea class="pqbulk-textarea" name="csv_rows" placeholder="role,email-or-user-id-or-username&#10;student,student@example.com&#10;teacher,42"></textarea></div><div class="pqbulk-field"><label><input type="checkbox" name="commit" value="1"> Commit rows after validation</label></div><button class="pqbulk-btn" type="submit">Process Import</button></form><hr><h2 class="pqbulk-title" style="font-size:21px">Export</h2><form method="get"><input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>"><div class="pqbulk-field"><label>Dataset</label><select class="pqbulk-select" name="dataset"><option value="members">Workspace members</option><option value="invoices">Invoices</option><option value="documents">Documents</option></select></div><button class="pqbulk-btn pqbulk-btn--light" name="export" value="csv" type="submit">Export CSV</button></form></section>
    <section class="pqbulk-panel"><h2 class="pqbulk-title" style="font-size:21px">Job History</h2><?php if (!$jobs): ?><div class="pqbulk-muted">No bulk jobs recorded yet.</div><?php endif; ?><?php if ($jobs): ?><table class="pqbulk-table"><thead><tr><th>Job</th><th>Dataset</th><th>Status</th><th>Rows</th><th>Created</th></tr></thead><tbody><?php foreach ($jobs as $job): ?><tr><td><strong><?php echo s((string)$job->jobnumber); ?></strong><div class="pqbulk-muted"><?php echo s((string)$job->jobtype); ?></div></td><td><?php echo s((string)$job->dataset); ?></td><td><span class="pqbulk-pill"><?php echo s((string)$job->status); ?></span></td><td><?php echo (int)$job->successrows; ?> ok / <?php echo (int)$job->errorrows; ?> errors</td><td><?php echo s(userdate((int)$job->timecreated)); ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></section>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
