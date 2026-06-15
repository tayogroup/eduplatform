SELECT
    s.id AS sessionid,
    s.title,
    p.studentid,
    s.teacherid,
    FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
    s.status,
    s.recording_enabled,
    s.recording_consent_required,
    a.attendance_status,
    a.participation_status,
    a.technical_issue,
    n.visible_to_parent AS summary_visible_to_parent,
    COUNT(DISTINCT r.id) AS visible_parent_recordings
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
    ON p.sessionid = s.id
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
WHERE p.role = 'student'
  AND p.status = 'active'
GROUP BY
    s.id,
    s.title,
    p.studentid,
    s.teacherid,
    s.scheduled_start,
    s.status,
    s.recording_enabled,
    s.recording_consent_required,
    a.attendance_status,
    a.participation_status,
    a.technical_issue,
    n.visible_to_parent
ORDER BY s.scheduled_start DESC, s.id DESC
LIMIT 50;
