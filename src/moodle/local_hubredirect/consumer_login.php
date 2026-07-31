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
$primarycolor = (string)$theme['primary_color'];
$accentcolor = (string)$theme['accent_color'];
$fontbase = (new moodle_url('/local/hubredirect/pix/fonts/'))->out(false);

$params = ['consumer' => $slug];
if ($usesworkspacecontext) {
    $params['workspaceid'] = $workspaceid;
}

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
    $mutedtext = 'This page uses the shared sign-in service while keeping the EduPlatform foundation context.';
} else if ($usesworkspacecontext) {
    $kicker = 'Institution workspace';
    $herotitle = 'Continue learning with ' . $brand;
    $herocopy = 'Sign in to access your workspace, classes, student records, live sessions, and reports under the ' . $brand . ' domain.';
    $panelcopy = 'Use the account provided by your institution team.';
    $submittext = 'Enter workspace';
    $mutedtext = 'This page uses the shared sign-in service while keeping the custom-domain workspace context.';
} else {
    $kicker = 'Learning app';
    $herotitle = 'Continue with ' . $brand;
    $herocopy = 'Sign in to access learning services, dashboards, live sessions, and account tools under the ' . $brand . ' domain.';
    $panelcopy = 'Use your account to continue.';
    $submittext = 'Log in';
    $mutedtext = 'This page uses the shared sign-in service while keeping the custom-domain consumer context.';
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
@font-face{font-family:'Inter';font-style:normal;font-weight:300 700;font-display:swap;src:url('<?php echo s($fontbase); ?>Inter-normal-300-700.woff2') format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:500;font-display:swap;src:url('<?php echo s($fontbase); ?>IBMPlexMono-normal-500.woff2') format('woff2')}
body.pqh-consumer-login-page{margin:0;background:#f6fafd;color:#0f2b47;font-family:'Inter',system-ui,-apple-system,"Segoe UI",Arial,sans-serif;-webkit-font-smoothing:antialiased}
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
.pqhlogin-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:
  radial-gradient(60% 50% at 85% 0%, color-mix(in srgb, var(--pqh-primary,#2166d1) 30%, transparent), transparent 70%),
  radial-gradient(50% 40% at 10% 100%, color-mix(in srgb, var(--pqh-primary,#2166d1) 14%, transparent), transparent 70%),
  linear-gradient(180deg,#e9f4fc 0%,#f6fafd 55%,#ffffff 100%)}
.pqhlogin-card{width:100%;max-width:460px;background:#fff;border:1px solid rgba(15,43,71,.1);border-radius:22px;box-shadow:0 24px 70px rgba(15,43,71,.12);padding:clamp(28px,5vw,44px);box-sizing:border-box;animation:pqhlogin-rise .7s cubic-bezier(.32,0,.1,1) both}
@keyframes pqhlogin-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.pqhlogin-brand{display:flex;align-items:center;gap:14px;margin-bottom:30px}
.pqhlogin-brand-mark{display:flex;align-items:center;height:54px;max-width:220px;flex-shrink:0}
.pqhlogin-brand-mark img{display:block;height:100%;width:auto;max-width:220px;object-fit:contain}
.pqhlogin-brand strong{display:block;font-size:1.05rem;font-weight:700;letter-spacing:-.02em}
.pqhlogin-brand small{display:block;font-family:'IBM Plex Mono',ui-monospace,Consolas,monospace;font-size:.6rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--pqh-accent,#4d8be0);margin-top:3px}
.pqhlogin-card h1{margin:0 0 8px;font-size:clamp(1.9rem,6vw,2.4rem);font-weight:700;letter-spacing:-.035em}
.pqhlogin-sub{margin:0 0 28px;font-size:.92rem;line-height:1.6;color:rgba(15,43,71,.62)}
.pqhlogin-alert{margin:0 0 20px;padding:12px 14px;border-radius:12px;background:#fff4d9;border:1px solid rgba(217,154,38,.35);color:#5f4210;font-size:13px;font-weight:600}
.pqhlogin-field{margin-bottom:18px}
.pqhlogin-field label{display:block;margin:0 0 7px;font-size:.82rem;font-weight:600}
.pqhlogin-input{width:100%;font:inherit;font-size:.95rem;color:#0f2b47;background:#ecf5fc;border:1px solid transparent;border-radius:12px;padding:.95em 1.1em;outline:none;box-sizing:border-box;transition:border-color .3s,background-color .3s,box-shadow .3s}
.pqhlogin-input:focus{background:#fff;border-color:var(--pqh-primary,#2166d1);box-shadow:0 0 0 4px color-mix(in srgb,var(--pqh-primary,#2166d1) 14%,transparent)}
.pqhlogin-btn{display:block;width:100%;font:inherit;font-size:.95rem;font-weight:600;text-align:center;text-decoration:none;border:none;border-radius:100px;padding:1em 1.5em;cursor:pointer;box-sizing:border-box;transition:background-color .35s,color .35s,box-shadow .35s,transform .35s,border-color .35s}
.pqhlogin-btn--primary{background:var(--pqh-primary,#2166d1);color:#fff;box-shadow:0 10px 28px color-mix(in srgb,var(--pqh-primary,#2166d1) 35%,transparent);margin-top:6px}
.pqhlogin-btn--primary:hover{background:var(--pqh-accent,#4d8be0);transform:translateY(-2px);box-shadow:0 14px 34px color-mix(in srgb,var(--pqh-accent,#4d8be0) 40%,transparent)}
.pqhlogin-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 24px;flex-wrap:wrap}
.pqhlogin-remember{display:flex;align-items:center;gap:9px;margin:0;font-size:.85rem;font-weight:500;color:rgba(15,43,71,.62);cursor:pointer}
.pqhlogin-remember input{width:17px;height:17px;accent-color:var(--pqh-primary,#2166d1);cursor:pointer}
.pqhlogin-forgot{font-size:.85rem;font-weight:600;color:var(--pqh-accent,#4d8be0);text-decoration:none}
.pqhlogin-forgot:hover{text-decoration:underline}
.pqhlogin-note{margin-top:22px;font-size:.76rem;line-height:1.7;color:rgba(15,43,71,.62);opacity:.85}
@media(prefers-reduced-motion:reduce){.pqhlogin-card{animation:none}.pqhlogin-btn{transition:none}}
</style>
<main class="pqhlogin-shell" style="--pqh-primary: <?php echo s($primarycolor); ?>; --pqh-accent: <?php echo s($accentcolor); ?>;">
  <div class="pqhlogin-card" aria-label="<?php echo s($brand); ?> login">
    <div class="pqhlogin-brand">
      <span class="pqhlogin-brand-mark">
        <?php if ($brandlogo !== ''): ?>
          <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brand); ?> logo">
        <?php else: ?>
          <img src="/local/hubredirect/pix/login-crest-default.png" alt="<?php echo s($brand); ?> logo">
        <?php endif; ?>
      </span>
      <div>
        <strong><?php echo s($brand); ?></strong>
        <small><?php echo s($kicker); ?></small>
      </div>
    </div>
    <h1>Log in</h1>
    <p class="pqhlogin-sub"><?php echo s($panelcopy); ?></p>
    <?php if ($sessionexpired): ?>
      <div class="pqhlogin-alert">Your session expired. Please sign in again to continue.</div>
    <?php endif; ?>
    <form action="<?php echo $loginurl->out(false); ?>" method="post">
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
      <button class="pqhlogin-btn pqhlogin-btn--primary" type="submit"><?php echo s($submittext); ?></button>
      <div class="pqhlogin-row">
        <label class="pqhlogin-remember"><input type="checkbox" name="rememberusername"> <span>Remember me</span></label>
        <a class="pqhlogin-forgot" href="<?php echo $forgoturl->out(false); ?>">Forgot password?</a>
      </div>
    </form>
    <p class="pqhlogin-note"><?php echo s($mutedtext); ?></p>
  </div>
</main>
<?php
echo $OUTPUT->footer();
