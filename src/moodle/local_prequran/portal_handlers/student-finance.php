<?php
// ---- report: student-finance (workspace-admin finance profiles; read + writes) ----
// Ported from local_hubredirect/student_finance.php via student_finance_portallib
// (guard-only: the page defines no named functions — pqfin_*/pqco_*/pqh_* shared
// helpers are called at runtime; its one inline search closure is ported below).
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent.
// GET  = what the page renders: student roster (with search filter), selected
//        student's finance profile / billing account linkage, warnings,
//        transcript release check, and finance holds.
// POST = JSON do=<action>, the page's five sesskey'd actions VERBATIM
//        (resolve_family_account, create_finance_hold,
//        refresh_finance_hold_candidates, activate_finance_hold,
//        resolve_finance_hold). require_sesskey() dropped: token auth replaces
//        the session key. Legacy redirect/inline-message -> ok JSON + message.
// (student_finance.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_finance_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from student_finance.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can view student finance profiles.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($body) ? $body : [];
    // Legacy action= becomes do=; same whitelist, same student scoping check.
    $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
    $targetstudentid = (int)($body['studentid'] ?? 0);
    if (!in_array($action, ['resolve_family_account', 'create_finance_hold', 'refresh_finance_hold_candidates', 'activate_finance_hold', 'resolve_finance_hold'], true)) {
        pqpd_fail(400, 'Choose a valid finance action.');
    }
    if (!pqfin_student_in_workspace($targetstudentid, $workspaceid)) {
        pqpd_fail(400, 'Choose a valid student in this workspace.');
    }
    // The page wraps the action body in try/catch and shows the message inline;
    // surface the same message as a 400 instead of the 500 exception handler.
    try {
        $message = '';
        if ($action === 'resolve_family_account') {
            $billingaccountid = pqfin_resolve_or_create_family_billing_account($targetstudentid, $workspaceid, $consumercontext, $userid);
            $message = 'Student finance profile linked to billing account #' . $billingaccountid . '.';
        } else if ($action === 'create_finance_hold') {
            // Legacy required_param('reason', PARAM_TEXT): missing -> error.
            $reason = trim(clean_param((string)($body['reason'] ?? ''), PARAM_TEXT));
            if ($reason === '') {
                pqpd_fail(400, 'An internal reason is required to create a finance hold.');
            }
            $holdtype = clean_param((string)($body['holdtype'] ?? 'manual'), PARAM_ALPHANUMEXT);
            if ($holdtype === '') {
                $holdtype = 'manual';
            }
            pqfin_create_finance_hold($targetstudentid, $workspaceid, $consumercontext, $userid, [
                'holdtype' => $holdtype,
                'status' => 'active',
                'source' => 'manual',
                'severity' => 'blocker',
                'reasoncode' => 'manual_finance_hold',
                'reason' => $reason,
                'parentmessage' => trim(clean_param((string)($body['parentmessage'] ?? ''), PARAM_TEXT)),
            ]);
            $message = 'Manual finance hold created.';
        } else if ($action === 'refresh_finance_hold_candidates') {
            $created = pqfin_refresh_finance_hold_candidates($targetstudentid, $workspaceid, $consumercontext, $userid);
            $message = count($created) . ' finance hold candidate' . (count($created) === 1 ? '' : 's') . ' queued.';
        } else if ($action === 'activate_finance_hold') {
            // Legacy required_param('holdid', PARAM_INT).
            $holdid = (int)($body['holdid'] ?? 0);
            if ($holdid <= 0) {
                pqpd_fail(400, 'Choose a valid finance hold.');
            }
            pqfin_activate_finance_hold($holdid, $workspaceid, $userid);
            $message = 'Finance hold activated.';
        } else if ($action === 'resolve_finance_hold') {
            $holdid = (int)($body['holdid'] ?? 0);
            $resolutionnote = trim(clean_param((string)($body['resolutionnote'] ?? ''), PARAM_TEXT));
            if ($holdid <= 0) {
                pqpd_fail(400, 'Choose a valid finance hold.');
            }
            if ($resolutionnote === '') {
                pqpd_fail(400, 'A resolution note is required to resolve a finance hold.');
            }
            pqfin_resolve_finance_hold($holdid, $workspaceid, $userid, $resolutionnote);
            $message = 'Finance hold resolved.';
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'studentid' => $targetstudentid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: same roster + profile resolution order as the page --
$studentid = optional_param('studentid', 0, PARAM_INT);
$q = trim(optional_param('q', '', PARAM_TEXT));

$students = pqco_workspace_students_for_user($workspaceid, $userid);
if ($q !== '') {
    $needle = core_text::strtolower($q);
    $students = array_filter($students, static function($student) use ($needle): bool {
        $haystack = core_text::strtolower(fullname($student) . ' ' . (string)($student->email ?? '') . ' ' . (string)($student->idnumber ?? ''));
        return strpos($haystack, $needle) !== false;
    });
}
if ($studentid <= 0 && $students) {
    $first = reset($students);
    $studentid = (int)$first->id;
}
$selectedstudent = $studentid > 0 && isset($students[$studentid])
    ? $students[$studentid]
    : ($studentid > 0 ? core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber', IGNORE_MISSING) : null);
if ($selectedstudent && !pqfin_student_in_workspace((int)$selectedstudent->id, $workspaceid)) {
    $selectedstudent = null;
    $studentid = 0;
}

$profile = $selectedstudent
    ? pqfin_student_finance_profile((int)$selectedstudent->id, $workspaceid, $consumercontext)
    : ['finance' => null, 'billingaccount' => null, 'warnings' => []];
$holds = $selectedstudent ? pqfin_finance_holds((int)$selectedstudent->id, $workspaceid) : [];
$releasecheck = $selectedstudent ? pqfin_finance_hold_release_check((int)$selectedstudent->id, $workspaceid, $consumercontext, 'transcript') : ['warnings' => [], 'blocked' => false, 'behavior' => 'disabled'];

$finance = $profile['finance'];
$account = $profile['billingaccount'];

// Emit only what the page renders (roster rows carry email/idnumber the page
// prints; billing-account internals like gateway config are never surfaced).
$roster = [];
foreach ($students as $row) {
    $roster[] = [
        'id' => (int)$row->id,
        'name' => fullname($row),
        'accountlabel' => pqh_account_no_label($row),
        'email' => (string)($row->email ?? ''),
    ];
}
$holdrows = [];
foreach ($holds as $hold) {
    $holdrows[] = [
        'id' => (int)$hold->id,
        'status' => (string)$hold->status,
        'status_label' => pqfin_hold_status_label((string)$hold->status),
        'type_label' => pqfin_hold_type_label((string)$hold->holdtype),
        'amount' => (string)$hold->amount,
        'currency' => (string)$hold->currency,
        'reason' => (string)$hold->reason,
        'parentmessage' => pqfin_hold_parent_safe_message($hold),
        'resolutionnote' => (string)$hold->resolutionnote,
        'suggested' => (string)$hold->status === 'suggested',
        'unresolved' => in_array((string)$hold->status, pqfin_unresolved_hold_statuses(), true),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'schemaready' => pqfin_schema_ready(),
    'holdschemaready' => pqfin_hold_schema_ready(),
    'q' => $q,
    'students' => $roster,
    'selected' => $selectedstudent ? [
        'id' => (int)$selectedstudent->id,
        'name' => fullname($selectedstudent),
        'accountlabel' => pqh_account_no_label($selectedstudent),
        'email' => (string)($selectedstudent->email ?? ''),
    ] : null,
    'warnings' => array_values($profile['warnings']),
    'finance' => $finance ? [
        'id' => (int)$finance->id,
        'status' => (string)$finance->status,
        'holdstatus' => (string)$finance->holdstatus,
    ] : null,
    'account' => $account ? [
        'id' => (int)$account->id,
        'type_label' => pqfin_account_type_label((string)$account->accounttype),
        'status_label' => pqfin_status_label((string)$account->status),
        'displayname' => (string)$account->displayname,
        'billingemail' => (string)$account->billingemail,
        'currency' => (string)$account->currency,
        'primaryuserid' => (int)$account->primaryuserid,
        'consumerid' => (int)$account->consumerid,
        'workspaceid' => (int)$account->workspaceid,
    ] : null,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'releasecheck' => [
        'behavior' => (string)($releasecheck['behavior'] ?? 'disabled'),
        'blocked' => !empty($releasecheck['blocked']),
        'warnings' => array_values($releasecheck['warnings'] ?? []),
    ],
    'holds' => $holdrows,
], JSON_UNESCAPED_SLASHES);
exit;
