<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin($USER)) {
    throw new moodle_exception('nopermissions', '', '', 'Only site administrators can view the master dashboard.');
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/master_dashboard.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Master Dashboard');
$PAGE->set_heading('Master Dashboard');
$PAGE->add_body_class('pqh-master-dashboard-page');

function pqmd_status(string $path, bool $external = false): string {
    global $CFG;
    if ($external) {
        return 'external';
    }
    return file_exists($CFG->dirroot . $path) ? 'ready' : 'missing';
}

function pqmd_url(string $path, array $params = [], bool $external = false): string {
    if ($external) {
        return $path;
    }
    return (new moodle_url($path, $params))->out(false);
}

$categories = [
    'Administrators' => [
        ['Master Dashboard', '/local/hubredirect/master_dashboard.php', [], 'This page: all major links grouped by role and system.'],
        ['Main Dashboard', '/local/hubredirect/dashboard.php', [], 'Role-aware starting page for admins, teachers, parents, and students.'],
        ['Live Admin Menu', '/local/hubredirect/live_admin.php', [], 'Operations workflow for intake, grouping, live sessions, trust, QA, and compliance.'],
        ['Operations', '/local/hubredirect/live_ops.php', [], 'Daily queues, BBB issues, follow-ups, recordings, and QA action items.'],
        ['Reports', '/local/hubredirect/live_reports.php', [], 'Live-session reporting for students, teachers, and academy operations.'],
        ['Student Parent Links', '/local/hubredirect/live_parent_links.php', [], 'Audit student-to-parent guardian links, profile contacts, and consent status.'],
        ['Intake Queue', '/local/hubredirect/intake_requests.php', [], 'Review submitted public inquiries before creating accounts.'],
        ['Student Intake', '/local/hubredirect/student_intake.php', [], 'Create or link student and parent accounts, consent, and profile data.'],
        ['Teacher Intake', '/local/hubredirect/teacher_intake.php', [], 'Create or link teacher accounts and onboarding profile details.'],
        ['Student Grouping', '/local/hubredirect/live_grouping.php', [], 'Manage matching pools, class groups, and suggested assignments.'],
        ['Teacher Directory', '/local/hubredirect/live_teacher_directory.php', [], 'Review teachers, capacity, profiles, availability, and assignments.'],
        ['Capacity Planning', '/local/hubredirect/live_capacity.php', [], 'Compare teacher load, open seats, and scheduling pressure.'],
        ['Parent Follow-Ups', '/local/hubredirect/live_followups.php', [], 'Track family follow-ups, responses, reminders, and closure.'],
    ],
    'Teachers' => [
        ['Teacher Workspace', '/local/hubredirect/live_teacher.php', [], 'Teacher day view with start class, monitor, attendance, notes, and completion.'],
        ['Availability', '/local/hubredirect/live_availability.php', [], 'Set weekly availability for matching and conflict checks.'],
        ['Guided Session Wizard', '/local/hubredirect/live_create_wizard.php', [], 'Create one safe BBB review class with capacity and conflict checks.'],
        ['Series Wizard', '/local/hubredirect/live_series_wizard.php', [], 'Create recurring weekly class sessions.'],
        ['Class Series', '/local/hubredirect/live_series.php', [], 'View, edit, cancel, and manage recurring sessions.'],
        ['Live Sessions', '/local/hubredirect/live_sessions.php', [], 'Create, start, join, and monitor BBB live-session records.'],
        ['Lesson Monitor', '/local/hubredirect/live_teacher.php', [], 'Open from a live session card to watch students during class.'],
        ['Attendance & Notes', '/local/hubredirect/live_teacher.php', [], 'Open from a session card after class to record attendance and feedback.'],
        ['Quality Review', '/local/hubredirect/live_quality.php', [], 'Admin QA checklist and teacher coaching review; usually opened from a session.'],
        ['Speak Recordings', '/local/hubredirect/recordings.php', [], 'Review student Speak practice recordings.'],
        ['Communications', '/local/hubredirect/communications.php', [], 'Teacher-parent messages and announcements.'],
    ],
    'Students' => [
        ['Student Dashboard', '/local/hubredirect/dashboard.php', [], 'Student starting point for lessons, live schedule, and feedback.'],
        ['Alphabet Lesson', '/local/hubredirect/issue_child.php', ['goto' => 'alphabet_listen', 'managed_student' => 1], 'Launch the alphabet lesson through the official Moodle portal.'],
        ['Live Schedule', '/local/hubredirect/live_schedule.php', [], 'Student schedule with upcoming review classes and join availability.'],
        ['Class Series Schedule', '/local/hubredirect/live_series_schedule.php', [], 'Recurring class schedule and change history.'],
        ['Live Calendar', '/local/hubredirect/live_calendar.php', [], 'Calendar view and add-to-calendar options.'],
        ['Live Sessions', '/local/hubredirect/live_sessions.php', [], 'Join scheduled BBB review sessions when the join window opens.'],
        ['Teacher Feedback', '/local/hubredirect/live_summaries.php', [], 'Parent-safe class summaries and homework after class.'],
        ['Trust Center', '/local/hubredirect/live_trust.php', [], 'Safety, attendance, recording status, and class access confidence.'],
        ['Speak Recordings', '/local/hubredirect/recordings.php', [], 'Student Speak practice recordings.'],
    ],
    'Parents' => [
        ['Parent Dashboard', '/local/hubredirect/dashboard.php', [], 'Parent starting point for children, lessons, messages, and live classes.'],
        ['Parent Live Hub', '/local/hubredirect/live_parent_trust.php', [], 'Schedule, feedback, homework, recordings, consent, and trust information.'],
        ['Live Schedule', '/local/hubredirect/live_schedule.php', [], 'Upcoming review classes for children associated with the parent.'],
        ['Live Summaries', '/local/hubredirect/live_summaries.php', [], 'Teacher feedback and class outcomes filtered for the child.'],
        ['Live Recordings', '/local/hubredirect/live_recordings.php', [], 'Approved class recordings for parent viewing.'],
        ['Trust Center', '/local/hubredirect/live_trust.php', [], 'Safety and session confidence information.'],
        ['Class Series Schedule', '/local/hubredirect/live_series_schedule.php', [], 'Recurring class schedule and change history.'],
        ['Live Calendar', '/local/hubredirect/live_calendar.php', [], 'Monthly class calendar.'],
        ['Communications', '/local/hubredirect/communications.php', [], 'Parent-teacher communication and announcements.'],
        ['Public Inquiry', '/local/hubredirect/public_intake.php', [], 'Public-facing inquiry form for prospective families.'],
    ],
    'BBB' => [
        ['Live Sessions', '/local/hubredirect/live_sessions.php', [], 'Create, start, join, and inspect BigBlueButton sessions.'],
        ['BBB Diagnostics', '/local/hubredirect/live_diagnostics.php', [], 'Check BBB settings, meetings, tables, and recent audit rows.'],
        ['Recording Review', '/local/hubredirect/live_recordings_admin.php', [], 'Pull BBB recordings, review quality, publish safely, and track retention.'],
        ['Parent Recordings', '/local/hubredirect/live_recordings.php', [], 'Parent-visible recordings after review and publication.'],
        ['Lesson Monitor', '/local/hubredirect/live_teacher.php', [], 'Open from session cards to monitor students during BBB review.'],
        ['Attendance & Notes', '/local/hubredirect/live_teacher.php', [], 'Open from session cards to complete post-class records.'],
        ['Live Calendar', '/local/hubredirect/live_calendar.php', [], 'Calendar view for scheduled live classes.'],
        ['BBB Provider', 'https://biggerbluebutton.com/', [], 'External BBB service entry point.', true],
    ],
    'Moodle' => [
        ['Site Administration', '/admin/index.php', [], 'Moodle administration home.'],
        ['Admin Search', '/admin/search.php', [], 'Search Moodle settings.'],
        ['Scheduled Tasks', '/admin/tool/task/scheduledtasks.php', [], 'Review scheduled task status and timing.'],
        ['Pre-Quraan Settings', '/admin/settings.php', ['section' => 'local_prequran'], 'Plugin settings when available in this Moodle site.'],
        ['Student Intake Config', '/local/hubredirect/student_intake_config.php', [], 'Configure student intake options.'],
        ['Teacher Intake Config', '/local/hubredirect/teacher_intake_config.php', [], 'Configure teacher intake options.'],
        ['Account IDs', '/local/hubredirect/account_ids.php', [], 'Lookup Moodle user IDs and Pre-Quraan IDs.'],
        ['Lesson Router', '/local/hubredirect/issue.php', [], 'Primary lesson launch router.'],
        ['Child Lesson Router', '/local/hubredirect/issue_child.php', [], 'Managed child lesson launch router.'],
    ],
    'SQL' => [
        ['SQL Tools', '/local/hubredirect/sql_tools.php', [], 'QA configuration and non-production cleanup SQL helpers.'],
        ['Diagnostics', '/local/hubredirect/live_diagnostics.php', [], 'Table checks, BBB configuration, recent sessions, and audit data.'],
        ['Live Reports', '/local/hubredirect/live_reports.php', [], 'Report views that depend on live-session database records.'],
        ['Student Parent Links', '/local/hubredirect/live_parent_links.php', [], 'Guardian relationship report backed by communication consent, live consent, and profiles.'],
        ['Operations', '/local/hubredirect/live_ops.php', [], 'Operational queues backed by session, participant, recording, and audit tables.'],
        ['Add Live Focus Session ID SQL', '/local/hubredirect/sql_tools.php', [], 'Helper SQL file: local_prequran/sql/add_live_focus_sessionid.sql.'],
    ],
    'Other' => [
        ['Country Cities', '/local/hubredirect/country_cities.php', [], 'Country and city helper data.'],
        ['Country Timezones', '/local/hubredirect/country_timezones.php', [], 'Timezone helper data.'],
        ['Create Mock Students', '/local/hubredirect/create_mock_students.php', [], 'Testing helper for student accounts.'],
        ['Create Mock Teachers', '/local/hubredirect/create_mock_teachers.php', [], 'Testing helper for teacher accounts.'],
        ['Create Test Teachers', '/local/hubredirect/create_test_teachers.php', [], 'Testing helper for teacher setup.'],
        ['Parent Trust Audit', '/local/hubredirect/live_parent_trust_audit.php', [], 'Support access review, reasons, cases, and audit.'],
        ['Student Parent Links', '/local/hubredirect/live_parent_links.php', [], 'Relationship report for students and linked guardians.'],
        ['Retention Policy', '/local/hubredirect/live_parent_trust_retention.php', [], 'Retention settings, approval, purge readiness, and safeguards.'],
        ['Review Pack', '/local/hubredirect/live_parent_trust_review_pack.php', [], 'Compliance evidence and parent trust export pack.'],
        ['Purge Evidence', '/local/hubredirect/live_parent_trust_purge_evidence.php', [], 'Retention purge evidence and review support.'],
        ['Follow-Up Message', '/local/hubredirect/live_followup_message.php', [], 'Contextual follow-up message view; normally opened from follow-ups.'],
    ],
];

echo $OUTPUT->header();
?>
<style>
body.pqh-master-dashboard-page header,
body.pqh-master-dashboard-page footer,
body.pqh-master-dashboard-page nav.navbar,
body.pqh-master-dashboard-page #page-header,
body.pqh-master-dashboard-page #page-footer,
body.pqh-master-dashboard-page .drawer,
body.pqh-master-dashboard-page .drawer-toggles,
body.pqh-master-dashboard-page .block-region,
body.pqh-master-dashboard-page [data-region="drawer"],
body.pqh-master-dashboard-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-master-dashboard-page #page,
body.pqh-master-dashboard-page #page-content,
body.pqh-master-dashboard-page #region-main,
body.pqh-master-dashboard-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqmd-shell{min-height:100vh;padding:28px 18px 56px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqmd-wrap{max-width:1280px;margin:0 auto}
.pqmd-top{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;margin-bottom:16px;padding:22px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqmd-title{margin:0;color:#221b22;font-size:32px;line-height:1.1;font-weight:950}
.pqmd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}
.pqmd-actions{display:flex;flex-wrap:wrap;gap:9px;justify-content:flex-end}
.pqmd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 13px;border-radius:8px;border:1px solid rgba(23,48,68,.12);background:#eef4f6;color:#173044!important;text-decoration:none!important;font-size:13px;font-weight:950}
.pqmd-btn--primary{background:#2f6f4e;border-color:#2f6f4e;color:#fff!important}
.pqmd-tools{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:16px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}
.pqmd-search{width:100%;min-height:44px;padding:0 13px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:14px;font-weight:800}
.pqmd-count{color:#5e7280;font-size:13px;font-weight:900}
.pqmd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqmd-section{padding:17px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}
.pqmd-section h2{margin:0 0 12px;color:#221b22;font-size:21px;font-weight:950}
.pqmd-links{display:grid;gap:9px}
.pqmd-link{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff;color:#173044!important;text-decoration:none!important}
.pqmd-link:hover{border-color:rgba(47,111,78,.45);background:#f7fbf8}
.pqmd-link strong{display:block;color:#173044;font-size:14px;font-weight:950}
.pqmd-link em{display:block;margin-top:4px;color:#5e7280;font-size:12px;font-style:normal;font-weight:800}
.pqmd-pill{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;white-space:nowrap}
.pqmd-pill--ready{background:#edf9ef;color:#245c35}
.pqmd-pill--missing{background:#fff0ed;color:#883526}
.pqmd-pill--external{background:#eff4ff;color:#264a88}
.pqmd-empty{display:none;margin:0;padding:18px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#5e7280;font-weight:900}
@media(max-width:920px){.pqmd-top,.pqmd-tools{grid-template-columns:1fr}.pqmd-actions{justify-content:flex-start}.pqmd-grid{grid-template-columns:1fr}}
@media(max-width:560px){.pqmd-shell{padding:18px 12px 42px}.pqmd-title{font-size:25px}.pqmd-link{grid-template-columns:1fr}.pqmd-btn{width:100%}}
</style>
<main class="pqmd-shell">
  <div class="pqmd-wrap">
    <section class="pqmd-top">
      <div>
        <h1 class="pqmd-title">Master Dashboard</h1>
        <p class="pqmd-sub">All major Quraan Academy links categorized by administrators, teachers, students, parents, BBB, Moodle, SQL, and other tools.</p>
      </div>
      <nav class="pqmd-actions" aria-label="Primary links">
        <a class="pqmd-btn pqmd-btn--primary" href="<?php echo pqmd_url('/local/hubredirect/dashboard.php'); ?>">Dashboard</a>
        <a class="pqmd-btn" href="<?php echo pqmd_url('/local/hubredirect/live_admin.php'); ?>">Live Admin Menu</a>
        <a class="pqmd-btn" href="<?php echo pqmd_url('/local/hubredirect/live_sessions.php'); ?>">Live Sessions</a>
        <a class="pqmd-btn" href="<?php echo pqmd_url('/local/hubredirect/sql_tools.php'); ?>">SQL Tools</a>
      </nav>
    </section>

    <section class="pqmd-tools" aria-label="Dashboard search">
      <label class="sr-only" for="pqmd-search">Search links</label>
      <input id="pqmd-search" class="pqmd-search" type="search" placeholder="Search links, categories, or descriptions" autocomplete="off">
      <span id="pqmd-count" class="pqmd-count"></span>
    </section>

    <p id="pqmd-empty" class="pqmd-empty">No matching links found.</p>

    <section class="pqmd-grid" aria-label="Master dashboard categories">
      <?php foreach ($categories as $category => $links): ?>
        <article class="pqmd-section" data-category="<?php echo s(strtolower($category)); ?>">
          <h2><?php echo s($category); ?></h2>
          <div class="pqmd-links">
            <?php foreach ($links as $entry): ?>
              <?php
                [$label, $path, $params, $description] = $entry;
                $external = !empty($entry[4]);
                $status = pqmd_status($path, $external);
                $searchtext = strtolower($category . ' ' . $label . ' ' . $description . ' ' . $path);
              ?>
              <a class="pqmd-link" href="<?php echo pqmd_url($path, $params, $external); ?>" data-search="<?php echo s($searchtext); ?>">
                <span><strong><?php echo s($label); ?></strong><em><?php echo s($description); ?></em></span>
                <span class="pqmd-pill pqmd-pill--<?php echo s($status); ?>"><?php echo s($status); ?></span>
              </a>
            <?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </section>
  </div>
</main>
<script>
(function() {
  var input = document.getElementById('pqmd-search');
  var count = document.getElementById('pqmd-count');
  var empty = document.getElementById('pqmd-empty');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.pqmd-section'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.pqmd-link'));
  function update() {
    var query = (input.value || '').toLowerCase().trim();
    var visible = 0;
    sections.forEach(function(section) {
      var sectionVisible = 0;
      Array.prototype.slice.call(section.querySelectorAll('.pqmd-link')).forEach(function(link) {
        var match = !query || (link.getAttribute('data-search') || '').indexOf(query) !== -1;
        link.style.display = match ? '' : 'none';
        if (match) {
          visible += 1;
          sectionVisible += 1;
        }
      });
      section.style.display = sectionVisible ? '' : 'none';
    });
    count.textContent = visible + ' of ' + links.length + ' links';
    empty.style.display = visible ? 'none' : 'block';
  }
  input.addEventListener('input', update);
  update();
})();
</script>
<?php
echo $OUTPUT->footer();
