<?php
// Workspace-sessions query/write library — extracted VERBATIM from
// local_hubredirect/workspace_sessions.php (the page-defined pqwls_* helpers)
// for the token-gated portal endpoint. The legacy page keeps its inline copies
// and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* helpers +
// pqh_attach_default_agenda_to_live_session live there, shared not copied).

defined('MOODLE_INTERNAL') || die();

function pqwls_table_fields(string $table, array $wanted): string {
    $fields = [];
    foreach ($wanted as $field) {
        if (pqh_table_has_field_safe($table, $field)) {
            $fields[] = $field;
        }
    }
    return $fields ? implode(',', $fields) : '*';
}

function pqwls_workspace_members(int $workspaceid, array $roles): array {
    global $DB;
    $members = [];
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
        $params['workspaceid'] = $workspaceid;
        $params['status'] = 'active';
        foreach ($DB->get_records_sql(
            "SELECT wm.id, wm.userid, wm.workspace_role, u.firstname, u.lastname, u.email, u.username
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE wm.workspaceid = :workspaceid
                AND wm.status = :status
                AND wm.workspace_role {$insql}
           ORDER BY u.lastname ASC, u.firstname ASC",
            $params
        ) as $row) {
            $members[(int)$row->userid] = $row;
        }
    }
    if (array_intersect($roles, ['owner', 'admin', 'teacher', 'assistant_teacher'])
            && pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'teacher_work_models')) {
        $params = ['workspaceid' => $workspaceid];
        $statussql = '';
        if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'status')) {
            $statussql = ' AND LOWER(tp.status) NOT IN (:archived, :inactive, :rejected)';
            $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        foreach ($DB->get_records_sql(
            "SELECT tp.id, tp.userid, 'teacher' AS workspace_role, u.firstname, u.lastname, u.email, u.username
               FROM {local_prequran_teacher_profile} tp
               JOIN {user} u ON u.id = tp.userid
              WHERE tp.workspaceid = :workspaceid
                AND LOWER(tp.teacher_work_models) LIKE '%independent%'
                {$statussql}
           ORDER BY u.lastname ASC, u.firstname ASC",
            $params
        ) as $row) {
            $members[(int)$row->userid] = $members[(int)$row->userid] ?? $row;
        }
    }
    uasort($members, static function($a, $b): int {
        return strcasecmp(trim((string)$a->lastname . ' ' . (string)$a->firstname), trim((string)$b->lastname . ' ' . (string)$b->firstname));
    });
    return array_values($members);
}

function pqwls_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwls_parse_datetime(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $timestamp = strtotime($value);
    return $timestamp ? (int)$timestamp : 0;
}

function pqwls_series_ready(): bool {
    return pqh_table_exists_safe('local_prequran_live_series')
        && pqh_table_has_field_safe('local_prequran_live_session', 'seriesid')
        && pqh_table_has_field_safe('local_prequran_live_session', 'series_sequence');
}

function pqwls_generate_weekly_starts(int $firststart, int $count): array {
    $count = max(1, min(52, $count));
    $starts = [];
    for ($i = 0; $i < $count; $i++) {
        $starts[] = $firststart + ($i * WEEKSECS);
    }
    return $starts;
}

function pqwls_insert_series(int $workspaceid, array $data, int $sessioncount): int {
    global $DB, $USER;
    if (!pqwls_series_ready()) {
        return 0;
    }
    $now = time();
    $columns = $DB->get_columns('local_prequran_live_series');
    $record = (object)[
        'workspaceid' => $workspaceid,
        'cohortid' => 0,
        'teacherid' => (int)$data['teacherid'],
        'title' => (string)$data['title'],
        'lessonid' => (string)$data['lessonid'],
        'unitid' => (string)$data['unitid'],
        'pattern' => 'weekly',
        'weekdays' => (string)date('N', (int)$data['start']),
        'start_time' => date('H:i', (int)$data['start']),
        'duration_minutes' => (int)$data['duration'],
        'date_start' => (int)$data['start'],
        'date_end' => (int)$data['start'] + (($sessioncount - 1) * WEEKSECS),
        'session_count' => $sessioncount,
        'status' => 'active',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    foreach (array_keys((array)$record) as $field) {
        if (!array_key_exists($field, $columns)) {
            unset($record->{$field});
        }
    }
    return (int)$DB->insert_record('local_prequran_live_series', $record);
}

function pqwls_insert_live_session(int $workspaceid, array $data, int $seriesid = 0, int $sequence = 0): int {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        return 0;
    }
    $now = time();
    $record = (object)[
        'workspaceid' => $workspaceid,
        'seriesid' => $seriesid,
        'series_sequence' => $sequence,
        'cohortid' => 0,
        'teacherid' => (int)$data['teacherid'],
        'session_type' => 'teacher_led',
        'teacher_required' => 1,
        'report_to_teacherid' => (int)$data['teacherid'],
        'lessonid' => (string)$data['lessonid'],
        'unitid' => (string)$data['unitid'],
        'title' => (string)$data['title'],
        'description' => (string)$data['description'],
        'scheduled_start' => (int)$data['start'],
        'scheduled_end' => (int)$data['end'],
        'timezone' => core_date::get_user_timezone(),
        'status' => 'scheduled',
        'qa_status' => 'not_reviewed',
        'qa_score' => 0,
        'qa_checklist' => '',
        'qa_notes' => '',
        'qa_coaching_notes' => '',
        'qa_reviewedby' => 0,
        'qa_reviewedat' => 0,
        'qa_coaching_status' => 'none',
        'qa_coaching_priority' => 'normal',
        'qa_coaching_due_date' => 0,
        'qa_coaching_ackby' => 0,
        'qa_coaching_ackat' => 0,
        'qa_coaching_completedby' => 0,
        'qa_coaching_completedat' => 0,
        'leadership_review_status' => 'none',
        'leadership_review_reason' => '',
        'leadership_review_notes' => '',
        'leadership_reviewby' => 0,
        'leadership_reviewat' => 0,
        'leadership_clearedby' => 0,
        'leadership_clearedat' => 0,
        'improvement_plan_status' => 'none',
        'improvement_plan_goals' => '',
        'improvement_plan_actions' => '',
        'improvement_plan_due_date' => 0,
        'improvement_plan_priority' => 'normal',
        'improvement_plan_mentorid' => 0,
        'improvement_plan_assignedby' => 0,
        'improvement_plan_assignedat' => 0,
        'improvement_plan_ackby' => 0,
        'improvement_plan_ackat' => 0,
        'improvement_plan_completedby' => 0,
        'improvement_plan_completedat' => 0,
        'improvement_plan_completion_notes' => '',
        'recording_enabled' => 1,
        'recording_consent_required' => 1,
        'parent_observer_allowed' => 0,
        'max_participants' => 12,
        'bbb_meeting_id' => '',
        'bbb_internal_meeting_id' => '',
        'bbb_created' => 0,
        'bbb_create_time' => 0,
        'bbb_last_error' => '',
        'createdby' => (int)$USER->id,
        'cancelledby' => 0,
        'cancellation_reason' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $columns = $DB->get_columns('local_prequran_live_session');
    foreach (array_keys((array)$record) as $field) {
        if (!array_key_exists($field, $columns)) {
            unset($record->{$field});
        }
    }
    $sessionid = (int)$DB->insert_record('local_prequran_live_session', $record);
    if (array_key_exists('bbb_meeting_id', $columns)) {
        $DB->set_field('local_prequran_live_session', 'bbb_meeting_id', 'prequran-live-' . $sessionid, ['id' => $sessionid]);
    }
    try {
        pqh_attach_default_agenda_to_live_session($sessionid, (int)$USER->id);
    } catch (Throwable $e) {
        debugging('Could not auto-attach live-session agenda slides for session ' . $sessionid . ': ' . $e->getMessage(), DEBUG_DEVELOPER);
    }
    return $sessionid;
}

function pqwls_insert_participants(int $workspaceid, int $sessionid, array $studentids): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_participant')) {
        return;
    }
    $columns = $DB->get_columns('local_prequran_live_participant');
    $now = time();
    foreach ($studentids as $studentid) {
        $studentid = (int)$studentid;
        if ($studentid <= 0) {
            continue;
        }
        $record = (object)[
            'workspaceid' => $workspaceid,
            'sessionid' => $sessionid,
            'userid' => $studentid,
            'role' => 'student',
            'studentid' => $studentid,
            'status' => 'active',
            'displayname' => pqwls_user_name($studentid),
            'invitedby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        foreach (array_keys((array)$record) as $field) {
            if (!array_key_exists($field, $columns)) {
                unset($record->{$field});
            }
        }
        if (!$DB->record_exists('local_prequran_live_participant', ['sessionid' => $sessionid, 'userid' => $studentid, 'role' => 'student'])) {
            $DB->insert_record('local_prequran_live_participant', $record);
        }
    }
}

function pqwls_sessions(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_session')) {
        return [];
    }
    $params = ['workspaceid' => $workspaceid];
    $where = pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid') ? 'workspaceid = :workspaceid' : '1 = 0';
    return array_values($DB->get_records_select(
        'local_prequran_live_session',
        $where,
        $params,
        'scheduled_start DESC',
        pqwls_table_fields('local_prequran_live_session', ['id', 'seriesid', 'series_sequence', 'title', 'teacherid', 'lessonid', 'unitid', 'scheduled_start', 'scheduled_end', 'timezone', 'status', 'session_type']),
        0,
        30
    ));
}
