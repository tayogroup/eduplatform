<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

$context = context_system::instance();
if (!is_siteadmin((int)$USER->id) && !has_capability('local/prequran:supportreports', $context)) {
    pqh_access_denied('Support reports access is required.', new moodle_url('/local/hubredirect/support.php'), 'Support reports unavailable');
}

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$query = trim(optional_param('q', '', PARAM_RAW_TRIMMED));
$status = optional_param('status', 'all', PARAM_ALPHANUMEXT);
$category = optional_param('category', 'all', PARAM_ALPHANUMEXT);
$export = optional_param('export', '', PARAM_ALPHA);
$canrestricted = is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportviewrestricted', $context);

function pqsr_support_ready(): bool {
    global $DB;
    $manager = $DB->get_manager();
    return $manager->table_exists('local_prequran_support_ticket')
        && $manager->table_exists('local_prequran_support_event')
        && $manager->table_exists('local_prequran_comm_message');
}

function pqsr_ticket_where(int $workspaceid, string $query, string $status, string $category, bool $canrestricted, array &$params): string {
    $where = ['1 = 1'];
    if ($workspaceid > 0) {
        $where[] = 't.workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    if ($status !== '' && $status !== 'all') {
        $where[] = 't.status = :status';
        $params['status'] = $status;
    }
    if ($category !== '' && $category !== 'all') {
        $where[] = 't.category = :category';
        $params['category'] = $category;
    }
    if (!$canrestricted) {
        $where[] = 't.visibility <> :restrictedvisibility';
        $params['restrictedvisibility'] = 'restricted';
    }
    if ($query !== '') {
        $like = '%' . strtolower($query) . '%';
        foreach (['ticket', 'subject', 'description', 'message'] as $key) {
            $params['q_' . $key] = $like;
        }
        $where[] = "(LOWER(t.ticketnumber) LIKE :q_ticket
            OR LOWER(t.subject) LIKE :q_subject
            OR LOWER(t.description) LIKE :q_description
            OR EXISTS (
                SELECT 1
                  FROM {local_prequran_comm_message} m
                 WHERE m.threadid = t.sourceconversationid
                   AND LOWER(m.body) LIKE :q_message
            ))";
    }
    return implode(' AND ', $where);
}

function pqsr_csv(string $filename, array $rows): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . clean_filename($filename) . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['id', 'ticketnumber', 'workspaceid', 'studentid', 'subject', 'category', 'priority', 'status', 'assigneeid', 'queueid', 'sla_resolution_due', 'resolvedat', 'timecreated']);
    foreach ($rows as $ticket) {
        fputcsv($out, [
            (int)$ticket->id,
            (string)$ticket->ticketnumber,
            (int)$ticket->workspaceid,
            (int)$ticket->studentid,
            (string)$ticket->subject,
            (string)$ticket->category,
            (string)$ticket->priority,
            (string)$ticket->status,
            (int)$ticket->assigneeid,
            (int)$ticket->assignmentgroupid,
            (int)$ticket->sla_resolution_due,
            (int)$ticket->resolvedat,
            (int)$ticket->timecreated,
        ]);
    }
    fclose($out);
    exit;
}

$ready = pqsr_support_ready();
$params = [];
$where = $ready ? pqsr_ticket_where($workspaceid, $query, $status, $category, $canrestricted, $params) : '1 = 0';
$tickets = $ready ? $DB->get_records_sql(
    "SELECT t.*
       FROM {local_prequran_support_ticket} t
      WHERE {$where}
   ORDER BY t.timemodified DESC, t.id DESC",
    $params,
    0,
    $export === 'csv' ? 5000 : 80
) : [];

if ($ready && $export === 'csv' && confirm_sesskey()) {
    if ($DB->get_manager()->table_exists('local_prequran_support_audit')) {
        $DB->insert_record('local_prequran_support_audit', (object)[
            'workspaceid' => $workspaceid,
            'ticketid' => 0,
            'conversationid' => 0,
            'messageid' => 0,
            'actorid' => (int)$USER->id,
            'action' => 'report_exported',
            'targettype' => 'report',
            'targetid' => 0,
            'detailsjson' => json_encode(['format' => 'csv', 'rows' => count($tickets), 'query' => $query, 'status' => $status, 'category' => $category]),
            'timecreated' => time(),
        ]);
    }
    pqsr_csv('support-tickets-' . date('Ymd-His') . '.csv', $tickets);
}

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/support_reports.php', $baseparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Support Reports');
$PAGE->set_heading('Support Reports');

$open = $ready ? (int)$DB->count_records_select('local_prequran_support_ticket', "status NOT IN ('resolved', 'closed')" . ($workspaceid > 0 ? ' AND workspaceid = ?' : ''), $workspaceid > 0 ? [$workspaceid] : []) : 0;
$unassigned = $ready ? (int)$DB->count_records_select('local_prequran_support_ticket', "status NOT IN ('resolved', 'closed') AND assigneeid = 0" . ($workspaceid > 0 ? ' AND workspaceid = ?' : ''), $workspaceid > 0 ? [$workspaceid] : []) : 0;
$breached = $ready ? (int)$DB->count_records_select('local_prequran_support_ticket', "status NOT IN ('resolved', 'closed') AND sla_resolution_due > 0 AND sla_resolution_due < ?" . ($workspaceid > 0 ? ' AND workspaceid = ?' : ''), $workspaceid > 0 ? [time(), $workspaceid] : [time()]) : 0;
$quality = $ready ? $DB->get_records_sql(
    "SELECT t.*
       FROM {local_prequran_support_ticket} t
      WHERE " . ($workspaceid > 0 ? 't.workspaceid = :workspaceid AND ' : '') . "(t.status IN ('resolved', 'closed')
         OR EXISTS (SELECT 1 FROM {local_prequran_support_event} e WHERE e.ticketid = t.id AND e.eventtype IN ('sla_breached', 'message_reported', 'satisfaction_rating')))
   ORDER BY t.timemodified DESC, t.id DESC",
    $workspaceid > 0 ? ['workspaceid' => $workspaceid] : [],
    0,
    20
) : [];

echo $OUTPUT->header();
?>
<style>
.pqsr-wrap{max-width:1180px;margin:0 auto;padding:22px 16px 42px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#173044}
.pqsr-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}
.pqsr-title{margin:0;font-size:28px;font-weight:900}
.pqsr-muted{color:#617789;font-weight:750}
.pqsr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}
.pqsr-card,.pqsr-panel{border:1px solid rgba(18,48,71,.12);border-radius:8px;background:#fff;padding:14px}
.pqsr-card strong{display:block;font-size:26px}.pqsr-card span{color:#617789;font-weight:800}
.pqsr-filter{display:grid;grid-template-columns:2fr repeat(3,1fr) auto;gap:8px;align-items:end;margin-bottom:14px}
.pqsr-field{display:grid;gap:4px;font-size:12px;font-weight:900;color:#536878}
.pqsr-field input,.pqsr-field select{min-height:40px;border:1px solid rgba(18,48,71,.16);border-radius:8px;padding:8px 10px}
.pqsr-btn{min-height:40px;border:0;border-radius:8px;background:#173044;color:#fff;font-weight:900;padding:0 14px;text-decoration:none;display:inline-flex;align-items:center}
.pqsr-btn--light{background:#eef6f9;color:#173044}
.pqsr-table{width:100%;border-collapse:collapse;font-size:13px}
.pqsr-table th,.pqsr-table td{border-bottom:1px solid rgba(18,48,71,.1);padding:9px;text-align:left;vertical-align:top}
.pqsr-table th{color:#536878;font-size:12px;text-transform:uppercase}
@media(max-width:820px){.pqsr-grid,.pqsr-filter{grid-template-columns:1fr}.pqsr-top{display:block}}
</style>
<main class="pqsr-wrap">
  <div class="pqsr-top">
    <div>
      <h2 class="pqsr-title">Support Reports</h2>
      <div class="pqsr-muted">Search tickets, review SLA risk, export CSV, and sample quality review work.</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a class="pqsr-btn pqsr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/support.php', $baseparams))->out(false); ?>">Support Inbox</a>
      <?php if (is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportaudit', $context)): ?>
        <a class="pqsr-btn pqsr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/support_audit.php', $baseparams))->out(false); ?>">Audit</a>
      <?php endif; ?>
    </div>
  </div>
  <?php if (!$ready): ?>
    <section class="pqsr-panel">Support ticket tables are not installed yet. Run Moodle upgrade first.</section>
  <?php else: ?>
    <section class="pqsr-grid" aria-label="Support metrics">
      <div class="pqsr-card"><strong><?php echo $open; ?></strong><span>Open tickets</span></div>
      <div class="pqsr-card"><strong><?php echo $unassigned; ?></strong><span>Unassigned</span></div>
      <div class="pqsr-card"><strong><?php echo $breached; ?></strong><span>SLA breached</span></div>
      <div class="pqsr-card"><strong><?php echo count($quality); ?></strong><span>Quality samples</span></div>
    </section>
    <form class="pqsr-filter" method="get">
      <?php foreach ($baseparams as $key => $value): ?>
        <?php if ($key === 'workspaceid') { continue; } ?>
        <input type="hidden" name="<?php echo s($key); ?>" value="<?php echo s((string)$value); ?>">
      <?php endforeach; ?>
      <label class="pqsr-field">Search<input name="q" value="<?php echo s($query); ?>" placeholder="Ticket, subject, message"></label>
      <label class="pqsr-field">Status<select name="status"><?php foreach (['all','open','assigned','waiting_for_user','in_progress','resolved','closed'] as $opt): ?><option value="<?php echo s($opt); ?>" <?php echo $status === $opt ? 'selected' : ''; ?>><?php echo s(str_replace('_', ' ', ucfirst($opt))); ?></option><?php endforeach; ?></select></label>
      <label class="pqsr-field">Category<input name="category" value="<?php echo s($category); ?>"></label>
      <label class="pqsr-field">Workspace<input name="workspaceid" value="<?php echo (int)$workspaceid; ?>"></label>
      <button class="pqsr-btn" type="submit">Apply</button>
    </form>
    <p><a class="pqsr-btn pqsr-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/support_reports.php', $baseparams + ['q' => $query, 'status' => $status, 'category' => $category, 'export' => 'csv', 'sesskey' => sesskey()]))->out(false); ?>">Export CSV</a></p>
    <section class="pqsr-panel">
      <h3>Tickets</h3>
      <table class="pqsr-table">
        <thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th><th>Category</th><th>Assignee</th><th>SLA due</th></tr></thead>
        <tbody>
        <?php foreach ($tickets as $ticket): ?>
          <tr>
            <td><?php echo s((string)$ticket->ticketnumber); ?></td>
            <td><?php echo s((string)$ticket->subject); ?></td>
            <td><?php echo s((string)$ticket->status); ?></td>
            <td><?php echo s((string)$ticket->priority); ?></td>
            <td><?php echo s((string)$ticket->category); ?></td>
            <td><?php echo (int)$ticket->assigneeid; ?></td>
            <td><?php echo !empty($ticket->sla_resolution_due) ? s(userdate((int)$ticket->sla_resolution_due, get_string('strftimedatetimeshort'))) : '-'; ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </section>
    <section class="pqsr-panel" style="margin-top:14px">
      <h3>Quality Review Queue</h3>
      <table class="pqsr-table">
        <thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Updated</th></tr></thead>
        <tbody>
        <?php foreach ($quality as $ticket): ?>
          <tr><td><?php echo s((string)$ticket->ticketnumber); ?></td><td><?php echo s((string)$ticket->subject); ?></td><td><?php echo s((string)$ticket->status); ?></td><td><?php echo s(userdate((int)$ticket->timemodified, get_string('strftimedatetimeshort'))); ?></td></tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </section>
  <?php endif; ?>
</main>
<?php
echo $OUTPUT->footer();
