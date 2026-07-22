<?php
// Teacher-workspace query library — extracted VERBATIM from teacher_workspace.php
// (renamed pqltch_ -> pqltchl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqltchl_url(string $path, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/' . ltrim($path, '/'), $params);
}

function pqltchl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltchl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqltchl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqltchl_is_managed_student(int $userid): bool {
    try {
        $profile = profile_user_record($userid, false);
    } catch (Throwable $e) {
        return false;
    }
    foreach (['managed_student', 'managedstudent', 'managed'] as $field) {
        if (isset($profile->{$field})) {
            $value = strtolower(trim((string)$profile->{$field}));
            return in_array($value, ['1', 'yes', 'true', 'on'], true);
        }
    }
    return false;
}

function pqltchl_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqltchl_table_exists('local_prequran_teacher_profile')) {
        if ($DB->record_exists_select(
            'local_prequran_teacher_profile',
            "userid = ? AND (status IS NULL OR status = '' OR LOWER(status) NOT IN (?, ?, ?))",
            [$userid, 'archived', 'inactive', 'rejected']
        )) {
            return true;
        }
        $profilecolumns = [];
        try {
            $profilecolumns = $DB->get_columns('local_prequran_teacher_profile');
        } catch (Throwable $e) {
            $profilecolumns = [];
        }
        if (isset($profilecolumns['teacher_work_models']) && isset($profilecolumns['status'])
            && $DB->record_exists_select(
                'local_prequran_teacher_profile',
                'userid = :userid
                 AND LOWER(status) NOT IN (:archived, :inactive, :rejected)
                 AND (
                     LOWER(teacher_work_models) LIKE :independentkey
                     OR LOWER(teacher_work_models) LIKE :independentlabel
                     OR LOWER(teacher_work_models) LIKE :schoollabel
                     OR LOWER(teacher_work_models) LIKE :multischoollabel
                 )',
                [
                    'userid' => $userid,
                    'archived' => 'archived',
                    'inactive' => 'inactive',
                    'rejected' => 'rejected',
                    'independentkey' => '%independent_teacher%',
                    'independentlabel' => '%independent teacher%',
                    'schoollabel' => '%teach for one school%',
                    'multischoollabel' => '%teach for multiple schools%',
                ]
            )) {
            return true;
        }
    }
    if (pqltchl_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqltchl_table_exists('local_prequran_class_group')
        && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    if (pqltchl_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = :teacherid AND status <> :cancelled', [
            'teacherid' => $userid,
            'cancelled' => 'cancelled',
        ])) {
        return true;
    }
    if (pqltchl_table_exists('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', [
            'userid' => $userid,
            'role' => 'teacher',
            'status' => 'active',
        ])) {
        return true;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {role_assignments} ra
           JOIN {role} r ON r.id = ra.roleid
          WHERE ra.userid = ?
            AND r.shortname IN ('editingteacher', 'teacher', 'manager')",
        [$userid]
    );
}

function pqltchl_ready(): bool {
    return pqltchl_table_exists('local_prequran_live_session')
        && pqltchl_table_exists('local_prequran_live_participant')
        && pqltchl_table_exists('local_prequran_live_attendance')
        && pqltchl_table_exists('local_prequran_live_note');
}

function pqltchl_count_sql(string $sql, array $params): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqltchl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqltchl_audit(int $sessionid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqltchl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'session',
        'targetid' => $sessionid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqltchl_agenda_slides_ready(): bool {
    return pqltchl_column_exists('local_prequran_live_session', 'agenda_slides_path')
        && pqltchl_column_exists('local_prequran_live_session', 'agenda_slides_filename');
}

function pqltchl_agenda_slides_controls($session, string $returnurl, array $urlparams = []): string {
    if (!pqltchl_agenda_slides_ready()) {
        return '';
    }
    $sessionid = (int)$session->id;
    $html = html_writer::start_div('pqltch-agenda');
    if (trim((string)($session->agenda_slides_path ?? '')) !== '') {
        $filename = trim((string)($session->agenda_slides_filename ?? 'Agenda slides'));
        $html .= html_writer::link(
            new moodle_url('/local/hubredirect/live_session_agenda_file.php', ['sessionid' => $sessionid] + $urlparams),
            'Open agenda slides',
            ['class' => 'pqltch-btn pqltch-btn--light']
        );
        $html .= html_writer::link(
            new moodle_url('/local/hubredirect/live_session_agenda_editor.php', ['sessionid' => $sessionid] + $urlparams),
            'Edit online',
            ['class' => 'pqltch-btn pqltch-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_materials_url($sessionid, $urlparams),
            'Teacher Materials',
            ['class' => 'pqltch-btn pqltch-btn--light', 'target' => '_blank', 'rel' => 'noopener']
        );
        $html .= html_writer::span('Attached: ' . s($filename), 'pqltch-agenda__status');
    } else {
        $html .= html_writer::span('No completed agenda slides attached yet.', 'pqltch-agenda__status');
        $html .= html_writer::link(
            new moodle_url('/local/hubredirect/live_session_agenda_editor.php', ['sessionid' => $sessionid] + $urlparams),
            'Create and edit online',
            ['class' => 'pqltch-btn pqltch-btn--light']
        );
        $html .= html_writer::link(
            pqh_live_session_materials_url($sessionid, $urlparams),
            'Teacher Materials',
            ['class' => 'pqltch-btn pqltch-btn--light', 'target' => '_blank', 'rel' => 'noopener']
        );
    }
    $html .= html_writer::start_tag('form', [
        'method' => 'post',
        'action' => pqh_live_session_agenda_upload_url($sessionid, $urlparams)->out(false),
        'enctype' => 'multipart/form-data',
        'class' => 'pqltch-agenda__form',
    ]);
    $html .= html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
    $html .= html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'return', 'value' => $returnurl]);
    $html .= html_writer::empty_tag('input', [
        'type' => 'file',
        'name' => 'agenda_file',
        'accept' => '.ppt,.pptx,.pdf',
        'required' => 'required',
        'class' => 'pqltch-agenda__file',
    ]);
    $html .= html_writer::tag('button', 'Attach agenda slides', ['class' => 'pqltch-btn pqltch-btn--light', 'type' => 'submit']);
    $html .= html_writer::end_tag('form');
    $html .= html_writer::end_div();
    return $html;
}

function pqltchl_session_rows(int $teacherid, int $fromtime, int $totime, int $limit = 30, int $workspaceid = 0): array {
    global $DB;
    $workspacewhere = $workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND s.workspaceid = :workspaceid' : '';
    $workspaceparams = $workspacewhere !== '' ? ['workspaceid' => $workspaceid] : [];
    return array_values($DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id) AS note_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1) AS visible_summary_count,
                (SELECT COUNT(1) FROM {local_prequran_live_recording} r WHERE r.sessionid = s.id AND r.visible_to_parent = 1 AND r.status = 'available') AS visible_recording_count
           FROM {local_prequran_live_session} s
          WHERE s.teacherid = :teacherid
            AND s.scheduled_start >= :fromtime
            AND s.scheduled_start < :totime
            AND s.status <> :cancelled
            {$workspacewhere}
       ORDER BY s.scheduled_start ASC, s.id ASC",
        $workspaceparams + ['teacherid' => $teacherid, 'fromtime' => $fromtime, 'totime' => $totime, 'cancelled' => 'cancelled'],
        0,
        $limit
    ));
}

function pqltchl_review_gap_rows(int $teacherid, int $fromtime, int $totime, int $workspaceid = 0): array {
    global $DB;
    $workspacewhere = $workspaceid > 0 && pqltchl_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND s.workspaceid = :workspaceid' : '';
    $workspaceparams = $workspacewhere !== '' ? ['workspaceid' => $workspaceid] : [];
    return array_values($DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id) AS note_count,
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '') AS visible_summary_count
           FROM {local_prequran_live_session} s
          WHERE s.teacherid = :teacherid
            AND s.scheduled_end >= :fromtime
            AND s.scheduled_end < :totime
            AND s.status <> :cancelled
            {$workspacewhere}
            AND (
                s.status <> :completed
                OR
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id)
                < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
                OR
                (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '')
                < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
            )
       ORDER BY s.scheduled_end DESC, s.id DESC",
        $workspaceparams + ['teacherid' => $teacherid, 'fromtime' => $fromtime, 'totime' => $totime, 'cancelled' => 'cancelled', 'completed' => 'completed'],
        0,
        20
    ));
}

function pqltchl_students_for_session(int $sessionid): array {
    global $DB;
    $rows = $DB->get_records('local_prequran_live_participant', ['sessionid' => $sessionid, 'role' => 'student', 'status' => 'active'], 'displayname ASC, userid ASC');
    $students = [];
    foreach ($rows as $row) {
        $studentid = (int)($row->studentid ?: $row->userid);
        $user = $studentid > 0 ? core_user::get_user($studentid) : null;
        $students[] = [
            'studentid' => $studentid,
            'name' => $user ? fullname($user) : ((string)$row->displayname ?: 'Student ' . $studentid),
        ];
    }
    return $students;
}

function pqltchl_prep_for_session($session): array {
    global $DB;
    $students = pqltchl_students_for_session((int)$session->id);
    $prep = ['ready' => 0, 'needspractice' => 0, 'students' => []];
    $lessonid = trim((string)$session->lessonid);
    $unitid = trim((string)$session->unitid);
    foreach ($students as $student) {
        $studentid = (int)$student['studentid'];
        $row = null;
        if (pqltchl_table_exists('local_prequran_lessonprog')) {
            if ($lessonid !== '' && $unitid !== '') {
                $row = $DB->get_record('local_prequran_lessonprog', ['userid' => $studentid, 'lessonid' => $lessonid, 'unitid' => $unitid]);
            }
            if (!$row) {
                $row = $DB->get_record_sql(
                    "SELECT lessonid, unitid, lesson_title, unit_title, overall_status, completion_percent, steps_completed, steps_total, overall_lastactivity
                       FROM {local_prequran_lessonprog}
                      WHERE userid = ?
                   ORDER BY overall_lastactivity DESC, timemodified DESC",
                    [$studentid],
                    IGNORE_MULTIPLE
                );
            }
        }
        $focus = null;
        if (pqltchl_table_exists('local_prequran_focusagg')) {
            $focus = $DB->get_record_sql(
                "SELECT unitid, step_id, active_ms, idle_count, leave_count, last_time
                   FROM {local_prequran_focusagg}
                  WHERE userid = ?
               ORDER BY last_time DESC",
                [$studentid],
                IGNORE_MULTIPLE
            );
        }
        $speakcount = 0;
        if (pqltchl_table_exists('local_prequran_speakrec')) {
            $select = 'userid = :userid AND status <> :failed';
            $params = ['userid' => $studentid, 'failed' => 'upload_failed'];
            if ($unitid !== '') {
                $select .= ' AND unitid = :unitid';
                $params['unitid'] = $unitid;
            }
            $speakcount = (int)$DB->count_records_select('local_prequran_speakrec', $select, $params);
        }
        $percent = $row && isset($row->completion_percent) ? (int)$row->completion_percent : 0;
        $status = $row ? (string)$row->overall_status : 'not_started';
        $ready = $status === 'completed' || $percent >= 80;
        $ready ? $prep['ready']++ : $prep['needspractice']++;
        $prep['students'][] = [
            'name' => (string)$student['name'],
            'unit' => $row ? (string)($row->unit_title ?: $row->unitid) : 'No progress yet',
            'status' => $status,
            'percent' => $percent,
            'steps' => $row ? (int)($row->steps_completed ?? 0) . '/' . (int)($row->steps_total ?? 0) : '0/0',
            'focus' => $focus ? trim((string)$focus->unitid . ' / ' . (string)$focus->step_id, ' /') : 'No focus data',
            'speakcount' => $speakcount,
            'suggestion' => $ready ? 'Stretch review or quick recitation check' : 'Guided practice and one speak attempt',
        ];
    }
    return $prep;
}
