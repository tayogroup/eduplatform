<?php
// ---- report: notification-delivery-audit (SQA notification delivery evidence; read-only) ----
// Ported from local_hubredirect/notification_delivery_audit.php via
// notification_delivery_audit_portallib (pqnda_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = what the page renders: the per-run notification-delivery evidence rows
//        (message/announcement/email-delivery/invoice/attendance/grade/low-score
//        checks, each PASS/CHECK + count + recent evidence), the echoing filters,
//        and +names for the student/parent/teacher filter ids.
// POST = 400: the page performs no writes (read-only evidence report).
// (notification_delivery_audit.php has no pqh_live_security_audit calls — none to keep.)
// CSV export: the page's export=csv is served client-side from this same JSON
//             dataset by the portal HTML; the endpoint always returns JSON.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/notification_delivery_audit_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- ENTRY access check (verbatim from notification_delivery_audit.php:
//    pqh_require_academy_operations -> pqpd_fail(403, same message)) --
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can review notification delivery evidence.');
}

$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', 0, PARAM_INT));
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$studentid = optional_param('studentid', 0, PARAM_INT);
$parentid = optional_param('parentid', 0, PARAM_INT);
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$assessmentid = optional_param('assessmentid', 0, PARAM_INT);

// -- ENTRY workspace guard (verbatim: pqh_access_denied -> pqpd_fail(403, same)) --
if ($workspaceid <= 0) {
    pqpd_fail(403, 'Notification delivery audit requires a workspace context.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Notification delivery audit is a read-only report.');
}

// -- GET: the page's evidence row-building block, VERBATIM --
$rows = [];
$runlike = $runid !== '' ? pqnda_like($runid) : '';

if (pqh_table_exists_safe('local_prequran_comm_thread') && pqh_table_exists_safe('local_prequran_comm_message') && $runlike !== '') {
    $count = pqnda_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_comm_thread} t
           JOIN {local_prequran_comm_message} m ON m.threadid = t.id
          WHERE t.workspaceid = :workspaceid
            AND (" . $DB->sql_like('t.subject', ':runsubject', false) . "
             OR " . $DB->sql_like('m.body', ':runbody', false) . ")",
        ['workspaceid' => $workspaceid, 'runsubject' => $runlike, 'runbody' => $runlike]
    );
    $evidence = pqnda_recent_sql(
        "SELECT t.subject, m.status, m.timecreated
           FROM {local_prequran_comm_thread} t
           JOIN {local_prequran_comm_message} m ON m.threadid = t.id
          WHERE t.workspaceid = :workspaceid
            AND (" . $DB->sql_like('t.subject', ':runsubject', false) . "
             OR " . $DB->sql_like('m.body', ':runbody', false) . ")
       ORDER BY m.timecreated DESC",
        ['workspaceid' => $workspaceid, 'runsubject' => $runlike, 'runbody' => $runlike]
    );
    $rows[] = pqnda_row('parent-teacher message notification', 'communications_center message/thread', $count, $evidence);
}

if (pqh_table_exists_safe('local_prequran_comm_campaign') && $runlike !== '') {
    $count = pqnda_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_comm_campaign} c
          WHERE c.workspaceid = :workspaceid
            AND (" . $DB->sql_like('c.title', ':runtitle', false) . "
             OR " . $DB->sql_like('c.messagebody', ':runbody', false) . ")",
        ['workspaceid' => $workspaceid, 'runtitle' => $runlike, 'runbody' => $runlike]
    );
    $evidence = pqnda_recent_sql(
        "SELECT c.title, c.status, c.channel, c.audience, c.timecreated
           FROM {local_prequran_comm_campaign} c
          WHERE c.workspaceid = :workspaceid
            AND (" . $DB->sql_like('c.title', ':runtitle', false) . "
             OR " . $DB->sql_like('c.messagebody', ':runbody', false) . ")
       ORDER BY c.timecreated DESC",
        ['workspaceid' => $workspaceid, 'runtitle' => $runlike, 'runbody' => $runlike]
    );
    $rows[] = pqnda_row('announcement notification', 'communications_center campaign', $count, $evidence);
}

if (pqh_table_exists_safe('local_prequran_comm_delivery') && $runlike !== '') {
    $count = pqnda_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_comm_delivery} d
           JOIN {local_prequran_comm_campaign} c ON c.id = d.campaignid
          WHERE d.workspaceid = :workspaceid
            AND (" . $DB->sql_like('c.title', ':runtitle', false) . "
             OR " . $DB->sql_like('c.messagebody', ':runbody', false) . ")",
        ['workspaceid' => $workspaceid, 'runtitle' => $runlike, 'runbody' => $runlike]
    );
    $evidence = pqnda_recent_sql(
        "SELECT d.channel, d.status, d.recipientid, d.recipient_address, c.title
           FROM {local_prequran_comm_delivery} d
           JOIN {local_prequran_comm_campaign} c ON c.id = d.campaignid
          WHERE d.workspaceid = :workspaceid
            AND (" . $DB->sql_like('c.title', ':runtitle', false) . "
             OR " . $DB->sql_like('c.messagebody', ':runbody', false) . ")
       ORDER BY d.timecreated DESC",
        ['workspaceid' => $workspaceid, 'runtitle' => $runlike, 'runbody' => $runlike]
    );
    $rows[] = pqnda_row('email delivery log evidence', 'communications delivery log', $count, $evidence);
}

if (pqh_table_exists_safe('local_prequran_finance_delivery') && $invoiceid > 0) {
    $count = pqnda_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_finance_delivery}
          WHERE workspaceid = :workspaceid
            AND invoiceid = :invoiceid
            AND eventtype = :eventtype",
        ['workspaceid' => $workspaceid, 'invoiceid' => $invoiceid, 'eventtype' => 'invoice_issued']
    );
    $evidence = pqnda_recent_sql(
        "SELECT eventtype, status, recipientid, recipientemail, subject
           FROM {local_prequran_finance_delivery}
          WHERE workspaceid = :workspaceid
            AND invoiceid = :invoiceid
            AND eventtype = :eventtype
       ORDER BY timecreated DESC",
        ['workspaceid' => $workspaceid, 'invoiceid' => $invoiceid, 'eventtype' => 'invoice_issued']
    );
    $rows[] = pqnda_row('invoice notification', 'finance delivery log', $count, $evidence);
}

if (pqh_table_exists_safe('local_prequran_finance_audit') && $invoiceid > 0) {
    $count = pqnda_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_finance_audit}
          WHERE workspaceid = :workspaceid
            AND action = :action
            AND invoiceid = :invoiceid",
        ['workspaceid' => $workspaceid, 'action' => 'finance_notification_sent', 'invoiceid' => $invoiceid]
    );
    $evidence = pqnda_recent_sql(
        "SELECT action, targetid, invoiceid, details, timecreated
           FROM {local_prequran_finance_audit}
          WHERE workspaceid = :workspaceid
            AND action = :action
            AND invoiceid = :invoiceid
       ORDER BY timecreated DESC",
        ['workspaceid' => $workspaceid, 'action' => 'finance_notification_sent', 'invoiceid' => $invoiceid]
    );
    $rows[] = pqnda_row('invoice notification audit', 'finance audit log', $count, $evidence);
}

if (pqh_table_exists_safe('local_prequran_live_audit') && $studentid > 0) {
    foreach ([
        'attendance_recorded' => 'attendance notification',
        'grade_published' => 'grade notification',
        'low_score_alert' => 'low-score alert notification',
    ] as $eventtype => $label) {
        $params = [
            'studentneedle' => '%"studentid":' . $studentid . '%',
            'eventneedle' => '%"eventtype":"' . $eventtype . '"%',
            'action' => 'notification_sent',
        ];
        $extra = '';
        if ($eventtype === 'attendance_recorded' && $sessionid > 0) {
            $extra = ' AND sessionid = :sessionid';
            $params['sessionid'] = $sessionid;
        }
        $count = pqnda_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_live_audit}
              WHERE action = :action
                AND " . $DB->sql_like('details', ':studentneedle', false) . "
                AND " . $DB->sql_like('details', ':eventneedle', false) . $extra,
            $params
        );
        $evidence = pqnda_recent_sql(
            "SELECT action, targetid, details, timecreated
               FROM {local_prequran_live_audit}
              WHERE action = :action
                AND " . $DB->sql_like('details', ':studentneedle', false) . "
                AND " . $DB->sql_like('details', ':eventneedle', false) . $extra . "
           ORDER BY timecreated DESC",
            $params
        );
        $rows[] = pqnda_row($label, 'live notification audit log', $count, $evidence);
    }
}

if (!$rows) {
    $rows[] = pqnda_row('notification audit input', 'configuration', 0, 'Provide runid plus generated student/session/invoice identifiers.');
}

$passcount = count(array_filter($rows, static fn($row) => $row['status'] === 'PASS'));

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspace' => ['id' => $workspaceid],
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'filters' => [
        'runid' => $runid,
        'studentid' => $studentid,
        'parentid' => $parentid,
        'teacherid' => $teacherid,
        'invoiceid' => $invoiceid,
        'sessionid' => $sessionid,
        'assessmentid' => $assessmentid,
    ],
    'passcount' => $passcount,
    'checkcount' => count($rows),
    'rows' => $rows,
    'names' => pqpd_names([$studentid, $parentid, $teacherid]),
], JSON_UNESCAPED_SLASHES);
exit;
