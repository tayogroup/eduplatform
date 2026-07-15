/* Final institution workspace smoke checks.
   Run in phpMyAdmin on the Moodle database.
   Replace mdlgx_ with your Moodle table prefix if needed. */

SELECT 'workspace_core_tables' AS check_name,
       CASE WHEN COUNT(*) = 7 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'mdlgx_local_prequran_workspace',
      'mdlgx_local_prequran_workspace_member',
      'mdlgx_local_prequran_teacher_student',
      'mdlgx_local_prequran_workspace_material',
      'mdlgx_local_prequran_workspace_mat_assign',
      'mdlgx_local_prequran_live_session',
      'mdlgx_local_prequran_live_attendance'
  );

SELECT 'test_institute_workspace' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_CREATE_TEST_INSTITUTE' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace
WHERE status = 'active'
  AND (slug = 'test-institute' OR name = 'Test Institute');

SELECT 'test_institute_teacher_members' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_ADD_TEACHER' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute')
  AND wm.status = 'active'
  AND wm.workspace_role IN ('owner','admin','teacher','assistant_teacher');

SELECT 'test_institute_student_members' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_ADD_STUDENTS' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute')
  AND wm.status = 'active'
  AND wm.workspace_role = 'student';

SELECT 'test_institute_teacher_student_links' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_ASSIGN_STUDENTS_TO_TEACHER' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_teacher_student ts ON ts.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute')
  AND ts.status = 'active';

SELECT 'material_workflow_fields' AS check_name,
       CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL_RUN_MOODLE_UPGRADE' END AS status,
       COUNT(*) AS value
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'mdlgx_local_prequran_workspace_mat_assign'
  AND column_name IN ('workflow_status','startedat','completedat','reviewedby','reviewedat');

SELECT 'test_institute_material_assignments' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_ASSIGN_MATERIAL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_workspace_mat_assign a ON a.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute')
  AND a.status = 'active';

SELECT 'test_institute_reviewed_materials' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_REVIEW_COMPLETED_MATERIAL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_workspace_mat_assign a ON a.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute')
  AND a.status = 'active'
  AND a.workflow_status = 'reviewed'
  AND a.reviewedby > 0
  AND a.reviewedat > 0;

SELECT 'test_institute_live_sessions' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_CREATE_WORKSPACE_SESSION' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_live_session s ON s.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute')
  AND s.status <> 'deleted';

SELECT 'test_institute_attendance_rows' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_JOIN_SESSION' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace w
JOIN mdlgx_local_prequran_live_attendance a ON a.workspaceid = w.id
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute');

SELECT 'parent_links_for_workspace_students' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'CHECK_LINK_PARENT' END AS status,
       COUNT(*) AS value
FROM (
    SELECT c.studentid, c.guardianid FROM mdlgx_local_prequran_comm_consent c
    UNION
    SELECT l.studentid, l.guardianid FROM mdlgx_local_prequran_live_consent l
) g
JOIN mdlgx_local_prequran_workspace_member wm
  ON wm.userid = g.studentid
 AND wm.workspace_role = 'student'
 AND wm.status = 'active'
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
WHERE w.status = 'active'
  AND (w.slug = 'test-institute' OR w.name = 'Test Institute');

SELECT 'teacher_student_workspace_mismatch' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_teacher_student ts
JOIN mdlgx_local_prequran_workspace_member twm
  ON twm.workspaceid = ts.workspaceid
 AND twm.userid = ts.teacherid
 AND twm.status = 'active'
JOIN mdlgx_local_prequran_workspace_member swm
  ON swm.workspaceid = ts.workspaceid
 AND swm.userid = ts.studentid
 AND swm.status = 'active'
WHERE ts.status = 'active'
  AND (
    twm.workspace_role NOT IN ('owner','admin','teacher','assistant_teacher')
    OR swm.workspace_role <> 'student'
  );

SELECT 'live_participant_workspace_mismatch' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_live_participant p
JOIN mdlgx_local_prequran_live_session s ON s.id = p.sessionid
WHERE p.status = 'active'
  AND COALESCE(p.workspaceid, 0) <> COALESCE(s.workspaceid, 0);

SELECT 'material_assignment_workspace_mismatch' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS value
FROM mdlgx_local_prequran_workspace_mat_assign a
JOIN mdlgx_local_prequran_workspace_material m ON m.id = a.materialid
WHERE a.status = 'active'
  AND a.workspaceid <> m.workspaceid;

SELECT 'weekly_digest_task_registered' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL_RUN_MOODLE_UPGRADE' END AS status,
       COUNT(*) AS value
FROM mdlgx_task_scheduled
WHERE classname = '\\local_prequran\\task\\workspace_weekly_digest';
