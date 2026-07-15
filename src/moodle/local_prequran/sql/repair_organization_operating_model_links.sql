-- Repair mismatched organization operating-model workspace links.
-- This script assumes the production prefix is mdlgx_. If your prefix differs,
-- replace mdlgx_ with the prefix shown by the verification queries.

SET @now := UNIX_TIMESTAMP();
SET @owned_groupid := (
    SELECT id
      FROM mdlgx_local_prequran_org_group
     WHERE slug = 'owned-schools'
     LIMIT 1
);
SET @franchise_groupid := (
    SELECT id
      FROM mdlgx_local_prequran_org_group
     WHERE slug = 'franchise-schools'
     LIMIT 1
);

SELECT 'mismatched_links_before_repair' AS check_name,
       g.slug AS group_slug,
       gm.id AS linkid,
       gm.memberid AS workspaceid,
       w.name AS workspace_name,
       gm.relationship_type,
       gm.access_scope,
       gm.inherit_sensitive_access,
       gm.status
  FROM mdlgx_local_prequran_org_group_member gm
  JOIN mdlgx_local_prequran_org_group g
    ON g.id = gm.groupid
  LEFT JOIN mdlgx_local_prequran_workspace w
    ON w.id = gm.memberid
   AND gm.member_type = 'workspace'
 WHERE gm.member_type = 'workspace'
   AND gm.status = 'active'
   AND (
       (g.slug = 'franchise-schools' AND gm.relationship_type = 'owned_branch')
       OR
       (g.slug = 'owned-schools' AND gm.relationship_type = 'franchise_member')
   )
 ORDER BY g.slug, gm.memberid;

-- Rows that say "owned_branch" but were placed under the franchise network
-- are moved into the owned-schools group.
INSERT INTO mdlgx_local_prequran_org_group_member
    (groupid, member_type, memberid, relationship_type, group_role, access_scope, inherit_sensitive_access, status, notes, createdby, timecreated, timemodified)
SELECT @owned_groupid,
       'workspace',
       gm.memberid,
       'owned_branch',
       gm.group_role,
       CASE
           WHEN FIND_IN_SET('operations', REPLACE(gm.access_scope, ' ', '')) > 0 THEN gm.access_scope
           WHEN gm.access_scope = '' THEN 'operations'
           ELSE CONCAT(gm.access_scope, ',operations')
       END,
       1,
       'active',
       CONCAT(TRIM(COALESCE(gm.notes, '')), CASE WHEN TRIM(COALESCE(gm.notes, '')) = '' THEN '' ELSE ' | ' END, 'Moved from franchise-schools because relationship_type was owned_branch.'),
       gm.createdby,
       gm.timecreated,
       @now
  FROM mdlgx_local_prequran_org_group_member gm
 WHERE gm.groupid = @franchise_groupid
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active'
ON DUPLICATE KEY UPDATE
    relationship_type = VALUES(relationship_type),
    access_scope = VALUES(access_scope),
    inherit_sensitive_access = VALUES(inherit_sensitive_access),
    status = 'active',
    notes = VALUES(notes),
    timemodified = VALUES(timemodified);

UPDATE mdlgx_local_prequran_org_group_member
   SET status = 'inactive',
       notes = CONCAT(TRIM(COALESCE(notes, '')), CASE WHEN TRIM(COALESCE(notes, '')) = '' THEN '' ELSE ' | ' END, 'Inactive after moving owned_branch to owned-schools.'),
       timemodified = @now
 WHERE groupid = @franchise_groupid
   AND member_type = 'workspace'
   AND relationship_type = 'owned_branch'
   AND status = 'active';

-- Rows that say "franchise_member" but were placed under owned-schools
-- are moved into the franchise-schools group.
INSERT INTO mdlgx_local_prequran_org_group_member
    (groupid, member_type, memberid, relationship_type, group_role, access_scope, inherit_sensitive_access, status, notes, createdby, timecreated, timemodified)
SELECT @franchise_groupid,
       'workspace',
       gm.memberid,
       'franchise_member',
       gm.group_role,
       CASE
           WHEN FIND_IN_SET('governance', REPLACE(gm.access_scope, ' ', '')) > 0 THEN gm.access_scope
           WHEN gm.access_scope = '' THEN 'governance'
           ELSE CONCAT('governance,', gm.access_scope)
       END,
       0,
       'active',
       CONCAT(TRIM(COALESCE(gm.notes, '')), CASE WHEN TRIM(COALESCE(gm.notes, '')) = '' THEN '' ELSE ' | ' END, 'Moved from owned-schools because relationship_type was franchise_member.'),
       gm.createdby,
       gm.timecreated,
       @now
  FROM mdlgx_local_prequran_org_group_member gm
 WHERE gm.groupid = @owned_groupid
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'franchise_member'
   AND gm.status = 'active'
ON DUPLICATE KEY UPDATE
    relationship_type = VALUES(relationship_type),
    access_scope = VALUES(access_scope),
    inherit_sensitive_access = VALUES(inherit_sensitive_access),
    status = 'active',
    notes = VALUES(notes),
    timemodified = VALUES(timemodified);

UPDATE mdlgx_local_prequran_org_group_member
   SET status = 'inactive',
       notes = CONCAT(TRIM(COALESCE(notes, '')), CASE WHEN TRIM(COALESCE(notes, '')) = '' THEN '' ELSE ' | ' END, 'Inactive after moving franchise_member to franchise-schools.'),
       timemodified = @now
 WHERE groupid = @owned_groupid
   AND member_type = 'workspace'
   AND relationship_type = 'franchise_member'
   AND status = 'active';

SELECT 'mismatched_links_after_repair' AS check_name,
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
