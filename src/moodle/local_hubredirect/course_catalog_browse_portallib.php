<?php
// Course-catalog-browse helper library — extracted VERBATIM from
// course_catalog_browse.php (renamed pqcb_ -> pqcbl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). Requires Moodle core loaded (core_text, s()).

defined('MOODLE_INTERNAL') || die();

function pqcbl_filter_url_params(array $baseparams, string $coursefilter, bool $availableonly, array $extra = []): array {
    if ($coursefilter !== '') {
        $baseparams['course'] = $coursefilter;
    }
    if ($availableonly) {
        $baseparams['available_only'] = 1;
    }
    return array_merge($baseparams, $extra);
}

function pqcbl_short_text(string $text, int $limit = 180): string {
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
    if ($text === '') {
        return '';
    }
    return core_text::strlen($text) > $limit ? core_text::substr($text, 0, $limit) . '...' : $text;
}

function pqcbl_detail_html(string $text): string {
    $text = trim($text);
    if ($text === '') {
        return '<span class="pqcb-muted">Not specified</span>';
    }
    $lines = array_values(array_filter(array_map(static function(string $line): string {
        return trim(preg_replace('/^[\-\*\x{2022}\d\.\)\s]+/u', '', $line) ?? '');
    }, preg_split('/\R+/', $text) ?: []), static fn(string $line): bool => $line !== ''));
    if (count($lines) > 1) {
        $items = array_map(static fn(string $line): string => '<li>' . s($line) . '</li>', $lines);
        return '<ul class="pqcb-detail-list">' . implode('', $items) . '</ul>';
    }
    return '<span class="pqcb-text">' . nl2br(s($text)) . '</span>';
}
