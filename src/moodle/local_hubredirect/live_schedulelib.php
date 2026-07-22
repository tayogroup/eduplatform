<?php
// Live-schedule query library — extracted VERBATIM from live_schedule.php
// (renamed pqlsch_ -> pqlschl_) for the token-gated portal endpoint. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlschl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlschl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlschl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlschl_valid_timezone(string $timezone): string {
    $timezone = trim($timezone);
    if ($timezone === '') {
        return 'Africa/Nairobi';
    }
    try {
        new DateTimeZone($timezone);
        return $timezone;
    } catch (Throwable $e) {
        return 'Africa/Nairobi';
    }
}

function pqlschl_format_session_datetime($session, int $timestamp): string {
    $timezone = pqlschl_valid_timezone((string)($session->timezone ?? ''));
    try {
        $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone($timezone));
        return $dt->format('d/m/y, H:i') . ' ' . $dt->format('T');
    } catch (Throwable $e) {
        return userdate($timestamp, get_string('strftimedatetimeshort'));
    }
}

function pqlschl_format_session_time($session, int $timestamp): string {
    $timezone = pqlschl_valid_timezone((string)($session->timezone ?? ''));
    try {
        $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone($timezone));
        return $dt->format('H:i') . ' ' . $dt->format('T');
    } catch (Throwable $e) {
        return userdate($timestamp, get_string('strftimetime'));
    }
}

function pqlschl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlschl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlschl_table_exists('local_prequran_comm_participant') && pqlschl_table_exists('local_prequran_comm_thread')) {
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

function pqlschl_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlschl_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    if (pqlschl_table_exists('local_prequran_comm_participant') && pqlschl_table_exists('local_prequran_comm_thread')) {
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
    return pqlschl_enrich_children(array_values($children));
}

function pqlschl_is_managed_student(int $userid): bool {
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

function pqlschl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlschl_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqlschl_table_exists('local_prequran_teacher_profile')
        && $DB->record_exists_select(
            'local_prequran_teacher_profile',
            "userid = ? AND (status IS NULL OR status = '' OR LOWER(status) NOT IN (?, ?, ?))",
            [$userid, 'archived', 'inactive', 'rejected']
        )) {
        return true;
    }
    if (pqlschl_table_exists('local_prequran_live_session')
        && $DB->record_exists('local_prequran_live_session', ['teacherid' => $userid])) {
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

function pqlschl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlschl_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlschl_has_teacher_role($teacherid) || !pqlschl_is_managed_student($studentid)) {
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

function pqlschl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlschl_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $students[$studentid] = $studentid;
            }
        }
    }
    return pqlschl_enrich_children(array_values($students));
}

function pqlschl_enrich_children(array $studentids): array {
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

function pqlschl_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlschl_parent_can_access_child($userid, $studentid) || pqlschl_teacher_can_access_student($userid, $studentid);
}

function pqlschl_sessions(int $studentid, int $fromtime, int $totime, int $limit = 20): array {
    global $DB;
    if (!pqlschl_table_exists('local_prequran_live_session') || !pqlschl_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $seriesgroup = '';
    if (pqlschl_column_exists('local_prequran_live_session', 'seriesid')) {
        $seriesgroup .= ', s.seriesid';
    }
    if (pqlschl_column_exists('local_prequran_live_session', 'series_sequence')) {
        $seriesgroup .= ', s.series_sequence';
    }
    $homeworkselect = pqlschl_column_exists('local_prequran_live_note', 'homework_unitid')
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

function pqlschl_teacher_sessions(int $teacherid, int $fromtime, int $totime, int $limit = 20): array {
    global $DB;
    if (!pqlschl_table_exists('local_prequran_live_session')) {
        return [];
    }
    $seriesselect = '';
    if (!pqlschl_column_exists('local_prequran_live_session', 'seriesid')) {
        $seriesselect .= ', 0 AS seriesid';
    }
    if (!pqlschl_column_exists('local_prequran_live_session', 'series_sequence')) {
        $seriesselect .= ', 0 AS series_sequence';
    }
    $recordingcount = pqlschl_table_exists('local_prequran_live_recording')
        ? "(SELECT COUNT(1)
              FROM {local_prequran_live_recording} r
             WHERE r.sessionid = s.id
               AND r.visible_to_parent = 1
               AND r.status = 'available')"
        : "0";

    return array_values($DB->get_records_sql(
        "SELECT s.*,
                NULL AS attendance_status,
                NULL AS participation_status,
                0 AS summary_visible,
                '' AS homework,
                '' AS homework_lessonid,
                '' AS homework_unitid,
                0 AS homework_due_date,
                'normal' AS homework_priority,
                {$recordingcount} AS visible_recordings
                {$seriesselect}
           FROM {local_prequran_live_session} s
          WHERE s.teacherid = :teacherid
            AND s.scheduled_start >= :fromtime
            AND s.scheduled_start < :totime
            AND s.status <> :cancelled
       ORDER BY s.scheduled_start ASC, s.id ASC",
        ['teacherid' => $teacherid, 'fromtime' => $fromtime, 'totime' => $totime, 'cancelled' => 'cancelled'],
        0,
        $limit
    ));
}

function pqlschl_join_state($session): array {
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
        return ['early', 'Opens ' . pqlschl_format_session_time($session, (int)$session->scheduled_start - $before)];
    }
    return ['closed', 'Join window closed'];
}

function pqlschl_recent_status_label($session, bool $isteacher): string {
    if (!$isteacher) {
        return (string)($session->attendance_status ?: 'attendance pending');
    }
    $status = strtolower(trim((string)$session->status));
    if (in_array($status, ['completed', 'cancelled', 'failed'], true)) {
        return str_replace('_', ' ', $status);
    }
    if (time() > (int)$session->scheduled_end) {
        return 'closed';
    }
    return $status !== '' ? str_replace('_', ' ', $status) : 'scheduled';
}
