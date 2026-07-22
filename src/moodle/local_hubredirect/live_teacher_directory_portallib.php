<?php
// Teacher directory query library — extracted VERBATIM from
// live_teacher_directory.php (renamed pqltd_ -> pqltdl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqltdl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltdl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqltdl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqltdl_ready(): bool {
    return pqltdl_table_exists('local_prequran_live_session')
        && pqltdl_table_exists('local_prequran_live_participant');
}

function pqltdl_user_name(stdClass $row): string {
    $name = trim(fullname((object)[
        'firstname' => (string)($row->firstname ?? ''),
        'lastname' => (string)($row->lastname ?? ''),
        'firstnamephonetic' => '',
        'lastnamephonetic' => '',
        'middlename' => '',
        'alternatename' => '',
    ]));
    return $name !== '' ? $name : 'Teacher ' . (int)$row->teacherid;
}

function pqltdl_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqltdl_percent(int $part, int $whole): int {
    return $whole > 0 ? (int)round(($part / $whole) * 100) : 0;
}

function pqltdl_csv(string $filename, array $headers, array $rows): void {
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

function pqltdl_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}
