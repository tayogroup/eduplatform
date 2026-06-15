<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can view QA analytics.');
}

function pqlqa_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlqa_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlqa_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlqa_ready(): bool {
    return pqlqa_table_exists('local_prequran_live_session')
        && pqlqa_table_exists('local_prequran_live_participant')
        && pqlqa_table_exists('local_prequran_live_audit')
        && pqlqa_column_exists('local_prequran_live_session', 'qa_status')
        && pqlqa_column_exists('local_prequran_live_session', 'qa_score')
        && pqlqa_column_exists('local_prequran_live_session', 'qa_checklist');
}

function pqlqa_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlqa_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlqa_items(): array {
    return [
        'teacher_on_time' => 'Teacher joined and started on time',
        'student_safety' => 'Child safety and privacy expectations followed',
        'appropriate_interaction' => 'Teacher-student interaction was appropriate and respectful',
        'lesson_reviewed' => 'Target pre-Quran lesson was reviewed',
        'arabic_practice_quality' => 'Arabic letter or pre-Quran practice quality was strong',
        'interactive_tools' => 'Whiteboard, screen share, or class tools were used effectively',
        'student_participation' => 'Students had meaningful chances to participate',
        'parent_summary_ready' => 'Parent-visible summaries were completed',
        'recording_reviewed' => 'Recording reviewed if available',
        'technical_quality' => 'Audio/video and classroom flow were acceptable',
    ];
}

function pqlqa_decode_checklist(string $raw): array {
    $items = array_fill_keys(array_keys(pqlqa_items()), 'not_checked');
    $raw = trim($raw);
    if ($raw === '') {
        return $items;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $items;
    }
    foreach ($items as $key => $default) {
        $value = isset($decoded[$key]) ? (string)$decoded[$key] : $default;
        $items[$key] = in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true) ? $value : $default;
    }
    return $items;
}

function pqlqa_csv(string $filename, array $headers, array $rows): void {
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

function pqlqa_percent(int $part, int $whole): int {
    if ($whole <= 0) {
        return 0;
    }
    return (int)round(($part / $whole) * 100);
}

$now = time();
$defaultfrom = usergetmidnight($now - (90 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlqa_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlqa_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$ready = pqlqa_ready();
$coachingready = pqlqa_column_exists('local_prequran_live_session', 'qa_coaching_status');
$leadershipready = pqlqa_column_exists('local_prequran_live_session', 'leadership_review_status');

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
    foreach (pqlqa_items() as $key => $label) {
        $concernmap[$key] = ['label' => $label, 'concern' => 0, 'checked' => 0];
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

        foreach (pqlqa_decode_checklist((string)$session->qa_checklist) as $key => $value) {
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
        $arate = pqlqa_percent((int)$a['concern'], (int)$a['checked']);
        $brate = pqlqa_percent((int)$b['concern'], (int)$b['checked']);
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

    $metrics['reminders'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_audit}
          WHERE action IN ('quality_review_reminder_sent', 'quality_coaching_teacher_reminder_sent', 'quality_coaching_admin_escalated', 'quality_coaching_overdue')
            AND timecreated >= :fromtime
            AND timecreated <= :totime",
        ['fromtime' => $from, 'totime' => $to]
    );
}

if ($ready && $export === 'teachers') {
    $rows = [];
    foreach ($teacherrows as $row) {
        $rows[] = [
            (int)$row->teacherid,
            pqlqa_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid),
            (int)$row->session_count,
            (int)$row->reviewed_count,
            (int)$row->avg_score,
            (int)$row->passed_count,
            (int)$row->needs_coaching_count,
            (int)$row->serious_issue_count,
            (int)$row->coaching_open_count,
            (int)$row->coaching_completed_count,
            (int)$row->coaching_overdue_count,
            (int)$row->leadership_open_count,
        ];
    }
    pqlqa_csv('quraan-live-qa-teacher-trends.csv', ['teacherid', 'teacher', 'sessions', 'reviewed', 'avg_score', 'passed', 'needs_coaching', 'serious_issue', 'coaching_open', 'coaching_completed', 'coaching_overdue', 'leadership_open'], $rows);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_quality_analytics.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('QA Analytics');
$PAGE->set_heading('QA Analytics');
$PAGE->add_body_class('pqh-live-qa-analytics-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-live-qa-analytics-page header,
body.pqh-live-qa-analytics-page footer,
body.pqh-live-qa-analytics-page nav.navbar,
body.pqh-live-qa-analytics-page #page-header,
body.pqh-live-qa-analytics-page #page-footer,
body.pqh-live-qa-analytics-page .drawer,
body.pqh-live-qa-analytics-page .drawer-toggles,
body.pqh-live-qa-analytics-page .block-region,
body.pqh-live-qa-analytics-page [data-region="drawer"],
body.pqh-live-qa-analytics-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-qa-analytics-page #page,
body.pqh-live-qa-analytics-page #page-content,
body.pqh-live-qa-analytics-page #region-main,
body.pqh-live-qa-analytics-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlqa-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlqa-wrap{max-width:1240px;margin:0 auto}
.pqlqa-top,.pqlqa-panel{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlqa-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqlqa-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlqa-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlqa-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlqa-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlqa-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlqa-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlqa-field{display:grid;gap:6px}
.pqlqa-field label{font-size:12px;font-weight:900;color:#415665}
.pqlqa-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.2 system-ui;background:#fff;color:#173044}
.pqlqa-metrics{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlqa-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlqa-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqlqa-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlqa-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.pqlqa-panel{margin-bottom:16px}
.pqlqa-panel--wide{grid-column:1/-1}
.pqlqa-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqlqa-table{width:100%;border-collapse:collapse;font-size:13px}
.pqlqa-table th,.pqlqa-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqlqa-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqlqa-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqlqa-pill--ok{background:#edf9ef;color:#245c35}
.pqlqa-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlqa-pill--bad{background:#fff0ed;color:#883526}
.pqlqa-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlqa-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1050px){.pqlqa-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlqa-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlqa-grid{grid-template-columns:1fr}.pqlqa-top{display:block}.pqlqa-actions{margin-top:12px}.pqlqa-table{display:block;overflow:auto}}
@media(max-width:620px){.pqlqa-filters,.pqlqa-metrics{grid-template-columns:1fr}.pqlqa-title{font-size:24px}}
</style>
<main class="pqlqa-shell">
  <div class="pqlqa-wrap">
    <section class="pqlqa-top">
      <div>
        <h1 class="pqlqa-title">QA Analytics & Teacher Performance</h1>
        <p class="pqlqa-sub">Track live-class quality, coaching completion, checklist concerns, and teacher improvement trends.</p>
      </div>
      <div class="pqlqa-actions">
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php'))->out(false); ?>">Admin menu</a>
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_directory.php'))->out(false); ?>">Teachers</a>
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php'))->out(false); ?>">Leadership</a>
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php'))->out(false); ?>">Improvement plans</a>
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php'))->out(false); ?>">Reports</a>
        <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlqa-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlqa-empty">QA analytics requires Phase 30 quality review columns.</div>
    <?php else: ?>
      <section class="pqlqa-panel pqlqa-panel--wide">
        <form method="get">
          <div class="pqlqa-filters">
            <div class="pqlqa-field"><label for="from">From</label><input class="pqlqa-input" id="from" name="from" type="date" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
            <div class="pqlqa-field"><label for="to">To</label><input class="pqlqa-input" id="to" name="to" type="date" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
            <div class="pqlqa-field"><label for="teacherid">Teacher ID</label><input class="pqlqa-input" id="teacherid" name="teacherid" type="number" min="0" value="<?php echo (int)$teacherid; ?>"></div>
            <div class="pqlqa-field"><label>&nbsp;</label><button class="pqlqa-btn" type="submit">Apply filters</button></div>
          </div>
          <div class="pqlqa-actions">
            <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php'))->out(false); ?>">Reset</a>
            <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', ['from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'teacherid' => $teacherid, 'export' => 'teachers']))->out(false); ?>">Export teacher trends CSV</a>
          </div>
        </form>
      </section>

      <section class="pqlqa-metrics" aria-label="QA analytics metrics">
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['sessions']; ?></strong><span>sessions</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['reviewed']; ?></strong><span>QA reviewed</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['average_score']; ?>%</strong><span>average score</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['passed']; ?></strong><span>passed</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['needs_coaching']; ?></strong><span>needs coaching</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['serious_issue']; ?></strong><span>serious issues</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['coaching_open']; ?></strong><span>coaching open</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['coaching_completed']; ?></strong><span>coaching done</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['coaching_overdue']; ?></strong><span>coaching overdue</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['leadership_open']; ?></strong><span>leadership open</span></div>
        <div class="pqlqa-metric"><strong><?php echo (int)$metrics['reminders']; ?></strong><span>reminder audits</span></div>
      </section>

      <section class="pqlqa-grid">
        <article class="pqlqa-panel pqlqa-panel--wide">
          <h2>Teacher Performance Trends</h2>
          <table class="pqlqa-table">
            <tr><th>Teacher</th><th>Sessions</th><th>Reviewed</th><th>Avg Score</th><th>Pass Rate</th><th>QA Issues</th><th>Alert</th><th>Coaching Open</th><th>Coaching Done</th><th>Overdue</th><th>Leadership</th><th>Action</th></tr>
            <?php foreach ($teacherrows as $row): ?>
              <?php $issuecount = (int)$row->needs_coaching_count + (int)$row->serious_issue_count; ?>
              <?php
                $alert = 'OK';
                if ((int)$row->serious_issue_count > 0) {
                    $alert = 'Serious issue';
                } else if ((int)$row->avg_score < 75 && (int)$row->reviewed_count >= 2) {
                    $alert = 'Low score trend';
                } else if ((int)$row->needs_coaching_count >= 2) {
                    $alert = 'Repeated coaching';
                } else if ((int)$row->coaching_overdue_count > 0) {
                    $alert = 'Overdue coaching';
                }
              ?>
              <tr>
                <td><?php echo s(pqlqa_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid)); ?><br><span class="pqlqa-code">#<?php echo (int)$row->teacherid; ?></span></td>
                <td><?php echo (int)$row->session_count; ?></td>
                <td><?php echo (int)$row->reviewed_count; ?></td>
                <td><span class="pqlqa-pill <?php echo (int)$row->avg_score >= 85 ? 'pqlqa-pill--ok' : ((int)$row->avg_score < 75 && (int)$row->reviewed_count > 0 ? 'pqlqa-pill--bad' : 'pqlqa-pill--warn'); ?>"><?php echo (int)$row->avg_score; ?>%</span></td>
                <td><?php echo pqlqa_percent((int)$row->passed_count, (int)$row->reviewed_count); ?>%</td>
                <td><?php echo $issuecount; ?><?php echo (int)$row->serious_issue_count > 0 ? ' serious' : ''; ?></td>
                <td><span class="pqlqa-pill <?php echo $alert === 'OK' ? 'pqlqa-pill--ok' : 'pqlqa-pill--bad'; ?>"><?php echo s($alert); ?></span></td>
                <td><?php echo (int)$row->coaching_open_count; ?></td>
                <td><?php echo (int)$row->coaching_completed_count; ?></td>
                <td><?php echo (int)$row->coaching_overdue_count; ?></td>
                <td><?php echo (int)$row->leadership_open_count; ?></td>
                <td>
                  <div class="pqlqa-actions">
                    <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher_profile.php', ['teacherid' => (int)$row->teacherid, 'from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to)]))->out(false); ?>">Profile</a>
                    <a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', ['from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'teacherid' => (int)$row->teacherid]))->out(false); ?>">View</a>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$teacherrows): ?><tr><td colspan="12">No teacher QA rows in this range.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlqa-panel">
          <h2>Monthly QA Trend</h2>
          <table class="pqlqa-table">
            <tr><th>Month</th><th>Sessions</th><th>Reviewed</th><th>Avg Score</th><th>Issue Rate</th></tr>
            <?php foreach ($trendrows as $row): ?>
              <tr>
                <td><?php echo s(sprintf('%04d-%02d', (int)$row->y, (int)$row->m)); ?></td>
                <td><?php echo (int)$row->session_count; ?></td>
                <td><?php echo (int)$row->reviewed_count; ?></td>
                <td><?php echo (int)$row->avg_score; ?>%</td>
                <td><?php echo pqlqa_percent((int)$row->issue_count, (int)$row->reviewed_count); ?>%</td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$trendrows): ?><tr><td colspan="5">No monthly trend rows.</td></tr><?php endif; ?>
          </table>
        </article>

        <article class="pqlqa-panel">
          <h2>Common Checklist Concerns</h2>
          <table class="pqlqa-table">
            <tr><th>Checklist Item</th><th>Concerns</th><th>Checked</th><th>Concern Rate</th></tr>
            <?php foreach (array_slice($concerns, 0, 10) as $row): ?>
              <tr>
                <td><?php echo s((string)$row['label']); ?></td>
                <td><?php echo (int)$row['concern']; ?></td>
                <td><?php echo (int)$row['checked']; ?></td>
                <td><?php echo pqlqa_percent((int)$row['concern'], (int)$row['checked']); ?>%</td>
              </tr>
            <?php endforeach; ?>
          </table>
        </article>

        <article class="pqlqa-panel pqlqa-panel--wide">
          <h2>Needs Attention</h2>
          <table class="pqlqa-table">
            <tr><th>Session</th><th>Teacher</th><th>Date</th><th>QA</th><th>Score</th><th>Coaching</th><th>Leadership</th><th>Due</th><th>Action</th></tr>
            <?php foreach ($riskrows as $row): ?>
              <?php $overdue = (int)$row->qa_coaching_due_date > 0 && (int)$row->qa_coaching_due_date < $now && in_array((string)$row->qa_coaching_status, ['assigned', 'acknowledged'], true); ?>
              <tr>
                <td><?php echo s((string)$row->title); ?><br><span class="pqlqa-code">#<?php echo (int)$row->id; ?></span></td>
                <td><?php echo s(pqlqa_user_name((int)$row->teacherid, 'Teacher ' . (int)$row->teacherid)); ?></td>
                <td><?php echo userdate((int)$row->scheduled_start, get_string('strftimedatetimeshort')); ?></td>
                <td><span class="pqlqa-pill <?php echo (string)$row->qa_status === 'serious_issue' ? 'pqlqa-pill--bad' : ((string)$row->qa_status === 'needs_coaching' ? 'pqlqa-pill--warn' : ''); ?>"><?php echo s(str_replace('_', ' ', (string)$row->qa_status)); ?></span></td>
                <td><?php echo (int)$row->qa_score; ?>%</td>
                <td><?php echo s(str_replace('_', ' ', (string)$row->qa_coaching_status)); ?><?php echo $overdue ? '<br><span class="pqlqa-pill pqlqa-pill--bad">overdue</span>' : ''; ?></td>
                <td><?php echo s(str_replace('_', ' ', (string)$row->leadership_review_status)); ?><?php echo trim((string)$row->leadership_review_reason) !== '' ? '<br><span class="pqlqa-code">' . s((string)$row->leadership_review_reason) . '</span>' : ''; ?></td>
                <td><?php echo !empty($row->qa_coaching_due_date) ? userdate((int)$row->qa_coaching_due_date, get_string('strftimedatetimeshort')) : ''; ?></td>
                <td><a class="pqlqa-btn pqlqa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', ['sessionid' => (int)$row->id]))->out(false); ?>">Open QA</a></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$riskrows): ?><tr><td colspan="9">No QA risks in this range.</td></tr><?php endif; ?>
          </table>
        </article>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
