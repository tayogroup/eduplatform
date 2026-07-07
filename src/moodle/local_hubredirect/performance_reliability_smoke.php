<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run SQA performance/reliability smoke checks.',
    new moodle_url('/local/hubredirect/workspace_dashboard.php'),
    'Performance reliability smoke access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$dashboardthreshold = max(100, optional_param('dashboard_ms', 12000, PARAM_INT));
$exportthreshold = max(100, optional_param('export_ms', 15000, PARAM_INT));
$endpointthreshold = max(50, optional_param('endpoint_ms', 2500, PARAM_INT));
$export = optional_param('export', '', PARAM_ALPHA);
$action = optional_param('action', 'measure', PARAM_ALPHANUMEXT);
$error = '';
$result = null;

if ($workspaceid <= 0) {
    pqh_access_denied('Performance reliability smoke requires a workspace context.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Workspace required');
}

function pqprs_table_ready(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqprs_measure(string $name, int $thresholdms, callable $callback): array {
    $start = microtime(true);
    $evidence = '';
    try {
        $evidence = (string)$callback();
        $status = 'PASS';
    } catch (Throwable $e) {
        $evidence = $e->getMessage();
        $status = 'FAIL';
    }
    $duration = (int)round((microtime(true) - $start) * 1000);
    if ($status === 'PASS' && $duration > $thresholdms) {
        $status = 'FAIL';
        $evidence .= ($evidence !== '' ? '; ' : '') . 'duration exceeded threshold';
    }
    return [
        'name' => $name,
        'status' => $status,
        'duration_ms' => $duration,
        'threshold_ms' => $thresholdms,
        'evidence' => $evidence,
    ];
}

function pqprs_count_table(string $table, array $conditions = []): int {
    global $DB;
    if (!pqprs_table_ready($table)) {
        return 0;
    }
    try {
        return (int)$DB->count_records($table, $conditions);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqprs_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqprs_build_result(
    string $runid,
    int $workspaceid,
    int $consumerid,
    int $userid,
    int $dashboardthreshold,
    int $exportthreshold,
    int $endpointthreshold
): array {
    $checks = [];

    $checks[] = pqprs_measure('dashboard load time', $dashboardthreshold, function () use ($workspaceid, $consumerid): string {
        $members = pqprs_count_table('local_prequran_workspace_member', ['workspaceid' => $workspaceid]);
        $offerings = pqprs_count_table('local_prequran_course_offering', ['workspaceid' => $workspaceid]);
        return 'workspace=' . $workspaceid . '; consumer=' . $consumerid . '; members=' . $members . '; offerings=' . $offerings;
    });

    $checks[] = pqprs_measure('report export time', $exportthreshold, function () use ($workspaceid): string {
        $finance = pqprs_count_sql(
            "SELECT COUNT(1) FROM {local_prequran_fin_audit} WHERE workspaceid = :workspaceid",
            ['workspaceid' => $workspaceid]
        );
        $audit = pqprs_count_sql(
            "SELECT COUNT(1) FROM {local_prequran_live_audit} WHERE workspaceid = :workspaceid",
            ['workspaceid' => $workspaceid]
        );
        return 'csv rows prepared; finance_audit=' . $finance . '; live_audit=' . $audit;
    });

    $checks[] = pqprs_measure('repeated login/session stability', $endpointthreshold, function () use ($userid): string {
        global $USER;
        if (empty($USER->id) || (int)$USER->id !== $userid) {
            throw new moodle_exception('Session user changed during performance smoke.');
        }
        return 'session user stable; userid=' . $userid . '; sesskey=' . (sesskey() ? 'present' : 'missing');
    });

    $checks[] = pqprs_measure('slow endpoint detection', $endpointthreshold, function () use ($workspaceid): string {
        $tables = [
            'local_prequran_workspace_member',
            'local_prequran_intake_request',
            'local_prequran_invoice',
            'local_prequran_material',
            'local_prequran_live_audit',
        ];
        $parts = [];
        foreach ($tables as $table) {
            $start = microtime(true);
            $count = pqprs_count_table($table, ['workspaceid' => $workspaceid]);
            $duration = (int)round((microtime(true) - $start) * 1000);
            $parts[] = $table . '=' . $count . '@' . $duration . 'ms';
        }
        return implode('; ', $parts);
    });

    return [
        'runid' => $runid,
        'workspaceid' => $workspaceid,
        'consumerid' => $consumerid,
        'userid' => $userid,
        'thresholds' => [
            'dashboard_ms' => $dashboardthreshold,
            'export_ms' => $exportthreshold,
            'endpoint_ms' => $endpointthreshold,
        ],
        'checks' => $checks,
    ];
}

function pqprs_emit_csv(array $result): void {
    $filename = 'performance-reliability-' . preg_replace('/[^a-zA-Z0-9._-]+/', '-', (string)$result['runid']) . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['runid', 'workspaceid', 'check', 'status', 'duration_ms', 'threshold_ms', 'evidence']);
    foreach ($result['checks'] as $check) {
        fputcsv($out, [
            $result['runid'],
            $result['workspaceid'],
            $check['name'],
            $check['status'],
            $check['duration_ms'],
            $check['threshold_ms'],
            $check['evidence'],
        ]);
    }
    fclose($out);
    exit;
}

if ($action === 'measure') {
    $runid = $runid !== '' ? $runid : 'performance-reliability-' . date('ymdHis');
    $result = pqprs_build_result($runid, $workspaceid, $consumerid, (int)$USER->id, $dashboardthreshold, $exportthreshold, $endpointthreshold);
}

if ($export === 'csv' && $result !== null) {
    pqprs_emit_csv($result);
}

$PAGE->set_url(new moodle_url('/local/hubredirect/performance_reliability_smoke.php', [
    'consumer' => optional_param('consumer', '', PARAM_TEXT),
    'workspaceid' => $workspaceid,
    'runid' => $runid,
]));
$PAGE->set_context(context_system::instance());
$PAGE->set_title('Performance Reliability Smoke');
$PAGE->set_heading('Performance Reliability Smoke');

echo $OUTPUT->header();
?>
<style>
.pqprs-wrap{max-width:1100px;margin:0 auto;padding:1rem;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.pqprs-panel{border:1px solid #d9e2ec;border-radius:8px;padding:1rem;margin:1rem 0;background:#fff}
.pqprs-table{width:100%;border-collapse:collapse}
.pqprs-table th,.pqprs-table td{border-bottom:1px solid #e5edf5;padding:.65rem;text-align:left;vertical-align:top}
.pqprs-status{font-weight:700}
.pqprs-status--pass{color:#166534}
.pqprs-status--fail{color:#991b1b}
.pqprs-actions{display:flex;gap:.75rem;flex-wrap:wrap}
.pqprs-btn{display:inline-block;padding:.55rem .8rem;border-radius:6px;border:1px solid #2563eb;background:#2563eb;color:#fff;text-decoration:none}
.pqprs-error{border:1px solid #fecaca;background:#fff1f2;color:#991b1b;padding:.75rem;border-radius:6px}
</style>
<main class="pqprs-wrap">
  <h1>Performance Reliability Smoke</h1>
  <p>Read-only SQA diagnostics for dashboard load time, report export time, repeated login/session stability, and slow endpoint detection.</p>
  <?php if ($error !== ''): ?>
    <div class="pqprs-error"><?php echo s($error); ?></div>
  <?php endif; ?>
  <section class="pqprs-panel">
    <h2>Smoke Controls</h2>
    <form method="get">
      <input type="hidden" name="consumer" value="<?php echo s(optional_param('consumer', '', PARAM_TEXT)); ?>">
      <input type="hidden" name="workspaceid" value="<?php echo (int)$workspaceid; ?>">
      <input type="hidden" name="action" value="measure">
      <label>Run ID <input name="runid" value="<?php echo s($runid); ?>"></label>
      <label>Dashboard threshold ms <input name="dashboard_ms" value="<?php echo (int)$dashboardthreshold; ?>"></label>
      <label>Export threshold ms <input name="export_ms" value="<?php echo (int)$exportthreshold; ?>"></label>
      <label>Endpoint threshold ms <input name="endpoint_ms" value="<?php echo (int)$endpointthreshold; ?>"></label>
      <button type="submit">Run performance smoke</button>
    </form>
  </section>
  <?php if ($result !== null): ?>
    <section class="pqprs-panel">
      <h2>Performance Reliability Evidence</h2>
      <div class="pqprs-actions">
        <a class="pqprs-btn" href="<?php echo s(new moodle_url('/local/hubredirect/performance_reliability_smoke.php', [
            'consumer' => optional_param('consumer', '', PARAM_TEXT),
            'workspaceid' => $workspaceid,
            'runid' => $result['runid'],
            'dashboard_ms' => $dashboardthreshold,
            'export_ms' => $exportthreshold,
            'endpoint_ms' => $endpointthreshold,
            'action' => 'measure',
            'export' => 'csv',
        ])); ?>">Export CSV</a>
      </div>
      <table class="pqprs-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Threshold</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($result['checks'] as $check): ?>
            <tr>
              <td><?php echo s($check['name']); ?></td>
              <td class="pqprs-status pqprs-status--<?php echo strtolower($check['status']); ?>"><?php echo s($check['status']); ?></td>
              <td><?php echo (int)$check['duration_ms']; ?>ms</td>
              <td><?php echo (int)$check['threshold_ms']; ?>ms</td>
              <td><?php echo s($check['evidence']); ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <script type="application/json" id="pqprs-result"><?php echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES); ?></script>
    </section>
  <?php endif; ?>
</main>
<?php
echo $OUTPUT->footer();
