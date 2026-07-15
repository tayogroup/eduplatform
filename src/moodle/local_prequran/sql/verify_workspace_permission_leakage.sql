/* Workspace permission leakage checks.
   Replace mdlgx_ with your Moodle table prefix if needed. PASS means no leakage rows were found. */

SELECT 'teacher_student_workspace_mismatch' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS issue_count
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
       COUNT(*) AS issue_count
FROM mdlgx_local_prequran_live_participant p
JOIN mdlgx_local_prequran_live_session s ON s.id = p.sessionid
WHERE p.status = 'active'
  AND COALESCE(p.workspaceid, 0) <> COALESCE(s.workspaceid, 0);

SELECT 'material_assignment_workspace_mismatch' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS issue_count
FROM mdlgx_local_prequran_workspace_mat_assign a
JOIN mdlgx_local_prequran_workspace_material m ON m.id = a.materialid
WHERE a.status = 'active'
  AND a.workspaceid <> m.workspaceid;

SELECT 'student_material_target_not_workspace_student' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS issue_count
FROM mdlgx_local_prequran_workspace_mat_assign a
LEFT JOIN mdlgx_local_prequran_workspace_member wm
  ON wm.workspaceid = a.workspaceid
 AND wm.userid = a.targetid
 AND wm.workspace_role = 'student'
 AND wm.status = 'active'
WHERE a.status = 'active'
  AND a.target_type = 'student'
  AND wm.id IS NULL;

SELECT 'teacher_material_target_not_workspace_teacher' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS issue_count
FROM mdlgx_local_prequran_workspace_mat_assign a
LEFT JOIN mdlgx_local_prequran_workspace_member wm
  ON wm.workspaceid = a.workspaceid
 AND wm.userid = a.targetid
 AND wm.workspace_role IN ('owner','admin','teacher','assistant_teacher')
 AND wm.status = 'active'
WHERE a.status = 'active'
  AND a.target_type = 'teacher'
  AND wm.id IS NULL;

SELECT 'parent_link_without_child_workspace_membership' AS check_name,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
       COUNT(*) AS issue_count
FROM (
    SELECT studentid, guardianid FROM mdlgx_local_prequran_comm_consent
    UNION
    SELECT studentid, guardianid FROM mdlgx_local_prequran_live_consent
) g
JOIN mdlgx_local_prequran_workspace_mat_assign a
  ON a.targetid = g.studentid
 AND a.target_type = 'student'
 AND a.status = 'active'
LEFT JOIN mdlgx_local_prequran_workspace_member wm
  ON wm.workspaceid = a.workspaceid
 AND wm.userid = g.studentid
 AND wm.workspace_role = 'student'
 AND wm.status = 'active'
WHERE wm.id IS NULL;
