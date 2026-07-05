<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->libdir . '/externallib.php');

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$studentid = optional_param('studentid', optional_param('childid', 0, PARAM_INT), PARAM_INT);
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$supporttype = optional_param('supporttype', optional_param('support_type', '', PARAM_ALPHANUMEXT), PARAM_ALPHANUMEXT);
$conversationid = optional_param('conversationid', optional_param('threadid', 0, PARAM_INT), PARAM_INT);

$contextparams = [];
if (!empty($consumercontext->consumerslug)) {
    $contextparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $contextparams['workspaceid'] = $workspaceid;
}

$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'EduPlatform';

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/support.php', $contextparams + [
    'studentid' => $studentid,
    'teacherid' => $teacherid,
    'supporttype' => $supporttype,
    'conversationid' => $conversationid,
]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brandname . ' Support');
$PAGE->set_heading($brandname . ' Support');
$PAGE->add_body_class('pqh-support-page');

function pqh_support_current_user_ws_token(string $fallback = ''): string {
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

$wstoken = pqh_support_current_user_ws_token((string)get_config('local_prequran', 'ws_token'));
$cdnbase = pqh_shared_resource_cdn_base_url();
$assetpath = optional_param('assetpath', '', PARAM_ALPHANUMEXT);
$assetbase = rtrim($cdnbase, '/') . ($assetpath === 'staging' ? '/pre_quraan_staging' : '/pre_quraan');
$cachekey = 'support-phase3-20260703a';
$wsendpoint = rtrim((string)$CFG->wwwroot, '/') . '/webservice/rest/server.php';

echo $OUTPUT->header();
?>
<link rel="stylesheet" href="<?php echo s($assetbase); ?>/shared/css/support.css?v=<?php echo s($cachekey); ?>">
<style>
.pqh-support-shell {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 44px;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
.pqh-support-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(18, 48, 71, .12);
  border-radius: 8px;
  background: #fff;
}
.pqh-support-title {
  margin: 0;
  color: #173044;
  font-size: 24px;
  font-weight: 900;
}
.pqh-support-sub {
  margin: 6px 0 0;
  color: #536878;
  font-size: 14px;
  font-weight: 750;
}
.pqh-support-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pqh-support-btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(18, 48, 71, .14);
  background: #173044;
  color: #fff;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
}
.pqh-support-host {
  min-height: 520px;
  margin-top: 14px;
  border: 1px dashed rgba(18, 48, 71, .20);
  border-radius: 8px;
  background: #f8fbfd;
}
</style>
<div class="pqh-support-shell">
  <section class="pqh-support-hero" aria-label="Support">
    <div>
      <h2 class="pqh-support-title"><?php echo s($brandname); ?> Support</h2>
      <p class="pqh-support-sub">Open help conversations, create a request, and continue replies.</p>
    </div>
    <div class="pqh-support-actions">
      <button type="button" class="pqh-support-btn" id="pqhSupportOpenBtn">Open Support</button>
      <button type="button" class="pqh-support-btn" id="pqhSupportNewBtn">New Request</button>
      <?php if (is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportreports', $context)): ?>
        <a class="pqh-support-btn" href="<?php echo (new moodle_url('/local/hubredirect/support_reports.php', $contextparams))->out(false); ?>">Reports</a>
      <?php endif; ?>
      <?php if (is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportaudit', $context)): ?>
        <a class="pqh-support-btn" href="<?php echo (new moodle_url('/local/hubredirect/support_audit.php', $contextparams))->out(false); ?>">Audit</a>
      <?php endif; ?>
    </div>
  </section>
  <div class="pqh-support-host" aria-hidden="true"></div>
</div>
<script>
window.__prequran_ws_token = <?php echo json_encode($wstoken); ?>;
window.__prequran_ws_endpoint = <?php echo json_encode($wsendpoint); ?>;
window.__prequran_moodle_origin = <?php echo json_encode(rtrim((string)$CFG->wwwroot, '/')); ?>;
window.__prequran_uid = <?php echo (int)$USER->id; ?>;
window.__prequran_workspaceid = <?php echo (int)$workspaceid; ?>;
window.__prequran_studentid = <?php echo (int)$studentid; ?>;
window.__prequran_teacherid = <?php echo (int)$teacherid; ?>;
window.__prequran_support_type = <?php echo json_encode($supporttype); ?>;
window.__prequran_support_staff = <?php echo (is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportviewqueue', $context)) ? 'true' : 'false'; ?>;
window.__prequran_support_can_convert = <?php echo (is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportconvert', $context)) ? 'true' : 'false'; ?>;
</script>
<script src="<?php echo s($assetbase); ?>/shared/js/shared-support-panel.js?v=<?php echo s($cachekey); ?>"></script>
<script>
(function () {
  function openSupport() {
    if (window.PQSupportPanel && window.PQSupportPanel.open) window.PQSupportPanel.open();
  }
  function newRequest() {
    if (window.PQSupportPanel && window.PQSupportPanel.open) {
      window.PQSupportPanel.open();
      setTimeout(function () {
        if (window.PQSupportPanel.newRequest) window.PQSupportPanel.newRequest();
      }, 100);
    }
  }
  document.getElementById('pqhSupportOpenBtn').addEventListener('click', openSupport);
  document.getElementById('pqhSupportNewBtn').addEventListener('click', newRequest);
  setTimeout(function () {
    openSupport();
    <?php if ($conversationid > 0): ?>
    setTimeout(function () {
      if (window.PQSupportPanel && window.PQSupportPanel.openConversation) {
        window.PQSupportPanel.openConversation(<?php echo (int)$conversationid; ?>);
      }
    }, 300);
    <?php endif; ?>
  }, 250);
})();
</script>
<?php
echo $OUTPUT->footer();
