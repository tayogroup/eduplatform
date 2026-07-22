<?php
// ---- report: scholarship-portal (need-based aid intake + review; read + writes) ----
// Ported from local_hubredirect/scholarship_portal.php. The page defines no
// functions of its own, so the query/write layer is the shared library
// scholarship_sponsorlib.php (pqss_*, which itself pulls in finance_lib.php for
// pqfin_*); nothing is copied — we require_once the real libs. Included from
// portal_data.php AFTER token auth: $claims verified, $USER set to the token
// user, JSON exception handler installed, headers sent.
// GET  = what the page renders: workspace/consumer context, the student picker,
//        scholarship-eligible offerings, and the applications table projected
//        onto EXACTLY the columns the page prints (money values are the
//        pre-formatted pqfin strings — raw rows are never dumped). +names.
// POST = do=submit_application (student/parent/finance intake write, verbatim)
//        or do=review_application (finance-only decision + award write, verbatim).
//        confirm_sesskey() dropped: token auth replaces the session key.
// (scholarship_portal.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/scholarship_sponsorlib.php');
require_once($CFG->dirroot . '/local/hubredirect/scholarship_portal_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from scholarship_portal.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$role = $workspaceid > 0 ? pqh_user_workspace_role($userid, $workspaceid) : '';
$canmanage = $workspaceid > 0 && (pqh_user_can_manage_workspace($userid, $workspaceid) || pqh_user_has_workspace_capability($userid, $workspaceid, 'finance.manage'));
if ($workspaceid <= 0 || (!$canmanage && !in_array($role, ['student', 'parent'], true))) {
    pqpd_fail(403, 'Scholarship applications require student, parent, or finance access.');
}
if (!pqss_schema_ready()) {
    pqpd_fail(403, 'Scholarship application schema is not ready. Run the local_prequran upgrade first.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    try {
        // -- write: submit_application (legacy action=submit_application, verbatim) --
        if ($do === 'submit_application') {
            $studentid = (int)($body['studentid'] ?? 0);
            if ($studentid <= 0) {
                pqpd_fail(403, 'Choose a valid student before submitting a scholarship application.');
            }
            $applicationid = pqss_create_scholarship_application($workspaceid, $consumercontext, $userid, [
                'studentid' => $studentid,
                'offeringid' => (int)($body['offeringid'] ?? 0),
                'invoiceid' => (int)($body['invoiceid'] ?? 0),
                'currency' => clean_param((string)($body['currency'] ?? pqfin_default_currency()), PARAM_ALPHANUMEXT),
                'requestedamount' => clean_param((string)($body['requestedamount'] ?? '0.00'), PARAM_TEXT),
                'needlevel' => clean_param((string)($body['needlevel'] ?? 'standard'), PARAM_ALPHANUMEXT),
                'fundingpreference' => clean_param((string)($body['fundingpreference'] ?? ''), PARAM_TEXT),
                'householdnote' => clean_param((string)($body['householdnote'] ?? ''), PARAM_TEXT),
                'academicnote' => clean_param((string)($body['academicnote'] ?? ''), PARAM_TEXT),
                'documentnote' => clean_param((string)($body['documentnote'] ?? ''), PARAM_TEXT),
            ]);
            echo json_encode([
                'ok' => true,
                'message' => 'Scholarship application #' . $applicationid . ' submitted.',
                'applicationid' => (int)$applicationid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }

        // -- write: review_application (legacy action=review_application, verbatim) --
        if ($do === 'review_application') {
            $applicationid = (int)($body['applicationid'] ?? 0);
            $status = clean_param((string)($body['status'] ?? ''), PARAM_ALPHANUMEXT);
            if ($applicationid <= 0) {
                pqpd_fail(403, 'Choose a valid application before reviewing.');
            }
            $awardid = pqss_review_scholarship_application(
                $applicationid,
                $workspaceid,
                $consumercontext,
                $userid,
                $status,
                clean_param((string)($body['decisionnote'] ?? ''), PARAM_TEXT),
                (int)($body['invoiceid'] ?? 0)
            );
            echo json_encode([
                'ok' => true,
                'message' => 'Scholarship application reviewed.',
                'applicationid' => $applicationid,
                'awardid' => (int)$awardid,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        }
    } catch (Throwable $e) {
        // The page shows $e->getMessage() inline; mirror that as a clean 400.
        pqpd_fail(400, $e->getMessage());
    }

    pqpd_fail(400, 'Unknown scholarship-portal action.');
}

// -- GET: same loads as the page --
$studentids = pqss_user_student_ids($workspaceid, $userid);
$students = $canmanage
    ? pqss_workspace_students($workspaceid)
    : array_values(array_filter(pqss_workspace_students($workspaceid), static fn($student): bool => in_array((int)$student->id, $studentids, true)));
$offerings = pqss_offerings_for_scholarship($workspaceid);
$applications = pqss_scholarship_applications($workspaceid, $userid);

// Student picker: id + display name only.
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = ['id' => (int)$student->id, 'name' => fullname($student)];
}

// Offerings: id, title, eligibility flag (same fields the page's <option> uses).
$offeringsout = [];
foreach ($offerings as $offering) {
    $offeringsout[] = [
        'id' => (int)$offering->id,
        'title' => (string)$offering->title,
        'scholarship_eligible' => (int)$offering->scholarship_eligible,
    ];
}

// Project each application onto exactly the fields the page table renders.
// Money values (currency, requestedamount) are the pre-formatted strings the
// pqss/pqfin layer emits — nothing raw is surfaced.
$applicationsout = [];
$nameids = [];
foreach ($applications as $application) {
    $nameids[] = (int)$application->studentid;
    $applicationsout[] = [
        'id' => (int)$application->id,
        'applicationnumber' => (string)$application->applicationnumber,
        'offeringtitle' => (string)($application->offeringtitle ?? ''),
        'awardid' => (int)$application->awardid,
        'studentid' => (int)$application->studentid,
        'student' => trim((string)$application->firstname . ' ' . (string)$application->lastname),
        'needlevel' => (string)$application->needlevel,
        'fundingpreference' => (string)$application->fundingpreference,
        'currency' => (string)$application->currency,
        'requestedamount' => (string)$application->requestedamount,
        'status' => (string)$application->status,
        'decisionnote' => (string)$application->decisionnote,
        'invoiceid' => (int)$application->invoiceid,
        'invoicenumber' => (string)($application->invoicenumber ?? ''),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'context' => [
        'workspaceid' => $workspaceid,
        'workspace' => (string)$workspace->name,
        'consumerslug' => (string)($consumercontext->consumerslug ?? ''),
    ],
    'canmanage' => $canmanage,
    'role' => $role,
    'defaultcurrency' => pqfin_default_currency(),
    'students' => $studentsout,
    'offerings' => $offeringsout,
    'applications' => $applicationsout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
