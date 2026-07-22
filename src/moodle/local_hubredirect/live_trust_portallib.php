<?php
// Live-trust query library — extracted VERBATIM from live_trust.php (the
// admin/staff live-class Trust Center; renamed pqlt_ -> pqltl_) for the
// token-gated portal endpoint. The legacy page keeps its inline copies and
// stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php and user/profile/lib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqltl_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqltl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltl_table_has_field(string $table, string $field): bool {
    global $DB;
    return pqltl_table_exists($table) && $DB->get_manager()->field_exists($table, $field);
}

function pqltl_apply_record_fields(string $table, stdClass $record, array $values): stdClass {
    foreach ($values as $field => $value) {
        if (pqltl_table_has_field($table, $field)) {
            $record->{$field} = $value;
        }
    }
    return $record;
}

function pqltl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqltl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqltl_table_exists('local_prequran_comm_participant') && pqltl_table_exists('local_prequran_comm_thread')) {
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

function pqltl_parent_children(int $parentid): array {
    global $DB;
    $children = [];

    if (pqltl_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }

    if (pqltl_table_exists('local_prequran_comm_participant') && pqltl_table_exists('local_prequran_comm_thread')) {
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

    return pqltl_enrich_children(array_values($children));
}

function pqltl_is_managed_student(int $userid): bool {
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

function pqltl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqltl_table_exists('local_prequran_teacher_student')
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

function pqltl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;

    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }

    if (pqltl_table_exists('local_prequran_teacher_student')) {
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

    if (!pqltl_has_teacher_role($teacherid) || !pqltl_is_managed_student($studentid)) {
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

function pqltl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicit = false;

    if (pqltl_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicit = true;
                $students[$studentid] = $studentid;
            }
        }
    }

    if (!$explicit && pqltl_has_teacher_role($teacherid)) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $members = $DB->get_records('cohort_members', ['cohortid' => (int)$membership->cohortid], '', 'userid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pqltl_is_managed_student($studentid)) {
                    $students[$studentid] = $studentid;
                }
            }
        }
    }

    return pqltl_enrich_children(array_values($students));
}

function pqltl_enrich_children(array $studentids): array {
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

function pqltl_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid)) {
        return true;
    }
    if ($userid === $studentid) {
        return true;
    }
    return pqltl_parent_can_access_child($userid, $studentid) || pqltl_teacher_can_access_student($userid, $studentid);
}

function pqltl_sessions(int $studentid): array {
    global $DB;
    if (!pqltl_table_exists('local_prequran_live_session') || !pqltl_table_exists('local_prequran_live_participant')) {
        return [];
    }

    return array_values($DB->get_records_sql(
        "SELECT s.id,
                s.title,
                s.teacherid,
                s.lessonid,
                s.unitid,
                s.scheduled_start,
                s.scheduled_end,
                s.status,
                s.recording_enabled,
                s.recording_consent_required,
                s.parent_observer_allowed,
                s.max_participants,
                a.attendance_status,
                a.participation_status,
                a.technical_issue,
                n.visible_to_parent,
                n.timemodified AS note_modified,
                COUNT(DISTINCT r.id) AS visible_recordings
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
      LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = p.studentid
      LEFT JOIN {local_prequran_live_note} n ON n.sessionid = s.id AND n.studentid = p.studentid
      LEFT JOIN {local_prequran_live_recording} r ON r.sessionid = s.id AND r.visible_to_parent = 1 AND r.status = 'available'
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
       GROUP BY s.id, s.title, s.teacherid, s.lessonid, s.unitid, s.scheduled_start, s.scheduled_end, s.status,
                s.recording_enabled, s.recording_consent_required, s.parent_observer_allowed, s.max_participants,
                a.attendance_status, a.participation_status, a.technical_issue, n.visible_to_parent, n.timemodified
       ORDER BY s.scheduled_start DESC, s.id DESC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active'],
        0,
        30
    ));
}

function pqltl_consent_record(int $studentid, int $guardianid, array $types): ?stdClass {
    global $DB;
    if (!pqltl_table_exists('local_prequran_live_consent')) {
        return null;
    }

    [$insql, $params] = $DB->get_in_or_equal($types, SQL_PARAMS_NAMED);
    $params['studentid'] = $studentid;
    $guardiansql = '';
    if ($guardianid > 0) {
        $params['guardianid'] = $guardianid;
        $guardiansql = ' AND guardianid = :guardianid';
    }
    $ordersql = $guardianid > 0 ? 'timemodified DESC' : 'granted DESC, timemodified DESC';
    $record = $DB->get_record_sql(
        "SELECT *
           FROM {local_prequran_live_consent}
          WHERE studentid = :studentid
            {$guardiansql}
            AND consent_type {$insql}
       ORDER BY {$ordersql}",
        $params,
        IGNORE_MULTIPLE
    );
    return $record ?: null;
}

function pqltl_consent_status(int $studentid, int $guardianid, array $types): string {
    $record = pqltl_consent_record($studentid, $guardianid, $types);
    if (!$record) {
        return 'Not recorded in system yet';
    }
    return !empty($record->granted) ? 'Granted' : 'Not granted';
}

function pqltl_save_parent_consent(int $studentid, int $guardianid, int $workspaceid, string $type, int $granted): void {
    global $DB;
    if (!pqltl_table_exists('local_prequran_live_consent')) {
        throw new invalid_parameter_exception('Live consent storage is not ready. Please ask support to run the Moodle upgrade.');
    }

    $now = time();
    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $guardianid,
        'consent_type' => $type,
    ], '*', IGNORE_MISSING);
    $record = $existing ? (object)['id' => (int)$existing->id] : new stdClass();
    $record = pqltl_apply_record_fields('local_prequran_live_consent', $record, [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'guardianid' => $guardianid,
        'consent_type' => $type,
        'granted' => $granted,
        'version' => '1',
        'consent_source' => 'parent_trust_center',
        'details' => json_encode(['actorid' => $guardianid, 'source' => 'parent_trust_center']),
        'timemodified' => $now,
    ]);
    if ($existing) {
        $DB->update_record('local_prequran_live_consent', $record);
        return;
    }
    $record = pqltl_apply_record_fields('local_prequran_live_consent', $record, ['timecreated' => $now]);
    $DB->insert_record('local_prequran_live_consent', $record);
}
