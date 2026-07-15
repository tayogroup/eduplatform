-- Phase 4 verification for enrollment pricing integration.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- For phpMyAdmin/MariaDB clients, set @workspaceid to the workspace being verified.
-- Leave @workspaceid as 0 to inspect all workspaces.

SET @workspaceid = 0;

SELECT 'Phase 4 verifier context' AS check_name,
       @workspaceid AS workspace_filter,
       CASE WHEN @workspaceid = 0 THEN 'all workspaces' ELSE 'single workspace' END AS scope,
       'Exception queries later in this file should normally return zero rows.' AS note;

SELECT expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS column_status
FROM (
    SELECT 'tuition_amount' AS column_name
    UNION ALL SELECT 'pricing_currency'
    UNION ALL SELECT 'registration_fee'
    UNION ALL SELECT 'materials_fee'
    UNION ALL SELECT 'installment_eligible'
    UNION ALL SELECT 'scholarship_eligible'
    UNION ALL SELECT 'tax_behavior'
    UNION ALL SELECT 'refund_policy_label'
    UNION ALL SELECT 'payment_required_timing'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_course_offering'
      AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.column_name;

SELECT CASE
           WHEN COUNT(actual.COLUMN_NAME) = 9 THEN 'PASS'
           ELSE 'FAIL'
       END AS phase4_schema_status,
       COUNT(actual.COLUMN_NAME) AS present_pricing_columns,
       9 AS expected_pricing_columns,
       CASE
           WHEN COUNT(actual.COLUMN_NAME) = 9
               THEN 'Phase 4 upgrade has added all required course offering pricing columns.'
           ELSE 'Phase 4 upgrade has not added all required pricing columns. Run Moodle upgrade again.'
       END AS interpretation
FROM (
    SELECT 'tuition_amount' AS column_name
    UNION ALL SELECT 'pricing_currency'
    UNION ALL SELECT 'registration_fee'
    UNION ALL SELECT 'materials_fee'
    UNION ALL SELECT 'installment_eligible'
    UNION ALL SELECT 'scholarship_eligible'
    UNION ALL SELECT 'tax_behavior'
    UNION ALL SELECT 'refund_policy_label'
    UNION ALL SELECT 'payment_required_timing'
) expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS actual
       ON actual.TABLE_SCHEMA = DATABASE()
      AND actual.TABLE_NAME = 'mdlgx_local_prequran_course_offering'
      AND actual.COLUMN_NAME = expected.column_name;

SELECT COUNT(*) AS offering_count,
       SUM(CASE WHEN (
           CAST(COALESCE(NULLIF(tuition_amount, ''), '0.00') AS DECIMAL(12,2))
         + CAST(COALESCE(NULLIF(registration_fee, ''), '0.00') AS DECIMAL(12,2))
         + CAST(COALESCE(NULLIF(materials_fee, ''), '0.00') AS DECIMAL(12,2))
       ) > 0 THEN 1 ELSE 0 END) AS priced_offering_count,
       SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_offering_count
FROM mdlgx_local_prequran_course_offering
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT CASE
           WHEN COUNT(*) = 0 THEN 'WARN'
           WHEN SUM(CASE WHEN (
               CAST(COALESCE(NULLIF(tuition_amount, ''), '0.00') AS DECIMAL(12,2))
             + CAST(COALESCE(NULLIF(registration_fee, ''), '0.00') AS DECIMAL(12,2))
             + CAST(COALESCE(NULLIF(materials_fee, ''), '0.00') AS DECIMAL(12,2))
           ) > 0 THEN 1 ELSE 0 END) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS pricing_data_status,
       COUNT(*) AS offering_count,
       SUM(CASE WHEN (
           CAST(COALESCE(NULLIF(tuition_amount, ''), '0.00') AS DECIMAL(12,2))
         + CAST(COALESCE(NULLIF(registration_fee, ''), '0.00') AS DECIMAL(12,2))
         + CAST(COALESCE(NULLIF(materials_fee, ''), '0.00') AS DECIMAL(12,2))
       ) > 0 THEN 1 ELSE 0 END) AS priced_offering_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No course offerings exist yet.'
           WHEN SUM(CASE WHEN (
               CAST(COALESCE(NULLIF(tuition_amount, ''), '0.00') AS DECIMAL(12,2))
             + CAST(COALESCE(NULLIF(registration_fee, ''), '0.00') AS DECIMAL(12,2))
             + CAST(COALESCE(NULLIF(materials_fee, ''), '0.00') AS DECIMAL(12,2))
           ) > 0 THEN 1 ELSE 0 END) = 0
               THEN 'Phase 4 schema is installed, but no offering has non-zero tuition or fees yet. Set pricing on an offering to exercise invoicing.'
           ELSE 'At least one offering has non-zero pricing.'
       END AS interpretation
FROM mdlgx_local_prequran_course_offering
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT o.id AS offeringid,
       o.title,
       o.status,
       o.pricing_currency,
       o.tuition_amount,
       o.registration_fee,
       o.materials_fee,
       o.installment_eligible,
       o.scholarship_eligible,
       o.tax_behavior,
       o.refund_policy_label,
       o.payment_required_timing
FROM mdlgx_local_prequran_course_offering o
WHERE (@workspaceid = 0 OR o.workspaceid = @workspaceid)
ORDER BY o.timemodified DESC
LIMIT 100;

SELECT COUNT(*) AS enrollment_request_count
FROM mdlgx_local_prequran_course_enrol_req
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT CASE
           WHEN COUNT(*) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS enrollment_flow_status,
       COUNT(*) AS enrollment_request_count,
       CASE
           WHEN COUNT(*) = 0
               THEN 'No enrollment requests exist yet, so invoice creation from enrollment cannot be verified from database output.'
           ELSE 'Enrollment requests exist and can be checked for invoice links.'
       END AS interpretation
FROM mdlgx_local_prequran_course_enrol_req
WHERE (@workspaceid = 0 OR workspaceid = @workspaceid);

SELECT COUNT(DISTINCT il.requestid) AS requests_with_active_invoice,
       COUNT(DISTINCT i.id) AS active_invoice_count
FROM mdlgx_local_prequran_invoice_line il
JOIN mdlgx_local_prequran_invoice i
  ON i.id = il.invoiceid
 AND i.status <> 'void'
WHERE (@workspaceid = 0 OR il.workspaceid = @workspaceid)
  AND il.status = 'active'
  AND il.requestid > 0;

SELECT CASE
           WHEN COUNT(DISTINCT il.requestid) = 0 THEN 'WARN'
           ELSE 'PASS'
       END AS invoice_link_status,
       COUNT(DISTINCT il.requestid) AS requests_with_active_invoice,
       COUNT(DISTINCT i.id) AS active_invoice_count,
       CASE
           WHEN COUNT(DISTINCT il.requestid) = 0
               THEN 'No enrollment-generated invoice links exist yet. Use the admin create-invoice action from an enrollment request.'
           ELSE 'At least one enrollment request has an active invoice.'
       END AS interpretation
FROM mdlgx_local_prequran_invoice_line il
JOIN mdlgx_local_prequran_invoice i
  ON i.id = il.invoiceid
 AND i.status <> 'void'
WHERE (@workspaceid = 0 OR il.workspaceid = @workspaceid)
  AND il.status = 'active'
  AND il.requestid > 0;

SELECT r.id AS requestid,
       r.status AS request_status,
       r.studentid,
       o.id AS offeringid,
       o.title AS offering_title,
       o.pricing_currency AS offering_currency,
       i.id AS invoiceid,
       i.status AS invoice_status,
       i.currency AS invoice_currency,
       i.total,
       i.balancedue,
       i.dueat
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
LEFT JOIN mdlgx_local_prequran_invoice_line il
       ON il.requestid = r.id
      AND il.status = 'active'
LEFT JOIN mdlgx_local_prequran_invoice i
       ON i.id = il.invoiceid
      AND i.status <> 'void'
WHERE (@workspaceid = 0 OR r.workspaceid = @workspaceid)
ORDER BY r.timemodified DESC
LIMIT 100;

SELECT 'Duplicate active invoices for one enrollment request' AS exception_check,
       'Expected result: zero rows' AS expected_result;

SELECT il.requestid,
       COUNT(DISTINCT i.id) AS active_invoice_count
FROM mdlgx_local_prequran_invoice_line il
JOIN mdlgx_local_prequran_invoice i
  ON i.id = il.invoiceid
 AND i.status <> 'void'
WHERE (@workspaceid = 0 OR il.workspaceid = @workspaceid)
  AND il.requestid > 0
GROUP BY il.requestid
HAVING COUNT(DISTINCT i.id) > 1;

SELECT 'Invoice currency differs from offering currency' AS exception_check,
       'Expected result: zero rows' AS expected_result;

SELECT r.id AS requestid,
       r.status AS request_status,
       o.pricing_currency AS offering_currency,
       i.id AS invoiceid,
       i.currency AS invoice_currency
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
JOIN mdlgx_local_prequran_invoice_line il
  ON il.requestid = r.id
JOIN mdlgx_local_prequran_invoice i
  ON i.id = il.invoiceid
 AND i.status <> 'void'
WHERE (@workspaceid = 0 OR r.workspaceid = @workspaceid)
  AND i.currency <> o.pricing_currency;

SELECT 'Approved or enrolled paid offering has no active invoice' AS exception_check,
       'Expected result: zero rows unless old data needs backfill' AS expected_result;

SELECT r.id AS requestid,
       r.status,
       r.studentid,
       o.title AS offering_title,
       o.pricing_currency,
       o.tuition_amount,
       o.registration_fee,
       o.materials_fee
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o
  ON o.id = r.offeringid
LEFT JOIN mdlgx_local_prequran_invoice_line il
       ON il.requestid = r.id
LEFT JOIN mdlgx_local_prequran_invoice i
       ON i.id = il.invoiceid
      AND i.status <> 'void'
WHERE (@workspaceid = 0 OR r.workspaceid = @workspaceid)
  AND r.status IN ('approved', 'enrolled')
  AND i.id IS NULL
  AND (
      CAST(COALESCE(NULLIF(o.tuition_amount, ''), '0.00') AS DECIMAL(12,2))
    + CAST(COALESCE(NULLIF(o.registration_fee, ''), '0.00') AS DECIMAL(12,2))
    + CAST(COALESCE(NULLIF(o.materials_fee, ''), '0.00') AS DECIMAL(12,2))
  ) > 0;

SELECT COUNT(*) AS invoice_created_from_enrollment_audit_count
FROM mdlgx_local_prequran_course_audit ca
WHERE (@workspaceid = 0 OR ca.workspaceid = @workspaceid)
  AND ca.action = 'invoice_created_from_enrollment';

SELECT ca.workspaceid,
       ca.action,
       ca.targettype,
       ca.targetid,
       ca.details,
       ca.timecreated
FROM mdlgx_local_prequran_course_audit ca
WHERE (@workspaceid = 0 OR ca.workspaceid = @workspaceid)
  AND ca.action = 'invoice_created_from_enrollment'
ORDER BY ca.timecreated DESC
LIMIT 100;
