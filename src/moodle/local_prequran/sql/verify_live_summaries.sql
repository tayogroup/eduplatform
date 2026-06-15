SELECT
    s.id AS sessionid,
    s.title,
    n.studentid,
    n.teacherid,
    n.visible_to_parent,
    a.attendance_status,
    a.participation_status,
    n.strengths,
    n.needs_practice,
    n.homework,
    n.parent_summary,
    FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
JOIN mdlgx_local_prequran_live_session s
    ON s.id = n.sessionid
LEFT JOIN mdlgx_local_prequran_live_attendance a
    ON a.sessionid = n.sessionid
   AND a.studentid = n.studentid
WHERE n.visible_to_parent = 1
ORDER BY n.timemodified DESC, s.scheduled_start DESC
LIMIT 50;
