<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/workflow_documentlib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Admin workflow requires workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Workflow access denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqwdoc_ready()) {
            throw new invalid_parameter_exception('Admin workflow tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'save_task') {
            $taskid = optional_param('taskid', 0, PARAM_INT);
            $existing = $taskid > 0 ? $DB->get_record('local_prequran_work_task', ['id' => $taskid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $old = $existing ? (array)$existing : [];
            $record = (object)[
                'workspaceid' => $workspaceid,
                'queue' => optional_param('queue', 'support', PARAM_ALPHANUMEXT),
                'tasktype' => optional_param('tasktype', 'general', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'description' => optional_param('description', '', PARAM_TEXT),
                'status' => optional_param('status', 'open', PARAM_ALPHANUMEXT),
                'priority' => optional_param('priority', 'normal', PARAM_ALPHANUMEXT),
                'assignedto' => optional_param('assignedto', 0, PARAM_INT),
                'studentid' => optional_param('studentid', 0, PARAM_INT),
                'targettype' => optional_param('targettype', '', PARAM_ALPHANUMEXT),
                'targetid' => optional_param('targetid', 0, PARAM_INT),
                'duedate' => pqwdoc_date_to_time(optional_param('duedate', '', PARAM_TEXT)),
                'escalated' => optional_param('escalated', 0, PARAM_INT) ? 1 : 0,
                'escalatedto' => optional_param('escalatedto', 0, PARAM_INT),
                'approval_json' => pqwdoc_json(['approval_required' => optional_param('approval_required', 0, PARAM_INT) ? 1 : 0, 'approval_note' => optional_param('approval_note', '', PARAM_TEXT)]),
                'approvedby' => (int)($existing->approvedby ?? 0),
                'approvedat' => (int)($existing->approvedat ?? 0),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'closedby' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'closed' ? (int)$USER->id : 0,
                'closedat' => optional_param('status', 'open', PARAM_ALPHANUMEXT) === 'closed' ? $now : 0,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_work_task', $record);
                $taskid = (int)$existing->id;
                pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'task_updated', $old, (array)$record);
                $notice = 'Task updated.';
            } else {
                $taskid = (int)$DB->insert_record('local_prequran_work_task', $record);
                pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'task_created', [], (array)$record);
                $notice = 'Task created.';
            }
        } else if ($action === 'add_note') {
            $taskid = optional_param('taskid', 0, PARAM_INT);
            $DB->get_record('local_prequran_work_task', ['id' => $taskid, 'workspaceid' => $workspaceid], 'id', MUST_EXIST);
            $DB->insert_record('local_prequran_work_note', (object)[
                'workspaceid' => $workspaceid,
                'taskid' => $taskid,
                'authorid' => (int)$USER->id,
                'visibility' => optional_param('visibility', 'internal', PARAM_ALPHANUMEXT),
                'note' => optional_param('note', '', PARAM_TEXT),
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'note_added', [], ['visibility' => optional_param('visibility', 'internal', PARAM_ALPHANUMEXT)]);
            $notice = 'Internal note saved.';
        } else if ($action === 'approve_task') {
            $task = $DB->get_record('local_prequran_work_task', ['id' => optional_param('taskid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $old = (array)$task;
            $task->status = optional_param('status', 'approved', PARAM_ALPHANUMEXT);
            $task->approvedby = (int)$USER->id;
            $task->approvedat = $now;
            $task->approval_json = pqwdoc_json(['decision_note' => optional_param('decision_note', '', PARAM_TEXT)]);
            $task->timemodified = $now;
            $DB->update_record('local_prequran_work_task', $task);
            pqwdoc_task_audit($workspaceid, (int)$task->id, (int)$USER->id, 'task_approval_updated', $old, (array)$task);
            $notice = 'Task approval updated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/admin_workflow.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Admin Workflow And Task Queue');
$PAGE->set_heading('Admin Workflow And Task Queue');

$staff = pqwdoc_workspace_staff($workspaceid);
$students = pqwdoc_workspace_students($workspaceid);
$tasks = pqh_table_exists_safe('local_prequran_work_task') ? array_values($DB->get_records_sql("SELECT t.*, au.firstname AS afirst, au.lastname AS alast, su.firstname AS sfirst, su.lastname AS slast FROM {local_prequran_work_task} t LEFT JOIN {user} au ON au.id = t.assignedto LEFT JOIN {user} su ON su.id = t.studentid WHERE t.workspaceid = :workspaceid ORDER BY t.status ASC, t.duedate ASC, t.priority DESC, t.timemodified DESC", ['workspaceid' => $workspaceid], 0, 120)) : [];
$notes = pqh_table_exists_safe('local_prequran_work_note') ? array_values($DB->get_records_sql("SELECT n.*, u.firstname, u.lastname FROM {local_prequran_work_note} n LEFT JOIN {user} u ON u.id = n.authorid WHERE n.workspaceid = :workspaceid ORDER BY n.timecreated DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$audits = pqh_table_exists_safe('local_prequran_work_audit') ? array_values($DB->get_records_sql("SELECT a.*, u.firstname, u.lastname FROM {local_prequran_work_audit} a LEFT JOIN {user} u ON u.id = a.actorid WHERE a.workspaceid = :workspaceid ORDER BY a.timecreated DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$queuecounts = [];
foreach ($tasks as $task) {
    $queue = (string)$task->queue;
    $queuecounts[$queue] = ($queuecounts[$queue] ?? 0) + 1;
}

echo $OUTPUT->header();
echo '<style>.pqwf{max-width:1180px;margin:0 auto}.pqwf-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqwf-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqwf-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqwf-field{margin-bottom:10px}.pqwf-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqwf-input,.pqwf-select,.pqwf-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqwf-textarea{min-height:72px}.pqwf-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqwf-btn--light{background:#f7fbf8;color:#173044}.pqwf-table{width:100%;border-collapse:collapse}.pqwf-table th,.pqwf-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqwf-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqwf-muted{color:#617064;font-size:12px}.pqwf-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqwf-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}.pqwf-queues{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:12px}.pqwf-queue{border:1px solid #dfe7df;border-radius:8px;padding:10px;background:#f9fcfa}@media(max-width:900px){.pqwf-grid,.pqwf-top,.pqwf-queues{display:block}.pqwf-queue{margin-bottom:8px}}</style>';
echo '<div class="pqwf"><div class="pqwf-top"><div><h2>Admin Workflow And Task Queue</h2><div class="pqwf-muted">' . s($workspace->name) . ' work queues, approvals, escalations, assignees, due dates, internal notes, and audit history.</div></div><a class="pqwf-btn pqwf-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqwf-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqwf-error">' . s($error) . '</div>'; }
if (!pqwdoc_ready()) { echo '<div class="pqwf-error">Admin workflow schema is not ready. Run Moodle upgrade.</div>'; }
echo '<div class="pqwf-queues">';
foreach (['admissions', 'finance', 'registrar', 'teachers', 'support'] as $queue) {
    echo '<div class="pqwf-queue"><strong>' . s(ucfirst($queue)) . '</strong><div class="pqwf-muted">' . (int)($queuecounts[$queue] ?? 0) . ' active task(s)</div></div>';
}
echo '</div><div class="pqwf-grid"><section class="pqwf-panel"><h3>Create / Update Task</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="save_task">';
echo '<div class="pqwf-field"><label>Task ID for update</label><input class="pqwf-input" name="taskid"></div><div class="pqwf-field"><label>Queue</label><select class="pqwf-select" name="queue">';
foreach (['admissions', 'finance', 'registrar', 'teachers', 'support'] as $queue) { echo '<option value="' . s($queue) . '">' . s(ucfirst($queue)) . '</option>'; }
echo '</select></div>';
foreach ([['title','Title'],['tasktype','Task type'],['status','Status'],['priority','Priority'],['duedate','Due date'],['targettype','Target type'],['targetid','Target ID']] as $field) {
    echo '<div class="pqwf-field"><label>' . s($field[1]) . '</label><input class="pqwf-input" name="' . s($field[0]) . '"></div>';
}
echo '<div class="pqwf-field"><label>Assigned staff</label><select class="pqwf-select" name="assignedto"><option value="0">Unassigned</option>';
foreach ($staff as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqwf-field"><label>Student</label><select class="pqwf-select" name="studentid"><option value="0">No student</option>';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqwf-field"><label>Escalate to</label><select class="pqwf-select" name="escalatedto"><option value="0">No escalation</option>';
foreach ($staff as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqwf-field"><label><input type="checkbox" name="escalated" value="1"> Escalated</label></div><div class="pqwf-field"><label><input type="checkbox" name="approval_required" value="1"> Approval required</label></div><div class="pqwf-field"><label>Approval note</label><textarea class="pqwf-textarea" name="approval_note"></textarea></div><div class="pqwf-field"><label>Description</label><textarea class="pqwf-textarea" name="description"></textarea></div><button class="pqwf-btn" type="submit">Save Task</button></form><hr><h3>Internal Note</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="add_note"><div class="pqwf-field"><label>Task</label><select class="pqwf-select" name="taskid">';
foreach ($tasks as $task) { echo '<option value="' . (int)$task->id . '">#' . (int)$task->id . ' ' . s($task->title) . '</option>'; }
echo '</select></div><div class="pqwf-field"><label>Visibility</label><select class="pqwf-select" name="visibility"><option value="internal">Internal</option><option value="audit">Audit note</option><option value="handoff">Handoff</option></select></div><div class="pqwf-field"><label>Note</label><textarea class="pqwf-textarea" name="note"></textarea></div><button class="pqwf-btn" type="submit">Add Note</button></form></section><section class="pqwf-panel"><h3>Work Queue</h3><table class="pqwf-table"><thead><tr><th>Task</th><th>Owner</th><th>Workflow</th><th>Approve</th></tr></thead><tbody>';
foreach ($tasks as $task) {
    echo '<tr><td><strong>#' . (int)$task->id . ' ' . s($task->title) . '</strong><div class="pqwf-muted">' . s($task->queue . ' / ' . $task->tasktype) . '</div></td><td>' . s(trim($task->afirst . ' ' . $task->alast)) . '<div class="pqwf-muted">' . s(trim($task->sfirst . ' ' . $task->slast)) . '</div></td><td><span class="pqwf-pill">' . s($task->status) . '</span> <span class="pqwf-pill">' . s($task->priority) . '</span><div class="pqwf-muted">Due ' . s((int)$task->duedate > 0 ? userdate((int)$task->duedate, '%Y-%m-%d') : 'none') . ((int)$task->escalated ? ' / escalated' : '') . '</div></td><td><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="approve_task"><input type="hidden" name="taskid" value="' . (int)$task->id . '"><select class="pqwf-select" name="status"><option value="approved">Approved</option><option value="needs_changes">Needs changes</option><option value="closed">Closed</option></select><input class="pqwf-input" name="decision_note" placeholder="Decision note"><button class="pqwf-btn pqwf-btn--light">Save</button></form></td></tr>';
}
if (!$tasks) { echo '<tr><td colspan="4" class="pqwf-muted">No workflow tasks yet.</td></tr>'; }
echo '</tbody></table><h3>Internal Notes</h3><table class="pqwf-table"><thead><tr><th>Task</th><th>Author</th><th>Note</th></tr></thead><tbody>';
foreach ($notes as $note) { echo '<tr><td>#' . (int)$note->taskid . '<div class="pqwf-muted">' . s($note->visibility) . '</div></td><td>' . s(trim($note->firstname . ' ' . $note->lastname)) . '<div class="pqwf-muted">' . s(userdate((int)$note->timecreated)) . '</div></td><td>' . s(core_text::substr($note->note, 0, 180)) . '</td></tr>'; }
if (!$notes) { echo '<tr><td colspan="3" class="pqwf-muted">No internal notes yet.</td></tr>'; }
echo '</tbody></table><h3>Audit History</h3><table class="pqwf-table"><thead><tr><th>Task</th><th>Actor</th><th>Action</th></tr></thead><tbody>';
foreach ($audits as $audit) { echo '<tr><td>#' . (int)$audit->taskid . '</td><td>' . s(trim($audit->firstname . ' ' . $audit->lastname)) . '<div class="pqwf-muted">' . s(userdate((int)$audit->timecreated)) . '</div></td><td><span class="pqwf-pill">' . s($audit->action) . '</span></td></tr>'; }
if (!$audits) { echo '<tr><td colspan="3" class="pqwf-muted">No audit entries yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
