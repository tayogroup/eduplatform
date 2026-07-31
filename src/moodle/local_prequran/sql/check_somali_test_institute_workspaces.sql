-- READ-ONLY. Directly checks whether the "Somali University" and "Test
-- Institute" workspaces still exist, and whether they have any active
-- members left -- resolving why the earlier generic orphaned-workspace
-- query returned zero rows unexpectedly.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Do the workspace records still exist at all?
SELECT 'workspace_check' AS check_name,
       id, name, slug, status, workspace_type, timecreated
FROM mdlgx_local_prequran_workspace
WHERE name LIKE '%Somali University%'
   OR name LIKE '%Test Institute%';

-- 2. Any membership rows at all (active or not) for those workspaces.
SELECT 'member_check' AS check_name,
       wm.id, wm.workspaceid, w.name AS workspace_name, wm.userid, u.username,
       wm.workspace_role, wm.status
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
LEFT JOIN mdlgx_user u ON u.id = wm.userid
WHERE w.name LIKE '%Somali University%'
   OR w.name LIKE '%Test Institute%';

-- 3. Do su-admin / suadmin1 / test.institute.admin still exist as accounts?
SELECT 'account_check' AS check_name,
       id, username, email, deleted
FROM mdlgx_user
WHERE username IN ('su-admin', 'suadmin1', 'test.institute.admin');
