<?php
// Live-recordings query library — extracted VERBATIM from live_recordings.php
// (renamed pqlrp_ -> pqlrpl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (shared pqh_* helpers),
// and user/profile/lib.php for pqlrpl_is_managed_student().
//
// NOT extracted: pqlrp_url (moodle_url page-link builder — the portal page
// builds its own links and the JSON handler renders no Moodle URLs).

defined('MOODLE_INTERNAL') || die();

function pqlrpl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlrpl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    if (pqlrpl_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $parentid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlrpl_table_exists('local_prequran_comm_participant') && pqlrpl_table_exists('local_prequran_comm_thread')) {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
    }
    return false;
}

function pqlrpl_parent_children(int $parentid): array {
    global $DB;
    $children = [];
    if (pqlrpl_table_exists('local_prequran_comm_consent')) {
        $rows = $DB->get_records('local_prequran_comm_consent', ['guardianid' => $parentid], 'timemodified DESC');
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    if (pqlrpl_table_exists('local_prequran_comm_participant') && pqlrpl_table_exists('local_prequran_comm_thread')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT t.studentid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid IS NOT NULL",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $studentid = (int)$row->studentid;
            if ($studentid > 0) {
                $children[$studentid] = $studentid;
            }
        }
    }
    return pqlrpl_enrich_children(array_values($children));
}

function pqlrpl_is_managed_student(int $userid): bool {
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

function pqlrpl_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqlrpl_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
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

function pqlrpl_teacher_can_access_student(int $teacherid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $teacherid <= 0 || $teacherid === $studentid) {
        return false;
    }
    if (pqlrpl_table_exists('local_prequran_teacher_student')) {
        $explicitcount = (int)$DB->count_records('local_prequran_teacher_student', ['teacherid' => $teacherid, 'status' => 'active']);
        if ($explicitcount > 0) {
            return $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $teacherid, 'studentid' => $studentid, 'status' => 'active']);
        }
    }
    if (!pqlrpl_has_teacher_role($teacherid) || !pqlrpl_is_managed_student($studentid)) {
        return false;
    }
    return $DB->record_exists_sql(
        "SELECT 1
           FROM {cohort_members} teacher_cm
           JOIN {cohort_members} student_cm ON student_cm.cohortid = teacher_cm.cohortid
          WHERE teacher_cm.userid = ?
            AND student_cm.userid = ?",
        [$teacherid, $studentid]
    );
}

function pqlrpl_enrich_children(array $studentids): array {
    $children = [];
    foreach (array_unique(array_filter(array_map('intval', $studentids))) as $studentid) {
        $user = core_user::get_user($studentid);
        $children[] = ['studentid' => $studentid, 'name' => $user ? fullname($user) : 'Student ' . $studentid];
    }
    usort($children, function($a, $b) {
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });
    return $children;
}

function pqlrpl_user_can_access_child(int $userid, int $studentid): bool {
    if (is_siteadmin($userid) || $userid === $studentid) {
        return true;
    }
    return pqlrpl_parent_can_access_child($userid, $studentid) || pqlrpl_teacher_can_access_student($userid, $studentid);
}

function pqlrpl_visible_recordings(int $studentid): array {
    global $DB;
    if (!pqlrpl_table_exists('local_prequran_live_recording')
        || !pqlrpl_table_exists('local_prequran_live_session')
        || !pqlrpl_table_exists('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT r.*,
                s.title AS session_title,
                s.teacherid,
                s.scheduled_start,
                s.lessonid,
                s.unitid
           FROM {local_prequran_live_recording} r
           JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           JOIN {local_prequran_live_participant} p ON p.sessionid = s.id
          WHERE p.studentid = :studentid
            AND p.role = :role
            AND p.status = :participantstatus
            AND r.visible_to_parent = 1
            AND r.status = :recordingstatus
            AND (r.expiresat = 0 OR r.expiresat > :now)
       ORDER BY s.scheduled_start DESC, r.id DESC",
        ['studentid' => $studentid, 'role' => 'student', 'participantstatus' => 'active', 'recordingstatus' => 'available', 'now' => time()]
    ));
}
