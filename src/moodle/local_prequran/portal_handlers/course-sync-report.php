<?php
// Portal handler: course-sync-report (workspace-admin view of approved
// requests waiting for Moodle enrollment and offerings with linked-course
// setup issues). Ported query-for-query from
// local_hubredirect/course_sync_report.php via course_sync_report_portallib
// (pqcsyncl_*). The legacy page stays live in parallel. Runs from
// portal_data.php AFTER token auth: $claims verified, $USER set to the token
// user, JSON exception handler installed, CORS headers sent.
//
//   GET ?report=course-sync-report&token=…[&workspaceid=&consumer=]
//
// Read-only: the page has no writes — its "Retry from requests" / "Edit
// offering" actions are links into course_offerings.php (returned per row as
// retry_url / edit_url), so POST is rejected.
// (course_sync_report.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_sync_report_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The course Moodle sync report is read-only.');
}

// ---- entry access check (verbatim logic from the page preamble) --------------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can view course sync reports.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// ---- GET: pending-sync requests + link issues (queries verbatim) -------------
$ready = pqco_table_ready();
$pending = [];
$linkissues = [];
if ($ready) {
    $pending = array_values($DB->get_records_sql(
        "SELECT r.*, o.title AS offering_title, o.course_key, o.moodlecourseid,
                u.firstname, u.lastname, u.email, u.idnumber,
                c.fullname AS moodle_fullname, c.visible AS moodle_visible,
                e.id AS manualenrolid, e.status AS manualstatus
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {user} u ON u.id = r.studentid
      LEFT JOIN {course} c ON c.id = o.moodlecourseid
      LEFT JOIN {enrol} e ON e.courseid = c.id AND e.enrol = 'manual'
          WHERE r.workspaceid = :workspaceid
            AND r.status = 'approved'
            AND COALESCE(r.moodleenrolledat, 0) = 0
       ORDER BY r.approvedat ASC, r.timecreated ASC",
        ['workspaceid' => $workspaceid],
        0,
        300
    ));
    $linkissues = array_values($DB->get_records_sql(
        "SELECT o.id AS offeringid, o.title, o.course_key, o.moodlecourseid, o.status,
                c.fullname AS moodle_fullname, c.visible AS moodle_visible,
                e.id AS manualenrolid, e.status AS manualstatus
           FROM {local_prequran_course_offering} o
      LEFT JOIN {course} c ON c.id = o.moodlecourseid
      LEFT JOIN {enrol} e ON e.courseid = c.id AND e.enrol = 'manual'
          WHERE o.workspaceid = :workspaceid
            AND (o.moodlecourseid <= 0 OR c.id IS NULL OR c.visible = 0 OR e.id IS NULL OR e.status <> 0)
       ORDER BY o.status ASC, o.title ASC",
        ['workspaceid' => $workspaceid],
        0,
        300
    ));
}

// Decorate for the client with the same helpers the page calls while rendering
// (fullname/account label/setup label + the legacy action-link targets).
foreach ($pending as $row) {
    $row->student_name = fullname($row);
    $row->account_label = pqh_account_no_label($row);
    $row->manual_label = pqcsyncl_manual_label($row);
    $row->retry_url = (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['request_status' => 'approved', 'request_offeringid' => (int)$row->offeringid]))->out(false);
}
foreach ($linkissues as $row) {
    $row->manual_label = pqcsyncl_manual_label($row);
    $row->edit_url = (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams + ['editid' => (int)$row->offeringid]))->out(false);
}

$links = [
    'course_offerings' => (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false),
    'workspace_dashboard' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false),
];

$nameids = [];
foreach ($pending as $row) {
    $nameids[] = (int)($row->studentid ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => $ready,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'consumer' => ['slug' => (string)($consumercontext->consumerslug ?? '')],
    'pending' => $pending,
    'linkissues' => $linkissues,
    'links' => $links,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
