<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

require_login();

$consumercontext = pqh_requested_consumer_context();
$consumerparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $consumerparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}

if (!is_siteadmin((int)$USER->id)) {
    $returnpath = (string)($consumercontext->defaultdashboardpath ?? '');
    if ($returnpath === '') {
        $returnpath = !empty($consumerparams['workspaceid'])
            ? '/local/hubredirect/workspace_dashboard.php'
            : '/local/hubredirect/role_redirect.php';
    }
    pqh_access_denied(
        'Only platform site administrators can view the master dashboard.',
        new moodle_url($returnpath, $consumerparams),
        'Master dashboard access required'
    );
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/master_dashboard.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Master Dashboard');
$PAGE->set_heading('Master Dashboard');
$PAGE->add_body_class('pqh-master-dashboard-page');

function pqh_master_status(string $path, bool $external = false): string {
    global $CFG;
    if ($external) {
        return 'external';
    }
    return file_exists($CFG->dirroot . $path) ? 'ready' : 'missing';
}

function pqh_master_url(string $path, array $params = [], bool $external = false): string {
    if ($external) {
        return $path;
    }
    return (new moodle_url($path, $params))->out(false);
}

$links = [
    'EduPlatform Foundation' => [
        ['EduPlatform landing', '/local/hubredirect/platform_landing.php', [], 'Foundation public landing page.'],
        ['Platform dashboard', '/local/hubredirect/platform_dashboard.php', [], 'Platform owner dashboard.'],
        ['Consumer manager', '/local/hubredirect/platform_consumers.php', [], 'Manage consumers, domains, workspaces, and status.'],
        ['Onboard institution', '/local/hubredirect/platform_onboard_consumer.php', ['type' => 'institution'], 'Guided institution setup.'],
        ['Platform settings', '/local/hubredirect/platform_settings.php', [], 'Foundation branding and route defaults.'],
        ['Foundation diagnostics', '/local/hubredirect/eduplatform_diagnostics.php', [], 'Host, consumer, domain, workspace, and route checks.'],
    ],
    'Consumers' => [
        ['Quraan Academy public page', '/local/ehelhome/index.php', ['consumer' => 'quraan-academy'], 'Quraan Academy consumer landing page.'],
        ['Quraan Academy dashboard', '/local/hubredirect/dashboard.php', ['consumer' => 'quraan-academy'], 'Quraan Academy consumer dashboard.'],
        ['Huda-school landing', '/local/hubredirect/consumer_landing.php', ['consumer' => 'huda-school', 'workspaceid' => 3], 'Institution landing page.'],
        ['Huda-school workspace', '/local/hubredirect/workspace_dashboard.php', ['consumer' => 'huda-school', 'workspaceid' => 3], 'Institution workspace dashboard.'],
        ['EduForTomorrow marketplace', '/local/hubredirect/teacher_marketplace.php', ['consumer' => 'edu-for-tomorrow'], 'Public teacher marketplace.'],
        ['EduForTomorrow admin', '/local/hubredirect/teacher_marketplace_admin.php', ['consumer' => 'edu-for-tomorrow'], 'Marketplace operations queue.'],
    ],
    'Workspace Operations' => [
        ['Workspace dashboard', '/local/hubredirect/workspace_dashboard.php', $consumerparams, 'Workspace scoped dashboard.'],
        ['People and assignments', '/local/hubredirect/workspace_people.php', $consumerparams, 'Invite, link, and assign students, parents, teachers, and admins.'],
        ['Workspace reports', '/local/hubredirect/workspace_reports.php', $consumerparams, 'Institution reports and validation data.'],
        ['Workspace materials', '/local/hubredirect/workspace_materials.php', $consumerparams, 'Upload, assign, open, and review materials.'],
        ['Student intake', '/local/hubredirect/student_intake.php', $consumerparams, 'Create or link student and parent accounts.'],
        ['Teacher onboarding', '/local/hubredirect/teacher_intake.php', $consumerparams, 'Create or link teacher accounts.'],
    ],
    'Live Sessions' => [
        ['Live admin menu', '/local/hubredirect/live_admin.php', $consumerparams, 'Live operations hub.'],
        ['Live sessions', '/local/hubredirect/live_sessions.php', $consumerparams, 'Create, start, join, and review live sessions.'],
        ['Teacher workspace', '/local/hubredirect/live_teacher.php', $consumerparams, 'Teacher class day workflow.'],
        ['Recurring series', '/local/hubredirect/live_series.php', $consumerparams, 'Recurring schedule management.'],
        ['Recordings admin', '/local/hubredirect/live_recordings_admin.php', $consumerparams, 'Review, publish, and retain recordings.'],
        ['Quality analytics', '/local/hubredirect/live_quality_analytics.php', $consumerparams, 'Quality review summaries and coaching data.'],
        ['Parent trust center', '/local/hubredirect/live_trust.php', $consumerparams, 'Parent-facing live safety and visibility.'],
    ],
    'Intake and Marketplace' => [
        ['Student intake queue', '/local/hubredirect/intake_requests.php', $consumerparams, 'Review student public intake requests.'],
        ['Teacher intake queue', '/local/hubredirect/teacher_intake_requests.php', $consumerparams, 'Review teacher public intake requests.'],
        ['Teacher marketplace admin', '/local/hubredirect/teacher_marketplace_admin.php', $consumerparams, 'Publish profiles and review parent requests.'],
        ['Teacher marketplace profile', '/local/hubredirect/teacher_marketplace_profile.php', $consumerparams, 'Teacher public profile flow.'],
        ['Enrollment approval', '/local/hubredirect/enrollment_approval.php', $consumerparams, 'Approve student and parent enrollment.'],
        ['Institution public profile', '/local/hubredirect/consumer_profile.php', $consumerparams, 'Public consumer profile and inquiry path.'],
    ],
    'Diagnostics' => [
        ['Consumer probe', '/local/hubredirect/consumer_probe.php', [], 'Public host resolution probe.'],
        ['Consumer diagnostics', '/local/hubredirect/consumer_diagnostics.php', [], 'Read-only multi-consumer resolver checks.'],
        ['Final test matrix', '/local/hubredirect/final_test_matrix.php', [], 'Production test matrix for major domains.'],
        ['Live diagnostics', '/local/hubredirect/live_diagnostics.php', $consumerparams, 'Live table and BBB readiness checks.'],
        ['Course debug', '/local/hubredirect/course_debug.php', $consumerparams, 'Course launch/debug support.'],
        ['Access denied page', '/local/hubredirect/access_denied.php', $consumerparams, 'Branded access page preview.'],
    ],
    'Moodle Admin' => [
        ['Site administration', '/admin/index.php', [], 'Moodle administration home.'],
        ['Admin search', '/admin/search.php', [], 'Search Moodle settings.'],
        ['Scheduled tasks', '/admin/tool/task/scheduledtasks.php', [], 'Review scheduled task status.'],
        ['Plugin settings', '/admin/settings.php', ['section' => 'local_prequran'], 'Local Pre-Quraan settings.'],
        ['Account IDs', '/local/hubredirect/account_ids.php', [], 'Lookup Moodle user IDs and Pre-Quraan IDs.'],
        ['SQL tools', '/local/hubredirect/sql_tools.php', [], 'Read-only and maintenance SQL helpers.'],
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
.pqm-shell{min-height:100vh;padding:30px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqm-wrap{max-width:1260px;margin:0 auto}
.pqm-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;margin-bottom:16px;padding:22px;border:1px solid rgba(23,48,68,.12);border-radius:14px;background:linear-gradient(135deg,#eaffea 0%,#fff 58%,#fff7e7 100%);box-shadow:0 16px 38px rgba(23,48,68,.08)}
.pqm-title{margin:0;color:#221b22;font-size:36px;line-height:1.1;font-weight:950}
.pqm-sub{margin:8px 0 0;color:#5e7280;font-size:15px;line-height:1.45;font-weight:800}
.pqm-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.pqm-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border:1px solid rgba(23,48,68,.13);border-radius:10px;background:#eef7ee;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950;box-shadow:0 2px 0 rgba(23,48,68,.04)}
.pqm-btn--gold{background:#d6a642;border-color:#d6a642;color:#221b22!important}
.pqm-tools{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:16px;padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:12px;background:#fff}
.pqm-search{width:100%;min-height:44px;padding:0 13px;border:1px solid rgba(23,48,68,.18);border-radius:10px;background:#fbfdff;color:#173044;font-size:14px;font-weight:800}
.pqm-count{color:#5e7280;font-size:13px;font-weight:900}
.pqm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqm-section{padding:17px;border:1px solid rgba(23,48,68,.12);border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}
.pqm-section h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950}
.pqm-links{display:grid;gap:9px}
.pqm-link{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:10px;background:#fbfdff;color:#173044!important;text-decoration:none!important}
.pqm-link:hover{border-color:rgba(47,111,78,.45);background:#f7fbf8}
.pqm-link strong{display:block;color:#173044;font-size:14px;font-weight:950}
.pqm-link em{display:block;margin-top:4px;color:#5e7280;font-size:12px;line-height:1.35;font-style:normal;font-weight:800}
.pqm-pill{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950;white-space:nowrap}
.pqm-pill--ready{background:#edf9ef;color:#245c35}
.pqm-pill--missing{background:#fff0ed;color:#883526}
.pqm-pill--external{background:#eff4ff;color:#264a88}
.pqm-empty{display:none;margin:0;padding:18px;border:1px dashed rgba(23,48,68,.24);border-radius:10px;background:#fff;color:#5e7280;font-weight:900}
@media(max-width:900px){.pqm-top,.pqm-tools{grid-template-columns:1fr}.pqm-actions{justify-content:flex-start}.pqm-grid{grid-template-columns:1fr}.pqm-title{font-size:30px}}
@media(max-width:560px){.pqm-shell{padding:20px 12px 42px}.pqm-link{grid-template-columns:1fr}.pqm-btn{width:100%}}
</style>
<main class="pqm-shell">
  <div class="pqm-wrap">
    <section class="pqm-top">
      <div>
        <h1 class="pqm-title">Master Dashboard</h1>
        <p class="pqm-sub">Platform-only directory for EduPlatform, consumers, workspaces, live-session operations, diagnostics, and Moodle administration.</p>
      </div>
      <nav class="pqm-actions" aria-label="Primary links">
        <a class="pqm-btn pqm-btn--gold" href="<?php echo pqh_master_url('/local/hubredirect/platform_consumers.php'); ?>">Platform consumers</a>
        <a class="pqm-btn" href="<?php echo pqh_master_url('/local/hubredirect/platform_landing.php'); ?>">EduPlatform</a>
        <a class="pqm-btn" href="<?php echo pqh_master_url('/local/hubredirect/role_redirect.php'); ?>">Role redirect</a>
        <a class="pqm-btn" href="<?php echo pqh_master_url('/local/hubredirect/logout.php'); ?>">Logout</a>
      </nav>
    </section>

    <section class="pqm-tools" aria-label="Dashboard search">
      <label class="sr-only" for="pqm-search">Search links</label>
      <input id="pqm-search" class="pqm-search" type="search" placeholder="Search links, categories, or descriptions" autocomplete="off">
      <span id="pqm-count" class="pqm-count"></span>
    </section>

    <p id="pqm-empty" class="pqm-empty">No matching links found.</p>

    <section class="pqm-grid" aria-label="Master dashboard categories">
      <?php foreach ($links as $category => $entries): ?>
        <article class="pqm-section">
          <h2><?php echo s($category); ?></h2>
          <div class="pqm-links">
            <?php foreach ($entries as $entry): ?>
              <?php
                [$label, $path, $params, $description] = $entry;
                $external = !empty($entry[4]);
                $status = pqh_master_status($path, $external);
                $searchtext = strtolower($category . ' ' . $label . ' ' . $description . ' ' . $path);
              ?>
              <a class="pqm-link" href="<?php echo pqh_master_url($path, $params, $external); ?>" data-search="<?php echo s($searchtext); ?>">
                <span><strong><?php echo s($label); ?></strong><em><?php echo s($description); ?></em></span>
                <span class="pqm-pill pqm-pill--<?php echo s($status); ?>"><?php echo s($status); ?></span>
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
  var input = document.getElementById('pqm-search');
  var count = document.getElementById('pqm-count');
  var empty = document.getElementById('pqm-empty');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.pqm-section'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.pqm-link'));
  function update() {
    var query = (input.value || '').toLowerCase().trim();
    var visible = 0;
    sections.forEach(function(section) {
      var sectionVisible = 0;
      Array.prototype.slice.call(section.querySelectorAll('.pqm-link')).forEach(function(link) {
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
