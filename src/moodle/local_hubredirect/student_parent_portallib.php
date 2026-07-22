<?php
// Student-parent-portal query library — extracted VERBATIM from
// student_parent_portal.php (renamed pqsp_ -> pqsppl_) for the token-gated
// portal endpoint (report id "student-parent-portal"; handler:
// local_prequran/portal_handlers/student-parent-portal.php). The legacy page
// keeps its inline copy and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* helpers).

defined('MOODLE_INTERNAL') || die();

function pqsppl_child_ids(int $workspaceid, int $userid): array {
    global $DB;
    $ids = [];
    if (pqh_user_workspace_role($userid, $workspaceid) === 'student') {
        $ids[$userid] = $userid;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqh_table_exists_safe($table) || !pqh_table_has_field_safe($table, 'guardianid')) {
            continue;
        }
        $params = ['guardianid' => $userid];
        $where = 'guardianid = :guardianid';
        if (pqh_table_has_field_safe($table, 'workspaceid')) {
            $where .= ' AND (workspaceid = :workspaceid OR workspaceid = 0)';
            $params['workspaceid'] = $workspaceid;
        }
        foreach ($DB->get_fieldset_select($table, 'studentid', $where, $params) as $studentid) {
            if ((int)$studentid > 0) {
                $ids[(int)$studentid] = (int)$studentid;
            }
        }
    }
    return array_values($ids);
}
