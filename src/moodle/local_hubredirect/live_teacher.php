<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$PAGE->set_context($context);
$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
}
$dashboardpath = $requestedworkspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php';
$dashboardurl = new moodle_url($dashboardpath, $urlparams);

$PAGE->set_url(new moodle_url('/local/hubredirect/live_teacher.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Teacher Live Workspace');
$PAGE->set_heading('Teacher Live Workspace');
$PAGE->add_body_class('pqh-live-teacher-page');

function pqltch_url(string $path, array $params = []): moodle_url {
    return new moodle_url('/local/hubredirect/' . ltrim($path, '/'), $params);
}

function pqltch_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltch_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqltch_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqltch_is_managed_student(int $userid): bool {
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

function pqltch_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqltch_table_exists('local_prequran_teacher_profile')) {
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
    if (pqltch_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqltch_table_exists('local_prequran_class_group')
        && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    if (pqltch_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = :teacherid AND status <> :cancelled', [
            'teacherid' => $userid,
            'cancelled' => 'cancelled',
        ])) {
        return true;
    }
    if (pqltch_table_exists('local_prequran_live_participant')
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

function pqltch_ready(): bool {
    return pqltch_table_exists('local_prequran_live_session')
        && pqltch_table_exists('local_prequran_live_participant')
        && pqltch_table_exists('local_prequran_live_attendance')
        && pqltch_table_exists('local_prequran_live_note');
}

function pqltch_count_sql(string $sql, array $params): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqltch_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqltch_audit(int $sessionid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqltch_table_exists('local_prequran_live_audit')) {
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

function pqltch_agenda_slides_ready(): bool {
    return pqltch_column_exists('local_prequran_live_session', 'agenda_slides_path')
        && pqltch_column_exists('local_prequran_live_session', 'agenda_slides_filename');
}

function pqltch_agenda_slides_controls($session, string $returnurl, array $urlparams = []): string {
    if (!pqltch_agenda_slides_ready()) {
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

function pqltch_session_rows(int $teacherid, int $fromtime, int $totime, int $limit = 30, int $workspaceid = 0): array {
    global $DB;
    $workspacewhere = $workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND s.workspaceid = :workspaceid' : '';
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

function pqltch_review_gap_rows(int $teacherid, int $fromtime, int $totime, int $workspaceid = 0): array {
    global $DB;
    $workspacewhere = $workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND s.workspaceid = :workspaceid' : '';
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

function pqltch_students_for_session(int $sessionid): array {
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

function pqltch_prep_for_session($session): array {
    global $DB;
    $students = pqltch_students_for_session((int)$session->id);
    $prep = ['ready' => 0, 'needspractice' => 0, 'students' => []];
    $lessonid = trim((string)$session->lessonid);
    $unitid = trim((string)$session->unitid);
    foreach ($students as $student) {
        $studentid = (int)$student['studentid'];
        $row = null;
        if (pqltch_table_exists('local_prequran_lessonprog')) {
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
        if (pqltch_table_exists('local_prequran_focusagg')) {
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
        if (pqltch_table_exists('local_prequran_speakrec')) {
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

if (!pqltch_is_teacher((int)$USER->id)) {
    pqh_access_denied(
        'Only teachers and administrators can view the live-class workspace.',
        $dashboardurl,
        'Teacher workspace access required'
    );
}

$teacherid = optional_param('teacherid', (int)$USER->id, PARAM_INT);
if (!is_siteadmin($USER)) {
    $teacherid = (int)$USER->id;
}
$workspaceid = 0;
$workspace = null;
if ($requestedworkspaceid > 0) {
    $resolvedworkspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
    $isownteacherworkspace = (int)$USER->id === $teacherid && pqltch_is_teacher((int)$USER->id);
    $workspaceid = $resolvedworkspaceid > 0 ? $resolvedworkspaceid : ($isownteacherworkspace ? $requestedworkspaceid : 0);
    $canviewworkspace = $workspaceid > 0
        && (pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid) || $isownteacherworkspace);
    if (!$canviewworkspace) {
        pqh_access_denied(
            'This workspace live-class view is not available for your account.',
            $dashboardurl,
            'Workspace live-class access required'
        );
    }
    $workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
}
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
$dashboardpath = $workspaceid > 0 ? '/local/hubredirect/workspace_dashboard.php' : '/local/hubredirect/dashboard.php';
$dashboardurl = new moodle_url($dashboardpath, $urlparams);
$PAGE->set_url(new moodle_url('/local/hubredirect/live_teacher.php', $urlparams));
$workspacewhere = $workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND s.workspaceid = :workspaceid' : '';
$workspaceplainwhere = $workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') ? ' AND workspaceid = :workspaceid' : '';
$workspaceparams = $workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') ? ['workspaceid' => $workspaceid] : [];
$teacherbaseurlparams = $urlparams;
if ($teacherid !== (int)$USER->id) {
    $teacherbaseurlparams['teacherid'] = $teacherid;
}
$selectedchildid = optional_param('childid', 0, PARAM_INT);
$selectedchild = null;
if ($selectedchildid > 0) {
    $selectedchilduser = core_user::get_user($selectedchildid, 'id,firstname,lastname,deleted', IGNORE_MISSING);
    if ($selectedchilduser && empty($selectedchilduser->deleted)) {
        $selectedchild = [
            'studentid' => $selectedchildid,
            'name' => fullname($selectedchilduser),
        ];
        $teacherbaseurlparams['childid'] = $selectedchildid;
    }
}

$ready = pqltch_ready();
$now = time();
$todaystart = usergetmidnight($now);
$todayend = $todaystart + DAYSECS;
$teacher = core_user::get_user($teacherid);
$teachername = $teacher ? fullname($teacher) : 'Teacher ' . $teacherid;

$metrics = ['today' => 0, 'upcoming' => 0, 'needsreview' => 0, 'followups' => 0, 'coaching' => 0, 'improvementplans' => 0, 'studentsweek' => 0];
$today = [];
$upcoming = [];
$needsreview = [];
$recentcompleted = [];
$followups = [];
$coaching = [];
$improvementplans = [];

if ($ready
    && data_submitted()
    && optional_param('action', '', PARAM_ALPHANUMEXT) === 'ack_quality_coaching'
    && pqltch_column_exists('local_prequran_live_session', 'qa_coaching_status')) {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the teacher workspace and try that coaching action again.',
            new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams),
            'Teacher coaching form expired'
        );
    }
    $sessionid = optional_param('sessionid', 0, PARAM_INT);
    $coachsession = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
    if (!$coachsession) {
        pqh_access_denied(
            'Choose a valid live session before acknowledging coaching.',
            new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams),
            'Teacher coaching unavailable'
        );
    }
    if ((int)$coachsession->teacherid !== $teacherid
        || ($workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') && (int)($coachsession->workspaceid ?? 0) !== $workspaceid)
        || ((int)$coachsession->teacherid !== (int)$USER->id && !is_siteadmin($USER))) {
        pqh_access_denied(
            'You cannot acknowledge this coaching item for the selected workspace.',
            $dashboardurl,
            'Teacher coaching access required'
        );
    }
    if (in_array((string)$coachsession->qa_coaching_status, ['assigned', 'acknowledged'], true)) {
        $oldstatus = (string)$coachsession->qa_coaching_status;
        $coachsession->qa_coaching_status = 'acknowledged';
        $coachsession->qa_coaching_ackby = (int)$USER->id;
        $coachsession->qa_coaching_ackat = time();
        $coachsession->timemodified = time();
        $DB->update_record('local_prequran_live_session', $coachsession);
        pqltch_audit($sessionid, 'quality_coaching_acknowledged', [
            'oldstatus' => $oldstatus,
            'teacherid' => $teacherid,
        ]);
    }
    redirect(new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams + ['result' => 'coaching_acknowledged']));
}

if ($ready
    && data_submitted()
    && optional_param('action', '', PARAM_ALPHANUMEXT) === 'ack_improvement_plan'
    && pqltch_column_exists('local_prequran_live_session', 'improvement_plan_status')) {
    if (!confirm_sesskey()) {
        pqh_access_denied(
            'Please reopen the teacher workspace and try that improvement-plan action again.',
            new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams),
            'Improvement plan form expired'
        );
    }
    $sessionid = optional_param('sessionid', 0, PARAM_INT);
    $plansession = $sessionid > 0 ? $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', IGNORE_MISSING) : false;
    if (!$plansession) {
        pqh_access_denied(
            'Choose a valid live session before acknowledging an improvement plan.',
            new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams),
            'Improvement plan unavailable'
        );
    }
    if ((int)$plansession->teacherid !== $teacherid
        || ($workspaceid > 0 && pqltch_column_exists('local_prequran_live_session', 'workspaceid') && (int)($plansession->workspaceid ?? 0) !== $workspaceid)
        || ((int)$plansession->teacherid !== (int)$USER->id && !is_siteadmin($USER))) {
        pqh_access_denied(
            'You cannot acknowledge this improvement plan for the selected workspace.',
            $dashboardurl,
            'Improvement plan access required'
        );
    }
    if (in_array((string)$plansession->improvement_plan_status, ['assigned', 'in_progress'], true)) {
        $oldstatus = (string)$plansession->improvement_plan_status;
        $plansession->improvement_plan_status = 'in_progress';
        $plansession->improvement_plan_ackby = (int)$USER->id;
        $plansession->improvement_plan_ackat = time();
        $plansession->timemodified = time();
        $DB->update_record('local_prequran_live_session', $plansession);
        pqltch_audit($sessionid, 'improvement_plan_acknowledged', [
            'oldstatus' => $oldstatus,
            'newstatus' => 'in_progress',
            'teacherid' => $teacherid,
        ]);
    }
    redirect(new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams + ['result' => 'plan_acknowledged']));
}

if ($ready) {
    $followupready = pqltch_column_exists('local_prequran_live_note', 'followup_status');
    $parentresponseready = pqltch_column_exists('local_prequran_live_note', 'parent_response_status');
    $coachingready = pqltch_column_exists('local_prequran_live_session', 'qa_coaching_status');
    $improvementready = pqltch_column_exists('local_prequran_live_session', 'improvement_plan_status');
    $metrics['today'] = pqltch_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND scheduled_start >= :starttime
            AND scheduled_start < :endtime
            AND status <> :cancelled
            {$workspaceplainwhere}",
        $workspaceparams + ['teacherid' => $teacherid, 'starttime' => $todaystart, 'endtime' => $todayend, 'cancelled' => 'cancelled']
    );
    $metrics['upcoming'] = pqltch_count_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND scheduled_start >= :nowtime
            AND scheduled_start < :untiltime
            AND status <> :cancelled
            {$workspaceplainwhere}",
        $workspaceparams + ['teacherid' => $teacherid, 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled']
    );
    $metrics['needsreview'] = pqltch_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_live_session} s
          WHERE s.teacherid = :teacherid
            AND s.scheduled_end >= :fromtime
            AND s.scheduled_end < :nowtime
            AND s.status <> :cancelled
            {$workspacewhere}
            AND (
                s.status <> :completed
                OR (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id)
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
                OR (SELECT COUNT(1) FROM {local_prequran_live_note} n WHERE n.sessionid = s.id AND n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.strengths, ''), COALESCE(n.needs_practice, ''), COALESCE(n.homework, ''), COALESCE(n.parent_summary, ''))) <> '')
                   < (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')
            )",
        $workspaceparams + ['teacherid' => $teacherid, 'fromtime' => $now - (14 * DAYSECS), 'nowtime' => $now, 'cancelled' => 'cancelled', 'completed' => 'completed']
    );
    $metrics['studentsweek'] = pqltch_count_sql(
        "SELECT COUNT(DISTINCT p.studentid)
           FROM {local_prequran_live_session} s
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
          WHERE s.teacherid = :teacherid
            AND s.scheduled_start >= :nowtime
            AND s.scheduled_start < :untiltime
            AND s.status <> :cancelled
            {$workspacewhere}",
        $workspaceparams + ['teacherid' => $teacherid, 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled']
    );
    if ($followupready) {
        $parentresponseselect = $parentresponseready
            ? "n.parent_response_status, n.parent_response_message, n.parent_responseby, n.parent_responseat,"
            : "'none' AS parent_response_status, '' AS parent_response_message, 0 AS parent_responseby, 0 AS parent_responseat,";
        $metrics['followups'] = pqltch_count_sql(
            "SELECT COUNT(1)
              FROM {local_prequran_live_note} n
              JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE s.teacherid = :teacherid
                {$workspacewhere}
                AND n.followup_status <> :none
                AND n.followup_resolved = 0",
            $workspaceparams + ['teacherid' => $teacherid, 'none' => 'none']
        );
        $followups = array_values($DB->get_records_sql(
            "SELECT n.*,
                    {$parentresponseselect}
                    s.title AS session_title,
                    s.scheduled_start,
                    s.scheduled_end
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE s.teacherid = :teacherid
                {$workspacewhere}
                AND n.followup_status <> :none
                AND n.followup_resolved = 0
           ORDER BY CASE n.followup_status
                        WHEN 'admin_support_requested' THEN 1
                        WHEN 'parent_contact_requested' THEN 2
                        WHEN 'review_homework' THEN 3
                        ELSE 4
                    END,
                    n.timemodified DESC",
            $workspaceparams + ['teacherid' => $teacherid, 'none' => 'none'],
            0,
            12
        ));
    }
    if ($coachingready) {
        $metrics['coaching'] = pqltch_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspaceplainwhere}",
            $workspaceparams + ['teacherid' => $teacherid]
        );
        $coaching = array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspaceplainwhere}
           ORDER BY CASE qa_coaching_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    qa_coaching_due_date ASC,
                    qa_reviewedat DESC",
            $workspaceparams + ['teacherid' => $teacherid],
            0,
            12
        ));
    }
    if ($improvementready) {
        $metrics['improvementplans'] = pqltch_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND improvement_plan_status IN ('assigned', 'in_progress')
                {$workspaceplainwhere}",
            $workspaceparams + ['teacherid' => $teacherid]
        );
        $improvementplans = array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND improvement_plan_status IN ('assigned', 'in_progress')
                {$workspaceplainwhere}
           ORDER BY CASE improvement_plan_priority
                        WHEN 'high' THEN 1
                        WHEN 'normal' THEN 2
                        ELSE 3
                    END,
                    improvement_plan_due_date ASC,
                    improvement_plan_assignedat DESC",
            $workspaceparams + ['teacherid' => $teacherid],
            0,
            12
        ));
    }

    $today = pqltch_session_rows($teacherid, $todaystart, $todayend, 20, $workspaceid);
    $upcoming = pqltch_session_rows($teacherid, $now, $now + (7 * DAYSECS), 20, $workspaceid);
    $needsreview = pqltch_review_gap_rows($teacherid, $now - (14 * DAYSECS), $now, $workspaceid);
    $recentcompleted = pqltch_session_rows($teacherid, $now - (14 * DAYSECS), $now, 12, $workspaceid);
    usort($recentcompleted, function($a, $b) {
        return (int)$b->scheduled_start <=> (int)$a->scheduled_start;
    });
    $recentcompleted = array_values(array_filter($recentcompleted, function($session) {
        return (string)$session->status === 'completed';
    }));
}

echo $OUTPUT->header();
?>
<style>
body.pqh-live-teacher-page header,
body.pqh-live-teacher-page footer,
body.pqh-live-teacher-page nav.navbar,
body.pqh-live-teacher-page #page-header,
body.pqh-live-teacher-page #page-footer,
body.pqh-live-teacher-page .drawer,
body.pqh-live-teacher-page .drawer-toggles,
body.pqh-live-teacher-page .block-region,
body.pqh-live-teacher-page [data-region="drawer"],
body.pqh-live-teacher-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-live-teacher-page #page,
body.pqh-live-teacher-page #page-content,
body.pqh-live-teacher-page #region-main,
body.pqh-live-teacher-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqltch-shell{min-height:100vh;padding:28px 18px 54px;background:#f5f8fb;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#173044}
.pqltch-wrap{max-width:1180px;margin:0 auto}
.pqltch-top{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:18px;padding:20px;border:1px solid rgba(23,48,68,.12);background:#fff;border-radius:10px}
.pqltch-title{margin:0;font-size:28px;line-height:1.12;font-weight:950}
.pqltch-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:750}
.pqltch-actions{display:flex;flex-wrap:wrap;gap:9px}
.pqltch-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950;cursor:pointer}
.pqltch-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}
.pqltch-btn--start{background:#6f4e32}
.pqltch-tool-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:16px}
.pqltch-tool-group{padding:16px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqltch-tool-group h2{margin:0 0 6px;font-size:18px;font-weight:950;color:#173044}
.pqltch-tool-group p{margin:0 0 12px;color:#5e7280;font-size:13px;font-weight:800}
.pqltch-alert{margin-bottom:14px;padding:12px 14px;border-radius:10px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-weight:900}
.pqltch-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
@media(max-width:920px){.pqltch-tool-grid{grid-template-columns:1fr}.pqltch-top{display:block}.pqltch-actions{margin-top:12px}}
@media(max-width:560px){.pqltch-title{font-size:24px}}
<?php echo pqh_dashboard_header_css(); ?>
/* ============================================================
   Teacher workspace design system (2026-07-18): same modern
   layer as the dashboard - tokens, blue header band, quiet
   white surfaces, ghost chips, single blue accent.
   ============================================================ */
.pqltch-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;
  --pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#ffffff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;
  --pqh-primary-ink:#17498f;--pqh-r:14px;
  --pqh-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);
  background:var(--pqh-bg);color:var(--pqh-ink)}
.pqltch-top.pqh-workspace-top{background:linear-gradient(120deg,#d7e6f9 0%,#e9f1fc 60%,#f3f8fe 100%)!important;border:1px solid #c5d9f1!important;box-shadow:none!important;border-radius:var(--pqh-r)!important;padding:20px 22px!important}
.pqltch-title,.pqltch-title.pqh-workspace-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqltch-sub,.pqltch-sub.pqh-workspace-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqltch-btn,.pqh-workspace-actions a,.pqh-workspace-actions button{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqltch-btn:hover,.pqh-workspace-actions a:hover,.pqh-workspace-actions button:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
.pqltch-btn[data-pq-support-action="new"]{background:var(--pqh-primary)!important;border-color:var(--pqh-primary)!important;color:#fff!important}
.pqltch-btn--start{background:var(--pqh-primary)!important;border-color:var(--pqh-primary)!important;color:#fff!important}
.pqh-live-guide-link,.pqh-live-template-link,.pqh-workspace-actions a.pqh-live-guide-link,.pqh-workspace-actions a.pqh-live-template-link{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;color:var(--pqh-primary-ink)!important}
.pqltch-tool-group{background:var(--pqh-surface);border:1px solid var(--pqh-line);border-radius:var(--pqh-r);box-shadow:var(--pqh-shadow)}
.pqltch-tool-group h2{color:var(--pqh-ink);font-size:17px;font-weight:750;letter-spacing:-.01em}
.pqltch-tool-group p{color:var(--pqh-muted);font-weight:500}
.pqltch-alert{background:var(--pqh-tint);color:var(--pqh-primary-ink);border:1px solid var(--pqh-tint-2);font-weight:600;border-radius:11px}
.pqltch-empty{background:var(--pqh-surface);border:1px dashed var(--pqh-line);border-radius:var(--pqh-r);color:var(--pqh-muted);font-weight:550}
</style>
<main class="pqltch-shell">
  <div class="pqltch-wrap">
    <section class="pqltch-top pqh-workspace-top">
      <div>
        <h1 class="pqltch-title pqh-workspace-title">Teacher Live-Class Workspace</h1>
        <p class="pqltch-sub pqh-workspace-sub"><?php echo s($teachername); ?><?php echo $workspace ? ' - ' . s((string)$workspace->name) : ''; ?> - student and teacher action tools.</p>
      </div>
      <div class="pqltch-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <?php echo pqh_live_session_agenda_template_link(); ?>
        <?php if ($workspaceid > 0): ?><a class="pqltch-btn pqltch-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Workspace dashboard</a><?php endif; ?>
        <?php if ($workspaceid > 0): ?><a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('teacher_office.php', ['workspaceid' => $workspaceid] + ($selectedchild ? ['childid' => (int)$selectedchild['studentid']] : []))->out(false); ?>">Document Studio</a><?php endif; ?>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $teacherbaseurlparams))->out(false); ?>">Live sessions</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_create_wizard.php', $teacherbaseurlparams))->out(false); ?>">Create session</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series_wizard.php', $teacherbaseurlparams))->out(false); ?>">Create series</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_followups.php', $teacherbaseurlparams))->out(false); ?>">Follow-ups</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series.php', $teacherbaseurlparams))->out(false); ?>">Class series</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_availability.php', $teacherbaseurlparams))->out(false); ?>">Availability</a>
        <button class="pqltch-btn pqltch-btn--light" type="button" data-pq-support-action="open">Manage tickets</button>
        <button class="pqltch-btn" type="button" data-pq-support-action="new">Create a ticket</button>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
        <?php if (is_siteadmin($USER)): ?><a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_admin.php', $urlparams))->out(false); ?>">Admin menu</a><?php endif; ?>
        <?php if (is_siteadmin($USER)): ?><a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_ops.php', $urlparams))->out(false); ?>">Admin ops</a><?php endif; ?>
      </div>
    </section>

    <?php if (optional_param('result', '', PARAM_ALPHANUMEXT) === 'coaching_acknowledged'): ?><div class="pqltch-alert">Quality coaching acknowledged.</div><?php endif; ?>
    <?php if (optional_param('result', '', PARAM_ALPHANUMEXT) === 'plan_acknowledged'): ?><div class="pqltch-alert">Improvement plan acknowledged.</div><?php endif; ?>

    <?php if (!$ready): ?>
      <div class="pqltch-empty">Live-session tables are not fully installed yet.</div>
    <?php else: ?>
      <section class="pqltch-tool-grid" aria-label="Teacher workspace tools">
        <?php if ($selectedchild): ?>
          <article class="pqltch-tool-group">
            <h2><?php echo s($selectedchild['name']); ?> Tools</h2>
            <p>Student-specific work moved from the dashboard.</p>
            <div class="pqltch-actions pqh-workspace-actions">
              <?php if (pqltch_is_managed_student((int)$selectedchild['studentid'])): ?>
                <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('virtual_tutor.php', ['studentid' => (int)$selectedchild['studentid']])->out(false); ?>">Virtual tutor</a>
              <?php endif; ?>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_parent_trust.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Parent live hub</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_schedule.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Live schedule</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_series_schedule.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Class series</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_calendar.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Live calendar</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('course_transcript.php', ['studentid' => (int)$selectedchild['studentid']] + ($workspaceid > 0 ? ['workspaceid' => $workspaceid] : []))->out(false); ?>">Unofficial transcript</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_summaries.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Live summaries</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_trust.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Trust center</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_recordings.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Live recordings</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('managed_reports.php', ['studentid' => (int)$selectedchild['studentid']] + ($workspaceid > 0 ? ['workspaceid' => $workspaceid] : []))->out(false); ?>">Managed report</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('recordings.php', ['childid' => (int)$selectedchild['studentid']])->out(false); ?>">Review Speak recordings</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('quiz_report.php', ['pq_env' => 'integration', 'lessonid' => 'alphabet', 'unitid' => 'alphabet_quiz', 'userid' => (int)$selectedchild['studentid']])->out(false); ?>">Quiz report</a>
            </div>
          </article>
        <?php endif; ?>
        <article class="pqltch-tool-group">
          <h2>Document Studio</h2>
          <p>Create and edit teaching documents, spreadsheets, presentations, PDFs, course materials, and lesson resources with ONLYOFFICE.</p>
          <div class="pqltch-actions pqh-workspace-actions">
            <?php if ($workspaceid > 0): ?>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('teacher_office.php', ['workspaceid' => $workspaceid] + ($selectedchild ? ['childid' => (int)$selectedchild['studentid']] : []))->out(false); ?>">New Word document</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('teacher_office.php', ['workspaceid' => $workspaceid] + ($selectedchild ? ['childid' => (int)$selectedchild['studentid']] : []))->out(false); ?>">New spreadsheet</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('teacher_office.php', ['workspaceid' => $workspaceid] + ($selectedchild ? ['childid' => (int)$selectedchild['studentid']] : []))->out(false); ?>">New presentation</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('teacher_office.php', ['workspaceid' => $workspaceid] + ($selectedchild ? ['childid' => (int)$selectedchild['studentid']] : []))->out(false); ?>">PDF tools</a>
              <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('workspace_materials.php', ['workspaceid' => $workspaceid])->out(false); ?>">Material library</a>
            <?php else: ?>
              <span class="pqltch-empty">Choose a workspace before creating office materials.</span>
            <?php endif; ?>
          </div>
        </article>
        <article class="pqltch-tool-group">
          <h2>Teacher Operations</h2>
          <p>Daily teacher work tools now live here.</p>
          <div class="pqltch-actions pqh-workspace-actions">
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('teacher_homework.php', $workspaceid > 0 ? (['workspaceid' => $workspaceid] + $urlparams) : $urlparams)->out(false); ?>">Homework</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_teacher_schedule.php', ['teacherid' => (int)$teacherid])->out(false); ?>">Teacher schedule</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_sessions.php', ['session_type' => 'teacher_meeting', 'title' => 'Teacher Meeting Room'])->out(false); ?>">Teacher meetings</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_sessions.php', ['session_type' => 'teacher_parent_room', 'title' => 'Teacher-Parent Room'])->out(false); ?>">Teacher-parent rooms</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_availability.php', $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [])->out(false); ?>">Availability</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_practice_coach.php', $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [])->out(false); ?>">Practice coach</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('live_followups.php')->out(false); ?>">Parent follow-ups</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('managed_reports.php', $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [])->out(false); ?>">Managed reports</a>
            <a class="pqltch-btn pqltch-btn--light" href="<?php echo pqltch_url('quiz_report.php', ['pq_env' => 'integration', 'lessonid' => 'alphabet', 'unitid' => 'alphabet_quiz'])->out(false); ?>">Quiz reports</a>
          </div>
        </article>
      </section>
<?php endif; ?>
  </div>
</main>
<?php
echo pqh_embedded_support_html($workspaceid, (int)$USER->id, (int)$USER->id, 'student_helpdesk', $consumercontext);
echo $OUTPUT->footer();
