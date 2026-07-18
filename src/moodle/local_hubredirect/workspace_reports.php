<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$baseurlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseurlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseurlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only workspace teaching and admin users can view workspace reports.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseurlparams),
        'Workspace reports access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'Choose a valid workspace before opening workspace reports.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseurlparams),
        'Workspace reports unavailable'
    );
}
$canmanage = pqh_user_can_manage_workspace((int)$USER->id, $workspaceid);
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/workspace_reports.php', $baseurlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Workspace Reports');
$PAGE->set_heading('Workspace Reports');
$PAGE->add_body_class('pqw-reports-page');

function pqwr_parse_date_start(string $date): int {
    $date = trim($date);
    if ($date === '') {
        return 0;
    }
    $time = strtotime($date . ' 00:00:00');
    return $time ? (int)$time : 0;
}

function pqwr_parse_date_end(string $date): int {
    $date = trim($date);
    if ($date === '') {
        return 0;
    }
    $time = strtotime($date . ' 23:59:59');
    return $time ? (int)$time : 0;
}

function pqwr_percent(int $part, int $total): int {
    if ($total <= 0) {
        return 0;
    }
    return (int)round(($part / $total) * 100);
}

function pqwr_count(string $table, array $conditions): int {
    global $DB;
    if (!pqh_table_exists_safe($table)) {
        return 0;
    }
    foreach (array_keys($conditions) as $field) {
        if (!pqh_table_has_field_safe($table, $field)) {
            return 0;
        }
    }
    return (int)$DB->count_records($table, $conditions);
}

function pqwr_date_label(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : '';
}

function pqwr_user_options(int $workspaceid, array $roles): array {
    global $DB;
    $options = [];
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
        $params['workspaceid'] = $workspaceid;
        $params['status'] = 'active';
        $rows = $DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.username, u.idnumber, MIN(wm.workspace_role) AS workspace_role
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE wm.workspaceid = :workspaceid
                AND wm.status = :status
                AND wm.workspace_role {$insql}
           GROUP BY u.id, u.firstname, u.lastname, u.email, u.username, u.idnumber
           ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
            $params
        );
        foreach ($rows as $row) {
            $options[(int)$row->id] = $row;
        }
    }
    if (array_intersect($roles, ['owner', 'admin', 'teacher', 'assistant_teacher'])
            && pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'teacher_work_models')) {
        $profileparams = ['workspaceid' => $workspaceid];
        $statussql = '';
        if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'status')) {
            $statussql = ' AND LOWER(tp.status) NOT IN (:archived, :inactive, :rejected)';
            $profileparams += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        foreach ($DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.username, u.idnumber, 'teacher' AS workspace_role
               FROM {local_prequran_teacher_profile} tp
               JOIN {user} u ON u.id = tp.userid
              WHERE tp.workspaceid = :workspaceid
                AND LOWER(tp.teacher_work_models) LIKE '%independent%'
                {$statussql}
           ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
            $profileparams
        ) as $row) {
            $options[(int)$row->id] = $options[(int)$row->id] ?? $row;
        }
    }
    uasort($options, static function($a, $b): int {
        return strcasecmp(trim((string)$a->lastname . ' ' . (string)$a->firstname), trim((string)$b->lastname . ' ' . (string)$b->firstname));
    });
    return $options;
}

function pqwr_workspace_student_ids(int $workspaceid): array {
    global $DB;
    $ids = [];
    foreach (pqwr_user_options($workspaceid, ['student']) as $row) {
        $ids[(int)$row->id] = (int)$row->id;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student') && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['workspaceid' => $workspaceid, 'status' => 'active'], '', 'id,studentid') as $row) {
            $ids[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    return array_values(array_filter($ids));
}

function pqwr_role_counts(int $workspaceid): array {
    global $DB;
    $counts = [];
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $rows = $DB->get_records_sql(
            "SELECT workspace_role, COUNT(1) AS rolecount
               FROM {local_prequran_workspace_member}
              WHERE workspaceid = :workspaceid AND status = :status
           GROUP BY workspace_role",
            ['workspaceid' => $workspaceid, 'status' => 'active']
        );
        foreach ($rows as $row) {
            $counts[(string)$row->workspace_role] = (int)$row->rolecount;
        }
    }
    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'teacher_work_models')) {
        $params = ['workspaceid' => $workspaceid];
        $statussql = '';
        if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'status')) {
            $statussql = ' AND LOWER(status) NOT IN (:archived, :inactive, :rejected)';
            $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        $profileteacherids = $DB->get_fieldset_sql(
            "SELECT userid
               FROM {local_prequran_teacher_profile}
              WHERE workspaceid = :workspaceid
                AND LOWER(teacher_work_models) LIKE '%independent%'
                {$statussql}",
            $params
        );
        $memberteacherids = [];
        if (pqh_table_exists_safe('local_prequran_workspace_member')) {
            $memberteacherids = $DB->get_fieldset_sql(
                "SELECT userid
                   FROM {local_prequran_workspace_member}
                  WHERE workspaceid = :workspaceid
                    AND status = :status
                    AND workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')",
                ['workspaceid' => $workspaceid, 'status' => 'active']
            );
        }
        $extra = count(array_diff(array_map('intval', $profileteacherids), array_map('intval', $memberteacherids)));
        if ($extra > 0) {
            $counts['teacher'] = (int)($counts['teacher'] ?? 0) + $extra;
        }
    }
    return $counts;
}

function pqwr_filter_params(array $extra = []): array {
    global $workspaceid, $fromtime, $totime, $teacherid, $studentid;
    $params = array_merge(['workspaceid' => $workspaceid], $extra);
    if ($fromtime > 0) {
        $params['fromtime'] = $fromtime;
    }
    if ($totime > 0) {
        $params['totime'] = $totime;
    }
    if ($teacherid > 0) {
        $params['teacherid'] = $teacherid;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    return $params;
}

function pqwr_report_url_params(array $extra = []): array {
    global $baseurlparams, $fromdate, $todate, $teacherid, $studentid, $statusfilter;
    $params = $baseurlparams;
    if ($fromdate !== '') {
        $params['fromdate'] = $fromdate;
    }
    if ($todate !== '') {
        $params['todate'] = $todate;
    }
    if ($teacherid > 0) {
        $params['teacherid'] = $teacherid;
    }
    if ($studentid > 0) {
        $params['studentid'] = $studentid;
    }
    if ($statusfilter !== '') {
        $params['status'] = $statusfilter;
    }
    return array_merge($params, $extra);
}

function pqwr_report_url(array $extra = []): moodle_url {
    return new moodle_url('/local/hubredirect/workspace_reports.php', pqwr_report_url_params($extra));
}

function pqwr_live_base_where(string $alias): string {
    global $fromtime, $totime, $teacherid, $statusfilter;
    $where = "{$alias}.workspaceid = :workspaceid";
    if ($fromtime > 0) {
        $where .= " AND {$alias}.scheduled_start >= :fromtime";
    }
    if ($totime > 0) {
        $where .= " AND {$alias}.scheduled_start <= :totime";
    }
    if ($teacherid > 0) {
        $where .= " AND {$alias}.teacherid = :teacherid";
    }
    if ($statusfilter !== '' && in_array($statusfilter, ['scheduled', 'started', 'completed', 'cancelled'], true)) {
        $where .= " AND {$alias}.status = :statusfilter";
    }
    return $where;
}

function pqwr_attendance_base_where(string $alias, string $sessionalias = 's'): string {
    global $fromtime, $totime, $teacherid, $studentid, $statusfilter;
    $where = "{$alias}.workspaceid = :workspaceid";
    if ($fromtime > 0) {
        $where .= " AND COALESCE({$sessionalias}.scheduled_start, {$alias}.timemodified) >= :fromtime";
    }
    if ($totime > 0) {
        $where .= " AND COALESCE({$sessionalias}.scheduled_start, {$alias}.timemodified) <= :totime";
    }
    if ($teacherid > 0) {
        $where .= " AND {$sessionalias}.teacherid = :teacherid";
    }
    if ($studentid > 0) {
        $where .= " AND {$alias}.studentid = :studentid";
    }
    if ($statusfilter !== '' && in_array($statusfilter, ['present', 'late', 'attended', 'absent', 'excused'], true)) {
        $where .= " AND {$alias}.attendance_status = :statusfilter";
    }
    return $where;
}

function pqwr_material_base_where(string $alias): string {
    global $fromtime, $totime, $studentid, $statusfilter;
    $where = "{$alias}.workspaceid = :workspaceid AND {$alias}.status = :active";
    if ($fromtime > 0) {
        $where .= " AND COALESCE({$alias}.timemodified, {$alias}.timecreated) >= :fromtime";
    }
    if ($totime > 0) {
        $where .= " AND COALESCE({$alias}.timemodified, {$alias}.timecreated) <= :totime";
    }
    if ($studentid > 0) {
        $where .= " AND {$alias}.target_type = 'student' AND {$alias}.targetid = :studentid";
    }
    if ($statusfilter !== '' && in_array($statusfilter, ['assigned', 'in_progress', 'completed', 'reviewed'], true)) {
        $where .= " AND {$alias}.workflow_status = :statusfilter";
    }
    return $where;
}

function pqwr_notes_base_where(string $alias, string $sessionalias = 's'): string {
    global $fromtime, $totime, $teacherid, $studentid;
    $where = "{$alias}.workspaceid = :workspaceid";
    if ($fromtime > 0) {
        $where .= " AND COALESCE({$sessionalias}.scheduled_start, {$alias}.timemodified) >= :fromtime";
    }
    if ($totime > 0) {
        $where .= " AND COALESCE({$sessionalias}.scheduled_start, {$alias}.timemodified) <= :totime";
    }
    if ($teacherid > 0) {
        $where .= " AND {$alias}.teacherid = :teacherid";
    }
    if ($studentid > 0) {
        $where .= " AND {$alias}.studentid = :studentid";
    }
    return $where;
}

function pqwr_session_status_counts(): array {
    global $DB, $statusfilter, $studentid;
    if (!pqh_table_exists_safe('local_prequran_live_session') || !pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid')) {
        return [];
    }
    $join = '';
    $where = pqwr_live_base_where('s');
    if ($studentid > 0 && pqh_table_exists_safe('local_prequran_live_participant')) {
        $join = "JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.studentid = :studentid AND p.status = :participantstatus";
    }
    $params = pqwr_filter_params(['statusfilter' => $statusfilter, 'participantstatus' => 'active']);
    $rows = $DB->get_records_sql(
        "SELECT s.status, COUNT(DISTINCT s.id) AS statuscount
           FROM {local_prequran_live_session} s
           {$join}
          WHERE {$where}
       GROUP BY s.status",
        $params
    );
    $counts = [];
    foreach ($rows as $row) {
        $counts[(string)$row->status] = (int)$row->statuscount;
    }
    return $counts;
}

function pqwr_attendance_counts(): array {
    global $DB, $statusfilter;
    if (!pqh_table_exists_safe('local_prequran_live_attendance') || !pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT a.attendance_status, COUNT(1) AS attendancecount
           FROM {local_prequran_live_attendance} a
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE " . pqwr_attendance_base_where('a', 's') . "
       GROUP BY a.attendance_status",
        pqwr_filter_params(['statusfilter' => $statusfilter])
    );
    $counts = [];
    foreach ($rows as $row) {
        $counts[(string)$row->attendance_status] = (int)$row->attendancecount;
    }
    return $counts;
}

function pqwr_material_workflow_counts(): array {
    global $DB, $statusfilter;
    $defaults = ['assigned' => 0, 'in_progress' => 0, 'completed' => 0, 'reviewed' => 0];
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign') || !pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'workflow_status')) {
        return $defaults;
    }
    $rows = $DB->get_records_sql(
        "SELECT a.workflow_status, COUNT(1) AS assignmentcount
           FROM {local_prequran_workspace_mat_assign} a
          WHERE " . pqwr_material_base_where('a') . "
       GROUP BY a.workflow_status",
        pqwr_filter_params(['active' => 'active', 'statusfilter' => $statusfilter])
    );
    foreach ($rows as $row) {
        $key = (string)($row->workflow_status ?: 'assigned');
        $defaults[$key] = (int)$row->assignmentcount;
    }
    return $defaults;
}

function pqwr_teacher_drilldown(int $workspaceid): array {
    global $DB, $teacherid, $studentid, $statusfilter;
    $teachermap = [];
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $where = "wm.workspaceid = :workspaceid AND wm.status = :status AND wm.workspace_role IN ('teacher','assistant_teacher','owner','admin')";
        $params = ['workspaceid' => $workspaceid, 'status' => 'active'];
        if ($teacherid > 0) {
            $where .= ' AND wm.userid = :teacherid';
            $params['teacherid'] = $teacherid;
        }
        foreach ($DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber, MIN(wm.workspace_role) AS workspace_role
               FROM {local_prequran_workspace_member} wm
               JOIN {user} u ON u.id = wm.userid
              WHERE {$where}
           GROUP BY u.id, u.firstname, u.lastname, u.email, u.idnumber
           ORDER BY u.lastname ASC, u.firstname ASC",
            $params
        ) as $row) {
            $teachermap[(int)$row->id] = $row;
        }
    }
    if (pqh_table_exists_safe('local_prequran_teacher_profile')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid')
            && pqh_table_has_field_safe('local_prequran_teacher_profile', 'teacher_work_models')) {
        $where = "tp.workspaceid = :workspaceid AND LOWER(tp.teacher_work_models) LIKE '%independent%'";
        $params = ['workspaceid' => $workspaceid];
        if (pqh_table_has_field_safe('local_prequran_teacher_profile', 'status')) {
            $where .= ' AND LOWER(tp.status) NOT IN (:archived, :inactive, :rejected)';
            $params += ['archived' => 'archived', 'inactive' => 'inactive', 'rejected' => 'rejected'];
        }
        if ($teacherid > 0) {
            $where .= ' AND tp.userid = :teacherid';
            $params['teacherid'] = $teacherid;
        }
        foreach ($DB->get_records_sql(
            "SELECT u.id, u.firstname, u.lastname, u.email, u.idnumber, 'teacher' AS workspace_role
               FROM {local_prequran_teacher_profile} tp
               JOIN {user} u ON u.id = tp.userid
              WHERE {$where}
           ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
            $params
        ) as $row) {
            $teachermap[(int)$row->id] = $teachermap[(int)$row->id] ?? $row;
        }
    }
    $teachers = array_values($teachermap);
    usort($teachers, static function($a, $b): int {
        return strcasecmp(trim((string)$a->lastname . ' ' . (string)$a->firstname), trim((string)$b->lastname . ' ' . (string)$b->firstname));
    });
    foreach ($teachers as $row) {
        $row->studentcount = 0;
        $row->sessioncount = 0;
        $row->attendancepresent = 0;
        $row->attendancetotal = 0;
        $row->materialcompleted = 0;
        $row->materialtotal = 0;
        $row->notecount = 0;
        $row->parentnotecount = 0;

        if (pqh_table_exists_safe('local_prequran_teacher_student')) {
            $studentwhere = 'workspaceid = ? AND teacherid = ? AND status = ?';
            $studentparams = [$workspaceid, (int)$row->id, 'active'];
            if ($studentid > 0) {
                $studentwhere .= ' AND studentid = ?';
                $studentparams[] = $studentid;
            }
            $row->studentcount = (int)$DB->count_records_select('local_prequran_teacher_student', $studentwhere, $studentparams);
        }

        if (pqh_table_exists_safe('local_prequran_live_session')) {
            $sessionwhere = pqwr_live_base_where('s') . ' AND s.teacherid = :rowteacherid';
            $sessionparams = pqwr_filter_params(['statusfilter' => $statusfilter, 'rowteacherid' => (int)$row->id]);
            unset($sessionparams['teacherid']);
            $row->sessioncount = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_session} s
                  WHERE {$sessionwhere}",
                $sessionparams
            );
        }

        if (pqh_table_exists_safe('local_prequran_live_attendance')) {
            $attwhere = pqwr_attendance_base_where('a', 's') . ' AND s.teacherid = :rowteacherid';
            $attparams = pqwr_filter_params(['statusfilter' => $statusfilter, 'rowteacherid' => (int)$row->id]);
            unset($attparams['teacherid']);
            $row->attendancetotal = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_attendance} a
              LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
                  WHERE {$attwhere}",
                $attparams
            );
            $row->attendancepresent = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_attendance} a
              LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
                  WHERE {$attwhere} AND a.attendance_status IN ('present','late','attended')",
                $attparams
            );
        }

        if (pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
            $matwhere = pqwr_material_base_where('a');
            $matparams = pqwr_filter_params(['active' => 'active', 'statusfilter' => $statusfilter, 'rowteacherid' => (int)$row->id]);
            $matwhere .= " AND a.target_type = 'student' AND EXISTS (
                SELECT 1 FROM {local_prequran_teacher_student} ts
                 WHERE ts.workspaceid = a.workspaceid
                   AND ts.studentid = a.targetid
                   AND ts.teacherid = :rowteacherid
                   AND ts.status = 'active'
            )";
            $row->materialtotal = (int)$DB->get_field_sql("SELECT COUNT(1) FROM {local_prequran_workspace_mat_assign} a WHERE {$matwhere}", $matparams);
            $row->materialcompleted = (int)$DB->get_field_sql(
                "SELECT COUNT(1) FROM {local_prequran_workspace_mat_assign} a WHERE {$matwhere} AND a.workflow_status IN ('completed','reviewed')",
                $matparams
            );
        }

        if (pqh_table_exists_safe('local_prequran_live_note')) {
            $notewhere = pqwr_notes_base_where('n', 's') . ' AND n.teacherid = :rowteacherid';
            $noteparams = pqwr_filter_params(['rowteacherid' => (int)$row->id]);
            unset($noteparams['teacherid']);
            $row->notecount = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_note} n
              LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
                  WHERE {$notewhere}",
                $noteparams
            );
            $row->parentnotecount = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_note} n
              LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
                  WHERE {$notewhere} AND n.visible_to_parent = 1",
                $noteparams
            );
        }
    }
    return $teachers;
}

function pqwr_student_drilldown(int $workspaceid): array {
    global $DB, $studentid, $teacherid, $statusfilter;
    $students = pqwr_user_options($workspaceid, ['student']);
    if ($studentid > 0) {
        $students = isset($students[$studentid]) ? [$studentid => $students[$studentid]] : [];
    }
    foreach ($students as $row) {
        $row->teachername = '';
        $row->attendancetotal = 0;
        $row->attendancepresent = 0;
        $row->materialtotal = 0;
        $row->materialcompleted = 0;
        $row->materialreviewed = 0;
        $row->notecount = 0;
        $row->parentnotecount = 0;

        if (pqh_table_exists_safe('local_prequran_teacher_student')) {
            $teacherwhere = 'ts.workspaceid = :workspaceid AND ts.studentid = :studentid AND ts.status = :status';
            $teacherparams = ['workspaceid' => $workspaceid, 'studentid' => (int)$row->id, 'status' => 'active'];
            if ($teacherid > 0) {
                $teacherwhere .= ' AND ts.teacherid = :teacherid';
                $teacherparams['teacherid'] = $teacherid;
            }
            $teachers = $DB->get_records_sql(
                "SELECT u.id, u.firstname, u.lastname
                   FROM {local_prequran_teacher_student} ts
                   JOIN {user} u ON u.id = ts.teacherid
                  WHERE {$teacherwhere}
               ORDER BY u.lastname ASC, u.firstname ASC",
                $teacherparams
            );
            if ($teacherid > 0 && !$teachers) {
                unset($students[(int)$row->id]);
                continue;
            }
            $names = [];
            foreach ($teachers as $teacher) {
                $names[] = fullname($teacher);
            }
            $row->teachername = implode(', ', $names);
        }

        if (pqh_table_exists_safe('local_prequran_live_attendance')) {
            $attwhere = pqwr_attendance_base_where('a', 's') . ' AND a.studentid = :rowstudentid';
            $attparams = pqwr_filter_params(['statusfilter' => $statusfilter, 'rowstudentid' => (int)$row->id]);
            $row->attendancetotal = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_attendance} a
              LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
                  WHERE {$attwhere}",
                $attparams
            );
            $row->attendancepresent = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_attendance} a
              LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
                  WHERE {$attwhere} AND a.attendance_status IN ('present','late','attended')",
                $attparams
            );
        }

        if (pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
            $matwhere = pqwr_material_base_where('a') . " AND a.target_type = 'student' AND a.targetid = :rowstudentid";
            $matparams = pqwr_filter_params(['active' => 'active', 'statusfilter' => $statusfilter, 'rowstudentid' => (int)$row->id]);
            $row->materialtotal = (int)$DB->get_field_sql("SELECT COUNT(1) FROM {local_prequran_workspace_mat_assign} a WHERE {$matwhere}", $matparams);
            $row->materialcompleted = (int)$DB->get_field_sql(
                "SELECT COUNT(1) FROM {local_prequran_workspace_mat_assign} a WHERE {$matwhere} AND a.workflow_status IN ('completed','reviewed')",
                $matparams
            );
            $row->materialreviewed = (int)$DB->get_field_sql(
                "SELECT COUNT(1) FROM {local_prequran_workspace_mat_assign} a WHERE {$matwhere} AND a.workflow_status = 'reviewed'",
                $matparams
            );
        }

        if (pqh_table_exists_safe('local_prequran_live_note')) {
            $notewhere = pqwr_notes_base_where('n', 's') . ' AND n.studentid = :rowstudentid';
            $noteparams = pqwr_filter_params(['rowstudentid' => (int)$row->id]);
            unset($noteparams['studentid']);
            $row->notecount = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_note} n
              LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
                  WHERE {$notewhere}",
                $noteparams
            );
            $row->parentnotecount = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_note} n
              LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
                  WHERE {$notewhere} AND n.visible_to_parent = 1",
                $noteparams
            );
        }
    }
    return array_values($students);
}

function pqwr_recent_materials(): array {
    global $DB, $statusfilter;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign') || !pqh_table_exists_safe('local_prequran_workspace_material')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT a.id, a.workflow_status, a.targetid, a.timemodified, m.title, m.material_type,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_workspace_mat_assign} a
           JOIN {local_prequran_workspace_material} m ON m.id = a.materialid
      LEFT JOIN {user} u ON u.id = a.targetid
          WHERE " . pqwr_material_base_where('a') . "
       ORDER BY a.timemodified DESC, a.id DESC",
        pqwr_filter_params(['active' => 'active', 'statusfilter' => $statusfilter]),
        0,
        12
    ));
}

function pqwr_recent_notes(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_note')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT n.id, n.sessionid, n.studentid, n.teacherid, n.visible_to_parent, n.parent_summary,
                n.strengths, n.needs_practice, n.timemodified, s.title, s.scheduled_start,
                su.firstname AS student_firstname, su.lastname AS student_lastname, su.idnumber AS student_idnumber,
                tu.firstname AS teacher_firstname, tu.lastname AS teacher_lastname, tu.idnumber AS teacher_idnumber
           FROM {local_prequran_live_note} n
      LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
      LEFT JOIN {user} su ON su.id = n.studentid
      LEFT JOIN {user} tu ON tu.id = n.teacherid
          WHERE " . pqwr_notes_base_where('n', 's') . "
       ORDER BY COALESCE(s.scheduled_start, n.timemodified) DESC, n.id DESC",
        pqwr_filter_params(),
        0,
        12
    ));
}

function pqwr_recordings(): array {
    global $DB, $fromtime, $totime, $teacherid, $studentid, $workspaceid;
    if (!pqh_table_exists_safe('local_prequran_live_recording')) {
        return [];
    }
    $where = pqh_table_has_field_safe('local_prequran_live_recording', 'workspaceid')
        ? '(r.workspaceid = :workspaceid OR (COALESCE(r.workspaceid, 0) = 0 AND s.workspaceid = :workspaceidfallback))'
        : 's.workspaceid = :workspaceid';
    $params = ['workspaceid' => $workspaceid];
    if (pqh_table_has_field_safe('local_prequran_live_recording', 'workspaceid')) {
        $params['workspaceidfallback'] = $workspaceid;
    }
    if ($fromtime > 0) {
        $where .= ' AND COALESCE(s.scheduled_start, r.timemodified) >= :fromtime';
        $params['fromtime'] = $fromtime;
    }
    if ($totime > 0) {
        $where .= ' AND COALESCE(s.scheduled_start, r.timemodified) <= :totime';
        $params['totime'] = $totime;
    }
    if ($teacherid > 0) {
        $where .= ' AND s.teacherid = :teacherid';
        $params['teacherid'] = $teacherid;
    }
    $studentjoin = '';
    if ($studentid > 0 && pqh_table_exists_safe('local_prequran_live_participant')) {
        $studentjoin = 'JOIN {local_prequran_live_participant} p ON p.sessionid = r.sessionid AND p.studentid = :studentid AND p.status = :participantstatus';
        $params['studentid'] = $studentid;
        $params['participantstatus'] = 'active';
    }
    return array_values($DB->get_records_sql(
        "SELECT r.id, r.sessionid, r.name, r.playback_format, r.duration_minutes, r.published,
                r.visible_to_parent, r.status, r.reviewedby, r.reviewedat, r.expiresat,
                r.playback_url, r.timemodified, s.title, s.teacherid, s.scheduled_start,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_live_recording} r
      LEFT JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           {$studentjoin}
      LEFT JOIN {user} u ON u.id = s.teacherid
          WHERE {$where}
       ORDER BY COALESCE(s.scheduled_start, r.timemodified) DESC, r.id DESC",
        $params,
        0,
        20
    ));
}

function pqwr_group_key(int $time): string {
    return $time > 0 ? date('Y-m-d', $time) : date('Y-m-d');
}

function pqwr_chart_window_start(): int {
    global $fromtime;
    return $fromtime > 0 ? $fromtime : strtotime('-29 days 00:00:00');
}

function pqwr_chart_window_end(): int {
    global $totime;
    return $totime > 0 ? $totime : strtotime('today 23:59:59');
}

function pqwr_day_labels(int $start, int $end): array {
    $labels = [];
    $start = strtotime(date('Y-m-d 00:00:00', $start));
    $end = strtotime(date('Y-m-d 00:00:00', $end));
    if (!$start || !$end || $end < $start) {
        return [];
    }
    for ($time = $start; $time <= $end; $time += DAYSECS) {
        $labels[date('Y-m-d', $time)] = date('M j', $time);
        if (count($labels) >= 60) {
            break;
        }
    }
    return $labels;
}

function pqwr_attendance_trend(): array {
    global $DB, $statusfilter;
    $labels = pqwr_day_labels(pqwr_chart_window_start(), pqwr_chart_window_end());
    $trend = [];
    foreach ($labels as $key => $label) {
        $trend[$key] = ['label' => $label, 'present' => 0, 'total' => 0];
    }
    if (!pqh_table_exists_safe('local_prequran_live_attendance') || !pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
        return array_values($trend);
    }
    $rows = $DB->get_records_sql(
        "SELECT a.id, a.attendance_status, COALESCE(s.scheduled_start, a.timemodified) AS reporttime
           FROM {local_prequran_live_attendance} a
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE " . pqwr_attendance_base_where('a', 's') . "
       ORDER BY COALESCE(s.scheduled_start, a.timemodified) ASC",
        pqwr_filter_params(['statusfilter' => $statusfilter]),
        0,
        1000
    );
    foreach ($rows as $row) {
        $key = pqwr_group_key((int)$row->reporttime);
        if (!isset($trend[$key])) {
            continue;
        }
        $trend[$key]['total']++;
        if (in_array((string)$row->attendance_status, ['present', 'late', 'attended'], true)) {
            $trend[$key]['present']++;
        }
    }
    return array_values($trend);
}

function pqwr_material_completion_trend(): array {
    global $DB, $statusfilter;
    $labels = pqwr_day_labels(pqwr_chart_window_start(), pqwr_chart_window_end());
    $trend = [];
    foreach ($labels as $key => $label) {
        $trend[$key] = ['label' => $label, 'assigned' => 0, 'completed' => 0, 'reviewed' => 0];
    }
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return array_values($trend);
    }
    $rows = $DB->get_records_sql(
        "SELECT a.id, a.workflow_status, COALESCE(a.reviewedat, a.completedat, a.timemodified, a.timecreated) AS reporttime
           FROM {local_prequran_workspace_mat_assign} a
          WHERE " . pqwr_material_base_where('a') . "
       ORDER BY COALESCE(a.reviewedat, a.completedat, a.timemodified, a.timecreated) ASC",
        pqwr_filter_params(['active' => 'active', 'statusfilter' => $statusfilter]),
        0,
        1000
    );
    foreach ($rows as $row) {
        $key = pqwr_group_key((int)$row->reporttime);
        if (!isset($trend[$key])) {
            continue;
        }
        $trend[$key]['assigned']++;
        if (in_array((string)$row->workflow_status, ['completed', 'reviewed'], true)) {
            $trend[$key]['completed']++;
        }
        if ((string)$row->workflow_status === 'reviewed') {
            $trend[$key]['reviewed']++;
        }
    }
    return array_values($trend);
}

function pqwr_teacher_workload_chart(array $teacherdrilldown): array {
    $rows = [];
    foreach ($teacherdrilldown as $teacher) {
        $rows[] = [
            'label' => fullname($teacher),
            'sessions' => (int)$teacher->sessioncount,
            'students' => (int)$teacher->studentcount,
            'notes' => (int)$teacher->notecount,
        ];
    }
    usort($rows, function(array $a, array $b): int {
        return ($b['sessions'] + $b['students'] + $b['notes']) <=> ($a['sessions'] + $a['students'] + $a['notes']);
    });
    return array_slice($rows, 0, 10);
}

function pqwr_student_progress_timeline(): array {
    global $DB, $statusfilter;
    $events = [];
    if (pqh_table_exists_safe('local_prequran_live_attendance')) {
        $rows = $DB->get_records_sql(
            "SELECT a.id, a.studentid, a.attendance_status, COALESCE(s.scheduled_start, a.timemodified) AS reporttime,
                    s.title, u.firstname, u.lastname
               FROM {local_prequran_live_attendance} a
          LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          LEFT JOIN {user} u ON u.id = a.studentid
              WHERE " . pqwr_attendance_base_where('a', 's') . "
           ORDER BY COALESCE(s.scheduled_start, a.timemodified) DESC",
            pqwr_filter_params(['statusfilter' => $statusfilter]),
            0,
            20
        );
        foreach ($rows as $row) {
            $events[] = [
                'time' => (int)$row->reporttime,
                'kind' => 'Attendance',
                'student' => fullname($row),
                'title' => (string)($row->title ?: 'Live session'),
                'status' => (string)$row->attendance_status,
            ];
        }
    }
    if (pqh_table_exists_safe('local_prequran_workspace_mat_assign') && pqh_table_exists_safe('local_prequran_workspace_material')) {
        $rows = $DB->get_records_sql(
            "SELECT a.id, a.targetid AS studentid, a.workflow_status,
                    COALESCE(a.reviewedat, a.completedat, a.timemodified, a.timecreated) AS reporttime,
                    m.title, u.firstname, u.lastname
               FROM {local_prequran_workspace_mat_assign} a
               JOIN {local_prequran_workspace_material} m ON m.id = a.materialid
          LEFT JOIN {user} u ON u.id = a.targetid
              WHERE " . pqwr_material_base_where('a') . "
                AND a.target_type = 'student'
           ORDER BY COALESCE(a.reviewedat, a.completedat, a.timemodified, a.timecreated) DESC",
            pqwr_filter_params(['active' => 'active', 'statusfilter' => $statusfilter]),
            0,
            20
        );
        foreach ($rows as $row) {
            $events[] = [
                'time' => (int)$row->reporttime,
                'kind' => 'Material',
                'student' => fullname($row),
                'title' => (string)$row->title,
                'status' => str_replace('_', ' ', (string)$row->workflow_status),
            ];
        }
    }
    if (pqh_table_exists_safe('local_prequran_live_note')) {
        $rows = $DB->get_records_sql(
            "SELECT n.id, n.studentid, n.visible_to_parent, n.timemodified AS reporttime,
                    COALESCE(s.title, CONCAT('Session #', n.sessionid)) AS title,
                    u.firstname, u.lastname
               FROM {local_prequran_live_note} n
          LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          LEFT JOIN {user} u ON u.id = n.studentid
              WHERE " . pqwr_notes_base_where('n', 's') . "
           ORDER BY n.timemodified DESC",
            pqwr_filter_params(),
            0,
            20
        );
        foreach ($rows as $row) {
            $events[] = [
                'time' => (int)$row->reporttime,
                'kind' => 'Teacher note',
                'student' => fullname($row),
                'title' => (string)$row->title,
                'status' => (int)$row->visible_to_parent === 1 ? 'parent visible' : 'private',
            ];
        }
    }
    usort($events, fn(array $a, array $b): int => $b['time'] <=> $a['time']);
    return array_slice($events, 0, 18);
}

function pqwr_chart_max(array $rows, array $keys): int {
    $max = 0;
    foreach ($rows as $row) {
        foreach ($keys as $key) {
            $max = max($max, (int)($row[$key] ?? 0));
        }
    }
    return max(1, $max);
}

$fromdate = optional_param('fromdate', '', PARAM_TEXT);
$todate = optional_param('todate', '', PARAM_TEXT);
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$studentid = optional_param('studentid', 0, PARAM_INT);
$statusfilter = optional_param('status', '', PARAM_ALPHANUMEXT);
$fromtime = pqwr_parse_date_start($fromdate);
$totime = pqwr_parse_date_end($todate);
$statusoptions = [
    '' => 'All statuses',
    'present' => 'Attendance: present',
    'late' => 'Attendance: late',
    'absent' => 'Attendance: absent',
    'scheduled' => 'Session: scheduled',
    'started' => 'Session: started',
    'completed' => 'Session: completed',
    'cancelled' => 'Session: cancelled',
    'assigned' => 'Material: assigned',
    'in_progress' => 'Material: in progress',
    'completed' => 'Material: completed',
    'reviewed' => 'Material: reviewed',
];
if (!array_key_exists($statusfilter, $statusoptions)) {
    $statusfilter = '';
}

$teachers = pqwr_user_options($workspaceid, ['owner', 'admin', 'teacher', 'assistant_teacher']);
$students = pqwr_user_options($workspaceid, ['student']);
$studentids = pqwr_workspace_student_ids($workspaceid);
$roles = pqwr_role_counts($workspaceid);
$sessions = pqwr_session_status_counts();
$attendance = pqwr_attendance_counts();
$materialworkflow = pqwr_material_workflow_counts();
$teacherdrilldown = pqwr_teacher_drilldown($workspaceid);
$studentdrilldown = pqwr_student_drilldown($workspaceid);
$recentmaterials = pqwr_recent_materials();
$recentnotes = pqwr_recent_notes();
$recordings = pqwr_recordings();
$attendancechart = pqwr_attendance_trend();
$materialchart = pqwr_material_completion_trend();
$teacherworkloadchart = pqwr_teacher_workload_chart($teacherdrilldown);
$studenttimeline = pqwr_student_progress_timeline();

$attendancetotal = array_sum($attendance);
$attendancepresent = 0;
foreach (['present', 'late', 'attended'] as $status) {
    $attendancepresent += (int)($attendance[$status] ?? 0);
}
$materialtotal = array_sum($materialworkflow);
$materialcomplete = (int)($materialworkflow['completed'] ?? 0) + (int)($materialworkflow['reviewed'] ?? 0);
$revieweditems = (int)($materialworkflow['reviewed'] ?? 0);
$parentnotes = 0;
foreach ($studentdrilldown as $row) {
    $parentnotes += (int)$row->parentnotecount;
}
$metrics = [
    'students' => count($studentids),
    'teachers' => ($roles['teacher'] ?? 0) + ($roles['assistant_teacher'] ?? 0),
    'sessions' => array_sum($sessions),
    'attendance_rate' => pqwr_percent($attendancepresent, $attendancetotal),
    'material_completion_rate' => pqwr_percent($materialcomplete, $materialtotal),
    'reviewed_items' => $revieweditems,
    'parent_visible_notes' => $parentnotes,
    'materials' => pqwr_count('local_prequran_workspace_material', ['workspaceid' => $workspaceid, 'status' => 'active']),
    'recordings' => count($recordings),
];

$export = optional_param('export', '', PARAM_ALPHA);
if ($export !== '' && in_array($export, ['csv', 'teachers', 'students', 'materials', 'notes', 'recordings'], true)) {
    if (!$canmanage) {
        pqh_access_denied(
            'Only workspace owners and admins can export workspace reports.',
            new moodle_url('/local/hubredirect/workspace_reports.php', $baseurlparams),
            'Workspace export access required'
        );
    }
    $filename = clean_filename('workspace-report-' . $workspaceid . '-' . $export . '-' . date('Ymd-His') . '.csv');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    if ($export === 'csv') {
        fputcsv($out, ['section', 'name', 'value']);
        foreach ($metrics as $name => $value) {
            fputcsv($out, ['metric', $name, $value]);
        }
        fputcsv($out, []);
    }
    if (in_array($export, ['csv', 'teachers'], true)) {
    fputcsv($out, ['teacher_drilldown', 'teacher', 'account_no', 'email', 'students', 'attendance', 'attendance_rate', 'materials', 'material_completion_rate', 'notes', 'parent_visible_notes']);
    foreach ($teacherdrilldown as $row) {
        fputcsv($out, [
            'teacher_drilldown',
            fullname($row),
            pqh_account_no_value($row),
            (string)$row->email,
            (int)$row->studentcount,
            (int)$row->attendancepresent . '/' . (int)$row->attendancetotal,
            pqwr_percent((int)$row->attendancepresent, (int)$row->attendancetotal) . '%',
            (int)$row->materialcompleted . '/' . (int)$row->materialtotal,
            pqwr_percent((int)$row->materialcompleted, (int)$row->materialtotal) . '%',
            (int)$row->notecount,
            (int)$row->parentnotecount,
        ]);
    }
    fputcsv($out, []);
    }
    if (in_array($export, ['csv', 'students'], true)) {
    fputcsv($out, ['student_drilldown', 'student', 'account_no', 'email', 'teacher', 'attendance', 'attendance_rate', 'materials', 'material_completion_rate', 'reviewed_materials', 'notes', 'parent_visible_notes']);
    foreach ($studentdrilldown as $row) {
        fputcsv($out, [
            'student_drilldown',
            fullname($row),
            pqh_account_no_value($row),
            (string)$row->email,
            (string)$row->teachername,
            (int)$row->attendancepresent . '/' . (int)$row->attendancetotal,
            pqwr_percent((int)$row->attendancepresent, (int)$row->attendancetotal) . '%',
            (int)$row->materialcompleted . '/' . (int)$row->materialtotal,
            pqwr_percent((int)$row->materialcompleted, (int)$row->materialtotal) . '%',
            (int)$row->materialreviewed,
            (int)$row->notecount,
            (int)$row->parentnotecount,
        ]);
    }
    fputcsv($out, []);
    }
    if (in_array($export, ['csv', 'materials'], true)) {
    fputcsv($out, ['material_assignments', 'student', 'account_no', 'email', 'material', 'type', 'status', 'updated']);
    foreach ($recentmaterials as $row) {
        fputcsv($out, [
            'material_assignments',
            fullname($row),
            pqh_account_no_value($row),
            (string)$row->email,
            (string)$row->title,
            (string)$row->material_type,
            (string)$row->workflow_status,
            pqwr_date_label((int)$row->timemodified),
        ]);
    }
    fputcsv($out, []);
    }
    if (in_array($export, ['csv', 'notes'], true)) {
    fputcsv($out, ['teacher_notes', 'session', 'student', 'teacher', 'parent_visible', 'summary', 'updated']);
    foreach ($recentnotes as $row) {
        $student = trim((string)$row->student_firstname . ' ' . (string)$row->student_lastname);
        $teacher = trim((string)$row->teacher_firstname . ' ' . (string)$row->teacher_lastname);
        fputcsv($out, [
            'teacher_notes',
            (string)($row->title ?: 'Session #' . (int)$row->sessionid),
            $student,
            $teacher,
            (int)$row->visible_to_parent,
            (string)($row->parent_summary ?: $row->strengths ?: $row->needs_practice),
            pqwr_date_label((int)$row->timemodified),
        ]);
    }
    fputcsv($out, []);
    }
    if (in_array($export, ['csv', 'recordings'], true)) {
        fputcsv($out, ['recordings', 'session', 'teacher', 'name', 'format', 'duration_minutes', 'status', 'published', 'visible_to_parent', 'reviewedby', 'reviewedat']);
        foreach ($recordings as $row) {
            fputcsv($out, [
                'recordings',
                (string)($row->title ?: 'Session #' . (int)$row->sessionid),
                fullname($row),
                (string)($row->name ?: 'Class recording'),
                (string)$row->playback_format,
                (int)$row->duration_minutes,
                (string)$row->status,
                (int)$row->published,
                (int)$row->visible_to_parent,
                (int)$row->reviewedby,
                pqwr_date_label((int)$row->reviewedat),
            ]);
        }
    }
    fclose($out);
    exit;
}

echo $OUTPUT->header();
?>
<style>
body.pqw-reports-page header,body.pqw-reports-page footer,body.pqw-reports-page nav.navbar,body.pqw-reports-page #page-header,body.pqw-reports-page #page-footer,body.pqw-reports-page .drawer,body.pqw-reports-page .drawer-toggles,body.pqw-reports-page .block-region,body.pqw-reports-page [data-region="drawer"],body.pqw-reports-page [data-region="right-hand-drawer"]{display:none!important}
body.pqw-reports-page #page,body.pqw-reports-page #page-content,body.pqw-reports-page #region-main,body.pqw-reports-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqwr-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqwr-wrap{max-width:1320px;margin:0 auto}.pqwr-top,.pqwr-panel,.pqwr-filter{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwr-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqwr-title{margin:0;color:#221b22;font-size:29px;font-weight:950;line-height:1.1}.pqwr-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqwr-actions,.pqwr-filter{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqwr-filter{justify-content:flex-start;margin-bottom:14px;align-items:end}.pqwr-field{display:grid;gap:5px;min-width:160px}.pqwr-field label{font-size:12px;font-weight:950;color:#415665;text-transform:uppercase}.pqwr-input{min-height:38px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:850;padding:0 10px}.pqwr-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:#2f6f4e;color:#fff!important;text-decoration:none;font-size:13px;font-weight:950}.pqwr-btn--light{background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12)}.pqwr-btn--mini{min-height:30px;padding:0 9px;font-size:12px}.pqwr-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqwr-metric{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqwr-metric strong{display:block;color:#221b22;font-size:25px;font-weight:950;line-height:1}.pqwr-metric span{display:block;margin-top:5px;color:#5e7280;font-size:12px;font-weight:900}.pqwr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pqwr-panel h2{margin:0 0 12px;color:#221b22;font-size:22px;font-weight:950}.pqwr-panel--wide{grid-column:1/-1}.pqwr-panel-head{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}.pqwr-panel-head h2{margin:0}.pqwr-export-row{display:flex;gap:6px;flex-wrap:wrap}.pqwr-bars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}.pqwr-barbox{padding:14px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff}.pqwr-barlabel{display:flex;justify-content:space-between;gap:10px;color:#173044;font-weight:950}.pqwr-track{height:12px;margin-top:10px;border-radius:999px;background:#e6edf0;overflow:hidden}.pqwr-fill{height:100%;border-radius:999px;background:#2f6f4e}.pqwr-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:14px}.pqwr-chart{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqwr-chart h2{margin:0 0 12px;color:#221b22;font-size:20px;font-weight:950}.pqwr-vbars{height:210px;display:flex;align-items:end;gap:6px;padding:10px 0 0;border-bottom:1px solid rgba(23,48,68,.14)}.pqwr-vbar{flex:1;min-width:8px;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-end;gap:2px}.pqwr-vbar span{display:block;min-height:2px;border-radius:4px 4px 0 0}.pqwr-vbar small{display:block;margin-top:6px;transform:rotate(-35deg);transform-origin:left top;color:#6b7e8b;font-size:10px;font-weight:800;white-space:nowrap}.pqwr-bar-present{background:#2f6f4e}.pqwr-bar-total{background:#c9d8de}.pqwr-bar-complete{background:#356f8f}.pqwr-bar-reviewed{background:#6d8d4e}.pqwr-hbars{display:grid;gap:10px}.pqwr-hbar-row{display:grid;grid-template-columns:minmax(120px,.7fr) 1.4fr auto;gap:10px;align-items:center}.pqwr-hbar-label{font-size:13px;font-weight:950;color:#173044;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pqwr-hbar-track{height:12px;border-radius:999px;background:#e6edf0;overflow:hidden}.pqwr-hbar-fill{height:100%;border-radius:999px;background:#2f6f4e}.pqwr-legend{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;color:#5e7280;font-size:12px;font-weight:900}.pqwr-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px}.pqwr-timeline{display:grid;gap:10px}.pqwr-event{display:grid;grid-template-columns:120px 1fr auto;gap:12px;padding:10px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff}.pqwr-event-time{font-size:12px;font-weight:950;color:#6b7e8b}.pqwr-event-title{font-weight:950;color:#221b22}.pqwr-table{width:100%;border-collapse:separate;border-spacing:0}.pqwr-table th,.pqwr-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqwr-table th{color:#5e7280;font-size:12px;font-weight:950;text-transform:uppercase}.pqwr-name{display:block;color:#221b22;font-size:14px;font-weight:950}.pqwr-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqwr-pill{display:inline-flex;min-height:25px;align-items:center;margin:0 5px 5px 0;padding:0 8px;border-radius:999px;background:#eef4f6;color:#173044;font-size:12px;font-weight:950}.pqwr-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}.pqwr-note{max-width:420px;color:#415665;font-weight:750}.pqwr-link{color:#173044!important;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}
@media(max-width:1180px){.pqwr-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.pqwr-grid{grid-template-columns:1fr}.pqwr-panel--wide{grid-column:auto}}
@media(max-width:1180px){.pqwr-chart-grid{grid-template-columns:1fr}}
@media(max-width:700px){.pqwr-metrics{grid-template-columns:1fr}.pqwr-top{grid-template-columns:1fr}.pqwr-actions{justify-content:flex-start}.pqwr-field{min-width:100%}.pqwr-table{display:block;overflow-x:auto}.pqwr-event{grid-template-columns:1fr}.pqwr-hbar-row{grid-template-columns:1fr}}
<?php echo pqh_workspace_header_css(); ?>
/* ---- EduPlatform design system layer (2026-07-19) ---- */
.pqwr-shell{
  --pqh-ink:#0f2237;--pqh-muted:#5b6b7c;--pqh-faint:#8494a5;--pqh-line:#e4e9ef;--pqh-bg:#f4f6f9;--pqh-surface:#fff;
  --pqh-tint:#edf3fc;--pqh-tint-2:#e0ebfa;--pqh-primary:#2166d1;--pqh-primary-ink:#17498f;
  background:var(--pqh-bg)!important;color:var(--pqh-ink)}
.pqwr-top,.pqwr-top.pqh-workspace-top{background:linear-gradient(120deg,#d7e6f9 0%,#e9f1fc 60%,#f3f8fe 100%)!important;border:1px solid #c5d9f1!important;box-shadow:none!important;border-radius:14px!important}
.pqwr-title{color:var(--pqh-ink)!important;font-size:26px!important;font-weight:800!important;letter-spacing:-.02em!important;text-shadow:none!important}
.pqwr-sub{color:var(--pqh-muted)!important;font-weight:500!important;opacity:1}
.pqwr-btn,.pqwr-shell .pqh-workspace-actions a,.pqwr-shell .pqh-workspace-actions button{background:var(--pqh-surface)!important;border:1px solid var(--pqh-line)!important;color:var(--pqh-ink)!important;font-weight:650!important;border-radius:10px!important;box-shadow:none!important}
.pqwr-btn:hover,.pqwr-shell .pqh-workspace-actions a:hover,.pqwr-shell .pqh-workspace-actions button:hover{background:var(--pqh-tint)!important;border-color:var(--pqh-tint-2)!important;text-decoration:none!important}
.pqwr-shell .pqh-workspace-actions a.pqh-workspace-logout{background:var(--pqh-ink)!important;border-color:var(--pqh-ink)!important;color:#fff!important}
.pqwr-panel,.pqwr-filter,.pqwr-metric,.pqwr-barbox,.pqwr-chart,.pqwr-event{background:var(--pqh-surface);border:1px solid var(--pqh-line)!important;border-radius:14px;box-shadow:0 1px 2px rgba(15,34,55,.05)!important}
.pqwr-panel h2,.pqwr-chart h2{color:var(--pqh-ink);font-size:17px;font-weight:750;letter-spacing:-.01em}
.pqwr-metric strong{color:var(--pqh-ink)!important;font-weight:750!important;letter-spacing:-.02em}
.pqwr-metric span,.pqwr-sub,.pqwr-muted,.pqwr-legend{color:var(--pqh-muted)!important;font-weight:500!important}
.pqwr-field label{color:var(--pqh-faint)!important;font-weight:700!important}
.pqwr-input{border:1px solid var(--pqh-line)!important;border-radius:10px!important;background:var(--pqh-surface)!important;font-weight:550!important}
.pqwr-name,.pqwr-event-title,.pqwr-barlabel{color:var(--pqh-ink)!important;font-weight:700!important}
.pqwr-table th{color:var(--pqh-faint)!important;font-weight:700!important}
.pqwr-table th,.pqwr-table td{border-color:var(--pqh-line)!important}
.pqwr-pill{background:var(--pqh-tint)!important;color:var(--pqh-primary-ink)!important;border-radius:8px!important;font-weight:650!important}
.pqwr-fill,.pqwr-hbar-fill,.pqwr-bar-present{background:var(--pqh-primary)!important}
.pqwr-bar-complete{background:#0f7f9e!important}
.pqwr-bar-reviewed{background:#4a6fa5!important}
.pqwr-track,.pqwr-hbar-track{background:var(--pqh-tint)!important}
.pqwr-empty{background:var(--pqh-surface)!important;border:1px dashed var(--pqh-line)!important;border-radius:14px!important;color:var(--pqh-muted)!important;font-weight:550!important}
.pqwr-link{color:var(--pqh-primary)!important}
</style>
<main class="pqwr-shell">
  <div class="pqwr-wrap">
    <section class="pqwr-top pqh-workspace-top">
      <div>
        <h1 class="pqwr-title pqh-workspace-title"><?php echo s($workspace->name); ?> Reports</h1>
        <p class="pqwr-sub pqh-workspace-sub">Workspace-level operations summary with filtered teacher and student drilldowns.</p>
      </div>
      <nav class="pqwr-actions pqh-workspace-actions">
        <button class="pqwr-btn pqwr-btn--light" type="button" onclick="window.history.back()">Back</button>
        <a class="pqwr-btn pqwr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseurlparams))->out(false); ?>">Workspace dashboard</a>
        <a class="pqwr-btn pqwr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/managed_reports.php', !empty($baseurlparams['consumer']) ? ['consumer' => $baseurlparams['consumer']] : []))->out(false); ?>">Managed reports</a>
        <a class="pqwr-btn pqh-workspace-logout" href="<?php echo (new moodle_url('/local/hubredirect/logout.php'))->out(false); ?>">Logout</a>
      </nav>
    </section>
    <form class="pqwr-filter" method="get" aria-label="Report filters">
      <input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>">
      <?php if (!empty($baseurlparams['consumer'])): ?><input type="hidden" name="consumer" value="<?php echo s((string)$baseurlparams['consumer']); ?>"><?php endif; ?>
      <div class="pqwr-field"><label for="pqwr-from">From</label><input id="pqwr-from" class="pqwr-input" type="date" name="fromdate" value="<?php echo s($fromdate); ?>"></div>
      <div class="pqwr-field"><label for="pqwr-to">To</label><input id="pqwr-to" class="pqwr-input" type="date" name="todate" value="<?php echo s($todate); ?>"></div>
      <div class="pqwr-field"><label for="pqwr-teacher">Teacher</label><select id="pqwr-teacher" class="pqwr-input" name="teacherid"><option value="0">All teachers</option><?php foreach ($teachers as $row): ?><option value="<?php echo (int)$row->id; ?>" <?php echo (int)$row->id === $teacherid ? 'selected' : ''; ?>><?php echo s(fullname($row)); ?> - <?php echo s(pqh_account_no_label($row)); ?> - #<?php echo (int)$row->id; ?></option><?php endforeach; ?></select></div>
      <div class="pqwr-field"><label for="pqwr-student">Student</label><select id="pqwr-student" class="pqwr-input" name="studentid"><option value="0">All students</option><?php foreach ($students as $row): ?><option value="<?php echo (int)$row->id; ?>" <?php echo (int)$row->id === $studentid ? 'selected' : ''; ?>><?php echo s(fullname($row)); ?> - <?php echo s(pqh_account_no_label($row)); ?> - #<?php echo (int)$row->id; ?></option><?php endforeach; ?></select></div>
      <div class="pqwr-field"><label for="pqwr-status">Status</label><select id="pqwr-status" class="pqwr-input" name="status"><?php foreach ($statusoptions as $value => $label): ?><option value="<?php echo s($value); ?>" <?php echo $value === $statusfilter ? 'selected' : ''; ?>><?php echo s($label); ?></option><?php endforeach; ?></select></div>
      <button class="pqwr-btn" type="submit">Apply</button>
      <a class="pqwr-btn pqwr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/workspace_reports.php', $baseurlparams))->out(false); ?>">Clear</a>
      <?php if ($canmanage): ?><button class="pqwr-btn pqwr-btn--light" name="export" value="csv" type="submit">Export CSV</button><?php endif; ?>
      <?php if ($canmanage): ?><button class="pqwr-btn pqwr-btn--light" name="export" value="teachers" type="submit">Teachers CSV</button><?php endif; ?>
      <?php if ($canmanage): ?><button class="pqwr-btn pqwr-btn--light" name="export" value="students" type="submit">Students CSV</button><?php endif; ?>
    </form>
    <section class="pqwr-metrics">
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['students']; ?></strong><span>students</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['teachers']; ?></strong><span>teachers</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['sessions']; ?></strong><span>sessions</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['attendance_rate']; ?>%</strong><span>attendance rate</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['material_completion_rate']; ?>%</strong><span>material completion</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['reviewed_items']; ?></strong><span>reviewed items</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['parent_visible_notes']; ?></strong><span>parent-visible notes</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['materials']; ?></strong><span>library materials</span></div>
      <div class="pqwr-metric"><strong><?php echo (int)$metrics['recordings']; ?></strong><span>recordings</span></div>
    </section>
    <section class="pqwr-bars" aria-label="Report trends">
      <div class="pqwr-barbox"><div class="pqwr-barlabel"><span>Attendance</span><span><?php echo (int)$metrics['attendance_rate']; ?>%</span></div><div class="pqwr-track"><div class="pqwr-fill" style="width:<?php echo min(100, max(0, (int)$metrics['attendance_rate'])); ?>%"></div></div></div>
      <div class="pqwr-barbox"><div class="pqwr-barlabel"><span>Material Completion</span><span><?php echo (int)$metrics['material_completion_rate']; ?>%</span></div><div class="pqwr-track"><div class="pqwr-fill" style="width:<?php echo min(100, max(0, (int)$metrics['material_completion_rate'])); ?>%"></div></div></div>
    </section>
    <section class="pqwr-chart-grid">
      <article class="pqwr-chart">
        <h2>Attendance Trend</h2>
        <?php $attmax = pqwr_chart_max($attendancechart, ['total', 'present']); ?>
        <div class="pqwr-vbars" aria-label="Attendance trend chart">
          <?php foreach ($attendancechart as $point): ?>
            <?php $totalheight = max(2, (int)round(((int)$point['total'] / $attmax) * 190)); $presentheight = max(2, (int)round(((int)$point['present'] / $attmax) * 190)); ?>
            <div class="pqwr-vbar" title="<?php echo s($point['label'] . ': ' . (int)$point['present'] . '/' . (int)$point['total']); ?>">
              <span class="pqwr-bar-present" style="height:<?php echo $presentheight; ?>px"></span>
              <span class="pqwr-bar-total" style="height:<?php echo max(2, $totalheight - $presentheight); ?>px"></span>
              <small><?php echo s($point['label']); ?></small>
            </div>
          <?php endforeach; ?>
        </div>
        <div class="pqwr-legend"><span><i class="pqwr-bar-present"></i>Present</span><span><i class="pqwr-bar-total"></i>Total</span></div>
      </article>
      <article class="pqwr-chart">
        <h2>Material Completion Trend</h2>
        <?php $matmax = pqwr_chart_max($materialchart, ['assigned', 'completed', 'reviewed']); ?>
        <div class="pqwr-vbars" aria-label="Material completion trend chart">
          <?php foreach ($materialchart as $point): ?>
            <?php $completedheight = max(2, (int)round(((int)$point['completed'] / $matmax) * 190)); $reviewedheight = max(2, (int)round(((int)$point['reviewed'] / $matmax) * 190)); ?>
            <div class="pqwr-vbar" title="<?php echo s($point['label'] . ': completed ' . (int)$point['completed'] . ', reviewed ' . (int)$point['reviewed']); ?>">
              <span class="pqwr-bar-complete" style="height:<?php echo $completedheight; ?>px"></span>
              <span class="pqwr-bar-reviewed" style="height:<?php echo $reviewedheight; ?>px"></span>
              <small><?php echo s($point['label']); ?></small>
            </div>
          <?php endforeach; ?>
        </div>
        <div class="pqwr-legend"><span><i class="pqwr-bar-complete"></i>Completed</span><span><i class="pqwr-bar-reviewed"></i>Reviewed</span></div>
      </article>
      <article class="pqwr-chart">
        <h2>Teacher Workload</h2>
        <?php $workmax = pqwr_chart_max($teacherworkloadchart, ['sessions', 'students', 'notes']); ?>
        <?php if (!$teacherworkloadchart): ?><div class="pqwr-empty">No teacher workload rows match these filters.</div><?php else: ?>
          <div class="pqwr-hbars">
            <?php foreach ($teacherworkloadchart as $row): ?>
              <?php $value = (int)$row['sessions'] + (int)$row['students'] + (int)$row['notes']; ?>
              <div class="pqwr-hbar-row">
                <div class="pqwr-hbar-label"><?php echo s($row['label']); ?></div>
                <div class="pqwr-hbar-track"><div class="pqwr-hbar-fill" style="width:<?php echo min(100, (int)round(($value / $workmax) * 100)); ?>%"></div></div>
                <span class="pqwr-pill"><?php echo (int)$row['sessions']; ?> sessions / <?php echo (int)$row['students']; ?> students / <?php echo (int)$row['notes']; ?> notes</span>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </article>
      <article class="pqwr-chart">
        <h2>Student Progress Timeline</h2>
        <?php if (!$studenttimeline): ?><div class="pqwr-empty">No student activity matches these filters yet.</div><?php else: ?>
          <div class="pqwr-timeline">
            <?php foreach ($studenttimeline as $event): ?>
              <div class="pqwr-event">
                <div class="pqwr-event-time"><?php echo s(pqwr_date_label((int)$event['time'])); ?></div>
                <div><div class="pqwr-event-title"><?php echo s($event['student']); ?> - <?php echo s($event['title']); ?></div><span class="pqwr-muted"><?php echo s($event['kind']); ?></span></div>
                <span class="pqwr-pill"><?php echo s($event['status']); ?></span>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </article>
    </section>
    <section class="pqwr-grid">
      <article class="pqwr-panel pqwr-panel--wide">
        <div class="pqwr-panel-head"><h2>Teacher Drilldown</h2><?php if ($canmanage): ?><div class="pqwr-export-row"><a class="pqwr-btn pqwr-btn--light pqwr-btn--mini" href="<?php echo pqwr_report_url(['export' => 'teachers'])->out(false); ?>">Export</a></div><?php endif; ?></div>
        <?php if (!$teacherdrilldown): ?><div class="pqwr-empty">No teacher rows match these filters.</div><?php else: ?>
          <table class="pqwr-table"><thead><tr><th>Teacher</th><th>Students</th><th>Attendance</th><th>Materials</th><th>Notes</th></tr></thead><tbody>
            <?php foreach ($teacherdrilldown as $row): ?><tr>
              <td><span class="pqwr-name"><?php echo s(fullname($row)); ?></span><span class="pqwr-muted"><?php echo s(pqh_account_no_label($row)); ?> / <?php echo s((string)$row->email); ?></span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->studentcount; ?></span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->attendancepresent; ?>/<?php echo (int)$row->attendancetotal; ?></span><span class="pqwr-muted"><?php echo pqwr_percent((int)$row->attendancepresent, (int)$row->attendancetotal); ?>% present</span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->materialcompleted; ?>/<?php echo (int)$row->materialtotal; ?></span><span class="pqwr-muted"><?php echo pqwr_percent((int)$row->materialcompleted, (int)$row->materialtotal); ?>% complete or reviewed</span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->notecount; ?> notes</span><span class="pqwr-pill"><?php echo (int)$row->parentnotecount; ?> parent-visible</span></td>
            </tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel pqwr-panel--wide">
        <div class="pqwr-panel-head"><h2>Student Drilldown</h2><?php if ($canmanage): ?><div class="pqwr-export-row"><a class="pqwr-btn pqwr-btn--light pqwr-btn--mini" href="<?php echo pqwr_report_url(['export' => 'students'])->out(false); ?>">Export</a></div><?php endif; ?></div>
        <?php if (!$studentdrilldown): ?><div class="pqwr-empty">No student rows match these filters.</div><?php else: ?>
          <table class="pqwr-table"><thead><tr><th>Student</th><th>Teacher</th><th>Attendance</th><th>Materials</th><th>Reviewed</th><th>Notes</th></tr></thead><tbody>
            <?php foreach ($studentdrilldown as $row): ?><tr>
              <td><span class="pqwr-name"><a class="pqwr-link" href="<?php echo (new moodle_url('/local/hubredirect/workspace_student.php', array_merge($baseurlparams, ['studentid' => (int)$row->id])))->out(false); ?>"><?php echo s(fullname($row)); ?></a></span><span class="pqwr-muted"><?php echo s(pqh_account_no_label($row)); ?> / <?php echo s((string)$row->email); ?></span></td>
              <td><?php echo s($row->teachername ?: 'Unassigned'); ?></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->attendancepresent; ?>/<?php echo (int)$row->attendancetotal; ?></span><span class="pqwr-muted"><?php echo pqwr_percent((int)$row->attendancepresent, (int)$row->attendancetotal); ?>% present</span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->materialcompleted; ?>/<?php echo (int)$row->materialtotal; ?></span><span class="pqwr-muted"><?php echo pqwr_percent((int)$row->materialcompleted, (int)$row->materialtotal); ?>% complete or reviewed</span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->materialreviewed; ?></span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->notecount; ?> notes</span><span class="pqwr-pill"><?php echo (int)$row->parentnotecount; ?> parent-visible</span></td>
            </tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel">
        <h2>Attendance</h2>
        <?php if (!$attendance): ?><div class="pqwr-empty">No attendance rows match these filters.</div><?php else: ?>
          <?php foreach ($attendance as $status => $count): ?><span class="pqwr-pill"><?php echo s($status ?: 'unknown'); ?>: <?php echo (int)$count; ?></span><?php endforeach; ?>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel">
        <h2>Material Progress</h2>
        <?php foreach ($materialworkflow as $status => $count): ?><span class="pqwr-pill"><?php echo s(str_replace('_', ' ', $status)); ?>: <?php echo (int)$count; ?></span><?php endforeach; ?>
      </article>
      <article class="pqwr-panel">
        <h2>Session Status</h2>
        <?php if (!$sessions): ?><div class="pqwr-empty">No workspace sessions match these filters.</div><?php else: ?>
          <?php foreach ($sessions as $status => $count): ?><span class="pqwr-pill"><?php echo s($status); ?>: <?php echo (int)$count; ?></span><?php endforeach; ?>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel">
        <h2>Roles</h2>
        <?php if (!$roles): ?><div class="pqwr-empty">No active workspace members yet.</div><?php else: ?>
          <?php foreach ($roles as $role => $count): ?><span class="pqwr-pill"><?php echo s($role); ?>: <?php echo (int)$count; ?></span><?php endforeach; ?>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel pqwr-panel--wide">
        <div class="pqwr-panel-head"><h2>Recent Material Assignments</h2><?php if ($canmanage): ?><div class="pqwr-export-row"><a class="pqwr-btn pqwr-btn--light pqwr-btn--mini" href="<?php echo pqwr_report_url(['export' => 'materials'])->out(false); ?>">Export</a></div><?php endif; ?></div>
        <?php if (!$recentmaterials): ?><div class="pqwr-empty">No material assignments match these filters.</div><?php else: ?>
          <table class="pqwr-table"><thead><tr><th>Student</th><th>Material</th><th>Status</th><th>Updated</th></tr></thead><tbody>
            <?php foreach ($recentmaterials as $row): ?><tr><td><span class="pqwr-name"><?php echo s(fullname($row)); ?></span><span class="pqwr-muted"><?php echo s(pqh_account_no_label($row)); ?> / <?php echo s((string)$row->email); ?></span></td><td><?php echo s((string)$row->title); ?><span class="pqwr-muted"><?php echo s((string)$row->material_type); ?></span></td><td><span class="pqwr-pill"><?php echo s(str_replace('_', ' ', (string)$row->workflow_status)); ?></span></td><td><?php echo s(pqwr_date_label((int)$row->timemodified)); ?></td></tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel pqwr-panel--wide">
        <div class="pqwr-panel-head"><h2>Recordings</h2><?php if ($canmanage): ?><div class="pqwr-export-row"><a class="pqwr-btn pqwr-btn--light pqwr-btn--mini" href="<?php echo pqwr_report_url(['export' => 'recordings'])->out(false); ?>">Export</a></div><?php endif; ?></div>
        <?php if (!$recordings): ?><div class="pqwr-empty">No recordings match these filters yet.</div><?php else: ?>
          <table class="pqwr-table"><thead><tr><th>Session</th><th>Teacher</th><th>Status</th><th>Parent</th><th>Duration</th><th>Updated</th></tr></thead><tbody>
            <?php foreach ($recordings as $row): ?><tr><td><span class="pqwr-name"><?php echo s((string)($row->title ?: 'Session #' . (int)$row->sessionid)); ?></span><span class="pqwr-muted"><?php echo s((string)($row->name ?: 'Class recording')); ?></span></td><td><?php echo s(fullname($row)); ?><span class="pqwr-muted"><?php echo s(pqh_account_no_label($row)); ?></span></td><td><span class="pqwr-pill"><?php echo s((string)$row->status); ?></span><?php if ((int)$row->reviewedby > 0): ?><span class="pqwr-pill">reviewed</span><?php endif; ?></td><td><span class="pqwr-pill"><?php echo (int)$row->visible_to_parent === 1 ? 'visible' : 'hidden'; ?></span></td><td><?php echo (int)$row->duration_minutes > 0 ? (int)$row->duration_minutes . ' min' : ''; ?></td><td><?php echo s(pqwr_date_label((int)$row->timemodified)); ?></td></tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
      <article class="pqwr-panel pqwr-panel--wide">
        <div class="pqwr-panel-head"><h2>Recent Teacher Notes</h2><?php if ($canmanage): ?><div class="pqwr-export-row"><a class="pqwr-btn pqwr-btn--light pqwr-btn--mini" href="<?php echo pqwr_report_url(['export' => 'notes'])->out(false); ?>">Export</a></div><?php endif; ?></div>
        <?php if (!$recentnotes): ?><div class="pqwr-empty">No teacher notes match these filters.</div><?php else: ?>
          <table class="pqwr-table"><thead><tr><th>Session</th><th>Student</th><th>Teacher</th><th>Visible</th><th>Note</th><th>Updated</th></tr></thead><tbody>
            <?php foreach ($recentnotes as $row): ?><tr>
              <td><span class="pqwr-name"><?php echo s((string)($row->title ?: 'Session #' . (int)$row->sessionid)); ?></span></td>
              <td><?php echo s(trim((string)$row->student_firstname . ' ' . (string)$row->student_lastname)); ?><span class="pqwr-muted"><?php echo s(pqh_account_no_label((object)['userid' => $row->studentid, 'idnumber' => $row->student_idnumber])); ?></span></td>
              <td><?php echo s(trim((string)$row->teacher_firstname . ' ' . (string)$row->teacher_lastname)); ?><span class="pqwr-muted"><?php echo s(pqh_account_no_label((object)['userid' => $row->teacherid, 'idnumber' => $row->teacher_idnumber])); ?></span></td>
              <td><span class="pqwr-pill"><?php echo (int)$row->visible_to_parent === 1 ? 'parent' : 'private'; ?></span></td>
              <td><div class="pqwr-note"><?php echo s((string)($row->parent_summary ?: $row->strengths ?: $row->needs_practice)); ?></div></td>
              <td><?php echo s(pqwr_date_label((int)$row->timemodified)); ?></td>
            </tr><?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
      </article>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
