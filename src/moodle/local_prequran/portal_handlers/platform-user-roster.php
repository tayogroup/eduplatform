<?php
// ---- report: platform-user-roster (platform-wide user roster/report; read-only) ----
// Ported from local_hubredirect/platform_user_roster.php via
// platform_user_roster_portallib (pqpur_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the roster dataset the legacy page renders (member + independent-teacher
//        rows decorated with Moodle courses, course offerings, assignment counts,
//        server-side fullname + account labels) plus the page's filter option
//        lists and summary stats.
// POST = rejected with 400: the legacy page is read-only. Its only non-render
//        path is the export=csv download, which the portal page builds
//        client-side from the same roster rows (quality-analytics pattern).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/platform_user_roster_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same two-stage gate as the page's
//    pqh_require_platform_operations('Only platform administrators can view the platform user roster.')
//    (foundation-domain check, then academy-operations check), with
//    pqh_access_denied's redirects replaced by pqpd_fail(403, same message). --
$consumercontext = pqh_current_consumer_context();
$isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
    && !empty($consumercontext->trusted_domain);
if (!$isfoundationdomain) {
    pqpd_fail(403, 'EduPlatform administration is only available from the EduPlatform foundation domain.');
}
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only platform administrators can view the platform user roster.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Legacy page is read-only; the CSV export is rebuilt client-side.
    pqpd_fail(400, 'Platform user roster is read-only.');
}

// -- GET: the roster dataset (same filter parsing as the page) --
$filters = [
    'consumerid' => optional_param('consumerid', 0, PARAM_INT),
    'workspaceid' => optional_param('workspaceid', 0, PARAM_INT),
    'role' => optional_param('role', '', PARAM_ALPHANUMEXT),
    'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
    'q' => optional_param('q', '', PARAM_TEXT),
];

$schemaready = pqpur_schema_ready();
$rows = pqpur_build_rows($filters);

// Decorate each row down to the whitelist of fields the page renders inline (the
// table cells + the CSV columns). fullname() and pqh_account_no_* are PHP-only,
// so they are resolved server-side here.
$nameids = [];
$rowsout = [];
foreach ($rows as $row) {
    $nameids[] = (int)$row->userid;
    $rowsout[] = [
        'rosterid' => (int)($row->rosterid ?? 0),
        'consumerid' => (int)($row->consumerid ?? 0),
        'consumername' => (string)($row->consumername ?? ''),
        'consumer_type' => (string)($row->consumer_type ?? ''),
        'consumer_type_label' => pqpur_consumer_type_label((string)($row->consumer_type ?? '')),
        'workspaceid' => (int)($row->workspaceid ?? 0),
        'workspacename' => (string)($row->workspacename ?? ''),
        'workspace_type' => (string)($row->workspace_type ?? ''),
        'rosterrole' => (string)$row->rosterrole,
        'role_label' => pqpur_role_label((string)$row->rosterrole),
        'rosterstatus' => (string)$row->rosterstatus,
        'status_class' => pqpur_status_class((string)$row->rosterstatus),
        'rosterupdated' => (int)$row->rosterupdated,
        'userid' => (int)$row->userid,
        'fullname' => (string)$row->fullname,
        'username' => (string)$row->username,
        'email' => (string)$row->email,
        'account_label' => pqh_account_no_label($row),
        'account_no' => pqh_account_no_value($row),
        'moodlecourses' => array_values((array)$row->moodlecourses),
        'offeringactive' => array_values((array)$row->offeringactive),
        'offeringpending' => array_values((array)$row->offeringpending),
        'offeringall' => array_values((array)$row->offeringall),
        'assignedstudents' => (int)$row->assignedstudents,
        'assignedteachers' => (int)$row->assignedteachers,
    ];
}

// Filter option lists exactly as the page builds them.
$consumersout = [];
foreach (pqpur_consumer_options() as $consumer) {
    $consumersout[] = [
        'id' => (int)$consumer->id,
        'name' => (string)$consumer->name,
        'slug' => (string)$consumer->slug,
        'consumer_type' => (string)$consumer->consumer_type,
        'consumer_type_label' => pqpur_consumer_type_label((string)$consumer->consumer_type),
        'status' => (string)$consumer->status,
    ];
}
$workspacesout = [];
foreach (pqpur_workspace_options() as $workspace) {
    $workspacesout[] = [
        'id' => (int)$workspace->id,
        'name' => (string)$workspace->name,
        'slug' => (string)$workspace->slug,
        'workspace_type' => (string)$workspace->workspace_type,
        'status' => (string)$workspace->status,
    ];
}
$roles = ['' => 'All roles', 'independent_teacher' => 'Independent teacher'] + pqh_workspace_roles();
$statuses = ['' => 'All statuses', 'active' => 'Active', 'inactive' => 'Inactive', 'archived' => 'Archived'];

$stats = [
    'rows' => count($rows),
    'users' => count(array_unique(array_map(static fn($row): int => (int)$row->userid, $rows))),
    'consumers' => count(array_unique(array_filter(array_map(static fn($row): int => (int)($row->consumerid ?? 0), $rows)))),
    'workspaces' => count(array_unique(array_filter(array_map(static fn($row): int => (int)($row->workspaceid ?? 0), $rows)))),
];

echo json_encode([
    'ok' => true,
    'ready' => $schemaready,
    'schema_ready' => $schemaready,
    'filters' => [
        'consumerid' => (int)$filters['consumerid'],
        'workspaceid' => (int)$filters['workspaceid'],
        'role' => (string)$filters['role'],
        'status' => (string)$filters['status'],
        'q' => (string)$filters['q'],
    ],
    'rows' => $rowsout,
    'stats' => $stats,
    'options' => [
        'consumers' => $consumersout,
        'workspaces' => $workspacesout,
        'roles' => $roles,
        'statuses' => $statuses,
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/platform_user_roster.php',
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
