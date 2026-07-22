<?php
// Unmanaged-reports query library — the page-defined helpers of
// local_hubredirect/unmanaged_reports.php extracted VERBATIM (functions renamed
// pqur_ -> pqurl_ so the legacy page and this lib can coexist) for the
// token-gated portal endpoint (local/prequran/portal_handlers/unmanaged-reports.php).
// The legacy page keeps its own inline copies and stays untouched (parallel-run).
// Only functions defined by the page are ported here; shared Moodle/hubredirect
// helpers (pqh_*, profile_user_record, core_user, ...) are called, not copied.

defined('MOODLE_INTERNAL') || die();

function pqurl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqurl_table_has_field(string $table, string $field): bool {
    global $DB;
    if (!pqurl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqurl_is_managed_student(int $userid): bool {
    require_once($GLOBALS['CFG']->dirroot . '/user/profile/lib.php');
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

function pqurl_profile(int $userid): ?stdClass {
    global $DB;
    if (!pqurl_table_exists('local_prequran_student_profile') || !pqurl_table_has_field('local_prequran_student_profile', 'userid')) {
        return null;
    }
    return $DB->get_record('local_prequran_student_profile', ['userid' => $userid], '*', IGNORE_MISSING) ?: null;
}

function pqurl_profile_field(?stdClass $profile, string $field): string {
    if (!$profile || !property_exists($profile, $field)) {
        return '';
    }
    return trim((string)$profile->{$field});
}

function pqurl_user_courses(int $userid): array {
    global $DB;
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT c.id, c.fullname, c.shortname, c.visible
           FROM {course} c
           JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = :coursecontext
           JOIN {role_assignments} ra ON ra.contextid = ctx.id AND ra.userid = :userid
           JOIN {role} r ON r.id = ra.roleid
          WHERE c.id <> :sitecourse
            AND (r.shortname = :studentshortname OR r.archetype = :studentarchetype)
       ORDER BY c.fullname ASC",
        [
            'coursecontext' => CONTEXT_COURSE,
            'userid' => $userid,
            'sitecourse' => SITEID,
            'studentshortname' => 'student',
            'studentarchetype' => 'student',
        ],
        0,
        12
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'id' => (int)$row->id,
            'fullname' => (string)$row->fullname,
            'shortname' => (string)$row->shortname,
            'visible' => (int)$row->visible,
        ];
    }
    return $out;
}

function pqurl_user_class_groups(int $userid): array {
    global $DB;
    if (!pqurl_table_exists('local_prequran_group_member') || !pqurl_table_exists('local_prequran_class_group')) {
        return [];
    }
    $rows = $DB->get_records_sql(
        "SELECT cg.id, cg.title, cg.course_type, cg.current_level, cg.status
           FROM {local_prequran_group_member} gm
           JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
          WHERE gm.studentid = :userid
            AND gm.assignment_status = :status
       ORDER BY cg.title ASC",
        ['userid' => $userid, 'status' => 'active'],
        0,
        12
    );
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'id' => (int)$row->id,
            'title' => (string)$row->title,
            'course_type' => (string)$row->course_type,
            'current_level' => (string)$row->current_level,
            'status' => (string)$row->status,
        ];
    }
    return $out;
}

function pqurl_source_userids(string $search, int $courseid, int $groupid, int $limit): array {
    global $DB;
    $ids = [];
    $search = trim($search);

    if ($search !== '' && ctype_digit($search)) {
        $ids[(int)$search] = (int)$search;
    }

    if (pqurl_table_exists('local_prequran_student_profile') && pqurl_table_has_field('local_prequran_student_profile', 'userid')) {
        $profileparams = [];
        $profilewhere = ['sp.userid > 0'];
        if ($search !== '') {
            $like = $DB->sql_like('sp.student_display_name', ':profilesearch', false);
            $profilewhere[] = "({$like} OR sp.parent_email = :profileexact OR sp.parent_phone = :profileexact)";
            $profileparams['profilesearch'] = '%' . $DB->sql_like_escape($search) . '%';
            $profileparams['profileexact'] = $search;
        }
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT sp.userid
               FROM {local_prequran_student_profile} sp
              WHERE " . implode(' AND ', $profilewhere) . "
           ORDER BY sp.userid ASC",
            $profileparams,
            0,
            max(1, min(750, $limit * 3))
        );
        foreach ($rows as $row) {
            $ids[(int)$row->userid] = (int)$row->userid;
        }
    }

    $roleparams = [
        'coursecontext' => CONTEXT_COURSE,
        'sitecourse' => SITEID,
        'studentshortname' => 'student',
        'studentarchetype' => 'student',
    ];
    $rolewhere = [
        'u.deleted = 0',
        'c.id <> :sitecourse',
        '(r.shortname = :studentshortname OR r.archetype = :studentarchetype)',
    ];
    if ($courseid > 0) {
        $rolewhere[] = 'c.id = :courseid';
        $roleparams['courseid'] = $courseid;
    }
    if ($search !== '') {
        $like = $DB->sql_like($DB->sql_fullname('u.firstname', 'u.lastname'), ':searchname', false);
        $rolewhere[] = "(u.id = :searchid OR u.idnumber = :searchexact OR u.username = :searchexact OR u.email = :searchexact OR {$like})";
        $roleparams['searchid'] = ctype_digit($search) ? (int)$search : 0;
        $roleparams['searchexact'] = $search;
        $roleparams['searchname'] = '%' . $DB->sql_like_escape($search) . '%';
    }
    $rows = $DB->get_records_sql(
        "SELECT DISTINCT u.id
           FROM {user} u
           JOIN {context} ctx ON ctx.contextlevel = :coursecontext
           JOIN {course} c ON c.id = ctx.instanceid
           JOIN {role_assignments} ra ON ra.contextid = ctx.id AND ra.userid = u.id
           JOIN {role} r ON r.id = ra.roleid
          WHERE " . implode(' AND ', $rolewhere) . "
       ORDER BY u.id ASC",
        $roleparams,
        0,
        max(1, min(750, $limit * 3))
    );
    foreach ($rows as $row) {
        $ids[(int)$row->id] = (int)$row->id;
    }

    if ($groupid > 0 && pqurl_table_exists('local_prequran_group_member')) {
        $groupids = [];
        $rows = $DB->get_records('local_prequran_group_member', ['groupid' => $groupid, 'assignment_status' => 'active'], '', 'id, studentid', 0, max(1, min(750, $limit * 3)));
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if (isset($ids[$studentid]) || ($search === '' && $courseid <= 0)) {
                $groupids[$studentid] = $studentid;
            }
        }
        $ids = $groupids;
    }

    return array_values($ids);
}

function pqurl_candidate_users(string $search, int $courseid, int $groupid, int $limit): array {
    global $DB;

    $userids = pqurl_source_userids($search, $courseid, $groupid, $limit);
    if (!$userids) {
        return [];
    }

    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'pquruserid');
    $fullname = $DB->sql_fullname('u.firstname', 'u.lastname');
    $records = $DB->get_records_sql(
        "SELECT DISTINCT u.id, u.username, u.idnumber, u.firstname, u.lastname, u.email, u.suspended, u.lastaccess, {$fullname} AS fullname
           FROM {user} u
          WHERE u.deleted = 0
            AND u.id {$insql}
       ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
        $params,
        0,
        max(1, min(500, $limit * 3))
    );

    $out = [];
    foreach ($records as $record) {
        $userid = (int)$record->id;
        if (pqurl_is_managed_student($userid)) {
            continue;
        }
        $profile = pqurl_profile($userid);
        $out[] = [
            'userid' => $userid,
            'fullname' => (string)$record->fullname,
            'username' => (string)$record->username,
            'idnumber' => (string)$record->idnumber,
            'email' => (string)$record->email,
            'suspended' => (int)$record->suspended,
            'lastaccess' => (int)$record->lastaccess,
            'profile' => $profile,
            'courses' => pqurl_user_courses($userid),
            'groups' => pqurl_user_class_groups($userid),
        ];
        if (count($out) >= $limit) {
            break;
        }
    }
    return $out;
}
