-- Phase 12 verification for payment plans and scheduled installments.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is phpMyAdmin friendly and does not use named placeholders.
-- Optional: add "AND p.workspaceid = 123" to the WHERE clauses below when checking one workspace.

SELECT 'payment_plan_tables' AS check_name,
       CASE
           WHEN COUNT(*) = 2 THEN 'ready'
           ELSE 'missing_tables'
       END AS status,
       COUNT(*) AS found_table_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'mdlgx_local_prequran_payment_plan',
      'mdlgx_local_prequran_payment_install'
  );

SELECT 'active_payment_plans' AS check_name,
       COUNT(*) AS active_plan_count,
       COALESCE(SUM(CAST(p.principalamount AS DECIMAL(18,2))), 0) AS scheduled_principal,
       COALESCE(SUM(CAST(p.paidamount AS DECIMAL(18,2))), 0) AS scheduled_paid,
       COALESCE(SUM(CAST(p.pastdueamount AS DECIMAL(18,2))), 0) AS scheduled_past_due,
       CASE
           WHEN COUNT(*) = 0 THEN 'No active payment plans exist yet. Create one from an issued invoice detail page.'
           ELSE 'Active payment plans exist and can be reconciled.'
       END AS interpretation
FROM mdlgx_local_prequran_payment_plan p
WHERE p.status IN ('active', 'past_due', 'completed');

SELECT p.id AS planid,
       p.plannumber,
       p.status AS plan_status,
       p.workspaceid,
       p.studentid,
       p.invoiceid,
       i.invoicenumber,
       i.status AS invoice_status,
       p.currency,
       p.principalamount,
       p.scheduledamount,
       p.paidamount,
       p.pastdueamount,
       p.installmentcount,
       FROM_UNIXTIME(p.firstdueat) AS first_due,
       FROM_UNIXTIME(p.lastdueat) AS last_due,
       p.timemodified
FROM mdlgx_local_prequran_payment_plan p
JOIN mdlgx_local_prequran_invoice i
  ON i.id = p.invoiceid
ORDER BY p.timemodified DESC
LIMIT 100;

SELECT ins.planid,
       p.plannumber,
       ins.id AS installmentid,
       ins.installmentnumber,
       ins.status AS installment_status,
       ins.currency,
       ins.amount,
       ins.paidamount,
       ins.balancedue,
       FROM_UNIXTIME(ins.dueat) AS due_date,
       i.invoicenumber
FROM mdlgx_local_prequran_payment_install ins
JOIN mdlgx_local_prequran_payment_plan p
  ON p.id = ins.planid
JOIN mdlgx_local_prequran_invoice i
  ON i.id = ins.invoiceid
ORDER BY ins.dueat ASC, ins.installmentnumber ASC
LIMIT 150;

SELECT 'installment_sum_matches_plan' AS check_name,
       p.id AS planid,
       p.plannumber,
       p.scheduledamount AS stored_plan_scheduled,
       COALESCE(SUM(CAST(ins.amount AS DECIMAL(18,2))), 0) AS installment_total,
       CASE
           WHEN CAST(p.scheduledamount AS DECIMAL(18,2)) = COALESCE(SUM(CAST(ins.amount AS DECIMAL(18,2))), 0)
                THEN 'ok'
           ELSE 'mismatch'
       END AS status
FROM mdlgx_local_prequran_payment_plan p
LEFT JOIN mdlgx_local_prequran_payment_install ins
  ON ins.planid = p.id
GROUP BY p.id, p.plannumber, p.scheduledamount
ORDER BY p.id DESC
LIMIT 100;

SELECT 'multiple_active_plans_per_invoice' AS exception_check,
       invoiceid,
       COUNT(*) AS active_plan_count
FROM mdlgx_local_prequran_payment_plan
WHERE status IN ('draft', 'active', 'past_due')
GROUP BY invoiceid
HAVING COUNT(*) > 1;

SELECT 'payment_plan_audit_events' AS check_name,
       COUNT(*) AS audit_event_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No payment plan audit events yet.'
           ELSE 'Payment plan audit events exist.'
       END AS interpretation
FROM mdlgx_local_prequran_finance_audit
WHERE action IN ('payment_plan_created', 'payment_plan_cancelled');
