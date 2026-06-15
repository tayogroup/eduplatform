-- Phase 49 verification: parent schedule acknowledgements and read receipts.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Acknowledgement table exists.
SELECT
    'mdlgx_local_prequran_live_ack' AS table_name,
    CASE
        WHEN COUNT(*) = 1 THEN 'PRESENT'
        ELSE 'MISSING'
    END AS table_status
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_live_ack';

-- 2) Latest acknowledgement/read receipt rows.
SELECT
    id,
    seriesid,
    studentid,
    parentid,
    ack_status,
    FROM_UNIXTIME(NULLIF(acknowledgedat, 0)) AS acknowledgedat,
    FROM_UNIXTIME(NULLIF(lastchangeat, 0)) AS lastchangeat,
    FROM_UNIXTIME(NULLIF(remindedat, 0)) AS remindedat,
    FROM_UNIXTIME(timemodified) AS timemodified
FROM mdlgx_local_prequran_live_ack
ORDER BY id DESC
LIMIT 100;

-- 3) Series acknowledgement coverage.
SELECT
    s.seriesid,
    p.studentid,
    COUNT(DISTINCT a.parentid) AS parents_acknowledged,
    MAX(FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0))) AS latest_acknowledged
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
     ON p.sessionid = s.id
    AND p.role = 'student'
    AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_ack a
       ON a.seriesid = s.seriesid
      AND a.studentid = p.studentid
      AND a.ack_status = 'acknowledged'
WHERE s.seriesid > 0
GROUP BY s.seriesid, p.studentid
ORDER BY s.seriesid DESC, p.studentid ASC
LIMIT 100;

-- 4) Acknowledgement and reminder audit rows.
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
    'series_schedule_acknowledged',
    'series_ack_reminder_sent',
    'series_ack_reminder_skipped'
)
ORDER BY id DESC
LIMIT 100;

