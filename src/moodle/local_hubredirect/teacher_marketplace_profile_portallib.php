<?php
// Teacher-marketplace-profile query library — extracted VERBATIM from
// teacher_marketplace_profile.php (renamed pqtmp_ -> pqtmpl_) for the
// token-gated portal endpoint. The legacy page keeps its inline copies and
// stays untouched (parallel-run).
// NOTE: the legacy page is PUBLIC (no require_login at entry) — the portal
// handler uses only the read helpers; the thread/participant writers are
// carried for completeness but are not invoked by the public handler.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtmpl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtmpl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtmpl_table_exists($table)) {
        return false;
    }
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($column, $columns);
}

function pqtmpl_ready(): bool {
    return pqtmpl_table_exists('local_prequran_teacher_profile')
        && pqtmpl_table_exists('local_prequran_teacher_request')
        && pqtmpl_column_exists('local_prequran_teacher_profile', 'marketplace_visible')
        && pqtmpl_column_exists('local_prequran_teacher_profile', 'marketplace_status')
        && pqtmpl_column_exists('local_prequran_teacher_profile', 'vetting_status');
}

function pqtmpl_safe_lines(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return nl2br(s($value));
}

function pqtmpl_application($teacher): array {
    $decoded = json_decode((string)($teacher->application_json ?? ''), true);
    return is_array($decoded) ? $decoded : [];
}

function pqtmpl_public_url(array $application, string $field): string {
    $value = trim((string)($application[$field] ?? ''));
    return filter_var($value, FILTER_VALIDATE_URL) ? $value : '';
}

function pqtmpl_parent_children(int $parentid): array {
    global $DB;
    if ($parentid <= 0 || !pqtmpl_table_exists('local_prequran_comm_consent') || !pqtmpl_table_exists('local_prequran_student_profile')) {
        return [];
    }
    $children = array_values($DB->get_records_sql(
        "SELECT sp.userid, sp.student_display_name
           FROM {local_prequran_comm_consent} cc
           JOIN {local_prequran_student_profile} sp ON sp.userid = cc.studentid
          WHERE cc.guardianid = :parentid
       ORDER BY sp.student_display_name ASC",
        ['parentid' => $parentid],
        0,
        100
    ));
    return array_values(array_filter($children, static function($child): bool {
        return pqh_user_belongs_to_consumer_context((int)($child->userid ?? 0));
    }));
}

function pqtmpl_add_participant(int $threadid, int $userid, string $role, int $canreply): void {
    global $DB;
    if ($threadid <= 0 || $userid <= 0 || !pqtmpl_table_exists('local_prequran_comm_participant')) {
        return;
    }
    if ($DB->record_exists('local_prequran_comm_participant', ['threadid' => $threadid, 'userid' => $userid])) {
        return;
    }
    $now = time();
    $DB->insert_record('local_prequran_comm_participant', (object)[
        'threadid' => $threadid,
        'userid' => $userid,
        'role' => $role,
        'canreply' => $canreply,
        'lastreadmessageid' => 0,
        'muted' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqtmpl_create_message_thread(int $teacherid, int $parentid, int $studentid, string $subject, string $body): int {
    global $DB;
    if (!pqtmpl_table_exists('local_prequran_comm_thread')
        || !pqtmpl_table_exists('local_prequran_comm_participant')
        || !pqtmpl_table_exists('local_prequran_comm_message')) {
        return 0;
    }
    $now = time();
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => 'parent_teacher',
        'cohortid' => 0,
        'studentid' => $studentid > 0 ? $studentid : 0,
        'createdby' => $parentid,
        'status' => 'active',
        'subject' => $subject,
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid,
        'senderid' => $parentid,
        'studentid' => $studentid > 0 ? $studentid : 0,
        'messagekind' => 'text',
        'body' => $body,
        'templatekey' => 'teacher_marketplace_request',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqtmpl_add_participant($threadid, $parentid, 'parent', 1);
    pqtmpl_add_participant($threadid, $teacherid, 'teacher', 1);
    if (pqtmpl_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => $parentid,
            'action' => 'teacher_marketplace_request_created',
            'details' => json_encode(['teacherid' => $teacherid, 'studentid' => $studentid]),
            'timecreated' => $now,
        ]);
    }
    return $threadid;
}

function pqtmpl_child_allowed(int $studentid, array $children): bool {
    global $USER;
    if ($studentid <= 0) {
        return true;
    }
    if (!pqh_user_belongs_to_consumer_context($studentid)) {
        return false;
    }
    $allowedstudents = array_fill_keys(array_map(static function($child): int {
        return (int)$child->userid;
    }, $children), true);
    return isset($allowedstudents[$studentid]) || pqh_can_manage_academy_operations((int)$USER->id);
}
