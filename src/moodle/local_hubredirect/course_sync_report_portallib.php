<?php
// Course-sync-report query library — extracted VERBATIM from
// course_sync_report.php (renamed pqcsr_ -> pqcsyncl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copy and stays untouched
// (parallel-run).

defined('MOODLE_INTERNAL') || die();

function pqcsyncl_manual_label($row): string {
    if ((int)($row->moodlecourseid ?? 0) <= 0 || empty($row->moodle_fullname)) {
        return 'Missing Moodle course';
    }
    if ((int)($row->moodle_visible ?? 0) !== 1) {
        return 'Moodle course hidden';
    }
    if (empty($row->manualenrolid)) {
        return 'Manual enrollment missing';
    }
    if ((int)$row->manualstatus !== 0) {
        return 'Manual enrollment disabled';
    }
    return 'Ready';
}
