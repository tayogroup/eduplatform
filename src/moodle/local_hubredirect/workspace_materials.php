<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$pageaction = optional_param('action', '', PARAM_ALPHANUMEXT);
$isdownload = $pageaction === 'download';
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || (!$isdownload && !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid))) {
    pqh_access_denied(
        'Only workspace teaching and admin users can view workspace materials.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Workspace materials access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening workspace materials.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Workspace materials unavailable'
    );
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Workspace Materials');
$PAGE->set_heading('Workspace Materials');
$PAGE->add_body_class('pqw-materials-page');


require_once(__DIR__ . '/workspace_materials_files.php');
require_once(__DIR__ . '/workspace_materials_workflow.php');

if ($isdownload) {
    $materialid = optional_param('materialid', 0, PARAM_INT);
    if (!pqh_table_exists_safe('local_prequran_workspace_material')) {
        pqh_access_denied(
            'Workspace material table is not ready. Run the local_prequran Moodle upgrade.',
            new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams),
            'Workspace material unavailable'
        );
    }
    $material = $materialid > 0 ? $DB->get_record('local_prequran_workspace_material', [
        'id' => $materialid,
        'workspaceid' => $workspaceid,
        'status' => 'active',
    ], '*', IGNORE_MISSING) : false;
    if (!$material) {
        pqh_access_denied(
            'Choose a valid workspace material before opening the file.',
            new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams),
            'Workspace material unavailable'
        );
    }
    if (!pqwm_can_view_material($material, (int)$USER->id)) {
        pqh_access_denied(
            'You cannot open this workspace material.',
            new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams),
            'Workspace material access required'
        );
    }
    try {
        pqwm_stream_bunny_material($material);
    } catch (Throwable $e) {
        pqh_access_denied(
            $e->getMessage(),
            new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams),
            'Workspace material unavailable'
        );
    }
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the workspace materials page and try again.',
            new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams),
            'Workspace materials form expired'
        );
    }
    try {
        $action = optional_param('action', 'add_material', PARAM_ALPHANUMEXT);
        if ($action === 'update_material_status') {
            if (!pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
                throw new invalid_parameter_exception('Only workspace teaching and admin users can update material assignment status.');
            }
            pqwm_update_assignment_workflow($workspaceid);
            $message = 'Material assignment status updated.';
        } else if (!$canmanage) {
            throw new invalid_parameter_exception('Only workspace owners and admins can manage materials.');
        } else if ($action === 'assign_material') {
            pqwm_upsert_assignment($workspaceid);
            $message = 'Workspace material assigned.';
        } else if ($action === 'set_material_status') {
            pqwm_set_material_status($workspaceid);
            $message = 'Workspace material updated.';
        } else if ($action === 'set_assignment_status') {
            pqwm_set_assignment_status($workspaceid);
            $message = 'Material assignment updated.';
        } else {
            pqwm_insert_material($workspaceid);
            $message = 'Workspace material added.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}
$materials = pqwm_materials($workspaceid);
$assignments = pqwm_assignments($workspaceid);
$students = pqwm_workspace_members($workspaceid, ['student']);
$teachers = pqwm_workspace_members($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$reviewedassignments = 0;
$completedassignments = 0;
foreach ($assignments as $assignment) {
    $workflow = (string)($assignment->workflow_status ?? 'assigned');
    if ($workflow === 'reviewed') {
        $reviewedassignments++;
    }
    if (in_array($workflow, ['completed', 'reviewed'], true)) {
        $completedassignments++;
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqw-materials-page header,body.pqw-materials-page footer,body.pqw-materials-page nav.navbar,body.pqw-materials-page #page-header,body.pqw-materials-page #page-footer,body.pqw-materials-page .drawer,body.pqw-materials-page .drawer-toggles,body.pqw-materials-page .block-region,body.pqw-materials-page [data-region="drawer"],body.pqw-materials-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-materials-page #page,body.pqw-materials-page #page-content,body.pqw-materials-page #region-main,body.pqw-materials-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwm-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwm-wrap{max-width:1280px;margin:0 auto}.pqwm-top,.pqwm-panel,.pqwm-metric{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwm-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqwm-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqwm-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwm-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqwm-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}.pqwm-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwm-btn--warn{background:#fff5e1;color:#7b4a00!important;border:1px solid rgba(170,110,0,.22)}.pqwm-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:14px}.pqwm-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}.pqwm-metric strong{display:block;color:#221b22;font-size:26px;font-weight:950;line-height:1}.pqwm-metric span{display:block;margin-top:6px;color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwm-field{display:grid;gap:5px;margin-bottom:10px}.pqwm-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqwm-input,.pqwm-select,.pqwm-textarea{width:100%;min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;padding:0 10px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800}.pqwm-textarea{min-height:86px;padding:10px}.pqwm-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqwm-alert--ok{background:#edf9ef;color:#245c35}.pqwm-alert--bad{background:#fff0ed;color:#883526}.pqwm-table{width:100%;border-collapse:separate;border-spacing:0}.pqwm-table th,.pqwm-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwm-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwm-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwm-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqwm-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqwm-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwm-status-form{display:grid;grid-template-columns:minmax(150px,1fr) auto;gap:8px;align-items:center}.pqwm-status-form textarea{grid-column:1/-1}.pqwm-inline-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
@media(max-width:980px){.pqwm-top,.pqwm-grid,.pqwm-metrics{grid-template-columns:1fr}.pqwm-actions{justify-content:flex-start}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqwm-shell">
  <div class="pqwm-wrap">
    <section class="pqwm-top pqh-workspace-top">
      <div>
        <h1 class="pqwm-title pqh-workspace-title"><?php echo s($workspace->name); ?> Materials</h1>
        <p class="pqwm-sub pqh-workspace-sub">House links and course resources for this workspace.</p>
      </div>
      <nav class="pqwm-actions pqh-workspace-actions">
        <button class="pqwm-btn pqwm-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqwm-btn pqwm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace dashboard</a>
        <a class="pqwm-btn pqwm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $urlparams))->out(false); ?>">Reports</a>
        <?php if ($canmanage): ?><a class="pqwm-btn pqwm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', $urlparams))->out(false); ?>">People</a><?php endif; ?>
        <?php if ($canmanage): ?><a class="pqwm-btn pqwm-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_sessions.php', $urlparams))->out(false); ?>">Sessions</a><?php endif; ?>
        <a class="pqwm-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqwm-alert pqwm-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqwm-alert pqwm-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqwm-metrics" aria-label="Material summary">
      <div class="pqwm-metric"><strong><?php echo count($materials); ?></strong><span>active materials</span></div>
      <div class="pqwm-metric"><strong><?php echo count($assignments); ?></strong><span>active assignments</span></div>
      <div class="pqwm-metric"><strong><?php echo $completedassignments; ?></strong><span>complete or reviewed</span></div>
      <div class="pqwm-metric"><strong><?php echo $reviewedassignments; ?></strong><span>reviewed</span></div>
    </section>
    <section class="pqwm-grid">
      <?php if ($canmanage): ?>
        <form class="pqwm-panel" method="post" enctype="multipart/form-data">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="add_material">
          <h2>Add Material</h2>
          <?php if (!pqh_table_exists_safe('local_prequran_workspace_material')): ?>
            <div class="pqwm-empty">Workspace material table is not ready. Run the local_prequran Moodle upgrade first.</div>
          <?php else: ?>
            <div class="pqwm-field"><label>Title</label><input class="pqwm-input" name="title" required></div>
            <div class="pqwm-field"><label>Type</label><select class="pqwm-select" name="material_type"><option value="link">Link</option><option value="course">Course</option><option value="document">Document</option><option value="video">Video</option><option value="homework">Homework</option></select></div>
            <div class="pqwm-field"><label>Course key</label><input class="pqwm-input" name="course_key" placeholder="optional"></div>
            <div class="pqwm-field"><label>Upload file</label><input class="pqwm-input" name="material_file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp4,.webm,.mp3,.wav"></div>
            <div class="pqwm-field"><label>Source URL</label><input class="pqwm-input" name="source_url" type="url" placeholder="https://..."></div>
            <div class="pqwm-field"><label>Description</label><textarea class="pqwm-textarea" name="description"></textarea></div>
            <div class="pqwm-field"><label>Visibility</label><select class="pqwm-select" name="visibility"><option value="workspace">Workspace</option><option value="teachers">Teachers only</option><option value="students">Students</option></select></div>
            <button class="pqwm-btn" type="submit">Add material</button>
          <?php endif; ?>
        </form>
        <form class="pqwm-panel" method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="assign_material">
          <h2>Assign Material</h2>
          <?php if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')): ?>
            <div class="pqwm-empty">Material assignment table is not ready. Run the local_prequran Moodle upgrade first.</div>
          <?php elseif (!$materials): ?>
            <div class="pqwm-empty">Add a material before assigning it.</div>
          <?php elseif (!$students && !$teachers): ?>
            <div class="pqwm-empty">Add workspace students or teachers before assigning materials.</div>
          <?php else: ?>
            <div class="pqwm-field"><label>Material</label><select class="pqwm-select" name="materialid" required>
              <?php foreach ($materials as $material): ?><option value="<?php echo (int)$material->id; ?>"><?php echo s($material->title); ?></option><?php endforeach; ?>
            </select></div>
            <div class="pqwm-field"><label>Assign to</label><select class="pqwm-select" name="target" required>
              <?php if ($students): ?><optgroup label="Students"><?php foreach ($students as $student): ?><option value="student:<?php echo (int)$student->userid; ?>"><?php echo s(fullname($student) . ' - ' . pqh_account_no_label($student)); ?></option><?php endforeach; ?></optgroup><?php endif; ?>
              <?php if ($teachers): ?><optgroup label="Teachers"><?php foreach ($teachers as $teacher): ?><option value="teacher:<?php echo (int)$teacher->userid; ?>"><?php echo s(fullname($teacher) . ' - ' . pqh_account_no_label($teacher)); ?></option><?php endforeach; ?></optgroup><?php endif; ?>
            </select></div>
            <button class="pqwm-btn" type="submit">Assign material</button>
          <?php endif; ?>
        </form>
      <?php endif; ?>
      <article class="pqwm-panel">
        <h2>Material Library</h2>
        <?php if (!$materials): ?><div class="pqwm-empty">No active workspace materials yet.</div><?php else: ?>
          <table class="pqwm-table">
            <thead><tr><th>Material</th><th>Type</th><th>Visibility</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($materials as $material): ?>
                <tr>
                  <td><span class="pqwm-name"><?php echo s($material->title); ?></span><span class="pqwm-muted"><?php echo s((string)($material->course_key ?? '')); ?></span><div class="pqwm-inline-actions"><?php if (!empty($material->source_url)): ?><a class="pqwm-btn pqwm-btn--light" href="<?php echo s($material->source_url); ?>" target="_blank" rel="noopener">Open</a><?php endif; ?><?php if ($canmanage): ?><form method="post"><input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="action" value="set_material_status"><input type="hidden" name="materialid" value="<?php echo (int)$material->id; ?>"><input type="hidden" name="status" value="archived"><button class="pqwm-btn pqwm-btn--warn" type="submit">Archive</button></form><?php endif; ?></div></td>
                  <td><span class="pqwm-pill"><?php echo s((string)$material->material_type); ?></span></td>
                  <td><?php echo s((string)$material->visibility); ?></td>
                  <td><?php echo s(userdate((int)($material->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>
      <article class="pqwm-panel">
        <h2>Assignments</h2>
        <?php if (!$assignments): ?><div class="pqwm-empty">No material assignments yet.</div><?php else: ?>
          <table class="pqwm-table">
            <thead><tr><th>Material</th><th>Assigned to</th><th>Role</th><th>Progress</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($assignments as $assignment): ?>
                <tr>
                  <td><span class="pqwm-name"><?php echo s($assignment->title); ?></span><span class="pqwm-muted"><?php echo s((string)$assignment->material_type); ?></span></td>
                  <td><?php echo s(fullname($assignment)); ?><span class="pqwm-muted"><?php echo s(pqh_account_no_label($assignment)); ?> / <?php echo s((string)$assignment->email); ?></span></td>
                  <td><span class="pqwm-pill"><?php echo s((string)$assignment->target_type); ?></span></td>
                  <td>
                    <form class="pqwm-status-form" method="post">
                      <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                      <input type="hidden" name="action" value="update_material_status">
                      <input type="hidden" name="assignmentid" value="<?php echo (int)$assignment->id; ?>">
                      <select class="pqwm-select" name="workflow_status">
                        <?php foreach (pqwm_material_workflow_statuses() as $statuskey => $statuslabel): ?>
                          <option value="<?php echo s($statuskey); ?>"<?php echo ((string)($assignment->workflow_status ?? 'assigned') === $statuskey) ? ' selected' : ''; ?>><?php echo s($statuslabel); ?></option>
                        <?php endforeach; ?>
                      </select>
                      <button class="pqwm-btn pqwm-btn--light" type="submit">Update</button>
                      <textarea class="pqwm-textarea" name="review_notes" placeholder="Review note, required only when marking reviewed"><?php echo s((string)($assignment->review_notes ?? '')); ?></textarea>
                    </form>
                    <?php if ($canmanage): ?><form class="pqwm-inline-actions" method="post"><input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>"><input type="hidden" name="action" value="set_assignment_status"><input type="hidden" name="assignmentid" value="<?php echo (int)$assignment->id; ?>"><input type="hidden" name="status" value="inactive"><button class="pqwm-btn pqwm-btn--warn" type="submit">Remove assignment</button></form><?php endif; ?>
                  </td>
                  <td><?php echo s(userdate((int)$assignment->timemodified, get_string('strftimedatetimeshort'))); ?></td>
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
