<?php
// Teacher-performance-profile query library — extracted VERBATIM from
// live_teacher_profile.php (renamed pqltp_ -> pqltpl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqltpl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqltpl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqltpl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqltpl_ready(): bool {
    return pqltpl_table_exists('local_prequran_live_session')
        && pqltpl_table_exists('local_prequran_live_participant')
        && pqltpl_table_exists('local_prequran_live_attendance')
        && pqltpl_table_exists('local_prequran_live_note')
        && pqltpl_table_exists('local_prequran_live_audit')
        && pqltpl_column_exists('local_prequran_live_session', 'qa_status')
        && pqltpl_column_exists('local_prequran_live_session', 'qa_score');
}

function pqltpl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqltpl_clean_date(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? $time : $fallback;
}

function pqltpl_short(string $value, int $max = 170): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqltpl_csv(string $filename, array $headers, array $rows): void {
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

function pqltpl_items(): array {
    return [
        'teacher_on_time' => 'Teacher started on time',
        'student_safety' => 'Student safety and privacy',
        'appropriate_interaction' => 'Appropriate interaction',
        'lesson_reviewed' => 'Lesson reviewed',
        'arabic_practice_quality' => 'Arabic practice quality',
        'interactive_tools' => 'Interactive tools used',
        'student_participation' => 'Student participation',
        'parent_summary_ready' => 'Parent summary ready',
        'recording_reviewed' => 'Recording reviewed',
        'technical_quality' => 'Technical quality',
    ];
}

function pqltpl_decode_checklist(string $raw): array {
    $items = array_fill_keys(array_keys(pqltpl_items()), 'not_checked');
    $decoded = json_decode(trim($raw), true);
    if (!is_array($decoded)) {
        return $items;
    }
    foreach ($items as $key => $default) {
        $value = isset($decoded[$key]) ? (string)$decoded[$key] : $default;
        $items[$key] = in_array($value, ['pass', 'concern', 'not_applicable', 'not_checked'], true) ? $value : $default;
    }
    return $items;
}

function pqltpl_percent(int $part, int $whole): int {
    return $whole > 0 ? (int)round(($part / $whole) * 100) : 0;
}
