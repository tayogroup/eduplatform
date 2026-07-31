-- The "Recent Moodle Users" filter added earlier only excludes accounts that
-- are already an ACTIVE member of a different workspace. If Student01 /
-- kahin warsame / the ehel-pilot-t02/t03 accounts have NO workspace_member
-- row at all (true orphan test/QA accounts, never formally added to any
-- workspace), that filter would never hide them -- they'd keep showing up
-- as "unassigned candidates" on every school's page, which is the real bug.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT u.id, u.username, u.email,
       (SELECT COUNT(*) FROM mdlgx_local_prequran_workspace_member wm WHERE wm.userid = u.id) AS total_membership_rows,
       (SELECT COUNT(*) FROM mdlgx_local_prequran_workspace_member wm WHERE wm.userid = u.id AND wm.status = 'active') AS active_membership_rows
FROM mdlgx_user u
WHERE u.username IN ('qa-student01', 'qa-admin01', 'ehel-pilot-t02', 'ehel-pilot-t03')
ORDER BY u.id ASC;
