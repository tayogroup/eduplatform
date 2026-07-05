<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/session_expired.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Session Expired');
$PAGE->set_heading('Session Expired');
$PAGE->add_body_class('pqh-session-expired-page');

$consumercontext = pqh_requested_consumer_context();
$consumerparams = [];
$consumerslug = trim((string)($consumercontext->consumerslug ?? ''));
$workspaceid = (int)($consumercontext->workspaceid ?? 0);
if ($consumerslug !== '') {
    $consumerparams['consumer'] = $consumerslug;
}
if ($workspaceid > 0) {
    $consumerparams['workspaceid'] = $workspaceid;
}
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';
$copy = json_decode((string)($consumercontext->copyjson ?? ''), true);
$copy = is_array($copy) ? $copy : [];
$brandinitialsource = preg_replace('/[^a-z0-9]/i', '', $brandname);
$brandinitial = core_text::strtoupper(core_text::substr((string)$brandinitialsource, 0, 1));
if ($brandinitial === '') {
    $brandinitial = 'E';
}
$publicpath = (string)($consumercontext->defaultpublicpath ?? '/');
if ((string)($consumercontext->consumer_type ?? '') === 'platform_foundation') {
    $publicpath = '/local/hubredirect/platform_landing.php';
}
if ($publicpath === '' || $publicpath === '/') {
    $publicpath = '/';
}

$loginpath = trim((string)($copy['default_login_path'] ?? '/local/hubredirect/consumer_login.php'));
$loginpath = '/' . ltrim(str_replace('\\', '/', $loginpath), '/');
if ($loginpath === '/' || strpos($loginpath, '//') === 0 || preg_match('/^\/?https?:/i', $loginpath)) {
    $loginpath = '/local/hubredirect/consumer_login.php';
}
$loginurl = new moodle_url($loginpath, $consumerparams + ['sessionexpired' => 1]);
$homeurl = new moodle_url($publicpath, $consumerparams);

echo $OUTPUT->header();
?>
<style>
body.pqh-session-expired-page header,
body.pqh-session-expired-page footer,
body.pqh-session-expired-page nav.navbar,
body.pqh-session-expired-page #page-header,
body.pqh-session-expired-page #page-footer,
body.pqh-session-expired-page .drawer,
body.pqh-session-expired-page .drawer-toggles,
body.pqh-session-expired-page .block-region,
body.pqh-session-expired-page [data-region="drawer"],
body.pqh-session-expired-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-session-expired-page #page,
body.pqh-session-expired-page #page-content,
body.pqh-session-expired-page #region-main,
body.pqh-session-expired-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
body.pqh-session-expired-page{background:#f4f7fb!important}
.pqhs-shell{min-height:100vh;padding:42px 18px;background:linear-gradient(180deg,#f1fff4 0,#fff 50%,#fff7e7 100%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#17324a}
.pqhs-wrap{max-width:820px;margin:0 auto}
.pqhs-top{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.pqhs-mark{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#6f4e32;color:#fff;font-weight:950;box-shadow:0 12px 28px rgba(111,78,50,.18)}
.pqhs-brand{margin:0;color:#4d3522;font-size:21px;font-weight:950}
.pqhs-card{padding:32px;border-radius:18px;background:#fff;border:1px solid rgba(111,78,50,.14);box-shadow:0 18px 46px rgba(105,76,45,.10)}
.pqhs-pill{display:inline-flex;align-items:center;min-height:30px;padding:0 12px;border-radius:999px;background:#fff4dc;color:#6f4e32;font-size:13px;font-weight:950}
.pqhs-title{margin:16px 0 10px;color:#4d3522;font-size:34px;line-height:1.1;font-weight:950}
.pqhs-message{margin:0;color:#5f734e;font-size:17px;line-height:1.55;font-weight:760}
.pqhs-panel{margin-top:18px;padding:16px;border:1px dashed rgba(111,78,50,.22);border-radius:12px;background:#fbfff7;color:#526747;font-weight:800;line-height:1.5}
.pqhs-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.pqhs-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:10px;background:#3f8a55;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqhs-btn--light{background:#eef4f6;color:#17324a!important;border:1px solid rgba(23,48,68,.12)}
.pqhs-note{margin:16px 0 0;color:#70806c;font-size:13px;font-weight:700}
@media(max-width:620px){.pqhs-shell{padding:24px 14px}.pqhs-card{padding:22px}.pqhs-title{font-size:26px}.pqhs-actions{display:grid}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqhs-shell">
  <div class="pqhs-wrap">
    <div class="pqhs-top pqh-workspace-top">
      <div class="pqhs-mark"><?php echo s($brandinitial); ?></div>
      <p class="pqhs-brand"><?php echo s($brandname); ?></p>
    </div>
    <section class="pqhs-card" aria-live="polite">
      <span class="pqhs-pill">Session timeout</span>
      <h1 class="pqhs-title pqh-workspace-title">Your session has expired</h1>
      <p class="pqhs-message">For security, we signed you out after a period of inactivity. Please log in again to continue.</p>
      <div class="pqhs-panel">Your progress is protected. After logging in, use the dashboard or live-session links to return to where you were working.</div>
      <div class="pqhs-actions pqh-workspace-actions">
        <a class="pqhs-btn" href="<?php echo $loginurl->out(false); ?>">Log in again</a>
        <a class="pqhs-btn pqhs-btn--light" href="<?php echo $homeurl->out(false); ?>">Go to home</a>
      </div>
      <p class="pqhs-note">If this keeps happening quickly, ask an administrator to review the Moodle session timeout setting.</p>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
