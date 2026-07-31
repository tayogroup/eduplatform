<?php
// Finance dunning — the collections automation that never existed: the
// payment_due_soon / payment_overdue templates were defined but NOTHING ever
// sent them, overdue invoices never chased anyone, missed plan installments
// never even flipped to past_due on their own, and abandoned checkout sessions
// lived forever.
//
// Nightly (gated by finance_dunning_mode '' | 'report' | 'enforce'):
//  1) DUE-SOON: open invoices due within dunning_due_soon_days -> family
//     notified once per invoice (existing notification machinery + secure link).
//  2) OVERDUE: open invoices past due with a balance -> family notified,
//     repeated every dunning_overdue_repeat_days.
//  3) INSTALLMENTS: payment plans with scheduled installments past due are
//     recalculated (fixing the stale-state bug where plans only updated on
//     unrelated invoice activity) — their overdue notice rides item 2.
//  4) STALE SESSIONS: pending hosted-checkout sessions past expiry -> expired.
//  5) HOLD CANDIDATES (report-only): students overdue beyond the policy's
//     finance_hold_overdue_days are listed for admins — hold creation stays a
//     deliberate human action via Student Finance.

namespace local_prequran\task;

defined('MOODLE_INTERNAL') || die();

class finance_dunning extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('task_finance_dunning', 'local_prequran');
    }

    public function execute(): void {
        global $CFG, $DB;

        $mode = trim((string)get_config('local_prequran', 'finance_dunning_mode'));
        if ($mode === '') {
            mtrace('Finance dunning skipped: finance_dunning_mode is off.');
            return;
        }
        $enforce = $mode === 'enforce';
        $label = $enforce ? 'enforce' : 'report';

        require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
        require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');

        if (!$DB->get_manager()->table_exists(new \xmldb_table('local_prequran_invoice'))) {
            mtrace('Finance dunning skipped: invoice table missing.');
            return;
        }

        $now = time();
        $duesoondays = (int)get_config('local_prequran', 'dunning_due_soon_days');
        if ($duesoondays < 1) {
            $duesoondays = 3;
        }
        $repeatdays = (int)get_config('local_prequran', 'dunning_overdue_repeat_days');
        if ($repeatdays < 1) {
            $repeatdays = 7;
        }

        $alreadysent = static function (string $action, int $invoiceid, int $since) use ($DB): bool {
            return $DB->record_exists_select('local_prequran_course_audit',
                'action = :action AND targetid = :tid AND timecreated > :since',
                ['action' => $action, 'tid' => $invoiceid, 'since' => $since]);
        };
        $openbalance = static function ($invoice): bool {
            return pqfin_money_to_cents((string)$invoice->balancedue) > 0;
        };

        // 1) Due soon (once per invoice, ever).
        $duesoon = $DB->get_records_select('local_prequran_invoice',
            "status IN ('issued', 'sent') AND dueat > :now AND dueat < :soon",
            ['now' => $now, 'soon' => $now + ($duesoondays * DAYSECS)], 'dueat ASC', '*', 0, 200);
        $sent1 = 0;
        foreach ($duesoon as $invoice) {
            if (!$openbalance($invoice) || $alreadysent('dunning_due_soon_sent', (int)$invoice->id, 0)) {
                continue;
            }
            if ($enforce) {
                try {
                    pqfin_send_invoice_notification((int)$invoice->id, 'payment_due_soon',
                        pqh_consumer_context_by_workspace((int)$invoice->workspaceid), 0);
                    pqfin_audit('dunning_due_soon_sent', (int)$invoice->workspaceid, (int)$invoice->studentid, (int)$invoice->id,
                        ['targettype' => 'invoice', 'invoiceid' => (int)$invoice->id]);
                    $sent1++;
                    mtrace("  [{$label}] due-soon notice sent: {$invoice->invoicenumber} (due " . userdate((int)$invoice->dueat) . ')');
                } catch (\Throwable $e) {
                    mtrace("  due-soon send failed for invoice {$invoice->id}: " . $e->getMessage());
                }
            } else {
                mtrace("  [{$label}] WOULD send due-soon notice: {$invoice->invoicenumber} (due " . userdate((int)$invoice->dueat) . ')');
            }
        }

        // 2) Overdue (repeat every N days).
        $overdue = $DB->get_records_select('local_prequran_invoice',
            "status IN ('issued', 'sent', 'partially_paid') AND dueat > 0 AND dueat < :now",
            ['now' => $now], 'dueat ASC', '*', 0, 200);
        $sent2 = 0;
        foreach ($overdue as $invoice) {
            if (!$openbalance($invoice)
                    || $alreadysent('dunning_overdue_sent', (int)$invoice->id, $now - ($repeatdays * DAYSECS))) {
                continue;
            }
            $overduedays = (int)floor(($now - (int)$invoice->dueat) / DAYSECS);
            if ($enforce) {
                try {
                    pqfin_send_invoice_notification((int)$invoice->id, 'payment_overdue',
                        pqh_consumer_context_by_workspace((int)$invoice->workspaceid), 0);
                    pqfin_audit('dunning_overdue_sent', (int)$invoice->workspaceid, (int)$invoice->studentid, (int)$invoice->id,
                        ['targettype' => 'invoice', 'invoiceid' => (int)$invoice->id, 'overdue_days' => $overduedays]);
                    $sent2++;
                    mtrace("  [{$label}] overdue notice sent: {$invoice->invoicenumber} ({$overduedays}d overdue, balance {$invoice->balancedue})");
                } catch (\Throwable $e) {
                    mtrace("  overdue send failed for invoice {$invoice->id}: " . $e->getMessage());
                }
            } else {
                mtrace("  [{$label}] WOULD send overdue notice: {$invoice->invoicenumber} ({$overduedays}d overdue, balance {$invoice->balancedue})");
            }
        }

        // 3) Payment plans with scheduled installments past due -> recalculate
        // so they flip to past_due without waiting for unrelated activity.
        $staleplans = 0;
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_payment_install'))) {
            $planids = $DB->get_fieldset_sql(
                "SELECT DISTINCT pi.planid
                   FROM {local_prequran_payment_install} pi
                   JOIN {local_prequran_payment_plan} pp ON pp.id = pi.planid
                  WHERE pi.status = 'scheduled' AND pi.dueat > 0 AND pi.dueat < :now
                    AND pp.status IN ('active', 'past_due')", ['now' => $now]);
            foreach ($planids as $planid) {
                if ($enforce) {
                    try {
                        pqfin_recalculate_payment_plan((int)$planid, 0);
                        $staleplans++;
                    } catch (\Throwable $e) {
                        mtrace("  plan recalc failed for plan {$planid}: " . $e->getMessage());
                    }
                } else {
                    mtrace("  [{$label}] WOULD recalculate plan {$planid} (scheduled installment past due)");
                }
            }
        }

        // 4) Expire abandoned hosted-checkout sessions.
        $expired = 0;
        if ($DB->get_manager()->table_exists(new \xmldb_table('local_prequran_pay_session'))) {
            $stalesessions = $DB->get_records_select('local_prequran_pay_session',
                "status = 'pending' AND expiresat > 0 AND expiresat < :now", ['now' => $now], '', 'id', 0, 500);
            foreach ($stalesessions as $s) {
                if ($enforce) {
                    $DB->update_record('local_prequran_pay_session', (object)[
                        'id' => (int)$s->id, 'status' => 'expired', 'timemodified' => $now,
                    ]);
                    $expired++;
                }
            }
            if (!$enforce && $stalesessions) {
                mtrace("  [{$label}] WOULD expire " . count($stalesessions) . ' abandoned checkout session(s)');
            }
        }

        // 5) Hold candidates (report-only, always): students overdue beyond the
        // policy threshold — admins raise holds deliberately via Student Finance.
        $holdinfo = [];
        foreach ($overdue as $invoice) {
            if (!$openbalance($invoice)) {
                continue;
            }
            $policy = pqfin_workspace_finance_policy((int)$invoice->workspaceid);
            $holddays = max(1, (int)($policy['policy']['finance_hold_overdue_days'] ?? 30));
            if ((int)$invoice->dueat + ($holddays * DAYSECS) < $now) {
                $holdinfo[(int)$invoice->studentid] = ($holdinfo[(int)$invoice->studentid] ?? 0) + 1;
            }
        }
        foreach ($holdinfo as $studentid => $count) {
            mtrace("  [info] HOLD CANDIDATE: student {$studentid} has {$count} invoice(s) overdue beyond the hold threshold - review in Student Finance");
        }

        set_config('lastrun_finance_dunning', $now, 'local_prequran');
        mtrace('Finance dunning (' . $label . '): ' . count($duesoon) . ' due-soon / ' . count($overdue) . ' overdue candidates'
            . ($enforce ? " ({$sent1} due-soon + {$sent2} overdue notices sent, {$staleplans} plans recalculated, {$expired} sessions expired)" : '')
            . ', ' . count($holdinfo) . ' hold candidate student(s).');
    }
}
