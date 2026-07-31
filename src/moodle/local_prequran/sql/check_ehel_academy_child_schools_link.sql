-- READ-ONLY. Diagnoses why the public_intake.php school-selection radio
-- buttons (K-12 / Languages) aren't appearing on app.ehelacademy.org.
-- pqh_org_group_child_schools() in local_hubredirect/accesslib.php requires
-- ALL of the following to line up:
--   1. app.ehelacademy.org resolves (via local_prequran_consumer_domain) to
--      the "Ehel Academy" parent consumer.
--   2. A local_prequran_org_group row exists with
--      parentconsumerid = Ehel Academy's id, group_type = 'owned_group',
--      status = 'active'.
--   3. local_prequran_org_group_member rows link that group to the two
--      school workspaces, with member_type = 'workspace',
--      relationship_type = 'owned_branch', status = 'active'.
--   4. Each school's local_prequran_consumer row has primaryworkspaceid
--      equal to the linked workspace id, and status = 'active'.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. What consumer does app.ehelacademy.org actually resolve to?
SELECT 'domain_resolution' AS check_name,
       d.domain, d.status AS domain_status, d.domain_type, d.isprimary,
       c.id AS consumerid, c.slug, c.name, c.status AS consumer_status,
       c.primaryworkspaceid
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer_domain d
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE d.domain IN ('app.ehelacademy.org', 'ehelacademy.org');

-- 2. All consumers with "ehel" in the name/slug, for reference.
SELECT 'ehel_consumers' AS check_name,
       id AS consumerid, slug, name, status, primaryworkspaceid
FROM ehelacad_quraantest.mdlgx_local_prequran_consumer
WHERE slug LIKE '%ehel%' OR name LIKE '%Ehel%'
ORDER BY id;

-- 3. Org groups owned by any of the above consumers.
SELECT 'org_groups' AS check_name,
       g.id AS groupid, g.slug, g.name, g.group_type, g.status,
       g.parentconsumerid, pc.name AS parent_name
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group g
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer pc ON pc.id = g.parentconsumerid
WHERE pc.slug LIKE '%ehel%' OR pc.name LIKE '%Ehel%'
ORDER BY g.id;

-- 4. Members linked into those groups.
SELECT 'org_group_members' AS check_name,
       gm.id AS memberrowid, gm.groupid, gm.member_type, gm.memberid AS workspaceid,
       gm.relationship_type, gm.status AS member_status,
       g.name AS group_name, g.group_type, g.status AS group_status
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group_member gm
JOIN ehelacad_quraantest.mdlgx_local_prequran_org_group g ON g.id = gm.groupid
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer pc ON pc.id = g.parentconsumerid
WHERE pc.slug LIKE '%ehel%' OR pc.name LIKE '%Ehel%'
ORDER BY gm.id;

-- 5. Does each linked workspaceid actually match a school consumer's
--    primaryworkspaceid (this is the join pqh_org_group_child_schools uses)?
SELECT 'workspace_to_school_consumer' AS check_name,
       gm.memberid AS linked_workspaceid,
       c.id AS school_consumerid, c.slug AS school_slug, c.name AS school_name,
       c.status AS school_status, c.primaryworkspaceid
FROM ehelacad_quraantest.mdlgx_local_prequran_org_group_member gm
JOIN ehelacad_quraantest.mdlgx_local_prequran_org_group g ON g.id = gm.groupid
JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer pc ON pc.id = g.parentconsumerid
LEFT JOIN ehelacad_quraantest.mdlgx_local_prequran_consumer c ON c.primaryworkspaceid = gm.memberid AND c.status = 'active'
WHERE pc.slug LIKE '%ehel%' OR pc.name LIKE '%Ehel%'
ORDER BY gm.id;
