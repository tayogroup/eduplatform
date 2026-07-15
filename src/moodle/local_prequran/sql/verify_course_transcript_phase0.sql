-- Course transcript Phase 0 discovery checks.
-- Read-only. Replace mdlgx_ with the production table prefix if needed.

-- 1) Required local table availability.
SELECT 'table_exists' AS check_name, 'mdlgx_local_prequran_course_offering' AS target,
       COUNT(*) AS found
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_course_offering'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_course_enrol_req', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_course_enrol_req'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_course_audit', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_course_audit'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_workspace_member', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_workspace_member'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_lessonprog', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_lessonprog'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_stepprog', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_stepprog'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_quiz_attempt', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_quiz_attempt'
UNION ALL
SELECT 'table_exists', 'mdlgx_local_prequran_live_attendance', COUNT(*)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_live_attendance';

-- 2) Duplicate local course requests. This should remain zero because the schema defines a unique key.
SELECT 'duplicate_course_request' AS check_name,
       offeringid,
       studentid,
       COUNT(*) AS duplicate_count
FROM mdlgx_local_prequran_course_enrol_req
GROUP BY offeringid, studentid
HAVING COUNT(*) > 1;

-- 3) Approved/enrolled local requests where the linked Moodle course is missing.
SELECT 'linked_moodle_course_missing' AS check_name,
       r.id AS requestid,
       r.workspaceid,
       r.studentid,
       r.status,
       o.id AS offeringid,
       o.title AS offering_title,
       o.moodlecourseid
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o ON o.id = r.offeringid
LEFT JOIN mdlgx_course c ON c.id = o.moodlecourseid
WHERE r.status IN ('approved', 'enrolled', 'drop_requested')
  AND (o.moodlecourseid <= 0 OR c.id IS NULL);

-- 4) Approved local requests that still need Moodle sync.
SELECT 'approved_pending_moodle_sync' AS check_name,
       r.id AS requestid,
       r.workspaceid,
       r.studentid,
       r.status,
       o.id AS offeringid,
       o.title AS offering_title,
       o.moodlecourseid,
       r.approvedat,
       r.moodleenrolledat
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o ON o.id = r.offeringid
LEFT JOIN mdlgx_enrol e
       ON e.courseid = o.moodlecourseid
      AND e.enrol = 'manual'
      AND e.status = 0
LEFT JOIN mdlgx_user_enrolments ue
       ON ue.enrolid = e.id
      AND ue.userid = r.studentid
      AND ue.status = 0
WHERE r.status = 'approved'
  AND COALESCE(r.moodleenrolledat, 0) = 0
  AND ue.id IS NULL;

-- 5) Local enrolled requests where Moodle active enrollment is missing.
SELECT 'local_enrolled_without_active_moodle_enrollment' AS check_name,
       r.id AS requestid,
       r.workspaceid,
       r.studentid,
       o.id AS offeringid,
       o.title AS offering_title,
       o.moodlecourseid,
       r.moodleenrolledat
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o ON o.id = r.offeringid
LEFT JOIN mdlgx_enrol e
       ON e.courseid = o.moodlecourseid
      AND e.enrol = 'manual'
      AND e.status = 0
LEFT JOIN mdlgx_user_enrolments ue
       ON ue.enrolid = e.id
      AND ue.userid = r.studentid
      AND ue.status = 0
WHERE r.status = 'enrolled'
  AND ue.id IS NULL;

-- 6) Active Moodle manual enrollments in linked Moodle courses without a matching local enrolled/approved request.
SELECT 'moodle_only_enrollment_in_offering_course' AS check_name,
       o.workspaceid,
       o.id AS offeringid,
       o.title AS offering_title,
       o.moodlecourseid,
       ue.userid AS studentid,
       ue.timestart
FROM mdlgx_local_prequran_course_offering o
JOIN mdlgx_enrol e
     ON e.courseid = o.moodlecourseid
    AND e.enrol = 'manual'
    AND e.status = 0
JOIN mdlgx_user_enrolments ue
     ON ue.enrolid = e.id
    AND ue.status = 0
LEFT JOIN mdlgx_local_prequran_course_enrol_req r
       ON r.offeringid = o.id
      AND r.studentid = ue.userid
      AND r.status IN ('approved', 'enrolled', 'drop_requested')
WHERE o.status IN ('published', 'closed')
  AND r.id IS NULL;

-- 7) Course requests where the student is not an active student member of the workspace.
SELECT 'student_not_active_workspace_member' AS check_name,
       r.id AS requestid,
       r.workspaceid,
       r.studentid,
       r.status,
       o.title AS offering_title
FROM mdlgx_local_prequran_course_enrol_req r
JOIN mdlgx_local_prequran_course_offering o ON o.id = r.offeringid
LEFT JOIN mdlgx_local_prequran_workspace_member wm
       ON wm.workspaceid = r.workspaceid
      AND wm.userid = r.studentid
      AND wm.workspace_role = 'student'
      AND wm.status = 'active'
WHERE r.status IN ('pending', 'approved', 'enrolled', 'drop_requested')
  AND wm.id IS NULL;

-- 8) Students with active course requests in more than one workspace.
SELECT 'student_multiple_course_workspaces' AS check_name,
       studentid,
       COUNT(DISTINCT workspaceid) AS workspace_count,
       GROUP_CONCAT(DISTINCT workspaceid ORDER BY workspaceid) AS workspaceids
FROM mdlgx_local_prequran_course_enrol_req
WHERE status IN ('pending', 'approved', 'enrolled', 'drop_requested')
GROUP BY studentid
HAVING COUNT(DISTINCT workspaceid) > 1;

-- 9) Parent communication consent rows where the child is not an active student member anywhere.
-- local_prequran_comm_consent is not consistently workspace-scoped, so the resolver must still
-- intersect consent with the requested workspace's active student membership at runtime.
SELECT 'parent_comm_consent_child_not_active_student_member' AS check_name,
       cc.studentid,
       cc.guardianid
FROM mdlgx_local_prequran_comm_consent cc
LEFT JOIN mdlgx_local_prequran_workspace_member wm
       ON wm.userid = cc.studentid
      AND wm.workspace_role = 'student'
      AND wm.status = 'active'
WHERE wm.id IS NULL;

-- 10) Teacher-student assignments where either side lacks active workspace membership.
SELECT 'teacher_student_assignment_membership_gap' AS check_name,
       ts.workspaceid,
       ts.teacherid,
       ts.studentid,
       CASE WHEN twm.id IS NULL THEN 1 ELSE 0 END AS teacher_membership_missing,
       CASE WHEN swm.id IS NULL THEN 1 ELSE 0 END AS student_membership_missing
FROM mdlgx_local_prequran_teacher_student ts
LEFT JOIN mdlgx_local_prequran_workspace_member twm
       ON twm.workspaceid = ts.workspaceid
      AND twm.userid = ts.teacherid
      AND twm.workspace_role IN ('owner', 'admin', 'teacher', 'assistant_teacher')
      AND twm.status = 'active'
LEFT JOIN mdlgx_local_prequran_workspace_member swm
       ON swm.workspaceid = ts.workspaceid
      AND swm.userid = ts.studentid
      AND swm.workspace_role = 'student'
      AND swm.status = 'active'
WHERE ts.status = 'active'
  AND (twm.id IS NULL OR swm.id IS NULL);
