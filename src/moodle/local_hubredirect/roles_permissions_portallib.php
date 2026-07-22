<?php
// Roles/permissions query + write-helper library — extracted VERBATIM from
// roles_permissions.php (the page already prefixes its helpers pqrp_, and the
// prefix is unique repo-wide, so the names are kept as-is) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_table_exists_safe).

defined('MOODLE_INTERNAL') || die();

function pqrp_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqrp_time_from_date(string $value): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ' 23:59:59');
    return $time ? (int)$time : 0;
}

function pqrp_users_for_workspace(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, wm.workspace_role
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
       ORDER BY wm.workspace_role ASC, u.lastname ASC, u.firstname ASC",
        ['workspaceid' => $workspaceid, 'status' => 'active']
    ));
}

function pqrp_run_isolation_audit(int $workspaceid, int $actorid): int {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_tenant_audit')) {
        return 0;
    }
    $created = 0;
    $now = time();
    $checks = [
        ['workspace_members_active', 'pass', 'workspace', $workspaceid, ['active_members' => pqh_table_exists_safe('local_prequran_workspace_member') ? $DB->count_records('local_prequran_workspace_member', ['workspaceid' => $workspaceid, 'status' => 'active']) : 0]],
        ['documents_scoped_to_workspace', 'pass', 'document', 0, ['document_count' => pqh_table_exists_safe('local_prequran_document') ? $DB->count_records('local_prequran_document', ['workspaceid' => $workspaceid]) : 0]],
        ['sessions_scoped_to_workspace', 'pass', 'session', 0, ['session_count' => pqh_table_exists_safe('local_prequran_live_session') ? $DB->count_records('local_prequran_live_session', ['workspaceid' => $workspaceid]) : 0]],
        ['support_access_reviewed', 'pass', 'support_grant', 0, ['active_grants' => pqh_table_exists_safe('local_prequran_support_grant') ? $DB->count_records_select('local_prequran_support_grant', 'workspaceid = :workspaceid AND status = :status AND (expiresat = 0 OR expiresat > :now)', ['workspaceid' => $workspaceid, 'status' => 'approved', 'now' => $now]) : 0]],
    ];
    foreach ($checks as $check) {
        $DB->insert_record('local_prequran_tenant_audit', (object)[
            'workspaceid' => $workspaceid,
            'userid' => $actorid,
            'check_key' => $check[0],
            'status' => $check[1],
            'targettype' => $check[2],
            'targetid' => $check[3],
            'detailsjson' => pqrp_json($check[4]),
            'timecreated' => $now,
        ]);
        $created++;
    }
    return $created;
}
