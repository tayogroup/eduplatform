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
            'Quraan Materials',
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
            'Quraan Materials',
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
    $workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
    if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
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
.pqltch-alert{margin-bottom:14px;padding:12px 14px;border-radius:10px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.16);font-weight:900}
.pqltch-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:16px}
.pqltch-metric{padding:15px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.05)}
.pqltch-metric strong{display:block;font-size:26px;font-weight:950;color:#6f4e32}
.pqltch-metric span{display:block;margin-top:3px;color:#5e7280;font-size:12px;font-weight:850}
.pqltch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pqltch-panel{padding:18px;background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:10px;box-shadow:0 10px 24px rgba(23,48,68,.06)}
.pqltch-panel--wide{grid-column:1/-1}
.pqltch-panel h2{margin:0 0 13px;font-size:20px;font-weight:950}
.pqltch-list{display:grid;gap:12px}
.pqltch-card{padding:16px;border:1px solid rgba(23,48,68,.12);border-radius:10px;background:#fff}
.pqltch-card__head{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}
.pqltch-card h3{margin:0;font-size:18px;font-weight:950;color:#173044}
.pqltch-meta{margin:5px 0 0;color:#5e7280;font-size:13px;font-weight:800}
.pqltch-pill{display:inline-flex;align-items:center;min-height:26px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:950;background:#eef4f6;color:#173044}
.pqltch-pill--ok{background:#edf9ef;color:#245c35}
.pqltch-pill--warn{background:#fff4dc;color:#7b5a3a}
.pqltch-students{margin:10px 0 0;color:#5e7280;font-size:13px;font-weight:750}
.pqltch-empty{padding:16px;border:1px dashed rgba(23,48,68,.22);border-radius:10px;color:#5e7280;font-weight:850;background:#fff}
.pqltch-prep{margin-top:12px;padding:12px;border:1px solid rgba(111,78,50,.16);border-radius:10px;background:#fffaf1}
.pqltch-prep h4{margin:0 0 8px;font-size:14px;font-weight:950;color:#6f4e32}
.pqltch-prep__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pqltch-prep__item{padding:9px;border-radius:8px;background:#fff;border:1px solid rgba(23,48,68,.1);font-size:12px;color:#415665;font-weight:800}
.pqltch-prep__item strong{display:block;color:#173044;font-size:13px}
.pqltch-agenda{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:12px;padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:10px;background:#fbfdff}
.pqltch-agenda__form{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0}
.pqltch-agenda__file{max-width:260px;font-size:12px;font-weight:800;color:#415665}
.pqltch-agenda__status{color:#5e7280;font-size:12px;font-weight:850}
@media(max-width:920px){.pqltch-grid{grid-template-columns:1fr}.pqltch-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqltch-top{display:block}.pqltch-actions{margin-top:12px}.pqltch-card__head{display:block}}
@media(max-width:560px){.pqltch-metrics,.pqltch-prep__grid{grid-template-columns:1fr}.pqltch-title{font-size:24px}.pqltch-agenda__file{max-width:100%}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqltch-shell">
  <div class="pqltch-wrap">
    <section class="pqltch-top pqh-workspace-top">
      <div>
        <h1 class="pqltch-title pqh-workspace-title">Teacher Live-Class Workspace</h1>
        <p class="pqltch-sub pqh-workspace-sub"><?php echo s($teachername); ?><?php echo $workspace ? ' - ' . s((string)$workspace->name) : ''; ?> - today's classes, upcoming sessions, and post-class review work.</p>
      </div>
      <div class="pqltch-actions pqh-workspace-actions">
        <?php echo pqh_live_session_explainer_link(); ?>
        <?php echo pqh_live_session_agenda_template_link(); ?>
        <?php if ($workspaceid > 0): ?><a class="pqltch-btn pqltch-btn--light" href="<?php echo $dashboardurl->out(false); ?>">Workspace dashboard</a><?php endif; ?>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $teacherbaseurlparams))->out(false); ?>">Live sessions</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_followups.php', $teacherbaseurlparams))->out(false); ?>">Follow-ups</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_series.php', $teacherbaseurlparams))->out(false); ?>">Class series</a>
        <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_availability.php', $teacherbaseurlparams))->out(false); ?>">Availability</a>
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
      <section class="pqltch-metrics" aria-label="Teacher live class metrics">
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['today']; ?></strong><span>today's classes</span></div>
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['upcoming']; ?></strong><span>next 7 days</span></div>
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['needsreview']; ?></strong><span>awaiting review</span></div>
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['followups']; ?></strong><span>open follow-ups</span></div>
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['coaching']; ?></strong><span>quality coaching</span></div>
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['improvementplans']; ?></strong><span>improvement plans</span></div>
        <div class="pqltch-metric"><strong><?php echo (int)$metrics['studentsweek']; ?></strong><span>students this week</span></div>
      </section>

      <section class="pqltch-grid">
        <article class="pqltch-panel pqltch-panel--wide">
          <h2>Today</h2>
          <?php if (!$today): ?>
            <div class="pqltch-empty">No live classes scheduled today.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($today as $session): ?>
                <?php
                  $joinurl = new moodle_url('/local/hubredirect/live_sessions.php', $teacherbaseurlparams + ['action' => 'join', 'sessionid' => (int)$session->id, 'sesskey' => sesskey()]);
                  $reviewurl = new moodle_url('/local/hubredirect/live_review.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]);
                  $monitorurl = new moodle_url('/local/hubredirect/live_monitor.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]);
                  $students = pqltch_students_for_session((int)$session->id);
                  $prep = pqltch_prep_for_session($session);
                ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqltch-meta"><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo (int)$session->student_count; ?> students</p>
                      <?php if (!empty($session->seriesid)): ?><p class="pqltch-meta">Series #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Class ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
                      <p class="pqltch-meta">Target: <?php echo s(trim((string)$session->lessonid . ' / ' . (string)$session->unitid, ' /') ?: 'not set'); ?></p>
                    </div>
                    <span class="pqltch-pill"><?php echo s((string)$session->status); ?></span>
                  </div>
                  <p class="pqltch-meta">Attendance <?php echo (int)$session->attendance_count; ?>/<?php echo (int)$session->student_count; ?> - Notes <?php echo (int)$session->note_count; ?>/<?php echo (int)$session->student_count; ?> - Parent summaries <?php echo (int)$session->visible_summary_count; ?></p>
                  <p class="pqltch-students"><?php echo s(implode(', ', array_map(function($student) { return $student['name']; }, $students))); ?></p>
                  <?php echo pqltch_agenda_slides_controls($session, (new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams))->out(false), $teacherbaseurlparams); ?>
                  <div class="pqltch-prep">
                    <h4>Prep Pack: <?php echo (int)$prep['ready']; ?> ready, <?php echo (int)$prep['needspractice']; ?> need guided practice</h4>
                    <div class="pqltch-prep__grid">
                      <?php foreach (array_slice($prep['students'], 0, 6) as $studentprep): ?>
                        <div class="pqltch-prep__item">
                          <strong><?php echo s($studentprep['name']); ?> - <?php echo (int)$studentprep['percent']; ?>%</strong>
                          <?php echo s($studentprep['unit']); ?> - <?php echo s(str_replace('_', ' ', $studentprep['status'])); ?> - steps <?php echo s($studentprep['steps']); ?><br>
                          Focus: <?php echo s($studentprep['focus']); ?> - Speak: <?php echo (int)$studentprep['speakcount']; ?><br>
                          <?php echo s($studentprep['suggestion']); ?>
                        </div>
                      <?php endforeach; ?>
                    </div>
                  </div>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <a class="pqltch-btn pqltch-btn--start" href="<?php echo $joinurl->out(false); ?>">Start class</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo $monitorurl->out(false); ?>">Lesson monitor</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo $reviewurl->out(false); ?>">Attendance &amp; notes</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqltch-panel">
          <h2>Awaiting Review</h2>
          <?php if (!$needsreview): ?>
            <div class="pqltch-empty">No recent classes need attendance or notes.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($needsreview as $session): ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqltch-meta">Ended <?php echo userdate((int)$session->scheduled_end, get_string('strftimedatetimeshort')); ?></p>
                      <?php if (!empty($session->seriesid)): ?><p class="pqltch-meta">Series #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Class ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
                    </div>
                    <span class="pqltch-pill pqltch-pill--warn"><?php echo s((string)$session->status === 'awaiting_review' ? 'awaiting review' : 'completion needed'); ?></span>
                  </div>
                  <p class="pqltch-meta">Attendance <?php echo (int)$session->attendance_count; ?>/<?php echo (int)$session->student_count; ?> - Parent summaries <?php echo (int)$session->visible_summary_count; ?>/<?php echo (int)$session->student_count; ?></p>
                  <?php echo pqltch_agenda_slides_controls($session, (new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams))->out(false), $teacherbaseurlparams); ?>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Complete review</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_monitor.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Lesson monitor</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqltch-panel">
          <h2>Upcoming</h2>
          <?php if (!$upcoming): ?>
            <div class="pqltch-empty">No upcoming classes in the next 7 days.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($upcoming as $session): ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqltch-meta"><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?> - <?php echo (int)$session->student_count; ?> students</p>
                      <?php if (!empty($session->seriesid)): ?><p class="pqltch-meta">Series #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Class ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
                    </div>
                    <span class="pqltch-pill"><?php echo s((string)$session->status); ?></span>
                  </div>
                  <?php echo pqltch_agenda_slides_controls($session, (new moodle_url('/local/hubredirect/live_teacher.php', $teacherbaseurlparams))->out(false), $teacherbaseurlparams); ?>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php', $teacherbaseurlparams))->out(false); ?>">Open live sessions</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_monitor.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Lesson monitor</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqltch-panel pqltch-panel--wide">
          <h2>Quality Coaching</h2>
          <?php if (!$coaching): ?>
            <div class="pqltch-empty">No assigned quality coaching.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($coaching as $session): ?>
                <?php $overdue = !empty($session->qa_coaching_due_date) && (int)$session->qa_coaching_due_date < time() && (string)$session->qa_coaching_status !== 'completed'; ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqltch-meta">QA <?php echo s(str_replace('_', ' ', (string)$session->qa_status)); ?> - Score <?php echo (int)$session->qa_score; ?>%</p>
                      <p class="pqltch-meta">Priority <?php echo s((string)$session->qa_coaching_priority); ?><?php echo !empty($session->qa_coaching_due_date) ? ' - Due ' . userdate((int)$session->qa_coaching_due_date, get_string('strftimedatetimeshort')) : ''; ?></p>
                    </div>
                    <span class="pqltch-pill <?php echo $overdue ? 'pqltch-pill--warn' : ''; ?>"><?php echo $overdue ? 'overdue' : s(str_replace('_', ' ', (string)$session->qa_coaching_status)); ?></span>
                  </div>
                  <?php if (trim((string)$session->qa_coaching_notes) !== ''): ?><p class="pqltch-meta"><?php echo s((string)$session->qa_coaching_notes); ?></p><?php endif; ?>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <?php if ((string)$session->qa_coaching_status === 'assigned'): ?>
                      <form method="post" style="display:inline">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="ack_quality_coaching">
                        <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                        <button class="pqltch-btn" type="submit">Acknowledge coaching</button>
                      </form>
                    <?php endif; ?>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Open class review</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqltch-panel pqltch-panel--wide">
          <h2>Improvement Plans</h2>
          <?php if (!$improvementplans): ?>
            <div class="pqltch-empty">No active improvement plans.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($improvementplans as $session): ?>
                <?php
                  $overdue = !empty($session->improvement_plan_due_date) && (int)$session->improvement_plan_due_date < time() && (string)$session->improvement_plan_status !== 'completed';
                  $mentor = !empty($session->improvement_plan_mentorid) ? pqltch_user_name((int)$session->improvement_plan_mentorid, 'Mentor ' . (int)$session->improvement_plan_mentorid) : '';
                ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqltch-meta">Priority <?php echo s((string)$session->improvement_plan_priority); ?><?php echo !empty($session->improvement_plan_due_date) ? ' - Due ' . userdate((int)$session->improvement_plan_due_date, get_string('strftimedatetimeshort')) : ''; ?></p>
                      <?php if ($mentor !== ''): ?><p class="pqltch-meta">Mentor: <?php echo s($mentor); ?></p><?php endif; ?>
                    </div>
                    <span class="pqltch-pill <?php echo $overdue ? 'pqltch-pill--warn' : ''; ?>"><?php echo $overdue ? 'overdue' : s(str_replace('_', ' ', (string)$session->improvement_plan_status)); ?></span>
                  </div>
                  <?php if (trim((string)$session->improvement_plan_goals) !== ''): ?><p class="pqltch-meta"><strong>Goals:</strong> <?php echo s((string)$session->improvement_plan_goals); ?></p><?php endif; ?>
                  <?php if (trim((string)$session->improvement_plan_actions) !== ''): ?><p class="pqltch-meta"><strong>Actions:</strong> <?php echo s((string)$session->improvement_plan_actions); ?></p><?php endif; ?>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <?php if ((string)$session->improvement_plan_status === 'assigned'): ?>
                      <form method="post" style="display:inline">
                        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                        <input type="hidden" name="action" value="ack_improvement_plan">
                        <input type="hidden" name="sessionid" value="<?php echo (int)$session->id; ?>">
                        <button class="pqltch-btn" type="submit">Acknowledge plan</button>
                      </form>
                    <?php endif; ?>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Open class review</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqltch-panel pqltch-panel--wide">
          <h2>Parent Follow-Ups</h2>
          <?php if (!$followups): ?>
            <div class="pqltch-empty">No open parent follow-ups.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($followups as $note): ?>
                <?php $student = core_user::get_user((int)$note->studentid); ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s($student ? fullname($student) : 'Student ' . (int)$note->studentid); ?></h3>
                      <p class="pqltch-meta"><?php echo s((string)$note->session_title); ?> - <?php echo userdate((int)$note->scheduled_start, get_string('strftimedatetimeshort')); ?></p>
                    </div>
                    <span class="pqltch-pill <?php echo (string)$note->followup_status === 'admin_support_requested' ? 'pqltch-pill--warn' : ''; ?>"><?php echo s(str_replace('_', ' ', (string)$note->followup_status)); ?></span>
                  </div>
                  <p class="pqltch-meta"><?php echo s((string)$note->followup_message !== '' ? (string)$note->followup_message : 'Follow-up requested.'); ?></p>
                  <?php if ((string)($note->parent_response_status ?? 'none') !== 'none'): ?>
                    <p class="pqltch-meta">Parent response: <?php echo s(str_replace('_', ' ', (string)$note->parent_response_status)); ?><?php echo !empty($note->parent_responseat) ? ' - ' . userdate((int)$note->parent_responseat, get_string('strftimedatetimeshort')) : ''; ?></p>
                    <?php if ((string)($note->parent_response_message ?? '') !== ''): ?><p class="pqltch-meta"><?php echo s((string)$note->parent_response_message); ?></p><?php endif; ?>
                  <?php endif; ?>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $teacherbaseurlparams + ['sessionid' => (int)$note->sessionid]))->out(false); ?>">Resolve follow-up</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_followup_message.php', $teacherbaseurlparams + ['sessionid' => (int)$note->sessionid, 'studentid' => (int)$note->studentid, 'sesskey' => sesskey()]))->out(false); ?>">Message parent</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_parent_trust.php', $teacherbaseurlparams + ['childid' => (int)$note->studentid]))->out(false); ?>">Parent hub</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_summaries.php', $teacherbaseurlparams + ['childid' => (int)$note->studentid]))->out(false); ?>">Parent view</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>

        <article class="pqltch-panel pqltch-panel--wide">
          <h2>Recent Completed Classes</h2>
          <?php if (!$recentcompleted): ?>
            <div class="pqltch-empty">No recent completed classes.</div>
          <?php else: ?>
            <div class="pqltch-list">
              <?php foreach ($recentcompleted as $session): ?>
                <?php if ((int)$session->scheduled_end > $now) { continue; } ?>
                <article class="pqltch-card">
                  <div class="pqltch-card__head">
                    <div>
                      <h3><?php echo s((string)$session->title); ?></h3>
                      <p class="pqltch-meta"><?php echo userdate((int)$session->scheduled_start, get_string('strftimedatetimeshort')); ?></p>
                      <?php if (!empty($session->seriesid)): ?><p class="pqltch-meta">Series #<?php echo (int)$session->seriesid; ?><?php echo !empty($session->series_sequence) ? ' - Class ' . (int)$session->series_sequence : ''; ?></p><?php endif; ?>
                    </div>
                    <span class="pqltch-pill <?php echo (int)$session->note_count >= (int)$session->student_count ? 'pqltch-pill--ok' : 'pqltch-pill--warn'; ?>"><?php echo (int)$session->note_count; ?>/<?php echo (int)$session->student_count; ?> notes</span>
                  </div>
                  <p class="pqltch-meta">Attendance <?php echo (int)$session->attendance_count; ?>/<?php echo (int)$session->student_count; ?> - Parent summaries <?php echo (int)$session->visible_summary_count; ?> - Parent recordings <?php echo (int)$session->visible_recording_count; ?></p>
                  <div class="pqltch-actions pqh-workspace-actions">
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_review.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Open review</a>
                    <a class="pqltch-btn pqltch-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_monitor.php', $teacherbaseurlparams + ['sessionid' => (int)$session->id]))->out(false); ?>">Lesson monitor</a>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </article>
      </section>
    <?php endif; ?>
  </div>
</main>
<?php
echo $OUTPUT->footer();
