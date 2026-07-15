-- Seed organization operating-model records directly in phpMyAdmin.
-- This script assumes the production prefix is mdlgx_. If your prefix differs,
-- replace mdlgx_ with the prefix shown in the verification queries.

SET @now := UNIX_TIMESTAMP();
SET @quraan_consumerid := COALESCE((
    SELECT id
      FROM mdlgx_local_prequran_consumer
     WHERE slug = 'quraan-academy'
     LIMIT 1
), 0);
SET @edu_consumerid := COALESCE((
    SELECT id
      FROM mdlgx_local_prequran_consumer
     WHERE slug = 'edu-for-tomorrow'
     LIMIT 1
), 0);

INSERT INTO mdlgx_local_prequran_org_group
    (slug, name, group_type, parentconsumerid, status, policyjson, createdby, timecreated, timemodified)
VALUES
    (
        'owned-schools',
        'Owned Schools',
        'owned_group',
        @quraan_consumerid,
        'active',
        '{"model":"wholly_owned_schools","default_workspace_relationship":"owned_branch","default_access_scope":"operations","inherit_sensitive_access":true}',
        0,
        @now,
        @now
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    group_type = VALUES(group_type),
    parentconsumerid = VALUES(parentconsumerid),
    status = VALUES(status),
    policyjson = VALUES(policyjson),
    timemodified = VALUES(timemodified);

INSERT INTO mdlgx_local_prequran_org_group
    (slug, name, group_type, parentconsumerid, status, policyjson, createdby, timecreated, timemodified)
VALUES
    (
        'franchise-schools',
        'Franchise Schools',
        'franchise_network',
        @edu_consumerid,
        'active',
        '{"model":"independent_franchise_schools","default_workspace_relationship":"franchise_member","default_access_scope":"governance","inherit_sensitive_access":false}',
        0,
        @now,
        @now
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    group_type = VALUES(group_type),
    parentconsumerid = VALUES(parentconsumerid),
    status = VALUES(status),
    policyjson = VALUES(policyjson),
    timemodified = VALUES(timemodified);

SELECT 'operating_model_groups_seeded' AS check_name,
       slug,
       name,
       group_type,
       parentconsumerid,
       status
  FROM mdlgx_local_prequran_org_group
 WHERE slug IN ('owned-schools', 'franchise-schools')
 ORDER BY slug;

-- Link each school workspace after confirming whether it is owned or franchise.
-- Replace the example workspace ids below before running either statement.
--
-- SET @owned_groupid := (SELECT id FROM mdlgx_local_prequran_org_group WHERE slug = 'owned-schools' LIMIT 1);
-- SET @franchise_groupid := (SELECT id FROM mdlgx_local_prequran_org_group WHERE slug = 'franchise-schools' LIMIT 1);
-- SET @owned_workspaceid := 123;
-- SET @franchise_workspaceid := 456;
--
-- INSERT INTO mdlgx_local_prequran_org_group_member
--     (groupid, member_type, memberid, relationship_type, group_role, access_scope, inherit_sensitive_access, status, notes, createdby, timecreated, timemodified)
-- VALUES
--     (@owned_groupid, 'workspace', @owned_workspaceid, 'owned_branch', 'member', 'operations', 1, 'active', 'Wholly owned school branch', 0, @now, @now)
-- ON DUPLICATE KEY UPDATE
--     relationship_type = VALUES(relationship_type),
--     access_scope = VALUES(access_scope),
--     inherit_sensitive_access = VALUES(inherit_sensitive_access),
--     status = VALUES(status),
--     notes = VALUES(notes),
--     timemodified = VALUES(timemodified);
--
-- INSERT INTO mdlgx_local_prequran_org_group_member
--     (groupid, member_type, memberid, relationship_type, group_role, access_scope, inherit_sensitive_access, status, notes, createdby, timecreated, timemodified)
-- VALUES
--     (@franchise_groupid, 'workspace', @franchise_workspaceid, 'franchise_member', 'member', 'governance', 0, 'active', 'Independent franchise school', 0, @now, @now)
-- ON DUPLICATE KEY UPDATE
--     relationship_type = VALUES(relationship_type),
--     access_scope = VALUES(access_scope),
--     inherit_sensitive_access = VALUES(inherit_sensitive_access),
--     status = VALUES(status),
--     notes = VALUES(notes),
--     timemodified = VALUES(timemodified);
