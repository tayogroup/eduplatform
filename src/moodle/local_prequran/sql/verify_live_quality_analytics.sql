-- Phase 33 verification: QA analytics and teacher performance trends.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Overall QA metrics for recent live sessions.
SELECT
    COUNT(*) AS total_sessions,
    SUM(CASE WHEN qa_status <> 'not_reviewed' AND qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_sessions,
    ROUND(AVG(CASE WHEN qa_status <> 'not_reviewed' AND qa_reviewedat > 0 THEN qa_score ELSE NULL END), 0) AS average_qa_score,
    SUM(CASE WHEN qa_status = 'passed' THEN 1 ELSE 0 END) AS passed_sessions,
    SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_sessions,
    SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_sessions,
    SUM(CASE WHEN qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open,
    SUM(CASE WHEN qa_coaching_status = 'completed' THEN 1 ELSE 0 END) AS coaching_completed,
    SUM(CASE WHEN qa_coaching_status IN ('assigned', 'acknowledged') AND qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) AS coaching_overdue
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY));

-- 2) Teacher QA trend rows.
SELECT
    teacherid,
    COUNT(*) AS session_count,
    SUM(CASE WHEN qa_status <> 'not_reviewed' AND qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_count,
    ROUND(AVG(CASE WHEN qa_status <> 'not_reviewed' AND qa_reviewedat > 0 THEN qa_score ELSE NULL END), 0) AS avg_score,
    SUM(CASE WHEN qa_status = 'passed' THEN 1 ELSE 0 END) AS passed_count,
    SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
    SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
    SUM(CASE WHEN qa_coaching_status IN ('assigned', 'acknowledged') THEN 1 ELSE 0 END) AS coaching_open_count,
    SUM(CASE WHEN qa_coaching_status = 'completed' THEN 1 ELSE 0 END) AS coaching_completed_count,
    SUM(CASE WHEN qa_coaching_status IN ('assigned', 'acknowledged') AND qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) AS coaching_overdue_count
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))
GROUP BY teacherid
ORDER BY avg_score ASC, serious_issue_count DESC, needs_coaching_count DESC, session_count DESC
LIMIT 50;

-- 3) Monthly QA trend.
SELECT
    DATE_FORMAT(FROM_UNIXTIME(scheduled_start), '%Y-%m') AS qa_month,
    COUNT(*) AS session_count,
    SUM(CASE WHEN qa_status <> 'not_reviewed' AND qa_reviewedat > 0 THEN 1 ELSE 0 END) AS reviewed_count,
    ROUND(AVG(CASE WHEN qa_status <> 'not_reviewed' AND qa_reviewedat > 0 THEN qa_score ELSE NULL END), 0) AS avg_score,
    SUM(CASE WHEN qa_status IN ('needs_coaching', 'serious_issue') THEN 1 ELSE 0 END) AS issue_count
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 12 MONTH))
GROUP BY DATE_FORMAT(FROM_UNIXTIME(scheduled_start), '%Y-%m')
ORDER BY qa_month DESC
LIMIT 24;

-- 4) Sessions needing leadership attention.
SELECT
    id,
    title,
    teacherid,
    FROM_UNIXTIME(scheduled_start) AS scheduled_start,
    qa_status,
    qa_score,
    qa_coaching_status,
    qa_coaching_priority,
    FROM_UNIXTIME(NULLIF(qa_coaching_due_date, 0)) AS qa_coaching_due_date
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))
  AND (
      qa_status IN ('needs_coaching', 'serious_issue')
      OR qa_score < 75
      OR (qa_coaching_status IN ('assigned', 'acknowledged') AND qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()))
  )
ORDER BY
    CASE
        WHEN qa_status = 'serious_issue' THEN 1
        WHEN qa_coaching_status IN ('assigned', 'acknowledged') AND qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 2
        ELSE 3
    END,
    qa_score ASC,
    scheduled_start DESC
LIMIT 50;
