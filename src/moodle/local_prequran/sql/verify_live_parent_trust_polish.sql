-- Phase 52 verification: Parent Trust Dashboard polish and mobile QA data health.
-- Replace mdlgx_ with your Moodle database prefix if needed.

-- 1) Parent hub health by student.
SELECT
    p.studentid,
    COUNT(DISTINCT CASE WHEN s.scheduled_start >= UNIX_TIMESTAMP(NOW()) AND s.status <> 'cancelled' THEN s.id END) AS upcoming_sessions,
    COUNT(DISTINCT se.id) AS recurring_series,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS visible_summaries,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 AND n.followup_status <> 'none' AND n.followup_resolved = 0 THEN n.id END) AS open_followups,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 AND TRIM(CONCAT(COALESCE(n.homework, ''), COALESCE(n.homework_unitid, ''))) <> '' THEN n.id END) AS homework_items,
    COUNT(DISTINCT CASE WHEN r.visible_to_parent = 1 AND r.status = 'available' AND (r.expiresat = 0 OR r.expiresat > UNIX_TIMESTAMP(NOW())) THEN r.id END) AS visible_recordings
FROM mdlgx_local_prequran_live_participant p
JOIN mdlgx_local_prequran_live_session s ON s.id = p.sessionid
LEFT JOIN mdlgx_local_prequran_live_series se ON se.id = s.seriesid
LEFT JOIN mdlgx_local_prequran_live_note n ON n.sessionid = s.id AND n.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_recording r ON r.sessionid = s.id
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.studentid
ORDER BY p.studentid ASC
LIMIT 100;

-- 2) Students with possible parent-link gaps.
SELECT
    p.studentid,
    COUNT(DISTINCT cc.guardianid) AS consent_parent_links,
    COUNT(DISTINCT cp.userid) AS communication_parent_links
FROM mdlgx_local_prequran_live_participant p
LEFT JOIN mdlgx_local_prequran_comm_consent cc ON cc.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_comm_thread ct ON ct.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_comm_participant cp ON cp.threadid = ct.id AND cp.role = 'parent'
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY p.studentid
HAVING consent_parent_links = 0 AND communication_parent_links = 0
ORDER BY p.studentid ASC
LIMIT 100;

-- 3) Pending acknowledgement receipts visible on the parent hub.
SELECT
    a.seriesid,
    se.title,
    a.studentid,
    a.parentid,
    a.ack_status,
    FROM_UNIXTIME(NULLIF(a.lastchangeat, 0)) AS last_change,
    FROM_UNIXTIME(NULLIF(a.remindedat, 0)) AS reminded_at,
    FROM_UNIXTIME(NULLIF(a.acknowledgedat, 0)) AS acknowledged_at
FROM mdlgx_local_prequran_live_ack a
LEFT JOIN mdlgx_local_prequran_live_series se ON se.id = a.seriesid
WHERE a.ack_status <> 'acknowledged'
   OR a.acknowledgedat < a.lastchangeat
ORDER BY a.lastchangeat DESC, a.seriesid DESC
LIMIT 100;

