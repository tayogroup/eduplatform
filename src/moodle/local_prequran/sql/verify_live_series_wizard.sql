-- Phase 45 verification: Guided recurring class series wizard.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Latest recurring series and generated session counts.
SELECT
    se.id AS seriesid,
    se.title,
    se.teacherid,
    se.pattern,
    se.weekdays,
    se.session_count AS expected_sessions,
    se.status,
    FROM_UNIXTIME(se.date_start) AS date_start,
    FROM_UNIXTIME(se.date_end) AS date_end,
    COUNT(s.id) AS generated_sessions,
    MIN(FROM_UNIXTIME(s.scheduled_start)) AS first_session,
    MAX(FROM_UNIXTIME(s.scheduled_start)) AS last_session
FROM mdlgx_local_prequran_live_series se
LEFT JOIN mdlgx_local_prequran_live_session s
       ON s.seriesid = se.id
GROUP BY
    se.id,
    se.title,
    se.teacherid,
    se.pattern,
    se.weekdays,
    se.session_count,
    se.status,
    se.date_start,
    se.date_end
ORDER BY se.id DESC
LIMIT 25;

-- 2) Sessions generated from recurring series.
SELECT
    s.id AS sessionid,
    s.seriesid,
    s.series_sequence,
    s.title,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    s.bbb_meeting_id,
    COUNT(DISTINCT p.studentid) AS student_count
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
WHERE s.seriesid > 0
GROUP BY
    s.id,
    s.seriesid,
    s.series_sequence,
    s.title,
    s.teacherid,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    s.bbb_meeting_id
ORDER BY s.seriesid DESC, s.series_sequence ASC
LIMIT 100;

-- 3) Wizard and conflict audit records.
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
    'series_created_from_wizard',
    'series_created',
    'series_session_created',
    'schedule_conflict_override',
    'schedule_conflict_blocked'
)
ORDER BY id DESC
LIMIT 100;

