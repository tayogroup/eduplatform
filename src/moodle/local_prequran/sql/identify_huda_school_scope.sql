-- READ-ONLY. Maps out everything connected to "Huda school" before any
-- deletion happens -- workspaces, consumers, domains, and org_group links.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Every workspace with "Huda" in the name.
SELECT 'huda_workspaces' AS check_name,
       id, name, slug, status, workspace_type, timecreated
FROM mdlgx_local_prequran_workspace
WHERE name LIKE '%Huda%'
ORDER BY id ASC;

-- 2. Every consumer (school/institution record) with "Huda" in the name,
--    plus which workspace is its primary one.
SELECT 'huda_consumers' AS check_name,
       id, name, slug, consumer_type, status, primaryworkspaceid
FROM mdlgx_local_prequran_consumer
WHERE name LIKE '%Huda%'
ORDER BY id ASC;

-- 3. Domains registered to any Huda consumer.
SELECT 'huda_domains' AS check_name,
       d.id, d.domain, d.domain_type, d.status, c.name AS consumer_name
FROM mdlgx_local_prequran_consumer_domain d
JOIN mdlgx_local_prequran_consumer c ON c.id = d.consumerid
WHERE c.name LIKE '%Huda%'
ORDER BY d.id ASC;

-- 4. Org group links involving any Huda workspace (parent/child school
--    relationships, e.g. Huda as a branch or franchise of another consumer).
SELECT 'huda_org_group_links' AS check_name,
       gm.id, gm.groupid, g.name AS group_name, g.parentconsumerid,
       pc.name AS parent_consumer_name, gm.member_type, gm.memberid, gm.relationship_type, gm.status
FROM mdlgx_local_prequran_org_group_member gm
JOIN mdlgx_local_prequran_org_group g ON g.id = gm.groupid
LEFT JOIN mdlgx_local_prequran_consumer pc ON pc.id = g.parentconsumerid
WHERE g.name LIKE '%Huda%'
   OR pc.name LIKE '%Huda%'
   OR gm.memberid IN (SELECT id FROM mdlgx_local_prequran_workspace WHERE name LIKE '%Huda%')
ORDER BY gm.id ASC;

-- 5. Every active member (any role) across all Huda workspaces, so we can
--    see exactly which accounts would need deleting alongside the workspace.
SELECT 'huda_workspace_members' AS check_name,
       wm.id, wm.workspaceid, w.name AS workspace_name, wm.userid, u.username, u.email,
       wm.workspace_role, wm.status
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
JOIN mdlgx_user u ON u.id = wm.userid
WHERE w.name LIKE '%Huda%'
ORDER BY wm.workspaceid ASC, wm.workspace_role ASC;

-- 6. Count of course offerings tied to any Huda workspace, for scale.
SELECT 'huda_course_offerings' AS check_name, COUNT(*) AS offering_count
FROM mdlgx_local_prequran_course_offering co
JOIN mdlgx_local_prequran_workspace w ON w.id = co.workspaceid
WHERE w.name LIKE '%Huda%';
