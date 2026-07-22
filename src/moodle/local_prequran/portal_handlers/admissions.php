<?php
// ---- report: admissions (workspace admissions pipeline; read + writes) --------
// Ported from local_hubredirect/admissions.php (which stays live in parallel).
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent.
//
// GET  = the workspace admissions queue (applications + documents + status maps,
//        exactly as the legacy page loads them; optional application_status
//        filter + status counts for the portal chips).
// POST = do=save_application (create/update, verbatim), do=decision (set
//        decision, verbatim), do=convert (convert applicant to student, verbatim).
//        The legacy save_application document upload ($_FILES) is NOT portable
//        over a JSON portal POST and is skipped (see note below).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/admissionslib.php');
require_once($CFG->dirroot . '/local/hubredirect/admissions_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- Access: identical to the legacy page (workspace administrator only). ------
// pqh_access_denied(...) on the page becomes pqpd_fail(403, <same message>).
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$consumercontext = pqh_current_consumer_context();
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Admissions management requires workspace administrator access.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // require_sesskey() dropped throughout: token auth replaces the session key.
    if (!pqadm_schema_ready()) {
        pqpd_fail(409, 'Admissions tables are not installed yet. Run Moodle upgrade.');
    }

    // -- write: save_application (legacy action=save_application, verbatim) -----
    // NOTE: the legacy $_FILES['admission_document'] upload branch is dropped —
    // a JSON portal POST cannot carry a multipart file. Document upload stays on
    // the legacy page; everything else about the save is ported unchanged.
    if ($do === 'save_application') {
        $applicationid = (int)($body['applicationid'] ?? 0);
        $studentprofile = [
            'date_of_birth' => clean_param((string)($body['date_of_birth'] ?? ''), PARAM_TEXT),
            'current_level' => clean_param((string)($body['current_level'] ?? ''), PARAM_TEXT),
            'learning_base' => clean_param((string)($body['learning_base'] ?? ''), PARAM_TEXT),
            'language' => clean_param((string)($body['language'] ?? ''), PARAM_TEXT),
            'support_needs' => clean_param((string)($body['support_needs'] ?? ''), PARAM_TEXT),
        ];
        $familyprofile = [
            'home_country' => clean_param((string)($body['home_country'] ?? ''), PARAM_TEXT),
            'timezone' => clean_param((string)($body['timezone'] ?? ''), PARAM_TEXT),
            'availability' => clean_param((string)($body['availability'] ?? ''), PARAM_TEXT),
        ];
        $placement = [
            'assessment_date' => clean_param((string)($body['assessment_date'] ?? ''), PARAM_TEXT),
            'recommended_level' => clean_param((string)($body['recommended_level'] ?? ''), PARAM_TEXT),
            'assessor_notes' => clean_param((string)($body['assessor_notes'] ?? ''), PARAM_TEXT),
        ];
        $id = pqadm_create_or_update_application($workspaceid, $consumercontext, [
            'studentid' => (int)($body['studentid'] ?? 0),
            'offeringid' => (int)($body['offeringid'] ?? 0),
            'family_name' => clean_param((string)($body['family_name'] ?? ''), PARAM_TEXT),
            'student_name' => clean_param((string)($body['student_name'] ?? ''), PARAM_TEXT),
            'student_email' => clean_param((string)($body['student_email'] ?? ''), PARAM_TEXT),
            'parent_name' => clean_param((string)($body['parent_name'] ?? ''), PARAM_TEXT),
            'parent_email' => clean_param((string)($body['parent_email'] ?? ''), PARAM_TEXT),
            'parent_phone' => clean_param((string)($body['parent_phone'] ?? ''), PARAM_TEXT),
            'program_key' => clean_param((string)($body['program_key'] ?? ''), PARAM_ALPHANUMEXT),
            'desired_start' => clean_param((string)($body['desired_start'] ?? ''), PARAM_TEXT),
            'application_status' => clean_param((string)($body['application_status'] ?? 'submitted'), PARAM_ALPHANUMEXT),
            'review_status' => clean_param((string)($body['review_status'] ?? 'pending'), PARAM_ALPHANUMEXT),
            'placement_status' => clean_param((string)($body['placement_status'] ?? 'not_assessed'), PARAM_ALPHANUMEXT),
            'decision' => clean_param((string)($body['decision'] ?? 'pending'), PARAM_ALPHANUMEXT),
            'review_notes' => clean_param((string)($body['review_notes'] ?? ''), PARAM_TEXT),
            'decision_notes' => clean_param((string)($body['decision_notes'] ?? ''), PARAM_TEXT),
            'student_profile' => $studentprofile,
            'family_profile' => $familyprofile,
            'placement' => $placement,
        ], $userid, $applicationid);
        echo json_encode([
            'ok' => true,
            'message' => 'Application saved.',
            'applicationid' => (int)$id,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: decision (legacy action=decision, verbatim) --------------------
    if ($do === 'decision') {
        pqadm_set_decision(
            (int)($body['applicationid'] ?? 0),
            $workspaceid,
            clean_param((string)($body['decision'] ?? 'pending'), PARAM_ALPHANUMEXT),
            clean_param((string)($body['decision_notes'] ?? ''), PARAM_TEXT),
            $userid
        );
        echo json_encode([
            'ok' => true,
            'message' => 'Admissions decision saved.',
            'applicationid' => (int)($body['applicationid'] ?? 0),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: convert (legacy action=convert, verbatim) ----------------------
    if ($do === 'convert') {
        $result = pqadm_convert_application(
            (int)($body['applicationid'] ?? 0),
            $workspaceid,
            $consumercontext,
            $userid
        );
        echo json_encode([
            'ok' => true,
            'message' => 'Applicant converted to student #' . (int)($result['studentid'] ?? 0) . '.',
            'studentid' => (int)($result['studentid'] ?? 0),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown admissions action.');
}

// -- GET: the admissions queue (same resolution + ordering as the page) --------
if (!pqadm_schema_ready()) {
    echo json_encode([
        'ok' => true, 'ready' => false,
        'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

$statusoptions = pqadm_application_statuses();
$decisionoptions = pqadm_decisions();
$placementoptions = pqadm_placement_statuses();

$filterstatus = optional_param('status', '', PARAM_ALPHANUMEXT);
if ($filterstatus !== '' && !array_key_exists($filterstatus, $statusoptions)) {
    $filterstatus = '';
}

// Status counts across the workspace (for the portal chips).
$statuscounts = array_fill_keys(array_keys($statusoptions), 0);
foreach ($DB->get_records_sql(
    "SELECT application_status, COUNT(1) AS total
       FROM {local_prequran_admission_app}
      WHERE workspaceid = :workspaceid
   GROUP BY application_status",
    ['workspaceid' => $workspaceid]
) as $row) {
    $statuscounts[(string)$row->application_status] = (int)$row->total;
}

// The legacy list query: workspace rows, newest-modified first, capped at 80.
$listparams = ['workspaceid' => $workspaceid];
$statuswhere = '';
if ($filterstatus !== '') {
    $statuswhere = ' AND application_status = :status';
    $listparams['status'] = $filterstatus;
}
$applications = array_values($DB->get_records_sql(
    "SELECT * FROM {local_prequran_admission_app}
      WHERE workspaceid = :workspaceid{$statuswhere}
   ORDER BY timemodified DESC",
    $listparams, 0, 80
));

// Documents grouped by application (legacy loads these for the whole page).
$docs = [];
if ($applications) {
    $ids = array_map(static function($row): int {
        return (int)$row->id;
    }, $applications);
    [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'app');
    $rows = $DB->get_records_select('local_prequran_admission_doc', "applicationid {$insql}", $params, 'timecreated DESC');
    foreach ($rows as $doc) {
        $docs[(int)$doc->applicationid][] = $doc;
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'filters' => ['status' => $filterstatus],
    'statusoptions' => $statusoptions,
    'decisionoptions' => $decisionoptions,
    'placementoptions' => $placementoptions,
    'statuscounts' => $statuscounts,
    'applications' => $applications,
    'documents' => $docs,
    'supporturl' => $CFG->wwwroot . '/local/hubredirect/admissions.php?workspaceid=' . $workspaceid,
], JSON_UNESCAPED_SLASHES);
exit;
