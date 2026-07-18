<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/homeworklib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqhh_resolve_teacher_workspace_id((int)$USER->id, $requestedworkspaceid, $consumercontext);
$urlparams = pqhh_context_params($consumercontext, $workspaceid);
$returnurl = new moodle_url('/local/hubredirect/teacher_homework.php', $urlparams);
if ($workspaceid <= 0 || !pqhh_user_can_assign((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Choose a teacher workspace before opening Homework.', new moodle_url('/local/hubredirect/teacher_workspace.php', $urlparams), 'Homework access required');
}
if (!pqhh_ready()) {
    pqh_access_denied('Homework is waiting for the EduPlatform database upgrade.', new moodle_url('/local/hubredirect/teacher_workspace.php', $urlparams), 'Homework setup required');
}

$students = pqhh_teacher_students((int)$USER->id, $workspaceid);
$studentmap = [];
$studentcourseids = [];
foreach ($students as $student) {
    $studentmap[(int)$student->id] = $student;
    $studentcourseids[(int)$student->id] = array_map('intval', array_keys(pqh_user_moodle_enrolment_courses((int)$student->id)));
}
$courses = pqhh_teacher_courses($students);
$groups = pqhh_teacher_groups((int)$USER->id, $workspaceid, $students);
$groupmap = [];
foreach ($groups as $group) {
    $groupmap[(int)$group->id] = $group;
    $group->courseids = [];
    foreach ((array)$group->studentids as $groupstudentid) {
        foreach (($studentcourseids[(int)$groupstudentid] ?? []) as $groupcourseid) {
            $group->courseids[(int)$groupcourseid] = (int)$groupcourseid;
        }
    }
}
$coursematerials = pqh_table_exists_safe('local_prequran_workspace_material')
    ? array_values($DB->get_records('local_prequran_workspace_material', [
        'workspaceid' => $workspaceid, 'status' => 'active',
    ], 'title ASC, timemodified DESC', 'id,title,material_type,createdby,workspaceid'))
    : [];
$notice = '';
$error = '';

if (data_submitted() && confirm_sesskey()) {
    $action = required_param('action', PARAM_ALPHAEXT);
    try {
        if ($action === 'create') {
            $courseid = required_param('courseid', PARAM_INT);
            $title = trim(required_param('title', PARAM_TEXT));
            $instructions = trim(optional_param('instructions', '', PARAM_RAW_TRIMMED));
            $maxpoints = (float)required_param('maxpoints', PARAM_FLOAT);
            $dueinput = trim(optional_param('duedate', '', PARAM_TEXT));
            $targettype = optional_param('target_type', 'course', PARAM_ALPHA);
            $targetgroupid = optional_param('target_groupid', 0, PARAM_INT);
            $resourcematerialid = optional_param('resourcematerialid', 0, PARAM_INT);
            $selected = array_values(array_unique(array_map('intval', optional_param_array('studentids', [], PARAM_INT))));
            if (!isset($courses[$courseid]) || $title === '' || $maxpoints <= 0
                    || !in_array($targettype, ['course', 'group', 'individual'], true)) {
                throw new invalid_parameter_exception('Choose a course, assignment type, title, and points.');
            }
            if ($resourcematerialid > 0 && !$DB->record_exists('local_prequran_workspace_material', [
                    'id' => $resourcematerialid, 'workspaceid' => $workspaceid, 'status' => 'active'])) {
                throw new invalid_parameter_exception('The selected course material is not available in this workspace.');
            }
            $eligible = [];
            foreach (array_keys($studentmap) as $studentid) {
                if (isset($studentmap[$studentid]) && pqhh_user_enrolled_in_course($studentid, $courseid)) {
                    $eligible[$studentid] = $studentid;
                }
            }
            if ($targettype === 'course') {
                $validstudents = array_values($eligible);
                $targetid = $courseid;
            } elseif ($targettype === 'group') {
                if (!isset($groupmap[$targetgroupid])) {
                    throw new invalid_parameter_exception('Choose a valid student group.');
                }
                $validstudents = array_values(array_intersect(
                    array_map('intval', array_values((array)$groupmap[$targetgroupid]->studentids)),
                    array_values($eligible)
                ));
                $targetid = $targetgroupid;
            } else {
                $validstudents = array_values(array_intersect($selected, array_values($eligible)));
                $targetid = 0;
            }
            if (!$validstudents) {
                throw new invalid_parameter_exception('No eligible students were found for this course and assignment type.');
            }
            $duedate = $dueinput !== '' ? (int)strtotime($dueinput) : 0;
            $offering = pqhh_course_offering($workspaceid, $courseid);
            $now = time();
            $transaction = $DB->start_delegated_transaction();
            $homeworkid = (int)$DB->insert_record('local_prequran_homework', (object)[
                'consumerid' => pqhh_consumer_id($consumercontext), 'workspaceid' => $workspaceid,
                'moodlecourseid' => $courseid, 'offeringid' => (int)($offering->id ?? 0), 'assessmentid' => 0,
                'resourcematerialid' => $resourcematerialid, 'target_type' => $targettype, 'targetid' => $targetid,
                'title' => $title, 'instructions' => $instructions, 'duedate' => $duedate,
                'maxpoints' => rtrim(rtrim(number_format($maxpoints, 2, '.', ''), '0'), '.'),
                'allowresubmit' => optional_param('allowresubmit', 0, PARAM_BOOL), 'status' => 'published',
                'createdby' => (int)$USER->id, 'timecreated' => $now, 'timemodified' => $now,
            ]);
            foreach ($validstudents as $studentid) {
                $DB->insert_record('local_prequran_homework_sub', (object)[
                    'homeworkid' => $homeworkid, 'consumerid' => pqhh_consumer_id($consumercontext),
                    'workspaceid' => $workspaceid, 'studentid' => $studentid, 'status' => 'assigned',
                    'attemptnumber' => 0, 'response_text' => '', 'materialid' => 0, 'startedat' => 0,
                    'submittedat' => 0, 'scorepoints' => '', 'scorepercent' => '', 'feedback' => '',
                    'gradedby' => 0, 'gradedat' => 0, 'timecreated' => $now, 'timemodified' => $now,
                ]);
                pqhh_assign_resource_material($workspaceid, $resourcematerialid, $studentid, (int)$USER->id);
            }
            $homework = $DB->get_record('local_prequran_homework', ['id' => $homeworkid], '*', MUST_EXIST);
            pqhh_ensure_assessment($homework);
            $transaction->allow_commit();
            $notice = 'Homework assigned to ' . count($validstudents) . ' student' . (count($validstudents) === 1 ? '' : 's') . '.';
        } elseif ($action === 'review') {
            $submissionid = required_param('submissionid', PARAM_INT);
            $decision = required_param('decision', PARAM_ALPHA);
            $submission = $DB->get_record('local_prequran_homework_sub', ['id' => $submissionid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $homework = $DB->get_record('local_prequran_homework', ['id' => (int)$submission->homeworkid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$homework->createdby !== (int)$USER->id && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
                throw new required_capability_exception(context_system::instance(), 'moodle/site:config', 'nopermissions', '');
            }
            if (!in_array((string)$submission->status, ['submitted', 'graded'], true)) {
                throw new invalid_parameter_exception('Only submitted homework can be reviewed.');
            }
            $feedback = trim(optional_param('feedback', '', PARAM_RAW_TRIMMED));
            $now = time();
            if ($decision === 'return') {
                if ($feedback === '') {
                    throw new invalid_parameter_exception('Add feedback explaining what the student should revise.');
                }
                $submission->status = 'returned';
                $submission->feedback = $feedback;
                $submission->gradedby = (int)$USER->id;
                $submission->gradedat = $now;
            } elseif ($decision === 'grade') {
                $score = (float)required_param('scorepoints', PARAM_FLOAT);
                $maximum = max(0.01, (float)$homework->maxpoints);
                if ($score < 0 || $score > $maximum) {
                    throw new invalid_parameter_exception('The score must be between 0 and ' . $maximum . '.');
                }
                $submission->status = 'graded';
                $submission->scorepoints = rtrim(rtrim(number_format($score, 2, '.', ''), '0'), '.');
                $submission->scorepercent = number_format(($score / $maximum) * 100, 2, '.', '');
                $submission->feedback = $feedback;
                $submission->gradedby = (int)$USER->id;
                $submission->gradedat = $now;
                pqhh_publish_grade($homework, $submission, (int)$USER->id);
            } else {
                throw new invalid_parameter_exception('Unknown review decision.');
            }
            $submission->timemodified = $now;
            $DB->update_record('local_prequran_homework_sub', $submission);
            $notice = $decision === 'grade' ? 'Homework graded.' : 'Homework returned for revision.';
        } elseif ($action === 'archive') {
            $homeworkid = required_param('homeworkid', PARAM_INT);
            $homework = $DB->get_record('local_prequran_homework', ['id' => $homeworkid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            if ((int)$homework->createdby !== (int)$USER->id && !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
                throw new invalid_parameter_exception('You cannot archive this homework.');
            }
            $DB->set_field('local_prequran_homework', 'status', 'archived', ['id' => $homeworkid]);
            $notice = 'Homework archived.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$rows = array_values($DB->get_records_sql(
    "SELECT s.*, h.title, h.instructions, h.duedate, h.maxpoints, h.moodlecourseid,
            c.fullname AS coursename, u.firstname, u.lastname, u.idnumber
       FROM {local_prequran_homework_sub} s
       JOIN {local_prequran_homework} h ON h.id = s.homeworkid
       JOIN {course} c ON c.id = h.moodlecourseid
       JOIN {user} u ON u.id = s.studentid
      WHERE h.workspaceid = :workspaceid AND h.status = :status
        AND (h.createdby = :teacherid OR :canmanage = 1)
   ORDER BY CASE WHEN s.status = 'submitted' THEN 0 ELSE 1 END, h.duedate ASC, h.id DESC, u.firstname",
    ['workspaceid' => $workspaceid, 'status' => 'published', 'teacherid' => (int)$USER->id,
        'canmanage' => pqh_user_can_manage_workspace((int)$USER->id, $workspaceid) ? 1 : 0]
));

$PAGE->set_context(context_system::instance());
$PAGE->set_url($returnurl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Homework');
$PAGE->set_heading('Teacher Homework');
$PAGE->add_body_class('pqhh-page');
echo $OUTPUT->header();
?>
<style>
body.pqhh-page header,body.pqhh-page footer,body.pqhh-page nav.navbar,body.pqhh-page #page-header,body.pqhh-page #page-footer,body.pqhh-page .drawer,body.pqhh-page .drawer-toggles{display:none!important}body.pqhh-page #page,body.pqhh-page #page-content,body.pqhh-page #region-main,body.pqhh-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}.pqhh-shell{min-height:100vh;padding:26px 18px 50px;background:#f5f7fa;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqhh-wrap{max-width:1240px;margin:auto}.pqhh-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px;background:#fff;border:1px solid #dce4e8;border-radius:8px}.pqhh-head h1{margin:0;font-size:30px}.pqhh-head p,.pqhh-muted{color:#617581}.pqhh-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border:1px solid #cad8de;border-radius:8px;background:#edf4f6;color:#173044!important;font-weight:800;text-decoration:none}.pqhh-btn--main{background:#2f6f4e;color:#fff!important;border-color:#2f6f4e}.pqhh-grid{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.6fr);gap:14px;margin-top:14px}.pqhh-panel{padding:18px;background:#fff;border:1px solid #dce4e8;border-radius:8px}.pqhh-panel h2{margin:0 0 14px;font-size:20px}.pqhh-field{margin-bottom:12px}.pqhh-field label{display:block;margin-bottom:5px;font-weight:800}.pqhh-input,.pqhh-select,.pqhh-textarea{width:100%;min-height:42px;border:1px solid #bfcdd4;border-radius:6px;padding:9px;background:#fff}.pqhh-textarea{min-height:92px}.pqhh-target-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.pqhh-target-modes label{display:flex;align-items:center;justify-content:center;gap:6px;min-height:42px;margin:0;padding:6px;border:1px solid #cad8de;border-radius:6px;background:#f7fafb;text-align:center}.pqhh-students{max-height:210px;overflow:auto;border:1px solid #dce4e8;border-radius:6px;padding:8px}.pqhh-students label{display:block;padding:6px}.pqhh-list{display:grid;gap:10px}.pqhh-item{padding:14px;border:1px solid #dce4e8;border-radius:8px}.pqhh-item-head{display:flex;justify-content:space-between;gap:12px}.pqhh-item h3{margin:0;font-size:17px}.pqhh-meta{margin:5px 0;color:#617581;font-size:13px}.pqhh-response{margin:10px 0;padding:10px;background:#f4f7f8;border-radius:6px;white-space:pre-wrap}.pqhh-review{display:grid;grid-template-columns:minmax(110px,.35fr) minmax(180px,1fr) auto auto;gap:8px;align-items:end}.pqhh-alert{margin-top:12px;padding:11px;border-radius:6px;background:#eaf7e9;color:#245a36;font-weight:700}.pqhh-alert--error{background:#fdeaea;color:#8a2626}.pqhh-status{font-size:12px;font-weight:850;padding:5px 8px;border-radius:999px;background:#edf4f6;white-space:nowrap}@media(max-width:850px){.pqhh-grid{grid-template-columns:1fr}.pqhh-head{align-items:flex-start;flex-direction:column}.pqhh-review{grid-template-columns:1fr 1fr}.pqhh-review .pqhh-field{grid-column:1/-1}}@media(max-width:520px){.pqhh-target-modes{grid-template-columns:1fr}}
<?php echo pqh_design_system_css('.pqhh-shell'); ?>
<?php echo pqh_design_shell_css('.pqhh-shell'); ?>
</style>
<main class="pqhh-shell">
<?php echo pqh_design_shell_html('pqhh-shell'); ?><div class="pqhh-wrap">
  <header class="pqhh-head"><div><h1>Homework</h1><p>Create course work, review submissions, and publish grades.</p></div><a class="pqhh-btn" href="<?php echo (new moodle_url('/local/hubredirect/teacher_workspace.php', $urlparams))->out(false); ?>">Teacher workspace</a></header>
  <?php if ($notice): ?><div class="pqhh-alert"><?php echo s($notice); ?></div><?php endif; ?>
  <?php if ($error): ?><div class="pqhh-alert pqhh-alert--error"><?php echo s($error); ?></div><?php endif; ?>
  <div class="pqhh-grid">
    <section class="pqhh-panel"><h2>Assign homework</h2>
      <form method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="create">
        <div class="pqhh-field"><label for="courseid">Course</label><select class="pqhh-select" id="courseid" name="courseid" required><option value="">Choose course</option><?php foreach ($courses as $courseid => $course): ?><option value="<?php echo (int)$courseid; ?>"><?php echo s((string)$course['title']); ?></option><?php endforeach; ?></select></div>
        <div class="pqhh-field"><label for="title">Title</label><input class="pqhh-input" id="title" name="title" maxlength="255" required></div>
        <div class="pqhh-field"><label for="instructions">Instructions</label><textarea class="pqhh-textarea" id="instructions" name="instructions"></textarea></div>
        <div class="pqhh-field"><label for="resourcematerialid">Course material</label><select class="pqhh-select" id="resourcematerialid" name="resourcematerialid"><option value="0">No document attached</option><?php foreach ($coursematerials as $material): ?><option value="<?php echo (int)$material->id; ?>"><?php echo s((string)$material->title); ?> (<?php echo s((string)$material->material_type); ?>)</option><?php endforeach; ?></select><div class="pqhh-meta"><?php if (!$coursematerials): ?>No workspace documents are available. <?php endif; ?><a href="<?php echo (new moodle_url('/local/hubredirect/teacher_office.php', $urlparams))->out(false); ?>">Create document</a> &middot; <a href="<?php echo (new moodle_url('/local/hubredirect/workspace_materials.php', $urlparams))->out(false); ?>">Material Library</a></div></div>
        <div class="pqhh-field"><label for="duedate">Due date</label><input class="pqhh-input" type="datetime-local" id="duedate" name="duedate"></div>
        <div class="pqhh-field"><label for="maxpoints">Points</label><input class="pqhh-input" type="number" id="maxpoints" name="maxpoints" min="1" step="0.01" value="100" required></div>
        <div class="pqhh-field"><label>Assign to</label><div class="pqhh-target-modes"><label><input type="radio" name="target_type" value="course" checked> Entire course</label><label><input type="radio" name="target_type" value="group"> Group</label><label><input type="radio" name="target_type" value="individual"> Individual</label></div></div>
        <div class="pqhh-field" id="pqhh-group-field" hidden><label for="target_groupid">Student group</label><select class="pqhh-select" id="target_groupid" name="target_groupid"><option value="0">Choose group</option><?php foreach ($groups as $group): ?><option value="<?php echo (int)$group->id; ?>" data-group-courses="<?php echo s(implode(',', (array)$group->courseids)); ?>" data-group-count="<?php echo count((array)$group->studentids); ?>"><?php echo s((string)$group->title); ?> (<?php echo count((array)$group->studentids); ?>)</option><?php endforeach; ?></select><?php if (!$groups): ?><div class="pqhh-meta">No assigned class groups are available.</div><?php endif; ?></div>
        <div class="pqhh-field" id="pqhh-individual-field" hidden><label>Individual students enrolled in the course</label><div class="pqhh-students"><?php if (!$students): ?><span class="pqhh-muted">No assigned students are available.</span><?php endif; ?><?php foreach ($students as $student): ?><label data-student-courses="<?php echo s(implode(',', $studentcourseids[(int)$student->id])); ?>"><input type="checkbox" name="studentids[]" value="<?php echo (int)$student->id; ?>"> <?php echo s(fullname($student)); ?></label><?php endforeach; ?><span class="pqhh-muted" id="pqhh-no-course-students" hidden>No assigned students are enrolled in this course.</span></div></div>
        <div class="pqhh-meta" id="pqhh-target-summary">Choose a course to see eligible recipients.</div>
        <div class="pqhh-field"><label><input type="checkbox" name="allowresubmit" value="1" checked> Allow resubmission after feedback</label></div>
        <button class="pqhh-btn pqhh-btn--main" type="submit">Assign homework</button>
      </form>
    </section>
    <section class="pqhh-panel"><h2>Student submissions</h2><div class="pqhh-list">
      <?php if (!$rows): ?><p class="pqhh-muted">No homework has been assigned yet.</p><?php endif; ?>
      <?php foreach ($rows as $row): ?><article class="pqhh-item"><div class="pqhh-item-head"><div><h3><?php echo s((string)$row->title); ?></h3><div class="pqhh-meta"><?php echo s((string)$row->coursename); ?> · <?php echo s(fullname($row)); ?><?php if ((int)$row->duedate > 0): ?> · Due <?php echo s(userdate((int)$row->duedate, '%d %b %Y, %H:%M')); ?><?php endif; ?></div></div><span class="pqhh-status"><?php echo s(pqhh_status_label((string)$row->status)); ?></span></div>
        <?php if (trim((string)$row->response_text) !== ''): ?><div class="pqhh-response"><?php echo s((string)$row->response_text); ?></div><?php endif; ?>
        <?php if ((int)$row->materialid > 0): ?><p><a href="<?php echo (new moodle_url('/local/hubredirect/office_material_file.php', ['workspaceid' => $workspaceid, 'materialid' => (int)$row->materialid]))->out(false); ?>">Open attached material</a></p><?php endif; ?>
        <?php if (in_array((string)$row->status, ['submitted', 'graded'], true)): ?><form class="pqhh-review" method="post"><input type="hidden" name="sesskey" value="<?php echo s(sesskey()); ?>"><input type="hidden" name="action" value="review"><input type="hidden" name="submissionid" value="<?php echo (int)$row->id; ?>"><div class="pqhh-field"><label>Score / <?php echo s((string)$row->maxpoints); ?></label><input class="pqhh-input" type="number" name="scorepoints" min="0" max="<?php echo s((string)$row->maxpoints); ?>" step="0.01" value="<?php echo s((string)$row->scorepoints); ?>"></div><div class="pqhh-field"><label>Feedback</label><input class="pqhh-input" name="feedback" value="<?php echo s((string)$row->feedback); ?>"></div><button class="pqhh-btn" name="decision" value="return">Return</button><button class="pqhh-btn pqhh-btn--main" name="decision" value="grade">Grade</button></form><?php endif; ?>
      </article><?php endforeach; ?>
    </div></section>
  </div>
</div></main>
<script>
(function(){var course=document.getElementById('courseid'),empty=document.getElementById('pqhh-no-course-students'),groupField=document.getElementById('pqhh-group-field'),groupSelect=document.getElementById('target_groupid'),individual=document.getElementById('pqhh-individual-field'),summary=document.getElementById('pqhh-target-summary');if(!course)return;function mode(){var selected=document.querySelector('input[name="target_type"]:checked');return selected?selected.value:'course';}function refresh(){var id=course.value,shown=0,checked=0;document.querySelectorAll('[data-student-courses]').forEach(function(label){var ids=(label.getAttribute('data-student-courses')||'').split(','),box=label.querySelector('input');var visible=id!==''&&ids.indexOf(id)!==-1;label.hidden=!visible;if(!visible&&box)box.checked=false;if(visible){shown++;if(box&&box.checked)checked++;}});if(empty)empty.hidden=id===''||shown>0;var value=mode();if(groupField)groupField.hidden=value!=='group';if(individual)individual.hidden=value!=='individual';if(groupSelect){Array.prototype.forEach.call(groupSelect.options,function(option,index){if(index===0)return;var ids=(option.getAttribute('data-group-courses')||'').split(',');option.hidden=id===''||ids.indexOf(id)===-1;if(option.hidden&&option.selected)groupSelect.value='0';});}if(summary){if(id===''){summary.textContent='Choose a course to see eligible recipients.';}else if(value==='course'){summary.textContent=shown+' enrolled student'+(shown===1?'':'s')+' will receive this homework.';}else if(value==='group'){var option=groupSelect&&groupSelect.options[groupSelect.selectedIndex],count=option?Number(option.getAttribute('data-group-count')||0):0;summary.textContent=count>0?count+' group student'+(count===1?'':'s')+' selected.':'Choose a group enrolled in this course.';}else{summary.textContent=checked+' individual student'+(checked===1?'':'s')+' selected.';}}}course.addEventListener('change',refresh);document.querySelectorAll('input[name="target_type"],input[name="studentids[]"]').forEach(function(input){input.addEventListener('change',refresh);});if(groupSelect)groupSelect.addEventListener('change',refresh);refresh();})();
</script>
<?php echo $OUTPUT->footer();
