<?php
// Workspace-dashboard query library — extracted VERBATIM from
// workspace_dashboard.php (renamed pqwd_ -> pqwdl_) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqwdl_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwdl_count_records(string $table, array $conditions): int {
    global $DB;
    if (!pqh_table_exists_safe($table)) {
        return 0;
    }
    foreach (array_keys($conditions) as $field) {
        if (!pqh_table_has_field_safe($table, $field)) {
            return 0;
        }
    }
    return (int)$DB->count_records($table, $conditions);
}

function pqwdl_workspace_students(int $workspaceid, int $soloteacherid = 0): array {
    global $DB;
    $students = [];

    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $rows = $DB->get_records('local_prequran_workspace_member', [
            'workspaceid' => $workspaceid,
            'workspace_role' => 'student',
            'status' => 'active',
        ], 'timemodified DESC', 'id,userid');
        foreach ($rows as $row) {
            $user = core_user::get_user((int)$row->userid, 'id,idnumber', IGNORE_MISSING);
            $students[(int)$row->userid] = [
                'studentid' => (int)$row->userid,
                'source' => 'member',
                'name' => pqwdl_user_name((int)$row->userid),
                'accountno' => $user ? pqh_account_no_value($user) : '',
            ];
        }
    }

    if (pqh_table_exists_safe('local_prequran_student_profile') && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')) {
        $rows = $DB->get_records('local_prequran_student_profile', ['workspaceid' => $workspaceid], 'timemodified DESC', 'id,userid,student_display_name,current_level,status');
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            if ($studentid <= 0) {
                continue;
            }
            $students[$studentid] = [
                'studentid' => $studentid,
                'source' => 'profile',
                'name' => trim((string)$row->student_display_name) !== '' ? (string)$row->student_display_name : pqwdl_user_name($studentid),
                'level' => (string)($row->current_level ?? ''),
                'status' => (string)($row->status ?? ''),
                'accountno' => pqh_account_no_value($studentid),
            ];
        }
    }

    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        if ($soloteacherid > 0) {
            $rows = $DB->get_records('local_prequran_teacher_student', [
                'teacherid' => $soloteacherid,
                'status' => 'active',
            ], 'timemodified DESC', 'id,studentid');
        } else if (pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
            $rows = $DB->get_records('local_prequran_teacher_student', [
                'workspaceid' => $workspaceid,
                'status' => 'active',
            ], 'timemodified DESC', 'id,studentid');
        } else {
            $rows = [];
        }
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid <= 0 || isset($students[$studentid])) {
                continue;
            }
            $user = core_user::get_user($studentid, 'id,idnumber', IGNORE_MISSING);
            $students[$studentid] = [
                'studentid' => $studentid,
                'source' => 'assignment',
                'name' => pqwdl_user_name($studentid),
                'accountno' => $user ? pqh_account_no_value($user) : '',
            ];
        }
    }

    uasort($students, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return array_values($students);
}

function pqwdl_student_teacher_labels(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_student') || !pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT ts.id, ts.studentid, ts.teacherid, u.firstname, u.lastname
           FROM {local_prequran_teacher_student} ts
           JOIN {user} u ON u.id = ts.teacherid
          WHERE ts.workspaceid = :workspaceid
            AND ts.status = :status
       ORDER BY u.lastname ASC, u.firstname ASC",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    );
    $labels = [];
    foreach ($rows as $row) {
        $studentid = (int)$row->studentid;
        $labels[$studentid][] = fullname($row);
    }
    return $labels;
}

function pqwdl_student_course_labels(array $studentids): array {
    global $DB;
    $studentids = array_values(array_unique(array_filter(array_map('intval', $studentids))));
    if (!$studentids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($studentids, SQL_PARAMS_NAMED, 'sid');
    $rows = $DB->get_records_sql(
        "SELECT ue.id, ue.userid, c.fullname
           FROM {user_enrolments} ue
           JOIN {enrol} e ON e.id = ue.enrolid
           JOIN {course} c ON c.id = e.courseid
          WHERE ue.userid $insql
            AND ue.status = 0
            AND c.visible = 1
       ORDER BY c.fullname ASC",
        $params
    );
    $labels = [];
    foreach ($rows as $row) {
        $labels[(int)$row->userid][(string)$row->fullname] = (string)$row->fullname;
    }
    return array_map('array_values', $labels);
}

function pqwdl_recent_members(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT wm.id, wm.userid, wm.workspace_role, wm.status, wm.timecreated, wm.timemodified,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
       ORDER BY wm.timemodified DESC, wm.id DESC",
        ['workspaceid' => $workspaceid, 'status' => 'active'],
        0,
        12
    ));
}

function pqwdl_upcoming_sessions(int $workspaceid, int $limit = 8): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_session') || !pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT id, title, teacherid, scheduled_start, scheduled_end, timezone, status, session_type
           FROM {local_prequran_live_session}
          WHERE workspaceid = :workspaceid
            AND scheduled_start >= :now
            AND status NOT IN ('cancelled', 'archived')
       ORDER BY scheduled_start ASC",
        ['workspaceid' => $workspaceid, 'now' => time()],
        0,
        $limit
    ));
}

function pqwdl_session_action_label($session, bool $canmanage): string {
    global $USER;
    if ($canmanage || (int)$session->teacherid === (int)$USER->id) {
        return ((string)$session->status === 'completed') ? 'Open room' : 'Start class';
    }
    return 'Join class';
}

function pqwdl_role_counts(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT workspace_role, COUNT(1) AS rolecount
           FROM {local_prequran_workspace_member}
          WHERE workspaceid = :workspaceid
            AND status = :status
       GROUP BY workspace_role",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    );
    $counts = [];
    foreach ($rows as $row) {
        $counts[(string)$row->workspace_role] = (int)$row->rolecount;
    }
    return $counts;
}

function pqwdl_workspace_domains(int $workspaceid): array {
    global $DB;
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_consumer_domain', [
        'workspaceid' => $workspaceid,
        'status' => 'active',
    ], 'isprimary DESC, domain_type ASC, domain ASC'));
}

function pqwdl_domain_url(string $domain, string $path, array $params = []): moodle_url {
    $domain = pqh_normalize_consumer_host($domain);
    $path = '/' . ltrim($path, '/');
    if ($domain === '') {
        return new moodle_url($path, $params);
    }
    return new moodle_url('https://' . $domain . $path, $params);
}
