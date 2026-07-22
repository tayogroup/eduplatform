<?php
// Managed-reports query library — extracted VERBATIM from managed_reports.php
// (functions renamed pqmr_ -> pqmrl_ so both can coexist) for the token-gated
// portal endpoint (local/prequran/portal_data.php). The legacy page keeps its
// own inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* helpers).

defined('MOODLE_INTERNAL') || die();

function pqmrl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqmrl_table_has_field(string $table, string $field): bool {
    global $DB;
    if (!pqmrl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqmrl_env_sql(string $alias, string $table, string $environment, array &$params): string {
    if ($environment === '' || !pqmrl_table_has_field($table, 'environment')) {
        return '';
    }
    $key = preg_replace('/[^a-z0-9_]/', '', strtolower($alias . '_' . $table . '_env'));
    $params[$key] = $environment;
    return " AND {$alias}.environment = :{$key}";
}

function pqmrl_is_managed_student(int $userid): bool {
    require_once($GLOBALS['CFG']->dirroot . '/user/profile/lib.php');
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

function pqmrl_user_label(int $userid): string {
    $user = core_user::get_user($userid);
    return $user ? fullname($user) : 'Student ' . $userid;
}

function pqmrl_user_identity_detail(int $userid): string {
    $user = core_user::get_user($userid, 'id,username,idnumber,deleted', IGNORE_MISSING);
    if (!$user) {
        return '';
    }
    $parts = [];
    if (trim((string)$user->username) !== '') {
        $parts[] = 'username: ' . (string)$user->username;
    }
    if (trim((string)$user->idnumber) !== '') {
        $parts[] = 'idnumber: ' . (string)$user->idnumber;
    }
    return implode(' - ', $parts);
}

function pqmrl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (pqmrl_table_exists('local_prequran_teacher_student')
            && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqmrl_table_exists('local_prequran_class_group')
            && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND (r.shortname IN ('editingteacher', 'teacher', 'manager')
                 OR r.archetype IN ('manager', 'editingteacher', 'teacher'))",
        [$userid]
    );
}

function pqmrl_role(int $userid): string {
    global $DB;
    if (pqh_can_manage_academy_operations($userid)) {
        return 'admin';
    }
    if (pqh_user_allowed_workspace_ids($userid, 'operations.manage')) {
        return 'admin';
    }
    if (pqmrl_has_teacher_role($userid)) {
        return 'teacher';
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqmrl_table_exists($table)
                && pqmrl_table_has_field($table, 'guardianid')
                && $DB->record_exists($table, ['guardianid' => $userid])) {
            return 'parent';
        }
    }
    return 'student';
}

function pqmrl_student_in_allowed_workspace(int $studentid): bool {
    global $DB, $USER;
    if ($studentid <= 0) {
        return false;
    }
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return true;
    }
    $workspaceids = pqh_user_allowed_workspace_ids((int)$USER->id, 'operations.manage');
    foreach (pqh_independent_teacher_workspace_ids((int)$USER->id) as $workspaceid) {
        if ($workspaceid > 0 && !in_array($workspaceid, $workspaceids, true)) {
            $workspaceids[] = $workspaceid;
        }
    }
    if (!$workspaceids) {
        return false;
    }
    [$insql, $inparams] = $DB->get_in_or_equal($workspaceids, SQL_PARAMS_NAMED, 'mrwork');
    $memberparams = $inparams + ['studentid' => $studentid, 'status' => 'active'];
    if (pqmrl_table_exists('local_prequran_workspace_member')
            && $DB->record_exists_select(
                'local_prequran_workspace_member',
                "userid = :studentid AND status = :status AND workspaceid {$insql}",
                $memberparams
            )) {
        return true;
    }
    $profileparams = $inparams + ['studentid' => $studentid];
    if (pqmrl_table_exists('local_prequran_student_profile')
            && pqmrl_table_has_field('local_prequran_student_profile', 'workspaceid')
            && pqmrl_table_has_field('local_prequran_student_profile', 'userid')
            && $DB->record_exists_select(
                'local_prequran_student_profile',
                "userid = :studentid AND workspaceid {$insql}",
                $profileparams
            )) {
        return true;
    }
    return false;
}

function pqmrl_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqmrl_table_exists($table) || !pqmrl_table_has_field($table, 'guardianid') || !pqmrl_table_has_field($table, 'studentid')) {
            continue;
        }
        $rows = $DB->get_records($table, ['guardianid' => $parentid]);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = ['studentid' => $studentid, 'name' => pqmrl_user_label($studentid)];
            }
        }
    }
    return pqmrl_sort_students($children);
}

function pqmrl_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];

    if (pqmrl_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $students[$studentid] = ['studentid' => $studentid, 'name' => pqmrl_user_label($studentid)];
            }
        }
    }

    if (pqmrl_table_exists('local_prequran_group_member') && pqmrl_table_exists('local_prequran_class_group')) {
        $rows = $DB->get_records_sql(
            "SELECT gm.studentid, gm.groupid, cg.title
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE cg.teacherid = :teacherid
                AND gm.assignment_status = :assignmentstatus
                AND cg.status <> :archived",
            ['teacherid' => $teacherid, 'assignmentstatus' => 'active', 'archived' => 'archived']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $students[$studentid] = [
                    'studentid' => $studentid,
                    'name' => pqmrl_user_label($studentid),
                    'groupname' => (string)$row->title,
                    'groupid' => (int)$row->groupid,
                ];
            }
        }
    }

    foreach (pqh_independent_teacher_workspace_ids($teacherid) as $workspaceid) {
        if (!pqmrl_table_exists('local_prequran_workspace_member')) {
            continue;
        }
        $rows = $DB->get_records('local_prequran_workspace_member', [
            'workspaceid' => $workspaceid,
            'workspace_role' => 'student',
            'status' => 'active',
        ], 'timemodified DESC', 'id, userid, workspaceid');
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            if ($studentid > 0 && $studentid !== $teacherid) {
                $students[$studentid] = [
                    'studentid' => $studentid,
                    'name' => pqmrl_user_label($studentid),
                    'groupname' => 'Independent workspace',
                    'groupid' => 0,
                ];
            }
        }
    }

    if (!$students) {
        $cohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($cohorts as $membership) {
            $members = $DB->get_records('cohort_members', ['cohortid' => (int)$membership->cohortid], '', 'userid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid > 0 && $studentid !== $teacherid && pqmrl_is_managed_student($studentid)) {
                    $students[$studentid] = ['studentid' => $studentid, 'name' => pqmrl_user_label($studentid)];
                }
            }
        }
    }

    return pqmrl_sort_students($students);
}

function pqmrl_admin_students(): array {
    global $DB;
    $students = [];
    if (pqmrl_table_exists('local_prequran_lessonprog')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT userid
               FROM {local_prequran_lessonprog}
              WHERE userid > 0
           ORDER BY userid ASC",
            [],
            0,
            1000
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            if ($studentid > 0 && pqmrl_student_in_allowed_workspace($studentid)) {
                $students[$studentid] = ['studentid' => $studentid, 'name' => pqmrl_user_label($studentid)];
            }
        }
    }
    if (pqmrl_table_exists('local_prequran_student_profile')) {
        $field = pqmrl_table_has_field('local_prequran_student_profile', 'userid') ? 'userid' : 'studentid';
        if (pqmrl_table_has_field('local_prequran_student_profile', $field)) {
            $rows = $DB->get_records_sql("SELECT DISTINCT {$field} AS studentid FROM {local_prequran_student_profile} WHERE {$field} > 0", [], 0, 1000);
            foreach ($rows as $row) {
                $studentid = (int)$row->studentid;
                if (pqmrl_student_in_allowed_workspace($studentid)) {
                    $students[$studentid] = ['studentid' => $studentid, 'name' => pqmrl_user_label($studentid)];
                }
            }
        }
    }
    return pqmrl_sort_students($students);
}

function pqmrl_sort_students(array $students): array {
    uasort($students, static function(array $a, array $b): int {
        return strcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? ''));
    });
    return array_values($students);
}

function pqmrl_allowed_students(string $role, int $userid): array {
    if ($role === 'admin') {
        $students = pqmrl_admin_students();
    } else if ($role === 'teacher') {
        $students = pqmrl_teacher_students($userid);
    } else if ($role === 'parent') {
        $students = pqmrl_parent_children($userid);
    } else {
        $students = [['studentid' => $userid, 'name' => pqmrl_user_label($userid)]];
    }
    return array_values(array_filter($students, static function(array $student) use ($role, $userid): bool {
        $studentid = (int)($student['studentid'] ?? 0);
        if ($role === 'teacher' && pqh_has_independent_teacher_profile($userid) && pqmrl_student_in_allowed_workspace($studentid)) {
            return true;
        }
        return pqh_user_belongs_to_consumer_context($studentid);
    }));
}

function pqmrl_format_duration(int $seconds): string {
    if ($seconds <= 0) {
        return '0m';
    }
    $minutes = (int)ceil($seconds / 60);
    $hours = intdiv($minutes, 60);
    $remaining = $minutes % 60;
    return $hours > 0 ? $hours . 'h ' . $remaining . 'm' : $remaining . 'm';
}

function pqmrl_pct(int $value): int {
    return max(0, min(100, $value));
}

function pqmrl_report_rows(array $students, string $environment, string $lessonid, string $unitid, string $status, string $search): array {
    global $DB;
    if (!$students) {
        return [];
    }

    $ids = array_map(static function(array $student): int {
        return (int)$student['studentid'];
    }, $students);
    [$insql, $inparams] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'mruserid');

    $params = $inparams;
    $lessonfilter = '';
    $unitfilter = '';
    if ($lessonid !== '') {
        $lessonfilter = ' AND lp.lessonid = :lessonid';
        $params['lessonid'] = $lessonid;
    }
    if ($unitid !== '') {
        $unitfilter = ' AND lp.unitid = :unitid';
        $params['unitid'] = $unitid;
    }
    $envfilter = pqmrl_env_sql('lp', 'local_prequran_lessonprog', $environment, $params);
    $statusfilter = '';
    if ($status !== '') {
        $statusfilter = ' AND COALESCE(lp.overall_status, :notstarted) = :status';
        $params['notstarted'] = 'not_started';
        $params['status'] = $status;
    }

    $progress = [];
    if (pqmrl_table_exists('local_prequran_lessonprog')) {
        $rows = $DB->get_records_sql(
            "SELECT lp.*
               FROM {local_prequran_lessonprog} lp
              WHERE lp.userid {$insql}{$lessonfilter}{$unitfilter}{$envfilter}{$statusfilter}
           ORDER BY lp.overall_lastactivity DESC, lp.timemodified DESC",
            $params,
            0,
            2000
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            if (!isset($progress[$studentid])) {
                $progress[$studentid] = [
                    'units' => 0,
                    'completed' => 0,
                    'inprogress' => 0,
                    'steps_completed' => 0,
                    'steps_total' => 0,
                    'latest' => null,
                ];
            }
            $progress[$studentid]['units']++;
            $progress[$studentid]['steps_completed'] += (int)($row->steps_completed ?? 0);
            $progress[$studentid]['steps_total'] += (int)($row->steps_total ?? 0);
            $rowstatus = (string)($row->overall_status ?? 'not_started');
            if ($rowstatus === 'completed') {
                $progress[$studentid]['completed']++;
            } else if ($rowstatus === 'in_progress') {
                $progress[$studentid]['inprogress']++;
            }
            if (!$progress[$studentid]['latest']) {
                $progress[$studentid]['latest'] = $row;
            }
        }
    }

    $focus = pqmrl_focus_by_student($ids, $environment, $lessonid, $unitid);
    $speak = pqmrl_count_by_student('local_prequran_speakrec', $ids, $environment, $lessonid, $unitid, 'status <> :failed', ['failed' => 'upload_failed']);
    $submit = pqmrl_count_by_student('local_prequran_submitrec', $ids, $environment, $lessonid, $unitid);
    $quiz = pqmrl_count_by_student('local_prequran_quiz_attempt', $ids, $environment, $lessonid, $unitid);
    $live = pqmrl_live_by_student($ids);

    $out = [];
    $search = core_text::strtolower(trim($search));
    foreach ($students as $student) {
        $studentid = (int)$student['studentid'];
        $name = (string)$student['name'];
        if ($search !== '') {
            $haystack = core_text::strtolower($studentid . ' ' . $name . ' ' . (string)($student['groupname'] ?? ''));
            if (strpos($haystack, $search) === false) {
                continue;
            }
        }
        $p = $progress[$studentid] ?? ['units' => 0, 'completed' => 0, 'inprogress' => 0, 'steps_completed' => 0, 'steps_total' => 0, 'latest' => null];
        if ($status !== '' && (int)$p['units'] === 0) {
            continue;
        }
        $latest = $p['latest'];
        $pct = (int)$p['steps_total'] > 0 ? pqmrl_pct((int)floor(((int)$p['steps_completed'] / (int)$p['steps_total']) * 100)) : ($latest ? pqmrl_pct((int)($latest->completion_percent ?? 0)) : 0);
        $out[] = [
            'studentid' => $studentid,
            'name' => $name,
            'groupname' => (string)($student['groupname'] ?? ''),
            'units' => (int)$p['units'],
            'completed' => (int)$p['completed'],
            'inprogress' => (int)$p['inprogress'],
            'completion' => $pct,
            'latest' => $latest,
            'focus' => $focus[$studentid] ?? ['active_ms' => 0, 'idle_count' => 0, 'leave_count' => 0, 'last_time' => 0],
            'speak' => $speak[$studentid] ?? 0,
            'submit' => $submit[$studentid] ?? 0,
            'quiz' => $quiz[$studentid] ?? 0,
            'live' => $live[$studentid] ?? ['sessions' => 0, 'present' => 0, 'absent' => 0],
        ];
    }
    return $out;
}

function pqmrl_count_by_student(string $table, array $ids, string $environment, string $lessonid, string $unitid, string $extra = '', array $extraparams = []): array {
    global $DB;
    if (!pqmrl_table_exists($table) || !$ids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'cntuserid');
    $params = array_merge($params, $extraparams);
    $filters = ["userid {$insql}"];
    if ($lessonid !== '' && pqmrl_table_has_field($table, 'lessonid')) {
        $filters[] = 'lessonid = :cntlessonid';
        $params['cntlessonid'] = $lessonid;
    }
    if ($unitid !== '' && pqmrl_table_has_field($table, 'unitid')) {
        $filters[] = 'unitid = :cntunitid';
        $params['cntunitid'] = $unitid;
    }
    if ($environment !== '' && pqmrl_table_has_field($table, 'environment')) {
        $filters[] = 'environment = :cntenv';
        $params['cntenv'] = $environment;
    }
    if ($extra !== '') {
        $filters[] = $extra;
    }
    $rows = $DB->get_records_sql(
        "SELECT userid, COUNT(1) AS rowcount
           FROM {" . $table . "}
          WHERE " . implode(' AND ', $filters) . "
       GROUP BY userid",
        $params
    );
    $out = [];
    foreach ($rows as $row) {
        $out[(int)$row->userid] = (int)$row->rowcount;
    }
    return $out;
}

function pqmrl_focus_by_student(array $ids, string $environment, string $lessonid, string $unitid): array {
    global $DB;
    if (!pqmrl_table_exists('local_prequran_focusagg') || !$ids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'focususerid');
    $filters = ["userid {$insql}"];
    if ($lessonid !== '' && pqmrl_table_has_field('local_prequran_focusagg', 'lessonid')) {
        $filters[] = 'lessonid = :focuslessonid';
        $params['focuslessonid'] = $lessonid;
    }
    if ($unitid !== '' && pqmrl_table_has_field('local_prequran_focusagg', 'unitid')) {
        $filters[] = 'unitid = :focusunitid';
        $params['focusunitid'] = $unitid;
    }
    if ($environment !== '' && pqmrl_table_has_field('local_prequran_focusagg', 'environment')) {
        $filters[] = 'environment = :focusenv';
        $params['focusenv'] = $environment;
    }
    $rows = $DB->get_records_sql(
        "SELECT userid,
                COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                COALESCE(SUM(leave_count), 0) AS leave_count,
                COALESCE(MAX(last_time), 0) AS last_time
           FROM {local_prequran_focusagg}
          WHERE " . implode(' AND ', $filters) . "
       GROUP BY userid",
        $params
    );
    $out = [];
    foreach ($rows as $row) {
        $out[(int)$row->userid] = [
            'active_ms' => (int)$row->active_ms,
            'idle_count' => (int)$row->idle_count,
            'leave_count' => (int)$row->leave_count,
            'last_time' => (int)$row->last_time,
        ];
    }
    return $out;
}

function pqmrl_live_by_student(array $ids): array {
    global $DB;
    if (!pqmrl_table_exists('local_prequran_live_participant') || !$ids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'liveuserid');
    if (!pqmrl_table_exists('local_prequran_live_attendance')) {
        $rows = $DB->get_records_sql(
            "SELECT p.studentid AS userid,
                    COUNT(DISTINCT p.sessionid) AS sessions
               FROM {local_prequran_live_participant} p
              WHERE p.studentid {$insql}
                AND p.role = :role
                AND p.status = :status
           GROUP BY p.studentid",
            $params + ['role' => 'student', 'status' => 'active']
        );
        $out = [];
        foreach ($rows as $row) {
            $out[(int)$row->userid] = [
                'sessions' => (int)$row->sessions,
                'present' => 0,
                'absent' => 0,
            ];
        }
        return $out;
    }
    $rows = $DB->get_records_sql(
        "SELECT p.studentid AS userid,
                COUNT(DISTINCT p.sessionid) AS sessions,
                SUM(CASE WHEN a.attendance_status = 'present' THEN 1 ELSE 0 END) AS present,
                SUM(CASE WHEN a.attendance_status = 'absent' THEN 1 ELSE 0 END) AS absent
           FROM {local_prequran_live_participant} p
      LEFT JOIN {local_prequran_live_attendance} a
             ON a.sessionid = p.sessionid
            AND a.studentid = p.studentid
          WHERE p.studentid {$insql}
            AND p.role = :role
            AND p.status = :status
       GROUP BY p.studentid",
        $params + ['role' => 'student', 'status' => 'active']
    );
    $out = [];
    foreach ($rows as $row) {
        $out[(int)$row->userid] = [
            'sessions' => (int)$row->sessions,
            'present' => (int)$row->present,
            'absent' => (int)$row->absent,
        ];
    }
    return $out;
}
