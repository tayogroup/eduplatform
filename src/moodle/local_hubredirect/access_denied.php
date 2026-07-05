<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$message = optional_param('message', 'This page is not ready for your account right now.', PARAM_TEXT);
$title = optional_param('title', 'Not available right now', PARAM_TEXT);
$return = optional_param('return', '', PARAM_LOCALURL);
$consumercontext = pqh_requested_consumer_context();
$consumerparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $consumerparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}
$consumername = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';
$consumerinitial = core_text::strtoupper(core_text::substr($consumername, 0, 1));

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/access_denied.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($title);
$PAGE->set_heading($title);
$PAGE->add_body_class('pqh-access-page');

$dashboardpath = (string)($consumercontext->defaultdashboardpath ?? '');
if ($dashboardpath === '') {
    $dashboardpath = !empty($consumerparams['workspaceid']) ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/platform_dashboard.php';
}
if (!empty($consumerparams['workspaceid']) && $dashboardpath === '/local/hubredirect/dashboard.php') {
    $dashboardpath = '/local/hubredirect/workspace_dashboard.php';
}
$dashboardurl = new moodle_url($dashboardpath, $consumerparams);
$returnurl = $return !== '' ? new moodle_url($return) : $dashboardurl;

echo $OUTPUT->header();
?>
<style>
body.pqh-access-page header,
body.pqh-access-page footer,
body.pqh-access-page nav.navbar,
body.pqh-access-page #page-header,
body.pqh-access-page #page-footer,
body.pqh-access-page .drawer,
body.pqh-access-page .drawer-toggles,
body.pqh-access-page .block-region,
body.pqh-access-page [data-region="drawer"],
body.pqh-access-page [data-region="right-hand-drawer"],
body.pqh-access-page .usertour,
body.pqh-access-page .tool_usertours-resettourcontainer{display:none!important}
body.pqh-access-page #page,
body.pqh-access-page #page-content,
body.pqh-access-page #region-main,
body.pqh-access-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
body.pqh-access-page{background:#f4f7fb!important}
.pqha-shell{min-height:100vh;padding:42px 18px;background:linear-gradient(180deg,#f1fff4 0,#fff 48%,#fff7e7 100%);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#17324a}
.pqha-wrap{max-width:860px;margin:0 auto}
.pqha-top{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.pqha-mark{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#6f4e32;color:#fff;font-weight:950}
.pqha-brand{margin:0;color:#4d3522;font-size:20px;font-weight:950}
.pqha-card{padding:30px;border-radius:18px;background:#fff;border:1px solid rgba(111,78,50,.14);box-shadow:0 18px 46px rgba(105,76,45,.10)}
.pqha-pill{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border-radius:999px;background:#eaffea;color:#3f8a55;font-size:13px;font-weight:950}
.pqha-title{margin:16px 0 10px;color:#4d3522;font-size:32px;line-height:1.1;font-weight:950}
.pqha-message{margin:0;color:#5f734e;font-size:17px;line-height:1.55;font-weight:760}
.pqha-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.pqha-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:10px;background:#3f8a55;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqha-btn--light{background:#eef4f6;color:#17324a!important;border:1px solid rgba(23,48,68,.12)}
.pqha-note{margin:16px 0 0;color:#70806c;font-size:13px;font-weight:700}
@media(max-width:620px){.pqha-shell{padding:24px 14px}.pqha-card{padding:22px}.pqha-title{font-size:25px}.pqha-actions{display:grid}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqha-shell">
  <div class="pqha-wrap">
    <div class="pqha-top pqh-workspace-top">
      <div class="pqha-mark"><?php echo s($consumerinitial); ?></div>
      <p class="pqha-brand"><?php echo s($consumername); ?></p>
    </div>
    <section class="pqha-card" aria-live="polite">
      <span class="pqha-pill"><?php echo s($consumername); ?></span>
      <h1 class="pqha-title pqh-workspace-title"><?php echo s($title); ?></h1>
      <p class="pqha-message"><?php echo s($message); ?></p>
      <div class="pqha-actions pqh-workspace-actions">
        <a class="pqha-btn" href="<?php echo $dashboardurl->out(false); ?>">Back to dashboard</a>
        <a class="pqha-btn pqha-btn--light" href="<?php echo $returnurl->out(false); ?>">Go back</a>
      </div>
      <p class="pqha-note">If this does not look right, please ask your parent, teacher, or <?php echo s($consumername); ?> support for help.</p>
    </section>
  </div>
</main>
<script>
(function() {
  function removeCourseStartingDateModal() {
    var found = false;
    var headings = Array.prototype.slice.call(document.querySelectorAll('.modal-title, .modal-header h1, .modal-header h2, .modal-header h3, h1, h2, h3'));
    headings.forEach(function(heading) {
      if ((heading.textContent || '').trim().toLowerCase() !== 'course starting date') {
        return;
      }
      found = true;
      var modal = heading.closest('.modal, [role="dialog"]');
      if (modal) {
        modal.remove();
      }
    });
    if (!found) {
      return;
    }
    document.querySelectorAll('.modal-backdrop, .modal-backdrop.show').forEach(function(backdrop) {
      backdrop.remove();
    });
    if (!document.querySelector('.modal.show, [role="dialog"][aria-modal="true"]')) {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  }
  removeCourseStartingDateModal();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeCourseStartingDateModal, {once: true});
  }
  if (document.documentElement) {
    new MutationObserver(removeCourseStartingDateModal).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
</script>
<?php
echo $OUTPUT->footer();
