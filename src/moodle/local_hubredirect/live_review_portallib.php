<?php
// Live-review helper library — extracted VERBATIM from live_review.php
// (renamed pqlr_ -> pqlrvl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* calls).
// Not extracted: pqlr_redirect() — a page-flow redirect() helper that has no
// meaning under the JSON endpoint (the handler answers JSON instead).

defined('MOODLE_INTERNAL') || die();

function pqlrvl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlrvl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqlrvl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqlrvl_is_teacher_or_admin($session): bool {
    global $USER;
    if (pqh_can_manage_academy_operations((int)$USER->id)) {
        return true;
    }
    if (pqlrvl_column_exists('local_prequran_live_session', 'workspaceid')
        && (int)($session->workspaceid ?? 0) > 0
        && pqh_user_can_manage_workspace((int)$USER->id, (int)$session->workspaceid)) {
        return true;
    }
    return (int)$session->teacherid === (int)$USER->id;
}

function pqlrvl_clean_text(string $value, int $max = 3000): string {
    $value = trim($value);
    if (core_text::strlen($value) > $max) {
        $value = core_text::substr($value, 0, $max);
    }
    return clean_param($value, PARAM_TEXT);
}

function pqlrvl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlrvl_table_exists('local_prequran_live_audit')) {
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

function pqlrvl_public_feedback_complete($note): bool {
    if (!$note || empty($note->visible_to_parent)) {
        return false;
    }
    $public = trim(implode(' ', [
        (string)($note->strengths ?? ''),
        (string)($note->needs_practice ?? ''),
        (string)($note->homework ?? ''),
        (string)($note->parent_summary ?? ''),
    ]));
    return $public !== '';
}

function pqlrvl_completion_state(int $sessionid, array $students): array {
    global $DB;
    $active = count($students);
    $attendancecomplete = 0;
    $summarycomplete = 0;
    $missing = [];
    foreach ($students as $participant) {
        $studentid = (int)($participant->studentid ?: $participant->userid);
        $name = (string)$participant->displayname;
        $user = $studentid > 0 ? core_user::get_user($studentid) : null;
        if ($user) {
            $name = fullname($user);
        }
        $att = $DB->get_record('local_prequran_live_attendance', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
        if ($att && (string)$att->attendance_status !== '') {
            $attendancecomplete++;
        } else {
            $missing[] = $name . ': attendance not marked';
        }
        $note = $DB->get_record('local_prequran_live_note', ['sessionid' => $sessionid, 'studentid' => $studentid], '*', IGNORE_MISSING);
        if (pqlrvl_public_feedback_complete($note)) {
            $summarycomplete++;
        } else {
            $missing[] = $name . ': parent summary not ready';
        }
    }
    return [
        'active' => $active,
        'attendance' => $attendancecomplete,
        'summaries' => $summarycomplete,
        'complete' => $active > 0 && $attendancecomplete >= $active && $summarycomplete >= $active,
        'missing' => $missing,
    ];
}
