<?php
// Parent-trust-audit query library — extracted VERBATIM from
// live_parent_trust_audit.php (prefix pqlpta_, grep-confirmed unique to that
// page) for the token-gated portal endpoint. The legacy page keeps its inline
// copies and stays untouched (parallel-run). Only page-defined functions are
// copied here; shared pqh_/core helpers are called at runtime, not duplicated.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlpta_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlpta_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlpta_short(string $value, int $max = 160): string {
    $value = trim($value);
    if (core_text::strlen($value) <= $max) {
        return $value;
    }
    return core_text::substr($value, 0, $max) . '...';
}

function pqlpta_date_start(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time === false ? $fallback : $time;
}

function pqlpta_date_end(string $value, int $fallback): int {
    $value = trim($value);
    if ($value === '') {
        return $fallback;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time === false ? $fallback : $time;
}

function pqlpta_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlpta_support_reason_options(): array {
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

function pqlpta_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlpta_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => $sessionid,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => $targettype,
        'targetid' => $targetid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}
