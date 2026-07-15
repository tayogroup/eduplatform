<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/homeworklib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqho_resolve_teacher_workspace_id((int)$USER->id, optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT), 0, $consumercontext);
$urlparams = pqhh_context_params($consumercontext, $workspaceid);
$returnurl = new moodle_url('/local/hubredirect/student_homework.php', $urlparams);
if ($workspaceid <= 0 || !pqho_user_is_student_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Choose a student workspace before opening Homework.', new moodle_url('/local/hubredirect/student_workplace.php', $urlparams), 'Homework access required');
}
if (!pqhh_ready()) {
    pqh_access_denied('Homework is waiting for the EduPlatform database upgrade.', new moodle_url('/local/hubredirect/student_workplace.php', $urlparams), 'Homework setup required');
}

$notice = '';
$error = '';
if (data_submitted() && confirm_sesskey()) {
    try {
        $action = required_param('action', PARAM_ALPHAEXT);
        $submissionid = required_param('submissionid', PARAM_INT);
        $submission = $DB->get_record('local_prequran_homework_sub', [
            'id' => $submissionid, 'workspaceid' => $workspaceid, 'studentid' => (int)$USER->id,
        ], '*', MUST_EXIST);
        $homework = $DB->get_record('local_prequran_homework', [
            'id' => (int)$submission->homeworkid, 'workspaceid' => $workspaceid, 'status' => 'published',
        ], '*', MUST_EXIST);
        if (!pqhh_user_enrolled_in_course((int)$USER->id, (int)$homework->moodlecourseid)) {
            throw new invalid_parameter_exception('This homework course is not available to your account.');
        }
        $now = time();
        if ($action === 'start') {
            if ((string)$submission->status === 'assigned') {
                $submission->status = 'in_progress';
                $submission->startedat = $now;
                $submission->timemodified = $now;
                $DB->update_record('local_prequran_homework_sub', $submission);
            }
            $notice = 'Homework started.';
        } elseif ($action === 'save') {
            if (in_array((string)$submission->status, ['submitted', 'graded'], true)) {
                throw new invalid_parameter_exception('Submitted homework is locked while it is being reviewed.');
            }
            $materialid = optional_param('materialid', 0, PARAM_INT);
            if ($materialid > 0 && !$DB->record_exists('local_prequran_workspace_material', [
                    'id' => $materialid, 'workspaceid' => $workspaceid, 'createdby' => (int)$USER->id, 'status' => 'active'])) {
                throw new invalid_parameter_exception('The selected material is not available.');
            }
            $submission->status = 'in_progress';
            $submission->response_text = trim(optional_param('response_text', '', PARAM_RAW_TRIMMED));
            $submission->materialid = $materialid;
            $submission->timemodified = $now;
            if ((int)$submission->startedat <= 0) {
                $submission->startedat = $now;
            }
            $DB->update_record('local_prequran_homework_sub', $submission);
            $notice = 'Draft saved.';
        } elseif ($action === 'submit') {
            if ((string)$submission->status === 'graded') {
                throw new invalid_parameter_exception('This homework has already been graded.');
            }
            if ((string)$submission->status === 'submitted') {
                throw new invalid_parameter_exception('Submitted homework is locked while it is being reviewed.');
            }
            if ((string)$submission->status === 'returned' && empty($homework->allowresubmit)) {
                throw new invalid_parameter_exception('Resubmission is not enabled for this homework.');
            }
            $response = trim(optional_param('response_text', '', PARAM_RAW_TRIMMED));
            $materialid = optional_param('materialid', 0, PARAM_INT);
            if ($materialid > 0) {
                $material = $DB->get_record('local_prequran_workspace_material', [
                    'id' => $materialid, 'workspaceid' => $workspaceid, 'createdby' => (int)$USER->id, 'status' => 'active',
                ], '*', IGNORE_MISSING);
                if (!$material) {
                    throw new invalid_parameter_exception('The selected material is not available.');
                }
            }
            if ($response === '' && $materialid <= 0) {
                throw new invalid_parameter_exception('Add a written response or attach a Document Studio file.');
            }
            $submission->status = 'submitted';
            $submission->attemptnumber = (int)$submission->attemptnumber + 1;
            $submission->response_text = $response;
            $submission->materialid = $materialid;
            $submission->submittedat = $now;
            $submission->feedback = '';
            $submission->timemodified = $now;
            if ((int)$submission->startedat <= 0) {
                $submission->startedat = $now;
            }
            $DB->update_record('local_prequran_homework_sub', $submission);
            $notice = 'Homework submitted for teacher review.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$materials = [];
if (pqh_table_exists_safe('local_prequran_workspace_material')) {
    $materials = array_values($DB->get_records('local_prequran_workspace_material', [
        'workspaceid' => $workspaceid, 'createdby' => (int)$USER->id, 'status' => 'active',
    ], 'timemodified DESC', 'id,title,material_type,timemodified'));
}
$rows = array_values($DB->get_records_sql(
    "SELECT s.*, h.title, h.instructions, h.duedate, h.maxpoints, h.allowresubmit, h.resourcematerialid,
            h.moodlecourseid, c.fullname AS coursename
       FROM {local_prequran_homework_sub} s
       JOIN {local_prequran_homework} h ON h.id = s.homeworkid
       JOIN {course} c ON c.id = h.moodlecourseid
      WHERE s.workspaceid = :workspaceid AND s.studentid = :studentid AND h.status = :status
   ORDER BY CASE s.status WHEN 'returned' THEN 0 WHEN 'assigned' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'submitted' THEN 3 ELSE 4 END,
            h.duedate ASC, h.id DESC",
    ['workspaceid' => $workspaceid, 'studentid' => (int)$USER->id, 'status' => 'published']
));
$counts = ['open' => 0, 'review' => 0, 'graded' => 0, 'overdue' => 0];
foreach ($rows as $row) {
    if (in_array((string)$row->status, ['assigned', 'in_progress', 'returned'], true)) {$counts['open']++;}
    if ((string)$row->status === 'submitted') {$counts['review']++;}
    if ((string)$row->status === 'graded') {$counts['graded']++;}
    if ((int)$row->duedate > 0 && (int)$row->duedate < time() && !in_array((string)$row->status, ['submitted', 'graded'], true)) {$counts['overdue']++;}
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url($returnurl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Student Homework');
$PAGE->set_heading('Student Homework');
$PAGE->add_body_class('pqhsh-page');
echo $OUTPUT->header();
?>
<style>
body.pqhsh-page header,body.pqhsh-page footer,body.pqhsh-page nav.navbar,body.pqhsh-page #page-header,body.pqhsh-page #page-footer,body.pqhsh-page .drawer,body.pqhsh-page .drawer-toggles{display:none!important}body.pqhsh-page #page,body.pqhsh-page #page-content,body.pqhsh-page #region-main,body.pqhsh-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}.pqhsh-shell{min-height:100vh;padding:26px 18px 50px;background:#f5f7fa;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqhsh-wrap{max-width:1120px;margin:auto}.pqhsh-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px;background:#fff;border:1px solid #dce4e8;border-radius:8px}.pqhsh-head h1{margin:0;font-size:30px}.pqhsh-head p,.pqhsh-muted{color:#617581}.pqhsh-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid #cad8de;border-radius:8px;background:#edf4f6;color:#173044!important;font-weight:800;text-decoration:none}.pqhsh-btn--main{background:#2f6f4e;color:#fff!important;border-color:#2f6f4e}.pqhsh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.pqhsh-stat,.pqhsh-item{padding:15px;background:#fff;border:1px solid #dce4e8;border-radius:8px}.pqhsh-stat strong{display:block;font-size:25px}.pqhsh-list{display:grid;gap:12px}.pqhsh-item-head{display:flex;justify-content:space-between;gap:12px}.pqhsh-item h2{margin:0;font-size:20px}.pqhsh-meta{margin:6px 0;color:#617581;font-size:13px}.pqhsh-instructions{margin:12px 0;white-space:pre-wrap}.pqhsh-status{font-size:12px;font-weight:850;padding:5px 8px;border-radius:999px;background:#edf4f6;white-space:nowrap}.pqhsh-work{display:grid;grid-template-columns:1fr minmax(190px,.45fr);gap:10px}.pqhsh-field label{display:block;margin-bottom:5px;font-weight:800}.pqhsh-textarea,.pqhsh-select{width:100%;min-height:42px;border:1px solid #bfcdd4;border-radius:6px;padding:9px;background:#fff}.pqhsh-textarea{min-height:100px}.pqhsh-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.pqhsh-feedback{margin-top:12px;padding:11px;border-left:4px solid #d99b1b;background:#fff8e8}.pqhsh-alert{margin-top:12px;padding:11px;border-radius:6px;background:#eaf7e9;color:#245a36;font-weight:700}.pqhsh-alert--error{background:#fdeaea;color:#8a2626}@media(max-width:720px){.pqhsh-stats{grid-template-columns:repeat(2,1fr)}.pqhsh-head{align-items:flex-start;flex-direction:column}.pqhsh-work{grid-template-columns:1fr}}
</style>
<main class="pqhsh-shell"><div class="pqhsh-wrap">
  <header class="pqhsh-head"><div><h1>Homework</h1><p>Complete course assignments and review teacher feedback.</p></div><a class="pqhsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/student_workplace.php', $urlparams))->out(false); ?>">Student workplace</a></header>
  <?php if ($notice): ?><div class="pqhsh-alert"><?php echo s($notice); ?></div><?php endif; ?><?php if ($error): ?><div class="pqhsh-alert pqhsh-alert--error"><?php echo s($error); ?></div><?php endif; ?>
  <section class="pqhsh-stats" aria-label="Homework summary"><div class="pqhsh-stat"><strong><?php echo $counts['open']; ?></strong>To do</div><div class="pqhsh-stat"><strong><?php echo $counts['review']; ?></strong>Awaiting review</div><div class="pqhsh-stat"><strong><?php echo $counts['graded']; ?></strong>Graded</div><div class="pqhsh-stat"><strong><?php echo $counts['overdue']; ?></strong>Overdue</div></section>
  <section class="pqhsh-list"><?php if (!$rows): ?><article class="pqhsh-item"><p class="pqhsh-muted">No homework has been assigned yet.</p></article><?php endif; ?>
    <?php foreach ($rows as $row): ?><article class="pqhsh-item"><div class="pqhsh-item-head"><div><h2><?php echo s((string)$row->title); ?></h2><div class="pqhsh-meta"><?php echo s((string)$row->coursename); ?><?php if ((int)$row->duedate > 0): ?> · Due <?php echo s(userdate((int)$row->duedate, '%d %b %Y, %H:%M')); ?><?php endif; ?> · <?php echo s((string)$row->maxpoints); ?> points</div></div><span class="pqhsh-status"><?php echo s(pqhh_status_label((string)$row->status)); ?></span></div>
      <?php if (trim((string)$row->instructions) !== ''): ?><div class="pqhsh-instructions"><?php echo s((string)$row->instructions); ?></div><?php endif; ?>
      <?php if ((int)$row->resourcematerialid > 0): ?><div class="pqhsh-actions"><a class="pqhsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/office_material_editor.php', $urlparams + ['materialid' => (int)$row->resourcematerialid, 'mode' => 'view', 'returnto' => 'homework']))->out(false); ?>">Open course material</a></div><?php endif; ?>
      <?php if (trim((string)$row->feedback) !== ''): ?><div class="pqhsh-feedback"><strong>Teacher feedback</strong><br><?php echo nl2br(s((string)$row->feedback)); ?></div><?php endif; ?>
      <?php if ((string)$row->status === 'graded'): ?><p><strong>Grade: <?php echo s((string)$row->scorepoints); ?> / <?php echo s((string)$row->maxpoints); ?> (<?php echo s((string)round((float)$row->scorepercent)); ?>%)</strong></p><?php endif; ?>
      <?php if (!in_array((string)$row->status, ['submitted', 'graded'], true)): ?><form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="submissionid" value="<?php echo (int)$row->id; ?>"><div class="pqhsh-work"><div class="pqhsh-field"><label>Written response</label><textarea class="pqhsh-textarea" name="response_text"><?php echo s((string)$row->response_text); ?></textarea></div><div class="pqhsh-field"><label>Document Studio file</label><select class="pqhsh-select" name="materialid"><option value="0">No file attached</option><?php foreach ($materials as $material): ?><option value="<?php echo (int)$material->id; ?>"<?php echo (int)$row->materialid === (int)$material->id ? ' selected' : ''; ?>><?php echo s((string)$material->title); ?></option><?php endforeach; ?></select><div class="pqhsh-actions"><a class="pqhsh-btn" href="<?php echo (new moodle_url('/local/hubredirect/teacher_office.php', $urlparams))->out(false); ?>">Create file</a></div></div></div><div class="pqhsh-actions"><button class="pqhsh-btn" type="submit" name="action" value="save">Save draft</button><button class="pqhsh-btn pqhsh-btn--main" type="submit" name="action" value="submit"><?php echo (string)$row->status === 'returned' ? 'Resubmit homework' : 'Submit homework'; ?></button></div></form><?php endif; ?>
    </article><?php endforeach; ?>
  </section>
</div></main>
<?php echo $OUTPUT->footer();
