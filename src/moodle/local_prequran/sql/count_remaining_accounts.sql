-- READ-ONLY. Counts active (non-deleted) accounts remaining in the system
-- after the pilot/test account cleanup, both overall and broken down by
-- workspace role for context.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. Total active (non-deleted) accounts, excluding the built-in guest user (id 1).
SELECT COUNT(*) AS total_active_accounts
FROM mdlgx_user u
WHERE u.deleted = 0
  AND u.id > 1;

-- 2. Breakdown by workspace role (a person with multiple roles counts once
--    per role bucket; accounts with no active workspace membership show as
--    their own bucket).
SELECT
    COALESCE(wm.workspace_role, '(no active workspace membership)') AS workspace_role,
    COUNT(DISTINCT u.id) AS account_count
FROM mdlgx_user u
LEFT JOIN mdlgx_local_prequran_workspace_member wm ON wm.userid = u.id AND wm.status = 'active'
WHERE u.deleted = 0
  AND u.id > 1
GROUP BY wm.workspace_role
ORDER BY account_count DESC;

-- 3. Confirm the cleanup actually took -- should return 0 rows if the 53
--    pilot/test accounts were fully removed.
SELECT COUNT(*) AS remaining_pilot_test_accounts
FROM mdlgx_user u
JOIN mdlgx_local_prequran_workspace_member wm ON wm.userid = u.id AND wm.status = 'active'
WHERE u.deleted = 0
  AND wm.workspace_role IN ('student', 'teacher', 'assistant_teacher')
  AND (
        u.username LIKE '%pilot%'
     OR u.username LIKE 'qa-%'
     OR u.email LIKE '%@ehel.example.com'
     OR u.email LIKE '%@example.com'
  );
