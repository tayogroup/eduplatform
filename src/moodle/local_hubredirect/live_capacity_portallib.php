<?php
// Teacher capacity query library — extracted VERBATIM from live_capacity.php
// (renamed pqlcap_ -> pqlcapl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlcapl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlcapl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlcapl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlcapl_ready(): bool {
    return pqlcapl_table_exists('local_prequran_live_session')
        && pqlcapl_table_exists('local_prequran_live_participant');
}

function pqlcapl_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlcapl_minutes(string $time): int {
    if (!preg_match('/^([0-2]?[0-9]):([0-5][0-9])$/', trim($time), $matches)) {
        return -1;
    }
    $hour = min(23, (int)$matches[1]);
    return ($hour * 60) + (int)$matches[2];
}

function pqlcapl_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : 'Teacher ' . $userid;
}

function pqlcapl_percent(float $part, float $whole): int {
    return $whole > 0 ? (int)round(($part / $whole) * 100) : 0;
}

function pqlcapl_csv(string $filename, array $headers, array $rows): void {
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

function pqlcapl_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}

function pqlcapl_week_start(int $date): int {
    $midnight = usergetmidnight($date);
    $weekday = (int)date('N', $midnight);
    return $midnight - (($weekday - 1) * DAYSECS);
}
