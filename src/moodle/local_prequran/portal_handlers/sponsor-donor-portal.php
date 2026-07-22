<?php
// ---- report: sponsor-donor-portal (sponsor/donor pledges + invoices; read + writes) ----
// Ported from local_hubredirect/sponsor_donor_portal.php. The legacy page
// defines no functions of its own; all helpers are SHARED libraries kept in
// place and require_once'd below (never copied):
//   pqss_*  scholarship_sponsorlib.php | pqfin_* finance_lib.php | pqh_* accesslib.php
// (sponsor_donor_portal_portallib.php is the guard-only companion lib.)
//
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent.
// GET  = the page's sponsor/donor state — 4 invoice metrics, workspace context,
//        students (for the pledge form), donor pledges, sponsor invoices and
//        sponsor commitments, each projected onto exactly the columns the page
//        table prints. Money values are the pre-formatted strings the pqss_/
//        pqfin_ reports emit (whitelisted); raw report rows are never dumped.
//        Display names are added via pqpd_names.
// POST = do=submit_pledge (donor pledge create) or do=review_pledge (finance
//        staff pledge review) — the page's two write actions verbatim. The
//        confirm_sesskey() gate is dropped (token auth replaces the session key)
//        and the page's post-write redirect becomes an ok JSON reply.
// (sponsor_donor_portal.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/scholarship_sponsorlib.php');
require_once($CFG->dirroot . '/local/hubredirect/sponsor_donor_portal_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from sponsor_donor_portal.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$role = $workspaceid > 0 ? pqh_user_workspace_role($userid, $workspaceid) : '';
$canmanage = $workspaceid > 0 && (pqh_user_can_manage_workspace($userid, $workspaceid)
    || pqh_user_has_workspace_capability($userid, $workspaceid, 'finance.manage'));
if ($workspaceid <= 0 || (!$canmanage && $role !== 'sponsor')) {
    pqpd_fail(403, 'Sponsor and donor portal requires sponsor or finance access.');
}
if (!pqss_schema_ready()) {
    pqpd_fail(403, 'Sponsor/donor portal schema is not ready. Run the local_prequran upgrade first.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// -- POST: the page's two write actions (JSON body {do:...}; sesskey dropped) --
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: submit_pledge (legacy action=submit_pledge, verbatim mapping) --
    if ($do === 'submit_pledge') {
        $expecteddate = clean_param((string)($body['expected_date'] ?? ''), PARAM_RAW_TRIMMED);
        $expectedat = $expecteddate !== '' ? strtotime($expecteddate . ' 12:00:00') : 0;
        $pledgeid = pqss_create_donor_pledge($workspaceid, $consumercontext, $userid, [
            'studentid' => (int)($body['studentid'] ?? 0),
            'invoiceid' => (int)($body['invoiceid'] ?? 0),
            'campaign' => clean_param((string)($body['campaign'] ?? ''), PARAM_TEXT),
            'pledge_type' => clean_param((string)($body['pledge_type'] ?? 'general'), PARAM_ALPHANUMEXT),
            'currency' => clean_param((string)($body['currency'] ?? pqfin_default_currency()), PARAM_ALPHANUMEXT),
            'pledgedamount' => clean_param((string)($body['pledgedamount'] ?? '0.00'), PARAM_TEXT),
            'privacy' => clean_param((string)($body['privacy'] ?? 'named'), PARAM_ALPHANUMEXT),
            'donor_message' => clean_param((string)($body['donor_message'] ?? ''), PARAM_TEXT),
            'expectedat' => $expectedat > 0 ? $expectedat : 0,
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Donor pledge #' . $pledgeid . ' submitted.',
            'pledgeid' => (int)$pledgeid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: review_pledge (legacy action=review_pledge, verbatim) --
    // pqss_review_donor_pledge enforces finance-manage capability itself.
    if ($do === 'review_pledge') {
        pqss_review_donor_pledge(
            (int)($body['pledgeid'] ?? 0),
            $workspaceid,
            $consumercontext,
            $userid,
            clean_param((string)($body['status'] ?? ''), PARAM_ALPHANUMEXT),
            clean_param((string)($body['staffnote'] ?? ''), PARAM_TEXT),
            (int)($body['invoiceid'] ?? 0)
        );
        echo json_encode([
            'ok' => true,
            'message' => 'Donor pledge reviewed.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown sponsor-donor-portal action.');
}

// -- GET: same data + resolution order as the page --
$students = pqss_workspace_students($workspaceid);
$pledges = pqss_donor_pledges($workspaceid, $userid);
$invoices = pqfin_invoice_rows_for_sponsor($workspaceid, $userid, $consumercontext);
$commitments = pqfin_sponsor_commitments_for_user($workspaceid, $userid, $consumercontext);
if ($canmanage && pqfin_invoice_schema_ready()) {
    $invoices = array_values($DB->get_records_sql(
        "SELECT i.*, u.firstname, u.lastname, ba.displayname AS accountname, w.name AS workspace_name
           FROM {local_prequran_invoice} i
      LEFT JOIN {user} u ON u.id = i.studentid
      LEFT JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
      LEFT JOIN {local_prequran_workspace} w ON w.id = i.workspaceid
          WHERE i.workspaceid = :workspaceid
            AND i.status <> :voidstatus
       ORDER BY i.dueat ASC, i.id DESC",
        ['workspaceid' => $workspaceid, 'voidstatus' => 'void'],
        0,
        150
    ));
}
$metrics = pqfin_invoice_amount_metrics($invoices);

// Project onto exactly the fields the page table renders (money = the
// pre-formatted pqss_/pqfin_ strings; nothing else surfaced). Collect student
// ids so the client can show names via the names map.
$nameids = [];

$studentsout = [];
foreach ($students as $student) {
    $nameids[] = (int)$student->id;
    $studentsout[] = [
        'id' => (int)$student->id,
        'name' => fullname($student),
    ];
}

$pledgesout = [];
foreach ($pledges as $pledge) {
    if ((int)$pledge->studentid > 0) {
        $nameids[] = (int)$pledge->studentid;
    }
    $pledgesout[] = [
        'id' => (int)$pledge->id,
        'pledgenumber' => (string)$pledge->pledgenumber,
        'campaign' => (string)$pledge->campaign,
        'commitmentid' => (int)$pledge->commitmentid,
        'sponsorname' => (string)($pledge->sponsorname ?? 'Sponsor'),
        'privacy' => (string)$pledge->privacy,
        'pledge_type' => (string)$pledge->pledge_type,
        'studentid' => (int)$pledge->studentid,
        'studentname' => (int)$pledge->studentid > 0
            ? trim((string)$pledge->firstname . ' ' . (string)$pledge->lastname)
            : 'General fund',
        'currency' => (string)$pledge->currency,
        'pledgedamount' => (string)$pledge->pledgedamount,
        'balanceamount' => (string)$pledge->balanceamount,
        'status' => (string)$pledge->status,
        'staffnote' => (string)$pledge->staffnote,
        'invoiceid' => (int)$pledge->invoiceid,
    ];
}

$invoicesout = [];
foreach ($invoices as $invoice) {
    if ((int)$invoice->studentid > 0) {
        $nameids[] = (int)$invoice->studentid;
    }
    $invoicesout[] = [
        'invoicenumber' => (string)$invoice->invoicenumber,
        'studentid' => (int)$invoice->studentid,
        'studentname' => (int)$invoice->studentid > 0 ? fullname($invoice) : 'Not assigned',
        'status' => (string)$invoice->status,
        'currency' => (string)$invoice->currency,
        'total' => (string)$invoice->total,
        'balancedue' => (string)$invoice->balancedue,
        'dueat' => (int)$invoice->dueat,
    ];
}

$commitmentsout = [];
foreach ($commitments as $commitment) {
    $commitmentsout[] = [
        'commitmentnumber' => (string)$commitment->commitmentnumber,
        'invoicenumber' => (string)$commitment->invoicenumber,
        'status' => (string)$commitment->status,
        'currency' => (string)$commitment->currency,
        'committedamount' => (string)$commitment->committedamount,
        'receivedamount' => (string)$commitment->receivedamount,
        'expectedat' => (int)$commitment->expectedat,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'canmanage' => $canmanage,
    'role' => $role,
    'context' => [
        'workspaceid' => $workspaceid,
        'workspace' => (string)$workspace->name,
        'consumer' => (string)($consumercontext->consumername ?? ''),
    ],
    'metrics' => [
        'count' => (int)$metrics['count'],
        'total' => (string)$metrics['total'],
        'paid' => (string)$metrics['paid'],
        'balance' => (string)$metrics['balance'],
    ],
    'students' => $studentsout,
    'pledges' => $pledgesout,
    'invoices' => $invoicesout,
    'commitments' => $commitmentsout,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
