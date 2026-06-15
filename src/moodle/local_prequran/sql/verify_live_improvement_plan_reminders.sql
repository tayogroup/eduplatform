-- Phase 38 verification: Automated Improvement Plan Reminders & Escalations.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Active improvement plans and automation readiness.
SELECT
    id,
    title,
    teacherid,
    improvement_plan_status,
    improvement_plan_priority,
    improvement_plan_mentorid,
    FROM_UNIXTIME(NULLIF(improvement_plan_assignedat, 0)) AS assigned_at,
    FROM_UNIXTIME(NULLIF(improvement_plan_ackat, 0)) AS acknowledged_at,
    FROM_UNIXTIME(NULLIF(improvement_plan_due_date, 0)) AS due_date,
    CASE
        WHEN improvement_plan_status = 'assigned'
             AND improvement_plan_ackat = 0
             AND improvement_plan_assignedat > 0
             AND improvement_plan_assignedat <= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY))
            THEN 'ACK_REMINDER_READY'
        WHEN improvement_plan_due_date > 0
             AND improvement_plan_due_date BETWEEN UNIX_TIMESTAMP(NOW()) AND UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 1 DAY))
            THEN 'DUE_SOON_READY'
        WHEN improvement_plan_due_date > 0
             AND improvement_plan_due_date < UNIX_TIMESTAMP(NOW())
            THEN 'OVERDUE'
        ELSE 'NO_AUTOMATION_DUE'
    END AS automation_status
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status IN ('assigned', 'in_progress')
ORDER BY improvement_plan_due_date ASC, improvement_plan_assignedat DESC
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
    'improvement_plan_teacher_reminder_sent',
    'improvement_plan_due_soon_sent',
    'improvement_plan_overdue',
    'improvement_plan_admin_escalated',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Current improvement automation metrics.
SELECT 'open_improvement_plans' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status IN ('assigned', 'in_progress')
UNION ALL
SELECT 'overdue_improvement_plans', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status IN ('assigned', 'in_progress')
  AND improvement_plan_due_date > 0
  AND improvement_plan_due_date < UNIX_TIMESTAMP(NOW())
UNION ALL
SELECT 'plan_alerts_7_days', COUNT(*)
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'improvement_plan_teacher_reminder_sent',
    'improvement_plan_due_soon_sent',
    'improvement_plan_overdue',
    'improvement_plan_admin_escalated'
)
  AND timecreated >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY));
