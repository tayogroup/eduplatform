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
        $userconsumerurl = pqh_user_consumer_dashboard_url_offhost($userconsumer);
        if ($userconsumerurl) {
            redirect($userconsumerurl);
        }
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
        $userconsumerurl = pqh_user_consumer_dashboard_url_offhost($userconsumer);
        if ($userconsumerurl) {
            redirect($userconsumerurl);
        }
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

// Academy-ops managers stay on the management view even when they also hold
// a student role here: dashboard.php sends them to role_redirect.php, which
// sends canmanage users back to this page, so bouncing them out again on the
// student role closes an infinite dashboard -> role_redirect -> here triangle.
if ($role === 'student' && !pqh_can_manage_academy_operations((int)$USER->id)) {
    $studentparams = [];
    if ((string)($consumercontext->consumerslug ?? '') !== '') {
        $studentparams['consumer'] = (string)$consumercontext->consumerslug;
    }
    $studentparams['workspaceid'] = $workspaceid;
    redirect(new moodle_url('/local/hubredirect/dashboard.php', $studentparams));
}

$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$canteach = pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid);
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
if (!$canmanage && !$canacademyops
        && in_array($role, ['teacher', 'assistant_teacher', 'student', 'parent'], true)) {
    redirect(new moodle_url('/local/hubredirect/dashboard.php', $consumerparams));
}
$workspaceparams = $consumerparams + ['workspaceid' => $workspaceid];
$brandediturl = new moodle_url('/local/hubredirect/institution_settings.php', $workspaceparams);
$sampledataurl = new moodle_url('/local/hubredirect/institution_sample_data.php', $workspaceparams);
$testmatrixurl = new moodle_url('/local/hubredirect/institution_test_matrix.php', $workspaceparams);
$platformconsumersurl = new moodle_url('/local/hubredirect/platform_consumers.php');
$profileurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams);
$diagnosticsurl = new moodle_url('/local/hubredirect/consumer_diagnostics.php', $consumerparams);
$onboardingurl = new moodle_url('/local/hubredirect/institution_onboarding.php');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/admin_workspace.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Admin Workspace');
$PAGE->set_heading('Admin Workspace');
$PAGE->add_body_class('pqaw-page');

echo $OUTPUT->header();
?>
<style>
body.pqaw-page header,body.pqaw-page footer,body.pqaw-page nav.navbar,body.pqaw-page #page-header,body.pqaw-page #page-footer,body.pqaw-page .drawer,body.pqaw-page .drawer-toggles,body.pqaw-page .block-region,body.pqaw-page [data-region="drawer"],body.pqaw-page [data-region="right-hand-drawer"]{display:none!important}
body.pqaw-page #page,body.pqaw-page #page-content,body.pqaw-page #region-main,body.pqaw-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqaw-shell{min-height:100vh;padding:28px 18px 56px;background:#fff;color:#173044;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6}
.pqaw-wrap{max-width:1280px;margin:0 auto}
.pqaw-top{padding:20px 22px;border:1px solid rgba(23,48,68,.12);border-radius:14px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06);margin-bottom:14px}
.pqaw-title{margin:0;color:#0f2237;font-size:26px;font-weight:800;letter-spacing:-.02em}
.pqaw-sub{margin:7px 0 0;color:#5b6b7c;font-size:14px;font-weight:500}
.pqaw-cardlinks{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.pqaw-group{margin-bottom:22px}
.pqaw-group-title{display:flex;align-items:center;gap:10px;margin:0 0 10px;color:#0f2237;font-size:13px;font-weight:750;text-transform:uppercase;letter-spacing:.06em}
.pqaw-group-title::after{content:"";flex:1 1 auto;height:1px;background:#e4e9ef}
.pqaw-link{display:block;min-height:86px;padding:14px;border-radius:12px;background:#fff;border:1px solid #e4e9ef;color:#173044!important;text-decoration:none;box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);transition:transform .16s ease,box-shadow .16s ease}
.pqaw-link:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(15,34,55,.06),0 18px 38px -16px rgba(15,34,55,.22);text-decoration:none}
.pqaw-link strong{display:block;color:#0f2237;font-size:15px;font-weight:700}
.pqaw-link span{display:block;margin-top:5px;color:#5b6b7c;font-size:12px;font-weight:500;line-height:1.35}
.pqaw-shell .pqh-appbar{background:linear-gradient(90deg,#cfe9ff 0%,#e3f4ff 50%,#f2fbff 100%)}
<?php echo pqh_design_shell_css('.pqaw-shell'); ?>
</style>
<style><?php echo pqh_openproject_skin_css('pqaw', 'pqaw-page'); ?></style>
<style><?php echo pqh_learner_chrome_css('.pqaw-shell'); ?></style>
<main class="pqaw-shell">
<?php
$pqawnavitems = [];
if ($canmanage) {
    $pqawnavitems[] = [
        'label' => 'Manage people',
        'url' => new moodle_url('/local/hubredirect/workspace_people.php', $workspaceparams),
        'icon' => '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    ];
    $pqawnavitems[] = [
        'label' => 'Settings',
        'url' => $brandediturl,
        'icon' => '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    ];
}
if ($canacademyops) {
    $pqawnavitems[] = [
        'label' => 'Manage workspaces',
        'url' => new moodle_url('/local/hubredirect/workspaces.php', ['editworkspaceid' => $workspaceid]),
        'icon' => '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    ];
    $pqawnavitems[] = [
        'label' => 'Platform consumers',
        'url' => $platformconsumersurl,
        'icon' => '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>',
    ];
}
if ($canteach) {
    $pqawnavitems[] = [
        'label' => 'Manage tickets',
        'url' => new moodle_url('/local/hubredirect/support.php', ['workspaceid' => $workspaceid]),
        'icon' => '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
        'attrs' => 'data-pq-support-action="open"',
    ];
    $pqawnavitems[] = [
        'label' => 'Create a ticket',
        'url' => new moodle_url('/local/hubredirect/support.php', ['workspaceid' => $workspaceid, 'new' => 1]),
        'icon' => '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
        'attrs' => 'data-pq-support-action="new"',
    ];
}
echo pqh_design_shell_html('pqaw-shell', 'workspace', [
    'title' => 'Admin Workspace',
    'appbar' => [
        ['Dashboard', new moodle_url('/local/hubredirect/workspace_dashboard.php', $workspaceparams)],
        ['School Hub', new moodle_url('/local/hubredirect/consumer_landing.php', $workspaceparams)],
        ['Back', 'BACK', new moodle_url('/local/hubredirect/admin_workspace.php', $workspaceparams)],
    ],
    'hideitems' => ['workspace'],
    'navitems' => $pqawnavitems,
]);
?>
  <div class="pqaw-wrap">
    <section class="pqaw-top">
      <h1 class="pqaw-title">Admin Workspace</h1>
      <p class="pqaw-sub"><?php echo s((string)$workspace->name); ?> - daily operating tools and administration.</p>
    </section>

    <?php
    // Grouped rather than one flat wall of ~50 cards. Note $canmanage implies
    // $canteach (pqh_user_can_teach_in_workspace counts owner/admin), so the
    // teaching group below deliberately drops the tools that reappear in
    // richer admin form further down -- otherwise an admin sees Course
    // Offerings, Gradebook, Learning Path, Communications Center and
    // Unofficial Transcripts twice, which is what the flat list did.
    ?>
    <?php if ($canmanageofferings && !$canmanage): ?>
      <section class="pqaw-group" aria-labelledby="pqaw-g-independent">
        <h2 class="pqaw-group-title" id="pqaw-g-independent">Independent Teaching</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketing.php', $workspaceparams))->out(false); ?>"><strong>Market My Services</strong><span>Manage your public profile, service offers, pricing, and online presence.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_student_connect.php', $workspaceparams))->out(false); ?>"><strong>Find or Invite Student</strong><span>Search for an existing learner first, or invite a new student into this independent teaching workspace.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>"><strong>Course Offerings</strong><span>Create courses or tutoring services, set dates, seats, syllabus, pricing, and review enrollment requests.</span></a>
        </div>
      </section>
    <?php endif; ?>

    <?php if ($canteach): ?>
      <section class="pqaw-group" aria-labelledby="pqaw-g-teaching">
        <h2 class="pqaw-group-title" id="pqaw-g-teaching">My Teaching</h2>
        <div class="pqaw-cardlinks">
          <?php if ($canmanageofferings && $canmanage): ?>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_marketing.php', $workspaceparams))->out(false); ?>"><strong>Market My Services</strong><span>Manage your public profile, service offers, pricing, and online presence.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_student_connect.php', $workspaceparams))->out(false); ?>"><strong>Find or Invite Student</strong><span>Search for an existing learner first, or invite a new student into this independent teaching workspace.</span></a>
          <?php endif; ?>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_workspace.php', $workspaceparams))->out(false); ?>"><strong>Teacher Workspace</strong><span>Today's classes, attendance, notes, and post-class review.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_portal.php', $workspaceparams))->out(false); ?>"><strong>Teacher Portal</strong><span>Today's classes, roster, attendance, grades, notes, homework, and progress updates.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_materials.php', $workspaceparams))->out(false); ?>"><strong>Material Library</strong><span>Review resources, assignment progress, and completed student materials.</span></a>
          <?php if (!$canmanage): ?>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $workspaceparams))->out(false); ?>"><strong>Live Sessions</strong><span>Open upcoming classes, join/start rooms, review notes, recordings, homework, and reminders.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/gradebook_assessment.php', $workspaceparams))->out(false); ?>"><strong>Gradebook</strong><span>Enter and review assessment grades, oral recitation marks, publishing, disputes, corrections, and audit history.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/learning_path.php', $workspaceparams))->out(false); ?>"><strong>Learning Path</strong><span>Track placement, mastery, skill maps, recommended next courses, comments, and interventions.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/communications_center.php', $workspaceparams))->out(false); ?>"><strong>Communications Center</strong><span>Message parents, students, and teachers, manage cases, and review student thread history.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/syllabus.php', $workspaceparams))->out(false); ?>"><strong>Syllabus</strong><span>Write the syllabus for courses you teach, then submit it for administrator approval.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams))->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Review live transcript previews for assigned students.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $workspaceparams))->out(false); ?>"><strong>Workspace Reports</strong><span>Institution-level teacher load, session, attendance, material, and quiz summaries.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/at_risk_report.php', $workspaceparams))->out(false); ?>"><strong>At-Risk Students</strong><span>Early-warning report with configurable rules, intervention notes, and CSV export.</span></a>
          <?php endif; ?>
        </div>
      </section>
    <?php endif; ?>

    <?php if ($canmanage): ?>
      <section class="pqaw-group" aria-labelledby="pqaw-g-people">
        <h2 class="pqaw-group-title" id="pqaw-g-people">People & Admissions</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $workspaceparams))->out(false); ?>"><strong>People & Assignments</strong><span>Add students, add teachers, and assign students to teachers inside this workspace.</span></a>
          <?php if ($canacademyops): ?>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/student_intake.php', $workspaceparams))->out(false); ?>"><strong>Student Intake</strong><span>Create new student and parent accounts directly inside this workspace.</span></a>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_intake.php', $workspaceparams))->out(false); ?>"><strong>Teacher Onboarding</strong><span>Create or link teacher accounts and add them to this workspace.</span></a>
          <?php else: ?>
            <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $workspaceparams))->out(false); ?>"><strong>Add Existing Users</strong><span>Add existing students, parents, and teachers to this workspace.</span></a>
          <?php endif; ?>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/admissions.php', $workspaceparams))->out(false); ?>"><strong>Admissions Pipeline</strong><span>Review applications, documents, placement assessments, decisions, waitlists, and student conversion.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/placement_tests.php', $workspaceparams))->out(false); ?>"><strong>Placement Tests</strong><span>Define placement tests, schedule assessments, score readiness, and apply level/course recommendations.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/teacher_administration.php', $workspaceparams))->out(false); ?>"><strong>Teacher Administration</strong><span>Manage availability, load, contracts, rates, assignments, substitutes, and marketplace payout readiness.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-courses">
        <h2 class="pqaw-group-title" id="pqaw-g-courses">Courses & Academics</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams))->out(false); ?>"><strong>Course Offerings</strong><span>Create institution course seats, link courses, set dates, syllabus, prerequisites, and approve enrollment requests.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/syllabus.php', $workspaceparams))->out(false); ?>"><strong>Syllabus</strong><span>Per-course, per-year syllabus: teachers author the narrative, administrators approve, publish, and retire it.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/academic_calendar.php', $workspaceparams))->out(false); ?>"><strong>Academic Calendar</strong><span>Manage terms, holidays, blackout dates, enrollment windows, course schedules, and deadlines.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/gradebook_assessment.php', $workspaceparams))->out(false); ?>"><strong>Gradebook & Assessment</strong><span>Configure weighted categories, assessments, grade review, publishing, disputes, corrections, and transcript grades.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/learning_path.php', $workspaceparams))->out(false); ?>"><strong>Student Learning Paths</strong><span>Manage placement, advancement rules, mastery tracking, skill maps, next-course recommendations, and interventions.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_seat_report.php', $workspaceparams))->out(false); ?>"><strong>Course Seat Report</strong><span>Review capacity, open seats, utilization, pending requests, and dropped enrollments.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_student_history.php', $workspaceparams))->out(false); ?>"><strong>Student Course History</strong><span>See each student's course request, approval, sync, and drop history.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_sync_report.php', $workspaceparams))->out(false); ?>"><strong>Course Sync Report</strong><span>Find approved requests needing course sync and linked-course setup issues.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-live">
        <h2 class="pqaw-group-title" id="pqaw-g-live">Live Classes & Attendance</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_sessions.php', $workspaceparams))->out(false); ?>"><strong>Live Sessions</strong><span>Create, start, join, and review live sessions for this workspace.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_series.php', $workspaceparams))->out(false); ?>"><strong>Recurring Series</strong><span>Edit, reschedule, and cancel recurring workspace classes.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $workspaceparams))->out(false); ?>"><strong>Live Operations</strong><span>Monitor scheduling, capacity, room readiness, recordings, parent visibility, reminders, and diagnostics.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/attendance_operations.php', $workspaceparams))->out(false); ?>"><strong>Attendance Operations</strong><span>Track late, excused, absent, make-up, reports, academic standing actions, and finance holds.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-comms">
        <h2 class="pqaw-group-title" id="pqaw-g-comms">Communications & Workflow</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/communications_center.php', $workspaceparams))->out(false); ?>"><strong>Communications Center</strong><span>Manage messaging, announcements, templates, consent, delivery logs, and student case histories.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_requests.php', $workspaceparams))->out(false); ?>"><strong>Requests Queue</strong><span>Every pending approval across the workspace in one list, oldest first: enrolments, intake, teacher applications, admissions, syllabi, and scholarships.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/admin_workflow.php', $workspaceparams))->out(false); ?>"><strong>Admin Workflow</strong><span>Run admissions, finance, registrar, teacher, and support queues with approvals, escalations, notes, and audit history.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-records">
        <h2 class="pqaw-group-title" id="pqaw-g-records">Records, Transcripts & Documents</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams))->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Preview transcript headers, course lines, warnings, and admin diagnostics.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/transcript_readiness.php', $workspaceparams))->out(false); ?>"><strong>Transcript Readiness</strong><span>Find transcript blockers, warnings, repair links, and export data-quality CSVs.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_official.php', $workspaceparams))->out(false); ?>"><strong>Official Transcript Drafts</strong><span>Open the issue workflow after selecting a student from transcript previews.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/transcript_controls.php', $workspaceparams))->out(false); ?>"><strong>Transcript Controls</strong><span>Manage transcript holds, correction records, revocation, and reissue workflows.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/transcript_policy.php', $workspaceparams))->out(false); ?>"><strong>Transcript Policy</strong><span>Configure completion, grade, attendance, display, and official issue rules.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript_export.php', $workspaceparams + ['type' => 'documents', 'format' => 'csv']))->out(false); ?>"><strong>Issued Transcript CSV</strong><span>Export issued transcript document IDs, hashes, policy, and issue metadata.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/certificates_awards.php', $workspaceparams))->out(false); ?>"><strong>Certificates & Awards</strong><span>Create templates, issue completion awards, generate certificate PDFs, revoke awards, and audit changes.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/document_management.php', $workspaceparams))->out(false); ?>"><strong>Document Management</strong><span>Upload, verify, expire, download, and audit student documents, IDs, certificates, consent forms, and generated PDFs.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-finance">
        <h2 class="pqaw-group-title" id="pqaw-g-finance">Finance & Funding</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $workspaceparams))->out(false); ?>"><strong>Finance Operations</strong><span>Review open invoices, overdue balances, payments, exceptions, holds, reconciliation reports, and CSV exports.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/scholarship_portal.php', $workspaceparams))->out(false); ?>"><strong>Scholarship Applications</strong><span>Manage scholarship intake, family/student requests, review decisions, waitlists, awards, and finance conversion.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/sponsor_donor_portal.php', $workspaceparams))->out(false); ?>"><strong>Sponsor & Donor Portal</strong><span>Review donor pledges, sponsor commitments, invoice allocations, donor privacy, and sponsorship readiness.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-reports">
        <h2 class="pqaw-group-title" id="pqaw-g-reports">Reports & Insights</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/executive_dashboard.php', $workspaceparams))->out(false); ?>"><strong>Executive Dashboard</strong><span>Review enrollment funnel, revenue, AR aging, retention, utilization, student progress, and course profitability.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $workspaceparams))->out(false); ?>"><strong>Workspace Reports</strong><span>Institution-level teacher load, session, attendance, material, and quiz summaries.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/at_risk_report.php', $workspaceparams))->out(false); ?>"><strong>At-Risk Students</strong><span>Early-warning report with configurable rules, intervention notes, and CSV export.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-setup">
        <h2 class="pqaw-group-title" id="pqaw-g-setup">Institution Setup</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo $brandediturl->out(false); ?>"><strong>Institution Settings</strong><span>Edit logo, initials, colors, domains, support email, landing text, and default courses.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/roles_permissions.php', $workspaceparams))->out(false); ?>"><strong>Roles & Tenant Controls</strong><span>Manage registrar, finance, teacher, parent, sponsor, and support capabilities, isolation audits, and support access.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/localization_currency.php', $workspaceparams))->out(false); ?>"><strong>Localization & Currency</strong><span>Manage tenant locale, regional display formats, enabled currencies, exchange rates, and tax-region policy.</span></a>
          <a class="pqaw-link" href="<?php echo $profileurl->out(false); ?>"><strong>Public Institution Profile</strong><span>Preview the public profile and inquiry path for this institution.</span></a>
          <?php if ($canacademyops): ?>
            <a class="pqaw-link" href="<?php echo $platformconsumersurl->out(false); ?>"><strong>Platform Consumers</strong><span>Manage institution consumers, domains, workspace status, support email, and debug links.</span></a>
            <a class="pqaw-link" href="<?php echo $onboardingurl->out(false); ?>"><strong>Onboard Institution</strong><span>Set up a brand-new consumer institution on the platform.</span></a>
          <?php endif; ?>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-data">
        <h2 class="pqaw-group-title" id="pqaw-g-data">Data, Compliance & Integrations</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/bulk_import_export.php', $workspaceparams))->out(false); ?>"><strong>Bulk Import/Export</strong><span>Validate member CSVs, commit bulk workspace imports, export operational datasets, and review processing history.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/data_migration_tools.php', $workspaceparams))->out(false); ?>"><strong>Data Migration Tools</strong><span>Run scoped inventory, record dry-run validations, mapping notes, rollback plans, and migration audit history.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/backup_dr_checks.php', $workspaceparams))->out(false); ?>"><strong>Backup & DR Checks</strong><span>Track backup evidence, restore-test dates, disaster recovery readiness findings, runbooks, and recurring checks.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/compliance_governance.php', $workspaceparams))->out(false); ?>"><strong>Compliance & Governance</strong><span>Manage retention, privacy workflows, consent history, export/delete/anonymize review, and full audit reports.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/mobile_api_readiness.php', $workspaceparams))->out(false); ?>"><strong>Mobile & API Readiness</strong><span>Review REST endpoint health, service inventory, token readiness, mobile client profiles, and readiness snapshots.</span></a>
        </div>
      </section>

      <section class="pqaw-group" aria-labelledby="pqaw-g-testing">
        <h2 class="pqaw-group-title" id="pqaw-g-testing">Testing & Diagnostics</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo $sampledataurl->out(false); ?>"><strong>Validation Data</strong><span>Create sample students, teachers, sessions, attendance, materials, and report data for end-to-end testing.</span></a>
          <a class="pqaw-link" href="<?php echo $testmatrixurl->out(false); ?>"><strong>Role Test Matrix</strong><span>Test guest, institution admin, teacher, parent, student, and platform admin flows on the custom domain.</span></a>
          <?php if ($canacademyops): ?>
            <a class="pqaw-link" href="<?php echo $diagnosticsurl->out(false); ?>"><strong>Diagnostics</strong><span>Review consumer domain routing, session, and configuration diagnostics.</span></a>
          <?php endif; ?>
        </div>
      </section>
    <?php endif; ?>

    <?php if ($role === 'parent'): ?>
      <section class="pqaw-group" aria-labelledby="pqaw-g-family">
        <h2 class="pqaw-group-title" id="pqaw-g-family">Family</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/student_parent_portal.php', $workspaceparams))->out(false); ?>"><strong>Family Portal</strong><span>Review enrolled courses, invoices, payments, attendance, grades, transcripts, payment plans, and secure downloads.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_parent.php', $workspaceparams))->out(false); ?>"><strong>Parent View</strong><span>Review linked students, attendance, notes, materials, and recordings.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams))->out(false); ?>"><strong>Course Catalog</strong><span>Review available seats, dates, syllabus, prerequisites, and request enrollment for linked students.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/scholarship_portal.php', $workspaceparams))->out(false); ?>"><strong>Scholarship Applications</strong><span>Submit and track scholarship requests for linked students, invoices, eligible courses, and donor-funded support.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/course_transcript.php', $workspaceparams))->out(false); ?>"><strong>Unofficial Transcripts</strong><span>Review live course records for linked children.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/live_trust.php', $workspaceparams))->out(false); ?>"><strong>Live Class Safety</strong><span>Open parent-facing live-session visibility, consent, and recording controls.</span></a>
        </div>
      </section>
    <?php endif; ?>

    <?php if ($role === 'sponsor'): ?>
      <section class="pqaw-group" aria-labelledby="pqaw-g-sponsor">
        <h2 class="pqaw-group-title" id="pqaw-g-sponsor">Sponsorship</h2>
        <div class="pqaw-cardlinks">
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/sponsor_donor_portal.php', $workspaceparams))->out(false); ?>"><strong>Sponsor & Donor Portal</strong><span>Submit pledges, review sponsored learner invoices, donor privacy, commitments, and allocation status.</span></a>
          <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/sponsor_billing.php', $workspaceparams))->out(false); ?>"><strong>Sponsor Billing</strong><span>Open the focused invoice and commitment billing view.</span></a>
        </div>
      </section>
    <?php endif; ?>

    <section class="pqaw-group" aria-labelledby="pqaw-g-help">
      <h2 class="pqaw-group-title" id="pqaw-g-help">Help & Reference</h2>
      <div class="pqaw-cardlinks">
        <a class="pqaw-link" href="<?php echo (new moodle_url('/local/hubredirect/how_to.php', $workspaceparams))->out(false); ?>"><strong>How To</strong><span>Step-by-step reference guides: onboarding a consumer, running a course from creation to enrollment, and the full student and teacher journeys.</span></a>
      </div>
    </section>
  </div>
</main>
<?php
if ($canteach) {
    echo pqh_embedded_support_html($workspaceid, (int)$USER->id, (int)$USER->id, 'student_helpdesk', $consumercontext);
}
echo $OUTPUT->footer();
