<?php
// Live follow-up message library — extracted VERBATIM from
// live_followup_message.php (the page already prefixes its own helpers pqlfm_,
// grep-confirmed unique) for the token-gated portal endpoint. The legacy page
// keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php and user/profile/lib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlfm_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlfm_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlfm_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlfm_clean(string $value, int $max = 1000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlfm_is_managed_student(int $userid): bool {
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

function pqlfm_guardian_ids(int $studentid): array {
    global $DB;
    $ids = [];
    if (pqlfm_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['studentid' => $studentid], 'guardianid ASC');
        foreach ($rows as $row) {
            $guardianid = (int)$row->guardianid;
            if ($guardianid > 0 && $guardianid !== $studentid && !pqlfm_is_managed_student($guardianid)) {
                $ids[$guardianid] = $guardianid;
            }
        }
    }
    if (pqlfm_table_exists('local_prequran_live_consent')) {
        $rows = $DB->get_records('local_prequran_live_consent', ['studentid' => $studentid], 'guardianid ASC');
        foreach ($rows as $row) {
            $guardianid = (int)$row->guardianid;
            if ($guardianid > 0 && $guardianid !== $studentid && !pqlfm_is_managed_student($guardianid)) {
                $ids[$guardianid] = $guardianid;
            }
        }
    }
    if (pqlfm_table_exists('local_prequran_comm_thread') && pqlfm_table_exists('local_prequran_comm_participant')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT p.userid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE t.studentid = :studentid
                AND t.type = :type
                AND p.role = :role",
            ['studentid' => $studentid, 'type' => 'parent_teacher', 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $guardianid = (int)$row->userid;
            if ($guardianid > 0 && $guardianid !== $studentid && !pqlfm_is_managed_student($guardianid)) {
                $ids[$guardianid] = $guardianid;
            }
        }
    }
    return array_values($ids);
}

function pqlfm_is_guardian(int $userid, int $studentid): bool {
    return in_array($userid, pqlfm_guardian_ids($studentid), true);
}

function pqlfm_user_can_link($session, int $studentid): bool {
    global $DB, $USER;
    $userid = (int)$USER->id;
    if (is_siteadmin($USER)) {
        return true;
    }
    if (pqlfm_column_exists('local_prequran_live_session', 'workspaceid')
            && (int)($session->workspaceid ?? 0) > 0
            && pqh_user_can_manage_workspace($userid, (int)$session->workspaceid)) {
        return true;
    }
    if ((int)$session->teacherid === $userid) {
        return true;
    }
    if (pqlfm_is_guardian($userid, $studentid)) {
        return true;
    }
    if (pqlfm_table_exists('local_prequran_live_participant')) {
        return $DB->record_exists('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'userid' => $userid,
            'role' => 'teacher',
            'status' => 'active',
        ]);
    }
    return false;
}

function pqlfm_student_cohort(int $studentid, int $preferreduserid = 0): int {
    global $DB;
    if ($preferreduserid > 0) {
        $row = $DB->get_record_sql(
            "SELECT cm.cohortid
               FROM {cohort_members} cm
               JOIN {cohort_members} pm ON pm.cohortid = cm.cohortid
              WHERE cm.userid = :studentid
                AND pm.userid = :preferred
           ORDER BY cm.cohortid ASC",
            ['studentid' => $studentid, 'preferred' => $preferreduserid],
            IGNORE_MULTIPLE
        );
        if ($row) {
            return (int)$row->cohortid;
        }
    }
    $row = $DB->get_record_sql(
        "SELECT cohortid
           FROM {cohort_members}
          WHERE userid = :studentid
       ORDER BY id ASC",
        ['studentid' => $studentid],
        IGNORE_MULTIPLE
    );
    return $row ? (int)$row->cohortid : 0;
}

function pqlfm_audit_live(int $sessionid, string $action, int $targetid, array $details): void {
    global $DB, $USER;
    if (!pqlfm_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'student',
        'targetid' => $targetid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqlfm_upsert_participant(int $threadid, int $userid, string $role, int $lastreadmessageid = 0): void {
    global $DB;
    if ($userid <= 0) {
        return;
    }
    $now = time();
    $participant = $DB->get_record('local_prequran_comm_participant', ['threadid' => $threadid, 'userid' => $userid]);
    if ($participant) {
        $participant->role = (string)$participant->role !== '' ? (string)$participant->role : $role;
        $participant->canreply = 1;
        if ($lastreadmessageid > 0 && (int)$participant->lastreadmessageid < $lastreadmessageid) {
            $participant->lastreadmessageid = $lastreadmessageid;
        }
        $participant->timemodified = $now;
        $DB->update_record('local_prequran_comm_participant', $participant);
        return;
    }
    $DB->insert_record('local_prequran_comm_participant', (object)[
        'threadid' => $threadid,
        'userid' => $userid,
        'role' => $role,
        'canreply' => 1,
        'lastreadmessageid' => $lastreadmessageid,
        'muted' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqlfm_find_existing_thread(int $cohortid, int $studentid, int $teacherid, array $guardianids): int {
    global $DB;
    if (!$guardianids) {
        return 0;
    }
    [$insql, $params] = $DB->get_in_or_equal($guardianids, SQL_PARAMS_NAMED, 'g');
    $params['studentid'] = $studentid;
    $params['type'] = 'parent_teacher';
    $params['active'] = 'active';
    $params['teacherid'] = $teacherid;
    $row = $DB->get_record_sql(
        "SELECT t.id
           FROM {local_prequran_comm_thread} t
           JOIN {local_prequran_comm_participant} tp ON tp.threadid = t.id AND tp.userid = :teacherid
           JOIN {local_prequran_comm_participant} pp ON pp.threadid = t.id AND pp.userid {$insql}
          WHERE t.studentid = :studentid
            AND t.type = :type
            AND t.status = :active
            AND (:cohortid = 0 OR t.cohortid = :cohortid2)
       ORDER BY t.timemodified DESC, t.id DESC",
        $params + ['cohortid' => $cohortid, 'cohortid2' => $cohortid],
        IGNORE_MULTIPLE
    );
    return $row ? (int)$row->id : 0;
}

function pqlfm_followup_body($session, $note, int $studentid, string $studentname, string $brandname): string {
    $parts = [
        'Live class follow-up for ' . $studentname . '.',
        'Session: ' . (string)$session->title,
        'Date: ' . userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')),
        'Status: ' . str_replace('_', ' ', (string)($note->followup_status ?? 'follow-up')),
    ];
    $message = trim((string)($note->followup_message ?? ''));
    if ($message !== '') {
        $parts[] = 'Teacher follow-up: ' . $message;
    }
    $homework = trim((string)($note->homework ?? ''));
    if ($homework !== '') {
        $parts[] = 'Homework: ' . $homework;
    }
    $unit = trim((string)($note->homework_unitid ?? ''));
    if ($unit !== '') {
        $parts[] = 'Homework unit: ' . $unit;
    }
    $parts[] = 'Please reply here so the follow-up stays inside ' . $brandname . '.';
    return pqlfm_clean(implode("\n", $parts), 1000);
}
