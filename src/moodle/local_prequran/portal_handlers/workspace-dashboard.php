<?php
// ---- report: workspace-dashboard (principal workspace operations home) -------
// Ported from local_hubredirect/workspace_dashboard.php via
// workspace_dashboard_portallib (pqwdl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
// GET  = everything the principal home renders: brand + workspace header,
//        KPI metrics, 7-day session bars, 30-day attendance rate, inactive
//        students, needs-attention inputs, students/sessions/members rollups,
//        domains and public workspace links.
// POST = rejected with 400: the legacy page is READ-ONLY (it performs no
//        DB writes; its only sesskey usage is a link into live_sessions.php's
//        join action, which belongs to that page's own migration).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workspace_dashboard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The workspace dashboard is read-only — it has no portal actions.');
}

// ---- Access + workspace resolution: same order and outcomes as the legacy
// page (workspace_dashboard.php lines 8-93). Legacy redirects become 403 JSON
// failures (the portal page cannot silently hop origins); pqh_access_denied
// messages are kept verbatim. pqh_requested_consumer_context() equals the
// legacy pqh_current_consumer_context() when no ?consumer= is passed and
// honours the portal_launch ?consumer= passthrough with the same trust rules
// every other hubredirect page applies.
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$explicitworkspaceid = $requestedworkspaceid;
$consumercontext = pqh_requested_consumer_context();
$contextworkspaceid = (int)($consumercontext->workspaceid ?? 0);
$isacademyconsumer = (string)($consumercontext->consumer_type ?? '') === 'academy_consumer';
if ($requestedworkspaceid <= 0 && $contextworkspaceid > 0 && !$isacademyconsumer) {
    $requestedworkspaceid = $contextworkspaceid;
}
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0) {
    $userconsumer = pqh_user_primary_consumer_context($userid);
    if ($userconsumer && (string)($userconsumer->consumerslug ?? '') !== ''
            && (string)($userconsumer->consumerslug ?? '') !== (string)($consumercontext->consumerslug ?? '')) {
        // Legacy: redirect(pqh_user_consumer_dashboard_url($userconsumer)).
        pqpd_fail(403, 'This account belongs to a different institution portal — open your dashboard at '
            . pqh_user_consumer_dashboard_url($userconsumer)->out(false) . '.');
    }
    if ($isacademyconsumer) {
        // Legacy: redirect to /local/hubredirect/dashboard.php for the consumer.
        pqpd_fail(403, 'This account uses the academy dashboard, not a teaching workspace dashboard.');
    }
    pqpd_fail(403, 'No teaching workspace is linked to this account yet.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'The selected teaching workspace was not found.');
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

$role = pqh_user_workspace_role($userid, $workspaceid);
if ($role === '') {
    $userconsumer = pqh_user_primary_consumer_context($userid);
    if ($userconsumer && (string)($userconsumer->consumerslug ?? '') !== ''
            && (string)($userconsumer->consumerslug ?? '') !== (string)($consumercontext->consumerslug ?? '')) {
        pqpd_fail(403, 'This account belongs to a different institution portal — open your dashboard at '
            . pqh_user_consumer_dashboard_url($userconsumer)->out(false) . '.');
    }
    if ($isacademyconsumer && $explicitworkspaceid <= 0) {
        pqpd_fail(403, 'This account uses the academy dashboard, not a teaching workspace dashboard.');
    }
    pqpd_fail(403, 'This account is not a member of the selected teaching workspace.');
}

if ($role === 'student') {
    // Legacy: redirect to /local/hubredirect/dashboard.php with workspaceid.
    pqpd_fail(403, 'Students use the standard dashboard experience — open the dashboard portal instead.');
}

// ---- Data assembly: verbatim port of the legacy computation block ------------
$workspaces = pqh_user_workspaces($userid);
$rolecounts = pqwdl_role_counts($workspaceid);
$issoloteacherworkspace = (string)($workspace->workspace_type ?? '') === 'solo_teacher';
$soloteacherid = $issoloteacherworkspace ? (int)($workspace->ownerid ?? 0) : 0;
if ($soloteacherid <= 0 && $issoloteacherworkspace && $role === 'teacher') {
    $soloteacherid = $userid;
}
$students = pqwdl_workspace_students($workspaceid, $soloteacherid);
$studentteachers = pqwdl_student_teacher_labels($workspaceid);
$studentcourses = pqwdl_student_course_labels(array_column(array_slice($students, 0, 20), 'studentid'));
$members = pqwdl_recent_members($workspaceid);
$sessions = pqwdl_upcoming_sessions($workspaceid);
$domains = pqwdl_workspace_domains($workspaceid);
$canmanage = pqh_user_can_manage_workspace($userid, $workspaceid);
$canteach = pqh_user_can_teach_in_workspace($userid, $workspaceid);
if ($canteach && !$canmanage) {
    // Teachers see only their own students: direct teacher-student
    // assignments plus members of class groups they lead. Workspace
    // admins/owners keep the full list.
    $teacherscopedids = [];
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $rows = $DB->get_records('local_prequran_teacher_student', [
            'teacherid' => $userid,
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
            ['teacherid' => $userid, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $teacherscopedids[(int)$row->studentid] = true;
        }
    }
    $students = array_values(array_filter($students, static function(array $student) use ($teacherscopedids): bool {
        return isset($teacherscopedids[(int)$student['studentid']]);
    }));
    $studentcourses = pqwdl_student_course_labels(array_column(array_slice($students, 0, 20), 'studentid'));
}
$canmanageofferings = $canmanage || (
    (string)($workspace->workspace_type ?? '') === 'solo_teacher'
    && pqh_has_independent_teacher_profile($userid)
    && $role === 'teacher'
);
$canacademyops = pqh_can_manage_academy_operations($userid);
// Legacy final gate: teachers and students use the standard dashboard
// experience; the workspace dashboard is the management view for owners,
// admins, and platform operators (legacy redirects to dashboard.php here).
if (!$canmanage && !$canacademyops
        && in_array($role, ['teacher', 'assistant_teacher', 'student'], true)) {
    pqpd_fail(403, 'Teachers and students use the standard dashboard — the workspace dashboard is the management view for owners, admins, and platform operators.');
}

$primarydomain = (string)($consumercontext->domain ?? '');
foreach ($domains as $domainrow) {
    if ((int)($domainrow->isprimary ?? 0) === 1) {
        $primarydomain = (string)$domainrow->domain;
        break;
    }
}
$workspaceparams = ['workspaceid' => $workspaceid];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $workspaceparams = ['consumer' => (string)$consumercontext->consumerslug] + $workspaceparams;
}
$publiclinks = [
    'landing' => pqwdl_domain_url($primarydomain, '/local/hubredirect/consumer_landing.php', $workspaceparams)->out(false),
    'profile' => pqwdl_domain_url($primarydomain, '/local/hubredirect/institution_profile.php', $workspaceparams)->out(false),
    'inquiry' => pqwdl_domain_url($primarydomain, '/local/hubredirect/institution_inquiry.php', $workspaceparams)->out(false),
    'login' => pqwdl_domain_url($primarydomain, '/local/hubredirect/consumer_login.php', $workspaceparams)->out(false),
    'studentintake' => pqwdl_domain_url($primarydomain, '/local/hubredirect/public_intake.php', $workspaceparams)->out(false),
    'coursecatalog' => pqwdl_domain_url($primarydomain, '/local/hubredirect/course_catalog_browse.php', $workspaceparams)->out(false),
    'teacheronboarding' => pqwdl_domain_url($primarydomain, '/local/hubredirect/teacher_intake.php', $workspaceparams)->out(false),
    'workspaceurl' => pqwdl_domain_url($primarydomain, '/local/hubredirect/workspace_dashboard.php', $workspaceparams)->out(false),
];

$metrics = [
    'students' => count($students),
    'teachers' => ($rolecounts['teacher'] ?? 0) + ($rolecounts['assistant_teacher'] ?? 0),
    'admins' => ($rolecounts['owner'] ?? 0) + ($rolecounts['admin'] ?? 0) + ($rolecounts['coordinator'] ?? 0),
    'sessions' => count($sessions),
    'groups' => pqwdl_count_records('local_prequran_class_group', ['workspaceid' => $workspaceid]),
    'materials' => pqwdl_count_records('local_prequran_workspace_material', ['workspaceid' => $workspaceid, 'status' => 'active']),
    'offerings' => pqwdl_count_records('local_prequran_course_offering', ['workspaceid' => $workspaceid, 'status' => 'published']),
    'pending_enrollments' => pqwdl_count_records('local_prequran_course_enrol_req', ['workspaceid' => $workspaceid, 'status' => 'pending']),
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

// ---- Decorate for the client (labels the page computes inline while
// rendering: teacher names, join/start action labels, member names). ----------
$nameids = [];
$sessionsout = [];
foreach ($sessions as $session) {
    $nameids[] = (int)$session->teacherid;
    $session->teachername = pqwdl_user_name((int)$session->teacherid);
    $session->action_label = pqwdl_session_action_label($session, $canmanage);
    $sessionsout[] = $session;
}
$membersout = [];
foreach ($members as $member) {
    $nameids[] = (int)$member->userid;
    $membersout[] = [
        'userid' => (int)$member->userid,
        'name' => fullname($member),
        'email' => (string)$member->email,
        'accountlabel' => pqh_account_no_label($member),
        'workspace_role' => (string)$member->workspace_role,
        'timemodified' => (int)$member->timemodified,
    ];
}
$domainsout = [];
foreach ($domains as $domainrow) {
    $domainsout[] = [
        'domain' => (string)$domainrow->domain,
        'domain_type' => (string)$domainrow->domain_type,
        'isprimary' => (int)($domainrow->isprimary ?? 0) === 1,
    ];
}
$workspacesout = [];
foreach ($workspaces as $candidate) {
    $workspacesout[] = ['id' => (int)$candidate->id, 'name' => (string)$candidate->name];
}
$studentteachersout = [];
foreach ($studentteachers as $sid => $labels) {
    $studentteachersout[(string)$sid] = array_values($labels);
}
$studentcoursesout = [];
foreach ($studentcourses as $sid => $labels) {
    $studentcoursesout[(string)$sid] = array_values($labels);
}

echo json_encode([
    'ok' => true,
    'workspace' => [
        'id' => $workspaceid,
        'name' => (string)$workspace->name,
        'type' => (string)($workspace->workspace_type ?? ''),
        'type_label' => (string)(pqh_workspace_types()[$workspace->workspace_type] ?? $workspace->workspace_type),
    ],
    'role' => $role,
    'role_label' => $role === 'platform_admin' ? 'platform admin' : $role,
    'flags' => [
        'canmanage' => $canmanage,
        'canteach' => $canteach,
        'canmanageofferings' => $canmanageofferings,
        'canacademyops' => $canacademyops,
        'issoloteacher' => $issoloteacherworkspace,
        'showpubliclinks' => !$issoloteacherworkspace || $canacademyops,
    ],
    'brand' => [
        'name' => $brandname,
        'logo' => $brandlogo,
        'color' => $brandcolor,
        'initial' => $brandinitial,
    ],
    'consumer' => [
        'slug' => (string)($consumercontext->consumerslug ?? ''),
        'name' => (string)($consumercontext->consumername ?? ''),
        'type' => (string)($consumercontext->consumer_type ?? ''),
    ],
    'workspaces' => $workspacesout,
    'primarydomain' => $primarydomain !== '' ? $primarydomain : (string)$CFG->wwwroot,
    'publiclinks' => $publiclinks,
    'metrics' => $metrics,
    'attrate' => $pqwdattrate,
    'held30' => $pqwdheld30,
    'inactive14' => $pqwdinactive,
    'week' => $pqwdweek,
    'weekmax' => $pqwdweekmax,
    'students' => $students,
    'studentteachers' => $studentteachersout,
    'studentcourses' => $studentcoursesout,
    'sessions' => $sessionsout,
    'members' => $membersout,
    'domains' => $domainsout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
