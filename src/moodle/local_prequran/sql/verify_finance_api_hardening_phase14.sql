-- Phase 14 verification for finance APIs, hardening, and scale controls.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is phpMyAdmin friendly and does not use named placeholders.

SELECT 'phase14_tables' AS check_name,
       CASE WHEN COUNT(*) = 2 THEN 'ready' ELSE 'missing_tables' END AS status,
       COUNT(*) AS found_table_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'mdlgx_local_prequran_finance_api',
      'mdlgx_local_prequran_finance_scale'
  );

SELECT 'finance_api_services' AS check_name,
       COUNT(*) AS registered_function_count,
       CASE WHEN COUNT(*) = 3 THEN 'ready' ELSE 'missing_service_registration' END AS status
FROM mdlgx_external_functions
WHERE name IN (
      'local_prequran_finance_summary',
      'local_prequran_finance_invoice_action',
      'local_prequran_finance_hardening_status'
);

SELECT 'finance_api_hardening_task' AS check_name,
       COUNT(*) AS registered_task_count,
       CASE WHEN COUNT(*) >= 1 THEN 'ready' ELSE 'missing_task_registration' END AS status
FROM mdlgx_task_scheduled
WHERE classname = '\\local_prequran\\task\\finance_api_hardening';

SELECT id,
       workspaceid,
       actorid,
       endpoint,
       idempotencykey,
       idempotencyhash,
       status,
       responseid,
       FROM_UNIXTIME(timecreated) AS created_at,
       error
FROM mdlgx_local_prequran_finance_api
ORDER BY timecreated DESC, id DESC
LIMIT 100;

SELECT workspaceid,
       endpoint,
       actorid,
       COUNT(*) AS request_count_last_hour
FROM mdlgx_local_prequran_finance_api
WHERE timecreated >= UNIX_TIMESTAMP() - 3600
GROUP BY workspaceid, endpoint, actorid
ORDER BY request_count_last_hour DESC
LIMIT 100;

SELECT 'duplicate_completed_idempotency_keys' AS exception_check,
       workspaceid,
       endpoint,
       idempotencyhash,
       COUNT(*) AS duplicate_count
FROM mdlgx_local_prequran_finance_api
WHERE idempotencyhash <> ''
  AND status = 'completed'
GROUP BY workspaceid, endpoint, idempotencyhash
HAVING COUNT(*) > 1;

SELECT id,
       workspaceid,
       snapshotkey,
       status,
       FROM_UNIXTIME(checkedat) AS checked_at,
       metricsjson,
       warningsjson
FROM mdlgx_local_prequran_finance_scale
ORDER BY checkedat DESC, id DESC
LIMIT 100;

SELECT 'phase14_audit_events' AS check_name,
       COUNT(*) AS audit_event_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No finance hardening audit events yet.'
           ELSE 'Finance hardening audit events exist.'
       END AS interpretation
FROM mdlgx_local_prequran_finance_audit
WHERE action = 'finance_hardening_snapshot_refreshed';
