<?php
// Attendance-operations helper library — extracted VERBATIM from
// attendance_operations.php (prefix pqatt_) for the token-gated portal endpoint.
// The legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires (loaded first by the handler): local/hubredirect/accesslib.php
// (pqh_table_exists_safe, pqh_table_has_field_safe), local/prequran/finance_lib.php
// (pqfin_hold_schema_ready, pqfin_default_currency) and
// local/prequran/admissionslib.php (pqadm_metadata).
// Not extracted: nothing else — the page defines only these four functions.

defined('MOODLE_INTERNAL') || die();

function pqatt_statuses(): array {
    return [
        'present' => 'Present',
        'late' => 'Late',
        'excused' => 'Excused',
        'absent' => 'Absent',
        'makeup_completed' => 'Make-up completed',
    ];
}

function pqatt_latest_rule(int $workspaceid): ?stdClass {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_att_rule')) {
        return null;
    }
    $rules = $DB->get_records('local_prequran_att_rule', ['workspaceid' => $workspaceid, 'status' => 'active'], 'termid DESC, offeringid DESC, id DESC', '*', 0, 1);
    return $rules ? reset($rules) : null;
}

function pqatt_student_absence_count(int $workspaceid, int $studentid): int {
    global $DB;
    if ($workspaceid <= 0 || $studentid <= 0 || !pqh_table_exists_safe('local_prequran_live_attendance')) {
        return 0;
    }
    $where = 'studentid = :studentid AND attendance_status = :status';
    $params = ['studentid' => $studentid, 'status' => 'absent'];
    if (pqh_table_has_field_safe('local_prequran_live_attendance', 'workspaceid')) {
        $where .= ' AND workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    if (pqh_table_has_field_safe('local_prequran_live_attendance', 'excused')) {
        $where .= ' AND excused = 0';
    }
    return (int)$DB->count_records_select('local_prequran_live_attendance', $where, $params);
}

function pqatt_apply_rule_actions(int $workspaceid, int $studentid, int $attendanceid, ?stdClass $rule, $consumercontext, int $actorid): void {
    global $DB;
    if (!$rule || $studentid <= 0) {
        return;
    }
    $absencecount = pqatt_student_absence_count($workspaceid, $studentid);
    $standing = '';
    $holdaction = '';
    if ($absencecount >= (int)$rule->absence_warning_count) {
        $standing = (string)$rule->academic_standing_behavior;
    }
    if ($absencecount >= (int)$rule->absence_hold_count) {
        $holdaction = (string)$rule->finance_hold_behavior;
        if (pqfin_hold_schema_ready() && in_array($holdaction, ['warning_only', 'block_enrollment', 'block_services'], true)) {
            $exists = $DB->record_exists('local_prequran_finance_hold', [
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'source' => 'attendance',
                'status' => 'active',
            ]);
            if (!$exists) {
                $now = time();
                $DB->insert_record('local_prequran_finance_hold', (object)[
                    'consumerid' => (int)($consumercontext->consumerid ?? 0),
                    'workspaceid' => $workspaceid,
                    'billingaccountid' => 0,
                    'studentid' => $studentid,
                    'invoiceid' => 0,
                    'paymentid' => 0,
                    'holdtype' => 'attendance',
                    'source' => 'attendance',
                    'severity' => $holdaction === 'warning_only' ? 'warning' : 'blocker',
                    'status' => 'active',
                    'policyaction' => $holdaction,
                    'currency' => pqfin_default_currency(),
                    'amount' => '0.00',
                    'reasoncode' => 'attendance_absence_threshold',
                    'reason' => 'Attendance absence threshold reached.',
                    'parentmessage' => 'Please contact the academy team about attendance and make-up planning.',
                    'resolutionnote' => '',
                    'metadatajson' => pqadm_metadata(['absence_count' => $absencecount, 'ruleid' => (int)$rule->id]),
                    'detectedat' => $now,
                    'activatedat' => $now,
                    'resolvedat' => 0,
                    'createdby' => $actorid,
                    'modifiedby' => $actorid,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
            }
        }
    }
    if ($standing !== '' || $holdaction !== '') {
        $attendance = $DB->get_record('local_prequran_live_attendance', ['id' => $attendanceid], '*', IGNORE_MISSING);
        if ($attendance) {
            if (pqh_table_has_field_safe('local_prequran_live_attendance', 'standing_action')) {
                $attendance->standing_action = $standing;
            }
            if (pqh_table_has_field_safe('local_prequran_live_attendance', 'finance_hold_action')) {
                $attendance->finance_hold_action = $holdaction;
            }
            $attendance->timemodified = time();
            $DB->update_record('local_prequran_live_attendance', $attendance);
        }
    }
}
