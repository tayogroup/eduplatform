-- Phase 4 support ticket workflow verification.
-- Select the Moodle database first, then run. Replace mdlgx_ if your table prefix differs.

SELECT 'support_ticket_service' AS check_name, name, classname, methodname, classpath, component
FROM mdlgx_external_functions
WHERE name IN (
    'local_prequran_support_convert_to_ticket',
    'local_prequran_support_update_ticket',
    'local_prequran_support_list_tickets',
    'local_prequran_support_get_ticket'
)
ORDER BY name;

SELECT 'support_ticket_table' AS check_name, table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'mdlgx_local_prequran_support_ticket',
    'mdlgx_local_prequran_support_event'
)
ORDER BY table_name;

SELECT 'support_ticket_columns' AS check_name, table_name, column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN (
    'mdlgx_local_prequran_support_ticket',
    'mdlgx_local_prequran_support_event',
    'mdlgx_local_prequran_comm_thread',
    'mdlgx_local_prequran_comm_message'
  )
  AND column_name IN (
    'ticketnumber',
    'sourceconversationid',
    'status',
    'priority',
    'category',
    'assigneeid',
    'assignmentgroupid',
    'sla_resolution_due',
    'linkedticketid',
    'ticketid',
    'eventtype'
  )
ORDER BY table_name, column_name;

SELECT 'support_ticket_status_counts' AS check_name, status, COUNT(*) AS record_count
FROM mdlgx_local_prequran_support_ticket
GROUP BY status
ORDER BY status;

SELECT 'support_ticket_link_check' AS check_name,
       COUNT(*) AS linked_conversations
FROM mdlgx_local_prequran_comm_thread
WHERE linkedticketid > 0;
