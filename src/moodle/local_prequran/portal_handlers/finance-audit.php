<?php
// ---- report: finance-audit (workspace finance audit trail; read-only) --------
// Ported from local_hubredirect/finance_audit.php via finance_audit_portallib
// (guard-only: the page defines no named functions — pqfin_*/pqh_* shared
// helpers are called at runtime; its inline filter/query block is ported below
// VERBATIM). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = what the page renders: the filtered finance-audit event table
//        (latest 200 rows), the schema-ready flag, and the echoing filters
//        (+names for actor/student ids the page prints as raw ints).
// POST = 400: the page performs no writes (read-only report).
// (finance_audit.php has no pqh_live_security_audit calls — none to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_audit_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from finance_audit.php;
//    pqh_access_denied -> pqpd_fail(403, same message)) --
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace admins can view finance audit reports.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Finance audit is a read-only report.');
}

// -- GET: same filters, same WHERE construction, same 200-row query --
$studentid = optional_param('studentid', 0, PARAM_INT);
$billingaccountid = optional_param('billingaccountid', 0, PARAM_INT);
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);
$paymentid = optional_param('paymentid', 0, PARAM_INT);
$actorid = optional_param('actorid', 0, PARAM_INT);
$consumerid = optional_param('consumerid', 0, PARAM_INT);
$action = optional_param('actionfilter', '', PARAM_ALPHANUMEXT);
$datefrom = optional_param('datefrom', '', PARAM_TEXT);
$dateto = optional_param('dateto', '', PARAM_TEXT);

$where = ['workspaceid = :workspaceid'];
$params = ['workspaceid' => $workspaceid];
foreach (['consumerid' => $consumerid, 'studentid' => $studentid, 'billingaccountid' => $billingaccountid, 'invoiceid' => $invoiceid, 'paymentid' => $paymentid, 'actorid' => $actorid] as $field => $value) {
    if ($value > 0) {
        $where[] = "{$field} = :{$field}";
        $params[$field] = $value;
    }
}
if ($action !== '') {
    $where[] = 'action = :action';
    $params['action'] = $action;
}
if ($datefrom !== '') {
    $where[] = 'timecreated >= :datefrom';
    $params['datefrom'] = (int)strtotime($datefrom . ' 00:00:00');
}
if ($dateto !== '') {
    $where[] = 'timecreated <= :dateto';
    $params['dateto'] = (int)strtotime($dateto . ' 23:59:59');
}

$rows = [];
if (pqfin_finance_audit_schema_ready()) {
    $rows = array_values($DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_finance_audit}
          WHERE " . implode(' AND ', $where) . "
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        200
    ));
}

// Decorate for the client: the same userdate() label the page prints.
$nameids = [];
foreach ($rows as $row) {
    $row->time_label = userdate((int)$row->timecreated, get_string('strftimedatetimeshort'));
    $nameids[] = (int)$row->actorid;
    $nameids[] = (int)$row->studentid;
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid],
    'schemaready' => pqfin_finance_audit_schema_ready(),
    'filters' => [
        'studentid' => $studentid,
        'consumerid' => $consumerid,
        'billingaccountid' => $billingaccountid,
        'invoiceid' => $invoiceid,
        'paymentid' => $paymentid,
        'actorid' => $actorid,
        'actionfilter' => $action,
        'datefrom' => $datefrom,
        'dateto' => $dateto,
    ],
    'rows' => $rows,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
