<?php
// Workspace-reports query library — extracted VERBATIM from workspace_reports.php
// (renamed pqwr_ -> pqwrl_) for the token-gated portal endpoint. The legacy page
// keeps its inline copies and stays untouched (parallel-run).
// CONTRACT: callers must set these GLOBALS before calling (as the page does):
//   $workspaceid, $fromdate, $todate, $fromtime, $totime, $teacherid,
//   $studentid, $statusfilter, $baseurlparams.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqwrl_parse_date_start(string $date): int {
    $date = trim($date);
    if ($date === '') {
        return 0;
    }
    $time = strtotime($date . ' 00:00:00');
    return $time ? (int)$time : 0;
}

function pqwrl_parse_date_end(string $date): int {
    $date = trim($date);
    if ($date === '') {
        return 0;
    }
    $time = strtotime($date . ' 23:59:59');
    return $time ? (int)$time : 0;
}

function pqwrl_percent(int $part, int $total): int {
    if ($total <= 0) {
        return 0;
    }
    return (int)round(($part / $total) * 100);
}

function pqwrl_count(string $table, array $conditions): int {
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

function pqwrl_date_label(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : '';
}

function pqwrl_user_options(int $workspaceid, array $roles): array {
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

function pqwrl_workspace_student_ids(int $workspaceid): array {
    global $DB;
    $ids = [];
    foreach (pqwrl_user_options($workspaceid, ['student']) as $row) {
        $ids[(int)$row->id] = (int)$row->id;
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student') && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        foreach ($DB->get_records('local_prequran_teacher_student', ['workspaceid' => $workspaceid, 'status' => 'active'], '', 'id,studentid') as $row) {
            $ids[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    return array_values(array_filter($ids));
}

function pqwrl_role_counts(int $workspaceid): array {
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

function pqwrl_filter_params(array $extra = []): array {
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

function pqwrl_report_url_params(array $extra = []): array {
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

function pqwrl_report_url(array $extra = []): moodle_url {
    return new moodle_url('/local/hubredirect/workspace_reports.php', pqwrl_report_url_params($extra));
}

function pqwrl_live_base_where(string $alias): string {
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

function pqwrl_attendance_base_where(string $alias, string $sessionalias = 's'): string {
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

function pqwrl_material_base_where(string $alias): string {
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

function pqwrl_notes_base_where(string $alias, string $sessionalias = 's'): string {
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

function pqwrl_session_status_counts(): array {
    global $DB, $statusfilter, $studentid;
    if (!pqh_table_exists_safe('local_prequran_live_session') || !pqh_table_has_field_safe('local_prequran_live_session', 'workspaceid')) {
        return [];
    }
    $join = '';
    $where = pqwrl_live_base_where('s');
    if ($studentid > 0 && pqh_table_exists_safe('local_prequran_live_participant')) {
        $join = "JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.studentid = :studentid AND p.status = :participantstatus";
    }
    $params = pqwrl_filter_params(['statusfilter' => $statusfilter, 'participantstatus' => 'active']);
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

function pqwrl_attendance_counts(): array {
    global $DB, $statusfilter;
    if (!pqh_table_exists_safe('local_prequran_live_attendance') || !pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT a.attendance_status, COUNT(1) AS attendancecount
           FROM {local_prequran_live_attendance} a
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE " . pqwrl_attendance_base_where('a', 's') . "
       GROUP BY a.attendance_status",
        pqwrl_filter_params(['statusfilter' => $statusfilter])
    );
    $counts = [];
    foreach ($rows as $row) {
        $counts[(string)$row->attendance_status] = (int)$row->attendancecount;
    }
    return $counts;
}

function pqwrl_material_workflow_counts(): array {
    global $DB, $statusfilter;
    $defaults = ['assigned' => 0, 'in_progress' => 0, 'completed' => 0, 'reviewed' => 0];
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign') || !pqh_table_has_field_safe('local_prequran_workspace_mat_assign', 'workflow_status')) {
        return $defaults;
    }
    $rows = $DB->get_records_sql(
        "SELECT a.workflow_status, COUNT(1) AS assignmentcount
           FROM {local_prequran_workspace_mat_assign} a
          WHERE " . pqwrl_material_base_where('a') . "
       GROUP BY a.workflow_status",
        pqwrl_filter_params(['active' => 'active', 'statusfilter' => $statusfilter])
    );
    foreach ($rows as $row) {
        $key = (string)($row->workflow_status ?: 'assigned');
        $defaults[$key] = (int)$row->assignmentcount;
    }
    return $defaults;
}

function pqwrl_teacher_drilldown(int $workspaceid): array {
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
            $sessionwhere = pqwrl_live_base_where('s') . ' AND s.teacherid = :rowteacherid';
            $sessionparams = pqwrl_filter_params(['statusfilter' => $statusfilter, 'rowteacherid' => (int)$row->id]);
            unset($sessionparams['teacherid']);
            $row->sessioncount = (int)$DB->get_field_sql(
                "SELECT COUNT(1)
                   FROM {local_prequran_live_session} s
                  WHERE {$sessionwhere}",
                $sessionparams
            );
        }

        if (pqh_table_exists_safe('local_prequran_live_attendance')) {
            $attwhere = pqwrl_attendance_base_where('a', 's') . ' AND s.teacherid = :rowteacherid';
            $attparams = pqwrl_filter_params(['statusfilter' => $statusfilter, 'rowteacherid' => (int)$row->id]);
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
            $matwhere = pqwrl_material_base_where('a');
            $matparams = pqwrl_filter_params(['active' => 'active', 'statusfilter' => $statusfilter, 'rowteacherid' => (int)$row->id]);
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
            $notewhere = pqwrl_notes_base_where('n', 's') . ' AND n.teacherid = :rowteacherid';
            $noteparams = pqwrl_filter_params(['rowteacherid' => (int)$row->id]);
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

function pqwrl_student_drilldown(int $workspaceid): array {
    global $DB, $studentid, $teacherid, $statusfilter;
    $students = pqwrl_user_options($workspaceid, ['student']);
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
            $attwhere = pqwrl_attendance_base_where('a', 's') . ' AND a.studentid = :rowstudentid';
            $attparams = pqwrl_filter_params(['statusfilter' => $statusfilter, 'rowstudentid' => (int)$row->id]);
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
            $matwhere = pqwrl_material_base_where('a') . " AND a.target_type = 'student' AND a.targetid = :rowstudentid";
            $matparams = pqwrl_filter_params(['active' => 'active', 'statusfilter' => $statusfilter, 'rowstudentid' => (int)$row->id]);
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
            $notewhere = pqwrl_notes_base_where('n', 's') . ' AND n.studentid = :rowstudentid';
            $noteparams = pqwrl_filter_params(['rowstudentid' => (int)$row->id]);
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

function pqwrl_recent_materials(): array {
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
          WHERE " . pqwrl_material_base_where('a') . "
       ORDER BY a.timemodified DESC, a.id DESC",
        pqwrl_filter_params(['active' => 'active', 'statusfilter' => $statusfilter]),
        0,
        12
    ));
}

function pqwrl_recent_notes(): array {
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
          WHERE " . pqwrl_notes_base_where('n', 's') . "
       ORDER BY COALESCE(s.scheduled_start, n.timemodified) DESC, n.id DESC",
        pqwrl_filter_params(),
        0,
        12
    ));
}

function pqwrl_recordings(): array {
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

function pqwrl_group_key(int $time): string {
    return $time > 0 ? date('Y-m-d', $time) : date('Y-m-d');
}

function pqwrl_chart_window_start(): int {
    global $fromtime;
    return $fromtime > 0 ? $fromtime : strtotime('-29 days 00:00:00');
}

function pqwrl_chart_window_end(): int {
    global $totime;
    return $totime > 0 ? $totime : strtotime('today 23:59:59');
}

function pqwrl_day_labels(int $start, int $end): array {
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

function pqwrl_attendance_trend(): array {
    global $DB, $statusfilter;
    $labels = pqwrl_day_labels(pqwrl_chart_window_start(), pqwrl_chart_window_end());
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
          WHERE " . pqwrl_attendance_base_where('a', 's') . "
       ORDER BY COALESCE(s.scheduled_start, a.timemodified) ASC",
        pqwrl_filter_params(['statusfilter' => $statusfilter]),
        0,
        1000
    );
    foreach ($rows as $row) {
        $key = pqwrl_group_key((int)$row->reporttime);
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

function pqwrl_material_completion_trend(): array {
    global $DB, $statusfilter;
    $labels = pqwrl_day_labels(pqwrl_chart_window_start(), pqwrl_chart_window_end());
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
          WHERE " . pqwrl_material_base_where('a') . "
       ORDER BY COALESCE(a.reviewedat, a.completedat, a.timemodified, a.timecreated) ASC",
        pqwrl_filter_params(['active' => 'active', 'statusfilter' => $statusfilter]),
        0,
        1000
    );
    foreach ($rows as $row) {
        $key = pqwrl_group_key((int)$row->reporttime);
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

function pqwrl_teacher_workload_chart(array $teacherdrilldown): array {
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

function pqwrl_student_progress_timeline(): array {
    global $DB, $statusfilter;
    $events = [];
    if (pqh_table_exists_safe('local_prequran_live_attendance')) {
        $rows = $DB->get_records_sql(
            "SELECT a.id, a.studentid, a.attendance_status, COALESCE(s.scheduled_start, a.timemodified) AS reporttime,
                    s.title, u.firstname, u.lastname
               FROM {local_prequran_live_attendance} a
          LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          LEFT JOIN {user} u ON u.id = a.studentid
              WHERE " . pqwrl_attendance_base_where('a', 's') . "
           ORDER BY COALESCE(s.scheduled_start, a.timemodified) DESC",
            pqwrl_filter_params(['statusfilter' => $statusfilter]),
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
              WHERE " . pqwrl_material_base_where('a') . "
                AND a.target_type = 'student'
           ORDER BY COALESCE(a.reviewedat, a.completedat, a.timemodified, a.timecreated) DESC",
            pqwrl_filter_params(['active' => 'active', 'statusfilter' => $statusfilter]),
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
              WHERE " . pqwrl_notes_base_where('n', 's') . "
           ORDER BY n.timemodified DESC",
            pqwrl_filter_params(),
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

function pqwrl_chart_max(array $rows, array $keys): int {
    $max = 0;
    foreach ($rows as $row) {
        foreach ($keys as $key) {
            $max = max($max, (int)($row[$key] ?? 0));
        }
    }
    return max(1, $max);
}
