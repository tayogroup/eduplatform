<?php
// ---- report: quality-analytics (QA reviews & coaching analytics; read-only) ----
// Ported from local_hubredirect/live_quality_analytics.php via
// live_quality_analytics_portallib (pqlqal_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the QA analytics dataset the legacy page renders (KPI metrics,
//        teacher performance rollup, monthly trend, checklist concerns,
//        needs-attention risk rows, reminder-audit count) with the page's own
//        filters (from, to, teacherid, workspaceid).
// POST = rejected with 400: the legacy page is read-only (its only non-render
//        path is the export=teachers CSV, which the portal page builds
//        client-side from the same teacher rows).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_quality_analytics_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same entry gate as the page: pqh_require_academy_operations(...) checks
// pqh_can_manage_academy_operations and denies with this exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view QA analytics.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'QA analytics is read-only.');
}

// -- GET: the QA analytics dataset (same filter parsing as the page) --
$now = time();
$defaultfrom = usergetmidnight($now - (90 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlqal_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlqal_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
$ready = pqlqal_ready();
$coachingready = pqlqal_column_exists('local_prequran_live_session', 'qa_coaching_status');
$leadershipready = pqlqal_column_exists('local_prequran_live_session', 'leadership_review_status');

$where = [
    's.scheduled_start >= :fromtime',
    's.scheduled_start <= :totime',
    's.status <> :cancelled',
];
$params = [
    'fromtime' => $from,
    'totime' => $to,
    'cancelled' => 'cancelled',
];
if ($teacherid > 0) {
    $where[] = 's.teacherid = :teacherid';
    $params['teacherid'] = $teacherid;
}
if ($ready && $workspaceid > 0 && pqlqal_column_exists('local_prequran_live_session', 'workspaceid')) {
    $where[] = 's.workspaceid = :workspaceid';
    $params['workspaceid'] = $workspaceid;
}
$wheresql = implode(' AND ', $where);

$sessions = [];
$teacherrows = [];
$trendrows = [];
$riskrows = [];
$concerns = [];
$metrics = [
    'sessions' => 0,
    'reviewed' => 0,
    'average_score' => 0,
    'passed' => 0,
    'needs_coaching' => 0,
    'serious_issue' => 0,
    'coaching_open' => 0,
    'coaching_completed' => 0,
    'coaching_overdue' => 0,
    'leadership_open' => 0,
    'reminders' => 0,
];

if ($ready) {
    $coachingselect = $coachingready
        ? 's.qa_coaching_status, s.qa_coaching_priority, s.qa_coaching_due_date, s.qa_coaching_ackat, s.qa_coaching_completedat,'
        : "'none' AS qa_coaching_status, 'normal' AS qa_coaching_priority, 0 AS qa_coaching_due_date, 0 AS qa_coaching_ackat, 0 AS qa_coaching_completedat,";
    $leadershipselect = $leadershipready
        ? 's.leadership_review_status, s.leadership_review_reason, s.leadership_reviewat, s.leadership_clearedat,'
        : "'none' AS leadership_review_status, '' AS leadership_review_reason, 0 AS leadership_reviewat, 0 AS leadership_clearedat,";
    $sessions = array_values($DB->get_records_sql(
        "SELECT s.id, s.title, s.teacherid, s.scheduled_start, s.scheduled_end, s.status,
                s.qa_status, s.qa_score, s.qa_checklist, s.qa_reviewedby, s.qa_reviewedat,
                {$coachingselect}
                {$leadershipselect}
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       ORDER BY s.scheduled_start DESC, s.id DESC",
        $params,
        0,
        1000
    ));

    $scoretotal = 0;
    $reviewedcount = 0;
    $concernmap = [];
    foreach (pqlqal_items() as $key => $label) {
        $concernmap[$key] = ['key' => $key, 'label' => $label, 'concern' => 0, 'checked' => 0];
    }

    foreach ($sessions as $session) {
        $metrics['sessions']++;
        $qastatus = (string)($session->qa_status ?? 'not_reviewed');
        $reviewed = $qastatus !== 'not_reviewed' && (int)($session->qa_reviewedat ?? 0) > 0;
        if ($reviewed) {
            $reviewedcount++;
            $scoretotal += (int)$session->qa_score;
        }
        $metrics['reviewed'] += $reviewed ? 1 : 0;
        $metrics['passed'] += $qastatus === 'passed' ? 1 : 0;
        $metrics['needs_coaching'] += $qastatus === 'needs_coaching' ? 1 : 0;
        $metrics['serious_issue'] += $qastatus === 'serious_issue' ? 1 : 0;
        $coachingstatus = (string)($session->qa_coaching_status ?? 'none');
        $metrics['coaching_open'] += in_array($coachingstatus, ['assigned', 'acknowledged'], true) ? 1 : 0;
        $metrics['coaching_completed'] += $coachingstatus === 'completed' ? 1 : 0;
        $metrics['coaching_overdue'] += in_array($coachingstatus, ['assigned', 'acknowledged'], true)
            && (int)($session->qa_coaching_due_date ?? 0) > 0
            && (int)$session->qa_coaching_due_date < $now ? 1 : 0;
        $metrics['leadership_open'] += in_array((string)($session->leadership_review_status ?? 'none'), ['flagged', 'in_review'], true) ? 1 : 0;

        foreach (pqlqal_decode_checklist((string)$session->qa_checklist) as $key => $value) {
            if (!isset($concernmap[$key]) || $value === 'not_applicable' || $value === 'not_checked') {
                continue;
            }
            $concernmap[$key]['checked']++;
            if ($value === 'concern') {
                $concernmap[$key]['concern']++;
            }
        }
    }
    $metrics['average_score'] = $reviewedcount > 0 ? (int)round($scoretotal / $reviewedcount) : 0;

    $concerns = array_values($concernmap);
    usort($concerns, static function(array $a, array $b): int {
        $arate = pqlqal_percent((int)$a['concern'], (int)$a['checked']);
        $brate = pqlqal_percent((int)$b['concern'], (int)$b['checked']);
        if ($arate === $brate) {
            return ((int)$b['concern']) <=> ((int)$a['concern']);
        }
        return $brate <=> $arate;
    });

    $teacherleadershipselect = $leadershipready
        ? "SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open_count,"
        : "0 AS leadership_open_count,";
    $teacherrows = array_values($DB->get_records_sql(
        "SELECT s.teacherid,
                COUNT(1) AS session_count,
                SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_count,
                ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_score,
                SUM(CASE WHEN s.qa_status = 'passed' THEN 1 ELSE 0 END) AS passed_count,
                SUM(CASE WHEN s.qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
                SUM(CASE WHEN s.qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
                SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open_count,
                SUM(CASE WHEN s.qa_coaching_status = 'completed' THEN 1 ELSE 0 END) AS coaching_completed_count,
                SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') AND s.qa_coaching_due_date > 0 AND s.qa_coaching_due_date < :nowtime THEN 1 ELSE 0 END) AS coaching_overdue_count,
                {$teacherleadershipselect}
                0 AS placeholder_col
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       GROUP BY s.teacherid
       ORDER BY avg_score ASC, serious_issue_count DESC, needs_coaching_count DESC, session_count DESC",
        $params + ['nowtime' => $now],
        0,
        100
    ));

    $trendrows = array_values($DB->get_records_sql(
        "SELECT YEAR(FROM_UNIXTIME(s.scheduled_start)) AS y,
                MONTH(FROM_UNIXTIME(s.scheduled_start)) AS m,
                COUNT(1) AS session_count,
                SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_count,
                ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_score,
                SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS issue_count
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       GROUP BY YEAR(FROM_UNIXTIME(s.scheduled_start)), MONTH(FROM_UNIXTIME(s.scheduled_start))
       ORDER BY y DESC, m DESC",
        $params,
        0,
        24
    ));

    $riskleadershipselect = $leadershipready
        ? 's.leadership_review_status, s.leadership_review_reason,'
        : "'none' AS leadership_review_status, '' AS leadership_review_reason,";
    $riskleadershipwhere = $leadershipready ? "OR s.leadership_review_status IN ('flagged', 'in_review')" : "";
    $riskrows = array_values($DB->get_records_sql(
        "SELECT s.id, s.title, s.teacherid, s.scheduled_start, s.qa_status, s.qa_score,
                s.qa_coaching_status, s.qa_coaching_due_date, s.qa_coaching_priority,
                {$riskleadershipselect}
                0 AS placeholder_col
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
            AND (
                s.qa_status IN ('needs_coaching', 'serious_issue')
                OR s.qa_score < 75
                OR (s.qa_coaching_status IN ('assigned', 'acknowledged') AND s.qa_coaching_due_date > 0 AND s.qa_coaching_due_date < :nowtime)
                {$riskleadershipwhere}
            )
       ORDER BY CASE WHEN s.qa_status = 'serious_issue' THEN 1 WHEN s.qa_coaching_due_date > 0 AND s.qa_coaching_due_date < :nowtime2 THEN 2 ELSE 3 END,
                s.qa_score ASC,
                s.scheduled_start DESC",
        $params + ['nowtime' => $now, 'nowtime2' => $now],
        0,
        50
    ));

    $reminderwheresql = "s.scheduled_start >= :reminder_session_from
            AND s.scheduled_start <= :reminder_session_to
            AND s.status <> :reminder_session_cancelled";
    $reminderparams = [
        'reminder_audit_from' => $from,
        'reminder_audit_to' => $to,
        'reminder_session_from' => $from,
        'reminder_session_to' => $to,
        'reminder_session_cancelled' => 'cancelled',
    ];
    if ($ready && $workspaceid > 0 && pqlqal_column_exists('local_prequran_live_session', 'workspaceid')) {
        $reminderwheresql .= ' AND s.workspaceid = :reminder_workspaceid';
        $reminderparams['reminder_workspaceid'] = $workspaceid;
    }

    $metrics['reminders'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('quality_review_reminder_sent', 'quality_coaching_teacher_reminder_sent', 'quality_coaching_admin_escalated', 'quality_coaching_overdue')
            AND timecreated >= :reminder_audit_from
            AND timecreated <= :reminder_audit_to
            AND sessionid IN (SELECT s.id FROM {local_prequran_live_session} s WHERE {$reminderwheresql})",
        $reminderparams
    );
}

$nameids = [];
foreach ($teacherrows as $row) {
    $nameids[] = (int)$row->teacherid;
}
foreach ($riskrows as $row) {
    $nameids[] = (int)$row->teacherid;
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'coachingready' => $coachingready,
    'leadershipready' => $leadershipready,
    'now' => $now,
    'filters' => [
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'teacherid' => $teacherid,
        'workspaceid' => $workspaceid,
    ],
    'metrics' => $metrics,
    'teachers' => $teacherrows,
    'trend' => $trendrows,
    'concerns' => $concerns,
    'risks' => $riskrows,
    'items' => pqlqal_items(),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
