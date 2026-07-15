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
$supporttype = clean_param(optional_param('supporttype', optional_param('support_type', '', PARAM_RAW_TRIMMED), PARAM_RAW_TRIMMED), PARAM_ALPHANUMEXT);
if (!in_array($supporttype, ['student_helpdesk', 'student_teacher', 'parent_teacher'], true)) {
    $supporttype = $studentid > 0 ? 'student_helpdesk' : 'parent_teacher';
}
$conversationid = optional_param('conversationid', optional_param('threadid', 0, PARAM_INT), PARAM_INT);
$view = optional_param('view', 'open', PARAM_ALPHA);
if (!in_array($view, ['open', 'new'], true)) {
    $view = 'open';
}

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
    'view' => $view,
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
$cachekey = 'support-livechat-20260713b';
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
.pqh-support-fallback {
  padding: 18px;
}
.pqh-support-fallback__panel {
  max-width: 620px;
  border: 1px solid rgba(18, 48, 71, .12);
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}
.pqh-support-fallback__title {
  margin: 0 0 6px;
  color: #173044;
  font-size: 20px;
  font-weight: 900;
}
.pqh-support-fallback__muted,
.pqh-support-fallback__status {
  color: #536878;
  font-size: 14px;
  font-weight: 750;
}
.pqh-support-fallback__form {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}
.pqh-support-fallback__field {
  display: grid;
  gap: 5px;
  color: #536878;
  font-size: 13px;
  font-weight: 900;
}
.pqh-support-fallback__input,
.pqh-support-fallback__select,
.pqh-support-fallback__textarea {
  width: 100%;
  border: 1px solid rgba(18, 48, 71, .16);
  border-radius: 8px;
  padding: 9px 10px;
  color: #173044;
  font: 750 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.pqh-support-fallback__textarea {
  min-height: 110px;
  resize: vertical;
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
  <div class="pqh-support-host" id="pqhSupportHost" aria-live="polite"></div>
</div>
<script>
window.__prequran_ws_token = <?php echo json_encode($wstoken); ?>;
window.__prequran_ws_endpoint = <?php echo json_encode($wsendpoint); ?>;
window.__prequran_moodle_origin = <?php echo json_encode(rtrim((string)$CFG->wwwroot, '/')); ?>;
window.__prequran_uid = <?php echo (int)$USER->id; ?>;
window.__prequran_consumerid = <?php echo (int)($consumercontext->consumerid ?? 0); ?>;
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
  function fallbackHost() {
    return document.getElementById('pqhSupportHost');
  }
  function fallbackType() {
    var type = String(window.__prequran_support_type || '').toLowerCase();
    if (type === 'student_helpdesk' || type === 'student_teacher' || type === 'parent_teacher') return type;
    return 'student_helpdesk';
  }
  function fallbackTypeLabel(type) {
    if (type === 'student_teacher') return 'Student to teacher';
    if (type === 'parent_teacher') return 'Parent to teacher';
    return 'Student help desk';
  }
  function fallbackRender(formMode, message) {
    var host = fallbackHost();
    if (!host) return;
    host.innerHTML = [
      '<div class="pqh-support-fallback">',
      '<section class="pqh-support-fallback__panel">',
      '<h3 class="pqh-support-fallback__title">Support</h3>',
      '<p class="pqh-support-fallback__muted">The full support panel has not loaded yet. You can still send a help request here.</p>',
      message ? '<p class="pqh-support-fallback__status">' + message + '</p>' : '',
      formMode ? fallbackFormHtml() : '<button type="button" class="pqh-support-btn" id="pqhSupportFallbackNew">New Request</button>',
      '</section>',
      '</div>'
    ].join('');
    var fallbackNew = document.getElementById('pqhSupportFallbackNew');
    if (fallbackNew) fallbackNew.addEventListener('click', function () { fallbackRender(true, ''); });
    var form = document.getElementById('pqhSupportFallbackForm');
    if (form) {
      var typeInput = form.elements.namedItem('type');
      if (typeInput) typeInput.value = fallbackType();
      form.addEventListener('submit', fallbackSubmit);
    }
  }
  function fallbackFormHtml() {
    var type = fallbackType();
    return [
      '<form class="pqh-support-fallback__form" id="pqhSupportFallbackForm">',
      '<label class="pqh-support-fallback__field">Request type',
      '<input type="hidden" name="type" value="' + type + '">',
      '<input class="pqh-support-fallback__input" value="' + fallbackTypeLabel(type) + '" disabled></label>',
      '<label class="pqh-support-fallback__field">Subject',
      '<input class="pqh-support-fallback__input" name="subject" maxlength="120" value="Help request"></label>',
      '<label class="pqh-support-fallback__field">Message',
      '<textarea class="pqh-support-fallback__textarea" name="body" maxlength="1200" required></textarea></label>',
      '<div class="pqh-support-fallback__status" id="pqhSupportFallbackStatus"></div>',
      '<button type="submit" class="pqh-support-btn">Send request</button>',
      '</form>'
    ].join('');
  }
  function fallbackSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var status = document.getElementById('pqhSupportFallbackStatus');
    var bodyInput = form.elements.namedItem('body');
    var subjectInput = form.elements.namedItem('subject');
    var typeInput = form.elements.namedItem('type');
    var body = bodyInput ? bodyInput.value.trim() : '';
    if (!body) {
      status.textContent = 'Type a message first.';
      return;
    }
    if (!window.__prequran_ws_token) {
      status.textContent = 'Support token is missing. Please refresh or sign in again.';
      return;
    }
    status.textContent = 'Sending...';
    var params = new URLSearchParams();
    params.set('wstoken', window.__prequran_ws_token);
    params.set('wsfunction', 'local_prequran_support_start_conversation');
    params.set('moodlewsrestformat', 'json');
    params.set('type', typeInput && typeInput.value ? typeInput.value : fallbackType());
    params.set('workspaceid', String(window.__prequran_workspaceid || 0));
    params.set('consumerid', String(window.__prequran_consumerid || 0));
    params.set('studentid', String(window.__prequran_studentid || window.__prequran_uid || 0));
    params.set('teacherid', String(window.__prequran_teacherid || 0));
    params.set('subject', subjectInput && subjectInput.value.trim() ? subjectInput.value.trim() : 'Help request');
    params.set('body', body);
    params.set('category', 'other');
    params.set('priority', 'normal');
    params.set('contextjson', JSON.stringify({ route: location.pathname, title: document.title || '' }));
    fetch(window.__prequran_ws_endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params.toString()
    }).then(function (res) {
      return res.json();
    }).then(function (res) {
      if (!res || res.exception) throw new Error(res && res.message ? res.message : 'Unable to send request.');
      if (res.ok !== true) throw new Error(res.message || 'Support is not ready yet.');
      var id = res.conversation && res.conversation.id ? res.conversation.id : 0;
      fallbackRender(false, id ? 'Request sent. Conversation #' + id + ' was created.' : 'Request sent.');
    }).catch(function (err) {
      status.textContent = err && err.message ? err.message : 'Unable to send request.';
    });
  }
  function openSupport() {
    if (window.PQSupportPanel && window.PQSupportPanel.open) {
      window.PQSupportPanel.open();
      return;
    }
    fallbackRender(false, '');
  }
  function newRequest() {
    if (window.PQSupportPanel && window.PQSupportPanel.open) {
      window.PQSupportPanel.open();
      setTimeout(function () {
        if (window.PQSupportPanel.newRequest) window.PQSupportPanel.newRequest();
      }, 100);
      return;
    }
    fallbackRender(true, '');
  }
  document.getElementById('pqhSupportOpenBtn').addEventListener('click', openSupport);
  document.getElementById('pqhSupportNewBtn').addEventListener('click', newRequest);
  setTimeout(function () {
    <?php if ($view === 'new'): ?>
    newRequest();
    <?php else: ?>
    openSupport();
    <?php endif; ?>
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
