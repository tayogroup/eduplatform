-- Verify the Huda-school institution functional test fixture.
-- Run after opening /local/hubredirect/institution_school_functional_test.php and pressing Run.
-- This is read-only and assumes the production prefix is mdlgx_.

SET @institution_adminid := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.institution_admin' AND deleted = 0 LIMIT 1);
SET @school_adminid := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.school_admin' AND deleted = 0 LIMIT 1);
SET @teacherid := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.teacher' AND deleted = 0 LIMIT 1);
SET @studentid := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.student' AND deleted = 0 LIMIT 1);
SET @parentid := (SELECT id FROM mdlgx_user WHERE username = 'huda.sqa.parent' AND deleted = 0 LIMIT 1);
SET @huda_workspaceid := (
    SELECT wm.workspaceid
      FROM mdlgx_local_prequran_workspace_member wm
      JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
     WHERE wm.userid = @school_adminid
       AND wm.workspace_role = 'admin'
       AND wm.status = 'active'
       AND w.status <> 'archived'
  ORDER BY wm.workspaceid ASC
     LIMIT 1
);
SET @branchb_workspaceid := (SELECT id FROM mdlgx_local_prequran_workspace WHERE slug = 'huda-branch-b-sqa' AND status <> 'archived' LIMIT 1);
SET @branchb_adminid := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.school_admin' AND deleted = 0 LIMIT 1);
SET @branchb_teacherid := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.teacher' AND deleted = 0 LIMIT 1);
SET @branchb_studentid := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.student' AND deleted = 0 LIMIT 1);
SET @branchb_parentid := (SELECT id FROM mdlgx_user WHERE username = 'huda.branchb.sqa.parent' AND deleted = 0 LIMIT 1);
SET @franchise_workspaceid := (SELECT id FROM mdlgx_local_prequran_workspace WHERE slug = 'huda-franchise-sqa' AND status <> 'archived' LIMIT 1);
SET @franchise_adminid := (SELECT id FROM mdlgx_user WHERE username = 'huda.franchise.sqa.franchise_admin' AND deleted = 0 LIMIT 1);

SELECT 'huda_workspace_resolved' AS check_name,
       @huda_workspaceid AS workspaceid,
       CASE WHEN @huda_workspaceid > 0 THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 'fixture_users_exist' AS check_name,
       CONCAT_WS(',', @institution_adminid, @school_adminid, @teacherid, @studentid, @parentid) AS userids,
       CASE WHEN @institution_adminid > 0
             AND @school_adminid > 0
             AND @teacherid > 0
             AND @studentid > 0
             AND @parentid > 0
            THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 'school_admin_member' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE workspaceid = @huda_workspaceid
   AND userid = @school_adminid
   AND workspace_role = 'admin'
   AND status = 'active';

SELECT 'teacher_member' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE workspaceid = @huda_workspaceid
   AND userid = @teacherid
   AND workspace_role = 'teacher'
   AND status = 'active';

SELECT 'student_parent_members' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE workspaceid = @huda_workspaceid
   AND userid IN (@studentid, @parentid)
   AND workspace_role IN ('student', 'parent')
   AND status = 'active';

SELECT 'huda_class_group_workspaceid' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_class_group
 WHERE workspaceid = @huda_workspaceid
   AND teacherid = @teacherid
   AND title = 'Huda SQA Functional Class'
   AND status IN ('open', 'active');

SELECT 'huda_group_member_workspaceid' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_group_member gm
  JOIN mdlgx_local_prequran_class_group g ON g.id = gm.groupid
 WHERE gm.workspaceid = @huda_workspaceid
   AND g.workspaceid = @huda_workspaceid
   AND g.teacherid = @teacherid
   AND gm.studentid = @studentid
   AND gm.assignment_status = 'active';

SELECT 'huda_live_session_workspaceid' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_live_session
 WHERE workspaceid = @huda_workspaceid
   AND teacherid = @teacherid
   AND title = 'Huda SQA Functional Live Session'
   AND status = 'scheduled';

SELECT 'huda_live_participants_workspaceid' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_live_participant p
  JOIN mdlgx_local_prequran_live_session s ON s.id = p.sessionid
 WHERE p.workspaceid = @huda_workspaceid
   AND s.workspaceid = @huda_workspaceid
   AND p.userid IN (@teacherid, @studentid)
   AND p.status = 'active';

SELECT 'institution_admin_owned_branch' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gu
       ON gu.groupid = g.id
      AND gu.member_type = 'user'
      AND gu.memberid = @institution_adminid
      AND gu.group_role IN ('owner', 'admin')
      AND gu.status = 'active'
  JOIN mdlgx_local_prequran_org_group_member gw
       ON gw.groupid = g.id
      AND gw.member_type = 'workspace'
      AND gw.memberid = @huda_workspaceid
      AND gw.relationship_type = 'owned_branch'
      AND gw.status = 'active'
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND g.status = 'active'
   AND LOWER(CONCAT(',', REPLACE(gw.access_scope, ' ', ''), ',')) LIKE '%,operations,%'
   AND COALESCE(gw.inherit_sensitive_access, 0) = 1;

SELECT 'school_admin_only_huda' AS check_name,
       COUNT(DISTINCT workspaceid) AS active_admin_workspaces,
       CASE WHEN COUNT(DISTINCT workspaceid) = 1
              AND MAX(workspaceid) = @huda_workspaceid
            THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE userid = @school_adminid
   AND workspace_role IN ('owner', 'admin')
   AND status = 'active';

SELECT 'teacher_only_huda_classes' AS check_name,
       COUNT(*) AS outside_huda_classes,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_class_group
 WHERE teacherid = @teacherid
   AND workspaceid <> @huda_workspaceid;

SELECT 'parent_student_only_huda' AS check_name,
       COUNT(*) AS outside_huda_memberships,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE userid IN (@parentid, @studentid)
   AND workspaceid <> @huda_workspaceid
   AND status = 'active';

SELECT 'branch_b_workspace_resolved' AS check_name,
       @branchb_workspaceid AS workspaceid,
       CASE WHEN @branchb_workspaceid > 0 THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 'branch_b_fixture_users_exist' AS check_name,
       CONCAT_WS(',', @branchb_adminid, @branchb_teacherid, @branchb_studentid, @branchb_parentid) AS userids,
       CASE WHEN @branchb_adminid > 0
             AND @branchb_teacherid > 0
             AND @branchb_studentid > 0
             AND @branchb_parentid > 0
            THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 'branch_b_workspace_members' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE workspaceid = @branchb_workspaceid
   AND userid IN (@branchb_adminid, @branchb_teacherid, @branchb_studentid, @branchb_parentid)
   AND workspace_role IN ('admin', 'teacher', 'student', 'parent')
   AND status = 'active';

SELECT 'branch_b_class_group_workspaceid' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_class_group
 WHERE workspaceid = @branchb_workspaceid
   AND teacherid = @branchb_teacherid
   AND title = 'Huda Branch B SQA Functional Class'
   AND status IN ('open', 'active');

SELECT 'branch_b_live_session_workspaceid' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_live_session
 WHERE workspaceid = @branchb_workspaceid
   AND teacherid = @branchb_teacherid
   AND title = 'Huda Branch B SQA Functional Live Session'
   AND status = 'scheduled';

SELECT 'branch_b_owned_branch_link' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND g.status = 'active'
   AND gm.member_type = 'workspace'
   AND gm.memberid = @branchb_workspaceid
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active'
   AND LOWER(CONCAT(',', REPLACE(gm.access_scope, ' ', ''), ',')) LIKE '%,operations,%'
   AND COALESCE(gm.inherit_sensitive_access, 0) = 1;

SELECT 'institution_admin_two_owned_branches' AS check_name,
       COUNT(DISTINCT gw.memberid) AS manageable_owned_workspaces,
       CASE WHEN COUNT(DISTINCT gw.memberid) >= 2
              AND SUM(CASE WHEN gw.memberid = @huda_workspaceid THEN 1 ELSE 0 END) >= 1
              AND SUM(CASE WHEN gw.memberid = @branchb_workspaceid THEN 1 ELSE 0 END) >= 1
            THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gu
       ON gu.groupid = g.id
      AND gu.member_type = 'user'
      AND gu.memberid = @institution_adminid
      AND gu.group_role IN ('owner', 'admin')
      AND gu.status = 'active'
  JOIN mdlgx_local_prequran_org_group_member gw
       ON gw.groupid = g.id
      AND gw.member_type = 'workspace'
      AND gw.relationship_type = 'owned_branch'
      AND gw.status = 'active'
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND g.status = 'active'
   AND LOWER(CONCAT(',', REPLACE(gw.access_scope, ' ', ''), ',')) LIKE '%,operations,%'
   AND COALESCE(gw.inherit_sensitive_access, 0) = 1;

SELECT 'huda_admin_not_branch_b_admin' AS check_name,
       COUNT(*) AS branch_b_admin_memberships,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE workspaceid = @branchb_workspaceid
   AND userid = @school_adminid
   AND workspace_role IN ('owner', 'admin')
   AND status = 'active';

SELECT 'branch_b_admin_not_huda_admin' AS check_name,
       COUNT(*) AS huda_admin_memberships,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_workspace_member
 WHERE workspaceid = @huda_workspaceid
   AND userid = @branchb_adminid
   AND workspace_role IN ('owner', 'admin')
   AND status = 'active';

SELECT 'huda_teacher_no_branch_b_classes' AS check_name,
       COUNT(*) AS leaked_classes,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_class_group
 WHERE teacherid = @teacherid
   AND workspaceid = @branchb_workspaceid;

SELECT 'branch_b_teacher_no_huda_classes' AS check_name,
       COUNT(*) AS leaked_classes,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_class_group
 WHERE teacherid = @branchb_teacherid
   AND workspaceid = @huda_workspaceid;

SELECT 'franchise_workspace_resolved' AS check_name,
       @franchise_workspaceid AS workspaceid,
       CASE WHEN @franchise_workspaceid > 0 THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 'franchise_network_admin_exists' AS check_name,
       @franchise_adminid AS userid,
       CASE WHEN @franchise_adminid > 0 THEN 'PASS' ELSE 'FAIL' END AS status;

SELECT 'franchise_link_governance_only' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
 WHERE g.slug = 'franchise-schools'
   AND g.group_type = 'franchise_network'
   AND g.status = 'active'
   AND gm.member_type = 'workspace'
   AND gm.memberid = @franchise_workspaceid
   AND gm.relationship_type = 'franchise_member'
   AND gm.status = 'active'
   AND gm.access_scope = 'governance'
   AND COALESCE(gm.inherit_sensitive_access, 0) = 0;

SELECT 'franchise_admin_governance_membership' AS check_name,
       COUNT(*) AS matching_rows,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gu
       ON gu.groupid = g.id
      AND gu.member_type = 'user'
      AND gu.memberid = @franchise_adminid
      AND gu.group_role = 'admin'
      AND gu.status = 'active'
  JOIN mdlgx_local_prequran_org_group_member gw
       ON gw.groupid = g.id
      AND gw.member_type = 'workspace'
      AND gw.memberid = @franchise_workspaceid
      AND gw.relationship_type = 'franchise_member'
      AND gw.status = 'active'
 WHERE g.slug = 'franchise-schools'
   AND g.group_type = 'franchise_network'
   AND g.status = 'active'
   AND gw.access_scope = 'governance'
   AND COALESCE(gw.inherit_sensitive_access, 0) = 0;

SELECT 'institution_admin_not_franchise_manager' AS check_name,
       COUNT(*) AS owned_franchise_links,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  JOIN mdlgx_local_prequran_org_group_member gm ON gm.groupid = g.id
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND g.status = 'active'
   AND gm.member_type = 'workspace'
   AND gm.memberid = @franchise_workspaceid
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
