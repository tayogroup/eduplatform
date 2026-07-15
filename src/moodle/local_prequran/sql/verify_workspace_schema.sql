SELECT 'workspace_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_workspace';

SELECT 'workspace_member_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_workspace_member';

SELECT 'workspace_material_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_workspace_material';

SELECT 'workspace_material_assignment_table' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'mdlgx_local_prequran_workspace_mat_assign';

SELECT 'default_workspace' AS check_name,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM mdlgx_local_prequran_workspace
WHERE slug = 'quraan-academy'
  AND workspace_type = 'academy_managed';

SELECT table_name, column_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'mdlgx_local_prequran_student_profile' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_class_group' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_group_member' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_teacher_student' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_session' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_series' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_participant' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_attendance' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_note' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_recording' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_live_consent' AND COLUMN_NAME = 'workspaceid')
    OR (TABLE_NAME = 'mdlgx_local_prequran_intake_request' AND COLUMN_NAME = 'workspaceid')
  )
GROUP BY table_name, column_name
ORDER BY table_name, column_name;

SELECT workspace_type, status, COUNT(*) AS workspaces
FROM mdlgx_local_prequran_workspace
GROUP BY workspace_type, status
ORDER BY workspace_type, status;
