<?php
// ---- report: student-billing (per-student invoice dashboard; read-only) ----
// Ported from local_hubredirect/student_billing.php via student_billing_portallib
// (guard-only: the page defines no functions — pqfin_*/pqh_* shared helpers are
// called at runtime). Included from portal_data.php AFTER token auth: $claims
// verified, $USER set to the token user, JSON exception handler installed,
// headers sent.
// GET  = what the page renders: workspace + student header, invoice amount
//        metrics, issued payer-visible invoice rows (+ active payment plan),
//        and the finance-office support label.
// POST = rejected with 400: student_billing.php has no write blocks.
// (student_billing.php has no pqh_live_security_audit calls — none to keep.)
// Payment links: the page never links payment_start.php; its per-invoice
// "View" opens invoice_view.php (which hosts the Pay online bridge). That
// legacy URL is kept ABSOLUTE — the invoice-view/payment redirect bridge is
// intentionally not migrated.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/student_billing_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'student-billing is read-only: student_billing.php has no write actions.');
}

// -- entry access checks (verbatim order + messages from student_billing.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$studentid = optional_param('studentid', $userid, PARAM_INT);

if ($workspaceid <= 0 || $studentid <= 0 || !pqfin_student_in_workspace($studentid, $workspaceid)) {
    pqpd_fail(403, 'Student billing is not available for this workspace.');
}
if ($userid !== $studentid && !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only the student or a workspace finance admin can view this billing dashboard.');
}
if (!pqfin_student_billing_visible($workspaceid, $studentid, $userid, $consumercontext)) {
    pqpd_fail(403, 'Student billing visibility is disabled for this workspace.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$student = core_user::get_user($studentid, 'id,firstname,lastname,email,idnumber', MUST_EXIST);
$invoices = pqfin_invoice_rows_for_student($workspaceid, $studentid, $userid, $consumercontext);
$metrics = pqfin_invoice_amount_metrics($invoices);

// Same URL params the page carries on its legacy links.
$legacyparams = [];
if (!empty($consumercontext->consumerslug)) {
    $legacyparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $legacyparams['workspaceid'] = $workspaceid;
}
if ($studentid > 0) {
    $legacyparams['studentid'] = $studentid;
}

// Money data is sensitive: pqfin_invoice_rows_for_student returns i.* plus
// billing email / student email — emit ONLY the fields the legacy page renders.
$now = time();
$rows = [];
foreach ($invoices as $invoice) {
    $plan = pqfin_active_payment_plan_for_invoice((int)$invoice->id);
    $rows[] = [
        'id' => (int)$invoice->id,
        'invoicenumber' => (string)$invoice->invoicenumber,
        'workspace_name' => (string)$invoice->workspace_name,
        'status' => (string)$invoice->status,
        'status_label' => pqfin_invoice_status_label((string)$invoice->status),
        'currency' => (string)$invoice->currency,
        'total' => (string)$invoice->total,
        'paidamount' => (string)$invoice->paidamount,
        'balancedue' => (string)$invoice->balancedue,
        'dueat' => (int)$invoice->dueat,
        'overdue' => (int)$invoice->dueat > 0 && (int)$invoice->dueat < $now
            && pqfin_money_to_cents((string)$invoice->balancedue) > 0,
        'plan' => $plan ? [
            'plannumber' => (string)$plan->plannumber,
            'status_label' => pqfin_payment_plan_status_label((string)$plan->status),
        ] : null,
        'viewurl' => (new moodle_url('/local/hubredirect/invoice_view.php',
            ['invoiceid' => (int)$invoice->id] + $legacyparams))->out(false),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'student' => ['id' => $studentid, 'name' => fullname($student)],
    'metrics' => $metrics,
    'invoices' => $rows,
    'supportlabel' => pqfin_invoice_support_label($workspace, $consumercontext),
    'names' => pqpd_names([$studentid]),
], JSON_UNESCAPED_SLASHES);
exit;
