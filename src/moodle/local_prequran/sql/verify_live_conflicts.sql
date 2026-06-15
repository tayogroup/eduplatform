-- Phase 19 verification: availability and conflict prevention.
-- Replace mdlgx_ with your Moodle table prefix if needed.

SELECT
    'mdlgx_local_prequran_live_availability' AS table_name,
    CASE WHEN COUNT(*) = 1 THEN 'PRESENT' ELSE 'MISSING' END AS table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_live_availability';

SELECT
    teacherid,
    weekday,
    start_minute,
    end_minute,
    timezone,
    status,
    FROM_UNIXTIME(timemodified) AS timemodified
FROM mdlgx_local_prequran_live_availability
ORDER BY teacherid, weekday, start_minute
LIMIT 100;

SELECT
    s1.id AS session1,
    s2.id AS session2,
    s1.teacherid,
    FROM_UNIXTIME(s1.scheduled_start) AS session1_start,
    FROM_UNIXTIME(s1.scheduled_end) AS session1_end,
    FROM_UNIXTIME(s2.scheduled_start) AS session2_start,
    FROM_UNIXTIME(s2.scheduled_end) AS session2_end
FROM mdlgx_local_prequran_live_session s1
JOIN mdlgx_local_prequran_live_session s2
  ON s1.teacherid = s2.teacherid
 AND s1.id < s2.id
 AND s1.status NOT IN ('cancelled', 'failed')
 AND s2.status NOT IN ('cancelled', 'failed')
 AND s1.scheduled_start < s2.scheduled_end
 AND s1.scheduled_end > s2.scheduled_start
ORDER BY s1.scheduled_start DESC
LIMIT 50;

SELECT
    id,
    sessionid,
    actorid,
    action,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN (
    'schedule_conflict_blocked',
    'schedule_conflict_override',
    'availability_updated'
)
ORDER BY id DESC
LIMIT 50;
