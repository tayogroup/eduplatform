-- READ-ONLY. Investigates two additional unexpected active "owner" rows
-- found on Ehel Languages (workspace 22, userid 1255) and Ehel K-12
-- (workspace 23, userid 1256) that turned up in the fix_ehel_schools_real_admin.sql
-- verification -- neither was known about or touched by any fix so far.
-- Given how close these ids are to 1214 ("Hana Pilot (G1)", a deleted pilot
-- account), checking whether these are more leftover pilot/test accounts
-- before deciding whether they need the same treatment.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

SELECT id, username, firstname, lastname, email, idnumber, auth,
       suspended, deleted, confirmed, timecreated
FROM ehelacad_quraantest.mdlgx_user
WHERE id IN (1255, 1256);

-- Every workspace where either holds any role, anywhere on the platform.
SELECT wm.userid, wm.workspaceid, w.name AS workspace_name,
       wm.workspace_role, wm.status, wm.notes, wm.timecreated
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace_member wm
JOIN ehelacad_quraantest.mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
WHERE wm.userid IN (1255, 1256)
ORDER BY wm.userid, wm.workspaceid;
