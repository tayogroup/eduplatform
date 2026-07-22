<?php
// Master-dashboard helper library — extracted VERBATIM from master_dashboard.php
// (renamed pqh_master_* -> pqmdl_*) for the token-gated portal endpoint. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqmdl_status(string $path, bool $external = false): string {
    global $CFG;
    if ($external) {
        return 'external';
    }
    return file_exists($CFG->dirroot . $path) ? 'ready' : 'missing';
}

function pqmdl_url(string $path, array $params = [], bool $external = false): string {
    if ($external) {
        return $path;
    }
    return (new moodle_url($path, $params))->out(false);
}

function pqmdl_consumer_path(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '' || $path[0] !== '/' || strpos($path, '//') === 0 || preg_match('/^\/https?:/i', $path)) {
        return $fallback;
    }
    return clean_param($path, PARAM_LOCALURL);
}
