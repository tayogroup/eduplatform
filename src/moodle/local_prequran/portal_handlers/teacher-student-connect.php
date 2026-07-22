<?php
// ---- report: teacher-student-connect (independent-teacher find/invite) -------
// Ported from local_hubredirect/teacher_student_connect.php via
// teacher_student_connect_portallib (pqtscl_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent.
// GET  = exact-identifier student search (?q=) plus workspace/brand context
//        and the legacy dashboard / new-student-intake URLs. Consumer context
//        comes from the same request params the page reads
//        (?consumer=<slug>&workspaceid=) via pqh_requested_consumer_context().
// POST = do=request_connection: the page's single POST write verbatim
//        (pqtscl_request_connection: request-table check, student-profile
//        check, workspace guard, active-connection duplicate guard,
//        existing-open-request reuse, linked-parent lookup). confirm_sesskey()
//        dropped: token auth replaces the session key. The page rendered the
//        success/error message inline; the portal returns the same wording as
//        JSON.
// (teacher_student_connect.php has no pqh_live_security_audit calls — none to
// keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/account_ids.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_student_connect_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// Legacy entry checks — same order and same denial wording as the page
// (require_login is replaced by the verified portal token).
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'Marketplace';
$isindependentteacher = pqh_has_independent_teacher_profile($userid);
if (!$isindependentteacher) {
    pqpd_fail(403, 'Only approved independent teachers can find or invite students from this page.');
}

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = $requestedworkspaceid > 0
    ? $requestedworkspaceid
    : pqh_current_workspace_id($userid, (int)($consumercontext->workspaceid ?? 0));
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'An active independent-teacher workspace is required before connecting students.');
}

$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: request_connection (legacy POST studentid=…, verbatim) --------
    if ($do === 'request_connection') {
        try {
            // confirm_sesskey() dropped: token auth replaces the session key.
            $studentid = (int)($body['studentid'] ?? 0);
            $requestid = pqtscl_request_connection(
                $userid,
                $studentid,
                (int)($consumercontext->consumerid ?? 0),
                $workspaceid
            );
            echo json_encode([
                'ok' => true,
                'message' => 'Connection request #' . $requestid . ' was submitted. The existing student record was not duplicated or changed.',
                'requestid' => $requestid,
                'studentid' => $studentid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            pqpd_fail(400, 'Connection request was not submitted: ' . $e->getMessage());
        }
    }

    pqpd_fail(400, 'Unknown teacher-student-connect action.');
}

// -- GET: exact-identifier search (same resolution order as the page) ----------
$query = trim(optional_param('q', '', PARAM_TEXT));
$matches = $query !== '' ? pqtscl_exact_matches($query) : [];

// Same display resolution the page performs inline on each match card.
$matchesout = [];
foreach ($matches as $match) {
    $matchesout[] = [
        'id' => (int)$match->id,
        'name' => trim((string)$match->student_display_name) !== '' ? (string)$match->student_display_name : fullname($match),
        'account' => trim((string)$match->idnumber) !== '' ? (string)$match->idnumber : 'not assigned',
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'brandname' => $brandname,
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'consumerslug' => (string)($consumercontext->consumerslug ?? ''),
    'query' => $query,
    'matches' => $matchesout,
    'dashboardurl' => (new moodle_url('/local/hubredirect/dashboard.php', $urlparams))->out(false),
    'intakeurl' => (new moodle_url('/local/hubredirect/student_intake.php', $urlparams + ['mode' => 'new']))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
