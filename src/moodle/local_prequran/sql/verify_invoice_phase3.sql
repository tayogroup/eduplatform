-- Phase 3 verification for invoice and invoice-line foundation.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Replace :workspaceid with the workspace being verified.

SELECT expected.table_name,
       CASE WHEN actual.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS table_status
FROM (
    SELECT 'mdlgx_local_prequran_invoice' AS table_name
    UNION ALL SELECT 'mdlgx_local_prequran_invoice_line'
) expected
LEFT JOIN INFORMATION_SCHEMA.TABLES actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = expected.table_name
ORDER BY expected.table_name;

SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'consumerid' AS column_name
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'billingaccountid'
    UNION ALL SELECT 'studentid'
    UNION ALL SELECT 'invoicenumber'
    UNION ALL SELECT 'invoicetype'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'currency'
    UNION ALL SELECT 'subtotal'
    UNION ALL SELECT 'discounttotal'
    UNION ALL SELECT 'taxtotal'
    UNION ALL SELECT 'total'
    UNION ALL SELECT 'paidamount'
    UNION ALL SELECT 'creditedamount'
    UNION ALL SELECT 'balancedue'
    UNION ALL SELECT 'policyversion'
    UNION ALL SELECT 'policyhash'
    UNION ALL SELECT 'issuedat'
    UNION ALL SELECT 'dueat'
    UNION ALL SELECT 'sentat'
    UNION ALL SELECT 'voidedat'
    UNION ALL SELECT 'metadatajson'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_invoice'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'invoiceid' AS column_name
    UNION ALL SELECT 'consumerid'
    UNION ALL SELECT 'workspaceid'
    UNION ALL SELECT 'linesequence'
    UNION ALL SELECT 'description'
    UNION ALL SELECT 'quantity'
    UNION ALL SELECT 'unitamount'
    UNION ALL SELECT 'discountamount'
    UNION ALL SELECT 'taxamount'
    UNION ALL SELECT 'linetotal'
    UNION ALL SELECT 'offeringid'
    UNION ALL SELECT 'requestid'
    UNION ALL SELECT 'moodlecourseid'
    UNION ALL SELECT 'teacherid'
    UNION ALL SELECT 'seriesid'
    UNION ALL SELECT 'status'
    UNION ALL SELECT 'metadatajson'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_invoice_line'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

SELECT i.id,
       i.invoicenumber,
       i.status,
       i.currency,
       i.subtotal,
       i.discounttotal,
       i.taxtotal,
       i.total,
       i.paidamount,
       i.creditedamount,
       i.balancedue,
       i.billingaccountid,
       ba.displayname AS billing_account,
       i.studentid,
       i.issuedat,
       i.dueat,
       i.timemodified
FROM mdlgx_local_prequran_invoice i
JOIN mdlgx_local_prequran_billing_account ba
  ON ba.id = i.billingaccountid
WHERE i.workspaceid = :workspaceid
ORDER BY i.timemodified DESC
LIMIT 100;

SELECT il.invoiceid,
       COUNT(CASE WHEN il.status = 'active' THEN 1 END) AS active_line_count,
       COALESCE(SUM(CASE WHEN il.status = 'active' THEN CAST(il.linetotal AS DECIMAL(12,2)) ELSE 0 END), 0) AS active_line_total,
       i.total AS stored_invoice_total,
       CASE
           WHEN COALESCE(SUM(CASE WHEN il.status = 'active' THEN CAST(il.linetotal AS DECIMAL(12,2)) ELSE 0 END), 0) = CAST(i.total AS DECIMAL(12,2)) THEN 'OK'
           ELSE 'TOTAL_MISMATCH'
       END AS total_check
FROM mdlgx_local_prequran_invoice i
LEFT JOIN mdlgx_local_prequran_invoice_line il
       ON il.invoiceid = i.id
WHERE i.workspaceid = :workspaceid
GROUP BY il.invoiceid, i.id, i.total
ORDER BY i.id DESC;

SELECT ca.workspaceid,
       ca.action,
       ca.targettype,
       ca.targetid,
       ca.details,
       ca.timecreated
FROM mdlgx_local_prequran_course_audit ca
WHERE ca.workspaceid = :workspaceid
  AND ca.targettype = 'invoice'
ORDER BY ca.timecreated DESC
LIMIT 100;
