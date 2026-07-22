<?php
// Workspace-parent query library — extracted VERBATIM from workspace_parent.php
// (renamed pqwp_ -> pqwppl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_table_exists_safe,
// pqh_user_belongs_to_consumer_context are shared helpers, not copied here).

defined('MOODLE_INTERNAL') || die();

function pqwppl_parent_children(int $parentid): array {
    global $DB;
    $ids = [];
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqh_table_exists_safe($table)) {
            foreach ($DB->get_records($table, ['guardianid' => $parentid], 'timemodified DESC', 'id,studentid') as $row) {
                $ids[(int)$row->studentid] = (int)$row->studentid;
            }
        }
    }
    if (pqh_table_exists_safe('local_prequran_comm_thread') && pqh_table_exists_safe('local_prequran_comm_participant')) {
        $rows = $DB->get_records_sql(
            "SELECT DISTINCT t.studentid
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = :parentid
                AND p.role = :role
                AND t.studentid > 0",
            ['parentid' => $parentid, 'role' => 'parent']
        );
        foreach ($rows as $row) {
            $ids[(int)$row->studentid] = (int)$row->studentid;
        }
    }
    $children = [];
    foreach (array_values(array_filter($ids)) as $id) {
        if (!pqh_user_belongs_to_consumer_context((int)$id)) {
            continue;
        }
        $user = core_user::get_user((int)$id, 'id,firstname,lastname,email,username', IGNORE_MISSING);
        $children[] = (object)[
            'id' => (int)$id,
            'name' => $user ? fullname($user) : 'Student ' . (int)$id,
            'email' => $user ? (string)$user->email : '',
        ];
    }
    usort($children, static function($a, $b): int {
        return strcasecmp((string)$a->name, (string)$b->name);
    });
    return $children;
}

function pqwppl_parent_can_access_child(int $parentid, int $studentid): bool {
    global $DB;
    if ($studentid <= 0 || $parentid <= 0) {
        return false;
    }
    if (!pqh_user_belongs_to_consumer_context($studentid)) {
        return false;
    }
    if (is_siteadmin($parentid)) {
        return true;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (pqh_table_exists_safe($table) && $DB->record_exists($table, ['guardianid' => $parentid, 'studentid' => $studentid])) {
            return true;
        }
    }
    return pqh_table_exists_safe('local_prequran_comm_thread')
        && pqh_table_exists_safe('local_prequran_comm_participant')
        && $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_thread} t
               JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
              WHERE p.userid = ?
                AND p.role = ?
                AND t.studentid = ?",
            [$parentid, 'parent', $studentid]
        );
}

function pqwppl_materials(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_mat_assign')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT a.id, a.workspaceid, a.workflow_status, a.startedat, a.completedat, a.reviewedat, a.timemodified,
                m.id AS materialid, m.title, m.material_type, m.course_key, m.description, m.source_url, w.name AS workspace_name
           FROM {local_prequran_workspace_mat_assign} a
           JOIN {local_prequran_workspace_material} m ON m.id = a.materialid
           JOIN {local_prequran_workspace} w ON w.id = a.workspaceid
          WHERE a.target_type = :targettype
            AND a.targetid = :studentid
            AND a.status = :status
            AND m.status = :materialstatus
       ORDER BY a.timemodified DESC, a.id DESC",
        ['targettype' => 'student', 'studentid' => $studentid, 'status' => 'active', 'materialstatus' => 'active'],
        0,
        40
    ));
}

function pqwppl_attendance_summary(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_attendance')) {
        return ['total' => 0, 'present' => 0, 'recent' => []];
    }
    $total = (int)$DB->count_records('local_prequran_live_attendance', ['studentid' => $studentid]);
    $present = (int)$DB->count_records_select(
        'local_prequran_live_attendance',
        "studentid = ? AND attendance_status IN ('present','late','attended')",
        [$studentid]
    );
    $recent = array_values($DB->get_records_sql(
        "SELECT a.id, a.sessionid, a.attendance_status, a.participation_status, a.join_time, a.timemodified,
                s.title, s.scheduled_start, s.teacherid
           FROM {local_prequran_live_attendance} a
      LEFT JOIN {local_prequran_live_session} s ON s.id = a.sessionid
          WHERE a.studentid = :studentid
       ORDER BY COALESCE(s.scheduled_start, a.timemodified) DESC, a.id DESC",
        ['studentid' => $studentid],
        0,
        12
    ));
    return ['total' => $total, 'present' => $present, 'recent' => $recent];
}

function pqwppl_parent_notes(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_note')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT n.id, n.sessionid, n.teacherid, n.strengths, n.needs_practice, n.homework, n.parent_summary, n.followup_status, n.timemodified,
                s.title, s.scheduled_start
           FROM {local_prequran_live_note} n
      LEFT JOIN {local_prequran_live_session} s ON s.id = n.sessionid
          WHERE n.studentid = :studentid
            AND n.visible_to_parent = 1
       ORDER BY n.timemodified DESC, n.id DESC",
        ['studentid' => $studentid],
        0,
        12
    ));
}

function pqwppl_recordings(int $studentid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_recording')
        || !pqh_table_exists_safe('local_prequran_live_participant')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT r.id, r.sessionid, r.name, r.playback_url, r.playback_format, r.duration_minutes,
                r.published, r.visible_to_parent, r.status, r.expiresat, r.timemodified,
                s.title, s.scheduled_start, s.teacherid
           FROM {local_prequran_live_recording} r
           JOIN {local_prequran_live_session} s ON s.id = r.sessionid
           JOIN {local_prequran_live_participant} p ON p.sessionid = r.sessionid
          WHERE p.studentid = :studentid
            AND p.status = :participantstatus
            AND r.published = 1
            AND r.visible_to_parent = 1
            AND r.status = :recordstatus
            AND r.playback_url <> ''
            AND (r.expiresat = 0 OR r.expiresat > :now)
       ORDER BY COALESCE(s.scheduled_start, r.timemodified) DESC, r.id DESC",
        ['studentid' => $studentid, 'participantstatus' => 'active', 'recordstatus' => 'available', 'now' => time()],
        0,
        12
    ));
}

function pqwppl_status_label(string $status): string {
    $labels = [
        'assigned' => 'Assigned',
        'in_progress' => 'In progress',
        'completed' => 'Completed',
        'reviewed' => 'Reviewed',
    ];
    return $labels[$status] ?? 'Assigned';
}
