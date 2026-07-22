<?php
// Dashboard role + teacher-live-overview library — extracted VERBATIM from
// dashboard.php (original function names preserved) for the token-gated portal
// endpoint. The whole body is guarded so it is a no-op if dashboard.php (which
// keeps its own inline copies) has already been loaded in the same request.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

if (!function_exists('pqh_user_role')):

function pqh_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqh_table_has_field(string $table, string $field): bool {
    global $DB;
    $dbman = $DB->get_manager();
    $xtable = new xmldb_table($table);
    if (!$dbman->table_exists($xtable)) {
        return false;
    }
    if ($dbman->field_exists($xtable, new xmldb_field($field))) {
        return true;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}
function pqh_is_managed_student(int $userid): bool {
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

function pqh_is_student_account(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_is_managed_student($userid)) {
        return true;
    }
    if (pqh_table_exists('local_prequran_student_profile')
        && $DB->record_exists('local_prequran_student_profile', ['userid' => $userid])) {
        return true;
    }

    $user = core_user::get_user($userid, 'id,username,email,idnumber,deleted', IGNORE_MISSING);
    if (!$user || !empty($user->deleted)) {
        return false;
    }

    $idnumber = strtoupper(trim((string)($user->idnumber ?? '')));
    if ($idnumber !== '' && preg_match('/^(EA-)?STU[-_]/', $idnumber)) {
        return true;
    }

    $username = strtolower(trim((string)($user->username ?? '')));
    if ($username !== '' && preg_match('/(^|[._-])student([._-]|$)/', $username)) {
        return true;
    }

    $email = strtolower(trim((string)($user->email ?? '')));
    return $email !== '' && preg_match('/(^|[._-])student[0-9._-]*@/', $email);
}

function pqh_has_academy_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_class_group')
        && $DB->record_exists_select('local_prequran_class_group', 'teacherid = ? AND status <> ?', [$userid, 'archived'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = ? AND status <> ?', [$userid, 'cancelled'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_live_participant')
        && $DB->record_exists('local_prequran_live_participant', ['userid' => $userid, 'role' => 'teacher', 'status' => 'active'])) {
        return true;
    }
    // Institution workspaces: an active workspace membership with a
    // teaching role makes someone a teacher even before any students,
    // groups, or sessions are assigned.
    if (pqh_table_exists('local_prequran_workspace_member')
        && $DB->record_exists_select(
            'local_prequran_workspace_member',
            "userid = ? AND status = 'active' AND workspace_role IN ('teacher', 'assistant_teacher')",
            [$userid]
        )) {
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

function pqh_has_marketplace_teacher_profile(int $userid): bool {
    global $DB;
    if ($userid <= 0 || !pqh_table_exists('local_prequran_teacher_profile')) {
        return false;
    }
    return $DB->record_exists_select(
        'local_prequran_teacher_profile',
        'userid = ? AND LOWER(status) NOT IN (?, ?, ?)',
        [$userid, 'archived', 'inactive', 'rejected']
    );
}

function pqh_has_marketplace_only_teacher_profile(int $userid): bool {
    $models = pqh_active_teacher_profile_models($userid);
    return in_array('marketplace_teacher', $models, true) && !in_array('independent_teacher', $models, true);
}

function pqh_has_teacher_role(int $userid): bool {
    return pqh_has_academy_teacher_role($userid) || pqh_has_marketplace_teacher_profile($userid);
}

function pqh_has_parent_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_table_exists('local_prequran_comm_participant')
        && $DB->record_exists('local_prequran_comm_participant', ['userid' => $userid, 'role' => 'parent'])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid])) {
        return true;
    }
    if (pqh_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid])) {
        return true;
    }
    return false;
}

function pqh_has_referrer_role(int $userid): bool {
    global $DB;
    if ($userid <= 0 || !pqh_table_exists('local_prequran_referrer')) {
        return false;
    }
    return $DB->record_exists_select(
        'local_prequran_referrer',
        'userid = ? AND LOWER(status) NOT IN (?, ?, ?)',
        [$userid, 'archived', 'inactive', 'blocked']
    );
}

function pqh_has_sqa_tester_role(int $userid): bool {
    return pqh_is_sqa_tester($userid);
}

function pqh_user_role(int $userid): string {
    if (is_siteadmin($userid)) {
        return 'admin';
    }
    if (pqh_is_school_principal($userid)) {
        return 'school_principal';
    }
    if (pqh_has_sqa_tester_role($userid)) {
        return 'sqa_tester';
    }
    if (pqh_has_teacher_role($userid)) {
        return 'teacher';
    }
    if (pqh_has_parent_role($userid)) {
        return 'parent';
    }
    if (pqh_has_referrer_role($userid)) {
        return 'referrer';
    }
    if (pqh_is_student_account($userid)) {
        return 'student';
    }
    return 'parent';
}
function pqh_teacher_live_session_rows(int $teacherid, int $fromtime, int $totime, int $limit = 20, int $workspaceid = 0): array {
    global $DB;

    if ($teacherid <= 0 || !pqh_table_exists('local_prequran_live_session')) {
        return [];
    }

    $workspacewhere = $workspaceid > 0 && pqh_table_has_field('local_prequran_live_session', 'workspaceid')
        ? ' AND s.workspaceid = :workspaceid'
        : '';
    $workspaceparams = $workspacewhere !== '' ? ['workspaceid' => $workspaceid] : [];
    $studentcountselect = pqh_table_exists('local_prequran_live_participant')
        ? "(SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active')"
        : "0";

    return array_values($DB->get_records_sql(
        "SELECT s.*, {$studentcountselect} AS student_count
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

function pqh_teacher_live_review_rows(int $teacherid, int $fromtime, int $totime, int $workspaceid = 0): array {
    global $DB;

    if ($teacherid <= 0
        || !pqh_table_exists('local_prequran_live_session')
        || !pqh_table_exists('local_prequran_live_participant')
        || !pqh_table_exists('local_prequran_live_attendance')
        || !pqh_table_exists('local_prequran_live_note')) {
        return [];
    }

    $workspacewhere = $workspaceid > 0 && pqh_table_has_field('local_prequran_live_session', 'workspaceid')
        ? ' AND s.workspaceid = :workspaceid'
        : '';
    $workspaceparams = $workspacewhere !== '' ? ['workspaceid' => $workspaceid] : [];

    return array_values($DB->get_records_sql(
        "SELECT s.*,
                (SELECT COUNT(1) FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.role = 'student' AND p.status = 'active') AS student_count,
                (SELECT COUNT(1) FROM {local_prequran_live_attendance} a WHERE a.sessionid = s.id) AS attendance_count,
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
        12
    ));
}

function pqh_teacher_live_overview(int $teacherid, int $workspaceid = 0): array {
    global $DB;

    $overview = [
        'ready' => false,
        'metrics' => [
            'today' => 0,
            'upcoming' => 0,
            'needsreview' => 0,
            'followups' => 0,
            'coaching' => 0,
            'improvementplans' => 0,
            'studentsweek' => 0,
        ],
        'today' => [],
        'upcoming' => [],
        'needsreview' => [],
        'followups' => [],
        'coaching' => [],
        'improvementplans' => [],
        'recentcompleted' => [],
    ];

    if ($teacherid <= 0 || !pqh_table_exists('local_prequran_live_session')) {
        return $overview;
    }

    $overview['ready'] = true;
    $now = time();
    $todaystart = usergetmidnight($now);
    $todayend = $todaystart + DAYSECS;
    $workspacewhere = $workspaceid > 0 && pqh_table_has_field('local_prequran_live_session', 'workspaceid')
        ? ' AND s.workspaceid = :workspaceid'
        : '';
    $workspaceplainwhere = $workspaceid > 0 && pqh_table_has_field('local_prequran_live_session', 'workspaceid')
        ? ' AND workspaceid = :workspaceid'
        : '';
    $workspaceparams = $workspacewhere !== '' ? ['workspaceid' => $workspaceid] : [];
    $workspaceplainparams = $workspaceplainwhere !== '' ? ['workspaceid' => $workspaceid] : [];

    $overview['metrics']['today'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND scheduled_start >= :starttime
            AND scheduled_start < :endtime
            AND status <> :cancelled
            {$workspaceplainwhere}",
        $workspaceplainparams + ['teacherid' => $teacherid, 'starttime' => $todaystart, 'endtime' => $todayend, 'cancelled' => 'cancelled']
    );
    $overview['metrics']['upcoming'] = (int)$DB->count_records_sql(
        "SELECT COUNT(1) FROM {local_prequran_live_session}
          WHERE teacherid = :teacherid
            AND scheduled_start >= :nowtime
            AND scheduled_start < :untiltime
            AND status <> :cancelled
            {$workspaceplainwhere}",
        $workspaceplainparams + ['teacherid' => $teacherid, 'nowtime' => $now, 'untiltime' => $now + (7 * DAYSECS), 'cancelled' => 'cancelled']
    );
    if (pqh_table_exists('local_prequran_live_participant')) {
        $overview['metrics']['studentsweek'] = (int)$DB->count_records_sql(
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
    }

    $overview['today'] = pqh_teacher_live_session_rows($teacherid, $todaystart, $todayend, 20, $workspaceid);
    $overview['upcoming'] = pqh_teacher_live_session_rows($teacherid, $now, $now + (7 * DAYSECS), 20, $workspaceid);
    $overview['needsreview'] = pqh_teacher_live_review_rows($teacherid, $now - (14 * DAYSECS), $now, $workspaceid);
    $overview['metrics']['needsreview'] = count($overview['needsreview']);
    $recentcompleted = pqh_teacher_live_session_rows($teacherid, $now - (14 * DAYSECS), $now, 12, $workspaceid);
    usort($recentcompleted, function($a, $b) {
        return (int)$b->scheduled_start <=> (int)$a->scheduled_start;
    });
    $overview['recentcompleted'] = array_values(array_filter($recentcompleted, function($session) {
        return (string)$session->status === 'completed';
    }));

    if (pqh_table_exists('local_prequran_live_note')
            && pqh_table_has_field('local_prequran_live_note', 'followup_status')
            && pqh_table_has_field('local_prequran_live_note', 'followup_resolved')) {
        $notestudentselect = pqh_table_has_field('local_prequran_live_note', 'studentid') ? 'n.studentid' : '0 AS studentid';
        $overview['followups'] = array_values($DB->get_records_sql(
            "SELECT n.id, {$notestudentselect}, n.followup_status, n.timemodified,
                    s.title AS session_title, s.scheduled_start
               FROM {local_prequran_live_note} n
               JOIN {local_prequran_live_session} s ON s.id = n.sessionid
              WHERE s.teacherid = :teacherid
                {$workspacewhere}
                AND n.followup_status <> :none
                AND n.followup_resolved = 0
           ORDER BY n.timemodified DESC",
            $workspaceparams + ['teacherid' => $teacherid, 'none' => 'none'],
            0,
            8
        ));
        $overview['metrics']['followups'] = count($overview['followups']);
    }

    if (pqh_table_has_field('local_prequran_live_session', 'qa_coaching_status')) {
        $overview['coaching'] = array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND qa_coaching_status IN ('assigned', 'acknowledged')
                {$workspaceplainwhere}
           ORDER BY scheduled_start DESC, id DESC",
            $workspaceplainparams + ['teacherid' => $teacherid],
            0,
            8
        ));
        $overview['metrics']['coaching'] = count($overview['coaching']);
    }

    if (pqh_table_has_field('local_prequran_live_session', 'improvement_plan_status')) {
        $overview['improvementplans'] = array_values($DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_live_session}
              WHERE teacherid = :teacherid
                AND improvement_plan_status IN ('assigned', 'in_progress')
                {$workspaceplainwhere}
           ORDER BY scheduled_start DESC, id DESC",
            $workspaceplainparams + ['teacherid' => $teacherid],
            0,
            8
        ));
        $overview['metrics']['improvementplans'] = count($overview['improvementplans']);
    }

    return $overview;
}

endif;
