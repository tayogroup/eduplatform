<?php
// ---- report: executive-dashboard (executive KPI dashboard; read + snapshot write) ----
// Ported from local_hubredirect/executive_dashboard.php via
// executive_dashboard_portallib (pqexec_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = executive KPIs/metrics for the workspace over [start,end] exactly as the
//        page computes them (enrollment funnel, revenue/AR/collections, retention/
//        churn, teacher utilization, student progress, course profitability, saved
//        snapshots) plus teacher display names.
// POST = do=save_snapshot (the page's snapshot insert, verbatim; require_sesskey()
//        dropped — token auth replaces the session key; pqgov_ready() check kept).
// The legacy CSV export (GET export=csv) is not ported server-side — the portal
// page builds the CSV client-side from this JSON.
// (executive_dashboard.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/governance_analyticslib.php');
require_once($CFG->dirroot . '/local/hubredirect/executive_dashboard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same gate as the page (workspace administrator, same denial message) --
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Executive analytics require workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// -- date range resolution (verbatim from the page) --
$start = pqgov_date_to_time(optional_param('start', date('Y-m-01'), PARAM_TEXT));
$end = pqgov_date_to_time(optional_param('end', date('Y-m-d'), PARAM_TEXT), true);
if ($start <= 0) { $start = strtotime('first day of this month 00:00:00') ?: (time() - (30 * DAYSECS)); }
if ($end <= 0) { $end = time(); }

// -- write: save_snapshot (legacy POST snapshot save, verbatim) --
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    if ($do !== 'save_snapshot') {
        pqpd_fail(400, 'Unknown executive-dashboard action.');
    }
    if (!pqgov_ready()) {
        pqpd_fail(400, 'Analytics snapshot table is not ready. Run Moodle upgrade.');
    }
    $metrics = pqgov_exec_metrics($workspaceid, $start, $end);
    $DB->insert_record('local_prequran_analytics_snap', (object)[
        'workspaceid' => $workspaceid,
        'snapshot_type' => 'executive_dashboard',
        'period_start' => $start,
        'period_end' => $end,
        'metricsjson' => pqgov_json($metrics),
        'generatedby' => $userid,
        'timecreated' => time(),
    ]);
    echo json_encode([
        'ok' => true,
        'message' => 'Executive analytics snapshot saved.',
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the executive dashboard state (same queries as the page) --
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

// -- decorate for the client (fullname + money formatting computed server-side,
//    same helpers the page uses inline while rendering) --
$teacherout = [];
foreach ($teacherloads as $load) {
    $teacherout[] = [
        'teacherid' => (int)$load->teacherid,
        'name' => fullname($load),
        'active_students' => (int)$load->active_students,
        'weekly_sessions' => (int)$load->weekly_sessions,
        'weekly_minutes' => (int)$load->weekly_minutes,
        'load_status' => (string)$load->load_status,
    ];
}
$progressout = [];
foreach ($progress as $row) {
    $progressout[] = [
        'advancement_status' => (string)$row->advancement_status,
        'total' => (int)$row->total,
    ];
}
$coursesout = [];
foreach ($courses as $course) {
    $coursesout[] = [
        'id' => (int)$course->id,
        'title' => (string)$course->title,
        'status' => (string)$course->status,
        'tuition_amount' => (string)$course->tuition_amount,
        'pricing_currency' => (string)$course->pricing_currency,
        'enrolled_count' => (int)$course->enrolled_count,
        'collected' => pqexec_money((float)$course->collected),
    ];
}
$snapshotout = [];
foreach ($snapshots as $snap) {
    $snapshotout[] = [
        'id' => (int)$snap->id,
        'period_start' => (int)$snap->period_start,
        'period_end' => (int)$snap->period_end,
        'timecreated' => (int)$snap->timecreated,
    ];
}

// Money-formatted mirror of the page's pqexec_money() tiles/table (2 decimals).
$money = [
    'revenue' => pqexec_money((float)$metrics['revenue']),
    'ar_balance' => pqexec_money((float)$metrics['ar_balance']),
    'ar_overdue' => pqexec_money((float)$metrics['ar_overdue']),
    'collections' => pqexec_money((float)$metrics['collections']),
];

echo json_encode([
    'ok' => true,
    'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)($workspace->name ?? ('Workspace ' . $workspaceid))],
    'filters' => ['start' => date('Y-m-d', $start), 'end' => date('Y-m-d', $end)],
    'metrics' => $metrics,
    'money' => $money,
    'teacherloads' => $teacherout,
    'progress' => $progressout,
    'courses' => $coursesout,
    'snapshots' => $snapshotout,
], JSON_UNESCAPED_SLASHES);
exit;
