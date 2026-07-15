-- Phase 9 verification for reporting, reconciliation, and admin operations dashboard.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Set @workspaceid to the workspace being verified. Use 0 to inspect all workspaces.

SET @workspaceid := 0;

SELECT 'dashboard_counts' AS check_name,
       i.workspaceid,
       SUM(CASE WHEN i.status IN ('issued', 'sent', 'partially_paid', 'disputed') THEN 1 ELSE 0 END) AS open_invoices,
       SUM(CASE WHEN i.status IN ('issued', 'sent', 'partially_paid', 'disputed')
                 AND i.dueat > 0
                 AND i.dueat < UNIX_TIMESTAMP()
                 AND i.balancedue <> '0.00' THEN 1 ELSE 0 END) AS overdue_invoices,
       SUM(CASE WHEN i.status <> 'void' THEN CAST(i.balancedue AS DECIMAL(18,2)) ELSE 0 END) AS outstanding_balance
FROM mdlgx_local_prequran_invoice i
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
GROUP BY i.workspaceid
ORDER BY i.workspaceid;

SELECT 'payments_by_method' AS check_name,
       p.workspaceid,
       p.paymentmethod,
       p.provider,
       p.status,
       COUNT(*) AS payment_count,
       SUM(CAST(p.amount AS DECIMAL(18,2))) AS payment_total,
       MIN(p.receivedat) AS first_receivedat,
       MAX(p.receivedat) AS last_receivedat
FROM mdlgx_local_prequran_payment p
WHERE (@workspaceid = 0 OR p.workspaceid = @workspaceid)
GROUP BY p.workspaceid, p.paymentmethod, p.provider, p.status
ORDER BY p.workspaceid, payment_total DESC;

SELECT 'invoice_aging_rows' AS check_name,
       CONCAT('INV-', i.workspaceid, '-', i.id) AS reconciliation_id,
       i.workspaceid,
       i.id AS invoiceid,
       i.invoicenumber,
       i.studentid,
       i.status,
       i.currency,
       i.total,
       i.paidamount,
       i.balancedue,
       i.dueat,
       GREATEST(0, FLOOR((UNIX_TIMESTAMP() - i.dueat) / 86400)) AS aging_days
FROM mdlgx_local_prequran_invoice i
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
  AND i.status IN ('issued', 'sent', 'partially_paid', 'disputed')
  AND i.balancedue <> '0.00'
ORDER BY i.dueat ASC, i.timemodified DESC
LIMIT 100;

SELECT 'enrollment_finance_exceptions' AS check_name,
       CONCAT('EXC-', r.workspaceid, '-', r.id, '-', i.id) AS reconciliation_id,
       r.workspaceid,
       r.id AS requestid,
       r.studentid,
       r.status AS request_status,
       i.id AS invoiceid,
       i.invoicenumber,
       i.status AS invoice_status,
       i.total,
       i.paidamount,
       i.balancedue,
       CASE
         WHEN i.status = 'paid' AND r.status NOT IN ('approved', 'enrolled') THEN 'paid_not_enrolled'
         WHEN r.status IN ('approved', 'enrolled') AND i.status NOT IN ('paid', 'void') AND i.balancedue <> '0.00' THEN 'enrolled_unpaid'
         ELSE 'not_exception'
       END AS exception_type
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_invoice i
  ON i.requestid = r.id
WHERE (@workspaceid = 0 OR r.workspaceid = @workspaceid)
  AND (
    (i.status = 'paid' AND r.status NOT IN ('approved', 'enrolled'))
    OR (r.status IN ('approved', 'enrolled') AND i.status NOT IN ('paid', 'void') AND i.balancedue <> '0.00')
  )
ORDER BY r.workspaceid, exception_type, r.timemodified DESC
LIMIT 100;

SELECT 'finance_holds_report' AS check_name,
       CONCAT('HOLD-', h.workspaceid, '-', h.id) AS reconciliation_id,
       h.workspaceid,
       h.id AS holdid,
       h.studentid,
       h.invoiceid,
       h.status,
       h.holdtype,
       h.source,
       h.severity,
       h.amount,
       h.currency,
       h.detectedat,
       h.resolvedat
FROM mdlgx_local_prequran_finance_hold h
WHERE (@workspaceid = 0 OR h.workspaceid = @workspaceid)
ORDER BY h.status ASC, h.detectedat DESC
LIMIT 100;

SELECT 'scheduled_task_registered' AS check_name,
       classname,
       minute,
       hour,
       day,
       month,
       dayofweek,
       disabled
FROM mdlgx_task_scheduled
WHERE classname = '\\local_prequran\\task\\finance_operations_refresh';

SELECT 'snapshot_audit_events' AS check_name,
       a.workspaceid,
       a.action,
       COUNT(*) AS event_count,
       MAX(a.timecreated) AS last_event
FROM mdlgx_local_prequran_finance_audit a
WHERE (@workspaceid = 0 OR a.workspaceid = @workspaceid)
  AND a.action = 'finance_operations_snapshot_refreshed'
GROUP BY a.workspaceid, a.action
ORDER BY a.workspaceid;
