-- READ-ONLY. Finds every workspace where all "active" workspace_member rows
-- actually point at Moodle accounts that are already deleted (the
-- local_prequran_workspace_member table isn't touched by delete_user(), so
-- these rows stay marked 'active' forever unless swept separately) -- the
-- same pattern found for Huda-school, Test Institute, and Somali University.
-- Also flags workspaces with zero members at all.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT
    w.id AS workspaceid,
    w.name,
    w.slug,
    w.status,
    COUNT(wm.id) AS active_member_rows,
    SUM(CASE WHEN u.deleted = 0 THEN 1 ELSE 0 END) AS still_live_accounts,
    SUM(CASE WHEN u.deleted = 1 THEN 1 ELSE 0 END) AS already_deleted_accounts
FROM mdlgx_local_prequran_workspace w
LEFT JOIN mdlgx_local_prequran_workspace_member wm ON wm.workspaceid = w.id AND wm.status = 'active'
LEFT JOIN mdlgx_user u ON u.id = wm.userid
GROUP BY w.id, w.name, w.slug, w.status
HAVING still_live_accounts = 0
ORDER BY w.id ASC;
