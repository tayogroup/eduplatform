<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$childid = optional_param('childid', 0, PARAM_INT);

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_series_schedule.php', $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Recurring Live Classes');
$PAGE->set_heading('Recurring Live Classes');
$PAGE->add_body_class('pqh-live-series-schedule-page');

function pqlps_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlps_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlps_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlps_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlps_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlps_table_exists('local_prequran_comm_participant') && pqlps_table_exists('local_prequran_comm_thread')) {
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

function pqlps_is_managed_student(int $userid): bool {
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

function pqlps_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlps_table_exists('local_prequran_teacher_student')
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

function pqlps_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlps_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlps_has_teacher_role($teacherid) || !pqlps_is_managed_student($studentid)) {
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

function pqlps_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlps_parent_can_access_child($userid, $studentid) || pqlps_teacher_can_access_student($userid, $studentid);
}

function pqlps_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = ['studentid' => $studentid, 'name' => $user ? fullname($user) : 'Student ' . $studentid];
    }
    usort($children, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlps_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlps_table_exists('local_prequran_comm_consent')) {
        foreach ($DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC') as $row) {
            if ((int)$row->studentid > 0) {
                $children[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    if (pqlps_table_exists('local_prequran_comm_participant') && pqlps_table_exists('local_prequran_comm_thread')) {
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
            if ((int)$row->studentid > 0) {
                $children[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    return pqlps_enrich_children(array_values($children));
}

function pqlps_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlps_table_exists('local_prequran_teacher_student')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']) as $row) {
            if ((int)$row->studentid > 0) {
                $students[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    return pqlps_enrich_children(array_values($students));
}

function pqlps_join_state($session): array {
    $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
    $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
    $now = time();
    if ((string)$session->status === 'cancelled') {
        return ['cancelled', 'Cancelled'];
    }
    $open = $now >= ((int)$session->scheduled_start - $before) && $now <= ((int)$session->scheduled_start + $after);
    if ($open && !empty($session->bbb_created)) {
        return ['open', 'Join class'];
    }
    if ($open) {
        return ['waiting', 'Teacher has not started yet'];
    }
    if ($now < ((int)$session->scheduled_start - $before)) {
        return ['early', 'Opens ' . userdate((int)$session->scheduled_start - $before, get_string('strftimetime'))];
    }
    return ['closed', 'Join window closed'];
}

function pqlps_parent_safe_change_label(string $action): string {
    $labels = [
        'series_updated' => 'Schedule updated',
        'series_session_updated' => 'Class details updated',
        'series_single_session_cancelled' => 'One class cancelled',
        'series_cancelled' => 'Future classes cancelled',
        'session_cancelled' => 'Class cancelled',
        'series_change_notifications_processed' => 'Family notification processed',
        'series_cancel_notifications_processed' => 'Cancellation notification processed',
        'series_single_cancel_notice' => 'Class cancellation notification processed',
    ];
    return $labels[$action] ?? 'Schedule changed';
}

function pqlps_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlps_table_exists('local_prequran_live_audit')) {
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

function pqlps_ack_ready(): bool {
    return pqlps_table_exists('local_prequran_live_ack');
}

function pqlps_ack_record(int $seriesid, int $studentid, int $parentid) {
    global $DB;
    if (!pqlps_ack_ready()) {
        return false;
    }
    return $DB->get_record('local_prequran_live_ack', [
        'seriesid' => $seriesid,
        'studentid' => $studentid,
        'parentid' => $parentid,
    ]);
}

function pqlps_latest_change_time(array $changes): int {
    $latest = 0;
    foreach ($changes as $change) {
        $latest = max($latest, (int)$change->timecreated);
    }
    return $latest;
}

function pqlps_series_rows(int $studentid): array {
    global $DB;
    if (!pqlps_table_exists('local_prequran_live_session')
        || !pqlps_table_exists('local_prequran_live_participant')
        || !pqlps_column_exists('local_prequran_live_session', 'seriesid')) {
        return [];
    }
    $hasrecordings = pqlps_table_exists('local_prequran_live_recording');
    $hasnotes = pqlps_table_exists('local_prequran_live_note');
    $recordingjoin = $hasrecordings
        ? "LEFT JOIN {local_prequran_live_recording} r ON r.sessionid = s.id AND r.visible_to_parent = 1 AND r.status = 'available'"
        : "";
    $summaryjoin = $hasnotes
        ? "LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid AND n.visible_to_parent = 1"
        : "";
    $noteselect = $hasnotes ? "COALESCE(n.id, 0) AS noteid," : "0 AS noteid,";
    $recordingselect = $hasrecordings ? "COUNT(DISTINCT r.id) AS visible_recordings" : "0 AS visible_recordings";
    $notegroup = $hasnotes ? ", n.id" : "";
    return array_values($DB->get_records_sql(
        "SELECT s.id,
                s.seriesid,
                s.series_sequence,
                s.title,
                s.teacherid,
                s.lessonid,
                s.unitid,
                s.scheduled_start,
                s.scheduled_end,
                s.status,
                s.bbb_created,
                s.cancellation_reason,
                {$noteselect}
                {$recordingselect}
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
           {$summaryjoin}
           {$recordingjoin}
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND s.seriesid > 0
            AND s.scheduled_start >= :fromtime
       GROUP BY s.id, s.seriesid, s.series_sequence, s.title, s.teacherid, s.lessonid, s.unitid,
                s.scheduled_start, s.scheduled_end, s.status, s.bbb_created, s.cancellation_reason {$notegroup}
       ORDER BY s.seriesid DESC, s.scheduled_start ASC, s.id ASC",
        [
            'studentid' => $studentid,
            'role' => 'student',
            'participantstatus' => 'active',
            'fromtime' => time() - (60 * DAYSECS),
        ],
        0,
        200
    ));
}

function pqlps_change_history(array $seriesids): array {
    global $DB;
    if (!$seriesids || !pqlps_table_exists('local_prequran_live_audit')) {
        return [];
    }
    list($insql, $params) = $DB->get_in_or_equal($seriesids, SQL_PARAMS_NAMED, 'series');
    $rows = $DB->get_records_sql(
        "SELECT id, targetid, action, timecreated
           FROM {local_prequran_live_audit}
          WHERE targettype = :targettype
            AND targetid {$insql}
            AND action IN (
                'series_updated',
                'series_session_updated',
                'series_single_session_cancelled',
                'series_cancelled',
                'session_cancelled',
                'series_change_notifications_processed',
                'series_cancel_notifications_processed',
                'series_single_cancel_notice'
            )
       ORDER BY id DESC",
        ['targettype' => 'series'] + $params,
        0,
        120
    );
    $history = [];
    foreach ($rows as $row) {
        $history[(int)$row->targetid][] = $row;
    }
    return $history;
}

$modechildren = [];
if ($childid <= 0) {
    if (pqlps_is_managed_student((int)$USER->id)) {
        $childid = (int)$USER->id;
    } else if (pqlps_has_teacher_role((int)$USER->id)) {
        $modechildren = pqlps_teacher_students((int)$USER->id);
    } else {
        $modechildren = pqlps_parent_children((int)$USER->id);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

if ($childid > 0 && !pqlps_user_can_access_child((int)$USER->id, $childid)) {
    pqh_access_denied(
        'You cannot view this recurring live class schedule.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Recurring schedule access required'
    );
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$sessions = $childid > 0 ? pqlps_series_rows($childid) : [];
$seriesgroups = [];
foreach ($sessions as $session) {
    $seriesgroups[(int)$session->seriesid][] = $session;
}
$history = pqlps_change_history(array_keys($seriesgroups));

if (data_submitted() && optional_param('action', '', PARAM_ALPHANUMEXT) === 'ack_series_change') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the recurring class schedule and try the acknowledgement again.',
            new moodle_url('/local/hubredirect/live_series_schedule.php', $childid > 0 ? ['childid' => $childid] : []),
            'Schedule acknowledgement form expired'
        );
    }
    $seriesid = optional_param('seriesid', 0, PARAM_INT);
    $studentid = optional_param('studentid', 0, PARAM_INT);
    if ($seriesid <= 0 || $studentid <= 0) {
        pqh_access_denied(
            'Choose a valid recurring class schedule before acknowledging a change.',
            new moodle_url('/local/hubredirect/live_series_schedule.php', $childid > 0 ? ['childid' => $childid] : []),
            'Schedule acknowledgement unavailable'
        );
    }
    if ($studentid !== $childid || !pqlps_parent_can_access_child((int)$USER->id, $studentid)) {
        pqh_access_denied(
            'Only a linked parent can acknowledge this schedule change.',
            new moodle_url('/local/hubredirect/dashboard.php'),
            'Schedule acknowledgement access required'
        );
    }
    if (!pqlps_ack_ready()) {
        pqh_access_denied(
            'Schedule acknowledgement is not available yet.',
            new moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => $childid]),
            'Schedule acknowledgement unavailable'
        );
    }
    $changetime = pqlps_latest_change_time($history[$seriesid] ?? []);
    if ($changetime <= 0) {
        $changetime = time();
    }
    $now = time();
    $record = pqlps_ack_record($seriesid, $studentid, (int)$USER->id);
    if ($record) {
        $record->ack_status = 'acknowledged';
        $record->ack_message = 'Parent acknowledged the latest recurring class schedule change.';
        $record->acknowledgedat = $now;
        $record->lastchangeat = $changetime;
        $record->timemodified = $now;
        $DB->update_record('local_prequran_live_ack', $record);
    } else {
        $DB->insert_record('local_prequran_live_ack', (object)[
            'seriesid' => $seriesid,
            'studentid' => $studentid,
            'parentid' => (int)$USER->id,
            'ack_status' => 'acknowledged',
            'ack_message' => 'Parent acknowledged the latest recurring class schedule change.',
            'acknowledgedat' => $now,
            'lastchangeat' => $changetime,
            'remindedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    pqlps_audit(0, 'series_schedule_acknowledged', 'series', $seriesid, [
        'studentid' => $studentid,
        'parentid' => (int)$USER->id,
        'lastchangeat' => $changetime,
    ]);
    redirect(new moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => $childid, 'acknowledged' => 1]));
}

$acknotice = optional_param('acknowledged', 0, PARAM_BOOL) ? 'Schedule change acknowledged. Thank you.' : '';

pqh_enforce_role_domain(pqh_requested_consumer_context(), pqh_current_workspace_id((int)$USER->id), (int)$USER->id);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-series-schedule-page header,
body.pqh-live-series-schedule-page footer,
body.pqh-live-series-schedule-page nav.navbar,
body.pqh-live-series-schedule-page #page-header,
body.pqh-live-series-schedule-page #page-footer,
body.pqh-live-series-schedule-page .drawer,
body.pqh-live-series-schedule-page .drawer-toggles,
body.pqh-live-series-schedule-page .block-region,
body.pqh-live-series-schedule-page [data-region="drawer"],
body.pqh-live-series-schedule-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-series-schedule-page #page,
body.pqh-live-series-schedule-page #page-content,
body.pqh-live-series-schedule-page #region-main,
body.pqh-live-series-schedule-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlps-shell{min-height:100vh;padding:34px 18px 54px;background:#fff;color:#0f2237;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6}
.pqlps-wrap{max-width:1080px;margin:0 auto}.pqlps-top,.pqlps-card,.pqlps-panel{background:#fff;border:1px solid #e4e9ef;border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14)}
.pqlps-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:22px}
.pqlps-kicker{margin:0 0 6px;color:#5b6b7c;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.pqlps-title{margin:0;color:#0f2237;font-size:26px;line-height:1.1;font-weight:800;letter-spacing:-.02em}.pqlps-sub{margin:8px 0 0;color:#5b6b7c;font-size:14px;font-weight:500}
.pqlps-actions{display:flex;flex-wrap:wrap;gap:9px}.pqlps-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:10px;background:#fff;border:1px solid #e4e9ef;color:#0f2237!important;text-decoration:none;font-size:13px;font-weight:650}.pqlps-btn:hover{background:#edf3fc;border-color:#e0ebfa;text-decoration:none}.pqlps-btn--light{background:#edf3fc;color:#17498f!important;border:1px solid #e0ebfa}
.pqlps-students{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.pqlps-student{padding:16px;border-radius:14px;background:#fff;border:1px solid #e4e9ef;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);text-decoration:none;color:#0f2237!important;font-weight:700}.pqlps-student span{display:block;margin-top:4px;color:#5b6b7c;font-size:12px;font-weight:600}
.pqlps-list{display:grid;gap:14px}.pqlps-card{padding:18px}.pqlps-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.pqlps-card h2{margin:0;color:#0f2237;font-size:19px;font-weight:750;letter-spacing:-.01em}.pqlps-meta{margin:5px 0 0;color:#5b6b7c;font-size:13px;font-weight:600}
.pqlps-sessions{display:grid;gap:9px}.pqlps-session{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid #e4e9ef;border-radius:10px;background:#f7f4ec}.pqlps-session--cancelled{background:#fbe9e7}.pqlps-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:8px;background:#edf3fc;color:#17498f;font-size:12px;font-weight:650}.pqlps-pill--ok{background:#e8f4ec;color:#2e7d4f}.pqlps-pill--bad{background:#fbe9e7;color:#c0392b}.pqlps-pill--warn{background:#faf1dd;color:#b7791f}
.pqlps-history{margin-top:14px;padding:12px;border-radius:10px;background:#f7f4ec;border:1px solid #e4e9ef}.pqlps-history h3{margin:0 0 8px;color:#0f2237;font-size:15px;font-weight:750}.pqlps-change{display:grid;grid-template-columns:155px 1fr;gap:8px;padding:7px 0;border-top:1px solid #e4e9ef;font-size:12px;font-weight:600;color:#5b6b7c}
.pqlps-ack{margin-top:12px;padding:12px;border-radius:10px;background:#faf1dd;border:1px solid #f0dfc0}.pqlps-ack--done{background:#e8f4ec}.pqlps-ack form{margin-top:8px}.pqlps-notice{margin-bottom:14px;padding:12px 14px;border-radius:10px;background:#e8f4ec;border:1px solid rgba(46,125,79,.16);color:#2e7d4f;font-size:14px;font-weight:650}
.pqlps-empty{padding:18px;border-radius:14px;background:#fff;border:1px dashed #e4e9ef;color:#5b6b7c;font-weight:550}
@media(max-width:760px){.pqlps-top,.pqlps-head,.pqlps-session,.pqlps-change{display:block}.pqlps-actions{margin-top:12px}.pqlps-title{font-size:22px}}
<?php echo pqh_dashboard_header_css(); ?>
/* ---- EduPlatform design system layer: same tokens as the
   student/teacher dashboard - light paper background, blue
   appbar/gnav tint, quiet white surfaces, single blue accent. ---- */
.pqlps-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;--pqh-line:#e4e9ef;--pqh-bg:#f7f4ec;--pqh-surface:#fff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;--pqh-primary-ink:#17498f;
  background:#fff!important;color:var(--pqh-ink)}
.pqlps-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
.pqlps-shell .pqh-workspace-top{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;box-shadow:none!important;border-radius:14px!important}
.pqlps-shell .pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqlps-shell .pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqlps-shell .pqh-workspace-actions a,.pqlps-shell .pqh-workspace-actions button,.pqlps-btn{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqlps-shell .pqh-workspace-actions a:hover,.pqlps-shell .pqh-workspace-actions button:hover,.pqlps-btn:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
.pqlps-shell .pqh-workspace-actions a.pqh-workspace-logout{background:var(--pqh-ink)!important;border-color:var(--pqh-ink)!important;color:#fff!important}
.pqlps-shell [class*="-card"],.pqlps-shell [class*="-panel"]{background:var(--pqh-surface);border-color:var(--pqh-line)!important;border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05)}
.pqlps-shell h1,.pqlps-shell h2,.pqlps-shell h3{color:var(--pqh-ink)}
<?php echo pqh_design_shell_css('.pqlps-shell'); ?>
</style>
<style><?php echo pqh_openproject_skin_css('pqlps', 'pqh-live-series-schedule-page'); ?></style>
<main class="pqlps-shell">
<?php echo pqh_design_shell_html('pqlps-shell', 'live', pqh_live_page_shell_opts('Class Series Schedule', [], $childid)); ?><div class="pqlps-wrap">
  <section class="pqlps-top pqh-workspace-top">
    <div><p class="pqlps-kicker">Recurring live classes</p><h1 class="pqlps-title pqh-workspace-title">Series schedule for <?php echo s($childname); ?></h1><p class="pqlps-sub pqh-workspace-sub">Latest class times, cancellations, summaries, recordings, and parent-safe change history.</p></div>
  </section>

  <?php if ($acknotice !== ''): ?><div class="pqlps-notice"><?php echo s($acknotice); ?></div><?php endif; ?>

  <?php if ($childid <= 0): ?>
    <?php if ($modechildren): ?><section class="pqlps-students"><?php foreach ($modechildren as $childrow): ?><a class="pqlps-student" href="<?php echo (new moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => (int)$childrow['studentid']]))->out(false); ?>"><?php echo s((string)$childrow['name']); ?><span>Open recurring class series</span></a><?php endforeach; ?></section><?php else: ?><div class="pqlps-empty">No linked student was found for this series schedule view.</div><?php endif; ?>
  <?php elseif (!$seriesgroups): ?>
    <div class="pqlps-empty">No recurring live class series found for this student.</div>
  <?php else: ?>
    <section class="pqlps-list">
      <?php foreach ($seriesgroups as $seriesid => $items): ?>
        <?php
          $first = $items[0];
          $teacher = core_user::get_user((int)$first->teacherid);
          $activecount = 0;
          $cancelledcount = 0;
          foreach ($items as $item) {
              if ((string)$item->status === 'cancelled') {
                  $cancelledcount++;
              } else {
                  $activecount++;
              }
          }
        ?>
        <article class="pqlps-card">
          <div class="pqlps-head">
            <div>
              <h2><?php echo s((string)$first->title); ?></h2>
              <p class="pqlps-meta">Teacher: <?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$first->teacherid); ?></p>
              <p class="pqlps-meta">Review target: <?php echo s(trim((string)$first->lessonid . ' / ' . (string)$first->unitid, ' /') ?: 'to be confirmed'); ?></p>
              <p class="pqlps-meta"><?php echo (int)$activecount; ?> active class(es), <?php echo (int)$cancelledcount; ?> cancelled</p>
            </div>
            <span class="pqlps-pill <?php echo $cancelledcount > 0 ? 'pqlps-pill--warn' : 'pqlps-pill--ok'; ?>">Series #<?php echo (int)$seriesid; ?></span>
          </div>
          <div class="pqlps-sessions">
            <?php foreach ($items as $session): ?>
              <?php [$joinstate, $joinlabel] = pqlps_join_state($session); ?>
              <div class="pqlps-session <?php echo (string)$session->status === 'cancelled' ? 'pqlps-session--cancelled' : ''; ?>">
                <div>
                  <strong>Session <?php echo (int)$session->series_sequence; ?> - <?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?></strong>
                  <p class="pqlps-meta"><?php echo (string)$session->status === 'cancelled' ? 'Cancelled' : 'Scheduled'; ?><?php echo (string)$session->status === 'cancelled' && (string)$session->cancellation_reason !== '' ? ' - ' . s((string)$session->cancellation_reason) : ''; ?></p>
                </div>
                <div class="pqlps-actions pqh-workspace-actions">
                  <?php if ($joinstate === 'open'): ?><a class="pqlps-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', ['action' => 'join', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()]))->out(false); ?>">Join</a><?php else: ?><span class="pqlps-pill <?php echo $joinstate === 'cancelled' ? 'pqlps-pill--bad' : ''; ?>"><?php echo s($joinlabel); ?></span><?php endif; ?>
                  <?php if ((int)$session->noteid > 0): ?><a class="pqlps-btn pqlps-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_summaries.php', ['childid' => $childid]))->out(false); ?>">Summary</a><?php endif; ?>
                  <?php if ((int)$session->visible_recordings > 0): ?><a class="pqlps-btn pqlps-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings.php', ['childid' => $childid]))->out(false); ?>">Recording</a><?php endif; ?>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
          <div class="pqlps-history">
            <h3>Change History</h3>
            <?php $changes = array_slice($history[(int)$seriesid] ?? [], 0, 8); ?>
            <?php
              $latestchange = pqlps_latest_change_time($history[(int)$seriesid] ?? []);
              $ack = pqlps_ack_record((int)$seriesid, $childid, (int)$USER->id);
              $canack = pqlps_ack_ready() && $latestchange > 0 && !is_siteadmin($USER) && pqlps_parent_can_access_child((int)$USER->id, $childid);
              $ackcurrent = $ack && (int)$ack->acknowledgedat >= $latestchange;
            ?>
            <?php if (!$changes): ?><p class="pqlps-meta">No schedule changes recorded for this series.</p><?php else: ?>
              <?php foreach ($changes as $change): ?><div class="pqlps-change"><span><?php echo s(userdate((int)$change->timecreated, get_string('strftimedatetimeshort'))); ?></span><span><?php echo s(pqlps_parent_safe_change_label((string)$change->action)); ?></span></div><?php endforeach; ?>
            <?php endif; ?>
            <?php if ($canack): ?>
              <div class="pqlps-ack <?php echo $ackcurrent ? 'pqlps-ack--done' : ''; ?>">
                <?php if ($ackcurrent): ?>
                  <p class="pqlps-meta">Acknowledged on <?php echo s(userdate((int)$ack->acknowledgedat, get_string('strftimedatetimeshort'))); ?>.</p>
                <?php else: ?>
                  <p class="pqlps-meta">Please acknowledge that you have seen the latest schedule change for this recurring class.</p>
                  <form method="post">
                    <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                    <input type="hidden" name="action" value="ack_series_change">
                    <input type="hidden" name="seriesid" value="<?php echo (int)$seriesid; ?>">
                    <input type="hidden" name="studentid" value="<?php echo (int)$childid; ?>">
                    <button class="pqlps-btn" type="submit">Acknowledge schedule change</button>
                  </form>
                <?php endif; ?>
              </div>
            <?php endif; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </section>
  <?php endif; ?>
</div></main>
<?php
echo $OUTPUT->footer();
