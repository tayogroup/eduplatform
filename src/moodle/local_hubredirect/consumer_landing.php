<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$consumer = pqh_requested_consumer_context();
$slug = (string)$consumer->consumerslug;
$isedu = $slug === 'edu-for-tomorrow';
$isinstitution = (string)($consumer->consumer_type ?? '') === 'institution';
$isacademy = (string)($consumer->consumer_type ?? '') === 'academy_consumer';
$isprofileconsumer = $isinstitution || $isacademy;
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = $isedu ? 'EduForTomorrow' : (string)$consumer->consumername;
$brandlogo = trim((string)($consumer->logourl ?? ''));
$theme = pqh_consumer_theme($consumer);
$copy = pqh_consumer_copy($consumer);
$brandinitial = pqh_consumer_brand_initials($consumer, $isedu ? 'E' : 'W');
$heroimage = pqh_consumer_hero_image_url($consumer);
$primarycolor = (string)$theme['primary_color'];
$accentcolor = (string)$theme['accent_color'];
$tagline = $isinstitution
    ? 'A branded teaching workspace for students, teachers, live sessions, reporting, and custom-domain access.'
    : ($isedu
        ? 'A marketplace and operating workspace for independent teachers, tutors, parents, and learning institutions.'
        : 'Online learning operations, live sessions, student intake, and teacher services in one managed workspace.');
$headline = trim((string)($copy['landing_headline'] ?? ''));
if ($headline === '') {
    $headline = $brand;
}
$customsubtitle = trim((string)($copy['landing_subtitle'] ?? ''));
if ($customsubtitle !== '') {
    $tagline = $customsubtitle;
}
$support = trim((string)($consumer->supportemail ?? ''));
$consumerparams = ['consumer' => $slug];
$workspaceparams = $consumerparams;
if ($workspaceid > 0) {
    $workspaceparams['workspaceid'] = $workspaceid;
}

$studenturl = new moodle_url('/local/hubredirect/public_intake.php', $workspaceparams);
$teacherurl = new moodle_url($isedu ? '/local/hubredirect/public_teacher_intake.php' : '/local/hubredirect/teacher_intake.php', $workspaceparams);
$marketurl = new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams);
$dashboardpath = (string)($consumer->defaultdashboardpath ?: '/local/hubredirect/dashboard.php');
$dashboardurl = new moodle_url($dashboardpath, $workspaceparams);
$roleurl = new moodle_url('/local/hubredirect/role_redirect.php', $workspaceparams);
$loginurl = new moodle_url('/local/hubredirect/consumer_login.php', [
    'consumer' => $slug,
    'wantsurl' => $roleurl->out(false),
]);
$profileurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams);
$inquiryurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams + ['contact' => 1]);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/consumer_landing.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brand);
$PAGE->set_heading($brand);
$PAGE->add_body_class('pqh-consumer-landing-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

function pqhcl_service_cards(bool $isedu, bool $isinstitution): array {
    if ($isinstitution) {
        return [
            ['Branded workspace', 'Use your own institution identity and custom domain while keeping operations in the shared learning platform.'],
            ['Student and teacher management', 'Coordinate students, teachers, parent contacts, courses, assignments, and workspace membership.'],
            ['Live sessions', 'Schedule recurring classes, track upcoming sessions, manage attendance, and review live-class activity.'],
            ['Reports and operations', 'Review workspace reports, teaching load, student progress, materials, and operational follow-up.'],
        ];
    }
    if ($isedu) {
        return [
            ['For independent teachers', 'Create a public profile, receive parent inquiries, manage students and courses, and run live sessions from one workspace.'],
            ['For parents', 'Browse teacher profiles, request services, and submit student learning needs through a guided intake form.'],
            ['For institutions', 'Operate a branded workspace for teachers, students, live sessions, reports, and custom-domain access.'],
            ['For live learning', 'Use scheduling, session materials, recordings, consent controls, and follow-up tools built for recurring instruction.'],
        ];
    }
    return [
        ['Student intake', 'Collect student, parent, placement, consent, language, and schedule information before enrollment.'],
        ['Teacher operations', 'Onboard teachers, publish marketplace profiles, and manage teaching responsibilities.'],
        ['Live sessions', 'Create recurring live sessions, attach materials, manage recordings, and review quality.'],
        ['Workspace management', 'Coordinate students, teachers, courses, parent communication, reports, and academy operations.'],
    ];
}

echo $OUTPUT->header();
?>
<style>
body.pqh-consumer-landing-page header,
body.pqh-consumer-landing-page footer,
body.pqh-consumer-landing-page nav.navbar,
body.pqh-consumer-landing-page #page-header,
body.pqh-consumer-landing-page #page-footer,
body.pqh-consumer-landing-page .drawer,
body.pqh-consumer-landing-page .drawer-toggles,
body.pqh-consumer-landing-page .block-region,
body.pqh-consumer-landing-page [data-region="drawer"],
body.pqh-consumer-landing-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-consumer-landing-page #page,
body.pqh-consumer-landing-page #page-content,
body.pqh-consumer-landing-page #region-main,
body.pqh-consumer-landing-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhcl-shell{min-height:100vh;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqhcl-nav{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.94);border-bottom:1px solid rgba(23,48,68,.1);backdrop-filter:blur(10px)}
.pqhcl-nav-inner{max-width:1180px;margin:0 auto;min-height:64px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.pqhcl-brand{display:flex;align-items:center;gap:11px;font-weight:950;color:#172d3d;text-decoration:none}
.pqhcl-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--pqh-primary,#2f6f4e);color:#fff;font-weight:950;overflow:hidden}
.pqhcl-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqhcl-links{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.pqhcl-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;border:1px solid rgba(23,48,68,.13);background:#eef4f6;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950}
.pqhcl-btn--primary{background:var(--pqh-accent,#d99a26);border-color:var(--pqh-accent,#d99a26);color:#1b1409!important;box-shadow:0 12px 22px rgba(217,154,38,.22)}
.pqhcl-hero{position:relative;overflow:hidden;min-height:560px;display:flex;align-items:center;background:linear-gradient(90deg,rgba(9,37,32,.92),rgba(16,74,60,.76) 54%,rgba(16,74,60,.28)),var(--pqh-hero-image) center/cover no-repeat;color:#fff}
.pqhcl-hero-inner{max-width:1180px;width:100%;margin:0 auto;padding:72px 18px 92px}
.pqhcl-kicker{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:rgba(255,216,140,.16);border:1px solid rgba(255,216,140,.34);color:#ffd88c;font-size:13px;font-weight:950;text-transform:uppercase}
.pqhcl-title{max-width:800px;margin:18px 0 0;font-size:64px;line-height:.98;font-weight:950;color:#fff;letter-spacing:0;text-shadow:0 10px 30px rgba(0,0,0,.28)}
.pqhcl-sub{max-width:760px;margin:18px 0 0;color:rgba(255,255,255,.9);font-size:19px;font-weight:800;line-height:1.55}
.pqhcl-hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
.pqhcl-hero .pqhcl-btn{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.18)}
.pqhcl-hero .pqhcl-btn--primary{background:var(--pqh-accent,#d99a26);border-color:var(--pqh-accent,#d99a26)}
.pqhcl-band{max-width:1180px;margin:-46px auto 0;padding:0 18px 58px;position:relative;z-index:2}
.pqhcl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.pqhcl-card{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;padding:18px;box-shadow:0 14px 34px rgba(23,48,68,.09)}
.pqhcl-card h2{margin:0;color:#241b24;font-size:18px;line-height:1.18;font-weight:950}
.pqhcl-card p{margin:10px 0 0;color:#536978;font-size:14px;line-height:1.48;font-weight:760}
.pqhcl-section{max-width:1180px;margin:0 auto;padding:0 18px 64px}
.pqhcl-split{display:grid;grid-template-columns:1.05fr .95fr;gap:28px;align-items:start}
.pqhcl-copy h2{margin:0;color:#241b24;font-size:34px;line-height:1.08;font-weight:950}
.pqhcl-copy p{margin:13px 0 0;color:#536978;font-size:16px;line-height:1.62;font-weight:760}
.pqhcl-list{display:grid;gap:10px;margin-top:18px}
.pqhcl-row{display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;align-items:start;color:#173044;font-size:15px;font-weight:850}
.pqhcl-dot{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#edf9ef;color:#245c35;font-weight:950}
.pqhcl-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;padding:22px;box-shadow:0 14px 34px rgba(23,48,68,.08)}
.pqhcl-panel h2{margin:0 0 14px;color:#241b24;font-size:22px;line-height:1.16;font-weight:950}
.pqhcl-panel-actions{display:grid;gap:10px}
.pqhcl-panel .pqhcl-btn{width:100%}
.pqhcl-muted{margin-top:14px;color:#6b7e8b;font-size:12px;font-weight:800;line-height:1.45}
@media(max-width:920px){.pqhcl-title{font-size:44px}.pqhcl-grid,.pqhcl-split{grid-template-columns:1fr 1fr}.pqhcl-band{margin-top:-32px}}
@media(max-width:680px){.pqhcl-nav-inner{display:block;padding:12px 14px}.pqhcl-links{justify-content:flex-start;margin-top:10px}.pqhcl-hero{min-height:500px}.pqhcl-title{font-size:34px}.pqhcl-sub{font-size:16px}.pqhcl-grid,.pqhcl-split{grid-template-columns:1fr}.pqhcl-band{padding-bottom:44px}.pqhcl-copy h2{font-size:28px}}
</style>
<main class="pqhcl-shell" style="--pqh-primary: <?php echo s($primarycolor); ?>; --pqh-accent: <?php echo s($accentcolor); ?>; --pqh-hero-image: url('<?php echo s($heroimage); ?>');">
  <nav class="pqhcl-nav">
    <div class="pqhcl-nav-inner">
      <a class="pqhcl-brand" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $consumerparams))->out(false); ?>">
        <span class="pqhcl-mark">
          <?php if ($brandlogo !== ''): ?>
            <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brand); ?>">
          <?php else: ?>
            <?php echo s($brandinitial); ?>
          <?php endif; ?>
        </span>
        <span><?php echo s($brand); ?></span>
      </a>
      <div class="pqhcl-links">
        <?php if (!$isinstitution): ?>
          <a class="pqhcl-btn" href="<?php echo $marketurl->out(false); ?>">Browse Teachers</a>
        <?php endif; ?>
        <a class="pqhcl-btn" href="<?php echo $studenturl->out(false); ?>">Student Intake</a>
        <?php if ($isprofileconsumer): ?>
          <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>">Profile</a>
          <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>#contact">Contact</a>
        <?php endif; ?>
        <?php if ($isinstitution): ?>
          <a class="pqhcl-btn" href="<?php echo $dashboardurl->out(false); ?>">Workspace</a>
        <?php endif; ?>
        <a class="pqhcl-btn pqhcl-btn--primary" href="<?php echo $loginurl->out(false); ?>">Log In</a>
      </div>
    </div>
  </nav>

  <section class="pqhcl-hero">
    <div class="pqhcl-hero-inner">
      <div class="pqhcl-kicker"><?php echo s($isinstitution ? 'Institution workspace' : ($isedu ? 'Independent teaching platform' : 'Academy learning platform')); ?></div>
      <h1 class="pqhcl-title"><?php echo s($headline); ?></h1>
      <p class="pqhcl-sub"><?php echo s($tagline); ?></p>
      <div class="pqhcl-hero-actions">
        <a class="pqhcl-btn pqhcl-btn--primary" href="<?php echo $studenturl->out(false); ?>"><?php echo s($isinstitution ? 'Submit Student Intake' : 'Request Teacher Services'); ?></a>
        <a class="pqhcl-btn" href="<?php echo $teacherurl->out(false); ?>"><?php echo s($isinstitution ? 'Teacher Onboarding' : 'Teacher Profile Intake'); ?></a>
        <?php if ($isprofileconsumer): ?>
          <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>"><?php echo s($isacademy ? 'Academy Profile' : 'Institution Profile'); ?></a>
        <?php endif; ?>
        <?php if ($isinstitution): ?>
          <a class="pqhcl-btn" href="<?php echo $dashboardurl->out(false); ?>">Open Workspace</a>
        <?php else: ?>
          <a class="pqhcl-btn" href="<?php echo $marketurl->out(false); ?>">Explore Marketplace</a>
        <?php endif; ?>
      </div>
    </div>
  </section>

  <section class="pqhcl-band">
    <div class="pqhcl-grid">
      <?php foreach (pqhcl_service_cards($isedu, $isinstitution) as $card): ?>
        <article class="pqhcl-card">
          <h2><?php echo s($card[0]); ?></h2>
          <p><?php echo s($card[1]); ?></p>
        </article>
      <?php endforeach; ?>
    </div>
  </section>

  <section class="pqhcl-section">
    <div class="pqhcl-split">
      <div class="pqhcl-copy">
        <h2><?php echo s($isinstitution ? 'Your workspace, under your institution identity.' : ($isedu ? 'One platform, many teaching businesses.' : 'Structured operations for live online learning.')); ?></h2>
        <p><?php echo s($isinstitution
            ? $brand . ' can use this public entry point for intake and login while staff continue into the dedicated workspace for students, teachers, live sessions, and reports.'
            : ($isedu
                ? 'EduForTomorrow is designed so independent teachers and institutions can present services publicly while using shared operational tools for students, courses, live sessions, communication, and reporting.'
                : $brand . ' uses the shared EduPlatform foundation to coordinate student intake, teacher onboarding, live sessions, marketplace profiles, and parent communication.')); ?></p>
        <div class="pqhcl-list">
          <div class="pqhcl-row"><span class="pqhcl-dot">1</span><span>Public pages route visitors into the correct brand or workspace context.</span></div>
          <div class="pqhcl-row"><span class="pqhcl-dot">2</span><span>Teachers and parents can start through intake forms without needing to know the underlying system.</span></div>
          <div class="pqhcl-row"><span class="pqhcl-dot">3</span><span><?php echo s($isinstitution ? 'Logged-in staff continue into the institution workspace dashboard with the correct workspace selected.' : 'Logged-in clients continue into dashboards, live sessions, courses, and student management.'); ?></span></div>
        </div>
      </div>
      <aside class="pqhcl-panel">
        <h2>Get Started</h2>
        <div class="pqhcl-panel-actions">
          <a class="pqhcl-btn pqhcl-btn--primary" href="<?php echo $studenturl->out(false); ?>">Parent / Student Intake</a>
          <a class="pqhcl-btn" href="<?php echo $teacherurl->out(false); ?>"><?php echo s($isinstitution ? 'Teacher Onboarding' : 'Independent Teacher Intake'); ?></a>
          <?php if (!$isinstitution && !$isacademy): ?>
            <a class="pqhcl-btn" href="<?php echo $marketurl->out(false); ?>">Teacher Marketplace</a>
          <?php endif; ?>
          <?php if ($isprofileconsumer): ?>
            <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>"><?php echo s($isacademy ? 'Academy Profile' : 'Institution Profile'); ?></a>
            <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>#contact">Contact <?php echo s($isacademy ? 'Academy' : 'Institution'); ?></a>
          <?php endif; ?>
          <a class="pqhcl-btn" href="<?php echo $dashboardurl->out(false); ?>"><?php echo s($isinstitution ? 'Workspace Dashboard' : 'Client Dashboard'); ?></a>
        </div>
        <?php if ($support !== ''): ?>
          <p class="pqhcl-muted">Support: <?php echo s($support); ?></p>
        <?php endif; ?>
      </aside>
    </div>
  </section>
</main>
<?php
echo $OUTPUT->footer();
