<?php
// Live-quality query library — extracted VERBATIM from live_quality.php
// (renamed pqlq_ -> pqlql_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlql_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlql_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlql_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlql_required_ready(): bool {
    return pqlql_table_exists('local_prequran_live_session')
        && pqlql_table_exists('local_prequran_live_participant')
        && pqlql_table_exists('local_prequran_live_attendance')
        && pqlql_table_exists('local_prequran_live_note')
        && pqlql_table_exists('local_prequran_live_recording')
        && pqlql_table_exists('local_prequran_live_audit')
        && pqlql_column_exists('local_prequran_live_session', 'qa_status')
        && pqlql_column_exists('local_prequran_live_session', 'qa_checklist');
}

function pqlql_clean_text(string $value, int $max = 3000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlql_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlql_audit(int $sessionid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqlql_table_exists('local_prequran_live_audit')) {
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

function pqlql_items(): array {
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

function pqlql_decode_checklist($session): array {
    $items = array_fill_keys(array_keys(pqlql_items()), 'not_checked');
    $raw = trim((string)($session->qa_checklist ?? ''));
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

function pqlql_score(array $checklist): int {
    $scored = 0;
    $passed = 0;
    foreach ($checklist as $value) {
        if ($value === 'not_applicable') {
            continue;
        }
        $scored++;
        if ($value === 'pass') {
            $passed++;
        }
    }
    if ($scored === 0) {
        return 0;
    }
    return (int)round(($passed / $scored) * 100);
}
