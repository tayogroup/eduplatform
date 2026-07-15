-- Verify organization operating-model records and school workspace links.
-- This is read-only and assumes the production prefix is mdlgx_.

SELECT 'owned_group_record' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group
 WHERE slug = 'owned-schools'
   AND group_type = 'owned_group'
   AND status = 'active';

SELECT 'franchise_network_record' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group
 WHERE slug = 'franchise-schools'
   AND group_type = 'franchise_network'
   AND status = 'active';

SELECT 'operating_model_groups' AS check_name,
       id,
       slug,
       name,
       group_type,
       parentconsumerid,
       status
  FROM mdlgx_local_prequran_org_group
 WHERE slug IN ('owned-schools', 'franchise-schools')
 ORDER BY slug;

SELECT 'operating_model_workspace_links' AS check_name,
       g.slug AS group_slug,
       g.group_type,
       gm.relationship_type,
       gm.access_scope,
       gm.inherit_sensitive_access,
       w.id AS workspaceid,
       w.name AS workspace_name,
       w.workspace_type,
       gm.status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
  LEFT JOIN mdlgx_local_prequran_workspace w
    ON w.id = gm.memberid
   AND gm.member_type = 'workspace'
 WHERE g.slug IN ('owned-schools', 'franchise-schools')
   AND gm.member_type = 'workspace'
 ORDER BY g.slug, w.name, gm.memberid;

SELECT 'operating_model_group_users' AS check_name,
       g.slug AS group_slug,
       gm.group_role,
       u.id AS userid,
       u.username,
       u.email,
       CONCAT(u.firstname, ' ', u.lastname) AS fullname,
       gm.status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
  JOIN mdlgx_user u
    ON u.id = gm.memberid
 WHERE g.slug IN ('owned-schools', 'franchise-schools')
   AND gm.member_type = 'user'
   AND gm.status = 'active'
   AND u.deleted = 0
 ORDER BY g.slug, gm.group_role, u.lastname, u.firstname;

SELECT 'operating_model_group_user_counts' AS check_name,
       g.slug AS group_slug,
       gm.group_role,
       COUNT(*) AS active_users
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
 WHERE g.slug IN ('owned-schools', 'franchise-schools')
   AND gm.member_type = 'user'
   AND gm.status = 'active'
 GROUP BY g.slug, gm.group_role
 ORDER BY g.slug, gm.group_role;

SELECT 'operating_model_mismatched_links' AS check_name,
       COUNT(*) AS bad_links,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
 WHERE gm.member_type = 'workspace'
   AND gm.status = 'active'
   AND (
       (g.slug = 'franchise-schools' AND gm.relationship_type = 'owned_branch')
       OR
       (g.slug = 'owned-schools' AND gm.relationship_type = 'franchise_member')
   );

SELECT 'owned_branch_link_count' AS check_name,
       COUNT(*) AS linked_workspaces
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
 WHERE g.slug = 'owned-schools'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active';

SELECT 'franchise_member_link_count' AS check_name,
       COUNT(*) AS linked_workspaces
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
 WHERE g.slug = 'franchise-schools'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'franchise_member'
   AND gm.status = 'active';
