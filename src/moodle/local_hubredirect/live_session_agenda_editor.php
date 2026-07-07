<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$return = optional_param('return', '', PARAM_LOCALURL);
$returnurl = $return !== '' ? new moodle_url($return) : new moodle_url($workspaceid > 0 ? '/local/hubredirect/live_sessions.php' : '/local/hubredirect/live_teacher.php', $urlparams);

if (!pqh_table_exists_safe('local_prequran_live_session')) {
    pqh_access_denied('Live session tables are not installed.', $returnurl, 'Agenda editor unavailable');
}
$session = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
if (!$session) {
    pqh_access_denied('Choose a valid live session before editing agenda slides.', $returnurl, 'Agenda editor unavailable');
}
if ($workspaceid <= 0 && !empty($session->workspaceid)) {
    $workspaceid = (int)$session->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
}
if (!pqh_live_session_user_can_manage_agenda($session, (int)$USER->id)) {
    pqh_access_denied('Only the session teacher and academy admins can edit agenda slides.', $returnurl, 'Live-session agenda access required');
}

if (empty($session->agenda_slides_path)) {
    try {
        $session = pqh_attach_default_agenda_to_live_session($sessionid, (int)$USER->id) ?: $session;
    } catch (Throwable $e) {
        pqh_access_denied('The agenda template could not be prepared for online editing. Please ask support to review the agenda template storage setup.', $returnurl, 'Agenda editor unavailable');
    }
}

$docserver = rtrim(trim((string)get_config('local_prequran', 'onlyoffice_document_server_url')), '/');
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_session_agenda_editor.php', $urlparams + ['sessionid' => $sessionid]));
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Edit Live Session Agenda');
$PAGE->set_heading('Edit Live Session Agenda');
$PAGE->add_body_class('pqh-agenda-editor-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-agenda-editor-page header,
body.pqh-agenda-editor-page footer,
body.pqh-agenda-editor-page nav.navbar,
body.pqh-agenda-editor-page #page-header,
body.pqh-agenda-editor-page #page-footer,
body.pqh-agenda-editor-page .drawer,
body.pqh-agenda-editor-page .drawer-toggles,
body.pqh-agenda-editor-page .block-region{display:none!important}
body.pqh-agenda-editor-page #page,
body.pqh-agenda-editor-page #page-content,
body.pqh-agenda-editor-page #region-main,
body.pqh-agenda-editor-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqh-editor-shell{height:100vh;display:grid;grid-template-rows:auto 1fr;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqh-editor-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:#fff;border-bottom:1px solid rgba(23,48,68,.12)}
.pqh-editor-title{margin:0;font-size:16px;font-weight:950}
.pqh-editor-meta{margin:3px 0 0;color:#5e7280;font-size:12px;font-weight:800}
.pqh-editor-actions{display:flex;gap:8px;flex-wrap:wrap}
.pqh-editor-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:#eef7ee;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;border:1px solid rgba(23,48,68,.12)}
.pqh-editor-frame{min-height:0}
.pqh-editor-empty{max-width:760px;margin:42px auto;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;font-weight:850}
</style>
<main class="pqh-editor-shell">
  <section class="pqh-editor-top">
    <div>
      <h1 class="pqh-editor-title">Edit Live Session Agenda</h1>
      <p class="pqh-editor-meta"><?php echo s((string)$session->title); ?> - <?php echo s((string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx')); ?></p>
    </div>
    <div class="pqh-editor-actions">
      <a class="pqh-editor-btn" href="<?php echo (new moodle_url('/local/hubredirect/live_session_agenda_file.php', $urlparams + ['sessionid' => $sessionid]))->out(false); ?>">Download</a>
      <a class="pqh-editor-btn" href="<?php echo $returnurl->out(false); ?>">Back</a>
    </div>
  </section>
  <section class="pqh-editor-frame">
    <?php if ($docserver === ''): ?>
      <div class="pqh-editor-empty">Online agenda editing is not configured yet. Set the ONLYOFFICE document server URL in the PreQuraan Moodle plugin settings.</div>
    <?php else: ?>
      <div id="pqh-onlyoffice-editor" style="width:100%;height:100%"></div>
      <?php
        $key = pqh_live_session_agenda_signature($session);
        $filename = clean_filename((string)($session->agenda_slides_filename ?? 'Live Session Agenda template.pptx'));
        if ($filename === '') {
            $filename = 'Live Session Agenda template.pptx';
        }
        $sourceurl = pqh_live_session_agenda_source_url($sessionid, $key)->out(false);
        $callbackurl = pqh_live_session_agenda_callback_url($sessionid, $key)->out(false);
        $config = [
            'documentType' => 'slide',
            'type' => 'desktop',
            'width' => '100%',
            'height' => '100%',
            'document' => [
                'fileType' => strtolower(pathinfo($filename, PATHINFO_EXTENSION) ?: 'pptx'),
                'key' => substr(hash('sha256', $sessionid . '|' . (string)($session->agenda_slides_path ?? '') . '|' . (string)($session->agenda_slides_uploadedat ?? 0)), 0, 48),
                'title' => $filename,
                'url' => $sourceurl,
                'permissions' => [
                    'comment' => true,
                    'commentGroups' => [
                        'edit' => [''],
                        'remove' => [''],
                        'view' => '',
                    ],
                    'copy' => true,
                    'deleteCommentAuthorOnly' => false,
                    'download' => true,
                    'edit' => true,
                    'editCommentAuthorOnly' => false,
                    'fillForms' => true,
                    'modifyContentControl' => true,
                    'modifyFilter' => true,
                    'print' => true,
                    'review' => false,
                    'reviewGroups' => [''],
                ],
            ],
            'editorConfig' => [
                'mode' => 'edit',
                'callbackUrl' => $callbackurl,
                'lang' => current_language(),
                'user' => [
                    'group' => '',
                    'id' => (string)$USER->id,
                    'name' => fullname($USER),
                ],
                'customization' => [
                    'autosave' => true,
                    'forcesave' => true,
                    'compactToolbar' => false,
                    'help' => true,
                ],
            ],
        ];
        $jwtsecret = trim((string)get_config('local_prequran', 'onlyoffice_jwt_secret'));
        if ($jwtsecret !== '') {
            $config['token'] = pqh_jwt_hs256($config, $jwtsecret);
        }
      ?>
      <script src="<?php echo s($docserver); ?>/web-apps/apps/api/documents/api.js"></script>
      <script>
      window.PQH_ONLYOFFICE_CONFIG = <?php echo json_encode($config, JSON_UNESCAPED_SLASHES); ?>;
      window.PQH_ONLYOFFICE_EDITOR = new DocsAPI.DocEditor("pqh-onlyoffice-editor", window.PQH_ONLYOFFICE_CONFIG);
      </script>
    <?php endif; ?>
  </section>
</main>
<?php
echo $OUTPUT->footer();
