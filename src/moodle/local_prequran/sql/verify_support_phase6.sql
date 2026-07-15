-- Phase 6 support reports/search/quality verification.
-- Select the Moodle database first, then run. Replace mdlgx_ if your table prefix differs.

SELECT 'support_phase6_service' AS check_name, name, classname, methodname, classpath, component
FROM mdlgx_external_functions
WHERE name IN (
    'local_prequran_support_search',
    'local_prequran_support_reports',
    'local_prequran_support_export_csv',
    'local_prequran_support_rate_ticket',
    'local_prequran_support_quality_queue',
    'local_prequran_support_quality_review'
)
ORDER BY name;

SELECT 'support_report_counts' AS check_name,
       COUNT(*) AS total_tickets,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS open_tickets,
       SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved_tickets,
       SUM(CASE WHEN sla_resolution_due > 0 AND sla_resolution_due < UNIX_TIMESTAMP() AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS breached_open_tickets
FROM mdlgx_local_prequran_support_ticket;

SELECT 'support_by_status' AS check_name, status, COUNT(*) AS ticket_count
FROM mdlgx_local_prequran_support_ticket
GROUP BY status
ORDER BY status;

SELECT 'support_by_priority' AS check_name, priority, COUNT(*) AS ticket_count
FROM mdlgx_local_prequran_support_ticket
GROUP BY priority
ORDER BY FIELD(priority, 'urgent', 'high', 'normal', 'low'), priority;

SELECT 'support_quality_events' AS check_name, eventtype, COUNT(*) AS event_count
FROM mdlgx_local_prequran_support_event
WHERE eventtype IN ('satisfaction_rating', 'quality_review', 'message_reported', 'sla_breached')
GROUP BY eventtype
ORDER BY eventtype;

SELECT 'support_low_rating_queue' AS check_name, COUNT(DISTINCT t.id) AS ticket_count
FROM mdlgx_local_prequran_support_ticket t
JOIN mdlgx_local_prequran_support_event e ON e.ticketid = t.id
WHERE e.eventtype = 'satisfaction_rating'
  AND CAST(e.newvalue AS UNSIGNED) <= 2;

SELECT 'support_search_readiness' AS check_name,
       (SELECT COUNT(*) FROM mdlgx_local_prequran_comm_message WHERE ticketid > 0) AS linked_ticket_messages,
       (SELECT COUNT(*) FROM mdlgx_local_prequran_comm_thread WHERE linkedticketid > 0) AS linked_ticket_threads;
