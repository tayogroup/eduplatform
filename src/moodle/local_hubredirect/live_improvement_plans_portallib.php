<?php
// Teacher-improvement-plan query library — extracted VERBATIM from
// live_improvement_plans.php (renamed pqlip_ -> pqlipl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlipl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlipl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlipl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlipl_ready(): bool {
    return pqlipl_table_exists('local_prequran_live_session')
        && pqlipl_table_exists('local_prequran_live_audit')
        && pqlipl_column_exists('local_prequran_live_session', 'improvement_plan_status')
        && pqlipl_column_exists('local_prequran_live_session', 'qa_status')
        && pqlipl_column_exists('local_prequran_live_session', 'leadership_review_status');
}

function pqlipl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlipl_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlipl_short(string $value, int $max = 170): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlipl_csv(string $filename, array $headers, array $rows): void {
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

function pqlipl_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}
