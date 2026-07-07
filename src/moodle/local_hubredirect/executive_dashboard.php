<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/governance_analyticslib.php');

function pqexec_money(float $value): string {
    return number_format($value, 2);
}

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Executive analytics require workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Executive dashboard denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';
$start = pqgov_date_to_time(optional_param('start', date('Y-m-01'), PARAM_TEXT));
$end = pqgov_date_to_time(optional_param('end', date('Y-m-d'), PARAM_TEXT), true);
if ($start <= 0) { $start = strtotime('first day of this month 00:00:00') ?: (time() - (30 * DAYSECS)); }
if ($end <= 0) { $end = time(); }

if (optional_param('export', '', PARAM_ALPHA) === 'csv') {
    require_sesskey();
    $metrics = pqgov_exec_metrics($workspaceid, $start, $end);
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . clean_filename('executive-dashboard-' . $workspaceid . '-' . date('Ymd-His') . '.csv') . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['metric', 'value']);
    foreach ($metrics as $key => $value) {
        fputcsv($out, [$key, $value]);
    }
    fclose($out);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqgov_ready()) {
            throw new invalid_parameter_exception('Analytics snapshot table is not ready. Run Moodle upgrade.');
        }
        $metrics = pqgov_exec_metrics($workspaceid, $start, $end);
        $DB->insert_record('local_prequran_analytics_snap', (object)[
            'workspaceid' => $workspaceid,
            'snapshot_type' => 'executive_dashboard',
            'period_start' => $start,
            'period_end' => $end,
            'metricsjson' => pqgov_json($metrics),
            'generatedby' => (int)$USER->id,
            'timecreated' => time(),
        ]);
        $notice = 'Executive analytics snapshot saved.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$metrics = pqgov_exec_metrics($workspaceid, $start, $end);
$snapshots = pqh_table_exists_safe('local_prequran_analytics_snap') ? array_values($DB->get_records('local_prequran_analytics_snap', ['workspaceid' => $workspaceid, 'snapshot_type' => 'executive_dashboard'], 'timecreated DESC', '*', 0, 20)) : [];
$teacherloads = pqh_table_exists_safe('local_prequran_teacher_load') ? array_values($DB->get_records_sql(
    "SELECT l.*, u.firstname, u.lastname
       FROM {local_prequran_teacher_load} l
       LEFT JOIN {user} u ON u.id = l.teacherid
      WHERE l.workspaceid = :workspaceid
        AND l.calculatedat BETWEEN :start AND :end
   ORDER BY l.calculatedat DESC, l.weekly_minutes DESC",
    ['workspaceid' => $workspaceid, 'start' => $start, 'end' => $end],
    0,
    20
)) : [];
$progress = pqh_table_exists_safe('local_prequran_student_path') ? array_values($DB->get_records_sql(
    "SELECT advancement_status, COUNT(1) AS total
       FROM {local_prequran_student_path}
      WHERE workspaceid = :workspaceid
   GROUP BY advancement_status
   ORDER BY total DESC",
    ['workspaceid' => $workspaceid]
)) : [];
$courses = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records_sql(
    "SELECT o.id, o.title, o.status, o.tuition_amount, o.pricing_currency,
            (SELECT COUNT(1) FROM {local_prequran_course_enrol_req} r WHERE r.offeringid = o.id AND r.status IN ('approved','active')) AS enrolled_count,
            (SELECT COALESCE(SUM(CAST(i.paidamount AS DECIMAL(20,2))), 0) FROM {local_prequran_invoice_line} il JOIN {local_prequran_invoice} i ON i.id = il.invoiceid WHERE il.offeringid = o.id) AS collected
       FROM {local_prequran_course_offering} o
      WHERE o.workspaceid = :workspaceid
   ORDER BY o.timemodified DESC",
    ['workspaceid' => $workspaceid],
    0,
    40
)) : [];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/executive_dashboard.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Analytics And Executive Dashboard');
$PAGE->set_heading('Analytics And Executive Dashboard');

echo $OUTPUT->header();
echo '<style>.pqex{max-width:1220px;margin:0 auto}.pqex-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqex-filter{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.pqex-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqex-input{border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqex-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqex-btn--light{background:#f7fbf8;color:#173044}.pqex-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqex-metric{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:13px}.pqex-metric strong{display:block;font-size:24px}.pqex-muted{color:#617064;font-size:12px}.pqex-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqex-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqex-table{width:100%;border-collapse:collapse}.pqex-table th,.pqex-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqex-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqex-bar{height:10px;border-radius:999px;background:#e5ece7;overflow:hidden}.pqex-fill{height:100%;background:#2f6f4e}.pqex-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqex-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}@media(max-width:900px){.pqex-top,.pqex-grid,.pqex-metrics{display:block}.pqex-panel,.pqex-metric{margin-bottom:10px}}</style>';
echo '<div class="pqex"><div class="pqex-top"><div><h2>Analytics And Executive Dashboard</h2><div class="pqex-muted">' . s($workspace->name) . ' enrollment funnel, revenue, AR aging, collections, retention, utilization, progress, and course profitability.</div></div><a class="pqex-btn pqex-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqex-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqex-error">' . s($error) . '</div>'; }
echo '<form method="get" class="pqex-panel pqex-filter"><input type="hidden" name="workspaceid" value="' . (int)$workspaceid . '"><div class="pqex-field"><label>Start</label><input class="pqex-input" name="start" value="' . s(date('Y-m-d', $start)) . '"></div><div class="pqex-field"><label>End</label><input class="pqex-input" name="end" value="' . s(date('Y-m-d', $end)) . '"></div><button class="pqex-btn" type="submit">Apply</button><a class="pqex-btn pqex-btn--light" href="' . (new moodle_url('/local/hubredirect/executive_dashboard.php', $urlparams + ['start' => date('Y-m-d', $start), 'end' => date('Y-m-d', $end), 'export' => 'csv', 'sesskey' => sesskey()]))->out(false) . '">Export CSV</a></form>';
echo '<form method="post" class="pqex-panel"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><button class="pqex-btn">Save Snapshot</button></form>';
echo '<div class="pqex-metrics">';
foreach ([
    'Applications' => $metrics['applications'],
    'Enroll Rate' => $metrics['funnel_enroll_rate'] . '%',
    'Revenue' => pqexec_money((float)$metrics['revenue']),
    'AR Balance' => pqexec_money((float)$metrics['ar_balance']),
    'Retention' => $metrics['retention_rate'] . '%',
    'Teacher Min' => (int)$metrics['teacher_minutes'],
] as $label => $value) {
    echo '<div class="pqex-metric"><strong>' . s((string)$value) . '</strong><span class="pqex-muted">' . s($label) . '</span></div>';
}
echo '</div><div class="pqex-grid"><section class="pqex-panel"><h3>Enrollment Funnel</h3>';
foreach ([['Applications', $metrics['applications'], max(1, (int)$metrics['applications'])], ['Accepted', $metrics['accepted'], max(1, (int)$metrics['applications'])], ['Enrolled', $metrics['enrolled'], max(1, (int)$metrics['applications'])]] as $row) {
    $pct = min(100, round(((float)$row[1] / (float)$row[2]) * 100));
    echo '<div><strong>' . s($row[0]) . ' ' . s((string)$row[1]) . '</strong><div class="pqex-bar"><div class="pqex-fill" style="width:' . (int)$pct . '%"></div></div></div>';
}
echo '</section><section class="pqex-panel"><h3>Revenue, AR Aging, Collections</h3><table class="pqex-table"><tbody>';
foreach (['Revenue' => 'revenue', 'AR balance' => 'ar_balance', 'Overdue AR' => 'ar_overdue', 'Collections' => 'collections'] as $label => $key) {
    echo '<tr><td>' . s($label) . '</td><td><strong>' . s(pqexec_money((float)$metrics[$key])) . '</strong></td></tr>';
}
echo '</tbody></table></section><section class="pqex-panel"><h3>Retention / Churn</h3><table class="pqex-table"><tbody><tr><td>Retention</td><td><span class="pqex-pill">' . s($metrics['retention_rate'] . '%') . '</span></td></tr><tr><td>Churn</td><td><span class="pqex-pill">' . s($metrics['churn_rate'] . '%') . '</span></td></tr><tr><td>Dropped</td><td>' . (int)$metrics['dropped'] . '</td></tr></tbody></table></section><section class="pqex-panel"><h3>Teacher Utilization</h3><table class="pqex-table"><tbody>';
foreach ($teacherloads as $load) { echo '<tr><td><strong>' . s(fullname($load)) . '</strong><div class="pqex-muted">' . (int)$load->active_students . ' students / ' . (int)$load->weekly_sessions . ' sessions</div></td><td><span class="pqex-pill">' . s($load->load_status) . '</span><div class="pqex-muted">' . (int)$load->weekly_minutes . ' min</div></td></tr>'; }
if (!$teacherloads) { echo '<tr><td class="pqex-muted">No teacher utilization snapshots in this period.</td></tr>'; }
echo '</tbody></table></section><section class="pqex-panel"><h3>Student Progress</h3><table class="pqex-table"><tbody>';
foreach ($progress as $row) { echo '<tr><td>' . s($row->advancement_status) . '</td><td><span class="pqex-pill">' . (int)$row->total . '</span></td></tr>'; }
if (!$progress) { echo '<tr><td class="pqex-muted">No student progress rows yet.</td></tr>'; }
echo '</tbody></table></section><section class="pqex-panel"><h3>Course Profitability</h3><table class="pqex-table"><thead><tr><th>Course</th><th>Enrollment</th><th>Collected</th></tr></thead><tbody>';
foreach ($courses as $course) { echo '<tr><td><strong>' . s($course->title) . '</strong><div class="pqex-muted">' . s($course->status . ' / tuition ' . $course->tuition_amount . ' ' . $course->pricing_currency) . '</div></td><td>' . (int)$course->enrolled_count . '</td><td>' . s(pqexec_money((float)$course->collected)) . '</td></tr>'; }
if (!$courses) { echo '<tr><td colspan="3" class="pqex-muted">No course offerings yet.</td></tr>'; }
echo '</tbody></table></section><section class="pqex-panel"><h3>Saved Snapshots</h3><table class="pqex-table"><tbody>';
foreach ($snapshots as $snap) { echo '<tr><td>#' . (int)$snap->id . '<div class="pqex-muted">' . s(userdate((int)$snap->period_start, '%Y-%m-%d') . ' to ' . userdate((int)$snap->period_end, '%Y-%m-%d')) . '</div></td><td>' . s(userdate((int)$snap->timecreated)) . '</td></tr>'; }
if (!$snapshots) { echo '<tr><td class="pqex-muted">No saved snapshots yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
