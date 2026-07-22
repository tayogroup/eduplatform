<?php
// ---- report: live-improvement-plans (academy-operations teacher improvement
//      plan management console; read-only) --------------------------------
// Ported from local_hubredirect/live_improvement_plans.php via
// live_improvement_plans_portallib (pqlipl_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = the plan console state: 8 metrics, active/overdue/completed plan
//        history, per-teacher improvement trends and the improvement-plan
//        audit trail, workspace-filtered. (Improvement-plan data is written by
//        the already-migrated teacher-workspace console, which acknowledges /
//        updates plans; this page is the read side that manages them.)
// POST = none. The legacy page has zero write blocks (no data_submitted()/
//        action= branches; every button is a link to another admin page). The
//        legacy CSV export (?export=plans) is a GET convenience rebuilt on the
//        client from the same rows, so the portal endpoint stays pure JSON.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_improvement_plans_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Same gate as the page top: pqh_require_academy_operations(...) -> allowed when
// pqh_can_manage_academy_operations(), otherwise pqh_access_denied with this
// exact message.
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view teacher improvement plans.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The legacy console performs no writes — refuse anything sent here so a
    // future client bug cannot silently no-op.
    pqpd_fail(400, 'Teacher improvement plans is read-only; it has no portal write actions.');
}

// -- GET: the improvement-plan console state (queries verbatim from the page) --
$now = time();
$defaultfrom = usergetmidnight($now - (365 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlipl_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlipl_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$mentorid = optional_param('mentorid', 0, PARAM_INT);
$status = optional_param('status', 'open', PARAM_ALPHANUMEXT);
$priority = optional_param('priority', 'all', PARAM_ALPHANUMEXT);
$overdueonly = optional_param('overdue', 0, PARAM_BOOL);
$ready = pqlipl_ready();
// The page resolves the workspace from ?workspaceid= or the consumer context;
// the portal client passes it explicitly (consumer-host detection does not
// apply on the Bunny origin).
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);

$plans = [];
$teacherhistory = [];
$audits = [];
$metrics = [
    'open' => 0,
    'assigned' => 0,
    'inprogress' => 0,
    'overdue' => 0,
    'completed' => 0,
    'due7' => 0,
    'alerts7' => 0,
    'teachers' => 0,
];

if ($ready) {
    $workspacefilter = '';
    $workspacefilteralias = '';
    $workspacewherealias = '';
    $workspaceparams = [];
    if ($workspaceid > 0 && pqlipl_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilter = ' AND workspaceid = :workspaceid';
        $workspacefilteralias = ' AND s.workspaceid = :workspaceid';
        $workspacewherealias = 's.workspaceid = :workspaceid';
        $workspaceparams = ['workspaceid' => $workspaceid];
    }

    $where = [
        's.improvement_plan_status <> :nostatus',
        'COALESCE(NULLIF(s.improvement_plan_assignedat, 0), s.scheduled_start) >= :fromtime',
        'COALESCE(NULLIF(s.improvement_plan_assignedat, 0), s.scheduled_start) <= :totime',
    ];
    $params = [
        'nostatus' => 'none',
        'fromtime' => $from,
        'totime' => $to,
    ];
    if ($workspacewherealias !== '') {
        $where[] = $workspacewherealias;
        $params = array_merge($params, $workspaceparams);
    }
    if ($teacherid > 0) {
        $where[] = 's.teacherid = :teacherid';
        $params['teacherid'] = $teacherid;
    }
    if ($mentorid > 0) {
        $where[] = 's.improvement_plan_mentorid = :mentorid';
        $params['mentorid'] = $mentorid;
    }
    if ($status === 'open') {
        $where[] = "s.improvement_plan_status IN ('assigned', 'in_progress')";
    } else if (in_array($status, ['assigned', 'in_progress', 'completed'], true)) {
        $where[] = 's.improvement_plan_status = :planstatus';
        $params['planstatus'] = $status;
    }
    if (in_array($priority, ['high', 'normal', 'low'], true)) {
        $where[] = 's.improvement_plan_priority = :priority';
        $params['priority'] = $priority;
    }
    if ($overdueonly) {
        $where[] = "s.improvement_plan_status IN ('assigned', 'in_progress')";
        $where[] = 's.improvement_plan_due_date > 0';
        $where[] = 's.improvement_plan_due_date < :nowtime';
        $params['nowtime'] = $now;
    }
    $wheresql = implode(' AND ', $where);

    $plans = array_values($DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_audit} a WHERE a.sessionid = s.id AND a.action IN ('improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_overdue', 'improvement_plan_admin_escalated')) AS plan_alert_count
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       ORDER BY CASE s.improvement_plan_status
                    WHEN 'assigned' THEN 1
                    WHEN 'in_progress' THEN 2
                    WHEN 'completed' THEN 3
                    ELSE 4
                END,
                CASE s.improvement_plan_priority
                    WHEN 'high' THEN 1
                    WHEN 'normal' THEN 2
                    ELSE 3
                END,
                s.improvement_plan_due_date ASC,
                s.improvement_plan_assignedat DESC,
                s.id DESC",
        $params,
        0,
        300
    ));

    $metrics['open'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE improvement_plan_status IN ('assigned', 'in_progress'){$workspacefilter}",
        $workspaceparams
    );
    $metrics['assigned'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE improvement_plan_status = :status{$workspacefilter}",
        array_merge(['status' => 'assigned'], $workspaceparams)
    );
    $metrics['inprogress'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE improvement_plan_status = :status{$workspacefilter}",
        array_merge(['status' => 'in_progress'], $workspaceparams)
    );
    $metrics['completed'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE improvement_plan_status = :status{$workspacefilter}",
        array_merge(['status' => 'completed'], $workspaceparams)
    );
    $metrics['overdue'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE improvement_plan_status IN ('assigned', 'in_progress')
            AND improvement_plan_due_date > 0
            AND improvement_plan_due_date < :nowtime{$workspacefilter}",
        array_merge(['nowtime' => $now], $workspaceparams)
    );
    $metrics['due7'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE improvement_plan_status IN ('assigned', 'in_progress')
            AND improvement_plan_due_date BETWEEN :nowtime AND :untiltime{$workspacefilter}",
        array_merge(['nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS)], $workspaceparams)
    );
    $alertsworkspacefilter = $workspacefilteralias !== ''
        ? " AND sessionid IN (SELECT s.id FROM {local_prequran_live_session} s WHERE 1 = 1{$workspacefilteralias})"
        : '';
    $metrics['alerts7'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('improvement_plan_teacher_reminder_sent', 'improvement_plan_due_soon_sent', 'improvement_plan_overdue', 'improvement_plan_admin_escalated')
            AND timecreated >= :fromtime{$alertsworkspacefilter}",
        array_merge(['fromtime' => $now - (7 * DAYSECS)], $workspaceparams)
    );
    $metrics['teachers'] = (int)$DB->count_records_sql(
        "SELECT COUNT(DISTINCT teacherid)
           FROM {local_prequran_live_session}
          WHERE improvement_plan_status <> :none{$workspacefilter}",
        array_merge(['none' => 'none'], $workspaceparams)
    );

    $teacherhistory = array_values($DB->get_records_sql(
        "SELECT s.teacherid,
                COUNT(1) AS plan_count,
                SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS open_count,
                SUM(CASE WHEN s.improvement_plan_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') AND s.improvement_plan_due_date > 0 AND s.improvement_plan_due_date < :nowtime THEN 1 ELSE 0 END) AS overdue_count,
                ROUND(AVG(CASE WHEN s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
                SUM(CASE WHEN s.qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
                SUM(CASE WHEN s.qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
                MAX(COALESCE(NULLIF(s.improvement_plan_completedat, 0), NULLIF(s.improvement_plan_assignedat, 0), s.scheduled_start)) AS latest_plan_time
           FROM {local_prequran_live_session} s
          WHERE s.improvement_plan_status <> :none{$workspacefilteralias}
       GROUP BY s.teacherid
       ORDER BY open_count DESC, overdue_count DESC, latest_plan_time DESC",
        array_merge(['nowtime' => $now, 'none' => 'none'], $workspaceparams),
        0,
        100
    ));

    $audits = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action IN (
              'improvement_plan_assigned',
              'improvement_plan_updated',
              'improvement_plan_acknowledged',
              'improvement_plan_completed',
              'improvement_plan_reopened',
              'improvement_plan_teacher_reminder_sent',
              'improvement_plan_due_soon_sent',
              'improvement_plan_overdue',
              'improvement_plan_admin_escalated'
          )
            {$alertsworkspacefilter}
       ORDER BY timecreated DESC, id DESC",
        $workspaceparams,
        0,
        80
    ));
}

// Names for everyone the page renders via pqlip_user_name (plan/history
// teachers, audit actors).
$nameids = [];
foreach ($plans as $plan) {
    $nameids[] = (int)($plan->teacherid ?? 0);
}
foreach ($teacherhistory as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}
foreach ($audits as $audit) {
    $nameids[] = (int)($audit->actorid ?? 0);
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'now' => $now,
    'workspaceid' => $workspaceid,
    'filters' => [
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'teacherid' => $teacherid,
        'mentorid' => $mentorid,
        'status' => $status,
        'priority' => $priority,
        'overdue' => $overdueonly ? 1 : 0,
    ],
    'metrics' => $metrics,
    'plans' => array_values($plans),
    'teacherhistory' => array_values($teacherhistory),
    'audits' => array_values($audits),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
