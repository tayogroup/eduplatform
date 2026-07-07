<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_platform_operations('Only platform administrators can open the EduPlatform dashboard.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_dashboard.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('EduPlatform Dashboard');
$PAGE->set_heading('EduPlatform Dashboard');
$PAGE->add_body_class('pqpd-page');

function pqpd_consumer_type_label(string $type): string {
    $labels = [
        'platform_foundation' => 'Foundation',
        'academy_consumer' => 'Academies',
        'institution' => 'Institutions',
        'marketplace' => 'Marketplaces',
        'teacher_workspace' => 'Teacher workspaces',
    ];
    return $labels[$type] ?? ucwords(str_replace('_', ' ', $type !== '' ? $type : 'consumer'));
}

function pqpd_status_class(string $status): string {
    return preg_replace('/[^a-z0-9_-]/i', '', strtolower($status !== '' ? $status : 'unknown'));
}

function pqpd_consumer_rows(): array {
    global $DB;
    if (!pqh_consumer_schema_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT c.id, c.slug, c.name, c.consumer_type, c.status, c.primaryworkspaceid, c.supportemail,
                c.defaultpublicpath, c.defaultdashboardpath,
                w.name AS workspacename, w.slug AS workspaceslug, w.status AS workspacestatus, w.workspace_type,
                COUNT(d.id) AS domaincount,
                SUM(CASE WHEN d.status = 'active' THEN 1 ELSE 0 END) AS activedomains
           FROM {local_prequran_consumer} c
      LEFT JOIN {local_prequran_workspace} w ON w.id = c.primaryworkspaceid
      LEFT JOIN {local_prequran_consumer_domain} d ON d.consumerid = c.id
       GROUP BY c.id, c.slug, c.name, c.consumer_type, c.status, c.primaryworkspaceid, c.supportemail,
                c.defaultpublicpath, c.defaultdashboardpath, w.name, w.slug, w.status, w.workspace_type
       ORDER BY c.consumer_type ASC, c.name ASC"
    ));
}

function pqpd_domain_rows(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer_domain') || !pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT d.id, d.domain, d.domain_type, d.status, d.sslstatus, d.verificationstatus, d.isprimary,
                c.slug AS consumerslug, c.name AS consumername, c.consumer_type
           FROM {local_prequran_consumer_domain} d
           JOIN {local_prequran_consumer} c ON c.id = d.consumerid
       ORDER BY d.status ASC, d.isprimary DESC, d.domain ASC"
    ));
}

$consumers = pqpd_consumer_rows();
$domains = pqpd_domain_rows();
$grouped = [];
$stats = [
    'consumers' => 0,
    'activeconsumers' => 0,
    'workspaces' => 0,
    'missingworkspaces' => 0,
    'domains' => count($domains),
];

foreach ($consumers as $consumer) {
    $type = (string)($consumer->consumer_type ?? '');
    $grouped[$type][] = $consumer;
    if ($type !== 'platform_foundation') {
        $stats['consumers']++;
        if ((string)$consumer->status === 'active') {
            $stats['activeconsumers']++;
        }
        if ((int)$consumer->primaryworkspaceid <= 0) {
            $stats['missingworkspaces']++;
        }
    }
    if ((int)$consumer->primaryworkspaceid > 0) {
        $stats['workspaces']++;
    }
}
ksort($grouped);

$consumeradminurl = new moodle_url('/local/hubredirect/platform_consumers.php');
$onboardingurl = new moodle_url('/local/hubredirect/institution_onboarding.php');
$diagnosticsurl = new moodle_url('/local/hubredirect/consumer_diagnostics.php');
$landingurl = new moodle_url('/local/hubredirect/platform_landing.php');
$settingsurl = new moodle_url('/local/hubredirect/platform_settings.php');
$rosterurl = new moodle_url('/local/hubredirect/platform_user_roster.php');
$courserosterurl = new moodle_url('/local/hubredirect/platform_course_roster.php');

echo $OUTPUT->header();
?>
<style>
body.pqpd-page header,body.pqpd-page footer,body.pqpd-page nav.navbar,body.pqpd-page #page-header,body.pqpd-page #page-footer,body.pqpd-page .drawer,body.pqpd-page .drawer-toggles,body.pqpd-page .block-region,body.pqpd-page [data-region="drawer"],body.pqpd-page [data-region="right-hand-drawer"]{display:none!important}
body.pqpd-page #page,body.pqpd-page #page-content,body.pqpd-page #region-main,body.pqpd-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpd-shell{min-height:100vh;padding:28px 18px 58px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqpd-wrap{max-width:1240px;margin:0 auto}.pqpd-top,.pqpd-card,.pqpd-panel{border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqpd-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#eaffea 0%,#fff 62%,#fff7e7 100%)}.pqpd-brand{display:flex;align-items:center;gap:12px}.pqpd-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:#2f6f4e;color:#fff;font-weight:950}.pqpd-title{margin:0;color:#221b22;font-size:32px;line-height:1.05;font-weight:950}.pqpd-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqpd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqpd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:12px;font-weight:950}.pqpd-btn--gold{background:#d6a642;border-color:#d6a642;color:#211b12!important}.pqpd-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}.pqpd-card{padding:15px}.pqpd-num{display:block;color:#221b22;font-size:30px;line-height:1;font-weight:950}.pqpd-label{display:block;margin-top:6px;color:#60707d;font-size:12px;font-weight:900;text-transform:uppercase}.pqpd-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:14px}.pqpd-panel{padding:16px;margin-bottom:14px}.pqpd-panel h2{margin:0 0 10px;color:#221b22;font-size:21px;font-weight:950}.pqpd-group{display:grid;gap:9px}.pqpd-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff}.pqpd-name{display:block;color:#221b22;font-size:16px;font-weight:950}.pqpd-meta{display:block;margin-top:4px;color:#667886;font-size:12px;font-weight:800}.pqpd-pills{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.pqpd-pill{display:inline-flex;min-height:24px;align-items:center;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:11px;font-weight:950}.pqpd-pill--active{background:#eaf8ed;color:#2d6339}.pqpd-pill--paused,.pqpd-pill--pending,.pqpd-pill--not_checked{background:#fff4d9;color:#6d4d21}.pqpd-pill--archived,.pqpd-pill--disabled,.pqpd-pill--missing{background:#fff0ed;color:#883526}.pqpd-domain{display:grid;gap:4px;padding:10px 0;border-bottom:1px solid rgba(23,48,68,.1)}.pqpd-domain:last-child{border-bottom:0}.pqpd-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}
@media(max-width:980px){.pqpd-top,.pqpd-layout,.pqpd-row{grid-template-columns:1fr}.pqpd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pqpd-actions,.pqpd-pills{justify-content:flex-start}}@media(max-width:560px){.pqpd-stats{grid-template-columns:1fr}.pqpd-title{font-size:26px}}
</style>
<main class="pqpd-shell">
  <div class="pqpd-wrap">
    <section class="pqpd-top">
      <div class="pqpd-brand">
        <span class="pqpd-mark">EP</span>
        <div>
          <h1 class="pqpd-title">EduPlatform Dashboard</h1>
          <p class="pqpd-sub">Foundation overview for consumers, custom domains, workspaces, and operational readiness.</p>
        </div>
      </div>
      <nav class="pqpd-actions">
        <a class="pqpd-btn" href="<?php echo $landingurl->out(false); ?>">Public landing</a>
        <a class="pqpd-btn" href="<?php echo $settingsurl->out(false); ?>">Settings</a>
        <a class="pqpd-btn" href="<?php echo $rosterurl->out(false); ?>">User roster</a>
        <a class="pqpd-btn" href="<?php echo $courserosterurl->out(false); ?>">Course roster</a>
        <a class="pqpd-btn pqpd-btn--gold" href="<?php echo $consumeradminurl->out(false); ?>">Manage consumers</a>
        <a class="pqpd-btn" href="<?php echo $onboardingurl->out(false); ?>">Onboard institution</a>
        <a class="pqpd-btn" href="<?php echo $diagnosticsurl->out(false); ?>">Diagnostics</a>
      </nav>
    </section>

    <section class="pqpd-stats" aria-label="Platform summary">
      <div class="pqpd-card"><span class="pqpd-num"><?php echo (int)$stats['consumers']; ?></span><span class="pqpd-label">consumer apps</span></div>
      <div class="pqpd-card"><span class="pqpd-num"><?php echo (int)$stats['activeconsumers']; ?></span><span class="pqpd-label">active consumers</span></div>
      <div class="pqpd-card"><span class="pqpd-num"><?php echo (int)$stats['workspaces']; ?></span><span class="pqpd-label">linked workspaces</span></div>
      <div class="pqpd-card"><span class="pqpd-num"><?php echo (int)$stats['domains']; ?></span><span class="pqpd-label">custom domains</span></div>
      <div class="pqpd-card"><span class="pqpd-num"><?php echo (int)$stats['missingworkspaces']; ?></span><span class="pqpd-label">missing workspace</span></div>
    </section>

    <div class="pqpd-layout">
      <section>
        <?php if (!$grouped): ?>
          <div class="pqpd-empty">Consumer schema is not ready yet.</div>
        <?php else: ?>
          <?php foreach ($grouped as $type => $rows): ?>
            <article class="pqpd-panel">
              <h2><?php echo s(pqpd_consumer_type_label((string)$type)); ?></h2>
              <div class="pqpd-group">
                <?php foreach ($rows as $consumer): ?>
                  <?php
                  $workspaceid = (int)$consumer->primaryworkspaceid;
                  $workspaceclass = $workspaceid > 0 ? pqpd_status_class((string)($consumer->workspacestatus ?? 'missing')) : 'missing';
                  $params = ['consumer' => (string)$consumer->slug];
                  if ($workspaceid > 0) {
                      $params['workspaceid'] = $workspaceid;
                  }
                  ?>
                  <div class="pqpd-row">
                    <div>
                      <span class="pqpd-name"><?php echo s((string)$consumer->name); ?></span>
                      <span class="pqpd-meta"><?php echo s((string)$consumer->slug); ?> - <?php echo s((string)$consumer->supportemail); ?></span>
                      <span class="pqpd-meta">Workspace: <?php echo $workspaceid > 0 ? s((string)$consumer->workspacename) . ' #' . $workspaceid : 'missing'; ?></span>
                    </div>
                    <div class="pqpd-pills">
                      <span class="pqpd-pill pqpd-pill--<?php echo s(pqpd_status_class((string)$consumer->status)); ?>"><?php echo s((string)$consumer->status); ?></span>
                      <span class="pqpd-pill pqpd-pill--<?php echo s($workspaceclass); ?>">workspace <?php echo $workspaceid > 0 ? s((string)$consumer->workspacestatus) : 'missing'; ?></span>
                      <span class="pqpd-pill"><?php echo (int)$consumer->domaincount; ?> domains</span>
                      <?php if ((string)$consumer->consumer_type === 'platform_foundation'): ?>
                        <a class="pqpd-btn" href="<?php echo $settingsurl->out(false); ?>">Settings</a>
                        <a class="pqpd-btn" href="<?php echo $landingurl->out(false); ?>">Landing</a>
                        <a class="pqpd-btn" href="<?php echo $diagnosticsurl->out(false); ?>">Diagnostics</a>
                      <?php else: ?>
                        <a class="pqpd-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_consumers.php', ['focus' => (string)$consumer->slug]))->out(false); ?>">Manage</a>
                      <?php endif; ?>
                      <?php if ($workspaceid > 0): ?>
                        <a class="pqpd-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $params))->out(false); ?>">Workspace</a>
                      <?php endif; ?>
                    </div>
                  </div>
                <?php endforeach; ?>
              </div>
            </article>
          <?php endforeach; ?>
        <?php endif; ?>
      </section>

      <aside>
        <section class="pqpd-panel">
          <h2>Domain Readiness</h2>
          <?php if (!$domains): ?>
            <div class="pqpd-empty">No custom domains found.</div>
          <?php else: ?>
            <?php foreach (array_slice($domains, 0, 12) as $domain): ?>
              <div class="pqpd-domain">
                <strong><?php echo s((string)$domain->domain); ?></strong>
                <span class="pqpd-meta"><?php echo s((string)$domain->consumername); ?> - <?php echo s((string)$domain->domain_type); ?><?php echo (int)$domain->isprimary === 1 ? ' - primary' : ''; ?></span>
                <span>
                  <span class="pqpd-pill pqpd-pill--<?php echo s(pqpd_status_class((string)$domain->status)); ?>"><?php echo s((string)$domain->status); ?></span>
                  <span class="pqpd-pill pqpd-pill--<?php echo s(pqpd_status_class((string)$domain->sslstatus)); ?>">SSL <?php echo s((string)$domain->sslstatus); ?></span>
                  <span class="pqpd-pill pqpd-pill--<?php echo s(pqpd_status_class((string)$domain->verificationstatus)); ?>"><?php echo s((string)$domain->verificationstatus); ?></span>
                </span>
              </div>
            <?php endforeach; ?>
          <?php endif; ?>
        </section>
        <section class="pqpd-panel">
          <h2>Next Actions</h2>
          <div class="pqpd-group">
            <a class="pqpd-btn pqpd-btn--gold" href="<?php echo $consumeradminurl->out(false); ?>">Review consumer domains</a>
            <a class="pqpd-btn" href="<?php echo $rosterurl->out(false); ?>">Open user roster</a>
            <a class="pqpd-btn" href="<?php echo $courserosterurl->out(false); ?>">Open course roster</a>
            <a class="pqpd-btn" href="<?php echo $onboardingurl->out(false); ?>">Create institution workspace</a>
            <a class="pqpd-btn" href="<?php echo (new moodle_url('/local/hubredirect/institution_test_matrix.php'))->out(false); ?>">Open test matrix</a>
            <a class="pqpd-btn" href="<?php echo $diagnosticsurl->out(false); ?>">Run diagnostics</a>
          </div>
        </section>
      </aside>
    </div>
  </div>
</main>
<?php
echo $OUTPUT->footer();
