<?php
// Communications-Center query library — the page-defined helpers extracted
// VERBATIM from local_hubredirect/communications_center.php (prefix pqcom_) for
// the token-gated portal handler. The legacy page keeps its own inline copies
// and stays untouched (parallel-run). Shared helpers used by these functions —
// pqh_table_exists_safe (accesslib) and pqops_workspace_users
// (operations_layerlib) — are NOT copied here; the handler requires those libs.
// Requires: local/hubredirect/accesslib.php and operations_layerlib.php loaded
// first. This file defines functions only and emits no output when included.

defined('MOODLE_INTERNAL') || die();

function pqcom_name(?stdClass $user): string {
    return $user ? fullname($user) : 'User';
}

function pqcom_campaign_recipients(int $workspaceid, string $audience): array {
    $recipients = [];
    foreach (['parents' => 'parent', 'students' => 'student', 'teachers' => 'teacher'] as $key => $role) {
        if ($audience !== $key && $audience !== 'all') {
            continue;
        }
        foreach (pqops_workspace_users($workspaceid, $role) as $user) {
            $recipients[(int)$user->id] = ['user' => $user, 'role' => $role];
        }
    }
    return $recipients;
}

function pqcom_existing_columns_record(string $table, stdClass $record): stdClass {
    global $DB;

    if (!pqh_table_exists_safe($table)) {
        return $record;
    }

    $columns = $DB->get_columns($table);
    $filtered = new stdClass();
    foreach ((array)$record as $key => $value) {
        if (isset($columns[$key])) {
            $filtered->{$key} = $value;
        }
    }
    return $filtered;
}

function pqcom_existing_consent_conditions(int $workspaceid, int $studentid, int $guardianid, string $channel): array {
    global $DB;

    $columns = $DB->get_columns('local_prequran_comm_consent');
    $conditions = [
        'studentid' => $studentid,
        'guardianid' => $guardianid,
    ];
    if (isset($columns['workspaceid'])) {
        $conditions['workspaceid'] = $workspaceid;
    }
    if (isset($columns['channel'])) {
        $conditions['channel'] = $channel;
    }
    return $conditions;
}
