-- Ehel Languages owner expected to see exactly 3 users on their Workspace
-- Members table (2 deactivated + 1 active) but is apparently seeing more/
-- different accounts. Two possible causes:
--   1. The stray duplicate "Ehel Languages School" workspaces (ids 18-21)
--      found earlier this session were never actually archived, and members
--      got scattered across them instead of all landing on workspace 22.
--   2. Workspace 22's own member list genuinely has more rows than expected
--      (e.g. the original admin auto-created by the consumer wizard, on top
--      of the 3 the owner remembers creating by hand).
-- This checks both directly. Hardcoded to the real database
-- (ehelacad_quraantest); swap mdlgx_ for your real table prefix if different.

-- 1. Every workspace named "Ehel Languages School" and its current status.
SELECT 'ehel_languages_workspaces' AS check_name,
       id, name, slug, status, workspace_type, timecreated
FROM mdlgx_local_prequran_workspace
WHERE name LIKE '%Ehel Languages%'
ORDER BY id ASC;

-- 2. Every membership row across ALL of those workspace ids, so we can see
--    exactly where each created account actually landed.
SELECT 'ehel_languages_all_members' AS check_name,
       wm.id AS member_row_id,
       wm.workspaceid,
       w.status AS workspace_status,
       wm.userid,
       u.username,
       u.email,
       wm.workspace_role,
       wm.status AS member_status,
       wm.timecreated,
       wm.timemodified
FROM mdlgx_local_prequran_workspace_member wm
JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
JOIN mdlgx_user u ON u.id = wm.userid
WHERE w.name LIKE '%Ehel Languages%'
ORDER BY wm.workspaceid ASC, wm.timecreated ASC;
