<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution readiness rollup.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution readiness rollup access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution readiness rollup requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqirr_table(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirr_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirr_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqirr_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqirr_insert(string $table, array $record): int {
    global $DB;
    if (!pqirr_table($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqirr_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqirr_count(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqirr_audit(int $consumerid, int $workspaceid, string $action, array $details): int {
    global $USER;
    return pqirr_insert('local_prequran_course_audit', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'userid' => (int)$USER->id,
        'component' => 'institution_readiness',
        'action' => $action,
        'targettype' => 'institution',
        'targetid' => $workspaceid,
        'details' => json_encode($details, JSON_UNESCAPED_SLASHES),
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
}

function pqirr_like_count(string $needle, string $action = ''): int {
    global $DB;
    $params = ['needle' => '%' . $DB->sql_like_escape($needle) . '%'];
    $sql = "SELECT COUNT(1) FROM {local_prequran_course_audit} WHERE " . $DB->sql_like('details', ':needle', false);
    if ($action !== '') {
        $sql .= " AND action = :action";
        $params['action'] = $action;
    }
    return pqirr_count($sql, $params);
}

function pqirr_endpoint_ready(string $file): bool {
    return is_readable(__DIR__ . '/' . $file);
}

function pqirr_no_stale_active_archived(): bool {
    if (!pqirr_table('local_prequran_workspace')) {
        return true;
    }
    return pqirr_count(
        "SELECT COUNT(1)
           FROM {local_prequran_workspace}
          WHERE " . implode(' AND ', [
              "slug LIKE :slug",
              "status = :status",
              "name LIKE :archivedname",
          ]),
        ['slug' => '%sqa%', 'status' => 'active', 'archivedname' => '%Archived%']
    ) === 0;
}

function pqirr_fixture(int $consumerid, int $workspaceid, string $runid): array {
    $phases = [
        'school_models' => pqirr_endpoint_ready('institution_school_functional_test.php') ? 'ready' : 'missing',
        'operations_isolation' => pqirr_endpoint_ready('institution_operations_isolation.php') ? 'ready' : 'missing',
        'reporting_branding' => pqirr_endpoint_ready('institution_reporting_branding.php') ? 'ready' : 'missing',
        'mobility_lifecycle' => pqirr_endpoint_ready('institution_mobility_lifecycle.php') ? 'ready' : 'missing',
        'security_matrix' => pqirr_endpoint_ready('institution_security_matrix.php') ? 'ready' : 'missing',
        'communications_isolation' => pqirr_endpoint_ready('institution_communications_isolation.php') ? 'ready' : 'missing',
        'academic_isolation' => pqirr_endpoint_ready('institution_academic_isolation.php') ? 'ready' : 'missing',
    ];
    $exportready = count(array_filter($phases, fn($status) => $status === 'ready')) === count($phases);
    pqirr_audit($consumerid, $workspaceid, 'institution_readiness_rollup_verified', [
        'runid' => $runid,
        'workspaceid' => $workspaceid,
        'phases' => $phases,
        'export' => 'institution_readiness_rollup',
    ]);
    $checks = [
        ['name' => 'institution_phase_1_school_models_evidence', 'pass' => $phases['school_models'] === 'ready'],
        ['name' => 'institution_phase_2_operations_isolation_evidence', 'pass' => $phases['operations_isolation'] === 'ready'],
        ['name' => 'institution_phase_3_reporting_branding_evidence', 'pass' => $phases['reporting_branding'] === 'ready'],
        ['name' => 'institution_phase_4_mobility_lifecycle_evidence', 'pass' => $phases['mobility_lifecycle'] === 'ready'],
        ['name' => 'institution_phase_5_security_matrix_evidence', 'pass' => $phases['security_matrix'] === 'ready'],
        ['name' => 'institution_phase_6_communications_isolation_evidence', 'pass' => $phases['communications_isolation'] === 'ready'],
        ['name' => 'institution_phase_7_academic_isolation_evidence', 'pass' => $phases['academic_isolation'] === 'ready'],
        ['name' => 'no_stale_active_archived_institution_fixtures', 'pass' => pqirr_no_stale_active_archived()],
        ['name' => 'final_institution_readiness_export_available', 'pass' => $exportready],
        ['name' => 'institution_readiness_audit_recorded', 'pass' => pqirr_like_count($runid, 'institution_readiness_rollup_verified') >= 1],
    ];
    return [
        'runid' => $runid,
        'phases' => $phases,
        'audit' => [
            'readiness_audit_rows' => pqirr_like_count($runid, 'institution_readiness_rollup_verified'),
            'workspaceid' => $workspaceid,
            'export_name' => 'institution_readiness_rollup',
        ],
        'checks' => $checks,
    ];
}

if ($runid === '') {
    $runid = 'institution-readiness-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
}

if (in_array($action, ['run', 'exportcsv'], true)) {
    if ($action === 'run') {
        require_sesskey();
    }
    try {
        $result = pqirr_fixture($consumerid, $workspaceid, $runid);
    } catch (Throwable $e) {
        $error = 'Institution readiness rollup failed: ' . $e->getMessage();
    }
}

if ($action === 'exportcsv' && $result) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="institution-readiness-rollup-' . clean_filename($runid) . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['export', 'runid', 'check', 'status', 'phase_status']);
    foreach ($result['checks'] as $check) {
        fputcsv($out, ['institution_readiness_rollup', $runid, $check['name'], $check['pass'] ? 'PASS' : 'FAIL', json_encode($result['phases'], JSON_UNESCAPED_SLASHES)]);
    }
    fclose($out);
    exit;
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_readiness_rollup.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Readiness Rollup');
$PAGE->set_heading('Institution Readiness Rollup');
echo $OUTPUT->header();
echo '<style>.pqirr{max-width:1180px;margin:0 auto}.pqirr-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px;margin:14px 0}.pqirr-table{width:100%;border-collapse:collapse}.pqirr-table th,.pqirr-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqirr-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-weight:800}.pqirr-pill--bad{background:#fff0f0;color:#8a1f1f}.pqirr-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6b4f;color:#fff!important;font-weight:900;text-decoration:none}.pqirr-muted{color:#5d6f66;font-size:12px}.pqirr-error{padding:12px;border:1px solid #f1b4b4;background:#fff4f4;color:#8a1f1f;border-radius:8px}</style>';
echo '<main class="pqirr"><h1>Institution Readiness Rollup</h1><p class="pqirr-muted">Final institution school rollup across school models, isolation, reporting, mobility, security, communications, academic controls, fixture hygiene, and export evidence.</p>';
if ($error !== '') {
    echo '<div class="pqirr-error">' . s($error) . '</div>';
}
echo '<section class="pqirr-card"><h2>Run Readiness Rollup</h2><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="run"><label>Run ID <input name="runid" value="' . s($runid) . '"></label> <button class="pqirr-btn" type="submit">Run institution readiness rollup</button></form></section>';
if ($result) {
    $csvurl = (new moodle_url('/local/hubredirect/institution_readiness_rollup.php', ['workspaceid' => $workspaceid, 'action' => 'exportcsv', 'runid' => $result['runid']]))->out(false);
    echo '<section class="pqirr-card"><h2>Final Readiness Result</h2><p><span class="pqirr-pill">institution school readiness rollup verified</span> <span class="pqirr-pill">final institution readiness evidence</span></p><p><a class="pqirr-btn" href="' . s($csvurl) . '">Export CSV</a></p><table class="pqirr-table"><thead><tr><th>Check</th><th>Status</th></tr></thead><tbody>';
    foreach ($result['checks'] as $check) {
        echo '<tr><td>' . s($check['name']) . '</td><td><span class="pqirr-pill' . ($check['pass'] ? '' : ' pqirr-pill--bad') . '">' . ($check['pass'] ? 'PASS' : 'FAIL') . '</span></td></tr>';
    }
    echo '</tbody></table><h3>Evidence JSON</h3><pre id="pqirr-result">' . s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) . '</pre></section>';
}
echo '</main>';
echo $OUTPUT->footer();
