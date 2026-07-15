-- Phase 7 verification: live chat near-real-time polish.
-- Run after Moodle upgrade/cache purge. Replace the mdlgx_ prefix if your site uses a different one.

SELECT 'support_phase7_service' AS check_name, name, classname, methodname, classpath, component
FROM mdlgx_external_functions
WHERE name = 'local_prequran_support_live_poll';

SELECT 'support_phase7_version' AS check_name, plugin, version
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name = 'version';

SELECT 'support_phase7_signal_events_24h' AS check_name, eventtype, COUNT(*) AS total
FROM mdlgx_local_prequran_support_event
WHERE eventtype IN ('support_viewing', 'support_typing')
  AND timecreated >= UNIX_TIMESTAMP() - 86400
GROUP BY eventtype;

SELECT 'support_phase7_active_conversations' AS check_name, type, status, COUNT(*) AS total
FROM mdlgx_local_prequran_comm_thread
WHERE type IN ('student_helpdesk', 'student_teacher', 'parent_teacher')
GROUP BY type, status
ORDER BY type, status;

SELECT 'support_phase7_unread_readiness' AS check_name, COUNT(*) AS participant_rows
FROM mdlgx_local_prequran_comm_participant p
JOIN mdlgx_local_prequran_comm_thread t ON t.id = p.threadid
WHERE t.type IN ('student_helpdesk', 'student_teacher', 'parent_teacher');
