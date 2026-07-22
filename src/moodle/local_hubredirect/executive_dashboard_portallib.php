<?php
// Executive-dashboard query library — the ONLY page-defined function from
// local_hubredirect/executive_dashboard.php (pqexec_money), extracted VERBATIM
// (already prefixed pqexec_ on the page) for the token-gated portal endpoint.
// Every other symbol the page uses (pqh_*, pqgov_*) is a shared library function
// loaded from accesslib.php / governance_analyticslib.php — NOT copied here.
// The legacy page keeps its inline copy and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqexec_money(float $value): string {
    return number_format($value, 2);
}
