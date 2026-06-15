<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can view the live admin menu.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_admin.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Admin Menu');
$PAGE->set_heading('Live Admin Menu');
$PAGE->add_body_class('pqh-live-admin-menu-page');

function pqladm_page_status(string $path): string {
    global $CFG;
    return file_exists($CFG->dirroot . $path) ? 'ready' : 'missing';
}

function pqladm_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

$groups = [
    '1. Inquiry & Intake' => [
        ['Public inquiry form', '/local/hubredirect/public_intake.php', 'Parent-facing prospective student inquiry with course, profile, consent, and preferred weekly times.'],
        ['Inquiry queue', '/local/hubredirect/intake_requests.php', 'Review submitted inquiries before converting them into Moodle student and parent accounts.'],
        ['Student intake', '/local/hubredirect/student_intake.php', 'Create or link student and parent accounts, consent, profile data, and grouping fields.'],
        ['Teacher intake', '/local/hubredirect/teacher_intake.php', 'Create or link teacher accounts and onboarding profile details.'],
    ],
    '2. Matching, Pools & Class Groups' => [
        ['Student grouping', '/local/hubredirect/live_grouping.php', 'Manage profiles, matching pools, class groups, suggested assignments, and teacher matching.'],
        ['Teacher directory', '/local/hubredirect/live_teacher_directory.php', 'Find teachers, profiles, availability, current classes, QA status, and capacity.'],
        ['Teacher availability', '/local/hubredirect/live_availability.php', 'Set teacher weekly availability in a calendar grid for matching and conflict prevention.'],
        ['Capacity planning', '/local/hubredirect/live_capacity.php', 'Compare teacher load, open seats, group capacity, and scheduling pressure.'],
    ],
    '3. Scheduling & Session Creation' => [
        ['Guided session wizard', '/local/hubredirect/live_create_wizard.php', 'Create one safe one-time BBB class from teacher, group, students, date, and time.'],
        ['Recurring series wizard', '/local/hubredirect/live_series_wizard.php', 'Create weekly recurring class programs from one guided workflow.'],
        ['Class series', '/local/hubredirect/live_series.php', 'View, edit, cancel, and manage generated recurring sessions.'],
        ['Series schedule history', '/local/hubredirect/live_series_schedule.php', 'Parent-facing series schedule and change history support.'],
        ['Live calendar', '/local/hubredirect/live_calendar.php', 'Calendar view and downloads for student, parent, teacher, and admin schedule visibility.'],
    ],
    '4. Live Classroom & Post-Class Work' => [
        ['Live sessions', '/local/hubredirect/live_sessions.php', 'Create, start, join, and monitor BBB live-session records.'],
        ['Teacher workspace', '/local/hubredirect/live_teacher.php', 'Teacher day view with start class, lesson monitor, attendance, notes, and completion actions.'],
        ['Live lesson monitor', '/local/hubredirect/live_monitor.php', 'Teacher view of student self-study progress during a live review session.'],
        ['Attendance and notes', '/local/hubredirect/live_review.php', 'Post-class attendance, strengths, needs practice, homework, parent summary, and completion workflow.'],
    ],
    '5. Parent Trust & Communication' => [
        ['Live schedule', '/local/hubredirect/live_schedule.php', 'Parent and student schedule view with upcoming classes.'],
        ['Parent summaries', '/local/hubredirect/live_summaries.php', 'Parent-safe teacher feedback after class without private teacher notes.'],
        ['Follow-up command center', '/local/hubredirect/live_followups.php', 'Teacher-parent follow-ups, parent responses, reminders, escalation, and resolution.'],
        ['Communication center', '/local/hubredirect/communications.php', 'Parent-teacher communication linkage and support messages.'],
        ['Student parent links', '/local/hubredirect/live_parent_links.php', 'Audit student-to-parent guardian links, profile contacts, and consent status.'],
        ['Parent trust dashboard', '/local/hubredirect/live_parent_trust.php', 'Parent-facing trust view for schedule, feedback, recordings, consent, and access confidence.'],
    ],
    '6. Recordings, Quality & Teacher Growth' => [
        ['Recording review', '/local/hubredirect/live_recordings_admin.php', 'Pull BBB recordings, review quality, publish safely, and track retention.'],
        ['Recordings for parents', '/local/hubredirect/live_recordings.php', 'Parent-visible recordings after admin review and publication.'],
        ['Quality review', '/local/hubredirect/live_quality.php', 'Admin QA checklist, score, notes, coaching requests, and review state.'],
        ['QA analytics', '/local/hubredirect/live_quality_analytics.php', 'Teacher trends, scores, completion gaps, review history, and quality signals.'],
        ['Leadership review', '/local/hubredirect/live_leadership.php', 'Escalated quality cases, leadership decisions, and case management.'],
        ['Improvement plans', '/local/hubredirect/live_improvement_plans.php', 'Teacher improvement plans, reminders, escalations, dashboard, and history.'],
    ],
    '7. Operations, Compliance & Diagnostics' => [
        ['Operations dashboard', '/local/hubredirect/live_ops.php', 'Today, upcoming sessions, BBB errors, follow-up work, recordings, and QA queues.'],
        ['Reports', '/local/hubredirect/live_reports.php', 'Operational reporting for live sessions, teachers, students, and academy performance.'],
        ['Student parent links', '/local/hubredirect/live_parent_links.php', 'Student and guardian relationship report with export.'],
        ['Diagnostics', '/local/hubredirect/live_diagnostics.php', 'Check BBB settings, live-session tables, recent sessions, and audit rows.'],
        ['Parent trust audit', '/local/hubredirect/live_parent_trust_audit.php', 'Support access review, reasons, cases, and access audit.'],
        ['Retention policy', '/local/hubredirect/live_parent_trust_retention.php', 'Data retention settings, admin approval, purge readiness, and safeguards.'],
        ['Compliance review pack', '/local/hubredirect/live_parent_trust_review_pack.php', 'Parent trust export, compliance evidence, and review pack.'],
    ],
];

$workflows = [
    ['1', 'Collect public inquiry', '/local/hubredirect/public_intake.php', 'Parent submits student details, course interest, location, language, level, and preferred weekly times.'],
    ['2', 'Review inquiry queue', '/local/hubredirect/intake_requests.php', 'Admin reviews prospective student data, contact details, consent, and scheduling preferences.'],
    ['3', 'Create student intake', '/local/hubredirect/student_intake.php', 'Create/link Moodle student and parent accounts, capture consent, and create the student profile.'],
    ['4', 'Onboard teachers', '/local/hubredirect/teacher_intake.php', 'Create teacher accounts and profiles before they can be matched to class groups.'],
    ['5', 'Set teacher availability', '/local/hubredirect/live_availability.php', 'Capture weekly availability in a calendar grid so matching and conflict checks can work.'],
    ['6', 'Build pools and groups', '/local/hubredirect/live_grouping.php', 'Create matching pools and class groups using course, timezone, language, age, level, gender, and availability.'],
    ['7', 'Check capacity', '/local/hubredirect/live_capacity.php', 'Confirm teacher load, open seats, and class capacity before assigning recurring sessions.'],
    ['8', 'Create session or series', '/local/hubredirect/live_create_wizard.php', 'Create a one-time class, or use the recurring wizard when the class repeats weekly.'],
    ['9', 'Run live class', '/local/hubredirect/live_teacher.php', 'Teacher starts BBB, monitors student lesson progress, and supports the live review.'],
    ['10', 'Complete post-class review', '/local/hubredirect/live_review.php', 'Mark attendance, add feedback, assign homework, publish parent summary, and complete the session.'],
    ['11', 'Review recordings and QA', '/local/hubredirect/live_recordings_admin.php', 'Admin reviews recordings and quality before anything becomes parent-visible.'],
    ['12', 'Monitor operations', '/local/hubredirect/live_ops.php', 'Use daily operations, parent follow-ups, reports, retention, and audit pages for ongoing management.'],
];

$tablechecks = [
    'sessions' => pqladm_table_exists('local_prequran_live_session'),
    'participants' => pqladm_table_exists('local_prequran_live_participant'),
    'attendance' => pqladm_table_exists('local_prequran_live_attendance'),
    'notes' => pqladm_table_exists('local_prequran_live_note'),
    'recordings' => pqladm_table_exists('local_prequran_live_recording'),
    'audit' => pqladm_table_exists('local_prequran_live_audit'),
    'series' => pqladm_table_exists('local_prequran_live_series'),
    'availability' => pqladm_table_exists('local_prequran_live_availability'),
    'intake requests' => pqladm_table_exists('local_prequran_intake_request'),
    'student profiles' => pqladm_table_exists('local_prequran_student_profile'),
    'teacher profiles' => pqladm_table_exists('local_prequran_teacher_profile'),
    'matching pools' => pqladm_table_exists('local_prequran_group_pool'),
    'class groups' => pqladm_table_exists('local_prequran_class_group'),
    'group members' => pqladm_table_exists('local_prequran_group_member'),
];

echo $OUTPUT->header();
?>
<style>
body.pqh-live-admin-menu-page header,
body.pqh-live-admin-menu-page footer,
body.pqh-live-admin-menu-page nav.navbar,
body.pqh-live-admin-menu-page #page-header,
body.pqh-live-admin-menu-page #page-footer,
body.pqh-live-admin-menu-page .drawer,
body.pqh-live-admin-menu-page .drawer-toggles,
body.pqh-live-admin-menu-page .block-region,
body.pqh-live-admin-menu-page [data-region="drawer"],
body.pqh-live-admin-menu-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-admin-menu-page #page,
body.pqh-live-admin-menu-page #page-content,
body.pqh-live-admin-menu-page #region-main,
body.pqh-live-admin-menu-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqladm-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqladm-wrap{max-width:1240px;margin:0 auto}
.pqladm-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:22px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqladm-title{margin:0;font-size:30px;line-height:1.12;font-weight:950;color:#241b24}
.pqladm-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqladm-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqladm-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqladm-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqladm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqladm-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqladm-panel--wide{grid-column:1/-1}
.pqladm-panel h2{margin:0 0 13px;font-size:20px;font-weight:950;color:#241b24}
.pqladm-links{display:grid;gap:10px}
.pqladm-link{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:9px;background:#fbfdff;text-decoration:none!important;color:#173044!important}
.pqladm-link strong{display:block;font-size:14px;font-weight:950;color:#173044}
.pqladm-link span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:800}
.pqladm-pill{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044;white-space:nowrap}
.pqladm-pill--ok{background:#edf9ef;color:#245c35}
.pqladm-pill--bad{background:#fff0ed;color:#883526}
.pqladm-health{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.pqladm-workflows{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.pqladm-workflow{display:block;padding:13px;border:1px solid rgba(23,48,68,.1);border-radius:9px;background:#fbfdff;text-decoration:none!important;color:#173044!important}
.pqladm-workflow strong{display:block;font-size:13px;font-weight:950}
.pqladm-workflow span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:800}
.pqladm-workflow .pqladm-step{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin:0 0 8px;border-radius:999px;background:#8a613d;color:#fff!important;font-size:12px;font-weight:950}
@media(max-width:920px){.pqladm-grid{grid-template-columns:1fr}.pqladm-top{display:block}.pqladm-actions{margin-top:12px}.pqladm-health{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:920px){.pqladm-workflows{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.pqladm-title{font-size:24px}.pqladm-health,.pqladm-workflows{grid-template-columns:1fr}.pqladm-link{grid-template-columns:1fr}.pqladm-btn{width:100%}}
</style>
<main class="pqladm-shell">
  <div class="pqladm-wrap">
    <section class="pqladm-top">
      <div>
        <h1 class="pqladm-title">Quraan Academy Operations Hub</h1>
        <p class="pqladm-sub">One organized entry point for inquiry, intake, grouping, teacher matching, session creation, live classes, parent trust, QA, and compliance.</p>
      </div>
      <div class="pqladm-actions">
        <a class="pqladm-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php'))->out(false); ?>">Operations</a>
        <a class="pqladm-btn pqladm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/master_dashboard.php'))->out(false); ?>">Master dashboard</a>
        <a class="pqladm-btn pqladm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live sessions</a>
        <a class="pqladm-btn pqladm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
      </div>
    </section>

    <section class="pqladm-panel pqladm-panel--wide" style="margin-bottom:16px">
      <h2>Implementation Health</h2>
      <div class="pqladm-health">
        <?php foreach ($tablechecks as $label => $ok): ?>
          <div><span class="pqladm-pill <?php echo $ok ? 'pqladm-pill--ok' : 'pqladm-pill--bad'; ?>"><?php echo s($label); ?>: <?php echo $ok ? 'ready' : 'missing'; ?></span></div>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="pqladm-panel pqladm-panel--wide" style="margin-bottom:16px">
      <h2>Primary Admin Workflow</h2>
      <div class="pqladm-workflows">
        <?php foreach ($workflows as $workflow): ?>
          <?php [$step, $label, $path, $description] = $workflow; ?>
          <a class="pqladm-workflow" href="<?php echo (new moodle_url($path))->out(false); ?>">
            <span class="pqladm-step"><?php echo s($step); ?></span>
            <strong><?php echo s($label); ?></strong>
            <span><?php echo s($description); ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="pqladm-grid">
      <?php foreach ($groups as $groupname => $links): ?>
        <article class="pqladm-panel">
          <h2><?php echo s($groupname); ?></h2>
          <div class="pqladm-links">
            <?php foreach ($links as $link): ?>
              <?php [$label, $path, $description] = $link; ?>
              <?php $status = pqladm_page_status($path); ?>
              <a class="pqladm-link" href="<?php echo (new moodle_url($path))->out(false); ?>">
                <span><strong><?php echo s($label); ?></strong><span><?php echo s($description); ?></span></span>
                <span class="pqladm-pill <?php echo $status === 'ready' ? 'pqladm-pill--ok' : 'pqladm-pill--bad'; ?>"><?php echo s($status); ?></span>
              </a>
            <?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
