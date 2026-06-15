<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can review parent trust retention readiness.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_parent_trust_retention.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Trust Retention Readiness');
$PAGE->set_heading('Parent Trust Retention Readiness');
$PAGE->add_body_class('pqh-parent-trust-retention-page');

function pqlptr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptr_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlptr_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlptr_age_label(int $timecreated): string {
    $age = time() - $timecreated;
    if ($age <= 30 * DAYSECS) {
        return '0-30 days';
    }
    if ($age <= 90 * DAYSECS) {
        return '31-90 days';
    }
    if ($age <= 180 * DAYSECS) {
        return '91-180 days';
    }
    return '180+ days';
}

function pqlptr_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlptr_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlptr_latest_policy_event(): ?stdClass {
    global $DB;
    if (!pqlptr_table_exists('local_prequran_live_audit')) {
        return null;
    }
    $actions = [
        'parent_trust_purge_review_requested',
        'parent_trust_purge_review_approved',
        'parent_trust_purge_review_rejected',
    ];
    [$insql, $params] = $DB->get_in_or_equal($actions, SQL_PARAMS_NAMED, 'policy');
    $records = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        1
    );
    return $records ? reset($records) : null;
}

function pqlptr_purge_evidence_snapshot(array $rows): array {
    $ids = [];
    $actioncounts = [];
    $reasoncounts = [];
    $staffids = [];
    $studentids = [];
    $oldest = 0;
    $newest = 0;
    $samples = [];

    foreach ($rows as $row) {
        $id = (int)$row->id;
        $timecreated = (int)$row->timecreated;
        $action = (string)$row->action;
        $actorid = (int)$row->actorid;
        $targetid = (int)$row->targetid;
        $details = json_decode((string)$row->details, true);
        $details = is_array($details) ? $details : [];
        $reason = (string)($details['support_reason_label'] ?? $details['support_reason'] ?? 'Not recorded');

        $ids[] = $id;
        $actioncounts[$action] = ($actioncounts[$action] ?? 0) + 1;
        $reasoncounts[$reason] = ($reasoncounts[$reason] ?? 0) + 1;
        if ($actorid > 0) {
            $staffids[$actorid] = true;
        }
        if ($targetid > 0) {
            $studentids[$targetid] = true;
        }
        if ($oldest === 0 || $timecreated < $oldest) {
            $oldest = $timecreated;
        }
        if ($newest === 0 || $timecreated > $newest) {
            $newest = $timecreated;
        }
        if (count($samples) < 20) {
            $samples[] = [
                'id' => $id,
                'action' => $action,
                'actorid' => $actorid,
                'targettype' => (string)$row->targettype,
                'targetid' => $targetid,
                'timecreated' => $timecreated,
                'reason' => $reason,
                'case_status' => (string)($details['case_status'] ?? ''),
                'support_case_id' => (int)($details['support_case_id'] ?? 0),
            ];
        }
    }

    return [
        'record_ids' => $ids,
        'record_id_count' => count($ids),
        'sample_ids' => array_slice($ids, 0, 20),
        'oldest_timecreated' => $oldest,
        'newest_timecreated' => $newest,
        'action_counts' => $actioncounts,
        'reason_counts' => $reasoncounts,
        'staff_count' => count($staffids),
        'student_count' => count($studentids),
        'sample_rows' => $samples,
    ];
}

function pqlptr_decode_details(string $json): array {
    $details = json_decode($json, true);
    return is_array($details) ? $details : [];
}

$configuredretention = (int)get_config('local_prequran', 'parent_trust_retention_days');
if ($configuredretention <= 0) {
    $configuredretention = 365;
}
$requires_export = (int)get_config('local_prequran', 'parent_trust_purge_requires_export') !== 0;
$approval_required = (int)get_config('local_prequran', 'parent_trust_purge_approval_required') !== 0;
$retentiondays = optional_param('retentiondays', $configuredretention, PARAM_INT);
if (!in_array($retentiondays, [180, 365, 730], true)) {
    $retentiondays = $configuredretention;
    if (!in_array($retentiondays, [180, 365, 730], true)) {
        $retentiondays = 365;
    }
}
$purgeactions = [
    'parent_trust_preview_opened',
    'parent_trust_support_case_logged',
    'parent_trust_support_case_resolved',
];
$cutoff = time() - ($retentiondays * DAYSECS);

if (data_submitted()) {
    global $DB;
    require_sesskey();
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    $note = optional_param('review_note', '', PARAM_TEXT);
    $details = [
        'retention_days' => $retentiondays,
        'configured_retention_days' => $configuredretention,
        'requires_export' => $requires_export,
        'approval_required' => $approval_required,
        'review_note' => $note,
        'source' => 'parent_trust_retention_page',
    ];
    if ($action === 'request_purge_review') {
        pqlptr_audit(0, 'parent_trust_purge_review_requested', 'parent_trust_retention', 0, $details);
        redirect(new moodle_url('/local/hubredirect/live_parent_trust_retention.php', ['retentiondays' => $retentiondays, 'workflow' => 'requested']));
    }
    if ($action === 'approve_purge_review') {
        pqlptr_audit(0, 'parent_trust_purge_review_approved', 'parent_trust_retention', 0, $details);
        redirect(new moodle_url('/local/hubredirect/live_parent_trust_retention.php', ['retentiondays' => $retentiondays, 'workflow' => 'approved']));
    }
    if ($action === 'reject_purge_review') {
        pqlptr_audit(0, 'parent_trust_purge_review_rejected', 'parent_trust_retention', 0, $details);
        redirect(new moodle_url('/local/hubredirect/live_parent_trust_retention.php', ['retentiondays' => $retentiondays, 'workflow' => 'rejected']));
    }
    if ($action === 'execute_parent_trust_purge') {
        $exportconfirmed = optional_param('export_confirmed', 0, PARAM_INT) === 1;
        $confirmphrase = optional_param('confirm_phrase', '', PARAM_TEXT);
        $latestpolicyforpurge = pqlptr_latest_policy_event();
        $approvalok = !$approval_required || ($latestpolicyforpurge && (string)$latestpolicyforpurge->action === 'parent_trust_purge_review_approved');
        $exportok = !$requires_export || $exportconfirmed;
        $phraseok = trim($confirmphrase) === 'PURGE PARENT TRUST AUDIT';
        $blockreasons = [];
        if (!pqlptr_table_exists('local_prequran_live_audit')) {
            $blockreasons[] = 'audit_table_missing';
        }
        if (!$exportok) {
            $blockreasons[] = 'export_confirmation_required';
        }
        if (!$approvalok) {
            $blockreasons[] = 'approval_required';
        }
        if (!$phraseok) {
            $blockreasons[] = 'confirmation_phrase_missing';
        }
        [$purgeinsql, $purgeinparams] = $DB->get_in_or_equal($purgeactions, SQL_PARAMS_NAMED, 'purgeact');
        $purgeparams = $purgeinparams + ['cutoff' => $cutoff];
        $eligiblecount = pqlptr_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_audit}
              WHERE action {$purgeinsql}
                AND timecreated < :cutoff",
            $purgeparams
        );
        if ($eligiblecount <= 0) {
            $blockreasons[] = 'no_eligible_records';
        }
        $purgedetails = $details + [
            'eligible_count' => $eligiblecount,
            'purge_limit' => 500,
            'cutoff' => $cutoff,
            'export_confirmed' => $exportconfirmed,
            'approval_ok' => $approvalok,
            'target_actions' => $purgeactions,
        ];
        if ($blockreasons) {
            pqlptr_audit(0, 'parent_trust_purge_blocked', 'parent_trust_retention', 0, $purgedetails + ['block_reasons' => $blockreasons]);
            redirect(new moodle_url('/local/hubredirect/live_parent_trust_retention.php', ['retentiondays' => $retentiondays, 'purge' => 'blocked']));
        }

        $candidates = array_values($DB->get_records_sql(
            "SELECT id, action, actorid, targetid, targettype, details, timecreated
               FROM {local_prequran_live_audit}
              WHERE action {$purgeinsql}
                AND timecreated < :cutoff
           ORDER BY timecreated ASC, id ASC",
            $purgeparams,
            0,
            500
        ));
        $ids = array_map(static function($row): int {
            return (int)$row->id;
        }, $candidates);
        $evidence = pqlptr_purge_evidence_snapshot($candidates);
        pqlptr_audit(0, 'parent_trust_purge_started', 'parent_trust_retention', 0, $purgedetails + [
            'candidate_count' => count($ids),
            'sample_ids' => $evidence['sample_ids'],
            'evidence_snapshot' => $evidence,
        ]);
        if ($ids) {
            $DB->delete_records_list('local_prequran_live_audit', 'id', $ids);
        }
        pqlptr_audit(0, 'parent_trust_purge_completed', 'parent_trust_retention', 0, $purgedetails + [
            'deleted_count' => count($ids),
            'sample_ids' => $evidence['sample_ids'],
            'evidence_snapshot' => $evidence,
        ]);
        redirect(new moodle_url('/local/hubredirect/live_parent_trust_retention.php', ['retentiondays' => $retentiondays, 'purge' => 'completed', 'deleted' => count($ids)]));
    }
}

$actions = $purgeactions;
$ready = pqlptr_table_exists('local_prequran_live_audit');
$buckets = [
    '0-30 days' => 0,
    '31-90 days' => 0,
    '91-180 days' => 0,
    '180+ days' => 0,
];
$metrics = [
    'total' => 0,
    'eligible' => 0,
    'staff' => 0,
    'students' => 0,
    'oldest' => 0,
];
$eligible = [];
$reasoncounts = [];
$actioncounts = [];
$latestpolicy = pqlptr_latest_policy_event();
$purgehistory = [];

if ($ready) {
    [$insql, $inparams] = $DB->get_in_or_equal($actions, SQL_PARAMS_NAMED, 'act');
    $baseparams = $inparams;
    $metrics['total'] = pqlptr_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}",
        $baseparams
    );
    $metrics['eligible'] = pqlptr_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
            AND timecreated < :cutoff",
        $baseparams + ['cutoff' => $cutoff]
    );
    $metrics['staff'] = pqlptr_count_sql(
        "SELECT COUNT(DISTINCT actorid)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}",
        $baseparams
    );
    $metrics['students'] = pqlptr_count_sql(
        "SELECT COUNT(DISTINCT targetid)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
            AND targettype = :targettype",
        $baseparams + ['targettype' => 'student']
    );
    $metrics['oldest'] = (int)$DB->get_field_sql(
        "SELECT MIN(timecreated)
           FROM {local_prequran_live_audit}
          WHERE action {$insql}",
        $baseparams
    );

    $rows = $DB->get_records_sql(
        "SELECT id, action, actorid, targetid, targettype, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
       ORDER BY timecreated DESC, id DESC",
        $baseparams
    );
    foreach ($rows as $row) {
        $label = pqlptr_age_label((int)$row->timecreated);
        $buckets[$label]++;
        $actioncounts[(string)$row->action] = ($actioncounts[(string)$row->action] ?? 0) + 1;
        $details = json_decode((string)$row->details, true);
        $details = is_array($details) ? $details : [];
        $reason = (string)($details['support_reason_label'] ?? $details['support_reason'] ?? 'Not recorded');
        $reasoncounts[$reason] = ($reasoncounts[$reason] ?? 0) + 1;
    }

    $eligible = array_values($DB->get_records_sql(
        "SELECT id, action, actorid, targetid, targettype, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
            AND timecreated < :cutoff
       ORDER BY timecreated ASC, id ASC",
        $baseparams + ['cutoff' => $cutoff],
        0,
        100
    ));

    $purgehistory = array_values($DB->get_records_sql(
        "SELECT id, action, actorid, targettype, targetid, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE action IN ('parent_trust_purge_blocked', 'parent_trust_purge_started', 'parent_trust_purge_completed')
       ORDER BY timecreated DESC, id DESC",
        [],
        0,
        30
    ));
}

$reviewparams = [
    'from' => $metrics['oldest'] > 0 ? userdate((int)$metrics['oldest'], '%Y-%m-%d') : userdate(time() - (365 * DAYSECS), '%Y-%m-%d'),
    'to' => userdate(time(), '%Y-%m-%d'),
];

echo $OUTPUT->header();
?>
<style>
body.pqh-parent-trust-retention-page header,
body.pqh-parent-trust-retention-page footer,
body.pqh-parent-trust-retention-page nav.navbar,
body.pqh-parent-trust-retention-page #page-header,
body.pqh-parent-trust-retention-page #page-footer,
body.pqh-parent-trust-retention-page .drawer,
body.pqh-parent-trust-retention-page .drawer-toggles,
body.pqh-parent-trust-retention-page .block-region,
body.pqh-parent-trust-retention-page [data-region="drawer"],
body.pqh-parent-trust-retention-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-parent-trust-retention-page #page,
body.pqh-parent-trust-retention-page #page-content,
body.pqh-parent-trust-retention-page #region-main,
body.pqh-parent-trust-retention-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlptr-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlptr-wrap{max-width:1180px;margin:0 auto}
.pqlptr-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:22px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlptr-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}
.pqlptr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqlptr-actions,.pqlptr-form{display:flex;flex-wrap:wrap;gap:9px;align-items:end}
.pqlptr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlptr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlptr-btn--danger{background:#9b3326;color:#fff!important}
.pqlptr-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06);margin-bottom:16px}
.pqlptr-panel h2{margin:0 0 13px;font-size:20px;font-weight:950;color:#241b24}
.pqlptr-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlptr-metric{padding:15px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlptr-metric strong{display:block;font-size:26px;font-weight:950;color:#6f4e32}
.pqlptr-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlptr-field{display:grid;gap:5px}
.pqlptr-field label{font-size:12px;font-weight:950;color:#415665}
.pqlptr-input{min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font-size:13px;font-weight:800}
.pqlptr-textarea{width:100%;box-sizing:border-box;min-height:76px;padding:9px 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font-size:13px;font-weight:800;resize:vertical}
.pqlptr-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlptr-table th,.pqlptr-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlptr-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqlptr-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlptr-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlptr-pill--bad{background:#fff0ed;color:#883526}
.pqlptr-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlptr-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqlptr-note{padding:13px;border-radius:10px;background:#fff8e9;border:1px solid rgba(123,82,48,.16);color:#5f452b;font-size:13px;font-weight:850;margin-bottom:14px}
.pqlptr-note--ok{background:#f6fff8;border-color:rgba(47,125,79,.18);color:#315b3f}
.pqlptr-note--bad{background:#fff0ed;border-color:rgba(136,53,38,.22);color:#883526}
.pqlptr-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:980px){.pqlptr-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlptr-grid{grid-template-columns:1fr}.pqlptr-top{display:block}.pqlptr-actions{margin-top:12px}.pqlptr-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlptr-metrics{grid-template-columns:1fr}.pqlptr-title{font-size:24px}.pqlptr-form{display:grid}.pqlptr-btn{width:100%}}
</style>
<main class="pqlptr-shell">
  <div class="pqlptr-wrap">
    <section class="pqlptr-top">
      <div>
        <h1 class="pqlptr-title">Parent Trust Retention Readiness</h1>
        <p class="pqlptr-sub">Dry-run, approval, guarded purge, and recovery evidence for parent trust support audit retention.</p>
      </div>
      <div class="pqlptr-actions">
        <a class="pqlptr-btn pqlptr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
        <a class="pqlptr-btn pqlptr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_review_pack.php', $reviewparams))->out(false); ?>">Export review pack first</a>
        <a class="pqlptr-btn pqlptr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_audit.php'))->out(false); ?>">Audit page</a>
        <a class="pqlptr-btn pqlptr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Admin ops</a>
        <a class="pqlptr-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlptr-empty">The live audit table is not installed yet.</div>
    <?php else: ?>
      <?php if (optional_param('workflow', '', PARAM_ALPHANUMEXT) !== ''): ?>
        <div class="pqlptr-note pqlptr-note--ok">Retention approval workflow updated: <?php echo s(optional_param('workflow', '', PARAM_ALPHANUMEXT)); ?>.</div>
      <?php endif; ?>
      <?php if (optional_param('purge', '', PARAM_ALPHANUMEXT) === 'blocked'): ?>
        <div class="pqlptr-note pqlptr-note--bad">Purge was blocked. Check export confirmation, approval status, confirmation phrase, and eligible record count.</div>
      <?php endif; ?>
      <?php if (optional_param('purge', '', PARAM_ALPHANUMEXT) === 'completed'): ?>
        <div class="pqlptr-note pqlptr-note--ok">Purge completed. Deleted <?php echo (int)optional_param('deleted', 0, PARAM_INT); ?> parent trust support audit records.</div>
      <?php endif; ?>
      <section class="pqlptr-panel">
        <form class="pqlptr-form" method="get">
          <div class="pqlptr-field">
            <label for="retentiondays">Retention policy</label>
            <select id="retentiondays" class="pqlptr-input" name="retentiondays">
              <option value="180" <?php echo $retentiondays === 180 ? 'selected' : ''; ?>>180 days</option>
              <option value="365" <?php echo $retentiondays === 365 ? 'selected' : ''; ?>>365 days recommended</option>
              <option value="730" <?php echo $retentiondays === 730 ? 'selected' : ''; ?>>730 days</option>
            </select>
          </div>
          <button class="pqlptr-btn" type="submit">Run dry-run</button>
        </form>
      </section>

      <section class="pqlptr-panel">
        <h2>Configured Policy &amp; Approval Readiness</h2>
        <table class="pqlptr-table">
          <tr><th>Policy Item</th><th>Status</th></tr>
          <tr><td>Configured retention days</td><td><span class="pqlptr-pill"><?php echo (int)$configuredretention; ?> days</span></td></tr>
          <tr><td>Current dry-run policy</td><td><span class="pqlptr-pill <?php echo $retentiondays !== $configuredretention ? 'pqlptr-pill--warn' : ''; ?>"><?php echo (int)$retentiondays; ?> days<?php echo $retentiondays !== $configuredretention ? ' comparison only' : ''; ?></span></td></tr>
          <tr><td>Export required before purge</td><td><span class="pqlptr-pill <?php echo $requires_export ? 'pqlptr-pill--warn' : ''; ?>"><?php echo $requires_export ? 'required' : 'not required'; ?></span></td></tr>
          <tr><td>Approval required before purge</td><td><span class="pqlptr-pill <?php echo $approval_required ? 'pqlptr-pill--warn' : ''; ?>"><?php echo $approval_required ? 'required' : 'not required'; ?></span></td></tr>
          <tr>
            <td>Last workflow decision</td>
            <td>
              <?php if ($latestpolicy): ?>
                <span class="pqlptr-pill <?php echo (string)$latestpolicy->action === 'parent_trust_purge_review_approved' ? '' : ((string)$latestpolicy->action === 'parent_trust_purge_review_rejected' ? 'pqlptr-pill--bad' : 'pqlptr-pill--warn'); ?>"><?php echo s(str_replace('_', ' ', (string)$latestpolicy->action)); ?></span>
                <br><span class="pqlptr-code"><?php echo userdate((int)$latestpolicy->timecreated, get_string('strftimedatetimeshort')); ?> by <?php echo s(pqlptr_user_name((int)$latestpolicy->actorid, 'Admin ' . (int)$latestpolicy->actorid)); ?></span>
              <?php else: ?>
                <span class="pqlptr-pill pqlptr-pill--warn">no workflow decision yet</span>
              <?php endif; ?>
            </td>
          </tr>
        </table>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="retentiondays" value="<?php echo (int)$retentiondays; ?>">
          <div class="pqlptr-field" style="margin-bottom:10px">
            <label for="review_note">Review note</label>
            <textarea id="review_note" class="pqlptr-textarea" name="review_note" placeholder="Reason, export reference, or approval/rejection note"></textarea>
          </div>
          <div class="pqlptr-actions">
            <button class="pqlptr-btn pqlptr-btn--light" type="submit" name="action" value="request_purge_review">Request purge review</button>
            <button class="pqlptr-btn" type="submit" name="action" value="approve_purge_review">Approve readiness</button>
            <button class="pqlptr-btn pqlptr-btn--light" type="submit" name="action" value="reject_purge_review">Reject with note</button>
          </div>
        </form>
      </section>

      <section class="pqlptr-panel">
        <h2>Purge Execution Safeguards</h2>
        <div class="pqlptr-note">This is the only section that can delete records. It deletes a maximum of 500 records per run and only the parent trust support audit actions listed below. Broader live-session audit rows are never targeted here.</div>
        <table class="pqlptr-table">
          <tr><th>Safeguard</th><th>Status</th></tr>
          <tr><td>Eligible records for selected policy</td><td><span class="pqlptr-pill <?php echo (int)$metrics['eligible'] > 0 ? 'pqlptr-pill--warn' : ''; ?>"><?php echo (int)$metrics['eligible']; ?></span></td></tr>
          <tr><td>Export confirmation</td><td><span class="pqlptr-pill <?php echo $requires_export ? 'pqlptr-pill--warn' : ''; ?>"><?php echo $requires_export ? 'required before purge' : 'not required by setting'; ?></span></td></tr>
          <tr><td>Approval status</td><td><span class="pqlptr-pill <?php echo $approval_required && (!$latestpolicy || (string)$latestpolicy->action !== 'parent_trust_purge_review_approved') ? 'pqlptr-pill--bad' : ''; ?>"><?php echo !$approval_required ? 'approval not required' : (($latestpolicy && (string)$latestpolicy->action === 'parent_trust_purge_review_approved') ? 'approved' : 'not approved'); ?></span></td></tr>
          <tr><td>Target actions</td><td class="pqlptr-code"><?php echo s(implode(', ', $purgeactions)); ?></td></tr>
          <tr><td>Run limit</td><td><span class="pqlptr-pill">500 records maximum</span></td></tr>
        </table>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="retentiondays" value="<?php echo (int)$retentiondays; ?>">
          <input type="hidden" name="action" value="execute_parent_trust_purge">
          <div class="pqlptr-field" style="margin-bottom:10px">
            <label for="purge_review_note">Purge run note</label>
            <textarea id="purge_review_note" class="pqlptr-textarea" name="review_note" placeholder="Export reference, approval note, or operational reason"></textarea>
          </div>
          <div class="pqlptr-field" style="margin-bottom:10px">
            <label><input type="checkbox" name="export_confirmed" value="1"> I confirm the compliance review pack has been exported or export is not required by policy.</label>
          </div>
          <div class="pqlptr-field" style="margin-bottom:10px">
            <label for="confirm_phrase">Type confirmation phrase</label>
            <input id="confirm_phrase" class="pqlptr-input" type="text" name="confirm_phrase" placeholder="PURGE PARENT TRUST AUDIT">
          </div>
          <button class="pqlptr-btn pqlptr-btn--danger" type="submit">Execute guarded purge</button>
        </form>
      </section>

      <section class="pqlptr-panel">
        <h2>Purge Recovery Log &amp; Evidence Snapshot</h2>
        <div class="pqlptr-note">Every purge run writes a recovery log before and after deletion. The evidence snapshot keeps the deleted audit IDs, action/reason counts, affected staff/student counts, and a small row sample so an administrator can prove what was removed without restoring private support-audit rows.</div>
        <table class="pqlptr-table">
          <tr><th>Time</th><th>Event</th><th>Admin</th><th>Policy</th><th>Counts</th><th>Evidence</th></tr>
          <?php foreach ($purgehistory as $row): ?>
            <?php
              $details = pqlptr_decode_details((string)$row->details);
              $evidence = isset($details['evidence_snapshot']) && is_array($details['evidence_snapshot']) ? $details['evidence_snapshot'] : [];
              $sampleids = $evidence['sample_ids'] ?? ($details['sample_ids'] ?? []);
              $sampleids = is_array($sampleids) ? array_map('intval', $sampleids) : [];
              $oldest = (int)($evidence['oldest_timecreated'] ?? 0);
              $newest = (int)($evidence['newest_timecreated'] ?? 0);
              $candidatecount = (int)($details['candidate_count'] ?? $details['eligible_count'] ?? 0);
              $deletedcount = (int)($details['deleted_count'] ?? 0);
              $recordcount = (int)($evidence['record_id_count'] ?? $candidatecount);
              $blockreasons = $details['block_reasons'] ?? [];
              $blockreasons = is_array($blockreasons) ? $blockreasons : [];
            ?>
            <tr>
              <td><?php echo userdate((int)$row->timecreated, get_string('strftimedatetimeshort')); ?><br><span class="pqlptr-code">#<?php echo (int)$row->id; ?></span></td>
              <td>
                <span class="pqlptr-pill <?php echo (string)$row->action === 'parent_trust_purge_blocked' ? 'pqlptr-pill--bad' : ((string)$row->action === 'parent_trust_purge_started' ? 'pqlptr-pill--warn' : ''); ?>"><?php echo s(str_replace('_', ' ', (string)$row->action)); ?></span>
                <?php if ($blockreasons): ?><br><span class="pqlptr-code"><?php echo s(implode(', ', $blockreasons)); ?></span><?php endif; ?>
              </td>
              <td><?php echo s(pqlptr_user_name((int)$row->actorid, 'Admin ' . (int)$row->actorid)); ?><br><span class="pqlptr-code">#<?php echo (int)$row->actorid; ?></span></td>
              <td>
                <span class="pqlptr-pill"><?php echo (int)($details['retention_days'] ?? 0); ?> days</span><br>
                <span class="pqlptr-code">export: <?php echo !empty($details['export_confirmed']) ? 'yes' : 'no'; ?>, approval: <?php echo !empty($details['approval_ok']) ? 'yes' : 'no'; ?></span>
              </td>
              <td>
                <span class="pqlptr-code">candidate: <?php echo $candidatecount; ?></span><br>
                <span class="pqlptr-code">deleted: <?php echo $deletedcount; ?></span><br>
                <span class="pqlptr-code">snapshot: <?php echo $recordcount; ?></span>
              </td>
              <td>
                <span class="pqlptr-code">sample ids: <?php echo $sampleids ? s(implode(', ', $sampleids)) : 'none'; ?></span><br>
                <span class="pqlptr-code">staff/students: <?php echo (int)($evidence['staff_count'] ?? 0); ?>/<?php echo (int)($evidence['student_count'] ?? 0); ?></span><br>
                <span class="pqlptr-code">oldest/newest: <?php echo $oldest > 0 ? s(userdate($oldest, get_string('strftimedatetimeshort'))) : 'n/a'; ?> - <?php echo $newest > 0 ? s(userdate($newest, get_string('strftimedatetimeshort'))) : 'n/a'; ?></span><br>
                <a class="pqlptr-btn pqlptr-btn--light" style="margin-top:6px" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_purge_evidence.php', ['id' => (int)$row->id]))->out(false); ?>">View/export evidence</a>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$purgehistory): ?><tr><td colspan="6">No purge attempts have been logged yet.</td></tr><?php endif; ?>
        </table>
      </section>

      <section class="pqlptr-metrics" aria-label="Retention readiness metrics">
        <div class="pqlptr-metric"><strong><?php echo (int)$metrics['total']; ?></strong><span>tracked events</span></div>
        <div class="pqlptr-metric"><strong><?php echo (int)$metrics['eligible']; ?></strong><span>dry-run eligible</span></div>
        <div class="pqlptr-metric"><strong><?php echo (int)$metrics['staff']; ?></strong><span>staff involved</span></div>
        <div class="pqlptr-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students involved</span></div>
        <div class="pqlptr-metric"><strong><?php echo $metrics['oldest'] > 0 ? s(userdate((int)$metrics['oldest'], get_string('strftimedate'))) : 'None'; ?></strong><span>oldest event</span></div>
      </section>

      <div class="pqlptr-note">Dry-run only. Export the review pack before any future purge. Recommended starting retention for child/privacy support audit records: 365 days unless legal or internal policy requires longer.</div>

      <section class="pqlptr-grid">
        <article class="pqlptr-panel">
          <h2>Age Buckets</h2>
          <table class="pqlptr-table">
            <tr><th>Age</th><th>Events</th><th>Status</th></tr>
            <?php foreach ($buckets as $label => $count): ?>
              <?php $eligiblebucket = $label === '180+ days' && $retentiondays <= 180; ?>
              <tr>
                <td><?php echo s($label); ?></td>
                <td><?php echo (int)$count; ?></td>
                <td><span class="pqlptr-pill <?php echo $eligiblebucket ? 'pqlptr-pill--warn' : ''; ?>"><?php echo $eligiblebucket ? 'review before purge' : 'retain'; ?></span></td>
              </tr>
            <?php endforeach; ?>
          </table>
        </article>

        <article class="pqlptr-panel">
          <h2>Event Types</h2>
          <table class="pqlptr-table">
            <tr><th>Action</th><th>Events</th></tr>
            <?php foreach ($actioncounts as $action => $count): ?>
              <tr><td><?php echo s(str_replace('_', ' ', $action)); ?></td><td><?php echo (int)$count; ?></td></tr>
            <?php endforeach; ?>
            <?php if (!$actioncounts): ?><tr><td colspan="2">No parent trust support audit events found.</td></tr><?php endif; ?>
          </table>
        </article>
      </section>

      <section class="pqlptr-panel">
        <h2>Reason Summary</h2>
        <table class="pqlptr-table">
          <tr><th>Reason</th><th>Events</th></tr>
          <?php foreach ($reasoncounts as $reason => $count): ?>
            <tr><td><?php echo s($reason); ?></td><td><?php echo (int)$count; ?></td></tr>
          <?php endforeach; ?>
          <?php if (!$reasoncounts): ?><tr><td colspan="2">No reason metadata found yet.</td></tr><?php endif; ?>
        </table>
      </section>

      <section class="pqlptr-panel">
        <h2>Dry-Run Purge Candidates</h2>
        <table class="pqlptr-table">
          <tr><th>Time</th><th>Action</th><th>Staff</th><th>Student</th><th>Details</th></tr>
          <?php foreach ($eligible as $row): ?>
            <?php
              $details = json_decode((string)$row->details, true);
              $details = is_array($details) ? $details : [];
              $reason = (string)($details['support_reason_label'] ?? $details['support_reason'] ?? 'Not recorded');
            ?>
            <tr>
              <td><?php echo userdate((int)$row->timecreated, get_string('strftimedatetimeshort')); ?></td>
              <td><span class="pqlptr-pill pqlptr-pill--warn"><?php echo s(str_replace('_', ' ', (string)$row->action)); ?></span><br><span class="pqlptr-code">#<?php echo (int)$row->id; ?></span></td>
              <td><?php echo s(pqlptr_user_name((int)$row->actorid, 'Staff ' . (int)$row->actorid)); ?><br><span class="pqlptr-code">#<?php echo (int)$row->actorid; ?></span></td>
              <td><?php echo s(pqlptr_user_name((int)$row->targetid, 'Student ' . (int)$row->targetid)); ?><br><span class="pqlptr-code">#<?php echo (int)$row->targetid; ?></span></td>
              <td class="pqlptr-code"><?php echo s($reason); ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$eligible): ?><tr><td colspan="5">No events are older than the selected retention policy.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
