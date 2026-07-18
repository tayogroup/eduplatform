<?php
declare(strict_types=1);

// Phase 4 of the UI redesign: at-risk student intervention report.
// Configurable rules over live data (no-login days, attendance %, missed
// live sessions), risk levels, direct actions, reviewed/note persistence
// through the established audit-table pattern, and CSV export.

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
if ($workspaceid <= 0) {
    $workspaceid = pqh_current_workspace_id((int)$USER->id);
}
$urlparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

$canops = pqh_can_manage_academy_operations((int)$USER->id);
$canmanage = $canops || ($workspaceid > 0 && pqh_user_can_manage_workspace((int)$USER->id, $workspaceid));
$canteach = $workspaceid > 0 && pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid);
if (!$canmanage && !$canteach) {
    pqh_access_denied('Only workspace managers and teachers can open the at-risk report.', new moodle_url('/local/hubredirect/dashboard.php', $urlparams), 'At-risk report access required');
}

// ---- configurable rules ----
$inactivedays = max(3, min(90, optional_param('inactivedays', 14, PARAM_INT)));
$attendthreshold = max(10, min(100, optional_param('attendthreshold', 70, PARAM_INT)));
$missedthreshold = max(1, min(20, optional_param('missedthreshold', 3, PARAM_INT)));
$risklevelfilter = optional_param('risklevel', '', PARAM_ALPHA);
$export = optional_param('export', '', PARAM_ALPHA);
$now = time();
$window = 30 * DAYSECS;
$pageurl = new moodle_url('/local/hubredirect/at_risk_report.php', $urlparams + [
    'inactivedays' => $inactivedays, 'attendthreshold' => $attendthreshold, 'missedthreshold' => $missedthreshold,
]);

function parr_audit(int $studentid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'student',
        'targetid' => $studentid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

// ---- actions: mark reviewed / intervention note ----
if (data_submitted() && confirm_sesskey()) {
    $actionname = optional_param('action', '', PARAM_ALPHANUMEXT);
    $actionstudent = optional_param('studentid', 0, PARAM_INT);
    if ($actionstudent > 0 && $actionname === 'mark_reviewed') {
        parr_audit($actionstudent, 'atrisk_reviewed', ['workspaceid' => $workspaceid]);
        redirect($pageurl, 'Marked as reviewed.', 1, \core\output\notification::NOTIFY_SUCCESS);
    }
    if ($actionstudent > 0 && $actionname === 'add_note') {
        $notetext = trim(optional_param('note', '', PARAM_TEXT));
        if ($notetext !== '') {
            parr_audit($actionstudent, 'atrisk_note', ['workspaceid' => $workspaceid, 'note' => core_text::substr($notetext, 0, 500)]);
        }
        redirect($pageurl, 'Intervention note saved.', 1, \core\output\notification::NOTIFY_SUCCESS);
    }
}

// ---- student population (workspace members; teachers scoped to their own) ----
$population = [];
if ($workspaceid > 0 && pqh_table_exists_safe('local_prequran_workspace_member')) {
    $rows = $DB->get_records('local_prequran_workspace_member', [
        'workspaceid' => $workspaceid, 'workspace_role' => 'student', 'status' => 'active',
    ], '', 'id, userid');
    foreach ($rows as $row) {
        $population[(int)$row->userid] = (int)$row->userid;
    }
}
if (!$canmanage && $canteach && pqh_table_exists_safe('local_prequran_teacher_student')) {
    $scoperows = $DB->get_records('local_prequran_teacher_student', [
        'teacherid' => (int)$USER->id, 'status' => 'active',
    ], '', 'id, studentid');
    $scope = [];
    foreach ($scoperows as $row) {
        $scope[(int)$row->studentid] = true;
    }
    $population = array_filter($population, static function(int $sid) use ($scope): bool {
        return !empty($scope[$sid]);
    });
}

// ---- bulk signals ----
$lastaccess = [];
$names = [];
$accounts = [];
if ($population) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parr');
    $users = $DB->get_records_select('user', "id $insql AND deleted = 0", $inparams, '', 'id, firstname, lastname, idnumber, lastaccess');
    foreach ($users as $u) {
        $lastaccess[(int)$u->id] = (int)$u->lastaccess;
        $names[(int)$u->id] = fullname($u);
        $accounts[(int)$u->id] = trim((string)$u->idnumber);
    }
}
$expected = [];
$attended = [];
if ($population && pqh_table_exists_safe('local_prequran_live_session') && pqh_table_exists_safe('local_prequran_live_participant')) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parre');
    $inparams['ws'] = $workspaceid;
    $inparams['from'] = $now - $window;
    $inparams['to'] = $now;
    $expectedrows = $DB->get_records_sql(
        "SELECT p.studentid, COUNT(1) AS cnt
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
          WHERE p.studentid $insql AND p.role = 'student' AND p.status = 'active'
            AND s.workspaceid = :ws AND s.status <> 'cancelled'
            AND s.scheduled_end >= :from AND s.scheduled_end < :to
       GROUP BY p.studentid", $inparams);
    foreach ($expectedrows as $row) {
        $expected[(int)$row->studentid] = (int)$row->cnt;
    }
    if (pqh_table_exists_safe('local_prequran_live_attendance')) {
        $attendedrows = $DB->get_records_sql(
            "SELECT a.studentid, COUNT(1) AS cnt
               FROM {local_prequran_live_attendance} a
               JOIN {local_prequran_live_session} s ON s.id = a.sessionid
              WHERE a.studentid $insql AND a.join_time > 0
                AND s.workspaceid = :ws
                AND s.scheduled_end >= :from AND s.scheduled_end < :to
           GROUP BY a.studentid", $inparams);
        foreach ($attendedrows as $row) {
            $attended[(int)$row->studentid] = (int)$row->cnt;
        }
    }
}
$teachers = [];
if ($population && pqh_table_exists_safe('local_prequran_teacher_student')) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parrt');
    $trs = $DB->get_records_select('local_prequran_teacher_student', "studentid $insql AND status = 'active'", $inparams, '', 'id, studentid, teacherid');
    foreach ($trs as $tr) {
        if (!isset($teachers[(int)$tr->studentid])) {
            $tuser = core_user::get_user((int)$tr->teacherid, 'id, firstname, lastname', IGNORE_MISSING);
            $teachers[(int)$tr->studentid] = $tuser ? fullname($tuser) : 'Teacher #' . (int)$tr->teacherid;
        }
    }
}
$reviewed = [];
$notes = [];
if ($population && pqh_table_exists_safe('local_prequran_live_audit')) {
    [$insql, $inparams] = $DB->get_in_or_equal(array_values($population), SQL_PARAMS_NAMED, 'parrr');
    $inparams['since'] = $now - $window;
    $auditrows = $DB->get_records_select('local_prequran_live_audit',
        "targettype = 'student' AND targetid $insql AND action IN ('atrisk_reviewed', 'atrisk_note') AND timecreated >= :since",
        $inparams, 'timecreated DESC', 'id, targetid, action, details, timecreated');
    foreach ($auditrows as $row) {
        $sid = (int)$row->targetid;
        if ($row->action === 'atrisk_reviewed' && !isset($reviewed[$sid])) {
            $reviewed[$sid] = (int)$row->timecreated;
        }
        if ($row->action === 'atrisk_note' && !isset($notes[$sid])) {
            $decoded = json_decode((string)$row->details, true);
            $notes[$sid] = (string)($decoded['note'] ?? '');
        }
    }
}

// ---- evaluate rules ----
$atrisk = [];
$highcount = 0;
$mediumcount = 0;
foreach ($population as $sid) {
    $reasons = [];
    $la = $lastaccess[$sid] ?? 0;
    $inactivefor = $la > 0 ? (int)floor(($now - $la) / DAYSECS) : null;
    if ($inactivefor === null || $inactivefor >= $inactivedays) {
        $reasons[] = $inactivefor === null ? 'Never logged in' : 'No login ' . $inactivefor . 'd';
    }
    $exp = $expected[$sid] ?? 0;
    $att = min($attended[$sid] ?? 0, $exp);
    $rate = $exp > 0 ? (int)round(100 * $att / $exp) : null;
    if ($rate !== null && $rate < $attendthreshold) {
        $reasons[] = 'Attendance ' . $rate . '%';
    }
    $missed = max(0, $exp - $att);
    if ($missed >= $missedthreshold) {
        $reasons[] = $missed . ' classes missed';
    }
    if (!$reasons) {
        continue;
    }
    $level = (count($reasons) >= 2 || ($inactivefor !== null && $inactivefor >= 2 * $inactivedays) || $inactivefor === null) ? 'high' : 'medium';
    if ($risklevelfilter !== '' && $risklevelfilter !== $level) {
        continue;
    }
    if ($level === 'high') {
        $highcount++;
    } else {
        $mediumcount++;
    }
    $atrisk[] = [
        'id' => $sid,
        'name' => $names[$sid] ?? ('Student #' . $sid),
        'account' => $accounts[$sid] ?? '',
        'teacher' => $teachers[$sid] ?? 'Unassigned',
        'level' => $level,
        'reasons' => $reasons,
        'lastaccess' => $la,
        'rate' => $rate,
        'missed' => $missed,
        'reviewedat' => $reviewed[$sid] ?? 0,
        'note' => $notes[$sid] ?? '',
    ];
}
usort($atrisk, static function(array $a, array $b): int {
    if ($a['level'] !== $b['level']) {
        return $a['level'] === 'high' ? -1 : 1;
    }
    return $a['lastaccess'] <=> $b['lastaccess'];
});

// ---- CSV export ----
if ($export === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="at-risk-students-' . date('Ymd') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Student', 'Account', 'Teacher', 'Risk level', 'Reasons', 'Last activity', 'Attendance 30d', 'Missed 30d', 'Reviewed', 'Latest note']);
    foreach ($atrisk as $row) {
        fputcsv($out, [
            $row['name'], $row['account'], $row['teacher'], ucfirst($row['level']),
            implode('; ', $row['reasons']),
            $row['lastaccess'] > 0 ? userdate($row['lastaccess'], get_string('strftimedatetimeshort')) : 'Never',
            $row['rate'] !== null ? $row['rate'] . '%' : '-',
            $row['missed'],
            $row['reviewedat'] > 0 ? userdate($row['reviewedat'], get_string('strftimedatetimeshort')) : '-',
            $row['note'],
        ]);
    }
    fclose($out);
    exit;
}

$reviewedweek = 0;
foreach ($reviewed as $ts) {
    if ($ts >= $now - 7 * DAYSECS) {
        $reviewedweek++;
    }
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url($pageurl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title('At-risk students');
$PAGE->set_heading('At-risk students');
$PAGE->add_body_class('pqh-atrisk-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-atrisk-page header,body.pqh-atrisk-page footer,body.pqh-atrisk-page nav.navbar,body.pqh-atrisk-page #page-header,body.pqh-atrisk-page #page-footer,body.pqh-atrisk-page .drawer,body.pqh-atrisk-page .drawer-toggles,body.pqh-atrisk-page .block-region,body.pqh-atrisk-page [data-region="drawer"],body.pqh-atrisk-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-atrisk-page #page,body.pqh-atrisk-page #page-content,body.pqh-atrisk-page #region-main,body.pqh-atrisk-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.parr-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;--pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#fff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;--pqh-primary-ink:#17498f;
  min-height:100vh;padding:26px 22px 60px;background:var(--pqh-bg);color:var(--pqh-ink);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.parr-wrap{max-width:1240px;margin:0 auto}
.parr-crumbs{color:var(--pqh-faint);font-size:12px;font-weight:600;margin:0 0 10px}
.parr-crumbs a{color:var(--pqh-muted);text-decoration:none}
.parr-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.parr-head h1{margin:0;font-size:24px;font-weight:800;letter-spacing:-.02em}
.parr-head p{margin:4px 0 0;color:var(--pqh-muted);font-weight:500;font-size:13px}
.parr-filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.parr-filters label{font-size:11px;font-weight:700;color:var(--pqh-faint);text-transform:uppercase;letter-spacing:.05em}
.parr-input,.parr-select{height:36px;border:1px solid var(--pqh-line);border-radius:9px;background:var(--pqh-surface);color:var(--pqh-ink);font:inherit;font-size:12.5px;font-weight:550;padding:0 10px;width:76px}
.parr-select{width:auto}
.parr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 13px;border:1px solid var(--pqh-line);border-radius:9px;background:var(--pqh-surface);color:var(--pqh-ink);font-weight:650;font-size:12.5px;text-decoration:none;cursor:pointer}
.parr-btn:hover{background:var(--pqh-tint);border-color:var(--pqh-tint-2);text-decoration:none}
.parr-btn--primary{background:var(--pqh-primary);border-color:var(--pqh-primary);color:#fff}
.parr-btn--sm{min-height:29px;padding:0 10px;font-size:11.5px;border-radius:8px}
.parr-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:14px}
.parr-kpi{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:14px;padding:13px 14px;box-shadow:0 1px 2px rgba(15,34,55,.05)}
.parr-kpi span{display:block;color:var(--pqh-faint);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.parr-kpi b{display:block;margin-top:4px;font-size:24px;font-weight:800;letter-spacing:-.02em}
.parr-card{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:16px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);padding:16px}
.parr-table{width:100%;border-collapse:collapse;font-size:12.5px}
.parr-table th{text-align:left;color:var(--pqh-faint);font-size:10.5px;font-weight:750;text-transform:uppercase;letter-spacing:.05em;padding:9px 10px;border-bottom:1px solid var(--pqh-line);white-space:nowrap}
.parr-table td{padding:10px;border-bottom:1px solid var(--pqh-line);vertical-align:top}
.parr-table tr:last-child td{border-bottom:0}
.parr-table tr:hover td{background:var(--pqh-tint)}
.parr-name{font-weight:700}
.parr-muted{color:var(--pqh-muted);font-size:11.5px;font-weight:500}
.parr-chip{display:inline-flex;align-items:center;gap:5px;min-height:22px;padding:1px 9px;border-radius:999px;font-size:11px;font-weight:700}
.parr-chip--high{background:#fbe9e7;color:#c0392b}
.parr-chip--medium{background:#faf1dd;color:#b7791f}
.parr-chip--ok{background:#e8f4ec;color:#2e7d4f}
.parr-reason{display:inline-block;margin:2px 4px 0 0;padding:1px 8px;border-radius:999px;background:var(--pqh-bg);color:var(--pqh-muted);font-size:11px;font-weight:600}
.parr-actions{display:flex;gap:5px;flex-wrap:wrap}
.parr-inline{display:inline}
.parr-note{width:130px;height:29px;border:1px solid var(--pqh-line);border-radius:8px;padding:0 8px;font:inherit;font-size:11.5px}
.parr-empty{border:1px dashed var(--pqh-line);border-radius:14px;padding:26px;text-align:center;color:var(--pqh-muted);font-weight:550}
.parr-empty strong{display:block;color:var(--pqh-ink);font-weight:750;margin-bottom:3px}
@media(max-width:880px){
  .parr-table thead{display:none}
  .parr-table,.parr-table tbody,.parr-table tr,.parr-table td{display:block;width:100%}
  .parr-table td{border-bottom:0;padding:5px 10px}
  .parr-table tr{border-bottom:1px solid var(--pqh-line);padding:8px 0}
}
@media print{.parr-filters,.parr-actions,.parr-btn{display:none!important}.parr-shell{background:#fff;padding:0}.parr-card{box-shadow:none}}
</style>
<main class="parr-shell">
  <div class="parr-wrap">
    <p class="parr-crumbs"><a href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', $urlparams))->out(false); ?>">Dashboard</a> › <a href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a> › At-risk students</p>
    <div class="parr-head">
      <div>
        <h1>At-risk students</h1>
        <p>Rules: no login ≥ <?php echo $inactivedays; ?>d · attendance &lt; <?php echo $attendthreshold; ?>% (30d) · ≥ <?php echo $missedthreshold; ?> classes missed (30d)<?php echo $canmanage ? '' : ' · scoped to your students'; ?></p>
      </div>
      <form class="parr-filters" method="get">
        <?php foreach ($urlparams as $pk => $pv): ?><input type="hidden" name="<?php echo s((string)$pk); ?>" value="<?php echo s((string)$pv); ?>"><?php endforeach; ?>
        <label for="parr-inactive">No login ≥</label>
        <input class="parr-input" id="parr-inactive" type="number" name="inactivedays" min="3" max="90" value="<?php echo $inactivedays; ?>">
        <label for="parr-attend">Attend &lt;</label>
        <input class="parr-input" id="parr-attend" type="number" name="attendthreshold" min="10" max="100" value="<?php echo $attendthreshold; ?>">
        <label for="parr-missed">Missed ≥</label>
        <input class="parr-input" id="parr-missed" type="number" name="missedthreshold" min="1" max="20" value="<?php echo $missedthreshold; ?>">
        <select class="parr-select" name="risklevel" aria-label="Risk level">
          <option value="">All levels</option>
          <option value="high" <?php echo $risklevelfilter === 'high' ? 'selected' : ''; ?>>High</option>
          <option value="medium" <?php echo $risklevelfilter === 'medium' ? 'selected' : ''; ?>>Medium</option>
        </select>
        <button class="parr-btn parr-btn--primary" type="submit">Apply</button>
        <a class="parr-btn" href="<?php echo (new moodle_url($pageurl, ['export' => 'csv']))->out(false); ?>">Export CSV</a>
        <a class="parr-btn" href="javascript:window.print()">Print</a>
      </form>
    </div>

    <div class="parr-kpis">
      <div class="parr-kpi"><span>High risk</span><b style="color:#c0392b"><?php echo $highcount; ?></b></div>
      <div class="parr-kpi"><span>Medium risk</span><b style="color:#b7791f"><?php echo $mediumcount; ?></b></div>
      <div class="parr-kpi"><span>Students monitored</span><b><?php echo count($population); ?></b></div>
      <div class="parr-kpi"><span>Reviewed · 7d</span><b><?php echo $reviewedweek; ?></b></div>
    </div>

    <div class="parr-card">
      <?php if (!$atrisk): ?>
        <div class="parr-empty"><strong>No students match the current rules 🎉</strong>Loosen the thresholds above to widen the net, or export the full population from the workspace people page.</div>
      <?php else: ?>
        <table class="parr-table">
          <thead><tr><th>Student</th><th>Teacher</th><th>Risk</th><th>Reasons</th><th>Last activity</th><th>Attend. 30d</th><th>Missed</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <?php foreach ($atrisk as $row): ?>
              <tr>
                <td><span class="parr-name"><?php echo s($row['name']); ?></span><br><span class="parr-muted"><?php echo $row['account'] !== '' ? '#' . s($row['account']) : 'No account no.'; ?></span></td>
                <td class="parr-muted"><?php echo s($row['teacher']); ?></td>
                <td><span class="parr-chip parr-chip--<?php echo $row['level']; ?>"><?php echo $row['level'] === 'high' ? 'High' : 'Medium'; ?></span></td>
                <td><?php foreach ($row['reasons'] as $reason): ?><span class="parr-reason"><?php echo s($reason); ?></span><?php endforeach; ?>
                  <?php if ($row['note'] !== ''): ?><br><span class="parr-muted">Note: <?php echo s($row['note']); ?></span><?php endif; ?></td>
                <td class="parr-muted"><?php echo $row['lastaccess'] > 0 ? s(userdate($row['lastaccess'], get_string('strftimedateshort'))) : 'Never'; ?></td>
                <td class="parr-muted"><?php echo $row['rate'] !== null ? $row['rate'] . '%' : '—'; ?></td>
                <td class="parr-muted"><?php echo (int)$row['missed']; ?></td>
                <td><?php echo $row['reviewedat'] > 0 ? '<span class="parr-chip parr-chip--ok">Reviewed ' . s(userdate($row['reviewedat'], get_string('strftimedateshort'))) . '</span>' : '<span class="parr-muted">Not reviewed</span>'; ?></td>
                <td>
                  <div class="parr-actions">
                    <a class="parr-btn parr-btn--sm" href="<?php echo pqh_live_schedule_link((int)$row['id'])->out(false); ?>">Schedule</a>
                    <a class="parr-btn parr-btn--sm" href="<?php echo pqh_live_summaries_link((int)$row['id'])->out(false); ?>">Summaries</a>
                    <form class="parr-inline" method="post">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <input type="hidden" name="action" value="mark_reviewed">
                      <input type="hidden" name="studentid" value="<?php echo (int)$row['id']; ?>">
                      <?php foreach ($urlparams as $pk => $pv): ?><input type="hidden" name="<?php echo s((string)$pk); ?>" value="<?php echo s((string)$pv); ?>"><?php endforeach; ?>
                      <button class="parr-btn parr-btn--sm" type="submit">Reviewed ✓</button>
                    </form>
                  </div>
                  <form class="parr-inline" method="post" style="display:flex;gap:5px;margin-top:5px">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="add_note">
                    <input type="hidden" name="studentid" value="<?php echo (int)$row['id']; ?>">
                    <?php foreach ($urlparams as $pk => $pv): ?><input type="hidden" name="<?php echo s((string)$pk); ?>" value="<?php echo s((string)$pv); ?>"><?php endforeach; ?>
                    <input class="parr-note" type="text" name="note" placeholder="Intervention note…" maxlength="500">
                    <button class="parr-btn parr-btn--sm" type="submit">Save</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>
</main>
<?php
echo $OUTPUT->footer();
