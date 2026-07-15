-- Attach a student to a specific live session if the participant row is missing.
-- Run only after verify_student_live_session_visibility.sql shows:
-- FAIL: no active student participant row for this student
-- Replace ehelacad_quraantest/mdlgx_ and the names/date if needed.

SET @student_name = 'Salman Ahmed';
SET @teacher_name = 'Maryam Johnson';
SET @session_title = 'Pre-Quran review session';
SET @lessonid = 'alphabet';
SET @unitid = 'alphabet_listen';
SET @session_date = '2026-06-22';

SELECT @studentid := u.id
FROM ehelacad_quraantest.mdlgx_user u
WHERE CONCAT(u.firstname, ' ', u.lastname) = @student_name
ORDER BY u.id
LIMIT 1;

SELECT @sessionid := s.id
FROM ehelacad_quraantest.mdlgx_local_prequran_live_session s
JOIN ehelacad_quraantest.mdlgx_user teacher ON teacher.id = s.teacherid
WHERE s.title = @session_title
  AND s.lessonid = @lessonid
  AND s.unitid = @unitid
  AND DATE(FROM_UNIXTIME(s.scheduled_start)) = @session_date
  AND CONCAT(teacher.firstname, ' ', teacher.lastname) = @teacher_name
ORDER BY s.scheduled_start DESC, s.id DESC
LIMIT 1;

SELECT 'before_repair' AS check_name,
       @studentid AS studentid,
       @sessionid AS sessionid,
       COUNT(p.id) AS active_participant_rows
FROM ehelacad_quraantest.mdlgx_local_prequran_live_participant p
WHERE p.sessionid = @sessionid
  AND p.role = 'student'
  AND p.status = 'active'
  AND (p.studentid = @studentid OR p.userid = @studentid);

INSERT INTO ehelacad_quraantest.mdlgx_local_prequran_live_participant
    (sessionid, userid, role, studentid, status, displayname, invitedby, timecreated, timemodified)
SELECT @sessionid,
       @studentid,
       'student',
       @studentid,
       'active',
       CONCAT(u.firstname, ' ', u.lastname),
       0,
       UNIX_TIMESTAMP(),
       UNIX_TIMESTAMP()
FROM ehelacad_quraantest.mdlgx_user u
WHERE u.id = @studentid
  AND @sessionid IS NOT NULL
  AND @studentid IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM ehelacad_quraantest.mdlgx_local_prequran_live_participant p
      WHERE p.sessionid = @sessionid
        AND p.role = 'student'
        AND p.status = 'active'
        AND (p.studentid = @studentid OR p.userid = @studentid)
  );

SELECT 'after_repair' AS check_name,
       @studentid AS studentid,
       @sessionid AS sessionid,
       COUNT(p.id) AS active_participant_rows
FROM ehelacad_quraantest.mdlgx_local_prequran_live_participant p
WHERE p.sessionid = @sessionid
  AND p.role = 'student'
  AND p.status = 'active'
  AND (p.studentid = @studentid OR p.userid = @studentid);
