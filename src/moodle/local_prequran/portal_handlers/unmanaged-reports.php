<?php
// ---- report: unmanaged-reports (unmanaged student directory; read-only) ----
// Ported from local_hubredirect/unmanaged_reports.php via
// unmanaged_reports_portallib (pqurl_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers already sent. The legacy page is read-only (no
// writes), so GET returns the unmanaged student rows exactly as the page
// renders them — account label + profile context precomputed server-side — and
// POST is rejected 400. This report intentionally excludes progress, tracking,
// focus, quiz, and recording metrics, identical to the page.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/unmanaged_reports_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- entry access check (verbatim gate from unmanaged_reports.php) ------------
// The page's pqh_access_denied(...) becomes pqpd_fail(403, same message).
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Unmanaged student reports are available to academy operations users only.');
}

// Read-only report: the legacy page performs no writes.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Unmanaged student reports are read-only.');
}

// -- GET: unmanaged student rows (same filters + limit clamp as the page) -----
$search = optional_param('q', '', PARAM_TEXT);
$courseid = optional_param('courseid', 0, PARAM_INT);
$groupid = optional_param('groupid', 0, PARAM_INT);
$limit = optional_param('limit', 100, PARAM_INT);
$limit = max(25, min(250, $limit));
$candidates = pqurl_candidate_users($search, $courseid, $groupid, $limit);

$rows = [];
$nameids = [];
foreach ($candidates as $row) {
    $profile = $row['profile'];
    // Profile Context bits — the exact array_filter the page renders.
    $profilebits = array_values(array_filter([
        pqurl_profile_field($profile, 'course_type') !== '' ? 'Course: ' . pqurl_profile_field($profile, 'course_type') : '',
        pqurl_profile_field($profile, 'current_level') !== '' ? 'Level: ' . pqurl_profile_field($profile, 'current_level') : '',
        pqurl_profile_field($profile, 'timezone') !== '' ? 'TZ: ' . pqurl_profile_field($profile, 'timezone') : '',
        pqurl_profile_field($profile, 'country') !== '' ? 'Country: ' . pqurl_profile_field($profile, 'country') : '',
        pqurl_profile_field($profile, 'city') !== '' ? 'City: ' . pqurl_profile_field($profile, 'city') : '',
    ]));
    $rows[] = [
        'userid' => $row['userid'],
        'fullname' => $row['fullname'],
        'username' => $row['username'],
        'idnumber' => $row['idnumber'],
        'email' => $row['email'],
        'suspended' => $row['suspended'],
        'lastaccess' => $row['lastaccess'],
        // userdate/account label need server-side helpers — precompute as the page does.
        'lastaccess_label' => (int)$row['lastaccess'] > 0 ? userdate((int)$row['lastaccess'], get_string('strftimedatetimeshort')) : 'never',
        'account_label' => pqh_account_no_label((object)['userid' => $row['userid'], 'idnumber' => $row['idnumber']]),
        'courses' => $row['courses'],
        'groups' => $row['groups'],
        'profilebits' => $profilebits,
    ];
    $nameids[] = (int)$row['userid'];
}

// Course + class-group filter option lists (verbatim from the page).
$courses = $DB->get_records_sql(
    "SELECT DISTINCT c.id, c.fullname, c.shortname
       FROM {course} c
       JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = :coursecontext
       JOIN {role_assignments} ra ON ra.contextid = ctx.id
       JOIN {role} r ON r.id = ra.roleid
      WHERE c.id <> :sitecourse
        AND (r.shortname = :studentshortname OR r.archetype = :studentarchetype)
   ORDER BY c.fullname ASC",
    [
        'coursecontext' => CONTEXT_COURSE,
        'sitecourse' => SITEID,
        'studentshortname' => 'student',
        'studentarchetype' => 'student',
    ],
    0,
    500
);
$classgroups = pqurl_table_exists('local_prequran_class_group')
    ? $DB->get_records_select('local_prequran_class_group', "status <> ?", ['archived'], 'title ASC', 'id, title, course_type, current_level, status')
    : [];

$courseoptions = [];
foreach ($courses as $course) {
    $courseoptions[] = ['id' => (int)$course->id, 'fullname' => (string)$course->fullname];
}
$groupoptions = [];
foreach ($classgroups as $group) {
    $groupoptions[] = ['id' => (int)$group->id, 'title' => (string)$group->title];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'filters' => ['q' => $search, 'courseid' => $courseid, 'groupid' => $groupid, 'limit' => $limit],
    'courses' => $courseoptions,
    'groups' => $groupoptions,
    'rows' => $rows,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
