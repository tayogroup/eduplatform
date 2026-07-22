<?php
// Teacher-marketplace query library — extracted VERBATIM from
// teacher_marketplace.php (renamed pqtm_ -> pqtml_) for the token-gated portal
// endpoint. Serves both the teacher-marketplace and teacher-marketplace-request
// portal handlers (teacher_marketplace_request.php defines no functions of its
// own). The legacy pages keep their inline copies and stay untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtml_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtml_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtml_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtml_ready(): bool {
    return pqtml_table_exists('local_prequran_teacher_profile')
        && pqtml_column_exists('local_prequran_teacher_profile', 'marketplace_visible')
        && pqtml_column_exists('local_prequran_teacher_profile', 'marketplace_status')
        && pqtml_column_exists('local_prequran_teacher_profile', 'vetting_status');
}

function pqtml_short(string $value, int $max = 180): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}
