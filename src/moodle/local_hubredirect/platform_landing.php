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
:root{--pqpl-green:#176f43;--pqpl-green-dark:#0f3d2e;--pqpl-gold:#d99a26;--pqpl-ink:#162b35;--pqpl-muted:#5f6f75;--pqpl-line:rgba(22,43,53,.12);--pqpl-paper:#fffaf0;--pqpl-white:#fff}
body.pqh-platform-landing-page{margin:0!important;background:var(--pqpl-paper)!important;color:var(--pqpl-ink);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
body.pqh-platform-landing-page header,body.pqh-platform-landing-page footer,body.pqh-platform-landing-page nav.navbar,body.pqh-platform-landing-page #page-header,body.pqh-platform-landing-page #page-footer,body.pqh-platform-landing-page .drawer,body.pqh-platform-landing-page .drawer-toggles,body.pqh-platform-landing-page .block-region,body.pqh-platform-landing-page [data-region="drawer"],body.pqh-platform-landing-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-platform-landing-page #page,body.pqh-platform-landing-page #page-content,body.pqh-platform-landing-page #region-main,body.pqh-platform-landing-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqpl-shell,.pqpl-shell *{box-sizing:border-box}.pqpl-shell{min-height:100vh;overflow-x:hidden;background:var(--pqpl-paper);color:var(--pqpl-ink)}.pqpl-shell a{color:inherit;text-decoration:none}.pqpl-wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}
.pqpl-topbar{background:var(--pqpl-green-dark);color:rgba(255,255,255,.86);font-size:13px;font-weight:800}.pqpl-topbar .pqpl-wrap{min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:16px}.pqpl-topbar span{white-space:nowrap}
.pqpl-nav{position:sticky;top:0;z-index:10;background:rgba(255,250,240,.94);border-bottom:1px solid var(--pqpl-line);backdrop-filter:blur(12px)}.pqpl-nav .pqpl-wrap{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:18px}.pqpl-brand{display:inline-flex;align-items:center;gap:14px;min-width:0}.pqpl-mark{display:grid;place-items:center;width:54px;height:54px;border-radius:12px;background:var(--pqpl-green-dark);color:#fff;font-size:18px;font-weight:950;box-shadow:0 14px 30px rgba(15,61,46,.18)}.pqpl-brand-name{display:block;color:var(--pqpl-green-dark);font-size:18px;line-height:1.05;font-weight:950}.pqpl-brand-sub{display:block;margin-top:4px;color:var(--pqpl-muted);font-size:13px;font-weight:800}.pqpl-navlinks{display:flex;align-items:center;gap:15px;flex-wrap:wrap;color:var(--pqpl-ink);font-size:14px;font-weight:850}.pqpl-navlinks a:hover{color:var(--pqpl-green)}
.pqpl-btn{display:inline-flex;min-height:44px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:8px;padding:0 16px;background:#eef7ee;color:var(--pqpl-ink)!important;font:900 14px/1 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;box-shadow:0 2px 0 rgba(23,48,68,.04)}.pqpl-btn--gold{background:var(--pqpl-gold);color:#16110a!important;box-shadow:0 12px 24px rgba(217,154,38,.24)}.pqpl-btn--dark{background:var(--pqpl-green);color:#fff!important;box-shadow:0 12px 24px rgba(23,111,67,.2)}
.pqpl-hero{position:relative;min-height:min(760px,calc(100vh - 120px));display:grid;align-items:stretch;color:#fff;background:#0c231c url("/local/hubredirect/pix/landing-hero-quran.jpg") center/cover no-repeat}.pqpl-hero:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,29,23,.92) 0%,rgba(9,29,23,.76) 48%,rgba(9,29,23,.36) 100%)}.pqpl-hero .pqpl-wrap{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.58fr);gap:clamp(24px,4vw,56px);align-items:center;padding:clamp(48px,8vw,88px) 0}.pqpl-kicker{display:inline-flex;width:fit-content;align-items:center;gap:9px;margin:0 0 18px;padding:8px 12px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);font-size:12px;font-weight:950;text-transform:uppercase}.pqpl-kicker:before{content:"";width:8px;height:8px;border-radius:999px;background:var(--pqpl-gold)}.pqpl-hero h1{max-width:780px;margin:0;color:#fff;font-size:clamp(44px,7vw,86px);line-height:1.02;font-weight:950;letter-spacing:0;text-shadow:0 6px 28px rgba(0,0,0,.34)}.pqpl-hero-copy{max-width:690px;margin:20px 0 0;color:rgba(255,255,255,.88);font-size:clamp(16px,2vw,20px);line-height:1.65;font-weight:750}.pqpl-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.pqpl-login-panel{width:100%;padding:20px;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:rgba(255,250,240,.96);color:var(--pqpl-ink);box-shadow:0 22px 60px rgba(0,0,0,.22)}.pqpl-login-panel h2{margin:0;color:var(--pqpl-green-dark);font-size:22px;line-height:1.15;font-weight:950}.pqpl-login-panel p{margin:10px 0 0;color:var(--pqpl-muted);font-size:14px;line-height:1.5;font-weight:760}.pqpl-panel-list{display:grid;gap:10px;margin:18px 0 0;padding:0;list-style:none}.pqpl-panel-list li{display:flex;gap:10px;align-items:flex-start;color:#40565f;font-size:14px;font-weight:800;line-height:1.42}.pqpl-panel-list li:before{content:"";width:9px;height:9px;flex:0 0 auto;margin-top:6px;border-radius:999px;background:var(--pqpl-gold)}
.pqpl-section{padding:72px 0}.pqpl-section-white{background:#fff}.pqpl-section-head{max-width:860px;margin:0 auto 32px;text-align:center}.pqpl-eyebrow{margin:0 0 10px;color:var(--pqpl-gold);font-size:13px;font-weight:950;text-transform:uppercase}.pqpl-section h2{margin:0;color:var(--pqpl-green-dark);font-size:clamp(30px,4vw,48px);line-height:1.08;font-weight:950;letter-spacing:0}.pqpl-section-intro{margin:16px auto 0;max-width:820px;color:var(--pqpl-muted);font-size:17px;line-height:1.65;font-weight:700}
.pqpl-feature-grid,.pqpl-suite-grid,.pqpl-path-grid{display:grid;gap:16px}.pqpl-feature-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.pqpl-suite-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pqpl-path-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.pqpl-card,.pqpl-suite,.pqpl-path{background:#fff;border:1px solid var(--pqpl-line);border-radius:8px;box-shadow:0 14px 36px rgba(22,43,53,.06)}.pqpl-card{padding:20px}.pqpl-card-icon{display:grid;place-items:center;width:38px;height:38px;margin-bottom:14px;border-radius:10px;background:#eef7ee;color:var(--pqpl-green-dark);font-weight:950}.pqpl-card h3,.pqpl-suite h3,.pqpl-path h3{margin:0 0 8px;color:var(--pqpl-green-dark);font-size:20px;line-height:1.18;font-weight:950}.pqpl-card p,.pqpl-suite p,.pqpl-path p{margin:0;color:var(--pqpl-muted);font-size:15px;line-height:1.58;font-weight:700}.pqpl-card p+p{margin-top:10px}.pqpl-suite{overflow:hidden}.pqpl-suite-top{min-height:150px;padding:20px;background:linear-gradient(135deg,#eaffea 0%,#fff 58%,#fff7e7 100%);border-bottom:1px solid var(--pqpl-line)}.pqpl-suite-tag{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:rgba(217,154,38,.16);color:#6f4e32;font-size:12px;font-weight:950;text-transform:uppercase}.pqpl-suite-body{padding:18px}.pqpl-split{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.2fr);gap:34px;align-items:center}.pqpl-photo{width:100%;min-height:420px;object-fit:cover;border-radius:8px;box-shadow:0 20px 48px rgba(22,43,53,.14)}.pqpl-list{display:grid;gap:11px;margin:22px 0 0;padding:0;list-style:none}.pqpl-list li{padding:14px 16px;border-radius:8px;background:#fff;border:1px solid var(--pqpl-line);color:#40565f;font-weight:760;line-height:1.5}.pqpl-path{padding:18px}.pqpl-cta{background:var(--pqpl-green-dark);color:#fff}.pqpl-cta .pqpl-wrap{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center}.pqpl-cta h2{color:#fff}.pqpl-cta p{max-width:720px;margin:12px 0 0;color:rgba(255,255,255,.82);font-size:17px;line-height:1.6;font-weight:720}.pqpl-footer{padding:22px 0;background:#081f18;color:rgba(255,255,255,.76);font-size:14px;font-weight:750}.pqpl-footer .pqpl-wrap{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
@media(max-width:1040px){.pqpl-nav .pqpl-wrap{display:block;padding:14px 0}.pqpl-navlinks{margin-top:12px}.pqpl-hero .pqpl-wrap,.pqpl-split,.pqpl-cta .pqpl-wrap{grid-template-columns:1fr}.pqpl-feature-grid,.pqpl-suite-grid,.pqpl-path-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pqpl-photo{min-height:300px}.pqpl-cta .pqpl-actions{margin-top:0}}
@media(max-width:680px){.pqpl-topbar .pqpl-wrap{align-items:flex-start;flex-direction:column;padding:8px 0}.pqpl-topbar span{white-space:normal}.pqpl-feature-grid,.pqpl-suite-grid,.pqpl-path-grid{grid-template-columns:1fr}.pqpl-actions{flex-direction:column}.pqpl-btn{width:100%}.pqpl-section{padding:54px 0}.pqpl-login-panel{padding:18px}.pqpl-hero h1{font-size:42px}}
</style>
<main class="pqpl-shell" id="home">
  <div class="pqpl-topbar" aria-label="Platform summary">
    <div class="pqpl-wrap">
      <span>Multi-brand education platform foundation</span>
      <span>Consumers, domains, workspaces, live operations, reporting, and governance</span>
    </div>
  </div>

  <header class="pqpl-nav">
    <div class="pqpl-wrap">
      <a class="pqpl-brand" href="<?php echo (new moodle_url('/local/hubredirect/platform_landing.php'))->out(false); ?>" aria-label="EduPlatform home">
        <span class="pqpl-mark">EP</span>
        <span>
          <span class="pqpl-brand-name">EduPlatform</span>
          <span class="pqpl-brand-sub">Shared foundation for branded learning operations</span>
        </span>
      </a>

      <nav class="pqpl-navlinks" aria-label="Landing page navigation">
        <a href="#foundation">Foundation</a>
        <a href="#capabilities">Capabilities</a>
        <a href="#operations">Operations</a>
        <a href="#governance">Governance</a>
        <a href="#quality">Quality</a>
        <?php if ($isplatformadmin): ?>
          <a href="<?php echo $adminurl->out(false); ?>">Dashboard</a>
        <?php endif; ?>
        <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $loginurl->out(false); ?>">Log in</a>
      </nav>
    </div>
  </header>

  <section class="pqpl-hero" aria-label="EduPlatform introduction">
    <div class="pqpl-wrap">
      <div>
        <p class="pqpl-kicker">Platform foundation</p>
        <h1>Run branded education workspaces from one operating layer.</h1>
        <p class="pqpl-hero-copy">EduPlatform gives academies, institutions, marketplaces, and teacher-led programs a shared Moodle foundation with domain routing, workspace isolation, role-aware dashboards, live-session operations, communications, reporting, SQA, and deployment controls.</p>
        <div class="pqpl-actions">
          <?php if ($isplatformadmin): ?>
            <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $adminurl->out(false); ?>">Open platform admin</a>
            <a class="pqpl-btn pqpl-btn--dark" href="<?php echo $consumeradminurl->out(false); ?>">Manage consumers</a>
            <a class="pqpl-btn" href="<?php echo $diagnosticsurl->out(false); ?>">Run diagnostics</a>
          <?php else: ?>
            <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $loginurl->out(false); ?>">Enter platform</a>
            <a class="pqpl-btn pqpl-btn--dark" href="#capabilities">View capabilities</a>
          <?php endif; ?>
        </div>
      </div>

      <aside class="pqpl-login-panel" aria-label="Platform owner controls">
        <h2>Built for platform operators</h2>
        <p>Use one foundation to launch and govern multiple education brands while keeping each consumer's data, identity, users, and workflows scoped correctly.</p>
        <ul class="pqpl-panel-list">
          <li>Consumer apps with brand, domain, support, route, and workspace settings.</li>
          <li>Role-aware access for admins, teachers, parents, students, principals, support, and SQA.</li>
          <li>Operational dashboards for live classes, communications, reports, finance, and follow-up.</li>
        </ul>
      </aside>
    </div>
  </section>

  <section class="pqpl-section pqpl-section-white" id="foundation">
    <div class="pqpl-wrap">
      <div class="pqpl-section-head">
        <p class="pqpl-eyebrow">Foundation model</p>
        <h2>One platform, many branded education experiences.</h2>
        <p class="pqpl-section-intro">EduPlatform separates the foundation from the consumer experience. The platform owner manages shared infrastructure, while each academy, institution, marketplace, or teacher workspace presents its own identity, domain, routes, roles, dashboards, and learning operations.</p>
      </div>

      <div class="pqpl-feature-grid">
        <article class="pqpl-card">
          <div class="pqpl-card-icon">1</div>
          <h3>Consumer Apps</h3>
          <p>Create academy, institution, marketplace, and teacher-facing apps with their own public landing, login, dashboard, routes, and support identity.</p>
        </article>
        <article class="pqpl-card">
          <div class="pqpl-card-icon">2</div>
          <h3>Domain Routing</h3>
          <p>Map shared-root or custom domains to the right consumer without exposing platform internals or breaking the public URL experience.</p>
        </article>
        <article class="pqpl-card">
          <div class="pqpl-card-icon">3</div>
          <h3>Workspace Isolation</h3>
          <p>Scope students, teachers, guardians, live sessions, materials, reports, and communications to the correct workspace.</p>
        </article>
        <article class="pqpl-card">
          <div class="pqpl-card-icon">4</div>
          <h3>Shared Operations</h3>
          <p>Keep deployment, SQA, diagnostics, support tools, access checks, and platform governance in one foundation layer.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="pqpl-section" id="capabilities">
    <div class="pqpl-wrap">
      <div class="pqpl-section-head">
        <p class="pqpl-eyebrow">Capability suites</p>
        <h2>Platform modules for the full education operating model.</h2>
        <p class="pqpl-section-intro">Instead of hard-coding one school or one course, EduPlatform provides reusable operating capabilities that each brand can activate, configure, and govern.</p>
      </div>

      <div class="pqpl-suite-grid">
        <article class="pqpl-suite">
          <div class="pqpl-suite-top"><span class="pqpl-suite-tag">Identity</span></div>
          <div class="pqpl-suite-body">
            <h3>Brand And Consumer Management</h3>
            <p>Manage consumer names, logos, color themes, support email, public paths, login paths, dashboard paths, domain rows, and workspace ownership.</p>
          </div>
        </article>
        <article class="pqpl-suite">
          <div class="pqpl-suite-top"><span class="pqpl-suite-tag">People</span></div>
          <div class="pqpl-suite-body">
            <h3>Roles And Access</h3>
            <p>Separate admin, principal, teacher, assistant teacher, student, guardian, support, marketplace tutor, and SQA visibility with central access checks.</p>
          </div>
        </article>
        <article class="pqpl-suite">
          <div class="pqpl-suite-top"><span class="pqpl-suite-tag">Learning</span></div>
          <div class="pqpl-suite-body">
            <h3>Course And Lesson Launch</h3>
            <p>Route learners into managed course experiences, static lesson apps, practice games, quiz tools, progress sync, and environment-aware launches.</p>
          </div>
        </article>
        <article class="pqpl-suite">
          <div class="pqpl-suite-top"><span class="pqpl-suite-tag">Live</span></div>
          <div class="pqpl-suite-body">
            <h3>Live Session Operations</h3>
            <p>Support scheduling, recurring series, join controls, BBB rooms, attendance, notes, homework, parent summaries, recordings, retention, and review queues.</p>
          </div>
        </article>
        <article class="pqpl-suite">
          <div class="pqpl-suite-top"><span class="pqpl-suite-tag">Comms</span></div>
          <div class="pqpl-suite-body">
            <h3>Communications And Support</h3>
            <p>Provide announcements, parent-teacher threads, unread state, privacy checks, support cases, urgent alerts, and role-scoped communication panels.</p>
          </div>
        </article>
        <article class="pqpl-suite">
          <div class="pqpl-suite-top"><span class="pqpl-suite-tag">Admin</span></div>
          <div class="pqpl-suite-body">
            <h3>Operations And Finance</h3>
            <p>Coordinate admissions, intake, enrollment, teacher onboarding, reports, invoices, payments, holds, scholarships, receipts, and audit views.</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="pqpl-section pqpl-section-white" id="operations">
    <div class="pqpl-wrap pqpl-split">
      <img class="pqpl-photo" src="/local/hubredirect/pix/landing-welcome.jpg" alt="Education operations workspace">
      <div>
        <p class="pqpl-eyebrow">Operational depth</p>
        <h2>From public inquiry to live-class follow-up.</h2>
        <p class="pqpl-section-intro">The platform is built around real education workflows, not only page routing. It supports the handoff from inquiry, intake, placement, enrollment, learning, live class, review, parent visibility, support, reporting, and continuous improvement.</p>
        <ul class="pqpl-list">
          <li>Student and teacher intake with review, placement, schedule, consent, and onboarding data.</li>
          <li>Workspace dashboards for people, materials, sessions, series, parent access, reports, and student profiles.</li>
          <li>Teacher workspaces for daily classes, post-class review, capacity planning, performance, and improvement plans.</li>
          <li>Parent-facing hubs for schedules, feedback, homework, recordings, summaries, receipts, and trust evidence.</li>
          <li>Support and communications workflows with privacy boundaries, participant checks, read tracking, and audit trails.</li>
          <li>Deployment tooling for integration, staging, production, Bunny CDN output, diagnostics, and rollback-ready operations.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="pqpl-section" id="governance">
    <div class="pqpl-wrap">
      <div class="pqpl-path-grid">
        <article class="pqpl-path">
          <h3>Platform Governance</h3>
          <p>Foundation admins manage consumers, domains, workspaces, support routes, diagnostics, platform settings, and access boundaries.</p>
        </article>
        <article class="pqpl-path">
          <h3>Institution Governance</h3>
          <p>Institution admins can manage linked schools, franchise relationships, branded portals, reporting inheritance, staff mobility, and data lifecycle checks.</p>
        </article>
        <article class="pqpl-path">
          <h3>Role Boundaries</h3>
          <p>Access control blocks cross-student, cross-workspace, cross-school, and cross-consumer visibility leaks across dashboards and direct URLs.</p>
        </article>
        <article class="pqpl-path">
          <h3>Data Lifecycle</h3>
          <p>Verification scripts and admin flows support retention, cleanup, export, transcript controls, recording lifecycle, and operational audit readiness.</p>
        </article>
        <article class="pqpl-path">
          <h3>Quality Review</h3>
          <p>Live-session notes, QA analytics, teacher coaching, leadership review, improvement plans, and recording review make quality visible.</p>
        </article>
        <article class="pqpl-path">
          <h3>Release Readiness</h3>
          <p>Environment promotion, production smoke tests, SQA evidence bundles, deployment drift checks, and operator runbooks support controlled rollout.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="pqpl-section pqpl-section-white" id="quality">
    <div class="pqpl-wrap">
      <div class="pqpl-section-head">
        <p class="pqpl-eyebrow">Verification and confidence</p>
        <h2>SQA built around real user journeys.</h2>
        <p class="pqpl-section-intro">EduPlatform includes test coverage and verification tools for the workflows that matter most: student, parent, teacher, admin, support, security, notifications, compliance, live BBB, institution governance, performance, and cross-role golden paths.</p>
      </div>
      <div class="pqpl-feature-grid">
        <article class="pqpl-card">
          <div class="pqpl-card-icon">A</div>
          <h3>Journey Automation</h3>
          <p>Playwright suites cover student, teacher, parent, admin, support, academic quality, security, notifications, and live-session workflows.</p>
        </article>
        <article class="pqpl-card">
          <div class="pqpl-card-icon">B</div>
          <h3>SQL Verification</h3>
          <p>Operational SQL scripts validate schemas, migrations, workspace scope, finance phases, transcripts, support, recordings, and institutional isolation.</p>
        </article>
        <article class="pqpl-card">
          <div class="pqpl-card-icon">C</div>
          <h3>Evidence Bundles</h3>
          <p>Verification sweeps, SQA schedules, deployment probes, and evidence finalization tools help operators prove readiness before release.</p>
        </article>
        <article class="pqpl-card">
          <div class="pqpl-card-icon">D</div>
          <h3>Runbooks</h3>
          <p>Admin, SQA, launch, deployment, rollback, live-session, parent-trust, and operator checklists make platform operation repeatable.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="pqpl-section pqpl-cta">
    <div class="pqpl-wrap">
      <div>
        <h2>Ready to operate the platform?</h2>
        <p>Open the platform dashboard if you are an authorized operator, or sign in to continue managing consumers, domains, workspaces, live operations, support, reporting, and release readiness.</p>
      </div>
      <div class="pqpl-actions">
        <?php if ($isplatformadmin): ?>
          <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $adminurl->out(false); ?>">Open dashboard</a>
          <a class="pqpl-btn" href="<?php echo $settingsurl->out(false); ?>">Settings</a>
        <?php else: ?>
          <a class="pqpl-btn pqpl-btn--gold" href="<?php echo $loginurl->out(false); ?>">Log in</a>
        <?php endif; ?>
      </div>
    </div>
  </section>

  <footer class="pqpl-footer">
    <div class="pqpl-wrap">
      <span>&copy; 2026 EduPlatform</span>
      <span>Shared foundation. Branded workspaces. Governed learning operations.</span>
    </div>
  </footer>
</main>
<?php
echo $OUTPUT->footer();
