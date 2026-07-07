<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_session_guide.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Live Session Guide');
$PAGE->set_heading('Live Session Guide');
$PAGE->add_body_class('pqh-live-guide-page');

$videourl = pqh_live_session_explainer_media_url()->out(false);
$dashboardurl = (new moodle_url('/local/hubredirect/dashboard.php'))->out(false);

echo $OUTPUT->header();
?>
<style>
body.pqh-live-guide-page header,
body.pqh-live-guide-page footer,
body.pqh-live-guide-page nav.navbar,
body.pqh-live-guide-page #page-header,
body.pqh-live-guide-page #page-footer,
body.pqh-live-guide-page .drawer,
body.pqh-live-guide-page .drawer-toggles,
body.pqh-live-guide-page .block-region,
body.pqh-live-guide-page [data-region="drawer"],
body.pqh-live-guide-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-guide-page #page,
body.pqh-live-guide-page #page-content,
body.pqh-live-guide-page #region-main,
body.pqh-live-guide-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqh-guide-shell{min-height:100vh;padding:24px 18px 42px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqh-guide-wrap{max-width:1160px;margin:0 auto}
.pqh-guide-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px;padding:18px 20px;border:1px solid rgba(23,48,68,.12);border-radius:12px;background:#fff;box-shadow:0 12px 26px rgba(23,48,68,.06)}
.pqh-guide-title{margin:0;font-size:28px;line-height:1.12;font-weight:950;color:#221b22}
.pqh-guide-sub{margin:6px 0 0;color:#60735f;font-size:14px;font-weight:800}
.pqh-guide-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap}
.pqh-guide-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#eef7ee;color:#173044!important;text-decoration:none!important;font-size:13px;font-weight:950;cursor:pointer}
.pqh-guide-btn:hover{background:#e1f2e1;border-color:rgba(47,111,78,.24)}
.pqh-guide-btn--close{background:#d6a642!important;border-color:#d6a642!important;color:#221b22!important}
.pqh-guide-btn--close:hover{background:#c89632!important;border-color:#c89632!important}
.pqh-guide-video{overflow:hidden;border:1px solid rgba(23,48,68,.14);border-radius:12px;background:#0d1b2a;box-shadow:0 18px 40px rgba(23,48,68,.14)}
.pqh-guide-video video{display:block;width:100%;height:auto;max-height:calc(100vh - 170px);background:#0d1b2a}
@media(max-width:760px){.pqh-guide-top{display:block}.pqh-guide-actions{justify-content:flex-start;margin-top:12px}.pqh-guide-title{font-size:24px}.pqh-guide-video video{max-height:none}}
</style>
<main class="pqh-guide-shell">
  <div class="pqh-guide-wrap">
    <section class="pqh-guide-top" aria-label="Live session guide controls">
      <div>
        <h1 class="pqh-guide-title">Live Session Guide</h1>
        <p class="pqh-guide-sub">A short walkthrough for opening Live Sessions, joining audio, and using the lesson and tutor windows.</p>
      </div>
      <div class="pqh-guide-actions">
        <button class="pqh-guide-btn pqh-guide-btn--close" type="button" id="pqhGuideClose">Close</button>
        <a class="pqh-guide-btn" href="<?php echo s($dashboardurl); ?>">Dashboard</a>
      </div>
    </section>
    <section class="pqh-guide-video" aria-label="Live session guide video">
      <video controls autoplay playsinline src="<?php echo s($videourl); ?>"></video>
    </section>
  </div>
</main>
<script>
(function() {
  var closeBtn = document.getElementById('pqhGuideClose');
  if (!closeBtn) return;
  closeBtn.addEventListener('click', function() {
    window.close();
    window.setTimeout(function() {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = <?php echo json_encode($dashboardurl); ?>;
      }
    }, 120);
  });
})();
</script>
<?php
echo $OUTPUT->footer();
