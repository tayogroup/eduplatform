<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$consumer = pqh_requested_consumer_context();
$slug = (string)$consumer->consumerslug;
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;
$brandlogo = trim((string)($consumer->logourl ?? ''));
$consumertype = (string)($consumer->consumer_type ?? '');
$usesworkspacecontext = $workspaceid > 0 && !in_array($consumertype, ['academy_consumer', 'platform_foundation'], true);

$theme = pqh_consumer_theme($consumer);
$brandinitial = pqh_consumer_brand_initials($consumer);
$heroimage = pqh_consumer_hero_image_url($consumer);
$primarycolor = (string)$theme['primary_color'];
$accentcolor = (string)$theme['accent_color'];

$params = ['consumer' => $slug];
if ($usesworkspacecontext) {
    $params['workspaceid'] = $workspaceid;
}

$dashboardpath = (string)($consumer->defaultdashboardpath ?: '/local/hubredirect/dashboard.php');
if ($consumertype === 'platform_foundation') {
    $dashboardpath = '/local/hubredirect/platform_dashboard.php';
}
if ($dashboardpath === '/local/hubredirect/dashboard.php' && $usesworkspacecontext) {
    $dashboardpath = '/local/hubredirect/workspace_dashboard.php';
}
$dashboardurl = new moodle_url($dashboardpath, $params);
$roleurl = new moodle_url('/local/hubredirect/role_redirect.php', $params);
$landingpath = $consumertype === 'platform_foundation' ? '/local/hubredirect/platform_landing.php' : '/local/hubredirect/consumer_landing.php';
$landingurl = new moodle_url($landingpath, $params);
$wantsurl = optional_param('wantsurl', '', PARAM_LOCALURL);
if ($wantsurl === '' && !empty($SESSION->wantsurl)) {
    $wantsurl = clean_param((string)$SESSION->wantsurl, PARAM_LOCALURL);
}
$destinationurl = $wantsurl !== '' ? new moodle_url($wantsurl) : $roleurl;
$loginurl = new moodle_url('/login/index.php', [
    'consumer' => $slug,
    'wantsurl' => $destinationurl->out(false),
]);
$forgoturl = new moodle_url('/login/forgot_password.php');
$sessionexpired = optional_param('sessionexpired', 0, PARAM_BOOL);
$intent = optional_param('intent', '', PARAM_ALPHANUMEXT);

if ($consumertype === 'platform_foundation' && $intent !== 'login' && $wantsurl === '') {
    redirect($landingurl);
}

if ($consumertype === 'platform_foundation') {
    $kicker = 'Platform foundation';
    $herotitle = 'Enter ' . $brand;
    $herocopy = 'Sign in to manage consumers, domains, workspaces, support links, and platform operations from the shared foundation layer.';
    $panelcopy = 'Use your EduPlatform administrator account to continue.';
    $submittext = 'Enter platform';
    $backtext = 'Back to ' . $brand;
    $opentext = 'Open platform';
    $mutedtext = 'This page uses Moodle sign-in while keeping the EduPlatform foundation context.';
} else if ($usesworkspacecontext) {
    $kicker = 'Institution workspace';
    $herotitle = 'Continue learning with ' . $brand;
    $herocopy = 'Sign in to access your workspace, classes, student records, live sessions, and reports under the ' . $brand . ' domain.';
    $panelcopy = 'Use the account provided by your institution team.';
    $submittext = 'Enter workspace';
    $backtext = 'Back to ' . $brand;
    $opentext = 'Open workspace';
    $mutedtext = 'This page uses the shared Moodle sign-in service while keeping the custom-domain workspace context.';
} else {
    $kicker = 'Learning app';
    $herotitle = 'Continue with ' . $brand;
    $herocopy = 'Sign in to access learning services, dashboards, live sessions, and account tools under the ' . $brand . ' domain.';
    $panelcopy = 'Use your account to continue.';
    $submittext = 'Log in';
    $backtext = 'Back to ' . $brand;
    $opentext = 'Open dashboard';
    $mutedtext = 'This page uses the shared Moodle sign-in service while keeping the custom-domain consumer context.';
}

if (isloggedin() && !isguestuser()) {
    redirect($destinationurl);
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/consumer_login.php', $params));
$PAGE->set_pagelayout('embedded');
$PAGE->set_title($brand . ' Login');
$PAGE->set_heading($brand . ' Login');
$PAGE->add_body_class('pqh-consumer-login-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

echo $OUTPUT->header();
?>
<style>
body.pqh-consumer-login-page{margin:0;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
body.pqh-consumer-login-page header,
body.pqh-consumer-login-page footer,
body.pqh-consumer-login-page nav.navbar,
body.pqh-consumer-login-page #page-header,
body.pqh-consumer-login-page #page-footer,
body.pqh-consumer-login-page .drawer,
body.pqh-consumer-login-page .drawer-toggles,
body.pqh-consumer-login-page [data-region="drawer"],
body.pqh-consumer-login-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-consumer-login-page #page,
body.pqh-consumer-login-page #page-content,
body.pqh-consumer-login-page #region-main,
body.pqh-consumer-login-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important;background:transparent!important}
.pqhlogin-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f8fb}
.pqhlogin-cardbrand{display:flex;align-items:center;gap:11px;margin-bottom:16px;color:#173044;font-weight:950;font-size:17px}
.pqhlogin-cardbrand .pqhlogin-mark{width:42px;height:42px;border-radius:10px}
.pqhlogin-hero{position:relative;overflow:hidden;display:flex;align-items:center;padding:52px;min-height:100vh;background:linear-gradient(90deg,rgba(9,37,32,.93),rgba(20,83,66,.78)),var(--pqh-hero-image) center/cover no-repeat;color:#fff}
.pqhlogin-hero-inner{max-width:760px}
.pqhlogin-brand{display:flex;align-items:center;gap:13px;margin-bottom:56px;font-weight:950;font-size:21px}
.pqhlogin-mark{display:grid;place-items:center;width:52px;height:52px;border-radius:12px;background:var(--pqh-primary,#2f6f4e);color:#fff;font-weight:950;overflow:hidden}
.pqhlogin-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqhlogin-kicker{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:rgba(255,216,140,.16);border:1px solid rgba(255,216,140,.34);color:#ffd88c;font-size:13px;font-weight:950;text-transform:uppercase}
.pqhlogin-title{margin:18px 0 0;max-width:720px;font-size:58px;line-height:1;font-weight:950;color:#fff;letter-spacing:0;text-shadow:0 12px 30px rgba(0,0,0,.24)}
.pqhlogin-copy{margin:20px 0 0;max-width:640px;color:rgba(255,255,255,.9);font-size:19px;line-height:1.55;font-weight:800}
.pqhlogin-panel-wrap{display:flex;align-items:center;justify-content:center;padding:42px;background:linear-gradient(180deg,#fff,#f8fbf9)}
.pqhlogin-panel{width:min(100%,430px);background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;padding:28px;box-shadow:0 24px 60px rgba(23,48,68,.14)}
.pqhlogin-panel h1{margin:0;color:#241b24;font-size:30px;line-height:1.1;font-weight:950}
.pqhlogin-panel p{margin:10px 0 0;color:#5b6d79;font-size:15px;line-height:1.5;font-weight:760}
.pqhlogin-alert{margin:16px 0 0;padding:12px 14px;border-radius:8px;background:#fff4d9;border:1px solid rgba(217,154,38,.35);color:#5f4210;font-size:13px;font-weight:850}
.pqhlogin-form{display:grid;gap:13px;margin-top:20px}
.pqhlogin-field label{display:block;margin:0 0 6px;color:#173044;font-size:13px;font-weight:950}
.pqhlogin-input{width:100%;height:48px;border:1px solid rgba(23,48,68,.16);border-radius:8px;padding:0 13px;background:#fff;color:#173044;font-size:15px;font-weight:780;box-sizing:border-box}
.pqhlogin-input:focus{outline:3px solid color-mix(in srgb,var(--pqh-primary,#2f6f4e) 20%,transparent);border-color:var(--pqh-primary,#2f6f4e)}
.pqhlogin-submit{height:50px;border:0;border-radius:8px;background:var(--pqh-accent,#d99a26);color:#1b1409;font-size:15px;font-weight:950;cursor:pointer;box-shadow:0 12px 24px rgba(217,154,38,.22)}
.pqhlogin-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#5b6d79;font-size:13px;font-weight:850}
.pqhlogin-row label{display:flex;align-items:center;gap:7px;margin:0}
.pqhlogin-row a,.pqhlogin-link{color:var(--pqh-primary,#2f6f4e)!important;font-weight:950;text-decoration:none}
.pqhlogin-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;padding-top:18px;border-top:1px solid rgba(23,48,68,.1)}
.pqhlogin-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;border:1px solid rgba(23,48,68,.13);background:#eef4f6;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950}
.pqhlogin-muted{margin-top:15px;color:#6b7e8b;font-size:12px;font-weight:760;line-height:1.45}
@media(max-width:880px){.pqhlogin-shell{grid-template-columns:1fr}.pqhlogin-hero{min-height:auto;padding:34px 20px}.pqhlogin-title{font-size:38px}.pqhlogin-brand{margin-bottom:36px}.pqhlogin-panel-wrap{padding:22px 16px 40px}.pqhlogin-panel{padding:22px}}
</style>
<main class="pqhlogin-shell" style="--pqh-primary: <?php echo s($primarycolor); ?>; --pqh-accent: <?php echo s($accentcolor); ?>; --pqh-hero-image: url('<?php echo s($heroimage); ?>');">
  <section class="pqhlogin-panel-wrap" aria-label="<?php echo s($brand); ?> login">
    <div class="pqhlogin-panel">
      <div class="pqhlogin-cardbrand">
        <span class="pqhlogin-mark">
          <?php if ($brandlogo !== ''): ?>
            <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brand); ?>">
          <?php else: ?>
            <?php echo s($brandinitial); ?>
          <?php endif; ?>
        </span>
        <span><?php echo s($brand); ?></span>
      </div>
      <h1>Log in</h1>
      <p><?php echo s($panelcopy); ?></p>
      <?php if ($sessionexpired): ?>
        <div class="pqhlogin-alert">Your session expired. Please sign in again to continue.</div>
      <?php endif; ?>
      <form class="pqhlogin-form" action="<?php echo $loginurl->out(false); ?>" method="post">
        <input type="hidden" name="logintoken" value="<?php echo s(\core\session\manager::get_login_token()); ?>">
        <input type="hidden" name="wantsurl" value="<?php echo s($destinationurl->out(false)); ?>">
        <input type="hidden" name="consumer" value="<?php echo s($slug); ?>">
        <div class="pqhlogin-field">
          <label for="pqhlogin-username">Username</label>
          <input class="pqhlogin-input" id="pqhlogin-username" name="username" type="text" autocomplete="username" required>
        </div>
        <div class="pqhlogin-field">
          <label for="pqhlogin-password">Password</label>
          <input class="pqhlogin-input" id="pqhlogin-password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <button class="pqhlogin-submit" type="submit"><?php echo s($submittext); ?></button>
        <div class="pqhlogin-row">
          <label><input type="checkbox" name="rememberusername"> <span>Remember me</span></label>
          <a href="<?php echo $forgoturl->out(false); ?>">Forgot password?</a>
        </div>
      </form>
      <div class="pqhlogin-actions">
        <a class="pqhlogin-btn" href="<?php echo $landingurl->out(false); ?>"><?php echo s($backtext); ?></a>
        <a class="pqhlogin-btn" href="<?php echo $dashboardurl->out(false); ?>"><?php echo s($opentext); ?></a>
      </div>
      <div class="pqhlogin-muted"><?php echo s($mutedtext); ?></div>
    </div>
  </section>
</main>
<?php
echo $OUTPUT->footer();
