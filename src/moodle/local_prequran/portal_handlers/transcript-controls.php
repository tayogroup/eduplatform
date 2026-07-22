<?php
// Portal handler: transcript-controls (registrar transcript holds + field
// corrections manager). Ported from local_hubredirect/transcript_controls.php,
// which stays live in parallel. Runs from portal_data.php AFTER token auth:
// $claims verified, $USER set to the token user, JSON exception handler
// installed, CORS headers sent.
//
//   GET  ?report=transcript-controls&token=…[&studentid=&documentid=
//         &workspaceid=&consumer=]
//   POST ?report=transcript-controls&token=…[&workspaceid=&consumer=]
//        body JSON:
//          {do:"hold",       studentid, holdtype?, reason}
//          {do:"resolvehold", holdid, resolution}
//          {do:"correction", studentid, documentid?, fieldpath, oldvalue?,
//                            newvalue, reason}
//
// Writes are the legacy POST actions verbatim (same gates, same lib calls,
// same check order); confirm_sesskey() is dropped — token auth replaces the
// session key — and the legacy redirect becomes an ok JSON. The legacy
// catch(Throwable) re-render-with-error becomes an error JSON with the same
// message. (transcript_controls.php has no pqh_live_security_audit calls —
// none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcriptlib.php');
require_once($CFG->dirroot . '/local/hubredirect/transcript_controls_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
$do = '';
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
    $do = (string)($body['do'] ?? '');
    if (!in_array($do, ['hold', 'resolvehold', 'correction'], true)) {
        pqpd_fail(400, 'Unknown transcript-controls action.');
    }
}

// ---- request parameters (verbatim reads from the page; POST ids may also
// ---- arrive in the JSON body since text/plain posts leave $_POST empty) ------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
if ($ispost && isset($body['workspaceid'])) {
    $workspaceid = clean_param($body['workspaceid'], PARAM_INT);
}
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
if ($ispost && isset($body['studentid'])) {
    $studentid = clean_param($body['studentid'], PARAM_INT);
}
$documentid = trim(optional_param('documentid', '', PARAM_TEXT));
if ($ispost && isset($body['documentid'])) {
    $documentid = trim(clean_param((string)$body['documentid'], PARAM_TEXT));
}

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

// ---- entry gates: same order as the page ------------------------------------
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can manage transcript controls.');
}
if ($studentid <= 0 && $documentid !== '') {
    $doc = pqct_load_official_transcript_doc($documentid, $userid);
    if ($doc) {
        $studentid = (int)$doc->studentid;
    }
}
if ($studentid <= 0) {
    $students = pqct_students_for_transcript_viewer($userid, $workspaceid);
    if ($students) {
        $studentid = (int)array_key_first($students);
    }
}
if ($studentid <= 0 || !pqct_user_can_view_student_transcript($userid, $studentid, $workspaceid)) {
    pqpd_fail(403, 'Choose a valid managed student before opening transcript controls.');
}

$student = core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber,deleted', MUST_EXIST);

// Legacy required_param() → the JSON body must carry the key; the value is
// trimmed/cleaned exactly like the page.
$reqtext = static function(array $body, string $key): string {
    if (!array_key_exists($key, $body)) {
        pqpd_fail(400, 'A required transcript-controls field is missing (' . $key . ').');
    }
    return trim(clean_param((string)$body[$key], PARAM_TEXT));
};

if ($ispost) {
    // confirm_sesskey() dropped: token auth replaces the session key.
    try {
        if ($do === 'hold') {
            $holdtype = array_key_exists('holdtype', $body)
                ? trim(clean_param((string)$body['holdtype'], PARAM_TEXT))
                : 'registrar';
            pqct_create_transcript_hold($studentid, $workspaceid, $userid, $holdtype, $reqtext($body, 'reason'));
        } else if ($do === 'resolvehold') {
            $holdid = isset($body['holdid']) ? clean_param($body['holdid'], PARAM_INT) : 0;
            if ($holdid <= 0) {
                pqpd_fail(400, 'A required transcript-controls field is missing (holdid).');
            }
            pqct_resolve_transcript_hold($holdid, $workspaceid, $userid, $reqtext($body, 'resolution'));
        } else if ($do === 'correction') {
            $correctiondoc = array_key_exists('documentid', $body)
                ? trim(clean_param((string)$body['documentid'], PARAM_TEXT))
                : $documentid;
            pqct_create_transcript_correction(
                $studentid,
                $workspaceid,
                $userid,
                $correctiondoc,
                $reqtext($body, 'fieldpath'),
                array_key_exists('oldvalue', $body) ? clean_param((string)$body['oldvalue'], PARAM_TEXT) : '',
                $reqtext($body, 'newvalue'),
                $reqtext($body, 'reason')
            );
        }
        // Legacy: redirect back to the same student/document with saved=1.
        echo json_encode([
            'ok' => true,
            'message' => 'Transcript control saved.',
            'studentid' => $studentid,
            'documentid' => $documentid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        // Legacy re-renders the page with the error message.
        pqpd_fail(400, $e->getMessage());
    }
}

// ---- GET: the transcript-controls state (same reads as the page) ------------
$holds = pqct_all_transcript_holds($studentid, $workspaceid);
$corrections = pqct_transcript_corrections($studentid, $workspaceid);
$docs = pqct_recent_official_transcript_docs($studentid, $workspaceid, 20);

// Pre-render the display strings server-side with the verbatim page helpers
// (userdate honours the token user's language/timezone).
$holdsout = [];
foreach ($holds as $hold) {
    $holdsout[] = [
        'id' => (int)$hold->id,
        'status' => (string)$hold->status,
        'status_label' => pqtc_label((string)$hold->status),
        'holdtype' => (string)$hold->holdtype,
        'reason' => (string)$hold->reason,
        'resolutionnote' => (string)($hold->resolutionnote ?? ''),
        'created_label' => pqtc_date((int)$hold->timecreated),
        'is_active' => (string)$hold->status === 'active',
    ];
}

$correctionsout = [];
foreach ($corrections as $correction) {
    $correctionsout[] = [
        'status' => (string)$correction->status,
        'status_label' => pqtc_label((string)$correction->status),
        'documentid' => (string)$correction->documentid,
        'fieldpath' => (string)$correction->fieldpath,
        'oldvalue' => (string)$correction->oldvalue,
        'newvalue' => (string)$correction->newvalue,
        'reason' => (string)$correction->reason,
        'recorded_label' => pqtc_date((int)$correction->timecreated),
    ];
}

$docsout = [];
foreach ($docs as $doc) {
    $docsout[] = [
        'documentid' => (string)$doc->documentid,
        'status_label' => pqtc_label((string)$doc->status),
    ];
}

// Legacy action buttons stay links to the live Moodle pages (parallel-run).
$links = [
    'transcript' => pqct_transcript_url($studentid, $workspaceid, $consumercontext)->out(false),
    'official' => (new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['studentid' => $studentid]))->out(false),
    'workspace' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams))->out(false),
];

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'studentid' => $studentid,
    'documentid' => $documentid,
    'student' => [
        'id' => $studentid,
        'name' => fullname($student),
        'account_label' => pqh_account_no_label($student),
    ],
    'holds' => $holdsout,
    'corrections' => $correctionsout,
    'docs' => $docsout,
    'links' => $links,
    'names' => pqpd_names([$studentid]),
], JSON_UNESCAPED_SLASHES);
exit;
