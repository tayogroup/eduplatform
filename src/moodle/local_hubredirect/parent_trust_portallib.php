<?php
// Parent-trust query library — extracted VERBATIM from live_parent_trust.php
// (renamed pqlpt_ -> pqlptl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php and user/profile/lib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlptl_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqlptl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlptl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlptl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlptl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlptl_table_exists('local_prequran_comm_participant') && pqlptl_table_exists('local_prequran_comm_thread')) {
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

function pqlptl_is_managed_student(int $userid): bool {
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

function pqlptl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlptl_table_exists('local_prequran_teacher_student')
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

function pqlptl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlptl_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlptl_has_teacher_role($teacherid) || !pqlptl_is_managed_student($studentid)) {
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

function pqlptl_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlptl_parent_can_access_child($userid, $studentid) || pqlptl_teacher_can_access_student($userid, $studentid);
}

function pqlptl_enrich_children(array $studentids): array {
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

function pqlptl_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlptl_table_exists('local_prequran_comm_consent')) {
        foreach ($DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC') as $row) {
            if ((int)$row->studentid > 0) {
                $children[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    if (pqlptl_table_exists('local_prequran_comm_participant') && pqlptl_table_exists('local_prequran_comm_thread')) {
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
    return pqlptl_enrich_children(array_values($children));
}

function pqlptl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    if (pqlptl_table_exists('local_prequran_teacher_student')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']) as $row) {
            if ((int)$row->studentid > 0) {
                $students[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    return pqlptl_enrich_children(array_values($students));
}

function pqlptl_join_state($session): array {
    $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
    $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
    $now = time();
    $open = $now >= ((int)$session->scheduled_start - $before) && $now <= ((int)$session->scheduled_start + $after);
    if ((string)$session->status === 'cancelled') {
        return ['cancelled', 'Cancelled'];
    }
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

function pqlptl_upcoming_sessions(int $studentid, int $limit = 5): array {
    global $DB;
    if (!pqlptl_table_exists('local_prequran_live_session') || !pqlptl_table_exists('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT s.*,
                a.attendance_status,
                n.visible_to_parent AS summary_visible,
                n.homework,
                (SELECT COUNT(1)
                   FROM {local_prequran_live_recording} r
                  WHERE r.sessionid = s.id
                    AND r.visible_to_parent = 1
                    AND r.status = 'available') AS visible_recordings
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
      LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND s.scheduled_start >= :nowtime
            AND s.status <> :cancelled
       ORDER BY s.scheduled_start ASC, s.id ASC",
        [
            'studentid' => $studentid,
            'role' => 'student',
            'participantstatus' => 'active',
            'nowtime' => time() - HOURSECS,
            'cancelled' => 'cancelled',
        ],
        0,
        $limit
    ));
}

function pqlptl_public_summaries(int $studentid, int $limit = 4): array {
    global $DB;
    if (!pqlptl_table_exists('local_prequran_live_note') || !pqlptl_table_exists('local_prequran_live_session')) {
        return [];
    }
    $followupselect = pqlptl_column_exists('local_prequran_live_note', 'followup_status')
        ? "n.followup_status, n.followup_message, n.followup_resolved,"
        : "'none' AS followup_status, '' AS followup_message, 0 AS followup_resolved,";
    $parentresponseselect = pqlptl_column_exists('local_prequran_live_note', 'parent_response_status')
        ? "n.parent_response_status, n.parent_responseat,"
        : "'none' AS parent_response_status, 0 AS parent_responseat,";
    $homeworkselect = pqlptl_column_exists('local_prequran_live_note', 'homework_unitid')
        ? "n.homework_lessonid, n.homework_unitid, n.homework_due_date, n.homework_priority,"
        : "'' AS homework_lessonid, '' AS homework_unitid, 0 AS homework_due_date, 'normal' AS homework_priority,";

    return array_values($DB->get_records_sql(
        "SELECT n.id,
                n.sessionid,
                n.studentid,
                n.teacherid,
                n.strengths,
                n.needs_practice,
                n.homework,
                {$homeworkselect}
                {$followupselect}
                {$parentresponseselect}
                n.parent_summary,
                n.timemodified,
                s.title,
                s.scheduled_start,
                s.scheduled_end,
                s.lessonid,
                s.unitid,
                a.attendance_status,
                a.participation_status
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = n.sessionid AND a.studentid = n.studentid
          WHERE n.studentid = :studentid
            AND n.visible_to_parent = 1
       ORDER BY s.scheduled_start DESC, n.timemodified DESC",
        ['studentid' => $studentid],
        0,
        $limit
    ));
}

function pqlptl_focus_summary(int $studentid, int $sessionid): array {
    global $DB;
    $summary = ['hasdata' => false, 'active_ms' => 0, 'idle_count' => 0, 'last_time' => 0, 'current_step' => ''];
    if (!pqlptl_table_exists('local_prequran_focusagg')
        || !pqlptl_column_exists('local_prequran_focusagg', 'live_sessionid')) {
        return $summary;
    }
    $row = $DB->get_record_sql(
        "SELECT COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                MAX(last_time) AS last_time
           FROM {local_prequran_focusagg}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['last_time'] = (int)$row->last_time;
        $summary['hasdata'] = $summary['active_ms'] > 0 || $summary['idle_count'] > 0 || $summary['last_time'] > 0;
    }
    $latest = $DB->get_record_sql(
        "SELECT step_id, unitid
           FROM {local_prequran_focusagg}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY last_time DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        IGNORE_MULTIPLE
    );
    if ($latest) {
        $summary['current_step'] = (string)($latest->step_id ?: $latest->unitid ?: '');
    }
    return $summary;
}

function pqlptl_focus_minutes(int $ms): string {
    return (int)round($ms / 60000) . ' min';
}

function pqlptl_focus_step_label(string $stepid): string {
    $stepid = trim($stepid);
    return $stepid === '' ? 'Not recorded' : ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqlptl_visible_recordings(int $studentid, int $limit = 3): array {
    global $DB;
    if (!pqlptl_table_exists('local_prequran_live_recording')
        || !pqlptl_table_exists('local_prequran_live_session')
        || !pqlptl_table_exists('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT r.id,
                r.sessionid,
                r.playback_url,
                r.playback_format,
                r.duration_minutes,
                r.expiresat,
                s.title AS session_title,
                s.scheduled_start,
                s.teacherid
           FROM {local_prequran_live_recording} r
           JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND r.visible_to_parent = 1
            AND r.status = :recordingstatus
            AND (r.expiresat = 0 OR r.expiresat > :nowtime)
       ORDER BY s.scheduled_start DESC, r.id DESC",
        [
            'studentid' => $studentid,
            'role' => 'student',
            'participantstatus' => 'active',
            'recordingstatus' => 'available',
            'nowtime' => time(),
        ],
        0,
        $limit
    ));
}

function pqlptl_series_rows(int $studentid): array {
    global $DB;
    if (!pqlptl_table_exists('local_prequran_live_series')
        || !pqlptl_table_exists('local_prequran_live_session')
        || !pqlptl_table_exists('local_prequran_live_participant')
        || !pqlptl_column_exists('local_prequran_live_session', 'seriesid')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT DISTINCT se.*
           FROM {local_prequran_live_series} se
           JOIN {local_prequran_live_session} s ON s.seriesid = se.id
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND se.status <> :cancelled
       ORDER BY se.date_start DESC, se.id DESC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active', 'cancelled' => 'cancelled']
    ));
}

function pqlptl_latest_series_change(int $seriesid): int {
    global $DB;
    if (!pqlptl_table_exists('local_prequran_live_audit')) {
        return 0;
    }
    return (int)$DB->get_field_sql(
        "SELECT MAX(timecreated)
           FROM {local_prequran_live_audit}
          WHERE targettype = :targettype
            AND targetid = :targetid
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
        ['targettype' => 'series', 'targetid' => $seriesid]
    );
}

function pqlptl_ack_record(int $seriesid, int $studentid, int $parentid) {
    global $DB;
    if (!pqlptl_table_exists('local_prequran_live_ack')) {
        return false;
    }
    return $DB->get_record('local_prequran_live_ack', ['seriesid' => $seriesid, 'studentid' => $studentid, 'parentid' => $parentid], '*', IGNORE_MISSING);
}

function pqlptl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlptl_table_exists('local_prequran_live_audit')) {
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

function pqlptl_staff_can_preview_child(int $userid, int $studentid): bool {
    return $studentid > 0 && (is_siteadmin($userid) || pqlptl_teacher_can_access_student($userid, $studentid));
}

function pqlptl_linked_parents(int $studentid): array {
    global $DB;
    $parentids = [];
    if ($studentid <= 0) {
        return [];
    }
    if (pqlptl_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['studentid' => $studentid]);
        foreach ($rows as $row) {
            if ((int)$row->guardianid > 0) {
                $parentids[(int)$row->guardianid] = (int)$row->guardianid;
            }
        }
    }
    if (pqlptl_table_exists('local_prequran_comm_participant') && pqlptl_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT p.userid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE t.studentid = :studentid
                AND p.role = :role",
            ['studentid' => $studentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            if ((int)$row->userid > 0) {
                $parentids[(int)$row->userid] = (int)$row->userid;
            }
        }
    }

    $parents = [];
    foreach ($parentids as $parentid) {
        $user = core_user::get_user($parentid);
        $parents[] = [
            'userid' => $parentid,
            'name' => $user ? fullname($user) : 'Parent ' . $parentid,
            'email' => $user && !empty($user->email) ? (string)$user->email : '',
        ];
    }
    usort($parents, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $parents;
}

function pqlptl_pending_ack_count(int $studentid): int {
    $parents = pqlptl_linked_parents($studentid);
    $parentids = array_map(static function(array $parent): int {
        return (int)$parent['userid'];
    }, $parents);
    $pending = 0;
    foreach (pqlptl_series_rows($studentid) as $series) {
        $latestchange = pqlptl_latest_series_change((int)$series->id);
        if ($latestchange <= 0) {
            continue;
        }
        if (!$parentids) {
            $pending++;
            continue;
        }
        foreach ($parentids as $parentid) {
            $ack = pqlptl_ack_record((int)$series->id, $studentid, $parentid);
            if (!$ack || (string)$ack->ack_status !== 'acknowledged' || (int)$ack->acknowledgedat < $latestchange) {
                $pending++;
            }
        }
    }
    return $pending;
}

function pqlptl_support_missing_items(): array {
    $missing = [];
    $tables = [
        'local_prequran_live_session',
        'local_prequran_live_participant',
        'local_prequran_live_attendance',
        'local_prequran_live_note',
        'local_prequran_live_recording',
        'local_prequran_live_series',
        'local_prequran_live_ack',
        'local_prequran_live_audit',
    ];
    foreach ($tables as $table) {
        if (!pqlptl_table_exists($table)) {
            $missing[] = 'Missing table: ' . $table;
        }
    }
    $columns = [
        'local_prequran_live_session' => ['seriesid', 'status', 'bbb_created'],
        'local_prequran_live_note' => ['visible_to_parent', 'followup_status', 'parent_response_status', 'homework_unitid'],
        'local_prequran_live_recording' => ['visible_to_parent', 'status', 'expiresat'],
        'local_prequran_live_ack' => ['ack_status', 'acknowledgedat', 'lastchangeat'],
    ];
    foreach ($columns as $table => $tablecolumns) {
        foreach ($tablecolumns as $column) {
            if (!pqlptl_column_exists($table, $column)) {
                $missing[] = 'Missing column: ' . $table . '.' . $column;
            }
        }
    }
    return $missing;
}

function pqlptl_recent_staff_preview_audit_exists(int $studentid): bool {
    global $DB, $USER;
    if (!pqlptl_table_exists('local_prequran_live_audit')) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {local_prequran_live_audit}
          WHERE actorid = :actorid
            AND action = :action
            AND targettype = :targettype
            AND targetid = :targetid
            AND timecreated >= :mintime",
        [
            'actorid' => (int)$USER->id,
            'action' => 'parent_trust_preview_opened',
            'targettype' => 'student',
            'targetid' => $studentid,
            'mintime' => time() - HOURSECS,
        ]
    );
}

function pqlptl_support_reason_options(): array {
    return [
        'parent_support_request' => 'Parent support request',
        'scheduling_issue' => 'Scheduling issue',
        'recording_summary_question' => 'Recording or summary question',
        'technical_support' => 'Technical support',
        'safety_privacy_review' => 'Safety/privacy review',
        'other' => 'Other',
    ];
}
