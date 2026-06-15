-- Phase 25 verification: teacher-parent follow-up workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Follow-up columns exist.
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_live_note'
  AND COLUMN_NAME IN (
      'followup_status',
      'followup_message',
      'followup_resolved',
      'followup_resolvedby',
      'followup_resolvedat'
  )
ORDER BY FIELD(
    COLUMN_NAME,
    'followup_status',
    'followup_message',
    'followup_resolved',
    'followup_resolvedby',
    'followup_resolvedat'
);

-- 2) Current unresolved teacher-parent follow-up queue.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.teacherid,
    n.followup_status,
    n.followup_message,
    n.homework,
    n.homework_unitid,
    n.homework_priority,
    FROM_UNIXTIME(NULLIF(n.homework_due_date, 0)) AS homework_due_date,
    FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.followup_status <> 'none'
  AND n.followup_resolved = 0
ORDER BY
    CASE n.followup_status
        WHEN 'admin_support_requested' THEN 1
        WHEN 'parent_contact_requested' THEN 2
        WHEN 'review_homework' THEN 3
        ELSE 4
    END,
    n.timemodified DESC
LIMIT 50;

-- 3) Parent-visible follow-up and homework details.
SELECT
    n.sessionid,
    s.title,
    n.studentid,
    n.visible_to_parent,
    n.parent_summary,
    n.homework,
    n.homework_lessonid,
    n.homework_unitid,
    n.homework_priority,
    FROM_UNIXTIME(NULLIF(n.homework_due_date, 0)) AS homework_due_date,
    n.followup_status,
    n.followup_message,
    n.followup_resolved
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s ON s.id = n.sessionid
WHERE n.visible_to_parent = 1
ORDER BY n.timemodified DESC
LIMIT 50;

-- 4) Follow-up audit trail.
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
    'homework_published',
    'parent_followup_requested',
    'admin_followup_requested',
    'followup_resolved',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;
