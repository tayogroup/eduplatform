-- Phase 1 verification: Live chat/help desk support schema, settings, and capability foundation.
-- Replace mdlgx_ with your Moodle database prefix if different.

-- 1) Required support tables.
SELECT 'table_exists' AS check_name, table_name
FROM information_schema.tables
WHERE table_name IN (
    'mdlgx_local_prequran_support_policy',
    'mdlgx_local_prequran_support_queue',
    'mdlgx_local_prequran_support_sla',
    'mdlgx_local_prequran_support_canned',
    'mdlgx_local_prequran_support_ticket',
    'mdlgx_local_prequran_support_event',
    'mdlgx_local_prequran_support_audit'
)
ORDER BY table_name;

-- 2) Support fields added to communication thread/message records.
SELECT 'comm_thread_field' AS check_name, column_name
FROM information_schema.columns
WHERE table_name = 'mdlgx_local_prequran_comm_thread'
  AND column_name IN (
      'linkedticketid',
      'support_category',
      'support_priority',
      'assignedto',
      'assignmentgroupid',
      'visibility',
      'contextjson'
  )
ORDER BY column_name;

SELECT 'comm_message_field' AS check_name, column_name
FROM information_schema.columns
WHERE table_name = 'mdlgx_local_prequran_comm_message'
  AND column_name IN ('senderrole', 'visibility', 'ticketid')
ORDER BY column_name;

-- 3) Support capability definitions should appear after Moodle upgrade caches capabilities.
-- If phpMyAdmin reports "Unknown table ... in information_schema", select the
-- Moodle database first. Do not run a placeholder such as
-- your_moodle_database.mdlgx_capabilities unless you replace it with the real
-- database name shown in phpMyAdmin.
SELECT 'capability_table_exists' AS check_name, table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'mdlgx_capabilities'
ORDER BY table_schema;

SELECT 'support_capability' AS check_name, name
FROM mdlgx_capabilities
WHERE name LIKE 'local/prequran:support%'
ORDER BY name;

-- 4) Platform support defaults. Existing sites should remain conservative/off by default.
SELECT 'support_config' AS check_name, name, value
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name IN (
      'support_livechat_enabled',
      'support_async_enabled',
      'support_student_helpdesk_enabled',
      'support_student_teacher_enabled',
      'support_parent_teacher_enabled',
      'support_student_free_text_policy',
      'support_parent_visible_default',
      'support_business_timezone',
      'support_retention_days'
  )
ORDER BY name;

-- 5) Empty-table readiness counts for a fresh Phase 1 foundation.
SELECT 'support_policy_count' AS check_name, COUNT(*) AS record_count FROM mdlgx_local_prequran_support_policy
UNION ALL SELECT 'support_queue_count', COUNT(*) FROM mdlgx_local_prequran_support_queue
UNION ALL SELECT 'support_sla_count', COUNT(*) FROM mdlgx_local_prequran_support_sla
UNION ALL SELECT 'support_canned_count', COUNT(*) FROM mdlgx_local_prequran_support_canned
UNION ALL SELECT 'support_ticket_count', COUNT(*) FROM mdlgx_local_prequran_support_ticket
UNION ALL SELECT 'support_event_count', COUNT(*) FROM mdlgx_local_prequran_support_event
UNION ALL SELECT 'support_audit_count', COUNT(*) FROM mdlgx_local_prequran_support_audit;
