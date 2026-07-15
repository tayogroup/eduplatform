-- Verify why a student can or cannot see a live session on the dashboard.
-- Run in phpMyAdmin. Replace ehelacad_quraantest/mdlgx_ if needed.
-- Update the names/date below for another case.

SET @student_name = 'Salman Ahmed';
SET @teacher_name = 'Maryam Johnson';
SET @session_title = 'Pre-Quran review session';
SET @lessonid = 'alphabet';
SET @unitid = 'alphabet_listen';
SET @session_date = '2026-06-22';

SELECT 'student_user' AS check_name,
       u.id,
       CONCAT(u.firstname, ' ', u.lastname) AS fullname,
       u.username,
       u.email
FROM ehelacad_quraantest.mdlgx_user u
WHERE CONCAT(u.firstname, ' ', u.lastname) = @student_name
   OR u.firstname LIKE SUBSTRING_INDEX(@student_name, ' ', 1)
ORDER BY u.id;

SELECT 'matching_session_and_participant' AS check_name,
       s.id AS sessionid,
       s.title,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       s.status AS session_status,
       teacher.id AS teacherid,
       CONCAT(teacher.firstname, ' ', teacher.lastname) AS teacher_name,
       p.id AS participantid,
       p.userid AS participant_userid,
       p.studentid AS participant_studentid,
       p.role AS participant_role,
       p.status AS participant_status,
       participant.username AS participant_username,
       CONCAT(participant.firstname, ' ', participant.lastname) AS participant_user_name
FROM ehelacad_quraantest.mdlgx_local_prequran_live_session s
JOIN ehelacad_quraantest.mdlgx_user teacher ON teacher.id = s.teacherid
LEFT JOIN ehelacad_quraantest.mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
LEFT JOIN ehelacad_quraantest.mdlgx_user participant
       ON participant.id = COALESCE(NULLIF(p.studentid, 0), NULLIF(p.userid, 0))
WHERE s.title = @session_title
  AND s.lessonid = @lessonid
  AND s.unitid = @unitid
  AND DATE(FROM_UNIXTIME(s.scheduled_start)) = @session_date
  AND CONCAT(teacher.firstname, ' ', teacher.lastname) = @teacher_name
ORDER BY s.scheduled_start DESC, p.id ASC;

SELECT 'dashboard_visibility_for_student' AS check_name,
       s.id AS sessionid,
       s.title,
       FROM_UNIXTIME(s.scheduled_start) AS scheduled_start,
       s.status AS session_status,
       p.id AS participantid,
       p.userid AS participant_userid,
       p.studentid AS participant_studentid,
       p.status AS participant_status,
       CASE
         WHEN p.id IS NULL THEN 'FAIL: no active student participant row for this student'
         WHEN s.status = 'cancelled' THEN 'FAIL: session is cancelled'
         ELSE 'PASS: dashboard query should show this session'
       END AS visibility_status
FROM ehelacad_quraantest.mdlgx_user student
JOIN ehelacad_quraantest.mdlgx_local_prequran_live_session s
JOIN ehelacad_quraantest.mdlgx_user teacher ON teacher.id = s.teacherid
LEFT JOIN ehelacad_quraantest.mdlgx_local_prequran_live_participant p
       ON p.sessionid = s.id
      AND p.role = 'student'
      AND p.status = 'active'
      AND (p.studentid = student.id OR p.userid = student.id)
WHERE CONCAT(student.firstname, ' ', student.lastname) = @student_name
  AND s.title = @session_title
  AND s.lessonid = @lessonid
  AND s.unitid = @unitid
  AND DATE(FROM_UNIXTIME(s.scheduled_start)) = @session_date
  AND CONCAT(teacher.firstname, ' ', teacher.lastname) = @teacher_name
ORDER BY s.scheduled_start DESC;
