-- READ-ONLY. Lists every active (non-deleted) account remaining in the
-- system after the full student/teacher/parent wipe, with their active
-- roles and workspaces (or NULL if they hold no active workspace
-- membership at all, e.g. a dangling test-fixture login).
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT
    u.id AS userid,
    u.username,
    u.email,
    u.idnumber AS account_no,
    CONCAT(u.firstname, ' ', u.lastname) AS full_name,
    GROUP_CONCAT(DISTINCT wm.workspace_role ORDER BY wm.workspace_role SEPARATOR ', ') AS roles,
    GROUP_CONCAT(DISTINCT w.name ORDER BY w.name SEPARATOR ' | ') AS workspaces
FROM mdlgx_user u
LEFT JOIN mdlgx_local_prequran_workspace_member wm ON wm.userid = u.id AND wm.status = 'active'
LEFT JOIN mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
WHERE u.deleted = 0
  AND u.id > 1
GROUP BY u.id, u.username, u.email, u.idnumber, u.firstname, u.lastname
ORDER BY roles ASC, u.username ASC;
