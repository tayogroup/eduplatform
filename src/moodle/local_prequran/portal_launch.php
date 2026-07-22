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

/** managed-reports is open to any authenticated user — the data endpoint
 *  scopes what they see by role (admin/teacher/parent/student), exactly like
 *  the legacy page. */
function pqpl_any_authenticated(int $userid): bool {
    return $userid > 0;
}

$report = optional_param('report', 'live-reports', PARAM_ALPHANUMEXT);
$reports = [
    // report id => [access callback, page filename]
    'live-reports' => ['pqh_can_manage_academy_operations', 'live-reports.html'],
    'managed-reports' => ['pqpl_any_authenticated', 'managed-reports.html'],
    'dashboard' => ['pqpl_any_authenticated', 'dashboard-6.html'],
    'intake-requests' => ['pqh_can_manage_academy_operations', 'intake-requests.html'],
    'workspace-reports' => ['pqpl_any_authenticated', 'workspace-reports.html'],
    'live-schedule' => ['pqpl_any_authenticated', 'live-schedule.html'],
    'live-summaries' => ['pqpl_any_authenticated', 'live-summaries.html'],
    // Batch wave (handlers in portal_handlers/): entry mirrors each legacy
    // page's require_login()-only gate; the handlers re-enforce the real
    // per-action authorization (course-offerings ports the workspace-manager
    // gate with the exact legacy denial message).
    'recordings' => ['pqpl_any_authenticated', 'recordings.html'],
    'communications' => ['pqpl_any_authenticated', 'communications.html'],
    'course-offerings' => ['pqpl_any_authenticated', 'course-offerings.html'],
    'parent-trust' => ['pqpl_any_authenticated', 'parent-trust.html'],
    'live-sessions' => ['pqpl_any_authenticated', 'live-sessions.html'],
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
