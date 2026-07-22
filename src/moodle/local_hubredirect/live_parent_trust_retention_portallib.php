<?php
// Parent-trust retention query/helper library — extracted VERBATIM from
// local_hubredirect/live_parent_trust_retention.php (renamed pqlptr_ ->
// pqlptrl_) for the token-gated portal endpoint. The legacy page keeps its
// inline copies and stays untouched (parallel-run). Only the page-defined
// functions are ported here; shared pqh_*/pqpd_* helpers are not copied.
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqlptrl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlptrl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlptrl_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlptrl_age_label(int $timecreated): string {
    $age = time() - $timecreated;
    if ($age <= 30 * DAYSECS) {
        return '0-30 days';
    }
    if ($age <= 90 * DAYSECS) {
        return '31-90 days';
    }
    if ($age <= 180 * DAYSECS) {
        return '91-180 days';
    }
    return '180+ days';
}

function pqlptrl_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
    global $DB, $USER;
    if (!pqlptrl_table_exists('local_prequran_live_audit')) {
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

function pqlptrl_latest_policy_event(): ?stdClass {
    global $DB;
    if (!pqlptrl_table_exists('local_prequran_live_audit')) {
        return null;
    }
    $actions = [
        'parent_trust_purge_review_requested',
        'parent_trust_purge_review_approved',
        'parent_trust_purge_review_rejected',
    ];
    [$insql, $params] = $DB->get_in_or_equal($actions, SQL_PARAMS_NAMED, 'policy');
    $records = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_live_audit}
          WHERE action {$insql}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        1
    );
    return $records ? reset($records) : null;
}

function pqlptrl_purge_evidence_snapshot(array $rows): array {
    $ids = [];
    $actioncounts = [];
    $reasoncounts = [];
    $staffids = [];
    $studentids = [];
    $oldest = 0;
    $newest = 0;
    $samples = [];

    foreach ($rows as $row) {
        $id = (int)$row->id;
        $timecreated = (int)$row->timecreated;
        $action = (string)$row->action;
        $actorid = (int)$row->actorid;
        $targetid = (int)$row->targetid;
        $details = json_decode((string)$row->details, true);
        $details = is_array($details) ? $details : [];
        $reason = (string)($details['support_reason_label'] ?? $details['support_reason'] ?? 'Not recorded');

        $ids[] = $id;
        $actioncounts[$action] = ($actioncounts[$action] ?? 0) + 1;
        $reasoncounts[$reason] = ($reasoncounts[$reason] ?? 0) + 1;
        if ($actorid > 0) {
            $staffids[$actorid] = true;
        }
        if ($targetid > 0) {
            $studentids[$targetid] = true;
        }
        if ($oldest === 0 || $timecreated < $oldest) {
            $oldest = $timecreated;
        }
        if ($newest === 0 || $timecreated > $newest) {
            $newest = $timecreated;
        }
        if (count($samples) < 20) {
            $samples[] = [
                'id' => $id,
                'action' => $action,
                'actorid' => $actorid,
                'targettype' => (string)$row->targettype,
                'targetid' => $targetid,
                'timecreated' => $timecreated,
                'reason' => $reason,
                'case_status' => (string)($details['case_status'] ?? ''),
                'support_case_id' => (int)($details['support_case_id'] ?? 0),
            ];
        }
    }

    return [
        'record_ids' => $ids,
        'record_id_count' => count($ids),
        'sample_ids' => array_slice($ids, 0, 20),
        'oldest_timecreated' => $oldest,
        'newest_timecreated' => $newest,
        'action_counts' => $actioncounts,
        'reason_counts' => $reasoncounts,
        'staff_count' => count($staffids),
        'student_count' => count($studentids),
        'sample_rows' => $samples,
    ];
}

function pqlptrl_decode_details(string $json): array {
    $details = json_decode($json, true);
    return is_array($details) ? $details : [];
}
