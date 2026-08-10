<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_offeringlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$explicitworkspaceid = $requestedworkspaceid;
$consumercontext = pqh_current_consumer_context();
$contextworkspaceid = (int)($consumercontext->workspaceid ?? 0);
$isacademyconsumer = (string)($consumercontext->consumer_type ?? '') === 'academy_consumer';
if ($requestedworkspaceid <= 0 && $contextworkspaceid > 0 && !$isacademyconsumer) {
    $requestedworkspaceid = $contextworkspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
if ($workspaceid <= 0) {
    $userconsumer = pqh_user_primary_consumer_context((int)$USER->id);
    if ($userconsumer && (string)($userconsumer->consumerslug ?? '') !== ''
            && (string)($userconsumer->consumerslug ?? '') !== (string)($consumercontext->consumerslug ?? '')) {
        redirect(pqh_user_consumer_dashboard_url($userconsumer));
    }
    if ($isacademyconsumer) {
        $academyparams = [];
        if ((string)($consumercontext->consumerslug ?? '') !== '') {
            $academyparams['consumer'] = (string)$consumercontext->consumerslug;
        }
        redirect(new moodle_url('/local/hubredirect/dashboard.php', $academyparams));
    }
    pqh_access_denied(
        'No teaching workspace is linked to this account yet.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Workspace access not available'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'The selected teaching workspace was not found.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Workspace not found'
    );
}
pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);

if ((int)($consumercontext->workspaceid ?? 0) !== $workspaceid && pqh_consumer_schema_ready()) {
    $workspaceconsumer = pqh_consumer_context_by_workspace($workspaceid);
    if ($workspaceconsumer) {
        $consumercontext = $workspaceconsumer;
    }
}
$role = pqh_user_workspace_role((int)$USER->id, $workspaceid);
if ($role === '') {
    $userconsumer = pqh_user_primary_consumer_context((int)$USER->id);
    if ($userconsumer && (string)($userconsumer->consumerslug ?? '') !== ''
            && (string)($userconsumer->consumerslug ?? '') !== (string)($consumercontext->consumerslug ?? '')) {
        redirect(pqh_user_consumer_dashboard_url($userconsumer));
    }
    if ($isacademyconsumer && $explicitworkspaceid <= 0) {
        $academyparams = [];
        if ((string)($consumercontext->consumerslug ?? '') !== '') {
            $academyparams['consumer'] = (string)$consumercontext->consumerslug;
        }
        redirect(new moodle_url('/local/hubredirect/dashboard.php', $academyparams));
    }
    pqh_access_denied(
        'This account is not a member of the selected teaching workspace.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Workspace access denied'
    );
}

if ($role === 'student') {
    $studentparams = [];
    if ((string)($consumercontext->consumerslug ?? '') !== '') {
        $studentparams['consumer'] = (string)$consumercontext->consumerslug;
    }
    $studentparams['workspaceid'] = $workspaceid;
    redirect(new moodle_url('/local/hubredirect/dashboard.php', $studentparams));
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
// Name the school in the browser tab and heading, the way dashboard.php
// already does. A bare "Workspace Dashboard" gives no clue which workspace
// is on screen -- and under a parent academy that owns several schools, the
// switcher above can move between them without the title changing at all.
// Prefer the workspace's own name (what the app bar shows) over the
// domain's consumer name, since the two diverge once a workspace is picked.
$pqwdbrandname = trim((string)($workspace->name ?? ''));
if ($pqwdbrandname === '') {
    $pqwdbrandname = trim((string)($consumercontext->consumername ?? ''));
}
$pqwdpagetitle = $pqwdbrandname !== '' ? $pqwdbrandname . ' Workspace Dashboard' : 'Workspace Dashboard';
$PAGE->set_title($pqwdpagetitle);
$PAGE->set_heading($pqwdpagetitle);
$PAGE->add_body_class('pqw-dashboard-page');

function pqwd_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqwd_count_records(string $table, array $conditions): int {
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

function pqwd_workspace_students(int $workspaceid, int $soloteacherid = 0): array {
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
                'name' => pqwd_user_name((int)$row->userid),
                'accountno' => $user ? pqh_account_no_value($user) : '',
            ];
        }
    }

    if (pqh_table_exists_safe('local_prequran_student_profile') && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')) {
        // current_grade only exists once the primary-education intake schema
        // upgrade has run, so ask for it only when the column is really there.
        $profilefields = 'id,userid,student_display_name,current_level,status';
        $hasgrade = pqh_table_has_field_safe('local_prequran_student_profile', 'current_grade');
        if ($hasgrade) {
            $profilefields .= ',current_grade';
        }
        $rows = $DB->get_records('local_prequran_student_profile', ['workspaceid' => $workspaceid], 'timemodified DESC', $profilefields);
        foreach ($rows as $row) {
            $studentid = (int)$row->userid;
            if ($studentid <= 0) {
                continue;
            }
            $students[$studentid] = [
                'studentid' => $studentid,
                'source' => 'profile',
                'name' => trim((string)$row->student_display_name) !== '' ? (string)$row->student_display_name : pqwd_user_name($studentid),
                'level' => (string)($row->current_level ?? ''),
                'grade' => $hasgrade ? (string)($row->current_grade ?? '') : '',
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
                'name' => pqwd_user_name($studentid),
                'accountno' => $user ? pqh_account_no_value($user) : '',
            ];
        }
    }

    uasort($students, static function(array $a, array $b): int {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return array_values($students);
}

function pqwd_student_teacher_labels(int $workspaceid): array {
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

function pqwd_student_course_labels(array $studentids): array {
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

/**
 * Every member of the workspace, in every status -- the Workspace Members
 * panel carries the same search/role/status filters as workspace_people.php,
 * and those can only be honest if they filter the full roster rather than a
 * truncated "most recently changed" preview.
 */
function pqwd_all_members(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT wm.id, wm.userid, wm.workspace_role, wm.status, wm.timecreated, wm.timemodified,
                u.firstname, u.lastname, u.email, u.username, u.idnumber
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
       ORDER BY wm.status ASC, wm.workspace_role ASC, u.lastname ASC, u.firstname ASC, wm.userid ASC",
        ['workspaceid' => $workspaceid]
    ));
}

/**
 * Every course offering in the workspace, in every status, with seat counts
 * and the linked Moodle course name -- the Workspace Courses report carries
 * the same search/status/visibility filters as Workspace People, so it needs
 * the full list rather than a published-only subset.
 */
function pqwd_workspace_courses(int $workspaceid): array {
    global $DB;
    if ($workspaceid <= 0 || !pqco_table_ready()) {
        return [];
    }
    try {
        $offerings = array_values($DB->get_records(
            'local_prequran_course_offering',
            ['workspaceid' => $workspaceid],
            'startdate DESC, title ASC'
        ));
    } catch (Throwable $e) {
        return [];
    }
    if (!$offerings) {
        return [];
    }

    $counts = pqco_offering_counts(array_map(static function($offering): int {
        return (int)$offering->id;
    }, $offerings));

    $moodlenames = [];
    $courseids = array_values(array_unique(array_filter(array_map(static function($offering): int {
        return (int)($offering->moodlecourseid ?? 0);
    }, $offerings))));
    if ($courseids) {
        [$insql, $params] = $DB->get_in_or_equal($courseids, SQL_PARAMS_NAMED, 'cid');
        foreach ($DB->get_records_select('course', "id {$insql}", $params, '', 'id,fullname') as $row) {
            $moodlenames[(int)$row->id] = (string)$row->fullname;
        }
    }

    $courses = [];
    foreach ($offerings as $offering) {
        $capacity = (int)($offering->capacity ?? 0);
        $enrolled = (int)($counts[(int)$offering->id] ?? 0);
        $moodlecourseid = (int)($offering->moodlecourseid ?? 0);
        $courses[] = [
            'id' => (int)$offering->id,
            'title' => trim((string)($offering->title ?? '')),
            'coursekey' => trim((string)($offering->course_key ?? '')),
            'status' => trim((string)($offering->status ?? '')) !== '' ? trim((string)$offering->status) : 'draft',
            'visibility' => trim((string)($offering->visibility ?? '')) !== '' ? trim((string)$offering->visibility) : 'workspace',
            'capacity' => $capacity,
            'enrolled' => $enrolled,
            'openseats' => $capacity > 0 ? max(0, $capacity - $enrolled) : 0,
            'unlimited' => $capacity <= 0,
            'startdate' => (int)($offering->startdate ?? 0),
            'enddate' => (int)($offering->enddate ?? 0),
            'moodlecourseid' => $moodlecourseid,
            'moodlecoursename' => $moodlenames[$moodlecourseid] ?? '',
        ];
    }
    return $courses;
}

function pqwd_upcoming_sessions(int $workspaceid, int $limit = 8): array {
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

function pqwd_session_action_label($session, bool $canmanage): string {
    global $USER;
    if ($canmanage || (int)$session->teacherid === (int)$USER->id) {
        return ((string)$session->status === 'completed') ? 'Open room' : 'Start class';
    }
    return 'Join class';
}

function pqwd_role_counts(int $workspaceid): array {
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

function pqwd_workspace_domains(int $workspaceid): array {
    global $DB;
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_consumer_domain')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_consumer_domain', [
        'workspaceid' => $workspaceid,
        'status' => 'active',
    ], 'isprimary DESC, domain_type ASC, domain ASC'));
}

function pqwd_domain_url(string $domain, string $path, array $params = []): moodle_url {
    $domain = pqh_normalize_consumer_host($domain);
    $path = '/' . ltrim($path, '/');
    if ($domain === '') {
        return new moodle_url($path, $params);
    }
    return new moodle_url('https://' . $domain . $path, $params);
}

$workspaces = pqh_user_workspaces((int)$USER->id);
$rolecounts = pqwd_role_counts($workspaceid);
$issoloteacherworkspace = (string)($workspace->workspace_type ?? '') === 'solo_teacher';
$soloteacherid = $issoloteacherworkspace ? (int)($workspace->ownerid ?? 0) : 0;
if ($soloteacherid <= 0 && $issoloteacherworkspace && $role === 'teacher') {
    $soloteacherid = (int)$USER->id;
}
$students = pqwd_workspace_students($workspaceid, $soloteacherid);
$studentteachers = pqwd_student_teacher_labels($workspaceid);
$studentcourses = pqwd_student_course_labels(array_column($students, 'studentid'));
$members = pqwd_all_members($workspaceid);
$courses = pqwd_workspace_courses($workspaceid);
$sessions = pqwd_upcoming_sessions($workspaceid);
$domains = pqwd_workspace_domains($workspaceid);
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$canteach = pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid);
if ($canteach && !$canmanage) {
    // Teachers see only their own students: direct teacher-student
    // assignments plus members of class groups they lead. Workspace
    // admins/owners keep the full list.
    $teacherscopedids = [];
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', [
            'teacherid' => (int)$USER->id,
            'status' => 'active',
        ], '', 'id,studentid');
        foreach ($rows as $row) {
            $teacherscopedids[(int)$row->studentid] = true;
        }
    }
    if (pqh_table_exists_safe('local_prequran_class_group') && pqh_table_exists_safe('local_prequran_group_member')) {
        $rows = $DB->get_records_sql(
            "SELECT gm.id, gm.studentid
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} g ON g.id = gm.groupid
              WHERE g.teacherid = :teacherid
                AND gm.assignment_status = :status",
            ['teacherid' => (int)$USER->id, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $teacherscopedids[(int)$row->studentid] = true;
        }
    }
    $students = array_values(array_filter($students, static function(array $student) use ($teacherscopedids): bool {
        return isset($teacherscopedids[(int)$student['studentid']]);
    }));
    $studentcourses = pqwd_student_course_labels(array_column($students, 'studentid'));
}
// Workspace People: one roster combining workspace_member rows with the
// student list, so staff search one table instead of scanning two that
// overlap. Members supply role/status/updated for everyone; the student
// list adds learners who only exist as a student profile (no member row)
// and supplies the teacher/level/links detail for the ones it covers.
// $students is already teacher-scoped above when the viewer is a teacher
// rather than an admin, so enriching from it preserves that scoping --
// plain member rows stay visible exactly as they were before.
$people = [];
foreach ($members as $pqwdmember) {
    $pqwduserid = (int)$pqwdmember->userid;
    $people[$pqwduserid] = [
        'userid' => $pqwduserid,
        'name' => fullname($pqwdmember),
        'accountlabel' => pqh_account_no_label($pqwdmember),
        'accountno' => pqh_account_no_value($pqwdmember),
        'email' => (string)($pqwdmember->email ?? ''),
        'username' => (string)($pqwdmember->username ?? ''),
        'role' => (string)$pqwdmember->workspace_role,
        'status' => (string)$pqwdmember->status,
        'timemodified' => (int)$pqwdmember->timemodified,
        'isstudent' => (string)$pqwdmember->workspace_role === 'student',
        'level' => '',
        'grade' => '',
        'hasdetail' => false,
    ];
}
foreach ($students as $pqwdstudent) {
    $pqwduserid = (int)$pqwdstudent['studentid'];
    if ($pqwduserid <= 0) {
        continue;
    }
    if (!isset($people[$pqwduserid])) {
        $pqwdaccountno = (string)($pqwdstudent['accountno'] ?? '');
        $people[$pqwduserid] = [
            'userid' => $pqwduserid,
            'name' => (string)$pqwdstudent['name'],
            'accountlabel' => $pqwdaccountno !== '' ? 'Account No. ' . $pqwdaccountno : 'Account No. pending repair',
            'accountno' => $pqwdaccountno,
            'email' => '',
            'username' => '',
            'role' => 'student',
            // Student profiles can carry an empty status; left as-is it renders
            // a blank pill and a blank entry in the Status filter.
            'status' => trim((string)($pqwdstudent['status'] ?? '')) !== ''
                ? trim((string)$pqwdstudent['status'])
                : 'active',
            'timemodified' => 0,
            'isstudent' => true,
            'level' => '',
            'grade' => '',
            'hasdetail' => false,
        ];
    }
    $people[$pqwduserid]['isstudent'] = true;
    $people[$pqwduserid]['hasdetail'] = true;
    $people[$pqwduserid]['level'] = (string)($pqwdstudent['level'] ?? '');
    $people[$pqwduserid]['grade'] = (string)($pqwdstudent['grade'] ?? '');
}
$pqwdroleorder = ['owner' => 1, 'admin' => 2, 'coordinator' => 3, 'teacher' => 4, 'assistant_teacher' => 5, 'parent' => 6, 'student' => 7];
uasort($people, static function(array $a, array $b) use ($pqwdroleorder): int {
    $astatus = $a['status'] === 'active' ? 0 : 1;
    $bstatus = $b['status'] === 'active' ? 0 : 1;
    if ($astatus !== $bstatus) {
        return $astatus <=> $bstatus;
    }
    $arole = $pqwdroleorder[$a['role']] ?? 8;
    $brole = $pqwdroleorder[$b['role']] ?? 8;
    if ($arole !== $brole) {
        return $arole <=> $brole;
    }
    return strcasecmp($a['name'], $b['name']);
});
$people = array_values($people);

$canmanageofferings = $canmanage || (
    (string)($workspace->workspace_type ?? '') === 'solo_teacher'
    && pqh_has_independent_teacher_profile((int)$USER->id)
    && $role === 'teacher'
);
$canacademyops = pqh_can_manage_academy_operations((int)$USER->id);
$consumerparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $consumerparams['consumer'] = (string)$consumercontext->consumerslug;
}
// Teachers and students use the standard dashboard experience across all
// consumer types; the workspace dashboard is the management view for
// owners, admins, and platform operators.
if (!$canmanage && !$canacademyops
        && in_array($role, ['teacher', 'assistant_teacher', 'student', 'parent'], true)) {
    redirect(new moodle_url('/local/hubredirect/dashboard.php', $consumerparams));
}
$workspaceparams = $consumerparams + ['workspaceid' => $workspaceid];
$primarydomain = (string)($consumercontext->domain ?? '');
foreach ($domains as $domainrow) {
    if ((int)($domainrow->isprimary ?? 0) === 1) {
        $primarydomain = (string)$domainrow->domain;
        break;
    }
}
$studentintakeurl = pqwd_domain_url($primarydomain, '/local/hubredirect/public_intake.php', $workspaceparams);
$teacheronboardingurl = pqwd_domain_url($primarydomain, '/local/hubredirect/teacher_intake.php', $workspaceparams);
// Not a public/custom-domain page - it requires login, so it must stay on
// the current (already-authenticated) domain rather than routing through
// the consumer's primary domain, which would force a fresh login there.
$coursecatalogurl = new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams);
$metrics = [
    'students' => count($students),
    'teachers' => ($rolecounts['teacher'] ?? 0) + ($rolecounts['assistant_teacher'] ?? 0),
    'admins' => ($rolecounts['owner'] ?? 0) + ($rolecounts['admin'] ?? 0) + ($rolecounts['coordinator'] ?? 0),
    'sessions' => count($sessions),
    'groups' => pqwd_count_records('local_prequran_class_group', ['workspaceid' => $workspaceid]),
    'materials' => pqwd_count_records('local_prequran_workspace_material', ['workspaceid' => $workspaceid, 'status' => 'active']),
    'offerings' => pqwd_count_records('local_prequran_course_offering', ['workspaceid' => $workspaceid, 'status' => 'published']),
    'pending_enrollments' => pqwd_count_records('local_prequran_course_enrol_req', ['workspaceid' => $workspaceid, 'status' => 'pending']),
];

// ---- Phase 3 analytics: computed live per workspace (tenant scale keeps
// these queries cheap; move to scheduled aggregation if tenants grow). ----
$pqwdnow = time();
$pqwdweek = [];
$pqwdweekmax = 1;
$pqwdheld30 = 0;
$pqwdattrate = null;
if (pqh_table_exists_safe('local_prequran_live_session')) {
    for ($pqwdi = 6; $pqwdi >= 0; $pqwdi--) {
        $pqwddaystart = usergetmidnight($pqwdnow - $pqwdi * DAYSECS);
        $pqwdcount = (int)$DB->count_records_select(
            'local_prequran_live_session',
            'workspaceid = ? AND scheduled_start >= ? AND scheduled_start < ? AND status <> ?',
            [$workspaceid, $pqwddaystart, $pqwddaystart + DAYSECS, 'cancelled']
        );
        $pqwdweek[] = ['label' => userdate($pqwddaystart, '%a'), 'count' => $pqwdcount];
        $pqwdweekmax = max($pqwdweekmax, $pqwdcount);
    }
    $pqwdheld30 = (int)$DB->count_records_select(
        'local_prequran_live_session',
        'workspaceid = ? AND scheduled_end >= ? AND scheduled_end < ? AND status IN (?, ?)',
        [$workspaceid, $pqwdnow - 30 * DAYSECS, $pqwdnow, 'completed', 'live']
    );
    if (pqh_table_exists_safe('local_prequran_live_attendance') && pqh_table_exists_safe('local_prequran_live_participant')) {
        $pqwdexpected = (int)$DB->count_records_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_participant} p
               JOIN {local_prequran_live_session} s ON s.id = p.sessionid
              WHERE s.workspaceid = ? AND p.role = 'student' AND p.status = 'active'
                AND s.scheduled_end >= ? AND s.scheduled_end < ? AND s.status <> 'cancelled'",
            [$workspaceid, $pqwdnow - 30 * DAYSECS, $pqwdnow]
        );
        $pqwdattended = (int)$DB->count_records_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_attendance} a
               JOIN {local_prequran_live_session} s ON s.id = a.sessionid
              WHERE s.workspaceid = ? AND a.join_time > 0
                AND s.scheduled_end >= ? AND s.scheduled_end < ?",
            [$workspaceid, $pqwdnow - 30 * DAYSECS, $pqwdnow]
        );
        if ($pqwdexpected > 0) {
            $pqwdattrate = (int)round(100 * min($pqwdattended, $pqwdexpected) / $pqwdexpected);
        }
    }
}
$pqwdinactive = 0;
$pqwdstudentids = [];
foreach ($students as $pqwdstudent) {
    $pqwdsid = (int)($pqwdstudent['studentid'] ?? 0);
    if ($pqwdsid > 0) {
        $pqwdstudentids[$pqwdsid] = $pqwdsid;
    }
}
if ($pqwdstudentids) {
    [$pqwdinsql, $pqwdinparams] = $DB->get_in_or_equal(array_values($pqwdstudentids), SQL_PARAMS_NAMED, 'pqwdst');
    $pqwdinparams['cutoff'] = $pqwdnow - 14 * DAYSECS;
    $pqwdinactive = (int)$DB->count_records_select('user', "id $pqwdinsql AND deleted = 0 AND lastaccess < :cutoff", $pqwdinparams);
}

echo $OUTPUT->header();
?>
<style>
body.pqw-dashboard-page header,body.pqw-dashboard-page footer,body.pqw-dashboard-page nav.navbar,body.pqw-dashboard-page #page-header,body.pqw-dashboard-page #page-footer,body.pqw-dashboard-page .drawer,body.pqw-dashboard-page .drawer-toggles,body.pqw-dashboard-page .block-region,body.pqw-dashboard-page [data-region="drawer"],body.pqw-dashboard-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-dashboard-page #page,body.pqw-dashboard-page #page-content,body.pqw-dashboard-page #region-main,body.pqw-dashboard-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwd-shell{min-height:100vh;padding:28px 18px 56px;background:#fff;color:#173044;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6}.pqwd-wrap{max-width:1280px;margin:0 auto}.pqwd-top,.pqwd-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwd-top{display:grid;grid-template-columns:minmax(300px,1fr) minmax(520px,auto);gap:14px;align-items:center;margin-bottom:14px}.pqwd-top>div{min-width:0}.pqwd-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1;overflow-wrap:anywhere}.pqwd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800;line-height:1.45}.pqwd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;min-width:0}.pqwd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;line-height:1.15;text-align:center;cursor:pointer;white-space:normal}.pqwd-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwd-btn--compact{min-height:32px;padding:0 10px;font-size:12px}.pqwd-select{min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:850;padding:0 10px;max-width:100%}.pqwd-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-bottom:14px}.pqwd-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqwd-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqwd-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqwd-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.pqwd-panel h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950;line-height:1.15}.pqwd-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.pqwd-panel-head h2{margin:0}.pqwd-table{width:100%;border-collapse:separate;border-spacing:0}.pqwd-table th,.pqwd-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwd-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwd-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwd-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800;line-height:1.4}.pqwd-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;line-height:1.2}.pqwd-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwd-cardlinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwd-link{display:block;min-height:86px;padding:14px;border-radius:8px;background:#f7fbf8;border:1px solid rgba(47,111,78,.16);color:#173044!important;text-decoration:none}.pqwd-link strong{display:block;color:#221b22;font-size:15px;font-weight:950}.pqwd-link span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:850;line-height:1.35}.pqwd-row-actions{display:flex;gap:6px;flex-wrap:wrap}.pqwd-public{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(460px,1.15fr);gap:18px;align-items:start;margin-bottom:14px;background:linear-gradient(90deg,#f7fbf8,#fff9ed)}.pqwd-public>div{min-width:0}.pqwd-public-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;justify-content:stretch;align-items:start}.pqwd-public-links .pqwd-btn{width:100%;min-height:42px}.pqwd-code{display:inline-block;margin-top:6px;padding:4px 7px;border-radius:6px;background:#eef4f6;color:#173044;font-size:12px;font-weight:900;overflow-wrap:anywhere}.pqwd-domain-list{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
@media(max-width:1180px){.pqwd-top,.pqwd-public{grid-template-columns:1fr}.pqwd-actions,.pqwd-public-links{justify-content:flex-start}.pqwd-public-links{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.pqwd-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.pqwd-grid{grid-template-columns:1fr}}
@media(max-width:760px){.pqwd-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.pqwd-actions .pqwd-select{grid-column:1/-1}.pqwd-metrics,.pqwd-cardlinks,.pqwd-public-links{grid-template-columns:1fr}.pqwd-title{font-size:25px}.pqwd-table,.pqwd-table tbody,.pqwd-table tr,.pqwd-table td{display:block;width:100%}.pqwd-table thead{display:none}.pqwd-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqwd-table td{border:0}.pqwd-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
<?php echo pqh_workspace_header_css(); ?>
.pqwd-top.pqh-workspace-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
}
.pqwd-top.pqh-workspace-top > div:first-child {
    flex: 1 1 420px;
    min-width: min(100%, 320px);
    max-width: 100%;
}
.pqwd-title.pqh-workspace-title {
    display: flex !important;
    align-items: center;
    gap: 14px;
    flex-wrap: nowrap;
    overflow-wrap: normal !important;
    word-break: normal !important;
    white-space: normal;
}
.pqwd-title.pqh-workspace-title > span:last-child {
    display: block;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: normal !important;
    word-break: normal !important;
    white-space: normal;
}
.pqwd-actions.pqh-workspace-actions {
    flex: 1 1 540px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 320px;
}
.pqwd-actions.pqh-workspace-actions .pqwd-btn,
.pqwd-actions.pqh-workspace-actions .pqwd-select {
    flex: 0 1 auto;
}
@media (max-width: 1180px) {
    .pqwd-actions.pqh-workspace-actions {
        flex-basis: 100%;
        justify-content: flex-start;
        min-width: 0;
    }
}
@media (max-width: 760px) {
    .pqwd-top.pqh-workspace-top > div:first-child,
    .pqwd-actions.pqh-workspace-actions {
        flex-basis: 100%;
        min-width: 0;
    }
    .pqwd-title.pqh-workspace-title {
        align-items: flex-start;
        font-size: 24px;
    }
    .pqwd-actions.pqh-workspace-actions .pqwd-btn,
    .pqwd-actions.pqh-workspace-actions .pqwd-select {
        width: 100%;
    }
}
/* ============================================================
   Workspace design system (2026-07-18): same modern layer as the
   dashboard - tokens, blue top band, light rail, quiet surfaces.
   ============================================================ */
.pqwd-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;
  --pqh-line:#e4e9ef;--pqh-bg:#f7f4ec;--pqh-surface:#ffffff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;
  --pqh-primary-ink:#17498f;--pqh-r:14px;
  --pqh-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);
  background:#fff;color:var(--pqh-ink);padding:0 0 56px 76px}
.pqwd-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
.pqwd-wrap{padding:24px 24px 0}
.pqwd-topbar__brand .pqh-brand-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqwd-top.pqh-workspace-top{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;box-shadow:none!important;border-radius:var(--pqh-r)!important;padding:20px 22px!important}
.pqwd-title,.pqwd-title.pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqwd-sub,.pqwd-sub.pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqh-brand-mark{background:linear-gradient(115deg,#2166d1,#4d8be0)!important;color:#fff!important}
.pqwd-actions .pqwd-btn,.pqwd-actions .pqwd-select,.pqh-workspace-actions a,.pqh-workspace-actions button{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqwd-actions .pqwd-btn:hover,.pqh-workspace-actions a:hover,.pqh-workspace-actions button:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important}
.pqwd-actions .pqwd-btn[data-pq-support-action="new"]{background:var(--pqh-primary)!important;border-color:var(--pqh-primary)!important;color:#fff!important}
.pqwd-actions a.pqh-workspace-logout{background:var(--pqh-ink)!important;border-color:var(--pqh-ink)!important;color:#fff!important}
.pqwd-actions a.pqh-workspace-logout:hover{background:#1c3a5c!important}
.pqwd-panel,.pqwd-metric{background:var(--pqh-surface);border:1px solid var(--pqh-line)!important;border-radius:var(--pqh-r);box-shadow:var(--pqh-shadow)}
.pqwd-panel h2{color:var(--pqh-ink);font-size:17px;font-weight:750;letter-spacing:-.01em}
.pqwd-metric strong{color:var(--pqh-ink);font-size:24px;font-weight:750;letter-spacing:-.02em}
.pqwd-metric span{color:var(--pqh-faint);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.pqwd-link{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:12px;transition:transform .16s ease,box-shadow .16s ease;box-shadow:var(--pqh-shadow)}
.pqwd-link:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(15,34,55,.06),0 18px 38px -16px rgba(15,34,55,.22);text-decoration:none}
.pqwd-link strong{color:var(--pqh-ink);font-weight:700}
.pqwd-link span{color:var(--pqh-muted);font-weight:500}
.pqwd-public{background:var(--pqh-surface)!important}
.pqwd-pill,.pqwd-code{background:var(--pqh-tint);color:var(--pqh-primary-ink);font-weight:650;border-radius:8px}
.pqwd-muted{color:var(--pqh-muted);font-weight:500}
.pqwd-name{color:var(--pqh-ink);font-weight:650}
.pqwd-table th{color:var(--pqh-faint);font-weight:700}
.pqwd-table th,.pqwd-table td{border-color:var(--pqh-line)}
.pqwd-empty{background:var(--pqh-surface);border:1px dashed var(--pqh-line);border-radius:var(--pqh-r);color:var(--pqh-muted);font-weight:550}
.pqwd-select{border:1px solid var(--pqh-line)!important;border-radius:10px!important;background:var(--pqh-surface)!important;color:var(--pqh-ink)!important;font-weight:550!important}
.pqwd-input{width:100%;min-height:38px;border:1px solid var(--pqh-line);border-radius:10px;padding:0 10px;background:var(--pqh-surface);color:var(--pqh-ink);font-size:13px;font-weight:550}
.pqwd-field{display:grid;gap:5px;margin-bottom:0}
.pqwd-field label{color:var(--pqh-faint);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.pqwd-toolbar--filters{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:end;margin:8px 0 12px}
.pqwd-toolbar--filters .pqwd-field{min-width:150px}
.pqwd-toolbar--filters .pqwd-field:first-child{flex:1 1 240px}
.pqwd-toolbar--filters>.pqwd-muted{align-self:center;margin-left:auto}
.pqwd-pill--inactive{background:#fbe9e7;color:#c0392b}
.pqwd-row-hidden{display:none}
.pqwd-person{display:flex;align-items:center;gap:8px}
.pqwd-person .pqwd-name{font-size:13px;font-weight:500}
.pqwd-infobtn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:1px solid var(--pqh-line);border-radius:50%;background:var(--pqh-surface);color:var(--pqh-muted);cursor:pointer}
.pqwd-infobtn:hover{background:var(--pqh-tint);border-color:var(--pqh-tint-2);color:var(--pqh-primary-ink)}
.pqwd-infobtn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pqwd-modal[hidden]{display:none}
.pqwd-modal{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,34,55,.45)}
.pqwd-modal__box{width:min(520px,100%);max-height:85vh;overflow:auto;padding:20px 22px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:14px;background:var(--pqh-surface,#fff);box-shadow:0 24px 60px -20px rgba(15,34,55,.5)}
.pqwd-modal__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.pqwd-modal__head h3{margin:0;color:var(--pqh-ink,#0f2237);font-size:18px;font-weight:750}
.pqwd-modal__close{flex:0 0 auto;width:30px;height:30px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:8px;background:var(--pqh-surface,#fff);color:var(--pqh-muted,#5b6b7c);font-size:16px;line-height:1;cursor:pointer}
.pqwd-modal__close:hover{background:var(--pqh-tint,#edf3fc)}
.pqwd-modal__grid{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;font-size:13px}
.pqwd-modal__grid dt{color:var(--pqh-faint,#8494a5);font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.04em;align-self:center}
.pqwd-modal__grid dd{margin:0;color:var(--pqh-ink,#0f2237);font-weight:550;overflow-wrap:anywhere}
.pqwd-modal__block{margin-top:16px}
.pqwd-modal__block[hidden]{display:none}
.pqwd-modal__block h4{margin:0 0 8px;color:var(--pqh-faint,#8494a5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.pqwd-modal__block table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px}
.pqwd-modal__block th{padding:6px 8px;border-bottom:1px solid var(--pqh-line,#e4e9ef);color:var(--pqh-faint,#8494a5);font-size:11px;font-weight:700;text-transform:uppercase;text-align:left}
.pqwd-modal__block td{padding:7px 8px;border-bottom:1px solid var(--pqh-line,#e4e9ef);color:var(--pqh-ink,#0f2237);font-weight:550;vertical-align:top}
.pqwd-modal__block td:first-child,.pqwd-modal__block th:first-child{width:34px;color:var(--pqh-faint,#8494a5)}
.pqwd-modal__actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
@media(max-width:560px){.pqwd-modal__grid{grid-template-columns:1fr;gap:2px 0}.pqwd-modal__grid dd{margin-bottom:8px}}
.pqwd-bars{display:flex;align-items:flex-end;gap:10px;height:130px;padding-top:8px}
.pqwd-bars>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;min-width:0;height:100%}
.pqwd-bars i{width:100%;max-width:38px;border-radius:7px 7px 0 0;background:var(--pqh-tint-2)}
.pqwd-bars i.f{background:var(--pqh-primary)}
.pqwd-bars b{font-size:10.5px;color:var(--pqh-faint);font-weight:650}
.pqwd-bars em{font-style:normal;font-size:11px;font-weight:750;color:var(--pqh-ink)}
.pqwd-todo{display:grid;gap:8px}
.pqwd-todo__item{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:12px;background:var(--pqh-bg)}
.pqwd-todo__ico{flex:0 0 auto;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800}
.pqwd-todo__ico--warn{background:#faf1dd;color:#b7791f}
.pqwd-todo__ico--risk{background:#fbe9e7;color:#c0392b}
.pqwd-todo__ico--ok{background:#e8f4ec;color:#2e7d4f}
.pqwd-todo__body{min-width:0;flex:1}
.pqwd-todo__body strong{display:block;font-size:12.5px;font-weight:700;color:var(--pqh-ink)}
.pqwd-todo__body span{display:block;color:var(--pqh-muted);font-size:11.5px;font-weight:500}
<?php echo pqh_design_shell_css('.pqwd-shell'); ?>
</style>
<style><?php echo pqh_openproject_skin_css('pqwd', 'pqw-dashboard-page'); ?></style>
<style><?php echo pqh_openproject_skin_css(['pqwd-todo', 'pqwd-modal'], '', '__'); ?></style>
<main class="pqwd-shell">
<?php
$pqwdshellextra = '<button type="button" onclick="window.history.back()">Back</button>';
echo pqh_design_shell_html('pqwd-shell', 'dashboard', [
    'title' => (string)$workspace->name,
    'appbar' => [
        ['Workspace', new moodle_url('/local/hubredirect/admin_workspace.php', $workspaceparams)],
        ['School Hub', new moodle_url('/local/hubredirect/consumer_landing.php', $workspaceparams)],
    ],
    'hideitems' => ['dashboard'],
    'extrahtml' => $pqwdshellextra,
]);
?>
  <div class="pqwd-wrap">
    <section class="pqwd-top pqh-workspace-top">
      <form class="pqwd-actions pqh-workspace-actions" method="get" aria-label="Workspace switcher" style="margin-left:auto">
        <?php if (count($workspaces) > 1): ?>
          <select class="pqwd-select" name="workspaceid" onchange="this.form.submit()">
            <?php foreach ($workspaces as $candidate): ?>
              <option value="<?php echo (int)$candidate->id; ?>" <?php echo (int)$candidate->id === $workspaceid ? 'selected' : ''; ?>><?php echo s($candidate->name); ?></option>
            <?php endforeach; ?>
          </select>
        <?php endif; ?>
      </form>
    </section>

    <?php if (!$issoloteacherworkspace || $canacademyops): ?>
    <section class="pqwd-panel pqwd-public" aria-label="Public and custom-domain links">
      <div>
        <h2>Public Workspace Links</h2>
        <span class="pqwd-muted">Use these to test the institution domain, course catalog, and intake flows.</span>
        <span class="pqwd-code"><?php echo s($primarydomain !== '' ? $primarydomain : $CFG->wwwroot); ?></span>
        <div class="pqwd-domain-list">
          <?php foreach ($domains as $domainrow): ?>
            <span class="pqwd-pill"><?php echo s((string)$domainrow->domain); ?> / <?php echo s((string)$domainrow->domain_type); ?><?php echo (int)($domainrow->isprimary ?? 0) === 1 ? ' / primary' : ''; ?></span>
          <?php endforeach; ?>
          <?php if (!$domains): ?><span class="pqwd-pill">No custom domain rows found</span><?php endif; ?>
        </div>
      </div>
      <div class="pqwd-public-links">
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $studentintakeurl->out(false); ?>">Student intake</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $coursecatalogurl->out(false); ?>">Course catalog</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $teacheronboardingurl->out(false); ?>">Teacher onboarding</a>
      </div>
    </section>
    <?php endif; ?>

    <section class="pqwd-metrics" aria-label="Workspace metrics">
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['teachers']; ?></strong><span>teachers</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['admins']; ?></strong><span>admins</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['groups']; ?></strong><span>class groups</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['sessions']; ?></strong><span>upcoming sessions</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['offerings']; ?></strong><span>course offerings</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$metrics['pending_enrollments']; ?></strong><span>pending enrollments</span></div>
      <div class="pqwd-metric"><strong><?php echo $pqwdattrate !== null ? $pqwdattrate . '%' : '—'; ?></strong><span>attendance · 30d</span></div>
      <div class="pqwd-metric"><strong><?php echo (int)$pqwdheld30; ?></strong><span>sessions held · 30d</span></div>
      <div class="pqwd-metric"><strong<?php echo $pqwdinactive > 0 ? ' style="color:#c0392b"' : ''; ?>><?php echo (int)$pqwdinactive; ?></strong><span>inactive students · 14d</span></div>
    </section>

    <section class="pqwd-grid" aria-label="Workspace analytics" style="margin-bottom:14px">
      <div class="pqwd-panel">
        <h2>Live sessions · last 7 days</h2>
        <div class="pqwd-bars" role="img" aria-label="Sessions per day over the last seven days: <?php echo s(implode(', ', array_map(static function(array $d): string { return $d['label'] . ' ' . $d['count']; }, $pqwdweek))); ?>">
          <?php foreach ($pqwdweek as $pqwdday): ?>
            <div><i style="height:<?php echo max(6, (int)round(100 * $pqwdday['count'] / $pqwdweekmax)); ?>%"<?php echo $pqwdday['count'] > 0 ? ' class="f"' : ''; ?>></i><b><?php echo s($pqwdday['label']); ?></b><em><?php echo (int)$pqwdday['count']; ?></em></div>
          <?php endforeach; ?>
        </div>
      </div>
      <div class="pqwd-panel">
        <h2>Needs attention</h2>
        <div class="pqwd-todo">
          <?php if ((int)$metrics['pending_enrollments'] > 0): ?>
            <div class="pqwd-todo__item"><span class="pqwd-todo__ico pqwd-todo__ico--warn">!</span><span class="pqwd-todo__body"><strong><?php echo (int)$metrics['pending_enrollments']; ?> enrollment request<?php echo (int)$metrics['pending_enrollments'] === 1 ? '' : 's'; ?> pending</strong><span>Families are waiting on approval.</span></span><a class="pqwd-btn pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>">Review</a></div>
          <?php endif; ?>
          <?php if ($pqwdinactive > 0): ?>
            <div class="pqwd-todo__item"><span class="pqwd-todo__ico pqwd-todo__ico--risk">●</span><span class="pqwd-todo__body"><strong><?php echo (int)$pqwdinactive; ?> student<?php echo $pqwdinactive === 1 ? '' : 's'; ?> inactive 14+ days</strong><span>No platform access recorded recently.</span></span><a class="pqwd-btn pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/at_risk_report.php', $workspaceparams))->out(false); ?>">See who</a></div>
          <?php endif; ?>
          <?php if ((int)$metrics['sessions'] === 0): ?>
            <div class="pqwd-todo__item"><span class="pqwd-todo__ico pqwd-todo__ico--warn">▶</span><span class="pqwd-todo__body"><strong>No upcoming live sessions</strong><span>Nothing is on the schedule yet.</span></span><a class="pqwd-btn pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $workspaceparams))->out(false); ?>">Create</a></div>
          <?php endif; ?>
          <?php if ((int)$metrics['offerings'] === 0): ?>
            <div class="pqwd-todo__item"><span class="pqwd-todo__ico pqwd-todo__ico--warn">◆</span><span class="pqwd-todo__body"><strong>No published course offerings</strong><span>Students cannot request enrollment yet.</span></span><a class="pqwd-btn pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>">Publish</a></div>
          <?php endif; ?>
          <?php if ((int)$metrics['pending_enrollments'] === 0 && $pqwdinactive === 0 && (int)$metrics['sessions'] > 0 && (int)$metrics['offerings'] > 0): ?>
            <div class="pqwd-todo__item"><span class="pqwd-todo__ico pqwd-todo__ico--ok">✓</span><span class="pqwd-todo__body"><strong>All clear</strong><span>No pending approvals, inactive students, or scheduling gaps.</span></span></div>
          <?php endif; ?>
        </div>
      </div>
    </section>

    <?php if ($canmanage || $canteach): ?>
    <section class="pqwd-panel" style="margin-bottom:14px">
      <h2>Daily Tools</h2>
      <p class="pqwd-muted" style="margin:0 0 12px">Course offerings, admissions, gradebook, reports, finance, compliance, and every other day-to-day operating tool now live in the Admin Workspace.</p>
      <a class="pqwd-btn" href="<?php echo (new moodle_url('/local/hubredirect/admin_workspace.php', $workspaceparams))->out(false); ?>">Open Admin Workspace</a>
    </section>

    <section class="pqwd-panel" style="margin-bottom:14px">
        <div class="pqwd-panel-head">
          <h2>Upcoming Sessions</h2>
          <?php $sessionsurl = $canmanage
              ? new moodle_url('/local/hubredirect/workspace_sessions.php', $workspaceparams)
              : new moodle_url('/local/hubredirect/live_sessions.php', $workspaceparams); ?>
          <a class="pqwd-btn pqwd-btn--light pqwd-btn--compact" href="<?php echo $sessionsurl->out(false); ?>"><?php echo $canmanage ? 'Create session' : 'Open sessions'; ?></a>
        </div>
        <?php if (!$sessions): ?>
          <div class="pqwd-empty">No upcoming sessions are scoped to this workspace yet.</div>
        <?php else: ?>
          <table class="pqwd-table">
            <thead><tr><th>Session</th><th>Teacher</th><th>Time</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($sessions as $session): ?>
                <tr>
                  <td data-label="Session"><span class="pqwd-name"><?php echo s($session->title); ?></span><span class="pqwd-muted"><?php echo s($session->status . ' / ' . $session->session_type); ?></span></td>
                  <td data-label="Teacher"><?php echo s(pqwd_user_name((int)$session->teacherid)); ?></td>
                  <td data-label="Time"><?php echo s(userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort'))); ?></td>
                  <td data-label="Actions">
                    <div class="pqwd-row-actions">
                      <a class="pqwd-btn pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', ['workspaceid' => $workspaceid, 'action' => 'join', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()]))->out(false); ?>"><?php echo s(pqwd_session_action_label($session, $canmanage)); ?></a>
                      <?php if ($canteach): ?><a class="pqwd-btn pqwd-btn--light pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', ['workspaceid' => $workspaceid, 'sessionid' => (int)$session->id]))->out(false); ?>">Review</a><?php endif; ?>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
    </section>

    <section class="pqwd-panel">
      <h2>Workspace People</h2>
      <?php if (!$people): ?>
        <div class="pqwd-empty">No students or members are linked to this workspace yet.</div>
      <?php else: ?>
        <?php
          $pqwdroleoptions = [];
          $pqwdstatusoptions = [];
          foreach ($people as $personopt) {
              $roleopt = (string)$personopt['role'];
              $pqwdroleoptions[$roleopt] = pqh_workspace_roles()[$roleopt] ?? ucwords(str_replace('_', ' ', $roleopt));
              $pqwdstatusoptions[(string)$personopt['status']] = ucwords(str_replace('_', ' ', (string)$personopt['status']));
          }
          asort($pqwdroleoptions);
          ksort($pqwdstatusoptions);
        ?>
        <div class="pqwd-toolbar pqwd-toolbar--filters">
          <div class="pqwd-field">
            <label for="pqwd-member-filter">Search people</label>
            <input class="pqwd-input" id="pqwd-member-filter" type="search" placeholder="Name, email, role, status, teacher, course, or user ID">
          </div>
          <div class="pqwd-field">
            <label for="pqwd-member-role-filter">Role</label>
            <select class="pqwd-select" id="pqwd-member-role-filter">
              <option value="">All roles</option>
              <?php foreach ($pqwdroleoptions as $rolevalue => $rolelabel): ?>
                <option value="<?php echo s(strtolower((string)$rolevalue)); ?>"><?php echo s($rolelabel); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="pqwd-field">
            <label for="pqwd-member-status-filter">Status</label>
            <select class="pqwd-select" id="pqwd-member-status-filter">
              <option value="">All statuses</option>
              <?php foreach ($pqwdstatusoptions as $statusvalue => $statuslabel): ?>
                <option value="<?php echo s(strtolower((string)$statusvalue)); ?>"><?php echo s($statuslabel); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <span class="pqwd-muted"><?php echo count($people); ?> <?php echo count($people) === 1 ? 'person' : 'people'; ?></span>
        </div>
        <table class="pqwd-table" id="pqwd-member-table">
          <thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Level</th><th>Updated</th><th>Links</th></tr></thead>
          <tbody>
            <?php foreach ($people as $person): ?>
              <?php
                $personid = (int)$person['userid'];
                $personrole = (string)$person['role'];
                $personrolelabel = pqh_workspace_roles()[$personrole] ?? ucwords(str_replace('_', ' ', $personrole));
                $personisactive = (string)$person['status'] === 'active';
                $personteachers = $person['isstudent'] ? ($studentteachers[$personid] ?? []) : [];
                $personcourses = $person['isstudent'] ? ($studentcourses[$personid] ?? []) : [];
                $persongrade = (string)$person['grade'];
                $personaccountno = (string)$person['accountno'] !== '' ? (string)$person['accountno'] : 'pending repair';
                // Compact identity line: name / account no. / grade. Everything
                // else (email, username, user id, teacher, courses, level) moves
                // into the details dialog behind the info button.
                $personsummary = (string)$person['name'] . ' / ' . $personaccountno
                    . ' / ' . ($persongrade !== '' ? $persongrade : '--');
                $personhaystack = strtolower(trim(
                    (string)$person['accountno'] . ' #' . $personid . ' ' . (string)$person['name'] . ' '
                    . (string)$person['email'] . ' ' . (string)$person['username'] . ' '
                    . $personrolelabel . ' ' . (string)$person['status'] . ' '
                    . implode(' ', $personteachers) . ' ' . implode(' ', $personcourses) . ' '
                    . (string)$person['level'] . ' ' . $persongrade
                ));
                // Only real values go into the dialog -- the JS drops any empty
                // row, so an admin with no student record gets a short list
                // rather than a wall of "--" placeholder rows.
                $persondetails = [
                    'title' => (string)$person['name'],
                    'rows' => [
                        ['Account No.', (string)$person['accountno']],
                        ['Grade', $persongrade],
                        ['Level', (string)$person['level']],
                        ['Role', $personrolelabel],
                        ['Status', (string)$person['status']],
                        ['User ID', '#' . $personid],
                        ['Username', (string)$person['username']],
                        ['Email', (string)$person['email']],
                        ['Teacher', $personteachers ? implode(', ', $personteachers) : ''],
                        ['Updated', (int)$person['timemodified'] > 0
                            ? userdate((int)$person['timemodified'], get_string('strftimedatetimeshort'))
                            : ''],
                    ],
                    // Enrolled courses get their own table block at the foot of
                    // the dialog rather than a comma-run inside a definition
                    // row -- a learner on six courses was unreadable that way.
                    'table' => $personcourses ? [
                        'caption' => 'Courses enrolled',
                        'columns' => ['#', 'Course'],
                        'rows' => array_map(static function(int $index, string $coursename): array {
                            return [(string)($index + 1), $coursename];
                        }, array_keys(array_values($personcourses)), array_values($personcourses)),
                    ] : null,
                    'actions' => $person['hasdetail'] ? [
                        ['Profile', (new moodle_url('/local/hubredirect/workspace_student.php', ['workspaceid' => $workspaceid, 'studentid' => $personid]))->out(false)],
                        ['Report', (new moodle_url('/local/hubredirect/managed_reports.php', ['studentid' => $personid]))->out(false)],
                    ] : [],
                ];
              ?>
              <tr data-filter="<?php echo s($personhaystack); ?>" data-role="<?php echo s(strtolower($personrole)); ?>" data-status="<?php echo s(strtolower((string)$person['status'])); ?>">
                <td data-label="Person">
                  <div class="pqwd-person">
                    <span class="pqwd-name"><?php echo s($personsummary); ?></span>
                    <button type="button" class="pqwd-infobtn" data-detail="<?php echo s(json_encode($persondetails, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)); ?>" aria-label="More information about <?php echo s((string)$person['name']); ?>" title="More information">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg>
                    </button>
                  </div>
                </td>
                <td data-label="Role"><span class="pqwd-pill"><?php echo s($personrolelabel); ?></span></td>
                <td data-label="Status"><span class="pqwd-pill<?php echo $personisactive ? '' : ' pqwd-pill--inactive'; ?>"><?php echo s((string)$person['status']); ?></span></td>
                <td data-label="Level"><?php echo (string)$person['level'] !== '' ? s((string)$person['level']) : '<span class="pqwd-muted">—</span>'; ?></td>
                <td data-label="Updated"><?php echo (int)$person['timemodified'] > 0 ? s(userdate((int)$person['timemodified'], get_string('strftimedatetimeshort'))) : '<span class="pqwd-muted">—</span>'; ?></td>
                <td data-label="Links">
                  <?php if ($person['hasdetail']): ?>
                    <div class="pqwd-row-actions">
                      <a class="pqwd-btn pqwd-btn--light pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/workspace_student.php', ['workspaceid' => $workspaceid, 'studentid' => $personid]))->out(false); ?>">Profile</a>
                      <a class="pqwd-btn pqwd-btn--light pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/managed_reports.php', ['studentid' => $personid]))->out(false); ?>">Report</a>
                    </div>
                  <?php else: ?>
                    <span class="pqwd-muted">—</span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>

    <section class="pqwd-panel" style="margin-top:14px">
      <h2>Workspace Courses</h2>
      <?php if (!$courses): ?>
        <div class="pqwd-empty">No course offerings have been created for this workspace yet.</div>
      <?php else: ?>
        <?php
          $pqwdcoursestatusoptions = [];
          $pqwdcoursevisibilityoptions = [];
          foreach ($courses as $courseopt) {
              $statusopt = (string)$courseopt['status'];
              $visibilityopt = (string)$courseopt['visibility'];
              $pqwdcoursestatusoptions[$statusopt] = pqco_status_options()[$statusopt] ?? ucwords(str_replace('_', ' ', $statusopt));
              $pqwdcoursevisibilityoptions[$visibilityopt] = pqco_visibility_options()[$visibilityopt] ?? ucwords(str_replace('_', ' ', $visibilityopt));
          }
          asort($pqwdcoursestatusoptions);
          asort($pqwdcoursevisibilityoptions);
        ?>
        <div class="pqwd-toolbar pqwd-toolbar--filters">
          <div class="pqwd-field">
            <label for="pqwd-course-filter">Search courses</label>
            <input class="pqwd-input" id="pqwd-course-filter" type="search" placeholder="Title, course key, status, visibility, or Moodle course">
          </div>
          <div class="pqwd-field">
            <label for="pqwd-course-status-filter">Status</label>
            <select class="pqwd-select" id="pqwd-course-status-filter">
              <option value="">All statuses</option>
              <?php foreach ($pqwdcoursestatusoptions as $statusvalue => $statuslabel): ?>
                <option value="<?php echo s(strtolower((string)$statusvalue)); ?>"><?php echo s($statuslabel); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="pqwd-field">
            <label for="pqwd-course-visibility-filter">Visibility</label>
            <select class="pqwd-select" id="pqwd-course-visibility-filter">
              <option value="">All visibility</option>
              <?php foreach ($pqwdcoursevisibilityoptions as $visibilityvalue => $visibilitylabel): ?>
                <option value="<?php echo s(strtolower((string)$visibilityvalue)); ?>"><?php echo s($visibilitylabel); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <span class="pqwd-muted"><?php echo count($courses); ?> course<?php echo count($courses) === 1 ? '' : 's'; ?></span>
        </div>
        <table class="pqwd-table" id="pqwd-course-table">
          <thead><tr><th>Course</th><th>Status</th><th>Visibility</th><th>Seats</th><th>Enrolled</th><th>Starts</th><th>Links</th></tr></thead>
          <tbody>
            <?php foreach ($courses as $course): ?>
              <?php
                $coursestatus = (string)$course['status'];
                $coursevisibility = (string)$course['visibility'];
                $coursestatuslabel = pqco_status_options()[$coursestatus] ?? ucwords(str_replace('_', ' ', $coursestatus));
                $coursevisibilitylabel = pqco_visibility_options()[$coursevisibility] ?? ucwords(str_replace('_', ' ', $coursevisibility));
                $coursetitle = $course['title'] !== '' ? $course['title'] : ($course['coursekey'] !== '' ? $course['coursekey'] : 'Untitled offering');
                $coursestart = (int)$course['startdate'] > 0 ? userdate((int)$course['startdate'], get_string('strftimedate')) : '';
                $courseend = (int)$course['enddate'] > 0 ? userdate((int)$course['enddate'], get_string('strftimedate')) : '';
                $courseseats = $course['unlimited'] ? 'Unlimited' : ((int)$course['openseats'] . ' of ' . (int)$course['capacity'] . ' open');
                // Same compact identity line as Workspace People: title / key /
                // start date, with the rest behind the info button.
                $coursesummary = $coursetitle . ' / ' . ($course['coursekey'] !== '' ? $course['coursekey'] : '--')
                    . ' / ' . ($coursestart !== '' ? $coursestart : '--');
                $coursehaystack = strtolower(trim(
                    $coursetitle . ' ' . $course['coursekey'] . ' ' . $coursestatuslabel . ' '
                    . $coursevisibilitylabel . ' ' . (string)$course['moodlecoursename'] . ' '
                    . $coursestart . ' ' . $courseend . ' #' . (int)$course['id']
                ));
                $coursedetails = [
                    'title' => $coursetitle,
                    'rows' => [
                        ['Course key', $course['coursekey']],
                        ['Status', $coursestatuslabel],
                        ['Visibility', $coursevisibilitylabel],
                        ['Capacity', $course['unlimited'] ? 'Unlimited' : (string)(int)$course['capacity']],
                        ['Open seats', $course['unlimited'] ? 'Unlimited' : (string)(int)$course['openseats']],
                        ['Enrolled', (string)(int)$course['enrolled']],
                        ['Starts', $coursestart],
                        ['Ends', $courseend],
                        ['Moodle course', (string)$course['moodlecoursename']],
                        ['Offering ID', '#' . (int)$course['id']],
                    ],
                    'actions' => array_values(array_filter([
                        ['Manage offering', (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false)],
                        (int)$course['moodlecourseid'] > 0
                            ? ['Open Moodle course', (new moodle_url('/course/view.php', ['id' => (int)$course['moodlecourseid']]))->out(false)]
                            : null,
                    ])),
                ];
              ?>
              <tr data-filter="<?php echo s($coursehaystack); ?>" data-status="<?php echo s(strtolower($coursestatus)); ?>" data-visibility="<?php echo s(strtolower($coursevisibility)); ?>">
                <td data-label="Course">
                  <div class="pqwd-person">
                    <span class="pqwd-name"><?php echo s($coursesummary); ?></span>
                    <button type="button" class="pqwd-infobtn" data-detail="<?php echo s(json_encode($coursedetails, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)); ?>" aria-label="More information about <?php echo s($coursetitle); ?>" title="More information">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg>
                    </button>
                  </div>
                </td>
                <td data-label="Status"><span class="pqwd-pill<?php echo $coursestatus === 'published' ? '' : ' pqwd-pill--inactive'; ?>"><?php echo s($coursestatuslabel); ?></span></td>
                <td data-label="Visibility"><span class="pqwd-pill"><?php echo s($coursevisibilitylabel); ?></span></td>
                <td data-label="Seats"><?php echo s($courseseats); ?></td>
                <td data-label="Enrolled"><?php echo (int)$course['enrolled']; ?></td>
                <td data-label="Starts"><?php echo $coursestart !== '' ? s($coursestart) : '<span class="pqwd-muted">—</span>'; ?></td>
                <td data-label="Links">
                  <div class="pqwd-row-actions">
                    <a class="pqwd-btn pqwd-btn--light pqwd-btn--compact" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>">Manage</a>
                    <?php if ((int)$course['moodlecourseid'] > 0): ?>
                      <a class="pqwd-btn pqwd-btn--light pqwd-btn--compact" href="<?php echo (new moodle_url('/course/view.php', ['id' => (int)$course['moodlecourseid']]))->out(false); ?>">Course</a>
                    <?php endif; ?>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </section>
    <?php else: ?>
      <section class="pqwd-panel">
        <h2><?php echo s($role === 'parent' ? 'Parent Workspace' : 'Student Workspace'); ?></h2>
        <div class="pqwd-empty"><?php echo s($role === 'parent'
            ? 'Use the parent view and live safety links above to review only students linked to your parent account.'
            : 'Use the student profile and live session links above to review your own classes, materials, attendance, and notes.'); ?></div>
      </section>
    <?php endif; ?>
  </div>
  <?php
  // Must live inside .pqwd-shell: every --pqh-* design token is declared on
  // that element, and custom properties only inherit to descendants. Sitting
  // outside it, the dialog's background/border/text colours all resolved to
  // nothing and it rendered fully transparent over the table.
  ?>
  <div class="pqwd-modal" id="pqwd-detail-modal" role="dialog" aria-modal="true" aria-labelledby="pqwd-detail-modal-title" hidden>
    <div class="pqwd-modal__box">
      <div class="pqwd-modal__head">
        <h3 id="pqwd-detail-modal-title">Details</h3>
        <button type="button" class="pqwd-modal__close" data-pqwd-modal-close aria-label="Close">&times;</button>
      </div>
      <dl class="pqwd-modal__grid" id="pqwd-detail-modal-body"></dl>
      <div class="pqwd-modal__block" id="pqwd-detail-modal-table"></div>
      <div class="pqwd-modal__actions" id="pqwd-detail-modal-actions"></div>
    </div>
  </div>
</main>
<script>
(function() {
  var filter = document.getElementById('pqwd-member-filter');
  var roleSelect = document.getElementById('pqwd-member-role-filter');
  var statusSelect = document.getElementById('pqwd-member-status-filter');
  var table = document.getElementById('pqwd-member-table');
  if (!filter || !table) {
    return;
  }
  function apply() {
    var needle = filter.value.toLowerCase().trim();
    var role = roleSelect ? roleSelect.value : '';
    var status = statusSelect ? statusSelect.value : '';
    table.querySelectorAll('tbody tr').forEach(function(row) {
      var haystack = row.getAttribute('data-filter') || '';
      var matchesText = needle === '' || haystack.indexOf(needle) !== -1;
      var matchesRole = role === '' || row.getAttribute('data-role') === role;
      var matchesStatus = status === '' || row.getAttribute('data-status') === status;
      row.classList.toggle('pqwd-row-hidden', !(matchesText && matchesRole && matchesStatus));
    });
  }
  filter.addEventListener('input', apply);
  if (roleSelect) {
    roleSelect.addEventListener('change', apply);
  }
  if (statusSelect) {
    statusSelect.addEventListener('change', apply);
  }
}());
(function() {
  var filter = document.getElementById('pqwd-course-filter');
  var statusSelect = document.getElementById('pqwd-course-status-filter');
  var visibilitySelect = document.getElementById('pqwd-course-visibility-filter');
  var table = document.getElementById('pqwd-course-table');
  if (!filter || !table) {
    return;
  }
  function apply() {
    var needle = filter.value.toLowerCase().trim();
    var status = statusSelect ? statusSelect.value : '';
    var visibility = visibilitySelect ? visibilitySelect.value : '';
    table.querySelectorAll('tbody tr').forEach(function(row) {
      var haystack = row.getAttribute('data-filter') || '';
      var matchesText = needle === '' || haystack.indexOf(needle) !== -1;
      var matchesStatus = status === '' || row.getAttribute('data-status') === status;
      var matchesVisibility = visibility === '' || row.getAttribute('data-visibility') === visibility;
      row.classList.toggle('pqwd-row-hidden', !(matchesText && matchesStatus && matchesVisibility));
    });
  }
  filter.addEventListener('input', apply);
  if (statusSelect) {
    statusSelect.addEventListener('change', apply);
  }
  if (visibilitySelect) {
    visibilitySelect.addEventListener('change', apply);
  }
}());
(function() {
  var modal = document.getElementById('pqwd-detail-modal');
  var body = document.getElementById('pqwd-detail-modal-body');
  var block = document.getElementById('pqwd-detail-modal-table');
  var actions = document.getElementById('pqwd-detail-modal-actions');
  var title = document.getElementById('pqwd-detail-modal-title');
  if (!modal || !body || !block || !actions || !title) {
    return;
  }
  var lastTrigger = null;
  function close() {
    modal.hidden = true;
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }
  // Payload shape is deliberately generic -- {title, rows:[[label,value]],
  // actions:[[label,url]]} -- so Workspace People and Workspace Courses share
  // one dialog instead of each shipping its own field list.
  function open(trigger) {
    var data;
    try {
      data = JSON.parse(trigger.getAttribute('data-detail') || '{}');
    } catch (e) {
      return;
    }
    lastTrigger = trigger;
    title.textContent = data.title || 'Details';
    body.textContent = '';
    (data.rows || []).forEach(function(row) {
      if (!row || row.length < 2 || !row[1]) {
        return;
      }
      var dt = document.createElement('dt');
      dt.textContent = row[0];
      var dd = document.createElement('dd');
      dd.textContent = row[1];
      body.appendChild(dt);
      body.appendChild(dd);
    });
    block.textContent = '';
    block.hidden = true;
    if (data.table && data.table.rows && data.table.rows.length) {
      var heading = document.createElement('h4');
      heading.textContent = data.table.caption || '';
      block.appendChild(heading);
      var tbl = document.createElement('table');
      if (data.table.columns && data.table.columns.length) {
        var thead = document.createElement('thead');
        var headrow = document.createElement('tr');
        data.table.columns.forEach(function(label) {
          var th = document.createElement('th');
          th.textContent = label;
          headrow.appendChild(th);
        });
        thead.appendChild(headrow);
        tbl.appendChild(thead);
      }
      var tbody = document.createElement('tbody');
      data.table.rows.forEach(function(cells) {
        var tr = document.createElement('tr');
        (cells || []).forEach(function(cell) {
          var td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      block.appendChild(tbl);
      block.hidden = false;
    }
    actions.textContent = '';
    (data.actions || []).forEach(function(action) {
      if (!action || action.length < 2 || !action[1]) {
        return;
      }
      var link = document.createElement('a');
      link.className = 'pqwd-btn pqwd-btn--light pqwd-btn--compact';
      link.href = action[1];
      link.textContent = action[0];
      actions.appendChild(link);
    });
    modal.hidden = false;
    var closer = modal.querySelector('[data-pqwd-modal-close]');
    if (closer) {
      closer.focus();
    }
  }
  document.addEventListener('click', function(event) {
    var trigger = event.target.closest ? event.target.closest('.pqwd-infobtn') : null;
    if (trigger) {
      event.preventDefault();
      open(trigger);
      return;
    }
    if (event.target === modal || (event.target.closest && event.target.closest('[data-pqwd-modal-close]'))) {
      close();
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !modal.hidden) {
      close();
    }
  });
}());
</script>
<?php
if ($canteach) {
    echo pqh_embedded_support_html($workspaceid, (int)$USER->id, (int)$USER->id, 'student_helpdesk', $consumercontext);
}
echo $OUTPUT->footer();
