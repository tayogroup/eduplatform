<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$pqlptrpconsumercontext = pqh_requested_consumer_context();
$pqlptrpbrandname = trim((string)($pqlptrpconsumercontext->consumername ?? 'EduPlatform')) ?: 'EduPlatform';

if (!is_siteadmin($USER)) {
    pqh_access_denied(
        'Only site administrators can export parent trust compliance review packs.',
        new moodle_url('/local/hubredirect/live_trust.php'),
        'Parent trust review pack access required'
    );
}

function pqlptrp_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptrp_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlptrp_date_start(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time === false ? $fallback : $time;
}

function pqlptrp_date_end(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time === false ? $fallback : $time;
}

function pqlptrp_reason_options(): array {
    return [
        '' => 'All reasons',
        'parent_support_request' => 'Parent support request',
        'scheduling_issue' => 'Scheduling issue',
        'recording_summary_question' => 'Recording or summary question',
        'technical_support' => 'Technical support',
        'safety_privacy_review' => 'Safety/privacy review',
        'other' => 'Other',
    ];
}

function pqlptrp_short(string $value, int $max = 220): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

$staffid = optional_param('staffid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$reason = optional_param('reason', '', PARAM_ALPHANUMEXT);
$format = optional_param('format', '', PARAM_ALPHA);
$reasonoptions = pqlptrp_reason_options();
if (!array_key_exists($reason, $reasonoptions)) {
    $reason = '';
}
$defaultfrom = time() - (30 * DAYSECS);
$defaultto = time();
$fromtext = optional_param('from', userdate($defaultfrom, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$totext = optional_param('to', userdate($defaultto, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$fromtime = pqlptrp_date_start($fromtext, $defaultfrom);
$totime = pqlptrp_date_end($totext, $defaultto);

$ready = pqlptrp_table_exists('local_prequran_live_audit');
$params = ['fromtime' => $fromtime, 'totime' => $totime];
$where = "timecreated >= :fromtime
          AND timecreated <= :totime
          AND action IN (
              'parent_trust_preview_opened',
              'parent_trust_support_case_logged',
              'parent_trust_support_case_resolved'
          )";
if ($staffid > 0) {
    $where .= " AND actorid = :staffid";
    $params['staffid'] = $staffid;
}
if ($studentid > 0) {
    $where .= " AND targetid = :studentid";
    $params['studentid'] = $studentid;
}
if ($reason !== '') {
    $where .= " AND details LIKE :reasonlike";
    $params['reasonlike'] = '%"support_reason":"' . $reason . '"%';
}

$rows = [];
if ($ready) {
    $rows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE {$where}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        1000
    ));
}

$metrics = [
    'events' => count($rows),
    'previews' => 0,
    'staff' => [],
    'students' => [],
    'cases_opened' => 0,
    'cases_resolved' => 0,
    'cases_escalated' => 0,
    'reasoned_previews' => 0,
];
$reasoncounts = [];
$exportrows = [];
foreach ($rows as $row) {
    $details = json_decode((string)$row->details, true);
    $details = is_array($details) ? $details : [];
    $rowreason = (string)($details['support_reason'] ?? '');
    $reasonlabel = (string)($details['support_reason_label'] ?? ($rowreason !== '' ? str_replace('_', ' ', $rowreason) : 'Not recorded'));
    $casestatus = (string)($details['case_status'] ?? ((string)$row->action === 'parent_trust_support_case_resolved' ? 'resolved' : ''));
    if ((string)$row->action === 'parent_trust_preview_opened') {
        $metrics['previews']++;
        if ($rowreason !== '') {
            $metrics['reasoned_previews']++;
        }
    }
    if ((string)$row->action === 'parent_trust_support_case_logged') {
        $metrics['cases_opened']++;
    }
    if ((string)$row->action === 'parent_trust_support_case_resolved') {
        $metrics['cases_resolved']++;
    }
    if ($casestatus === 'escalated') {
        $metrics['cases_escalated']++;
    }
    if ((int)$row->actorid > 0) {
        $metrics['staff'][(int)$row->actorid] = true;
    }
    if ((int)$row->targetid > 0) {
        $metrics['students'][(int)$row->targetid] = true;
    }
    $reasoncounts[$reasonlabel] = ($reasoncounts[$reasonlabel] ?? 0) + 1;
    $exportrows[] = [
        'time' => userdate((int)$row->timecreated, '%Y-%m-%d %H:%M:%S'),
        'action' => (string)$row->action,
        'staffid' => (int)$row->actorid,
        'staff' => pqlptrp_user_name((int)$row->actorid, 'Staff ' . (int)$row->actorid),
        'studentid' => (int)$row->targetid,
        'student' => pqlptrp_user_name((int)$row->targetid, 'Student ' . (int)$row->targetid),
        'reason' => $reasonlabel,
        'case_status' => $casestatus,
        'case_note' => (string)($details['case_note'] ?? ''),
        'resolution_note' => (string)($details['resolution_note'] ?? ''),
        'details' => (string)$row->details,
    ];
}

if ($format === 'csv') {
    $filename = 'parent-trust-review-pack-' . userdate(time(), '%Y%m%d-%H%M%S') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, [$pqlptrpbrandname . ' Parent Trust Compliance Review Pack']);
    fputcsv($out, ['Generated', userdate(time(), '%Y-%m-%d %H:%M:%S')]);
    fputcsv($out, ['From', userdate($fromtime, '%Y-%m-%d'), 'To', userdate($totime, '%Y-%m-%d'), 'Staff ID', $staffid ?: 'all', 'Student ID', $studentid ?: 'all', 'Reason', $reasonoptions[$reason]]);
    fputcsv($out, []);
    fputcsv($out, ['events', 'previews', 'reasoned_previews', 'staff_count', 'student_count', 'cases_opened', 'cases_resolved', 'cases_escalated']);
    fputcsv($out, [$metrics['events'], $metrics['previews'], $metrics['reasoned_previews'], count($metrics['staff']), count($metrics['students']), $metrics['cases_opened'], $metrics['cases_resolved'], $metrics['cases_escalated']]);
    fputcsv($out, []);
    fputcsv($out, ['time', 'action', 'staffid', 'staff', 'studentid', 'student', 'reason', 'case_status', 'case_note', 'resolution_note', 'details']);
    foreach ($exportrows as $exportrow) {
        fputcsv($out, $exportrow);
    }
    fclose($out);
    exit;
}

$filterurlparams = [
    'from' => userdate($fromtime, '%Y-%m-%d'),
    'to' => userdate($totime, '%Y-%m-%d'),
];
if ($staffid > 0) {
    $filterurlparams['staffid'] = $staffid;
}
if ($studentid > 0) {
    $filterurlparams['studentid'] = $studentid;
}
if ($reason !== '') {
    $filterurlparams['reason'] = $reason;
}
$csvurlparams = $filterurlparams + ['format' => 'csv'];

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_parent_trust_review_pack.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Trust Compliance Review Pack');
$PAGE->set_heading('Parent Trust Compliance Review Pack');
$PAGE->add_body_class('pqh-parent-trust-pack-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-parent-trust-pack-page header,
body.pqh-parent-trust-pack-page footer,
body.pqh-parent-trust-pack-page nav.navbar,
body.pqh-parent-trust-pack-page #page-header,
body.pqh-parent-trust-pack-page #page-footer,
body.pqh-parent-trust-pack-page .drawer,
body.pqh-parent-trust-pack-page .drawer-toggles,
body.pqh-parent-trust-pack-page .block-region,
body.pqh-parent-trust-pack-page [data-region="drawer"],
body.pqh-parent-trust-pack-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-parent-trust-pack-page #page,
body.pqh-parent-trust-pack-page #page-content,
body.pqh-parent-trust-pack-page #region-main,
body.pqh-parent-trust-pack-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlptrp-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlptrp-wrap{max-width:1180px;margin:0 auto}
.pqlptrp-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:22px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlptrp-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}
.pqlptrp-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqlptrp-actions,.pqlptrp-form{display:flex;flex-wrap:wrap;gap:9px;align-items:end}
.pqlptrp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlptrp-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlptrp-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06);margin-bottom:16px}
.pqlptrp-panel h2{margin:0 0 13px;font-size:20px;font-weight:950;color:#241b24}
.pqlptrp-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlptrp-metric{padding:15px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlptrp-metric strong{display:block;font-size:26px;font-weight:950;color:#6f4e32}
.pqlptrp-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlptrp-field{display:grid;gap:5px}
.pqlptrp-field label{font-size:12px;font-weight:950;color:#415665}
.pqlptrp-input{min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font-size:13px;font-weight:800}
.pqlptrp-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlptrp-table th,.pqlptrp-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlptrp-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqlptrp-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlptrp-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlptrp-pill--bad{background:#fff0ed;color:#883526}
.pqlptrp-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlptrp-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqlptrp-note{padding:13px;border-radius:10px;background:#f6fff8;border:1px solid rgba(47,125,79,.18);color:#315b3f;font-size:13px;font-weight:850;margin-bottom:14px}
@media print{.pqlptrp-actions,.pqlptrp-form,.pqlptrp-btn{display:none!important}.pqlptrp-shell{padding:0;background:#fff}.pqlptrp-panel,.pqlptrp-top,.pqlptrp-metric{box-shadow:none}}
@media(max-width:980px){.pqlptrp-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlptrp-top{display:block}.pqlptrp-actions{margin-top:12px}.pqlptrp-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlptrp-metrics{grid-template-columns:1fr}.pqlptrp-title{font-size:24px}.pqlptrp-form{display:grid}.pqlptrp-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlptrp-shell">
  <div class="pqlptrp-wrap">
    <section class="pqlptrp-top pqh-workspace-top">
      <div>
        <h1 class="pqlptrp-title pqh-workspace-title">Parent Trust Compliance Review Pack</h1>
        <p class="pqlptrp-sub pqh-workspace-sub">Printable and exportable record of staff parent-dashboard previews, reasons, and support case outcomes.</p>
      </div>
      <div class="pqlptrp-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlptrp-btn pqlptrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_audit.php', $filterurlparams))->out(false); ?>">Audit page</a>
        <a class="pqlptrp-btn pqlptrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_retention.php'))->out(false); ?>">Retention dry-run</a>
        <a class="pqlptrp-btn pqlptrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Admin ops</a>
        <a class="pqlptrp-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlptrp-empty">The live audit table is not installed yet.</div>
    <?php else: ?>
      <section class="pqlptrp-panel">
        <form class="pqlptrp-form" method="get">
          <div class="pqlptrp-field"><label for="staffid">Staff user ID</label><input id="staffid" class="pqlptrp-input" type="number" name="staffid" value="<?php echo $staffid > 0 ? (int)$staffid : ''; ?>"></div>
          <div class="pqlptrp-field"><label for="studentid">Student user ID</label><input id="studentid" class="pqlptrp-input" type="number" name="studentid" value="<?php echo $studentid > 0 ? (int)$studentid : ''; ?>"></div>
          <div class="pqlptrp-field"><label for="reason">Reason</label><select id="reason" class="pqlptrp-input" name="reason"><?php foreach ($reasonoptions as $reasonkey => $reasonlabel): ?><option value="<?php echo s($reasonkey); ?>" <?php echo $reasonkey === $reason ? 'selected' : ''; ?>><?php echo s($reasonlabel); ?></option><?php endforeach; ?></select></div>
          <div class="pqlptrp-field"><label for="from">From</label><input id="from" class="pqlptrp-input" type="date" name="from" value="<?php echo s(userdate($fromtime, '%Y-%m-%d')); ?>"></div>
          <div class="pqlptrp-field"><label for="to">To</label><input id="to" class="pqlptrp-input" type="date" name="to" value="<?php echo s(userdate($totime, '%Y-%m-%d')); ?>"></div>
          <button class="pqlptrp-btn" type="submit">Apply filters</button>
          <a class="pqlptrp-btn pqlptrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_review_pack.php'))->out(false); ?>">Reset</a>
          <a class="pqlptrp-btn pqlptrp-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_review_pack.php', $csvurlparams))->out(false); ?>">Download CSV</a>
          <button class="pqlptrp-btn pqlptrp-btn--light" type="button" onclick="window.print()">Print pack</button>
        </form>
      </section>

      <section class="pqlptrp-metrics" aria-label="Compliance review metrics">
        <div class="pqlptrp-metric"><strong><?php echo (int)$metrics['previews']; ?></strong><span>preview events</span></div>
        <div class="pqlptrp-metric"><strong><?php echo count($metrics['staff']); ?></strong><span>staff involved</span></div>
        <div class="pqlptrp-metric"><strong><?php echo count($metrics['students']); ?></strong><span>students previewed</span></div>
        <div class="pqlptrp-metric"><strong><?php echo (int)$metrics['reasoned_previews']; ?></strong><span>previews with reason</span></div>
        <div class="pqlptrp-metric"><strong><?php echo (int)$metrics['cases_opened']; ?></strong><span>cases opened</span></div>
        <div class="pqlptrp-metric"><strong><?php echo (int)$metrics['cases_resolved']; ?></strong><span>cases resolved</span></div>
        <div class="pqlptrp-metric"><strong><?php echo (int)$metrics['cases_escalated']; ?></strong><span>cases escalated</span></div>
        <div class="pqlptrp-metric"><strong><?php echo (int)$metrics['events']; ?></strong><span>total audit events</span></div>
      </section>

      <div class="pqlptrp-note">Generated <?php echo s(userdate(time(), get_string('strftimedatetimeshort'))); ?> for <?php echo s(userdate($fromtime, get_string('strftimedate'))); ?> through <?php echo s(userdate($totime, get_string('strftimedate'))); ?>. This pack contains support audit metadata only, not private teacher notes.</div>

      <section class="pqlptrp-panel">
        <h2>Reason Summary</h2>
        <table class="pqlptrp-table">
          <tr><th>Reason</th><th>Events</th></tr>
          <?php foreach ($reasoncounts as $label => $count): ?>
            <tr><td><?php echo s((string)$label); ?></td><td><?php echo (int)$count; ?></td></tr>
          <?php endforeach; ?>
          <?php if (!$reasoncounts): ?><tr><td colspan="2">No reasoned events found for these filters.</td></tr><?php endif; ?>
        </table>
      </section>

      <section class="pqlptrp-panel">
        <h2>Audit Event Detail</h2>
        <table class="pqlptrp-table">
          <tr><th>Time</th><th>Action</th><th>Staff</th><th>Student</th><th>Reason</th><th>Status / Notes</th></tr>
          <?php foreach ($exportrows as $row): ?>
            <?php $statusclass = $row['case_status'] === 'escalated' ? 'pqlptrp-pill--bad' : ($row['case_status'] === 'open' ? 'pqlptrp-pill--warn' : ''); ?>
            <tr>
              <td><?php echo s((string)$row['time']); ?></td>
              <td><span class="pqlptrp-pill"><?php echo s(str_replace('_', ' ', (string)$row['action'])); ?></span></td>
              <td><?php echo s((string)$row['staff']); ?><br><span class="pqlptrp-code">#<?php echo (int)$row['staffid']; ?></span></td>
              <td><?php echo s((string)$row['student']); ?><br><span class="pqlptrp-code">#<?php echo (int)$row['studentid']; ?></span></td>
              <td><?php echo s((string)$row['reason']); ?></td>
              <td>
                <?php if ((string)$row['case_status'] !== ''): ?><span class="pqlptrp-pill <?php echo $statusclass; ?>"><?php echo s(str_replace('_', ' ', (string)$row['case_status'])); ?></span><br><?php endif; ?>
                <span class="pqlptrp-code"><?php echo s(pqlptrp_short(trim((string)$row['case_note'] . ' ' . (string)$row['resolution_note']))); ?></span>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$exportrows): ?><tr><td colspan="6">No audit events found for these filters.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
