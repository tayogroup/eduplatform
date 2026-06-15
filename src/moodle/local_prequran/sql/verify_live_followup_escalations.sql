-- Phase 27 verification: follow-up reminders and escalation rules.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Open and overdue follow-ups.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.teacherid,
    n.followup_status,
    n.followup_threadid,
    n.followup_resolved,
    FROM_UNIXTIME(NULLIF(n.followup_contactedat, 0)) AS followup_contactedat,
    FROM_UNIXTIME(n.timemodified) AS note_modified,
    CASE
        WHEN COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified) <= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 2 DAY))
        THEN 'OVERDUE'
        ELSE 'OPEN'
    END AS followup_age_status
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
  AND n.followup_resolved = 0
ORDER BY COALESCE(NULLIF(n.followup_contactedat, 0), n.timemodified) ASC
LIMIT 100;

-- 2) Reminder and escalation audit rows.
SELECT
    id,
    sessionid,
    actorid,
    action,
    targettype,
    targetid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'followup_parent_reminder_sent',
    'followup_teacher_reminder_sent',
    'followup_escalated_admin',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Parent replies after follow-up contact.
SELECT
    n.sessionid,
    n.studentid,
    n.followup_threadid,
    p.userid AS parentid,
    m.id AS messageid,
    FROM_UNIXTIME(m.timecreated) AS parent_reply_time,
    LEFT(m.body, 120) AS message_preview
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_comm_message m ON m.threadid = n.followup_threadid
JOIN mdlgx_local_prequran_comm_participant p ON p.threadid = m.threadid AND p.userid = m.senderid
WHERE n.followup_threadid > 0
  AND p.role = 'parent'
  AND m.timecreated > n.followup_contactedat
ORDER BY m.timecreated DESC
LIMIT 50;
