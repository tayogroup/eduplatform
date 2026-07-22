<?php
// ---- report: admin-workflow (workspace task queue + approvals + audit) -------
// Ported from local_hubredirect/admin_workflow.php (which stays live in
// parallel). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
//
// GET  = the workspace work queue (staff + students + tasks + notes + audit
//        history + per-queue counts), exactly as the legacy page loads them,
//        plus assignee/student/author/actor names.
// POST = do=save_task | add_note | approve_task — each is the legacy action=...
//        write ported verbatim over a JSON body, including the pqwdoc_task_audit
//        writes. require_sesskey() is dropped (token auth replaces the session
//        key); the legacy page's HTML notice becomes an ok JSON payload with the
//        same message.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workflow_documentlib.php');
require_once($CFG->dirroot . '/local/hubredirect/admin_workflow_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- Access: identical to the legacy page (workspace administrator only). ------
// pqh_access_denied(...) on the page becomes pqpd_fail(403, <same message>).
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Admin workflow requires workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        pqpd_fail(400, 'Invalid request body.');
    }
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);

    // require_sesskey() dropped: token auth replaces the session key.
    if (!pqwdoc_ready()) {
        pqpd_fail(409, 'Admin workflow tables are not ready. Run Moodle upgrade.');
    }

    // JSON-body equivalents of the page's optional_param reads.
    $bint = static function (string $name, int $default = 0) use ($body): int {
        return (int)clean_param($body[$name] ?? $default, PARAM_INT);
    };
    $balpha = static function (string $name, string $default = '') use ($body): string {
        return clean_param((string)($body[$name] ?? $default), PARAM_ALPHANUMEXT);
    };
    $btext = static function (string $name, string $default = '') use ($body): string {
        return clean_param((string)($body[$name] ?? $default), PARAM_TEXT);
    };

    $now = time();
    try {
        // -- write: save_task (legacy action=save_task, verbatim) --------------
        if ($action === 'save_task') {
            $taskid = $bint('taskid');
            $existing = $taskid > 0 ? $DB->get_record('local_prequran_work_task', ['id' => $taskid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $old = $existing ? (array)$existing : [];
            $record = (object)[
                'workspaceid' => $workspaceid,
                'queue' => $balpha('queue', 'support'),
                'tasktype' => $balpha('tasktype', 'general'),
                'title' => $btext('title'),
                'description' => $btext('description'),
                'status' => $balpha('status', 'open'),
                'priority' => $balpha('priority', 'normal'),
                'assignedto' => $bint('assignedto'),
                'studentid' => $bint('studentid'),
                'targettype' => $balpha('targettype', ''),
                'targetid' => $bint('targetid'),
                'duedate' => pqwdoc_date_to_time($btext('duedate')),
                'escalated' => $bint('escalated') ? 1 : 0,
                'escalatedto' => $bint('escalatedto'),
                'approval_json' => pqwdoc_json(['approval_required' => $bint('approval_required') ? 1 : 0, 'approval_note' => $btext('approval_note')]),
                'approvedby' => (int)($existing->approvedby ?? 0),
                'approvedat' => (int)($existing->approvedat ?? 0),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'closedby' => $balpha('status', 'open') === 'closed' ? (int)$USER->id : 0,
                'closedat' => $balpha('status', 'open') === 'closed' ? $now : 0,
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_work_task', $record);
                $taskid = (int)$existing->id;
                pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'task_updated', $old, (array)$record);
                $message = 'Task updated.';
            } else {
                $taskid = (int)$DB->insert_record('local_prequran_work_task', $record);
                pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'task_created', [], (array)$record);
                $message = 'Task created.';
            }
            echo json_encode(['ok' => true, 'message' => $message, 'taskid' => $taskid], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: add_note (legacy action=add_note, verbatim) ----------------
        if ($action === 'add_note') {
            $taskid = $bint('taskid');
            $DB->get_record('local_prequran_work_task', ['id' => $taskid, 'workspaceid' => $workspaceid], 'id', MUST_EXIST);
            $DB->insert_record('local_prequran_work_note', (object)[
                'workspaceid' => $workspaceid,
                'taskid' => $taskid,
                'authorid' => (int)$USER->id,
                'visibility' => $balpha('visibility', 'internal'),
                'note' => $btext('note'),
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'note_added', [], ['visibility' => $balpha('visibility', 'internal')]);
            echo json_encode(['ok' => true, 'message' => 'Internal note saved.', 'taskid' => $taskid], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: approve_task (legacy action=approve_task, verbatim) --------
        if ($action === 'approve_task') {
            $task = $DB->get_record('local_prequran_work_task', ['id' => $bint('taskid'), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $old = (array)$task;
            $task->status = $balpha('status', 'approved');
            $task->approvedby = (int)$USER->id;
            $task->approvedat = $now;
            $task->approval_json = pqwdoc_json(['decision_note' => $btext('decision_note')]);
            $task->timemodified = $now;
            $DB->update_record('local_prequran_work_task', $task);
            pqwdoc_task_audit($workspaceid, (int)$task->id, (int)$USER->id, 'task_approval_updated', $old, (array)$task);
            echo json_encode(['ok' => true, 'message' => 'Task approval updated.', 'taskid' => (int)$task->id], JSON_UNESCAPED_SLASHES);
            exit;
        }

        pqpd_fail(400, 'Unknown admin-workflow action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: the work queue (same loads + ordering as the page) -------------------
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

// Decorate join names + due-date label (the page renders these inline).
foreach ($tasks as $task) {
    $task->assignee_name = trim((string)$task->afirst . ' ' . (string)$task->alast);
    $task->student_name = trim((string)$task->sfirst . ' ' . (string)$task->slast);
    $task->duedate_label = (int)$task->duedate > 0 ? userdate((int)$task->duedate, '%Y-%m-%d') : 'none';
}
foreach ($notes as $note) {
    $note->author_name = trim((string)$note->firstname . ' ' . (string)$note->lastname);
    $note->timecreated_label = userdate((int)$note->timecreated);
    $note->note_excerpt = core_text::substr((string)$note->note, 0, 180);
}
foreach ($audits as $audit) {
    $audit->actor_name = trim((string)$audit->firstname . ' ' . (string)$audit->lastname);
    $audit->timecreated_label = userdate((int)$audit->timecreated);
}

$staffout = [];
foreach ($staff as $user) {
    $staffout[] = ['id' => (int)$user->id, 'label' => fullname($user) . ' / ' . (string)$user->workspace_role];
}
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = ['id' => (int)$student->id, 'label' => fullname($student)];
}

$nameids = [];
foreach ($tasks as $task) {
    $nameids[] = (int)($task->assignedto ?? 0);
    $nameids[] = (int)($task->studentid ?? 0);
    $nameids[] = (int)($task->createdby ?? 0);
}
foreach ($notes as $note) {
    $nameids[] = (int)($note->authorid ?? 0);
}
foreach ($audits as $audit) {
    $nameids[] = (int)($audit->actorid ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => pqwdoc_ready(),
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'queues' => ['admissions', 'finance', 'registrar', 'teachers', 'support'],
    'queuecounts' => $queuecounts,
    'staff' => $staffout,
    'students' => $studentsout,
    'tasks' => $tasks,
    'notes' => $notes,
    'audits' => $audits,
    'supporturl' => $CFG->wwwroot . '/local/hubredirect/admin_workflow.php?workspaceid=' . $workspaceid,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
