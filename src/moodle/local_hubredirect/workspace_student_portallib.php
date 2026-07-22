<?php
// Workspace-student query library — extracted VERBATIM from workspace_student.php
// (the page-defined pqws_* functions, unchanged) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). The pqws_ prefix is unique to this page across the tree, so
// no rename was needed. Shared helpers (pqh_*, core_user, fullname,
// local_prequran_notify_user_live_update) are CALLED, never copied — the
// handler requires accesslib.php + notificationlib.php before this file.
// Contains only function definitions behind the guard: including it emits no
// output.

defined('MOODLE_INTERNAL') || die();

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
