-- Phase 46 verification: recurring class series management polish.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Series health and derived operational status.
SELECT
    se.id AS seriesid,
    se.title,
    se.teacherid,
    se.lessonid,
    se.unitid,
    se.status AS stored_status,
    COUNT(s.id) AS generated_sessions,
    SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
    SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,
    SUM(CASE WHEN s.scheduled_start >= UNIX_TIMESTAMP(NOW()) AND s.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) AS future_active_sessions,
    MIN(FROM_UNIXTIME(s.scheduled_start)) AS first_session,
    MAX(FROM_UNIXTIME(s.scheduled_start)) AS last_session,
    FROM_UNIXTIME(se.timemodified) AS series_modified
FROM mdlgx_local_prequran_live_series se
LEFT JOIN mdlgx_local_prequran_live_session s
       ON s.seriesid = se.id
GROUP BY
    se.id,
    se.title,
    se.teacherid,
    se.lessonid,
    se.unitid,
    se.status,
    se.timemodified
ORDER BY se.id DESC
LIMIT 25;

-- 2) Future sessions in series after edit propagation.
SELECT
    s.id AS sessionid,
    s.seriesid,
    s.series_sequence,
    s.title,
    s.teacherid,
    s.lessonid,
    s.unitid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    COUNT(DISTINCT CASE WHEN p.role = 'student' AND p.status = 'active' THEN p.studentid END) AS active_students,
    COUNT(DISTINCT CASE WHEN p.role = 'teacher' AND p.status = 'active' THEN p.userid END) AS active_teachers
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
WHERE s.seriesid > 0
GROUP BY
    s.id,
    s.seriesid,
    s.series_sequence,
    s.title,
    s.teacherid,
    s.lessonid,
    s.unitid,
    s.scheduled_start,
    s.scheduled_end,
    s.status
ORDER BY s.seriesid DESC, s.series_sequence ASC
LIMIT 100;

-- 3) Series management audit rows.
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
    'series_updated',
    'series_session_updated',
    'series_single_session_cancelled',
    'session_cancelled',
    'series_cancelled'
)
ORDER BY id DESC
LIMIT 100;

