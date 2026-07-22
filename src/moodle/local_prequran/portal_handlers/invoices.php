<?php
// ---- report: invoices (workspace invoice list + create-draft; read + write) ----
// Ported from local_hubredirect/invoices.php via invoices_portallib
// (pqinvl_ — guard-only: the page defines no functions; pqfin_*/pqh_*/pqco_*
// shared helpers are called at runtime). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
//
// GET  = what the page renders: workspace name + schema-ready flag, the invoice
//        list (first 100, i.timemodified/i.id DESC, same status filter), the
//        create-draft student picker, and the status filter whitelist with
//        labels. Money fields whitelisted to the columns the page table prints
//        (invoicenumber/id, student + email, billing account + email, status +
//        label, currency, total, balancedue, dueat). Per-invoice open links are
//        minted as portal_launch report=invoice-detail relaunch URLs (the
//        legacy "Open" button pointed at invoice_detail.php).
// POST = the page's one write, create_draft, ported verbatim as {do:"create_draft"}
//        (require_sesskey dropped: token auth replaces the session key). Returns
//        the new invoice id + an invoice-detail relaunch URL (the legacy page
//        redirected to invoice_detail.php?...&created=1). Any other action -> 400.
// (invoices.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_offeringlib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/invoices_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- entry access check (verbatim order + message from invoices.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$status = optional_param('status', '', PARAM_ALPHANUMEXT);

$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can manage invoices.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);

// Migrated open target: portal_launch mints a scoped invoice-detail token and
// carries the deep-link int + consumer through its passthrough (same convention
// as the other migrated relaunch links).
$launch = function (string $report, array $params = []) use ($CFG, $urlparams) {
    $url = $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $report;
    foreach ($urlparams + $params as $key => $value) {
        if ((string)$value === '' || $value === 0 || $value === '0') {
            continue;
        }
        $url .= '&' . $key . '=' . rawurlencode((string)$value);
    }
    return $url;
};

// -- POST: create_draft write, ported verbatim from invoices.php --
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';
    if ($do !== 'create_draft') {
        pqpd_fail(400, 'Unknown invoices action.');
    }
    try {
        if (!pqfin_invoice_schema_ready()) {
            throw new invalid_parameter_exception('Invoice schema is not ready.');
        }
        $studentid = (int)($body['studentid'] ?? 0);
        if ($studentid <= 0 || !pqfin_student_in_workspace($studentid, $workspaceid)) {
            throw new invalid_parameter_exception('Choose a valid student in this workspace.');
        }
        $billingaccountid = pqfin_resolve_or_create_family_billing_account($studentid, $workspaceid, $consumercontext, $userid);
        $invoiceid = pqfin_create_draft_invoice($workspaceid, $billingaccountid, $studentid, $consumercontext, $userid, [
            'source' => 'manual_admin_invoice',
        ]);
        // Legacy: redirect to invoice_detail.php?...&invoiceid=N&created=1.
        echo json_encode([
            'ok' => true,
            'message' => 'Draft invoice created.',
            'invoiceid' => (int)$invoiceid,
            'launchurl' => $launch('invoice-detail', ['invoiceid' => (int)$invoiceid]),
        ], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        // Legacy caught Throwable into an on-page $error banner; surface the
        // same message as a 400.
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: invoice list exactly as the page builds it --
$schemaready = pqfin_invoice_schema_ready();

$students = pqco_workspace_students_for_user($workspaceid, $userid);
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = [
        'id' => (int)$student->id,
        'label' => fullname($student) . ' / ' . pqh_account_no_label($student),
    ];
}

$where = 'i.workspaceid = :workspaceid';
$params = ['workspaceid' => $workspaceid];
if ($status !== '') {
    $where .= ' AND i.status = :status';
    $params['status'] = $status;
}
$invoices = [];
if ($schemaready) {
    $invoices = array_values($DB->get_records_sql(
        "SELECT i.*, ba.displayname AS accountname, ba.billingemail,
                u.firstname, u.lastname, u.email, u.idnumber
           FROM {local_prequran_invoice} i
           JOIN {local_prequran_billing_account} ba ON ba.id = i.billingaccountid
      LEFT JOIN {user} u ON u.id = i.studentid
          WHERE {$where}
       ORDER BY i.timemodified DESC, i.id DESC",
        $params,
        0,
        100
    ));
}

// Money is sensitive — emit ONLY the fields the legacy table renders.
$now = time();
$invoicesout = [];
foreach ($invoices as $invoice) {
    $invoicesout[] = [
        'id' => (int)$invoice->id,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'student' => (int)$invoice->studentid > 0 ? fullname($invoice) : '',
        'email' => (string)($invoice->email ?? ''),
        'accountname' => (string)$invoice->accountname,
        'billingemail' => (string)$invoice->billingemail,
        'status' => (string)$invoice->status,
        'status_label' => pqfin_invoice_status_label((string)$invoice->status),
        'currency' => (string)$invoice->currency,
        'total' => (string)$invoice->total,
        'balancedue' => (string)$invoice->balancedue,
        'dueat' => (int)$invoice->dueat,
        'overdue' => (int)$invoice->dueat > 0 && (int)$invoice->dueat < $now
            && pqfin_money_to_cents((string)$invoice->balancedue) > 0,
        'openurl' => $launch('invoice-detail', ['invoiceid' => (int)$invoice->id]),
    ];
}

// Status filter whitelist + labels, exactly as the page's <select> lists them.
$statuses = [];
foreach (['draft', 'issued', 'sent', 'partially_paid', 'paid', 'disputed', 'void'] as $candidate) {
    $statuses[$candidate] = pqfin_invoice_status_label($candidate);
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => [
        'id' => $workspaceid,
        'name' => (string)$workspace->name,
    ],
    'schemaready' => $schemaready,
    'status' => $status,
    'statuses' => $statuses,
    'students' => $studentsout,
    'invoices' => $invoicesout,
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
