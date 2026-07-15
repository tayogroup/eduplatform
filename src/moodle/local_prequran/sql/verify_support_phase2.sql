-- Phase 2 verification: asynchronous support conversation web services.
-- Replace mdlgx_ with your Moodle database prefix if different.

-- 1) Phase 2 service definitions should be registered after Moodle upgrade.
-- Moodle stores type/ajax in db/services.php, but many Moodle versions do not
-- persist those values as external_functions columns.
SELECT 'support_service' AS check_name, name, classname, methodname, classpath, component
FROM mdlgx_external_functions
WHERE name IN (
    'local_prequran_support_start_conversation',
    'local_prequran_support_send_message',
    'local_prequran_support_mark_read',
    'local_prequran_support_list_conversations',
    'local_prequran_support_get_conversation'
)
ORDER BY name;

-- 2) Support conversation thread types created by Phase 2 APIs.
SELECT 'support_conversation_type' AS check_name,
       type,
       status,
       COUNT(*) AS conversation_count
FROM mdlgx_local_prequran_comm_thread
WHERE type IN ('student_helpdesk', 'student_teacher', 'parent_teacher')
  AND support_category IS NOT NULL
GROUP BY type, status
ORDER BY type, status;

-- 3) Participant/read-marker readiness for support conversations.
SELECT 'support_participants' AS check_name,
       t.type,
       p.role,
       p.canreply,
       COUNT(*) AS participant_count
FROM mdlgx_local_prequran_comm_thread t
JOIN mdlgx_local_prequran_comm_participant p ON p.threadid = t.id
WHERE t.type IN ('student_helpdesk', 'student_teacher', 'parent_teacher')
  AND t.support_category IS NOT NULL
GROUP BY t.type, p.role, p.canreply
ORDER BY t.type, p.role, p.canreply;

-- 4) Message visibility/ticket-link fields used by Phase 2.
SELECT 'support_messages' AS check_name,
       t.type,
       m.visibility,
       m.status,
       COUNT(*) AS message_count
FROM mdlgx_local_prequran_comm_thread t
JOIN mdlgx_local_prequran_comm_message m ON m.threadid = t.id
WHERE t.type IN ('student_helpdesk', 'student_teacher', 'parent_teacher')
  AND t.support_category IS NOT NULL
GROUP BY t.type, m.visibility, m.status
ORDER BY t.type, m.visibility, m.status;

-- 5) Support audit events written by Phase 2.
SELECT 'support_audit' AS check_name,
       action,
       COUNT(*) AS event_count,
       MAX(timecreated) AS last_event_at
FROM mdlgx_local_prequran_support_audit
WHERE action IN ('conversation_created', 'message_created')
GROUP BY action
ORDER BY action;
