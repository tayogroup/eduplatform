-- Verify workspace data scoping for institution/school records.
-- This is read-only and assumes the production prefix is mdlgx_.
-- Replace mdlgx_ if your Moodle database uses a different prefix.

SET @selected_db := DATABASE();

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_intake_request' AND column_name = 'workspaceid'),
    "SELECT 'student_intake_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_intake_request WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'student_intake_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_teacher_intake_request' AND column_name = 'workspaceid'),
    "SELECT 'teacher_intake_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_teacher_intake_request WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'teacher_intake_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_student_profile' AND column_name = 'workspaceid'),
    "SELECT 'student_profiles_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_student_profile WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'student_profiles_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_teacher_profile' AND column_name = 'workspaceid'),
    "SELECT 'teacher_profiles_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_teacher_profile WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'teacher_profiles_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing - run Moodle upgrade 202607030047' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_group_pool' AND column_name = 'workspaceid'),
    "SELECT 'group_pools_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_group_pool WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'group_pools_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_class_group' AND column_name = 'workspaceid'),
    "SELECT 'class_groups_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_class_group WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'class_groups_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_group_member' AND column_name = 'workspaceid'),
    "SELECT 'group_members_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_group_member WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'group_members_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_live_session' AND column_name = 'workspaceid'),
    "SELECT 'live_sessions_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_live_session WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'live_sessions_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = @selected_db AND table_name = 'mdlgx_local_prequran_live_participant' AND column_name = 'workspaceid'),
    "SELECT 'live_participants_workspaceid' AS check_name, COUNT(*) AS missing_workspace_rows, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status FROM mdlgx_local_prequran_live_participant WHERE COALESCE(workspaceid, 0) = 0",
    "SELECT 'live_participants_workspaceid' AS check_name, NULL AS missing_workspace_rows, 'FAIL: workspaceid column missing' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'owned_group_allowed_workspaces' AS check_name,
       COUNT(DISTINCT gm.memberid) AS owned_branch_workspaces,
       CASE WHEN COUNT(DISTINCT gm.memberid) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND g.status = 'active'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active';

SELECT 'franchise_governance_only' AS check_name,
       COUNT(*) AS expanded_franchise_links,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
 WHERE g.slug = 'franchise-schools'
   AND g.group_type = 'franchise_network'
   AND g.status = 'active'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'franchise_member'
   AND gm.status = 'active'
   AND (
       LOWER(CONCAT(',', REPLACE(gm.access_scope, ' ', ''), ',')) LIKE '%,operations,%'
       OR COALESCE(gm.inherit_sensitive_access, 0) <> 0
   );
