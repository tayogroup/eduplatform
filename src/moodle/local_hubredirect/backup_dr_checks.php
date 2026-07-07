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
        && !pqh_user_has_workspace_capability((int)$USER->id, $workspaceid, 'tenant.audit.view'))) {
    pqh_access_denied('Only workspace administrators can manage backup and disaster recovery checks.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Backup check access required');
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
        if ($action === 'record_check') {
            $lastbackup = optional_param('lastbackup_date', '', PARAM_TEXT);
            $lastrestore = optional_param('lastrestoretest_date', '', PARAM_TEXT);
            $nextcheck = optional_param('nextcheck_date', '', PARAM_TEXT);
            pqdo_record_backup_check($workspaceid, $consumercontext, (int)$USER->id, [
                'checktype' => optional_param('checktype', 'readiness', PARAM_TEXT),
                'runbookurl' => optional_param('runbookurl', '', PARAM_URL),
                'evidencenote' => optional_param('evidencenote', '', PARAM_TEXT),
                'lastbackupat' => $lastbackup !== '' ? strtotime($lastbackup . ' 00:00:00') : 0,
                'lastrestoretestat' => $lastrestore !== '' ? strtotime($lastrestore . ' 00:00:00') : 0,
                'nextcheckat' => $nextcheck !== '' ? strtotime($nextcheck . ' 00:00:00') : time() + 86400 * 30,
            ]);
            $notice = 'Backup and disaster recovery check recorded.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

[$counts, $findings] = pqdo_backup_findings($workspaceid);
$ok = count(array_filter($findings, static fn($finding): bool => $finding['status'] === 'ok'));
$warnings = count($findings) - $ok;
$records = array_sum(array_filter($counts, static fn($count): bool => $count > 0));
$checks = array_values($DB->get_records('local_prequran_backup_check', ['workspaceid' => $workspaceid], 'timecreated DESC, id DESC', '*', 0, 80));

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/backup_dr_checks.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Backup And DR Checks');
$PAGE->set_heading('Backup And DR Checks');
$PAGE->add_body_class('pqdo-page');

echo $OUTPUT->header();
?>
<style>
body.pqdo-page header,body.pqdo-page footer,body.pqdo-page nav.navbar,body.pqdo-page #page-header,body.pqdo-page #page-footer,body.pqdo-page .drawer,body.pqdo-page .drawer-toggles,body.pqdo-page .block-region,body.pqdo-page [data-region="drawer"],body.pqdo-page [data-region="right-hand-drawer"]{display:none!important}
body.pqdo-page #page,body.pqdo-page #page-content,body.pqdo-page #region-main,body.pqdo-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqdo{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqdo-wrap{max-width:1280px;margin:0 auto}.pqdo-top,.pqdo-panel,.pqdo-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqdo-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqdo-title{margin:0;color:#221b22;font-size:30px;font-weight:950;line-height:1.08}.pqdo-muted{color:#5e7280;font-size:13px;font-weight:800;line-height:1.45}.pqdo-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqdo-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqdo-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqdo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqdo-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950}.pqdo-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqdo-grid{display:grid;grid-template-columns:390px 1fr;gap:14px}.pqdo-stack{display:grid;gap:14px}.pqdo-field{display:grid;gap:5px;margin-bottom:10px}.pqdo-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqdo-input,.pqdo-select,.pqdo-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqdo-input,.pqdo-select{padding:0 10px}.pqdo-textarea{min-height:94px;padding:10px}.pqdo-table{width:100%;border-collapse:separate;border-spacing:0}.pqdo-table th,.pqdo-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqdo-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqdo-name{display:block;color:#221b22;font-weight:950}.pqdo-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqdo-pill--ok{background:#edf9ef;color:#245c35}.pqdo-pill--warning{background:#fff4dc;color:#73501b}.pqdo-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqdo-alert--ok{background:#edf9ef;color:#245c35}.pqdo-alert--bad{background:#fff0ed;color:#883526}@media(max-width:920px){.pqdo-top,.pqdo-grid,.pqdo-metrics{grid-template-columns:1fr}.pqdo-actions{justify-content:flex-start}.pqdo-table thead{display:none}.pqdo-table tr,.pqdo-table td{display:block}.pqdo-table td:before{content:attr(data-label);display:block;color:#647887;font-size:11px;font-weight:950;text-transform:uppercase}}
</style>
<main class="pqdo"><div class="pqdo-wrap">
  <section class="pqdo-top"><div><h1 class="pqdo-title">Backup And DR Checks</h1><div class="pqdo-muted"><?php echo s((string)$workspace->name); ?> backup evidence, restore-test dates, disaster recovery findings, and recurring check history.</div></div><nav class="pqdo-actions"><a class="pqdo-btn pqdo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a><a class="pqdo-btn pqdo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/data_migration_tools.php', $urlparams))->out(false); ?>">Migration Tools</a><a class="pqdo-btn pqdo-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/bulk_import_export.php', $urlparams))->out(false); ?>">Bulk Tools</a></nav></section>
  <?php if ($notice !== ''): ?><div class="pqdo-alert pqdo-alert--ok"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="pqdo-alert pqdo-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqdo-metrics"><div class="pqdo-metric"><strong><?php echo (int)$ok; ?></strong><span>Passing checks</span></div><div class="pqdo-metric"><strong><?php echo (int)$warnings; ?></strong><span>Warnings</span></div><div class="pqdo-metric"><strong><?php echo (int)$records; ?></strong><span>Scoped records</span></div><div class="pqdo-metric"><strong><?php echo count($checks); ?></strong><span>Recorded checks</span></div></section>
  <div class="pqdo-grid">
    <section class="pqdo-panel">
      <h2 class="pqdo-title" style="font-size:21px">Record Check Evidence</h2>
      <form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="record_check">
        <div class="pqdo-field"><label>Check type</label><select class="pqdo-select" name="checktype"><option value="readiness">Readiness</option><option value="backup_evidence">Backup evidence</option><option value="restore_test">Restore test</option><option value="disaster_recovery">Disaster recovery</option></select></div>
        <div class="pqdo-field"><label>Last backup date</label><input class="pqdo-input" type="date" name="lastbackup_date"></div>
        <div class="pqdo-field"><label>Last restore test date</label><input class="pqdo-input" type="date" name="lastrestoretest_date"></div>
        <div class="pqdo-field"><label>Next check date</label><input class="pqdo-input" type="date" name="nextcheck_date"></div>
        <div class="pqdo-field"><label>Runbook URL</label><input class="pqdo-input" type="url" name="runbookurl" placeholder="https://..."></div>
        <div class="pqdo-field"><label>Evidence note</label><textarea class="pqdo-textarea" name="evidencenote" placeholder="Snapshot ID, storage location, restore-test outcome, owner approval."></textarea></div>
        <button class="pqdo-btn" type="submit">Record Check</button>
      </form>
    </section>
    <div class="pqdo-stack">
      <section class="pqdo-panel"><h2 class="pqdo-title" style="font-size:21px">Current Findings</h2><table class="pqdo-table"><thead><tr><th>Finding</th><th>Status</th><th>Summary</th></tr></thead><tbody><?php foreach ($findings as $finding): ?><tr><td data-label="Finding"><span class="pqdo-name"><?php echo s((string)$finding['key']); ?></span></td><td data-label="Status"><span class="pqdo-pill pqdo-pill--<?php echo s((string)$finding['status']); ?>"><?php echo s((string)$finding['status']); ?></span></td><td data-label="Summary"><?php echo s((string)$finding['summary']); ?></td></tr><?php endforeach; ?></tbody></table></section>
      <section class="pqdo-panel"><h2 class="pqdo-title" style="font-size:21px">Backup Scope</h2><table class="pqdo-table"><thead><tr><th>Dataset</th><th>Records</th></tr></thead><tbody><?php foreach ($counts as $table => $count): ?><tr><td data-label="Dataset"><span class="pqdo-name"><?php echo s($table); ?></span></td><td data-label="Records"><?php echo $count >= 0 ? (int)$count : 'Missing'; ?></td></tr><?php endforeach; ?></tbody></table></section>
      <section class="pqdo-panel">
        <h2 class="pqdo-title" style="font-size:21px">Check History</h2>
        <?php if (!$checks): ?><div class="pqdo-muted">No backup or disaster recovery checks recorded yet.</div><?php endif; ?>
        <?php if ($checks): ?>
          <table class="pqdo-table">
            <thead><tr><th>Check</th><th>Status</th><th>Backup</th><th>Restore Test</th><th>Next</th><th>Evidence</th></tr></thead>
            <tbody>
              <?php foreach ($checks as $check): ?>
                <tr>
                  <td data-label="Check"><span class="pqdo-name"><?php echo s((string)$check->checknumber); ?></span><span class="pqdo-muted"><?php echo s((string)$check->checktype); ?></span></td>
                  <td data-label="Status"><span class="pqdo-pill pqdo-pill--<?php echo s((string)$check->status); ?>"><?php echo s((string)$check->status); ?></span><span class="pqdo-pill"><?php echo s((string)$check->severity); ?></span></td>
                  <td data-label="Backup"><?php echo (int)$check->lastbackupat > 0 ? s(userdate((int)$check->lastbackupat, get_string('strftimedate'))) : 'Not recorded'; ?></td>
                  <td data-label="Restore Test"><?php echo (int)$check->lastrestoretestat > 0 ? s(userdate((int)$check->lastrestoretestat, get_string('strftimedate'))) : 'Not recorded'; ?></td>
                  <td data-label="Next"><?php echo (int)$check->nextcheckat > 0 ? s(userdate((int)$check->nextcheckat, get_string('strftimedate'))) : 'Not scheduled'; ?></td>
                  <td data-label="Evidence"><span class="pqdo-muted"><?php echo s((string)$check->evidencenote); ?></span><?php if ((string)$check->runbookurl !== ''): ?><br><a href="<?php echo s((string)$check->runbookurl); ?>">Runbook</a><?php endif; ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
    </div>
  </div>
</div></main>
<?php
echo $OUTPUT->footer();
