-- Phase 5 support operations verification.
-- Select the Moodle database first, then run. Replace mdlgx_ if your table prefix differs.

SELECT 'support_phase5_service' AS check_name, name, classname, methodname, classpath, component
FROM mdlgx_external_functions
WHERE name IN (
    'local_prequran_support_list_queues',
    'local_prequran_support_refresh_sla',
    'local_prequran_support_route_ticket',
    'local_prequran_support_list_canned_responses',
    'local_prequran_support_save_canned_response',
    'local_prequran_support_send_canned_reply',
    'local_prequran_support_supervisor_summary'
)
ORDER BY name;

SELECT 'support_scheduled_task' AS check_name, classname, minute, hour, disabled
FROM mdlgx_task_scheduled
WHERE classname = '\\local_prequran\\task\\support_sla_monitor';

SELECT 'support_queue_seed' AS check_name, queuekey, name, category, restricted, status
FROM mdlgx_local_prequran_support_queue
WHERE workspaceid = 0
ORDER BY queuekey;

SELECT 'support_sla_seed' AS check_name, priority, first_response_minutes, next_response_minutes, resolution_minutes, breach_warning_minutes, status
FROM mdlgx_local_prequran_support_sla
WHERE workspaceid = 0 AND category = 'other'
ORDER BY FIELD(priority, 'urgent', 'high', 'normal', 'low'), priority;

SELECT 'support_canned_seed' AS check_name, responsekey, title, category, restricted, status
FROM mdlgx_local_prequran_support_canned
WHERE workspaceid = 0
ORDER BY responsekey;

SELECT 'support_sla_risk_counts' AS check_name,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS open_count,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') AND assigneeid = 0 THEN 1 ELSE 0 END) AS unassigned_count,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') AND sla_resolution_due > 0 AND sla_resolution_due < UNIX_TIMESTAMP() THEN 1 ELSE 0 END) AS breached_count,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') AND sla_resolution_due BETWEEN UNIX_TIMESTAMP() AND UNIX_TIMESTAMP() + 7200 THEN 1 ELSE 0 END) AS at_risk_count
FROM mdlgx_local_prequran_support_ticket;

SELECT 'support_sla_events' AS check_name, eventtype, COUNT(*) AS event_count
FROM mdlgx_local_prequran_support_event
WHERE eventtype IN ('sla_warning', 'sla_breached', 'sla_escalated', 'sla_refreshed', 'routed', 'canned_response_used')
GROUP BY eventtype
ORDER BY eventtype;
