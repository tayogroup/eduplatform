<?php
// Platform user roster query library — extracted VERBATIM from
// platform_user_roster.php (page-defined pqpur_* helpers) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Shared helpers (pqh_*, fullname, userdate, is_siteadmin) are
// NOT copied — they come from accesslib.php / core.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqpur_consumer_type_label(string $type): string {
    $labels = [
        'platform_foundation' => 'Foundation',
        'academy_consumer' => 'Academy',
        'institution' => 'Institution',
        'marketplace' => 'Marketplace',
        'teacher_workspace' => 'Independent teacher',
    ];
    return $labels[$type] ?? ucwords(str_replace('_', ' ', $type !== '' ? $type : 'consumer'));
}

function pqpur_role_label(string $role): string {
    $roles = pqh_workspace_roles();
    if (isset($roles[$role])) {
        return $roles[$role];
    }
    if ($role === 'independent_teacher') {
        return 'Independent teacher';
    }
    return ucwords(str_replace('_', ' ', $role !== '' ? $role : 'user'));
}

function pqpur_status_class(string $status): string {
    return preg_replace('/[^a-z0-9_-]/i', '', strtolower($status !== '' ? $status : 'unknown'));
}

function pqpur_short_list(array $items, int $limit = 4): string {
    $items = array_values(array_unique(array_filter(array_map('trim', $items))));
    if (!$items) {
        return '';
    }
    if (count($items) <= $limit) {
        return implode(', ', $items);
    }
    return implode(', ', array_slice($items, 0, $limit)) . ' +' . (count($items) - $limit) . ' more';
}

function pqpur_schema_ready(): bool {
    return pqh_table_exists_safe('local_prequran_workspace')
        && pqh_table_exists_safe('local_prequran_workspace_member')
        && pqh_table_exists_safe('local_prequran_consumer');
}

function pqpur_consumer_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    return array_values($DB->get_records_select(
        'local_prequran_consumer',
        "consumer_type <> ?",
        ['platform_foundation'],
        'name ASC',
        'id,name,slug,consumer_type,status'
    ));
}

function pqpur_workspace_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_workspace', null, 'name ASC', 'id,name,slug,workspace_type,status'));
}

function pqpur_fetch_member_rows(array $filters): array {
    global $DB;
    if (!pqpur_schema_ready()) {
        return [];
    }

    $where = ['u.deleted = 0'];
    $params = [];
    if ((int)$filters['consumerid'] > 0) {
        $where[] = 'c.id = :consumerid';
        $params['consumerid'] = (int)$filters['consumerid'];
    }
    if ((int)$filters['workspaceid'] > 0) {
        $where[] = 'wm.workspaceid = :workspaceid';
        $params['workspaceid'] = (int)$filters['workspaceid'];
    }
    if ((string)$filters['role'] !== '') {
        $where[] = 'wm.workspace_role = :role';
        $params['role'] = (string)$filters['role'];
    }
    if ((string)$filters['status'] !== '') {
        $where[] = 'wm.status = :memberstatus';
        $params['memberstatus'] = (string)$filters['status'];
    }
    $q = trim((string)$filters['q']);
    if ($q !== '') {
        $like = '%' . $DB->sql_like_escape($q) . '%';
        $searchparts = [
            $DB->sql_like('u.firstname', ':qfirst', false),
            $DB->sql_like('u.lastname', ':qlast', false),
            $DB->sql_like('u.email', ':qemail', false),
            $DB->sql_like('u.username', ':qusername', false),
            $DB->sql_like('c.name', ':qconsumer', false),
            $DB->sql_like('w.name', ':qworkspace', false),
        ];
        $params['qfirst'] = $like;
        $params['qlast'] = $like;
        $params['qemail'] = $like;
        $params['qusername'] = $like;
        $params['qconsumer'] = $like;
        $params['qworkspace'] = $like;
        if (ctype_digit($q)) {
            $searchparts[] = 'u.id = :quserid';
            $params['quserid'] = (int)$q;
        }
        $where[] = '(' . implode(' OR ', $searchparts) . ')';
    }

    $sql = "SELECT wm.id AS rosterid, wm.workspaceid, wm.userid, wm.workspace_role AS rosterrole,
                   wm.status AS rosterstatus, wm.timemodified AS rosterupdated,
                   u.firstname, u.lastname, u.email, u.username, u.idnumber,
                   w.name AS workspacename, w.slug AS workspaceslug, w.workspace_type, w.status AS workspacestatus,
                   c.id AS consumerid, c.name AS consumername, c.slug AS consumerslug, c.consumer_type, c.status AS consumerstatus
              FROM {local_prequran_workspace_member} wm
              JOIN {user} u ON u.id = wm.userid
         LEFT JOIN {local_prequran_workspace} w ON w.id = wm.workspaceid
         LEFT JOIN {local_prequran_consumer} c ON c.primaryworkspaceid = w.id
             WHERE " . implode(' AND ', $where) . "
          ORDER BY c.name ASC, w.name ASC,
                   CASE wm.workspace_role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'coordinator' THEN 3
                    WHEN 'teacher' THEN 4
                    WHEN 'assistant_teacher' THEN 5
                    WHEN 'parent' THEN 6
                    WHEN 'student' THEN 7
                    ELSE 8 END,
                   u.lastname ASC, u.firstname ASC, u.id ASC";
    return array_values($DB->get_records_sql($sql, $params));
}

function pqpur_fetch_independent_teacher_rows(array $filters, array $existinguserids): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_profile')) {
        return [];
    }

    $hasconsumer = pqh_table_has_field_safe('local_prequran_teacher_profile', 'consumerid');
    $hasworkspace = pqh_table_has_field_safe('local_prequran_teacher_profile', 'workspaceid');
    $where = ['u.deleted = 0'];
    $params = [];
    if ($existinguserids) {
        [$notinsql, $notinparams] = $DB->get_in_or_equal($existinguserids, SQL_PARAMS_NAMED, 'knownuser', false);
        $where[] = 'tp.userid ' . $notinsql;
        $params += $notinparams;
    }
    if ((int)$filters['consumerid'] > 0 && $hasconsumer) {
        $where[] = 'tp.consumerid = :tpconsumerid';
        $params['tpconsumerid'] = (int)$filters['consumerid'];
    } else if ((int)$filters['consumerid'] > 0 && !$hasconsumer) {
        return [];
    }
    if ((int)$filters['workspaceid'] > 0 && $hasworkspace) {
        $where[] = 'tp.workspaceid = :tpworkspaceid';
        $params['tpworkspaceid'] = (int)$filters['workspaceid'];
    } else if ((int)$filters['workspaceid'] > 0 && !$hasworkspace) {
        return [];
    }
    if ((string)$filters['role'] !== '' && (string)$filters['role'] !== 'independent_teacher') {
        return [];
    }
    if ((string)$filters['status'] !== '') {
        $where[] = 'tp.status = :tpstatus';
        $params['tpstatus'] = (string)$filters['status'];
    }
    $q = trim((string)$filters['q']);
    if ($q !== '') {
        $like = '%' . $DB->sql_like_escape($q) . '%';
        $searchparts = [
            $DB->sql_like('u.firstname', ':tqfirst', false),
            $DB->sql_like('u.lastname', ':tqlast', false),
            $DB->sql_like('u.email', ':tqemail', false),
            $DB->sql_like('u.username', ':tqusername', false),
            $DB->sql_like('tp.teacher_display_name', ':tqdisplay', false),
        ];
        $params['tqfirst'] = $like;
        $params['tqlast'] = $like;
        $params['tqemail'] = $like;
        $params['tqusername'] = $like;
        $params['tqdisplay'] = $like;
        if (ctype_digit($q)) {
            $searchparts[] = 'u.id = :tquserid';
            $params['tquserid'] = (int)$q;
        }
        $where[] = '(' . implode(' OR ', $searchparts) . ')';
    }

    $consumerfield = $hasconsumer ? 'tp.consumerid' : '0';
    $workspacefield = $hasworkspace ? 'tp.workspaceid' : '0';
    $consumerjoin = $hasconsumer ? 'LEFT JOIN {local_prequran_consumer} c ON c.id = tp.consumerid' : 'LEFT JOIN {local_prequran_consumer} c ON 1 = 0';
    $workspacejoin = $hasworkspace ? 'LEFT JOIN {local_prequran_workspace} w ON w.id = tp.workspaceid' : 'LEFT JOIN {local_prequran_workspace} w ON 1 = 0';

    $sql = "SELECT tp.id AS rosterid, {$workspacefield} AS workspaceid, tp.userid,
                   'independent_teacher' AS rosterrole, tp.status AS rosterstatus, tp.timemodified AS rosterupdated,
                   u.firstname, u.lastname, u.email, u.username, u.idnumber,
                   w.name AS workspacename, w.slug AS workspaceslug, w.workspace_type, w.status AS workspacestatus,
                   {$consumerfield} AS consumerid, c.name AS consumername, c.slug AS consumerslug, c.consumer_type, c.status AS consumerstatus
              FROM {local_prequran_teacher_profile} tp
              JOIN {user} u ON u.id = tp.userid
              {$consumerjoin}
              {$workspacejoin}
             WHERE " . implode(' AND ', $where) . "
          ORDER BY c.name ASC, tp.teacher_display_name ASC, u.lastname ASC, u.firstname ASC";
    return array_values($DB->get_records_sql($sql, $params));
}

function pqpur_moodle_courses_by_user(array $userids): array {
    global $DB;
    if (!$userids) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'muser');
    $params['siteid'] = SITEID;
    $rows = $DB->get_records_sql(
        "SELECT ue.id AS rowkey, ue.userid, c.id AS courseid,
                c.fullname, c.shortname, c.visible, ue.status AS enrolstatus
           FROM {user_enrolments} ue
           JOIN {enrol} e ON e.id = ue.enrolid
           JOIN {course} c ON c.id = e.courseid
          WHERE ue.userid {$insql}
            AND c.id <> :siteid
       ORDER BY c.fullname ASC",
        $params
    );
    $byuser = [];
    foreach ($rows as $row) {
        $label = trim((string)$row->fullname) !== '' ? (string)$row->fullname : (string)$row->shortname;
        if (!(int)$row->visible) {
            $label .= ' (hidden)';
        }
        if ((int)$row->enrolstatus !== 0) {
            $label .= ' (suspended)';
        }
        $byuser[(int)$row->userid][] = $label;
    }
    return $byuser;
}

function pqpur_offerings_by_user(array $userids): array {
    global $DB;
    if (!$userids || !pqh_table_exists_safe('local_prequran_course_offering') || !pqh_table_exists_safe('local_prequran_course_enrol_req')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'ouser');
    $rows = $DB->get_records_sql(
        "SELECT r.id, r.studentid AS userid, r.status, r.workspaceid, o.title, o.course_key
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
          WHERE r.studentid {$insql}
       ORDER BY r.timemodified DESC, r.id DESC",
        $params
    );
    $byuser = [];
    foreach ($rows as $row) {
        $userid = (int)$row->userid;
        $status = (string)$row->status;
        $title = trim((string)$row->title) !== '' ? (string)$row->title : (string)$row->course_key;
        $byuser[$userid]['all'][] = $title . ' (' . $status . ')';
        if (in_array($status, ['approved', 'enrolled'], true)) {
            $byuser[$userid]['active'][] = $title;
        } else if ($status === 'pending') {
            $byuser[$userid]['pending'][] = $title;
        }
    }
    return $byuser;
}

function pqpur_assignment_counts(array $userids): array {
    global $DB;
    if (!$userids || !pqh_table_exists_safe('local_prequran_teacher_student')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'auser');
    $params['status'] = 'active';
    $teacherrows = $DB->get_records_sql(
        "SELECT teacherid AS userid, COUNT(1) AS total
           FROM {local_prequran_teacher_student}
          WHERE status = :status AND teacherid {$insql}
       GROUP BY teacherid",
        $params
    );
    [$studentinsql, $studentparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'suser');
    $studentparams['status'] = 'active';
    $studentrows = $DB->get_records_sql(
        "SELECT studentid AS userid, COUNT(1) AS total
           FROM {local_prequran_teacher_student}
          WHERE status = :status AND studentid {$studentinsql}
       GROUP BY studentid",
        $studentparams
    );
    $counts = [];
    foreach ($teacherrows as $row) {
        $counts[(int)$row->userid]['students'] = (int)$row->total;
    }
    foreach ($studentrows as $row) {
        $counts[(int)$row->userid]['teachers'] = (int)$row->total;
    }
    return $counts;
}

function pqpur_build_rows(array $filters): array {
    $rows = pqpur_fetch_member_rows($filters);
    $knownuserids = [];
    foreach ($rows as $row) {
        $knownuserids[(int)$row->userid] = (int)$row->userid;
    }
    foreach (pqpur_fetch_independent_teacher_rows($filters, array_values($knownuserids)) as $row) {
        $rows[] = $row;
        $knownuserids[(int)$row->userid] = (int)$row->userid;
    }

    $userids = array_values($knownuserids);
    $moodlecourses = pqpur_moodle_courses_by_user($userids);
    $offerings = pqpur_offerings_by_user($userids);
    $assignments = pqpur_assignment_counts($userids);
    foreach ($rows as $row) {
        $userid = (int)$row->userid;
        $row->fullname = fullname($row);
        $row->moodlecourses = $moodlecourses[$userid] ?? [];
        $row->offeringactive = $offerings[$userid]['active'] ?? [];
        $row->offeringpending = $offerings[$userid]['pending'] ?? [];
        $row->offeringall = $offerings[$userid]['all'] ?? [];
        $row->assignedstudents = (int)($assignments[$userid]['students'] ?? 0);
        $row->assignedteachers = (int)($assignments[$userid]['teachers'] ?? 0);
    }
    return $rows;
}

function pqpur_emit_csv(array $rows): void {
    $filename = 'platform-user-roster-' . date('Ymd-His') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'consumer_id', 'consumer', 'consumer_type', 'workspace_id', 'workspace',
        'workspace_type', 'role', 'member_status', 'userid', 'name', 'username',
        'email', 'account_no', 'moodle_courses', 'course_offerings', 'pending_offerings',
        'assigned_students', 'assigned_teachers', 'last_updated',
    ]);
    foreach ($rows as $row) {
        fputcsv($out, [
            (int)($row->consumerid ?? 0),
            (string)($row->consumername ?? ''),
            pqpur_consumer_type_label((string)($row->consumer_type ?? '')),
            (int)($row->workspaceid ?? 0),
            (string)($row->workspacename ?? ''),
            (string)($row->workspace_type ?? ''),
            pqpur_role_label((string)$row->rosterrole),
            (string)$row->rosterstatus,
            (int)$row->userid,
            (string)$row->fullname,
            (string)$row->username,
            (string)$row->email,
            pqh_account_no_value($row),
            implode('; ', (array)$row->moodlecourses),
            implode('; ', (array)$row->offeringall),
            implode('; ', (array)$row->offeringpending),
            (int)$row->assignedstudents,
            (int)$row->assignedteachers,
            (int)$row->rosterupdated > 0 ? userdate((int)$row->rosterupdated) : '',
        ]);
    }
    fclose($out);
    exit;
}
