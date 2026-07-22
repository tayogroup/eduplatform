<?php
// QA-analytics query library — extracted VERBATIM from live_quality_analytics.php
// (renamed pqlqa_ -> pqlqal_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlqal_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlqal_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlqal_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlqal_ready(): bool {
    return pqlqal_table_exists('local_prequran_live_session')
        && pqlqal_table_exists('local_prequran_live_participant')
        && pqlqal_table_exists('local_prequran_live_audit')
        && pqlqal_column_exists('local_prequran_live_session', 'qa_status')
        && pqlqal_column_exists('local_prequran_live_session', 'qa_score')
        && pqlqal_column_exists('local_prequran_live_session', 'qa_checklist');
}

function pqlqal_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlqal_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqlqal_items(): array {
    return [
        'teacher_on_time' => 'Teacher joined and started on time',
        'student_safety' => 'Child safety and privacy expectations followed',
        'appropriate_interaction' => 'Teacher-student interaction was appropriate and respectful',
        'lesson_reviewed' => 'Target pre-Quran lesson was reviewed',
        'arabic_practice_quality' => 'Arabic letter or pre-Quran practice quality was strong',
        'interactive_tools' => 'Whiteboard, screen share, or class tools were used effectively',
        'student_participation' => 'Students had meaningful chances to participate',
        'parent_summary_ready' => 'Parent-visible summaries were completed',
        'recording_reviewed' => 'Recording reviewed if available',
        'technical_quality' => 'Audio/video and classroom flow were acceptable',
    ];
}

function pqlqal_decode_checklist(string $raw): array {
    $items = array_fill_keys(array_keys(pqlqal_items()), 'not_checked');
    $raw = trim($raw);
    if ($raw === '') {
        return $items;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $items;
    }
    foreach ($items as $key => $default) {
        $value = isset($decoded[$key]) ? (string)$decoded[$key] : $default;
        $items[$key] = in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true) ? $value : $default;
    }
    return $items;
}

function pqlqal_csv(string $filename, array $headers, array $rows): void {
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

function pqlqal_percent(int $part, int $whole): int {
    if ($whole <= 0) {
        return 0;
    }
    return (int)round(($part / $whole) * 100);
}

function pqlqal_url_params(array $baseparams, array $extra = []): array {
    return array_merge($baseparams, $extra);
}
