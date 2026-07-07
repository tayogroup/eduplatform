<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $urlparams['workspaceid'] = (int)$consumercontext->workspaceid;
}

pqh_require_academy_operations(
    'Only academy operations users can manage leadership reviews.',
    new moodle_url('/local/hubredirect/live_sessions.php', $urlparams),
    'Leadership review access required'
);

function pqll_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqll_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqll_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqll_ready(): bool {
    return pqll_table_exists('local_prequran_live_session')
        && pqll_table_exists('local_prequran_live_audit')
        && pqll_column_exists('local_prequran_live_session', 'leadership_review_status')
        && pqll_column_exists('local_prequran_live_session', 'qa_status')
        && pqll_column_exists('local_prequran_live_session', 'qa_score');
}

function pqll_clean_text(string $value, int $max = 4000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqll_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqll_short(string $value, int $max = 140): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqll_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqll_clean_due_date(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time ? $time : 0;
}

function pqll_audit(int $sessionid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqll_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'session',
        'targetid' => $sessionid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqll_csv(string $filename, array $headers, array $rows): void {
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

$ready = pqll_ready();
$improvementready = $ready && pqll_column_exists('local_prequran_live_session', 'improvement_plan_status');
$now = time();
$defaultfrom = usergetmidnight($now - (180 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqll_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqll_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$status = optional_param('status', 'open', PARAM_ALPHANUMEXT);
$reasonfilter = optional_param('reason', '', PARAM_TEXT);
$export = optional_param('export', optional_param('exqort', '', PARAM_ALPHANUMEXT), PARAM_ALPHANUMEXT);
$notice = optional_param('result', '', PARAM_ALPHANUMEXT);

if ($ready && data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'update_case') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the leadership review page and try saving again.',
            new moodle_url('/local/hubredirect/live_leadership.php', $urlparams),
            'Leadership review save expired'
        );
    }
    $sessionid = optional_param('sessionid', 0, PARAM_INT);
    if ($sessionid <= 0) {
        pqh_access_denied(
            'Choose a valid live session before updating a leadership case.',
            new moodle_url('/local/hubredirect/live_leadership.php', $urlparams),
            'Leadership review unavailable'
        );
    }
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING);
    if (!$session) {
        pqh_access_denied(
            'Choose a valid live session before updating a leadership case.',
            new moodle_url('/local/hubredirect/live_leadership.php', $urlparams),
            'Leadership review unavailable'
        );
    }
    $oldstatus = (string)$session->leadership_review_status;
    $newstatus = optional_param('leadership_review_status', 'flagged', PARAM_ALPHANUMEXT);
    if (!in_array($newstatus, ['flagged', 'in_review', 'cleared'], true)) {
        $newstatus = 'flagged';
    }

    $session->leadership_review_status = $newstatus;
    $session->leadership_review_reason = pqll_clean_text(optional_param('leadership_review_reason', '', PARAM_RAW), 4000);
    $session->leadership_review_notes = pqll_clean_text(optional_param('leadership_review_notes', '', PARAM_RAW), 6000);
    $oldplanstatus = $improvementready ? (string)$session->improvement_plan_status : 'none';
    $newplanstatus = $oldplanstatus;
    if ($improvementready) {
        $newplanstatus = optional_param('improvement_plan_status', 'none', PARAM_ALPHANUMEXT);
        if (!in_array($newplanstatus, ['none', 'assigned', 'in_progress', 'completed'], true)) {
            $newplanstatus = 'none';
        }
        $session->improvement_plan_status = $newplanstatus;
        $session->improvement_plan_goals = pqll_clean_text(optional_param('improvement_plan_goals', '', PARAM_RAW), 6000);
        $session->improvement_plan_actions = pqll_clean_text(optional_param('improvement_plan_actions', '', PARAM_RAW), 6000);
        $session->improvement_plan_due_date = pqll_clean_due_date(optional_param('improvement_plan_due_date', '', PARAM_TEXT));
        $priority = optional_param('improvement_plan_priority', 'normal', PARAM_ALPHANUMEXT);
        $session->improvement_plan_priority = in_array($priority, ['high', 'normal', 'low'], true) ? $priority : 'normal';
        $session->improvement_plan_mentorid = optional_param('improvement_plan_mentorid', 0, PARAM_INT);
        $session->improvement_plan_completion_notes = pqll_clean_text(optional_param('improvement_plan_completion_notes', optional_param('improvement_plan_comqletion_notes', '', PARAM_RAW), PARAM_RAW), 6000);
        if ($newplanstatus !== 'none' && $oldplanstatus === 'none') {
            $session->improvement_plan_assignedby = (int)$USER->id;
            $session->improvement_plan_assignedat = time();
            $session->improvement_plan_ackby = 0;
            $session->improvement_plan_ackat = 0;
            $session->improvement_plan_completedby = 0;
            $session->improvement_plan_completedat = 0;
        }
        if ($newplanstatus === 'completed' && $oldplanstatus !== 'completed') {
            $session->improvement_plan_completedby = (int)$USER->id;
            $session->improvement_plan_completedat = time();
        }
        if ($newplanstatus !== 'completed' && $oldplanstatus === 'completed') {
            $session->improvement_plan_completedby = 0;
            $session->improvement_plan_completedat = 0;
        }
        if ($newplanstatus === 'none') {
            $session->improvement_plan_ackby = 0;
            $session->improvement_plan_ackat = 0;
            $session->improvement_plan_completedby = 0;
            $session->improvement_plan_completedat = 0;
        }
    }
    if ($newstatus === 'cleared') {
        $session->leadership_clearedby = (int)$USER->id;
        $session->leadership_clearedat = time();
    } else {
        $session->leadership_reviewby = (int)$USER->id;
        $session->leadership_reviewat = time();
        $session->leadership_clearedby = 0;
        $session->leadership_clearedat = 0;
    }
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    $action = $newstatus === 'cleared' ? 'leadership_review_cleared' : 'leadership_review_updated';
    pqll_audit($sessionid, $action, [
        'oldstatus' => $oldstatus,
        'newstatus' => $newstatus,
        'source' => 'leadership_dashboard',
        'reason' => (string)$session->leadership_review_reason,
    ]);
    if ($improvementready) {
        $planaction = 'improvement_plan_updated';
        if ($oldplanstatus === 'none' && $newplanstatus !== 'none') {
            $planaction = 'improvement_plan_assigned';
        } else if ($oldplanstatus !== 'completed' && $newplanstatus === 'completed') {
            $planaction = 'improvement_plan_completed';
        } else if ($oldplanstatus === 'completed' && $newplanstatus !== 'completed') {
            $planaction = 'improvement_plan_reopened';
        }
        pqll_audit($sessionid, $planaction, [
            'oldstatus' => $oldplanstatus,
            'newstatus' => $newplanstatus,
            'priority' => (string)$session->improvement_plan_priority,
            'mentorid' => (int)$session->improvement_plan_mentorid,
            'duedate' => (int)$session->improvement_plan_due_date,
        ]);
    }
    redirect(new moodle_url('/local/hubredirect/live_leadership.php', array_merge($urlparams, [
        'status' => $status,
        'teacherid' => $teacherid,
        'from' => date('Y-m-d', $from),
        'to' => date('Y-m-d', $to),
        'result' => 'saved',
    ])));
}

$where = ['s.scheduled_start >= :fromtime', 's.scheduled_start <= :totime'];
$params = ['fromtime' => $from, 'totime' => $to];
if ($teacherid > 0) {
    $where[] = 's.teacherid = :teacherid';
    $params['teacherid'] = $teacherid;
}
if ($status === 'open') {
    $where[] = "s.leadership_review_status IN ('flagged', 'in_review')";
} else if (in_array($status, ['flagged', 'in_review', 'cleared', 'none'], true)) {
    $where[] = 's.leadership_review_status = :leadstatus';
    $params['leadstatus'] = $status;
}
if (trim($reasonfilter) !== '') {
    $where[] = $DB->sql_like('s.leadership_review_reason', ':reasonfilter', false);
    $params['reasonfilter'] = '%' . $DB->sql_like_escape($reasonfilter) . '%';
}
if (!empty($urlparams['workspaceid']) && pqll_column_exists('local_prequran_live_session', 'workspaceid')) {
    $where[] = 's.workspaceid = :workspaceid';
    $params['workspaceid'] = (int)$urlparams['workspaceid'];
}
$wheresql = implode(' AND ', $where);
$metricwhere = '';
$metricparams = [];
if (!empty($urlparams['workspaceid']) && pqll_column_exists('local_prequran_live_session', 'workspaceid')) {
    $metricwhere = ' AND workspaceid = :metricworkspaceid';
    $metricparams['metricworkspaceid'] = (int)$urlparams['workspaceid'];
}

$cases = [];
$metrics = ['open' => 0, 'flagged' => 0, 'inreview' => 0, 'cleared' => 0, 'serious' => 0, 'overduecoaching' => 0, 'plansopen' => 0, 'plansoverdue' => 0, 'planscompleted' => 0];
$audits = [];

if ($ready) {
    $cases = array_values($DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count
           FROM {local_prequran_live_session} s
          WHERE {$wheresql}
       ORDER BY CASE s.leadership_review_status
                    WHEN 'flagged' THEN 1
                    WHEN 'in_review' THEN 2
                    WHEN 'cleared' THEN 3
                    ELSE 4
                END,
                s.leadership_reviewat DESC,
                s.scheduled_start DESC,
                s.id DESC",
        $params,
        0,
        200
    ));

    $metrics['open'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status IN ('flagged', 'in_review'){$metricwhere}",
        $metricparams
    );
    $metrics['flagged'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status = :status{$metricwhere}",
        ['status' => 'flagged'] + $metricparams
    );
    $metrics['inreview'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status = :status{$metricwhere}",
        ['status' => 'in_review'] + $metricparams
    );
    $metrics['cleared'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE leadership_review_status = :status{$metricwhere}",
        ['status' => 'cleared'] + $metricparams
    );
    $metrics['serious'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE qa_status = :status{$metricwhere}",
        ['status' => 'serious_issue'] + $metricparams
    );
    $metrics['overduecoaching'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session}
          WHERE qa_coaching_status IN ('assigned', 'acknowledged')
            AND qa_coaching_due_date > 0
            AND qa_coaching_due_date < :nowtime{$metricwhere}",
        ['nowtime' => $now] + $metricparams
    );
    if ($improvementready) {
        $metrics['plansopen'] = (int)$DB->count_records_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress'){$metricwhere}",
            $metricparams
        );
        $metrics['plansoverdue'] = (int)$DB->count_records_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE improvement_plan_status IN ('assigned', 'in_progress')
                AND improvement_plan_due_date > 0
                AND improvement_plan_due_date < :nowtime{$metricwhere}",
            ['nowtime' => $now] + $metricparams
        );
        $metrics['planscompleted'] = (int)$DB->count_records_sql(
            "SELECT COUNT(1) FROM {local_prequran_live_session} WHERE improvement_plan_status = :status{$metricwhere}",
            ['status' => 'completed'] + $metricparams
        );
    }

    $audits = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action IN (
              'leadership_review_auto_flagged',
              'leadership_review_auto_skipped',
              'leadership_review_admin_notified',
              'leadership_review_flagged',
              'leadership_review_updated',
              'leadership_review_cleared',
              'improvement_plan_assigned',
              'improvement_plan_updated',
              'improvement_plan_acknowledged',
              'improvement_plan_completed',
              'improvement_plan_reopened'
          )
       ORDER BY timecreated DESC, id DESC",
        [],
        0,
        50
    ));
}

if ($ready && $export === 'cases') {
    $rows = [];
    foreach ($cases as $case) {
        $rows[] = [
            (int)$case->id,
            (string)$case->title,
            (int)$case->teacherid,
            pqll_user_name((int)$case->teacherid, 'Teacher ' . (int)$case->teacherid),
            userdate((int)$case->scheduled_start, get_string('strftimedatetimeshort')),
            (string)$case->qa_status,
            (int)$case->qa_score,
            (string)$case->qa_coaching_status,
            (string)$case->leadership_review_status,
            (string)$case->leadership_review_reason,
            (string)$case->leadership_review_notes,
            $improvementready ? (string)$case->improvement_plan_status : '',
            $improvementready ? (string)$case->improvement_plan_priority : '',
            $improvementready ? (int)$case->improvement_plan_mentorid : 0,
            $improvementready && !empty($case->improvement_plan_due_date) ? userdate((int)$case->improvement_plan_due_date, get_string('strftimedatetimeshort')) : '',
            $improvementready ? (string)$case->improvement_plan_goals : '',
            $improvementready ? (string)$case->improvement_plan_actions : '',
            !empty($case->leadership_reviewat) ? userdate((int)$case->leadership_reviewat, get_string('strftimedatetimeshort')) : '',
            !empty($case->leadership_clearedat) ? userdate((int)$case->leadership_clearedat, get_string('strftimedatetimeshort')) : '',
        ];
    }
    pqll_csv('quraan-live-leadership-cases.csv', ['sessionid', 'title', 'teacherid', 'teacher', 'start', 'qa_status', 'qa_score', 'coaching_status', 'leadership_status', 'reason', 'notes', 'improvement_status', 'improvement_priority', 'mentorid', 'improvement_due', 'improvement_goals', 'improvement_actions', 'reviewed_at', 'cleared_at'], $rows);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_leadership.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Leadership Reviews');
$PAGE->set_heading('Leadership Reviews');
$PAGE->add_body_class('pqh-live-leadership-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-live-leadership-page header,
body.pqh-live-leadership-page footer,
body.pqh-live-leadership-page nav.navbar,
body.pqh-live-leadership-page #page-header,
body.pqh-live-leadership-page #page-footer,
body.pqh-live-leadership-page .drawer,
body.pqh-live-leadership-page .drawer-toggles,
body.pqh-live-leadership-page .block-region,
body.pqh-live-leadership-page [data-region="drawer"],
body.pqh-live-leadership-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-leadership-page #page,
body.pqh-live-leadership-page #page-content,
body.pqh-live-leadership-page #region-main,
body.pqh-live-leadership-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqll-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqll-wrap{max-width:1240px;margin:0 auto}
.pqll-top,.pqll-panel,.pqll-case{padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqll-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}
.pqll-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqll-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqll-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqll-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqll-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqll-btn--brown{background:#6f4e32}
.pqll-alert{margin-bottom:14px;padding:12px 14px;border-radius:10px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-weight:900}
.pqll-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:12px}
.pqll-field{display:grid;gap:6px}
.pqll-field label{font-size:12px;font-weight:900;color:#415665}
.pqll-input,.pqll-select,.pqll-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.25 system-ui;background:#fff;color:#173044}
.pqll-textarea{min-height:78px;resize:vertical}
.pqll-metrics{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqll-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqll-metric strong{display:block;font-size:24px;font-weight:950;color:#6f4e32}
.pqll-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqll-grid{display:grid;grid-template-columns:1fr;gap:14px}
.pqll-case h2,.pqll-panel h2{margin:0 0 10px;font-size:20px;font-weight:950}
.pqll-case-head{display:flex;justify-content:space-between;gap:14px;margin-bottom:12px}
.pqll-case-meta{color:#5e7280;font-size:13px;font-weight:850}
.pqll-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqll-pill--ok{background:#edf9ef;color:#245c35}
.pqll-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqll-pill--bad{background:#fff0ed;color:#883526}
.pqll-case-body{display:grid;grid-template-columns:1.1fr 1fr;gap:14px}
.pqll-kv{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px}
.pqll-kv div{padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff}
.pqll-kv strong{display:block;color:#6f4e32;font-size:18px}
.pqll-kv span{display:block;color:#5e7280;font-size:12px;font-weight:850}
.pqll-table{width:100%;border-collapse:collapse;font-size:13px}
.pqll-table th,.pqll-table td{padding:9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqll-table th{background:#f7fafc;font-size:12px;color:#415665}
.pqll-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqll-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;word-break:break-word}
@media(max-width:1050px){.pqll-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pqll-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqll-case-body{grid-template-columns:1fr}.pqll-top{display:block}.pqll-actions{margin-top:12px}.pqll-kv{grid-template-columns:repeat(2,minmax(0,1fr))}.pqll-table{display:block;overflow:auto}}
@media(max-width:620px){.pqll-filters,.pqll-metrics,.pqll-kv{grid-template-columns:1fr}.pqll-title{font-size:24px}.pqll-case-head{display:block}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqll-shell">
  <div class="pqll-wrap">
    <section class="pqll-top pqh-workspace-top">
      <div>
        <h1 class="pqll-title pqh-workspace-title">Leadership Review Command Center</h1>
        <p class="pqll-sub pqh-workspace-sub">Manage flagged QA cases, leadership notes, case status, and resolution history.</p>
      </div>
      <div class="pqll-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $urlparams))->out(false); ?>">Operations</a>
        <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php', $urlparams))->out(false); ?>">QA analytics</a>
        <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_improvement_plans.php', $urlparams))->out(false); ?>">Improvement plans</a>
        <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php', $urlparams))->out(false); ?>">Reports</a>
        <a class="pqll-btn" href="<?php echo (new moodle_url(!empty($urlparams['workspaceid']) ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php', $urlparams))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($notice === 'saved'): ?><div class="pqll-alert">Leadership case updated.</div><?php endif; ?>

    <?php if (!$ready): ?>
      <div class="pqll-empty">Leadership review columns are not installed yet. Run Phase 34 SQL first.</div>
    <?php else: ?>
      <section class="pqll-panel">
        <form method="get">
          <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
          <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
          <div class="pqll-filters">
            <div class="pqll-field"><label for="from">From</label><input class="pqll-input" id="from" name="from" type="date" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
            <div class="pqll-field"><label for="to">To</label><input class="pqll-input" id="to" name="to" type="date" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
            <div class="pqll-field"><label for="teacherid">Teacher ID</label><input class="pqll-input" id="teacherid" name="teacherid" type="number" min="0" value="<?php echo (int)$teacherid; ?>"></div>
            <div class="pqll-field"><label for="status">Status</label><select class="pqll-select" id="status" name="status">
              <?php foreach (['open' => 'Open cases', 'flagged' => 'Flagged', 'in_review' => 'In review', 'cleared' => 'Cleared', 'none' => 'No review', 'all' => 'All'] as $value => $label): ?>
                <option value="<?php echo s($value); ?>" <?php echo $status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
              <?php endforeach; ?>
            </select></div>
            <div class="pqll-field"><label for="reason">Reason contains</label><input class="pqll-input" id="reason" name="reason" value="<?php echo s($reasonfilter); ?>"></div>
          </div>
          <div class="pqll-actions pqh-workspace-actions">
            <button class="pqll-btn" type="submit">Apply filters</button>
            <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php', $urlparams))->out(false); ?>">Reset</a>
            <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_leadership.php', array_merge($urlparams, ['from' => date('Y-m-d', $from), 'to' => date('Y-m-d', $to), 'teacherid' => $teacherid, 'status' => $status, 'reason' => $reasonfilter, 'export' => 'cases'])))->out(false); ?>">Export cases CSV</a>
          </div>
        </form>
      </section>

      <section class="pqll-metrics">
        <div class="pqll-metric"><strong><?php echo (int)$metrics['open']; ?></strong><span>open cases</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['flagged']; ?></strong><span>flagged</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['inreview']; ?></strong><span>in review</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['cleared']; ?></strong><span>cleared</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['serious']; ?></strong><span>serious QA</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['overduecoaching']; ?></strong><span>overdue coaching</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['plansopen']; ?></strong><span>open plans</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['plansoverdue']; ?></strong><span>overdue plans</span></div>
        <div class="pqll-metric"><strong><?php echo (int)$metrics['planscompleted']; ?></strong><span>completed plans</span></div>
      </section>

      <section class="pqll-grid">
        <?php foreach ($cases as $case): ?>
          <?php
            $overdue = in_array((string)$case->qa_coaching_status, ['assigned', 'acknowledged'], true) && !empty($case->qa_coaching_due_date) && (int)$case->qa_coaching_due_date < $now;
            $pillclass = (string)$case->leadership_review_status === 'cleared' ? 'pqll-pill--ok' : ((string)$case->leadership_review_status === 'in_review' ? 'pqll-pill--warn' : 'pqll-pill--bad');
            $caseurlparams = array_merge($urlparams, ['sessionid' => (int)$case->id]);
          ?>
          <article class="pqll-case">
            <div class="pqll-case-head">
              <div>
                <h2><?php echo s((string)$case->title); ?></h2>
                <div class="pqll-case-meta">
                  #<?php echo (int)$case->id; ?> - <?php echo s(userdate((int)$case->scheduled_start, get_string('strftimedatetimeshort'))); ?> - <?php echo s(pqll_user_name((int)$case->teacherid, 'Teacher ' . (int)$case->teacherid)); ?>
                </div>
              </div>
              <div><span class="pqll-pill <?php echo $pillclass; ?>"><?php echo s(str_replace('_', ' ', (string)$case->leadership_review_status)); ?></span></div>
            </div>

            <div class="pqll-kv">
              <div><strong><?php echo s(str_replace('_', ' ', (string)$case->qa_status)); ?></strong><span>QA status</span></div>
              <div><strong><?php echo (int)$case->qa_score; ?>%</strong><span>QA score</span></div>
              <div><strong><?php echo s(str_replace('_', ' ', (string)$case->qa_coaching_status)); ?></strong><span>coaching</span></div>
              <div><strong><?php echo (int)$case->student_count; ?></strong><span>students</span></div>
            </div>

            <div class="pqll-case-body">
              <div>
                <p><strong>Reason:</strong> <?php echo s((string)$case->leadership_review_reason ?: 'No reason recorded.'); ?></p>
                <p><strong>Notes:</strong> <?php echo s(pqll_short((string)$case->leadership_review_notes ?: 'No leadership notes yet.', 260)); ?></p>
                <p><strong>Due:</strong> <?php echo !empty($case->qa_coaching_due_date) ? s(userdate((int)$case->qa_coaching_due_date, get_string('strftimedatetimeshort'))) : 'No coaching due date'; ?><?php echo $overdue ? ' - overdue' : ''; ?></p>
                <?php if ($improvementready && (string)$case->improvement_plan_status !== 'none'): ?>
                  <p><strong>Improvement plan:</strong> <?php echo s(str_replace('_', ' ', (string)$case->improvement_plan_status)); ?><?php echo !empty($case->improvement_plan_due_date) ? ' - due ' . s(userdate((int)$case->improvement_plan_due_date, get_string('strftimedatetimeshort'))) : ''; ?></p>
                  <?php if (!empty($case->improvement_plan_ackat)): ?><p><strong>Teacher acknowledged:</strong> <?php echo s(userdate((int)$case->improvement_plan_ackat, get_string('strftimedatetimeshort'))); ?></p><?php endif; ?>
                <?php endif; ?>
                <div class="pqll-actions pqh-workspace-actions">
                  <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_quality.php', $caseurlparams))->out(false); ?>">Open QA</a>
                  <a class="pqll-btn pqll-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $caseurlparams))->out(false); ?>">Class review</a>
                </div>
              </div>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="update_case">
                <input type="hidden" name="sessionid" value="<?php echo (int)$case->id; ?>">
                <?php if (!empty($urlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$urlparams['consumer']); ?>"><?php endif; ?>
                <?php if (!empty($urlparams['workspaceid'])): ?><input type="hidden" name="workspaceid" value="<?php echo (int)$urlparams['workspaceid']; ?>"><?php endif; ?>
                <div class="pqll-field">
                  <label>Status</label>
                  <select class="pqll-select" name="leadership_review_status">
                    <?php foreach (['flagged' => 'Flagged', 'in_review' => 'In review', 'cleared' => 'Cleared'] as $value => $label): ?>
                      <option value="<?php echo s($value); ?>" <?php echo (string)$case->leadership_review_status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <div class="pqll-field">
                  <label>Reason</label>
                  <textarea class="pqll-textarea" name="leadership_review_reason"><?php echo s((string)$case->leadership_review_reason); ?></textarea>
                </div>
                <div class="pqll-field">
                  <label>Leadership Notes</label>
                  <textarea class="pqll-textarea" name="leadership_review_notes"><?php echo s((string)$case->leadership_review_notes); ?></textarea>
                </div>
                <?php if ($improvementready): ?>
                  <div class="pqll-field">
                    <label>Improvement Plan Status</label>
                    <select class="pqll-select" name="improvement_plan_status">
                      <?php foreach (['none' => 'No plan', 'assigned' => 'Assigned', 'in_progress' => 'In progress', 'completed' => 'Completed'] as $value => $label): ?>
                        <option value="<?php echo s($value); ?>" <?php echo (string)$case->improvement_plan_status === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                      <?php endforeach; ?>
                    </select>
                  </div>
                  <div class="pqll-filters" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:0">
                    <div class="pqll-field">
                      <label>Priority</label>
                      <select class="pqll-select" name="improvement_plan_priority">
                        <?php foreach (['high' => 'High', 'normal' => 'Normal', 'low' => 'Low'] as $value => $label): ?>
                          <option value="<?php echo s($value); ?>" <?php echo (string)$case->improvement_plan_priority === $value ? 'selected' : ''; ?>><?php echo s($label); ?></option>
                        <?php endforeach; ?>
                      </select>
                    </div>
                    <div class="pqll-field">
                      <label>Due Date</label>
                      <input class="pqll-input" type="date" name="improvement_plan_due_date" value="<?php echo !empty($case->improvement_plan_due_date) ? s(date('Y-m-d', (int)$case->improvement_plan_due_date)) : ''; ?>">
                    </div>
                    <div class="pqll-field">
                      <label>Mentor User ID</label>
                      <input class="pqll-input" type="number" min="0" name="improvement_plan_mentorid" value="<?php echo (int)$case->improvement_plan_mentorid; ?>">
                    </div>
                  </div>
                  <div class="pqll-field">
                    <label>Improvement Goals</label>
                    <textarea class="pqll-textarea" name="improvement_plan_goals"><?php echo s((string)$case->improvement_plan_goals); ?></textarea>
                  </div>
                  <div class="pqll-field">
                    <label>Action Steps</label>
                    <textarea class="pqll-textarea" name="improvement_plan_actions"><?php echo s((string)$case->improvement_plan_actions); ?></textarea>
                  </div>
                  <div class="pqll-field">
                    <label>Completion Notes</label>
                    <textarea class="pqll-textarea" name="improvement_plan_completion_notes"><?php echo s((string)($case->improvement_plan_completion_notes ?? '')); ?></textarea>
                  </div>
                <?php endif; ?>
                <button class="pqll-btn pqll-btn--brown" type="submit">Update case</button>
              </form>
            </div>
          </article>
        <?php endforeach; ?>
        <?php if (!$cases): ?><div class="pqll-empty">No leadership cases match these filters.</div><?php endif; ?>
      </section>

      <section class="pqll-panel" style="margin-top:16px">
        <h2>Recent Leadership Audit</h2>
        <table class="pqll-table">
          <tr><th>Time</th><th>Session</th><th>Actor</th><th>Action</th><th>Details</th></tr>
          <?php foreach ($audits as $audit): ?>
            <tr>
              <td><?php echo s(userdate((int)$audit->timecreated, get_string('strftimedatetimeshort'))); ?></td>
              <td>#<?php echo (int)$audit->sessionid; ?></td>
              <td><?php echo (int)$audit->actorid > 0 ? s(pqll_user_name((int)$audit->actorid, 'User ' . (int)$audit->actorid)) : 'System'; ?></td>
              <td><?php echo s(str_replace('_', ' ', (string)$audit->action)); ?></td>
              <td><span class="pqll-code"><?php echo s(pqll_short((string)$audit->details, 260)); ?></span></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$audits): ?><tr><td colspan="5">No leadership audit rows yet.</td></tr><?php endif; ?>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
