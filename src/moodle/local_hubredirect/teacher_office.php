<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/office_materials_lib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$childid = optional_param('childid', 0, PARAM_INT);
$workspaceid = pqho_resolve_teacher_workspace_id((int)$USER->id, $requestedworkspaceid, $childid, $consumercontext);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($childid > 0) {
    $urlparams['childid'] = $childid;
}
$isstudentoffice = $workspaceid > 0
    && pqho_user_is_student_in_workspace((int)$USER->id, $workspaceid)
    && !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)
    && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$returnurl = $isstudentoffice
    ? new moodle_url('/local/hubredirect/student_workplace.php', $urlparams)
    : new moodle_url('/local/hubredirect/teacher_workspace.php', $urlparams);
if ($workspaceid <= 0 || !pqho_user_can_use_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Choose a workspace before opening Document Studio.', $returnurl, 'Document Studio access required');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied('Choose a valid workspace before opening Document Studio.', $returnurl, 'Document Studio unavailable');
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied('Please reopen Document Studio and try again.', $returnurl, 'Document Studio form expired');
    }
    try {
        $type = required_param('office_type', PARAM_ALPHANUMEXT);
        $title = trim(optional_param('title', '', PARAM_TEXT));
        $coursekey = trim(optional_param('course_key', '', PARAM_ALPHANUMEXT));
        $materialid = pqho_create_material($workspaceid, (int)$USER->id, $type, $title, $coursekey, $childid);
        redirect(new moodle_url('/local/hubredirect/office_material_editor.php', $urlparams + ['materialid' => $materialid]));
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$materials = [];
if (pqh_table_exists_safe('local_prequran_workspace_material')) {
    $materials = array_values($DB->get_records_select(
        'local_prequran_workspace_material',
        'workspaceid = :workspaceid AND status = :status',
        ['workspaceid' => $workspaceid, 'status' => 'active'],
        'timemodified DESC',
        '*',
        0,
        50
    ));
    $materials = array_values(array_filter($materials, 'pqho_material_editor_supported'));
    if ($isstudentoffice) {
        $materials = array_values(array_filter($materials, static function($material) use ($USER): bool {
            return pqho_user_can_edit_material($material, (int)$USER->id);
        }));
    }
}

$docserver = rtrim(trim((string)get_config('local_prequran', 'onlyoffice_document_server_url')), '/');
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_office.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Document Studio');
$PAGE->set_heading('Document Studio');
$PAGE->add_body_class('pqh-office-studio-page');

echo $OUTPUT->header();
?>
<style>
body.pqh-office-studio-page header,body.pqh-office-studio-page footer,body.pqh-office-studio-page nav.navbar,body.pqh-office-studio-page #page-header,body.pqh-office-studio-page #page-footer,body.pqh-office-studio-page .drawer,body.pqh-office-studio-page .drawer-toggles,body.pqh-office-studio-page .block-region{display:none!important}
body.pqh-office-studio-page #page,body.pqh-office-studio-page #page-content,body.pqh-office-studio-page #region-main,body.pqh-office-studio-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqho-shell{min-height:100vh;padding:28px 18px 56px;background:#f5f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqho-wrap{max-width:1180px;margin:0 auto}.pqho-top,.pqho-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqho-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px}.pqho-title{margin:0;font-size:29px;font-weight:950}.pqho-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqho-actions{display:flex;gap:8px;flex-wrap:wrap}.pqho-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqho-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqho-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:14px}.pqho-create{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqho-tile{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fbfdff}.pqho-tile h3{margin:0 0 8px;color:#173044;font-size:17px;font-weight:950}.pqho-field{display:grid;gap:5px;margin-bottom:9px}.pqho-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqho-input{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fff;color:#173044;font-size:13px;font-weight:800}.pqho-table{width:100%;border-collapse:separate;border-spacing:0}.pqho-table th,.pqho-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqho-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqho-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqho-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqho-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850;background:#fff0ed;color:#883526}.pqho-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:850;background:#fff}
@media(max-width:900px){.pqho-top,.pqho-grid,.pqho-create{display:block}.pqho-tile{margin-bottom:10px}.pqho-actions{margin-top:12px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqho-shell">
  <div class="pqho-wrap">
    <section class="pqho-top pqh-workspace-top">
      <div>
        <h1 class="pqho-title pqh-workspace-title">Document Studio</h1>
        <p class="pqho-sub pqh-workspace-sub"><?php echo s((string)$workspace->name); ?> <?php echo $isstudentoffice ? 'student documents, materials, and course work.' : 'materials for documents, spreadsheets, presentations, and PDFs.'; ?></p>
      </div>
      <nav class="pqho-actions pqh-workspace-actions">
        <a class="pqho-btn pqho-btn--light" href="<?php echo $returnurl->out(false); ?>"><?php echo $isstudentoffice ? 'Student workplace' : 'Teacher workspace'; ?></a>
        <a class="pqho-btn pqho-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams))->out(false); ?>">Material library</a>
      </nav>
    </section>
    <?php if ($docserver === ''): ?><div class="pqho-alert">ONLYOFFICE is not configured yet. Set the document server URL in the PreQuraan Moodle plugin settings.</div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqho-alert"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqho-grid">
      <article class="pqho-panel">
        <h2>Create</h2>
        <div class="pqho-create">
          <?php foreach (pqho_allowed_types() as $type => $config): ?>
            <form class="pqho-tile" method="post">
              <input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>">
              <input type="hidden" name="office_type" value="<?php echo s($type); ?>">
              <h3><?php echo s((string)$config['label']); ?></h3>
              <div class="pqho-field"><label>Title</label><input class="pqho-input" name="title" value="<?php echo s((string)$config['default']); ?>"></div>
              <div class="pqho-field"><label>Course key</label><input class="pqho-input" name="course_key" placeholder="optional"></div>
              <button class="pqho-btn" type="submit">Create</button>
            </form>
          <?php endforeach; ?>
        </div>
      </article>
      <article class="pqho-panel">
        <h2>Recent Editable Materials</h2>
        <?php if (!$materials): ?>
          <div class="pqho-empty">No editable office materials have been created yet.</div>
        <?php else: ?>
          <table class="pqho-table">
            <thead><tr><th>Material</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              <?php foreach ($materials as $material): ?>
                <tr>
                  <td><span class="pqho-name"><?php echo s((string)$material->title); ?></span><span class="pqho-muted"><?php echo s(pqh_workspace_material_filename($material)); ?></span></td>
                  <td><?php echo s(userdate((int)($material->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td>
                  <td class="pqho-actions">
                    <a class="pqho-btn pqho-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/office_material_editor.php', $urlparams + ['materialid' => (int)$material->id]))->out(false); ?>">Open</a>
                    <a class="pqho-btn pqho-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/office_material_file.php', ['workspaceid' => $workspaceid, 'materialid' => (int)$material->id]))->out(false); ?>">Download</a>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
