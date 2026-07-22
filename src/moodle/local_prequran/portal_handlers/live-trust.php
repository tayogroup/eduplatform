<?php
// ---- report: live-trust (admin/staff live-class Trust Center; read + parent write) ----
// Ported from local_hubredirect/live_trust.php via live_trust_portallib
// (pqltl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// This is the staff/admin Trust Center (distinct from parent-trust, which is
// the parent-facing live hub) — it also exposes the linked-parent consent write.
// GET  = the trust-center state for a child (chooser if multi-child): sessions,
//        consent status + records, and the trust summary counters the page shows.
// POST = do=save_parent_consent (the linked-parent live + recording consent write,
//        verbatim upsert pair inside one transaction + compliance audit).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_trust_portallib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_security.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$body = [];
if ($method === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// childid resolves the same way the page does (query on GET, JSON body on POST).
$childid = $method === 'POST'
    ? (int)($body['childid'] ?? 0)
    : optional_param('childid', 0, PARAM_INT);

// -- mode/child resolution (verbatim page order) --
$modechildren = [];
if ($childid <= 0) {
    if (is_siteadmin($USER)) {
        $modechildren = [];
    } else if (pqltl_has_teacher_role($userid) && !pqltl_is_managed_student($userid)) {
        $modechildren = pqltl_teacher_students($userid);
    } else {
        $modechildren = pqltl_parent_children($userid);
    }
    if (count($modechildren) === 1) {
        $childid = (int)$modechildren[0]['studentid'];
    }
}

// -- entry access check (verbatim: audit + deny) --
// pqh_access_denied(...) -> pqpd_fail(403, same message); pqh_live_security_audit kept.
if ($childid > 0 && !pqltl_user_can_access_child($userid, $childid)) {
    pqh_live_security_audit(
        'live_trust_access_denied',
        'student',
        $childid,
        ['studentid' => $childid]
    );
    pqpd_fail(403, 'You cannot view live-class trust details for this student.');
}

$islinkedparent = $childid > 0
    && $userid !== $childid
    && !is_siteadmin($userid)
    && pqltl_parent_can_access_child($userid, $childid);

if ($method === 'POST') {
    $do = (string)($body['do'] ?? '');

    // -- write: save_parent_consent (legacy action=save_parent_consent, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'save_parent_consent') {
        if (!$islinkedparent) {
            pqpd_fail(403, 'Only a linked parent or legal guardian can update consent for this student.');
        }
        if (empty($body['guardian_confirmation'])) {
            pqpd_fail(403, 'Confirm that you are the student\'s parent or legal guardian.');
        }
        $livechoice = clean_param((string)($body['live_consent'] ?? ''), PARAM_ALPHA);
        $recordingchoice = clean_param((string)($body['recording_consent'] ?? ''), PARAM_ALPHA);
        if (!in_array($livechoice, ['grant', 'decline'], true)
            || !in_array($recordingchoice, ['grant', 'decline'], true)) {
            pqpd_fail(400, 'Choose Grant or Decline for both consent decisions.');
        }
        // workspaceid: the page reads it from the consumer context / query; under
        // the token endpoint there is no consumer context, so accept it from the
        // client (default 0). pqltl_save_parent_consent only stores it when the
        // column exists.
        $workspaceid = (int)($body['workspaceid'] ?? 0);
        // Table guard hoisted ahead of the transaction (pqltl_save_parent_consent
        // throws the same message) so a missing table never leaves an open txn.
        if (!pqltl_table_exists('local_prequran_live_consent')) {
            pqpd_fail(400, 'Live consent storage is not ready. Please ask support to run the Moodle upgrade.');
        }

        $transaction = $DB->start_delegated_transaction();
        pqltl_save_parent_consent($childid, $userid, $workspaceid, 'live_session', $livechoice === 'grant' ? 1 : 0);
        pqltl_save_parent_consent($childid, $userid, $workspaceid, 'recording', $recordingchoice === 'grant' ? 1 : 0);
        pqh_live_security_audit('parent_live_consent_updated', 'student', $childid, [
            'live_session' => $livechoice,
            'recording' => $recordingchoice,
        ]);
        $transaction->allow_commit();

        echo json_encode([
            'ok' => true,
            'message' => 'Your consent choices were saved.',
            'childid' => $childid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown live-trust action.');
}

// -- GET: the trust-center state (same resolution/derivation as the page) --
$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$sessions = $childid > 0 ? pqltl_sessions($childid) : [];
$consentguardianid = $islinkedparent ? $userid : 0;
$liveconsentrecord = $childid > 0 ? pqltl_consent_record($childid, $consentguardianid, ['live_session']) : null;
$recordingconsentrecord = $childid > 0 ? pqltl_consent_record($childid, $consentguardianid, ['recording', 'live_recording', 'live_session_recording']) : null;
$liveconsent = $liveconsentrecord ? (!empty($liveconsentrecord->granted) ? 'Granted' : 'Not granted') : 'Not recorded in system yet';
$recordingconsent = $recordingconsentrecord ? (!empty($recordingconsentrecord->granted) ? 'Granted' : 'Not granted') : 'Not recorded in system yet';
$completed = 0;
$published = 0;
$recordingenabled = 0;
foreach ($sessions as $session) {
    if (in_array((string)$session->status, ['completed', 'live'], true)) {
        $completed++;
    }
    if (!empty($session->visible_to_parent)) {
        $published++;
    }
    if (!empty($session->recording_enabled)) {
        $recordingenabled++;
    }
}

$nameids = [];
foreach ($sessions as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'mode' => $childid > 0 ? 'child' : 'chooser',
    'child' => ['id' => $childid, 'name' => $childname],
    'children' => $modechildren,
    'islinkedparent' => $islinkedparent,
    'sessions' => array_values($sessions),
    'stats' => [
        'visible' => count($sessions),
        'completed' => $completed,
        'published' => $published,
        'recordingenabled' => $recordingenabled,
    ],
    'liveconsent' => $liveconsent,
    'recordingconsent' => $recordingconsent,
    'live_consent_granted' => $liveconsentrecord ? (bool)!empty($liveconsentrecord->granted) : null,
    'recording_consent_granted' => $recordingconsentrecord ? (bool)!empty($recordingconsentrecord->granted) : null,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
