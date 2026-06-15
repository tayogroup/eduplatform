<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$childid = optional_param('childid', 0, PARAM_INT);
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);

function pqlcal_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlcal_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlcal_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlcal_is_managed_student(int $userid): bool {
    try {
        $profile = profile_user_record($userid, false);
    } catch (Throwable $e) {
        return false;
    }
    foreach (['managed_student', 'managedstudent', 'managed'] as $field) {
        if (isset($profile->{$field})) {
            $value = strtolower(trim((string)$profile->{$field}));
            return in_array($value, ['1', 'yes', 'true', 'on'], true);
        }
    }
    return false;
}

function pqlcal_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || is_siteadmin($parentid)) {
        return $studentid > 0;
    }
    if (pqlcal_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlcal_table_exists('local_prequran_comm_participant') && pqlcal_table_exists('local_prequran_comm_thread')) {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
    }
    return false;
}

function pqlcal_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlcal_table_exists('local_prequran_teacher_student')
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

function pqlcal_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlcal_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlcal_has_teacher_role($teacherid) || !pqlcal_is_managed_student($studentid)) {
        return false;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {cohort_members} teacher_cm
           JOIN {cohort_members} student_cm ON student_cm.cohortid = teacher_cm.cohortid
          WHERE teacher_cm.userid = ?
            AND student_cm.userid = ?",
        [$teacherid, $studentid]
    );
}

function pqlcal_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return $studentid > 0;
    }
    return pqlcal_parent_can_access_child($userid, $studentid) || pqlcal_teacher_can_access_student($userid, $studentid);
}

function pqlcal_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlcal_table_exists('local_prequran_comm_consent')) {
        foreach ($DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC') as $row) {
            $children[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    if (pqlcal_table_exists('local_prequran_comm_participant') && pqlcal_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT t.studentid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid IS NOT NULL",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $children[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    return pqlcal_enrich_children(array_values(array_filter($children)));
}

function pqlcal_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlcal_table_exists('local_prequran_teacher_student')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']) as $row) {
            $students[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    return pqlcal_enrich_children(array_values(array_filter($students)));
}

function pqlcal_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = ['studentid' => $studentid, 'name' => $user ? fullname($user) : 'Student ' . $studentid];
    }
    usort($children, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlcal_sessions(int $studentid, int $fromtime, int $totime, int $limit = 120): array {
    global $DB;
    if (!pqlcal_table_exists('local_prequran_live_session') || !pqlcal_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $seriesgroup = '';
    if (pqlcal_column_exists('local_prequran_live_session', 'seriesid')) {
        $seriesgroup .= ', s.seriesid';
    }
    if (pqlcal_column_exists('local_prequran_live_session', 'series_sequence')) {
        $seriesgroup .= ', s.series_sequence';
    }
    return array_values($DB->get_records_sql(
        "SELECT s.*,
                p.studentid,
                a.attendance_status,
                n.visible_to_parent AS summary_visible,
                COUNT(DISTINCT r.id) AS visible_recordings
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
      LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid
      LEFT JOIN {local_prequran_live_recording} r ON r.sessionid = s.id AND r.visible_to_parent = 1 AND r.status = 'available'
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND s.scheduled_start >= :fromtime
            AND s.scheduled_start < :totime
            AND s.status <> :cancelled
       GROUP BY s.id, s.cohortid, s.teacherid, s.lessonid, s.unitid, s.title, s.description, s.scheduled_start,
                s.scheduled_end, s.timezone, s.status, s.recording_enabled, s.recording_consent_required,
                s.parent_observer_allowed, s.max_participants, s.bbb_meeting_id, s.bbb_internal_meeting_id,
                s.bbb_created, s.bbb_create_time, s.bbb_last_error, s.createdby, s.cancelledby,
                s.cancellation_reason, s.timecreated, s.timemodified, p.studentid, a.attendance_status,
                n.visible_to_parent {$seriesgroup}
       ORDER BY s.scheduled_start ASC, s.id ASC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active', 'fromtime' => $fromtime, 'totime' => $totime, 'cancelled' => 'cancelled'],
        0,
        $limit
    ));
}

function pqlcal_join_state($session): array {
    $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
    $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
    $now = time();
    $open = $now >= ((int)$session->scheduled_start - $before) && $now <= ((int)$session->scheduled_start + $after);
    if ($open && !empty($session->bbb_created)) {
        return ['open', 'Join now'];
    }
    if ($open) {
        return ['waiting', 'Teacher has not started yet'];
    }
    if ($now < ((int)$session->scheduled_start - $before)) {
        return ['early', 'Opens ' . userdate((int)$session->scheduled_start - $before, get_string('strftimetime'))];
    }
    return ['closed', 'Closed'];
}

function pqlcal_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlcal_table_exists('local_prequran_live_audit')) {
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

function pqlcal_ics_escape(string $value): string {
    $value = str_replace("\\", "\\\\", $value);
    $value = str_replace(["\r\n", "\r", "\n"], "\\n", $value);
    return str_replace([',', ';'], ['\,', '\;'], $value);
}

$modechildren = [];
if ($childid <= 0) {
    if (pqlcal_is_managed_student((int)$USER->id)) {
        $childid = (int)$USER->id;
    } else if (pqlcal_has_teacher_role((int)$USER->id)) {
        $modechildren = pqlcal_teacher_students((int)$USER->id);
    } else {
        $modechildren = pqlcal_parent_children((int)$USER->id);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqlcal_user_can_access_child((int)$USER->id, $childid)) {
    throw new moodle_exception('nopermissions', '', '', 'You cannot view this live class calendar.');
}

if ($action === 'ics') {
    require_sesskey();
    if ($childid <= 0 || $sessionid <= 0) {
        throw new moodle_exception('invalidrequest');
    }
    $sessions = pqlcal_sessions($childid, time() - (365 * DAYSECS), time() + (365 * DAYSECS), 500);
    $session = null;
    foreach ($sessions as $row) {
        if ((int)$row->id === $sessionid) {
            $session = $row;
            break;
        }
    }
    if (!$session) {
        throw new moodle_exception('nopermissions', '', '', 'You cannot download this calendar event.');
    }
    $teacher = core_user::get_user((int)$session->teacherid);
    $joinurl = new moodle_url('/local/hubredirect/live_sessions.php', ['action' => 'join', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()]);
    $summary = (string)$session->title . ' with ' . ($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid);
    $description = 'Quraan Academy live review class. Join from Moodle: ' . $joinurl->out(false);
    $ics = "BEGIN:VCALENDAR\r\n";
    $ics .= "VERSION:2.0\r\n";
    $ics .= "PRODID:-//Quraan Academy//Live Classes//EN\r\n";
    $ics .= "BEGIN:VEVENT\r\n";
    $ics .= "UID:quraan-academy-live-" . (int)$session->id . "@quraan.academy\r\n";
    $ics .= "DTSTAMP:" . gmdate('Ymd\THis\Z') . "\r\n";
    $ics .= "DTSTART:" . gmdate('Ymd\THis\Z', (int)$session->scheduled_start) . "\r\n";
    $ics .= "DTEND:" . gmdate('Ymd\THis\Z', (int)$session->scheduled_end) . "\r\n";
    $ics .= "SUMMARY:" . pqlcal_ics_escape($summary) . "\r\n";
    $ics .= "DESCRIPTION:" . pqlcal_ics_escape($description) . "\r\n";
    $ics .= "URL:" . $joinurl->out(false) . "\r\n";
    $ics .= "END:VEVENT\r\n";
    $ics .= "END:VCALENDAR\r\n";
    pqlcal_audit((int)$session->id, 'calendar_downloaded', 'student', $childid);
    @header('Content-Type: text/calendar; charset=utf-8');
    @header('Content-Disposition: attachment; filename="quraan-academy-live-' . (int)$session->id . '.ics"');
    echo $ics;
    exit;
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_calendar.php', $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Class Calendar');
$PAGE->set_heading('Live Class Calendar');
$PAGE->add_body_class('pqh-live-calendar-page');

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$now = time();
$monthstart = usergetmidnight(strtotime(date('Y-m-01', $now)));
$monthend = strtotime('+1 month', $monthstart);
$calendarstart = strtotime('last sunday', $monthstart);
if ((int)date('w', $monthstart) === 0) {
    $calendarstart = $monthstart;
}
$calendarend = strtotime('next saturday', $monthend - DAYSECS) + DAYSECS;
$sessions = $childid > 0 ? pqlcal_sessions($childid, $calendarstart, $calendarend, 200) : [];
$eventsbyday = [];
foreach ($sessions as $session) {
    $key = date('Y-m-d', (int)$session->scheduled_start);
    $eventsbyday[$key][] = $session;
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-calendar-page header,
body.pqh-live-calendar-page footer,
body.pqh-live-calendar-page nav.navbar,
body.pqh-live-calendar-page #page-header,
body.pqh-live-calendar-page #page-footer,
body.pqh-live-calendar-page .drawer,
body.pqh-live-calendar-page .drawer-toggles,
body.pqh-live-calendar-page .block-region,
body.pqh-live-calendar-page [data-region="drawer"],
body.pqh-live-calendar-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-calendar-page #page,
body.pqh-live-calendar-page #page-content,
body.pqh-live-calendar-page #region-main,
body.pqh-live-calendar-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlcal-shell{min-height:100vh;padding:34px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlcal-wrap{max-width:1120px;margin:0 auto}
.pqlcal-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:22px;border-radius:12px;background:#fff;border:1px solid rgba(23,48,68,.12);box-shadow:0 14px 32px rgba(23,48,68,.06)}
.pqlcal-title{margin:0;font-size:30px;line-height:1.1;font-weight:950}
.pqlcal-sub{margin:8px 0 0;color:#5e7280;font-size:15px;font-weight:750}
.pqlcal-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlcal-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}
.pqlcal-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlcal-students{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pqlcal-student,.pqlcal-empty{padding:16px;border-radius:10px;background:#fff;border:1px solid rgba(23,48,68,.12);box-shadow:0 10px 24px rgba(23,48,68,.05);color:#173044!important;text-decoration:none;font-weight:950}
.pqlcal-student span{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-weight:800}
.pqlcal-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.pqlcal-dayname{font-size:12px;font-weight:950;color:#5e7280;text-align:center;text-transform:uppercase}
.pqlcal-day{min-height:130px;padding:10px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff;box-shadow:0 8px 18px rgba(23,48,68,.04)}
.pqlcal-day--muted{background:#f8fafc;color:#8796a1}
.pqlcal-date{font-size:13px;font-weight:950;margin-bottom:8px}
.pqlcal-event{display:block;margin:7px 0;padding:8px;border-radius:8px;background:#edf9ef;border:1px solid rgba(47,111,78,.15);text-decoration:none;color:#173044!important}
.pqlcal-event strong{display:block;font-size:12px;font-weight:950}
.pqlcal-event span{display:block;margin-top:3px;font-size:11px;font-weight:800;color:#5e7280}
.pqlcal-list{margin-top:18px;display:grid;gap:12px}
.pqlcal-card{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqlcal-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}
.pqlcal-card h2{margin:0;font-size:18px;font-weight:950}
.pqlcal-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlcal-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlcal-pill--ok{background:#edf9ef;color:#245c35}
.pqlcal-pill--warn{background:#fff4dc;color:#7b5a3a}
@media(max-width:820px){.pqlcal-top,.pqlcal-head{display:block}.pqlcal-actions{margin-top:12px}.pqlcal-calendar{display:grid;grid-template-columns:1fr}.pqlcal-dayname{display:none}.pqlcal-day{min-height:auto}.pqlcal-title{font-size:25px}}
</style>
<main class="pqlcal-shell">
  <div class="pqlcal-wrap">
    <section class="pqlcal-top">
      <div>
        <h1 class="pqlcal-title">Live Class Calendar</h1>
        <p class="pqlcal-sub"><?php echo s($childname); ?> - <?php echo userdate($monthstart, '%B %Y'); ?> classes and calendar downloads.</p>
      </div>
      <div class="pqlcal-actions">
        <a class="pqlcal-btn pqlcal-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_schedule.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Schedule</a>
        <a class="pqlcal-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($childid <= 0): ?>
      <?php if ($modechildren): ?>
        <section class="pqlcal-students" aria-label="Choose student">
          <?php foreach ($modechildren as $childrow): ?>
            <a class="pqlcal-student" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => (int)$childrow['studentid']]))->out(false); ?>"><?php echo s((string)$childrow['name']); ?><span>Open live class calendar</span></a>
          <?php endforeach; ?>
        </section>
      <?php else: ?>
        <div class="pqlcal-empty">No linked student was found for this calendar view.</div>
      <?php endif; ?>
    <?php else: ?>
      <section class="pqlcal-calendar" aria-label="Monthly live class calendar">
        <?php foreach (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as $dayname): ?><div class="pqlcal-dayname"><?php echo s($dayname); ?></div><?php endforeach; ?>
        <?php for ($day = $calendarstart; $day < $calendarend; $day += DAYSECS): ?>
          <?php $key = date('Y-m-d', $day); $dayevents = $eventsbyday[$key] ?? []; ?>
          <div class="pqlcal-day <?php echo date('n', $day) === date('n', $monthstart) ? '' : 'pqlcal-day--muted'; ?>">
            <div class="pqlcal-date"><?php echo userdate($day, '%e'); ?></div>
            <?php foreach ($dayevents as $event): ?>
              <a class="pqlcal-event" href="#session-<?php echo (int)$event->id; ?>">
                <strong><?php echo s((string)$event->title); ?></strong>
                <span><?php echo userdate((int)$event->scheduled_start, get_string('strftimetime')); ?></span>
              </a>
            <?php endforeach; ?>
          </div>
        <?php endfor; ?>
      </section>

      <section class="pqlcal-list" aria-label="Live class list">
        <?php if (!$sessions): ?>
          <div class="pqlcal-empty">No live classes found for this month.</div>
        <?php endif; ?>
        <?php foreach ($sessions as $session): ?>
          <?php
            [$joinstate, $joinlabel] = pqlcal_join_state($session);
            $teacher = core_user::get_user((int)$session->teacherid);
            $joinurl = new moodle_url('/local/hubredirect/live_sessions.php', ['action' => 'join', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()]);
            $icsurl = new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => $childid, 'action' => 'ics', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()]);
          ?>
          <article class="pqlcal-card" id="session-<?php echo (int)$session->id; ?>">
            <div class="pqlcal-head">
              <div>
                <h2><?php echo s((string)$session->title); ?></h2>
                <p class="pqlcal-meta"><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
                <?php if (!empty($session->seriesid)): ?><p class="pqlcal-meta">Recurring class #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Session ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
              </div>
              <span class="pqlcal-pill <?php echo $joinstate === 'open' ? 'pqlcal-pill--ok' : ($joinstate === 'waiting' ? 'pqlcal-pill--warn' : ''); ?>"><?php echo s($joinlabel); ?></span>
            </div>
            <div class="pqlcal-actions">
              <?php if ($joinstate === 'open'): ?><a class="pqlcal-btn" href="<?php echo $joinurl->out(false); ?>">Join class</a><?php endif; ?>
              <a class="pqlcal-btn pqlcal-btn--light" href="<?php echo $icsurl->out(false); ?>">Add to calendar</a>
              <a class="pqlcal-btn pqlcal-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_trust.php', ['childid' => $childid]))->out(false); ?>">Trust center</a>
              <?php if (!empty($session->summary_visible)): ?><a class="pqlcal-btn pqlcal-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_summaries.php', ['childid' => $childid]))->out(false); ?>">Summary</a><?php endif; ?>
              <?php if ((int)$session->visible_recordings > 0): ?><a class="pqlcal-btn pqlcal-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings.php', ['childid' => $childid]))->out(false); ?>">Recording</a><?php endif; ?>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
