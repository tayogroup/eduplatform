<?php
// ---- report: master-dashboard (platform administration hub; read-only) ----
// Ported from local_hubredirect/master_dashboard.php via master_dashboard_portallib
// (pqmdl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the siteadmin link directory (Foundation / Consumers / Workspace Ops /
//        Live Sessions / Intake / Diagnostics / Moodle Admin) with ready/missing
//        status per link. Targets already migrated to the portal come back as
//        portal_launch.php?report=<id> URLs; everything else is the legacy page.
// POST = rejected (the legacy page performs no writes).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/master_dashboard_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same gate as the page (siteadmin only, same denial message) --
if (!is_siteadmin($userid)) {
    pqpd_fail(403, 'Only platform site administrators can view the master dashboard.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The master dashboard is read-only.');
}

// -- consumer context resolution (verbatim from the page) --
$consumercontext = pqh_requested_consumer_context();
$consumerparams = [];
if (trim((string)($consumercontext->consumerslug ?? '')) !== '') {
    $consumerparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $consumerparams['workspaceid'] = (int)$consumercontext->workspaceid;
}

// -- consumer links (verbatim query: active consumers, foundation excluded) --
$consumerlinks = [];
$activeconsumers = 0;
if (pqh_consumer_schema_ready()) {
    $consumers = $DB->get_records('local_prequran_consumer', ['status' => 'active'], 'name ASC');
    foreach ($consumers as $consumer) {
        if ((string)($consumer->consumer_type ?? '') === 'platform_foundation') {
            continue;
        }
        $activeconsumers++;
        $params = ['consumer' => (string)$consumer->slug];
        $workspaceid = (int)($consumer->primaryworkspaceid ?? 0);
        if ($workspaceid > 0) {
            $params['workspaceid'] = $workspaceid;
        }
        $name = trim((string)$consumer->name) ?: (string)$consumer->slug;
        $publicpath = pqmdl_consumer_path((string)($consumer->defaultpublicpath ?? ''), '/local/hubredirect/consumer_landing.php');
        $dashboardpath = pqmdl_consumer_path((string)($consumer->defaultdashboardpath ?? ''), '/local/hubredirect/workspace_dashboard.php');
        $consumerlinks[] = [$name . ' public page', $publicpath, $params, 'Configured consumer landing page.'];
        $consumerlinks[] = [$name . ' dashboard', $dashboardpath, $params, 'Configured consumer dashboard.'];
    }
}

// -- link directory (verbatim from the page) --
$links = [
    'EduPlatform Foundation' => [
        ['EduPlatform landing', '/local/hubredirect/platform_landing.php', [], 'Foundation public landing page.'],
        ['Platform dashboard', '/local/hubredirect/platform_dashboard.php', [], 'Platform owner dashboard.'],
        ['Consumer manager', '/local/hubredirect/platform_consumers.php', [], 'Manage consumers, domains, workspaces, and status.'],
        ['Onboard institution', '/local/hubredirect/platform_onboard_consumer.php', ['type' => 'institution'], 'Guided institution setup.'],
        ['Platform settings', '/local/hubredirect/platform_settings.php', [], 'Foundation branding and route defaults.'],
        ['Foundation diagnostics', '/local/hubredirect/eduplatform_diagnostics.php', [], 'Host, consumer, domain, workspace, and route checks.'],
    ],
    'Consumers' => $consumerlinks,
    'Workspace Operations' => [
        ['Workspace dashboard', '/local/hubredirect/workspace_dashboard.php', $consumerparams, 'Workspace scoped dashboard.'],
        ['People and assignments', '/local/hubredirect/workspace_people.php', $consumerparams, 'Invite, link, and assign students, parents, teachers, and admins.'],
        ['Workspace reports', '/local/hubredirect/workspace_reports.php', $consumerparams, 'Institution reports and validation data.'],
        ['Workspace materials', '/local/hubredirect/workspace_materials.php', $consumerparams, 'Upload, assign, open, and review materials.'],
        ['Student intake', '/local/hubredirect/student_intake.php', $consumerparams, 'Create or link student and parent accounts.'],
        ['Teacher onboarding', '/local/hubredirect/teacher_intake.php', $consumerparams, 'Create or link teacher accounts.'],
    ],
    'Live Sessions' => [
        ['Live admin menu', '/local/hubredirect/live_admin.php', $consumerparams, 'Live operations hub.'],
        ['Live sessions', '/local/hubredirect/live_sessions.php', $consumerparams, 'Create, start, join, and review live sessions.'],
        ['Teacher workspace', '/local/hubredirect/teacher_workspace.php', $consumerparams, 'Teacher class day workflow.'],
        ['Recurring series', '/local/hubredirect/live_series.php', $consumerparams, 'Recurring schedule management.'],
        ['Recordings admin', '/local/hubredirect/live_recordings_admin.php', $consumerparams, 'Review, publish, and retain recordings.'],
        ['Quality analytics', '/local/hubredirect/live_quality_analytics.php', $consumerparams, 'Quality review summaries and coaching data.'],
        ['Parent trust center', '/local/hubredirect/live_trust.php', $consumerparams, 'Parent-facing live safety and visibility.'],
    ],
    'Intake and Marketplace' => [
        ['Student intake queue', '/local/hubredirect/intake_requests.php', $consumerparams, 'Review student public intake requests.'],
        ['Teacher intake queue', '/local/hubredirect/teacher_intake_requests.php', $consumerparams, 'Review teacher public intake requests.'],
        ['Teacher marketplace admin', '/local/hubredirect/teacher_marketplace_admin.php', $consumerparams, 'Publish profiles and review parent requests.'],
        ['Teacher marketplace profile', '/local/hubredirect/teacher_marketplace_profile.php', $consumerparams, 'Teacher public profile flow.'],
        ['Enrollment approval', '/local/hubredirect/enrollment_approval.php', $consumerparams, 'Approve student and parent enrollment.'],
        ['Institution public profile', '/local/hubredirect/consumer_profile.php', $consumerparams, 'Public consumer profile and inquiry path.'],
    ],
    'Diagnostics' => [
        ['Consumer probe', '/local/hubredirect/consumer_probe.php', [], 'Public host resolution probe.'],
        ['Consumer diagnostics', '/local/hubredirect/consumer_diagnostics.php', [], 'Read-only multi-consumer resolver checks.'],
        ['Final test matrix', '/local/hubredirect/final_test_matrix.php', [], 'Production test matrix for major domains.'],
        ['Live diagnostics', '/local/hubredirect/live_diagnostics.php', $consumerparams, 'Live table and BBB readiness checks.'],
        ['Course debug', '/local/hubredirect/course_debug.php', $consumerparams, 'Course launch/debug support.'],
        ['Access denied page', '/local/hubredirect/access_denied.php', $consumerparams, 'Branded access page preview.'],
    ],
    'Moodle Admin' => [
        ['Site administration', '/admin/index.php', [], 'Moodle administration home.'],
        ['Admin search', '/admin/search.php', [], 'Search Moodle settings.'],
        ['Scheduled tasks', '/admin/tool/task/scheduledtasks.php', [], 'Review scheduled task status.'],
        ['Plugin settings', '/admin/settings.php', ['section' => 'local_prequran'], 'Local Pre-Quraan settings.'],
        ['Account IDs', '/local/hubredirect/account_ids.php', [], 'Lookup Moodle user IDs and Pre-Quraan IDs.'],
        ['SQL tools', '/local/hubredirect/sql_tools.php', [], 'Read-only and maintenance SQL helpers.'],
    ],
];

// Legacy pages already migrated to the token-gated portal: rewrite their URLs
// to portal_launch.php?report=<id> so the click re-mints a scoped token.
// Consumer-configured paths keep their legacy URLs (the per-consumer
// slug/workspaceid params cannot travel through portal_launch).
$portalmap = [
    'workspace_dashboard.php' => 'workspace-dashboard',
    'workspace_people.php' => 'workspace-people',
    'workspace_reports.php' => 'workspace-reports',
    'student_intake.php' => 'student-intake',
    'teacher_intake.php' => 'teacher-intake',
    'live_sessions.php' => 'live-sessions',
    'live_quality_analytics.php' => 'quality-analytics',
    'intake_requests.php' => 'intake-requests',
    'teacher_intake_requests.php' => 'teacher-intake-requests',
];

$sections = [];
$counts = ['links' => 0, 'ready' => 0, 'missing' => 0, 'external' => 0, 'portal' => 0, 'consumers' => $activeconsumers];
foreach ($links as $category => $entries) {
    $rows = [];
    foreach ($entries as $entry) {
        [$label, $path, $params, $description] = $entry;
        $external = !empty($entry[4]);
        $status = pqmdl_status($path, $external);
        $basename = basename((string)$path);
        $portalid = (!$external && $category !== 'Consumers' && isset($portalmap[$basename])) ? $portalmap[$basename] : '';
        $url = $portalid !== ''
            ? $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $portalid
            : pqmdl_url($path, $params, $external);
        $counts['links']++;
        if (isset($counts[$status])) {
            $counts[$status]++;
        }
        if ($portalid !== '') {
            $counts['portal']++;
        }
        $rows[] = [
            'title' => $label,
            'desc' => $description,
            'url' => $url,
            'status' => $status,
            'portal' => $portalid !== '',
        ];
    }
    $sections[] = ['category' => $category, 'links' => $rows];
}

// The page's header action buttons (absolute legacy URLs, session-backed).
$actions = [
    ['title' => 'Platform consumers', 'url' => pqmdl_url('/local/hubredirect/platform_consumers.php'), 'primary' => true],
    ['title' => 'EduPlatform', 'url' => pqmdl_url('/local/hubredirect/platform_landing.php'), 'primary' => false],
    ['title' => 'Role redirect', 'url' => pqmdl_url('/local/hubredirect/role_redirect.php'), 'primary' => false],
    ['title' => 'Logout', 'url' => pqmdl_url('/local/hubredirect/logout.php'), 'primary' => false],
];

echo json_encode([
    'ok' => true,
    'title' => 'Master Dashboard',
    'subtitle' => 'Platform-only directory for EduPlatform, consumers, workspaces, live-session operations, diagnostics, and Moodle administration.',
    'consumer' => [
        'slug' => (string)($consumercontext->consumerslug ?? ''),
        'workspaceid' => (int)($consumercontext->workspaceid ?? 0),
    ],
    'actions' => $actions,
    'sections' => $sections,
    'counts' => $counts,
], JSON_UNESCAPED_SLASHES);
exit;
