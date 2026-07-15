<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->libdir . '/ddllib.php');
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/managed_reports.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Managed Student Reports');
$PAGE->set_heading('Managed Student Reports');
$PAGE->add_body_class('pqh-managed-report-page');

function pqmr_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqmr_table_has_field(string $table, string $field): bool {
    global $DB;
    if (!pqmr_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqmr_env_sql(string $alias, string $table, string $environment, array &$params): string {
    if ($environment === '' || !pqmr_table_has_field($table, 'environment')) {
        return '';
    }
    $key = preg_replace('/[^a-z0-9_]/', '', strtolower($alias . '_' . $table . '_env'));
    $params[$key] = $environment;
    return " AND {$alias}.environment = :{$key}";
}

function pqmr_is_managed_student(int $userid): bool {
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

function pqmr_user_label(int $userid): string {
    $user = core_user::get_user($userid);
    return $user ? fullname($user) : 'Student ' . $userid;
}

function pqmr_user_identity_detail(int $userid): string {
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

function pqmr_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (pqmr_table_exists('local_prequran_teacher_student')
            && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqmr_table_exists('local_prequran_class_group')
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

function pqmr_role(int $userid): string {
    global $DB;
    if (pqh_can_manage_academy_operations($userid)) {
        return 'admin';
    }
    if (pqh_user_allowed_workspace_ids($userid, 'operations.manage')) {
        return 'admin';
    }
    if (pqmr_has_teacher_role($userid)) {
        return 'teacher';
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqmr_table_exists($table)
                && pqmr_table_has_field($table, 'guardianid')
                && $DB->record_exists($table, ['guardianid' => $userid])) {
            return 'parent';
        }
    }
    return 'student';
}

function pqmr_student_in_allowed_workspace(int $studentid): bool {
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
    if (pqmr_table_exists('local_prequran_workspace_member')
            && $DB->record_exists_select(
                'local_prequran_workspace_member',
                "userid = :studentid AND status = :status AND workspaceid {$insql}",
                $memberparams
            )) {
        return true;
    }
    $profileparams = $inparams + ['studentid' => $studentid];
    if (pqmr_table_exists('local_prequran_student_profile')
            && pqmr_table_has_field('local_prequran_student_profile', 'workspaceid')
            && pqmr_table_has_field('local_prequran_student_profile', 'userid')
            && $DB->record_exists_select(
                'local_prequran_student_profile',
                "userid = :studentid AND workspaceid {$insql}",
                $profileparams
            )) {
        return true;
    }
    return false;
}

function pqmr_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqmr_table_exists($table) || !pqmr_table_has_field($table, 'guardianid') || !pqmr_table_has_field($table, 'studentid')) {
            continue;
        }
        $rows = $DB->get_records($table, ['guardianid' => $parentid]);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = ['studentid' => $studentid, 'name' => pqmr_user_label($studentid)];
            }
        }
    }
    return pqmr_sort_students($children);
}

function pqmr_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];

    if (pqmr_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $students[$studentid] = ['studentid' => $studentid, 'name' => pqmr_user_label($studentid)];
            }
        }
    }

    if (pqmr_table_exists('local_prequran_group_member') && pqmr_table_exists('local_prequran_class_group')) {
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
                    'name' => pqmr_user_label($studentid),
                    'groupname' => (string)$row->title,
                    'groupid' => (int)$row->groupid,
                ];
            }
        }
    }

    foreach (pqh_independent_teacher_workspace_ids($teacherid) as $workspaceid) {
        if (!pqmr_table_exists('local_prequran_workspace_member')) {
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
                    'name' => pqmr_user_label($studentid),
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
                if ($studentid > 0 && $studentid !== $teacherid && pqmr_is_managed_student($studentid)) {
                    $students[$studentid] = ['studentid' => $studentid, 'name' => pqmr_user_label($studentid)];
                }
            }
        }
    }

    return pqmr_sort_students($students);
}

function pqmr_admin_students(): array {
    global $DB;
    $students = [];
    if (pqmr_table_exists('local_prequran_lessonprog')) {
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
            if ($studentid > 0 && pqmr_student_in_allowed_workspace($studentid)) {
                $students[$studentid] = ['studentid' => $studentid, 'name' => pqmr_user_label($studentid)];
            }
        }
    }
    if (pqmr_table_exists('local_prequran_student_profile')) {
        $field = pqmr_table_has_field('local_prequran_student_profile', 'userid') ? 'userid' : 'studentid';
        if (pqmr_table_has_field('local_prequran_student_profile', $field)) {
            $rows = $DB->get_records_sql("SELECT DISTINCT {$field} AS studentid FROM {local_prequran_student_profile} WHERE {$field} > 0", [], 0, 1000);
            foreach ($rows as $row) {
                $studentid = (int)$row->studentid;
                if (pqmr_student_in_allowed_workspace($studentid)) {
                    $students[$studentid] = ['studentid' => $studentid, 'name' => pqmr_user_label($studentid)];
                }
            }
        }
    }
    return pqmr_sort_students($students);
}

function pqmr_sort_students(array $students): array {
    uasort($students, static function(array $a, array $b): int {
        return strcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? ''));
    });
    return array_values($students);
}

function pqmr_allowed_students(string $role, int $userid): array {
    if ($role === 'admin') {
        $students = pqmr_admin_students();
    } else if ($role === 'teacher') {
        $students = pqmr_teacher_students($userid);
    } else if ($role === 'parent') {
        $students = pqmr_parent_children($userid);
    } else {
        $students = [['studentid' => $userid, 'name' => pqmr_user_label($userid)]];
    }
    return array_values(array_filter($students, static function(array $student) use ($role, $userid): bool {
        $studentid = (int)($student['studentid'] ?? 0);
        if ($role === 'teacher' && pqh_has_independent_teacher_profile($userid) && pqmr_student_in_allowed_workspace($studentid)) {
            return true;
        }
        return pqh_user_belongs_to_consumer_context($studentid);
    }));
}

function pqmr_format_duration(int $seconds): string {
    if ($seconds <= 0) {
        return '0m';
    }
    $minutes = (int)ceil($seconds / 60);
    $hours = intdiv($minutes, 60);
    $remaining = $minutes % 60;
    return $hours > 0 ? $hours . 'h ' . $remaining . 'm' : $remaining . 'm';
}

function pqmr_pct(int $value): int {
    return max(0, min(100, $value));
}

function pqmr_report_rows(array $students, string $environment, string $lessonid, string $unitid, string $status, string $search): array {
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
    $envfilter = pqmr_env_sql('lp', 'local_prequran_lessonprog', $environment, $params);
    $statusfilter = '';
    if ($status !== '') {
        $statusfilter = ' AND COALESCE(lp.overall_status, :notstarted) = :status';
        $params['notstarted'] = 'not_started';
        $params['status'] = $status;
    }

    $progress = [];
    if (pqmr_table_exists('local_prequran_lessonprog')) {
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

    $focus = pqmr_focus_by_student($ids, $environment, $lessonid, $unitid);
    $speak = pqmr_count_by_student('local_prequran_speakrec', $ids, $environment, $lessonid, $unitid, 'status <> :failed', ['failed' => 'upload_failed']);
    $submit = pqmr_count_by_student('local_prequran_submitrec', $ids, $environment, $lessonid, $unitid);
    $quiz = pqmr_count_by_student('local_prequran_quiz_attempt', $ids, $environment, $lessonid, $unitid);
    $live = pqmr_live_by_student($ids);

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
        $pct = (int)$p['steps_total'] > 0 ? pqmr_pct((int)floor(((int)$p['steps_completed'] / (int)$p['steps_total']) * 100)) : ($latest ? pqmr_pct((int)($latest->completion_percent ?? 0)) : 0);
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

function pqmr_count_by_student(string $table, array $ids, string $environment, string $lessonid, string $unitid, string $extra = '', array $extraparams = []): array {
    global $DB;
    if (!pqmr_table_exists($table) || !$ids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'cntuserid');
    $params = array_merge($params, $extraparams);
    $filters = ["userid {$insql}"];
    if ($lessonid !== '' && pqmr_table_has_field($table, 'lessonid')) {
        $filters[] = 'lessonid = :cntlessonid';
        $params['cntlessonid'] = $lessonid;
    }
    if ($unitid !== '' && pqmr_table_has_field($table, 'unitid')) {
        $filters[] = 'unitid = :cntunitid';
        $params['cntunitid'] = $unitid;
    }
    if ($environment !== '' && pqmr_table_has_field($table, 'environment')) {
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

function pqmr_focus_by_student(array $ids, string $environment, string $lessonid, string $unitid): array {
    global $DB;
    if (!pqmr_table_exists('local_prequran_focusagg') || !$ids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'focususerid');
    $filters = ["userid {$insql}"];
    if ($lessonid !== '' && pqmr_table_has_field('local_prequran_focusagg', 'lessonid')) {
        $filters[] = 'lessonid = :focuslessonid';
        $params['focuslessonid'] = $lessonid;
    }
    if ($unitid !== '' && pqmr_table_has_field('local_prequran_focusagg', 'unitid')) {
        $filters[] = 'unitid = :focusunitid';
        $params['focusunitid'] = $unitid;
    }
    if ($environment !== '' && pqmr_table_has_field('local_prequran_focusagg', 'environment')) {
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

function pqmr_live_by_student(array $ids): array {
    global $DB;
    if (!pqmr_table_exists('local_prequran_live_participant') || !$ids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'liveuserid');
    if (!pqmr_table_exists('local_prequran_live_attendance')) {
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

$role = pqmr_role((int)$USER->id);
$students = pqmr_allowed_students($role, (int)$USER->id);
if (!$students && $role !== 'admin') {
    pqh_access_denied(
        'No linked managed students were found for this account.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Managed reports are not available yet'
    );
}

$allowedids = array_map(static function(array $student): int {
    return (int)$student['studentid'];
}, $students);
$studentid = optional_param('studentid', 0, PARAM_INT);
if ($studentid > 0 && !in_array($studentid, $allowedids, true)) {
    pqh_access_denied(
        'This account cannot view reports for that student.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Report access denied'
    );
}
$environment = strtolower(trim(optional_param('pq_env', 'production', PARAM_ALPHANUMEXT)));
if (!in_array($environment, ['production', 'staging', 'integration'], true)) {
    $environment = 'production';
}
$lessonid = trim(optional_param('lessonid', '', PARAM_ALPHANUMEXT));
$unitid = trim(optional_param('unitid', '', PARAM_ALPHANUMEXT));
$status = strtolower(trim(optional_param('status', '', PARAM_ALPHANUMEXT)));
$statusmap = ['notstarted' => 'not_started', 'inprogress' => 'in_progress', 'all' => ''];
$status = $statusmap[$status] ?? $status;
if (!in_array($status, ['', 'not_started', 'in_progress', 'completed'], true)) {
    $status = '';
}
$search = optional_param('q', '', PARAM_TEXT);
$scopedstudents = $studentid > 0 ? array_values(array_filter($students, static function(array $student) use ($studentid): bool {
    return (int)$student['studentid'] === $studentid;
})) : $students;
$rows = pqmr_report_rows($scopedstudents, $environment, $lessonid, $unitid, $status, $search);

$metrics = ['students' => count($rows), 'units' => 0, 'completed' => 0, 'recordings' => 0, 'quiz' => 0];
foreach ($rows as $row) {
    $metrics['units'] += (int)$row['units'];
    $metrics['completed'] += (int)$row['completed'];
    $metrics['recordings'] += (int)$row['speak'] + (int)$row['submit'];
    $metrics['quiz'] += (int)$row['quiz'];
}

echo $OUTPUT->header();
?>
<style>
body.pqh-managed-report-page header,
body.pqh-managed-report-page footer,
body.pqh-managed-report-page nav.navbar,
body.pqh-managed-report-page #page-header,
body.pqh-managed-report-page #page-footer,
body.pqh-managed-report-page .drawer,
body.pqh-managed-report-page .drawer-toggles,
body.pqh-managed-report-page .block-region,
body.pqh-managed-report-page [data-region="drawer"],
body.pqh-managed-report-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-managed-report-page #page,
body.pqh-managed-report-page #page-content,
body.pqh-managed-report-page #region-main,
body.pqh-managed-report-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqmr-shell{min-height:100vh;padding:26px 16px 52px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqmr-wrap{max-width:1280px;margin:0 auto}
.pqmr-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-bottom:14px;padding:20px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqmr-title{margin:0;color:#221b22;font-size:30px;line-height:1.1;font-weight:950}
.pqmr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqmr-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.pqmr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.14);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none!important;font-size:13px;font-weight:950}
.pqmr-btn--primary{background:#2f6f4e;border-color:#2f6f4e;color:#fff!important}
.pqmr-filter{display:grid;grid-template-columns:1.1fr .8fr .8fr .8fr .8fr auto;gap:10px;margin-bottom:14px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqmr-field label{display:block;margin:0 0 5px;color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}
.pqmr-input,.pqmr-select{width:100%;min-height:40px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:14px;font-weight:800}
.pqmr-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}
.pqmr-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqmr-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}
.pqmr-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}
.pqmr-card{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}
.pqmr-table{width:100%;border-collapse:separate;border-spacing:0}
.pqmr-table th,.pqmr-table td{padding:11px 10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top}
.pqmr-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}
.pqmr-table td{color:#173044;font-size:13px;font-weight:800}
.pqmr-name{display:block;color:#173044;font-size:14px;font-weight:950}
.pqmr-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}
.pqmr-bar{height:8px;overflow:hidden;border-radius:999px;background:#e7edf0}
.pqmr-bar span{display:block;height:100%;background:#2f6f4e}
.pqmr-pill{display:inline-flex;min-height:25px;align-items:center;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;white-space:nowrap}
.pqmr-empty{padding:22px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;background:#fff;color:#5e7280;font-weight:900}
@media(max-width:980px){.pqmr-top,.pqmr-filter{grid-template-columns:1fr}.pqmr-actions{justify-content:flex-start}.pqmr-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.pqmr-table,.pqmr-table tbody,.pqmr-table tr,.pqmr-table td{display:block;width:100%}.pqmr-table thead{display:none}.pqmr-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqmr-table td{border:0}.pqmr-table td::before{content:attr(data-label);display:block;margin-bottom:3px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
@media(max-width:560px){.pqmr-shell{padding:18px 10px 42px}.pqmr-title{font-size:24px}.pqmr-summary{grid-template-columns:1fr}.pqmr-btn{width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqmr-shell">
  <div class="pqmr-wrap">
    <section class="pqmr-top pqh-workspace-top">
      <div>
        <h1 class="pqmr-title pqh-workspace-title">Managed Student Reports</h1>
        <p class="pqmr-sub pqh-workspace-sub">Lesson progress, focus activity, recordings, quiz attempts, and live-class activity for allowed managed students.</p>
      </div>
      <nav class="pqmr-actions pqh-workspace-actions" aria-label="Report links">
        <a class="pqmr-btn pqmr-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <?php if ($role === 'admin'): ?><a class="pqmr-btn" href="<?php echo (new moodle_url('/local/hubredirect/master_dashboard.php'))->out(false); ?>">Master Dashboard</a><?php endif; ?>
        <a class="pqmr-btn" href="<?php echo (new moodle_url('/local/hubredirect/quiz_report.php'))->out(false); ?>">Quiz Reports</a>
      </nav>
    </section>

    <form class="pqmr-filter" method="get" aria-label="Managed report filters">
      <div class="pqmr-field">
        <label for="pqmr-student">Student</label>
        <select class="pqmr-select" id="pqmr-student" name="studentid">
          <option value="0">All allowed students</option>
          <?php foreach ($students as $student): ?>
            <option value="<?php echo (int)$student['studentid']; ?>" <?php echo $studentid === (int)$student['studentid'] ? 'selected' : ''; ?>><?php echo s($student['name'] . ' #' . $student['studentid']); ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="pqmr-field">
        <label for="pqmr-env">Environment</label>
        <select class="pqmr-select" id="pqmr-env" name="pq_env">
          <?php foreach (['production', 'staging', 'integration'] as $env): ?>
            <option value="<?php echo s($env); ?>" <?php echo $environment === $env ? 'selected' : ''; ?>><?php echo s(ucfirst($env)); ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="pqmr-field">
        <label for="pqmr-lesson">Lesson</label>
        <input class="pqmr-input" id="pqmr-lesson" name="lessonid" value="<?php echo s($lessonid); ?>" placeholder="all">
      </div>
      <div class="pqmr-field">
        <label for="pqmr-unit">Unit</label>
        <input class="pqmr-input" id="pqmr-unit" name="unitid" value="<?php echo s($unitid); ?>" placeholder="all">
      </div>
      <div class="pqmr-field">
        <label for="pqmr-status">Status</label>
        <select class="pqmr-select" id="pqmr-status" name="status">
          <option value="" <?php echo $status === '' ? 'selected' : ''; ?>>All</option>
          <option value="not_started" <?php echo $status === 'not_started' ? 'selected' : ''; ?>>Not started</option>
          <option value="in_progress" <?php echo $status === 'in_progress' ? 'selected' : ''; ?>>In progress</option>
          <option value="completed" <?php echo $status === 'completed' ? 'selected' : ''; ?>>Completed</option>
        </select>
      </div>
      <div class="pqmr-field">
        <label for="pqmr-q">Search</label>
        <input class="pqmr-input" id="pqmr-q" name="q" value="<?php echo s($search); ?>" placeholder="name or id">
      </div>
      <button class="pqmr-btn pqmr-btn--primary" type="submit">Apply</button>
    </form>

    <section class="pqmr-summary" aria-label="Report summary">
      <div class="pqmr-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students shown</span></div>
      <div class="pqmr-metric"><strong><?php echo (int)$metrics['units']; ?></strong><span>unit records</span></div>
      <div class="pqmr-metric"><strong><?php echo (int)$metrics['completed']; ?></strong><span>completed units</span></div>
      <div class="pqmr-metric"><strong><?php echo (int)$metrics['recordings']; ?></strong><span>practice recordings</span></div>
      <div class="pqmr-metric"><strong><?php echo (int)$metrics['quiz']; ?></strong><span>quiz attempts</span></div>
    </section>

    <?php if (!$rows): ?>
      <div class="pqmr-empty">No managed report rows matched these filters.</div>
    <?php else: ?>
      <section class="pqmr-card" aria-label="Managed students report table">
        <table class="pqmr-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Progress</th>
              <th>Latest Unit</th>
              <th>Focus</th>
              <th>Practice</th>
              <th>Live Classes</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($rows as $row): ?>
              <?php
                $latest = $row['latest'];
                $focus = $row['focus'];
                $recordingurl = new moodle_url('/local/hubredirect/recordings.php', ['childid' => (int)$row['studentid']]);
                $quizurl = new moodle_url('/local/hubredirect/quiz_report.php', ['userid' => (int)$row['studentid'], 'pq_env' => $environment, 'lessonid' => $lessonid !== '' ? $lessonid : 'alphabet', 'unitid' => $unitid !== '' ? $unitid : 'alphabet_quiz']);
                $identitydetail = pqmr_user_identity_detail((int)$row['studentid']);
              ?>
              <tr>
                <td data-label="Student">
                  <span class="pqmr-name"><?php echo s($row['name']); ?></span>
                  <span class="pqmr-muted"><?php echo s(pqh_account_no_label((int)$row['studentid'])); ?> / Moodle user #<?php echo (int)$row['studentid']; ?><?php echo $row['groupname'] !== '' ? ' - ' . s($row['groupname']) : ''; ?></span>
                  <?php if ($identitydetail !== ''): ?><span class="pqmr-muted"><?php echo s($identitydetail); ?></span><?php endif; ?>
                </td>
                <td data-label="Progress">
                  <span class="pqmr-pill"><?php echo (int)$row['completed']; ?> completed / <?php echo (int)$row['units']; ?> units</span>
                  <div class="pqmr-bar" aria-hidden="true" style="margin-top:8px"><span style="width:<?php echo (int)$row['completion']; ?>%"></span></div>
                  <span class="pqmr-muted"><?php echo (int)$row['completion']; ?>% of recorded steps</span>
                </td>
                <td data-label="Latest Unit">
                  <?php if ($latest): ?>
                    <span class="pqmr-name"><?php echo s(($latest->lesson_title ?: $latest->lessonid) . ' / ' . ($latest->unit_title ?: $latest->unitid)); ?></span>
                    <span class="pqmr-muted"><?php echo s(str_replace('_', ' ', (string)$latest->overall_status)); ?><?php echo !empty($latest->overall_lastactivity) ? ' - ' . userdate((int)$latest->overall_lastactivity, get_string('strftimedatetimeshort')) : ''; ?></span>
                  <?php else: ?>
                    <span class="pqmr-muted">No unit progress yet</span>
                  <?php endif; ?>
                </td>
                <td data-label="Focus">
                  <span class="pqmr-name"><?php echo s(pqmr_format_duration((int)floor(((int)$focus['active_ms']) / 1000))); ?></span>
                  <span class="pqmr-muted"><?php echo (int)$focus['idle_count']; ?> idle, <?php echo (int)$focus['leave_count']; ?> away<?php echo (int)$focus['last_time'] > 0 ? ' - ' . userdate((int)$focus['last_time'], get_string('strftimedatetimeshort')) : ''; ?></span>
                </td>
                <td data-label="Practice">
                  <span class="pqmr-pill"><?php echo (int)$row['speak']; ?> speak</span>
                  <span class="pqmr-pill"><?php echo (int)$row['submit']; ?> uploads</span>
                  <span class="pqmr-pill"><?php echo (int)$row['quiz']; ?> quizzes</span>
                </td>
                <td data-label="Live Classes">
                  <span class="pqmr-name"><?php echo (int)$row['live']['sessions']; ?> sessions</span>
                  <span class="pqmr-muted"><?php echo (int)$row['live']['present']; ?> present, <?php echo (int)$row['live']['absent']; ?> absent</span>
                </td>
                <td data-label="Links">
                  <a class="pqmr-btn" href="<?php echo $quizurl->out(false); ?>">Quiz</a>
                  <a class="pqmr-btn" href="<?php echo $recordingurl->out(false); ?>">Recordings</a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
