<?php
// ---- report: platform-dashboard (EduPlatform foundation overview / link hub; read-only) ----
// Ported from local_hubredirect/platform_dashboard.php via platform_dashboard_portallib
// (pqpdl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// Distinct from dashboard.php ("dashboard") and master_dashboard.php ("master-dashboard").
// GET  = the Foundation overview: platform counts (consumers / active / workspaces /
//        domains / missing-workspace), the admin link directory (targets already
//        migrated to the portal come back as portal_launch.php?report=<id> URLs;
//        everything else keeps its legacy absolute page URL), the consumer roster
//        grouped by type, and the custom-domain readiness list.
// POST = rejected (the legacy page performs no writes — read-only overview).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/platform_dashboard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same two-stage gate as the page's
//    pqh_require_platform_operations('Only platform administrators can open the EduPlatform dashboard.')
//    (foundation-domain check, then academy-operations check), with
//    pqh_access_denied's redirects replaced by pqpd_fail(403, same message).
//    The page performs no pqh_live_security_audit call, so none is ported. --
$consumercontext = pqh_current_consumer_context();
$isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
    && !empty($consumercontext->trusted_domain);
if (!$isfoundationdomain) {
    pqpd_fail(403, 'EduPlatform administration is only available from the EduPlatform foundation domain.');
}
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only platform administrators can open the EduPlatform dashboard.');
}

// The overview is read-only (the legacy page emits no writes).
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The EduPlatform dashboard is read-only.');
}

// -- platform counts (verbatim aggregation from the page) --
$consumers = pqpdl_consumer_rows();
$domains = pqpdl_domain_rows();
$grouped = [];
$stats = [
    'consumers' => 0,
    'activeconsumers' => 0,
    'workspaces' => 0,
    'missingworkspaces' => 0,
    'domains' => count($domains),
];
foreach ($consumers as $consumer) {
    $type = (string)($consumer->consumer_type ?? '');
    $grouped[$type][] = $consumer;
    if ($type !== 'platform_foundation') {
        $stats['consumers']++;
        if ((string)$consumer->status === 'active') {
            $stats['activeconsumers']++;
        }
        if ((int)$consumer->primaryworkspaceid <= 0) {
            $stats['missingworkspaces']++;
        }
    }
    if ((int)$consumer->primaryworkspaceid > 0) {
        $stats['workspaces']++;
    }
}
ksort($grouped);

// -- admin link directory (the page's header actions + next actions, de-duplicated).
//    Legacy pages already migrated to the token-gated portal are rewritten to
//    portal_launch.php?report=<id> so the click re-mints a scoped token; the rest
//    keep their session-backed legacy URLs. --
$portalmap = [
    'platform_consumers.php' => 'platform-consumers',
    'institution_onboarding.php' => 'institution-onboarding',
];
$directory = [
    ['EduPlatform landing', '/local/hubredirect/platform_landing.php', [], 'Foundation public landing page.'],
    ['Platform settings', '/local/hubredirect/platform_settings.php', [], 'Foundation branding and route defaults.'],
    ['User roster', '/local/hubredirect/platform_user_roster.php', [], 'Platform-wide user roster.'],
    ['Course roster', '/local/hubredirect/platform_course_roster.php', [], 'Platform-wide course roster.'],
    ['Manage consumers', '/local/hubredirect/platform_consumers.php', [], 'Manage consumers, domains, workspaces, and status.'],
    ['Onboard institution', '/local/hubredirect/institution_onboarding.php', [], 'Guided institution workspace setup.'],
    ['Diagnostics', '/local/hubredirect/consumer_diagnostics.php', [], 'Read-only multi-consumer resolver checks.'],
    ['Test matrix', '/local/hubredirect/institution_test_matrix.php', [], 'Production test matrix for major domains.'],
];
$links = [];
$counts = ['links' => 0, 'ready' => 0, 'missing' => 0, 'portal' => 0];
foreach ($directory as $entry) {
    [$label, $path, $params, $description] = $entry;
    $basename = basename($path);
    $handlerfile = __DIR__ . '/' . ($portalmap[$basename] ?? '') . '.php';
    $portalid = (isset($portalmap[$basename]) && is_file($handlerfile)) ? $portalmap[$basename] : '';
    $status = file_exists($CFG->dirroot . $path) ? 'ready' : 'missing';
    $url = $portalid !== ''
        ? $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $portalid
        : (new moodle_url($path, $params))->out(false);
    $counts['links']++;
    if (isset($counts[$status])) {
        $counts[$status]++;
    }
    if ($portalid !== '') {
        $counts['portal']++;
    }
    $links[] = [
        'title' => $label,
        'desc' => $description,
        'url' => $url,
        'status' => $status,
        'portal' => $portalid !== '',
    ];
}

// Quick header actions (primary Manage-consumers first), portalmap applied.
$actions = [];
foreach ([
    ['Manage consumers', '/local/hubredirect/platform_consumers.php', true],
    ['EduPlatform landing', '/local/hubredirect/platform_landing.php', false],
    ['Onboard institution', '/local/hubredirect/institution_onboarding.php', false],
    ['Diagnostics', '/local/hubredirect/consumer_diagnostics.php', false],
] as [$label, $path, $primary]) {
    $basename = basename($path);
    $handlerfile = __DIR__ . '/' . ($portalmap[$basename] ?? '') . '.php';
    $portalid = (isset($portalmap[$basename]) && is_file($handlerfile)) ? $portalmap[$basename] : '';
    $url = $portalid !== ''
        ? $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $portalid
        : (new moodle_url($path))->out(false);
    $actions[] = ['title' => $label, 'url' => $url, 'primary' => (bool)$primary];
}

// -- consumer roster grouped by type (same shape the page renders). Per-consumer
//    links carry consumer/workspace params that cannot travel through
//    portal_launch, so they stay legacy absolute (same rule as master-dashboard). --
$consumersections = [];
foreach ($grouped as $type => $rows) {
    $items = [];
    foreach ($rows as $consumer) {
        $workspaceid = (int)$consumer->primaryworkspaceid;
        $workspaceclass = $workspaceid > 0 ? pqpdl_status_class((string)($consumer->workspacestatus ?? 'missing')) : 'missing';
        $params = ['consumer' => (string)$consumer->slug];
        if ($workspaceid > 0) {
            $params['workspaceid'] = $workspaceid;
        }
        $cc = pqh_consumer_context_by_slug((string)$consumer->slug);
        $workspaceurl = $workspaceid > 0
            ? pqh_consumer_url('/local/hubredirect/workspace_dashboard.php', $cc, $params)->out(false)
            : '';
        $manageurl = (string)$consumer->consumer_type === 'platform_foundation'
            ? (new moodle_url('/local/hubredirect/platform_settings.php'))->out(false)
            : (new moodle_url('/local/hubredirect/platform_consumers.php', ['focus' => (string)$consumer->slug]))->out(false);
        $items[] = [
            'name' => (string)$consumer->name,
            'slug' => (string)$consumer->slug,
            'supportemail' => (string)$consumer->supportemail,
            'status' => (string)$consumer->status,
            'statusclass' => pqpdl_status_class((string)$consumer->status),
            'workspaceid' => $workspaceid,
            'workspacename' => $workspaceid > 0 ? (string)$consumer->workspacename : '',
            'workspacestatus' => $workspaceid > 0 ? (string)$consumer->workspacestatus : 'missing',
            'workspaceclass' => $workspaceclass,
            'domaincount' => (int)$consumer->domaincount,
            'manageurl' => $manageurl,
            'workspaceurl' => $workspaceurl,
        ];
    }
    $consumersections[] = [
        'type' => (string)$type,
        'label' => pqpdl_consumer_type_label((string)$type),
        'consumers' => $items,
    ];
}

// -- custom-domain readiness (same slice the page shows) --
$domainrows = [];
foreach (array_slice($domains, 0, 12) as $domain) {
    $domainrows[] = [
        'domain' => (string)$domain->domain,
        'consumername' => (string)$domain->consumername,
        'domain_type' => (string)$domain->domain_type,
        'isprimary' => (int)$domain->isprimary === 1,
        'status' => (string)$domain->status,
        'statusclass' => pqpdl_status_class((string)$domain->status),
        'sslstatus' => (string)$domain->sslstatus,
        'sslclass' => pqpdl_status_class((string)$domain->sslstatus),
        'verificationstatus' => (string)$domain->verificationstatus,
        'verificationclass' => pqpdl_status_class((string)$domain->verificationstatus),
    ];
}

echo json_encode([
    'ok' => true,
    'title' => 'EduPlatform Dashboard',
    'subtitle' => 'Foundation overview for consumers, custom domains, workspaces, and operational readiness.',
    'counts' => $stats + $counts,
    'actions' => $actions,
    'links' => $links,
    'consumers' => $consumersections,
    'domains' => $domainrows,
    'schemaready' => pqh_consumer_schema_ready(),
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
