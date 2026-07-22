<?php
// Recurring live-class series schedule query/write library — extracted VERBATIM
// from local_hubredirect/live_series_schedule.php (the pqlps_* functions) for the
// token-gated portal endpoint. The legacy page keeps its inline copies and stays
// untouched (parallel-run). Every function below is a page-defined function copied
// without behavioural change; the shared helpers/globals it relies on (core_user,
// fullname, is_siteadmin, get_config, profile_user_record, MINSECS/DAYSECS, and
// the pqh_* access/design helpers used only by the page's HTML) live in Moodle
// core / user/profile/lib.php / accesslib.php and are NOT copied here.
// Requires: local/hubredirect/accesslib.php + user/profile/lib.php loaded first.
// Including this file produces no output.

defined('MOODLE_INTERNAL') || die();

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
