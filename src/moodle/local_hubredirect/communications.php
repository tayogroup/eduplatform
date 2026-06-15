<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->libdir . '/externallib.php');

$context = context_system::instance();
$cohortid = optional_param('cohortid', 0, PARAM_INT);
$studentid = optional_param('studentid', optional_param('childid', 0, PARAM_INT), PARAM_INT);
$tab = optional_param('tab', '', PARAM_ALPHANUMEXT);
$opencomm = optional_param('opencomm', '', PARAM_ALPHANUMEXT);
$threadid = optional_param('threadid', 0, PARAM_INT);
if ($opencomm === '') {
    $opencomm = $tab;
}
if ($opencomm === 'message') {
    $opencomm = 'messages';
}
if ($opencomm === 'announcement') {
    $opencomm = 'announcements';
}
if (!in_array($opencomm, ['messages', 'announcements'], true)) {
    $opencomm = 'messages';
}

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/communications.php', [
    'cohortid' => $cohortid,
    'studentid' => $studentid,
    'opencomm' => $opencomm,
    'threadid' => $threadid,
]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Quraan Academy Communications');
$PAGE->set_heading('Quraan Academy Communications');
$PAGE->add_body_class('pqh-comm-standalone-page');

function pqh_comm_current_user_ws_token(string $fallback = ''): string {
    global $DB;

    try {
        $service = $DB->get_record('external_services', [
            'shortname' => 'prequran_ws',
            'enabled' => 1,
        ]);
        if (!$service || !function_exists('external_generate_token_for_current_user')) {
            return $fallback;
        }

        $token = external_generate_token_for_current_user($service);
        if (is_object($token) && !empty($token->token)) {
            return (string)$token->token;
        }
    } catch (Throwable $e) {
        return $fallback;
    }

    return $fallback;
}

$wstoken = pqh_comm_current_user_ws_token((string)get_config('local_prequran', 'ws_token'));
$cdnbase = defined('HUB_CDN_BASE') ? HUB_CDN_BASE : 'https://quraanacademy.b-cdn.net';
$assetpath = optional_param('assetpath', '', PARAM_ALPHANUMEXT);
if ($assetpath === 'staging') {
    $assetbase = rtrim($cdnbase, '/') . '/pre_quraan_staging';
} else {
    $assetbase = rtrim($cdnbase, '/') . '/pre_quraan';
}
$cachekey = 'comm-dashboard-scoped-actor-20260521';
$wsendpoint = 'https://quraan.academy/webservice/rest/server.php';
$commts = time();
$commscope = $studentid > 0 ? $studentid : 0;
$commsecret = (string)($CFG->passwordsaltmain ?? '') . '|' . (string)get_config('local_prequran', 'ws_token');
$commsig = hash_hmac('sha256', (int)$USER->id . '|' . $commscope . '|' . $commts, $commsecret);

echo $OUTPUT->header();
?>
<link rel="stylesheet" href="<?php echo s($assetbase); ?>/shared/css/communications.css?v=<?php echo s($cachekey); ?>">
<style>
body.pqh-comm-standalone-page header,
body.pqh-comm-standalone-page nav.navbar,
body.pqh-comm-standalone-page #page-header,
body.pqh-comm-standalone-page #page-footer,
body.pqh-comm-standalone-page .navbar,
body.pqh-comm-standalone-page .primary-navigation,
body.pqh-comm-standalone-page .secondary-navigation,
body.pqh-comm-standalone-page .drawer-toggles,
body.pqh-comm-standalone-page [data-region="drawer"],
body.pqh-comm-standalone-page [data-region="right-hand-drawer"],
body.pqh-comm-standalone-page [data-region="popover-region-container"],
body.pqh-comm-standalone-page .footer-popover,
body.pqh-comm-standalone-page .btn-footer-popover,
body.pqh-comm-standalone-page .floating-buttons,
body.pqh-comm-standalone-page .block-region,
body.pqh-comm-standalone-page .block-region-side-pre,
body.pqh-comm-standalone-page .block-region-side-post {
  display: none !important;
}
body.pqh-comm-standalone-page #page,
body.pqh-comm-standalone-page #page-content,
body.pqh-comm-standalone-page #region-main,
body.pqh-comm-standalone-page .main-inner {
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
}
body.pqh-comm-standalone-page {
  background: #f4f8fb;
}
.pqh-comm-host {
  min-height: 100vh;
  background: #f4f8fb;
}
.pqh-comm-host__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 22px;
  background: #fff;
  border-bottom: 1px solid rgba(18, 48, 71, .12);
}
.pqh-comm-host__title {
  margin: 0;
  color: #153044;
  font: 950 22px/1.15 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__back {
  min-height: 38px;
  padding: 0 13px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  background: #eef5f7;
  color: #153044 !important;
  border: 1px solid rgba(18, 48, 71, .14);
  text-decoration: none;
  font: 900 14px/1 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__empty {
  margin: 48px auto;
  max-width: 560px;
  padding: 22px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(18, 48, 71, .12);
  color: #4d6474;
  font: 800 15px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
.pqh-comm-host__status[hidden] {
  display: none !important;
}
.pqh-comm-host__status {
  margin: 22px auto 0;
  max-width: 760px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(18, 48, 71, .14);
  color: #4d6474;
  font: 800 13px/1.45 system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
body.pqh-comm-standalone-page .pq-comm-panel__scrim {
  display: none;
}
body.pqh-comm-standalone-page .pq-comm-panel__sheet {
  top: 76px;
  right: max(16px, calc((100vw - 760px) / 2));
  bottom: 18px;
  width: min(760px, calc(100vw - 32px));
  box-shadow: 0 18px 40px rgba(23, 50, 74, .16);
}
body.pqh-comm-standalone-page .pq-comm-panel__close {
  display: none;
}
@media(max-width: 760px) {
  body.pqh-comm-standalone-page .pq-comm-panel__sheet {
    top: 70px;
    right: 0;
    left: 0;
    bottom: 0;
    width: auto;
    height: auto;
    border-radius: 8px 8px 0 0;
  }
}
</style>
<main class="pqh-comm-host">
  <div class="pqh-comm-host__bar">
    <h1 class="pqh-comm-host__title">Communications</h1>
    <a class="pqh-comm-host__back" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Back to dashboard</a>
  </div>
  <?php if ($wstoken === ''): ?>
    <div class="pqh-comm-host__empty">
      Communications are not ready for this account. Please check that this parent, student, or teacher has a linked communication relationship.
    </div>
  <?php else: ?>
    <div id="pqHeaderActionSlot" hidden></div>
    <div id="pqCommStandaloneStatus" class="pqh-comm-host__status">Loading communications...</div>
  <?php endif; ?>
</main>
<?php if ($wstoken !== ''): ?>
<script>
window.__prequran_ws_token = <?php echo json_encode($wstoken); ?>;
window.__prequran_ws_endpoint = <?php echo json_encode($wsendpoint); ?>;
window.__prequran_uid = <?php echo (int)$USER->id; ?>;
window.__prequran_cohortid = <?php echo (int)$cohortid; ?>;
window.__prequran_studentid = <?php echo (int)$studentid; ?>;
window.__prequran_open_threadid = <?php echo (int)$threadid; ?>;
window.__prequran_managed_student = '0';
window.__prequran_comm_asset_base = <?php echo json_encode($assetbase); ?>;
window.__prequran_comm_actorid = <?php echo (int)$USER->id; ?>;
window.__prequran_comm_scope_studentid = <?php echo (int)$commscope; ?>;
window.__prequran_comm_ts = <?php echo (int)$commts; ?>;
window.__prequran_comm_sig = <?php echo json_encode($commsig); ?>;
if (!new URLSearchParams(window.location.search).get('opencomm')) {
  const url = new URL(window.location.href);
  url.searchParams.set('opencomm', <?php echo json_encode($opencomm); ?>);
  window.history.replaceState(null, '', url.toString());
}
</script>
<script src="<?php echo s($assetbase); ?>/shared/js/shared-communications-panel.js?v=<?php echo s($cachekey); ?>"></script>
<script>
(function() {
  var status = document.getElementById('pqCommStandaloneStatus');
  function show(message) {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
  }
  function hide() {
    if (status) status.hidden = true;
  }
  var tab = <?php echo json_encode($opencomm === 'messages' ? 'parent_teacher' : 'announcement'); ?>;
  if (!window.PQAnnouncementsPanel) {
    show('Communications script did not load from ' + (window.__prequran_comm_asset_base || 'the CDN') + '. Refresh the page after clearing cache, or confirm the Bunny staging assets are reachable.');
    return;
  }
  try {
    window.PQAnnouncementsPanel.open(tab);
    setTimeout(function() {
      var panel = document.getElementById('pqAnnouncementsPanel');
      if (!panel || panel.hidden) {
        show('Communications loaded, but the panel did not open. Please refresh once; if this remains, check the browser console for a JavaScript error.');
        return;
      }
      hide();
    }, 700);
  } catch (error) {
    show(error && error.message ? error.message : 'Unable to open communications.');
  }
})();
</script>
<?php endif; ?>
<?php
echo $OUTPUT->footer();
