<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$seriesid = optional_param('seriesid', 0, PARAM_INT);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($seriesid > 0) {
    $urlparams['seriesid'] = $seriesid;
}

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and admins can manage recurring workspace sessions.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', array_diff_key($urlparams, ['seriesid' => true])),
        'Recurring workspace sessions access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening recurring workspace sessions.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', array_diff_key($urlparams, ['seriesid' => true])),
        'Recurring workspace sessions unavailable'
    );
}
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_series.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Workspace Recurring Sessions');
$PAGE->set_heading('Workspace Recurring Sessions');
$PAGE->add_body_class('pqw-series-page');

function pqwser_ready(): bool {
    return pqh_table_exists_safe('local_prequran_live_series')
        && pqh_table_exists_safe('local_prequran_live_session')
        && pqh_table_has_field_safe('local_prequran_live_series', 'workspaceid')
        && pqh_table_has_field_safe('local_prequran_live_session', 'seriesid');
}

function pqwser_fields(string $table, array $wanted): string {
    $fields = [];
    foreach ($wanted as $field) {
        if (pqh_table_has_field_safe($table, $field)) {
            $fields[] = $field;
        }
    }
    return $fields ? implode(',', $fields) : '*';
}

function pqwser_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwser_parse_datetime(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $timestamp = strtotime($value);
    return $timestamp ? (int)$timestamp : 0;
}

function pqwser_audit(int $workspaceid, string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $details['workspaceid'] = $workspaceid;
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $targettype === 'session' ? $targetid : 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqwser_series(int $workspaceid): array {
    global $DB;
    if (!pqwser_ready()) {
        return [];
    }
    $rows = array_values($DB->get_records(
        'local_prequran_live_series',
        ['workspaceid' => $workspaceid],
        'timemodified DESC, id DESC',
        pqwser_fields('local_prequran_live_series', ['id', 'workspaceid', 'teacherid', 'title', 'lessonid', 'unitid', 'pattern', 'duration_minutes', 'date_start', 'date_end', 'session_count', 'status', 'timemodified']),
        0,
        80
    ));
    foreach ($rows as $row) {
        $row->session_total = (int)$DB->count_records('local_prequran_live_session', ['seriesid' => (int)$row->id]);
        $row->cancelled_total = (int)$DB->count_records('local_prequran_live_session', ['seriesid' => (int)$row->id, 'status' => 'cancelled']);
        $row->upcoming_total = (int)$DB->count_records_select(
            'local_prequran_live_session',
            'seriesid = ? AND scheduled_start >= ? AND status <> ?',
            [(int)$row->id, time(), 'cancelled']
        );
    }
    return $rows;
}

function pqwser_get_series(int $workspaceid, int $seriesid): ?stdClass {
    global $DB;
    if (!pqwser_ready() || $seriesid <= 0) {
        return null;
    }
    return $DB->get_record('local_prequran_live_series', ['id' => $seriesid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) ?: null;
}

function pqwser_sessions(int $seriesid): array {
    global $DB;
    if (!pqwser_ready() || $seriesid <= 0) {
        return [];
    }
    return array_values($DB->get_records(
        'local_prequran_live_session',
        ['seriesid' => $seriesid],
        'scheduled_start ASC, id ASC',
        pqwser_fields('local_prequran_live_session', ['id', 'workspaceid', 'seriesid', 'series_sequence', 'title', 'teacherid', 'lessonid', 'unitid', 'scheduled_start', 'scheduled_end', 'timezone', 'status', 'bbb_created', 'timemodified'])
    ));
}

function pqwser_series_studentids(int $seriesid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_participant')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT p.userid
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
          WHERE s.seriesid = :seriesid
            AND p.role = :role
            AND p.status = :status",
        ['seriesid' => $seriesid, 'role' => 'student', 'status' => 'active']
    );
    return array_values(array_map('intval', array_keys($rows)));
}

function pqwser_notify_series_change(stdClass $series, string $subject, string $message, string $eventtype): void {
    $context = pqh_requested_consumer_context();
    $params = ['workspaceid' => (int)$series->workspaceid];
    if (!empty($context->consumerslug)) {
        $params['consumer'] = (string)$context->consumerslug;
    }
    $url = new moodle_url('/local/hubredirect/live_sessions.php', $params);
    $teacherid = (int)($series->teacherid ?? 0);
    if ($teacherid > 0) {
        local_prequran_notify_user_live_update(0, $teacherid, $subject, $message, $url, 'Open live sessions', $eventtype);
    }
    foreach (pqwser_series_studentids((int)$series->id) as $studentid) {
        local_prequran_notify_parent_live_update(0, $studentid, $subject, $message, $url, 'Open live sessions', $eventtype);
    }
}

function pqwser_update_series(int $workspaceid, int $seriesid): void {
    global $DB;
    $series = pqwser_get_series($workspaceid, $seriesid);
    if (!$series) {
        throw new invalid_parameter_exception('Recurring series was not found in this workspace.');
    }

    $title = trim(optional_param('title', '', PARAM_TEXT));
    if ($title === '') {
        throw new invalid_parameter_exception('Series title is required.');
    }
    $duration = max(15, min(240, optional_param('duration_minutes', 60, PARAM_INT)));
    $lessonid = trim(optional_param('lessonid', '', PARAM_ALPHANUMEXT));
    $unitid = trim(optional_param('unitid', '', PARAM_ALPHANUMEXT));
    $now = time();

    $series->title = $title;
    if (pqh_table_has_field_safe('local_prequran_live_series', 'lessonid')) {
        $series->lessonid = $lessonid;
    }
    if (pqh_table_has_field_safe('local_prequran_live_series', 'unitid')) {
        $series->unitid = $unitid;
    }
    if (pqh_table_has_field_safe('local_prequran_live_series', 'duration_minutes')) {
        $series->duration_minutes = $duration;
    }
    $series->timemodified = $now;
    $DB->update_record('local_prequran_live_series', $series);

    $sessions = $DB->get_records_select(
        'local_prequran_live_session',
        'seriesid = ? AND scheduled_start >= ? AND status <> ?',
        [$seriesid, $now, 'cancelled']
    );
    foreach ($sessions as $session) {
        $session->title = $title;
        if (pqh_table_has_field_safe('local_prequran_live_session', 'lessonid')) {
            $session->lessonid = $lessonid;
        }
        if (pqh_table_has_field_safe('local_prequran_live_session', 'unitid')) {
            $session->unitid = $unitid;
        }
        if (pqh_table_has_field_safe('local_prequran_live_session', 'scheduled_end')) {
            $session->scheduled_end = (int)$session->scheduled_start + ($duration * 60);
        }
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
    }

    pqwser_audit($workspaceid, 'workspace_series_updated', 'series', $seriesid, ['future_sessions_updated' => count($sessions)]);
    pqwser_notify_series_change($series, 'Recurring live series updated', $title . ' has been updated for future workspace classes.', 'workspace_series_updated');
}

function pqwser_reschedule_session(int $workspaceid, int $sessionid): int {
    global $DB;
    $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
    if (!$session) {
        throw new invalid_parameter_exception('Class session was not found in this workspace.');
    }
    $series = pqwser_get_series($workspaceid, (int)($session->seriesid ?? 0));
    if (!$series) {
        throw new invalid_parameter_exception('This class is not part of a workspace recurring series.');
    }
    if ((string)($session->status ?? '') === 'completed') {
        throw new invalid_parameter_exception('Completed classes cannot be rescheduled.');
    }
    $newstart = pqwser_parse_datetime(optional_param('scheduled_start', '', PARAM_TEXT));
    if ($newstart <= 0) {
        throw new invalid_parameter_exception('Choose a valid new class date and time.');
    }
    $duration = max(15 * 60, (int)($session->scheduled_end ?? 0) - (int)($session->scheduled_start ?? 0));
    $oldstart = (int)($session->scheduled_start ?? 0);
    $session->scheduled_start = $newstart;
    $session->scheduled_end = $newstart + $duration;
    if (pqh_table_has_field_safe('local_prequran_live_session', 'bbb_created')) {
        $session->bbb_created = 0;
    }
    foreach (['bbb_internal_meeting_id', 'bbb_last_error'] as $field) {
        if (pqh_table_has_field_safe('local_prequran_live_session', $field)) {
            $session->{$field} = '';
        }
    }
    if (pqh_table_has_field_safe('local_prequran_live_session', 'bbb_create_time')) {
        $session->bbb_create_time = 0;
    }
    if (pqh_table_has_field_safe('local_prequran_live_session', 'bbb_meeting_id')) {
        $session->bbb_meeting_id = 'prequran-live-' . (int)$session->id;
    }
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    pqwser_audit($workspaceid, 'workspace_series_session_rescheduled', 'session', $sessionid, ['seriesid' => (int)$series->id, 'oldstart' => $oldstart, 'newstart' => $newstart]);
    pqwser_notify_series_change($series, 'Workspace class rescheduled', (string)$session->title . ' has been moved to ' . userdate($newstart, get_string('strftimedatetimeshort')) . '.', 'workspace_series_session_rescheduled');
    return (int)$series->id;
}

function pqwser_cancel_session(int $workspaceid, int $sessionid): int {
    global $DB, $USER;
    $session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
    if (!$session) {
        throw new invalid_parameter_exception('Class session was not found in this workspace.');
    }
    $series = pqwser_get_series($workspaceid, (int)($session->seriesid ?? 0));
    if (!$series) {
        throw new invalid_parameter_exception('This class is not part of a workspace recurring series.');
    }
    $reason = trim(optional_param('cancellation_reason', '', PARAM_TEXT));
    $session->status = 'cancelled';
    if (pqh_table_has_field_safe('local_prequran_live_session', 'cancelledby')) {
        $session->cancelledby = (int)$USER->id;
    }
    if (pqh_table_has_field_safe('local_prequran_live_session', 'cancellation_reason')) {
        $session->cancellation_reason = $reason;
    }
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);

    pqwser_audit($workspaceid, 'workspace_series_single_session_cancelled', 'session', $sessionid, ['seriesid' => (int)$series->id, 'reason' => $reason]);
    pqwser_notify_series_change($series, 'Workspace class cancelled', (string)$session->title . ' has been cancelled. ' . $reason, 'workspace_series_single_session_cancelled');
    return (int)$series->id;
}

function pqwser_cancel_series(int $workspaceid, int $seriesid): void {
    global $DB, $USER;
    $series = pqwser_get_series($workspaceid, $seriesid);
    if (!$series) {
        throw new invalid_parameter_exception('Recurring series was not found in this workspace.');
    }
    $reason = trim(optional_param('cancellation_reason', '', PARAM_TEXT));
    $now = time();
    $series->status = 'cancelled';
    if (pqh_table_has_field_safe('local_prequran_live_series', 'cancelledby')) {
        $series->cancelledby = (int)$USER->id;
    }
    if (pqh_table_has_field_safe('local_prequran_live_series', 'cancellation_reason')) {
        $series->cancellation_reason = $reason;
    }
    $series->timemodified = $now;
    $DB->update_record('local_prequran_live_series', $series);

    $sessions = $DB->get_records_select(
        'local_prequran_live_session',
        'seriesid = ? AND scheduled_start >= ? AND status NOT IN (?, ?)',
        [$seriesid, $now, 'cancelled', 'completed']
    );
    foreach ($sessions as $session) {
        $session->status = 'cancelled';
        if (pqh_table_has_field_safe('local_prequran_live_session', 'cancelledby')) {
            $session->cancelledby = (int)$USER->id;
        }
        if (pqh_table_has_field_safe('local_prequran_live_session', 'cancellation_reason')) {
            $session->cancellation_reason = $reason;
        }
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
    }

    pqwser_audit($workspaceid, 'workspace_series_cancelled', 'series', $seriesid, ['future_sessions_cancelled' => count($sessions), 'reason' => $reason]);
    pqwser_notify_series_change($series, 'Recurring live series cancelled', (string)$series->title . ' has been cancelled. ' . $reason, 'workspace_series_cancelled');
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the recurring workspace sessions page and try again.',
            new moodle_url('/local/hubredirect/workspace_series.php', $urlparams),
            'Recurring workspace session form expired'
        );
    }
    try {
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action === 'update_series') {
            $seriesid = optional_param('seriesid', 0, PARAM_INT);
            pqwser_update_series($workspaceid, $seriesid);
            $message = 'Recurring series updated.';
        } else if ($action === 'reschedule_session') {
            $seriesid = pqwser_reschedule_session($workspaceid, optional_param('sessionid', 0, PARAM_INT));
            $message = 'Class rescheduled.';
        } else if ($action === 'cancel_session') {
            $seriesid = pqwser_cancel_session($workspaceid, optional_param('sessionid', 0, PARAM_INT));
            $message = 'Class cancelled.';
        } else if ($action === 'cancel_series') {
            $seriesid = optional_param('seriesid', 0, PARAM_INT);
            pqwser_cancel_series($workspaceid, $seriesid);
            $message = 'Recurring series cancelled.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$selectedseries = pqwser_get_series($workspaceid, $seriesid);
$seriesrows = pqwser_series($workspaceid);
$sessions = $selectedseries ? pqwser_sessions((int)$selectedseries->id) : [];
$seriesstudents = $selectedseries ? count(pqwser_series_studentids((int)$selectedseries->id)) : 0;

echo $OUTPUT->header();
?>
<style>
body.pqw-series-page header,body.pqw-series-page footer,body.pqw-series-page nav.navbar,body.pqw-series-page #page-header,body.pqw-series-page #page-footer,body.pqw-series-page .drawer,body.pqw-series-page .drawer-toggles,body.pqw-series-page .block-region,body.pqw-series-page [data-region="drawer"],body.pqw-series-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-series-page #page,body.pqw-series-page #page-content,body.pqw-series-page #region-main,body.pqw-series-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwser-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwser-wrap{max-width:1280px;margin:0 auto}.pqwser-top,.pqwser-panel,.pqwser-card{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwser-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqwser-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqwser-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwser-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqwser-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwser-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwser-btn--danger{background:#8a3b2e}.pqwser-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:14px}.pqwser-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwser-metric{padding:14px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fff}.pqwser-metric strong{display:block;color:#221b22;font-size:25px}.pqwser-metric span{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwser-field{display:grid;gap:5px;margin-bottom:10px}.pqwser-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqwser-input,.pqwser-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqwser-textarea{min-height:70px;padding:10px}.pqwser-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqwser-alert--ok{background:#edf9ef;color:#245c35}.pqwser-alert--bad{background:#fff0ed;color:#883526}.pqwser-table{width:100%;border-collapse:separate;border-spacing:0}.pqwser-table th,.pqwser-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwser-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwser-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwser-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqwser-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqwser-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwser-inline{display:grid;gap:6px;min-width:180px}.pqwser-list{display:grid;gap:10px}
@media(max-width:980px){.pqwser-top,.pqwser-grid,.pqwser-metrics{grid-template-columns:1fr}.pqwser-actions{justify-content:flex-start}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqwser-shell">
  <div class="pqwser-wrap">
    <section class="pqwser-top pqh-workspace-top">
      <div>
        <h1 class="pqwser-title pqh-workspace-title"><?php echo s($workspace->name); ?> Recurring Sessions</h1>
        <p class="pqwser-sub pqh-workspace-sub">Edit series, cancel one class, reschedule one class, or cancel the remaining series.</p>
      </div>
      <nav class="pqwser-actions pqh-workspace-actions">
        <button class="pqwser-btn pqwser-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqwser-btn pqwser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_sessions.php', array_diff_key($urlparams, ['seriesid' => true])))->out(false); ?>">Create sessions</a>
        <a class="pqwser-btn pqwser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', array_diff_key($urlparams, ['seriesid' => true])))->out(false); ?>">Live sessions</a>
        <a class="pqwser-btn pqwser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', array_diff_key($urlparams, ['seriesid' => true])))->out(false); ?>">Workspace dashboard</a>
        <a class="pqwser-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqwser-alert pqwser-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqwser-alert pqwser-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <?php if (!pqwser_ready()): ?>
      <section class="pqwser-panel"><div class="pqwser-empty">Recurring live-session tables are not ready. Run the local_prequran Moodle upgrade first.</div></section>
    <?php else: ?>
      <?php if (!$selectedseries): ?>
        <section class="pqwser-panel">
          <h2>Series Summary</h2>
          <?php if (!$seriesrows): ?><div class="pqwser-empty">No recurring series have been created for this workspace yet.</div><?php else: ?>
            <div class="pqwser-list">
              <?php foreach ($seriesrows as $row): ?>
                <article class="pqwser-card">
                  <span class="pqwser-name"><?php echo s((string)$row->title); ?></span>
                  <span class="pqwser-muted">Teacher: <?php echo s(pqwser_user_name((int)($row->teacherid ?? 0))); ?> / <?php echo s((string)($row->pattern ?? 'weekly')); ?></span>
                  <span class="pqwser-pill"><?php echo (int)$row->session_total; ?> classes</span>
                  <span class="pqwser-pill"><?php echo (int)$row->upcoming_total; ?> upcoming</span>
                  <span class="pqwser-pill"><?php echo (int)$row->cancelled_total; ?> cancelled</span>
                  <span class="pqwser-pill"><?php echo s((string)($row->status ?? 'active')); ?></span>
                  <a class="pqwser-btn pqwser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_series.php', array_merge(array_diff_key($urlparams, ['seriesid' => true]), ['seriesid' => (int)$row->id])))->out(false); ?>">Open series</a>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </section>
      <?php else: ?>
        <section class="pqwser-metrics">
          <div class="pqwser-metric"><strong><?php echo count($sessions); ?></strong><span>classes</span></div>
          <div class="pqwser-metric"><strong><?php echo count(array_filter($sessions, fn($s) => (int)$s->scheduled_start >= time() && (string)$s->status !== 'cancelled')); ?></strong><span>upcoming</span></div>
          <div class="pqwser-metric"><strong><?php echo count(array_filter($sessions, fn($s) => (string)$s->status === 'cancelled')); ?></strong><span>cancelled</span></div>
          <div class="pqwser-metric"><strong><?php echo $seriesstudents; ?></strong><span>students</span></div>
        </section>
        <section class="pqwser-grid">
          <form class="pqwser-panel" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="update_series">
            <input type="hidden" name="seriesid" value="<?php echo (int)$selectedseries->id; ?>">
            <h2>Edit Entire Series</h2>
            <div class="pqwser-field"><label>Title</label><input class="pqwser-input" name="title" required value="<?php echo s((string)$selectedseries->title); ?>"></div>
            <div class="pqwser-field"><label>Lesson ID</label><input class="pqwser-input" name="lessonid" value="<?php echo s((string)($selectedseries->lessonid ?? '')); ?>"></div>
            <div class="pqwser-field"><label>Unit ID</label><input class="pqwser-input" name="unitid" value="<?php echo s((string)($selectedseries->unitid ?? '')); ?>"></div>
            <div class="pqwser-field"><label>Duration minutes</label><input class="pqwser-input" name="duration_minutes" type="number" min="15" max="240" value="<?php echo (int)($selectedseries->duration_minutes ?? 60); ?>"></div>
            <button class="pqwser-btn" type="submit">Update future classes</button>
          </form>
          <form class="pqwser-panel" method="post">
            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
            <input type="hidden" name="action" value="cancel_series">
            <input type="hidden" name="seriesid" value="<?php echo (int)$selectedseries->id; ?>">
            <h2>Cancel Full Series</h2>
            <p class="pqwser-muted">This cancels future uncompleted classes in the series. Past records remain for reporting.</p>
            <div class="pqwser-field"><label>Reason</label><textarea class="pqwser-textarea" name="cancellation_reason" placeholder="optional"></textarea></div>
            <button class="pqwser-btn pqwser-btn--danger" type="submit">Cancel remaining series</button>
          </form>
        </section>
        <section class="pqwser-panel" style="margin-top:14px">
          <h2>Classes In This Series</h2>
          <?php if (!$sessions): ?><div class="pqwser-empty">No classes are attached to this recurring series.</div><?php else: ?>
            <table class="pqwser-table">
              <thead><tr><th>Class</th><th>When</th><th>Status</th><th>Reschedule One</th><th>Cancel One</th></tr></thead>
              <tbody>
                <?php foreach ($sessions as $session): ?>
                  <tr>
                    <td><span class="pqwser-name"><?php echo s((string)$session->title); ?></span><span class="pqwser-muted">#<?php echo (int)$session->id; ?> / class <?php echo (int)($session->series_sequence ?? 0); ?></span></td>
                    <td><?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?></td>
                    <td><span class="pqwser-pill"><?php echo s((string)$session->status); ?></span></td>
                    <td>
                      <?php if ((string)$session->status !== 'completed' && (string)$session->status !== 'cancelled'): ?>
                        <form class="pqwser-inline" method="post">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="reschedule_session">
                          <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                          <input class="pqwser-input" name="scheduled_start" type="datetime-local" required>
                          <button class="pqwser-btn pqwser-btn--light" type="submit">Reschedule</button>
                        </form>
                      <?php else: ?><span class="pqwser-muted">Not available</span><?php endif; ?>
                    </td>
                    <td>
                      <?php if ((string)$session->status !== 'completed' && (string)$session->status !== 'cancelled'): ?>
                        <form class="pqwser-inline" method="post">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="cancel_session">
                          <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                          <input class="pqwser-input" name="cancellation_reason" placeholder="reason optional">
                          <button class="pqwser-btn pqwser-btn--danger" type="submit">Cancel class</button>
                        </form>
                      <?php else: ?><span class="pqwser-muted">Not available</span><?php endif; ?>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          <?php endif; ?>
        </section>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
