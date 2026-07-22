<?php
// Live Practice Coach report query library — extracted VERBATIM from
// live_practice_coach.php (the pqlpc_* helpers) for the token-gated portal
// endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlpc_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqlpc_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlpc_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqlpc_has_teacher_role(int $userid): bool {
    global $DB;
    if ($userid <= 0) {
        return false;
    }
    if (pqh_has_independent_teacher_profile($userid)) {
        return true;
    }
    if (pqlpc_table_exists('local_prequran_teacher_student')
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

function pqlpc_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlpc_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : 'User ' . $userid;
}

function pqlpc_account_label(int $userid): string {
    return pqh_account_no_label($userid);
}

function pqlpc_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqlpc_session_guidance($row): array {
    $events = (int)($row->event_count ?? 0);
    $students = (int)($row->student_count ?? 0);
    $idle = (int)($row->idle_count ?? 0);
    $away = (int)($row->away_count ?? 0);
    $followups = (int)($row->teacher_followup_count ?? 0);
    if ($followups > 0 || $idle + $away >= 6) {
        return [
            'key' => 'teacher_followup',
            'teacher' => 'Review the learner activity and consider a short teacher follow-up before the next session.',
            'parent' => 'Your child received extra focus reminders during practice. The teacher can review and support the next step.',
        ];
    }
    if ($events > 0 && $students > 0) {
        return [
            'key' => 'continue_practice',
            'teacher' => 'Practice Coach support stayed within normal range. Student can continue the current lesson path.',
            'parent' => 'Practice support was provided during the session. The student can continue with the current lesson.',
        ];
    }
    return [
        'key' => 'no_coach_events',
        'teacher' => 'No Practice Coach events were recorded for this session.',
        'parent' => 'No Practice Coach support was needed or recorded for this session.',
    ];
}
