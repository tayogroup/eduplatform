-- Phase 48 verification: parent-facing recurring series schedule.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Parent/student recurring series schedule rows.
SELECT
    s.seriesid,
    s.series_sequence,
    s.id AS sessionid,
    s.title,
    p.studentid,
    s.teacherid,
    s.lessonid,
    s.unitid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    s.cancellation_reason,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
    COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' THEN r.id END) AS parent_visible_recordings
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_note n
       ON n.sessionid = s.id
      AND n.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_recording r
       ON r.sessionid = s.id
WHERE s.seriesid > 0
GROUP BY
    s.seriesid,
    s.series_sequence,
    s.id,
    s.title,
    p.studentid,
    s.teacherid,
    s.lessonid,
    s.unitid,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    s.cancellation_reason
ORDER BY s.seriesid DESC, s.series_sequence ASC
LIMIT 100;

-- 2) Parent-safe series change history source rows.
SELECT
    id,
    sessionid,
    actorid,
    action,
    targettype,
    targetid AS seriesid,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE targettype = 'series'
  AND action IN (
      'series_updated',
      'series_session_updated',
      'series_single_session_cancelled',
      'series_cancelled',
      'session_cancelled',
      'series_change_notifications_processed',
      'series_cancel_notifications_processed',
      'series_single_session_cancel_notifications_processed'
  )
ORDER BY id DESC
LIMIT 100;

