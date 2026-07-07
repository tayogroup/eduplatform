<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$context = pqh_current_consumer_context();
$consumer_type = (string)($context->consumer_type ?? '');
if ($consumer_type !== 'platform_foundation' && !empty($context->trusted_domain)) {
    $params = ['consumer' => (string)$context->consumerslug];
    if ((int)($context->workspaceid ?? 0) > 0) {
        $params['workspaceid'] = (int)$context->workspaceid;
    }
    redirect(new moodle_url('/local/hubredirect/consumer_landing.php', $params));
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/platform_landing.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('EduPlatform');
$PAGE->set_heading('EduPlatform');
$PAGE->add_body_class('pqh-platform-landing-page');

$isplatformadmin = isloggedin() && !isguestuser() && pqh_can_manage_academy_operations((int)$USER->id);
$loginurl = new moodle_url('/local/hubredirect/platform_login.php');
$adminurl = new moodle_url('/local/hubredirect/platform_dashboard.php');
$consumeradminurl = new moodle_url('/local/hubredirect/platform_consumers.php');
$settingsurl = new moodle_url('/local/hubredirect/platform_settings.php');
$diagnosticsurl = new moodle_url('/local/hubredirect/consumer_diagnostics.php');

echo $OUTPUT->header();
?>
<style>
body.pqh-platform-landing-page header,
body.pqh-platform-landing-page footer,
body.pqh-platform-landing-page nav.navbar,
body.pqh-platform-landing-page #page-header,
body.pqh-platform-landing-page #page-footer,
body.pqh-platform-landing-page .drawer,
body.pqh-platform-landing-page .drawer-toggles,
body.pqh-platform-landing-page .block-region,
body.pqh-platform-landing-page [data-region="drawer"],
body.pqh-platform-landing-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-platform-landing-page #page,
body.pqh-platform-landing-page #page-content,
body.pqh-platform-landing-page #region-main,
body.pqh-platform-landing-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqpl-shell{min-height:100vh;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqpl-wrap{max-width:1160px;margin:0 auto;padding:34px 18px 64px}
.pqpl-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:28px}
.pqpl-brand{display:flex;align-items:center;gap:12px;font-weight:950;color:#221b22;text-decoration:none}
.pqpl-mark{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:#2f6f4e;color:#fff;font-weight:950}
.pqpl-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.pqpl-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border:1px solid rgba(23,48,68,.14);border-radius:10px;background:#eef7ee;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950;box-shadow:0 2px 0 rgba(23,48,68,.04)}
.pqpl-btn--gold{background:#d6a642;border-color:#d6a642;color:#221b22!important}
.pqpl-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:24px;align-items:stretch;padding:28px;border:1px solid rgba(47,111,78,.14);border-radius:16px;background:linear-gradient(135deg,#eaffea 0%,#fff 58%,#fff7e7 100%);box-shadow:0 18px 44px rgba(23,48,68,.08)}
.pqpl-kicker{display:inline-flex;min-height:28px;align-items:center;padding:0 11px;border-radius:999px;background:rgba(214,166,66,.18);color:#6d4d21;font-size:12px;font-weight:950;text-transform:uppercase}
.pqpl-title{margin:18px 0 12px;color:#221b22;font-size:54px;line-height:1.02;font-weight:950;letter-spacing:0}
.pqpl-copy{max-width:720px;margin:0;color:#526977;font-size:18px;line-height:1.55;font-weight:750}
.pqpl-panel{padding:20px;border:1px solid rgba(23,48,68,.12);border-radius:12px;background:#fff;box-shadow:0 14px 34px rgba(23,48,68,.08)}
.pqpl-panel h2{margin:0 0 10px;color:#221b22;font-size:22px;font-weight:950}
.pqpl-panel p{margin:0 0 14px;color:#5e7280;font-size:14px;line-height:1.5;font-weight:800}
.pqpl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:18px}
.pqpl-card{padding:17px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqpl-card h3{margin:0 0 8px;color:#221b22;font-size:17px;font-weight:950}
.pqpl-card p{margin:0;color:#5e7280;font-size:13px;line-height:1.45;font-weight:750}
@media(max-width:900px){.pqpl-hero,.pqpl-grid{grid-template-columns:1fr}.pqpl-title{font-size:42px}.pqpl-nav{align-items:flex-start;flex-direction:column}.pqpl-actions{justify-content:flex-start}}
</style>
<main class="pqpl-shell">
  <div class="pqpl-wrap">
    <nav class="pqpl-nav" aria-label="EduPlatform">
      <a class="pqpl-brand" href="<?php echo (new moodle_url('/local/hubredirect/platform_landing.php'))->out(false); ?>">
        <span class="pqpl-mark">EP</span>
        <span>EduPlatform</span>
      </a>
      <div class="pqpl-actions">
        <?php if ($isplatformadmin): ?>
          <a class="pqpl-btn" href="<?php echo $adminurl->out(false); ?>">Dashboard</a>
          <a class="pqpl-btn" href="<?php echo $consumeradminurl->out(false); ?>">Consumer admin</a>
          <a class="pqpl-btn" href="<?php echo $settingsurl->out(false); ?>">Settings</a>
          <a class="pqpl-btn" href="<?php echo $diagnosticsurl->out(false); ?>">Diagnostics</a>
        <?php endif; ?>
        <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $loginurl->out(false); ?>">Log in</a>
      </div>
    </nav>
    <section class="pqpl-hero">
      <div>
        <span class="pqpl-kicker">Platform foundation</span>
        <h1 class="pqpl-title">Shared learning operations for branded education workspaces.</h1>
        <p class="pqpl-copy">EduPlatform hosts independent academy, institution, marketplace, and teacher workspace experiences from one Moodle foundation while each consumer keeps its own domain, identity, roles, and operational context.</p>
      </div>
      <aside class="pqpl-panel">
        <h2>Platform owner controls</h2>
        <p>Manage consumers, domains, workspace status, and support/debug links from the foundation layer.</p>
        <?php if ($isplatformadmin): ?>
          <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $adminurl->out(false); ?>">Open platform admin</a>
        <?php else: ?>
          <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $loginurl->out(false); ?>">Enter platform</a>
        <?php endif; ?>
      </aside>
    </section>
    <section class="pqpl-grid" aria-label="Platform capabilities">
      <article class="pqpl-card">
        <h3>Consumers</h3>
        <p>Create and manage academy, institution, marketplace, and teacher-facing consumer apps.</p>
      </article>
      <article class="pqpl-card">
        <h3>Custom Domains</h3>
        <p>Route each shared-root domain to the right consumer without changing the user-facing URL.</p>
      </article>
      <article class="pqpl-card">
        <h3>Workspaces</h3>
        <p>Keep students, teachers, sessions, materials, attendance, and reports scoped by workspace.</p>
      </article>
      <article class="pqpl-card">
        <h3>Operations</h3>
        <p>Support intake, onboarding, live sessions, marketplace flows, and parent visibility.</p>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
