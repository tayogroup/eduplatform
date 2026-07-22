<?php
// Live-class-series query library — extracted VERBATIM from live_series.php
// (renamed pqlser_ -> pqlserl_) for the token-gated portal endpoint. The legacy
// page (local_hubredirect/live_series.php) keeps its inline copies and stays
// untouched (parallel-run). ONLY the functions the legacy page defines itself
// live here; shared helpers (pqh_*, local_prequran_*) are required by the
// handler, not copied. Zero top-level code besides the guard.
// Requires: local/hubredirect/accesslib.php and
//           local/prequran/notificationlib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlserl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlserl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlserl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlserl_ready(): bool {
    return pqlserl_table_exists('local_prequran_live_series')
        && pqlserl_table_exists('local_prequran_live_session')
        && pqlserl_table_exists('local_prequran_live_audit')
        && pqlserl_column_exists('local_prequran_live_session', 'seriesid');
}

function pqlserl_is_managed_student(int $userid): bool {
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

function pqlserl_is_teacher(int $userid): bool {
    global $DB, $USER;
    if (is_siteadmin($userid) || ((int)$USER->id === $userid && is_siteadmin($USER)) || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if (pqh_user_can_create_live_sessions($userid)) {
        return true;
    }
    if (pqlserl_table_exists('local_prequran_teacher_student')
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

function pqlserl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlserl_table_exists('local_prequran_live_audit')) {
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

function pqlserl_parse_students(string $raw): array {
    $parts = preg_split('/[\s,;]+/', trim($raw), -1, PREG_SPLIT_NO_EMPTY);
    return array_values(array_unique(array_filter(array_map('intval', $parts ?: []))));
}

function pqlserl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlserl_series_studentids(int $seriesid): array {
    global $DB;
    if (!pqlserl_table_exists('local_prequran_live_participant')) {
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

function pqlserl_sync_session_participants($session, int $teacherid, array $studentids): array {
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

function pqlserl_first_future_sessionid(int $seriesid): int {
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

function pqlserl_notify_teacher(int $seriesid, int $teacherid, string $subject, string $message, string $eventtype): bool {
    if ($teacherid <= 0) {
        return false;
    }
    $sessionid = pqlserl_first_future_sessionid($seriesid);
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

function pqlserl_notify_parents(int $seriesid, array $studentids, string $subject, string $message, string $eventtype): int {
    $sent = 0;
    $sessionid = pqlserl_first_future_sessionid($seriesid);
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

function pqlserl_change_summary(array $old, array $new): array {
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

function pqlserl_ack_ready(): bool {
    return pqlserl_table_exists('local_prequran_live_ack');
}

function pqlserl_latest_change_time(int $seriesid): int {
    global $DB;
    if (!pqlserl_table_exists('local_prequran_live_audit')) {
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

function pqlserl_ack_current(int $seriesid, int $studentid, int $parentid, int $latestchange): bool {
    global $DB;
    if (!pqlserl_ack_ready() || $latestchange <= 0) {
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
