<?php
// Portal launch (hubredirect Phase C) — the one-click bridge from a Moodle
// session to a Bunny-hosted portal page. Enforces the SAME access check the
// legacy PHP page uses, mints a portal-scoped token, and redirects.
//
//   /local/prequran/portal_launch.php            → live-reports (default)
//   /local/prequran/portal_launch.php?report=…   → future portal pages

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/progress_gatewaylib.php');
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

require_login();

$report = optional_param('report', 'live-reports', PARAM_ALPHANUMEXT);
$reports = [
    // report id => [access callback, page filename]
    'live-reports' => ['pqh_can_manage_academy_operations', 'live-reports.html'],
];
if (!isset($reports[$report])) {
    throw new moodle_exception('invalidparameter', 'debug', '', null, 'Unknown portal report: ' . $report);
}
[$accesscheck, $page] = $reports[$report];
if (!$accesscheck((int)$USER->id)) {
    pqh_access_denied(
        'This portal report is available to academy operations users only.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Reports are not available for this account'
    );
}

$token = pqpg_mint_token((int)$USER->id, 'portal:' . $report);
$base = rtrim((string)get_config('local_prequran', 'portal_base_url'), '/');
if ($base === '') {
    $base = 'https://ehelacademy.b-cdn.net/platform/portal';
}
$endpoint = $CFG->wwwroot . '/local/prequran/portal_data.php';

redirect($base . '/' . $page . '?endpoint=' . urlencode($endpoint) . '&token=' . urlencode($token));
