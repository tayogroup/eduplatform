-- Phase 51 verification: Parent Trust Dashboard data sources.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Parent hub summary by student.
SELECT
    p.studentid,
    COUNT(DISTINCT CASE WHEN s.scheduled_start >= UNIX_TIMESTAMP(NOW()) AND s.status <> 'cancelled' THEN s.id END) AS upcoming_sessions,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS parent_visible_summaries,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 AND n.followup_status <> 'none' AND n.followup_resolved = 0 THEN n.id END) AS open_followups,
    COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' AND (r.expiresat = 0 OR r.expiresat > UNIX_TIMESTAMP(NOW())) THEN r.id END) AS visible_recordings
FROM mdlgx_local_prequran_live_participant p
JOIN mdlgx_local_prequran_live_session s ON s.id = p.sessionid
LEFT JOIN mdlgx_local_prequran_live_note n ON n.sessionid = s.id AND n.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_recording r ON r.sessionid = s.id
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.studentid
ORDER BY p.studentid ASC
LIMIT 100;

-- 2) Schedule acknowledgement status shown in the hub.
SELECT
    a.seriesid,
    se.title,
    a.studentid,
    a.parentid,
    a.ack_status,
    FROM_UNIXTIME(NULLIF(a.lastchangeat, 0)) AS last_change,
    FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0)) AS acknowledged_at,
    CASE
        WHEN a.ack_status = 'acknowledged' AND a.acknowledgedat >= a.lastchangeat THEN 'CURRENT'
        ELSE 'NEEDS_REVIEW'
    END AS dashboard_ack_status
FROM mdlgx_local_prequran_live_ack a
LEFT JOIN mdlgx_local_prequran_live_series se ON se.id = a.seriesid
ORDER BY a.timemodified DESC
LIMIT 100;

-- 3) Parent dashboard acknowledgement audit rows.
SELECT
    id,
    actorid,
    action,
    targettype,
    targetid,
    details,
    FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action = 'series_schedule_acknowledged'
  AND details LIKE '%parent_trust_dashboard%'
ORDER BY id DESC
LIMIT 50;

