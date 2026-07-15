-- Phase 8 verification for finance holds and academic release controls.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Set @workspaceid to the workspace being verified. Use 0 to inspect all workspaces.
-- Optional: set @studentid to a student user id, or 0 for all students.

SET @workspaceid := 0;
SET @studentid := 0;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_finance_hold';

SELECT h.workspaceid,
       h.studentid,
       h.status,
       h.holdtype,
       h.source,
       COUNT(*) AS hold_count,
       SUM(CASE WHEN h.status = 'active' THEN 1 ELSE 0 END) AS active_count,
       SUM(CASE WHEN h.status = 'suggested' THEN 1 ELSE 0 END) AS suggested_count
FROM mdlgx_local_prequran_finance_hold h
WHERE (@workspaceid = 0 OR h.workspaceid = @workspaceid)
  AND (@studentid = 0 OR h.studentid = @studentid)
GROUP BY h.workspaceid, h.studentid, h.status, h.holdtype, h.source
ORDER BY h.workspaceid, h.studentid, h.status, h.holdtype;

SELECT h.id,
       h.workspaceid,
       h.studentid,
       h.billingaccountid,
       h.invoiceid,
       h.status,
       h.holdtype,
       h.reasoncode,
       h.severity,
       h.policyaction,
       h.amount,
       h.currency,
       h.detectedat,
       h.activatedat,
       h.resolvedat,
       h.reason,
       h.parentmessage,
       h.resolutionnote
FROM mdlgx_local_prequran_finance_hold h
WHERE (@workspaceid = 0 OR h.workspaceid = @workspaceid)
  AND (@studentid = 0 OR h.studentid = @studentid)
ORDER BY h.status ASC, h.detectedat DESC, h.timemodified DESC
LIMIT 100;

SELECT i.id AS invoiceid,
       i.workspaceid,
       i.studentid,
       i.invoicenumber,
       i.status,
       i.currency,
       i.total,
       i.paidamount,
       i.balancedue,
       i.dueat,
       COUNT(h.id) AS unresolved_hold_count
FROM mdlgx_local_prequran_invoice i
LEFT JOIN mdlgx_local_prequran_finance_hold h
  ON h.invoiceid = i.id
 AND h.status IN ('active', 'suggested')
WHERE (@workspaceid = 0 OR i.workspaceid = @workspaceid)
  AND (@studentid = 0 OR i.studentid = @studentid)
  AND i.status IN ('issued', 'sent', 'partially_paid', 'disputed')
  AND i.balancedue <> '0.00'
GROUP BY i.id,
         i.workspaceid,
         i.studentid,
         i.invoicenumber,
         i.status,
         i.currency,
         i.total,
         i.paidamount,
         i.balancedue,
         i.dueat
ORDER BY unresolved_hold_count ASC, i.dueat ASC, i.timemodified DESC
LIMIT 100;

SELECT a.workspaceid,
       a.studentid,
       a.actorid,
       a.action,
       a.targettype,
       a.targetid,
       a.timecreated,
       a.details
FROM mdlgx_local_prequran_finance_audit a
WHERE (@workspaceid = 0 OR a.workspaceid = @workspaceid)
  AND (@studentid = 0 OR a.studentid = @studentid)
  AND a.action IN ('finance_hold_suggested', 'finance_hold_created', 'finance_hold_activated', 'finance_hold_resolved')
ORDER BY a.timecreated DESC
LIMIT 100;
