<?php
// Portal handler: course-student-history (workspace-admin view of every course
// request and enrollment lifecycle event by student). Ported query-for-query
// from local_hubredirect/course_student_history.php, which stays live in
// parallel. Runs from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, CORS headers
// sent.
//
//   GET ?report=course-student-history&token=…[&workspaceid=&consumer=&studentid=&q=]
//
// Read-only: the page has no writes, so POST is rejected.
// (course_student_history.php has no pqh_live_security_audit calls — none to
// keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcriptlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_student_history_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The student course history report is read-only.');
}

// ---- entry access check (verbatim logic from the page preamble) --------------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$studentfilter = optional_param('studentid', 0, PARAM_INT);
$q = trim(optional_param('q', '', PARAM_TEXT));
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can view student course history.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// ---- GET: the history rows (filters + query verbatim from the page) ----------
$where = ['r.workspaceid = :workspaceid'];
$params = ['workspaceid' => $workspaceid];
if ($studentfilter > 0) {
    $where[] = 'r.studentid = :studentid';
    $params['studentid'] = $studentfilter;
}
if ($q !== '') {
    $like = '%' . $DB->sql_like_escape($q) . '%';
    $where[] = '(' . $DB->sql_like('u.firstname', ':qfirst', false) . ' OR ' . $DB->sql_like('u.lastname', ':qlast', false) . ' OR ' . $DB->sql_like('u.email', ':qemail', false) . ' OR ' . $DB->sql_like('u.idnumber', ':qidnumber', false) . ' OR ' . $DB->sql_like('o.title', ':qtitle', false) . ')';
    $params += ['qfirst' => $like, 'qlast' => $like, 'qemail' => $like, 'qidnumber' => $like, 'qtitle' => $like];
}

$ready = pqco_table_ready();
$rows = [];
if ($ready) {
    $rows = array_values($DB->get_records_sql(
        "SELECT r.*, o.title AS offering_title, o.course_key, o.moodlecourseid,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_course_enrol_req} r
           JOIN {local_prequran_course_offering} o ON o.id = r.offeringid
           JOIN {user} u ON u.id = r.studentid
          WHERE " . implode(' AND ', $where) . "
       ORDER BY u.lastname ASC, u.firstname ASC, r.timecreated DESC",
        $params,
        0,
        500
    ));
}

// Decorate for the client with the same helpers the page calls while rendering
// (fullname/account label/status label + the per-student legacy link targets).
foreach ($rows as $row) {
    $row->student_name = fullname($row);
    $row->account_label = pqh_account_no_label($row);
    $row->status_label = pqco_request_status_label((string)$row->status);
    $row->transcript_url = pqct_transcript_url((int)$row->studentid, $workspaceid, $consumercontext)->out(false);
    $row->finance_url = (new moodle_url('/local/hubredirect/student_finance.php', $urlparams + ['studentid' => (int)$row->studentid]))->out(false);
}

$links = [
    'course_offerings' => (new moodle_url('/local/hubredirect/course_offerings.php', $urlparams))->out(false),
    'workspace_dashboard' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false),
];

$nameids = [];
foreach ($rows as $row) {
    $nameids[] = (int)($row->studentid ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => $ready,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'consumer' => ['slug' => (string)($consumercontext->consumerslug ?? '')],
    'filters' => ['studentid' => $studentfilter, 'q' => $q],
    'rows' => $rows,
    'links' => $links,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
