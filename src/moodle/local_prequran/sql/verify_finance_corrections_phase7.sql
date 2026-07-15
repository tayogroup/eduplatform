-- Phase 7 verification for credits, voids, refunds, write-offs, disputes, and audit reports.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- For phpMyAdmin/MariaDB clients, set @workspaceid to the workspace being verified.
-- Leave @workspaceid as 0 to inspect all workspaces.

SET @workspaceid = 0;

SELECT 'Phase 7 verifier context' AS check_name,
       @workspaceid AS workspace_filter,
       CASE WHEN @workspaceid = 0 THEN 'all workspaces' ELSE 'single workspace' END AS scope,
       'Credits and write-offs update creditedamount; refunds preserve original payments.' AS note;

SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_credit_note' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_refund'
    UNION ALL SELECT 'mdlgx_local_prequran_finance_audit'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

SELECT CASE WHEN COUNT(actual.TABLE_NAME) = 3 THEN 'PASS' ELSE 'FAIL' END AS phase7_schema_status,
       COUNT(actual.TABLE_NAME) AS present_phase7_tables,
       3 AS expected_phase7_tables,
       CASE
           WHEN COUNT(actual.TABLE_NAME) = 3 THEN 'Phase 7 correction and finance audit tables exist.'
           ELSE 'Run the local_prequran Moodle upgrade to create Phase 7 tables.'
       END AS interpretation
FROM (
    SELECT 'mdlgx_local_prequran_credit_note' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_refund'
    UNION ALL SELECT 'mdlgx_local_prequran_finance_audit'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name;

SELECT CASE WHEN COUNT(*) = 0 THEN 'WARN' ELSE 'PASS' END AS credit_note_data_status,
       COUNT(*) AS credit_note_count,
       COALESCE(SUM(CASE WHEN credittype = 'write_off' THEN 1 ELSE 0 END), 0) AS write_off_count,
       COALESCE(SUM(CASE WHEN status = 'active' THEN CAST(amount AS DECIMAL(12,2)) ELSE 0 END), 0.00) AS active_credit_total,
       CASE WHEN COUNT(*) = 0 THEN 'No credit notes or write-offs have been recorded yet.' ELSE 'Credit note/write-off rows exist.' END AS interpretation
FROM mdlgx_local_prequran_credit_note
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT cn.id AS creditnoteid,
       cn.creditnumber,
       cn.credittype,
       cn.status,
       cn.invoiceid,
       i.invoicenumber,
       cn.currency,
       cn.amount,
       cn.reasoncode,
       cn.reason,
       cn.issuedat
FROM mdlgx_local_prequran_credit_note cn
JOIN mdlgx_local_prequran_invoice i
  ON i.id = cn.invoiceid
WHERE (@workspaceid = 0 OR cn.workspaceid = @workspaceid)
ORDER BY cn.issuedat DESC, cn.id DESC
LIMIT 100;

SELECT CASE WHEN COUNT(*) = 0 THEN 'WARN' ELSE 'PASS' END AS refund_data_status,
       COUNT(*) AS refund_count,
       COALESCE(SUM(CASE WHEN status = 'recorded' THEN CAST(amount AS DECIMAL(12,2)) ELSE 0 END), 0.00) AS recorded_refund_total,
       CASE WHEN COUNT(*) = 0 THEN 'No refunds have been recorded yet.' ELSE 'Refund rows exist and original payments remain inspectable.' END AS interpretation
FROM mdlgx_local_prequran_refund
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT r.id AS refundid,
       r.refundnumber,
       r.status,
       r.paymentid,
       p.receiptnumber,
       r.invoiceid,
       i.invoicenumber,
       r.currency,
       r.amount,
       r.refundmethod,
       r.reference,
       r.reason,
       r.refundedat
FROM mdlgx_local_prequran_refund r
LEFT JOIN mdlgx_local_prequran_payment p
       ON p.id = r.paymentid
LEFT JOIN mdlgx_local_prequran_invoice i
       ON i.id = r.invoiceid
WHERE (@workspaceid = 0 OR r.workspaceid = @workspaceid)
ORDER BY r.refundedat DESC, r.id DESC
LIMIT 100;

SELECT CASE WHEN COUNT(*) = 0 THEN 'WARN' ELSE 'PASS' END AS dispute_data_status,
       COUNT(*) AS disputed_invoice_count,
       CASE WHEN COUNT(*) = 0 THEN 'No disputed invoices currently exist.' ELSE 'Disputed invoice rows exist.' END AS interpretation
FROM mdlgx_local_prequran_invoice
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid)
  AND status = 'disputed';

SELECT i.id AS invoiceid,
       i.invoicenumber,
       i.status,
       i.total,
       i.paidamount,
       i.creditedamount,
       COALESCE(SUM(CASE WHEN cn.status = 'active' THEN CAST(cn.amount AS DECIMAL(12,2)) ELSE 0 END), 0.00) AS active_credit_total,
       i.balancedue,
       CASE
           WHEN CAST(i.creditedamount AS DECIMAL(12,2)) = COALESCE(SUM(CASE WHEN cn.status = 'active' THEN CAST(cn.amount AS DECIMAL(12,2)) ELSE 0 END), 0.00)
               THEN 'PASS'
           ELSE 'WARN'
       END AS credit_reconciliation_status
FROM mdlgx_local_prequran_invoice i
LEFT JOIN mdlgx_local_prequran_credit_note cn
       ON cn.invoiceid = i.id
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
GROUP BY i.id, i.invoicenumber, i.status, i.total, i.paidamount, i.creditedamount, i.balancedue
HAVING active_credit_total > 0 OR CAST(i.creditedamount AS DECIMAL(12,2)) > 0
ORDER BY i.timemodified DESC
LIMIT 100;

SELECT CASE WHEN COUNT(*) = 0 THEN 'WARN' ELSE 'PASS' END AS finance_audit_status,
       COUNT(*) AS finance_audit_event_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No finance audit events have been written to the dedicated finance audit table yet.'
           ELSE 'Dedicated finance audit events exist.'
       END AS interpretation
FROM mdlgx_local_prequran_finance_audit
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT fa.action,
       fa.targettype,
       fa.targetid,
       fa.studentid,
       fa.billingaccountid,
       fa.invoiceid,
       fa.paymentid,
       fa.actorid,
       fa.details,
       fa.timecreated
FROM mdlgx_local_prequran_finance_audit fa
WHERE (@workspaceid = 0 OR fa.workspaceid = @workspaceid)
  AND fa.action IN ('credit_note_created', 'invoice_write_off_recorded', 'refund_recorded', 'invoice_disputed', 'payment_disputed', 'invoice_voided')
ORDER BY fa.timecreated DESC
LIMIT 100;
