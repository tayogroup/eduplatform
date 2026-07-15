-- Verify institution-school access behavior.
-- This is read-only and assumes the production prefix is mdlgx_.

SELECT 'owned_branch_operational_links' AS check_name,
       COUNT(*) AS linked_workspaces,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'REVIEW' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
 WHERE g.slug = 'owned-schools'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active'
   AND gm.inherit_sensitive_access = 1
   AND (
       FIND_IN_SET('operations', REPLACE(gm.access_scope, ' ', '')) > 0
       OR FIND_IN_SET('audit', REPLACE(gm.access_scope, ' ', '')) > 0
   );

SELECT 'institution_owner_admin_manage_matrix' AS check_name,
       gu.group_role,
       u.id AS userid,
       u.username,
       u.email,
       CONCAT(u.firstname, ' ', u.lastname) AS fullname,
       w.id AS workspaceid,
       w.name AS workspace_name,
       wl.relationship_type,
       wl.access_scope,
       wl.inherit_sensitive_access,
       CASE
           WHEN gu.group_role IN ('owner', 'admin')
            AND wl.relationship_type = 'owned_branch'
            AND wl.inherit_sensitive_access = 1
            AND (
                FIND_IN_SET('operations', REPLACE(wl.access_scope, ' ', '')) > 0
                OR FIND_IN_SET('audit', REPLACE(wl.access_scope, ' ', '')) > 0
            )
           THEN 'CAN_MANAGE'
           ELSE 'NO_MANAGE'
       END AS expected_access
  FROM mdlgx_local_prequran_org_group_member gu
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gu.groupid
  JOIN mdlgx_user u
    ON u.id = gu.memberid
  JOIN mdlgx_local_prequran_org_group_member wl
    ON wl.groupid = g.id
   AND wl.member_type = 'workspace'
   AND wl.status = 'active'
  JOIN mdlgx_local_prequran_workspace w
    ON w.id = wl.memberid
 WHERE g.slug = 'owned-schools'
   AND gu.member_type = 'user'
   AND gu.status = 'active'
   AND gu.group_role IN ('owner', 'admin', 'auditor', 'support')
   AND u.deleted = 0
 ORDER BY gu.group_role, u.lastname, u.firstname, w.name;

SELECT 'school_workspace_direct_role_counts' AS check_name,
       w.id AS workspaceid,
       w.name AS workspace_name,
       wm.workspace_role,
       COUNT(*) AS active_users
  FROM mdlgx_local_prequran_workspace_member wm
  JOIN mdlgx_local_prequran_workspace w
    ON w.id = wm.workspaceid
 WHERE wm.status = 'active'
   AND w.status <> 'archived'
   AND wm.workspace_role IN ('admin', 'teacher', 'assistant_teacher', 'parent', 'student')
 GROUP BY w.id, w.name, wm.workspace_role
 ORDER BY w.name, wm.workspace_role;

SELECT 'school_staff_no_org_auto_manage' AS check_name,
       COUNT(*) AS school_staff_with_org_owner_admin,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'REVIEW_EXPLICIT_GROUP_ROLE' END AS status
  FROM mdlgx_local_prequran_workspace_member wm
  JOIN mdlgx_local_prequran_org_group_member wl
    ON wl.member_type = 'workspace'
   AND wl.memberid = wm.workspaceid
   AND wl.status = 'active'
  JOIN mdlgx_local_prequran_org_group_member gu
    ON gu.groupid = wl.groupid
   AND gu.member_type = 'user'
   AND gu.memberid = wm.userid
   AND gu.status = 'active'
 WHERE wm.status = 'active'
   AND wm.workspace_role IN ('admin', 'teacher', 'assistant_teacher', 'parent', 'student')
   AND gu.group_role IN ('owner', 'admin');

SELECT 'franchise_governance_only_default' AS check_name,
       COUNT(*) AS expanded_franchise_links,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'REVIEW_EXPLICIT_EXPANSION' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
 WHERE g.slug = 'franchise-schools'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'franchise_member'
   AND gm.status = 'active'
   AND (
       gm.inherit_sensitive_access = 1
       OR FIND_IN_SET('operations', REPLACE(gm.access_scope, ' ', '')) > 0
       OR FIND_IN_SET('audit', REPLACE(gm.access_scope, ' ', '')) > 0
       OR FIND_IN_SET('shared_support', REPLACE(gm.access_scope, ' ', '')) > 0
   );
