<?php
// Marketplace-enrollment query library — extracted VERBATIM from
// marketplace_enrollment.php (the pqme_* helpers defined at the top of that
// page) for the token-gated portal endpoint. The legacy page keeps its inline
// copies and stays untouched (parallel-run). Every function here is page-defined
// and grep-confirmed unique to the pqme_ prefix; no shared accesslib helper is
// copied. Consumer context and teacher-profile-URL resolution stay in
// accesslib.php (pqh_requested_consumer_context / pqh_teacher_public_profile_url).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqme_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqme_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqme_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqme_text(string $name, string $default = '', int $limit = 1000): string {
    return core_text::substr(trim(optional_param($name, $default, PARAM_TEXT)), 0, $limit);
}

function pqme_contact_valid(string $contact): bool {
    if (validate_email($contact)) {
        return true;
    }
    $digits = preg_replace('/\D+/', '', $contact);
    return core_text::strlen((string)$digits) >= 7 && core_text::strlen((string)$digits) <= 20;
}

function pqme_parent_children(int $parentid): array {
    global $DB;
    if ($parentid <= 0 || !pqme_table_exists('local_prequran_comm_consent') || !pqme_table_exists('local_prequran_student_profile')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT sp.userid, sp.student_display_name
           FROM {local_prequran_comm_consent} cc
           JOIN {local_prequran_student_profile} sp ON sp.userid = cc.studentid
          WHERE cc.guardianid = :parentid
       ORDER BY sp.student_display_name ASC",
        ['parentid' => $parentid],
        0,
        100
    ));
}

function pqme_add_participant(int $threadid, int $userid, string $role): void {
    global $DB;
    if ($threadid <= 0 || $userid <= 0 || !pqme_table_exists('local_prequran_comm_participant')) {
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
        'canreply' => 1,
        'lastreadmessageid' => 0,
        'muted' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqme_create_thread(int $requesterid, int $teacherid, int $studentid, string $teachername, string $body): int {
    global $DB;
    if ($requesterid <= 0 || !pqme_table_exists('local_prequran_comm_thread')
            || !pqme_table_exists('local_prequran_comm_participant')
            || !pqme_table_exists('local_prequran_comm_message')) {
        return 0;
    }
    $now = time();
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => 'parent_teacher',
        'cohortid' => 0,
        'studentid' => max(0, $studentid),
        'createdby' => $requesterid,
        'status' => 'active',
        'subject' => 'Marketplace enrollment for ' . $teachername,
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid,
        'senderid' => $requesterid,
        'studentid' => max(0, $studentid),
        'messagekind' => 'text',
        'body' => $body,
        'templatekey' => 'marketplace_enrollment',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    pqme_add_participant($threadid, $requesterid, 'parent');
    pqme_add_participant($threadid, $teacherid, 'teacher');
    if (pqme_table_exists('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => $requesterid,
            'action' => 'marketplace_enrollment_submitted',
            'details' => json_encode(['teacherid' => $teacherid, 'studentid' => $studentid]),
            'timecreated' => $now,
        ]);
    }
    return $threadid;
}

function pqme_option(string $value, string $current, string $label): string {
    return '<option value="' . s($value) . '"' . ($value === $current ? ' selected' : '') . '>' . s($label) . '</option>';
}
