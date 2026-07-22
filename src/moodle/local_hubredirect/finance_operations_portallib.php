<?php
// Finance-operations query library — extracted VERBATIM from
// finance_operations.php (renamed pqfinops_ -> pqfopl_) for the token-gated
// portal endpoint. The legacy page keeps its inline copies and stays untouched
// (parallel-run). All pqfin_* calls resolve to the shared finance_lib.php and
// pqh_* to accesslib.php — load both before this file.
// Requires: local/hubredirect/accesslib.php + local/hubredirect/finance_lib.php.

defined('MOODLE_INTERNAL') || die();

function pqfopl_student_label($row): string {
    $name = trim(fullname($row));
    if ($name === '') {
        $name = 'Student #' . (int)($row->studentid ?? 0);
    }
    return $name;
}

function pqfopl_rows(string $report, int $workspaceid, $consumercontext): array {
    if ($workspaceid <= 0 && is_siteadmin()) {
        $rows = [];
        foreach (pqfopl_workspace_ids() as $id) {
            $rows = array_merge($rows, pqfopl_rows($report, $id, pqh_consumer_context_by_workspace($id)));
        }
        return array_slice($rows, 0, 1000);
    }
    if ($report === 'payments') {
        return pqfin_payments_report($workspaceid, $consumercontext);
    }
    if ($report === 'balances') {
        return pqfin_balances_report($workspaceid, $consumercontext);
    }
    if ($report === 'discounts') {
        return pqfin_discounts_scholarships_report($workspaceid, $consumercontext);
    }
    if ($report === 'scholarships') {
        return pqfin_scholarships_report($workspaceid, $consumercontext);
    }
    if ($report === 'sponsorships') {
        return pqfin_sponsorships_report($workspaceid, $consumercontext);
    }
    if ($report === 'payouts') {
        return pqfin_marketplace_payouts_report($workspaceid, $consumercontext);
    }
    if ($report === 'corrections') {
        return pqfin_corrections_report($workspaceid, $consumercontext);
    }
    if ($report === 'plans') {
        return pqfin_payment_plans_report($workspaceid, $consumercontext);
    }
    if ($report === 'holds') {
        return pqfin_holds_report($workspaceid, $consumercontext);
    }
    if ($report === 'webhooks') {
        return pqfin_gateway_webhook_report($workspaceid, $consumercontext);
    }
    if ($report === 'hardening') {
        return pqfin_hardening_snapshots_report($workspaceid, $consumercontext);
    }
    if ($report === 'exceptions') {
        $exceptions = pqfin_enrollment_finance_exceptions($workspaceid, $consumercontext);
        return array_merge($exceptions['paid_not_enrolled'], $exceptions['enrolled_unpaid']);
    }
    return pqfin_invoice_aging_report($workspaceid, $consumercontext);
}

function pqfopl_workspace_ids(): array {
    global $DB;

    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_map('intval', $DB->get_fieldset_select('local_prequran_workspace', 'id', "status <> :status", ['status' => 'archived'], 'id ASC'));
}

function pqfopl_metrics(int $workspaceid, $consumercontext): array {
    if ($workspaceid > 0) {
        return pqfin_operations_dashboard_metrics($workspaceid, $consumercontext);
    }
    $totals = [
        'open_invoices' => 0,
        'overdue_invoices' => 0,
        'payments_received_cents' => 0,
        'outstanding_balance_cents' => 0,
        'paid_not_enrolled' => 0,
        'enrolled_unpaid' => 0,
        'finance_holds' => 0,
    ];
    foreach (pqfopl_workspace_ids() as $id) {
        $metrics = pqfin_operations_dashboard_metrics($id, pqh_consumer_context_by_workspace($id));
        foreach ($totals as $key => $value) {
            $totals[$key] += (int)($metrics[$key] ?? 0);
        }
    }
    return $totals;
}

function pqfopl_context_for_row($row, array $fallback): array {
    static $cache = [];
    $workspaceid = (int)($row->workspaceid ?? $fallback['workspaceid'] ?? 0);
    if ($workspaceid <= 0) {
        return $fallback;
    }
    if (!isset($cache[$workspaceid])) {
        $cache[$workspaceid] = pqfin_report_workspace_context($workspaceid, pqh_consumer_context_by_workspace($workspaceid));
    }
    return $cache[$workspaceid];
}

function pqfopl_csv(string $filename, array $headers, array $rows, callable $mapper): void {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . clean_filename($filename) . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $mapper($row));
    }
    fclose($out);
    exit;
}
