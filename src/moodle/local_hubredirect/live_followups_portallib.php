<?php
// Live-followups query library — extracted VERBATIM from live_followups.php
// (renamed pqlf_ -> pqlfl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* at runtime).

defined('MOODLE_INTERNAL') || die();

function pqlfl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlfl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlfl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlfl_is_teacher(int $userid): bool {
    global $DB;
    if (is_siteadmin($userid)) {
        return true;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (pqlfl_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'status' => 'active'])) {
        return true;
    }
    if (pqlfl_table_exists('local_prequran_live_session')
        && $DB->record_exists_select('local_prequran_live_session', 'teacherid = :teacherid AND status <> :cancelled', [
            'teacherid' => $userid,
            'cancelled' => 'cancelled',
        ])) {
        return true;
    }
    if (pqlfl_table_exists('local_prequran_live_participant')
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

function pqlfl_ready(): bool {
    return pqlfl_table_exists('local_prequran_live_session')
        && pqlfl_table_exists('local_prequran_live_note')
        && pqlfl_table_exists('local_prequran_live_audit')
        && pqlfl_column_exists('local_prequran_live_note', 'followup_status')
        && pqlfl_column_exists('local_prequran_live_note', 'followup_resolved');
}

function pqlfl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlfl_clean_text(string $value, int $max = 1200): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlfl_short(string $value, int $max = 150): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlfl_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlfl_audit(int $sessionid, string $action, string $targettype, int $targetid, array $details = []): void {
    global $DB, $USER;
    if (!pqlfl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqlfl_can_manage_note($note, $session): bool {
    global $USER;
    return is_siteadmin($USER) || (int)$session->teacherid === (int)$USER->id;
}

function pqlfl_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlfl_timeline(int $sessionid, int $studentid, int $noteid): array {
    global $DB;
    if (!pqlfl_table_exists('local_prequran_live_audit')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT id, actorid, action, targettype, targetid, details, timecreated
           FROM {local_prequran_live_audit}
          WHERE sessionid = :sessionid
            AND (
                action LIKE :followup
                OR action IN (:parentack, :homeworkdone, :needshelp)
            )
            AND (targetid = :studentid OR targetid = :noteid OR targetid = 0)
       ORDER BY timecreated DESC, id DESC",
        [
            'sessionid' => $sessionid,
            'followup' => '%followup%',
            'parentack' => 'followup_parent_acknowledged',
            'homeworkdone' => 'followup_homework_completed',
            'needshelp' => 'followup_parent_needs_help',
            'studentid' => $studentid,
            'noteid' => $noteid,
        ],
        0,
        5
    ));
}
