<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

function pqops_ready(): bool {
    return pqh_table_exists_safe('local_prequran_teacher_contract')
        && pqh_table_exists_safe('local_prequran_sub_request')
        && pqh_table_exists_safe('local_prequran_comm_campaign')
        && pqh_table_exists_safe('local_prequran_comm_case');
}

function pqops_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqops_time_from_date(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 00:00:00');
    return $time ? (int)$time : 0;
}

function pqops_datetime_from_parts(string $date, string $time): int {
    $value = trim($date) . ' ' . trim($time);
    $stamp = strtotime($value);
    return $stamp ? (int)$stamp : 0;
}

function pqops_workspace_users(int $workspaceid, string $role): array {
    global $DB;
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.workspace_role = :role
            AND wm.status = :status
       ORDER BY u.lastname ASC, u.firstname ASC",
        ['workspaceid' => $workspaceid, 'role' => $role, 'status' => 'active']
    ));
}

function pqops_recalculate_teacher_load(int $workspaceid, int $teacherid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_teacher_load')) {
        return 0;
    }
    $students = 0;
    if (pqh_table_exists_safe('local_prequran_teacher_student')) {
        $students = (int)$DB->count_records('local_prequran_teacher_student', [
            'workspaceid' => $workspaceid,
            'teacherid' => $teacherid,
            'status' => 'active',
        ]);
    }
    $weekstart = strtotime('monday this week') ?: (time() - WEEKSECS);
    $weekend = $weekstart + WEEKSECS;
    $sessions = 0;
    $minutes = 0;
    if (pqh_table_exists_safe('local_prequran_live_session')) {
        $rows = $DB->get_records_sql(
            "SELECT id, scheduled_start, scheduled_end
               FROM {local_prequran_live_session}
              WHERE workspaceid = :workspaceid
                AND teacherid = :teacherid
                AND scheduled_start >= :weekstart
                AND scheduled_start < :weekend
                AND status <> :cancelled",
            ['workspaceid' => $workspaceid, 'teacherid' => $teacherid, 'weekstart' => $weekstart, 'weekend' => $weekend, 'cancelled' => 'cancelled']
        );
        $sessions = count($rows);
        foreach ($rows as $row) {
            $minutes += max(0, (int)round(((int)$row->scheduled_end - (int)$row->scheduled_start) / 60));
        }
    }
    $status = $minutes > 1200 || $students > 30 ? 'overloaded' : ($minutes < 120 && $students < 3 ? 'light' : 'normal');
    $now = time();
    return (int)$DB->insert_record('local_prequran_teacher_load', (object)[
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'active_students' => $students,
        'weekly_sessions' => $sessions,
        'weekly_minutes' => $minutes,
        'load_status' => $status,
        'notes' => '',
        'calculatedat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
}

function pqops_queue_session_reminders(int $workspaceid, int $sessionid, int $offsetminutes, string $channel = 'email'): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_live_reminder') || !pqh_table_exists_safe('local_prequran_live_session')) {
        return 0;
    }
    $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING);
    if (!$session) {
        return 0;
    }
    $recipients = [];
    if ((int)$session->teacherid > 0) {
        $recipients[(int)$session->teacherid] = 'teacher';
    }
    if (pqh_table_exists_safe('local_prequran_live_participant')) {
        $parts = $DB->get_records('local_prequran_live_participant', ['sessionid' => $sessionid, 'status' => 'active']);
        foreach ($parts as $part) {
            $recipients[(int)$part->userid] = (string)$part->role;
        }
    }
    $sendat = max(time(), (int)$session->scheduled_start - ($offsetminutes * 60));
    $created = 0;
    $now = time();
    foreach ($recipients as $userid => $role) {
        if ($userid <= 0) {
            continue;
        }
        $DB->insert_record('local_prequran_live_reminder', (object)[
            'workspaceid' => $workspaceid,
            'sessionid' => $sessionid,
            'recipientid' => $userid,
            'recipient_role' => core_text::substr($role, 0, 40),
            'channel' => $channel,
            'sendat' => $sendat,
            'status' => 'queued',
            'payloadjson' => pqops_json(['title' => (string)$session->title, 'scheduled_start' => (int)$session->scheduled_start]),
            'sentat' => 0,
            'error' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
        $created++;
    }
    return $created;
}

function pqops_comm_tables_ready(): bool {
    return pqh_table_exists_safe('local_prequran_comm_thread')
        && pqh_table_exists_safe('local_prequran_comm_message')
        && pqh_table_exists_safe('local_prequran_comm_participant');
}

function pqops_create_thread_message(int $workspaceid, int $studentid, array $participants, string $type, string $subject, string $body, int $actorid, int $caseid = 0): int {
    global $DB;
    if (!pqops_comm_tables_ready()) {
        throw new invalid_parameter_exception('Communication thread tables are not ready.');
    }
    $now = time();
    $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
        'type' => core_text::substr($type, 0, 40),
        'workspaceid' => $workspaceid,
        'cohortid' => 0,
        'studentid' => $studentid,
        'caseid' => $caseid,
        'createdby' => $actorid,
        'status' => 'active',
        'subject' => core_text::substr($subject, 0, 255),
        'lastmessageat' => $now,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
        'threadid' => $threadid,
        'senderid' => $actorid,
        'studentid' => $studentid,
        'messagekind' => 'text',
        'body' => $body,
        'templatekey' => '',
        'status' => 'visible',
        'moderationflags' => '',
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $participants[$actorid] = 'sender';
    foreach ($participants as $userid => $role) {
        if ((int)$userid <= 0) {
            continue;
        }
        $DB->insert_record('local_prequran_comm_participant', (object)[
            'threadid' => $threadid,
            'userid' => (int)$userid,
            'role' => core_text::substr((string)$role, 0, 40),
            'canreply' => $type === 'announcement' ? 0 : 1,
            'lastreadmessageid' => (int)$userid === $actorid ? $messageid : 0,
            'muted' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    if (pqh_table_exists_safe('local_prequran_comm_audit')) {
        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => $actorid,
            'action' => 'created',
            'details' => pqops_json(['type' => $type, 'workspaceid' => $workspaceid, 'caseid' => $caseid]),
            'timecreated' => $now,
        ]);
    }
    return $threadid;
}
