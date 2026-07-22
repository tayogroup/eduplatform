<?php
// Review-pack query library — the page-defined helpers of
// local_hubredirect/live_parent_trust_review_pack.php extracted VERBATIM
// (renamed pqlptrp_ -> pqlptrpl_) for the token-gated portal endpoint. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlptrpl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptrpl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlptrpl_date_start(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time === false ? $fallback : $time;
}

function pqlptrpl_date_end(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time === false ? $fallback : $time;
}

function pqlptrpl_reason_options(): array {
    return [
        '' => 'All reasons',
        'parent_support_request' => 'Parent support request',
        'scheduling_issue' => 'Scheduling issue',
        'recording_summary_question' => 'Recording or summary question',
        'technical_support' => 'Technical support',
        'safety_privacy_review' => 'Safety/privacy review',
        'other' => 'Other',
    ];
}

function pqlptrpl_short(string $value, int $max = 220): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}
