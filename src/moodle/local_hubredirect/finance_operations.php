<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/finance_lib.php');

$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $workspaceid);
$report = optional_param('report', 'aging', PARAM_ALPHANUMEXT);
$export = optional_param('export', '', PARAM_ALPHANUMEXT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

if ($workspaceid <= 0 && !is_siteadmin((int)$USER->id)) {
    pqh_access_denied('Only workspace finance admins can view finance operations.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Finance operations access required');
}
if ($workspaceid > 0 && !pqfin_user_can_manage_workspace_finance((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Only workspace finance admins can view finance operations.', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams), 'Finance operations access required');
}

$reports = [
    'aging' => 'Invoice aging',
    'payments' => 'Payments',
    'balances' => 'Balances',
    'discounts' => 'Discounts',
    'scholarships' => 'Scholarships',
    'sponsorships' => 'Sponsorships',
    'payouts' => 'Marketplace payouts',
    'corrections' => 'Corrections',
    'plans' => 'Payment plans',
    'holds' => 'Finance holds',
    'webhooks' => 'Webhooks',
    'hardening' => 'Hardening',
    'exceptions' => 'Exceptions',
];
if (!isset($reports[$report])) {
    $report = 'aging';
}

function pqfinops_student_label($row): string {
    $name = trim(fullname($row));
    if ($name === '') {
        $name = 'Student #' . (int)($row->studentid ?? 0);
    }
    return $name;
}

function pqfinops_rows(string $report, int $workspaceid, $consumercontext): array {
    if ($workspaceid <= 0 && is_siteadmin()) {
        $rows = [];
        foreach (pqfinops_workspace_ids() as $id) {
            $rows = array_merge($rows, pqfinops_rows($report, $id, pqh_consumer_context_by_workspace($id)));
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

function pqfinops_workspace_ids(): array {
    global $DB;

    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_map('intval', $DB->get_fieldset_select('local_prequran_workspace', 'id', "status <> :status", ['status' => 'archived'], 'id ASC'));
}

function pqfinops_metrics(int $workspaceid, $consumercontext): array {
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
    foreach (pqfinops_workspace_ids() as $id) {
        $metrics = pqfin_operations_dashboard_metrics($id, pqh_consumer_context_by_workspace($id));
        foreach ($totals as $key => $value) {
            $totals[$key] += (int)($metrics[$key] ?? 0);
        }
    }
    return $totals;
}

function pqfinops_context_for_row($row, array $fallback): array {
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

function pqfinops_csv(string $filename, array $headers, array $rows, callable $mapper): void {
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

$contextlabels = $workspaceid > 0
    ? pqfin_report_workspace_context($workspaceid, $consumercontext)
    : ['workspaceid' => 0, 'workspace' => 'All workspaces', 'consumerid' => 0, 'consumer' => 'Platform finance', 'domain' => ''];
$metrics = pqfinops_metrics($workspaceid, $consumercontext);
$rows = pqfinops_rows($report, $workspaceid, $consumercontext);

if ($export === 'csv') {
    $prefix = 'finance-' . $report . '-' . $workspaceid . '-' . date('Ymd-His') . '.csv';
    if ($report === 'payments') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'payment_id', 'receipt', 'student_id', 'student', 'account', 'method', 'provider', 'reference', 'status', 'currency', 'amount', 'received_at'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->receiptnumber, (int)$row->studentid, pqfinops_student_label($row), (string)$row->accountname, (string)$row->paymentmethod, (string)$row->provider, (string)$row->reference, (string)$row->status, (string)$row->currency, (string)$row->amount, (int)$row->receivedat];
        });
    } else if ($report === 'balances') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'student_id', 'student', 'billing_account_id', 'account', 'invoice_count', 'total', 'paid', 'balance'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->studentid, pqfinops_student_label($row), (int)$row->billingaccountid, (string)$row->accountname, (int)$row->invoicecount, (string)$row->totalamount, (string)$row->paidamount, (string)$row->balancedue];
        });
    } else if ($report === 'discounts') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'invoice_id', 'invoice_number', 'line_id', 'student_id', 'student', 'description', 'discount', 'line_total', 'status'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->invoiceid, (string)$row->invoicenumber, (int)$row->id, (int)$row->studentid, pqfinops_student_label($row), (string)$row->description, (string)$row->discountamount, (string)$row->linetotal, (string)$row->invoicestatus];
        });
    } else if ($report === 'scholarships') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'award_id', 'award_number', 'invoice_id', 'invoice_number', 'credit_note_id', 'credit_number', 'student_id', 'student', 'status', 'type', 'funding_source', 'currency', 'amount', 'approved_at', 'reason'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->awardnumber, (int)$row->invoiceid, (string)$row->invoicenumber, (int)$row->creditnoteid, (string)$row->creditnumber, (int)$row->studentid, pqfinops_student_label($row), (string)$row->status, (string)$row->awardtype, (string)$row->fundingsource, (string)$row->currency, (string)$row->amount, (int)$row->approvedat, (string)$row->reason];
        });
    } else if ($report === 'sponsorships') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'commitment_id', 'commitment_number', 'invoice_id', 'invoice_number', 'student_id', 'student', 'sponsor_account_id', 'sponsor', 'status', 'currency', 'committed', 'received', 'balance', 'committed_at', 'expected_at', 'terms'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->commitmentnumber, (int)$row->invoiceid, (string)$row->invoicenumber, (int)$row->studentid, pqfinops_student_label($row), (int)$row->sponsoraccountid, (string)$row->sponsorname, (string)$row->status, (string)$row->currency, (string)$row->committedamount, (string)$row->receivedamount, (string)$row->balanceamount, (int)$row->committedat, (int)$row->expectedat, (string)$row->termsnote];
        });
    } else if ($report === 'payouts') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'payout_id', 'payout_number', 'invoice_id', 'invoice_number', 'request_id', 'teacher_id', 'teacher', 'student_id', 'student', 'status', 'currency', 'gross', 'platform_fee', 'payout', 'ready_at', 'notes'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            $teacher = trim((string)($row->teacherfirstname ?? '') . ' ' . (string)($row->teacherlastname ?? ''));
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->payoutnumber, (int)$row->invoiceid, (string)$row->invoicenumber, (int)$row->requestid, (int)$row->teacherid, $teacher, (int)$row->studentid, pqfinops_student_label($row), (string)$row->status, (string)$row->currency, (string)$row->grossamount, (string)$row->platformfee, (string)$row->payoutamount, (int)$row->readyat, (string)$row->notes];
        });
    } else if ($report === 'corrections') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'type', 'document_id', 'document_number', 'student_id', 'invoice_id', 'payment_id', 'subtype', 'status', 'currency', 'amount', 'event_time', 'reason'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (string)$row->reporttype, (int)$row->id, (string)$row->documentnumber, (int)$row->studentid, (int)$row->invoiceid, (int)$row->paymentid, (string)$row->subtype, (string)$row->status, (string)$row->currency, (string)$row->amount, (int)$row->eventtime, (string)$row->reason];
        });
    } else if ($report === 'plans') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'plan_id', 'plan_number', 'invoice_id', 'invoice_number', 'student_id', 'student', 'account', 'status', 'currency', 'principal', 'scheduled', 'paid', 'past_due', 'installments', 'first_due', 'next_due', 'last_due'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->plannumber, (int)$row->invoiceid, (string)$row->invoicenumber, (int)$row->studentid, pqfinops_student_label($row), (string)$row->accountname, (string)$row->status, (string)$row->currency, (string)$row->principalamount, (string)$row->scheduledamount, (string)$row->paidamount, (string)$row->pastdueamount, (int)$row->installmentcount, (int)$row->firstdueat, (int)$row->nextdueat, (int)$row->lastdueat];
        });
    } else if ($report === 'holds') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'hold_id', 'student_id', 'student', 'invoice_id', 'status', 'hold_type', 'source', 'severity', 'amount', 'currency', 'detected_at', 'resolved_at', 'reason'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (int)$row->studentid, pqfinops_student_label($row), (int)$row->invoiceid, (string)$row->status, (string)$row->holdtype, (string)$row->source, (string)$row->severity, (string)$row->amount, (string)$row->currency, (int)$row->detectedat, (int)$row->resolvedat, (string)$row->reason];
        });
    } else if ($report === 'webhooks') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'webhook_id', 'provider', 'event_id', 'idempotency_key', 'event_type', 'mapped_status', 'signature_status', 'processing_status', 'invoice_id', 'payment_id', 'session_id', 'transaction_id', 'amount', 'currency', 'received_at', 'error'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->provider, (string)$row->eventid, (string)$row->idempotencykey, (string)$row->eventtype, (string)$row->mappedstatus, (string)$row->signaturestatus, (string)$row->processingstatus, (int)$row->invoiceid, (int)$row->paymentid, (int)$row->sessionid, (string)$row->providertransactionid, (string)$row->amount, (string)$row->currency, (int)$row->receivedat, (string)$row->error];
        });
    } else if ($report === 'hardening') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'snapshot_id', 'snapshot_key', 'status', 'checked_at', 'metrics_json', 'warnings_json'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->snapshotkey, (string)$row->status, (int)$row->checkedat, (string)$row->metricsjson, (string)$row->warningsjson];
        });
    } else if ($report === 'exceptions') {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'exception_type', 'request_id', 'invoice_id', 'student_id', 'student', 'offering', 'request_status', 'invoice_status', 'currency', 'total', 'paid', 'balance'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (string)$row->exceptiontype, (int)$row->requestid, (int)$row->invoiceid, (int)$row->studentid, pqfinops_student_label($row), (string)$row->offeringtitle, (string)$row->requeststatus, (string)$row->invoicestatus, (string)$row->currency, (string)$row->total, (string)$row->paidamount, (string)$row->balancedue];
        });
    } else {
        pqfinops_csv($prefix, ['reconciliation_id', 'workspace_id', 'consumer_id', 'domain', 'invoice_id', 'invoice_number', 'student_id', 'student', 'account', 'status', 'currency', 'total', 'paid', 'balance', 'due_at', 'aging_days', 'aging_bucket'], $rows, static function($row) use ($contextlabels): array {
            $labels = pqfinops_context_for_row($row, $contextlabels);
            return [(string)$row->reconciliationid, $labels['workspaceid'], $labels['consumerid'], $labels['domain'], (int)$row->id, (string)$row->invoicenumber, (int)$row->studentid, pqfinops_student_label($row), (string)$row->accountname, (string)$row->status, (string)$row->currency, (string)$row->total, (string)$row->paidamount, (string)$row->balancedue, (int)$row->dueat, (int)$row->agingdays, (string)$row->agingbucket];
        });
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/finance_operations.php', $urlparams + ['report' => $report]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Finance Operations');
$PAGE->set_heading('Finance Operations');
$PAGE->add_body_class('pqfops-page');

echo $OUTPUT->header();
?>
<style>
body.pqfops-page header,body.pqfops-page footer,body.pqfops-page nav.navbar,body.pqfops-page #page-header,body.pqfops-page #page-footer,body.pqfops-page .drawer,body.pqfops-page .drawer-toggles,body.pqfops-page .block-region,body.pqfops-page [data-region="drawer"],body.pqfops-page [data-region="right-hand-drawer"]{display:none!important}
body.pqfops-page #page,body.pqfops-page #page-content,body.pqfops-page #region-main,body.pqfops-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqfops-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqfops-wrap{max-width:1320px;margin:0 auto}.pqfops-top,.pqfops-panel,.pqfops-card{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqfops-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.pqfops-title{margin:0;color:#221b22;font-size:29px;font-weight:950}.pqfops-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqfops-actions,.pqfops-tabs{display:flex;gap:8px;flex-wrap:wrap}.pqfops-btn,.pqfops-tab{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;border:0;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:13px;font-weight:950}.pqfops-btn--primary,.pqfops-tab[aria-current="true"]{background:#2f6f4e;color:#fff!important}.pqfops-metrics{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin-bottom:14px}.pqfops-card strong{display:block;color:#221b22;font-size:24px;font-weight:950;line-height:1}.pqfops-card span{display:block;margin-top:6px;color:#5e7280;font-size:12px;font-weight:900}.pqfops-tabs{margin-bottom:14px}.pqfops-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.pqfops-panel h2{margin:0;color:#221b22;font-size:21px;font-weight:950}.pqfops-table{width:100%;border-collapse:collapse}.pqfops-table th,.pqfops-table td{padding:10px;border-bottom:1px solid rgba(23,48,68,.1);text-align:left;vertical-align:top;font-size:13px}.pqfops-table th{color:#415363;font-size:11px;font-weight:950;text-transform:uppercase}.pqfops-name{display:block;color:#221b22;font-weight:950}.pqfops-muted{display:block;margin-top:3px;color:#6b7e8b;font-size:12px;font-weight:800}.pqfops-pill{display:inline-flex;min-height:24px;align-items:center;margin:0 4px 4px 0;padding:0 8px;border-radius:999px;background:#eef4f6;font-size:12px;font-weight:950}.pqfops-empty{padding:18px;border:1px dashed rgba(23,48,68,.22);border-radius:8px;color:#5e7280;font-weight:900;background:#fff}@media(max-width:1000px){.pqfops-top,.pqfops-panel-head{align-items:flex-start;flex-direction:column}.pqfops-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.pqfops-table{display:block;overflow-x:auto}}
</style>
<main class="pqfops-shell"><div class="pqfops-wrap">
  <section class="pqfops-top">
    <div>
      <h1 class="pqfops-title"><?php echo s($contextlabels['workspace']); ?> Finance Operations</h1>
      <p class="pqfops-sub"><?php echo s($contextlabels['consumer']); ?><?php echo $contextlabels['domain'] !== '' ? ' / ' . s($contextlabels['domain']) : ''; ?></p>
    </div>
    <nav class="pqfops-actions">
      <a class="pqfops-btn" href="<?php echo (new moodle_url('/local/hubredirect/invoices.php', $urlparams))->out(false); ?>">Invoices</a>
      <a class="pqfops-btn" href="<?php echo (new moodle_url('/local/hubredirect/student_finance.php', $urlparams))->out(false); ?>">Student finance</a>
      <a class="pqfops-btn" href="<?php echo (new moodle_url('/local/hubredirect/payment_gateway_settings.php', $urlparams))->out(false); ?>">Payment settings</a>
      <a class="pqfops-btn" href="<?php echo (new moodle_url('/local/hubredirect/finance_audit.php', $urlparams))->out(false); ?>">Audit</a>
      <a class="pqfops-btn" href="<?php echo (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false); ?>">Workspace</a>
    </nav>
  </section>
  <section class="pqfops-metrics" aria-label="Finance metrics">
    <div class="pqfops-card"><strong><?php echo (int)$metrics['open_invoices']; ?></strong><span>open invoices</span></div>
    <div class="pqfops-card"><strong><?php echo (int)$metrics['overdue_invoices']; ?></strong><span>overdue invoices</span></div>
    <div class="pqfops-card"><strong><?php echo s(pqfin_cents_to_money((int)$metrics['payments_received_cents'])); ?></strong><span>payments received</span></div>
    <div class="pqfops-card"><strong><?php echo s(pqfin_cents_to_money((int)$metrics['outstanding_balance_cents'])); ?></strong><span>outstanding balance</span></div>
    <div class="pqfops-card"><strong><?php echo (int)$metrics['paid_not_enrolled']; ?></strong><span>paid not enrolled</span></div>
    <div class="pqfops-card"><strong><?php echo (int)$metrics['enrolled_unpaid']; ?></strong><span>enrolled unpaid</span></div>
    <div class="pqfops-card"><strong><?php echo (int)$metrics['finance_holds']; ?></strong><span>finance holds</span></div>
  </section>
  <nav class="pqfops-tabs" aria-label="Finance reports">
    <?php foreach ($reports as $key => $label): ?>
      <a class="pqfops-tab" aria-current="<?php echo $report === $key ? 'true' : 'false'; ?>" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams + ['report' => $key]))->out(false); ?>"><?php echo s($label); ?></a>
    <?php endforeach; ?>
  </nav>
  <section class="pqfops-panel">
    <div class="pqfops-panel-head">
      <h2><?php echo s($reports[$report]); ?></h2>
      <a class="pqfops-btn pqfops-btn--primary" href="<?php echo (new moodle_url('/local/hubredirect/finance_operations.php', $urlparams + ['report' => $report, 'export' => 'csv']))->out(false); ?>">Export CSV</a>
    </div>
    <?php if (!$rows): ?><div class="pqfops-empty">No report rows found.</div><?php endif; ?>
    <?php if ($rows): ?>
      <table class="pqfops-table">
        <thead><tr><th>ID</th><th>Student</th><th>Reference</th><th>Status</th><th>Amounts</th><th>Details</th></tr></thead>
        <tbody>
        <?php foreach (array_slice($rows, 0, 100) as $row): ?>
          <tr>
            <td><span class="pqfops-name"><?php echo s((string)$row->reconciliationid); ?></span></td>
            <td><?php echo s(pqfinops_student_label($row)); ?><span class="pqfops-muted"><?php echo s((string)($row->email ?? '')); ?></span></td>
            <td><?php echo s((string)($row->invoicenumber ?? $row->receiptnumber ?? $row->documentnumber ?? $row->offeringtitle ?? $row->reasoncode ?? '')); ?><span class="pqfops-muted">Invoice <?php echo (int)($row->invoiceid ?? $row->id ?? 0); ?></span></td>
            <td><span class="pqfops-pill"><?php echo s((string)($row->status ?? $row->invoicestatus ?? $row->requeststatus ?? '')); ?></span></td>
            <td><?php echo s((string)($row->currency ?? '')); ?> <?php echo s((string)($row->balancedue ?? $row->amount ?? $row->committedamount ?? $row->payoutamount ?? $row->totalamount ?? $row->linetotal ?? '')); ?><span class="pqfops-muted">Paid <?php echo s((string)($row->paidamount ?? $row->receivedamount ?? '')); ?></span></td>
            <td><?php echo s((string)($row->agingbucket ?? $row->paymentmethod ?? $row->holdtype ?? $row->eventtype ?? $row->exceptiontype ?? $row->reporttype ?? $row->awardtype ?? $row->snapshotkey ?? $row->plantype ?? $row->description ?? '')); ?><span class="pqfops-muted"><?php echo s((string)($row->error ?? $row->reason ?? $row->termsnote ?? $row->warningsjson ?? $row->accountname ?? $row->fundingsource ?? '')); ?></span><?php if (isset($row->nextdueat) && (int)$row->nextdueat > 0): ?><span class="pqfops-muted">Next due <?php echo s(userdate((int)$row->nextdueat, get_string('strftimedate'))); ?></span><?php endif; ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </section>
</div></main>
<?php
echo $OUTPUT->footer();
