SELECT
  a.sessionid,
  a.userid,
  a.studentid,
  a.attendance_status,
  a.participation_status,
  a.technical_issue,
  a.notes,
  FROM_UNIXTIME(NULLIF(a.join_time, 0)) AS join_time,
  FROM_UNIXTIME(a.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_attendance a
ORDER BY a.sessionid DESC, a.studentid ASC;

SELECT
  n.sessionid,
  n.studentid,
  n.teacherid,
  n.visible_to_parent,
  n.strengths,
  n.needs_practice,
  n.homework,
  n.parent_summary,
  n.private_note,
  FROM_UNIXTIME(n.timemodified) AS timemodified
FROM mdlgx_local_prequran_live_note n
ORDER BY n.sessionid DESC, n.studentid ASC;

SELECT
  sessionid,
  actorid,
  action,
  targettype,
  targetid,
  details,
  FROM_UNIXTIME(timecreated) AS timecreated
FROM mdlgx_local_prequran_live_audit
WHERE action IN ('review_saved', 'join_redirect', 'join_url_created')
ORDER BY id DESC
LIMIT 50;
