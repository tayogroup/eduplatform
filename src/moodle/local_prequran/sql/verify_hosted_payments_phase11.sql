-- Phase 11 verification for hosted payment links and gateway webhooks.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- Set @workspaceid to the workspace being verified. Use 0 to inspect all workspaces.

SET @workspaceid := 0;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'mdlgx_local_prequran_pay_provider',
      'mdlgx_local_prequran_pay_session',
      'mdlgx_local_prequran_pay_webhook'
  )
ORDER BY table_name;

SELECT 'provider_configs' AS check_name,
       p.id,
       p.scope,
       p.consumerid,
       p.workspaceid,
       p.provider,
       p.mode,
       p.accountid,
       p.displayname,
       p.status,
       CASE WHEN p.checkoutbaseurl <> '' THEN 'configured' ELSE 'missing' END AS checkout_url_status,
       CASE WHEN p.webhooksecret <> '' THEN 'configured' ELSE 'missing' END AS webhook_secret_status,
       p.timemodified
FROM mdlgx_local_prequran_pay_provider p
WHERE (@workspaceid = 0 OR p.workspaceid = @workspaceid)
ORDER BY p.scope, p.workspaceid, p.timemodified DESC;

SELECT 'hosted_sessions' AS check_name,
       s.id,
       s.workspaceid,
       s.invoiceid,
       s.provider,
       s.mode,
       s.localsessionid,
       s.providersessionid,
       s.providertransactionid,
       s.status,
       s.currency,
       s.amount,
       s.expiresat,
       s.completedat,
       s.timecreated
FROM mdlgx_local_prequran_pay_session s
WHERE (@workspaceid = 0 OR s.workspaceid = @workspaceid)
ORDER BY s.timecreated DESC
LIMIT 100;

SELECT 'webhook_idempotency' AS check_name,
       w.provider,
       w.idempotencykey,
       COUNT(*) AS event_count,
       MIN(w.id) AS first_webhookid,
       MAX(w.id) AS last_webhookid,
       MAX(w.processingstatus) AS latest_processing_status
FROM mdlgx_local_prequran_pay_webhook w
WHERE (@workspaceid = 0 OR w.workspaceid = @workspaceid)
GROUP BY w.provider, w.idempotencykey
HAVING COUNT(*) > 1
ORDER BY event_count DESC, last_webhookid DESC;

SELECT 'webhook_failure_queue' AS check_name,
       w.id,
       w.workspaceid,
       w.invoiceid,
       w.paymentid,
       w.sessionid,
       w.provider,
       w.eventid,
       w.idempotencykey,
       w.eventtype,
       w.mappedstatus,
       w.signaturestatus,
       w.processingstatus,
       w.providertransactionid,
       w.amount,
       w.currency,
       w.error,
       w.receivedat
FROM mdlgx_local_prequran_pay_webhook w
WHERE (@workspaceid = 0 OR w.workspaceid = @workspaceid)
  AND w.processingstatus IN ('failed', 'received')
ORDER BY w.receivedat DESC, w.id DESC
LIMIT 100;

SELECT 'hosted_gateway_payments' AS check_name,
       p.id AS paymentid,
       p.workspaceid,
       p.studentid,
       p.billingaccountid,
       p.receiptnumber,
       p.status,
       p.currency,
       p.amount,
       p.reference AS providertransactionid,
       pa.invoiceid,
       i.invoicenumber,
       i.status AS invoice_status,
       i.paidamount,
       i.balancedue,
       p.receivedat
FROM mdlgx_local_prequran_payment p
JOIN mdlgx_local_prequran_payment_alloc pa
  ON pa.paymentid = p.id
JOIN mdlgx_local_prequran_invoice i
  ON i.id = pa.invoiceid
WHERE (@workspaceid = 0 OR p.workspaceid = @workspaceid)
  AND p.paymentmethod = 'hosted_gateway'
ORDER BY p.receivedat DESC, p.id DESC
LIMIT 100;

SELECT 'webhook_audit_events' AS check_name,
       a.workspaceid,
       a.action,
       COUNT(*) AS event_count,
       MAX(a.timecreated) AS last_event
FROM mdlgx_local_prequran_finance_audit a
WHERE (@workspaceid = 0 OR a.workspaceid = @workspaceid)
  AND a.action IN (
      'hosted_payment_session_created',
      'hosted_payment_session_failed',
      'payment_webhook_signature_rejected',
      'payment_webhook_processed',
      'hosted_gateway_payment_recorded',
      'payment_provider_config_saved'
  )
GROUP BY a.workspaceid, a.action
ORDER BY a.workspaceid, a.action;
