-- Phase 36 verification: Leadership Review Dashboard & Case Management.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Leadership case counts.
SELECT 'open_cases' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status IN ('flagged', 'in_review')
UNION ALL
SELECT 'flagged', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status = 'flagged'
UNION ALL
SELECT 'in_review', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status = 'in_review'
UNION ALL
SELECT 'cleared', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status = 'cleared';

-- 2) Current leadership case queue.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    qa_coaching_status,
    FROM_UNIXTIME(NULLIF(qa_coaching_due_date, 0)) AS qa_coaching_due_date,
    leadership_review_status,
    leadership_review_reason,
    leadership_review_notes,
    leadership_reviewby,
    FROM_UNIXTIME(NULLIF(leadership_reviewat, 0)) AS leadership_reviewat,
    leadership_clearedby,
    FROM_UNIXTIME(NULLIF(leadership_clearedat, 0)) AS leadership_clearedat
FROM mdlgx_local_prequran_live_session
WHERE leadership_review_status IN ('flagged', 'in_review', 'cleared')
ORDER BY
    CASE leadership_review_status
        WHEN 'flagged' THEN 1
        WHEN 'in_review' THEN 2
        WHEN 'cleared' THEN 3
        ELSE 4
    END,
    leadership_reviewat DESC,
    scheduled_start DESC
LIMIT 100;

-- 3) Dashboard update audit rows.
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
    'leadership_review_flagged',
    'leadership_review_updated',
    'leadership_review_cleared'
)
ORDER BY id DESC
LIMIT 100;
