<?php
// Live-summaries query library — extracted VERBATIM from live_summaries.php
// (renamed pqls_ -> pqlsl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlsl_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(pqlsl_url('/local/hubredirect/live_summaries.php', $urlparams, $childid > 0 ? ['childid' => $childid] : []));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Session Summaries');
$PAGE->set_heading('Live Session Summaries');
$PAGE->add_body_class('pqh-live-summaries-page');

function pqlsl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlsl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlsl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlsl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlsl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlsl_table_exists('local_prequran_comm_participant') && pqlsl_table_exists('local_prequran_comm_thread')) {
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

function pqlsl_parent_children(int $parentid): array {
    global $DB;
    $children = [];

    if (pqlsl_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }

    if (pqlsl_table_exists('local_prequran_comm_participant') && pqlsl_table_exists('local_prequran_comm_thread')) {
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

    return pqlsl_enrich_children(array_values($children));
}

function pqlsl_is_managed_student(int $userid): bool {
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

function pqlsl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlsl_table_exists('local_prequran_teacher_student')
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

function pqlsl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }

    if (pqlsl_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', [
            'teacherid' => $teacherid,
            'status' => 'active',
        ]);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', [
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'status' => 'active',
            ]);
        }
    }

    if (!pqlsl_has_teacher_role($teacherid) || !pqlsl_is_managed_student($studentid)) {
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

function pqlsl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicit = false;

    if (pqlsl_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicit = true;
                $students[$studentid] = $studentid;
            }
        }
    }

    if (!$explicit && pqlsl_has_teacher_role($teacherid)) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $members = $DB->get_records('cohort_members', ['cohortid' => (int)$membership->cohortid], '', 'userid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pqlsl_is_managed_student($studentid)) {
                    $students[$studentid] = $studentid;
                }
            }
        }
    }

    return pqlsl_enrich_children(array_values($students));
}

function pqlsl_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = [
            'studentid' => $studentid,
            'name' => $user ? fullname($user) : 'Student ' . $studentid,
        ];
    }
    usort($children, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlsl_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid)) {
        return true;
    }
    if ($userid === $studentid) {
        return true;
    }
    return pqlsl_parent_can_access_child($userid, $studentid) || pqlsl_teacher_can_access_student($userid, $studentid);
}

function pqlsl_clean_text(string $value, int $max = 1000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlsl_audit(int $sessionid, int $studentid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqlsl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'student',
        'targetid' => $studentid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlsl_focus_summary(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'hasdata' => false,
        'active_ms' => 0,
        'idle_count' => 0,
        'leave_count' => 0,
        'current_step' => '',
        'last_time' => 0,
    ];
    if (!pqlsl_table_exists('local_prequran_focusagg')
        || !pqlsl_column_exists('local_prequran_focusagg', 'live_sessionid')) {
        return $summary;
    }
    $summary['ready'] = true;
    $row = $DB->get_record_sql(
        "SELECT COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                COALESCE(SUM(leave_count), 0) AS leave_count,
                MAX(last_time) AS last_time
           FROM {local_prequran_focusagg}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['leave_count'] = (int)$row->leave_count;
        $summary['last_time'] = (int)$row->last_time;
        $summary['hasdata'] = $summary['active_ms'] > 0 || $summary['idle_count'] > 0 || $summary['leave_count'] > 0 || $summary['last_time'] > 0;
    }
    $latest = $DB->get_record_sql(
        "SELECT step_id, unitid, last_time
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

function pqlsl_practice_coach_summary(int $studentid, int $sessionid): array {
    global $DB;
    $summary = [
        'ready' => false,
        'hasdata' => false,
        'count' => 0,
        'idle' => 0,
        'away' => 0,
        'latest_message' => '',
        'latest_recommendation' => '',
        'latest_time' => 0,
    ];
    if (!pqlsl_table_exists('local_prequran_practice_coach_event')) {
        return $summary;
    }
    $summary['ready'] = true;
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS coach_count,
                SUM(CASE WHEN trigger_key = 'idle_nudge' THEN 1 ELSE 0 END) AS idle_count,
                SUM(CASE WHEN trigger_key IN ('screen_return', 'focus_return') THEN 1 ELSE 0 END) AS away_count,
                MAX(timecreated) AS latest_time
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid",
        ['userid' => $studentid, 'sessionid' => $sessionid]
    );
    if ($row) {
        $summary['count'] = (int)$row->coach_count;
        $summary['idle'] = (int)$row->idle_count;
        $summary['away'] = (int)$row->away_count;
        $summary['latest_time'] = (int)$row->latest_time;
        $summary['hasdata'] = $summary['count'] > 0;
    }
    $recommendationselect = pqlsl_column_exists('local_prequran_practice_coach_event', 'recommendation_message')
        ? 'recommendation_message,'
        : "'' AS recommendation_message,";
    $latest = $DB->get_record_sql(
        "SELECT message, {$recommendationselect} timecreated
           FROM {local_prequran_practice_coach_event}
          WHERE userid = :userid
            AND live_sessionid = :sessionid
       ORDER BY timecreated DESC, id DESC",
        ['userid' => $studentid, 'sessionid' => $sessionid],
        IGNORE_MULTIPLE
    );
    if ($latest) {
        $summary['latest_message'] = (string)$latest->message;
        $summary['latest_recommendation'] = (string)($latest->recommendation_message ?? '');
        $summary['latest_time'] = (int)$latest->timecreated;
    }
    return $summary;
}

function pqlsl_format_minutes(int $ms): string {
    return (int)round($ms / 60000) . ' min';
}

function pqlsl_step_label(string $stepid): string {
    $stepid = trim($stepid);
    if ($stepid === '') {
        return 'Not recorded';
    }
    return ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqlsl_public_summaries(int $studentid): array {
    global $DB;
    if (!pqlsl_table_exists('local_prequran_live_note')
        || !pqlsl_table_exists('local_prequran_live_session')) {
        return [];
    }

    $homeworkselect = pqlsl_column_exists('local_prequran_live_note', 'homework_unitid')
        ? "n.homework_lessonid, n.homework_unitid, n.homework_due_date, n.homework_priority,"
        : "'' AS homework_lessonid, '' AS homework_unitid, 0 AS homework_due_date, 'normal' AS homework_priority,";
    $followupselect = pqlsl_column_exists('local_prequran_live_note', 'followup_status')
        ? "n.followup_status, n.followup_message, n.followup_resolved,"
        : "'none' AS followup_status, '' AS followup_message, 0 AS followup_resolved,";
    $parentresponseselect = pqlsl_column_exists('local_prequran_live_note', 'parent_response_status')
        ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
        : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
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
                s.lessonid,
                s.unitid,
                s.scheduled_start,
                s.scheduled_end,
                s.status,
                a.attendance_status,
                a.participation_status,
                a.technical_issue
           FROM {local_prequran_live_note} n
           JOIN {local_prequran_live_session} s ON s.id = n.sessionid
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = n.sessionid AND a.studentid = n.studentid
          WHERE n.studentid = :studentid
            AND n.visible_to_parent = 1
       ORDER BY s.scheduled_start DESC, n.timemodified DESC",
        ['studentid' => $studentid]
    ));
}
