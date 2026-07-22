<?php
// Teacher-marketplace request-queue library — extracted VERBATIM from
// teacher_marketplace_requests.php (renamed pqtmr_ -> pqtmrql_) for the
// token-gated portal endpoint. The legacy page keeps its inline copies and
// stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtmrql_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmrql_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmrql_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtmrql_ready(): bool {
    return pqtmrql_table_exists('local_prequran_teacher_request')
        && pqtmrql_table_exists('local_prequran_teacher_profile');
}

function pqtmrql_short(string $value, int $max = 180): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqtmrql_status_label(string $status): string {
    $labels = [
        'enrollment_submitted' => 'Enrollment submitted',
        'new' => 'Submitted',
        'selection_requested' => 'Selection requested',
        'academy_review' => 'Academy review',
        'teacher_contacted' => 'Teacher contacted',
        'parent_confirmed' => 'Parent confirmed',
        'matched' => 'Matched',
        'contacted' => 'Contacted',
        'shortlisted' => 'Shortlisted',
        'assigned' => 'Assigned',
        'declined' => 'Declined',
        'closed' => 'Closed',
    ];
    return $labels[$status] ?? $status;
}

function pqtmrql_user_name(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,firstname,lastname,email', IGNORE_MISSING) : null;
    return $user ? fullname($user) : ($userid > 0 ? 'User ' . $userid : 'Not selected');
}
