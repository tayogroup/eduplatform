<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
$prequranlocallib = $CFG->dirroot . '/local/prequran/locallib.php';
if (file_exists($prequranlocallib)) {
    require_once($prequranlocallib);
}
require_login();

$context = context_system::instance();
if (!is_siteadmin((int)$USER->id) && !has_capability('local/prequran:supportaudit', $context)) {
    pqh_access_denied('Support audit access is required.', new moodle_url('/local/hubredirect/support.php'), 'Support audit unavailable');
}

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($workspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $workspaceid = (int)$consumercontext->workspaceid;
}
$ticketid = optional_param('ticketid', 0, PARAM_INT);
$conversationid = optional_param('conversationid', 0, PARAM_INT);
$action = optional_param('action', 'all', PARAM_ALPHANUMEXT);
$canrestricted = is_siteadmin((int)$USER->id) || has_capability('local/prequran:supportviewrestricted', $context);

function pqsa_ready(): bool {
    global $DB;
    $manager = $DB->get_manager();
    return $manager->table_exists('local_prequran_support_audit')
        && $manager->table_exists('local_prequran_support_event')
        && $manager->table_exists('local_prequran_support_ticket')
        && $manager->table_exists('local_prequran_support_policy');
}

function pqsa_policy(int $workspaceid, int $consumerid): array {
    if (function_exists('local_prequran_support_effective_policy')) {
        return local_prequran_support_effective_policy($workspaceid, $consumerid);
    }
    return [
        'async_enabled' => (int)get_config('local_prequran', 'support_async_enabled') === 1,
        'livechat_enabled' => (int)get_config('local_prequran', 'support_livechat_enabled') === 1,
        'source' => 'global',
    ];
}

function pqsa_where(int $workspaceid, int $ticketid, int $conversationid, string $action, bool $canrestricted, array &$params): string {
    $where = ['1 = 1'];
    if (!$canrestricted) {
        $where[] = "(ticketid = 0 OR ticketid NOT IN (SELECT id FROM {local_prequran_support_ticket} WHERE visibility = :restrictedvisibility))";
        $params['restrictedvisibility'] = 'restricted';
    }
    if ($workspaceid > 0) {
        $where[] = 'workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    if ($ticketid > 0) {
        $where[] = 'ticketid = :ticketid';
        $params['ticketid'] = $ticketid;
    }
    if ($conversationid > 0) {
        $where[] = 'conversationid = :conversationid';
        $params['conversationid'] = $conversationid;
    }
    if ($action !== '' && $action !== 'all') {
        $where[] = 'action = :action';
        $params['action'] = $action;
    }
    return implode(' AND ', $where);
}

$ready = pqsa_ready();
$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

$audit = [];
$events = [];
$coverage = [];
$gates = [];
$metrics = [];
$rollback = 'Disable support entry points for non-pilot scopes, preserve records, and keep read-only audit access.';

if ($ready) {
    $DB->insert_record('local_prequran_support_audit', (object)[
        'workspaceid' => $workspaceid,
        'ticketid' => $ticketid,
        'conversationid' => $conversationid,
        'messageid' => 0,
        'actorid' => (int)$USER->id,
        'action' => 'audit_review_viewed',
        'targettype' => 'audit',
        'targetid' => 0,
        'detailsjson' => json_encode(['action_filter' => $action]),
        'timecreated' => time(),
    ]);
    $params = [];
    $where = pqsa_where($workspaceid, $ticketid, $conversationid, $action, $canrestricted, $params);
    $audit = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_support_audit}
          WHERE {$where}
       ORDER BY timecreated DESC, id DESC",
        $params,
        0,
        100
    );
    $eventwhere = ['1 = 1'];
    $eventparams = [];
    if (!$canrestricted) {
        $eventwhere[] = "(ticketid = 0 OR ticketid NOT IN (SELECT id FROM {local_prequran_support_ticket} WHERE visibility = :restrictedvisibility))";
        $eventparams['restrictedvisibility'] = 'restricted';
    }
    if ($ticketid > 0) {
        $eventwhere[] = 'ticketid = :ticketid';
        $eventparams['ticketid'] = $ticketid;
    }
    if ($conversationid > 0) {
        $eventwhere[] = 'conversationid = :conversationid';
        $eventparams['conversationid'] = $conversationid;
    }
    $events = $DB->get_records_sql(
        "SELECT *
           FROM {local_prequran_support_event}
          WHERE " . implode(' AND ', $eventwhere) . "
       ORDER BY timecreated DESC, id DESC",
        $eventparams,
        0,
        100
    );
    $coverage = $DB->get_records_sql(
        "SELECT action, COUNT(1) AS c
           FROM {local_prequran_support_audit}
          " . ($workspaceid > 0 ? "WHERE workspaceid = :workspaceid" : "") . "
       GROUP BY action
       ORDER BY c DESC, action ASC",
        $workspaceid > 0 ? ['workspaceid' => $workspaceid] : []
    );
    $policy = pqsa_policy($workspaceid, (int)($consumercontext->consumerid ?? 0));
    $open = (int)$DB->count_records_select('local_prequran_support_ticket', "status NOT IN ('resolved', 'closed')" . ($workspaceid > 0 ? ' AND workspaceid = ?' : ''), $workspaceid > 0 ? [$workspaceid] : []);
    $breached = (int)$DB->count_records_select('local_prequran_support_ticket', "status NOT IN ('resolved', 'closed') AND sla_resolution_due > 0 AND sla_resolution_due < ?" . ($workspaceid > 0 ? ' AND workspaceid = ?' : ''), $workspaceid > 0 ? [time(), $workspaceid] : [time()]);
    $restricted = (int)$DB->count_records_select('local_prequran_support_ticket', "visibility = 'restricted'" . ($workspaceid > 0 ? ' AND workspaceid = ?' : ''), $workspaceid > 0 ? [$workspaceid] : []);
    $gates = [
        ['Schema', 'pass', 'Support schema and audit tables are installed.'],
        ['Workspace feature flags', !empty($policy['async_enabled']) ? 'pass' : 'warn', !empty($policy['async_enabled']) ? 'Async support is enabled for this scope.' : 'Async support is disabled for this scope.'],
        ['Live chat flag', !empty($policy['livechat_enabled']) ? 'pass' : 'warn', !empty($policy['livechat_enabled']) ? 'Live chat is enabled for this scope.' : 'Live chat is disabled; async fallback may still be used.'],
        ['Audit evidence', count($audit) > 0 ? 'pass' : 'warn', count($audit) > 0 ? 'Recent audit rows are available.' : 'Complete a pilot smoke test to generate audit evidence.'],
        ['SLA risk', $breached > 0 ? 'warn' : 'pass', $breached > 0 ? 'Triage breached tickets before widening pilot.' : 'No active breached tickets found.'],
        ['Restricted queue', $restricted > 0 ? 'warn' : 'pass', $restricted > 0 ? 'Restricted tickets exist; confirm authorized reviewer coverage.' : 'No restricted tickets found.'],
    ];
    $metrics = [
        'Open tickets' => $open,
        'Breached tickets' => $breached,
        'Restricted tickets' => $restricted,
        'Audit rows shown' => count($audit),
        'Ticket events shown' => count($events),
        'Policy source' => $policy['source'],
    ];
}

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/support_audit.php', $baseparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Support Audit Review');
$PAGE->set_heading('Support Audit Review');

echo $OUTPUT->header();
?>
<style>
.pqsa-wrap{max-width:1180px;margin:0 auto;padding:22px 16px 42px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#173044}
.pqsa-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}
.pqsa-title{margin:0;font-size:28px;font-weight:900}.pqsa-muted{color:#617789;font-weight:750}
.pqsa-actions{display:flex;gap:8px;flex-wrap:wrap}.pqsa-btn{min-height:40px;border:0;border-radius:8px;background:#173044;color:#fff;font-weight:900;padding:0 14px;text-decoration:none;display:inline-flex;align-items:center}
.pqsa-btn--light{background:#eef6f9;color:#173044}.pqsa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
.pqsa-card,.pqsa-panel{border:1px solid rgba(18,48,71,.12);border-radius:8px;background:#fff;padding:14px}.pqsa-card strong{display:block;font-size:22px}
.pqsa-filter{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-items:end;margin-bottom:14px}.pqsa-field{display:grid;gap:4px;font-size:12px;font-weight:900;color:#536878}
.pqsa-field input,.pqsa-field select{min-height:40px;border:1px solid rgba(18,48,71,.16);border-radius:8px;padding:8px 10px}.pqsa-table{width:100%;border-collapse:collapse;font-size:13px}
.pqsa-table th,.pqsa-table td{border-bottom:1px solid rgba(18,48,71,.1);padding:9px;text-align:left;vertical-align:top}.pqsa-table th{color:#536878;font-size:12px;text-transform:uppercase}
.pqsa-gate{display:grid;gap:5px}.pqsa-status{display:inline-flex;width:max-content;border-radius:999px;padding:3px 8px;font-size:12px;font-weight:900}.pqsa-status--pass{background:#e7f6ed;color:#17623b}.pqsa-status--warn{background:#fff4dd;color:#7b4a00}.pqsa-status--fail{background:#fde8e8;color:#9b1c1c}
@media(max-width:820px){.pqsa-grid,.pqsa-filter{grid-template-columns:1fr}.pqsa-top{display:block}}
</style>
<main class="pqsa-wrap">
  <div class="pqsa-top">
    <div>
      <h2 class="pqsa-title">Support Audit Review</h2>
      <div class="pqsa-muted">Pilot launch gates, audit evidence, event timelines, and rollback reference.</div>
    </div>
    <div class="pqsa-actions">
      <a class="pqsa-btn pqsa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/support.php', $baseparams))->out(false); ?>">Support Inbox</a>
      <a class="pqsa-btn pqsa-btn--light" href="<?php echo (new moodle_url('/local/hubredirect/support_reports.php', $baseparams))->out(false); ?>">Reports</a>
    </div>
  </div>
  <?php if (!$ready): ?>
    <section class="pqsa-panel">Support audit tables are not installed yet. Run Moodle upgrade first.</section>
  <?php else: ?>
    <section class="pqsa-grid" aria-label="Pilot metrics">
      <?php foreach ($metrics as $label => $value): ?>
        <div class="pqsa-card"><strong><?php echo s((string)$value); ?></strong><span><?php echo s((string)$label); ?></span></div>
      <?php endforeach; ?>
    </section>
    <section class="pqsa-panel">
      <h3>Pilot Gates</h3>
      <div class="pqsa-grid">
        <?php foreach ($gates as $gate): ?>
          <div class="pqsa-card pqsa-gate"><strong><?php echo s($gate[0]); ?></strong><span class="pqsa-status pqsa-status--<?php echo s($gate[1]); ?>"><?php echo s(strtoupper($gate[1])); ?></span><span><?php echo s($gate[2]); ?></span></div>
        <?php endforeach; ?>
      </div>
      <p class="pqsa-muted"><?php echo s($rollback); ?></p>
    </section>
    <form class="pqsa-filter" method="get">
      <?php if (!empty($consumercontext->consumerslug)): ?><input type="hidden" name="consumer" value="<?php echo s((string)$consumercontext->consumerslug); ?>"><?php endif; ?>
      <label class="pqsa-field">Workspace<input name="workspaceid" value="<?php echo (int)$workspaceid; ?>"></label>
      <label class="pqsa-field">Ticket ID<input name="ticketid" value="<?php echo (int)$ticketid; ?>"></label>
      <label class="pqsa-field">Conversation ID<input name="conversationid" value="<?php echo (int)$conversationid; ?>"></label>
      <label class="pqsa-field">Action<input name="action" value="<?php echo s($action); ?>"></label>
      <button class="pqsa-btn" type="submit">Apply</button>
    </form>
    <section class="pqsa-panel">
      <h3>Audit Coverage</h3>
      <table class="pqsa-table"><thead><tr><th>Action</th><th>Rows</th></tr></thead><tbody>
      <?php foreach ($coverage as $row): ?><tr><td><?php echo s((string)$row->action); ?></td><td><?php echo (int)$row->c; ?></td></tr><?php endforeach; ?>
      </tbody></table>
    </section>
    <section class="pqsa-panel" style="margin-top:14px">
      <h3>Recent Support Audit</h3>
      <table class="pqsa-table"><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th><th>Ticket</th><th>Conversation</th><th>Details</th></tr></thead><tbody>
      <?php foreach ($audit as $row): ?><tr><td><?php echo s(userdate((int)$row->timecreated, get_string('strftimedatetimeshort'))); ?></td><td><?php echo s((string)$row->action); ?></td><td><?php echo (int)$row->actorid; ?></td><td><?php echo s((string)$row->targettype) . ' #' . (int)$row->targetid; ?></td><td><?php echo (int)$row->ticketid; ?></td><td><?php echo (int)$row->conversationid; ?></td><td><?php echo s((string)$row->detailsjson); ?></td></tr><?php endforeach; ?>
      </tbody></table>
    </section>
    <section class="pqsa-panel" style="margin-top:14px">
      <h3>Recent Ticket Events</h3>
      <table class="pqsa-table"><thead><tr><th>Time</th><th>Event</th><th>Visibility</th><th>Actor</th><th>Ticket</th><th>Conversation</th><th>Details</th></tr></thead><tbody>
      <?php foreach ($events as $row): ?><tr><td><?php echo s(userdate((int)$row->timecreated, get_string('strftimedatetimeshort'))); ?></td><td><?php echo s((string)$row->eventtype); ?></td><td><?php echo s((string)$row->visibility); ?></td><td><?php echo (int)$row->actorid; ?></td><td><?php echo (int)$row->ticketid; ?></td><td><?php echo (int)$row->conversationid; ?></td><td><?php echo s((string)$row->detailsjson); ?></td></tr><?php endforeach; ?>
      </tbody></table>
    </section>
  <?php endif; ?>
</main>
<?php
echo $OUTPUT->footer();
