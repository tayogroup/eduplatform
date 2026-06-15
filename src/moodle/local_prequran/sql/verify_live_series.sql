-- Phase 16 verification: recurring class series and generated sessions.
-- Replace mdlgx_ with your Moodle table prefix if needed.

SELECT
    'mdlgx_local_prequran_live_series' AS table_name,
    CASE
        WHEN COUNT(*) = 1 THEN 'PRESENT'
        ELSE 'MISSING'
    END AS table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_live_series'
UNION ALL
SELECT
    'mdlgx_local_prequran_live_session.seriesid' AS table_name,
    CASE
        WHEN COUNT(*) = 1 THEN 'PRESENT'
        ELSE 'MISSING'
    END AS table_status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_live_session'
  AND column_name = 'seriesid'
UNION ALL
SELECT
    'mdlgx_local_prequran_live_session.series_sequence' AS table_name,
    CASE
        WHEN COUNT(*) = 1 THEN 'PRESENT'
        ELSE 'MISSING'
    END AS table_status
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_live_session'
  AND column_name = 'series_sequence';

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

SELECT
    s.id,
    s.seriesid,
    s.series_sequence,
    s.title,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    COUNT(DISTINCT p.id) AS participants
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
    s.scheduled_start,
    s.scheduled_end,
    s.status
ORDER BY s.seriesid DESC, s.series_sequence ASC
LIMIT 100;

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
WHERE action IN ('series_created', 'series_session_created', 'series_cancelled')
ORDER BY id DESC
LIMIT 50;
