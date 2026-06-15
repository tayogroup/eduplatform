SELECT
  s.id,
  s.title,
  s.teacherid,
  FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
  FROM_UNIXTIME(s.scheduled_end) AS scheduled_end,
  s.status,
  s.bbb_meeting_id,
  s.bbb_created,
  FROM_UNIXTIME(NULLIF(s.bbb_create_time, 0)) AS bbb_create_time,
  s.bbb_last_error,
  COUNT(DISTINCT p.id) AS participant_count,
  COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.id END) AS student_count,
  COUNT(DISTINCT a.id) AS attendance_count
FROM mdlgx_local_prequran_live_session s
LEFT JOIN mdlgx_local_prequran_live_participant p
  ON p.sessionid = s.id
LEFT JOIN mdlgx_local_prequran_live_attendance a
  ON a.sessionid = s.id
GROUP BY
  s.id,
  s.title,
  s.teacherid,
  s.scheduled_start,
  s.scheduled_end,
  s.status,
  s.bbb_meeting_id,
  s.bbb_created,
  s.bbb_create_time,
  s.bbb_last_error
ORDER BY s.id DESC
LIMIT 25;

SELECT
  sessionid,
  actorid,
  action,
  targettype,
  targetid,
  details,
  FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
ORDER BY id DESC
LIMIT 50;

SELECT
  a.sessionid,
  a.userid,
  a.studentid,
  a.attendance_status,
  a.participation_status,
  FROM_UNIXTIME(NULLIF(a.join_time, 0)) AS join_time,
  a.technical_issue,
  a.notes
FROM mdlgx_local_prequran_live_attendance a
ORDER BY a.id DESC
LIMIT 50;

SELECT
  s.id AS sessionid,
  s.title,
  p.userid,
  p.role,
  p.studentid,
  p.status AS participant_status,
  CASE
    WHEN p.role = 'teacher' AND p.userid = s.teacherid THEN 'PASS'
    WHEN p.role = 'student' AND p.studentid = p.userid THEN 'PASS'
    WHEN p.role = 'parent_observer' THEN 'CHECK'
    ELSE 'CHECK'
  END AS participant_shape_check
FROM mdlgx_local_prequran_live_session s
JOIN mdlgx_local_prequran_live_participant p
  ON p.sessionid = s.id
ORDER BY s.id DESC, p.role, p.userid
LIMIT 100;
