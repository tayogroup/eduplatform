<?php
// Teacher-student-connect query library — extracted VERBATIM from
// teacher_student_connect.php (renamed pqtsc_ -> pqtscl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqtscl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqtscl_column_exists(string $table, string $column): bool {
    global $DB;
    if (!pqtscl_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($column, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

function pqtscl_exact_matches(string $query): array {
    global $DB, $CFG;
    $query = trim($query);
    if ($query === '' || !pqtscl_table_exists('local_prequran_student_profile')) {
        return [];
    }

    $where = [
        'LOWER(u.email) = LOWER(:studentemail)',
        'LOWER(u.username) = LOWER(:studentusername)',
        'u.idnumber = :accountnumber',
    ];
    $params = [
        'studentemail' => $query,
        'studentusername' => $query,
        'accountnumber' => $query,
        'mnethostid' => $CFG->mnet_localhost_id,
    ];
    if (ctype_digit($query)) {
        $where[] = 'u.id = :studentuserid';
        $params['studentuserid'] = (int)$query;
    }
    if (pqtscl_column_exists('local_prequran_student_profile', 'parent_email')) {
        $where[] = 'LOWER(sp.parent_email) = LOWER(:parentemail)';
        $params['parentemail'] = $query;
    }
    if (pqtscl_column_exists('local_prequran_student_profile', 'parent_phone')) {
        $where[] = 'sp.parent_phone = :parentphone';
        $params['parentphone'] = $query;
    }

    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.idnumber,
                sp.student_display_name
           FROM {user} u
           JOIN {local_prequran_student_profile} sp ON sp.userid = u.id
          WHERE u.deleted = 0
            AND u.mnethostid = :mnethostid
            AND (" . implode(' OR ', $where) . ")
       ORDER BY u.lastname ASC, u.firstname ASC, u.id ASC",
        $params,
        0,
        10
    ));
}

function pqtscl_linked_parentid(int $studentid): int {
    global $DB;
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqtscl_table_exists($table)
                || !pqtscl_column_exists($table, 'studentid')
                || !pqtscl_column_exists($table, 'guardianid')) {
            continue;
        }
        $parentid = (int)$DB->get_field_sql(
            "SELECT MAX(guardianid) FROM {{$table}} WHERE studentid = :studentid AND guardianid > 0",
            ['studentid' => $studentid]
        );
        if ($parentid > 0) {
            return $parentid;
        }
    }
    return 0;
}

function pqtscl_request_connection(int $teacherid, int $studentid, int $consumerid, int $workspaceid): int {
    global $DB, $USER;
    if (!pqtscl_table_exists('local_prequran_teacher_request')) {
        throw new invalid_parameter_exception('The teacher connection request table is not installed.');
    }
    if (!$DB->record_exists('local_prequran_student_profile', ['userid' => $studentid])) {
        throw new invalid_parameter_exception('Choose a valid existing student profile.');
    }
    if ($workspaceid <= 0) {
        throw new invalid_parameter_exception('An independent-teacher workspace is required.');
    }
    if (pqtscl_table_exists('local_prequran_teacher_student') && $DB->record_exists('local_prequran_teacher_student', [
        'workspaceid' => $workspaceid,
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'status' => 'active',
    ])) {
        throw new invalid_parameter_exception('This student is already connected to your independent teaching workspace.');
    }

    $now = time();
    $parentid = pqtscl_linked_parentid($studentid);
    $where = 'teacherid = :teacherid AND studentid = :studentid AND request_status NOT IN (:assigned, :declined, :closed)';
    $params = [
        'teacherid' => $teacherid,
        'studentid' => $studentid,
        'assigned' => 'assigned',
        'declined' => 'declined',
        'closed' => 'closed',
    ];
    if ($consumerid > 0 && pqtscl_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $where .= ' AND consumerid = :consumerid';
        $params['consumerid'] = $consumerid;
    }
    $existing = $DB->get_record_select(
        'local_prequran_teacher_request',
        $where,
        $params,
        '*',
        IGNORE_MULTIPLE
    );
    if ($existing) {
        $existing->request_status = 'selection_requested';
        $existing->parentid = $parentid;
        $existing->message = 'Independent teacher requested a connection to an existing learner. Awaiting guardian/adult learner and marketplace review.';
        $existing->timemodified = $now;
        $DB->update_record('local_prequran_teacher_request', $existing);
        return (int)$existing->id;
    }

    $record = (object)[
        'teacherid' => $teacherid,
        'parentid' => $parentid,
        'studentid' => $studentid,
        'request_status' => 'selection_requested',
        'message' => 'Independent teacher requested a connection to an existing learner. Awaiting guardian/adult learner and marketplace review.',
        'threadid' => 0,
        'admin_notes' => 'Created from Find or invite student. Existing identity was reused; no duplicate student profile was created.',
        'reviewedby' => 0,
        'reviewedat' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    if ($consumerid > 0 && pqtscl_column_exists('local_prequran_teacher_request', 'consumerid')) {
        $record->consumerid = $consumerid;
    }
    return (int)$DB->insert_record('local_prequran_teacher_request', $record);
}
