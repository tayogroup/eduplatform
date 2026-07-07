<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace owners and admins can create workspace live sessions.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Workspace sessions access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening workspace live sessions.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Workspace sessions unavailable'
    );
}
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_sessions.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Workspace Live Sessions');
$PAGE->set_heading('Workspace Live Sessions');
$PAGE->add_body_class('pqw-sessions-page');

function pqwls_table_fields(string $table, array $wanted): string {
    $fields = [];
    foreach ($wanted as $field) {
        if (pqh_table_has_field_safe($table, $field)) {
            $fields[] = $field;
        }
    }
    return $fields ? implode(',', $fields) : '*';
}

function pqwls_workspace_members(int $workspaceid, array $roles): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return array_values($DB->get_records_sql(
        "SELECT wm.id, wm.userid, wm.workspace_role, u.firstname, u.lastname, u.email, u.username
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
            AND wm.workspace_role {$insql}
       ORDER BY u.lastname ASC, u.firstname ASC",
        $params
    ));
}

function pqwls_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwls_parse_datetime(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $timestamp = strtotime($value);
    return $timestamp ? (int)$timestamp : 0;
}

function pqwls_series_ready(): bool {
    return pqh_table_exists_safe('local_prequran_live_series')
        && pqh_table_has_field_safe('local_prequran_live_session', 'seriesid')
        && pqh_table_has_field_safe('local_prequran_live_session', 'series_sequence');
}

function pqwls_generate_weekly_starts(int $firststart, int $count): array {
    $count = max(1, min(52, $count));
    $starts = [];
    for ($i = 0; $i < $count; $i++) {
        $starts[] = $firststart + ($i * WEEKSECS);
    }
    return $starts;
}

function pqwls_insert_series(int $workspaceid, array $data, int $sessioncount): int {
    global $DB, $USER;
    if (!pqwls_series_ready()) {
        return 0;
    }
    $now = time();
    $columns = $DB->get_columns('local_prequran_live_series');
    $record = (object)[
        'workspaceid' => $workspaceid,
        'cohortid' => 0,
        'teacherid' => (int)$data['teacherid'],
        'title' => (string)$data['title'],
        'lessonid' => (string)$data['lessonid'],
        'unitid' => (string)$data['unitid'],
        'pattern' => 'weekly',
        'weekdays' => (string)date('N', (int)$data['start']),
        'start_time' => date('H:i', (int)$data['start']),
        'duration_minutes' => (int)$data['duration'],
        'date_start' => (int)$data['start'],
        'date_end' => (int)$data['start'] + (($sessioncount - 1) * WEEKSECS),
        'session_count' => $sessioncount,
        'status' => 'active',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    foreach (array_keys((array)$record) as $field) {
        if (!array_key_exists($field, $columns)) {
            unset($record->{$field});
        }
    }
    return (int)$DB->insert_record('local_prequran_live_series', $record);
}

function pqwls_insert_live_session(int $workspaceid, array $data, int $seriesid = 0, int $sequence = 0): int {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        return 0;
    }
    $now = time();
    $record = (object)[
        'workspaceid' => $workspaceid,
        'seriesid' => $seriesid,
        'series_sequence' => $sequence,
        'cohortid' => 0,
        'teacherid' => (int)$data['teacherid'],
        'session_type' => 'teacher_led',
        'teacher_required' => 1,
        'report_to_teacherid' => (int)$data['teacherid'],
        'lessonid' => (string)$data['lessonid'],
        'unitid' => (string)$data['unitid'],
        'title' => (string)$data['title'],
        'description' => (string)$data['description'],
        'scheduled_start' => (int)$data['start'],
        'scheduled_end' => (int)$data['end'],
        'timezone' => core_date::get_user_timezone(),
        'status' => 'scheduled',
        'qa_status' => 'not_reviewed',
        'qa_score' => 0,
        'qa_checklist' => '',
        'qa_notes' => '',
        'qa_coaching_notes' => '',
        'qa_reviewedby' => 0,
        'qa_reviewedat' => 0,
        'qa_coaching_status' => 'none',
        'qa_coaching_priority' => 'normal',
        'qa_coaching_due_date' => 0,
        'qa_coaching_ackby' => 0,
        'qa_coaching_ackat' => 0,
        'qa_coaching_completedby' => 0,
        'qa_coaching_completedat' => 0,
        'leadership_review_status' => 'none',
        'leadership_review_reason' => '',
        'leadership_review_notes' => '',
        'leadership_reviewby' => 0,
        'leadership_reviewat' => 0,
        'leadership_clearedby' => 0,
        'leadership_clearedat' => 0,
        'improvement_plan_status' => 'none',
        'improvement_plan_goals' => '',
        'improvement_plan_actions' => '',
        'improvement_plan_due_date' => 0,
        'improvement_plan_priority' => 'normal',
        'improvement_plan_mentorid' => 0,
        'improvement_plan_assignedby' => 0,
        'improvement_plan_assignedat' => 0,
        'improvement_plan_ackby' => 0,
        'improvement_plan_ackat' => 0,
        'improvement_plan_completedby' => 0,
        'improvement_plan_completedat' => 0,
        'improvement_plan_completion_notes' => '',
        'recording_enabled' => 1,
        'recording_consent_required' => 1,
        'parent_observer_allowed' => 0,
        'max_participants' => 12,
        'bbb_meeting_id' => '',
        'bbb_internal_meeting_id' => '',
        'bbb_created' => 0,
        'bbb_create_time' => 0,
        'bbb_last_error' => '',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $columns = $DB->get_columns('local_prequran_live_session');
    foreach (array_keys((array)$record) as $field) {
        if (!array_key_exists($field, $columns)) {
            unset($record->{$field});
        }
    }
    $sessionid = (int)$DB->insert_record('local_prequran_live_session', $record);
    if (array_key_exists('bbb_meeting_id', $columns)) {
        $DB->set_field('local_prequran_live_session', 'bbb_meeting_id', 'prequran-live-' . $sessionid, ['id' => $sessionid]);
    }
    try {
        pqh_attach_default_agenda_to_live_session($sessionid, (int)$USER->id);
    } catch (Throwable $e) {
        debugging('Could not auto-attach live-session agenda slides for session ' . $sessionid . ': ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
    return $sessionid;
}

function pqwls_insert_participants(int $workspaceid, int $sessionid, array $studentids): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_participant')) {
        return;
    }
    $columns = $DB->get_columns('local_prequran_live_participant');
    $now = time();
    foreach ($studentids as $studentid) {
        $studentid = (int)$studentid;
        if ($studentid <= 0) {
            continue;
        }
        $record = (object)[
            'workspaceid' => $workspaceid,
            'sessionid' => $sessionid,
            'userid' => $studentid,
            'role' => 'student',
            'studentid' => $studentid,
            'status' => 'active',
            'displayname' => pqwls_user_name($studentid),
            'invitedby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        foreach (array_keys((array)$record) as $field) {
            if (!array_key_exists($field, $columns)) {
                unset($record->{$field});
            }
        }
        if (!$DB->record_exists('local_prequran_live_participant', ['sessionid' => $sessionid, 'userid' => $studentid, 'role' => 'student'])) {
            $DB->insert_record('local_prequran_live_participant', $record);
        }
    }
}

function pqwls_sessions(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        return [];
    }
    $params = ['workspaceid' => $workspaceid];
    $where = pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid') ? 'workspaceid = :workspaceid' : '1 = 0';
    return array_values($DB->get_records_select(
        'local_prequran_live_session',
        $where,
        $params,
        'scheduled_start DESC',
        pqwls_table_fields('local_prequran_live_session', ['id', 'seriesid', 'series_sequence', 'title', 'teacherid', 'lessonid', 'unitid', 'scheduled_start', 'scheduled_end', 'timezone', 'status', 'session_type']),
        0,
        30
    ));
}

$teachers = pqwls_workspace_members($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$students = pqwls_workspace_members($workspaceid, ['student']);
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the workspace live sessions page and try again.',
            new moodle_url('/local/hubredirect/workspace_sessions.php', $urlparams),
            'Workspace live session form expired'
        );
    }
    try {
        $teacherid = optional_param('teacherid', 0, PARAM_INT);
        $title = trim(optional_param('title', '', PARAM_TEXT));
        $start = pqwls_parse_datetime(optional_param('scheduled_start', '', PARAM_TEXT));
        $duration = max(15, min(240, optional_param('duration_minutes', 60, PARAM_INT)));
        $selectedstudents = optional_param_array('studentids', [], PARAM_INT);
        $recurring = optional_param('recurring_enabled', 0, PARAM_BOOL);
        $recurrencecount = max(1, min(52, optional_param('recurrence_count', 4, PARAM_INT)));
        if ($title === '') {
            throw new invalid_parameter_exception('Session title is required.');
        }
        if ($start <= 0) {
            throw new invalid_parameter_exception('Choose a valid start date and time.');
        }
        if (!pqh_user_can_teach_in_workspace($teacherid, $workspaceid)) {
            throw new invalid_parameter_exception('Selected teacher is not a teaching member of this workspace.');
        }
        if ($recurring && !pqwls_series_ready()) {
            throw new invalid_parameter_exception('Recurring sessions require the live series database table. Run the local_prequran Moodle upgrade.');
        }
        $payload = [
            'teacherid' => $teacherid,
            'title' => $title,
            'description' => trim(optional_param('description', '', PARAM_TEXT)),
            'lessonid' => trim(optional_param('lessonid', '', PARAM_ALPHANUMEXT)),
            'unitid' => trim(optional_param('unitid', '', PARAM_ALPHANUMEXT)),
            'start' => $start,
            'duration' => $duration,
            'end' => $start + ($duration * 60),
        ];
        $starts = $recurring ? pqwls_generate_weekly_starts($start, $recurrencecount) : [$start];
        $seriesid = $recurring ? pqwls_insert_series($workspaceid, $payload, count($starts)) : 0;
        $created = 0;
        foreach ($starts as $index => $sessionstart) {
            $payload['start'] = (int)$sessionstart;
            $payload['end'] = (int)$sessionstart + ($duration * 60);
            $sessionid = pqwls_insert_live_session($workspaceid, $payload, $seriesid, $recurring ? $index + 1 : 0);
            if ($sessionid <= 0) {
                throw new invalid_parameter_exception('Live session table is not ready. Run the local_prequran Moodle upgrade.');
            }
            pqwls_insert_participants($workspaceid, $sessionid, $selectedstudents);
            $created++;
        }
        $message = $created > 1 ? $created . ' recurring workspace live sessions created.' : 'Workspace live session created.';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$sessions = pqwls_sessions($workspaceid);
$sessioncounts = [
    'scheduled' => 0,
    'started' => 0,
    'completed' => 0,
    'cancelled' => 0,
];
foreach ($sessions as $session) {
    $status = (string)($session->status ?? '');
    if (!array_key_exists($status, $sessioncounts)) {
        $sessioncounts[$status] = 0;
    }
    $sessioncounts[$status]++;
}

echo $OUTPUT->header();
?>
<style>
body.pqw-sessions-page header,body.pqw-sessions-page footer,body.pqw-sessions-page nav.navbar,body.pqw-sessions-page #page-header,body.pqw-sessions-page #page-footer,body.pqw-sessions-page .drawer,body.pqw-sessions-page .drawer-toggles,body.pqw-sessions-page .block-region,body.pqw-sessions-page [data-region="drawer"],body.pqw-sessions-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-sessions-page #page,body.pqw-sessions-page #page-content,body.pqw-sessions-page #region-main,body.pqw-sessions-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwls-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwls-wrap{max-width:1280px;margin:0 auto}.pqwls-top,.pqwls-panel,.pqwls-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwls-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqwls-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqwls-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwls-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqwls-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwls-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwls-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:14px}.pqwls-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwls-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqwls-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900;text-transform:uppercase}.pqwls-field{display:grid;gap:5px;margin-bottom:10px}.pqwls-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqwls-input,.pqwls-select,.pqwls-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqwls-textarea{min-height:78px;padding:10px}.pqwls-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pqwls-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pqwls-check{display:flex;gap:8px;align-items:center;padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff;font-size:13px;font-weight:850}.pqwls-recurring{margin:10px 0;padding:12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqwls-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqwls-alert--ok{background:#edf9ef;color:#245c35}.pqwls-alert--bad{background:#fff0ed;color:#883526}.pqwls-table{width:100%;border-collapse:separate;border-spacing:0}.pqwls-table th,.pqwls-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwls-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwls-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwls-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqwls-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqwls-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}
@media(max-width:980px){.pqwls-top,.pqwls-grid,.pqwls-metrics{grid-template-columns:1fr}.pqwls-actions{justify-content:flex-start}.pqwls-checks{grid-template-columns:1fr}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqwls-shell">
  <div class="pqwls-wrap">
    <section class="pqwls-top pqh-workspace-top">
      <div>
        <h1 class="pqwls-title pqh-workspace-title"><?php echo s($workspace->name); ?> Live Sessions</h1>
        <p class="pqwls-sub pqh-workspace-sub">Create and manage live sessions scoped to this workspace.</p>
      </div>
      <nav class="pqwls-actions pqh-workspace-actions">
        <button class="pqwls-btn pqwls-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqwls-btn pqwls-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
        <a class="pqwls-btn pqwls-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_series.php', $urlparams))->out(false); ?>">Recurring series</a>
        <a class="pqwls-btn pqwls-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $urlparams))->out(false); ?>">Live admin</a>
        <a class="pqwls-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqwls-alert pqwls-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqwls-alert pqwls-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqwls-metrics" aria-label="Session summary">
      <div class="pqwls-metric"><strong><?php echo count($sessions); ?></strong><span>recent sessions</span></div>
      <div class="pqwls-metric"><strong><?php echo (int)($sessioncounts['scheduled'] ?? 0); ?></strong><span>scheduled</span></div>
      <div class="pqwls-metric"><strong><?php echo (int)($sessioncounts['started'] ?? 0); ?></strong><span>started</span></div>
      <div class="pqwls-metric"><strong><?php echo (int)($sessioncounts['completed'] ?? 0); ?></strong><span>completed</span></div>
      <div class="pqwls-metric"><strong><?php echo (int)($sessioncounts['cancelled'] ?? 0); ?></strong><span>cancelled</span></div>
    </section>
    <section class="pqwls-grid">
      <form class="pqwls-panel" method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <h2>Create Session</h2>
        <?php if (!pqh_table_exists_safe('local_prequran_live_session')): ?>
          <div class="pqwls-empty">Live session tables are not ready. Run the local_prequran Moodle upgrade first.</div>
        <?php else: ?>
          <div class="pqwls-field"><label>Title</label><input class="pqwls-input" name="title" required placeholder="Test Institute - Arabic Reading"></div>
          <div class="pqwls-field"><label>Teacher</label><select class="pqwls-select" name="teacherid" required>
            <?php foreach ($teachers as $teacher): ?><option value="<?php echo (int)$teacher->userid; ?>"><?php echo s(fullname($teacher) . ' #' . (int)$teacher->userid); ?></option><?php endforeach; ?>
          </select></div>
          <div class="pqwls-field"><label>Start</label><input class="pqwls-input" name="scheduled_start" type="datetime-local" required></div>
          <div class="pqwls-field"><label>Duration minutes</label><input class="pqwls-input" name="duration_minutes" type="number" min="15" max="240" value="60"></div>
          <div class="pqwls-recurring">
            <label class="pqwls-check"><input type="checkbox" name="recurring_enabled" value="1" <?php echo pqwls_series_ready() ? '' : 'disabled'; ?>> Repeat weekly</label>
            <?php if (!pqwls_series_ready()): ?><span class="pqwls-muted">Run the live-series Moodle upgrade before creating recurring sessions.</span><?php endif; ?>
            <div class="pqwls-row">
              <div class="pqwls-field"><label>Number of classes</label><input class="pqwls-input" name="recurrence_count" type="number" min="1" max="52" value="4" <?php echo pqwls_series_ready() ? '' : 'disabled'; ?>></div>
              <div class="pqwls-field"><label>Pattern</label><input class="pqwls-input" value="Weekly on selected start day" disabled></div>
            </div>
          </div>
          <div class="pqwls-field"><label>Lesson ID</label><input class="pqwls-input" name="lessonid" placeholder="optional"></div>
          <div class="pqwls-field"><label>Unit ID</label><input class="pqwls-input" name="unitid" placeholder="optional"></div>
          <div class="pqwls-field"><label>Description</label><textarea class="pqwls-textarea" name="description"></textarea></div>
          <div class="pqwls-field"><label>Students</label>
            <?php if (!$students): ?><div class="pqwls-empty">No student members are available in this workspace yet.</div><?php else: ?>
              <div class="pqwls-checks">
                <?php foreach ($students as $student): ?>
                  <label class="pqwls-check"><input type="checkbox" name="studentids[]" value="<?php echo (int)$student->userid; ?>"> <?php echo s(fullname($student)); ?></label>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          </div>
          <button class="pqwls-btn" type="submit" <?php echo !$teachers ? 'disabled' : ''; ?>>Create session</button>
        <?php endif; ?>
      </form>
      <article class="pqwls-panel">
        <h2>Workspace Sessions</h2>
        <?php if (!$sessions): ?><div class="pqwls-empty">No sessions are scoped to this workspace yet.</div><?php else: ?>
          <table class="pqwls-table">
            <thead><tr><th>Session</th><th>Teacher</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($sessions as $session): ?>
                <tr>
                  <td><span class="pqwls-name"><?php echo s($session->title); ?></span><span class="pqwls-muted">#<?php echo (int)$session->id; ?> / <?php echo s((string)($session->lessonid ?? '') . ' ' . (string)($session->unitid ?? '')); ?></span><?php if (!empty($session->seriesid)): ?><span class="pqwls-pill">Series #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' / class ' . (int)$session->series_sequence : ''; ?></span><a class="pqwls-btn pqwls-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_series.php', array_merge($urlparams, ['seriesid' => (int)$session->seriesid])))->out(false); ?>">Manage series</a><?php endif; ?></td>
                  <td><?php echo s(pqwls_user_name((int)$session->teacherid)); ?></td>
                  <td><?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?></td>
                  <td><span class="pqwls-pill"><?php echo s((string)$session->status); ?></span></td>
                  <td>
                    <a class="pqwls-btn pqwls-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', array_merge($urlparams, ['action' => 'join', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()])))->out(false); ?>">Start/join</a>
                    <a class="pqwls-btn pqwls-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', array_merge($urlparams, ['sessionid' => (int)$session->id])))->out(false); ?>">Review</a>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
