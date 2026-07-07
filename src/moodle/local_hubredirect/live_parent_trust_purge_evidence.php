<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once(__DIR__ . '/live_security.php');

if (!is_siteadmin($USER)) {
    pqh_live_security_deny(
        'Only site administrators can view parent trust purge evidence.',
        'purge_evidence_access_denied',
        'parent_trust_purge_evidence',
        0
    );
}

$id = optional_param('id', 0, PARAM_INT);
$format = optional_param('format', '', PARAM_ALPHA);
if ($id <= 0) {
    pqh_access_denied(
        'Choose a valid parent trust purge evidence record before opening this page.',
        new moodle_url('/local/hubredirect/live_parent_trust_retention.php'),
        'Parent trust purge evidence unavailable'
    );
}

function pqlptpe_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptpe_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlptpe_decode_details(string $json): array {
    $details = json_decode($json, true);
    return is_array($details) ? $details : [];
}

function pqlptpe_audit(string $action, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqlptpe_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'parent_trust_purge_evidence',
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlptpe_download_json(stdClass $record, array $details, array $evidence, string $exportreason): void {
    $payload = [
        'audit_id' => (int)$record->id,
        'audit_action' => (string)$record->action,
        'purge_logged_at' => (int)$record->timecreated,
        'purge_logged_at_readable' => userdate((int)$record->timecreated, get_string('strftimedatetimeshort')),
        'admin_userid' => (int)$record->actorid,
        'admin_name' => pqlptpe_user_name((int)$record->actorid, 'Admin ' . (int)$record->actorid),
        'retention_days' => (int)($details['retention_days'] ?? 0),
        'export_confirmed' => !empty($details['export_confirmed']),
        'approval_ok' => !empty($details['approval_ok']),
        'candidate_count' => (int)($details['candidate_count'] ?? $details['eligible_count'] ?? 0),
        'deleted_count' => (int)($details['deleted_count'] ?? 0),
        'export_reason' => $exportreason,
        'details' => $details,
        'evidence_snapshot' => $evidence,
    ];

    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="parent-trust-purge-evidence-' . (int)$record->id . '.json"');
    echo json_encode($payload, JSON_PRETTY_PRINT);
    exit;
}

function pqlptpe_download_csv(stdClass $record, array $details, array $evidence, string $exportreason): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="parent-trust-purge-evidence-' . (int)$record->id . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['section', 'key', 'value']);
    fputcsv($out, ['purge', 'audit_id', (int)$record->id]);
    fputcsv($out, ['purge', 'action', (string)$record->action]);
    fputcsv($out, ['purge', 'logged_at', userdate((int)$record->timecreated, get_string('strftimedatetimeshort'))]);
    fputcsv($out, ['purge', 'admin_userid', (int)$record->actorid]);
    fputcsv($out, ['purge', 'admin_name', pqlptpe_user_name((int)$record->actorid, 'Admin ' . (int)$record->actorid)]);
    fputcsv($out, ['purge', 'retention_days', (int)($details['retention_days'] ?? 0)]);
    fputcsv($out, ['purge', 'export_confirmed', !empty($details['export_confirmed']) ? 'yes' : 'no']);
    fputcsv($out, ['purge', 'approval_ok', !empty($details['approval_ok']) ? 'yes' : 'no']);
    fputcsv($out, ['purge', 'candidate_count', (int)($details['candidate_count'] ?? $details['eligible_count'] ?? 0)]);
    fputcsv($out, ['purge', 'deleted_count', (int)($details['deleted_count'] ?? 0)]);
    fputcsv($out, ['purge', 'export_reason', $exportreason]);
    fputcsv($out, ['snapshot', 'record_id_count', (int)($evidence['record_id_count'] ?? 0)]);
    fputcsv($out, ['snapshot', 'staff_count', (int)($evidence['staff_count'] ?? 0)]);
    fputcsv($out, ['snapshot', 'student_count', (int)($evidence['student_count'] ?? 0)]);
    fputcsv($out, ['snapshot', 'oldest_timecreated', !empty($evidence['oldest_timecreated']) ? userdate((int)$evidence['oldest_timecreated'], get_string('strftimedatetimeshort')) : '']);
    fputcsv($out, ['snapshot', 'newest_timecreated', !empty($evidence['newest_timecreated']) ? userdate((int)$evidence['newest_timecreated'], get_string('strftimedatetimeshort')) : '']);
    foreach (($evidence['action_counts'] ?? []) as $action => $count) {
        fputcsv($out, ['action_count', (string)$action, (int)$count]);
    }
    foreach (($evidence['reason_counts'] ?? []) as $reason => $count) {
        fputcsv($out, ['reason_count', (string)$reason, (int)$count]);
    }
    fputcsv($out, []);
    fputcsv($out, ['sample_id', 'action', 'actorid', 'targettype', 'targetid', 'timecreated', 'reason', 'case_status', 'support_case_id']);
    foreach (($evidence['sample_rows'] ?? []) as $sample) {
        fputcsv($out, [
            (int)($sample['id'] ?? 0),
            (string)($sample['action'] ?? ''),
            (int)($sample['actorid'] ?? 0),
            (string)($sample['targettype'] ?? ''),
            (int)($sample['targetid'] ?? 0),
            !empty($sample['timecreated']) ? userdate((int)$sample['timecreated'], get_string('strftimedatetimeshort')) : '',
            (string)($sample['reason'] ?? ''),
            (string)($sample['case_status'] ?? ''),
            (int)($sample['support_case_id'] ?? 0),
        ]);
    }
    fclose($out);
    exit;
}

if (!pqlptpe_table_exists('local_prequran_live_audit')) {
    pqh_access_denied(
        'The live audit table is not installed, so purge evidence is not available yet.',
        new moodle_url('/local/hubredirect/live_parent_trust_retention.php'),
        'Parent trust purge evidence unavailable'
    );
}

$record = $DB->get_record('local_prequran_live_audit', ['id' => $id], '*', IGNORE_MISSING);
if (!$record) {
    pqh_access_denied(
        'That parent trust purge evidence record is no longer available.',
        new moodle_url('/local/hubredirect/live_parent_trust_retention.php'),
        'Parent trust purge evidence unavailable'
    );
}
$allowedactions = [
    'parent_trust_purge_blocked',
    'parent_trust_purge_started',
    'parent_trust_purge_completed',
];
if (!in_array((string)$record->action, $allowedactions, true)) {
    pqh_live_security_deny(
        'This audit row is not a parent trust purge evidence record.',
        'purge_evidence_invalid_record_denied',
        'audit',
        (int)$record->id,
        ['source_action' => (string)$record->action]
    );
}

$details = pqlptpe_decode_details((string)$record->details);
$evidence = isset($details['evidence_snapshot']) && is_array($details['evidence_snapshot']) ? $details['evidence_snapshot'] : [];

if ($format === 'json' || $format === 'csv') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the purge evidence page and try the export again.',
            new moodle_url('/local/hubredirect/live_parent_trust_purge_evidence.php', ['id' => (int)$record->id]),
            'Parent trust purge evidence export expired'
        );
    }
    $exportreason = pqh_live_security_clean_export_reason(optional_param('export_reason', '', PARAM_TEXT));
    if ($exportreason === '') {
        redirect(new moodle_url('/local/hubredirect/live_parent_trust_purge_evidence.php', [
            'id' => (int)$record->id,
            'export' => 'reason_required',
        ]));
    }
    pqlptpe_audit('parent_trust_purge_evidence_exported', (int)$record->id, [
        'source_audit_id' => (int)$record->id,
        'source_action' => (string)$record->action,
        'format' => $format,
        'export_reason' => $exportreason,
        'record_id_count' => (int)($evidence['record_id_count'] ?? 0),
    ]);
    if ($format === 'json') {
        pqlptpe_download_json($record, $details, $evidence, $exportreason);
    }
    pqlptpe_download_csv($record, $details, $evidence, $exportreason);
}

pqlptpe_audit('parent_trust_purge_evidence_viewed', (int)$record->id, [
    'source_audit_id' => (int)$record->id,
    'source_action' => (string)$record->action,
    'record_id_count' => (int)($evidence['record_id_count'] ?? 0),
]);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_parent_trust_purge_evidence.php', ['id' => $id]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Trust Purge Evidence');
$PAGE->set_heading('Parent Trust Purge Evidence');
$PAGE->add_body_class('pqh-parent-trust-purge-evidence-page');

$sampleids = $evidence['sample_ids'] ?? ($details['sample_ids'] ?? []);
$sampleids = is_array($sampleids) ? array_map('intval', $sampleids) : [];
$recordids = $evidence['record_ids'] ?? [];
$recordids = is_array($recordids) ? array_map('intval', $recordids) : [];
$oldest = (int)($evidence['oldest_timecreated'] ?? 0);
$newest = (int)($evidence['newest_timecreated'] ?? 0);
$candidatecount = (int)($details['candidate_count'] ?? $details['eligible_count'] ?? 0);
$deletedcount = (int)($details['deleted_count'] ?? 0);
$blockreasons = $details['block_reasons'] ?? [];
$blockreasons = is_array($blockreasons) ? $blockreasons : [];
$accesshistory = array_values($DB->get_records_sql(
    "SELECT id, actorid, action, details, timecreated
       FROM {local_prequran_live_audit}
      WHERE targettype = :targettype
        AND targetid = :targetid
        AND action IN ('parent_trust_purge_evidence_viewed', 'parent_trust_purge_evidence_exported')
   ORDER BY timecreated DESC, id DESC",
    [
        'targettype' => 'parent_trust_purge_evidence',
        'targetid' => (int)$record->id,
    ],
    0,
    50
));

echo $OUTPUT->header();
?>
<style>
body.pqh-parent-trust-purge-evidence-page header,
body.pqh-parent-trust-purge-evidence-page footer,
body.pqh-parent-trust-purge-evidence-page nav.navbar,
body.pqh-parent-trust-purge-evidence-page #page-header,
body.pqh-parent-trust-purge-evidence-page #page-footer,
body.pqh-parent-trust-purge-evidence-page .drawer,
body.pqh-parent-trust-purge-evidence-page .drawer-toggles,
body.pqh-parent-trust-purge-evidence-page .block-region,
body.pqh-parent-trust-purge-evidence-page [data-region="drawer"],
body.pqh-parent-trust-purge-evidence-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-parent-trust-purge-evidence-page #page,
body.pqh-parent-trust-purge-evidence-page #page-content,
body.pqh-parent-trust-purge-evidence-page #region-main,
body.pqh-parent-trust-purge-evidence-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlptpe-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlptpe-wrap{max-width:1180px;margin:0 auto}
.pqlptpe-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:22px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlptpe-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}
.pqlptpe-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqlptpe-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
.pqlptpe-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlptpe-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlptpe-input{min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font-size:13px;font-weight:800}
.pqlptpe-form{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
.pqlptpe-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06);margin-bottom:16px}
.pqlptpe-panel h2{margin:0 0 13px;font-size:20px;font-weight:950;color:#241b24}
.pqlptpe-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlptpe-metric{padding:15px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlptpe-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlptpe-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlptpe-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlptpe-table th,.pqlptpe-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlptpe-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqlptpe-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlptpe-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlptpe-pill--bad{background:#fff0ed;color:#883526}
.pqlptpe-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqlptpe-note{padding:13px;border-radius:10px;background:#fff8e9;border:1px solid rgba(123,82,48,.16);color:#5f452b;font-size:13px;font-weight:850;margin-bottom:14px}
.pqlptpe-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:980px){.pqlptpe-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlptpe-grid{grid-template-columns:1fr}.pqlptpe-top{display:block}.pqlptpe-actions{margin-top:12px}.pqlptpe-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlptpe-metrics{grid-template-columns:1fr}.pqlptpe-title{font-size:24px}.pqlptpe-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlptpe-shell">
  <div class="pqlptpe-wrap">
    <section class="pqlptpe-top pqh-workspace-top">
      <div>
        <h1 class="pqlptpe-title pqh-workspace-title">Parent Trust Purge Evidence</h1>
        <p class="pqlptpe-sub pqh-workspace-sub">Recovery snapshot for audit row #<?php echo (int)$record->id; ?>, logged <?php echo userdate((int)$record->timecreated, get_string('strftimedatetimeshort')); ?>.</p>
      </div>
      <div class="pqlptpe-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlptpe-btn pqlptpe-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
        <a class="pqlptpe-btn pqlptpe-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_retention.php'))->out(false); ?>">Retention</a>
        <a class="pqlptpe-btn pqlptpe-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_audit.php'))->out(false); ?>">Audit page</a>
      </div>
    </section>

    <?php if (optional_param('export', '', PARAM_ALPHANUMEXT) === 'reason_required'): ?>
      <div class="pqlptpe-note">Export was not started. Enter a compliance reason before downloading purge evidence.</div>
    <?php endif; ?>

    <?php if (!$evidence): ?>
      <div class="pqlptpe-note">This purge audit row has no evidence snapshot. Blocked purge attempts may only contain safeguard details.</div>
    <?php endif; ?>

    <section class="pqlptpe-panel">
      <h2>Evidence Export Controls</h2>
      <div class="pqlptpe-note">Exports include recovery evidence for deleted support-audit rows. A reason is required and every download is written to the audit trail.</div>
      <form class="pqlptpe-form" method="post" action="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_purge_evidence.php'))->out(false); ?>">
        <input type="hidden" name="id" value="<?php echo (int)$record->id; ?>">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input class="pqlptpe-input" type="text" name="export_reason" size="48" maxlength="255" placeholder="Export reason, case number, or reviewer request" required>
        <button class="pqlptpe-btn pqlptpe-btn--light" type="submit" name="format" value="csv">Export CSV</button>
        <button class="pqlptpe-btn" type="submit" name="format" value="json">Export JSON</button>
      </form>
    </section>

    <section class="pqlptpe-metrics" aria-label="Purge evidence metrics">
      <div class="pqlptpe-metric"><strong><?php echo (int)($evidence['record_id_count'] ?? 0); ?></strong><span>snapshot records</span></div>
      <div class="pqlptpe-metric"><strong><?php echo $deletedcount; ?></strong><span>deleted count</span></div>
      <div class="pqlptpe-metric"><strong><?php echo (int)($evidence['staff_count'] ?? 0); ?></strong><span>staff involved</span></div>
      <div class="pqlptpe-metric"><strong><?php echo (int)($evidence['student_count'] ?? 0); ?></strong><span>students involved</span></div>
      <div class="pqlptpe-metric"><strong><?php echo (int)($details['retention_days'] ?? 0); ?></strong><span>retention days</span></div>
    </section>

    <section class="pqlptpe-panel">
      <h2>Purge Run Summary</h2>
      <table class="pqlptpe-table">
        <tr><th>Item</th><th>Value</th></tr>
        <tr><td>Event</td><td><span class="pqlptpe-pill <?php echo (string)$record->action === 'parent_trust_purge_blocked' ? 'pqlptpe-pill--bad' : ((string)$record->action === 'parent_trust_purge_started' ? 'pqlptpe-pill--warn' : ''); ?>"><?php echo s(str_replace('_', ' ', (string)$record->action)); ?></span></td></tr>
        <tr><td>Admin</td><td><?php echo s(pqlptpe_user_name((int)$record->actorid, 'Admin ' . (int)$record->actorid)); ?> <span class="pqlptpe-code">#<?php echo (int)$record->actorid; ?></span></td></tr>
        <tr><td>Cutoff</td><td><?php echo !empty($details['cutoff']) ? s(userdate((int)$details['cutoff'], get_string('strftimedatetimeshort'))) : 'Not recorded'; ?></td></tr>
        <tr><td>Export confirmed</td><td><?php echo !empty($details['export_confirmed']) ? 'Yes' : 'No'; ?></td></tr>
        <tr><td>Approval OK</td><td><?php echo !empty($details['approval_ok']) ? 'Yes' : 'No'; ?></td></tr>
        <tr><td>Candidate / Deleted</td><td><?php echo $candidatecount; ?> / <?php echo $deletedcount; ?></td></tr>
        <tr><td>Blocked reasons</td><td><?php echo $blockreasons ? s(implode(', ', $blockreasons)) : 'None'; ?></td></tr>
        <tr><td>Sample IDs</td><td class="pqlptpe-code"><?php echo $sampleids ? s(implode(', ', $sampleids)) : 'None'; ?></td></tr>
        <tr><td>Oldest / newest deleted event</td><td><?php echo $oldest > 0 ? s(userdate($oldest, get_string('strftimedatetimeshort'))) : 'n/a'; ?> - <?php echo $newest > 0 ? s(userdate($newest, get_string('strftimedatetimeshort'))) : 'n/a'; ?></td></tr>
      </table>
    </section>

    <section class="pqlptpe-grid">
      <article class="pqlptpe-panel">
        <h2>Action Counts</h2>
        <table class="pqlptpe-table">
          <tr><th>Action</th><th>Count</th></tr>
          <?php foreach (($evidence['action_counts'] ?? []) as $action => $count): ?>
            <tr><td><?php echo s(str_replace('_', ' ', (string)$action)); ?></td><td><?php echo (int)$count; ?></td></tr>
          <?php endforeach; ?>
          <?php if (empty($evidence['action_counts'])): ?><tr><td colspan="2">No action counts recorded.</td></tr><?php endif; ?>
        </table>
      </article>
      <article class="pqlptpe-panel">
        <h2>Reason Counts</h2>
        <table class="pqlptpe-table">
          <tr><th>Reason</th><th>Count</th></tr>
          <?php foreach (($evidence['reason_counts'] ?? []) as $reason => $count): ?>
            <tr><td><?php echo s((string)$reason); ?></td><td><?php echo (int)$count; ?></td></tr>
          <?php endforeach; ?>
          <?php if (empty($evidence['reason_counts'])): ?><tr><td colspan="2">No reason counts recorded.</td></tr><?php endif; ?>
        </table>
      </article>
    </section>

    <section class="pqlptpe-panel">
      <h2>Sample Rows</h2>
      <table class="pqlptpe-table">
        <tr><th>ID</th><th>Action</th><th>Staff</th><th>Target</th><th>Time</th><th>Reason</th></tr>
        <?php foreach (($evidence['sample_rows'] ?? []) as $sample): ?>
          <tr>
            <td class="pqlptpe-code">#<?php echo (int)($sample['id'] ?? 0); ?></td>
            <td><?php echo s(str_replace('_', ' ', (string)($sample['action'] ?? ''))); ?></td>
            <td class="pqlptpe-code">#<?php echo (int)($sample['actorid'] ?? 0); ?></td>
            <td class="pqlptpe-code"><?php echo s((string)($sample['targettype'] ?? '')); ?> #<?php echo (int)($sample['targetid'] ?? 0); ?></td>
            <td><?php echo !empty($sample['timecreated']) ? s(userdate((int)$sample['timecreated'], get_string('strftimedatetimeshort'))) : ''; ?></td>
            <td><?php echo s((string)($sample['reason'] ?? '')); ?></td>
          </tr>
        <?php endforeach; ?>
        <?php if (empty($evidence['sample_rows'])): ?><tr><td colspan="6">No sample rows recorded.</td></tr><?php endif; ?>
      </table>
    </section>

    <section class="pqlptpe-panel">
      <h2>Access &amp; Export Audit Review</h2>
      <table class="pqlptpe-table">
        <tr><th>Time</th><th>Admin</th><th>Action</th><th>Reason / Details</th></tr>
        <?php foreach ($accesshistory as $history): ?>
          <?php $historydetails = pqlptpe_decode_details((string)$history->details); ?>
          <tr>
            <td><?php echo userdate((int)$history->timecreated, get_string('strftimedatetimeshort')); ?><br><span class="pqlptpe-code">#<?php echo (int)$history->id; ?></span></td>
            <td><?php echo s(pqlptpe_user_name((int)$history->actorid, 'Admin ' . (int)$history->actorid)); ?><br><span class="pqlptpe-code">#<?php echo (int)$history->actorid; ?></span></td>
            <td><span class="pqlptpe-pill <?php echo (string)$history->action === 'parent_trust_purge_evidence_exported' ? 'pqlptpe-pill--warn' : ''; ?>"><?php echo s(str_replace('_', ' ', (string)$history->action)); ?></span></td>
            <td class="pqlptpe-code">
              <?php if ((string)$history->action === 'parent_trust_purge_evidence_exported'): ?>
                format: <?php echo s((string)($historydetails['format'] ?? '')); ?>;
                reason: <?php echo s((string)($historydetails['export_reason'] ?? 'Not recorded')); ?>
              <?php else: ?>
                records: <?php echo (int)($historydetails['record_id_count'] ?? 0); ?>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$accesshistory): ?><tr><td colspan="4">No evidence access has been logged yet.</td></tr><?php endif; ?>
      </table>
    </section>

    <section class="pqlptpe-panel">
      <h2>Record IDs</h2>
      <p class="pqlptpe-code"><?php echo $recordids ? s(implode(', ', $recordids)) : 'No full ID list recorded.'; ?></p>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
