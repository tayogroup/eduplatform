<?php
// ---- report: student-parent-portal (family account overview; read-only) ------
// Ported from local_hubredirect/student_parent_portal.php via
// student_parent_portallib (pqsppl_*, the page's single inline function
// pqsp_child_ids extracted verbatim). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent. The legacy page stays live in parallel and
// is untouched.
// GET  = everything the page renders for one linked student: enrolled live
//        class sessions with attendance, invoices, payments, payment plans,
//        published course grades, secure document downloads, and the
//        self-service links — plus the linked-children list so the portal
//        page can offer the same studentid switch the page's URL parameter
//        provides. Transcript / finance / workspace links stay on the legacy
//        Moodle pages (none of them is portal-migrated yet), exactly as
//        dashboard.html does for unmigrated targets.
// POST = none: the page performs no writes (no data_submitted/sesskey block),
//        so any POST is rejected.
// (student_parent_portal.php has no pqh_live_security_audit calls — none to
// keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/workflow_documentlib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_parent_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Unknown student-parent-portal action.');
}

// ---- Access + student resolution (student_parent_portal.php lines 34-49) -----
// Same order and outcomes as the legacy ENTRY check; pqh_access_denied()
// redirects become 403 JSON failures with the page's exact messages.
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', 0, PARAM_INT));
$role = $workspaceid > 0 ? pqh_user_workspace_role($userid, $workspaceid) : '';
if ($workspaceid <= 0 || !in_array($role, ['platform_admin', 'owner', 'admin', 'student', 'parent', 'sponsor'], true)) {
    pqpd_fail(403, 'Student and parent portal requires student, parent, sponsor, or workspace administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$childids = pqsppl_child_ids($workspaceid, $userid);
if (pqh_user_can_manage_workspace($userid, $workspaceid) && optional_param('studentid', 0, PARAM_INT) > 0) {
    $childids = [optional_param('studentid', 0, PARAM_INT)];
}
$studentid = optional_param('studentid', $childids[0] ?? $userid, PARAM_INT);
if (!in_array($studentid, $childids, true) && !pqh_user_can_manage_workspace($userid, $workspaceid) && $role !== 'sponsor') {
    pqpd_fail(403, 'That student is not linked to your portal.');
}
$student = core_user::get_user($studentid, 'id,firstname,lastname,email', IGNORE_MISSING);
$urlparams = ['workspaceid' => $workspaceid, 'studentid' => $studentid];

// ---- GET: the datasets the page renders (lines 51-67, verbatim) --------------
$sessions = pqh_table_exists_safe('local_prequran_live_session') ? array_values($DB->get_records_sql(
    "SELECT s.*, a.attendance_status
       FROM {local_prequran_live_session} s
       JOIN {local_prequran_live_participant} p ON p.sessionid = s.id AND p.role = 'student' AND p.status = 'active'
  LEFT JOIN {local_prequran_live_attendance} a ON a.sessionid = s.id AND a.studentid = :astudentid
      WHERE s.workspaceid = :workspaceid
        AND (p.studentid = :studentid OR p.userid = :userid)
   ORDER BY s.scheduled_start DESC",
    ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'userid' => $studentid, 'astudentid' => $studentid],
    0,
    20
)) : [];
$invoices = pqh_table_exists_safe('local_prequran_invoice') ? array_values($DB->get_records('local_prequran_invoice', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'issuedat DESC, id DESC', '*', 0, 20)) : [];
$payments = pqh_table_exists_safe('local_prequran_payment') ? array_values($DB->get_records('local_prequran_payment', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'receivedat DESC, id DESC', '*', 0, 20)) : [];
$plans = pqh_table_exists_safe('local_prequran_payment_plan') ? array_values($DB->get_records('local_prequran_payment_plan', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'timecreated DESC', '*', 0, 20)) : [];
$grades = pqh_table_exists_safe('local_prequran_course_grade') ? array_values($DB->get_records('local_prequran_course_grade', ['workspaceid' => $workspaceid, 'studentid' => $studentid], 'publishedat DESC, id DESC', '*', 0, 20)) : [];
$documents = pqh_table_exists_safe('local_prequran_document') ? array_values($DB->get_records_select('local_prequran_document', 'workspaceid = :workspaceid AND studentid = :studentid AND status <> :archived', ['workspaceid' => $workspaceid, 'studentid' => $studentid, 'archived' => 'archived'], 'timemodified DESC', '*', 0, 40)) : [];

// Decorate for the client (schedule label, attendance pill value, secure
// download URL — the same values the page renders inline).
foreach ($sessions as $session) {
    $session->scheduled_start_label = userdate((int)$session->scheduled_start);
    $session->attendance_label = (string)($session->attendance_status ?? $session->status);
}
$documentsout = [];
foreach ($documents as $doc) {
    $documentsout[] = [
        'id' => (int)$doc->id,
        'title' => (string)$doc->title,
        'document_type' => (string)$doc->document_type,
        'verification_status' => (string)$doc->verification_status,
        'download_url' => pqwdoc_download_url($doc),
    ];
}
$nameids = array_merge([$userid, $studentid], $childids);
$names = pqpd_names($nameids);
$childrenout = [];
foreach ($childids as $childid) {
    $childrenout[] = [
        'studentid' => (int)$childid,
        'name' => $names[(int)$childid] ?? ('Student #' . (int)$childid),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'workspacename' => (string)$workspace->name,
    'role' => $role,
    'student' => [
        'id' => $studentid,
        'name' => $student ? fullname($student) : ('Student #' . $studentid),
    ],
    'children' => $childrenout,
    'sessions' => $sessions,
    'invoices' => $invoices,
    'payments' => $payments,
    'plans' => $plans,
    'grades' => $grades,
    'documents' => $documentsout,
    'urls' => [
        'transcript' => $CFG->wwwroot . '/local/hubredirect/course_transcript.php?' . http_build_query($urlparams),
        'transcriptpdf' => $CFG->wwwroot . '/local/hubredirect/course_transcript_export.php?' . http_build_query($urlparams + ['format' => 'pdf']),
        'finance' => $CFG->wwwroot . '/local/hubredirect/student_finance.php?' . http_build_query($urlparams),
        'workspace' => $CFG->wwwroot . '/local/hubredirect/workspace_dashboard.php?' . http_build_query(['workspaceid' => $workspaceid]),
    ],
    'names' => $names,
], JSON_UNESCAPED_SLASHES);
exit;
