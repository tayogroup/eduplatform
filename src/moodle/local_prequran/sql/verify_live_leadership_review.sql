-- Phase 34 verification: QA alerts and leadership review workflow.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Leadership review columns.
SHOW COLUMNS FROM mdlgx_local_prequran_live_session LIKE 'leadership_%';

-- 2) Leadership review indexes.
SHOW INDEX FROM mdlgx_local_prequran_live_session
WHERE Key_name IN ('mdlgx_preq_live_session_leadstatus_ix', 'mdlgx_preq_live_session_leadby_ix');

-- 3) Open leadership review queue.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    qa_coaching_status,
    leadership_review_status,
    leadership_review_reason,
    FROM_UNIXTIME(NULLIF(leadership_reviewat, 0)) AS leadership_reviewat,
    FROM_UNIXTIME(NULLIF(leadership_clearedat, 0)) AS leadership_clearedat
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status IN ('flagged', 'in_review')
ORDER BY leadership_reviewat DESC, id DESC
LIMIT 50;

-- 4) Teachers with automatic leadership-alert patterns in the last 90 days.
SELECT
    teacherid,
    COUNT(*) AS reviewed_sessions,
    ROUND(AVG(qa_score), 0) AS avg_score,
    SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) AS needs_coaching_count,
    SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) AS serious_issue_count,
    SUM(CASE WHEN qa_coaching_status IN ('assigned', 'acknowledged') AND qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) AS coaching_overdue_count,
    CASE
        WHEN SUM(CASE WHEN qa_status = 'serious_issue' THEN 1 ELSE 0 END) > 0 THEN 'SERIOUS_ISSUE'
        WHEN ROUND(AVG(qa_score), 0) < 75 AND COUNT(*) >= 2 THEN 'LOW_SCORE_TREND'
        WHEN SUM(CASE WHEN qa_status = 'needs_coaching' THEN 1 ELSE 0 END) >= 2 THEN 'REPEATED_COACHING'
        WHEN SUM(CASE WHEN qa_coaching_status IN ('assigned', 'acknowledged') AND qa_coaching_due_date > 0 AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW()) THEN 1 ELSE 0 END) > 0 THEN 'OVERDUE_COACHING'
        ELSE 'OK'
    END AS leadership_alert
FROM mdlgx_local_prequran_live_session
WHERE status <> 'cancelled'
  AND qa_status <> 'not_reviewed'
  AND qa_reviewedat > 0
  AND scheduled_start >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))
GROUP BY teacherid
HAVING leadership_alert <> 'OK'
ORDER BY serious_issue_count DESC, avg_score ASC, needs_coaching_count DESC
LIMIT 50;

-- 5) Leadership audit rows.
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
WHERE action IN ('leadership_review_flagged', 'leadership_review_updated', 'leadership_review_cleared')
ORDER BY id DESC
LIMIT 100;
