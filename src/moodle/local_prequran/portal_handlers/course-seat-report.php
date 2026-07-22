<?php
// Portal handler: course-seat-report (workspace-admin seat utilization by
// offering). Ported query-for-query from
// local_hubredirect/course_seat_report.php, which stays live in parallel.
// Runs from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, CORS headers sent.
//
//   GET ?report=course-seat-report&token=…[&workspaceid=&consumer=]
//
// Read-only: the page has no writes, so POST is rejected.
// (course_seat_report.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_seat_report_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The course seat report is read-only.');
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
    pqpd_fail(403, 'Only workspace admins can view course seat reports.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// ---- GET: the seat utilization rows (query verbatim from the page) -----------
$ready = pqco_table_ready();
$rows = [];
if ($ready) {
    $rows = array_values($DB->get_records_sql(
        "SELECT o.id AS offeringid, o.title, o.course_key, o.capacity, o.status, o.visibility, o.startdate, o.enddate,
                COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS activecount,
                COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pendingcount,
                COUNT(CASE WHEN r.status = 'drop_requested' THEN 1 END) AS droprequestedcount,
                COUNT(CASE WHEN r.status = 'dropped' THEN 1 END) AS droppedcount,
                COUNT(r.id) AS totalrequests
           FROM {local_prequran_course_offering} o
      LEFT JOIN {local_prequran_course_enrol_req} r ON r.offeringid = o.id
          WHERE o.workspaceid = :workspaceid
       GROUP BY o.id, o.title, o.course_key, o.capacity, o.status, o.visibility, o.startdate, o.enddate
       ORDER BY o.status ASC, o.startdate ASC, o.title ASC",
        ['workspaceid' => $workspaceid]
    ));
}

// The page's nav links to the legacy management pages (session still valid
// there under parallel-run).
$links = [
    'course_offerings' => (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false),
    'workspace_dashboard' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false),
];

echo json_encode([
    'ok' => true, 'ready' => $ready,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'consumer' => ['slug' => (string)($consumercontext->consumerslug ?? '')],
    'rows' => $rows,
    'links' => $links,
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
