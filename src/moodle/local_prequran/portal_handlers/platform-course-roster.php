<?php
// ---- report: platform-course-roster (platform-wide course offering roster) ----
// Ported from local_hubredirect/platform_course_roster.php via
// platform_course_roster_portallib (pqpcr_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET = every institution course offering with linked Moodle course, seats,
//       dates, visibility, and enrollment-request tallies — the same dataset
//       the page renders (plus consumer/workspace/status/visibility filter
//       options and per-row management links).
// Read-only: the page has no writes (only a CSV export, which is rebuilt
// client-side from this dataset), so POST is rejected.
// (platform_course_roster.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/platform_course_roster_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The platform course roster is read-only.');
}

// -- access: same two-stage gate as the page's
//    pqh_require_platform_operations('Only platform administrators can view the platform course roster.')
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
    pqpd_fail(403, 'Only platform administrators can view the platform course roster.');
}

// ---- GET: the roster rows + stats + filter options (query verbatim via lib) ----
// Filter reads mirror the page preamble's optional_param() calls exactly.
$filters = [
    'consumerid' => optional_param('consumerid', 0, PARAM_INT),
    'workspaceid' => optional_param('workspaceid', 0, PARAM_INT),
    'status' => optional_param('status', '', PARAM_ALPHANUMEXT),
    'visibility' => optional_param('visibility', '', PARAM_ALPHANUMEXT),
    'q' => trim(optional_param('q', '', PARAM_TEXT)),
];
$ready = pqpcr_ready();
$consumers = pqpcr_consumer_options();
$workspaces = pqpcr_workspace_options();
$rows = pqpcr_fetch_rows($filters);

// Aggregate stats — verbatim from the page body.
$stats = [
    'offerings' => count($rows),
    'published' => 0,
    'institutions' => [],
    'approved' => 0,
    'pending' => 0,
    'drop_requested' => 0,
    'dropped' => 0,
    'open' => 0,
];
foreach ($rows as $row) {
    if ((string)$row->status === 'published') {
        $stats['published']++;
    }
    if ((int)$row->workspaceid > 0) {
        $stats['institutions'][(int)$row->workspaceid] = true;
    }
    $stats['approved'] += (int)$row->approvedcount;
    $stats['pending'] += (int)$row->pendingcount;
    $stats['drop_requested'] += (int)$row->droprequestedcount;
    $stats['dropped'] += (int)$row->droppedcount;
    $open = pqpcr_open_seats($row);
    if (ctype_digit($open)) {
        $stats['open'] += (int)$open;
    }
}

// Decorate each row for the client the same way the page renders it (labels,
// status classes, Moodle visibility, and the per-workspace management links).
$rowsout = [];
foreach ($rows as $row) {
    $workspaceparams = ['workspaceid' => (int)$row->workspaceid];
    if (trim((string)($row->consumerslug ?? '')) !== '') {
        $workspaceparams['consumer'] = (string)$row->consumerslug;
    }
    $moodlestatus = (int)($row->moodlevisible ?? 0) === 1 ? 'visible' : 'hidden';
    $rowsout[] = [
        'offeringid' => (int)$row->offeringid,
        'workspaceid' => (int)$row->workspaceid,
        'workspacename' => (string)($row->workspacename ?? ''),
        'consumername' => (string)($row->consumername ?? ''),
        'consumerslug' => (string)($row->consumerslug ?? ''),
        'title' => (string)$row->title,
        'course_key' => (string)$row->course_key,
        'summary' => (string)$row->summary,
        'summary_short' => pqpcr_short((string)$row->summary),
        'syllabus' => (string)$row->syllabus,
        'prerequisites' => (string)$row->prerequisites,
        'moodlecourseid' => (int)$row->moodlecourseid,
        'moodlefullname' => (string)($row->moodlefullname ?? ''),
        'moodleshortname' => (string)($row->moodleshortname ?? ''),
        'moodlecategory' => (string)($row->moodlecategory ?? ''),
        'moodlevisible' => (int)($row->moodlevisible ?? 0),
        'moodlestatus' => $moodlestatus,
        'startdate' => (int)$row->startdate,
        'enddate' => (int)$row->enddate,
        'startdate_label' => pqpcr_date_label((int)$row->startdate),
        'enddate_label' => pqpcr_date_label((int)$row->enddate),
        'capacity' => (int)$row->capacity,
        'approval_mode' => (string)$row->approval_mode,
        'status' => (string)$row->status,
        'status_class' => pqpcr_status_class((string)$row->status),
        'visibility' => (string)$row->visibility,
        'visibility_class' => pqpcr_status_class((string)$row->visibility),
        'approvedcount' => (int)$row->approvedcount,
        'pendingcount' => (int)$row->pendingcount,
        'droprequestedcount' => (int)$row->droprequestedcount,
        'droppedcount' => (int)$row->droppedcount,
        'requestcount' => (int)$row->requestcount,
        'open_seats' => pqpcr_open_seats($row),
        'updated_label' => (int)$row->timemodified > 0
            ? userdate((int)$row->timemodified, get_string('strftimedatetimeshort')) : '',
        'manage_url' => (int)$row->workspaceid > 0
            ? (new moodle_url('/local/hubredirect/course_offerings.php', $workspaceparams + ['editid' => (int)$row->offeringid]))->out(false)
            : '',
        'catalog_url' => (int)$row->workspaceid > 0
            ? (new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams))->out(false)
            : '',
    ];
}

$consumersout = [];
foreach ($consumers as $consumer) {
    $consumersout[] = ['id' => (int)$consumer->id, 'name' => (string)$consumer->name];
}
$workspacesout = [];
foreach ($workspaces as $workspace) {
    $workspacesout[] = ['id' => (int)$workspace->id, 'name' => (string)$workspace->name];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'filters' => [
        'consumerid' => (int)$filters['consumerid'],
        'workspaceid' => (int)$filters['workspaceid'],
        'status' => (string)$filters['status'],
        'visibility' => (string)$filters['visibility'],
        'q' => (string)$filters['q'],
    ],
    'stats' => [
        'offerings' => (int)$stats['offerings'],
        'published' => (int)$stats['published'],
        'institutions' => count($stats['institutions']),
        'approved' => (int)$stats['approved'],
        'pending' => (int)$stats['pending'],
        'drop_requested' => (int)$stats['drop_requested'],
        'dropped' => (int)$stats['dropped'],
        'open' => (int)$stats['open'],
    ],
    'rows' => $rowsout,
    'consumers' => $consumersout,
    'workspaces' => $workspacesout,
    'statusoptions' => pqco_status_options(),
    'visibilityoptions' => pqco_visibility_options(),
    'toplinks' => [
        'dashboard' => (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false),
        'user_roster' => (new moodle_url('/local/hubredirect/platform_user_roster.php'))->out(false),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/platform_course_roster.php',
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
