-- Phase 31 verification: Teacher Coaching & QA Follow-Up Loop.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Coaching columns.
SHOW COLUMNS FROM mdlgx_local_prequran_live_session LIKE 'qa_coaching%';

-- 2) Coaching indexes.
SHOW INDEX FROM mdlgx_local_prequran_live_session
WHERE Key_name IN ('mdlgx_preq_live_session_qacoach_ix', 'mdlgx_preq_live_session_qacoachby_ix');

-- 3) Open coaching queue.
SELECT
    id,
    title,
    teacherid,
    qa_status,
    qa_score,
    qa_coaching_status,
    qa_coaching_priority,
    FROM_UNIXTIME(NULLIF(qa_coaching_due_date, 0)) AS coaching_due_date,
    qa_coaching_ackby,
    FROM_UNIXTIME(NULLIF(qa_coaching_ackat, 0)) AS coaching_ackat,
    qa_coaching_completedby,
    FROM_UNIXTIME(NULLIF(qa_coaching_completedat, 0)) AS coaching_completedat,
    CASE
        WHEN qa_coaching_status IN ('assigned', 'acknowledged')
             AND qa_coaching_due_date > 0
             AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW())
            THEN 'OVERDUE'
        WHEN qa_coaching_status = 'assigned'
            THEN 'ASSIGNED'
        WHEN qa_coaching_status = 'acknowledged'
            THEN 'ACKNOWLEDGED'
        WHEN qa_coaching_status = 'completed'
            THEN 'COMPLETED'
        ELSE 'NONE'
    END AS coaching_queue_status
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status <> 'none'
ORDER BY
    CASE qa_coaching_status
        WHEN 'assigned' THEN 1
        WHEN 'acknowledged' THEN 2
        WHEN 'completed' THEN 3
        ELSE 4
    END,
    qa_coaching_due_date ASC,
    id DESC
LIMIT 100;

-- 4) Coaching audit rows.
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
    'quality_coaching_assigned',
    'quality_coaching_acknowledged',
    'quality_coaching_completed',
    'quality_coaching_updated'
)
ORDER BY id DESC
LIMIT 100;

-- 5) Coaching metrics.
SELECT 'assigned' AS metric, COUNT(*) AS value
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status = 'assigned'
UNION ALL
SELECT 'acknowledged', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status = 'acknowledged'
UNION ALL
SELECT 'overdue', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status IN ('assigned', 'acknowledged')
  AND qa_coaching_due_date > 0
  AND qa_coaching_due_date < UNIX_TIMESTAMP(NOW())
UNION ALL
SELECT 'completed', COUNT(*)
FROM mdlgx_local_prequran_live_session
WHERE qa_coaching_status = 'completed';
