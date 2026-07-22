<?php
// Transcript-controls display helpers — extracted VERBATIM from
// transcript_controls.php (the pqtc_ helpers) for the token-gated portal
// handler. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Every workspace/student/hold/correction query is a shared
// pqct_* function in course_transcriptlib.php (required by the handler, not
// copied here). Requires: local/hubredirect/course_transcriptlib.php loaded
// first (for userdate/get_string usage inside pqtc_date).

defined('MOODLE_INTERNAL') || die();

function pqtc_date(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedatetimeshort')) : '';
}

function pqtc_label(string $value): string {
    $value = trim($value);
    return $value === '' ? 'Unknown' : ucwords(str_replace('_', ' ', $value));
}
