<?php
// Transcript-policy display helpers — extracted VERBATIM from
// transcript_policy.php (the pqctp_ helpers) for the token-gated portal
// handler. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Every policy read/write is a shared pqct_* function in
// course_transcriptlib.php (required by the handler, not copied here).
// Requires: local/hubredirect/course_transcriptlib.php loaded first (for the
// s() escaper used inside pqctp_select).

defined('MOODLE_INTERNAL') || die();

function pqctp_option_label(string $value): string {
    return ucwords(str_replace('_', ' ', $value));
}

function pqctp_select(string $name, array $options, string $selected): string {
    $html = '<select class="pqctp-input" name="' . s($name) . '">';
    foreach ($options as $value) {
        $html .= '<option value="' . s($value) . '"' . ($value === $selected ? ' selected' : '') . '>' . s(pqctp_option_label($value)) . '</option>';
    }
    return $html . '</select>';
}
