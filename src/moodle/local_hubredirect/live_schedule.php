<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$childid = optional_param('childid', 0, PARAM_INT);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_schedule.php', $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Class Schedule');
$PAGE->set_heading('Live Class Schedule');
$PAGE->add_body_class('pqh-live-schedule-page');

function pqlsch_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlsch_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlsch_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlsch_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlsch_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlsch_table_exists('local_prequran_comm_participant') && pqlsch_table_exists('local_prequran_comm_thread')) {
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

function pqlsch_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlsch_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    if (pqlsch_table_exists('local_prequran_comm_participant') && pqlsch_table_exists('local_prequran_comm_thread')) {
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
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    return pqlsch_enrich_children(array_values($children));
}

function pqlsch_is_managed_student(int $userid): bool {
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

function pqlsch_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlsch_table_exists('local_prequran_teacher_student')
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

function pqlsch_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlsch_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlsch_has_teacher_role($teacherid) || !pqlsch_is_managed_student($studentid)) {
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

function pqlsch_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlsch_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $students[$studentid] = $studentid;
            }
        }
    }
    return pqlsch_enrich_children(array_values($students));
}

function pqlsch_enrich_children(array $studentids): array {
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

function pqlsch_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlsch_parent_can_access_child($userid, $studentid) || pqlsch_teacher_can_access_student($userid, $studentid);
}

function pqlsch_sessions(int $studentid, int $fromtime, int $totime, int $limit = 20): array {
    global $DB;
    if (!pqlsch_table_exists('local_prequran_live_session') || !pqlsch_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $seriesgroup = '';
    if (pqlsch_column_exists('local_prequran_live_session', 'seriesid')) {
        $seriesgroup .= ', s.seriesid';
    }
    if (pqlsch_column_exists('local_prequran_live_session', 'series_sequence')) {
        $seriesgroup .= ', s.series_sequence';
    }
    $homeworkselect = pqlsch_column_exists('local_prequran_live_note', 'homework_unitid')
        ? "n.homework, n.homework_lessonid, n.homework_unitid, n.homework_due_date, n.homework_priority,"
        : "n.homework, '' AS homework_lessonid, '' AS homework_unitid, 0 AS homework_due_date, 'normal' AS homework_priority,";
    return array_values($DB->get_records_sql(
        "SELECT s.*,
                a.attendance_status,
                a.participation_status,
                n.visible_to_parent AS summary_visible,
                {$homeworkselect}
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
                s.cancellation_reason, s.timecreated, s.timemodified, a.attendance_status, a.participation_status,
                n.visible_to_parent, n.homework {$seriesgroup}
       ORDER BY s.scheduled_start ASC, s.id ASC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active', 'fromtime' => $fromtime, 'totime' => $totime, 'cancelled' => 'cancelled'],
        0,
        $limit
    ));
}

function pqlsch_join_state($session): array {
    $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
    $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
    $now = time();
    $teacherstarted = !empty($session->bbb_created) && (string)$session->status === 'live';
    $open = $now <= ((int)$session->scheduled_end + $after)
        && ($teacherstarted || $now >= ((int)$session->scheduled_start - $before));
    if ($open && !empty($session->bbb_created)) {
        return ['open', 'Join window open'];
    }
    if ($open) {
        return ['waiting', 'Teacher has not started yet'];
    }
    if ($now < ((int)$session->scheduled_start - $before)) {
        return ['early', 'Opens ' . userdate((int)$session->scheduled_start - $before, get_string('strftimetime'))];
    }
    return ['closed', 'Join window closed'];
}

$modechildren = [];
if ($childid <= 0) {
    if (pqlsch_is_managed_student((int)$USER->id)) {
        $childid = (int)$USER->id;
    } else if (pqlsch_has_teacher_role((int)$USER->id)) {
        $modechildren = pqlsch_teacher_students((int)$USER->id);
    } else {
        $modechildren = pqlsch_parent_children((int)$USER->id);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqlsch_user_can_access_child((int)$USER->id, $childid)) {
    throw new moodle_exception('nopermissions', '', '', 'You cannot view this live class schedule.');
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$now = time();
$upcoming = $childid > 0 ? pqlsch_sessions($childid, $now - HOURSECS, $now + (30 * DAYSECS), 30) : [];
$recent = $childid > 0 ? pqlsch_sessions($childid, $now - (30 * DAYSECS), $now, 20) : [];
usort($recent, function($a, $b) {
    return (int)$b->scheduled_start <=> (int)$a->scheduled_start;
});
$nextsession = $upcoming[0] ?? null;

echo $OUTPUT->header();
?>
<style>
body.pqh-live-schedule-page header,
body.pqh-live-schedule-page footer,
body.pqh-live-schedule-page nav.navbar,
body.pqh-live-schedule-page #page-header,
body.pqh-live-schedule-page #page-footer,
body.pqh-live-schedule-page .drawer,
body.pqh-live-schedule-page .drawer-toggles,
body.pqh-live-schedule-page .block-region,
body.pqh-live-schedule-page [data-region="drawer"],
body.pqh-live-schedule-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-schedule-page #page,
body.pqh-live-schedule-page #page-content,
body.pqh-live-schedule-page #region-main,
body.pqh-live-schedule-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlsch-shell{min-height:100vh;padding:34px 18px 54px;background:linear-gradient(180deg,#f1fff4 0,#fff 50%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlsch-wrap{max-width:1040px;margin:0 auto}
.pqlsch-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding:22px;border-radius:16px;background:linear-gradient(135deg,#eaffea 0,#fff 54%,#fff7e7 100%);border:1px solid rgba(111,78,50,.13);box-shadow:0 16px 38px rgba(105,76,45,.08)}
.pqlsch-kicker{margin:0 0 6px;color:#6f4e32;font-size:13px;font-weight:950;text-transform:uppercase;letter-spacing:.04em}
.pqlsch-title{margin:0;font-size:30px;line-height:1.1;font-weight:950;color:#4d3522}
.pqlsch-subtitle{margin:8px 0 0;color:#64745a;font-size:15px;font-weight:750}
.pqlsch-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlsch-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:10px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqlsch-btn--light{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqlsch-next{margin-bottom:16px;padding:20px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqlsch-next h2,.pqlsch-panel h2{margin:0 0 12px;color:#4d3522;font-size:20px;font-weight:950}
.pqlsch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqlsch-panel{padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqlsch-list{display:grid;gap:12px}
.pqlsch-card{padding:16px;border-radius:12px;background:#fff;border:1px solid rgba(23,48,68,.12)}
.pqlsch-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}
.pqlsch-card h3{margin:0;color:#4d3522;font-size:18px;font-weight:950}
.pqlsch-meta{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:800}
.pqlsch-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlsch-pill--ok{background:#eaffea;color:#2f6f4e}
.pqlsch-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlsch-empty{padding:20px;border-radius:14px;background:#fff;border:1px dashed rgba(111,78,50,.22);color:#64745a;font-weight:850}
.pqlsch-students{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pqlsch-student{padding:16px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07);text-decoration:none;color:#4d3522!important;font-weight:950}
.pqlsch-student span{display:block;margin-top:4px;color:#64745a;font-size:12px;font-weight:800}
@media(max-width:760px){.pqlsch-top{display:block}.pqlsch-actions{margin-top:14px}.pqlsch-grid{grid-template-columns:1fr}.pqlsch-card__head{display:block}.pqlsch-title{font-size:25px}}
</style>
<main class="pqlsch-shell">
  <div class="pqlsch-wrap">
    <section class="pqlsch-top">
      <div>
        <p class="pqlsch-kicker">Live class schedule</p>
        <h1 class="pqlsch-title">Schedule for <?php echo s($childname); ?></h1>
        <p class="pqlsch-subtitle">See upcoming review classes, join availability, and recent class outcomes.</p>
      </div>
      <div class="pqlsch-actions">
        <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Parent live hub</a>
        <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_schedule.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Class series</a>
        <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Calendar</a>
        <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqlsch-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', $childid > 0 ? ['childid' => $childid] : []))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($childid <= 0): ?>
      <?php if ($modechildren): ?>
        <section class="pqlsch-students" aria-label="Choose student">
          <?php foreach ($modechildren as $childrow): ?>
            <a class="pqlsch-student" href="<?php echo (new moodle_url('/local/hubredirect/live_schedule.php', ['childid' => (int)$childrow['studentid']]))->out(false); ?>">
              <?php echo s((string)$childrow['name']); ?>
              <span>Open live class schedule</span>
            </a>
          <?php endforeach; ?>
        </section>
      <?php else: ?>
        <div class="pqlsch-empty">No linked student was found for this schedule view.</div>
      <?php endif; ?>
    <?php else: ?>
      <section class="pqlsch-next">
        <h2>Next Class</h2>
        <?php if (!$nextsession): ?>
          <div class="pqlsch-empty">No upcoming live classes are scheduled.</div>
        <?php else: ?>
          <?php
            [$joinstate, $joinlabel] = pqlsch_join_state($nextsession);
            $teacher = core_user::get_user((int)$nextsession->teacherid);
            $joinurl = new moodle_url('/local/hubredirect/live_sessions.php', ['action' => 'join', 'sessionid' => (int)$nextsession->id, 'sesskey' => sesskey()]);
            $lessonurl = new moodle_url('/local/hubredirect/issue_child.php', [
                'goto' => (string)($nextsession->unitid ?: 'alphabet_listen'),
                'managed_student' => (int)$USER->id === (int)$childid ? 1 : 0,
                'monitor_studentid' => $childid,
                'live_sessionid' => (int)$nextsession->id,
            ]);
          ?>
          <article class="pqlsch-card">
            <div class="pqlsch-card__head">
              <div>
                <h3><?php echo s((string)$nextsession->title); ?></h3>
                <p class="pqlsch-meta"><?php echo userdate((int)$nextsession->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$nextsession->teacherid); ?></p>
                <p class="pqlsch-meta">Review target: <?php echo s(trim((string)$nextsession->lessonid . ' / ' . (string)$nextsession->unitid, ' /') ?: 'to be confirmed'); ?></p>
                <?php if (!empty($nextsession->seriesid)): ?><p class="pqlsch-meta">Recurring class #<?php echo (int)$nextsession->seriesid; ?><?php echo !empty($nextsession->series_sequence) ? ' - Session ' . (int)$nextsession->series_sequence : ''; ?></p><?php endif; ?>
              </div>
              <span class="pqlsch-pill <?php echo $joinstate === 'open' ? 'pqlsch-pill--ok' : 'pqlsch-pill--warn'; ?>"><?php echo s($joinlabel); ?></span>
            </div>
            <div class="pqlsch-actions">
              <?php if ($joinstate === 'open'): ?><a class="pqlsch-btn" href="<?php echo $joinurl->out(false); ?>">Join class</a><?php endif; ?>
              <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo $lessonurl->out(false); ?>">Open lesson</a>
              <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_trust.php', ['childid' => $childid]))->out(false); ?>">Trust center</a>
            </div>
          </article>
        <?php endif; ?>
      </section>

      <section class="pqlsch-grid">
        <article class="pqlsch-panel">
          <h2>Upcoming</h2>
          <?php if (!$upcoming): ?>
            <div class="pqlsch-empty">No upcoming classes.</div>
          <?php else: ?>
            <div class="pqlsch-list">
              <?php foreach ($upcoming as $session): ?>
                <?php
                  [$joinstate, $joinlabel] = pqlsch_join_state($session);
                  $teacher = core_user::get_user((int)$session->teacherid);
                  $lessonurl = new moodle_url('/local/hubredirect/issue_child.php', [
                      'goto' => (string)($session->unitid ?: 'alphabet_listen'),
                      'managed_student' => (int)$USER->id === (int)$childid ? 1 : 0,
                      'monitor_studentid' => $childid,
                      'live_sessionid' => (int)$session->id,
                  ]);
                ?>
                <article class="pqlsch-card">
                  <div class="pqlsch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqlsch-meta"><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
                      <p class="pqlsch-meta">Review target: <?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /') ?: 'to be confirmed'); ?></p>
                      <?php if (!empty($session->seriesid)): ?><p class="pqlsch-meta">Recurring class #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Session ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
                    </div>
                    <span class="pqlsch-pill <?php echo $joinstate === 'open' ? 'pqlsch-pill--ok' : ''; ?>"><?php echo s($joinlabel); ?></span>
                  </div>
                  <div class="pqlsch-actions">
                    <a class="pqlsch-btn pqlsch-btn--light" href="<?php echo $lessonurl->out(false); ?>">Open lesson</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqlsch-panel">
          <h2>Recent Classes</h2>
          <?php if (!$recent): ?>
            <div class="pqlsch-empty">No recent live classes yet.</div>
          <?php else: ?>
            <div class="pqlsch-list">
              <?php foreach ($recent as $session): ?>
                <?php $teacher = core_user::get_user((int)$session->teacherid); ?>
                <article class="pqlsch-card">
                  <div class="pqlsch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqlsch-meta"><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$session->teacherid); ?></p>
                      <p class="pqlsch-meta">Review target: <?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /') ?: 'not set'); ?></p>
                      <?php if (!empty($session->homework) || !empty($session->homework_unitid)): ?>
                        <p class="pqlsch-meta">Homework: <?php echo s((string)($session->homework ?: $session->homework_unitid)); ?><?php echo !empty($session->homework_due_date) ? ' - Due ' . userdate((int)$session->homework_due_date, get_string('strftimedate')) : ''; ?></p>
                      <?php endif; ?>
                      <?php if (!empty($session->seriesid)): ?><p class="pqlsch-meta">Recurring class #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Session ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
                    </div>
                    <span class="pqlsch-pill"><?php echo s((string)($session->attendance_status ?: 'attendance pending')); ?></span>
                  </div>
                  <div class="pqlsch-actions">
                    <?php if (!empty($session->homework_unitid)): ?><a class="pqlsch-btn" href="<?php echo (new moodle_url('/local/hubredirect/issue_child.php', ['goto' => (string)$session->homework_unitid, 'managed_student' => 0, 'monitor_studentid' => $childid]))->out(false); ?>">Practice homework</a><?php endif; ?>
                    <?php if (!empty($session->summary_visible)): ?><a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_summaries.php', ['childid' => $childid]))->out(false); ?>">Summary</a><?php endif; ?>
                    <?php if ((int)$session->visible_recordings > 0): ?><a class="pqlsch-btn pqlsch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings.php', ['childid' => $childid]))->out(false); ?>">Recording</a><?php endif; ?>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
