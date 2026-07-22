<?php
// Portal handler: enrollment-approval (parent/guardian approves a single
// student's enrollment so lessons can start). Ported from
// local_hubredirect/enrollment_approval.php, which stays live in parallel.
// Runs from portal_data.php AFTER token auth: $claims verified, $USER set to the
// token user, JSON exception handler installed, CORS headers sent.
//
//   GET  ?report=enrollment-approval&token=…&studentid=<id>
//        -> the student's current approval status + declaration state
//   POST ?report=enrollment-approval&token=…  body: {"do":"approve",
//        "studentid":<id>, "approve_enrollment":1, "approval_notes":"…"}
//
// Only the linked parent/guardian (or a site admin) can open or act; the single
// write is the page's pqea_upsert_enrollment_approval() verbatim. There is no
// decline action on the legacy page, so none is ported.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/enrollment_approval_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// ---- entry access check (verbatim logic from the page preamble) --------------
// pqh_access_denied(...) on the page -> pqpd_fail(403, same message) here.
$studentid = optional_param('studentid', 0, PARAM_INT);
$student = $studentid > 0 ? core_user::get_user($studentid) : null;
if (!$student) {
    pqpd_fail(403, 'Choose a valid student before opening the enrollment approval page.');
}

$islinkedparent = pqea_parent_is_linked($studentid, $userid);
if (!$islinkedparent && !is_siteadmin($userid)) {
    pqpd_fail(403, 'Only the linked parent or guardian can approve this enrollment.');
}

// ---- write: approve (legacy POST branch, verbatim) ---------------------------
// confirm_sesskey() dropped: token auth replaces the session key.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    if ($do !== 'approve') {
        pqpd_fail(400, 'Unknown enrollment-approval action.');
    }
    if (!$islinkedparent) {
        pqpd_fail(403, 'This action must be completed by the linked parent or guardian.');
    }
    if (empty($body['approve_enrollment'])) {
        pqpd_fail(400, 'Please tick the declaration before approving enrollment.');
    }
    $notes = trim(clean_param((string)($body['approval_notes'] ?? ''), PARAM_TEXT));
    pqea_upsert_enrollment_approval($studentid, $userid, $notes);
    echo json_encode([
        'ok' => true,
        'message' => 'Enrollment approved. The student can now start lessons.',
        'studentid' => $studentid,
        'status' => 'approved',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// ---- GET: the approval-page state the legacy page renders --------------------
$brand = trim((string)($claims['consumername'] ?? ''));
if ($brand === '') {
    $consumercontext = pqh_requested_consumer_context();
    $brand = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
}
if ($brand === '') {
    $brand = 'EduPlatform';
}
$initials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $brand) ?: 'EP', 0, 2));
$status = pqea_current_status($studentid, $userid);

echo json_encode([
    'ok' => true,
    'ready' => true,
    'brand' => $brand,
    'initials' => $initials,
    'student' => ['id' => $studentid, 'name' => fullname($student)],
    'status' => $status,
    'canapprove' => (bool)$islinkedparent,
], JSON_UNESCAPED_SLASHES);
exit;
