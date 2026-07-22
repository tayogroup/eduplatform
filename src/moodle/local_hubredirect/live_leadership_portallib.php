<?php
// Live-leadership query library — extracted VERBATIM from live_leadership.php
// (renamed pqll_ -> pqllp_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqllp_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqllp_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqllp_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqllp_ready(): bool {
    return pqllp_table_exists('local_prequran_live_session')
        && pqllp_table_exists('local_prequran_live_audit')
        && pqllp_column_exists('local_prequran_live_session', 'leadership_review_status')
        && pqllp_column_exists('local_prequran_live_session', 'qa_status')
        && pqllp_column_exists('local_prequran_live_session', 'qa_score');
}

function pqllp_clean_text(string $value, int $max = 4000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqllp_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqllp_short(string $value, int $max = 140): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqllp_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqllp_clean_due_date(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time ? $time : 0;
}

function pqllp_audit(int $sessionid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqllp_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'session',
        'targetid' => $sessionid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

function pqllp_csv(string $filename, array $headers, array $rows): void {
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
