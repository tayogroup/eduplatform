-- READ-ONLY. Investigates who Moodle user id 1214 actually is -- this is
-- the account I told the user to reuse as the "shared admin" for Ehel
-- Skills School, based on it already being the ownerid on the Ehel
-- Languages (workspace 22) and Ehel K-12 (workspace 23) workspaces before
-- this session touched anything. "Hana Pilot (G1)" / "Account No. pending
-- repair" suggests this may actually be a leftover pilot/test student
-- account rather than a real school administrator, which would mean the
-- existing K-12/Languages pattern I was matching was already wrong.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. The actual Moodle user record for id 1214.
SELECT id, username, firstname, lastname, email, idnumber, auth,
       suspended, deleted, confirmed, timecreated
FROM ehelacad_quraantest.mdlgx_user
WHERE id = 1214;

-- 2. Every workspace where 1214 holds a membership role, and every
--    workspace it owns outright -- confirms whether this really was the
--    pre-existing pattern across all three Ehel schools, or something new.
SELECT wm.workspaceid, w.name AS workspace_name, wm.workspace_role, wm.status,
       wm.notes, wm.timecreated
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace_member wm
JOIN ehelacad_quraantest.mdlgx_local_prequran_workspace w ON w.id = wm.workspaceid
WHERE wm.userid = 1214
ORDER BY wm.workspaceid, wm.workspace_role;

SELECT id AS workspaceid, name, slug, ownerid
FROM ehelacad_quraantest.mdlgx_local_prequran_workspace
WHERE ownerid = 1214;

-- 3. Its account-number / idnumber status, using the same repair-detection
--    logic as repair_random_5_digit_idnumbers.php, to understand what
--    "Account No. pending repair" actually means for this user.
SELECT id, idnumber, LENGTH(idnumber) AS idnumber_length
FROM ehelacad_quraantest.mdlgx_user
WHERE id = 1214;
