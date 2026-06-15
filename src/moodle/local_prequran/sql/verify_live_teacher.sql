SELECT
    s.id,
    s.title,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
    s.status,
    COUNT(DISTINCT p.id) AS student_count,
    COUNT(DISTINCT a.id) AS attendance_count,
    COUNT(DISTINCT n.id) AS note_count,
    COUNT(DISTINCT CASE WHEN n.visible_to_parent = 1 THEN n.id END) AS visible_summary_count
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
    ON p.sessionid = s.id
   AND p.role = 'student'
   AND p.status = 'active'
LEFT JOIN mdlgx_local_prequran_live_attendance a
    ON a.sessionid = s.id
   AND a.studentid = p.studentid
LEFT JOIN mdlgx_local_prequran_live_note n
    ON n.sessionid = s.id
   AND n.studentid = p.studentid
WHERE s.status <> 'cancelled'
GROUP BY s.id, s.title, s.teacherid, s.scheduled_start, s.scheduled_end, s.status
ORDER BY s.scheduled_start DESC
LIMIT 50;
