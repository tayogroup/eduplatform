-- Verify institution branding inheritance setup.
-- This is read-only and assumes the production prefix is mdlgx_.

SELECT 'owned_group_has_parent_consumer' AS check_name,
       g.parentconsumerid,
       c.slug AS parent_consumer_slug,
       CASE WHEN COALESCE(g.parentconsumerid, 0) > 0 AND c.id IS NOT NULL THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group g
  LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = g.parentconsumerid AND c.status = 'active'
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND g.status = 'active';

SELECT 'owned_branch_branding_candidates' AS check_name,
       COUNT(*) AS owned_branch_links,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g ON g.id = gm.groupid
 WHERE g.slug = 'owned-schools'
   AND g.group_type = 'owned_group'
   AND COALESCE(g.parentconsumerid, 0) > 0
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active';

SELECT 'owned_branch_local_overrides' AS check_name,
       w.id AS workspaceid,
       w.name AS workspace_name,
       c.slug AS local_consumer_slug,
       CASE
           WHEN c.id IS NULL THEN 'inherits parent only'
           WHEN COALESCE(c.themejson, '') = '' THEN 'inherits parent theme'
           ELSE 'has local theme overrides'
       END AS branding_state
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g ON g.id = gm.groupid
  JOIN mdlgx_local_prequran_workspace w ON w.id = gm.memberid
  LEFT JOIN mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = w.id AND c.status = 'active'
 WHERE g.slug = 'owned-schools'
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active'
 ORDER BY w.name, w.id;

SELECT 'franchise_not_owned_inherited' AS check_name,
       COUNT(*) AS incorrect_links,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g ON g.id = gm.groupid
 WHERE gm.member_type = 'workspace'
   AND gm.relationship_type = 'franchise_member'
   AND g.slug = 'owned-schools'
   AND gm.status = 'active';
