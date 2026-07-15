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
    'Only academy operations users can view the teacher directory.',
    $dashboardurl,
    'Teacher directory access required'
);

function pqltd_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltd_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqltd_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqltd_ready(): bool {
    return pqltd_table_exists('local_prequran_live_session')
        && pqltd_table_exists('local_prequran_live_participant');
}

function pqltd_user_name(stdClass $row): string {
    $name = trim(fullname((object)[
        'firstname' => (string)($row->firstname ?? ''),
        'lastname' => (string)($row->lastname ?? ''),
        'firstnamephonetic' => '',
        'lastnamephonetic' => '',
        'middlename' => '',
        'alternatename' => '',
    ]));
    return $name !== '' ? $name : 'Teacher ' . (int)$row->teacherid;
}

function pqltd_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqltd_percent(int $part, int $whole): int {
    return $whole > 0 ? (int)round(($part / $whole) * 100) : 0;
}

function pqltd_csv(string $filename, array $headers, array $rows): void {
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

function pqltd_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_teacher_directory.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Directory');
$PAGE->set_heading('Teacher Directory');
$PAGE->add_body_class('pqh-live-teacher-directory-page');

$now = time();
$defaultfrom = usergetmidnight($now - (180 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqltd_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqltd_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$query = trim(optional_param('q', '', PARAM_TEXT));
$filter = optional_param('filter', 'all', PARAM_ALPHANUMEXT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$ready = pqltd_ready();
$workspaceid = (int)($urlparams['workspaceid'] ?? 0);

$teachers = [];
$metrics = [
    'teachers' => 0,
    'attention' => 0,
    'lowqa' => 0,
    'openplans' => 0,
    'openfollowups' => 0,
    'leadership' => 0,
];

if ($ready) {
    $workspacefilter = '';
    $workspaceparams = [];
    if ($workspaceid > 0 && pqltd_column_exists('local_prequran_live_session', 'workspaceid')) {
        $workspacefilter = ' AND s.workspaceid = :workspaceid';
        $workspaceparams['workspaceid'] = $workspaceid;
    }
    $qaready = pqltd_column_exists('local_prequran_live_session', 'qa_status');
    $coachingready = pqltd_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $leadershipready = pqltd_column_exists('local_prequran_live_session', 'leadership_review_status');
    $improvementready = pqltd_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $followupready = pqltd_table_exists('local_prequran_live_note') && pqltd_column_exists('local_prequran_live_note', 'followup_status');

    $qaselect = $qaready
        ? "SUM(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_count,
           ROUND(AVG(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
           SUM(CASE WHEN s.qa_status = 'passed' THEN 1 ELSE 0 END) AS passed_count,
           SUM(CASE WHEN s.qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS qa_issue_count,
           SUM(CASE WHEN s.qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
           MAX(CASE WHEN s.qa_status <> 'not_reviewed' AND s.qa_reviewedat > 0 THEN s.qa_reviewedat ELSE 0 END) AS last_qa_time,"
        : "0 AS reviewed_count, 0 AS avg_qa_score, 0 AS passed_count, 0 AS qa_issue_count, 0 AS serious_issue_count, 0 AS last_qa_time,";
    $coachingselect = $coachingready
        ? "SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open_count,
           SUM(CASE WHEN s.qa_coaching_status IN ('assigned', 'acknowledged') AND s.qa_coaching_due_date > 0 AND s.qa_coaching_due_date < :nowtime_coaching THEN 1 ELSE 0 END) AS coaching_overdue_count,"
        : "0 AS coaching_open_count, 0 AS coaching_overdue_count,";
    $leadershipselect = $leadershipready
        ? "SUM(CASE WHEN s.leadership_review_status IN ('flagged', 'in_review') THEN 1 ELSE 0 END) AS leadership_open_count,"
        : "0 AS leadership_open_count,";
    $improvementselect = $improvementready
        ? "SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS plan_open_count,
           SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') AND s.improvement_plan_due_date > 0 AND s.improvement_plan_due_date < :nowtime_improvement THEN 1 ELSE 0 END) AS plan_overdue_count,"
        : "0 AS plan_open_count, 0 AS plan_overdue_count,";
    $followupselect = $followupready
        ? "(SELECT COUNT(1)
              FROM {local_prequran_live_note} n
              JOIN {local_prequran_live_session} sn ON sn.id = n.sessionid
             WHERE sn.teacherid = s.teacherid
               AND n.followup_status <> 'none'
               AND n.followup_resolved = 0" . ($workspacefilter !== '' ? " AND sn.workspaceid = :workspaceid_followup" : '') . ") AS followup_open_count"
        : "0 AS followup_open_count";

    $params = [
        'fromtime' => $from,
        'totime' => $to,
        'cancelled' => 'cancelled',
        'nowtime_upcoming' => $now,
    ];
    if ($workspacefilter !== '') {
        $params['workspaceid'] = $workspaceid;
        $params['workspaceid_followup'] = $workspaceid;
    }
    if ($coachingready) {
        $params['nowtime_coaching'] = $now;
    }
    if ($improvementready) {
        $params['nowtime_improvement'] = $now;
    }
    $teachers = array_values($DB->get_records_sql(
        "SELECT s.teacherid,
                u.firstname,
                u.lastname,
                u.email,
                u.suspended,
                u.deleted,
                COUNT(1) AS session_count,
                COUNT(DISTINCT p.studentid) AS distinct_students,
                MIN(s.scheduled_start) AS first_session,
                MAX(s.scheduled_start) AS last_session,
                SUM(CASE WHEN s.scheduled_start >= :nowtime_upcoming THEN 1 ELSE 0 END) AS upcoming_count,
                {$qaselect}
                {$coachingselect}
                {$leadershipselect}
                {$improvementselect}
                {$followupselect}
           FROM {local_prequran_live_session} s
      LEFT JOIN {user} u ON u.id = s.teacherid
      LEFT JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
          WHERE s.scheduled_start >= :fromtime
            AND s.scheduled_start <= :totime
            AND s.status <> :cancelled
            {$workspacefilter}
       GROUP BY s.teacherid, u.firstname, u.lastname, u.email, u.suspended, u.deleted
       ORDER BY last_session DESC, session_count DESC",
        $params,
        0,
        1000
    ));

    if (pqltd_table_exists('local_prequran_teacher_profile')) {
        $indexedteachers = [];
        foreach ($teachers as $row) {
            $indexedteachers[(int)$row->teacherid] = true;
        }
        $profilejoinsql = '';
        $profilewheresql = 'WHERE u.deleted = 0';
        $profileparams = [];
        if ($workspaceid > 0) {
            $workspacefilters = [];
            if (pqltd_table_exists('local_prequran_workspace_member')) {
                $profilejoinsql = " LEFT JOIN {local_prequran_workspace_member} wm ON wm.userid = tp.userid
                                      AND wm.workspaceid = :profileworkspaceid
                                      AND wm.status = :profilememberstatus
                                      AND wm.workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')";
                $workspacefilters[] = 'wm.id IS NOT NULL';
                $profileparams += [
                    'profileworkspaceid' => $workspaceid,
                    'profilememberstatus' => 'active',
                ];
            }
            if (pqltd_column_exists('local_prequran_teacher_profile', 'workspaceid')
                    && pqltd_column_exists('local_prequran_teacher_profile', 'teacher_work_models')) {
                $workspacefilters[] = "(tp.workspaceid = :profileworkspaceid2 AND LOWER(tp.teacher_work_models) LIKE '%independent%')";
                $profileparams['profileworkspaceid2'] = $workspaceid;
            }
            if ($workspacefilters) {
                $profilewheresql .= ' AND (' . implode(' OR ', $workspacefilters) . ')';
            } else {
                $profilewheresql .= ' AND 1 = 0';
            }
        }
        if (pqltd_column_exists('local_prequran_teacher_profile', 'status')) {
            $profilewheresql .= ' AND LOWER(tp.status) NOT IN (:profilearchived, :profileinactive, :profilerejected)';
            $profileparams += ['profilearchived' => 'archived', 'profileinactive' => 'inactive', 'profilerejected' => 'rejected'];
        }
        $profileteachers = $DB->get_records_sql(
            "SELECT tp.userid AS teacherid,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.suspended,
                    u.deleted,
                    0 AS session_count,
                    0 AS distinct_students,
                    0 AS first_session,
                    0 AS last_session,
                    0 AS upcoming_count,
                    0 AS reviewed_count,
                    0 AS avg_qa_score,
                    0 AS passed_count,
                    0 AS qa_issue_count,
                    0 AS serious_issue_count,
                    0 AS last_qa_time,
                    0 AS coaching_open_count,
                    0 AS coaching_overdue_count,
                    0 AS leadership_open_count,
                    0 AS plan_open_count,
                    0 AS plan_overdue_count,
                    0 AS followup_open_count
               FROM {local_prequran_teacher_profile} tp
               JOIN {user} u ON u.id = tp.userid
                    {$profilejoinsql}
              {$profilewheresql}
           ORDER BY tp.timemodified DESC",
            $profileparams,
            0,
            1000
        );
        foreach ($profileteachers as $row) {
            if (!isset($indexedteachers[(int)$row->teacherid])) {
                $teachers[] = $row;
            }
        }
    }

    $filtered = [];
    foreach ($teachers as $row) {
        $row->teacher_name = pqltd_user_name($row);
        $row->pass_rate = pqltd_percent((int)$row->passed_count, (int)$row->reviewed_count);
        $row->review_coverage = pqltd_percent((int)$row->reviewed_count, (int)$row->session_count);
        $row->low_qa = (int)$row->reviewed_count > 0 && (int)$row->avg_qa_score < 75;
        $row->no_recent_qa = (int)$row->session_count > 0 && ((int)$row->last_qa_time === 0 || (int)$row->last_qa_time < ($now - (30 * DAYSECS)));
        $row->inactive_30 = (int)$row->last_session > 0 && (int)$row->last_session < ($now - (30 * DAYSECS));
        $row->needs_attention = $row->low_qa
            || (int)$row->qa_issue_count > 0
            || (int)$row->coaching_open_count > 0
            || (int)$row->plan_open_count > 0
            || (int)$row->leadership_open_count > 0
            || (int)$row->followup_open_count > 0;

        $searchhaystack = core_text::strtolower($row->teacher_name . ' ' . (string)$row->email . ' ' . (int)$row->teacherid);
        if ($query !== '' && strpos($searchhaystack, core_text::strtolower($query)) === false) {
            continue;
        }
        if ($filter === 'needs_attention' && !$row->needs_attention) {
            continue;
        }
        if ($filter === 'open_plan' && (int)$row->plan_open_count <= 0) {
            continue;
        }
        if ($filter === 'low_qa' && !$row->low_qa) {
            continue;
        }
        if ($filter === 'no_recent_qa' && !$row->no_recent_qa) {
            continue;
        }
        if ($filter === 'open_followup' && (int)$row->followup_open_count <= 0) {
            continue;
        }
        if ($filter === 'leadership' && (int)$row->leadership_open_count <= 0) {
            continue;
        }
        if ($filter === 'coaching' && (int)$row->coaching_open_count <= 0) {
            continue;
        }
        if ($filter === 'inactive_30' && !$row->inactive_30) {
            continue;
        }
        $filtered[] = $row;
    }
    $teachers = $filtered;

    foreach ($teachers as $row) {
        $metrics['teachers']++;
        $metrics['attention'] += !empty($row->needs_attention) ? 1 : 0;
        $metrics['lowqa'] += !empty($row->low_qa) ? 1 : 0;
        $metrics['openplans'] += (int)$row->plan_open_count > 0 ? 1 : 0;
        $metrics['openfollowups'] += (int)$row->followup_open_count > 0 ? 1 : 0;
        $metrics['leadership'] += (int)$row->leadership_open_count > 0 ? 1 : 0;
    }
}

if ($ready && $export === 'directory') {
    $rows = [];
    foreach ($teachers as $row) {
        $rows[] = [
            (int)$row->teacherid,
            (string)$row->teacher_name,
            (string)$row->email,
            (int)$row->session_count,
            (int)$row->distinct_students,
            (int)$row->reviewed_count,
            (int)$row->review_coverage . '%',
            (int)$row->avg_qa_score . '%',
            (int)$row->pass_rate . '%',
            (int)$row->qa_issue_count,
            (int)$row->coaching_open_count,
            (int)$row->plan_open_count,
            (int)$row->leadership_open_count,
            (int)$row->followup_open_count,
            !empty($row->last_session) ? userdate((int)$row->last_session, get_string('strftimedatetimeshort')) : '',
            !empty($row->last_qa_time) ? userdate((int)$row->last_qa_time, get_string('strftimedatetimeshort')) : '',
            !empty($row->needs_attention) ? 'yes' : 'no',
        ];
    }
    pqltd_csv('quraan-live-teacher-directory.csv', ['teacherid', 'teacher', 'email', 'sessions', 'students', 'qa_reviewed', 'qa_coverage', 'avg_qa_score', 'qa_pass_rate', 'qa_issues', 'coaching_open', 'plans_open', 'leadership_open', 'followups_open', 'last_session', 'last_qa', 'needs_attention'], $rows);
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-teacher-directory-page header,
body.pqh-live-teacher-directory-page footer,
body.pqh-live-teacher-directory-page nav.navbar,
body.pqh-live-teacher-directory-page #page-header,
body.pqh-live-teacher-directory-page #page-footer,
body.pqh-live-teacher-directory-page .drawer,
body.pqh-live-teacher-directory-page .drawer-toggles,
body.pqh-live-teacher-directory-page .block-region,
body.pqh-live-teacher-directory-page [data-region="drawer"],
body.pqh-live-teacher-directory-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-teacher-directory-page #page,
body.pqh-live-teacher-directory-page #page-content,
body.pqh-live-teacher-directory-page #region-main,
body.pqh-live-teacher-directory-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqltd-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqltd-wrap{max-width:1320px;margin:0 auto}
.pqltd-top,.pqltd-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqltd-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqltd-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqltd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqltd-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqltd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqltd-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqltd-filters{display:grid;grid-template-columns:1.4fr repeat(3,minmax(0,1fr)) auto;gap:10px;margin-bottom:12px}
.pqltd-field{display:grid;gap:6px}
.pqltd-field label{font-size:12px;font-weight:900;color:#415665}
.pqltd-input,.pqltd-select{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.25 system-ui;background:#fff;color:#173044}
.pqltd-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:16px 0}
.pqltd-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqltd-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqltd-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqltd-table{width:100%;border-collapse:collapse;font-size:13px}
.pqltd-table th,.pqltd-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqltd-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqltd-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqltd-pill--ok{background:#edf9ef;color:#245c35}
.pqltd-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqltd-pill--bad{background:#fff0ed;color:#883526}
.pqltd-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqltd-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1100px){.pqltd-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqltd-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqltd-top{display:block}.pqltd-actions{margin-top:12px}.pqltd-table{display:block;overflow:auto}}
@media(max-width:620px){.pqltd-filters,.pqltd-metrics{grid-template-columns:1fr}.pqltd-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqltd-shell">
  <div class="pqltd-wrap">
    <section class="pqltd-top pqh-workspace-top">
      <div>
        <h1 class="pqltd-title pqh-workspace-title">Teacher Directory & Profile Finder</h1>
        <p class="pqltd-sub pqh-workspace-sub">Find live-class teachers, spot attention items, and open a performance profile without looking up IDs manually.</p>
      </div>
      <div class="pqltd-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', $urlparams))->out(false); ?>">QA analytics</a>
        <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $urlparams))->out(false); ?>">Create wizard</a>
        <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_capacity.php', $urlparams))->out(false); ?>">Capacity</a>
        <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', $urlparams))->out(false); ?>">Improvement plans</a>
        <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $urlparams))->out(false); ?>">Operations</a>
        <a class="pqltd-btn" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqltd-empty">Teacher directory requires live-session and participant tables.</div>
    <?php else: ?>
      <section class="pqltd-panel">
        <form method="get">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <div class="pqltd-filters">
            <div class="pqltd-field"><label for="q">Search</label><input class="pqltd-input" id="q" name="q" type="search" value="<?php echo s($query); ?>" placeholder="Name, email, or user ID"></div>
            <div class="pqltd-field"><label for="filter">Filter</label><select class="pqltd-select" id="filter" name="filter">
              <?php foreach (['all' => 'All teachers', 'needs_attention' => 'Needs attention', 'open_plan' => 'Has open plan', 'low_qa' => 'Low QA score', 'no_recent_qa' => 'No recent QA', 'open_followup' => 'Open follow-up', 'leadership' => 'Leadership case', 'coaching' => 'Open coaching', 'inactive_30' => 'No class in 30 days'] as $value => $label): ?>
                <option value="<?php echo s($value); ?>" <?php echo $filter === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select></div>
            <div class="pqltd-field"><label for="from">From</label><input class="pqltd-input" id="from" name="from" type="date" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
            <div class="pqltd-field"><label for="to">To</label><input class="pqltd-input" id="to" name="to" type="date" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
            <div class="pqltd-field"><label>&nbsp;</label><button class="pqltd-btn" type="submit">Find teachers</button></div>
          </div>
          <div class="pqltd-actions pqh-workspace-actions">
            <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php', $urlparams))->out(false); ?>">Reset</a>
            <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php', pqltd_url_params($urlparams, ['q' => $query, 'filter' => $filter, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'export' => 'directory'])))->out(false); ?>">Export CSV</a>
          </div>
        </form>
      </section>

      <section class="pqltd-metrics">
        <div class="pqltd-metric"><strong><?php echo (int)$metrics['teachers']; ?></strong><span>teachers shown</span></div>
        <div class="pqltd-metric"><strong><?php echo (int)$metrics['attention']; ?></strong><span>need attention</span></div>
        <div class="pqltd-metric"><strong><?php echo (int)$metrics['lowqa']; ?></strong><span>low QA</span></div>
        <div class="pqltd-metric"><strong><?php echo (int)$metrics['openplans']; ?></strong><span>open plans</span></div>
        <div class="pqltd-metric"><strong><?php echo (int)$metrics['openfollowups']; ?></strong><span>open follow-ups</span></div>
        <div class="pqltd-metric"><strong><?php echo (int)$metrics['leadership']; ?></strong><span>leadership cases</span></div>
      </section>

      <section class="pqltd-panel">
        <table class="pqltd-table">
          <tr><th>Teacher</th><th>Sessions</th><th>QA</th><th>Attention</th><th>Open Work</th><th>Last Activity</th><th>Actions</th></tr>
          <?php foreach ($teachers as $row): ?>
            <?php $attentionclass = !empty($row->needs_attention) ? 'pqltd-pill--bad' : 'pqltd-pill--ok'; ?>
            <tr>
              <td>
                <strong><?php echo s((string)$row->teacher_name); ?></strong><br>
                <span class="pqltd-code">#<?php echo (int)$row->teacherid; ?><?php echo trim((string)$row->email) !== '' ? ' - ' . s((string)$row->email) : ''; ?></span>
                <?php if (!empty($row->deleted) || !empty($row->suspended)): ?><br><span class="pqltd-pill pqltd-pill--warn"><?php echo !empty($row->deleted) ? 'deleted account' : 'suspended'; ?></span><?php endif; ?>
              </td>
              <td><?php echo (int)$row->session_count; ?><br><span class="pqltd-code"><?php echo (int)$row->distinct_students; ?> students, <?php echo (int)$row->upcoming_count; ?> upcoming</span></td>
              <td>
                <span class="pqltd-pill <?php echo (int)$row->avg_qa_score >= 85 ? 'pqltd-pill--ok' : (!empty($row->low_qa) ? 'pqltd-pill--bad' : 'pqltd-pill--warn'); ?>"><?php echo (int)$row->avg_qa_score; ?>%</span><br>
                <span class="pqltd-code"><?php echo (int)$row->reviewed_count; ?> reviewed, <?php echo (int)$row->review_coverage; ?>% coverage, <?php echo (int)$row->pass_rate; ?>% pass</span>
              </td>
              <td><span class="pqltd-pill <?php echo $attentionclass; ?>"><?php echo !empty($row->needs_attention) ? 'needs attention' : 'stable'; ?></span><br><span class="pqltd-code"><?php echo (int)$row->qa_issue_count; ?> QA issues, <?php echo (int)$row->serious_issue_count; ?> serious</span></td>
              <td>
                <span class="pqltd-code"><?php echo (int)$row->coaching_open_count; ?> coaching<?php echo (int)$row->coaching_overdue_count > 0 ? ', ' . (int)$row->coaching_overdue_count . ' overdue' : ''; ?></span><br>
                <span class="pqltd-code"><?php echo (int)$row->plan_open_count; ?> plans<?php echo (int)$row->plan_overdue_count > 0 ? ', ' . (int)$row->plan_overdue_count . ' overdue' : ''; ?></span><br>
                <span class="pqltd-code"><?php echo (int)$row->leadership_open_count; ?> leadership, <?php echo (int)$row->followup_open_count; ?> follow-ups</span>
              </td>
              <td>
                <?php echo !empty($row->last_session) ? s(userdate((int)$row->last_session, get_string('strftimedatetimeshort'))) : 'No sessions'; ?><br>
                <span class="pqltd-code">Last QA: <?php echo !empty($row->last_qa_time) ? s(userdate((int)$row->last_qa_time, get_string('strftimedatetimeshort'))) : 'none'; ?></span>
              </td>
              <td>
                <div class="pqltd-actions pqh-workspace-actions">
                  <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', pqltd_url_params($urlparams, ['teacherid' => (int)$row->teacherid, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to)])))->out(false); ?>">Profile</a>
                  <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher.php', pqltd_url_params($urlparams, ['teacherid' => (int)$row->teacherid])))->out(false); ?>">Workspace</a>
                  <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', pqltd_url_params($urlparams, ['step' => 2, 'teacherid' => (int)$row->teacherid])))->out(false); ?>">Create</a>
                  <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', pqltd_url_params($urlparams, ['teacherid' => (int)$row->teacherid, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to)])))->out(false); ?>">QA</a>
                  <a class="pqltd-btn pqltd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', pqltd_url_params($urlparams, ['teacherid' => (int)$row->teacherid, 'status' => 'all'])))->out(false); ?>">Plans</a>
                </div>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$teachers): ?><tr><td colspan="7">No teachers match these filters.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
