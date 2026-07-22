<?php
// Live-admin-menu query library — extracted VERBATIM from live_admin.php
// (renamed pqladm_ -> pqladml_) for the token-gated portal endpoint. The legacy
// page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqladml_page_status(string $path): string {
    global $CFG;
    if (preg_match('#^https?://#i', $path)) {
        return 'ready';
    }
    $filepath = (string)(parse_url($path, PHP_URL_PATH) ?: $path);
    return file_exists($CFG->dirroot . $filepath) ? 'ready' : 'missing';
}

function pqladml_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqladml_url(string $path, array $contextparams): string {
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }

    $urlpath = (string)(parse_url($path, PHP_URL_PATH) ?: $path);
    $query = (string)(parse_url($path, PHP_URL_QUERY) ?: '');
    $queryparams = [];
    if ($query !== '') {
        parse_str($query, $queryparams);
    }

    $params = $contextparams;
    if (!empty($queryparams['consumer'])
            && isset($params['consumer'])
            && (string)$queryparams['consumer'] !== (string)$params['consumer']) {
        unset($params['workspaceid']);
    }
    $params = array_merge($params, $queryparams);

    return (new moodle_url($urlpath, $params))->out(false);
}
