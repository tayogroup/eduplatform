<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once($CFG->dirroot . '/local/prequran/notificationlib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($studentid > 0) {
    $urlparams['studentid'] = $studentid;
}

if ($workspaceid <= 0 || $studentid <= 0) {
    pqh_access_denied(
        'A workspace and student are required to view this profile.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Student profile not available'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'The selected teaching workspace was not found.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Workspace not found'
    );
}

function pqws_select_fields(string $table, array $wanted): string {
    $fields = [];
    foreach ($wanted as $field) {
        if (pqh_table_has_field_safe($table, $field)) {
            $fields[] = $field;
        }
    }
    return $fields ? implode(',', $fields) : '*';
}

function pqws_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqws_student_in_workspace(int $workspaceid, int $studentid): bool {
    global $DB;
    if (pqh_table_exists_safe('local_prequran_workspace_member')
        && $DB->record_exists('local_prequran_workspace_member', [
            'workspaceid' => $workspaceid,
            'userid' => $studentid,
            'workspace_role' => 'student',
            'status' => 'active',
        ])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')
        && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')
        && $DB->record_exists('local_prequran_student_profile', ['workspaceid' => $workspaceid, 'userid' => $studentid])) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')
        && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')
        && $DB->record_exists('local_prequran_teacher_student', [
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'status' => 'active',
        ])) {
        return true;
    }
    return false;
}

function pqws_user_can_view_student(int $userid, int $workspaceid, int $studentid): bool {
    global $DB;
    if ($userid === $studentid) {
        return true;
    }
    if (pqh_user_can_manage_workspace($userid, $workspaceid)) {
        return true;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $conditions = ['teacherid' => $userid, 'studentid' => $studentid, 'status' => 'active'];
        if (pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
            $conditions['workspaceid'] = $workspaceid;
        }
        if ($DB->record_exists('local_prequran_teacher_student', $conditions)) {
            return true;
        }
    }
    return false;
}

function pqws_student_profile(int $studentid): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_student_profile')) {
        return null;
    }
    return $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING) ?: null;
}

function pqws_assigned_teachers(int $workspaceid, int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_student')) {
        return [];
    }
    $where = ['studentid' => $studentid, 'status' => 'active'];
    if (pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        $where['workspaceid'] = $workspaceid;
    }
    $rows = $DB->get_records('local_prequran_teacher_student', $where, 'timemodified DESC', pqws_select_fields('local_prequran_teacher_student', ['id', 'teacherid', 'timemodified']));
    $teachers = [];
    foreach ($rows as $row) {
        $teacher = core_user::get_user((int)$row->teacherid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING);
        if ($teacher) {
            $teacher->assignedat = (int)($row->timemodified ?? 0);
            $teachers[] = $teacher;
        }
    }
    return $teachers;
}

function pqws_notification_audit_exists(int $assignmentid, string $action): bool {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return false;
    }
    return $DB->record_exists('local_prequran_live_audit', [
        'sessionid' => 0,
        'targettype' => 'material_assignment',
        'targetid' => $assignmentid,
        'action' => $action,
    ]);
}

function pqws_mark_notification_audit(int $workspaceid, int $assignmentid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $details['workspaceid'] = $workspaceid;
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'material_assignment',
        'targetid' => $assignmentid,
        'details' => json_encode($details),
        'timecreated' => time(),
    ]);
}

function pqws_workspace_teaching_recipient_ids(int $workspaceid, int $studentid): array {
    global $DB;
    $ids = [];
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $conditions = ['studentid' => $studentid, 'status' => 'active'];
        if (pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
            $conditions['workspaceid'] = $workspaceid;
        }
        foreach ($DB->get_records('local_prequran_teacher_student', $conditions, '', 'id,teacherid') as $row) {
            $teacherid = (int)$row->teacherid;
            if ($teacherid > 0) {
                $ids[$teacherid] = $teacherid;
            }
        }
    }
    if (!$ids && pqh_table_exists_safe('local_prequran_workspace_member')) {
        [$insql, $params] = $DB->get_in_or_equal(['owner', 'admin', 'teacher', 'assistant_teacher'], SQL_PARAMS_NAMED, 'role');
        $params['workspaceid'] = $workspaceid;
        $params['status'] = 'active';
        foreach ($DB->get_records_sql(
            "SELECT userid
               FROM {local_prequran_workspace_member}
              WHERE workspaceid = :workspaceid
                AND status = :status
                AND workspace_role {$insql}",
            $params
        ) as $row) {
            $userid = (int)$row->userid;
            if ($userid > 0) {
                $ids[$userid] = $userid;
            }
        }
    }
    return array_values($ids);
}

function pqws_notify_teachers_material_completed(int $workspaceid, int $studentid, stdClass $assignment): void {
    global $DB;
    $assignmentid = (int)$assignment->id;
    if ($assignmentid <= 0 || pqws_notification_audit_exists($assignmentid, 'workspace_material_completed_teacher_notified')) {
        return;
    }
    $material = $DB->get_record('local_prequran_workspace_material', ['id' => (int)$assignment->materialid], 'id,title', IGNORE_MISSING);
    $title = $material ? (string)$material->title : 'Assigned material';
    $student = core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING);
    $studentname = $student ? fullname($student) : 'Student ' . $studentid;
    $recipients = pqws_workspace_teaching_recipient_ids($workspaceid, $studentid);
    $url = new moodle_url('/local/hubredirect/workspace_student.php', ['workspaceid' => $workspaceid, 'studentid' => $studentid]);
    $sent = 0;
    foreach ($recipients as $recipientid) {
        if (local_prequran_notify_user_live_update(
            0,
            (int)$recipientid,
            'Material completed',
            $studentname . ' completed ' . $title . '.',
            $url,
            'Open student profile',
            'workspace_material_completed',
            $studentid
        )) {
            $sent++;
        }
    }
    pqws_mark_notification_audit($workspaceid, $assignmentid, 'workspace_material_completed_teacher_notified', [
        'studentid' => $studentid,
        'materialid' => (int)$assignment->materialid,
        'recipients_notified' => $sent,
    ]);
}

function pqws_guardians(int $workspaceid, int $studentid): array {
    global $DB;
    $guardianids = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqh_table_exists_safe($table) || !pqh_table_has_field_safe($table, 'guardianid')) {
            continue;
        }
        $params = ['studentid' => $studentid];
        $where = 'studentid = :studentid';
        if (pqh_table_has_field_safe($table, 'workspaceid')) {
            $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0)';
            $params['workspaceid'] = $workspaceid;
        }
        foreach ($DB->get_records_select($table, $where, $params, 'timemodified DESC', 'id,guardianid', 0, 20) as $row) {
            $guardianids[(int)$row->guardianid] = (int)$row->guardianid;
        }
    }
    $guardians = [];
    foreach ($guardianids as $guardianid) {
        $guardian = core_user::get_user($guardianid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING);
        if ($guardian) {
            $guardians[] = $guardian;
        }
    }
    return $guardians;
}

function pqws_consent_rows(int $workspaceid, int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_consent')) {
        return [];
    }
    $params = ['studentid' => $studentid];
    $where = 'studentid = :studentid';
    if (pqh_table_has_field_safe('local_prequran_live_consent', 'workspaceid')) {
        $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0)';
        $params['workspaceid'] = $workspaceid;
    }
    return array_values($DB->get_records_select(
        'local_prequran_live_consent',
        $where,
        $params,
        'timemodified DESC',
        pqws_select_fields('local_prequran_live_consent', ['id', 'guardianid', 'consent_type', 'granted', 'consent_source', 'timemodified']),
        0,
        12
    ));
}

function pqws_attendance_summary(int $workspaceid, int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_attendance')) {
        return ['total' => 0, 'present' => 0, 'absent' => 0, 'recent' => []];
    }
    $params = ['studentid' => $studentid];
    $where = 'studentid = :studentid';
    if (pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
        $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0 OR workspaceid IS NULL)';
        $params['workspaceid'] = $workspaceid;
    }
    $rows = array_values($DB->get_records_select(
        'local_prequran_live_attendance',
        $where,
        $params,
        'timemodified DESC',
        pqws_select_fields('local_prequran_live_attendance', ['id', 'sessionid', 'attendance_status', 'participation_status', 'join_time', 'leave_time', 'timemodified']),
        0,
        8
    ));
    $total = (int)$DB->count_records_select('local_prequran_live_attendance', $where, $params);
    $present = (int)$DB->count_records_select('local_prequran_live_attendance', $where . " AND attendance_status IN ('present','attended')", $params);
    return [
        'total' => $total,
        'present' => $present,
        'absent' => max(0, $total - $present),
        'recent' => $rows,
    ];
}

function pqws_recent_notes(int $workspaceid, int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_note')) {
        return [];
    }
    $params = ['studentid' => $studentid];
    $where = 'studentid = :studentid';
    if (pqh_table_has_field_safe('local_prequran_live_note', 'workspaceid')) {
        $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0 OR workspaceid IS NULL)';
        $params['workspaceid'] = $workspaceid;
    }
    return array_values($DB->get_records_select(
        'local_prequran_live_note',
        $where,
        $params,
        'timemodified DESC',
        pqws_select_fields('local_prequran_live_note', ['id', 'sessionid', 'teacherid', 'strengths', 'needs_practice', 'homework', 'followup_status', 'parent_summary', 'timemodified']),
        0,
        6
    ));
}

function pqws_quiz_summary(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_quiz_attempt')) {
        return ['total' => 0, 'completed' => 0, 'best' => 0, 'recent' => []];
    }
    $total = (int)$DB->count_records('local_prequran_quiz_attempt', ['userid' => $studentid]);
    $completed = pqh_table_has_field_safe('local_prequran_quiz_attempt', 'completed_at')
        ? (int)$DB->count_records_select('local_prequran_quiz_attempt', 'userid = ? AND completed_at > 0', [$studentid])
        : 0;
    $best = pqh_table_has_field_safe('local_prequran_quiz_attempt', 'percent')
        ? (int)$DB->get_field_sql('SELECT MAX(percent) FROM {local_prequran_quiz_attempt} WHERE userid = ?', [$studentid])
        : 0;
    $recent = array_values($DB->get_records(
        'local_prequran_quiz_attempt',
        ['userid' => $studentid],
        pqh_table_has_field_safe('local_prequran_quiz_attempt', 'last_activity_at') ? 'last_activity_at DESC' : 'timemodified DESC',
        pqws_select_fields('local_prequran_quiz_attempt', ['id', 'lessonid', 'unitid', 'quizid', 'status', 'percent', 'questions_answered', 'questions_total', 'last_activity_at', 'timemodified']),
        0,
        6
    ));
    return ['total' => $total, 'completed' => $completed, 'best' => $best, 'recent' => $recent];
}

function pqws_lesson_summary(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_lessonprog')) {
        return ['total' => 0, 'completed' => 0, 'recent' => []];
    }
    $total = (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid]);
    $completed = pqh_table_has_field_safe('local_prequran_lessonprog', 'overall_status')
        ? (int)$DB->count_records('local_prequran_lessonprog', ['userid' => $studentid, 'overall_status' => 'completed'])
        : 0;
    $recent = array_values($DB->get_records(
        'local_prequran_lessonprog',
        ['userid' => $studentid],
        pqh_table_has_field_safe('local_prequran_lessonprog', 'overall_lastactivity') ? 'overall_lastactivity DESC' : 'timemodified DESC',
        pqws_select_fields('local_prequran_lessonprog', ['id', 'lessonid', 'unitid', 'overall_status', 'overall_percent', 'overall_lastactivity', 'timemodified']),
        0,
        6
    ));
    return ['total' => $total, 'completed' => $completed, 'recent' => $recent];
}

function pqws_assigned_materials(int $workspaceid, int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT a.id, a.materialid, a.target_type, a.status, a.workflow_status, a.startedat, a.completedat, a.reviewedat, a.timemodified,
                m.title, m.material_type, m.course_key, m.description, m.source_url, m.visibility
           FROM {local_prequran_workspace_mat_assign} a
           JOIN {local_prequran_workspace_material} m ON m.id = a.materialid
          WHERE a.workspaceid = :workspaceid
            AND a.target_type = :targettype
            AND a.targetid = :studentid
            AND a.status = :status
       ORDER BY a.timemodified DESC, a.id DESC",
        ['workspaceid' => $workspaceid, 'targettype' => 'student', 'studentid' => $studentid, 'status' => 'active'],
        0,
        12
    ));
}

function pqws_material_workflow_statuses(): array {
    return [
        'assigned' => 'Assigned',
        'in_progress' => 'In progress',
        'completed' => 'Completed',
        'reviewed' => 'Reviewed',
    ];
}

function pqws_update_own_material_status(int $workspaceid, int $studentid): void {
    global $DB, $USER;
    if ((int)$USER->id !== $studentid) {
        throw new invalid_parameter_exception('Only the assigned student can update this material progress from the student page.');
    }
    if (!pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'workflow_status')) {
        throw new invalid_parameter_exception('Material assignment workflow fields are not ready. Run the local_prequran Moodle upgrade.');
    }
    $assignmentid = optional_param('assignmentid', 0, PARAM_INT);
    $workflow = optional_param('workflow_status', '', PARAM_ALPHANUMEXT);
    if (!in_array($workflow, ['in_progress', 'completed'], true)) {
        throw new invalid_parameter_exception('Students can mark assigned materials as in progress or completed.');
    }
    $assignment = $DB->get_record('local_prequran_workspace_mat_assign', [
        'id' => $assignmentid,
        'workspaceid' => $workspaceid,
        'target_type' => 'student',
        'targetid' => $studentid,
        'status' => 'active',
    ]);
    if (!$assignment) {
        throw new invalid_parameter_exception('Material assignment was not found for this student.');
    }

    $now = time();
    $assignment->workflow_status = $workflow;
    if ($workflow === 'in_progress' && empty($assignment->startedat) && pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'startedat')) {
        $assignment->startedat = $now;
    }
    if ($workflow === 'completed' && pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'completedat')) {
        $assignment->completedat = empty($assignment->completedat) ? $now : (int)$assignment->completedat;
        if (empty($assignment->startedat) && pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'startedat')) {
            $assignment->startedat = $now;
        }
    }
    $assignment->timemodified = $now;
    $DB->update_record('local_prequran_workspace_mat_assign', $assignment);
    if ($workflow === 'completed') {
        pqws_notify_teachers_material_completed($workspaceid, $studentid, $assignment);
    }
}

if (!pqws_student_in_workspace($workspaceid, $studentid) || !pqws_user_can_view_student((int)$USER->id, $workspaceid, $studentid)) {
    pqh_access_denied(
        'This student is not available in the selected workspace for your account.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]),
        'Workspace student access required'
    );
}

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the workspace student page and try again.',
            new moodle_url('/local/hubredirect/workspace_student.php', $urlparams),
            'Workspace student form expired'
        );
    }
    try {
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        if ($action === 'update_material_status') {
            pqws_update_own_material_status($workspaceid, $studentid);
            $message = 'Material progress updated.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$studentuser = core_user::get_user($studentid, 'id,firstname,lastname,email,username,idnumber', IGNORE_MISSING);
if (!$studentuser) {
    pqh_access_denied(
        'The selected student account was not found.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', array_diff_key($urlparams, ['studentid' => true])),
        'Workspace student unavailable'
    );
}
$profile = pqws_student_profile($studentid);
$studentname = $profile && trim((string)($profile->student_display_name ?? '')) !== '' ? (string)$profile->student_display_name : fullname($studentuser);
$teachers = pqws_assigned_teachers($workspaceid, $studentid);
$guardians = pqws_guardians($workspaceid, $studentid);
$consents = pqws_consent_rows($workspaceid, $studentid);
$attendance = pqws_attendance_summary($workspaceid, $studentid);
$notes = pqws_recent_notes($workspaceid, $studentid);
$quiz = pqws_quiz_summary($studentid);
$lessons = pqws_lesson_summary($studentid);
$materials = pqws_assigned_materials($workspaceid, $studentid);
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$canteach = pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid);
$context = context_system::instance();

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_student.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Workspace Student');
$PAGE->set_heading('Workspace Student');
$PAGE->add_body_class('pqw-student-page');

echo $OUTPUT->header();
?>
<style>
body.pqw-student-page header,body.pqw-student-page footer,body.pqw-student-page nav.navbar,body.pqw-student-page #page-header,body.pqw-student-page #page-footer,body.pqw-student-page .drawer,body.pqw-student-page .drawer-toggles,body.pqw-student-page .block-region,body.pqw-student-page [data-region="drawer"],body.pqw-student-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-student-page #page,body.pqw-student-page #page-content,body.pqw-student-page #region-main,body.pqw-student-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqws-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqws-wrap{max-width:1280px;margin:0 auto}.pqws-top,.pqws-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqws-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqws-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqws-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqws-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqws-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}.pqws-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqws-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqws-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqws-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqws-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqws-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pqws-panel h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950}.pqws-table{width:100%;border-collapse:separate;border-spacing:0}.pqws-table th,.pqws-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqws-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqws-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqws-muted{display:block;margin-top:3px;color:#728391;font-size:12px;font-weight:800}.pqws-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqws-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqws-profile{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pqws-profile div{padding:10px;border-radius:8px;background:#fbfdff;border:1px solid rgba(23,48,68,.08)}.pqws-profile strong{display:block;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}.pqws-profile span{display:block;margin-top:4px;color:#173044;font-size:13px;font-weight:850}.pqws-note{padding:12px;border-bottom:1px solid rgba(23,48,68,.1)}.pqws-note:last-child{border-bottom:0}.pqws-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqws-alert--ok{background:#edf9ef;color:#245c35}.pqws-alert--bad{background:#fff0ed;color:#883526}.pqws-status-form{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
@media(max-width:980px){.pqws-top,.pqws-grid{grid-template-columns:1fr}.pqws-actions{justify-content:flex-start}.pqws-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqws-profile{grid-template-columns:1fr}}
@media(max-width:680px){.pqws-metrics{grid-template-columns:1fr}.pqws-table,.pqws-table tbody,.pqws-table tr,.pqws-table td{display:block;width:100%}.pqws-table thead{display:none}.pqws-table tr{border-bottom:1px solid rgba(23,48,68,.12)}.pqws-table td{border:0}.pqws-table td::before{content:attr(data-label);display:block;margin-bottom:4px;color:#5e7280;font-size:11px;font-weight:950;text-transform:uppercase}}
<?php echo pqh_workspace_header_css(); ?>
</style>
<main class="pqws-shell">
  <div class="pqws-wrap">
    <section class="pqws-top pqh-workspace-top">
      <div>
        <h1 class="pqws-title pqh-workspace-title"><?php echo s($studentname); ?></h1>
        <p class="pqws-sub pqh-workspace-sub"><?php echo s($workspace->name); ?> student profile - <?php echo s(pqh_account_no_label($studentuser)); ?> - Moodle user #<?php echo (int)$studentid; ?></p>
      </div>
      <nav class="pqws-actions pqh-workspace-actions" aria-label="Student profile navigation">
        <button class="pqws-btn pqws-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqws-btn pqws-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', ['workspaceid' => $workspaceid]))->out(false); ?>">Workspace dashboard</a>
        <a class="pqws-btn pqws-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/student_billing.php', ['workspaceid' => $workspaceid, 'studentid' => $studentid]))->out(false); ?>">Billing</a>
        <?php if ($canmanage): ?><a class="pqws-btn pqws-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_people.php', ['workspaceid' => $workspaceid]))->out(false); ?>">People</a><?php endif; ?>
        <?php if ($canteach): ?><a class="pqws-btn pqws-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_materials.php', ['workspaceid' => $workspaceid]))->out(false); ?>">Materials</a><?php endif; ?>
        <?php if ($canteach): ?><a class="pqws-btn pqws-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', ['workspaceid' => $workspaceid, 'studentid' => $studentid]))->out(false); ?>">Workspace report</a><?php endif; ?>
        <a class="pqws-btn pqws-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/managed_reports.php', ['studentid' => $studentid]))->out(false); ?>">Student report</a>
        <a class="pqws-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqws-alert pqws-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqws-alert pqws-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <section class="pqws-metrics" aria-label="Student metrics">
      <div class="pqws-metric"><strong><?php echo (int)$lessons['completed']; ?>/<?php echo (int)$lessons['total']; ?></strong><span>lessons completed</span></div>
      <div class="pqws-metric"><strong><?php echo (int)$quiz['completed']; ?>/<?php echo (int)$quiz['total']; ?></strong><span>quiz attempts completed</span></div>
      <div class="pqws-metric"><strong><?php echo (int)$quiz['best']; ?>%</strong><span>best quiz score</span></div>
      <div class="pqws-metric"><strong><?php echo (int)$attendance['present']; ?>/<?php echo (int)$attendance['total']; ?></strong><span>live attendance</span></div>
    </section>

    <section class="pqws-grid">
      <article class="pqws-panel">
        <h2>Student Details</h2>
        <div class="pqws-profile">
          <div><strong>Email</strong><span><?php echo s((string)$studentuser->email); ?></span></div>
          <div><strong>Account No.</strong><span><?php echo s(pqh_account_no_value($studentuser) ?: 'pending repair'); ?></span></div>
          <div><strong>Username</strong><span><?php echo s((string)$studentuser->username); ?></span></div>
          <div><strong>Level</strong><span><?php echo s((string)($profile->current_level ?? '')); ?></span></div>
          <div><strong>Status</strong><span><?php echo s((string)($profile->status ?? 'active')); ?></span></div>
          <div><strong>Age band</strong><span><?php echo s((string)($profile->age_band ?? '')); ?></span></div>
          <div><strong>Language</strong><span><?php echo s((string)($profile->language ?? ($profile->primary_language ?? ''))); ?></span></div>
          <div><strong>Country</strong><span><?php echo s((string)($profile->country ?? '')); ?></span></div>
          <div><strong>Enrollment approval</strong><span><?php echo s((string)($profile->enrollment_approval_status ?? '')); ?></span></div>
        </div>
      </article>

      <article class="pqws-panel">
        <h2>Teachers & Parents</h2>
        <?php if (!$teachers): ?><div class="pqws-empty">No active teacher assignment found.</div><?php else: ?>
          <?php foreach ($teachers as $teacher): ?>
            <span class="pqws-pill"><?php echo s(fullname($teacher)); ?> - <?php echo s(pqh_account_no_label($teacher)); ?><?php echo !empty($teacher->email) ? ' - ' . s($teacher->email) : ''; ?></span>
          <?php endforeach; ?>
        <?php endif; ?>
        <h2 style="margin-top:18px">Linked Parents</h2>
        <?php if (!$guardians): ?><div class="pqws-empty">No linked parent or guardian found.</div><?php else: ?>
          <?php foreach ($guardians as $guardian): ?>
            <span class="pqws-pill"><?php echo s(fullname($guardian)); ?> - <?php echo s(pqh_account_no_label($guardian)); ?><?php echo !empty($guardian->email) ? ' - ' . s($guardian->email) : ''; ?></span>
          <?php endforeach; ?>
        <?php endif; ?>
      </article>

      <article class="pqws-panel">
        <h2>Live Consent</h2>
        <?php if (!$consents): ?><div class="pqws-empty">No live consent rows found.</div><?php else: ?>
          <table class="pqws-table">
            <thead><tr><th>Type</th><th>Guardian</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($consents as $consent): ?>
                <tr>
                  <td data-label="Type"><?php echo s((string)($consent->consent_type ?? '')); ?></td>
                  <td data-label="Guardian"><?php echo s(pqws_user_name((int)($consent->guardianid ?? 0))); ?></td>
                  <td data-label="Status"><span class="pqws-pill"><?php echo !empty($consent->granted) ? 'granted' : 'not granted'; ?></span></td>
                  <td data-label="Updated"><?php echo s(userdate((int)($consent->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqws-panel">
        <h2>Recent Live Attendance</h2>
        <?php if (!$attendance['recent']): ?><div class="pqws-empty">No attendance rows found yet.</div><?php else: ?>
          <table class="pqws-table">
            <thead><tr><th>Session</th><th>Attendance</th><th>Participation</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($attendance['recent'] as $row): ?>
                <tr>
                  <td data-label="Session">#<?php echo (int)($row->sessionid ?? 0); ?></td>
                  <td data-label="Attendance"><span class="pqws-pill"><?php echo s((string)($row->attendance_status ?? '')); ?></span></td>
                  <td data-label="Participation"><?php echo s((string)($row->participation_status ?? '')); ?></td>
                  <td data-label="Updated"><?php echo s(userdate((int)($row->timemodified ?? $row->join_time ?? 0), get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqws-panel">
        <h2>Recent Lessons</h2>
        <?php if (!$lessons['recent']): ?><div class="pqws-empty">No lesson progress rows found yet.</div><?php else: ?>
          <table class="pqws-table">
            <thead><tr><th>Lesson</th><th>Status</th><th>Percent</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($lessons['recent'] as $row): ?>
                <tr>
                  <td data-label="Lesson"><span class="pqws-name"><?php echo s((string)($row->lessonid ?? '')); ?></span><span class="pqws-muted"><?php echo s((string)($row->unitid ?? '')); ?></span></td>
                  <td data-label="Status"><span class="pqws-pill"><?php echo s((string)($row->overall_status ?? '')); ?></span></td>
                  <td data-label="Percent"><?php echo isset($row->overall_percent) ? (int)$row->overall_percent . '%' : ''; ?></td>
                  <td data-label="Updated"><?php echo s(userdate((int)($row->overall_lastactivity ?? $row->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqws-panel">
        <h2>Recent Quiz Attempts</h2>
        <?php if (!$quiz['recent']): ?><div class="pqws-empty">No quiz attempts found yet.</div><?php else: ?>
          <table class="pqws-table">
            <thead><tr><th>Quiz</th><th>Status</th><th>Score</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($quiz['recent'] as $row): ?>
                <tr>
                  <td data-label="Quiz"><span class="pqws-name"><?php echo s((string)($row->quizid ?? '')); ?></span><span class="pqws-muted"><?php echo s((string)($row->lessonid ?? '') . ' / ' . (string)($row->unitid ?? '')); ?></span></td>
                  <td data-label="Status"><span class="pqws-pill"><?php echo s((string)($row->status ?? '')); ?></span></td>
                  <td data-label="Score"><?php echo isset($row->percent) ? (int)$row->percent . '%' : ''; ?></td>
                  <td data-label="Updated"><?php echo s(userdate((int)($row->last_activity_at ?? $row->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqws-panel">
        <h2>Assigned Materials</h2>
        <?php if (!$materials): ?><div class="pqws-empty">No materials assigned to this student yet.</div><?php else: ?>
          <table class="pqws-table">
            <thead><tr><th>Material</th><th>Type</th><th>Progress</th><th>Updated</th></tr></thead>
            <tbody>
              <?php foreach ($materials as $material): ?>
                <tr>
                  <td data-label="Material"><span class="pqws-name"><?php echo s($material->title); ?></span><span class="pqws-muted"><?php echo s((string)($material->course_key ?? '')); ?></span><?php if (!empty($material->source_url)): ?><a class="pqws-btn pqws-btn--light" href="<?php echo s($material->source_url); ?>" target="_blank" rel="noopener">Open</a><?php endif; ?></td>
                  <td data-label="Type"><span class="pqws-pill"><?php echo s((string)$material->material_type); ?></span></td>
                  <td data-label="Progress">
                    <span class="pqws-pill"><?php echo s(pqws_material_workflow_statuses()[(string)($material->workflow_status ?? 'assigned')] ?? 'Assigned'); ?></span>
                    <?php if ((int)$USER->id === $studentid && in_array((string)($material->workflow_status ?? 'assigned'), ['assigned', 'in_progress'], true)): ?>
                      <form class="pqws-status-form" method="post">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="update_material_status">
                        <input type="hidden" name="assignmentid" value="<?php echo (int)$material->id; ?>">
                        <?php if ((string)($material->workflow_status ?? 'assigned') === 'assigned'): ?><button class="pqws-btn pqws-btn--light" name="workflow_status" value="in_progress" type="submit">Start</button><?php endif; ?>
                        <button class="pqws-btn" name="workflow_status" value="completed" type="submit">Complete</button>
                      </form>
                    <?php endif; ?>
                  </td>
                  <td data-label="Updated"><?php echo s(userdate((int)$material->timemodified, get_string('strftimedatetimeshort'))); ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </article>

      <article class="pqws-panel" style="grid-column:1/-1">
        <h2>Recent Teacher Notes</h2>
        <?php if (!$notes): ?><div class="pqws-empty">No live-class notes found yet.</div><?php else: ?>
          <?php foreach ($notes as $note): ?>
            <div class="pqws-note">
              <span class="pqws-name">Session #<?php echo (int)($note->sessionid ?? 0); ?> - <?php echo s(pqws_user_name((int)($note->teacherid ?? 0))); ?></span>
              <span class="pqws-muted"><?php echo s(userdate((int)($note->timemodified ?? 0), get_string('strftimedatetimeshort'))); ?> / follow-up: <?php echo s((string)($note->followup_status ?? '')); ?></span>
              <?php if (!empty($note->strengths)): ?><p><strong>Strengths:</strong> <?php echo s((string)$note->strengths); ?></p><?php endif; ?>
              <?php if (!empty($note->needs_practice)): ?><p><strong>Needs practice:</strong> <?php echo s((string)$note->needs_practice); ?></p><?php endif; ?>
              <?php if (!empty($note->homework)): ?><p><strong>Homework:</strong> <?php echo s((string)$note->homework); ?></p><?php endif; ?>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
