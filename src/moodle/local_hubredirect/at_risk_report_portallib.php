<?php
// At-risk report query library — extracted VERBATIM from at_risk_report.php
// (renamed parr_ -> pqarrl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copy and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_table_exists_safe).
//
// Only one function is defined in at_risk_report.php (parr_audit); the rest of
// the page's helpers are shared pqh_* functions (accesslib.php / dashboard.php)
// which are NOT copied here. Including this file produces no output.

defined('MOODLE_INTERNAL') || die();

function pqarrl_audit(int $studentid, string $action, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'student',
        'targetid' => $studentid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}
