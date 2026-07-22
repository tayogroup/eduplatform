<?php
// Enrollment-approval query library — extracted VERBATIM from
// enrollment_approval.php (the page-defined pqea_* helpers) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqea_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqea_table_has_field(string $table, string $field): bool {
    global $DB;
    try {
        $columns = $DB->get_columns($table);
    } catch (Throwable $e) {
        return false;
    }
    return array_key_exists($field, $columns);
}

function pqea_parent_is_linked(int $studentid, int $parentid): bool {
    global $DB;
    if ($studentid <= 0 || $parentid <= 0) {
        return false;
    }
    if (pqea_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid])) {
        return true;
    }
    if (pqea_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', ['studentid' => $studentid, 'guardianid' => $parentid])) {
        return true;
    }
    return false;
}

function pqea_current_status(int $studentid, int $parentid): string {
    global $DB;
    if (pqea_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', [
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'consent_type' => 'enrollment_approval',
            'granted' => 1,
        ])) {
        return 'approved';
    }
    if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
        $status = $DB->get_field('local_prequran_student_profile', 'enrollment_approval_status', ['userid' => $studentid]);
        if (is_string($status) && strtolower($status) === 'approved') {
            return 'approved';
        }
    }
    return 'pending_parent';
}

function pqea_upsert_enrollment_approval(int $studentid, int $parentid, string $notes): void {
    global $DB;
    $now = time();
    $details = 'Parent/guardian approved enrollment so the student can start lessons. ' . $notes;

    if (pqea_table_exists('local_prequran_live_consent')) {
        $record = (object)[
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'consent_type' => 'enrollment_approval',
            'granted' => 1,
            'version' => '1',
            'consent_source' => 'parent_portal',
            'details' => $details,
            'timemodified' => $now,
        ];
        $existing = $DB->get_record('local_prequran_live_consent', [
            'studentid' => $studentid,
            'guardianid' => $parentid,
            'consent_type' => 'enrollment_approval',
        ]);
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_live_consent', $record);
        } else {
            $record->timecreated = $now;
            $DB->insert_record('local_prequran_live_consent', $record);
        }
    }

    if (pqea_table_exists('local_prequran_student_profile')) {
        $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
        if ($profile) {
            $profile->timemodified = $now;
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approval_status')) {
                $profile->enrollment_approval_status = 'approved';
            }
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approvedby')) {
                $profile->enrollment_approvedby = $parentid;
            }
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approvedat')) {
                $profile->enrollment_approvedat = $now;
            }
            if (pqea_table_has_field('local_prequran_student_profile', 'enrollment_approval_notes')) {
                $profile->enrollment_approval_notes = $details;
            }
            $DB->update_record('local_prequran_student_profile', $profile);
        }
    }

    if (pqea_table_exists('local_prequran_teacher_request')) {
        $DB->set_field_select(
            'local_prequran_teacher_request',
            'request_status',
            'parent_confirmed',
            'studentid = :studentid AND parentid = :parentid AND request_status IN (:selectionrequested, :academyreview, :teachercontacted)',
            [
                'studentid' => $studentid,
                'parentid' => $parentid,
                'selectionrequested' => 'selection_requested',
                'academyreview' => 'academy_review',
                'teachercontacted' => 'teacher_contacted',
            ]
        );
    }

    if (pqea_table_exists('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => $parentid,
            'action' => 'enrollment_approved',
            'targettype' => 'student',
            'targetid' => $studentid,
            'details' => json_encode(['source' => 'parent_portal'], JSON_UNESCAPED_SLASHES),
            'timecreated' => $now,
        ]);
    }
}
