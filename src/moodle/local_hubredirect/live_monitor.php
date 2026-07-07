<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/accesslib.php');

$sessionid = optional_param('sessionid', 0, PARAM_INT);
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = ['sessionid' => $sessionid];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
}
$workspaceurlparams = array_diff_key($urlparams, ['sessionid' => true]);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_monitor.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Lesson Monitor');
$PAGE->set_heading('Live Lesson Monitor');
$PAGE->add_body_class('pqh-live-monitor-page');

function pqlmon_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlmon_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlmon_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlmon_is_teacher_or_admin($session): bool {
    global $USER;
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return true;
    }
    if (pqlmon_column_exists('local_prequran_live_session', 'workspaceid')
        && (int)($session->workspaceid ?? 0) > 0
        && pqh_user_can_manage_workspace((int)$USER->id, (int)$session->workspaceid)) {
        return true;
    }
    return (int)$session->teacherid === (int)$USER->id;
}

function pqlmon_student_cohort(int $studentid, int $fallback = 0): int {
    global $DB;
    if ($fallback > 0) {
        return $fallback;
    }
    $cohortid = $DB->get_field_sql(
        "SELECT cohortid FROM {cohort_members} WHERE userid = ? ORDER BY id DESC",
        [$studentid],
        IGNORE_MULTIPLE
    );
    return $cohortid ? (int)$cohortid : 0;
}

function pqlmon_lesson_link(int $studentid, int $cohortid, string $unitid, int $sessionid, array $workspaceurlparams = []): moodle_url {
    $params = [
        'goto' => $unitid !== '' ? $unitid : 'alphabet_listen',
        'managed_student' => 0,
    ] + $workspaceurlparams;
    if ($cohortid > 0) {
        $params['cohortid'] = $cohortid;
    }
    $params['monitor_studentid'] = $studentid;
    if ($sessionid > 0) {
        $params['live_sessionid'] = $sessionid;
    }
    return new moodle_url('/local/hubredirect/issue_child.php', $params);
}

function pqlmon_progress(int $studentid): array {
    global $DB;
    $summary = [
        'units' => 0,
        'completed' => 0,
        'inprogress' => 0,
        'steps' => 0,
        'latest' => null,
    ];
    if (!pqlmon_table_exists('local_prequran_lessonprog')) {
        return $summary;
    }
    $summary['units'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid]);
    $summary['completed'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'completed']);
    $summary['inprogress'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'in_progress']);
    $summary['steps'] = (int)$DB->get_field_sql(
        "SELECT COALESCE(SUM(steps_completed), 0) FROM {local_prequran_lessonprog} WHERE userid = ?",
        [$studentid]
    );
    $stepstotalfield = pqlmon_column_exists('local_prequran_lessonprog', 'steps_total')
        ? 'steps_total'
        : (pqlmon_column_exists('local_prequran_lessonprog', 'total_steps') ? 'total_steps' : '0');
    $summary['latest'] = $DB->get_record_sql(
        "SELECT lessonid, unitid, lesson_title, unit_title, overall_status, overall_lastactivity, completion_percent, steps_completed, {$stepstotalfield} AS steps_total
           FROM {local_prequran_lessonprog}
          WHERE userid = ?
       ORDER BY overall_lastactivity DESC, timemodified DESC",
        [$studentid],
        IGNORE_MULTIPLE
    );
    return $summary;
}

function pqlmon_focus(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'scoped' => false,
        'sessions' => 0,
        'active_ms' => 0,
        'idle_count' => 0,
        'leave_count' => 0,
        'latest' => null,
    ];
    if (!pqlmon_table_exists('local_prequran_focusagg')) {
        return $summary;
    }
    $summary['ready'] = true;
    $haslivesession = pqlmon_column_exists('local_prequran_focusagg', 'live_sessionid');
    if (!$haslivesession || $sessionid <= 0) {
        return $summary;
    }
    $summary['scoped'] = true;
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS sessions,
                COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                COALESCE(SUM(leave_count), 0) AS leave_count
           FROM {local_prequran_focusagg}
          WHERE userid = ?
            AND live_sessionid = ?",
        [$studentid, $sessionid]
    );
    if ($row) {
        $summary['sessions'] = (int)$row->sessions;
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['leave_count'] = (int)$row->leave_count;
    }
    $summary['latest'] = $DB->get_record_sql(
        "SELECT lessonid, unitid, step_id, active_ms, idle_count, leave_count, last_time, live_sessionid
           FROM {local_prequran_focusagg}
          WHERE userid = ?
            AND live_sessionid = ?
       ORDER BY last_time DESC",
        [$studentid, $sessionid],
        IGNORE_MULTIPLE
    );
    return $summary;
}

function pqlmon_speak(int $studentid): array {
    global $DB;
    $summary = ['ready' => false, 'count' => 0, 'latest' => null];
    if (!pqlmon_table_exists('local_prequran_speakrec')) {
        return $summary;
    }
    $summary['ready'] = true;
    $summary['count'] = (int)$DB->count_records_select(
        'local_prequran_speakrec',
        'userid = :userid AND status <> :failed',
        ['userid' => $studentid, 'failed' => 'upload_failed']
    );
    $summary['latest'] = $DB->get_record_sql(
        "SELECT id, lessonid, unitid, letter_name, letter_text, duration_ms, timecreated
           FROM {local_prequran_speakrec}
          WHERE userid = ?
            AND status <> ?
       ORDER BY timecreated DESC, id DESC",
        [$studentid, 'upload_failed'],
        IGNORE_MULTIPLE
    );
    return $summary;
}

function pqlmon_practice_coach(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'count' => 0,
        'idle' => 0,
        'away' => 0,
        'latest' => null,
        'events' => [],
    ];
    if (!pqlmon_table_exists('local_prequran_practice_coach_event')) {
        return $summary;
    }
    $summary['ready'] = true;
    $recommendationselect = pqlmon_column_exists('local_prequran_practice_coach_event', 'recommendation_key')
        ? 'recommendation_key, recommendation_message, message_source, ai_model,'
        : "'' AS recommendation_key, '' AS recommendation_message, '' AS message_source, '' AS ai_model,";
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS coach_count,
                SUM(CASE WHEN trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                MAX(timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['count'] = (int)$row->coach_count;
        $summary['idle'] = (int)$row->idle_count;
        $summary['away'] = (int)$row->away_count;
    }
    $summary['latest'] = $DB->get_record_sql(
        "SELECT trigger_key, {$recommendationselect} message, timecreated
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY timecreated DESC, id DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        IGNORE_MULTIPLE
    );
    $summary['events'] = array_values($DB->get_records_sql(
        "SELECT id, trigger_key, event_type, step_id, {$recommendationselect} message, timecreated
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY timecreated DESC, id DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        0,
        5
    ));
    return $summary;
}

function pqlmon_format_minutes(int $ms): string {
    $minutes = (int)round($ms / 60000);
    return $minutes . ' min';
}

function pqlmon_time_ago(int $timestamp): string {
    if ($timestamp <= 0) {
        return 'no activity yet';
    }
    $seconds = max(0, time() - $timestamp);
    if ($seconds < 10) {
        return 'just now';
    }
    if ($seconds < MINSECS) {
        return $seconds . ' seconds ago';
    }
    if ($seconds < HOURSECS) {
        $minutes = (int)floor($seconds / MINSECS);
        return $minutes . ' min ago';
    }
    $hours = (int)floor($seconds / HOURSECS);
    return $hours . ' hr ago';
}

function pqlmon_duration_since(int $timestamp): string {
    if ($timestamp <= 0) {
        return 'unknown';
    }
    $seconds = max(0, time() - $timestamp);
    if ($seconds < MINSECS) {
        return $seconds . ' sec';
    }
    if ($seconds < HOURSECS) {
        return (int)floor($seconds / MINSECS) . ' min';
    }
    return (int)floor($seconds / HOURSECS) . ' hr';
}

function pqlmon_step_label(string $stepid): string {
    $stepid = trim($stepid);
    if ($stepid === '') {
        return 'Not started';
    }
    $labels = [
        'lecture' => 'Lecture',
        'listen' => 'Listen',
        'watch' => 'Watch',
        'speak' => 'Speak',
        'write' => 'Write',
        'trace' => 'Trace',
        'submit' => 'Submit',
        'practice' => 'Practice',
        'rules' => 'Rules',
    ];
    $normalized = strtolower($stepid);
    foreach ($labels as $needle => $label) {
        if ($normalized === $needle || strpos($normalized, $needle) !== false) {
            return $label;
        }
    }
    return ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqlmon_live_indicators(array $focus, array $progress): array {
    $latestfocus = $focus['latest'] ?? null;
    $lastfocus = $latestfocus ? (int)$latestfocus->last_time : 0;
    $lastactivity = $lastfocus;
    $age = $lastactivity > 0 ? max(0, time() - $lastactivity) : PHP_INT_MAX;

    $latestidle = $latestfocus ? (int)$latestfocus->idle_count : 0;
    $latestleave = $latestfocus ? (int)$latestfocus->leave_count : 0;
    $totalidle = (int)($focus['idle_count'] ?? 0);
    $totalleave = (int)($focus['leave_count'] ?? 0);

    if ($lastactivity <= 0) {
        $status = 'Not opened yet';
        $tone = 'muted';
    } else if ($age <= 75) {
        $status = 'Currently active';
        $tone = 'active';
    } else if ($age <= 5 * MINSECS && ($latestidle > 0 || $totalidle > 0)) {
        $status = 'Idle for ' . pqlmon_duration_since($lastactivity);
        $tone = 'idle';
    } else if ($latestleave > 0 || ($age > 5 * MINSECS && $totalleave > 0)) {
        $status = 'Left lesson tab';
        $tone = 'away';
    } else {
        $status = 'Last seen ' . pqlmon_time_ago($lastactivity);
        $tone = 'muted';
    }

    $stepid = $latestfocus ? (string)$latestfocus->step_id : '';
    return [
        'status' => $status,
        'tone' => $tone,
        'step' => pqlmon_step_label($stepid),
        'last_activity' => pqlmon_time_ago($lastactivity),
        'idle_summary' => $totalidle > 0 ? 'Idle events: ' . $totalidle : 'No idle events',
        'leave_summary' => $totalleave > 0 ? 'Left tab: ' . $totalleave : 'No tab leaves',
    ];
}

function pqlmon_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlmon_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

if (!pqlmon_table_exists('local_prequran_live_session') || !pqlmon_table_exists('local_prequran_live_participant')) {
    pqh_access_denied(
        'Live session tables are not installed yet.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Live lesson monitor unavailable'
    );
}

$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqh_access_denied(
        'Choose a valid live session before opening the lesson monitor.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Live lesson monitor unavailable'
    );
}
if ($requestedworkspaceid > 0
    && pqlmon_column_exists('local_prequran_live_session', 'workspaceid')
    && (int)($session->workspaceid ?? 0) !== $requestedworkspaceid) {
    $actualworkspaceid = (int)($session->workspaceid ?? 0);
    pqh_access_denied(
        'This live session belongs to workspace #' . $actualworkspaceid . ', not workspace #' . $requestedworkspaceid . '. Choose a session from this workspace live-session list.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Workspace live monitor access required'
    );
}
if (!pqlmon_is_teacher_or_admin($session)) {
    pqh_access_denied(
        'Only the assigned teacher or a workspace administrator can monitor this live session.',
        new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams),
        'Live monitor access required'
    );
}
pqlmon_audit($sessionid, 'lesson_monitor_opened', 'session', $sessionid);

$students = $DB->get_records_sql(
    "SELECT *
       FROM {local_prequran_live_participant}
      WHERE sessionid = :sessionid
        AND role = :role
        AND status = :status
   ORDER BY displayname ASC, userid ASC",
    ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active']
);
$teacher = core_user::get_user((int)$session->teacherid);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-monitor-page header,
body.pqh-live-monitor-page footer,
body.pqh-live-monitor-page nav.navbar,
body.pqh-live-monitor-page #page-header,
body.pqh-live-monitor-page #page-footer,
body.pqh-live-monitor-page .drawer,
body.pqh-live-monitor-page .drawer-toggles,
body.pqh-live-monitor-page .block-region,
body.pqh-live-monitor-page [data-region="drawer"],
body.pqh-live-monitor-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-monitor-page #page,
body.pqh-live-monitor-page #page-content,
body.pqh-live-monitor-page #region-main,
body.pqh-live-monitor-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlmon-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlmon-wrap{max-width:1180px;margin:0 auto}
.pqlmon-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlmon-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlmon-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlmon-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlmon-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlmon-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlmon-focus{margin-bottom:16px;padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlmon-focus h2{margin:0 0 8px;font-size:20px;font-weight:950}
.pqlmon-list{display:grid;gap:14px}
.pqlmon-card{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlmon-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
.pqlmon-card h2{margin:0;font-size:20px;font-weight:950}
.pqlmon-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlmon-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}
.pqlmon-metric{padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#f8fafc}
.pqlmon-metric strong{display:block;font-size:20px;font-weight:950;color:#6f4e32}
.pqlmon-metric span{display:block;margin-top:2px;color:#5e7280;font-size:12px;font-weight:850}
.pqlmon-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlmon-live{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0;padding:10px;border-radius:8px;background:#f8fafc;border:1px solid rgba(23,48,68,.1)}
.pqlmon-live__item{min-height:44px;padding:8px 10px;border-radius:7px;background:#fff;border:1px solid rgba(23,48,68,.08)}
.pqlmon-live__item strong{display:block;color:#173044;font-size:13px;font-weight:950}
.pqlmon-live__item span{display:block;margin-top:2px;color:#5e7280;font-size:11px;font-weight:850}
.pqlmon-live__status{border-color:rgba(23,48,68,.12)}
.pqlmon-live__status--active{background:#eefaf3;border-color:#8fd3aa}
.pqlmon-live__status--idle{background:#fff8e8;border-color:#e5bd68}
.pqlmon-live__status--away{background:#fff0ee;border-color:#e7a19b}
.pqlmon-live__status--muted{background:#f8fafc}
.pqlmon-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlmon-coach{margin:12px 0;padding:12px;border:1px solid rgba(47,111,78,.16);border-radius:8px;background:#f3fff7}
.pqlmon-coach h3{margin:0 0 8px;color:#2f6f4e;font-size:15px;font-weight:950}
.pqlmon-coach__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.pqlmon-coach__item{padding:9px;border:1px solid rgba(47,111,78,.13);border-radius:7px;background:#fff}
.pqlmon-coach__item strong{display:block;color:#2f6f4e;font-size:16px;font-weight:950}
.pqlmon-coach__item span{display:block;margin-top:2px;color:#5e7280;font-size:11px;font-weight:850}
.pqlmon-coach__events{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:7px}
.pqlmon-coach__events li{padding:8px;border-radius:7px;background:#fff;border:1px solid rgba(47,111,78,.1);color:#173044;font-size:12px;font-weight:800}
@media(max-width:900px){.pqlmon-grid,.pqlmon-live{grid-template-columns:repeat(2,minmax(0,1fr))}.pqlmon-top,.pqlmon-card__head{display:block}.pqlmon-actions{margin-top:12px}.pqlmon-title{font-size:24px}}
@media(max-width:560px){.pqlmon-grid,.pqlmon-live,.pqlmon-coach__grid{grid-template-columns:1fr}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqlmon-shell">
  <div class="pqlmon-wrap">
    <section class="pqlmon-top pqh-workspace-top">
      <div>
        <h1 class="pqlmon-title pqh-workspace-title">Live Lesson Monitor</h1>
        <p class="pqlmon-sub pqh-workspace-sub"><?php echo s((string)$session->title); ?> - <?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
      </div>
      <div class="pqlmon-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlmon-btn pqlmon-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $urlparams))->out(false); ?>">Attendance &amp; notes</a>
        <a class="pqlmon-btn pqlmon-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher.php', $workspaceurlparams))->out(false); ?>">Teacher workspace</a>
        <a class="pqlmon-btn pqlmon-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $workspaceurlparams))->out(false); ?>">Live sessions</a>
        <a class="pqlmon-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', array_merge($urlparams, ['action' => 'join', 'sesskey' => sesskey()])))->out(false); ?>">Start class</a>
      </div>
    </section>

    <section class="pqlmon-focus">
      <h2>Session Lesson Focus</h2>
      <p class="pqlmon-meta">Session #<?php echo (int)$sessionid; ?> - <?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> to <?php echo userdate((int)$session->scheduled_end, get_string('strftimetime')); ?> - Lesson: <?php echo s((string)$session->lessonid !== '' ? (string)$session->lessonid : 'not set'); ?> - Unit: <?php echo s((string)$session->unitid !== '' ? (string)$session->unitid : 'not set'); ?></p>
    </section>

    <?php if (!$students): ?>
      <div class="pqlmon-empty">No active students are assigned to this session.</div>
    <?php else: ?>
      <section class="pqlmon-list" aria-label="Student self-study monitor">
        <?php foreach ($students as $participant): ?>
          <?php
            $studentid = (int)($participant->studentid ?: $participant->userid);
            $student = core_user::get_user($studentid);
            $name = $student ? fullname($student) : (string)$participant->displayname;
            $progress = pqlmon_progress($studentid);
            $focus = pqlmon_focus($studentid, $sessionid);
            $speak = pqlmon_speak($studentid);
            $coach = pqlmon_practice_coach($studentid, $sessionid);
            $indicators = pqlmon_live_indicators($focus, $progress);
            $cohortid = pqlmon_student_cohort($studentid, (int)$session->cohortid);
            $unitid = (string)$session->unitid !== '' ? (string)$session->unitid : ($progress['latest'] ? (string)$progress['latest']->unitid : '');
            $lessonurl = pqlmon_lesson_link($studentid, $cohortid, $unitid, $sessionid, $workspaceurlparams);
          ?>
          <article class="pqlmon-card">
            <div class="pqlmon-card__head">
              <div>
                <h2><?php echo s($name); ?></h2>
                <p class="pqlmon-meta">Student #<?php echo $studentid; ?><?php echo $progress['latest'] ? ' - Latest: ' . s((string)($progress['latest']->unit_title ?: $progress['latest']->lesson_title ?: $progress['latest']->unitid)) : ''; ?></p>
              </div>
              <span class="pqlmon-pill"><?php echo $progress['latest'] ? s(str_replace('_', ' ', (string)$progress['latest']->overall_status)) : 'no progress'; ?></span>
            </div>
            <div class="pqlmon-grid">
              <div class="pqlmon-metric"><strong><?php echo (int)$progress['completed']; ?>/<?php echo (int)$progress['units']; ?></strong><span>completed units</span></div>
              <div class="pqlmon-metric"><strong><?php echo $progress['latest'] ? (int)$progress['latest']->completion_percent . '%' : '0%'; ?></strong><span>latest progress</span></div>
              <div class="pqlmon-metric"><strong><?php echo (int)$progress['steps']; ?></strong><span>steps/stars</span></div>
              <div class="pqlmon-metric"><strong><?php echo $focus['ready'] ? pqlmon_format_minutes((int)$focus['active_ms']) : 'n/a'; ?></strong><span>active self-study</span></div>
            </div>
            <div class="pqlmon-live" aria-label="Live activity indicators for <?php echo s($name); ?>">
              <div class="pqlmon-live__item pqlmon-live__status pqlmon-live__status--<?php echo s($indicators['tone']); ?>"><strong><?php echo s($indicators['status']); ?></strong><span>live status</span></div>
              <div class="pqlmon-live__item"><strong><?php echo s($indicators['step']); ?></strong><span>current step</span></div>
              <div class="pqlmon-live__item"><strong><?php echo s($indicators['last_activity']); ?></strong><span>last activity</span></div>
              <div class="pqlmon-live__item"><strong><?php echo s($indicators['idle_summary']); ?></strong><span>idle signal</span></div>
              <div class="pqlmon-live__item"><strong><?php echo s($indicators['leave_summary']); ?></strong><span>tab signal</span></div>
            </div>
            <p class="pqlmon-meta">
              Focus: <?php echo $focus['latest'] ? s(trim((string)$focus['latest']->unitid . ' / ' . (string)$focus['latest']->step_id, ' /')) : ($focus['ready'] && !$focus['scoped'] ? 'session-based focus schema is not installed yet' : 'no focus data for this session'); ?>
              <?php echo $focus['ready'] ? ' - idle ' . (int)$focus['idle_count'] . ', left ' . (int)$focus['leave_count'] : ''; ?>
            </p>
            <p class="pqlmon-meta">
              Speak practice: <?php echo $speak['ready'] ? (int)$speak['count'] . ' recordings' : 'not available'; ?>
              <?php echo $speak['latest'] ? ' - latest ' . s((string)($speak['latest']->letter_name ?: $speak['latest']->unitid)) : ''; ?>
            </p>
            <?php if ($coach['ready']): ?>
              <section class="pqlmon-coach" aria-label="Chatbot Practice Coach activity">
                <h3>Chatbot Practice Coach</h3>
                <div class="pqlmon-coach__grid">
                  <div class="pqlmon-coach__item"><strong><?php echo (int)$coach['count']; ?></strong><span>coach prompts</span></div>
                  <div class="pqlmon-coach__item"><strong><?php echo (int)$coach['idle']; ?></strong><span>idle nudges</span></div>
                  <div class="pqlmon-coach__item"><strong><?php echo (int)$coach['away']; ?></strong><span>screen returns</span></div>
                  <div class="pqlmon-coach__item"><strong><?php echo $coach['latest'] ? s(pqlmon_time_ago((int)$coach['latest']->timecreated)) : 'none'; ?></strong><span>latest coach event</span></div>
                </div>
                <?php if ($coach['events']): ?>
                  <ul class="pqlmon-coach__events">
                    <?php foreach ($coach['events'] as $event): ?>
                      <li><strong><?php echo s(ucwords(str_replace('_', ' ', (string)$event->trigger_key))); ?></strong> - <?php echo s((string)$event->message); ?> <span class="pqlmon-meta"><?php echo s(userdate((int)$event->timecreated, get_string('strftimetime'))); ?><?php echo !empty($event->message_source) ? ' - ' . s(str_replace('_', ' ', (string)$event->message_source)) : ''; ?></span><?php echo !empty($event->recommendation_message) ? '<br><span class="pqlmon-meta">Recommendation: ' . s((string)$event->recommendation_message) . '</span>' : ''; ?></li>
                    <?php endforeach; ?>
                  </ul>
                <?php else: ?>
                  <p class="pqlmon-meta">No Practice Coach prompts recorded for this student yet.</p>
                <?php endif; ?>
              </section>
            <?php endif; ?>
            <div class="pqlmon-actions pqh-workspace-actions">
              <a class="pqlmon-btn" href="<?php echo $lessonurl->out(false); ?>">Open lesson</a>
              <a class="pqlmon-btn pqlmon-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/recordings.php', array_merge($workspaceurlparams, ['childid' => $studentid])))->out(false); ?>">Speak recordings</a>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
