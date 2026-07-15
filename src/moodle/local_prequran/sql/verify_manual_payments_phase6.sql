-- Phase 6 verification for manual payments, allocations, and receipts.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- For phpMyAdmin/MariaDB clients, set @workspaceid to the workspace being verified.
-- Leave @workspaceid as 0 to inspect all workspaces.

SET @workspaceid = 0;

SELECT 'Phase 6 verifier context' AS check_name,
       @workspaceid AS workspace_filter,
       CASE WHEN @workspaceid = 0 THEN 'all workspaces' ELSE 'single workspace' END AS scope,
       'Manual payments require local_prequran_payment and local_prequran_payment_alloc.' AS note;

SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_payment' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_payment_alloc'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

SELECT CASE WHEN COUNT(actual.TABLE_NAME) = 2 THEN 'PASS' ELSE 'FAIL' END AS phase6_schema_status,
       COUNT(actual.TABLE_NAME) AS present_payment_tables,
       2 AS expected_payment_tables,
       CASE
           WHEN COUNT(actual.TABLE_NAME) = 2 THEN 'Phase 6 payment and allocation tables exist.'
           ELSE 'Run the local_prequran Moodle upgrade to create Phase 6 payment tables.'
       END AS interpretation
FROM (
    SELECT 'mdlgx_local_prequran_payment' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_payment_alloc'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name;

SELECT CASE WHEN COUNT(*) = 0 THEN 'WARN' ELSE 'PASS' END AS payment_data_status,
       COUNT(*) AS payment_count,
       COALESCE(SUM(CASE WHEN status = 'recorded' THEN 1 ELSE 0 END), 0) AS recorded_payment_count,
       COALESCE(SUM(CASE WHEN status = 'reversed' THEN 1 ELSE 0 END), 0) AS reversed_payment_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No manual payments have been recorded yet.'
           ELSE 'Manual payment rows exist.'
       END AS interpretation
FROM mdlgx_local_prequran_payment
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT p.id AS paymentid,
       p.receiptnumber,
       p.status AS payment_status,
       p.paymentmethod,
       p.currency,
       p.amount,
       p.allocatedamount,
       p.unallocatedamount,
       p.reference,
       p.receivedat,
       p.reversedat
FROM mdlgx_local_prequran_payment p
WHERE (@workspaceid = 0 OR p.workspaceid = @workspaceid)
ORDER BY p.receivedat DESC, p.id DESC
LIMIT 100;

SELECT CASE WHEN COUNT(*) = 0 THEN 'WARN' ELSE 'PASS' END AS allocation_data_status,
       COUNT(*) AS allocation_count,
       COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS active_allocation_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No payment allocations exist yet.'
           ELSE 'Payment allocations exist.'
       END AS interpretation
FROM mdlgx_local_prequran_payment_alloc
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT pa.paymentid,
       pa.invoiceid,
       pa.status AS allocation_status,
       pa.currency,
       pa.amount,
       p.receiptnumber,
       i.invoicenumber,
       i.status AS invoice_status,
       i.total,
       i.paidamount,
       i.balancedue
FROM mdlgx_local_prequran_payment_alloc pa
JOIN mdlgx_local_prequran_payment p
  ON p.id = pa.paymentid
JOIN mdlgx_local_prequran_invoice i
  ON i.id = pa.invoiceid
WHERE (@workspaceid = 0 OR pa.workspaceid = @workspaceid)
ORDER BY pa.allocatedat DESC, pa.id DESC
LIMIT 100;

SELECT i.id AS invoiceid,
       i.invoicenumber,
       i.status,
       i.total,
       i.paidamount,
       COALESCE(SUM(CASE WHEN pa.status = 'active' THEN CAST(pa.amount AS DECIMAL(12,2)) ELSE 0 END), 0.00) AS active_allocated_amount,
       i.balancedue,
       CASE
           WHEN CAST(i.paidamount AS DECIMAL(12,2)) = COALESCE(SUM(CASE WHEN pa.status = 'active' THEN CAST(pa.amount AS DECIMAL(12,2)) ELSE 0 END), 0.00)
               THEN 'PASS'
           ELSE 'WARN'
       END AS allocation_reconciliation_status
FROM mdlgx_local_prequran_invoice i
LEFT JOIN mdlgx_local_prequran_payment_alloc pa
       ON pa.invoiceid = i.id
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
GROUP BY i.id, i.invoicenumber, i.status, i.total, i.paidamount, i.balancedue
HAVING active_allocated_amount > 0 OR CAST(i.paidamount AS DECIMAL(12,2)) > 0
ORDER BY i.timemodified DESC
LIMIT 100;

SELECT ca.action,
       ca.targetid AS paymentid,
       ca.studentid,
       ca.actorid,
       ca.details,
       ca.timecreated
FROM mdlgx_local_prequran_course_audit ca
WHERE (@workspaceid = 0 OR ca.workspaceid = @workspaceid)
  AND ca.targettype = 'payment'
  AND ca.action IN ('manual_payment_recorded', 'manual_payment_reversed', 'receipt_viewed', 'receipt_print_viewed')
ORDER BY ca.timecreated DESC
LIMIT 100;
