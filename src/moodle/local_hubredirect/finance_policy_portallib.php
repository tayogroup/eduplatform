<?php
// Finance-policy portal library — the two helpers defined inline by
// finance_policy.php, extracted VERBATIM (renamed pqfpol_ -> pqfpoll_) for the
// token-gated portal endpoint. The legacy page keeps its inline copies and
// stays untouched (parallel-run). Everything else the page calls lives in the
// shared finance_lib.php (pqfin_*) / accesslib.php (pqh_*), which are
// require_once'd — never copied.

defined('MOODLE_INTERNAL') || die();

function pqfpoll_option_label(string $value): string {
    return ucwords(str_replace('_', ' ', $value));
}

function pqfpoll_select(string $name, array $options, string $selected): string {
    $html = '<select class="pqfpol-input" name="' . s($name) . '">';
    foreach ($options as $value) {
        $html .= '<option value="' . s($value) . '"' . ($value === $selected ? ' selected' : '') . '>' . s(pqfpoll_option_label($value)) . '</option>';
    }
    return $html . '</select>';
}
