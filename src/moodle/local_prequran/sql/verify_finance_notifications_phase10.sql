-- Phase 10 verification for finance notifications and secure invoice/receipt links.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Set @workspaceid to the workspace being verified. Use 0 to inspect all workspaces.

SET @workspaceid := 0;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'mdlgx_local_prequran_finance_link',
      'mdlgx_local_prequran_finance_delivery'
  )
ORDER BY table_name;

SELECT 'message_provider' AS check_name,
       component,
       name,
       enabled
FROM mdlgx_message_providers
WHERE component = 'local_prequran'
  AND name = 'finance_update';

SELECT 'secure_links' AS check_name,
       l.workspaceid,
       l.purpose,
       l.status,
       COUNT(*) AS link_count,
       SUM(CASE WHEN l.expiresat < UNIX_TIMESTAMP() THEN 1 ELSE 0 END) AS expired_count,
       SUM(CASE WHEN l.revokedat > 0 THEN 1 ELSE 0 END) AS revoked_count,
       SUM(l.usecount) AS total_use_count
FROM mdlgx_local_prequran_finance_link l
WHERE (@workspaceid = 0 OR l.workspaceid = @workspaceid)
GROUP BY l.workspaceid, l.purpose, l.status
ORDER BY l.workspaceid, l.purpose, l.status;

SELECT 'recent_secure_links' AS check_name,
       l.id,
       l.workspaceid,
       l.invoiceid,
       l.paymentid,
       l.purpose,
       l.targettype,
       l.targetid,
       l.status,
       l.expiresat,
       l.revokedat,
       l.lastusedat,
       l.usecount,
       l.timecreated
FROM mdlgx_local_prequran_finance_link l
WHERE (@workspaceid = 0 OR l.workspaceid = @workspaceid)
ORDER BY l.timecreated DESC, l.id DESC
LIMIT 100;

SELECT 'delivery_attempts' AS check_name,
       d.workspaceid,
       d.eventtype,
       d.status,
       COUNT(*) AS delivery_count,
       MAX(d.sentat) AS last_sentat,
       MAX(d.timemodified) AS last_modified
FROM mdlgx_local_prequran_finance_delivery d
WHERE (@workspaceid = 0 OR d.workspaceid = @workspaceid)
GROUP BY d.workspaceid, d.eventtype, d.status
ORDER BY d.workspaceid, d.eventtype, d.status;

SELECT 'recent_delivery_failures' AS check_name,
       d.id,
       d.workspaceid,
       d.invoiceid,
       d.paymentid,
       d.linkid,
       d.recipientid,
       d.recipientemail,
       d.eventtype,
       d.status,
       d.subject,
       d.error,
       d.timecreated,
       d.timemodified
FROM mdlgx_local_prequran_finance_delivery d
WHERE (@workspaceid = 0 OR d.workspaceid = @workspaceid)
  AND d.status IN ('failed', 'skipped')
ORDER BY d.timemodified DESC, d.id DESC
LIMIT 100;

SELECT 'notification_audit_events' AS check_name,
       a.workspaceid,
       a.action,
       COUNT(*) AS event_count,
       MAX(a.timecreated) AS last_event
FROM mdlgx_local_prequran_finance_audit a
WHERE (@workspaceid = 0 OR a.workspaceid = @workspaceid)
  AND a.action IN (
      'finance_secure_link_created',
      'finance_secure_link_used',
      'finance_secure_link_rejected',
      'finance_secure_links_revoked',
      'finance_notification_sent',
      'finance_notification_failed'
  )
GROUP BY a.workspaceid, a.action
ORDER BY a.workspaceid, a.action;
