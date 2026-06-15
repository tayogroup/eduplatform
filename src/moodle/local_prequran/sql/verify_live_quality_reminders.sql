-- Phase 32 verification: automated QA and coaching reminders.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Sessions that should be picked up by the QA review reminder.
SELECT
    id,
    title,
    teacherid,
    status,
    qa_status,
    qa_reviewedat,
    FROM_UNIXTIME(scheduled_end) AS scheduled_end
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND scheduled_end < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY))
  AND scheduled_end >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 14 DAY))
  AND (qa_status = 'not_reviewed' OR qa_reviewedat = 0)
ORDER BY scheduled_end ASC, id ASC
LIMIT 50;

-- 2) Active coaching assignments that should receive teacher/admin reminders.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    qa_coaching_status,
    qa_coaching_priority,
    FROM_UNIXTIME(NULLIF(qa_coaching_due_date, 0)) AS qa_coaching_due_date,
    CASE
        WHEN qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 'OVERDUE'
        WHEN qa_coaching_due_date > 0 AND qa_coaching_due_date <= UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 1 DAY)) THEN 'DUE_SOON'
        ELSE 'OPEN'
    END AS reminder_status
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status IN ('assigned', 'acknowledged')
ORDER BY qa_coaching_due_date ASC, qa_reviewedat DESC, id DESC
LIMIT 100;

-- 3) QA/coaching reminder audit rows created by cron.
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
    'quality_review_reminder_sent',
    'quality_coaching_teacher_reminder_sent',
    'quality_coaching_admin_escalated',
    'quality_coaching_overdue',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 4) Operations dashboard reminder metric.
SELECT 'quality_reminders_7_days' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'quality_review_reminder_sent',
    'quality_coaching_teacher_reminder_sent',
    'quality_coaching_admin_escalated',
    'quality_coaching_overdue'
)
AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
