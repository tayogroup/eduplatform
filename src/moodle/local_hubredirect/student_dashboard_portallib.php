<?php
// Student-dashboard query library — extracted VERBATIM from student_dashboard.php
// (renamed pqhsd_ -> pqsdl_) for the token-gated portal endpoint. The legacy
// page keeps its inline copy and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqsdl_letter(float $pct): string {
    foreach ([[90, 'A'], [85, 'A-'], [80, 'B+'], [75, 'B'], [70, 'B-'], [65, 'C+'], [60, 'C'], [55, 'C-'], [50, 'D']] as $step) {
        if ($pct >= $step[0]) {
            return (string)$step[1];
        }
    }
    return 'F';
}
