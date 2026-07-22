<?php
// Live-operations query library — extracted VERBATIM from live_ops.php
// (renamed pqlo_ -> pqlopl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlopl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlopl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlopl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlopl_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlopl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlopl_short(string $value, int $max = 130): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlopl_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlopl_ready(): bool {
    return pqlopl_table_exists('local_prequran_live_session')
        && pqlopl_table_exists('local_prequran_live_participant')
        && pqlopl_table_exists('local_prequran_live_attendance')
        && pqlopl_table_exists('local_prequran_live_note')
        && pqlopl_table_exists('local_prequran_live_recording')
        && pqlopl_table_exists('local_prequran_live_audit');
}
