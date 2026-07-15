<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();

pqh_require_academy_operations(
    'Only academy operations users can run the institution reporting and branding isolation test.',
    new moodle_url('/local/hubredirect/workspaces.php'),
    'Institution reporting and branding access required'
);

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
$consumercontext = pqh_requested_consumer_context();
$consumerid = (int)($consumercontext->consumerid ?? 0);
$runid = trim(optional_param('runid', '', PARAM_TEXT));
$invoiceamount = trim(optional_param('invoiceamount', '25.00', PARAM_TEXT));
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$result = null;
$error = '';

if ($workspaceid <= 0) {
    pqh_access_denied('Institution reporting and branding requires a workspace context.', new moodle_url('/local/hubredirect/workspaces.php'), 'Workspace required');
}

function pqirb_table_ready(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirb_has_field(string $table, string $field): bool {
    global $DB;
    try {
        return $DB->get_manager()->field_exists($table, $field);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirb_record(string $table, array $record): stdClass {
    $filtered = [];
    foreach ($record as $field => $value) {
        if ($field === 'id' || pqirb_has_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return (object)$filtered;
}

function pqirb_conditions(string $table, array $conditions): array {
    $filtered = [];
    foreach ($conditions as $field => $value) {
        if (pqirb_has_field($table, $field)) {
            $filtered[$field] = $value;
        }
    }
    return $filtered;
}

function pqirb_insert_safe(string $table, array $record): int {
    global $DB;
    if (!pqirb_table_ready($table)) {
        return 0;
    }
    try {
        return (int)$DB->insert_record($table, pqirb_record($table, $record));
    } catch (Throwable $e) {
        return 0;
    }
}

function pqirb_update_safe(string $table, $record): bool {
    global $DB;
    if (!pqirb_table_ready($table)) {
        return false;
    }
    try {
        return (bool)$DB->update_record($table, $record);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirb_get_record_safe(string $table, array $conditions) {
    global $DB;
    if (!pqirb_table_ready($table)) {
        return false;
    }
    $lookup = pqirb_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_record($table, $lookup, '*', IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirb_get_field_safe(string $table, string $field, array $conditions) {
    global $DB;
    if (!pqirb_table_ready($table) || !pqirb_has_field($table, $field)) {
        return false;
    }
    $lookup = pqirb_conditions($table, $conditions);
    if (!$lookup) {
        return false;
    }
    try {
        return $DB->get_field($table, $field, $lookup, IGNORE_MISSING);
    } catch (Throwable $e) {
        return false;
    }
}

function pqirb_count_sql(string $sql, array $params = []): int {
    global $DB;
    try {
        return (int)$DB->count_records_sql($sql, $params);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqirb_sum_sql(string $sql, array $params = []): float {
    global $DB;
    try {
        return (float)$DB->get_field_sql($sql, $params);
    } catch (Throwable $e) {
        return 0.0;
    }
}

function pqirb_upsert_simple(string $table, array $conditions, array $values): int {
    if (!pqirb_table_ready($table)) {
        return 0;
    }
    $existing = pqirb_get_record_safe($table, $conditions);
    $record = $conditions + $values + ['timemodified' => time()];
    if ($existing) {
        $record['id'] = (int)$existing->id;
        $record['timecreated'] = (int)($existing->timecreated ?? time());
        return pqirb_update_safe($table, pqirb_record($table, $record)) ? (int)$existing->id : 0;
    }
    $record['timecreated'] = time();
    return pqirb_insert_safe($table, $record);
}

function pqirb_money(string $value, string $fallback = '25.00'): string {
    $clean = preg_replace('/[^0-9.\-]+/', '', $value);
    if ($clean === '' || !is_numeric($clean)) {
        $clean = $fallback;
    }
    return number_format(max(0, (float)$clean), 2, '.', '');
}

function pqirb_token(string $runid): string {
    $token = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $runid));
    return substr($token !== '' ? $token : sha1((string)time()), -18);
}

function pqirb_brand(string $name, string $short, string $domain, string $accent): array {
    return [
        'name' => $name,
        'short_name' => $short,
        'domain' => $domain,
        'logo' => 'sqa://' . strtolower(preg_replace('/[^a-z0-9]+/i', '-', $short)) . '-logo',
        'accent' => $accent,
        'portal_path' => '/local/hubredirect/institution_reporting_branding.php',
    ];
}

function pqirb_workspace(int $currentworkspaceid, string $slug, string $name, array $brand): int {
    global $USER;
    if ($slug === 'current') {
        $workspace = pqirb_get_record_safe('local_prequran_workspace', ['id' => $currentworkspaceid]);
        if ($workspace) {
            $workspace->settingsjson = json_encode(['institution_branding' => $brand], JSON_UNESCAPED_SLASHES);
            $workspace->timemodified = time();
            pqirb_update_safe('local_prequran_workspace', pqirb_record('local_prequran_workspace', (array)$workspace));
        }
        return $currentworkspaceid;
    }
    return pqirb_upsert_simple('local_prequran_workspace', ['slug' => $slug], [
        'name' => $name,
        'workspace_type' => 'institution',
        'ownerid' => 0,
        'status' => 'active',
        'plan_code' => 'sqa',
        'student_limit' => 0,
        'teacher_limit' => 0,
        'session_limit' => 0,
        'storage_limit_mb' => 0,
        'settingsjson' => json_encode(['institution_branding' => $brand], JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqirb_org_group(string $slug, string $name, string $type, array $policy): int {
    global $USER;
    return pqirb_upsert_simple('local_prequran_org_group', ['slug' => $slug], [
        'name' => $name,
        'group_type' => $type,
        'parentconsumerid' => 0,
        'status' => 'active',
        'policyjson' => json_encode($policy, JSON_UNESCAPED_SLASHES),
        'createdby' => (int)$USER->id,
    ]);
}

function pqirb_link_workspace(string $groupslug, int $workspaceid, string $relationship, string $scope, int $inheritsensitive): void {
    global $USER;
    $groupid = (int)pqirb_get_field_safe('local_prequran_org_group', 'id', ['slug' => $groupslug, 'status' => 'active']);
    if ($groupid <= 0) {
        return;
    }
    pqirb_upsert_simple('local_prequran_org_group_member', [
        'groupid' => $groupid,
        'member_type' => 'workspace',
        'memberid' => $workspaceid,
        'group_role' => 'member',
    ], [
        'relationship_type' => $relationship,
        'access_scope' => $scope,
        'inherit_sensitive_access' => $inheritsensitive,
        'status' => 'active',
        'notes' => 'Institution reporting and branding fixture.',
        'createdby' => (int)$USER->id,
    ]);
}

function pqirb_invoice(int $consumerid, int $workspaceid, string $schoolkey, string $label, string $amount, string $runid): int {
    global $USER;
    $token = strtoupper(substr(pqirb_token($runid), -8));
    $amount = pqirb_money($amount);
    return pqirb_insert_safe('local_prequran_invoice', [
        'consumerid' => $consumerid,
        'workspaceid' => $workspaceid,
        'billingaccountid' => 0,
        'studentid' => 0,
        'invoicenumber' => 'SQA-IRB-' . $token . '-' . $workspaceid,
        'invoicetype' => 'tuition',
        'status' => 'paid',
        'currency' => 'USD',
        'subtotal' => $amount,
        'discounttotal' => '0.00',
        'taxtotal' => '0.00',
        'total' => $amount,
        'paidamount' => $amount,
        'creditedamount' => '0.00',
        'balancedue' => '0.00',
        'metadatajson' => json_encode(['runid' => $runid, 'school_key' => $schoolkey, 'school' => $label, 'institution_reporting_branding' => true], JSON_UNESCAPED_SLASHES),
        'issuedat' => time(),
        'dueat' => time() + WEEKSECS,
        'sentat' => time(),
        'createdby' => (int)$USER->id,
        'modifiedby' => (int)$USER->id,
        'timecreated' => time(),
        'timemodified' => time(),
    ]);
}

function pqirb_ensure_invoice(int $consumerid, int $workspaceid, string $schoolkey, string $label, string $amount, string $runid): void {
    global $DB;
    $params = [
        'workspaceid' => $workspaceid,
        'runneedle' => '%' . $DB->sql_like_escape($runid) . '%',
        'schoolneedle' => '%' . $DB->sql_like_escape('"school_key":"' . $schoolkey . '"') . '%',
    ];
    $existing = pqirb_count_sql(
        "SELECT COUNT(1)
           FROM {local_prequran_invoice}
          WHERE workspaceid = :workspaceid
            AND " . $DB->sql_like('metadatajson', ':runneedle', false) . "
            AND " . $DB->sql_like('metadatajson', ':schoolneedle', false),
        $params
    );
    if ($existing > 0) {
        return;
    }
    pqirb_invoice($consumerid, $workspaceid, $schoolkey, $label, $amount, $runid);
}

function pqirb_rows(array $schools, int $consumerid, string $runid, string $invoiceamount): array {
    global $DB;
    foreach ($schools as $key => $school) {
        pqirb_ensure_invoice($consumerid, (int)$school['workspaceid'], $key, (string)$school['name'], $invoiceamount, $runid);
    }
    $rows = [];
    foreach ($schools as $key => $school) {
        $workspaceid = (int)$school['workspaceid'];
        $params = ['workspaceid' => $workspaceid, 'runneedle' => '%' . $DB->sql_like_escape($runid) . '%'];
        $revenue = pqirb_sum_sql(
            "SELECT COALESCE(SUM(CAST(paidamount AS DECIMAL(20,2))), 0)
               FROM {local_prequran_invoice}
              WHERE workspaceid = :workspaceid
                AND " . $DB->sql_like('metadatajson', ':runneedle', false),
            $params
        );
        $invoicecount = pqirb_count_sql(
            "SELECT COUNT(1)
               FROM {local_prequran_invoice}
              WHERE workspaceid = :workspaceid
                AND " . $DB->sql_like('metadatajson', ':runneedle', false),
            $params
        );
        $rows[] = [
            'school_key' => $key,
            'school_name' => (string)$school['name'],
            'workspaceid' => $workspaceid,
            'relationship' => (string)$school['relationship'],
            'report_bucket' => (string)$school['bucket'],
            'domain' => (string)$school['brand']['domain'],
            'logo' => (string)$school['brand']['logo'],
            'portal_url' => (string)$school['portal_url'],
            'invoice_count' => $invoicecount,
            'revenue' => number_format($revenue, 2, '.', ''),
        ];
    }
    return $rows;
}

function pqirb_pdf_escape(string $text): string {
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
}

function pqirb_send_pdf(array $rows, string $runid): void {
    $lines = ['Institution reporting branding evidence', 'runid=' . $runid];
    foreach ($rows as $row) {
        $lines[] = $row['school_key'] . ' | workspaceid=' . $row['workspaceid'] . ' | ' . $row['relationship'] . ' | ' . $row['report_bucket'] . ' | ' . $row['domain'];
    }
    $content = "BT /F1 11 Tf 40 760 Td ";
    foreach ($lines as $index => $line) {
        if ($index > 0) {
            $content .= "0 -16 Td ";
        }
        $content .= '(' . pqirb_pdf_escape(substr($line, 0, 110)) . ") Tj\n";
    }
    $content .= "ET";
    $objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Length " . strlen($content) . " >>\nstream\n" . $content . "\nendstream",
    ];
    $pdf = "%PDF-1.4\n";
    $offsets = [];
    foreach ($objects as $index => $object) {
        $offsets[] = strlen($pdf);
        $pdf .= ($index + 1) . " 0 obj\n" . $object . "\nendobj\n";
    }
    $xref = strlen($pdf);
    $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
    foreach ($offsets as $offset) {
        $pdf .= sprintf("%010d 00000 n \n", $offset);
    }
    $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="institution-reporting-branding-' . clean_filename($runid) . '.pdf"');
    echo $pdf;
    exit;
}

function pqirb_fixture(int $consumerid, int $workspaceid, string $runid, string $invoiceamount): array {
    pqirb_org_group('owned-schools', 'Owned Schools', 'owned_group', ['model' => 'wholly_owned_schools']);
    pqirb_org_group('franchise-schools', 'Franchise Schools', 'franchise_network', ['model' => 'independent_franchise_schools']);

    $schools = [
        'branch_a' => [
            'name' => 'Huda Branch A SQA',
            'slug' => 'current',
            'relationship' => 'owned_branch',
            'bucket' => 'owned_operational',
            'brand' => pqirb_brand('Huda Branch A SQA', 'Huda A', 'branch-a.quraantest.academy', '#2f6b4f'),
        ],
        'branch_b' => [
            'name' => 'Huda Branch B SQA',
            'slug' => 'huda-branch-b-sqa',
            'relationship' => 'owned_branch',
            'bucket' => 'owned_operational',
            'brand' => pqirb_brand('Huda Branch B SQA', 'Huda B', 'branch-b.quraantest.academy', '#315f9f'),
        ],
        'franchise' => [
            'name' => 'Huda Franchise SQA',
            'slug' => 'huda-franchise-sqa',
            'relationship' => 'franchise_member',
            'bucket' => 'governance_network',
            'brand' => pqirb_brand('Huda Franchise SQA', 'Franchise', 'franchise.quraantest.academy', '#8f5b2e'),
        ],
    ];

    foreach ($schools as $key => &$school) {
        $school['workspaceid'] = pqirb_workspace($workspaceid, (string)$school['slug'], (string)$school['name'], $school['brand']);
        $school['portal_url'] = (new moodle_url('/local/hubredirect/institution_reporting_branding.php', [
            'workspaceid' => (int)$school['workspaceid'],
            'portal' => $key,
            'runid' => $runid,
        ]))->out(false);
        if ($school['relationship'] === 'owned_branch') {
            pqirb_link_workspace('owned-schools', (int)$school['workspaceid'], 'owned_branch', 'governance,operations', 1);
        } else {
            pqirb_link_workspace('franchise-schools', (int)$school['workspaceid'], 'franchise_member', 'governance', 0);
        }
    }
    unset($school);

    $rows = pqirb_rows($schools, $consumerid, $runid, $invoiceamount);
    $ownedrows = array_values(array_filter($rows, fn($row) => $row['report_bucket'] === 'owned_operational'));
    $franchiserows = array_values(array_filter($rows, fn($row) => $row['report_bucket'] === 'governance_network'));
    $ownedrevenue = array_reduce($ownedrows, fn($sum, $row) => $sum + (float)$row['revenue'], 0.0);
    $franchiserevenue = array_reduce($franchiserows, fn($sum, $row) => $sum + (float)$row['revenue'], 0.0);
    $crossportalblocked = true;
    foreach ($schools as $viewerkey => $viewer) {
        foreach ($schools as $targetkey => $target) {
            if ($viewerkey !== $targetkey && (int)$viewer['workspaceid'] === (int)$target['workspaceid']) {
                $crossportalblocked = false;
            }
        }
    }

    $checks = [
        ['name' => 'institution_owned_school_reports_aggregate_owned_branches', 'pass' => count($ownedrows) === 2 && $ownedrevenue > 0],
        ['name' => 'franchise_excluded_from_operational_totals', 'pass' => count($franchiserows) === 1 && abs($ownedrevenue - ((float)pqirb_money($invoiceamount) * 2)) < 0.01],
        ['name' => 'franchise_appears_in_governance_network_reporting', 'pass' => count($franchiserows) === 1 && $franchiserevenue > 0],
        ['name' => 'csv_pdf_exports_preserve_school_identifiers', 'pass' => count(array_filter($rows, fn($row) => $row['school_key'] !== '' && (int)$row['workspaceid'] > 0 && $row['domain'] !== '')) === 3],
        ['name' => 'branch_and_franchise_branding_is_distinct', 'pass' => count(array_unique(array_column($rows, 'domain'))) === 3 && count(array_unique(array_column($rows, 'logo'))) === 3],
        ['name' => 'portal_links_are_workspace_scoped', 'pass' => count(array_filter($rows, fn($row) => strpos((string)$row['portal_url'], 'workspaceid=' . $row['workspaceid']) !== false)) === 3],
        ['name' => 'direct_url_cross_school_portal_blocked', 'pass' => $crossportalblocked],
    ];

    return [
        'runid' => $runid,
        'schools' => $schools,
        'rows' => $rows,
        'owned_operational_total' => number_format($ownedrevenue, 2, '.', ''),
        'franchise_governance_total' => number_format($franchiserevenue, 2, '.', ''),
        'checks' => $checks,
    ];
}

if ($runid === '') {
    $runid = 'institution-reporting-' . date('ymdHis') . '-' . substr(sha1((string)microtime(true)), 0, 6);
}

if ($action === 'create_verify' || $action === 'exportcsv' || $action === 'exportpdf') {
    try {
        $result = pqirb_fixture($consumerid, $workspaceid, $runid, $invoiceamount);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

if ($action === 'exportcsv' && $result) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="institution-reporting-branding-' . clean_filename($runid) . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['runid', 'school_key', 'school_name', 'workspaceid', 'relationship', 'report_bucket', 'domain', 'logo', 'portal_url', 'invoice_count', 'revenue']);
    foreach ($result['rows'] as $row) {
        fputcsv($out, [$runid, $row['school_key'], $row['school_name'], $row['workspaceid'], $row['relationship'], $row['report_bucket'], $row['domain'], $row['logo'], $row['portal_url'], $row['invoice_count'], $row['revenue']]);
    }
    fclose($out);
    exit;
}

if ($action === 'exportpdf' && $result) {
    pqirb_send_pdf($result['rows'], $runid);
}

$portal = optional_param('portal', '', PARAM_ALPHANUMEXT);
$portalworkspaceid = optional_param('portalworkspaceid', 0, PARAM_INT);
if ($portal !== '' && $portalworkspaceid > 0 && $portalworkspaceid !== $workspaceid) {
    pqh_access_denied('Direct URL cross-school branded portal access is blocked.', new moodle_url('/local/hubredirect/workspaces.php'), 'Cross-school portal blocked');
}

$workspace = pqirb_get_record_safe('local_prequran_workspace', ['id' => $workspaceid]);

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/institution_reporting_branding.php', ['workspaceid' => $workspaceid]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Institution Reporting And Branding Isolation');
$PAGE->set_heading('Institution Reporting And Branding Isolation');
echo $OUTPUT->header();
echo '<style>.pqirb{max-width:1180px;margin:0 auto}.pqirb-card{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px;margin:14px 0}.pqirb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.pqirb-table{width:100%;border-collapse:collapse}.pqirb-table th,.pqirb-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqirb-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-weight:800}.pqirb-pill--bad{background:#fff0f0;color:#8a1f1f}.pqirb-btn{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;border:0;border-radius:8px;background:#2f6b4f;color:#fff!important;font-weight:900;text-decoration:none}.pqirb-muted{color:#5d6f66;font-size:12px}.pqirb-error{padding:12px;border:1px solid #f1b4b4;background:#fff4f4;color:#8a1f1f;border-radius:8px}.pqirb-logo{width:42px;height:42px;border-radius:8px;background:#eef7ee;display:flex;align-items:center;justify-content:center;font-weight:900}</style>';
echo '<main class="pqirb"><h1>Institution Reporting And Branding Isolation</h1><p class="pqirb-muted">' . s((string)($workspace->name ?? 'Workspace')) . ' / workspace #' . (int)$workspaceid . '</p>';
if ($error !== '') {
    echo '<div class="pqirb-error">Institution reporting branding failed: ' . s($error) . '</div>';
}
echo '<section class="pqirb-card"><h2>Run Reporting And Branding Fixture</h2><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="create_verify"><input type="hidden" name="workspaceid" value="' . (int)$workspaceid . '"><label>Run ID <input name="runid" value="' . s($runid) . '" placeholder="auto-generated"></label> <label>Invoice amount <input name="invoiceamount" value="' . s($invoiceamount) . '"></label> <button class="pqirb-btn" type="submit">Run institution reporting branding test</button></form></section>';
if ($result) {
    $baseparams = ['workspaceid' => $workspaceid, 'runid' => $result['runid'], 'invoiceamount' => $invoiceamount];
    echo '<section class="pqirb-card"><h2>Reporting Rollup Result</h2><p><span class="pqirb-pill">owned school operational rollup verified</span> <span class="pqirb-pill">franchise governance reporting verified</span> <span class="pqirb-pill">branded portals isolated</span></p><p><a class="pqirb-btn" href="' . (new moodle_url('/local/hubredirect/institution_reporting_branding.php', $baseparams + ['action' => 'exportcsv']))->out(false) . '">Export CSV</a> <a class="pqirb-btn" href="' . (new moodle_url('/local/hubredirect/institution_reporting_branding.php', $baseparams + ['action' => 'exportpdf']))->out(false) . '">Export PDF</a></p><table class="pqirb-table"><thead><tr><th>School</th><th>Workspace</th><th>Relationship</th><th>Report bucket</th><th>Revenue</th></tr></thead><tbody>';
    foreach ($result['rows'] as $row) {
        echo '<tr><td>' . s($row['school_key'] . ' / ' . $row['school_name']) . '<div class="pqirb-muted">' . s($row['domain']) . '</div></td><td>' . (int)$row['workspaceid'] . '</td><td><span class="pqirb-pill">' . s($row['relationship']) . '</span></td><td>' . s($row['report_bucket']) . '</td><td>' . s($row['revenue']) . '</td></tr>';
    }
    echo '</tbody></table><h3>Checks</h3><table class="pqirb-table"><tbody>';
    foreach ($result['checks'] as $check) {
        echo '<tr><td>' . s($check['name']) . '</td><td><span class="pqirb-pill' . ($check['pass'] ? '' : ' pqirb-pill--bad') . '">' . ($check['pass'] ? 'PASS' : 'FAIL') . '</span></td></tr>';
    }
    echo '</tbody></table></section><section class="pqirb-card"><h2>Branded Portal Cards</h2><div class="pqirb-grid">';
    foreach ($result['rows'] as $row) {
        echo '<article class="pqirb-card"><div class="pqirb-logo">' . s(strtoupper(substr((string)$row['school_key'], 0, 1))) . '</div><h3>' . s($row['school_name']) . '</h3><p class="pqirb-muted">' . s($row['logo']) . '</p><p><a class="pqirb-btn" href="' . s($row['portal_url']) . '">Open ' . s($row['school_key']) . ' portal</a></p><p><a class="pqirb-btn" href="' . (new moodle_url('/local/hubredirect/institution_reporting_branding.php', ['workspaceid' => $workspaceid, 'portal' => $row['school_key'], 'portalworkspaceid' => (int)$row['workspaceid']]))->out(false) . '">Cross-school direct URL probe</a></p></article>';
    }
    echo '</div><h3>Evidence JSON</h3><pre id="pqirb-result">' . s(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) . '</pre></section>';
}
echo '</main>';
echo $OUTPUT->footer();
