-- Phase 35 verification: automated leadership QA alerts.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Automatically flagged leadership review sessions.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    qa_coaching_status,
    leadership_review_status,
    leadership_review_reason,
    FROM_UNIXTIME(NULLIF(leadership_reviewat, 0)) AS leadership_reviewat
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status IN ('flagged', 'in_review')
ORDER BY leadership_reviewat DESC, id DESC
LIMIT 50;

-- 2) Automation audit rows.
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
    'leadership_review_auto_flagged',
    'leadership_review_auto_skipped',
    'leadership_review_admin_notified',
    'notification_sent',
    'notification_failed',
    'notification_skipped'
)
ORDER BY id DESC
LIMIT 100;

-- 3) Serious QA issues that should be auto-flagged.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    leadership_review_status
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status = 'serious_issue'
  AND qa_reviewedat > 0
ORDER BY qa_reviewedat DESC, id DESC
LIMIT 50;

-- 4) Overdue coaching items that should be auto-flagged.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    qa_coaching_status,
    FROM_UNIXTIME(NULLIF(qa_coaching_due_date, 0)) AS qa_coaching_due_date,
    leadership_review_status
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_coaching_status IN ('assigned', 'acknowledged')
  AND qa_coaching_due_date > 0
  AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW())
ORDER BY qa_coaching_due_date ASC, id DESC
LIMIT 50;

-- 5) Teacher patterns that should produce leadership alerts.
SELECT
    teacherid,
    COUNT(*) AS reviewed_sessions,
    ROUND(AVG(qa_score), 0) AS avg_score,
    SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
    SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
    CASE
        WHEN SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) > 0 THEN 'SERIOUS_ISSUE'
        WHEN ROUND(AVG(qa_score), 0) < 75 AND COUNT(*) >= 2
             AND SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) >= 2 THEN 'LOW_SCORE_AND_REPEATED_COACHING'
        WHEN ROUND(AVG(qa_score), 0) < 75 AND COUNT(*) >= 2 THEN 'LOW_SCORE_TREND'
        WHEN SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) >= 2 THEN 'REPEATED_COACHING'
        ELSE 'OK'
    END AS alert_pattern
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status <> 'not_reviewed'
  AND qa_reviewedat > 0
  AND scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))
GROUP BY teacherid
HAVING alert_pattern <> 'OK'
ORDER BY serious_issue_count DESC, avg_score ASC, needs_coaching_count DESC
LIMIT 50;
