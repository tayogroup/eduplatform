-- Seed real institution-school operating records.
-- Edit the variables below before running. This script assumes real Moodle users and
-- real local_prequran_workspace rows already exist.
-- Use cleanup_institution_school_sqa_fixtures.sql first if SQA fixtures are still present.

SET @now := UNIX_TIMESTAMP();

-- Real institution-level users.
SET @owned_institution_admin_username := '';
SET @franchise_network_admin_username := '';

-- Parent consumer slugs for branding/default governance inheritance.
-- Owned branches inherit branding from @owned_institution_consumer_slug by default.
SET @owned_institution_consumer_slug := '';
SET @franchise_network_consumer_slug := '';

-- Real owned school workspace slugs. Leave blank when not used.
SET @owned_school_slug_1 := '';
SET @owned_school_slug_2 := '';
SET @owned_school_slug_3 := '';

-- Real independent franchise school workspace slugs. Leave blank when not used.
SET @franchise_school_slug_1 := '';
SET @franchise_school_slug_2 := '';
SET @franchise_school_slug_3 := '';

SET @owned_groupid := (
    SELECT id
      FROM mdlgx_local_prequran_org_group
     WHERE slug = 'owned-schools'
       AND status = 'active'
     LIMIT 1
);

SET @franchise_groupid := (
    SELECT id
      FROM mdlgx_local_prequran_org_group
     WHERE slug = 'franchise-schools'
       AND status = 'active'
     LIMIT 1
);

SET @owned_parentconsumerid := (
    SELECT id
      FROM mdlgx_local_prequran_consumer
     WHERE slug = @owned_institution_consumer_slug
       AND status = 'active'
     LIMIT 1
);

SET @franchise_parentconsumerid := (
    SELECT id
      FROM mdlgx_local_prequran_consumer
     WHERE slug = @franchise_network_consumer_slug
       AND status = 'active'
     LIMIT 1
);

INSERT INTO mdlgx_local_prequran_org_group (
    slug, name, group_type, parentconsumerid, status, policyjson, createdby, timecreated, timemodified
)
SELECT 'owned-schools',
       'Owned Schools',
       'owned_group',
       COALESCE(@owned_parentconsumerid, 0),
       'active',
       '{"model":"wholly_owned_schools","default_workspace_relationship":"owned_branch","default_access_scope":"operations","inherit_sensitive_access":true}',
       0,
       @now,
       @now
 WHERE @owned_groupid IS NULL;

INSERT INTO mdlgx_local_prequran_org_group (
    slug, name, group_type, parentconsumerid, status, policyjson, createdby, timecreated, timemodified
)
SELECT 'franchise-schools',
       'Franchise Schools',
       'franchise_network',
       COALESCE(@franchise_parentconsumerid, 0),
       'active',
       '{"model":"independent_franchise_schools","default_workspace_relationship":"franchise_member","default_access_scope":"governance","inherit_sensitive_access":false}',
       0,
       @now,
       @now
 WHERE @franchise_groupid IS NULL;

SET @owned_groupid := (
    SELECT id FROM mdlgx_local_prequran_org_group WHERE slug = 'owned-schools' AND status = 'active' LIMIT 1
);
SET @franchise_groupid := (
    SELECT id FROM mdlgx_local_prequran_org_group WHERE slug = 'franchise-schools' AND status = 'active' LIMIT 1
);

UPDATE mdlgx_local_prequran_org_group
   SET parentconsumerid = COALESCE(@owned_parentconsumerid, parentconsumerid),
       timemodified = @now
 WHERE id = @owned_groupid
   AND COALESCE(@owned_parentconsumerid, 0) > 0;

UPDATE mdlgx_local_prequran_org_group
   SET parentconsumerid = COALESCE(@franchise_parentconsumerid, parentconsumerid),
       timemodified = @now
 WHERE id = @franchise_groupid
   AND COALESCE(@franchise_parentconsumerid, 0) > 0;

SET @owned_adminid := (
    SELECT id FROM mdlgx_user WHERE username = @owned_institution_admin_username AND deleted = 0 LIMIT 1
);
SET @franchise_adminid := (
    SELECT id FROM mdlgx_user WHERE username = @franchise_network_admin_username AND deleted = 0 LIMIT 1
);

INSERT INTO mdlgx_local_prequran_org_group_member (
    groupid, member_type, memberid, relationship_type, group_role, access_scope,
    inherit_sensitive_access, status, notes, createdby, timecreated, timemodified
)
SELECT @owned_groupid,
       'user',
       @owned_adminid,
       'member',
       'admin',
       'governance,operations',
       1,
       'active',
       'Real institution admin for owned schools.',
       0,
       @now,
       @now
 WHERE COALESCE(@owned_groupid, 0) > 0
   AND COALESCE(@owned_adminid, 0) > 0
ON DUPLICATE KEY UPDATE
       access_scope = VALUES(access_scope),
       inherit_sensitive_access = VALUES(inherit_sensitive_access),
       status = 'active',
       notes = VALUES(notes),
       timemodified = @now;

INSERT INTO mdlgx_local_prequran_org_group_member (
    groupid, member_type, memberid, relationship_type, group_role, access_scope,
    inherit_sensitive_access, status, notes, createdby, timecreated, timemodified
)
SELECT @franchise_groupid,
       'user',
       @franchise_adminid,
       'member',
       'admin',
       'governance',
       0,
       'active',
       'Real franchise network admin.',
       0,
       @now,
       @now
 WHERE COALESCE(@franchise_groupid, 0) > 0
   AND COALESCE(@franchise_adminid, 0) > 0
ON DUPLICATE KEY UPDATE
       access_scope = VALUES(access_scope),
       inherit_sensitive_access = VALUES(inherit_sensitive_access),
       status = 'active',
       notes = VALUES(notes),
       timemodified = @now;

INSERT INTO mdlgx_local_prequran_org_group_member (
    groupid, member_type, memberid, relationship_type, group_role, access_scope,
    inherit_sensitive_access, status, notes, createdby, timecreated, timemodified
)
SELECT @owned_groupid,
       'workspace',
       w.id,
       'owned_branch',
       'member',
       'governance,operations',
       1,
       'active',
       'Real owned school branch.',
       0,
       @now,
       @now
  FROM mdlgx_local_prequran_workspace w
 WHERE w.slug IN (@owned_school_slug_1, @owned_school_slug_2, @owned_school_slug_3)
   AND w.slug <> ''
   AND w.status <> 'archived'
   AND COALESCE(@owned_groupid, 0) > 0
ON DUPLICATE KEY UPDATE
       relationship_type = VALUES(relationship_type),
       access_scope = VALUES(access_scope),
       inherit_sensitive_access = VALUES(inherit_sensitive_access),
       status = 'active',
       notes = VALUES(notes),
       timemodified = @now;

INSERT INTO mdlgx_local_prequran_org_group_member (
    groupid, member_type, memberid, relationship_type, group_role, access_scope,
    inherit_sensitive_access, status, notes, createdby, timecreated, timemodified
)
SELECT @franchise_groupid,
       'workspace',
       w.id,
       'franchise_member',
       'member',
       'governance',
       0,
       'active',
       'Real independent franchise school.',
       0,
       @now,
       @now
  FROM mdlgx_local_prequran_workspace w
 WHERE w.slug IN (@franchise_school_slug_1, @franchise_school_slug_2, @franchise_school_slug_3)
   AND w.slug <> ''
   AND w.status <> 'archived'
   AND COALESCE(@franchise_groupid, 0) > 0
ON DUPLICATE KEY UPDATE
       relationship_type = VALUES(relationship_type),
       access_scope = VALUES(access_scope),
       inherit_sensitive_access = VALUES(inherit_sensitive_access),
       status = 'active',
       notes = VALUES(notes),
       timemodified = @now;

SELECT 'real_owned_school_links' AS check_name,
       COUNT(*) AS linked_workspaces,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'CHECK: no owned school slugs were linked' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
 WHERE gm.groupid = @owned_groupid
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'owned_branch'
   AND gm.status = 'active';

SELECT 'owned_group_parent_branding' AS check_name,
       g.parentconsumerid,
       c.slug AS parent_consumer_slug,
       CASE WHEN COALESCE(g.parentconsumerid, 0) > 0 THEN 'PASS' ELSE 'CHECK: set @owned_institution_consumer_slug for owned-branch branding inheritance' END AS status
  FROM mdlgx_local_prequran_org_group g
  LEFT JOIN mdlgx_local_prequran_consumer c ON c.id = g.parentconsumerid
 WHERE g.id = @owned_groupid;

SELECT 'real_franchise_school_links' AS check_name,
       COUNT(*) AS linked_workspaces,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'CHECK: no franchise school slugs were linked' END AS status
  FROM mdlgx_local_prequran_org_group_member gm
 WHERE gm.groupid = @franchise_groupid
   AND gm.member_type = 'workspace'
   AND gm.relationship_type = 'franchise_member'
   AND gm.access_scope = 'governance'
   AND COALESCE(gm.inherit_sensitive_access, 0) = 0
   AND gm.status = 'active';
