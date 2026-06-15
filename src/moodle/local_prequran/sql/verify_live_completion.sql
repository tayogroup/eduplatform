-- Phase 15 verification: live session completion workflow.
-- Replace mdlgx_ with your Moodle table prefix if needed.

SELECT
    s.id,
    s.title,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    s.cancelledby,
    s.cancellation_reason,
    COUNT(DISTINCT p.id) AS active_students,
    COUNT(DISTINCT a.id) AS attendance_rows,
    COUNT(DISTINCT CASE
        WHEN n.visible_to_parent = 1
         AND TRIM(CONCAT(
             COALESCE(n.strengths, ''),
             COALESCE(n.needs_practice, ''),
             COALESCE(n.homework, ''),
             COALESCE(n.parent_summary, '')
         )) <> ''
        THEN n.id
    END) AS parent_ready_summaries,
    CASE
        WHEN COUNT(DISTINCT p.id) > 0
         AND COUNT(DISTINCT a.id) >= COUNT(DISTINCT p.id)
         AND COUNT(DISTINCT CASE
             WHEN n.visible_to_parent = 1
              AND TRIM(CONCAT(
                  COALESCE(n.strengths, ''),
                  COALESCE(n.needs_practice, ''),
                  COALESCE(n.homework, ''),
                  COALESCE(n.parent_summary, '')
              )) <> ''
             THEN n.id
         END) >= COUNT(DISTINCT p.id)
        THEN 'READY_TO_COMPLETE'
        ELSE 'NEEDS_REVIEW'
    END AS completion_readiness
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
      AND a.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
      AND n.studentid = p.studentid
GROUP BY
    s.id,
    s.title,
    s.teacherid,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    s.cancelledby,
    s.cancellation_reason
ORDER BY s.id DESC
LIMIT 25;

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
    'review_saved',
    'session_completed',
    'session_completion_blocked',
    'session_cancelled',
    'session_rescheduled'
)
ORDER BY id DESC
LIMIT 50;
