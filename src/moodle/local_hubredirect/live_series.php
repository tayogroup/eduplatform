<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_series.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Class Series');
$PAGE->set_heading('Live Class Series');
$PAGE->add_body_class('pqh-live-series-page');

function pqlser_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlser_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlser_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlser_ready(): bool {
    return pqlser_table_exists('local_prequran_live_series')
        && pqlser_table_exists('local_prequran_live_session')
        && pqlser_table_exists('local_prequran_live_audit')
        && pqlser_column_exists('local_prequran_live_session', 'seriesid');
}

function pqlser_is_managed_student(int $userid): bool {
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

function pqlser_is_teacher(int $userid): bool {
    global $DB, $USER;
    if (is_siteadmin($userid) || ((int)$USER->id === $userid && is_siteadmin($USER)) || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if (pqh_user_can_create_live_sessions($userid)) {
        return true;
    }
    if (pqlser_table_exists('local_prequran_teacher_student')
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

function pqlser_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlser_table_exists('local_prequran_live_audit')) {
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

function pqlser_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw), -1, PREG_SPLIT_NO_EMPTY);
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlser_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlser_series_studentids(int $seriesid): array {
    global $DB;
    if (!pqlser_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT p.studentid
           FROM {local_prequran_live_participant} p
           JOIN {local_prequran_live_session} s ON s.id = p.sessionid
          WHERE s.seriesid = :seriesid
            AND p.role = 'student'
            AND p.status = 'active'
            AND p.studentid > 0
       ORDER BY p.studentid ASC",
        ['seriesid' => $seriesid]
    );
    return array_values(array_map(static function($row): int {
        return (int)$row->studentid;
    }, $rows));
}

function pqlser_sync_session_participants($session, int $teacherid, array $studentids): array {
    global $DB, $USER;
    $now = time();
    $added = [];
    $removed = [];

    $teacher = core_user::get_user($teacherid);
    $activeoldteachers = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => (int)$session->id,
        'role' => 'teacher',
        'status' => 'active',
    ]);
    $hasnewteacher = false;
    foreach ($activeoldteachers as $participant) {
        if ((int)$participant->userid === $teacherid) {
            $hasnewteacher = true;
            $participant->displayname = $teacher ? fullname($teacher) : 'Teacher ' . $teacherid;
            $participant->timemodified = $now;
            $DB->update_record('local_prequran_live_participant', $participant);
        } else {
            $participant->status = 'removed';
            $participant->timemodified = $now;
            $DB->update_record('local_prequran_live_participant', $participant);
        }
    }
    if (!$hasnewteacher) {
        $DB->insert_record('local_prequran_live_participant', (object)[
            'sessionid' => (int)$session->id,
            'userid' => $teacherid,
            'role' => 'teacher',
            'studentid' => 0,
            'status' => 'active',
            'displayname' => $teacher ? fullname($teacher) : 'Teacher ' . $teacherid,
            'invitedby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }

    $current = [];
    $participants = $DB->get_records('local_prequran_live_participant', [
        'sessionid' => (int)$session->id,
        'role' => 'student',
        'status' => 'active',
    ]);
    foreach ($participants as $participant) {
        $studentid = (int)$participant->studentid;
        $current[$studentid] = $participant;
        if (!in_array($studentid, $studentids, true)) {
            $participant->status = 'removed';
            $participant->timemodified = $now;
            $DB->update_record('local_prequran_live_participant', $participant);
            $removed[] = $studentid;
        }
    }
    foreach ($studentids as $studentid) {
        if (isset($current[$studentid])) {
            continue;
        }
        $student = core_user::get_user($studentid);
        $existingrows = $DB->get_records('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'role' => 'student',
            'studentid' => $studentid,
        ], 'id DESC', '*', 0, 1);
        $existing = $existingrows ? reset($existingrows) : false;
        if ($existing) {
            $existing->userid = $studentid;
            $existing->status = 'active';
            $existing->displayname = $student ? fullname($student) : 'Student ' . $studentid;
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_live_participant', $existing);
        } else {
            $DB->insert_record('local_prequran_live_participant', (object)[
                'sessionid' => (int)$session->id,
                'userid' => $studentid,
                'role' => 'student',
                'studentid' => $studentid,
                'status' => 'active',
                'displayname' => $student ? fullname($student) : 'Student ' . $studentid,
                'invitedby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        $added[] = $studentid;
    }
    return ['added' => $added, 'removed' => $removed];
}

function pqlser_first_future_sessionid(int $seriesid): int {
    global $DB;
    $row = $DB->get_record_sql(
        "SELECT id
           FROM {local_prequran_live_session}
          WHERE seriesid = :seriesid
            AND scheduled_start >= :nowtime
            AND status NOT IN ('completed', 'cancelled')
       ORDER BY scheduled_start ASC, id ASC",
        ['seriesid' => $seriesid, 'nowtime' => time()]
    );
    return $row ? (int)$row->id : 0;
}

function pqlser_notify_teacher(int $seriesid, int $teacherid, string $subject, string $message, string $eventtype): bool {
    if ($teacherid <= 0) {
        return false;
    }
    $sessionid = pqlser_first_future_sessionid($seriesid);
    return local_prequran_notify_user_live_update(
        $sessionid,
        $teacherid,
        $subject,
        $message,
        new moodle_url('/local/hubredirect/live_series.php'),
        'Live class series',
        $eventtype
    );
}

function pqlser_notify_parents(int $seriesid, array $studentids, string $subject, string $message, string $eventtype): int {
    $sent = 0;
    $sessionid = pqlser_first_future_sessionid($seriesid);
    $url = new moodle_url('/local/hubredirect/live_schedule.php');
    foreach (array_values(array_unique(array_filter(array_map('intval', $studentids)))) as $studentid) {
        $sent += local_prequran_notify_parent_live_update(
            $sessionid,
            $studentid,
            $subject,
            $message,
            $url,
            'Live class schedule',
            $eventtype
        );
    }
    return $sent;
}

function pqlser_change_summary(array $old, array $new): array {
    $changes = [];
    foreach (['title', 'lessonid', 'unitid', 'start_time', 'duration_minutes', 'teacherid'] as $key) {
        if ((string)($old[$key] ?? '') !== (string)($new[$key] ?? '')) {
            $changes[] = $key;
        }
    }
    $oldstudents = array_values(array_unique(array_map('intval', $old['students'] ?? [])));
    $newstudents = array_values(array_unique(array_map('intval', $new['students'] ?? [])));
    sort($oldstudents);
    sort($newstudents);
    if ($oldstudents !== $newstudents) {
        $changes[] = 'students';
    }
    return $changes;
}

function pqlser_ack_ready(): bool {
    return pqlser_table_exists('local_prequran_live_ack');
}

function pqlser_latest_change_time(int $seriesid): int {
    global $DB;
    if (!pqlser_table_exists('local_prequran_live_audit')) {
        return 0;
    }
    return (int)$DB->get_field_sql(
        "SELECT MAX(timecreated)
           FROM {local_prequran_live_audit}
          WHERE targettype = :targettype
            AND targetid = :seriesid
            AND action IN (
                'series_updated',
                'series_session_updated',
                'series_single_session_cancelled',
                'series_cancelled',
                'session_cancelled',
                'series_change_notifications_processed',
                'series_cancel_notifications_processed',
                'series_single_cancel_notice'
            )",
        ['targettype' => 'series', 'seriesid' => $seriesid]
    );
}

function pqlser_ack_current(int $seriesid, int $studentid, int $parentid, int $latestchange): bool {
    global $DB;
    if (!pqlser_ack_ready() || $latestchange <= 0) {
        return false;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_live_ack}
          WHERE seriesid = :seriesid
            AND studentid = :studentid
            AND parentid = :parentid
            AND ack_status = :status
            AND acknowledgedat >= :latestchange",
        [
            'seriesid' => $seriesid,
            'studentid' => $studentid,
            'parentid' => $parentid,
            'status' => 'acknowledged',
            'latestchange' => $latestchange,
        ]
    );
}

$canoperate = is_siteadmin($USER) || pqh_can_manage_academy_operations((int)$USER->id);
$canmanageseries = $canoperate || pqh_user_can_create_live_sessions(
    (int)$USER->id,
    (int)($consumercontext->workspaceid ?? 0)
);
if (!$canmanageseries) {
    pqh_access_denied(
        'Only teachers and administrators can manage live class series.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Live class series access required'
    );
}

$ready = pqlser_ready();
$notice = '';
$seriesurl = new moodle_url('/local/hubredirect/live_series.php');

$action = optional_param('action', '', PARAM_ALPHANUMEXT);

if ($ready && $action === 'update_series') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen the live class series page and try again.', $seriesurl, 'Live class series form expired');
    }
    $seriesid = optional_param('seriesid', 0, PARAM_INT);
    $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
    if (!$series) {
        pqh_access_denied('Choose a valid live class series before editing it.', $seriesurl, 'Live class series unavailable');
    }
    if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
        pqh_access_denied('You cannot edit this class series.', $seriesurl, 'Live class series access required');
    }

    $now = time();
    $teacherid = $canoperate ? optional_param('teacherid', 0, PARAM_INT) : (int)$series->teacherid;
    $title = optional_param('title', '', PARAM_TEXT);
    $lessonid = optional_param('lessonid', '', PARAM_ALPHANUMEXT);
    $unitid = optional_param('unitid', '', PARAM_ALPHANUMEXT);
    $starttime = optional_param('start_time', '', PARAM_TEXT);
    $duration = max(15, optional_param('duration_minutes', 60, PARAM_INT));
    $studentids = pqlser_parse_students(optional_param('studentids_raw', '', PARAM_RAW));
    if ($teacherid <= 0 || trim($title) === '' || trim($lessonid) === '' || trim($unitid) === '' || !$studentids) {
        pqh_access_denied('Complete the required series fields before saving.', $seriesurl, 'Live class series form incomplete');
    }
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', $starttime, $matches)) {
        pqh_access_denied('Enter a valid class time before saving the series.', $seriesurl, 'Live class series time unavailable');
    }
    $hour = min(23, (int)$matches[1]);
    $minute = (int)$matches[2];

    $old = [
        'teacherid' => (int)$series->teacherid,
        'title' => (string)$series->title,
        'lessonid' => (string)$series->lessonid,
        'unitid' => (string)$series->unitid,
        'start_time' => (string)$series->start_time,
        'duration_minutes' => (int)$series->duration_minutes,
        'students' => pqlser_series_studentids($seriesid),
    ];
    $new = [
        'teacherid' => $teacherid,
        'title' => $title,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'start_time' => sprintf('%02d:%02d', $hour, $minute),
        'duration_minutes' => $duration,
        'students' => $studentids,
    ];
    $changesummary = pqlser_change_summary($old, $new);

    $series->teacherid = $teacherid;
    $series->title = $title;
    $series->lessonid = $lessonid;
    $series->unitid = $unitid;
    $series->start_time = $new['start_time'];
    $series->duration_minutes = $duration;
    $series->session_count = (int)$DB->count_records('local_prequran_live_session', ['seriesid' => $seriesid]);
    $series->timemodified = $now;
    $DB->update_record('local_prequran_live_series', $series);

    $sessions = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_session}
          WHERE seriesid = :seriesid
            AND scheduled_start >= :nowtime
            AND status NOT IN ('completed', 'cancelled')
       ORDER BY scheduled_start ASC, id ASC",
        ['seriesid' => $seriesid, 'nowtime' => $now]
    );
    $changed = 0;
    $participantchanges = ['added' => [], 'removed' => []];
    foreach ($sessions as $session) {
        $date = date('Y-m-d', (int)$session->scheduled_start);
        $newstart = strtotime($date . ' ' . sprintf('%02d:%02d:00', $hour, $minute));
        if (!$newstart) {
            $newstart = (int)$session->scheduled_start;
        }
        $session->teacherid = $teacherid;
        $session->title = $title;
        $session->lessonid = $lessonid;
        $session->unitid = $unitid;
        $session->scheduled_start = (int)$newstart;
        $session->scheduled_end = (int)$newstart + ($duration * MINSECS);
        $session->max_participants = max((int)$session->max_participants, count($studentids) + 1);
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
        $sync = pqlser_sync_session_participants($session, $teacherid, $studentids);
        $participantchanges['added'] = array_values(array_unique(array_merge($participantchanges['added'], $sync['added'])));
        $participantchanges['removed'] = array_values(array_unique(array_merge($participantchanges['removed'], $sync['removed'])));
        pqlser_audit((int)$session->id, 'series_session_updated', 'series', $seriesid, ['teacherid' => $teacherid, 'students' => $studentids]);
        $changed++;
    }
    pqlser_audit(0, 'series_updated', 'series', $seriesid, [
        'old' => $old,
        'new' => $new,
        'changed_fields' => $changesummary,
        'future_sessions_updated' => $changed,
        'participants' => $participantchanges,
    ]);

    $addedstudents = array_values(array_diff($studentids, $old['students']));
    $removedstudents = array_values(array_diff($old['students'], $studentids));
    $notificationdetails = ['teachers' => 0, 'parents' => 0, 'changed_fields' => $changesummary];
    if ($changesummary) {
        $message = 'A recurring ' . $brandname . ' live class series was updated: ' . $title . '. Future sessions have been adjusted.';
        if ((int)$old['teacherid'] !== $teacherid) {
            if (pqlser_notify_teacher($seriesid, (int)$old['teacherid'], 'Live class series reassigned', 'A recurring live class series was reassigned away from you: ' . (string)$old['title'] . '.', 'series_teacher_reassigned')) {
                $notificationdetails['teachers']++;
            }
            if (pqlser_notify_teacher($seriesid, $teacherid, 'New live class series assigned', 'A recurring live class series was assigned to you: ' . $title . '.', 'series_teacher_assigned')) {
                $notificationdetails['teachers']++;
            }
        } else if (pqlser_notify_teacher($seriesid, $teacherid, 'Live class series updated', $message, 'series_teacher_updated')) {
            $notificationdetails['teachers']++;
        }

        if (array_intersect($changesummary, ['title', 'start_time', 'duration_minutes', 'teacherid'])) {
            $parentmessage = 'A recurring ' . $brandname . ' live class schedule was updated. Please check the live class schedule for the latest class time and teacher.';
            $notificationdetails['parents'] += pqlser_notify_parents($seriesid, $studentids, 'Live class schedule updated', $parentmessage, 'series_parent_schedule_updated');
        }
        if ($addedstudents) {
            $notificationdetails['parents'] += pqlser_notify_parents($seriesid, $addedstudents, 'Student added to live class series', 'Your student was added to a recurring ' . $brandname . ' live class series. Please check the live class schedule for upcoming classes.', 'series_parent_student_added');
        }
        if ($removedstudents) {
            $notificationdetails['parents'] += pqlser_notify_parents($seriesid, $removedstudents, 'Live class schedule changed', 'Your student was removed from future sessions in a recurring ' . $brandname . ' live class series. Please contact the academy if you have questions.', 'series_parent_student_removed');
        }
        pqlser_audit(0, 'series_change_notifications_processed', 'series', $seriesid, $notificationdetails);
    }
    redirect(new moodle_url('/local/hubredirect/live_series.php', ['updated' => $changed, 'notified' => $notificationdetails['teachers'] + $notificationdetails['parents']]));
}

if ($ready && $action === 'cancel_session') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen the live class series page and try again.', $seriesurl, 'Live class series form expired');
    }
    $seriesid = optional_param('seriesid', 0, PARAM_INT);
    $sessionid = optional_param('sessionid', 0, PARAM_INT);
    $reason = trim(optional_param('reason', '', PARAM_TEXT));
    $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
    $session = $sessionid > 0 && $seriesid > 0
        ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'seriesid' => $seriesid], '*', IGNORE_MISSING)
        : false;
    if (!$series || !$session) {
        pqh_access_denied('Choose a valid live class session before cancelling it.', $seriesurl, 'Live class session unavailable');
    }
    if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
        pqh_access_denied('You cannot cancel this class session.', $seriesurl, 'Live class session access required');
    }
    $session->status = 'cancelled';
    $session->cancelledby = (int)$USER->id;
    $session->cancellation_reason = $reason;
    $session->timemodified = time();
    $DB->update_record('local_prequran_live_session', $session);
    pqlser_audit((int)$session->id, 'series_single_session_cancelled', 'series', $seriesid, ['reason' => $reason]);
    $studentids = pqlser_series_studentids($seriesid);
    $sent = 0;
    if (pqlser_notify_teacher($seriesid, (int)$series->teacherid, 'Live class session cancelled', 'One session in your recurring live class series was cancelled: ' . (string)$series->title . '.', 'series_teacher_session_cancelled')) {
        $sent++;
    }
    $sent += pqlser_notify_parents($seriesid, $studentids, 'Live class session cancelled', 'One upcoming ' . $brandname . ' live class session was cancelled. Please check the live class schedule for details.', 'series_parent_session_cancelled');
    pqlser_audit((int)$session->id, 'series_single_cancel_notice', 'series', $seriesid, ['sent' => $sent]);
    redirect(new moodle_url('/local/hubredirect/live_series.php', ['sessioncancelled' => 1, 'notified' => $sent]));
}

if ($ready && $action === 'cancel_series') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen the live class series page and try again.', $seriesurl, 'Live class series form expired');
    }
    $seriesid = optional_param('seriesid', 0, PARAM_INT);
    $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
    if (!$series) {
        pqh_access_denied('Choose a valid live class series before cancelling it.', $seriesurl, 'Live class series unavailable');
    }
    if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
        pqh_access_denied('You cannot cancel this class series.', $seriesurl, 'Live class series access required');
    }
    $reason = trim(optional_param('reason', '', PARAM_TEXT));
    $now = time();
    $series->status = 'cancelled';
    $series->cancelledby = (int)$USER->id;
    $series->cancellation_reason = $reason;
    $series->timemodified = $now;
    $DB->update_record('local_prequran_live_series', $series);

    $sessions = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_session}
          WHERE seriesid = :seriesid
            AND scheduled_start >= :nowtime
            AND status NOT IN ('completed', 'cancelled')",
        ['seriesid' => $seriesid, 'nowtime' => $now]
    );
    foreach ($sessions as $session) {
        $session->status = 'cancelled';
        $session->cancelledby = (int)$USER->id;
        $session->cancellation_reason = $reason;
        $session->timemodified = $now;
        $DB->update_record('local_prequran_live_session', $session);
        pqlser_audit((int)$session->id, 'session_cancelled', 'series', $seriesid, ['reason' => $reason]);
    }
    pqlser_audit(0, 'series_cancelled', 'series', $seriesid, ['reason' => $reason, 'sessions' => count($sessions)]);
    $studentids = pqlser_series_studentids($seriesid);
    $sent = 0;
    if (pqlser_notify_teacher($seriesid, (int)$series->teacherid, 'Live class series cancelled', 'Future sessions in your recurring live class series were cancelled: ' . (string)$series->title . '.', 'series_teacher_cancelled')) {
        $sent++;
    }
    $sent += pqlser_notify_parents($seriesid, $studentids, 'Live class series cancelled', 'Future sessions in a ' . $brandname . ' recurring live class series were cancelled. Please check the live class schedule for details.', 'series_parent_cancelled');
    pqlser_audit(0, 'series_cancel_notifications_processed', 'series', $seriesid, ['sent' => $sent]);
    redirect(new moodle_url('/local/hubredirect/live_series.php', ['cancelled' => 1, 'notified' => $sent]));
}

if ($ready && $action === 'remind_ack') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen the live class series page and try again.', $seriesurl, 'Live class series form expired');
    }
    $seriesid = optional_param('seriesid', 0, PARAM_INT);
    $series = $seriesid > 0 ? $DB->get_record('local_prequran_live_series', ['id' => $seriesid]) : false;
    if (!$series) {
        pqh_access_denied('Choose a valid live class series before sending reminders.', $seriesurl, 'Live class series unavailable');
    }
    if (!$canoperate && (int)$series->teacherid !== (int)$USER->id) {
        pqh_access_denied('You cannot send reminders for this class series.', $seriesurl, 'Live class series access required');
    }
    if (!pqlser_ack_ready()) {
        pqh_access_denied('Schedule acknowledgement reminders are not available yet.', $seriesurl, 'Schedule acknowledgement unavailable');
    }
    $latestchange = pqlser_latest_change_time($seriesid);
    $sent = 0;
    $skipped = 0;
    foreach (pqlser_series_studentids($seriesid) as $studentid) {
        $parents = function_exists('local_prequran_notify_parent_ids_for_student') ? local_prequran_notify_parent_ids_for_student($studentid) : [];
        if (!$parents) {
            pqlser_audit(0, 'series_ack_reminder_skipped', 'series', $seriesid, ['studentid' => $studentid, 'reason' => 'no linked parents']);
            $skipped++;
            continue;
        }
        foreach ($parents as $parentid) {
            if (pqlser_ack_current($seriesid, $studentid, (int)$parentid, $latestchange)) {
                pqlser_audit(0, 'series_ack_reminder_skipped', 'series', $seriesid, ['studentid' => $studentid, 'parentid' => (int)$parentid, 'reason' => 'already acknowledged']);
                $skipped++;
                continue;
            }
            if (local_prequran_notify_user_live_update(
                pqlser_first_future_sessionid($seriesid),
                (int)$parentid,
                'Please acknowledge live class schedule change',
                'Please review and acknowledge the latest recurring ' . $brandname . ' live class schedule change.',
                new moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => $studentid]),
                'Recurring live class schedule',
                'series_ack_reminder',
                $studentid
            )) {
                $sent++;
                pqlser_audit(0, 'series_ack_reminder_sent', 'series', $seriesid, ['studentid' => $studentid, 'parentid' => (int)$parentid]);
                if (pqlser_ack_ready()) {
                    $ack = $DB->get_record('local_prequran_live_ack', ['seriesid' => $seriesid, 'studentid' => $studentid, 'parentid' => (int)$parentid]);
                    $now = time();
                    if ($ack) {
                        $ack->remindedat = $now;
                        $ack->timemodified = $now;
                        $DB->update_record('local_prequran_live_ack', $ack);
                    } else {
                        $DB->insert_record('local_prequran_live_ack', (object)[
                            'seriesid' => $seriesid,
                            'studentid' => $studentid,
                            'parentid' => (int)$parentid,
                            'ack_status' => 'pending',
                            'ack_message' => '',
                            'acknowledgedat' => 0,
                            'lastchangeat' => $latestchange,
                            'remindedat' => $now,
                            'timecreated' => $now,
                            'timemodified' => $now,
                        ]);
                    }
                }
            }
        }
    }
    redirect(new moodle_url('/local/hubredirect/live_series.php', ['ackreminded' => $sent, 'ackskipped' => $skipped]));
}

if (optional_param('cancelled', 0, PARAM_BOOL)) {
    $notice = 'Series cancelled. Future sessions in the series were cancelled.';
}
if (optional_param('sessioncancelled', 0, PARAM_BOOL)) {
    $notice = 'One session in the series was cancelled.';
}
if (($updated = optional_param('updated', -1, PARAM_INT)) >= 0) {
    $notice = $updated . ' future session(s) updated for the series.';
}
if (($notified = optional_param('notified', -1, PARAM_INT)) >= 0) {
    $notice .= ($notice !== '' ? ' ' : '') . $notified . ' notification(s) processed.';
}
if (($ackreminded = optional_param('ackreminded', -1, PARAM_INT)) >= 0) {
    $notice = $ackreminded . ' acknowledgement reminder(s) sent; ' . optional_param('ackskipped', 0, PARAM_INT) . ' skipped.';
}

$seriesrows = [];
if ($ready) {
    $where = $canoperate ? "1 = 1" : "se.teacherid = :teacherid";
    $params = $canoperate ? [] : ['teacherid' => (int)$USER->id];
    $seriesrows = array_values($DB->get_records_sql(
        "SELECT se.*,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id) AS generated_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.status <> 'cancelled') AS active_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.status = 'completed') AS completed_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.status = 'cancelled') AS cancelled_sessions,
                (SELECT COUNT(1) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.scheduled_start >= :futuretime AND s.status NOT IN ('completed', 'cancelled')) AS future_sessions,
                (SELECT MIN(s.scheduled_start) FROM {local_prequran_live_session} s WHERE s.seriesid = se.id AND s.scheduled_start >= :nowtime) AS next_start
           FROM {local_prequran_live_series} se
          WHERE {$where}
       ORDER BY se.date_start DESC, se.id DESC",
        ['nowtime' => time(), 'futuretime' => time()] + $params,
        0,
        50
    ));
}

$seriessessions = [];
$seriescommunications = [];
$seriesacks = [];
if ($ready && $seriesrows) {
    $seriesids = array_map(static function($row): int {
        return (int)$row->id;
    }, $seriesrows);
    list($insql, $inparams) = $DB->get_in_or_equal($seriesids, SQL_PARAMS_NAMED, 'seriesid');
    $sessions = $DB->get_records_sql(
        "SELECT id, seriesid, series_sequence, title, scheduled_start, scheduled_end, status
           FROM {local_prequran_live_session}
          WHERE seriesid {$insql}
       ORDER BY seriesid DESC, scheduled_start ASC, id ASC",
        $inparams
    );
    foreach ($sessions as $session) {
        $seriessessions[(int)$session->seriesid][] = $session;
    }

    if (pqlser_table_exists('local_prequran_live_audit')) {
        $sessionidsbyseries = [];
        foreach ($sessions as $session) {
            $sessionidsbyseries[(int)$session->seriesid][] = (int)$session->id;
        }
        foreach ($seriesids as $seriesid) {
            $ids = $sessionidsbyseries[$seriesid] ?? [];
            $conditions = ['(targettype = :targettypeseries' . $seriesid . ' AND targetid = :targetidseries' . $seriesid . ')'];
            $params = ['targettypeseries' . $seriesid => 'series', 'targetidseries' . $seriesid => $seriesid];
            if ($ids) {
                list($sessioninsql, $sessionparams) = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'comm' . $seriesid);
                $conditions[] = "sessionid {$sessioninsql}";
                $params += $sessionparams;
            }
            $seriescommunications[$seriesid] = array_values($DB->get_records_sql(
                "SELECT id, sessionid, actorid, action, targettype, targetid, details, timecreated
                   FROM {local_prequran_live_audit}
                  WHERE (" . implode(' OR ', $conditions) . ")
                    AND action IN (
                        'notification_sent',
                        'notification_failed',
                        'notification_skipped',
                        'series_change_notifications_processed',
                        'series_cancel_notifications_processed',
                        'series_single_cancel_notice'
                    )
               ORDER BY id DESC",
                $params,
                0,
                8
            ));
        }
    }

    if (pqlser_ack_ready()) {
        foreach ($seriesids as $seriesid) {
            $latestchange = pqlser_latest_change_time((int)$seriesid);
            $expected = 0;
            $current = 0;
            $pending = 0;
            foreach (pqlser_series_studentids((int)$seriesid) as $studentid) {
                $parents = function_exists('local_prequran_notify_parent_ids_for_student') ? local_prequran_notify_parent_ids_for_student($studentid) : [];
                foreach ($parents as $parentid) {
                    $expected++;
                    if (pqlser_ack_current((int)$seriesid, $studentid, (int)$parentid, $latestchange)) {
                        $current++;
                    } else {
                        $pending++;
                    }
                }
            }
            $latestack = (int)$DB->get_field_sql(
                "SELECT MAX(acknowledgedat) FROM {local_prequran_live_ack} WHERE seriesid = :seriesid",
                ['seriesid' => (int)$seriesid]
            );
            $seriesacks[(int)$seriesid] = [
                'latestchange' => $latestchange,
                'expected' => $expected,
                'current' => $current,
                'pending' => $pending,
                'latestack' => $latestack,
            ];
        }
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-series-page header,
body.pqh-live-series-page footer,
body.pqh-live-series-page nav.navbar,
body.pqh-live-series-page #page-header,
body.pqh-live-series-page #page-footer,
body.pqh-live-series-page .drawer,
body.pqh-live-series-page .drawer-toggles,
body.pqh-live-series-page .block-region,
body.pqh-live-series-page [data-region="drawer"],
body.pqh-live-series-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-series-page #page,
body.pqh-live-series-page #page-content,
body.pqh-live-series-page #region-main,
body.pqh-live-series-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqlser-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqlser-wrap{max-width:1120px;margin:0 auto}
.pqlser-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqlser-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqlser-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqlser-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqlser-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqlser-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqlser-btn--danger{background:#883526}
.pqlser-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqlser-list{display:grid;gap:12px}
.pqlser-card{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqlser-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}
.pqlser-card h2{margin:0;font-size:20px;font-weight:950;color:#173044}
.pqlser-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqlser-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}
.pqlser-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqlser-field{display:flex;gap:8px;margin-top:12px}
.pqlser-edit{margin-top:14px;padding:14px;border:1px solid rgba(23,48,68,.1);border-radius:10px;background:#fbfdff}
.pqlser-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pqlser-input,.pqlser-textarea{min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:8px 10px;font:800 13px/1.2 system-ui;color:#173044;background:#fff;width:100%}
.pqlser-textarea{min-height:74px}
.pqlser-label{display:block;margin:0 0 5px;color:#415665;font-size:12px;font-weight:950}
.pqlser-alert{margin-bottom:14px;padding:12px 14px;border-radius:8px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-size:14px;font-weight:850}
.pqlser-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqlser-session-list{display:grid;gap:8px;margin-top:12px}
.pqlser-session{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fff}
.pqlser-session form{display:flex;gap:8px;align-items:center}
.pqlser-session .pqlser-input{width:210px}
.pqlser-comm{margin-top:14px;padding:12px;border-radius:10px;background:#f7fafc;border:1px solid rgba(23,48,68,.1)}
.pqlser-comm h3{margin:0 0 8px;font-size:15px;font-weight:950;color:#173044}
.pqlser-comm-row{display:grid;grid-template-columns:150px 1fr 70px;gap:8px;padding:7px 0;border-top:1px solid rgba(23,48,68,.08);font-size:12px;font-weight:800;color:#415665}
.pqlser-ack{margin-top:14px;padding:12px;border-radius:10px;background:#fff7e7;border:1px solid rgba(123,90,58,.18)}.pqlser-ack--ok{background:#edf9ef;border-color:rgba(36,92,53,.16)}
@media(max-width:900px){.pqlser-grid{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.pqlser-top,.pqlser-head,.pqlser-session,.pqlser-comm-row{display:block}.pqlser-actions,.pqlser-field{margin-top:12px}.pqlser-field{display:grid}.pqlser-grid{grid-template-columns:1fr}.pqlser-title{font-size:24px}.pqlser-session form{margin-top:8px;display:grid}.pqlser-session .pqlser-input{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
<?php echo pqh_design_system_css('.pqlser-shell'); ?>
<?php echo pqh_design_shell_css('.pqlser-shell'); ?>
</style>
<main class="pqlser-shell">
<?php echo pqh_design_shell_html('pqlser-shell'); ?>
  <div class="pqlser-wrap">
    <section class="pqlser-top pqh-workspace-top">
      <div>
        <h1 class="pqlser-title pqh-workspace-title">Live Class Series</h1>
        <p class="pqlser-sub pqh-workspace-sub">View recurring class groups and cancel future sessions when needed.</p>
      </div>
      <div class="pqlser-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <a class="pqlser-btn pqlser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <?php if ($canoperate): ?>
          <a class="pqlser-btn pqlser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php'))->out(false); ?>">Series wizard</a>
        <?php endif; ?>
        <a class="pqlser-btn pqlser-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/teacher_workspace.php'))->out(false); ?>">Teacher workspace</a>
        <a class="pqlser-btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <?php if ($notice !== ''): ?><div class="pqlser-alert"><?php echo s($notice); ?></div><?php endif; ?>

    <section class="pqlser-panel">
      <?php if (!$ready): ?>
        <div class="pqlser-empty">Run the Phase 16 series SQL before managing recurring class series.</div>
      <?php elseif (!$seriesrows): ?>
        <div class="pqlser-empty">No recurring class series found yet.</div>
      <?php else: ?>
        <div class="pqlser-list">
          <?php foreach ($seriesrows as $series): ?>
            <?php
                $teacher = core_user::get_user((int)$series->teacherid);
                $studentids = pqlser_series_studentids((int)$series->id);
                $sessionsforseries = $seriessessions[(int)$series->id] ?? [];
                $derivedstatus = (string)$series->status;
                if ($derivedstatus !== 'cancelled') {
                    if ((int)$series->generated_sessions > 0 && (int)$series->completed_sessions >= (int)$series->generated_sessions) {
                        $derivedstatus = 'completed';
                    } else if ((int)$series->cancelled_sessions > 0) {
                        $derivedstatus = 'partially cancelled';
                    } else if ((int)$series->future_sessions === 0) {
                        $derivedstatus = 'needs review';
                    }
                }
            ?>
            <article class="pqlser-card">
              <div class="pqlser-head">
                <div>
                  <h2><?php echo s((string)$series->title); ?></h2>
                  <p class="pqlser-meta">Series #<?php echo (int)$series->id; ?> - <?php echo s((string)$series->pattern); ?><?php echo (string)$series->weekdays !== '' ? ' - ' . s((string)$series->weekdays) : ''; ?></p>
                  <p class="pqlser-meta"><?php echo s($teacher ? fullname($teacher) : 'Teacher ' . (int)$series->teacherid); ?> - <?php echo (int)$series->generated_sessions; ?> generated, <?php echo (int)$series->active_sessions; ?> active, <?php echo (int)$series->completed_sessions; ?> completed, <?php echo (int)$series->cancelled_sessions; ?> cancelled</p>
                  <p class="pqlser-meta">Next: <?php echo !empty($series->next_start) ? userdate((int)$series->next_start, get_string('strftimedatetimeshort')) : 'none'; ?></p>
                </div>
                <span class="pqlser-pill <?php echo $derivedstatus === 'needs review' || $derivedstatus === 'partially cancelled' ? 'pqlser-pill--warn' : ''; ?>"><?php echo s($derivedstatus); ?></span>
              </div>
              <?php if ((string)$series->status !== 'cancelled'): ?>
                <form class="pqlser-edit" method="post">
                  <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                  <input type="hidden" name="action" value="update_series">
                  <input type="hidden" name="seriesid" value="<?php echo (int)$series->id; ?>">
                  <div class="pqlser-grid">
                    <div><label class="pqlser-label" for="title-<?php echo (int)$series->id; ?>">Title</label><input class="pqlser-input" id="title-<?php echo (int)$series->id; ?>" name="title" value="<?php echo s((string)$series->title); ?>" required></div>
                    <div><label class="pqlser-label" for="teacher-<?php echo (int)$series->id; ?>">Teacher ID</label><input class="pqlser-input" id="teacher-<?php echo (int)$series->id; ?>" name="teacherid" type="number" min="1" value="<?php echo (int)$series->teacherid; ?>" <?php echo $canoperate ? '' : 'readonly'; ?> required></div>
                    <div><label class="pqlser-label" for="time-<?php echo (int)$series->id; ?>">Class Time</label><input class="pqlser-input" id="time-<?php echo (int)$series->id; ?>" name="start_time" type="time" value="<?php echo s(substr((string)$series->start_time, 0, 5)); ?>" required></div>
                    <div><label class="pqlser-label" for="lesson-<?php echo (int)$series->id; ?>">Lesson ID</label><input class="pqlser-input" id="lesson-<?php echo (int)$series->id; ?>" name="lessonid" value="<?php echo s((string)$series->lessonid); ?>" required></div>
                    <div><label class="pqlser-label" for="unit-<?php echo (int)$series->id; ?>">Unit ID</label><input class="pqlser-input" id="unit-<?php echo (int)$series->id; ?>" name="unitid" value="<?php echo s((string)$series->unitid); ?>" required></div>
                    <div><label class="pqlser-label" for="duration-<?php echo (int)$series->id; ?>">Minutes</label><input class="pqlser-input" id="duration-<?php echo (int)$series->id; ?>" name="duration_minutes" type="number" min="15" max="240" step="15" value="<?php echo (int)$series->duration_minutes; ?>" required></div>
                  </div>
                  <div style="margin-top:10px"><label class="pqlser-label" for="students-<?php echo (int)$series->id; ?>">Active Student IDs for Future Sessions</label><textarea class="pqlser-textarea" id="students-<?php echo (int)$series->id; ?>" name="studentids_raw" required><?php echo s(implode(', ', $studentids)); ?></textarea></div>
                  <p class="pqlser-meta">Saving updates the series and future sessions only. Completed and cancelled sessions keep their historical records.</p>
                  <div class="pqlser-actions pqh-workspace-actions"><button class="pqlser-btn" type="submit">Save series changes</button></div>
                </form>

                <?php if ($sessionsforseries): ?>
                  <div class="pqlser-session-list">
                    <?php foreach ($sessionsforseries as $session): ?>
                      <div class="pqlser-session">
                        <div>
                          <strong>#<?php echo (int)$session->series_sequence; ?> <?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?></strong>
                          <p class="pqlser-meta"><?php echo s((string)$session->status); ?></p>
                        </div>
                        <?php if ((int)$session->scheduled_start >= time() && !in_array((string)$session->status, ['completed', 'cancelled'], true)): ?>
                          <form method="post">
                            <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                            <input type="hidden" name="action" value="cancel_session">
                            <input type="hidden" name="seriesid" value="<?php echo (int)$series->id; ?>">
                            <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                            <input class="pqlser-input" name="reason" placeholder="Reason for this one session">
                            <button class="pqlser-btn pqlser-btn--danger" type="submit">Cancel this session</button>
                          </form>
                        <?php endif; ?>
                      </div>
                    <?php endforeach; ?>
                  </div>
                <?php endif; ?>

                <?php $communicationrows = $seriescommunications[(int)$series->id] ?? []; ?>
                <div class="pqlser-comm">
                  <h3>Recent Communication</h3>
                  <?php if (!$communicationrows): ?>
                    <p class="pqlser-meta">No recent series notifications found.</p>
                  <?php else: ?>
                    <?php foreach ($communicationrows as $comm): ?>
                      <div class="pqlser-comm-row">
                        <span><?php echo s(userdate((int)$comm->timecreated, get_string('strftimedatetimeshort'))); ?></span>
                        <span><?php echo s((string)$comm->action); ?><?php echo (string)$comm->details !== '' ? ' - ' . s(substr((string)$comm->details, 0, 140)) : ''; ?></span>
                        <span>#<?php echo (int)$comm->targetid; ?></span>
                      </div>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </div>

                <?php $ackinfo = $seriesacks[(int)$series->id] ?? null; ?>
                <?php if ($ackinfo): ?>
                  <div class="pqlser-ack <?php echo (int)$ackinfo['expected'] > 0 && (int)$ackinfo['pending'] === 0 ? 'pqlser-ack--ok' : ''; ?>">
                    <h3>Parent Acknowledgements</h3>
                    <?php if ((int)$ackinfo['expected'] === 0): ?>
                      <p class="pqlser-meta">No linked parent accounts found for acknowledgement tracking.</p>
                    <?php else: ?>
                      <p class="pqlser-meta">
                        <?php echo (int)$ackinfo['current']; ?> of <?php echo (int)$ackinfo['expected']; ?> linked parent receipt(s) acknowledged.
                        <?php if ((int)$ackinfo['latestack'] > 0): ?>
                          Latest acknowledgement: <?php echo s(userdate((int)$ackinfo['latestack'], get_string('strftimedatetimeshort'))); ?>.
                        <?php endif; ?>
                      </p>
                      <?php if ((int)$ackinfo['latestchange'] <= 0): ?>
                        <p class="pqlser-meta">No parent-visible schedule change has been recorded yet.</p>
                      <?php elseif ((int)$ackinfo['pending'] > 0): ?>
                        <form method="post" style="margin-top:10px">
                          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                          <input type="hidden" name="action" value="remind_ack">
                          <input type="hidden" name="seriesid" value="<?php echo (int)$series->id; ?>">
                          <button class="pqlser-btn pqlser-btn--light" type="submit">Send acknowledgement reminder</button>
                        </form>
                      <?php else: ?>
                        <p class="pqlser-meta">All linked parent receipts are current.</p>
                      <?php endif; ?>
                    <?php endif; ?>
                  </div>
                <?php else: ?>
                  <div class="pqlser-ack">
                    <h3>Parent Acknowledgements</h3>
                    <p class="pqlser-meta">Run the Phase 49 acknowledgement SQL to enable read receipts.</p>
                  </div>
                <?php endif; ?>

                <form method="post">
                  <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                  <input type="hidden" name="action" value="cancel_series">
                  <input type="hidden" name="seriesid" value="<?php echo (int)$series->id; ?>">
                  <div class="pqlser-field">
                    <input class="pqlser-input" name="reason" placeholder="Cancellation reason">
                    <button class="pqlser-btn pqlser-btn--danger" type="submit">Cancel future sessions</button>
                  </div>
                </form>
              <?php endif; ?>
            </article>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
