<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->libdir . '/ddllib.php');
require_once($CFG->libdir . '/externallib.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_catalog.php');

$pqhconsumercontext = pqh_requested_consumer_context();
$pqhrequestedslug = (string)($pqhconsumercontext->consumerslug ?? '');
$pqhrequestedtype = (string)($pqhconsumercontext->consumer_type ?? '');
if ($pqhrequestedslug !== 'quraan-academy'
        && pqh_can_manage_academy_operations((int)$USER->id)) {
    $params = [];
    if ($pqhrequestedslug !== '') {
        $params['consumer'] = $pqhrequestedslug;
    }
    $workspaceid = (int)($pqhconsumercontext->workspaceid ?? 0);
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    redirect(new moodle_url('/local/hubredirect/role_redirect.php', $params));
}
if ($pqhrequestedslug === '' || $pqhrequestedtype === 'platform_foundation') {
    $pqhconsumercontext = pqh_consumer_context_by_slug('quraan-academy');
}
$pqhbrandname = trim((string)($pqhconsumercontext->consumername ?? ''));
if ($pqhbrandname === '') {
    $pqhbrandname = 'EduPlatform';
}
$pqhcopy = json_decode((string)($pqhconsumercontext->copyjson ?? ''), true);
if (!is_array($pqhcopy)) {
    $pqhcopy = [];
}
$pqhbrandinitials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', (string)($pqhcopy['brand_initials'] ?? '')) ?: '', 0, 4));
if ($pqhbrandinitials === '') {
    $pqhbrandinitials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $pqhbrandname) ?: 'EP', 0, 2));
}

$context = context_system::instance();
$PAGE->set_context($context);
$pqhpageparams = [];
if ((string)($pqhconsumercontext->consumerslug ?? '') !== '') {
    $pqhpageparams['consumer'] = (string)$pqhconsumercontext->consumerslug;
}
if ((int)($pqhconsumercontext->workspaceid ?? 0) > 0) {
    $pqhpageparams['workspaceid'] = (int)$pqhconsumercontext->workspaceid;
}
$PAGE->set_url(new moodle_url('/local/hubredirect/dashboard.php', $pqhpageparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($pqhbrandname . ' Dashboard');
$PAGE->set_heading($pqhbrandname . ' Dashboard');
$PAGE->add_body_class('pqh-dashboard-page');

function pqh_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqh_table_has_field(string $table, string $field): bool {
    global $DB;
    $dbman = $DB->get_manager();
    $xtable = new xmldb_table($table);
    if (!$dbman->table_exists($xtable)) {
        return false;
    }
    if ($dbman->field_exists($xtable, new xmldb_field($field))) {
        return true;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqh_is_managed_student(int $userid): bool {
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

function pqh_is_student_account(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_is_managed_student($userid)) {
        return true;
    }
    if (pqh_table_exists('local_prequran_student_profile')
        && $DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
        return true;
    }

    $user = core_user::get_user($userid, 'id,username,email,idnumber,deleted', IGNORE_MISSING);
    if (!$user || !empty($user->deleted)) {
        return false;
    }

    $idnumber = strtoupper(trim((string)($user->idnumber ?? '')));
    if ($idnumber !== '' && preg_match('/^(EA-)?STU[-_]/', $idnumber)) {
        return true;
    }

    $username = strtolower(trim((string)($user->username ?? '')));
    if ($username !== '' && preg_match('/(^|[._-])student([._-]|$)/', $username)) {
        return true;
    }

    $email = strtolower(trim((string)($user->email ?? '')));
    return $email !== '' && preg_match('/(^|[._-])student[0-9._-]*@/', $email);
}

function pqh_has_academy_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_class_group')
        && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = ? AND status <> ?', [$userid, 'cancelled'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', ['userid' => $userid, 'role' => 'teacher', 'status' => 'active'])) {
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

function pqh_has_marketplace_teacher_profile(int $userid): bool {
    global $DB;
    if ($userid <= 0 || !pqh_table_exists('local_prequran_teacher_profile')) {
        return false;
    }
    return $DB->record_exists_select(
        'local_prequran_teacher_profile',
        'userid = ? AND LOWER(status) NOT IN (?, ?, ?)',
        [$userid, 'archived', 'inactive', 'rejected']
    );
}

function pqh_has_teacher_role(int $userid): bool {
    return pqh_has_academy_teacher_role($userid) || pqh_has_marketplace_teacher_profile($userid);
}

function pqh_has_parent_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_table_exists('local_prequran_comm_participant')
        && $DB->record_exists('local_prequran_comm_participant', ['userid' => $userid, 'role' => 'parent'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid])) {
        return true;
    }
    return false;
}

function pqh_has_referrer_role(int $userid): bool {
    global $DB;
    if ($userid <= 0 || !pqh_table_exists('local_prequran_referrer')) {
        return false;
    }
    return $DB->record_exists_select(
        'local_prequran_referrer',
        'userid = ? AND LOWER(status) NOT IN (?, ?, ?)',
        [$userid, 'archived', 'inactive', 'blocked']
    );
}

function pqh_has_sqa_tester_role(int $userid): bool {
    return pqh_is_sqa_tester($userid);
}

function pqh_user_role(int $userid): string {
    if (is_siteadmin($userid)) {
        return 'admin';
    }
    if (pqh_is_school_principal($userid)) {
        return 'school_principal';
    }
    if (pqh_has_sqa_tester_role($userid)) {
        return 'sqa_tester';
    }
    if (pqh_has_teacher_role($userid)) {
        return 'teacher';
    }
    if (pqh_has_parent_role($userid)) {
        return 'parent';
    }
    if (pqh_has_referrer_role($userid)) {
        return 'referrer';
    }
    if (pqh_is_student_account($userid)) {
        return 'student';
    }
    return 'parent';
}

function pqh_primary_workspace_admin_dashboard_id(int $userid): int {
    if ($userid <= 0 || is_siteadmin($userid)) {
        return 0;
    }
    foreach (pqh_user_workspaces($userid) as $workspace) {
        $role = (string)($workspace->workspace_role ?? '');
        if (in_array($role, ['owner', 'admin'], true)) {
            return (int)$workspace->id;
        }
    }
    return 0;
}

function pqh_parent_children(int $parentid): array {
    global $DB;
    $children = [];

    if (pqh_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = ['studentid' => $studentid, 'cohortid' => 0, 'groupid' => 0];
            }
        }
    }

    if (pqh_table_exists('local_prequran_live_consent')) {
        $rows = $DB->get_records('local_prequran_live_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0 && !isset($children[$studentid])) {
                $children[$studentid] = ['studentid' => $studentid, 'cohortid' => 0, 'groupid' => 0];
            }
        }
    }

    if (pqh_table_exists('local_prequran_comm_participant') && pqh_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT t.studentid, MAX(t.cohortid) AS cohortid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid IS NOT NULL
           GROUP BY t.studentid",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = [
                    'studentid' => $studentid,
                    'cohortid' => (int)$row->cohortid,
                    'groupid' => 0,
                ];
            }
        }
    }

    foreach ($children as $studentid => $child) {
        $user = core_user::get_user($studentid);
        $children[$studentid]['name'] = $user ? fullname($user) : 'Student ' . $studentid;
        $children[$studentid]['groupid'] = (int)($children[$studentid]['groupid'] ?? 0);
        $children[$studentid]['groupname'] = '';
        if (pqh_table_exists('local_prequran_group_member') && pqh_table_exists('local_prequran_class_group')) {
            $group = $DB->get_record_sql(
                "SELECT cg.id, cg.title
                   FROM {local_prequran_group_member} gm
                   JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
                  WHERE gm.studentid = :studentid
                    AND gm.assignment_status = :status
               ORDER BY gm.timemodified DESC, gm.id DESC",
                ['studentid' => $studentid, 'status' => 'active'],
                IGNORE_MULTIPLE
            );
            if ($group) {
                $children[$studentid]['groupid'] = (int)$group->id;
                $children[$studentid]['groupname'] = (string)$group->title;
            }
        }
        if (empty($children[$studentid]['cohortid'])) {
            $cohortid = $DB->get_field_sql(
                "SELECT cohortid FROM {cohort_members} WHERE userid = ? ORDER BY id DESC",
                [$studentid],
                IGNORE_MULTIPLE
            );
            $children[$studentid]['cohortid'] = $cohortid ? (int)$cohortid : 0;
        }
    }

    return array_values($children);
}

function pqh_teacher_students(int $teacherid): array {
    global $DB;
    $students = [];
    $explicitassignments = false;

    if (pqh_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records_sql(
            "SELECT studentid, MAX(cohortid) AS cohortid
               FROM {local_prequran_teacher_student}
              WHERE teacherid = :teacherid
                AND status = :status
           GROUP BY studentid",
            ['teacherid' => $teacherid, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $explicitassignments = true;
                $students[$studentid] = [
                    'studentid' => $studentid,
                    'cohortid' => (int)$row->cohortid,
                    'groupid' => 0,
                    'groupname' => '',
                ];
            }
        }
    }

    if (pqh_table_exists('local_prequran_group_member') && pqh_table_exists('local_prequran_class_group')) {
        $rows = $DB->get_records_sql(
            "SELECT gm.studentid, gm.groupid, cg.title
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE cg.teacherid = :teacherid
                AND gm.assignment_status = :assignmentstatus
                AND cg.status <> :archived
           ORDER BY cg.title ASC, gm.timemodified DESC",
            [
                'teacherid' => $teacherid,
                'assignmentstatus' => 'active',
                'archived' => 'archived',
            ]
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid <= 0) {
                continue;
            }
            $explicitassignments = true;
            if (!isset($students[$studentid])) {
                $students[$studentid] = [
                    'studentid' => $studentid,
                    'cohortid' => 0,
                ];
            }
            $students[$studentid]['groupid'] = (int)$row->groupid;
            $students[$studentid]['groupname'] = (string)$row->title;
        }
    }

    if (!$explicitassignments) {
        $teachercohorts = $DB->get_records('cohort_members', ['userid' => $teacherid], '', 'id, cohortid');
        foreach ($teachercohorts as $membership) {
            $cohortid = (int)$membership->cohortid;
            if ($cohortid <= 0) {
                continue;
            }
            $members = $DB->get_records('cohort_members', ['cohortid' => $cohortid], '', 'userid, cohortid');
            foreach ($members as $member) {
                $studentid = (int)$member->userid;
                if ($studentid <= 0 || $studentid === $teacherid || !pqh_is_managed_student($studentid)) {
                    continue;
                }
                if (!isset($students[$studentid])) {
                    $students[$studentid] = [
                        'studentid' => $studentid,
                        'cohortid' => $cohortid,
                    ];
                }
            }
        }
    }

    foreach ($students as $studentid => $student) {
        $user = core_user::get_user($studentid);
        $students[$studentid]['name'] = $user ? fullname($user) : 'Student ' . $studentid;
        $students[$studentid]['username'] = $user ? (string)$user->username : '';
        $students[$studentid]['email'] = $user ? (string)$user->email : '';
        $students[$studentid]['groupid'] = (int)($students[$studentid]['groupid'] ?? 0);
        $students[$studentid]['groupname'] = (string)($students[$studentid]['groupname'] ?? '');
        if (empty($students[$studentid]['cohortid'])) {
            $cohortid = $DB->get_field_sql(
                "SELECT cohortid FROM {cohort_members} WHERE userid = ? ORDER BY id DESC",
                [$studentid],
                IGNORE_MULTIPLE
            );
            $students[$studentid]['cohortid'] = $cohortid ? (int)$cohortid : 0;
        }
        if ($students[$studentid]['groupname'] === '' && !empty($students[$studentid]['cohortid'])) {
            $cohortname = $DB->get_field('cohort', 'name', ['id' => (int)$students[$studentid]['cohortid']]);
            $students[$studentid]['groupname'] = $cohortname ? (string)$cohortname : 'Group ' . (int)$students[$studentid]['cohortid'];
        }
    }

    uasort($students, function($a, $b) {
        return strcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? ''));
    });

    return array_values($students);
}

function pqh_filter_students(array $students, string $search, int $groupid): array {
    $search = trim(core_text::strtolower($search));
    $filtered = [];

    foreach ($students as $student) {
        $studentgroupid = (int)($student['groupid'] ?? 0);
        if ($studentgroupid <= 0) {
            $studentgroupid = (int)($student['cohortid'] ?? 0);
        }
        if ($groupid > 0 && $studentgroupid !== $groupid) {
            continue;
        }
        if ($search !== '') {
            $haystack = implode(' ', [
                (string)($student['studentid'] ?? ''),
                (string)($student['name'] ?? ''),
                (string)($student['username'] ?? ''),
                (string)($student['email'] ?? ''),
                (string)($student['groupname'] ?? ''),
                (string)($student['groupid'] ?? ''),
                (string)($student['cohortid'] ?? ''),
            ]);
            if (strpos(core_text::strtolower($haystack), $search) === false) {
                continue;
            }
        }
        $filtered[] = $student;
    }

    return $filtered;
}

function pqh_student_groups(array $students): array {
    $groups = [];
    foreach ($students as $student) {
        $newgroupid = (int)($student['groupid'] ?? 0);
        if ($newgroupid > 0) {
            $groups[$newgroupid] = (string)($student['groupname'] ?? ('Group ' . $newgroupid));
            continue;
        }
        $cohortid = (int)($student['cohortid'] ?? 0);
        if ($cohortid <= 0) {
            continue;
        }
        $groups[$cohortid] = (string)($student['groupname'] ?? ('Group ' . $cohortid));
    }
    natcasesort($groups);
    return $groups;
}

function pqh_short_user_name(int $userid): string {
    if ($userid <= 0) {
        return '';
    }
    $user = core_user::get_user($userid, 'id,firstname,lastname,alternatename,firstnamephonetic,lastnamephonetic,middlename,email,username,deleted', IGNORE_MISSING);
    if (!$user || !empty($user->deleted)) {
        return '';
    }
    return fullname($user);
}

function pqh_join_nonempty(array $values, string $separator = ', '): string {
    $clean = [];
    foreach ($values as $value) {
        $value = trim((string)$value);
        if ($value !== '') {
            $clean[] = $value;
        }
    }
    return implode($separator, array_values(array_unique($clean)));
}

function pqh_student_course_support_context(int $studentid): array {
    global $DB;

    $context = [
        'teacher' => '',
        'parent' => '',
        'country' => '',
        'city' => '',
        'timezone' => '',
        'groups' => '',
        'recurring' => '',
        'level' => '',
        'language' => '',
        'status' => '',
        'support' => '',
    ];
    if ($studentid <= 0) {
        return $context;
    }

    $profile = null;
    if (pqh_table_exists('local_prequran_student_profile')) {
        $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
        if ($profile) {
            $context['parent'] = pqh_join_nonempty([(string)($profile->parent_name ?? ''), (string)($profile->parent_email ?? ''), (string)($profile->parent_phone ?? '')]);
            $context['country'] = (string)($profile->country ?? '');
            $context['city'] = (string)($profile->city ?? '');
            $context['timezone'] = (string)($profile->timezone ?? '');
            $context['level'] = (string)($profile->current_level ?? '');
            $context['language'] = pqh_join_nonempty([(string)($profile->primary_language ?? ''), (string)($profile->language ?? '')]);
            $context['status'] = (string)($profile->status ?? '');
        }
    }

    $parentnames = [];
    if (pqh_table_exists('local_prequran_live_consent')) {
        $rows = $DB->get_records('local_prequran_live_consent', ['studentid' => $studentid], 'timemodified DESC', 'id, guardianid', 0, 5);
        foreach ($rows as $row) {
            $name = pqh_short_user_name((int)$row->guardianid);
            if ($name !== '') {
                $parentnames[] = $name;
            }
        }
    }
    if (pqh_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['studentid' => $studentid], 'timemodified DESC', 'id, guardianid', 0, 5);
        foreach ($rows as $row) {
            $name = pqh_short_user_name((int)$row->guardianid);
            if ($name !== '') {
                $parentnames[] = $name;
            }
        }
    }
    if ($parentnames) {
        $context['parent'] = pqh_join_nonempty(array_merge($parentnames, [$context['parent']]));
    }

    $groupnames = [];
    $teachernames = [];
    $grouptimezones = [];
    $groupplaces = [];
    if (pqh_table_exists('local_prequran_group_member') && pqh_table_exists('local_prequran_class_group')) {
        $groups = $DB->get_records_sql(
            "SELECT cg.*
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE gm.studentid = :studentid
                AND gm.assignment_status = :assignmentstatus
                AND cg.status <> :archived
           ORDER BY gm.timemodified DESC, cg.title ASC",
            [
                'studentid' => $studentid,
                'assignmentstatus' => 'active',
                'archived' => 'archived',
            ],
            0,
            5
        );
        foreach ($groups as $group) {
            $groupnames[] = (string)$group->title;
            $teachername = pqh_short_user_name((int)$group->teacherid);
            if ($teachername !== '') {
                $teachernames[] = $teachername;
            }
            $grouptimezones[] = (string)($group->timezone ?? '');
            $groupplaces[] = pqh_join_nonempty([(string)($group->country ?? ''), (string)($group->city ?? '')]);
            if ($context['level'] === '') {
                $context['level'] = (string)($group->current_level ?? '');
            }
            if ($context['language'] === '') {
                $context['language'] = (string)($group->language ?? '');
            }
        }
    }

    if (pqh_table_exists('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', ['studentid' => $studentid, 'status' => 'active'], 'timemodified DESC', 'id, teacherid', 0, 5);
        foreach ($rows as $row) {
            $teachername = pqh_short_user_name((int)$row->teacherid);
            if ($teachername !== '') {
                $teachernames[] = $teachername;
            }
        }
    }

    $serieslabels = [];
    if (pqh_table_exists('local_prequran_live_series')) {
        $seriesparams = ['studentid' => $studentid, 'active' => 'active'];
        if (pqh_table_exists('local_prequran_live_session')
            && pqh_table_exists('local_prequran_live_participant')
            && pqh_table_has_field('local_prequran_live_series', 'groupid')) {
            $seriesparams = [
                'studentidgroup' => $studentid,
                'studentidgroupwhere' => $studentid,
                'studentidparticipant' => $studentid,
                'active' => 'active',
            ];
            $seriessql = "SELECT DISTINCT s.*
                            FROM {local_prequran_live_series} s
                       LEFT JOIN {local_prequran_live_session} ls ON ls.seriesid = s.id
                       LEFT JOIN {local_prequran_live_participant} p ON p.sessionid = ls.id
                       LEFT JOIN {local_prequran_group_member} gm ON gm.groupid = s.groupid AND gm.studentid = :studentidgroup
                           WHERE s.status = :active
                             AND (p.studentid = :studentidparticipant OR gm.studentid = :studentidgroupwhere)
                        ORDER BY s.date_start DESC, s.id DESC";
        } else if (pqh_table_has_field('local_prequran_live_series', 'groupid') && pqh_table_exists('local_prequran_group_member')) {
            $seriessql = "SELECT DISTINCT s.*
                            FROM {local_prequran_live_series} s
                            JOIN {local_prequran_group_member} gm ON gm.groupid = s.groupid
                           WHERE s.status = :active
                             AND gm.studentid = :studentid
                        ORDER BY s.date_start DESC, s.id DESC";
        } else if (pqh_table_exists('local_prequran_live_session') && pqh_table_exists('local_prequran_live_participant')) {
            $seriessql = "SELECT DISTINCT s.*
                            FROM {local_prequran_live_series} s
                            JOIN {local_prequran_live_session} ls ON ls.seriesid = s.id
                            JOIN {local_prequran_live_participant} p ON p.sessionid = ls.id
                           WHERE s.status = :active
                             AND p.studentid = :studentid
                        ORDER BY s.date_start DESC, s.id DESC";
        } else {
            $seriessql = '';
        }
        $seriesrows = $seriessql !== '' ? $DB->get_records_sql($seriessql, $seriesparams, 0, 4) : [];
        foreach ($seriesrows as $series) {
            $teachername = pqh_short_user_name((int)$series->teacherid);
            if ($teachername !== '') {
                $teachernames[] = $teachername;
            }
            $label = trim((string)$series->title);
            $time = trim((string)($series->start_time ?? ''));
            $weekdays = trim((string)($series->weekdays ?? ''));
            $parts = [$label !== '' ? $label : 'Series #' . (int)$series->id];
            if ($weekdays !== '') {
                $parts[] = $weekdays;
            }
            if ($time !== '') {
                $parts[] = $time;
            }
            $serieslabels[] = implode(' - ', $parts);
        }
    }

    $context['teacher'] = pqh_join_nonempty($teachernames);
    $context['groups'] = pqh_join_nonempty($groupnames);
    $context['recurring'] = pqh_join_nonempty($serieslabels, '; ');
    if ($context['timezone'] === '') {
        $context['timezone'] = pqh_join_nonempty($grouptimezones);
    }
    if ($context['country'] === '' || $context['city'] === '') {
        $place = pqh_join_nonempty($groupplaces);
        if ($context['country'] === '' && $context['city'] === '') {
            $context['country'] = $place;
        }
    }

    $context['support'] = pqh_join_nonempty([
        $context['level'] !== '' ? 'Level: ' . $context['level'] : '',
        $context['language'] !== '' ? 'Language: ' . $context['language'] : '',
        $context['status'] !== '' ? 'Status: ' . $context['status'] : '',
    ], ' | ');

    return $context;
}

function pqh_progress_summary(int $studentid): array {
    global $DB;
    $summary = [
        'units' => 0,
        'completed' => 0,
        'inprogress' => 0,
        'stars' => 0,
        'latest' => null,
    ];
    if (!pqh_table_exists('local_prequran_lessonprog')) {
        return $summary;
    }

    $summary['units'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid]);
    $summary['completed'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'completed']);
    $summary['inprogress'] = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'in_progress']);
    $summary['stars'] = (int)$DB->get_field_sql(
        "SELECT COALESCE(SUM(steps_completed), 0) FROM {local_prequran_lessonprog} WHERE userid = ?",
        [$studentid]
    );
    $latest = $DB->get_record_sql(
        "SELECT lesson_title, unit_title, overall_status, overall_lastactivity, completion_percent
           FROM {local_prequran_lessonprog}
          WHERE userid = ?
       ORDER BY overall_lastactivity DESC, timemodified DESC",
        [$studentid],
        IGNORE_MULTIPLE
    );
    if ($latest) {
        $summary['latest'] = $latest;
    }
    return $summary;
}

function pqh_message_summary(int $userid): array {
    global $DB;
    $summary = ['threads' => 0, 'unread' => 0, 'latest' => ''];
    if (!pqh_table_exists('local_prequran_comm_participant') || !pqh_table_exists('local_prequran_comm_thread')) {
        return $summary;
    }
    $rows = $DB->get_records_sql(
        "SELECT t.id,
                t.subject,
                t.lastmessageat,
                COALESCE(MAX(m.id), 0) AS lastmessageid,
                p.lastreadmessageid
           FROM {local_prequran_comm_thread} t
           JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
      LEFT JOIN {local_prequran_comm_message} m
             ON m.threadid = t.id
            AND m.status = :messagestatus
          WHERE p.userid = :userid
            AND t.type = :type
            AND t.status = :status
       GROUP BY t.id, t.subject, t.lastmessageat, p.lastreadmessageid
       ORDER BY t.lastmessageat DESC",
        ['userid' => $userid, 'type' => 'parent_teacher', 'status' => 'active', 'messagestatus' => 'visible'],
        0,
        10
    );
    $summary['threads'] = count($rows);
    foreach ($rows as $row) {
        if ((int)$row->lastmessageid > (int)$row->lastreadmessageid) {
            $summary['unread']++;
        }
        if ($summary['latest'] === '') {
            $summary['latest'] = (string)$row->subject;
        }
    }
    return $summary;
}

function pqh_speak_recording_summary(int $studentid): array {
    global $DB;

    $summary = [
        'tables_ready' => false,
        'count' => 0,
        'latest' => null,
    ];

    if (!pqh_table_exists('local_prequran_speakrec')) {
        return $summary;
    }

    $summary['tables_ready'] = true;
    $summary['count'] = (int)$DB->count_records_select(
        'local_prequran_speakrec',
        'userid = :userid AND status <> :failed',
        ['userid' => $studentid, 'failed' => 'upload_failed']
    );
    $summary['latest'] = $DB->get_record_sql(
        "SELECT id, lessonid, unitid, letter_name, letter_text, duration_ms, timecreated
           FROM {local_prequran_speakrec}
          WHERE userid = ?
            AND status <> ?
       ORDER BY timecreated DESC, id DESC",
        [$studentid, 'upload_failed'],
        IGNORE_MULTIPLE
    );

    return $summary;
}

function pqh_format_duration(int $ms): string {
    $minutes = (int)round($ms / 60000);
    $hours = intdiv($minutes, 60);
    $remaining = $minutes % 60;
    return $hours . 'h ' . $remaining . 'm';
}

function pqh_count_duration(int $count, int $secondsPerEvent): string {
    return pqh_format_duration(max(0, $count) * $secondsPerEvent * 1000);
}

function pqh_focus_summary(int $studentid): array {
    global $DB;

    $summary = [
        'tables_ready' => false,
        'sessions' => 0,
        'active_ms' => 0,
        'leave_count' => 0,
        'idle_count' => 0,
        'last_time' => 0,
        'latest_unit' => '',
        'focus_label' => 'No data yet',
        'focus_class' => 'neutral',
    ];

    if (!pqh_table_exists('local_prequran_focusagg')) {
        return $summary;
    }

    $summary['tables_ready'] = true;
    $row = $DB->get_record_sql(
        "SELECT COUNT(1) AS sessions,
                COALESCE(SUM(active_ms), 0) AS active_ms,
                COALESCE(SUM(leave_count), 0) AS leave_count,
                COALESCE(SUM(idle_count), 0) AS idle_count,
                COALESCE(MAX(last_time), 0) AS last_time
           FROM {local_prequran_focusagg}
          WHERE userid = ?",
        [$studentid]
    );

    if ($row) {
        $summary['sessions'] = (int)$row->sessions;
        $summary['active_ms'] = (int)$row->active_ms;
        $summary['leave_count'] = (int)$row->leave_count;
        $summary['idle_count'] = (int)$row->idle_count;
        $summary['last_time'] = (int)$row->last_time;
    }

    $latest = $DB->get_record_sql(
        "SELECT lessonid, unitid, step_id, active_ms, leave_count, idle_count, last_time
           FROM {local_prequran_focusagg}
          WHERE userid = ?
       ORDER BY last_time DESC",
        [$studentid],
        IGNORE_MULTIPLE
    );
    if ($latest) {
        $unit = trim((string)$latest->unitid);
        $step = trim((string)$latest->step_id);
        $summary['latest_unit'] = trim($unit . ($step !== '' ? ' / ' . $step : ''));
    }

    $distractions = $summary['leave_count'] + $summary['idle_count'];
    if ($summary['sessions'] <= 0) {
        $summary['focus_label'] = 'No data yet';
        $summary['focus_class'] = 'neutral';
    } else if ($distractions <= 2) {
        $summary['focus_label'] = 'Great focus';
        $summary['focus_class'] = 'great';
    } else if ($distractions <= 8) {
        $summary['focus_label'] = 'Good focus';
        $summary['focus_class'] = 'good';
    } else {
        $summary['focus_label'] = 'Needs support';
        $summary['focus_class'] = 'support';
    }

    return $summary;
}

function pqh_live_step_label(string $stepid): string {
    $stepid = trim($stepid);
    return $stepid === '' ? 'Not recorded' : ucwords(str_replace(['_', '-'], ' ', $stepid));
}

function pqh_live_child_monitoring(array $children, int $limitperschild = 3): array {
    global $DB;

    $out = [
        'ready' => false,
        'focus_ready' => false,
        'children' => [],
    ];
    if (!pqh_table_exists('local_prequran_live_session') || !pqh_table_exists('local_prequran_live_participant')) {
        return $out;
    }

    $out['ready'] = true;
    $out['focus_ready'] = pqh_table_exists('local_prequran_focusagg')
        && pqh_table_has_field('local_prequran_focusagg', 'live_sessionid');
    $limitperschild = max(1, min(5, $limitperschild));

    foreach ($children as $child) {
        $studentid = (int)($child['studentid'] ?? 0);
        if ($studentid <= 0) {
            continue;
        }

        if ($out['focus_ready']) {
            $sql = "SELECT s.id,
                           s.title,
                           s.teacherid,
                           s.lessonid,
                           s.unitid,
                           s.timezone,
                           s.scheduled_start,
                           s.scheduled_end,
                           s.status,
                           COALESCE(SUM(f.active_ms), 0) AS active_ms,
                           COALESCE(SUM(f.idle_count), 0) AS idle_count,
                           COALESCE(SUM(f.leave_count), 0) AS leave_count,
                           COALESCE(MAX(f.last_time), 0) AS last_time
                      FROM {local_prequran_live_session} s
                      JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
                 LEFT JOIN {local_prequran_focusagg} f ON f.live_sessionid = s.id AND f.userid = :focususerid
                     WHERE (p.studentid = :studentid OR p.userid = :participantuserid)
                       AND p.role = :role
                       AND p.status = :participantstatus
                       AND s.status <> :cancelled
                  GROUP BY s.id, s.title, s.teacherid, s.lessonid, s.unitid, s.timezone, s.scheduled_start, s.scheduled_end, s.status
                  ORDER BY s.scheduled_start DESC, s.id DESC";
            $rows = array_values($DB->get_records_sql($sql, [
                'focususerid' => $studentid,
                'studentid' => $studentid,
                'participantuserid' => $studentid,
                'role' => 'student',
                'participantstatus' => 'active',
                'cancelled' => 'cancelled',
            ], 0, $limitperschild));
        } else {
            $sql = "SELECT s.id,
                           s.title,
                           s.teacherid,
                           s.lessonid,
                           s.unitid,
                           s.timezone,
                           s.scheduled_start,
                           s.scheduled_end,
                           s.status
                      FROM {local_prequran_live_session} s
                      JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
                     WHERE (p.studentid = :studentid OR p.userid = :participantuserid)
                       AND p.role = :role
                       AND p.status = :participantstatus
                       AND s.status <> :cancelled
                  ORDER BY s.scheduled_start DESC, s.id DESC";
            $rows = array_values($DB->get_records_sql($sql, [
                'studentid' => $studentid,
                'participantuserid' => $studentid,
                'role' => 'student',
                'participantstatus' => 'active',
                'cancelled' => 'cancelled',
            ], 0, $limitperschild));
        }

        foreach ($rows as $row) {
            $row->studentid = $studentid;
            $row->studentname = (string)($child['name'] ?? ('Student ' . $studentid));
            $row->latest_step = '';
            if ($out['focus_ready'] && (int)($row->last_time ?? 0) > 0) {
                $latest = $DB->get_record_sql(
                    "SELECT step_id, unitid
                       FROM {local_prequran_focusagg}
                      WHERE userid = :userid
                        AND live_sessionid = :sessionid
                   ORDER BY last_time DESC, id DESC",
                    ['userid' => $studentid, 'sessionid' => (int)$row->id],
                    IGNORE_MULTIPLE
                );
                if ($latest) {
                    $row->latest_step = (string)($latest->step_id ?: $latest->unitid ?: '');
                }
            }
        }

        $out['children'][] = [
            'studentid' => $studentid,
            'name' => (string)($child['name'] ?? ('Student ' . $studentid)),
            'sessions' => $rows,
        ];
    }

    return $out;
}

function pqh_lesson_link(int $cohortid, string $opencomm = '', bool $managed = false): moodle_url {
    $params = [
        'goto' => 'alphabet_listen',
        'pq_env' => pqh_default_environment(),
    ];
    if ($cohortid > 0) {
        $params['cohortid'] = $cohortid;
    }
    $params['managed_student'] = $managed ? 1 : 0;
    if ($opencomm !== '') {
        $params['opencomm'] = $opencomm;
    }
    return new moodle_url('/local/hubredirect/issue_child.php', $params);
}

function pqh_student_lesson_link(int $userid, string $opencomm = ''): moodle_url {
    return pqh_lesson_link(0, $opencomm, pqh_is_managed_student($userid));
}

function pqh_default_environment(): string {
    global $CFG;
    $requested = strtolower(trim(optional_param('pq_env', '', PARAM_ALPHANUMEXT)));
    if (in_array($requested, ['integration', 'staging', 'production'], true)) {
        return $requested;
    }
    $configured = strtolower(trim((string)get_config('local_prequran', 'bunny_environment')));
    if (in_array($configured, ['integration', 'staging', 'production'], true)) {
        return $configured;
    }
    $host = strtolower((string)(parse_url((string)$CFG->wwwroot, PHP_URL_HOST) ?: ''));
    if ($host !== '' && (strpos($host, 'test') !== false || preg_match('/(^|[.\-])(integration|qa)([.\-]|$)/', $host))) {
        return 'integration';
    }
    if ($host !== '' && preg_match('/(^|[.\-])staging([.\-]|$)/', $host)) {
        return 'staging';
    }
    return 'production';
}

function pqh_course_launch_link(string $coursekey, int $studentid = 0): moodle_url {
    $coursekey = pqh_normalize_course_key($coursekey);
    if ($coursekey === '') {
        $coursekey = 'pre_quraan';
    }
    $params = ['course' => $coursekey];
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    return new moodle_url('/local/hubredirect/course_launch.php', $params);
}

function pqh_course_catalog_browse_link(int $workspaceid = 0): moodle_url {
    $params = [];
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    return new moodle_url('/local/hubredirect/course_catalog_browse.php', $params);
}

function pqh_course_transcript_link(int $studentid = 0, int $workspaceid = 0): moodle_url {
    $params = [];
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    return new moodle_url('/local/hubredirect/course_transcript.php', $params);
}

function pqh_enrollment_approval_link(int $studentid): moodle_url {
    return new moodle_url('/local/hubredirect/enrollment_approval.php', ['studentid' => $studentid]);
}

function pqh_enrollment_approval_status(int $studentid, int $guardianid = 0): string {
    global $DB;
    if ($studentid <= 0) {
        return 'approved';
    }
    if (pqh_table_exists('local_prequran_live_consent')) {
        $params = ['studentid' => $studentid, 'type' => 'enrollment_approval'];
        $guardiansql = '';
        if ($guardianid > 0) {
            $guardiansql = ' AND guardianid = :guardianid';
            $params['guardianid'] = $guardianid;
        }
        $approval = $DB->get_record_sql(
            "SELECT *
               FROM {local_prequran_live_consent}
              WHERE studentid = :studentid
                AND consent_type = :type
                {$guardiansql}
           ORDER BY granted DESC, timemodified DESC, id DESC",
            $params,
            IGNORE_MULTIPLE
        );
        if ($approval) {
            return (int)$approval->granted === 1 ? 'approved' : 'pending_parent';
        }
    }
    if (pqh_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
        $status = $DB->get_field('local_prequran_student_profile', 'enrollment_approval_status', ['userid' => $studentid]);
        if (is_string($status) && trim($status) !== '') {
            return strtolower(trim($status));
        }
    }
    return 'approved';
}

function pqh_communications_link(int $cohortid, string $opencomm, int $studentid = 0): moodle_url {
    $params = ['opencomm' => $opencomm];
    if ($cohortid > 0) {
        $params['cohortid'] = $cohortid;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    return new moodle_url('/local/hubredirect/communications.php', $params);
}

function pqh_recordings_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/recordings.php', ['childid' => $childid]);
}

function pqh_live_summaries_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/live_summaries.php', ['childid' => $childid]);
}

function pqh_live_trust_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/live_trust.php', ['childid' => $childid]);
}

function pqh_live_recordings_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/live_recordings.php', ['childid' => $childid]);
}

function pqh_live_sessions_link(int $workspaceid = 0): moodle_url {
    $params = [];
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    return new moodle_url('/local/hubredirect/live_sessions.php', $params);
}

function pqh_meeting_rooms_link(string $sessiontype): moodle_url {
    $titles = [
        'parent_meeting' => 'Parent Meeting Room',
        'teacher_meeting' => 'Teacher Meeting Room',
        'student_room' => 'Student Room',
        'teacher_parent_room' => 'Teacher-Parent Room',
    ];
    $sessiontype = array_key_exists($sessiontype, $titles) ? $sessiontype : 'parent_meeting';
    return new moodle_url('/local/hubredirect/live_sessions.php', [
        'session_type' => $sessiontype,
        'title' => $titles[$sessiontype],
    ]);
}

function pqh_live_schedule_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/live_schedule.php', ['childid' => $childid]);
}

function pqh_live_teacher_schedule_link(int $teacherid): moodle_url {
    return new moodle_url('/local/hubredirect/live_schedule.php', ['teacherid' => $teacherid]);
}

function pqh_live_parent_trust_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/live_parent_trust.php', ['childid' => $childid]);
}

function pqh_live_series_schedule_link(int $childid): moodle_url {
    return new moodle_url('/local/hubredirect/live_series_schedule.php', ['childid' => $childid]);
}

function pqh_live_teacher_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_teacher.php');
}

function pqh_live_admin_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_admin.php');
}

function pqh_workspace_dashboard_link(int $workspaceid = 0): moodle_url {
    $params = [];
    if ($workspaceid > 0) {
        $params['workspaceid'] = $workspaceid;
    }
    return new moodle_url('/local/hubredirect/workspace_dashboard.php', $params);
}

function pqh_workspace_student_link(int $workspaceid, int $studentid): moodle_url {
    return new moodle_url('/local/hubredirect/workspace_student.php', [
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
    ]);
}

function pqh_master_dashboard_link(): moodle_url {
    return new moodle_url('/local/hubredirect/master_dashboard.php');
}

function pqh_live_ops_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_ops.php');
}

function pqh_live_create_wizard_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_create_wizard.php');
}

function pqh_live_series_wizard_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_series_wizard.php');
}

function pqh_live_followups_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_followups.php');
}

function pqh_live_reports_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_reports.php');
}

function pqh_managed_reports_link(int $childid = 0): moodle_url {
    $params = [];
    if ($childid > 0) {
        $params['studentid'] = $childid;
    }
    return new moodle_url('/local/hubredirect/managed_reports.php', $params);
}

function pqh_unmanaged_reports_link(): moodle_url {
    return new moodle_url('/local/hubredirect/unmanaged_reports.php');
}

function pqh_live_parent_links_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_parent_links.php');
}

function pqh_teacher_marketplace_link(): moodle_url {
    return new moodle_url('/local/hubredirect/teacher_marketplace.php', ['consumer' => 'edu-for-tomorrow']);
}

function pqh_teacher_marketplace_requests_link(): moodle_url {
    return new moodle_url('/local/hubredirect/teacher_marketplace_requests.php', ['consumer' => 'edu-for-tomorrow']);
}

function pqh_referrers_link(): moodle_url {
    return new moodle_url('/local/hubredirect/referrers.php');
}

function pqh_quiz_report_link(int $childid = 0): moodle_url {
    $params = ['pq_env' => 'integration', 'lessonid' => 'alphabet', 'unitid' => 'alphabet_quiz'];
    if ($childid > 0) {
        $params['userid'] = $childid;
    }
    return new moodle_url('/local/hubredirect/quiz_report.php', $params);
}

function pqh_virtual_tutor_link(int $studentid): moodle_url {
    return new moodle_url('/local/hubredirect/virtual_tutor.php', ['studentid' => $studentid]);
}

function pqh_sql_tools_link(): moodle_url {
    return new moodle_url('/local/hubredirect/sql_tools.php');
}

function pqh_live_teacher_directory_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_teacher_directory.php');
}

function pqh_live_capacity_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_capacity.php');
}

function pqh_live_grouping_link(): moodle_url {
    return new moodle_url('/local/hubredirect/live_grouping.php');
}

function pqh_student_intake_link(): moodle_url {
    return new moodle_url('/local/hubredirect/student_intake.php');
}

function pqh_hub_link(string $path, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/' . ltrim($path, '/'), $params);
}

function pqh_current_user_ws_token(): string {
    global $DB;

    try {
        $service = $DB->get_record('external_services', [
            'shortname' => 'prequran_ws',
            'enabled' => 1,
        ]);
        if (!$service || !function_exists('external_generate_token_for_current_user')) {
            return '';
        }

        $token = external_generate_token_for_current_user($service);
        if (is_object($token) && !empty($token->token)) {
            return (string)$token->token;
        }
    } catch (Throwable $e) {
        return '';
    }

    return '';
}

function pqh_normalize_environment(string $value): string {
    $value = strtolower(trim($value));
    if (in_array($value, ['integration', 'int', 'qa'], true)) {
        return 'integration';
    }
    if (in_array($value, ['staging', 'stage'], true)) {
        return 'staging';
    }
    return 'production';
}

function pqh_step_config_can_edit(string $role): bool {
    return $role === 'admin';
}

function pqh_step_config_allowed_environment(string $environment): bool {
    return in_array($environment, ['integration', 'staging'], true);
}

function pqh_step_config_rows(string $environment, string $lessonid, string $unitid): array {
    global $DB;

    if (!pqh_table_exists('local_prequran_stepcfg') || !pqh_table_has_field('local_prequran_stepcfg', 'environment')) {
        return [];
    }
    if (!pqh_step_config_allowed_environment($environment) || $lessonid === '' || $unitid === '') {
        return [];
    }

    return array_values($DB->get_records(
        'local_prequran_stepcfg',
        [
            'environment' => $environment,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'active' => 1,
        ],
        'step_index ASC, id ASC',
        'id, lessonid, unitid, step_index, step_id, step_title, default_passes_required, default_repeats_per_letter, active, environment'
    ));
}

function pqh_update_step_config_progress(string $environment, string $lessonid, string $unitid, string $stepid, int $passes, int $repeats): int {
    global $DB;

    if (!pqh_table_exists('local_prequran_stepprog')) {
        return 0;
    }

    $conditions = [
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'step_id' => $stepid,
    ];
    if (pqh_table_has_field('local_prequran_stepprog', 'environment')) {
        $conditions['environment'] = $environment;
    }

    $rows = $DB->get_records('local_prequran_stepprog', $conditions);
    $count = 0;
    foreach ($rows as $row) {
        if (pqh_table_has_field('local_prequran_stepprog', 'passes_required')) {
            $row->passes_required = $passes;
        }
        if (pqh_table_has_field('local_prequran_stepprog', 'repeats_per_letter')) {
            $row->repeats_per_letter = $repeats;
        }
        if (pqh_table_has_field('local_prequran_stepprog', 'passes_done')
                && isset($row->passes_done)
                && (int)$row->passes_done > $passes
                && (string)($row->step_status ?? '') !== 'completed') {
            $row->passes_done = $passes;
        }
        if (pqh_table_has_field('local_prequran_stepprog', 'timemodified')) {
            $row->timemodified = time();
        }
        $DB->update_record('local_prequran_stepprog', $row);
        $count++;
    }

    return $count;
}

function pqh_update_step_config(string $role, string $environment, string $lessonid, string $unitid, string $stepid, int $passes, int $repeats): array {
    global $DB;

    if (!pqh_step_config_can_edit($role)) {
        return ['type' => 'error', 'message' => 'Only teachers and administrators can update QA step configuration.'];
    }
    if (!pqh_step_config_allowed_environment($environment)) {
        return ['type' => 'error', 'message' => 'Step configuration can only be edited for integration or staging.'];
    }
    if (!pqh_table_exists('local_prequran_stepcfg') || !pqh_table_has_field('local_prequran_stepcfg', 'environment')) {
        return ['type' => 'error', 'message' => 'The step configuration table is not environment-aware yet.'];
    }
    if ($lessonid === '' || $unitid === '' || $stepid === '') {
        return ['type' => 'error', 'message' => 'Lesson, unit, and step are required.'];
    }

    $passes = max(1, min(100, $passes));
    $repeats = max(1, min(100, $repeats));

    $record = $DB->get_record('local_prequran_stepcfg', [
        'environment' => $environment,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'step_id' => $stepid,
        'active' => 1,
    ], '*', IGNORE_MISSING);

    if (!$record && ctype_digit($stepid)) {
        $record = $DB->get_record('local_prequran_stepcfg', [
            'environment' => $environment,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_index' => (int)$stepid,
            'active' => 1,
        ], '*', IGNORE_MISSING);
    }

    if (!$record) {
        return ['type' => 'error', 'message' => 'No active step configuration row matched that environment, lesson, unit, and step.'];
    }

    $record->default_passes_required = $passes;
    $record->default_repeats_per_letter = $repeats;
    if (pqh_table_has_field('local_prequran_stepcfg', 'timemodified')) {
        $record->timemodified = time();
    }
    $DB->update_record('local_prequran_stepcfg', $record);

    $progressrows = pqh_update_step_config_progress($environment, $lessonid, $unitid, (string)$record->step_id, $passes, $repeats);

    return [
        'type' => 'success',
        'message' => sprintf(
            'Updated %s / %s / %s in %s. Existing progress rows refreshed: %d.',
            $lessonid,
            $unitid,
            (string)$record->step_id,
            $environment,
            $progressrows
        ),
    ];
}

function pqh_sql_table(string $name): string {
    global $CFG;
    return preg_replace('/[^a-zA-Z0-9_]/', '', (string)$CFG->prefix . $name);
}

function pqh_step_progress_cleanup_sql(string $environment): string {
    $environment = pqh_normalize_environment($environment);
    if (!pqh_step_config_allowed_environment($environment)) {
        return "-- Production step progress cleanup is blocked from this tool.\n"
            . "-- Use a reviewed backup-and-approval runbook before touching production learner progress.\n";
    }

    $lessonprog = pqh_sql_table('local_prequran_lessonprog');
    $stepprog = pqh_sql_table('local_prequran_stepprog');
    $preferences = pqh_sql_table('user_preferences');

    return "-- Pre-Quraan step progress cleanup for {$environment}.\n"
        . "-- Preview first, then run the transaction if the counts match your intent.\n\n"
        . "SELECT 'lessonprog' AS table_name, COUNT(*) AS rows_count\n"
        . "FROM {$lessonprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "SELECT 'stepprog' AS table_name, COUNT(*) AS rows_count\n"
        . "FROM {$stepprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "-- Legacy Moodle user preference snapshots are not environment-scoped.\n"
        . "-- On quraantest/staging databases this removes Pre-Quraan state snapshots for that non-production site.\n"
        . "SELECT 'user_preferences' AS table_name, COUNT(*) AS rows_count\n"
        . "FROM {$preferences}\n"
        . "WHERE name REGEXP '^prequran_.*_state_v1$';\n\n"
        . "START TRANSACTION;\n\n"
        . "DELETE FROM {$stepprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "DELETE FROM {$lessonprog}\n"
        . "WHERE BINARY environment = BINARY '{$environment}';\n\n"
        . "DELETE FROM {$preferences}\n"
        . "WHERE name REGEXP '^prequran_.*_state_v1$';\n\n"
        . "COMMIT;\n";
}

$role = pqh_user_role((int)$USER->id);
$workspaceadminid = pqh_primary_workspace_admin_dashboard_id((int)$USER->id);
if ($workspaceadminid > 0) {
    redirect(new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceadminid]));
}
$qaStepConfigCanEdit = pqh_step_config_can_edit($role);
$qaStepConfigEnv = pqh_normalize_environment(optional_param('qa_env', 'integration', PARAM_ALPHANUMEXT));
if (!pqh_step_config_allowed_environment($qaStepConfigEnv)) {
    $qaStepConfigEnv = 'integration';
}
$qaStepConfigLesson = trim(optional_param('qa_lessonid', 'alphabet', PARAM_ALPHANUMEXT));
$qaStepConfigUnit = trim(optional_param('qa_unitid', 'alphabet_listen', PARAM_ALPHANUMEXT));
$qaStepConfigMessage = null;

if ($qaStepConfigCanEdit && optional_param('pqh_action', '', PARAM_ALPHANUMEXT) === 'update_step_config') {
    if (!confirm_sesskey()) {
        $qaStepConfigMessage = ['type' => 'error', 'message' => 'Session key expired. Refresh the dashboard and try again.'];
    } else {
        $qaStepConfigEnv = pqh_normalize_environment(required_param('qa_env', PARAM_ALPHANUMEXT));
        $qaStepConfigLesson = trim(required_param('qa_lessonid', PARAM_ALPHANUMEXT));
        $qaStepConfigUnit = trim(required_param('qa_unitid', PARAM_ALPHANUMEXT));
        $qaStepConfigMessage = pqh_update_step_config(
            $role,
            $qaStepConfigEnv,
            $qaStepConfigLesson,
            $qaStepConfigUnit,
            trim(required_param('qa_step_id', PARAM_RAW_TRIMMED)),
            required_param('qa_passes', PARAM_INT),
            required_param('qa_repeats', PARAM_INT)
        );
    }
}
$qaStepConfigRows = $qaStepConfigCanEdit ? pqh_step_config_rows($qaStepConfigEnv, $qaStepConfigLesson, $qaStepConfigUnit) : [];
$sqlToolsCanView = false;
$sqlCleanupIntegration = pqh_step_progress_cleanup_sql('integration');
$sqlCleanupStaging = pqh_step_progress_cleanup_sql('staging');
$sqlCleanupProductionBlocked = pqh_step_progress_cleanup_sql('production');
$isacademyteacher = $role === 'teacher' && pqh_has_academy_teacher_role((int)$USER->id);
$ismarketplaceteacher = $role === 'teacher' && !$isacademyteacher && pqh_has_marketplace_teacher_profile((int)$USER->id);
$studentsearch = $isacademyteacher ? optional_param('studentq', '', PARAM_TEXT) : '';
$studentgroupid = $isacademyteacher ? optional_param('groupid', 0, PARAM_INT) : 0;
$studentgroups = [];
$allchildren = [];
$children = [];
if ($role === 'parent') {
    $children = pqh_parent_children((int)$USER->id);
} else if ($isacademyteacher) {
    $allchildren = pqh_teacher_students((int)$USER->id);
    $studentgroups = pqh_student_groups($allchildren);
    $children = pqh_filter_students($allchildren, $studentsearch, $studentgroupid);
}
$selectedchildid = optional_param('childid', 0, PARAM_INT);
if (!$selectedchildid && $children) {
    $selectedchildid = (int)$children[0]['studentid'];
}
$selectedchild = null;
foreach ($children as $child) {
    if ((int)$child['studentid'] === $selectedchildid) {
        $selectedchild = $child;
        break;
    }
}
$currentstudentcourses = $role === 'student' ? pqh_user_courses((int)$USER->id) : [];
$selectedchildcourses = $selectedchild ? pqh_user_courses((int)$selectedchild['studentid']) : [];
$progress = $selectedchild ? pqh_progress_summary((int)$selectedchild['studentid']) : pqh_progress_summary((int)$USER->id);
$messages = pqh_message_summary((int)$USER->id);
$focus = $selectedchild ? pqh_focus_summary((int)$selectedchild['studentid']) : pqh_focus_summary((int)$USER->id);
$speakrecordings = $selectedchild ? pqh_speak_recording_summary((int)$selectedchild['studentid']) : pqh_speak_recording_summary((int)$USER->id);
$livechildmonitoring = $role === 'parent' ? pqh_live_child_monitoring($children, 3) : ['ready' => false, 'focus_ready' => false, 'children' => []];
$selectedenrollmentstatus = $selectedchild ? pqh_enrollment_approval_status((int)$selectedchild['studentid'], $role === 'parent' ? (int)$USER->id : 0) : '';
$currentstudentenrollmentstatus = $role === 'student' ? pqh_enrollment_approval_status((int)$USER->id) : '';
$currentworkspaceid = pqh_current_workspace_id((int)$USER->id);
$hasworkspace = $currentworkspaceid > 0;
$pqhlogoutparams = $pqhpageparams;
if ($currentworkspaceid > 0 && empty($pqhlogoutparams['workspaceid'])) {
    $pqhlogoutparams['workspaceid'] = $currentworkspaceid;
}
$pqhlogouturl = new moodle_url('/local/hubredirect/logout.php', $pqhlogoutparams);
$dashboardtoken = pqh_current_user_ws_token();
$cdnbase = pqh_shared_resource_cdn_base_url();
$assetbase = rtrim($cdnbase, '/') . '/pre_quraan';
$commcachekey = 'comm-dashboard-role-20260508';
$pqhfontsize = optional_param('fontsize', 'normal', PARAM_ALPHA);
if (!in_array($pqhfontsize, ['normal', 'large', 'xlarge'], true)) {
    $pqhfontsize = 'normal';
}
$pqhbackfallback = new moodle_url('/local/hubredirect/dashboard.php', $pqhpageparams);

echo $OUTPUT->header();
?>
<?php if ($dashboardtoken !== '' && $selectedchild && !empty($selectedchild['cohortid'])): ?>
<link rel="stylesheet" href="<?php echo s($assetbase); ?>/shared/css/communications.css?v=<?php echo s($commcachekey); ?>">
<?php endif; ?>
<style>
body.pqh-dashboard-page header,
body.pqh-dashboard-page footer,
body.pqh-dashboard-page nav.navbar,
body.pqh-dashboard-page #page-header,
body.pqh-dashboard-page #page-footer,
body.pqh-dashboard-page .page-footer,
body.pqh-dashboard-page .site-footer,
body.pqh-dashboard-page .navbar,
body.pqh-dashboard-page .primary-navigation,
body.pqh-dashboard-page .secondary-navigation,
body.pqh-dashboard-page .drawer,
body.pqh-dashboard-page .drawer-left,
body.pqh-dashboard-page .drawer-right,
body.pqh-dashboard-page .drawer-toggles,
body.pqh-dashboard-page .drawer-left-toggle,
body.pqh-dashboard-page .drawer-right-toggle,
body.pqh-dashboard-page .drawercontent,
body.pqh-dashboard-page #nav-drawer,
body.pqh-dashboard-page [data-action="toggle-drawer"],
body.pqh-dashboard-page [data-region="drawer"],
body.pqh-dashboard-page [data-region="right-hand-drawer"],
body.pqh-dashboard-page [data-region="popover-region-container"],
body.pqh-dashboard-page .footer-popover,
body.pqh-dashboard-page .btn-footer-popover,
body.pqh-dashboard-page .floating-buttons,
body.pqh-dashboard-page .usertour,
body.pqh-dashboard-page .tool_usertours-resettourcontainer,
body.pqh-dashboard-page #goto-top-link,
body.pqh-dashboard-page .block-region,
body.pqh-dashboard-page .block-region-side-pre,
body.pqh-dashboard-page .block-region-side-post {
  display: none !important;
}
body.pqh-dashboard-page #page,
body.pqh-dashboard-page #page-content,
body.pqh-dashboard-page #region-main,
body.pqh-dashboard-page .main-inner {
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
}
body.pqh-dashboard-page {
  background: #f4f7fb !important;
}
body.pqh-dashboard-page.drawer-ease,
body.pqh-dashboard-page.has-drawer,
body.pqh-dashboard-page .drawers {
  padding-left: 0 !important;
}
body.pqh-dashboard-page #region-main {
  border: 0 !important;
}
.pqh-shell{--pqh-scale:1;--pqh-base:14px;--pqh-small:12px;--pqh-tiny:10px;--pqh-title-size:30px;--pqh-section-size:22px;--pqh-panel-size:20px;--pqh-card-title-size:18px;--pqh-metric-size:32px;min-height:100vh;background:linear-gradient(180deg,#edfdf1 0,#fff 46%)}
.pqh-shell.pqh-font-large{--pqh-scale:1.15;--pqh-base:16px;--pqh-small:14px;--pqh-tiny:12px;--pqh-title-size:36px;--pqh-section-size:26px;--pqh-panel-size:24px;--pqh-card-title-size:21px;--pqh-metric-size:38px}
.pqh-shell.pqh-font-xlarge{--pqh-scale:1.3;--pqh-base:18px;--pqh-small:16px;--pqh-tiny:13px;--pqh-title-size:42px;--pqh-section-size:30px;--pqh-panel-size:27px;--pqh-card-title-size:24px;--pqh-metric-size:44px}
.pqh-topbar{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px max(20px,calc((100vw - 1180px)/2));background:linear-gradient(135deg,#c8f3c1 0%,#e7ffe2 58%,#fff3d9 100%);border-bottom:1px solid rgba(63,138,85,.24);box-shadow:0 10px 24px rgba(63,138,85,.08)}
.pqh-brand{display:flex;align-items:center;gap:12px;color:#4d3522;font:950 18px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqh-brand__mark{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#6f4e32;color:#fff}
.pqh-role-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pqh-role-chip{min-height:34px;padding:0 12px;border-radius:999px;background:#f4faf1;color:#5f734e;font:900 13px/34px system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqh-role-chip.is-active{background:#6f4e32;color:#fff}
.pqh-back{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 12px;border-radius:999px;background:#f7fff4;color:#245c35!important;text-decoration:none;font:950 13px/34px system-ui,-apple-system,"Segoe UI",Arial,sans-serif;border:1px solid rgba(63,138,85,.24);cursor:pointer}
.pqh-back:hover{background:#e6f7ec;text-decoration:none}
.pqh-font-control{display:inline-flex;align-items:center;gap:4px;min-height:34px;padding:3px 5px;border-radius:999px;background:rgba(255,255,255,.70);border:1px solid rgba(63,138,85,.18)}
.pqh-font-control span{padding:0 5px;color:#425c46;font:900 11px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-transform:uppercase}
.pqh-font-control a{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:26px;border-radius:999px;color:#245c35!important;text-decoration:none;font:950 12px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqh-font-control a:nth-child(3){font-size:14px}.pqh-font-control a:nth-child(4){font-size:16px}
.pqh-font-control a.is-active{background:#3f8a55;color:#fff!important}
.pqh-shell .pqh-wrap{font-size:var(--pqh-base)}
.pqh-shell .pqh-brand{font-size:calc(18px * var(--pqh-scale))!important}
.pqh-shell .pqh-title{font-size:var(--pqh-title-size)!important}
.pqh-shell .pqh-course-panel__head h2,.pqh-shell .pqh-tools__head h2{font-size:var(--pqh-section-size)!important}
.pqh-shell .pqh-student-panel h2,.pqh-shell .pqh-student-panel h3,.pqh-shell .pqh-progress-block h2{font-size:var(--pqh-panel-size)!important}
.pqh-shell .pqh-course-card h3,.pqh-shell .pqh-student-report h3,.pqh-shell .pqh-card h3,.pqh-shell .pqh-live-child h3,.pqh-shell .pqh-sql-panel h3{font-size:var(--pqh-card-title-size)!important}
.pqh-shell .pqh-subtitle,.pqh-shell .pqh-course-panel__head p,.pqh-shell .pqh-course-card p,.pqh-shell .pqh-student-panel p,.pqh-shell .pqh-student-report p,.pqh-shell .pqh-progress-copy,.pqh-shell .pqh-card p,.pqh-shell .pqh-sql-panel p{font-size:var(--pqh-base)!important}
.pqh-shell .pqh-kicker,.pqh-shell .pqh-field label,.pqh-shell .pqh-filter-count,.pqh-shell .pqh-progress-latest span,.pqh-shell .pqh-live-session__top span,.pqh-shell .pqh-config-meta{font-size:var(--pqh-small)!important}
.pqh-shell .pqh-course-card__detail b,.pqh-shell .pqh-student-profile__item b,.pqh-shell .pqh-progress-stat span,.pqh-shell .pqh-progress-latest b,.pqh-shell .pqh-mini-stat span{font-size:var(--pqh-tiny)!important}
.pqh-shell .pqh-course-card__detail span,.pqh-shell .pqh-student-profile__item span,.pqh-shell .pqh-course-card__status,.pqh-shell .pqh-course-card__lesson,.pqh-shell .pqh-focus-pill,.pqh-shell .pqh-live-status{font-size:var(--pqh-small)!important}
.pqh-shell .pqh-student-action,.pqh-shell .pqh-btn,.pqh-shell .pqh-select,.pqh-shell .pqh-input,.pqh-shell .pqh-back,.pqh-shell .pqh-logout{font-size:var(--pqh-base)!important}
.pqh-shell .pqh-metric{font-size:var(--pqh-metric-size)!important}
.pqh-shell .pqh-progress-stat strong{font-size:calc(24px * var(--pqh-scale))!important}
.pqh-logout{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 13px;border-radius:999px;background:#fff4dc;color:#6f4e32!important;text-decoration:none;font:950 13px/34px system-ui,-apple-system,"Segoe UI",Arial,sans-serif;border:1px solid rgba(111,78,50,.20)}
.pqh-logout:hover{background:#ffe7b8;color:#4d3522!important;text-decoration:none}
.pqh-wrap{max-width:1180px;margin:0 auto;padding:30px 18px 54px;color:#17324a;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqh-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding:26px;border-radius:16px;background:linear-gradient(135deg,#dcf8d8 0%,#fff 54%,#fff7e7 100%);border:1px solid rgba(63,138,85,.18);box-shadow:0 16px 38px rgba(105,76,45,.08)}
.pqh-kicker{margin:0 0 6px;color:#6f4e32;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.pqh-title{margin:0;font-size:30px;line-height:1.1;font-weight:950;color:#4d3522}
.pqh-subtitle{margin:8px 0 0;color:#64745a;font-size:15px;font-weight:700}
.pqh-filter{display:grid;grid-template-columns:minmax(220px,1fr) minmax(190px,260px) auto auto;gap:10px;align-items:end;margin:-4px 0 18px;padding:14px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.06)}
.pqh-field label{display:block;margin:0 0 5px;color:#6f4e32;font-size:12px;font-weight:950;text-transform:uppercase}
.pqh-input{width:100%;min-height:42px;border-radius:9px;border:1px solid rgba(23,50,74,.18);padding:0 12px;background:#fff;color:#4d3522;font-weight:850}
.pqh-filter-count{grid-column:1/-1;margin:0;color:#64745a;font-size:13px;font-weight:800}
.pqh-quick{display:none!important}
.pqh-quick-card{padding:15px 16px;border-radius:14px;background:#3f8a55;color:#fff;text-decoration:none;box-shadow:0 14px 30px rgba(63,138,85,.16)}
.pqh-quick-card:nth-child(even){background:#6f4e32;box-shadow:0 14px 30px rgba(111,78,50,.16)}
.pqh-quick-card strong{display:block;font-size:15px;font-weight:950}.pqh-quick-card span{display:block;margin-top:4px;color:rgba(255,255,255,.78);font-size:12px;font-weight:800}
.pqh-course-panel{margin:0 0 18px;padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqh-course-panel__head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.pqh-course-panel__head h2{margin:0;color:#4d3522;font-size:22px;font-weight:950}
.pqh-course-panel__head p{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:750}
.pqh-course-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,420px));gap:12px}
.pqh-course-card{display:flex;min-height:132px;flex-direction:column;justify-content:space-between;padding:16px;border-radius:12px;background:#f7fff4;border:1px solid rgba(63,138,85,.18);color:#17324a!important;text-decoration:none}
.pqh-course-card:hover{background:#edffe9;text-decoration:none}
.pqh-course-card h3{margin:0;color:#4d3522;font-size:18px;font-weight:950}
.pqh-course-card p{margin:8px 0 12px;color:#64745a;font-size:13px;font-weight:750;line-height:1.4}
.pqh-course-card__actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
.pqh-course-card__status{display:inline-flex;align-items:center;align-self:flex-start;min-height:28px;padding:0 10px;border-radius:999px;background:#fff4dc;color:#7b5a3a;font-size:12px;font-weight:950}
.pqh-course-card__status--live{background:#e6f7ec;color:#245c35}
.pqh-course-card__status--readonly{background:#eef5f7;color:#516879}
.pqh-course-card__lesson{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#fff;color:#245c35!important;border:1px solid rgba(63,138,85,.22);font-size:12px;font-weight:950;text-decoration:none}
.pqh-course-card__lesson:hover{background:#f0ffed;text-decoration:none}
.pqh-course-card__details{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin:12px 0 0}
.pqh-course-card__detail{padding:8px 9px;border-radius:9px;background:rgba(255,255,255,.78);border:1px solid rgba(63,138,85,.12)}
.pqh-course-card__detail b{display:block;margin:0 0 2px;color:#6f4e32;font-size:10px;font-weight:950;text-transform:uppercase}
.pqh-course-card__detail span{display:block;color:#425c46;font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.pqh-course-card__detail--wide{grid-column:1/-1}
.pqh-course-empty{padding:16px;border-radius:12px;background:#fff8f0;border:1px dashed rgba(111,78,50,.24);color:#64745a;font-weight:800}
.pqh-student-overview{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:14px;margin:0 0 14px}
.pqh-student-panel{padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqh-student-panel--primary{background:linear-gradient(135deg,#fff 0%,#f8fff5 100%)}
.pqh-student-panel h2,.pqh-student-panel h3{margin:0 0 8px;color:#4d3522;font-size:20px;font-weight:950}
.pqh-student-panel p{margin:0;color:#64745a;font-size:14px;font-weight:700;line-height:1.45}
.pqh-student-profile{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:14px}
.pqh-student-profile__item{min-height:70px;padding:10px;border-radius:10px;background:#fff;border:1px solid rgba(23,50,74,.10)}
.pqh-student-profile__item b{display:block;margin-bottom:3px;color:#6f4e32;font-size:10px;font-weight:950;text-transform:uppercase}
.pqh-student-profile__item span{display:block;color:#425c46;font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.pqh-student-profile__item--wide{grid-column:span 2}
.pqh-student-action-list{display:grid;gap:9px;margin-top:12px}
.pqh-student-action{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;padding:0 12px;border-radius:10px;background:#f4fff0;color:#17324a!important;border:1px solid rgba(111,78,50,.14);font-size:13px;font-weight:950;text-decoration:none}
.pqh-student-action:hover{background:#eaffea;text-decoration:none}
.pqh-student-action--primary{background:#6f4e32;color:#fff!important;border-color:#6f4e32}
.pqh-student-action--primary:hover{background:#5f432b;color:#fff!important}
.pqh-student-report-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.pqh-student-report{padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqh-student-report h3{margin:0 0 8px;color:#4d3522;font-size:18px;font-weight:950}
.pqh-student-report p{margin:0;color:#64745a;font-size:14px;font-weight:700;line-height:1.45}
.pqh-student-report .pqh-actions{margin-top:14px}
.pqh-progress-block{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(340px,.72fr);align-items:start;gap:16px;margin:0 0 14px;padding:18px;border-radius:16px;background:linear-gradient(135deg,#dff8dc 0%,#fff 56%,#fff5df 100%);border:1px solid rgba(63,138,85,.20);box-shadow:0 14px 32px rgba(63,138,85,.10)}
.pqh-progress-main{min-width:0}
.pqh-progress-kicker{display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border-radius:999px;background:#3f8a55;color:#fff;font-size:11px;font-weight:950;text-transform:uppercase}
.pqh-progress-block h2{margin:10px 0 6px;color:#4d3522;font-size:22px;font-weight:950}
.pqh-progress-copy{margin:0;color:#64745a;font-size:14px;font-weight:750;line-height:1.45}
.pqh-progress-meter{height:12px;margin-top:14px;border-radius:999px;background:#eef5e9;overflow:hidden;border:1px solid rgba(63,138,85,.16)}
.pqh-progress-meter span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3f8a55,#d8a33d)}
.pqh-progress-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.pqh-progress-main .pqh-progress-stats{margin-top:16px;max-width:520px}
.pqh-progress-stat{padding:12px;border-radius:12px;background:rgba(255,255,255,.82);border:1px solid rgba(23,50,74,.10)}
.pqh-progress-stat strong{display:block;color:#245c35;font-size:24px;font-weight:950;line-height:1}
.pqh-progress-stat span{display:block;margin-top:4px;color:#64745a;font-size:11px;font-weight:900;text-transform:uppercase}
.pqh-progress-feed{display:grid;gap:9px;align-content:start;min-width:0}
.pqh-progress-latest{padding:12px;border-radius:12px;background:#fff;border:1px solid rgba(111,78,50,.12)}
.pqh-progress-latest b{display:block;margin-bottom:3px;color:#6f4e32;font-size:11px;font-weight:950;text-transform:uppercase}
.pqh-progress-latest span{display:block;color:#425c46;font-size:13px;font-weight:850;line-height:1.35}
.pqh-progress-latest .pqh-focus-pill{display:inline-flex;margin:0 0 0 8px;min-height:22px;padding:0 8px;font-size:10px;vertical-align:middle}
.pqh-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.pqh-card{min-height:132px;padding:18px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13);box-shadow:0 10px 24px rgba(105,76,45,.07)}
.pqh-card--wide{grid-column:span 2}
.pqh-card h3{margin:0 0 8px;font-size:18px;font-weight:950;color:#4d3522}
.pqh-card p{margin:0;color:#64745a;font-size:14px;font-weight:700;line-height:1.45}
.pqh-metric{margin-top:12px;font-size:32px;font-weight:950;color:#6f4e32}
.pqh-focus-pill{display:inline-flex;align-items:center;min-height:30px;margin-top:10px;padding:0 10px;border-radius:999px;background:#eef5f7;color:#516879;font-size:12px;font-weight:950}
.pqh-focus-pill--great{background:#eaffea;color:#3f8a55}
.pqh-focus-pill--good{background:#fff4dc;color:#7b5a3a}
.pqh-focus-pill--support{background:#fff0e6;color:#8a3e2e}
.pqh-mini-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}
.pqh-mini-stat{padding:10px;border-radius:10px;background:#f7fff4;border:1px solid rgba(111,78,50,.10)}
.pqh-mini-stat strong{display:block;color:#6f4e32;font-size:18px;font-weight:950}
.pqh-mini-stat span{display:block;margin-top:2px;color:#64745a;font-size:11px;font-weight:850}
.pqh-live-monitor{margin:0 0 18px}
.pqh-live-monitor__head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}
.pqh-live-monitor__head h2{margin:0;color:#4d3522;font-size:21px;font-weight:950}
.pqh-live-monitor__head p{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:750}
.pqh-live-monitor__grid{display:grid;gap:12px}
.pqh-live-child{padding:14px;border-radius:12px;background:#fbfdf9;border:1px solid rgba(111,78,50,.12)}
.pqh-live-child h3{margin:0 0 10px;color:#17324a;font-size:17px;font-weight:950}
.pqh-live-session{padding:12px;border-radius:10px;background:#fff;border:1px solid rgba(23,50,74,.10);margin-top:9px}
.pqh-live-session__top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.pqh-live-session__top strong{display:block;color:#4d3522;font-size:15px;font-weight:950}
.pqh-live-session__top span{display:block;margin-top:4px;color:#64745a;font-size:12px;font-weight:850}
.pqh-live-session__stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
.pqh-live-session__stat{padding:9px;border-radius:9px;background:#f7fff4;border:1px solid rgba(111,78,50,.10)}
.pqh-live-session__stat strong{display:block;color:#6f4e32;font-size:16px;font-weight:950}
.pqh-live-session__stat span{display:block;margin-top:2px;color:#64745a;font-size:11px;font-weight:850}
.pqh-live-status{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#eef5f7;color:#17324a;font-size:12px;font-weight:950;white-space:nowrap}
.pqh-live-status--live{background:#eaffea;color:#245c35}
.pqh-live-status--scheduled{background:#fff4dc;color:#7b5a3a}
.pqh-live-status--completed{background:#eef5f7;color:#516879}
.pqh-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.pqh-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:9px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:900;border:0;cursor:pointer}
.pqh-btn--secondary{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqh-select{min-height:40px;border-radius:8px;border:1px solid rgba(23,50,74,.18);padding:0 12px;background:#fff;color:#17324a;font-weight:800}
.pqh-config{margin:0 0 18px}
.pqh-config__head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.pqh-config__head h2{margin:0;color:#4d3522;font-size:20px;font-weight:950}
.pqh-config__head p{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:750}
.pqh-config__badge{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:#fff4dc;color:#7b5a3a;font-size:12px;font-weight:950;white-space:nowrap}
.pqh-alert{margin:0 0 12px;padding:11px 12px;border-radius:10px;font-size:13px;font-weight:850}
.pqh-alert--success{background:#eaffea;color:#2d6b43;border:1px solid rgba(63,138,85,.25)}
.pqh-alert--error{background:#fff0e6;color:#8a3e2e;border:1px solid rgba(138,62,46,.25)}
.pqh-config-filter{display:grid;grid-template-columns:170px minmax(160px,1fr) minmax(180px,1fr) auto;gap:10px;align-items:end;margin-bottom:14px}
.pqh-config-table{width:100%;border-collapse:separate;border-spacing:0 8px}
.pqh-config-table th{padding:0 8px;color:#6f4e32;font-size:11px;font-weight:950;text-align:left;text-transform:uppercase}
.pqh-config-table td{padding:9px 8px;background:#f9fff6;border-top:1px solid rgba(111,78,50,.10);border-bottom:1px solid rgba(111,78,50,.10);vertical-align:middle}
.pqh-config-table td:first-child{border-left:1px solid rgba(111,78,50,.10);border-radius:10px 0 0 10px}
.pqh-config-table td:last-child{border-right:1px solid rgba(111,78,50,.10);border-radius:0 10px 10px 0}
.pqh-config-step{display:block;color:#17324a;font-size:14px;font-weight:950}
.pqh-config-meta{display:block;margin-top:2px;color:#64745a;font-size:11px;font-weight:800}
.pqh-config-number{width:86px;min-height:36px;border-radius:8px;border:1px solid rgba(23,50,74,.18);padding:0 9px;background:#fff;color:#17324a;font-weight:900}
.pqh-tools{margin:0 0 18px}
.pqh-tools__head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.pqh-tools__head h2{margin:0;color:#4d3522;font-size:22px;font-weight:950}
.pqh-tools__head p{margin:5px 0 0;color:#64745a;font-size:13px;font-weight:750}
.pqh-tools__grid{display:grid;grid-template-columns:1fr;gap:14px}
.pqh-sql-panel{padding:16px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.13)}
.pqh-sql-panel h3{margin:0 0 6px;color:#4d3522;font-size:18px;font-weight:950}
.pqh-sql-panel p{margin:0 0 12px;color:#64745a;font-size:13px;font-weight:750}
.pqh-sql-panel--blocked{background:#fff8f4;border-color:rgba(138,62,46,.25)}
.pqh-sql-code{width:100%;min-height:250px;border-radius:10px;border:1px solid rgba(23,50,74,.18);padding:12px;background:#0b1020;color:#eaffea;font:12px/1.45 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;resize:vertical;white-space:pre}
.pqh-empty{padding:28px;border:1px dashed rgba(23,50,74,.22);border-radius:12px;background:#fff;color:#516879;font-weight:800}
body.pqh-dashboard-page .pq-comm-panel__scrim{background:rgba(80,58,36,.30);backdrop-filter:blur(2px)}
body.pqh-dashboard-page .pq-comm-panel__sheet{top:92px;right:max(20px,calc((100vw - 980px)/2));bottom:32px;width:min(640px,calc(100vw - 40px));border-radius:16px;border:1px solid rgba(111,78,50,.14);background:#fff;box-shadow:0 28px 70px rgba(105,76,45,.24)}
body.pqh-dashboard-page .pq-comm-panel__top{padding:18px 20px;background:#fff}
body.pqh-dashboard-page .pq-comm-panel__title{font-size:22px}
body.pqh-dashboard-page .pq-comm-panel__toolbar{padding:14px 16px 8px;background:#f1ffe9}
body.pqh-dashboard-page .pq-comm-panel__statusbar{padding:0 16px 12px;background:#f1ffe9}
body.pqh-dashboard-page .pq-comm-tabs{max-width:430px;margin-left:auto}
body.pqh-dashboard-page .pq-comm-tab{min-height:40px;font-size:14px}
body.pqh-dashboard-page .pq-comm-tab.is-active{background:#6f4e32;color:#fff}
body.pqh-dashboard-page .pq-comm-panel__refresh,
body.pqh-dashboard-page .pq-comm-panel__close{width:44px;height:44px;border-radius:10px}
body.pqh-dashboard-page .pq-comm-panel__body{padding:16px}
body.pqh-dashboard-page .pq-comm-thread{padding:16px;border-radius:12px;border-color:rgba(111,78,50,.13)}
body.pqh-dashboard-page .pq-comm-thread:hover{background:#f8fff4}
body.pqh-dashboard-page .pq-comm-thread__subject{font-size:17px}
body.pqh-dashboard-page .pq-comm-thread__preview{font-size:14px}
body.pqh-dashboard-page .pq-comm-message{padding:16px;border-radius:12px;border-color:rgba(111,78,50,.13)}
body.pqh-dashboard-page .pq-comm-reply{padding:14px;border-radius:12px;border-color:rgba(111,78,50,.13)}
@media(max-width:820px){.pqh-hero{display:block}.pqh-filter{grid-template-columns:1fr}.pqh-config__head,.pqh-live-monitor__head{display:block}.pqh-config-filter{grid-template-columns:1fr}.pqh-config-table,.pqh-config-table tbody,.pqh-config-table tr,.pqh-config-table td{display:block;width:100%}.pqh-config-table thead{display:none}.pqh-config-table tr{margin-bottom:10px}.pqh-config-table td{border-left:1px solid rgba(111,78,50,.10);border-right:1px solid rgba(111,78,50,.10);border-radius:0}.pqh-config-table td:first-child{border-radius:10px 10px 0 0}.pqh-config-table td:last-child{border-radius:0 0 10px 10px}.pqh-grid,.pqh-student-overview,.pqh-student-report-grid,.pqh-progress-block{grid-template-columns:1fr}.pqh-student-profile{grid-template-columns:1fr 1fr}.pqh-card--wide{grid-column:auto}.pqh-title{font-size:25px}.pqh-live-session__top{display:block}.pqh-live-status{margin-top:8px}.pqh-live-session__stats{grid-template-columns:1fr 1fr}}
@media(max-width:820px){.pqh-progress-main .pqh-progress-stats{max-width:none}.pqh-progress-feed{margin-top:2px}}
@media(max-width:920px){.pqh-quick{grid-template-columns:repeat(2,minmax(0,1fr))}.pqh-role-chip{display:none}.pqh-role-nav{display:flex}}
@media(max-width:560px){.pqh-topbar{height:auto;padding:14px 16px}.pqh-quick{grid-template-columns:1fr}.pqh-wrap{padding:20px 14px 42px}.pqh-mini-list,.pqh-live-session__stats,.pqh-course-grid,.pqh-student-profile,.pqh-progress-main .pqh-progress-stats{grid-template-columns:1fr}.pqh-student-profile__item--wide{grid-column:auto}.pqh-student-action{align-items:flex-start;flex-direction:column;justify-content:center;padding:10px 12px}body.pqh-dashboard-page .pq-comm-panel__sheet{top:auto;right:0;bottom:0;left:0;width:auto;height:min(86vh,720px);border-radius:16px 16px 0 0}body.pqh-dashboard-page .pq-comm-tabs{max-width:none}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqh-shell pqh-font-<?php echo s($pqhfontsize); ?>">
<div class="pqh-topbar">
  <div class="pqh-brand"><span class="pqh-brand__mark"><?php echo s($pqhbrandinitials); ?></span><span><?php echo s($pqhbrandname); ?></span></div>
  <div class="pqh-role-nav" aria-label="Dashboard roles">
    <button class="pqh-back" type="button" data-fallback="<?php echo s($pqhbackfallback->out(false)); ?>">Back</button>
    <span class="pqh-font-control" aria-label="Font size">
      <span>Text</span>
      <a class="<?php echo $pqhfontsize === 'normal' ? 'is-active' : ''; ?>" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', array_merge($pqhpageparams, ['fontsize' => 'normal'])))->out(false); ?>">A</a>
      <a class="<?php echo $pqhfontsize === 'large' ? 'is-active' : ''; ?>" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', array_merge($pqhpageparams, ['fontsize' => 'large'])))->out(false); ?>">A</a>
      <a class="<?php echo $pqhfontsize === 'xlarge' ? 'is-active' : ''; ?>" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php', array_merge($pqhpageparams, ['fontsize' => 'xlarge'])))->out(false); ?>">A</a>
    </span>
    <?php if ($role !== 'student'): ?>
      <span class="pqh-role-chip <?php echo $role === 'parent' ? 'is-active' : ''; ?>">Parents</span>
      <span class="pqh-role-chip <?php echo $role === 'teacher' ? 'is-active' : ''; ?>">Teachers</span>
      <span class="pqh-role-chip <?php echo $role === 'school_principal' ? 'is-active' : ''; ?>">Principals</span>
      <span class="pqh-role-chip <?php echo $role === 'sqa_tester' ? 'is-active' : ''; ?>">SQA</span>
      <span class="pqh-role-chip <?php echo $role === 'admin' ? 'is-active' : ''; ?>">Admins</span>
      <span class="pqh-role-chip <?php echo $role === 'referrer' ? 'is-active' : ''; ?>">Referrers</span>
    <?php endif; ?>
    <a class="pqh-logout pqh-workspace-logout" href="<?php echo $pqhlogouturl->out(false); ?>">Logout</a>
  </div>
</div>
<div class="pqh-wrap">
  <section class="pqh-hero pqh-workspace-top">
    <div>
      <p class="pqh-kicker"><?php echo s($role === 'school_principal' ? 'School principal' : ($role === 'sqa_tester' ? 'SQA tester' : ucfirst($role))); ?> dashboard</p>
      <h1 class="pqh-title pqh-workspace-title">Assalamu alaikum, <?php echo s(fullname($USER)); ?></h1>
      <p class="pqh-subtitle pqh-workspace-sub">A simple home for messages, progress, lessons, and next steps.</p>
    </div>
    <?php if ($children): ?>
      <form method="get">
        <label class="accesshide" for="pqh-childid"><?php echo $role === 'teacher' ? 'Student' : 'Child'; ?></label>
        <?php if ($role === 'teacher'): ?>
          <input type="hidden" name="studentq" value="<?php echo s($studentsearch); ?>">
          <input type="hidden" name="groupid" value="<?php echo (int)$studentgroupid; ?>">
        <?php endif; ?>
        <select class="pqh-select" id="pqh-childid" name="childid" onchange="this.form.submit()">
          <?php foreach ($children as $child): ?>
            <option value="<?php echo (int)$child['studentid']; ?>" <?php echo (int)$child['studentid'] === $selectedchildid ? 'selected' : ''; ?>>
              <?php echo s($child['name']); ?><?php echo $role === 'teacher' ? ' #' . (int)$child['studentid'] : ''; ?>
            </option>
          <?php endforeach; ?>
        </select>
      </form>
    <?php endif; ?>
  </section>

  <?php if ($isacademyteacher): ?>
    <form class="pqh-filter" method="get" aria-label="Search assigned students">
      <div class="pqh-field">
        <label for="pqh-studentq">Search student</label>
        <input class="pqh-input" id="pqh-studentq" name="studentq" value="<?php echo s($studentsearch); ?>" placeholder="Name, userid, email, username, or group">
      </div>
      <div class="pqh-field">
        <label for="pqh-groupid">Group</label>
        <select class="pqh-select" id="pqh-groupid" name="groupid">
          <option value="0">All groups</option>
          <?php foreach ($studentgroups as $groupid => $groupname): ?>
            <option value="<?php echo (int)$groupid; ?>" <?php echo (int)$groupid === (int)$studentgroupid ? 'selected' : ''; ?>>
              <?php echo s($groupname); ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <button class="pqh-btn" type="submit">Search</button>
      <a class="pqh-btn pqh-btn--secondary" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Clear</a>
      <p class="pqh-filter-count">Showing <?php echo count($children); ?> of <?php echo count($allchildren); ?> assigned students.</p>
    </form>
  <?php endif; ?>

  <?php if ($role === 'student' || (($role === 'parent' || $role === 'teacher') && $selectedchild) || in_array($role, ['admin', 'school_principal'], true)): ?>
    <?php
      $coursepaneltitle = 'My courses';
      $coursepanelsubtitle = 'Only Moodle-enrolled courses appear here.';
      $coursepanelcourses = $currentstudentcourses;
      $coursepanelstudentid = $role === 'student' ? (int)$USER->id : 0;
      $coursepanelsupport = $role === 'student' ? pqh_student_course_support_context((int)$USER->id) : [];
      if (($role === 'parent' || $role === 'teacher') && $selectedchild) {
          $coursepaneltitle = ($role === 'teacher' ? 'Student courses' : 'Child courses');
          $coursepanelsubtitle = 'Courses are based on this student\'s Moodle enrollment.';
          $coursepanelcourses = $selectedchildcourses;
          $coursepanelstudentid = (int)$selectedchild['studentid'];
          $coursepanelsupport = pqh_student_course_support_context((int)$selectedchild['studentid']);
      }
      if (in_array($role, ['admin', 'school_principal'], true)) {
          $coursepaneltitle = 'Academy courses';
          $coursepanelsubtitle = 'Course launch registry for the five academy tracks.';
          $coursepanelcourses = pqh_course_catalog();
          $coursepanelsupport = [];
      }
    ?>
    <section class="pqh-course-panel" aria-label="<?php echo s($coursepaneltitle); ?>">
      <div class="pqh-course-panel__head">
        <div>
          <h2><?php echo s($coursepaneltitle); ?></h2>
          <p><?php echo s($coursepanelsubtitle); ?></p>
        </div>
      </div>
      <?php if (!$coursepanelcourses): ?>
        <div class="pqh-course-empty">No active Moodle course enrollment was found for this student yet.</div>
      <?php else: ?>
        <div class="pqh-course-grid">
          <?php foreach ($coursepanelcourses as $course): ?>
            <?php
              $coursekey = (string)$course['key'];
              $showcurrentlesson = $role === 'student' && $coursekey === 'pre_quraan' && $course['status'] === 'live';
              $canlaunchcourse = $role !== 'parent';
              $showvirtualtutor = $coursekey === 'pre_quraan' && $coursepanelstudentid > 0 && pqh_is_managed_student($coursepanelstudentid);
            ?>
            <div class="pqh-course-card">
              <span>
                <h3><?php echo s((string)$course['title']); ?></h3>
                <p><?php echo s((string)$course['summary']); ?></p>
              </span>
              <span class="pqh-course-card__actions pqh-workspace-actions">
                <?php if ($canlaunchcourse): ?>
                  <a class="pqh-course-card__status <?php echo $course['status'] === 'live' ? 'pqh-course-card__status--live' : ''; ?>" href="<?php echo pqh_course_launch_link($coursekey, $coursepanelstudentid)->out(false); ?>">
                    <?php echo $course['status'] === 'live' ? 'Open course home' : 'Placeholder ready'; ?>
                  </a>
                <?php else: ?>
                  <span class="pqh-course-card__status pqh-course-card__status--readonly">
                    Enrolled
                  </span>
                <?php endif; ?>
                <?php if ($showcurrentlesson): ?>
                  <a class="pqh-course-card__lesson" href="<?php echo pqh_student_lesson_link((int)$USER->id)->out(false); ?>">Open current lesson</a>
                <?php endif; ?>
                <?php if ($showvirtualtutor): ?>
                  <a class="pqh-course-card__lesson" href="<?php echo pqh_virtual_tutor_link($coursepanelstudentid)->out(false); ?>">Virtual tutor</a>
                <?php endif; ?>
              </span>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
  <?php endif; ?>

  <?php if (in_array($role, ['student', 'parent'], true) && $hasworkspace): ?>
    <section class="pqh-card pqh-card--wide" aria-label="Course catalog">
      <h3>Course Catalog</h3>
      <p>Review institution course seats, start and end dates, syllabus, prerequisites, and request enrollment.</p>
      <div class="pqh-actions pqh-workspace-actions">
        <a class="pqh-btn" href="<?php echo pqh_course_catalog_browse_link($currentworkspaceid)->out(false); ?>">Browse course offerings</a>
      </div>
    </section>
  <?php endif; ?>

  <?php if ($role === 'parent'): ?>
    <section class="pqh-card pqh-card--wide" aria-label="Teacher marketplace">
      <h3>Teacher Marketplace</h3>
      <p>Review approved private teacher and tutor profiles, message a teacher, and request the right fit for your child or yourself.</p>
      <div class="pqh-actions pqh-workspace-actions">
        <a class="pqh-btn" href="<?php echo pqh_teacher_marketplace_link()->out(false); ?>">Open teacher profiles</a>
        <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_teacher_marketplace_requests_link()->out(false); ?>">My teacher requests</a>
      </div>
    </section>
  <?php endif; ?>

  <?php if (!in_array($role, ['student', 'parent', 'teacher', 'admin', 'school_principal', 'sqa_tester', 'referrer'], true)): ?>
  <section class="pqh-quick" aria-label="Quick actions">
    <?php if (($role === 'parent' || $role === 'teacher') && $selectedchild): ?>
      <?php if ($role === 'parent' && $selectedenrollmentstatus !== 'approved'): ?>
        <a class="pqh-quick-card" href="<?php echo pqh_enrollment_approval_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Approve Enrollment</strong><span>Required before this student can start lessons</span></a>
      <?php endif; ?>
      <?php if (isset($selectedchildcourses['pre_quraan'])): ?>
        <a class="pqh-quick-card" href="<?php echo pqh_lesson_link((int)$selectedchild['cohortid'], '', false)->out(false); ?>"><strong>Audit Pre-Quraan</strong><span>Review the lesson without changing child progress</span></a>
      <?php endif; ?>
      <a class="pqh-quick-card" href="<?php echo pqh_course_transcript_link((int)$selectedchild['studentid'], $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>"><strong>Unofficial Transcript</strong><span>Review live course status, grades, completion, and warnings</span></a>
      <a class="pqh-quick-card js-pqh-open-comm" data-opencomm="messages" href="<?php echo pqh_communications_link((int)$selectedchild['cohortid'], 'messages', (int)$selectedchild['studentid'])->out(false); ?>"><strong>Messages</strong><span>Read and reply to teacher messages</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('support.php', ['studentid' => (int)$selectedchild['studentid'], 'supporttype' => $role === 'teacher' ? 'student_teacher' : 'parent_teacher'])->out(false); ?>"><strong>Support</strong><span>Open help desk and teacher support conversations</span></a>
      <a class="pqh-quick-card js-pqh-open-comm" data-opencomm="announcements" href="<?php echo pqh_communications_link((int)$selectedchild['cohortid'], 'announcements', (int)$selectedchild['studentid'])->out(false); ?>"><strong>Announcements</strong><span>See class and student updates</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_sessions_link()->out(false); ?>"><strong>Live Sessions</strong><span><?php echo $role === 'teacher' ? 'Start assigned online review classes' : 'Start or join online review classes'; ?></span></a>
      <a class="pqh-quick-card pqh-live-guide-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_explainer_url()->out(false); ?>"><strong>Live Session Guide</strong><span>Watch how to start, join audio, and use support tools</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_parent_trust_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Parent Live Hub</strong><span>Schedule, feedback, homework, recordings, and receipts</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_schedule_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Live Schedule</strong><span>See next class and join availability</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_series_schedule_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Class Series</strong><span>Recurring classes and schedule changes</span></a>
      <a class="pqh-quick-card" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => (int)$selectedchild['studentid']]))->out(false); ?>"><strong>Live Calendar</strong><span>Monthly classes and add-to-calendar links</span></a>
      <?php if ($role === 'teacher'): ?>
        <a class="pqh-quick-card" href="<?php echo pqh_live_teacher_link()->out(false); ?>"><strong>Teacher Workspace</strong><span>Today's classes and post-class reviews</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_live_teacher_schedule_link((int)$USER->id)->out(false); ?>"><strong>Teacher Schedule</strong><span>Your upcoming and recent live classes</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>"><strong>Teacher Meetings</strong><span>Join head-teacher rooms by time zone, language, and teaching level</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>"><strong>Teacher-Parent Rooms</strong><span>Coordinate student support with families</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>"><strong>Availability</strong><span>Maintain your teaching windows</span></a>
        <a class="pqh-quick-card pqh-live-template-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_agenda_template_url()->out(false); ?>"><strong>Live Session Agenda</strong><span>Download the fillable BBB slide template</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>"><strong>Practice Coach</strong><span>Review teacherless-session support prompts</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_live_followups_link()->out(false); ?>"><strong>Parent Follow-Ups</strong><span>Respond to families and close follow-ups</span></a>
      <?php endif; ?>
      <?php if ($role === 'parent'): ?>
        <a class="pqh-quick-card" href="<?php echo pqh_teacher_marketplace_link()->out(false); ?>"><strong>Teacher Marketplace</strong><span>Review approved private teacher and tutor profiles</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_teacher_marketplace_requests_link()->out(false); ?>"><strong>Teacher Requests</strong><span>Track teacher messages, selections, and assignments</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('parent_meeting')->out(false); ?>"><strong>Parent Meetings</strong><span>Join parent-moderated rooms by time zone, language, and child age</span></a>
        <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>"><strong>Teacher-Parent Rooms</strong><span>Join shared support rooms with teachers</span></a>
      <?php endif; ?>
      <a class="pqh-quick-card" href="<?php echo pqh_live_summaries_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Live Summaries</strong><span><?php echo $role === 'teacher' ? 'Preview parent-visible feedback' : 'Read teacher feedback after class'; ?></span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_trust_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Trust Center</strong><span>Review safety, attendance, and recording status</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_recordings_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Live Recordings</strong><span>Watch approved class recordings</span></a>
      <a class="pqh-quick-card" href="#pqh-progress"><strong>Progress</strong><span>Review stars, units, and recent activity</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_managed_reports_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Managed Report</strong><span>Progress, focus, practice, quiz, and live-class summary</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_quiz_report_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Quiz Reports</strong><span>Review alphabet quiz passes, skills, and missed questions</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_recordings_link((int)$selectedchild['studentid'])->out(false); ?>"><strong>Speak Recordings</strong><span><?php echo $role === 'teacher' ? 'Listen to student Speak practice' : 'Listen to child Speak practice'; ?></span></a>
    <?php elseif ($role === 'teacher'): ?>
      <a class="pqh-quick-card" href="#pqh-studentq"><strong>Class Roster</strong><span>Search assigned students and progress</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_course_transcript_link(0, $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Open read-only transcripts for assigned students</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_teacher_link()->out(false); ?>"><strong>Teacher Workspace</strong><span>Today's classes and post-class reviews</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_sessions_link()->out(false); ?>"><strong>Live Sessions</strong><span>Start assigned review classes</span></a>
      <a class="pqh-quick-card pqh-live-guide-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_explainer_url()->out(false); ?>"><strong>Live Session Guide</strong><span>Watch how to start, join audio, and use support tools</span></a>
      <a class="pqh-quick-card pqh-live-template-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_agenda_template_url()->out(false); ?>"><strong>Live Session Agenda</strong><span>Download the fillable BBB slide template</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>"><strong>Teacher Meetings</strong><span>Join head-teacher community rooms</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>"><strong>Teacher-Parent Rooms</strong><span>Coordinate student support with families</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_teacher_schedule_link((int)$USER->id)->out(false); ?>"><strong>Live Schedule</strong><span>Review upcoming class schedule</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>"><strong>Availability</strong><span>Maintain teaching windows</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>"><strong>Practice Coach</strong><span>Teacherless-session support prompts</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_followups_link()->out(false); ?>"><strong>Parent Follow-Ups</strong><span>Respond to families and close follow-ups</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_managed_reports_link()->out(false); ?>"><strong>Managed Reports</strong><span>Progress, focus, practice, quiz, and live-class summaries</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_quiz_report_link()->out(false); ?>"><strong>Quiz Reports</strong><span>Review alphabet quiz scores and skill gaps</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('communications.php')->out(false); ?>"><strong>Communications</strong><span>Open messages and announcements</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('support.php', ['teacherid' => (int)$USER->id, 'supporttype' => 'student_teacher'])->out(false); ?>"><strong>Support</strong><span>Reply to student, parent, and help desk conversations</span></a>
    <?php elseif ($role === 'admin'): ?>
      <a class="pqh-quick-card" href="<?php echo pqh_master_dashboard_link()->out(false); ?>"><strong>Master Dashboard</strong><span>All links categorized by role and system</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_admin_link()->out(false); ?>"><strong>Live Admin Menu</strong><span>All live-session tools in one place</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_ops_link()->out(false); ?>"><strong>Operations</strong><span>Queues, errors, and daily action items</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('support.php')->out(false); ?>"><strong>Support Inbox</strong><span>Review help desk and teacher support conversations</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_sessions_link()->out(false); ?>"><strong>Live Sessions</strong><span>Create and monitor online classes</span></a>
      <a class="pqh-quick-card pqh-live-guide-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_explainer_url()->out(false); ?>"><strong>Live Session Guide</strong><span>Watch how the BBB room, lesson, and tutor windows work</span></a>
      <a class="pqh-quick-card pqh-live-template-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_agenda_template_url()->out(false); ?>"><strong>Live Session Agenda</strong><span>Download the fillable BBB slide template</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('parent_meeting')->out(false); ?>"><strong>Parent Meeting Rooms</strong><span>Create parent-moderated rooms by time zone, language, and child age</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>"><strong>Teacher Meeting Rooms</strong><span>Create head-teacher rooms by time zone, language, and teaching level</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('student_room')->out(false); ?>"><strong>Student Rooms</strong><span>Create student community rooms by level and practice focus</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>"><strong>Teacher-Parent Rooms</strong><span>Create shared rooms for teachers and families</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_create_wizard_link()->out(false); ?>"><strong>Create Session</strong><span>Guided one-time class setup</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_series_wizard_link()->out(false); ?>"><strong>Create Series</strong><span>Guided recurring class setup</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_student_intake_link()->out(false); ?>"><strong>Student Intake</strong><span>Create student, parent, consent, and profile</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_grouping_link()->out(false); ?>"><strong>Student Grouping</strong><span>Required profiles, matching pools, and class groups</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_followups_link()->out(false); ?>"><strong>Follow-Ups</strong><span>Parent communication command center</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_teacher_directory_link()->out(false); ?>"><strong>Teachers</strong><span>Directory, profiles, and assignments</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_parent_links_link()->out(false); ?>"><strong>Parent Links</strong><span>Student guardian relationships and consent</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_reports_link()->out(false); ?>"><strong>Reports</strong><span>Track progress and activity</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_managed_reports_link()->out(false); ?>"><strong>Managed Reports</strong><span>Student progress, focus, practice, quiz, and live-class summary</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_unmanaged_reports_link()->out(false); ?>"><strong>Unmanaged Reports</strong><span>Limited student identity and course information</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>"><strong>Practice Coach</strong><span>Teacherless-session coach reports</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_recordings_admin.php')->out(false); ?>"><strong>Recording Review</strong><span>Sync, QA, publish, and retain BBB recordings</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_quality_analytics.php')->out(false); ?>"><strong>QA Analytics</strong><span>Teacher quality trends and coaching signals</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('live_diagnostics.php')->out(false); ?>"><strong>Diagnostics</strong><span>BBB, table, audit, and system readiness checks</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_quiz_report_link()->out(false); ?>"><strong>Quiz Reports</strong><span>Alphabet quiz analytics by student, pass, and skill</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_sql_tools_link()->out(false); ?>"><strong>SQL Tools</strong><span>QA config and non-production cleanup SQL</span></a>
    <?php else: ?>
      <a class="pqh-quick-card" href="<?php echo pqh_live_schedule_link((int)$USER->id)->out(false); ?>"><strong>Live Schedule</strong><span>See your next class and join availability</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_series_schedule_link((int)$USER->id)->out(false); ?>"><strong>Class Series</strong><span>Recurring classes and schedule changes</span></a>
      <a class="pqh-quick-card" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => (int)$USER->id]))->out(false); ?>"><strong>Live Calendar</strong><span>See this month's classes</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_sessions_link()->out(false); ?>"><strong>Live Sessions</strong><span>Join your scheduled review class</span></a>
      <a class="pqh-quick-card pqh-live-guide-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_explainer_url()->out(false); ?>"><strong>Live Session Guide</strong><span>Watch how to join audio and keep the lesson tools open</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_summaries_link((int)$USER->id)->out(false); ?>"><strong>Teacher Feedback</strong><span>Read parent-visible class summaries</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_trust_link((int)$USER->id)->out(false); ?>"><strong>Trust Center</strong><span>Review safety and class status</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_live_recordings_link((int)$USER->id)->out(false); ?>"><strong>Live Recordings</strong><span>Watch approved class recordings</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_recordings_link((int)$USER->id)->out(false); ?>"><strong>Speak Recordings</strong><span>Review your Speak practice</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_course_transcript_link((int)$USER->id, $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>"><strong>Unofficial Transcript</strong><span>Review your live course record and transcript warnings</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_managed_reports_link((int)$USER->id)->out(false); ?>"><strong>My Report</strong><span>See lesson, focus, practice, quiz, and live-class progress</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_quiz_report_link((int)$USER->id)->out(false); ?>"><strong>Quiz Reports</strong><span>See your alphabet quiz score and passes</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('communications.php', ['studentid' => (int)$USER->id])->out(false); ?>"><strong>Communications</strong><span>Open messages and announcements</span></a>
      <a class="pqh-quick-card" href="<?php echo pqh_hub_link('support.php', ['studentid' => (int)$USER->id, 'supporttype' => 'student_helpdesk'])->out(false); ?>"><strong>Support</strong><span>Ask for help and continue support conversations</span></a>
    <?php endif; ?>
  </section>
  <?php endif; ?>

  <?php if ($role === 'sqa_tester'): ?>
    <section class="pqh-grid" aria-label="SQA tester dashboard">
      <article class="pqh-card pqh-card--wide">
        <h3>SQA Testing Workspace</h3>
        <p>Run release smoke checks, record Alphabet lesson evidence, review reports, and verify system readiness without Moodle administration privileges.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'alphabet-tracker'])->out(false); ?>">Open Alphabet test tracker</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'library'])->out(false); ?>">Admin/SQA docs</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'alphabet-plan'])->out(false); ?>">Alphabet test plan</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_course_launch_link('pre_quraan')->out(false); ?>">Launch Pre-Quran app</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Lesson Regression</h3>
        <p>Open the learner surfaces used during Alphabet and unit-level testing.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_course_launch_link('pre_quraan')->out(false); ?>">Course launcher</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('course_debug.php')->out(false); ?>">Course debug</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('communications.php')->out(false); ?>">Communications</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link()->out(false); ?>">Quiz reports</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Reports & Evidence</h3>
        <p>Review managed progress, focus, recordings, quiz, live-class outcomes, and test evidence after a run.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link()->out(false); ?>">Managed reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_unmanaged_reports_link()->out(false); ?>">Unmanaged reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_reports_link()->out(false); ?>">Live reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('recordings.php')->out(false); ?>">Speak recordings</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_recordings.php')->out(false); ?>">Live recordings</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Live & Operations Smoke</h3>
        <p>Check live-session routing, schedules, calendars, diagnostics, recording review, and operational queues.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_sessions_link($hasworkspace ? $currentworkspaceid : 0)->out(false); ?>">Live sessions</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_calendar.php')->out(false); ?>">Live calendar</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_ops_link()->out(false); ?>">Operations</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_diagnostics.php')->out(false); ?>">Diagnostics</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_recordings_admin.php')->out(false); ?>">Recording review</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Quality Dashboards</h3>
        <p>Review QA analytics, follow-ups, parent trust, and leadership/improvement-plan pages for regression coverage.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_quality_analytics.php')->out(false); ?>">QA analytics</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_followups_link()->out(false); ?>">Follow-ups</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_parent_trust.php')->out(false); ?>">Parent trust</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_leadership.php')->out(false); ?>">Leadership review</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_improvement_plans.php')->out(false); ?>">Improvement plans</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Training Artifacts</h3>
        <p>Use the repository-generated training maps and inventories during onboarding and exploratory testing.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'alphabet-plan'])->out(false); ?>">Alphabet plan</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'alphabet-tracker'])->out(false); ?>">Alphabet tracker</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'library'])->out(false); ?>">Admin/SQA docs</a>
          <a class="pqh-btn pqh-btn--secondary pqh-live-guide-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_explainer_url()->out(false); ?>">Live guide</a>
        </div>
      </article>
    </section>
  <?php endif; ?>

  <?php if ($role === 'referrer'): ?>
    <section class="pqh-grid" aria-label="Referrer dashboard">
      <article class="pqh-card pqh-card--wide">
        <h3>Referral Center</h3>
        <p>Track students linked to your referrer code, referral status, expiry dates, commission, approvals, and payment state.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_referrers_link()->out(false); ?>">Open referrals</a>
          <a class="pqh-btn pqh-btn--secondary js-pqh-open-comm" data-opencomm="messages" href="<?php echo pqh_hub_link('communications.php')->out(false); ?>">Messages</a>
        </div>
      </article>
    </section>
  <?php endif; ?>

  <?php if ($sqlToolsCanView): ?>
    <section class="pqh-card pqh-tools" aria-label="SQL tools">
      <div class="pqh-tools__head">
        <div>
          <h2>SQL Tools</h2>
          <p>Non-production tools for QA configuration and step progress cleanup. Production cleanup is blocked here.</p>
        </div>
        <span class="pqh-config__badge">admin tools</span>
      </div>

      <div class="pqh-tools__grid">
      <?php if ($qaStepConfigCanEdit): ?>
      <article class="pqh-sql-panel pqh-config" aria-label="QA step configuration">
      <div class="pqh-config__head">
        <div>
          <h2>QA Step Config</h2>
          <p>Update passes and repeats for staging or integration only. Production is blocked here.</p>
        </div>
        <span class="pqh-config__badge"><?php echo s($qaStepConfigEnv); ?> only</span>
      </div>

      <?php if ($qaStepConfigMessage): ?>
        <div class="pqh-alert pqh-alert--<?php echo $qaStepConfigMessage['type'] === 'success' ? 'success' : 'error'; ?>">
          <?php echo s($qaStepConfigMessage['message']); ?>
        </div>
      <?php endif; ?>

      <form class="pqh-config-filter" method="get" aria-label="Filter QA step configuration">
        <?php if ($role === 'teacher'): ?>
          <input type="hidden" name="studentq" value="<?php echo s($studentsearch); ?>">
          <input type="hidden" name="groupid" value="<?php echo (int)$studentgroupid; ?>">
        <?php endif; ?>
        <?php if ($selectedchildid): ?>
          <input type="hidden" name="childid" value="<?php echo (int)$selectedchildid; ?>">
        <?php endif; ?>
        <div class="pqh-field">
          <label for="pqh-qa-env">Environment</label>
          <select class="pqh-select" id="pqh-qa-env" name="qa_env">
            <option value="integration" <?php echo $qaStepConfigEnv === 'integration' ? 'selected' : ''; ?>>Integration</option>
            <option value="staging" <?php echo $qaStepConfigEnv === 'staging' ? 'selected' : ''; ?>>Staging</option>
          </select>
        </div>
        <div class="pqh-field">
          <label for="pqh-qa-lesson">Lesson</label>
          <input class="pqh-input" id="pqh-qa-lesson" name="qa_lessonid" value="<?php echo s($qaStepConfigLesson); ?>">
        </div>
        <div class="pqh-field">
          <label for="pqh-qa-unit">Unit</label>
          <input class="pqh-input" id="pqh-qa-unit" name="qa_unitid" value="<?php echo s($qaStepConfigUnit); ?>">
        </div>
        <button class="pqh-btn pqh-btn--secondary" type="submit">Load steps</button>
      </form>

      <?php if (!$qaStepConfigRows): ?>
        <div class="pqh-empty">No active step configuration rows found for this environment, lesson, and unit.</div>
      <?php else: ?>
        <table class="pqh-config-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Passes</th>
              <th>Repeats</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($qaStepConfigRows as $step): ?>
              <?php $formid = 'pqh-stepcfg-form-' . (int)$step->id; ?>
              <tr>
                <td>
                  <span class="pqh-config-step">Step <?php echo (int)$step->step_index; ?>: <?php echo s($step->step_title ?: $step->step_id); ?></span>
                  <span class="pqh-config-meta"><?php echo s($step->step_id); ?> - <?php echo s($step->lessonid); ?> / <?php echo s($step->unitid); ?></span>
                </td>
                <td>
                  <form id="<?php echo s($formid); ?>" method="post">
                    <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
                    <input type="hidden" name="pqh_action" value="update_step_config">
                    <input type="hidden" name="qa_env" value="<?php echo s($qaStepConfigEnv); ?>">
                    <input type="hidden" name="qa_lessonid" value="<?php echo s($qaStepConfigLesson); ?>">
                    <input type="hidden" name="qa_unitid" value="<?php echo s($qaStepConfigUnit); ?>">
                    <input type="hidden" name="qa_step_id" value="<?php echo s($step->step_id); ?>">
                    <?php if ($role === 'teacher'): ?>
                      <input type="hidden" name="studentq" value="<?php echo s($studentsearch); ?>">
                      <input type="hidden" name="groupid" value="<?php echo (int)$studentgroupid; ?>">
                    <?php endif; ?>
                    <?php if ($selectedchildid): ?>
                      <input type="hidden" name="childid" value="<?php echo (int)$selectedchildid; ?>">
                    <?php endif; ?>
                  </form>
                    <label class="accesshide" for="pqh-passes-<?php echo (int)$step->id; ?>">Passes for <?php echo s($step->step_id); ?></label>
                    <input class="pqh-config-number" id="pqh-passes-<?php echo (int)$step->id; ?>" form="<?php echo s($formid); ?>" name="qa_passes" type="number" min="1" max="100" value="<?php echo max(1, (int)$step->default_passes_required); ?>">
                </td>
                <td>
                    <label class="accesshide" for="pqh-repeats-<?php echo (int)$step->id; ?>">Repeats for <?php echo s($step->step_id); ?></label>
                    <input class="pqh-config-number" id="pqh-repeats-<?php echo (int)$step->id; ?>" form="<?php echo s($formid); ?>" name="qa_repeats" type="number" min="1" max="100" value="<?php echo max(1, (int)$step->default_repeats_per_letter); ?>">
                </td>
                <td>
                    <button class="pqh-btn" form="<?php echo s($formid); ?>" type="submit">Update</button>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
      </article>
      <?php endif; ?>

      <?php if ($role === 'admin'): ?>
        <article class="pqh-sql-panel" aria-label="Integration step progress cleanup SQL">
          <h3>Clean Step Progress Data: Integration</h3>
          <p>Copy this SQL into phpMyAdmin on the integration/quraantest database after confirming the preview counts.</p>
          <textarea class="pqh-sql-code" readonly spellcheck="false"><?php echo s($sqlCleanupIntegration); ?></textarea>
        </article>

        <article class="pqh-sql-panel" aria-label="Staging step progress cleanup SQL">
          <h3>Clean Step Progress Data: Staging</h3>
          <p>Copy this SQL into phpMyAdmin on the staging database after confirming the preview counts.</p>
          <textarea class="pqh-sql-code" readonly spellcheck="false"><?php echo s($sqlCleanupStaging); ?></textarea>
        </article>

        <article class="pqh-sql-panel pqh-sql-panel--blocked" aria-label="Production step progress cleanup blocked">
          <h3>Clean Step Progress Data: Production</h3>
          <p>Blocked in this dashboard. Production learner progress cleanup must use a reviewed backup-and-approval runbook.</p>
          <textarea class="pqh-sql-code" readonly spellcheck="false"><?php echo s($sqlCleanupProductionBlocked); ?></textarea>
        </article>
      <?php endif; ?>
      </div>
    </section>
  <?php endif; ?>

  <?php if ($role === 'parent' || $role === 'teacher'): ?>
    <?php if (!$selectedchild): ?>
      <?php if ($role === 'teacher'): ?>
        <section class="pqh-grid" aria-label="Teacher dashboard">
          <article class="pqh-card pqh-card--wide">
            <?php if ($isacademyteacher): ?>
              <h3>Teacher tools</h3>
              <p>Start assigned classes, review your schedule, manage availability, and follow up with families.</p>
              <div class="pqh-actions pqh-workspace-actions">
                <?php if ($hasworkspace): ?>
                  <a class="pqh-btn" href="<?php echo pqh_workspace_dashboard_link($currentworkspaceid)->out(false); ?>">Workspace dashboard</a>
                <?php endif; ?>
                <a class="pqh-btn" href="<?php echo pqh_live_teacher_link()->out(false); ?>">Teacher workspace</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_sessions_link()->out(false); ?>">Live sessions</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_teacher_schedule_link((int)$USER->id)->out(false); ?>">Live schedule</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>">Teacher meetings</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>">Teacher-parent rooms</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>">Availability</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>">Practice coach</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_followups_link()->out(false); ?>">Parent follow-ups</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link()->out(false); ?>">Managed reports</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link()->out(false); ?>">Quiz reports</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('communications.php')->out(false); ?>">Communications</a>
              </div>
            <?php else: ?>
              <h3>Private tutor tools</h3>
              <p>Manage your private tutor profile, availability, and parent marketplace messages.</p>
              <div class="pqh-actions pqh-workspace-actions">
                <a class="pqh-btn" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => (int)$USER->id]))->out(false); ?>">View marketplace profile</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('communications.php', ['opencomm' => 'messages'])->out(false); ?>">Messages</a>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>">Availability</a>
              </div>
            <?php endif; ?>
          </article>
        </section>
        <?php if ($isacademyteacher): ?>
          <?php if (!empty($allchildren)): ?>
            <div class="pqh-empty">No assigned students matched this search. Try a different student userid, name, username, email, or group.</div>
          <?php else: ?>
            <div class="pqh-empty">No students are assigned to this teacher dashboard yet. Add rows to the teacher-student assignment table, or add managed students to one of this teacher's cohorts.</div>
          <?php endif; ?>
        <?php else: ?>
          <div class="pqh-empty">Private tutor access is limited to marketplace profile, availability, and parent messages until <?php echo s($pqhbrandname); ?> assigns live-class students or academy teacher duties.</div>
        <?php endif; ?>
      <?php else: ?>
        <section class="pqh-grid" aria-label="Parent dashboard">
          <article class="pqh-card pqh-card--wide">
            <h3>Parent tools</h3>
            <p>Once a child is linked, this dashboard shows live classes, teacher feedback, recordings, trust status, progress, and messages.</p>
            <div class="pqh-actions pqh-workspace-actions">
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('communications.php')->out(false); ?>">Communications</a>
              <a class="pqh-btn" href="<?php echo pqh_hub_link('workspace_parent.php')->out(false); ?>">Parent workspace</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_sessions_link()->out(false); ?>">Live sessions</a>
            </div>
          </article>
        </section>
        <div class="pqh-empty">No child is linked to this parent account yet. Once a teacher starts a parent message or a guardian link is added, this dashboard will show progress and lesson links here.</div>
      <?php endif; ?>
    <?php else: ?>
      <?php if ($role === 'parent'): ?>
        <section class="pqh-card pqh-live-monitor" aria-label="Live session monitoring for linked children">
          <div class="pqh-live-monitor__head">
            <div>
              <h2>Live Session Monitoring</h2>
              <p>Recent live-class lesson activity for the children linked to this parent account.</p>
            </div>
            <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_parent_trust_link((int)$selectedchild['studentid'])->out(false); ?>">Parent live hub</a>
          </div>
          <?php if (!$livechildmonitoring['ready']): ?>
            <div class="pqh-empty">Live-session tables are not installed yet.</div>
          <?php elseif (empty($livechildmonitoring['children'])): ?>
            <div class="pqh-empty">No linked children have live-session records yet.</div>
          <?php else: ?>
            <div class="pqh-live-monitor__grid">
              <?php foreach ($livechildmonitoring['children'] as $childmonitor): ?>
                <article class="pqh-live-child">
                  <h3><?php echo s((string)$childmonitor['name']); ?></h3>
                  <?php if (empty($childmonitor['sessions'])): ?>
                    <p>No live sessions have been scheduled for this child yet.</p>
                  <?php else: ?>
                    <?php foreach ($childmonitor['sessions'] as $session): ?>
                      <?php
                        $teacher = core_user::get_user((int)$session->teacherid);
                        $status = strtolower((string)$session->status);
                        $statusclass = in_array($status, ['live', 'scheduled', 'completed'], true) ? $status : 'completed';
                        $lesson = trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /');
                        $hasactivity = !empty($session->last_time) || !empty($session->active_ms) || !empty($session->idle_count) || !empty($session->leave_count);
                        $sessiontimezone = trim((string)($session->timezone ?? '')) ?: 99;
                      ?>
                      <div class="pqh-live-session">
                        <div class="pqh-live-session__top">
                          <div>
                            <strong><?php echo s((string)$session->title); ?></strong>
                            <span>
                              <?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'), $sessiontimezone); ?>
                              - <?php echo userdate((int)$session->scheduled_end, get_string('strftimetime'), $sessiontimezone); ?>
                              <?php echo $teacher ? ' - ' . s(fullname($teacher)) : ''; ?>
                            </span>
                            <?php if ($lesson !== ''): ?><span>Lesson: <?php echo s($lesson); ?></span><?php endif; ?>
                          </div>
                          <span class="pqh-live-status pqh-live-status--<?php echo s($statusclass); ?>"><?php echo s(ucfirst(str_replace('_', ' ', $status ?: 'scheduled'))); ?></span>
                        </div>
                        <?php if (!$livechildmonitoring['focus_ready']): ?>
                          <p style="margin-top:10px">Session-based monitoring columns are not installed yet.</p>
                        <?php elseif (!$hasactivity): ?>
                          <p style="margin-top:10px">No lesson activity has been recorded for this session yet.</p>
                        <?php else: ?>
                          <div class="pqh-live-session__stats">
                            <div class="pqh-live-session__stat">
                              <strong><?php echo s(pqh_format_duration((int)$session->active_ms)); ?></strong>
                              <span>active lesson time</span>
                            </div>
                            <div class="pqh-live-session__stat">
                              <strong><?php echo s(pqh_live_step_label((string)$session->latest_step)); ?></strong>
                              <span>last step</span>
                            </div>
                            <div class="pqh-live-session__stat">
                              <strong><?php echo (int)$session->idle_count; ?></strong>
                              <span>focus reminders</span>
                            </div>
                            <div class="pqh-live-session__stat">
                              <strong><?php echo !empty($session->last_time) ? userdate((int)$session->last_time, get_string('strftimetime')) : 'n/a'; ?></strong>
                              <span>last activity</span>
                            </div>
                          </div>
                        <?php endif; ?>
                      </div>
                    <?php endforeach; ?>
                  <?php endif; ?>
                  <div class="pqh-actions pqh-workspace-actions">
                    <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_schedule_link((int)$childmonitor['studentid'])->out(false); ?>">Schedule</a>
                    <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_summaries_link((int)$childmonitor['studentid'])->out(false); ?>">Summaries</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </section>
      <?php endif; ?>

      <section class="pqh-grid" aria-label="<?php echo $role === 'teacher' ? 'Teacher dashboard' : 'Parent dashboard'; ?>">
        <?php if ($role === 'parent'): ?>
          <article class="pqh-card pqh-card--wide">
            <h3>Parent dashboard</h3>
            <p>Review <?php echo s($selectedchild['name']); ?>, join scheduled review classes, and monitor lesson support without launching the child course.</p>
            <div class="pqh-actions pqh-workspace-actions">
              <?php if (isset($selectedchildcourses['pre_quraan'])): ?>
                <a class="pqh-btn" href="<?php echo pqh_lesson_link((int)$selectedchild['cohortid'], '', false)->out(false); ?>">Audit Pre-Quraan</a>
              <?php endif; ?>
              <?php if (pqh_is_managed_student((int)$selectedchild['studentid'])): ?>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_virtual_tutor_link((int)$selectedchild['studentid'])->out(false); ?>">Virtual tutor</a>
              <?php endif; ?>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_sessions_link()->out(false); ?>">Live sessions</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_schedule_link((int)$selectedchild['studentid'])->out(false); ?>">Live schedule</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_series_schedule_link((int)$selectedchild['studentid'])->out(false); ?>">Class series</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => (int)$selectedchild['studentid']]))->out(false); ?>">Live calendar</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_parent_trust_link((int)$selectedchild['studentid'])->out(false); ?>">Parent live hub</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_course_transcript_link((int)$selectedchild['studentid'], $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>">Unofficial transcript</a>
            </div>
          </article>

          <article class="pqh-card">
            <h3>Class feedback</h3>
            <p>Review teacher summaries, safety status, and approved class recordings when they are available.</p>
            <div class="pqh-actions pqh-workspace-actions">
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_summaries_link((int)$selectedchild['studentid'])->out(false); ?>">Teacher feedback</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_trust_link((int)$selectedchild['studentid'])->out(false); ?>">Trust center</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_recordings_link((int)$selectedchild['studentid'])->out(false); ?>">Live recordings</a>
            </div>
          </article>

          <article class="pqh-card">
            <h3>Practice reports</h3>
            <p>Review progress, quiz results, managed reports, and Speak practice recordings.</p>
            <div class="pqh-actions pqh-workspace-actions">
              <a class="pqh-btn pqh-btn--secondary" href="#pqh-progress">Progress</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link((int)$selectedchild['studentid'])->out(false); ?>">Managed report</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link((int)$selectedchild['studentid'])->out(false); ?>">Quiz report</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_recordings_link((int)$selectedchild['studentid'])->out(false); ?>">Speak recordings</a>
            </div>
          </article>

          <article class="pqh-card">
            <h3>Communications</h3>
            <p>Open messages, announcements, and meeting rooms for family support.</p>
            <div class="pqh-actions pqh-workspace-actions">
              <a class="pqh-btn js-pqh-open-comm" data-opencomm="messages" href="<?php echo pqh_communications_link((int)$selectedchild['cohortid'], 'messages', (int)$selectedchild['studentid'])->out(false); ?>">Open messages</a>
              <a class="pqh-btn pqh-btn--secondary js-pqh-open-comm" data-opencomm="announcements" href="<?php echo pqh_communications_link((int)$selectedchild['cohortid'], 'announcements', (int)$selectedchild['studentid'])->out(false); ?>">Announcements</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('parent_meeting')->out(false); ?>">Parent meetings</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>">Teacher-parent rooms</a>
            </div>
          </article>
        <?php else: ?>
          <article class="pqh-card pqh-card--wide">
            <h3><?php echo s($selectedchild['name']); ?></h3>
            <p>Review this student, open communications, or audit the course without changing progress.</p>
            <div class="pqh-actions pqh-workspace-actions">
              <?php if ($hasworkspace): ?>
                <a class="pqh-btn" href="<?php echo pqh_workspace_dashboard_link($currentworkspaceid)->out(false); ?>">Workspace dashboard</a>
              <?php endif; ?>
              <?php if (isset($selectedchildcourses['pre_quraan'])): ?>
                <a class="pqh-btn" href="<?php echo pqh_lesson_link((int)$selectedchild['cohortid'], '', false)->out(false); ?>">Audit Pre-Quraan</a>
              <?php endif; ?>
              <?php if (pqh_is_managed_student((int)$selectedchild['studentid'])): ?>
                <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_virtual_tutor_link((int)$selectedchild['studentid'])->out(false); ?>">Virtual tutor</a>
              <?php endif; ?>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_parent_trust_link((int)$selectedchild['studentid'])->out(false); ?>">Parent live hub</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_schedule_link((int)$selectedchild['studentid'])->out(false); ?>">Live schedule</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_series_schedule_link((int)$selectedchild['studentid'])->out(false); ?>">Class series</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => (int)$selectedchild['studentid']]))->out(false); ?>">Live calendar</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_course_transcript_link((int)$selectedchild['studentid'], $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>">Unofficial transcript</a>
              <a class="pqh-btn pqh-btn--secondary js-pqh-open-comm" data-opencomm="messages" href="<?php echo pqh_communications_link((int)$selectedchild['cohortid'], 'messages', (int)$selectedchild['studentid'])->out(false); ?>">Open messages</a>
              <a class="pqh-btn pqh-btn--secondary js-pqh-open-comm" data-opencomm="announcements" href="<?php echo pqh_communications_link((int)$selectedchild['cohortid'], 'announcements', (int)$selectedchild['studentid'])->out(false); ?>">Open announcements</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_summaries_link((int)$selectedchild['studentid'])->out(false); ?>">Live summaries</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_trust_link((int)$selectedchild['studentid'])->out(false); ?>">Trust center</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_recordings_link((int)$selectedchild['studentid'])->out(false); ?>">Live recordings</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link((int)$selectedchild['studentid'])->out(false); ?>">Managed report</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_recordings_link((int)$selectedchild['studentid'])->out(false); ?>">Review Speak recordings</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link((int)$selectedchild['studentid'])->out(false); ?>">Quiz report</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_teacher_link()->out(false); ?>">Teacher workspace</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_teacher_schedule_link((int)$USER->id)->out(false); ?>">Teacher schedule</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>">Teacher meetings</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>">Teacher-parent rooms</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>">Availability</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>">Practice coach</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_followups_link()->out(false); ?>">Parent follow-ups</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link()->out(false); ?>">Managed reports</a>
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link((int)$selectedchild['studentid'])->out(false); ?>">Student quiz report</a>
            </div>
          </article>
        <?php endif; ?>

        <article class="pqh-card">
          <h3>Messages</h3>
          <p><?php echo $messages['latest'] !== '' ? 'Latest: ' . s($messages['latest']) : 'No private messages yet.'; ?></p>
          <div class="pqh-metric"><?php echo (int)$messages['unread']; ?></div>
          <p>unread</p>
        </article>

        <article class="pqh-card">
          <h3>Current Activity</h3>
          <?php if ($progress['latest']): ?>
            <p><?php echo s($progress['latest']->unit_title ?: $progress['latest']->lesson_title ?: 'Lesson activity'); ?></p>
            <div class="pqh-metric"><?php echo isset($progress['latest']->completion_percent) ? (int)$progress['latest']->completion_percent : 0; ?>%</div>
            <p><?php echo s(str_replace('_', ' ', (string)$progress['latest']->overall_status)); ?></p>
          <?php else: ?>
            <p>No lesson progress has been recorded yet.</p>
          <?php endif; ?>
        </article>

        <article id="pqh-progress" class="pqh-card">
          <h3>Progress</h3>
          <p><?php echo (int)$progress['completed']; ?> completed units out of <?php echo (int)$progress['units']; ?> started.</p>
          <div class="pqh-metric"><?php echo (int)$progress['stars']; ?></div>
          <p>total stars</p>
        </article>

        <article class="pqh-card">
          <h3>Focus &amp; Tracking</h3>
          <?php if (!$focus['tables_ready']): ?>
            <p>Focus tracking tables are not installed yet.</p>
          <?php elseif ((int)$focus['sessions'] <= 0): ?>
            <p>No focus activity has been recorded yet.</p>
            <span class="pqh-focus-pill">No data yet</span>
          <?php else: ?>
            <p><?php echo s($focus['latest_unit'] !== '' ? 'Latest: ' . $focus['latest_unit'] : 'Recent lesson activity tracked.'); ?></p>
            <span class="pqh-focus-pill pqh-focus-pill--<?php echo s($focus['focus_class']); ?>"><?php echo s($focus['focus_label']); ?></span>
            <div class="pqh-mini-list">
              <div class="pqh-mini-stat">
                <strong><?php echo s(pqh_format_duration((int)$focus['active_ms'])); ?></strong>
                <span>active time</span>
              </div>
              <div class="pqh-mini-stat">
                <strong><?php echo s(pqh_count_duration((int)$focus['leave_count'], 10)); ?></strong>
                <span>away time</span>
              </div>
              <div class="pqh-mini-stat">
                <strong><?php echo s(pqh_count_duration((int)$focus['idle_count'], 25)); ?></strong>
                <span>idle time</span>
              </div>
            </div>
            <p style="margin-top:10px">Last tracked <?php echo userdate((int)$focus['last_time'], get_string('strftimedatetimeshort')); ?></p>
          <?php endif; ?>
        </article>

        <article class="pqh-card">
          <h3>Speak Recordings</h3>
          <?php if (!$speakrecordings['tables_ready']): ?>
            <p>Speak recording table is not installed yet.</p>
          <?php elseif ((int)$speakrecordings['count'] <= 0): ?>
            <p>No Speak recordings have been submitted yet.</p>
          <?php else: ?>
            <p><?php echo $speakrecordings['latest'] ? 'Latest: ' . s($speakrecordings['latest']->unitid . ' / ' . ($speakrecordings['latest']->letter_name ?: $speakrecordings['latest']->letter_text ?: 'Speak')) : 'Recordings are ready for review.'; ?></p>
            <div class="pqh-metric"><?php echo (int)$speakrecordings['count']; ?></div>
            <p>recordings</p>
            <div class="pqh-actions pqh-workspace-actions">
              <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_recordings_link((int)$selectedchild['studentid'])->out(false); ?>">Open recordings</a>
            </div>
          <?php endif; ?>
        </article>
      </section>
    <?php endif; ?>
  <?php elseif ($role === 'school_principal'): ?>
    <section class="pqh-grid" aria-label="School principal dashboard">
      <article class="pqh-card pqh-card--wide">
        <h3>Academy Operations</h3>
        <p>Manage courses, live learning, people, reports, and follow-up without Moodle site administration tools.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn" href="<?php echo pqh_live_admin_link()->out(false); ?>">Open academy operations</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_sessions_link($hasworkspace ? $currentworkspaceid : 0)->out(false); ?>">Live sessions</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_ops_link()->out(false); ?>">Operations dashboard</a>
          <a class="pqh-btn pqh-btn--secondary pqh-live-template-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_agenda_template_url()->out(false); ?>">Agenda template</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_capacity_link()->out(false); ?>">Capacity planning</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Courses</h3>
        <p>Create and maintain academy course tracks, enrollment flows, and learner placement support.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_course_launch_link('pre_quraan')->out(false); ?>">Pre-Quraan course home</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('intake_requests.php')->out(false); ?>">Inquiry queue</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('student_intake.php')->out(false); ?>">Student intake</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_referrers_link()->out(false); ?>">Referrers</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_grouping_link()->out(false); ?>">Pools & groups</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Live Learning</h3>
        <p>Create sessions, manage recurring series, and maintain learning rooms for students, parents, and teachers.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_create_wizard_link()->out(false); ?>">Single class</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_series_wizard_link()->out(false); ?>">Recurring series</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('student_room')->out(false); ?>">Student room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('parent_meeting')->out(false); ?>">Parent meeting room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>">Teacher meeting room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>">Teacher-parent room</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>People</h3>
        <p>View and maintain teacher, student, and parent information used by academy operations.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_teacher_directory_link()->out(false); ?>">Teacher directory</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('teacher_intake.php')->out(false); ?>">Teacher intake</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_referrers_link()->out(false); ?>">Referrers</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_parent_links_link()->out(false); ?>">Student parent links</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>">Teacher availability</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Reports & Progress</h3>
        <p>Review student progress, teacher quality, live sessions, quiz outcomes, and practice activity.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_reports_link()->out(false); ?>">Live reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link()->out(false); ?>">Managed reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_unmanaged_reports_link()->out(false); ?>">Unmanaged reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link()->out(false); ?>">Quiz reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>">Practice coach</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Quality & Follow-Up</h3>
        <p>Review recordings, QA trends, leadership follow-up, improvement plans, and parent communication cases.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_recordings_admin.php')->out(false); ?>">Recording review</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_quality_analytics.php')->out(false); ?>">QA analytics</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_leadership.php')->out(false); ?>">Leadership review</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_improvement_plans.php')->out(false); ?>">Improvement plans</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_followups_link()->out(false); ?>">Follow-ups</a>
        </div>
      </article>
    </section>
  <?php elseif ($role === 'admin'): ?>
    <section class="pqh-grid" aria-label="Admin dashboard">
      <article class="pqh-card pqh-card--wide">
        <h3>Live Academy Operations</h3>
        <p>Use the live admin menu as the stable front door for daily operations, scheduling, QA, parent trust, retention, and reports.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_master_dashboard_link()->out(false); ?>">Master dashboard</a>
          <a class="pqh-btn" href="<?php echo pqh_live_admin_link()->out(false); ?>">Open live admin menu</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_sessions_link($hasworkspace ? $currentworkspaceid : 0)->out(false); ?>">Live sessions</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_ops_link()->out(false); ?>">Operations dashboard</a>
          <a class="pqh-btn pqh-btn--secondary pqh-live-template-link" target="_blank" rel="noopener" href="<?php echo pqh_live_session_agenda_template_url()->out(false); ?>">Agenda template</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_capacity_link()->out(false); ?>">Capacity planning</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_diagnostics.php')->out(false); ?>">Diagnostics</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Create</h3>
        <p>Use guided flows for safer setup, scheduling, matching, and conflict prevention.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_create_wizard_link()->out(false); ?>">Single class</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('parent_meeting')->out(false); ?>">Parent meeting room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_meeting')->out(false); ?>">Teacher meeting room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('student_room')->out(false); ?>">Student room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_meeting_rooms_link('teacher_parent_room')->out(false); ?>">Teacher-parent room</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_series_wizard_link()->out(false); ?>">Recurring series</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('student_intake.php')->out(false); ?>">Student intake</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('teacher_intake.php')->out(false); ?>">Teacher intake</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_referrers_link()->out(false); ?>">Referrers</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_grouping_link()->out(false); ?>">Pools & groups</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Review</h3>
        <p>Jump into quality, recording, and parent follow-up queues.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo (new moodle_url('/local/hubredirect/live_recordings_admin.php'))->out(false); ?>">Recordings</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo (new moodle_url('/local/hubredirect/live_quality_analytics.php'))->out(false); ?>">QA analytics</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_followups_link()->out(false); ?>">Follow-ups</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_leadership.php')->out(false); ?>">Leadership review</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_improvement_plans.php')->out(false); ?>">Improvement plans</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Reports</h3>
        <p>Open operational, relationship, progress, and compliance reports.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_reports_link()->out(false); ?>">Live reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link()->out(false); ?>">Managed reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_unmanaged_reports_link()->out(false); ?>">Unmanaged reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_practice_coach.php')->out(false); ?>">Practice coach</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_parent_links_link()->out(false); ?>">Student parent links</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_referrers_link()->out(false); ?>">Referrer links</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link()->out(false); ?>">Quiz reports</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_parent_trust_audit.php')->out(false); ?>">Trust audit</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_parent_trust_review_pack.php')->out(false); ?>">Review pack</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>People & Settings</h3>
        <p>Manage teacher availability, directories, lookup tools, and support configuration.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_teacher_directory_link()->out(false); ?>">Teacher directory</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_availability.php')->out(false); ?>">Availability</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('account_ids.php')->out(false); ?>">Account IDs</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_tester_setup.php')->out(false); ?>">SQA tester setup</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('sqa_test_artifacts.php', ['artifact' => 'library'])->out(false); ?>">Admin/SQA docs</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('student_intake_config.php')->out(false); ?>">Student config</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('teacher_intake_config.php')->out(false); ?>">Teacher config</a>
        </div>
      </article>
      <article class="pqh-card">
        <h3>Compliance</h3>
        <p>Review retention, purge evidence, security, and parent-trust controls.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_parent_trust_retention.php')->out(false); ?>">Retention</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_parent_trust_purge_evidence.php')->out(false); ?>">Purge evidence</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('live_security.php')->out(false); ?>">Security</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_sql_tools_link()->out(false); ?>">SQL tools</a>
        </div>
      </article>
    </section>
  <?php else: ?>
    <?php
      $studentdashboardcontext = pqh_student_course_support_context((int)$USER->id);
      if (!is_array($studentdashboardcontext)) {
          $studentdashboardcontext = [
              'teacher' => '',
              'parent' => '',
              'country' => '',
              'city' => '',
              'timezone' => '',
              'groups' => '',
              'recurring' => '',
              'support' => '',
          ];
      }
      $studentteacher = ($studentdashboardcontext['teacher'] ?? '') !== '' ? $studentdashboardcontext['teacher'] : 'Not assigned';
      $studentparent = ($studentdashboardcontext['parent'] ?? '') !== '' ? $studentdashboardcontext['parent'] : 'Not linked';
      $studentlocation = pqh_join_nonempty([
          $studentdashboardcontext['country'] ?? '',
          $studentdashboardcontext['city'] ?? '',
      ]);
      if ($studentlocation === '') {
          $studentlocation = 'Not set';
      }
      $studenttimezone = ($studentdashboardcontext['timezone'] ?? '') !== '' ? $studentdashboardcontext['timezone'] : 'Not set';
      $studentgroups = ($studentdashboardcontext['groups'] ?? '') !== '' ? $studentdashboardcontext['groups'] : 'Not assigned';
      $studentrecurring = ($studentdashboardcontext['recurring'] ?? '') !== '' ? $studentdashboardcontext['recurring'] : 'No active recurring series';
      $studentsupport = ($studentdashboardcontext['support'] ?? '') !== '' ? $studentdashboardcontext['support'] : 'No extra support context recorded';
      $hasprequraan = isset($currentstudentcourses['pre_quraan']);
      $studentprogressunits = (int)($progress['units'] ?? 0);
      $studentprogresscompleted = (int)($progress['completed'] ?? 0);
      $studentprogressinprogress = (int)($progress['inprogress'] ?? 0);
      $studentprogresssteps = (int)($progress['stars'] ?? 0);
      $studentprogresspercent = $studentprogressunits > 0
          ? min(100, (int)round(($studentprogresscompleted / max(1, $studentprogressunits)) * 100))
          : 0;
      $studentlatest = $progress['latest'] ?? null;
      $studentlatesttitle = 'No lesson activity yet';
      $studentlatestmeta = 'Open your current lesson to start progress tracking.';
      if ($studentlatest) {
          $latestparts = [];
          if (!empty($studentlatest->lesson_title)) {
              $latestparts[] = $studentlatest->lesson_title;
          }
          if (!empty($studentlatest->unit_title)) {
              $latestparts[] = $studentlatest->unit_title;
          }
          $studentlatesttitle = pqh_join_nonempty($latestparts, ' - ');
          if ($studentlatesttitle === '') {
              $studentlatesttitle = 'Recent lesson activity';
          }
          $metaparts = [];
          if (!empty($studentlatest->overall_status)) {
              $metaparts[] = ucfirst(str_replace('_', ' ', (string)$studentlatest->overall_status));
          }
          if (isset($studentlatest->completion_percent)) {
              $metaparts[] = (int)$studentlatest->completion_percent . '% complete';
          }
          if (!empty($studentlatest->overall_lastactivity)) {
              $metaparts[] = userdate((int)$studentlatest->overall_lastactivity, get_string('strftimedatetimeshort'));
          }
          $studentlatestmeta = pqh_join_nonempty($metaparts, ' | ');
          if ($studentlatestmeta === '') {
              $studentlatestmeta = 'Progress activity recorded.';
          }
      }
      $studentspeakcount = (int)($speakrecordings['count'] ?? 0);
      $studentunreadmessages = (int)($messages['unread'] ?? 0);
      $studentfocusready = !empty($focus['tables_ready']);
      $studentfocussessions = (int)($focus['sessions'] ?? 0);
      $studentfocuslabel = (string)($focus['focus_label'] ?? 'No data yet');
      $studentfocusclass = (string)($focus['focus_class'] ?? 'neutral');
      $studentfocussummary = 'Focus tracking tables are not installed yet.';
      if ($studentfocusready && $studentfocussessions <= 0) {
          $studentfocussummary = 'No focus activity has been recorded yet.';
      } else if ($studentfocusready) {
          $studentfocusbits = [];
          $studentfocusbits[] = pqh_format_duration((int)($focus['active_ms'] ?? 0)) . ' active time';
          $studentfocusbits[] = (int)($focus['leave_count'] ?? 0) . ' away event' . ((int)($focus['leave_count'] ?? 0) === 1 ? '' : 's');
          $studentfocusbits[] = (int)($focus['idle_count'] ?? 0) . ' idle reminder' . ((int)($focus['idle_count'] ?? 0) === 1 ? '' : 's');
          if (!empty($focus['latest_unit'])) {
              $studentfocusbits[] = 'Latest: ' . (string)$focus['latest_unit'];
          }
          if (!empty($focus['last_time'])) {
              $studentfocusbits[] = 'Last tracked ' . userdate((int)$focus['last_time'], get_string('strftimedatetimeshort'));
          }
          $studentfocussummary = implode(' | ', $studentfocusbits);
      }
    ?>
    <section class="pqh-progress-block" aria-label="Learning progress">
      <div class="pqh-progress-main">
        <span class="pqh-progress-kicker">Progress</span>
        <h2><?php echo $studentprogresspercent; ?>% completed</h2>
        <p class="pqh-progress-copy">
          <?php echo $studentprogresscompleted; ?> completed lessons,
          <?php echo $studentprogressinprogress; ?> in progress,
          across <?php echo $studentprogressunits; ?> tracked lesson<?php echo $studentprogressunits === 1 ? '' : 's'; ?>.
        </p>
        <div class="pqh-progress-meter" aria-hidden="true"><span style="width: <?php echo $studentprogresspercent; ?>%"></span></div>
        <div class="pqh-progress-stats">
          <span class="pqh-progress-stat"><strong><?php echo $studentprogresscompleted; ?></strong><span>Completed</span></span>
          <span class="pqh-progress-stat"><strong><?php echo $studentprogressinprogress; ?></strong><span>In progress</span></span>
          <span class="pqh-progress-stat"><strong><?php echo $studentprogresssteps; ?></strong><span>Steps done</span></span>
          <span class="pqh-progress-stat"><strong><?php echo $studentunreadmessages; ?></strong><span>Unread messages</span></span>
          <span class="pqh-progress-stat"><strong><?php echo $studentfocussessions; ?></strong><span>Focus sessions</span></span>
        </div>
      </div>
      <div class="pqh-progress-feed">
        <span class="pqh-progress-latest"><b>Latest activity</b><span><?php echo s($studentlatesttitle); ?><?php if ($studentlatestmeta !== ''): ?><br><?php echo s($studentlatestmeta); ?><?php endif; ?></span></span>
        <span class="pqh-progress-latest"><b>Focus &amp; tracking <span class="pqh-focus-pill pqh-focus-pill--<?php echo s($studentfocusclass); ?>"><?php echo s($studentfocuslabel); ?></span></b><span><?php echo s($studentfocussummary); ?></span></span>
        <span class="pqh-progress-latest"><b>Speak practice</b><span><?php echo $studentspeakcount; ?> approved recording<?php echo $studentspeakcount === 1 ? '' : 's'; ?> available for review.</span></span>
      </div>
    </section>
    <section class="pqh-student-overview" aria-label="Student learning overview">
      <article class="pqh-student-panel pqh-student-panel--primary">
        <h2>Learning overview</h2>
        <p>Your course access, live-class setup, family contact, and support notes in one place.</p>
        <?php if ($currentstudentenrollmentstatus !== 'approved'): ?>
          <div class="pqh-alert pqh-alert--error">Enrollment approval is pending. A parent or guardian must approve enrollment before lessons can begin.</div>
        <?php endif; ?>
        <div class="pqh-student-profile">
          <span class="pqh-student-profile__item"><b>Teacher</b><span><?php echo s($studentteacher); ?></span></span>
          <span class="pqh-student-profile__item"><b>Parent</b><span><?php echo s($studentparent); ?></span></span>
          <span class="pqh-student-profile__item"><b>Location</b><span><?php echo s($studentlocation); ?></span></span>
          <span class="pqh-student-profile__item"><b>Time zone</b><span><?php echo s($studenttimezone); ?></span></span>
          <span class="pqh-student-profile__item"><b>Groups</b><span><?php echo s($studentgroups); ?></span></span>
          <span class="pqh-student-profile__item pqh-student-profile__item--wide"><b>Support notes</b><span><?php echo s($studentsupport); ?></span></span>
          <span class="pqh-student-profile__item pqh-student-profile__item--wide"><b>Recurring sessions</b><span><?php echo s($studentrecurring); ?></span></span>
        </div>
      </article>
      <aside class="pqh-student-panel" aria-label="Next actions">
        <h3>Next actions</h3>
        <p>Start with today's lesson, then check live classes and materials.</p>
        <div class="pqh-student-action-list">
          <?php if ($hasprequraan): ?>
            <a class="pqh-student-action pqh-student-action--primary" href="<?php echo pqh_student_lesson_link((int)$USER->id)->out(false); ?>"><span><?php echo $currentstudentenrollmentstatus !== 'approved' ? 'View approval status' : 'Open current lesson'; ?></span><span>&rarr;</span></a>
          <?php endif; ?>
          <?php if (pqh_is_managed_student((int)$USER->id)): ?>
            <a class="pqh-student-action" href="<?php echo pqh_virtual_tutor_link((int)$USER->id)->out(false); ?>"><span>Virtual tutor</span><span>&rarr;</span></a>
          <?php endif; ?>
          <a class="pqh-student-action" href="<?php echo pqh_live_sessions_link($hasworkspace ? $currentworkspaceid : 0)->out(false); ?>"><span>Live sessions</span><span>&rarr;</span></a>
          <a class="pqh-student-action" href="<?php echo pqh_live_schedule_link((int)$USER->id)->out(false); ?>"><span>Live schedule</span><span>&rarr;</span></a>
          <a class="pqh-student-action" href="<?php echo pqh_live_series_schedule_link((int)$USER->id)->out(false); ?>"><span>Class series</span><span>&rarr;</span></a>
          <a class="pqh-student-action" href="<?php echo (new moodle_url('/local/hubredirect/live_calendar.php', ['childid' => (int)$USER->id]))->out(false); ?>"><span>Live calendar</span><span>&rarr;</span></a>
          <?php if ($hasworkspace): ?>
            <a class="pqh-student-action" href="<?php echo pqh_workspace_student_link($currentworkspaceid, (int)$USER->id)->out(false); ?>"><span>Workspace materials</span><span>&rarr;</span></a>
            <a class="pqh-student-action" href="<?php echo pqh_workspace_student_link($currentworkspaceid, (int)$USER->id)->out(false); ?>"><span>Workspace profile</span><span>&rarr;</span></a>
          <?php endif; ?>
          <a class="pqh-student-action" href="<?php echo pqh_course_transcript_link((int)$USER->id, $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>"><span>Unofficial transcript</span><span>&rarr;</span></a>
        </div>
      </aside>
    </section>
    <section class="pqh-student-report-grid" aria-label="Student reports and communication">
      <article class="pqh-student-report">
        <h3>Class feedback</h3>
        <p>Review teacher summaries, safety status, and approved class recordings when they are available.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_summaries_link((int)$USER->id)->out(false); ?>">Teacher feedback</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_trust_link((int)$USER->id)->out(false); ?>">Trust center</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_live_recordings_link((int)$USER->id)->out(false); ?>">Live recordings</a>
        </div>
      </article>
      <article class="pqh-student-report">
        <h3>Practice reports</h3>
        <p>Review quiz results, Speak practice recordings, and your learning report.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_quiz_report_link((int)$USER->id)->out(false); ?>">Quiz report</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_managed_reports_link((int)$USER->id)->out(false); ?>">My report</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_recordings_link((int)$USER->id)->out(false); ?>">Speak recordings</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_course_transcript_link((int)$USER->id, $hasworkspace ? $currentworkspaceid : 0)->out(false); ?>">Unofficial transcript</a>
        </div>
      </article>
      <article class="pqh-student-report">
        <h3>Communications</h3>
        <p>Open messages and announcements from your class team.</p>
        <div class="pqh-actions pqh-workspace-actions">
          <a class="pqh-btn" href="<?php echo pqh_hub_link('communications.php', ['studentid' => (int)$USER->id, 'opencomm' => 'messages'])->out(false); ?>">Open messages</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('communications.php', ['studentid' => (int)$USER->id, 'opencomm' => 'announcements'])->out(false); ?>">Announcements</a>
          <a class="pqh-btn pqh-btn--secondary" href="<?php echo pqh_hub_link('support.php', ['studentid' => (int)$USER->id, 'supporttype' => 'student_helpdesk'])->out(false); ?>">Support</a>
        </div>
      </article>
    </section>
  <?php endif; ?>
</div>
<div id="pqHeaderActionSlot" hidden></div>
</main>
<script>
(function() {
  try {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, document.title, <?php echo json_encode((new moodle_url('/local/hubredirect/dashboard.php', array_merge($pqhpageparams, ['fontsize' => $pqhfontsize])))->out(false)); ?>);
    }
  } catch (error) {}

  document.querySelectorAll('.pqh-back').forEach(function(button) {
    button.addEventListener('click', function() {
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.href = button.getAttribute('data-fallback') || '/local/hubredirect/dashboard.php';
    });
  });

  function removeCourseStartingDateModal() {
    var headings = Array.prototype.slice.call(document.querySelectorAll('.modal-title, .modal-header h1, .modal-header h2, .modal-header h3, h1, h2, h3'));
    headings.forEach(function(heading) {
      if ((heading.textContent || '').trim().toLowerCase() !== 'course starting date') {
        return;
      }
      var modal = heading.closest('.modal, [role="dialog"]');
      if (modal) {
        modal.remove();
      }
    });

    document.querySelectorAll('.modal-backdrop, .modal-backdrop.show').forEach(function(backdrop) {
      backdrop.remove();
    });

    if (!document.querySelector('.modal.show, [role="dialog"][aria-modal="true"]')) {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  }

  removeCourseStartingDateModal();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeCourseStartingDateModal, {once: true});
  }
  if (document.documentElement) {
    new MutationObserver(removeCourseStartingDateModal).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
</script>
<?php if ($dashboardtoken !== '' && $selectedchild && (!empty($selectedchild['cohortid']) || !empty($selectedchild['studentid']))): ?>
<script>
window.__prequran_ws_token = <?php echo json_encode($dashboardtoken); ?>;
window.__prequran_ws_endpoint = <?php echo json_encode(rtrim((string)$CFG->wwwroot, '/') . '/webservice/rest/server.php'); ?>;
window.__prequran_uid = <?php echo (int)$USER->id; ?>;
window.__prequran_cohortid = <?php echo (int)$selectedchild['cohortid']; ?>;
window.__prequran_studentid = <?php echo (int)$selectedchild['studentid']; ?>;
window.__prequran_managed_student = '0';
document.addEventListener('click', function(event) {
  const link = event.target && event.target.closest ? event.target.closest('.js-pqh-open-comm') : null;
  if (!link || !window.PQAnnouncementsPanel) return;
  event.preventDefault();
  const tab = link.getAttribute('data-opencomm') === 'announcements' ? 'announcement' : 'parent_teacher';
  window.PQAnnouncementsPanel.open(tab);
});
</script>
<script src="<?php echo s($assetbase); ?>/shared/js/shared-communications-panel.js?v=<?php echo s($commcachekey); ?>"></script>
<?php endif; ?>
<?php
echo $OUTPUT->footer();
