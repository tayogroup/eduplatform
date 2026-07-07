<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$invoiceid = required_param('invoiceid', PARAM_INT);
$financetoken = optional_param('financetoken', '', PARAM_ALPHANUMEXT);
$securelink = $financetoken !== '' ? pqfin_validate_secure_link('invoice_view', $invoiceid, $financetoken) : false;
if ($financetoken !== '' && !$securelink) {
    pqh_access_denied('This payment link is expired or no longer valid.', new moodle_url('/local/hubredirect/dashboard.php'), 'Payment link unavailable');
}
if (!$securelink) {
    require_login();
}

if (!pqfin_invoice_schema_ready() || !pqfin_gateway_schema_ready()) {
    pqh_access_denied('Hosted payments are not available yet.', new moodle_url('/local/hubredirect/dashboard.php'), 'Hosted payments unavailable');
}
$invoice = $DB->get_record('local_prequran_invoice', ['id' => $invoiceid], '*', IGNORE_MISSING);
if (!$invoice || (!$securelink && !pqfin_user_can_view_hosted_invoice($invoice, (int)$USER->id, $consumercontext))) {
    pqh_access_denied('This invoice is not available for online payment.', new moodle_url('/local/hubredirect/dashboard.php'), 'Invoice access required');
}

try {
    $session = pqfin_create_hosted_payment_session($invoiceid, $consumercontext, $securelink ? 0 : (int)$USER->id);
    redirect($session['checkouturl']);
} catch (Throwable $e) {
    pqfin_audit('hosted_payment_session_failed', (int)$invoice->workspaceid, (int)$invoice->studentid, $invoiceid, [
        'targettype' => 'invoice',
        'consumerid' => (int)$invoice->consumerid,
        'invoiceid' => $invoiceid,
        'error' => $e->getMessage(),
        'actorid' => $securelink ? 0 : (int)$USER->id,
    ]);
    pqh_access_denied($e->getMessage(), new moodle_url('/local/hubredirect/invoice_view.php', ['invoiceid' => $invoiceid, 'workspaceid' => (int)$invoice->workspaceid]), 'Hosted payment unavailable');
}
