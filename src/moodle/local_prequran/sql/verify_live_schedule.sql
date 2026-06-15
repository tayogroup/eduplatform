SELECT
    s.id,
    s.title,
    p.studentid,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    s.bbb_created,
    a.attendance_status,
    n.visible_to_parent AS summary_visible,
    COUNT(DISTINCT r.id) AS visible_recordings
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
    ON p.sessionid = s.id
   AND p.role = 'student'
   AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
    ON a.sessionid = s.id
   AND a.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_note n
    ON n.sessionid = s.id
   AND n.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_recording r
    ON r.sessionid = s.id
   AND r.visible_to_parent = 1
   AND r.status = 'available'
WHERE s.status <> 'cancelled'
GROUP BY
    s.id,
    s.title,
    p.studentid,
    s.teacherid,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    s.bbb_created,
    a.attendance_status,
    n.visible_to_parent
ORDER BY s.scheduled_start DESC
LIMIT 50;
