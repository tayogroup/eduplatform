<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/office_materials_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
$materialid = optional_param('materialid', 0, PARAM_INT);
$requestedmode = optional_param('mode', 'edit', PARAM_ALPHA);
$returnto = optional_param('returnto', '', PARAM_ALPHA);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$isstudenteditor = $workspaceid > 0
    && pqho_user_is_student_in_workspace((int)$USER->id, $workspaceid)
    && !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)
    && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$returnurl = $isstudenteditor
    ? new moodle_url('/local/hubredirect/teacher_office.php', $urlparams)
    : new moodle_url('/local/hubredirect/teacher_office.php', $urlparams);

if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
    pqh_access_denied('Workspace material table is not ready. Run the local_prequran Moodle upgrade.', $returnurl, 'Document editor unavailable');
}
$material = $materialid > 0 ? $DB->get_record('local_prequran_workspace_material', ['id' => $materialid, 'status' => 'active'], '*', IGNORE_MISSING) : false;
if (!$material) {
    pqh_access_denied('Choose a valid material before opening the editor.', $returnurl, 'Document editor unavailable');
}
if ($workspaceid <= 0) {
    $workspaceid = (int)$material->workspaceid;
    $urlparams['workspaceid'] = $workspaceid;
    $isstudenteditor = pqho_user_is_student_in_workspace((int)$USER->id, $workspaceid)
        && !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)
        && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
    $returnurl = new moodle_url('/local/hubredirect/teacher_office.php', $urlparams);
}
$canedit = pqho_user_can_edit_material($material, (int)$USER->id);
$canview = $canedit || pqwm_can_view_material($material, (int)$USER->id);
$readonly = $requestedmode === 'view' || !$canedit;
if ($returnto === 'homework' && $isstudenteditor) {
    $returnurl = new moodle_url('/local/hubredirect/student_homework.php', $urlparams);
}
if ((int)$material->workspaceid !== $workspaceid || !$canview) {
    pqh_access_denied('You cannot open this material.', $returnurl, 'Document material access required');
}
if (!pqho_material_editor_supported($material)) {
    pqh_access_denied('This material type cannot be opened online yet.', $returnurl, 'Document viewer unavailable');
}
if (!$readonly) {
    $material = pqho_repair_starter_material_if_needed($material);
}

$docserver = rtrim(trim((string)get_config('local_prequran', 'onlyoffice_document_server_url')), '/');
$filename = pqh_workspace_material_filename($material);
$key = pqho_material_signature($material);
$sourceurl = (new moodle_url('/local/hubredirect/office_material_source.php', $urlparams + ['materialid' => $materialid, 'key' => $key, 'v' => (int)($material->timemodified ?? time())]))->out(false);
$callbackurl = (new moodle_url('/local/hubredirect/office_material_callback.php', $urlparams + ['materialid' => $materialid, 'key' => $key]))->out(false);
$context = context_system::instance();
$PAGE->set_context($context);
$pageparams = $urlparams + ['materialid' => $materialid];
if ($readonly) {
    $pageparams['mode'] = 'view';
}
if ($returnto !== '') {
    $pageparams['returnto'] = $returnto;
}
$pagetitle = $readonly ? 'View Material' : 'Edit Material';
$PAGE->set_url(new moodle_url('/local/hubredirect/office_material_editor.php', $pageparams));
$PAGE->set_pagelayout('embedded');
$PAGE->set_title($pagetitle);
$PAGE->set_heading($pagetitle);
$PAGE->add_body_class('pqh-office-editor-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-office-editor-page header,body.pqh-office-editor-page footer,body.pqh-office-editor-page nav.navbar,body.pqh-office-editor-page #page-header,body.pqh-office-editor-page #page-footer,body.pqh-office-editor-page .drawer,body.pqh-office-editor-page .drawer-toggles,body.pqh-office-editor-page .block-region{display:none!important}
html:has(body.pqh-office-editor-page),body.pqh-office-editor-page{height:100%;overflow:hidden!important}
body.pqh-office-editor-page #page,body.pqh-office-editor-page #page-content,body.pqh-office-editor-page #region-main,body.pqh-office-editor-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhoe-shell{height:100vh;height:100dvh;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}.pqhoe-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:#fff;border-bottom:1px solid rgba(23,48,68,.12)}.pqhoe-title{margin:0;font-size:16px;font-weight:950}.pqhoe-meta{margin:3px 0 0;color:#5e7280;font-size:12px;font-weight:800}.pqhoe-actions{display:flex;gap:8px;flex-wrap:wrap}.pqhoe-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:#eef7ee;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950;border:1px solid rgba(23,48,68,.12)}.pqhoe-frame{min-height:0;overflow:hidden;position:relative}#pqh-onlyoffice-editor{width:100%!important;height:100%!important;min-height:0!important;overflow:hidden!important}.pqhoe-empty{max-width:760px;margin:42px auto;padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;font-weight:850}
</style>
<main class="pqhoe-shell">
  <section class="pqhoe-top">
    <div>
      <h1 class="pqhoe-title"><?php echo s((string)$material->title); ?></h1>
      <p class="pqhoe-meta"><?php echo s($filename); ?></p>
    </div>
    <div class="pqhoe-actions">
      <a class="pqhoe-btn" href="<?php echo (new moodle_url('/local/hubredirect/office_material_file.php', ['workspaceid' => $workspaceid, 'materialid' => $materialid]))->out(false); ?>">Download</a>
      <a class="pqhoe-btn" href="<?php echo $returnurl->out(false); ?>">Back</a>
    </div>
  </section>
  <section class="pqhoe-frame">
    <?php if ($docserver === ''): ?>
      <div class="pqhoe-empty">ONLYOFFICE is not configured yet. Set the document server URL in the PreQuraan Moodle plugin settings.</div>
    <?php else: ?>
      <div id="pqh-onlyoffice-editor" style="width:100%;height:100%"></div>
      <?php
        $config = [
            'documentType' => pqho_material_document_type($material),
            'type' => 'desktop',
            'width' => '100%',
            'height' => '100%',
            'document' => [
                'fileType' => strtolower(pathinfo($filename, PATHINFO_EXTENSION) ?: 'docx'),
                'key' => substr(hash('sha256', $materialid . '|' . pqh_workspace_material_bunny_path($material) . '|' . (string)($material->timemodified ?? 0)), 0, 48),
                'title' => $filename,
                'url' => $sourceurl,
                'permissions' => [
                    'comment' => !$readonly,
                    'copy' => true,
                    'download' => true,
                    'edit' => !$readonly,
                    'fillForms' => !$readonly,
                    'modifyContentControl' => !$readonly,
                    'modifyFilter' => !$readonly,
                    'print' => true,
                    'review' => false,
                ],
            ],
            'editorConfig' => [
                'mode' => $readonly ? 'view' : 'edit',
                'lang' => substr((string)current_language(), 0, 2) ?: 'en',
                'plugins' => pqh_onlyoffice_plugins_config(),
                'user' => [
                    'group' => '',
                    'id' => (string)$USER->id,
                    'name' => fullname($USER),
                ],
                'customization' => [
                    'autosave' => !$readonly,
                    'forcesave' => !$readonly,
                    'compactToolbar' => false,
                    'help' => true,
                ],
            ],
        ];
        if (!$readonly) {
            $config['editorConfig']['callbackUrl'] = $callbackurl;
        }
        $jwtsecret = trim((string)get_config('local_prequran', 'onlyoffice_jwt_secret'));
        if ($jwtsecret !== '') {
            $config['token'] = pqh_jwt_hs256($config, $jwtsecret);
        }
      ?>
      <script src="<?php echo s($docserver); ?>/web-apps/apps/api/documents/api.js"></script>
      <script>
      window.PQH_ONLYOFFICE_CONFIG = <?php echo json_encode($config, JSON_UNESCAPED_SLASHES); ?>;
      (function(){
        function sizeEditorFrame() {
          var top = document.querySelector('.pqhoe-top');
          var frame = document.querySelector('.pqhoe-frame');
          if (!top || !frame) return;
          var height = Math.max(360, window.innerHeight - top.getBoundingClientRect().height);
          frame.style.height = height + 'px';
          frame.style.maxHeight = height + 'px';
        }
        sizeEditorFrame();
        window.addEventListener('resize', sizeEditorFrame);
      }());
      window.PQH_ONLYOFFICE_EDITOR = new DocsAPI.DocEditor("pqh-onlyoffice-editor", window.PQH_ONLYOFFICE_CONFIG);
      </script>
    <?php endif; ?>
  </section>
</main>
<?php
echo $OUTPUT->footer();
