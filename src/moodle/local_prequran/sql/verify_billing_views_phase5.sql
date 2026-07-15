-- Phase 5 verification for student, parent, sponsor, and hosted invoice views.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- For phpMyAdmin/MariaDB clients, set @workspaceid to the workspace being verified.
-- Leave @workspaceid as 0 to inspect all workspaces.

SET @workspaceid = 0;

SELECT 'Phase 5 verifier context' AS check_name,
       @workspaceid AS workspace_filter,
       CASE WHEN @workspaceid = 0 THEN 'all workspaces' ELSE 'single workspace' END AS scope,
       'Published/hosted billing views require issued, sent, partially paid, or paid invoices.' AS note;

SELECT CASE
           WHEN COUNT(*) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS invoice_visibility_data_status,
       COUNT(*) AS visible_invoice_count,
       COALESCE(SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_invoice_count,
       COALESCE(SUM(CASE WHEN CAST(COALESCE(NULLIF(i.balancedue, ''), '0.00') AS DECIMAL(12,2)) > 0 THEN 1 ELSE 0 END), 0) AS open_balance_invoice_count,
       CASE
           WHEN COUNT(*) = 0
               THEN 'No issued/sent/partially paid/paid invoices exist yet for Phase 5 billing views.'
           ELSE 'Phase 5 has invoices eligible for student, parent, sponsor, or hosted invoice views.'
       END AS interpretation
FROM mdlgx_local_prequran_invoice i
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
  AND i.status IN ('issued', 'sent', 'partially_paid', 'paid');

SELECT i.id,
       i.invoicenumber,
       i.status,
       i.workspaceid,
       i.studentid,
       i.billingaccountid,
       ba.accounttype,
       ba.primaryuserid,
       ba.displayname,
       i.currency,
       i.total,
       i.paidamount,
       i.balancedue,
       i.dueat
FROM mdlgx_local_prequran_invoice i
JOIN mdlgx_local_prequran_billing_account ba
  ON ba.id = i.billingaccountid
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
  AND i.status IN ('issued', 'sent', 'partially_paid', 'paid')
ORDER BY i.dueat ASC, i.timemodified DESC
LIMIT 100;

SELECT CASE
           WHEN COUNT(*) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS student_billing_summary_status,
       COUNT(DISTINCT i.studentid) AS students_with_visible_invoices,
       COUNT(*) AS visible_invoice_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No visible student invoice rows exist yet.'
           ELSE 'Student invoice summaries can be populated.'
       END AS interpretation
FROM mdlgx_local_prequran_invoice i
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
  AND i.status IN ('issued', 'sent', 'partially_paid', 'paid');

SELECT i.studentid,
       COUNT(*) AS visible_invoice_count,
       SUM(CAST(i.total AS DECIMAL(12,2))) AS total_billed,
       SUM(CAST(i.balancedue AS DECIMAL(12,2))) AS total_balance
FROM mdlgx_local_prequran_invoice i
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
  AND i.status IN ('issued', 'sent', 'partially_paid', 'paid')
GROUP BY i.studentid
ORDER BY total_balance DESC;

SELECT CASE
           WHEN COUNT(*) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS sponsor_account_status,
       COUNT(*) AS sponsor_account_count,
       CASE
           WHEN COUNT(*) = 0
               THEN 'No sponsor billing accounts exist yet. Sponsor view will be empty until a sponsor account is assigned invoices.'
           ELSE 'Sponsor billing accounts exist.'
       END AS interpretation
FROM mdlgx_local_prequran_billing_account ba
WHERE (@workspaceid = 0 OR ba.workspaceid = @workspaceid)
  AND ba.accounttype = 'sponsor';

SELECT ba.primaryuserid AS sponsor_userid,
       ba.id AS billingaccountid,
       ba.displayname,
       COUNT(i.id) AS assigned_invoice_count,
       COALESCE(SUM(CAST(i.balancedue AS DECIMAL(12,2))), 0.00) AS assigned_balance
FROM mdlgx_local_prequran_billing_account ba
LEFT JOIN mdlgx_local_prequran_invoice i
       ON i.billingaccountid = ba.id
      AND i.status IN ('issued', 'sent', 'partially_paid', 'paid')
WHERE (@workspaceid = 0 OR ba.workspaceid = @workspaceid)
  AND ba.accounttype = 'sponsor'
GROUP BY ba.primaryuserid, ba.id, ba.displayname
ORDER BY assigned_balance DESC;

SELECT CASE
           WHEN COUNT(*) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS invoice_view_audit_status,
       COUNT(*) AS invoice_view_audit_count,
       CASE
           WHEN COUNT(*) = 0
               THEN 'No invoice view audit events yet. Open or print an invoice view to exercise hosted invoice access logging.'
           ELSE 'Invoice view audit events exist.'
       END AS interpretation
FROM mdlgx_local_prequran_course_audit ca
WHERE (@workspaceid = 0 OR ca.workspaceid = @workspaceid)
  AND ca.targettype = 'invoice'
  AND ca.action IN ('invoice_viewed', 'invoice_print_viewed');

SELECT ca.action,
       ca.targetid AS invoiceid,
       ca.studentid,
       ca.actorid AS viewerid,
       ca.details,
       ca.timecreated
FROM mdlgx_local_prequran_course_audit ca
WHERE (@workspaceid = 0 OR ca.workspaceid = @workspaceid)
  AND ca.targettype = 'invoice'
  AND ca.action IN ('invoice_viewed', 'invoice_print_viewed')
ORDER BY ca.timecreated DESC
LIMIT 100;
