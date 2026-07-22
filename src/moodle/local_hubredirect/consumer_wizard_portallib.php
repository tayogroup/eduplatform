<?php
// Consumer-wizard portal library (prefix pqcwl_) — companion to the token-gated
// portal handler portal_handlers/consumer-wizard.php.
//
// The legacy page local_hubredirect/consumer_wizard.php defines exactly ONE
// function of its own — pqcw_clean_route() — a local-path sanitiser for the
// default public/dashboard/login route fields. Every other helper it uses
// (pqhi_* option lists, slug/domain cleaners, website-profile builder, admin
// resolver, workspace + consumer upserts, domain sync) already lives in the
// shared library local/hubredirect/institutionlib.php, and its access + table
// helpers (pqh_*) live in local/hubredirect/accesslib.php. Both are shared and
// are required directly by the handler — never copied here.
//
// The single page-defined function is ported VERBATIM below, its prefix renamed
// pqcw_ -> pqcwl_ so it never collides with the still-live legacy page's copy
// (parallel-run). The legacy page keeps its inline pqcw_clean_route() untouched.
//
// Requires: local/hubredirect/accesslib.php AND local/hubredirect/institutionlib.php
// loaded first (pqh_* / pqhi_* helpers are called by the handler at runtime).
//
// This file emits ZERO output and defines ZERO top-level code besides the guard.

defined('MOODLE_INTERNAL') || die();

function pqcwl_clean_route(string $path, string $fallback): string {
    $path = trim($path);
    if ($path === '') {
        return $fallback;
    }
    if ($path[0] !== '/') {
        $path = '/' . $path;
    }
    $path = clean_param($path, PARAM_LOCALURL);
    if ($path === '' || strpos($path, '//') === 0 || preg_match('/^\/?https?:/i', $path)) {
        throw new invalid_parameter_exception('Use local Moodle paths only, such as /local/hubredirect/consumer_landing.php.');
    }
    return $path;
}
