<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can review parent trust support access.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_parent_trust_audit.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Parent Trust Support Audit');
$PAGE->set_heading('Parent Trust Support Audit');
$PAGE->add_body_class('pqh-parent-trust-audit-page');

function pqlpta_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlpta_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlpta_short(string $value, int $max = 160): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlpta_date_start(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time === false ? $fallback : $time;
}

function pqlpta_date_end(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time === false ? $fallback : $time;
}

function pqlpta_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlpta_support_reason_options(): array {
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

function pqlpta_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlpta_table_exists('local_prequran_live_audit')) {
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

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'resolve_support_case') {
    require_sesskey();
    $studentid = required_param('studentid', PARAM_INT);
    $note = optional_param('resolution_note', '', PARAM_TEXT);
    pqlpta_audit(0, 'parent_trust_support_case_resolved', 'student', $studentid, [
        'case_status' => 'resolved',
        'resolution_note' => $note,
        'source' => 'parent_trust_audit_page',
    ]);
    redirect(new moodle_url('/local/hubredirect/live_parent_trust_audit.php', ['studentid' => $studentid, 'resolved' => 1]));
}

$staffid = optional_param('staffid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$reason = optional_param('reason', '', PARAM_ALPHANUMEXT);
$reasonoptions = pqlpta_support_reason_options();
if (!array_key_exists($reason, $reasonoptions)) {
    $reason = '';
}
$defaultfrom = time() - (30 * DAYSECS);
$defaultto = time();
$fromtext = optional_param('from', userdate($defaultfrom, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$totext = optional_param('to', userdate($defaultto, '%Y-%m-%d'), PARAM_RAW_TRIMMED);
$fromtime = pqlpta_date_start($fromtext, $defaultfrom);
$totime = pqlpta_date_end($totext, $defaultto);

$ready = pqlpta_table_exists('local_prequran_live_audit');
$params = [
    'action' => 'parent_trust_preview_opened',
    'fromtime' => $fromtime,
    'totime' => $totime,
];
$where = "action = :action AND timecreated >= :fromtime AND timecreated <= :totime";
if ($staffid > 0) {
    $where .= " AND actorid = :staffid";
    $params['staffid'] = $staffid;
}
if ($studentid > 0) {
    $where .= " AND targettype = :targettype AND targetid = :studentid";
    $params['targettype'] = 'student';
    $params['studentid'] = $studentid;
}
if ($reason !== '') {
    $where .= " AND details LIKE :reasonlike";
    $params['reasonlike'] = '%"support_reason":"' . $reason . '"%';
}

$metrics = [
    'previews' => 0,
    'staff' => 0,
    'students' => 0,
    'today' => 0,
    'seven_days' => 0,
    'reasoned' => 0,
    'support_cases' => 0,
];
$previewrows = [];
$staffpatterns = [];
$studentpatterns = [];
$supportcases = [];

if ($ready) {
    $metrics['previews'] = pqlpta_count_sql("SELECT COUNT(1) FROM {local_prequran_live_audit} WHERE {$where}", $params);
    $metrics['staff'] = pqlpta_count_sql("SELECT COUNT(DISTINCT actorid) FROM {local_prequran_live_audit} WHERE {$where}", $params);
    $metrics['students'] = pqlpta_count_sql("SELECT COUNT(DISTINCT targetid) FROM {local_prequran_live_audit} WHERE {$where} AND targettype = 'student'", $params);
    $metrics['today'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action = :action
            AND timecreated >= :todaystart",
        ['action' => 'parent_trust_preview_opened', 'todaystart' => usergetmidnight(time())]
    );
    $metrics['seven_days'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action = :action
            AND timecreated >= :fromtime",
        ['action' => 'parent_trust_preview_opened', 'fromtime' => time() - (7 * DAYSECS)]
    );
    $metrics['reasoned'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE {$where}
            AND details LIKE :hasreason",
        $params + ['hasreason' => '%"support_reason":%']
    );
    $metrics['support_cases'] = pqlpta_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('parent_trust_support_case_logged', 'parent_trust_support_case_resolved')
            AND timecreated >= :fromtime
            AND timecreated <= :totime",
        ['fromtime' => $fromtime, 'totime' => $totime]
    );

    $previewrows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE {$where}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        200
    ));

    $staffpatterns = array_values($DB->get_records_sql(
        "SELECT actorid,
                COUNT(1) AS preview_count,
                COUNT(DISTINCT targetid) AS student_count,
                MIN(timecreated) AS first_preview,
                MAX(timecreated) AS last_preview
           FROM {local_prequran_live_audit}
          WHERE {$where}
       GROUP BY actorid
         HAVING COUNT(1) >= 5 OR COUNT(DISTINCT targetid) >= 3
       ORDER BY student_count DESC, preview_count DESC",
        $params,
        0,
        50
    ));

    $studentpatterns = array_values($DB->get_records_sql(
        "SELECT targetid AS studentid,
                COUNT(1) AS preview_count,
                COUNT(DISTINCT actorid) AS staff_count,
                MIN(timecreated) AS first_preview,
                MAX(timecreated) AS last_preview
           FROM {local_prequran_live_audit}
          WHERE {$where}
            AND targettype = 'student'
       GROUP BY targetid
         HAVING COUNT(DISTINCT actorid) >= 2 OR COUNT(1) >= 5
       ORDER BY staff_count DESC, preview_count DESC",
        $params,
        0,
        50
    ));

    $caseparams = ['fromtime' => $fromtime, 'totime' => $totime];
    $casewhere = "action IN ('parent_trust_support_case_logged', 'parent_trust_support_case_resolved')
                  AND timecreated >= :fromtime
                  AND timecreated <= :totime";
    if ($staffid > 0) {
        $casewhere .= " AND actorid = :staffid";
        $caseparams['staffid'] = $staffid;
    }
    if ($studentid > 0) {
        $casewhere .= " AND targetid = :studentid";
        $caseparams['studentid'] = $studentid;
    }
    if ($reason !== '') {
        $casewhere .= " AND details LIKE :reasonlike";
        $caseparams['reasonlike'] = '%"support_reason":"' . $reason . '"%';
    }
    $supportcases = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE {$casewhere}
       ORDER BY timecreated DESC, id DESC",
        $caseparams,
        0,
        100
    ));
}

$reviewpackparams = [
    'from' => userdate($fromtime, '%Y-%m-%d'),
    'to' => userdate($totime, '%Y-%m-%d'),
];
if ($staffid > 0) {
    $reviewpackparams['staffid'] = $staffid;
}
if ($studentid > 0) {
    $reviewpackparams['studentid'] = $studentid;
}
if ($reason !== '') {
    $reviewpackparams['reason'] = $reason;
}

echo $OUTPUT->header();
?>
<style>
body.pqh-parent-trust-audit-page header,
body.pqh-parent-trust-audit-page footer,
body.pqh-parent-trust-audit-page nav.navbar,
body.pqh-parent-trust-audit-page #page-header,
body.pqh-parent-trust-audit-page #page-footer,
body.pqh-parent-trust-audit-page .drawer,
body.pqh-parent-trust-audit-page .drawer-toggles,
body.pqh-parent-trust-audit-page .block-region,
body.pqh-parent-trust-audit-page [data-region="drawer"],
body.pqh-parent-trust-audit-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-parent-trust-audit-page #page,
body.pqh-parent-trust-audit-page #page-content,
body.pqh-parent-trust-audit-page #region-main,
body.pqh-parent-trust-audit-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlpta-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlpta-wrap{max-width:1240px;margin:0 auto}
.pqlpta-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlpta-title{margin:0;font-size:29px;line-height:1.12;font-weight:950;color:#241b24}
.pqlpta-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqlpta-actions,.pqlpta-form{display:flex;flex-wrap:wrap;gap:9px;align-items:end}
.pqlpta-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlpta-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlpta-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06);margin-bottom:16px}
.pqlpta-panel h2{margin:0 0 13px;font-size:20px;font-weight:950;color:#241b24}
.pqlpta-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqlpta-metric{padding:15px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlpta-metric strong{display:block;font-size:26px;font-weight:950;color:#6f4e32}
.pqlpta-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlpta-field{display:grid;gap:5px}
.pqlpta-field label{font-size:12px;font-weight:950;color:#415665}
.pqlpta-input{min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.16);border-radius:8px;background:#fff;color:#173044;font-size:13px;font-weight:800}
.pqlpta-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlpta-table th,.pqlpta-table td{padding:9px 8px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlpta-table th{font-weight:950;color:#415665;background:#fbfdff}
.pqlpta-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlpta-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlpta-pill--bad{background:#fff0ed;color:#883526}
.pqlpta-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlpta-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
.pqlpta-note{padding:13px;border-radius:10px;background:#f6fff8;border:1px solid rgba(47,125,79,.18);color:#315b3f;font-size:13px;font-weight:850;margin-bottom:14px}
@media(max-width:1050px){.pqlpta-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.pqlpta-top{display:block}.pqlpta-actions{margin-top:12px}.pqlpta-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlpta-metrics{grid-template-columns:1fr}.pqlpta-title{font-size:24px}.pqlpta-form{display:grid}.pqlpta-btn{width:100%}}
</style>
<main class="pqlpta-shell">
  <div class="pqlpta-wrap">
    <section class="pqlpta-top">
      <div>
        <h1 class="pqlpta-title">Parent Trust Support Audit</h1>
        <p class="pqlpta-sub">Review staff access to parent dashboard previews and spot unusual support patterns.</p>
      </div>
      <div class="pqlpta-actions">
        <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_review_pack.php', $reviewpackparams))->out(false); ?>">Review pack</a>
        <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Admin ops</a>
        <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php'))->out(false); ?>">Parent hub</a>
        <a class="pqlpta-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlpta-empty">The live audit table is not installed yet.</div>
    <?php else: ?>
      <?php if (optional_param('resolved', 0, PARAM_INT)): ?><div class="pqlpta-note">Support case resolution was saved to the audit trail.</div><?php endif; ?>
      <section class="pqlpta-panel">
        <form class="pqlpta-form" method="get">
          <div class="pqlpta-field"><label for="staffid">Staff user ID</label><input id="staffid" class="pqlpta-input" type="number" name="staffid" value="<?php echo $staffid > 0 ? (int)$staffid : ''; ?>"></div>
          <div class="pqlpta-field"><label for="studentid">Student user ID</label><input id="studentid" class="pqlpta-input" type="number" name="studentid" value="<?php echo $studentid > 0 ? (int)$studentid : ''; ?>"></div>
          <div class="pqlpta-field"><label for="reason">Reason</label><select id="reason" class="pqlpta-input" name="reason"><?php foreach ($reasonoptions as $reasonkey => $reasonlabel): ?><option value="<?php echo s($reasonkey); ?>" <?php echo $reasonkey === $reason ? 'selected' : ''; ?>><?php echo s($reasonlabel); ?></option><?php endforeach; ?></select></div>
          <div class="pqlpta-field"><label for="from">From</label><input id="from" class="pqlpta-input" type="date" name="from" value="<?php echo s(userdate($fromtime, '%Y-%m-%d')); ?>"></div>
          <div class="pqlpta-field"><label for="to">To</label><input id="to" class="pqlpta-input" type="date" name="to" value="<?php echo s(userdate($totime, '%Y-%m-%d')); ?>"></div>
          <button class="pqlpta-btn" type="submit">Apply filters</button>
          <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_audit.php'))->out(false); ?>">Reset</a>
        </form>
      </section>

      <section class="pqlpta-metrics" aria-label="Parent trust support audit metrics">
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['previews']; ?></strong><span>filtered previews</span></div>
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['staff']; ?></strong><span>staff users</span></div>
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students previewed</span></div>
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['today']; ?></strong><span>today</span></div>
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['seven_days']; ?></strong><span>last 7 days</span></div>
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['reasoned']; ?></strong><span>with reasons</span></div>
        <div class="pqlpta-metric"><strong><?php echo (int)$metrics['support_cases']; ?></strong><span>case events</span></div>
      </section>

      <div class="pqlpta-note">Privacy check: this review page reads only staff preview audit rows. The parent trust dashboard preview uses parent-visible summaries and does not display private teacher notes.</div>

      <section class="pqlpta-panel">
        <h2>Support Case Log</h2>
        <table class="pqlpta-table">
          <tr><th>Time</th><th>Staff</th><th>Student</th><th>Reason</th><th>Status / Note</th><th>Action</th></tr>
          <?php foreach ($supportcases as $case): ?>
            <?php
              $details = json_decode((string)$case->details, true);
              $details = is_array($details) ? $details : [];
              $casestatus = (string)($details['case_status'] ?? ((string)$case->action === 'parent_trust_support_case_resolved' ? 'resolved' : 'open'));
              $caseclass = $casestatus === 'resolved' ? '' : ($casestatus === 'escalated' ? 'pqlpta-pill--bad' : 'pqlpta-pill--warn');
            ?>
            <tr>
              <td><?php echo userdate((int)$case->timecreated, get_string('strftimedatetimeshort')); ?></td>
              <td><?php echo s(pqlpta_user_name((int)$case->actorid, 'Staff ' . (int)$case->actorid)); ?><br><span class="pqlpta-code">#<?php echo (int)$case->actorid; ?></span></td>
              <td><?php echo s(pqlpta_user_name((int)$case->targetid, 'Student ' . (int)$case->targetid)); ?><br><span class="pqlpta-code">#<?php echo (int)$case->targetid; ?></span></td>
              <td><?php echo s((string)($details['support_reason_label'] ?? str_replace('_', ' ', (string)($details['support_reason'] ?? 'not recorded')))); ?></td>
              <td><span class="pqlpta-pill <?php echo $caseclass; ?>"><?php echo s(str_replace('_', ' ', $casestatus)); ?></span><br><span class="pqlpta-code"><?php echo s(pqlpta_short((string)($details['case_note'] ?? $details['resolution_note'] ?? ''))); ?></span></td>
              <td>
                <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php', ['childid' => (int)$case->targetid]))->out(false); ?>">Open hub</a>
                <?php if ($casestatus !== 'resolved'): ?>
                  <form method="post" style="display:inline">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="resolve_support_case">
                    <input type="hidden" name="studentid" value="<?php echo (int)$case->targetid; ?>">
                    <input type="hidden" name="resolution_note" value="Resolved from Parent Trust Support Audit">
                    <button class="pqlpta-btn" type="submit">Resolve</button>
                  </form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$supportcases): ?><tr><td colspan="6">No support case events found for these filters.</td></tr><?php endif; ?>
        </table>
      </section>

      <section class="pqlpta-panel">
        <h2>Access Patterns To Review</h2>
        <table class="pqlpta-table">
          <tr><th>Staff</th><th>Previews</th><th>Students</th><th>Window</th><th>Signal</th></tr>
          <?php foreach ($staffpatterns as $row): ?>
            <?php $high = (int)$row->student_count >= 5 || (int)$row->preview_count >= 15; ?>
            <tr>
              <td><?php echo s(pqlpta_user_name((int)$row->actorid, 'Staff ' . (int)$row->actorid)); ?><br><span class="pqlpta-code">#<?php echo (int)$row->actorid; ?></span></td>
              <td><?php echo (int)$row->preview_count; ?></td>
              <td><?php echo (int)$row->student_count; ?></td>
              <td><?php echo userdate((int)$row->first_preview, get_string('strftimedatetimeshort')); ?><br><?php echo userdate((int)$row->last_preview, get_string('strftimedatetimeshort')); ?></td>
              <td><span class="pqlpta-pill <?php echo $high ? 'pqlpta-pill--bad' : 'pqlpta-pill--warn'; ?>"><?php echo $high ? 'review access reason' : 'watch'; ?></span></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$staffpatterns): ?><tr><td colspan="5">No unusual staff preview patterns in this filter window.</td></tr><?php endif; ?>
        </table>
      </section>

      <section class="pqlpta-panel">
        <h2>Students With Multiple Preview Events</h2>
        <table class="pqlpta-table">
          <tr><th>Student</th><th>Previews</th><th>Staff</th><th>Window</th><th>Action</th></tr>
          <?php foreach ($studentpatterns as $row): ?>
            <?php $high = (int)$row->staff_count >= 3 || (int)$row->preview_count >= 10; ?>
            <tr>
              <td><?php echo s(pqlpta_user_name((int)$row->studentid, 'Student ' . (int)$row->studentid)); ?><br><span class="pqlpta-code">#<?php echo (int)$row->studentid; ?></span></td>
              <td><span class="pqlpta-pill <?php echo $high ? 'pqlpta-pill--bad' : 'pqlpta-pill--warn'; ?>"><?php echo (int)$row->preview_count; ?></span></td>
              <td><?php echo (int)$row->staff_count; ?></td>
              <td><?php echo userdate((int)$row->first_preview, get_string('strftimedatetimeshort')); ?><br><?php echo userdate((int)$row->last_preview, get_string('strftimedatetimeshort')); ?></td>
              <td><a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php', ['childid' => (int)$row->studentid]))->out(false); ?>">Open hub</a></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$studentpatterns): ?><tr><td colspan="5">No repeated student preview patterns in this filter window.</td></tr><?php endif; ?>
        </table>
      </section>

      <section class="pqlpta-panel">
        <h2>Preview History</h2>
        <table class="pqlpta-table">
          <tr><th>Time</th><th>Staff</th><th>Student</th><th>Context</th><th>Action</th></tr>
          <?php foreach ($previewrows as $row): ?>
            <?php
              $details = json_decode((string)$row->details, true);
              $details = is_array($details) ? $details : [];
              $contextbits = [];
              foreach (['support_reason_label', 'case_status', 'case_note', 'linked_parents', 'upcoming_sessions', 'visible_summaries', 'open_followups', 'visible_recordings', 'pending_acknowledgements'] as $key) {
                  if (array_key_exists($key, $details)) {
                      $contextbits[] = str_replace('_', ' ', $key) . ': ' . (is_numeric($details[$key]) ? (int)$details[$key] : (string)$details[$key]);
                  }
              }
            ?>
            <tr>
              <td><?php echo userdate((int)$row->timecreated, get_string('strftimedatetimeshort')); ?></td>
              <td><?php echo s(pqlpta_user_name((int)$row->actorid, 'Staff ' . (int)$row->actorid)); ?><br><span class="pqlpta-code">#<?php echo (int)$row->actorid; ?></span></td>
              <td><?php echo s(pqlpta_user_name((int)$row->targetid, 'Student ' . (int)$row->targetid)); ?><br><span class="pqlpta-code">#<?php echo (int)$row->targetid; ?></span></td>
              <td class="pqlpta-code"><?php echo s($contextbits ? implode(' | ', $contextbits) : pqlpta_short((string)$row->details)); ?></td>
              <td>
                <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php', ['childid' => (int)$row->targetid]))->out(false); ?>">Open hub</a>
                <a class="pqlpta-btn pqlpta-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust_audit.php', ['studentid' => (int)$row->targetid, 'from' => userdate($fromtime, '%Y-%m-%d'), 'to' => userdate($totime, '%Y-%m-%d')]))->out(false); ?>">Student audit</a>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$previewrows): ?><tr><td colspan="5">No staff preview events found for these filters.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
