-- Independent teacher/student identity and relationship checks.
-- Expected result for each *_problem_count query: 0.

SELECT INDEX_NAME,
       NON_UNIQUE,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS indexed_columns
  FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'mdlgx_local_prequran_teacher_student'
 GROUP BY INDEX_NAME, NON_UNIQUE
 ORDER BY INDEX_NAME;

SELECT COUNT(*) AS duplicate_workspace_assignment_problem_count
  FROM (
        SELECT workspaceid, teacherid, studentid, COUNT(*) AS row_count
          FROM mdlgx_local_prequran_teacher_student
         GROUP BY workspaceid, teacherid, studentid
        HAVING COUNT(*) > 1
       ) duplicate_assignments;

SELECT COUNT(*) AS duplicate_student_profile_problem_count
  FROM (
        SELECT userid, COUNT(*) AS row_count
          FROM mdlgx_local_prequran_student_profile
         GROUP BY userid
        HAVING COUNT(*) > 1
       ) duplicate_profiles;

SELECT COUNT(*) AS duplicate_student_email_problem_count
  FROM (
        SELECT LOWER(TRIM(u.email)) AS normalized_email, COUNT(*) AS row_count
          FROM mdlgx_user u
          JOIN mdlgx_local_prequran_student_profile sp ON sp.userid = u.id
         WHERE u.deleted = 0
           AND TRIM(COALESCE(u.email, '')) <> ''
         GROUP BY LOWER(TRIM(u.email))
        HAVING COUNT(*) > 1
       ) duplicate_emails;

SELECT COUNT(*) AS assignment_membership_gap_problem_count
  FROM mdlgx_local_prequran_teacher_student ts
  LEFT JOIN mdlgx_local_prequran_workspace_member twm
    ON twm.workspaceid = ts.workspaceid
   AND twm.userid = ts.teacherid
   AND twm.workspace_role = 'teacher'
   AND twm.status = 'active'
  LEFT JOIN mdlgx_local_prequran_workspace_member swm
    ON swm.workspaceid = ts.workspaceid
   AND swm.userid = ts.studentid
   AND swm.workspace_role = 'student'
   AND swm.status = 'active'
 WHERE ts.status = 'active'
   AND (twm.id IS NULL OR swm.id IS NULL);

SELECT tr.id AS request_id,
       tr.request_status,
       tr.teacherid,
       tr.studentid,
       tr.parentid,
       FROM_UNIXTIME(tr.timecreated) AS requested_at
  FROM mdlgx_local_prequran_teacher_request tr
 WHERE tr.request_status IN ('selection_requested', 'academy_review', 'teacher_contacted', 'parent_confirmed', 'matched')
 ORDER BY tr.timecreated DESC;
