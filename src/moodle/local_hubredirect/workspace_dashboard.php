<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

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

if ((int)($consumercontext->workspaceid ?? 0) !== $workspaceid && pqh_consumer_schema_ready()) {
    $workspaceconsumer = pqh_consumer_context_by_workspace($workspaceid);
    if ($workspaceconsumer) {
        $consumercontext = $workspaceconsumer;
    }
}
$brandname = trim((string)($consumercontext->consumername ?? '')) !== '' ? (string)$consumercontext->consumername : (string)$workspace->name;
$brandlogo = trim((string)($consumercontext->logourl ?? ''));
$brandtheme = pqh_consumer_theme($consumercontext);
$brandcopy = json_decode((string)($consumercontext->copyjson ?? ''), true);
$brandcopy = is_array($brandcopy) ? $brandcopy : [];
$brandcolor = (string)$brandtheme['primary_color'];
$brandinitialsource = preg_replace('/[^a-z0-9]/i', '', $brandname);
$copyinitial = trim((string)($brandcopy['brand_initials'] ?? ''));
$brandinitial = $copyinitial !== '' ? strtoupper(substr($copyinitial, 0, 6)) : strtoupper(substr((string)$brandinitialsource, 0, 1));
if ($brandinitial === '') {
    $brandinitial = 'W';
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
$PAGE->set_title('Workspace Dashboard');
$PAGE->set_heading('Workspace Dashboard');
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
        $rows = $DB->get_records('local_prequran_student_profile', ['workspaceid' => $workspaceid], 'timemodified DESC', 'id,userid,student_display_name,current_level,status');
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

function pqwd_recent_members(int $workspaceid): array {
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
$studentcourses = pqwd_student_course_labels(array_column(array_slice($students, 0, 20), 'studentid'));
$members = pqwd_recent_members($workspaceid);
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
    $studentcourses = pqwd_student_course_labels(array_column(array_slice($students, 0, 20), 'studentid'));
}
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
        && in_array($role, ['teacher', 'assistant_teacher', 'student'], true)) {
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
$landingurl = pqwd_domain_url($primarydomain, '/local/hubredirect/consumer_landing.php', $workspaceparams);
$loginurl = pqwd_domain_url($primarydomain, '/local/hubredirect/consumer_login.php', $workspaceparams);
$studentintakeurl = pqwd_domain_url($primarydomain, '/local/hubredirect/public_intake.php', $workspaceparams);
$teacheronboardingurl = pqwd_domain_url($primarydomain, '/local/hubredirect/teacher_intake.php', $workspaceparams);
$workspaceurl = pqwd_domain_url($primarydomain, '/local/hubredirect/workspace_dashboard.php', $workspaceparams);
$coursecatalogurl = pqwd_domain_url($primarydomain, '/local/hubredirect/course_catalog_browse.php', $workspaceparams);
$profileurl = pqwd_domain_url($primarydomain, '/local/hubredirect/institution_profile.php', $workspaceparams);
$inquiryurl = pqwd_domain_url($primarydomain, '/local/hubredirect/institution_inquiry.php', $workspaceparams);
$diagnosticsurl = new moodle_url('/local/hubredirect/consumer_diagnostics.php', $consumerparams);
$brandediturl = new moodle_url('/local/hubredirect/institution_settings.php', $workspaceparams);
$sampledataurl = new moodle_url('/local/hubredirect/institution_sample_data.php', $workspaceparams);
$testmatrixurl = new moodle_url('/local/hubredirect/institution_test_matrix.php', $workspaceparams);
$platformconsumersurl = new moodle_url('/local/hubredirect/platform_consumers.php');
$workspacesadminurl = new moodle_url('/local/hubredirect/workspaces.php', ['editworkspaceid' => $workspaceid]);
$onboardingurl = new moodle_url('/local/hubredirect/institution_onboarding.php');
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

echo $OUTPUT->header();
?>
<style>
body.pqw-dashboard-page header,body.pqw-dashboard-page footer,body.pqw-dashboard-page nav.navbar,body.pqw-dashboard-page #page-header,body.pqw-dashboard-page #page-footer,body.pqw-dashboard-page .drawer,body.pqw-dashboard-page .drawer-toggles,body.pqw-dashboard-page .block-region,body.pqw-dashboard-page [data-region="drawer"],body.pqw-dashboard-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-dashboard-page #page,body.pqw-dashboard-page #page-content,body.pqw-dashboard-page #region-main,body.pqw-dashboard-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwd-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwd-wrap{max-width:1280px;margin:0 auto}.pqwd-top,.pqwd-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwd-top{display:grid;grid-template-columns:minmax(300px,1fr) minmax(520px,auto);gap:14px;align-items:center;margin-bottom:14px}.pqwd-top>div{min-width:0}.pqwd-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1;overflow-wrap:anywhere}.pqwd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800;line-height:1.45}.pqwd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;min-width:0}.pqwd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;line-height:1.15;text-align:center;cursor:pointer;white-space:normal}.pqwd-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwd-btn--compact{min-height:32px;padding:0 10px;font-size:12px}.pqwd-select{min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:850;padding:0 10px;max-width:100%}.pqwd-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-bottom:14px}.pqwd-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqwd-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqwd-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqwd-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.pqwd-panel h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950;line-height:1.15}.pqwd-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.pqwd-panel-head h2{margin:0}.pqwd-table{width:100%;border-collapse:separate;border-spacing:0}.pqwd-table th,.pqwd-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwd-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwd-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwd-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800;line-height:1.4}.pqwd-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;line-height:1.2}.pqwd-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwd-cardlinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwd-link{display:block;min-height:86px;padding:14px;border-radius:8px;background:#f7fbf8;border:1px solid rgba(47,111,78,.16);color:#173044!important;text-decoration:none}.pqwd-link strong{display:block;color:#221b22;font-size:15px;font-weight:950}.pqwd-link span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:850;line-height:1.35}.pqwd-row-actions{display:flex;gap:6px;flex-wrap:wrap}.pqwd-public{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(460px,1.15fr);gap:18px;align-items:start;margin-bottom:14px;background:linear-gradient(90deg,#f7fbf8,#fff9ed)}.pqwd-public>div{min-width:0}.pqwd-public-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;justify-content:stretch;align-items:start}.pqwd-public-links .pqwd-btn{width:100%;min-height:42px}.pqwd-code{display:inline-block;margin-top:6px;padding:4px 7px;border-radius:6px;background:#eef4f6;color:#173044;font-size:12px;font-weight:900;overflow-wrap:anywhere}.pqwd-domain-list{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
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
  --pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#ffffff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;
  --pqh-primary-ink:#17498f;--pqh-r:14px;
  --pqh-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);
  background:var(--pqh-bg);color:var(--pqh-ink);padding:0 0 56px 76px}
.pqwd-wrap{padding:24px 24px 0}
.pqwd-topbar{position:sticky;top:0;z-index:70;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 24px;background:linear-gradient(115deg,#2166d1,#4d8be0);border-bottom:1px solid rgba(255,255,255,.22);box-shadow:0 6px 18px -12px rgba(23,73,143,.5)}
.pqwd-topbar__brand{display:flex;align-items:center;gap:10px;color:#fff;font-size:17px;font-weight:800}
.pqwd-topbar__brand .pqh-brand-mark{width:38px;height:38px;background:#fff!important;color:#2166d1!important;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;font-weight:800;overflow:hidden}
.pqwd-topbar__brand .pqh-brand-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqwd-topbar__nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.pqwd-topbar__nav a,.pqwd-topbar__nav button{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0!important;border-radius:9px;background:transparent!important;color:rgba(255,255,255,.92)!important;font-size:13px;font-weight:650!important;text-decoration:none!important;cursor:pointer;box-shadow:none!important}
.pqwd-topbar__nav a:hover,.pqwd-topbar__nav button:hover{background:rgba(255,255,255,.18)!important;color:#fff!important}
.pqwd-topbar__nav .pqwd-topbar__logout{background:#fff!important;color:#17498f!important;font-weight:700!important}
.pqwd-topbar__nav .pqwd-topbar__logout:hover{background:#e9f1fc!important;color:#0f2237!important}
.pqh-gnav{position:fixed;left:0;top:0;bottom:0;width:76px;z-index:80;display:flex;flex-direction:column;gap:4px;padding:12px 8px;background:var(--pqh-surface);border-right:1px solid var(--pqh-line);overflow-y:auto}
.pqh-gnav__brand{display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin:0 auto 12px;border-radius:13px;background:linear-gradient(115deg,#2166d1,#4d8be0);color:#fff!important;font:800 15px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-decoration:none!important;box-shadow:0 6px 14px -6px rgba(33,102,209,.5)}
.pqh-gnav__item{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 2px;border:0;border-radius:11px;background:transparent;color:var(--pqh-muted)!important;font:600 10px/1.15 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;text-align:center;text-decoration:none!important;cursor:pointer}
.pqh-gnav__item svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pqh-gnav__item:hover{background:var(--pqh-tint);color:var(--pqh-primary-ink)!important;text-decoration:none!important}
.pqh-gnav__item.is-active{background:var(--pqh-tint);color:var(--pqh-primary)!important;font-weight:700}
.pqh-gnav__spacer{flex:1}
.pqwd-top.pqh-workspace-top{background:linear-gradient(120deg,#d7e6f9 0%,#e9f1fc 60%,#f3f8fe 100%)!important;border:1px solid #c5d9f1!important;box-shadow:none!important;border-radius:var(--pqh-r)!important;padding:20px 22px!important}
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
@media(max-width:900px){.pqwd-shell{padding-left:0}.pqh-gnav{display:none}.pqwd-topbar{flex-wrap:wrap}}
</style>
<main class="pqwd-shell">
<nav class="pqh-gnav" aria-label="Global navigation">
  <a class="pqh-gnav__brand" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>" title="Home"><?php echo s($brandinitial); ?></a>
  <a class="pqh-gnav__item" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    Dashboard
  </a>
  <a class="pqh-gnav__item is-active" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $workspaceparams))->out(false); ?>">
    <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
    Workspace
  </a>
  <a class="pqh-gnav__item" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $workspaceparams))->out(false); ?>">
    <svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></svg>
    Live
  </a>
  <span class="pqh-gnav__spacer"></span>
  <a class="pqh-gnav__item" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">
    <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>
    Logout
  </a>
</nav>
<div class="pqwd-topbar">
  <div class="pqwd-topbar__brand">
    <span class="pqh-brand-mark">
      <?php if ($brandlogo !== ''): ?>
        <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brandname); ?>">
      <?php else: ?>
        <?php echo s($brandinitial); ?>
      <?php endif; ?>
    </span>
    <span><?php echo s($workspace->name); ?></span>
  </div>
  <div class="pqwd-topbar__nav">
    <button type="button" onclick="window.history.back()">Back</button>
    <a href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Home</a>
    <?php if ($canmanage): ?><a href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $workspaceparams))->out(false); ?>">Manage people</a><?php endif; ?>
    <?php if ($canmanage): ?><a href="<?php echo $brandediturl->out(false); ?>">Settings</a><?php endif; ?>
    <?php if ($canacademyops): ?><a href="<?php echo $workspacesadminurl->out(false); ?>">Manage workspaces</a><?php endif; ?>
    <?php if ($canacademyops): ?><a href="<?php echo $platformconsumersurl->out(false); ?>">Platform consumers</a><?php endif; ?>
    <?php if ($canteach): ?><button type="button" data-pq-support-action="open">Manage tickets</button><?php endif; ?>
    <?php if ($canteach): ?><button type="button" data-pq-support-action="new">Create a ticket</button><?php endif; ?>
    <a class="pqwd-topbar__logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
  </div>
</div>
  <div class="pqwd-wrap">
    <section class="pqwd-top pqh-workspace-top">
      <div>
        <h1 class="pqwd-title pqh-workspace-title">
          <span class="pqh-brand-mark" style="background: <?php echo s($brandcolor); ?>;">
            <?php if ($brandlogo !== ''): ?>
              <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brandname); ?>">
            <?php else: ?>
              <?php echo s($brandinitial); ?>
            <?php endif; ?>
          </span>
          <span><?php echo s($workspace->name); ?></span>
        </h1>
        <p class="pqwd-sub pqh-workspace-sub"><?php echo s(pqh_workspace_types()[$workspace->workspace_type] ?? $workspace->workspace_type); ?> workspace - your role: <?php echo s($role === 'platform_admin' ? 'platform admin' : ($role)); ?></p>
      </div>
      <form class="pqwd-actions pqh-workspace-actions" method="get" aria-label="Workspace switcher">
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
        <span class="pqwd-muted">Use these to test the institution domain, landing page, login, and intake flows.</span>
        <span class="pqwd-code"><?php echo s($primarydomain !== '' ? $primarydomain : $CFG->wwwroot); ?></span>
        <div class="pqwd-domain-list">
          <?php foreach ($domains as $domainrow): ?>
            <span class="pqwd-pill"><?php echo s((string)$domainrow->domain); ?> / <?php echo s((string)$domainrow->domain_type); ?><?php echo (int)($domainrow->isprimary ?? 0) === 1 ? ' / primary' : ''; ?></span>
          <?php endforeach; ?>
          <?php if (!$domains): ?><span class="pqwd-pill">No custom domain rows found</span><?php endif; ?>
        </div>
      </div>
      <div class="pqwd-public-links">
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $landingurl->out(false); ?>">Landing</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $profileurl->out(false); ?>">Profile</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $inquiryurl->out(false); ?>">Inquiry</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $loginurl->out(false); ?>">Login</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $studentintakeurl->out(false); ?>">Student intake</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $coursecatalogurl->out(false); ?>">Course catalog</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $teacheronboardingurl->out(false); ?>">Teacher onboarding</a>
        <a class="pqwd-btn pqwd-btn--light" href="<?php echo $workspaceurl->out(false); ?>">Workspace URL</a>
        <?php if ($canacademyops): ?>
          <a class="pqwd-btn pqwd-btn--light" href="<?php echo $diagnosticsurl->out(false); ?>">Diagnostics</a>
          <a class="pqwd-btn pqwd-btn--light" href="<?php echo $testmatrixurl->out(false); ?>">Test matrix</a>
          <a class="pqwd-btn" href="<?php echo $brandediturl->out(false); ?>">Institution settings</a>
          <a class="pqwd-btn pqwd-btn--light" href="<?php echo $onboardingurl->out(false); ?>">Onboard institution</a>
        <?php endif; ?>
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
    </section>

    <section class="pqwd-cardlinks" aria-label="Workspace actions">
      <?php if ($canteach): ?>
        <?php if ($canmanageofferings): ?>
          <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketing.php', $workspaceparams))->out(false); ?>"><strong>Market My Services</strong><span>Manage your public profile, service offers, pricing, and online presence.</span></a>
          <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_student_connect.php', $workspaceparams))->out(false); ?>"><strong>Find or Invite Student</strong><span>Search for an existing learner first, or invite a new student into this independent teaching workspace.</span></a>
          <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>"><strong>Course Offerings</strong><span>Create courses or tutoring services, set dates, seats, syllabus, pricing, and review enrollment requests.</span></a>
        <?php endif; ?>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/live_teacher.php', $workspaceparams))->out(false); ?>"><strong>Teacher Workspace</strong><span>Today's classes, attendance, notes, and post-class review.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_portal.php', $workspaceparams))->out(false); ?>"><strong>Teacher Portal</strong><span>Today's classes, roster, attendance, grades, notes, homework, and progress updates.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $workspaceparams))->out(false); ?>"><strong>Workspace Reports</strong><span>Institution-level teacher load, session, attendance, material, and quiz summaries.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_materials.php', $workspaceparams))->out(false); ?>"><strong>Material Library</strong><span>Review resources, assignment progress, and completed student materials.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $workspaceparams))->out(false); ?>"><strong>Live Sessions</strong><span>Open upcoming classes, join/start rooms, review notes, recordings, homework, and reminders.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/communications_center.php', $workspaceparams))->out(false); ?>"><strong>Communications Center</strong><span>Message parents, students, and teachers, manage cases, and review student thread history.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/gradebook_assessment.php', $workspaceparams))->out(false); ?>"><strong>Gradebook</strong><span>Enter and review assessment grades, oral recitation marks, publishing, disputes, corrections, and audit history.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/learning_path.php', $workspaceparams))->out(false); ?>"><strong>Learning Path</strong><span>Track placement, mastery, skill maps, recommended next courses, comments, and interventions.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams))->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Review live transcript previews for assigned students.</span></a>
      <?php endif; ?>
      <?php if ($canmanage): ?>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $workspaceparams))->out(false); ?>"><strong>People & Assignments</strong><span>Add students, add teachers, and assign students to teachers inside this workspace.</span></a>
        <a class="pqwd-link" href="<?php echo $brandediturl->out(false); ?>"><strong>Institution Settings</strong><span>Edit logo, initials, colors, domains, support email, landing text, and default courses.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>"><strong>Course Offerings</strong><span>Create institution course seats, link Moodle courses, set dates, syllabus, prerequisites, and approve enrollment requests.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/admissions.php', $workspaceparams))->out(false); ?>"><strong>Admissions Pipeline</strong><span>Review applications, documents, placement assessments, decisions, waitlists, and student conversion.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/scholarship_portal.php', $workspaceparams))->out(false); ?>"><strong>Scholarship Applications</strong><span>Manage scholarship intake, family/student requests, review decisions, waitlists, awards, and finance conversion.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/sponsor_donor_portal.php', $workspaceparams))->out(false); ?>"><strong>Sponsor & Donor Portal</strong><span>Review donor pledges, sponsor commitments, invoice allocations, donor privacy, and sponsorship readiness.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/placement_tests.php', $workspaceparams))->out(false); ?>"><strong>Placement Tests</strong><span>Define placement tests, schedule assessments, score readiness, and apply level/course recommendations.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/academic_calendar.php', $workspaceparams))->out(false); ?>"><strong>Academic Calendar</strong><span>Manage terms, holidays, blackout dates, enrollment windows, course schedules, and deadlines.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/attendance_operations.php', $workspaceparams))->out(false); ?>"><strong>Attendance Operations</strong><span>Track late, excused, absent, make-up, reports, academic standing actions, and finance holds.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/gradebook_assessment.php', $workspaceparams))->out(false); ?>"><strong>Gradebook & Assessment</strong><span>Configure weighted categories, assessments, grade review, publishing, disputes, corrections, and transcript grades.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/learning_path.php', $workspaceparams))->out(false); ?>"><strong>Student Learning Paths</strong><span>Manage placement, advancement rules, mastery tracking, skill maps, next-course recommendations, and interventions.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_administration.php', $workspaceparams))->out(false); ?>"><strong>Teacher Administration</strong><span>Manage availability, load, contracts, rates, assignments, substitutes, and marketplace payout readiness.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $workspaceparams))->out(false); ?>"><strong>Live Operations</strong><span>Monitor scheduling, capacity, room readiness, recordings, parent visibility, reminders, and diagnostics.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/communications_center.php', $workspaceparams))->out(false); ?>"><strong>Communications Center</strong><span>Manage messaging, announcements, templates, consent, delivery logs, and student case histories.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/admin_workflow.php', $workspaceparams))->out(false); ?>"><strong>Admin Workflow</strong><span>Run admissions, finance, registrar, teacher, and support queues with approvals, escalations, notes, and audit history.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/document_management.php', $workspaceparams))->out(false); ?>"><strong>Document Management</strong><span>Upload, verify, expire, download, and audit student documents, IDs, certificates, consent forms, and generated PDFs.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/certificates_awards.php', $workspaceparams))->out(false); ?>"><strong>Certificates & Awards</strong><span>Create templates, issue completion awards, generate certificate PDFs, revoke awards, and audit changes.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/roles_permissions.php', $workspaceparams))->out(false); ?>"><strong>Roles & Tenant Controls</strong><span>Manage registrar, finance, teacher, parent, sponsor, and support capabilities, isolation audits, and support access.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/mobile_api_readiness.php', $workspaceparams))->out(false); ?>"><strong>Mobile & API Readiness</strong><span>Review REST endpoint health, service inventory, token readiness, mobile client profiles, and readiness snapshots.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/localization_currency.php', $workspaceparams))->out(false); ?>"><strong>Localization & Currency</strong><span>Manage tenant locale, regional display formats, enabled currencies, exchange rates, and tax-region policy.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/bulk_import_export.php', $workspaceparams))->out(false); ?>"><strong>Bulk Import/Export</strong><span>Validate member CSVs, commit bulk workspace imports, export operational datasets, and review processing history.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/data_migration_tools.php', $workspaceparams))->out(false); ?>"><strong>Data Migration Tools</strong><span>Run scoped inventory, record dry-run validations, mapping notes, rollback plans, and migration audit history.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/backup_dr_checks.php', $workspaceparams))->out(false); ?>"><strong>Backup & DR Checks</strong><span>Track backup evidence, restore-test dates, disaster recovery readiness findings, runbooks, and recurring checks.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/compliance_governance.php', $workspaceparams))->out(false); ?>"><strong>Compliance & Governance</strong><span>Manage retention, privacy workflows, consent history, export/delete/anonymize review, and full audit reports.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/executive_dashboard.php', $workspaceparams))->out(false); ?>"><strong>Executive Dashboard</strong><span>Review enrollment funnel, revenue, AR aging, retention, utilization, student progress, and course profitability.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $workspaceparams))->out(false); ?>"><strong>Finance Operations</strong><span>Review open invoices, overdue balances, payments, exceptions, holds, reconciliation reports, and CSV exports.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_seat_report.php', $workspaceparams))->out(false); ?>"><strong>Course Seat Report</strong><span>Review capacity, open seats, utilization, pending requests, and dropped enrollments.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_student_history.php', $workspaceparams))->out(false); ?>"><strong>Student Course History</strong><span>See each student's course request, approval, sync, and drop history.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams))->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Preview transcript headers, course lines, warnings, and admin diagnostics.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/transcript_readiness.php', $workspaceparams))->out(false); ?>"><strong>Transcript Readiness</strong><span>Find transcript blockers, warnings, repair links, and export data-quality CSVs.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_official.php', $workspaceparams))->out(false); ?>"><strong>Official Transcript Drafts</strong><span>Open the issue workflow after selecting a student from transcript previews.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/transcript_controls.php', $workspaceparams))->out(false); ?>"><strong>Transcript Controls</strong><span>Manage transcript holds, correction records, revocation, and reissue workflows.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_export.php', $workspaceparams + ['type' => 'documents', 'format' => 'csv']))->out(false); ?>"><strong>Issued Transcript CSV</strong><span>Export issued transcript document IDs, hashes, policy, and issue metadata.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/transcript_policy.php', $workspaceparams))->out(false); ?>"><strong>Transcript Policy</strong><span>Configure completion, grade, attendance, display, and official issue rules.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_sync_report.php', $workspaceparams))->out(false); ?>"><strong>Moodle Sync Report</strong><span>Find approved requests needing Moodle sync and linked-course setup issues.</span></a>
        <a class="pqwd-link" href="<?php echo $sampledataurl->out(false); ?>"><strong>Validation Data</strong><span>Create sample students, teachers, sessions, attendance, materials, and report data for end-to-end testing.</span></a>
        <a class="pqwd-link" href="<?php echo $testmatrixurl->out(false); ?>"><strong>Role Test Matrix</strong><span>Test guest, institution admin, teacher, parent, student, and platform admin flows on the custom domain.</span></a>
        <a class="pqwd-link" href="<?php echo $profileurl->out(false); ?>"><strong>Public Institution Profile</strong><span>Preview the public profile and inquiry path for this institution.</span></a>
        <?php if ($canacademyops): ?>
          <a class="pqwd-link" href="<?php echo $platformconsumersurl->out(false); ?>"><strong>Platform Consumers</strong><span>Manage institution consumers, domains, workspace status, support email, and debug links.</span></a>
          <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php', $workspaceparams))->out(false); ?>"><strong>Student Intake</strong><span>Create new Moodle student and parent accounts directly inside this workspace.</span></a>
          <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php', $workspaceparams))->out(false); ?>"><strong>Teacher Onboarding</strong><span>Create or link teacher accounts and add them to this workspace.</span></a>
        <?php else: ?>
          <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $workspaceparams))->out(false); ?>"><strong>Add Existing Users</strong><span>Add existing Moodle students, parents, and teachers to this workspace.</span></a>
        <?php endif; ?>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_sessions.php', $workspaceparams))->out(false); ?>"><strong>Live Sessions</strong><span>Create, start, join, and review live sessions for this workspace.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_series.php', $workspaceparams))->out(false); ?>"><strong>Recurring Series</strong><span>Edit, reschedule, and cancel recurring workspace classes.</span></a>
      <?php endif; ?>
      <?php if ($role === 'student'): ?>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams))->out(false); ?>"><strong>Course Catalog</strong><span>Browse available institution courses and request enrollment.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/scholarship_portal.php', $workspaceparams))->out(false); ?>"><strong>Scholarship Applications</strong><span>Submit and track scholarship requests for eligible courses, hardship aid, or donor-funded support.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams + ['studentid' => (int)$USER->id]))->out(false); ?>"><strong>Unofficial Transcript</strong><span>Review your live course record, grades, completion, attendance, and warnings.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/student_parent_portal.php', $workspaceparams + ['studentid' => (int)$USER->id]))->out(false); ?>"><strong>My Portal</strong><span>Review courses, invoices, payments, attendance, grades, transcripts, payment plans, and secure downloads.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_student.php', $workspaceparams + ['studentid' => (int)$USER->id]))->out(false); ?>"><strong>My Student Profile</strong><span>Review assigned teachers, materials, attendance, notes, and learning progress.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $workspaceparams))->out(false); ?>"><strong>My Live Sessions</strong><span>Open upcoming classes and live-session links for this workspace.</span></a>
      <?php endif; ?>
      <?php if ($role === 'parent'): ?>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams))->out(false); ?>"><strong>Course Catalog</strong><span>Review available seats, dates, syllabus, prerequisites, and request enrollment for linked students.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/scholarship_portal.php', $workspaceparams))->out(false); ?>"><strong>Scholarship Applications</strong><span>Submit and track scholarship requests for linked students, invoices, eligible courses, and donor-funded support.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/student_parent_portal.php', $workspaceparams))->out(false); ?>"><strong>Family Portal</strong><span>Review enrolled courses, invoices, payments, attendance, grades, transcripts, payment plans, and secure downloads.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams))->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Review live course records for linked children.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_parent.php', $workspaceparams))->out(false); ?>"><strong>Parent View</strong><span>Review linked students, attendance, notes, materials, and recordings.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/live_trust.php', $workspaceparams))->out(false); ?>"><strong>Live Class Safety</strong><span>Open parent-facing live-session visibility, consent, and recording controls.</span></a>
      <?php endif; ?>
      <?php if ($role === 'sponsor'): ?>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/sponsor_donor_portal.php', $workspaceparams))->out(false); ?>"><strong>Sponsor & Donor Portal</strong><span>Submit pledges, review sponsored learner invoices, donor privacy, commitments, and allocation status.</span></a>
        <a class="pqwd-link" href="<?php echo (new moodle_url('/local/hubredirect/sponsor_billing.php', $workspaceparams))->out(false); ?>"><strong>Sponsor Billing</strong><span>Open the focused invoice and commitment billing view.</span></a>
      <?php endif; ?>
    </section>

    <?php if ($canmanage || $canteach): ?>
    <section class="pqwd-grid">
      <article class="pqwd-panel">
        <h2>Students</h2>
        <?php if (!$students): ?>
          <div class="pqwd-empty">No students are linked to this workspace yet.</div>
        <?php else: ?>
          <table class="pqwd-table">
            <thead><tr><th>Student</th><th>Teacher</th><th>Courses enrolled</th><th>Level</th><th>Status</th><th>Links</th></tr></thead>
            <tbody>
              <?php foreach (array_slice($students, 0, 20) as $student): ?>
                <tr>
                  <td data-label="Student"><span class="pqwd-name"><?php echo s($student['name']); ?></span><span class="pqwd-muted">Account No. <?php echo s((string)($student['accountno'] ?? '') !== '' ? (string)$student['accountno'] : 'pending repair'); ?> / User #<?php echo (int)$student['studentid']; ?></span></td>
                  <td data-label="Teacher"><?php echo s(implode(', ', $studentteachers[(int)$student['studentid']] ?? [])); ?></td>
                  <td data-label="Courses enrolled"><?php $coursenames = $studentcourses[(int)$student['studentid']] ?? []; echo $coursenames ? s(implode(', ', $coursenames)) : '<span class="pqwd-muted">none</span>'; ?></td>
                  <td data-label="Level"><?php echo s((string)($student['level'] ?? '')); ?></td>
                  <td data-label="Status"><span class="pqwd-pill"><?php echo s((string)($student['status'] ?? 'active')); ?></span></td>
                  <td data-label="Links">
                    <a class="pqwd-btn pqwd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_student.php', ['workspaceid' => $workspaceid, 'studentid' => (int)$student['studentid']]))->out(false); ?>">Profile</a>
                    <a class="pqwd-btn pqwd-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/managed_reports.php', ['studentid' => (int)$student['studentid']]))->out(false); ?>">Report</a>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqwd-panel">
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
      </article>

      <article class="pqwd-panel">
        <h2>Workspace Members</h2>
        <?php if (!$members): ?>
          <div class="pqwd-empty">No active members found.</div>
        <?php else: ?>
          <table class="pqwd-table">
            <thead><tr><th>Member</th><th>Role</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($members as $member): ?>
                <tr>
                  <td data-label="Member"><span class="pqwd-name"><?php echo s(fullname($member)); ?></span><span class="pqwd-muted"><?php echo s(pqh_account_no_label($member)); ?> / <?php echo s($member->email); ?></span></td>
                  <td data-label="Role"><span class="pqwd-pill"><?php echo s($member->workspace_role); ?></span></td>
                  <td data-label="Updated"><?php echo s(userdate((int)$member->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>
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
</main>
<?php
if ($canteach) {
    echo pqh_embedded_support_html($workspaceid, (int)$USER->id, (int)$USER->id, 'student_helpdesk', $consumercontext);
}
echo $OUTPUT->footer();
