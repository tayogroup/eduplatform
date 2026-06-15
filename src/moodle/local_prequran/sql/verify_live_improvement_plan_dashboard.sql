-- Phase 39 verification: Teacher Improvement Plan Dashboard & History.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Improvement plan dashboard rows.
SELECT
    s.id,
    s.title,
    s.teacherid,
    s.improvement_plan_status,
    s.improvement_plan_priority,
    s.improvement_plan_mentorid,
    s.qa_status,
    s.qa_score,
    s.leadership_review_status,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_assignedat, 0)) AS assigned_at,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_ackat, 0)) AS acknowledged_at,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_due_date, 0)) AS due_date,
    FROM_UNIXTIME(NULLIF(s.improvement_plan_completedat, 0)) AS completed_at,
    (SELECT COUNT(*)
       FROM mdlgx_local_prequran_live_audit a
      WHERE a.sessionid = s.id
        AND a.action IN (
            'improvement_plan_teacher_reminder_sent',
            'improvement_plan_due_soon_sent',
            'improvement_plan_overdue',
            'improvement_plan_admin_escalated'
        )) AS plan_alert_count
FROM mdlgx_local_prequran_live_session s
WHERE s.improvement_plan_status <> 'none'
ORDER BY
    FIELD(s.improvement_plan_status, 'assigned', 'in_progress', 'completed'),
    FIELD(s.improvement_plan_priority, 'high', 'normal', 'low'),
    s.improvement_plan_due_date ASC,
    s.improvement_plan_assignedat DESC
LIMIT 100;

-- 2) Teacher-level improvement plan history.
SELECT
    s.teacherid,
    COUNT(*) AS plan_count,
    SUM(CASE WHEN s.improvement_plan_status IN ('assigned', 'in_progress') THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN s.improvement_plan_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE
        WHEN s.improvement_plan_status IN ('assigned', 'in_progress')
         AND s.improvement_plan_due_date > 0
         AND s.improvement_plan_due_date < UNIX_TIMESTAMP(NOW())
        THEN 1 ELSE 0 END) AS overdue_count,
    ROUND(AVG(CASE WHEN s.qa_reviewedat > 0 THEN s.qa_score ELSE NULL END), 0) AS avg_qa_score,
    SUM(CASE WHEN s.qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
    SUM(CASE WHEN s.qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count
FROM mdlgx_local_prequran_live_session s
WHERE s.improvement_plan_status <> 'none'
GROUP BY s.teacherid
ORDER BY open_count DESC, overdue_count DESC, plan_count DESC
LIMIT 100;

-- 3) Dashboard metrics.
SELECT 'open_plans' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status IN ('assigned', 'in_progress')
UNION ALL
SELECT 'overdue_plans', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status IN ('assigned', 'in_progress')
  AND improvement_plan_due_date > 0
  AND improvement_plan_due_date < UNIX_TIMESTAMP(NOW())
UNION ALL
SELECT 'completed_plans', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE improvement_plan_status = 'completed'
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

-- 4) Recent improvement plan audit history.
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
    'improvement_plan_assigned',
    'improvement_plan_updated',
    'improvement_plan_acknowledged',
    'improvement_plan_completed',
    'improvement_plan_reopened',
    'improvement_plan_teacher_reminder_sent',
    'improvement_plan_due_soon_sent',
    'improvement_plan_overdue',
    'improvement_plan_admin_escalated'
)
ORDER BY id DESC
LIMIT 100;
