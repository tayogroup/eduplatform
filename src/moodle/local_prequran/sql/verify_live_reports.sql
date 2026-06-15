-- Phase 21 verification: admin live reporting.
-- Replace mdlgx_ with your Moodle table prefix if needed.

SELECT
    COUNT(*) AS total_sessions,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,
    SUM(CASE WHEN status = 'awaiting_review' THEN 1 ELSE 0 END) AS awaiting_review_sessions,
    SUM(CASE WHEN status = 'needs_review' THEN 1 ELSE 0 END) AS legacy_needs_review_sessions
FROM mdlgx_local_prequran_live_session;

SELECT
    s.teacherid,
    COUNT(*) AS session_count,
    COUNT(DISTINCT p.studentid) AS distinct_students,
    COUNT(DISTINCT a.id) AS attendance_rows,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
    COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS parent_visible_recordings
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
       ON a.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
GROUP BY s.teacherid
ORDER BY session_count DESC
LIMIT 50;

SELECT
    action,
    COUNT(*) AS audit_count,
    MAX(FROM_UNIXTIME(timecreated)) AS latest_time
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'schedule_conflict_blocked',
    'schedule_conflict_override',
    'notification_sent',
    'notification_failed',
    'notification_skipped',
    'calendar_downloaded',
    'session_awaiting_review',
    'session_completed',
    'series_created'
)
GROUP BY action
ORDER BY audit_count DESC, action ASC;
