<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_practice_coach.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Chatbot Practice Coach Report');
$PAGE->set_heading('Chatbot Practice Coach Report');
$PAGE->add_body_class('pqh-practice-coach-report-page');

function pqlpc_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqlpc_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlpc_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqlpc_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlpc_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqlpc_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlpc_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqlpc_account_label(int $userid): string {
    return pqh_account_no_label($userid);
}

function pqlpc_csv(string $filename, array $headers, array $rows): void {
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

function pqlpc_session_guidance($row): array {
    $events = (int)($row->event_count ?? 0);
    $students = (int)($row->student_count ?? 0);
    $idle = (int)($row->idle_count ?? 0);
    $away = (int)($row->away_count ?? 0);
    $followups = (int)($row->teacher_followup_count ?? 0);
    if ($followups > 0 || $idle + $away >= 6) {
        return [
            'key' => 'teacher_followup',
            'teacher' => 'Review the learner activity and consider a short teacher follow-up before the next session.',
            'parent' => 'Your child received extra focus reminders during practice. The teacher can review and support the next step.',
        ];
    }
    if ($events > 0 && $students > 0) {
        return [
            'key' => 'continue_practice',
            'teacher' => 'Practice Coach support stayed within normal range. Student can continue the current lesson path.',
            'parent' => 'Practice support was provided during the session. The student can continue with the current lesson.',
        ];
    }
    return [
        'key' => 'no_coach_events',
        'teacher' => 'No Practice Coach events were recorded for this session.',
        'parent' => 'No Practice Coach support was needed or recorded for this session.',
    ];
}

if (!pqh_can_manage_academy_operations((int)$USER->id) && !pqlpc_has_teacher_role((int)$USER->id)) {
    pqh_access_denied(
        'The Chatbot Practice Coach report is available to administrators and teachers only.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Practice Coach report is not available for this account'
    );
}

$ready = pqlpc_table_exists('local_prequran_practice_coach_event')
    && pqlpc_table_exists('local_prequran_live_session');

$now = time();
$defaultfrom = usergetmidnight($now - (30 * DAYSECS));
$defaultto = usergetmidnight($now) + DAYSECS - 1;
$from = pqlpc_clean_date(optional_param('from', date('Y-m-d', $defaultfrom), PARAM_TEXT), $defaultfrom);
$to = pqlpc_clean_date(optional_param('to', date('Y-m-d', $defaultto), PARAM_TEXT), $defaultto) + DAYSECS - 1;
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$trigger = optional_param('trigger', '', PARAM_ALPHANUMEXT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);

if (!pqh_can_manage_academy_operations((int)$USER->id)) {
    $teacherid = (int)$USER->id;
}

$where = ['c.timecreated >= :fromtime', 'c.timecreated <= :totime'];
$params = ['fromtime' => $from, 'totime' => $to];
if ($teacherid > 0) {
    $teacherfilter = ['s.teacherid = :teacherid'];
    $params['teacherid'] = $teacherid;
    if (pqlpc_column_exists('local_prequran_live_session', 'report_to_teacherid')) {
        $teacherfilter[] = 's.report_to_teacherid = :reportteacherid';
        $params['reportteacherid'] = $teacherid;
    }
    $where[] = '(' . implode(' OR ', $teacherfilter) . ')';
}
if ($studentid > 0) {
    $where[] = 'c.userid = :studentid';
    $params['studentid'] = $studentid;
}
if ($sessionid > 0) {
    $where[] = 'c.live_sessionid = :sessionid';
    $params['sessionid'] = $sessionid;
}
if ($trigger !== '') {
    $where[] = 'c.trigger_key = :trigger';
    $params['trigger'] = $trigger;
}
$wheresql = implode(' AND ', $where);
$filterparams = [
    'from' => date('Y-m-d', $from),
    'to' => date('Y-m-d', $to),
];
if (pqh_can_manage_academy_operations((int)$USER->id) && $teacherid > 0) {
    $filterparams['teacherid'] = $teacherid;
}
if ($studentid > 0) {
    $filterparams['studentid'] = $studentid;
}
if ($sessionid > 0) {
    $filterparams['sessionid'] = $sessionid;
}
if ($trigger !== '') {
    $filterparams['trigger'] = $trigger;
}

$rows = [];
$studentrows = [];
$sessionrows = [];
$metrics = ['events' => 0, 'students' => 0, 'sessions' => 0, 'idle' => 0, 'away' => 0, 'starts' => 0];
$hasmessagefields = $ready && pqlpc_column_exists('local_prequran_practice_coach_event', 'message_source');
$hasrecommendation = $ready && pqlpc_column_exists('local_prequran_practice_coach_event', 'recommendation_key');

if ($ready) {
    $messagesourcefield = $hasmessagefields ? 'c.message_source' : "'' AS message_source";
    $aimodelfield = $hasmessagefields ? 'c.ai_model' : "'' AS ai_model";
    $recommendationkeyfield = $hasrecommendation ? 'c.recommendation_key' : "'' AS recommendation_key";
    $recommendationmessagefield = $hasrecommendation ? 'c.recommendation_message' : "'' AS recommendation_message";
    $rows = array_values($DB->get_records_sql(
        "SELECT c.id,
                c.live_sessionid,
                c.userid,
                c.lessonid,
                c.unitid,
                c.step_id,
                c.event_type,
                c.trigger_key,
                c.message,
                {$messagesourcefield},
                {$aimodelfield},
                {$recommendationkeyfield},
                {$recommendationmessagefield},
                c.timecreated,
                s.title,
                s.teacherid,
                s.scheduled_start
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}
       ORDER BY c.timecreated DESC, c.id DESC",
        $params,
        0,
        300
    ));

    $metricrow = $DB->get_record_sql(
        "SELECT COUNT(1) AS events,
                COUNT(DISTINCT c.userid) AS students,
                COUNT(DISTINCT c.live_sessionid) AS sessions,
                SUM(CASE WHEN c.trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN c.trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                SUM(CASE WHEN c.trigger_key = 'practice_start' THEN 1 ELSE 0 END) AS start_count
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}",
        $params
    );
    if ($metricrow) {
        $metrics = [
            'events' => (int)$metricrow->events,
            'students' => (int)$metricrow->students,
            'sessions' => (int)$metricrow->sessions,
            'idle' => (int)$metricrow->idle_count,
            'away' => (int)$metricrow->away_count,
            'starts' => (int)$metricrow->start_count,
        ];
    }

    $studentrows = array_values($DB->get_records_sql(
        "SELECT c.userid,
                COUNT(1) AS event_count,
                SUM(CASE WHEN c.trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN c.trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                MAX(c.timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}
       GROUP BY c.userid
       ORDER BY event_count DESC, latest_time DESC",
        $params,
        0,
        80
    ));

    $sessionrows = array_values($DB->get_records_sql(
        "SELECT c.live_sessionid,
                MAX(s.title) AS title,
                MAX(s.teacherid) AS teacherid,
                MAX(s.scheduled_start) AS scheduled_start,
                COUNT(1) AS event_count,
                COUNT(DISTINCT c.userid) AS student_count,
                SUM(CASE WHEN c.trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN c.trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                " . ($hasrecommendation ? "SUM(CASE WHEN c.recommendation_key = 'teacher_followup' THEN 1 ELSE 0 END)" : '0') . " AS teacher_followup_count,
                MAX(c.timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event} c
           JOIN {local_prequran_live_session} s ON s.id = c.live_sessionid
          WHERE {$wheresql}
       GROUP BY c.live_sessionid
       ORDER BY latest_time DESC",
        $params,
        0,
        80
    ));

    if ($export === 'csv') {
        $csvrows = [];
        foreach ($rows as $row) {
            $csvrows[] = [
                (int)$row->id,
                (int)$row->live_sessionid,
                (string)$row->title,
                (int)$row->teacherid,
                pqlpc_user_name((int)$row->teacherid),
                (int)$row->userid,
                pqlpc_user_name((int)$row->userid),
                (string)$row->lessonid,
                (string)$row->unitid,
                (string)$row->step_id,
                (string)$row->trigger_key,
                (string)$row->event_type,
                (string)($row->message_source ?? ''),
                (string)($row->recommendation_key ?? ''),
                (string)($row->recommendation_message ?? ''),
                (string)$row->message,
                userdate((int)$row->timecreated, get_string('strftimedatetimeshort')),
            ];
        }
        pqlpc_csv('quraan-practice-coach-events.csv', [
            'id', 'sessionid', 'session', 'teacherid', 'teacher', 'studentid', 'student',
            'lessonid', 'unitid', 'step_id', 'trigger', 'event_type', 'message_source',
            'recommendation_key', 'recommendation_message', 'message', 'time',
        ], $csvrows);
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-practice-coach-report-page header,
body.pqh-practice-coach-report-page footer,
body.pqh-practice-coach-report-page nav.navbar,
body.pqh-practice-coach-report-page #page-header,
body.pqh-practice-coach-report-page #page-footer,
body.pqh-practice-coach-report-page .drawer,
body.pqh-practice-coach-report-page .drawer-toggles,
body.pqh-practice-coach-report-page .block-region,
body.pqh-practice-coach-report-page [data-region="drawer"],
body.pqh-practice-coach-report-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-practice-coach-report-page #page,
body.pqh-practice-coach-report-page #page-content,
body.pqh-practice-coach-report-page #region-main,
body.pqh-practice-coach-report-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlpc-shell{min-height:100vh;padding:30px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlpc-wrap{max-width:1240px;margin:0 auto}
.pqlpc-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px;padding:22px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlpc-title{margin:0;font-size:30px;font-weight:950;color:#221b22}
.pqlpc-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqlpc-actions{display:flex;gap:9px;flex-wrap:wrap}
.pqlpc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 13px;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;border:0}
.pqlpc-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlpc-panel{margin-bottom:16px;padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlpc-form{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;align-items:end}
.pqlpc-field label{display:block;margin-bottom:5px;color:#5e7280;font-size:12px;font-weight:950}
.pqlpc-field input,.pqlpc-field select{width:100%;min-height:40px;border:1px solid rgba(23,48,68,.16);border-radius:8px;padding:0 10px;font-weight:800;color:#173044}
.pqlpc-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pqlpc-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlpc-metric strong{display:block;color:#6f4e32;font-size:24px;font-weight:950}
.pqlpc-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqlpc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.pqlpc-card{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlpc-card h2{margin:0 0 10px;font-size:20px;font-weight:950;color:#221b22}
.pqlpc-table{width:100%;border-collapse:collapse;background:#fff}
.pqlpc-table th,.pqlpc-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.09);text-align:left;vertical-align:top;font-size:13px}
.pqlpc-table th{background:#f4f8fb;color:#173044;font-weight:950}
.pqlpc-pill{display:inline-flex;min-height:26px;align-items:center;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlpc-empty{padding:18px;border:1px dashed rgba(23,48,68,.24);border-radius:10px;background:#fff;color:#5e7280;font-weight:850}
@media(max-width:980px){.pqlpc-form,.pqlpc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlpc-grid{grid-template-columns:1fr}.pqlpc-top{display:block}.pqlpc-actions{margin-top:12px}}
@media(max-width:560px){.pqlpc-form,.pqlpc-metrics{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlpc-shell">
  <div class="pqlpc-wrap">
    <section class="pqlpc-top pqh-workspace-top">
      <div>
        <h1 class="pqlpc-title pqh-workspace-title">Chatbot Practice Coach Report</h1>
        <p class="pqlpc-sub pqh-workspace-sub">Teacherless-session coaching prompts, focus nudges, and support history.</p>
      </div>
      <div class="pqlpc-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlpc-btn pqlpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlpc-btn pqlpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_reports.php'))->out(false); ?>">Live reports</a>
        <a class="pqlpc-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if (!$ready): ?>
      <div class="pqlpc-empty">Practice Coach reporting tables are not installed yet.</div>
    <?php else: ?>
      <section class="pqlpc-panel">
        <form class="pqlpc-form" method="get">
          <div class="pqlpc-field"><label>From</label><input type="date" name="from" value="<?php echo s(date('Y-m-d', $from)); ?>"></div>
          <div class="pqlpc-field"><label>To</label><input type="date" name="to" value="<?php echo s(date('Y-m-d', $to)); ?>"></div>
          <?php if (pqh_can_manage_academy_operations((int)$USER->id)): ?><div class="pqlpc-field"><label>Teacher ID</label><input type="number" name="teacherid" value="<?php echo (int)$teacherid; ?>"></div><?php endif; ?>
          <div class="pqlpc-field"><label>Student ID</label><input type="number" name="studentid" value="<?php echo (int)$studentid; ?>"></div>
          <div class="pqlpc-field"><label>Session ID</label><input type="number" name="sessionid" value="<?php echo (int)$sessionid; ?>"></div>
          <div class="pqlpc-field">
            <label>Trigger</label>
            <select name="trigger">
              <option value="">All triggers</option>
              <?php foreach (['practice_start', 'idle_nudge', 'screen_return', 'focus_return', 'progress_check', 'step_changed'] as $value): ?>
                <option value="<?php echo s($value); ?>" <?php echo $trigger === $value ? 'selected' : ''; ?>><?php echo s(ucwords(str_replace('_', ' ', $value))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <button class="pqlpc-btn" type="submit">Apply filters</button>
          <a class="pqlpc-btn pqlpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_practice_coach.php'))->out(false); ?>">Reset</a>
          <a class="pqlpc-btn pqlpc-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_practice_coach.php', array_merge($filterparams, ['export' => 'csv'])))->out(false); ?>">Export CSV</a>
        </form>
      </section>

      <section class="pqlpc-metrics" aria-label="Practice Coach metrics">
        <div class="pqlpc-metric"><strong><?php echo (int)$metrics['events']; ?></strong><span>coach events</span></div>
        <div class="pqlpc-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students supported</span></div>
        <div class="pqlpc-metric"><strong><?php echo (int)$metrics['sessions']; ?></strong><span>sessions</span></div>
        <div class="pqlpc-metric"><strong><?php echo (int)$metrics['idle']; ?></strong><span>idle nudges</span></div>
        <div class="pqlpc-metric"><strong><?php echo (int)$metrics['away']; ?></strong><span>screen returns</span></div>
        <div class="pqlpc-metric"><strong><?php echo (int)$metrics['starts']; ?></strong><span>practice starts</span></div>
      </section>

      <section class="pqlpc-grid">
        <article class="pqlpc-card">
          <h2>Students Supported</h2>
          <table class="pqlpc-table">
            <thead><tr><th>Student</th><th>Events</th><th>Focus</th><th>Latest</th></tr></thead>
            <tbody>
              <?php foreach ($studentrows as $row): ?>
                <tr><td><?php echo s(pqlpc_user_name((int)$row->userid)); ?><br><span class="pqlpc-pill"><?php echo s(pqlpc_account_label((int)$row->userid)); ?></span><br><span class="pqlpc-pill">#<?php echo (int)$row->userid; ?></span></td><td><?php echo (int)$row->event_count; ?></td><td><?php echo (int)$row->idle_count; ?> idle, <?php echo (int)$row->away_count; ?> away</td><td><?php echo !empty($row->latest_time) ? s(userdate((int)$row->latest_time, get_string('strftimedatetimeshort'))) : 'n/a'; ?></td></tr>
              <?php endforeach; ?>
              <?php if (!$studentrows): ?><tr><td colspan="4">No student coach events found.</td></tr><?php endif; ?>
            </tbody>
          </table>
        </article>
        <article class="pqlpc-card">
          <h2>Sessions</h2>
          <table class="pqlpc-table">
            <thead><tr><th>Session</th><th>Teacher</th><th>Events</th><th>End-Session Guidance</th><th>Latest</th></tr></thead>
            <tbody>
              <?php foreach ($sessionrows as $row): ?>
                <?php $guidance = pqlpc_session_guidance($row); ?>
                <tr>
                  <td><a href="<?php echo (new moodle_url('/local/hubredirect/live_monitor.php', ['sessionid' => (int)$row->live_sessionid]))->out(false); ?>"><?php echo s((string)$row->title); ?></a><br><span class="pqlpc-pill">#<?php echo (int)$row->live_sessionid; ?></span></td>
                  <td><?php echo s(pqlpc_user_name((int)$row->teacherid)); ?></td>
                  <td><?php echo (int)$row->event_count; ?> / <?php echo (int)$row->student_count; ?> students<br><span class="pqlpc-pill"><?php echo (int)$row->idle_count; ?> idle, <?php echo (int)$row->away_count; ?> away</span></td>
                  <td><span class="pqlpc-pill"><?php echo s(str_replace('_', ' ', (string)$guidance['key'])); ?></span><br><?php echo s((string)$guidance['teacher']); ?><br><span class="pqlpc-sub pqh-workspace-sub"><?php echo s((string)$guidance['parent']); ?></span></td>
                  <td><?php echo !empty($row->latest_time) ? s(userdate((int)$row->latest_time, get_string('strftimedatetimeshort'))) : 'n/a'; ?></td>
                </tr>
              <?php endforeach; ?>
              <?php if (!$sessionrows): ?><tr><td colspan="5">No session coach events found.</td></tr><?php endif; ?>
            </tbody>
          </table>
        </article>
      </section>

      <section class="pqlpc-card">
        <h2>Recent Coach Events</h2>
        <table class="pqlpc-table">
          <thead><tr><th>Time</th><th>Session</th><th>Student</th><th>Step</th><th>Trigger</th><th>Source</th><th>Recommendation</th><th>Message</th></tr></thead>
          <tbody>
            <?php foreach ($rows as $row): ?>
              <tr>
                <td><?php echo s(userdate((int)$row->timecreated, get_string('strftimedatetimeshort'))); ?></td>
                <td><?php echo s((string)$row->title); ?><br><span class="pqlpc-pill">#<?php echo (int)$row->live_sessionid; ?></span></td>
                <td><?php echo s(pqlpc_user_name((int)$row->userid)); ?><br><span class="pqlpc-pill"><?php echo s(pqlpc_account_label((int)$row->userid)); ?></span><br><span class="pqlpc-pill">#<?php echo (int)$row->userid; ?></span></td>
                <td><?php echo s(trim((string)$row->unitid . ' / ' . (string)$row->step_id, ' /')); ?></td>
                <td><?php echo s(ucwords(str_replace('_', ' ', (string)$row->trigger_key))); ?></td>
                <td><?php echo s(ucwords(str_replace('_', ' ', (string)($row->message_source ?? 'rule_based')))); ?><?php echo !empty($row->ai_model) ? '<br><span class="pqlpc-pill">' . s((string)$row->ai_model) . '</span>' : ''; ?></td>
                <td><?php echo s(ucwords(str_replace('_', ' ', (string)($row->recommendation_key ?? '')))); ?><?php echo !empty($row->recommendation_message) ? '<br><span class="pqlpc-sub pqh-workspace-sub">' . s((string)$row->recommendation_message) . '</span>' : ''; ?></td>
                <td><?php echo s((string)$row->message); ?></td>
              </tr>
            <?php endforeach; ?>
            <?php if (!$rows): ?><tr><td colspan="8">No coach events match these filters.</td></tr><?php endif; ?>
          </tbody>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
