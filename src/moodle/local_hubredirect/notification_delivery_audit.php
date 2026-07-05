<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can review notification delivery evidence.',
    new moodle_url('/local/hubredirect/workspace_dashboard.php'),
    'Notification delivery access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$studentid = optional_param('studentid', 0, PARAM_INT);
$parentid = optional_param('parentid', 0, PARAM_INT);
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$invoiceid = optional_param('invoiceid', 0, PARAM_INT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$assessmentid = optional_param('assessmentid', 0, PARAM_INT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);

if ($workspaceid <= 0) {
    pqh_access_denied('Notification delivery audit requires a workspace context.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Workspace required');
}

function pqnda_like(string $value): string {
    global $DB;
    return '%' . $DB->sql_like_escape($value) . '%';
}

function pqnda_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqnda_recent_sql(string $sql, array $params = []): string {
    global $DB;
    try {
        $row = $DB->get_record_sql($sql, $params, IGNORE_MULTIPLE);
        if (!$row) {
            return '';
        }
        $parts = [];
        foreach ((array)$row as $key => $value) {
            if ($value !== null && $value !== '') {
                $parts[] = $key . '=' . core_text::substr((string)$value, 0, 140);
            }
        }
        return implode('; ', $parts);
    } catch (Throwable $e) {
        return '';
    }
}

function pqnda_row(string $category, string $source, int $count, string $evidence): array {
    return [
        'category' => $category,
        'source' => $source,
        'status' => $count > 0 ? 'PASS' : 'CHECK',
        'count' => $count,
        'evidence' => $evidence !== '' ? $evidence : 'No matching evidence found for the supplied run identifiers.',
    ];
}

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

if ($export === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="notification-delivery-audit-' . clean_filename($runid !== '' ? $runid : (string)time()) . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['category', 'source', 'status', 'count', 'evidence']);
    foreach ($rows as $row) {
        fputcsv($out, [$row['category'], $row['source'], $row['status'], $row['count'], $row['evidence']]);
    }
    fclose($out);
    exit;
}

$params = [
    'consumer' => (string)($consumercontext->consumerslug ?? ''),
    'workspaceid' => $workspaceid,
    'runid' => $runid,
    'studentid' => $studentid,
    'parentid' => $parentid,
    'teacherid' => $teacherid,
    'invoiceid' => $invoiceid,
    'sessionid' => $sessionid,
    'assessmentid' => $assessmentid,
];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/notification_delivery_audit.php', array_filter($params, static fn($value) => $value !== '' && $value !== 0)));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Notification Delivery Audit');
$PAGE->set_heading('Notification Delivery Audit');
$PAGE->add_body_class('pqnda-page');

$passcount = count(array_filter($rows, static fn($row) => $row['status'] === 'PASS'));

echo $OUTPUT->header();
?>
<style>
body.pqnda-page header,body.pqnda-page footer,body.pqnda-page nav.navbar,body.pqnda-page #page-header,body.pqnda-page #page-footer,body.pqnda-page .drawer,body.pqnda-page .drawer-toggles,body.pqnda-page .block-region,body.pqnda-page [data-region="drawer"],body.pqnda-page [data-region="right-hand-drawer"]{display:none!important}
body.pqnda-page #page,body.pqnda-page #page-content,body.pqnda-page #region-main,body.pqnda-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqnda-shell{min-height:100vh;padding:30px 18px 58px;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqnda-wrap{max-width:1180px;margin:0 auto}.pqnda-top,.pqnda-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqnda-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqnda-title{margin:0;color:#221b22;font-size:30px;font-weight:950}.pqnda-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqnda-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqnda-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:#eef4f6;color:#173044!important;border:1px solid rgba(23,48,68,.12);text-decoration:none;font-size:12px;font-weight:950}.pqnda-table{width:100%;border-collapse:collapse}.pqnda-table th,.pqnda-table td{padding:11px 9px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqnda-table th{color:#5e7280;background:#fbfdff;font-size:12px;font-weight:950;text-transform:uppercase}.pqnda-pill{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border-radius:999px;background:#fff6dc;color:#79520f;font-size:12px;font-weight:950}.pqnda-pill--ok{background:#edf9ef;color:#245c35}.pqnda-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-word}.pqnda-muted{display:block;color:#728391;font-size:12px;font-weight:800}.pqnda-kpis{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.pqnda-kpi{padding:10px 12px;border-radius:8px;background:#fbfdff;border:1px solid rgba(23,48,68,.1);font-weight:900}
</style>
<main class="pqnda-shell">
  <div class="pqnda-wrap">
    <section class="pqnda-top">
      <div>
        <h1 class="pqnda-title">Notification Delivery Audit</h1>
        <p class="pqnda-sub">Message, announcement, invoice, attendance, grade, low-score, notification-center, email-delivery, and log evidence for one SQA run.</p>
        <div class="pqnda-kpis">
          <span class="pqnda-kpi"><?php echo (int)$passcount; ?> pass</span>
          <span class="pqnda-kpi"><?php echo count($rows); ?> checks</span>
          <span class="pqnda-kpi pqnda-code"><?php echo s($runid !== '' ? $runid : 'no run id'); ?></span>
        </div>
      </div>
      <nav class="pqnda-actions">
        <a class="pqnda-btn" href="<?php echo (new moodle_url('/local/hubredirect/notification_delivery_audit.php', $params + ['export' => 'csv']))->out(false); ?>">Export CSV</a>
        <a class="pqnda-btn" href="<?php echo (new moodle_url('/local/hubredirect/notification_diagnostics.php', ['consumer' => (string)($consumercontext->consumerslug ?? ''), 'workspaceid' => $workspaceid]))->out(false); ?>">Brand diagnostics</a>
      </nav>
    </section>
    <section class="pqnda-panel">
      <table class="pqnda-table">
        <thead><tr><th>Category</th><th>Status</th><th>Source</th><th>Count</th><th>Evidence</th></tr></thead>
        <tbody>
          <?php foreach ($rows as $row): ?>
            <tr>
              <td><strong><?php echo s($row['category']); ?></strong></td>
              <td><span class="pqnda-pill <?php echo $row['status'] === 'PASS' ? 'pqnda-pill--ok' : ''; ?>"><?php echo s($row['status']); ?></span></td>
              <td><span class="pqnda-code"><?php echo s($row['source']); ?></span></td>
              <td><?php echo (int)$row['count']; ?></td>
              <td><span class="pqnda-code"><?php echo s($row['evidence']); ?></span></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
