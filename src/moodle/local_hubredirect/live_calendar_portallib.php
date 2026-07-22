<?php
// Live-calendar query library — extracted VERBATIM from live_calendar.php
// (renamed pqlcal_ -> pqlcl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php and user/profile/lib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlcl_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqlcl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlcl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlcl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlcl_is_managed_student(int $userid): bool {
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

function pqlcl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || is_siteadmin($parentid)) {
        return $studentid > 0;
    }
    if (pqlcl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlcl_table_exists('local_prequran_comm_participant') && pqlcl_table_exists('local_prequran_comm_thread')) {
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

function pqlcl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlcl_table_exists('local_prequran_teacher_student')
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

function pqlcl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlcl_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlcl_has_teacher_role($teacherid) || !pqlcl_is_managed_student($studentid)) {
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

function pqlcl_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return $studentid > 0;
    }
    return pqlcl_parent_can_access_child($userid, $studentid) || pqlcl_teacher_can_access_student($userid, $studentid);
}

function pqlcl_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlcl_table_exists('local_prequran_comm_consent')) {
        foreach ($DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC') as $row) {
            $children[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    if (pqlcl_table_exists('local_prequran_comm_participant') && pqlcl_table_exists('local_prequran_comm_thread')) {
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
    return pqlcl_enrich_children(array_values(array_filter($children)));
}

function pqlcl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlcl_table_exists('local_prequran_teacher_student')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']) as $row) {
            $students[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    return pqlcl_enrich_children(array_values(array_filter($students)));
}

function pqlcl_enrich_children(array $studentids): array {
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

function pqlcl_sessions(int $studentid, int $fromtime, int $totime, int $limit = 120): array {
    global $DB;
    if (!pqlcl_table_exists('local_prequran_live_session') || !pqlcl_table_exists('local_prequran_live_participant')) {
        return [];
    }
    $seriesgroup = '';
    if (pqlcl_column_exists('local_prequran_live_session', 'seriesid')) {
        $seriesgroup .= ', s.seriesid';
    }
    if (pqlcl_column_exists('local_prequran_live_session', 'series_sequence')) {
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

function pqlcl_join_state($session): array {
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

function pqlcl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlcl_table_exists('local_prequran_live_audit')) {
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

function pqlcl_ics_escape(string $value): string {
    $value = str_replace("\\", "\\\\", $value);
    $value = str_replace(["\r\n", "\r", "\n"], "\\n", $value);
    return str_replace([',', ';'], ['\,', '\;'], $value);
}

function pqlcl_ics_token(string $value): string {
    $token = strtolower(trim($value));
    $token = preg_replace('/[^a-z0-9]+/', '-', $token) ?? '';
    $token = trim($token, '-');
    return $token !== '' ? $token : 'eduplatform';
}
