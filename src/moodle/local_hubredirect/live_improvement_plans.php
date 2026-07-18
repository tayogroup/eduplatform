<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
} else if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $urlparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$dashboardpath = !empty($urlparams['workspaceid']) ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php';
$dashboardurl = new moodle_url($dashboardpath, $urlparams);

pqh_require_academy_operations(
    'Only academy operations users can view teacher improvement plans.',
    $dashboardurl,
    'Teacher improvement plan access required'
);

function pqlip_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlip_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlip_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlip_ready(): bool {
    return pqlip_table_exists('local_prequran_live_session')
        && pqlip_table_exists('local_prequran_live_audit')
        && pqlip_column_exists('local_prequran_live_session', 'improvement_plan_status')
        && pqlip_column_exists('local_prequran_live_session', 'qa_status')
        && pqlip_column_exists('local_prequran_live_session', 'leadership_review_status');
}

function pqlip_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlip_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlip_short(string $value, int $max = 170): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlip_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqlip_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_improvement_plans.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Improvement Plans');
$PAGE->set_heading('Teacher Improvement Plans');
$PAGE->add_body_class('pqh-live-improvement-page');

$now = time();
$defaultfrom = usergetmidnight($now - (365 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlip_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlip_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$mentorid = optional_param('mentorid', 0, PARAM_INT);
$status = optional_param('status', 'open', PARAM_ALPHANUMEXT);
$priority = optional_param('priority', 'all', PARAM_ALPHANUMEXT);
$overdueonly = optional_param('overdue', 0, PARAM_BOOL);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$ready = pqlip_ready();
$workspaceid = (int)($urlparams['workspaceid'] ?? 0);
if ($workspaceid > 0 && !pqh_consumer_context_allows_workspace($consumercontext, $workspaceid)) {
    pqh_access_denied(
        'This workspace is not available for the current institution.',
        $dashboardurl,
        'Workspace access required'
    );
}

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
    if (pqlip_column_exists('local_prequran_live_session', 'workspaceid')) {
        if ($workspaceid > 0) {
            $workspacefilter = ' AND workspaceid = :workspaceid';
            $workspacefilteralias = ' AND s.workspaceid = :workspaceid';
            $workspacewherealias = 's.workspaceid = :workspaceid';
            $workspaceparams['workspaceid'] = $workspaceid;
        } else if (!pqh_context_is_platform_foundation($consumercontext)) {
            $workspaceids = pqh_consumer_context_workspace_ids($consumercontext);
            if ($workspaceids) {
                [$workspacesql, $workspaceparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'lipworkspace');
                $workspacefilter = " AND workspaceid {$workspacesql}";
                $workspacefilteralias = " AND s.workspaceid {$workspacesql}";
                $workspacewherealias = "s.workspaceid {$workspacesql}";
            } else {
                $workspacefilter = ' AND 1 = 0';
                $workspacefilteralias = ' AND 1 = 0';
                $workspacewherealias = '1 = 0';
            }
        }
    } else if (!pqh_context_is_platform_foundation($consumercontext)) {
        $workspacefilter = ' AND 1 = 0';
        $workspacefilteralias = ' AND 1 = 0';
        $workspacewherealias = '1 = 0';
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

if ($ready && $export === 'plans') {
    $rows = [];
    foreach ($plans as $plan) {
        $rows[] = [
            (int)$plan->id,
            (string)$plan->title,
            (int)$plan->teacherid,
            pqlip_user_name((int)$plan->teacherid, 'Teacher ' . (int)$plan->teacherid),
            (int)$plan->improvement_plan_mentorid,
            (int)$plan->student_count,
            (string)$plan->qa_status,
            (int)$plan->qa_score,
            (string)$plan->leadership_review_status,
            (string)$plan->improvement_plan_status,
            (string)$plan->improvement_plan_priority,
            !empty($plan->improvement_plan_assignedat) ? userdate((int)$plan->improvement_plan_assignedat, get_string('strftimedatetimeshort')) : '',
            !empty($plan->improvement_plan_ackat) ? userdate((int)$plan->improvement_plan_ackat, get_string('strftimedatetimeshort')) : '',
            !empty($plan->improvement_plan_due_date) ? userdate((int)$plan->improvement_plan_due_date, get_string('strftimedatetimeshort')) : '',
            !empty($plan->improvement_plan_completedat) ? userdate((int)$plan->improvement_plan_completedat, get_string('strftimedatetimeshort')) : '',
            (string)$plan->improvement_plan_goals,
            (string)$plan->improvement_plan_actions,
            (string)($plan->improvement_plan_completion_notes ?? ''),
        ];
    }
    pqlip_csv('quraan-teacher-improvement-plans.csv', ['sessionid', 'title', 'teacherid', 'teacher', 'mentorid', 'students', 'qa_status', 'qa_score', 'leadership_status', 'plan_status', 'priority', 'assigned_at', 'acknowledged_at', 'due_date', 'completed_at', 'goals', 'actions', 'completion_notes'], $rows);
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-improvement-page header,
body.pqh-live-improvement-page footer,
body.pqh-live-improvement-page nav.navbar,
body.pqh-live-improvement-page #page-header,
body.pqh-live-improvement-page #page-footer,
body.pqh-live-improvement-page .drawer,
body.pqh-live-improvement-page .drawer-toggles,
body.pqh-live-improvement-page .block-region,
body.pqh-live-improvement-page [data-region="drawer"],
body.pqh-live-improvement-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-improvement-page #page,
body.pqh-live-improvement-page #page-content,
body.pqh-live-improvement-page #region-main,
body.pqh-live-improvement-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlip-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlip-wrap{max-width:1260px;margin:0 auto}
.pqlip-top,.pqlip-panel,.pqlip-card{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlip-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlip-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlip-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlip-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlip-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlip-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlip-filters{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin-bottom:12px}
.pqlip-field{display:grid;gap:6px}
.pqlip-field label{font-size:12px;font-weight:900;color:#415665}
.pqlip-input,.pqlip-select{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.25 system-ui;background:#fff;color:#173044}
.pqlip-check{display:flex;align-items:center;gap:8px;min-height:38px;font-weight:850;color:#415665}
.pqlip-metrics{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px;margin:16px 0}
.pqlip-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlip-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlip-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlip-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}
.pqlip-grid--single{display:grid;gap:14px}
.pqlip-panel h2,.pqlip-card h2{margin:0 0 12px;font-size:20px;font-weight:950}
.pqlip-list{display:grid;gap:12px}
.pqlip-card-head{display:flex;justify-content:space-between;gap:14px;margin-bottom:10px}
.pqlip-card h3{margin:0;font-size:18px;font-weight:950;color:#173044}
.pqlip-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlip-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlip-pill--ok{background:#edf9ef;color:#245c35}
.pqlip-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlip-pill--bad{background:#fff0ed;color:#883526}
.pqlip-kv{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0}
.pqlip-kv div{padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff}
.pqlip-kv strong{display:block;color:#6f4e32;font-size:18px}
.pqlip-kv span{display:block;color:#5e7280;font-size:12px;font-weight:850}
.pqlip-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlip-table th,.pqlip-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlip-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqlip-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlip-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1100px){.pqlip-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlip-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlip-grid{grid-template-columns:1fr}.pqlip-top{display:block}.pqlip-actions{margin-top:12px}.pqlip-table{display:block;overflow:auto}.pqlip-kv{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.pqlip-filters,.pqlip-metrics,.pqlip-kv{grid-template-columns:1fr}.pqlip-title{font-size:24px}.pqlip-card-head{display:block}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlip-shell">
  <div class="pqlip-wrap">
    <section class="pqlip-top pqh-workspace-top">
      <div>
        <h1 class="pqlip-title pqh-workspace-title">Teacher Improvement Plans</h1>
        <p class="pqlip-sub pqh-workspace-sub">Review active plans, overdue items, completed history, teacher trends, and improvement-plan audit activity.</p>
      </div>
      <div class="pqlip-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php', $urlparams))->out(false); ?>">Teachers</a>
        <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php', $urlparams))->out(false); ?>">Leadership</a>
        <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', $urlparams))->out(false); ?>">QA analytics</a>
        <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $urlparams))->out(false); ?>">Operations</a>
        <a class="pqlip-btn" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlip-empty">Improvement plan columns are not installed yet. Run Phase 37 SQL first.</div>
    <?php else: ?>
      <section class="pqlip-panel">
        <form method="get">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <div class="pqlip-filters">
            <div class="pqlip-field"><label for="from">From</label><input class="pqlip-input" id="from" name="from" type="date" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
            <div class="pqlip-field"><label for="to">To</label><input class="pqlip-input" id="to" name="to" type="date" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
            <div class="pqlip-field"><label for="teacherid">Teacher ID</label><input class="pqlip-input" id="teacherid" name="teacherid" type="number" min="0" value="<?php echo (int)$teacherid; ?>"></div>
            <div class="pqlip-field"><label for="mentorid">Mentor ID</label><input class="pqlip-input" id="mentorid" name="mentorid" type="number" min="0" value="<?php echo (int)$mentorid; ?>"></div>
            <div class="pqlip-field"><label for="status">Status</label><select class="pqlip-select" id="status" name="status">
              <?php foreach (['open' => 'Open plans', 'assigned' => 'Assigned', 'in_progress' => 'In progress', 'completed' => 'Completed', 'all' => 'All'] as $value => $label): ?>
                <option value="<?php echo s($value); ?>" <?php echo $status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select></div>
            <div class="pqlip-field"><label for="priority">Priority</label><select class="pqlip-select" id="priority" name="priority">
              <?php foreach (['all' => 'All', 'high' => 'High', 'normal' => 'Normal', 'low' => 'Low'] as $value => $label): ?>
                <option value="<?php echo s($value); ?>" <?php echo $priority === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select></div>
            <label class="pqlip-check"><input type="checkbox" name="overdue" value="1" <?php echo $overdueonly ? 'checked' : ''; ?>> Overdue only</label>
          </div>
          <div class="pqlip-actions pqh-workspace-actions">
            <button class="pqlip-btn" type="submit">Apply filters</button>
            <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', $urlparams))->out(false); ?>">Reset</a>
            <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', pqlip_url_params($urlparams, ['from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'teacherid' => $teacherid, 'mentorid' => $mentorid, 'status' => $status, 'priority' => $priority, 'overdue' => $overdueonly ? 1 : 0, 'export' => 'plans'])))->out(false); ?>">Export CSV</a>
          </div>
        </form>
      </section>

      <section class="pqlip-metrics">
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['open']; ?></strong><span>open plans</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['assigned']; ?></strong><span>assigned</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['inprogress']; ?></strong><span>in progress</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['overdue']; ?></strong><span>overdue</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['completed']; ?></strong><span>completed</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['due7']; ?></strong><span>due next 7d</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['alerts7']; ?></strong><span>alerts 7d</span></div>
        <div class="pqlip-metric"><strong><?php echo (int)$metrics['teachers']; ?></strong><span>teachers</span></div>
      </section>

      <section class="pqlip-grid">
        <article class="pqlip-panel">
          <h2>Improvement Plan History</h2>
          <div class="pqlip-list">
            <?php foreach ($plans as $plan): ?>
              <?php
                $overdue = in_array((string)$plan->improvement_plan_status, ['assigned', 'in_progress'], true)
                    && !empty($plan->improvement_plan_due_date)
                    && (int)$plan->improvement_plan_due_date < $now;
                $pillclass = (string)$plan->improvement_plan_status === 'completed' ? 'pqlip-pill--ok' : ($overdue ? 'pqlip-pill--bad' : 'pqlip-pill--warn');
              ?>
              <article class="pqlip-card">
                <div class="pqlip-card-head">
                  <div>
                    <h3><?php echo s((string)$plan->title); ?></h3>
                    <p class="pqlip-meta">#<?php echo (int)$plan->id; ?> - <?php echo s(pqlip_user_name((int)$plan->teacherid, 'Teacher ' . (int)$plan->teacherid)); ?> - <?php echo s(userdate((int)$plan->scheduled_start, get_string('strftimedatetimeshort'))); ?></p>
                  </div>
                  <span class="pqlip-pill <?php echo $pillclass; ?>"><?php echo $overdue ? 'overdue' : s(str_replace('_', ' ', (string)$plan->improvement_plan_status)); ?></span>
                </div>
                <div class="pqlip-kv">
                  <div><strong><?php echo s(str_replace('_', ' ', (string)$plan->improvement_plan_priority)); ?></strong><span>priority</span></div>
                  <div><strong><?php echo (int)$plan->qa_score; ?>%</strong><span>QA score</span></div>
                  <div><strong><?php echo (int)$plan->student_count; ?></strong><span>students</span></div>
                  <div><strong><?php echo (int)$plan->plan_alert_count; ?></strong><span>alerts</span></div>
                </div>
                <p class="pqlip-meta">QA: <?php echo s(str_replace('_', ' ', (string)$plan->qa_status)); ?> - Leadership: <?php echo s(str_replace('_', ' ', (string)$plan->leadership_review_status)); ?></p>
                <p class="pqlip-meta">Assigned: <?php echo !empty($plan->improvement_plan_assignedat) ? s(userdate((int)$plan->improvement_plan_assignedat, get_string('strftimedatetimeshort'))) : 'not recorded'; ?><?php echo !empty($plan->improvement_plan_ackat) ? ' - Acknowledged: ' . s(userdate((int)$plan->improvement_plan_ackat, get_string('strftimedatetimeshort'))) : ''; ?></p>
                <p class="pqlip-meta">Due: <?php echo !empty($plan->improvement_plan_due_date) ? s(userdate((int)$plan->improvement_plan_due_date, get_string('strftimedatetimeshort'))) : 'no due date'; ?><?php echo !empty($plan->improvement_plan_completedat) ? ' - Completed: ' . s(userdate((int)$plan->improvement_plan_completedat, get_string('strftimedatetimeshort'))) : ''; ?></p>
                <?php if (trim((string)$plan->improvement_plan_goals) !== ''): ?><p class="pqlip-meta"><strong>Goals:</strong> <?php echo s(pqlip_short((string)$plan->improvement_plan_goals, 260)); ?></p><?php endif; ?>
                <?php if (trim((string)$plan->improvement_plan_actions) !== ''): ?><p class="pqlip-meta"><strong>Actions:</strong> <?php echo s(pqlip_short((string)$plan->improvement_plan_actions, 260)); ?></p><?php endif; ?>
                <div class="pqlip-actions pqh-workspace-actions">
                  <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', pqlip_url_params($urlparams, ['teacherid' => (int)$plan->teacherid])))->out(false); ?>">Teacher profile</a>
                  <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php', pqlip_url_params($urlparams, ['teacherid' => (int)$plan->teacherid, 'status' => 'all'])))->out(false); ?>">Leadership case</a>
                  <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', pqlip_url_params($urlparams, ['sessionid' => (int)$plan->id])))->out(false); ?>">QA review</a>
                  <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', pqlip_url_params($urlparams, ['sessionid' => (int)$plan->id])))->out(false); ?>">Class review</a>
                  <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_workspace.php', pqlip_url_params($urlparams, ['teacherid' => (int)$plan->teacherid])))->out(false); ?>">Teacher workspace</a>
                </div>
              </article>
            <?php endforeach; ?>
            <?php if (!$plans): ?><div class="pqlip-empty">No improvement plans match these filters.</div><?php endif; ?>
          </div>
        </article>

        <aside class="pqlip-panel">
          <h2>Teacher History</h2>
          <table class="pqlip-table">
            <tr><th>Teacher</th><th>Plans</th><th>Open</th><th>Overdue</th><th>QA</th><th>Action</th></tr>
            <?php foreach ($teacherhistory as $row): ?>
              <tr>
                <td><?php echo s(pqlip_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid)); ?><br><span class="pqlip-code">#<?php echo (int)$row->teacherid; ?></span></td>
                <td><?php echo (int)$row->plan_count; ?><br><span class="pqlip-code"><?php echo (int)$row->completed_count; ?> completed</span></td>
                <td><?php echo (int)$row->open_count; ?></td>
                <td><span class="pqlip-pill <?php echo (int)$row->overdue_count > 0 ? 'pqlip-pill--bad' : 'pqlip-pill--ok'; ?>"><?php echo (int)$row->overdue_count; ?></span></td>
                <td><?php echo (int)$row->avg_qa_score; ?>%<br><span class="pqlip-code"><?php echo (int)$row->needs_coaching_count; ?> coaching, <?php echo (int)$row->serious_issue_count; ?> serious</span></td>
                <td>
                  <div class="pqlip-actions pqh-workspace-actions">
                    <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', pqlip_url_params($urlparams, ['teacherid' => (int)$row->teacherid])))->out(false); ?>">Profile</a>
                    <a class="pqlip-btn pqlip-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', pqlip_url_params($urlparams, ['teacherid' => (int)$row->teacherid, 'status' => 'all'])))->out(false); ?>">Filter</a>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$teacherhistory): ?><tr><td colspan="6">No teacher improvement history yet.</td></tr><?php endif; ?>
          </table>
        </aside>
      </section>

      <section class="pqlip-panel" style="margin-top:16px">
        <h2>Recent Improvement Plan Audit</h2>
        <table class="pqlip-table">
          <tr><th>Time</th><th>Session</th><th>Actor</th><th>Action</th><th>Details</th></tr>
          <?php foreach ($audits as $audit): ?>
            <tr>
              <td><?php echo s(userdate((int)$audit->timecreated, get_string('strftimedatetimeshort'))); ?></td>
              <td>#<?php echo (int)$audit->sessionid; ?></td>
              <td><?php echo (int)$audit->actorid > 0 ? s(pqlip_user_name((int)$audit->actorid, 'User ' . (int)$audit->actorid)) : 'System'; ?></td>
              <td><?php echo s(str_replace('_', ' ', (string)$audit->action)); ?></td>
              <td><span class="pqlip-code"><?php echo s(pqlip_short((string)$audit->details, 260)); ?></span></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$audits): ?><tr><td colspan="5">No improvement plan audit rows yet.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
